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

  const current = player.attrs[effect.key] ?? 0;
  const nextAttrs = { ...player.attrs, [effect.key]: current + effect.value };
  return { player: { ...player, attrs: nextAttrs } };
}

export type ExecuteResult = {
  player: PlayerState;
  nextEventId?: string;
  nextLocationId?: string;
};

export function executeChoice(choice: Choice, player: PlayerState): ExecuteResult {
  let nextPlayer: PlayerState = player;
  let nextEventId: string | undefined = choice.next?.eventId;
  let nextLocationId: string | undefined = choice.next?.locationId;

  for (const effect of choice.effects ?? []) {
    const result = applyEffect(effect, nextPlayer);
    nextPlayer = result.player;
    if (result.nextEventId) nextEventId = result.nextEventId;
  }

  if (nextLocationId) {
    nextPlayer = { ...nextPlayer, location: nextLocationId };
  }

  return { player: nextPlayer, nextEventId, nextLocationId };
}

