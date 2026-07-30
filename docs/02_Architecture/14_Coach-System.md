# 14 Coach System

Subtitle:

Coach Cognition System

Version:

2.0

---

# Purpose

Coach System

負責管理：

具有專業職責的人，

如何觀察、

理解、

評估、

培養、

使用

一名球員。

它回答的核心問題是：

> 這位專業人士，是如何做出判斷的？

Coach

不是：

教練這個職稱。

它代表：

所有具有專業判斷責任的人。

例如：

- 少棒教練
- 青棒教練
- 大學總教練
- 守備教練
- 打擊教練
- 投手教練
- 球探
- 防護員
- 球隊經理
- 農場主管
- GM
- 技術總監

不同角色，

擁有不同：

責任、

資訊、

專業、

權限、

判斷方式。

Coach System

管理的是：

這些角色如何思考。

不是：

他們最後做出了什麼行政決策。

---

# Responsibilities

Coach System

負責管理：

- Coaching Philosophy
- Observation
- Evaluation
- Projection
- Professional Knowledge
- Teaching Style
- Communication Style
- Development Philosophy
- Talent Identification
- Player Usage Philosophy
- Workload Philosophy
- Strategy Preference
- Position Preference
- Risk Preference
- Trust Model
- Professional Bias
- Professional Memory
- Confidence
- Recommendation

Coach System

不負責：

- 玩家能力
- 傷病本身
- 球隊政策
- 正式行政決策
- 玩家選擇
- 人際感情
- 世界制度
- 比賽模擬
- 劇情意義
- 存檔
- UI

---

# Not Responsible

## Player System

Player

保存：

角色目前狀態。

Coach

保存：

對角色的理解。

例如：

Player：

球速145公里。

Coach A：

認為仍可進步。

Coach B：

認為已接近極限。

Player

是真實資料。

Coach

是真實資料的解讀。

兩者不能混在一起。

---

## Progression System

Progression

管理：

角色如何長期成長。

Coach

管理：

如何引導這段成長。

例如：

Progression：

控球提升。

Coach：

安排哪些訓練、

提供哪些建議、

是否相信值得培養。

Coach

不直接增加能力。

他只影響：

角色如何成長。

---

## Current State System

Current State

回答：

角色今天狀態如何。

Coach

回答：

他如何解讀這些狀態。

例如：

Current State：

疲勞。

Coach A：

今天休息。

Coach B：

今天減量。

Coach C：

今天照常先發。

Current State

提供資訊。

Coach

提供判斷。

---

## Injury System

Injury

保存：

實際傷病。

Coach

只能：

觀察、

推測、

懷疑。

例如：

球員：

球速下降。

Coach：

懷疑疲勞。

實際：

UCL 已部分撕裂。

Coach

不知道。

Observation

不能等於：

Medical Diagnosis。

---

## Match System

Match

管理：

比賽進行。

Coach

管理：

如何使用球員。

例如：

- 是否先發
- 是否換投
- 是否代打
- 是否短打
- 是否故意保送
- 是否盜壘

真正比賽結果，

仍由：

Match

決定。

---

## Event System

Event

記錄：

實際發生。

例如：

教練安排先發。

Coach

保存：

為何安排。

例如：

因為：

相信抗壓能力。

不是：

因為事件已經發生。

---

## Decision System

Decision

保存：

玩家如何做選擇。

Coach

保存：

Coach 如何提出建議。

例如：

Coach：

建議不要提前復出。

Player：

決定冒險上場。

Coach

不替玩家做決定。

---

## Organization System

Organization

回答：

球隊制度。

Coach

回答：

制度內的人，

如何判斷。

例如：

球隊政策：

限制100球。

Coach A：

95球就換。

Coach B：

100球才換。

Coach C：

110球仍繼續。

制度相同。

Coach

不同。

---

## Relationship System

Relationship

保存：

彼此關係。

Coach

保存：

專業判斷。

例如：

Relationship：

教練很喜歡玩家。

Coach：

仍認為不適合先發。

感情

不等於：

專業評價。

---

## Narrative System

Narrative

保存：

角色如何理解教練。

Coach

保存：

教練真正如何思考。

例如：

Narrative：

「教練討厭我。」

Coach：

其實只是認為：

目前控球不足。

Narrative

可以誤解 Coach。

---

## Career System

Career

保存：

正式職涯。

Coach

可能影響：

- 是否推薦
- 是否升上一軍
- 是否繼續培養
- 是否建議守位轉換

真正職涯結果，

仍由：

Career

保存。

---

# Core Concepts

Coach

不是：

能力值。

Coach

是一套：

認知模型。

```text
Observation

↓

Interpretation

↓

Evaluation

↓

Projection

↓

Recommendation
```

Coach

不是：

知道真相。

Coach

只是：

根據自己知道的資訊，

形成專業判斷。

---

