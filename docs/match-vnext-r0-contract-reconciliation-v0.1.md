# 《棒球人生》Match vNext R0 — Contract Reconciliation & Sprint 1 Authorization Gate v0.1

## 1. R0 決策與授權邊界

**R1 PASS；R2 READY FOR SCOPE APPROVAL；R3 DESIGN ACCEPTED。建議：SPRINT 1 READY FOR USER AUTHORIZATION。** 本輪只調和一個歷史測試守衛並完成契約審查，沒有開始 Same-Ball Gameplay Execution。[S/T:R01–R04、G01–G03；I:R2/R3契約]

| Gate | 本輪結論 | 限定含義 |
|---|---|---|
| R1 Historical Source-Freeze | **PASS** | 精確七行修復可追溯；守衛正反驗證及完整 T10 12/12 通過 |
| R2 Gameplay Consumer Contract | **READY FOR SCOPE APPROVAL** | 所有權、接點、receipt 與修改清單已具體化；仍須使用者批准新 Gameplay scope |
| R3 NPC Single-Contest Contract | **DESIGN ACCEPTED** | 本輪設計審查接受下述受控範圍及拒絕條件；不表示已施工、已 runtime 驗收或使用者已核准實作 |
| R4 Receipt／Save Compatibility | **VALIDATION REQUIRED** | 必須列入 Sprint 1 完成 gate；若需 schema／journal／Save owner 改動，立即升級為 BLOCKED |
| R5 True Capability／Selector | **VALIDATION REQUIRED** | 必須以真正 active actors／能力及唯一 selector 做 production 見證 |
| R6 Sprint 1 Authorization | **NOT AUTHORIZED** | 本輪建議可送使用者授權，不自行開工 |

維持方案 2：保留現有 Match State／Lifecycle／Canonical Settlement／Game Record／Career owners。R1 的歷史七行例外**不授權** R2 中任何新 Gameplay consumer、source wiring 或 Index 改動。原 Blueprint、Audit、歷史紅燈與 pins 全部保留。

[S]＝目前精確 source；[T]＝本輪已執行測試或有時間／檔案指向的歷史執行；[D]＝歷史文件／Evidence；[G]＝Graph discovery；[I]＝設計提案、待實作驗證。本文 `PROPOSED` signatures、payload 欄位和新增檔清單都只是文件規格。

## 2. Preflight、必要閱讀與來源限定

開工 2026-10-17T02:31:12.063Z（Asia/Taipei 2026-10-17），HEAD／local origin/main 都為 `ab3117653945de0b7013636187c446276a96e634`，branch `main`；13 tracked WIP、1,209 untracked；staged 空。index SHA256＝`6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`。兩個 R0 新文件均不存在。guard helper 是 tracked 且開工無修改；**原 T10 是既存 tracked WIP，未修改任何內容**。[S:preflight]

前輪 1,945 個可讀基線檔案在開工全數 hash 相符；加入 Blueprint 兩份文件後，本輪保存 1,947 個既存可讀檔案基線。12 protected paths 沿用 Blueprint 的 metadata-only 規則，只查 status／size／mtime，不讀取、hash 或執行；不宣稱 protected content 相同。完整 status／refs／hash map／metadata 見 Evidence.preflight、integrity。未 fetch；origin/main 只代表 local tracking ref。[S]

已閱讀並核對 Blueprint／Evidence、Gameplay Audit／Evidence、Readiness 報告、既有 Source-Freeze Phase B 授權契約，以及 10/15 Snapshot Repair 的 report／source／production-delta／authorized-before／closeout Evidence。Blueprint report hash `f871e91b1d543344cda3dfa4dc2eac29a540e2292bf048e572091899062796bc` 與其記載相符。[D:R03/R04/R15]

沿用本對話已讀的 codebase-memory skill。Graph generation 2026-10-15T01:30:19Z，檔案 coverage 多為 metadata_changed、文件 not_tracked；Graph 僅定位，所有改動與契約關鍵處都讀目前 source。search 分頁已讀完，沒有 reindex／完整 call graph 或無 caller 證明。[G:graph]

**API 名稱校正：** 目前控球函式是 `PitchSequencing.resolvePitchControl`；`controlRealization` 是 pitch decision 中的資料欄位。Blueprint 部分文字曾用 resolveControlRealization 描述此過程，本輪以目前 API 為準，歷史文件保持原樣。[S:R07]

## 3. R1.1 — Pinned Source 與唯一合法 Delta

T10 case8 原 pin：`ac53bf61964bde4b40501c77e15269bae99b55cc`。另外核對 Interpretation／Adapter／Intent／Signal 四個既有 pins：`98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7`、`9b9546f94a7286afef474be634fd93c57eb455db`、`2a4b44a034b714b8de3c8a6897507995ab0f8ccd`、`674e49115a9ed7d67c69a3023b5a594d41fe584c`。五個 Git objects 都存在，該函式 normalized body 相同。[S/T:R01/R02；Evidence.r1.sourceVerification]

| 驗證項 | 精確結果 |
|---|---|
| 歷史 settleHighSchoolYearOneMatch | 96 行；normalized function SHA256 `cdf18754723934a71b44867c3ccb744921549d263c86fb4f52347a9eb0271456` |
| 目前函式 | 89 行；normalized function SHA256 `671bc0fb85c8a526631f56e9ebd90c05dcce05503854dd4be7dc2ee7c4d5693a` |
| 唯一 function body 差異 | 下列七行在每個 pinned body 各出現一次；**只刪除這個 exact literal 後，等於目前整個函式** |
| 目前 script.js 完整 hash | `b35526671499a5f780ccbd5c0e152b7e935fbacdea1302c26f75730faba70669`，等於 10/15 repair afterHash；R0 未改 |
| 舊 helper 的本輪修改前診斷 | 五個 pins 都在此 function freeze 拒絕目前 source；失敗訊息一致 |
| 10/15 授權／修復證據 | production-delta /edits/0；source /exactProduction；closeout /authorizedDelta；hash 及 scope 相符 |
| Phase B 是否涵蓋此差異 | **否**。10/14 只授權五個 Save＋兩個 Index comparison branches，保留 script scope；不從文件名稱推定授權 |

唯一歷史刪除內容：

```js
  const finalMoment = match.completedMoments.at(-1);
  if (finalMoment) {
    finalMoment.scores = { ...match.scores };
    finalMoment.runners = [null, null, null];
    finalMoment.outs = 3;
    finalMoment.half = "終";
  }
```

該修復讓 completed Moment 保留當球 resolution after，gameEnd／final record 另保存終場。它未移交 match-end authority；本輪不重做歷史 Production repair，也不恢復這段 overwrite。[S:R10/R13；D:R03]

## 4. R1.2 — Guard 的精確修復

唯一修改既存檔案：[`tests/pitch-production-source-scope.cjs`](../tests/pitch-production-source-scope.cjs)，目前 lines193–205、224–226。僅兩個精確 edit，Git numstat **16 added／1 removed**。[S:R01]

