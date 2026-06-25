import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/services/storage/zustandStorage';

export type NpcRelationship = {
  npcId: string;
  bond: number;
  giftsReceived: number;
  updatedAt: number;
};

export type GiftLog = {
  id: string;
  npcId: string;
  itemId: string;
  bondDelta: number;
  message: string;
  createdAt: number;
};

export type RelationshipState = {
  relationships: Record<string, NpcRelationship>;
  giftLogs: GiftLog[];
};

export type RelationshipActions = {
  addGiftBond(input: { npcId: string; itemId: string; bondDelta: number; message: string }): void;
  getRelationship(npcId: string): NpcRelationship;
};

export type RelationshipStore = RelationshipState & RelationshipActions;

function createDefaultRelationship(npcId: string, now: number = Date.now()): NpcRelationship {
  return {
    npcId,
    bond: 0,
    giftsReceived: 0,
    updatedAt: now,
  };
}

export const useRelationshipStore = create<RelationshipStore>()(
  persist(
    (set, get) => ({
      relationships: {},
      giftLogs: [],
      addGiftBond(input) {
        const now = Date.now();
        set((state) => {
          const previous = state.relationships[input.npcId] ?? createDefaultRelationship(input.npcId, now);
          const nextRelationship: NpcRelationship = {
            ...previous,
            bond: Math.max(0, previous.bond + input.bondDelta),
            giftsReceived: previous.giftsReceived + 1,
            updatedAt: now,
          };
          const nextLog: GiftLog = {
            id: `gift_${now}_${Math.random().toString(36).slice(2, 8)}`,
            npcId: input.npcId,
            itemId: input.itemId,
            bondDelta: input.bondDelta,
            message: input.message,
            createdAt: now,
          };

          return {
            relationships: {
              ...state.relationships,
              [input.npcId]: nextRelationship,
            },
            giftLogs: [nextLog, ...state.giftLogs].slice(0, 50),
          };
        });
      },
      getRelationship(npcId) {
        return get().relationships[npcId] ?? createDefaultRelationship(npcId);
      },
    }),
    {
      name: 'lifeos.relationshipStore',
      version: 1,
      storage: zustandStorage,
      partialize: (state) => ({
        relationships: state.relationships,
        giftLogs: state.giftLogs,
      }),
      migrate: (persistedState: any) => {
        const relationships = persistedState?.relationships && typeof persistedState.relationships === 'object' ? persistedState.relationships : {};
        const giftLogs = Array.isArray(persistedState?.giftLogs) ? persistedState.giftLogs : [];
        return { relationships, giftLogs };
      },
    }
  )
);