# Coach Layer

Coach 的認知可分成六層：

```text
Information

↓

Observation

↓

Interpretation

↓

Evaluation

↓

Projection

↓

Recommendation
```

每一層，

都有可能出錯。

---

## Information

Information

代表：

Coach 能取得哪些資訊。

例如：

- 比賽內容
- 練習狀況
- 身體狀態
- 球探報告
- 數據
- 傷病資訊
- 球員回報
- 教練團討論

Coach

只能依照：

已知資訊

做判斷。

不知道的事情，

無法直接推論。

---

## Observation

Observation

代表：

Coach 注意到什麼。

例如：

- 揮棒變慢
- 球速下降
- 動作改變
- 守備腳步異常
- 情緒不穩
- 訓練投入度
- 與隊友互動

不同 Coach，

注意力不同。

有人重視：

動作。

有人重視：

數據。

有人重視：

態度。

Observation

不是：

事實。

而是：

他看到什麼。

---

## Interpretation

Interpretation

代表：

Coach 如何解讀 Observation。

例如：

看到：

球速下降。

Coach A：

疲勞。

Coach B：

偷懶。

Coach C：

受傷。

Observation 相同。

Interpretation 不同。

Interpretation

受到：

- 經驗
- 哲學
- Bias
- 專業知識

共同影響。

---

## Evaluation

Evaluation

代表：

Coach 如何評估球員。

例如：

- 值不值得培養
- 是否值得先發
- 是否可靠
- 是否適合這個守位
- 是否符合球隊文化
- 是否值得投資

Evaluation

不是：

能力值。

而是：

專業評價。

---

## Projection

Projection

代表：

Coach 對未來的預測。

例如：

16歲：

目前能力普通。

Coach A：

未來Ace。

Coach B：

最多二軍。

Coach C：

應轉打者。

Projection

永遠存在：

不確定性。

它不是：

預言。

---

## Recommendation

Recommendation

代表：

Coach 建議下一步。

例如：

- 增加訓練量
- 降低投球數
- 更換守位
- 接受手術
- 升上一軍
- 下放二軍
- 暫停出賽
- 專注守備

Recommendation

不是：

最後決策。

它只是：

Coach 的專業建議。

---

# Coach Identity

每位 Coach

都是：

獨立存在的認知個體。

例如：

Coach ID：C-021

Role：

Pitching Coach

Experience：

22 Years

Philosophy：

Mechanics First

Risk Preference：

Conservative

Teaching Style：

Detail-Oriented

Bias：

Traditional Pitchers

Knowledge：

Elite

Memory：

Stored Separately

Trust：

Independent

每位 Coach

都應擁有：

自己的：

思考方式。

而不是：

共用同一套 AI。

---

# Professional Role

Role

代表：

Coach 的專業責任。

例如：

Pitching Coach

主要關心：

- 投球機制
- 球種
- 用球量

Scout

主要關心：

- 潛力
- 投資價值
- 發展空間

Athletic Trainer

主要關心：

- 身體安全
- 傷病風險
- 回歸條件

Role

決定：

資訊來源、

評估重點、

Recommendation。

---

# Coach Philosophy

Coach Philosophy

代表：

Coach 相信什麼。

例如：

- Winning First
- Development First
- Discipline First
- Freedom First
- Data Driven
- Experience Driven
- Fundamentals First
- Mental Toughness First

哲學不同，

即使看到同樣球員，

也可能得出：

完全不同結論。

---

# Core Data

每位 Coach

至少應保存：

```text
Coach ID

Professional Role

Experience

Knowledge

Coaching Philosophy

Observation Profile

Evaluation Philosophy

Projection Style

Teaching Style

Communication Style

Development Philosophy

Player Usage Philosophy

Risk Preference

Trust Model

Bias

Professional Memory

Confidence

Recommendation History
```

Coach System

保存的是：

專業人士如何形成判斷。

不是：

玩家真正有多強。

# Coach Lifecycle

Coach

不是：

固定不變的人格設定。

他的：

知識、

經驗、

偏好、

信心、

觀察方式

都可能隨著時間改變。

Coach 的認知生命週期如下：

```text
Professional Experience

↓

Knowledge Accumulation

↓

Observation

↓

Interpretation

↓

Evaluation

↓

Recommendation

↓

Outcome Feedback

↓

Learning

↓

Updated Philosophy
```

Coach

不是：

永遠正確。

真正的 Coach

也會：

修正、

懷疑、

學習、

甚至固守錯誤。

---

# Knowledge Acquisition

Coach 的知識來源，

應區分為不同管道。

```text
Playing Experience

Professional Education

Mentorship

Observation

Analytics

Medical Knowledge

Organization Culture

Past Success

Past Failure
```

不同來源，

會形成不同的 Coach。

---

## Playing Experience

曾經當過球員。

例如：

