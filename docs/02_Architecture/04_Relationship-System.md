# 04 Relationship System

Version: 2.0

---

# Purpose

Relationship System 負責管理玩家與世界中各角色之間的關係。

它不只是記錄：

玩家喜不喜歡某個人。

而是：

記錄彼此如何建立信任、

共同經歷、

產生衝突、

留下羈絆，

並在漫長的人生中互相影響。

Relationship 回答的是：

> 玩家與這個人，是什麼樣的關係？

而不是：

> 好感度有多少？

---

# Responsibilities

Relationship System 負責管理：

- Interaction（互動）
- Relationship State（關係狀態）
- Trust（信任）
- Respect（尊重）
- Affection（情感）
- Conflict（衝突）
- Shared Experience（共同經歷）
- Bond（羈絆）
- Relationship Memory（關係記憶）
- Relationship Evolution（關係演變）

Relationship 不負責：

- 對話內容
- 劇情流程
- 能力值
- 比賽結果
- NPC 行為決策

---

# Not Responsible

## Dialogue

角色說了什麼。

由：

Dialogue System（或 Event）

管理。

Relationship 不生成對話。

---

## Narrative

Relationship 保存：

兩人的共同人生。

Narrative 保存：

玩家的人生意義。

兩者不可混用。

---

## Identity

Identity 回答：

我是誰。

Relationship 回答：

我們是誰。

Identity 不依附於任何角色。

Relationship 一定存在於兩個角色之間。

---

## Event

事件是否發生。

由：

Event System

管理。

Relationship 只負責：

事件如何改變彼此。

---

## Match

比賽內容。

由：

Match System

管理。

Relationship 不控制：

勝負。

---

## NPC

NPC 的人格、

個性、

目標、

由：

NPC System

管理。

Relationship 只記錄：

玩家與 NPC 的連結。

---

# Core Concepts

Relationship 並不是：

Friendship。

也不是：

Love。

Relationship 是：

兩個角色之間，

持續累積的人生連結。

這個連結，

可能是：

友情、

師徒、

競爭、

親情、

敵對、

甚至陌生。

所有關係，

都遵循相同的生命週期。

---

# Relationship Layer

Relationship 可分成四個層次。

```text
Interaction

↓

Relationship State

↓

Bond

↓

Legacy
```

---

## Interaction

一次互動。

例如：

- 第一次見面
- 一起練球
- 一起輸球
- 一起旅行
- 一場爭吵

Interaction 是：

Relationship 的最小單位。

一次 Interaction，

通常不足以改變人生。

---

## Relationship State

互動累積後，

形成目前的關係。

例如：

- 熟悉
- 信任
- 疏遠
- 尊敬
- 敵視
- 依賴

Relationship State

會隨時間持續改變。

它不是永久狀態。

---

## Bond

Bond

代表：

長時間累積後，

形成的深層羈絆。

例如：

多年後，

玩家可能已離隊。

但仍然願意：

第一時間聯絡山本。

這不是：

Trust。

而是：

Bond。

Bond

通常需要：

大量 Shared Experience。

---

## Legacy

Legacy

代表：

即使兩人不再見面，

彼此仍持續影響對方的人生。

例如：

多年後，

玩家仍按照恩師教導的方式帶領年輕球員。

即使教練已退休，

Relationship 仍然存在。

這就是：

Relationship Legacy。
# Relationship Dynamics

Relationship 並不是固定狀態。

它會隨著人生持續演化。

生命週期如下：

```text
Interaction

↓

Shared Experience

↓

Relationship State

↓

Conflict（Optional）

↓

Repair（Optional）

↓

Bond

↓

Legacy
```

Relationship 的核心，

不是：

數值增加。

而是：

彼此共同經歷人生。

---

# Shared Experience

Shared Experience

代表：

兩個角色共同經歷的重要事件。

例如：

- 一起練球
- 一起贏得冠軍
- 一起輸掉決賽
- 一起復健
- 一起旅行
- 一起面對媒體
- 一起送別隊友

Shared Experience

是 Relationship 成長的重要來源。

不是每一次 Interaction，

都會成為 Shared Experience。

只有具有情感重量、

能影響彼此關係的經歷，

才值得保存。

---

# Relationship Memory

Relationship Memory

保存：

兩個角色共同的人生片段。

它不是：

事件紀錄。

也不是：

Narrative Memory。

Relationship Memory

回答的是：

> 我們一起經歷過什麼？

例如：

- 第一次一起自主加練。
- 第一次因理念不同而爭吵。
- 一起熬過漫長復健。
- 他在我最低潮時沒有離開。

Relationship Memory

屬於：

雙方共同擁有的回憶。

---

# Relationship Types

Relationship System

支援多種關係類型。

例如：

- Family
- Mentor
- Coach
- Teammate
- Rival
- Friend
- Partner
- Media
- Fans

Relationship Type

