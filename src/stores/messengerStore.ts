import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getLocalISODate } from '@/core/utils/date';
import { zustandStorage } from '@/services/storage/zustandStorage';

export type MessengerTriggerType = 'habit_stagnant' | 'todo_due_soon' | 'todo_completed' | 'todo_created' | 'test';

export type MessengerMessage = {
  id: string;
  type: MessengerTriggerType;
  title: string;
  body: string;
  createdAt: number;
};

export type MessengerState = {
  queue: MessengerMessage[];
  mutedDateISO: string | null;
  dailyCountByDateISO: Record<string, number>;
  triggeredKeysByDateISO: Record<string, Record<string, true>>;
};

export type MessengerActions = {
  trigger(input: { type: MessengerTriggerType; key: string; title: string; body: string; force?: boolean }): boolean;
  pop(): void;
  muteToday(): void;
  unmute(): void;
  resetTodayCount(): void;
  canShowToday(): boolean;
};

export type MessengerStore = MessengerState & MessengerActions;

function defaultState(): MessengerState {
  return {
    queue: [],
    mutedDateISO: null,
    dailyCountByDateISO: {},
    triggeredKeysByDateISO: {},
  };
}

function getTodayISO() {
  return getLocalISODate();
}

export const useMessengerStore = create<MessengerStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),
      canShowToday() {
        const today = getTodayISO();
        const muted = get().mutedDateISO === today;
        if (muted) return false;
        const count = get().dailyCountByDateISO[today] ?? 0;
        return count < 3;
      },
      trigger(input) {
        const today = getTodayISO();
        const keyMap = get().triggeredKeysByDateISO[today] ?? {};
        const alreadyTriggered = keyMap[input.key] === true;
        if (!input.force && alreadyTriggered) return false;
        if (!input.force && !get().canShowToday()) return false;

        const nextCount = (get().dailyCountByDateISO[today] ?? 0) + 1;
        const nextMsg: MessengerMessage = {
          id: `msg_${Date.now()}`,
          type: input.type,
          title: input.title,
          body: input.body,
          createdAt: Date.now(),
        };

        set((s) => ({
          queue: [...s.queue, nextMsg],
          dailyCountByDateISO: { ...s.dailyCountByDateISO, [today]: nextCount },
          triggeredKeysByDateISO: { ...s.triggeredKeysByDateISO, [today]: { ...keyMap, [input.key]: true } },
        }));
        return true;
      },
      pop() {
        set((s) => ({ queue: s.queue.slice(1) }));
      },
      muteToday() {
        const today = getTodayISO();
        set({ mutedDateISO: today });
      },
      unmute() {
        set({ mutedDateISO: null });
      },
      resetTodayCount() {
        const today = getTodayISO();
        set((s) => ({ dailyCountByDateISO: { ...s.dailyCountByDateISO, [today]: 0 } }));
      },
    }),
    {
      name: 'lifeos.messengerStore',
      version: 1,
      storage: zustandStorage,
      partialize: (s) => ({
        queue: s.queue,
        mutedDateISO: s.mutedDateISO,
        dailyCountByDateISO: s.dailyCountByDateISO,
        triggeredKeysByDateISO: s.triggeredKeysByDateISO,
      }),
    }
  )
);