- 旅美投手
- 中職老將
- 高中名教練
- 業餘球員

不同經歷，

會影響：

Interpretation。

例如：

曾是速球派投手，

可能較重視：

球威。

---

## Professional Education

正式學習。

例如：

- 教練證照
- 運動科學
- 生物力學
- 心理學
- 運動醫學

Education

提高：

Knowledge。

但不保證：

判斷一定正確。

---

## Mentorship

受到其他教練影響。

例如：

師承：

甲教練。

因此：

沿用：

相同理念。

但多年後，

也可能逐漸形成：

自己的 Philosophy。

---

## Analytics

Coach

是否重視：

數據分析。

例如：

- Exit Velocity
- Spin Rate
- Zone Rate
- Swing Decision
- WAR
- Expected Statistics

Analytics Preference

影響：

Observation。

不是：

能力。

---

## Medical Knowledge

Coach

對傷病理解程度。

例如：

Coach A：

知道 Pitch Count。

Coach B：

理解 Load Management。

Coach C：

理解生物力學。

Medical Knowledge

影響：

Interpretation。

不是：

Medical Diagnosis。

---

# Observation Model

Coach

永遠無法觀察：

全部資訊。

Observation

受到：

```text
Available Information

↓

Attention

↓

Professional Knowledge

↓

Bias

↓

Observed Facts
```

影響。

---

## Available Information

Coach

能看到什麼。

例如：

- 比賽
- 練習
- 牛棚
- 身體檢查
- 球探報告
- 球員自述

資訊不足，

Observation

自然有限。

---

## Attention

不同 Coach，

注意不同事情。

例如：

Coach A：

先看：

Mechanics。

Coach B：

先看：

Result。

Coach C：

先看：

Attitude。

Attention

決定：

Observation Priority。

---

## Observation Accuracy

Observation

具有：

Accuracy。

例如：

Novice Coach：

容易漏掉細節。

Elite Coach：

容易發現：

細微異常。

Accuracy

可能受到：

- Experience
- Knowledge
- Fatigue
- Bias
- Observation Time

影響。

---

## Observation Confidence

Coach

可能：

不確定。

例如：

```text
Observation：

疑似肩膀代償。

Confidence：

Low
```

Observation

不應全部都是：

100% 確定。

---

# Interpretation Model

Coach

如何理解 Observation。

流程：

```text
Observation

↓

Professional Knowledge

↓

Bias

↓

Past Memory

↓

Interpretation
```

Interpretation

可能包括：

- 技術問題
- 心理問題
- 傷病問題
- 態度問題
- 成熟度問題
- 潛力問題

Observation 相同，

Interpretation

可以不同。

---

## Interpretation Bias

Bias

會影響：

Coach 如何理解資訊。

例如：

看到：

沒有全力衝刺。

Coach A：

偷懶。

Coach B：

身體不舒服。

Coach C：

保護自己。

Bias

不是：

Bug。

是真正的人類思考。

---

## Alternative Interpretation

Coach

可能同時保留：

多個可能性。

例如：

```text
球速下降

↓

可能：

疲勞

傷病

偷懶

球種調整
```

Coach

最後只會：

選擇目前最相信的一種。

但其他 Interpretation

仍可保留。

---

# Evaluation Model

Evaluation

不是：

能力值。

而是：

Coach 的專業評價。

流程：

```text
Observation

↓

Interpretation

↓

Evaluation Criteria

↓

Evaluation
```

Evaluation

可能包括：

- Ability
- Potential
- Reliability
- Coachability
- Professionalism
- Competitiveness
- Development Rate
- Team Fit

---

## Evaluation Criteria

不同 Coach，

重視不同。

例如：

Pitching Coach：

- Mechanics
- Command
- Velocity

Scout：

- Ceiling
- Projection
- Athleticism

Manager：

- Stability
- Winning Ability

Athletic Trainer：

- Availability
- Durability

Criteria

來自：

Role。

---

## Evaluation Confidence

Coach

可能：

沒有把握。

例如：

```text
Potential：

★★★★☆

Confidence：

40%
```

Confidence

影響：

Recommendation。

---

# Projection Model

Projection

代表：

Coach 如何預測未來。

流程：

```text
Current Evaluation

↓

Growth Model

↓

Development Philosophy

↓

Projection
```

Projection

不是：

能力外插。

它受到：

Coach

自己的世界觀影響。

---

## Projection Horizon

不同 Coach，

看的時間不同。

例如：

Short-Term：

下一場。

Medium-Term：

本季。

Long-Term：

五年後。

Scout

通常：

Long-Term。

Manager

通常：

Short-Term。

---

## Projection Confidence

Projection

應具有：

Confidence。

例如：

```text
Ace Potential

Confidence：

25%
```

代表：

Coach

認為：

可能。

但沒有把握。

---

# Recommendation Model

Recommendation

建立於：

