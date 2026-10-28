> **Core Extension 最新交付（2026-10-19，Asia/Taipei）：CORE_RECOVERY_FACTS_PASS。** 三個授權 API 已形成五例正式 Production closed runner facts；PA／H／E 仍未提交。22 套指定測試通過，Sprint 2 仍 PARTIAL。請以第 25–32 節及 Evidence 的 `coreRecovery` 為本輪結果；下列 D2／S2-A 通知為保留歷史。

# Match vNext Sprint 2 — Batted-Ball Outcome Coverage & Legal Continuation v0.1

> **S2-RECOVERY-001 本輪最新判定：Gate D2／BLOCKED_CORE_EXTENSION_REQUIRED。** 完成限定 Ownership Review，沒有新增 Recovery Gameplay。Sprint 2 仍為 PARTIAL、S2-A 仍 PASS、Ready for Commit = NO。最新審查見第 17–24 節；下方保留前輪歷史。

> **追加授權後最新結果：PARTIAL；S2-A PASS。** 原第 1–8 節保留為 S2-SCORER-001 BLOCKED 歷史；新增實作、驗收與 S2-B／C 停止點見第 9–16 節。未 Stage／Commit／Push。

日期：2026-10-18，Asia/Taipei。

**完成等級：BLOCKED。停止點：S2-A／S2-SCORER-001。新增正式結果：0。Ready for Commit：NO。**

Sprint 1 重現 Gate 通過。三個正式入口的新增 safe 探測均產生真實的「跑者先到一壘」事實，但尚未完成正式安打分類、PA 提交與下一打席。依使用者附件第六、七、九、十二節，擴充既有核心 Scorer 前須追加授權；本輪沒有修改 Production、測試或 source guard，也沒有進入 S2-B／S2-C 施工。

任務來源：`C:/Users/User/.codex/attachments/74c4f077-f3be-490f-bb04-95b4bc94c95d/Pasted text.txt`。完整狀態、原始測試輸出、SHA、來源摘錄、正式 handler 前後快照與可重跑探測程式見同名 `-evidence.json`。

## 1. Sprint 1 Baseline Reproduction

| 項目 | 本輪實測 |
|---|---|
| HEAD／branch | `ab3117653945de0b7013636187c446276a96e634`／`main` |
| origin/main | 同 HEAD；僅本機 tracking ref，未 fetch |
| Git index SHA-256 | `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d` |
| 原有狀態 | 16 個 tracked WIP、1217 個 untracked files、staged 為空 |
| 原有檔案基線 | 1955 份可讀來源逐檔 SHA；另有 12 個 Protected paths 僅記錄路徑、大小、mtime |
| Runtime／測試重現依賴 | 104 份檔案清單與 SHA，含直接 require、必要傳遞依賴及動態 VM loader |
| Browser／VM | index 的 95 個 classic scripts；正式測試 VM 載入 94 個，依原 harness 排除 `application-controller.js` |
| 歷史 source guard 依賴 | 18 個 revision:path 的 Git blob ID 與原始位元組 SHA |
| 環境 | Node `v24.19.0`；`git version 2.55.0.windows.3`；Windows |

104 份依賴全部符合本輪開工 SHA，也全部符合已接受 Sprint 1 的原 manifest 加 `continuation.finalFiles` 覆蓋。Sprint 1 的 15 份 finalFiles 全部相符；其第十六份交付為 Evidence 本身，另記整檔 SHA，避免自我 hash。這是 **HEAD 加上明確列出的未提交 WIP／untracked 依賴**，沒有建立 Git commit，也不能只 checkout HEAD 就聲稱已重現 Sprint 1。

Sprint 1 的十個既有修改檔：

- `index.html`
- `offensive-plate-approach.js`
- `plate-decision-foundation.js`
- `script.js`
- `tests/pitch-production-source-scope.cjs`
- `tests/pitch-tactical-decision-production-adapter-integration-test.js`
- `tests/pitch-tactical-decision-production-integration-test.js`
- `tests/pitch-tactical-intent-evidence-integration-test.js`
- `tests/pitch-tactical-interpretation-production-integration-test.js`
- `tests/pitch-tactical-signal-projection-production-integration-test.js`

Sprint 1 的六個新增交付：

- `contracts/match-vnext-execution-v0.1.cjs`
- `match-vnext-same-ball-execution-adapter.js`
- `tests/match-vnext-same-ball-execution-contract-test.cjs`
- `tests/match-vnext-same-ball-production-integration-test.cjs`
- `docs/match-vnext-sprint-1-same-ball-execution-v0.1.md`
- `docs/match-vnext-sprint-1-same-ball-execution-v0.1-evidence.json`

104 份重現依賴中，七份目前未追蹤：上述 Contract、Adapter、兩個正式測試，以及 `receiver-source-snapshot.js`、`tests/receiver-source-index-authorized-wiring.cjs`、`tests/receiver-source-save-authorized-delta.cjs`。保留這七份及其傳遞依賴，並保留已列出的歷史 Git source blobs，才能執行原精確守衛。完整清單見 `runtimeReproduction.dependencies`，不以檔名存在作為版本相符的證明。

## 2. Sprint 1 正式回歸與原唯一提交

兩個指定 CLI 入口本輪均以 exit 0 通過：

```powershell
node tests/match-vnext-same-ball-execution-contract-test.cjs
node tests/match-vnext-same-ball-production-integration-test.cjs
```

Contract 保留 94 個精確 source assertions、13 個 script lock 拒絕探測、32 個 candidate 拒絕探測。Production 的 stageA、stageB、stageC、stageDE、rejections、save、routes、capabilities、executionCounts、matchEnd 十組通過。

另以未修改的 `runStageD()` 保存三個成功事件的完整 before／after、candidate、receipt 與下一事件，見 `baselineProductionWitness`：

| 原情境 | Outs before → after | PA 總數 before → after | 正式壘包 after | Receipt／後續 |
|---|---|---|---|---|
| S1 O0 | 0 → 1 | 0 → 1 | 全空 | committed；下一事件完成 |
| S1 O1 | 1 → 2 | 1 → 2 | 全空 | committed；下一事件完成 |
| S1 O2 | 2 → 3 | 2 → 3 | 全空 | committed；原半局流程及下一事件完成 |

這些是原 S1 的成功出局證據，不列入新增 safe／error 覆蓋。原十三套 legacy regression 的接受結果保留在 Sprint 1 Evidence；本輪沒有程式異動，於 S2-A 前置 Gate 停止，因此沒有重跑十三套，也沒有宣告 S2-E 完整通過。

## 3. 真正 Safe 的正式 Handler 探測

每例從原 Career/UI admission 進入合法比賽，沿用 seed `440000` 與 S1 固定外生 samples。O1／O2 所需先前出局在目標 PA admission 前由原正式 owner 記錄。唯一能力反事實是在目標 PA 準備前設定 live Player 的 `baseRunning = 20`；原能力轉接消費 speed `14`。未搜尋 seeds，未修改產出後的 timing、球、比分、壘包或出局。

實際 actor：P `regional-power-school-player-01`、SS `regional-power-school-player-06`、1B `regional-power-school-player-03`、BR `player`。NPC 皆取正式 active roster；完整 raw／consumed／source／scale 保存於各例 `capabilityProvenance`。實際 P control 為 `14`。Physical 為真正 fair、leftSide、moderate groundBall。

使用正式 `chooseHighSchoolYearOneMatchMoment → resolveHighSchoolPlateDecisionPitch`。VM 觀察器只包裝 Adapter 公開 binding，將同一參數交給原 `execute` 一次，保存並原樣返回同一 frozen 結果。沒有替換結果、公式、RNG 或 source files。V8 precise coverage 獨立驗證每例 Tactical Selector、Pitch Control、Physical producer、原 Adapter execute 各一次；含重複 callback／Reload 探測後仍各一次，Development 為零次。

| 探測 | Runner arrival | 1B completion | Timing margin | Foundation safe 壘包 | 正式 Match outs | 正式 Match 壘包 | 新 PA／BF／H／E |
|---|---:|---:|---:|---|---|---|---|
| S2-SAFE-O0 | 3.7 | 5 | -1.3 | `[player,null,null]` | 0 → 0 | 全空 → 全空 | 全為 0 |
| S2-SAFE-O1 | 3.7 | 5 | -1.3 | `[player,null,null]` | 1 → 1 | 全空 → 全空 | 全為 0 |
| S2-SAFE-O2 | 3.7 | 5 | -1.3 | `[player,null,null]` | 2 → 2 | 全空 → 全空 | 全為 0 |

時間數字是現有 Foundation 的相對時間，不宣稱真實秒數。SS reach／secure 成功，throw 為 `onTarget`、`readyRelease`，1B 為 ready／secured／completed。Pitch、Physical、Receive、Timing 的 identity 與真正 runner 均一致。

原 Runner 的 firstLeg 已有 `runnerResult: safe`、零 retirements、unchanged outs、`thirdOut.settlementReady: true`，pending／inTransit runners 均為空。這些是尚未套用的 Foundation facts；**正式 Match 沒有安全進壘，也沒有新增安打紀錄**。

正式 handler 三例均回報 `SAME_BALL_BLOCKED:LIVE_BALL_CLOSURE_REQUIRED`，PA 保持 `awaitingDefense`、未 completed、未 resultApplied。完整 Match before／after（含打序、scores、Record、log、moments、experience、Match RNG／global RNG）逐項相等。未形成新 receipt，也未進入下一個合法 PA。各例位於獨立 VM，不將固定 fixture 的同名 PA identity 合併為同一場 ledger。

## 4. 精確 Scorer 缺口：S2-SCORER-001

已用 codebase-memory 查詢 scorer／runner 關係並核對 coverage；圖索引時間為 `2026-10-15T01:30:19Z`，具有 stale／metadata changed／未追蹤路徑，故結論以目前磁碟來源及正式執行為準。`sourceReview` 保存十二段來源、行號、SHA，`graphVerification` 保存依賴 coverage。

