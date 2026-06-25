import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { mainNpcs } from '@/features/game/content/main';
import { gameItems, type ItemType } from '@/features/game/content/main/items/items';
import { canUseGameItem, consumeGameItem } from '@/features/game/items/useItem';
import { canGiveGift, giveGiftToNpc } from '@/features/game/relationships/gifts';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useRelationshipStore } from '@/stores/relationshipStore';

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  consumable: '消耗品',
  material: '材料',
  gift: '礼物',
  key: '重要物品',
  special: '特殊',
};

type BagFilterId = 'all' | 'daily' | ItemType;

const BAG_FILTERS: { id: BagFilterId; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'consumable', label: '消耗品' },
  { id: 'daily', label: '日用品' },
  { id: 'material', label: '材料' },
  { id: 'gift', label: '礼物' },
  { id: 'key', label: '重要物品' },
  { id: 'special', label: '特殊' },
];

const DAILY_TAGS = new Set(['日用', '早餐', '补给', '饮品', '照明', '小屋', '记录', '学习', '收纳', '清洁', '零食', '便携', '市集']);

export default function GameBagScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#FDF8ED', dark: '#1C1F22' }, 'background');
  const cardAlt = useThemeColor({ light: '#F7F0E3', dark: '#24282D' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8C9B8', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A6F62', dark: '#A7B0BE' }, 'text');
  const textColor = useThemeColor({ light: '#3D352E', dark: '#E4E4E7' }, 'text');
  const accent = useThemeColor({ light: '#B88452', dark: '#D8B174' }, 'tint');

  const items = useInventoryStore((s) => s.items);
  const relationships = useRelationshipStore((s) => s.relationships);
  const [selectedFilterId, setSelectedFilterId] = useState<BagFilterId>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const stacks = useMemo(
    () => Object.values(items).sort((a, b) => b.updatedAt - a.updatedAt),
    [items]
  );
  const filteredStacks = useMemo(
    () =>
      stacks.filter((stack) => {
        if (selectedFilterId === 'all') return true;
        const item = gameItems[stack.itemId];
        if (!item) return false;
        if (selectedFilterId === 'daily') return (item.tags ?? []).some((tag) => DAILY_TAGS.has(tag));
        return item.type === selectedFilterId;
      }),
    [selectedFilterId, stacks]
  );
  const hasAnyItem = stacks.length > 0;
  const selectedStack = selectedItemId ? items[selectedItemId] : undefined;
  const selectedItem = selectedStack ? gameItems[selectedStack.itemId] : undefined;
  const selectedName = selectedItem?.name ?? '未知物品';
  const selectedDescription = selectedItem?.description ?? '这个物品还没有详细说明。';
  const selectedIcon = selectedItem?.icon ?? '📦';
  const selectedTags = selectedItem?.tags ?? [];
  const selectedTypeLabel = selectedItem?.type ? ITEM_TYPE_LABELS[selectedItem.type] : '未分类';
  const selectedIsGiftable = selectedItem?.type === 'gift' || selectedItem?.giftable === true;
  const selectedCanUse = selectedStack ? canUseGameItem(selectedStack.itemId) : false;
  const selectedCanGift = selectedStack ? canGiveGift(selectedStack.itemId) : false;

  function handleUseSelectedItem() {
    if (!selectedStack) return;
    const result = consumeGameItem(selectedStack.itemId);
    Alert.alert(result.title, result.message);
  }

  function handleGiveGift(npcId: string) {
    if (!selectedStack) return;
    const result = giveGiftToNpc(npcId, selectedStack.itemId);
    Alert.alert(result.title, result.message);
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.replace('/(tabs)/game')} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
              <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
            </Pressable>
            <View style={styles.headerTitleBlock}>
              <ThemedText style={[styles.kicker, { color: accent }]}>WITCH BAG</ThemedText>
              <ThemedText style={[styles.bigTitle, { color: textColor }]}>魔女背包</ThemedText>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>这里存放你购入的小物。</ThemedText>
        </View>

        <View style={styles.filterSection}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>分类</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
            {BAG_FILTERS.map((filter) => {
              const active = filter.id === selectedFilterId;
              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setSelectedFilterId(filter.id)}
                  style={({ pressed }) => [
                    styles.filterTab,
                    {
                      borderColor: active ? accent : cardBorder,
                      backgroundColor: active ? 'rgba(184,132,82,0.16)' : cardBg,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}>
                  <ThemedText style={[styles.filterText, { color: active ? accent : mutedText }]}>{filter.label}</ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {!hasAnyItem ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>背包还是空的。</ThemedText>
            <ThemedText style={[styles.emptyText, { color: mutedText }]}>去杂货铺采购点什么吧。</ThemedText>
            <Pressable
              onPress={() => router.push('/(tabs)/game/shop')}
              style={({ pressed }) => [
                styles.shopButton,
                {
                  borderColor: accent,
                  backgroundColor: pressed ? 'rgba(184,132,82,0.24)' : 'rgba(184,132,82,0.12)',
                },
              ]}>
              <ThemedText style={[styles.shopButtonText, { color: accent }]}>去杂货铺采购</ThemedText>
            </Pressable>
          </View>
        ) : filteredStacks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>这里暂时还没有物品。</ThemedText>
          </View>
        ) : (
          <View style={styles.itemGrid}>
            {filteredStacks.map((stack) => {
              const item = gameItems[stack.itemId];
              const name = item?.name ?? '未知物品';
              const icon = item?.icon ?? '📦';

              return (
                <Pressable
                  key={stack.itemId}
                  onPress={() => setSelectedItemId(stack.itemId)}
                  style={({ pressed }) => [
                    styles.itemCell,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      opacity: pressed ? 0.84 : 1,
                    },
                  ]}>
                  <View style={[styles.quantityBadge, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
                    <ThemedText style={[styles.quantityText, { color: accent }]}>×{stack.quantity}</ThemedText>
                  </View>
                  <ThemedText style={styles.gridIcon}>{icon}</ThemedText>
                  <ThemedText style={[styles.gridName, { color: textColor }]} numberOfLines={1}>
                    {name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={Boolean(selectedStack)} transparent animationType="fade" onRequestClose={() => setSelectedItemId(null)}>
        <View style={styles.modalBackdrop}>
          <ScrollView
            style={styles.detailScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.detailCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.detailIconBubble, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
              <ThemedText style={styles.detailIcon}>{selectedIcon}</ThemedText>
            </View>
            <ThemedText style={[styles.detailName, { color: textColor }]}>{selectedName}</ThemedText>
            <ThemedText style={[styles.detailDescription, { color: mutedText }]}>{selectedDescription}</ThemedText>
            {selectedCanUse ? (
              <View style={[styles.useHint, { backgroundColor: 'rgba(184,132,82,0.12)', borderColor: 'rgba(184,132,82,0.26)' }]}>
                <ThemedText style={[styles.useHintText, { color: mutedText }]}>可以现在使用，效果会立即作用到当前周目状态。</ThemedText>
              </View>
            ) : null}

            {selectedIsGiftable ? (
              <View style={[styles.giftHint, { backgroundColor: 'rgba(209,187,222,0.16)', borderColor: 'rgba(184,132,82,0.22)' }]}>
                <ThemedText style={[styles.giftHintTitle, { color: accent }]}>送礼已开启</ThemedText>
                <ThemedText style={[styles.giftHintText, { color: mutedText }]}>
                  这件小物可以送给莉莉丝。她收下后会提升一点羁绊。
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.detailMetaRow}>
              <View style={[styles.metaTag, { borderColor: cardBorder }]}>
                <ThemedText style={[styles.metaText, { color: mutedText }]}>数量 ×{selectedStack?.quantity ?? 0}</ThemedText>
              </View>
              <View style={[styles.metaTag, { borderColor: cardBorder }]}>
                <ThemedText style={[styles.metaText, { color: mutedText }]}>{selectedTypeLabel}</ThemedText>
              </View>
              {selectedIsGiftable ? (
                <View style={[styles.metaTag, { borderColor: accent, backgroundColor: 'rgba(209,187,222,0.14)' }]}>
                  <ThemedText style={[styles.metaText, { color: accent }]}>送礼已开启</ThemedText>
                </View>
              ) : null}
              {selectedTags.map((tag) => (
                <View key={`detail.${selectedStack?.itemId}.${tag}`} style={[styles.metaTag, { borderColor: cardBorder }]}>
                  <ThemedText style={[styles.metaText, { color: mutedText }]}>{tag}</ThemedText>
                </View>
              ))}
            </View>

            {selectedCanGift ? (
              <View style={styles.giftActionList}>
                {mainNpcs.map((npc) => {
                  const relationship = relationships[npc.id];
                  return (
                    <Pressable
                      key={npc.id}
                      onPress={() => handleGiveGift(npc.id)}
                      style={({ pressed }) => [
                        styles.giftButton,
                        {
                          borderColor: accent,
                          backgroundColor: pressed ? 'rgba(209,187,222,0.28)' : 'rgba(209,187,222,0.16)',
                        },
                      ]}>
                      <ThemedText style={[styles.giftButtonText, { color: accent }]}>送给{npc.name}</ThemedText>
                      <ThemedText style={[styles.giftBondText, { color: mutedText }]}>羁绊 {relationship?.bond ?? 0}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {selectedCanUse ? (
              <Pressable
                onPress={handleUseSelectedItem}
                style={({ pressed }) => [
                  styles.useButton,
                  {
                    borderColor: accent,
                    backgroundColor: pressed ? 'rgba(184,132,82,0.28)' : 'rgba(184,132,82,0.16)',
                  },
                ]}>
                <ThemedText style={[styles.useButtonText, { color: accent }]}>使用</ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => setSelectedItemId(null)}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  borderColor: accent,
                  backgroundColor: pressed ? 'rgba(184,132,82,0.24)' : 'rgba(184,132,82,0.12)',
                },
              ]}>
              <ThemedText style={[styles.closeButtonText, { color: accent }]}>关闭</ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, gap: 12 },
  header: { paddingTop: 4, paddingBottom: 4, gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backText: { width: 42, fontSize: 13, lineHeight: 16, fontWeight: '900' },
  headerTitleBlock: { flex: 1, alignItems: 'center', gap: 3 },
  headerSpacer: { width: 42 },
  kicker: { fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 1.4 },
  bigTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  filterSection: { gap: 8 },
  sectionTitle: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  filterTabs: { gap: 8, paddingRight: 4 },
  filterTab: { minHeight: 34, borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, justifyContent: 'center' },
  filterText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6, alignItems: 'center' },
  emptyTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  shopButton: { minHeight: 38, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  shopButtonText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  itemCell: {
    width: '31.5%',
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#3D352E',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quantityBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    minWidth: 28,
    minHeight: 20,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  gridIcon: { fontSize: 30, lineHeight: 36 },
  gridName: { width: '100%', fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31,26,22,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  detailScroll: { width: '100%', maxWidth: 360, maxHeight: '86%' },
  detailCard: { borderWidth: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 10 },
  detailIconBubble: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailIcon: { fontSize: 34, lineHeight: 40 },
  detailName: { fontSize: 18, lineHeight: 23, fontWeight: '900', textAlign: 'center' },
  detailDescription: { fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
  giftHint: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  giftHintTitle: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  giftHintText: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  giftActionList: { alignSelf: 'stretch', gap: 8 },
  giftButton: { minHeight: 44, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  giftButtonText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  giftBondText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  useHint: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  useHintText: { fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  detailMetaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  metaTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  metaText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  closeButton: { minHeight: 38, alignSelf: 'stretch', borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  closeButtonText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  useButton: { minHeight: 42, alignSelf: 'stretch', borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  useButtonText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
});
