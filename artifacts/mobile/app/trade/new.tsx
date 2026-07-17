import React, { useState, useCallback, useMemo } from 'react';
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

function today(): string {
  return new Date().toISOString().split('T')[0];
}

interface FormState {
  date: string;
  pair: string;
  direction: 'buy' | 'sell';
  entryPrice: string;
  exitPrice: string;
  startingBalance: string;
  profitLoss: string;
  notes: string;
  strategy: string;
  timeframe: string;
  duration: string;
  screenshotUri: string;
}

export default function NewTradeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { addTrade, stats } = useTrades();
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    date: today(),
    pair: '',
    direction: 'buy',
    entryPrice: '',
    exitPrice: '',
    startingBalance: stats.currentBalance > 0 ? stats.currentBalance.toFixed(2) : '',
    profitLoss: '',
    notes: '',
    strategy: '',
    timeframe: '1H',
    duration: '',
    screenshotUri: '',
  });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      // Auto-recalculate ending balance when profitLoss or startingBalance changes
      return next;
    });
  }, []);

  const endingBalance = useMemo(() => {
    const sb = parseFloat(form.startingBalance) || 0;
    const pl = parseFloat(form.profitLoss) || 0;
    return sb + pl;
  }, [form.startingBalance, form.profitLoss]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to attach screenshots.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) set('screenshotUri', result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!form.pair.trim()) { Alert.alert('Missing field', 'Please enter a currency pair or asset name.'); return; }
    if (!form.startingBalance) { Alert.alert('Missing field', 'Please enter the starting balance.'); return; }
    if (!form.profitLoss) { Alert.alert('Missing field', 'Please enter profit/loss.'); return; }

    try {
      setSaving(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addTrade({
        date: form.date,
        day: getDayName(form.date),
        pair: form.pair.trim().toUpperCase(),
        direction: form.direction,
        entryPrice: parseFloat(form.entryPrice) || 0,
        exitPrice: parseFloat(form.exitPrice) || 0,
        startingBalance: parseFloat(form.startingBalance) || 0,
        profitLoss: parseFloat(form.profitLoss) || 0,
        endingBalance: endingBalance,
        notes: form.notes,
        strategy: form.strategy,
        timeframe: form.timeframe,
        duration: form.duration,
        screenshotUri: form.screenshotUri || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save trade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Trade</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <Section title="Date" colors={colors}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={form.date}
            onChangeText={(v) => set('date', v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
          {form.date.length === 10 && <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>{getDayName(form.date)}</Text>}
        </Section>

        {/* Pair */}
        <Section title="Currency Pair / Asset" colors={colors}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={form.pair}
            onChangeText={(v) => set('pair', v)}
            placeholder="e.g. EUR/USD, XAUUSD, BTC/USD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
          />
        </Section>

        {/* Direction */}
        <Section title="Trade Direction" colors={colors}>
          <View style={styles.directionRow}>
            {(['buy', 'sell'] as const).map((dir) => (
              <TouchableOpacity
                key={dir}
                style={[
                  styles.dirBtn,
                  {
                    backgroundColor: form.direction === dir
                      ? (dir === 'buy' ? colors.profit : colors.loss)
                      : colors.card,
                    borderColor: form.direction === dir
                      ? (dir === 'buy' ? colors.profit : colors.loss)
                      : colors.border,
                  },
                ]}
                onPress={() => set('direction', dir)}
              >
                <Feather
                  name={dir === 'buy' ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={form.direction === dir ? '#fff' : colors.mutedForeground}
                />
                <Text style={[styles.dirBtnText, { color: form.direction === dir ? '#fff' : colors.mutedForeground }]}>
                  {dir === 'buy' ? 'Buy / Long' : 'Sell / Short'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Prices */}
        <Section title="Prices" colors={colors}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Entry Price</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={form.entryPrice}
                onChangeText={(v) => set('entryPrice', v)}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Exit Price</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={form.exitPrice}
                onChangeText={(v) => set('exitPrice', v)}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </Section>

        {/* Balance */}
        <Section title="Balance" colors={colors}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Starting Balance ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={form.startingBalance}
                onChangeText={(v) => set('startingBalance', v)}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>Profit / Loss ($)</Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.card,
                  borderColor: form.profitLoss.startsWith('-') ? colors.loss + '80' : (form.profitLoss ? colors.profit + '80' : colors.border),
                  color: form.profitLoss.startsWith('-') ? colors.loss : (form.profitLoss ? colors.profit : colors.foreground),
                }]}
                value={form.profitLoss}
                onChangeText={(v) => set('profitLoss', v)}
                placeholder="+/- 0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          {(form.startingBalance || form.profitLoss) && (
            <View style={[styles.endingBalanceRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.endingLabel, { color: colors.mutedForeground }]}>Ending Balance:</Text>
              <Text style={[styles.endingValue, { color: endingBalance >= parseFloat(form.startingBalance || '0') ? colors.profit : colors.loss }]}>
                ${endingBalance.toFixed(2)}
              </Text>
            </View>
          )}
        </Section>

        {/* Timeframe */}
        <Section title="Timeframe" colors={colors}>
          <View style={styles.chipsWrap}>
            {TIMEFRAMES.map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.chip, { backgroundColor: form.timeframe === tf ? colors.primary : colors.card, borderColor: form.timeframe === tf ? colors.primary : colors.border }]}
                onPress={() => set('timeframe', tf)}
              >
                <Text style={[styles.chipText, { color: form.timeframe === tf ? '#fff' : colors.mutedForeground }]}>{tf}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Strategy */}
        <Section title="Strategy" colors={colors}>
          <View style={styles.chipsWrap}>
            {STRATEGIES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, { backgroundColor: form.strategy === s ? colors.primary : colors.card, borderColor: form.strategy === s ? colors.primary : colors.border }]}
                onPress={() => set('strategy', s)}
              >
                <Text style={[styles.chipText, { color: form.strategy === s ? '#fff' : colors.mutedForeground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Duration */}
        <Section title="Trade Duration" colors={colors}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={form.duration}
            onChangeText={(v) => set('duration', v)}
            placeholder="e.g. 2h 30m, 3 days"
            placeholderTextColor={colors.mutedForeground}
          />
        </Section>

        {/* Notes */}
        <Section title="Notes" colors={colors}>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
            placeholder="Trade setup, observations, lessons learned..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Section>

        {/* Screenshot */}
        <Section title="Screenshot" colors={colors}>
          {form.screenshotUri ? (
            <View style={styles.screenshotWrap}>
              <Image source={{ uri: form.screenshotUri }} style={styles.screenshot} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.removeImg, { backgroundColor: colors.loss }]}
                onPress={() => set('screenshotUri', '')}
              >
                <Feather name="x" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={pickImage}
            >
              <Feather name="image" size={20} color={colors.mutedForeground} />
              <Text style={[styles.uploadText, { color: colors.mutedForeground }]}>Attach Screenshot</Text>
            </TouchableOpacity>
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  scroll: { flex: 1 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  subLabel: { fontSize: 11, marginBottom: 4 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  textarea: { minHeight: 90, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 10 },
  directionRow: { flexDirection: 'row', gap: 10 },
  dirBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  dirBtnText: { fontSize: 14, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  endingBalanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  endingLabel: { fontSize: 13 },
  endingValue: { fontSize: 16, fontWeight: '700' },
  uploadBtn: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', padding: 20, alignItems: 'center', gap: 8 },
  uploadText: { fontSize: 14 },
  screenshotWrap: { position: 'relative' },
  screenshot: { width: '100%', height: 180, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 12, marginTop: 4 },
});
