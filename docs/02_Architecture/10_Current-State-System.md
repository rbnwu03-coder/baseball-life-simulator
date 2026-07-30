# 10 Current State System

Version: 2.0

Subtitle: Condition System

---

# Purpose

Current State System 負責管理角色目前的即時狀態（Current State）。

它描述：

角色今天的身體、
心理、
節奏、
環境，

如何共同影響：

角色今天真正能展現多少能力。

Current State

並不是：

角色真正的能力。

它回答的是：

> 今天的我，是什麼狀態？

而不是：

> 我真正有多強？

---

# Responsibilities

Current State System 負責管理：

- Physical State（身體狀態）
- Mental State（心理狀態）
- Rhythm（競技節奏）
- Environmental State（環境狀態）
- Current Readiness（目前可發揮程度）

Current State 不負責：

- 永久能力
- 能力成長
- 人格
- 人際關係
- 劇情
- 傷病治療
- 世界規則

---

# Not Responsible

## Player

Player 保存：

角色真正擁有的能力。

Current State 保存：

今天可以發揮多少。

例如：

Power：

75

今天疲勞：

Current State：

90%

真正比賽能力：

約67

能力沒有下降。

只是：

今天沒有完全發揮。

---

## Progression

Progression 管理：

能力如何提升。

Current State 管理：

今天能力如何表現。

Progression：

長期。

Current State：

短期。

---

## Decision

Decision 管理：

角色如何做出選擇。

Current State

可能影響：

Decision。

例如：

疲勞時：

角色放棄加練。

焦慮時：

角色拒絕採訪。

真正 Decision，

仍由：

Decision System

負責。

---

## Match

Match 管理：

競技過程。

Current State

提供：

目前狀態。

例如：

今天：

- 疲勞
- 手感火熱
- 壓力很高

Match

依據：

Current State

計算：

Performance。

---

## Injury

Injury 管理：

傷病本身。

Current State

管理：

傷病今天造成多少影響。

例如：

相同傷勢。

今天：

剛受傷。

影響：

80%

三週後：

恢復中。

影響：

40%

傷勢沒變。

Current State

改變。

---

# Core Concepts

Current State

不是：

能力。

不是：

性格。

不是：

人生。

它代表：

角色此刻，

真正的狀態。

Current State

每天、

每場比賽、

甚至每個重要事件，

都有可能改變。

---

# Current State Layer

Current State 由四個主要層級組成。

```text
Physical

↓

Mental

↓

Rhythm

↓

Environment

↓

Current State
```

Current State

由四者共同形成。

不是：

任何單一數值。

---

## Physical State

Physical State

代表：

目前身體狀況。

例如：

- 疲勞
- 睡眠
- 體能
- 肌肉恢復
- 疼痛
- 脫水

Physical

回答：

> 今天身體如何？

---

## Mental State

Mental State

代表：

目前心理狀態。

例如：

- 信心
- 焦慮
- 壓力
- 專注
- 情緒
- 動機

Mental

回答：

> 今天心理如何？

---

## Rhythm

Rhythm

代表：

近期競技節奏。

例如：

- 連續安打
- 長期低潮
- 出賽頻率
- 比賽手感
- 配球節奏
- 揮棒節奏

Rhythm

不是：

能力。

它是一種：

短期競技趨勢。

---

## Environmental State

Environment

代表：

今天外在環境。

例如：

- 天氣
- 客場
- 主場
- 海拔
- 溫度
- 球迷
- 噪音
- 場地品質

Environment

不是：

角色的一部分。

但會影響：

Current State。
# Current State Lifecycle

Current State

並不是：

每天重新計算一次。

它是一個：

持續變化的系統。

生命週期如下：

```text
Baseline

↓

State Change

↓

State Interaction

↓

Current State

↓

Decision / Match

↓

Recovery

↓

New Baseline
```

Current State

永遠都在變化。

它不是：

固定數值。

---

# Baseline

Baseline

代表：

角色正常情況下的平均狀態。

例如：

一名睡眠規律、

心理健康、

沒有疲勞的球員。

Baseline：

就是：

平常的自己。

Current State

所有變化，

都建立在：

Baseline。

---

# State Change

State Change

代表：

造成狀態改變的來源。

例如：

- 睡眠不足
- 長途移動
- 高強度訓練
- 比賽
- 傷病
- 人際事件
- 家庭事件
- 天氣

任何 Event，

都可能造成：

State Change。

---

# State Interaction

Current State

不是：

四個獨立系統。

它們彼此影響。

例如：

