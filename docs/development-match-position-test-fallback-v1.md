# Development Match Position Test Fallback v1

## 1. Purpose

本功能只服務「開發測試：指定本場守位」。開發者明確指定一壘手、二壘手、游擊手或三壘手後，比賽會保留該合法守位，並在玩家相關守備技能過低時使用本場限定的能力下限，讓守備 readiness 與 execution 可被驗證。

## 2. Temporary Development Contract

這是 **TEMPORARY DEVELOPMENT CONTRACT**，不是正式生涯規則、人口平衡或成長來源。`Player Truth`、`Development Test Match Capability Override` 與 `Permanent Skill Growth` 是三個不同邊界；測試下限也不代表必定成功。

## 3. Position Override

UI 選擇經 `selectedDevelopmentTestPosition`、`pendingHighSchoolMatchPositionOverride` 傳入 `prepareHighSchoolYearOneMatch()`。Playing-Time 先以 raw canonical capability 建立本場出賽安排，再將合法的 explicit position 寫入 assignment、roster 與 `developmentPositionOverride`。explicit test position 優先於 generic infield fallback；選「不指定」時不建立能力 override，右投 generic infield 仍由既有開發期規則解析為 playable 2B。

## 4. Capability Floor

比賽物件可包含 `developmentTestCapabilityOverride`。單一 effective resolver 對該守位相關技能採用：

```text
effective = max(player.baseballSkills[skill], skillFloor[skill])
```

raw skill 不被寫入或回復。能力下限只供未結束的該場比賽之 defensive readiness / execution 使用，不改 route availability、decision quality、Playing-Time admission 或未來 evaluation。

## 5. Benchmark Source

Benchmark version：`development-playable-position-v2`。

既有 `createRepresentativeHighSchoolEntryFixture()` 的 1,000 人 deterministic HS entry 統計仍保留作為 fixture provenance，但 population mean 不再是 floor 的主要選擇依據。正式依據改為相同 very-low raw 2B fixture、seed、role 與 match context 下的 effective match behavior calibration。

最終 2B playable baseline 為 catching 9、throwing 9、reaction 8、range 8、baseballIQ 9；SS / 3B 需要的 armStrength floor 為 9。選擇規則是第一組讓 canonical Player Basic Execution 進入 65%–75% 目標帶的最低候選，而不是依最終出局結果或最高成功率選值。

這是 **Development-only testing benchmark. NOT A POPULATION BALANCE CONTRACT.** 本 audit 只驗證 development-test usability，不代表高中球員的正式成功率、守備平均或能力分布。

## 6. Position Skill Mapping

- 1B：catching、throwing、reaction、range、baseballIQ。
- 2B：catching、throwing、reaction、range、baseballIQ。
- SS：沿用 generic infield requirements，另加 armStrength。
- 3B：catching、throwing、reaction、baseballIQ、armStrength；不補 range。

1B / 2B 直接讀既有 `positionConfigs["內野手"].skills`，避免另一套平行 truth。SS / 3B 只保留本測試入口必要的 position-local 差異。不補 batting、baseRunning、blocking、gameCalling、control 或 pitchStamina。

## 7. Handedness

高中階段右投可指定 1B、2B、SS、3B；左投只可指定 1B。左投的 2B / SS / 3B 按鈕會停用，若殘留非法 pending state，Match admission 也會明確拒絕，不會默默 fallback。

## 8. Player Truth Isolation

Override 只存於 `player.highSchoolMatch`。`player.baseballSkills`、Capability Settlement、provenance、developmentState、career history 與正式 position identity 均不改變。Audit 每項技能提供 raw、floor、effective、overrideApplied、source 與 benchmarkVersion。

開發測試比賽進行中，球員概況直接讀取同一份 authoritative audit：主數字顯示 Match Engine 實際使用的 effective 值，被提高的項目附「開發測試」與原始值參考。沒有 override、未提高的技能或比賽結束後，畫面維持 canonical raw 顯示。UI 不自行重算 floor，也不顯示 benchmark metadata；save / reload 前後的顯示結果固定且不消耗 RNG / presentation cursor。

## 9. Development Isolation

Match Experience 可以照既有規則由 actual participation / evidence 產生；永久 Development 的 skill baseline 仍是 canonical player skill。Development 與 Evaluation 模組不讀 `developmentTestCapabilityOverride`。Playing-Time opportunity 在建立 match-local floor 之前已完成，因此 floor 不反向提高先發、輪替或上場機率。

