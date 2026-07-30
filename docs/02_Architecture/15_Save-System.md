# 15 Save System

Subtitle:

Persistence System

Version:

2.0

---

# Purpose

Save System

負責管理：

所有需要跨越時間保存的資料。

它回答的核心問題是：

> 哪些資料需要永久保存，並在之後正確還原？

Save

不是：

資料的擁有者。

Save

只是：

資料的保存者。

它負責：

- 保存
- 還原
- 驗證
- 版本管理
- 相容性
- 存檔完整性

但不負責：

任何 Gameplay。

---

# Responsibilities

Save System

負責管理：

- Save Slot
- Serialization
- Deserialization
- Persistence
- Snapshot
- Save Metadata
- Version
- Migration
- Integrity Validation
- Autosave
- Manual Save
- Backup
- Restore

Save

保存：

各 System 的資料。

不是：

重新定義資料。

---

# Not Responsible

Save System

不負責：

- Player Data
- Identity
- Narrative
- Relationship
- Event Logic
- Career
- Match
- Progression
- Decision
- Current State
- World Simulation
- Organization
- Injury
- Coach
- UI

Save

不能：

決定：

任何遊戲內容。

---

# Core Concepts

Save

不是：

Database。

不是：

Gameplay。

也不是：

Game State。

Save

只是：

Persistence。

---

# Persistence

Persistence

代表：

資料跨越時間仍然存在。

例如：

今天：

```text
Power

72
```

明天：

仍然：

72。

Persistence

保存：

資料。

不是：

重新計算資料。

---

# Serialization

Serialization

代表：

把各 System 的資料，

轉換成：

可保存格式。

例如：

```text
Player

↓

Save Data
```

Serialization

不能：

修改資料內容。

只能：

改變表示方式。

---

# Deserialization

Deserialization

代表：

從存檔，

重新建立：

各 System。

例如：

```text
Save Data

↓

Player
```

Restore

應恢復：

相同狀態。

不是：

建立新角色。

---

# Snapshot

Snapshot

代表：

某一時間點：

完整遊戲狀態。

例如：

2028/04/12

下午

比賽前。

Snapshot

不是：

歷史。

它只是：

當下完整狀態。

---

# Save Identity

每個 Save

都是：

獨立存在。

至少包含：

```text
Save ID

Player ID

World ID

Created Time

Modified Time

Version

Play Time

Difficulty

Checksum
```

Save

不能依賴：

目前程式狀態。

必須：

自己完整描述：

如何還原。

---

# Save Scope

Save

應保存：

真正需要跨時間存在的資料。

例如：

```text
Player

Career

Relationship

World

Organization

Story Progress

History

Unique IDs

Random Seed
```

不是：

全部資料。

---

# Save Boundary

Save

保存：

State。

不是：

Logic。

例如：

保存：

```text
Player：

Power：

72
```

不是：

```text
Power 如何成長
```

成長規則：

屬於：

Progression。

---

# State vs Logic

所有 Save

都應遵守：

```text
State

可以保存

Logic

不能保存
```

例如：

```text
目前：

疲勞：

35
```

可以保存。

但是：

```text
疲勞公式
```

不能保存。

公式：

屬於：

System。

---

# Source of Truth

Save

不能成為：

Source of Truth。

真正 Source

仍是：

各 System。

例如：

Player

保存：

```text
Power
```

Save

只是：

複製。

不是：

真正擁有。

---

# Save Flow

整個流程：

```text
Player

Relationship

Career

Organization

Coach

World

↓

Serialization

↓

Save File

↓

Deserialization

↓

Restore

↓

Continue Playing
```

Save

永遠位於：

System 外部。

---

# Save Architecture

所有 System：

```text
Player

Identity

Relationship

Career

Narrative

World

Organization

Coach
```

共同：

提供：

Serializable Data。

Save：

負責：

組裝。

不是：

重新生成。

---

# Save Ownership

每個 System

都應：

自己決定：

哪些資料：

需要保存。

例如：

Player：

```text
ExportSaveData()
```

Coach：

```text
ExportSaveData()
```

Organization：

```text
ExportSaveData()
```

Save

只負責：

收集。

而不是：

理解內容。

---

# Save Granularity

Save

應保存：

必要資訊。

不是：

全部資訊。

例如：

保存：

```text
Relationship Value：

72
```

不要保存：

```text
UI：

目前停在哪個分頁
```

除非：

UI

本身就是 Gameplay。

---

# Save Independence

Save

必須：

與 Runtime 分離。

