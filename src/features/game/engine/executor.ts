import { addMinutesToGameTime, normalizeGameTime } from './time';
import type { Choice, Condition, ConditionOp, Effect, EventNode, PlayerState } from './types';

function compare(op: ConditionOp, left: number, right: number): boolean {
  if (op === 'eq') return left === right;
  if (op === 'lte') return left <= right;
  return left >= right;
}

export function evaluateCondition(condition: Condition, player: PlayerState): boolean {
  if (condition.type === 'once') {
    return player.flags[condition.key] !== true;
  }

  if (condition.type === 'flag') {
    const current = player.flags[condition.key] ?? false;
    const expected = condition.value ?? true;
    return compare(condition.op ?? 'eq', current ? 1 : 0, expected ? 1 : 0);
  }

  const current = player.attrs[condition.key] ?? 0;
  const expected = condition.value ?? 0;
  return compare(condition.op ?? 'gte', current, expected);
}

export function getAvailableChoices(event: EventNode, player: PlayerState): Choice[] {
  return event.options.filter((choice) => {
    if (!choice.conditions || choice.conditions.length === 0) return true;
    return choice.conditions.every((c) => evaluateCondition(c, player));
  });
}

export function applyEffect(effect: Effect, player: PlayerState): { player: PlayerState; nextEventId?: string } {
  if (effect.type === 'gotoEvent') {
    return { player, nextEventId: effect.eventId };
  }

  if (effect.type === 'setFlag') {
    return { player: { ...player, flags: { ...player.flags, [effect.key]: effect.value } } };
  }

  if (effect.type === 'addAttr') {
    const current = player.attrs[effect.key] ?? 0;
    const nextAttrs = { ...player.attrs, [effect.key]: current + effect.value };
    return { player: { ...player, attrs: nextAttrs } };
  }

  if (effect.type === 'advanceTime') {
    return {
      player: {
        ...player,
        gameTime: addMinutesToGameTime(player.gameTime, effect.minutes),
      },
    };
  }

  if (effect.type === 'vitalsDelta') {
    const nextVitals = { ...player.vitals };
    for (const [key, value] of Object.entries(effect.deltas)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      if (key === 'bodyStatus') {
        nextVitals.bodyStatus = clamp(nextVitals.bodyStatus + value, 0, 100);
      } else if (key === 'fatigue') {
        nextVitals.fatigue = Math.max(0, nextVitals.fatigue + value);
      } else if (key === 'intoxication') {
        nextVitals.intoxication = Math.max(0, nextVitals.intoxication + value);
      }
    }
    return { player: { ...player, vitals: nextVitals } };
  }

  if (effect.type === 'walletDelta') {
    return {
      player: {
        ...player,
        wallet: {
          money: Math.max(0, (player.wallet.money ?? 0) + effect.money),
        },
      },
    };
  }

  if (effect.type === 'sleepToNextDay') {
    const safeTime = normalizeGameTime(player.gameTime);
    return {
      player: {
        ...player,
        location: 'home',
        gameTime: {
          day: safeTime.day + 1,
          hour: 7,
          minute: 0,
        },
        vitals: {
          ...player.vitals,
          bodyStatus: 100,
          fatigue: 0,
          intoxication: 0,
        },
      },
    };
  }

  return { player };
}

export type ExecuteResult = {
  player: PlayerState;
  nextEventId?: string;
  nextLocationId?: string;
  nextRoute?: 'map';
};

export function executeChoice(choice: Choice, player: PlayerState): ExecuteResult {
  let nextPlayer: PlayerState = player;
  let nextEventId: string | undefined = choice.next?.eventId;
  let nextLocationId: string | undefined = choice.next?.locationId;
  const nextRoute = choice.route;

  for (const effect of choice.effects ?? []) {
    const result = applyEffect(effect, nextPlayer);
    nextPlayer = result.player;
    if (result.nextEventId) nextEventId = result.nextEventId;
  }

  if (nextLocationId) {
    nextPlayer = { ...nextPlayer, location: nextLocationId };
  }

  return { player: nextPlayer, nextEventId, nextLocationId, nextRoute };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
