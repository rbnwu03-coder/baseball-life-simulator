# 05 Event System

Version: 2.0

---

# Purpose

Event System 負責管理遊戲中所有事件的發生。

它決定：

什麼事情發生、

何時發生、

在什麼條件下發生。

Event 本身沒有情感。

也沒有意義。

它只是：

改變玩家人生的一次經歷。

Event 回答的是：

> 發生了什麼？

而不是：

> 這件事代表什麼？

事件的意義，

由：

Narrative System

建立。

---

# Responsibilities

Event System 負責管理：

- Event Trigger（事件觸發）
- Event Condition（事件條件）
- Event Availability（事件可用性）
- Event Priority（事件優先權）
- Event Category（事件分類）
- Event Outcome（事件結果）
- Event Chain（事件鏈）
- Event Cooldown（事件冷卻）
- Event Randomness（事件隨機性）

Event 不負責：

- 劇情意義
- 人際關係
- 身分認同
- 能力成長
- 對話內容

---

# Not Responsible

## Narrative

Narrative 回答：

事件代表什麼。

Event 回答：

事件是否發生。

兩者不可混用。

---

## Relationship

Relationship 回答：

事件如何改變彼此。

Event 只負責：

提供共同經歷。

---

## Progression

能力如何提升。

由：

Progression System

管理。

Event 可能提供：

成長機會。

但不直接提升能力。

---

## Match

比賽流程、

攻守結果、

比賽數據。

由：

Match System

管理。

Event 可以發生在比賽前、

比賽中、

比賽後。

但 Event 不控制：

比賽。

---

## World

World 提供：

世界規則。

Event 遵守：

世界規則。

Event 不改變世界規則。

---

## Dialogue

Dialogue 提供：

角色說了什麼。

Event 提供：

為什麼會出現這段對話。

---

# Core Concepts

Event 並不是：

劇情。

也不是：

任務。

Event 是：

人生中的一次經歷。

例如：

- 第一次加入球隊
- 第一次板凳
- 第一次受傷
- 第一次戀愛
- 第一次被交易
- 第一次退休記者會

每一個 Event，

都只是：

人生的一個片段。

真正的人生，

來自：

大量 Event 的累積。

---

# Event Layer

Event 可分成四個層次。

```text
Trigger

↓

Event

↓

Outcome

↓

Consequence
```

---

## Trigger

事件開始的條件。

例如：

- 年齡
- 地點
- 關係
- 身分
- 能力
- 時間
- 世界狀態

Trigger

決定：

事件是否可能發生。

---

## Event

真正發生的事情。

例如：

- 教練找你談話
- 隊友邀請自主訓練
- 媒體採訪
- 球探觀察
- 家人衝突
- 受傷

Event

只描述：

事情本身。

---

## Outcome

事件立即造成的結果。

例如：

- 信心下降
- 體力消耗
- 新事件解鎖
- 關係改變
- 金錢增加
- 時間經過

Outcome

是：

短期結果。

---

## Consequence

事件造成的長期影響。

例如：

- 開啟 Rival 線
- 山本開始注意玩家
- 父親開始支持棒球
- 媒體持續關注
- 後續事件解鎖

Consequence

通常不立即出現。

它可能在數年後，

再次影響玩家的人生。
# Event Lifecycle

Event 並不是獨立存在。

每一個 Event，

都可能成為下一個 Event 的起點。

生命週期如下：

```text
Trigger

↓

Availability Check

↓

Priority Evaluation

↓

Event Triggered

↓

Outcome

↓

Consequence

↓

Future Event Updated
```

事件結束，

並不代表它真正結束。

它可能改變：

玩家、

NPC、

世界，

以及未來事件。

---

# Event Categories

Event 可依功能分類。

例如：

- Story Event
- Character Event
- Relationship Event
- Match Event
- Career Event
- Injury Event
- Random Event
- World Event
- Special Event

分類目的：

方便管理。

而不是限制內容。

一個 Event

也可能同時屬於：

多個 Category。

---

# Event Trigger

每個 Event

都應具有明確的觸發條件。

例如：

- Age
- Grade
- Season
- Career Stage
- Identity
- Relationship
- Ability
- Reputation
- Injury Status
- World State

只有符合條件，

事件才有資格進入：

Availability。

---

# Event Availability

符合 Trigger

並不代表：

一定發生。

Availability

代表：

目前是否能進入候選清單。

例如：

玩家已符合：

加入明星隊。

但：

目前正在受傷。

因此：

Availability = False。

Availability

