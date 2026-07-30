# 16 UI System

Subtitle:

Player Experience System

Version:

2.0

---

# Purpose

UI System

負責管理：

玩家如何理解、

操作、

感受

整個《棒球人生》。

它回答的核心問題是：

> 玩家現在應該看到什麼？

UI

不是：

Gameplay。

不是：

資料來源。

不是：

AI。

UI

只是：

玩家與世界之間的介面。

---

# Responsibilities

UI System

負責管理：

- Information Presentation
- Interaction
- Navigation
- Layout
- Feedback
- Visual Hierarchy
- Information Density
- Input Flow
- Notification
- Accessibility
- Readability
- User Guidance

UI

負責：

呈現。

不是：

決定。

---

# Not Responsible

UI

不負責：

- Player
- Coach
- Injury
- Career
- World
- Organization
- Relationship
- Match
- Decision
- Progression
- Save

UI

只能：

讀取。

不能：

修改真實資料。

---

# Core Concepts

UI

不是：

遊戲。

UI

是：

玩家理解遊戲的方法。

同一份資料，

可以有：

不同 UI。

Gameplay

不需要改變。

---

# Player Experience

UI

真正管理的是：

玩家體驗。

不是：

畫面。

例如：

玩家：

不知道：

Coach Trust：

72。

但是：

知道：

```text
教練最近開始願意讓你打先發。
```

UI

提供：

理解。

不是：

內部數值。

---

# Information Layer

UI

應建立：

資訊層級。

```text
Reality

↓

System Data

↓

UI Interpretation

↓

Player Understanding
```

玩家

永遠看到：

最適合目前理解的資訊。

不是：

全部資料。

---

# Information Priority

所有資訊，

都應排序。

第一層：

現在最重要。

例如：

```text
今天有比賽。
```

第二層：

目前狀態。

例如：

```text
疲勞偏高。
```

第三層：

背景資訊。

例如：

```text
教練最近開始信任你。
```

第四層：

深入資料。

例如：

揮棒品質、

投球分布、

進階數據。

---

# Progressive Disclosure

UI

應遵守：

Progressive Disclosure。

玩家：

先看到：

需要知道的。

想深入，

再展開。

例如：

首頁：

```text
控球：

普通。
```

點進去：

```text
BB%

Zone%

Command

Release Consistency
```

不要：

第一次：

全部攤開。

---

# Action First

玩家

每天最重要的是：

```text
今天要做什麼？
```

不是：

```text
能力是多少？
```

因此：

主畫面

應回答：

```text
今天

↓

可以做哪些事？
```

不是：

全部資料。

---

# Life First

《棒球人生》

核心不是：

能力值。

而是：

人生。

因此：

主畫面

優先順序：

```text
今天

↓

事件

↓

人物

↓

選擇

↓

結果

↓

數值
```

不是：

```text
能力

↓

能力

↓

能力
```

---

# Data Second

數值：

重要。

但：

不是第一順位。

例如：

玩家：

應先知道：

```text
今天揮棒感覺很好。
```

再決定：

是否查看：

```text
Contact：

72→73
```

UI

先提供：

感受。

再提供：

資料。

---

# User Journey

玩家：

每天：

流程：

```text
登入

↓

今天發生什麼？

↓

現在可以做什麼？

↓

做出選擇

↓

得到回饋

↓

進入下一天
```

UI

應：

引導：

Journey。

不是：

讓玩家自己找。

---

# Navigation Philosophy

Navigation

應：

符合人生。

不是：

符合程式。

例如：

玩家：

想看：

自己。

就進：

Player。

不是：

Character Data Table。

---

# UI Identity

UI

代表：

玩家眼中的世界。

不是：

程式眼中的世界。

例如：

Player：

Power：

72。

UI：

```text
力量：

優秀。
```

若玩家：

想知道更多。

再展開：

72。

---

# Visual Hierarchy

所有畫面，

只能有：

一個主角。

例如：

首頁：

今天。

人物頁：

角色。

比賽頁：

