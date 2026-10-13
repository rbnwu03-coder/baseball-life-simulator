# Receiver Execution v2 — Pure Contract v2.2 Revision & Compatibility Foundation / Sprint 10A.3a

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
正式施工基線：`10c738ce380c2cfd8cce6cb796b3a1b577e437dd`

**獨立 v2.2 純契約完成：155/155 focused、原四套相容性 460/460 通過。** 新版接受原始 Unicode／264 字元 canonical ID 的資料形態，分開 planned 與 nullable actual delivery，實作共同 contact anchor、非零 launch、signed prelaunch 與獨立 sampler namespace。Production 完整來源仍不足，Source Acceptance＝**PARTIAL**；`runtimeEnabled=false`、L03＝**PARTIAL**。未接通 Match、正式 Save、Settlement 或 Shadow。

## A. Baseline / WIP

開始及結案 main／HEAD／origin/main 均同上述 Sprint 10A.2 commit，index 空。[Baseline](receiver-execution-v2-sprint-10a3a-baseline-evidence.json)

保留 smoke 未暫存修改及 11 個原 untracked：install.ps1、Sprint 3 中間 JSON、Sprint 4 四個稽核交付、Sprint 5 五個中間 evidence。12 個 protected 內容沒有讀取、hash、執行、修改或 Stage；只核對 Git status、size／mtime。這不是 protected content hash 證明。

729 個既有可讀 tracked 檔案 SHA-256 前後相同，排除 protected smoke，包含舊 contracts、fixtures、captures、三項 Baseline Debt。只新增本輪純模組、tests、報告及 evidence。本輪沒有 Stage／Commit／Push／Reset／Clean／Stash。[Non-interference](receiver-execution-v2-sprint-10a3a-non-interference-evidence.json)

## B. Existing → v2.2 → Migration Boundary

[Version / Migration Matrix](receiver-execution-v2-sprint-10a3a-version-migration-matrix.json) 保存 S8、S9 admission/binding、10A.1 source/adapter 的實際完整 version exports，沒有覆寫舊版本語義。

| 契約 | 舊版保留 | 新版／邊界 |
|---|---|---|
| Pure／execution | `receiver-pure-contract-v2-1`／`receiver-pure-stages-v2-1` | 新增 `receiver-pure-contract-v2-2`／`receiver-pure-stages-v2-2` |
| Physical | `physical-contact-binding-v1`、ASCII predicate | `physical-contact-binding-utf8-v2`，raw Unicode／4096 cap |
| Timing | `crt-integer-ticks-v2-1`，first launch=0 | `crt-physical-play-integer-ticks-v2-2`，contact-global、signed start |
| Sampler | `physical-slot-sha256-u32be-v1`，舊向量不變 | `physical-slot-sha256-u32be-utf8-v2`，明示新 namespace |
| Explicit能力／來源 | S8 input、S10A.1 alias/source policies 不變 | `receiver-explicit-input-v2-2`／`receiver-pure-source-boundary-v2-2`；不是 Production adapter |
| Pin | S9 `receiver-admission-timing-contract-v1` 保留 | 新 `isolated-receiver-revision-pin-v2-2` 僅 metadata；未接 lifecycle/Save |

`validateVersions` 只接受兩組完整、相容的 catalog tuple。Missing、unknown、mixed、incompatible timing/sampler/source 拒絕；傳入 pinned tuple 後，pending／executed／settled 都不得升降版。舊 tuple 回 `existingV2.1Api`，不透過新 resolver 改寫舊 input。Catalog 的 old tuple 是版本目錄，**不是替舊 API 增加新的輸入格式**。

`createPin`／`retainPin` 只驗證版本及 typed identity 的純 metadata。沒有能力／planned policy 的完整正式 admission、execution binding 或 runtime recovery。正式 snapshot owner、原 S9 pin 副本与 Save guard 仍待下一輪設計／批准。

## C. New Pure API / Closed Contract

新增 [receiver-execution-v2-2-foundation.js](../receiver-execution-v2-2-foundation.js)。CommonJS 只依賴 S8 已提交的 canonical JSON／SHA-256／binary64 primitives；沒有呼叫舊 `seal`／stage／`execute`，沒有修改舊 exports。UMD 可在明示載入 S8 codec 後獨立使用；未加入正式 index.html 或 registry。