1. `expectedFunction` 對 `settleHighSchoolYearOneMatch` 加歷史 literal transformation：確認七行在 caller 提供的歷史 body **exactly once**，僅移除它，產生 expected repaired body。缺 anchor 或其他差異不自動接受。
2. 比較這個函式時，**只接受 expected repaired body**；不保留 `actual===original` 捷徑，因此恢復原七行也會被拒絕。其餘函式仍沿原來 original／已審 additive exception 比較。

保留 95 個 protected functions 名單、25 個 protected globals、12 個 module symbols、所有既有 shared recording exceptions、top-level checks、external wiring 和 `SPRINT_BASELINE=c54f81016ed6d495f6c6911ebae708c05bcf4b2b`。Save／OPA／PitchSequencing 等 T10 原比較項與每套 caller pin 一字未改。[S:R01/R02]

helper before hash `a77919df1b25b42659612ae7325e1723cf2867ce7ed4629f065b084fc28adbf2` → after `14133b951cbb248b6710d3bd9f873a0e0e4e5421348d9026eda31c39fd3f15c3`。獨立反向移除兩個 edits 後，逐 byte 回到開工 hash；其餘 bytes unchanged。[T:deltaVerification]

守衛仍是**既有 pitch/offense scoped contract**，沒有升格成全 script freeze。原本明確允許的無關 defensive-only 新函式仍可接受；這不表示它取得 Gameplay 施工授權。本輪拒絕矩陣確認七行例外沒有擴大原 scope。[S/T:R01/G02]

## 5. R1.3 — Positive／Negative Guard Verification

所有 mutants 都只在 Node 記憶體中的 source string，Production 檔案未被改寫、載入或執行。內嵌驗證程式與 raw output 都存 Evidence；沒有新增 harness 或 test 檔。[T:G01]

| 類型 | 本輪實際觀察 | 結果 |
|---|---|---|
| Positive | current repaired source 對五個原 pins | 5/5 ACCEPT |
| Negative A | 各 pin 的原 96 行函式取代目前 89 行，恢復 overwrite | 5/5 REJECT |
| Negative B | 額外變動 settlement 的 score、bases、batting order、settled 邏輯 | 4/4 REJECT |
| Negative C | 其他 frozen capability owner、external pitch consumer、shared record writer rebind | 3/3 REJECT |
| Negative D | Snapshot 範圍外的 GameRecord event writer、token settlement、RNG owner body 變動 | 3/3 REJECT |
| 歷史 anchor fail-closed | missing anchor、duplicate anchor mutant | 2/2 REJECT；duplicate mutant先被JS parser拒絕，不冒稱是anchor計數assertion |
| 原 scope control | 無關 defensive-only 函式，無 pitch/offense 呼叫 | ACCEPT，維持原保護邊界 |
| 合計 | **23/23 checks：6 ACCEPT、17 REJECT** | exit0 |

再執行未修改的 `node tests/pitch-production-source-scope-test.js`：**7/7 cases PASS，131 rejected mutations**，覆蓋全部95 protected function body、25 globals、rename/remove/duplicate/rebind、external wiring與原exact shared exceptions。[T:G02] 131 是 suite 內的 mutation count，不與7個case混加。

原測試命名「exact protected implementations」在新 helper 下包含本輪批准的 exact snapshot transformation；未改測試名稱或 assertions。其他無關 source changes 不因這個例外通關。

## 6. R1.4 — 完整 T10 回歸與歷史紅燈

執行原 tracked-WIP 測試：`node tests/pitch-tactical-decision-production-integration-test.js`。**Case1–12 全部 PASS、exit0**，沒有跳過第8項或單獨執行9–12。[T:G03；raw stdout/stderr 見Evidence.validation]

| Case | 原測試責任 | 本輪 |
|---|---|---|
| 1 | 真實3+pitch PA incremental/rebuilt states | PASS |
| 2 | Browser VM／CommonJS projections相同 | PASS |
| 3 | Decision ON/OFF整場／tactical／record／RNG相同 | PASS |
| 4 | live VM save/load重建續行 | PASS |
| 5 | projection不抽RNG、不改Production/Sequence/Interpretation | PASS |
| 6 | compressed事件拒絕造pitch stream | PASS |
| 7 | finished persistence不新增projection save authority | PASS |
| 8 | protectedsource／exact extraction／Save原比較 | PASS |
| 9 | decision不含recommendation/physical/scoring/psychology | PASS |
| 10 | Interpretation wrapper禁止upstream/raw/numeric讀取 | PASS |
| 11 | canonicalvocabulary與neutralfallback獨立 | PASS |
| 12 | 詳細PA有non-neutralcandidate但不在Production消費 | PASS |

沿用測試本身固定 `440000` 的5次 off/on/reload/take/swing bounded runs。測試的 `discover` 是該固定seed的正常entry流程，未掃多個seed。VM DOM／timers／localStorage在記憶體，Save API只操作該storage；current index loader排除application-controller。前置檢查其三層loader及只讀Git比較；沒有檔案寫入、Browser、網路或新Gameplay。[S:R02/R16；T:G03]

raw結果含take projection calls11、swing14，rngDraws/sourceMutations等為0；compressedRejected65。這是**原projection契約及既有玩法保持**的證據，**不證明新same-ball consumer、receipt或能力來源問題已修好**。

歷史 Gameplay Audit T10 的1–7 PASS／8 FAIL／9–12 NOT EXECUTED及raw stderr，仍留在原 Evidence，hash未變；R0只新增此次綠燈時間戳與raw capture，不覆蓋舊結果。[D/T:R15] 沒重跑前輪九組Gameplay suites、完整Regression、seed search、MonteCarlo或Browser UI。

## 7. R2.1 — Execution Ownership Contract

下列順序是 **Sprint 1契約提案**；「EXISTING」只表示API／owner目前存在，不表示新組裝已執行。只凍結這條因果鏈，沿用Blueprint第3／5／6／7節，不另選Match架構。[I；S:R05–R14/R18]

