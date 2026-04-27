# LifeOS Game Architecture

本文档固化当前游戏子系统的长期边界。它保留“魔女模拟器”核心设定，但以当前真实工程结构为准，解决旧文档中 `gameStore` 放置位置的冲突。

## 1. Core Positioning

游戏模块是 LifeOS 的奖励与映射层，不是孤立的大型游戏系统。

- 现实任务和习惯完成情况，后续可以转化为游戏内魔力或行动力。
- 游戏内容优先数据驱动，剧情、地图、事件应尽量放在内容文件中。
- AI 只作为后期点缀，不作为核心剧情推进、逻辑判断或数值结算的骨架。

## 2. Fixed File Ownership

```text
src/stores/gameStore.ts
src/features/game/
├── engine/
├── content/
└── ui/
```

- 全局游戏状态固定放在 `src/stores/gameStore.ts`。
- 不创建 `src/features/game/gameStore.ts`。
- `src/features/game/engine/` 只放游戏引擎、条件判断、效果执行、校验、随机器、时间管理等纯逻辑。
- `src/features/game/content/` 只放剧情、地图、NPC、事件、物品等内容数据。
- `src/features/game/ui/` 只放游戏专属 UI 组件。

## 3. Current Implemented Scope

当前代码已经有一个轻量 MVP：

- `src/stores/gameStore.ts`：玩家属性、flag、当前位置、当前事件、简单存档槽。
- `src/features/game/engine/types.ts`：地图、事件、条件、效果、玩家状态类型。
- `src/features/game/engine/executor.ts`：条件过滤与效果执行。
- `src/features/game/engine/validate.ts`：内容包校验。
- `src/features/game/content/demo/events.json`：demo 事件和地图节点。
- `src/features/game/ui/EventPanel.tsx`：事件展示组件。
- `app/(tabs)/game/`：游戏首页、地图页、事件页路由入口。

## 4. Later Systems Not In Phase 0

以下内容属于后续阶段，当前不实现：

- NPC 作息系统。
- 孩子养成系统。
- 森林步进式探索。
- 随机事件池和权重抽取。
- 物品、炼金、战斗等大系统。
- 真实 AI API 接入。

## 5. Cross-Store Integration Rule

现实工具与游戏联动时，不允许在 UI 页面里同时直接操作多个 Store。

推荐方式：

- 在 `todoStore` 或 `habitStore` 的 action 中调用 `gameStore` action。
- 或者在 service 层封装联动逻辑，由 store action 调用 service。

Phase 1 的推荐目标是：

- 完成 Todo 或 Habit 后增加 `gameStore` 中的魔力值。
- 取消完成时按规则回退魔力值。
- 页面仍然只调用工具 store 的 action。

## 6. AI Boundary

- 当前不接真实 AI API。
- 允许 mock provider、placeholder、provider interface、prompt/context helper。
- 游戏核心逻辑不能依赖 AI 输出做判断。
- 情书、吐槽、氛围文本等可以作为后期 AI 点缀场景。
