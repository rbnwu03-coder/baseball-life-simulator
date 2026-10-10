# Shared Infield Contract & 2B Completion — Sprint 1

專案：Baseball Life Simulation（棒球人生）

日期：2026-10-10（Asia/Taipei）

設計依據：[Infield Defensive Integration Audit v1](infield-defensive-integration-audit-v1.md)

**Sprint 1.2：Legacy Pitch Freeze Closeout PASS；Sprint Delta Regression PASS；Full Repository Regression PARTIAL；Ready for Commit YES（有條件）。** 本輪實際重跑同一 227 manifest，結果為 **224 PASS、3 FAIL**，原 PASS → FAIL 為 **0**，新增 Production regression 為 **0**。三個舊 Pitch 套件已完整執行；剩餘三案為有原 HEAD 重現證據的獨立 Baseline Debt。Commit readiness 限本 Sprint 差異，需明列這三項 Debt 並排除受保護 WIP，等待人工審查；沒有執行 Commit。最新證據與 Gate 理由見 M；A–L 保留先前實作及 closeout 歷史。

## A. Baseline / WIP

工作目錄：`E:\meng\baseball_life_sim_semirefactor`。

| 開始前檢查 | 結果 |
|---|---|
| `git branch --show-current` | `main` |
| `git rev-parse HEAD` | `c54f81016ed6d495f6c6911ebae708c05bcf4b2b` |
| `git rev-parse origin/main` | 同 HEAD |
| `git diff --name-only` | `tests/fast-check-smoke-test.cjs` |
| `git status --short` | 上述 modified；`install.ps1`、既有 audit 報告 untracked |

受保護的 `tests/fast-check-smoke-test.cjs`、`install.ps1` 未讀取內容、執行、編輯或暫存；既有 audit 報告保留。Git stat 中的 smoke 變更屬開始前 WIP，不屬本輪。沒有 Commit、Push、Stash、reset、clean 或 Git add。完成時 branch、HEAD、origin/main 仍相同。

本機 default sandbox 的 shell 啟動出現 `setup refresh had errors`；後續 shell 使用工具核准的 sandbox 外執行。這與下文 Node assertion failures 分開記錄。

## B. Actual Architecture Before / After

使用已安裝 codebase-memory skill 作 Tier 2 查證，project 為 `E-meng-baseball_life_sim_semirefactor`。先查正式入口與 owner，再對 prepare / resolve / apply 作有界 CALLS trace，並讀當前 source。Graph 的動態 registry 呼叫不能只憑缺少 CALLS edge 推論不存在。

本輪觀察到 graph ready；收尾 coverage generation 為 `2026-10-10T08:14:06Z`。核心 owner 與引用測試路徑經 `check_index_coverage` 查證，為 `no_recorded_issue`，freshness 仍為 `metadata_changed`；因此所有重要判斷以當前 source 與執行結果為準。沒有主動 reindex，也沒有宣稱 graph 全域完整。

| Owner / 模組 | Before | After |
|---|---|---|
| DefensiveOpportunity / BattedBallGroundDefense | SS left/middle、2B right；unsupported infield 可落 synthetic | 原責任區不變；unsupported ordinary contact 使用同一 PA 結果及原 physical source |
| ReachSecure | SS canonical；2B control projection | 不變；不增加 control roll |
| DecisionThrow | SS first throw；2B legacy projection | 同一模組新增不可變 action facts 與 attribution projection；2B first throw authority 不變 |
| RunnerThrowSettlement / ForceAdvancement / Third-Out | ordered retirements、合法得分與唯一 apply owner | 不變；新增記錄消費既有退休事實 |
| MatchSituationLifecycle | supported ground 的 pending / execution / settlement | 保留；prepare mutex 適用所有已開啟 situation |
| MatchGameRecord | 部分 PO/A 依玩家守位；摘要偏單一玩家 | 新契約事件依 actor/action 投影至既有 playerLines；legacy event adapter 保留 |
| MatchExperienceDevelopment | 2B / SS stage、decision、outcome、attribution | emitter 不變；接收正確隊友歸責與最終合法得分 |
| normalizeSave / recovery | 既有 stage validation / cached replay | 在既有 script validator 中重建新 2B facts；歷史無新欄位的存檔維持原 admission |

正式路徑仍為：

```text
advanceHighSchoolMatchPlaybackStep
  -> prepareHighSchoolDefensiveMomentFromSimulation
  -> physical handoff / buildInfieldMeaningfulMoment
  -> getHighSchoolDefensiveMomentChoices
  -> chooseHighSchoolYearOneMatchMoment
  -> resolveHighSchoolDefensivePlay / existing infield resolver
  -> action facts adapter
  -> applyInfieldResolutionToHighSchoolMatch / routine adapter
  -> ForceAdvancement + Third-Out + applyHighSchoolDefensiveSettlementFacts
  -> final facts -> existing GameRecord / Evaluation / Save

unsupported ordinary contact
  -> original PA result -> existing PA apply / record / batting order
  -> no synthetic player ground situation
```

Source 比對確認下列函式 body 與 HEAD 相同：`applyHighSchoolDefensiveSettlementFacts`、`finalizeHighSchoolDefensiveThirdOut`、`normalizeHighSchoolTerminalRunnerChanges`、`resolveInfieldRelayToFirst`、`resolveSecondBaseCoverage643`。沒有第二份 runner settlement 或 totals。

## C. Modified Files

| 檔案 | 本輪用途 |
|---|---|
| [defensive-decision-throw-foundation.js](../defensive-decision-throw-foundation.js) | 六種動作、dependency、execution facts 與 actual retirement attribution |
| [match-game-record.js](../match-game-record.js) | 驗證 attribution 後才寫入；多 actor PO/A/E/DP；一球多事件去重與 reload identity |
| [script.js](../script.js) | ordinary admission、PA provenance、receiver、4-6-3 第二傳、共用 facts、event/cache/evidence 投影、2B rebuild 與舊 SS save 相容 |
| [shared-infield-contract-2b-production-integration-test.js](../tests/shared-infield-contract-2b-production-integration-test.js)（新增） | 17 項 focused checks；明示 production fixtures / public handler 與純合約 probes |
| [ss-defensive-production-integration-test.js](../tests/ss-defensive-production-integration-test.js) | 2B 明示 fixture 使用實際 player defender；SS 行為及斷言保留 |
| [bbp-b1-ground-ball-production-integration-test.js](../tests/bbp-b1-ground-ball-production-integration-test.js) | unsupported expectation 改驗原 PA，不再要求已確認有問題的 synthetic fallback |
| [ground-defensive-decision-identity-test-context.cjs](../tests/ground-defensive-decision-identity-test-context.cjs) | 明確宣告有重複 physical ground 的 seed `22430124` |
| [ground-defensive-decision-identity-repair-test.js](../tests/ground-defensive-decision-identity-repair-test.js) | 保留 stale / dedupe / public handler / counterfactual；依實際 current moment 對照 |
| [ground-defensive-decision-identity-production-integration-test.js](../tests/ground-defensive-decision-identity-production-integration-test.js) | 同一 physical seed；整場 deterministic、observer neutrality 與 sweep |
| [ground-settlement-handoff-r2-production-integration-test.js](../tests/ground-settlement-handoff-r2-production-integration-test.js) | 同一 physical witness；既有 22 項結算檢查保留 |
| [match-m0-after-r2-audit-test.js](../tests/match-m0-after-r2-audit-test.js) | 未結算 ground reload 使用正常入口 seed `440002`；原代表 cohort 不變 |
| 本報告、[validation.json](shared-infield-contract-2b-completion-sprint-1-validation.json)（新增） | 審查說明、完整 suite manifest、exit code、失敗摘要、基線比對、source SHA-256 |

