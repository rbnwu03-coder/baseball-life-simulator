# Receiver Execution v2 — Receiver Source Authority Foundation / Sprint 10A.1

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
實際施工基線：`0bb782c0ad126cbf95cbea081920ea914739c231`

**隔離 source authority foundation 完成，122/122 named focused checks 通過；Production v2 Integration＝NOT STARTED。** 本輪建立版本化 initial positioning、incoming demand、NPC alias adapter 與共同 CRT／touch 契約，只接受明示的 isolated fixture scope。新 policy 是未校準模型，不是新取得的 Production 測量。Receiver v2 未啟用，`runtimeEnabled=false`，L03＝**PARTIAL**。沒有正式 Shadow Simulation、Save／Settlement 接入或 Sprint 10A.2 施工。

## A. Part A Commit / Part B Baseline

依附件 Part A 授權，使用原 [Sprint 10A closeout manifest](receiver-execution-v2-sprint-10a-closeout-evidence.json) 的 21 個明確路徑逐一 Stage。全部為新增交付，index bytes 與結案檔案相同；`git diff --cached --check` exit 0，沒有其他 Production 或 protected WIP。Commit 訊息為 `docs: establish receiver v2 6-3 shadow source readiness`，parent 為 `32ee5ec55e4791952a9ef5d68c126389ab1e1ff6`。一般 `git push origin main` 成功；新 Commit／main／origin/main 同步，index 空，才開始 Part B。[本輪 baseline](receiver-execution-v2-sprint-10a1-baseline-evidence.json)

沙箱最初禁止寫 `.git/index.lock`，未 Stage 任何檔案；使用已授權範圍的工具 escalation 後完成。LF→CRLF 的 Git 警告沒有改變當次 index bytes／worktree bytes。沒有 force push。Part A 提交完成後，Part B 沒有 Stage／Commit／Push／Reset／Clean／Stash。

保護原 smoke 未暫存修改與 11 個未追蹤保留檔：install.ps1、Sprint 3 中間 JSON、Sprint 4 四個稽核交付與 Sprint 5 五個中間 evidence。未讀取、hash、執行、修改或 Stage 這 12 個 protected 內容；只比較 status／size／mtime。這是 metadata 保留證據，不是 protected content hash 證明。

Part B 的 693 個可讀既有 tracked 檔案逐份 SHA-256 前後相同，包括 Sprint 7–10A 原始成果及三項 Baseline Debt tests。原 Sprint 8／9／10A suites 和 227 manifest 本輪未重跑；Full Repository 仍沿用 **224/227 PARTIAL／三項既有 Debt**。[Non-interference](receiver-execution-v2-sprint-10a1-non-interference-evidence.json)

## B. Actual Owners / Source Classification

codebase-memory Tier 2 採 symbol search → 雙向 depth=1 CALLS → full snippet → current disk verification → coverage。查證 SS builder、NPC capability、2B receiver helper、roster actor、Runner timing／Settlement 及 S8 sampler／validator，共八組 trace／snippet；八份 snippet 與當前磁碟一致。Graph 會自動更新，generation 各自保存；`metadata_changed`／no_recorded_issue 不能當作新鮮度或完整性證明。Namespace CALLS 缺 edge 不代表不可達。Graph 回傳受保護 caller 的名稱僅作 metadata，沒有讀取其 source。[Architecture](receiver-execution-v2-sprint-10a1-architecture-evidence.json)、[Source verification](receiver-execution-v2-sprint-10a1-current-source-verification.json)、[Final coverage](receiver-execution-v2-sprint-10a1-coverage-evidence.json)

| 資料 | 正式來源／限制 | 本輪處理 |
|---|---|---|
| SS primary／active NPC1B／target batter／physical identity | 原 handoff、roster、runner／route owner 的 A facts | isolated input 必須同球／同 actor 副本一致；沒有正式 snapshot extractor |
| 原 sample／canonical throw quality／release／distance | 原 execution owner 首次 sample 及 canonical throw A facts；生成在原階段 | 原樣綁定 sample binary64；normalized delivery view 保存 canonical throw ID 與原 action ID，二者不混稱 |
| NPC1B 起始 context／movement | Production C；SS `atBase=true` 是常數，fielding＋sample 是 combined authority | 新 initial-cover policy，明示 NEW_VERSIONED_MODEL／uncalibrated |
| Incoming demand／Secure duration | Production C；thrower demand 不等於 receiver hands demand | 原品質 class＋新版 incoming policy 的 deterministic model |
| NPC mobility／catching | raw speed／defense 為 A；獨立新映射 C | 新版 speed identity mapping／defense catching alias，不能宣稱獨立技能或完成校準 |
| v1 ball／runner arrival | 原 timing facts／算術 A／B；共同 launch offset C | legacy bridge 回 insufficient；fixture common-origin bridge 可驗證 |
| Touch completion | 原退休投影不證明独立 contact timing | possession gate＋獨立 fixture contact source＋新版 coarse touch delay |
| Ordinary effort／formal lifecycle／Save | C／未接通 | 維持不足，沒有 E／would-be A 或正式保存 |

