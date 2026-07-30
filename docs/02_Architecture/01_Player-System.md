# 01 Player System

Version: 2.0

---

# Purpose

Player System 是整個遊戲的核心參照點（Central Reference）。

它代表玩家角色目前的狀態（Current State），提供其他 System 一個共同的查詢入口。

Player System 並不負責決策、劇情或世界運作。

它的責任是維護玩家角色在當前時間點的狀態一致性。

---

# Responsibilities

Player System 負責管理：

- 玩家基本資料（Basic Profile）
- 玩家目前能力摘要（Current Ability Summary）
- 玩家目前身體狀態（Physical State）
- 玩家目前競技狀態（Competitive State）
- 玩家目前所處人生階段（Current Career Stage）
- 玩家目前位置（Current Location）
- 玩家目前可操作狀態（Availability）
- 提供其他 System 查詢目前玩家狀態

Player System 不決定：

- 世界如何運作
- NPC 如何思考
- 劇情如何發展
- 能力如何成長
- 關係如何改變

---

# Not Responsible

Player System 不負責：

## Identity

玩家想成為什麼樣的人。

由：

Identity System

管理。

---

## Narrative

世界如何回應玩家。

由：

Narrative System

管理。

---

## Relationship

玩家與 NPC 的關係。

由：

Relationship System

管理。

---

## Career

人生路徑。

由：

Career System

管理。

---

## Match

每場比賽。

由：

Match System

管理。

---

## Progression

能力成長。

由：

Progression System

管理。

---

## Insight

玩家形成的理解。

由：

Insight System

管理。

---

## World

世界目前發生什麼。

由：

World System

管理。

---

## Event

事件流程。

由：

Event System

管理。

---

# Core Concepts

Player System 建立的是：

> 玩家現在是什麼狀態。

而不是：

> 玩家曾經發生過什麼。

歷史由各 System 保存。

Player 僅保存目前狀態。

---

# Core Data

Player 擁有的資料分為以下幾類。

---

## Basic Profile

基本資訊。

例如：

- Name
- Age
- Birthday
- Dominant Hand
- Primary Position

這些資料通常建立角色後很少改變。

---

## Physical State

目前身體狀態。

例如：

- Stamina
- Fatigue
- Health
- Injury Summary
- Recovery Status

詳細傷病資料由：

Injury System

管理。

Player 僅保存目前摘要。

---

## Competitive State

目前競技狀態。

例如：

- Current Form
- Confidence
- Availability
- Match Readiness

這些資料會頻繁更新。

---

## Ability Summary

目前能力摘要。

例如：

- Contact
- Power
- Speed
- Defense
- Arm Strength

能力如何變化：

由

Progression System

決定。

Player 僅保存目前結果。

---

## Current Career

目前人生狀態。

例如：

- Elementary
- Junior High
- High School
- College
- Professional
- Retirement

詳細 Career History

由：

Career System

保存。

---

## Current Location

目前所在地。

例如：

- Team
- School
- Training Facility
- Hospital
- Home

Player 不保存 Location History。
## Current Identity Summary

Player 不保存完整 Identity。

Player 僅保存目前需要快速查詢的摘要，例如：

- Current Goal
- Current Role Identity
- Current Aspiration

完整資料由：

Identity System

管理。

---

# Ownership

Player System 擁有以下資料的最終修改權（Owner）：

| Data | Owner |
|------|-------|
| Basic Profile | Player System |
| Current Physical State | Player System |
| Current Competitive State | Player System |
| Ability Summary | Player System（由 Progression 更新） |
| Current Career Summary | Player System（由 Career 更新） |
| Current Identity Summary | Player System（由 Identity 更新） |
| Current Location | Player System |

---

Player System 不擁有：

| Data | Owner |
|------|-------|
| Identity | Identity System |
| Relationship | Relationship System |
| Narrative Memory | Narrative System |
| Career History | Career System |
| Match Record | Match System |
| Ability Growth History | Progression System |
| Insight | Insight System |
| World State | World System |
| Event Queue | Event System |
| Injury Detail | Injury System |

---