| 現有來源 | 能提供的事實 | 對 S2-A 的限制 |
|---|---|---|
| `defensive-runner-throw-settlement-foundation.js:14,23,94` | 真正 runner arrival、接傳完成比較、safe first／零出局的 canonical first-leg facts | 沒有正式安打分類；本次不缺 runner 公式 |
| `defensive-decision-throw-foundation.js:271` `resolveScorerEligibility` | failed action 的 ordinaryEffort、potentialOut、attributableAdvancement；失誤資格與 would-be assists | completed clean chain、零 contests 只輸出空 decisions；沒有 affirmative infield-hit 解釋 |
| 同檔 `projectDefensiveAttribution:325` | 由實際 actions／retirements／scorer 投影 PO／A／E | 守備歸屬不是安打分類 |
| `batted-ball-ground-defense.js:391` `derivePACompatibilityResult` | BR out → out，其他 → single | 明確 `officialScoring: deferred`；單憑 safe 標籤映射，不符合本輪要求 |
| `batted-ball-outcome-mapping.js` | 接受既定 defense result；或走原 compressed 抽樣 | 接受 single 標籤不等於裁定安打；不能重抽另一個 PA 結果 |
| `script.js:11669,11775` | 舊 infield cache 的失誤來源；實際前位 force／prevented force 支持的 FC | 空壘沒有其他實際 forced runner；無 clean infield-hit API，不能偽造 legacy Player SS cache |
| `baseball-offense-prototype.js:404` | 機率分布可產生 `infield-hit` 名稱 | 是另一個 sampled outcome，不能解釋已產生的這顆球 |

在三例正式阻擋後，另做唯讀 scorer projection：以真實完成 actions、零 retirements、零 contests 呼叫既有 API，得到空 decisions、`batterReachedOnError: false`、SS／1B PO／A／E 全零；仍無非 deferred 的安打分類。另以最小輸入呼叫舊 compatibility，確實得到 `single + deferred`，僅證明該映射，不是成功的正式 scorer 驗收，未提交任何資料。

目前 Adapter 第 44–45 行、Contract `validateCandidate` 第 58 行、OPA `completeHeldBallInPlay` 第 671 行均保留 S1 out-only 邊界。它們屬本輪可改接點，但在這些接點直接寫「safe 就是 single」會新增第二個記錄規則 owner。現有資料足以證明這次 safe；仍需由既有正式 Scorer 擁有並驗證「正常完成仍不足以出局 → infield hit」規則，不能以沒有 charged error 取代該規則。

`liveBallContinuation`／`ballRemainsLive` 本身不是必須改寫 Runner 的證據；原成功 S1 O0／O1 也有這些狀態。本次 firstLeg 沒有 pending runner，且 1B 已持球在壘，與漏接後的 `liveBallRecoveryRequired` 不同。本報告不申請新 Runner／Canonical／Save 系統。

## 5. Error／Receive／Throw Attribution 與 Recovery

S2-B／S2-C 未進入施工。既有 N17 實際 receive failure 的 fail-closed 測試已隨本輪 S1 capabilities group 通過；這不代表新增 S2 error 結算成功。

`resolveIncomingReceive` 第 219 行區分 throw delivery、readiness、secure margin，能輸出 `outsideReceiverReach`、`unavailable`、`failed`、`completed`。其中 `errorCharged` 旗標不足以直接記 1B error。正式 Scorer 還要求 matching failed action／terminal runner action、ordinary-effort provenance、clean potential-out proof，以及主張額外進壘時的 attributable advancement。未把接球失敗自動歸給 1B 或 SS。

目前 Same-Ball 失敗返回含真實 reach／secure／throw／receive，卻沒有完成的 recovery action、漏球後球的位置／持有人、可接續補救 actor 與最終 runner base。Runner 的 no-contest 可標示 recovery required／pending runners，不能把該標籤當成補救執行。本輪停止於這個接面，不聲稱全庫沒有任何 legacy recovery；未重用 bookkeeping replay 偽造活球動作，也未動 Receiver v2。S2-THROW-FAILURE 與 S2-RECOVERY-COMPLETE 沒有新成功紀錄。

## 6. Save／Receipt／Replay 與測試覆蓋

每個 safe 阻擋例另做四個拒絕觀察，共十二個：未合法結算前推進、重複公開 callback、Save／normalize reload 後推進、Reload 後重複 callback。原 UI callback 可回傳 `false`，playback barrier 則拋出 SAME_BALL 錯誤；兩者皆不得修改 Match。Reload 後 unresolved held PA 仍被阻擋，沒有重新生成 Pitch／Physical、增加紀錄或玩家永久能力。

探測程式第一次把重複 UI callback 的拒絕誤設為「一定拋例外」，實際為 `false`，故診斷 assertion 失敗。修正觀察器接受明確 false／SAME_BALL 拒絕後，三個隔離案例與十二個拒絕全部完成。原程式與原失敗保留於 `safeProbeHistory`；未修改任何 Production 輸出或原測試預期。

| 驗收類別 | 本輪結果 |
|---|---|
| 原 S1 成功出局、身份、防重、source-freeze、save、match-end | 兩個正式入口 PASS；另保存三個正式唯一提交快照 |
| S2 SAFE O0／O1／O2 | 真實 safe facts 已確認；正式分類／提交 BLOCKED |
| S2 receive／throw／recovery 成功 | 未實作／未執行新成功案例 |
| 未結算與 Reload callback 拒絕 | 12 個診斷拒絕成立；Match／RNG／Record 不變 |
| 新 safe／error 的 receipt、已完成 checkpoint／next PA | NOT RUN，沒有合法新候選可提交 |
| 新 safe／error 的 Physical／runner／timing／actor 偽造、conflicting outcome、提前 Recovery 結算、錯誤進壘／第三出局、Record 覆寫、NPC 學習歸屬 | 新路徑 NOT RUN；列為追加實作必驗項，不以原 out-only 拒絕測試冒充通過 |
| S2-E 十三套 legacy 回歸 | 本輪未重跑；原接受紀錄保持 |

可重跑的觀察程式保存在 `Evidence.safeProbe.program`，不新增測試檔或 runner。以下以虛擬 CommonJS filename 解析相對依賴，不會建立該檔案：

```powershell
@'
const fs = require('node:fs'), Module = require('node:module'), path = require('node:path');
const e = JSON.parse(fs.readFileSync('docs/match-vnext-sprint-2-outcome-coverage-v0.1-evidence.json', 'utf8'));
const m = new Module(path.resolve('s2-evidence-probe.cjs'), module);
m.filename = path.resolve('s2-evidence-probe.cjs');
m.paths = module.paths;
m._compile(e.safeProbe.program, m.filename);
m.exports().then(r => console.log(JSON.stringify(r.cases.map(c => ({id:c.id, status:c.status, margin:c.actualAdapterOutput.timing.timingMargin}))))).catch(e => { console.error(e); process.exitCode = 1; });
'@ | node
```

## 7. 本輪修改與 WIP 保護

僅新增本報告與同名 Evidence JSON。既有 Production、Contract、Adapter、兩個正式測試、guard helper／五個 caller、Sprint 1 文件全部保持開工內容。Source-freeze 沒有新 delta；原 literal reverse transforms、歷史 pins、assertions 與拒絕語義保持。基線 CLI 已驗證其正向及反向拒絕。

最終逐檔核對 1955 份既存 SHA、12 個 Protected metadata、HEAD／branch／origin tracking ref／完整 refs、Git index、staged 清單與原 tracked WIP。結果見 `Evidence.integrity`。Protected paths 未讀取內容、未 hash、未執行；完整路徑與 metadata 在 `preflight.protectedPaths/protectedMetadata`。

最終核對 PASS：1955 份內容零差異，12 份 Protected metadata 相符，所有上述 Git 比較相符；tracked WIP 仍為 16 份，untracked 為 1219 份，僅增加本輪兩份交付文件。

沒有 Stage、Commit、Push、Stash、reset 或清理原 WIP。沒有建立 commit-safe baseline 的宣稱。本輪對 Alpha 的貢獻是可重現基線與真實 safe 分類阻礙的定位，尚未增加可玩結果；不宣告 PARTIAL、CONTROLLED_OUTCOME_COVERAGE_PASS 或 NATURAL_MATCH_READY。

## 8. 待審查的最小追加授權

**提案 S2-SCORER-001：僅追加既有 Scorer owner 的純分類 API；尚未實作。**

1. **精確檔案／函式：** `defensive-decision-throw-foundation.js` 新增 `resolveBatterReachClassification` 與 export。保留 `createActionFacts`、`resolveScorerEligibility`、`projectDefensiveAttribution` 既有行為，不建立新 scorer 模組。
2. **不足原因：** 現 API 只有 failed-action error eligibility／守備歸屬，不能產生 completed clean chain 的非 deferred infield-hit 分類。舊 safe → single compatibility 沒有正式裁定效力。
3. **最小規則：** 先只接受受控、空壘、同 Physical 的 SS→1B fair ground；驗證實際正常完成 field／ready-release on-target throw／secured receive／一壘 touch、真正 BR safe first、原 timing／settlement／scorer facts、零 retirements、unchanged outs、無 pending／inTransit runner。輸出帶 identity 與來源證據的 `infieldHit` 解釋及現有 `single` compatibility；不足時回報 insufficient／unsupported。不得以結果標籤作分類前提、不重抽、不另寫 timing 公式。
4. **接續及影響：** 原授權 Adapter／Contract／OPA／script Same-Ball 接點再消費正式 scorer proof，沿原 canonical applier／PA／Record owner 提交。採 PA 前鎖定且明示的 S2 controlled coverage policy／版本，保留未指定時的 S1 out-only 語義，原 N18 拒絕 assertion 不改。Runner、Force、Canonical、Record、Save、Career 核心及其他情境不改；多跑者、FC、失誤、未閉合 Recovery 仍各自阻擋。這項追加不視為 S2-B／C 的概括核心授權。
5. **必須增加正向：** O0／O1／O2 一次 PA／AB／H／BF、BR 正式 first、outs 不變、無虛構 PO／A／E、唯一 Record／receipt、下一合法 PA、完成 checkpoint 的 public Save／Load、防重及原 match-end。原 S1 全 assertions 與十三套 legacy regression 重跑。
6. **必須增加負向：** Physical／PA／pitch／runner／actor／capability／timing／dependency 不符、只有 safe 或空 error decisions、只有 deferred compatibility、late／weak／offline／failed receive 被誤分類、未完成 Recovery、錯誤 bases／outs／第三出局、conflicting outcome、重複 PA／H／BF／E／壘包、已完成 Record 覆寫、stale callback／partial Save／Reload 重抽、NPC 事件誤給玩家學習、非 eligibility／policy 變更。保留原精確 source guard 反向拒絕；如需原授權 helper／五個 caller 以外的 guard 修改，再停止。

