import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getMoodLabel, getMoodMeta, normalizeMoodKind, MOOD_META, MOOD_OPTIONS, type MoodIntensity, type MoodKind } from '@/core/constants/mood';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type LabFragment, useFragmentStore } from '@/stores';

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
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

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
    setMood(normalizeMoodKind(fragment.mood));
    setIntensity(fragment.intensity);
    setNote(fragment.note);
  }, [fragment]);

  const canSave = fragment?.type === 'inspiration' ? content.trim().length > 0 : Boolean(fragment);
  const moodMeta = fragment?.type === 'mood' ? getMoodMeta(fragment.mood) : null;

  function goBackToList() {
    router.replace(getListPath(fragment) as any);
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
          router.replace(targetPath as any);
        },
      },
    ]);
  }

  if (!fragment) {
    return (
      <ScreenScaffold scroll>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)/lab')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
          </Pressable>
          <ThemedText style={styles.bigTitle}>碎片详情</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <SectionCard elevated style={styles.missingCard}>
          <ThemedText style={[styles.emptyMark, { color: palette.accentStrong }]}>?</ThemedText>
          <ThemedText style={styles.cardTitle}>记录不存在</ThemedText>
          <ThemedText style={[styles.bodyText, { color: palette.muted }]}>这条记录可能已经被删除。</ThemedText>
        </SectionCard>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={goBackToList} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
        </Pressable>
        <View style={styles.titleWrap}>
          <ThemedText style={[styles.kicker, { color: palette.accentStrong }]}>FRAGMENT PAGE</ThemedText>
          <ThemedText style={styles.bigTitle}>{fragment.type === 'mood' ? '心情详情' : '灵感详情'}</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <SectionCard elevated style={[styles.readingCard, fragment.type === 'mood' && moodMeta ? { borderColor: moodMeta.color } : { borderColor: palette.accent }]}>
        <View style={[styles.paperGlow, { backgroundColor: fragment.type === 'mood' && moodMeta ? moodMeta.bg : palette.accentSoft }]} />
        <View style={styles.detailHeader}>
          <ThemedText style={[styles.detailMark, { color: fragment.type === 'mood' && moodMeta ? moodMeta.color : palette.accentStrong }]}>
            {fragment.type === 'mood' && moodMeta ? moodMeta.mark : '✦'}
          </ThemedText>
          <ThemedText style={[styles.detailType, { color: palette.muted }]}>{fragment.type === 'mood' ? '情绪观察' : '灵感纸片'}</ThemedText>
        </View>

        <View style={[styles.rule, { backgroundColor: palette.border }]} />

        {fragment.type === 'inspiration' ? (
          editing ? (
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="灵感内容"
              placeholderTextColor={palette.muted}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.largeInput, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
            />
          ) : (
            <ThemedText style={styles.fullText}>{fragment.content}</ThemedText>
          )
        ) : (
          <View style={styles.moodContent}>
            {editing ? (
              <>
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
                    <AppChip key={option} title={String(option)} selected={option === intensity} onPress={() => setIntensity(option)} style={styles.intensityChip} />
                  ))}
                </View>

                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="备注"
                  placeholderTextColor={palette.muted}
                  multiline
                  textAlignVertical="top"
                  style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
                />
              </>
            ) : (
              <>
                <View style={styles.moodTitleRow}>
                  <ThemedText style={[styles.cardTitle, { color: moodMeta?.color ?? palette.text }]}>{getMoodLabel(fragment.mood)}</ThemedText>
                  <ThemedText style={[styles.bodyText, { color: palette.muted }]}>强度 {fragment.intensity}/5</ThemedText>
                </View>
                <View style={styles.miniMeter}>
                  {INTENSITY_OPTIONS.map((level) => (
                    <View key={level} style={[styles.miniMeterDot, { backgroundColor: moodMeta && level <= fragment.intensity ? moodMeta.color : palette.border }]} />
                  ))}
                </View>
                <ThemedText style={styles.fullText}>{fragment.note.trim().length > 0 ? fragment.note : '没有备注'}</ThemedText>
              </>
            )}
          </View>
        )}
      </SectionCard>

      <SectionCard style={styles.metaCard}>
        <ThemedText style={[styles.metaText, { color: palette.muted }]}>创建：{formatDateTime(fragment.createdAt)}</ThemedText>
        {fragment.updatedAt ? (
          <ThemedText style={[styles.metaText, { color: palette.muted }]}>更新：{formatDateTime(fragment.updatedAt)}</ThemedText>
        ) : null}
      </SectionCard>

      <View style={styles.actions}>
        {editing ? (
          <>
            <AppButton disabled={!canSave} title="保存" onPress={saveChanges} />
            <AppButton variant="outline" title="取消" onPress={() => setEditing(false)} />
          </>
        ) : (
          <AppButton title="修改" onPress={() => setEditing(true)} />
        )}

        <AppButton variant="danger" title="删除" onPress={confirmDelete} />
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: { gap: uiTokens.spacing.md },
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleWrap: { alignItems: 'center', gap: 2 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.1 },
  bigTitle: uiTokens.typography.pageTitle,
  backText: { ...uiTokens.typography.chip, width: 40 },
  missingCard: { alignItems: 'center' },
  emptyMark: { fontSize: 24, lineHeight: 28, fontWeight: '900' },
  readingCard: { gap: uiTokens.spacing.md, overflow: 'hidden', padding: 18 },
  paperGlow: { position: 'absolute', right: -36, top: -36, width: 130, height: 130, borderRadius: 999 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailMark: { fontSize: 28, lineHeight: 32, fontWeight: '900' },
  detailType: { ...uiTokens.typography.meta, letterSpacing: 1 },
  rule: { height: 1, opacity: 0.85 },
  cardTitle: { fontSize: 22, lineHeight: 28, fontWeight: '900' },
  fullText: { fontSize: 17, lineHeight: 27, fontWeight: '800' },
  bodyText: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  metaCard: { paddingVertical: uiTokens.spacing.md },
  metaText: uiTokens.typography.meta,
  moodContent: { gap: uiTokens.spacing.md },
  moodTitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  label: uiTokens.typography.chip,
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
  intensityRow: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  intensityChip: { width: 42, paddingHorizontal: 0 },
  miniMeter: { flexDirection: 'row', gap: 5 },
  miniMeterDot: { width: 22, height: 6, borderRadius: 999 },
  input: { minHeight: 92, borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  largeInput: { minHeight: 190 },
  actions: { gap: uiTokens.spacing.sm },
});
