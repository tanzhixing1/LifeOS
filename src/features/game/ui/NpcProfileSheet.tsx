import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/core/ui/AppButton';
import { SectionCard } from '@/core/ui/SectionCard';
import { uiTokens } from '@/core/theme/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatNpcScheduleTime } from '@/features/game/engine/npc';
import type { GameLocation, NpcPresence, NpcScheduleBlock } from '@/features/game/engine/types';

type NpcProfileSheetProps = {
  visible: boolean;
  presence: NpcPresence | null;
  currentLocationName: string;
  dayOfWeek: number;
  dailyTimeline: NpcScheduleBlock[];
  locations: GameLocation[];
  onClose: () => void;
};

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function NpcProfileSheet({
  visible,
  presence,
  currentLocationName,
  dayOfWeek,
  dailyTimeline,
  locations,
  onClose,
}: NpcProfileSheetProps) {
  const theme = useColorScheme() ?? 'light';
  const palette = uiTokens.colors[theme];
  const npc = presence?.npc;
  const locationNameById = new Map(locations.map((location) => [location.id, location.name]));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.mask, { backgroundColor: palette.overlay }]} onPress={onClose}>
        <Pressable style={styles.maskInner} />
      </Pressable>

      <View style={styles.sheetWrap}>
        <SectionCard elevated style={styles.sheet}>
          {npc && presence ? (
            <>
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <ThemedText style={styles.kicker}>NPC PROFILE</ThemedText>
                  <ThemedText style={styles.title}>{npc.name}</ThemedText>
                  {npc.role ? <ThemedText style={[styles.role, { color: palette.muted }]}>{npc.role}</ThemedText> : null}
                </View>
                <AppButton title="关闭" variant="ghost" onPress={onClose} style={styles.closeButton} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
                <View style={[styles.presenceBox, { backgroundColor: palette.input, borderColor: palette.border }]}>
                  <ThemedText style={[styles.presenceLabel, { color: palette.muted }]}>当前</ThemedText>
                  <ThemedText style={styles.presenceText}>{currentLocationName}</ThemedText>
                  <ThemedText style={[styles.activityText, { color: palette.accentStrong }]}>{presence.activity}</ThemedText>
                </View>

                <ThemedText style={[styles.description, { color: palette.muted }]}>{npc.description}</ThemedText>

                {npc.dailyNote ? <ThemedText style={[styles.note, { color: palette.muted }]}>{npc.dailyNote}</ThemedText> : null}

                {npc.personalityTags?.length ? (
                  <View style={styles.chipRow}>
                    {npc.personalityTags.map((tag) => (
                      <View key={tag} style={[styles.chip, { borderColor: palette.border, backgroundColor: palette.input }]}>
                        <ThemedText style={[styles.chipText, { color: palette.accentStrong }]}>{tag}</ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.metaGrid}>
                  {npc.ageLabel ? <MetaItem label="年龄" value={npc.ageLabel} mutedColor={palette.muted} /> : null}
                  {npc.pronouns ? <MetaItem label="代称" value={npc.pronouns} mutedColor={palette.muted} /> : null}
                  {npc.homeLocationId ? (
                    <MetaItem label="常住" value={locationNameById.get(npc.homeLocationId) ?? npc.homeLocationId} mutedColor={palette.muted} />
                  ) : null}
                </View>

                <View style={styles.timelineWrap}>
                  <ThemedText style={styles.sectionTitle}>今日行程 · {WEEKDAY_LABELS[dayOfWeek] ?? '今日'}</ThemedText>
                  {dailyTimeline.length > 0 ? (
                    dailyTimeline.map((block) => (
                      <View key={`${block.npcId}.${block.locationId}.${block.startHour}.${block.endHour}`} style={styles.timelineItem}>
                        <ThemedText style={[styles.timelineTime, { color: palette.accentStrong }]}>{formatNpcScheduleTime(block)}</ThemedText>
                        <View style={styles.timelineCopy}>
                          <ThemedText style={styles.timelineLocation}>{locationNameById.get(block.locationId) ?? block.locationId}</ThemedText>
                          <ThemedText style={[styles.timelineActivity, { color: palette.muted }]}>{block.activity ?? '停留'}</ThemedText>
                        </View>
                      </View>
                    ))
                  ) : (
                    <ThemedText style={[styles.emptyText, { color: palette.muted }]}>今天还没有公开行程。</ThemedText>
                  )}
                </View>
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptySheet}>
              <ThemedText style={styles.title}>没有选中的 NPC</ThemedText>
              <AppButton title="关闭" variant="outline" onPress={onClose} />
            </View>
          )}
        </SectionCard>
      </View>
    </Modal>
  );
}

function MetaItem({ label, value, mutedColor }: { label: string; value: string; mutedColor: string }) {
  return (
    <View style={styles.metaItem}>
      <ThemedText style={[styles.metaLabel, { color: mutedColor }]}>{label}</ThemedText>
      <ThemedText style={styles.metaValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: { ...StyleSheet.absoluteFillObject },
  maskInner: { flex: 1 },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: uiTokens.spacing.xl,
    paddingBottom: uiTokens.spacing.xl,
  },
  sheet: {
    maxHeight: '86%',
    borderRadius: uiTokens.radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: uiTokens.spacing.md },
  titleWrap: { flex: 1, gap: 3 },
  kicker: { ...uiTokens.typography.meta, letterSpacing: 1.2 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '900' },
  role: { fontSize: 13, lineHeight: 18, fontWeight: '900' },
  closeButton: { minHeight: 34, paddingVertical: 6, paddingHorizontal: uiTokens.spacing.sm },
  body: { gap: uiTokens.spacing.md, paddingBottom: uiTokens.spacing.xs },
  presenceBox: { borderWidth: 1, borderRadius: uiTokens.radius.lg, padding: uiTokens.spacing.md, gap: 4 },
  presenceLabel: { ...uiTokens.typography.meta },
  presenceText: { fontSize: 17, lineHeight: 22, fontWeight: '900' },
  activityText: { fontSize: 14, lineHeight: 19, fontWeight: '900' },
  description: { fontSize: 14, lineHeight: 21, fontWeight: '800' },
  note: { fontSize: 13, lineHeight: 19, fontWeight: '800', fontStyle: 'italic' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.xs },
  chip: { borderWidth: 1, borderRadius: uiTokens.radius.pill, paddingHorizontal: uiTokens.spacing.sm, paddingVertical: 5 },
  chipText: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: uiTokens.spacing.sm },
  metaItem: { minWidth: 86, gap: 2 },
  metaLabel: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  metaValue: { fontSize: 13, lineHeight: 17, fontWeight: '900' },
  timelineWrap: { gap: uiTokens.spacing.sm },
  sectionTitle: { ...uiTokens.typography.cardTitle },
  timelineItem: { flexDirection: 'row', gap: uiTokens.spacing.md, alignItems: 'flex-start' },
  timelineTime: { width: 92, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  timelineCopy: { flex: 1, minWidth: 0, gap: 2 },
  timelineLocation: { fontSize: 14, lineHeight: 18, fontWeight: '900' },
  timelineActivity: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  emptySheet: { gap: uiTokens.spacing.md },
});
