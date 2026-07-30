# 12 Organization System

Version: 2.0

---

# Purpose

Organization System 負責管理世界中的具體組織。

它描述：

學校、
球隊、
球團、
聯盟、
醫院、
媒體、
經紀公司，

如何作為一個整體運作。

Organization

不是：

建築物。

也不是：

NPC 名單。

它回答的是：

> 這個組織如何運作？

以及：

> 角色在這個組織中，受到哪些規則、資源與期待影響？

---

# Responsibilities

Organization System 負責管理：

- Organization Identity（組織定位）
- Organization Structure（組織結構）
- Organization Culture（組織文化）
- Organization Resources（組織資源）
- Organization Goals（組織目標）
- Organization Rules（組織內部規則）
- Organization Membership（組織成員）
- Organization Roles（組織角色）
- Organization Reputation（組織聲望）
- Organization State（組織當前狀態）

Organization System 不負責：

- 世界制度
- 個別 NPC 的人格與決策
- 玩家的人際關係
- 事件內容
- 生涯狀態
- 比賽流程
- 劇情意義

---

# Not Responsible

## World Simulation

World Simulation 管理：

- 社會制度
- 文化背景
- 法律
- 經濟
- 聯盟環境
- 宏觀趨勢

Organization 管理：

具體組織如何在這些條件中運作。

例如：

World：

職棒聯盟實施自由球員制度。

Organization：

某球團是否願意投入資源簽下自由球員。

World 提供：

外部規則。

Organization 決定：

組織如何回應。

---

## Player

Player 保存：

玩家目前的個人狀態。

Organization 保存：

玩家隸屬於哪個組織，

以及在組織中的正式位置。

例如：

Player：

18 歲投手。

Organization：

某高中棒球隊一軍替補投手。

---

## Career

Career 保存：

玩家目前的人生階段與職涯位置。

Organization 保存：

玩家所在的具體學校、

球隊、

球團或機構。

例如：

Career：

高中棒球階段。

Organization：

青嵐高中棒球隊。

---

## Relationship

Relationship 保存：

人物之間的長期連結。

Organization 保存：

人物是否屬於同一組織，

以及彼此的正式角色關係。

例如：

Organization：

山本是玩家的投手教練。

Relationship：

玩家是否信任山本。

正式職位，

不等於：

真實關係。

---

## Decision

Decision 管理：

角色如何做出選擇。

Organization 提供：

組織目標、

規則、

資源、

壓力、

限制。

例如：

球隊要求玩家轉任中繼。

是否接受，

屬於：

Decision。

---

## Event

Event 管理：

某件事情真正發生。

Organization 提供：

事件發生的組織條件。

例如：

Organization：

球隊戰績低迷，

教練團承受壓力。

Event：

總教練宣布更換先發輪值。

---

## Match

Match 管理：

競技過程與結果。

Organization 管理：

- 球隊陣容
- 球員角色
- 賽季目標
- 資源配置
- 組織期待

Organization 不處理：

單場比賽模擬。

---

## Coach

Coach System 管理：

個別教練如何觀察、

評估、

溝通、

做出決策。

Organization 保存：

教練在組織中的職位、

權限、

責任。

例如：

Organization：

山本是二軍投手教練。

Coach：

山本如何評估玩家。

---

# Core Concepts

Organization

是一個具備：

目標、

結構、

文化、

資源、

規則，

並由多個角色共同組成的行動單位。

組織不是：

所有成員意志的總和。

它可能產生：

個人不認同，

但仍必須執行的決策。

例如：

教練欣賞某位球員。

但球團因預算，

選擇不續約。

此時：

個人意志，

與組織決策，

可能不同。

這種差異，

是 Organization System 必須保存的重要張力。

---

# Organization Layer

Organization 可分成六個主要層級。

```text
Identity

↓

Goal

↓

Structure

↓

Culture

↓

Resources

↓

Operation
```

---

## Organization Identity

Organization Identity

代表：

這個組織認為自己是什麼。

例如：

- 傳統名門
- 地方弱校
- 育成型球團
- 爭冠球隊
- 商業導向媒體
- 運動醫學中心

Identity 回答：

> 這個組織如何定義自己？

Organization Identity

不是：

品牌文案。

它會影響：

目標、

招募、

資源配置、

決策標準。

---

## Organization Goal

Organization Goal

代表：

