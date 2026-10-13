# Receiver Execution v2 — Version Admission & Timing Seam Foundation / Sprint 9

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-12–2026-10-13（Asia/Taipei）
實際施工基線：`00d0d61654a4fbe97413617dadfd70285a816c47`

**獨立安全契約完成，151/151 focused checks、20/20 Legacy 前後比較通過；正式 Version Admission／Timing Seam 仍為 PARTIAL。** Receiver v2 未啟用，`runtimeEnabled=false`。本輪沒有把新模組載入 Match、Family Registry、Save 或 Settlement。L03 保持 **PARTIAL**，沒有開始 Sprint 10 Shadow Comparison 或 Defensive Foundation Closeout。

## A. Sprint 8 Commit / Sprint 9 Baseline

依附件 Part A 獨立授權，Sprint 8 的 13 個已核對檔案以 `feat: establish receiver execution v2 pure contract` 提交為本輪基線，parent 為 `0c462c49ff68587cc278cd12d29df746f78931a9`。一般 `git push origin main` 成功；開始 Sprint 9 時 main／HEAD／origin/main 同步、index 空。[Baseline evidence](receiver-execution-v2-sprint-9-baseline-evidence.json)

保留原有 smoke 未暫存修改與 11 個 untracked 檔案：install.ps1、Sprint 3 中間 JSON、Sprint 4 四個稽核交付與 Sprint 5 五個中間 evidence。沒有讀取、hash、執行、修改或 Stage 這 12 個受保護內容。只比較 Git status 與 size／mtime metadata，不能視為 protected content hash 證明。

本輪 655 個可讀既有 tracked 檔案前後 SHA-256 相同，排除 protected smoke，包含三項 Baseline Debt 與 Sprint 7／8 原始成果。本輪只新增下列 isolated module、tests、報告與 JSON；Sprint 9 沒有 Stage／Commit／Push／Reset／Clean／Stash。

## B. Actual Owners / Proposed Seam

Discovery 採 codebase-memory Tier 2：symbol search、雙向 depth=1 CALLS、full snippet、coverage，再與當前磁碟 source 比較。12 個 owner traces、13 個 snippets 含 `normalizeSave` 的兩個完整分頁；另有兩個 Pure API traces／snippets。15 份 snippet 均與當前 source 相同。10 個核心 dependency paths 全數回傳，no_recorded_issue，但 freshness=metadata_changed；此訊號不保證新鮮度或完整性。Legacy comparison 所載入的 95 個來源也使用 coverage 與磁碟／實際執行補證。[Architecture](receiver-execution-v2-sprint-9-architecture-evidence.json)、[Pure supplement](receiver-execution-v2-sprint-9-pure-architecture-evidence.json)、[Source verification](receiver-execution-v2-sprint-9-non-interference-evidence.json)

Namespace／registry 的 CALLS edge 有缺漏；例如 lifecycle 的 namespace 呼叫與 family.resolve 由 source 補證，沒有用缺少 edge 宣稱不可達。

| Current Ownership | Proposed Seam | Validation Responsibility／本輪狀態 |
|---|---|---|
| Ground handoff／physical responsibility／infield family | 未來共同 admission chooser；handoff 保存版本、context 保存一致副本 | 在首次 execution 前檢查 physical／actor／eligible route／policy；本輪只有 isolated `createPin` |
| MatchSituationLifecycle | pending→executing→resolved→settled 保存原 pin | `beginExecution` 現在重建 executionState；本輪 `retainPin` 只驗證 metadata 保留，未修改 lifecycle |
| SS／2B／3B／1B family cache | future pinned-version cache validator | actors／route／sample／capabilities／stage output 與 evidence copies；本輪只 bind 已提供的 S8 pure input |
| RunnerThrowSettlement／Force／Third-Out | 原 owner 内的 version-aware timing discriminator | 同 origin、possession、live force/tag、ordered third-out、一次 apply；本輪只驗證 unapplied candidate |
| Save.normalizeSave→validateHighSchoolDecisionThrowState | 在各 legacy early return 前驗證新格式／版本副本 | 歷史 omission 與新格式缺欄位分開；正式 guard 尚未接通 |
| MatchGameRecord／MatchExperienceDevelopment | 保持既有記錄與 Evaluation owner | diagnostic 不可產生 E／A／H／FC、retirement、record 或 evaluation；來源 bytes 與有界執行均不變 |

