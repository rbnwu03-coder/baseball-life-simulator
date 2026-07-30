# Architecture Roadmap

Version:

1.0

Status:

Active

---

# Purpose

Architecture Roadmap

不是：

待辦清單。

也不是：

開發進度表。

它的目的：

定義《棒球人生》

Architecture

目前的位置、

完成狀態、

下一步方向。

Roadmap

回答：

```text
目前完成了什麼？
```

```text
下一步應做什麼？
```

```text
哪些屬於 Prototype？
```

```text
哪些留到 Production？
```

---

# Architecture Development Philosophy

Architecture

遵守以下順序：

```text
Vision

↓

Architecture

↓

Prototype

↓

Implementation

↓

Playtest

↓

Iteration

↓

Production
```

任何程式碼

都不應先於：

Architecture。

Prototype

的目的：

驗證 Architecture。

Production

的目的：

完成產品。

---

# Current Architecture Status

目前已完成：

| 文件 | 狀態 | 說明 |
|------|------|------|
| README v2 | ✅ Complete | 專案總覽 |
| Architecture Bible v2 | ✅ Complete | 核心設計理念 |
| Core System Documents | ✅ Complete | 16 個核心 System |
| 17_Prototype-Specification | ✅ Complete | Prototype 範圍 |
| 18_Prototype-Data-Contract | ✅ Complete | Ownership / Data Flow |
| 19_Prototype-Day-Loop | ✅ Complete | 每日流程 |
| 20_Architecture-Review | ✅ Complete | 架構審查紀錄 |

Architecture

目前狀態：

```text
Stable v1.1
```

代表：

可以開始：

Prototype Implementation。

---

# Current Prototype Goal

Prototype v2

唯一目標：

驗證：

```text
Architecture
```

不是：

驗證：

```text
劇情量
```

不是：

驗證：

```text
遊戲平衡
```

不是：

驗證：

```text
最終 UI
```

Prototype

只需完成：

```text
完整 Gameplay Loop
```

---

# Prototype Scope

Prototype

至少包含：

```text
Character Creation
```

↓

```text
Identity
```

↓

```text
Day Loop
```

↓

```text
Decision
```

↓

```text
Event
```

↓

```text
Current State
```

↓

```text
Progression
```

↓

```text
Relationship
```

↓

```text
Coach
```

↓

```text
Organization
```

↓

```text
Narrative
```

↓

```text
Save
```

↓

```text
Next Day
```

只要這條流程

可以完整運作，

Prototype

即達成主要目標。

---

# Prototype Milestones

## Milestone 1

Architecture Foundation

Status：

✅ Completed

內容：

```text
Architecture

Specification

Data Contract

Day Loop

Review
```

---

## Milestone 2

Core Gameplay Implementation

Status：

🟡 Next

內容：

```text
Player System
```

↓

```text
Identity System
```

↓

```text
Current State System
```

↓

```text
Decision System
```

↓

```text
Event System
```

↓

```text
Application Controller
```

目標：

玩家可以完成：

一天。

---

## Milestone 3

World Response

Status：

🔵 Planned

內容：

```text
Relationship
```

↓

```text
Coach
```

↓

```text
Organization
```

↓

```text
Narrative
```

目標：

玩家開始感受到：

世界正在回應。

---

## Milestone 4

Persistence

Status：

🔵 Planned

內容：

```text
Save
```

↓

```text
Load
```

↓

```text
Continue
```

目標：

玩家人生

可以持續。

---

## Milestone 5

Prototype Validation

Status：

🔵 Planned

內容：

```text
Playtest
```

↓

```text
Architecture Review
```

↓

```text
Iteration
```

目標：

確認：

Architecture

是否成立。

---

# Documents Planned

Prototype

尚未建立：

| 文件 | 優先度 |
|------|--------|
| Decision System Contract | High |
| Event System Contract | High |
| Progression System Contract | High |
| Match System Contract | Medium |
| Injury System Contract | Medium |
| Career System Contract | Medium |

以上文件

屬於：

Prototype

後續補完。

---

# Coding Strategy

Prototype

遵守：

```text
One System

↓

One Test

↓

One Review
```

流程：

```text
GPT

設計

↓

Codex

實作

↓

Playtest

↓

Architecture Review

↓

修正

↓

下一個 System
```

禁止：

一次完成全部程式。

---

# Playtest Strategy

每完成一個 Milestone，

至少進行：

一次完整測試。

檢查：

```text
Day Loop 是否完整？
```

```text
Data Flow 是否一致？
```

```text
Owner 是否正確？
```

```text
是否有跨 System 修改？
```

```text
玩家是否理解世界回應？
```

---

# Exit Criteria

Prototype

完成條件：

✅ Character Creation

✅ Identity

✅ 一天可完整結束

✅ Save / Load

✅ 世界會回應玩家

✅ Architecture 無重大修改

達成以上條件後，

Prototype

正式完成。

---

# Production Roadmap

Prototype

完成後，

Production

將進入：

```text
大量事件
```

↓

```text
完整劇情
```

↓

```text
完整 UI
```

↓

```text
平衡調整
```

↓

```text
內容擴充
```

Prototype

不應提前處理：

```text
大量事件
```

```text
數值平衡
```

```text
最終美術
```

```text
完整音效
```

---

# Current Position

目前專案位置：

```text
Architecture

██████████ 100%
```

```text
Prototype Design

██████████ 100%
```

```text
Prototype Coding

□□□□□□□□□□ 0%
```

```text
Playtest

□□□□□□□□□□ 0%
```

```text
Production

□□□□□□□□□□ 0%
```

---

# Next Action

目前唯一建議：

開始：

```text
Prototype Coding
```

依照：

```text
Application Controller
```

↓

```text
Player
```

↓

```text
Identity
```

↓

```text
Current State
```

↓

```text
Decision
```

逐步完成。

Architecture

在沒有重大問題前，

不再新增核心設計文件。

之後的重心，

正式轉向：

**Implementation。**