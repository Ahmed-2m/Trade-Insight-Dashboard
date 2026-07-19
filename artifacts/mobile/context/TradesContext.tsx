import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trade, TradeStats, CompletedStage, DailyPnL, BalancePoint } from '@/types';
import { Stage, STAGES, generateDynamicStages } from '@/constants/stages';
import { api } from '@/lib/api';

const TRADES_KEY = '@trading_journal_trades';
const COMPLETED_STAGES_KEY = '@trading_journal_completed_stages';
const INITIAL_BALANCE_KEY = '@trading_journal_initial_balance';
const STRATEGIES_KEY = '@trading_journal_strategies';

interface TradesContextType {
  trades: Trade[];
  completedStages: CompletedStage[];
  initialBalance: number;
  stages: Stage[];
  strategies: string[];
  stats: TradeStats;
  dailyPnL: DailyPnL[];
  balanceHistory: BalancePoint[];
  isLoading: boolean;
  isSignedIn: boolean;
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt'>) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  setInitialBalance: (balance: number) => Promise<void>;
  getTrade: (id: string) => Trade | undefined;
  addStrategy: (name: string) => Promise<void>;
  removeStrategy: (name: string) => Promise<void>;
  /** Called by ClerkBridge to trigger cloud sync when user signs in */
  onAuthChange: (signedIn: boolean) => void;
}

const defaultStats: TradeStats = {
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0,
  totalProfit: 0,
  totalLoss: 0,
  netProfit: 0,
  averageProfit: 0,
  averageLoss: 0,
  profitFactor: 0,
  largestWin: 0,
  largestLoss: 0,
  bestDay: null,
  worstDay: null,
  longestWinStreak: 0,
  longestLossStreak: 0,
  averageDailyProfit: 0,
  currentBalance: 0,
  startingBalance: 0,
  totalGrowth: 0,
};

const TradesContext = createContext<TradesContextType>({
  trades: [],
  completedStages: [],
  initialBalance: 0,
  stages: STAGES,
  strategies: [],
  stats: defaultStats,
  dailyPnL: [],
  balanceHistory: [],
  isLoading: true,
  isSignedIn: false,
  addTrade: async () => {},
  updateTrade: async () => {},
  deleteTrade: async () => {},
  setInitialBalance: async () => {},
  getTrade: () => undefined,
  addStrategy: async () => {},
  removeStrategy: async () => {},
  onAuthChange: () => {},
});

function computeStats(trades: Trade[], initialBalance: number): TradeStats {
  if (trades.length === 0) {
    return { ...defaultStats, currentBalance: initialBalance, startingBalance: initialBalance };
  }
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const winning = sorted.filter((t) => t.profitLoss > 0);
  const losing = sorted.filter((t) => t.profitLoss < 0);
  const totalProfit = winning.reduce((s, t) => s + t.profitLoss, 0);
  const totalLoss = Math.abs(losing.reduce((s, t) => s + t.profitLoss, 0));
  const netProfit = sorted.reduce((s, t) => s + t.profitLoss, 0);
  const currentBalance = sorted[sorted.length - 1].endingBalance;
  const startingBalance = sorted[0].startingBalance;
  let longestWinStreak = 0, longestLossStreak = 0, curWin = 0, curLoss = 0;
  for (const t of sorted) {
    if (t.profitLoss > 0) { curWin++; curLoss = 0; longestWinStreak = Math.max(longestWinStreak, curWin); }
    else if (t.profitLoss < 0) { curLoss++; curWin = 0; longestLossStreak = Math.max(longestLossStreak, curLoss); }
    else { curWin = 0; curLoss = 0; }
  }
  const dailyMap: Record<string, number> = {};
  for (const t of sorted) { dailyMap[t.date] = (dailyMap[t.date] || 0) + t.profitLoss; }
  const days = Object.entries(dailyMap);
  const tradingDays = days.length;
  const bestDayEntry = days.reduce((a, b) => b[1] > a[1] ? b : a, ['', -Infinity]);
  const worstDayEntry = days.reduce((a, b) => b[1] < a[1] ? b : a, ['', Infinity]);
  const profitFactor = totalLoss === 0 ? (totalProfit > 0 ? Infinity : 0) : totalProfit / totalLoss;
  const largestWin = winning.length ? Math.max(...winning.map((t) => t.profitLoss)) : 0;
  const largestLoss = losing.length ? Math.abs(Math.min(...losing.map((t) => t.profitLoss))) : 0;
  return {
    totalTrades: sorted.length, winningTrades: winning.length, losingTrades: losing.length,
    winRate: sorted.length ? (winning.length / sorted.length) * 100 : 0,
    totalProfit, totalLoss, netProfit,
    averageProfit: winning.length ? totalProfit / winning.length : 0,
    averageLoss: losing.length ? totalLoss / losing.length : 0,
    profitFactor: isFinite(profitFactor) ? profitFactor : 99.99,
    largestWin, largestLoss,
    bestDay: bestDayEntry[0] ? { date: bestDayEntry[0], profit: bestDayEntry[1] as number } : null,
    worstDay: worstDayEntry[0] ? { date: worstDayEntry[0], profit: worstDayEntry[1] as number } : null,
    longestWinStreak, longestLossStreak,
    averageDailyProfit: tradingDays ? netProfit / tradingDays : 0,
    currentBalance, startingBalance,
    totalGrowth: startingBalance ? ((currentBalance - startingBalance) / startingBalance) * 100 : 0,
  };
}