測試變更的原因是 physical admission 修復後，舊固定 trajectory 可能不再產生第二次詳細 ground；不能用虛構球維持 witness。新 seed 由有界正常入口觀察選出，沒有賽中 ball、runner、capability 或 result override。比分 witness 隨明示 seed 更新，stale rejection、RNG/cursor、統計完整性與 save/replay 斷言仍保留；沒有藉改預期結果掩蓋 receiver / settlement 問題。

## D. Physical Admission Verification

Ordinary infield unsupported handoff 保留 physical truth、identity、direction、pace、depth 與當前 roster 的 defensive opportunity。它沿用 `legacyFallbackResult`，由原 PA owner 處理一次，再前進打序；不重新生成球，也不轉成玩家 primary ground。SS / 2B supported bins 沒有改動。

| 驗證 | 結果與來源 |
|---|---|
| SS left / middle、2B right | 既有 Opportunity 與 SS regressions 通過；責任定義不變 |
| 玩家 1B / 3B / 2B 遇 SS-side physical ground | 3 守位 × 0/2 outs × density 未達/已達，共 12 個明示 cases：一次 PA、一次打序前進、無 player defensive event、無 active ground situation |
| 原 physical truth | 記錄 PA 的 physical truth 等於保留的 handoff truth；當前 primary 仍為 SS |
| Unsupported airborne | 2B / 3B / 1B 的明示非 ground contact 不產生 ground decision |
| Supported density suppression | 真正觸發 density cap；系統自動 route、settle/close、legal scoring 與 receiver failure 均驗證 |
| 完整比賽 | identity、SS、GameRecord 等正式入口回歸完成且 integrity 為空 |

新增 ordinary PA metadata 時先由測試發現兩個缺口並確認失敗：reload 才補 classification/gate/tension；PA adapter 丟棄已傳入的 physical truth。現已在 fallback 初始化 `ordinaryPlay / null / none`，並由既有 PA event adapter 保留原 physical source、defensive opportunity、`existingOrdinaryPhysicalOutcome`。NPC / compressed PA 事件因此與玩家 routine defense 明確分開。

Synthetic scenario builder 保留供既有 isolated / declared diagnostics；正常 ordinary infield contact 已在 synthetic build 前返回。Bunt 與其他位置既有入口未擴張，本輪也沒有新增 1B/3B physical primary。

## E. Shared Action / Receiver Contract

`createActionFacts` 與 `projectDefensiveAttribution` 放在既有 DecisionThrow Foundation，沒有新 engine。

| 欄位 | 意義 |
|---|---|
| identity / playIdentity / physicalIdentity / sequence | 每球、每段穩定身份；declared legacy source 的 physicalIdentity 明確為 null |
| actorId / actorPosition / receiverId | 消費當前 roster actor；接球者和傳球者分開 |
| type / targetBase / runnerId / status | `field / throw / receive / baseTouch / tag / pivot` 與 attempted target、completed/failed/late/notAttempted/unavailable |
| dependsOn | 有序、只引用前段 action 的實際 ball path |
| provenance / responsibleActor | 既有 owned sample、capabilities、coarse timing、source stage 與歸責 |
| factType | action envelope 為 execution；由 ordered actual retirements 投影的 attribution 為 settlement |

資料 deep-clone / freeze；不更動 Match State、outs、bases、scores、lifecycle 或 simulationCursor，不讀 RNG。原始 execution 與最終 legal scoring 分開保留。

`baseTouch` 可直接形成 PO，不需要不存在的 throw；receive failure 不會因 throw completed 變成成功；pivot completed 不保證第二傳成功。所有 retirement 的 terminal baseTouch/tag 與 dependencies 都須 completed，否則 attribution 拒絕。

本輪的 base-touch completion 是既有實際退休結果的動作投影，尚不是獨立腳步／守壘幾何模型。1B/3B 自踩僅以純合約 probe 驗證 PO=1、A=0，沒有完成它們的 Production execution。

## F. 2B Direct Throw / 4-6-3 Verification

2B direct receiver 使用目前 lineup 的 1B、3B 或 C；失敗明示 receiver identity、readiness、secure、status 與能力來源。接球變異沿用該球既有 execution sample，沒有第二個 throw-success roll。傳球、控球與 timing 仍由原 2B resolver 決定。

| Direct case | Player throw | Receiver | 最終結果 / 歸責 |
|---|---|---|---|
| Delivery 未完成 | notCompleted | notAttempted | 無出局；玩家傳球環節 |
| Delivery 完成，receiver 不可用／接不住 | completed | unavailable / failed | 無虛構出局；隊友歸責，玩家 E=0 |
| 傳接完成，runner 先到 | completed | completed | 無出局；timingWindow |
| 傳接完成，有效窗口 | completed | completed | 一出局；實際 1B PO、玩家 2B A |

Receiver failure 經公開 `chooseHighSchoolYearOneMatchMoment` handler 驗證。Expired window 的四分法 probe 使用已選 route 的 resolver diagnostic；不宣稱 UI 仍提供已失效 route。Reassessment 的 fallbackRelease 和接球結果也分開。

4-6-3 分出 SS receive、pivot、secondThrow、1B receive。第二傳沿用既有 cover/pivot 的門檻與同一 owned sample；弱第二傳可在 pivot 完成時失敗，保留第一個 force out。兩個 out 不共同擲一個 DP success roll。

完整 4-6-3 / 6-4-3 各有 ordered second/first retirements 與獨立 participant attribution。單次 resolve 消費一個 callback sample。SS 的 canonical first leg、relay model、raw timing facts 不改動：6 組 explicit scenarios 與 exact HEAD source 的 raw result 比對相同，只移除新加的 `actionFacts / executionSample` 後比較。

## G. GameRecord Actor Attribution

既有 GameRecord owner 依 actual retirement dependency chain 記錄：terminal baseTouch/tag actor 得 PO；對該出局有有效傳球的其他 actor 得 A；同球同 actor 的 A 不重複增加；實際雙殺參與者得 DP。E 需既有 execution 明確 `errorCharged`，不從 teammate failure 或 out 數推測。

| 情境 | 驗證的記錄 |
|---|---|
| 2B direct first out | player 2B A=1；實際 roster 1B PO=1 |
| 4-6-3 | 2B A/DP；SS PO/A/DP；1B PO/DP |
| 6-4-3 | SS 原合法 A/DP 保留；2B PO/A/DP；1B PO/DP |
| Player 2B cover / force / relay | PO=1、A=1、DP=1；來源明示 declared legacy，不冒充 physical SS feed |
| 普通隊友 receive failure | 玩家 E=0；沒有虛構 PO 或 DP |
| Confirmed receiver error contract probe | 只有 receiver E=1；player E=0；與 PA error totals 一致 |
| 1B / 3B baseTouch contract probe | PO=1、A=0 |

