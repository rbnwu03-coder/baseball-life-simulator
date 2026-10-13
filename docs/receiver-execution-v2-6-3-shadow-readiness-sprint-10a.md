# Receiver Execution v2 — 6-3 Shadow Source & Lifecycle Readiness / Sprint 10A

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
正式施工基線：`32ee5ec55e4791952a9ef5d68c126389ab1e1ff6`

**Readiness 查證與最小變更設計完成；完整 Sprint 10B Shadow 仍為 NO。** 本輪只新增來源矩陣、draft 契約、隔離 readiness tests 與證據。真實 NPC1B positioning、incoming Secure demand、共同 CRT／touch 時間與正式 pin／Save guard 仍缺來源或接入，保持 C／BLOCKED。Receiver v2 未啟用，`runtimeEnabled=false`，L03＝**PARTIAL**。沒有執行 candidate／正式 Shadow Simulation，也沒有開始 Sprint 10B、Sprint 11 或 Defensive Foundation Closeout。

## A. Baseline / Protected WIP

開始 main／HEAD／origin/main 均為上述 Sprint 9 Commit，index 空，只有原 smoke 未暫存修改與 11 個保留的 untracked 檔案，沒有未知差異。Sprint 9 的 17 檔提交已完成；本輪沒有 Stage／Commit／Push／Reset／Clean／Stash。[Baseline](receiver-execution-v2-sprint-10a-baseline-evidence.json)

保護 smoke、install.ps1、Sprint 3 中間 JSON、Sprint 4 四個稽核交付與 Sprint 5 五個中間 evidence；沒有讀取、hash、執行、修改或 Stage 這 12 個受保護內容。只比較 Git status、size／mtime metadata，不能稱為 protected content hash 證明。672 個可讀既有 tracked 檔案包含三項 Baseline Debt tests 與 Sprint 7–9 原始成果，結案逐份 SHA-256 對照；結果見 [Non-interference](receiver-execution-v2-sprint-10a-non-interference-evidence.json)。

原 Sprint 8／9 suites 與 227 manifest 本輪未重跑。Sprint 9 的 151/151、20/20、255/255，以及更早 Full Repository **224/227 PARTIAL／三項 Debt** 均保留原證據；本輪 readiness checks 不取代它們，也不宣告新的全量結果。

## B. Architecture / Actual Source Owners

使用 codebase-memory Tier 2：symbol search → 雙向 depth=1 caller／callee trace → full snippet → 當前磁碟比對 → paths coverage。SS 20 組 traces／20 snippets、lifecycle 25 組 traces／26 source pages（含 normalizeSave 分頁）、capability／pure 補證均保存。Graph 自動更新的 generation 各自記錄，不假定所有查詢屬同一 generation。既有 paths 的 no_recorded_issue／metadata_changed、新增檔的 not_tracked／missing 都不是完整性或新鮮度證明；缺 namespace／registry CALLS edge 不代表不可達。

[SS architecture](receiver-execution-v2-sprint-10a-ss-architecture-evidence.json)、[Lifecycle architecture](receiver-execution-v2-sprint-10a-lifecycle-architecture-evidence.json)、[Capability architecture](receiver-execution-v2-sprint-10a-capability-architecture-evidence.json)、[Roster supplement](receiver-execution-v2-sprint-10a-roster-architecture-evidence.json)、[Pure supplement](receiver-execution-v2-sprint-10a-pure-architecture-evidence.json)、[Final coverage](receiver-execution-v2-sprint-10a-coverage-evidence.json)。

A＝現有正式來源；B＝從正式來源確定推導；C＝缺少來源／新權威。A 的 Legacy combined boolean 或常數只具有原 authority，不能升格成獨立 physical receiver stage。[完整 31-row ownership matrix](receiver-execution-v2-sprint-10a-source-ownership-matrix.json) 逐欄保存 owner、來源行、生成時間、保存位置、首次 execution 前是否可取得及限制。

