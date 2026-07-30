# 08 Progression System

Version: 2.0

---

# Purpose

Progression System 負責管理玩家的長期成長（Long-term Development）。

它描述：

玩家如何透過學習、
訓練、
經驗、
突破、
退化，

逐漸改變自己的能力。

Progression 並不是：

升級系統。

也不是：

能力值增加系統。

Progression 回答的是：

> 玩家是如何成為現在的自己？

而不是：

> 能力增加了多少？

能力，

只是成長的結果。

真正重要的是：

成長的過程。

---

# Responsibilities

Progression System 負責管理：

- Potential（潛力）
- Learning（學習）
- Training（訓練）
- Experience（經驗累積）
- Growth（成長）
- Plateau（瓶頸）
- Regression（退化）
- Ability（能力）

Progression 不負責：

- 比賽表現
- 劇情事件
- 人際關係
- 職涯發展
- 世界規則
- 短期狀態

---

# Not Responsible

## Match

Match 負責：

玩家如何完成一場競技。

Progression 負責：

玩家是否具備完成競技的能力。

能力，

並不等於：

表現。

---

## Career

Career 保存：

玩家目前的人生位置。

Progression 保存：

玩家累積出的能力。

兩者彼此影響，

但互不取代。

---

## Narrative

Narrative 管理：

人生如何理解成長。

Progression 管理：

能力如何改變。

例如：

球速提升。

Progression 保存：

能力增加。

Narrative 保存：

這次成長在人生中的意義。

---

## Relationship

Relationship 管理：

人物之間的連結。

Progression 不保存：

任何人物關係。

---

## Event

Event 管理：

人生發生了什麼。

Progression 管理：

事件之後，

玩家如何逐漸改變。

事件，

可能成為成長契機。

但事件本身，

不是 Progression。

---

## Condition

Condition 管理：

短期身體與心理狀態。

例如：

- 疲勞
- 睡眠不足
- 狀況火熱
- 壓力
- 感冒

Condition

可能影響：

今日表現。

但不改變：

Ability。

---

# Core Concepts

Progression 並不是：

數值增加。

Progression 是：

一段持續累積的人生成長。

真正改變玩家的，

不是：

某一次升級。

而是：

無數次學習、

訓練、

失敗、

調整、

再次挑戰。

---

# Human Development Layer

玩家的能力，

依照以下流程逐漸形成。

```text
Potential

↓

Learning

↓

Training

↓

Experience

↓

Growth

├── Plateau
│
└── Regression

↓

Ability

↓

Adaptation

↓

Performance（Match）
```

每一層，

都代表不同的人生成長階段。

任何能力的改變，

都應能追溯：

它是如何形成的。

---

## Potential

Potential

代表：

玩家目前仍可能達到的上限。

潛力，

不是能力。

它代表：

未來仍有多少可能性。

潛力可能受到：

- 天賦
- 年齡
- 身體條件
- 長期訓練
- 傷勢
- 人生選擇

共同影響。

---

## Learning

Learning

代表：

玩家理解新的知識。

例如：

- 新投球機制
- 新揮棒技巧
- 配球觀念
- 守備站位
- 心理調整

Learning

並不直接增加能力。

它提供：

未來成長的方向。

---

## Training

Training

代表：

將 Learning

轉化為身體能力。

例如：

- 重量訓練
- 技術訓練
- 重複練習
- 功能性訓練
- 心理訓練

Training

是：

知識轉化為能力的重要階段。

# Progression Lifecycle

Progression 並不是：

訓練

↓

能力增加。

真正的成長，

是一段持續累積、

反覆修正的過程。

生命週期如下：

```text
Potential

↓

Learning

↓

Training

↓

Experience

↓

Assimilation

↓

Growth

↓

Ability
```

成長，

並不是必然。

玩家可能：

停滯、

退步、

甚至重新開始。

---

# Experience

Experience

代表：

玩家實際累積的人生與競技經驗。

例如：

- 正式比賽
- 長期訓練
- 重大失敗
- 重大成功
- 受傷復健
- 與教練合作
- 與隊友配合

Experience

提供：

成長的素材。

但並不保證：

能力提升。

---

# Assimilation

Assimilation

代表：

玩家將經驗轉化為能力的過程。

例如：

比賽中，

發現自己容易追打壞球。

如果沒有思考、

修正、

重新訓練，

這場比賽，

只是一段 Experience。

只有真正理解原因，

並調整行為，

才會形成：

Growth。

Assimilation

回答的是：

> 玩家是否真正學會了？

---

# Growth

Growth

代表：

能力開始產生長期改變。

例如：

- 揮棒效率提升
- 配球理解提升
- 控球更加穩定
- 守備判斷改善

Growth

通常來自：

多次 Assimilation

累積而成。

Growth

不是：

瞬間提升。

而是：

逐漸累積。

---

# Plateau

Plateau

代表：

玩家目前的成長方式，