SS builder 仍直接讀 active NPC1B，以 `fielding + (sample-.5)*4 >= 3.2` 解讀 combined readiness，傳入 `atBase=true`；它不呼叫 2B 的 `resolveHighSchoolInfieldReceiver`。正式 `deriveSettlement` 仍嚴格重算 v1 timing。上述 bytes 與權威均未修改。

A＝實際 Production 原始事實；B＝保留 source／version 的確定投影；C＝缺少正式權威。本輪允許的 C→新版模型另外標 `NEW_VERSIONED_MODEL`，沒有把 Legacy success 改標 A。所有 test provenance 的 `scope=pureFixture` 只代表宣告的人工 fixture fact，**不是 Production authority witness**。

## C. Source Authority Contract / Isolation

新增 [source module](../receiver-execution-v2-source-authority-foundation.js)，CommonJS 只 import 已提交的 S8 pure module。沒有載入 index.html、Match Family Dispatch、正式 cache、Save、Scorer 或 GameRecord。

[完整 Source Authority Contract](receiver-execution-v2-sprint-10a1-source-authority-contract.json) 保存 closed API keys、版本、policy tables、provenance matrix、fixture example 與 blockers。結果是明確 `ok`／`invalid`／`insufficient`；`ok` 只表示隔離契約評估完成。

| API | 輸入與責任 | 隔離輸出／限制 |
|---|---|---|
| `initialCoverPlan` | beforeExecution 的 NPC1B、formation／cover assignment、reference、provenance | frozen context／receiver／phase／policy；unknown 不預設 base covering |
| `createPin` | 原 typed physical／play／leg、player SS、NPC1B、target、handoff copies、空壘 outs0/1/2、routine direct／hold、能力與 cover intent | frozen isolated pin／versions／digest；不保存或提早抽原 sample |
| `adaptNpc` | explicit defense／speed／arm／contact，來源與 actor | eight-value alias snapshot；缺值／超出0–20拒絕，不補 defaults |
| `bridgeTiming` | 同球 origin／explicit launch offset／decimal absolute times／provenance | versioned CRT；legacy 未核定 origin 一律 insufficient |
| `prepare` | 原 sample、canonical delivery view、timing、contact source、pin digest | 新 source models＋S8 explicit-input seal；沒有 Match admission |
| `evaluate` | 已驗證 pin 與 execution source | 未套用的 S8 candidate；actual retirement／Match／record／RNG writes＝0 |

Formal `productionSnapshot` scope 明確回 `productionSourceAdapterNotIntegrated`；只有 `isolatedFixture` 可以進模型。Closed schema 拒絕 legacy receiverReady／receiverCompleted、safe/out、official E/A、額外 throw sample、pending sample preload、未知版本與 unrelated actor／runner／physical／action。必要 source C 回 insufficient。

Pin clone 深凍結 request／actor／能力／cover policy 與版本。Cover plan 本身的 receiver、beforeExecution phase 必須與 pin 一致；execution source 再綁原 sample binary64、canonical throw ID、original action leg、same-play copies 及 digest。Digest 是一致性輔助，不能認證外部自行偽造且互相一致的來源；正式 roster／phase／Save discriminator 驗證仍須原 owner 接入。

## D. NPC1B Initial Positioning Model

`npc1b-initial-cover-policy-v1` 在 execution 結果出現前，從明示 formation／cover assignment 選 context。正式 generator 尚未實作；目前 caller 必須提供有 provenance 的 pre-execution intent，不從 out、ready 或 `atBase=true` 回推。

| Assignment → context | Base MDU | 額外 start ticks | Touch delay ticks |
|---|---:|---:|---:|
| baseGuard → baseCovering | 0 | 0 | 100 |
| firstBaseShade → nearFirstBase | 1 | 0 | 150 |
| coverFromInterior → movingToFirstBase | 3 | 250 | 200 |
| delayedCover → lateCover | 5 | 1500 | 250 |
| unassigned → unavailable | 0 | 0 | 100（不會有 possession／touch） |

