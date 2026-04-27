import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getLocalISODate } from '@/core/utils/date';
import { zustandStorage } from '@/services/storage/zustandStorage';

export type Habit = {
  id: string;
  title: string;
  schedule?: string;
  iconId?: string;
  archived?: boolean;
};

export type HabitLogStatus = 'done' | 'miss';

export type HabitLog = {
  date: string;
  habitId: string;
  status: HabitLogStatus;
};

export type HabitActions = {
  addHabit(input: Omit<Habit, 'id'> & { id?: string }): string;
  updateHabit(id: string, patch: Partial<Omit<Habit, 'id'>>): void;
  setArchived(id: string, archived: boolean): void;
  setLog(input: HabitLog): void;
  clearLog(date: string, habitId: string): void;
  toggleTodayDone(habitId: string): void;
  removeHabit(id: string): void;
};

export type HabitState = {
  habits: Record<string, Habit>;
  logs: HabitLog[];
};

export type HabitStore = HabitState & HabitActions;

function computeStreak(doneDates: Set<string>, todayISO: string): number {
  if (!doneDates.has(todayISO)) return 0;
  let streak = 0;
  const cursor = new Date(`${todayISO}T00:00:00`);
  while (true) {
    const iso = getLocalISODate(cursor);
    if (!doneDates.has(iso)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type HabitCard = Habit & {
  statusToday: HabitLogStatus | null;
  doneToday: boolean;
  streakDays: number;
};

export function selectHabitCards(state: HabitStore, date: Date = new Date()): HabitCard[] {
  const todayISO = getLocalISODate(date);
  const logsTodayByHabitId = new Map<string, HabitLogStatus>();
  for (const log of state.logs) {
    if (log.date !== todayISO) continue;
    logsTodayByHabitId.set(log.habitId, log.status);
  }

  const doneDatesByHabitId = new Map<string, Set<string>>();
  for (const log of state.logs) {
    if (log.status !== 'done') continue;
    let setDates = doneDatesByHabitId.get(log.habitId);
    if (!setDates) {
      setDates = new Set<string>();
      doneDatesByHabitId.set(log.habitId, setDates);
    }
    setDates.add(log.date);
  }

  const habits = Object.values(state.habits)
    .filter((h) => !h.archived)
    .sort((a, b) => a.title.localeCompare(b.title));

  return habits.map((h) => {
    const statusToday = logsTodayByHabitId.get(h.id) ?? null;
    const doneToday = statusToday === 'done';
    const doneDates = doneDatesByHabitId.get(h.id) ?? new Set<string>();
    const streakDays = computeStreak(doneDates, todayISO);
    return { ...h, statusToday, doneToday, streakDays };
  });
}

function defaultState(): HabitState {
  const today = getLocalISODate();
  return {
    habits: {
      h1: { id: 'h1', title: '早睡早起', schedule: '每日 1 次', iconId: 'moon', archived: false },
      h2: { id: 'h2', title: '喝水', schedule: '每日 8 次', iconId: 'water', archived: false },
      h3: { id: 'h3', title: '跑步机', schedule: '每日 30 分钟', iconId: 'run', archived: false },
      h4: { id: 'h4', title: '画画', schedule: '每周 3 次', iconId: 'draw', archived: false },
    },
    logs: [
      { date: today, habitId: 'h2', status: 'done' },
      { date: today, habitId: 'h4', status: 'done' },
    ],
  };
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),
      addHabit(input) {
        const id = input.id ?? `h_${Date.now()}`;
        const next: Habit = {
          id,
          title: input.title,
          schedule: input.schedule,
          iconId: input.iconId ?? 'default',
          archived: input.archived ?? false,
        };
        set((s) => ({ habits: { ...s.habits, [id]: next } }));
        return id;
      },
      updateHabit(id, patch) {
        set((s) => {
          const existing = s.habits[id];
          if (!existing) return s;
          return { habits: { ...s.habits, [id]: { ...existing, ...patch } } };
        });
      },
      setArchived(id, archived) {
        set((s) => {
          const existing = s.habits[id];
          if (!existing) return s;
          return { habits: { ...s.habits, [id]: { ...existing, archived } } };
        });
      },
      setLog(input) {
        set((s) => {
          const filtered = s.logs.filter((x) => !(x.date === input.date && x.habitId === input.habitId));
          return { logs: [...filtered, input] };
        });
      },
      clearLog(date, habitId) {
        set((s) => ({ logs: s.logs.filter((x) => !(x.date === date && x.habitId === habitId)) }));
      },
      toggleTodayDone(habitId) {
        const today = getLocalISODate();
        const existing = get().logs.find((x) => x.date === today && x.habitId === habitId);
        if (existing?.status === 'done') get().clearLog(today, habitId);
        else get().setLog({ date: today, habitId, status: 'done' });
      },
      removeHabit(id) {
        set((s) => {
          const { [id]: _removed, ...habits } = s.habits;
          return {
            habits,
            logs: s.logs.filter((x) => x.habitId !== id),
          };
        });
      },
    }),
    {
      name: 'lifeos.habitStore',
      version: 1,
      storage: zustandStorage,
      partialize: (s) => ({
        habits: s.habits,
        logs: s.logs,
      }),
    }
  )
);
