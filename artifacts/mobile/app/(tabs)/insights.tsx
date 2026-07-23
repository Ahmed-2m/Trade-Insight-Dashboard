import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTrades } from '@/context/TradesContext';
import { InsightCard } from '@/components/InsightCard';
import { getCurrentStage, getStageProgress } from '@/constants/stages';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '@/context/LanguageContext';

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, isRTL } = useLanguage();
  const { stats, trades, completedStages } = useTrades();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const insights = useMemo(() => {
    const list: Array<{ type: 'success' | 'warning' | 'info' | 'danger'; title: string; description: string; icon?: any }> = [];

    if (trades.length === 0) {
      list.push({
        type: 'info',
        title: isRTL ? 'ابدأ الآن' : 'Get Started',
        description: isRTL
          ? 'قم بإضافة صفقتك الأولى لفتح التحليلات والتوصيات المخصصة لتقييم أدائك.'
          : 'Add your first trade to unlock personalized insights and performance analytics.',
      });
      return list;
    }

    const currentBalance = stats.currentBalance;
    const stage = getCurrentStage(currentBalance);
    const progress = getStageProgress(currentBalance, stage);
    const remaining = stage.targetBalance - currentBalance;

    // Balance & stage
    if (progress >= 0.9) {
      list.push({
        type: 'success',
        title: isRTL ? 'وشكت على الوصول!' : 'Almost There!',
        description: isRTL
          ? `أنجزت ${(progress * 100).toFixed(0)}% من ${stage.label}. متبقي فقط $${remaining.toFixed(2)} للوصول إلى هدف $${stage.targetBalance}!`
          : `You're ${(progress * 100).toFixed(0)}% through ${stage.label}. Only $${remaining.toFixed(2)} left to reach $${stage.targetBalance}!`,
        icon: 'zap',
      });
    } else if (progress >= 0.5) {
      list.push({
        type: 'info',
        title: isRTL ? `قطعت نصف الطريق في ${stage.label}` : `Halfway Through ${stage.label}`,
        description: isRTL
          ? `متبقي $${remaining.toFixed(2)} للوصول إلى هدف $${stage.targetBalance}. واصل التقدم!`
          : `$${remaining.toFixed(2)} remaining to reach your $${stage.targetBalance} target. Keep going!`,
      });
    } else {
      list.push({
        type: 'info',
        title: isRTL ? `تعمل الآن على ${stage.label}` : `Working on ${stage.label}`,
        description: isRTL
          ? `أنجزت ${(progress * 100).toFixed(0)}% من هذه المرحلة. الهدف: $${stage.targetBalance}. المتبقي: $${remaining.toFixed(2)}.`
          : `You're ${(progress * 100).toFixed(0)}% through this stage. Target: $${stage.targetBalance}. Remaining: $${remaining.toFixed(2)}.`,
      });
    }

    // Win rate
    if (stats.totalTrades >= 5) {
      if (stats.winRate >= 60) {
        list.push({
          type: 'success',
          title: isRTL ? 'نسبة نجاح ممتازة' : 'Excellent Win Rate',
          description: isRTL
            ? `نسبة نجاح صفقاتك ${stats.winRate.toFixed(1)}% وهي أعلى من المتوسط. الاستمرارية بهذا الأداء تتضاعف سريعاً.`
            : `Your ${stats.winRate.toFixed(1)}% win rate is above average. Consistent performance like this compounds quickly.`,
          icon: 'trending-up',
        });
      } else if (stats.winRate >= 45) {
        list.push({
          type: 'info',
          title: isRTL ? 'نسبة نجاح جيدة' : 'Solid Win Rate',
          description: isRTL
            ? `نسبة النجاح ${stats.winRate.toFixed(1)}%. ادمج ذلك مع إدارة مخاطر وجني أرباح مناسبة للحفاظ على الربحية.`
            : `${stats.winRate.toFixed(1)}% win rate. Combine this with good risk:reward to maintain profitability.`,
        });
      } else {
        list.push({
          type: 'warning',
          title: isRTL ? 'نسبة النجاح تحتاح تحسين' : 'Win Rate Needs Improvement',
          description: isRTL
            ? `نسبة نجاح صفقاتك ${stats.winRate.toFixed(1)}%. ركز على جودة الصفقات بدلاً من كثرتها وشاهد النماذج المكررة في الصفقات الخاسرة.`
            : `Your win rate is ${stats.winRate.toFixed(1)}%. Focus on trade quality over quantity. Review your losing trades for patterns.`,
          icon: 'alert-triangle',
        });
      }
    }

    // Profit factor
    if (stats.totalTrades >= 5) {
      if (stats.profitFactor > 2) {
        list.push({
          type: 'success',
          title: isRTL ? 'عامل ربح قوي جداً' : 'Strong Profit Factor',
          description: isRTL
            ? `عامل الربح ${stats.profitFactor.toFixed(2)}x — أرباحك تتجاوز ضعف خسائرك. أداء وتفوق استثنائي.`
            : `Profit factor of ${stats.profitFactor.toFixed(2)}x — you're making more than twice what you lose. Exceptional edge.`,
          icon: 'award',
        });
      } else if (stats.profitFactor >= 1.2) {
        list.push({
          type: 'info',
          title: isRTL ? 'نظام تداول رابح' : 'Profitable System',
          description: isRTL
            ? `عامل الربح: ${stats.profitFactor.toFixed(2)}x. لديك ميزة إيجابية بالفيئة، استمر في تطوير واستراتيجيتك.`
            : `Profit factor: ${stats.profitFactor.toFixed(2)}x. You have a positive edge. Continue refining your strategy.`,
        });
      } else if (stats.profitFactor < 1) {
        list.push({
          type: 'danger',
          title: isRTL ? 'عامل ربح بالسالب' : 'Negative Profit Factor',
          description: isRTL
            ? `عامل الربح ${stats.profitFactor.toFixed(2)}x — الخسائر تتجاوز الأرباح. راجع استراتيجية الخروج وإدارة المخاطر.`
            : `Profit factor is ${stats.profitFactor.toFixed(2)}x — losses exceed profits. Review your exit strategy and risk management.`,
          icon: 'alert-circle',
        });
      }
    }

    // Streak warnings
    if (stats.longestLossStreak >= 4) {
      list.push({
        type: 'warning',
        title: isRTL ? 'احذر من التداول الانتقامي' : 'Watch for Revenge Trading',
        description: isRTL
          ? `تعرضت لسلسلة خسائر متتالية وصلت إلى ${stats.longestLossStreak} صفقات سابقاً. عند تراجع الحساب، قلل حجم العقود والتزم بخطتك بدقة.`
          : `You've had a ${stats.longestLossStreak}-trade losing streak in the past. During drawdowns, reduce position size and follow your plan strictly.`,
      });
    }

    // Streak celebration
    if (stats.longestWinStreak >= 5) {
      list.push({
        type: 'success',
        title: isRTL ? `سلسلة أرباح من ${stats.longestWinStreak} صفقات!` : `${stats.longestWinStreak}-Trade Win Streak!`,
        description: isRTL
          ? `رائع! أطول سلسلة أرباح متتالية هي ${stats.longestWinStreak} صفقات. حافظ على انضباطك فهذا دليل الاستمرارية.`
          : `Impressive! Your longest winning streak is ${stats.longestWinStreak} consecutive trades. Stay disciplined — this is what consistency looks like.`,
        icon: 'star',
      });
    }

    // Estimated completion
    if (stats.averageDailyProfit > 0 && remaining > 0) {
      const daysEst = Math.ceil(remaining / stats.averageDailyProfit);
      list.push({
        type: 'info',
        title: isRTL ? 'المدة المقدرة لإكمال المرحلة' : 'Stage Completion Estimate',
        description: isRTL
          ? `بمعدلك الحالي $${stats.averageDailyProfit.toFixed(2)}/يوم، ستكمل ${stage.label} خلال حوالي ${daysEst} أيام تداول.`
          : `At your current average of $${stats.averageDailyProfit.toFixed(2)}/day, you'll complete ${stage.label} in ~${daysEst} trading days.`,
        icon: 'clock',
      });
    }

    // Completed stages milestone
    if (completedStages.length > 0) {
      const last = completedStages[completedStages.length - 1];
      list.push({
        type: 'success',
        title: isRTL
          ? `تم إكمال ${completedStages.length} ${completedStages.length > 1 ? 'مراحل' : 'مرحلة'}!`
          : `${completedStages.length} Stage${completedStages.length > 1 ? 's' : ''} Completed!`,
        description: isRTL
          ? `الآخر: ${last.startDate} ← ${last.endDate} (${last.daysToComplete} يوم إجمالي، ${last.tradingDays} يوم تداول). تقدم ممتاز!`
          : `Latest: ${last.startDate} → ${last.endDate} (${last.daysToComplete} days, ${last.tradingDays} trading days). Outstanding progress!`,
        icon: 'check-circle',
      });
    }

    // Trading frequency
    if (stats.totalTrades >= 10) {
      const avgPerDay = stats.totalTrades / Math.max(1, Object.keys(
        trades.reduce((acc, t) => { acc[t.date] = true; return acc; }, {} as Record<string, boolean>)
      ).length);
      if (avgPerDay > 5) {
        list.push({
          type: 'warning',
          title: isRTL ? 'معدل تداول مرتفع' : 'High Trading Frequency',
          description: isRTL
            ? `متوسط تداولك هو ${avgPerDay.toFixed(1)} صفقات/يوم. التداول المفرط قد يضر بالأرباح. ركز على الجودة بدلاً من الكمية.`
            : `Averaging ${avgPerDay.toFixed(1)} trades/day. Overtrading can erode gains. Quality over quantity.`,
        });
      }
    }

    // Net profit milestone
    if (stats.netProfit > 0 && stats.netProfit >= 50) {
      list.push({
        type: 'success',
        title: isRTL ? `$${stats.netProfit.toFixed(2)} صافي الربح` : `$${stats.netProfit.toFixed(2)} Net Profit`,
        description: isRTL
          ? `أنت في نطاق الربحية. نسبة نمو الحساب: ${stats.totalGrowth.toFixed(2)}%. كل مرحلة تكتمل تبني زخماً لتراكم الأرباح.`
          : `You're in profitable territory. Account growth: ${stats.totalGrowth.toFixed(2)}%. Every stage completed builds compounding momentum.`,
        icon: 'dollar-sign',
      });
    }

    return list;
  }, [stats, trades, completedStages, isRTL]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topInset + 8, paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }, isRTL && styles.rtl]}>
          {t.tabs.insights}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
          {isRTL ? 'تحليلات ذكية بناءً على بيانات تداولك' : 'AI-generated based on your trading data'}
        </Text>
      </View>

      {/* Summary row */}
      {trades.length > 0 && (
        <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }, isRTL && styles.rowReverse]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: stats.winRate >= 50 ? colors.profit : colors.loss }]}>
              {stats.winRate.toFixed(0)}%
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
              {t.dashboard.winRate}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.profit }]}>
              {stats.winningTrades}{isRTL ? 'ر' : 'W'}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
              {t.dashboard.winning}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.loss }]}>
              {stats.losingTrades}{isRTL ? 'خ' : 'L'}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
              {t.dashboard.losing}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>{stats.totalTrades}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
              {isRTL ? 'الإجمالي' : 'Total'}
            </Text>
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
          <Text style={[styles.emptyTitle, { color: colors.foreground }, isRTL && styles.rtl]}>
            {isRTL ? 'لا توجد تحليلات بعد' : 'No insights yet'}
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
            {isRTL ? 'أضف صفقات لفتح التحليلات والإحصائيات المخصصة' : 'Add trades to unlock personalized analytics'}
          </Text>
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
  rowReverse: { flexDirection: 'row-reverse' },
  rtl: { textAlign: 'right' },
});
