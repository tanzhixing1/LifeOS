import type { GameLocation, GameTime, OpenHours } from './types';

const MINUTES_PER_DAY = 24 * 60;

function clampInteger(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.trunc(value);
}

export function normalizeGameTime(time?: Partial<GameTime> | null): GameTime {
  const day = Math.max(1, clampInteger(time?.day, 1));
  const hour = clampInteger(time?.hour, 7);
  const minute = clampInteger(time?.minute, 0);
  const totalMinutes = Math.max(0, hour * 60 + minute);
  const normalizedHour = Math.floor(totalMinutes / 60) % 24;
  const normalizedMinute = totalMinutes % 60;

  return {
    day,
    hour: normalizedHour,
    minute: normalizedMinute,
  };
}

export function toMinutesOfDay(time: GameTime): number {
  const safeTime = normalizeGameTime(time);
  return safeTime.hour * 60 + safeTime.minute;
}

export function addMinutesToGameTime(time: GameTime, minutes: number): GameTime {
  const safeTime = normalizeGameTime(time);
  const delta = clampInteger(minutes, 0);
  const currentTotal = (safeTime.day - 1) * MINUTES_PER_DAY + toMinutesOfDay(safeTime);
  const nextTotal = Math.max(0, currentTotal + delta);
  const day = Math.floor(nextTotal / MINUTES_PER_DAY) + 1;
  const minutesOfDay = nextTotal % MINUTES_PER_DAY;

  return {
    day,
    hour: Math.floor(minutesOfDay / 60),
    minute: minutesOfDay % 60,
  };
}

export function formatGameTime(time: GameTime): string {
  const safeTime = normalizeGameTime(time);
  return `第 ${safeTime.day} 天 ${String(safeTime.hour).padStart(2, '0')}:${String(safeTime.minute).padStart(2, '0')}`;
}

export function formatOpenHours(openHours?: OpenHours): string | null {
  if (!openHours) return null;

  const start = normalizeGameTime({ hour: openHours.startHour, minute: openHours.startMinute ?? 0 });
  const end = normalizeGameTime({ hour: openHours.endHour, minute: openHours.endMinute ?? 0 });

  return `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}-${String(end.hour).padStart(2, '0')}:${String(end.minute).padStart(2, '0')}`;
}

export function isTimeInOpenHours(gameTime: GameTime, openHours?: OpenHours): boolean {
  if (!openHours) return true;

  const start = toMinutesOfDay({ day: 1, hour: openHours.startHour, minute: openHours.startMinute ?? 0 });
  const end = toMinutesOfDay({ day: 1, hour: openHours.endHour, minute: openHours.endMinute ?? 0 });
  const now = toMinutesOfDay(gameTime);

  if (start === end) return true;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

export function isLocationOpen(location: GameLocation, gameTime: GameTime): boolean {
  return isTimeInOpenHours(gameTime, location.openHours);
}
