# Prototype Day Loop

Version:

1.0

---

# Purpose

Prototype Day Loop

定義：

《棒球人生》Prototype v2

每一天如何：

開始、

推進、

產生回應、

留下結果、

進入下一天。

這份文件回答：

```text
一天之中，

各個 System

應該以什麼順序合作？
```

Day Loop

不是：

程式檔案的執行順序。

而是：

Gameplay

與 Data Flow

的正式流程。

---

# Core Experience

Prototype v2

每天應形成以下體驗：

```text
理解現在的自己

↓

做出選擇

↓

承擔結果

↓

看見世界回應

↓

理解今天留下了什麼

↓

期待明天
```

玩家每天不只是：

按下一個選項。

玩家應該能理解：

```text
我現在處於什麼狀態？
```

```text
我今天選擇了什麼？
```

```text
這個選擇帶來了什麼代價？
```

```text
其他人如何看待我？
```

```text
球隊如何回應我？
```

```text
這一天是否改變了我的人生？
```

---

# Day Loop Overview

Prototype v2

每天依照以下流程運作。

```text
Day Start

↓

Load Current Context

↓

Present Player State

↓

Generate Available Decisions

↓

Player Decision

↓

Resolve Decision

↓

Check Event

↓

Apply State Changes

↓

Apply Progression

↓

Update Relationship

↓

Coach Observation

↓

Coach Evaluation

↓

Organization Check

↓

Narrative Reflection

↓

Day Summary

↓

Advance Time

↓

Save

↓

Next Day
```

---

# Day Loop Principle

Day Loop

不是：

每一天都必須產生：

重大事件。

也不是：

每一天都必須產生：

能力成長。

Day Loop

真正必須做到的是：

```text
每一天，

都留下：

可被世界理解的結果。
```

有些日子：

只留下疲勞。

有些日子：

改變關係。

有些日子：

被教練注意。

有些日子：

沒有明顯結果。

但：

這些日子

仍然會累積成：

玩家的人生。

---

# Phase 01

# Day Start

Day Start

負責：

建立今天的執行情境。

它不產生：

Decision Result。

也不產生：

Event Result。

它只確認：

今天可以開始。

---

## Inputs

Day Start

讀取：

```text
Player View

Identity View

Current State View

Career State View

Organization View

Active Injury View

Active Relationship View
```

Prototype v2

不要求：

所有資料都完整。

但必須確認：

玩家角色、

當前天數、

當前階段

都存在。

---

## Day Start Validation

Day Start

應檢查：

```text
Player Data 是否存在？
```

```text
Identity Data 是否存在？
```

```text
Current State 是否存在？
```

```text
玩家是否仍可進行今天的活動？
```

```text
是否有未完成的特殊狀態？
```

例如：

```text
受傷休養
```

```text
球隊安排的強制活動
```

```text
前一天尚未結算的結果
```

如果資料不完整，

Day Loop

不能繼續。

應進入：

```text
Validation Failure
```

而不是：

自行補造資料。

---

## Outputs

Day Start

產生：

```text
Day Context
```

Day Context

至少包含：

```text
playerId

day

timeSegment

baseballStage

currentOrganization

availability

activeRestrictions

activeEffects
```

Day Context

是今天其他 System

共同使用的：

唯讀背景資料。

---

# Phase 02

# Load Current Context

這個階段

將今天做決策需要的資料

整理為：

安全的 Read Views。

---

## Context Views

Prototype v2

至少建立：

```text
Player View

Identity View

Current State View

Relationship View

Coach Context View

Organization Context View
```

這些 View

不允許：

接收者直接修改。

---

## Purpose

Load Current Context

不是：

複製完整資料。

而是：

提供今天真正需要的資訊。

例如：

Decision System

可能需要：

```text
energy

fatigue

motivation

availability

identity tension

current role

active restrictions
```

但不需要：

讀取完整 Save Snapshot。

---

# Phase 03

# Present Player State

UI System

將目前狀態

呈現給玩家。

玩家在做決定前，

至少應理解：

```text
今天是第幾天？
```

```text
目前處於什麼棒球階段？
```

```text
目前的精力與疲勞如何？
```

```text
是否有傷病或限制？
```

```text
目前最重要的人際與球隊狀態是什麼？
```

```text
自己的身份目標是什麼？
```

---

## Presentation Rule

UI

只能：

呈現資料。

不能：

因為顯示需要，

直接修改：

```text
Current State

Identity

Relationship

Organization
```

UI

可以：

整理顯示順序。

不能：

改變 Gameplay Truth。

---

# Phase 04

# Generate Available Decisions

Decision System

根據：

```text
Day Context

Player View

Identity View

Current State View

Relationship View

Organization Context View
```

產生：

今天可以選擇的行動。

---

## Minimum Decision Categories