SS builder 仍是 canonical 第一傳加 receiver fielding proxy；沒有新位置、movement／hands authority。`deriveSettlement` 仍要求 timing 與 `resolveTiming(args)` 完全相同。Save 的 firstBase／3B／settlementApplied early returns 仍存在，不能宣稱 candidate 新版本已得到正式 Save 保護。

## C. Version Admission Contract

新增 [isolated safety module](../receiver-execution-v2-admission-timing-foundation.js)，只依賴已提交的 S8 pure module；未加入 index.html 或 registry。[完整 contract／owner／Save matrix](receiver-execution-v2-sprint-9-contract-specification.json)

`createPin(request, policy)` 的 closed request 保存 mode、typed identity、topology、initial outs、原 bases、routeId、routeEligibility、immutable capabilities 與 provenance。Physical binding 包含 playId、matchId、plateAppearanceId、contactId、physicalIdentity；原 action leg、thrower／receiver、runner／base 必須完整。三種現行 ground topology 與 execution／adapter／timing／sampler／effort version 分開保存。

policy 固定 `inactive-ss-direct-policy-v1`，`runtimeEnabled` 必須為 false。`candidatePreparationEnabled` 只允許獨立 preparation；所有 pin 的 officialExecutionOwner 都是 `existingLegacyOwner`。Candidate allowlist 僅新 SS primary、空壘、0／1／2 outs、NPC1B、`secureFirstBaseOut` direct 或明示 `holdBall`。Eligibility 必須明列 `throwerRole=primaryPlayer`／`receiverRole=npc`，source bundle 涵蓋角色；專案 canonical player receiver ID 也拒絕。這是 caller 來源合約，正式 adapter 尚須交叉驗證 roster。Hold 不可綁 completed throw；direct 的 offline／notAttempted branch 仍由同一 pinned version 處理。沒有 accuracy、成功、outcome、retry 或玩家吸引力輸入可用於版本選擇；非法／其他 route 拒絕。這是 future chooser 的驗證輸入，沒有實際替現行 Match 選版。

pin 把 policy、identity、能力、eligibility、topology、provenance 與版本深複製／凍結。所有新 pin 必須有 `phaseAtAdmission=beforeExecution`；executed／settled／missing／unknown phase 拒絕。正式 owner 仍須驗證此 phase 來源。Digest 只檢查一致性，不能認證自行偽造但相互一致的來源。A／B 可供有界純契約使用；必要來源 C 回 `insufficientAdmissionSources`。`pureFixture` 是宣告的測試事實，不能當成真正 Production admission authority。

**Pending 不保存或提早抽取原 owned sample。** Sampler B 仍只由 S8 固定 physical slot／stage namespace 決定。原 owner 首次提供 sample 後，`bindExecution` 綁定原 binary64、sealed input digest、vector digest 與 pin。`validateExecutionBinding` 對照保存 binding；改 sample 後重新 seal 也不能沿用舊 binding。Actor／route／能力／source 副本不一致、unknown version、刪除版本或改 pin 都拒絕。

`retainPin` 對 pending／executed／settled 的**pin metadata** 使用原 request；policy flag 更新不重選版本，不升降版、不改 settled facts。這些 retention checks 不是三個 v2 runtime lifecycle 的實作或 Save PASS。

## D. Timing Candidate / Formal Seam Blocker

`validateTimingCandidate` 只收 `unappliedPureTimingPacket`：固定 safetyVersion、S8 sealed input、已產生的 execution 及 relay prior。使用原 frozen vector 確定驗證 serialized dependencies；不是為 Match 機會抽 sample、改 outcome 或建立第二個 settlement。

| 時間／依賴 | 合約與拒絕邊界 |
|---|---|
| Unit／origin | `crt-integer-ticks-v2-1`；1000 integer ticks=1 coarse CRT，非秒；同球一個 upstream launch origin |
| Launch／arrival | 第一段 launch=0；ball arrival 不能早於 launch；未知使用 explicit reason，不轉零 |
| Position／Secure | readiness 與 hands 分離；沒有 completed delivery／ready 不 attempt hands，沒有 possession 不 touch/tag |
| Touch／tag／runner | 獨立 contact、同 target live legality、原 runner arrival；runner time 可負；exact tie 不給 candidate |
| Relay | 同 play／physical／origin、真實 parent action／actor、validated prior、明示 completed retirement／pivot；後段不重設原點 |
| First force／third out | 第一 force 失敗或第一 force 為第三出局，第二段 blocked；不產生第二 candidate |
| Unknown／invalid | unknown timing／live legality 是 validated unresolved branch，`settlementAdmission=false`；wrong version／origin／ordinal window／tampered dependency 拒絕 |

