# Prototype Data Contract

Version:

1.0

---

# Purpose

Prototype Data Contract

定義：

Prototype v2

中，

所有 System

如何：

- 擁有資料
- 讀取資料
- 修改資料
- 傳遞資料

這份文件

不是：

資料庫設計。

也不是：

完整欄位清單。

它首先回答：

> 哪一個 System 擁有哪一份資料？

以及：

> 哪些 System 可以讀取？  
> 哪些 System 可以修改？

---

# Why Data Contract Exists

Architecture

定義：

每個 System

負責什麼。

Data Contract

則定義：

每個 System

如何透過資料合作。

沒有 Data Contract，

System 很容易：

直接修改其他 System 擁有的資料。

例如：

```text
Coach

直接修改 Player Data。
```

```text
Organization

直接建立 Narrative Memory。
```

```text
UI

直接改變 Current State。
```

這些做法：

即使短期方便，

也會破壞 Architecture。

---

# Core Rule

每一份重要資料，

都必須只有一個 Owner。

```text
One Data

↓

One Owner
```

Owner 負責：

- 建立資料
- 驗證資料
- 更新資料
- 刪除資料

其他 System

可以依照契約讀取資料。

但是：

不能直接修改資料。

---

# Ownership Does Not Mean Isolation

Data Ownership

不代表：

資料只能被 Owner 看見。

例如：

Player Data

由 Player System 擁有。

但是：

- Coach
- Organization
- Narrative
- UI
- Save

都可能需要讀取。

因此：

```text
Ownership

≠

Visibility
```

資料可以共享。

修改權不能共享。

---

# Read and Write

Data Contract

區分兩種基本權限：

- Read
- Write

---

## Read

Read 代表：

System 可以查看資料，

並根據資料做出判斷。

但是：

不能直接修改資料。

例如：

```text
Coach

Read

Current State
```

Coach 可以觀察：

- 疲勞
- 身體狀態
- 近期行為
- 訓練表現

但是：

Coach 不能直接修改疲勞值。

---

## Write

Write 代表：

System 可以修改自己擁有的資料。

例如：

```text
Current State System

Write

Current State Data
```

其他 System

如果希望 Current State 發生改變，

必須送出：

- Input
- Request
- Result
- Event

再由 Current State System

判斷並執行修改。

其他 System

不能直接改值。

---

# Data Ownership Principles

Prototype v2

遵守以下原則。

---

## Principle 01

每一份核心資料

只有一個 Owner。

---

## Principle 02

只有 Owner

可以直接 Write。

---

## Principle 03

其他 System

透過以下物件與 Owner 合作：

```text
Input

Request

Result

Event
```

---

## Principle 04

UI

只能讀取與呈現資料。

UI 不能直接修改 Gameplay Data。

---

## Principle 05

Save

只能保存與還原資料。

Save 不能自行建立 Gameplay Result。

---

## Principle 06

共享資料物件

必須清楚定義：

- 來源
- 用途
- 接收者
- 生命週期

---

# Core Data Ownership

Prototype v2

核心資料擁有權如下。

| Data | Owner | Primary Readers | Direct Writer | Persist |
|---|---|---|---|---|
| Player Data | Player System | Identity、Current State、Decision、Coach、Organization、Narrative、UI、Save | Player System | Yes |
| Identity Data | Identity System | Decision、Event、Relationship、Coach、Narrative、UI、Save | Identity System | Yes |
| Current State Data | Current State System | Decision、Event、Coach、Organization、Injury、UI、Save | Current State System | Yes |
| Decision History | Decision System | Event、Coach、Narrative、UI、Save | Decision System | Yes |
| Event State | Event System | Current State、Relationship、Coach、Narrative、UI、Save | Event System | Yes |
| Relationship Data | Relationship System | Event、Coach、Organization、Narrative、UI、Save | Relationship System | Yes |
| Coach Evaluation | Coach System | Organization、Narrative、UI、Save | Coach System | Yes |
| Organization State | Organization System | Career、Event、Narrative、UI、Save | Organization System | Yes |
| Progression Data | Progression System | Current State、Coach、Organization、UI、Save | Progression System | Yes |
| Injury Data | Injury System | Current State、Coach、Organization、Narrative、UI、Save | Injury System | Yes |
| Career State | Career System | Organization、Narrative、UI、Save | Career System | Yes |
| Narrative Memory | Narrative System | UI、Save | Narrative System | Yes |
| Save Snapshot | Save System | Save System | Save System | Yes |
| UI View State | UI System | UI System | UI System | Optional |

---

# Ownership Interpretation

上述表格中的：

## Owner

代表：

唯一可以直接修改該資料的 System。

---

## Primary Readers

代表：

Prototype v2

目前預期會讀取該資料的 System。

Primary Readers

不是永久且不可改變的名單。

後續新增功能時，

可以經過 Architecture Review 後擴充。

---

## Direct Writer

代表：

可以直接寫入該資料的 System。

原則上：

```text
Direct Writer

=

Owner
```

如果 Direct Writer

與 Owner 不同，

必須重新檢查 Architecture。

---

## Persist

代表：

該資料是否需要存入存檔。

```text
Yes

需要存檔
```

```text
No

不需要存檔
```

```text
Optional

依實作需求決定
```

---

# Important Restriction

即使某個 System

可以讀取資料，

也不代表它應該取得完整資料。

正式實作時，

應優先提供：

該 System 真正需要的資訊。

而不是：

把完整物件交給所有 System。

例如：

Coach 可能需要：

```text
近期疲勞

訓練出席

最近決策

比賽表現
```

但是 Coach

不一定需要 Player Data

中的所有內部欄位。

因此：

Data Contract

未來應逐步從：

```text
System Read Data
```

細化為：

```text
System Read View
```

Prototype v2

先確立：

Data Ownership。

後續再細化：

欄位層級的讀取權限。

---

# Part 1 Completion Check

完成 Part 1 後，

應能回答以下問題：

```text
Player Data

由誰擁有？
```

```text
Coach Evaluation

由誰修改？
```

```text
UI

是否可以直接改變 Current State？
```

```text
Save

是否可以自行產生 Gameplay Result？
```

正確答案應為：

```text
Player Data

由 Player System 擁有。
```

```text
Coach Evaluation

只能由 Coach System 直接修改。
```

```text
UI

不能直接改變 Current State。
```

```text
Save

不能自行產生 Gameplay Result。
```
---

# Part 2

# Foundation System Contracts

System Contract

定義：

每個 System

可以：

- 讀取哪些資料
- 建立哪些資料
- 修改哪些資料
- 接收哪些輸入
- 輸出哪些物件
- 禁止進行哪些操作

Prototype v2

先從三個 Foundation Systems 開始：

```text
Player System

Identity System

Current State System
```

這三個 System

共同建立：

玩家人生的基礎狀態。

---

# Player System Contract

## Purpose

Player System

負責：

玩家角色本身的核心資料。

它回答：

```text
這位玩家角色是誰？
```

Player System

不回答：

```text
玩家現在感覺如何？
```

```text
玩家想成為誰？
```

```text
玩家今天做了什麼？
```

上述問題

分別屬於：

```text
Current State

Identity

Decision
```

---

## Owned Data

Player System

唯一擁有：

```text
Player Data
```

Prototype v2

中的 Player Data

至少包含：

```text
playerId

name

age

baseballStage

position

dominantHand

createdAt
```

欄位用途如下。

| Field | Meaning |
|---|---|
| playerId | 玩家角色的唯一識別碼 |
| name | 玩家角色名稱 |
| age | 當前年齡 |
| baseballStage | 當前棒球階段，例如少棒入門 |
| position | 主要守備位置 |
| dominantHand | 慣用手 |
| createdAt | 角色建立時間 |

---

## Read Access

Player System

可以讀取：

```text
Character Creation Input

Career Transition Request

Save Restore Data
```

Player System

不需要：

讀取所有其他 System 的完整資料。

---

## Write Access

Player System

可以直接：

```text
Create Player Data

Update Player Data

Validate Player Data

Restore Player Data
```

只有 Player System

可以直接修改：

```text
Player Data
```

---

## Accepted Inputs

Player System

可以接收以下輸入。

