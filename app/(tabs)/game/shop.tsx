import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { shopCategories } from '@/features/game/content/main/shops/categories';
import { getProductsByCategory } from '@/features/game/content/main/shops/products';
import { mainShopConfig } from '@/features/game/content/main/shops/shopConfig';
import type { CurrencyType, ProductCategoryId, ShopProduct } from '@/features/game/content/main/shops/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useWalletStore } from '@/stores/walletStore';

const CURRENCY_LABELS: Record<CurrencyType, string> = {
  gold: '金币',
  gem: '魔晶',
  ticket: '抽奖券',
};

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  gold: 'G',
  gem: '◇',
  ticket: '券',
};

export default function GameShopScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#FDF8ED', dark: '#1C1F22' }, 'background');
  const cardAlt = useThemeColor({ light: '#F7F0E3', dark: '#24282D' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8C9B8', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A6F62', dark: '#A7B0BE' }, 'text');
  const textColor = useThemeColor({ light: '#3D352E', dark: '#E4E4E7' }, 'text');
  const accent = useThemeColor({ light: '#B88452', dark: '#D8B174' }, 'tint');

  const currencies = useWalletStore((s) => s.currencies);
  const canAfford = useWalletStore((s) => s.canAfford);
  const spendCurrency = useWalletStore((s) => s.spendCurrency);
  const addItem = useInventoryStore((s) => s.addItem);
  const inventoryItems = useInventoryStore((s) => s.items);

  const [selectedCategoryId, setSelectedCategoryId] = useState<ProductCategoryId>('daily');
  const selectedCategory = shopCategories.find((category) => category.id === selectedCategoryId) ?? shopCategories[0]!;
  const products = selectedCategory.unlocked ? getProductsByCategory(selectedCategory.id) : [];

  function selectCategory(categoryId: ProductCategoryId) {
    const category = shopCategories.find((item) => item.id === categoryId);
    setSelectedCategoryId(categoryId);
    if (category && !category.unlocked) {
      Alert.alert(category.name, category.lockedReason ?? '后续开放。');
    }
  }

  function buyProduct(product: ShopProduct) {
    if (product.category !== 'daily') {
      Alert.alert(product.name, '这个分类暂未开放购买。');
      return;
    }

    if (!canAfford(product.currency, product.price)) {
      Alert.alert('余额不足', `${CURRENCY_LABELS[product.currency]}不足，暂时不能购入 ${product.name}。`);
      return;
    }

    const spent = spendCurrency(product.currency, product.price);
    if (!spent) {
      Alert.alert('余额不足', `${CURRENCY_LABELS[product.currency]}不足，暂时不能购入 ${product.name}。`);
      return;
    }

    addItem(product.itemId, 1);
    Alert.alert('购买成功', `已购入：${product.name} ×1`);
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
              <ThemedText style={[styles.kicker, { color: accent }]}>FOGBERRY LIST</ThemedText>
              <ThemedText style={[styles.bigTitle, { color: textColor }]}>{mainShopConfig.name}</ThemedText>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>{mainShopConfig.subtitle}</ThemedText>
        </View>

        <View style={[styles.noticeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.noticeTitle, { color: textColor }]}>杂货铺今日供应</ThemedText>
          <ThemedText style={[styles.noticeText, { color: mutedText }]}>{mainShopConfig.description}</ThemedText>
        </View>

        <View style={[styles.walletCard, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>钱包</ThemedText>
          <View style={styles.currencyRow}>
            <CurrencyPill label="金币" value={`${currencies.gold ?? 0}`} accent={accent} mutedText={mutedText} borderColor={cardBorder} />
            <CurrencyPill label="魔晶" value={`${currencies.gem ?? 0}`} accent={accent} mutedText={mutedText} borderColor={cardBorder} />
            <CurrencyPill label="抽奖券" value={`${currencies.ticket ?? 0}`} accent={accent} mutedText={mutedText} borderColor={cardBorder} />
          </View>
        </View>

        <View style={styles.categorySection}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>分类</ThemedText>
          <View style={styles.categoryTabs}>
            {shopCategories.map((category) => {
              const active = category.id === selectedCategoryId;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => selectCategory(category.id)}
                  style={({ pressed }) => [
                    styles.categoryTab,
                    {
                      borderColor: active ? accent : cardBorder,
                      backgroundColor: active ? 'rgba(184,132,82,0.16)' : cardBg,
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}>
                  <ThemedText style={[styles.categoryName, { color: active ? accent : textColor }]}>{category.name}</ThemedText>
                  <ThemedText style={[styles.categoryState, { color: category.unlocked ? mutedText : accent }]}>
                    {category.unlocked ? '开放' : '锁定'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.catalogCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.catalogHeader}>
            <View style={styles.catalogTitleBlock}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>{selectedCategory.name}</ThemedText>
              <ThemedText style={[styles.categoryDescription, { color: mutedText }]}>{selectedCategory.description}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { borderColor: selectedCategory.unlocked ? accent : cardBorder }]}>
              <ThemedText style={[styles.statusBadgeText, { color: selectedCategory.unlocked ? accent : mutedText }]}>
                {selectedCategory.unlocked ? '今日可看' : '暂未开放'}
              </ThemedText>
            </View>
          </View>

          {!selectedCategory.unlocked ? (
            <View style={[styles.lockedPanel, { borderColor: cardBorder, backgroundColor: 'rgba(255,255,255,0.34)' }]}>
              <ThemedText style={[styles.lockedMark, { color: accent }]}>封条未拆</ThemedText>
              <ThemedText style={[styles.lockedText, { color: mutedText }]}>{selectedCategory.lockedReason ?? '后续开放。'}</ThemedText>
              <ThemedText style={[styles.lockedHint, { color: mutedText }]}>Shop-1 只展示日常用品；解锁规则会在 Shop-3 接入。</ThemedText>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  accent={accent}
                  borderColor={cardBorder}
                  mutedText={mutedText}
                  textColor={textColor}
                  ownedQuantity={inventoryItems[product.itemId]?.quantity ?? 0}
                  onBuy={() => buyProduct(product)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type CurrencyPillProps = {
  label: string;
  value: string;
  accent: string;
  mutedText: string;
  borderColor: string;
};

function CurrencyPill({ label, value, accent, mutedText, borderColor }: CurrencyPillProps) {
  return (
    <View style={[styles.currencyPill, { borderColor }]}>
      <ThemedText style={[styles.currencyLabel, { color: accent }]}>{label}</ThemedText>
      <ThemedText style={[styles.currencyValue, { color: mutedText }]}>{value}</ThemedText>
    </View>
  );
}

type ProductCardProps = {
  product: ShopProduct;
  accent: string;
  borderColor: string;
  mutedText: string;
  textColor: string;
  ownedQuantity: number;
  onBuy: () => void;
};

function ProductCard({ product, accent, borderColor, mutedText, textColor, ownedQuantity, onBuy }: ProductCardProps) {
  return (
    <View style={[styles.productCard, { borderColor, backgroundColor: 'rgba(255,255,255,0.42)' }]}>
      <View style={styles.productTop}>
        <ThemedText style={styles.productIcon}>{product.icon}</ThemedText>
        <View style={styles.productTitleBlock}>
          <ThemedText style={[styles.productName, { color: textColor }]} numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText style={[styles.productPrice, { color: accent }]}>
            {product.price}
            {CURRENCY_SYMBOLS[product.currency]} · {CURRENCY_LABELS[product.currency]}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.productDescription, { color: mutedText }]} numberOfLines={3}>
        {product.description}
      </ThemedText>

      {ownedQuantity > 0 ? <ThemedText style={[styles.ownedText, { color: mutedText }]}>持有：{ownedQuantity}</ThemedText> : null}

      <View style={styles.tagRow}>
        {(product.tags ?? []).map((tag) => (
          <View key={`${product.id}.${tag}`} style={[styles.tag, { borderColor }]}>
            <ThemedText style={[styles.tagText, { color: mutedText }]}>{tag}</ThemedText>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onBuy}
        style={({ pressed }) => [
          styles.buyButton,
          {
            borderColor: accent,
            backgroundColor: pressed ? 'rgba(184,132,82,0.24)' : 'rgba(184,132,82,0.12)',
          },
        ]}>
        <ThemedText style={[styles.buyButtonText, { color: accent }]}>购买</ThemedText>
      </Pressable>
    </View>
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
  noticeCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 6 },
  noticeTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  noticeText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  walletCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyPill: { flexGrow: 1, minWidth: 96, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  currencyLabel: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  currencyValue: { fontSize: 11, lineHeight: 14, fontWeight: '800' },
  categorySection: { gap: 8 },
  categoryTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryTab: { width: '48%', minHeight: 58, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 9, gap: 4 },
  categoryName: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  categoryState: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  catalogCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  catalogHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  catalogTitleBlock: { flex: 1, gap: 3 },
  categoryDescription: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  statusBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusBadgeText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  lockedPanel: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  lockedMark: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  lockedText: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  lockedHint: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: { width: '48%', minHeight: 214, borderWidth: 1, borderRadius: 16, padding: 11, gap: 9 },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productIcon: { fontSize: 25, lineHeight: 30 },
  productTitleBlock: { flex: 1, minWidth: 0, gap: 2 },
  productName: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  productPrice: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  productDescription: { flexGrow: 1, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  ownedText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  buyButton: { minHeight: 36, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buyButtonText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
});