# Lifecycle

Player 的生命週期如下：

```text
Create Player

↓

Initialize State

↓

Receive World State

↓

Participate in Events

↓

Participate in Matches

↓

Receive State Updates

↓

Save

↓

Load

↓

Retirement

↓

Archive
```

Player 永遠存在。

真正改變的是：

Player State。

---

# State Update Flow

Player 自己不主動改變。

所有更新都來自其他 System。

例如：

```text
Match

↓

Performance

↓

Progression

↓

Player Ability Summary 更新
```

另一個例子：

```text
Career Promotion

↓

Career System

↓

Player Career Summary 更新
```

又例如：

```text
Injury

↓

Injury System

↓

Player Physical State 更新
```

Player 自己不計算。

只接受正式更新。

---

# Data Flow

整體資料流如下：

```text
World

↓

Event

↓

Player

↓

Narrative

↓

Insight

↓

Progression

↓

Player State 更新
```

Player 位於資料流中央。

但不是決策中心。

---

# Query Gateway

Player 是所有 System 最常查詢的入口。

例如：

Relationship 需要知道：

- 玩家幾歲？
- 玩家在哪？
- 玩家目前是哪支球隊？

Narrative 需要知道：

- 玩家目前職涯？
- 玩家目前身體狀況？

Match 需要知道：

- 玩家目前能力？
- 玩家是否可以上場？

這些查詢都透過 Player 完成。

Player 是：

> Current State Gateway

不是：

> Data Owner of Everything。

---

# System Interaction

Player 與其他 System 的互動原則如下。

Identity

↓

更新玩家目前身份摘要。

---

Career

↓

更新玩家目前人生階段。

---

Progression

↓

更新能力摘要。

---

Injury

↓

更新健康摘要。

---

World

↓

更新所在地。

---

Match

↓

更新目前競技狀態。

---

Narrative

↓

讀取 Player。

不直接修改 Player。
# Architecture Rules

Player System 必須遵守以下規則。

---

## Rule 01

Player 只保存目前狀態（Current State）。

Player 不保存完整歷史。

例如：

可以保存：

- Current Stamina
- Current Team
- Current Goal
- Current Ability

不能保存：

- 所有比賽紀錄
- 所有事件歷史
- 所有 Relationship History
- 所有 Insight History

歷史資料應由各自的 System 保存。

---

## Rule 02

Player 不產生任何遊戲邏輯。

Player 不做任何判斷。

例如：

Player 不會決定：

- 是否受傷
- 是否升學
- 是否進入職棒
- 是否觸發事件
- 是否提升能力

Player 只接受其他 System 的正式更新。

---

## Rule 03

Player 不擁有其他 System 的資料。

例如：

Relationship System

保存：

Relationship Data

Player 只能保存：

Relationship Summary（如果需要）。

不能保存：

完整 Relationship。

同樣：

Insight

Career

Narrative

World

都遵守此原則。

---

## Rule 04

Player 必須保持一致性（Consistency）。

任何時刻，

Player 的所有狀態都應代表：

世界目前承認的玩家狀態。

例如：

若 Career 已更新為：

Professional

Player 不應仍顯示：

High School。

若 Injury 已判定：

Unavailable

Player 不應仍允許：

Ready to Play。

所有 Summary 必須同步。

---

## Rule 05

Player 是查詢入口（Gateway）。

其他 System 若需要玩家目前資訊，

應透過 Player 查詢。

例如：

Match：

查詢目前能力。

Narrative：

查詢目前人生階段。

World：

查詢目前所在地。

Player 提供的是：

Current Snapshot。

不是完整資料。

---

## Rule 06

Player 不應逐漸演變成 God Object。

新增功能時，

應先回答：

這項資料真正的 Owner 是誰？

若答案不是：

Player。

則不應直接加入 Player。

Player 應保持精簡，

只保存目前需要快速存取的資訊。

---

# Relationship with Other Systems

Player 是所有 System 的共同參照點。

但不是所有資料的管理者。

---

## Identity System

Identity 決定：

玩家如何看待自己。

Player 保存：

目前 Identity Summary。

