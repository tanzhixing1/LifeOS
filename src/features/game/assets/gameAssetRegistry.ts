import type { ImageSourcePropType } from 'react-native';

type GameAssetRegistry = Record<string, ImageSourcePropType>;

// Keep the registry tiny for VG2. Missing ids should always fall back safely in UI.
export const gameBackgrounds: GameAssetRegistry = {
  room_morning: require('../../../../assets/game/backgrounds/room_morning.png'),
};

// Demo sprite art is stored under assets/game/sprites/.
export const gameSprites: GameAssetRegistry = {
  mentor_neutral: require('../../../../assets/game/sprites/mentor_neutral.jpg'),
};

export function getGameBackground(backgroundId?: string): ImageSourcePropType | null {
  if (!backgroundId) return null;
  return gameBackgrounds[backgroundId] ?? null;
}

export function getGameSprite(spriteId?: string): ImageSourcePropType | null {
  if (!spriteId) return null;
  return gameSprites[spriteId] ?? null;
}
