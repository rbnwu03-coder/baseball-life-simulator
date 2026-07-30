# Prototype Specification

Version:

1.0

---

# Purpose

Prototype

不是：

對外展示用的 Demo。

不是：

Early Access。

也不等同於：

完整產品等級的 Vertical Slice。

Prototype

真正存在的目的：

驗證：

Architecture。

在實作方法上，

Prototype

可以採用：

Vertical Slice Method。

也就是：

只選擇一段最小但完整的 Gameplay Loop，

讓玩家可以從輸入、選擇、結果、世界回應，

一路走完整個流程。

因此：

```text
Prototype 的目的：

驗證 Architecture

回答：

```text
這套 Architecture，

是否真的能支撐

《棒球人生》？
```

Prototype

不追求：

內容豐富。

Prototype

追求：

Architecture

是否成立。

---

# Prototype Vision

Prototype v2

希望證明：

《棒球人生》

可以：

自然產生：

一段棒球人生。

而不是：

依靠：

大量 Script、

大量 Event、

大量劇情。

玩家：

應感受到：

```text
世界

↓

做出選擇

↓

世界回應

↓

人生開始形成
```

這就是：

Prototype

最重要的目標。

---

# Design Philosophy

Prototype

建立於：

四個核心理念。

---

## Validate Architecture

第一優先：

Architecture。

不是：

功能。

如果：

Architecture

失敗。

新增：

再多內容，

都沒有意義。

---

## Validate Experience

Prototype

驗證：

玩家感受。

不是：

玩家能力。

例如：

玩家：

是否理解：

今天的選擇？

是否：

理解：

教練的評價？

是否：

理解：

人生正在累積？

---

## Validate Responsibility

Prototype

驗證：

每個 System

是否：

真的：

只做：

自己的事情。

例如：

Coach

不能：

直接改：

Player。

Narrative

不能：

直接改：

Career。

Save

不能：

管理：

Gameplay。

---

## Validate Scalability

Prototype

應證明：

Architecture

可以：

自然新增：

更多內容。

不是：

重新修改：

Architecture。

例如：

Prototype

只有：

一位教練。

正式版：

十位教練。

Architecture

不應：

改變。

---

# Prototype Scope

Prototype

只驗證：

最小可行人生。

不是：

完整生涯。

Prototype

回答：

```text
這個世界，

是否成立？
```

正式版

才回答：

```text
這個世界，

是否夠豐富？
```

---

# Success Criteria

Prototype

完成時，

玩家應能：

```text
建立角色

↓

理解自己的身份

↓

開始第一週

↓

每天做出選擇

↓

世界產生回應

↓

教練開始形成看法

↓

球隊開始做出安排

↓

玩家感受到：

人生開始改變
```

如果：

上述流程，

自然成立。

Prototype

成功。

---

# Prototype Principles

所有 Prototype

共同遵守：

以下原則。

---

## Principle 01

Architecture

高於：

Implementation。

任何：

方便性的實作，

都不能：

破壞：

Architecture。

---

## Principle 02

Responsibility

高於：

Feature。

如果：

新增功能，

破壞：

System Responsibility。

不要：

加入。

---

## Principle 03

Experience

高於：

Data。

Prototype

不追求：

大量數值。

而追求：

玩家是否理解：

人生。

---

## Principle 04

Iteration

高於：

一次完成。

Prototype

允許：

失敗。

允許：

重構。

允許：

推翻：

Implementation。

但：

Architecture

應：

盡量保持：

穩定。

---

# Development Strategy

Prototype

採用：

Vertical Slice。

不是：

Horizontal Slice。

不要：

先完成：

全部：

Player。

再完成：

全部：

Coach。

再完成：

全部：

UI。

而是：

完成：

一段：

完整人生流程。

例如：

```text
建立角色

↓

第一天

↓

做出選擇

↓

事件發生

↓

教練回應

↓

球隊回應

↓

一天結束

↓

第二天開始
```

即使：

只有：

七天。

也比：

做完：

一百個：

獨立功能，

更有價值。

---

# Prototype Mindset

Prototype

最大的敵人：

不是：

Bug。

而是：

Scope Creep。

Prototype

每新增：

一項功能，

都應：

先回答：

```text
這項功能，

是否驗證了：

