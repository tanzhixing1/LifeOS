import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { parseFragmentTagInput } from '@/features/fragments/tags';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type InspirationFragment, useFragmentStore } from '@/stores';

function formatCreatedAt(timestamp: number) {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

export default function InspirationScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const fragments = useFragmentStore((s) => s.fragments);
  const addInspiration = useFragmentStore((s) => s.addInspiration);
  const removeFragment = useFragmentStore((s) => s.removeFragment);

  const inspirations = useMemo(
    () =>
      fragments
        .filter((x): x is InspirationFragment => x.type === 'inspiration')
        .sort((a, b) => b.createdAt - a.createdAt),
    [fragments]
  );

  const canSave = content.trim().length > 0;

  function saveInspiration() {
    const nextContent = content.trim();
    if (!nextContent) return;
    addInspiration({ content: nextContent, tags: parseFragmentTagInput(tagInput) });
    setContent('');
    setTagInput('');
  }

  function confirmDelete(item: InspirationFragment) {
    Alert.alert('删除灵感？', `确定删除「${item.content.slice(0, 24)}」吗？`, [
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
          <ThemedText style={[styles.kicker, { color: palette.accentStrong }]}>SPARK ARCHIVE</ThemedText>
          <ThemedText style={styles.bigTitle}>灵感碎片</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={inspirations}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: uiTokens.spacing.md }} />}
        ListHeaderComponent={
          <View style={styles.topContent}>
            <SectionCard elevated style={[styles.noteInputCard, { borderColor: palette.accent }]}>
              <View style={[styles.tape, { backgroundColor: palette.accentSoft }]} />
              <View style={styles.noteHeader}>
                <ThemedText style={styles.sectionTitle}>写下一点火花</ThemedText>
                <AppChip title="便签" selected style={styles.noteChip} />
              </View>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="先记下来，之后再理解。"
                placeholderTextColor={palette.muted}
                multiline
                style={[styles.input, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
                textAlignVertical="top"
              />
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="标签，可用空格或逗号分隔，例如 疲惫 项目"
                placeholderTextColor={palette.muted}
                style={[styles.tagInput, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
              />
              <AppButton disabled={!canSave} onPress={saveInspiration} title="保存灵感" />
            </SectionCard>

            <View style={styles.sectionHeader}>
              <View>
                <ThemedText style={styles.sectionTitle}>最近灵感</ThemedText>
                <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>一张张纸片，慢慢会变成地图。</ThemedText>
              </View>
              <ThemedText style={[styles.countText, { color: palette.muted }]}>{inspirations.length} 条</ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <SectionCard style={styles.emptyCard}>
            <ThemedText style={[styles.emptyMark, { color: palette.accentStrong }]}>✦</ThemedText>
            <ThemedText style={[styles.emptyText, { color: palette.muted }]}>还没有灵感碎片。第一条不用写得漂亮，像把一片叶子夹进书里就好。</ThemedText>
          </SectionCard>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/lab/fragments/[id]', params: { id: item.id } })}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
            <SectionCard elevated style={[styles.recordCard, index % 2 === 0 ? styles.paperTiltA : styles.paperTiltB]}>
              <View style={[styles.paperStripe, { backgroundColor: palette.accentSoft }]} />
              <View style={styles.cardBody}>
                <ThemedText style={styles.cardContent}>{item.content}</ThemedText>
                {item.tags?.length ? (
                  <View style={styles.tagRow}>
                    {item.tags.map((tag) => (
                      <AppChip key={tag} title={tag} style={styles.tagChip} />
                    ))}
                  </View>
                ) : null}
                <View style={styles.cardFooter}>
                  <ThemedText style={[styles.cardTime, { color: palette.muted }]}>{formatCreatedAt(item.createdAt)}</ThemedText>
                  <ThemedText style={[styles.spark, { color: palette.accentStrong }]}>✦</ThemedText>
                </View>
              </View>
              <AppButton variant="ghost" title="删除" onPress={() => confirmDelete(item)} textStyle={{ color: palette.danger }} style={styles.deleteBtn} />
            </SectionCard>
          </Pressable>
        )}
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
  noteInputCard: { paddingTop: 20, overflow: 'hidden' },
  tape: { position: 'absolute', top: 0, alignSelf: 'center', width: 86, height: 12, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteChip: { paddingVertical: 6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  sectionTitle: uiTokens.typography.sectionTitle,
  sectionSub: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  countText: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  input: { minHeight: 124, borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  tagInput: { minHeight: 44, borderWidth: 1, borderRadius: uiTokens.radius.md, paddingHorizontal: uiTokens.spacing.md, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.xs },
  tagChip: { paddingVertical: 5, paddingHorizontal: uiTokens.spacing.sm },
  emptyCard: { alignItems: 'center', gap: uiTokens.spacing.sm },
  emptyMark: { fontSize: 24, lineHeight: 28, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
  recordCard: { flexDirection: 'row', gap: uiTokens.spacing.md, alignItems: 'flex-start', paddingLeft: 18, overflow: 'hidden' },
  paperTiltA: { transform: [{ rotate: '-0.3deg' }] },
  paperTiltB: { transform: [{ rotate: '0.25deg' }] },
  paperStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  cardBody: { flex: 1, gap: uiTokens.spacing.sm },
  cardContent: { fontSize: 16, lineHeight: 23, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTime: uiTokens.typography.meta,
  spark: { fontSize: 14, lineHeight: 16, fontWeight: '900' },
  deleteBtn: { minHeight: 34, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 6, borderWidth: 0 },
});
