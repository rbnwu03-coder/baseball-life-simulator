# 13 Injury System

Version: 2.0

---

# Purpose

Injury System 負責管理：

角色身體受到傷害後，

傷病如何形成、

如何被辨識、

如何影響活動、

如何治療、

如何恢復，

以及是否留下長期後果。

它回答的核心問題是：

> 角色的身體發生了什麼問題？

以及：

> 這個問題目前限制了什麼？

Injury

不是：

單純的負面狀態。

也不是：

隨機扣除能力值。

它是一段具有：

原因、

位置、

嚴重度、

症狀、

診斷、

治療、

恢復、

風險、

後遺影響

的身體歷程。

---

# Responsibilities

Injury System 負責管理：

- Injury Cause
- Injury Location
- Injury Type
- Injury Severity
- Injury Symptoms
- Injury Diagnosis
- Functional Limitation
- Treatment Plan
- Rehabilitation State
- Recovery Progress
- Reinjury Risk
- Chronic Condition
- Medical Clearance
- Injury History
- Long-Term Consequence

Injury System 不負責：

- 角色原始能力
- 每日整體狀態
- 訓練成長
- 比賽模擬
- 組織醫療資源
- 醫師或教練的個人判斷
- 玩家是否接受治療
- 傷病事件的敘事意義
- 存檔流程
- UI 顯示

---

# Not Responsible

## Player System

Player

保存：

角色目前的整體資料。

Injury

保存：

角色目前有哪些傷病。

例如：

Player：

18 歲右投手。

Injury：

右手肘內側韌帶輕度損傷。

Player

不應直接保存：

完整診斷歷程、

復健階段、

再受傷風險。

這些資料屬於：

Injury System。

---

## Progression System

Progression

回答：

角色長期成長成為什麼樣的球員。

Injury

回答：

角色目前身體哪些部位受到損傷。

例如：

Progression：

球速能力提升。

Injury：

肩關節出現過度使用傷害。

傷病可以限制：

成長與訓練。

但 Injury

不直接決定：

角色學會了什麼。

---

## Current State System

Current State

回答：

角色今天能發揮多少。

Injury

回答：

角色是否存在具體身體損傷。

例如：

疲勞、

睡眠不足、

短期肌肉緊繃，

可能屬於：

Current State。

肌腱炎、

韌帶撕裂、

骨折，

屬於：

Injury。

兩者可以互相影響，

但不能混為同一系統。

---

## Match System

Match

管理：

比賽中的競技過程。

Injury

管理：

比賽中可能形成的身體傷害，

以及傷病對功能造成的限制。

例如：

Match：

投球後手肘突然疼痛。

Event：

傷病事件發生。

Injury：

建立右手肘傷病紀錄。

Match

不負責：

後續診斷與復健。

---

## Event System

Event

保存：

某件事情實際發生。

例如：

- 滑壘時扭傷腳踝
- 投球後感到手肘刺痛
- 體檢發現舊傷惡化
- 醫師宣布可以恢復投球

Injury

保存：

傷病本身的持續狀態。

Event

是：

發生了什麼。

Injury

是：

身體因此變成什麼狀況。

---

## Decision System

Decision

管理：

角色如何選擇。

例如：

- 是否隱瞞疼痛
- 是否接受手術
- 是否提前復出
- 是否更換醫療團隊
- 是否繼續出賽

Injury

只提供：

風險、

限制、

診斷、

治療選項。

玩家如何回應，

由：

Decision System

負責。

---

## Organization System

Organization

提供：

- 醫療資源
- 復健設備
- 球隊政策
- 保險制度
- 出賽壓力
- 傷病處理標準

Injury

保存：

角色實際傷病狀況。

例如：

同樣的肩傷。

Organization A：

提供完整影像檢查與復健團隊。

Organization B：

只能安排休息與基礎治療。

組織會影響：

治療條件。

但傷病本身，

仍由 Injury 管理。

---

## Coach System

Coach

負責：

教練如何觀察與判斷球員狀態。

例如：

教練可能認為：

玩家只是疲勞。

但實際上：

Injury System 已存在早期肌腱傷害。

Coach Evaluation

不等於：

Medical Diagnosis。

教練可能：

誤判、

忽略、

過度保護，

或及早發現異常。

---

## Relationship System

Relationship

管理：

人物之間的長期連結。

傷病可能影響：

信任、

依賴、

衝突、

支持。

但 Injury

不保存：

玩家是否信任隊醫，

或是否因教練逼迫出賽而產生怨恨。

---

## Narrative System

Injury

保存：

身體事實。

Narrative

保存：

角色如何理解這段經歷。

例如：

Injury：

手術後球速下降。

Narrative：

玩家是否將其理解為：

失去天賦、

重新學習、

背叛、

或人生轉向。

---

## Career System

Career

保存：

角色目前的人生與職涯階段。

Injury

可能造成：

- 缺席球季
- 延後升學
- 選秀順位下降
- 暫停職涯
- 轉換守位
- 提前退休

但 Career

負責保存：

正式職涯結果。

Injury

只提供：

造成這些結果的身體條件。

---

# Core Concepts

Injury System

不應將所有身體問題，

簡化為：

```text
Healthy
或
Injured
```

傷病應由多個維度共同構成：

```text
Cause

↓

Damage

↓

Symptoms

↓

Diagnosis

↓

Functional Limitation

↓

Treatment

↓

Recovery

↓

Outcome
```

傷病不是單一數值。

它是一個：

持續變化的身體狀態。

---

# Injury Layer

Injury 可分成七個核心層級：

```text
Exposure

↓

Tissue Stress

↓

Damage

↓

Symptoms

↓

Diagnosis

↓

Functional Limitation

↓

Recovery State
```

---

## Exposure

Exposure

代表：

角色身體承受了什麼負荷或事故。

例如：

- 投球量增加
- 高強度訓練
- 休息不足
- 重複揮棒
- 跌倒
- 碰撞
- 滑壘
- 長期代償
- 尚未痊癒便復出

Exposure

本身不一定造成傷病。

它只是：

傷害可能形成的條件。

---

## Tissue Stress

Tissue Stress

代表：

身體組織實際承受的壓力。

可能受到：

- 動作機制
- 身體能力
- 疲勞
- 年齡
- 既往傷病
- 負荷量
- 恢復程度
- 裝備
- 場地

影響。

相同投球數，

對不同角色造成的 Tissue Stress

可能不同。

---

## Damage

Damage

代表：

身體組織已經產生的實際損傷。

例如：

- 發炎
- 拉傷
- 撕裂
- 挫傷
- 骨裂
- 骨折
- 軟骨磨損
- 神經壓迫
- 關節不穩定

Damage

不一定立即被角色察覺。

角色可能已經受傷，

但尚未出現明顯症狀。

---

## Symptoms

Symptoms

代表：

角色能感受到或被觀察到的異常。

例如：

- 疼痛
- 無力
- 麻木
- 腫脹
- 僵硬
- 活動受限
- 控球下降
- 動作改變
- 恢復速度異常

Symptoms

不等於：

Diagnosis。

相同疼痛，

可能來自：

不同傷病。

相同傷病，

也可能呈現：

不同症狀。

---

## Diagnosis

Diagnosis

代表：

醫療系統目前對傷病的判定。

Diagnosis 可能是：

- Unknown
- Suspected
- Preliminary
- Confirmed
- Revised

診斷不是永遠正確。

它取決於：

- 檢查能力
- 醫療資源
- 醫師判斷
- 症狀表達
- 傷病階段
- 影像檢查
- 組織政策

因此：

Actual Damage

與

Known Diagnosis

必須分離。

---

## Functional Limitation

Functional Limitation

代表：

傷病實際限制了哪些功能。

例如：

- 無法全力投球
- 無法長時間蹲捕
- 無法高速跑動
- 無法揮棒到底
- 無法穩定傳球
- 無法承受連續出賽
- 無法完成特定訓練

Functional Limitation

不是：

直接扣除所有能力。

它應針對：

具體動作、

負荷、

持續時間、

使用頻率

產生限制。

---

## Recovery State

Recovery State

代表：

傷病目前位於哪個恢復階段。

例如：

- Acute
- Stabilizing
- Healing
- Rehabilitation
- Return to Training
- Return to Play
- Monitoring
- Chronic

Recovery State

會影響：

- 可執行活動
- 可承受負荷
- 治療方式
- 再受傷風險
- Medical Clearance

---

# Injury Identity

