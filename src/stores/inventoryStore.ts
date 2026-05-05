import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { zustandStorage } from '@/services/storage/zustandStorage';

export type InventoryItemStack = {
  itemId: string;
  quantity: number;
  updatedAt: number;
};

export type InventoryState = {
  items: Record<string, InventoryItemStack>;
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => boolean;
  getItemQuantity: (itemId: string) => number;
  resetInventory: () => void;
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: {},
      addItem(itemId, quantity = 1) {
        if (!itemId || quantity <= 0 || !Number.isFinite(quantity)) return;
        set((s) => {
          const existing = s.items[itemId];
          return {
            items: {
              ...s.items,
              [itemId]: {
                itemId,
                quantity: (existing?.quantity ?? 0) + quantity,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
      removeItem(itemId, quantity = 1) {
        if (!itemId || quantity <= 0 || !Number.isFinite(quantity)) return false;
        const existing = get().items[itemId];
        if (!existing || existing.quantity < quantity) return false;

        set((s) => {
          const current = s.items[itemId];
          if (!current) return s;
          const nextQuantity = current.quantity - quantity;
          if (nextQuantity <= 0) {
            const { [itemId]: _removed, ...items } = s.items;
            return { items };
          }

          return {
            items: {
              ...s.items,
              [itemId]: {
                ...current,
                quantity: nextQuantity,
                updatedAt: Date.now(),
              },
            },
          };
        });
        return true;
      },
      getItemQuantity(itemId) {
        return get().items[itemId]?.quantity ?? 0;
      },
      resetInventory() {
        set({ items: {} });
      },
    }),
    {
      name: 'lifeos-inventory-store',
      version: 1,
      storage: zustandStorage,
      partialize: (s) => ({ items: s.items }),
    }
  )
);