| 階段 | Owner／目前狀態 | 允許讀取 → 回傳 | 禁止副作用／來源 |
|---|---|---|---|
| Match Context | player.highSchoolMatch／advanceHighSchoolMatchPlaybackStep（EXISTING） | 當前Match/sides/inning/outs/bases/scores/slot → freeze expected-before input | 不得建第二canonical state [R14] |
| Actual Capability | script actual-roster/player capability adapters（EXISTING_WITH_BINDING_GAP） | actualP/SS/1B、liveplayer／runnerIDs → consumed-input snapshot/value/scale/source | 不得UI/default冒真source、不得回填歷史 [R18] |
| Tactical Selector | OPA.generatePitchOpportunity→PitcherCatcherTacticalIntegration.createTacticalPitchDecision（EXISTING） | count/context/runtime/history → singleintent／recommendation／actualpitchdecision | 新shadowDecision不介入正式intent [R07] |
| Actual Pitch | PitchSequencing.createPitchDecision→resolvePitchControl；OPA.completePitchTruth（EXISTING_WITH_IDENTITY_GAP） | activePcontrol×2、mental/process、意圖 → actualclass/location/controlRealization、pitchId | 不得重新抽已presentedpitch [R07/R18] |
| Player Batting | public choose→resolveHighSchoolYearOneMatch→PlateDecisionFoundation.resolve→OPA.resolveNextPitch（EXISTING） | 當前Situation/route/legaldecision/perception → count/action/executionevent | UI不得提供trustedfunction；pitchsettled非PAcommit [R05/R06] |
| Physical | OPA.resolveFairContactBallInPlay→BattedBallPhysical（EXISTING） | 實際同pitch/contact/ability/declaredrolls → 唯一physicaltruth/physicalId | 不得recontact/換球/捏造coordinates [R06] |
| NPC Defense | 新actor-bound adapter組合Opportunity/Ground/ReachSecure/DecisionThrow/IncomingReceive（ADAPTER_PROPOSED） | 原truth、actualNPCroster/caps → actualreach/secure/throw/receive/actionfacts | 不得呼叫player-hardcoded wrapper或寫playerdefense [R08] |
| Runner/Force/Third-Out | RunnerThrowSettlement／ForceAdvancement／resolveHighSchoolThirdOutIntegrity（EXISTING_COMPOSITION_PROPOSED） | BR/runnerIDs、movement、timing、orderedretirements → 閉合canonicalcandidate、合法bases/runs/outs | firstleg pending不能提交；不得改Match [R09] |
| Offensive PA Settlement | resolveHighSchoolOffensiveDecision；existing applyHighSchoolDefensiveSettlementFacts（EXISTING_OWNER_NEW_BRANCH_PROPOSED） | validatedwholecandidate＋currentbefore／actorbindings → canonicalwrites＋原PA/Moment/resultApplied/order | candidate與tokenaward互斥，拒絕duplicate/conflict/stale [R10/R09] |
| Game Record | recordHighSchoolMeaningfulPlateAppearance／recordHighSchoolMatchSimulationEvent→MatchGameRecord.recordEvent（EXISTING） | pre-dispatchactor/action/scorer/identitymetadata → 正式PA/BF/out/attribution eventrefs | 不得晚補log來修已計算stats；不另立ledger [R11] |
| Evaluation／Development | originaloffenseMoment／MatchExperienceDevelopment；settleHighSchoolYearOneMatch（EXISTING） | 真execution/evidence/exposure → 賽後才applyDevelopmentResult | PA不能提早growth；NPC不能產playerSSlearning [R13] |
| Next PA／Half | advanceHighSchoolMatchBattingOrder、endHighSchoolMatchHalfInning、productionstep（EXISTING） | 唯一commit後state/termination → next合法before／原Matchcontinuity | 不得UI並行推進或強行同半局 [R14] |

Gameplay adapter 不得持有可回寫 Match 的能力；只收取immutablecontext／capability／physical snapshots並回facts/candidate。它可以使用局部工作副本，但該副本不成為可獨立保存或回寫的第二Match authority。唯一提交點是原 `resolveHighSchoolOffensiveDecision` 的未來candidate分支。

### Identity 生成與持續

| Identity | 產生 owner／時點 | 凍結規則 |
|---|---|---|
| matchId | 現有Match prepare，沿match.id | 不重新prepare另一Match |
| paId／batter／slot | 現有createHighSchoolOffensivePlateAppearanceIdentity＋實際lineup，首次准入詳細PA時 | 新mode只在freshPA第一球生成前啟用；existingPA不得換ID重新抽樣 |
| runtimeId／pitcherId | actual defense P及既有runtimecreate，生成下一個新pitch之前 | runtime actor、PA.context.pitcherId、actualPitch.pitcherId、GameRecord actor一致 |
| pitchId | 既有OPA.generatePitchOpportunity，present前 | pending／reload保留原pitch；不因UI／callback改ID |
| decision/situationId | 原PlateDecision prepare→playerroute→execution identity | 始終指向同PA/pitch，pitchclosed不等於PAcommitted |
| physicalId | 原OPA fair contact呼叫Physical一次 | 原值沿Defense／runner／PA；與pitch作明確關聯，不跨模式假設所有ID字面格式相等 |
| play/throw/receive/settlement IDs | 現有foundation由原physical及actor/route衍生 | 保留原suffix／版本，explicit physicalRef；不另抽ball |
| PA/defense eventId | 原offenseowner在dispatch前依PA/play穩定組合（PROPOSED） | 顯式eventId供既有GameRecord；不是用當前log長度臨時重建 |
| committed receipt | 原offenseowner完成所有writes後從實際refs投影（PROPOSED） | executionproducer不能提前建立已提交receipt |

## 8. R2.2 — Trusted Callback／Pending-BIP Contract

以下 signatures 全為 **PROPOSED**，沒有新增JS或正式receipt schema：

```text
captureExecutionContext(match, admittedPA) -> FrozenExecutionContext
PlateDecisionFoundation.resolve({...serializableInputs, trustedPhysicalOutcomeResolver})
resolveSameBallDefense(context, originalPhysicalTruth, declaredStageInputs)
  -> {eligibility, executedFacts, closedCandidate | blockedReason}
OffensivePlateApproach.completeHeldBallInPlay(paState, closedCandidate)
  -> CompletedExecutionState  // resultApplied remains false
lookupCommittedPA(match, paIdentity) -> legacy | none | duplicateReceipt | partialConflict
resolveHighSchoolOffensiveDecision(match, choice, tier, {...options, sameBallCandidate})
  -> existing completedMoment | explicit rejection/block
```

新函式來源位置與必要性：capture/lookup是script內狹小read-only組裝；resolveSameBallDefense在新pureadapter；completeHeldBIP屬原OPA stateowner的identity-checked轉換。原commit函式名稱不換，參數擴展與其他四個新名稱均待scope批准。[R05/R06/R10/R12/R18]

