# 03 Narrative System

Version: 2.0

---

# Purpose

Narrative System 負責管理玩家人生的敘事脈絡（Narrative）。

它並不創造事件。

也不控制劇情。

Narrative 的責任是：

> 將玩家的人生經歷，組織成具有意義的生命故事。

它回答的不是：

> 發生了什麼？

而是：

> 這件事對玩家的人生代表什麼？

Narrative 是玩家理解自己人生的重要媒介。

---

# Responsibilities

Narrative System 負責管理：

- Narrative Context（敘事情境）
- World Response（世界回應）
- Narrative Meaning（事件意義）
- Narrative Memory（敘事記憶）
- Narrative Echo（延遲回響）
- Narrative Foreshadowing（伏筆）
- Narrative Closure（收束）
- Narrative Tension（敘事張力）

Narrative 不負責：

- 事件流程
- 世界規則
- 能力值
- NPC 關係
- 比賽結果

---

# Not Responsible

## Event

事件是否發生。

由：

Event System

管理。

Narrative 不觸發事件。

---

## Match

比賽內容。

由：

Match System

管理。

Narrative 不決定勝負。

---

## Progression

能力如何成長。

由：

Progression System

管理。

Narrative 不增加能力。

---

## Relationship

關係如何變化。

由：

Relationship System

管理。

Narrative 不保存關係數值。

---

## Identity

Identity 回答：

玩家相信自己是誰。

Narrative 回答：

世界如何回應這樣的玩家。

兩者不可混用。

---

## World

世界如何運作。

由：

World System

管理。

Narrative 不控制世界。

---

# Core Concepts

Narrative 並不是 Story。

Story 可以有很多。

Narrative 永遠只有一個。

Narrative 是：

玩家人生的理解方式。

它把：

事件、

人物、

比賽、

成功、

失敗、

串連成一段具有意義的人生。

---

# Narrative Layer

Narrative 可分成四個層次。

```text
Event

↓

Reaction

↓

Meaning

↓

Memory
```

---

## Event

事情發生。

例如：

- 落選
- 奪冠
- 受傷
- 被交易
- 畢業

Event 提供：

事實。

不是意義。

---

## Reaction

世界開始回應。

例如：

- 教練說話
- 父母態度
- 隊友反應
- 媒體評論
- 球迷支持

Reaction 是：

世界的第一層回應。

---

## Meaning

玩家開始理解：

這件事代表什麼。

例如：

同樣是：

落選。

有人理解成：

> 我不夠努力。

有人理解成：

> 我只是還沒準備好。

Narrative 保存的是：

這層意義。

而不是事件本身。

---

## Memory

多年後。

玩家再次想起：

那一天。

Memory 保存：

玩家人生的重要敘事節點。

它不是 Event History。

而是：

Narrative Memory。
# Narrative Memory

Narrative System 保存的是：

玩家如何理解自己的人生。

因此，

Narrative Memory 並不保存：

事件本身。

而保存：

事件對人生的意義。

---

例如：

Event History：

```text
2031/04/08

Strike Out
```

Narrative Memory：

```text
第一次真正懷疑自己的才能。
```

又例如：

Event History：

```text
2035

Championship
```

Narrative Memory：

```text
努力終於得到回應。
```

Narrative Memory 是玩家人生的重要節點。

不是時間軸。

---

# Narrative Echo

Narrative Echo

代表：

過去的重要經驗，

在未來再次產生影響。

它不是 Flashback。

而是：

人生的延遲回應。

---

例如：

少棒時：

教練說：

> 「不要害怕失敗。」

多年後。

職棒總冠軍。

再次站上打擊區。

玩家可能想起：

那一天。

這就是：

Narrative Echo。

---

Narrative Echo 的生命週期如下：

```text
Foreshadow

↓

Experience

↓

Meaning

↓

Memory

↓

Delayed Echo

↓

Closure
```

Narrative Echo

通常不立即發生。

它需要：

時間。

---

# Narrative Foreshadowing

Foreshadowing

代表：

世界提前留下訊息。

但玩家當下並不知道它的重要性。

例如：

第一次遇見：

山本教練。

當時只是：

普通對話。

多年後。

玩家才發現：

那句話影響了整個人生。

Narrative System

保存：

這種延遲理解。

---

# Narrative Closure

Narrative Closure

代表：

一段人生課題真正完成。

Closure

不是：

事件結束。

而是：

玩家終於理解：

這段人生。