| 資料／owner | 分類與生成／保存 | 首次 execution 前與不足 |
|---|---|---|
| Match／PA／physical contact／ground handoff | A；Match creation、原 fair contact 與 supported ground handoff；原 cache 保存 identity | 原始 ingredients 可取；B typed binding 尚未 emitted／pinned，不能採 synthetic fallback |
| SS primary／NPC1B／batter runner／first target | A；physical opportunity、active roster、runner realization、legal route | roster／合法表面可取；selected delivery／action facts 在 execution 後，須另做 frozen handoff cross-check |
| Original owned SS sample | A；既有 resolver 首次 callback；shortstopExecution.sample／原 evidence 保存 | 尚未 execution 不可取得；不得 preload／新增 callback |
| Canonical first throw | A；原 acquisition／selected route 完成後的 throw quality、demand、release、variation | execution 後取得；不能由 receive success 或 safe/out 回推 |
| NPC1B start／movement／position completion | C | roster 1B、atBase 常數及 ready proxy 不能供應 MDU／completion |
| Incoming demand／Secure duration／touch | C | 原 throw demand 是 thrower demand；receive／retirement 投影不是獨立 hands／touch authority |
| v1 ball／runner timing、ordinal windows | A；原 timing owner／handoff；部分 arrival 只在 contest 可用時保存 | inputs 可有 B projection；共同 upstream launch offset 與 v2 CRT bridge＝C |
| Capability adapter／ordinary effort | 原 defense／arm／speed＝A；既有 composite lookup＝B；新 mobility／catching／reference calibration＝C | actual 與 average reference 分開，不能補值取得正式 E／would-be A |
| Pin／Save／timing seam | 正式接入＝C；Sprint 9 isolated metadata contract 可 B 驗證 | 不能把 isolated pin 或 JSON round-trip 宣稱 runtime 保存完成 |

## C. Physical Identity / Actor Handoff

原 `match.id`、`ordinaryDefensivePlateAppearanceState.paIdentity`、`battedBallPhysicalTruth.identity` 與 `groundBallInPlayState.identity` 可保留。PA identity 含 original inning／half／batter／order／outs／bases；contact 由原 PA 加 pitch slot，handoff 另用原 ground-defense identity。不能在 settled 後用變動的 outs／bases 重建，也不能只 parse 字串而省略 authoritative copies。

新 slice 必須證實 SS primaryDefenderId＝player、active SS roster actor＝player、active NPC1B 與 legal route receiver 相同、原 batter-runner／first-base obligation 相同，初始空壘且 outs 為 0／1／2。Player1B incoming、categorical coverage、unsupported physical／synthetic fallback 不屬本輪 admission。[Source adapter draft](receiver-execution-v2-sprint-10a-source-adapter-contract.json)

現有 ledger action IDs 在 execution 時以 runnerSettlementIdentity＋ordinal 生成；canonical throw identity 另由包含 route 的 selection identity 生成。它們不是既有 pinned physical slot。未來 `primaryThrow` 是 B 的穩定 slot 提案；正式 pin／namespace authority 尚未建立，不能因 route／accuracy／failure／retry 改名取得新 vector。

Hold／offline／notAttempted 必須在同一預先選定版本的 causal contract 中處理，不依成功後 opt-in。現有 Legacy direct／hold 有真實分支；本轮只是觀察原分支，沒有選擇新版本。

**入口與 phase 限制：** 空壘 SS fixture 實際走 automatic routine。原 helper 的「pending」攔截點可能已在 executing，sample 尚未生成不代表尚未 beginExecution。本輪改在原 `beginAutomaticGroundBallSituationExecution` 入口之前捕捉來源；不強行製造 meaningful player decision。另有 occupied-base public SS handler 作 outside-slice 相容參考，不能當空壘 meaningful admission witness。Meaningful／routine 未來須在共同 handoff owner 驗證，不能只保護其中一個 dispatch。

