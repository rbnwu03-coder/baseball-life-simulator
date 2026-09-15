# Ground-Ball Defensive Settlement Lifecycle Blocker Repair

完成日期：2026-09-15。結果：**PASS，待人工驗收**。

本輪為獨立 baseline blocker repair。沒有套回 stash、開始 School Exchange 或引入其他功能；沒有 commit/push。

## 1. Baseline reproduction

開始時 `main`、HEAD 與 origin/main 均為 `8646a3b feat: generate deterministic high school match opportunity candidates`，ahead/behind `0/0`，working tree clean，`git diff --check` 通過。

先新增 deterministic regression fixture，再修改 production。Fixture 保留原始 decision identity 的 `|exchange-fixture-start` 後綴，以重現 `simulationSeed=495886132`，直接使用既有 Match Context 的 awayInvitationFriendly 路徑，不依賴任何未合併的 Exchange 功能。

修復前 targeted test 實際失敗：播放 2,500 步後仍在五局下、1 出局、`moment_2_resolved`。修復後相同 seed 與步數上限通過，沒有換種子或增加上限。

## 2. Exact dead state

- `activeSituation.type = groundBallDefensiveDecision`
- `activeSituation.lifecycleState = resolved`
- `activeSituation.resolution.executionEvidence` 存在
- `activeSituation.settlement = { applied:false, identity:"" }`
- 新 situation 的 inning 為 5，但 `sourcePhysicalStateRef` 仍指向四局下的 ordinary-contact ground-defense。
- 舊 handoff 的 `settlementApplied`、`playSettlement.settlementApplied` 已為 true。
- Playback 遇到尚未 closed 的 active situation，無法繼續。

## 3. Root cause

`prepareHighSchoolDefensiveMomentFromSimulation` 在本次沒有產生 ordinary ground-ball handoff 時，區域變數 `groundBallHandoff` 為 null，但 match 上的 `groundBallInPlayState` 留著前一個已完成的滾地球資料。

`createGroundBallMatchSituation` 使用 match 上殘留的 handoff，替新的例行防守建立 ground-ball lifecycle。呼叫鏈確實到達 `applyRoutineDefensiveResolutionToHighSchoolMatch`，但其 `playSettlement.settlementApplied` 去重檢查讀到舊 play 的 true，提前返回；新的 active situation 已在前一步被 record 成 resolved。

這主要屬於分類 C／E：過期 handoff 污染目前 lifecycle，使正確的去重 guard 套在錯誤 play 上。不是單純漏呼叫 apply，也不是一個局數或種子特例。

## 4. Affected transition

失敗鏈：新防守準備 → 殘留舊 ground handoff → 新 situation → executing → resolved → routine apply 誤判已結算 → close 未執行 → playback blocked。

修復鏈：本打席 handoff（沒有則 null）→ 正確防守流程 → canonical apply → settled → closed → playback resume。

另外，合法的 resolved/pre-apply 存檔恢復可從 playback boundary 將既有 execution evidence 送回原 apply，無須再執行或重新抽樣。

## 5. Production change

只有 `script.js` 有 production 修改：

1. 在本次防守準備取得 handoff 後，將 `match.groundBallInPlayState` 設為本次結果；null 會移除前一 play 的殘留狀態。
2. 新增 `resumeResolvedHighSchoolGroundBallSettlement`，嚴格驗證合法待結算來源，再送回既有 routine 或 manual infield apply。
3. Playback 在一般 phase gate 前處理上述 resolved state，因此 manual 的 `moment_2_ready` 待結算狀態亦可恢復。

沒有移除或放寬既有 apply 去重與 stale validation；沒有直接設定 settlement flag；沒有新增第二 lifecycle engine。

## 6. Why baseline bug existed

舊 handoff 的保留時間超過其所属打席，卻又同時被後续 situation 建立與 apply guard 當成目前權威。四局下已結算的真實標記，在五局下被錯誤重用。既有一般主客場測試未涵蓋這個固定 seed 的連續防守組合；本次 fixture 補足此路徑。

## 7. Settlement identity and stale protection

沿用既有 deterministic identity：lifecycle settlement 為 `situationId|groundBallHandoff.identity|settlement`；play settlement identity 仍由既有 runner throw settlement authority 產生。原本空字串是未走到 settle/close 的結果，並非已完成 mutation 後遺失 ID。

Recovery 同時要求：matching situation ID、handoff identity、defensive situation ground context、physical identity、inning、half、outs、bases、scores、batter、runnerSettlementIdentity；並執行既有 decision/throw stage 與 stored execution validation。七種 stale context 測試皆在 mutation 前拒絕。