Architecture？
```

如果：

答案是否定。

不要：

現在做。

留給：

正式版本。

# Validation Targets

Prototype v2

不是：

驗證所有功能。

而是：

驗證：

Architecture

是否成立。

Prototype

需要驗證：

以下六個核心能力。

---

## Target 01

Player Identity

Prototype

應證明：

玩家，

不是：

能力值。

而是一位：

有身份、

有價值觀、

有目標

的人。

玩家建立角色後，

應：

清楚理解：

```text
我是誰？

我想成為誰？

我為什麼打棒球？
```

Identity

應：

影響：

Decision。

不是：

直接增加能力。

---

## Target 02

Meaningful Decision

Prototype

應證明：

玩家每天：

都需要：

真正做出選擇。

Decision

不應：

存在：

最佳解。

每個選擇，

都應：

具有：

成本。

風險。

機會。

Prototype

至少應：

包含：

三種：

不同方向的每日行動。

例如：

```text
自主訓練

↓

團隊互動

↓

休息恢復
```

玩家

必須：

放棄：

另一個選項。

---

## Target 03

World Response

Prototype

應證明：

世界：

真的會回應玩家。

不是：

固定 Script。

例如：

玩家：

持續自主訓練。

世界：

可能：

開始注意。

玩家：

持續休息。

世界：

可能：

有不同反應。

世界

回應的是：

玩家累積的行為。

不是：

單次按鈕。

---

## Target 04

Professional Evaluation

Prototype

應證明：

Coach

不是：

能力偵測器。

Coach

只能：

根據：

自己看到的資訊。

形成：

評價。

Prototype

應驗證：

Observation

↓

Interpretation

↓

Evaluation

↓

Recommendation

是否成立。

---

## Target 05

Institution Response

Prototype

應證明：

球隊：

依照：

制度。

做出決策。

不是：

因為：

教練喜歡。

就直接：

升上一軍。

應：

存在：

制度層：

重新判斷。

例如：

Roster

Competition

Need

Timing

---

## Target 06

Narrative Memory

Prototype

應證明：

人生：

開始累積。

Narrative

不應：

只是：

今天發生什麼。

而是：

開始形成：

玩家：

自己的故事。

例如：

```text
第一次被教練注意。

第一次受傷。

第一次放棄加練。

第一次相信隊友。
```

這些：

都是：

Memory。

不是：

單一 Event。

---

# Included Systems

Prototype

正式納入：

以下 System。

```text
Player

Identity

Current State

Decision

Event

Relationship

Coach

Organization

Narrative

Progression

Save

UI
```

上述：

必須：

真正互相合作。

不是：

各自獨立完成。

---

# Simplified Systems

以下 System

存在。

但：

採用：

最小版本。

---

## Match

Prototype

只需：

支援：

簡化比賽。

例如：

文字回報。

不需要：

完整 Play-by-Play。

---

## Injury

Prototype

只需：

支援：

基本傷病。

例如：

疲勞累積。

輕傷。

恢復。

不需要：

完整醫療系統。

---

## World Simulation

Prototype

只需：

模擬：

玩家所在球隊。

不需要：

整個聯盟。

---

## Career

Prototype

只需：

支援：

少棒初期。

不需要：

完整職業生涯。

---

# Out of Scope

Prototype

故意：

不做：

以下內容。

```text
完整職棒生涯

完整選秀制度

自由球員市場

完整球探系統

媒體系統

球迷系統

家庭系統

經紀人

商業合作

國際賽

完整聯盟模擬

完整 AI Manager
```

上述：

全部：

留給：

正式版本。

---

# Minimum Playable Slice

Prototype

至少應：

完成：

以下流程。

```text
建立角色

↓

選擇 Identity

↓

開始第一天

↓

Decision

↓

Event

↓

Current State 更新

↓

Coach Evaluation

↓

Organization Response

↓

Relationship 更新

↓

Narrative Memory

↓

Save

↓

第二天開始
```

若：

上述流程，

可以：

自然重複。

Prototype

即具備：

最小可玩性。

---

# Success Metrics

Prototype

成功，

不是：

完成：

多少功能。

而是：

回答：

以下問題。

```text
玩家是否理解：

自己的身份？

↓

玩家是否理解：

每天都在做選擇？

↓

玩家是否感受到：