每一筆 Injury

必須是：

獨立、可追蹤的傷病實體。

例如：

```text
Injury ID: INJ-0042

Character: Player

Body Part: Right Elbow

Structure: UCL

Type: Overuse Injury

Onset: Gradual

Severity: Moderate

Status: Rehabilitation
```

不能只保存：

```text
player.injured = true
```

因為同一角色可能同時存在：

- 右手肘舊傷
- 左腳踝新傷
- 下背慢性疼痛

每一筆傷病，

都可能具有不同：

原因、

限制、

治療、

恢復速度、

再受傷風險。

---

# Injury Onset

Injury Onset

代表：

傷病如何開始。

---

## Acute Onset

急性發生。

例如：

- 碰撞
- 跌倒
- 滑壘扭傷
- 投球瞬間撕裂
- 被球擊中

通常具有：

明確時間點。

---

## Gradual Onset

逐步形成。

例如：

- 肌腱炎
- 疲勞性骨折
- 肩關節磨損
- 腰部過度使用
- 手肘慢性疼痛

通常沒有：

單一明確事故。

傷病可能在多次 Exposure 中累積。

---

## Recurrence

舊傷復發。

例如：

曾受傷部位，

在恢復不完全或負荷增加後，

再次出現損傷。

Recurrence

應保留：

與原傷病的關聯。

不能完全視為：

沒有歷史的新傷。

---

## Compensatory Injury

代償性傷害。

例如：

玩家為了避免右腳踝疼痛，

改變動作，

導致左膝負荷增加。

Compensatory Injury

必須能追蹤：

前一筆傷病

如何提高：

新傷風險。

---

# Injury Type

Injury Type

可依形成方式分類。

---

## Traumatic Injury

外力或事故造成。

例如：

- 骨折
- 挫傷
- 撕裂
- 腦震盪
- 關節脫位

---

## Overuse Injury

長期重複負荷造成。

例如：

- 肌腱炎
- 疲勞性骨折
- 投手肘
- 肩部夾擠
- 腰椎壓力傷害

---

## Chronic Injury

長期存在，

可能無法完全消失。

例如：

- 軟骨磨損
- 慢性下背痛
- 關節不穩定
- 長期神經症狀

---

## Illness-Related Condition

非外傷性身體問題。

例如：

- 感染
- 發燒
- 腸胃疾病
- 呼吸系統疾病

是否納入 Injury System，

取決於遊戲規模。

若未建立獨立 Health System，

可暫由 Injury 管理。

但應明確標示：

Condition Type。

---

# Injury Severity

Severity

代表：

傷病對組織損傷與功能限制的程度。

可分成：

- Minor
- Mild
- Moderate
- Severe
- Critical
- Career Threatening

Severity

不應只由：

疼痛程度

決定。

它應綜合考慮：

- Tissue Damage
- Functional Limitation
- Expected Recovery Time
- Treatment Requirement
- Reinjury Risk
- Career Impact

例如：

疼痛不強的疲勞性骨折，

仍可能具有：

高風險。

而強烈挫傷疼痛，

可能只需：

短期休息。

---

# Known Injury vs Hidden Injury

傷病可能處於：

已知

或

未知。

---

## Hidden Injury

角色或組織尚未辨識的傷病。

可能只有：

- 輕微疼痛
- 動作異常
- 表現下降
- 恢復變慢

Hidden Injury

可以繼續惡化。

---

## Suspected Injury

已經察覺異常，

但尚未確診。

此時可能出現：

- 休息
- 觀察
- 帶傷出賽
- 安排檢查
- 隱瞞症狀

---

## Confirmed Injury

經醫療判定後，

建立正式診斷。

Confirmed Injury

才能產生較明確的：

- Treatment Plan
- Recovery Estimate
- Medical Restriction
- Clearance Standard

---

# Core Data

每一筆 Injury

至少應保存：

```text
Injury ID

Character ID

Body Region

Body Structure

Injury Type

Cause

Onset Type

Start Time

Actual Damage

Known Diagnosis

Severity

Symptoms

Functional Limitations

Recovery State

Treatment Plan

Rehabilitation Progress

Medical Restrictions

Medical Clearance

Reinjury Risk

Chronic Risk

Related Previous Injury

Organization Context

Injury History

Current Status
```

Injury System

保存的是：

傷病本身如何存在與演變。

它不保存：

角色對傷病的全部感受、

選擇與人生意義。

# Injury Lifecycle

Injury

不是：

單一事件發生後，

等待固定時間解除。

它具有自己的生命週期。

```text
Exposure

↓

Tissue Stress

↓

Damage Formation

↓

Symptom Expression

↓

Detection

↓

Diagnosis

↓

Treatment Decision

↓

Treatment

↓

Rehabilitation

↓

Return to Activity

↓

Return to Performance

↓

Recovery / Chronic Condition / Recurrence
```

不同傷病，

不一定經過所有階段。

例如：

輕微挫傷

可能不需要：

正式診斷或復健。

慢性過度使用傷害

則可能在：

Damage Formation

與

Symptom Expression

之間，

持續累積很長時間。

---

# Exposure Accumulation

Exposure

可以是：

單次高強度刺激，

也可以是：

長期負荷累積。

---

## Acute Exposure

單次事故或高強度負荷。

例如：

- 碰撞
- 跌倒
- 被觸身球擊中
- 急停扭轉
- 單次極限投球
- 動作失衡後強行發力

Acute Exposure

可能立即造成：

Damage。

---

## Repeated Exposure

重複性負荷。

例如：

- 連續投球
- 頻繁蹲捕
- 高量揮棒
- 長時間跑動
- 密集賽程
- 重複使用相同動作鏈

Repeated Exposure

可能逐步累積：

Tissue Stress。

---

## Background Exposure

角色日常環境所造成的負荷。

例如：

- 睡眠不足
- 旅行
- 場地品質差
- 設備不合適
- 長期營養不足
- 氣候
- 訓練與比賽密度

Background Exposure

通常不會單獨形成傷病。

但可能降低：

身體承受其他負荷的能力。

---

# Tissue Load

Tissue Load

代表：

特定身體組織在某段時間內，

承受了多少實際負荷。

它不等於：

訓練量。

相同訓練量，

因角色條件不同，

可能產生不同 Tissue Load。

Tissue Load 可能受到：

- Movement Pattern
- Physical Capacity
- Fatigue
- Recovery
- Previous Injury
- Age
- Equipment
- Surface
- Intensity
- Volume
- Frequency

影響。

---

## Load Capacity

Load Capacity

代表：

組織目前可以安全承受的負荷範圍。

Load Capacity

不是永久固定。

它會受到：

- Progression
- Current State
- Injury History
- Rehabilitation
- Age
- Recovery Quality

影響。

---

## Load Ratio

傷病風險可以概念化為：

```text
Applied Tissue Load
        ÷
Current Load Capacity
```

當負荷長期接近或超過承受能力，

Damage Risk

會提高。

這不代表：

超過一次就必然受傷。

而是：

風險持續上升。

---

# Damage Formation

Damage Formation

代表：

Tissue Stress

如何轉化為：

實際組織損傷。

可以概念化為：

```text
Exposure
+
Vulnerability
+
Insufficient Recovery
+
Random Variation
=
Damage Risk
```

其中：

Vulnerability

可能來自：

- 舊傷
- 動作缺陷
- 結構弱點
- 年齡
- 成長期
- 長期疲勞
- 不適合的訓練
- 尚未完成復健

Random Variation

保留：

運動傷病不可完全預測的特性。

即使兩名球員條件相似，

結果也可能不同。

---

# Injury Risk

Injury Risk

代表：

角色在特定活動中受傷的機率與可能嚴重度。

它不是：

傷病本身。

Risk

應至少分成：

- Baseline Risk
- Activity Risk
- Accumulated Risk
- Reinjury Risk
- Compensatory Risk

---

## Baseline Risk

角色在一般狀態下的基礎風險。

可能受到：

- 年齡
- 身體結構
- 既往傷病
- 動作型態
- 長期健康
- 位置需求

影響。

Baseline Risk

不代表：

角色必然容易受傷。

它只是：

風險起點。

---

## Activity Risk

特定活動當下造成的風險。

例如：

- 全力投球
- 連續蹲捕
- 高速滑壘
- 撲接
- 碰撞
- 高強度重量訓練

Activity Risk

應依：

動作類型、

強度、

次數、

當前狀態

計算。

---

