import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { addMinutesToGameTime, normalizeGameTime } from '@/features/game/engine/time';
import type { GameTime, PlayerState, PlayerVitals, PlayerWallet } from '@/features/game/engine/types';
import { zustandStorage } from '@/services/storage/zustandStorage';

export const DEFAULT_ATTRS = {
  mana: 100,
  hp: 100,
  sanity: 100,
  stamina: 0,
  focus: 0,
  charisma: 0,
  intelligence: 0,
  proficiency: 0,
  family: 0,
  friendship: 0,
} as const;

const DEFAULT_LOCATION = 'home';

export const DEFAULT_GAME_TIME: GameTime = {
  day: 1,
  hour: 7,
  minute: 0,
};

export const DEFAULT_VITALS: PlayerVitals = {
  bodyStatus: 100,
  fatigue: 0,
  intoxication: 0,
};

export const DEFAULT_WALLET: PlayerWallet = {
  money: 50,
};

export type SaveSlot = {
  id: string;
  savedAt: number;
  player: PlayerState;
  eventId: string;
};

export type RewardLogDirection = 'gain' | 'revert';

export type RewardLog = {
  id: string;
  source: 'todo' | 'habit' | 'game';
  sourceId: string;
  title: string;
  category: string;
  deltas: Record<string, number>;
  direction: RewardLogDirection;
  createdAt: number;
};

export type GameState = {
  player: PlayerState;
  eventId: string;
  saveSlots: Record<string, SaveSlot | null>;
  rewardLogs: RewardLog[];
};

export type GameActions = {
  setPlayer(player: PlayerState): void;
  setFlag(key: string, value: boolean): void;
  addAttr(key: string, value: number): void;
  addAttrClamped(key: string, value: number): void;
  setGameTime(time: Partial<GameTime>): void;
  advanceTime(minutes: number): void;
  sleepToNextDay(): void;
  addRewardLog(log: RewardLog): void;
  setLocation(locationId: string | undefined): void;
  gotoEvent(eventId: string): void;
  save(slotId: string): void;
  load(slotId: string): void;
  resetGame(): void;
};

export type GameStore = GameState & GameActions;

function normalizeAttrs(attrs?: Partial<Record<string, number>> | null): Record<string, number> {
  const normalized: Record<string, number> = { ...DEFAULT_ATTRS };
  if (!attrs || typeof attrs !== 'object') return normalized;

  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'number' && Number.isFinite(value)) normalized[key] = value;
  }

  return normalized;
}

function normalizeLocation(location?: string): string {
  if (location === 'room') return DEFAULT_LOCATION;
  return typeof location === 'string' && location.length > 0 ? location : DEFAULT_LOCATION;
}

function normalizeVitals(vitals?: Partial<PlayerVitals> | null): PlayerVitals {
  return {
    bodyStatus: typeof vitals?.bodyStatus === 'number' && Number.isFinite(vitals.bodyStatus) ? vitals.bodyStatus : DEFAULT_VITALS.bodyStatus,
    fatigue: typeof vitals?.fatigue === 'number' && Number.isFinite(vitals.fatigue) ? vitals.fatigue : DEFAULT_VITALS.fatigue,
    intoxication:
      typeof vitals?.intoxication === 'number' && Number.isFinite(vitals.intoxication)
        ? vitals.intoxication
        : DEFAULT_VITALS.intoxication,
  };
}

function normalizeWallet(wallet?: Partial<PlayerWallet> | null): PlayerWallet {
  return {
    money: typeof wallet?.money === 'number' && Number.isFinite(wallet.money) ? wallet.money : DEFAULT_WALLET.money,
  };
}

function normalizePlayer(player?: Partial<PlayerState> | null): PlayerState {
  return {
    attrs: normalizeAttrs(player?.attrs),
    flags: player?.flags && typeof player.flags === 'object' ? { ...player.flags } : {},
    location: normalizeLocation(player?.location),
    gameTime: normalizeGameTime(player?.gameTime),
    vitals: normalizeVitals(player?.vitals),
    wallet: normalizeWallet(player?.wallet),
  };
}