```text
Evaluation

+

Projection

+

Current Context

=

Recommendation
```

Recommendation

不是：

唯一答案。

例如：

同一球員。

Coach A：

增加球數。

Coach B：

限制球數。

Coach C：

改守位。

全部都合理。

---

## Recommendation Category

Recommendation

可分成：

- Training
- Competition
- Workload
- Position
- Medical
- Career
- Mental
- Technical

例如：

Training：

增加變化球。

Medical：

安排檢查。

Career：

考慮轉守位。

---

# Teaching Model

Coach

不是：

直接增加能力。

他透過：

Teaching

影響：

Progression。

流程：

```text
Teaching Style

↓

Player Reception

↓

Learning Efficiency

↓

Progression
```

Teaching

不是：

能力來源。

而是：

能力成長效率。

---

## Teaching Style

例如：

- Demonstration
- Explanation
- Repetition
- Feedback
- Challenge
- Freedom

不同 Player，

適合不同 Style。

---

## Communication Style

例如：

- Direct
- Encouraging
- Strict
- Quiet
- Emotional
- Rational

Communication

影響：

Player 是否理解。

不是：

Relationship。

---

# Player Usage Model

Coach

需要決定：

如何使用球員。

流程：

```text
Evaluation

↓

Current State

↓

Injury

↓

Organization Context

↓

Player Usage Recommendation
```

Usage

可能包括：

- Starter
- Reliever
- Bench
- DH
- Development
- Rest
- Rehabilitation

Coach

提出建議。

真正執行，

仍由：

Organization。

---

# Trust Model

Coach

對每位球員，

都有不同程度：

Trust。

Trust

不是：

Relationship。

Trust

代表：

專業信任。

例如：

是否相信：

- 能完成任務
- 能遵守計畫
- 能承受壓力
- 能改善缺點

---

## Trust Building

Trust

可能受到：

- Performance
- Consistency
- Honesty
- Work Ethic
- Learning
- Responsibility

影響。

Trust

建立速度，

由 Coach

決定。

---

## Trust Loss

Trust

也可能下降。

例如：

- 隱瞞傷病
- 偷懶
- 情緒失控
- 多次犯同樣錯誤
- 違反團隊規範

Trust

下降後，

Coach

可能：

降低 Recommendation。

---

# Professional Memory

Coach

保存：

專業記憶。

不是：

Relationship。

例如：

```text
曾經：

主動留下加練

↓

Memory：

Positive
```

或：

```text
曾經：

提前復出造成惡化

↓

Memory：

High Medical Risk
```

Memory

會影響：

Interpretation、

Evaluation、

Projection。

---

# Memory Decay

Memory

不是永久完全保留。

不同事件，

重要程度不同。

例如：

重大事件：

永久記得。

小失誤：

可能逐漸淡化。

Memory

可具有：

Decay。

---

# Confidence Model

Coach

所有判斷，

都應具有：

Confidence。

例如：

```text
Observation：

80%

Evaluation：

60%

Projection：

30%

Recommendation：

70%
```

Confidence

不是：

能力。

而是：

Coach 對自己判斷的相信程度。

---

# Coach Learning

Coach

也應持續學習。

例如：

```text
Recommendation

↓

Outcome

↓

Reflection

↓

Knowledge Update

↓

Future Decision
```

例如：

一直過度使用投手，

造成大量傷病。

多年後，

Coach

可能修正：

Workload Philosophy。

---

# Core Lifecycle Data

Coach

至少應保存：

```text
Knowledge Sources

Observation History

Interpretation History

Evaluation History

Projection History

Recommendation History

Teaching History

Usage History

Trust History

Professional Memory

Confidence History

Learning History

Updated Philosophy
```

Coach System

保存的是：

一位專業人士，

如何逐漸形成自己的執教方式。

# Data Flow

Coach System 與其他 System 的資料流如下：

```text
World
Organization
Player
Current State
Injury
Match
Event
Relationship
Performance History
        │
        ▼
 Available Information
        │
        ▼
    Observation
        │
        ▼
   Interpretation
        │
        ▼
     Evaluation
        │
        ▼
     Projection
        │
        ▼
  Recommendation
        │
        ▼
Organization
Decision
Training
Match
Career
```

Coach

不是直接控制世界。

Coach

取得資訊，

形成自己的理解，

提出專業建議。

真正執行，

交由其他 System。

---

# Coach Update Flow

Coach 應依以下流程更新：

```text
Receive Information

↓

Observe

↓

Interpret

↓

Evaluate

↓

Generate Projection

↓

Generate Recommendation

↓

Observe Outcome

↓

Professional Reflection

↓

Update Memory

↓

Update Philosophy
```

Coach

每一次：

比賽、

訓練、

事件、

傷病、

球員互動，

都可能更新自己的認知。

---

# Coach Trigger

Coach System

需要在什麼時候重新思考？