### Character Creation Input

```text
name

age

position

dominantHand

startingStage
```

用途：

建立新的 Player Data。

---

### Career Transition Request

```text
playerId

nextStage

effectiveDate

reason
```

用途：

經過合法流程後，

更新玩家的：

```text
age

baseballStage
```

Player System

不能自行決定：

是否升級、

轉隊、

進入下一階段。

它只負責：

在合法結果成立後，

更新 Player Data。

---

### Save Restore Data

```text
savedPlayerData
```

用途：

從存檔還原 Player Data。

Player System

必須：

驗證存檔資料是否合法，

再進行還原。

---

## Outputs

Player System

可以輸出：

### Player View

提供其他 System

安全讀取的角色資料。

```text
playerId

name

age

baseballStage

position

dominantHand
```

Player View

是唯讀資料。

接收者不能：

直接修改原始 Player Data。

---

### Player Created Result

```text
playerId

created

timestamp
```

用途：

通知其他 System：

玩家角色已成功建立。

---

### Player Updated Result

```text
playerId

changedFields

reason

timestamp
```

用途：

通知其他 System：

Player Data 已完成合法更新。

---

## Forbidden Operations

Player System

不能：

```text
建立 Identity
```

```text
修改 Current State
```

```text
替玩家做 Decision
```

```text
直接建立 Event
```

```text
直接形成 Narrative Memory
```

```text
自行決定 Career Result
```

Player System

只管理：

玩家角色的核心資料。

---

# Identity System Contract

## Purpose

Identity System

負責：

玩家如何理解自己，

以及：

玩家想成為什麼樣的人。

它回答：

```text
我是誰？
```

```text
我想成為誰？
```

```text
我為什麼打棒球？
```

Identity

不是：

能力值。

也不是：

短期情緒。

---

## Owned Data

Identity System

唯一擁有：

```text
Identity Data
```

Prototype v2

中的 Identity Data

至少包含：

```text
playerId

idealSelf

aspiration

roleIdentity

baseballGoal

identityHistory
```

欄位用途如下。

| Field | Meaning |
|---|---|
| playerId | 對應的玩家角色 |
| idealSelf | 玩家理想中的球員形象 |
| aspiration | 玩家對棒球與成長的核心追求 |
| roleIdentity | 玩家目前如何理解自己 |
| baseballGoal | 玩家打棒球的長期目標 |
| identityHistory | Identity 發生重大改變的紀錄 |

---

## Read Access

Identity System

可以讀取：

```text
Player View

Identity Creation Input

Identity Reflection Input

Identity Reflection Request

Save Restore Data
```

Identity System

可以知道：

玩家的基本身份。

但是：

不能直接修改 Player Data。

---

## Write Access

Identity System

可以直接：

```text
Create Identity Data

Update Identity Data

Append Identity History

Validate Identity Data

Restore Identity Data
```

只有 Identity System

可以直接修改：

```text
Identity Data
```

---

## Accepted Inputs

### Identity Creation Input

```text
playerId

idealSelf

aspiration

roleIdentity

baseballGoal
```

用途：

在建立角色階段，

建立初始 Identity。

---

### Identity Reflection Input

```text
playerId

trigger

previousIdentity

proposedChange

reason
```

用途：

當玩家經歷重要事件後，

提出 Identity 反思。

Identity System

必須判斷：

這是否真的構成：

身份改變。

不是每一次 Decision

都會改變 Identity。

---

### Identity Reflection Request

```text
playerId

memoryId

meaning

identityPressure
```

用途：

Narrative System

可以提出：

某段人生經驗

可能影響 Identity。

但：

Narrative System

不能直接修改 Identity Data。

最終是否更新，

由 Identity System 決定。

---

### Save Restore Data

```text
savedIdentityData
```

用途：

從存檔還原 Identity Data。

---

## Outputs

### Identity View

提供其他 System

安全讀取的身份資料。

```text
playerId

idealSelf

aspiration

roleIdentity

baseballGoal
```

---

### Identity Created Result

```text
playerId

created

timestamp
```

---

### Identity Changed Result

```text
playerId

previousIdentity

currentIdentity

reason

timestamp
```

只有當：

Identity

發生真正改變時，

才建立此 Result。

---

### Identity Tension View

提供 Decision、Event 或 Narrative

理解玩家當前身份拉扯。

```text
idealSelf

currentRoleIdentity

activeTension

relatedGoal
```

例如：

```text
理想自己：

關鍵時刻能站出來的球員
```

```text
目前自我理解：

遇到壓力時容易想太多
```

兩者之間：

可以形成 Identity Tension。

---

## Forbidden Operations

Identity System

不能：

```text
直接增加能力值
```

```text
直接修改疲勞
```

```text
直接改變 Relationship
```

```text
直接決定 Event 結果
```

```text
直接決定 Career Result
```

```text
因單次選擇就任意改寫 Identity
```

Identity

應透過：

長期經驗、

重大事件、

反思

逐步形成。

---

# Current State System Contract

## Purpose

Current State System

負責：

玩家此刻的狀態。

它回答：

```text
玩家現在處於什麼狀態？
```

Current State

是短期且可變動的。

它不同於：

```text
Player Data
```

也不同於：

```text
Identity Data
```

---

## Owned Data

Current State System

唯一擁有：

```text
Current State Data
```

Prototype v2

中的 Current State Data

至少包含：

```text
playerId

day

timeSegment

energy

fatigue

physicalCondition

mentalCondition

motivation

stress

availability

activeEffects
```

欄位用途如下。

| Field | Meaning |
|---|---|
| playerId | 對應的玩家角色 |
| day | Prototype 當前天數 |
| timeSegment | 當前時間區段 |
| energy | 當前可用精力 |
| fatigue | 累積疲勞 |
| physicalCondition | 身體狀態 |
| mentalCondition | 心理狀態 |
| motivation | 當前動機 |
| stress | 當前壓力 |
| availability | 玩家目前是否能參與特定活動 |
| activeEffects | 仍在作用中的短期效果 |

---

## Read Access

Current State System

可以讀取：

```text
Player View

State Change Request

Decision Result

Event Result

Progression Result

Injury Result

Time Advance Request

Save Restore Data
```

Current State System

只讀取：

完成判斷所需的資料。

---

## Write Access

Current State System

可以直接：

```text
Create Current State

Apply State Change

Advance Time State

Add Active Effect

Remove Active Effect

Validate Current State

Restore Current State
```

只有 Current State System

可以直接修改：

```text
Current State Data
```

---

## Accepted Inputs

### State Change Request

```text
sourceSystem

playerId

changes

reason

duration

timestamp
```

範例：

```text
sourceSystem:

Decision System
```

```text
changes:

energy -10

fatigue +8
```

Current State System

收到 Request 後，

必須：

驗證變更是否合法，

再執行修改。

---

### Decision Result

```text
decisionId

playerId

stateEffects

timestamp
```

用途：

套用玩家選擇產生的狀態影響。

Decision System

不能直接改變：

energy

fatigue

stress

或其他 Current State 欄位。

---

### Event Result

```text
eventId

playerId

stateEffects

timestamp
```

用途：

套用事件結果造成的狀態改變。

---

### Progression Result

```text
progressionId

playerId

stateEffects

timestamp
```

用途：

套用成長結果對短期狀態的影響。

例如：

```text
新訓練負荷造成短期疲勞
```

---

### Injury Result

```text
injuryId

playerId

availabilityChange

physicalEffects

duration
```

用途：

反映傷病對玩家當前狀態的影響。

Injury System

擁有 Injury Data。

Current State System

負責呈現：

傷病在此刻造成的狀態。

---

### Time Advance Request

```text
fromDay

toDay

fromTimeSegment

toTimeSegment
```

用途：

隨時間推進，

執行：

```text
恢復

疲勞變化

效果倒數

狀態刷新
```

---

### Save Restore Data

```text
savedCurrentState
```

用途：

從存檔還原 Current State。

---

## Outputs

### Current State View

提供其他 System

安全讀取的當前狀態。

```text
playerId

day

timeSegment

energy

fatigue

physicalCondition

mentalCondition

motivation

stress

availability

activeEffects
```

---

### State Changed Result