## Accumulated Risk

負荷與恢復長期失衡後，

逐步上升的風險。

例如：

球員沒有任何一次明顯受傷事件。

但在數週密集出賽後，

肩部傷病風險持續提高。

Accumulated Risk

應具有：

累積

與

衰減。

休息、

降低負荷、

改善恢復

可以使其下降。

---

## Reinjury Risk

同一部位再次受傷的風險。

它可能受到：

- 組織是否完全癒合
- 復健完成度
- 動作是否恢復
- 負荷是否逐步增加
- 提前復出
- 恐懼與保護性動作
- 原始傷病嚴重度

影響。

Medical Clearance

不代表：

Reinjury Risk = 0。

---

## Compensatory Risk

角色因保護受傷部位，

改變動作後，

其他部位增加的風險。

例如：

```text
右腳踝受傷

↓

減少右腳承重

↓

左膝負荷增加

↓

左膝傷病風險上升
```

Compensatory Risk

可以建立：

傷病之間的因果關聯。

---

# Symptom Lifecycle

Symptoms

可能隨時間：

出現、

加重、

減輕、

暫時消失、

再次復發。

症狀變化流程可表示為：

```text
Damage

↓

Symptom Threshold

↓

Symptom Expression

↓

Recognition

↓

Reporting / Concealment

↓

Evaluation
```

---

## Symptom Threshold

Damage

不一定立即產生可察覺症狀。

只有當損傷、

發炎、

神經反應

或功能失衡，

超過某個門檻後，

角色才可能感受到異常。

因此：

早期傷病

可能處於：

Hidden Injury。

---

## Symptom Expression

症狀呈現方式，

可能受到：

- 傷病類型
- 活動強度
- 角色疼痛敏感度
- 腎上腺素
- 心理壓力
- 比賽情境
- 睡眠
- 藥物

影響。

同一傷病，

在休息日可能幾乎沒有症狀。

在高強度比賽中，

則可能明顯惡化。

---

## Symptom Recognition

角色是否能正確認出：

身體異常。

可能取決於：

- 經驗
- 身體覺察
- 教育
- 過往傷病
- 年齡
- 對疼痛的理解
- 周遭文化

年輕球員可能把：

受傷

誤認為：

正常疲勞。

---

## Symptom Reporting

角色是否向：

教練、

隊醫、

家人、

組織

回報症狀。

Reporting

不是 Injury System 自行決定。

它應受到：

Decision、

Identity、

Organization Culture、

Relationship、

Career Pressure

影響。

例如：

角色可能因害怕失去先發位置，

選擇隱瞞疼痛。

Injury System

保存：

症狀仍存在。

Decision System

保存：

為何隱瞞。

---

# Detection

Detection

代表：

傷病是否被角色或他人察覺。

Detection Source 可能包括：

- Self Detection
- Coach Observation
- Teammate Observation
- Medical Screening
- Performance Decline
- Match Incident
- Routine Examination
- Imaging

不同 Detection Source

具有不同：

準確度、

速度、

成本、

可用性。

---

## Self Detection

角色自己察覺異常。

優點：

較早感受到疼痛或不適。

限制：

可能誤判、

隱瞞、

低估。

---

## Coach Observation

教練觀察到：

- 動作改變
- 球速下降
- 控球異常
- 跑動僵硬
- 恢復速度變慢

Coach Observation

只能建立：

Suspicion。

不能直接建立：

Confirmed Diagnosis。

---

## Medical Screening

透過：

- 身體檢查
- 功能測試
- 影像檢查
- 定期篩檢

發現傷病。

Medical Screening

可能在：

症狀尚不明顯時，

發現早期問題。

但是否能進行，

受到：

Organization Resources

影響。

---

# Diagnosis Process

Diagnosis

應是一段流程，

而不是受傷瞬間自動獲得完整資訊。

```text
Symptoms / Detection

↓

Initial Assessment

↓

Differential Diagnosis

↓

Testing

↓

Diagnosis Confidence

↓

Confirmed / Revised Diagnosis
```

---

## Initial Assessment

初步評估可能來自：

- 隊醫
- 物理治療師
- 醫師
- 防護員
- 教練
- 角色自己

不同來源，

具有不同專業程度。

---

## Differential Diagnosis

同一組症狀，

可能對應多種問題。

例如：

手肘疼痛

可能來自：

- 肌肉疲勞
- 肌腱發炎
- 韌帶損傷
- 神經壓迫
- 動作代償

Diagnosis Process

應保留：

不確定性。

---

## Diagnostic Test

檢查可能包括：

- Physical Examination
- Functional Test
- X-ray
- Ultrasound
- MRI
- CT
- Blood Test

是否能使用，

取決於：

- 醫療資源
- 組織制度
- 成本
- 傷病嚴重度
- 時間
- 角色 Decision

---

## Diagnosis Confidence

每個 Diagnosis

應具有：

Confidence Level。

例如：

- Low
- Moderate
- High
- Confirmed

Diagnosis Confidence

會影響：

治療方案的精確程度。

---

## Misdiagnosis

傷病可能被：

低估、

高估、

或判斷錯誤。

Misdiagnosis

可能造成：

- 不適合的治療
- 延誤恢復
- 過早復出
- 不必要休息
- 傷病惡化
- 組織衝突

Misdiagnosis

應來自：

醫療條件與資訊不足。

不能只是：

任意隨機懲罰。

---

# Treatment Plan

Treatment Plan

代表：

目前根據診斷與條件，

安排的傷病處理方式。

它可能包含：

- Rest
- Load Reduction
- Medication
- Physical Therapy
- Immobilization
- Injection
- Surgery
- Rehabilitation
- Movement Correction
- Monitoring
- Activity Modification

Treatment Plan

不是：

治療結果。

它只是：

目前採取的方法。

---

## Treatment Ownership

Treatment Plan

可能由：

- Physician
- Medical Team
- Organization
- Player
- Family
- External Specialist

共同影響。

但每個 Treatment Plan

必須記錄：

- Medical Recommendation
- Organization Position
- Player Decision
- Final Plan

三者可能不同。

例如：

```text
醫師建議手術

Organization 希望保守治療

Player 擔心錯過選秀

Final Plan：先復健觀察
```

這些衝突，

應交由：

Decision

與

Organization

處理。

Injury

保存：

最後實際執行的 Treatment Plan。

---

# Treatment Response

相同治療，

不保證產生相同結果。

Treatment Response

可能受到：

- Damage Severity
- Treatment Timing
- Medical Quality
- Adherence
- Age
- Recovery Capacity
- Previous Injury
- Current State
- Random Variation

影響。

---

## Treatment Adherence

Treatment Adherence

代表：

角色是否依計畫完成：

- 休息
- 用藥
- 復健
- 負荷限制
- 回診
- 動作調整

Adherence

本身通常受到：

Decision、

Identity、

Career Pressure、

Organization Culture

影響。

Injury System

保存：

實際遵從程度

如何影響恢復。

---

## Treatment Failure

治療可能未達預期。

例如：

- 症狀持續
- 組織癒合不足
- 功能未恢復
- 再次受傷
- 需要更換方案
- 最終改為手術

Treatment Failure

不一定代表：

醫療錯誤。

它可能是：

傷病本身的不確定性。

---

# Rehabilitation

Rehabilitation

不是：

等待傷病倒數結束。

它是一段逐步恢復：

組織、

活動度、

力量、

控制、

動作、

負荷耐受性

的過程。

可分為：

```text
Protection

↓

Mobility

↓

Strength

↓

Motor Control

↓

Sport-Specific Movement

↓

Load Tolerance

↓

Return to Training

↓

Return to Competition
```

---

## Protection Phase

目標：

避免進一步損傷。

可能限制：

- 投球
- 跑動
- 承重
- 揮棒
- 碰撞
- 特定關節活動

---

## Mobility Phase

目標：

恢復正常活動範圍。

但：

活動度恢復

不代表：

已經可以比賽。

---

## Strength Phase

目標：

恢復受傷部位與相關動作鏈的力量。

力量指標應區分：

- Maximum Strength
- Endurance
- Stability
- Explosive Output

---

## Motor Control Phase

目標：

恢復正確動作控制。

例如：

- 投球動作
- 落地控制
- 軀幹旋轉
- 肩胛穩定
- 下肢動作鏈

若只恢復力量，

但沒有修正動作，

Reinjury Risk

可能仍然很高。

---

## Sport-Specific Phase

恢復棒球專項活動。

