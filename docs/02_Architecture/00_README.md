# Baseball Life Architecture Bible

Version:

2.0

---

# Preface

歡迎閱讀：

《棒球人生》

Architecture Bible。

這不是：

程式設計教學。

不是：

API 文件。

不是：

程式碼規格。

它是一份：

Architecture Document。

描述的是：

《棒球人生》

如何建立一個：

可信、

可延伸、

可維護、

可持續發展

的棒球人生模擬世界。

---

# Architecture Vision

《棒球人生》

不是：

一款以能力值為核心的養成遊戲。

不是：

一款以棒球數據為核心的模擬器。

也不是：

一款由事件堆疊而成的文字遊戲。

它真正想描述的是：

一段棒球人生。

玩家：

不是在操作：

能力值。

不是在操作：

資料表。

而是在扮演：

一位球員，

一步一步，

走完自己的棒球生涯。

Architecture

存在的目的，

不是支援更多功能。

而是確保：

所有功能，

都共同描述：

同一段人生。

---

# Purpose

Architecture Bible

回答的是：

> 《棒球人生》的世界，應該如何被建立？

它定義：

- 每個 System 的責任
- 每個 System 的邊界
- 資料如何流動
- 系統如何合作
- 如何擴充而不失控
- 如何讓遊戲持續演化

Architecture

不是：

限制創意。

而是：

保護創意。

讓新的功能，

能自然融入：

既有世界。

---

# Design Philosophy

整個 Architecture

建立於：

幾個核心理念。

---

## Life First

玩家

體驗的是：

人生。

不是：

資料。

所有 System

都應：

服務：

玩家的人生體驗。

不是：

展示自己的存在。

---

## Choice First

人生

由：

選擇組成。

不是：

最佳解。

Architecture

應支持：

資訊、

選擇、

後果。

而不是：

固定答案。

---

## World First

玩家

不是：

世界中心。

世界：

即使沒有玩家，

仍會持續運作。

玩家：

只是：

生活在其中。

---

## Long-Term Consequence

真正重要的結果，

未必：

立即發生。

Architecture

應允許：

延遲回報、

長期影響、

人生累積。

---

## Understanding First

玩家：

不需要：

知道：

所有數值。

但需要：

理解：

自己的人生。

UI

應幫助：

理解。

不是：

暴露所有資料。

---

# Scope

Architecture Bible

討論的是：

Architecture。

不是：

實作細節。

例如：

Architecture

討論：

```text
Coach

負責：

Observation

Evaluation

Recommendation
```

但不討論：

```text
CoachScore()

如何寫。
```

Architecture

回答：

Why。

System。

回答：

What。

Code。

回答：

How。

三者：

彼此合作。

不要混合。

---

# Target Audience

本文件

適合：

- 遊戲設計者
- 程式開發者
- 系統設計者
- 未來協作者
- AI Coding Agent
- 未來的自己

閱讀完成後，

應能理解：

整個遊戲，

如何運作。

而不是：

只理解：

某一段程式。

---

# Core Goal

Architecture Bible

唯一目標：

建立：

一套可以陪伴

《棒球人生》

持續開發多年，

仍能保持一致性的架構。

未來：

即使：

新增：

- 新聯盟
- 新球隊
- 新 NPC
- 新系統
- 新玩法

Architecture

仍然成立。

不用：

重新推翻。

---

# What This Bible Is Not

Architecture Bible

不是：

功能清單。

不是：

企劃書。

不是：

劇情設定集。

不是：

UI 設計稿。

不是：

資料庫 Schema。

不是：

Coding Style Guide。

如果：

需要：

新增玩法。

請修改：

對應 System。

如果：

需要：

修改架構。

請先確認：

是否違反：

Architecture Principle。

---

# Architecture Mindset

閱讀本文件時，

請始終記住：

Architecture

不是：

描述：

目前程式。

Architecture

描述的是：

未來十年的方向。

程式：

可以重寫。

System：

可以重構。

UI：

可以重做。

甚至：

玩法：

也可以調整。

但是：

Architecture

應保持：

一致。

因為：

它描述的是：

世界運作的方式。

不是：

目前程式的樣子。

# How to Read This Bible

Architecture Bible

不是：

一本可以隨意翻閱的文件。

它是一套：

由下而上，

逐步建立世界的 Architecture。

建議：

依照：

章節順序閱讀。

不要：

跳著閱讀。