Prototype v2

至少提供三種方向：

```text
訓練
```

```text
互動
```

```text
恢復
```

例如：

```text
留在球場加練
```

```text
陪隊友整理器材
```

```text
提早回家休息
```

---

## Decision Availability

不是：

所有選項

每天都可使用。

Decision System

應根據：

```text
energy

fatigue

injury restriction

organization schedule

relationship condition

previous decisions
```

判斷：

選項是否開放。

---

## Decision Presentation

每個 Decision Option

至少應提供：

```text
decisionId

title

description

knownCost

knownOpportunity

availability

restrictionReason
```

玩家可以知道：

部分成本。

但：

不應知道：

所有精確結果。

例如：

玩家可以知道：

```text
加練可能增加疲勞。
```

但不一定知道：

```text
疲勞固定增加 8。
```

---

# Phase 05

# Player Decision

玩家選擇：

一個合法 Decision。

---

## Decision Input

玩家的選擇

應形成：

```text
Decision Input
```

至少包含：

```text
playerId

decisionId

day

timeSegment

selectedAt
```

UI System

只負責：

將玩家的選擇送出。

UI

不能：

自己判定結果。

---

## Decision Validation

Decision System

必須重新檢查：

```text
選項是否存在？
```

```text
選項是否仍然有效？
```

```text
玩家是否符合條件？
```

```text
玩家是否已完成今天的選擇？
```

如果不合法，

不得進入：

Resolve Decision。

---

# Phase 06

# Resolve Decision

Decision System

根據：

選項內容、

玩家狀態、

Identity、

限制條件

形成：

```text
Decision Result
```

---

## Decision Result

Prototype v2

中的 Decision Result

至少包含：

```text
decisionId

playerId

day

decisionType

selectedOption

stateEffects

progressionInput

relationshipInput

eventTags

coachObservationTags

narrativeTags

timestamp
```

---

## Important Rule

Decision Result

只描述：

這次選擇產生了哪些輸出。

Decision System

不能直接修改：

```text
Current State

Progression Data

Relationship Data

Coach Evaluation

Narrative Memory
```

它只能：

產生合法 Result

交給對應的 Owner System。

---

# Phase 07

# Check Event

Event System

接收：

```text
Day Context

Decision Result

Current State View

Relationship View

Identity View
```

判斷：

是否產生事件。

---

## Event Rule

Event

不是：

每一天強制發生。

Event System

可以輸出：

```text
No Event
```

或：

```text
Event Triggered
```

---

## Event Trigger Sources

Prototype v2

事件可由以下因素觸發：

```text
Decision Tags

Current State Threshold

Relationship Condition

Identity Tension

Previous Event State

Random Chance
```

隨機機率

可以影響：

事件是否發生。

但：

不能完全取代條件。

---

## Event Result

若事件發生，

Event System

產生：

```text
Event Result
```

至少包含：

```text
eventId

playerId

day

triggerSource

eventOutcome

stateEffects

relationshipEffects

progressionInput

coachObservationTags

organizationTags

narrativeTags

followUpState
```

Event System

不能直接修改：

其他 System 的資料。

---

# Phase 08

# Apply State Changes

Current State System

接收：

State Change Request

可以由以下來源建立：

Decision Result

Event Result

Injury Result

Organization Response

Time Advance Request

可以由以下結果轉換而來：

Decision Result

Event Result

Injury Result

Organization Response

Time Advance Request

驗證 State Change Request 後：

更新 Current State Data。

---

## Possible State Changes

例如：

```text
energy
```

```text
fatigue
```

```text
physicalCondition
```

```text
mentalCondition
```

```text
motivation
```

```text
stress
```

```text
availability
```

```text
activeEffects
```

---

## Output

Current State System

產生：

```text
State Changed Result
```

其他 System

只能讀取結果。

不能：

再次直接修改 Current State。

---

# Phase 09

# Apply Progression

Progression System

接收：

```text
Decision Result

Event Result

Match Result
```

判斷：

今天是否產生成長累積。

---

## Progression Principle

不是：

做一次訓練

就立即升級。

Progression

應區分：

```text
Growth Input

↓

Growth Accumulation

↓

Growth Threshold

↓

Progression Result
```

Prototype v2

可以使用簡化模型。

但不能：

讓 Decision System

直接增加永久能力。

---

## Possible Progression Input

例如：

```text
technicalPractice

physicalTraining

gameUnderstanding

mentalExperience

teamworkExperience
```

---

## Output

Progression System

產生：

```text
Progression Result
```

可能結果包括：

```text
累積增加
```

```text
沒有明顯成長
```

```text
能力發生變化
```

```text
解鎖新的理解
```

---

# Phase 10

# Update Relationship

Relationship System

接收：

```text
Decision Result

Event Result

Interaction Result
```

