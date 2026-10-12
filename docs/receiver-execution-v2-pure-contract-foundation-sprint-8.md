# Receiver Execution v2 — Pure Contract & Deterministic Stage Foundation / Sprint 8

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-12（Asia/Taipei）
實際施工基線：`0c462c49ff68587cc278cd12d29df746f78931a9`

**獨立 pure foundation 完成，91/91 focused checks 通過；Receiver v2 未啟用。** 本輪新增純模組、獨立測試、schema 與證據；既有 Production、tests、Save schema、Match route、守備成功率與 scorer owner 均未修改。L03 仍為 **PARTIAL**。6-3 Shadow Readiness 為 **CONDITIONAL**，本輪沒有開始 shadow 或正式 Foundation Closeout。

## A. Baseline / WIP

Sprint 7 的 11 個設計成果已依先前獨立授權提交並 Push；Commit `0c462c49` 的訊息為 `docs: establish receiver execution v2 architecture and migration design`，parent 為起始參照 `37c0735dbe22e101b572f76b1847d47d9adca590`。Sprint 8 開始及結案的 main／HEAD／origin/main 均為新 Commit，index 空。本輪沒有 Stage／Commit／Push／Reset／Clean／Stash。[Baseline evidence](receiver-execution-v2-sprint-8-baseline-evidence.json)

開始只有原有 protected smoke 修改與 11 個保留的 untracked 檔案。保護 smoke、install.ps1、Sprint 3 中間 JSON、Sprint 4 四個稽核交付與 Sprint 5 五個中間 evidence；沒有讀取、執行、修改、hash 或 Stage 這 12 個檔案的內容。Git status 與檔案 size／mtime metadata 前後相同；這不是 protected content hash 證明。

642 個可讀的既有 tracked 檔案 SHA-256 前後一致，排除 protected smoke，包含 Sprint 7 原始成果及三項歷史 Debt tests。Sprint 5 的 112/112、Sprint 6 的 52/52、代表 13/13 與 Full Repository **224/227 PARTIAL** 只沿用已提交基線；**本輪沒有重跑這些 suites 或原 227 manifest**。[Non-interference evidence](receiver-execution-v2-sprint-8-non-interference-evidence.json)

## B. Final Pure Contract

新增 [receiver-execution-v2-foundation.js](../receiver-execution-v2-foundation.js)，以 CommonJS 或獨立 UMD 載入。沒有加入 index.html、Match Family Dispatch、正式 cache 或 Save。`runtimeEnabled=false` 固定於 API、sealed binding 及 execution output。

入口為 `validate(input)`、`seal(input)`、`execute(sealed, prior)`；另有 `resolveDelivery`、`resolvePositioning`、`resolveSecure`、`resolveContest`。結果使用明確的 `ok`／`invalid`／`insufficient` envelope，失敗保存 code／details。`ok` 只表示契約評估完成，不表示所有 stage 完成或正式比賽 admission 通過。

[Final JSON Schema](receiver-execution-v2-sprint-8-final-contract-schema.json) 包含 closed input、各 stage output union、execution／invalid result definitions。Runtime validator 再檢查身分副本、版本、來源、時間與 action dependency；schema 本身不取代這些語義驗證。這是獨立 pure schema，沒有修改正式 Save schema。

| 契約 | 凍結內容與驗證 |
|---|---|
| Physical / Play | playId；typed physical binding 的 version、matchId、plateAppearanceId、contactId、原 physicalIdentity；缺欄位、unsupported version、null／legacy synthetic identity 拒絕 |
| Action leg | 固定 `primaryThrow`／`relayThrow` slot；原 receive action、source throw action、parent action；各動作 ID 不重複，不能用 retry／route outcome 重命名 slot |
| Actors / Target | thrower／receiver 的 ID＋合法守位；runner／base；handoff 同球副本一致；self throw 不冒充 incoming receive |
| Versions | contract／execution／adapter／timing／sampler／effort 明列固定版本；unknown version 拒絕 |
| Ability snapshot | receiver actor 與 adapter 綁定；八個 explicit integer capabilities 0–20；sealed clone 深凍結，不讀取 live Career／NPC 能力 |
| Delivery | 原 completed acquisition／transfer、throw ID、delivery status、accuracy／quality、launch／ball arrival；沒有新增 throw success roll |
| Position / Secure | available、start context／MDU、positioning start；明列 secure demand 與 delay，獨立 readiness／hands／possession |
| Contest | touch 或 runner tag 的 attempted／contact；同 target 的 live legality source、runner arrival；只輸出 unapplied candidate |
| Source provenance | A／B／C、scope、owner、reference、version；必要 execution source 為 C 時回 insufficient，不能用 legacy success boolean 填補 |