例如：

- 傳接球
- 牛棚投球
- 打擊練習
- 守備移動
- 滑壘
- 長傳
- 實戰跑壘

---

## Load Tolerance Phase

逐步測試：

角色能否承受：

- 強度
- 次數
- 頻率
- 連續天數
- 比賽壓力

單次完成活動，

不代表：

能承受完整賽季。

---

# Recovery Progress

Recovery Progress

不應只用單一百分比表示。

至少可拆成：

- Tissue Healing
- Symptom Control
- Range of Motion
- Strength Recovery
- Motor Control
- Load Tolerance
- Confidence
- Functional Readiness

例如：

```text
Tissue Healing：90%

Pain：幾乎消失

Strength：80%

Load Tolerance：55%

Functional Readiness：不足
```

此時角色可能感覺：

已經好了。

但實際上：

尚未具備完整比賽承受能力。

---

# Recovery Timeline

Expected Recovery Time

只應是：

估計範圍。

例如：

```text
Expected Recovery:
6–10 weeks
```

它不應是：

固定倒數。

實際恢復時間可能受到：

- Damage
- Treatment
- Rehabilitation
- Organization Resources
- Adherence
- Complication
- Reinjury
- Random Variation

影響。

---

# Recovery Plateau

Recovery Plateau

代表：

恢復暫時停滯。

可能原因：

- 治療方案不適合
- 負荷增加過快
- 動作問題未修正
- 心理恐懼
- 慢性組織改變
- 診斷不完整
- 復健資源不足

Plateau

可能觸發：

- Reassessment
- New Diagnosis
- Treatment Revision
- Specialist Consultation
- Player Decision

---

# Medical Restriction

Medical Restriction

代表：

醫療系統目前禁止或限制的活動。

例如：

- 禁止投球
- 投球上限 30 球
- 禁止連續出賽
- 禁止滑壘
- 限制全力跑動
- 只能進行非對抗訓練

Restriction

不同於：

Functional Limitation。

Functional Limitation：

身體目前做不到什麼。

Medical Restriction：

即使做得到，

目前也不應該做什麼。

---

# Medical Clearance

Medical Clearance

代表：

醫療系統正式允許角色恢復某種活動。

Clearance

應依活動分級。

例如：

- Cleared for Daily Activity
- Cleared for Rehabilitation
- Cleared for Individual Training
- Cleared for Team Training
- Cleared for Limited Competition
- Fully Cleared

不能只用：

```text
Cleared = true
```

因為：

可以開始訓練

不等於：

可以正式比賽。

可以比賽

也不等於：

已恢復原有表現。

---

# Return to Activity

Return to Activity

代表：

角色重新開始執行某種活動。

例如：

- 恢復走路
- 恢復重量訓練
- 恢復傳接球
- 恢復牛棚
- 恢復打擊
- 恢復團隊訓練

Return to Activity

應依：

負荷層級

逐步推進。

---

# Return to Training

Return to Training

代表：

角色重新參加正式訓練。

它不代表：

角色已可以承受比賽。

此階段仍可能具有：

- 訓練量限制
- 動作限制
- 位置限制
- 恢復日要求
- 醫療監控

---

# Return to Play

Return to Play

代表：

角色重新參加比賽。

Return to Play

應綜合考慮：

- Medical Clearance
- Functional Readiness
- Load Tolerance
- Reinjury Risk
- Organization Need
- Player Decision
- Match Context

Return to Play

不是純醫療結果。

它同時涉及：

Organization

與

Decision。

Injury System

提供：

醫療條件與風險。

---

# Return to Performance

Return to Performance

代表：

角色不只重新出賽，

而且恢復接近傷前的競技能力。

```text
Return to Activity
≠
Return to Training
≠
Return to Play
≠
Return to Performance
```

例如：

球員已重新登板。

但仍可能存在：

- 球速下降
- 控球不穩
- 動作保護
- 出賽間隔限制
- 心理不信任身體
- 耐力不足

Performance

由：

Match、

Current State、

Progression

共同決定。

Injury

只提供：

仍存在的功能限制與風險。

---

# Recovery Outcome

傷病最終結果可能包括：

- Full Recovery
- Functional Recovery
- Partial Recovery
- Chronic Condition
- Permanent Limitation
- Recurrent Injury
- Compensatory Adaptation
- Career Modification
- Career Ending

---

## Full Recovery

組織癒合、

功能、

負荷耐受性

恢復至接近傷前狀態。

但 Injury History

仍應保留。

---

## Functional Recovery

傷病未完全回復原始狀態，

但角色能正常完成：

目前職位與活動。

例如：

活動度略有下降，

但不影響比賽。

---

## Partial Recovery

角色可以恢復部分活動，

但仍存在：

明顯限制。

例如：

只能擔任指定打擊，

或無法再擔任先發投手。

---

## Chronic Condition

傷病轉為長期存在的身體問題。

需要：

- 持續管理
- 定期休息
- 特定訓練
- 負荷限制
- 藥物或治療
- 動作調整

Chronic

不代表：

永久無法比賽。

它代表：

傷病不再是一次性事件。

---

## Permanent Limitation

傷病留下不可完全逆轉的功能限制。

例如：

- 肩部活動度永久下降
- 神經功能缺損
- 關節穩定性不足
- 爆發力下降
- 無法承受高頻率出賽

Permanent Limitation

可能進一步影響：

Progression、

Career、

Identity、

Narrative。

---

# Injury History

Injury History

不是單純的受傷清單。

它應保存：

- Injury Type
- Body Part
- Severity
- Treatment
- Recovery Outcome
- Time Lost
- Recurrence
- Permanent Limitation
- Previous Clearance
- Related Compensatory Injury

History

會影響：

- Baseline Risk
- Reinjury Risk
- Organization Evaluation
- Medical Decision
- Career Opportunity
- Player Decision
- Narrative

---

# Injury Relationship Graph

不同 Injury

之間可能具有關聯。

```text
Original Injury
        │
        ├── Recurrence
        ├── Chronic Progression
        ├── Treatment Complication
        └── Compensatory Injury
```

例如：

```text
右肩傷

↓

改變投球動作

↓

手肘負荷增加

↓

右手肘傷
```

系統應保留：

這些因果鏈。

而不是把每筆傷病視為：

完全獨立的隨機事件。

---

# Injury State

每一筆 Injury

可以具有以下主要狀態：

- Hidden
- Suspected
- Diagnosed
- Under Treatment
- Rehabilitation
- Return to Training
- Return to Play
- Monitoring
- Recovered
- Chronic
- Recurrent
- Closed

---

## Hidden

存在實際 Damage，

但尚未被察覺。

---

## Suspected

已發現症狀或異常，

但尚未確診。

---

## Diagnosed

已有正式診斷。

---

## Under Treatment

正在接受主要治療。

---

## Rehabilitation

正在恢復功能與負荷能力。

---

## Return to Training

已恢復訓練，

仍受限制。

---

## Return to Play

已恢復比賽，

仍可能處於監控。

---

## Monitoring

症狀穩定或已消失，

但仍需追蹤。

---

## Recovered

目前不再限制活動，

恢復流程完成。

---

## Chronic

傷病成為長期管理問題。

---

## Recurrent

同一傷病再次出現或惡化。

---

## Closed

傷病紀錄不再更新，

但歷史永久保留。

---

# Core Lifecycle Data

每一筆傷病的生命週期資料，

至少應包含：

```text
Exposure History

Tissue Load History

Risk Changes

Damage Progression

Symptom Timeline

Detection Source

Diagnosis Timeline

Diagnosis Confidence

Treatment History

Treatment Adherence

Rehabilitation Phase

Recovery Metrics

Medical Restrictions

Clearance History

Return to Activity Timeline

Return to Play Date

Recovery Outcome

Recurrence Record

Related Injury Links
```

Injury System

必須保存：

傷病如何從形成，

一路發展到最終結果。

不能只保存：

目前剩餘幾天。

# Data Flow

Injury System 與其他 System 的資料流如下：

```text
Match / Training / Event / Daily Activity
                │
                ▼
             Exposure
                │
                ▼
           Tissue Load
                │
        Current State
        Progression
        Injury History
                │
                ▼
          Damage Evaluation
                │
                ▼
       Injury State Creation
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
   Symptoms   Risk   Functional Limitation
       │        │        │
       └────────┼────────┘
                ▼
            Detection
                │
                ▼
      Diagnosis / Treatment
                │
                ▼
         Rehabilitation
                │
                ▼
        Medical Clearance
                │
                ▼
 Organization / Decision / Match
                │
                ▼
        Recovery Outcome
```

