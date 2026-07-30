# Architecture Bible

Version:

2.0

---

# Overview

Architecture Bible

不是：

README。

也不是：

System Documentation。

它描述的是：

《棒球人生》

整體 Architecture。

回答：

> 《棒球人生》的世界，是如何被建構出來的？

這份文件，

不解釋：

某一個 System

如何運作。

而是：

說明：

所有 System

如何共同形成：

同一個世界。

---

# Architecture Goal

《棒球人生》

不是：

一連串事件。

不是：

一組能力值。

不是：

一套比賽規則。

Architecture

真正希望建立的是：

```text
一個會持續運作的世界。

一位生活在其中的球員。

一段逐漸累積的人生。
```

所有 System

都不是：

獨立存在。

而是：

共同描述：

同一段人生。

---

# World View

整個遊戲，

建立在：

三個層次。

```text
World

↓

Life

↓

Experience
```

---

## World

World

代表：

玩家生活的世界。

包含：

- 棒球環境
- 球隊
- 聯盟
- 人物
- 社會
- 時間

世界：

不因玩家存在，

才開始運作。

玩家：

只是：

其中的一份子。

---

## Life

Life

代表：

玩家的人生。

人生：

由：

選擇、

關係、

成長、

失敗、

成功、

遺憾

共同形成。

Architecture

描述的是：

人生。

不是：

能力值。

---

## Experience

Experience

代表：

玩家如何理解：

自己的人生。

Experience

不是：

資料。

而是：

玩家透過：

UI、

Narrative、

Feedback

逐漸理解：

自己走過了什麼。

---

# Core Architecture

整個 Architecture

可以理解成：

```text
Reality

↓

Interpretation

↓

Decision

↓

Consequence

↓

Memory

↓

Life
```

每一層，

都有：

不同的 System

負責。

不要：

互相取代。

---

## Reality

Reality

是真正發生的世界。

例如：

- 今天進行訓練
- 比賽結束
- 身體疲勞
- 教練觀察
- 球隊補強

Reality

不是：

玩家看到的畫面。

也不是：

角色的想法。

---

## Interpretation

不同角色，

會根據：

自己的資訊，

理解：

Reality。

例如：

教練、

隊友、

媒體、

玩家

都可能：

得到：

不同結論。

Architecture

允許：

不同 Interpretation

同時存在。

---

## Decision

玩家：

根據：

自己理解，

做出：

選擇。

Decision

代表：

玩家的意志。

不是：

結果。

---

## Consequence

世界：

根據：

Reality

與

Decision

共同產生：

後果。

後果：

可能：

立即。

也可能：

多年後。

---

## Memory

世界

會記住：

真正重要的事情。

例如：

第一次升上一軍。

第一次受傷。

第一次被信任。

Memory

讓：

人生：

具有：

連續性。

---

## Life

玩家

最後記住的，

不是：

某一天。

而是：

整段人生。

Architecture

所有 System

共同形成：

Life。

---

# Architecture Philosophy

整個世界，

建立於：

五個核心理念。

---

## Reality Before Story

世界：

先運作。

故事：

再形成。

不是：

先決定劇情。

再安排世界。

---

## Choice Before Outcome

玩家：

只能控制：

選擇。

不能控制：

結果。

真正重要的是：

Decision。

不是：

最佳解。

---

## Consequence Before Reward

世界

不會：

因為：

玩家努力，

立即給予獎勵。

Architecture

允許：

努力、

失敗、

等待、

回報

跨越：

很長時間。

---

## Responsibility Before Convenience

每個 System

都應：

堅守：

自己的責任。

不要：

因為方便，

侵入：

其他 System。

---

## Consistency Before Features

新增玩法，

永遠：

不能：

破壞：

Architecture。

Architecture

比：

功能，

更重要。

---

# Architecture Layers

整個世界，

由：

四個 Layer

共同組成。

```text
Foundation

↓

Gameplay

↓

Infrastructure

↓

Presentation
```

每個 Layer，

回答：

不同問題。

---

## Foundation

回答：

```text
我是誰？
```

建立：

玩家。

身份。

目前狀態。

---

## Gameplay

回答：

```text
世界如何運作？
```

建立：

人生。

關係。

事件。

職業。

比賽。

教練。

組織。

世界。

---

## Infrastructure

回答：

```text
如何讓人生持續存在？
```

負責：

Save。

Persistence。

---

## Presentation

回答：

```text
玩家如何理解世界？
```

負責：

UI。

Presentation。

Feedback。

# System Collaboration

Architecture

不是：

十六個獨立的 System。

而是：

十六個 System，

共同描述：

同一個世界。

每個 System

都只負責：

自己的真相。