比賽。

不要：

所有資訊：

一樣重要。

---

# Information Density

UI

資訊密度：

應隨平台不同。

---

## Mobile

重點：

Action First。

一個畫面：

回答：

一個問題。

例如：

```text
今天要去哪？
```

不要：

十個資訊區。

---

## Desktop

重點：

Context First。

可同時：

呈現：

更多資訊。

例如：

左：

人生。

中：

事件。

右：

人物。

下：

歷史。

---

## Shared Principle

手機、

PC

共用：

相同資料。

不同：

呈現方式。

不是：

不同 Gameplay。

---

# Core Data

UI

至少管理：

```text
Layout

Navigation

Presentation

Interaction

Feedback

Information Priority

Information Density

Accessibility

Notification

Player Guidance
```

UI

真正管理的是：

玩家如何理解世界。

不是：

世界如何運作。

# Lifecycle

UI

生命週期：

```text
Game Start

↓

Load UI

↓

Read Gameplay State

↓

Build Presentation

↓

Player Interaction

↓

Gameplay Response

↓

Update UI

↓

Repeat
```

UI

永遠：

跟隨 Gameplay。

不是：

領導 Gameplay。

---

# UI Pipeline

每一次操作：

都應遵守：

```text
Gameplay State

↓

UI Presentation

↓

Player Input

↓

Gameplay Decision

↓

Gameplay Update

↓

UI Refresh
```

UI

不應：

直接修改：

Gameplay。

---

# Rendering Flow

UI

每一次更新：

流程：

```text
Read State

↓

Determine Priority

↓

Build Components

↓

Render

↓

Receive Input

↓

Update
```

UI

只讀取：

目前狀態。

不要：

自行推測：

世界。

---

# Player Input Flow

所有操作：

應遵守：

```text
Player

↓

Input

↓

UI

↓

Gameplay System

↓

Gameplay Result

↓

UI Update
```

不是：

```text
Player

↓

UI

↓

直接改變資料
```

---

# Interaction Model

UI

所有互動：

都應回答：

玩家：

現在想做什麼？

例如：

```text
今天要訓練

今天要休息

今天想聊天

今天想看能力

今天想看比賽
```

不要：

要求玩家：

先理解：

系統架構。

---

# Daily Gameplay Loop

《棒球人生》

每天：

主要流程：

```text
今日開始

↓

閱讀今日資訊

↓

確認目前狀態

↓

選擇今日行動

↓

事件發生

↓

世界更新

↓

一天結束
```

UI

應自然引導：

這個循環。

---

# Main Screen

主畫面

回答：

```text
今天發生什麼？

現在可以做什麼？
```

至少包含：

- 今日日期
- 今日事件
- 今日可執行行動
- 玩家目前狀態
- 下一步入口

不是：

全部能力。

---

# Player Screen

Player

回答：

```text
我是誰？
```

例如：

- 身份
- 能力
- 特質
- 生涯定位
- 長期成長

不是：

世界資訊。

---

# Relationship Screen

回答：

```text
誰正在影響我？
```

例如：

- 家人
- 隊友
- 教練
- 對手
- 導師

玩家

不用：

翻資料。

一眼知道：

目前重要人物。

---

# Coach Screen

回答：

```text
教練怎麼看我？
```

例如：

目前定位：

```text
值得期待的新秀
```

近期觀察：

```text
最近揮棒節奏變慢。
```

未來期待：

```text
若能改善守備，

有機會升上一軍。
```

UI

應呈現：

教練觀點。

不是：

Coach AI。

---

# Injury Screen

回答：

```text
我的身體怎麼了？
```

例如：

目前：

恢復中。

預估：

三週。

建議：

降低訓練量。

玩家

不用：

理解：

Medical Logic。

---

# Career Screen

回答：

```text
我的人生走到哪？
```

例如：

- 所屬球隊
- 層級
- 生涯里程碑
- 生涯紀錄
- 榮譽

Career

不是：

能力。

---

# World Screen

回答：