Injury System

主要接收：

- Activity Exposure
- Match Incident
- Training Load
- Current State
- Physical Capacity
- Previous Injury
- Medical Context
- Treatment Action

並輸出：

- Injury State
- Symptoms
- Functional Limitations
- Medical Restrictions
- Reinjury Risk
- Recovery Readiness
- Clearance Status
- Long-Term Consequence

Injury System

不直接輸出：

- 玩家是否出賽
- 玩家是否接受治療
- 教練是否相信球員
- 組織是否願意支付醫療費
- 比賽最終表現
- 傷病對人生的意義

這些結果，

分別交由：

Decision、

Coach、

Organization、

Match、

Narrative

處理。

---

# Injury Update Flow

每一筆 Injury

應依以下流程更新：

```text
Injury Trigger

↓

Collect New Exposure

↓

Update Tissue Load

↓

Evaluate Damage Change

↓

Update Symptoms

↓

Update Functional Limitation

↓

Update Detection and Diagnosis

↓

Apply Treatment and Rehabilitation

↓

Evaluate Recovery Metrics

↓

Update Risk and Clearance

↓

Generate System Outputs

↓

Record Injury History
```

Injury Update

不應只在：

傷病正式發生時執行。

Hidden Injury、

Chronic Injury、

Rehabilitation、

Return to Play

階段，

都需要持續更新。

---

# Injury Trigger

Injury Trigger

代表：

哪些變化會要求 Injury System

重新評估角色的身體狀態。

---

## Activity Trigger

角色完成某種身體活動。

例如：

- 投球
- 揮棒
- 跑壘
- 守備移動
- 重量訓練
- 復健訓練
- 長途旅行
- 日常勞動

Activity Trigger

提供：

- Activity Type
- Intensity
- Volume
- Duration
- Frequency
- Body Region Used

Injury System

再依角色條件，

轉換成：

Tissue Load。

---

## Match Trigger

比賽中發生高風險動作或事故。

例如：

- 全力投球
- 滑壘碰撞
- 撲接落地
- 被球擊中
- 急停變向
- 長局數蹲捕
- 動作突然失衡

Match Trigger

不代表：

必然受傷。

它只建立：

Exposure

或

Acute Incident。

---

## Training Trigger

訓練負荷產生變化。

例如：

- 投球量增加
- 重量提高
- 改變動作
- 新增訓練項目
- 連續高強度訓練
- 恢復訓練
- 復健進階

Training Trigger

可能：

提高風險，

也可能：

提高 Load Capacity。

真正效果，

取決於：

強度、

恢復、

Progression、

Current State、

既往傷病。

---

## Current State Trigger

角色的即時狀態發生變化。

例如：

- 疲勞增加
- 睡眠不足
- 壓力升高
- 肌肉僵硬
- 恢復不良
- 身體節奏失衡

Current State

不直接建立：

正式傷病。

但它可能降低：

Load Capacity，

提高：

Damage Risk。

---

## Symptom Trigger

症狀出現或發生變化。

例如：

- 疼痛突然加重
- 腫脹
- 麻木
- 無力
- 活動度下降
- 動作異常
- 球速下降
- 控球明顯惡化

Symptom Trigger

可能觸發：

- Self Detection
- Coach Observation
- Medical Evaluation
- Organization Restriction
- Player Decision

---

## Medical Trigger

醫療程序產生新資訊。

例如：

- 初步檢查
- 影像檢查
- 第二意見
- 診斷修正
- 手術
- 回診
- 功能測試
- Medical Clearance

Medical Trigger

可以更新：

- Diagnosis
- Diagnosis Confidence
- Treatment Plan
- Medical Restriction
- Recovery Estimate

但不應任意修改：

Actual Damage。

醫療資訊改變的是：

已知狀況。

治療與時間，

才會改變：

實際傷病狀態。

---

## Treatment Trigger

角色完成或中斷治療。

例如：

- 休息
- 服藥
- 物理治療
- 注射
- 手術
- 復健訓練
- 未遵守限制
- 提前停止治療

Treatment Trigger

會影響：

- Tissue Healing
- Symptoms
- Recovery Metrics
- Complication Risk
- Reinjury Risk

---

## Return Trigger

角色嘗試恢復活動。

例如：

- 恢復傳球
- 進入牛棚
- 參加團隊訓練
- 實戰登板
- 連續出賽
- 恢復原守位

Return Trigger

應進行：

- Functional Readiness Check
- Load Tolerance Check
- Medical Restriction Check
- Reinjury Risk Evaluation

Return Trigger

不是：

自動恢復成功。

---

## Time Trigger

時間經過。

例如：

- 一日
- 一週
- 一個復健週期
- 一個球季
- 多年後追蹤

Time Trigger

會影響：

- Healing
- Chronic Progression
- Symptom Change
- Risk Decay
- Deconditioning
- Permanent Adaptation

時間本身，

不保證恢復。

只有在：

治療、

休息、

負荷管理、

身體反應

適當時，

時間才可能帶來改善。

---

# Injury Evaluation

Injury Evaluation

代表：

系統如何根據新資料，

重新判斷傷病狀態。

它至少包含：

```text
Damage Evaluation

Symptom Evaluation

Function Evaluation

Risk Evaluation

Recovery Evaluation

Clearance Evaluation
```

---

## Damage Evaluation

Damage Evaluation

回答：

> 實際組織損傷是否增加、穩定或修復？

可能結果：

- Worsening
- Stable
- Healing
- Repaired
- Degenerative
- Reinjured

Damage

應受到：

- Tissue Load
- Treatment
- Healing Capacity
- Time
- Previous Injury
- Complication

影響。

---

## Symptom Evaluation

Symptom Evaluation

回答：

> 角色目前表現出哪些症狀？

症狀可能與 Damage

不同步。

例如：

止痛藥可能降低疼痛。

但實際損傷仍未改善。

因此：

```text
Symptom Relief
≠
Damage Recovery
```

---

## Function Evaluation

Function Evaluation

回答：

> 角色目前能完成哪些動作？

Function

應依活動分類。

例如：

```text
Daily Walking：Available

Light Running：Available

Full Sprint：Restricted

Pitching：Unavailable
```

不能只保存：

```text
Function = 70
```

因為不同活動，

對身體要求不同。

---

## Risk Evaluation

Risk Evaluation

回答：

> 若角色現在進行特定活動，傷病或復發風險有多高？

Risk

至少需要考慮：

- Current Damage
- Recovery Phase
- Load Tolerance
- Previous Injury
- Current State
- Planned Activity
- Medical Restriction
- Compensation Pattern

---

## Recovery Evaluation

Recovery Evaluation

回答：

> 目前恢復到什麼程度？

應分別檢查：

- Tissue Healing
- Symptoms
- Mobility
- Strength
- Motor Control
- Load Tolerance
- Functional Readiness

不能只因：

時間到期

自動通過。

---

## Clearance Evaluation

Clearance Evaluation

回答：

> 醫療上是否允許角色進行某項活動？

它應根據：

- Medical Standard
- Functional Test
- Recovery Metrics
- Risk Threshold
- Diagnosis
- Organization Policy

產生：

Medical Recommendation。

正式是否出賽，

仍交由：

Organization

與

Decision。

---

# Injury Output

Injury System

對其他系統提供的主要輸出如下。

---

## Injury State Output

提供：

- Injury Type
- Body Region
- Severity
- Current Status
- Known Diagnosis
- Diagnosis Confidence
- Recovery Phase

此輸出描述：

傷病目前是什麼。

---

## Symptom Output

提供：

- Pain
- Stiffness
- Weakness
- Numbness
- Swelling
- Instability
- Movement Abnormality

Current State

可以使用這些資料，

形成角色當日感受。

---

## Functional Limitation Output

提供：

角色目前無法或受限的活動。

例如：

- Throwing Intensity Limit
- Running Speed Limit
- Repetition Limit
- Range of Motion Limit
- Contact Restriction
- Recovery Interval Requirement

Match

與

Training

使用這些資料，

限制可執行動作。

---

## Risk Output

提供：

- Injury Risk
- Reinjury Risk
- Compensatory Risk
- Chronic Risk
- Career Threat Level

Risk Output

不是：

未來結果。

它只是：

風險資訊。

---

## Medical Output