```text
playerId

previousState

currentState

appliedChanges

sourceSystem

reason

timestamp
```

用途：

通知其他 System：

Current State 已完成合法變更。

---

### Availability View

提供 Decision、Event、Coach、Organization

判斷玩家目前可否參與活動。

```text
available

restrictions

reason
```

例如：

```text
available:

false
```

```text
restrictions:

不能參加高強度訓練
```

```text
reason:

疲勞過高
```

---

### Daily State Summary

提供 Coach、Narrative、UI

理解玩家當日狀態。

```text
day

energyLevel

fatigueLevel

physicalCondition

mentalCondition

majorEffects
```

---

## Forbidden Operations

Current State System

不能：

```text
決定玩家今天選擇什麼
```

```text
決定 Event 是否發生
```

```text
自行建立 Injury
```

```text
自行形成 Coach Evaluation
```

```text
直接修改 Identity
```

```text
直接增加永久能力
```

Current State System

只負責：

玩家此刻的狀態。

---

# Foundation Contract Relationship

三個 Foundation Systems

之間的關係如下。

```text
Player System

建立：

Player Data

↓

Identity System

依照 Player View

建立：

Identity Data

↓

Current State System

依照 Player View

建立：

Current State Data
```

三者各自擁有：

不同資料。

```text
Player System

擁有：

我是誰
```

```text
Identity System

擁有：

我如何理解自己
```

```text
Current State System

擁有：

我現在怎麼樣
```

三者不能：

互相直接修改資料。

---

# Example Foundation Flow

建立角色時：

```text
Character Creation Input

↓

Player System

↓

Player Created Result

↓

Identity System

↓

Identity Created Result

↓

Current State System

↓

Current State Created Result
```

開始遊戲後：

```text
Player View

Identity View

Current State View

↓

Decision System
```

Decision System

只能讀取 View。

不能直接修改：

```text
Player Data

Identity Data

Current State Data
```

---

# Part 2 Completion Check

完成 Part 2 後，

應能回答：

```text
玩家年齡由誰修改？
```

答案：

```text
Player System
```

```text
玩家理想中的球員形象由誰管理？
```

答案：

```text
Identity System
```

```text
疲勞與精力由誰管理？
```

答案：

```text
Current State System
```

```text
Decision System 能否直接扣除 energy？
```

答案：

```text
不能。

Decision System 必須輸出 Decision Result，

再由 Current State System 套用變更。
```

```text
Narrative System 能否直接改變 Identity？
```

答案：

```text
不能。

Narrative System 只能提出 Identity Reflection Request，

由 Identity System 判斷是否更新。
```
---

# Part 3

# Gameplay Shared Objects

Shared Object

是：

System 之間

傳遞結果與請求時

使用的資料物件。

Shared Object

不屬於：

所有 System。

每一個 Shared Object

仍然必須有：

```text
Creator

Source of Truth

Recipients

Lifecycle
```

Shared Object

的目的不是：

讓所有 System

共同修改同一份資料。

而是：

讓資料可以在 System 之間

安全傳遞。

---

# Shared Object Principles

Prototype v2

遵守以下原則。

---

## Principle 01

Shared Object

建立後：

應視為唯讀。

接收者不能：

修改原始物件。

---

## Principle 02

每個 Shared Object

只有一個 Creator。

---

## Principle 03

Shared Object

只描述：

已發生的結果

或：

希望發生的請求。

---

## Principle 04

Result

不等於：

資料已經被所有 Owner System 套用。

例如：

```text
Decision Result

包含：

fatigue +8
```

不代表：

Current State Data

已經改變。

只有：

Current State System

接受並套用後，

Current State

才真正改變。

---

## Principle 05

Request

可以：

被 Owner System 拒絕。

例如：

```text
State Change Request

要求：

energy -200
```

Current State System

可以判斷：

此變更不合法。

---

## Principle 06

Shared Object

必須包含：

足以追蹤來源的識別資料。

例如：

```text
sourceSystem

sourceId

playerId

day

timestamp
```

---

# Shared Object Lifecycle

Shared Object

基本生命週期如下。

```text
System Creates Object

↓

Application Controller Routes Object

↓

Receiving System Validates Object

↓

Receiving System Applies Own Rules

↓

Receiving System Updates Owned Data

↓

Receiving System Creates Result
```

Application Controller

只負責：

傳遞。

不能：

自行改寫物件內容。

---

# Decision Result

## Purpose

Decision Result

描述：

玩家完成一次合法選擇後，

Decision System

所產生的結果。

它回答：

```text
玩家選擇了什麼？
```

以及：

```text
這個選擇可能影響哪些 System？
```

---

## Creator

```text
Decision System
```

只有 Decision System

可以建立：

Decision Result。

---

## Source Inputs

Decision System

建立 Decision Result 時

可以讀取：

```text
Decision Input

Day Context

Player View

Identity View

Current State View

Relationship View

Organization Context View
```

---

## Minimum Structure

Prototype v2

中的 Decision Result

至少包含：

```text
resultId

decisionId

playerId

day

timeSegment

decisionType

selectedOption

stateEffects

progressionInput

relationshipInput

eventTags

coachObservationTags

organizationTags

narrativeTags

resolvedAt
```

---

## Field Definition

| Field | Meaning |
|---|---|
| resultId | Decision Result 的唯一識別碼 |
| decisionId | 被玩家選擇的 Decision |
| playerId | 對應玩家 |
| day | 發生日期 |
| timeSegment | 發生時間區段 |
| decisionType | 選擇類型，例如訓練、互動、恢復 |
| selectedOption | 玩家實際選擇的選項 |
| stateEffects | 對 Current State 的變更建議 |
| progressionInput | 提供給 Progression System 的成長輸入 |
| relationshipInput | 提供給 Relationship System 的互動輸入 |
| eventTags | 提供 Event System 判斷的標籤 |
| coachObservationTags | 教練可能觀察到的行為標籤 |
| organizationTags | 球隊制度可能關注的標籤 |
| narrativeTags | 提供 Narrative System 的意義標籤 |
| resolvedAt | Decision 完成解析的時間 |

---

## Example

```text
resultId:

decision-result-001
```

```text
decisionId:

extra-practice
```

```text
decisionType:

training
```

```text
selectedOption:

留在球場加練
```

```text
stateEffects:

energy -10

fatigue +8
```

```text
progressionInput:

technicalPractice +5
```

```text
eventTags:

extraPractice

highLoad
```

```text
coachObservationTags:

initiative

stayedLate
```

```text
narrativeTags:

pursuit

selfPressure
```

---

## Primary Recipients

Decision Result

可以被以下 System 讀取：

```text
Event System

Current State System

Progression System

Relationship System

Coach System

Organization System

Narrative System

Save System

UI System
```

但：

每個 System

只能使用：

自己需要的部分。

---

## Persistence

Decision Result

本身可以：

存入 Decision History。

但是：

不必永久保存所有暫時欄位。

至少應保存：

```text
decisionId

playerId

day

decisionType

selectedOption

majorTags

resolvedAt
```

---

## Forbidden Usage

Decision Result

不能：

```text
直接修改 Current State
```

```text
直接增加永久能力
```

```text
直接改變 Relationship
```

```text
直接建立 Coach Evaluation
```

```text
直接建立 Narrative Memory
```

Decision Result

只是：

合法輸出。

不是：

跨 System 的修改權。

---

# Event Result

## Purpose

Event Result

描述：

Event System

完成事件判斷與解析後

產生的結果。

它回答：

```text
是否發生事件？
```

以及：

```text
事件留下了什麼影響？
```

---

## Creator

```text
Event System
```

只有 Event System

可以建立：

Event Result。

---

## Event Result Types

Prototype v2

至少支援：

```text
No Event Result
```

以及：

```text
Triggered Event Result
```

---

## No Event Result

當沒有事件發生時，

Event System

仍應輸出：

```text
eventTriggered:

false
```

這代表：

Event Check

已經完成。

而不是：

Event System 沒有執行。

---

## Triggered Event Result

事件發生時，

Event Result

至少包含：

```text
resultId

eventId

playerId

day

eventTriggered

triggerSource

triggerConditions

eventOutcome

stateEffects

progressionInput

relationshipInput

injuryInput

coachObservationTags

organizationTags

narrativeTags

followUpState

resolvedAt
```