例如：

Runtime：

有 Cache。

Save：

不要保存 Cache。

Runtime：

有暫時計算。

Save：

不要保存。

任何：

可以重新推導：

都不應保存。

---

# Core Data

Save

至少包含：

```text
Save ID

Version

Created Time

Modified Time

Play Time

Player Data

World Data

Organization Data

Career Data

Relationship Data

Coach Data

Story Progress

History

Random Seed

Checksum
```

Save

保存的是：

各 System 的狀態。

不是：

System 本身。

# Save Lifecycle

Save

不是：

每次按下存檔鍵，

才開始工作。

真正的 Save

生命週期如下：

```text
Game Start

↓

Create Runtime State

↓

Gameplay Updates

↓

Autosave / Manual Save

↓

Serialization

↓

Persistence

↓

Load

↓

Deserialization

↓

Restore Runtime

↓

Continue Gameplay
```

Save

只負責：

保存、

還原。

Gameplay

持續由各 System 運作。

---

# Save Pipeline

一次完整存檔：

應遵循固定流程。

```text
Collect Save Data

↓

Validate

↓

Serialize

↓

Compress (Optional)

↓

Write File

↓

Verify

↓

Complete
```

任何步驟失敗，

都不應破壞：

原本存檔。

---

## Collect Save Data

Save

向所有 System：

要求：

可保存資料。

例如：

```text
Player

↓

ExportSaveData()

Relationship

↓

ExportSaveData()

Coach

↓

ExportSaveData()
```

Save

不理解：

內容。

只負責：

收集。

---

## Validation

正式寫入前，

應先驗證。

例如：

```text
Player ID

是否存在

Version

是否合法

Checksum

是否正確

Unique ID

是否重複
```

Validation

失敗：

停止存檔。

---

## Serialization

Serialization

將：

Runtime Object

轉成：

Persistence Format。

例如：

```text
Object

↓

JSON

Binary

Custom Format
```

Save

不限制：

格式。

但要求：

資料一致。

---

## Compression

Compression

不是必要。

如果：

Save 很大。

可壓縮。

例如：

```text
Raw Save

↓

Compressed Save
```

Compression

不能改變：

資料內容。

---

## Write File

正式寫入。

建議：

```text
Temp File

↓

Verification

↓

Replace Save
```

避免：

半寫入。

導致：

整個存檔毀損。

---

## Verification

完成後：

重新驗證。

例如：

```text
Checksum

File Size

Version

Required Fields
```

確認：

真正成功。

---

# Load Pipeline

讀檔：

流程如下：

```text
Read File

↓

Validate

↓

Deserialize

↓

Restore Systems

↓

Reconnect References

↓

Resume Gameplay
```

Load

不是：

直接：

JSON → Game。

中間仍需：

驗證。

---

## Read File

先讀：

Save File。

不是：

直接：

建立 Runtime。

---

## Validate Before Load

例如：

```text
Version

Checksum

Required Fields

File Integrity
```

任何：

重大錯誤。

停止讀取。

---

## Deserialize

將：

Persistence

轉回：

Runtime Object。

例如：

```text
JSON

↓

Player

Coach

Relationship
```

不是：

直接：

Assign。

而是：

Restore。

---

## Restore Systems

依序：

恢復：

```text
World

↓

Player

↓

Relationship

↓

Coach

↓

Organization

↓

Career

↓

Narrative
```

避免：

Reference 尚未存在。

---

## Reconnect References

例如：

Player：

```text
CoachID：

C021
```

Restore：

Coach。

再重新建立：

Reference。

不要：

直接保存：

Memory Pointer。

---

# Save Trigger

什麼時候：

應存檔？

---

## Manual Save

玩家：

主動。

例如：

```text
按下：

Save。
```

---

## Autosave

例如：

- 一天結束
- 比賽結束
- 劇情完成
- 升學完成
- 球季結束

Autosave

應避免：

每秒。

---

## Forced Save

例如：

重大不可逆事件。

例如：

```text
選秀完成

退休

世界更新
```

避免：

Rollback。

---

# Autosave Strategy

Autosave

應：

可預測。

不要：

隨機。

例如：

```text
每天晚上

每場比賽後

每章劇情後
```

玩家：

容易理解。

---

# Save Slot

每個 Save Slot

應：

互相獨立。

例如：

```text
Slot 1

Slot 2

Slot 3
```

Slot

不能：

共享：

Runtime。

---

## Save Metadata

每個 Slot

至少保存：

