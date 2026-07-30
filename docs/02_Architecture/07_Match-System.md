# 07 Match System

Version: 2.0

---

# Purpose

Match System 負責管理玩家的競技體驗（Competitive Experience）。

它描述：

玩家如何在球場上，

透過每一場比賽，

驗證自己的能力、

承擔責任、

面對壓力、

以及接受結果。

Match 並不是：

棒球規則模擬器。

也不是：

能力計算器。

Match 回答的是：

> 玩家在這場競技中，經歷了什麼？

而不是：

> 最後比分是多少？

比賽結果，

只是其中的一部分。

真正重要的是：

玩家如何完成這場競技。

---

# Responsibilities

Match System 負責管理：

- Match Context（比賽情境）
- Match Flow（比賽流程）
- Match Opportunities（比賽機會）
- Match Decisions（場上決策）
- Match Performance（場上表現）
- Match Result（比賽結果）
- Match Records（比賽紀錄）

Match 不負責：

- 劇情意義
- 人際關係
- 能力成長
- 職涯進展
- 世界規則

---

# Not Responsible

## Event

Event 管理：

哪些事情發生。

Match 管理：

競技如何進行。

比賽可能觸發 Event。

但 Event 並不是 Match。

---

## Narrative

Narrative 回答：

這場比賽，

在人生中代表什麼。

Match 不負責：

賦予比賽意義。

---

## Progression

能力如何成長。

由：

Progression System

管理。

Match 提供：

能力被驗證的舞台。

---

## Career

Career 保存：

玩家目前的人生位置。

Match 提供：

驗證這個位置的機會。

例如：

新人、

王牌、

隊長，

都會有不同的比賽責任。

---

## Relationship

Relationship 管理：

玩家與他人的連結。

Match 可能改變關係。

但 Match 不保存：

Relationship。

---

## World

World 提供：

聯盟、

賽制、

文化、

規則。

Match 遵守：

World 建立的規則。

---

# Core Concepts

Match 並不是：

一場比賽。

Match 是：

玩家一次完整的競技經歷。

一次 Match，

包含：

準備、

比賽、

結束、

回顧。

真正留下來的，

不是：

比分。

而是：

玩家如何完成這場競技。

---

# Match Layer

Match 可分成四個層次。

```text
Preparation

↓

Competition

↓

Result

↓

Reflection
```

---

## Preparation

比賽開始前。

例如：

- 教練安排
- 戰術設定
- 心理狀態
- 體力
- 傷勢
- 天氣

Preparation

決定：

玩家帶著什麼狀態進入比賽。

---

## Competition

真正的競技過程。

例如：

- 打席
- 守備
- 跑壘
- 投球
- 臨場決策

Competition

是：

玩家能力與選擇的驗證。

---

## Result

比賽結束。

例如：

- 勝利
- 失敗
- 個人成績
- 團隊成績
- MVP
- 失誤

Result

保存：

競技事實。

---

## Reflection

比賽結束後。

世界開始產生回應。

例如：

- 教練評論
- 隊友反應
- 媒體報導
- 球迷討論

Reflection

並不是：

Narrative。

它只是：

比賽結束後，

世界開始回應競技結果。

真正的人生意義，

仍由：

Narrative System

建立。
# Match Lifecycle

Match 並不是：

開始比賽

↓

結束比賽。

真正的 Match，

是一段完整的競技歷程。

生命週期如下：

```text
Preparation

↓

Match Opportunity

↓

Player Decision

↓

Performance

↓

Result

↓

Reflection
```

每一場比賽，

都由多個 Opportunity

共同組成。

---

# Match Opportunity

Opportunity

代表：

玩家真正需要做出判斷的時刻。

例如：

- 關鍵打席
- 滿壘守備
- 九局下最後一球
- 是否盜壘
- 是否短打
- 是否強攻
- 是否保送

不是：

每一球。

而是：

真正重要的競技瞬間。

Opportunity

是 Match 的核心。

---

# Player Decision

每個 Opportunity，

玩家都可能：

做出選擇。

例如：

打擊：

- 積極攻擊
- 保守選球

跑壘：

- 強攻本壘
- 停留三壘

守備：

- 安全傳球
- 冒險雙殺

Decision

代表：

玩家的競技選擇。

---

# Match Performance

Performance

代表：

玩家在 Opportunity 中，

實際完成的表現。

Performance

受到：

- Ability
- Condition
- Pressure
- Injury
- Weather
- Strategy

共同影響。

Performance

不是：

能力值。

而是：

能力在當下的表現。

---