完整機器可讀需求在 `ownerExtensionProposal`。使用者附件第九節明定擴充這些核心 owner 必須先提出檔案、理由、方案、影響與正負驗收並等待追加授權；本輪完成上述可審查交付後，停止於此。

---

## 9. S2-SCORER-001 追加授權後的結果

使用者以「Match vNext Sprint 2 — S2-SCORER-001 Additional Authorization」正式授權原 Scorer owner 新增純 API／export，及原 Same-Ball 接點、兩個測試、既有 helper／caller 的必要精確調和。本次沿原 Sprint 2 續作。

**S2-SCORER-001 已解除；S2-A 的 S2-SAFE-O0／O1／O2 正式通過。Sprint 2 完成等級為 PARTIAL。** S2-B／C 尚缺真實活球補救與終局證據，停止於 `S2-RECOVERY-001`；沒有宣告 CONTROLLED_OUTCOME_COVERAGE_PASS 或自然比賽可用。Ready for Commit：NO，等待審查。

原 BLOCKED 報告全文、狀態、完整性結果與舊 Evidence SHA 保存在 `Evidence.history[0]`。原 preflight、safeProbe、baselineTests、sourceReview 等均保留；新的基線、來源原文、實際結果與驗證在 `Evidence.resume`。原第 1–8 節的前置阻擋探測等敘述只描述當時結果，以下才是追加授權後的正式實作。

## 10. 精確修改與 Policy Admission

八份程式／測試檔有授權內修改：

| 檔案 | 實際修改 |
|---|---|
| `defensive-decision-throw-foundation.js` | 僅新增 `resolveBatterReachClassification` 與 export；原模組其餘來源與 immutable HEAD 原文精確相同 |
| `match-vnext-same-ball-execution-adapter.js` | 原有 Foundation 組合後，僅 S2 safe-first policy 可嘗試正式分類；分類通過才建立 single candidate |
| `contracts/match-vnext-execution-v0.1.cjs` | 加入明示 policy、admission 驗證，以及 zero-out／safe-first／完整 scorer proof 的候選分支；原 out-only 邊界保持 |
| `offensive-plate-approach.js` | held completion 對 single 必須重驗候選與 admission；仍由原 OutcomeMapping 轉成相容的 `single` |
| `script.js` | 五個既有 Same-Ball helper／接點與一個 transient admission WeakMap；沒有新增 top-level 函式 |
| `tests/pitch-production-source-scope.cjs` | 七個固定 script literals、兩個固定 OPA literals 疊在原 S1 精確契約上；保留原 pins／完整比較及反向拒絕 |
| `tests/match-vnext-same-ball-execution-contract-test.cjs` | 新增純 Scorer／候選／source contract 測試及 suite 呼叫 |
| `tests/match-vnext-same-ball-production-integration-test.cjs` | 新增 S2 fixture helpers、正式 safe／防重／partial／失敗邊界／match-end 測試及 suite 呼叫 |

script 改動的五個函式為 `getHighSchoolSameBallReceipt`、`validateHighSchoolSameBallCandidate`、`ensureHighSchoolOffensivePlateAppearanceState`、`validateHighSchoolSameBallState`、`createHighSchoolSameBallResolver`。既有 `resolveHighSchoolOffensiveDecision`、canonical applier、Game Record、Runner、Force、Save、Career 核心均未改。五個先前已授權 caller 本次也未改；必要調和全部由原 helper 完成。

S2 明示設定為 pending offensive opportunity 的 `sameBallExecution.coveragePolicy: "s2-safe-first-v1"`，在 PA admission／第一顆球產生前鎖定；未指定時為 `s1-out-only`。Admission 記錄 Match／PA／Batter／policy，S2 另保留當時的完整 capability snapshot。原 trusted callback 將此快照綁到實際 Pitch／Physical。

Transient WeakMap 保存原 admission 物件，會拒絕只改 request、只改 PA mode，或一起篡改序列化 policy／admission 的事後切換。executionOptions 不能開啟 S2。原 S1 N18「快 BR 雖 safe 但 out-only 不閉合」測試原文及預期保持，並再次通過。S2 policy 下慢 BR 的獨立檢查仍由真實 timing 形成 out，沒有被 policy 強制記成安打。

沒有新增 Save schema 或 journal。已完成的 S2 結果可公開 Save／Load 後繼續；未提交的 held／completed candidate，以及已準備但失去 transient S2 admission proof 的存檔，均保守阻擋，不從 JSON 重建提交資格。這個受控模式尚不提供未完成 S2 PA 的 Reload 續打。

## 11. 正式 Scorer API 與來源證據

新 API 先驗證 PA admission 與完整能力快照、實際 pitch／tactical context 的 Match／PA／Pitch、真實 active P／SS／1B assignment、同一 Ground Physical、空壘與 0／1／2 outs，再核對：

- SS clean arrival／clean control，實際 action actor／runner／target／dependency／來源 identity。
- ready-release／on-target throw、真實能力與 variation provenance；不接受 weak／offline／challenging／delayed throw 作為本版 clean-hit 規則。
- 1B ready／secured／completed，沿原 Incoming Receive 以保存的 explicit sample 重驗，沒有新抽樣。
- 沿原 Ground builder 重驗 runner physical source，沿原 Runner timing API 重驗時間事實；不複製 arrival 公式。
- 真正 BR 在完成接傳前到一壘、零 retirements、outs unchanged、正式 first-leg base facts、無 pending／inTransit／Recovery。
- 原 Scorer eligibility 與 actual action dependency 沒有相反或未完成事實。

條件完整才輸出 `status: supported`、`officialClassification: infieldHit`、`compatibleOffensiveResult: single`、原 batter／Physical／Match／PA／Pitch、explanation 與 admission／actions／timing／capability／Scorer source references。輸出及巢狀來源為 frozen，重複唯讀分類結果相同，輸入不變。

缺少或矛盾事實回傳明確 `insufficient`／`unsupported` 及 reason，沒有單憑 safe、空 errors／decisions 或 deferred compatibility 產生安打。原三個 Scorer API 未修改；純函式測試會移除唯一新增函式及 export，將剩餘完整模組與固定 `ab3117653945de0b7013636187c446276a96e634` 原文比較。

正式 PA 使用現有 `single` 計分代碼。Scorer 的 `infieldHit` 證明保存在正式 PA 的 `executionCandidate.batterReachClassification` 及 held outcome candidate，Receipt 會重驗；沒有把新分類名稱交給 Game Record 當新計分代碼。

## 12. S2-SAFE-O0／O1／O2 的正式 before／after

三例都沿合法 Career admission、原 public choose／Production pitch handler／OPA／原 Offensive PA owner 執行。固定 admission seed `440000`，沒有 seed search；只有目標 PA admission 前的 live `baseRunning = 20`，原轉接消費 speed `14`。0／1／2 先前出局沿原 fixture 在目標 PA 前正式記錄。actor 與外生 samples 同原基線，未修改產出後的球、接傳或 timing。

| 情境 | Runner arrival／Receive completion | Timing margin | Outs | 正式 runners after | ΔPA／AB／H／BF | ΔPO／A／E |
|---|---|---:|---|---|---|---|
| S2-SAFE-O0 | 3.7／5 | -1.3 | 0 → 0 | `[player,null,null]` | 各 +1 | 全 0 |
| S2-SAFE-O1 | 3.7／5 | -1.3 | 1 → 1 | `[player,null,null]` | 各 +1 | 全 0 |
| S2-SAFE-O2 | 3.7／5 | -1.3 | 2 → 2 | `[player,null,null]` | 各 +1 | 全 0 |

這次沒有合法出局，SS 的 field／throw 沒有被記成 assist；1B 沒有 PO，兩人沒有 E。原 batter runner 正式進壘，打序前進一次，比分不變，每例新增一筆 PA 與一筆守備 ledger event，兩個 event 各有唯一 Game Record reference。Match State 與 Game Record integrity 均無問題。

三例的完整 `before`／`after`、initial pitch、candidate、classification、receipt、下一個實際 PA 在 `resume.production.safe.cases`。每例 public Save／Load 保持相同結果；提交前後多次 duplicate callback、Load 後 duplicate、下一 PA 後 stale receipt 都是唯讀，整個 Match snapshot、Record、RNG、永久能力不變。

V8 precise coverage 確認每例一個 Tactical Selector、一個 Pitch Control、一個 Physical producer、一個原 Same-Ball Adapter execute；重複／Load 檢查後仍各一次。即時 Development 為零，沒有把 NPC 守備 action 記入玩家 primaryFielder 學習。另從 S2 single 接續原模式跑到整場結束，原 Development 正式完成，Save／Reload 後再呼叫為 duplicate，settlement IDs、history 與永久能力不重複增加。

## 13. 負向驗收與 Source-Freeze