因為：

後面的 System

都建立在：

前面的 System

之上。

---

# Reading Order

建議閱讀順序：

```text
00 README

↓

Architecture Bible

↓

Player

↓

Identity

↓

Narrative

↓

Relationship

↓

Event

↓

Career

↓

Match

↓

Progression

↓

Decision

↓

Current State

↓

World Simulation

↓

Organization

↓

Injury

↓

Coach

↓

Save

↓

UI
```

每一章，

都是：

下一章的基礎。

---

# Why This Order?

Architecture

不是：

依照：

功能排列。

而是：

依照：

世界建立順序。

例如：

沒有：

Player。

就沒有：

Identity。

沒有：

Identity。

就沒有：

Narrative。

沒有：

Narrative。

就沒有：

Relationship。

Architecture

描述的是：

世界如何形成。

不是：

玩家看到什麼。

---

# Layered Architecture

整個 Architecture

可分為：

四個層級。

```text
Foundation

↓

Gameplay

↓

Infrastructure

↓

Presentation
```

每一層，

都有：

不同責任。

---

# Foundation Layer

Foundation

建立：

玩家本身。

包含：

```text
Player

Identity

Current State
```

回答：

```text
我是誰？
```

---

# Gameplay Layer

Gameplay

建立：

人生。

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

Injury

Organization

World
```

回答：

```text
世界如何運作？
```

---

# Infrastructure Layer

Infrastructure

建立：

跨時間能力。

包含：

```text
Save
```

回答：

```text
如何讓人生持續存在？
```

---

# Presentation Layer

Presentation

建立：

玩家體驗。

包含：

```text
UI
```

回答：

```text
玩家如何理解世界？
```

---

# Architecture Map

整個 Architecture

可以理解成：

```text
                 Player
                    │
          ┌─────────┼─────────┐
          │         │         │
     Identity   Current State  Relationship
          │                     │
          └────────┐       ┌────┘
                   │       │
              Narrative  Event
                   │       │
                   └───┬───┘
                       │
                   Decision
                       │
            ┌──────────┼──────────┐
            │          │          │
         Career      Match   Progression
            │
    ┌───────┼────────┐
    │       │        │
Organization Coach  Injury
    │
    ▼
 World Simulation
    │
    ▼
 Save
    │
    ▼
 UI
```

這不是：

呼叫順序。

而是：

責任關係。

---

# Dependency Principle

所有 System

都遵守：

單向依賴。

例如：

```text
Player

↓

Identity

↓

Narrative
```

不要：

反向依賴。

例如：

Narrative

直接控制：

Player。

---

# System Independence

每個 System

都應：

可以：

獨立理解。

每個 System

都應：

只有：

一個核心責任。

如果：

一個功能

需要：

修改：

五個 System。

通常代表：

Architecture

需要重新檢查。

---

# Chapter Structure

每一章

都使用：

相同結構。

```text
Purpose

↓

Responsibilities

↓

Not Responsible

↓

Core Concepts

↓

Lifecycle

↓

Data Flow

↓

Architecture Rules

↓

Relationship

↓

Extension Guidelines

↓

Common Mistakes

↓

Design Philosophy

↓

Summary
```

固定結構，

降低：

閱讀成本。

也方便：

新增 System。

---

# How to Read a System

閱讀每個 System

時，

建議依照：

以下順序。

第一：

Purpose。

了解：

System

存在原因。

第二：

Responsibilities。

了解：

System

真正負責什麼。

第三：

Not Responsible。

了解：

哪些事情：

不能放進來。

第四：

Lifecycle

與

Data Flow。

了解：

System

如何運作。

第五：

Architecture Rules。

了解：

不可違反的原則。

最後：

Design Philosophy。

理解：

設計背後的原因。

不要：

直接閱讀：

Summary。

Summary

是：

複習。

不是：

第一次閱讀。

---

# Cross-System Thinking

Architecture

不是：

十六個獨立 System。

而是一個：

合作中的世界。

例如：

玩家：

一次訓練。

可能同時影響：

```text
Current State

↓

Progression

↓

Coach

↓

Relationship

↓

Event

↓

Narrative
```

每個 System

只負責：

自己的部分。

共同形成：

完整結果。

---

# Single Responsibility

Architecture

最大原則：

```text
One System

