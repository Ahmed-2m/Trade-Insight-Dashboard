import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Platform, RefreshControl, Modal, TextInput, KeyboardAvoidingView,
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
import { PLAN_PRESETS } from '@/constants/stages';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 32;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const { stats, completedStages, balanceHistory, trades, stages, initialBalance, setInitialBalance, isLoading } = useTrades();
  const [refreshing, setRefreshing] = React.useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const isPositive = stats.netProfit >= 0;
  const currentBalance = stats.currentBalance > 0 || trades.length > 0
    ? stats.currentBalance
    : initialBalance > 0 ? initialBalance : stats.startingBalance;
  const growthPct = stats.totalGrowth;

  // جلب معلومات المستخدم لعرض اسمه وإيميله بشكل أنيق
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // استخراج اسم البريد الإلكتروني
  const userEmail = user?.email ?? '';
  const rawName = userEmail ? userEmail.split('@')[0] : '';
  const formattedName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : '';

  // Auto-show plan setup for brand-new users
  React.useEffect(() => {
    if (!isLoading && initialBalance === 0 && trades.length === 0) {
      setPlanModalVisible(true);
    }
  }, [isLoading]);

  const handleSelectPreset = async (amount: number) => {
    await setInitialBalance(amount);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPlanModalVisible(false);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleCustomConfirm = async () => {
    const val = parseFloat(customAmount);
    if (!val || val <= 0) return;
    await handleSelectPreset(val);
  };

  const openPlanModal = () => {
    setCustomAmount(initialBalance > 0 ? initialBalance.toString() : '');
    setShowCustomInput(false);
    setPlanModalVisible(true);
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={colors.primary} />}
      >
        {/* Header - مع إضافة الترحبب الأنيق بالاسم */}
        <View style={[styles.header, isRTL && styles.rowReverse]}>
          <View style={isRTL ? { alignItems: 'flex-end' } : {}}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
              {formattedName
                ? (isRTL ? `مرحباً بك 👋 ${formattedName}` : `Welcome back 👋 ${formattedName}`)
                : t.dashboard.subtitle}
            </Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
              {t.dashboard.title}
            </Text>
          </View>
          <View style={[styles.headerButtons, isRTL && styles.rowReverse]}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={openPlanModal}
              activeOpacity={0.8}
            >
              <Feather name="sliders" size={17} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/trade/new')}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Hero Card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={[styles.heroTop, isRTL && styles.rowReverse]}>
            <Text style={styles.heroLabel}>{t.dashboard.accountBalance}</Text>
            <View style={[styles.growthBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }, isRTL && styles.rowReverse]}>
              <Feather name={growthPct >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#fff" />
              <Text style={styles.growthText}>{growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%</Text>
            </View>
          </View>
          <Text style={[styles.heroBalance, isRTL && styles.rtl]}>${currentBalance.toFixed(2)}</Text>
          <View style={[styles.heroStats, isRTL && styles.rowReverse]}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{t.dashboard.netPnl}</Text>
              <Text style={[styles.heroStatValue, { color: isPositive ? '#7EF5C4' : '#FFA5B4' }]}>
                {isPositive ? '+' : ''}${stats.netProfit.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{t.dashboard.winRate}</Text>
              <Text style={styles.heroStatValue}>{stats.winRate.toFixed(1)}%</Text>
            </View>
            <View style={[styles.heroDivider, { backgroundColor: 'rgba(255,255,255,0.25)' }]} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>{t.dashboard.totalTrades}</Text>
              <Text style={styles.heroStatValue}>{stats.totalTrades}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stage Progress */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.dashboard.stageProgress}</Text>
            {initialBalance > 0 && (
              <TouchableOpacity onPress={openPlanModal}>
                <Text style={[styles.planLabel, { color: colors.primary }]}>
                  {t.dashboard.starting}{initialBalance % 1 === 0 ? initialBalance.toFixed(0) : initialBalance.toFixed(2)} {isRTL ? '‹' : '›'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <StageProgressCard balance={currentBalance} completedStages={completedStages} stages={stages} />
        </View>

        {/* Quick Stats Row */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
            {isRTL ? 'إحصائيات سريعة' : 'Quick Stats'}
          </Text>
          <View style={[styles.statsRow, isRTL && styles.rowReverse]}>
            <StatCard label={t.dashboard.winning} value={`${stats.winningTrades}`} icon="check-circle" color={colors.profit} />
            <StatCard label={t.dashboard.losing} value={`${stats.losingTrades}`} icon="x-circle" color={colors.loss} />
            <StatCard label={t.dashboard.profitFactor} value={stats.profitFactor === 99.99 ? '∞' : stats.profitFactor.toFixed(2)} icon="activity" color={colors.primary} />
          </View>
        </View>

        {/* Balance Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
            {t.dashboard.balanceGrowth}
          </Text>
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LineChart data={balanceHistory} width={CHART_W - 32} height={140} />
          </View>
        </View>

        {/* Recent Trades */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.dashboard.recentTrades}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/journal')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t.dashboard.seeAll}</Text>
            </TouchableOpacity>
          </View>
          {trades.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="book-open" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.dashboard.noTrades}</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>{t.dashboard.noTradesDesc}</Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/trade/new')}
              >
                <Text style={styles.emptyBtnText}>{t.dashboard.addFirstTrade}</Text>
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
                    style={[styles.recentTrade, { backgroundColor: colors.card, borderColor: colors.border }, isRTL && styles.rowReverse]}
                    onPress={() => router.push(`/trade/${trade.id}` as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.recentDot, { backgroundColor: isProfit ? colors.profit : colors.loss }]} />
                    <View style={styles.recentInfo}>
                      <Text style={[styles.recentPair, { color: colors.foreground }, isRTL && styles.rtl]}>{trade.pair}</Text>
                      <Text style={[styles.recentDate, { color: colors.mutedForeground }, isRTL && styles.rtl]}>{trade.date} · {trade.direction.toUpperCase()}</Text>
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

      {/* Plan Setup Modal */}
      <Modal
        visible={planModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPlanModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.muted }]} />

            <View style={[styles.modalHeader, isRTL && styles.rowReverse]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }, isRTL && styles.rtl]}>{t.plan.title}</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                  {t.plan.subtitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPlanModalVisible(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Current plan indicator */}
            {initialBalance > 0 && (
              <View style={[styles.currentPlanBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }, isRTL && styles.rowReverse]}>
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={[styles.currentPlanText, { color: colors.primary }, isRTL && styles.rtl]}>
                  {t.plan.currentPlan}{initialBalance % 1 === 0 ? initialBalance.toFixed(0) : initialBalance.toFixed(2)}
                </Text>
              </View>
            )}

            <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
              {t.plan.chooseAmount}
            </Text>

            {/* Preset grid */}
            <View style={[styles.presetGrid, isRTL && styles.rowReverse]}>
              {PLAN_PRESETS.map((amount) => {
                const isActive = initialBalance === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.presetBtn,
                      {
                        backgroundColor: isActive ? colors.primary : colors.background,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectPreset(amount)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.presetAmount, { color: isActive ? '#fff' : colors.foreground }]}>
                      ${amount >= 1000 ? `${amount / 1000}k` : amount}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom amount */}
            {showCustomInput ? (
              <View style={[styles.customInputRow, { backgroundColor: colors.background, borderColor: colors.primary + '60' }, isRTL && styles.rowReverse]}>
                <Text style={[styles.dollarSign, { color: colors.foreground }]}>$</Text>
                <TextInput
                  style={[styles.customInput, { color: colors.foreground }, isRTL && styles.rtl]}
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholder={t.plan.customAmount}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="decimal-pad"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCustomConfirm}
                />
                <TouchableOpacity
                  style={[styles.customConfirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleCustomConfirm}
                >
                  <Text style={styles.customConfirmText}>{t.plan.set}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.customToggleBtn, { borderColor: colors.border }, isRTL && styles.rowReverse]}
                onPress={() => setShowCustomInput(true)}
              >
                <Feather name="edit-3" size={14} color={colors.mutedForeground} />
                <Text style={[styles.customToggleText, { color: colors.mutedForeground }]}>{t.plan.customAmount}</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
              {t.plan.hint}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  greeting: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
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
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  planLabel: { fontSize: 12, fontWeight: '600' },
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
  rowReverse: { flexDirection: 'row-reverse' },
  rtl: { textAlign: 'right' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0, gap: 16 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, lineHeight: 18 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  currentPlanBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  currentPlanText: { fontSize: 13, fontWeight: '600' },
  modalSectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, minWidth: 80, alignItems: 'center' },
  presetAmount: { fontSize: 16, fontWeight: '800' },
  customToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  customToggleText: { fontSize: 14, fontWeight: '500' },
  customInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4 },
  dollarSign: { fontSize: 18, fontWeight: '700' },
  customInput: { flex: 1, fontSize: 18, fontWeight: '700', paddingVertical: 10 },
  customConfirmBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  customConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalHint: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});

