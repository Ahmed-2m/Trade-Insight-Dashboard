import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Trade } from '@/types';
import { Feather } from '@expo/vector-icons';

interface TradeCardProps {
  trade: Trade;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TradeCard({ trade, onPress, onDelete }: TradeCardProps) {
  const colors = useColors();
  const isProfit = trade.profitLoss >= 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={[styles.directionDot, { backgroundColor: isProfit ? colors.profit : colors.loss }]} />
        <View>
          <Text style={[styles.pair, { color: colors.foreground }]}>{trade.pair || 'Unknown Pair'}</Text>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {trade.direction.toUpperCase()} · {trade.timeframe}
            </Text>
            {trade.strategy ? (
              <View style={[styles.strategyBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.strategyText, { color: colors.accentForeground }]}>{trade.strategy}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{trade.date} · {trade.day}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.pnl, { color: isProfit ? colors.profit : colors.loss }]}>
          {isProfit ? '+' : ''}{trade.profitLoss.toFixed(2)}
        </Text>
        <Text style={[styles.balance, { color: colors.mutedForeground }]}>→ ${trade.endingBalance.toFixed(2)}</Text>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="trash-2" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  left: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  directionDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  pair: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  metaText: { fontSize: 11 },
  strategyBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  strategyText: { fontSize: 10, fontWeight: '600' },
  date: { fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 2 },
  pnl: { fontSize: 16, fontWeight: '700' },
  balance: { fontSize: 11 },
  deleteBtn: { marginTop: 4 },
});