多 actor 紀錄寫入原有 `playerLines`，沒有平行 ledger 或 totals。統計 owner event 保留 play identity，`defensiveResolution` 可追溯同球但不再計統計；reload 後 identity 仍可去重。Confirmed error probe 同一 play 用另一 sequence 重送亦不重記。

新 attribution 在任何 inning/stat write 前重建驗證；偽造 PO projection 拒絕，GameRecord 完全不變。未提供新契約的歷史事件維持舊 adapter，沒有事後改寫舊賽事統計。

## H. Evaluation / Save / Exactly-Once

Evaluation 沿用既有 2B/SS emitter。Decision、player execution、teammate execution、outcome 和 attribution 分開；receiver failure 的 5 個 active records 保留 teammate attribution，skill adjusted values 非負。公開 handler 的明示 diagnostic 中，player baseballSkills 不變，coachTrust **7→7**；coach feedback 明確指出玩家責任環節已完成。

Routine / meaningful event、completed moment、lastDefensiveResolution、GameRecord、Evaluation 都消費最終 legal scoring。0 outs loaded case 允許得分；2 outs 的第三出局取消該 scoring attempt，保留 attempted target；raw execution/action facts 不覆寫。

| 保存／重送階段 | 驗證 |
|---|---|
| Pending | 真正 save/load 換 player context；situation / choices identity 保留 |
| Executed 未 settled | 同 sample 重建；receiver/action facts 等價；recovery 套用一次 |
| Failed control / receiver failure | 無虛构 out；上述 reload 路徑仍完成 |
| Settled / cold reload | match facts、cache、raw execution 等價；duplicate 無 mutation、無 reroll |
| Stale receiver capability / identity / action actor | normalizeSave 拒絕；既有 route / timing stale regressions 通過 |
| Rebuild | 將 Math.random 設為 throw 仍通過；simulationCursor 不變 |
| 舊 SS executed save | 移除 optional 新欄位的 historical shape 仍 admission / settle；既有 raw facts 照常驗證 |

新 2B validation 僅對帶新 action contract 的 execution 重建；無新欄位的歷史 stages 沿用原檢查。没有新增 1B/3B active evidence emitter，也沒有直接從 GameRecord out 數推論 skill quality。

## I. Focused + Regression Results

先建立 R1 / receiver / actor stats 的失敗測試，再改 production。另用當前合法 fixtures 配 exact HEAD production sources 的記憶體 substitution，確認初始四類缺陷仍失败；沒有 checkout/reset source。Cold reload、PA truth、偽造 attribution 的新增斷言也先觀察 red，再修正。

下列均在最終 closeout 中完成；詳細清單、各 suite exit code、duration、failures 與 verified source SHA-256 見 [validation.json](shared-infield-contract-2b-completion-sprint-1-validation.json)。

| 套件 | 結果 |
|---|---:|
| Shared Infield focused | 17/17 PASS |
| Defensive Opportunity Production | 14/14 PASS |
| Defensive Decision Throw Production | 16/16 PASS |
| Defensive Runner Throw Settlement Foundation | 22/22 PASS |
| Force Advancement Foundation | 22/22 PASS |
| Match Full Game Record | 13/13 PASS |
| Match Experience Development Foundation | 46/46 PASS |
| SS Production Integration | 26/26 PASS |
| BBP B1 Ground Production | 20/20 PASS |
| Ground Decision Identity Repair | 15/15 PASS |
| Ground Settlement Handoff R2 | 22/22 PASS |
| Match M0 after R2 | 16/16 PASS |
| Ground Decision Identity Production | PASS；正常入口 witness 與 sweep |

正常入口 seed `22430124` 完成整場：home 4 / away 7、PA=73、pitcher BF=73、outs=42、record final；有兩次 physical ground lifecycle。觀察器 ON/OFF、repeat、cursor、stale submission 與 integrity 檢查通過。M0 的 unresolved ground reload witness 用正常入口 seed `440002`；原 starter/bench cohort `440000 / 440201` 保留。

這些是 harness 的合法 production entry witnesses，並非自然生涯分布或守位頻率 cohort。Focused 中改 roster、runner、capability、physical roll 的 cases 全部明示為 fixtures；baseTouch / confirmed error 則為純合約 probes。

### 前輪完整 Closeout 與未解失敗（歷史記錄）

附件要求前次 49 套件，但附件與 repository 未提供該 exact manifest；本輪已提出非阻塞澄清，未取得清單。因此使用所有當前非受保護 `*test.js / *test.cjs` 的 **227 套件** 作較廣驗證，排除 protected smoke。不能宣稱已逐項核對前次 49。

第一輪 213 PASS / 14 FAIL；修正本輪缺陷及失效 witness 後，最終完整清單 **218 PASS / 9 FAIL**。所有 227 都有 completion / exit code，沒有 timeout 或略過失敗。6 個 failures 已用 exact HEAD production sources、相同測試輸入重新執行確認 baseline 也失敗。

下表是前輪判斷。後三列的「Baseline HEAD PASS」已由 L 的實際 main-entry 重跑推翻；不得沿用為有效證據。

| 未通過套件 | 診斷 | 前輪 Baseline HEAD 判斷 |
|---|---|---|
| `ability-performance-gradient-test.js` | Low tier multi-hit assertion | FAIL |
| `baseball-match-foundation-2-2-2-test.js` | check 36：要求完整比賽兩個既定 offensive moments | FAIL |
| `high-school-year-one-opportunity-two-integration-test.js` | 舊 partial runtime 未載入 DefensiveDecisionThrowFoundation | FAIL |
| `pitch-sequence-state-production-integration-test.js` | 整份 script.js 凍結比對，line 139 | FAIL |
| `pitch-tactical-decision-production-integration-test.js` | 同類凍結比對，line 167 | FAIL |
| `pitch-tactical-interpretation-production-integration-test.js` | 同類凍結比對，line 155 | FAIL |
| `pitch-tactical-decision-production-adapter-integration-test.js` | runtime checks 後整份 script.js 凍結比對，line 181 | PASS |
| `pitch-tactical-intent-evidence-integration-test.js` | runtime checks 後整份 script.js 凍結比對，line 215 | PASS |
| `pitch-tactical-signal-projection-production-integration-test.js` | 13 個 runtime/reload checks 通過，後續整份 script.js 凍結比對，line 266 | PASS |

前輪把後三個 freeze failures 歸因於 infield script 修改；L 已更正：它們在正式 HEAD 也有歷史整檔 source mismatch。本輪完成指定的有界 freeze 修正，未替換歷史 implementation baseline 或修改投捕引擎。Signal projection 曾先因 fallback metadata 缺失而在 runtime reload 失敗；該先前真正的 Sprint 問題已修復，不把它歸為 freeze 或 baseline failure。

11 個本輪 JavaScript 檔案的 `node --check` 通過。`git diff --check` 通過；最後 status/stat 保留 protected WIP 並列出本輪 changes。Git 的 LF/CRLF 提示不算 assertion failure。

