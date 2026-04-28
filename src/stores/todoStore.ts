import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TodoCategory } from '@/core/constants/todo-category';
import { getLocalISODate } from '@/core/utils/date';
import { applyRealityReward } from '@/services/rewards/realityReward';
import { zustandStorage } from '@/services/storage/zustandStorage';
import { useDailyTimelineStore } from '@/stores/dailyTimelineStore';
import { useMessengerStore } from '@/stores/messengerStore';

export type Todo = {
  id: string;
  title: string;
  dueAt: number | null;
  category: TodoCategory;
  iconId: string;
  createdAt: number;
  done: boolean;
  completedAt?: number | null;
  deletedAt?: number | null;

  due?: string;
  tags?: string[];
};

export type TodoState = {
  items: Todo[];
  deletedItems: Todo[];
};

export type TodoActions = {
  toggle(id: string): void;
  addTodo(input?: Partial<Omit<Todo, 'id' | 'createdAt'>>): string;
  updateTodo(id: string, patch: Partial<Omit<Todo, 'id'>>): void;
  removeTodo(id: string): void;
};

export type TodoStore = TodoState & TodoActions;

export function selectVisibleTodos(state: TodoState): Todo[] {
  return state.items.filter((item) => !item.deletedAt);
}

function defaultState(): TodoState {
  const now = Date.now();
  return {
    items: [
      { id: 't1', title: '写 10 分钟日记', dueAt: null, category: '自我', iconId: 'default', createdAt: now - 3, done: false, due: '今天' },
      { id: 't2', title: '专注工作', dueAt: null, category: '工作', iconId: 'work', createdAt: now - 2, done: true, completedAt: now - 2, due: '上午' },
      { id: 't3', title: '散步', dueAt: null, category: '自我', iconId: 'run', createdAt: now - 1, done: false, due: '傍晚' },
    ],
    deletedItems: [],
  };
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),
      toggle(id) {
        const prev = get().items.find((x) => x.id === id && !x.deletedAt);
        const nextDone = prev ? !prev.done : false;
        const now = Date.now();
        const completedAt = nextDone ? now : null;
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, done: nextDone, completedAt } : x)),
        }));

        if (prev) {
          if (nextDone) {
            const dateISO = getLocalISODate(new Date(now));
            useDailyTimelineStore.getState().upsertRecord({
              dateISO,
              occurredAt: now,
              source: 'todo',
              sourceId: prev.id,
              title: prev.title,
              category: prev.category,
              iconId: prev.iconId,
              kind: 'completed',
              dedupeKey: `todo:${prev.id}:completed:${dateISO}`,
              sourceSnapshot: {
                title: prev.title,
                category: prev.category,
                iconId: prev.iconId,
                dueAt: prev.dueAt,
              },
            });
          } else {
            const dateISO = getLocalISODate(new Date(prev.completedAt ?? now));
            useDailyTimelineStore.getState().softDeleteByDedupeKey(`todo:${prev.id}:completed:${dateISO}`);
          }

          applyRealityReward({ source: 'todo', id: prev.id, title: prev.title, category: prev.category, completed: nextDone });
        }
      },
      addTodo(input) {
        const id = `t_${Date.now()}`;
        const done = input?.done ?? false;
        const completedAt = done ? Date.now() : null;
        const next: Todo = {
          id,
          title: input?.title ?? '新待办',
          dueAt: input?.dueAt ?? null,
          category: (input?.category as TodoCategory) ?? '自我',
          iconId: input?.iconId ?? 'default',
          createdAt: Date.now(),
          done,
          completedAt,
          deletedAt: null,

          due: input?.due,
          tags: input?.tags,
        };
        set((s) => ({ items: [next, ...s.items] }));

        useMessengerStore.getState().trigger({
          type: 'todo_created',
          key: `todo_created.${id}`,
          title: '新事务已登记',
          body: `我帮你记下来了：${next.title}。别装死。`,
        });

        return id;
      },
      updateTodo(id, patch) {
        set((s) => ({ items: s.items.map((x) => (x.id === id && !x.deletedAt ? { ...x, ...patch } : x)) }));
      },
      removeTodo(id) {
        const now = Date.now();
        set((s) => {
          const target = s.items.find((x) => x.id === id);
          if (!target) return s;
          const deleted = { ...target, deletedAt: now };
          return {
            items: s.items.filter((x) => x.id !== id),
            deletedItems: [deleted, ...s.deletedItems.filter((x) => x.id !== id)],
          };
        });
      },
    }),
    {
      name: 'lifeos.todoStore',
      version: 3,
      storage: zustandStorage,
      partialize: (s) => ({ items: s.items, deletedItems: s.deletedItems }),
      migrate: (persistedState: any) => {
        const items: any[] = Array.isArray(persistedState?.items) ? persistedState.items : [];
        const deletedItems: any[] = Array.isArray(persistedState?.deletedItems) ? persistedState.deletedItems : [];
        const migrated: Todo[] = items.map((x) => {
          const dueAt = typeof x.dueAt === 'number' ? x.dueAt : null;
          const category = (x.category as TodoCategory) ?? (Array.isArray(x.tags) && x.tags[0] ? x.tags[0] : '自我');
          const iconId = typeof x.iconId === 'string' ? x.iconId : 'default';
          const createdAt = typeof x.createdAt === 'number' ? x.createdAt : Date.now();
          return {
            id: String(x.id ?? `t_${Date.now()}`),
            title: String(x.title ?? '新待办'),
            done: Boolean(x.done ?? false),
            dueAt,
            category: category as TodoCategory,
            iconId,
            createdAt,
            completedAt: typeof x.completedAt === 'number' ? x.completedAt : null,
            deletedAt: typeof x.deletedAt === 'number' ? x.deletedAt : null,
            due: typeof x.due === 'string' ? x.due : undefined,
            tags: Array.isArray(x.tags) ? x.tags : undefined,
          };
        });
        const migratedDeleted: Todo[] = deletedItems.map((x) => ({
          id: String(x.id ?? `t_${Date.now()}`),
          title: String(x.title ?? '新待办'),
          done: Boolean(x.done ?? false),
          dueAt: typeof x.dueAt === 'number' ? x.dueAt : null,
          category: ((x.category as TodoCategory) ?? '自我') as TodoCategory,
          iconId: typeof x.iconId === 'string' ? x.iconId : 'default',
          createdAt: typeof x.createdAt === 'number' ? x.createdAt : Date.now(),
          completedAt: typeof x.completedAt === 'number' ? x.completedAt : null,
          deletedAt: typeof x.deletedAt === 'number' ? x.deletedAt : Date.now(),
          due: typeof x.due === 'string' ? x.due : undefined,
          tags: Array.isArray(x.tags) ? x.tags : undefined,
        }));
        return {
          items: migrated.filter((x) => !x.deletedAt),
          deletedItems: [...migrated.filter((x) => x.deletedAt), ...migratedDeleted],
        };
      },
    }
  )
);
