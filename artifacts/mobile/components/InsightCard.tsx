import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

type InsightType = 'success' | 'warning' | 'info' | 'danger';

interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
}

const TYPE_CONFIG: Record<InsightType, { icon: React.ComponentProps<typeof Feather>['name']; getColors: (c: any) => { bg: string; border: string; icon: string } }> = {
  success: { icon: 'trending-up', getColors: (c) => ({ bg: c.profitBg, border: c.profit + '40', icon: c.profit }) },
  warning: { icon: 'alert-triangle', getColors: (c) => ({ bg: c.warningBg, border: c.warning + '40', icon: c.warning }) },
  danger: { icon: 'alert-circle', getColors: (c) => ({ bg: c.lossBg, border: c.loss + '40', icon: c.loss }) },
  info: { icon: 'info', getColors: (c) => ({ bg: c.accent, border: c.primary + '40', icon: c.primary }) },
};

export function InsightCard({ type, title, description, icon }: InsightCardProps) {
  const colors = useColors();
  const config = TYPE_CONFIG[type];
  const themeColors = config.getColors(colors);
  const iconName = icon ?? config.icon;

  return (
    <View style={[styles.card, { backgroundColor: themeColors.bg, borderColor: themeColors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: themeColors.icon + '20' }]}>
        <Feather name={iconName} size={16} color={themeColors.icon} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  description: { fontSize: 13, lineHeight: 18 },
});