決定：

世界如何解讀這段關係。

例如：

Mentor：

Trust

代表：

願意接受指導。

Rival：

Trust

可能代表：

相信對方值得自己全力以赴。

相同數值，

不同 Type，

意義完全不同。

---

# Relationship State

Relationship State

描述：

目前雙方的關係。

例如：

- Stranger
- Acquaintance
- Companion
- Trusted
- Close Friend
- Mentor
- Rival
- Family
- Broken
- Repaired

Relationship State

可以改變。

也可以退化。

它不是：

永久結果。

---

# Emotional Dimensions

Relationship 並不是：

單一好感度。

建議拆成多個面向。

例如：

- Trust（信任）
- Respect（尊重）
- Affection（情感）
- Dependence（依賴）
- Gratitude（感謝）
- Resentment（怨懟）

不同角色，

會重視不同面向。

例如：

教練：

Respect

比：

Affection

更重要。

朋友：

Trust

比：

Respect

更容易建立。

競爭對手：

Respect

可能遠高於：

Affection。

因此，

Relationship 不應只有一條數值。

---

# Relationship Evolution

Relationship 並不是：

一路變好。

它可能：

建立、

停滯、

惡化、

修復、

重新開始。

例如：

第一次見面

↓

一起練球

↓

互相信任

↓

理念衝突

↓

數年沒有聯絡

↓

成年後再次合作

↓

Bond

Relationship Evolution

沒有固定方向。

真正決定結果的是：

玩家與 NPC 的共同選擇。

---

# Core Data

Relationship System

保存以下核心資料。

---

## Relationship Type

目前雙方的關係類型。

例如：

- Mentor
- Rival
- Friend

---

## Relationship State

目前的關係狀態。

例如：

Trusted

Broken

Close Friend

---

## Emotional Dimensions

各情感面向。

例如：

Trust

Respect

Affection

Dependence

Gratitude

Resentment

---

## Shared Experiences

重要共同經歷。

作為：

Relationship 成長的重要依據。

---

## Relationship Memories

值得長期保存的人際回憶。

不是所有互動。

而是：

真正改變彼此的共同回憶。

---

## Bond Status

是否形成：

深層羈絆。

若形成，

即使長時間沒有互動，

仍可能持續影響彼此。
# Lifecycle

Relationship 並不是固定資料。

它會隨著玩家與 NPC 的人生持續演變。

生命週期如下：

```text
Interaction

↓

Shared Experience

↓

Relationship State

↓

Relationship Memory

↓

Bond（Optional）

↓

Legacy
```

Relationship 不會因一次事件而完全建立。

真正深厚的關係，

需要：

時間、

共同經歷、

以及彼此的選擇。

---

# Data Flow

Relationship 與其他 System 的資料流如下：

```text
NPC

↓

Interaction

↓

Relationship

↓

Narrative

↓

Insight

↓

Identity
```

Relationship 是：

Interaction

與

Narrative

之間的重要橋樑。

它負責保存：

玩家與其他角色的人生連結。

---

# Relationship Update Flow

Relationship 更新流程如下：

```text
Interaction

↓

Meaningful？

├── No
│
└── Yes
      ↓

Shared Experience

↓

Relationship State Updated

↓

Need Memory？

├── No
│
└── Yes
      ↓

Relationship Memory Added

↓

Need Bond？

├── No
│
└── Yes
      ↓

Bond Established

↓

Need Legacy？

├── No
│
└── Yes
      ↓

Legacy Updated
```

不是每一次互動，

都值得改變 Relationship。

只有真正重要的共同經歷，

才會留下長期影響。

---

# Architecture Rules

Relationship System 必須遵守以下規則。

---

## Rule 01

Relationship 不保存事件。

事件由：

Event System

管理。

Relationship 保存：

事件如何改變兩人的關係。

---

## Rule 02

Relationship 不保存人生意義。

人生意義由：

Narrative System

管理。

Relationship 保存：

人與人的連結。

---

## Rule 03

Relationship 必須建立在 Shared Experience。

沒有共同經歷，

就不應形成：

深層 Bond。

互動次數，

不能直接代表關係深度。

---

## Rule 04

Relationship 必須允許退化。

任何關係，

都可能：

疏遠、

破裂、

停止聯絡。

Bond 可以保留。

Relationship State 可以改變。

---

## Rule 05

Relationship 必須具有非對稱性。

玩家對 NPC 的感受，

與 NPC 對玩家的感受，

不一定相同。

例如：

玩家：

非常信任教練。

教練：

仍然認為玩家尚未成熟。

Relationship 不必完全一致。

---

## Rule 06

Relationship 必須允許修復。

衝突，

不是 Relationship 的終點。

真正重要的是：

是否願意重新建立信任。

Repair

本身也是一段重要的人生經歷。

---

# Relationship Strength

Relationship 的強度，

並不完全來自：

Trust。