```text
世界正在發生什麼？
```

例如：

- 聯盟消息
- 球員交易
- 選秀
- 季後賽
- 制度改變

玩家

可以：

了解：

世界。

不用：

看 Database。

---

# Match Screen

回答：

```text
這場比賽發生什麼？
```

不是：

所有數據。

而是：

比賽故事。

例如：

```text
前兩局控球不穩。

第三局開始找回節奏。

七局失掉唯一一分。

球隊逆轉成功。
```

深入：

再看：

Box Score。

---

# Story Screen

回答：

```text
目前故事走到哪？
```

例如：

目前：

```text
與高橋的競爭

逐漸升溫。
```

不是：

Story Tree。

---

# Decision Screen

回答：

```text
我現在要選什麼？
```

例如：

今天：

是否接受：

新的守備位置？

是否提前復出？

是否轉學？

UI

應聚焦：

目前選擇。

不要：

同時展示：

全部未來。

---

# Feedback

每個操作：

都應有：

回饋。

例如：

```text
訓練完成。

Contact：

略有提升。

教練：

注意到你的努力。
```

玩家

必須知道：

自己影響了世界。

---

# Immediate Feedback

短期：

例如：

```text
疲勞增加。

信心提升。

隊友印象改變。
```

立即：

呈現。

---

# Delayed Feedback

長期：

例如：

半年後：

```text
當初那次休息，

避免了一次重大傷病。
```

UI

應：

讓玩家：

理解：

延遲結果。

---

# Notification

Notification

只通知：

值得注意的事情。

例如：

- 升隊
- 重大傷病
- 新事件
- 關係變化
- 合約
- 選秀

不要：

所有事情：

都跳通知。

---

# Information Timing

資訊

應在：

適當時間：

出現。

例如：

不要：

先告訴玩家：

```text
這個選項

會增加：

Trust +3
```

應：

事件後：

呈現：

```text
教練開始更相信你。
```

UI

保留：

探索。

---

# Visual Feedback

重要事件：

應：

有：

不同層級。

例如：

一般：

文字。

重大：

動畫、

音效、

特殊畫面。

例如：

- 初次先發
- 職業選秀
- 一軍初登場
- 奪冠
- 引退

---

# Navigation Flow

所有頁面：

應：

三步內：

抵達。

例如：

首頁

↓

Player

↓

能力

不要：

六層選單。

---

# UI State

UI

自己管理：

例如：

```text
目前頁面

展開內容

排序方式

篩選

捲動位置
```

不要：

寫進：

Gameplay。

---

# UI Cache

UI

可建立：

Temporary Cache。

例如：

圖片、

Icon、

排行榜排序。

全部：

屬於：

Transient。

不要：

Save。

---

# Relationship with Other Systems

---

## Player

讀取：

Player。

呈現：

玩家。

---

## Identity

讀取：

Identity。

呈現：

角色定位。

---

## Narrative

讀取：

Narrative。

呈現：

故事。

---

## Relationship

讀取：

Relationship。

呈現：

人物。

---

## Event

讀取：

Event。

呈現：

事件。

---

## Career

讀取：

Career。

呈現：

生涯。

---

## Match

讀取：

Match。

呈現：

比賽。

---

## Progression

讀取：

Progression。

呈現：

成長。

---

## Decision

讀取：

Decision。

呈現：

目前選項。

---

## Current State

讀取：

Current State。

呈現：

目前狀態。

---

## World

讀取：

World。

呈現：

世界。

---

## Organization

讀取：

Organization。

呈現：

球隊。

---

## Injury

讀取：

Injury。

呈現：

身體。

---

## Coach

讀取：

Coach。

呈現：

教練觀點。

---

## Save

讀取：

Save Metadata。

例如：

存檔時間、

遊玩時間、

版本。

UI

不讀取：

Save Logic。
# Data Flow

UI

位於：

所有 Gameplay System

之外。

資料流：

```text
Gameplay Systems

↓

Read State

↓

UI Interpretation

↓

Presentation

↓

Player

↓

Input

↓

Gameplay Systems
```