```text
Player Name

Career Year

Current Team

Current Level

Play Time

Save Time

Version

Difficulty
```

Metadata

用於：

UI。

不是：

Gameplay。

---

# Incremental Save

如果：

Save 很大。

可考慮：

Incremental Save。

例如：

```text
Base Save

+

Changed Data
```

優點：

速度快。

缺點：

版本管理：

更困難。

《棒球人生》

初期：

不建議。

Full Snapshot

即可。

---

# Runtime Cache

Runtime

可建立：

Cache。

例如：

```text
排行榜

能力排序

搜尋索引

AI Cache
```

全部：

不要存。

Load

重新生成。

---

# Deterministic Restore

同一 Save：

必須：

得到：

相同世界。

例如：

```text
Load

↓

Player：

72

World：

2034

Relationship：

65
```

不能：

每次：

結果不同。

---

# Random Seed

若世界：

具有：

Random。

應保存：

Seed。

例如：

```text
Seed：

918273
```

Restore

才能：

得到：

相同世界。

---

# Reference Integrity

所有：

Reference

應：

保存：

ID。

例如：

```text
Player ID

Coach ID

Organization ID

Event ID
```

不要保存：

Pointer。

Pointer

重新建立。

---

# Save Dependency

Restore：

順序：

十分重要。

例如：

```text
World

↓

Organizations

↓

NPC

↓

Player

↓

Relationship

↓

Coach

↓

Story

↓

UI
```

避免：

找不到：

Reference。

---

# Failure Recovery

如果：

Save 失敗。

應：

```text
保留舊 Save

↓

回報錯誤

↓

不中斷遊戲
```

不要：

覆蓋。

---

# Core Lifecycle Data

Save System

至少管理：

```text
Save Pipeline

Load Pipeline

Save Trigger

Autosave Rules

Manual Save

Save Slot

Metadata

Serialization

Deserialization

Reference Restore

Integrity Validation

Failure Recovery
```

Save

真正管理的是：

Persistence Lifecycle。

不是：

Gameplay Lifecycle。

# Data Flow

Save

位於：

整個 Architecture

最外層。

所有 Gameplay System

共同提供：

Persistence Data。

Save

負責：

保存、

還原。

資料流如下：

```text
Player

Identity

Relationship

Career

Decision

Current State

World

Organization

Coach

Injury

↓

Export Save Data

↓

Save System

↓

Serialization

↓

Persistence

↓

Load

↓

Deserialization

↓

Restore

↓

Gameplay Continues
```

Save

不改變：

任何 Gameplay。

---

# Save Data Flow

每個 System

應遵循：

相同流程。

```text
Internal State

↓

ExportSaveData()

↓

Save System

↓

File

↓

ImportSaveData()

↓

Internal State
```

Save

不理解：

內容。

只理解：

Interface。

---

# Save Interface

所有可保存 System

都應提供：

```text
ExportSaveData()

ImportSaveData()

ValidateSaveData()
```

Save

只呼叫：

Interface。

不要：

直接讀取：

System 內部。

---

## ExportSaveData

System

自行決定：

哪些資料：

需要保存。

例如：

Player：

```text
Power

Contact

Age

Money
```

不是：

全部 Runtime。

---

## ImportSaveData

Restore：

Runtime。

例如：

```text
Power：

72

↓

Player.Power =72
```

Import

應：

建立：

完整 Runtime。

不是：

只 Assign。

---

## ValidateSaveData

System

自行確認：

Save 是否合法。

例如：

```text
Age：

不能負數

Power：

0~100

Coach ID：

存在
```

Validation

應：

System 自己負責。

---

# Save Relationship

Save

與所有 System：

都是：

One-way Dependency。

```text
Player

↓

Save
```

不是：

```text
Save

↓

Player Logic
```

Save

依賴：

System。

System

不能依賴：

Save。

---

# Runtime vs Persistence

Runtime：

保存：

目前運作狀態。

Persistence：

保存：

跨時間資料。

例如：

Runtime：

```text
Current UI

Current Cache

Animation

Input Buffer
```

全部：

不要保存。

---

# Persistent Data

真正：

Persistence：

例如：

```text
Player

Coach

Relationship

Story Progress

Career

World Time

History

Random Seed
```

全部：

需要。

---

# Transient Data

Transient

代表：

可重新建立。

例如：

```text
排行榜

排序

搜尋快取

AI Cache

Tooltip

Debug Data

FPS

目前滑鼠位置

畫面縮放
```

全部：

不要保存。

---

# Reference Flow

所有 Reference：