Physical↓

可能造成：

Mental↓

Mental↓

可能造成：

Rhythm↓

Rhythm↓

又可能提升：

Confidence↓

形成：

新的 Mental。

Current State

是一個：

持續互動的循環。

---

# Recovery

Recovery

代表：

角色如何恢復目前狀態。

恢復方式例如：

- 睡眠
- 休息
- 飲食
- 復健
- 放假
- 心理支持
- 成功經驗

Recovery

不是：

Progression。

它不提升能力。

只是：

恢復正常狀態。

---

# Current Readiness

Current Readiness

代表：

今天真正能發揮多少能力。

例如：

Power：

80

Readiness：

90%

今天真正可發揮：

約72

Readiness

是一種：

綜合結果。

不是：

單一屬性。

---

# Physical State

Physical State

主要描述：

身體狀態。

可能包含：

- Fatigue
- Energy
- Sleep
- Recovery
- Hydration
- Muscle Soreness
- Pain

Physical

通常恢復速度：

最快。

---

# Mental State

Mental State

主要描述：

心理狀態。

可能包含：

- Confidence
- Focus
- Anxiety
- Motivation
- Stress
- Emotion

Mental

通常恢復速度：

中等。

但波動較大。

---

# Rhythm

Rhythm

描述：

近期競技節奏。

例如：

- 手感火熱
- 長期低潮
- 配球默契
- 揮棒節奏
- 出賽連續性

Rhythm

容易受到：

Match

影響。

但也可能：

反過來影響：

Decision。

---

# Environmental State

Environment

代表：

今天外部條件。

例如：

- 天氣
- 主客場
- 球場品質
- 海拔
- 球迷數量
- 噪音
- 溫度

Environment

通常：

短時間變化最大。

但恢復最快。
# Data Flow

Current State 與其他 System 的資料流如下：

```text
Progression
        │
Player
        │
Injury
        │
World
        │
Relationship
        │
Event
        │
        ▼
State Trigger
        │
        ▼
Current State Update
        │
        ▼
Current Readiness
        │
        ├── Decision
        ├── Match
        └── UI
```

Current State

並不直接改變：

能力、

人格、

人生。

它只改變：

角色今天的狀態。

---

# Current State Update Flow

更新流程如下：

```text
State Trigger

↓

Identify Changed Factors

↓

Update Individual States

↓

State Interaction

↓

Calculate Current Readiness

↓

Notify Dependent Systems
```

Current State

並不是：

重新建立。

而是不斷更新。

---

# State Trigger

State Trigger

代表：

哪些事情，

會更新 Current State。

例如：

---

## Daily Trigger

每天開始。

例如：

- 睡眠
- 早餐
- 新的一天

---

## Match Trigger

比賽開始。

例如：

- 緊張
- 客場
- 天氣
- 球迷

---

## Event Trigger

事件發生。

例如：

- 家庭衝突
- 被教練稱讚
- 被媒體批評
- 升上一軍

---

## Injury Trigger

傷病變化。

例如：

- 受傷
- 復健
- 疼痛降低

---

## Recovery Trigger

恢復完成。

例如：

- 睡覺
- 放假
- 心理諮商
- 按摩
- 冰敷

---

# Architecture Rules

Current State 必須遵守以下規則。

---

## Rule 01

Current State 必須是暫時性的。

它不能：

永久改變能力。

真正能力，

由：

Progression

保存。

---

## Rule 02

Current State 必須可以恢復。

任何負面狀態，

都應存在：

恢復方式。

除非：

特殊劇情。

---

## Rule 03

Current State 必須具有波動。

角色今天，

不可能：

每天都一模一樣。

波動，

是真實人生的一部分。

---

## Rule 04

不同狀態，

應互相影響。

例如：

疲勞，

可能造成：

專注下降。

信心提升，

可能改善：

節奏。

Current State

是一個：

互動系統。

---

## Rule 05

Current State

不應成為：

永久 Buff。

它應隨時間、

事件、

Recovery，

持續變化。

---

## Rule 06

Current State

不得直接修改 Ability。

例如：

Confidence

不應讓：

Power

永久增加。

它只影響：

今天的表現。

---

# State Priority

不同來源，

可能同時影響 Current State。

系統需要：

Priority。

建議如下：

```text
Injury

↓

Physical

↓

Mental

↓

Rhythm

↓

Environment
```

例如：

即使：

Rhythm

很好。

重大 Injury

仍優先影響：

Current Readiness。

---

# Readiness Output

Current State

最後只輸出：