新的純 Scorer 測試有 61 個拒絕案例，涵蓋錯誤 Match／PA／Pitch／Physical／Batter、SS／1B／BR、roster／capability／admission、非 ground／非 SS、接傳未完成或非正常品質、timing 矛盾、偽造 runner progress、待補救／待跑者、base／outs／third-out、action dependency／actor／source、相反 Scorer facts，以及只有 safe／zero errors／deferred single。另有六個 candidate 拒絕與五個新增 source-guard 反向探測。

正式 handler 有 34 個拒絕／eligibility 檢查，包括 stale live roster／BR capability、事後 policy 切換、偽造分類、錯誤 actor／timing、pending Recovery、錯誤壘包／出局／第三出局、虛構 assist、已提交 conflicting outcome。重複 PA／H／BF／E 沒有發生；非 SS／airborne 在 Same-Ball entry 前排除，沿原路徑處理，沒有套用新 scorer。

七個 partial／Reload 邊界涵蓋 PA Record、defensive Record、moment、H stat 寫入失敗，以及 held、completed-uncommitted、prepared 的 transient proof 遺失。所有 partial 狀態保留、禁止自動修復或重播；沒有第二次進壘、安打、BF 或 Development。

原兩個測試的所有既有 assertion、S1 fixture、N18、pins／seeds／cases 均保留；僅 suite 新增測試呼叫及新增函式。Evidence 另記錄「移除新增區塊／suite 呼叫後，與開工原測試全文相同」的核對。Source helper 以明示固定 literals 回復到已接受的 S1，再跑原 immutable 比較；沒有 current-source 自動接受、整檔新 hash 通關、assertion 刪除或 caller 放寬。

開發中曾修正 receipt 對零出局 `pitcherOuts` ref 的假設：原 Game Record 本來就不為 zero-out PA 建立該 ref。只修正 Same-Ball receipt，要求 zero-out 時無此 ref；Game Record 未改。另將 null Match Experience 的測試斷言改為驗證沒有 fielding evidence；並保留 unavailable receive 例，另外建立真正 failed-hands 例。完整原因在 `resume.developmentCorrections`。

## 14. 正式與相關回歸

使用原兩個 CLI 入口，現在會包含新增 S2 suites：

```powershell
node tests/match-vnext-same-ball-execution-contract-test.cjs
node tests/match-vnext-same-ball-production-integration-test.cjs
```

原兩套正式測試、十三套指定回歸及六套相關 Foundation／Scorer 驗證，共 **21／21 套 PASS（exit 0）**。均以原檔案入口執行，完整 stdout／stderr／exit／時間在 `resume.finalTests`；最終 source SHA 在 `resume.finalTestSourceHashes`。十三套清單：

1. `pitch-production-source-scope-test.js`
2. `pitch-tactical-decision-production-integration-test.js`
3. `pitch-tactical-interpretation-production-integration-test.js`
4. `pitch-tactical-decision-production-adapter-integration-test.js`
5. `pitch-tactical-intent-evidence-integration-test.js`
6. `pitch-tactical-signal-projection-production-integration-test.js`
7. `canonical-match-regression-integration-test.cjs`
8. `ss-defensive-production-integration-test.js`
9. `match-full-game-record-test.js`
10. `match-situation-lifecycle-test.js`
11. `match-experience-development-foundation-v1-test.js`
12. `match-development-settlement-presentation-v1-test.js`
13. `offensive-plate-approach-foundation-v1-test.js`

六套相關驗證為 Decision Throw Foundation／Production Integration、Runner Throw Settlement、Force Advancement、Infield Scorer Recovery Integrity Repair、Legacy Receiver Scorer Closeout。原相關 Scorer 79 checks 與 Closeout 33 checks 均保留，不寫入它們的 capture evidence，也沒有執行 Protected paths。

## 15. S2-B／S2-C 的具體停止點

S2-A 通過後，以正式 handler 調查三種失敗；以下皆是**阻擋成功的負向驗證，沒有正式 error／recovery 結算**：

| 情境 | 由真實能力／samples 產生的結果 | 正式處理 |
|---|---|---|
| 無法就位接球 | onTarget throw；1B `unavailable` | `RECEIVER_RECOVERY_REQUIRED`，Match／Record／能力不變 |
| 可接範圍內漏接 | challengingReceive；readiness margin 0.2、secure margin -0.8；`ready: true, secured: false, failed` | 同上；未自動記 1B 或 SS error |
| 偏傳 | SS 真實 arm 低且固定 accuracy sample；`offline`／`outsideReceiverReach` | 同上；未假造正常接球或出局 |

設定均在 PA admission 前完成，完整 raw capabilities／samples／failure output／before／after 在 `resume.production.failureBoundaries`。一般 onTarget 的低 receiver defense 例會同時降低 readiness 與 hands，故是 unavailable；本次沒有把此事實改稱 failed，而以另一份明示的 challenging-delivery fixture 檢查真正漏接。

`S2-RECOVERY-001` 的缺口是：失敗後實際持球者或合法的 loose-ball 抽象位置、真實補救 actor／action／completion、合法經過時間後 BR 的最終位置，以及相應 Scorer counterfactual／attributable advancement provenance。原 Runner no-contest 只輸出 unresolved／recovery required／pending BR，不能據此直接給 first 或 second。原 `resumeResolvedHighSchoolGroundBallSettlement` 需要已 resolved 的 executionEvidence 與 saved timing，是重送既有結算，不是漏球後的新守備動作。

本次授權只增加 clean-hit 規則，未授權 Error／Recovery 核心擴充。因此沒有修改這些 owner，也沒有設計第二套活球系統。下一個最小提案是審查既有 `defensive-runner-throw-settlement-foundation.js` 的 additive `resolveRecoveryContinuation` 接面：輸入已發生的 possession／bounded loose location、補救 actor/action 與 elapsed runner facts，重用既有 timing／Force／Canonical 後提供閉合事實。這只是待審查提案，尚未實作；若需要空間模型、多次接傳或額外守備員，應獨立界定後續範圍。

既有 `resolveScorerEligibility` 仍須等到實際 terminal runner/action、ordinaryEffort、potentialOut／extra advancement 來源成立才可裁定。任何新增 Error 規則或修改既有 Scorer 行為，仍需另行授權，不能把本次 clean-hit 授權延伸使用。

## 16. 最終完整性與 Alpha 貢獻

本次前置基線再次確認原 1955 份來源與 Protected metadata 相符，兩個原 S1 正式測試先通過才施工。新基線記錄當時 Git refs／index 與八份施工來源原文；Codex 回合開始自動產生的內部 capture／checkpoint refs 與上一回合的差異只作 metadata 記錄，不冒充使用者 Git 操作。

最終只允許上述八份程式／測試及本報告／Evidence 變動，其餘原內容、Protected metadata、HEAD／branch／origin tracking ref／工作中 refs／index／staged 均逐一核對。最終結果與完整重現依賴 SHA 見 `resume.integrity`／`resume.runtimeReproduction`。未執行 Stage、Commit、Push、Reset、Restore、Clean 或 Stash。

最終核對 PASS：原 1955 份可讀來源中，1947 份內容不變，8 份僅有上述授權修改；12 份 Protected 僅比對 metadata 且全部不變。原 16 份 tracked WIP 保留，新增的 Scorer 修改使 tracked WIP 為 17 份；untracked 維持 1219 份，僅本次兩份 S2 文件是相對原前置基線新增的路徑。HEAD、branch、origin tracking ref、完整 refs、index SHA 與 staged 均符合本次續作基線。104 份重現依賴已更新 SHA，僅同一組 8 份有授權差異。

Alpha 現在多了一個真正可玩的受控結果：同一顆詳細 PA 擊球可合法成為內野安打，沿原 owner 記錄、保存並進入下一打席。三種 outs、正式身份、能力來源與 exactly-once 都有正式事件證據；失敗後活球補救仍是明確缺口，Sprint 2 保持 PARTIAL，停止等待審查。

---

## 17. S2-RECOVERY-001：最新基線與審查範圍

本輪依使用者附件 `5bc05490-1262-467a-9586-ad31575ae01d/Pasted text.txt`，只授權 Focused Review、唯讀 Runtime Probe，以及 Gate D1 成立後的既有接點整合。**實際判定為 D2，因此沒有進行 Production Gameplay 修改。** 沒有新增核心 API、改動 S2-A 分類或建立新的 Owner。

先核對 Sprint 2 報告、最新 Evidence、Sprint 1 第 9–16 節與 R0 所有權／停止規則。報告已包含 S2-A 實作驗收，且 SHA 與最新 Evidence 相符。附件列出的 `resume.stages` 並不存在；實際階段狀態在根節點 `stages`。本輪保留此結構，沒有假造缺失節點。

| 最新施工前基線 | 實際結果 |
|---|---|
| HEAD／local origin/main；branch | `ab3117653945de0b7013636187c446276a96e634`；`main` |
| Index SHA；staged | `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`；空 |
| Tracked WIP／untracked | 17／1219 |
| 本輪可讀檔案 manifest | **1957 份最新 bytes**，包含兩份 S2 文件；不再假定舊 1955 份 SHA 未變 |
| Protected | 12 份，僅 metadata，未讀內容／hash／執行 |
| S2-A 八份最終 Production／Test hashes | 全部與已接受版本相符 |
| 預計及實際修改路徑 | 本報告與原 Evidence，沒有新路徑 |
| 兩個原正式 CLI 基線 | **2／2 PASS，exit 0**；包含 S1 groundout 與 S2-A Scorer／safe／防重／Source-Freeze 驗證 |

完整當前 status、refs、manifest、Protected metadata、前版 Evidence／報告 SHA、原測試 stdout／stderr／時間，位於 `recoveryReview.preflight`／`baselineTests`。前輪 21 套結果保留在 `resume.finalTests`；本輪只重新執行上述兩套，沒有把十三套舊結果冒稱為本輪重跑。

