import type { WishItem, WishStatus } from '@/stores/wishlistStore';

export type WishStatusSummary = {
  count: number;
  amountCents: number;
};

export type WishStats = {
  totalCount: number;
  totalAmountCents: number;
  byStatus: Record<WishStatus, WishStatusSummary>;
};

export function selectSortedWishItems(items: WishItem[]): WishItem[] {
  const statusOrder: Record<WishStatus, number> = {
    want: 0,
    paused: 1,
    bought: 2,
    abandoned: 3,
  };

  return [...items].sort((left, right) => {
    const statusDiff = statusOrder[left.status] - statusOrder[right.status];
    if (statusDiff !== 0) return statusDiff;
    return right.createdAt - left.createdAt;
  });
}

export function selectWishStats(items: WishItem[]): WishStats {
  const stats: WishStats = {
    totalCount: items.length,
    totalAmountCents: 0,
    byStatus: {
      want: { count: 0, amountCents: 0 },
      bought: { count: 0, amountCents: 0 },
      paused: { count: 0, amountCents: 0 },
      abandoned: { count: 0, amountCents: 0 },
    },
  };

  for (const item of items) {
    const priceCents = Number.isFinite(item.priceCents) ? Math.max(0, Math.round(item.priceCents)) : 0;
    stats.totalAmountCents += priceCents;
    stats.byStatus[item.status].count += 1;
    stats.byStatus[item.status].amountCents += priceCents;
  }

  return stats;
}

export function selectWishCooldownDays(item: WishItem, now: number = Date.now()): number {
  const diff = Math.max(0, now - item.createdAt);
  return Math.floor(diff / 86_400_000);
}

export function selectWishItemsByStatus(items: WishItem[], status: WishStatus): WishItem[] {
  return selectSortedWishItems(items).filter((item) => item.status === status);
}
