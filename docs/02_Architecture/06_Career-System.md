# 06 Career System

Version: 2.0

---

# Purpose

Career System 負責管理玩家的人生階段（Career Stage）。

它描述：

玩家目前在人生中的位置，

以及世界因此如何回應玩家。

Career 並不是：

職業名稱。

也不是：

學校名稱。

Career 回答的是：

> 玩家現在正處於人生的哪一個階段？

例如：

- Rookie
- Bench Player
- Starting Player
- Team Leader
- Draft Prospect
- Professional Rookie
- Veteran
- Retirement Season

Career 決定：

世界對玩家的期待、

責任、

以及可接觸的人生內容。

---

# Responsibilities

Career System 負責管理：

- Career Stage（人生階段）
- Career Transition（階段轉換）
- Career Status（目前定位）
- Career Milestone（重要里程碑）
- Career Opportunity（可接觸機會）
- Career Responsibility（角色責任）
- Career Timeline（人生時間軸）

Career 不負責：

- 能力值
- 身分認同
- 人際關係
- 比賽流程
- 劇情意義

---

# Not Responsible

## Identity

Identity 回答：

我是誰。

Career 回答：

我目前在人生的哪個位置。

兩者不可混用。

---

## Narrative

Narrative 保存：

人生意義。

Career 保存：

人生階段。

Career 不解釋：

人生。

---

## Progression

能力如何成長。

由：

Progression System

管理。

Career 提供：

成長環境。

---

## Match

比賽如何進行。

由：

Match System

管理。

Career 不控制：

比賽內容。

---

## Relationship

Relationship 回答：

有哪些人陪伴玩家。

Career 回答：

玩家現在會遇見哪些人。

---

## World

World 提供：

棒球世界的規則。

Career 描述：

玩家目前位於世界中的位置。

---

# Core Concepts

Career 並不是：

一條固定路線。

Career 是：

人生不同階段的集合。

玩家可能：

高中畢業

↓

職棒

也可能：

高中

↓

大學

↓

社會人

↓

職棒

也可能：

受傷

↓

提早退休

↓

教練

Career System

不預設：

唯一的人生。

---

# Career Layer

Career 可分成四個層次。

```text
Stage

↓

Role

↓

Responsibility

↓

Legacy
```

---

## Stage

目前的人生階段。

例如：

- Little League
- Junior High
- High School
- University
- Professional
- Retirement

Stage

回答：

目前的人生位置。

---

## Role

目前扮演的角色。

例如：

- Rookie
- Starter
- Ace
- Captain
- Bench Player
- Mentor

即使同樣在：

High School。

不同 Role，

人生也完全不同。

---

## Responsibility

目前世界對玩家的期待。

例如：

新人：

努力學習。

隊長：

帶領隊友。

王牌：

承擔勝負。

老將：

培養下一代。

Responsibility

會影響：

事件、

NPC、

媒體、

世界反應。

---

## Legacy

Career 最後留下的影響。

例如：

- 球隊文化
- 後輩成長
- 球迷印象
- 歷史紀錄
- 傳奇故事

Legacy

代表：

Career 結束後，

仍然留下的職涯影響。

# Career Lifecycle

Career 並不是固定流程。

它會隨著玩家的人生持續演變。

生命週期如下：

```text
Career Entry

↓

Career Stage

↓

Career Opportunity

↓

Career Transition

↓

Career Milestone

↓

Career Legacy
```

Career 不只是：

時間推進。

真正推動 Career 的，

是：

玩家的選擇、

世界的回應、

以及人生中的重要事件。

---

# Career Entry

Career Entry

代表：

玩家正式進入某個人生階段。

例如：

- 加入少棒
- 升上青少棒
- 進入高中球隊
- 加入大學
- 參加選秀
- 加入職業球隊

Entry

不代表成功。

它只是：

新的開始。

---

# Career Opportunity

不同 Career Stage，

會開放不同的人生機會。

例如：

高中：

- 校隊先發競爭
- 木棒聯賽
- 升學選擇

大學：

- 全國賽
- 球探觀察
- 社團活動

職業：

- 一軍登錄
- 國家隊
- FA
- 海外挑戰

Opportunity

並不是：

一定發生。

而是：

玩家有資格接觸。

---

# Career Transition

Career 最重要的機制。

Transition

代表：

人生方向改變。

例如：

高中

↓

大學

高中

↓

直接選秀

高中

↓

社會人

高中

↓

放棄棒球

職業

↓

受傷復健

職業

↓

教練