組織目前追求的結果。

例如：

- 打進甲子園
- 培養選手
- 爭奪冠軍
- 控制預算
- 提升收視率
- 完成醫療復健

不同 Goal，

可能產生完全不同的行動。

例如：

育成型球團

可能願意容忍年輕球員失敗。

爭冠球團

可能更重視立即戰力。

---

## Organization Structure

Organization Structure

代表：

組織內部的權力與責任分配。

例如：

```text
Owner

↓

General Manager

↓

Head Coach

↓

Coaching Staff

↓

Players
```

或：

```text
Principal

↓

Athletic Director

↓

Head Coach

↓

Assistant Coach

↓

Students
```

Structure 回答：

> 誰有權做什麼決定？

---

## Organization Culture

Organization Culture

代表：

組織實際遵循的價值與行為規範。

例如：

- 服從
- 競爭
- 團隊優先
- 數據導向
- 前輩制度
- 容錯
- 紀律
- 勝利至上

Culture

可能與：

Organization Identity

不同。

例如：

組織公開宣稱重視育成。

實際上，

卻不容許年輕球員犯錯。

這種落差，

應成為：

組織特性的一部分。

---

## Organization Resources

Organization Resources

代表：

組織可使用的資源。

例如：

- 預算
- 設備
- 人力
- 醫療
- 情報
- 球探
- 訓練場地
- 社會關係
- 媒體曝光

Resources

會限制：

組織能夠執行的行動。

---

## Organization Operation

Organization Operation

代表：

組織如何日常運作。

例如：

- 招募
- 選拔
- 訓練
- 排班
- 升降
- 合約
- 醫療轉介
- 媒體發布
- 績效評估

Operation 回答：

> 組織如何把目標轉化為行動？

# Organization Lifecycle

Organization

不是：

建立之後就固定不變。

它會隨著：

人事、

資源、

成績、

制度、

聲望、

外部環境，

持續改變。

生命週期如下：

```text
Formation

↓

Identity Definition

↓

Goal Setting

↓

Structure Assignment

↓

Resource Allocation

↓

Operation

↓

Evaluation

↓

Adaptation

↓

Growth / Decline / Dissolution
```

Organization

也有自己的生命歷程。

它可能：

成立、

成長、

轉型、

衰退、

甚至消失。

---

# Formation

Formation

代表：

組織如何成立。

例如：

- 學校成立棒球隊
- 企業組成社會人球隊
- 新職業球團加入聯盟
- 醫院成立運動醫學中心
- 球員成立經紀公司

Formation

應建立：

- Organization Identity
- Initial Goal
- Initial Structure
- Initial Resources
- Founding Members
- External Constraints

組織成立時的條件，

可能長期影響：

組織文化。

例如：

由退役球員建立的球隊，

與由企業行銷部門建立的球隊，

可能擁有：

完全不同的價值觀。

---

# Goal Setting

Organization Goal

不是：

永久不變。

它會受到：

- World State
- Organization State
- Leadership
- Resources
- Reputation
- Recent Results

影響。

例如：

去年爭冠失敗。

今年目標可能仍是：

冠軍。

但若：

預算大幅縮減，

目標可能改為：

重建。

---

## Goal Horizon

Organization Goal

可依時間尺度分成：

### Immediate Goal

短期目標。

例如：

- 贏下下一場比賽
- 解決陣容缺口
- 避免連敗
- 完成球員治療

---

### Seasonal Goal

單一球季或學年目標。

例如：

- 打進全國大賽
- 完成保級
- 進入季後賽
- 培養三名年輕球員

---

### Strategic Goal

數年期目標。

例如：

- 建立育成體系
- 改變球隊文化
- 擴大市場
- 提升醫療能力
- 成為地區棒球中心

不同 Goal Horizon，

可能互相衝突。

例如：

短期爭冠，

可能壓縮：

年輕球員的培養空間。

---

# Organization Membership

Organization Membership

代表：

角色與組織之間的正式隸屬關係。

Membership

不是：

Relationship。

它回答：

> 角色是否正式屬於這個組織？

例如：

- 學生球員
- 一軍球員
- 二軍球員
- 教練
- 球探
- 隊醫
- 行政人員
- 經紀人

Membership

至少應保存：

- Organization ID
- Member ID
- Membership Type
- Join Date
- Exit Date
- Current Status
- Assigned Role
- Contract Status
- Authority Level