UI

位於：

Gameplay

與

Player

之間。

不是：

Gameplay 本身。

---

# UI Data Flow

所有資料：

都遵循：

```text
System State

↓

Read

↓

Transform

↓

Display
```

UI

不保存：

真正資料。

UI

只建立：

Presentation。

---

# Read Only Principle

UI

預設：

Read Only。

例如：

Player：

```text
Power：

72
```

UI：

讀取：

72。

顯示：

```text
力量：

優秀。
```

真正修改：

仍由：

Player System。

---

# Presentation Layer

Presentation

代表：

資料如何被理解。

不是：

資料本身。

例如：

Current State：

```text
Fatigue：

82
```

UI：

可呈現：

```text
非常疲勞
```

或：

```text
疲勞值：

82
```

Gameplay

完全相同。

---

# Presentation Model

建議：

不要：

直接把 Gameplay Data

送進 UI。

應建立：

Presentation Model。

例如：

```text
Player

↓

Player Presentation

↓

UI
```

Presentation

負責：

轉換：

適合閱讀的資訊。

不是：

修改資料。

---

# View Model

每個主要畫面，

建議建立：

自己的 View Model。

例如：

```text
Player View

Career View

Coach View

Match View

Relationship View
```

不要：

所有 UI

共用：

同一份大型資料。

---

# Information Transformation

UI

可以：

轉換：

呈現方式。

例如：

```text
Power：

72
```

↓

```text
優秀
```

↓

```text
★★★★☆
```

↓

```text
長打能力值得期待。
```

資料：

沒有改變。

---

# Adaptive Presentation

同一份資料，

可依：

玩家需求：

不同呈現。

例如：

新手：

```text
最近揮棒越來越好。
```

進階玩家：

```text
Contact：

72→74
```

棒球玩家：

```text
Contact：

74

Hard Contact：

提升
```

Gameplay

完全一致。

---

# Information Depth

UI

資訊深度：

可逐層增加。

Level 1：

生活理解。

例如：

```text
最近狀況很好。
```

Level 2：

能力理解。

```text
Contact：

74
```

Level 3：

棒球理解。

```text
Contact

Zone Contact

Chase Contact

Quality Contact
```

玩家

自行決定：

深入程度。

---

# UI Components

所有 UI

應拆分：

Component。

例如：

```text
Status Panel

Character Card

Timeline

Notification

Dialogue Box

Action Button

Progress Bar

Relationship Card
```

不要：

一個巨大畫面。

---

# Component Independence

每個 Component

應：

只負責：

一件事。

例如：

Status Panel：

只顯示：

狀態。

不要：

同時：

修改能力、

播放劇情、

控制存檔。

---

# Reusable Components

同一種資訊，

應使用：

相同 Component。

例如：

Relationship Card

可出現在：

首頁、

人物、

事件、

教練、

球隊。

不要：

五套不同版本。

---

# UI Composition

完整畫面：

由：

Component

組成。

例如：

```text
Main Screen

├── Header

├── Today Panel

├── Player Status

├── Event Panel

├── Action List

├── Notification

└── Footer
```

每個 Component

獨立更新。

---

# State Synchronization

UI

不能：

自行維護：

另一份 Gameplay State。

例如：

Player：

Power：

73。

UI

不得：

另外保存：

Power：

72。

UI

只同步：

目前狀態。

---

# Refresh Strategy

UI

更新：

應：

事件驅動。

例如：

```text
Player Updated

↓

Refresh Player Panel
```

不是：

全部畫面：

重新建立。

---

# Lazy Loading

資訊量大時，

建議：

Lazy Loading。

例如：

歷史紀錄、

完整生涯、

球員百科、

聯盟資料。

只有：

玩家開啟：

才建立。

---

# Responsive Layout

Mobile

與

Desktop

共用：

相同資訊。

不同：

Layout。

例如：

Mobile：

```text
垂直排列
```

Desktop：

```text
左右排列
```

資料：

一致。

