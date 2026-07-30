# 11 World Simulation System

Version: 2.0

---

# Purpose

World Simulation System 負責管理角色所生活的世界。

它描述：

制度、
文化、
社會、
經濟、
環境、
組織、

如何共同形成角色的人生舞台。

World Simulation

不是：

世界設定資料。

也不是：

地圖系統。

它回答的是：

> 角色生活在一個什麼樣的世界？

更重要的是：

> 這個世界，會如何回應角色？

---

# Responsibilities

World Simulation System 負責管理：

- Social Systems（社會制度）
- Baseball Ecosystem（棒球生態）
- Organizations（組織）
- Rules & Regulations（規則）
- Economy（經濟）
- Culture（文化）
- Environment（宏觀環境）
- World Trends（世界趨勢）

World Simulation

不負責：

- 玩家能力
- 玩家決策
- 劇情內容
- 人際關係
- 比賽流程
- UI

---

# Not Responsible

## Player

Player

保存：

角色自身資料。

World

保存：

角色生活的環境。

例如：

Player：

高中二年級。

World：

日本高中棒球制度。

---

## Career

Career

保存：

玩家目前的人生位置。

World

提供：

有哪些人生路徑存在。

例如：

World：

存在：

- 高中棒球
- 大學棒球
- 社會人
- 職棒
- 旅外

Career

只保存：

目前所在的位置。

---

## Decision

Decision

決定：

角色選擇哪一條路。

World

決定：

有哪些路可以選。

例如：

旅外制度存在。

是否旅外。

由：

Decision。

---

## Event

Event

管理：

人生發生了什麼。

World

管理：

哪些事情有可能發生。

例如：

選秀制度存在。

因此：

Event

可能出現：

球探拜訪。

---

## Match

Match

管理：

競技過程。

World

提供：

競技規則。

例如：

聯盟規則。

DH 制度。

延長賽制度。

計分方式。

---

## Narrative

Narrative

管理：

角色如何理解世界。

World

不提供：

人生意義。

它只提供：

世界本身。

---

# Core Concepts

World

不是背景。

它是一個：

持續運作的模擬系統。

即使玩家什麼都不做。

世界，

仍然持續改變。

例如：

今年：

高中畢業生增加。

因此：

大學競爭更激烈。

或：

職棒球隊擴編。

因此：

更多新人獲得機會。

這些改變，

不是劇情。

而是：

World Simulation。

---

# World Layer

World 可分成六個主要層級。

```text
Environment

↓

Society

↓

Culture

↓

Institutions

↓

Organizations

↓

Local Context
```

世界由上而下影響角色。

角色則透過自己的行動，

對世界造成有限的回饋。

---

## Environment

Environment

代表：

宏觀環境。

例如：

- 國家
- 地區
- 氣候
- 人口
- 經濟景氣
- 科技發展

Environment

回答：

> 我生活在什麼樣的大環境？

---

## Society

Society

代表：

社會制度。

例如：

- 教育制度
- 職業制度
- 家庭文化
- 媒體
- 法律
- 社會期待

Society

回答：

> 社會如何運作？

---

## Culture

Culture

代表：

共同價值觀。

例如：

- 勝負文化
- 團隊文化
- 努力文化
- 明星文化
- 地區文化

Culture

回答：

> 人們普遍相信什麼？

---

## Institutions

Institutions

代表：

正式制度。

例如：

- 高中棒球聯盟
- 大學聯盟
- 職棒制度
- 選秀制度
- 球探制度
- 醫療制度

Institutions

回答：

> 世界有哪些正式規則？

---

## Organizations

Organizations

代表：

具體組織。

例如：

- 學校
- 球隊
- 球團
- 醫院
- 經紀公司
- 媒體公司

Organizations

回答：

> 我正在與哪些組織互動？

---

## Local Context

Local Context

代表：

角色目前所處的地方。

例如：

- 學校
- 球隊
- 城市
- 社區

即使同一套制度。

不同 Local Context，

也可能產生不同文化。
# World Lifecycle

World 並不是：

建立完成後，

永遠固定。

它是一個：

持續變化的系統。

生命週期如下：

```text
World Baseline

↓

World Change

↓

World Dynamics

↓

World State

↓

Player Interaction

↓

World Response

↓

New World State
```

玩家，

只是世界中的其中一員。

世界，

並不圍繞玩家運轉。

---

# World Baseline

World Baseline

代表：

目前世界的基礎狀態。

例如：

- 高中棒球制度
- 職棒制度
- 經濟景氣
- 球隊數量
- 教育制度

Baseline

代表：

世界正常運作方式。

---

# World Change

World Change

代表：

造成世界改變的事件。

例如：

- 新政策
- 聯盟改革
- 球隊成立
- 球隊解散
- 經濟衰退
- 社會風氣改變

這些變化，

