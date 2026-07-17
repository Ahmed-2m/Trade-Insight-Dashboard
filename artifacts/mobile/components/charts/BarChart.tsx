import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { DailyPnL } from '@/types';

interface BarChartProps {
  data: DailyPnL[];
  width: number;
  height: number;
}

export function BarChart({ data, width, height }: BarChartProps) {
  const colors = useColors();

  const { bars, dateLabels } = useMemo(() => {
    if (data.length === 0) return { bars: [], dateLabels: [] };

    const recent = data.slice(-20);
    const maxAbs = Math.max(...recent.map((d) => Math.abs(d.pnl)), 0.01);

    const barW = Math.max(4, (width - 16) / recent.length - 2);
    const midY = height / 2;
    const scaleH = (midY - 8) / maxAbs;

    const bars = recent.map((d, i) => {
      const barH = Math.max(2, Math.abs(d.pnl) * scaleH);
      const x = 8 + i * ((width - 16) / recent.length);
      const y = d.pnl >= 0 ? midY - barH : midY;
      return { x, y, w: barW, h: barH, positive: d.pnl >= 0, date: d.date, pnl: d.pnl };
    });

    // Show up to 5 date labels evenly spaced
    const step = Math.max(1, Math.floor(recent.length / 5));
    const dateLabels = recent
      .map((d, i) => ({ label: d.date.slice(5), i }))
      .filter((_, i) => i % step === 0 || i === recent.length - 1);

    return { bars, dateLabels };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data yet</Text>
      </View>
    );
  }

  const barSlotW = bars.length > 0 ? (width - 16) / bars.length : 1;

  return (
    <View>
      <Svg width={width} height={height}>
        <Line x1={8} y1={height / 2} x2={width - 8} y2={height / 2} stroke={colors.border} strokeWidth={1} strokeDasharray="4,3" />
        {bars.map((b, i) => (
          <Rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={b.positive ? colors.profit : colors.loss}
            rx={2}
            opacity={0.85}
          />
        ))}
      </Svg>
      <View style={styles.dateRow}>
        {dateLabels.map((d) => (
          <Text
            key={d.i}
            style={[styles.dateLabel, { color: colors.mutedForeground, left: 8 + d.i * barSlotW }]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13 },
  dateRow: { position: 'relative', height: 16, marginTop: 4 },
  dateLabel: { position: 'absolute', fontSize: 10 },
});
