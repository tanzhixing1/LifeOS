import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getMoodMeta } from '@/core/constants/mood';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import {
  formatFragmentTime,
  getFragmentCreatedAt,
  getFragmentSummary,
  getFragmentTags,
  getFragmentTitle,
  getFragmentTypeLabel,
  matchesFragmentSearch,
} from '@/features/fragments/selectors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type FragmentType, type LabFragment, useFragmentStore } from '@/stores';

type FragmentTab = FragmentType;

type EmptyStateConfig = {
  title: string;
  buttonLabel: string;
  route: '/(tabs)/lab/inspiration' | '/(tabs)/lab/mood';
};

const TAB_OPTIONS: { id: FragmentTab; label: string }[] = [
  { id: 'inspiration', label: '灵感碎片' },
  { id: 'mood', label: '心情碎片' },
];

const EMPTY_STATE_BY_TAB: Record<FragmentTab, EmptyStateConfig> = {
  inspiration: {
    title: '还没有可以抽取的灵感碎片。先去记录一条灵感吧。',
    buttonLabel: '去记录灵感',
    route: '/(tabs)/lab/inspiration',
  },
  mood: {
    title: '还没有可以抽取的心情碎片。先去写下一点今天的心情吧。',
    buttonLabel: '去记录心情',
    route: '/(tabs)/lab/mood',
  },
};

