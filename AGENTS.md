# LifeOS Agent Rules

## Project Baseline

- 当前项目是 Expo + React Native + TypeScript + Expo Router。
- 本项目使用 npm，不允许擅自切换 yarn / pnpm。
- Windows 下启动项目优先使用 `npx expo start -c` 或 `npx.cmd expo start -c`。
- 当前项目已经能通过 `npx expo start -c` 启动，不要反复排查启动问题，除非用户明确要求。

## Architecture Rules

- `app/` 是 Expo Router 路由壳，复杂业务逻辑应逐步沉淀到 `src/features/` 或 `src/stores/`。
- 跨模块共享状态必须放在 `src/stores/`。
- 全局游戏状态固定放在 `src/stores/gameStore.ts`。
- 不再创建 `src/features/game/gameStore.ts`。
- 游戏引擎逻辑固定放在 `src/features/game/engine/`。
- 游戏剧情、地图、NPC、事件数据固定放在 `src/features/game/content/`。
- 游戏专属 UI 固定放在 `src/features/game/ui/`。
- `src/features/game/` 只放游戏引擎、内容、UI、业务逻辑。
- 工具模块业务逐步沉淀到 `src/features/tools/`。
- AI 真实 API 暂不接入，只允许 mock / placeholder / provider interface。

## Store And Integration Rules

- 不允许在 UI 组件里同时直接操作多个 Store。
- 跨模块联动优先在 Store Action 或 service 层处理。
- Todo / Habit 与游戏魔力值等跨模块联动，应在 store action 或 service 中实现，不写在页面组件中。

## Workflow Rules

- 每次修改前必须先列出计划、涉及文件、风险、验证方式。
- 每次任务尽量小步完成，不要一次性实现多个 Phase。
- 不允许运行 `npm run reset-project`。
- 不允许无确认删除 `node_modules`、`package-lock.json`、`app/`、`src/`、`docs/`。
- 不要擅自安装依赖、修改 `package.json`、移动大量现有文件。