---

## Match Trigger

比賽結束。

Coach

重新評估：

- 表現
- 戰術
- 心態
- 使用方式
- 發展方向

例如：

原本認為：

不能抗壓。

今天：

滿壘連續三振。

Coach

可能改變：

Evaluation。

---

## Training Trigger

完成訓練。

Coach

重新觀察：

- 學習速度
- 動作修正
- 配合度
- 訓練態度
- 專注力

Training

提供：

Progress。

Coach

重新理解：

Player。

---

## Injury Trigger

球員：

受傷、

復健、

復出。

Coach

重新評估：

- 使用方式
- 負荷
- 未來定位
- 發展方向

Coach

不能修改：

傷病。

只能更新：

Recommendation。

---

## Current State Trigger

今天狀態不同。

例如：

疲勞、

情緒、

恢復、

睡眠。

Coach

可能改變：

今日使用策略。

---

## Event Trigger

重大事件。

例如：

- 關鍵失誤
- MVP
- 打架
- 家庭事件
- 媒體事件
- 球迷壓力

Coach

重新建立：

Interpretation。

例如：

是否成熟。

是否可靠。

---

## Relationship Trigger

Relationship

發生重大改變。

例如：

玩家：

開始信任教練。

或：

完全失去信任。

Coach

可能重新思考：

Communication Style。

Relationship

不是 Coach。

但會影響：

Coach。

---

## Organization Trigger

Organization

政策改變。

例如：

- 重建球隊
- 必須養新人
- 必須搶冠軍
- 預算下降
- 傷兵太多

Coach

重新調整：

Player Usage。

不是：

重新改變 Philosophy。

---

## World Trigger

世界改變。

例如：

- Pitch Count 普及
- 新數據革命
- AI 分析
- 新醫療技術
- 新棒球規則

Coach

可能逐漸：

更新 Knowledge。

---

## Time Trigger

時間經過。

例如：

一年。

Coach

累積：

經驗。

Learning。

Memory。

Confidence。

Philosophy。

都可能改變。

---

# Coach Evaluation

Coach

不是一直重新算能力。

他重新評估：

自己的理解。

Evaluation 包含：

```text
Observation Evaluation

Interpretation Evaluation

Player Evaluation

Projection Evaluation

Recommendation Evaluation

Self Evaluation
```

---

## Observation Evaluation

Coach

重新確認：

自己看到的是不是完整。

例如：

原本：

認為偷懶。

後來：

發現其實受傷。

Observation

修正。

---

## Interpretation Evaluation

Coach

重新思考：

自己的理解是否正確。

例如：

以前認為：

球員沒天份。

多年後：

才發現：

只是太晚熟。

Interpretation

修正。

---

## Player Evaluation

重新更新：

專業評價。

例如：

- Potential
- Coachability
- Reliability
- Work Ethic
- Leadership
- Competitiveness

Evaluation

不是：

Relationship。

---

## Projection Evaluation

重新更新：

未來預測。

例如：

16歲：

Ace。

20歲：

Bullpen。

23歲：

Closer。

Projection

可以一直修正。

---

## Recommendation Evaluation

Coach

重新確認：

自己的建議，

是否有效。

例如：

增加變化球。

結果：

控球變差。

Coach

可能修正：

Teaching。

---

## Self Evaluation

Coach

也會評估：

自己。

例如：

```text
是不是我教法有問題？

是不是我看錯了？

是不是我太保守？

是不是我太激進？
```

不是每位 Coach

都會：

Self Reflection。

有些：

完全不會。

---

# Coach Output

Coach

提供：

自己的專業判斷。

---

## Observation Output

提供：

Coach 注意到：

哪些事情。

例如：

- 動作異常
- 球速下降
- 專注力不足
- 成熟度提升

Observation

不是：

真相。

---

## Evaluation Output

提供：

Coach 評價。

例如：

```text
Potential：

★★★★★

Coachability：

★★★

Reliability：

★★★★
```

Evaluation

是：

Coach 的主觀看法。

---

## Projection Output

提供：

Coach

對未來預測。

例如：

```text
Starter

Closer

Utility

Ace

Future Captain
```

Projection

具有：

Confidence。

---

## Recommendation Output

提供：

Coach 建議。

例如：

- 增加球數
- 改守位
- 下二軍
- 升一軍
- 接受手術
- 暫停訓練
- 主練變速球

Recommendation

不是：

命令。

---

## Trust Output

提供：

Coach

目前：

專業信任。

例如：

```text
High

Medium

Low
```

Organization

可以參考。

不是：

唯一依據。

---

## Usage Output

提供：

Coach

建議：

如何使用球員。

例如：

- Starter
- Long Relief
- Setup
- Closer
- DH
- Defensive Replacement

真正決定：

仍由：

Organization。

---

# Relationship with Other Systems

---

## Player System

Player

提供：

