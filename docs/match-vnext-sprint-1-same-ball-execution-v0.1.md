# 《棒球人生》Match vNext Sprint 1 — Same-Ball Gameplay Execution v0.1

2026-10-18（Asia/Taipei）

**結果：BLOCKED_BEFORE_IMPLEMENTATION_SOURCE_FREEZE_CALLER_SCOPE。Ready for Commit = NO。**

本輪完成 Preflight、指定基線重跑及精確阻礙重現，尚未開始 S1-A–S1-E。沒有新增 Gameplay、Contract 或測試模組，也沒有修改 Production、既有測試、helper 或歷史 Evidence。此結果不屬於 IMPLEMENTED_PARTIAL 或 CONTROLLED_SLICE_PASS；未交付新的可玩事件。

本輪附件已授權 R2／R3 的限定 Gameplay 實作，取代 R0 文件當時的未授權狀態。停止原因是同一附件第六節明確禁止修改五個既有 tracked WIP callers，且要求 helper 不足時停止並提出追加授權。

## 1. Preflight 與完整性基線

| 項目 | 實際值 |
|---|---|
| HEAD／local origin/main | `ab3117653945de0b7013636187c446276a96e634` |
| Branch | `main` |
| 開工時間 | 2026-10-18T02:11:33.211Z |
| Tracked WIP／untracked | 14／1,211 |
| Staged | 空 |
| Git index SHA256 | `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d` |
| R0 helper SHA256 | `14133b951cbb248b6710d3bd9f873a0e0e4e5421348d9026eda31c39fd3f15c3` |
| 可讀既存檔基線 | 1,949 個檔案 |
| Protected | 12 個路徑，僅 stat/status metadata；沒有讀取、hash 或執行 |
| 本輪六個允許新增路徑 | 開工時均不存在 |

R0 helper 是已存在的 WIP，hash 與 R0 記錄的修復後版本一致。沒有以 HEAD 覆蓋任何 WIP。origin/main 僅檢查本機 tracking ref，沒有 fetch。完整 status、refs、manifest、protected 清單及 metadata 見 Evidence.preflight。

## 2. 已執行驗證

| 驗證 | 結果 | 界線 |
|---|---|---|
| `node tests/pitch-tactical-decision-production-integration-test.js` | **12/12 PASS** | 原 T10，固定原 seed，含既有 current-index VM 正式比賽、ON/OFF 與 reload；沒有新模式 |
| `node tests/pitch-production-source-scope-test.js` | **7/7 PASS** | 95 protected functions、25 globals、131 個拒絕 mutation；不執行 Production |
| 五個 caller 的原始比較區塊 | **5/5 ACCEPT** | 從目前 caller 原文抽出比較區塊，以原 pins／真 helper 執行；其餘四套完整 suite 未重跑 |
| 必要 OPA pending barrier 的記憶體差異 | **5/5 REJECT，符合預期** | 五次均在呼叫 script helper 前失敗 |
| 必要 PlateDecision callback 接點的記憶體差異 | **2/2 REJECT，符合預期** | Intent／Signal 直接比較整檔 |
| 必要 Index 載入差異 | **2/2 REJECT，符合預期** | 原 Receiver wiring guard 只接受 Receiver 原有精確插入 |

這些比較拒絕是阻礙診斷，不是 P-A–P-J／N01–N23 的 Gameplay 驗收。Evidence 保存完整基線 stdout/stderr、實際比較區塊、pin、原始 assertion 屬性與可重跑的 inline 診斷程式。診斷只在區域 VM 的檔案讀取 binding 提供記憶體文字；沒有改寫磁碟來源或全域 fs/assert。

初次 Index 診斷預設四格縮排，唯一 anchor 檢查拒絕後改為目前來源的兩格縮排；修正後完成上述所有比較。這是診斷設定錯誤，未變更 Production 或測試 verdict。

## 3. 阻礙 S1-SCOPE-001

五個禁止修改的 caller 都直接用 `assert.equal(current, baseline, file)` 凍結 `offensive-plate-approach.js`：

