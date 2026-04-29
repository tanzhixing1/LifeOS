import type { GameLocation } from '@/features/game/engine/types';

export const demoLocations: GameLocation[] = [
  {
    id: 'home',
    name: '小屋',
    subtitle: '魔女今天醒来的地方',
    description: '有旧书、药草和没有整理完的笔记。',
    icon: '🏠',
    backgroundId: 'room_morning',
    entryEventId: 'demo_start',
    tags: ['home', 'rest'],
  },
  {
    id: 'market',
    name: '市集',
    subtitle: '可以遇见人和物的地方',
    description: '摊位之间传来香料、纸张和雨后石板路的气味。',
    icon: '🧺',
    backgroundId: 'market_day',
    entryEventId: 'demo_market',
    tags: ['social', 'shopping'],
  },
  {
    id: 'forest',
    name: '森林',
    subtitle: '适合采集与偶遇',
    description: '树影深处有药草，也可能有迷路的猫。',
    icon: '🌲',
    backgroundId: 'forest_evening',
    entryEventId: 'demo_hidden',
    tags: ['gathering', 'exploration'],
  },
  {
    id: 'academy',
    name: '学院',
    subtitle: '魔法、研究和人际关系',
    description: '长廊里回响着脚步声，公告栏上贴着新的课程表。',
    icon: '📚',
    backgroundId: 'academy_gate',
    entryEventId: 'demo_vn_morning',
    tags: ['study', 'story'],
  },
];