export default function FragmentDrawScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];

  const fragments = useFragmentStore((s) => s.fragments);
  const favoriteIds = useFragmentStore((s) => s.favoriteIds);
  const recentDrawIds = useFragmentStore((s) => s.recentDrawIds);
  const lastDrawnId = useFragmentStore((s) => s.lastDrawnId);
  const toggleFavorite = useFragmentStore((s) => s.toggleFavorite);
  const recordDraw = useFragmentStore((s) => s.recordDraw);

  const [activeTab, setActiveTab] = useState<FragmentTab>('inspiration');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const revealOpacity = useRef(new Animated.Value(1)).current;
  const revealScale = useRef(new Animated.Value(1)).current;
  const drawTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabFragments = useMemo(
    () =>
      fragments
        .filter((fragment): fragment is Extract<LabFragment, { type: FragmentTab }> => fragment.type === activeTab)
        .sort((a, b) => getFragmentCreatedAt(b) - getFragmentCreatedAt(a)),
    [activeTab, fragments]
  );

  const availableTags = useMemo(
    () =>
      Array.from(new Set(tabFragments.flatMap((fragment) => getFragmentTags(fragment)).filter((tag) => tag.length > 0))).sort((a, b) =>
        a.localeCompare(b, 'zh-CN')
      ),
    [tabFragments]
  );

  const filteredFragments = useMemo(
    () =>
      tabFragments.filter((fragment) => {
        const matchesQuery = matchesFragmentSearch(fragment, searchQuery);
        const matchesTag = !selectedTag || getFragmentTags(fragment).includes(selectedTag);
        return matchesQuery && matchesTag;
      }),
    [searchQuery, selectedTag, tabFragments]
  );

  const recentFragments = useMemo(
    () =>
      recentDrawIds[activeTab]
        .map((id) => fragments.find((fragment) => fragment.id === id && fragment.type === activeTab) ?? null)
        .filter((fragment): fragment is Extract<LabFragment, { type: FragmentTab }> => Boolean(fragment))
        .slice(0, 5),
    [activeTab, fragments, recentDrawIds]
  );

  const activePreview = useMemo(() => {
    if (!activePreviewId) return null;
    return fragments.find((fragment) => fragment.id === activePreviewId && fragment.type === activeTab) ?? null;
  }, [activePreviewId, activeTab, fragments]);

  useEffect(() => {
    return () => {
      if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setSearchQuery('');
    setSelectedTag(null);
    setIsDrawing(false);
    if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
  }, [activeTab]);

  useEffect(() => {
    if (activePreview && activePreview.type === activeTab) return;
    const nextIdCandidates = [lastDrawnId[activeTab], recentFragments[0]?.id, filteredFragments[0]?.id];
    const nextId = nextIdCandidates.find((id) => typeof id === 'string' && id.length > 0) ?? null;
    setActivePreviewId(nextId);
  }, [activePreview, activeTab, filteredFragments, lastDrawnId, recentFragments]);

  function runRevealAnimation() {
    revealOpacity.setValue(0.2);
    revealScale.setValue(0.96);
    Animated.parallel([
      Animated.timing(revealOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(revealScale, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function drawRandomFragment() {
    if (filteredFragments.length === 0 || isDrawing) return;
    const nextFragment = filteredFragments[Math.floor(Math.random() * filteredFragments.length)] ?? null;
    if (!nextFragment) return;

    setIsDrawing(true);
    if (drawTimeoutRef.current) clearTimeout(drawTimeoutRef.current);
    drawTimeoutRef.current = setTimeout(() => {
      setActivePreviewId(nextFragment.id);
      recordDraw(activeTab, nextFragment.id);
      setIsDrawing(false);
      runRevealAnimation();
    }, 520);
  }

  function openFragmentDetail(id: string) {
    router.push({ pathname: '/(tabs)/lab/fragments/[id]', params: { id } });
  }

  const emptyState = EMPTY_STATE_BY_TAB[activeTab];
  const hasAnyFragments = tabFragments.length > 0;
  const hasActiveFilters = searchQuery.trim().length > 0 || Boolean(selectedTag);
  const resultSectionTitle = hasActiveFilters ? '检索结果' : '全部碎片';

  return (
    <ScreenScaffold withTabPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)/lab')} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={[styles.backText, { color: palette.muted }]}>返回</ThemedText>
          </Pressable>
          <View style={styles.titleWrap}>
            <ThemedText style={[styles.kicker, { color: palette.accentStrong }]}>FRAGMENT DRAWER</ThemedText>
            <ThemedText style={styles.bigTitle}>碎片抽取</ThemedText>
            <ThemedText style={[styles.subtitle, { color: palette.muted }]}>从你已经记录过的碎片里，抽一枚现在需要的提示。</ThemedText>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabRow}>
          {TAB_OPTIONS.map((tab) => (
            <AppChip key={tab.id} title={tab.label} selected={tab.id === activeTab} onPress={() => setActiveTab(tab.id)} style={styles.tabChip} />
          ))}
        </View>

        <SectionCard elevated style={[styles.heroCard, { borderColor: palette.accent }]}>
          <View style={[styles.heroGlow, { backgroundColor: activeTab === 'mood' ? 'rgba(125,154,138,0.14)' : 'rgba(209,187,222,0.16)' }]} />
          <ThemedText style={[styles.heroLabel, { color: palette.accentStrong }]}>本次抽到</ThemedText>

          <Animated.View style={{ opacity: revealOpacity, transform: [{ scale: revealScale }] }}>
            {isDrawing ? (
              <View style={styles.heroBody}>
                <ThemedText style={styles.heroTitle}>碎片正在浮现…</ThemedText>
                <ThemedText style={[styles.heroSummary, { color: palette.muted }]}>✦ ☾ ✧</ThemedText>
                <ThemedText style={[styles.heroMeta, { color: palette.muted }]}>先轻轻翻找一下你已经记下来的线索。</ThemedText>
              </View>
            ) : activePreview ? (
              <Pressable onPress={() => openFragmentDetail(activePreview.id)} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
                <View style={styles.heroBody}>
                  <ThemedText style={styles.heroTitle}>{getFragmentTitle(activePreview)}</ThemedText>
                  <ThemedText style={[styles.heroSummary, { color: palette.muted }]}>{getFragmentSummary(activePreview)}</ThemedText>
                  <ThemedText style={[styles.heroMeta, { color: palette.muted }]}>
                    {getFragmentTypeLabel(activePreview.type)} · {formatFragmentTime(getFragmentCreatedAt(activePreview))}
                  </ThemedText>
                </View>
              </Pressable>
            ) : (
              <View style={styles.heroBody}>
                <ThemedText style={styles.heroTitle}>还没有抽出碎片</ThemedText>
                <ThemedText style={[styles.heroSummary, { color: palette.muted }]}>先按一下抽取按钮，看看现在最想被你看见的是哪一条。</ThemedText>
              </View>
            )}
          </Animated.View>

          <AppButton
            title={isDrawing ? '正在翻找碎片…' : activeTab === 'inspiration' ? '抽一枚灵感' : '抽一枚心情'}
            onPress={drawRandomFragment}
            disabled={filteredFragments.length === 0 || isDrawing}
          />
        </SectionCard>

        <SectionCard style={styles.searchCard}>
          <ThemedText style={styles.sectionTitle}>检索</ThemedText>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={activeTab === 'inspiration' ? '搜一搜灵感内容里的关键词' : '搜一搜心情、备注或强度数字'}
            placeholderTextColor={palette.muted}
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.searchInput, { color: palette.text, backgroundColor: palette.input, borderColor: palette.border }]}
          />

          <View style={styles.tagHeader}>
            <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>标签筛选</ThemedText>
            {selectedTag ? (
              <Pressable onPress={() => setSelectedTag(null)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <ThemedText style={[styles.clearText, { color: palette.accentStrong }]}>清除筛选</ThemedText>
              </Pressable>
            ) : null}
          </View>

          {availableTags.length > 0 ? (
            <View style={styles.tagRow}>
              {availableTags.map((tag) => (
                <AppChip key={tag} title={tag} selected={tag === selectedTag} onPress={() => setSelectedTag(tag === selectedTag ? null : tag)} />
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>暂无标签</ThemedText>
          )}
        </SectionCard>

        <SectionCard style={styles.recentCard}>
          <View style={styles.recentHeader}>
            <ThemedText style={styles.sectionTitle}>最近抽取</ThemedText>
            <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>这里显示最近 5 条，点一下就能重新放回顶部。</ThemedText>
          </View>

          {recentFragments.length > 0 ? (
            <View style={styles.recentList}>
              {recentFragments.map((fragment) => {
                const favorite = favoriteIds.includes(fragment.id);
                const moodMeta = fragment.type === 'mood' ? getMoodMeta(fragment.mood) : null;
                return (
                  <Pressable
                    key={fragment.id}
                    onPress={() => setActivePreviewId(fragment.id)}
                    style={({ pressed }) => [
                      styles.recentItem,
                      {
                        borderColor: moodMeta?.color ?? palette.border,
                        backgroundColor: pressed ? palette.cardAlt : 'transparent',
                      },
                    ]}>
                    <View style={styles.recentItemBody}>
                      <ThemedText style={styles.recentTitle}>{getFragmentTitle(fragment)}</ThemedText>
                      <ThemedText style={[styles.recentMeta, { color: palette.muted }]}>{formatFragmentTime(getFragmentCreatedAt(fragment))}</ThemedText>
                    </View>
                    {favorite ? <ThemedText style={[styles.favoriteMark, { color: palette.accentStrong }]}>已收藏</ThemedText> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <ThemedText style={[styles.sectionSub, { color: palette.muted }]}>还没有最近抽取记录。</ThemedText>
          )}
        </SectionCard>

        {!hasAnyFragments ? (
          <SectionCard elevated style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>{emptyState.title}</ThemedText>
            <AppButton title={emptyState.buttonLabel} onPress={() => router.push(emptyState.route)} />
          </SectionCard>
        ) : filteredFragments.length === 0 ? (
          <SectionCard elevated style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>没有找到匹配的碎片，换个关键词试试。</ThemedText>
          </SectionCard>
        ) : (
          <View style={styles.listSection}>
            <View style={styles.resultHeader}>
              <ThemedText style={styles.sectionTitle}>{resultSectionTitle}</ThemedText>
              <ThemedText style={[styles.resultCount, { color: palette.muted }]}>共 {filteredFragments.length} 条</ThemedText>
            </View>
            <View style={styles.list}>
              {filteredFragments.map((fragment) => {
                const favorite = favoriteIds.includes(fragment.id);
                const tags = getFragmentTags(fragment);
                return (
                  <Pressable
                    key={fragment.id}
                    onPress={() => openFragmentDetail(fragment.id)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
                    <SectionCard elevated style={styles.fragmentCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardTitleBlock}>
                          <ThemedText style={styles.cardTitle}>{getFragmentTitle(fragment)}</ThemedText>
                          <ThemedText style={[styles.cardMeta, { color: palette.muted }]}>{formatFragmentTime(getFragmentCreatedAt(fragment))}</ThemedText>
                        </View>
                        <AppButton
                          variant={favorite ? 'primary' : 'outline'}
                          title={favorite ? '已收藏' : '收藏'}
                          onPress={(event) => {
                            event.stopPropagation();
                            toggleFavorite(fragment.id);
                          }}
                          style={styles.favoriteButton}
                          textStyle={favorite ? { color: '#1D1B1E' } : undefined}
                        />
                      </View>

                      <ThemedText style={[styles.cardSummary, { color: palette.muted }]}>{getFragmentSummary(fragment)}</ThemedText>

                      {tags.length > 0 ? (
                        <View style={styles.cardTags}>
                          {tags.map((tag) => (
                            <AppChip key={`${fragment.id}.${tag}`} title={tag} />
                          ))}
                        </View>
                      ) : null}
                    </SectionCard>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: uiTokens.spacing.md,
    paddingBottom: uiTokens.spacing.xxl + 120,
  },
  header: {
    paddingTop: uiTokens.layout.headerPaddingTop,
    paddingBottom: uiTokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  backText: { ...uiTokens.typography.chip, width: 40 },
  titleWrap: { flex: 1, alignItems: 'center', gap: 4 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.1 },
  bigTitle: uiTokens.typography.pageTitle,
  subtitle: { fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: uiTokens.spacing.sm },
  tabChip: { flex: 1 },
  heroCard: { overflow: 'hidden', padding: 16, gap: uiTokens.spacing.sm },
  heroGlow: { position: 'absolute', right: -30, top: -34, width: 118, height: 118, borderRadius: 999 },
  heroLabel: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 1.1 },
  heroBody: { gap: uiTokens.spacing.xs, paddingBottom: 2, minHeight: 88, justifyContent: 'center' },
  heroTitle: { fontSize: 18, lineHeight: 24, fontWeight: '900' },
  heroSummary: { fontSize: 13, lineHeight: 19, fontWeight: '800' },
  heroMeta: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  searchCard: { gap: uiTokens.spacing.sm },
  sectionTitle: uiTokens.typography.sectionTitle,
  sectionSub: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  searchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: uiTokens.radius.md,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  tagHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.sm },
  clearText: { fontSize: 12, lineHeight: 16, fontWeight: '900' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
  recentCard: { gap: uiTokens.spacing.sm, paddingVertical: uiTokens.spacing.md },
  recentHeader: { gap: 3 },
  recentList: { gap: uiTokens.spacing.sm },
  recentItem: {
    borderWidth: 1,
    borderRadius: uiTokens.radius.md,
    paddingHorizontal: uiTokens.spacing.md,
    paddingVertical: uiTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: uiTokens.spacing.sm,
  },
  recentItemBody: { flex: 1, gap: 2 },
  recentTitle: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  recentMeta: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  favoriteMark: { fontSize: 11, lineHeight: 15, fontWeight: '900' },
  emptyCard: { alignItems: 'center' },
  emptyTitle: { fontSize: 14, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  listSection: { gap: uiTokens.spacing.sm },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.sm },
  resultCount: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  list: { gap: uiTokens.spacing.md },
  fragmentCard: { gap: uiTokens.spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: uiTokens.spacing.sm },
  cardTitleBlock: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: '900' },
  cardMeta: { fontSize: 11, lineHeight: 15, fontWeight: '800' },
  favoriteButton: { minHeight: 34, paddingHorizontal: uiTokens.spacing.md, paddingVertical: 6 },
  cardSummary: { fontSize: 14, lineHeight: 20, fontWeight: '800' },
  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
});