| Caller | Case／比較位置 | 原 pin |
|---|---|---|
| `tests/pitch-tactical-decision-production-integration-test.js` | case 8，164–170 | `ac53bf61964bde4b40501c77e15269bae99b55cc` |
| `tests/pitch-tactical-interpretation-production-integration-test.js` | case 8，152–158 | `98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7` |
| `tests/pitch-tactical-decision-production-adapter-integration-test.js` | case 8，177–184 | `9b9546f94a7286afef474be634fd93c57eb455db` |
| `tests/pitch-tactical-intent-evidence-integration-test.js` | case 10，211–219 | `2a4b44a034b714b8de3c8a6897507995ab0f8ccd` |
| `tests/pitch-tactical-signal-projection-production-integration-test.js` | case 14，262–270 | `674e49115a9ed7d67c69a3023b5a594d41fe584c` |

目前 OPA 對五個原 pin 都完全相同（以 caller 的 LF normalization 比較）。最小必要變更見證位於 `prepareNextPitch`，322–325：

```diff
-    if (!normalized || normalized.completed || normalized.pendingPitch) return normalized;
+    if (!normalized || normalized.completed || normalized.awaitingDefense || normalized.pendingPitch) return normalized;
```

這只是必要 barrier 的診斷見證，並非完整新模式 patch，未套用到檔案。此單行改動即在五個原比較區塊觸發 `ERR_ASSERTION / strictEqual / offensive-plate-approach.js`。修改後的 normalized SHA256 為 `37a4e98161e4543ed2e683877478d217f3e0135274a9572fe5541e8449d02630`，原 pin 為 `426538ad6f3d4b4257e0114549724e691cf4eab3f3546686896f972cebfd093a`。

`assertPitchProductionSourceScope` 只處理 `script.js`。OPA 比較發生在它之前；單改本輪已授權的 helper，無法合法改變上述 caller 的整檔 assertion。改寫全域 assert／fs、require side effect、跳過 assertion 或變更 pin 都不構成精確契約調和。

另外，Intent／Signal：
- 直接凍結 `plate-decision-foundation.js`，會拒絕 JSON clone 之後的可信 callback 接點。
- 經 `receiver-source-index-authorized-wiring.cjs` 比對 Index。該 guard 只接受原 92 tags 加既有 Receiver tag，會拒絕新增 Contract／Adapter tags。

因此不是重跑測試即可解決，也不是歷史七行 Snapshot Repair 失效。這是新 Gameplay delta 尚無合法比較入口；R0 §13 已將 caller／額外 checker 列為需另行授權的候選範圍，本輪附件又明確保留停止規則。

## 4. 最小追加修改授權提案

**只追加上述五個 caller 的 import 與 source-freeze 比較分支。** 不需要新增 checker 檔案。共用精確檢查可留在已授權的 `tests/pitch-production-source-scope.cjs`，新增具名 export：

```text
assertMatchVNextSourceDelta(file, current, originalPinned, receiverSourceText?)
```

每個 caller 的具體 before／after literal 存於 Evidence.additionalAuthorization.callerPatches。核心提案如下，尚未套用：

```diff
-const { assertPitchProductionSourceScope } = require('./pitch-production-source-scope.cjs');
+const { assertPitchProductionSourceScope, assertMatchVNextSourceDelta } = require('./pitch-production-source-scope.cjs');
```

五個 caller 在原最後的整檔 assertion 前，加 OPA／PlateDecision 的精確 delta 分支；Intent／Signal 的 Index 分支改由同一 helper 組合既有 Receiver wiring 契約與必要的兩個新 tags。其餘檔案仍沿原比較。

新的 checker 必須從原 pin 加逐項精確變換推導 expected source；禁止接受任意 current body 或整檔新 hash。Index 必須保留 Receiver 原有驗證、唯一插入 anchor 及原 tags／attributes／相對順序。R0 七行修復維持獨立保護。