One Responsibility
```

不要：

讓：

Player

開始管理：

Coach。

不要：

讓：

Coach

開始管理：

Narrative。

不要：

讓：

UI

開始管理：

Gameplay。

---

# Source of Truth

每一份資料，

只有：

一個：

Source of Truth。

例如：

```text
Player Data

↓

Player System
```

```text
Relationship

↓

Relationship System
```

```text
Coach Evaluation

↓

Coach System
```

其他 System

只能：

讀取。

不能：

重新定義。

---

# Data Ownership

Architecture

不是：

共享資料。

而是：

共享理解。

每個 System

擁有：

自己的資料。

其他 System

只透過：

公開 Interface

合作。

不要：

直接修改：

其他 System

內部資料。

---

# Evolution

Architecture

不是：

完成後：

就固定。

它應：

持續演化。

但是：

每一次修改，

都應：

先回答：

```text
是否改變：

System Responsibility？
```

如果：

沒有。

代表：

通常只需要：

修改：

System。

不是：

Architecture。

# Common Language

Architecture

最大的目的之一：

建立：

共同語言。

所有討論、

設計、

程式、

文件，

都應：

使用：

相同名詞。

不要：

同一概念，

出現：

不同名稱。

---

# Core Terminology

以下名詞，

在整個專案中，

具有固定定義。

不要：

任意改變。

---

## System

System

代表：

一個擁有：

明確責任、

資料、

規則、

生命週期

的獨立模組。

System

不是：

資料夾。

不是：

程式檔。

不是：

Class。

---

## State

State

代表：

某個時間點：

真實存在的資料。

例如：

```text
Power

Fatigue

Trust

Money

Team
```

State

可以：

保存。

可以：

改變。

---

## Logic

Logic

代表：

如何產生：

State。

例如：

疲勞恢復公式、

AI 判斷、

能力成長、

傷病演算法。

Logic

不能：

保存。

---

## Event

Event

代表：

世界發生：

一件事情。

例如：

```text
加入球隊

受傷

升上一軍

退休
```

Event

不是：

劇情。

---

## Narrative

Narrative

代表：

玩家如何理解：

人生。

Narrative

由：

許多 Event

共同形成。

不是：

單一事件。

---

## Decision

Decision

代表：

玩家：

主動做出的選擇。

Decision

不是：

結果。

---

## Consequence

Consequence

代表：

Decision

帶來的：

世界改變。

可能：

立即。

也可能：

多年後。

---

## Relationship

Relationship

代表：

人物之間：

持續存在的關係。

不是：

一次事件。

---

## Current State

Current State

代表：

角色目前：

身心狀態。

不是：

永久能力。

---

## Progression

Progression

代表：

長期累積的：

成長。

不是：

一天的變化。

---

## World

World

代表：

玩家之外：

仍持續運作的世界。

---

## Presentation

Presentation

代表：

UI

如何呈現：

資料。

不是：

資料本身。

---

## Persistence

Persistence

代表：

跨越時間：

保存資料。

不是：

Gameplay。

---

# Common Principles

所有 System

共同遵守：

以下原則。

---

## Principle 01

One System

One Responsibility

每個 System

只回答：

一個核心問題。

---

## Principle 02

Single Source of Truth

每份資料，

只有：

一個擁有者。

---

## Principle 03

State

≠

Logic

保存：

State。

執行：

Logic。

不要混合。

---

## Principle 04

Reality

≠

Interpretation

例如：

```text
Player Reality

↓

Coach Interpretation

↓

UI Presentation

↓

