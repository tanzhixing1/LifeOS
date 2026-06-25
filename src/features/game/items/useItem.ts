import { gameItems } from '@/features/game/content/main/items/items';
import type { PlayerState, PlayerVitals } from '@/features/game/engine/types';
import { useGameStore } from '@/stores/gameStore';
import { useInventoryStore } from '@/stores/inventoryStore';

type ItemUseEffect = {
  attrDeltas?: Record<string, number>;
  vitalDeltas?: Partial<PlayerVitals>;
  message: string;
};

export type UseGameItemResult = {
  ok: boolean;
  title: string;
  message: string;
};

const ITEM_USE_EFFECTS: Record<string, ItemUseEffect> = {
  warm_bread: {
    attrDeltas: { stamina: 6 },
    vitalDeltas: { fatigue: -8 },
    message: '温热的麦香让身体慢慢回到这里。体力 +6，疲劳 -8。',
  },
  berry_milk: {
    attrDeltas: { mana: 4, sanity: 4 },
    vitalDeltas: { fatigue: -4 },
    message: '淡紫色的牛奶轻轻晃开，心里也跟着安静一点。魔力 +4，理智 +4，疲劳 -4。',
  },
  sweet_water: {
    attrDeltas: { mana: 3 },
    vitalDeltas: { fatigue: -3 },
    message: '颜色可疑，但确实甜。魔力 +3，疲劳 -3。',
  },
  pocket_snack: {
    attrDeltas: { focus: 3, stamina: 2 },
    vitalDeltas: { fatigue: -4 },
    message: '小零食及时把意志力从边缘拉了回来。专注 +3，体力 +2，疲劳 -4。',
  },
};

function clampVital(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function applyEffect(player: PlayerState, effect: ItemUseEffect): PlayerState {
  const nextAttrs = { ...player.attrs };
  for (const [key, delta] of Object.entries(effect.attrDeltas ?? {})) {
    nextAttrs[key] = Math.max(0, (nextAttrs[key] ?? 0) + delta);
  }

  return {
    ...player,
    attrs: nextAttrs,
    vitals: {
      ...player.vitals,
      bodyStatus: clampVital(player.vitals.bodyStatus + (effect.vitalDeltas?.bodyStatus ?? 0)),
      fatigue: clampVital(player.vitals.fatigue + (effect.vitalDeltas?.fatigue ?? 0)),
      intoxication: clampVital(player.vitals.intoxication + (effect.vitalDeltas?.intoxication ?? 0)),
    },
  };
}

export function canUseGameItem(itemId: string): boolean {
  return Boolean(gameItems[itemId]?.usable && ITEM_USE_EFFECTS[itemId]);
}

export function consumeGameItem(itemId: string): UseGameItemResult {
  const item = gameItems[itemId];
  const effect = ITEM_USE_EFFECTS[itemId];
  if (!item || !effect || !item.usable) {
    return {
      ok: false,
      title: '暂时不能使用',
      message: '这件物品现在还没有可用效果。',
    };
  }

  const removed = useInventoryStore.getState().removeItem(itemId, 1);
  if (!removed) {
    return {
      ok: false,
      title: '数量不足',
      message: '背包里已经没有这件物品了。',
    };
  }

  const gameStore = useGameStore.getState();
  gameStore.setPlayer(applyEffect(gameStore.player, effect));

  return {
    ok: true,
    title: `使用了${item.name}`,
    message: effect.message,
  };
}
