import mainPackJson from '@/features/game/content/main/events.json';
import { mainLocations } from '@/features/game/content/main/locations';
import { mainNpcLocationEncounters, mainNpcs, mainNpcSchedules } from '@/features/game/content/main/npcs';
import {
  LILITH_REALITY_CHAT_EVENT_ID,
  LILITH_TALK_EVENT_IDS,
  lilithNoRecentRealityLogText,
  mainNpcRealityReactionRules,
} from '@/features/game/content/main/npcReactions';
import type { ContentPack } from '@/features/game/engine/types';

export const mainContentPack = mainPackJson as ContentPack;

export {
  LILITH_REALITY_CHAT_EVENT_ID,
  LILITH_TALK_EVENT_IDS,
  lilithNoRecentRealityLogText,
  mainLocations,
  mainNpcLocationEncounters,
  mainNpcRealityReactionRules,
  mainNpcs,
  mainNpcSchedules,
};