function computeDailyPnL(trades: Trade[]): DailyPnL[] {
  const map: Record<string, DailyPnL> = {};
  for (const t of trades) {
    if (!map[t.date]) map[t.date] = { date: t.date, pnl: 0, trades: 0 };
    map[t.date].pnl += t.profitLoss;
    map[t.date].trades += 1;
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

function computeBalanceHistory(trades: Trade[], initialBalance: number): BalancePoint[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const points: BalancePoint[] = [{ date: sorted[0]?.date ?? new Date().toISOString().split('T')[0], balance: initialBalance, tradeIndex: -1 }];
  for (let i = 0; i < sorted.length; i++) {
    points.push({ date: sorted[i].date, balance: sorted[i].endingBalance, tradeIndex: i });
  }
  return points;
}

function detectCompletedStages(trades: Trade[], stages: Stage[]): CompletedStage[] {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const completed: CompletedStage[] = [];
  for (const stage of stages) {
    const completingTrade = sorted.find((t) => t.endingBalance >= stage.targetBalance);
    if (!completingTrade) continue;
    const startingTrade = sorted.find((t) => t.startingBalance >= stage.startBalance) ?? sorted[0];
    const startDate = startingTrade?.date ?? completingTrade.date;
    const endDate = completingTrade.date;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysToComplete = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const tradeDates = new Set(sorted.filter((t) => t.date >= startDate && t.date <= endDate).map((t) => t.date));
    completed.push({ stageNumber: stage.number, startDate, endDate, daysToComplete, tradingDays: tradeDates.size, startBalance: stage.startBalance, endBalance: stage.targetBalance });
  }
  return completed.sort((a, b) => a.stageNumber - b.stageNumber);
}

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [initialBalance, setInitialBalanceState] = useState(0);
  const [strategiesState, setStrategiesState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const [tradesJson, balanceStr, strategiesJson] = await Promise.all([
          AsyncStorage.getItem(TRADES_KEY),
          AsyncStorage.getItem(INITIAL_BALANCE_KEY),
          AsyncStorage.getItem(STRATEGIES_KEY),
        ]);
        if (tradesJson) setTrades(JSON.parse(tradesJson));
        if (balanceStr) setInitialBalanceState(parseFloat(balanceStr));
        if (strategiesJson) setStrategiesState(JSON.parse(strategiesJson));
      } catch (e) {
        console.error('Error loading data:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Called by ClerkBridge when auth state changes
  const onAuthChange = useCallback(async (signedIn: boolean) => {
    setIsSignedIn(signedIn);
    if (!signedIn) return;

    // Fetch from cloud and merge
    try {
      const [cloudProfile, cloudTrades, cloudStrategies] = await Promise.all([
        api.getProfile(),
        api.getTrades(),
        api.getStrategies(),
      ]);

      const mergedBalance: number = (cloudProfile?.initialBalance ?? 0) > 0
        ? cloudProfile.initialBalance
        : (await AsyncStorage.getItem(INITIAL_BALANCE_KEY).then(v => v ? parseFloat(v) : 0));
      const mergedTrades: Trade[] = (cloudTrades?.length > 0)
        ? cloudTrades
        : JSON.parse((await AsyncStorage.getItem(TRADES_KEY)) ?? '[]');
      const mergedStrategies: string[] = (cloudStrategies?.length > 0)
        ? cloudStrategies
        : JSON.parse((await AsyncStorage.getItem(STRATEGIES_KEY)) ?? '[]');

      setInitialBalanceState(mergedBalance);
      setTrades(mergedTrades);
      setStrategiesState(mergedStrategies);

      await Promise.all([
        AsyncStorage.setItem(INITIAL_BALANCE_KEY, mergedBalance.toString()),
        AsyncStorage.setItem(TRADES_KEY, JSON.stringify(mergedTrades)),
        AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(mergedStrategies)),
      ]);
    } catch (err) {
      // Cloud unavailable — use local data already loaded
      console.warn('Cloud sync failed, using local data:', err);
    }
  }, []);

  const stages = useMemo(
    () => (initialBalance > 0 ? generateDynamicStages(initialBalance) : STAGES),
    [initialBalance],
  );

  const completedStages = useMemo(
    () => (trades.length > 0 ? detectCompletedStages(trades, stages) : []),
    [trades, stages],
  );

  const persistTrades = useCallback(async (newTrades: Trade[]) => {
    await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(newTrades));
    await AsyncStorage.removeItem(COMPLETED_STAGES_KEY);
  }, []);

  const addTrade = useCallback(async (trade: Omit<Trade, 'id' | 'createdAt'>) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const newTrades = [...trades, newTrade];
    setTrades(newTrades);
    await persistTrades(newTrades);
    if (isSignedIn) api.postTrade(newTrade).catch(() => {});
  }, [trades, persistTrades, isSignedIn]);

  const updateTrade = useCallback(async (id: string, updates: Partial<Trade>) => {
    const newTrades = trades.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTrades(newTrades);
    await persistTrades(newTrades);
    if (isSignedIn) {
      const updated = newTrades.find((t) => t.id === id);
      if (updated) api.putTrade(id, updated).catch(() => {});
    }
  }, [trades, persistTrades, isSignedIn]);

  const deleteTrade = useCallback(async (id: string) => {
    const newTrades = trades.filter((t) => t.id !== id);
    setTrades(newTrades);
    await persistTrades(newTrades);
    if (isSignedIn) api.deleteTrade(id).catch(() => {});
  }, [trades, persistTrades, isSignedIn]);

  const setInitialBalance = useCallback(async (balance: number) => {
    setInitialBalanceState(balance);
    await AsyncStorage.setItem(INITIAL_BALANCE_KEY, balance.toString());
    if (isSignedIn) api.putProfile({ initialBalance: balance, language: 'ar' }).catch(() => {});
  }, [isSignedIn]);

  const getTrade = useCallback((id: string) => trades.find((t) => t.id === id), [trades]);

  const addStrategy = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || strategiesState.includes(trimmed)) return;
    const next = [...strategiesState, trimmed];
    setStrategiesState(next);
    await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(next));
    if (isSignedIn) api.postStrategy(trimmed).catch(() => {});
  }, [strategiesState, isSignedIn]);

  const removeStrategy = useCallback(async (name: string) => {
    const next = strategiesState.filter((s) => s !== name);
    setStrategiesState(next);
    await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(next));
    if (isSignedIn) api.deleteStrategy(name).catch(() => {});
  }, [strategiesState, isSignedIn]);

  const stats = useMemo(() => computeStats(trades, initialBalance), [trades, initialBalance]);
  const dailyPnL = useMemo(() => computeDailyPnL(trades), [trades]);
  const balanceHistory = useMemo(
    () => (trades.length > 0 ? computeBalanceHistory(trades, initialBalance) : []),
    [trades, initialBalance],
  );

  return (
    <TradesContext.Provider value={{
      trades, completedStages, initialBalance, stages, strategies: strategiesState,
      stats, dailyPnL, balanceHistory, isLoading, isSignedIn,
      addTrade, updateTrade, deleteTrade, setInitialBalance, getTrade,
      addStrategy, removeStrategy, onAuthChange,
    }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTrades() {
  return useContext(TradesContext);
}
