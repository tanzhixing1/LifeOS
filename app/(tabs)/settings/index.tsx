import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { AppChip } from '@/core/ui/AppChip';
import { ScreenScaffold } from '@/core/ui/ScreenScaffold';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { buildBackupSnapshot, buildBackupSummary, formatBackupJSON } from '@/services/storage/backup';
import { useMessengerStore } from '@/stores/messengerStore';

export default function SettingsHomeScreen() {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const insets = useSafeAreaInsets();

  const mutedDateISO = useMessengerStore((s) => s.mutedDateISO);
  const dailyCountByDateISO = useMessengerStore((s) => s.dailyCountByDateISO);
  const trigger = useMessengerStore((s) => s.trigger);
  const muteToday = useMessengerStore((s) => s.muteToday);
  const unmute = useMessengerStore((s) => s.unmute);
  const resetTodayCount = useMessengerStore((s) => s.resetTodayCount);

  const [testVisible, setTestVisible] = useState(false);
  const [backupVisible, setBackupVisible] = useState(false);
  const [backupJSON, setBackupJSON] = useState('');

  const todayISO = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const backupSummary = buildBackupSummary();
  const todayCount = dailyCountByDateISO[todayISO] ?? 0;
  const isMutedToday = mutedDateISO === todayISO;
  const attrSummary = Object.entries(backupSummary.gameAttrs)
    .map(([key, value]) => `${key} ${value}`)
    .join(' / ');

  function openBackupPreview() {
    const snapshot = buildBackupSnapshot();
    setBackupJSON(formatBackupJSON(snapshot));
    setBackupVisible(true);
  }

  return (
    <ScreenScaffold scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText style={styles.kicker}>CONTROL ROOM</ThemedText>
        <ThemedText style={styles.bigTitle}>设置</ThemedText>
        <ThemedText style={[styles.subtitle, { color: palette.muted }]}>可靠的入口放在这里。安静一点，也安心一点。</ThemedText>
      </View>

      <SectionCard elevated>
        <View style={styles.cardHeaderRow}>
          <ThemedText style={styles.cardTitle}>语境通知</ThemedText>
          <AppChip title={isMutedToday ? '今日静音' : `${todayCount}/3`} selected={isMutedToday} style={styles.statusChip} />
        </View>
        <ThemedText style={[styles.cardSub, { color: palette.muted }]}>
          今日已弹：{todayCount}/3 · 今日静音：{isMutedToday ? '是' : '否'}
        </ThemedText>

        <View style={styles.row}>
          <AppButton variant="outline" title={isMutedToday ? '恢复通知' : '今天别吵我'} onPress={() => (isMutedToday ? unmute() : muteToday())} style={styles.rowButton} />
          <AppButton variant="outline" title="清零计数" onPress={() => resetTodayCount()} style={styles.rowButton} />
        </View>

        <AppButton title="触发测试通知" onPress={() => setTestVisible(true)} />
      </SectionCard>

      <SectionCard elevated>
        <View style={styles.cardHeaderRow}>
          <ThemedText style={styles.cardTitle}>数据备份</ThemedText>
          <AppChip title="预览版" selected style={styles.statusChip} />
        </View>
        <ThemedText style={[styles.cardSub, { color: palette.muted }]}>先查看本地数据摘要和 JSON，不做导入、不写文件。</ThemedText>

        <View style={[styles.summaryPanel, { backgroundColor: palette.input, borderColor: palette.border }]}>
          <SummaryRow label="Todo" value={`${backupSummary.todosTotal} 条 / 已完成 ${backupSummary.todosDone}`} mutedText={palette.muted} />
          <SummaryRow label="Habit" value={`${backupSummary.habitsTotal} 个 / 已归档 ${backupSummary.habitsArchived}`} mutedText={palette.muted} />
          <SummaryRow label="Game" value={attrSummary} mutedText={palette.muted} />
          <SummaryRow label="Location" value={backupSummary.gameLocation ?? '未记录'} mutedText={palette.muted} />
          <SummaryRow label="Event" value={backupSummary.gameEventId} mutedText={palette.muted} />
          <SummaryRow label="Inspiration" value={`${backupSummary.inspirationsTotal} 条`} mutedText={palette.muted} />
          <SummaryRow label="Mood" value={`${backupSummary.moodsTotal} 条`} mutedText={palette.muted} />
          <SummaryRow label="Reward logs" value={backupSummary.rewardLogsTotal === 0 ? '暂未记录' : `${backupSummary.rewardLogsTotal} 条`} mutedText={palette.muted} />
        </View>

        <AppButton title="查看 JSON 预览" onPress={openBackupPreview} />
      </SectionCard>

      <Modal visible={testVisible} transparent animationType="fade" onRequestClose={() => setTestVisible(false)}>
        <Pressable style={[styles.mask, { backgroundColor: palette.overlay }]} onPress={() => setTestVisible(false)}>
          <Pressable style={styles.maskInner} />
        </Pressable>
        <View style={[styles.center, { paddingBottom: insets.bottom + uiTokens.spacing.xl }]}>
          <SectionCard elevated style={styles.panel}>
            <ThemedText style={styles.panelTitle}>挑一个触发类型</ThemedText>

            <AppButton
              variant="outline"
              title="新建"
              onPress={() => {
                trigger({ type: 'todo_created', key: `test.todo_created.${Date.now()}`, title: '测试：新建', body: '你刚新建了一个待办。嗯，确实是你。', force: true });
                setTestVisible(false);
              }}
            />
            <AppButton
              variant="outline"
              title="完成"
              onPress={() => {
                trigger({ type: 'todo_completed', key: `test.todo_completed.${Date.now()}`, title: '测试：完成', body: '完成了一项待办。你今天挺像个人的。', force: true });
                setTestVisible(false);
              }}
            />
            <AppButton
              variant="outline"
              title="到期前"
              onPress={() => {
                trigger({ type: 'todo_due_soon', key: `test.todo_due_soon.${Date.now()}`, title: '测试：到期前', body: '到期前提醒：再拖就真到期了。', force: true });
                setTestVisible(false);
              }}
            />
            <AppButton
              variant="outline"
              title="停滞"
              onPress={() => {
                trigger({ type: 'habit_stagnant', key: `test.habit_stagnant.${Date.now()}`, title: '测试：停滞', body: '打卡停滞：你是把动力丢哪了？', force: true });
                setTestVisible(false);
              }}
            />
          </SectionCard>
        </View>
      </Modal>

      <Modal visible={backupVisible} transparent animationType="fade" onRequestClose={() => setBackupVisible(false)}>
        <Pressable style={[styles.mask, { backgroundColor: palette.overlay }]} onPress={() => setBackupVisible(false)}>
          <Pressable style={styles.maskInner} />
        </Pressable>
        <View style={[styles.backupCenter, { paddingBottom: insets.bottom + uiTokens.spacing.xl }]}>
          <SectionCard elevated style={styles.backupPanel}>
            <View style={styles.cardHeaderRow}>
              <ThemedText style={styles.panelTitle}>JSON 预览</ThemedText>
              <AppButton variant="ghost" title="关闭" onPress={() => setBackupVisible(false)} style={styles.closeBtn} />
            </View>
            <ScrollView style={[styles.jsonScroll, { backgroundColor: palette.input }]} contentContainerStyle={styles.jsonContent}>
              <ThemedText selectable style={[styles.jsonText, { color: palette.muted }]}>
                {backupJSON}
              </ThemedText>
            </ScrollView>
          </SectionCard>
        </View>
      </Modal>
    </ScreenScaffold>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  mutedText: string;
};

function SummaryRow({ label, value, mutedText }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={[styles.summaryValue, { color: mutedText }]}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: uiTokens.spacing.md },
  header: { paddingTop: uiTokens.layout.headerPaddingTop, paddingBottom: uiTokens.spacing.md, gap: uiTokens.spacing.sm },
  kicker: { ...uiTokens.typography.meta, textAlign: 'center', letterSpacing: 1.2 },
  bigTitle: uiTokens.typography.screenTitle,
  subtitle: { fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  cardTitle: uiTokens.typography.cardTitle,
  cardSub: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  statusChip: { paddingVertical: 6 },
  row: { flexDirection: 'row', gap: uiTokens.spacing.sm, flexWrap: 'wrap' },
  rowButton: { flex: 1, minWidth: 120 },
  summaryPanel: { borderWidth: 1, borderRadius: uiTokens.radius.md, padding: uiTokens.spacing.md, gap: uiTokens.spacing.sm },
  summaryRow: { gap: 2 },
  summaryLabel: uiTokens.typography.chip,
  summaryValue: { fontSize: 13, lineHeight: 18, fontWeight: '800' },

  mask: { ...StyleSheet.absoluteFillObject },
  maskInner: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: uiTokens.spacing.xl },
  panel: { width: '100%' },
  panelTitle: { ...uiTokens.typography.cardTitle, textAlign: 'center' },
  backupCenter: { flex: 1, padding: uiTokens.spacing.xl, justifyContent: 'center' },
  backupPanel: { maxHeight: '82%', width: '100%' },
  closeBtn: { minHeight: 34, paddingVertical: 6, paddingHorizontal: uiTokens.spacing.md },
  jsonScroll: { borderRadius: uiTokens.radius.md },
  jsonContent: { padding: uiTokens.spacing.md },
  jsonText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
});
