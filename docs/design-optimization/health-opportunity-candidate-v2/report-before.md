# 高一健康機會刷新：隔離候選與驗證 — 2026-10-29

**候選已完成，可供程式與契約審查；尚未接入 Production。7 套既有測試在基線／候選均 PASS，正式流程驗證 15 個案例群組 PASS。這只驗證機會層，沒有完成健康成本分離或遊戲平衡。**

承接 [11 號健康契約](11-health-flow-and-design-contract.md)。唯一 Production 基線是 `33abdcb151d0a6becef640aab778a87ce3cbec68`。原 checkpoint 工作樹及四套 manifest 修補保留；沒有重跑 278 套或健康 calibration。依 AGENTS.md 讀取 codebase-memory skill；本 session 無圖譜工具，採限定 source／rg fallback。Node v24.19.0，僅用 builtins，未新增依賴。

## 1. 可審閱的候選

- 候選分支：`candidate/y1-health-opportunity-2026-10-29`。
- 候選 worktree：`%TEMP%\baseball-health-opportunity-candidate-33abdcb`。
- 對照 worktree：`%TEMP%\baseball-health-opportunity-baseline-33abdcb`，detached HEAD。
- 候選仍是 **未 commit 的隔離工作樹補丁**；分支 HEAD 仍為上述基線。沒有 stage／commit／push，也沒有改寫 checkpoint 分支。
- [候選 diff](health-opportunity-candidate-v1/candidate.patch)：只改 `script.js`，40 行新增／2 行刪除。Patch SHA-256：`45692159a5d5101d7ee522c442b240c3952dea42b3d30c7e2b1541f199116f5f`。
- [共用測試環境 diff](health-opportunity-candidate-v1/shared-manifests.patch)：11 號報告的四套 manifest，原樣複製至兩組，與候選程式 diff 分開。

比較兩組 **2,331 個 tracked 檔案的實際位元組**，只有 `script.js` 不同；四套 manifest 的 SHA-256 均與原工作樹一致。[環境與確切路徑](health-opportunity-candidate-v1/environment.json)、[機器摘要及 script 雜湊](health-opportunity-candidate-v1/summary.json)、[原碼行號對照](health-opportunity-candidate-v1/source-map.json)可直接核對。

候選沿用 `PlayingTimeGameExposure.resolveStartingOpportunity`，不改其公式。與高二 refresh 相同，以原 opportunity identity 固定 variation 並保留 decisionId；高一進一步只重讀 body，重用已保存的 readiness／角色／學校／評價輸入，沒有順帶啟用 coachTrust 分項或重算能力。

## 2. 正式刷新、鎖定與準備時序

以下行號除另註外是候選 `script.js`；既有事件次序在 `story.js:1954`。

