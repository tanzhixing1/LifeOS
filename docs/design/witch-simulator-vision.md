# Witch Simulator Vision v0.1

本文档是当前可执行的魔女模拟器愿景摘要。它提炼旧白皮书中的有效方向，但不替代 `AGENTS.md`、`docs/architecture.md` 和 `docs/game-architecture.md` 的执行规范。

## 1. Product Positioning

LifeOS = 现实工具 + 魔女游戏奖励层 + AI 预留 + 扩展记录。

- 现实工具：Todo、Habit、日程、碎片记录等，优先保证数据可靠和日常可用。
- 魔女游戏奖励层：把现实完成行为映射为游戏内魔力、行动力或剧情推进资源。
- AI 预留：保留 provider interface、mock、prompt/context helper，不接真实 API。
- 扩展记录：灵感、心情、搜索等模块作为后续扩展，不抢当前主线。

## 2. Current Priorities

当前优先级保持小步、清晰、可验证：

- 稳定工具数据：Todo/Habit 的本地持久化和基础操作优先。
- 打通现实与游戏：Todo/Habit 完成后通过 store action 或 service 联动游戏魔力。
- 完成游戏 MVP：保留地图、事件、选项、条件、效果、存档等最小剧情链路。
- 内容数据驱动：剧情、地图、事件尽量写入 `src/features/game/content/`，引擎只负责解释和执行。

## 3. Long-Term Vision

以下内容是长期愿景，不是当前 Phase 1 任务：

- NPC 作息、好感度、传闻和动态对话。
- 孩子养成、标签演化、成长事件和长期剧情线。
- 森林步进式探索、随机事件池和权重抽取。
- 炼金、背包、物品、战斗、金钱等大系统。
- AI 点缀，如情书生成、氛围文本、角色化吐槽。

## 4. Fixed Architecture Boundaries

- `gameStore` 固定在 `src/stores/gameStore.ts`。
- 不创建 `src/features/game/gameStore.ts`。
- `src/features/game/` 只放 engine、content、ui 和游戏业务逻辑。
- `app/(tabs)/game/` 是 Expo Router 路由入口，不能迁移到 `src/features/game/`。
- UI 页面不直接同时操作多个 store；跨模块联动放在 store action 或 service 层。
- 真实 AI API 暂不接入，只允许 mock、placeholder 和 provider interface。