[Final Contract Specification](receiver-execution-v2-sprint-10a3a-contract-specification.json) 保存 closed object required fields、完整 reference input、status unions、formula、source／ability boundaries。這是**可由 runtime validator 驗證的純契約規格**，不是正式 Save schema，也不宣稱已通過一般 JSON-Schema library。

入口：`validateIdentity`、`idAccepted`、`validateVersions`、`sampleVector`、`validateTimeline`、`validate`、`sourceBoundary`、`seal`、`execute`、`resolveStage`、`createPin`／`retainPin`。結果明列 `ok`／`invalid`／`insufficient`；`ok` 表示契約評估成功，不代表 actual out、Production admission 或 sources 已校準。

Typed identity 保存原 play、match、PA、contact、physical、原 leg／throw action、parent slot、thrower actor/position/role。Planned receiver 与 runner/base/kind 独立保存，actual delivery 保存原 canonicalSourceId、原 action、actual actor/target 及 release。handoff 使用**整份 typed identity＋planned＋actual** 副本比對；clock anchor 另綁相同 full physical。

必要 provenance 保存 A/B/C、scope、owner、reference、version；C 回 `insufficientExecutionSources`。`isolatedFixture` 的 A 是宣告測試事實，不是 Production 測量。`productionWitness` 可驗形態，但 `seal` 明確回 insufficient；不能因自行填互相一致的 A 或重新算 digest 就成為正式權威。Digest 只提供一致性，不是 authentication。

## D. Unicode / Long ID / Storage Boundary

1–4096 UTF-16 code units，保留原字串，不轉 ASCII、不截斷、不 hash-only、不做 Unicode normalization。中文、中英混合、non-BMP、combining marks、264 字元 canonical ID、合法上限／超限都有測試。Lone surrogate、控制字元、empty、getter／symbol／cycle／非 canonical JSON 拒絕。[Identity boundary review](receiver-execution-v2-sprint-10a3a-identity-storage-boundary.json)

採用 Sprint 10A.2 的 4096 提案作**新 pure resource cap**：當前 `save.js` generic JSON clone、ground／bunt handoff clone 沒有 per-ID truncation；4096 Unicode 透過 JSON 與實際 `normalizeHandoff` clone 原樣保留。舊 S8 的 ASCII512、S10A.1 的 ASCII240 不变。這是有界 source／serialization 查證，不是 localStorage quota 或新版 `normalizeSave` admission 驗收；正式 Save 的 version/copy guard 未實作，不能宣告新版 Save PASS。

[Production witnesses](receiver-execution-v2-sprint-10a3a-source-witness-evidence.json) 使用原 LEGACY owner／原合法 fixture bodies，保存原含「上」的 PA/contact/physical/play 字串、完整 264 字元 canonical throw ID、原 action ID、原 player/NPC/runner。没有改 seed、删字或換 synthetic ID。身份形態可接受，缺 clock／formation／secure demand／touch 等來源仍標 C、回 insufficient；沒有對 Production witness 執行 candidate。

## E. Nullable Hold / Planned vs Actual

| Actual 狀態 | 閉合契約／下游 |
|---|---|
| completed | 上游 completed、原 canonical source、真實 actor/target、ready/delayed release、onTarget/challenging；不重抽 throw |
| offline | 傳球實際存在，原 actor/target／flight 可保存；receive time 保持 unknown，不 attempt hands |
| acquisitionFailed | upstream failed、canonicalSourceId=null、actual receiver/target=null、release=held；沒有 launch/arrival/receive |
| notAttempted | nullable actual，held release；不從 planned 或舊 out/safe 補造 flight |
| hold | route=holdBall、upstream completed、actual receiver/target=null、release=held；可保留 canonical no-attempt ID 及原 pin／formation |
| unknown | explicit unknown upstream/release、nullable actual；下游不補 known time |

No-delivery 不能有已知 launch/arrival/receive 或 touch request。Completed receive 若沒有獨立 contact，只有 possession，没有 candidate。Touch request 是 frozen intent；若前段沒有 possession，下游不完成。Public full timeline 也拒絕 no delivery／no possession／no contact 卻有 completion 的偽造。