## J. Remaining Risks / Coverage Limits

- 2B control、first throw、timing 仍是既有 staged authority / projections，timingMargin 未成為 SS 等級的 arrival physics。新增合約沒有消除這個差異。
- Player 2B cover/pivot 的上游 SS source 仍是 declared legacy scenario；本輪補 actor/stats/source facts，未把它冒充同一 canonical SS first throw 的 physical continuation。
- Receiver secure 使用 coarse capability 與原 sample，不是獨立 incoming trajectory、伸展／挖地球或 base-readiness 模型。普通 miss 不自動記 E；只有明確 confirmed error facts 才記 E。
- 4-6-3 弱第二傳與 direct weak receiver 現會減少不合法的 outs；admission 修正也會減少 synthetic decisions。這是行為修復，並非能力／勝率平衡調整；本輪沒有以增強能力補償。
- 1B/3B primary physical entry、R2 自踩 execution、3B generic receiver、recurring scheduling、active defensive emitter 未施工。它們保留給後續 Sprint；本輪没有開始 Sprint 2。
- 非內野 assignment、bunt、outfield、投捕與打擊決策不在本輪新增範圍。沒有新增 UI、敘事、守位 bin 或另一套 settlement。
- 歷史 events 不做 stats backfill；只在新契約事件投影。Compatibility probes 不能證明所有年代與所有非 ground save schema。
- 前輪的 9 個 failures 與 exact 49 manifest 問題保留為歷史記錄。本次使用者指定原 227 manifest 作 closeout；九案最新分類與三個 freeze 修正見 L，沒有宣稱完成 exact 49 對照。

## K. 前輪 PASS / PARTIAL / BLOCKED / FAIL

**PARTIAL。** 已交付可審查實作，核心 focused / SS / settlement / GameRecord / experience regressions 通過；single owner、raw execution、final scoring、actor attribution、reload 與 exactly-once 有直接證據。

由於完整 closeout 仍有 9 個 assertion/runtime failures，且前次 49 清單未能精確核對，不能提升為整體 PASS。沒有工具權限 BLOCKED，也沒有把未完成的 1B/3B integration 包裝成完成。

本輪停止於實作、測試與報告，等待人工驗收；未 Commit、Push 或操作 Stash。

## L. Regression Closeout — 2026-10-10（前輪歷史，最新結果見 M）

本次範圍只含九個失敗的獨立分類、指定三個 freeze 的最小修正及回歸驗證。開始與結束均為 `main`，HEAD 與 origin/main 均為 `c54f81016ed6d495f6c6911ebae708c05bcf4b2b`。開始前的 Sprint diff 完整保留；三個 Production 檔案、八個 Sprint 測試／context 及原 audit 報告共 12 個檔案的 SHA-256 前後相同。

受保護 smoke、install 僅檢查檔案大小／mtime；smoke 的既有 diff numstat 仍為 `10/0`。沒有內容讀取、執行或修改，原 audit 報告不變。沒有 reset、clean、stash、Git add、commit 或 push。Shell sandbox 啟動限制由獲准的外部執行處理，九案沒有因環境或 timeout 失敗。

### A. 九個失敗分類

**重要更正：原九案都能在正式 HEAD 重現。** 前輪及本次第一個診斷嘗試把三個 `require.main === module` 套件當成可直接 `require()` 的入口，未執行其 assertions；exit 0 不能算 PASS。本次改以 `Module._load(entry, null, true)`、原 argv 與相同測試 bytes 執行，取得完整 runtime／freeze 輸出。無效嘗試與更正原因保留在 freeze evidence；既有 validation 歷史欄位保留並明確標示失效。

下表的 assertion 為修正前原始測試位置；完整 stdout、stderr、實際／預期值、source/input hashes、命令、環境與 root cause 見 [baseline evidence](shared-infield-regression-baseline-evidence.json) 及 [freeze evidence](shared-infield-regression-freeze-evidence.json)。字串差異沒有只靠 assertion message 分類。

| 測試（均位於 tests/） | Assertion／實際輸出 | 原 HEAD 同樣失敗 | Production delta 引起 | 分類／最小處置 |
|---|---|---|---|---|
| `ability-performance-gradient-test.js` | line 45：`Low tier can have a multi-hit game`；actual=false，expected=true；tier 8 固定 20 場 multiHitFraction=0 | 是 | 否 | **BASELINE FAILURE**；保留原 assertion、能力與 seeds，另立 variance 稽核 |
| `baseball-match-foundation-2-2-2-test.js` | verify line 106／check 36：actual=false，expected=true；completed=false、safety=1401、inning=2 上、outs=0 | 是 | 否 | **BASELINE FAILURE**；保留舊完整流程 assertion，另修 fixture／runtime 接入 |
| `high-school-year-one-opportunity-two-integration-test.js` | 前 37 checks 通過，第 38 live-engine case：`ReferenceError: DefensiveDecisionThrowFoundation is not defined` | 是 | 否 | **BASELINE FAILURE**；另修舊 partial runtime dependency manifest |
| `pitch-sequence-state-production-integration-test.js` | line 139／guard 8：整份 script 不等；HEAD 903395 chars、WIP 917975 chars，historical expected 886330 chars | 是 | 否 | **BASELINE FAILURE**，subtype historical SOURCE FREEZE；原測試不改，另審歷史邊界 |
| `pitch-tactical-decision-production-integration-test.js` | line 167／guard 8：相同整份 script mismatch；前 7 runtime checks 通過，guard 後未執行 | 是 | 否 | **BASELINE FAILURE**，subtype historical SOURCE FREEZE；同上 |
| `pitch-tactical-interpretation-production-integration-test.js` | line 155／guard 8：相同整份 script mismatch；前 7 runtime checks 通過，guard 後未執行 | 是 | 否 | **BASELINE FAILURE**，subtype historical SOURCE FREEZE；同上 |
| `pitch-tactical-decision-production-adapter-integration-test.js` | 原 line 181／guard 8：HEAD/WIP 均對歷史 script mismatch；前 7 runtime checks 通過 | 是，推翻前輪 PASS | 否；Sprint 只增加既有整檔差異 | **SOURCE FREEZE**，亦為既有 baseline mismatch；限縮指定 guard，最終 11/11 PASS |
| `pitch-tactical-intent-evidence-integration-test.js` | 原 line 215／guard 10：相同 source mismatch；前 9 runtime checks 通過 | 是，推翻前輪 PASS | 否 | **SOURCE FREEZE**，亦為既有 baseline mismatch；限縮指定 guard，最終 10/10 PASS |
| `pitch-tactical-signal-projection-production-integration-test.js` | 原 line 266／guard 14：相同 source mismatch；前 13 runtime/reload checks 通過 | 是，推翻前輪 PASS | 否 | **SOURCE FREEZE**，亦為既有 baseline mismatch；限縮指定 guard，最終 14/14 PASS |

沒有分類為 NEW REGRESSION 或 ENVIRONMENT 的原九案；分類本身沒有 UNRESOLVED。這不表示六個保留的 baseline failures 已修復。

### B. Root Cause、原契約與 Baseline Evidence