---

## Membership Status

Membership Status

可包含：

- Active
- Inactive
- Suspended
- Injured
- Loaned
- Temporary
- Retired
- Released
- Expelled

Status

描述：

角色目前是否能正常參與組織活動。

例如：

玩家仍屬於球隊。

但因傷：

Status = Injured。

這不代表：

玩家已離開組織。

---

## Membership Entry

角色加入組織，

可能透過：

- 招募
- 選秀
- 考試
- 轉學
- 簽約
- 任命
- 推薦
- 臨時支援

Entry

本身可能由：

Event

觸發。

是否接受，

由：

Decision

處理。

Organization

負責保存：

正式加入結果。

---

## Membership Exit

角色離開組織，

可能因為：

- 畢業
- 轉隊
- 合約到期
- 釋出
- 退休
- 辭職
- 解散
- 違規
- 自願退出

離開組織，

不一定代表：

Relationship 結束。

前教練、

前隊友、

前球團，

仍可能在未來產生影響。

---

# Organization Role

Organization Role

代表：

成員在組織中的正式功能。

例如：

- 隊長
- 先發投手
- 替補捕手
- 一軍總教練
- 二軍投手教練
- 球探主管
- 隊醫
- 經理
- 校隊顧問

Role

不是：

Identity。

它回答：

> 組織要求這個人做什麼？

Identity

回答：

> 角色相信自己是誰？

兩者可能一致，

也可能衝突。

例如：

玩家認為自己是：

先發投手。

但 Organization Role：

中繼投手。

這個落差，

可能影響：

Decision、

Relationship、

Narrative。

---

## Role Responsibility

每個 Role

應定義：

- Duties
- Authority
- Expectations
- Evaluation Criteria
- Available Resources
- Reporting Line

例如：

隊長的責任可能包括：

- 穩定休息室
- 傳達教練要求
- 帶領年輕球員
- 面對媒體

隊長不一定是：

能力最強的球員。

但必須承擔：

額外的組織責任。

---

## Role Authority

Authority

代表：

角色有權做出哪些組織決策。

例如：

球員可能有權：

- 提出意見
- 拒絕部分非強制安排

但沒有權：

- 決定先發名單
- 簽下新球員
- 修改球隊規則

Authority

應由：

Organization Structure

決定。

---

# Leadership

Leadership

代表：

組織中的領導來源。

例如：

- 老闆
- 校長
- 總經理
- 總教練
- 隊長
- 資深球員

Leadership

不只是一個職位。

它同時影響：

- Goal
- Culture
- Resource Allocation
- Evaluation
- Organization Decision

---

## Formal Leadership

Formal Leadership

來自：

正式職權。

例如：

總教練、

校長、

球團領隊。

---

## Informal Leadership

Informal Leadership

來自：

聲望、

能力、

資歷、

人際影響力。

例如：

資深球員雖然不是隊長，

但可能實際影響：

休息室文化。

正式權力，

與非正式影響力，

可能不同。

這種落差，

應成為：

Organization Dynamics 的一部分。

---

# Organization Governance

Governance

代表：

組織如何做出正式決策。

例如：

- 單一領導決策
- 教練團會議
- 管理層審議
- 委員會制度
- 投票
- 上級核准

Governance

回答：

> 組織決策是如何形成的？

---

## Governance Process

組織決策流程可表示為：

```text
Organization Need

↓

Proposal

↓

Authority Review

↓

Resource Check

↓

Organization Decision

↓

Implementation

↓

Evaluation
```

Organization Decision

不是：

單一 NPC Decision。

即使由某位 NPC 提案，

最終仍可能受到：

組織流程、

權限、

資源、

規則，

影響。

---

# Organization Resources

Organization Resources

不應只有：

金錢。

它應包含多種資源。

---

## Financial Resources

例如：

- 球隊預算
- 薪資空間
- 設備預算
- 醫療預算
- 招募預算

---

## Human Resources

例如：

- 教練
- 球員
- 球探
- 醫療人員
- 行政人員
- 分析師

---

## Physical Resources

例如：

- 球場
- 訓練設備
- 宿舍
- 復健設施
- 交通工具

---

## Information Resources

例如：

- 比賽數據
- 球探報告
- 醫療紀錄
- 對手情報
- 市場資訊

---

