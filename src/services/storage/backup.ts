import type { AIState } from '@/stores/aiStore';
import { useAIStore } from '@/stores/aiStore';
import type { DailyTimelineRecord } from '@/stores/dailyTimelineStore';
import { useDailyTimelineStore } from '@/stores/dailyTimelineStore';
import type { GameState, RewardLog } from '@/stores/gameStore';
import { useGameStore } from '@/stores/gameStore';
import type { Habit, HabitLog } from '@/stores/habitStore';
import { useHabitStore } from '@/stores/habitStore';
import type { LabFragment } from '@/stores/fragmentStore';
import { useFragmentStore } from '@/stores/fragmentStore';
import type { MessengerMessage, MessengerState } from '@/stores/messengerStore';
import { useMessengerStore } from '@/stores/messengerStore';
import type { Todo } from '@/stores/todoStore';
import { useTodoStore } from '@/stores/todoStore';

export type BackupSnapshot = {
  version: 1;
  app: 'LifeOS';
  exportedAt: string;
  data: {
    todos: {
      items: Todo[];
      deletedItems: Todo[];
    };
    dailyTimeline: {
      records: DailyTimelineRecord[];
    };
    habits: {
      habits: Record<string, Habit>;
      logs: HabitLog[];
    };
    game: {
      player: GameState['player'];
      eventId: GameState['eventId'];
      saveSlots: GameState['saveSlots'];
    };
    fragments: {
      fragments: LabFragment[];
    };
    messenger: {
      queue: MessengerMessage[];
      mutedDateISO: MessengerState['mutedDateISO'];
      dailyCountByDateISO: MessengerState['dailyCountByDateISO'];
      triggeredKeysByDateISO: MessengerState['triggeredKeysByDateISO'];
    };
    ai: {
      activeCharacterId: AIState['activeCharacterId'];
    };
    rewards: {
      logs: RewardLog[];
    };
  };
};

export type BackupSummary = {
  todosTotal: number;
  todosDone: number;
  todosDeletedTotal: number;
  dailyTimelineRecordsTotal: number;
  dailyTimelineActiveRecordsTotal: number;
  dailyTimelineDeletedRecordsTotal: number;
  habitsTotal: number;
  habitsArchived: number;
  gameAttrs: Record<string, number>;
  gameLocation?: string;
  gameEventId: string;
  inspirationsTotal: number;
  moodsTotal: number;
  rewardLogsTotal: number;
};

export function buildBackupSnapshot(): BackupSnapshot {
  const todoState = useTodoStore.getState();
  const dailyTimelineState = useDailyTimelineStore.getState();
  const habitState = useHabitStore.getState();
  const gameState = useGameStore.getState();
  const fragmentState = useFragmentStore.getState();
  const messengerState = useMessengerStore.getState();
  const aiState = useAIStore.getState();

  return {
    version: 1,
    app: 'LifeOS',
    exportedAt: new Date().toISOString(),
    data: {
      todos: {
        items: todoState.items,
        deletedItems: todoState.deletedItems,
      },
      dailyTimeline: {
        records: dailyTimelineState.records,
      },
      habits: {
        habits: habitState.habits,
        logs: habitState.logs,
      },
      game: {
        player: gameState.player,
        eventId: gameState.eventId,
        saveSlots: gameState.saveSlots,
      },
      fragments: {
        fragments: fragmentState.fragments,
      },
      messenger: {
        queue: messengerState.queue,
        mutedDateISO: messengerState.mutedDateISO,
        dailyCountByDateISO: messengerState.dailyCountByDateISO,
        triggeredKeysByDateISO: messengerState.triggeredKeysByDateISO,
      },
      ai: {
        activeCharacterId: aiState.activeCharacterId,
      },
      rewards: {
        logs: gameState.rewardLogs,
      },
    },
  };
}

export function buildBackupSummary(snapshot: BackupSnapshot = buildBackupSnapshot()): BackupSummary {
  const todos = snapshot.data.todos.items;
  const deletedTodos = snapshot.data.todos.deletedItems;
  const dailyTimelineRecords = snapshot.data.dailyTimeline.records;
  const habits = Object.values(snapshot.data.habits.habits);
  const fragments = snapshot.data.fragments.fragments;
  const attrs = snapshot.data.game.player.attrs;

  return {
    todosTotal: todos.length,
    todosDone: todos.filter((todo) => todo.done).length,
    todosDeletedTotal: deletedTodos.length,
    dailyTimelineRecordsTotal: dailyTimelineRecords.length,
    dailyTimelineActiveRecordsTotal: dailyTimelineRecords.filter((record) => !record.deletedAt).length,
    dailyTimelineDeletedRecordsTotal: dailyTimelineRecords.filter((record) => record.deletedAt).length,
    habitsTotal: habits.length,
    habitsArchived: habits.filter((habit) => habit.archived === true).length,
    gameAttrs: {
      mana: attrs.mana ?? 0,
      hp: attrs.hp ?? 0,
      sanity: attrs.sanity ?? 0,
      stamina: attrs.stamina ?? 0,
      focus: attrs.focus ?? 0,
      charisma: attrs.charisma ?? 0,
      intelligence: attrs.intelligence ?? 0,
    },
    gameLocation: snapshot.data.game.player.location,
    gameEventId: snapshot.data.game.eventId,
    inspirationsTotal: fragments.filter((fragment) => fragment.type === 'inspiration').length,
    moodsTotal: fragments.filter((fragment) => fragment.type === 'mood').length,
    rewardLogsTotal: snapshot.data.rewards.logs.length,
  };
}

export function formatBackupJSON(snapshot: BackupSnapshot = buildBackupSnapshot()): string {
  return JSON.stringify(snapshot, null, 2);
}
