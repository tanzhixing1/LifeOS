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

export type GameLocation = {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  icon?: string;
  backgroundId?: string;
  entryEventId: string;
  tags?: string[];
  unlockRequirements?: Condition[];
  npcIds?: string[];
  shopId?: string;
  randomEventIds?: string[];
};

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

export type EventPresentation = 'text' | 'visualNovel';

export type BaseEventNode = {
  id: string;
  title: string;
  options: Choice[];
  presentation?: EventPresentation;
};

export type NarrativeEventNode = BaseEventNode & {
  presentation?: 'text';
  paragraphs: string[];
};

export type DialogueLine = {
  id?: string;
  speakerId?: string;
  speakerName?: string;
  text: string;
  expression?: string;
  spriteId?: string;
  backgroundId?: string;
};

export type CharacterSprite = {
  id: string;
  name: string;
  defaultSpriteId?: string;
  defaultExpression?: string;
  position?: 'left' | 'center' | 'right';
  scale?: number;
};

export type VisualNovelEventNode = BaseEventNode & {
  presentation: 'visualNovel';
  backgroundId?: string;
  characters?: CharacterSprite[];
  dialogue: DialogueLine[];
  paragraphs?: string[];
};

export type EventNode = NarrativeEventNode | VisualNovelEventNode;

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