Output 是 `validatedUnappliedTimingDiagnostic`，沒有正式 settlement identity、outRecorded、outsAfter、baseChanges 或 runChanges；固定 actualRetirements=0、settlementAdmission=false、scoringAdmission=false。S8 effort insufficiency 沒有改變，不提供正式 E／would-be A。

**正式 timing seam = NOT CONNECTED。** 若要讓 v2 參與 retirement，必須在現有 RunnerThrowSettlement owner 新增明確 discriminator，保留 v1 完整重算入口，驗證同 origin 的 delivery／position／secure／contact、target／live force 及 ordered third-out，再交既有 Force／Third-Out 與 single apply。當前 strict v1 validator 不能直接接受新增 delay；本輪沒有改它，也未設第二個 apply owner。

## E. Save / Recovery Matrix

| Model／phase | 實際驗證 | 正式 Save 狀態 |
|---|---|---|
| Legacy pending | 既有 normalizeSave／cold reload、historical topology／原 route authority | PASS，限本輪有界 fixtures |
| Legacy executed | 原 cache 重建、original sample、evidence copies、cold reload、禁用 recovery Math.random | PASS，限本輪有界 fixtures |
| Legacy settled | 原 GameRecord／Evaluation／cursor、cold reload、三次 duplicate 無重記 | PASS，限本輪有界 fixtures |
| candidate v2 pending | closed isolated envelope、required format／pin／copy／expectedPin；JSON round-trip 與 tamper 拒絕 | 純序列化已驗證；**未接 normalizeSave** |
| candidate v2 executed | 明確回 `candidateRuntimeSaveNotImplemented` | **NOT IMPLEMENTED／NOT TESTED**；不能宣告 PASS |
| candidate v2 settled | 同上；沒有新正式記錄／回填 | **NOT IMPLEMENTED／NOT TESTED**；不能宣告 PASS |

`validateSnapshot` 必须有 formatVersion、phase、admission、admissionCopy、executionBinding。Pending 不接受 execution binding；現存版本副本矛盾、expected pin 不同、actor／route／sample binding 篡改拒絕。Executed／settled 的 isolated sample-binding 或 metadata checks 不會提升為 runtime recovery PASS。

`recognizeHistorical` 只處理歷史 routing metadata；需要獨立的 existing Save owner 歷史 evidence、sourceSaveVersion 與 provenance。不能從缺版本欄位反推歷史。Present new format／kind／safety／execution／timing／sampler／adapter／effort／runtime tags 一律不得走 historical fallback。此 API 不認證 Save 內容，也不替代 normalizeSave。若新格式的所有標記遭刪除，未來正式格式 owner 必須提供外部可信 discriminator，不能只相信 caller 的 history label。

**仍無法在當前 lifecycle 合法保存並恢復完整 candidate v2 版本。** 未來 guard 必须在 firstBase、3B、settlementApplied 的 early returns 之前執行，且 beginExecution 必須刻意保存 pin。這兩個正式接入條件本輪沒有施工；保留為 blocking scope。

## F. Read-Only Preparation Boundary

`prepareDiagnostic(pin,input)` 只驗證、seal 已提供的獨立純輸入並建立 execution binding；**不呼叫完整 `Pure.execute`**，測試以 trap 驗證。沒有 Match object、live cache、runner settlement、record／evaluation 或 random callback 可供它寫入或取用。

Missing physical identity／必要 provenance、尚無原 owner sample、position／movement／incoming demand／touch CRT 不足，回 invalid／insufficient；沒有用 legacy success boolean、combined readiness 或 ordinal window 補造來源。Preparation 的 sealed inputs 與 binding 明列 simulationPerformed=false、officialExecutionConsumed=false、formalSaveAdmission=false。`admitOfficial` 永遠回 unavailable。正式各 owner 沒有 import 或 consumer，不會把 diagnostic 當 actual execution／Settlement。