`pureFixture` 的 A 是明示 fixture fact，不是 Actual Production witness；`ownedInput` 仍需未來 adapter 與 authoritative handoff 查證。純函式可以拒絕缺失／矛盾資料，不能認證自行偽造但互相一致的 roster／source；digest 是 consistency aid，非 authentication。本輪 `seal` 沒有授權任何正式 Match admission。

來源以 bundle 分組：`delivery` 必須涵蓋 envelope 及 explicit secure demand／delay，`positioning` 涵蓋起始 context／MDU／start，`capabilities` 涵蓋 actual snapshot；`contest` 涵蓋 contact／delay／live legality。若只有 throw quality 為 A，但 secure demand 尚為 C，整個 delivery bundle 必須標 C 並回 insufficient，不能保留 A 而自行填需求值。未來若要提供較細粒度 partial stages，必須另版定義 provenance，不能改本版 source 語義。

Sealed input digest 同時綁定 actors、能力、route、原 owned sample、timing 與 provenance。Actor／能力更改可以得到相同 sampler vector，但不能沿用舊 sealed result。一般 JSON round-trip、物件 key 重排、repeat 都維持相同結果；傳入物件沒有內容修改，也不會被 execution 額外凍結。

## C. Deterministic Sampler B

詳細契約與 pure arithmetic 見 [Contract specification](receiver-execution-v2-sprint-8-contract-specification.json)。本輪固定：

- `samplerVersion=physical-slot-sha256-u32be-v1`，key 只有 executionVersion、完整 physical binding、physicalSlot、samplerVersion、stage。
- recursively sort object keys，使用 UTF-16 code-unit 排序；array 順序不改。JSON string 轉 UTF-8，保留 Unicode 原碼點，不作 normalization；unpaired surrogate 拒絕。
- Canonical 數值只允許 safe integer，拒絕負零／NaN／Infinity／undefined／getter／symbol／cycle／sparse array。原 owned sample 以 big-endian IEEE754 binary64 hex 綁定，不納入 B sample key。
- SHA-256 前四 bytes 為 unsigned big-endian u32；`unit=(u32+0.5)/2^32`。固定 positioning／secure／touch namespaces；執行需求採 `bin=(u32 >>> 28)-8` 的 16-bin quantization。
- key 不含 actor、ability、route、retry、outcome 或原 owned sample。沒有 Match RNG callback、Math.random、load-time random fallback 或第二次抽樣。

Portable SHA-256 通過 empty／abc golden vectors、UTF-8、55／56／64／129-byte padding 與 Node crypto 對照。一般 Node v24.19.0 和獨立 `--jitless` process 的 10 組完整 probe、hash／binary64／encoding 相同。另以 PowerShell／.NET 獨立 SHA-256、UTF-8、u32、double bit pattern 及 stage arithmetic 驗證 **30 rows**，全部相同。[Cross-runtime evidence](receiver-execution-v2-sprint-8-cross-runtime-evidence.json)

Focused suite 另在無 CommonJS／imports 的 browser-style VM 載入 UMD，禁用 Math.random 後輸出相同。這是 VM 載入邊界測試，沒有宣稱實際 browser engine、正式 Match 或 Save 已通過。Hash determinism、16-bin variation 及固定向量梯度不證明 statistical independence、自然頻率或平衡。

## D. Stage Dependency Matrix