Career

真正有趣的地方，

不是：

升級。

而是：

轉折。

---

# Career Milestone

Milestone

代表：

Career 的重要節點。

例如：

- 第一次先發
- 成為隊長
- 完成選秀
- 生涯百安
- 首座 MVP
- 千安
- 引退儀式

Milestone

不是：

能力。

而是：

職涯的重要紀錄。

---

# Career Timeline

Career 並不是：

單一路線。

它是一條：

可回顧的人生時間軸。

例如：

```text
Little League

↓

Junior High

↓

High School

↓

Draft

↓

Professional

↓

Veteran

↓

Retirement
```

Timeline

保存：

玩家真正走過的人生。

不是：

所有可能的人生。

---

# Career Paths

Career 應支援：

多種人生路徑。

例如：

```text
Little League

↓

Junior High

↓

High School

↓

Professional
```

也可能：

```text
Little League

↓

Junior High

↓

High School

↓

University

↓

Professional
```

也可能：

```text
Little League

↓

Junior High

↓

High School

↓

Company League

↓

Coach
```

Career System

不預設：

唯一正確的人生。

---

# Core Data

Career System

保存以下核心資料。

---

## Career Stage

目前人生階段。

---

## Career Role

目前扮演角色。

---

## Career Responsibility

目前世界期待。

---

## Career Opportunities

目前可接觸的人生機會。

---

## Career Milestones

已完成的重要職涯節點。

---

## Career Timeline

目前人生時間軸。

---

## Career Legacy

玩家最終留下的職涯影響。
# Lifecycle

Career 並不是固定劇本。

它是一段持續演化的人生歷程。

生命週期如下：

```text
Career Entry

↓

Career Stage

↓

Career Opportunity

↓

Career Transition

↓

Career Milestone

↓

Career Legacy
```

Career 不會自行推進。

只有當：

玩家、

世界、

事件、

共同改變人生時，

Career 才會進入下一個階段。

---

# Data Flow

Career 與其他 System 的資料流如下：

```text
World

↓

Event

↓

Player Choice

↓

Career Transition

↓

Career Stage Updated

↓

Career Opportunities Updated

↓

Future Events
```

Career 並不是：

遊戲的起點。

它是：

玩家人生選擇後，

形成的新狀態。

---

# Career Update Flow

Career 更新流程如下：

```text
Event Occurred

↓

Need Career Transition？

├── No
│
└── Yes
      ↓

Career Stage Updated

↓

Role Updated

↓

Responsibilities Updated

↓

Career Opportunities Updated

↓

Need Milestone？

├── No
│
└── Yes
      ↓

Career Milestone Added

↓

Future Events Updated
```

Career 並不因：

時間經過，

自動改變。

真正推動 Career 的，

是：

人生的重要轉折。

---

# Architecture Rules

Career System 必須遵守以下規則。

---

## Rule 01

Career 不保存能力。

能力，

由：

Progression System

管理。

Career 保存：

人生位置。

---

## Rule 02

Career 不保存人生意義。

人生意義，

由：

Narrative System

管理。

Career 保存：

人生階段。

---

## Rule 03

Career 必須允許多元路徑。

任何 Career Stage，

都不應只有：

唯一出口。

玩家的人生，

應具有：

多種可能。

---

## Rule 04

Career 必須反映世界期待。

Career 不只是：

玩家自己的狀態。

它同時代表：

世界如何看待玩家。

例如：

王牌、

新人、

隊長、

老將，

都會影響：

NPC、

媒體、

事件、

球迷。

---

## Rule 05

Career 必須具有不可逆節點。

部分 Milestone，

一旦完成，

便永久改變人生。

例如：

- 畢業
- 選秀
- 引退
- 首次職業登錄

這些事件，

應成為：

Career Timeline

的重要節點。

---

## Rule 06

Career 不保證向上發展。

人生可能：

晉升、

停滯、

降級、

轉職、

離開球場、

重新開始。

Career 不應假設：

所有玩家都會成功。

---

# Career Influence

Career

可能影響：

- Event Pool
- NPC Reaction
- Match Opportunity
- Media Attention
- Sponsorship
- Team Responsibility
- Training Resources
- Career Choices

Career

不直接控制：

上述系統。

而是：

提供世界回應的重要依據。

---

# Career Network

Career 並不是：

單一路徑。

它是一張：

人生網路。

例如：

```text
高中
│
├── 大學
│      │
│      └── 職棒
│
├── 選秀
│
├── 社會人
│      │
│      └── 職棒
│
└── 放棄棒球
       │
       └── 教練
```

