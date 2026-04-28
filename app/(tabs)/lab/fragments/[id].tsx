import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type LabFragment, type MoodIntensity, type MoodKind, useFragmentStore } from '@/stores';

const MOOD_OPTIONS: MoodKind[] = ['开心', '平静', '焦虑', '难过', '生气', '疲惫'];
const INTENSITY_OPTIONS: MoodIntensity[] = [1, 2, 3, 4, 5];

function formatDateTime(timestamp: number) {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function getListPath(fragment: LabFragment | null) {
  if (fragment?.type === 'mood') return '/(tabs)/lab/mood';
  if (fragment?.type === 'inspiration') return '/(tabs)/lab/inspiration';
  return '/(tabs)/lab';
}

export default function FragmentDetailScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const bottomPadding = tabBarHeight + insets.bottom + 40;

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const fragments = useFragmentStore((s) => s.fragments);
  const updateInspiration = useFragmentStore((s) => s.updateInspiration);
  const updateMood = useFragmentStore((s) => s.updateMood);
  const removeFragment = useFragmentStore((s) => s.removeFragment);

  const fragment = useMemo(() => fragments.find((x) => x.id === id) ?? null, [fragments, id]);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodKind>('平静');
  const [intensity, setIntensity] = useState<MoodIntensity>(3);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!fragment) return;
    setEditing(false);
    if (fragment.type === 'inspiration') {
      setContent(fragment.content);
      return;
    }
    setMood(fragment.mood);
    setIntensity(fragment.intensity);
    setNote(fragment.note);
  }, [fragment]);

  const canSave = fragment?.type === 'inspiration' ? content.trim().length > 0 : Boolean(fragment);

  function goBackToList() {
    router.replace(getListPath(fragment));
  }

  function saveChanges() {
    if (!fragment) return;
    if (fragment.type === 'inspiration') {
      const nextContent = content.trim();
      if (!nextContent) return;
      updateInspiration(fragment.id, { content: nextContent });
      setEditing(false);
      return;
    }
    updateMood(fragment.id, { mood, intensity, note });
    setEditing(false);
  }

  function confirmDelete() {
    if (!fragment) return;
    const targetPath = getListPath(fragment);
    Alert.alert('删除记录？', '确定删除这条碎片记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          removeFragment(fragment.id);
          router.replace(targetPath);
        },
      },
    ]);
  }

  if (!fragment) {
    return (
      <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)/lab')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>碎片详情</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.cardTitle}>记录不存在</ThemedText>
          <ThemedText style={[styles.bodyText, { color: mutedText }]}>这条记录可能已经被删除。</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <Pressable onPress={goBackToList} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
        </Pressable>
        <ThemedText style={styles.bigTitle}>{fragment.type === 'mood' ? '心情详情' : '灵感详情'}</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {fragment.type === 'inspiration' ? (
            editing ? (
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="灵感内容"
                placeholderTextColor={mutedText}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.largeInput, { color: mutedText, borderColor: cardBorder }]}
              />
            ) : (
              <ThemedText style={styles.fullText}>{fragment.content}</ThemedText>
            )
          ) : (
            <View style={styles.moodContent}>
              {editing ? (
                <>
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
                          <ThemedText style={[styles.choiceText, { color: isActive ? '#1D1B1E' : mutedText }]}>{option}</ThemedText>
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
                          <ThemedText style={[styles.choiceText, { color: isActive ? '#1D1B1E' : mutedText }]}>{option}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="备注"
                    placeholderTextColor={mutedText}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, { color: mutedText, borderColor: cardBorder }]}
                  />
                </>
              ) : (
                <>
                  <ThemedText style={styles.cardTitle}>{fragment.mood}</ThemedText>
                  <ThemedText style={[styles.bodyText, { color: mutedText }]}>强度 {fragment.intensity}/5</ThemedText>
                  <ThemedText style={styles.fullText}>{fragment.note.trim().length > 0 ? fragment.note : '没有备注'}</ThemedText>
                </>
              )}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.metaText, { color: mutedText }]}>创建：{formatDateTime(fragment.createdAt)}</ThemedText>
          {fragment.updatedAt ? (
            <ThemedText style={[styles.metaText, { color: mutedText }]}>更新：{formatDateTime(fragment.updatedAt)}</ThemedText>
          ) : null}
        </View>

        <View style={styles.actions}>
          {editing ? (
            <>
              <Pressable
                disabled={!canSave}
                onPress={saveChanges}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: accent, opacity: !canSave ? 0.45 : pressed ? 0.9 : 1 },
                ]}>
                <ThemedText style={styles.primaryText}>保存</ThemedText>
              </Pressable>
              <Pressable onPress={() => setEditing(false)} style={({ pressed }) => [styles.secondaryBtn, { borderColor: cardBorder, opacity: pressed ? 0.8 : 1 }]}>
                <ThemedText style={[styles.secondaryText, { color: mutedText }]}>取消</ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setEditing(true)} style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}>
              <ThemedText style={styles.primaryText}>修改</ThemedText>
            </Pressable>
          )}

          <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.8 : 1 }]}>
            <ThemedText style={styles.deleteText}>删除</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bigTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 0, textAlign: 'center' },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900', width: 40 },
  content: { gap: 12, paddingTop: 2 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '900' },
  fullText: { fontSize: 17, lineHeight: 25, fontWeight: '800' },
  bodyText: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  metaText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  moodContent: { gap: 12 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  choiceText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityChip: { width: 40, height: 36, borderWidth: 1.5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 88, borderWidth: 1, borderRadius: 14, padding: 12, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  largeInput: { minHeight: 180 },
  actions: { gap: 10 },
  primaryBtn: { borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#1D1B1E', fontSize: 15, lineHeight: 18, fontWeight: '900' },
  secondaryBtn: { borderWidth: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  secondaryText: { fontSize: 15, lineHeight: 18, fontWeight: '900' },
  deleteBtn: { borderRadius: 16, paddingVertical: 13, alignItems: 'center', backgroundColor: '#D96C6C' },
  deleteText: { color: '#fff', fontSize: 15, lineHeight: 18, fontWeight: '900' },
});