這是 coarse policy，沒有公尺、秒或實測座標。`baseCovering` 的 MDU0 是新版本 pre-execution 模型選擇，**不是讀取 Legacy atBase 常數**。Unknown intent 不得默認 MDU0；必要 intent source C 仍不足。

Incoming lateral MDU 加到原 cover demand，再沿用 S8 的 integer stage：range 決定 reach envelope；reaction 降低啟動 duration；mobility 降低移動 duration；positioning completion 與同 origin ball arrival 比較。Start 使用 explicit common-origin positioning time 加凍結 context delay。Unavailable／unreachable／late 不 attempt hands，不記成 failedHands。

本輪 pin 保存 context／MDU／reference／phase／receiver／source／policy version；這是 detached pure object，不是正式 lifecycle／Save pin。Phase 字串本身不能認證真正 admission 時間，未來須由原 handoff owner 發出並交叉驗證。

## E. Incoming Receive Demand Model

`ss-canonical-incoming-policy-v1` 消費 normalized canonical SS delivery view。View 明列 thrower／receiver／target／physical、original action ID、canonical throw identity、upstream completion、throwAttempted、原 throw quality／release／distance。它不重抽 throw success，不讀 Legacy receiver outcome 或正式 scorer。正式 extractor／action-link authority 尚待接入。

| 原品質 | Base demand milli | Clean delay ticks | Lateral MDU |
|---|---:|---:|---:|
| onTarget | 6000 | 200 | 0 |
| challengingReceive | 9500 | 350 | 1 |
| lateWeakThrow | 10000 | 450 | 1 |
| offline | 不 attempt | 不 attempt | 不 attempt |
| notAttempted／hold | 無 delivery | 無 delivery | 無 delivery |

可接傳球另加 short／medium／long 的 demand penalty 0／250／500；delayedRelease 加250。Bobble delay＝800 ticks。係數全部明列 **uncalibrated policy assumptions**，不能當已批准的 Production 成功率。

Hands 沿用 S8 的 catching／fielding integer margin 與原 B physical vector；margin<0 failedHands，0≤margin<1000 bobbleControl，其餘 cleanControl。Receiver arm／throwing／decision 不進 hands。原 owned sample 只綁定來源，不進新的 sample key；canonical first throw 已由原 owner 決定，沒有第二次 throw roll。

Offline／unknown arrival 不補造 flight。Hold／notAttempted 若來源仍帶 known ball arrival，明確拒絕 `noDeliveryHasBallArrival`，不先清掉矛盾事實。Upstream acquisition 沒 completed，不能帶 completed throw。沒有可接 delivery／ready／possession，不產生 touch 或 retirement candidate。

## F. Common CRT / Touch / Timing Bridge Proposal

沿用 `crt-integer-ticks-v2-1`：1000 integer ticks＝1 coarse CRT，非秒。Fixture 的 ball、runner、positioning start 與 launch offset 都必須來自同一 declared original domain／origin；所有 output timestamps 保存同球 origin。第一段 throw launch＝0。

輸入使用 strict decimal text（最多六位小數），BigInt 作 half-away-from-zero 量化。先各自量化 original absolute time 與 launch offset，再對 ball／runner／positioning 同時減去同一量化 offset。每個 absolute scalar 最多0.5 tick 誤差，relative timestamp 最多1 tick；接近邊界可以 collapse 成 tie，**不能稱為無損 v1 轉換**。

Evaluation 另保存明確的 `timeline`：throw launch、ball arrival、positioning completion、receive attempt、Secure completion、base touch、runner arrival 都帶同一版本／origin。Attempt time 只在真正已 attempt 的隔離 stage 由原 ball arrival 投影；沒有 readiness／possession／validated touch 則保存 unknown reason，不能填零。Model completion 超出1e9 ticks 一律拒絕。

| 狀態 | 契約 |
|---|---|
| Known original common origin | 保存 offset／source／bridge version；相同 origin 轉換所有 actors／runner |
| Runner 已先到 | 可為負 ticks，不 clamp／reroll |
| Unknown ball／runner／position time | 保存 reason；無數值0替代，無 candidate |
| Unknown launch offset | insufficient，不開始 evaluate |
| v1 ordinal window／非法數字／負 actor time | invalid；不得把 `{value,state}` 當時間 |
| Exact tie | no retirement candidate |
| Touch | 需 secured possession、獨立 contact intent/source、eligible first-base obligation；touch delay＋S8 fixed jitter |
| Initial0／1／2 outs | 只標 unapplied candidate／wouldBeThirdOut；不計正式 out、分數或 Third-Out |

