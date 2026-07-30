# 09 Decision System

Version: 2.0

---

# Purpose

Decision System 負責管理玩家與 NPC 的決策（Decision）。

它描述：

角色如何根據：

自己的身份、
目標、
關係、
環境、
狀態，

做出人生中的選擇。

Decision 並不是：

選單系統。

也不是：

UI 按鈕。

Decision 回答的是：

> 為什麼角色會做出這個選擇？

而不是：

> 玩家點了哪一個按鈕？

真正的決策，

發生在角色心中。

UI，

只是讓玩家表達這個決策。

---

# Responsibilities

Decision System 負責管理：

- Decision Context（決策情境）
- Decision Factors（決策因素）
- Decision Options（可選方案）
- Decision Evaluation（決策評估）
- Decision Commitment（做出決定）
- Decision Consequence（決策後果）

Decision 不負責：

- 事件內容
- 劇情意義
- 能力成長
- 人際關係
- 比賽流程
- 世界規則

---

# Not Responsible

## Event

Event 管理：

發生了什麼。

Decision 管理：

角色如何回應。

同一個 Event，

不同角色，

可能做出完全不同的 Decision。

---

## Narrative

Narrative 管理：

角色如何理解自己的選擇。

Decision 管理：

角色如何做出選擇。

Decision

不保存：

人生意義。

---

## Progression

Progression 管理：

能力如何改變。

Decision 管理：

角色是否選擇：

訓練、

休息、

改變方向、

接受挑戰。

真正能力改變，

仍由：

Progression

處理。

---

## Relationship

Relationship 管理：

人物之間的連結。

Decision

可能受到 Relationship 影響。

但不保存：

Relationship。

---

## Career

Career 管理：

玩家目前的人生位置。

Decision

決定：

是否接受新的 Career Opportunity。

Career

不替玩家做決定。

---

## Match

Match 管理：

競技中的決策。

Decision

管理：

人生中的決策。

例如：

是否加入球隊、

是否接受手術、

是否出國、

是否退休。

Match Decision

屬於：

Match。

Life Decision

屬於：

Decision。

---

# Core Concepts

Decision

不是：

選項。

Decision

是一個角色，

根據自己的價值觀、

處境、

目標，

所做出的判斷。

因此，

Decision

必須具有：

角色一致性。

相同的人，

在不同人生階段，

可能做出不同決定。

不同的人，

即使面對同一事件，

也可能做出不同選擇。

---

# Decision Layer

Decision 可分成六個層次。

```text
Context

↓

Motivation

↓

Evaluation

↓

Decision

↓

Action

↓

Consequence
```

---

## Context

Decision 發生時，

角色目前所處的情境。

例如：

- 家庭經濟
- 球隊需求
- 傷勢
- 學業
- 時間限制
- 比賽壓力

Context

提供：

決策背景。

---

## Motivation

Motivation

代表：

角色真正重視的事情。

例如：

- 成為職業球員
- 保護家人
- 贏得冠軍
- 證明自己
- 穩定收入
- 享受棒球

不同 Motivation，

會產生：

不同 Decision。

---

## Evaluation

Evaluation

代表：

角色如何衡量每個選項。

例如：

可能考慮：

- 風險
- 收益
- 時間成本
- 人際影響
- 長期發展
- 當下需求

不同角色，

Evaluation

標準不同。

---

## Decision

Decision

代表：

角色真正做出的選擇。

Decision

一旦完成，

通常具有：

不可逆性、

或產生成本。

---

## Action

Decision

並不等於：

事情已經完成。

Decision

之後，

角色開始行動。

例如：

決定接受手術，

真正手術，

屬於：

Action。

---

## Consequence

任何 Decision，

都應產生：

結果。

結果可能：

立即發生、

延遲發生、

甚至多年後才出現。

Decision

真正重要的，

不是：

是否正確。

而是：

是否願意承擔 Consequence。
# Decision Lifecycle

Decision 並不是：

看到選項，

立即選擇。

真正的決策，

是一段理解、

衡量、

承擔的過程。

生命週期如下：

```text
Context

↓

Motivation

↓

Constraint

↓

Evaluation

↓

Decision

↓

Action

↓

Consequence
```

真正影響 Decision 的，

並不只是：

想要什麼。

還包括：

目前真正擁有哪些可能性。

---

# Decision Context

Decision Context

代表：

角色目前所處的人生情境。

例如：

- 年齡
- 家庭
- 經濟
- 球隊
- 傷勢
- 學業
- 時間
- 人際關係

Context

回答：

> 我現在正面對什麼？

---

# Motivation

Motivation

代表：

角色真正追求的目標。

例如：

- 成為職業球員
- 贏得冠軍
- 保護家人
- 穩定收入
- 享受棒球
- 證明自己

Motivation

回答：

> 我真正想得到什麼？

---

# Constraint

Constraint

代表：

目前限制角色的因素。

例如：