## Social Resources

例如：

- 校友
- 贊助商
- 地方關係
- 媒體關係
- 聯盟人脈
- 海外合作

---

# Resource Allocation

Resource Allocation

代表：

組織如何分配有限資源。

例如：

球隊只有一筆額外預算。

可能選擇：

- 升級訓練設備
- 聘請新教練
- 強化醫療
- 招募明星球員

任何資源配置，

都應代表：

一種取捨。

組織不應：

無限制地滿足所有需求。

---

# Organization State

Organization State

代表：

組織目前的整體狀況。

可能包含：

- Stability
- Morale
- Performance
- Financial Health
- Internal Conflict
- Resource Level
- Leadership Support
- Public Pressure

Organization State

不是：

單一成員狀態的平均。

它描述：

組織作為一個整體，

目前是否能正常運作。

---

## Stability

Stability

代表：

組織是否穩定。

可能受到：

- 領導更替
- 財務危機
- 成員衝突
- 戰績低迷
- 制度改革

影響。

---

## Organization Morale

Organization Morale

代表：

整體成員對組織的士氣與投入。

它不是：

每一名角色的 Mental State。

Organization Morale

屬於：

組織層級。

Individual Mental State

屬於：

Current State。

---

## Internal Conflict

Internal Conflict

代表：

組織內部不同目標或派系之間的衝突。

例如：

- 教練團重視育成
- 管理層要求立即戰績

或：

- 資深球員要求維持傳統
- 年輕教練推動數據改革

Internal Conflict

可能產生：

Event、

Decision Constraint、

Relationship Pressure。

---

# Organization Reputation

Organization Reputation

代表：

外界如何看待這個組織。

例如：

- 名門
- 黑馬
- 育成優秀
- 管理混亂
- 醫療先進
- 不尊重球員
- 財務穩定
- 媒體導向

Reputation

會影響：

- 招募
- 人才加入意願
- 球迷支持
- 媒體關注
- 贊助
- Career Opportunity

---

## Internal Identity vs External Reputation

Organization Identity

代表：

組織如何看待自己。

Reputation

代表：

外界如何看待組織。

兩者可能不同。

例如：

Organization Identity：

我們是重視球員發展的球團。

External Reputation：

這支球團會過度使用年輕投手。

這種落差，

可能成為：

重要的 Narrative 與 Event 來源。

---

# Core Data

Organization System

至少保存以下核心資料：

```text
Organization ID

Organization Type

Organization Identity

Organization Goals

Organization Structure

Organization Culture

Organization Rules

Organization Resources

Organization Membership

Organization Roles

Organization Leadership

Organization State

Organization Reputation

Organization History
```

Organization

保存的是：

組織目前如何存在與運作。

不是：

所有成員的完整資料。

# Data Flow

Organization System 與其他 System 的資料流如下：

```text
World Simulation
        │
        ▼
External Rules / Trends / Economy
        │
        ▼
Organization Context
        │
        ├── Identity
        ├── Goal
        ├── Structure
        ├── Culture
        ├── Resources
        └── State
        │
        ▼
Organization Evaluation
        │
        ▼
Organization Decision
        │
        ├── Membership Change
        ├── Role Assignment
        ├── Resource Allocation
        ├── Rule Enforcement
        ├── Opportunity Creation
        └── Event Request
        │
        ▼
Event / Career / Decision / Relationship / Match
```

Organization

接收：

World Simulation

提供的外部環境。

再依據：

自己的定位、

目標、

資源、

文化、

治理流程，

形成組織層級的回應。

Organization

不直接決定：

玩家如何選擇。

也不直接完成：

事件結果。

它負責形成：

正式安排、

組織要求、

制度限制、

以及可被其他系統使用的條件。

---

# Organization Update Flow

Organization 更新流程如下：

```text
Organization Trigger

↓

Collect External and Internal Changes

↓

Update Organization State

↓

Evaluate Goals and Constraints

↓

Process Governance

↓

Generate Organization Decision

↓

Apply Structural Changes

↓

Notify Dependent Systems

↓

Record Organization History
```

Organization

不應在所有遊戲回合中：

完整重新運算。

它應在：

組織狀態真正改變時，

進行更新。

---

# Organization Trigger

Organization Trigger

代表：

哪些事情會要求組織重新評估目前狀態。

---

## Time Trigger

時間經過。