獲得授權後才實作 checker 與最終 Gameplay literal transforms，並測試：missing／duplicate anchors、額外 Contact／Physical／Pitch RNG 修改、非授權 callback／wiring、額外或重排 tags、R0 舊 overwrite 還原均被拒絕。原五個 pins、測試玩法設定、selector、Save 比較及所有原 gameplay assertions 都保留。

**目前提案未獲追加授權；沒有預先修改這五個 tracked WIP 檔。**

## 5. R0 契約與實作狀態

| 階段 | 本輪狀態 |
|---|---|
| Preflight／指定基線 | COMPLETE |
| Source-freeze 可施工性 | BLOCKED_CONFIRMED |
| S1-A Actual Pitcher／Capability | NOT STARTED |
| S1-B Trusted Callback／Pending-BIP | NOT STARTED |
| S1-C Actual NPC SS／1B | NOT STARTED |
| S1-D Closed Candidate／Unique Commit | NOT STARTED |
| S1-E Continuation／Evaluation | NOT STARTED |

目前來源核對：
- `script.js:10495–10511` 讀取對方實際 P、control ×2；仍有 placeholder／fallback。既有 normalize 以 saved runtime 覆蓋 fallback（`pitch-sequencing.js:214–216`），尚未完成新投手刷新。
- `script.js:10644–10696` 建立 PA，context 尚未放入明確 pitcherId。沒有以來源 review 冒充 R5 runtime 能力見證。
- `plate-decision-foundation.js:107–111` 仍 JSON clone executionOptions；可信 callback 傳遞尚未實作。
- OPA fair-contact boundary 存在（444–474），但 held completion、三層 pending barrier 與同球 NPC bridge 均未施工。

現有呼叫鏈為 public choice → 原 Match handler → PlateDecision → OPA → Physical → 原 OutcomeMapping。預期新增的同球 NPC／runner／closed candidate → 原 offense owner 唯一提交 → Game Record → next event 接點仍未建立。NPC actor mapping、receipt、dispatch-before metadata、防重／partial-write 保護均未實作，也沒有新的 Match／Record before-after runtime diff 可宣稱。

## 6. 正負向驗收與 R4／R5

| ID | 契約 | 本輪 |
|---|---|---|
| P-A | True Capability | NOT EXECUTED |
| P-B | Actual Pitch／single selector | NOT EXECUTED |
| P-C | Player Decision | NOT EXECUTED |
| P-D | Same Physical Identity | NOT EXECUTED |
| P-E | Actual NPC Defense | NOT EXECUTED |
| P-F | Legal Settlement | NOT EXECUTED |
| P-G | Game Record | NOT EXECUTED |
| P-H | Continuity | NOT EXECUTED |
| P-I | Evaluation | NOT EXECUTED |
| P-J | Save／Reload | NOT EXECUTED |

N01–N23 **逐項均為 NOT EXECUTED**。Evidence.contractAcceptance.negative 保留全部 23 個原 trigger、拒絕語義及個別狀態，沒有刪除、合併或降標。特別是 source comparison probe 不算 N11 的真 Pending-BIP runtime test；兩組舊基線通過也不算完整 N23／Group F 通過。

`S1-NPC-SS-EMPTY-O0/O1/O2` 全部 NOT EXECUTED。R4 Receipt／Save、R5 True Capability／Selector 均 NOT EXECUTED；施工前提受 scope 阻礙，沒有據此推論 Save 已不相容或能力來源不存在。部分提交、reload、防重、match-end growth 等新模式驗收皆未開始。

目前安全保留的既有路徑限於本輪重跑的 T10 既有正式流程與 source guard；沒有新的 mode 開關或自然比賽 rollout。未執行其餘廣泛回歸或全庫測試。

## 7. 精確交付與結案檢查

本輪只新增：

1. `docs/match-vnext-sprint-1-same-ball-execution-v0.1.md`
2. `docs/match-vnext-sprint-1-same-ball-execution-v0.1-evidence.json`

