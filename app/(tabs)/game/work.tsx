import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatGameTime } from '@/features/game/engine/time';
import { workJobs } from '@/features/game/work/jobs';
import { canPerformWork, performWork } from '@/features/game/work/performWork';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGameStore } from '@/stores/gameStore';
import { useWalletStore } from '@/stores/walletStore';

export default function GameWorkScreen() {
  const pageBg = useThemeColor({ light: '#F2EEE8', dark: '#171819' }, 'background');
  const cardBg = useThemeColor({ light: '#FDF8ED', dark: '#1C1F22' }, 'background');
  const cardAlt = useThemeColor({ light: '#F7F0E3', dark: '#24282D' }, 'background');
  const cardBorder = useThemeColor({ light: '#D8C9B8', dark: '#2A3036' }, 'text');
  const mutedText = useThemeColor({ light: '#7A6F62', dark: '#A7B0BE' }, 'text');
  const textColor = useThemeColor({ light: '#3D352E', dark: '#E4E4E7' }, 'text');
  const accent = useThemeColor({ light: '#B88452', dark: '#D8B174' }, 'tint');

  const params = useLocalSearchParams<{ from?: string | string[] }>();
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const player = useGameStore((s) => s.player);
  const gold = useWalletStore((s) => s.currencies.gold);

  const jobStates = workJobs.map((job) => ({ job, availability: canPerformWork(job) }));

  function goBack() {
    router.replace(from === 'map' ? '/(tabs)/game/map' : '/(tabs)/game');
  }

  function handleWork(jobId: string) {
    const job = workJobs.find((item) => item.id === jobId);
    if (!job) return;

    const result = performWork(job);
    Alert.alert(result.title, result.message);
  }

  return (
    <ThemedView style={[styles.screen, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable onPress={goBack} style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
              <ThemedText style={[styles.backText, { color: mutedText }]}>返回</ThemedText>
            </Pressable>
            <View style={styles.headerTitleBlock}>
              <ThemedText style={[styles.kicker, { color: accent }]}>ODD JOB BOARD</ThemedText>
              <ThemedText style={[styles.bigTitle, { color: textColor }]}>零工委托</ThemedText>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <ThemedText style={[styles.subtitle, { color: mutedText }]}>花一点时间做短工，换些今天能用上的金币。</ThemedText>
        </View>

        <View style={[styles.statusCard, { backgroundColor: cardAlt, borderColor: cardBorder }]}>
          <StatusPill label="时间" value={formatGameTime(player.gameTime)} accent={accent} mutedText={mutedText} borderColor={cardBorder} />
          <StatusPill label="疲劳" value={`${player.vitals.fatigue}/100`} accent={accent} mutedText={mutedText} borderColor={cardBorder} />
          <StatusPill label="金币" value={`${gold}G`} accent={accent} mutedText={mutedText} borderColor={cardBorder} />
        </View>

        <View style={[styles.noticeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <ThemedText style={[styles.noticeTitle, { color: textColor }]}>今日短工</ThemedText>
          <ThemedText style={[styles.noticeText, { color: mutedText }]}>疲劳过高或身体状态太低时，短工会暂时停下。别把自己熬成一张纸。</ThemedText>
        </View>

        <View style={styles.jobList}>
          {jobStates.map(({ job, availability }) => (
            <View key={job.id} style={[styles.jobCard, { backgroundColor: cardBg, borderColor: availability.ok ? accent : cardBorder }]}>
              <View style={styles.jobTop}>
                <ThemedText style={styles.jobIcon}>{job.icon}</ThemedText>
                <View style={styles.jobTitleBlock}>
                  <ThemedText style={[styles.jobTitle, { color: textColor }]}>{job.title}</ThemedText>
                  <ThemedText style={[styles.jobLocation, { color: mutedText }]}>{job.locationName}</ThemedText>
                </View>
                <View style={[styles.jobBadge, { borderColor: availability.ok ? accent : cardBorder }]}>
                  <ThemedText style={[styles.jobBadgeText, { color: availability.ok ? accent : mutedText }]}>{availability.ok ? '可接' : '暂停'}</ThemedText>
                </View>
              </View>

              <ThemedText style={[styles.jobDescription, { color: mutedText }]}>{job.description}</ThemedText>

              <View style={styles.jobMetaRow}>
                <MetaTag label={`${job.goldReward}G`} borderColor={cardBorder} color={accent} />
                <MetaTag label={`${job.durationMinutes} 分钟`} borderColor={cardBorder} color={mutedText} />
                <MetaTag label={`疲劳 +${job.fatigueDelta}`} borderColor={cardBorder} color={mutedText} />
              </View>

              {!availability.ok ? <ThemedText style={[styles.lockText, { color: mutedText }]}>{availability.message}</ThemedText> : null}

              <Pressable
                disabled={!availability.ok}
                onPress={() => handleWork(job.id)}
                style={({ pressed }) => [
                  styles.workButton,
                  {
                    borderColor: availability.ok ? accent : cardBorder,
                    backgroundColor: availability.ok ? (pressed ? 'rgba(184,132,82,0.24)' : 'rgba(184,132,82,0.12)') : 'rgba(122,117,111,0.08)',
                    opacity: availability.ok ? 1 : 0.56,
                  },
                ]}>
                <ThemedText style={[styles.workButtonText, { color: availability.ok ? accent : mutedText }]}>开始打工</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

type StatusPillProps = {
  label: string;
  value: string;
  accent: string;
  mutedText: string;
  borderColor: string;
};

function StatusPill({ label, value, accent, mutedText, borderColor }: StatusPillProps) {
  return (
    <View style={[styles.statusPill, { borderColor }]}>
      <ThemedText style={[styles.statusLabel, { color: accent }]}>{label}</ThemedText>
      <ThemedText style={[styles.statusValue, { color: mutedText }]}>{value}</ThemedText>
    </View>
  );
}

function MetaTag({ label, borderColor, color }: { label: string; borderColor: string; color: string }) {
  return (
    <View style={[styles.metaTag, { borderColor }]}>
      <ThemedText style={[styles.metaText, { color }]}>{label}</ThemedText>
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
  statusCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: { flexGrow: 1, minWidth: 92, borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  statusLabel: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  statusValue: { fontSize: 11, lineHeight: 14, fontWeight: '800' },
  noticeCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 6 },
  noticeTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  noticeText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  jobList: { gap: 10 },
  jobCard: { borderWidth: 1.5, borderRadius: 18, padding: 14, gap: 10 },
  jobTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobIcon: { fontSize: 28, lineHeight: 32 },
  jobTitleBlock: { flex: 1, minWidth: 0, gap: 2 },
  jobTitle: { fontSize: 16, lineHeight: 20, fontWeight: '900' },
  jobLocation: { fontSize: 11, lineHeight: 14, fontWeight: '800' },
  jobBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  jobBadgeText: { fontSize: 10, lineHeight: 12, fontWeight: '900' },
  jobDescription: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  jobMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },
  lockText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  workButton: { minHeight: 40, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  workButtonText: { fontSize: 13, lineHeight: 16, fontWeight: '900' },
});
