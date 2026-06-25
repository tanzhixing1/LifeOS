import type { AIState } from '@/stores/aiStore';
import { useAIStore } from '@/stores/aiStore';
import type { DailyTimelineRecord } from '@/stores/dailyTimelineStore';
import { useDailyTimelineStore } from '@/stores/dailyTimelineStore';
import type { GameState, RewardLog } from '@/stores/gameStore';
import { useGameStore } from '@/stores/gameStore';
import type { Habit, HabitLog } from '@/stores/habitStore';
import { useHabitStore } from '@/stores/habitStore';
import type { InventoryItemStack } from '@/stores/inventoryStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import type { FragmentBucketState, FragmentLastDrawnState, LabFragment } from '@/stores/fragmentStore';
import { useFragmentStore } from '@/stores/fragmentStore';
import type { MessengerMessage, MessengerState } from '@/stores/messengerStore';
import { useMessengerStore } from '@/stores/messengerStore';
import type { GiftLog, NpcRelationship } from '@/stores/relationshipStore';
import { useRelationshipStore } from '@/stores/relationshipStore';
import type { Todo } from '@/stores/todoStore';
import { useTodoStore } from '@/stores/todoStore';
import type { CurrencyType } from '@/stores/walletStore';
import { useWalletStore } from '@/stores/walletStore';
import type { WishItem } from '@/stores/wishlistStore';
import { useWishlistStore } from '@/stores/wishlistStore';

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
    wishlist: {
      items: WishItem[];
    };
    game: {
      player: GameState['player'];
      eventId: GameState['eventId'];
      saveSlots: GameState['saveSlots'];
    };
    wallet: {
      currencies: Record<CurrencyType, number>;
    };
    inventory: {
      items: Record<string, InventoryItemStack>;
    };
    relationships: {
      relationships: Record<string, NpcRelationship>;
      giftLogs: GiftLog[];
    };
    fragments: {
      fragments: LabFragment[];
      favoriteIds: string[];
      recentDrawIds: FragmentBucketState;
      lastDrawnId: FragmentLastDrawnState;
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
  wishlistTotal: number;
  wishlistBought: number;
  gameAttrs: Record<string, number>;
  gameLocation?: string;
  gameEventId: string;
  walletCurrencies: Record<CurrencyType, number>;
  inventoryItemKinds: number;
  inventoryTotalQuantity: number;
  relationshipsTotal: number;
  giftLogsTotal: number;
  inspirationsTotal: number;
  moodsTotal: number;
  fragmentFavorites: number;
  fragmentRecentDraws: number;
  rewardLogsTotal: number;
};