| Stage | 必須有的事實／依賴 | 未成立時 |
|---|---|---|
| A Delivery | 原 upstream completed fact、真實 throw action、accuracy／quality、同 origin 的 arrival | notAttempted／offline／insufficient；不補造 flight 或新 delivery roll |
| B Positioning | 合法 receiver、availability、起始 context、movement／能力／時間來源 | unavailable／unreachable／late／insufficient；不改名 hands failure |
| C Secure | A completed 且可接、B ready，原 leg／actor／target 一致 | notAttempted，沒有 hands margin 或 possession；已 attempt 才可能 failedHands／bobbleControl／cleanControl |
| D Contest | C possession、真實 touch 或 tag contact、eligible live legality、known runner timing | notAttempted／ineligible／insufficient／tie／alreadySafe，沒有 candidate |
| Relay | 同 contact／play／origin、父動作與真實 relay actor；validated prior output、明示 completed first retirement／pivot、outs<3 | 第二段 blocked；first force 失敗或第一 force 為第三出局，不產生第二 candidate |

Delivery／Positioning／Secure／Contest output 都保留同球 leg ID、actor／target 與各 stage action ID。獨立 stage API 對 supplied serialized dependencies 作確定重算驗證，只使用原 frozen vector；不評估該 API 所需範圍之後的 stage。偽造 delivered／ready／possession、無關 actor／runner／action、修改 prior output 或換 origin 均拒絕。

Relay 的 completed retirement／pivot 是 caller 必須提供的來源事實；pure candidate **不能自行當成 actual retirement**。本輪 relay fixture 只是 dependency witness，沒有聲稱完成 6-4-3／4-6-3 Production migration、geometry 或同步補位模型。

Secure success 與 runner result 分離；clean receive 可以 alreadySafe。Receiver 尚未到位、不可達或 delivery offline 不 attempt hands。Completed receive 缺 touch／contact 不產生候選。Tag 必須同時有 possession、獨立 contact 與 live legality；本輪不重建完整 tag geometry。

## E. Timing Unit / Seam

`timingVersion=crt-integer-ticks-v2-1`：1 CRT＝1000 integer ticks，屬 coarse relative time，**不是秒或實測幾何**。Actor input time 非負，runner arrival 允許負值表示已先到；unknown 使用 reason，不能變成零。

共同 origin 保存於 context 與每個 timestamp。第一段 launch=0；relay 使用同一 origin 的 absolute launch，不能早於已完成的第一 contest。Positioning 可以在後段 launch 前開始，沒有每段重設 origin。Ball、positioning completion、secure completion、base touch／tag、runner arrival 皆保存原 origin 與 timing version。

Positioning duration 使用整數需求與 `ceil`；hands margin 使用整數 milli-score；secure／touch completion 是原 ball arrival 加明示 delay。`runnerArrival - contestCompletion > 0` 才有 candidate，exact tie 不給 candidate。Unknown ball／position／runner／live legality 都有明確 unresolved branch。v1 `{value,state}` ordinal window 不能當 v2 absolute time。

0／1／2 outs 各有 pure witness。兩出局時只輸出 `wouldBeThirdOut=true` candidate；沒有合法得分結算，仍需要現行 Force／Third-Out owner。

**正式 timing seam 尚未實作。** 當前 `deriveSettlement` 要求 timing 與 v1 `resolveTiming(args)` 完全相等，不能直接加入 v2 positioning／secure／touch delay。[Architecture evidence](receiver-execution-v2-sprint-8-architecture-evidence.json)

未來 seam 應由原 RunnerThrowSettlement owner 接受明確 model／timing discriminator，驗證 sealed delivery、同 origin stages、possession、target／live force 及 ordered third-out，再走原 single apply。Legacy v1 必須保留原重算入口，unknown version 不 fallback。本輪未修改 RunnerThrowSettlement，也沒有建立第二個 settlement／apply owner。

## F. Ability / Ordinary Effort Boundary