每一條路徑，

都有不同的人生、

事件、

Relationship、

Narrative。

Career System

不定義：

哪條路最好。

它只保存：

玩家真正走過的人生。
## Progression System

Progression 管理：

能力如何成長。

Career 提供：

能力成長的環境。

例如：

成為一軍球員，

可能開放：

更高強度的訓練。

真正增加能力，

仍由：

Progression System

處理。

---

## Relationship System

Relationship 管理：

玩家與其他角色的人生連結。

Career 決定：

玩家目前最容易建立哪些關係。

例如：

新人：

容易建立 Mentor Relationship。

隊長：

容易建立 Teammate Relationship。

老將：

容易建立 Legacy Relationship。

---

## Narrative System

Narrative 管理：

人生的意義。

Career 管理：

人生目前的位置。

同樣是：

退休。

Career 保存：

已進入 Retirement Stage。

Narrative 保存：

退休對玩家代表什麼。

---

## Match System

Match 提供：

競技內容。

Career 決定：

玩家能參與哪些層級、

哪些重要比賽、

承擔什麼角色。

Career 不控制：

比賽結果。

---

## World System

World 提供：

社會、

聯盟、

制度、

文化。

Career 則決定：

玩家目前如何存在於這個世界。

不同 Career，

世界會給予不同期待。

---

## Save System

Save System

負責：

Career Data、

Career Timeline、

Career Milestones、

Career Legacy

的保存與還原。

Career 不負責：

存檔流程。

---

## UI System

UI 負責呈現：

- Career Stage
- Career Role
- Career Timeline
- Career Milestones
- Career Legacy

Career 不決定：

介面呈現方式。

---

# Extension Guidelines

新增 Career 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

人生階段，

還是：

能力？

若屬於：

能力。

應加入：

Progression。

不是：

Career。

---

## Question 02

新增的是：

人生位置，

還是：

人生意義？

人生位置：

Career。

人生意義：

Narrative。

請勿混用。

---

## Question 03

是否真正改變：

玩家的人生角色？

如果沒有，

通常不需要建立：

Career Transition。

---

## Question 04

是否會改變：

世界對玩家的期待？

若答案是否，

通常不是：

Career 的責任。

---

## Question 05

是否會影響：

未來人生機會？

若完全沒有，

應重新評估：

是否需要成為 Career Milestone。

---

# Common Mistakes

以下是 Career 最常見的設計錯誤。

---

## Mistake 01

Career 等於職業。

錯誤。

Career 是：

人生階段。

不是：

工作名稱。

---

## Mistake 02

Career 等於年級。

錯誤。

同樣高中三年級，

可能是：

板凳、

先發、

王牌、

隊長。

Career 保存：

人生角色。

不是：

年級。

---

## Mistake 03

Career 一定向上發展。

錯誤。

人生可能：

停滯、

轉向、

中斷、

重新開始。

Career 不預設：

成功路線。

---

## Mistake 04

Career 直接決定事件。

錯誤。

Career 提供：

事件發生的背景。

真正觸發事件，

由：

Event System

負責。

---

## Mistake 05

Career 結束代表人生結束。

錯誤。

球員 Career

只是人生的一部分。

引退後，

仍可能成為：

教練、

球探、

家長、

經營者、

甚至完全離開棒球。

Career 應支援：

多段人生。

---

# Design Philosophy

Career 並不是一張履歷。

它是一個人，

在人生不同階段所扮演的角色。

同樣穿著球衣，

新人與老將，

肩負的責任完全不同。

同樣站在球場，

隊長與替補，

面對的世界也不同。

Career 的價值，

不在於：

走到了哪個層級。

而在於：

在每一個人生階段，

玩家選擇成為什麼樣的人。

真正值得記住的，

不是一路晉升。

而是：

那些在人生轉折中，

依然堅持前進的選擇。

Career 不定義成功。

它保存：

玩家真正走過的人生軌跡。

---

# Summary

Career System 回答的核心問題只有一個：

> 我現在正處於人生的哪一個階段？

它不是：

升級系統。

不是：

職業系統。

不是：

時間軸。

它負責：

描述玩家目前的人生位置、

開放不同的人生機會、

承擔不同的責任、

並保存整段職涯的發展歷程。

當玩家多年後回顧自己的生涯時，

真正留下來的，

不只是曾經達到的高度。

而是：

在每一個人生階段，

曾經扮演過什麼角色，

以及留下了什麼影響。