本輪 timing consistency tests 只使用 S8 pure fixture 的已產生 output；Legacy comparison 只跑既有 authority。沒有正式 Shadow Simulation、cohort 或 Sprint 10 comparison。

## G. Red / Green / Legacy Comparison

[Baseline source Red](receiver-execution-v2-sprint-9-red-source-evidence.json) 保存實際 `git cat-file` probe：Sprint 8 基線不存在本輪 safety module。缺 pin／copy／binding／timing／preparation APIs 是 missing contract，並非五個 Production scorer rule bugs。正式 lifecycle／Save／timing 未接通的缺口維持 NOT IMPLEMENTED，沒有改 expected 宣告完成。

最終獨立審查發現新契約曾允許 hold＋completed throw，以及缺少 NPC role 判別時接受 player1B 候選；兩個實際反例、當時 source hash 與較早 137/137 結果保存在 [Initial Red](receiver-execution-v2-sprint-9-initial-test-evidence.json)。已修正新模組的 eligibility／binding，新增正反例；不是歷史 Debt，沒有修改舊 Production、fixture、sample 或原測試。

[Focused test](../tests/receiver-execution-v2-version-admission-timing-test.cjs) 完成 **151 個 named checks／151 PASS／0 FAIL**：version／discriminator／copy、route eligibility／角色／admission phase、cap／actor／runner／sample binding、policy 更新後 retention、historical routing、共同 CRT／tie／unknown／possession／relay／third-out、serialized dependency tamper、getter／RNG／immutable／JSON round-trip，以及未實作 Save 的 explicit insufficiency。[Focused evidence](receiver-execution-v2-sprint-9-focused-evidence.json)

[Legacy comparison](../tests/receiver-execution-v2-sprint-9-legacy-comparison.cjs) 使用相同既有合法 fixture bodies；baseline root sources 由 `git show` 以 30 MB buffer 在記憶體載入，current 用磁碟。**20/20 pairs 全相等**：四守位各一個真正 public handler，另各三個 clean／low-hands／low-throwing 三階段 recovery 及一個 historical topology case，共 4 public＋16 recovery。沒有更换 fixture／seed、賽中 physical inputs 或 expected scorer。

每組比較完整 Match、physical identity／opportunity、roster、route、cached original sample／raw stages／retirements、RNG values/count/order、outs／bases／runs、cursor、GameRecord／PA E-A-H-FC、experience 與 player Evaluation。四個 public cases 各一個 sample callback；executed recovery cases 使用原 resolver sample callback。每組有三次 duplicate，recovery 禁用 Math.random，cold reload 比對原 normalizeSave 結果；沒有 reroll 或重記。[Comparison evidence](receiver-execution-v2-sprint-9-legacy-comparison-evidence.json)

這是預宣告的有界 Production fixtures，非自然 career cohort、全場分布分母或 v2 runtime Save 驗收。observer 只記錄 original callback，沒有修改實際返回值；baseline/current 都用同一 observer。

本輪已重跑原 Sprint 8 **91/91**、Sprint 5 **79+33=112/112**、Sprint 6 **52/52**，均使用原 source、沒有 capture flag 或覆寫原 JSON。[Regression evidence](receiver-execution-v2-sprint-9-legacy-regression-evidence.json)

## H. Legacy Non-Interference / Full Repository

655 個既有 tracked hashes 全相同；現有 tracked JS／CJS／HTML 對新 basename／namespace 的 references=0。新 module 只依賴 S8 pure module，沒有 RNG、Match apply、scorer／GameRecord call 或 Family registration。Legacy receiver functions、SS／2B／3B／1B execution、守備責任區、Runner Settlement／Third-Out、Save schema 與記錄／Evaluation owner 均不變。三項 Baseline Debt test bytes 不變。

本輪符合 Part B7 的「只新增獨立未接通 module」分支，**没有重跑原 227 manifest**。Full Repository＝NOT RUN；沿用上一正式基線 224/227 PARTIAL／三項既有 Debt，不改寫成全綠。本輪新增 Production regression＝0，限上述 20 pairs 與重跑 focused 所測範圍；既有 tracked Production delta＝0。沒有新增完整 repository verdict，也不宣稱重新重現三項 Debt failures。