---

# Accessibility

UI

應支援：

- 清楚字級
- 高對比
- 色彩辨識
- 操作回饋
- 一致 Icon
- 一致用語

不要：

依賴：

單一顏色。

例如：

紅色：

不能是：

唯一警告方式。

---

# Localization

所有文字，

應：

集中管理。

不要：

硬寫：

Component。

例如：

```text
Fatigue
```

↓

繁中：

疲勞

英文：

Fatigue

日文：

疲労
```

UI

不應：

直接寫死：

語言。

---

# Animation

Animation

目的：

強化理解。

不是：

展示效果。

例如：

能力提升：

小幅動畫。

重大事件：

特殊演出。

不要：

每個按鈕：

都有：

大型動畫。

---

# Audio Feedback

音效：

應：

協助：

理解。

例如：

一般按鈕：

普通。

重大事件：

特殊音效。

不要：

全部：

相同。

---

# Relationship with Other Systems

---

## Player

讀取：

Player Presentation。

不是：

Player Logic。

---

## Identity

呈現：

Identity。

不推導：

Identity。

---

## Narrative

呈現：

Story Progress。

不是：

Narrative Flow。

---

## Relationship

呈現：

Relationship。

不是：

Relationship Simulation。

---

## Event

呈現：

Event。

不是：

Event Trigger。

---

## Career

呈現：

Career。

不是：

Career Decision。

---

## Match

呈現：

Match。

不是：

Match Engine。

---

## Progression

呈現：

Progression。

不是：

Progression Logic。

---

## Decision

呈現：

Choice。

不是：

Decision Algorithm。

---

## Current State

呈現：

目前身體、

心理、

狀態。

不是：

更新規則。

---

## World

呈現：

世界。

不是：

Simulation。

---

## Organization

呈現：

球團。

不是：

球團管理。

---

## Injury

呈現：

傷病。

不是：

Medical System。

---

## Coach

呈現：

Coach Observation。

不是：

Coach Thinking。

---

## Save

呈現：

Save Metadata。

不是：

Persistence。

#Architecture Rules

## Rule 01

UI

永遠：

不是：

Source of Truth。

---

## Rule 02

UI

預設：

Read Only。

---

## Rule 03

所有 Gameplay

由：

Gameplay System。

不是：

UI。

---

## Rule 04

Presentation

≠

Gameplay。

---

## Rule 05

Component

一個：

一個責任。

---

## Rule 06

UI

不得：

建立：

第二份 Gameplay State。

---

## Rule 07

同一份資料，

可以：

多種 Presentation。

---

## Rule 08

Information

依：

玩家理解程度：

逐層展開。

---

## Rule 09

Mobile

與 Desktop

共用：

同一份資料。

---

## Rule 10

UI

只回答：

玩家目前最需要知道的事。

不是：

所有事情。

# Extension Guidelines

新增任何 UI 前，

先回答：

玩家需要：

理解什麼？

不是：

程式有什麼資料。

---

## Question 01

新增的是：

新的 Gameplay，

還是：

新的 Presentation？

例如：

新增：

球探系統。

Gameplay：

新增。

需要：

新 System。

不是：

UI。

但是：

新增：

球探報告畫面。

屬於：

UI。

---

## Question 02

玩家：

真的需要：

立即知道嗎？

例如：

今天：

疲勞增加。

需要：

立即呈現。

但是：

某個 NPC

心情下降：

1 點。

通常：

不需要通知。

---

## Question 03

玩家：

需要：

數值，

還是：

理解？

例如：

```text
Fatigue：

83
```

可以：

轉換：

```text
身體開始接近極限。
```

UI

優先提供：

理解。

---

## Question 04

資訊：

應放在哪一層？

例如：

首頁：

```text
最近狀況很好。
```

Player：

```text
Contact：