例如：

- 新學期
- 新球季
- 月度結算
- 合約年度結束
- 畢業季
- 選秀期
- 休賽季

Time Trigger

通常會觸發：

- Goal Review
- Membership Review
- Resource Review
- Role Review
- Contract Review

---

## Performance Trigger

組織績效發生變化。

例如：

- 球隊連敗
- 晉級全國大賽
- 未達季前目標
- 球員培養成功
- 收視率下降
- 醫療復健成果不佳

Performance Trigger

可能改變：

- Leadership Support
- Organization Goal
- Resource Allocation
- Internal Pressure
- Evaluation Standard

---

## Resource Trigger

組織資源發生變化。

例如：

- 預算增加
- 贊助撤出
- 設備損壞
- 新教練加入
- 醫療人力不足
- 球探部門擴編

Resource Trigger

可能開啟：

新的機會。

也可能關閉：

原有選項。

---

## Membership Trigger

成員狀態發生重大變化。

例如：

- 主力受傷
- 教練離職
- 隊長畢業
- 新人加入
- 球員遭到釋出
- 管理層更替

Membership Trigger

可能改變：

- Organization Structure
- Role Assignment
- Internal Conflict
- Culture
- Leadership

---

## World Trigger

外部世界發生變化。

例如：

- 聯盟規則修改
- 經濟衰退
- 新球隊成立
- 選秀制度改變
- 社會輿論轉向
- 醫療法規更新

World Trigger

由：

World Simulation

提供。

Organization

負責：

決定如何因應。

---

## Crisis Trigger

組織出現重大危機。

例如：

- 財務危機
- 醜聞
- 嚴重傷病事件
- 內部派系衝突
- 教練團失去控制
- 球隊面臨解散

Crisis Trigger

可能要求：

組織暫時改變正常治理流程。

但即使在危機中，

仍應遵守：

權限、

資源、

組織文化，

而不是任意產生結果。

---

# Organization Dynamics

Organization Dynamics

代表：

組織內部如何持續演變。

它不是：

單一事件。

而是：

多種因素長期累積後形成的組織變化。

---

## Goal Dynamics

組織目標可能因為：

- 成績
- 領導者
- 資源
- World State
- Reputation

而改變。

例如：

```text
爭冠失敗

↓

預算縮減

↓

明星球員離隊

↓

Goal：

爭冠

改為：

重建
```

Goal Dynamics

會重新影響：

招募、

用人、

訓練、

資源配置。

---

## Culture Dynamics

Organization Culture

不應瞬間改變。

文化通常透過：

- 領導更替
- 成員世代交替
- 長期獎懲
- 重複成功經驗
- 重複失敗經驗
- 正式規則
- 非正式規範

逐步形成。

例如：

一支原本強調服從的球隊，

即使聘請數據派教練，

也不會立刻變成：

開放討論文化。

文化改變，

應具有：

阻力、

慣性、

過渡期。

---

## Leadership Dynamics

Leadership Dynamics

代表：

正式權力與非正式影響力的變化。

例如：

```text
總教練戰績下降

↓

Formal Authority 仍存在

↓

Leadership Support 下降

↓

資深球員影響力上升

↓

Organization Decision 開始出現分裂
```

Leadership

不應只用：

職稱

表示。

還應考慮：

- Authority
- Support
- Reputation
- Trust
- Informal Influence

---

## Resource Dynamics

Resource

會因使用、

消耗、

補充、

投資，

持續改變。

例如：

醫療預算提高，

短期可能降低：

可用薪資空間。

但長期可能降低：

傷病損失。

Resource Dynamics

應保留：

短期成本

與

長期回報

之間的張力。

---

## Membership Dynamics

成員加入與離開，

會改變組織本身。

例如：

一名明星球員加入，

可能提升：

- Performance
- Reputation
- Revenue

同時也可能造成：

- Role Conflict
- Resource Pressure
- Internal Jealousy
- Tactical Change

Membership

不是：

單純增加一名角色。

它可能重新塑造：

Organization State。

---

## Reputation Dynamics

Reputation

會根據：

- 成績
- 媒體報導
- 球員待遇
- 傷病處理
- 公開事件
- 歷史紀錄

逐步改變。

Reputation

應具有：

慣性。

一支長期管理混亂的球隊，

不會因為一次成功簽約，

立刻變成：

