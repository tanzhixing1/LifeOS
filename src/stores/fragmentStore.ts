import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LegacyMoodKind, MoodIntensity, MoodKind } from '@/core/constants/mood';
import { zustandStorage } from '@/services/storage/zustandStorage';

export type { LegacyMoodKind, MoodIntensity, MoodKind } from '@/core/constants/mood';

export type FragmentType = 'inspiration' | 'mood';

export type InspirationFragment = {
  id: string;
  type: 'inspiration';
  content: string;
  createdAt: number;
  updatedAt?: number;
};

export type MoodFragment = {
  id: string;
  type: 'mood';
  mood: MoodKind | LegacyMoodKind;
  intensity: MoodIntensity;
  note: string;
  createdAt: number;
  updatedAt?: number;
};

export type LabFragment = InspirationFragment | MoodFragment;

export type FragmentState = {
  fragments: LabFragment[];
};

export type FragmentActions = {
  addInspiration(input: { content: string }): string;
  addMood(input: { mood: MoodKind; intensity: MoodIntensity; note?: string }): string;
  updateInspiration(id: string, input: { content: string }): void;
  updateMood(id: string, input: { mood: MoodKind; intensity: MoodIntensity; note: string }): void;
  removeFragment(id: string): void;
  getFragmentsByType<T extends FragmentType>(type: T): Extract<LabFragment, { type: T }>[];
};

export type FragmentStore = FragmentState & FragmentActions;

function createFragmentId(type: FragmentType) {
  return `fragment_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useFragmentStore = create<FragmentStore>()(
  persist(
    (set, get) => ({
      fragments: [],
      addInspiration(input) {
        const content = input.content.trim();
        const id = createFragmentId('inspiration');
        const now = Date.now();
        const next: InspirationFragment = {
          id,
          type: 'inspiration',
          content,
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
    }),
    {
      name: 'lifeos.fragmentStore',
      version: 1,
      storage: zustandStorage,
      partialize: (s) => ({ fragments: s.fragments }),
    }
  )
);