能力、

經驗、

狀態。

Coach

提供：

理解。

Player

是真實。

Coach

是：

理解。

---

## Progression System

Coach

影響：

Progression。

例如：

Teaching。

Training。

Feedback。

Progression

回傳：

角色真的成長了多少。

Coach

不能直接：

增加能力。

---

## Current State System

Current State

提供：

今日狀態。

Coach

重新安排：

Usage。

Training。

Rest。

---

## Injury System

Injury

提供：

Medical Information。

Coach

形成：

Usage Recommendation。

Coach

不能：

診斷。

---

## Match System

Match

提供：

Performance。

Coach

形成：

Evaluation。

Recommendation。

Usage。

---

## Event System

Event

提供：

發生什麼。

Coach

更新：

Memory。

Interpretation。

---

## Decision System

Coach

提供：

Recommendation。

Player

Decision

決定：

是否接受。

---

## Organization System

Coach

提供：

Professional Recommendation。

Organization

形成：

正式行政決策。

例如：

Coach：

建議升一軍。

Organization：

因名額不足，

暫不升。

---

## Relationship System

Relationship

影響：

Communication。

Trust。

Coach

不保存：

感情。

---

## Career System

Coach

可能影響：

Career。

例如：

推薦。

守位轉換。

培養方向。

真正 Career

仍保存：

正式結果。

---

## Narrative System

Coach

真正想法。

Narrative

玩家理解。

可能：

完全不同。

---

## World Simulation System

World

提供：

教練文化。

例如：

年代不同。

知識不同。

Coach

因此不同。

---

## Save System

Save

保存：

Coach：

- Memory
- Evaluation
- Projection
- Trust
- Recommendation History
- Philosophy

Coach

不負責：

存檔。

---

## UI System

UI

只能顯示：

玩家合理知道的 Coach。

例如：

Coach：

可能認為：

玩家不可靠。

玩家：

不知道。

除非：

Coach

說出來。

或：

事件發生。

不能：

直接偷看 AI。

---

# Architecture Rules

Coach System

必須遵守：

---

## Rule 01

Coach

不是：

Player AI。

Coach

只代表：

專業人士。

---

## Rule 02

Coach

不能知道：

全部真相。

只能知道：

Information。

---

## Rule 03

Observation

不能等於：

Reality。

看到：

球速下降。

不代表：

知道真正原因。

---

## Rule 04

Interpretation

必須允許：

錯誤。

Coach

可以誤判。

---

## Rule 05

Evaluation

不是：

Player Ability。

Evaluation

只是：

Coach 看法。

---

## Rule 06

Projection

不是：

命運。

Coach

可以：

完全看錯。

---

## Rule 07

Recommendation

不是：

行政命令。

真正執行：

Organization。

---

## Rule 08

Coach

不能直接：

改能力。

只能：

影響：

Progression。

---

## Rule 09

Coach

不能直接：

改傷病。

只能：

調整使用方式。

---

## Rule 10

Trust

必須是：

專業信任。

不是：

Relationship。

---

## Rule 11

Bias

不是 Bug。

Bias

是真正人格。

---

## Rule 12

Memory

必須存在。

Coach

不是：

每天重新開始。

---

## Rule 13

Learning

必須存在。

Coach

不是：

固定 AI。

---

## Rule 14

Knowledge

可以落後。

例如：

老教練。

不相信：

新數據。

---

## Rule 15

Communication

不等於：

Interpretation。

Coach

可能：

知道。

但不說。

---

## Rule 16

Coach

不應：

全部一樣。

Role、

Knowledge、

Bias、

Experience、

Teaching、

Communication、

Trust、

Memory、

都應不同。

---

## Rule 17

同一事件，

不同 Coach，

應得到：

不同結論。

這才是真正：

Coach System。

---

## Rule 18

Coach

不應永遠正確。

錯誤、

偏見、

修正、

反思，

都是：

Coach 的一部分。

---

## Rule 19

Coach

不能取代：

Decision。

玩家永遠：

保留自己的選擇。

---

## Rule 20

Coach

不能創造：

Narrative。

Coach

只提供：

他的理解。

真正人生意義，

交給：

Narrative。

# Extension Guidelines

新增 Coach 功能前，

必須先確認：

新增的是：

專業判斷，

還是其他系統的責任。

Coach System

只管理：

專業人士如何：

觀察、

理解、

評估、

預測、

培養、

建議。

---

## Question 01

新增的是：

事實，

還是：

Coach 的理解？

例如：

球速145。

這是：

Player。

Coach 認為：

145 很有潛力。

這是：

Coach。

不能混在一起。

---

## Question 02

新增的是：

專業判斷，

還是：

行政決策？

例如：

Coach：

建議升上一軍。

Organization：

決定不升。

Coach

不能直接保存：

最終行政結果。

---

## Question 03

新增的是：

