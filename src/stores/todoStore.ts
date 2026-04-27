import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { TodoCategory } from '@/core/constants/todo-category';
import { zustandStorage } from '@/services/storage/zustandStorage';
import { useMessengerStore } from '@/stores/messengerStore';

export type Todo = {
  id: string;
  title: string;
  dueAt: number | null;
  category: TodoCategory;
  iconId: string;
  createdAt: number;
  done: boolean;

  due?: string;
  tags?: string[];
};

export type TodoState = {
  items: Todo[];
};

export type TodoActions = {
  toggle(id: string): void;
  addTodo(input?: Partial<Omit<Todo, 'id' | 'createdAt'>>): string;
  updateTodo(id: string, patch: Partial<Omit<Todo, 'id'>>): void;
  removeTodo(id: string): void;
};

export type TodoStore = TodoState & TodoActions;

function defaultState(): TodoState {
  const now = Date.now();
  return {
    items: [
      { id: 't1', title: '写 10 分钟日记', dueAt: null, category: '自我', iconId: 'default', createdAt: now - 3, done: false, due: '今天' },
      { id: 't2', title: '专注工作', dueAt: null, category: '工作', iconId: 'work', createdAt: now - 2, done: true, due: '上午' },
      { id: 't3', title: '散步', dueAt: null, category: '自我', iconId: 'run', createdAt: now - 1, done: false, due: '傍晚' },
    ],
  };
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      ...defaultState(),
      toggle(id) {
        const prev = get().items.find((x) => x.id === id);
        const nextDone = prev ? !prev.done : false;
        set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));

        if (prev && nextDone) {
          useMessengerStore.getState().trigger({
            type: 'todo_completed',
            key: `todo_completed.${id}`,
            title: '嗯？居然做完了',
            body: `我还以为你会拖到下辈子。任务「${prev.title}」已完成。`,
          });
        }
      },
      addTodo(input) {
        const id = `t_${Date.now()}`;
        const next: Todo = {
          id,
          title: input?.title ?? '新待办',
          dueAt: input?.dueAt ?? null,
          category: (input?.category as TodoCategory) ?? '自我',
          iconId: input?.iconId ?? 'default',
          createdAt: Date.now(),
          done: input?.done ?? false,

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
        set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
      },
      removeTodo(id) {
        set((s) => ({ items: s.items.filter((x) => x.id !== id) }));
      },
    }),
    {
      name: 'lifeos.todoStore',
      version: 2,
      storage: zustandStorage,
      partialize: (s) => ({ items: s.items }),
      migrate: (persistedState: any) => {
        const items: any[] = Array.isArray(persistedState?.items) ? persistedState.items : [];
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
            due: typeof x.due === 'string' ? x.due : undefined,
            tags: Array.isArray(x.tags) ? x.tags : undefined,
          };
        });
        return { items: migrated };
      },
    }
  )
);
