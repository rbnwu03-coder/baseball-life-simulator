# Receiver Execution v2 — Production Source Adapter & Timing Origin Design / Sprint 10A.2

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
正式施工基線：`9f768212116bd267f6d436a67b7ed9b0088a2f86`

**有界架構／接入設計完成，新增96/96 focused checks、原Sprint8／9／10A.1相容性364/364通過。** 本輪只新增未載入的隔離prototype、測試、矩陣及證據。共同時間方案選定由原physical-play owner保存contact anchor與各action offsets；Unicode identity、signed positioning start和非零first launch須明示新契約版本，沒有修改已提交語義。Production v2 Integration未開始，`runtimeEnabled=false`，L03仍**PARTIAL**。沒有正式Shadow Simulation、Stage／Commit／Push。

## A. Baseline / Protected WIP

開始main／HEAD／origin/main均同上述已提交Sprint10A.1基線，index空；只有原smoke未暫存修改與11個保留untracked，沒有未知差異。[Baseline evidence](receiver-execution-v2-sprint-10a2-baseline-evidence.json)

保護smoke、install.ps1、Sprint3中間JSON、Sprint4四個稽核交付、Sprint5五個中間evidence，共12個protected內容；未讀取、hash、執行、修改或Stage。只比較status／size／mtime，不能稱為protected content hash證明。708個可讀既有tracked檔案前後SHA-256相同，包含原Sprint7–10A.1成果及三項Baseline Debt tests。[Non-interference evidence](receiver-execution-v2-sprint-10a2-non-interference-evidence.json)

本輪未重跑原227 manifest，也未新增全Repository verdict；沿用**224/227 PARTIAL／三項既有Debt**。必要相容性執行的是原standalone suites，沒有跑舊runner的capture flags或覆寫原證據。

## B. Production Authority Trace / Entry Matrix

codebase-memory Tier2採symbol search→雙向depth1 CALLS→full snippet→當前磁碟比對→paths coverage。29組owner traces、30份full snippet pages，其中`normalizeSave`分12–511及512–628兩頁；所有source pages與current disk相同。涵蓋physical truth、ground handoff、SS primary／builder／cache入口、routine／meaningful dispatch、automatic begin、roster／capability、lifecycle、timing／Force／Save及S8／9／10A.1模組。[Architecture](receiver-execution-v2-sprint-10a2-architecture-evidence.json)、[Current source verification](receiver-execution-v2-sprint-10a2-current-source-verification.json)、[Final coverage](receiver-execution-v2-sprint-10a2-coverage-evidence.json)

S9公開API由`guarded(createPinRaw)`等Raw函式匯出；最初找不到公開名稱的graph node不能當API不存在。Namespace／family registry缺CALLS edge亦由current source補證。Graph會自動更新generation；no_recorded_issue／metadata_changed／not_tracked不是完整性或新鮮度證明。Protected caller名稱只作metadata，未開啟其source。

[27-row Production Ownership & Adapter Entry Matrix](receiver-execution-v2-sprint-10a2-production-entry-matrix.json)逐項列出現有owner、生成時間、首次execution前是否可取、cache／identity、shared dispatch、historical限制、最小新增facts與是否需未來Production變更。A為現有正式來源，B為保留來源的確定投影，C為欠缺權威，NEW為明示新版模型，不能冒充A。

| 來源 | 本輪查證 | 邊界 |
|---|---|---|
| Raw physical／PA／handoff | 原cachedPA與supported ground handoff有真實identity | 不從settled後的currentBatter／outs／bases重建 |
| SS／NPC1B／runner | 原physical opportunity、active roster與initial force obligation可交叉驗證 | Roster assignment不證明physical position |
| Formation／receiver location | traced owner沒有獨立起始位置或持續position memory；SS傳入`atBase=true` | C→NEW policy需先核定，不以先前出局反推到位 |
| Original sample／canonical throw | 原callback與SS cache保存sample；quality／release／distance／variation在execution後產生 | Pending沒有sample，不提前抽；不第二次throw roll |
| Secure demand／touch／clock | 新receiver來源與共同launch offset未正式emit | 原ready／receive outcome／retirement touch投影不補造來源 |
| Save／版本 | lifecycle replacement與early return仍沿用原行為 | isolated pin／metadata clone不是正式Save PASS |

SS builder直接查NPC1B，不呼叫2B的`resolveHighSchoolInfieldReceiver`。空壘SS的原fixture實際為automatic routine；本輪不強造meaningful空壘fixture。兩個dispatch都沿用原infield family／共同handoff，未來snapshot不能各自建立第二個pin owner。

