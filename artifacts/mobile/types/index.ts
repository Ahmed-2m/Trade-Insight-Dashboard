export interface Strategy {
  id: string;
  name: string;
  initialBalance: number;
  targetAmount: number;
  months: number;
  stagesCount: number;
  growthPerStage: number; // مثلاً 30%
  status: 'active' | 'completed' | 'archived';
  createdAt?: string;
}

export interface StrategyStage {
  id: string;
  strategyId: string;
  stageNumber: number;
  targetBalance: number;
  startingBalance: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // Monday, Tuesday, etc.
  pair: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  startingBalance: number;
  profitLoss: number;
  endingBalance: number;
  notes: string;
  strategy: string;
  timeframe: string;
  duration: string;
  screenshotUri?: string;
  createdAt: string;
  // حقول اختيارية للربط مع نظام الاستراتيجيات والمراحل الجديد في Supabase
  strategyId?: string;
  stageId?: string;
}

export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  bestDay: { date: string; profit: number } | null;
  worstDay: { date: string; profit: number } | null;
  longestWinStreak: number;
  longestLossStreak: number;
  averageDailyProfit: number;
  currentBalance: number;
  startingBalance: number;
  totalGrowth: number;
}

export interface CompletedStage {
  stageNumber: number;
  startDate: string;
  endDate: string;
  daysToComplete: number;
  tradingDays: number;
  startBalance: number;
  endBalance: number;
}

export interface DailyPnL {
  date: string;
  pnl: number;
  trades: number;
}

export interface BalancePoint {
  date: string;
  balance: number;
  tradeIndex: number;
}
