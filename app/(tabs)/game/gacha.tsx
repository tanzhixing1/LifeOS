import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fogberryLuckyBottlePool } from '@/features/game/content/main/gacha/pools';
import type { GachaReward } from '@/features/game/content/main/gacha/types';
import { gameItems } from '@/features/game/content/main/items/items';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useWalletStore } from '@/stores/walletStore';

const SHOP_ROUTE = '/(tabs)/game/shop';

export default function GameGachaScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#FDF8ED', dark: '#1C1F22' }, 'background');
  const cardAlt = useThemeColor({ light: '#F7F0E3', dark: '#24282D' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8C9B8', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A6F62', dark: '#A7B0BE' }, 'text');
  const textColor = useThemeColor({ light: '#3D352E', dark: '#E4E4E7' }, 'text');
  const accent = useThemeColor({ light: '#B88452', dark: '#D8B174' }, 'tint');

  const gold = useWalletStore((s) => s.currencies.gold);
  const spendCurrency = useWalletStore((s) => s.spendCurrency);
  const addItem = useInventoryStore((s) => s.addItem);
  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const [lastReward, setLastReward] = useState<GachaReward | null>(null);

  function goBackToShop() {
    router.replace({ pathname: SHOP_ROUTE, params: from === 'map' ? { from: 'map' } : undefined });
  }

  const pool = fogberryLuckyBottlePool;
  const rewardItem = lastReward ? gameItems[lastReward.itemId] : undefined;

  function drawOnce() {
    if ((gold ?? 0) < pool.costAmount) {
      Alert.alert('金币不足', '金币不足，先去完成一些任务或稍后再来吧。');
      return;
    }

    const reward = pickWeightedReward(pool.rewards);
    if (!reward) {
      Alert.alert('瓶子沉默了', '奖池暂时没有可以抽取的小物。');
      return;
    }

    const spent = spendCurrency(pool.costCurrency, pool.costAmount);
    if (!spent) {
      Alert.alert('金币不足', '金币不足，先去完成一些任务或稍后再来吧。');
      return;
    }

    addItem(reward.itemId, reward.amount);
    setLastReward(reward);
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={goBackToShop} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
            <ThemedText style={[styles.backText, { color: mutedText }]}>返回商店</ThemedText>
          </Pressable>

          <View style={styles.titleBlock}>
            <ThemedText style={[styles.kicker, { color: accent }]}>LUCKY BOTTLE</ThemedText>
            <ThemedText style={[styles.bigTitle, { color: textColor }]}>{pool.name}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>{pool.subtitle}</ThemedText>
          </View>
        </View>

        <View style={[styles.walletCard, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
          <View style={styles.walletItem}>
            <ThemedText style={[styles.walletLabel, { color: accent }]}>当前金币</ThemedText>
            <ThemedText style={[styles.walletValue, { color: textColor }]}>{gold ?? 0}G</ThemedText>
          </View>
          <View style={[styles.walletDivider, { backgroundColor: cardBorder }]} />
          <View style={styles.walletItem}>
            <ThemedText style={[styles.walletLabel, { color: accent }]}>单抽价格</ThemedText>
            <ThemedText style={[styles.walletValue, { color: textColor }]}>{pool.costAmount}G</ThemedText>
          </View>
        </View>

        <View style={[styles.stageCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={styles.bottleIcon}>🫐</ThemedText>
          <ThemedText style={[styles.stageTitle, { color: textColor }]}>本次获得</ThemedText>

          {lastReward ? (
            <View style={[styles.rewardPanel, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
              <ThemedText style={styles.rewardIcon}>{rewardItem?.icon ?? '📦'}</ThemedText>
              <ThemedText style={[styles.rewardName, { color: textColor }]}>{rewardItem?.name ?? '未知物品'}</ThemedText>
              <ThemedText style={[styles.rewardAmount, { color: accent }]}>x{lastReward.amount}</ThemedText>
              <ThemedText style={[styles.rewardDescription, { color: mutedText }]}>
                {rewardItem?.description ?? '这件小物还没有详细说明。'}
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.emptyPanel, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
              <ThemedText style={[styles.emptyText, { color: mutedText }]}>瓶中还没有浮现小物</ThemedText>
            </View>
          )}

          <ThemedText style={[styles.broadcastText, { color: mutedText }]}>雾莓瓶轻轻晃了晃，一件小物落进你的掌心。</ThemedText>
        </View>

        <View style={[styles.mascotCard, { backgroundColor: 'rgba(209,187,222,0.14)', borderColor: cardBorder }]}>
          <ThemedText style={[styles.mascotTitle, { color: accent }]}>🐚 雾莓海螺播报</ThemedText>
          <ThemedText style={[styles.mascotText, { color: mutedText }]}>祝你好运连连～</ThemedText>
        </View>

        <Pressable
          onPress={drawOnce}
          style={({ pressed }) => [
            styles.drawButton,
            {
              borderColor: accent,
              backgroundColor: pressed ? 'rgba(184,132,82,0.24)' : 'rgba(184,132,82,0.12)',
            },
          ]}>
          <ThemedText style={[styles.drawButtonText, { color: accent }]}>抽一次 {pool.costAmount}G</ThemedText>
        </Pressable>

        <ThemedText style={[styles.footerNote, { color: mutedText }]}>{pool.description}</ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

function pickWeightedReward(rewards: GachaReward[]): GachaReward | null {
  const availableRewards = rewards.filter((reward) => reward.weight > 0);
  const totalWeight = availableRewards.reduce((sum, reward) => sum + reward.weight, 0);
  if (totalWeight <= 0) return null;

  let roll = Math.random() * totalWeight;
  for (const reward of availableRewards) {
    roll -= reward.weight;
    if (roll < 0) return reward;
  }

  return availableRewards[availableRewards.length - 1] ?? null;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, gap: 12 },
  header: { gap: 10 },
  backText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  titleBlock: { alignItems: 'center', gap: 4 },
  kicker: { fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 1.4 },
  bigTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  walletCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  walletItem: { flex: 1, alignItems: 'center', gap: 3 },
  walletDivider: { width: 1, alignSelf: 'stretch' },
  walletLabel: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  walletValue: { fontSize: 17, lineHeight: 22, fontWeight: '900' },
  stageCard: { borderWidth: 1, borderRadius: 22, padding: 18, alignItems: 'center', gap: 12 },
  bottleIcon: { fontSize: 46, lineHeight: 52 },
  stageTitle: { fontSize: 17, lineHeight: 22, fontWeight: '900' },
  rewardPanel: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 16, alignItems: 'center', gap: 7 },
  rewardIcon: { fontSize: 42, lineHeight: 48 },
  rewardName: { fontSize: 17, lineHeight: 22, fontWeight: '900', textAlign: 'center' },
  rewardAmount: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  rewardDescription: { fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  emptyPanel: { width: '100%', minHeight: 106, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 14 },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  broadcastText: { fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  mascotCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 5 },
  mascotTitle: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  mascotText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  drawButton: { minHeight: 46, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  drawButtonText: { fontSize: 15, lineHeight: 19, fontWeight: '900' },
  footerNote: { fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
});
