import { isLocationOpen, isTimeInOpenHours } from './time';
import type { GameLocation, GameNpc, GameTime, NpcLocationEncounter, NpcPresence, NpcScheduleBlock } from './types';

const WEEKDAY_COUNT = 7;

function findLocation(locationId: string, locations?: GameLocation[]): GameLocation | undefined {
  return locations?.find((location) => location.id === locationId);
}

function compareSchedulePriority(a: NpcScheduleBlock, b: NpcScheduleBlock): number {
  const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
  if (priorityDiff !== 0) return priorityDiff;
  const startA = a.startHour * 60 + (a.startMinute ?? 0);
  const startB = b.startHour * 60 + (b.startMinute ?? 0);
  return startA - startB;
}

export function getDayOfWeek(gameTime: GameTime): number {
  return ((gameTime.day - 1) % WEEKDAY_COUNT + WEEKDAY_COUNT) % WEEKDAY_COUNT;
}

function isScheduleActiveOnDay(block: NpcScheduleBlock, dayOfWeek: number): boolean {
  if (block.repeat === 'weekly') {
    return Array.isArray(block.weekdays) && block.weekdays.includes(dayOfWeek);
  }

  return true;
}

function getScheduleDayOfWeek(block: NpcScheduleBlock, gameTime: GameTime): number {
  const dayOfWeek = getDayOfWeek(gameTime);
  const start = block.startHour * 60 + (block.startMinute ?? 0);
  const end = block.endHour * 60 + (block.endMinute ?? 0);
  const now = gameTime.hour * 60 + gameTime.minute;

  if (start > end && now < end) {
    return (dayOfWeek + WEEKDAY_COUNT - 1) % WEEKDAY_COUNT;
  }

  return dayOfWeek;
}

function isScheduleActive(block: NpcScheduleBlock, gameTime: GameTime): boolean {
  if (!isScheduleActiveOnDay(block, getScheduleDayOfWeek(block, gameTime))) return false;

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

export function getActiveScheduleBlock(
  npcId: string,
  gameTime: GameTime,
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): NpcScheduleBlock | null {
  const activeBlocks = schedules
    .filter(
      (block) =>
        block.npcId === npcId &&
        isScheduleActive(block, gameTime) &&
        isScheduledLocationOpen(block, gameTime, locations)
    )
    .sort(compareSchedulePriority);

  return activeBlocks[0] ?? null;
}

export function getNpcLocationAtTime(
  npcId: string,
  gameTime: GameTime,
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): string | null {
  const activeBlock = getActiveScheduleBlock(npcId, gameTime, schedules, locations);
  return activeBlock?.locationId ?? null;
}

export function getNpcActivityAtTime(
  npcId: string,
  gameTime: GameTime,
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): string | null {
  return getActiveScheduleBlock(npcId, gameTime, schedules, locations)?.activity ?? null;
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

export function getNpcPresencesAtLocation(
  locationId: string,
  gameTime: GameTime,
  npcs: GameNpc[],
  schedules: NpcScheduleBlock[],
  locations?: GameLocation[]
): NpcPresence[] {
  const location = findLocation(locationId, locations);
  if (location && !isLocationOpen(location, gameTime)) return [];

  return npcs
    .map((npc) => {
      const schedule = getActiveScheduleBlock(npc.id, gameTime, schedules, locations);
      if (!schedule || schedule.locationId !== locationId) return null;

      return {
        npc,
        locationId,
        activity: schedule.activity ?? '正在这里停留',
        schedule,
      };
    })
    .filter((presence): presence is NpcPresence => Boolean(presence));
}

export function getNpcDailyTimeline(npcId: string, dayOfWeek: number, schedules: NpcScheduleBlock[]): NpcScheduleBlock[] {
  return schedules
    .filter((block) => block.npcId === npcId && isScheduleActiveOnDay(block, dayOfWeek))
    .sort(compareSchedulePriority);
}

export function formatNpcScheduleTime(block: NpcScheduleBlock): string {
  const startMinute = block.startMinute ?? 0;
  const endMinute = block.endMinute ?? 0;
  return `${String(block.startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}-${String(block.endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
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