理想組織。

---

# Organization Evaluation

Organization Evaluation

代表：

組織如何判斷：

目前是否運作良好。

它可能評估：

- Goal Progress
- Performance
- Financial Health
- Member Development
- Stability
- Reputation
- Rule Compliance
- Resource Efficiency

不同組織，

評估標準不同。

例如：

育成型球隊

可能更重視：

球員成長。

爭冠球隊

可能更重視：

立即戰績。

商業媒體

可能更重視：

流量與收視率。

因此：

相同結果，

在不同 Organization 中，

可能得到不同評價。

---

# Member Evaluation

Organization

也會評估個別成員。

例如：

- 能力
- 表現
- 潛力
- 適應性
- 紀律
- 健康
- 團隊貢獻
- 合約成本
- 組織需求

Member Evaluation

不是：

角色真正的能力。

它代表：

組織如何看待這名角色。

因此，

可能存在：

```text
Player Ability

高

↓

Organization Evaluation

低
```

例如：

能力很好，

但不符合球隊戰術。

或：

```text
Player Ability

普通

↓

Organization Evaluation

高
```

例如：

具備稀缺守備位置、

符合文化、

成本低、

或正好填補陣容缺口。

Organization Evaluation

應與：

Player Ability

明確分離。

---

# Evaluation Bias

組織評估可能受到偏差影響。

例如：

- 資歷偏好
- 名校偏好
- 年齡偏好
- 數據偏好
- 傳統觀念
- 領導者個人偏好
- 媒體聲量
- 過去印象

Bias

不是系統錯誤。

它可能是：

Organization Culture

與

Leadership

自然產生的結果。

但 Bias

不應隱藏在：

任意程式判斷中。

它應被明確定義，

並具有可追溯來源。

---

# Organization Decision

Organization Decision

代表：

組織經過正式或非正式流程後，

形成的集體結果。

例如：

- 提拔球員
- 下放二軍
- 更換守備位置
- 不續約
- 增加醫療資源
- 更換教練
- 改變訓練政策
- 招募新人
- 啟動重建

Organization Decision

不是：

某位 NPC 的私人想法。

它必須經過：

- Governance
- Authority
- Resources
- Goals
- Rules
- Organization State

共同限制。

---

## Decision Ownership

每一個 Organization Decision

都必須具有：

Decision Owner。

例如：

- Head Coach
- General Manager
- School Administration
- Medical Director
- Committee

Decision Owner

代表：

誰對正式結果負責。

即使決策是集體形成，

仍應能追蹤：

最終權限來源。

---

## Decision Scope

Organization Decision

可分成：

### Operational Decision

日常營運決策。

例如：

- 今日訓練安排
- 出賽名單
- 工作分配

---

### Personnel Decision

人事決策。

例如：

- 升降
- 任命
- 續約
- 釋出
- 招募

---

### Resource Decision

資源決策。

例如：

- 預算分配
- 設備更新
- 醫療投資

---

### Policy Decision

組織政策。

例如：

- 訓練哲學
- 傷病處理規則
- 媒體政策
- 紀律規範

---

### Strategic Decision

長期方向。

例如：

- 重建
- 爭冠
- 擴編
- 國際化
- 育成轉型

Decision Scope

會影響：

需要的權限、

更新頻率、

後果範圍。

---

# Organization Action

Organization Decision

完成後，

必須轉化為：

Organization Action。

例如：

Decision：

提拔玩家上一軍。

Action：

- 更新 Membership Status
- 更新 Role
- 建立 Career Opportunity
- 觸發 Event
- 通知 UI
- 更新 Organization Roster

Decision

與

Action

必須分離。

因為：

組織可能已做出決定，

但尚未正式執行。

例如：

球團決定交易玩家。

但交易窗口尚未開放。

此時：

Decision 已存在。

Action 尚未完成。

---

# Organization History

Organization History

保存：

組織的重要變化。

例如：

- 成立
- 領導更替
- 冠軍
- 解散危機
- 重大醜聞
- 制度改革
- 文化轉型
- 明星球員加入或離開

History

不是：

所有日常紀錄。

它保存：

足以影響組織身份、

文化、

聲望、

未來決策的重大節點。

Organization History

可以影響：

- Reputation
- Culture
- Recruitment
- Narrative
- Member Expectation

---

# Architecture Rules

Organization System 必須遵守以下規則。

