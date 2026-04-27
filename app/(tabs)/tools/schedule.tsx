import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type Todo, useTodoStore } from '@/stores';

export default function ToolsScheduleScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#252A31' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#6D8AAE', dark: '#88A9D4' }, 'tint');

  const items = useTodoStore((s) => s.items) as Pick<Todo, 'id' | 'title' | 'due' | 'tags' | 'done'>[];
  const toggleStore = useTodoStore((s) => s.toggle);
  const addTodo = useTodoStore((s) => s.addTodo);

  const stats = useMemo(() => {
    const done = items.filter((x) => x.done).length;
    return { done, total: items.length };
  }, [items]);

  function toggle(id: string) {
    toggleStore(id);
  }

  function addSchedule() {
    addTodo();
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.bigTitle}>日程记事</ThemedText>
        <View style={styles.subRow}>
          <ThemedText style={[styles.hint, { color: mutedText }]}>
            今日完成：{stats.done}/{stats.total}
          </ThemedText>
          <Pressable
            onPress={addSchedule}
            style={({ pressed }) => [
              styles.addChip,
              { borderColor: accent, backgroundColor: pressed ? 'rgba(47,128,237,0.08)' : 'transparent' },
            ]}>
            <ThemedText style={[styles.addChipText, { color: accent }]}>+ 新建</ThemedText>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggle(item.id)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
            ]}>
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.done ? accent : 'transparent', borderColor: item.done ? accent : cardBorder },
                ]}
              />
              <View style={styles.cardText}>
                <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                <ThemedText style={[styles.cardSubtitle, { color: mutedText }]}>
                  {item.due ?? '未设置'}
                  {item.tags && item.tags.length > 0 ? ` · ${item.tags.join(' / ')}` : ''}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.status, { color: item.done ? accent : mutedText }]}>
              {item.done ? '已完成' : '待办'}
            </ThemedText>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 10 },
  bigTitle: { fontSize: 28, fontWeight: '800', letterSpacing: 0.2, textAlign: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  addChip: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  addChipText: { fontSize: 13, lineHeight: 16, fontWeight: '800' },
  listContent: { paddingTop: 6, paddingBottom: 18 },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 6, borderWidth: 2 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  cardSubtitle: { fontSize: 13, lineHeight: 18 },
  status: { fontSize: 13, lineHeight: 16, fontWeight: '700' },
});
