import { mainNpcs } from '@/features/game/content/main';
import { gameItems } from '@/features/game/content/main/items/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useRelationshipStore } from '@/stores/relationshipStore';

export type GiveGiftResult = {
  ok: boolean;
  title: string;
  message: string;
};

function getBaseBondDelta(itemId: string): number {
  const item = gameItems[itemId];
  if (!item) return 0;
  const rarityBonus = item.rarity === 'rare' ? 3 : item.rarity === 'special' ? 5 : 0;
  const lilithBonus = item.tags?.some((tag) => ['莉莉丝', '薄荷', '书本', '甜食'].includes(tag)) ? 2 : 0;
  return 4 + rarityBonus + lilithBonus;
}

export function canGiveGift(itemId: string): boolean {
  const item = gameItems[itemId];
  return Boolean(item && (item.type === 'gift' || item.giftable));
}

export function giveGiftToNpc(npcId: string, itemId: string): GiveGiftResult {
  const npc = mainNpcs.find((item) => item.id === npcId);
  const item = gameItems[itemId];
  if (!npc || !item) {
    return {
      ok: false,
      title: '无法送出',
      message: '目标或物品不存在。',
    };
  }

  if (!canGiveGift(itemId)) {
    return {
      ok: false,
      title: '暂时不能送礼',
      message: '这件物品不适合作为礼物。',
    };
  }

  const removed = useInventoryStore.getState().removeItem(itemId, 1);
  if (!removed) {
    return {
      ok: false,
      title: '数量不足',
      message: '背包里已经没有这件礼物了。',
    };
  }

  const bondDelta = getBaseBondDelta(itemId);
  const message = `${npc.name}收下了「${item.name}」。羁绊 +${bondDelta}。`;
  useRelationshipStore.getState().addGiftBond({
    npcId,
    itemId,
    bondDelta,
    message,
  });

  return {
    ok: true,
    title: '礼物送出',
    message,
  };
}
