


这是一份为你更新并补充了**“跨模块数据联动机制（现实与游戏的桥梁）”**的完整版《WitchOS子系统架构白皮书》。

我已经将刚才我们讨论的 **Zustand 跨 Store 调用的最佳实践** 正式写入了架构规范（新增了第 4 章节）。这样，当你把这份白皮书发给 Trae 时，它就不会在 UI 组件里乱写屎山代码了。


---

# 📜 WitchOS 游戏子系统架构白皮书 (Game Subsystem Architecture)

## 1. 核心定位与现实联动 (The Core Loop)
本游戏模块不是孤立的电子游戏，而是 LifeOS 的“奖励与映射层”。
*   **行动力（Energy/AP）来源**：玩家在现实中（`todoStore`, `habitStore`）完成待办、打卡，将直接转化为游戏内的“魔力/行动点”。
*   **游戏核心玩法**：消耗行动点进行【森林探险】、【城镇社交】、【孩子养成】、【炼金制药】。
*   **活人感原则**：重系统逻辑（时间表、全局变量标记、性格标签），轻 AI 闲聊。AI 仅用于特定关键剧情的文本润色（如情书生成），日常交互依靠**数据驱动的条件树**。

---

## 2. 核心系统架构 (四大支柱)

### 2.1 动态时间与节点地图系统 (Time & Node-Map)
*   **时间流逝**：游戏拥有独立的时间轴（Day, Hour）。每次执行消耗体力的动作（如“深入森林”、“指导孩子”），时间推进。
*   **节点地图 (DoL Style)**：无摇杆走位。地图是由地点（魔女工坊、小镇广场、暗黑森林）组成的节点网络。点击地点即发生跳转或触发地点专属事件池。

### 2.2 活体 NPC 系统 (Schedule-Driven NPCs)
*   摒弃死板站桩。NPC 根据**当前游戏时间（Hour/Day）**和**好感度**决定他们出现在哪个地图节点。
*   引入 **Rumor/Flag (传闻/标记) 系统**：玩家的重大行为（如在森林救人）会写入全局 Flag，NPC 对话树会根据 Flag 动态改变（“听说你昨天去了暗黑森林深处？”）。

### 2.3 动态标签化养成系统 (Tag-Based Child Raising)
*   **上限 5 人**。通过森林探险或特殊事件“捡到”孩子。
*   **成长双轨制**：
    *   **显性数值**：亲密度 (Love)、学识 (Intelligence)、暗黑度 (Darkness) 等。
    *   **隐性标签 (Tags)**：根据玩家行为动态赋予（如长期不管获得 `[孤僻]`，经常带去采集获得 `[野性]`）。
*   **16 岁质变期**：达到特定年龄时，根据数值+标签，触发独立剧情（职业分化、表白、离家出走等）。

### 2.4 步进式探索与事件池 (Step-Exploration)
*   在“森林”等危险区域，采用每次点击“深入”触发随机事件（Roguelite 摇点机制）。
*   事件池根据玩家的“当前时间”、“携带物品”、“属性”进行权重过滤。

---

## 3. 核心数据模型 (Zustand `gameStore` 定义规范)

这是必须严格实现的底层数据结构（TypeScript 接口定义概念）：

```typescript
// 1. 全局时间与玩家状态 (Player & World)
interface GameState {
  worldTime: { day: number; hour: number }; // 游戏时间
  player: {
    energy: number; // 从现实 Todo/Habit 同步过来的行动力
    money: number;
    inventory: Record<string, number>; // 背包 { 'herb_A': 12, 'potion_B': 2 }
    flags: string[]; // 全局标记，如['saved_child_first']
  };
  currentLocation: string; // 当前所处地图节点
  addEnergy: (amount: number) => void; // 增减能量的方法
}

// 2. 孩子实体 (Child) 与 NPC 实体 (NPC) 略...（参见上一版）
```

---

## 4. 现实与游戏的数据桥梁 (Cross-Store Data Bus) ⚠️ 核心联动规范

为了实现“现实中打钩，游戏中加魔力”的联动，且防止代码变成“屎山”，**严禁在 UI 视图层（React 组件的 onClick 事件中）同时调用多个 Store。**

所有的跨模块联动，必须在 **Store 层** 内部解决。我们约定使用以下两种模式之一：

### 模式 A：在 Store Action 中直接跨界调用（推荐用于简单联动）
在 `todoStore.ts` 的 `toggleTodo` 动作中，直接获取 `gameStore` 的实例并派发奖励：
```typescript
// 在 src/stores/todoStore.ts 中
import { useGameStore } from './gameStore'; 

toggleTodo: (id: string) => {
  // 1. 计算状态变更
  // ...
  
  // 2. 更新自身的 todo 状态
  set({ todos: newTodos });

  // 3. 跨模块联动：向游戏引擎发送能量
  if (isNowDone) {
    useGameStore.getState().addEnergy(10); // 待办完成，加 10 点能量
  } else {
    useGameStore.getState().addEnergy(-10); // 取消完成，扣除 10 点能量（防刷分）
  }
}
```

