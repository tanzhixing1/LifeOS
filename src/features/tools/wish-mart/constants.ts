import type { WishStatus } from '@/stores/wishlistStore';

export const WISH_STATUS_ORDER: WishStatus[] = ['want', 'bought', 'paused', 'abandoned'];

export const WISH_STATUS_META: Record<
  WishStatus,
  {
    label: string;
    shortLabel: string;
    stampLabel: string;
    tint: string;
    tintSoft: string;
    border: string;
  }
> = {
  want: {
    label: '想买',
    shortLabel: 'WISH',
    stampLabel: 'WISH',
    tint: '#8B6FA1',
    tintSoft: 'rgba(139,111,161,0.14)',
    border: 'rgba(139,111,161,0.28)',
  },
  bought: {
    label: '已买',
    shortLabel: 'PAID',
    stampLabel: 'PAID',
    tint: '#C96B78',
    tintSoft: 'rgba(201,107,120,0.14)',
    border: 'rgba(201,107,120,0.3)',
  },
  paused: {
    label: '暂缓',
    shortLabel: 'HOLD',
    stampLabel: 'HOLD',
    tint: '#7C7A8D',
    tintSoft: 'rgba(124,122,141,0.14)',
    border: 'rgba(124,122,141,0.28)',
  },
  abandoned: {
    label: '放弃',
    shortLabel: 'VOID',
    stampLabel: 'VOID',
    tint: '#B15C5C',
    tintSoft: 'rgba(177,92,92,0.14)',
    border: 'rgba(177,92,92,0.28)',
  },
};

export const WISH_MART_BARCODE = '|||| 052026 WISH MART ||||';
export const WISH_RECEIPT_DIVIDER = '--------------------------------';