## D. NPC1B Positioning / Incoming Delivery

SS builder（script.js:11859）直接取得 active NPC1B，使用 `fielding + (sample-.5)*4 >= 3.2` 的 combined receiverReady，傳入 `atBase=true`，tagAvailable 跟隨 ready。它**沒有调用** `resolveHighSchoolInfieldReceiver`；該 helper 的 availability 判斷屬 2B slice。Teammate `receivingAvailable=Boolean(entity)` 是 roster-presence metadata，SS owner 未以它作獨立 readiness 判定。

| NPC1B 所需來源 | 現有來源 | 本輪判定 |
|---|---|---|
| 起始 context／補位狀態／required movement | legal roster assignment；沒有獨立位置或 cover execution source | C／BLOCKED，不填 atBase／MDU0 |
| Reaction／Range | 目前都 alias NPC defense | B compatibility；不證明獨立觀察值 |
| Mobility | roster speed 存在；speed→movement 映射未建立 | raw A、轉換 C |
| Positioning start／completion／arrival 比較 | combined ready；沒有獨立 timestamps | C／BLOCKED |
| Delivery accuracy／quality／release | 原 canonical SS throw | A，保存原 selected actor／target／variation |
| Incoming difficulty／Secure demand／clean-bobble delay | coarse thrower demand／quality class | C；不能填隔離 prototype 係數 |
| Receive eligibility／hands／possession | 原 ready proxy、action completed/failed label | 舊 authority A；獨立 v2 stage C |

最小新增來源須由原 ground handoff／physical defense context 在原 contact／launch 前保存真實 receiver 起始與 cover demand，另由 versioned incoming adapter 在原 canonical throw facts 完成後供應 demand／delay。Positioning／Secure 的 execution owner 與 adapter／policy version 必須明定、保存與校準。這是後續設計條件，本輪沒有替正式比賽產生位置、需求或新傳球 sample。

## E. CRT / Touch Timing

既有 v1 ball arrival 使用 `4 + distanceDelay + qualityDelay + delayedRelease`；runner arrival 沿用原 speed／start／progress 投影，可為負值。部分 noContest 分支沒有 numeric arrival，不能填零。Ordinal `{value,state}`／wide／narrow window 不是 absolute CRT。

Sprint 8 `crt-integer-ticks-v2-1` 定義 1000 integer ticks＝1 coarse CRT，第一段 upstream launch＝0，同球所有後段共享 origin。現有 v1 沒有已證的 upstream launch offset；scalar×1000 最多是 B 的單位量化，不能完成 origin 證明。若未来取得 launch offset，ball 與 runner 必須共同減同一已證 offset，再以凍結 quantization 轉換；不能只重設 ball 原點而讓 runner time 保持舊值。

| 時間／法律事實 | 可重用 | 尚缺 |
|---|---|---|
| Ball／runner arrival | 原 v1 facts／inputs，保存原 version | v2 origin／unit bridge；unknown 維持 unavailable |
| Positioning／Secure completion | combined proxy 及 v1 default delay 只屬舊 authority | 真實 start／movement／incoming demand 與新版 duration |
| Base touch／contact | 原 atBase=true；terminal action 由 actual retirement 投影 | 不能反推獨立 touch completion，需 possession＋contact authority |
| Initial 0／1／2 outs／live first-base obligation | 原 admission／runner owner | candidate 仍不能代替 Force／Third-Out 或計分 |
| Exact tie | v1 deriveSettlement 使用 margin>0，tag 要早於 runner；v2 pure tie 不給 candidate | 明確保留各版本判定，closePlay label 不等於退休 |

正式 seam 必須在既有 **DefensiveRunnerThrowSettlementFoundation** owner 內加入明確 model／timing discriminator，保留原 v1 完整重算。v2 分支需驗證同 origin、delivery／position／Secure、合法 possession／contact、target／live force、ordered third-out，再交既有 single apply；unknown version 拒絕。本輪沒有修改 Settlement／Force／Third-Out，也沒有第二個退休 owner。[Lifecycle / timing plan](receiver-execution-v2-sprint-10a-lifecycle-save-matrix.json)