| 邊界 | 現在 source | Sprint 1凍結規則／必要最小接點 | 回歸風險 |
|---|---|---|---|
| 注入來源 | script10754→PlateDecision.resolve；目前options經JSONclone | trusted callback由原Gameplay handler內建立；單獨參數、在clone data後明確傳入OPA。UI只傳route，Save不存function | 若仍塞executionOptions會被丟掉；若由UI接受任意function則越權 |
| Fair BIP | OPA444–474，Physical後才callback／mapper | eligible先回Pending，不先執行compressedhit mapper或tokensettlement；原truth只建一次 | mapperlocal settled不能當Matchcommit |
| Pending barrier | OPA.resolveNextPitch/simulate有awaitingDefense；prepareNextPitch及script10770沒有完整barrier | OPA.prepareNextPitch、PlateDecision.prepare、scriptprepare/resolve後繼分支一律擋pending，不開下一pitch/Situation | 原非terminal球仍需正常nextpitch，mode-off不得停死 |
| held completion | 尚無generic completeHeldBallInPlay | 驗PA/pitch/physical/last-event/candidate閉合一致，原mapper只consume同球defenseclassification；更新terminalexecutionstate | 不重跑pitch/contact/tacticalfeedback；不把pending寫成PAevent |
| 公開handler續行 | script13728–13740 terminal branch回原offenseowner | completion在同一同步handler內交原owner；成功才回terminal；blocked不可返回偽成功或自動next | 不能讓publicroute卡在closedpitch而無owner，也不能藉UIconfirmcommit |
| Legacy branch | 原OPAmapper/count/terminal | callback未啟用或pre-entry不eligible，保留原流程並標fallback；新mode已執行後不能事後改走舊producer | 防止以失敗守備觸發重新抽樣 |

callback捕獲的是同球凍結context，不是任意currentMatch closure；callback結果亦須由原handler重新比對currentexpected-before。callback的合法性來自正式owner注入與身份驗證，不是單靠typeof=function。

Pending只表示已產physical、尚待defenseclosure。pitchlifecycle settled/closed只結束當球count-resolution，**不得**宣稱PA已寫ledger。完成heldBIP時不重做recognition、swing、Physical、selector或feedback；保持原pitchHistory、capabilityprovenance與safetyFallbackUsed。第15球強制BIP不得當自然contact成功見證。[R05/R06]

## 9. R2.3 — Actual NPC Actor／Capability Binding

S1固定：玩家為攻方batter／BR；actualopposingP、SS、1B均來自 `match.rosters[match.defenseTeam]` 的正式activeassignment。SS/1B不得等於player，且不得是同actor；receiverId、position、targetBase與throw facts一致。空壘但BR identity仍必須是同一個player batter，不可用batter-runner placeholder。[S:R08/R18；I]

**能力來源凍結：** liveplayer batting/observe/ballSense/IQ及原power/speedadapter；NPC SS用actualroster defense/arm/contact/speed投影；1B用同actor fielding/catching/reaction/range（既有alias也記source）；activeP的pitchingProfile.control由roster1..10尺度×2 clamp1..20，確實傳入 `PitchSequencing.resolvePitchControl`。記原值、adapter version、尺度、alias/fallback及實際consumedkeys。值1有真來源可合法，**不能以數值大小取代provenance檢查**。[S:R07/R18]

目前缺口是context.pitcherId未填與savedruntime覆fallback，非控球公式不存在。新mode在新pitch之前檢查runtimeId/actor；換actualP時用既有createPitcherRuntimeState初始化，不能讓舊control/history覆蓋新投手。pendingpitch或BIP中actor/assignment變動先拒絕舊candidate，不重投；S1不新增換投UI／mid-PA投手責任分攤。[R07/R18]

| 可重用 pure foundation | 真正責任 |
|---|---|
| DefensiveOpportunityFoundation | 原truth／topology／actualroster→責任與actorbinding |
| DefensiveReachSecureFoundation | 真caps→reach／securemargin及controlledball |
| BattedBallGroundDefense | 同truth、BR/runnerIDs、已有reach→groundcontext／force／runnerrealization／windows |
| DefensiveDecisionThrowFoundation | legalopportunity→secureFirstBaseOut、throw、IncomingReceive、actionfacts、scorereligibility／attribution |
| DefensiveRunnerThrowSettlementFoundation | 真throw/receive與BRarrival→contest／firstlegsettlement |
| ForceAdvancement＋existingthird-out | movement/orderedactualretirement→完整runnerclosure／合法thirdout |
| BattedBallOutcomeMapping | 閉合defensefacts→同球PAclassification；不重抽compressedclassification |

不可直接用：`ensureHighSchoolOrdinaryGroundBallInPlayHandoff`（會另生controlledcontact）、`getHighSchoolPhysicalDefensePlayerContext`、`buildHighSchoolShortstopExecution`（playerhardcode）、`applyInfieldResolutionToHighSchoolMatch`（playercontribution／defenseMoment／opponentorder）。不改這些wrapper來讓同一玩家控制敵隊SS。[S:R08/R09/R10]

NPC只寫 `defensivePlay`＋真 `actionFacts/defensiveAttribution`，不寫playerRoutinePlay、playerdefenseMoment或playerSSlearning。沿用既有IncomingReceive，不涉及Receiver v2。

## 10. R2.4 — Unique Offensive PA Commit／Receipt／Save

### 10.1 Commit 前必驗

原offenseowner在任何score/bases/order/evidence/runtime-settlement寫入前，必須驗證：

- candidate version與actualmatch/PA/pitch/physical/decisionref；currentbatter、slot、offense/defense、inning/half。
- expected-before的outs/runnerIDs/scores，以及actualP／SS／1B assignments與能力消費snapshot；有其他正式事件或換人則拒絕。
- 空壘BR=player、movementintents完整；timing/receive及orderedretirements／force語義一致；firstleg的pendingRunners／liveBallRecoveryRequired不得偽裝為closed。
- canonicalthirdout.settlementReady、basesAfter／legalruns與candidate一致；必要scorer證據、完整actiondependency與actorcredit同球。
- 先做deduplookup，再做新的候選precondition；已提交PA即使下一棒已改state，仍拒絕舊commit，不能拿舊after去覆寫現在state。[S:R09–R12；I]

commit流程：選擇**canonicaldefensivefactapplication或原tokenaward其中一條**→原PAperformance/PAevent/Moment→NPCdefensivePlay→原order/resultApplied/agency/lifecycle收尾。具體在既有offenseowner內安排順序，保持其原有mode-off行為；任何必需資料應在mutatingentry前備妥。順序的核心是PA/defense/record全部同一commit owner，不要求建立另一個交易引擎。

PA eventId／defensiveeventId／settlementId／action/scorer/actor metadata **dispatch前**完整備妥。現有eventwriter先push simulationLog、立即呼叫GameRecord；不能靠後續Object.assign(log)修正已發生的統計。PA擁有BF及整個outdelta，defensivePlay只擁有actorattribution，不再另加pitcherout。[S:R10/R11]

### 10.2 Receipt 的確定設計（PROPOSED、只在文件）

