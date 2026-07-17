import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getCurrentStage, getStageProgress } from '@/constants/stages';
import { CompletedStage } from '@/types';
import { Feather } from '@expo/vector-icons';

interface StageProgressCardProps {
  balance: number;
  completedStages: CompletedStage[];
}

export function StageProgressCard({ balance, completedStages }: StageProgressCardProps) {
  const colors = useColors();
  const stage = getCurrentStage(balance);
  const progress = getStageProgress(balance, stage);
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animWidth, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [progress]);

  const remaining = stage.targetBalance - balance;
  const isCompleted = balance >= stage.targetBalance;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.stageBadge, { backgroundColor: stage.color + '22' }]}>
          <Text style={[styles.stageBadgeText, { color: stage.color }]}>{stage.label}</Text>
        </View>
        {isCompleted && (
          <View style={[styles.completedBadge, { backgroundColor: colors.profit + '22' }]}>
            <Feather name="check-circle" size={12} color={colors.profit} />
            <Text style={[styles.completedText, { color: colors.profit }]}>Completed</Text>
          </View>
        )}
      </View>

      <View style={styles.balances}>
        <View>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Current Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>${balance.toFixed(2)}</Text>
        </View>
        <View style={styles.arrow}>
          <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
        </View>
        <View style={styles.targetBlock}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Stage Target</Text>
          <Text style={[styles.balanceValue, { color: stage.color }]}>${stage.targetBalance.toFixed(0)}</Text>
        </View>
      </View>

      <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: stage.color,
              width: animWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
        <View style={[styles.progressGlow, { backgroundColor: stage.color + '40' }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.progressPct, { color: stage.color }]}>{Math.round(progress * 100)}%</Text>
        <Text style={[styles.remaining, { color: colors.mutedForeground }]}>
          {remaining > 0 ? `$${remaining.toFixed(2)} to go` : 'Target reached!'}
        </Text>
      </View>

      {completedStages.length > 0 && (
        <View style={[styles.completedRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.completedLabel, { color: colors.mutedForeground }]}>Stages completed</Text>
          <View style={styles.dots}>
            {Array.from({ length: Math.min(completedStages.length, 10) }).map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: colors.profit }]} />
            ))}
          </View>
          <Text style={[styles.completedCount, { color: colors.profit }]}>{completedStages.length}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  stageBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  completedText: { fontSize: 11, fontWeight: '600' },
  balances: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { fontSize: 11, marginBottom: 2 },
  balanceValue: { fontSize: 20, fontWeight: '700' },
  arrow: { alignItems: 'center' },
  targetBlock: { alignItems: 'flex-end' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  progressFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 4 },
  progressGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressPct: { fontSize: 13, fontWeight: '700' },
  remaining: { fontSize: 12 },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1 },
  completedLabel: { fontSize: 11, flex: 1 },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  completedCount: { fontSize: 13, fontWeight: '700' },
});
