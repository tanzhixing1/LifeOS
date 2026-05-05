import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { gameItems, type ItemType } from '@/features/game/content/main/items/items';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInventoryStore } from '@/stores/inventoryStore';

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  consumable: '消耗品',
  material: '材料',
  gift: '礼物',
  key: '重要物品',
  special: '特殊',
};

export default function GameBagScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#FDF8ED', dark: '#1C1F22' }, 'background');
  const cardAlt = useThemeColor({ light: '#F7F0E3', dark: '#24282D' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8C9B8', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A6F62', dark: '#A7B0BE' }, 'text');
  const textColor = useThemeColor({ light: '#3D352E', dark: '#E4E4E7' }, 'text');
  const accent = useThemeColor({ light: '#B88452', dark: '#D8B174' }, 'tint');

  const items = useInventoryStore((s) => s.items);
  const stacks = useMemo(
    () => Object.values(items).sort((a, b) => b.updatedAt - a.updatedAt),
    [items]
  );

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

        {stacks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>背包还是空的。</ThemedText>
            <ThemedText style={[styles.emptyText, { color: mutedText }]}>去杂货铺采购点什么吧。</ThemedText>
          </View>
        ) : (
          <View style={styles.itemList}>
            {stacks.map((stack) => {
              const item = gameItems[stack.itemId];
              const name = item?.name ?? stack.itemId;
              const description = item?.description ?? '尚未登记的小物。';
              const icon = item?.icon ?? '🎒';
              const tags = item?.tags ?? [];

              return (
                <View key={stack.itemId} style={[styles.itemCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={[styles.iconBubble, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
                    <ThemedText style={styles.itemIcon}>{icon}</ThemedText>
                  </View>
                  <View style={styles.itemBody}>
                    <View style={styles.itemTitleRow}>
                      <ThemedText style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                        {name}
                      </ThemedText>
                      <ThemedText style={[styles.quantity, { color: accent }]}>×{stack.quantity}</ThemedText>
                    </View>
                    <ThemedText style={[styles.itemDescription, { color: mutedText }]} numberOfLines={2}>
                      {description}
                    </ThemedText>
                    <View style={styles.metaRow}>
                      {item?.type ? (
                        <View style={[styles.metaTag, { borderColor: cardBorder }]}>
                          <ThemedText style={[styles.metaText, { color: mutedText }]}>{ITEM_TYPE_LABELS[item.type]}</ThemedText>
                        </View>
                      ) : null}
                      {tags.map((tag) => (
                        <View key={`${stack.itemId}.${tag}`} style={[styles.metaTag, { borderColor: cardBorder }]}>
                          <ThemedText style={[styles.metaText, { color: mutedText }]}>{tag}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 6, alignItems: 'center' },
  emptyTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  itemList: { gap: 10 },
  itemCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', gap: 12 },
  iconBubble: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemIcon: { fontSize: 25, lineHeight: 30 },
  itemBody: { flex: 1, minWidth: 0, gap: 6 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 15, lineHeight: 19, fontWeight: '900' },
  quantity: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  itemDescription: { fontSize: 12, lineHeight: 17, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metaTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  metaText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
});
