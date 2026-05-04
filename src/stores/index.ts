import { selectHabitCards, useHabitStore } from './habitStore';
import { useTodoStore } from './todoStore';

export { useHabitStore, selectHabitCards, type HabitCard, type Habit, type HabitLog, type HabitLogStatus } from './habitStore';
export { useTodoStore, selectVisibleTodos, type Todo } from './todoStore';
export { useWishlistStore, type WishItem, type WishStatus } from './wishlistStore';
export {
  useDailyTimelineStore,
  selectDailyTimelineRecordsByDate,
  type DailyTimelineRecord,
  type DailyTimelineRecordInput,
  type DailyTimelineRecordKind,
  type DailyTimelineRecordSource,
  type DailyTimelineSourceSnapshot,
} from './dailyTimelineStore';
export { useGameStore } from './gameStore';
export { useAIStore } from './aiStore';
export {
  useFragmentStore,
  type FragmentType,
  type InspirationFragment,
  type LabFragment,
  type MoodFragment,
  type MoodIntensity,
  type MoodKind,
} from './fragmentStore';

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