---

## Rule 01

Organization 不等於 NPC 集合。

成員可以離開。

組織仍然存在。

組織具有：

自己的目標、

文化、

資源、

歷史。

---

## Rule 02

Organization Decision 不等於 NPC Decision。

NPC

可以提出、

支持、

反對。

但正式組織結果，

必須經過：

Governance

與

Authority。

---

## Rule 03

Organization 必須受到 World 約束。

組織不能違反：

世界制度、

法律、

聯盟規則，

除非系統明確建立：

違規行為與後果。

---

## Rule 04

Organization 必須具有有限資源。

任何組織，

都不應同時完成：

所有目標。

資源配置必須產生：

取捨。

---

## Rule 05

Organization Culture 必須具有慣性。

文化不能因：

單一事件

立即完全改變。

真正的文化轉型，

應需要：

時間、

重複行動、

領導支持、

成員更替。

---

## Rule 06

正式角色不等於真實影響力。

Role

提供：

Authority。

Relationship、

Reputation、

Seniority

可能提供：

Informal Influence。

兩者必須分離。

---

## Rule 07

Organization Evaluation 不等於客觀真相。

組織對球員的評價，

可能受到：

需求、

文化、

偏差、

資源、

目標

影響。

---

## Rule 08

Organization 不直接替玩家做人生決定。

組織可以：

提出要求、

提供機會、

施加壓力、

做出正式安排。

玩家如何回應，

仍由：

Decision System

負責。

---

## Rule 09

Organization 不直接產生劇情意義。

組織可以：

升降玩家、

拒絕續約、

改變角色。

這些事情的意義，

由：

Narrative System

處理。

---

## Rule 10

Organization State 不等於成員狀態總和。

組織穩定，

不代表：

每名成員都快樂。

組織士氣低落，

也不代表：

所有角色 Mental State 都低落。

組織層級

與

個人層級

必須分離。

# Relationship with Other Systems

---

## World Simulation System

World

提供：

- 制度
- 法律
- 聯盟規則
- 社會文化
- 經濟
- 世界趨勢

Organization

決定：

如何在這個世界中運作。

例如：

World：

自由球員制度成熟。

Organization A：

積極補強。

Organization B：

專注農場育成。

相同世界，

不同組織，

可以有不同策略。

---

## Player System

Player

保存：

玩家目前狀態。

Organization

保存：

玩家目前隸屬的位置。

例如：

Player：

18 歲。

Organization：

青嵐高中棒球隊。

Player

不知道：

球隊如何運作。

Organization

不知道：

玩家今天心情如何。

---

## Identity System

Identity

回答：

我是誰？

Organization

回答：

這個組織希望我是誰？

例如：

Identity：

王牌投手。

Organization：

長中繼。

Identity

與

Organization Role

可能衝突。

這正是：

Decision

的重要來源。

---

## Narrative System

Organization

產生：

人生情境。

Narrative

賦予：

人生意義。

例如：

球團不續約。

Organization：

正式決策。

Narrative：

玩家如何理解：

這段人生。

---

## Relationship System

Organization

建立：

正式關係。

例如：

- 隊友
- 教練
- 隊長
- 球探

Relationship

保存：

真正的人際連結。

例如：

Organization：

同隊三年。

Relationship：

彼此仍然陌生。

正式關係，

不代表：

真正信任。

---

## Event System

Organization

提供：

事件背景。

Event

提供：

事件本身。

例如：

Organization：

球隊準備換血。

Event：

玩家遭到釋出。

---

## Career System

Organization

回答：

在哪裡？

Career

回答：

人生走到哪個階段？

例如：

Career：

職業棒球。

Organization：

統一獅。

兩者，

不可互相取代。

---

## Match System

Organization

提供：

- 球隊名單
- 教練團
- 資源
- 戰術方向

Match

負責：

比賽模擬。

---

## Progression System

Organization

提供：

訓練環境。

Progression

決定：

角色真正成長多少。

例如：

Organization：

高品質教練。

Progression：

吸收速度增加。

真正能力，

仍屬於：

Progression。

---

## Decision System

Organization

提供：

限制、

要求、

正式安排。

Decision

負責：

玩家是否接受。

例如：

球隊要求轉任捕手。

Decision：

接受？

拒絕？

妥協？

---

## Current State System

Organization

提供：

外部影響。