已經接近極限。

例如：

同樣的訓練，

開始沒有明顯效果。

這並不代表：

玩家退步。

而代表：

需要新的刺激。

Plateau

可能需要：

- 改變訓練方式
- 技術修正
- 心理突破
- 教練介入
- 休息恢復

才能再次開始成長。

---

# Regression

Regression

代表：

玩家能力開始下降。

原因可能包括：

- 年齡
- 長期傷勢
- 訓練不足
- 過度疲勞
- 技術流失

Regression

並不代表：

玩家失敗。

有些能力下降時，

其他能力，

反而可能提升。

例如：

速度下降，

但閱讀比賽能力提升。

Progression

應允許：

不同能力，

有不同的發展方向。

---

# Ability

Ability

代表：

玩家目前真正具備的能力。

Ability

是：

整個 Progression

累積出的結果。

它不是：

一次事件、

一次訓練、

一次比賽，

就能永久改變的數值。

Ability

應具有：

長期穩定性。

---

# Adaptation

Adaptation

代表：

玩家是否能在目前環境，

充分發揮自己的 Ability。

例如：

高中王牌，

升上一軍後，

Ability 並沒有下降。

但因為：

比賽節奏、

對手強度、

心理壓力、

戰術要求，

都發生改變。

因此，

Adaptation

可能暫時偏低。

隨著：

經驗累積、

環境熟悉、

角色穩定，

Adaptation

逐漸提高。

Ability

沒有改變。

Performance

卻會逐漸改善。
# Lifecycle

Progression 並不是：

每天訓練，

每天變強。

真正的人生成長，

是一段反覆調整、

累積、

突破、

停滯、

再次成長的循環。

生命週期如下：

```text
Potential

↓

Learning

↓

Training

↓

Experience

↓

Assimilation

↓

Growth

↓

Ability

↓

Adaptation

↓

Performance（Match）
```

Performance

又會產生新的：

Experience。

因此，

Progression

形成一個持續循環。

---

# Data Flow

Progression 與其他 System 的資料流如下：

```text
Event
        │
        ▼
Learning
        │
        ▼
Training
        │
        ▼
Experience
        │
        ▼
Assimilation
        │
        ▼
Ability Updated
        │
        ▼
Adaptation
        │
        ▼
Match Performance
        │
        ▼
New Experience
```

Progression

永遠是一個開放循環。

沒有真正的終點。

---

# Progression Update Flow

能力更新流程如下：

```text
Training Completed

↓

Generate Experience

↓

Need Assimilation？

├── No
│
└── Yes
      ↓

Growth Calculated

↓

Need Plateau？

├── Yes
│
└── No

↓

Update Ability

↓

Update Adaptation

↓

Notify Match System
```

並不是：

每一次 Training，

都一定提升 Ability。

真正決定能力改變的，

是：

Assimilation

是否成功。

---

# Architecture Rules

Progression System 必須遵守以下規則。

---

## Rule 01

Ability 與 Performance 必須分離。

Ability

代表：

真正具備的能力。

Performance

代表：

比賽中的實際發揮。

兩者不可混用。

---

## Rule 02

Experience 不等於 Growth。

任何經驗，

都只是素材。

只有真正完成：

Assimilation，

才可能形成：

Growth。

---

## Rule 03

Progression 必須允許 Plateau。

停滯，

是正常的人生歷程。

玩家不應：

永遠持續成長。

Plateau

應促使玩家：

重新思考、

重新學習、

重新選擇。

---

## Rule 04

Progression 必須允許多種 Development Path。

相同 Ability，

可能來自：

- 重量訓練
- 技術修正
- 心理成長
- 身體成熟
- 比賽經驗
- 教練指導

不同路徑，

可能導向：

不同瓶頸、

不同傷病風險、

不同突破方式。

Progression

不預設：

唯一成長模式。

---

## Rule 05

Progression 必須允許 Regression。

能力下降，

也是人生的一部分。

不同能力，

可以：

同時成長、

同時退化。

例如：

速度下降，

閱讀能力提升。

---

## Rule 06

Progression 必須保留可追溯性。

任何 Ability，

都應能回答：

它是如何形成的？

例如：

來自：

哪些訓練、

哪些經驗、

哪些教練、

哪些事件、

哪些人生階段。

玩家多年後，

仍能理解：

自己的成長歷程。

---

# Development Path

Development Path

代表：

玩家累積能力的方法。

例如：

### Physical Path

透過：

力量、

爆發力、

體能，

建立能力。

---

### Technical Path

透過：

投球機制、

揮棒動作、

守備技巧，

建立能力。

---

### Tactical Path

透過：

閱讀比賽、

配球、

戰術理解，

建立能力。

---

### Mental Path

透過：

抗壓、

自信、

專注、

心理成熟，

建立能力。

---

### Hybrid Path

大部分球員，

都會同時經歷：

多種 Development Path。

Progression

應允許：

