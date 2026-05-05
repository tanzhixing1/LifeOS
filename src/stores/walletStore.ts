import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CurrencyType } from '@/features/game/content/main/shops/types';
import { zustandStorage } from '@/services/storage/zustandStorage';

export type { CurrencyType };

export type WalletState = {
  currencies: Record<CurrencyType, number>;
  addCurrency: (currency: CurrencyType, amount: number) => void;
  spendCurrency: (currency: CurrencyType, amount: number) => boolean;
  canAfford: (currency: CurrencyType, amount: number) => boolean;
  resetWallet: () => void;
};

function defaultCurrencies(): Record<CurrencyType, number> {
  return {
    gold: 100,
    gem: 0,
    ticket: 0,
  };
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      currencies: defaultCurrencies(),
      addCurrency(currency, amount) {
        if (amount <= 0 || !Number.isFinite(amount)) return;
        set((s) => ({
          currencies: {
            ...s.currencies,
            [currency]: (s.currencies[currency] ?? 0) + amount,
          },
        }));
      },
      spendCurrency(currency, amount) {
        if (amount <= 0 || !Number.isFinite(amount)) return false;
        const current = get().currencies[currency] ?? 0;
        if (current < amount) return false;

        set((s) => ({
          currencies: {
            ...s.currencies,
            [currency]: (s.currencies[currency] ?? 0) - amount,
          },
        }));
        return true;
      },
      canAfford(currency, amount) {
        if (amount <= 0 || !Number.isFinite(amount)) return false;
        return (get().currencies[currency] ?? 0) >= amount;
      },
      resetWallet() {
        set({ currencies: defaultCurrencies() });
      },
    }),
    {
      name: 'lifeos-wallet-store',
      version: 1,
      storage: zustandStorage,
      partialize: (s) => ({ currencies: s.currencies }),
    }
  )
);