原 hold witness 的 actual receiver=null、target.runner/base=null、release=held 与 planned NPC1B/first target 分別保存。No-delivery／pending 的原 ownedSample 可為 null；不預抽。若原 sample 已產生，binary64 綁定原值。Sampler B 仍只由 physical/slot/version 派生，不增加第二個傳球 roll。

## F. Contact-global CRT / Exact Precision

[Timing Contract](receiver-execution-v2-sprint-10a3a-timing-contract.json) 實作 Decision C 的純契約：`physical-play-contact-anchor-v1` 保存同球 full physical、originId、原 absolute decimal。所有 action timestamps 共用此 anchor；第一傳 launch 可非零，relay 不重設原點。這不是目前 Production 已發出新 clock 的宣告。

Input 为 strict decimal text：最多18位整數、6位小數，不接受 exponent／ordinal／negative zero。BigInt 先算 source micro-CRT 減 exact anchor，再 half-away-from-zero 量化：1000 integer ticks＝1 coarse CRT，**不是秒或實測幾何**。Relative tick bound ±1e9；overflow 拒絕、不 clamp。

每個 timestamp 保存 integer ticks 與 exact micro offset 字串。單 timestamp 誤差≤0.5 tick；兩 timestamp race margin 誤差≤1 tick。2,001 組 signed micro offsets 驗證上限。Exact decimal 因果順序在 rounding **之前**驗證，subtick negative duration 不會藉 tick tie 放行。Runner arrival 可負、可先於 touch；unknown 使用 reason，不轉零。

例：contact=100、position start=100.25、launch=102，global offsets＝0.25／2 CRT，launch-local start＝−1.75 CRT。Local projection 只作 diagnostic，不是另一個 authoritative clock。Pre-contact start 另要求 sourced `preContactAuthorized`；actor duration 非負。

共同時間含 acquisition、launch、ball、position start/completion、receive attempt、secure、touch、runner。驗 acquisition≤launch≤ball≤receive≤secure≤touch，position start≤completion，接球者須在 ball arrival 前 ready。Input 的 receiveAttempt 是待檢查的 receive time，**不是完成接球的事實**；position/secure/touch completion 必須由純階段輸出，不能帶回 input 作成功權威。

Exact tick tie、subtick margin collapse 都不給 candidate。`legacy-v1-relative` 明確 insufficient，沒有偷偷指定 contact0 或把原 ball scalar 當 flight duration。正式 RunnerThrowSettlement／Force／Third-Out 均未改，version-aware timing seam 仍未接通。

## G. Sampler / Runtime Determinism

Key 固定 executionVersion、完整 typed physical（含 physical.version）、physicalSlot、samplerVersion、stage。Recursively sorted JSON 使用 UTF-16 code-unit key order，array 原順序，Unicode 原碼點转 UTF-8。SHA256 前4 bytes unsigned big-endian；`u=(u32+0.5)/2^32`。只取固定 positioning／secure／touch namespaces；16-bin top-nibble variation 不依 actor、ability、route、outcome、retry 或 ownedSample。

獨立 Node crypto 直接以 sorted JSON/UTF8 形成 bytes、SHA256/u32BE 對照；Node normal／jitless、UMD VM 禁用 Math.random 的输出一致。實際 [Headless Chrome final](receiver-execution-v2-sprint-10a3a-browser-final-evidence.json) 155.0.0.0 的10組完整 encoding、vectors、stage outputs 亦一致，含 Unicode、non-BMP、combining、264/4096、signed start、late、hold、negative runner。Final capture 保存最終 module source hashes。

新 execution/physical/sampler namespace 會改變向量，明列 **MODEL MIGRATION DIFFERENCE**；沒有偽稱數值與 S8 一樣。S8 原向量／input/output 與 baseline bytes 的 VM 對照相同，原 API 仍可重跑。Determinism 不證明 statistical independence、自然機會頻率或 success-rate calibration。

第一個 Chrome 嘗試因 sandbox GPU 子程序失敗，使用一般權限的隱藏 headless process 完成；未讀／修改正式 browser profile，使用新 temporary profile。[Earlier browser capture](receiver-execution-v2-sprint-10a3a-browser-evidence.json) 保留；之後新版 output clone 修正沒有改數值，final capture 用新檔保存，未覆寫初版。