| 項目 | 凍結決定 |
|---|---|
| Source owner | 原resolveHighSchoolOffensiveDecision；pureadapter只能回candidate |
| 生成時機 | eventIds／candidateRefs預先備妥；**committedreceipt只有在canonicalwrites、PA/Moment、NPCevent、order/resultApplied及integrity成功後**才從實際refs投影 |
| 已提交身份 | matchId、paId、pitch/physical/play/settlementrefs、PAeventId、defensiveeventId、MomentId、實際before/after/ordertransition；receipt不是另一份可回寫state |
| 資料存放候選 | 新mode標記放既有OPA.context；pre-dispatch `executionRefs` 作既有PA／NPCsimulationLog及completedMoment可選metadata，使用顯式eventId。**本輪不建立正式schema或資料** |
| committed判定 | 不信任單個serialized committed=true；lookup必須對齊PA/defense log、GameRecord.eventRefs、Momentrefs及原PA收尾標記，必要時核對ordertransition。完整refs才能投影receipt |
| Reload lookup | 從已存在的log/Moment identity metadata與GameRecord.eventRefs交叉查找；不重跑execution、不從現在roster補歷史能力。currentPA的resultApplied只是其中一項，不能獨自防重 |
| Duplicate | 完全同一PA已提交：拒絕新commit／不產副作用，可回既有read-onlyreceipt供查詢；不同candidate同PA則conflict |
| Next-PA stale callback | 不得執行；有舊receipt也只可查詢。currentactor已變不允許舊callback以新caps重新算 |
| Legacyabsence | 無newmode標記的舊PA保持原legacyguards，不遷移、不回填receipt／能力／defensefacts；外來newcandidate不能接管舊PA。已resolved舊資料拒絕重送；newmodetag存在而必需refs缺失則BLOCK |
| Stable Save boundaries | freshPA／真pendingpitch尚未執行、完整PAcommit後、nextPA已開始後；均須保留原pendingpitch/IDs與lookuprefs |
| Pending-BIP | 僅同一同步handler內局部工作；不得await/timer/UIconfirm/save，預期不形成可載入中間狀態。callablecallback永不序列化 |
| Partial exception | 一旦canonicalstate/log/record/receipt只完成部分，BLOCK、不重抽／重套／補PA／發growth；停止playback及新mode後續；不得宣稱同步即crash-safe |

`save.js` 現有 Object.assign 保留log/Moment可選metadata，OPA normalize保留context／officialBallInPlayOutcome但刪未列出的頂層欄位，因此**存在不改SaveSchema的穩定邊界候選方案**，尚未實測。[S:R06/R12] 不能在新OPA頂層塞receipt再假設會保存，也不能引入第二持久journal。

R4驗收需檢查：metadata不被normalize遺失、舊Saveabsence、兩端reload／下一PAlookup、同步handler是否真的無autosave/yield、異常後是否可能再被存下部分狀態，以及partialcopies必須拒絕自動續行。S1先限定current-indexVM受控vertical；**live Save安全與自然rollout未獲本輪批准**。若不能在已批准接點內達成可接受防重／阻止錯誤續行，R4立即 **BLOCKED**，精確提出Save/canonicalowner/journal所需新授權；不得靜默加檔。[I:R4]

### 10.3 Evaluation／Career 保護

統計、實際執行證據、教練/球探/position解讀、永久成長、未來角色機會是五層。S1只讓原offenseMoment與PAevidence連到同球execution。對方NPC不增加玩家SSroutine/meaningful；PA後skills/skillProgress/developmentsettlementIDs不變。只在原match-end `settleHighSchoolYearOneMatch→settleMatchExperienceDevelopment→applyDevelopmentResult` 處理成長；不改formula/threshold/scoutscalar。[S:R13]

## 11. R3 — Controlled Scenario 與 Positive Acceptance

**設計範圍凍結：** scenario `S1-NPC-SS-EMPTY-O0/O1/O2` 各自fresh正式Match／合法已准入PlayerDetailedPA。玩家batter，真actualP及不同NPCSS/1B；空壘；fairground且SSprimary；一個secureFirstBaseOut、完整BRcontest。接到同Match下一棒或由原halfowner合法換半局。這是受控vertical，不是自然分布或完整比賽engine驗收。[I；R05–R14/R18]

fixture／seed／external sample table在Sprint1測試實作**前**一次明列於新test檔，經正常prepare/admission建立coherentbefore與ledger。若受控初始outs設定用fixture，必須明列setup、runner/score/order/record前提並驗state/recordintegrity；不能在pitch後改outs或log湊outcome。R0不建立fixture、不執行這些新情境。

actualpitch仍由原AIselector／control生成，不用hitterPitch／actualPitchfixtureoverride取代它。若需固定recognition/contact/foul/physical/stage samples，僅在testVM對原resolver已有options做明列外生輸入注入，保留publicchoose→原handler路徑與callback來源；不能覆寫selector回傳、直接製造ball/result或在生成後換truth。未有合適入口就列接點gap，不能搜尋seed。Take分支正常不contact；contact/power的同球成功case與route對照case分開。[I:R3；S:R05/R06]

| Positive ID／主題 | 可直接實作的驗收要求 | 測試group／入口 |
|---|---|---|
| P-A True Capability | 同actor/context/外生samples單變batting或activePcontrol；真inputpath/value/scale與中間量可追溯，無TeamStrength重複bonus | CAP：S1新contract/integration |
| P-B Actual Pitch／single selector | actualAI createTacticalPitchDecision唯一消費意圖；resolvePitchControl改realizationStability/distribution，no forcedpitch override | PITCH：S1 production handler instrumentation |
| P-C Player Decision | take/contactSwing/powerSwing均走chooseHighSchoolYearOneMatchMoment→resolveHighSchoolYearOneMatch；同合法pitch choices產生可觀測action/count/swing差異 | DECISION：S1 public handler三route |
| P-D Same Physical Identity | contact→truth→Opportunity/Reach/Secure/Throw/Receive→runner/PA refs全保留原physicalId；Physical一次、沒有第二pitch/contact | ID：S1 identity chain/counts |
| P-E Actual NPC Defense | actualopposingSS/1B＋真Reach/Secure/Throw/Receive consumers；玩家僅控batter | NPC：S1 actor/capability snapshots |
| P-F Legal Settlement | O0/O1/O2乾淨BR-before-first；Force/orderedretirement/third-out由既有rules，原PAownerapply一次 | SETTLE：S1三outs情境 |
| P-G Game Record | onePA/oneBF/onePout/SS A+1/1B PO+1，乾淨球E不加；defensivePlayId去重，非player defensewriter | RECORD：S1 ledger與action對賬 |
| P-H Continuity | 同Match，after接下一事件before；原order/halfhelpers執行一次；O2不得仍在同半局 | NEXT：S1 next PA或half transition |
| P-I Evaluation | 原offenseMoment含decision/execution/outcome與來源ref；NPC不產playerRoutinePlay/SSlearning；PA不提早growth | EVAL：S1 evidence/permanent-state snapshots |
| P-J Save／Reload | pre-pitchpending/postcommit/post-nextPA stable checkpoints無新draw/PA/growth；partial refs拒絕；matchend只原owner | SAVE：S1 stable reload/failure injection |

