import type { GachaPool } from './types';

export const fogberryLuckyBottlePool: GachaPool = {
  id: 'fogberry_lucky_bottle',
  name: '雾莓幸运瓶',
  subtitle: '今日小物抽取',
  description: '据说瓶子会把适合你的东西轻轻推到面前。',
  costCurrency: 'gold',
  costAmount: 30,
  rewards: [
    { id: 'warm_bread', itemId: 'warm_bread', amount: 1, weight: 18 },
    { id: 'berry_milk', itemId: 'berry_milk', amount: 1, weight: 16 },
    { id: 'sweet_water', itemId: 'sweet_water', amount: 1, weight: 14 },
    { id: 'mistberry', itemId: 'mistberry', amount: 1, weight: 14 },
    { id: 'moon_grass_powder', itemId: 'moon_grass_powder', amount: 1, weight: 8 },
    { id: 'dried_mint_leaf', itemId: 'dried_mint_leaf', amount: 1, weight: 12 },
    { id: 'sweet_water_pair', itemId: 'sweet_water_pair', amount: 1, weight: 8 },
    { id: 'glowing_mint_candy', itemId: 'glowing_mint_candy', amount: 1, weight: 4 },
    { id: 'pressed_flower_card', itemId: 'pressed_flower_card', amount: 1, weight: 6 },
  ],
};