### 模式 B：使用 Zustand Subscribe 订阅监听（推荐用于复杂解耦）
让 `gameStore` 作为一个独立的监听者，在 `gameStore.ts` 文件底部监听其他 Store 的变化：
```typescript
// 在 src/stores/gameStore.ts 底部
import { useTodoStore } from './todoStore';

useTodoStore.subscribe((state, prevState) => {
    const currentDone = state.todos.filter(t => t.done).length;
    const prevDone = prevState.todos.filter(t => t.done).length;
    
    if (currentDone > prevDone) {
      const earned = (currentDone - prevDone) * 10;
      useGameStore.getState().addEnergy(earned);
    }
});
```
*开发纪律：执行此联动时，UI 组件（如 `TodoList.tsx`）的代码完全不需要修改，它只负责触发 `todoStore.toggleTodo` 即可。*

---

## 5. 目录结构规范 (防屎山警戒线)

所有游戏相关代码必须被限制在 `src/features/game/` 目录下，严禁污染 LifeOS 主线逻辑。

```text
src/features/game/
├── engine/                # 游戏核心引擎 (纯逻辑，无 UI)
│   ├── timeManager.ts     # 处理时间流逝与 NPC 位置刷新
│   ├── eventRunner.ts     # 解析事件树，判断条件，应用效果
│   └── randomizer.ts      # 摇点器与权重池抽取
├── content/               # 游戏内容包 (纯数据，像写小说一样)
│   ├── npcs/              # NPC 配置文件
│   ├── events/            # 剧情与随机事件库 (JSON/TS)
│   └── maps/              # 地图节点连通关系配置
├── ui/                    # 游戏专属展示组件
└── gameStore.ts           # 游戏模块专属 Zustand Store
```

---

## 6. 分阶段开发路线图 (执行拆解)

*   **Phase 1: 基础时空与现实联动 (MVP 引擎) 📍当前阶段**
    *   目标：打通 `todoStore` 到 `gameStore` 的能量转化逻辑。
    *   交付标准：完成待办时，工具页和游戏页顶部的“魔力值 (Energy)”同步增加；取消待办时扣除。建立“家”与“小镇”节点的简易 UI 跳转。
*   **Phase 2: DoL式森林探险与物品系统**
    *   目标：开发 `EventRunner`。在森林增加“深入”摇点机制，触发基础事件（草药/野兽），建立背包系统。
*   **Phase 3: 美少女梦工厂 (孩子系统落户)**
    *   目标：加入“捡到弃婴”事件，解锁育儿室节点，实现基于 Tags（标签）的数值交互。
*   **Phase 4: 星露谷作息与城镇社交**
    *   目标：引入 NPC 独立作息时间表，实现基于 Flag 和好感度的动态对话树。
*   **Phase 5: 高级系统与 AI 点缀**
    *   目标：16 岁质变期剧情触发。在情书生成、NPC 闲聊环节按需接入真实 AI大模型。

---

## 7. 给 Trae / AI 助手的开发纪律 (执行约束)

1.  **架构不可越界**：如果你（AI）建议的方案要求在 UI 层直接修改多个 Store，或者在工具模块里硬编码游戏逻辑，说明你违反了本白皮书的第 4 章节，请立刻重构你的代码。
2.  **单一数据源**：体力增减、时间推演必须封装为 `gameStore.ts` 内部的 Action。
3.  **UI 极简优先**：现阶段禁止编写过度复杂的动画或引入额外的 Web 样式库，优先使用原生 `View`, `Text` 组件把数据流跑通。
4.  **人设保持**：游戏界面的默认文案、Toast 提示等，请自动代入“慵懒犀利笑面虎吐槽”的魔女口吻。例如缺少魔力时提示：“连这点魔力都榨不出来，你是把时间都拿去睡觉了吗？”

---
*(End of Document)*

### 💡 接下来该怎么做？

1. 把这段内容完整保存进 `docs/game-architecture.md`。
2. 在 Trae 里发起指令：
   > “@docs/game-architecture.md 请根据白皮书中【Phase 1】的目标和【第4章】的跨 Store 联动规范，修改我的 `todoStore.ts` 和创建 `gameStore.ts`。我要实现：当我点击完成一个 Todo，游戏魔力值 +10。请给我代码。”


### 1. 活人感的秘诀：不是“会聊天”，而是“有自己的生活”

NPC 的“死板”通常是因为他们永远站在同一个地方说同样的话。要做到“活人感”，你需要实现以下三个系统：