74
```

Advanced：

完整數據。

不要：

首頁：

全部展開。

---

## Question 05

是否：

已有 Component？

例如：

Relationship Card。

如果：

已有。

不要：

重新做：

另一張。

---

## Question 06

是否：

已有畫面？

例如：

Coach Report。

新增：

Coach Evaluation。

應：

整合。

不要：

增加：

第六個 Coach 頁。

---

## Question 07

玩家：

會主動找嗎？

如果：

會。

放：

第二層。

如果：

不會。

放：

首頁提醒。

---

## Question 08

是否：

真的需要：

通知？

不是：

每件事情。

都跳：

Notification。

重大事情：

才通知。

---

## Question 09

玩家：

是否需要：

現在做決定？

如果：

不用。

不要：

打斷流程。

---

## Question 10

新增 UI

是否：

破壞：

Daily Gameplay Loop？

若：

玩家每天：

要多點：

三個頁面。

代表：

設計失敗。

---

# UI Hierarchy

所有資訊：

應遵守：

四層。

Level 1：

立即行動。

例如：

```text
今天可以做什麼？
```

---

Level 2：

目前理解。

例如：

```text
最近打擊變好了。
```

---

Level 3：

詳細資訊。

例如：

能力、

關係、

球隊、

歷史。

---

Level 4：

進階分析。

例如：

進階棒球數據、

完整事件、

完整歷史。

---

# Information Economy

UI

資訊：

不是越多越好。

真正重要的是：

資訊成本。

玩家：

每閱讀：

一項資訊。

都會消耗：

注意力。

因此：

UI

應節省：

玩家思考成本。

不是：

增加資訊量。

---

# Cognitive Load

UI

應控制：

認知負荷。

例如：

不要：

同一畫面：

同時出現：

- 十個按鈕
- 六個通知
- 五個事件
- 二十個能力

玩家：

不知道：

先看哪裡。

---

# Attention Management

UI

真正管理的是：

玩家注意力。

例如：

重大事件：

畫面中央。

普通事件：

側欄。

背景資訊：

第二層。

不是：

全部：

一樣大。

---

# Decision Support

UI

可以：

提供：

決策資訊。

不能：

代替：

決策。

例如：

可以：

告訴玩家：

```text
疲勞偏高。

三天後有比賽。

教練希望你保持健康。
```

不能：

直接標示：

```text
最佳答案：

休息。
```

---

# Emotional Pacing

UI

不只管理：

資訊。

也管理：

情緒節奏。

例如：

一般訓練：

快速。

重大比賽：

放慢。

選秀：

完整演出。

退休：

完整回顧。

節奏

也是：

UI。

---

# Empty Space

留白：

不是：

浪費。

留白：

讓重要資訊：

更重要。

不要：

所有地方：

都放滿。

---

# Consistency

所有：

按鈕、

Icon、

字體、

顏色、

動畫、

互動。

都應一致。

一致：

降低：

學習成本。

---

# Discoverability

玩家

應自然發現：

功能。

不是：

閱讀：

說明書。

例如：

新的：

人物頁。

第一次：

進入時：

自然提示。

不是：

跳出：

二十頁教學。

---

# Learnability

玩家

第一次：

不知道。

沒關係。

第二次：

知道。

第三次：

形成習慣。

UI

應幫助：

建立習慣。

---

# Mastery

高手

應：

比新手：

看到更多。

不是：

因為：

UI 不同。

而是：

理解更深。

同一個：

Coach Report。

新手：

看到：

```text
教練開始相信你。
```

高手：

會：

點開：

完整觀察紀錄。

---

# Failure Communication

任何錯誤：

都應：

清楚。

例如：

不要：

```text
Unknown Error
```

應：

```text
目前無法存檔。

請確認儲存空間，

