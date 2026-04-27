/**
 * 极简游戏引擎底座
 * 
 * 职责：
 * 1. 定义核心数据模型（玩家属性、剧情事件）
 * 2. 提供解析事件与应用效果的基础逻辑
 * 3. 保持扩展性，禁止在此处编写特定业务逻辑（如具体的地图坐标、怪物属性等）
 */

export * from './types';
export * from './executor';
export * from './validate';