Player Understanding
```

每一層：

都不同。

---

## Principle 05

Choice

≠

Result

玩家：

只能控制：

Decision。

不能控制：

Outcome。

---

## Principle 06

Presentation

≠

Gameplay

UI

永遠：

不是：

Gameplay。

---

## Principle 07

Save

≠

Source of Truth

Save

保存：

資料。

不擁有：

資料。

---

## Principle 08

Information

≠

Knowledge

顯示：

很多資訊。

不代表：

玩家理解。

Architecture

追求：

理解。

不是：

資訊量。

---

## Principle 09

Simulation

≠

Story

世界：

先運作。

故事：

再形成。

不是：

先決定故事。

---

## Principle 10

Life

＞

Statistics

數據：

重要。

人生：

更重要。

---

# Development Rules

新增任何功能前，

請先回答：

---

## Rule 01

這個功能，

屬於：

哪一個 System？

如果：

回答不了。

代表：

Architecture

尚未清楚。

---

## Rule 02

是否：

已有：

System

負責？

若：

已有。

不要：

建立：

第二個。

---

## Rule 03

是否：

需要：

新增資料？

如果：

只是：

Presentation。

不要：

新增：

Gameplay Data。

---

## Rule 04

是否：

新增：

State？

還是：

Logic？

不要：

混合。

---

## Rule 05

Source of Truth

是誰？

不要：

同一資料：

存在：

兩份。

---

## Rule 06

是否：

影響：

Save？

如果：

需要跨時間。

應：

更新：

Save Interface。

---

## Rule 07

是否：

影響：

UI？

如果：

玩家需要理解。

應：

新增：

Presentation。

不是：

直接公開資料。

---

## Rule 08

是否：

破壞：

Architecture Boundary？

如果：

需要：

跨越：

多個 System

直接修改。

通常：

代表：

設計有問題。

---

## Rule 09

是否：

符合：

Single Responsibility？

如果：

新增功能後，

System

開始回答：

兩個問題。

代表：

需要重構。

---

## Rule 10

是否：

真的需要：

新的 System？

如果：

只是：

原本責任延伸。

應：

修改：

既有 System。

不要：

System Explosion。

---

# System Checklist

建立：

新 System

之前，

請確認：

```text
□ Purpose

□ Responsibility

□ Not Responsible

□ Source of Truth

□ Lifecycle

□ Data Flow

□ Architecture Rules

□ Relationship

□ Save

□ UI

□ Design Philosophy
```

若：

無法回答。

不要：

開始實作。

---

# Architecture Review Checklist

修改任何 System

前，

請檢查：

```text
□ 是否改變 Responsibility？

□ 是否新增第二個 Source of Truth？

□ 是否新增 Duplicate State？

□ 是否破壞 Data Flow？

□ 是否影響 Save？

□ 是否影響 UI？

□ 是否影響其他 System？

□ 是否違反 Common Principles？
```

Architecture

比：

程式：

更早檢查。

---

# Collaboration Philosophy

Architecture Bible

不是：

個人筆記。

它是：

所有協作者：

共同遵守的契約。

任何修改，

都應：

先理解：

Architecture。

再修改：

System。

最後：

才修改：

Code。

不要：

反過來。

---

# AI Collaboration

AI

可以：

協助：

設計、

程式、

測試、

重構。

但是：

AI

也應：

遵守：

Architecture。

不要：

為了：

短期方便。

破壞：

長期一致性。

Architecture

高於：

單次實作。

# Architecture Evolution

Architecture

不是：

完成後，

永遠不變。

Architecture

應：

持續演化。

但是：

演化

應保持：

一致性。

不是：

持續增加複雜度。

---

## Stable Core

Architecture

分成：

兩個部分。

第一：

Stable Core。

第二：

Evolving Systems。

---

### Stable Core

通常：

不應改變。

例如：

```text
Single Responsibility

Source of Truth

State ≠ Logic

Presentation ≠ Gameplay

Life > Data

Choice ≠ Result
```

這些：

是整個世界：

共同遵守的法則。

---

### Evolving Systems

System

可以：

持續演化。

例如：

Coach

增加：

Learning。

Narrative

增加：

Memory。

World

增加：

Media。

這些：

都是：

System Evolution。

不是：

Architecture Rewrite。

---

# Architecture Before Features

未來：

新增任何功能。

第一步：

不是：

開始寫程式。

而是：

回答：

```text
Architecture

應如何支援？
```

只有：

Architecture

合理。

Implementation

才會：

合理。

---

# Feature Workflow

新增功能：

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

Review

↓

Implementation
```

不要：

```text
Idea

↓

Code

↓

Bug

↓

Architecture
```

---

# Refactoring Philosophy

Refactoring

真正目的：

不是：

程式更漂亮。

而是：

Architecture

更清楚。

如果：

只是：

重新命名：

大量 Class。

Architecture

沒有改善。

代表：

不是：

真正 Refactoring。

---

# When to Change Architecture

Architecture

只有：

以下情況：

建議修改。

---

## Situation 01

System

責任錯誤。

例如：

Player

開始管理：

Coach。

---

## Situation 02

出現：

第二個：

Source of Truth。

---

## Situation 03

大量：

Duplicate State。

---

## Situation 04

新增功能：

必須：

修改：

很多 System。

---

## Situation 05