## H. Stage Causality / Ability Boundary

| Stage | 實際 pure owner | 失敗／不足處置 |
|---|---|---|
| A Delivery | 原 canonical / upstream completed fact；原 action | no attempt／offline／unknown／relay blocked；無新 throw roll |
| B Positioning | frozen cover context/MDU、reaction/range/mobility、exact signed start | unavailable／unreachable／late；不改名 hands failure |
| C Secure | A receivable、B ready、known receive time，actual catching/fielding | 未成立不 attempt；attempt 后可 failedHands/bobble/clean，獨立 possession |
| D Touch/Contest | possession、contact、same-target live legality、runner time | no touch／ineligible／unknown／tie／alreadySafe，没有 candidate |
| Relay | validated prior、同球同 anchor、真實 pivot actor、來源 actual first retirement | first force failed、pivot failed、first force third-out 都 block 第二段 |

各 stage 保存原 typed identity、leg/action 與 planned/actual target；`resolveStage` 對 serialized dependencies 用原 frozen vector 做确定重算驗證，tamper 拒絕。Cold JSON seal 不改 caller bytes，也不额外凍結 caller 物件。Pure candidate 不能自己充當 actual first retirement；relay rows 只是因果／共同座標 witness，不是 DP migration 驗收。

沿用有版本的未校準 pure arithmetic：reaction／mobility 影響 B duration，range 影響 reach，catching/fielding 影響 C margin。105 組固定 vector 能力梯度無反向；receiver arm/throwing/decision 不改善 B/C/D。沒有新 live Career skill 或 approved NPC adapter，沒有修改守備成功率。

Ordinary effort 是獨立 position/level/environment/reference/version/source profile。Missing／uncalibrated 保持 scorer insufficient；caller 標 calibrated 仍回 unavailableCalibrationAuthority。Test-only average10 不授 E/A、不影響 execution。Late blame、cause-only clean counterfactual、error-specific advancement 仍待來源。

## I. Focused / Compatibility / Evidence

[Focused test](../tests/receiver-execution-v2-2-contract-test.cjs)：**155 個 named checks／155 PASS／0 FAIL**；[Final focused evidence](receiver-execution-v2-sprint-10a3a-focused-evidence.json)。105 gradient rows、2,001 signed rounding inputs、10 browser cases 另列，沒有灌入 named count。

[Compatibility](receiver-execution-v2-sprint-10a3a-compatibility-evidence.json)：原 S8 **91/91**、S9 **151/151**、10A.1 **122/122**、10A.2 **96/96**，合計 **460/460**。直接執行原 suite `run()`；不改原 fixture/assertion/seed，不用舊 runner 的 capture flags，不覆寫原證據。

[Initial diagnosis](receiver-execution-v2-sprint-10a3a-initial-test-evidence.json) 保留首輪144/146：兩項為新 relay/witness harness 資料錯誤，修正新 anchor測試值及合法 runner 副本。後續 primary-agent code review 發現新 stage output 共用 actor/target 物件會凍結 cold caller；已改為 clone，新增 cold-seal mutability check。這是本輪新模組修正，不是舊 Production defect，也不挪入歷史 Debt。

[Isolated runner](../tests/receiver-execution-v2-sprint-10a3a-runner.cjs) 查基線、全部既有 hashes、protected metadata/status、新 consumer search、graph snippet/current-source 對照，再執行新與舊 suites。9份 snippet pages（含 Save 兩個完整分頁）與當前磁碟相同。[Architecture evidence](receiver-execution-v2-sprint-10a3a-architecture-evidence.json)

Discovery 採 codebase-memory Tier2：search→both depth1 CALLS→full snippet→current source／coverage。Namespace／guarded API 的 edge 缺漏用當前 source 補證，沒有從 absent edge 宣稱不可達。Metadata_changed/no_recorded_issue 不是 freshness/completeness 證明；[Final coverage](receiver-execution-v2-sprint-10a3a-coverage-evidence.json) 保存實際分頁。Protected 內容沒有從 graph snippet 讀取。

