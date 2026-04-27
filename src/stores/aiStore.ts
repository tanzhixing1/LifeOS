import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/services/storage/zustandStorage';

export type AIState = {
  activeCharacterId: string | null;
};

export type AIActions = {
  setActiveCharacterId(id: string | null): void;
};

export type AIStore = AIState & AIActions;

function defaultState(): AIState {
  return { activeCharacterId: null };
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      ...defaultState(),
      setActiveCharacterId(id) {
        set({ activeCharacterId: id });
      },
    }),
    { name: 'lifeos.aiStore', version: 1, storage: zustandStorage, partialize: (s) => ({ activeCharacterId: s.activeCharacterId }) }
  )
);

