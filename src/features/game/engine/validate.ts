import type { Choice, Condition, ContentPack, Effect, EventNode, MapNode } from './types';

function push(errors: string[], message: string) {
  errors.push(message);
}

function validateCondition(errors: string[], eventId: string, choiceIndex: number, condition: Condition, conditionIndex: number) {
  if (condition.type === 'flag') {
    if (!condition.key) push(errors, `[${eventId}] options[${choiceIndex}].conditions[${conditionIndex}] missing key`);
    return;
  }

  if (condition.type === 'attr') {
    if (!condition.key) push(errors, `[${eventId}] options[${choiceIndex}].conditions[${conditionIndex}] missing key`);
    return;
  }

  if (!condition.key) push(errors, `[${eventId}] options[${choiceIndex}].conditions[${conditionIndex}] missing key`);
}

function validateEffect(errors: string[], eventId: string, choiceIndex: number, effect: Effect, effectIndex: number) {
  if (effect.type === 'setFlag') {
    if (!effect.key) push(errors, `[${eventId}] options[${choiceIndex}].effects[${effectIndex}] missing key`);
    return;
  }
  if (effect.type === 'addAttr') {
    if (!effect.key) push(errors, `[${eventId}] options[${choiceIndex}].effects[${effectIndex}] missing key`);
    return;
  }
  if (!effect.eventId) push(errors, `[${eventId}] options[${choiceIndex}].effects[${effectIndex}] missing eventId`);
}

function validateChoice(errors: string[], eventId: string, choice: Choice, choiceIndex: number) {
  if (!choice.text) push(errors, `[${eventId}] options[${choiceIndex}] missing text`);

  for (const [i, c] of (choice.conditions ?? []).entries()) {
    validateCondition(errors, eventId, choiceIndex, c, i);
  }

  for (const [i, e] of (choice.effects ?? []).entries()) {
    validateEffect(errors, eventId, choiceIndex, e, i);
  }
}

function validateEvent(errors: string[], event: EventNode) {
  if (!event.id) push(errors, `[event] missing id`);
  if (!event.title) push(errors, `[${event.id}] missing title`);
  if (!Array.isArray(event.paragraphs) || event.paragraphs.length === 0) push(errors, `[${event.id}] paragraphs must be non-empty`);
  if (!Array.isArray(event.options)) push(errors, `[${event.id}] options must be array`);

  for (const [i, opt] of (event.options ?? []).entries()) {
    validateChoice(errors, event.id, opt, i);
  }
}

function validateMap(errors: string[], map: MapNode[] | undefined) {
  if (!map) return;
  const ids = new Set<string>();
  for (const node of map) {
    if (!node.id) push(errors, `[map] node missing id`);
    if (ids.has(node.id)) push(errors, `[map] duplicate id: ${node.id}`);
    ids.add(node.id);
  }

  for (const node of map) {
    for (const neighborId of node.neighbors ?? []) {
      if (!ids.has(neighborId)) push(errors, `[map] ${node.id} references missing neighbor: ${neighborId}`);
    }
  }
}

export function validateContentPack(pack: ContentPack): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (!pack.startEventId) push(errors, `[pack] missing startEventId`);
  if (!Array.isArray(pack.events) || pack.events.length === 0) push(errors, `[pack] events must be non-empty array`);

  for (const event of pack.events ?? []) {
    validateEvent(errors, event);
    if (event.id) {
      if (ids.has(event.id)) push(errors, `[pack] duplicate event id: ${event.id}`);
      ids.add(event.id);
    }
  }

  if (pack.startEventId && !ids.has(pack.startEventId)) push(errors, `[pack] startEventId not found: ${pack.startEventId}`);

  for (const event of pack.events ?? []) {
    for (const opt of event.options ?? []) {
      const nextId = opt.next?.eventId;
      if (nextId && !ids.has(nextId)) push(errors, `[${event.id}] next.eventId not found: ${nextId}`);
      for (const effect of opt.effects ?? []) {
        if (effect.type === 'gotoEvent' && !ids.has(effect.eventId)) push(errors, `[${event.id}] gotoEvent not found: ${effect.eventId}`);
      }
    }
  }

  validateMap(errors, pack.map);

  return { ok: errors.length === 0, errors };
}