function normalizeSaveSlot(slot: SaveSlot | null | undefined): SaveSlot | null {
  if (!slot) return null;
  return {
    ...slot,
    player: normalizePlayer(slot.player),
  };
}

function defaultState(): GameState {
  return {
    player: normalizePlayer(),
    eventId: 'demo_start',
    saveSlots: {
      slot1: null,
      slot2: null,
      slot3: null,
    },
    rewardLogs: [],
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),
      setPlayer(player) {
        set({ player: normalizePlayer(player) });
      },
      setFlag(key, value) {
        set((s) => ({ player: { ...s.player, flags: { ...s.player.flags, [key]: value } } }));
      },
      addAttr(key, value) {
        set((s) => {
          const current = s.player.attrs[key] ?? 0;
          return { player: { ...s.player, attrs: { ...s.player.attrs, [key]: current + value } } };
        });
      },
      addAttrClamped(key, value) {
        set((s) => {
          const current = s.player.attrs[key] ?? 0;
          const next = Math.max(0, current + value);
          return { player: { ...s.player, attrs: { ...s.player.attrs, [key]: next } } };
        });
      },
      setGameTime(time) {
        set((s) => ({ player: { ...s.player, gameTime: normalizeGameTime({ ...s.player.gameTime, ...time }) } }));
      },
      advanceTime(minutes) {
        set((s) => ({ player: { ...s.player, gameTime: addMinutesToGameTime(s.player.gameTime, minutes) } }));
      },
      sleepToNextDay() {
        set((s) => ({
          player: {
            ...s.player,
            location: DEFAULT_LOCATION,
            gameTime: {
              day: s.player.gameTime.day + 1,
              hour: DEFAULT_GAME_TIME.hour,
              minute: DEFAULT_GAME_TIME.minute,
            },
            vitals: {
              ...s.player.vitals,
              bodyStatus: DEFAULT_VITALS.bodyStatus,
              fatigue: DEFAULT_VITALS.fatigue,
              intoxication: DEFAULT_VITALS.intoxication,
            },
          },
        }));
      },
      addRewardLog(log) {
        set((s) => ({ rewardLogs: [log, ...s.rewardLogs].slice(0, 50) }));
      },
      setLocation(locationId) {
        set((s) => ({ player: { ...s.player, location: normalizeLocation(locationId) } }));
      },
      gotoEvent(eventId) {
        set({ eventId });
      },
      save(slotId) {
        const state = get();
        const slot: SaveSlot = {
          id: slotId,
          savedAt: Date.now(),
          player: normalizePlayer(state.player),
          eventId: state.eventId,
        };
        set((s) => ({ saveSlots: { ...s.saveSlots, [slotId]: slot } }));
      },
      load(slotId) {
        const slot = normalizeSaveSlot(get().saveSlots[slotId]);
        if (!slot) return;
        set((s) => ({
          player: slot.player,
          eventId: slot.eventId,
          saveSlots: { ...s.saveSlots, [slotId]: slot },
        }));
      },
      resetGame() {
        set((s) => ({ ...defaultState(), rewardLogs: s.rewardLogs }));
      },
    }),
    {
      name: 'lifeos.gameStore',
      version: 5,
      storage: zustandStorage,
      partialize: (s) => ({ player: s.player, eventId: s.eventId, saveSlots: s.saveSlots, rewardLogs: s.rewardLogs }),
      migrate: (persistedState: any) => {
        const state = persistedState && typeof persistedState === 'object' ? persistedState : {};

        const saveSlots = state?.saveSlots && typeof state.saveSlots === 'object' ? state.saveSlots : {};

        return {
          ...state,
          player: normalizePlayer(state.player),
          saveSlots: {
            slot1: normalizeSaveSlot(saveSlots.slot1),
            slot2: normalizeSaveSlot(saveSlots.slot2),
            slot3: normalizeSaveSlot(saveSlots.slot3),
          },
          rewardLogs: Array.isArray(state.rewardLogs) ? state.rewardLogs : [],
        };
      },
    }
  )
);
