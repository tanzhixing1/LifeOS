export type MapNode = {
  id: string;
  name: string;
  neighbors: string[];
};

export type ConditionOp = 'gte' | 'lte' | 'eq';

export type Condition =
  | { type: 'flag'; key: string; op?: ConditionOp; value?: boolean }
  | { type: 'attr'; key: string; op?: ConditionOp; value?: number }
  | { type: 'once'; key: string };

export type Effect =
  | { type: 'setFlag'; key: string; value: boolean }
  | { type: 'addAttr'; key: string; value: number }
  | { type: 'gotoEvent'; eventId: string };

export type Choice = {
  text: string;
  conditions?: Condition[];
  effects?: Effect[];
  next?: { eventId?: string; locationId?: string };
};

export type EventNode = {
  id: string;
  title: string;
  paragraphs: string[];
  options: Choice[];
};

export type PlayerState = {
  attrs: Record<string, number>;
  flags: Record<string, boolean>;
  location?: string;
};

export type ContentPack = {
  startEventId: string;
  events: EventNode[];
  map?: MapNode[];
};

