/**
 * 玩家基础属性
 * 抽象的五维或六维模型，可根据后续设计灵活扩展
 */
export interface PlayerAttributes {
  strength: number;      // 力量
  intelligence: number;  // 智力
  dexterity: number;     // 敏捷
  charisma: number;      // 魅力
  stamina: number;       // 体力/耐力
  sanity: number;        // 理智
}

/**
 * 核心游戏状态（用于存档与同步）
 */
export interface GameState {
  attributes: PlayerAttributes;
  flags: Record<string, boolean | number | string>; // 动态标志位，记录剧情进度与选择后果
  inventory: string[]; // 简易道具清单
  lastEventId?: string; // 当前/最后一次触发的事件 ID
  playTime: number; // 累计游玩秒数
}

/**
 * 属性变动类型（增量或绝对值）
 */
export type AttributeModifier = Partial<PlayerAttributes>;