例如：

父親一直希望玩家：

成為王牌。

多年後。

玩家沒有成為王牌。

卻找到：

真正適合自己的人生。

這就是：

Closure。

Narrative Closure

通常伴隨：

Identity Shift。

---

# Narrative Tension

Narrative Tension

代表：

尚未解決的人生拉扯。

例如：

Ideal Self：

可靠的人。

Role Identity：

自私的人。

Narrative 並不立即解決。

而是：

持續累積。

直到：

玩家做出真正的重要選擇。

Narrative Tension

是玩家持續遊玩的重要驅動力。

---

# Core Data

Narrative 保存以下核心資料。

---

## Narrative Context

目前玩家所處的人生情境。

例如：

- Rookie Season
- Final Summer Tournament
- Injury Recovery
- Retirement Season

Context

決定：

世界如何回應玩家。

---

## Narrative Memory

玩家人生的重要意義。

不是事件列表。

而是：

人生節點。

---

## Narrative Echo

目前有哪些過去事件：

仍未完成回響。

Narrative 可在未來重新引用。

---

## Narrative Tension

目前有哪些人生課題：

尚未完成。

例如：

- 與父親的期待
- 自我懷疑
- 天才與努力
- 勝負價值觀

Narrative

持續追蹤：

這些張力。

---

## Narrative Closure

哪些人生課題：

已真正完成。

Closure

通常代表：

玩家完成一段人生。

而不是：

完成一個任務。
# Lifecycle

Narrative 並不是線性的劇本。

它會隨著玩家的人生持續累積。

生命週期如下：

```text
Event

↓

World Response

↓

Narrative Context

↓

Narrative Meaning

↓

Narrative Memory

↓

Narrative Echo（Optional）

↓

Narrative Closure
```

Narrative 不會因事件結束而停止。

真正結束的是：

玩家完成一段人生課題。

---

# Data Flow

Narrative 與其他 System 的資料流如下：

```text
World

↓

Event

↓

Narrative

↓

Insight

↓

Identity

↓

Player Summary
```

Narrative 是：

Fact

與

Understanding

之間的重要橋樑。

---

# Narrative Update Flow

Narrative 更新流程如下：

```text
Event Triggered

↓

World Response

↓

Narrative Context Updated

↓

Meaning Generated

↓

Memory Recorded

↓

Need Echo？

├── No
│
└── Yes
      ↓
Narrative Echo Registered

↓

Need Closure？

├── No
│
└── Yes
      ↓
Narrative Closure
```

Narrative 不直接修改：

Identity。

也不直接產生：

Insight。

Narrative 提供：

理解的素材。

---

# Architecture Rules

Narrative System 必須遵守以下規則。

---

## Rule 01

Narrative 不保存事件。

事件由：

Event System

管理。

Narrative 保存的是：

事件的敘事意義。

---

## Rule 02

Narrative 不保存玩家理解。

玩家真正理解什麼，

由：

Insight System

管理。

Narrative 只提供：

世界如何詮釋這件事。

---

## Rule 03

Narrative 必須具有延續性。

每一段 Narrative

都應能回答：

它與玩家過去的人生有什麼連結？

如果沒有，

它就只是事件。

不是 Narrative。

---

## Rule 04

Narrative 必須允許多重解讀。

同一事件，

不同玩家，

不同人生，

可能產生不同 Narrative。

Narrative 不應只有一種答案。

---

## Rule 05

Narrative 不保證公平。

世界可能：

誤解玩家。

忽略玩家。

甚至否定玩家。

Narrative 的責任不是：

公平。

而是：

真實地回應玩家的人生。

---

## Rule 06

Narrative 應優先建立情感連續性。

真正重要的不是：

事件有多大。

而是：

玩家是否感受到：

人生持續向前。

因此：

Narrative Echo

Narrative Closure

通常比大型事件更重要。

---

# Relationship with Other Systems

Narrative 位於整個 Architecture 的中央。

它負責：

將世界、

人物、

事件、

串連成玩家的人生。

---

## Player System

Player 提供：

目前狀態。

Narrative 不修改 Player。

Narrative 完成後，

由其他 System

決定是否更新 Player Summary。

---

## Identity System

Narrative 提供：

人生脈絡。

Identity 決定：

玩家如何重新定義自己。

Narrative

不直接修改 Identity。

---

## Relationship System

Relationship 提供：

人物互動。

Narrative 決定：

這段互動在人生中的意義。