# Match Context

每一場 Match，

都有自己的情境。

例如：

- 練習賽
- 地區預賽
- 全國決賽
- 職業一軍
- 國家隊
- 引退戰

Context

決定：

世界對這場比賽的重視程度。

同樣一支全壘打，

在練習賽，

與甲子園決賽，

完全不同。

---

# Match Pressure

Pressure

代表：

玩家承受的競技壓力。

例如：

- 滿壘
- 九局下
- 家人到場
- 球探觀戰
- 媒體直播
- MVP 爭奪

Pressure

並不是：

Difficulty。

它代表：

心理負荷。

因此，

不同 Personality、

Identity、

Experience，

可能對同樣 Pressure

產生不同反應。

---

# Match Momentum

Momentum

代表：

比賽目前的流向。

例如：

- 我方連續得分
- 對手氣勢高漲
- 守備失誤
- 主場觀眾鼓譟
- 投手逐漸失控

Momentum

不是：

勝率。

它代表：

比賽節奏。

Momentum

可能影響：

後續 Opportunity、

NPC 決策、

教練策略。

---

# Core Data

Match System

保存以下核心資料。

---

## Match Context

目前比賽情境。

---

## Match Opportunities

本場比賽的重要競技機會。

---

## Player Decisions

玩家在各 Opportunity

做出的決策。

---

## Match Performance

玩家實際表現。

---

## Match Result

比賽最終結果。

---

## Match Pressure

目前心理壓力。

---

## Match Momentum

目前比賽節奏。
# Lifecycle

Match 並不是單一事件。

它是一段持續變化的競技經歷。

生命週期如下：

```text
Preparation

↓

Expectation

↓

Opportunity

↓

Decision

↓

Performance

↓

Result

↓

Reflection
```

真正影響玩家感受的，

並不只是：

Result。

而是：

Result 是否符合：

Expectation。

---

# Data Flow

Match 與其他 System 的資料流如下：

```text
Career
        │
        ▼
World
        │
        ▼
Match Context
        │
        ▼
Match
        │
        ├── Event
        ├── Relationship
        ├── Narrative
        ├── Progression
        └── Career
```

Match 提供：

競技結果。

其他 System

再依據結果，

產生後續變化。

---

# Match Update Flow

Match 更新流程如下：

```text
Match Started

↓

Build Match Context

↓

Generate Opportunities

↓

Player Decision

↓

Calculate Performance

↓

Generate Result

↓

Update Match Records

↓

Notify Other Systems
```

Match 並不直接修改：

Identity、

Narrative、

Relationship。

它只提供：

競技事實。

---

# Architecture Rules

Match System 必須遵守以下規則。

---

## Rule 01

Match 不保存人生意義。

比賽意義，

由：

Narrative System

管理。

Match 保存：

競技事實。

---

## Rule 02

Match 不直接修改能力。

能力，

由：

Progression System

管理。

Match 提供：

能力驗證。

---

## Rule 03

Match 必須圍繞 Opportunity。

玩家不需要：

體驗每一球。

而是：

體驗真正重要的競技瞬間。

Opportunity

永遠比：

完整模擬，

更重要。

---

## Rule 04

Match 必須考慮 Expectation。

相同 Result，

不同 Expectation，

可能產生完全不同的人生經驗。

因此：

世界期待、

隊伍期待、

玩家期待，

都應影響：

Match Experience。

---

## Rule 05

Match 必須允許失敗。

真正的人生，

不會只有：

成功。

失誤、

三振、

爆投、

再見失誤，

都可能成為：

重要 Match。

---

## Rule 06

Match 必須服務於人生。

比賽存在的目的，

不是：

讓玩家一直贏。

而是：

讓玩家真正經歷競技。

---

# Match Records

Match Records

保存：

競技事實。

例如：

- 打席
- 安打
- 三振
- 保送
- 打點
- 失誤
- 守備機會
- 勝敗

Records

提供：

Career、

Media、

World、

Future Events

使用。

Records

本身不具有：

人生意義。

---

# Match Influence

Match

可能影響：

- Career Opportunity
- Event Pool
- Relationship
- Reputation
- Media Attention
- Confidence（若有）
- World Response

但 Match

並不直接控制：

上述系統。

它只提供：

競技結果。

---

# Match Modes

不同 Match，

可能具有不同重要性。

例如：

- Practice Game
- League Game
- Tournament
- Championship
- International Game
- Retirement Game

Mode

影響：

Match Context、

Pressure、

Expectation、

World Response。

不同 Mode，

應有不同權重。

