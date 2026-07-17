import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface PieChartProps {
  wins: number;
  losses: number;
  size?: number;
}

export function PieChart({ wins, losses, size = 100 }: PieChartProps) {
  const colors = useColors();
  const total = wins + losses;
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        </Svg>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.center}>
            <Text style={[styles.pct, { color: colors.mutedForeground }]}>—</Text>
          </View>
        </View>
      </View>
    );
  }

  const winRatio = wins / total;
  const winArc = winRatio * circumference;
  const lossArc = circumference - winArc;
  const winRate = Math.round(winRatio * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx},${cy}`}>
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={colors.loss}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${lossArc} ${circumference}`}
            strokeDashoffset={-winArc}
            strokeLinecap="round"
          />
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={colors.profit}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${winArc} ${circumference}`}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={[styles.pct, { color: colors.foreground }]}>{winRate}%</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Win</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pct: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 10, marginTop: 1 },
});
