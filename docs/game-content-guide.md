# 魔女模拟器内容写作规范（草案）

目标：让你后续“像写小说一样”加剧情——**主要改数据文件，不改引擎代码**。

## 1) 最小单位：事件（Event）

每个事件是一个“节点”：显示文本/图片，给出选项，点击选项触发效果，跳到下一个事件或地点。

建议字段（概念）：

- `id`：全局唯一（建议格式：`area_chapter_scene_xxx`）
- `title`：可选，用于调试与目录
- `body`：文本段落（可数组）
- `image`：可选（相对路径）
- `choices[]`：选项列表
  - `text`
  - `to`：跳转目标（事件 id 或特殊指令）
  - `when`：触发条件（可选）
  - `effects[]`：效果（可选）

## 2) 条件（Condition）与效果（Effect）

你可以把它们理解成：

- **Condition**：我“能不能看到/点这个选项”
- **Effect**：我“点了之后发生什么”

常见 Condition（概念）：

- `hasFlag(flagId)`
- `statGte(statId, value)`
- `atLocation(locationId)`

常见 Effect（概念）：

- `setFlag(flagId, true)`
- `addStat(statId, delta)`
- `moveTo(locationId)`
- `giveItem(itemId, count)`

## 3) 命名与组织（推荐）

- 按区域拆包：`features/game/content/areas/<areaId>/...`
- 图片与事件同目录，方便搬运与复用
- 永远不要在代码里写死剧情文字