本輪讀取 `codebase-memory` skill；目前沒有可呼叫的 graph namespace，無法執行 `list_projects`／`index_status`／`check_index_coverage`。因此以 14 個限定 Defense／Physical／Runner／Match 搜尋路徑、精確來源區塊、實際匯出 API 及 Runtime Probe 補核對；不宣稱已完成全庫無 API／完整影響分析。來源 SHA、區塊及行號在 `recoveryReview.sources`（D01–D14），搜尋界線在 `scopeSearch`。

## 18. Gate A — 三種失敗後的 Ball／Possession／Recovery Owner

| 責任 | 真正的現有來源 | 可重用界線 |
|---|---|---|
| Throw／Incoming Receive | `DefensiveDecisionThrowFoundation.resolveThrow`／`resolveIncomingReceive`（D01） | 有實際 actor、品質、readiness／secure margins；沒有補救執行 |
| 原擊球空間 | `BattedBallPhysical.resolveBattedBallPhysicalTruth`、`DefensiveOpportunityFoundation.deriveGroundResponsibility`（D03／D04） | 原 ground ball 的 `leftSide`／`shortstopSide`；ground depth 為 null，不是傳球失敗後球的位置 |
| 初次 Reach／Secure | `DefensiveReachSecureFoundation.resolveReach`／`resolveSecure`（D02） | 綁定原擊球 primary SS 與能力；不是任意守備員的失球回收 |
| 失敗後球權／有限失球位置 | **MISSING** | `atReceiverTarget`／`receiverChallenged`／`outsideReceiverReach` 是類別或相對關係，沒有可支持補救的 region bounds／距離／位置 |
| 實際 Recovery Action／完成時間 | **MISSING** | 沒有產出後續 actor、接近／取得球動作與耗時的現有接面 |

沿原固定 seed `440000`、真正 public choose／Production Handler 與原外生 samples 重現 R1／R2／R3。能力設定都在目標 PA admission 前完成，沒有改產出的球、接傳結果或搜尋 seed。NPC SS 為 `regional-power-school-player-06`，1B 為 `regional-power-school-player-03`，BR 為原 `player`；原 Match／PA／Pitch／Physical 身份一致。

| 實際案例 | Throw／球到達類別 | Receive | Readiness margin | Secure margin | 正式處理 |
|---|---|---|---:|---:|---|
| R1-O0 | `onTarget`／`atReceiverTarget` | `unavailable`；ready=false、secured=false | -0.24 | -0.24 | `RECEIVER_RECOVERY_REQUIRED` |
| R2-O0 | `challengingReceive`／`receiverChallenged` | `failed`；ready=true、secured=false | 0.2 | -0.8 | 同上 |
| R3-O0 | `offline`／`outsideReceiverReach` | `outsideReceiverReach`；ready=false、secured=false | 1.8 | 1.8 | 同上；正 margin 不等於球在可接範圍 |

以下 `AVAILABLE` 指來源明示；`DERIVABLE_FROM_EXISTING_EXECUTED_FACTS` 指無需新動作假設即可推導；`MISSING` 指必要事實或產出 API 缺失；`UNSUPPORTED` 指現有資料／接面不適用於該責任。

| 必要事實 | R1 | R2 | R3 |
|---|---|---|---|
| 原球、SS／1B／BR、能力與 samples | AVAILABLE | AVAILABLE | AVAILABLE |
| 原 Throw／Receive 狀態 | AVAILABLE | AVAILABLE | AVAILABLE |
| 本次未完成接球控制 | DERIVABLE_FROM_EXISTING_EXECUTED_FACTS | DERIVABLE_FROM_EXISTING_EXECUTED_FACTS | DERIVABLE_FROM_EXISTING_EXECUTED_FACTS |
| 聲稱曾接觸手套、彈脫或漏接 | UNSUPPORTED | MISSING | UNSUPPORTED |
| 失敗後實際持球者 | MISSING | MISSING | MISSING |
| 有界且可用的失球位置 | MISSING | MISSING | MISSING |
| 可合法接近該球的補救守備員 | MISSING | MISSING | MISSING |
| 新 Recovery Action／取得球權 | MISSING | MISSING | MISSING |
| 同球時基的 start／completion | MISSING | MISSING | MISSING |
| 原 SS Secure 冒充失敗後持球 | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED |

R1 未就位不等於漏接；R2 的 failed 沒有獨立 touched／deflected／dropped 欄位，困難接球失敗不能自行記 E；R3 的 outsideReceiverReach 沒有方向／距離邊界，也不能推論 1B 可立即取回。

唯讀 Probe 特別確認：原 SS 的 pre-throw Secure 仍會被 `controlled()` 判為 true，這只表示**歷史上的傳球前持球**，不是新球權證明。將 1B 能力交給原 SS 的擊球 Reach Opportunity 會被身份驗證拒絕；這表示原接面不適用，不表示物理上 1B 永遠不能補救。

另排除三個容易誤用的名稱：`projectGroundControl(...,"recovered")` 只投影既有 2B control；`firstBaseRecoveryWindow` 是既有玩家 1B 雙殺回傳接球；`resumeResolvedHighSchoolGroundBallSettlement` 要求已 resolved 的 executionEvidence／saved timing，再套用原紀錄。三者都不是本題失敗後的新活球補救動作。

## 19. Gate B — Runner Continuation 與 Force／Third-Out

在三個實際失敗之外，另重現 R1-O1／R1-O2。五例都先由原 Handler 失敗，再於隔離 VM 中用原 deterministic Ground／Decision builder 補核對**原 first-leg no-contest 診斷**；沒有重抽 Throw／Receive／Physical，沒有建立 Recovery 或套用結算。

| Gate B 問題 | 判定 | 實際證據／缺口 |
|---|---|---|
| BR 當前位置及來源 | AVAILABLE，限原始狀態 | 原 `batter → first`、speed 14、normalStart；原 Runner 算出 arrival 3.7。沒有失敗時點的已到壘事件或後續進度 |
| Recovery 開始 | MISSING | 沒有 action start／後失敗時點 |
| Recovery completion | MISSING | 沒有完成動作或耗時；Reach margin 不是回收時間 |
| 是否已安全取得一壘 | MISSING | 預測 arrival 不能代替實際 touch／elapsed evidence；firstLeg 仍 unresolved |
| 是否可能續往二壘 | UNSUPPORTED | 初始 Ground BR 只指向 first；沒有補救後以真實進度重新評估的 Runner 接面 |
| 後續有效出局機會 | MISSING | 缺新球權、後續動作／接傳或 tag 時間 |
| 最終合法壘包閉合 | MISSING | 全部 pending BR=1、`liveBallRecoveryRequired`；沒有正式 final base |
| 空壘 Force／Third-Out | AVAILABLE，限已提供事實 | 原 first 有 BR movement requirement；second 為 noForceOut／tagRequired。五例零 retirements，outs 維持 0／1／2 |

五例 `contestAvailable=false`、`runnerResult=unresolved`、`baseChanges=[null,null,null]`。這不是裁定 BR 最終未到壘，而是原診斷沒有閉合該跑者。`thirdOut.settlementReady=true` 僅表示給定的零退休／得分事實可處理，**不會消除 pending runner，也不是 Recovery 完成旗標**。

現有 `ForceAdvancement.settleForceAdvancement` 消費 movement intents／retirements 後重建壘包，並不決定失球後跑者應跑到哪裡。不能先提供 second 目標再把其輸出當作跑壘物理證據；也不能把原 first 的 movement requirement 沿用為二壘 force。相關原來源為 D05–D08、D14 的 canonical third-out helper。

## 20. Gate C — Scorer 事實與 PA 計分接面

正式 Scorer owner 仍為 `defensive-decision-throw-foundation.js`。本輪沒有修改 `resolveBatterReachClassification` 或原三個 Scorer APIs。

| 必要 Scorer 證據 | 目前判定 |
|---|---|
| Failed action | 原接傳類別 AVAILABLE；Adapter 在建立 normalized actionFacts 前已返回。R1 unavailable 不等於普通努力的 receive failure |
| Action dependencies | 原 reach／secure／throw／receive 身份可 DERIVABLE_FROM_EXISTING_EXECUTED_FACTS 建立前段依賴；實際補救與 terminal chain MISSING |
| Actual recovery action | MISSING |
| Terminal runner facts | MISSING |
| Ordinary effort | MISSING；challenging／unavailable／outside reach 均不足以單獨證明 |
| Potential out | MISSING；雖有 BR arrival，沒有此失敗 NPC 鏈的獨立 clean-completion counterfactual |
| Attributable advancement | MISSING；原本可取得壘包、真正 final base 與失誤造成的額外進壘尚未分開 |
| Responsible actor | SS／1B 身份 AVAILABLE；應負 E 的 actor 仍 unresolved |

原 `resolveScorerEligibility` 要求 matching failed action、有效 terminal baseTouch／tag 依賴，以及 ordinaryEffort／potentialOut／額外進壘來源。直接把本次失敗輸出交給它，因沒有 actionFacts 而明確拒絕。三例原 receive 的 `errorCharged` 都為 false；不能因此記安打。正常內野安打 API 在 R1 回 `UNRESOLVED_RECEIVE`，R2／R3 回 `NONCLEAN_THROW`，均為 unsupported。

必須保持四種情況分開：

- **A：正常守備也來不及。** 可能有安打，但仍需正式分類證據；本版 S2-A clean-hit 規則不能擴用到失敗補救鏈。
- **B：一般努力原可出局，因可歸責失誤上壘。** 既有 Error Eligibility 可在完整證據成立後裁定；本輪沒有補造這些來源或改規則。
- **C：現有證據不足。** 保持 unresolved，不由 failed／offline 自動指派 E1B／ESS。
- **D：失敗造成額外進壘。** 要分開 expected base、actual base 與 causal advancement，不以最終壘包直接決定 H／E。