判斷：

人際關係是否改變。

---

## Relationship Principle

單次互動

不一定：

立即改變關係層級。

Relationship

應透過：

```text
Interaction

↓

Impression

↓

Accumulation

↓

Relationship Change
```

逐步形成。

---

## Output

Relationship System

產生：

```text
Relationship Changed Result
```

或：

```text
Relationship Observation
```

例如：

```text
隊友開始認為玩家願意分擔工作。
```

不一定要：

立即顯示精確數值。

---

# Phase 11

# Coach Observation

Coach System

讀取：

```text
Decision Result

Event Result

State Changed Result

Progression Result

Relationship View

Match Result
```

形成：

今天教練真正能觀察到的內容。

---

## Observation Rule

Coach

不能：

讀取世界中的所有真相。

Coach

只能觀察：

合理可見的資訊。

例如：

教練可以看到：

```text
玩家是否準時到場
```

```text
訓練時的態度
```

```text
疲勞造成的表現下降
```

教練不一定知道：

```text
玩家內心真正的動機
```

```text
玩家未說出口的 Identity Tension
```

---

## Output

Coach System

先產生：

```text
Coach Observation
```

至少包含：

```text
coachId

playerId

day

observedBehavior

observedPerformance

observationSource

confidence
```

Observation

不等於：

Evaluation。

---

# Phase 12

# Coach Evaluation

Coach System

根據：

```text
Historical Observation

Current Observation

Relationship Context

Coach Philosophy

Role Expectation
```

更新：

```text
Coach Evaluation
```

---

## Evaluation Principle

教練的評價

不是：

客觀真相。

而是：

教練根據有限資訊

形成的專業判斷。

---

## Output

Coach Evaluation

至少包含：

```text
coachId

playerId

evaluationDimensions

currentImpression

confidence

recommendationTags

updatedAt
```

Coach Evaluation

可以提供給：

```text
Organization System

Narrative System

UI System
```

但只有 Coach System

可以直接修改。

---

# Phase 13

# Organization Check

Organization System

接收：

```text
Coach Evaluation

Current State View

Progression View

Relationship View

Organization State

Roster Need

Schedule Context
```

判斷：

球隊是否需要回應。

---

## Organization Response

Prototype v2

不需要：

每天都產生重大安排。

可能輸出：

```text
No Organization Change
```

```text
Training Assignment
```

```text
Role Adjustment
```

```text
Practice Opportunity
```

```text
Restriction
```

---

## Important Rule

Organization

不是：

Coach 的延伸。

教練建議：

只是輸入之一。

Organization

仍需考慮：

```text
制度

位置需求

競爭

名額

時間

球隊安排
```

---

# Phase 14

# Narrative Reflection

Narrative System

讀取：

```text
Decision Result

Event Result

State Changed Result

Progression Result

Relationship Changed Result

Coach Evaluation

Organization Response
```

判斷：

今天是否形成：

值得記住的人生片段。

---

## Narrative Rule

不是：

每天都建立重大 Memory。

Narrative System

可以：

只留下簡短紀錄。

也可以：

不建立新的 Narrative Memory。

---

## Possible Narrative Outputs

```text
Daily Record
```

```text
Meaningful Memory
```

```text
Identity Reflection Request
```

```text
Long-Term Theme Update
```

Narrative System

不能：

直接修改 Identity。

只能提出：

```text
Identity Reflection Request
```

---

# Phase 15

# Day Summary

UI System

整理今天已經完成的結果。

---

## Day Summary Content

至少可包含：

```text
今天選擇了什麼
```

```text
當前狀態如何變化
```

```text
是否產生成長
```

```text
是否改變關係
```

```text
是否被教練注意
```

```text
球隊是否產生回應
```

```text
今天留下了什麼記憶
```

---

## Information Rule

Day Summary

不應：

暴露所有隱藏數值。

UI

應顯示：

玩家合理可理解的資訊。

例如：

```text
教練似乎開始注意你的訓練態度。
```

不一定顯示：

```text
Coach Trust +4
```

---


# Phase 16

# Advance Time

所有當日結果完成後，

才能：

推進時間。

---

## Time Advance

Prototype v2

至少執行：

```text
day +1
```

以及：

```text
恢復部分 energy
```

```text
更新 fatigue
```

```text
更新 activeEffects duration
```

```text
更新 injury duration
```

```text
更新 organization schedule
```

---

## Important Rule

Advance Time

不是：

單純修改 day 數值。

它代表：

所有需要隨時間變化的 System

收到：

```text
Time Advance Request
```

並更新自己的資料。

時間本身：

不是獨立 System。

但：

所有 System

都必須遵守相同時間。

---

# Phase 17

# Save

Save System

接收：

各 System

提供的合法資料快照。

---

## Save Content

Prototype v2

至少保存：