**能力敏感性**：固定actorId、context、decision、identity與合法外生samples，只改單一來源能力；看contactScore／margin／realizationStability/distribution有理據差異，不要求每次hit/out改變。換actor測身份／runtime，與固定actor測能力分開。未標記的default、TeamStrength再加成或未來roster回填都不能通關。[R07/R18]

### Outs 0／1／2 的乾淨出局規格

| before | canonical結果 | 原流程continuation |
|---|---|---|
| 0outs、空壘 | BR在一壘前出局，outsAfter1，空壘、score不變，PA/BF/Pout各+1；SS A+1、1B PO+1 | playerteam打序advance一次，下一事件同半局且after接before |
| 1out、空壘 | 同上但outsAfter2 | 同半局下一合法事件；不保證下一事件仍玩家PA |
| 2outs、空壘 | BR-before-first為第三出局；outsAfter3、basesAfter全null，legalruns0，score不變 | 原pendingHalfInningTermination→endHalf；不得仍進同半局nextbatter。新半局outs重置由原owner，PAevent.after保留該球3outs |

每情境在正式commit前已由原Force／timing／orderedretirements證實這個out，而非先指定out再填接傳。S1成功case先以完整cleanfield→throw→receive→baseTouch鏈驗收；零failedactions時existingScorerEligibility可回零contests／零E，需action證據完整。safe/error/recovery不足時停候選，不能預設安打／失誤／出局。[R08/R09/R11]

## 12. R3.2 — Negative Acceptance Matrix

下列均為 **Sprint 1待實作測試規格，本輪沒有執行新Gameplay**。REJECT表示無canonicalwrite；BLOCK表示禁止自動續行／另取樣，保留facts並回報；LEGACY只在尚未進same-ballexecution且原本不eligible時成立。group可寫在兩組新tests中，不要求另開23個helper檔。[I:R3]

| ID／觸發 | 合法預期行為 | 既有owner | 回應 | 必須測試 | S1 blocker |
|---|---|---|---|---|---|
| N01 PhysicalId mismatch | 原offense owner驗證candidate引用與原truth；拒絕異球 | 原offense owner＋OPA identity | REJECT | ID：same physical chain | 是；若違反即停 |
| N02 PA identity mismatch | 只接受仍在執行的當前PA；不可從current roster補歷史PA | 原offense owner＋OPA identity | REJECT | ID：wrong PA | 是；若違反即停 |
| N03 Batter／batting slot mismatch | 比對當前lineup/slot及expected-before；零state/ledger變更 | 原offense owner＋OPA identity | REJECT | ID：batter and slot independently | 是；若違反即停 |
| N04 Pitcher identity mismatch | actualP、runtimeId、PA.context、actualPitch、record所用P一致；placeholder不進新mode | actual-roster/player adapters＋原handler | REJECT | CAP：pitcher/cache/context | 是；若違反即停 |
| N05 SS／1B actor mismatch | Opportunity/throw/receive actor必為actualopposingroster；不得用player | Opportunity／ReachSecure／DecisionThrow | REJECT | NPC：wrong defender/receiver | 是；若違反即停 |
| N06 Roster assignment changed | 比較actor/assignment fingerprint；pendingpitch/BIP中不換人、不重抽 | Opportunity／ReachSecure／DecisionThrow | REJECT | NPC：assignment changed after capture | 是；若違反即停 |
| N07 同一Candidate重複提交 | 原offense owner先查已提交refs；回duplicate拒絕新commit，可附既有read-only receipt | 原offense owner＋GameRecord refs lookup | REJECT_DUPLICATE | ONCE：identical resubmission | 是；若違反即停 |
| N08 相同PA的conflicting Candidate | 同PA/differentphysical/action/settlement即conflict，不能覆蓋舊結果 | 原offense owner＋GameRecord refs lookup | REJECT_CONFLICT | ONCE：different payload same PA | 是；若違反即停 |
| N09 原PA已提交 | resultApplied及durable refs一致則拒絕再提交；partial/mismatch不補套 | 原offense owner＋GameRecord refs lookup | REJECT_OR_BLOCK_PARTIAL | ONCE：committed PA | 是；若違反即停 |
| N10 下一PA後舊callback | 仍可查舊receipt，但拒絕late callback執行/commit；不重做pitch或defense | 原offense owner＋GameRecord refs lookup | REJECT_STALE | ONCE：after next PA starts | 是；若違反即停 |
| N11 Pending-BIP prepareNextPitch | OPA/PlateDecision/script三層barrier，不建立pendingPitch或新的Situation | OPA／PlateDecision／原handler | REJECT | PENDING：prepare count and pitch ID unchanged | 是；若違反即停 |
| N12 Already-resolved結果重抽 | execution facts/receipt讀取只lookup；selector/Physical/roll計數不增加 | 原execution producer／原handler | REJECT | RNG：repeated query/resolve | 是；若違反即停 |
| N13 非SS責任ground | 未進同球execution前走明列legacy mapper；已進後發現錯責任則拒絕 | 原OPA／OutcomeMapping／PA owner | LEGACY_BEFORE_ENTRY_ELSE_REJECT | BRANCH：2B/3B/1B primary | 是；若違反即停 |
| N14 非Ground Ball | line/fly/HR保留原有對應mapper與provenance；不能捏造成SS ground | 原OPA／OutcomeMapping／PA owner | LEGACY_BEFORE_ENTRY | BRANCH：airborne/outcome path | 是；若違反即停 |
| N15 Foul／Take／Whiff | 原OPA/PlateDecision正常count/terminal，不叫same-ballfair-BIPadapter；不把正常球判錯誤 | 原OPA／OutcomeMapping／PA owner | EXISTING_COUNT_OR_TERMINAL | BRANCH：all three non-fair-contact outcomes | 是；若違反即停 |
| N16 Missing actual capability | 缺source/finiteconsumed值或假placeholder/default provenance則新mode拒絕；數值1若有真來源不自動判假 | actual-roster/player adapters＋原handler | REJECT | CAP：missing/mislabeled source | 是；若違反即停 |
| N17 Receiver unavailable | 真receive failure保留；既已進入same-ball時不得事後轉舊mapper；S1未有recovery則停候選 | RunnerThrowSettlement／Force／scorer＋原PA owner | BLOCK_CANDIDATE | FAILURE：not ready/not secured/offline delivery | 是；若違反即停 |
| N18 Unresolved live-ball recovery | first-leg continuation有pending/liveBallRecoveryRequired，不視為完整PA | RunnerThrowSettlement／Force／scorer＋原PA owner | BLOCK_CANDIDATE | FAILURE：first-leg not whole play | 是；若違反即停 |
| N19 Missing scorer evidence | 必要scoring/attribution證據未閉合即拒絕；乾淨出局可用同球完整action與零失敗contests證明，不可用空陣列掩蓋失敗 | RunnerThrowSettlement／Force／scorer＋原PA owner | BLOCK_CANDIDATE | FAILURE：missing scorer/action dependencies | 是；若違反即停 |
| N20 Partial commit／GameRecord inconsistency | 不重新套Match/evidence；BLOCK，停playback、不自動修補或領growth；需journal/Save變更則升級授權 | RunnerThrowSettlement／Force／scorer＋原PA owner | BLOCK | FAILURE：inject failure between canonical writes and event/receipt completion | 是；若違反即停 |
| N21 Save/Reload stale pending facts | stableboundary cross-checktag/PA/pitch/ref；new-modepartial/pendingBIP狀態拒絕續行；不以currentroster重建舊facts | 現有Save normalize＋原handler lookup | BLOCK | SAVE：pre-pitch,postcommit,post-nextPA and corrupted copy | 是；若違反即停 |
| N22 過早development | PAcommit後不呼叫match-endgrowth；原match-endowner未完成不得改permanentprogress | 原match-end Development owner | REJECT | EVAL：snapshot growth IDs/skills/progress and invocation counts | 是；若違反即停 |
| N23 Compressed／既有玩家SS回歸 | mode-off原results/state/record/RNG/learning契約不變；回歸即停止Sprint，不擴allowlist | 原Compressed／playerSS owners | BLOCK_SPRINT | LEGACY：current existing bounded compatibility and source guards | 是；若違反即停 |