## F. Actual Capability / Ordinary Effort

[Capability adapter proposal](receiver-execution-v2-sprint-10a-capability-adapter-proposal.json) 的新 adapterVersion 是 **DRAFT**。現有 S8 只接受 `receiver-explicit-input-v1`，不能把 draft 新 tag 或未提供的八欄能力直接接入。

NPC fielding／reaction／range＝defense，arm／throwing＝arm，decision＝round((defense+contact)/2)。Roster speed 是真實既有值，但不是已校準 defensive mobility。Catching 不在 general NPC adapter；若未来採 fielding alias，必須保存 B compatibility provenance 並獨立批准／version，不能稱為新 independent skill。

Career defense 沿用 catching／reaction／range／fitness／ballSense／observe／discipline／IQ 的既有 composite；SS／3B arm branch 與 catcher／outfield position tools 亦保留。沒有更動能力公式或新增 Career skill。未來需要 frozen actor／roster／adapter snapshot、position／environment calibration、same-vector monotonic 與 stage isolation 驗證；本輪只查證原 alias，不宣告全 Career gradient 或自然平衡 PASS。

Ordinary Effort Reference 是不同的同 league／position／environment 平均守備來源。目前 calibration authority、cause-only clean counterfactual、culpable late action、error-specific advancement 均未提供，維持 `insufficientScorerFacts`。不能用 weak actual capability 或 average=10 產生正式 E／would-be A。此不足阻擋正式 scorer eligibility；它本身不禁止安全的非計分純階段，完整 Shadow 另有 positioning／demand／time 等 execution-source C。

## G. Lifecycle / Save Minimal Migration Map

[完整 16-row lifecycle／Save matrix](receiver-execution-v2-sprint-10a-lifecycle-save-matrix.json) 將現在 authority 與 draft change 分開。

| 位置／phase | 現有行為 | 最小後續變更，尚未實作 |
|---|---|---|
| Ground handoff／new admission | 正式 physical／runner owner；沒有 receiver pin | 共同 `groundBallInPlayState.receiverModelAdmission` 唯一 owner，在首次 execution 前 pin；meaningful context 保存一致副本 |
| createSituation／pending | 明列欄位，clone context；decision owner admission 不等於 model admission | 不以 extra top-level 欄位假設保存；routine 不新增虛構 situation |
| beginExecution | 取代 executionState | 明確保留驗證後 pin／binding reference；不能依最新 policy 換版 |
| Executed／cache | 原 execution evidence／sample／action chain | 綁定原 sample binary64、actors／capabilities／route／source／version；原 cache 恢復，不 reroll |
| Settled／closed summary | exactly-once settlement；summary 明列有限欄位 | 只按需要保存版本 reference；不 backfill 或重記 GameRecord |
| normalizeSave entry | defaults／clone／saveVersion rewrite；additive metadata 可能被保留 | 在原始輸入 normalization 前驗證可信新格式 discriminator／required tags |
| Shared decision-throw guard | firstBase／3B／missing facts／settlementApplied early returns | 在所有 early returns 前驗證 pin／copy；保留原各 family validation |
| Historical／cold／duplicate | 原 legacy omission／cache／settlement authority | 真正 historical 仍相容；new required tag 缺失不可偽裝 historical；禁 retry sample／latest-policy reselection |

Copy-only probe 證實既有 normalizeSave 可保留 unknown receiverModelAdmission sentinel，卻没有 receiver-version semantic guard。這是未接通表面，不是 v2 Save PASS。S9 isolated pending serialization 與 retention 不能代替正式 lifecycle；candidate executed／settled 仍 **NOT IMPLEMENTED／NOT TESTED**。