---

## Narrative System

Narrative 根據 Player 的目前狀態，

決定世界如何回應玩家。

Narrative 不直接修改 Player。

---

## Relationship System

Relationship 管理：

玩家與 NPC 的互動關係。

Player 不保存完整關係資料。

只提供目前玩家資訊供查詢。

---

## Career System

Career 管理：

人生階段與職涯進程。

Career 更新後，

同步更新：

Player Current Career。

---

## Match System

Match 使用：

Player Current State

作為比賽輸入。

比賽結束後，

更新：

Player Competitive State。

---

## Progression System

Progression 計算：

能力如何改變。

Player 保存：

最新能力摘要。

---

## Insight System

Insight 保存：

玩家真正理解了什麼。

Player 最多保存：

目前 Insight 的摘要（如 UI 需要）。

完整資料仍由 Insight System 管理。

---

## World System

World 決定：

玩家所處環境。

Player 保存：

目前所在地。

World 保存：

世界本身。

---

## Event System

Event 觸發：

玩家狀態改變。

Player 不負責事件流程。

僅接受事件結果。

---

## Injury System

Injury 管理：

傷病。

Player 保存：

目前健康摘要。

完整病史由 Injury System 保存。

---

## Save System

Save System

負責：

Player State 的序列化與還原。

Player 不處理存檔流程。

---

## UI System

UI 透過 Player

快速取得：

目前狀態。

Player 不決定：

如何呈現資訊。
# Extension Guidelines

未來新增 Player 相關功能時，應先回答以下問題。

---

## Question 01

這項資料是否代表：

玩家「目前」的狀態？

如果不是，

就不應放入 Player。

---

## Question 02

是否已有其他 System 是真正的 Owner？

例如：

Relationship

↓

Relationship System

World

↓

World System

Insight

↓

Insight System

若答案是：

有。

Player 只應保存必要摘要。

---

## Question 03

這項資料是否需要保存完整歷史？

如果需要：

代表應建立自己的 System。

Player 不保存完整歷史。

---

## Question 04

如果移除 Player，

這項資料是否仍然存在？

如果答案是：

會。

代表：

它不屬於 Player。

例如：

World

Narrative

Relationship

Insight

Career History

都符合此原則。

---

# Common Mistakes

以下是 Player System 最容易發生的設計錯誤。

---

## Mistake 01

把所有資料都放進 Player。

例如：

```text
Player

├── Relationship
├── World
├── Insight
├── Narrative
├── Event
├── Match History
├── Career History
└── ...
```

這會使 Player 變成 God Object。

應避免。

---

## Mistake 02

Player 自己做判斷。

例如：

```text
if (player.age > 18)
    ...
```

應由：

Career System

決定。

Player 只保存：

目前結果。

---

## Mistake 03

Player 保存完整歷史。

例如：

所有比賽。

所有事件。

所有關係。

所有劇情。

這些資料都應交由各自 System 管理。

---

## Mistake 04

Player 同時成為 Data 與 Logic。

Player 只保存：

State。

真正的邏輯：

應存在於各自 System。

---

# Design Philosophy

Player System 的存在，

不是因為它是最重要的 System。

而是因為：

所有 System 都需要一個共同的參照點。

Player 應該像一本護照。

它記錄：

> 玩家目前是誰。

而不是：

> 玩家的一生。

真正的人生，

存在於：

- Identity
- Narrative
- Relationship
- Career
- Insight
- World

Player 只是目前人生的快照（Snapshot）。

因此：

Player 應保持精簡。

越大的專案，

越需要避免讓 Player 成為萬能容器。

Architecture 的目標不是：

讓 Player 保存最多資料。

而是：

讓每個 System 都擁有自己的責任，

彼此合作，

共同組成完整的人生模擬。

---

# Summary

Player System 回答的核心問題只有一個：

> 玩家現在處於什麼狀態？

除此之外，

任何「原因」、「歷史」、「意義」與「世界運作」，

都應由其他專屬 System 負責。

Player 是整個 Architecture 的共同參照點，

而不是整個 Architecture 本身。