上表NPC、P、runner、metadata、PAcommit規則仍由§7–10所列既有owner執行；新的adapter只做source mapping／purecomposition／validation。沒有任何negative允許重跑Compressed PA製造替代結果。

### Unsupported 與兩種 fallback

- **pre-entry不eligible**：非SSground、line/fly/HR、occupiedbases／多runner／DP、非faircontact，沿明列原legacy/count/terminal路徑；不能改方向、責任或outcome，必須保留其實際mode/fallbackprovenance。
- **already-entered但未閉合**：reach/securefail、throwoffline、receiverunavailable、未解liveball、缺必要scorer／thirdoutproof，停該candidate；不事後呼叫舊mapper、CompressedPA、第二顆球或強制成功。S1若要支援這些完成結果，須先審查具體recovery/closure契約。

**完成定義分開：** 受控vertical完成＝三outs情境、P-A–J與N01–23、limitedlegacycompatibility及R4/R5全部過；自然rollout完成還需safe/error/recovery、多runner／branchcoverage與更廣Save/continuity見證，屬後續授權，不能用受控成功取代。

## 13. R2.5 — Sprint 1 精確 Allowlist 提案（未授權）

| 類別 | 建議路徑 | 只允許的責任／函式邊界 |
|---|---|---|
| 新purecontract | `contracts/match-vnext-execution-v0.1.cjs` | identity/provenance/candidate validators；無RNG、Matchwrite或第二commitAPI。供browser用須classic-script/CommonJS雙匯出 |
| 新pureadapter | `match-vnext-same-ball-execution-adapter.js` | actualNPC/runner輸入組合既有purefoundations；不得複製計算式 |
| 打擊接點 | `plate-decision-foundation.js` | prepare的pendingguard；resolve的trustedcallback分開傳遞，保留route/count/lifecycle |
| OPA接點 | `offensive-plate-approach.js` | prepareNextPitch擋pending；新增completeHeldBallInPlay狹小statecompletion。原Physical/contact/mapper/RNG演算法不改 |
| ActiveP／context | `script.js` | ensureHighSchoolPitcherRuntimeState、ensureHighSchoolOffensivePlateAppearanceState，opt-in真actor/control/contextbinding與新pitch前refresh |
| handler／PAcandidate | `script.js` | prepareHighSchoolPlateDecision、resolveHighSchoolPlateDecisionPitch、resolveHighSchoolOffensivePlateAppearance、resolveHighSchoolOffensiveDecision、recordHighSchoolMeaningfulPlateAppearance：trustedhook、pendingcompletion、identity/lookupchecks、mutuallyexclusivecandidatebranch及dispatch前metadata；可加同責任小型privatehelpers |
| 載入 | `index.html` | contract/adapter依賴全部已載入後、script.js之前；不可重排既有標籤或借Receiver例外自動授權新tag |
| 新contracttests | `tests/match-vnext-same-ball-execution-contract-test.cjs` | identity／closure／provenance／negativevalidation，無newengine |
| 新productiontests | `tests/match-vnext-same-ball-production-integration-test.cjs` | current-indexVM、真publichandler、受控O0/O1/O2、capability/selector／ledger/evidence/reload/legacyparity；setup內嵌於此test，不另建fixture檔 |

建議載入位置：現有script.js之前、且 `force-advancement`／DecisionThrow／RunnerThrowSettlement／Ground／PlateDecision／OPA等依賴都已載入。contract不要求在OPA定義時接管它；由script runtime注入。瀏覽器以classic script載入.cjs是否符合server MIME/CSP，需要最小loader驗證；若必須改副檔名或加載入shim，先回報精確額外路徑，不自行擴scope。[S:R14]

**另案 source-freeze 授權清單須獨立審核：** `tests/pitch-production-source-scope.cjs` 中上述script函式與外部hookwiring的新exactdelta；五套原projection integration測試對OPA／PlateDecision／Index等實際comparison與共用load/checkhelper。候選caller為：
`tests/pitch-tactical-decision-production-integration-test.js`、
`tests/pitch-tactical-interpretation-production-integration-test.js`、
`tests/pitch-tactical-decision-production-adapter-integration-test.js`、
`tests/pitch-tactical-intent-evidence-integration-test.js`、
`tests/pitch-tactical-signal-projection-production-integration-test.js`，
以及scope-unit `tests/pitch-production-source-scope-test.js`。這是**需另核對並授權的候選範圍**，不是默認允許改這七檔；優先新增精確comparison helper能解決時保留trackedWIPcaller。若必須改caller或新增helper，先列before/after/pin/negativeguard再求scope批准。R0沒有改這些檔案。[R01/R02/R04/R17]

不可變：`save.js`、`match-game-record.js`、`match-experience-development.js`、`player.js`、既有Physical/守備/runner foundation算法與schema、script canonicalfactapplier／third-outrules／playerdefensecommit／match-endgrowth／order-half核心、Receiver、UI-P2.4B。若新分支做不到而需要這些變更，必須升級授權，不在adapter重造owner。

若原full-file comparisons必須新增共用精確delta checker，建議另案候選路徑固定為 `tests/match-vnext-source-delta-v0.1.cjs`，負向驗證併入上述新contract test，避免再新增測試檔。checker只能以原pins與逐項批准的literal/function/wiring變換推導expected source，不可接受任意current source或整檔新hash。這個額外候選也必須明列於使用者授權，R0沒有建立它。

## 14. Legacy Invariants、R4／R5 與停止條件