不同路徑，

共同形成 Ability。

---

# Progression Influence

Progression

可能影響：

- Match Performance
- Career Opportunity
- Training Efficiency
- Injury Risk
- Coach Evaluation
- Event Pool
- Adaptation Speed

Progression

不直接控制：

上述系統。

它提供：

玩家能力變化，

作為其他 System 的依據。
## Match System

Match 管理：

玩家如何完成一場競技。

Progression 提供：

玩家目前具備的能力。

Match 使用：

- Ability
- Adaptation
- Condition

共同形成：

Performance。

Progression 不決定：

比賽結果。

---

## Career System

Career 管理：

玩家目前的人生位置。

Progression 管理：

玩家累積出的能力。

Career 可能開放：

新的訓練、

新的教練、

新的比賽。

Progression 則決定：

玩家是否能真正掌握這些機會。

---

## Event System

Event 提供：

改變人生的重要契機。

例如：

- 遇見新教練
- 重大傷勢
- 海外移籍
- 技術改革
- 重要失敗

Progression

將這些事件，

逐漸轉化為能力改變。

---

## Narrative System

Narrative 管理：

玩家如何理解自己的成長。

Progression 管理：

玩家如何真正改變。

例如：

同樣提升球速。

Progression 保存：

能力增加。

Narrative 保存：

這段努力在人生中的意義。

---

## Relationship System

Relationship 管理：

人物之間的連結。

教練、

隊友、

對手，

都可能影響：

Learning、

Training、

Assimilation。

但人物關係，

仍由：

Relationship System

保存。

---

## Injury System

Injury 管理：

身體損傷與恢復。

Progression 管理：

傷勢是否改變能力。

例如：

短期傷勢：

Condition

下降。

Ability

維持。

重大傷勢：

可能造成：

Regression。

復健完成後，

Progression

重新建立：

Growth。

---

## Save System

Save System

負責保存：

- Ability
- Potential
- Development Path
- Growth History
- Plateau History
- Regression History

Progression

不負責：

存檔流程。

---

## UI System

UI 負責呈現：

- 能力
- 成長方向
- 訓練成果
- 瓶頸
- 適應狀態
- 發展路徑

Progression

不決定：

介面呈現方式。

---

# Extension Guidelines

新增 Progression 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

能力，

還是：

表現？

能力：

Progression。

表現：

Match。

---

## Question 02

新增的是：

長期成長，

還是：

短期狀態？

長期：

Progression。

短期：

Condition。

請勿混用。

---

## Question 03

新增的是：

新的能力，

還是：

新的成長方式？

若只是：

改變能力形成過程。

應優先擴充：

Development Path。

而不是：

增加 Ability。

---

## Question 04

是否真正改變：

玩家能力？

若沒有，

通常不是：

Progression。

---

## Question 05

是否能回答：

「玩家為什麼會變強？」

如果不能，

請重新評估：

是否屬於 Progression。

---

# Common Mistakes

以下是 Progression 最常見的設計錯誤。

---

## Mistake 01

Progression 等於升級。

錯誤。

Progression

描述的是：

人成長的歷程。

不是：

Level Up。

---

## Mistake 02

Training 一定帶來 Growth。

錯誤。

Training

只是：

累積 Experience。

真正形成成長，

仍需要：

Assimilation。

---

## Mistake 03

Ability 等於 Performance。

錯誤。

Ability

代表：

真正能力。

Performance

代表：

當下發揮。

兩者不可混用。

---

## Mistake 04

玩家應持續變強。

錯誤。

真正的人生，

包含：

Plateau、

Regression、

重新開始。

---

## Mistake 05

能力只有一種形成方式。

錯誤。

不同球員，

可以透過：

不同的 Development Path，

形成相近的 Ability。

這也是每位球員風格不同的原因。

---

# Design Philosophy

Progression 並不是：

讓玩家變得越來越強。

它真正想描述的是：

一個人，

如何在漫長的人生中，

逐漸改變自己。

有些改變，

來自努力。

有些改變，

來自失敗。

有些改變，

來自受傷。

有些改變，

來自一位教練、

一句提醒、

一次重新開始。

真正重要的，

從來不是能力增加了多少。

而是：

玩家是否願意持續學習、

修正、

突破瓶頸、

重新適應新的環境。

能力，

只是這段旅程留下的結果。

成長，

才是 Progression 真正保存的內容。

---

# Summary

Progression System 回答的核心問題只有一個：

> 我是如何成為現在的自己？

它不是：

升級系統。

不是：

能力值系統。

不是：

經驗值系統。

它負責：

保存玩家的成長歷程、

管理能力形成的過程、

描述瓶頸與突破、

記錄退化與重新開始、

並將能力提供給其他系統，

共同塑造整段棒球人生。

每一次真正的成長，

都不是因為數值增加。

而是因為：

玩家學會了昨天還不會的事情，
並把它變成了自己的一部分。