原 baseline dead state 包含跨打席的過期 handoff，不能把其中舊 evidence 盲目重放。修復防止重新產生該壞狀態；恢復功能只適用於合法、來源與目前狀態一致的 resolved/pre-apply boundary。沒有破壞性存檔遷移。

## 8. Exactly-once behavior

Regression 驗證 routine repeat apply、manual repeat apply、再次 recovery、settled save/load 後 apply 與 presentation query 不重複更動 canonical facts。Recovery 後 lifecycle closed，原 apply 的 identity/settlement guards 仍生效。

斷言核對 canonical third-out 的 outsAfter、basesAfter、legalScoringRunnerIds；同時驗證實際 GameRecord 投手 outsRecorded 增量、GameRecord integrity 與 settlement identity。不是只檢查旗標。

## 9. Player-away reproduction

原 seed `495886132`、awayInvitationFriendly，在原始 2,500 步上限內越過五局下並完成全場。完賽無 active orphan、GameRecord integrity 通過。

## 10. Player-home regression

相同 seed、homeInvitationFriendly 全場完成，GameRecord integrity 與 orphan 檢查通過。另有真實 manual ground-ball resolved boundary 的 canonical apply / reload 測試。

## 11. Save/load

測試在 executing → resolved 的真實函式邊界捕捉 player state，當時已有 execution evidence 且尚未 mutation。恢復該 state 後，實際 `saveGame` / `loadGame` 再由 playback 完成 settlement once。

routine 與 manual 均通過；routine 恢復後可完成整場。恢復期間將 `Math.random` 替換為 throw guard，確認不重新抽樣；正常同場重複 rendering/query 也不造成 duplicate GameRecord。

## 12. Selected tests

32/32 測試檔 PASS，涵蓋 defensive decision throw、runner throw settlement、force/multi-runner、third-out/run attribution、ground-ball production、主客場 Match Context、scoreboard、GameRecord、match lifecycle、career save/admission 與 high-school integrations。

新增 `tests/ground-ball-defensive-settlement-lifecycle-regression-test.js`：26/26 assertions PASS。

完整檔名與每檔結果見 [validation JSON](ground-ball-defensive-settlement-lifecycle-validation.json)。

## 13. Full regression

**181/181 測試檔 PASS，0 FAIL。**

Inventory 為所有 `tests/*-test.js` 加上 callbackTest.js、content-flow-audit.js、vertical-slice-smoke.js、baseball-match-foundation-2-2-4-3-audit.js。沒有 allowlist、skip 或已知失敗。

## 14. Syntax

全部 JS/CJS：**272/272 PASS**。

## 15. 1,400-game audit

| 指標 | 結果 |
|---|---:|
| Bench matches | 1,000/1,000 completed |
| Starter matches | 400/400 completed |
| Orphan | 0 |
| No progress | 0 |
| Match-state integrity issues | 0 |
| GameRecord integrity issues | 0 |

Audit 為本輪 full regression 實際執行結果，不沿用其他 Sprint 的報告。

## 16. Determinism

固定 blocker seed 的重跑結果（score、bases、outs、GameRecord、simulation cursor）完全相同。1,400-game audit 的 repeated-seed deterministic 檢查為 true。沒有新增 RNG 或 time-based ID。

## 17. Instrumentation neutrality and rules preservation

固定 blocker seed trace on/off 結果相同；audit 的 instrumentationNeutral=true。

Force、third-out、pitcher attribution、scoreboard、BattedBall mapper、AI PA、tag-up、catcher、fly-ball、line-drive authority 沒有修改。與 baseline 正規化比對下列八個核心函式的完整內容，均相同：isHighSchoolMatchWalkOff、shouldEndHighSchoolMatchAfterHalf、advanceHighSchoolMatchAfterHalfInning、resolveHighSchoolThirdOutIntegrity、classifyHighSchoolOrderedThirdOut、applyHighSchoolSimulatedPlateAppearance、resolveSimulatedHighSchoolPlateAppearance、applyHighSchoolDefensiveSettlementFacts。

## 18. Diff check

`git diff --check` PASS；新增檔案的 no-index whitespace check PASS。

## 19. Status

HEAD / origin/main 仍為 `8646a3b`，main ahead/behind 0/0。

- Modified：script.js
- Untracked：tests/ground-ball-defensive-settlement-lifecycle-regression-test.js
- Untracked：docs/ground-ball-defensive-settlement-lifecycle-blocker-repair.md
- Untracked：docs/ground-ball-defensive-settlement-lifecycle-validation.json

所有修改保留供人工驗收。沒有 commit、push、套回 stash 或開始下一功能。

## 20. Stop conditions

沒有觸發本輪 Stop A–I。修復前 targeted test 的預期失敗用於證明 baseline blocker；修復後選定 regression、完整 regression 與 audit 全綠。