提供：

- Diagnosis
- Treatment Recommendation
- Medical Restriction
- Recovery Estimate
- Clearance Level
- Required Monitoring

Organization、

Decision、

Coach

可以根據這些資訊做出反應。

---

## Recovery Output

提供：

- Rehabilitation Phase
- Recovery Metrics
- Return Readiness
- Load Tolerance
- Recovery Plateau
- Expected Next Step

---

## Long-Term Consequence Output

提供：

- Permanent Limitation
- Chronic Condition
- Position Restriction
- Workload Restriction
- Increased Future Risk
- Required Ongoing Management

Progression

與

Career

可以使用這些資料，

調整角色未來發展條件。

---

# Relationship with Other Systems

---

## Player System

Player

持有：

角色當前有哪些 Active Injury ID。

Injury System

持有：

每一筆傷病的完整資料。

Player

不應複製保存：

診斷、

復健、

風險、

限制。

---

## Progression System

Progression

提供：

- Physical Capacity
- Movement Skill
- Adaptation
- Training History

Injury

使用這些資料，

評估 Load Capacity。

Injury

輸出：

- Training Restriction
- Permanent Limitation
- Reduced Load Tolerance

Progression

再決定：

角色目前能否繼續訓練與成長。

Injury

不直接扣除：

所有永久能力。

若傷病造成長期適應改變，

應由：

Progression

更新角色能力結構。

---

## Current State System

Injury

提供：

- Pain
- Physical Limitation
- Recovery Burden
- Medication Effect
- Rehabilitation Fatigue

Current State

將這些因素整合成：

今日 Readiness。

Current State

不應修改：

傷病結構。

例如：

今天感覺很好，

不代表：

韌帶已完全癒合。

---

## Match System

Match

提供：

- Match Exposure
- Collision
- Pitch Count
- Movement Load
- Acute Incident

Injury

評估：

是否形成損傷。

Injury

再向 Match 提供：

- Functional Restriction
- Pain Response
- Risk
- Activity Limit

Match

負責：

角色在限制下如何表現。

---

## Event System

Event

記錄：

- 受傷瞬間
- 症狀被發現
- 確診
- 手術
- 復出
- 再受傷

Injury

保存：

事件之間持續存在的身體狀態。

Event

可以觸發 Injury 更新。

但不能取代：

Injury Lifecycle。

---

## Decision System

Injury

提供：

- Known Information
- Uncertainty
- Risk
- Treatment Options
- Medical Recommendation
- Expected Cost
- Recovery Estimate

Decision

保存：

角色為何選擇：

- 隱瞞
- 檢查
- 手術
- 保守治療
- 提前復出
- 改變守位
- 放棄球季

Injury

不保存：

選擇動機。

---

## Organization System

Organization

提供：

- Medical Resources
- Insurance
- Treatment Budget
- Return-to-Play Policy
- Workload Policy
- Roster Pressure
- Contract Context

Injury

提供：

- Medical Status
- Restriction
- Recovery Needs
- Risk

Organization

再決定：

- 是否安排檢查
- 是否提供資源
- 是否下放
- 是否列入傷兵名單
- 是否允許出賽
- 是否續約

Organization 的決策

不應改寫：

Actual Damage。

它只能改變：

治療與活動條件。

---

## Coach System

Coach

提供：

- Observation
- Workload Decision
- Training Plan
- Role Expectation

Injury

提供：

- Medical Restriction
- Functional Limitation
- Risk Warning

Coach

可能：

遵守、

質疑、

忽略、

或錯誤解讀醫療資訊。

Coach Observation

可以提高：

Detection Probability。

但不能直接建立：

Confirmed Diagnosis。

---

## Relationship System

傷病過程可能產生：

- 信任
- 依賴
- 怨恨
- 支持
- 背叛感
- 感激

Relationship

保存：

角色之間因此發生的長期改變。

Injury

不保存：

人際意義。

---

## Career System

Injury

提供：

- Time Loss
- Availability
- Position Limitation
- Career Threat
- Recovery Estimate
- Permanent Restriction

Career

決定：

- 暫停生涯
- 延後升學
- 錯過選秀
- 更換道路
- 轉換位置
- 退休

Injury

不直接修改：

Career Stage。

---

## Narrative System

Injury

提供：

客觀身體歷程。

Narrative

保存：

角色如何理解：

- 受傷
- 復健
- 身體退化
- 失去位置
- 重返球場
- 接受限制

相同傷病結果，

可能產生完全不同的 Narrative。

---

## World Simulation System

World

提供：

- 醫療技術水平
- 運動科學環境
- 法律與保險制度
- 社會傷病文化
- 時代醫療標準

Injury

依這些條件，

決定：

可使用的檢查、

治療與醫療資訊。

---

## Save System

Save

必須保存：

- Active Injuries
- Hidden Injuries
- Injury History
- Diagnosis History
- Treatment History
- Rehabilitation State
- Medical Restrictions
- Clearance History
- Related Injury Links
- Long-Term Consequences

Injury

不負責：

序列化與版本遷移。

---

## UI System

UI

可以呈現：

角色目前知道的傷病資訊。

UI

不應自動揭露：

Actual Damage。

例如：

Hidden Injury

不應直接顯示：

「韌帶已有 15% 損傷」。

玩家只能看到：

- 疼痛
- 疲勞
- 球速下降
- 教練觀察
- 醫療診斷
- 檢查結果

UI 必須尊重：

Known Diagnosis

與

Diagnosis Confidence。

---

# Architecture Rules

Injury System 必須遵守以下規則。

---

## Rule 01

Injury 必須是獨立實體。

不能只用：

```text
injured = true
```

每一筆傷病都必須具有：

位置、

類型、

狀態、

限制、

恢復與歷史。

---

## Rule 02

Actual Damage

與

Known Diagnosis

必須分離。

角色與組織可能：

不知道、

誤判、

低估、

或高估傷病。

---

## Rule 03

Symptoms

不等於：

Damage。

疼痛降低，

不代表損傷完全恢復。

疼痛強烈，

也不代表一定是嚴重損傷。

---

## Rule 04

Functional Limitation

必須針對具體活動。

傷病不應直接：

全面降低所有能力。

應限制：

特定動作、

強度、

次數、

持續時間。

---

## Rule 05

Injury Risk

不是命運。

高風險不代表：

必然受傷。

低風險也不代表：

絕對安全。

傷病結果應保留：

不確定性。

---

## Rule 06

受傷不能只來自隨機事件。

傷病應能追溯至：

- Exposure
- Tissue Load
- Vulnerability
- Recovery
- Previous Injury
- Random Variation

隨機性只能是：

其中一部分。

---

## Rule 07

時間不等於治療。

等待若沒有：

休息、

治療、

復健、

負荷管理，

傷病可能：

不變、

惡化、

或轉為慢性。

---

## Rule 08

Medical Clearance

必須分級。

```text
恢復日常活動
≠
恢復訓練
≠
恢復比賽
≠
恢復完整負荷
```

---

## Rule 09

Medical Clearance

不等於：

完全恢復。

角色可能已經可以出賽，

但仍存在：

- 表現下降
- 負荷限制
- 復發風險
- 動作保護
- 恢復不足

---

## Rule 10

Injury 不直接決定是否出賽。

Injury

提供：

限制與風險。

Organization

提供：

正式安排。

Decision

提供：

角色回應。

Match

處理：

實際出賽。

---

## Rule 11

Organization 不得任意改寫醫療事實。

球隊可以：

要求出賽、

拒絕資源、

改變角色定位。

但不能讓：

未癒合的組織

因組織需求而自動痊癒。

---

## Rule 12

Coach Observation

不得等於：

Medical Diagnosis。

教練可以：

察覺異常。

但正式診斷，

必須來自：

醫療流程。

---

## Rule 13

Rehabilitation

必須恢復功能，

而不只是降低疼痛。

完整復健應包含：

活動度、

力量、

控制、

專項動作、

負荷耐受。

---

## Rule 14

Return to Play

與

Return to Performance

必須分離。

重新上場，

不代表：

已回到傷前水準。

---

## Rule 15

Injury History

必須永久保留。

即使傷病狀態為：

Recovered

或

Closed，

仍可能影響：

- Future Risk
- Medical Evaluation
- Organization Evaluation
- Career
- Narrative

---

## Rule 16

舊傷可能形成新的傷病條件。

系統必須支援：

- Recurrence
- Chronic Progression
- Compensatory Injury
- Treatment Complication