Current Readiness。

例如：

```text
Physical

88

Mental

76

Rhythm

95

Environment

82

↓

Current Readiness

84
```

Readiness

不是：

平均值。

而是：

Current State

經互動後，

得到的整體結果。
## Relationship System

Relationship 保存：

長期的人際關係。

Current State

可能受到：

Relationship

影響。

例如：

- 與隊友發生衝突
- 家人支持
- 教練信任

可能改變：

Mental State。

真正的人際關係，

仍由：

Relationship System

管理。

---

## Narrative System

Narrative 保存：

角色如何理解自己的經歷。

Current State

保存：

角色此刻的狀態。

例如：

輸掉冠軍戰。

Current State：

當下失落。

Narrative：

多年後，

如何理解這場失敗。

兩者，

時間尺度不同。

---

## Event System

Event

觸發：

State Trigger。

例如：

- 熬夜
- 家庭事件
- 長途旅行
- 球迷噓聲

Current State

負責：

更新今日狀態。

---

## Match System

Match

使用：

Current Readiness。

Current State

不決定：

比賽結果。

它只提供：

目前狀態。

真正 Performance，

仍由：

Match

計算。

---

## Progression System

Progression

保存：

永久能力。

Current State

保存：

今日狀態。

即使：

Current State

下降。

Progression

也不會改變。

---

## Injury System

Injury

提供：

傷病資訊。

Current State

決定：

今天傷病造成多少影響。

例如：

同樣的肩傷，

今天可能：

疼痛加劇。

明天：

恢復較佳。

---

## Decision System

Decision

會受到：

Current State

影響。

例如：

Mental↓

可能放棄挑戰。

Physical↓

可能取消加練。

Current State

提供：

今日狀態。

Decision

負責：

真正的選擇。

---

## Save System

Save System

保存：

Current State。

例如：

- Fatigue
- Confidence
- Rhythm
- Readiness

Current State

不負責：

存檔流程。

---

## UI System

UI

負責呈現：

- 今日狀態
- 疲勞
- 信心
- 手感
- 狀態變化

Current State

不負責：

介面呈現方式。

---

# Extension Guidelines

新增 Current State 功能前，

請先回答以下問題。

---

## Question 01

新增的是：

永久能力，

還是：

今日狀態？

若是永久改變，

請交給：

Progression。

---

## Question 02

是否具有：

恢復方式？

若永遠無法恢復，

請重新評估：

是否應交給：

Injury、

Identity、

或 Narrative。

---

## Question 03

是否真的只影響：

短期？

若會永久影響角色，

通常不是：

Current State。

---

## Question 04

是否會影響：

Decision、

Match、

或兩者皆是？

若完全沒有影響，

請重新評估：

是否需要新增。

---

## Question 05

是否需要：

State Trigger？

若沒有任何事件能改變它，

通常不是：

Current State。

---

# Common Mistakes

以下是 Current State 最常見的設計錯誤。

---

## Mistake 01

Current State 等於 Ability。

錯誤。

Ability：

是長期能力。

Current State：

是今天狀態。

---

## Mistake 02

所有狀態都是永久。

錯誤。

Current State

應能：

恢復、

波動、

改變。

---

## Mistake 03

所有狀態彼此獨立。

錯誤。

Physical、

Mental、

Rhythm、

Environment，

應彼此互動。

---

## Mistake 04

Current State 直接修改能力。

錯誤。

它只影響：

今日可發揮程度。

真正能力，

由：

Progression

保存。

---

## Mistake 05

Current State 只影響比賽。

錯誤。

它同時影響：

Decision、

Match、

甚至 UI 呈現。

---

# Design Philosophy

Current State

不是：

角色的人生。

也不是：

角色真正的能力。

它更像是：

人生每天不同的天氣。

有時陽光明媚，

有時烏雲密布。

真正重要的，

不是每天都維持最佳狀態。

而是：

角色如何在不同狀態下，

仍然做出選擇、

面對挑戰、

持續前進。

Progression

塑造：

角色長期成長。

Current State

呈現：

角色今天真正的模樣。

兩者共同組成：

一位真實的人。

---

# Summary

Current State System 回答的核心問題只有一個：

> 今天的我，是什麼狀態？

它不是：

能力系統。

不是：

傷病系統。

不是：

情緒系統。

它整合：

身體、

心理、

節奏、

環境，

形成角色今天真正能展現的狀態。

Current State

讓每天都不同。

讓每場比賽都不同。

也讓每一次人生事件，

都能留下短期而真實的影響。