---

## Field Definition

| Field | Meaning |
|---|---|
| resultId | Event Result 的唯一識別碼 |
| eventId | 被觸發的 Event |
| playerId | 對應玩家 |
| day | 發生日期 |
| eventTriggered | 是否真的觸發事件 |
| triggerSource | 事件主要觸發來源 |
| triggerConditions | 成立的觸發條件 |
| eventOutcome | 事件解析後的結果 |
| stateEffects | 對 Current State 的影響建議 |
| progressionInput | 對 Progression 的輸入 |
| relationshipInput | 對 Relationship 的輸入 |
| injuryInput | 提供 Injury System 的傷病輸入 |
| coachObservationTags | 教練可能觀察到的內容 |
| organizationTags | 球隊可能回應的內容 |
| narrativeTags | Narrative 可使用的意義標籤 |
| followUpState | 事件後續追蹤狀態 |
| resolvedAt | 事件解析完成時間 |

---

## Example

```text
eventId:

fatigue-warning
```

```text
eventTriggered:

true
```

```text
triggerSource:

Decision Result
```

```text
triggerConditions:

extraPractice

fatigue >= 70
```

```text
eventOutcome:

加練途中出現手臂不適
```

```text
stateEffects:

physicalCondition -10

stress +5
```

```text
injuryInput:

possibleMinorInjury
```

```text
coachObservationTags:

ignoredFatigue

trainingInterrupted
```

```text
organizationTags:

medicalCheckRequired
```

```text
narrativeTags:

limit

consequence

selfPressure
```

---

## Primary Recipients

Event Result

可以被以下 System 讀取：

```text
Current State System

Progression System

Relationship System

Injury System

Coach System

Organization System

Narrative System

Save System

UI System
```

---

## Persistence

Event Result

應由 Event System

保存為：

```text
Event State

Event History

Follow-Up State
```

不一定需要：

永久保存所有計算細節。

但應保存：

```text
eventId

day

eventOutcome

majorEffects

followUpState
```

---

## Forbidden Usage

Event Result

不能：

```text
直接修改 Injury Data
```

```text
直接修改 Current State
```

```text
直接改變 Career State
```

```text
直接形成 Coach Evaluation
```

```text
直接建立 Narrative Memory
```

Event System

描述：

世界發生了什麼。

各 Data Owner

決定：

如何更新自己的資料。

---

# State Change Request

## Purpose

State Change Request

是其他 System

向 Current State System

提出的：

狀態變更請求。

它回答：

```text
哪個 System

希望 Current State

發生什麼改變？
```

---

## Possible Creators

Prototype v2

以下 System

可以建立：

State Change Request。

```text
Decision System

Event System

Progression System

Injury System

Organization System

Application Controller
```

但：

建立 Request

不代表：

可以直接修改 Current State。

---

## Owner and Receiver

```text
Receiver:

Current State System
```

Current State System

是唯一可以：

驗證並套用狀態變更的 System。

---

## Minimum Structure

State Change Request

至少包含：

```text
requestId

sourceSystem

sourceId

playerId

changes

reason

duration

priority

createdAt
```

---

## Field Definition

| Field | Meaning |
|---|---|
| requestId | State Change Request 唯一識別碼 |
| sourceSystem | 建立請求的 System |
| sourceId | 對應的 Decision、Event、Injury 或其他來源 |
| playerId | 對應玩家 |
| changes | 希望套用的狀態變化 |
| reason | 變更原因 |
| duration | 變化持續時間 |
| priority | 多個狀態衝突時的處理優先序 |
| createdAt | Request 建立時間 |

---

## Example

```text
requestId:

state-request-001
```

```text
sourceSystem:

Decision System
```

```text
sourceId:

decision-result-001
```

```text
changes:

energy -10

fatigue +8
```

```text
reason:

留在球場加練
```

```text
duration:

immediate
```

---

## Validation

Current State System

收到 State Change Request 後，

至少應檢查：

```text
sourceSystem 是否合法？
```

```text
sourceId 是否存在？
```

```text
playerId 是否正確？
```

```text
changes 是否為允許欄位？
```

```text
數值是否超出合法範圍？
```

```text
是否與其他狀態衝突？
```

```text
duration 是否有效？
```

---

## Accepted Result

若 Request 合法，

Current State System

產生：

```text
State Changed Result
```

---

## Rejected Result

若 Request 不合法，

Current State System

產生：

```text
State Change Rejected Result
```

至少包含：

```text
requestId

accepted

rejectionReason

timestamp
```

Current State System

不能：

默默忽略錯誤。

---

## State Changed Result

至少包含：

```text
resultId

requestId

playerId

previousState

appliedChanges

currentState

sourceSystem

reason

appliedAt
```

---

## Important Rule

State Change Request

只是一個：

請求。

真正的 Gameplay Truth

是：

```text
Current State System

完成更新後的

Current State Data
```

---

# Progression Result

## Purpose

Progression Result

描述：

Progression System

完成成長計算後

產生的結果。

它回答：

```text
今天的經驗

是否累積成真正的成長？
```

---

## Creator

```text
Progression System
```

只有 Progression System

可以建立：

Progression Result。

---

## Source Inputs

Progression System

可以接收：

```text
Decision Result

Event Result

Match Result

Coach Training Input

Organization Training Assignment
```

---

## Progression Process

Prototype v2

遵守：

```text
Progression Input

↓

Progression Accumulation

↓

Threshold Check

↓

Progression Result
```

Decision System

或 Event System

不能：

直接增加永久能力。

---

## Minimum Structure

Progression Result

至少包含：

```text
resultId

playerId

day

sourceInputs

accumulationChanges

abilityChanges

knowledgeChanges

unlockedContent

stateEffects

coachObservationTags

narrativeTags

resolvedAt
```

---

## Field Definition

| Field | Meaning |
|---|---|
| resultId | Progression Result 唯一識別碼 |
| playerId | 對應玩家 |
| day | 發生日期 |
| sourceInputs | 本次成長的來源 |
| accumulationChanges | 成長累積值變化 |
| abilityChanges | 永久能力是否產生變化 |
| knowledgeChanges | 理解與知識是否產生變化 |
| unlockedContent | 是否解鎖新選項、理解或訓練 |
| stateEffects | 成長過程造成的短期狀態影響 |
| coachObservationTags | 教練可能觀察到的成長 |
| narrativeTags | 成長可能形成的 Narrative 意義 |
| resolvedAt | 成長解析完成時間 |

---

## Example: Accumulation Only

```text
sourceInputs:

technicalPractice +5
```

```text
accumulationChanges:

battingPracticeExperience +5
```

```text
abilityChanges:

none
```

```text
knowledgeChanges:

none
```

這代表：

玩家有累積。

但：

尚未形成明顯能力成長。

---

## Example: Threshold Reached

```text
sourceInputs:

gameUnderstanding +4
```

```text
accumulationChanges:

pitchRecognitionExperience +4
```

```text
knowledgeChanges:

理解外角球的判斷線索
```

```text
unlockedContent:

newDecisionOption
```

這代表：

累積達到門檻，

形成新的理解。

---

## Primary Recipients

Progression Result

可以被以下 System 讀取：

```text
Current State System

Coach System

Organization System

Narrative System

Save System

UI System
```

---

## Persistence

Progression System

應保存：

```text
Progression Data

Accumulation

Permanent Ability Changes

Unlocked Knowledge

Unlocked Content
```

Progression Result

可作為：

Progression History

的一部分保存。

---

## Forbidden Usage

Progression Result

不能：

```text
直接修改 Current State
```

```text
直接修改 Coach Evaluation
```

```text
直接改變 Organization Role
```

```text
直接建立 Narrative Memory
```

若 Progression Result

帶有：

```text
stateEffects
```

必須轉換為：

```text
State Change Request
```

再交給：

Current State System。

---

# Shared Object Transformation

Day Loop

中的物件轉換如下。

```text
Decision Input

↓

Decision System

↓

Decision Result
```

```text
Decision Result

↓

Event System

↓

Event Result
```

