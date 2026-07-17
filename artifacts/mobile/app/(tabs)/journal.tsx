import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTrades } from '@/context/TradesContext';
import { TradeCard } from '@/components/TradeCard';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

type SortKey = 'date-desc' | 'date-asc' | 'pnl-desc' | 'pnl-asc';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { trades, deleteTrade } = useTrades();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date-desc');
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'win' | 'loss'>('all');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const filtered = useMemo(() => {
    let result = [...trades];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) =>
        t.pair.toLowerCase().includes(q) ||
        t.strategy.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    }
    if (filter === 'buy') result = result.filter((t) => t.direction === 'buy');
    if (filter === 'sell') result = result.filter((t) => t.direction === 'sell');
    if (filter === 'win') result = result.filter((t) => t.profitLoss > 0);
    if (filter === 'loss') result = result.filter((t) => t.profitLoss < 0);

    if (sort === 'date-desc') result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    if (sort === 'date-asc') result.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
    if (sort === 'pnl-desc') result.sort((a, b) => b.profitLoss - a.profitLoss);
    if (sort === 'pnl-asc') result.sort((a, b) => a.profitLoss - b.profitLoss);

    return result;
  }, [trades, search, sort, filter]);

  const handleDelete = (id: string, pair: string) => {
    Alert.alert('Delete Trade', `Remove trade for ${pair}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteTrade(id);
        },
      },
    ]);
  };

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'win', label: 'Wins' },
    { key: 'loss', label: 'Losses' },
    { key: 'buy', label: 'Long' },
    { key: 'sell', label: 'Short' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Journal</Text>
          <Text style={[styles.count, { color: colors.mutedForeground }]}>{trades.length} trades</Text>
        </View>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search pair, strategy..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f.key ? colors.primary : colors.card, borderColor: filter === f.key ? colors.primary : colors.border },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? '#fff' : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TradeCard
            trade={item}
            onPress={() => router.push(`/trade/${item.id}` as any)}
            onDelete={() => handleDelete(item.id, item.pair)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomInset + 100 },
          filtered.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="book-open" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search || filter !== 'all' ? 'No matching trades' : 'No trades yet'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {search || filter !== 'all' ? 'Try a different filter' : 'Record your first trade to get started'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomInset + 90 }]}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/trade/new');
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  count: { fontSize: 13 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyDesc: { fontSize: 13, textAlign: 'center', maxWidth: 240 },
  fab: { position: 'absolute', right: 20, width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#6C5CE7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
