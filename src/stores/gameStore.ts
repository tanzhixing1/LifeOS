import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PlayerState } from '@/features/game/engine/types';
import { zustandStorage } from '@/services/storage/zustandStorage';

export type SaveSlot = {
  id: string;
  savedAt: number;
  player: PlayerState;
  eventId: string;
};

export type GameState = {
  player: PlayerState;
  eventId: string;
  saveSlots: Record<string, SaveSlot | null>;
};

export type GameActions = {
  setPlayer(player: PlayerState): void;
  setFlag(key: string, value: boolean): void;
  addAttr(key: string, value: number): void;
  setLocation(locationId: string | undefined): void;
  gotoEvent(eventId: string): void;
  save(slotId: string): void;
  load(slotId: string): void;
  resetGame(): void;
};

export type GameStore = GameState & GameActions;

function defaultState(): GameState {
  return {
    player: {
      attrs: { mana: 100, hp: 100, sanity: 100, stamina: 0, focus: 0, charisma: 0, intelligence: 0 },
      flags: {},
      location: 'room',
    },
    eventId: 'demo_start',
    saveSlots: {
      slot1: null,
      slot2: null,
      slot3: null,
    },
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),
      setPlayer(player) {
        set({ player });
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
      setLocation(locationId) {
        set((s) => ({ player: { ...s.player, location: locationId } }));
      },
      gotoEvent(eventId) {
        set({ eventId });
      },
      save(slotId) {
        const state = get();
        const slot: SaveSlot = {
          id: slotId,
          savedAt: Date.now(),
          player: state.player,
          eventId: state.eventId,
        };
        set((s) => ({ saveSlots: { ...s.saveSlots, [slotId]: slot } }));
      },
      load(slotId) {
        const slot = get().saveSlots[slotId];
        if (!slot) return;
        set({ player: slot.player, eventId: slot.eventId });
      },
      resetGame() {
        set(defaultState());
      },
    }),
    {
      name: 'lifeos.gameStore',
      version: 2,
      storage: zustandStorage,
      partialize: (s) => ({ player: s.player, eventId: s.eventId, saveSlots: s.saveSlots }),
      migrate: (persistedState: any) => {
        if (persistedState?.player?.attrs) {
          const attrs = persistedState.player.attrs;
          persistedState.player.attrs = {
            mana: typeof attrs.mana === 'number' ? attrs.mana : 100,
            hp: typeof attrs.hp === 'number' ? attrs.hp : 100,
            sanity: typeof attrs.sanity === 'number' ? attrs.sanity : 100,
            ...attrs,
          };
        }
        return persistedState;
      },
    }
  )
);
