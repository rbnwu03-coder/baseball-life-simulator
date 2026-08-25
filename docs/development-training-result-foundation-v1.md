# Development / Training Result Foundation v1

## 1. Why this layer exists

Capability Foundation 定義球員進入高中時「目前會什麼」。Development v1 則記錄進高中後的學習如何累積，並在累積跨過門檻時才改變永久棒球技能。它取代正式高中訓練事件中的固定 `skill +1`，但不回頭重寫 legacy Youth content。

## 2. Traits, Skills, and Progress

- Fundamental Traits 描述感知、理解、學習與運動底子。Development 讀取 finalized Genesis traits；`ballSense`、`observe`、`fitness` 可讀取目前合法 trait state。
- `player.baseballSkills` 仍是唯一 Current Skill truth，供 Match 與 Evaluation 消費。
- `player.developmentState.skillProgress` 只保存距離下一次永久成長的 0–99 累積，不保存第二份技能值。
- Initial Skill Formula 只生成初始技能；Development Formula 不會重新套用 Initial Skill Formula。

## 3. Development pipeline

```text
Fundamental Traits
+ Current Baseball Skill
+ Development Context
+ Player Choice
+ Ideal Self Development Bias
+ Deterministic Variation
→ Development Result
→ Skill Progress
→ threshold settlement
→ permanent Baseball Skill growth
```

每 100 progress 使目標技能提升 1，剩餘 progress 繼續保存。同次結果可跨越多個門檻。技能 20 是 hard cap；到達 cap 後 progress 歸零，不會成為 21。

## 4. Context contract

正式 context 包含：

```js
{
  sourceId,
  sourceType,       // training | event | gameExperience | coachInstruction | debug
  targetSkill,
  activityType,     // technical | physical | recognition | decision | repetition | specialist
  difficulty,       // easy | appropriate | challenging | overmatched
  quality,          // limited | standard | good | elite
  playerChoice,
  developmentBias,
  metadata
}
```

Trait weights、skill learning profiles、skill diminishing return、difficulty fit、quality modifiers 與 bias 全部集中在 `player.js` 的 Development v1 contract。Event 與 Story 不保存公式係數。

## 5. Development Bias

Ideal Self 只提供小幅學習效率傾向：強打偏打擊／臂力、技巧偏技術技能、守備偏守備技能、速度偏跑壘／範圍／反應、棒球理解偏決策技能、全能型提供廣泛小幅 bias。

Bias 不會自動增加技能，也不會禁止非偏好訓練。實際 target、activity 與 context fit 仍是主要責任。

## 6. Specialist activation

`blocking`、`gameCalling`、`control`、`pitchStamina` 的 0 代表未受訓。Specialist Development 必須同時具備：

- `activityType: "specialist"`
- `metadata.specialistEligible: true`
- 對應 catcher 或 pitcher experience

普通訓練不能讓未啟動的 specialist skill 從 0 變成 1。合法 specialist context 可以先累積 progress，跨過門檻後才正式啟動技能。

## 7. Determinism and idempotency

Variation 由 Character/Capability seed、formula version、settlement ID、source、choice 與 target skill 做 stable hash，不使用 `Math.random` 或 Match RNG。

每次 result 具有 deterministic settlement ID。已存在的 ID 回傳 duplicate，不再次增加 progress、技能或 provenance。`developmentState.history` 保存最小 audit record；Capability ledger 只在真正 level-up 時新增永久技能來源。

## 8. Persistence and legacy boundary

新角色、Direct Start 與 debug fixture 都由 `createInitialPlayer()` 取得合法 Development State。舊存檔若缺少此 state，`normalizeSave()` 會將全部 progress deterministic 初始化為 0，並保留原 Baseball Skills、Invitation Set 與 selected school。

Legacy `skillEffects` 與 Youth mutation 仍屬 legacy contract，本 Sprint 不全面遷移。兩個既有高二自主訓練事件是首批 `development-v1` production integration；其疲勞、Fundamental Trait 與 relationship effects 繼續由原流程處理。

## 9. Future bridges

以下只保留 context 接口，本版不啟用 downstream effect：

```text
Selected School.trainingQuality
→ future Training Context quality
→ Development Result

playingTimeOpportunity
→ future game exposure
→ Game Experience Development

Match Evidence
→ future gameExperience context

Coach Instruction
→ future context quality / emphasis
```

本版不會因強權學校全域提高 progress，也不會因出賽機會自動增加技能。

## 10. Deferred balance

目前係數只用於 structural validation：高 trait fit 通常較快、低技能比高技能容易成長、appropriate context 優於 poor fit、bias 有感但非 hard gate、普通單次訓練通常不 level-up。

高中三年平均成長、校級差異、elite prospect 曲線與長期數值分布，全部延後至 High School Population & Capability Balance。Skill regression、aging、完整 Training Menu、weekly schedule 也不屬於 v1。