世界會回應？

↓

玩家是否開始：

期待明天？

↓

玩家是否開始：

記住自己的人生？
```

如果：

答案都是：

Yes。

Prototype

成功。

# Development Strategy

Prototype

不是：

一次完成。

而是：

持續驗證。

每一次：

新增功能，

都應：

回答：

```text
Architecture

是否仍然成立？
```

不要：

累積：

大量功能。

最後：

一次測試。

---

# Vertical Slice

Prototype

採用：

Vertical Slice。

不是：

Horizontal Slice。

---

## Vertical Slice

完成：

一段：

完整人生。

例如：

```text
建立角色

↓

開始第一天

↓

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

Narrative

↓

Save

↓

第二天
```

即使：

只有：

七天。

也比：

完成：

二十個：

互不相關的功能，

更有價值。

---

## Horizontal Slice

不要：

先完成：

全部：

Player。

再完成：

全部：

Coach。

再完成：

全部：

UI。

因為：

Architecture

無法：

真正驗證。

---

# Development Order

Prototype

建議：

依照：

以下順序。

---

## Stage 01

Foundation

完成：

```text
Player

Identity

Current State
```

確認：

玩家：

可以：

開始：

人生。

---

## Stage 02

Decision Loop

完成：

```text
Decision

↓

Event

↓

Current State
```

確認：

玩家：

每天：

都需要：

做出選擇。

---

## Stage 03

World Response

完成：

```text
Coach

Organization

Relationship
```

確認：

世界：

開始回應：

玩家。

---

## Stage 04

Meaning

完成：

```text
Narrative
```

確認：

人生：

開始：

累積意義。

---

## Stage 05

Persistence

完成：

```text
Save

UI
```

確認：

人生：

可以：

持續。

---

# Validation Sequence

每完成：

一個 Stage。

都應：

立即：

試玩。

不要：

等：

全部完成。

例如：

```text
Stage 01

↓

Playtest

↓

Review

↓

Stage 02

↓

Playtest

↓

Review
```

Architecture

應：

持續接受：

驗證。

---

# Architecture Checkpoints

Prototype

每完成：

一個 Stage。

都應：

回答：

---

## Checkpoint 01

Responsibility

是否：

仍然清楚？

是否：

有：

System

開始：

管理：

其他 System？

---

## Checkpoint 02

Source of Truth

是否：

仍然：

唯一？

是否：

開始：

出現：

Duplicate Data？

---

## Checkpoint 03

Data Flow

是否：

仍然：

單向流動？

是否：

開始：

出現：

直接修改：

其他 System？

---

## Checkpoint 04

Player Experience

玩家：

是否：

理解：

自己的選擇？

是否：

理解：

世界回應？

---

## Checkpoint 05

Architecture

是否：

比：

Implementation

更穩定？

如果：

每新增：

一個功能，

都需要：

修改：

Architecture。

代表：

Prototype

發現了：

真正問題。

---

# Prototype Review

Prototype

每一次：

Review。

都應：

分成：

三個層級。

---

## Architecture

Architecture

是否：

仍然：

合理？

---

## System

Responsibility

是否：

清楚？

---

## Experience

玩家：

是否：

開始：

期待：

下一天？

如果：

沒有。

先：

Review。

不要：

直接：

新增內容。

---

# Failure Policy

Prototype

允許：

失敗。

例如：

```text
Decision

設計失敗
```

可以：

重做。

```text
Coach

觀察模型

不好玩
```

可以：

修改。

```text
UI

太複雜
```

可以：

重做。

但是：

不要：

因為：

Prototype

失敗。

立即：

推翻：

Architecture。

先確認：

問題：

來自：

Architecture。

還是：

Implementation。

---

# Completion Criteria

Prototype

不是：

做到：

內容很多。

而是：

做到：

Architecture

成立。

完成 Prototype

之前，

請確認：

```text
□ 每天都有選擇

□ 世界真的回應

□ 教練形成自己的判斷

□ 組織透過制度回應

□ 關係開始累積

□ Narrative 開始形成

□ Save 可以完整還原

□ UI 幫助玩家理解人生
```

若：

全部成立。

Prototype

即可：

進入：

下一階段。

---

# Prototype Deliverables

Prototype v2

完成後，

至少應：

交付：

```text
Prototype Build