**六個保留案例。** 獨立 audit 固定六份原測試與六個 local dependencies，對 102 個 tracked root Production／loading sources 建立 WIP 與 exact HEAD snapshots。相同 Node `v24.19.0`、win32/x64、cwd、environment、mock browser 與輸入，只在記憶體替換 source；12 次原始執行均保留完整輸出及 hashes，沒有 checkout。每個 assertion 捕捉器只觀察未捕捉例外，不消耗或壓制失敗。診斷 instrumentation 另列，沒有冒充原測試執行。

| 案例 | 原本保護的契約 | 額外實際證據與修復建議 |
|---|---|---|
| Ability gradient | 只改目標能力、正式 GameRecord、deterministic replay，以及高低階 cohort 的比賽間變異 | HEAD/WIP tier 8 seeds 1–20 的 AB/PA/H 逐場相同；4 場單安打、無多安打，hitlessFraction=.8。tier 16 為 multiHitFraction=.05、hitlessFraction=.5。證明固定 cohort 失敗，未證明勝率公式有錯；另審 variance／PA identity RNG coupling，不放寬標準、不換 seeds |
| 2.2.2 check 36 | 有界完整比賽、兩個 offense moments、defensive density count 一致及 state integrity | 原 seeds 88221/88222 都因 partial VM 與 development SS override 每球固定 deepGrounder；fielding window=-.7，而 `(sample-.5)*4` 最大不到 2，達不到 secure 2.8 門檻。Routine 無出局而耗盡 1401 步；defensive count=4 與 density=4 相同，completion／後續 offense／safety 子條件失敗。應分開 synthetic unit fixture 與完整 canonical runtime，保留種子及能力真值 |
| Opportunity Two | N+1 使用正式 Opportunity／roster、role evaluation、exactly-once 及 live second match completion | 舊 runtimeFiles 缺 canonical DecisionThrow，正式 index.html 有載入；HEAD 在 SS routine builder（script.js:11024）已報同一 ReferenceError。應更新舊 harness dependency，不在 Production 為缺模組新增 fallback |
| 三個舊 pitch guards | 當前 PA observation／sequence／interpretation／decision 為純投影；不改 selector、RNG、save 或正式 outcome | historical refs 的 script 已落後正式 HEAD 的 SS/infield execution、settlement、identity、scheduling；artifact 保存三份 historical source diffs。各有 7 個 runtime checks 通過，後續 checks 未到達。直接凍結的 pitch modules／save 仍一致，repeat helper extraction 的既有精確例外仍通過；後續需獨立審查其 guard，不能直接換 ref 或刪斷言 |

**三個指定 freeze。** 同樣固定原 HEAD test bytes、相同 local harness 與 102 個 root sources，使用有效 main entry 各執行 HEAD/WIP，六次均重現整檔 freeze。Actual script 正規化長度分別為 903395／917975，三個 historical expected 均為 886330。HEAD 的已接通 SS 改動在 Sprint 前便超出整檔 guard；本輪守備 diff 增加差異，但沒有使原本通過的完整 suite 新失敗。

**投捕／打擊行為對照。** [kernel evidence](shared-infield-regression-kernel-evidence.json) 使用八個預先宣告的既有 suite seeds、相同 canonical player／roster／match／choice，分別載入 HEAD/WIP。24 個 PA（54 個 detailed pitches）、24 個 pending decisions、72 個真正 legal pitch resolutions，以及 24 個非內野 shared record/moment cases，raw state、完整 pitch resolution player、tactical history、anticipation、GameRecord、RNG draw count／cursor 全部相同。這些是明示 fixture 對照，非自然頻率證據；未宣稱整場 HEAD/WIP trajectory 相同，因合法 infield admission 修復本就會影響後續局面。

Graph 經 search／trace／snippet 定位 PA state → resolve／prepare 呼叫，對引用 path 做 coverage。回報 no_recorded_issue 但 freshness=metadata_changed，故以 actual source 為準。正常 playback 原已有 activeSituation gate；prepare 的共用 mutex 加強直接 entry，未新增 pitch resolution。未把圖上缺 edge 或單場輸出相同當成全域證明。

### C. Freeze Boundary 修正前後

| 指定 guard | 原 historical implementation reference | 修正前保護 | 修正後保護 |
|---|---|---|---|
| Adapter Production | `9b9546f94a7286afef474be634fd93c57eb455db` | pitch decision／interpretation／sequence／observation、offensive PA、tactical integration、sequencing、save 及整份 script；tactical helper extraction 為精確例外 | 原 module／save source assertions 與 helper extraction 例外保留；僅 script 改為下述明確 scope |
| Intent Evidence | `2a4b44a034b714b8de3c8a6897507995ab0f8ccd` | 上述 owners，加 production adapter、plate decision、index loading；整份 script | 模組、save、index 仍完整 source frozen；script 採明確 scope；全部原 runtime checks 保留 |
| Signal Projection | `674e49115a9ed7d67c69a3023b5a594d41fe584c` | 與 intent 相同的 runtime／loading／save owners；整份 script | 同上；原 13 個 runtime／reload checks 保留 |

新共用 [source-scope helper](../tests/pitch-production-source-scope.cjs) 明列 **95 個函式、25 個 top-level declarations、12 個 module symbols**。完整 manifest 位於 helper 與 freeze JSON；核心範圍包含 pitcher runtime、PA identity/state、automatic PA resolve、pending pitch prepare/resolve、public choices/dispatch、offense presentation，以及實際 PA apply、batting order、third-out、score、record owner。沒有凍結所有剩餘 career／narrative／defensive source。

95 個函式中 **93 個 HEAD/WIP source 完全相同**；另外兩個只允許精確既有守備附加段：

- `recordHighSchoolYearOneMoment` 的 `...(eventFacts.defensiveFacts || {})`。
- `recordHighSchoolRoutinePlateAppearance` 只在 `existingOrdinaryPhysicalOutcome` 時附加 ordinary classification、physical truth／identity／opportunity。

原 offensive 分支仍精確凍結，例外段本身也不可變。Implementation 比對維持各原 historical refs；外部 pitch calls／hook wiring 使用不可變的正式 `c54f810...`，因 historical refs 早於已驗收的 SS entry calls。這不是把整份檔案重設為 WIP baseline。共享 score／record owner 的 body 與 rebinding 仍保護；defensive caller 的普通 outcome arguments 屬守備範圍。

Source extractor 先以 Node parse 驗證完整 script，再驗證完整 declaration 邊界；missing／duplicate／非 top-level protected binding 會拒絕，檢查過程不執行 Production、不讀 RNG。原歷史模組、Save、index 的靜態守衛未刪除。

[Mutation suite](../tests/pitch-production-source-scope-test.js) **7/7 PASS、131 次變更拒絕**：95 個函式 body 逐一修改、25 個 declarations 修改、函式 removal／rename／duplicate／override、shared owner override、新外部 pitch/module calls、registry 接線，以及兩個例外段的擴張均會失敗。新增無關 defensive 函式可通過，驗證沒有退回整份 script freeze。

三個較舊 baseline pitch guards 的過寬歷史邊界本輪未改，故「repository 所有 freeze 均已 closeout」這個 Gate 仍未達成；不能用新 helper 通過來替它們宣稱 PASS。

