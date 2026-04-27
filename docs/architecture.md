# LifeOS Architecture

本文档是当前项目的架构固化说明，以真实代码结构为准。它用于避免后续目录、Store、游戏模块和 AI 模块继续分叉。

## 1. Current Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand + AsyncStorage persistence
- npm package manager

## 2. Current Real Directory Structure

```text
LifeOS/
├── app/
│   ├── _layout.tsx
│   ├── modal.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── tools/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── schedule.tsx
│       │   ├── todos/index.tsx
│       │   └── habits/index.tsx
│       ├── game/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── map.tsx
│       │   └── play.tsx
│       ├── ai/index.tsx
│       ├── lab/
│       │   ├── index.tsx
│       │   ├── mood.tsx
│       │   └── inspiration.tsx
│       └── settings/index.tsx
├── components/
├── constants/
├── hooks/
├── src/
│   ├── core/
│   │   ├── constants/
│   │   ├── theme/
│   │   ├── types/
│   │   └── utils/
│   ├── stores/
│   │   ├── aiStore.ts
│   │   ├── gameStore.ts
│   │   ├── habitStore.ts
│   │   ├── index.ts
│   │   ├── messengerStore.ts
│   │   └── todoStore.ts
│   ├── services/
│   │   ├── ai/
│   │   └── storage/
│   └── features/
│       ├── ai/
│       ├── game/
│       │   ├── content/
│       │   ├── engine/
│       │   └── ui/
│       └── tools/
├── docs/
│   ├── architecture.md
│   ├── game-architecture.md
│   ├── game-content-guide.md
│   └── roadmap.md
├── app.json
├── package.json
└── package-lock.json
```

## 3. Module Boundaries

- `app/` only provides route entries, screen shells, navigation wiring, and page-level composition.
- Complex business logic should gradually move out of `app/` into `src/features/`, `src/stores/`, or `src/services/`.
- `src/core/` contains shared types, constants, theme, and pure utilities.
- `src/stores/` is the only home for cross-module shared Zustand state.
- `src/services/` wraps external or low-level capabilities such as storage and AI providers.
- `src/features/` contains domain-specific business code, engine logic, content, and feature-specific UI.
- A feature should not import another feature's internal files directly. Shared data should go through `src/stores/`; shared capabilities should go through `src/services/` or `src/core/`.

## 4. Store Placement Rules

- All global shared state lives in `src/stores/`.
- `gameStore` is fixed at `src/stores/gameStore.ts`.
- Do not create `src/features/game/gameStore.ts`.
- `habitStore`, `todoStore`, `gameStore`, `aiStore`, and `messengerStore` are current central stores.
- Store persistence should use the existing `src/services/storage/zustandStorage.ts` adapter.
- UI components should call store actions, not mutate storage directly.
- UI components should not coordinate multiple stores directly for cross-module features. Prefer store actions or a service layer.

## 5. app/ Versus src/features/

`app/` is the Expo Router surface:

- route files
- tab and stack layouts
- screen entry components
- page-level composition

`src/features/` is the feature implementation surface:

- game engine logic
- game content and map/event data
- game-only UI components
- future tools business logic
- future feature-specific domain workflows

The current project still has meaningful tool logic inside `app/(tabs)/tools/`. This is accepted for now. Future work should move reusable or complex logic into `src/features/tools/` without large disruptive migrations.

## 6. Game Module Rules

- Global game state is `src/stores/gameStore.ts`.
- Game engine logic lives in `src/features/game/engine/`.
- Game content lives in `src/features/game/content/`.
- Game-only UI lives in `src/features/game/ui/`.
- `src/features/game/` should not own a second global game store.
- Current game implementation is a small MVP: content pack, condition/effect execution, map page, event page, and simple save/load.
- NPC schedules, child raising, forest exploration, random event pools, and large simulation systems are later phases and should not be implemented during architecture hardening.

## 7. Tools Module Rules

- Current tool screens live in `app/(tabs)/tools/`.
- Current tool state is already persisted through `src/stores/habitStore.ts` and `src/stores/todoStore.ts`.
- `src/features/tools/` is reserved for future reusable tool business logic.
- Do not migrate existing tool screens during Phase 0.

## 8. AI Rules

- Real AI APIs are not connected in the current architecture.
- Only mock providers, placeholders, provider interfaces, character data placeholders, and prompt/context helpers are allowed for now.
- Business code should call the AI abstraction layer, not a vendor SDK directly.
- Do not add API keys, real provider credentials, or network calls unless the user explicitly starts an AI integration phase.

## 9. Recommended Phase 1 Target

Phase 1 should stay small:

- Add a clear `gameStore` action for magic or energy changes.
- Connect Todo/Habit completion to `gameStore` magic value through store actions or a service.
- Completing a Todo/Habit should increase magic; undoing completion should reverse it where appropriate.
- Keep this out of UI components. The page should only call `todoStore.toggle()` or `habitStore.toggleTodayDone()`.
- Do not implement NPCs, child systems, forest exploration, random event pools, or real AI APIs in Phase 1.

## 10. Safety Rules

- Do not run `npm run reset-project`.
- Do not delete `node_modules`, `package-lock.json`, `app/`, `src/`, or `docs/` without explicit confirmation.
- Do not switch npm to yarn or pnpm.
- Do not move `src/stores/gameStore.ts` into `src/features/game/`.
- Keep changes small and phase-scoped.