Actual receiver snapshot 的 reaction／mobility 控制 positioning time，range 控制 reach envelope，catching／fielding 控制 hands margin；arm／throwing／decision 不改善 B／C／D。固定 explicit route 不另抽 decision 成敗。Delivery 消費原輸入事實，不因 receiver arm 重判。

Pure 模型係數以 `receiver-pure-stages-v2-1` 凍結，清楚標記 **uncalibrated pure policy**。沒有沿用無版本 defaults 或發明 live Career skill。Production NPC defense aliases、speed→mobility、ground catching alias 及環境／需求來源仍需要獨立核定 adapter。固定向量能力對照包含 21 個 mobility 值 × 9 MDU，共 189 組，沒有反向 duration 梯度；這不是 Career pipeline 或自然平衡驗收。

Ordinary-effort reference 是另一份 position／competitionLevel／environment／version／source profile，不從 actual weak capability 生成，也不影響 execution。Missing 或 uncalibrated 回 `insufficientScorerFacts`，official scorer eligibility＝insufficient，official E／would-be A＝null。未提供 calibration authority 前，即使 caller 標 `calibrated` 也回 `unavailableCalibrationAuthority`，不能藉名稱放行。

Test-only average=10 profile 只驗證 uncalibrated branch，沒有正式 E／A。模組未呼叫 Sprint 5 scorer／GameRecord；clean counterfactual、culpable late-position attribution 與 error-specific extra advancement 未完成。本輪沒有將 absence of E 當成永遠免責，也沒有將 failure 自動判 E。

## G. Focused / Validation Evidence

[Focused test](../tests/receiver-execution-v2-pure-contract-test.cjs) 的 **91 個 named checks／91 PASS／0 FAIL**，含每個結果分支、0／1／2 outs、tie、unknown、relay 中斷、actor／runner／physical／version／source 拒絕、serialized dependency tamper、sample／能力篡改、repeat／JSON／key order、能力隔離、effort insufficiency、no RNG 及 UMD load。[Final focused evidence](receiver-execution-v2-sprint-8-focused-evidence.json)

91 是 named checks 數量，不是迴圈內 assertion 總數；189 組 mobility inputs、21 組 input／output schema witnesses 與 30 組 .NET comparisons 另列，不虛增 focused count。Schema witnesses 含 clean／offline／late／unavailable／hands／bobble／safe／no-touch／unknown、no-delivery、unreachable、challenging、maximum time、tie、relay／blocked relay。

[Isolated runner](../tests/receiver-execution-v2-sprint-8-runner.cjs) 對最終 schema 使用其實際 keywords 的獨立結構 evaluator；不是一般 JSON-Schema library，也不以它替代 runtime causal validator。Final evidence 記錄 module／focused／runner 三份 source hashes。

首次 88 checks 有 86 PASS／2 FAIL，原因為新 late fixture 的 MDU8 超出 range10 envelope，以及新 bobble fixture 的 margin1000 恰為 clean 邊界。已保留 [initial test evidence](receiver-execution-v2-sprint-8-initial-test-evidence.json)，修正新 fixture 為 reachable-but-late 與正 margin<1000；沒有修改模型 threshold、原 sample、既有 tests 或 Production。新增 schema runner 亦修正漏列 context definition、把帶 display name 的 case object 誤當 strict prior envelope 的 harness 問題。均為新工具／fixture 問題，不列歷史 Debt 或 Production regression。

可重跑（不寫入既有 captures）：

```text
node tests/receiver-execution-v2-pure-contract-test.cjs
node tests/receiver-execution-v2-sprint-8-runner.cjs
```

`--capture-final` 對全部指定 final paths 先檢查不存在，再以 exclusive-create 寫入；已有 captures 時拒絕，不得覆寫本輪或 Sprint 7 原始證據。

## H. Legacy Non-Interference

642 個既有 tracked hashes 全一致；current disk 與四段 graph snippet 完全相同。現有 tracked JS／CJS／HTML 中新 module basename／namespace references＝0；新模組沒有 Production import、RNG access、Match State apply 或 GameRecord call。CommonJS 只 export API；standalone UMD 的 namespace 沒有被正式頁面載入或註冊。