而不是將每次受傷視為：

完全獨立事件。

---

## Rule 17

傷病嚴重度不能只以缺席天數判定。

Severity

應考慮：

- Tissue Damage
- Functional Limitation
- Treatment Requirement
- Reinjury Risk
- Long-Term Consequence
- Career Threat

---

## Rule 18

Injury 不直接產生敘事意義。

傷病是：

身體事實。

它成為：

挫折、

轉折、

重生、

遺憾、

或解脫，

由：

Narrative

決定。

---

## Rule 19

傷病資訊必須遵守資訊可見性。

UI、

Player、

Coach、

Organization

只能取得：

其合理知道的資訊。

Hidden Injury

與

Actual Damage

不應被全知式揭露。

---

## Rule 20

傷病必須允許不完全恢復。

合理結果可以是：

- Full Recovery
- Functional Recovery
- Partial Recovery
- Chronic Condition
- Permanent Limitation
- Career Modification

系統不應預設：

所有傷病最終都能完全恢復。

# Extension Guidelines

新增 Injury 功能前，

必須先確認：

這項內容是否真的屬於：

傷病本身。

Injury System

只管理：

身體損傷、

醫療資訊、

功能限制、

治療、

復健、

恢復、

風險

與長期後果。

---

## Question 01

新增的是：

身體損傷，

還是：

短期狀態？

若只是：

- 疲勞
- 睡眠不足
- 肌肉緊繃
- 精神壓力
- 當日節奏不佳

應放入：

Current State System。

若已形成：

可識別的組織損傷或疾病狀態，

才進入：

Injury System。

---

## Question 02

新增的是：

能力退化，

還是：

功能限制？

Injury

保存：

傷病目前限制了哪些活動。

例如：

右肩無法承受高強度長傳。

Progression

保存：

角色長期能力是否因此下降或重建。

不能在 Injury 中直接寫：

```text
Throwing Ability -20
```

應先產生：

```text
Throwing Intensity Limit

Throwing Volume Limit

Recovery Interval Requirement
```

再由：

Match、

Training、

Progression

使用。

---

## Question 03

新增的是：

醫療事實，

還是：

醫療判斷？

Actual Damage

屬於：

Injury。

醫師目前的診斷，

屬於：

Known Diagnosis。

醫療團隊的建議，

屬於：

Medical Recommendation。

三者必須分離。

---

## Question 04

新增的是：

傷病結果，

還是：

玩家選擇？

例如：

- 是否接受手術
- 是否隱瞞疼痛
- 是否提前復出
- 是否尋求第二意見

這些屬於：

Decision System。

Injury

只保存：

選擇後實際採取的處置，

以及身體如何回應。

---

## Question 05

新增的是：

醫療資源，

還是：

傷病本身？

例如：

- 是否有 MRI
- 是否有專職防護員
- 是否能負擔手術
- 是否有完整復健設備

屬於：

Organization System。

Injury

使用這些條件，

決定：

可獲得的診斷與治療路徑。

---

## Question 06

新增的是：

教練觀察，

還是：

正式診斷？

教練看到：

動作變形、

球速下降、

表情異常，

應建立：

Observation

或

Suspected Injury。

不能直接建立：

Confirmed Diagnosis。

---

## Question 07

新增的是：

出賽資格，

還是：

醫療許可？

Medical Clearance

屬於：

Injury。

正式登錄、

先發安排、

傷兵名單、

下放或升上一軍，

屬於：

Organization。

真正是否出賽，

由：

Decision

與

Match

共同完成。

---

## Question 08

新增的是：

傷病歷程，

還是：

人生意義？

傷病造成：

身體限制。

Narrative

處理：

玩家如何理解：

失去位置、

復健、

復出、

轉型、

退役。

---

## Question 09

新增的是：

單一傷病，

還是：

整體健康？

若未來遊戲擴充至：

- 長期疾病
- 睡眠障礙
- 營養狀態
- 免疫系統
- 心肺健康
- 一般身體健康管理

應評估建立：

Health System。

不能無限制將所有健康問題，

全部塞入 Injury。

---

## Question 10

新增的風險是否可追溯？

任何 Injury Risk

都應能追溯至：

- Exposure
- Tissue Load
- Load Capacity
- Previous Injury
- Current State
- Movement Pattern
- Recovery
- Random Variation

不能只因為：

劇情需要，

突然讓角色受傷。

---

# Injury Template

新增一種傷病時，

至少應定義：

```text
Injury Type

Body Region

Body Structure

Common Causes

Typical Onset

Exposure Profile

Damage Pattern

Symptom Profile

Functional Limitations

Severity Range

Diagnostic Methods

Treatment Options

Rehabilitation Requirements

Expected Recovery Range

Reinjury Factors

Chronic Risk

Possible Permanent Limitations

Return-to-Activity Criteria
```

這份 Template

描述的是：

傷病規則。

不是：

某一位角色的實際傷病紀錄。

---

# Body Region Extension

Body Region

應使用可擴充的分層結構。

例如：

```text
Upper Limb
└── Shoulder
    ├── Joint
    ├── Rotator Cuff
    ├── Labrum
    └── Scapular Structure
```

或：

```text
Upper Limb
└── Elbow
    ├── UCL
    ├── Flexor Tendon
    ├── Extensor Tendon
    ├── Ulnar Nerve
    └── Bone / Joint
```

Body Region

不應只使用：

```text
Arm
Leg
Back
```

因為不同結構，

會造成完全不同的：

症狀、

限制、

治療、

復健

與再受傷風險。

但原型階段，

可以先採用較粗粒度資料，

再逐步細化。

---

# Injury Granularity

傷病資料粒度，

應依遊戲需求決定。

---

## Low Granularity

例如：

```text
Shoulder Injury
Moderate
Out 4–8 Weeks
```

優點：

- 容易製作
- 容易理解
- 事件成本低

缺點：

- 難以區分傷病差異
- 復健內容較單一
- 長期後果較模糊

---

## Medium Granularity

例如：

```text
Right Shoulder
Rotator Cuff Overuse
Moderate
Throwing Restricted
```

適合：

目前《棒球人生》的核心需求。

可以支援：

- 具體功能限制
- 不同治療路徑
- 復發風險
- 職涯影響
- 玩家理解

同時不必進入：

過度醫療模擬。

---

## High Granularity

例如：

明確區分：

- 肌腱位置
- 撕裂比例
- 關節角度
- 肌力測試
- 動作鏈缺陷
- 醫療影像資料

適合：

專業醫療模擬。

但可能造成：

資訊負荷過高，

也會提高：

內容製作與平衡成本。

---

## Recommended Granularity

《棒球人生》

應採用：

中等粒度。

也就是：

玩家看到的是：

- 身體部位
- 傷病類型
- 嚴重程度
- 功能限制
- 大致恢復期
- 主要風險
- 治療選項

底層則保留：

較細的 Damage、

Load、

Recovery

與 Risk 模型。

這符合目前產品原則：

```text
底層保持真實

中層提供可理解的因果

表層避免醫療知識門檻
```

---

# Information Visibility

不同角色可取得的 Injury 資訊不同。

---

## Player Knowledge

玩家角色可能知道：

- 自己感受到的症狀
- 已收到的診斷
- 醫療建議
- 已知風險
- 已知恢復進度

但不一定知道：

Actual Damage 的完整真相。

---

## Coach Knowledge

教練可能知道：

- 出賽限制
- 醫療許可
- 表現異常
- 組織提供的醫療報告
- 球員是否回報不適

但不一定知道：

所有隱私醫療細節。

---

## Organization Knowledge

Organization

可能知道：

- 正式診斷
- 預估缺席時間
- 出賽限制
- 治療成本
- 合約與名單影響

但資訊完整度

應受到：

世界制度、

醫療隱私、

組織權限

限制。

---

## UI Knowledge Rule

UI

只能呈現：

玩家合理取得的資訊。

不得直接顯示：

- 隱藏傷病名稱
- 精確損傷比例
- 尚未發現的再受傷機制
- 未確診的真實病理

除非 UI 是：

開發者除錯模式。

---

# Difficulty and Accessibility

Injury System

需要同時服務三類玩家：

- 沒有棒球與醫療背景的玩家
- 喜歡棒球但不研究運動醫學的玩家
- 熟悉棒球傷病與負荷管理的玩家

因此不應要求：

所有玩家都理解完整醫學模型。

---

## Surface Layer

