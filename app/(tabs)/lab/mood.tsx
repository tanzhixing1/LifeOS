import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type MoodFragment, type MoodIntensity, type MoodKind, useFragmentStore } from '@/stores';

const MOOD_OPTIONS: MoodKind[] = ['开心', '平静', '焦虑', '难过', '生气', '疲惫'];
const INTENSITY_OPTIONS: MoodIntensity[] = [1, 2, 3, 4, 5];

function formatCreatedAt(timestamp: number) {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

export default function MoodScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listBottomPadding = tabBarHeight + insets.bottom + 40;

  const [mood, setMood] = useState<MoodKind>('平静');
  const [intensity, setIntensity] = useState<MoodIntensity>(3);
  const [note, setNote] = useState('');

  const fragments = useFragmentStore((s) => s.fragments);
  const addMood = useFragmentStore((s) => s.addMood);
  const removeFragment = useFragmentStore((s) => s.removeFragment);

  const moods = useMemo(
    () =>
      fragments
        .filter((x): x is MoodFragment => x.type === 'mood')
        .sort((a, b) => b.createdAt - a.createdAt),
    [fragments]
  );

  function saveMood() {
    addMood({ mood, intensity, note });
    setNote('');
  }

  function confirmDelete(item: MoodFragment) {
    Alert.alert('删除心情？', `确定删除「${item.mood} · ${item.intensity}」这条记录吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => removeFragment(item.id),
      },
    ]);
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)/lab')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
        </Pressable>
        <ThemedText style={styles.bigTitle}>心情碎片</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={moods}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={styles.topContent}>
            <View style={[styles.inputCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <ThemedText style={styles.label}>心情</ThemedText>
              <View style={styles.optionGrid}>
                {MOOD_OPTIONS.map((option) => {
                  const isActive = option === mood;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setMood(option)}
                      style={({ pressed }) => [
                        styles.choiceChip,
                        {
                          backgroundColor: isActive ? accent : 'transparent',
                          borderColor: isActive ? accent : cardBorder,
                          opacity: pressed ? 0.86 : 1,
                        },
                      ]}>
                      <ThemedText style={[styles.choiceText, { color: isActive ? '#1D1B1E' : mutedText }]}>
                        {option}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <ThemedText style={styles.label}>强度</ThemedText>
              <View style={styles.intensityRow}>
                {INTENSITY_OPTIONS.map((option) => {
                  const isActive = option === intensity;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setIntensity(option)}
                      style={({ pressed }) => [
                        styles.intensityChip,
                        {
                          backgroundColor: isActive ? accent : 'transparent',
                          borderColor: isActive ? accent : cardBorder,
                          opacity: pressed ? 0.86 : 1,
                        },
                      ]}>
                      <ThemedText style={[styles.choiceText, { color: isActive ? '#1D1B1E' : mutedText }]}>
                        {option}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="备注可以空着，也可以把此刻说清楚。"
                placeholderTextColor={mutedText}
                multiline
                style={[styles.input, { color: mutedText, borderColor: cardBorder }]}
                textAlignVertical="top"
              />

              <Pressable
                onPress={saveMood}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}>
                <ThemedText style={styles.primaryText}>保存心情</ThemedText>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>最近心情</ThemedText>
              <ThemedText style={[styles.countText, { color: mutedText }]}>{moods.length} 条</ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.emptyText, { color: mutedText }]}>还没有心情碎片。</ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/lab/fragments/[id]', params: { id: item.id } })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
            ]}>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <ThemedText style={styles.cardTitle}>{item.mood}</ThemedText>
                <ThemedText style={[styles.cardMeta, { color: mutedText }]}>强度 {item.intensity}/5</ThemedText>
              </View>
              {item.note.trim().length > 0 ? (
                <ThemedText style={styles.cardNote}>{item.note}</ThemedText>
              ) : (
                <ThemedText style={[styles.cardNote, { color: mutedText }]}>没有备注</ThemedText>
              )}
              <ThemedText style={[styles.cardTime, { color: mutedText }]}>{formatCreatedAt(item.createdAt)}</ThemedText>
            </View>
            <Pressable
              onPress={() => confirmDelete(item)}
              style={({ pressed }) => [styles.deleteBtn, { borderColor: cardBorder, opacity: pressed ? 0.75 : 1 }]}>
              <ThemedText style={styles.deleteText}>删除</ThemedText>
            </Pressable>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 0, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  listContent: { paddingTop: 2 },
  topContent: { gap: 12, paddingBottom: 12 },
  inputCard: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 12 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  choiceText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityChip: { width: 40, height: 36, borderWidth: 1.5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 84, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  primaryBtn: { borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#1D1B1E', fontSize: 15, lineHeight: 18, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  countText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardBody: { flex: 1, gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '900' },
  cardMeta: { fontSize: 12, lineHeight: 16, fontWeight: '900' },
  cardNote: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  cardTime: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  deleteBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  deleteText: { color: '#D96C6C', fontSize: 13, lineHeight: 16, fontWeight: '900' },
});