`legacy-v1-relative` 一律回 `legacyV1OriginMappingUnapproved`，即使 caller 填 offset0 也不放行。現有 v1 缺 launch authority，未來必須由正式 timing／handoff owner 明定共同 contact／launch anchor、保存 offset及版本，再核定 unit／rounding與可接受誤差，不能只把 ball 歸零而 runner 保留旧 origin。

S8 目前不接受負 actor start；真實 pre-launch positioning 不能強行截成0，本輪拒絕並保留 future timing-contract revision blocker。Relay 不在這個 module 的 allowlist；未來同球 relay 必須共用 absolute origin，不可重新起算。

正式 `RunnerThrowSettlement`、Force／Third-Out、single apply 都未修改。若未來要 authoritative retirement，須在原 timing owner 加明確 model/version discriminator，保留 v1完整重算與既有 actor／live force／ordered third-out validation。此 seam 尚未實作。

## G. Versioned Capability / Ordinary Effort

`npc1b-explicit-alias-adapter-v1` 保存 actor、raw source與每項 alias。原 NPC values 不 mutation；沒有新增 Career skill 或 Career adapter。

| v2 能力 | 本版來源／模型 | 狀態 |
|---|---|---|
| reaction／range／fielding | 原 defense alias | B compatibility，不是獨立測量 |
| mobility | raw speed；新 identity mapping | 新版本未校準模型，不宣稱 defense移動速度已驗收 |
| catching | 新 defense alias | 新版本未校準 compatibility，沒有獨立 catching skill |
| arm／throwing | 原 arm／arm alias | 保留 snapshot，不改善 receiver hands |
| decision | floor((defense+contact+1)/2) | 原非負 integer round composite；fixed route 不另抽 out |

S8 transport 仍使用其原 `receiver-explicit-input-v1` explicit eight-value schema；外層另保存真實新 adapterVersion／alias provenance／pin。沒有把新版 tag 偽裝成既有 Production adapter，也沒有修改 S8 version registry。

固定 physical vector 的 defense0–20 joint-alias 梯度及三種 context 的 speed0–20 mobility 梯度共 **84 rows**，沒有 duration／hands 反向；arm／contact 改變不改 B／C／D。Defense aliases 同時變動，這不是四個獨立能力或 Career pipeline 的梯度證明，也不是自然 cohort／平衡校準。

Ordinary effort reference 必須另有同高中 competition／position／environment 的平均能力、source、effort version、核准 calibration authority。Actual weak能力不能作平均 reference。本輪 missing／未校準一律 `ordinaryEffort=insufficient`、official E／would-be A＝null；caller 的 calibrated／average10 標籤也不足。L03仍 PARTIAL，沒有 clean counterfactual、late blame 或 error-specific extra advancement authority。

## H. Focused / Evidence / Non-Interference

[Focused suite](../tests/receiver-execution-v2-source-authority-test.cjs)：**122 named checks／122 PASS／0 FAIL**；84 gradient rows 另列，不加到 named count。[Final focused evidence](receiver-execution-v2-sprint-10a1-focused-evidence.json)

涵蓋五種 initial intent／context、clean／challenging／weak／offline、ready／late／unreachable、clean／bobble／failedHands、fast alreadySafe／clean safe、tie、no possession／touch、hold／notAttempted、unknown CRT、identity／source／pin／version／actor／phase 拒絕、不可 preload sample、repeat／JSON round-trip、arm isolation、ordinary effort不足、getter拒絕及caller immutable。

Sampler直接重用已提交 S8 B：canonical physical binding＋fixed primaryThrow slot／stage namespace，actor／capability／route／retry／original sample 不進 key。Node crypto 獨立 hash／u32BE 對照通過；正常 Node與獨立 `--jitless` process 的完整 probe相同，獨立 VM禁用Math.random並只import S8 API後輸出相同。這不是實際 browser engine、Production Save、statistical independence或自然分布驗收。

[Initial evidence](receiver-execution-v2-sprint-10a1-initial-test-evidence.json) 保留104/105與當時source：新 bobble fixture 的 defense10在固定sample/vector下 margin=-500；只修正新fixture至defense11（margin500），沒有改原sample、threshold或舊tests。後續 schema增強時 patch工具曾只更新新module，未同步新fixture，intermediate39/113保留在 [schema-transition evidence](receiver-execution-v2-sprint-10a1-schema-transition-evidence.json)。完成新fixture/schema同步後117/117，再新增timeline checks，最終122/122；上述是本輪新fixture／工具問題，不挪入歷史Debt或Production regression。

