import type { ShopCategory } from '@/features/game/content/main/shops/types';

export const shopCategories: ShopCategory[] = [
  {
    id: 'daily',
    name: '日常用品',
    description: '基础生活补给。',
    unlocked: true,
  },
  {
    id: 'materials',
    name: '魔药材料',
    description: '瓶罐、草药和一点点危险的香气。',
    unlocked: false,
    lockedReason: '完成第一次魔药课程后开放。',
  },
  {
    id: 'gift',
    name: '羁绊送礼',
    description: '适合送给镇上居民的小心意。',
    unlocked: false,
    lockedReason: '认识更多居民后开放。',
  },
  {
    id: 'special',
    name: '特殊物品',
    description: '雾莓镇的特殊许可商品。',
    unlocked: false,
    lockedReason: '获得特殊许可后开放。',
  },
];
