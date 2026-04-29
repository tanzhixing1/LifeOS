import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

const SIDE_DOCK_PANEL_WIDTH = 84;
const SIDE_DOCK_HANDLE_WIDTH = 30;

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

export function GameGlobalMenu() {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const [attrsVisible, setAttrsVisible] = useState(false);
  const [sideDockOpen, setSideDockOpen] = useState(false);

  const attrs = useGameStore((s) => s.player.attrs);
  const attrRows = ATTRIBUTE_ROWS.map((row) => ({ ...row, value: attrs[row.key] ?? 0 }));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sideDockOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [sideDockOpen, slideAnim]);

  return (
    <>
      {sideDockOpen ? <Pressable style={styles.sideDockBackdrop} onPress={() => setSideDockOpen(false)} /> : null}

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.sideDockGroup,
          {
            top: Math.max(104, insets.top + 56),
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
    </>
  );
}

const styles = StyleSheet.create({
  sideDockBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  sideDockGroup: {
    position: 'absolute',
    left: 0,
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