[Timeline boundary diagnostic](receiver-execution-v2-sprint-10a1-timeline-test-evidence.json) 另保留121/122：新 overflow fixture 的 original absolute scalar 已超過 bridge input 上限，所以先被正確拒絕。改用 zero offset 與合法最大 arrival 才驗證 modeled-completion overflow guard；沒有修改 policy、既有 source 或原 sample。

[Isolated runner](../tests/receiver-execution-v2-sprint-10a1-runner.cjs) 前後檢查693個既有可讀tracked hashes、protected metadata／status、Git baseline/index及original root consumer references。全部 unchanged；formal consumers＝0，新增Match RNG callback＝0。新module只依賴S8 pure，正式SS／2B／3B／1B、責任區、lifecycle、Save schema、Settlement／Third-Out、Scorer／GameRecord／Evaluation保持原bytes。本輪沒有載入正式Match、原public fixture或進行fullShadow comparison。

可重跑（不寫既有captures）：

```text
node tests/receiver-execution-v2-source-authority-test.cjs
node tests/receiver-execution-v2-sprint-10a1-runner.cjs
```

`--capture-final` 先檢查整組新paths不存在，再exclusive-create；有captures時拒絕覆寫。原Sprint3–10A證據均保留。[Closeout evidence](receiver-execution-v2-sprint-10a1-closeout-evidence.json)

## I. Sprint 10A.2 Prerequisites

1. 核定正式 pre-execution formation／cover intent owner，發出可信 physical slot／phase／player-NPC actor handoff；不能直接將 pure fixture pin 貼進正式 Match。
2. 校準 context／MDU／start、incoming quality demand／duration、touch模型與NPC speed／catching aliases；保留policy／adapter versions與環境，另以固定樣本與有來源cohorts驗收。
3. 解決真實共同 launch anchor、v1→CRT bridge與pre-launch positioning；設計必要timing contract修訂，正式seam仍由原Settlement owner施工。
4. Formal lifecycle pin／binding／raw Save discriminator／所有early-return guard尚未接通；executed／settled v2 Save仍未實作，不能以JSON round-trip宣稱PASS。
5. 經獨立批准才建立正式snapshot extractor／read-only collector，驗證original callback count/order、cursor、physical／outs／bases／runs／records／Evaluation、cold／duplicate不干擾。不得開始完整Shadow或寫回actual cache。
6. Ordinary effort及正式scorer来源仍是獨立gate；本輪沒有解除L03、三項Debt或Defensive Foundation Closeout限制。

## J. Final Gate

| Gate | 本輪結果 |
|---|---|
| NPC1B Positioning Model | **PASS，限isolated versioned policy**；正式起始source generator未接通 |
| Incoming Demand Model | **PASS，限isolated canonical-view policy**；係數未校準、正式extractor未接通 |
| CRT / Touch Contract | **PARTIAL**：common-origin fixture／possession／tie／unknown通過；legacy bridge與pre-launch範圍未完成 |
| Capability Adapter | **PARTIAL**：alias contract／84 rows通過；Production calibration／Career未驗收 |
| Provenance Integrity | **PASS**：closed scope、copy／actor／phase／sample binding；不是authentication |
| Sampler Determinism | **PASS**：重用S8 B、hash／repeat／JSON／jitless／VM驗證 |
| Ordinary Effort Calibration | **PARTIAL**：來源未核准，official E／would-be A仍null |
| Legacy Non-Interference | **PASS**：693既有可讀tracked bytes不變，formal consumers0；protected metadata／status保留 |
| Focused Tests | **122/122 PASS**；84 gradient rows另列 |
| Full Repository | **NOT RUN**；沿用224/227 PARTIAL、三項Debt |
| Production v2 Integration | **NOT STARTED** |
| Ready for Sprint 10A.2 | **CONDITIONAL**：僅可審核I的來源／校準／版本方案，另行授權施工；非FullShadow放行 |
| Ready for Commit | **YES，僅本輪isolated source foundation成果**；Part B未Stage／Commit／Push |

L03＝**PARTIAL**；`runtimeEnabled=false`。完成後停止，不開始Sprint10A.2、Sprint10B、Sprint11或DefensiveFoundationCloseout。
