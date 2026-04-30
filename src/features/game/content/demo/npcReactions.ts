import type { NpcRealityReactionRule } from '@/features/game/engine/types';

export const LILITH_TALK_EVENT_IDS = [
  'lilith_talk_church',
  'lilith_talk_market',
  'lilith_talk_grocery',
  'lilith_talk_bar',
] as const;

export const LILITH_REALITY_CHAT_EVENT_ID = 'lilith_reality_chat';

export const lilithNoRecentRealityLogText = '最近没听见你在现实里闹出什么动静。也好，平静有时也是一种魔法。';

export const demoNpcRealityReactionRules: NpcRealityReactionRule[] = [
  {
    npcId: 'lilith',
    key: 'lilith_sleep',
    match: {
      titleIncludes: ['睡觉', '早睡', '早起', '睡眠', '休息', '起床'],
    },
    templates: [
      '早睡早起？不错，亲爱的，你终于开始尊重自己的身体了。',
      '睡眠是最古老的恢复魔法。只是很多人类总假装自己不需要。',
      '今天居然愿意好好休息？很好，至少你的身体不用写投诉信给我了。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'lilith_water',
    match: {
      titleIncludes: ['喝水', '饮水', '补水', '白开水', '水杯', '小甜水'],
    },
    templates: [
      '小甜水当然也算水。至少在我这里算。',
      '今天气色不错。终于知道水不是摆设了？',
      '你终于想起来给身体浇水了。很好，盆栽都会替你鼓掌。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'lilith_health',
    match: {
      category: ['健康', '身体', '运动'],
    },
    templates: [
      '身体这种东西很麻烦，不照顾它，它就会用更麻烦的方式提醒你。',
      '今天气色不错。看来你终于开始把自己当成需要维护的魔法道具了。',
      '健康不是奖励，是底盘。底盘坏了，再漂亮的魔法也只会摔在地上。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'growth-study',
    match: {
      category: '成长',
      titleIncludes: ['学习', '阅读', '看书', '论文', '背单词', '课程'],
    },
    templates: [
      '你今天看起来像真的完成了点东西。不错，虽然离合格魔女还差一点点。',
      '努力是最不会骗人的魔法材料，当然，也最容易让人困。',
      '知识进账一点点也算进账。别急着得意，先把它留在脑子里。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'work-focus',
    match: {
      category: '工作',
      titleIncludes: ['工作', '专注', '会议', '汇报', '项目'],
    },
    templates: [
      '今天倒像个正经人。放心，我不会到处替你宣传。',
      '专注是很稀有的材料，你居然真的采到了一点。',
      '工作完成了？很好。人类社会偶尔也能产出点像样的仪式感。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'family',
    match: {
      category: '家人',
      titleIncludes: ['家人', '妈妈', '爸爸', '父母', '亲人'],
    },
    templates: [
      '家人是很麻烦的羁绊。不过魔女也不是靠切断羁绊活着的。',
      '亲缘这种线，平时看着碍事，真断了又会疼。你今天做得不坏。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'social',
    match: {
      category: ['社交', '友情'],
      titleIncludes: ['朋友', '友情', '聚会', '聊天', '社交'],
    },
    templates: [
      '和别人说话不算浪费时间。前提是，对方值得。',
      '你愿意向人群迈一步，这件事本身就很有趣。别立刻逃走。',
      '关系也是要维护的。魔女的扫帚都得保养，朋友当然也一样。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'self-management',
    match: {
      category: '自我',
    },
    templates: [
      '你开始照顾自己的生活了？很好，至少小屋不会替你活下去。',
      '把日子收拾出一点形状，这也是魔法。只是没那么会发光。',
      '自我管理听起来无聊，但它能让你少被生活追着跑。',
    ],
  },
  {
    npcId: 'lilith',
    key: 'fallback',
    match: {},
    templates: [
      '我听说你最近在现实里做了点事。不错，亲爱的，生活终于没完全输给幻想。',
      '现实那边有动静？很好，我还以为你打算把自己永久寄存在雾里。',
      '不管是什么，总之你做成了一件事。先收下这句不太夸张的夸奖。',
    ],
  },
];