### D. 本次實際修改檔案

| 檔案 | 本次變更 |
|---|---|
| [pitch-tactical-decision-production-adapter-integration-test.js](../tests/pitch-tactical-decision-production-adapter-integration-test.js) | 僅 script source assertion 使用 bounded helper；原 module 及 runtime checks 保留 |
| [pitch-tactical-intent-evidence-integration-test.js](../tests/pitch-tactical-intent-evidence-integration-test.js) | 同上，保留 original refs、loading/save guards |
| [pitch-tactical-signal-projection-production-integration-test.js](../tests/pitch-tactical-signal-projection-production-integration-test.js) | 同上 |
| [pitch-production-source-scope.cjs](../tests/pitch-production-source-scope.cjs)（新增） | 明列 scope、source extraction、exact allowances、external wiring guards |
| [pitch-production-source-scope-test.js](../tests/pitch-production-source-scope-test.js)（新增） | Mutation／positive boundary checks |
| 本報告及 [validation JSON](shared-infield-contract-2b-completion-sprint-1-validation.json) | 追加 regressionCloseout；保留先前結果並更正失效 baseline claim |
| [baseline evidence](shared-infield-regression-baseline-evidence.json)（新增） | 六個原始失敗的 12 次雙邊執行、root cause 與分開的 diagnostics |
| [freeze evidence](shared-infield-regression-freeze-evidence.json)（新增） | 三個原始 guard 的有效六次雙邊執行、95 函式比較、原／新邊界與更正記錄 |
| [kernel evidence](shared-infield-regression-kernel-evidence.json)（新增） | 相同輸入的投捕／打擊 Production kernel 對照及可重跑 runner |

Production、能力／勝率公式、種子、原六個 baseline 測試、SS 與其他 Sprint 變更均未修改。Worker 產生的兩個臨時 globals 對照文字檔已移除，未碰既有報告或 WIP。

### E. 本次 Regression 結果

驗證順序為：新 boundary/mutation → 原九案 → 受影響核心補充 → exact 原 227 manifest。所有 suite 都以 direct Node main entry 執行，4 個 child processes、windowsHide、相同環境及 600000ms timeout；全部完成、無 timeout／略過。Validation 保留逐項完整 stdout/stderr、input/output hashes、exit codes、duration 及 227 個 before/after 對照。

| 本次實際重跑 | 結果 |
|---|---|
| 原九案 | 3 PASS／6 FAIL；三個指定 freeze 均修復 |
| 受影響核心補充（排除已跑九案，含新 mutation） | **41/41 suites PASS** |
| Adapter／Intent／Signal Production | **11/11、10/10、14/14 checks PASS** |
| Defensive Opportunity Production | **14/14 PASS** |
| Ground Decision Identity production／repair | **PASS／15/15 PASS** |
| GameRecord | **13/13 PASS** |
| Shared Infield focused | **17/17 PASS** |
| SS Production Integration | **26/26 PASS** |
| Save Admission／Match Experience／Evaluation registry | **PASS**；ground pending/executed/settled/reload 經 focused／SS／identity 同時驗證 |
| 新 source-scope suite | **7/7 PASS、131 mutations rejected**；不混入原 227 count |
| exact 原 227（與前次同一 manifest） | **221 PASS／6 FAIL**，每套均本次重跑 |
| 前次 → 本次 suite 對照 | **218 PASS／9 FAIL → 221 PASS／6 FAIL**；原 PASS 變 FAIL 為 **0** |
| 本次五個新增／修改 JavaScript 檔案 `node --check` | **5/5 PASS** |
| `git diff --check` | **PASS** |

完整結果仍保留三個既有 runtime/cohort failures 與三個較舊 historical freeze failures。不能稱「227 PASS」；較舊 pitch production suites 只有 guard 前 checks 執行，亦不可稱整套通過。Pitch foundation、adapter、selector equivalence、semantic boundary、sequencing、plate decision 等另有本輪實際 core／full PASS 證據。

### F. 新增 Production Regression 數量

**0。** 原九案均已有 exact HEAD 重現；完整原 227 manifest 沒有新增失敗；相同輸入的 pitch/offense kernel 沒有 raw state、GameRecord 或 RNG/cursor 差異；95 個受保護函式只有兩個已審查的守備附加段差異。本次 Production disk 變更為 0，開始時三個 Production hashes 與結束相同。

這個結論限於本次 source 範圍及實際回歸證據，不代表所有遊戲行為全域等價或既有缺陷已解決。

### G. 未解問題與風險

- 六個 baseline failures 仍可重現；能力 cohort 與舊有界完整比賽契約仍失敗，live Opportunity Two harness 仍缺模組。各有具體修復建議，本輪沒有放寬 assertions、能力門檻、換種子或改規則。
- 三個較舊 historical source freezes 的整檔 guard 尚待獨立邊界審查；它們阻止後續 runtime checks 執行，不能以前七項通過代替整套結果。
- 前次三案 baseline PASS 證據因 main-entry 錯誤失效；最新輸出推翻該說法。保留歷史 JSON 並加更正，review 時應採本節及 regressionCloseout。
- 新 static manifest 需要隨未來真正的投捕／打擊 contract 變更一起審查；禁止以增加廣泛例外或換整檔 ref 迴避失敗。Mutation probes 證明目前邊界有效，不構成任意程式改寫的形式證明。
- A–K 已記錄的 2B coarse timing／legacy feed、1B/3B 尚未接入與 save schema 範圍限制仍存在，本輪沒有開始新守備功能。

### H. 最終 Gate 判定

| Gate | 判定 | 理由 |
|---|---|---|
| Sprint Delta Regression | **PASS** | 原227無新增 failure；指定三個 freeze 修復；core／SS／record／save／evaluation 通過；Production 與受保護 WIP 保留 |
| Full Repository Regression | **PARTIAL** | 實際 221/227 PASS，仍有六個可重現 baseline failures |
| Source Freeze Closeout | **指定三案 PASS；全 repository 尚未完成** | 新邊界有明確 source scope、runtime guards 與 131 次拒絕；三個舊 historical guard 仍失敗 |
| Ready for Commit | **NO** | 原有 capability variance、bounded match completion、live Opportunity harness 及較舊 freeze checks 尚未關閉；有證據分類不等於契約已通過 |

本次工作完成並停止。沒有 Commit、Push、Stash 或開始 3B Sprint。

## M. Legacy Pitch Freeze Boundary Closeout — Sprint 1.2

日期：2026-10-10（Asia/Taipei）。本次只將三個舊 source guards 接到既有 scope helper，讓原 runtime checks 能到達末尾。Production、helper、mutation suite、能力／機率公式及 seeds 均未修改。

### A. Baseline / WIP

| 檢查 | 開始／收尾結果 |
|---|---|
| Branch | `main` |
| HEAD／origin/main | `c54f81016ed6d495f6c6911ebae708c05bcf4b2b` |
| 開始 status | 與前輪最終 status 相同；沒有未預期的新增或移除 |
| 原 Sprint／closeout 檔案 | 20 個既有 code／audit／evidence 檔案 SHA-256 保留；報告與 validation 按要求追加 |
| Production／loading sources | 開始快照的全部 102 個 tracked root sources 與收尾 hash 相同 |
| `git diff --check` | 開始及收尾 PASS |
| 受保護 WIP | smoke／install 保留；未讀內容、修改、執行、stage 或清理 |