歷史識別須由正式格式／Save owner 提供可信 source-version 與辨識 policy。若所有新標記均被刪除並偽造舊格式，單一 digest／caller history label 不能認證歷史。不得以 topology 或既有 out／E 推斷 model。新 guard 必須拒絕 unknown／矛盾／缺失的新格式，且不 mutation live player／cursor／record。

## H. Shadow Storage / Read-Only Boundary

[Shadow storage draft](receiver-execution-v2-sprint-10a-shadow-storage-contract.json) 提議由正式 Match 外的 diagnostic collector 管理 immutable sidecar Map；可另存 exclusive-create audit artifact，不能放進正式 Save、family execution cache、executionEvidence、simulationLog、completedMoments、GameRecord 或 Evaluation。

Primary key 為 raw physical identity＋pinned versions＋fixed physical slot。首次 source digest／actor／route binding 固定；同 key duplicate 讀原 artifact，矛盾 source 拒絕，不能改 digest 取得另一個結果。Pending 只能做來源 readiness，不 preload sample；source 缺失保存 insufficient／candidateOutput=null，完全不呼叫 candidate execute。Cleanup 只處理外部 collector retention，不清理 Match 或本輪原始 captures。

本輪只有 test-local detached Map separation proof：沒有 live storage hook、完整 candidate、Match owner、official settlement／scoring／Evaluation consumer。Read-only boundary PASS 限 source／隔離 proof；正式 runtime observer、cold recovery storage 與完整 Shadow comparison 均未實作。

## I. Focused Readiness Evidence

[Readiness test](../tests/receiver-execution-v2-sprint-10a-readiness-test.cjs) 完成 **51 named checks／51 PASS／0 FAIL**。[Focused evidence](receiver-execution-v2-sprint-10a-focused-evidence.json)

使用既有合法 fixture definitions 及原 seed 77001，Production physical identity／actor 由原 owner 生成；沒有 synthetic v2 identity、改舊 assertions／fixture／seed 或用假設需求生成 candidate。Fixed fixture sample 是明示 Legacy witness input，不是自然 sample distribution。

Checks 包括：空壘 outs0／1／2 的真實 SS／NPC1B／before-execution handoff、原 sample 在 executing 才產生、routine direct／offline／acquisition failed notAttempted／combined receiver failure／fast alreadySafe／explicit legal hold、capability aliases、缺位置／demand／time／effort BLOCKED、actor／physical mismatch、pin replacement、copy-only Save guard 缺口、Legacy current-topology 三階段 cold／三次 duplicate、historical v1 三階段 cold recovery 與原 settlement，以及外置 null diagnostic／去重／拒絕 official fields。另有 occupied-base SS public handler 相容參考，明確 excluded from empty-base slice。

Observation wrapper 原樣返回 callback；outs0／1／2 wrapped／unwrapped 的完整 player／Match（含 record／Evaluation）相同。Readiness classifier 與 detached artifact 前後 player／RNG 不變；Legacy recovery 禁用 Math.random，原 sample 保留。這些是有界 fixture checks，不是自然 career cohort、完整分布分母、Meaningful空壘驗收、v2 runtime 或新版 Save PASS。

最初新 harness 34/46、隨後42/46 的失敗保存在 [Initial test evidence](receiver-execution-v2-sprint-10a-initial-test-evidence.json)：攔截錯誤 execution 入口、把原 null bases 誤寫成 false，以及誤讀 hold 的 last-defensive action facts。只修正新 harness／新增 bounded checks，沒有修改 Production outcome／threshold／原 tests／sample。Final count 是 named checks，不能加上迴圈內 assertions 宣稱另一個 focused 總數。

可重跑（不寫既有 captures）：

```text
node tests/receiver-execution-v2-sprint-10a-readiness-test.cjs
node tests/receiver-execution-v2-sprint-10a-runner.cjs
```

Runner 的 capture 使用新的 Sprint 10A 路徑及 exclusive-create；已有 evidence 時拒絕覆寫。正式 model execution、其他 Sprint capture 與 full 227 不在此 runner 的施工範圍。