```text
Player Data

Identity Data

Current State Data

Decision History

Event State

Progression Data

Relationship Data

Coach Evaluation

Organization State

Career State

Injury Data

Narrative Memory
```

---

## Save Rule

Save System

只能：

保存與還原。

不能：

修改 Gameplay Result。

不能：

補造缺失的遊戲狀態。

---


# Phase 18

# Next Day

當所有時間更新完成後，

重新進入：

```text
Day Start
```

形成：

可重複的核心循環。

```text
Day Start

↓

Decision

↓

Consequence

↓

World Response

↓

Memory

↓

Save

↓

Advance Time

↓

Next Day
```

---

# No-Event Day

Prototype v2

必須支援：

沒有特殊事件的一天。

例如：

```text
玩家選擇休息

↓

沒有觸發 Event

↓

疲勞下降

↓

沒有明顯成長

↓

教練沒有新的評價

↓

Narrative 留下簡短日常紀錄

↓

進入下一天
```

這仍然是：

合法且完整的一天。

---

# Major-Event Day

Prototype v2

也必須支援：

重大事件日。

例如：

```text
玩家選擇加練

↓

疲勞過高

↓

觸發受傷事件

↓

Current State 改變

↓

Injury Data 建立

↓

Coach 形成判斷

↓

Organization 限制訓練

↓

Narrative 建立重大記憶

↓

進入下一天
```

重大事件

仍然使用：

相同 Day Loop。

不能：

另外建立一套完全不同的流程。

---

# Day Loop Ownership

每個階段的主要 Owner 如下。

| Phase | Primary Owner |
|---|---|
| Day Start | Script / Application Controller |
| Load Current Context | Application Controller |
| Present Player State | UI System |
| Generate Available Decisions | Decision System |
| Player Decision | UI System → Decision System |
| Resolve Decision | Decision System |
| Check Event | Event System |
| Apply State Changes | Current State System |
| Apply Progression | Progression System |
| Update Relationship | Relationship System |
| Coach Observation | Coach System |
| Coach Evaluation | Coach System |
| Organization Check | Organization System |
| Narrative Reflection | Narrative System |
| Day Summary | UI System |
| Save | Save System |
| Advance Time | Application Controller + Data Owners |
| Next Day | Application Controller |

---

# Application Controller Rule

Day Loop

需要一個：

Application Controller

負責：

依順序呼叫各 System。

Prototype 現有程式中，

這個角色

可能由：

```text
script.js
```

暫時承擔。

但是：

Application Controller

不能：

自己執行 Gameplay Logic。

它可以：

```text
呼叫 Decision System
```

```text
把 Decision Result 送給 Event System
```

```text
要求 Current State System 套用變更
```

```text
要求 Save System 建立存檔
```

它不能：

```text
自己計算疲勞
```

```text
自己改變 Relationship
```

```text
自己形成 Coach Evaluation
```

```text
自己建立 Narrative Memory
```

Application Controller

負責：

流程。

各 System

負責：

規則。

---

# Day Loop Failure Handling

若任何階段失敗，

Day Loop

不應：

繼續使用不完整資料。

例如：

```text
Decision Result 無效
```

則：

不能進入 Event Check。

```text
Current State 更新失敗
```

則：

不能建立 Day Summary。

```text
Save 失敗
```

則：

不能告訴玩家已成功完成存檔。
```

Prototype v2

至少應：

記錄：

```text
failedPhase

errorType

relatedId

timestamp
```

---

# Day Loop Completion Criteria

Day Loop v1.0

完成時，

應能回答：

```text
今天是由誰開始？
```

```text
玩家何時做出選擇？
```

```text
Decision Result 如何進入其他 System？
```

```text
Event 可以不發生嗎？
```

```text
Coach 何時形成 Observation？
```

```text
Organization 是否每天都必須回應？
```

```text
Narrative 是否每天都必須建立重大 Memory？
```

```text
何時可以存檔？
```

```text
何時可以進入下一天？
```

正確原則為：

```text
流程由 Application Controller 推進。
```

```text
玩家在理解當前狀態後做出 Decision。
```

```text
Decision System 只輸出 Result，不直接修改其他資料。
```

```text
Event 可以不發生。
```

```text
Coach 在狀態、成長與關係結果形成後進行觀察。
```

```text
Organization 不必每天產生新安排。
```

```text
Narrative 不必每天建立重大 Memory。
```

```text
所有當日結果完成後才能存檔。
```

```text
存檔與時間更新完成後才能進入下一天。
```

---

# Final Loop

Prototype v2

最終核心循環為：

```text
看見自己

↓

做出選擇

↓

承擔變化

↓

被世界看見

↓

留下記憶

↓

進入明天
```

這個循環

是《棒球人生》

Prototype v2

最重要的可玩基礎。