所有先前測試、audit、三份 regression evidence、source-scope helper 與 validation 歷史均保留。未 Commit、Push、Reset、Clean、Stash 或 Git add。Shell 維持已核准執行方式；本次没有環境失敗、timeout 或被略過的 suite。

### B. 三案歷史失敗重現

先以 **direct Node main entry** 執行原測試，再以 exact HEAD source substitution 執行同一測試 bytes：六次均 exit 1。WIP 使用只觀察例外的 monitor；HEAD 以 `Module._load(entry, null, true)` 與原 argv 啟動，102 個 root sources 只在記憶體替換，並記錄實際命中的 sources。未 checkout、覆寫 WIP 或使用只載入不執行的假 PASS。

[Sprint 1.2 evidence](shared-infield-legacy-pitch-freeze-evidence.json) 保存 exit code、完整 stdout/stderr、assertion actual/expected、source/input/output hashes、命令、環境、完成／未到達 checks、可重跑 runner 與歷史 diff。

| 原測試 | Historical implementation reference | 原失敗／已完成 checks | 未到達部分 |
|---|---|---|---|
| `pitch-sequence-state-production-integration-test.js` | `a0e512b439446990d8df118e3e7d737b9f2f51d3` | line 139，guard 8 整檔 script 不等；前 7 checks PASS | 沒有額外 named runtime check；guard 8 與末尾 Sequence witness/report 未完成 |
| `pitch-tactical-decision-production-integration-test.js` | `ac53bf61964bde4b40501c77e15269bae99b55cc` | line 167，guard 8；前 7 checks PASS | checks 9–12：輸出隔離、禁讀 upstream getters、canonical vocabulary、非 neutral intents；末尾 report |
| `pitch-tactical-interpretation-production-integration-test.js` | `98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7` | line 155，guard 8；前 7 checks PASS | checks 9–10：無 recommendation／psychology、禁讀 raw／Observation／history getters；末尾 report |

Actual 正規化 script 長度在 HEAD 為 903395、WIP 為 917975 chars，三份 historical expected 均為 886330；raw string hashes 與前次相同。這是 **historical SOURCE FREEZE**，而非本次 Pitch Logic Regression。三個 original test sources 的 reverse-migration 檢查均逐字等於正式 HEAD；原 runtime assertions、seed `440000`、policies 及完整比賽上限沒有修改。

### C. 原保護契約

| 契約 | 實際保護方式及本次結果 |
|---|---|
| Pitch Sequence State | 逐個 genuine pitch prefix 比對 incremental／rebuilt、browser／CommonJS；previous state 不變，compressed NPC 無虛構 sequence |
| Pitch Selection／Tactical Integration | Shadow ON/OFF 的完整 Match、tactical state、GameRecord、RNG cursor 相同；既有 selector repeat extraction 只允許原精確改動 |
| Tactical Decision／Interpretation | 只消費所屬上游投影、保留 canonical vocabulary；getter probes 拒絕 raw truth／數值 threshold 重算；決策不進入 Production selector |
| Plate Decision／Offensive Plate Approach | Helper 凍結 PA identity/state、pitch prepare/resolve、public choices/dispatch 與實際 offensive PA owners；原 module guards 保留 |
| RNG／Simulation Cursor | 每次觀察／重建禁用 RNG，檢查 persisted cursor 及 source/player 不變；所有 mutation counters=0 |
| Save／Load | Live pending pitch 與 finished state reload，丟棄 derived memory 後從 persisted truth 重建；不新增 save authority／schema |
| Match State／GameRecord | 完整比賽完成、active situation 清空、雙方 integrity issues=[]；ON/OFF 與 reload 的正式 record 等價 |
| 模組載入／正式接線 | 原 dedicated module／save source guards 不變；helper 的 module references／external hooks／shared-owner rebinding guard 保留。既有較新 Intent/Signal 的 PlateDecision、index/loading 全檔守衛也在本次代表性回歸實際通過 |

使用 codebase-memory Tier 2 對 resolver／Decision core 做雙向 depth-1 trace 與 snippet 查證；17 個引用 path coverage 均 no_recorded_issue，但 freshness=metadata_changed，故重要判斷以磁碟 source 與執行結果為準。沒有以缺少 graph edge 推論功能不存在，也沒有宣稱全域圖完整。

### D. Source Scope 修正前後

三案每檔僅三種文字改動：helper import、guard 名稱、`file === 'script.js'` 時呼叫 `assertPitchProductionSourceScope(current, baseline)`。其他 module loop、historical refs、Save guards、repeat extraction allowance 及所有 runtime code 原樣保留。

| 類別 | 修正前 | 修正後／理由 |
|---|---|---|
| A. Pitch／Tactical implementation | 與 historical source 整檔相比 | 仍使用原三份 historical refs；95 protected functions、25 declarations、12 symbols。95 個函式在每份 historical ref 與正式 HEAD 全部相同 |
| B. 合法守備擴充 | 任一 script 變動即失敗 | 原 helper 的兩個精確 defensive record append allowances 保留；未新增或擴大例外、未忽略大片 source。其他當前 infield source 屬守備範圍 |
| C. Historical wiring 落後 | 把 SS entry／settlement／recovery／scheduling 變更一併判成 Pitch 改動 | 接線維持既有 helper 的不可變正式 `c54f810...` 參照；歷史與正式 source diff 已逐案保存，protected implementations 本身未變。不是改 expected 為 mutable WIP |

Formal HEAD 與 current WIP 的 95 個 protected functions 中，93 個相同；兩個差異仍限 `recordHighSchoolYearOneMoment`／`recordHighSchoolRoutinePlateAppearance` 的精確既有守備附加段。Source extractor、missing/duplicate guards、external pitch/module wiring、shared outcome owner bodies／rebinding 全部保留。

Helper 與 mutation suite 的 SHA-256 均與開始前相同。没有新 helper、scope expansion、Production fallback 或投捕／打擊重構。獨立唯讀審查同樣確認 exact-minimal migration 與 Decision 9–12／Interpretation 9–10 tail bytes 不變。

### E. Mutation Results

既有 `pitch-production-source-scope-test.js` 本次 **7/7 PASS、131 mutations rejected**，完整 stdout 保存。檢查 95 個 protected body、25 declarations、removal／rename／duplicate／override、external calls／registry wiring、兩個 defensive exceptions 擴張；新增無關 defensive function 可通過。

另外直接對 **三個舊 historical refs** 各執行五個 negative controls：刪除 protected resolver、修改 Pitch Resolver、修改 Tactical state owner、新增 Pitch wiring、擴張 defensive allowance；**15/15 被拒絕**。各加入無關 defensive function 的三個 positive controls 均通過。這些是新增參照的驗證，沒有混入原 131 count。