| 階段 | 正式順序與責任 | 鎖定結果 |
|---|---|---|
| 首次準備 | `high_school_life` 可恢復 fatigue；`high_school_role` choice 先套 effects，再由既有 owner 決定暫定角色；接著到 `high_school_long_bench` | 此前還沒有正式的第一場 match。角色 healthy gate 維持原規則 |
| 首次名單確認 | `choose` 先完成名單 choice 的 body／skill 等 effects，再呼叫 `processHighSchoolYearOneChoice`（14500）；名單分支明確傳 `confirmHealthReadiness:true` 給 prepare | 不是 getter 判斷健康，也不是把兩個 creation call 改成 dynamic=true |
| 首次刷新及建賽 | `prepareHighSchoolYearOneMatch`（9893）沿原順序取得 simulation seed、建立不含健康的 provisional opportunity；僅明確確認路徑呼叫 `refreshHighSchoolYearOneOpportunityHealth`（9589）；再保存 history、建立 roster／match／GameExposureState | 新機會先讀到選擇後 body；`highSchoolMatch.id`、`gameExposureState.opportunitySnapshot` 及 `simulationSeed` 構成既有持久鎖。後續才前進至 `high_school_showcase` 並重繪 |
| N+1 預計安排 | 首場正式結算 `applyHighSchoolCompetitionMatchSettlement`（13468）沿原路建立 `hs-y1-followup-evaluation-2`，放入 `highSchoolNextOpportunity` 及 history | 這是預計安排；此時不新增健康刷新，也不啟動第二場 |
| N+1 確認邊界 | 完成 `high_school_call_home` choice 的 effects、首場回顧與其他 choice 處理後，`advanceAfterAction`（16111）先令 step 6→7，正式事件成為 `high_school_followup_evaluation`；隨即呼叫 `confirmHighSchoolYearOneFollowupOpportunity`（9611） | 同一個同步 transition 內完成；420ms 的後續重繪不負責刷新 |
| N+1 刷新及建賽 | 重讀 body、保留 preview 非健康輸入與 identity，更新 `highSchoolNextOpportunity`；再由 `prepareHighSchoolFollowupEvaluationMatch`（10266）經原 selection／schedule／launch owner 建賽 | 第二場同場 match 形成鎖；history 更新原 decisionId 的紀錄，沒有追加新 identity |
| 確認後 | 再次 prepare 先回傳既有同場 match；舊 eventId 的重複 choose 被原 guard 拒絕；load 使用保存的 match／snapshot | 重讀、重繪、body 變動均不重算機會。沒有新增臨時退場或場上健康修正 |

**N+1 的現實限制：**目前兩場之間只有 `high_school_call_home`，其三個 choice 都沒有 recovery bodyEffects。候選將「完成電話並進入第二場」視為自動名單確認；沒有新增名單畫面或恢復選項。首次可用正式生活／熱身選擇驗證恢復；N+1 的確認前 body 改變只能作受控時序案例，不能宣稱玩家已有「數週休息」操作。若產品需要第二場前主動恢復或獨立確認按鈕，最小需求是另案加入準備／確認 transition；本輪沒有發明新的 gameplay choice。

展示機會的 `getHighSchoolFollowupEvaluationPresentation` 等沒有接入 refresh。驗證中，正式名單前的預計安排／回顧 getter，以及名單後的文字 getter，均不改 Player；重繪不改 opportunity／history／seed。既有部分 match getter 會委派 prepare 或初始化其他比賽內 context，本輪未全面改寫它們；本契約保證的是**合法高一流程中的機會刷新只由確認 transition 觸發**，不宣稱所有舊 getter 在所有內部時點都已成為純函式。

## 3. 身份與亂數契約

| 必須凍結 | 允許重算 |
|---|---|
| matchId、decisionId、opportunitySeed、playerId | `debug.scoreBreakdown.healthReadiness` |
| readinessSnapshot、角色、守位、學校與教練用途風格、evaluationTrend、previousActualExposure、gameContext | `debug.opportunityScore`，只因健康分項改變 |
| `debug.opportunityHash`／`deterministicVariation` | `plannedUsage`／`appearancePlan`、startingOpportunity／startingDecision、substitutionOpportunity 等用途衍生欄位 |
| 實際 match.simulationSeed；既有 Direct Start／pitcher deferred 規則 | 依原用途 owner 決定進場、實際曝光及其後續結果 |

目前高一 opportunity 沒有持久的 `stableVariationSeed` 欄位。原 `opportunitySeed` 是原始 decision identity 字串，原 hash 就由它產生；refresh 將**同一字串**傳入 resolver 的既有 `stableVariationSeed` 參數，因此 hash／variation 完全相同。沒有新增或偽造持久 seed 欄位。回傳值仍保存原 decisionId／opportunitySeed；這個 seed 是身份依據，不能拿來聲稱它記錄了刷新後完整健康輸入。

首次 simulation seed 仍沿原 `createHighSchoolMatchSimulationSeed` 產生一次；N+1 仍由原 decisionId 導出。refresh 本身沒有 Math.random 或 simulation 呼叫。正式對照逐一比較實際 seed、hash、variation 及全域測試 RNG draw count；零值與健康配對成立，鎖後重讀／重繪的額外 draw 為 0。