- 家庭經濟
- 能力不足
- 年齡限制
- 規則限制
- 傷勢
- 合約
- 時間
- 學業
- 人際壓力

Constraint

並不是：

懲罰。

它只是：

真實人生的限制。

真正的 Decision，

永遠發生在：

有限的可能性中。

---

# Evaluation

Evaluation

代表：

角色開始比較：

不同選項。

例如：

考慮：

- 成本
- 風險
- 收益
- 時間
- 長期發展
- 對家人的影響
- 對 Career 的影響

不同角色，

Evaluation

可能完全不同。

---

# Decision Weight

Decision

並不是：

所有選項都一樣重要。

Decision Weight

代表：

這次 Decision

對人生的重要程度。

例如：

### Minor

例如：

今天是否加練。

---

### Medium

例如：

是否接受新的守備位置。

---

### Major

例如：

是否參加選秀。

---

### Life Decision

例如：

是否退休、

是否放棄棒球、

是否接受重大手術。

Decision Weight

將影響：

後續 Event、

Narrative、

Career、

Relationship。

---

# Decision Commitment

Commitment

代表：

角色真正投入自己的選擇。

有些 Decision，

可以反悔。

例如：

今天取消加練。

有些 Decision，

則幾乎不可逆。

例如：

接受手術、

簽下職業合約、

正式退休。

Decision

不只是：

做出選擇。

還包含：

是否願意承擔選擇。

---

# Core Data

Decision System

保存以下核心資料。

---

## Decision Context

目前決策背景。

---

## Motivation

角色目前最重要的目標。

---

## Constraints

目前限制。

---

## Evaluation

角色評估過程。

---

## Decision

真正做出的選擇。

---

## Commitment

角色投入程度。

---

## Decision Weight

此次 Decision

的重要程度。
# Lifecycle

Decision 並不是：

看到選項，

立即做出選擇。

真正的決策，

是一個不斷權衡、

修正、

承擔的過程。

生命週期如下：

```text
Context

↓

Motivation

↓

Constraint

↓

Decision Lens

↓

Evaluation

↓

Decision

↓

Action

↓

Consequence
```

Decision 完成後，

角色的人生，

也開始改變。

---

# Data Flow

Decision 與其他 System 的資料流如下：

```text
Identity
        │
Relationship
        │
Career
        │
Condition
        │
World
        │
Event
        │
        ▼
Decision Context
        │
        ▼
Decision
        │
        ├── Event
        ├── Career
        ├── Relationship
        ├── Narrative
        └── Progression
```

Decision

本身並不改變世界。

它只是：

啟動改變。

真正更新，

由其他 System

各自負責。

---

# Decision Update Flow

Decision 更新流程如下：

```text
Decision Triggered

↓

Build Context

↓

Generate Available Options

↓

Apply Constraints

↓

Evaluate Options

↓

Player / NPC Decision

↓

Generate Action

↓

Notify Other Systems
```

Decision

永遠先於：

Action。

Action

永遠先於：

Consequence。

---

# Architecture Rules

Decision System 必須遵守以下規則。

---

## Rule 01

Decision 必須具有成本。

真正重要的 Decision，

不應沒有代價。

成本可能包括：

- 時間
- 金錢
- 關係
- 體力
- Career Opportunity
- 未來可能性

沒有成本，

通常不是：

真正的 Decision。

---

## Rule 02

Decision 必須受到 Constraint。

角色不能：

永遠自由選擇。

限制，

是真實人生的重要組成。

---

## Rule 03

Decision 必須允許延遲後果。

有些 Consequence，

立即出現。

有些，

數年後才發生。

Decision

不應只產生：

短期影響。

---

## Rule 04

Decision 必須具有一致性。

角色的選擇，

應符合：

Identity、

Motivation、

Relationship、

目前人生階段。

除非：

世界真的改變了角色。

---

## Rule 05

Decision 不保證最佳解。

真實人生，

不存在：

永遠正確的答案。

Decision

只代表：

角色願意承擔哪一種人生。

---

## Rule 06

Decision 應保留放棄成本。

玩家可以：

放棄。

但放棄，

也是一種 Decision。

例如：

放棄選秀、

放棄復健、

放棄戀愛、

放棄隊長。

未選擇的路，

也可能成為：

未來 Narrative 的一部分。

---

# Decision Lens

Decision Lens

代表：

角色目前優先使用的判斷視角。

同一件事情，

不同 Lens，

可能得到完全不同的 Decision。

---

## Dream Lens

優先考慮：

夢想、

理想、

挑戰、

成就。

例如：

「我想挑戰更高層級。」

---

## Security Lens

優先考慮：

穩定、

風險、

家庭、

收入。

例如：

「現在不能冒這個險。」

---

## Relationship Lens

優先考慮：

他人的期待、

承諾、

情感連結。

例如：

「我不想讓教練失望。」

---

## Growth Lens

優先考慮：

是否有助於：

學習、

突破、

長期成長。

例如：

「即使失敗，

我也能學到東西。」

---

## Survival Lens

