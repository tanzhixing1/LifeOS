import { isLocationOpen, isTimeInOpenHours } from './time';
import type { GameLocation, GameNpc, GameTime, NpcLocationEncounter, NpcScheduleBlock } from './types';

function findLocation(locationId: string, locations?: GameLocation[]): GameLocation | undefined {
  return locations?.find((location) => location.id === locationId);
}

function isScheduleActive(block: NpcScheduleBlock, gameTime: GameTime): boolean {
  return isTimeInOpenHours(gameTime, {
    startHour: block.startHour,
    startMinute: block.startMinute,
    endHour: block.endHour,
    endMinute: block.endMinute,
  });
}

function isScheduledLocationOpen(block: NpcScheduleBlock, gameTime: GameTime, locations?: GameLocation[]): boolean {
  const location = findLocation(block.locationId, locations);
  return location ? isLocationOpen(location, gameTime) : true;
}

export function getNpcLocationAtTime(
  npcId: string,
  gameTime: GameTime,
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): string | null {
  const activeBlock = schedules.find(
    (block) =>
      block.npcId === npcId &&
      isScheduleActive(block, gameTime) &&
      isScheduledLocationOpen(block, gameTime, locations)
  );

  return activeBlock?.locationId ?? null;
}

export function getNpcsAtLocation(
  locationId: string,
  gameTime: GameTime,
  npcs: GameNpc[],
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): GameNpc[] {
  const location = findLocation(locationId, locations);
  if (location && !isLocationOpen(location, gameTime)) return [];

  return npcs.filter((npc) => getNpcLocationAtTime(npc.id, gameTime, schedules, locations) === locationId);
}

export function isNpcAtLocation(
  npcId: string,
  locationId: string,
  gameTime: GameTime,
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): boolean {
  return getNpcLocationAtTime(npcId, gameTime, schedules, locations) === locationId;
}

export function getNpcEncountersAtLocation(
  locationId: string,
  gameTime: GameTime,
  npcs: GameNpc[],
  schedules: NpcScheduleBlock[],
  encounters: NpcLocationEncounter[],
  locations?: GameLocation[]
): (NpcLocationEncounter & { npc: GameNpc })[] {
  const visibleNpcs = getNpcsAtLocation(locationId, gameTime, npcs, schedules, locations);
  const visibleNpcIds = new Set(visibleNpcs.map((npc) => npc.id));

  return encounters
    .filter((encounter) => encounter.locationId === locationId && visibleNpcIds.has(encounter.npcId))
    .map((encounter) => {
      const npc = visibleNpcs.find((item) => item.id === encounter.npcId);
      return npc ? { ...encounter, npc } : null;
    })
    .filter((encounter): encounter is NpcLocationEncounter & { npc: GameNpc } => Boolean(encounter));
}