## 4. 正式入口與固定 seed 驗證

使用既有 `tests/high-school-career-test-context.js`，兩組皆由 `index.html` 的正式模組集合載入。從支援的 representative 高中入口 fixture，交由 `completeHighSchoolEntry` 正式進入高一，再走 intro／load／life／role／名單 choice、正式 Match Engine、playback、玩家合法 decision、GameRecord integrity 及 settlement。沒有手填比分、PA、曝光或比賽結算，不是從創角重跑童年。

seed 固定為 **77881、77001、99101**；未搜尋或剔除 seed。[規格](health-opportunity-candidate-v1/spec.json)與[驗證腳本](health-opportunity-candidate-v1/formal-verification.cjs)可重播；[最終證據](health-opportunity-candidate-v1/formal-final.json)為 **15/15 案例群組 PASS**，不是 15 場或人口統計樣本。

| 案例 | 實際結果與界線 |
|---|---|
| 三個 seed × 首次／N+1，健康 0 對基線 | 主要 profile 的 6 對：用途、整份 opportunity（僅排除新健康 metadata）、identity、variation、實際 simulation seed、draw count、正式 GameRecord 全部相同。唯一 opportunity 差異為 `debug.scoreBreakdown.healthReadiness:0`；總分不變 |
| 同非健康輸入、不同 body | 首次在暫定角色已由正式 owner 決定後設定研究 body；N+1 從同一份首場結算及 preview 的合法 Save 分叉。比較完整非健康輸入，沒有混入不同首場評價／能力。依原公式檢查方向，不要求每 seed 都換用途 |
| 首次確認前恢復 | 研究起始 fatigue 8；正式 life recovery 8→7；名單 warmup 7→6；確認讀到 6，healthReadiness=-3。未連帶降低 pain／risk，也沒改恢復數值 |
| N+1 確認前 body 變更 | 原 preview 不變，受控 fatigue 8→6 後完成電話；刷新讀到 6、healthReadiness=-3。這不是新增可玩的恢復選擇 |
| 確認後變更 body | 首次與 N+1 均將 body 改至 20／20／20，再重讀／重繪，opportunity 及 identity 不變；正式 replay GameRecord 相同。未要求賽後 evaluation 相同，因既有公式仍讀 live body |
| 確認前／後 fresh Save/Load | 首次與 N+1 均保留確認時序、opportunity、實際 seed 與正式 GameRecord；重複舊 eventId 確認無寫入，history 的 opportunityId 唯一，N+1 重複 settlement 不增加 evaluation sampleCount |
| Direct Start 相容輸入 | 獨立設定既有 `direct_start_history` opt-in，合法非投手在高負荷仍 forced start，正式 GameRecord 對基線相同；不混入一般健康效果結論 |
| 投手 deferred | 一般與 Direct Start 投手輸入均維持 noAppearance、0 PA／0 守備局，對基線正式 GameRecord 相同 |
| explicit full-match bypass | 重播既有開發入口跳到 step 5 並明確 prepare 的相容路徑，保留沒有確認 refresh 的 default；opportunity／identity／GameRecord 對基線相同。以上是正式下游 owner 的輸入／路徑驗證，沒有聲稱走過創角 UI |

原主要 profile（skills／traits／trust=8）在三種研究 body 下都仍 start；健康子分數確實下降，不以用途未變判為健康沒接線。另固定較低準備度 profile（skills／traits=4、trust=5；角色仍由原 owner 決定），沿用相同三個 seed，對照 0 與高負荷 body，沒有調 seed 找期望結果。此 profile 在初輪之後加入，來源明記於 spec；用來補用途門檻的分支覆蓋，不是預註冊的人口效果研究。