所有 System

共同形成：

玩家的人生。

---

# Foundation Systems

Foundation

建立：

玩家本身。

回答：

```text
我是誰？
```

包含：

```text
Player

Identity

Current State
```

---

## Player

Player

定義：

角色本身。

包含：

- 基本資料
- 身分
- 永久資訊
- 唯一身份

Player

回答：

```text
我是誰？
```

---

## Identity

Identity

定義：

玩家如何理解：

自己。

包含：

- 理想形象
- 自我定位
- 價值觀
- 長期目標

Identity

回答：

```text
我想成為誰？
```

---

## Current State

Current State

定義：

角色目前：

身心狀態。

例如：

疲勞、

壓力、

健康、

信心。

Current State

回答：

```text
我現在怎麼樣？
```

---

# Gameplay Systems

Gameplay

建立：

人生。

回答：

```text
世界如何運作？
```

包含：

```text
Narrative

Relationship

Event

Decision

Career

Match

Progression

Coach

Organization

World Simulation

Injury
```

---

## Narrative

Narrative

建立：

人生的意義。

不是：

事件本身。

回答：

```text
我的人生，
代表什麼？
```

---

## Relationship

Relationship

建立：

人物之間：

長期累積的關係。

回答：

```text
我與他人，
變成了什麼關係？
```

---

## Event

Event

建立：

世界發生：

什麼事情。

回答：

```text
今天，
發生了什麼？
```

---

## Decision

Decision

建立：

玩家的選擇。

回答：

```text
我決定怎麼做？
```

---

## Career

Career

建立：

棒球生涯。

回答：

```text
我的職業，
如何發展？
```

---

## Match

Match

建立：

比賽。

回答：

```text
今天，
比賽發生了什麼？
```

---

## Progression

Progression

建立：

長期成長。

回答：

```text
我如何慢慢變強？
```

---

## Coach

Coach

建立：

專業觀察。

回答：

```text
專業人士，
如何看待我？
```

---

## Organization

Organization

建立：

制度決策。

回答：

```text
球隊，
如何做決定？
```

---

## World Simulation

World Simulation

建立：

玩家之外：

仍然運作的世界。

回答：

```text
沒有玩家時，
世界發生什麼？
```

---

## Injury

Injury

建立：

身體限制。

回答：

```text
我的身體，
允許我做到什麼？
```

---

# Infrastructure System

Infrastructure

建立：

跨時間能力。

回答：

```text
如何保存人生？
```

包含：

```text
Save
```

Save

負責：

Persistence。

不是：

Gameplay。

---

# Presentation System

Presentation

建立：

玩家體驗。

回答：

```text
玩家如何理解世界？
```

包含：

```text
UI
```

UI

負責：

Presentation。

不是：

Gameplay。

---

# System Relationships

Architecture

不是：

直線流程。

而是：

合作網路。

例如：

```text
Decision

↓

Event

↓

Current State

↓

Coach

↓

Organization

↓

Career

↓

Narrative
```

另一種可能：

```text
Match

↓

Injury

↓

Current State

↓

Relationship

↓

Narrative
```

Architecture

允許：

多條路徑，

共同形成：

人生。

---

# Information Flow

所有資訊，

都遵守：

同一方向。

```text
Reality

↓

System Processing

↓

State Change

↓

Presentation

↓

Player Understanding
```

不要：

跳過：

任何一層。

例如：

UI

不要：

直接修改：

Reality。

---

# Responsibility Network

每個 System，

都有：

自己的責任。

例如：

```text
Player

↓

Identity

↓

Decision

↓

Event

↓

Relationship

↓

Narrative
```

這不是：

控制。

而是：

合作。

每個 System，

只處理：

自己的問題。

---

# Shared World

所有 System

共享：

同一個世界。

不是：

各自建立：

自己的世界。

例如：

Coach

看到的球員，

就是：

Player。

Organization

管理的球員，

也是：

Player。

Narrative

描述的人生，

也是：

Player。

世界：

只有：

一份。

所有 System，

共同描述：

同一份 Reality。

---

# Architecture Contract

所有 System，

共同遵守：

以下契約。

```text
One Responsibility

↓

One Source of Truth

↓

Shared Reality

↓

Independent Logic

↓

Collaborative World
```

任何新 System，

都應：

遵守：

這份契約。

不要：

破壞：

既有 Responsibility。

# Architecture Flow

Architecture

不是：

一條固定流程。

而是一個：

持續運作的生命循環。

玩家：

每天，

都會重新開始：

一次新的循環。

每一次循環，

都會：

留下：

長期影響。

---

# Daily Life Cycle

《棒球人生》

最基本的循環：

如下。

