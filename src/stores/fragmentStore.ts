import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LegacyMoodKind, MoodIntensity, MoodKind } from '@/core/constants/mood';
import { normalizeFragmentTags } from '@/features/fragments/tags';
import { zustandStorage } from '@/services/storage/zustandStorage';

export type { LegacyMoodKind, MoodIntensity, MoodKind } from '@/core/constants/mood';

export type FragmentType = 'inspiration' | 'mood';

export type InspirationFragment = {
  id: string;
  type: 'inspiration';
  content: string;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
};

export type MoodFragment = {
  id: string;
  type: 'mood';
  mood: MoodKind | LegacyMoodKind;
  intensity: MoodIntensity;
  note: string;
  tags?: string[];
  createdAt: number;
  updatedAt?: number;
};

export type LabFragment = InspirationFragment | MoodFragment;

export type FragmentBucketState = {
  inspiration: string[];
  mood: string[];
};

export type FragmentLastDrawnState = {
  inspiration: string | null;
  mood: string | null;
};

export type FragmentState = {
  fragments: LabFragment[];
  favoriteIds: string[];
  recentDrawIds: FragmentBucketState;
  lastDrawnId: FragmentLastDrawnState;
};

export type FragmentActions = {
  addInspiration(input: { content: string; tags?: string[] }): string;
  addMood(input: { mood: MoodKind; intensity: MoodIntensity; note?: string; tags?: string[] }): string;
  updateInspiration(id: string, input: { content: string; tags?: string[] }): void;
  updateMood(id: string, input: { mood: MoodKind; intensity: MoodIntensity; note: string; tags?: string[] }): void;
  removeFragment(id: string): void;
  getFragmentsByType<T extends FragmentType>(type: T): Extract<LabFragment, { type: T }>[];
  toggleFavorite(id: string): void;
  recordDraw(type: FragmentType, id: string): void;
  clearRecentDraws(type?: FragmentType): void;
};

export type FragmentStore = FragmentState & FragmentActions;

function createFragmentId(type: FragmentType) {
  return `fragment_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultRecentDrawIds(): FragmentBucketState {
  return {
    inspiration: [],
    mood: [],
  };
}

function defaultLastDrawnId(): FragmentLastDrawnState {
  return {
    inspiration: null,
    mood: null,
  };
}

export const useFragmentStore = create<FragmentStore>()(
  persist(
    (set, get) => ({
      fragments: [],
      favoriteIds: [],
      recentDrawIds: defaultRecentDrawIds(),
      lastDrawnId: defaultLastDrawnId(),
      addInspiration(input) {
        const content = input.content.trim();
        const id = createFragmentId('inspiration');
        const now = Date.now();
        const next: InspirationFragment = {
          id,
          type: 'inspiration',
          content,
          tags: normalizeFragmentTags(input.tags),
          createdAt: now,
        };
        set((s) => ({ fragments: [next, ...s.fragments] }));
        return id;
      },
      addMood(input) {
        const id = createFragmentId('mood');
        const now = Date.now();
        const next: MoodFragment = {
          id,
          type: 'mood',
          mood: input.mood,
          intensity: input.intensity,
          note: input.note?.trim() ?? '',
          tags: normalizeFragmentTags(input.tags),
          createdAt: now,
        };
        set((s) => ({ fragments: [next, ...s.fragments] }));
        return id;
      },
      updateInspiration(id, input) {
        const content = input.content.trim();
        if (!content) return;

        set((s) => ({
          fragments: s.fragments.map((x) =>
            x.id === id && x.type === 'inspiration'
              ? {
                  ...x,
                  content,
                  tags: normalizeFragmentTags(input.tags),
                  updatedAt: Date.now(),
                }
              : x
          ),
        }));
      },
      updateMood(id, input) {
        set((s) => ({
          fragments: s.fragments.map((x) =>
            x.id === id && x.type === 'mood'
              ? {
                  ...x,
                  mood: input.mood,
                  intensity: input.intensity,
                  note: input.note.trim(),
                  tags: normalizeFragmentTags(input.tags),
                  updatedAt: Date.now(),
                }
              : x
          ),
        }));
      },
      removeFragment(id) {
        set((s) => ({ fragments: s.fragments.filter((x) => x.id !== id) }));
      },
      getFragmentsByType(type) {
        return get().fragments.filter((x) => x.type === type) as Extract<LabFragment, { type: typeof type }>[];
      },
      toggleFavorite(id) {
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(id) ? s.favoriteIds.filter((itemId) => itemId !== id) : [id, ...s.favoriteIds],
        }));
      },
      recordDraw(type, id) {
        set((s) => {
          const nextRecentIds = [id, ...s.recentDrawIds[type].filter((itemId) => itemId !== id)].slice(0, 10);
          return {
            recentDrawIds: {
              ...s.recentDrawIds,
              [type]: nextRecentIds,
            },
            lastDrawnId: {
              ...s.lastDrawnId,
              [type]: id,
            },
          };
        });
      },
      clearRecentDraws(type) {
        set((s) => {
          if (!type) {
            return {
              recentDrawIds: defaultRecentDrawIds(),
              lastDrawnId: defaultLastDrawnId(),
            };
          }

          return {
            recentDrawIds: {
              ...s.recentDrawIds,
              [type]: [],
            },
            lastDrawnId: {
              ...s.lastDrawnId,
              [type]: null,
            },
          };
        });
      },
    }),
    {
      name: 'lifeos.fragmentStore',
      version: 2,
      storage: zustandStorage,
      partialize: (s) => ({
        fragments: s.fragments,
        favoriteIds: Array.from(new Set(s.favoriteIds)),
        recentDrawIds: {
          inspiration: s.recentDrawIds.inspiration.slice(0, 10),
          mood: s.recentDrawIds.mood.slice(0, 10),
        },
        lastDrawnId: s.lastDrawnId,
      }),
      migrate: (persistedState: any) => {
        const state = persistedState && typeof persistedState === 'object' ? persistedState : {};
        const recentDrawIds = state.recentDrawIds && typeof state.recentDrawIds === 'object' ? state.recentDrawIds : {};
        const lastDrawnId = state.lastDrawnId && typeof state.lastDrawnId === 'object' ? state.lastDrawnId : {};

        return {
          fragments: Array.isArray(state.fragments)
            ? state.fragments.map((fragment: any) => ({
                ...fragment,
                tags: normalizeFragmentTags(fragment?.tags),
              }))
            : [],
          favoriteIds: Array.isArray(state.favoriteIds)
            ? Array.from(new Set(state.favoriteIds.filter((id: unknown): id is string => typeof id === 'string')))
            : [],
          recentDrawIds: {
            inspiration: Array.isArray(recentDrawIds.inspiration)
              ? recentDrawIds.inspiration.filter((id: unknown): id is string => typeof id === 'string').slice(0, 10)
              : [],
            mood: Array.isArray(recentDrawIds.mood) ? recentDrawIds.mood.filter((id: unknown): id is string => typeof id === 'string').slice(0, 10) : [],
          },
          lastDrawnId: {
            inspiration: typeof lastDrawnId.inspiration === 'string' ? lastDrawnId.inspiration : null,
            mood: typeof lastDrawnId.mood === 'string' ? lastDrawnId.mood : null,
          },
        };
      },
    }
  )
);