| seed | 首次 score／用途／實際 PA：0 → 高負荷 | N+1 score／用途／實際 PA：0 → 高負荷 |
|---|---|---|
| 77881 | 42／defensiveSubstitution／1 → 10／noAppearance／0 | 40／defensiveSubstitution／1 → 8／noAppearance／0 |
| 77001 | 65／start／4 → 33／noAppearance／0 | 59／start／3 → 27／noAppearance／0 |
| 99101 | 51／defensiveSubstitution／1 → 19／noAppearance／0 | 51／lateGameAppearance／2 → 19／noAppearance／0 |

每對健康子分數差為 -32，非健康輸入、identity／variation／simulation seed 相同。首次的名單 warmup 仍會先令 fatigue 20→19，N+1 讀 20；皆依既有 round 公式得到 -32。上場窗口與 PA 由正式 owner 產生，GameRecord 差異是**用途改變的下游結果**，不是直接降低打擊率的估計。三個 seed 不代表全守位、全能力或全健康尺度覆蓋。

## 5. Save／lifecycle 足夠之處與尚待決定之處

正常路徑不需要新 DTO 或 Save schema：首次確認直接保存第一場 match；N+1 確認直接保存第二場 match。`save.js` 原本保存 highSchoolNextOpportunity、整份 GameExposureState／opportunitySnapshot／simulationSeed，normalize 後保留；history 沿原 decisionId 更新去重。`player.js`、`save.js` 及 DTO 模組均未修改。沒有額外 `locked`、revision、confirmationId 或 RNG Save 欄位。

測試的外部 deterministic Math.random 狀態在 fresh VM load 後明確恢復，僅供 paired replay；不是新增正式保存能力。首次確認前尚未取得 simulation seed，Production 的全域 RNG 也未因本輪開始保存；本契約保證的是**已確認 match 的實際 seed 被保存且不重抽**，不擴稱確認前任意 reload 會重播所有未保存的外部 RNG。

接入前仍須接受以下最小政策：

1. **接受 N+1 自動確認的產品語意。** 電話 choice 完成→step 7 是這次採用的確認 transition；若需要獨立名單確認／可玩恢復，另加正式準備節點，維持同一個 refresh owner，不把 refresh 搬進 getter。
2. **明定舊存檔與 bypass 的 grandfather 規則。** 已有同場 match 一律保留原安排。舊 Save 若已在 step 5／7 卻尚未 prepare，或內部工具繞過確認 transition，仍走原 prepare 相容路徑，不在 load／顯示時補刷健康。本候選未宣稱這類舊狀態已得到新健康效果。若要求它們也使用新規則，最小需求是明確的恢復流程 transition／遷移政策；不能從缺欄推導曾經確認，也不能偷偷加 Save 欄位或從 getter 遷移。
3. **接受 health-only refresh 的快照責任。** N+1 其他輸入仍凍結在首場結算的 preview；電話後可能變動的 trust／能力不順帶重算。現有 combined healthReadiness 可保存，但沒有新增當時三項 body 原值的歷史 snapshot；日後 UI 不可用當前 body 假充它。roleContext 中的舊預計安排文字也沒有全面重新整理；正式比賽消費 match opportunity，顯示需求另案確認。
4. **審查既有多層健康成本。** trainingScore／sampleScore、角色 healthy gate、年末／market 門檻全數保留。改變機會後，較少樣本與健康賽後分數仍可能同時存在；本輪沒有聲稱已解決重複成本。11 號報告的其他 state failure、14 套 source protection 及 cohort 待辦沒有被這次 PASS 改判。

## 6. 直接相關回歸與原保護

[基線結果](health-opportunity-candidate-v1/regressions-baseline/results.json)與[最終候選結果](health-opportunity-candidate-v1/regressions-candidate-final/results.json)均 **7 PASS／0 FAIL／0 TIMEOUT**：