對獨立模組的 `PitchTacticalDecisionFoundation.decide`，另作 **semantic negative control**：只在隔離 Node/VM 的記憶體 source 中，將 `selectedIntent` 改成非法 `mutationIntent`，沿用原 test/seed/policies。前十項 checks（含新 source guard）通過，第十一項原 `T.TACTICAL_INTENTS.includes(...)` assertion 確實失敗、exit 1；不是用主動 throw 模擬契約失敗。現有 Adapter 的 D module 全檔 source guard亦拒絕相同變更。

此 control 的 raw stdout/stderr、source/mutant hashes、runner 皆保存；磁碟 Production 不變。它證明 vocabulary 契約及重新可達的 runtime assertion 有效，不代表對每一種可能 semantic mutation 都有形式證明。

### F. Runtime Results

第一階段四個 suite 全部完成、exit 0：

| Suite | 結果／到達末尾的證據 |
|---|---|
| Sequence Production | **8/8 PASS**；輸出 `SEQUENCE_PRODUCTION_JSON` |
| Tactical Decision Production | **12/12 PASS**；checks 9–12 實際通過，輸出 `DECISION_PRODUCTION_JSON` |
| Tactical Interpretation Production | **10/10 PASS**；checks 9–10 實際通過，輸出 `INTERPRETATION_PRODUCTION_JSON` |
| Source Scope Mutation | **7/7 PASS**、131 rejected |

三個 Production reports 的 take policy 都有 11 次詳細 pitch projection calls、swing policy 14 次。RNG draws、source／previous-state mutations 全為 0；Decision／Interpretation 的各 1100／1400 次 rebuilds 等於 calls×100，sequence／interpretation mutation counters 為 0。Live／finished Save/Load、browser/CommonJS、whole Match／GameRecord／tactical state／cursor 等價 assertions 通過，沒有新 ReferenceError 或額外抽樣。

第二階段 **28/28 representative suites PASS**，包含 Pitch／Plate Decision、Tactical Integration、三個較新 source guards、Save、GameRecord、Shared Infield 17 checks、SS Production 26 checks、Match Experience、Defensive Opportunity。實際 manifest 與每套輸出在 validation `legacyPitchFreezeCloseout.stageTwo`，未以過去 PASS 代替本次執行。

### G. 227 套件 Regression

第三階段使用前次 `regressionCloseout.fullRepositoryRerun.manifest` 的相同 **227 個檔名、順序與 manifest SHA-256**，實際全量重跑一次。Protected smoke 仍排除；新 mutation suite 另行計數。沒有換 manifest、跳過失敗、timeout 或未完成 child process。

| 對照 | 結果 |
|---|---|
| 前次 | **221 PASS／6 FAIL** |
| 本次 | **224 PASS／3 FAIL** |
| 原 PASS → FAIL | **0** |
| 三個舊 Pitch freeze | **FAIL → PASS**，原 runtime assertions 全部執行 |
| 已識別六個 Pitch source freeze suites | **本次全量重跑全部 PASS** |
| 新增 Production Regression | **0** |

每套實際 exit code、signal、duration、stdout/stderr、source/output hash 與 before/after 對照保留在 [validation JSON](shared-infield-contract-2b-completion-sprint-1-validation.json) 的 `legacyPitchFreezeCloseout.stageThree`。本次修改只有測試邊界；全部 102 root Production/loading hashes 保留，SS／Shared Infield／GameRecord／Save／Evaluation 的本輪回歸也通過。

### H. 未解 Baseline Debt

| 仍失敗套件 | 本次結果／既有證據 | 後續方向 |
|---|---|---|
| `ability-performance-gradient-test.js` | exit 1，原 low-tier multi-hit assertion；test hash 與前次相同 | 獨立 fixed cohort／variance 稽核；不放寬 multi-hit 或改能力、公式、seeds |
| `baseball-match-foundation-2-2-2-test.js` | exit 1，原 bounded completion assertion；test hash 相同 | 獨立 legacy full-flow harness／synthetic fixed ground 接入修復；保留完整比賽契約 |
| `high-school-year-one-opportunity-two-integration-test.js` | exit 1，原 missing canonical module ReferenceError；test hash 相同 | 依 canonical manifest 修舊 partial runtime；不在 Production 加缺模組 fallback |

三案的 exact HEAD／相同輸入重現、根因、環境及診斷在未改動的 [baseline evidence](shared-infield-regression-baseline-evidence.json)；本次全量再重現，源碼與前次完全相同。這三案不屬此次 source-scope 移轉，未修復、未刪 assertion 或改 expected。**Full Repository Regression 仍為 PARTIAL，不能稱 227 PASS。**

### I. Git diff / Files Changed

本次實際 code diff 為三個 target 檔案各 3 insertions／1 deletion（import、guard title、script branch）；所有原 assertions 保留。

| 檔案 | 本次用途 |
|---|---|
| [pitch-sequence-state-production-integration-test.js](../tests/pitch-sequence-state-production-integration-test.js) | 採用既有 script scope helper；原 module guards／runtime 保留 |
| [pitch-tactical-decision-production-integration-test.js](../tests/pitch-tactical-decision-production-integration-test.js) | 同上；恢復原 checks 9–12 的執行 |
| [pitch-tactical-interpretation-production-integration-test.js](../tests/pitch-tactical-interpretation-production-integration-test.js) | 同上；恢復原 checks 9–10 的執行 |
| 本報告／既有 validation JSON | 追加 M／`legacyPitchFreezeCloseout`；前輪歷史保留 |
| [shared-infield-legacy-pitch-freeze-evidence.json](shared-infield-legacy-pitch-freeze-evidence.json)（新增） | 三案六次 original/HEAD 失敗、scope source diff、mutation controls、runtime completion 與 preservation evidence |

三個 target 的 `node --check` **3/3 PASS**；`git diff --check` **PASS**。其他 Sprint edits、helper、source-scope test、既有 evidence/audit 保留。沒有對受保護 WIP 做內容 hash 或讀取；Git status/numstat 仍顯示同一既有狀態，未 stage 任何檔案。

### J. Commit Readiness

| Gate | 判定 | 證據／限制 |
|---|---|---|
| Legacy Pitch Freeze Closeout | **PASS** | 三案完整 8/12/10 checks；原 refs／module guards 保留；131 mutations 與三個 legacy refs 的 negative/positive controls 通過 |
| Sprint Delta Regression | **PASS** | 原 PASS → FAIL=0；Production hashes 不變；核心及整合回歸通過 |
| Full Repository Regression | **PARTIAL** | 224/227 PASS，三項獨立 Baseline Debt 未解 |
| Ready for Commit | **YES（有條件）** | 已識別 Pitch source freezes 全部關閉、新增 Production regression=0、core PASS、剩餘三項 Debt 有 exact HEAD 重現且 inputs 不變、既有 WIP 保留、diff check PASS |

Commit readiness 的條件是只納入本 Sprint 及其測試／證據，明列三項 Baseline Debt，排除 `tests/fast-check-smoke-test.cjs`、`install.ps1` 的使用者 WIP，交由人工審查。這個判定依上述逐項 Gate，不以「都是已知問題」代替驗證；完整 repository 仍 PARTIAL。

本輪完成並停止，等待人工審查。未 Commit、Push、Reset、Clean、Stash 或開始新守備功能。
