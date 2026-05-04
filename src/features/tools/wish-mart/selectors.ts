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

const ONE_DAY_MS = 86_400_000;
const HEAVY_RECEIPT_THRESHOLD_CENTS = 100_000;

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
  const createdDate = new Date(item.createdAt);
  const nowDate = new Date(now);
  const createdDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();
  const currentDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const diff = Math.max(0, currentDay - createdDay);
  return Math.floor(diff / ONE_DAY_MS);
}

export function selectWishItemsByStatus(items: WishItem[], status: WishStatus): WishItem[] {
  return selectSortedWishItems(items).filter((item) => item.status === status);
}

export function getWishCooldownLabel(item: WishItem, now: number = Date.now()): string {
  const days = selectWishCooldownDays(item, now);

  if (item.status === 'want') {
    return days <= 0 ? '今天刚记下' : `已冷静 ${days} 天`;
  }

  if (item.status === 'paused') {
    return days <= 0 ? '今天暂缓' : `暂缓 ${days} 天`;
  }

  if (item.status === 'bought') {
    return days <= 0 ? '已购买' : `冷静 ${days} 天后购买`;
  }

  return days <= 0 ? '已放弃' : `冷静 ${days} 天后放弃`;
}

export function getWishMartBriefing(stats: WishStats, items: WishItem[]): string {
  if (stats.totalCount === 0) {
    return '今天还没有愿望入账，钱包暂时安全。';
  }

  if (stats.totalAmountCents >= HEAVY_RECEIPT_THRESHOLD_CENTS) {
    return '这张小票有点沉，建议先睡一觉再决定。';
  }

  if (stats.byStatus.want.count === 0 && stats.byStatus.paused.count === 0 && stats.byStatus.abandoned.count === 0 && stats.byStatus.bought.count > 0) {
    return '这张小票已经结清，但下次也要记得冷静。';
  }

  const abandonedCount = stats.byStatus.abandoned.count;
  if (abandonedCount > 0) {
    return `你已经放弃了 ${abandonedCount} 个冲动，钱包向你致谢。`;
  }

  const pausedCount = stats.byStatus.paused.count;
  if (pausedCount > 0) {
    return `有 ${pausedCount} 个愿望被暂缓，明天的你也许会更清醒。`;
  }

  const wantCount = stats.byStatus.want.count;
  if (wantCount >= 3) {
    return `这张小票上还有 ${wantCount} 个愿望没付款，先让它们冷静一下。`;
  }

  const longestCoolingDays = items.reduce((max, item) => Math.max(max, selectWishCooldownDays(item)), 0);
  if (longestCoolingDays >= 7) {
    return `最长的一条愿望已经冷静 ${longestCoolingDays} 天，答案可能快浮出来了。`;
  }

  return '只是愿望清单，不是正式记账，也不接支付。';
}