## C. Formation Snapshot / Unique Authority

唯一proposed **Receiver v2 Pre-Execution Snapshot Authority**放在原`ensureHighSchoolOrdinaryGroundBallInPlayHandoff`：fresh supported contact與原actor／runner綁定完成後、classification／beginExecution／sample之前，存於`groundBallInPlayState.receiverSourceSnapshot`。Meaningful context只保存一致副本／reference；routine讀同一handoff，不新增虛構玩家decision。[Formation / Adapter specification](receiver-execution-v2-sprint-10a2-source-adapter-specification.json)

Cached同球必須重用並驗證原snapshot，不依最新policy生成；hold／offline／notAttempted及之後同球action共享original cover intent。新機會才能選新版policy。Pin綁actor／能力／physical／versions；同球換人或資料矛盾拒絕，不能換seed取得新結果。

首版可核定`policyNominal`的deterministic baseGuard模型：NPC1B assignment作為policy輸入，在fresh contact選名義baseCovering。**這是NEW模型假設，不是existing physical-at-base fact。** 其他near／moving／late／unavailable須來自明示coarse formation state／cover intent。若需要先前守備行為的position continuity，必須新增正式coarse fielder state；現有traced owner不能證明上一球之後NPC1B的位置。不能假設先前有PO就已回到壘包。

首次policy不消耗Match RNG。Frozen formation seed由policyVersion＋完整原physical binding＋fixed`primaryThrow`＋namespace產生，不含actor／ability／route／outcome／retry／originalSample；seed用作保存／驗證，不等於必須新增亂數variation。模型類別選擇也須固定保存input與版本。未來若引入seeded variability，另核定sampler／分布及保存契約，不偷增callback。

最小snapshot字段為format／snapshot version、raw／typed physical copies、original actor／defenseTeam references、initial outs／bases、runner obligation、legal route surface、formation／capability／clock policy versions、source digest。這些字段目前都是**draft**；本輪未寫正式Match state或Save。

## D. Typed Identity / Fixed Slot / 實際阻礙

| Typed欄位 | 原來源 |
|---|---|
| matchId | `match.id` |
| plateAppearanceId | 原`ordinaryDefensivePlateAppearanceState.paIdentity` |
| contactId／physicalIdentity | 原`battedBallPhysicalTruth.identity`，與handoff／PA／opportunity copies一致 |
| playId | 原`groundBallInPlayState.identity` |
| target runner／base | 原batter-runner／forceChain的first-base obligation |
| SS／NPC1B | 原defenseTeam的canonical active roster，與opportunity／teammate copy交叉驗證 |
| fixed slot | 同physical opportunity的`primaryThrow` mapping，尚未正式pin；不是route-dependent canonical throw ID |

[Blocking source evidence](receiver-execution-v2-sprint-10a2-blocking-source-evidence.json)保存三個實際接入阻礙：

1. 原Production PA／contact／action identity含「上」等Unicode；S8的ASCII-only `id()`會拒絕。
2. 本輪實際canonical throw ID長264字元；10A.1的ID上限240亦不相容。
3. 真正hold的canonical receiver／target為null，release為`held`；action ledger仍可能保存**notAttempted的planned**NPC／first target。不能用planned actor覆寫actual canonical null，或製造不存在的completed delivery。

Prototype保留原字串／null，沒有改成synthetic ID、hash-only ID或未標示的ASCII encoding以通過舊validator。新physical binding提議`physical-contact-binding-utf8-v2`，保存原code points、不作Unicode normalization；原actor role與physical copies仍須驗證，codec不是actor授權。[Pure revision proposal](receiver-execution-v2-sprint-10a2-pure-contract-revision-proposal.json)

新revision還需涵蓋play／leg／canonical-source reference IDs及明示長度界限。Proposed limit為4096 UTF-16 code units；須先review保存與schema上限。Current S8／9／10A.1函式與version predicates完全不改。

## E. Adapter Phases / Prototype

新增 [isolated adapter/timing prototype](../receiver-execution-v2-production-source-adapter-prototype.cjs)，只在Node測試載入，不加入Match／index／Registry。Source觀測與fixture模型嚴格分開。

| Phase | 來源／處置 |
|---|---|
| Before execution | Raw physical／PA／roster／runner與legal surface；沒有owned sample／canonical throw。拒絕executing、既有partial execution facts或sample log；缺formation／origin明示C |
| During source handoff | 原`resolveInfieldDecision` callback之後、SS builder生成canonical facts／action refs。綁原sample binary64與action provenance，不再抽樣；保存selection／throw／actor／target副本 |
| Post detached diagnostic | 必須帶原pre-execution anchor；不能用later currentBatter／defenseTeam重建。Output只有source completeness／missing facts；`sealedCandidateInput=null` |

