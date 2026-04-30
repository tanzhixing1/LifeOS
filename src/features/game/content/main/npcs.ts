import type { GameNpc, NpcLocationEncounter, NpcScheduleBlock } from '@/features/game/engine/types';

export const mainNpcs: GameNpc[] = [
  {
    id: 'lilith',
    name: '莉莉丝',
    role: '导师',
    description: '作为一名不知岁月的不老魔女，她总是笑而不语，在人类社会也玩得很是尽兴。',
    personalityTags: ['不老魔女', '导师', '跳脱', '懂规则但不完全守规矩'],
  },
];

export const mainNpcSchedules: NpcScheduleBlock[] = [
  {
    npcId: 'lilith',
    locationId: 'church',
    startHour: 9,
    endHour: 11,
    activity: '翻看祷文',
  },
  {
    npcId: 'lilith',
    locationId: 'market',
    startHour: 11,
    endHour: 14,
    activity: '逛市集',
  },
  {
    npcId: 'lilith',
    locationId: 'grocery',
    startHour: 14,
    endHour: 18,
    activity: '挑糖果',
  },
  {
    npcId: 'lilith',
    locationId: 'bar',
    startHour: 20,
    endHour: 3,
    activity: '在吧台小坐',
  },
];

export const mainNpcLocationEncounters: NpcLocationEncounter[] = [
  {
    npcId: 'lilith',
    locationId: 'church',
    description: '莉莉丝坐在最后一排，手里拿着一本倒着翻的祷文。',
    talkEventId: 'lilith_talk_church',
  },
  {
    npcId: 'lilith',
    locationId: 'market',
    description: '莉莉丝正站在摊位前，认真比较两瓶颜色可疑的小甜水。',
    talkEventId: 'lilith_talk_market',
  },
  {
    npcId: 'lilith',
    locationId: 'grocery',
    description: '莉莉丝把一盒包装过度的糖果放回货架，又若无其事地拿了起来。',
    talkEventId: 'lilith_talk_grocery',
  },
  {
    npcId: 'lilith',
    locationId: 'bar',
    description: '莉莉丝坐在吧台边，杯子里浮着一片发光的薄荷叶。',
    talkEventId: 'lilith_talk_bar',
  },
];