一般玩家看到：

- 哪裡痛
- 目前能不能打
- 醫生怎麼說
- 有哪些選擇
- 風險大概多高

---

## Interpretation Layer

進階玩家可以理解：

- 症狀與損傷不一定同步
- 提前復出會增加風險
- 不同醫療資源影響恢復
- 負荷與休息需要平衡

---

## Simulation Layer

底層系統處理：

- Tissue Load
- Load Capacity
- Healing
- Compensation
- Reinjury
- Chronic Progression

玩家不需要直接看到：

所有計算數值。

---

# Common Mistakes

---

## Mistake 01

將傷病設計成固定倒數。

例如：

```text
受傷 30 天

30 天後完全康復
```

錯誤。

傷病恢復應受到：

治療、

復健、

負荷、

資源、

依從性、

個體差異

影響。

---

## Mistake 02

把疲勞當成傷病。

疲勞通常屬於：

Current State。

只有當負荷造成實際 Damage，

才形成 Injury。

---

## Mistake 03

把疼痛當成傷病嚴重度。

疼痛只是：

Symptoms。

它不等於：

Damage Severity。

---

## Mistake 04

症狀消失就判定痊癒。

錯誤。

症狀可能因：

休息、

止痛、

活動降低

而暫時減輕。

但組織損傷、

功能缺陷

與負荷耐受，

可能尚未恢復。

---

## Mistake 05

所有傷病直接扣能力。

錯誤。

傷病首先應產生：

功能限制。

例如：

- 投球強度下降
- 無法連續出賽
- 跑動受限
- 特定方向移動困難

而不是：

所有數值一起下降。

---

## Mistake 06

醫療診斷永遠正確。

錯誤。

診斷可能：

不完整、

修正、

延遲、

或錯誤。

Actual Damage

必須與：

Known Diagnosis

分開。

---

## Mistake 07

教練可以直接判斷醫療結果。

錯誤。

教練可以：

觀察、

懷疑、

調整負荷。

但不能直接完成：

正式醫療診斷。

---

## Mistake 08

球隊需求能改變傷病事實。

錯誤。

球隊可以：

要求提前復出。

但不能讓：

未完成恢復的身體

自動變健康。

---

## Mistake 09

Return to Play 等於完全康復。

錯誤。

角色可以：

重新出賽，

但仍有：

限制、

風險、

表現落差、

負荷問題。

---

## Mistake 10

傷病只影響缺席時間。

錯誤。

傷病可能影響：

- 角色定位
- 訓練路徑
- 生涯機會
- 組織評價
- 合約
- 動作方式
- 長期風險
- 身份認同

---

## Mistake 11

每次傷病都是獨立事件。

錯誤。

舊傷可能造成：

- 復發
- 慢性化
- 代償
- 新傷
- 治療併發問題

系統必須保留：

傷病關係。

---

## Mistake 12

傷病只是隨機懲罰。

錯誤。

傷病應具有：

可理解的風險來源。

玩家不一定能完全避免，

但應能理解：

為什麼風險上升。

---

## Mistake 13

完全消除隨機性。

錯誤。

即使：

訓練合理、

休息充足、

醫療完善，

運動仍存在：

意外與個體差異。

系統應保留：

不可完全控制的部分。

---

## Mistake 14

把所有醫療流程做成選單題。

錯誤。

傷病不應只在：

「手術／不手術」

時出現。

它應在：

負荷、

症狀、

隱瞞、

檢查、

復健、

回歸、

長期管理

中持續存在。

---

## Mistake 15

用醫學術語取代遊戲理解。

錯誤。

底層可以精確。

但 UI 與事件文案

必須讓非專業玩家理解：

- 身體出了什麼問題
- 現在限制什麼
- 不處理可能發生什麼
- 每個選擇的代價是什麼

---

## Mistake 16

所有正確選擇都有最好結果。

錯誤。

即使接受合理治療，

玩家仍可能：

錯過選秀、

失去位置、

錯過球季、

能力未完全恢復。

醫療上較安全的選擇，

不一定是：

職涯上沒有代價的選擇。

---

## Mistake 17

所有冒險都必然受到懲罰。

錯誤。

提前出賽可能：

沒有立即惡化，

甚至帶來：

重要機會。

但這不代表：

風險不存在。

系統應呈現：

風險與後果，

而不是道德審判。

---

## Mistake 18

傷病只服務重大劇情。

錯誤。

傷病也可以是：

- 小幅調整訓練
- 短期角色替換
- 長期負荷管理
- 對身體理解增加
- 與教練建立信任
- 改變比賽使用方式

不是每次都需要：

生涯危機。

---

## Mistake 19

忽略非投手傷病。

錯誤。

不同守位具有不同負荷：

- 捕手：膝、髖、手部、腦震盪
- 內野手：肩肘、下肢、滑壘碰撞
- 外野手：腿後肌、肩、撲接傷害
- 打者：手腕、手掌、側腹、背部
- 跑者：踝、膝、腿後肌

Injury System

不能只服務：

投手手肘。

---

## Mistake 20

傷病系統過度寫實，

卻沒有可玩的判斷。

錯誤。

真正重要的不是：

醫療細節有多少。

而是玩家能否面對：

- 要不要說
- 要不要檢查
- 要不要休息
- 要不要手術
- 要不要錯過機會
- 要不要接受新的身體限制
- 要不要改變自己的球員道路

---

# Design Philosophy

Injury System

不是：

懲罰玩家的隨機系統。

也不是：

用來強迫玩家停玩幾回合的倒數器。

它管理的是：

運動生涯中，

角色與自己身體之間的關係。

身體不是：

永遠服從意志的工具。

努力、

夢想、

責任、

機會

都可能要求角色：

繼續向前。

但身體有自己的：

負荷、

限制、

恢復速度、

歷史

與不可逆後果。

---

傷病最重要的設計價值，

不是：

讓玩家害怕受傷。

而是讓玩家理解：

```text
現在還能做
≠
現在應該做

疼痛可以忍受
≠
傷害不存在

醫療允許出賽
≠
身體已恢復原狀

選擇休息
≠
沒有付出代價

選擇上場
≠
一定是錯誤
```

玩家面對的，

不是：

正確答案。

而是：

不同時間尺度之間的拉扯。

```text
今天的機會

對上

下個月的恢復

對上

未來數年的職涯
```

---

好的 Injury System

應該讓玩家在多年後回顧生涯時，

看見的不是：

「當時被系統隨機扣了能力」。

而是：

「當時我的身體已經出現訊號，

球隊有自己的需求，

我也有不想失去的東西，

最後我做了那個選擇。」

---

傷病不應自動成為：

英雄敘事。

復出不一定代表：

勝利。

接受限制，

也不一定代表：

失敗。

有時角色真正的成長，

不是：

恢復成原來的自己。

而是：

學會用新的身體，

繼續生活與比賽。

---

# Summary

Injury System 回答的核心問題是：

> 角色的身體發生了什麼問題？

以及：

> 這個問題目前限制了什麼？

它管理：

- Exposure
- Tissue Load
- Damage
- Symptoms
- Detection
- Diagnosis
- Functional Limitation
- Treatment
- Rehabilitation
- Recovery
- Medical Restriction
- Medical Clearance
- Reinjury Risk
- Chronic Condition
- Permanent Limitation
- Injury History

它不負責：

- 玩家為何做出選擇
- 球隊如何安排角色
- 教練如何看待傷病
- 傷病造成的人際意義
- 傷病如何成為人生故事
- 比賽最終表現
- 能力如何長期重建

---

Injury System 的核心流程是：

```text
Exposure

↓

Tissue Load

↓

Damage

↓

Symptoms

↓

Detection

↓

Diagnosis

↓

Treatment

↓

Rehabilitation

↓

Return to Activity

↓

Return to Play

↓

Return to Performance

↓

Recovery / Chronic Condition / Permanent Limitation
```

---

它必須維持以下區分：

```text
Actual Damage
≠
Symptoms
≠
Known Diagnosis
≠
Medical Recommendation
≠
Organization Decision
≠
Player Decision
≠
Career Outcome
≠
Narrative Meaning
```

---

Injury System

不是用來回答：

玩家是否夠努力。

它回答的是：

在這個時間點，

這副身體真正承受了什麼。

透過這個系統，

傷病不再只是：

能力下降

或

缺席幾場比賽。

它會成為：

角色、

教練、

組織、

醫療、

職涯

與人生選擇

交會的地方。