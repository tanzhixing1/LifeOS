import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useMessengerStore } from '@/stores/messengerStore';

export default function SettingsHomeScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const mutedText = useThemeColor({ light: '#7A756F', dark: '#A7B0BE' }, 'text');
  const cardBg = useThemeColor({ light: '#F7F3EE', dark: '#1C1F22' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8D0C7', dark: '#2A3036' }, 'text');
  const accent = useThemeColor({ light: '#D1BBDE', dark: '#D1BBDE' }, 'tint');

  const mutedDateISO = useMessengerStore((s) => s.mutedDateISO);
  const dailyCountByDateISO = useMessengerStore((s) => s.dailyCountByDateISO);
  const trigger = useMessengerStore((s) => s.trigger);
  const muteToday = useMessengerStore((s) => s.muteToday);
  const unmute = useMessengerStore((s) => s.unmute);
  const resetTodayCount = useMessengerStore((s) => s.resetTodayCount);

  const [testVisible, setTestVisible] = useState(false);

  const todayISO = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const todayCount = dailyCountByDateISO[todayISO] ?? 0;
  const isMutedToday = mutedDateISO === todayISO;

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.bigTitle}>设置</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>
          现在先把“别吵我”和“测试通知”放好，省得你说我没给入口。
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ThemedText style={styles.cardTitle}>语境通知官</ThemedText>
        <ThemedText style={[styles.cardSub, { color: mutedText }]}>今日已弹：{todayCount}/3 · 今日静音：{isMutedToday ? '是' : '否'}</ThemedText>

        <View style={styles.row}>
          <Pressable
            onPress={() => (isMutedToday ? unmute() : muteToday())}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: accent, opacity: pressed ? 0.92 : 1 },
            ]}>
            <ThemedText style={[styles.chipText, { color: accent }]}>{isMutedToday ? '恢复吵闹' : '今天别吵我'}</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => resetTodayCount()}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: cardBorder, opacity: pressed ? 0.92 : 1 },
            ]}>
            <ThemedText style={[styles.chipText, { color: mutedText }]}>清零计数</ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setTestVisible(true)}
          style={({ pressed }) => [
            styles.testBtn,
            { backgroundColor: accent, opacity: pressed ? 0.92 : 1 },
          ]}>
          <ThemedText style={styles.testBtnText}>触发测试通知</ThemedText>
        </Pressable>
      </View>

      <Modal visible={testVisible} transparent animationType="fade" onRequestClose={() => setTestVisible(false)}>
        <Pressable style={styles.mask} onPress={() => setTestVisible(false)}>
          <Pressable style={styles.maskInner} />
        </Pressable>
        <View style={styles.center}>
          <View style={[styles.panel, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <ThemedText style={styles.panelTitle}>挑一个触发类型</ThemedText>

            <Pressable
              onPress={() => {
                trigger({ type: 'todo_created', key: `test.todo_created.${Date.now()}`, title: '测试：新建', body: '你刚新建了一个待办。嗯，确实是你。', force: true });
                setTestVisible(false);
              }}
              style={({ pressed }) => [styles.panelBtn, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={[styles.panelBtnText, { color: accent }]}>新建</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                trigger({ type: 'todo_completed', key: `test.todo_completed.${Date.now()}`, title: '测试：完成', body: '完成了一项待办。你今天挺像个人的。', force: true });
                setTestVisible(false);
              }}
              style={({ pressed }) => [styles.panelBtn, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={[styles.panelBtnText, { color: accent }]}>完成</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                trigger({ type: 'todo_due_soon', key: `test.todo_due_soon.${Date.now()}`, title: '测试：到期前', body: '到期前提醒：再拖就真到期了。', force: true });
                setTestVisible(false);
              }}
              style={({ pressed }) => [styles.panelBtn, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={[styles.panelBtnText, { color: accent }]}>到期前</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                trigger({ type: 'habit_stagnant', key: `test.habit_stagnant.${Date.now()}`, title: '测试：停滞', body: '打卡停滞：你是把动力丢哪了？', force: true });
                setTestVisible(false);
              }}
              style={({ pressed }) => [styles.panelBtn, { borderColor: accent, opacity: pressed ? 0.92 : 1 }]}>
              <ThemedText style={[styles.panelBtnText, { color: accent }]}>停滞</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  header: { paddingTop: 4, paddingBottom: 12, gap: 8 },
  bigTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  cardSub: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
  testBtn: { borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  testBtnText: { color: '#1D1B1E', fontSize: 15, lineHeight: 18, fontWeight: '900' },

  mask: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  maskInner: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18 },
  panel: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  panelTitle: { fontSize: 15, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  panelBtn: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12 },
  panelBtnText: { fontSize: 14, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
});