Relationship，

還是：

Trust？

例如：

Coach：

很欣賞玩家。

Relationship。

Coach：

相信玩家能完成戰術。

Trust。

兩者不能混為一談。

---

## Question 04

新增的是：

Observation，

還是：

Diagnosis？

例如：

Coach：

看到：

跑姿怪怪的。

Observation。

真正：

ACL 撕裂。

Injury。

---

## Question 05

新增的是：

Teaching，

還是：

Progression？

Coach：

教導滑球。

Progression：

真的學會滑球。

Coach

提供：

教法。

Progression

保存：

能力變化。

---

## Question 06

新增的是：

Recommendation，

還是：

Decision？

Coach：

建議：

休息。

Player：

決定：

繼續先發。

Coach

不能替玩家：

做決定。

---

## Question 07

新增的是：

Bias，

還是：

Bug？

例如：

偏愛：

左投。

偏愛：

高中球員。

偏愛：

老將。

Bias

是真正的人類特徵。

不是：

錯誤。

---

## Question 08

新增的是：

Memory，

還是：

Narrative？

Coach：

記得：

玩家曾經偷懶。

Memory。

玩家：

因此覺得：

教練一直針對自己。

Narrative。

不能混。

---

## Question 09

新增的是：

Knowledge，

還是：

World？

例如：

2020年代。

數據分析成熟。

這是：

World。

Coach：

願不願意接受數據。

這是：

Coach。

---

## Question 10

新增的是：

人格，

還是：

專業哲學？

例如：

內向。

外向。

幽默。

沉默。

這是：

NPC Personality。

Coach

只保存：

如何執教。

---

# Coach Template

新增一位 Coach，

至少需要：

```text
Coach ID

Professional Role

Experience

Knowledge Level

Coaching Philosophy

Observation Profile

Evaluation Criteria

Projection Style

Teaching Style

Communication Style

Development Philosophy

Player Usage Philosophy

Risk Preference

Trust Model

Bias

Professional Memory

Learning Ability

Confidence

Recommendation Pattern
```

Template

描述的是：

Coach 的思考模型。

不是：

人物背景故事。

---

# Coach Granularity

Coach

資料可以有不同深度。

---

## Low Granularity

例如：

```text
Strict Coach

Good Teacher

Likes Defense
```

優點：

容易製作。

缺點：

NPC 很容易重複。

---

## Medium Granularity

例如：

```text
Observation：

Mechanics First

Teaching：

Detail Feedback

Risk：

Conservative

Projection：

Long-Term

Communication：

Direct
```

適合：

《棒球人生》。

玩家能明顯感受到：

不同教練。

---

## High Granularity

例如：

建立：

完整：

認知模型。

包含：

- Information Weight
- Attention Priority
- Confidence Curve
- Learning Curve
- Memory Decay
- Bayesian Updating
- Bias Interaction
- Recommendation Threshold

優點：

極度真實。

缺點：

製作、

除錯、

平衡

成本極高。

---

## Recommended Granularity

《棒球人生》

建議：

Medium。

底層：

保留：

認知流程。

表層：

玩家只看到：

- 教法
- 用人
- 發言
- 推薦
- 信任

不需要看到：

所有 AI 權重。

---

# Coach Diversity

Coach

真正重要的是：

差異。

不能只有：

能力不同。

至少應有：

```text
Observation

Interpretation

Evaluation

Projection

Teaching

Communication

Usage

Bias

Trust

Risk
```

不同。

如此：

兩位能力相同的 Coach，

仍會：

完全不同。

---

# Information Visibility

Coach

不是：

全知。

資訊必須：

分層。

---

## Coach Knowledge

Coach

知道：

自己看到的。

不知道：

沒有資訊的。

例如：

玩家：

偷偷加練。

如果沒人知道。

Coach

不知道。

---

## Organization Knowledge

Organization

可能知道：

更多：

行政資訊。

Coach

不一定知道：

全部。

例如：

GM 已決定交易。

總教練：

可能還不知道。

---

## Player Knowledge

玩家

不知道：

Coach 真正 Evaluation。

只能透過：

- 對話
- 使用方式
- 推薦
- 事件
- 比賽安排

慢慢推測。

---

## UI Rule

UI

不能直接顯示：

```text
Coach：

Potential：

98

Trust：

62

Bias：

Defense +20%
```

玩家只能：

感受到。

不能：

偷看 AI。

除非：

Debug Mode。

---

# Difficulty and Accessibility

Coach

需要同時服務：

三類玩家。

---

## Casual Player

看到：

```text
教練：

比較喜歡：

守備。
```

即可。

---

## Baseball Fan

可以理解：

教練：

不同：

養成理念。

---

## Hardcore Player

可以逐步理解：

Coach

真正：

如何思考。

但：

不用知道：

所有權重。

---

# Common Mistakes

---

## Mistake 01