既存修改檔案與修改函式：**無**。四個允許新增的 Production／test 模組保持不存在。沒有 Stage、Commit、Push、Stash 或 destructive Git operation。Save schema、Canonical Settlement、Career owner、Receiver v2、UI-P2.4B 皆未改。

Evidence.integrity 記錄結案時逐檔 manifest、protected metadata、HEAD／refs／index／staged 比較，以及新增路徑 allowlist 檢查；protected 只對 metadata，不宣稱內容相同。Evidence 自身 hash 不寫入自身，避免遞迴；report hash 另存 Evidence。

## 8. 對 Playable Alpha 的貢獻與剩餘缺口

本輪實際貢獻是定位並重現阻止 S1 合法施工的比較入口，將追加範圍限縮到五個 caller 的小型測試契約接線。**尚未增加可玩 Gameplay 覆蓋。**

追加授權後，仍須按 S1-A → S1-E 完成三個 outs 情境、全部 33 個正負驗收、R4／R5 與指定 legacy regressions。之後的 safe／error／recovery、其他守位、飛球／平飛球、多跑者／雙殺、完整 Match Loop、台灣 Competition Rules Profile、Phaser 操作與跨場 Career Consequence 仍屬後續缺口，未在本輪施工。

**停止於 S1-SCOPE-001；Ready for Commit = NO。等待五個 caller 的 import／精確比較分支追加授權。**

---

## 9. 追加授權後的最新結果（2026-10-18）

**CONTROLLED_SLICE_PASS。P-A–P-J 10/10、N01–N23 23/23 通過；R4／R5 通過。Ready for Commit = YES，等待審查，未 Stage／Commit／Push。**

以上第 1–8 節是原始 BLOCKED 嘗試，全文保留。使用者後續以 `6df4d6f9-e5a4-486f-924a-5987f7bf2305/Pasted text.txt` 明確批准 S1-SCOPE-001 的五個 caller import／精確比較分支；本節起記錄追加授權後的實作與驗收。原始阻礙及紅燈保留於 Evidence.history、continuation.baseline 與原報告，未改寫成從未發生。

本次交付使正式 Detailed PA 能完成一次同球 NPC 守備、合法結算、紀錄與後續事件。此等級限受控 opt-in；不宣告 NATURAL_MATCH_READY，也未新增自然比賽開關、Phaser UI 或全面 Match Engine。

## 10. 精確施工範圍與原 WIP

修改十個既存檔案：

| 檔案 | 實際修改 |
|---|---|
| `offensive-plate-approach.js` | `prepareNextPitch` pending barrier；新增 `completeHeldBallInPlay` 與 export。Contact／Physical／Pitch RNG 公式未改 |
| `plate-decision-foundation.js` | `prepare` barrier；`resolve` 第二參數傳入 trusted callback，避開 executionOptions 的 JSON clone |
| `script.js` | 下列七個既有函式、七個新 helper 與 transient WeakMap |
| `index.html` | 原 `script.js` tag 前唯一加入 Contract、Adapter 兩個 classic-script tags |
| `tests/pitch-production-source-scope.cjs` | 原守衛加精確 S1 literal reverse transforms；新增具名 comparator；保留原 R0 七行例外 |
| 五個已追加授權的 caller | 僅 helper import 與 source comparison branches；原 pins、seeds、fixtures、assertions、案例數與順序保持 |

`script.js` 修改的既有函式：`recordHighSchoolMeaningfulPlateAppearance`、`ensureHighSchoolPitcherRuntimeState`、`ensureHighSchoolOffensivePlateAppearanceState`、`prepareHighSchoolPlateDecision`、`resolveHighSchoolPlateDecisionPitch`、`resolveHighSchoolOffensiveDecision`、`advanceHighSchoolMatchPlaybackStep`。

新增 helper：`getHighSchoolSameBallReceipt`、`assertHighSchoolSameBallContinuable`、`validateHighSchoolSameBallCandidate`、`isHighSchoolSameBallRequested`、`captureHighSchoolSameBallCapabilities`、`validateHighSchoolSameBallState`、`createHighSchoolSameBallResolver`。