Final coverage 對729個既有可讀tracked及當時18個新交付共747 paths，8批全部回傳、沒有未取完分頁；746 no_recorded_issue、1 partial。後者是既有 `ability-performance-correlation-audit-sprint-1.1.md` 的48–56行表格，已直接讀取補證；本輪只以其原 bytes 不變作 integrity 證據，不擴張該歷史稽核結論。Coverage capture 及自我引用 closeout 不在此 capture 前的18個新 paths 中，manifest另明列。

## J. Legacy Non-Interference / Remaining Prerequisites

729 原 tracked hashes 相同，正式 root JS/CJS/HTML 對新 basename/namespace consumer＝0。舊 SS/2B/3B/1B、責任區、Save/lifecycle、Runner Settlement/Force/Third-Out、Scorer/GameRecord/Evaluation owner 全不变。只新 isolated module，没有正式 RNG callback／Out／E/A／runner bases／record write。[Final closeout](receiver-execution-v2-sprint-10a3a-closeout-evidence.json)

Full227 **NOT RUN**：本輪没有跨模組 Production 改動；沿用 **224/227 PARTIAL／三項既有 Debt**，不新增全量 verdict。新旧 focused PASS 不能宣稱正式 v2 Integration／Save PASS。

Sprint 10A.3b 仍需獨立批准：

1. 原 physical-play owner 實際發出 pre-execution formation、actor/slot/source snapshot 与共同 contact clock；C 不用 Legacy combined success 補值。
2. 審核/校準 Production capability、formation/flight/secure/touch policies；新 explicit pure version 不能當 approved production adapter。
3. Formal version pin、cache binding、lifecycle replacement／retry／cold recovery、可信 raw/shared Save guard；metadata pin 不能取代。
4. 唯讀 source collector/storage 與 callback/cursor/Match/record/Evaluation 隔離；本輪未執行正式 Shadow。
5. 未來若影響 retirement，另接原 timing owner seam/Force/Third-Out；若影響 scorer，再取得 independent ordinary effort 与責任因果來源。

## K. Final Gate

| Gate | 本輪結果 |
|---|---|
| Unicode / Long Identity | **PASS**，原字串／264／4096／UTF8／typed copies；非 Save admission |
| Nullable Hold | **PASS**，planned/actual 分離、null actual、no phantom chain |
| Contact-global CRT | **PASS**，exact origin subtraction/causality/overflow/tie；Production clock 未發出 |
| Signed Prelaunch | **PASS**，非零 launch、負 local projection、sourced precontact、非負 duration |
| Sampler Determinism | **PASS**，Node/jitless/VM/Chrome/independent crypto；新向量明示 migration difference |
| Stage Causality | **PASS**，ready/secure/possession/contact/relay/third-out/dependency tamper，only unapplied candidate |
| v2.1 Compatibility | **PASS**，原 input/output/vector 與四套460/460，bytes 不變 |
| Production Source Acceptance | **PARTIAL**，原 identity/nullable 形態接受；缺 formation/clock/demand/touch 等仍 insufficient |
| Legacy Non-Interference | **PASS**，729 原 hashes、consumer0、protected metadata/status；非 protected content hash |
| Focused Tests | **155/155**；105 gradient rows、2,001 rounding inputs、10 browser cases 另列 |
| Full Repository | **NOT RUN**；沿用224/227 PARTIAL、三項 Debt |
| Ordinary Effort | **PARTIAL**，calibration authority unavailable，官方 E/A=null |
| L03 | **PARTIAL** |
| Ready for Sprint 10A.3b | **CONDITIONAL**，上述正式來源/版本/校準/保存/隔離與獨立批准待完成 |
| Ready for Commit | **YES，僅本輪 isolated pure 成果**；未 Stage/Commit/Push |

可重跑（不寫 captures）：

```text
node tests/receiver-execution-v2-2-contract-test.cjs
node tests/receiver-execution-v2-sprint-10a3a-runner.cjs
node tests/receiver-execution-v2-sprint-10a3a-browser-probe.cjs
```

Capture flags 使用 exclusive-create，已有證據時拒絕覆寫。完成後停止，等待人工驗收；未開始 Sprint10A.3b、10B、11 或 Defensive Foundation Closeout。