例如：

- 高壓管理
- 密集訓練
- 團隊氣氛
- 球隊旅行

Current State

負責：

角色今天受到多少影響。

---

## Injury System

Organization

提供：

醫療資源、

復健制度、

出賽政策。

Injury

保存：

傷病本身。

例如：

同樣是韌帶受傷。

Organization A：

立即安排頂尖復健。

Organization B：

資源不足，

恢復速度較慢。

---

## Coach System

Organization

保存：

教練的正式位置。

Coach

保存：

教練真正如何思考、

如何觀察、

如何培養球員。

例如：

Organization：

一軍投手教練。

Coach：

重視控球，

不喜歡速球派。

---

## Save System

Save

保存：

Organization State。

例如：

- Membership
- Culture
- Resources
- Goal
- Reputation
- History

Organization

不負責：

存檔流程。

---

## UI System

UI

呈現：

Organization

資訊。

例如：

- 球隊介紹
- 球團新聞
- 球員名單
- 管理層公告
- 學校簡介

Organization

不負責：

介面設計。

---

# Extension Guidelines

新增 Organization 功能前，

請先回答：

---

## Question 01

新增的是：

世界規則，

還是：

單一組織？

若屬於：

整個世界。

請放入：

World。

---

## Question 02

新增的是：

正式制度，

還是：

NPC 個人？

若屬於：

人格、

思考、

觀察。

請放入：

Coach

或

NPC。

---

## Question 03

新增的是：

正式角色，

還是真正關係？

正式角色：

Organization。

真正關係：

Relationship。

---

## Question 04

新增的是：

組織能力，

還是：

角色能力？

例如：

高品質醫療。

Organization。

真正恢復速度。

Progression

或

Current State

或

Injury。

---

## Question 05

新增的是：

正式安排，

還是：

人生結果？

正式安排：

Organization。

真正結果：

Event、

Match、

Decision、

Narrative。

---

# Common Mistakes

---

## Mistake 01

Organization 等於 NPC。

錯誤。

組織，

不是角色集合。

組織具有：

自己的文化、

資源、

制度、

歷史。

---

## Mistake 02

所有決策都由教練完成。

錯誤。

教練，

只是：

組織的一部分。

真正結果，

還受到：

權限、

資源、

治理、

管理層、

組織目標，

共同影響。

---

## Mistake 03

Organization 保存所有人物資料。

錯誤。

Organization

只保存：

正式隸屬關係。

NPC

資料，

應由：

Player

或

Coach

管理。

---

## Mistake 04

組織沒有歷史。

錯誤。

歷史，

會影響：

文化、

聲望、

招募、

期待、

Narrative。

---

## Mistake 05

所有球隊都只是不同 Logo。

錯誤。

真正差異，

來自：

- Goal
- Culture
- Resources
- Governance
- Reputation
- Evaluation Bias

而不是：

隊徽。

---

## Mistake 06

Organization 直接改變能力。

錯誤。

Organization

只能提供：

環境。

真正成長，

仍由：

Progression。

---

## Mistake 07

Organization 直接控制玩家人生。

錯誤。

組織，

只能提出：

正式安排。

玩家，

仍保有：

Decision。

---

# Design Philosophy

Organization System

不是：

一份球隊資料。

也不是：

NPC 名冊。

它是一個：

持續運作的組織。

組織，

有自己的：

目標、

文化、

權力、

資源、

歷史、

限制。

組織，

可能支持玩家。

也可能阻礙玩家。

它不是：

好人。

也不是：

壞人。

它只是：

依照自己的邏輯，

追求自己的目標。

真正讓玩家感受到：

人生不同，

不是：

球衣顏色。

而是：

每個組織，

都會用不同方式，

定義：

什麼叫做：

好球員。

---

# Summary

Organization System 回答的核心問題只有一個：

> 這個組織如何運作？

它保存：

- Identity
- Goal
- Structure
- Culture
- Governance
- Resources
- Membership
- Roles
- Leadership
- Reputation
- State
- History

並根據：

世界、

資源、

文化、

治理流程，

持續演化。

它不是：

世界。

不是：

NPC。

不是：

玩家。

它是：

介於宏觀世界，

與個體角色之間的

中介層。

透過 Organization，

玩家真正體驗到的，

不是：

加入一支球隊。

而是：

進入一種不同的生活方式。