應：

透過 ID。

例如：

```text
Player

Coach ID：

C-021
```

Load：

```text
Coach Table

↓

Find：

C-021

↓

Reconnect
```

不要：

直接保存：

Object。

---

# Dependency Graph

Restore：

依照：

Dependency。

例如：

```text
World

↓

Organizations

↓

NPC

↓

Coach

↓

Player

↓

Relationship

↓

Career

↓

Narrative

↓

UI
```

先建立：

存在。

再建立：

Reference。

---

# Relationship with Other Systems

---

## Player System

Player

擁有：

Player Data。

Save

保存：

Player Data。

Player

決定：

哪些資料：

需要保存。

---

## Identity System

Identity

保存：

角色核心身份。

Save

保存：

Identity。

不理解：

Identity。

---

## Narrative System

Narrative

保存：

故事進度。

Save

保存：

目前 Narrative State。

不是：

劇情規則。

---

## Relationship System

Relationship

保存：

關係。

Save

保存：

Relationship State。

不是：

Relationship Logic。

---

## Event System

Event

保存：

事件歷史。

Save

保存：

History。

不是：

事件觸發規則。

---

## Career System

Career

保存：

正式職涯。

Save

保存：

Career。

不是：

Career Algorithm。

---

## Match System

Match

如果：

目前沒有進行中比賽。

不需要：

保存 Match Runtime。

如果：

允許中途存檔。

則：

保存：

Match State。

不是：

整個 Match Engine。

---

## Progression System

Progression

保存：

長期成長。

Save

保存：

Progression State。

不是：

成長公式。

---

## Decision System

Decision

保存：

重要決策歷史。

Save

保存：

Decision History。

不是：

Decision Rules。

---

## Current State System

Current State

保存：

目前：

疲勞、

士氣、

恢復。

Save

保存：

Current State。

不是：

更新規則。

---

## World Simulation System

World

保存：

日期、

制度、

世界狀態。

Save

保存：

World State。

不是：

Simulation。

---

## Organization System

Organization

保存：

球隊狀態。

Save

保存：

Organization State。

不是：

行政 AI。

---

## Injury System

Injury

保存：

目前傷病、

復健、

歷史。

Save

保存：

Injury State。

不是：

Medical Logic。

---

## Coach System

Coach

保存：

Memory、

Trust、

Evaluation、

Projection。

Save

保存：

Coach State。

不是：

Coach AI。

---

## UI System

UI

只能：

顯示：

Metadata。

不要：

保存 Gameplay。

除非：

UI 本身：

就是玩法。

---

# Architecture Rules

Save

必須遵守：

---

## Rule 01

Save

不是：

Source of Truth。

---

## Rule 02

System

擁有：

資料。

Save

擁有：

Persistence。

---

## Rule 03

State

可以保存。

Logic

不能保存。

---

## Rule 04

Runtime

不要直接保存。

應：

Export。

---

## Rule 05

Import

應：

Restore。

不是：

Assign。

---

## Rule 06

所有 Reference：

使用：

Unique ID。

不要：

Pointer。

---

## Rule 07

Save

不應：

知道：

Gameplay。

---

## Rule 08

Save

不應：

修改：

任何 System。

---

## Rule 09

所有 Validation：

由：

各 System。

不是：

Save。

---

## Rule 10

Save

可以失敗。

不能：

破壞：

Runtime。

---

## Rule 11

Autosave

不能：

造成 Gameplay Lag。

---

## Rule 12

Metadata

只提供：

UI。

不是：

Gameplay。

---

## Rule 13

所有：

Transient Data：

不要保存。

---

## Rule 14

Restore：

必須：

Deterministic。

同一 Save：

得到：

同一世界。

---

## Rule 15

Random：

若影響世界。

保存：

Seed。

---

## Rule 16

任何：

Behavior：

不要保存。

只保存：

State。

---

## Rule 17

Save

應：

Version Aware。

不同版本：

可判斷。

不可：

假設：

全部相同。

---

## Rule 18

Migration

屬於：

Save。

不是：

Gameplay。

---

## Rule 19

System

新增欄位。

不應：

直接破壞：

舊 Save。

---

## Rule 20

Save

永遠：

位於：

Architecture

最外層。

所有 Gameplay

皆可替換。

Save

仍成立。

# Extension Guidelines

新增 Save 功能前，

必須先確認：

新增的是：

需要跨時間保存的資料，

還是：

可以重新建立的 Runtime 結果。

Save System

只管理：