Architecture Review Report

Playtest Feedback

Revision Plan

Updated Documentation
```

Prototype

不是：

終點。

而是：

正式開發：

開始之前：

最後一次：

Architecture 驗證。

# Exit Criteria

Prototype

存在的目的：

不是：

完成遊戲。

而是：

降低：

正式開發：

失敗的風險。

Prototype

只有：

在：

Architecture

已被證明可行後，

才算完成。

---

# Architecture Exit

Prototype

完成前，

應確認：

Architecture

已經：

足夠穩定。

不應：

再因：

新增內容，

大量修改：

System Responsibility。

如果：

仍然經常：

重新定義：

System。

代表：

Architecture

尚未成熟。

---

# Experience Exit

Prototype

完成前，

玩家應：

自然理解：

整個遊戲循環。

例如：

```text
今天做了什麼？

↓

世界為什麼這樣回應？

↓

我下一步該做什麼？
```

如果：

玩家：

需要：

大量說明。

代表：

Prototype

仍需改善。

---

# Motivation Exit

Prototype

完成前，

玩家應：

產生：

持續遊玩的動機。

Prototype

不追求：

豐富內容。

而追求：

玩家：

自然想：

開始：

下一天。

如果：

玩家：

完成七天後，

主動想：

繼續玩。

代表：

Prototype

已成功建立：

核心循環。

---

# System Exit

Prototype

完成前，

所有納入 Prototype 的 System，

都應：

真正合作。

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

Relationship

↓

Narrative

↓

Save
```

任何：

System

都不應：

獨立存在。

---

# Data Exit

Prototype

完成前，

資料結構：

應保持：

穩定。

允許：

新增欄位。

但：

不應：

頻繁改變：

核心資料模型。

例如：

Player

Identity

Current State

應：

保持：

向下相容。

---

# Documentation Exit

Prototype

完成前，

所有文件：

都應：

同步更新。

包括：

```text
Architecture Bible

README

System Documents

Prototype Specification
```

Documentation

應：

描述：

目前的 Prototype。

不是：

未來的理想版本。

---

# Prototype Review Report

Prototype

完成後，

應產出：

Review Report。

至少包含：

---

## Architecture

哪些設計：

被證明成立？

哪些：

需要修正？

---

## System

哪些：

System

Responsibility

仍然模糊？

哪些：

合作良好？

---

## Experience

玩家：

在哪些地方：

停下來思考？

哪些地方：

產生期待？

哪些地方：

感到困惑？

---

## Technical

哪些：

Implementation

值得保留？

哪些：

需要重構？

---

## Future

哪些：

功能：

適合：

正式版本？

哪些：

仍需：

更多驗證？

---

# Transition to Production

Prototype

完成後，

正式版：

不應：

直接：

大量新增功能。

建議流程：

```text
Prototype Review

↓

Architecture Review

↓

Revision

↓

Production Planning

↓

Content Production

↓

Production Build
```

Architecture

仍然：

保持穩定。

正式版：

主要增加：

Content。

不是：

重新設計：

世界。

---

# Risks

Prototype

最常見的失敗，

不是：

Bug。

而是：

錯誤判斷：

Prototype 已完成。

請確認：

以下問題：

```text
是否只是：

功能很多？

還是：

Architecture 已成立？

是否只是：

事件很多？

還是：

世界真的活著？

是否只是：

劇情很多？

還是：

人生開始累積？
```

如果：

後者，

仍然無法回答。

不要：

進入：

Production。

---

# Final Definition

Prototype

不是：

縮小版遊戲。

Prototype

是一份：

Architecture

是否可行的證據。

當 Prototype 完成時，

團隊應：

具備：

以下信心：

```text
這套 Architecture，

可以支撐：

未來數年的內容開發。
```

如果：

無法回答。

代表：

Prototype

尚未完成。

---

# Closing Statement

《棒球人生》

不是：

靠著：

大量事件，

變得有趣。

也不是：

靠著：

大量數值，

變得真實。

而是：

透過：

玩家每天的選擇，

世界每天的回應，

以及：

長時間累積的人生，

讓每一位玩家，

擁有：

屬於自己的棒球故事。

Prototype

存在的目的，

就是：

證明：

這件事情，

真的可以發生。