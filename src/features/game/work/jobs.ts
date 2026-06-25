export type WorkJob = {
  id: string;
  title: string;
  locationName: string;
  icon: string;
  description: string;
  durationMinutes: number;
  goldReward: number;
  fatigueDelta: number;
  bodyStatusDelta?: number;
  attrDeltas?: Record<string, number>;
  availableFromHour?: number;
  availableToHour?: number;
};

export const workJobs: WorkJob[] = [
  {
    id: 'market_stall_helper',
    title: '帮市集摊主看摊',
    locationName: '市集',
    icon: '🧺',
    description: '帮忙整理小甜水瓶、找零钱，以及假装没听见摊主夸张的叫卖词。',
    durationMinutes: 60,
    goldReward: 24,
    fatigueDelta: 12,
    attrDeltas: { friendship: 1, focus: 1 },
    availableFromHour: 8,
    availableToHour: 18,
  },
  {
    id: 'grocery_shelf_sorting',
    title: '整理杂货铺货架',
    locationName: '杂货铺',
    icon: '🛒',
    description: '把糖果、便签和用途暧昧的小瓶子摆回它们应该待着的位置。',
    durationMinutes: 45,
    goldReward: 20,
    fatigueDelta: 9,
    attrDeltas: { focus: 1 },
    availableFromHour: 9,
    availableToHour: 20,
  },
  {
    id: 'church_candle_errand',
    title: '教堂烛台杂务',
    locationName: '圣殿 / 教堂',
    icon: '🕯️',
    description: '擦拭烛台、补几支小蜡烛，让安静的地方继续保持安静。',
    durationMinutes: 50,
    goldReward: 18,
    fatigueDelta: 8,
    attrDeltas: { sanity: 1 },
    availableFromHour: 7,
    availableToHour: 17,
  },
  {
    id: 'forest_edge_gathering',
    title: '森林边缘采集',
    locationName: '魔物森林',
    icon: '🌿',
    description: '只在森林边缘转一圈，采些安全草叶，绝不向深处逞强。',
    durationMinutes: 80,
    goldReward: 34,
    fatigueDelta: 18,
    bodyStatusDelta: -3,
    attrDeltas: { proficiency: 1 },
    availableFromHour: 6,
    availableToHour: 17,
  },
];