```text
Current State

↓

Decision

↓

Event

↓

World Response

↓

Relationship

↓

Coach

↓

Organization

↓

Career

↓

Narrative

↓

Save

↓

Next Day
```

每一天，

都不是：

重新開始。

而是：

建立在：

昨天的人生。

---

# Architecture Flow

玩家的人生，

可以理解成：

```text
Reality

↓

State

↓

Decision

↓

Simulation

↓

Consequence

↓

Memory

↓

Life
```

Architecture

真正管理的是：

這條 Flow。

不是：

某一個 Function。

---

# State Flow

所有 Gameplay，

都建立於：

State。

```text
Player State

↓

Current State

↓

Gameplay Systems

↓

New State

↓

Save
```

任何 System，

都應：

讀取：

State。

並產生：

新的 State。

不要：

直接修改：

其他 System

內部資料。

---

# Decision Flow

Decision

只回答：

```text
玩家想做什麼？
```

Decision

不回答：

```text
結果如何？
```

真正的流程：

```text
Decision

↓

Gameplay Simulation

↓

Consequence
```

這代表：

相同 Decision，

可以：

得到：

不同 Consequence。

---

# World Response

世界：

永遠：

先回應。

玩家：

再理解。

例如：

```text
玩家加練

↓

身體疲勞

↓

教練觀察

↓

隊友反應

↓

球隊評估

↓

玩家理解
```

世界

不是：

等待：

玩家看見，

才開始運作。

---

# Long-Term Accumulation

Architecture

不是：

每天重置。

而是：

每天累積。

例如：

```text
今天努力

↓

一週後

↓

教練開始注意

↓

半年後

↓

固定先發

↓

多年後

↓

職業生涯改變
```

真正重要的是：

累積。

不是：

立即獎勵。

---

# Information Layers

Architecture

存在：

四種資訊。

---

## Reality

真正發生的事情。

例如：

```text
能力

疲勞

傷病

比賽內容
```

---

## Interpretation

不同角色，

如何理解：

Reality。

例如：

Coach。

Organization。

Player。

---

## Presentation

UI

如何呈現：

Interpretation。

不是：

Reality

本身。

---

## Experience

玩家：

真正感受到的人生。

Experience

永遠：

不是：

資料。

---

# Data Ownership

每份資料，

只有：

一位 Owner。

例如：

```text
Player

↓

Player Data
```

```text
Relationship

↓

Relationship Data
```

```text
Coach

↓

Evaluation
```

其他 System，

只能：

透過 Interface

合作。

不要：

建立：

第二份真相。

---

# Cross-System Communication

System

不直接：

控制彼此。

而是：

透過：

資料合作。

例如：

```text
Decision

↓

Event

↓

Relationship

↓

Narrative
```

Decision

不知道：

Narrative

如何描述。

Narrative

也不知道：

Decision

如何形成。

彼此：

只共享：

結果。

---

# Time

時間

不是：

某一個 System。

時間：

存在於：

所有 System。

例如：

```text
Current State

每天改變
```

```text
Relationship

逐漸累積
```

```text
Career

多年演化
```

```text
Narrative

持續形成
```

所有 System，

都共同生活在：

同一條時間軸。

---

# Architecture Principles

所有 System，

共同遵守：

以下原則。

---

## Independent Responsibility

每個 System，

只負責：

自己的問題。

---

## Shared Reality

所有 System，

共享：

同一份世界。

不是：

建立：

自己的版本。

---

## Delayed Consequence

Architecture

允許：

後果：

跨越：

很長時間。

不要：

強迫：

立即回饋。

---

## Progressive Understanding

玩家：

不是：

一次知道：

全部資訊。

理解：

應：

逐漸建立。

---

## Stable Architecture

新增玩法，

不應：

修改：

Architecture。

新增：

System。

也應：

遵守：

既有原則。

---

# Failure Handling

失敗，

不是：

Architecture

例外。

而是：

Architecture

的一部分。

例如：

受傷。

落選。

低潮。

交易。

退休。

都應：

自然發生。

不是：

特殊 Case。

---

# Complete Life

Architecture

真正希望形成：

不是：

一場比賽。

不是：

一個事件。

而是：

```text
很多 Decision

↓

很多 Consequence

↓

很多 Memory

↓

一段完整人生
```

玩家：

最後記住的，

不是：

能力值。

而是：

自己，

曾經走過：

怎樣的人生。

# Architecture Evolution

Architecture

不是：

完成後，

永遠固定。

Architecture

應：

持續演化。

但是：

演化，

不代表：

責任改變。

也不代表：

邊界消失。

Architecture

真正保護的是：

世界的一致性。

不是：

目前的程式。

---

# Stable Core