## Event System

Event 管理：

人生發生了哪些事情。

Match 提供：

可能產生 Event 的競技背景。

例如：

- 完全比賽
- 再見安打
- 關鍵失誤
- 首次先發
- 生涯首轟

是否形成 Event，

由：

Event System

決定。

---

## Narrative System

Narrative 管理：

人生如何理解這場比賽。

Match 保存：

競技事實。

例如：

同樣是：

九局三振。

Narrative 可能解讀成：

- 成長
- 遺憾
- 轉折
- 解脫

Match 不參與：

意義建立。

---

## Relationship System

Relationship 管理：

人物之間的連結。

Match 可能成為：

Relationship 的契機。

例如：

- 捕手建立信任
- 隊友產生尊敬
- 教練失去信心
- 對手開始欣賞玩家

真正更新：

Relationship，

由：

Relationship System

處理。

---

## Career System

Career 管理：

人生目前的位置。

Match 提供：

是否足以改變 Career 的依據。

例如：

升上一軍、

失去先發、

入選國家隊。

Career 是否改變，

由：

Career System

決定。

---

## Progression System

Progression 管理：

能力如何成長。

Match 提供：

能力是否被充分運用、

哪些能力需要改善、

哪些經驗值得累積。

能力提升，

不由 Match

直接處理。

---

## World System

World 提供：

聯盟、

制度、

文化、

社會環境。

Match 在：

World

建立的規則下運作。

例如：

不同聯盟、

不同年代、

不同文化，

都可能改變：

比賽的重要性、

媒體關注、

球迷反應。

---

## Save System

Save System

負責保存：

- Match Records
- Match History
- Match Statistics
- Match Context

Match 不負責：

存檔流程。

---

## UI System

UI 負責呈現：

- 比賽資訊
- 關鍵時刻
- 成績
- 球員表現
- 歷史紀錄

Match 不決定：

介面如何呈現。

---

# Extension Guidelines

新增 Match 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

競技經歷，

還是：

人生事件？

如果屬於：

人生事件。

應加入：

Event System。

---

## Question 02

新增的是：

競技能力，

還是：

競技結果？

能力：

Progression。

結果：

Match。

---

## Question 03

新增的是：

比賽事實，

還是：

人生意義？

事實：

Match。

意義：

Narrative。

請勿混用。

---

## Question 04

是否真正增加：

玩家需要做出的競技決策？

若沒有，

通常不需要新增：

Opportunity。

---

## Question 05

是否會影響：

世界如何看待這場比賽？

若完全沒有，

請重新評估：

是否需要加入 Match。

---

# Common Mistakes

以下是 Match 最常見的設計錯誤。

---

## Mistake 01

Match 等於棒球規則。

錯誤。

棒球規則，

只是 Match 的背景。

真正的 Match，

是：

競技經歷。

---

## Mistake 02

Match 等於比數。

錯誤。

比分只是：

Result。

真正重要的是：

玩家如何完成比賽。

---

## Mistake 03

Match 直接改變人生。

錯誤。

Match 提供：

競技結果。

人生如何改變，

由：

Event、

Career、

Narrative、

Relationship

共同決定。

---

## Mistake 04

每場比賽都必須完整模擬。

錯誤。

玩家應該體驗：

真正重要的 Opportunity。

而不是：

所有細節。

---

## Mistake 05

勝利代表成功。

錯誤。

一場失敗的比賽，

仍可能是：

玩家人生最重要的一場。

Match 不預設：

勝利才有價值。

---

# Design Philosophy

Match 並不是為了分出勝負。

它存在的目的，

是讓玩家真正站上競技舞台。

每一次上場，

都是一次驗證。

驗證自己的能力、

驗證自己的選擇、

驗證自己是否承擔起眼前的責任。

有些比賽，

改變了 Career。

有些比賽，

改變了 Relationship。

有些比賽，

多年後仍在 Narrative 中留下回聲。

真正值得記住的，

從來不是計分板。

而是：

當機會來臨時，

玩家如何完成屬於自己的那一場比賽。

---

# Summary

Match System 回答的核心問題只有一個：

> 我如何完成這場競技？

它不是：

棒球規則系統。

不是：

能力成長系統。

不是：

人生意義系統。

它負責：

建立競技情境、

提供重要決策、

記錄競技事實、

並將結果交給其他系統，

共同塑造玩家的人生。

每一場 Match，

都只是人生中的一段競技經歷。

真正留下來的，

不是一個比分。

而是：

玩家在球場上，

曾經如何面對那些改變人生的瞬間。