#### A. 核心系统：作息表（Schedule System）
让 NPC 动起来。不要让他们死守在某个坐标。
*   **实现方法：** 在你的 `gameStore` 里定义一个全局时间（小时/分钟）。
*   **逻辑：** 
    *   早上 8:00，NPC“铁匠”在铁匠铺。
    *   下午 2:00，他在森林伐木。
    *   晚上 8:00，他在酒馆喝酒。
*   **效果：** 玩家在不同时间去不同地点能“偶遇”到他，这种**不确定性**就是活人感的第一步。

#### B. 社交链与传闻（Relationship Network）
NPC 之间应该互相认识，并且会谈论玩家。
*   **实现方法：** 使用 **Global Flags (全局标记)**。
*   **逻辑：** 
    *   如果你在森林救了一个孩子（触发 Flag: `saved_child_A`）。
    *   你去镇长家时，镇长会多出一行对话：“听说你在森林救了个孩子？真是善良的魔女。”
*   **效果：** NPC 表现出了**“记忆”**，玩家会觉得自己的行为影响了世界。

#### C. 动态的情绪状态（State Machine）
NPC 不应该是复读机，他们的对话应该受状态影响。
*   **逻辑：** 对话 = `基础文案` + `好感度修正` + `环境修正`。
*   **例子：** 同样是打招呼，好感度高时是“早安，亲爱的”，下雨天时是“这雨真讨厌，对吧？”
*   **不需要 AI：** 你只需要准备几组不同的文案模板，根据变量随机抽取即可。

---

### 2. 孩子养成系统：从“随机”到“性格演变”

既然你想最多养 5 个孩子，且要有“写信、追求”等行为，你可以参考 **《模拟人生》的标签系统**：

*   **属性定义：** 每个孩子不仅有数值（力量、智力），还要有 **Tags (性格标签)**，如 `[内向]`、`[占有欲强]`、`[温柔]`。
*   **性格演变：** 
    *   如果玩家经常忽视孩子，孩子可能会获得 `[孤僻]` 标签。
    *   如果玩家经常带孩子去森林，孩子可能会获得 `[勇敢]` 标签。
*   **行为驱动：** 
    *   当孩子 16 岁，如果 `好感度 > 80` 且拥有 `[占有欲强]` 标签，则触发“写情书”或“跟踪”事件。
    *   这种由 **属性 -> 标签 -> 事件** 的推导，比 AI 随机生成的对话要更有游戏性。

---

### 3. 森林探险：Roguelike 的随机性

这部分建议模仿 DoL 的 **“步进式探险”**：
1.  玩家点击“深入森林”。
2.  引擎在后台摇点（Random 1-100）。
3.  根据点数和玩家属性触发事件：
    *   1-20：捡到[药材]
    *   21-30：遭遇[野兽]（进入战斗或逃跑）
    *   31-35：发现[被遗弃的孩子]（开启养成线）
    *   ...

---

### 4. 什么时候才需要连 AI？

在你的架构中，AI 应该作为 **“装饰品”** 而非 **“骨架”**。

**推荐接入 AI 的场景：**
1.  **情书生成：** 孩子给你写信时，你可以把孩子的性格、好感度、过去发生的一件事发给 AI，让它写出一封独一无二的信。
2.  **吐槽对话：** 当你（魔女）在小镇散步，AI 可以根据你今天的 Todo 完成情况，即兴生成一句路人的闲聊。

**不推荐接入 AI 的场景：**
1.  **逻辑判断：** “孩子是否喜欢我”这种逻辑，必须由你写的代码（数值判断）说了算，不能让 AI 瞎猜。
2.  **剧情推进：** 核心剧情必须是写死的，否则游戏会失去目标感。

---

### 5. 针对你的 LifeOS 架构建议

要在 Trae 制作这个系统，你的 `gameStore` 需要这样设计：

```typescript
// 伪代码示例
interface Child {
  id: string;
  name: string;
  age: number;
  stats: { love: number; courage: number; ... };
  tags: string[]; // ['lonely', 'brave']
  memory: string[]; // 记录发生过的大事
}

interface GameStore {
  worldTime: number; // 0-24小时
  playerEnergy: number; // 连接 Todo: 完成一个任务加 10 点能量
  children: Child[];
  npcStates: Record<string, any>; // 记录 NPC 的好感度和位置
}
```

### 给你的下一步行动指南：

1.  **先做地图跳转：** 实现“家 -> 小镇 -> 森林”的切换。
2.  **实现时间流逝：** 每点一次“行动”，时间增加 1 小时。
3.  **做一个最简单的 NPC：** 他早上在 A，下午在 B，对话会根据你是否在森林捡过药材而改变。
4.  **先不要接 AI：** 先用你自己的“吐槽文案”占位。