# Match Experience → Development Foundation v1

## Architecture

正式資料流只有一個方向：

```text
Canonical Match Truth
→ Actual Exposure / Active Participation
→ Compact Match Experience Evidence
→ Per-skill Aggregation
→ Development Context（sourceType: gameExperience）
→ applyDevelopmentResult()
→ Development Progress / player.baseballSkills
```

Match Experience 不重新模擬球局、不改寫 Match Truth，也不建立第二套成長公式。`player.baseballSkills` 仍是 Current Skill 的唯一 truth；trait、current-skill difficulty、Ideal Self bias、progress threshold、cap、stable variation、provenance 與 idempotency 全部由既有 Development Foundation 處理。

核心 invariants：

- Outcome ≠ Experience ≠ Development。
- Decision Quality ≠ Execution Quality ≠ Outcome。
- Match Outcome 單獨不足以決定 Development Progress。
- 無實際參與就沒有 Direct Match Development Evidence；明確的 Exposure Evidence 除外。
- Evidence 不直接修改 skill；只有 `applyDevelopmentResult()` 可修改 Development Progress／Baseball Skill。

## Evidence Contract

每筆 compact evidence 保存：

```text
evidenceId, matchId, playId, playerId
evidenceType, activeType, participationType, role
situation
decisionEvidence, executionEvidence, outcomeEvidence
difficulty, novelty, pressure, experienceQuality
skillEvidence
attribution
sourceSnapshot
```

Evidence 只由 `simulationLog`、`completedMoments`、`performanceEvidence` 與 canonical match state 派生。若 side state 與 Match Truth 衝突，以 Match Truth 為準。

## Exposure 與 Active Evidence

Exposure 表示實際在場與情境暴露；Active Evidence 表示實際打擊、守備、決策或執行。Defensive innings 使用 centralized diminishing curve，優先形成有限的 `baseballIQ` exposure，不會僅因守備局數直接產生 catching／throwing／reaction／range active progress。PA 亦採 diminishing curve，有限地形成 batting／baseballIQ exposure。

完全未上場（0 defensive innings、0 PA、0 active participation）的 bench player 不產生 game Development Context。Starter／substitute 的差異由實際 exposure 與 evidence 決定，不使用 role label multiplier。

## Decision、Execution、Outcome 與 Attribution

Decision 支援 strong／acceptable／questionable／poor／none，`none` 是沒有 decision opportunity，不等於 poor。Execution 讀既有 read／reach／secure／transfer／release／receive／timing stage 與 strong／normal／weak／failed／notApplicable quality。Outcome 只保存 hit／out／strikeout／safe 等結果，不能覆蓋 decision 或 execution truth。

Attribution 保存 `primaryCause`、`secondaryCause`、`responsibleActor`。玩家完成正確傳球但隊友漏接時，玩家 execution evidence 不會因最終 safe 被降格；正確決策但執行失敗仍可同時形成 IQ reinforcement 與 execution corrective experience。

## Novelty、Repetition 與 Pressure

Novelty key 由 target skill、role、play family、challenge band、decision／execution component 組成，不以唯一 play ID 假裝每球都全新。相似 evidence 的第 1／2／4／7 次採逐步遞減的 deterministic modifier；新情境或不同 challenge band 可形成新的 novelty group。

Pressure 只提供 1.00–1.05 的有限 salience 調整，不是 XP 倍率。Difficulty 來自該 play 的實際 challenge、ball context 與 route／execution demand，不以 opponent tier 直接決定學習品質。

## Aggregation

Aggregator 會聚合同一 skill 的全部 exposure、routine 與 meaningful evidence，不採 top-three-plays。它依 actual relevance、聚合量、novelty、challenge、decision value、execution feedback 與有限 pressure 選出每位球員每場最多三個主要 Development Context。

## 2B Defensive Vertical

2B v1 支援 routine fielding、initiator、pivot、receiver、cover 與 meaningful route decision。映射原則：

- reaction：read／first response。
- range：reach／movement demand。
- catching：secure／receive。
- throwing：transfer／release／accuracy。
- baseballIQ：route、force state、runner priority、pivot／cover responsibility。

一球不會固定給五項高品質 evidence；實際 participation type 與可用 execution stages 決定 target。

## Generic Batter Vertical

打者 evidence 讀 PA context、玩家 decision、execution 與 PA outcome，主要映射 batting／baseballIQ。低難度、普通 execution 的 hit 不會自動成為 highValue；正確 approach、meaningful count adjustment、execution 未完成的 strikeout，仍可保留正向 batting corrective evidence 與 baseballIQ decision evidence。

## Development Bridge

每個 aggregated target 轉為既有 context：

```text
sourceType: gameExperience
sourceId / settlementId: matchId|seed|player|match-experience-development-v1|skill
targetSkill, activityType, difficulty, quality
playerChoice, developmentBias, metadata
```

Bridge 只呼叫既有 `applyDevelopmentResult()`；沒有複製 trait、difficulty、bias、progress、cap 或 variation 公式。School `trainingQuality` 與 `playingTimeOpportunity` 目前只保留為 context，未成為 multiplier。

## Deterministic Settlement、Save 與 Debug

永久 settlement 只在 canonical match 標記完成且記錄 game end 後執行。Match-level ID 與每個 skill settlement ID 都包含 match identity；rerender、Continue、重複呼叫與 save/reload 不會重套。Mid-match 不做永久 Development settlement。

Save 保存 compact evidence、exposure summary、aggregation、selected contexts、match-level settled flag／ID 與 Development settlement IDs；restore 只 normalize，不 reroll。Debug export 可查看 match ID、innings／PA、evidence 與 novelty 統計、aggregated skills、selected contexts 及 settlement IDs。一般玩家只看到簡短的「這場比賽累積了實戰經驗。」提示，未加入 Box Score 或 Game Settlement UI。

## Future Playing Time / School Bridge

未來可在獨立 Sprint 將招生／學校的 playing-time opportunity 轉成 roster opportunity generation，並將 training quality 接入明確的 school development context。不得以目前欄位直接乘上 Match Experience 或 Development 數值。

## Deferred Work / Balance Boundary

本 Foundation 明確延後 Pitcher、Catcher、SS／OF／1B／3B experience、bench observation learning、full roster opportunity simulation、School training quality、playing-time opportunity generation、Game Settlement／Box Score、confidence／morale、injury／aging、Team Strength、High School Population Balance 與 Match balance tuning。

目前的 coefficient 與 500–1000 samples audit 只驗證結構安全、diminishing、parity、provenance 與邊界，不構成 population balance 結論。