實際outs2 fixture結束後currentBatter已改變，但原PA／runner／roster anchor仍保留。這個正例直接說明恢復時不能以最新Match狀態取代original physical來源。

Canonical throw quality、distance、release與variation原樣保存；缺canonical source但raw throw action標completed時拒絕。Acquisition failure沒有canonical throw object，保留null與notAttempted理由。Offline／combined receiver failure／fast-safe分支均不推導hands、Secure demand、普通努力或touch。原action provenance只作audit，不作new receiver outcome輸入。

原NPC defense／speed／arm／contact有值才標A，缺值標C／null，不pad defaults。版本化映射及coefficient calibration仍未完成，prototype不自行呼叫10A.1的Production-denied入口，也不把Production raw source標成pureFixture來封裝完整候選。

Formation／Timing prototype的人工數值均明列`scope=isolatedFixture`，不能宣告Production Authority PASS。Source観測使用原fixture合法初始化與Legacy resolver，只抽取原owner事實，沒有candidate execution或legacy/candidate FullShadow比較。

## F. Timing Origin Decision / Pre-Launch Revision

[Timing Origin Decision Record](receiver-execution-v2-sprint-10a2-timing-origin-decision.json)選定**C：原Match Physical Play Owner的一個共同clock，以contact作anchor，另保存各action offsets**。這是本輪設計決策，不是已接通或已批准Production啟用。

| 方案 | 評估 |
|---|---|
| A：contact直接作原點 | 能涵蓋runner／positioning，但仍需明定owner／Save／各leg offsets |
| B：SS first launch作局部原點 | 相容舊S8 first launch0，但prelaunch變成signed；relay重設會丟失共同chronology，v1缺launch offset |
| C：physical owner保存contact anchor＋offsets | 唯一owner、same-ball／relay／replay共同來源；launch-local時間只作derived projection，採此方案 |

Proposed `crt-physical-play-integer-ticks-v2-2`沿用1000 ticks/CRT的coarse model單位，非秒／公尺。接球者可在throw launch前移動：contact0、positionStart.25、throwLaunch2，其launch-local start為-1.75CRT，不clamp。Global start可以signed（若來源證明precontact activity），duration仍非負；first throw launch不再必須0。

正式clock需要新增**NEW版本化模型來源**：

- Contact anchor由原physical owner保存。
- SS acquisition completion／transfer duration／launch offset需reviewed clock policy；release quality不是elapsed time。
- 新flight duration由canonical distance／quality／strength來源及已核定policy產生；release在launch只計一次。不能把v1 ball scalar直接當flight，再加一次release／v2 delay。
- Runner使用原physical runner inputs與新核定contact-relative clock policy；v1 scalar目前只是未anchored quantity，不能默認time0＝contact／launch。
- Positioning、Secure、touch必須各有獨立stage source／policy／possession及合法contact。沒有來源保持unknown。

Prototype用strict decimal text（最多六位小數）與BigInt先作**exact time-origin subtraction**，再half-away-from-zero量化一次；每個relative timestamp誤差≤.5 tick，race margin≤1 tick。所有times帶同一origin／timing version。Tick tie不產生正式out；極近margin可collapse成tie，不能宣稱無損v1 migration。Exact micro-values先驗causal order，負duration即使round成tie仍拒絕。

Known relative ticks界限±1e9；overflow拒絕、不clamp。Unknown origin阻止解讀，unknown stage保存reason，不補0；ordinal `{value,state}`拒絕。No possession／no contact不能帶touch completion。Receive attempt須在原可接ball arrival且已到位，late positioning不能改名hands attempt。

Relay的設計保持同一absolute origin與offsets；本輪continuation test只是clock座標檢查，不是relay／first-force／DP authority驗收。正式Force／Third-Out仍負責ordered retirements／合法得分，prototype的relation只是**unapplied timing order diagnostic**，actual retirements＝0。

## G. Pure Contract Revision / Compatibility