優先考慮：

目前是否能撐下去。

例如：

傷勢、

經濟、

心理壓力。

此時，

角色可能放棄：

長期利益，

換取：

短期生存。

---

# Decision Influence

Decision

可能影響：

- Event
- Career Transition
- Relationship State
- Narrative Direction
- Progression
- World Response

Decision

並不直接控制：

上述系統。

它只是：

改變人生方向的起點。
## Event System

Event 管理：

人生發生了哪些事情。

Decision 提供：

角色如何回應事件。

例如：

同樣收到選秀邀請。

有人接受。

有人拒絕。

有人選擇升學。

真正產生不同人生，

來自：

Decision。

---

## Narrative System

Narrative 管理：

角色如何理解自己的選擇。

Decision 保存：

角色做出的判斷。

例如：

放棄棒球。

Decision 保存：

放棄。

Narrative 保存：

多年後，

角色如何看待這個決定。

---

## Relationship System

Relationship 管理：

人物之間的連結。

Decision

可能改變：

信任、

尊敬、

依賴、

衝突。

真正更新：

Relationship，

由：

Relationship System

處理。

---

## Career System

Career 管理：

人生目前的位置。

Decision

可能改變：

Career Opportunity、

Career Stage、

Career Direction。

Career

負責保存：

人生新的位置。

---

## Progression System

Progression 管理：

人成長。

Decision

可能改變：

訓練方向、

學習方式、

Development Path。

真正能力改變，

仍由：

Progression

負責。

---

## Match System

Match 管理：

競技中的表現。

Decision

管理：

競技之外的人生選擇。

例如：

是否接受手術。

是否轉守備位置。

是否挑戰旅外。

真正上場後，

由：

Match

處理競技內容。

---

## World System

World 提供：

制度、

文化、

規則、

社會環境。

Decision

永遠發生在：

World

建立的限制下。

世界，

決定：

有哪些可能。

Decision，

決定：

角色選擇哪一條路。

---

## Save System

Save System

負責保存：

- Decision History
- Major Decisions
- Decision Weight
- Decision Commitment

Decision

不負責：

存檔流程。

---

## UI System

UI 負責呈現：

- 選項
- 決策背景
- 可能成本
- 已做出的選擇

Decision

不決定：

介面呈現方式。

---

# Extension Guidelines

新增 Decision 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

新的選項，

還是：

新的決策方式？

若只是：

改變思考過程。

應優先擴充：

Decision Lens、

Evaluation、

Constraint。

---

## Question 02

是否真正需要：

角色做出取捨？

如果沒有取捨，

通常不是：

Decision。

---

## Question 03

是否存在：

成本？

若沒有任何成本，

請重新評估：

是否需要建立：

Decision。

---

## Question 04

是否會改變：

角色未來的人生方向？

若完全沒有，

通常只是一個：

Action。

不是：

Decision。

---

## Question 05

是否值得：

多年後仍被角色記住？

若答案是否，

應重新評估：

Decision Weight。

---

# Common Mistakes

以下是 Decision 最常見的設計錯誤。

---

## Mistake 01

Decision 等於按按鈕。

錯誤。

UI

只是：

輸入方式。

Decision

是真正的角色判斷。

---

## Mistake 02

所有玩家都看到相同選項。

錯誤。

Context、

Constraint、

Relationship、

Career、

World，

都可能改變：

Available Options。

---

## Mistake 03

Decision 一定有正確答案。

錯誤。

真正的人生，

通常只有：

不同代價。

沒有：

唯一最佳解。

---

## Mistake 04

Decision 立即產生所有後果。

錯誤。

有些 Consequence，

多年後，

才真正出現。

Decision

應支援：

延遲回報。

---

## Mistake 05

放棄不是 Decision。

錯誤。

拒絕、

等待、

沉默、

退出，

都可能是：

最重要的 Decision。

---

# Design Philosophy

Decision 並不是：

讓玩家找到最好的答案。

它真正存在的目的，

是讓玩家願意選擇，

並承擔選擇帶來的人生。

每一次 Decision，

都會關閉一些可能，

也會開啟新的道路。

有些選擇，

當下看似正確。

多年後，

卻留下遺憾。

有些選擇，

當下充滿痛苦。

多年後，

卻成為人生最大的轉折。

真正重要的，

從來不是：

是否選對。

而是：

當角色做出選擇後，

是否願意承擔它，

並繼續走下去。

Decision 保存的，

不是答案。

而是：

角色面對人生時，

一次又一次做出的選擇。

---

# Summary

Decision System 回答的核心問題只有一個：

> 我為什麼做出這個選擇？

它不是：

選單系統。

不是：

事件系統。

不是：

劇情系統。

它負責：

建立決策情境、

分析限制與動機、

提供真正具有取捨的選擇、

記錄角色的決定、

並將結果交給其他系統，

共同塑造玩家的人生。

每一次 Decision，

都不只是改變劇情。

更是在定義：

玩家想成為什麼樣的人。