是：

事件是否可被選取。

不是：

是否一定發生。

---

# Event Priority

若同時符合：

多個事件。

Event System

需要決定：

哪一個事件先發生。

Priority

可參考：

- Main Story
- Character Importance
- Relationship Importance
- Time Sensitivity
- Career Stage
- Narrative Weight

Priority

並不是：

固定排序。

而應依：

玩家目前人生，

動態調整。

---

# Event Chain

事件之間，

可以形成：

Event Chain。

例如：

加入校隊

↓

正式先發

↓

第一次失誤

↓

隊友鼓勵

↓

自主加練

↓

能力突破

每一個 Event

都是下一個 Event 的前提。

但：

玩家仍可能：

中途離開。

因此：

Event Chain

不是：

固定劇本。

而是：

可能的人生路徑。

---

# Event Randomness

人生具有：

偶然性。

因此，

部分 Event

應具有：

Randomness。

例如：

- 天氣
- 媒體採訪
- 意外受傷
- 偶然遇見球探
- 隊友主動聊天

Randomness

應增加：

人生的不確定性。

而不是：

完全破壞玩家策略。

所有 Random Event，

都應保持：

合理性。

---

# Event Cooldown

部分事件，

不應連續發生。

例如：

- 家庭衝突
- 球探觀察
- 媒體專訪
- 大型 Injury Event

因此：

每個 Event

可設定：

Cooldown。

Cooldown

避免：

內容重複、

節奏失衡、

玩家疲乏。

---

# Core Data

Event System

保存以下核心資料。

---

## Trigger Conditions

事件觸發條件。

---

## Availability Status

目前是否可進入事件池。

---

## Priority

事件優先權。

---

## Category

事件分類。

可支援多重分類。

---

## Outcome

立即結果。

---

## Consequence

長期影響。

---

## Event Chain

目前事件鏈的位置。

---

## Cooldown Status

事件冷卻狀態。

避免短時間重複觸發。

# Lifecycle

Event 並不是一次性的流程。

每個 Event，

都可能改變整個遊戲世界。

生命週期如下：

```text
Trigger

↓

Availability

↓

Priority

↓

Event Triggered

↓

Outcome

↓

Game State Updated

↓

Future Events Updated
```

真正被改變的，

不是 Event。

而是：

Game State。

之後所有 System，

都依據新的世界狀態繼續運作。

---

# Data Flow

Event 與其他 System 的資料流如下：

```text
World

↓

Event Trigger

↓

Event

↓

Game State

├── Relationship
├── Narrative
├── Progression
├── Career
├── Injury
└── Match

↓

Future Events
```

Event 是：

整個遊戲流程的重要驅動器。

但它不保存：

任何長期資料。

---

# Event Update Flow

事件更新流程如下：

```text
Check Trigger

↓

Check Availability

↓

Evaluate Priority

↓

Execute Event

↓

Generate Outcome

↓

Update Game State

↓

Register Consequence

↓

Unlock Future Events
```

每個 Event，

都應留下：

可追蹤的後續影響。

若沒有任何影響，

通常代表：

事件價值不足。

---

# Architecture Rules

Event System 必須遵守以下規則。

---

## Rule 01

Event 不保存人生意義。

人生意義，

由：

Narrative System

管理。

Event 保存：

事實。

---

## Rule 02

Event 不直接修改 Identity。

Identity 的改變，

應透過：

Experience

↓

Narrative

↓

Insight

↓

Identity

Event 只是：

第一步。

---

## Rule 03

Event 必須改變 Game State。

若 Event 發生後，

世界完全沒有改變，

代表：

Event 缺乏存在價值。

Game State 的改變，

可以是：

- 關係
- 世界旗標
- 時間
- 劇情進度
- 新事件
- 職涯階段

不一定是：

能力值。

---

## Rule 04

Event 必須具有可追溯性。

玩家應能理解：

目前的人生，

是如何一步步走到現在。

重要 Event

應能回溯：

來源。

---

## Rule 05

Event 不保證正向結果。

人生充滿：

意外、

錯過、

失敗、

誤會。

Event 應提供：

真實的人生可能性。

而不是：

最佳解。

---

## Rule 06

Event 應服務於人生，

而不是服務於劇本。

事件不是：

為了推進劇情。

而是：

讓玩家真正經歷人生。

若事件存在的唯一目的，

只是把玩家推到下一章，

代表它仍然偏向：

劇本事件。

---

# Event Weight

不是所有 Event，

都有相同的重要性。