## 10. Save / Reload

Save normalization 保存 position、override version、benchmark version 與 frozen skill floors。Reload 不重算 population、不 reroll、不改 raw skill，也不改 actual game position。Audit / presentation 讀取不消耗 simulation RNG 或 presentation cursor。

## 11. Benchmark Calibration

v1 floor 為 catching 7、throwing 7、reaction 6、range 6、baseballIQ 7；1,000 場重測的 Player Basic Execution 為 1,029 / 2,496（41.2%）。這使多數守備機會在最初 fielding control 就提早失敗，無法穩定驗證 teammate leg、timing 與原因呈現，因此 v2 將校準目標明確改為 Player Basic Execution 65%–75%。

每組候選皆使用相同 1,000 場 fixture：

| Group | catching / throwing / reaction / range / IQ | Readiness H / M / L | Control / Transfer / Throw / Player Basic | Basic Rate |
| --- | --- | ---: | ---: | ---: |
| Current | 7 / 7 / 6 / 6 / 7 | 0 / 2,496 / 0 | 1,029 / 1,029 / 1,029 / 1,029 | 41.23% |
| Candidate D | 8 / 8 / 7 / 7 / 8 | 0 / 2,496 / 0 | 1,273 / 1,273 / 1,273 / 1,273 | 51.00% |
| Candidate E | 9 / 9 / 8 / 8 / 9 | 0 / 2,496 / 0 | 1,787 / 1,787 / 1,787 / 1,787 | 71.59% |
| Candidate F | 10 / 10 / 9 / 9 / 10 | 2,408 / 88 / 0 | 2,278 / 2,278 / 2,278 / 2,278 | 91.27% |
| Candidate G | 11 / 11 / 10 / 10 / 11 | 2,496 / 0 / 0 | 2,496 / 2,496 / 2,496 / 2,496 | 100.00% |

Candidate E 是第一組進入 65%–75% 目標帶，因此依 **Minimum Sufficient Deep-Chain Reachability** 選 E。F、G 明顯超過目標，且 G 已成為全 high / 零失敗，不採用。各組使用完全相同 seeds；meaningful、viable、0 / 1 / 2+、route availability 與 decision quality signatures 均相同。

Readiness 在 E 仍為全 medium。額外 differential probe 顯示單獨把 reaction 從 8 提至 9 才開始出現 high（448 / 2,496），但 Player Basic 同時跳至 1,994 / 2,496（79.9%），超出核心目標帶；catching、throwing、range 或 IQ 單項加一則仍為全 medium。依「不改 threshold、選最低 sufficient candidate」原則，本輪接受 E 的 readiness 分布，不為製造 high label 提高 floor 或修改正式公式。

Final candidate 另以 2,000 場獨立驗證：4,992 meaningful decisions，Player Basic / deep-chain reached 3,572，失敗 1,420，Basic Rate 71.55%；readiness 為 high 0、medium 4,992、low 0。0 / 1 / 2+ decision games 為 134 / 340 / 1,526。Route selections 為 initiate463 2,196、attackLeadRunnerThird 1,554、secureFirstBaseOut 642、preventRunHome 600。此 deterministic sweep 的 primary causes 為 sharedExecution 3,572、fieldingControl 1,420；actors 為 shared 3,572、player 1,420。稀有 teammate failure、timing failure、partial DP 與 reassessment 由既有 deterministic Explainability fixtures 覆蓋，本 sweep 不為增加其頻率修改 production producer。

Raw 與 final floor 的 viable routes、meaningful decision 數、route availability、decision quality 與 0 / 1 / 2+ decision 分布完全一致。永久 skill mutation、availability mismatch、decision quality mismatch、RNG drift、cursor drift、NaN 與 freeze 均為零。

## 12. Removal Conditions

兩個 fallback 必須獨立移除：

- **Generic Infield Position Fallback**：目前把 generic infield 解析到 playable 2B vertical；正式 Team Lineup / Position Assignment System 完成後移除。
- **Development Match Position Capability Fallback**：目前讓 explicit test position 具備可用於反覆驗證 execution 的 development-only capability；正式 High School Population & Capability Balance 與穩定 predefined test profiles 完成後重新校準或移除。

1B assignment 與能力下限已支援，但完整 1B playable defensive vertical deferred。SS / 3B assignment 與 generic fielding admission 已支援，完整 position-specific meaningful decision vertical deferred。