```text
Decision Result

Event Result

Progression Result

Injury Result

↓

State Change Request

↓

Current State System

↓

State Changed Result
```

```text
Decision Result

Event Result

Match Result

↓

Progression System

↓

Progression Result
```

---

# Shared Object Routing

Prototype v2

由 Application Controller

負責將物件：

傳送至正確 System。

例如：

```text
Decision Result

↓

Application Controller
```

Application Controller

將其中的：

```text
stateEffects
```

轉送為：

```text
State Change Request
```

交給：

```text
Current State System
```

將：

```text
progressionInput
```

交給：

```text
Progression System
```

將：

```text
relationshipInput
```

交給：

```text
Relationship System
```

將：

```text
eventTags
```

交給：

```text
Event System
```

---

# Routing Restriction

Application Controller

只能：

```text
讀取輸出
```

```text
建立標準 Request
```

```text
傳遞物件
```

```text
依序呼叫 System
```

不能：

```text
自行決定結果
```

```text
自行計算狀態變化
```

```text
自行修改 Gameplay Data
```

例如：

Application Controller

可以把：

```text
stateEffects:

fatigue +8
```

包裝成：

```text
State Change Request
```

但不能：

直接執行：

```text
currentState.fatigue += 8
```

---

# Duplicate Effect Prevention

同一個 Result

不能：

重複套用。

每個 Shared Object

都必須有：

唯一識別碼。

Owner System

應記錄：

已處理的：

```text
resultId

requestId
```

例如：

```text
decision-result-001
```

若已經套用過，

Current State System

不能再次套用。

---

# Ordering Rule

Prototype v2

使用以下順序：

```text
Decision Result

↓

Event Result

↓

State Change Requests

↓

State Changed Result

↓

Progression Result

↓

Additional State Change Request

↓

Relationship Result

↓

Coach Observation

↓

Coach Evaluation

↓

Organization Response

↓

Narrative Reflection
```

---

# Important Ordering Clarification

Decision Result

與 Event Result

應先完成。

Current State System

再合併並驗證：

當日狀態變更。

Progression Result

若產生新的短期狀態影響，

再建立額外的：

State Change Request。

Coach Observation

應讀取：

已經完成套用後的：

```text
State Changed Result

Progression Result

Relationship Result
```

而不是：

只讀取未套用的預測值。

---

# Shared Object Persistence Rule

並非所有 Shared Object

都需要完整永久保存。

Prototype v2

建議如下。

| Shared Object | Persist | Reason |
|---|---|---|
| Decision Result | Partial | 保存玩家選擇與主要結果 |
| Event Result | Partial | 保存事件結果與後續狀態 |
| State Change Request | No / Debug Only | Request 本身通常是暫時資料 |
| State Changed Result | Optional | 可供 Debug 或當日摘要使用 |
| Progression Result | Partial | 保存重要成長與解鎖 |
| Coach Observation | Partial | 支援教練評價歷史 |
| Organization Response | Yes | 影響球隊狀態與安排 |
| Narrative Memory | Yes | 屬於玩家人生記憶 |

---

# Error Handling

每個 Shared Object

都可能：

被拒絕。

Prototype v2

至少支援：

```text
Invalid Input
```

```text
Invalid Source
```

```text
Missing Player
```

```text
Duplicate Result
```

```text
Illegal Field
```

```text
Out of Range
```

```text
Lifecycle Violation
```

錯誤發生時，

至少記錄：

```text
objectType

objectId

sourceSystem

receivingSystem

errorType

reason

timestamp
```

---

# Part 3 Completion Check

完成 Part 3 後，

應能回答：

```text
Decision System 能否直接增加 fatigue？
```

答案：

```text
不能。

它只能建立 Decision Result，

再形成 State Change Request。
```

```text
Event Result 是否代表 Injury Data 已經建立？
```

答案：

```text
不代表。

Event Result 只能提供 injuryInput，

由 Injury System 判斷並建立 Injury Data。
```

```text
State Change Request 是否一定會被接受？
```

答案：

```text
不一定。

Current State System 必須先驗證。
```

```text
Progression Input 是否等於永久能力成長？
```

答案：

```text
不等於。

Progression System 必須先進行累積與門檻判斷。
```

```text
Application Controller 可以直接執行 fatigue +8 嗎？
```

答案：

```text
不能。

它只能建立並傳遞 State Change Request。
```

```text
同一個 Decision Result 可以套用兩次嗎？
```

答案：

```text
不能。

必須透過 resultId 防止重複套用。
```

---

# Part 3 Summary

Prototype v2

最重要的資料交換流程為：

```text
Player Decision

↓

Decision Result

↓

Event Result

↓

State Change Request

↓

State Changed Result

↓

Progression Result

↓

World Response
```

每一個 System

只建立：

自己負責的結果。

每一份 Gameplay Data

只由：

自己的 Owner

完成修改。

---

# Part 4

# World Response and Infrastructure Contracts

Part 4

定義：

玩家選擇與狀態變化完成後，

世界如何：

形成關係、

產生評價、

做出制度回應、

留下人生記憶、

保存遊戲狀態、

呈現給玩家。

Prototype v2

在這個階段

至少包含：

```text
Relationship System

Coach System

Organization System

Narrative System

Save System

UI System
```

---

# Relationship System Contract

## Purpose

Relationship System

負責：

玩家與其他角色之間

長期累積的人際狀態。

它回答：

```text
玩家與這個人之間，

目前形成了什麼關係？
```

Relationship

不是：

單次對話結果。

也不是：

單純的好感度。

它應反映：

```text
信任

熟悉

尊重

依賴

競爭

衝突

距離
```

---

## Owned Data

Relationship System

唯一擁有：

```text
Relationship Data
```

Prototype v2

中的 Relationship Data

至少包含：

```text
relationshipId

playerId

npcId

relationshipType

familiarity

trust

respect

tension

interactionHistory

activeImpressions

updatedAt
```

---

## Field Definition

| Field | Meaning |
|---|---|
| relationshipId | 關係資料唯一識別碼 |
| playerId | 玩家角色 |
| npcId | 關係對象 |
| relationshipType | 關係類型，例如隊友、教練、競爭者 |
| familiarity | 熟悉程度 |
| trust | 信任程度 |
| respect | 尊重程度 |
| tension | 衝突或拉扯程度 |
| interactionHistory | 重要互動紀錄 |
| activeImpressions | 目前仍有效的印象 |
| updatedAt | 最近更新時間 |

---

## Read Access

Relationship System

可以讀取：

```text
Player View

Decision Result

Event Result

Interaction Input

Coach Observation

Organization Response

Save Restore Data
```

---

## Write Access

Relationship System

可以直接：

```text
Create Relationship Data

Apply Relationship Input

Append Interaction History

Add Active Impression

Remove Expired Impression

Update Relationship Dimensions

Restore Relationship Data
```

只有 Relationship System

可以直接修改：

```text
Relationship Data
```

---

## Accepted Inputs

### Relationship Input

至少包含：

```text
inputId

sourceSystem

sourceId

playerId

npcId

interactionType

observedBehavior

relationshipEffects

reason

day

createdAt
```

---

## Example

```text
interactionType:

teamSupport
```

```text
observedBehavior:

陪隊友整理器材
```

```text
relationshipEffects:

familiarity +3

trust +1
```

```text
reason:

主動分擔球隊工作
```

---

## Relationship Process

Prototype v2

遵守：

```text
Interaction

↓

Impression

↓

Accumulation

↓

Relationship Change
```

單次互動

可以形成：

Impression。

但：

不一定立即改變：

Relationship Type

或重大關係階段。

---

## Outputs

### Relationship View

```text
relationshipId

npcId

relationshipType

familiarityLevel

trustLevel

respectLevel

tensionLevel

activeImpressions
```

---

### Relationship Changed Result

```text
resultId

relationshipId

playerId

npcId

previousRelationship

appliedChanges

currentRelationship

reason

changedAt
```

---

### Relationship Observation

提供 Event、Coach、Organization、Narrative

理解目前關係。

```text
npcId

visibleRelationshipState

activeImpressions

recentInteractionTags
```

---

## Forbidden Operations

Relationship System

不能：

```text
直接修改 Identity
```