| 必須保留 | Sprint 1驗證責任 |
|---|---|
| Compressed PA能力與模式 | 原AIOutcome contact/power/discipline/Pcontrol/context算式、authority/trace、tokensettlement及無pitchhistory不變；mode-off result/state/record/RNG等價 |
| 原玩家SS decision/routine | 原admission、source、wrapper、runner/scorer/playercontribution與learning不變；NPC不可走playerwriter |
| One selector／one physical | 既有AIselector唯一產意圖，新Observation/Decision只projection；一球一truth，query/replay/reload不再抽樣 |
| Match／Record一致 | 原MatchID、before/after、runnerIDs、lineScore、order、PA/BF/Pout與actorattribution對賬 |
| Snapshot repair | Moment保持當球resolution，不恢復終場overwrite；R1exactexception不得放寬為未來consumer白名單 |
| Development／Career | 單PA不得提早成長；原matchenddedup／exposure／rolethreshold不改，不要求每場升級或改先發 |
| Save | 無schema/migration/journal；olddataabsence不回填；穩定邊界reload與partialfailclosed需新見證 |
| Public／Presentation | 不接F1/F2、不讓UI決定結算；不把candidate公開為結果 |

R4待驗：PA-wide防重不等於GameRecord單層dedup；optionalmetadata能否通過Save/OPA normalize；post-nextPAlookup；partialcommit／exception／autosave可見性；loadednewmodependingfacts的拒絕；callbacks不入Save。**尚未證實crash-safe原子性**。

R5待驗：actualP/SS/1B/playerBRbinding、livebatter與真control消費、control尺度／runtime刷新、單能力counterfactual中間量、actualsingleAIselector與routefacts。Stuff/repertoire/stamina、manualcatchercall、playerpitcher完整路由均DEFER；genericpitchprofile如實標示。[R07/R18]

施工順序：先批准§13精確source-freeze與Gameplayscope→真activeP/controlbinding→trustedhook/pendingbarrier→NPCpurefacts與runner/scorerclosure→原offenseowner唯一commit及metadata→P-A–J/N01–23與limitedlegacychecks→stableSave及match-end唯一成長驗證→停止。不得順勢開始UI／ConnectedLoop自然rollout。

Stop：需新增SaveSchema/journal／第二authority；需要改未批准檔／pre-existingWIP；actor/physical/provenance對不上；candidate未閉合；only-safe/error分類缺證據；重複PA/record無法拒絕；freeze未另核准；回歸靠reroll/換球/強制成功通關；callback可能序列化或pending多投一球。出現即停止相關工作、保留rawfact／failure，不自行放寬檢查。

## 15. 本輪 Integrity 與驗證範圍

唯一允許且已變更的既存檔是guard helper，兩個R0文件為唯一新增。對所有1,947個開工可讀檔做完整hash比較；除helper exactdelta外其餘不變。前輪1,945比較也只多出同一helper delta；原T10仍是相同hash `a2de3df778b64378341c77d5da748df0bb1beb0c68e93ea207bb21a4ecad4144`。完整結案數值、status／refs／index／protectedmetadata、exactpatch及readback見Evidence.integrity。[S/T]

R0只執行G01記憶體source mutation、G02既有scope-unit、G03既有T10；沒有新Gameplay test/harness/fixture/adapter/contractJS。三組計數分別23checks／7cases（內含131mutations）／12cases，不混為全庫PASS。只有T10會執行原有玩法；R2/R3全為SourceReview及設計。[T]

靜態reverse probe曾因PowerShell→Node stdin中的非ASCII literal被編碼成問號，產生一次probe comparison false；已改為讀取actualUTF-8 insertion並用Unicodeescape核對，反向結果精確回到before hash。這不涉及Production／helper再修改或測試verdict改寫；原probe與更正檢查均保存於Evidence。

## 16. Source Index、交付與停止

| Ref | 目前精確來源 |
|---|---|
| R01 | tests/pitch-production-source-scope.cjs:6–92、155–239；舊版以開工hash及GitHEAD定位 |
| R02 | tests/pitch-tactical-decision-production-integration-test.js:1–113、114–215 |
| R03 | docs/match-moment-snapshot-integrity-repair-v0.1.md:19–30；production-delta /edits/0、source /exactProduction、closeout /authorizedDelta |
| R04 | docs/source-freeze-contract-reconciliation-v0.1-phase-b.md:9–33；authorized-contract /manualAuthorization、/callerSpecs |
| R05 | script.js:10711–10776、13720–13740；plate-decision-foundation.js:17、39–124 |
| R06 | offensive-plate-approach.js:198–231、322–325、444–474、507–658、671–674 |
| R07 | offensive-plate-approach.js:247–303；pitcher-catcher-tactical-integration.js:294–343；pitch-sequencing.js:157–215 |
| R08 | script.js:4954–4994、5003–5022、5160–5379、11938–12041；Opportunity:58–147；ReachSecure:30–114；DecisionThrow:142–165、219–359 |
| R09 | RunnerThrowSettlement:15–132、160–185；ForceAdvancement:35–69、103–184；script.js:6847–6904、12256–12271 |
| R10 | script.js:6730–6760、11005–11139、12280–12443；GroundDefense:146–225、320–402；OutcomeMapping:35–77 |
| R11 | script.js:4343–4374；match-game-record.js:137–200、226–274、294–340 |
| R12 | save.js:173–240、375–406；OPA:198–231 |
| R13 | script.js:13093–13181；match-experience-development.js:465–474、581–622；player.js:275–386 |
| R14 | script.js:6624–6677、7036–7081、13567–13694；index.html:179–214 |
| R15 | Blueprint／Gameplay Audit／Readiness 的本輪hash核對與指向；歷史T10 /tests/executions/9 |
| R16 | tests/match-m0-after-r2-admission-context.cjs:1–96；match-authority-coverage-audit.cjs:13–33；baseball-match-foundation-2-2-4-3-audit.js:19–59 |
| R17 | tests/pitch-production-source-scope-test.js:1–60 |
| R18 | script.js:6525–6568、10483–10510、10634–10695、4492–4498；team-roster-foundation.js:28–30、119–134 |

配套Evidence保存source SHA／caller-callee、exact authorized edits、pins／before-after function hashes、rawtests、R2signatures／receiptpolicy、R3positive/negative、futureallowlist與未驗gates。上表縮寫的完整路徑均在Evidence.sources，不把Graph舊行號當現況。

**R0 Contract Review＝AUTHORIZED；R1 Exact Historical Guard Reconciliation＝條件成立且已完成；R2／R3 Production Implementation＝NOT AUTHORIZED；Match vNext Sprint 1＝NOT AUTHORIZED；F1／F2／Connected Match Slice＝NOT AUTHORIZED；UI-P3／Match Director＝NOT STARTED；Sprint10B＝NO；Receiver v2＝DISABLED；Ready for Commit＝NO。**

建議將 **SPRINT 1 READY FOR USER AUTHORIZATION** 送審；先批准新scope與freeze邊界，R4/R5列為Sprint1不可省略的完成gate。完成本兩份文件及helper修復後立即停止，等待使用者審核。