可能與玩家無關。

---

# World Dynamics

World Dynamics

代表：

世界如何自然演變。

例如：

少子化

↓

高中球員變少

↓

競爭降低

↓

更多球員升學

又例如：

MLB 擴編

↓

更多亞洲球探

↓

旅外機率增加

Dynamics

並不是：

劇情。

而是：

世界自己的變化。

---

# World State

World State

代表：

目前世界的即時狀態。

例如：

今年：

- 景氣很好
- 球迷增加
- 職棒人氣上升
- 投手不足

World State

是：

目前世界樣貌。

---

# Player Interaction

玩家開始與世界互動。

例如：

- 參加選秀
- 加入球隊
- 接受採訪
- 創造紀錄

玩家，

影響世界。

但通常：

影響有限。

除非：

成為歷史人物。

---

# World Response

世界，

根據目前狀況，

回應玩家。

例如：

新人很多。

↓

競爭激烈。

明星球員退休。

↓

更多新人曝光。

世界回應，

不是：

劇情安排。

而是：

Simulation。

---

# World Trend

World Trend

代表：

目前世界長期趨勢。

例如：

- 投高打低
- 打擊革命
- 投球時鐘
- 防守數據革命
- 女性棒球增加
- 少子化

Trend

通常：

數年才改變。

但會持續影響：

Career、

Decision、

Event。

---

# World Pressure

World Pressure

代表：

世界帶給角色的壓力。

例如：

- 社會期待
- 家庭期待
- 球迷期待
- 球隊戰績
- 媒體輿論

Pressure

並不是：

Current State。

它屬於：

World。

Current State

只保存：

角色今天受到多少影響。

---

# World Opportunity

World

同時提供：

機會。

例如：

- 擴編球隊
- 新聯盟成立
- 海外球探增加
- 國際賽增加
- 新制度

Opportunity

屬於：

World。

是否把握，

屬於：

Decision。
# Data Flow

World Simulation 與其他 System 的資料流如下：

```text
World Baseline
        │
World Dynamics
        │
World State
        │
        ▼
World Influence
        │
        ├── Event
        ├── Career
        ├── Decision
        ├── Match
        ├── Current State
        ├── Relationship
        └── UI
```

World

幾乎不接受：

其他 System 的直接修改。

它主要扮演：

上游系統。

由世界，

影響角色。

---

# World Update Flow

世界更新流程如下：

```text
World Trigger

↓

Update World State

↓

Apply World Dynamics

↓

Generate World Influence

↓

Notify Dependent Systems
```

World

通常更新頻率：

遠低於：

Current State。

例如：

每日、

每月、

每季、

每年。

不同層級，

更新速度不同。

---

# World Trigger

World Trigger

代表：

哪些事情，

會更新世界。

---

## Time Trigger

時間經過。

例如：

- 新的一天
- 新學期
- 新球季
- 新年度

---

## Policy Trigger

制度改變。

例如：

- 選秀制度修改
- 聯盟規則更新
- 醫療制度改革

---

## Social Trigger

社會變化。

例如：

- 棒球熱潮
- 經濟衰退
- 少子化
- 媒體風向改變

---

## Historical Trigger

重大歷史事件。

例如：

- 國際賽奪冠
- 新聯盟成立
- 球隊解散
- 世界級球星退休

---

## Simulation Trigger

世界自行演化。

例如：

- 球員世代交替
- 教練退休
- 球探配置改變
- 職缺自然流動

玩家，

不需要介入。

---

# Architecture Rules

World Simulation 必須遵守以下規則。

---

## Rule 01

World 必須獨立存在。

即使沒有玩家，

世界仍持續運作。

---

## Rule 02

World 不應服務玩家。

世界，

不會主動迎合玩家。

玩家，

只是世界的一部分。

---

## Rule 03

World 必須具有一致性。

同樣制度，

應對所有角色適用。

不能因玩家，

改變基本規則。

---

## Rule 04

World 應提供限制，

也提供機會。

世界，

不只是障礙。

也不只是獎勵。

它提供：

真實的可能性。

---

## Rule 05

World 應產生長期變化。

例如：

十年前容易旅外。

今天，

可能更加困難。

這些改變，

不需要劇情推動。

---

## Rule 06

World 不直接決定玩家命運。

世界：

提供條件。

Decision：

決定選擇。

Match：

決定表現。

Narrative：

決定如何理解。

---

# World Influence

World Influence

代表：

世界如何影響其他系統。

---

## Influence on Event

世界，

決定：

哪些事件容易發生。

例如：

高中球季開始。

↓

更多球探事件。

---

## Influence on Career

世界，

決定：

有哪些 Career Opportunity。

例如：

新球隊成立。

↓

更多職棒名額。

---

## Influence on Decision

世界，

決定：

有哪些選項存在。

例如：

旅外制度開放。