| 維度 | Proposed新版本／必要語義 |
|---|---|
| contract／execution | `receiver-pure-contract-v2-2`／`receiver-pure-stages-v2-2`，不改v2-1語義 |
| physical | `physical-contact-binding-utf8-v2`，保留實際raw Unicode IDs與長reference |
| timing | `crt-physical-play-integer-ticks-v2-2`，contact-global offsets／signed actor start／first launch非零 |
| sampler | `physical-slot-sha256-u32be-utf8-v2`，canonical JSON／UTF8／SHA256／u32BE，但明示新model／physical versions |
| source adapter | `receiver-production-source-adapter-v2-1`，明示真實snapshot source／nullable no-delivery mapping |

這些**均為DESIGNED／NOT IMPLEMENTED**；本輪只測prototype。新namespace可能改sample vector，必須列MODEL MIGRATION DIFFERENCE，不得把舊pin升版／重新抽樣。舊model／timing／sampler resolver應保留，pending也不能依新feature policy重選。

Current S8仍拒絕new timingVersion與負positioning time；96項中的反例明查這些拒絕仍在。沒有偷偷擴充已提交Pure／Source契約或schema。正式RunnerThrowSettlement仍嚴格v1重算，未改其time或建立第二個apply owner。

## H. Capability / Calibration Plan

[Calibration plan & exact change map](receiver-execution-v2-sprint-10a2-calibration-lifecycle-plan.json)分開raw A、compatible alias B、NEW mapping與calibration required：NPC defense是reaction／range／fielding alias，arm是throwing alias，decision是原round composite；mobility←speed與catching←defense仍是10A.1的NEW未校準映射，沒有新Career skill。

本輪不更動10A.1的MDU／start／demand／Secure／bobble／touch係數。校準先驗identity／actor／causal order與clock單位，再驗formation／range／mobility、incoming demand、hands／bobble、touch。Cohort方案涵蓋SS品質、NPC能力、runner速度、五種cover context、outs0/1/2及direct／hold／offline／no-delivery；全部**PLANNED_NOT_RUN**。

Hard gates為fixed-vector單調、stage separation、late不當hands、arm不改善receive、同origin／tie／unknown、owner合法性及callback／cursor／records不干擾。不能只以Legacy出局率為校準目標，也不能只跑未曝光route後補分母。未核定numerical distribution tolerances或宣告Production calibrated。

Ordinary effort仍是獨立同league／position／environment reference source，不能拿actual弱能力或average10放行。L03／Scorer completeness仍PARTIAL；本輪不產生正式E／would-be A。

## I. Exact Production Change Map / Historical Save

12-row Change Map列出source file／函式、最小fields、生成／驗證／保存phase、historical acceptance／rejection及tests；範圍是new SS-primary empty-base direct／hold的**source-only後續設計**，不是全部receiver migration。[完整map](receiver-execution-v2-sprint-10a2-calibration-lifecycle-plan.json)

主要變更點：

1. `script.js` common ground handoff生成／保存receiverSourceFormatVersion與snapshot；existing contact branchvalidate/reuse，不重新admit。
2. Original actor／capability source凍結original defenseTeam／roster refs，snapshot先於sample；兩dispatch及automatic begin共用guard。
3. `resolveInfieldDecision`只在原callback／canonical facts後綁source view；Legacy execution、sample／targets／cache權威不變。
4. `MatchSituationLifecycle.createSituation/beginExecution`明確保留validated ref／copy，不能仰賴unknown欄位自動存在；settled／closed只按需要保存version reference，不重記GameRecord。
5. `save.js normalizeSave`在raw saved version讀取後、defaults／Object.assign前做可信format guard。Shared decision-throw入口在**所有firstBase／3B／missingfacts／settlementApplied early returns之前**驗證snapshot／pin／cache副本。
6. New pure versions先獨立驗收；正式timing seam與external read-only collector留待另行授權，不能從source-only metadata PASS提升為v2 runtime Save PASS。

真正legacy pending／executed／settled保留原model／cache；不補新來源、不reroll、不回填統計。New-source-only格式要求snapshot／versions／copies，missing／unknown／contradictory tags拒絕；pending沒有sample，executed用原保存sample，settled不依latest policy重算。

若所有新標記與format header都遭改寫，digest／caller history label不能認證歷史；可信storage/source-format provenance仍是獨立owner前置条件。本輪未完成或宣告candidate-v2 executed／settled正式Save能力。

## J. Focused / Non-Interference Evidence

[Focused test](../tests/receiver-execution-v2-production-source-timing-test.cjs)：**96 named checks／96 PASS／0 FAIL**。[Final evidence](receiver-execution-v2-sprint-10a2-focused-evidence.json)