全部新檔 whitespace／JSON／hash、Git status、protected metadata 與原 source snippet 對照見 [Non-interference](receiver-execution-v2-sprint-9-non-interference-evidence.json)、[Closeout](receiver-execution-v2-sprint-9-closeout-evidence.json)。沒有覆寫 Sprint 3–8 的原始證據。

最終 [coverage](receiver-execution-v2-sprint-9-coverage-evidence.json) 對 112 個實際依賴／交付 paths 分兩頁回傳（100＋12），沒有漏頁；新檔的 not_tracked 與舊檔 metadata_changed 仍以 current source／hash／執行補證，不作完整性保證。

## I. Remaining Sprint 10 Blockers

1. 核定共同 admission owner、可信新格式 discriminator、pin／cache 副本保存；在 beginExecution replacement、retry、cold recovery 及 early returns 全入口明確驗證。
2. 取得真實 NPC1B start／movement、incoming demand、touch／CRT 與 physical slot／actor handoff adapter；C 不能改標 A 或以原 combined success 補值。
3. 核定版本化 actual capability／環境 adapter 與 calibration；ordinary effort reference、clean counterfactual、late blame、error-specific advancement 尚未提供，L03 仍 PARTIAL。
4. 設計不寫正式 execution cache／Match／record 的 read-only shadow storage、版本隔離及正確 pending／executed／settled Save matrix；本輪 executed／settled v2 不具正式保存能力。
5. 在另行核准後才開始 Sprint 10；若要 authoritative retirement，另完成原 timing owner seam／Force／Third-Out 與一次 apply。没有因本輪 pure PASS 自動放行 integration。

## J. Final Gate

| Gate | 本輪結果 |
|---|---|
| Version Admission | **PARTIAL**：isolated pin／retention／binding 通過；正式 chooser／lifecycle pin 未接通 |
| Timing Seam | **PARTIAL**：pure candidate validation 通過；正式 owner discriminator 未接通 |
| Legacy Save Compatibility | **PASS**：有界三階段／historical／cold／duplicate，原 authority 保留 |
| Candidate v2 Save Contract | **PARTIAL**：pending 純序列化；executed／settled NOT IMPLEMENTED，非 normalizeSave PASS |
| Shadow Isolation | **PASS**：只 preparation，無完整 shadow simulation／official consumer |
| RNG／Sample Non-Interference | **PASS**：固定 binding、無新 callback／pre-extraction／reroll；Legacy 前後一致 |
| Match State Non-Interference | **PASS**：20 pairs 的 physical／outs／bases／runs／cursor 一致 |
| Record／Evaluation Non-Interference | **PASS**：原 GameRecord／PA／Evaluation／experience 一致、duplicate 無重記 |
| Sprint 8 Pure Regression | **PASS，91/91** |
| Sprint 5／6 Regression | **PASS，112/112＋52/52** |
| Sprint 9 Focused | **PASS，151/151**；Legacy comparison **20/20** 另列 |
| Full Repository | **NOT RUN**；沿用 224/227 PARTIAL／三項既有 Debt |
| New Production Regression | **0，限本輪有界比較／focused 範圍**；既有 tracked Production delta＝0 |
| Sprint 10 Shadow Readiness | **CONDITIONAL**：I 的來源／版本／保存／隔離 gate 尚待完成與獨立授權 |
| Ready for Commit | **YES，僅本輪 isolated safety 成果**；Sprint 9 未 Stage／Commit／Push |

L03＝**PARTIAL**。没有宣告 Receiver v2 runtime／新版 Save Compatibility PASS、Scorer Integration 完成或 Defense Foundation Closeout。完成後停止，等待人工驗收。

可重跑（不寫 captures）：

```text
node tests/receiver-execution-v2-version-admission-timing-test.cjs
node tests/receiver-execution-v2-sprint-9-legacy-comparison.cjs
node tests/receiver-execution-v2-sprint-9-runner.cjs
```

[Isolated runner](../tests/receiver-execution-v2-sprint-9-runner.cjs) 的 `--capture-final` 會先確認整組 captures 不存在，再以 exclusive-create 寫入；結案後不得覆寫 captures。Sprint 8 runner 的原 baseline guard 不適用新 HEAD，本輪直接執行其 pure suite，沒有修改舊 runner。