Relationship 保存：

狀態。

Narrative 保存：

故事。

---

## Career System

Career 提供：

人生階段。

Narrative 讓：

不同 Career

擁有不同人生重量。

相同 Career

因 Narrative 不同，

人生也不同。

---

## Match System

Match 提供：

競技事實。

Narrative 提供：

競技意義。

例如：

同樣是：

三振。

Narrative 可以是：

第一次真正面對壓力。

也可以是：

老將最後一次站上打擊區。

Match 不決定 Narrative。

Narrative 也不改變 Match。
## Progression System

Progression 管理：

玩家能力如何成長。

Narrative 管理：

玩家如何理解這段成長。

能力提升，

並不一定代表：

人生獲得成長。

---

## Insight System

Narrative 提供：

世界的敘事脈絡。

Insight 提供：

玩家真正形成的理解。

兩者合作形成：

Experience

↓

Narrative

↓

Insight

↓

Identity

Narrative 不保存：

玩家的理解。

---

## World System

World 提供：

世界規則、

社會文化、

時代背景。

Narrative 決定：

玩家如何經歷這個世界。

World 建立：

舞台。

Narrative 建立：

人生。

---

## Event System

Event 決定：

哪些事情發生。

Narrative 決定：

那些事情在人生中的意義。

Event 可以沒有 Narrative。

Narrative 一定來自 Event。

---

## Injury System

Injury 提供：

人生的重要轉折。

Narrative 不保存：

傷病資料。

Narrative 保存：

傷病在人生中的位置。

例如：

「第一次開始害怕自己的身體。」

---

## Save System

Save System

負責：

Narrative Data 的保存與還原。

Narrative 不處理存檔。

---

## UI System

UI 負責呈現：

- Narrative Memory
- Narrative Echo
- Narrative Context
- Narrative Closure

Narrative 不決定：

如何顯示。

---

# Extension Guidelines

新增 Narrative 功能前，

應先回答以下問題。

---

## Question 01

新增的是：

事件（Event）

還是：

事件的意義（Narrative）？

若只是：

事情發生。

應加入：

Event System。

不是 Narrative。

---

## Question 02

新增的是：

玩家理解？

還是：

世界敘事？

如果是：

玩家理解。

應加入：

Insight。

不是 Narrative。

---

## Question 03

新增的是：

一次事件？

還是：

長期人生脈絡？

Narrative 應描述：

長期累積的人生。

不是：

單一事件。

---

## Question 04

這段 Narrative

是否能與過去人生產生連結？

如果不能，

通常代表：

它只是事件。

不是 Narrative。

---

# Common Mistakes

以下是 Narrative 最容易發生的設計錯誤。

---

## Mistake 01

Narrative 等於 Story。

錯誤。

Story 可以很多。

Narrative 永遠只有一個。

Narrative 是：

玩家人生的脈絡。

---

## Mistake 02

Narrative 保存所有事件。

錯誤。

事件應由：

Event System

管理。

Narrative 保存：

意義。

不是事件。

---

## Mistake 03

Narrative 保存玩家理解。

錯誤。

玩家真正理解什麼，

由：

Insight System

管理。

Narrative 保存：

世界如何詮釋這件事。

---

## Mistake 04

每個事件都建立 Narrative。

錯誤。

不是所有事件，

都值得成為人生的重要節點。

只有真正具有情感重量、

能影響玩家生命故事的事件，

才應建立 Narrative Memory。

---

# Design Philosophy

Narrative 並不是一本劇本。

它是一個人回頭看自己人生時，

所說出的那個故事。

同樣的人生，

不同的人，

會說出不同的 Narrative。

世界可能沒有改變。

真正改變的是：

玩家如何理解自己的生命。

因此，

Narrative 的價值，

不在於事件本身。

而在於：

那些事件，

最後如何成為人生的一部分。

世界不一定公平。

但世界一定會留下回應。

Narrative 的工作，

就是保存那些回應，

並讓玩家在多年後，

仍能感受到：

自己曾經走過的人生。

---

# Summary

Narrative System 回答的核心問題只有一個：

> 這段人生，對玩家代表什麼？

它不是事件系統。

不是劇情腳本。

不是對話系統。

它負責把：

事件、

人物、

世界、

時間，

串連成一段具有連續性的生命故事。

當玩家多年後回頭看自己的生涯時，

真正記住的，

不是每一場比賽的比分。

而是：

那些比賽，

如何改變了自己的人生。