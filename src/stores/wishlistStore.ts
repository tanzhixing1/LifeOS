import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/services/storage/zustandStorage';

export type WishStatus = 'want' | 'bought' | 'paused' | 'abandoned';

export type WishItem = {
  id: string;
  name: string;
  priceCents: number;
  category?: string;
  note?: string;
  status: WishStatus;
  createdAt: number;
  updatedAt?: number;
  boughtAt?: number;
};

export type WishItemInput = {
  name: string;
  priceCents?: number;
  category?: string;
  note?: string;
  status?: WishStatus;
  boughtAt?: number;
};

export type WishItemPatch = Partial<Omit<WishItem, 'id' | 'createdAt'>>;

export type WishlistState = {
  items: WishItem[];
};

export type WishlistActions = {
  addItem(input: WishItemInput): string;
  updateItem(id: string, patch: WishItemPatch): void;
  removeItem(id: string): void;
  setStatus(id: string, status: WishStatus): void;
};

export type WishlistStore = WishlistState & WishlistActions;

function createWishId(): string {
  return `wish_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePriceCents(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function applyStatusTransition(previous: WishItem, nextStatus: WishStatus, now: number): Pick<WishItem, 'status' | 'boughtAt'> {
  if (nextStatus === 'bought') {
    return {
      status: nextStatus,
      boughtAt: previous.status === 'bought' ? previous.boughtAt ?? now : now,
    };
  }

  return {
    status: nextStatus,
    boughtAt: undefined,
  };
}

function createWishItem(input: WishItemInput, now: number = Date.now()): WishItem {
  const status = input.status ?? 'want';
  const createdAt = now;
  return {
    id: createWishId(),
    name: input.name.trim(),
    priceCents: normalizePriceCents(input.priceCents),
    category: normalizeOptionalText(input.category),
    note: normalizeOptionalText(input.note),
    status,
    createdAt,
    updatedAt: createdAt,
    boughtAt: status === 'bought' ? input.boughtAt ?? now : undefined,
  };
}

function mergeWishItem(previous: WishItem, patch: WishItemPatch, now: number = Date.now()): WishItem {
  const nextName = typeof patch.name === 'string' ? patch.name.trim() : previous.name;
  const nextStatus = patch.status ?? previous.status;
  const statusFields = applyStatusTransition(previous, nextStatus, now);

  return {
    ...previous,
    ...statusFields,
    name: nextName || previous.name,
    priceCents: patch.priceCents == null ? previous.priceCents : normalizePriceCents(patch.priceCents),
    category: typeof patch.category === 'string' ? normalizeOptionalText(patch.category) : previous.category,
    note: typeof patch.note === 'string' ? normalizeOptionalText(patch.note) : previous.note,
    updatedAt: now,
  };
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      items: [],
      addItem(input) {
        const name = input.name.trim();
        if (!name) return '';

        const next = createWishItem({ ...input, name });
        set((state) => ({ items: [next, ...state.items] }));
        return next.id;
      },
      updateItem(id, patch) {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            return mergeWishItem(item, patch);
          }),
        }));
      },
      removeItem(id) {
        set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      },
      setStatus(id, status) {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            return mergeWishItem(item, { status });
          }),
        }));
      },
    }),
    {
      name: 'lifeos.wishlistStore',
      version: 1,
      storage: zustandStorage,
      partialize: (state) => ({ items: state.items }),
      migrate: (persistedState: any) => {
        const items = Array.isArray(persistedState?.items) ? persistedState.items : [];
        return {
          items: items
            .map((item: any) => {
              const now = typeof item?.createdAt === 'number' ? item.createdAt : Date.now();
              const status: WishStatus =
                item?.status === 'bought' || item?.status === 'paused' || item?.status === 'abandoned' ? item.status : 'want';

              const name = String(item?.name ?? '').trim();
              if (!name) return null;

              return {
                id: String(item?.id ?? createWishId()),
                name,
                priceCents: normalizePriceCents(item?.priceCents),
                category: normalizeOptionalText(typeof item?.category === 'string' ? item.category : undefined),
                note: normalizeOptionalText(typeof item?.note === 'string' ? item.note : undefined),
                status,
                createdAt: now,
                updatedAt: typeof item?.updatedAt === 'number' ? item.updatedAt : now,
                boughtAt: status === 'bought' && typeof item?.boughtAt === 'number' ? item.boughtAt : undefined,
              } satisfies WishItem;
            })
            .filter(Boolean) as WishItem[],
        };
      },
    }
  )
);
