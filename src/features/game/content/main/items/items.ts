export type ItemType = 'consumable' | 'material' | 'gift' | 'key' | 'special';

export type ItemRarity = 'common' | 'rare' | 'special';

export type GameItem = {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  stackable: boolean;
  usable: boolean;
  giftable: boolean;
  rarity?: ItemRarity;
  icon: string;
  tags?: string[];
};

export const gameItems: Record<string, GameItem> = {
  warm_bread: {
    id: 'warm_bread',
    name: '温热面包',
    description: '刚出炉不久，纸袋边缘还带着一点麦香和热气。',
    type: 'consumable',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🥖',
    tags: ['早餐', '补给'],
  },
  berry_milk: {
    id: 'berry_milk',
    name: '雾莓牛奶',
    description: '淡紫色的瓶装牛奶，喝前需要轻轻摇三下。',
    type: 'consumable',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🥛',
    tags: ['饮品', '雾莓'],
  },
  simple_candle: {
    id: 'simple_candle',
    name: '小蜡烛',
    description: '适合夜读、写信，或者假装自己很有仪式感。',
    type: 'key',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🕯️',
    tags: ['照明', '小屋'],
  },
  note_paper_pack: {
    id: 'note_paper_pack',
    name: '便签纸包',
    description: '一叠手感很好的小纸片，能承受轻微魔力涂改。',
    type: 'key',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '📝',
    tags: ['记录', '学习'],
  },
  storage_box: {
    id: 'storage_box',
    name: '旧木收纳盒',
    description: '盖子有点松，但很适合收纳那些暂时不知道用途的小东西。',
    type: 'special',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🧰',
    tags: ['收纳', '小屋'],
  },
  sweet_water: {
    id: 'sweet_water',
    name: '小甜水',
    description: '市集同款，颜色可疑，但摊主保证“至少今天没问题”。',
    type: 'consumable',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🧋',
    tags: ['饮品', '市集'],
  },
  cleaning_cloth: {
    id: 'cleaning_cloth',
    name: '柔软抹布',
    description: '适合擦桌面、杯子，以及某些不肯承认自己落灰的魔法道具。',
    type: 'key',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🧽',
    tags: ['清洁', '日用'],
  },
  pocket_snack: {
    id: 'pocket_snack',
    name: '口袋零食',
    description: '小小一包，适合出门前塞进口袋，防止意志力突然塌方。',
    type: 'consumable',
    stackable: true,
    usable: false,
    giftable: false,
    rarity: 'common',
    icon: '🍪',
    tags: ['零食', '便携'],
  },
};