```text
直接修改 Coach Evaluation
```

```text
直接改變 Organization State
```

```text
直接建立 Narrative Memory
```

```text
因單次互動任意改寫完整關係
```

---

# Coach System Contract

## Purpose

Coach System

負責：

教練如何根據有限資訊

觀察並評價玩家。

它回答：

```text
教練看見了什麼？
```

```text
教練如何解讀？
```

```text
教練目前如何評價玩家？
```

Coach System

不是：

玩家能力的全知掃描器。

Coach Evaluation

也不是：

世界客觀真相。

---

## Owned Data

Coach System

唯一擁有：

```text
Coach Data

Coach Observation History

Coach Evaluation
```

Prototype v2

中的 Coach Data

至少包含：

```text
coachId

name

role

philosophy

evaluationPriorities

observationAccess

relationshipContext
```

Coach Evaluation

至少包含：

```text
evaluationId

coachId

playerId

evaluationDimensions

currentImpression

confidence

recommendationTags

observationHistoryIds

updatedAt
```

---

## Evaluation Dimensions

Prototype v2

可先使用：

```text
attitude

discipline

coachability

teamwork

potential

reliability

physicalReadiness

roleFit
```

這些是：

教練的評價維度。

不是：

玩家的客觀能力資料。

---

## Read Access

Coach System

可以依合理可見性讀取：

```text
Player View

Current State View

Decision Result

Event Result

Progression Result

Relationship Observation

Match Result

Organization Context View

Save Restore Data
```

Coach System

不能因為技術方便

直接讀取：

```text
玩家未表達的完整 Identity Data

隱藏的 Narrative Meaning

所有世界真相
```

需要 Identity 資訊時，

應使用：

經過限制的 View

或玩家可被觀察到的行為。

---

## Write Access

Coach System

可以直接：

```text
Create Coach Observation

Append Observation History

Create Coach Evaluation

Update Coach Evaluation

Create Recommendation

Restore Coach Data
```

只有 Coach System

可以直接修改：

```text
Coach Evaluation
```

---

## Coach Observation

Coach Observation

至少包含：

```text
observationId

coachId

playerId

day

observationSource

observedBehavior

observedPerformance

context

confidence

createdAt
```

---

## Observation Principle

Coach Observation

只記錄：

教練合理能看見的資訊。

例如：

```text
玩家提早到場
```

```text
訓練中多次失誤
```

```text
疲勞明顯影響動作
```

```text
主動協助隊友
```

不能直接記錄：

```text
玩家真正的內心動機
```

除非玩家：

曾明確表達，

或事件已使其可被觀察。

---

## Evaluation Process

```text
Current Observation

↓

Historical Observation

↓

Coach Philosophy

↓

Role Expectation

↓

Relationship Context

↓

Coach Evaluation
```

---

## Outputs

### Coach Observation Result

```text
observationId

coachId

playerId

observedTags

confidence

createdAt
```

---

### Coach Evaluation View

```text
coachId

playerId

evaluationDimensions

currentImpression

confidence

recommendationTags
```

---

### Coach Recommendation

```text
recommendationId

coachId

playerId

recommendationType

reason

confidence

supportingObservationIds

createdAt
```

例如：

```text
recommendationType:

increasePracticeOpportunity
```

Coach Recommendation

只是：

提供 Organization System

參考的專業建議。

不是：

球隊最終決定。

---

## Forbidden Operations

Coach System

不能：

```text
直接修改 Player Data
```

```text
直接增加永久能力
```

```text
直接修改 Current State
```

```text
直接決定 Organization Role
```

```text
直接建立 Career Result
```

```text
把隱藏資料當成教練已知資訊
```

---

# Organization System Contract

## Purpose

Organization System

負責：

球隊與制度如何安排玩家。

它回答：

```text
球隊目前需要什麼？
```

```text
玩家在制度中處於什麼位置？
```

```text
球隊是否要對玩家做出安排？
```

Organization System

不是：

Coach System 的延伸。

教練建議：

只是 Organization Decision

的其中一項輸入。

---

## Owned Data

Organization System

唯一擁有：

```text
Organization Data

Organization State

Roster State

Schedule State

Player Role Assignment

Organization Decision History
```

Prototype v2

至少包含：

```text
organizationId

name

level

philosophy

availableRoles

rosterNeeds

schedule

rules

playerAssignments

decisionHistory
```

---

## Read Access

Organization System

可以讀取：

```text
Player View

Current State View

Progression View

Relationship View

Coach Evaluation View

Coach Recommendation

Injury View

Career State View

Organization Tags

Save Restore Data
```

---

## Write Access

Organization System

可以直接：

```text
Create Organization State

Update Roster Need

Update Schedule

Create Player Assignment

Update Player Role

Create Organization Response

Append Decision History

Restore Organization State
```

只有 Organization System

可以直接修改：

```text
Organization State

Player Role Assignment
```

---

## Organization Decision Input

至少包含：

```text
playerId

currentRole

coachRecommendations

currentAvailability

progressionSummary

relationshipContext

rosterNeed

scheduleContext

applicableRules

sourceTags
```

---

## Decision Process

Prototype v2

遵守：

```text
Coach Recommendation

+

Player Condition

+

Progression

+

Relationship Context

+

Roster Need

+

Schedule

+

Organization Rules

↓

Organization Decision
```

---

## Organization Response

至少包含：

```text
responseId

organizationId

playerId

day

responseType

previousAssignment

newAssignment

reason

supportingInputs

effectiveDate

createdAt
```

---

## Possible Response Types

Prototype v2

至少支援：

```text
No Change

Training Assignment

Practice Opportunity

Role Adjustment

Activity Restriction

Medical Check Request

Special Observation Period
```

---

## Example

```text
responseType:

Practice Opportunity
```

```text
reason:

教練持續觀察到積極訓練態度，

且目前球隊需要測試新的守備安排。
```

Organization Response

應同時反映：

```text
人物評價
```

與：

```text
制度需求
```

而不是：

單純因為玩家累積好感度

就提供獎勵。

---

## Outputs

### Organization Context View

```text
organizationId

level

currentSchedule

rosterNeeds

playerCurrentRole

activeAssignments

activeRestrictions
```

---

### Organization Response

```text
responseId

responseType

reason

effectiveDate

visibleToPlayer

createdAt
```

---

### Career Transition Request

當 Organization Decision

可能影響棒球階段時，

Organization System

只能提出：

```text
Career Transition Request
```

至少包含：

```text
requestId

playerId

currentStage

proposedStage

reason

supportingDecisionId

effectiveDate
```

最終 Career State

由 Career System

判斷與更新。

Organization System

不能直接修改 Career State。

---

## Forbidden Operations

Organization System

不能：

```text
直接修改 Coach Evaluation
```

```text
直接修改 Progression Data
```

```text
直接修改 Relationship Data
```

```text
直接建立 Narrative Memory
```

```text
直接改變 Career State
```

```text
把 Coach Recommendation 當成自動命令
```

---

# Narrative System Contract

## Purpose

Narrative System

負責：

將已經發生的人生經驗

整理為：

可被記住、

可被理解、

可在未來回響的敘事記憶。

它回答：

```text
今天發生的事情，

對玩家的人生有什麼意義？
```

Narrative System

不是：

Event Controller。

也不是：

結果製造器。

Narrative

只能理解：

已經發生的結果。

---

## Owned Data

Narrative System

唯一擁有：

```text
Daily Record

Narrative Memory

Narrative Theme

Memory Connection

Narrative History
```

Prototype v2

中的 Narrative Memory

至少包含：

```text
memoryId

playerId

day

memoryType

title

summary

sourceIds

peopleInvolved

meaningTags

identityRelevance

careerRelevance

emotionalWeight

visibility

createdAt
```

---

## Read Access

Narrative System

可以讀取：

```text
Player View

Identity View

Decision Result

Event Result

State Changed Result

Progression Result

Relationship Changed Result

Coach Evaluation View

Organization Response

Injury Result

Career Result

Save Restore Data
```

Narrative System

只能根據：

已完成並成立的結果

形成 Memory。

不能根據：

尚未套用的 Request

或預測結果

建立人生記憶。

---

## Write Access

Narrative System

可以直接：