- Persistence
- Restore
- Version
- Migration
- Integrity
- Recovery

不管理：

任何 Gameplay 意義。

---

## Question 01

新增資料：

是否真的需要保存？

例如：

```text
Player Power：

72
```

需要保存。

但是：

```text
能力排行榜：

第12名
```

如果可重新計算，

就不需要保存。

---

## Question 02

新增的是：

State，

還是：

Logic？

例如：

```text
Fatigue：

35
```

是 State。

可以保存。

```text
Fatigue Recovery Formula
```

是 Logic。

不能保存。

---

## Question 03

新增的是：

Identity，

還是：

Runtime Reference？

例如：

```text
Coach ID：

C-021
```

可以保存。

```text
Coach Object Pointer
```

不能保存。

Load 時：

應透過 ID

重新建立 Reference。

---

## Question 04

新增的是：

History，

還是：

Derived Summary？

例如：

```text
曾完成事件：

E-014
```

是 History。

可以保存。

```text
玩家目前是勇敢的人
```

如果是由多個事件推導，

應由 Narrative 或 Identity

重新判斷。

---

## Question 05

新增的是：

正式狀態，

還是：

Cache？

例如：

```text
Career Team：

T-003
```

需要保存。

```text
球隊搜尋索引
```

是 Cache。

不需要保存。

---

## Question 06

新增的是：

Gameplay State，

還是：

UI Preference？

例如：

```text
目前比賽進行至第七局
```

若允許中途存檔，

需要保存。

```text
目前開啟球員能力分頁
```

通常不需要保存。

除非：

UI 狀態本身會影響玩法。

---

## Question 07

新增的是：

目前狀態，

還是：

過程中的暫時變數？

例如：

```text
Rehabilitation Stage：

Phase 3
```

需要保存。

```text
本幀計算中的恢復倍率
```

不需要保存。

---

## Question 08

新增欄位：

是否能由其他欄位重新推導？

例如：

```text
Age
```

若由：

Birth Date

與 World Date

可確定推導，

應避免重複保存。

除非：

設計上 Age 本身就是獨立狀態。

---

## Question 09

新增資料：

誰是 Source of Truth？

例如：

Coach Trust

由：

Coach System

擁有。

Save

只保存。

不能在：

Save Schema

重新定義另一套 Trust。

---

## Question 10

新增欄位：

舊存檔不存在時，

應該怎麼處理？

每一個新欄位，

都必須有：

- Default Value
- Migration Rule
- Validation Rule
- Fallback Strategy

不能假設：

所有 Save

都已包含新欄位。

---

# Save Schema

Save Schema

描述：

存檔資料的結構。

例如：

```text
Save Root

├── Metadata
├── Player
├── Identity
├── Narrative
├── Relationship
├── Career
├── Current State
├── World
├── Organization
├── Injury
├── Coach
├── History
├── Random
└── Integrity
```

Schema

只定義：

資料如何保存。

不定義：

資料如何運作。

---

# Save Root

Save Root

至少包含：

```text
Save ID

Schema Version

Game Version

Created Time

Modified Time

Play Time

Current World Time

Primary Player ID

System Data

Random State

Integrity Data
```

Save Root

應保持：

穩定。

各 Gameplay System

保存於：

自己的區塊。

---

# System Namespace

每個 System

應擁有：

自己的 Save Namespace。

例如：

```text
player

identity

narrative

relationship

career

world

organization

injury

coach
```

不要：

把所有欄位放在：

同一層。

錯誤：

```text
power

team

coachTrust

injuryStage

worldYear
```

正確：

```text
player.power

career.teamId

coach.trust

injury.stage

world.year
```

Namespace

可以減少：

欄位衝突、

責任混亂、

Migration 困難。

---

# Schema Version

每個 Save

必須保存：

Schema Version。

例如：

```text
Schema Version：

2.3.0
```

Schema Version

不是：

Game Version。

---

## Game Version

代表：

玩家建立存檔時，

使用的遊戲版本。

例如：

```text
Game Version：

0.8.4
```

---

## Schema Version

代表：

Save Data Structure。

例如：

```text
Schema Version：

2.3.0
```

遊戲版本可能更新，

但 Save Schema

不一定改變。

兩者不能混用。

---

# Version Strategy

Version

應明確區分：

```text
Major

Minor

Patch
```

---

## Major Version

代表：

結構性破壞。

例如：

```text
Relationship

從單一數值

改成多維模型
```

需要：

完整 Migration。

---

## Minor Version

代表：

新增相容欄位。

例如：

