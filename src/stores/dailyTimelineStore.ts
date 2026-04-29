import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/services/storage/zustandStorage';

export type DailyTimelineRecordSource = 'todo' | 'habit' | 'schedule' | 'manual';

export type DailyTimelineRecordKind = 'completed' | 'manual';

export type DailyTimelineSourceSnapshot = {
  title: string;
  category?: string;
  iconId?: string;
  dueAt?: number | null;
  schedule?: string;
};

export type DailyTimelineRecord = {
  id: string;
  dateISO: string;
  occurredAt: number;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number | null;
  source: DailyTimelineRecordSource;
  sourceId?: string;
  title: string;
  note?: string;
  category?: string;
  categoryColor?: string;
  iconId?: string;
  kind: DailyTimelineRecordKind;
  dedupeKey?: string;
  sourceSnapshot?: DailyTimelineSourceSnapshot;
};

export type DailyTimelineRecordInput = Omit<DailyTimelineRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> &
  Partial<Pick<DailyTimelineRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export type DailyTimelineState = {
  records: DailyTimelineRecord[];
};

export type DailyTimelineActions = {
  addRecord(input: DailyTimelineRecordInput): string;
  updateRecord(id: string, patch: Partial<Omit<DailyTimelineRecord, 'id' | 'createdAt'>>): void;
  upsertRecord(input: DailyTimelineRecordInput): string;
  softDeleteRecord(id: string): void;
  softDeleteByDedupeKey(dedupeKey: string): void;
  getRecordsByDate(dateISO: string): DailyTimelineRecord[];
};

export type DailyTimelineStore = DailyTimelineState & DailyTimelineActions;

function createRecordId(): string {
  return `dt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function activeRecordsForDate(records: DailyTimelineRecord[], dateISO: string): DailyTimelineRecord[] {
  return records
    .filter((record) => record.dateISO === dateISO && !record.deletedAt)
    .sort((a, b) => a.occurredAt - b.occurredAt || a.createdAt - b.createdAt);
}

function normalizeRecord(input: DailyTimelineRecordInput, now: number = Date.now()): DailyTimelineRecord {
  return {
    ...input,
    id: input.id ?? createRecordId(),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt,
    deletedAt: input.deletedAt ?? null,
  };
}

export function selectDailyTimelineRecordsByDate(state: DailyTimelineStore, dateISO: string): DailyTimelineRecord[] {
  return activeRecordsForDate(state.records, dateISO);
}

export const useDailyTimelineStore = create<DailyTimelineStore>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord(input) {
        const record = normalizeRecord(input);
        set((state) => ({ records: [record, ...state.records] }));
        return record.id;
      },
      updateRecord(id, patch) {
        const now = Date.now();
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id ? { ...record, ...patch, id: record.id, createdAt: record.createdAt, updatedAt: now } : record
          ),
        }));
      },
      upsertRecord(input) {
        const now = Date.now();
        const dedupeKey = input.dedupeKey;
        if (!dedupeKey) return get().addRecord(input);

        const existing = get().records.find((record) => record.dedupeKey === dedupeKey);
        if (!existing) {
          const record = normalizeRecord(input, now);
          set((state) => ({ records: [record, ...state.records] }));
          return record.id;
        }

        const next: DailyTimelineRecord = {
          ...existing,
          ...input,
          id: existing.id,
          createdAt: existing.createdAt,
          updatedAt: now,
          deletedAt: null,
        };
        set((state) => ({ records: state.records.map((record) => (record.id === existing.id ? next : record)) }));
        return existing.id;
      },
      softDeleteRecord(id) {
        const now = Date.now();
        set((state) => ({
          records: state.records.map((record) => (record.id === id ? { ...record, deletedAt: now, updatedAt: now } : record)),
        }));
      },
      softDeleteByDedupeKey(dedupeKey) {
        const now = Date.now();
        set((state) => ({
          records: state.records.map((record) =>
            record.dedupeKey === dedupeKey ? { ...record, deletedAt: now, updatedAt: now } : record
          ),
        }));
      },
      getRecordsByDate(dateISO) {
        return activeRecordsForDate(get().records, dateISO);
      },
    }),
    {
      name: 'lifeos.dailyTimelineStore',
      version: 1,
      storage: zustandStorage,
      partialize: (state) => ({ records: state.records }),
      migrate: (persistedState: any) => {
        const records = Array.isArray(persistedState?.records) ? persistedState.records : [];
        return { records };
      },
    }
  )
);
