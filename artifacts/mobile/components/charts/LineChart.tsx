import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { BalancePoint } from '@/types';

interface LineChartProps {
  data: BalancePoint[];
  width: number;
  height: number;
  showLabels?: boolean;
}

export function LineChart({ data, width, height, showLabels = true }: LineChartProps) {
  const colors = useColors();
  const isDark = useColorScheme() === 'dark';

  const { path, gradientPath, points, minVal, maxVal } = useMemo(() => {
    if (data.length < 2) return { path: '', gradientPath: '', points: [], minVal: 0, maxVal: 0 };

    const values = data.map((d) => d.balance);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const padX = 8;
    const padY = 12;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const toX = (i: number) => padX + (i / (data.length - 1)) * chartW;
    const toY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;

    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.balance), balance: d.balance, date: d.date }));

    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 3;
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 3;
      pathD += ` C ${cp1x} ${pts[i - 1].y}, ${cp2x} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }

    const lastPt = pts[pts.length - 1];
    const gradPath = `${pathD} L ${lastPt.x} ${height} L ${pts[0].x} ${height} Z`;

    return { path: pathD, gradientPath: gradPath, points: pts, minVal, maxVal };
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No data yet</Text>
      </View>
    );
  }

  const isPositive = data[data.length - 1].balance >= data[0].balance;
  const lineColor = isPositive ? colors.profit : colors.loss;
  const gradStartColor = isPositive ? 'rgba(14,203,129,0.25)' : 'rgba(246,70,93,0.25)';

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={gradientPath} fill="url(#lineGrad)" />
        <Path d={path} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.length > 0 && (
          <>
            <Circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={4}
              fill={lineColor}
              stroke={isDark ? colors.card : '#fff'}
              strokeWidth={2}
            />
          </>
        )}
      </Svg>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>${minVal.toFixed(2)}</Text>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>${maxVal.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
  },
});