六個原授權新增路徑均已建立：兩個 Production 模組、兩個可重跑測試，以及本報告／Evidence。沒有新增其他 checker、runner、journal、fixture 檔或架構文件。`save.js`、Canonical third-out 核心、原玩家 SS commit、Career formulas 與既有成長 owner 未改。

精確 Before／After 原文及 hashes 位於 Evidence.continuation.baseline.hashes、finalDelta、integrity.callerDelta。五個 caller 逐檔從開工 WIP 加唯一 import／branch literals 還原 expected，與實際 current 全文相等；不是以 HEAD 覆蓋 WIP。三個巢狀比較區塊保留原六格縮排，實際 literal 另記錄，不混同原提案的四格縮排。

## 11. 正式執行鏈與真實能力

```text
chooseHighSchoolYearOneMatchMoment
 → resolveHighSchoolYearOneMatch
 → 原 resolveHighSchoolPlateDecisionPitch
 → PlateDecisionFoundation.resolve（獨立 trusted callback 參數）
 → OPA.resolveNextPitch → 一次 BattedBallPhysical
 → 同球 SS eligibility → held BIP
 → MatchVNextSameBallExecutionAdapter.execute
 → 原 Opportunity／ReachSecure／GroundDefense／DecisionThrow／IncomingReceive
 → 原 Runner timing／Force／Canonical Third-Out／scorer attribution
 → OPA.completeHeldBallInPlay
 → 原 resolveHighSchoolOffensiveDecision 唯一提交
 → 原 canonical applier／PA Game Record／NPC defensivePlay
 → 原打序／下一事件／半局 owner → 原 match-end development
```

新 Adapter 只組合既有 Foundation，不寫 Match／Game Record、不重新 contact、不自建 timing／force／third-out 公式。Contract 純驗證 identity、expected-before、actor／capability provenance 與候選閉合。

受控基準實際投手為 `regional-power-school-player-01`，SS 為 `regional-power-school-player-06`，1B 為 `regional-power-school-player-03`，BR 為 `player`。P／SS／1B 均由正式 active roster 解析，不能使用 placeholder 或玩家 SS wrapper。P control 取當前 `pitchingProfile.control`，沿既有尺度 ×2、clamp 1..20；更換 runtime identity 時使用原初始化 API，前任 control／心理／pitch history 不覆蓋新 P。

玩家能力由 live Player 與原 offensive adapter 取得；power 仍由原 batting／fitness／instinct 公式導出。SS／1B 的 reaction、range、fielding、catching、arm、throwing、mobility 沿原 defensive adapter 及明示 aliases，保存 raw／consumed／actor／source／scale，缺少有限值或 active assignment 便拒絕。沒有新增 TeamStrength bonus。

R5 固定 actor、context、seed 與外生 samples，分別單改 P control、玩家 batting、observe、fitness（檢查原 power 中間值）、SS defense、SS arm、1B defense；原 control realization、recognition score、swing window、damage ceiling 及守備中間值皆出現對應差異，不以最終出局變化作為能力消費的唯一證明。

V8 preciseCoverage 實測整個成功打席及三次 duplicate lookup：正式 `createTacticalPitchDecision` 1 次、`resolvePitchControl` 1 次、fair contact 1 次、Physical producer 1 次；PA 期間 match-end development 0 次。沒有替換 selector／Physical producer，也沒有修改全域 assert／fs／require。

## 12. Pending、三個 outs 情境與唯一提交

trusted callback 由 Production owner 擷取 immutable snapshot，獨立於 JSON executionOptions 傳遞。OPA、PlateDecision、script 三層 Pending-BIP barrier 已實測；held state 保留 pitch history、actual pitcher 與同 physicalId，未提交 PA、不建立下一球，也不保存 callback。歷史 S1-B 的 public Pending witness 與最終 Foundation boundary 測試分開保留；最終 public chain 在同一同步呼叫內完成候選與原 owner 提交。

