# Player Capability Hierarchy Foundation v1.0.1

## Legacy Youth Mutation Boundary Audit

本文件是唯讀盤點，不是平衡提案。它不會重寫少年篇事件、不會把舊數值套入 Youth Event Outcome v1 validator，也不會把 legacy history 重新結算。

## Audit 範圍與計數定義

- 範圍：`chapterOneEvents`、`chapterTwoEvents`、`youthSeasonEvents`、`positionCompetitionEvents`、`juniorBaseballEvents`、`juniorSeasonEvents`，以及 `youth_match_grounder` 的整合式傳球選項。
- Legacy event：至少一個 choice 透過 `skillEffects`、`positionSkillEffects` 或整合式 youth gameplay choice 寫入棒球技能的唯一 event id。
- Mutation case：一個 choice 的 `skillEffects`，或一個 `positionSkillEffects.<position>` 分支。守位分支分開計數，因為 runtime 只會依當下守位採用其中一支。
- Universal／Specialist mutation：上述 case 內的 authored skill write 筆數，不是玩家一次遊玩必然取得的總點數。
- `> +1` case：至少有一項 authored delta 大於 +1 的 mutation case。
- Multi-skill case：同一 mutation case 寫入兩項以上技能。
- Specialist without experience：寫入 `blocking`、`gameCalling`、`control` 或 `pitchStamina`，但 choice 沒有 explicit `specialistExperienceDeltas` 的 mutation case。

## 統計摘要

| 指標 | 結果 |
|---|---:|
| Legacy youth / pre-HS event | 34 |
| Authored mutation case | 87 |
| Universal mutation write | 119 |
| Specialist mutation write | 21 |
| 含單項 `> +1` 的 case | 40 |
| 單項 `> +1` mutation write | 43 |
| Multi-skill case | 42 |
| Specialist without explicit experience case | 14 |
| Story 內正式 Youth v1 event | 0 |
| Direct Start runtime synthetic Youth v1 outcome | 4 |

## Legacy event 清單

### 少棒入門

- `chapter2_intro`
- `chapter2_day1_training`
- `chapter2_team_breath`
- `chapter2_day2_correction`
- `chapter2_batting_intro`
- `chapter2_day3_test`

### 少棒第一季

- `youth_season_intro`
- `youth_position_trial`
- `youth_teammate`
- `youth_bench`
- `youth_match_entry`
- `youth_match_grounder`
- `youth_match_outfield`
- `youth_match_catcher`
- `youth_match_pitcher`
- `youth_match_mistake`
- `youth_match_after`

### 位置競爭

- `echo_coach`
- `echo_teammate`
- `echo_rival`
- `echo_rival_respect`
- `echo_solo`
- `azhe_bond_high`
- `azhe_bond_mid`
- `azhe_bond_low`
- `competition_position_test`
- `competition_catcher_test`
- `starter_selection_test`

### 青少棒／分化

- `junior_intro`
- `junior_growth_test`
- `junior_position_change`
- `junior_azhe_cover`
- `junior_consequence`
- `junior_starting_job`

## Specialist compatibility findings

14 個 legacy mutation case 會直接寫入 specialist skill 而沒有 explicit specialist experience。來源集中在：

- `youth_position_trial`
- `youth_match_catcher`
- `youth_match_pitcher`
- `youth_match_mistake` 的捕手／投手守位分支
- `competition_position_test` 的投手守位分支
- `competition_catcher_test`

這些既有內容保留原值與原 route semantics。進入高中結算時，若 finalized legacy state 已有 specialist skill、但沒有 experience metadata，系統只補 deterministic compatibility metadata，並明確記為 `legacy-normalization`；它不表示正式因果是「skill 產生 experience」。正式 Youth v1 仍維持 `experience → specialist activation`。

## Contract boundary

- Legacy story path：`sourceType = legacy-youth-skill-effect`，且必須帶 `sourceContract = legacy-youth-narrative-v0`。
- 正式 Youth v1 path：只能由 `applyYouthEventOutcome()` 驗證及寫入，provenance 為 `youth-event-outcome-v1`。
- Unknown pre-HS path：缺少來源 metadata 時 fail loudly，不會自動取得 legacy exemption。
- Direct Start：4 個 synthetic outcomes 全走 Youth v1 helper，不使用 generic `applySkillEffects()`，也不產生 legacy provenance。

## Population audit 限制

Current Normal Narrative youth capability distribution is legacy-content contaminated and must not be used as the Youth Compressed Origin v1 population baseline.

現有 Normal Narrative 可以繼續作為 compatibility／route regression 樣本；它不能作為 Youth Compressed Origin v1 的能力分布、成長預算或平衡基準。

## Reproduction

唯讀 audit 與 guard assertions 位於 `tests/player-capability-hierarchy-foundation-v1-0-1-test.js`。測試會列出 `LEGACY_YOUTH_MUTATION_AUDIT_JSON`，並驗證 audit 執行前後的 runtime player 完全相同。
