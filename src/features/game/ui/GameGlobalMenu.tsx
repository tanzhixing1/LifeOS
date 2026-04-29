import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { formatGameTime } from '@/features/game/engine/time';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores';

const SIDE_DOCK_PANEL_WIDTH = 92;
const SIDE_DOCK_HANDLE_WIDTH = 30;

const ATTRIBUTE_ROWS = [
  { key: 'mana', label: '魔力' },
  { key: 'hp', label: '生命' },
  { key: 'sanity', label: '理智' },
  { key: 'stamina', label: '体力' },
  { key: 'focus', label: '专注' },
  { key: 'charisma', label: '魅力' },
  { key: 'intelligence', label: '智慧' },
  { key: 'proficiency', label: '熟练' },
  { key: 'family', label: '家庭' },
  { key: 'friendship', label: '友情' },
] as const;

const SAVE_SLOTS = [
  { id: 'slot1', label: '存档 1' },
  { id: 'slot2', label: '存档 2' },
  { id: 'slot3', label: '存档 3' },
] as const;

export function GameGlobalMenu() {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');
  const [attrsVisible, setAttrsVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);
  const [sideDockOpen, setSideDockOpen] = useState(false);

  const player = useGameStore((s) => s.player);
  const saveSlots = useGameStore((s) => s.saveSlots);
  const save = useGameStore((s) => s.save);
  const load = useGameStore((s) => s.load);

  const attrRows = ATTRIBUTE_ROWS.map((row) => ({ ...row, value: player.attrs[row.key] ?? 0 }));
  const lifeRows = [
    { key: 'bodyStatus', label: '身体状态', value: player.vitals.bodyStatus },
    { key: 'fatigue', label: '疲劳', value: player.vitals.fatigue },
    { key: 'intoxication', label: '醉酒', value: player.vitals.intoxication },
    { key: 'money', label: '金钱', value: `${player.wallet.money}G` },
    { key: 'gameTime', label: '游戏时间', value: formatGameTime(player.gameTime) },
  ];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: sideDockOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [sideDockOpen, slideAnim]);

  function confirmLoad(slotId: string) {
    setSaveVisible(false);
    Alert.alert('读取存档', '这会用存档覆盖当前游戏状态。', [
      { text: '取消', style: 'cancel' },
      {
        text: '读取',
        onPress: () => load(slotId),
      },
    ]);
  }

  return (
    <>
      {sideDockOpen ? <Pressable style={styles.backdrop} onPress={() => setSideDockOpen(false)} /> : null}

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.group,
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
            styles.panel,
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
              styles.button,
              { borderColor: cardBorder, backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.10)' },
            ]}>
            <ThemedText style={styles.buttonIcon}>✦</ThemedText>
            <ThemedText style={[styles.buttonLabel, { color: mutedText }]}>属性</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              setSideDockOpen(false);
              setSaveVisible(true);
            }}
            style={({ pressed }) => [
              styles.button,
              { borderColor: cardBorder, backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.10)' },
            ]}>
            <ThemedText style={styles.buttonIcon}>💾</ThemedText>
            <ThemedText style={[styles.buttonLabel, { color: mutedText }]}>存档</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              setSideDockOpen(false);
              router.push('/(tabs)/game/witch-log');
            }}
            style={({ pressed }) => [
              styles.button,
              { borderColor: cardBorder, backgroundColor: pressed ? 'rgba(209,187,222,0.22)' : 'rgba(209,187,222,0.10)' },
            ]}>
            <ThemedText style={styles.buttonIcon}>📜</ThemedText>
            <ThemedText style={[styles.buttonLabel, { color: mutedText }]}>日志</ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setSideDockOpen((open) => !open)}
          style={({ pressed }) => [
            styles.handle,
            {
              backgroundColor: '#FDFBF7',
              borderColor: accent,
              opacity: pressed ? 0.84 : 1,
            },
          ]}>
          <ThemedText style={[styles.handleText, { color: accent }]}>{sideDockOpen ? '<' : '>'}</ThemedText>
        </Pressable>
      </Animated.View>

      <Modal visible={attrsVisible} transparent animationType="fade" onRequestClose={() => setAttrsVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setAttrsVisible(false)} />
          <View style={[styles.modalPanel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleLine, { backgroundColor: cardBorder }]} />
              <ThemedText style={[styles.kicker, { color: accent }]}>STATUS NOTE</ThemedText>
              <View style={[styles.ruleLine, { backgroundColor: cardBorder }]} />
            </View>

            <ThemedText style={styles.title}>魔女状态手账</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>长期能力和短期生活状态分开看，会更清楚。</ThemedText>

            <ScrollView
              style={styles.modalBody}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: accent }]}>魔女属性</ThemedText>
                <View style={styles.attrGrid}>
                  {attrRows.map((attr) => (
                    <View key={attr.key} style={[styles.attrCell, { borderColor: cardBorder, backgroundColor: 'rgba(255,255,255,0.24)' }]}>
                      <ThemedText style={[styles.attrLabel, { color: mutedText }]}>{attr.label}</ThemedText>
                      <ThemedText style={styles.attrValue}>{attr.value}</ThemedText>
                      <ThemedText style={[styles.attrKey, { color: mutedText }]}>{attr.key}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: accent }]}>生活状态</ThemedText>
                <View style={styles.lifeList}>
                  {lifeRows.map((row) => (
                    <View key={row.key} style={[styles.lifeRow, { borderColor: cardBorder, backgroundColor: 'rgba(255,255,255,0.24)' }]}>
                      <ThemedText style={[styles.lifeLabel, { color: mutedText }]}>{row.label}</ThemedText>
                      <ThemedText style={styles.lifeValue}>{row.value}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setAttrsVisible(false)}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { borderColor: accent, backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
                ]}>
                <ThemedText style={styles.closeBtnText}>合上手账</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={saveVisible} transparent animationType="fade" onRequestClose={() => setSaveVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSaveVisible(false)} />
          <View style={[styles.modalPanel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.ruleRow}>
              <View style={[styles.ruleLine, { backgroundColor: cardBorder }]} />
              <ThemedText style={[styles.kicker, { color: accent }]}>SAVE FILE</ThemedText>
              <View style={[styles.ruleLine, { backgroundColor: cardBorder }]} />
            </View>

            <ThemedText style={styles.title}>存档</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>保存或读取当前游戏进度。</ThemedText>

            <ScrollView
              style={styles.modalBody}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}>
              {SAVE_SLOTS.map((slot) => {
                const currentSlot = saveSlots[slot.id];
                const hasSave = Boolean(currentSlot);

                return (
                  <View key={slot.id} style={[styles.slotRow, { borderColor: cardBorder, backgroundColor: 'rgba(255,255,255,0.24)' }]}>
                    <View style={styles.slotMeta}>
                      <ThemedText style={styles.slotLabel}>{slot.label}</ThemedText>
                      <ThemedText style={[styles.slotStatus, { color: mutedText }]}>{hasSave ? '已存档' : '空槽'}</ThemedText>
                    </View>

                    <View style={styles.slotActions}>
                      <Pressable
                        onPress={() => {
                          save(slot.id);
                          setSaveVisible(false);
                        }}
                        style={({ pressed }) => [
                          styles.slotButton,
                          { borderColor: accent, backgroundColor: pressed ? 'rgba(209,187,222,0.20)' : 'rgba(209,187,222,0.12)' },
                        ]}>
                        <ThemedText style={[styles.slotButtonText, { color: accent }]}>保存</ThemedText>
                      </Pressable>

                      <Pressable
                        disabled={!hasSave}
                        onPress={() => confirmLoad(slot.id)}
                        style={({ pressed }) => [
                          styles.slotButton,
                          {
                            borderColor: hasSave ? accent : cardBorder,
                            backgroundColor: hasSave ? (pressed ? 'rgba(209,187,222,0.20)' : 'rgba(209,187,222,0.12)') : 'rgba(122,117,111,0.08)',
                            opacity: hasSave ? (pressed ? 0.92 : 1) : 0.56,
                          },
                        ]}>
                        <ThemedText style={[styles.slotButtonText, { color: hasSave ? accent : mutedText }]}>读取</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setSaveVisible(false)}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { borderColor: accent, backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
                ]}>
                <ThemedText style={styles.closeBtnText}>合上存档</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  group: {
    position: 'absolute',
    left: 0,
    width: SIDE_DOCK_PANEL_WIDTH + SIDE_DOCK_HANDLE_WIDTH,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 50,
    elevation: 12,
  },
  panel: {
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
  button: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  buttonIcon: { fontSize: 17, lineHeight: 19 },
  buttonLabel: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  handle: {
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
  handleText: { fontSize: 18, lineHeight: 20, fontWeight: '900' },
  modalRoot: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)', zIndex: 0 },
  modalPanel: {
    width: '100%',
    height: '82%',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
    zIndex: 1,
  },
  modalBody: { flex: 1 },
  modalFooter: { paddingTop: 2 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleLine: { flex: 1, height: 1 },
  kicker: { fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { fontSize: 19, lineHeight: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 12, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  content: { gap: 14, paddingVertical: 4, paddingBottom: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  attrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attrCell: { width: '48%', minHeight: 74, borderWidth: 1, borderRadius: 14, padding: 10, justifyContent: 'space-between' },
  attrLabel: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  attrValue: { fontSize: 22, lineHeight: 26, fontWeight: '900', textAlign: 'right' },
  attrKey: { fontSize: 10, lineHeight: 12, fontWeight: '800', textAlign: 'right' },
  lifeList: { gap: 8 },
  lifeRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lifeLabel: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  lifeValue: { flex: 1, fontSize: 13, lineHeight: 17, fontWeight: '900', textAlign: 'right' },
  slotRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  slotMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  slotLabel: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  slotStatus: { fontSize: 11, lineHeight: 14, fontWeight: '800' },
  slotActions: { flexDirection: 'row', gap: 8 },
  slotButton: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  slotButtonText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  closeBtn: { height: 42, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 14, lineHeight: 18, fontWeight: '900' },
});
