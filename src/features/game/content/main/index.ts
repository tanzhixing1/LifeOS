import { mainEvents } from '@/features/game/content/main/events';
import { mainLocations } from '@/features/game/content/main/locations';
import mainMapJson from '@/features/game/content/main/map.json';
import { mainNpcLocationEncounters, mainNpcs, mainNpcSchedules } from '@/features/game/content/main/npcs';
import {
  LILITH_REALITY_CHAT_EVENT_ID,
  LILITH_TALK_EVENT_IDS,
  lilithNoRecentRealityLogText,
  mainNpcRealityReactionRules,
} from '@/features/game/content/main/npcReactions';
import type { ContentPack, MapNode } from '@/features/game/engine/types';

const mainMap = mainMapJson as unknown as MapNode[];

export const mainContentPack: ContentPack = {
  startEventId: 'prologue_wake_up',
  events: mainEvents,
  map: mainMap,
};

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