固定 admission RNG seed 440000，保留正式流程產生的 match simulationSeed（本例為 918943）；各情境在 target admission／投球生成前配置正式受控空壘 fixture。O1／O2 先由原 ordinary PA、record、order owners 記錄既有出局，核對 Match／Record 前提後才開始 target PA。未在 contact 後改 outs、actor 或能力湊結果。

| 情境 | 既有 timing／force 結果 | 正式 after／續行 |
|---|---|---|
| S1-NPC-SS-EMPTY-O0 | 真接球、傳球、接傳，BR-before-first | 0→1 out；下一合法打者 before 與 after 相接 |
| S1-NPC-SS-EMPTY-O1 | 同上 | 1→2 outs；下一合法打者 before 與 after 相接 |
| S1-NPC-SS-EMPTY-O2 | 第三出局為 BR-before-first，無得分 | 2→3 outs；交回原 half owner，下一半局 0 out |

每個情境均為 player PA +1、實際 P BF +1、P out +1、實際 SS A +1、1B PO +1；E／H／得分不增加、空壘、打序只前進一次，玩家 defense line 與永久能力不變。PA 與 NPC defensivePlay 各一筆；NPC action／scorer／actor refs 於 Game Record dispatch 前組好。PA 不附 NPC defensiveAttribution，避免先占用 defensivePlay identity，PO／A 僅由 NPC event 歸屬。

基準 timing margin 3.65；原 Foundation 的 reach、secure、strength、accuracy、receive margins 分別為 4.23、4.5、2、3、1.8。這些是實際消費能力與樣本算出的中間值，沒有先指定出局再回填 facts。Physical contactQuality 沿原 deterministic draw 0.9951428100466728；初始 policy 中的 `quality` key 不是 `contactQuality` override，Evidence 明示實際 consumed rolls。trusted Pending callback 同時轉交該 Physical 已有的 continuousContactScore，讓原 contactQuality／execution evidence／hardContacts 計算保留真值；三個成功情境均為 hardContacts=1，沒有另算公式或重抽。

候選提交前比對 version、Match／PA／Pitch／Physical／batter、打序、P／SS／1B、active assignment、outs／runners／scores、retirements、third-out 與 scorer。transient WeakMap 僅證明本次同步到達原 owner 的 exact candidate，不可序列化。原 owner 只採 candidate canonical settlement 或 legacy token 路徑之一。

提交後從既有 PA、NPC defensivePlay、completedMoment 與 Game Record eventRefs 對賬，投影 frozen read-only receipt；未建立持久 journal 或第二個 Match owner。相同候選再來只回 duplicate／receipt；衝突、部分 refs 或未提交候選 reload 均拒絕。下一 PA 後仍可查舊 receipt，不再執行投球、守備或結算。

## 13. P-A–P-J／N01–N23 最終驗收

| 正向 | 實際驗證 | 結果 |
|---|---|---|
| P-A | 真能力來源及單來源能力對照 | PASS |
| P-B | actual P／runtime／pitch／Game Record actor；唯一 selector／control producer | PASS |
| P-C | public Take、Contact、Power；count／swing／execution 差異 | PASS |
| P-D | 真同球 identity；一次 contact／Physical；三層 pending barrier | PASS |
| P-E | 真 opposing SS／1B 及 Reach／Secure／Throw／Receive | PASS |
| P-F | O0／O1／O2 原 timing／force／third-out／canonical applier | PASS |
| P-G | PA／BF／P out／SS A／1B PO 各唯一增量，無 E／假得分 | PASS |
| P-H | 下一棒／換邊由原 lifecycle 續行，after 對上 next before | PASS |
| P-I | 原 offense evidence、NPC 不產玩家 SS credit、PA 不永久成長 | PASS |
| P-J | stable save／normalize／public load、refs／partial failure、成長防重 | PASS |

