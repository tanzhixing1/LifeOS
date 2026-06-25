import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getMoodLabel, getMoodMeta, MOOD_META, MOOD_OPTIONS, type MoodIntensity, type MoodKind } from '@/core/constants/mood';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { parseFragmentTagInput } from '@/features/fragments/tags';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type MoodFragment, useFragmentStore } from '@/stores';

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
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

  const [mood, setMood] = useState<MoodKind>('平静');
  const [intensity, setIntensity] = useState<MoodIntensity>(3);
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');

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
    addMood({ mood, intensity, note, tags: parseFragmentTagInput(tagInput) });
    setNote('');
    setTagInput('');
  }

  function confirmDelete(item: MoodFragment) {
    Alert.alert('删除心情？', `确定删除「${getMoodLabel(item.mood)} · ${item.intensity}」这条记录吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => removeFragment(item.id),
      },
    ]);
  }

  return (
    <ScreenScaffold>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/(tabs)/lab')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
        </Pressable>
        <View style={styles.titleWrap}>
          <ThemedText style={[styles.kicker, { color: palette.accentStrong }]}>MOOD OBSERVATORY</ThemedText>
          <ThemedText style={styles.bigTitle}>心情碎片</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={moods}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: uiTokens.spacing.md }} />}
        ListHeaderComponent={
          <View style={styles.topContent}>
            <SectionCard elevated style={[styles.moodInputCard, { borderColor: MOOD_META[mood].color }]}>
              <View style={[styles.moodHalo, { backgroundColor: MOOD_META[mood].bg }]} />
              <View style={styles.noteHeader}>
                <ThemedText style={styles.sectionTitle}>今天的气候</ThemedText>
                <ThemedText style={[styles.moodMark, { color: MOOD_META[mood].color }]}>{MOOD_META[mood].mark}</ThemedText>
              </View>

              <ThemedText style={[styles.label, { color: palette.muted }]}>心情</ThemedText>
              <View style={styles.optionGrid}>
                {MOOD_OPTIONS.map((option) => {
                  const meta = MOOD_META[option];
                  const selected = option === mood;
                  return (
                    <AppChip
                      key={option}
                      title={`${meta.mark} ${option}`}
                      selected={selected}
                      onPress={() => setMood(option)}
                      style={selected ? { backgroundColor: meta.bg, borderColor: meta.color } : undefined}
                      textStyle={selected ? { color: meta.color } : undefined}
                    />
                  );
                })}
              </View>

              <ThemedText style={[styles.label, { color: palette.muted }]}>强度</ThemedText>
              <View style={styles.intensityRow}>
                {INTENSITY_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setIntensity(option)}
                    style={({ pressed }) => [
                      styles.intensityButton,
                      {
                        borderColor: option <= intensity ? MOOD_META[mood].color : palette.border,
                        backgroundColor: option <= intensity ? MOOD_META[mood].bg : 'transparent',
                        opacity: pressed ? 0.84 : 1,
                      },
                    ]}>
                    <ThemedText style={[styles.intensityText, { color: option <= intensity ? MOOD_META[mood].color : palette.muted }]}>{option}</ThemedText>
                    <View style={[styles.intensityDot, { backgroundColor: option <= intensity ? MOOD_META[mood].color : palette.border }]} />
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="备注可以空着，也可以把此刻说清楚。"
                placeholderTextColor={palette.muted}
                multiline
                style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
                textAlignVertical="top"
              />
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="标签，可用空格或逗号分隔，例如 疲惫 睡眠"
                placeholderTextColor={palette.muted}
                style={[styles.tagInput, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
              />

              <AppButton onPress={saveMood} title="保存心情" />
            </SectionCard>

            <View style={styles.sectionHeader}>
              <View>
                <ThemedText style={styles.sectionTitle}>最近心情</ThemedText>
                <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>像天气一样记录，不必解释全部。</ThemedText>
              </View>
              <ThemedText style={[styles.countText, { color: palette.muted }]}>{moods.length} 条</ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <ThemedText style={[styles.emptyMark, { color: palette.accentStrong }]}>☾</ThemedText>
            <ThemedText style={[styles.emptyText, { color: palette.muted }]}>还没有心情碎片。先随手记一条，把今天留一个轻轻的标记。</ThemedText>
          </SectionCard>
        }
        renderItem={({ item }) => {
          const meta = getMoodMeta(item.mood);
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/(tabs)/lab/fragments/[id]', params: { id: item.id } })}
              style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
              <SectionCard elevated style={[styles.recordCard, { borderColor: meta.color }]}>
                <View style={[styles.moodRibbon, { backgroundColor: meta.bg }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <ThemedText style={[styles.cardTitle, { color: meta.color }]}>{meta.mark} {getMoodLabel(item.mood)}</ThemedText>
                    <ThemedText style={[styles.cardMeta, { color: palette.muted }]}>强度 {item.intensity}/5</ThemedText>
                  </View>
                  <View style={styles.miniMeter}>
                    {INTENSITY_OPTIONS.map((level) => (
                      <View key={level} style={[styles.miniMeterDot, { backgroundColor: level <= item.intensity ? meta.color : palette.border }]} />
                    ))}
                  </View>
                  {item.note.trim().length > 0 ? (
                    <ThemedText style={styles.cardNote}>{item.note}</ThemedText>
                  ) : (
                    <ThemedText style={[styles.cardNote, { color: palette.muted }]}>没有备注</ThemedText>
                  )}
                  {item.tags?.length ? (
                    <View style={styles.tagRow}>
                      {item.tags.map((tag) => (
                        <AppChip key={tag} title={tag} style={styles.tagChip} />
                      ))}
                    </View>
                  ) : null}
                  <ThemedText style={[styles.cardTime, { color: palette.muted }]}>{formatCreatedAt(item.createdAt)}</ThemedText>
                </View>
                <AppButton variant="ghost" title="删除" onPress={() => confirmDelete(item)} textStyle={{ color: palette.danger }} style={styles.deleteBtn} />
              </SectionCard>
            </Pressable>
          );
        }}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: { alignItems: 'center', gap: 2 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.1 },
  bigTitle: uiTokens.typography.pageTitle,
  backText: { ...uiTokens.typography.chip, width: 40 },
  listContent: { paddingTop: 2, paddingBottom: 150 },
  topContent: { gap: uiTokens.spacing.md, paddingBottom: uiTokens.spacing.md },
  moodInputCard: { overflow: 'hidden' },
  moodHalo: { position: 'absolute', right: -24, top: -26, width: 108, height: 108, borderRadius: 999 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moodMark: { fontSize: 28, lineHeight: 32, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  sectionTitle: uiTokens.typography.sectionTitle,
  sectionSub: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  label: { ...uiTokens.typography.chip, marginBottom: -4 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
  intensityRow: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  intensityButton: { flex: 1, minHeight: 46, borderWidth: 1.5, borderRadius: uiTokens.radius.md, alignItems: 'center', justifyContent: 'center', gap: 3 },
  intensityText: uiTokens.typography.chip,
  intensityDot: { width: 5, height: 5, borderRadius: 999 },
  input: { minHeight: 92, borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  tagInput: { minHeight: 44, borderWidth: 1, borderRadius: uiTokens.radius.md, paddingHorizontal: uiTokens.spacing.md, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.xs },
  tagChip: { paddingVertical: 5, paddingHorizontal: uiTokens.spacing.sm },
  countText: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  emptyCard: { alignItems: 'center', gap: uiTokens.spacing.sm },
  emptyMark: { fontSize: 24, lineHeight: 28, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
  recordCard: { flexDirection: 'row', gap: uiTokens.spacing.md, alignItems: 'flex-start', overflow: 'hidden' },
  moodRibbon: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 8 },
  cardBody: { flex: 1, gap: uiTokens.spacing.sm },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.sm },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '900' },
  cardMeta: uiTokens.typography.meta,
  miniMeter: { flexDirection: 'row', gap: 5 },
  miniMeterDot: { width: 18, height: 5, borderRadius: 999 },
  cardNote: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  cardTime: uiTokens.typography.meta,
  deleteBtn: { minHeight: 34, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 6, borderWidth: 0 },
});