使用原legal fixture definitions／原seed／原sample，不修改original assertions、fixture或賽中physical inputs。Actual source cases涵蓋空壘SS outs0/1/2、NPC1B／runner／roster、callback在executing才產生、post currentBatter已改變、Unicode identity、長canonical ID、hold nullable target、offline／acquisition no-throw／receiver failure／fast-safe，以及physical／sample／actor／action／selection／provenance tamper拒絕。Snapshot／prototype前後完整player／Match JSON相同，沒有追加random callback。

Formation／clock fixtures明示isolatedFixture，測fixed physical slot／intent保存、signed prelaunch、unknown origin／timestamps、causal reversal、subtick tie、overflow、no possession／touch／delivery、v1 ordinal拒絕、repeat／JSON／normal-vs-jitless equality。新的Source Adapter未執行candidate Pure pipeline；相容性suite原樣執行其既有pure fixtures。沒有正式Shadow／Save／Scorer effects或自然career cohort驗收。

[Compatibility evidence](receiver-execution-v2-sprint-10a2-compatibility-evidence.json)：原S8 **91/91**、S9 **151/151**、10A.1 **122/122**，合計**364/364**。原tests／module bytes／captures未變，沒有capture flags。不是Full Repository PASS。

[Initial evidence](receiver-execution-v2-sprint-10a2-initial-test-evidence.json)保留84/86：新unknown fixture仍保留known下游arrival／completion，原prototype正確回missingCausalTimeDependency；只修正新fixture依賴。另保留 [new runner diagnosis](receiver-execution-v2-sprint-10a2-runner-initial-evidence.json)：新runner誤以為S8／9的return shape也是summary／checks，實際為top-level totals／rows；只修正新runner。不列Production rule bug或挪入Debt。

708個可讀既有tracked hashes前後一致，new module在原root JS／CJS／HTML的consumer references＝0；沒有index／family registration、正式Match RNG、lifecycle／Save／Settlement／Force／Third-Out／scorer／GameRecord／Evaluation或責任區変更。Protected metadata／status相同，內容未讀取。[Non-interference](receiver-execution-v2-sprint-10a2-non-interference-evidence.json)、[Closeout](receiver-execution-v2-sprint-10a2-closeout-evidence.json)

可重跑（不寫既有captures）：

```text
node tests/receiver-execution-v2-production-source-timing-test.cjs
node tests/receiver-execution-v2-sprint-10a2-runner.cjs
```

[Runner](../tests/receiver-execution-v2-sprint-10a2-runner.cjs)的`--capture-final`先檢查整組新paths不存在，再exclusive-create；不得覆寫Sprint3–10A.1或本輪原始captures。

## K. Sprint 10A.3 Readiness / Final Gate

最小後續施工應先review／核定UTF8／signed-time／sampler versions與nominal formation／clock source policy，再新增version-dispatched pure契約測試；之後另授權common pre-execution snapshot及raw／shared Save guard／lifecycle retention。Official execution維持Legacy，不因本輪prototype PASS直接接Shadow或Settlement。未review政策／版本或仍缺source時保留insufficient。

| Gate | 本輪結果 |
|---|---|
| Production Authority Trace | **PASS**，有界29traces／30 current pages；graph限制明示 |
| Formation Snapshot Design | **DESIGNED**，唯一pre-execution handoff owner／NEW policy；未emit正式state |
| Physical Identity / Slot Mapping | **PARTIAL**，原來源mapping查證；UTF8／長ID與formal pin revision未實作 |
| Production Adapter Contract | **DESIGNED**，三phase／nullable hold／source completeness；非正式admission |
| Timing Origin Decision | **DECIDED，design only**：C physical owner/contact anchor＋offsets |
| Pre-Launch Timing Revision | **DESIGNED**，明示new timingVersion；旧語義未改 |
| Calibration Plan | **DESIGNED**，未執行／未calibrated |
| Lifecycle / Save Change Map | **COMPLETE，限本輪有界source-only設計**；正式v2 Save未完成 |
| Isolated Validation | **PASS，96/96**；兼容性364/364另列 |
| Legacy Non-Interference | **PASS**，708舊bytes／protected metadata／status保留，formal consumers0 |
| Full Repository | **NOT RUN**；沿用224/227 PARTIAL／三項Debt |
| L03 | **PARTIAL** |
| Ready for Sprint 10A.3 | **CONDITIONAL**：上述policy／version需review與獨立施工授權，非FullShadow放行 |
| Ready for Commit | **YES，僅本輪isolated設計／prototype／測試成果**；未Stage／Commit／Push |

完成後停止，等待人工驗收。不開始Sprint10A.3、10B、11或Defensive Foundation Closeout。