```text
新增：

Coach Learning Ability
```

舊 Save

可使用：

Default Value。

---

## Patch Version

代表：

格式修正。

例如：

```text
修正欄位名稱

修正非法值
```

不改變：

主要資料結構。

---

# Migration

Migration

負責：

將舊 Save

轉換成：

目前 Schema。

流程：

```text
Old Save

↓

Detect Version

↓

Apply Migration Steps

↓

Validate

↓

Create Current Save

↓

Load
```

Migration

不能：

直接假設：

舊資料符合新規則。

---

## Sequential Migration

建議：

依序 Migration。

例如：

```text
v1.0

↓

v1.1

↓

v1.2

↓

v2.0
```

不要：

每個舊版本

都直接跳到最新版本。

Sequential Migration

較容易：

測試、

追蹤、

除錯。

---

## Migration Rule

每個 Migration

至少應定義：

```text
Source Version

Target Version

Changed Fields

Default Values

Transformation Rules

Validation

Failure Handling
```

---

## Add Field Migration

例如：

新增：

```text
coach.learningAbility
```

舊 Save：

不存在。

Migration：

```text
learningAbility：

Default
```

Default

應來自：

Coach System。

不是：

Save 隨意決定。

---

## Rename Field Migration

例如：

```text
player.strength

↓

player.power
```

Migration

負責：

轉換名稱。

不是：

同時保留兩份。

---

## Split Field Migration

例如：

舊版：

```text
relationship：

70
```

新版：

```text
affection：

40

trust：

60

respect：

75
```

Migration

必須：

明確定義：

如何拆分。

不能：

假裝舊資料原本就有完整資訊。

如果無法準確還原，

應使用：

合理預設，

並留下：

Migration Flag。

---

## Merge Field Migration

例如：

舊版：

```text
physicalFatigue

mentalFatigue
```

新版：

```text
fatigue
```

Migration

應定義：

加權方式。

不能：

隨意取其中一個。

---

## Semantic Migration

最困難的是：

資料意義改變。

例如：

舊版 Trust：

代表：

感情。

新版 Trust：

代表：

專業信任。

這不是：

欄位改名。

而是：

Semantic Change。

此時：

不能直接搬移。

應：

- 重新分配
- 設定 Legacy Flag
- 使用保守 Default
- 或明確宣告不完全相容

---

# Backward Compatibility

Backward Compatibility

代表：

新版本可以讀取：

舊 Save。

這是：

Save System

主要責任。

---

# Forward Compatibility

Forward Compatibility

代表：

舊版本讀取：

新 Save。

通常：

不保證。

舊版本

不理解：

新欄位、

新邏輯、

新 Schema。

因此：

新 Save

不應被舊版本：

強制讀取。

---

# Unknown Fields

新版本讀取 Save 時，

可能遇到：

未知欄位。

策略可以是：

```text
Ignore

Preserve

Reject
```

---

## Ignore

適合：

可安全忽略的附加資料。

---

## Preserve

適合：

需要重新寫回，

但目前版本不理解的資料。

較複雜。

初期不建議。

---

## Reject

適合：

未知欄位可能造成：

狀態錯誤。

《棒球人生》

建議：

已知 Schema 內：

嚴格驗證。

額外 Metadata：

可以忽略。

---

# Integrity

Integrity

代表：

Save 是否完整、

一致、

可信。

---

## Structural Integrity

檢查：

```text
Required Fields

Correct Types

Valid Namespaces

Supported Version
```

---

## Referential Integrity

檢查：

所有 ID Reference

是否存在。

例如：

```text
Player Coach ID：

C-021
```

但：

Coach C-021

不存在。

這是：

Broken Reference。

---

## Domain Integrity

各 System

檢查：

自己的資料是否合法。

例如：

Player：

```text
Power：

0~100
```

World：

```text
Month：

1~12
```

Injury：

```text
Rehabilitation Stage

必須與 Injury Status 相容
```

---

## Chronological Integrity

檢查：

時間順序。

例如：

```text
Retirement Date

早於 Birth Date
```

非法。

或：

```text
Injury Recovery Date

早於 Injury Date
```

非法。

---

## Historical Integrity

檢查：

正式歷史是否自洽。

例如：

玩家尚未加入球隊，

卻已存在：

該隊冠軍紀錄。

---

## Checksum

Checksum

可用於：

判斷檔案是否：

損壞、

未完整寫入、

遭到意外修改。

Checksum

不是：

Gameplay 防作弊系統。

兩者應分離。

---

