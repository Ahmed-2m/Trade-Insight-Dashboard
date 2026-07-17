import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTrades } from '@/context/TradesContext';
import { InsightCard } from '@/components/InsightCard';
import { getCurrentStage, getStageProgress } from '@/constants/stages';
import { Feather } from '@expo/vector-icons';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { stats, trades, completedStages } = useTrades();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const insights = useMemo(() => {
    const list: Array<{ type: 'success' | 'warning' | 'info' | 'danger'; title: string; description: string; icon?: any }> = [];

    if (trades.length === 0) {
      list.push({ type: 'info', title: 'Get Started', description: 'Add your first trade to unlock personalized insights and performance analytics.' });
      return list;
    }

    const currentBalance = stats.currentBalance;
    const stage = getCurrentStage(currentBalance);
    const progress = getStageProgress(currentBalance, stage);
    const remaining = stage.targetBalance - currentBalance;

    // Balance & stage
    if (progress >= 0.9) {
      list.push({ type: 'success', title: 'Almost There!', description: `You're ${(progress * 100).toFixed(0)}% through ${stage.label}. Only $${remaining.toFixed(2)} left to reach $${stage.targetBalance}!`, icon: 'zap' });
    } else if (progress >= 0.5) {
      list.push({ type: 'info', title: `Halfway Through ${stage.label}`, description: `$${remaining.toFixed(2)} remaining to reach your $${stage.targetBalance} target. Keep going!` });
    } else {
      list.push({ type: 'info', title: `Working on ${stage.label}`, description: `You're ${(progress * 100).toFixed(0)}% through this stage. Target: $${stage.targetBalance}. Remaining: $${remaining.toFixed(2)}.` });
    }

    // Win rate
    if (stats.totalTrades >= 5) {
      if (stats.winRate >= 60) {
        list.push({ type: 'success', title: 'Excellent Win Rate', description: `Your ${stats.winRate.toFixed(1)}% win rate is above average. Consistent performance like this compounds quickly.`, icon: 'trending-up' });
      } else if (stats.winRate >= 45) {
        list.push({ type: 'info', title: 'Solid Win Rate', description: `${stats.winRate.toFixed(1)}% win rate. Combine this with good risk:reward to maintain profitability.` });
      } else {
        list.push({ type: 'warning', title: 'Win Rate Needs Improvement', description: `Your win rate is ${stats.winRate.toFixed(1)}%. Focus on trade quality over quantity. Review your losing trades for patterns.`, icon: 'alert-triangle' });
      }
    }

    // Profit factor
    if (stats.totalTrades >= 5) {
      if (stats.profitFactor > 2) {
        list.push({ type: 'success', title: 'Strong Profit Factor', description: `Profit factor of ${stats.profitFactor.toFixed(2)}x — you're making more than twice what you lose. Exceptional edge.`, icon: 'award' });
      } else if (stats.profitFactor >= 1.2) {
        list.push({ type: 'info', title: 'Profitable System', description: `Profit factor: ${stats.profitFactor.toFixed(2)}x. You have a positive edge. Continue refining your strategy.` });
      } else if (stats.profitFactor < 1) {
        list.push({ type: 'danger', title: 'Negative Profit Factor', description: `Profit factor is ${stats.profitFactor.toFixed(2)}x — losses exceed profits. Review your exit strategy and risk management.`, icon: 'alert-circle' });
      }
    }

    // Streak warnings
    if (stats.longestLossStreak >= 4) {
      list.push({ type: 'warning', title: 'Watch for Revenge Trading', description: `You've had a ${stats.longestLossStreak}-trade losing streak in the past. During drawdowns, reduce position size and follow your plan strictly.` });
    }

    // Streak celebration
    if (stats.longestWinStreak >= 5) {
      list.push({ type: 'success', title: `${stats.longestWinStreak}-Trade Win Streak!`, description: `Impressive! Your longest winning streak is ${stats.longestWinStreak} consecutive trades. Stay disciplined — this is what consistency looks like.`, icon: 'star' });
    }

    // Estimated completion
    if (stats.averageDailyProfit > 0 && remaining > 0) {
      const daysEst = Math.ceil(remaining / stats.averageDailyProfit);
      list.push({ type: 'info', title: 'Stage Completion Estimate', description: `At your current average of $${stats.averageDailyProfit.toFixed(2)}/day, you'll complete ${stage.label} in ~${daysEst} trading days.`, icon: 'clock' });
    }

    // Completed stages milestone
    if (completedStages.length > 0) {
      const last = completedStages[completedStages.length - 1];
      list.push({ type: 'success', title: `${completedStages.length} Stage${completedStages.length > 1 ? 's' : ''} Completed!`, description: `Latest: ${last.startDate} → ${last.endDate} (${last.daysToComplete} days, ${last.tradingDays} trading days). Outstanding progress!`, icon: 'check-circle' });
    }

    // Trading frequency
    if (stats.totalTrades >= 10) {
      const avgPerDay = stats.totalTrades / Math.max(1, Object.keys(
        trades.reduce((acc, t) => { acc[t.date] = true; return acc; }, {} as Record<string, boolean>)
      ).length);
      if (avgPerDay > 5) {
        list.push({ type: 'warning', title: 'High Trading Frequency', description: `Averaging ${avgPerDay.toFixed(1)} trades/day. Overtrading can erode gains. Quality over quantity.` });
      }
    }

    // Net profit milestone
    if (stats.netProfit > 0 && stats.netProfit >= 50) {
      list.push({ type: 'success', title: `$${stats.netProfit.toFixed(2)} Net Profit`, description: `You're in profitable territory. Account growth: ${stats.totalGrowth.toFixed(2)}%. Every stage completed builds compounding momentum.`, icon: 'dollar-sign' });
    }

    return list;
  }, [stats, trades, completedStages]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          AI-generated based on your trading data
        </Text>
      </View>

      {/* Summary row */}
      {trades.length > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: stats.winRate >= 50 ? colors.profit : colors.loss }]}>
              {stats.winRate.toFixed(0)}%
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Win Rate</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.profit }]}>{stats.winningTrades}W</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Wins</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.loss }]}>{stats.losingTrades}L</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Losses</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{stats.totalTrades}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
        </View>
      )}

      <View style={styles.insightsList}>
        {insights.map((insight, i) => (
          <InsightCard key={i} type={insight.type} title={insight.title} description={insight.description} icon={insight.icon} />
        ))}
      </View>

      {trades.length === 0 && (
        <View style={styles.empty}>
          <Feather name="zap" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No insights yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Add trades to unlock personalized analytics</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4 },
  summaryRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  summaryDivider: { width: 1, marginHorizontal: 4 },
  insightsList: { paddingHorizontal: 16, marginTop: 8 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyDesc: { fontSize: 13, textAlign: 'center' },
});