export function buildBackupSnapshot(): BackupSnapshot {
  const todoState = useTodoStore.getState();
  const dailyTimelineState = useDailyTimelineStore.getState();
  const habitState = useHabitStore.getState();
  const wishlistState = useWishlistStore.getState();
  const gameState = useGameStore.getState();
  const walletState = useWalletStore.getState();
  const inventoryState = useInventoryStore.getState();
  const relationshipState = useRelationshipStore.getState();
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
      wishlist: {
        items: wishlistState.items,
      },
      game: {
        player: gameState.player,
        eventId: gameState.eventId,
        saveSlots: gameState.saveSlots,
      },
      wallet: {
        currencies: walletState.currencies,
      },
      inventory: {
        items: inventoryState.items,
      },
      relationships: {
        relationships: relationshipState.relationships,
        giftLogs: relationshipState.giftLogs,
      },
      fragments: {
        fragments: fragmentState.fragments,
        favoriteIds: fragmentState.favoriteIds,
        recentDrawIds: fragmentState.recentDrawIds,
        lastDrawnId: fragmentState.lastDrawnId,
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
  const wishlistItems = snapshot.data.wishlist?.items ?? [];
  const fragments = snapshot.data.fragments.fragments;
  const fragmentFavoriteIds = Array.isArray(snapshot.data.fragments.favoriteIds) ? snapshot.data.fragments.favoriteIds : [];
  const fragmentRecentDrawIds = snapshot.data.fragments.recentDrawIds ?? { inspiration: [], mood: [] };
  const attrs = snapshot.data.game.player.attrs;
  const inventoryItems = Object.values(snapshot.data.inventory.items);
  const relationships = Object.values(snapshot.data.relationships?.relationships ?? {});
  const giftLogs = snapshot.data.relationships?.giftLogs ?? [];

  return {
    todosTotal: todos.length,
    todosDone: todos.filter((todo) => todo.done).length,
    todosDeletedTotal: deletedTodos.length,
    dailyTimelineRecordsTotal: dailyTimelineRecords.length,
    dailyTimelineActiveRecordsTotal: dailyTimelineRecords.filter((record) => !record.deletedAt).length,
    dailyTimelineDeletedRecordsTotal: dailyTimelineRecords.filter((record) => record.deletedAt).length,
    habitsTotal: habits.length,
    habitsArchived: habits.filter((habit) => habit.archived === true).length,
    wishlistTotal: wishlistItems.length,
    wishlistBought: wishlistItems.filter((item) => item.status === 'bought').length,
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
    walletCurrencies: snapshot.data.wallet.currencies,
    inventoryItemKinds: inventoryItems.length,
    inventoryTotalQuantity: inventoryItems.reduce((total, item) => total + item.quantity, 0),
    relationshipsTotal: relationships.length,
    giftLogsTotal: giftLogs.length,
    inspirationsTotal: fragments.filter((fragment) => fragment.type === 'inspiration').length,
    moodsTotal: fragments.filter((fragment) => fragment.type === 'mood').length,
    fragmentFavorites: fragmentFavoriteIds.length,
    fragmentRecentDraws: (fragmentRecentDrawIds.inspiration?.length ?? 0) + (fragmentRecentDrawIds.mood?.length ?? 0),
    rewardLogsTotal: snapshot.data.rewards.logs.length,
  };
}

export function formatBackupJSON(snapshot: BackupSnapshot = buildBackupSnapshot()): string {
  return JSON.stringify(snapshot, null, 2);
}

export type BackupParseResult =
  | {
      ok: true;
      snapshot: BackupSnapshot;
      summary: BackupSummary;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasRequiredBackupSections(data: Record<string, unknown>): boolean {
  const requiredSections = [
    'todos',
    'dailyTimeline',
    'habits',
    'game',
    'wallet',
    'inventory',
    'fragments',
    'messenger',
    'ai',
    'rewards',
  ];
  return requiredSections.every((key) => isRecord(data[key]));
}

export function parseBackupJSON(input: string): BackupParseResult {
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!isRecord(parsed)) return { ok: false, error: '备份内容不是有效对象。' };
    if (parsed.app !== 'LifeOS') return { ok: false, error: '这不是 LifeOS 备份文件。' };
    if (parsed.version !== 1) return { ok: false, error: '暂不支持这个备份版本。' };
    if (!isRecord(parsed.data)) return { ok: false, error: '备份缺少 data 字段。' };
    if (!hasRequiredBackupSections(parsed.data)) return { ok: false, error: '备份内容不完整，已停止恢复。' };

    const snapshot = parsed as BackupSnapshot;
    return {
      ok: true,
      snapshot,
      summary: buildBackupSummary(snapshot),
    };
  } catch {
    return { ok: false, error: 'JSON 格式不正确，请检查是否完整粘贴。' };
  }
}

export function restoreBackupSnapshot(snapshot: BackupSnapshot): BackupSummary {
  const data = snapshot.data;

  useTodoStore.setState({
    items: Array.isArray(data.todos.items) ? data.todos.items : [],
    deletedItems: Array.isArray(data.todos.deletedItems) ? data.todos.deletedItems : [],
  });
  useDailyTimelineStore.setState({
    records: Array.isArray(data.dailyTimeline.records) ? data.dailyTimeline.records : [],
  });
  useHabitStore.setState({
    habits: isRecord(data.habits.habits) ? data.habits.habits : {},
    logs: Array.isArray(data.habits.logs) ? data.habits.logs : [],
  });
  useWishlistStore.setState({
    items: Array.isArray(data.wishlist?.items) ? data.wishlist.items : [],
  });
  useGameStore.setState({
    player: data.game.player,
    eventId: data.game.eventId,
    saveSlots: data.game.saveSlots,
    rewardLogs: Array.isArray(data.rewards.logs) ? data.rewards.logs : [],
  });
  useWalletStore.setState({
    currencies: data.wallet.currencies,
  });
  useInventoryStore.setState({
    items: data.inventory.items,
  });
  useRelationshipStore.setState({
    relationships: data.relationships?.relationships ?? {},
    giftLogs: Array.isArray(data.relationships?.giftLogs) ? data.relationships.giftLogs : [],
  });
  useFragmentStore.setState({
    fragments: Array.isArray(data.fragments.fragments) ? data.fragments.fragments : [],
    favoriteIds: Array.isArray(data.fragments.favoriteIds) ? data.fragments.favoriteIds : [],
    recentDrawIds: data.fragments.recentDrawIds,
    lastDrawnId: data.fragments.lastDrawnId,
  });
  useMessengerStore.setState({
    queue: Array.isArray(data.messenger.queue) ? data.messenger.queue : [],
    mutedDateISO: data.messenger.mutedDateISO,
    dailyCountByDateISO: data.messenger.dailyCountByDateISO,
    triggeredKeysByDateISO: data.messenger.triggeredKeysByDateISO,
  });
  useAIStore.setState({
    activeCharacterId: data.ai.activeCharacterId,
  });

  return buildBackupSummary(snapshot);
}