現有 `getHighSchoolInfieldScorerFacts`／`getHighSchoolLegacyReceiverScorerSource` 是既有 player-defense／legacy context 的來源 adapter，依賴其已執行 terminal action／saved timing，部分還明確回 insufficient。不能偽造 player SS Situation，讓 NPC Recovery 借用它們取得裁定或玩家學習。

**另外確認的下游 scope 缺口：** `match-game-record.js` 已有 `result:"error"` 的 PA／AB／BF 記錄，且不增加 H；現有 `scorerErrorOwner.authority:"defensiveActionAttribution"` 可把 team E 留給 defensive attribution，避免重複計算。可是目前同球 Contract／OPA 只接受 out 或正式 S2-A single，`batted-ball-outcome-mapping.js` 的結果集合也不含 error。四項唯讀相容性 Probe 已確認：Contract 拒絕 error、held completion 拒絕 error、Mapper 拒絕 settled-defense error，以及 Contract 拒絕沒有證明的二壘 baseChanges。這些是介面拒絕測試，不是新 Error Gameplay。

因此即使未來有合法 ROE，也不能換成 single 增加 H，或換成 out 隱藏結果。若要走該分支，Mapper 必須另有精確授權；**本輪沒有修改 Mapper 或 Game Record。**

## 21. Gate D2 — 最小追加授權提案，尚未施工

**判定：BLOCKED_CORE_EXTENSION_REQUIRED。** 七項 D1 前提中，原 PA／Record Owner 存在，但球權／位置、Recovery action／time、Runner final base、正式分類均缺必要事實；不能只靠既有接點組裝完成新閉環。依本輪附件第八節 D2、第十二節與第十五節，停止 Production Gameplay 修改。

前輪只提出 Runner `resolveRecoveryContinuation`；本輪將責任分界校正如下。以下全部是**待審查的 additive API 規格，不是已存在 API 或新實作授權**。

| 預計既有 Owner | 最小新增 API 提案 | 責任與輸入 → 輸出 |
|---|---|---|
| `defensive-decision-throw-foundation.js` 的 Throw／Receive 責任 | `resolvePostDeliveryBallState` | 原同球 failure、actor／target／capability／sample 與經批准的 delivery／contact／bounded geometry／clock 執行輸入 → 真正 post-delivery phase、接觸／偏移事實、有來源的有限位置或持球者、發生時點 |
| `defensive-reach-secure-foundation.js` | `resolveRecoveryAction` | 已支持的 post-delivery Ball State、active roster／能力、事前鎖定的選擇／access policy 與實際 stage samples → 合法可接近守備員、實際 actor／一次 reach-acquire action、start／completion、前後球權 |
| `defensive-runner-throw-settlement-foundation.js` | `resolveRecoveryContinuation` | 原 runner 身份／能力／movement／timing、Ball State、真正 Recovery action／elapsed clock、事前 continuation policy、必要的後續 terminal action 與原 third-out callback → 到壘事件／續跑決策、最終 movements／retirements／bases／outs，或明確 pending／unsupported |

建議契約至少包含：

```text
BallState = identities + ordered phase + failure refs
          + (sourced bounded location OR proven holder) + occurredAt/timeBase
RecoveryAction = same BallState ref + active actor/selection provenance
               + dependencies + attempted/completed + startAt/completedAt/timeBase
RunnerContinuation = original runner/timing refs + actual RecoveryAction ref
                   -> attained-base events + continuation decision + closed facts OR pending
```

共同限制：空壘 O0／O1／O2、同一詳細 PA／Physical、真對方 NPC、一次 bounded recovery。所有 identity、phase、time unit／origin、能力與 sample 來源都要可交叉驗證。禁止輸入 desired result／finalBase／error actor，不能由預期結果倒推球位、守備員或耗時。

這個提案仍有必須先批准的模型前提：現有品質類別沒有 bounded location，現有 Reach margin 沒有 retrieval duration。新的有限偏移／接觸／access／時間規則須在實作前明確定義與審查，並於 PA admission 前鎖定；不能以「新增一個 API」掩蓋任意 fixture 落點或固定補救秒數。缺乏合法產出來源就回 insufficient／unsupported。

Runner API 只消費真實 Defense facts，不兼任球位／球權／Recovery 動作產生器。原 Timing 公式不改、不複製到 Adapter；若需要 elapsed progress 或一壘後重新評估，必須明列為既有 Runner Owner 的 additive 授權。無法證明停一壘就不能強制停一壘，無法證明續跑二壘也不能直接給二壘。

三個後續 Gate 不能省略：

1. **Scorer。** 優先讓完整實際事實供原 `resolveScorerEligibility` 消費；不改原 Error Eligibility 或 S2-A clean-hit。失敗／補救後若要正式記 H，還需單獨審查既有 Scorer owner 的 additive recovered-reach 分類或 counterfactual proof 接面，不能只憑 no E。
2. **ROE 計分相容。** 若最後選到有證據的 batter-reached-on-error 案例，另申請 `batted-ball-outcome-mapping.js` 的 **settled-defense-only error** 接點與精確 integrity validation；保留原 compressed 抽樣語義。這是額外路徑，不在目前授權。若 Source-Freeze 需要額外 caller，仍須另停。
3. **原正式提交。** 前述核心證據閉合後，才由原 Adapter／Contract／OPA／script 接點完成唯一 PA／Game Record，使用既有欄位及原 Owner，驗證 PO／A／E 的合法歸屬與 team E 防重。不得預先建立 committed receipt。

不新增 Defense Spatial／Possession owner，也不修改 Canonical、Save Schema、Career 或自然 rollout。若上述既有 Owner 無法承擔已界定職責，應再列具體 scope，不把不同責任塞入 Runner 或另建第二套 authority。完整 input／output／拒絕責任在 `recoveryReview.minimumExtensionProposal`。

## 22. 本輪驗證與負向覆蓋界線

本輪實際執行：兩個原正式 CLI 基線、五個真正 failure／first-leg／Reload 診斷、四個相容性拒絕 Probe。五例 Match、Game Record、永久能力的前後 hash 一致；public Save／Load 後仍阻止 continuation，每例 Adapter 執行次數仍為一。沒有新 Recovery action、正式安打／失誤／進壘、Record 或 Next PA。

| 負向要求 | 本輪實際狀態 |
|---|---|
| 虛構持球權／傳球前 Secure 冒充新球權 | 已精確識別不適用來源；新 post-failure validator 不存在，**不宣稱新 Recovery 負向 PASS** |
| 補救 actor 不在 active roster | 新 Recovery executor 未實作；只確認原 SS Opportunity 拒絕用 1B 能力冒名，未冒充完整補救 roster 驗收 |
| 球位置不存在 | 已確認 MISSING producer，Gate D2 |
| Recovery 沒 completion／time 無來源 | 新 API 未實作；列為提案必拒條件，未虛構執行 |
| Runner final base 未閉合 | 五例 fail-closed，pending BR 保留 |
| 提前給二壘 | 原 Contract 對未證明的 baseChanges 拒絕；不是新的二壘跑壘計算驗收 |
| Failed／offline 強制歸 E | 三例未分類／未增加 E；error token 的三個現有接點均拒絕 |
| Wrong SS／1B／BR、Physical／Pitch／PA | 原正式基線中的既有正反測試重新通過；不稱為新 Recovery identity suite |
| Duplicate／stale callback、conflicting receipt、重複 Record | 原基線重新通過；新 failure 後 continuation／Reload 無新增動作或寫入。尚無 Recovery receipt 可驗收 |
| Partial Save 冒充 settled checkpoint | 原七項 S2 partial／Reload 邊界由基線重新執行；五個新失敗 public Load 後仍阻擋 |
| NPC 事件誤增玩家防守評價 | 原基線保留；五例 Match／永久能力不變。新 Recovery credit 路徑未實作 |
| S1 groundout／S2-A infield hit | 兩套正式基線 PASS；61 項 Scorer 拒絕與原 N18 保留 |

所有 Recovery-specific 正向驗收均為 **NOT EXECUTED／0 new results**，不是 PASS。缺少核心 API 的負向項目列為待授權實作驗收，未拿 source review 冒充 Gameplay 測試。完整對應在 `recoveryReview.negativeCoverage`。

沒有改 Production／tests／helper／caller，因此沒有新 Source-Freeze delta。十三套 legacy 與其他相關 suites 保留前輪結果，本輪依附件第十一節未重跑；只有未來 D1 真正施工後才需要完成該組回歸。

兩個 inline Probe 的完整可重跑程式與 raw facts 分別保存在 `recoveryReview.runtimeProbe`／`compatibilityProbe`；沒有新增 harness 檔案、改寫全域 fs／assert，或執行 Protected。

## 23. 本輪 Source／WIP／Protected／Git 完整性

最終核對採本輪 `recoveryReview.preflight.manifest` 的 **1957 份當前內容**。只允許本 Markdown 與既有 Evidence 變動；其他 **1955 份最新 WIP bytes**、104 份 Runtime 依賴以及已接受八份 S2-A Production／Test hashes 都維持不變。兩個原正式測試與所有核心模組均未改。

12 份 Protected 僅核對 size／mtime metadata；沒有內容讀取、hash 或執行。HEAD／branch／local origin/main／完整 refs／index／staged 及完整 Git status、17 tracked WIP／1219 untracked 均對照本輪最新基線，沒有新增或刪除路徑。最終實際比對值與報告 SHA 由 `recoveryReview.integrity` 記錄；Evidence 不存自己的 final self-hash。

本輪沒有 Stage、Commit、Push、Reset、Restore、Clean 或 Stash。第 1–8 節 BLOCKED、第 9–16 節 S2-A PASS 及原 Evidence／驗收歷史保留。前輪 Runner-only 提案亦保存在 `recoveryReview.priorOwnerExtensionProposal`，本輪以精確 Owner 分界修正提案，沒有回寫成已施工。