```text
Create Daily Record

Create Narrative Memory

Update Narrative Theme

Connect Memories

Archive Memory

Restore Narrative Data
```

只有 Narrative System

可以直接修改：

```text
Narrative Memory
```

---

## Narrative Process

Prototype v2

遵守：

```text
Completed Results

↓

Significance Check

↓

Daily Record

↓

Meaning Check

↓

Narrative Memory

↓

Theme Connection
```

---

## Daily Record

Daily Record

是：

每天可以留下的簡短紀錄。

至少包含：

```text
recordId

playerId

day

selectedDecision

majorResults

visibleWorldResponse

createdAt
```

Daily Record

不一定代表：

重大人生記憶。

---

## Significance Check

Narrative System

可以依下列因素

判斷是否建立 Narrative Memory：

```text
第一次發生

重大結果

長期累積達到轉折

重要人物參與

Identity Tension

Career Relevance

Relationship Change

Injury Consequence

Organization Response

玩家主動選擇的代價
```

---

## Narrative Outputs

### Daily Record

```text
recordId

day

summary

majorTags
```

---

### Narrative Memory

```text
memoryId

day

memoryType

title

summary

meaningTags

peopleInvolved

sourceIds

emotionalWeight
```

---

### Identity Reflection Request

當某段 Memory

可能影響玩家自我理解時，

Narrative System

可以提出：

```text
Identity Reflection Request
```

至少包含：

```text
requestId

playerId

memoryId

currentIdentityContext

identityPressure

possibleReflection

reason

createdAt
```

Identity System

可以：

接受、

拒絕、

延後處理。

Narrative System

不能直接改變 Identity Data。

---

### Narrative View

提供 UI System

呈現人生記憶。

```text
recentRecords

importantMemories

activeThemes

unresolvedThreads
```

---

## Forbidden Operations

Narrative System

不能：

```text
直接修改 Identity
```

```text
直接觸發 Event
```

```text
直接修改 Career State
```

```text
直接改變 Relationship
```

```text
直接修改 Coach Evaluation
```

```text
為了故事效果改寫 Gameplay Result
```

Narrative System

可以：

選擇如何描述。

不能：

改變已發生的事實。

---

# Save System Contract

## Purpose

Save System

負責：

保存與還原

各 System

已經成立的資料。

它回答：

```text
如何讓玩家的人生

可以在下次繼續？
```

Save System

不是：

Gameplay System。

它不能：

製造結果、

修正平衡、

補寫人生。

---

## Owned Data

Save System

唯一擁有：

```text
Save Metadata

Save Snapshot

Save Version

Save Validation Result
```

---

## Save Snapshot

Prototype v2

至少包含：

```text
saveId

saveVersion

createdAt

updatedAt

currentDay

playerData

identityData

currentStateData

decisionHistory

eventState

relationshipData

coachData

coachEvaluation

organizationState

progressionData

injuryData

careerState

narrativeData
```

---

## Read Access

Save System

可以接收：

各 Owner System

提供的：

```text
Serializable Snapshot
```

Save System

不應：

直接存取並任意修改

各 System 的內部資料。

---

## Write Access

Save System

可以直接：

```text
Create Save Snapshot

Validate Save Snapshot

Write Save Data

Read Save Data

Create Restore Package

Migrate Save Version

Delete Save Data
```

Save System

只能修改：

Save System 自己擁有的資料。

---

## Save Process

```text
Application Controller

Requests Snapshot

↓

Each Owner System

Creates Serializable Snapshot

↓

Save System

Validates Snapshot

↓

Save System

Writes Save Data

↓

Save Completed Result
```

---

## Save Completed Result

至少包含：

```text
saveId

success

saveVersion

savedAt

includedSystems

warnings
```

---

## Restore Process

```text
Save System

Reads Save Snapshot

↓

Validates Version

↓

Creates Restore Package

↓

Application Controller

Routes Data to Owners

↓

Each Owner System

Validates and Restores Own Data

↓

Restore Completed Result
```

Save System

不能：

直接把資料塞入其他 System。

每個 Owner System

仍需：

驗證並還原自己的資料。

---

## Migration Rule

當資料版本改變時，

Save System

可以負責：

格式轉換。

但不能：

自行推導新的 Gameplay Result。

例如：

Save System

可以：

```text
把舊欄位名稱轉成新欄位名稱
```

不能：

```text
因為舊存檔缺少 Coach Evaluation，

就自行建立一份正面評價
```

---

## Forbidden Operations

Save System

不能：

```text
自行建立 Decision Result
```

```text
自行建立 Event Result
```

```text
直接修改 Current State
```

```text
直接建立 Narrative Memory
```

```text
補造缺失的 Gameplay Truth
```

```text
在沒有驗證的情況下還原資料
```

---

# UI System Contract

## Purpose

UI System

負責：

將遊戲世界

轉換為玩家可以理解與操作的介面。

它回答：

```text
玩家現在需要知道什麼？
```

```text
玩家現在可以做什麼？
```

```text
遊戲結果應如何被理解？
```

UI System

不是：

Gameplay Logic。

---

## Owned Data

UI System

唯一擁有：

```text
UI View State

Screen State

Selection State

Display Preference

Temporary Feedback State
```

Prototype v2

中的 UI View State

可以包含：

```text
currentScreen

selectedOptionId

expandedPanel

messageQueue

loadingState

errorState
```

---

## Read Access

UI System

可以讀取：

```text
Player View

Identity View

Current State View

Decision Options

Decision Validation Result

Event Presentation View

Relationship View

Coach Evaluation View

Organization Response

Progression View

Narrative View

Save Status
```

UI System

應優先讀取：

專門提供給 UI 的 View。

不應：

任意讀取完整內部資料。

---

## Write Access

UI System

可以直接修改：

```text
UI View State

Selection State

Temporary Feedback State
```

UI System

不能直接修改：

任何 Gameplay Data。

---

## Player Input

UI System

可以建立：

```text
Character Creation Input

Identity Creation Input

Decision Input

Save Request

Load Request

UI Navigation Input
```

UI System

只負責：

收集與傳遞玩家輸入。

最終是否合法，

由對應 System

重新驗證。

---

## Presentation Views

Prototype v2

至少需要：

```text
Player Summary View

Identity Summary View

Current State Summary View

Decision Option View

Day Result View

Relationship Summary View

Coach Feedback View

Organization Response View

Narrative Memory View

Save Status View
```

---

## Hidden Information Rule

UI System

不能因為資料存在

就全部顯示給玩家。

顯示內容

應遵守：

```text
Player Knowledge

Gameplay Readability

Narrative Intent

Information Visibility
```

例如：

Coach Evaluation

內部可能包含：

```text
confidence:

0.63
```

UI

可以只顯示：

```text
教練似乎仍在觀察你的穩定性。
```

---

## UI Result

玩家操作後，

UI System

可以顯示：

```text
Input Accepted

Input Rejected

System Processing

Result Summary

Error Feedback
```

但是：

UI System

不能自行宣告：

Gameplay Result 已成立。

必須等待：

對應 System

回傳合法 Result。

---

## Forbidden Operations

UI System

不能：

```text
直接扣除 energy
```

```text
直接增加能力
```

```text
直接改變 Relationship
```

```text
直接修改 Organization Role
```

```text
直接建立 Narrative Memory
```

```text
跳過 System Validation
```

```text
用顯示資料取代 Gameplay Truth
```

---

# Complete Prototype Data Flow

Prototype v2

完整資料流如下。

```text
Player Input

↓

UI System

↓

Validated Input

↓

Application Controller

↓

Owner System

↓

Shared Result

↓

Application Controller

↓

Receiving Owner Systems

↓

Owned Data Updated

↓

Read Views

↓

UI Presentation
```

---

# Complete Day Data Flow

```text
Player View

Identity View

Current State View

Relationship View

Organization Context View

↓

Decision System

↓

Decision Result

↓

Event System

↓

Event Result

↓

State Change Request

↓

Current State System

↓

State Changed Result

↓

Progression System

↓

Progression Result

↓

Relationship System

↓

Relationship Changed Result

↓

Coach System

↓

Coach Observation

↓

Coach Evaluation

↓

Organization System

↓

Organization Response

↓

Narrative System

↓

Daily Record / Narrative Memory

↓

UI System

↓

Day Summary

↓

Save System

↓

Advance Time
```