# Save Safety

Save Safety

必須遵守：

```text
Never Destroy the Last Valid Save
```

永遠不要：

先刪除舊 Save，

再寫新 Save。

---

## Atomic Write

推薦流程：

```text
Create Temporary Save

↓

Write Complete Data

↓

Validate Temporary Save

↓

Rename Existing Save to Backup

↓

Promote Temporary Save

↓

Verify

↓

Remove Old Backup Later
```

任何步驟失敗，

都可以：

回復。

---

## Backup Strategy

至少保留：

```text
Current Save

Previous Valid Save
```

Autosave

可考慮：

輪替：

```text
Autosave A

Autosave B

Autosave C
```

避免：

連續錯誤覆蓋。

---

## Corruption Recovery

發現毀損：

流程應為：

```text
Reject Corrupt Save

↓

Try Backup

↓

Validate Backup

↓

Restore

↓

Inform Player
```

不能：

默默載入：

不完整資料。

---

# Partial Recovery

某些情況：

只有部分 System 資料損壞。

例如：

UI Metadata 損壞。

可以：

重新建立。

但如果：

Player、

Career、

World

核心資料損壞，

不應：

自行猜測。

Partial Recovery

只能用於：

可安全重建的資料。

---

# Autosave Protection

Autosave

最容易造成：

不可逆錯誤。

例如：

玩家載入舊 Save 後，

立刻被 Autosave 覆蓋。

因此：

Load 後

應有：

短暫保護期，

或：

第一次狀態穩定後再 Autosave。

---

# Save During Transition

不要在：

System 尚未完成更新時存檔。

例如：

```text
比賽結果已計算

但 Career 尚未更新
```

此時 Save：

會產生：

不一致狀態。

應建立：

Stable Save Point。

---

# Stable Save Point

Stable Save Point

代表：

所有相關 System

都已完成：

同一個 Gameplay Transaction。

例如：

比賽結束後：

```text
Match Completed

↓

Player Updated

↓

Current State Updated

↓

Injury Updated

↓

Career Updated

↓

Event Recorded

↓

World Time Advanced

↓

Stable Save Point
```

只有在：

Stable Save Point

才正式 Autosave。

---

# Transaction Boundary

重大流程

應視為：

一個 Transaction。

例如：

選秀：

```text
Draft Result

Organization Assignment

Career Entry

Relationship Initialization

Narrative Update
```

全部成功後：

才能 Save。

中間失敗：

應回復至：

原本狀態。

---

# Save Testing

Save System

不能只測試：

能不能存。

必須測試：

能不能正確還原。

---

## Round-Trip Test

流程：

```text
Runtime State

↓

Save

↓

Load

↓

Compare Restored State
```

Restore 後：

核心資料應一致。

---

## Version Migration Test

每一個舊版本：

都應測試：

```text
Old Save

↓

Migration

↓

Current Version

↓

Validation

↓

Gameplay Continue
```

---

## Corruption Test

測試：

- 缺欄位
- 錯誤型別
- 重複 ID
- Broken Reference
- Invalid Version
- Interrupted Write
- Wrong Checksum

---

## Determinism Test

同一 Save

多次 Load：

應建立：

相同狀態。

---

## Long-Term Test

測試：

多年遊戲後：

- Save Size
- Load Time
- Migration Time
- History Growth
- ID Stability

避免：

遊戲後期存檔失控。

---

# Save Size Management

History

可能持續增長。

不能：

無限制保存：

所有細節。

應區分：

```text
Permanent History

Summary History

Discardable Detail
```

---

## Permanent History

例如：

- 選秀
- 轉隊
- 冠軍
- 重大傷病
- 退休
- 關鍵決策
- 重要關係轉折

永久保存。

---

## Summary History

例如：

單場比賽完整逐球內容。

可轉成：

- 比賽結果
- 關鍵表現
- 生涯統計
- 重大事件

---

## Discardable Detail

例如：

一般訓練中的：

每次暫時計算。

不需要永久保存。

---

# Common Mistakes

---

## Mistake 01

直接保存：

整個 Runtime Object。

錯。

Runtime

包含：

Cache、

Pointer、

Function、

Transient State。

---

## Mistake 02

Save

成為：

Source of Truth。

錯。

Source of Truth

永遠是：

各 System。

---

## Mistake 03

保存：

Logic。

錯。

Save

只保存：

State。

---

## Mistake 04

保存：

可以重新計算的資料。

錯。

會造成：

Duplicate Data。

---

## Mistake 05

用物件 Pointer：