Legacy receiver／SS／2B／3B／1B execution、`.025`／`.99` 責任區、Runner Settlement／Third-Out、scorer／GameRecord／Evaluation owner、Save schema、Match dispatch 均未改。三項歷史 Debt test bytes 不變、分類不變。Protected WIP 與所有原 untracked evidence 保留；protected hash 沒有讀取宣稱。

Discovery 使用 codebase-memory Tier 2：index／symbol search、四個雙向 depth=1 CALLS traces、四份 full snippet，再用當前磁碟比對。12 個 dependency evidence paths coverage 無未取完分頁；皆 no_recorded_issue，但 freshness=metadata_changed，不是 freshness／完整性證明。Namespace／registry 缺 edge 不能當不可達；本輪 absence 結論由現有 source 的新 API reference search、原 bytes 一致及無註冊的 isolated module 補證。

只新增未載入的獨立模組及測試，因此依本輪範圍未重跑原 227 套件。**New Production Regression 沒有執行正式 integration measurement**；可證既有 tracked Production delta＝0，不能把 pure 91/91 轉寫成正式守備 regression PASS 或新版 Save Compatibility PASS。

## I. Remaining 6-3 Shadow Blockers

1. 審核 physical contact／fixed slot adapter，正式 handoff／roster／source copies 必須一致，不能只信 digest。
2. 取得真實 NPC1B start／movement、incoming demand／quality、touch 與同 origin CRT；舊 combined ready／success 不能供應缺少的獨立事實。
3. 校準 pure coefficients 與真實能力／環境 adapter，不可把 fixture policy 當已核准 Production success rate。
4. 設計 admission version pin、read-only shadow storage、meaningful／routine／cold reload／duplicate 的 non-interference，維持原 callback count／order、cursor、outs／bases／runs／record。
5. 欲進入 authoritative settlement 前，完成原 owner 的 version-aware timing seam；欲影響正式記錄前，另取得 ordinary effort、clean counterfactual 與 late/error-specific advancement 來源。

以上是後續獨立審核項目。本輪未授權或啟動 6-3 Production Shadow Integration。L03 的 Production source completeness／八項既有 source Red 均未改判。

## J. Final Gate

| Gate | 本輪結果 |
|---|---|
| Pure Contract | **PASS**：有界 closed input／output、typed identities、explicit invalid／insufficient；非正式 Match admission |
| Sampler Determinism | **PASS**：固定 B／encoding／binary64、Node／jitless／.NET／VM 對照；非統計獨立證明 |
| Stage Dependency | **PASS**：綁定、possession、tamper／relay／third-out stop；只產生 candidate |
| Timing Contract | **PASS**：integer CRT／共同 origin／tie／unknown／ordinal reject；正式 seam 未實作 |
| Ability Boundary | **PASS**：actual／reference 分離與 pure stage isolation；Production adapter／calibration 未驗收 |
| Ordinary Effort Source | **PARTIAL**：契約明定，calibration authority 未取得；scorer 保持 insufficient |
| Legacy Non-Interference | **PASS**：642 tracked hashes 不變、無 route references／註冊；protected metadata／status 保留 |
| Focused Tests | **91/91 PASS**；另 21 schema witnesses、30 .NET rows |
| New Production Regression | **未執行**：只新增未載入 pure module；existing tracked delta＝0，無新增 full-repository 結果 |
| 6-3 Shadow Readiness | **CONDITIONAL**：純契約可審查；I 的來源／版本／校準與隔離 Gate 尚待完成及另行授權 |
| Ready for Commit | **YES，僅本輪 isolated pure 成果**；本輪未 Stage／Commit／Push |

L03＝**PARTIAL**；Full Repository 沿用 **224/227 PARTIAL／三項既有 Debt**，沒有宣告新版 runtime／Save PASS 或 Foundation Closeout。最終 path／hash／whitespace／Git 完整性見 [Closeout evidence](receiver-execution-v2-sprint-8-closeout-evidence.json)。完成後停止，等待人工驗收。
