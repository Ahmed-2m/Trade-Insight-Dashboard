import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Platform, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTrades } from '@/context/TradesContext';
import { StageProgressCard } from '@/components/StageProgressCard';
import { LineChart } from '@/components/charts/LineChart';
import { StatCard } from '@/components/StatCard';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { stats, completedStages, balanceHistory, trades, isLoading } = useTrades();
  const [refreshing, setRefreshing] = React.useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const isPositive = stats.netProfit >= 0;
  const currentBalance = stats.currentBalance > 0 || trades.length > 0
    ? stats.currentBalance
    : stats.startingBalance;

  const growthPct = stats.totalGrowth;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Trading Journal</Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Dashboard</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/trade/new')}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Balance Hero Card */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>Account Balance</Text>
          <View style={[styles.growthBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Feather name={growthPct >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#fff" />
            <Text style={styles.growthText}>{growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%</Text>
          </View>
        </View>
        <Text style={styles.heroBalance}>${currentBalance.toFixed(2)}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Net P&L</Text>
            <Text style={[styles.heroStatValue, { color: isPositive ? '#7EF5C4' : '#FFA5B4' }]}>
              {isPositive ? '+' : ''}${stats.netProfit.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Win Rate</Text>
            <Text style={styles.heroStatValue}>{stats.winRate.toFixed(1)}%</Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Total Trades</Text>
            <Text style={styles.heroStatValue}>{stats.totalTrades}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Stage Progress */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stage Progress</Text>
        <StageProgressCard balance={currentBalance} completedStages={completedStages} />
      </View>

      {/* Quick Stats Row */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Winning"
            value={`${stats.winningTrades}`}
            icon="check-circle"
            color={colors.profit}
          />
          <StatCard
            label="Losing"
            value={`${stats.losingTrades}`}
            icon="x-circle"
            color={colors.loss}
          />
          <StatCard
            label="Profit Factor"
            value={stats.profitFactor === 99.99 ? '∞' : stats.profitFactor.toFixed(2)}
            icon="activity"
            color={colors.primary}
          />
        </View>
      </View>

      {/* Balance Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Balance Growth</Text>
        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LineChart data={balanceHistory} width={CHART_W - 32} height={140} />
        </View>
      </View>

      {/* Recent Trades */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Trades</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {trades.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="book-open" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No trades yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Add your first trade to start tracking</Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/trade/new')}
            >
              <Text style={styles.emptyBtnText}>Add First Trade</Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...trades]
            .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
            .slice(0, 3)
            .map((trade) => {
              const isProfit = trade.profitLoss >= 0;
              return (
                <TouchableOpacity
                  key={trade.id}
                  style={[styles.recentTrade, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/trade/${trade.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.recentDot, { backgroundColor: isProfit ? colors.profit : colors.loss }]} />
                  <View style={styles.recentInfo}>
                    <Text style={[styles.recentPair, { color: colors.foreground }]}>{trade.pair}</Text>
                    <Text style={[styles.recentDate, { color: colors.mutedForeground }]}>{trade.date} · {trade.direction.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.recentPnl, { color: isProfit ? colors.profit : colors.loss }]}>
                    {isProfit ? '+' : ''}{trade.profitLoss.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  greeting: { fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  growthText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroBalance: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 16 },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 3 },
  heroStatValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroDivider: { width: 1, height: 28 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  chartCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  emptyCard: { borderRadius: 16, padding: 24, borderWidth: 1, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyDesc: { fontSize: 13, textAlign: 'center' },
  emptyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  recentTrade: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  recentDot: { width: 8, height: 8, borderRadius: 4 },
  recentInfo: { flex: 1 },
  recentPair: { fontSize: 14, fontWeight: '700' },
  recentDate: { fontSize: 11, marginTop: 2 },
  recentPnl: { fontSize: 15, fontWeight: '700' },
});
