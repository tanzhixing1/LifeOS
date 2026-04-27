import { AttributeModifier, PlayerAttributes } from './model';

/**
 * 剧情/事件选项
 * 每个选项都可导致数值变动、标志位更新或跳转至新事件
 */
export interface EventOption {
  text: string;           // 选项文本（如“去图书馆学习”）
  nextEventId?: string;   // 结果跳转的下一个事件 ID
  
  // 触发条件（可选）
  requirements?: {
    flags?: Record<string, any>;
    attributes?: Partial<PlayerAttributes>;
  };

  // 选择后果（可选）
  effects?: {
    attributes?: AttributeModifier;
    flags?: Record<string, any>;
  };
}

/**
 * 核心事件结构（剧情对话片段）
 * 对应白皮书中的“内容像资源包”理念，完全由数据驱动
 */
export interface GameEvent {
  id: string;             // 事件唯一标识（如 "morning_wake_up"）
  title?: string;         // 事件标题（可选）
  content: string;        // 文本内容，支持模板字符串渲染
  type: 'dialogue' | 'story' | 'system'; // 事件展示风格
  
  options: EventOption[]; // 该事件提供的互动选项
  
  background?: string;    // 背景图片资源 ID 或 URL
  speaker?: string;       // 当前发言人名称（对话模式下使用）
}