建議綜合評估：

- Shared Experience
- Emotional Dimensions
- Bond
- 時間累積
- Relationship Memory

因此：

兩位 Trust 相同的 NPC，

Relationship Strength

仍可能完全不同。

---

# Relationship Network

Relationship 並不是：

一條線。

而是一張網。

例如：

```text
          山本教練
             │
     Mentor Bond
             │
玩家 ───── 阿哲
 │            │
 │         Friend
 │
 Rival
 │
高橋
```

每段 Relationship

都可能互相影響。

例如：

阿哲與高橋關係惡化，

可能影響：

玩家與高橋的互動。

Relationship 應被視為：

Network。

不是：

多組獨立數值。

---

# Relationship Influence

Relationship

可能影響：

- Event 出現機率
- NPC 行為
- 對話內容
- 劇情分支
- 支援事件
- 信任事件
- Rival Event
- Mentor Event

但 Relationship

不直接控制：

事件。

它提供：

事件發生的重要條件。
## Career System

Career 提供：

玩家目前的人生階段。

Relationship 決定：

哪些人在不同階段陪伴玩家。

相同的 NPC，

可能因 Career 不同，

扮演完全不同的角色。

例如：

少棒時：

山本是教練。

成年後：

山本更像人生導師。

Relationship 保存的是：

角色之間的連結。

不是職稱。

---

## World System

World 提供：

社會、

文化、

時代背景。

Relationship 發生於：

世界之中。

不同文化、

不同聯盟、

不同年代，

都可能影響：

Relationship 的建立方式。

---

## NPC System

NPC 提供：

人格、

價值觀、

目標、

行為模式。

Relationship 提供：

NPC 與玩家之間，

長期累積的人際連結。

NPC 定義：

他是誰。

Relationship 定義：

他與玩家是什麼關係。

---

## Save System

Save System

負責：

Relationship Data 的保存與還原。

Relationship 不負責：

存檔流程。

---

## UI System

UI 負責呈現：

- Relationship State
- Bond
- Shared Experience
- Relationship Memory
- Legacy

Relationship 不決定：

介面如何呈現。

---

# Extension Guidelines

新增 Relationship 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

互動（Interaction）

還是：

關係（Relationship）？

如果只是：

一次聊天、

一次事件、

一次比賽。

應加入：

Event System。

不是：

Relationship。

---

## Question 02

新增的是：

共同經歷，

還是：

人生意義？

共同經歷：

屬於 Relationship。

人生意義：

屬於 Narrative。

請勿混用。

---

## Question 03

新增的是：

短期變化，

還是：

長期羈絆？

只有經過：

時間累積、

Shared Experience、

情感沉澱，

才應建立：

Bond。

---

## Question 04

這段 Relationship，

是否真的改變了彼此？

如果沒有，

通常不需要建立：

Relationship Memory。

---

# Common Mistakes

以下是最常見的設計錯誤。

---

## Mistake 01

Relationship 等於好感度。

錯誤。

Relationship

是人生連結。

不是：

單一數值。

---

## Mistake 02

每次互動都提升關係。

錯誤。

真正重要的是：

Shared Experience。

不是：

Interaction 次數。

---

## Mistake 03

Relationship 與 Narrative 混在一起。

錯誤。

Relationship 保存：

我們一起經歷了什麼。

Narrative 保存：

那些經歷，

對人生代表什麼。

---

## Mistake 04

Bond 很容易建立。

錯誤。

Bond

代表：

長時間累積的人際羈絆。

不應因：

少量事件，

快速形成。

---

## Mistake 05

Relationship 永遠只會變好。

錯誤。

真正的人際關係，

可能：

建立、

停滯、

惡化、

修復、

重新開始。

Relationship 應允許：

完整的人生變化。

---

# Design Philosophy

人生，

並不是由事件組成。

而是由人組成。

真正改變一個人的，

往往不是某場比賽，

而是在那場比賽中，

陪伴自己的人。

有人陪伴你幾十年，

卻沒有留下任何影響。

有人只出現短短一年，

卻改變了整個人生。

Relationship 的價值，

從來不是：

相處多久。

而是：

彼此留下了多少影響。

因此，

Relationship 的終點，

不是 Bond。

而是：

Influence。

當一個人離開之後，

他的價值觀、

教導、

信任、

甚至一句話，

仍然持續影響玩家的人生。

那段 Relationship，

就從未真正結束。

---

# Summary

Relationship System 回答的核心問題只有一個：

> 我和這個人，走過了一段什麼樣的人生？

它不是：

好感度系統。

不是：

NPC 管理器。

不是：

事件紀錄。

它負責：

建立、

累積、

修復、

延續，

玩家與其他角色之間的人生連結。

當玩家回顧整段生涯時，

真正記住的，

不是曾經認識多少人。

而是：

有哪些人，

陪伴自己走過那些最重要的人生時刻。