---

# Complete Ownership Chain

```text
Player Data

Owner:

Player System
```

```text
Identity Data

Owner:

Identity System
```

```text
Current State Data

Owner:

Current State System
```

```text
Decision History

Owner:

Decision System
```

```text
Event State

Owner:

Event System
```

```text
Progression Data

Owner:

Progression System
```

```text
Relationship Data

Owner:

Relationship System
```

```text
Coach Evaluation

Owner:

Coach System
```

```text
Organization State

Owner:

Organization System
```

```text
Narrative Memory

Owner:

Narrative System
```

```text
Save Snapshot

Owner:

Save System
```

```text
UI View State

Owner:

UI System
```

---

# Cross-System Write Rule

Prototype v2

禁止：

任何 System

直接修改其他 System

擁有的資料。

錯誤示例：

```text
Decision System

直接執行：

currentState.fatigue += 8
```

正確流程：

```text
Decision System

建立：

Decision Result

↓

Application Controller

建立：

State Change Request

↓

Current State System

驗證並套用
```

---

錯誤示例：

```text
Coach System

直接把玩家設為先發
```

正確流程：

```text
Coach System

建立：

Coach Recommendation

↓

Organization System

根據制度與需求判斷

↓

Organization Response
```

---

錯誤示例：

```text
Narrative System

直接改變 roleIdentity
```

正確流程：

```text
Narrative System

建立：

Identity Reflection Request

↓

Identity System

判斷是否更新
```

---

# Read View Rule

各 System

對外提供資料時，

應優先提供：

```text
Read View
```

而不是：

原始可修改物件。

Read View

至少遵守：

```text
只包含接收者需要的資料
```

```text
不能被接收者用來修改 Source of Truth
```

```text
隱藏不應被接收者知道的資訊
```

---

# Result and Request Rule

Prototype v2

區分：

```text
Result
```

與：

```text
Request
```

---

## Result

Result

描述：

某個 System

已經完成的判斷。

例如：

```text
Decision Result
```

```text
Event Result
```

```text
Progression Result
```

```text
Coach Evaluation
```

---

## Request

Request

描述：

希望另一個 Owner System

考慮進行的變更。

例如：

```text
State Change Request
```

```text
Identity Reflection Request
```

```text
Career Transition Request
```

Request

不保證：

一定被接受。

---

# Data Validation Rule

每個 Owner System

在寫入資料前，

都必須驗證：

```text
Input Source
```

```text
Required Fields
```

```text
Player Identity
```

```text
Current Lifecycle Phase
```

```text
Allowed Changes
```

```text
Value Range
```

```text
Duplicate Processing
```

```text
Data Version
```

---

# Data Range Rule

Prototype v2

正式實作欄位時，

需要為數值資料定義：

```text
Minimum

Maximum

Default

Clamp Policy

Invalid Input Policy
```

例如：

```text
fatigue

minimum:

0

maximum:

100
```

但：

欄位具體數值範圍

應在後續：

Prototype Schema

或實作規格中定義。

Data Contract

目前只固定：

誰可以修改。

---

# Duplicate Processing Rule

所有重要 Result

與 Request

都必須有：

唯一識別碼。

例如：

```text
resultId

requestId

observationId

responseId

memoryId
```

Owner System

應避免：

同一物件

被重複處理。

---

# Persistence Rule

需要存檔的資料

必須由 Owner System

提供可序列化快照。

Save System

不應自行推測：

哪些欄位重要。

各 Owner System

應定義：

```text
Persistent Data
```

```text
Temporary Data
```

```text
Derived Data
```

---

## Persistent Data

必須保存，

否則會改變玩家人生。

例如：

```text
Player Data

Identity Data

Progression Data

Relationship Data

Coach Evaluation

Organization State

Narrative Memory
```

---

## Temporary Data

通常不需永久保存。

例如：

```text
尚未送出的 UI 選項

暫時載入狀態

單次動畫狀態
```

---

## Derived Data

可以由 Source of Truth

重新計算。

例如：

```text
UI 顯示用疲勞等級
```

```text
關係狀態文字
```

```text
教練評價摘要
```

Derived Data

不應成為：

第二份 Source of Truth。

---

# Error Contract

所有 System

錯誤結果

至少應包含：

```text
success

errorType

errorCode

message

sourceSystem

relatedObjectId

timestamp
```

Prototype v2

至少辨識：

```text
Invalid Input

Missing Data

Unauthorized Write

Duplicate Processing

Lifecycle Violation

Out of Range

Version Mismatch

Restore Failure
```

---

# Architecture Validation Checklist

實作前與 Review 時，

應逐項確認：

```text
□ 每份核心資料是否只有一個 Owner？
```

```text
□ Direct Writer 是否與 Owner 相同？
```

```text
□ 是否有 System 直接修改其他 System 的資料？
```

```text
□ UI 是否只負責輸入與呈現？
```

```text
□ Save 是否只負責保存與還原？
```

```text
□ Application Controller 是否只負責流程與傳遞？
```

```text
□ Coach 是否只使用合理可見資訊？
```

```text
□ Organization 是否獨立判斷制度回應？
```

```text
□ Narrative 是否只理解已完成的結果？
```

```text
□ Request 是否允許被 Owner 拒絕？
```

```text
□ Result 是否具有唯一識別碼？
```

```text
□ 是否避免重複套用結果？
```

```text
□ Read View 是否避免暴露完整內部資料？
```

```text
□ Save Snapshot 是否由各 Owner 提供？
```

---

# Prototype Implementation Rule

Codex

實作 Prototype v2 時，

必須遵守：

```text
System Owns Data

System Validates Input

System Writes Own Data

System Produces Result

Controller Routes Result

UI Presents View

Save Persists Snapshot
```

若為了方便

出現：

```text
script.js

直接修改所有資料
```

代表：

Implementation

已經破壞：

Data Contract。

---

# Part 4 Completion Check

完成 Part 4 後，

應能回答以下問題。

---

```text
Relationship Input

由誰真正套用？
```

答案：

```text
Relationship System。
```

---

```text
Coach Recommendation

是否等於球隊最終安排？
```

答案：

```text
不是。

Organization System

仍需依制度與需求判斷。
```

---

```text
Organization System

可以直接改變 Career State 嗎？
```

答案：

```text
不能。

只能提出 Career Transition Request。
```

---

```text
Narrative System

可以為了劇情效果改寫 Event Result 嗎？
```

答案：

```text
不能。

Narrative 只能理解已成立的結果。
```

---

```text
Save System

可以直接還原其他 System 的內部資料嗎？
```

答案：

```text
不能。

Save System 建立 Restore Package，

再由每個 Owner System

驗證並還原自己的資料。
```

---

```text
UI 可以在玩家按下加練後

直接執行 fatigue +8 嗎？
```

答案：

```text
不能。

UI 只能建立 Decision Input。
```

---

```text
Application Controller

負責 Gameplay Rule 嗎？
```

答案：

```text
不負責。

Application Controller

只負責流程、傳遞與呼叫。
```

---

# Final Data Contract

Prototype v2

完整資料合作原則為：

```text
玩家提供 Input

↓

System 驗證 Input

↓

System 建立 Result

↓

Controller 傳遞 Result

↓

Owner System 接收 Request

↓

Owner System 更新自己的 Data

↓

System 提供 Read View

↓

UI 呈現結果

↓

Save 保存 Snapshot
```

沒有任何 System

可以：

因為方便，

直接修改：

另一個 System

所擁有的資料。

---

# Final Statement

Data Contract

不是：

欄位清單。

它是：

所有 System

共同遵守的合作邊界。

它確保：

```text
Player

仍然只是 Player。
```

```text
Coach

仍然只是 Coach。
```

```text
Organization

仍然依制度運作。
```

```text
Narrative

仍然只理解人生。
```

```text
UI

仍然只呈現世界。
```

```text
Save

仍然只保存世界。
```

當每個 System

只修改：

自己擁有的資料，

《棒球人生》的世界

才能：

保持一致、

持續擴充、

長期演化。