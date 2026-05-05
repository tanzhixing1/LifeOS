import locationEventsJson from '@/features/game/content/main/events/locations.json';
import npcLilithEventsJson from '@/features/game/content/main/events/npc-lilith.json';
import prologueEventsJson from '@/features/game/content/main/events/prologue.json';
import type { EventNode } from '@/features/game/engine/types';

const prologueEvents = prologueEventsJson as unknown as EventNode[];
const locationEvents = locationEventsJson as unknown as EventNode[];
const npcLilithEvents = npcLilithEventsJson as unknown as EventNode[];

export const mainEvents: EventNode[] = [
  ...prologueEvents,
  locationEvents[0],
  npcLilithEvents[0],
  ...locationEvents.slice(1),
  ...npcLilithEvents.slice(1),
];