保存 Reference。

錯。

應保存：

Unique ID。

---

## Mistake 06

Load 時：

直接 Assign。

錯。

應完整：

Restore Runtime。

---

## Mistake 07

不做：

Validation。

錯。

讀取成功

不代表：

資料正確。

---

## Mistake 08

先覆蓋舊 Save，

再驗證新 Save。

錯。

可能失去：

最後有效存檔。

---

## Mistake 09

只有一個 Autosave。

錯。

錯誤狀態可能：

永久覆蓋。

---

## Mistake 10

任何時候都可以存檔。

錯。

必須在：

Stable Save Point。

---

## Mistake 11

所有資料放在：

同一個 Root。

錯。

應使用：

System Namespace。

---

## Mistake 12

Game Version

等於：

Schema Version。

錯。

兩者：

獨立。

---

## Mistake 13

新增欄位：

沒有 Default。

錯。

舊 Save

無法載入。

---

## Mistake 14

Migration

只處理：

欄位名稱。

錯。

還必須處理：

資料語意。

---

## Mistake 15

舊資料不足時：

假裝能完整還原。

錯。

應明確使用：

Default、

Legacy Flag、

或不完全相容。

---

## Mistake 16

Save System

理解：

Gameplay 語意。

錯。

Save

只管理：

資料保存流程。

---

## Mistake 17

所有 History

永久完整保存。

錯。

Save Size

會持續膨脹。

---

## Mistake 18

忽略：

Reference Restore Order。

錯。

會產生：

Broken Reference。

---

## Mistake 19

只測試：

Save 成功。

錯。

真正重要的是：

Load 後狀態正確。

---

## Mistake 20

存檔失敗：

仍顯示成功。

錯。

玩家必須知道：

是否真正完成。

---

# Design Philosophy

Save System

不是：

一個把資料寫進檔案的工具。

它真正保護的是：

玩家已經投入的人生。

在《棒球人生》中，

一個 Save

可能包含：

- 多年成長
- 無法回頭的選擇
- 已失去的機會
- 長期建立的關係
- 傷病與復健
- 教練的信任
- 球隊的變化
- 整個棒球世界的歷史

因此：

Save Failure

不是：

單純技術錯誤。

它可能代表：

玩家數十小時累積的世界消失。

---

Save System

必須優先保護：

```text
Correctness

Integrity

Recoverability

Compatibility
```

而不是：

只追求：

寫入速度。

---

Save

不能創造：

任何人生。

它只能確保：

已經發生的人生，

不會因為：

關閉遊戲、

版本更新、

程式錯誤

而消失。

---

真正成熟的 Save System

應做到：

```text
玩家不需要注意它。

但當錯誤發生時，

它能保護玩家。
```

---

Save

不決定：

玩家是誰。

不決定：

世界發生什麼。

不決定：

教練如何評價。

不決定：

球團做出什麼選擇。

它只負責：

讓這些狀態，

能夠跨越：

現實時間。

---

# Summary

Save System

回答：

> 哪些資料需要跨越遊戲關閉、版本更新與讀取流程，仍然被正確保存與還原？

它管理：

- Save Slot
- Serialization
- Deserialization
- Snapshot
- Metadata
- Version
- Migration
- Validation
- Integrity
- Backup
- Restore
- Failure Recovery
- Stable Save Point

它不管理：

- Gameplay Logic
- Player Meaning
- Narrative Meaning
- Career Rules
- Coach AI
- Organization Decision
- Injury Logic
- World Simulation
- UI Behavior

---

Save System

核心流程：

```text
System State

↓

Export

↓

Validate

↓

Serialize

↓

Atomic Write

↓

Verify

↓

Persist

↓

Load

↓

Migrate

↓

Deserialize

↓

Restore

↓

Reconnect References

↓

Validate Runtime
```

---

Save 必須維持：

```text
State

≠

Logic
```

```text
Runtime

≠

Persistence
```

```text
Game Version

≠

Schema Version
```

```text
Identity

≠

Pointer
```

```text
Snapshot

≠

History
```

```text
Save Data

≠

Source of Truth
```

---

Save

不創造任何資料。

它只負責：

讓資料跨越時間。

各 System

擁有：

自己的狀態與意義。

Save System

擁有：

保存、

還原、

相容、

保護

這些狀態的責任。

透過這個系統，

《棒球人生》的每一段生涯、

每一個選擇、

每一次傷病、

每一段關係、

每一個世界變化，

都能在玩家再次打開遊戲時，

繼續存在。