↓

Decision

新增：

旅外。

---

## Influence on Match

世界，

提供：

規則、

賽程、

聯盟制度、

比賽環境。

---

## Influence on Current State

世界，

提供：

天氣、

旅行、

時差、

球迷、

媒體。

Current State

負責：

角色今天受到多少影響。

---

## Influence on Relationship

世界，

可能改變：

互動方式。

例如：

球隊文化強調：

競爭。

↓

Relationship

更容易出現：

競爭、

嫉妒、

合作。
## Event System

World

定義：

哪些事件有可能存在。

Event

決定：

哪一個事件真正發生。

例如：

World：

高中選秀制度存在。

Event：

球探今天拜訪玩家。

World

提供：

可能性。

Event

提供：

實際發生。

---

## Career System

World

提供：

人生道路。

Career

保存：

玩家目前的位置。

例如：

World：

存在：

- 高中
- 大學
- 社會人
- 職棒
- 海外聯盟

Career

只保存：

目前在哪一條路。

---

## Decision System

World

提供：

限制、

機會、

制度。

Decision

決定：

玩家如何回應。

例如：

世界：

允許旅外。

Decision：

是否旅外。

---

## Match System

World

提供：

比賽規則、

聯盟制度、

賽程、

球場環境。

Match

負責：

競技模擬。

World

不處理：

比賽內容。

---

## Current State System

World

提供：

外部因素。

例如：

- 天氣
- 時差
- 客場
- 媒體壓力

Current State

決定：

今天受到多少影響。

---

## Relationship System

World

提供：

文化背景。

例如：

團隊文化、

上下關係、

競爭文化。

Relationship

保存：

角色之間真正建立的關係。

---

## Narrative System

World

提供：

世界如何運作。

Narrative

提供：

角色如何理解世界。

例如：

世界：

競爭非常殘酷。

Narrative：

玩家是否因此更加成熟。

---

## Injury System

World

提供：

醫療環境、

復健資源、

運動科學、

保險制度。

Injury

保存：

傷病本身。

---

## Save System

Save

保存：

World State。

例如：

- League Rules
- Economy
- Trend
- Institutions
- Organizations

World

不負責：

存檔流程。

---

## UI System

UI

呈現：

世界資訊。

例如：

- 聯盟新聞
- 世界事件
- 社會趨勢
- 球隊公告

World

不負責：

介面。

---

# Extension Guidelines

新增 World 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

世界本身，

還是角色資料？

若屬於角色，

請交給：

Player、

Career、

Relationship、

Current State。

---

## Question 02

它是否會影響：

多數角色？

若只影響一名角色，

通常不是：

World。

---

## Question 03

它是否獨立存在？

即使玩家不存在，

它是否仍會持續運作？

若答案是否，

通常不是：

World。

---

## Question 04

它提供的是：

可能性，

還是：

結果？

World

只提供：

可能性。

真正結果，

交由：

Event、

Decision、

Match、

Narrative。

---

## Question 05

它屬於：

制度、

文化、

社會、

組織、

環境、

趨勢？

若都不是，

請重新評估：

是否需要放入：

World。

---

# Common Mistakes

以下是 World 最常見的設計錯誤。

---

## Mistake 01

World 等於地圖。

錯誤。

World

管理：

社會如何運作。

不是：

場景。

---

## Mistake 02

所有事情都交給 World。

錯誤。

World

只提供：

環境。

真正行動，

由其他 System

完成。

---

## Mistake 03

World 專門服務玩家。

錯誤。

世界，

不圍繞玩家旋轉。

玩家，

只是其中一員。

---

## Mistake 04

World 永遠固定。

錯誤。

世界，

應持續演變。

---

## Mistake 05

世界變化必須由劇情推動。

錯誤。

Simulation

本身，

就應讓世界自然改變。

---

# Design Philosophy

World Simulation

不是：

一張世界地圖。

也不是：

一本世界設定集。

它是一個：

持續運作的社會。

制度會改變。

文化會演化。

組織會興衰。

經濟會波動。

新的機會會出現。

舊的道路會消失。

玩家，

不是世界的中心。

世界，

也不會等待玩家。

真正重要的，

不是世界是否龐大。

而是：

它是否讓角色感受到，

自己正活在一個真實運作的社會。

World Simulation

保存的，

不是背景。

而是：

一個即使沒有玩家，

也會繼續前進的世界。

---

# Summary

World Simulation System 回答的核心問題只有一個：

> 角色生活在一個什麼樣的世界？

它不是：

地圖系統。

不是：

劇情系統。

不是：

NPC 系統。

它定義：

世界的制度、

文化、

組織、

環境、

趨勢，

並持續演化，

為所有角色提供相同的規則、

相同的限制、

以及相同的機會。

世界，

不是玩家的舞台。

玩家，

只是世界中的一員。
