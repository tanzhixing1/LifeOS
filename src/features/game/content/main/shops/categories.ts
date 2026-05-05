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
    unlockRequirements: [{ type: 'flag', key: 'fogberry_map_intro_seen', value: true }],
    lockedReason: '走完序章并熟悉雾莓镇后开放。',
  },
  {
    id: 'gift',
    name: '羁绊送礼',
    description: '适合送给镇上居民的小心意。',
    unlockRequirements: [{ type: 'flag', key: 'lilith_first_meeting_done', value: true }],
    lockedReason: '与莉莉丝正式见面后开放。',
  },
  {
    id: 'special',
    name: '特殊物品',
    description: '雾莓镇的特殊许可商品。',
    unlockRequirements: [{ type: 'flag', key: 'special_shop_unlocked', value: true }],
    lockedReason: '需要获得雾莓镇的特殊许可。',
  },
];