或稍後再試。
```

玩家：

知道：

下一步。

---

# Offline Experience

若：

支援離線。

UI

應：

清楚表示：

目前：

哪些功能：

可使用。

哪些：

需要：

網路。

---

# Performance

UI

應：

快速。

例如：

切換：

人物頁。

不應：

等待：

兩秒。

玩家：

等待：

就是：

中斷體驗。

---

# Scalability

未來：

新增：

任何 System。

例如：

- Fan
- Media
- Finance
- Scouting
- International

UI

不應：

全部重做。

只需：

新增：

新的 Presentation。

---

# Future Proof

UI

應能：

支援：

未來：

更多：

- 能力
- NPC
- 球隊
- 聯盟
- 國家
- 劇情

不用：

重新設計：

整個介面。

---

# Common Mistakes

---

## Mistake 01

UI

直接修改：

Gameplay。

錯。

---

## Mistake 02

首頁：

放全部資訊。

錯。

---

## Mistake 03

所有資訊：

同等重要。

錯。

---

## Mistake 04

通知：

全部跳。

錯。

---

## Mistake 05

玩家：

需要：

一直翻頁。

錯。

---

## Mistake 06

每新增功能：

新增一個頁面。

錯。

---

## Mistake 07

數值：

全部公開。

錯。

應依：

理解層級。

---

## Mistake 08

畫面：

塞滿。

錯。

---

## Mistake 09

UI：

開始負責：

Gameplay。

錯。

---

## Mistake 10

不同頁面：

不同操作方式。

錯。

---

## Mistake 11

重要事件：

沒有特殊演出。

錯。

---

## Mistake 12

一般事件：

演出過長。

錯。

---

## Mistake 13

所有玩家：

看到：

完全一樣資訊。

錯。

應：

允許：

逐步深入。

---

## Mistake 14

Tutorial：

一次教全部。

錯。

---

## Mistake 15

新增：

System。

UI：

全部重做。

錯。

---

## Mistake 16

UI

沒有：

情緒節奏。

錯。

---

## Mistake 17

玩家：

不知道：

下一步。

錯。

---

## Mistake 18

資料：

很多。

理解：

很少。

錯。

---

## Mistake 19

資訊：

太少。

玩家：

沒有判斷依據。

錯。

---

## Mistake 20

UI：

替玩家：

做決定。

錯。

---

# Design Philosophy

UI

不是：

裝飾。

不是：

美術。

不是：

功能集合。

UI

真正的責任是：

讓玩家理解：

自己的人生。

《棒球人生》

不是：

經營資料庫。

不是：

能力模擬器。

而是：

一段棒球人生。

因此：

玩家每天打開遊戲，

第一眼應該看到的，

不是：

能力值。

而是：

今天。

今天發生什麼？

今天可以做什麼？

今天，

誰正在影響你？

今天，

你想成為什麼樣的球員？

---

好的 UI

不是：

讓玩家看到：

全部。

而是：

讓玩家在對的時間，

看到對的資訊。

---

真正成熟的 UI

應做到：

```text
玩家幾乎感覺不到 UI。

只感覺：

自己正在生活。
```

---

UI

不是：

替玩家思考。

而是：

幫助玩家理解。

它提供：

資訊。

保留：

選擇。

承擔：

回饋。

真正的決定，

永遠屬於玩家。

---

# Summary

UI System

回答：

> 玩家應該如何理解並體驗《棒球人生》的世界？

它管理：

- Information Presentation
- Interaction
- Navigation
- Layout
- Feedback
- Visual Hierarchy
- Information Priority
- Information Density
- Accessibility
- Notification
- Player Guidance
- Emotional Pacing

它不管理：

- Gameplay Logic
- Player Data
- Coach AI
- Career Rules
- Narrative Flow
- Match Engine
- World Simulation
- Save Logic

---

UI

核心流程：

```text
Gameplay State

↓

Read

↓

Presentation

↓

Player

↓

Input

↓

Gameplay

↓

Update

↓

Refresh
```

---

UI

必須維持：

```text
Presentation

≠

Gameplay
```

```text
Information

≠

Knowledge
```

```text
Guidance

≠

Decision
```

```text
Life

＞

Data
```

```text
Action

＞

Statistics
```

```text
Understanding

＞

Information
```

---

UI

讓玩家：

理解世界。

Gameplay

讓世界：

運作。

兩者合作，

共同完成：

《棒球人生》的玩家體驗。