## 24. 對 Full Match Playable Alpha 的實際進展與停止

**本輪審查完成；結果為 BLOCKED_CORE_EXTENSION_REQUIRED，Sprint 2 整體 PARTIAL，Ready for Commit = NO。** 原受控出局與正常內野安打保持可驗證；沒有新增可玩的 Recovery 事件。

新增的實際成果是確定球位／持球、補救動作與共同時基、Runner continuation、Scorer 因果證據及 ROE 計分接面的責任缺口，避免以先給一壘／二壘、指定失誤者或沿用舊持球狀態偽造閉環。R1 unavailable、R2 challenging failed receive、R3 offline 的實際補救、最終壘包、H／E／額外進壘與下一正式 PA 都仍待完成。

依本輪附件 D2／修改權限／停止規則，停止於上述追加授權提案。沒有宣告 RECOVERY_OWNER_READY、CONTROLLED_RECOVERY_PASS、SPRINT_2_COMPLETE 或 NATURAL_MATCH_READY，也沒有進入 Sprint 3、Phaser／Match Director 或自然比賽開放。

## 25. S2-RECOVERY-001 Core Extension ? Phase A Model Contract

Authorized APIs: resolvePostDeliveryBallState / resolveRecoveryAction / resolveRecoveryContinuation. Model locked before Production edits. Detailed normative model is coreRecovery.modelContract in Evidence. Existing sections 1-24 remain historical records.

```json
{
  "version": "s2-recovery-model-v1",
  "policy": "s2-recovery-facts-v1",
  "scope": "Empty bases O0/O1/O2; one actual failed SS-to-1B delivery, target-station 1B retrieval only; no new throw/tag/PA commit.",
  "calibration": "Provisional game coefficients; not measured baseball statistics.",
  "sampling": {
    "authority": "preAdmissionControlledRecoverySamples",
    "version": "s2-recovery-samples-v1",
    "order": [
      "direction",
      "displacement",
      "contact",
      "approach",
      "acquire"
    ],
    "values": "Five finite numbers in [0,1), exact keys; locked before first pitch. Consume once at failed delivery and recovery, no resample. Clean or mode-off path consumes none."
  },
  "location": {
    "origin": "actual incoming 1B target station under the bounded station model; not a tracked global coordinate",
    "direction": "direction < .5: infield apron; otherwise foul-side apron",
    "distanceMeters": "onTarget: 1+3*displacement; challengingReceive: 2+4*displacement; offline: 6+6*displacement",
    "regions": {
      "near": "0 < distance <= 4m",
      "outer": "4 < distance <= 12m"
    },
    "contact": "Only ready/failed receive samples contact < .5 as glove deflection; otherwise untouched. These are newly simulated contact facts, not historical receive fields.",
    "access": "Only actual active 1B assigned to this target station has modeled access; other assignments or other regions unsupported. No fabricated holder; failure -> loose with holder null."
  },
  "clock": {
    "version": "s2-recovery-clock-v1",
    "origin": "original same-play runner/delivery relative launch = 0",
    "unit": "coarseRelativeTime (CRT), not seconds",
    "failure": "nominal short/medium/long delivery 4/5/6 CRT (legacy timing scale); challenging +1, weak +3, offline +1+displacement; plus actual receiveDelay",
    "reaction": "1/(1+.25*reaction) CRT",
    "movementSpeed": "1+.25*mobility meters/CRT",
    "movement": "distance/movementSpeed CRT",
    "acquire": "1/(1+.25*fielding) CRT",
    "capabilityScale": "Existing NPC consumed defense/arm/speed scale 0..20; no rescaling or alias substitution.",
    "start": "failure occurredAt",
    "completion": "start+reaction+movement+acquire; stored to .001 CRT, not an outcome-selected constant"
  },
  "recovery": {
    "selection": "Unique active target 1B; role/target station and actual capabilities verified against admission roster",
    "approach": "margin=.6*range+.4*mobility+4*(approach-.5)-.5*distance; reached iff margin>=0",
    "acquire": "margin=.75*fielding+.25*catching+4*(acquire-.5)-(gloveDeflection?4:2); secured iff reached and margin>=0",
    "forecast": "At selection, same durations from visible location and locked capabilities, before acquisition samples; forecast is deterministic and explicitly provisional.",
    "failure": "One failed approach/acquire remains loose/pending; no second recovery loop."
  },
  "runner": {
    "arrival": "Call existing private deriveRunnerArrival; validate original resolveTiming input/result, never duplicate its formula.",
    "decisionAt": "max(original first arrival, failure occurredAt). Observe the loose ball and selected 1B access forecast, not future acquire result.",
    "secondLeg": "Call same existing runner-arrival primitive with origin first, target second, normalStart, early progress, original BR speed; independent second duration.",
    "decision": "Conservative clear-loose-ball-window policy: attempt second only if forecast possession time > decisionAt+second-leg duration; otherwise hold first. This declines risk even if a later relay might lose; it is a prelocked running policy, not a missing-feature fallback.",
    "closure": "Hold closes only after proven first attainment, successful real recovery and original arrival <= actual recovery completion. If runner selected second or recovery failed, pending; never award second or an out without executed terminal facts.",
    "force": "Closed hold passes original first movement and zero retirements to existing Force/ThirdOut; no formula changes."
  },
  "rejections": [
    "unknown policy/sample keys or nonfinite values",
    "identity/roster/capability or admission changes",
    "unsupported original delivery and region",
    "false ball or recovery recomputation",
    "time origin/start/completion mismatch",
    "caller desired finalBase/result/error/retirements",
    "original runner arrival mismatch",
    "second attempt missing later terminal evidence",
    "uncommitted proof promoted to PA"
  ]
}
```

Baseline: both original official CLI suites PASS (exit 0). Source-Freeze: preserve R0/S1/S2-A guards; only exact additive APIs/exports and approved Sprint 2 script literals may change. The historical 10A readiness whole-file check already differs from accepted WIP; its caller remains unchanged. No Mapper, Game Record, Save, Career or UI change is authorized.

## 26. Core Extension 授權、來源與三個 API

依附件 `1f11707c-959c-4423-9bb0-5d4efa8dfe08/Pasted text.txt` 實作三個 additive API。**本輪結果為 CORE_RECOVERY_FACTS_PASS；正式 H／E 分類與 PA 提交仍未通過。** 本輪跨 2026-10-18／19（Asia/Taipei），完整驗收、原 stdout、來源與完整性資料在原 Evidence 的 `coreRecovery`。第 1–24 節與前輪 Evidence 節點保留歷史狀態，不回寫成當時已實作。

施工前兩個原正式 CLI 均 exit 0。先將第 25 節與 `coreRecovery.modelContract` 寫入，再修改 Production。沿用原 Match／PA／Pitch／Physical、active roster、原 Tactical Selector 與 Player Detailed PA；沒有建立新的 Recovery Engine 或第二顆 Physical。

| 既有 Owner／新增純 API | 本輪責任與驗證 |
|---|---|
| `defensive-decision-throw-foundation.js::resolvePostDeliveryBallState` | 重算核對原 Reach／Secure、Ground 初始跑者與 Force、Throw／Receive 及固定 samples，驗證 admission／NPC／同球身份與時基；只產生傳球後球權、有限區域與發生時點 |
| `defensive-reach-secure-foundation.js::resolveRecoveryAction` | 驗證 BallState，再由真正 active 1B、target-station access、已鎖能力與 samples 執行一次 approach／acquire；輸出成功或失敗與耗時，不指定玩家 SS 作為補救者 |
| `defensive-runner-throw-settlement-foundation.js::resolveRecoveryContinuation` | 驗證補救與原 `resolveTiming`；呼叫既有 `deriveRunnerArrival`，獨立計算二壘腿與保守進壘決策；只在事實足夠時閉合一壘，否則 pending |

三個原核心檔在扣除新增函式區塊與一個 export 後，**與施工前 WIP bytes 完全一致**。原 `resolveScorerEligibility`、S2-A clean-hit classifier、Throw／Reach／Runner 舊公式均保留；S2-A 分類函式另有既有 body digest 與負向 mutation guard。

## 27. 有界模型的具體語義與限制

區域原點是此次實際 1B incoming target station。這是明示的站位抽象，不是已追蹤的全場座標；現有 assignment 與 incoming receiver 只用來綁定此站位。新模型僅涵蓋該站位內側／界外側的近區（0–4 m）與外區（4–12 m），並只允許有此站位 access 的 actual 1B 補救。其他角色、區域與後續回傳不在本版模型內。

`onTarget`／`challengingReceive`／`offline` 分別提供距離公式的類別輸入，再由 displacement sample 產生 1–4／2–6／6–12 m 距離；direction 決定內側／界外側。只有 ready 但 failed 的接球才可由 contact sample 新模擬 glove deflection；其餘為 untouched。**這些是新模型執行所得，不能倒稱為舊 Receive 已提供的接觸或落點。** 傳球失敗後 holder 必為 null，歷史 SS Secure 只保留 source ref。

`s2-recovery-samples-v1` 以可核對的受控介面提供五個 `[0,1)` samples，固定順序為 direction → displacement → contact → approach → acquire。版本、authority、順序、精確 key 集與數值均驗證；整份 descriptor 在 PA admission 前複製鎖定。只在實際失敗分支消費指定 slots，不呼叫新 RNG、不搜尋 seed、不在失敗後換樣本；原模式未啟用時不進入新模型。

時基為同一原 play launch = 0、單位 CRT（coarseRelativeTime），**不是秒**。名義 delivery 使用原 Timing 的 short／medium／long 4／5／6 CRT 尺度，再加入已宣告的品質／偏移與原 receiveDelay。補救從 failure occurredAt 開始，耗時由反應、區域距離／移動速度與 acquire 分別計算；Reach margin 僅判斷 approach 成敗。係數、量綱、能力尺度與公式完整列在第 25 節，全部標示為暫定遊戲模型，沒有宣稱真實統計校準。