| 負向 | 實際拒絕／保留語義 | 結果 |
|---|---|---|
| N01 | 異 Physical、candidate version 不符 | PASS |
| N02 | 異 PA identity | PASS |
| N03 | batter 與 batting slot 分別不符 | PASS |
| N04 | 異 Pitch／P、stale runtime／saved pitch identity | PASS |
| N05 | SS／1B actor 不符、missing receiver assignment | PASS |
| N06 | roster assignment／能力／before 狀態變更 | PASS |
| N07 | 同候選 duplicate 僅 lookup，零增量 | PASS |
| N08 | 相同 PA、不同候選內容拒絕 | PASS |
| N09 | resultApplied／durable refs 防止重交；partial 拒絕 | PASS |
| N10 | 下一 PA 後舊候選只能讀既有 receipt | PASS |
| N11 | OPA／PlateDecision／script 不 prepare Pending-BIP 下一球 | PASS |
| N12 | 重複查詢不增加 selector／contact／Physical／growth 次數 | PASS |
| N13 | 入新路徑前非 SS 沿原 mapper；入後改 responsibility 拒絕 | PASS |
| N14 | 入前 airborne 沿原 mapper；入後改 truth 拒絕 | PASS |
| N15 | foul／take／whiff 維持原 count，不呼叫 fair-BIP 守備 | PASS |
| N16 | missing capability／raw／來源／fallback provenance 拒絕 | PASS |
| N17 | 真 receive failure 與 missing active receiver 拒絕，無 reroll／fallback | PASS |
| N18 | 真 fast-BR first-leg safe 未能閉合即停；pending／recovery 候選拒絕 | PASS |
| N19 | scorer 缺失、失敗 action、斷裂 dependency 拒絕 | PASS |
| N20 | canonical 寫入後、PA／NPC／moment 與 NPC 統計中途失敗皆停住 | PASS |
| N21 | stale pending pitch、缺 mode、uncommitted reload、部分 refs 拒絕 | PASS |
| N22 | PA 後永久值不變，development invocation 0；原 match end 唯一成長 | PASS |
| N23 | 指定 mode-off／Compressed／Player SS／Routine／成長與 guard 回歸 | PASS |

完整 assertion 結果、前後 Match／Record、能力、candidate、receipt、next event 及 fault injection snapshots 位於 Evidence.continuation.finalAcceptance.production。原 R0 設計文字及驗收 IDs 均保留，沒有刪除／合併拒絕語義。

## 14. R4 Save 與失敗安全界線

16 項 Save／failure cases，另加三個 outs 情境的 post-next-PA reload。實際使用原 `saveGame`／`normalizeSave`，並以 public `saveGame`→`loadGame` 驗證 pending、postcommit、post-next 三邊界。fresh PA、pending pitch identity／provenance、正式 Record 與永久狀態保持；legacy save 無新 metadata 仍能準備原打席。

失敗注入包含 canonical 已套用但尚未寫 PA、PA 後尚未寫 NPC event、兩筆 event 後尚未完成 moment，以及原 GameRecord 寫入 1B PO 的中途 setter failure。均保留部分狀態並標記 blocked，reload／playback／重交不補套、不修補紀錄、不領成長。這是 fail-closed 能力，沒有宣稱同步 JavaScript 等於自動 rollback；blocked partial save 需審查，不能當正常 checkpoint 續行。

負向測試曾發現 saved pending pitchId 未與 PlateDecision identity 交叉驗證，已修正 Production 狹小 identity guard，並納入最終 exact lock。開發中錯用 history 欄名、非 SS fixture 的 middle lane 與刪錯無關 eventRef，也保留失敗記錄及修正理由；未更改成功情境 seed、原 Gameplay assertions 或結果公式。詳見 Evidence.continuation.developmentCorrections／bookkeepingCorrections。

R5 的失敗 case 使用真能力及既有 samples：1B defense=1／receive=.99 真接傳失敗；BR baseRunning=20（原 adapter 消費 speed=14）真 first-leg safe，均保持 Pending 並阻止任何 PA／Record 寫入，沒有偽造出局。

受控 PA 後繼續原 mode-off 比賽，125 個既有流程步驟完成比賽；原 match-end owner 保存三個唯一 development settlement IDs。target offense moment 被原成長 evidence 消費，NPC play 不產玩家 primary-fielder evidence；reload 後重領回 duplicate，history／永久值不變。

