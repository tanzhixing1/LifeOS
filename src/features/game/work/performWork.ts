import { toMinutesOfDay } from '@/features/game/engine/time';
import { useGameStore } from '@/stores/gameStore';
import { useWalletStore } from '@/stores/walletStore';

import type { WorkJob } from './jobs';

export type WorkResult = {
  ok: boolean;
  title: string;
  message: string;
};

function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function isJobAvailableNow(job: WorkJob): boolean {
  const player = useGameStore.getState().player;
  if (job.availableFromHour == null || job.availableToHour == null) return true;

  const now = toMinutesOfDay(player.gameTime);
  const start = job.availableFromHour * 60;
  const end = job.availableToHour * 60;
  return now >= start && now < end;
}

export function canPerformWork(job: WorkJob): WorkResult {
  const player = useGameStore.getState().player;
  if (!isJobAvailableNow(job)) {
    return {
      ok: false,
      title: '现在接不了这份活',
      message: `${job.locationName}这份短工不在当前时间开放，换个时间再来吧。`,
    };
  }

  if (player.vitals.fatigue >= 90) {
    return {
      ok: false,
      title: '太累了',
      message: '现在已经很疲劳了，先回小屋休息一下比较稳。',
    };
  }

  if (player.vitals.bodyStatus <= 20) {
    return {
      ok: false,
      title: '身体状态不适合',
      message: '身体状态太低，今天先别硬撑着打工。',
    };
  }

  return { ok: true, title: '可以打工', message: '' };
}

export function performWork(job: WorkJob): WorkResult {
  const availability = canPerformWork(job);
  if (!availability.ok) return availability;

  const gameStore = useGameStore.getState();
  const player = gameStore.player;
  const nextAttrs = { ...player.attrs };
  for (const [key, delta] of Object.entries(job.attrDeltas ?? {})) {
    nextAttrs[key] = Math.max(0, (nextAttrs[key] ?? 0) + delta);
  }

  gameStore.setPlayer({
    ...player,
    attrs: nextAttrs,
    vitals: {
      ...player.vitals,
      fatigue: clampStat(player.vitals.fatigue + job.fatigueDelta),
      bodyStatus: clampStat(player.vitals.bodyStatus + (job.bodyStatusDelta ?? 0)),
    },
  });
  gameStore.advanceTime(job.durationMinutes);
  useWalletStore.getState().addCurrency('gold', job.goldReward);

  const attrText = Object.entries(job.attrDeltas ?? {})
    .map(([key, value]) => `${key} +${value}`)
    .join('，');
  const extra = attrText ? `，${attrText}` : '';

  return {
    ok: true,
    title: '打工完成',
    message: `获得 ${job.goldReward}G，耗时 ${job.durationMinutes} 分钟，疲劳 +${job.fatigueDelta}${extra}。`,
  };
}
