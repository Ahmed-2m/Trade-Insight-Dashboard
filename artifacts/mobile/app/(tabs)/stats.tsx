import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTrades } from '@/context/TradesContext';
import { StatCard } from '@/components/StatCard';
import { PieChart } from '@/components/charts/PieChart';
import { BarChart } from '@/components/charts/BarChart';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const { stats, dailyPnL, completedStages } = useTrades();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const formatCurrency = (v: number) => `$${Math.abs(v).toFixed(2)}`;
  const formatPct = (v: number) => `${v.toFixed(1)}%`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text style={[styles.title, { color: colors.foreground }, isRTL && styles.rtl]}>
          {t.tabs.statistics}
        </Text>
      </View>

      {/* Win/Loss Overview */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
          {isRTL ? 'نظرة عامة على الصفقات' : 'Win / Loss Overview'}
        </Text>
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }, isRTL && styles.rowReverse]}>
          <PieChart wins={stats.winningTrades} losses={stats.losingTrades} size={110} />
          <View style={styles.overviewStats}>
            <View style={[styles.overviewRow, isRTL && styles.rowReverse]}>
              <View style={[styles.dot, { backgroundColor: colors.profit }]} />
              <Text style={[styles.overviewLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                {t.dashboard.winning}
              </Text>
              <Text style={[styles.overviewVal, { color: colors.foreground }]}>{stats.winningTrades}</Text>
            </View>
            <View style={[styles.overviewRow, isRTL && styles.rowReverse]}>
              <View style={[styles.dot, { backgroundColor: colors.loss }]} />
              <Text style={[styles.overviewLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                {t.dashboard.losing}
              </Text>
              <Text style={[styles.overviewVal, { color: colors.foreground }]}>{stats.losingTrades}</Text>
            </View>
            <View style={[styles.overviewRow, isRTL && styles.rowReverse]}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.overviewLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                {t.dashboard.winRate}
              </Text>
              <Text style={[styles.overviewVal, { color: colors.primary }]}>{formatPct(stats.winRate)}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={[styles.overviewRow, isRTL && styles.rowReverse]}>
              <Text style={[styles.overviewLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                {isRTL ? 'الإجمالي' : 'Total'}
              </Text>
              <Text style={[styles.overviewVal, { color: colors.foreground }]}>{stats.totalTrades}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* P&L Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
          {isRTL ? 'الربح والخسارة' : 'Profit & Loss'}
        </Text>

        <View style={[styles.grid, isRTL && styles.rowReverse]}>
          <StatCard label={t.dashboard.netPnl} value={`${stats.netProfit >= 0 ? '+' : ''}$${stats.netProfit.toFixed(2)}`} icon="trending-up" color={stats.netProfit >= 0 ? colors.profit : colors.loss} />
          <StatCard label={t.dashboard.profitFactor} value={stats.profitFactor === 99.99 ? '∞' : stats.profitFactor.toFixed(2)} icon="activity" color={colors.primary} />
        </View>

        <View style={[styles.grid, isRTL && styles.rowReverse]}>
          <StatCard label={isRTL ? 'إجمالي الأرباح' : 'Total Profit'} value={formatCurrency(stats.totalProfit)} icon="arrow-up-circle" color={colors.profit} />
          <StatCard label={isRTL ? 'إجمالي الخسائر' : 'Total Loss'} value={formatCurrency(stats.totalLoss)} icon="arrow-down-circle" color={colors.loss} />
        </View>

        <View style={[styles.grid, isRTL && styles.rowReverse]}>
          <StatCard label={isRTL ? 'متوسط الربح' : 'Avg Profit'} value={formatCurrency(stats.averageProfit)} icon="plus" color={colors.profit} />
          <StatCard label={isRTL ? 'متوسط الخسارة' : 'Avg Loss'} value={formatCurrency(stats.averageLoss)} icon="minus" color={colors.loss} />
        </View>

        <View style={[styles.grid, isRTL && styles.rowReverse]}>
          <StatCard label={isRTL ? 'أكبر ربح' : 'Largest Win'} value={formatCurrency(stats.largestWin)} icon="award" color={colors.profit} />
          <StatCard label={isRTL ? 'أكبر خسارة' : 'Largest Loss'} value={formatCurrency(stats.largestLoss)} icon="alert-circle" color={colors.loss} />
        </View>

        <View style={[styles.grid, isRTL && styles.rowReverse]}>
          <StatCard label={isRTL ? 'المتوسط اليومي' : 'Daily Avg P&L'} value={`${stats.averageDailyProfit >= 0 ? '+' : ''}$${stats.averageDailyProfit.toFixed(2)}`} icon="calendar" color={colors.primary} />
          <StatCard label={isRTL ? 'نمو الحساب' : 'Account Growth'} value={`${stats.totalGrowth >= 0 ? '+' : ''}${stats.totalGrowth.toFixed(2)}%`} icon="percent" color={stats.totalGrowth >= 0 ? colors.profit : colors.loss} />
        </View>
      </View>

      {/* Streaks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
          {isRTL ? 'السلاسل المتتالية' : 'Streaks'}
        </Text>
        <View style={[styles.grid, isRTL && styles.rowReverse]}>
          <StatCard label={isRTL ? 'أطول سلسلة أرباح' : 'Longest Win Streak'} value={`${stats.longestWinStreak} ${isRTL ? 'صفقات' : 'trades'}`} icon="zap" color={colors.profit} />
          <StatCard label={isRTL ? 'أطول سلسلة خسائر' : 'Longest Loss Streak'} value={`${stats.longestLossStreak} ${isRTL ? 'صفقات' : 'trades'}`} icon="zap-off" color={colors.loss} />
        </View>
      </View>

      {/* Best/Worst Days */}
      {(stats.bestDay || stats.worstDay) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
            {isRTL ? 'أفضل وأسوأ الأيام' : 'Best & Worst Days'}
          </Text>
          <View style={[styles.grid, isRTL && styles.rowReverse]}>
            {stats.bestDay && (
              <StatCard
                label={isRTL ? 'أفضل يوم' : 'Best Day'}
                value={`+$${stats.bestDay.profit.toFixed(2)}`}
                icon="sun"
                color={colors.profit}
                subtitle={stats.bestDay.date}
              />
            )}
            {stats.worstDay && (
              <StatCard
                label={isRTL ? 'أسوأ يوم' : 'Worst Day'}
                value={`-$${Math.abs(stats.worstDay.profit).toFixed(2)}`}
                icon="cloud-rain"
                color={colors.loss}
                subtitle={stats.worstDay.date}
              />
            )}
          </View>
        </View>
      )}

      {/* Daily P&L Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
          {isRTL ? 'الربح/الخسارة اليومي' : 'Daily P&L'}
        </Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BarChart data={dailyPnL} width={CHART_W - 32} height={130} />
        </View>
      </View>

      {/* Completed Stages */}
      {completedStages.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
            {isRTL ? 'المراحل المكتملة' : 'Completed Stages'}
          </Text>
          {completedStages.map((s) => (
            <View key={s.stageNumber} style={[styles.stageRow, { backgroundColor: colors.card, borderColor: colors.border }, isRTL && styles.rowReverse]}>
              <View style={[styles.stageBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.stageBadgeText, { color: colors.primary }]}>S{s.stageNumber}</Text>
              </View>
              <View style={styles.stageInfo}>
                <Text style={[styles.stageTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
                  {t.common.stage} {s.stageNumber}
                </Text>
                <Text style={[styles.stageDates, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                  {s.startDate} ← {s.endDate}
                </Text>
              </View>
              <View style={styles.stageRight}>
                <Text style={[styles.stageDays, { color: colors.foreground }]}>{s.daysToComplete}{isRTL ? 'ي' : 'd'}</Text>
                <Text style={[styles.stageDaysLabel, { color: colors.mutedForeground }]}>
                  {isRTL ? 'الإجمالي' : 'total'}
                </Text>
              </View>
              <View style={styles.stageRight}>
                <Text style={[styles.stageDays, { color: colors.profit }]}>{s.tradingDays}</Text>
                <Text style={[styles.stageDaysLabel, { color: colors.mutedForeground }]}>
                  {isRTL ? 'تداول' : 'trading'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { paddingHorizontal: 16, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  overviewCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  overviewStats: { flex: 1, gap: 8 },
  overviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  overviewLabel: { flex: 1, fontSize: 13 },
  overviewVal: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 4 },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chartCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  stageBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stageBadgeText: { fontSize: 12, fontWeight: '800' },
  stageInfo: { flex: 1 },
  stageTitle: { fontSize: 14, fontWeight: '700' },
  stageDates: { fontSize: 11, marginTop: 2 },
  stageRight: { alignItems: 'center', minWidth: 36 },
  stageDays: { fontSize: 15, fontWeight: '700' },
  stageDaysLabel: { fontSize: 10 },
  rowReverse: { flexDirection: 'row-reverse' },
  rtl: { textAlign: 'right' },
});
