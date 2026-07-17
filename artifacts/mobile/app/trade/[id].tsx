import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTrades } from '@/context/TradesContext';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W'];
const STRATEGIES = ['Trend Following', 'Breakout', 'Scalping', 'Swing Trade', 'News Trade', 'Support/Resistance', 'ICT Concepts', 'Price Action', 'Other'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getDayName(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  } catch { return ''; }
}

export default function TradeDetailScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTrade, updateTrade, deleteTrade } = useTrades();
  const trade = getTrade(id);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const [form, setForm] = useState({
    date: trade?.date ?? '',
    pair: trade?.pair ?? '',
    direction: (trade?.direction ?? 'buy') as 'buy' | 'sell',
    entryPrice: trade?.entryPrice?.toString() ?? '',
    exitPrice: trade?.exitPrice?.toString() ?? '',
    startingBalance: trade?.startingBalance?.toString() ?? '',
    profitLoss: trade?.profitLoss?.toString() ?? '',
    notes: trade?.notes ?? '',
    strategy: trade?.strategy ?? '',
    timeframe: trade?.timeframe ?? '1H',
    duration: trade?.duration ?? '',
    screenshotUri: trade?.screenshotUri ?? '',
  });

  const endingBalance = useMemo(() => {
    const sb = parseFloat(form.startingBalance) || 0;
    const pl = parseFloat(form.profitLoss) || 0;
    return sb + pl;
  }, [form.startingBalance, form.profitLoss]);

  if (!trade) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Trade not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => setForm((p) => ({ ...p, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to attach screenshots.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) set('screenshotUri', result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!form.pair.trim()) { Alert.alert('Missing field', 'Please enter a currency pair.'); return; }
    try {
      setSaving(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updateTrade(id, {
        date: form.date,
        day: getDayName(form.date),
        pair: form.pair.trim().toUpperCase(),
        direction: form.direction,
        entryPrice: parseFloat(form.entryPrice) || 0,
        exitPrice: parseFloat(form.exitPrice) || 0,
        startingBalance: parseFloat(form.startingBalance) || 0,
        profitLoss: parseFloat(form.profitLoss) || 0,
        endingBalance,
        notes: form.notes,
        strategy: form.strategy,
        timeframe: form.timeframe,
        duration: form.duration,
        screenshotUri: form.screenshotUri || undefined,
      });
      setEditing(false);
    } catch { Alert.alert('Error', 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Trade', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTrade(id); router.back(); } },
    ]);
  };

  const isProfit = trade.profitLoss >= 0;

  if (!editing) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{trade.pair}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.actionBtn}>
              <Feather name="edit-2" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <Feather name="trash-2" size={18} color={colors.loss} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={[styles.heroCard, { backgroundColor: isProfit ? colors.profitBg : colors.lossBg, borderColor: isProfit ? colors.profit + '40' : colors.loss + '40' }]}>
            <Text style={[styles.pnlBig, { color: isProfit ? colors.profit : colors.loss }]}>
              {isProfit ? '+' : ''}${trade.profitLoss.toFixed(2)}
            </Text>
            <Text style={[styles.pnlLabel, { color: colors.mutedForeground }]}>Profit / Loss</Text>
            <View style={styles.heroMeta}>
              <DetailItem label="Starting" value={`$${trade.startingBalance.toFixed(2)}`} colors={colors} />
              <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
              <DetailItem label="Ending" value={`$${trade.endingBalance.toFixed(2)}`} colors={colors} />
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.grid}>
            <DetailCard label="Date" value={trade.date} icon="calendar" colors={colors} />
            <DetailCard label="Day" value={trade.day} icon="clock" colors={colors} />
            <DetailCard label="Direction" value={trade.direction.toUpperCase()} icon={trade.direction === 'buy' ? 'trending-up' : 'trending-down'} colors={colors} color={trade.direction === 'buy' ? colors.profit : colors.loss} />
            <DetailCard label="Timeframe" value={trade.timeframe} icon="bar-chart-2" colors={colors} />
            <DetailCard label="Entry" value={trade.entryPrice ? `$${trade.entryPrice}` : '—'} icon="log-in" colors={colors} />
            <DetailCard label="Exit" value={trade.exitPrice ? `$${trade.exitPrice}` : '—'} icon="log-out" colors={colors} />
            {trade.strategy && <DetailCard label="Strategy" value={trade.strategy} icon="target" colors={colors} />}
            {trade.duration && <DetailCard label="Duration" value={trade.duration} icon="watch" colors={colors} />}
          </View>

          {trade.notes ? (
            <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.notesHeader}>
                <Feather name="file-text" size={14} color={colors.mutedForeground} />
                <Text style={[styles.notesTitle, { color: colors.mutedForeground }]}>Notes</Text>
              </View>
              <Text style={[styles.notesBody, { color: colors.foreground }]}>{trade.notes}</Text>
            </View>
          ) : null}

          {trade.screenshotUri ? (
            <View style={styles.screenshotSection}>
              <Text style={[styles.screenshotLabel, { color: colors.mutedForeground }]}>Screenshot</Text>
              <Image source={{ uri: trade.screenshotUri }} style={styles.screenshot} resizeMode="cover" />
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  // Edit mode
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setEditing(false)} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Trade</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {[
          { label: 'Date', key: 'date' as const, placeholder: 'YYYY-MM-DD' },
          { label: 'Pair', key: 'pair' as const, placeholder: 'EUR/USD', autoCapitalize: 'characters' as const },
          { label: 'Entry Price', key: 'entryPrice' as const, placeholder: '0.00', keyboardType: 'decimal-pad' as const },
          { label: 'Exit Price', key: 'exitPrice' as const, placeholder: '0.00', keyboardType: 'decimal-pad' as const },
          { label: 'Starting Balance ($)', key: 'startingBalance' as const, placeholder: '0.00', keyboardType: 'decimal-pad' as const },
          { label: 'Profit / Loss ($)', key: 'profitLoss' as const, placeholder: '+/- 0.00', keyboardType: 'numbers-and-punctuation' as const },
        ].map((f) => (
          <View key={f.key} style={styles.editSection}>
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={form[f.key]}
              onChangeText={(v) => set(f.key, v)}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={(f as any).keyboardType ?? 'default'}
              autoCapitalize={(f as any).autoCapitalize ?? 'none'}
            />
          </View>
        ))}
        <View style={styles.editSection}>
          <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Notes</Text>
          <TextInput style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} value={form.notes} onChangeText={(v) => set('notes', v)} multiline numberOfLines={4} textAlignVertical="top" />
        </View>
        <View style={styles.editSection}>
          <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Screenshot</Text>
          {form.screenshotUri ? (
            <View style={styles.screenshotWrap}>
              <Image source={{ uri: form.screenshotUri }} style={styles.screenshot} resizeMode="cover" />
              <TouchableOpacity style={[styles.removeImg, { backgroundColor: colors.loss }]} onPress={() => set('screenshotUri', '')}>
                <Feather name="x" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage}>
              <Feather name="image" size={20} color={colors.mutedForeground} />
              <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Attach Screenshot</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailCard({ label, value, icon, colors, color }: { label: string; value: string; icon: any; colors: any; color?: string }) {
  return (
    <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={13} color={color ?? colors.mutedForeground} />
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: color ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

function DetailItem({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.detailItemWrap}>
      <Text style={[styles.detailItemLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailItemValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  heroCard: { borderRadius: 18, padding: 20, borderWidth: 1, alignItems: 'center', marginBottom: 16, gap: 4 },
  pnlBig: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  pnlLabel: { fontSize: 13 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  detailCard: { width: '47%', borderRadius: 12, padding: 12, borderWidth: 1, gap: 4 },
  detailLabel: { fontSize: 11 },
  detailValue: { fontSize: 15, fontWeight: '700' },
  notesCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 16 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  notesTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  notesBody: { fontSize: 14, lineHeight: 20 },
  screenshotSection: { gap: 8 },
  screenshotLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  screenshot: { width: '100%', height: 200, borderRadius: 14 },
  detailItemWrap: { alignItems: 'center' },
  detailItemLabel: { fontSize: 11, marginBottom: 2 },
  detailItemValue: { fontSize: 16, fontWeight: '700' },
  editSection: { marginBottom: 16 },
  editLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  textarea: { minHeight: 90, paddingTop: 12 },
  screenshotWrap: { position: 'relative' },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', padding: 20, alignItems: 'center', gap: 8 },
  uploadText: { fontSize: 14 },
  notFound: { fontSize: 16, marginBottom: 12 },
  backLink: { fontSize: 15, fontWeight: '600' },
});