可依影響程度分級。

例如：

Minor Event

日常互動。

Medium Event

改變短期狀態。

Major Event

改變人生方向。

Life Event

永久影響玩家人生。

例如：

- 畢業
- 選秀
- 重傷
- 結婚
- 引退

Life Event

通常也會影響：

Narrative、

Relationship、

Career。

---

# Event Dependency

部分 Event

依賴：

其他事件。

例如：

第一次自主訓練

需要：

加入球隊。

第一次隊長會議

需要：

成為隊長。

Event Dependency

建立：

合理的人生順序。

但不應限制：

所有可能性。

玩家仍可：

錯過、

延遲、

甚至永遠不觸發某些事件。
## Progression System

Progression 管理：

能力如何成長。

Event 提供：

成長的契機。

例如：

自主加練事件，

可能解鎖新的訓練方向。

真正的能力提升，

仍由：

Progression System

處理。

---

## Relationship System

Relationship 管理：

人與人的連結。

Event 提供：

建立或改變關係的共同經歷。

例如：

一起贏得冠軍、

一起度過低潮、

一次激烈衝突。

Relationship 保存：

這些經歷如何改變彼此。

---

## Narrative System

Narrative 管理：

事件在人生中的意義。

Event 只提供：

事實。

例如：

受傷。

Narrative 才決定：

這次受傷，

在人生中代表什麼。

---

## Injury System

Injury 提供：

玩家的身體狀態。

Event 可依 Injury：

改變事件池。

例如：

復健期間，

不會觸發高強度訓練事件。

---

## Save System

Save System

負責：

Event Data、

Event Flags、

Cooldown、

Consequence

的保存與還原。

Event 不負責：

存檔流程。

---

## UI System

UI 負責呈現：

- Event
- Event Choice
- Event Result
- Event History（必要時）
- Event Notification

Event 不決定：

介面如何呈現。

---

# Extension Guidelines

新增 Event 前，

請先回答以下問題。

---

## Question 01

新增的是：

一件事情，

還是一段人生意義？

如果屬於：

人生意義。

應加入：

Narrative。

不是：

Event。

---

## Question 02

這個 Event，

是否真正改變：

Game State？

如果沒有，

通常不值得成為：

獨立 Event。

---

## Question 03

這個 Event，

是否能影響：

未來事件？

如果完全沒有後續，

應重新評估：

存在必要性。

---

## Question 04

是否具有：

合理 Trigger？

合理 Availability？

合理 Priority？

若沒有，

容易造成：

事件混亂。

---

## Question 05

玩家是否可能：

錯過、

延遲、

拒絕、

失敗？

若答案永遠是否，

代表：

Event 過於線性。

---

# Common Mistakes

以下是 Event 最常見的設計錯誤。

---

## Mistake 01

Event 等於劇情。

錯誤。

劇情，

由大量 Event

共同形成。

不是：

單一 Event。

---

## Mistake 02

每個 Event

都必須有重大結果。

錯誤。

日常事件，

同樣重要。

真正的人生，

由大量普通事件組成。

---

## Mistake 03

Event 直接修改所有 System。

錯誤。

Event 應更新：

Game State。

其他 System

自行依據新的狀態更新。

避免高度耦合。

---

## Mistake 04

事件只能成功。

錯誤。

失敗、

錯過、

拒絕、

沉默、

沒有發生，

都可能是：

重要 Event。

---

## Mistake 05

事件一定要被玩家看見。

錯誤。

世界可以：

自行運作。

NPC 之間，

也可以發生 Event。

玩家可能：

事後才知道，

甚至永遠不知道。

世界因此更真實。

---

# Design Philosophy

人生，

並不是一連串精心安排的劇情。

而是：

一連串事件，

在時間中彼此交錯。

有些事件，

當下看似微不足道。

多年後，

卻成為改變人生的重要轉折。

有些事件，

當下轟轟烈烈。

最後，

卻沒有留下任何痕跡。

Event 的價值，

不在於事件本身有多精彩。

而在於：

它是否改變了世界，

並讓人生，

朝新的方向前進。

Event 不負責講述人生。

它負責：

創造值得被記住的人生經歷。

---

# Summary

Event System 回答的核心問題只有一個：

> 發生了什麼？

它不是：

劇情系統。

不是：

任務系統。

不是：

人生意義。

它負責：

決定事件何時發生、

如何發生、

以及如何改變世界狀態。

每一個 Event，

都是玩家人生中的一個節點。

而整段人生，

則由無數 Event

共同交織而成。