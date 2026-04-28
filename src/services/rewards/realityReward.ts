import { type ToolCategory, TOOL_CATEGORIES } from '@/core/constants/todo-category';
import { useGameStore } from '@/stores/gameStore';
import { useMessengerStore } from '@/stores/messengerStore';

export type RealityRewardSource = 'habit' | 'todo';

export type RealityRewardInput = {
  source: RealityRewardSource;
  id: string;
  title: string;
  category?: ToolCategory | string;
  completed: boolean;
};

const DEFAULT_CATEGORY: ToolCategory = '自我';

const CATEGORY_ATTRS: Record<ToolCategory, string> = {
  自我: 'focus',
  成长: 'intelligence',
  工作: 'proficiency',
  健康: 'hp',
  社交: 'charisma',
  友情: 'friendship',
  家人: 'family',
  恋爱: 'charisma',
};

const CATEGORY_FEEDBACK: Record<ToolCategory, string[]> = {
  自我: ['照顾自己这件事，终于被你排上日程了。', '先把自己捡起来，也算一种正经魔法。'],
  成长: ['脑袋里终于不只是雾和糖霜了。', '知识进账一点点，别太得意。'],
  工作: ['今天倒像个正经魔女。', '工作魔法启动，虽然启动得有点慢。'],
  健康: ['终于想起来自己不是仙人掌了？', '身体没有自动维护功能，今天算你想起来了。'],
  社交: ['你居然主动跟人类接触了，可喜可贺。', '社交耐性 +1，别立刻逃跑。'],
  友情: ['友情不是自动续费的，今天算你有点良心。', '朋友关系维护成功，魔女也需要同伴。'],
  家人: ['亲缘关系这种魔法，别总拖到失效才想起来维护。', '家人线没有断，今天值得记一笔。'],
  恋爱: ['心动也算一种魔法反应，别装作没看见。', '恋爱回路轻微发光，别慌。'],
};

const KEYWORD_FEEDBACK: { pattern: RegExp; body: string }[] = [
  { pattern: /喝水|饮水|水/i, body: '终于想起来自己不是仙人掌了？' },
  { pattern: /看书|阅读|学习|论文|背单词/i, body: '脑袋里终于不只是雾和糖霜了。' },
  { pattern: /工作|专注|会议|汇报|项目/i, body: '今天倒像个正经魔女。' },
  { pattern: /朋友|友情|聚会/i, body: '友情不是自动续费的，今天算你有点良心。' },
  { pattern: /家人|妈妈|爸爸|父母|亲人/i, body: '亲缘关系这种魔法，别总拖到失效才想起来维护。' },
];

export function normalizeRewardCategory(category?: ToolCategory | string): ToolCategory {
  if (TOOL_CATEGORIES.includes(category as ToolCategory)) return category as ToolCategory;
  return DEFAULT_CATEGORY;
}

export function getRewardAttrForCategory(category?: ToolCategory | string): string {
  return CATEGORY_ATTRS[normalizeRewardCategory(category)];
}

export function applyRealityReward(input: RealityRewardInput): void {
  const category = normalizeRewardCategory(input.category);
  const attrKey = CATEGORY_ATTRS[category];
  const delta = input.completed ? 1 : -1;
  const game = useGameStore.getState();
  const beforeAttrs = { ...game.player.attrs };

  game.addAttrClamped('mana', delta);
  game.addAttrClamped(attrKey, delta);

  const afterAttrs = useGameStore.getState().player.attrs;
  const deltas: Record<string, number> = {};
  for (const key of new Set(['mana', attrKey])) {
    const actualDelta = (afterAttrs[key] ?? 0) - (beforeAttrs[key] ?? 0);
    if (actualDelta !== 0) deltas[key] = actualDelta;
  }

  useGameStore.getState().addRewardLog({
    id: `reward_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: input.source,
    sourceId: input.id,
    title: input.title,
    category,
    deltas,
    direction: input.completed ? 'gain' : 'revert',
    createdAt: Date.now(),
  });

  if (!input.completed) return;

  useMessengerStore.getState().trigger({
    type: 'reality_reward',
    key: `reality_reward.${input.source}.${input.id}.${Date.now()}`,
    title: '现实魔力到账',
    body: pickFeedback(input.title, category),
  });
}

function pickFeedback(title: string, category: ToolCategory): string {
  const keyword = KEYWORD_FEEDBACK.find((item) => item.pattern.test(title));
  if (keyword) return keyword.body;

  const pool = CATEGORY_FEEDBACK[category];
  return pool[Math.floor(Math.random() * pool.length)] ?? CATEGORY_FEEDBACK[DEFAULT_CATEGORY][0];
}
