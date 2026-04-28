import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

const SIDE_DOCK_PANEL_WIDTH = 84;
const SIDE_DOCK_HANDLE_WIDTH = 30;

export default function GameHomeScreen() {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const hudBg = useThemeColor({ light: '#F7F3EE', dark: '#0B0B0F' }, 'background');
  const hudBorder = useThemeColor({ light: '#D8D0C7', dark: '#27272A' }, 'text');
  const hudText = useThemeColor({ light: '#3D3A36', dark: '#E4E4E7' }, 'text');
  const hudMuted = useThemeColor({ light: '#7A756F', dark: '#A1A1AA' }, 'text');
  const hudAccent = useThemeColor({ light: '#6366F1', dark: '#6366F1' }, 'tint');
  const [attrsVisible, setAttrsVisible] = useState(false);
  const [sideDockOpen, setSideDockOpen] = useState(false);

  const attrs = useGameStore((s) => s.player.attrs);
  const mana = attrs.mana ?? 0;
  const hp = attrs.hp ?? 0;
  const sanity = attrs.sanity ?? 0;
  const attrRows = ATTRIBUTE_ROWS.map((row) => ({ ...row, value: attrs[row.key] ?? 0 }));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sideDockOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [sideDockOpen, slideAnim]);

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={styles.bigTitle}>魔女模拟器</ThemedText>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>先去地图。别急着写传奇。</ThemedText>
        </View>

        <View style={[styles.hud, { backgroundColor: hudBg, borderColor: hudBorder }]}>
          <View style={styles.hudHeader}>
            <ThemedText style={[styles.hudHeaderText, { color: hudMuted }]}>Witch Status</ThemedText>
          </View>
          <View style={styles.hudRow}>
            <View style={styles.hudItem}>
              <View style={styles.hudTop}>
                <ThemedText style={[styles.hudLabel, { color: hudMuted }]}>Mana</ThemedText>
                <ThemedText style={[styles.hudValue, { color: hudText }]}>{mana}</ThemedText>
              </View>
              <View style={[styles.hudBar, { backgroundColor: hudBorder }]}>
                <View style={[styles.hudBarFill, { backgroundColor: hudAccent, width: `${clampPct(mana)}%` }]} />
              </View>
            </View>

            <View style={styles.hudItem}>
              <View style={styles.hudTop}>
                <ThemedText style={[styles.hudLabel, { color: hudMuted }]}>HP</ThemedText>
                <ThemedText style={[styles.hudValue, { color: hudText }]}>{hp}</ThemedText>
              </View>
              <View style={[styles.hudBar, { backgroundColor: hudBorder }]}>
                <View style={[styles.hudBarFill, { backgroundColor: hudAccent, width: `${clampPct(hp)}%` }]} />
              </View>
            </View>

            <View style={styles.hudItem}>
              <View style={styles.hudTop}>
                <ThemedText style={[styles.hudLabel, { color: hudMuted }]}>Sanity</ThemedText>
                <ThemedText style={[styles.hudValue, { color: hudText }]}>{sanity}</ThemedText>
              </View>
              <View style={[styles.hudBar, { backgroundColor: hudBorder }]}>
                <View style={[styles.hudBarFill, { backgroundColor: hudAccent, width: `${clampPct(sanity)}%` }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.parchment, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.parchmentHint, { color: mutedText }]}>羊皮纸 / 渐变紫（占位背景语义）</ThemedText>

          <Pressable
            onPress={() => router.push('/(tabs)/game/map')}
            style={({ pressed }) => [styles.mapNode, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
            <ThemedText style={[styles.mapNodeText, { color: accent }]}>世界入口（地图节点占位）</ThemedText>
            <ThemedText style={[styles.mapNodeSub, { color: mutedText }]}>点我进入地图</ThemedText>
          </Pressable>

          <View style={styles.primaryArea}>
            <Pressable
              onPress={() => router.push('/(tabs)/game/map')}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={styles.primaryBtnText}>进入地图</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                useGameStore.getState().resetGame();
                router.push('/(tabs)/game/map');
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <ThemedText style={[styles.linkText, { color: mutedText }]}>开始新旅程</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {sideDockOpen ? <Pressable style={styles.sideDockBackdrop} onPress={() => setSideDockOpen(false)} /> : null}

      <Animated.View
        style={[
          styles.sideDockGroup,
          {
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-SIDE_DOCK_PANEL_WIDTH, 0],
                }),
              },
            ],
          },
        ]}>
        <View
          style={[
            styles.sideDockPanel,
            {
              backgroundColor: '#FDFBF7',
              borderColor: accent,
              shadowColor: accent,
            },
          ]}>
          <Pressable
            onPress={() => {
              setSideDockOpen(false);
              setAttrsVisible(true);
            }}
            style={({ pressed }) => [
              styles.sideDockButton,
              { borderColor: cardBorder, backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.10)' },
            ]}>
            <ThemedText style={styles.sideDockIcon}>✦</ThemedText>
            <ThemedText style={[styles.sideDockLabel, { color: mutedText }]}>属性</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              setSideDockOpen(false);
              router.push('/(tabs)/game/witch-log');
            }}
            style={({ pressed }) => [
              styles.sideDockButton,
              { borderColor: cardBorder, backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.10)' },
            ]}>
            <ThemedText style={styles.sideDockIcon}>📖</ThemedText>
            <ThemedText style={[styles.sideDockLabel, { color: mutedText }]}>日志</ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setSideDockOpen((open) => !open)}
          style={({ pressed }) => [
            styles.sideDockHandle,
            {
              backgroundColor: '#FDFBF7',
              borderColor: accent,
              opacity: pressed ? 0.84 : 1,
            },
          ]}>
          <ThemedText style={[styles.sideDockHandleText, { color: accent }]}>{sideDockOpen ? '<' : '>'}</ThemedText>
        </Pressable>
      </Animated.View>

      <Modal visible={attrsVisible} transparent animationType="fade" onRequestClose={() => setAttrsVisible(false)}>
        <Pressable style={styles.modalMask} onPress={() => setAttrsVisible(false)}>
          <Pressable style={[styles.attrPanel, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => {}}>
            <View style={styles.panelOrnamentRow}>
              <View style={[styles.panelLine, { backgroundColor: cardBorder }]} />
              <ThemedText style={[styles.panelKicker, { color: accent }]}>STATUS NOTE</ThemedText>
              <View style={[styles.panelLine, { backgroundColor: cardBorder }]} />
            </View>
            <ThemedText style={styles.panelTitle}>魔女状态手账</ThemedText>
            <ThemedText style={[styles.panelSubtitle, { color: mutedText }]}>现实努力换来的数值，先别乱花。</ThemedText>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.attrGrid}>
              {attrRows.map((attr) => (
                <View key={attr.key} style={[styles.attrCell, { borderColor: cardBorder, backgroundColor: 'rgba(255,255,255,0.24)' }]}>
                  <ThemedText style={[styles.attrLabel, { color: mutedText }]}>{attr.label}</ThemedText>
                  <ThemedText style={styles.attrValue}>{attr.value}</ThemedText>
                  <ThemedText style={[styles.attrKey, { color: mutedText }]}>{attr.key}</ThemedText>
                </View>
              ))}
            </ScrollView>

            <Pressable
              onPress={() => setAttrsVisible(false)}
              style={({ pressed }) => [
                styles.closeBtn,
                { borderColor: accent, backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
              ]}>
              <ThemedText style={styles.closeBtnText}>合上手账</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const ATTRIBUTE_ROWS = [
  { key: 'mana', label: '魔力' },
  { key: 'hp', label: '生命' },
  { key: 'sanity', label: '理智' },
  { key: 'stamina', label: '体力' },
  { key: 'focus', label: '专注' },
  { key: 'intelligence', label: '智识' },
  { key: 'charisma', label: '魅力' },
  { key: 'proficiency', label: '熟练度' },
  { key: 'friendship', label: '友情' },
  { key: 'family', label: '家庭' },
] as const;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 32 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  bigTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },

  hud: { borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 12 },
  hudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  hudHeaderText: { fontSize: 11, lineHeight: 14, fontWeight: '900', letterSpacing: 0.8 },
  hudRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hudItem: { flexGrow: 1, flexBasis: 0, minWidth: 92, gap: 8 },
  hudTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  hudLabel: { fontSize: 12, lineHeight: 16, fontWeight: '900', letterSpacing: 0.2 },
  hudValue: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  hudBar: { height: 8, borderRadius: 999 },
  hudBarFill: { height: 8, borderRadius: 999 },

  parchment: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 14 },
  parchmentHint: { fontSize: 12, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  mapNode: { borderWidth: 1.5, borderRadius: 18, paddingVertical: 22, paddingHorizontal: 14, alignItems: 'center', gap: 6 },
  mapNodeText: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  mapNodeSub: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  primaryArea: { paddingTop: 6, gap: 10 },
  primaryBtn: { borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, lineHeight: 20, fontWeight: '900' },
  linkText: { fontSize: 13, lineHeight: 16, fontWeight: '900', textAlign: 'center', textDecorationLine: 'underline' },

  sideDockBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  sideDockGroup: {
    position: 'absolute',
    left: 0,
    top: 104,
    width: SIDE_DOCK_PANEL_WIDTH + SIDE_DOCK_HANDLE_WIDTH,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 50,
    elevation: 12,
  },
  sideDockPanel: {
    width: SIDE_DOCK_PANEL_WIDTH,
    borderWidth: 1,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  sideDockButton: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  sideDockIcon: { fontSize: 18, lineHeight: 20 },
  sideDockLabel: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  sideDockHandle: {
    width: SIDE_DOCK_HANDLE_WIDTH,
    height: 48,
    marginTop: 8,
    marginLeft: -2,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 14,
  },
  sideDockHandleText: { fontSize: 18, lineHeight: 20, fontWeight: '900' },

  modalMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  attrPanel: { width: '100%', maxHeight: '82%', borderWidth: 1.5, borderRadius: 20, padding: 14, gap: 10 },
  panelOrnamentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelLine: { flex: 1, height: 1 },
  panelKicker: { fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 1.2 },
  panelTitle: { fontSize: 19, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  panelSubtitle: { fontSize: 12, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 4 },
  attrCell: { width: '48%', minHeight: 74, borderWidth: 1, borderRadius: 14, padding: 10, justifyContent: 'space-between' },
  attrLabel: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  attrValue: { fontSize: 22, lineHeight: 26, fontWeight: '900', textAlign: 'right' },
  attrKey: { fontSize: 10, lineHeight: 12, fontWeight: '800', textAlign: 'right' },
  closeBtn: { height: 42, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  closeBtnText: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '900' },
});

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
