import { selectHabitCards, useHabitStore } from './habitStore';
import { useTodoStore } from './todoStore';

export { useHabitStore, selectHabitCards, type HabitCard, type Habit, type HabitLog, type HabitLogStatus } from './habitStore';
export { useTodoStore, type Todo } from './todoStore';
export { useGameStore } from './gameStore';
export { useAIStore } from './aiStore';

export type TodaySummary = {
  habitsDoneCount: number;
  todosDoneCount: number;
  streaks?: Record<string, number>;
};

export function getTodaySummary(): TodaySummary {
  const habitState = useHabitStore.getState();
  const cards = selectHabitCards(habitState);
  const habitsDoneCount = cards.filter((h) => h.doneToday).length;
  const streaks: Record<string, number> = {};
  for (const card of cards) {
    if (card.streakDays > 0) streaks[card.id] = card.streakDays;
  }

  const todoState = useTodoStore.getState();
  const todosDoneCount = todoState.items.filter((t) => t.done).length;

  return {
    habitsDoneCount,
    todosDoneCount,
    streaks: Object.keys(streaks).length > 0 ? streaks : undefined,
  };
}
