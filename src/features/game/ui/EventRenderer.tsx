import React from 'react';

import type { Choice, EventNode, NarrativeEventNode } from '@/features/game/engine/types';
import { EventPanel } from '@/features/game/ui/EventPanel';
import { VisualNovelEventView } from '@/features/game/ui/VisualNovelEventView';

export type EventRendererProps = {
  event: EventNode;
  choices: Choice[];
  onSelectChoice: (choice: Choice) => void;
};

export function EventRenderer({ event, choices, onSelectChoice }: EventRendererProps) {
  if (event.presentation === 'visualNovel') {
    return <VisualNovelEventView event={event} choices={choices} onSelectChoice={onSelectChoice} />;
  }

  return <EventPanel event={event as NarrativeEventNode} choices={choices} onSelectChoice={onSelectChoice} />;
}