執行驗證後補充三個邊界，沒有改係數：未 reach 時不執行 acquire，實際 acquire duration 為 0；forecast 仍保留預期取得球時間。若補救早於 BR 一壘到壘，未到達的 runner decision 標為 `notReached`／type=null。進度比例以 elapsed／duration 後再截至 `[0,1]`；pending 二壘腿的比例不能代替 terminal base／retirement。

保守 runner policy 在 admission 前由模式版本固定：於 `max(firstArrival, failureAt)` 觀察球仍鬆脫及合法補救 access forecast，只有預估球權取得晚於獨立二壘到壘時間，才選擇 attemptSecond。否則選擇 holdFirst，表示放棄額外風險；不是因二壘功能缺失而禁止續跑。實際 R3 確實選擇 attemptSecond。holdFirst 也必須同時有已到一壘、實際成功補救與共同 elapsed 事實，才可閉合。

## 28. 正式 Production 執行結果

以下全部由原 public choose → 正式 Player Detailed PA → 原 Tactical／Physical → Same-Ball Adapter 執行。Fixture 能力與受控 sample descriptor 均在目標 PA admission 前設定，沒有修改產出的球、接傳結果、最後壘包或失誤責任。實際補救 NPC 為 `regional-power-school-player-03`（1B），原 SS 為 `regional-power-school-player-06`。

| 案例 | Failure／補救 | failure → action end（CRT） | Runner facts |
|---|---|---:|---|
| R1-O0 | unavailable receive；1B approach／acquire 成功 | 5 → 7.711 | first arrival 3.7；holdFirst；closed first，outs 不變 |
| R2-O0 | challenging failed receive；untouched；補救成功 | 6 → 8.920 | holdFirst；closed first，outs 不變 |
| R3-O0 | offline；外區 9 m；補救成功 | 6.5 → 11.388 | 獨立選擇 attemptSecond；pending，沒有直接給二壘 |
| R1-O1／O2 | 同 R1；原 outs 1／2 | 5 → 7.711 | 均 closed first；原 Force／Third-Out 驗證，零新增出局 |
| R1 acquire failure | acquire sample 0.1；未取得球權 | 5 → 7.711 | holder=null；RECOVERY_FAILED／pending |
| R3 weak 1B | admission 前將 1B defense 由 5 改為 1；approach 失敗 | 6.5 → 11.300 | holder=null；能力確實改變中間結果，pending |
| R2 glove deflection | contact sample 0.25；模型產生彈脫，補救成功 | 6 → 8.920 | closed first，零新增出局 |
| R1 slow BR | admission 前 baseRunning=1；補救早於一壘到壘 | 5 → 7.711 | 尚無 first attainment；decision 未執行，FIRST_CONTEST_REQUIRES_TERMINAL_EXECUTION |

九個正式案例中，**五例形成 closed runner facts，四例保持 pending**。每例仍 `candidate.closed=false`，沒有 result token，沒有 H／E 分類，沒有正式 PA／AB／BF／Record／下一打席提交。閉合 runner facts 與可提交 PA 是分開的驗收層級。

## 29. 防重、拒絕、能力與執行來源

Phase B／C／D 各有直接限定測試：B 三種真實來源與 12 項拒絕；C 三種成功加 acquire／approach 失敗與 9 項拒絕；D 三種 runner 延續與 11 項拒絕。API 輸入不變、輸出遞迴 frozen、相同明示輸入可重算。另有四項 admission 後 policy／sample／capability 變動拒絕，以及十二項新 Source-Freeze 負向檢查。

附件二十項拒絕要求逐項對應在 `coreRecovery.requirementCoverage`：虛構 holder、舊 Secure 冒充球權、缺失／越界 location、非授權 samples、錯誤 actor／position／能力、start／completion／origin、不成功卻持球、錯誤 arrival、未證明二壘或出局、未閉合 PA、強制 H／E、四種同球身份、duplicate／stale、Reload 重抽與 NPC 學習污染，均有實際限定驗證。

九個案例各自核對 stale callback 不執行新 Adapter、錯誤 receipt／held completion 拒絕，以及真正公開 `saveGame();loadGame()` 替換 player 後的 continuation 拒絕。Match／Record 與永久玩家能力快照不變，沒有 NPC 補救誤增玩家守備學習。

另以 V8 precise coverage 唯讀計數一個正式 R1：原 Tactical decision、Pitch control、BattedBallPhysical、fair-contact 與 Adapter 各 **1 次**，Development settlement **0 次**；Save／Load 與 stale callback 沒有第二次 Physical／Adapter。三個新純 API 因上游驗證重算分別被呼叫 8／4／2 次；這些只消費同一份鎖定輸入，沒有重新抽樣或再執行一個邏輯動作。完整可重跑 inline 程式與數值在 `coreRecovery.runtimeWitness`。

## 30. Source-Freeze 與指定回歸

只修改三個授權 Owner、原 Adapter／Contract／script 接點、兩個原正式 tests、原 `pitch-production-source-scope.cjs` helper 及本兩份文件，共十一個路徑；沒有新增路徑。script 三項必要 literal delta 逐項反轉後與施工前 WIP bytes 相同。舊核心 body 也以原 bytes 反轉比對；不是整檔 current hash 自動接受。

保留 R0 repair、Sprint 1 精確來源 delta／pins、原 N18 與全部 Gameplay assertions、S2-A Scorer／safe／防重驗收。新增 guard 會拒絕原 body 變更、重複 API、API 外額外來源、移除 sampling admission 檢查與繞過鎖定 samples。歷史 10A readiness runner 的整檔 pin 已在本輪施工前與已接受 WIP 不符；該 caller 未改，也沒有為它新增豁免。

| 本輪最後回歸群組 | 結果 |
|---|---|
| 兩個原正式 CLI，含 S1 與 S2-A／新增 Recovery | 2／2 PASS；檢查修正後再執行兩套，exit 0 |
| 原十三套指定 Legacy | 13／13 PASS，exit 0 |
| 直接相關 Defensive／Runner／Force／Scorer，加 Reach／Secure | 7／7 PASS，exit 0 |
| 新 Phase B／C／D 與 Source-Freeze 正反測試 | 全部 PASS，納入原 Contract 正式 CLI |

十三套為 pitch source scope、五套 tactical production、canonical match、SS defense、full Game Record、Situation Lifecycle、Experience Development、Development presentation 與 Offensive Plate Approach。七套為 Decision/Throw foundation／production、Runner/Throw settlement、Force advancement、Scorer recovery integrity、legacy receiver scorer closeout 與 Reach/Secure foundation。完整檔名、時間、原 stdout／stderr 在 `coreRecovery.finalTests`；未執行 Protected 或把全庫測試冒稱通過。

唯讀獨立檢查找到新進度比例過早截斷的問題，已修正並補數值斷言；另補慢 BR 未到壘 pending 與 R2 glove deflection 正向案例。現有 Runner 對 physical runnerState 一致性的檢查也經核對，沒有複製或放寬原 arrival 公式。

## 31. Scorer／Mapper 邊界與最小後續提案

使用真實 source refs 將原 field、throw、receive 與新 recovery field 投影成既有 normalized actionFacts，再呼叫**未修改**的 `resolveScorerEligibility`。空 contests 可形成零項裁定，但它不表示安打或沒有失誤；加入需要裁定的失敗 contest 會因缺正式 defensive baseTouch／tag terminal 而拒絕。這些鏈也尚未具備獨立 ordinary-effort、clean-completion／potential-out 與 attributable advancement 證據。

下一個最小審查提案是另行授權 additive recovered-reach classifier／counterfactual proof 接面，先定義上述來源，保持既有 Scorer 與 S2-A clean-hit 規則。只有正式 ROE 證明成立後，再審查 `batted-ball-outcome-mapping.js` 的精確 settled-defense-only error 路徑與原 held-PA 消費；使用既有 Game Record 的 PA／AB／BF+1、H=0、defensive-owned team E 一次的語義。本輪沒有修改 Mapper 或 Game Record，也沒有把 ROE 換成 single。

R3 attemptSecond 的後續停壘／回壘／回傳／觸殺 terminal 亦需另外完整執行與驗證；本輪不給未證明二壘或新增出局。提案明細在 `coreRecovery.minimumNextAuthorization`，均尚未施工。

## 32. 最終完整性、進展與停止

以本輪最新 preflight 的 1957 份可讀內容比對，授權十一個路徑之外的 1946 份 WIP 內容均維持不變；十二份 Protected 僅比對 size／mtime metadata，沒有內容讀取／hash／執行。最終實際 manifest、Git／index／refs 比對與報告 SHA 寫入 `coreRecovery.integrity`。HEAD／main／local origin/main、staged 空與 index 保持原狀；新增兩個 tracked modified 狀態來自這次授權的 Reach／Runner Owner，untracked 路徑不變。

完整 refs 與施工前相比，跨續行新增兩筆 `refs/codex/turn-diffs/captures/.../base`，沒有移除 refs；因此不宣稱完整 refs 完全未變。兩筆完整名稱與值保存在 `coreRecovery.integrity.git.addedRefs`。本輪沒有執行 ref 寫入命令，HEAD／branch／local origin/main／index 與 staged 比對仍通過。

**本輪交付 CORE_RECOVERY_FACTS_PASS；Sprint 2 整體仍 PARTIAL、S2-A PASS、Ready for Commit = NO。** 已實作真正失球狀態、一次合法 NPC 補救與有來源的跑者延續；尚未取得 CONTROLLED_RECOVERY_PASS 或 SPRINT_2_COMPLETE。沒有 Stage／Commit／Push／Reset／Restore／Clean／Stash，也未進入新 Sprint、自然比賽開放或 UI。

完成後停止，等待審查。