最終證據 review 另發現 Pending handoff 漏傳已產生的 contactQuality；已補上原 Physical 的數值，新增 summary／history／realized 三方一致 assertions，重新固定 exact literal 並重跑新整合與全部十三套指定回歸。修正前的完整驗收資料保留於 Evidence.continuation.preContactQualityFinalAcceptance，沒有覆蓋歷史結果。

## 15. 精確 Source-Freeze 與 bounded regression

Stage 0 先完成共用 comparator 與五 caller 接線，才進 S1-A–E。Stage 2 從實際最後 Production delta 固定 literal transforms；OPA／PDF 從五個原 pin 推導 expected，Index 先組原 Receiver 唯一 wiring，再加兩個固定 tags。script 只反轉七個已批准函式與兩段 exact helper insertion，然後執行原 protected body／global／wiring 比較。額外同名 helper、override 或外部呼叫也拒絕，原 unrelated defensive-only scope 仍保留。

最終新 Contract suite：來源驗證 94、額外 source lock 拒絕 13、pure candidate 拒絕 32，全部 PASS。涵蓋 missing／duplicate anchors、原 pins、更改 Contact／Physical／Pitch、untrusted callback、Receiver wiring、tags 重排／重複、R0 overwrite 還原、candidate identity／closure／scorer。沒有用整檔新 hash 代替舊 pins，也沒有動態讀 current source 來擴大守衛期望。

| 既有完整 suite | 實際結果 |
|---|---|
| Pitch production source scope | 7/7；95 函式、25 globals、131 mutations |
| Tactical decision production（原 T10） | 12/12 |
| Tactical interpretation production | 10/10 |
| Tactical decision production adapter | 11/11 |
| Tactical intent evidence | 10/10 |
| Tactical signal projection production | 14/14 |
| Canonical match regression | 50/50 |
| SS defensive production | 26/26 |
| Match full Game Record | 13/13 |
| Match situation lifecycle | 23/23 |
| Match experience development | 46/46 |
| Match development settlement presentation | 35/35 |
| Offensive plate approach foundation | 136/136 |

上述十三套 exit 全為 0；raw stdout／stderr／時間存於 Evidence.continuation.finalRegression、legacyRegression。五 caller 保留原 ON／OFF Match／Player／Record／RNG parity 與 reload assertions。這是指定 bounded regression，未宣稱全庫測試或自然新模式 rollout 通過。

可重跑的新測試：

```text
node tests/match-vnext-same-ball-execution-contract-test.cjs
node tests/match-vnext-same-ball-production-integration-test.cjs
```

## 16. 最終完整性與後續缺口

逐一比對原 1,949 個可讀既存檔案：僅十個授權既存路徑改變，沒有遺失；新增路徑恰為六個原授權路徑。其餘原 WIP／historical evidence 均保持。十二個 protected 路徑只比 size／mtime／status，metadata 全同，未讀內容、未 hash、未執行。Unicode 檔名使用 `git ls-files -z` 精確盤點，避免 C-quoted 名稱誤報。

HEAD、branch、local origin/main、全部 refs 及 Git index hash 均與追加授權開工基線相同；staged 空。沒有 Stage／Commit／Push／Stash／destructive Git 操作。Save schema、Career owner、Canonical 核心、Receiver v2 與 UI-P2.4B 均未施工。圖索引停於 2026-10-15，已對依賴路徑查 coverage 並以目前來源及 runtime 驗證補足，不以 stale graph 宣稱完整。

仍缺安全上壘／失誤／recovery、其他守位、飛球／平飛球、多跑者／雙殺、更廣的完整 Match Loop、正式台灣 Competition Rules Profile、Phaser 與跨場 Career consequence。已進同球執行但未閉合者必須停住，現有受控 slice 不可全面開放自然比賽。

**本次追加授權工作完成並停止，等待審查。Ready for Commit = YES；Commit／Push 仍未授權、未執行。**