Coach

等於：

Organization。

錯。

Coach

只是：

組織裡的一位專業人士。

---

## Mistake 02

Coach

知道：

全部資訊。

錯。

Coach

只能知道：

合理取得資訊。

---

## Mistake 03

Observation

等於：

Reality。

錯。

Observation

可能：

漏看、

誤判、

偏見。

---

## Mistake 04

Coach

永遠正確。

錯。

真正 Coach

也會：

看走眼。

---

## Mistake 05

Evaluation

等於：

Player Ability。

錯。

Evaluation

只是：

Coach 看法。

---

## Mistake 06

Projection

永遠準。

錯。

Projection

可以：

完全失敗。

---

## Mistake 07

Trust

等於：

Relationship。

錯。

Trust：

專業信任。

Relationship：

情感。

---

## Mistake 08

Bias

全部移除。

錯。

Bias

是真實棒球。

---

## Mistake 09

Coach

全部一樣。

錯。

真正樂趣：

來自：

不同 Coach。

---

## Mistake 10

Teaching

直接：

加能力。

錯。

Teaching

只是：

影響 Progression。

---

## Mistake 11

Coach

直接控制：

Career。

錯。

Coach

只能：

建議。

---

## Mistake 12

Communication

等於：

真正想法。

錯。

Coach

可能：

故意不說。

---

## Mistake 13

Coach

永遠不改變。

錯。

Coach

應持續：

Learning。

---

## Mistake 14

Memory

不存在。

錯。

Coach

應記得：

重要事件。

---

## Mistake 15

所有 Coach

只差：

數值。

錯。

真正差異：

認知。

---

## Mistake 16

所有 Coach

都相信：

數據。

錯。

不同年代、

不同背景、

不同哲學，

都會不同。

---

## Mistake 17

Coach

只在劇情存在。

錯。

Coach

應每天：

持續觀察、

評估、

更新。

---

## Mistake 18

Recommendation

只有：

唯一正解。

錯。

合理 Recommendation

可以：

很多種。

---

## Mistake 19

Coach

創造：

Narrative。

錯。

Coach

只是：

提供他的理解。

人生意義，

由：

Narrative。

---

## Mistake 20

Coach

只是 NPC。

錯。

Coach

其實是：

一套：

專業認知 AI。

---

# Design Philosophy

Coach System

不是：

讓 NPC 看起來比較聰明。

而是：

重現真實棒球世界中，

「不同專業人士如何看待同一名球員」。

同一位球員，

可能同時面對：

```text
球探：

值得第一輪。

↓

總教練：

還不能上一軍。

↓

投手教練：

機制需要重建。

↓

防護員：

不能再投。

↓

GM：

值得長約。
```

每一個人，

都不是：

對或錯。

他們只是：

站在不同資訊、

責任、

哲學、

時間尺度，

做出自己的專業判斷。

---

Coach System

真正模擬的，

不是：

教練。

而是：

專業認知。

因此：

好的 Coach，

不應永遠正確。

真正有魅力的 Coach，

應該：

會犯錯、

會懷疑、

會修正、

會堅持、

也可能直到退休，

仍然相信：

自己一直是對的。

---

玩家真正記住的，

不會只是：

「這個教練很嚴格。」

而會是：

```text
他一直相信我，

即使所有人都放棄。

```

或：

```text
他從第一天，

就認為我不適合當投手。
```

或：

```text
多年後，

他終於承認：

當年看錯我了。
```

這些，

都不是劇情強制安排。

而是：

Coach System

自然產生的結果。

---

# Summary

Coach System

回答：

> 這位專業人士，是如何觀察、理解、評估、培養與使用球員的？

它管理：

- Information
- Observation
- Interpretation
- Evaluation
- Projection
- Recommendation
- Teaching
- Communication
- Trust
- Bias
- Memory
- Learning
- Coaching Philosophy

它不管理：

- Player 真實能力
- Injury 真實狀況
- Organization 正式決策
- Player Decision
- Relationship 情感
- Narrative 人生意義
- Match 模擬
- Career 正式結果

---

Coach System

核心流程：

```text
Information

↓

Observation

↓

Interpretation

↓

Evaluation

↓

Projection

↓

Recommendation

↓

Outcome

↓

Learning

↓

Updated Cognition
```

---

Coach 必須維持：

```text
Reality

≠

Observation

≠

Interpretation

≠

Evaluation

≠

Recommendation

≠

Organization Decision
```

---

Coach

不是：

永遠正確的人。

他是一位：

會觀察、

會理解、

會誤判、

會修正、

會成長

的專業人士。

透過這個系統，

《棒球人生》的教練、

球探、

防護員、

球團主管，

都不再只是功能型 NPC。

他們會擁有：

自己的棒球哲學、

自己的認知模型、

自己的偏見、

自己的執教方式，

以及自己的成功與失敗。