| 原 suite | 基線 | 候選 |
|---|---|---|
| playing-time-game-exposure-foundation-v1 | PASS | PASS |
| opportunity-evaluation-boundary-v1-0-1 | PASS | PASS |
| high-school-year-one-opportunity-two-integration | PASS | PASS |
| high-school-schedule-opportunity-production-integration | PASS | PASS |
| high-school-career-evidence | PASS | PASS |
| high-school-career-exit-integration | PASS | PASS |
| career-save-admission | PASS | PASS |

以原 standalone entry、既有 entry-safe preload、每套 120 秒上限執行；兩組 module／manifest 環境相同。所選測試原碼 SHA-256 完全相同，原 assertions 與 source guards 原封保留，沒有觸發需改期望／hash 的舊保護。career-save-admission 使用自訂 verify，原輸出完整 45 項及 45/45 footer；它的 Node assertion 計數是 0，不冒充 45 次 Node assertion。

完整 Production 差異只有兩個新 helper、首次明確確認參數，以及 N+1 transition 呼叫；沒有改 full-match capability／成功率、賽後公式、年末／market、訓練負荷、畫面版型、DTO、Save 或正式狀態 validator。全專案其他 source-hash gate 未重跑；若正式接入時觸發，應逐項審查本 diff 對原保護目的的精確差異，不能批次更新 hash。

初次驗證工具誤把已在 step 5 的 representative fixture 當成入學前，保存於 [attempt 1](health-opportunity-candidate-v1/formal-attempt-1.json)；已改用正式 entry owner 重走早期選擇。接著 [attempt 2](health-opportunity-candidate-v1/formal-attempt-2.json)另發現工具的 JSON 負零比較與過早讀取尚不存在的 followup，以及候選真正的 transition 順序錯誤：先建 N+1、後 step++ 會遭原 schedule eligibility 拒絕。候選改為先 step++ 再確認，未放寬 guard；[初版 diff](health-opportunity-candidate-v1/initial-candidate.patch)及[修正腳本](health-opportunity-candidate-v1/correct-transition.cjs)保留。[attempt 3](health-opportunity-candidate-v1/formal-attempt-3.json)為修正後首批 11/11；最終加入固定較低準備度與 bypass 案例後為 15/15。失敗紀錄未覆寫，也未混列成 Production 缺陷。

## 7. 重現與保存

現存 worktree 可直接驗證候選位元組，並以新結果名稱重播：

```powershell
node docs/design-optimization/health-opportunity-candidate-v1/patch-candidate.cjs --verify
node docs/design-optimization/health-opportunity-candidate-v1/formal-verification.cjs formal-review-NEW.json
node docs/design-optimization/health-opportunity-candidate-v1/run-regressions.cjs baseline baseline-review-NEW
node docs/design-optimization/health-opportunity-candidate-v1/run-regressions.cjs candidate candidate-review-NEW
```

全新 checkout 的重現順序：從確切基線各建一個 worktree，兩者都套 `shared-manifests.patch`，只在候選套 `candidate.patch`。`git -c core.autocrlf=false apply --check <patch>` 應先通過，再 apply。建立一份**新** environment JSON，包含 `base`、`baseline` 與 `candidate` 絕對路徑，設定 `$env:HEALTH_OPPORTUNITY_ENV` 指向它；上述三個腳本即使用新路徑。結果檔及目錄採 exclusive-create，重跑必須用新名字，不覆寫既有 evidence。建樹與套 patch 的完整原步驟亦保存在 [setup](health-opportunity-candidate-v1/setup.cjs)／[候選生成器](health-opportunity-candidate-v1/patch-candidate.cjs)。

[保存核對](health-opportunity-candidate-v1/preservation-after.json)比對開工 **3,855 個既有檔案**，只有 README 新增本報告索引；原四套 manifest、11 號報告、歷史證據與本機 JSON 位元組均未改，原 HEAD／checkpoint 分支不變。所有新診斷與交付均在新路徑，候選程式只在隔離 worktree。至此完成候選與可重現驗證，停止於正式實作審查邊界。