## J. Non-Interference / Sprint 10B Prerequisites

本輪沒有修改既有 Production／tests／Save schema／責任區／能力公式／scorer／GameRecord／Evaluation／Runner Settlement／Third-Out／Match dispatch。沒有新 runtime module 或 registration，既有 v2 modules 仍未被正式頁面載入。672 個既有可讀 tracked hashes 不變；原 protected metadata／Git status 保留。[Non-interference](receiver-execution-v2-sprint-10a-non-interference-evidence.json)、[Closeout](receiver-execution-v2-sprint-10a-closeout-evidence.json)

後續最小施工順序必須另行審查：

1. 核定真實 contact／actor handoff、before-execution chooser 與 stable physical slot；所有 routine／meaningful／hold／offline／notAttempted 入口共用 guard，不能依成功選版。
2. 提供 NPC1B start／cover demand／MDU 來源、incoming Secure demand／delay、possession／touch 來源及 production capability adapter；C 不改標 A，alias／calibration version 明列。
3. 核定同 origin 的 ball／runner CRT bridge、quantization／tie／unknown；正式退休仍須原 timing owner seam、Force／Third-Out 與 one apply。
4. 實作並驗證 raw Save format guard、lifecycle explicit pin retention、各 copy／cache／binding 與 historical omission，拒絕版本偽装；不能只把 S9 module import 進 registry。
5. 審核外置 read-only collector，驗證 sample count／order／cursor、physical truth、outs／bases／runs、record／Evaluation、cold／duplicate 完全不干擾，再獨立授權完整 Shadow。
6. Ordinary effort／clean counterfactual／late responsibility／error-specific advancement 另有 scorer source gate；在來源未完備前維持不足，不回填 settled records。

因本輪只新增未接通文件／隔離測試，**Full Repository＝NOT RUN**。沒有新增完整 Production regression verdict；既有 tracked Production delta＝0，本輪 bounded Legacy checks 沒有失敗。L03／八項既有 independent source Red／三項歷史 Debt 均未改判。

## K. Final Gate

| Gate | 本輪結果 |
|---|---|
| Architecture Source Trace | **PASS**，有界 Tier 2／current source／coverage 限制明示 |
| Physical Identity / Actor Handoff | **PARTIAL**，正式原始 facts 有來源；typed pin／slot／共用版本 adapter 未接通 |
| NPC1B Positioning Source | **BLOCKED**，真實 start／movement／positioning time 缺來源 |
| Incoming Delivery / Demand | **PARTIAL**，canonical throw A；新 Secure demand／delay C |
| CRT / Touch Timing Source | **BLOCKED**，v1 facts 可保留；共同 v2 origin／independent contact C |
| Actual Capability Adapter | **PARTIAL**，proposal DESIGNED；aliases 明示，mobility／catching／calibration 未完成 |
| Lifecycle Version Pin | **PARTIAL**，draft retention plan；正式 chooser／保存未接通 |
| Save Early-Return Guard | **PARTIAL**，raw／shared guard 位置已設計，正式 guard 未實作 |
| Shadow Read-Only Boundary | **PASS**，source／test-local separation；正式 storage／simulation 未接通 |
| Focused Readiness Tests | **51/51 PASS**；expected BLOCKED 不等於 integration PASS |
| Legacy Non-Interference | **PASS**，既有 bytes／metadata／bounded execution 不變 |
| Full Repository | **NOT RUN**；沿用 **224/227 PARTIAL／三项 Debt** |
| L03 | **PARTIAL** |
| Ready for Sprint 10B | **NO**，完整 Shadow 仍有正式 source／pin／Save／isolation blocker |
| Ready for Commit | **YES，僅本輪 readiness 文件／隔離測試成果**；未 Stage／Commit／Push |

完成後停止，等待人工驗收。不開始 Sprint 10B、Sprint 11 或 Defensive Foundation Closeout。