System

開始回答：

兩個以上：

核心問題。

---

如果：

只是：

增加玩法。

通常：

不用：

修改：

Architecture。

---

# Versioning

Architecture Bible

應：

獨立版本。

例如：

```text
Architecture

v2.0
```

不要：

直接使用：

Game Version。

Architecture

可能：

多年：

不改版。

Game

可能：

每週：

更新。

兩者：

不同。

---

# Documentation Philosophy

Documentation

不是：

寫完。

就結束。

它應：

跟隨：

Architecture

一起演化。

Architecture

改變。

Documentation

也必須：

更新。

不要：

讓：

文件

落後：

程式。

---

# Code Philosophy

程式：

應：

描述：

Architecture。

不是：

取代：

Architecture。

如果：

閱讀程式，

才能知道：

System

負責什麼。

代表：

Architecture

沒有完成。

---

# Prototype Philosophy

Prototype

存在目的：

不是：

驗證：

程式。

而是：

驗證：

Architecture。

例如：

玩家：

是否理解：

Decision？

Coach：

是否可信？

Relationship：

是否有累積感？

Narrative：

是否自然形成？

真正驗證的是：

System。

不是：

Function。

---

# Playtest Philosophy

Playtest

不只是：

找 Bug。

真正重要的是：

Architecture

是否成功。

例如：

玩家：

是否理解：

自己的人生？

是否：

願意：

繼續玩？

是否：

理解：

選擇帶來：

長期影響？

如果：

答案是否定。

Architecture

也需要：

Review。

---

# Future Expansion

Architecture

應支援：

未來：

新增：

```text
Media

Finance

Fan

Scouting

International League

National Team

Family

Agent

Sponsor
```

新增：

System

不用：

重寫：

Architecture。

只需：

遵守：

Architecture Principle。

---

# Long-Term Vision

Architecture

真正希望做到：

十年後：

重新閱讀。

仍然：

合理。

即使：

新增：

數百個 Event。

數千個 NPC。

更多聯盟。

更多玩法。

Architecture

仍然：

清楚。

---

# Common Mistakes

---

## Mistake 01

Architecture

跟著：

程式走。

錯。

Architecture

應：

領導：

程式。

---

## Mistake 02

新增功能：

先寫程式。

錯。

先：

Architecture。

---

## Mistake 03

System

責任：

越來越大。

錯。

---

## Mistake 04

Architecture

開始：

依賴：

Implementation。

錯。

---

## Mistake 05

Documentation

停止更新。

錯。

---

## Mistake 06

Prototype

變成：

正式版本。

錯。

Prototype

存在：

驗證。

不是：

永久。

---

## Mistake 07

Architecture

過度抽象。

錯。

Architecture

應：

足夠清楚。

也足夠實際。

---

## Mistake 08

AI

直接修改：

Architecture。

錯。

Architecture

應：

先 Review。

---

## Mistake 09

System

互相：

直接修改。

錯。

---

## Mistake 10

Architecture

為了：

短期方便。

持續妥協。

錯。

---

# Final Philosophy

Architecture

不是：

為了管理程式。

Architecture

是：

為了保護：

《棒球人生》的世界。

玩家

真正記住的，

不是：

程式。

不是：

System。

不是：

資料。

玩家記住的是：

第一次站上一軍。

第一次受傷。

第一次被教練信任。

第一次奪冠。

最後一次退休。

Architecture

真正存在的理由，

就是：

讓這些人生，

能夠自然、

一致、

可信地發生。

每一個 System，

都只負責：

自己的真相。

所有 System，

共同組成：

同一個世界。

---

# Final Summary

Architecture Bible

回答：

> 《棒球人生》的世界，應該如何被建立、維持、演化？

它定義：

- 世界如何建立
- System 如何合作
- Data 如何流動
- Responsibility 如何切分
- Save 如何保存
- UI 如何呈現
- 如何新增功能
- 如何避免架構失控

Architecture

不是：

Implementation。

Implementation

不是：

Architecture。

Architecture

決定：

世界。

Implementation

實現：

世界。

---

整個 Architecture

建立於：

```text
One System

↓

One Responsibility

↓

One Source of Truth

↓

Shared World

↓

Shared Experience
```

最後，

請永遠記住：

Architecture

不是：

限制創意。

Architecture

是：

讓創意，

能持續成長，

而不破壞：

《棒球人生》的世界。