整個 Architecture

可分為：

兩個部分。

```text
Stable Core

↓

Evolving Systems
```

---

## Stable Core

Stable Core

代表：

不應輕易改變的原則。

例如：

```text
One Responsibility

One Source of Truth

State ≠ Logic

Presentation ≠ Gameplay

Reality ≠ Interpretation

Choice ≠ Result
```

這些原則，

是整個世界：

共同遵守的法則。

---

## Evolving Systems

System

可以：

持續演化。

例如：

Coach

增加：

新的觀察模型。

Organization

增加：

更多制度。

Narrative

增加：

更多記憶形成方式。

只要：

Responsibility

沒有改變。

Architecture

仍然成立。

---

# Architecture Review

每一次：

新增功能。

都應：

先進行：

Architecture Review。

不要：

直接：

開始實作。

Review

應回答：

```text
新增功能，

屬於哪一個 System？
```

如果：

回答不了。

代表：

Architecture

尚未清楚。

---

# Feature Integration

新增功能，

建議流程：

```text
Idea

↓

Architecture Review

↓

System Design

↓

Prototype

↓

Playtest

↓

Architecture Review

↓

Implementation
```

Architecture

應：

走在：

Implementation

之前。

---

# When to Create a New System

不要：

因為：

新增功能，

就新增：

System。

只有：

當新的功能，

回答：

一個全新的核心問題，

才建立：

新的 System。

例如：

```text
Media

回答：

社會如何看待球員？
```

```text
Family

回答：

家庭如何影響人生？
```

```text
Fan

回答：

球迷如何改變職業生涯？
```

如果：

只是：

Coach

增加：

新能力。

不要：

建立：

Coach 2。

---

# Architecture Checklist

任何：

Architecture

修改前，

請確認：

```text
□ Responsibility 是否改變？

□ Source of Truth 是否唯一？

□ 是否新增第二份資料？

□ 是否破壞 Layer？

□ 是否影響 Save？

□ 是否影響 UI？

□ 是否需要 Migration？

□ 是否維持共同語言？
```

若：

其中任何一項，

無法回答。

不要：

修改 Architecture。

---

# Prototype Philosophy

Prototype

不是：

驗證：

功能。

而是：

驗證：

Architecture。

Prototype

真正回答的是：

```text
這個世界，

真的能運作嗎？
```

例如：

Decision

是否：

真的只是：

Decision？

Coach

是否：

真的不知道：

Reality？

Organization

是否：

真的透過制度，

做出決策？

Narrative

是否：

真的只是：

人生意義？

Prototype

應：

優先驗證：

Responsibility。

不是：

內容量。

---

# Long-Term Development

Architecture

應：

允許：

未來加入：

```text
Media

Fan

Finance

Family

Agent

Sponsor

International League

National Team
```

新增：

System

時，

不應：

重寫：

既有 System。

而是：

加入：

新的合作關係。

---

# Documentation

Documentation

不是：

專案完成後，

才更新。

Documentation

本身，

就是：

Architecture。

Architecture

改變。

Documentation

也必須：

同步改變。

不要：

讓：

程式，

與文件，

描述：

兩個不同的世界。

---

# Collaboration

任何協作者，

都應：

遵守：

相同原則。

Architecture

不是：

個人的理解。

而是：

團隊：

共同遵守的契約。

討論：

應：

從：

Architecture

開始。

不是：

從：

程式開始。

---

# Design Philosophy

Architecture

真正保護的，

不是：

Code。

不是：

Class。

不是：

Function。

Architecture

保護的是：

《棒球人生》

這個世界。

世界：

可以：

持續成長。

可以：

加入：

更多人物。

更多聯盟。

更多制度。

更多故事。

但是：

玩家，

永遠感受到：

同一個世界。

---

# Final Summary

Architecture Bible

不是：

System 的集合。

而是：

一套：

描述世界、

維持世界、

演化世界

的方法。

所有 System，

共同遵守：

相同原則。

共同維護：

同一份 Reality。

共同形成：

玩家的一段人生。

Architecture

存在的目的，

不是：

限制開發。

而是：

讓未來十年的開發，

仍然描述：

同一個《棒球人生》。

---

# Closing Statement

如果：

有一天，

《棒球人生》

擁有：

數百位球員。

數千位 NPC。

完整職業聯盟。

多國賽事。

家庭、

媒體、

球迷、

經紀人、

商業合作。

Architecture

仍然應該回答：

同一個問題。

> 世界如何自然運作？

而不是：

> 程式如何完成這個功能？

因為：

玩家，

真正記住的，

從來不是：

哪一段程式。

而是：

自己，

在這個世界，

度過了一段值得回憶的棒球人生。