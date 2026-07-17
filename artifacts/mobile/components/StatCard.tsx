import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  color?: string;
  subtitle?: string;
  compact?: boolean;
}

export function StatCard({ label, value, icon, color, subtitle, compact }: StatCardProps) {
  const colors = useColors();
  const accentColor = color ?? colors.primary;

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.card, borderColor: colors.border },
      compact && styles.compact,
    ]}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '20' }]}>
        <Feather name={icon} size={compact ? 14 : 16} color={accentColor} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }, compact && styles.valueCompact]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }, compact && styles.labelCompact]}>{label}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 4,
    minWidth: 100,
  },
  compact: { padding: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  valueCompact: { fontSize: 16 },
  label: { fontSize: 11, lineHeight: 14 },
  labelCompact: { fontSize: 10 },
  subtitle: { fontSize: 10, marginTop: 2 },
});
