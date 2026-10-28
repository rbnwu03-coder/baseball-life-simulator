# Test Reliability Audit v0.1 — Read-only Discovery

專案：Baseball Life Simulation（棒球人生）  
日期：2026-10-14（Asia/Taipei）  
正式基線：`ab3117653945de0b7013636187c446276a96e634`  
安全停點：Sprint10A.3b-R6；沿用全部未提交 WIP。

**盤點251個測試套件入口：194 PASS、5 FAIL、52 UNVERIFIED。這是目前可採信的證據集合，不是本輪full結果。** 本輪只執行10個必要的suite child processes、2個唯讀Git buffer probes及54個獨立source comparisons，沒有full manifest invocation。另有13個browser fixtures全部UNVERIFIED。

**發現原full wrapper會跳過 `require.main === module` 主測試：R6第176套的exit0不是套件PASS。** 原入口重跑後實際在第8項Save freeze失敗。另確認5套仍要求舊Save全檔相同，其中2套也要求舊index.html全檔相同；2套UI測試direct Node遭Git ENOBUFS、原wrapper則PASS。Receiver v2／Match Vertical Slice的Production限時收斂入口目前＝**NO**；Receiver v2仍DISABLED、L03仍PARTIAL。

## A. Baseline / Protected WIP

main、HEAD、origin/main tracking ref都等於指定Commit，index空；本輪没有fetch，這不是遠端server重新查證。開工核對R6 delivery及原WIP，保存**945個可讀既有檔案SHA-256**。[Baseline evidence](test-reliability-audit-v0.1-baseline-evidence.json)

945個原有檔案結案全部hash相同，包含Production、正式tests、fixtures、seeds、pinned checker及10A.3b／R1–R6 captures。12個protected paths只核對status、size／mtime，沒有讀取、hash、執行、修改或Stage內容；metadata相同不是protected content hash證明。新增檔案全部位於docs，包含本報告、清單、captures及小型offline整理utility。[Closeout evidence](test-reliability-audit-v0.1-closeout-evidence.json)

沒有Reset／Clean／Stash／Stage／Commit／Push，沒有啟用Receiver v2，也沒有開始Sprint10B或修復Sprint。

## B. 實際Inventory / 狀態定義

tests目錄實際**324個檔案＝311 JS/CJS＋13 HTML**。311中有247個標準`-test.js/-test.cjs`、`vertical-slice-smoke.js`及3個非標準assertion入口：`callbackTest.js`、Sprint9 Legacy comparison、Sprint10A.3b Legacy comparison，共251個suite entry。其餘60個是helpers／runners／probes／diagnostics，不以有main或輸出metrics就算suite。13個HTML是browser fixtures，未操作browser，結果UNVERIFIED。

| 靜態主分類 | 套件 | PASS | FAIL | UNVERIFIED |
|---|---:|---:|---:|---:|
| Integration | 190 | 144 | 5 | 41 |
| Unit | 46 | 38 | 0 | 8 |
| Contract | 14 | 12 | 0 | 2 |
| Protected，內容未讀／分類未查證 | 1 | 0 | 0 | 1 |
| **合計** | **251** | **194** | **5** | **52** |

主分類按檔名、VM／harness使用及contract入口作靜態判定，混合套件可同時含unit與integration assertions；不是新的正式registry。可讀suite為250，protected smoke只有metadata。

每套的原standalone command、實際採信command或R6 in-process入口、timeout／buffer、literal及index-derived依賴、hash、evidence、未執行狀態都列於[完整套件清單](test-reliability-audit-v0.1-test-inventory.md)與[final inventory JSON](test-reliability-audit-v0.1-inventory-final-evidence.json)。依賴closure是靜態候選，不保證computed calls／excludeFiles選項全部解析。

| 非互斥依賴標記 | 數量／範圍 |
|---|---|
| Direct Git dependency候選 | 29；另1個R2 runner test的literal Git calls是mock，不算真實direct Git執行 |
| Potential Git dependency經helper closure | 41；conditional／baseline modes可能才會用到 |
| 已逐項確認program-source保護 | 17；包含完整、function／region、exact delta及call-count保護 |
| Immutable fixture／helper source protection | 9；與正式Save freeze分開 |
| Working-tree change-scope guards | 9 |
| Historical program behavior replay | 4；讀Git source重播，不等於current整檔freeze |
| Legacy VM/runtime候選 | 225；含固定arrays及index-derived helpers，不是全部真實browser runtime |
| Receiver / Save / SS-ground / Match-settlement靜態標記 | 18 / 125 / 18 / 34；以名稱／直接入口作候選，關鍵驗收另列D節 |

初版literal掃描的73個「source-freeze候選」包含data與fixture assertions，**不能稱為73個正式freeze契約**。final inventory改列經review的17個program-source保護，保留初版數字供追溯。

PASS要求assertion確實執行且有符合目前未變source的capture。FAIL仍包含既有Debt；UNVERIFIED表示沒有足夠current-WIP execution evidence。**NOT RUN是某次run的執行狀態，不是另一種整套驗證結論。** R6 full未跑49套中，有些另有targeted PASS；其餘仍UNVERIFIED。Formal歷史exit0、局部source comparison PASS或未執行main的exit0，都不能補成current PASS。

## C. Necessary Reruns / Known Failures

前五個process沿用原full的Node `-e` wrapper、180000ms／30000000 bytes；入口診斷的direct processes使用原`node file`、120000ms／16000000 bytes。UI control保留原full wrapper。全部使用Node v24.19.0、相同Production及原test bytes，未改fixtures或seeds。每次完整command／environment／stdout／stderr／exit／elapsed見[已知失敗replays](test-reliability-audit-v0.1-known-failure-replays-evidence.json)、[entry／buffer replays](test-reliability-audit-v0.1-entry-buffer-replays-evidence.json)。

| 原套件／profile | Actual結果 | Elapsed | 根因範圍 |
|---|---|---:|---|
| pitch-tactical-decision-production-integration | FAIL；前7 PASS，第8 Save freeze | 4159.36ms | **CONFIRMED**：current Save與ac53bf6 pinned全檔不同；R6例外尚未涵蓋此test |
| baseball-match-foundation-2-2-2 | FAIL；原第36項 | 870.92ms | Failure confirmed；具體false operand **PARTIAL** |
| high-school-year-one-opportunity-two | FAIL；DefensiveDecisionThrowFoundation undefined | 362.12ms | **CONFIRMED runtime load缺口**：固定runtimeFiles缺必要owner，execution直接呼叫它 |
| ability-performance-gradient | FAIL；Low tier can have a multi-hit game | 12959.59ms | Failure confirmed；model defect與cohort假設的因果 **PARTIAL** |
| vertical-slice-smoke | PASS | 1341.55ms | 原Legacy內容／流程smoke；不是Receiver v2或完整Match Vertical Slice acceptance |
| contextual-status-panel，direct／wrapped | FAIL ENOBUFS／PASS 40/40 | 80.29／118.19ms | **CONFIRMED command-sensitive infrastructure** |
| outcome-transition-hierarchy，direct／wrapped | FAIL ENOBUFS／PASS 36/36 | 82.11／153.63ms | **CONFIRMED command-sensitive infrastructure** |
| pitch-tactical-decision-production-adapter，direct | FAIL；前7 PASS，第8 Save freeze | 12973.13ms | **CONFIRMED**；R6 wrapper未執行main，原套件Green證據不足 |

表內10個process是8個unique suites：5個FAIL、3個有可用profile的PASS。兩個UI direct FAIL與wrapped PASS同時保留；不把profile差異隱藏為單一無條件Green。

**Match第36項**把completed、兩個既定offense moment IDs、defensive meaningful count一致及safety<1400合成一個bool；captured assertion沒有各operand值。不能宣稱已證明是舊ID、無法完賽或density bug。第37、38項未到達。建議後續先在隔離observer捕捉各operand，保持seed與原assertion，才決定owner或fixture責任。

**Gradient**使用batting8／16及各20個seeds，先要求低tier multiHitFraction>0，再要求高tier hitlessFraction>0。第一項失敗後第二項未到達。原helper明列scenario IDs為routing keys，PA identity RNG仍shared；修改simulationSeed不等於全部PA identity draws獨立。有限cohort一定出現尾端結果的假設需要檢驗，不能據此直接改seed／tier／assertion或宣稱Production已定位。

**Opportunity-two**的固定VM缺`defensive-decision-throw-foundation.js`，而`buildHighSchoolShortstopExecution`使用其buildDecisionOpportunity／selectDefensiveRoute／resolveThrow。正常index集合有該owner。這是詳細SS execution的必要dependency，不應建立fake owner或把核心validation改為可忽略。最小候選是另行授權修復該suite的load manifest並驗證原assertions；本輪未修改。

## D. Receiver / Save / SS 6-3 / Match Settlement基線

以下引用經945項unchanged hash核對的**R6實跑capture**；不是本輪再次執行879項，也不能由Green推翻full blockers。

| 關鍵路徑 | 可確認證據 | 限制 |
|---|---|---|
| Receiver v2.2／Pure／Version Admission／Source Authority／Timing | 155＋91＋151＋122＋96＝615/615 | Pure／contract與來源有界驗證；Production candidate runtime未啟用 |
| Save ownership exact delta／raw boundary | R6 23＋30；包含21個negative拒絕 | 已授權v1三項責任，不能自動套到其他freeze tests |
| Production Source／R1 Save／R3 Guard／R4 Dependency | 108＋19＋40＋44＝211/211 | Same-play tamper、cross-play Legacy、early-return及optional-module fixtures |
| 主focused | **879/879，R6引用** | 53＋211＋615；units與重複Pure91另列 |
| Legacy non-interference／genuine Historical | **25/25 pairs＋3/3 cases** | 原sample、callbacks、RNG、record／Evaluation、cold／duplicate；不是任意match輸入證明 |
| Career Save admission | **45/45** | Normalized career legitimacy；不解除source-freeze契約 |
| BBP-B1 | **20/20**；R4 formal／WIP parity亦保存 | 精簡Legacy runtime boundary已修；不表示所有fixed VM載入完整 |
| SS defensive／SS 6-3及ground執行 | SS production **26/26**；Receiver／Legacy fixtures補充pin、cache、record驗證 | 原detailed owner的explicit fixtures；仍有Opportunity-two load debt |
| Full Game Record / Lifecycle | **13/13 / 23/23** | 有界正常完賽、record finalization及lifecycle contracts |
| Ground lifecycle / Multi-runner settlement | **26/26 / 16/16** | Cold／duplicate、runner／third-out及record pathways；完整Match第36項仍FAIL |
| Related | R6 **17/17 suites** | Related使用direct Node；兩個infield test是top-level執行，不是exported run() |
| Pitch Sequence | **8/8**，R6及full member173真正執行 | 已授權Save checker branch；Tactical其他suite尚未修訂 |
| S8 cross-runtime | R6 10 schema rows、30 .NET rows及Node／jitless／VM parity | 專用cross-runtime證據，不併入suite數或879 |
| First-base | R6 **42/42，180秒功能PASS** | Timing調查仍open；本輪NOT RERUN |

[R6 gate evidence](receiver-execution-v2-sprint-10a3b-r6-gates-evidence.json)與完整inventory逐套連結保存這些來源。重要未驗證項目包括Receiver10A readiness、R2 runner tests、S9 Legacy comparison，以及third-out attribution／third-out integrity、team-roster-match、scoreboard等未跑的current套件；完整52項清單另列，不能用舊formal結果推定PASS。

## E. Source Freeze Inventory / Ownership判斷

逐項review catalogue涵蓋39個suite entries：17個program-source guards、9個fixture/helper protections、9個working-tree guards、4個historical replay；種類與refs不是互換。[Source freeze review](test-reliability-audit-v0.1-source-freeze-review-evidence.json)

對6個Pitch production suite的全部source loops，以原normalized equality或原專用checker獨立比較**54項：47 PASS、7 FAIL**。這是靜態source比較，不是6套整套驗收或額外54項功能tests。

| Suite / pinned authority | Save clause | Actual suite狀態／其他static conflict |
|---|---|---|
| Sequence / a0e512b | R6 exact original＋3 authorized delta | R6 8/8 PASS；全部個別source comparisons PASS |
| Tactical Decision / ac53bf6 | 舊Save全檔 equality | R6與本輪原套件FAIL |
| Tactical Interpretation / 98bcd1d | 舊Save全檔 equality | 整套UNVERIFIED；獨立Save比較FAIL |
| Tactical Decision Adapter / 9b9546f | 舊Save全檔 equality | R6 main被跳過；本輪direct真正FAIL |
| Tactical Intent Evidence / 2a4b44a | 舊Save全檔 equality | 整套UNVERIFIED；**Save及index.html**獨立比較FAIL |
| Tactical Signal Projection / 674e491 | 舊Save全檔 equality | 整套UNVERIFIED；**Save及index.html**獨立比較FAIL |

六個pinned Save normalized SHA-256均為`d093c730a4082a05050476a110553204e5234d72596b3cb449423f56566fe592`；current normalized為`9a3a1013cd8451979785f118b1e43fde65d10d71ff507ae8626c771bff3287a7`。Current raw Save hash仍`7111e218…`，本輪没有Production delta。共同原bytes可支持合併ownership review，**不代表R6限定Sequence的人工授權已擴張到其餘五套或index wiring**。

Pitch／RNG／Save唯一owner保護目的仍有效。衝突在於五套將原Sprint scope證明綁成舊Save整檔freeze；應由人工先決定是否採用同一個已審核exact responsibility contract，並另外審核兩個index full-freeze對Source adapter entry的邊界。不得換pinned commit、以current整檔hash作新baseline、刪assertion或無条件取消freeze。

其他保護保持有效：原95-functions／constants／external wiring checker、tactical exact repeat extraction、ground的pitcher-input region equality、relationship opportunity／evidence owners全檔比較。Relationship feasibility對Save只比9個unique原persistence operation lines；recency／temporal suite已明列Save不在全檔freeze中。這些不能誤列為新的完整Save conflict。

Hash檢查另包含R6 pinned authority及metadata-only adapter的精確normalized hash；runtime snapshot SHA、sample vector hashes及data immutability assertions不是program source freeze。Literal搜尋包含所有本次讀取的test/helper依賴，computed／外部未宣告calls仍未完整枚舉，不能宣称發現了所有可能的隱式freeze。

## F. Git Buffer / 工作樹 / Runner可靠性

原 `git show formal:script.js` 输出**1,070,296 bytes**。同一Node executable、command與cwd，implicit `execFileSync` buffer實際報ENOBUFS；明列30000000 bytes則exit0。[Git buffer probe](test-reliability-audit-v0.1-git-buffer-diagnostic-evidence.json)。失敗probe的輸出不得視為complete，即使這次收到的字串hash恰好相同。

外層suite spawn的30MB只保護suite output，不能替nested `execFileSync('git',...)`設定buffer。既有wrapper只補Git show未明列maxBuffer的calls，保留explicit buffers；這解釋兩個UI control能通過。但它最後用`require(process.argv[1])`，**不會使被載入suite成為require.main**。

R6第176套Adapter使用main guard，capture為49.29ms、exit0、stdout/stderr空；目前178個full process rows中，它是唯一exit0且空stdout的row，完整source亦確認主測試未執行。其他main-guard suites多在R6未跑49套或227以外；未來沿用wrapper亦會漏執行。不能只檢查stdout非空就保證assertion執行，應驗證entry與check totals。

| R6 full原記錄 | 本次可靠性資格審查 |
|---|---|
| 178 processes；174 declared PASS、3 Debt、1 new、49 NOT RUN | **173有assertion執行的PASS、4 actual FAIL、1 skipped-main UNVERIFIED、49 NOT RUN** |

舊capture／R6報告原樣保存；本輪沒有重啟full。另一次direct Adapter replay新增已確認FAIL，並非把原full改寫成179套。本輪251入口清單因此有5個actual failures；UI兩個direct buffer failure是另列的profile failure。

9個career／presentation worktree guards以`git diff --name-only`檢查局部architecture scope。它們依賴cwd、HEAD、index/worktree及untracked載入集合；純Git blob結果與當前WIP VM不是同一環境。保留scope保護，但未來runner需明列baseline、root sources及dependency hashes，避免只以suite bytes與exit比較。

## G. Timeout / 未執行 / First-base Timing

R1 serial baseline與WIP在120000ms分別ETIMEDOUT；300000ms診斷各exit0，124368.12／122173.32ms。舊120秒結果仍timeout，不改判PASS。R2人工批准first-base專用180000ms、16MB，400場及42checks未減少；原full早已180000ms／30MB。[Infrastructure／timing evidence](test-reliability-audit-v0.1-infrastructure-review-evidence.json)

| R6功能與時間比較 | Actual判斷 |
|---|---|
| WIP131374.29ms，42/42，完整output parity | 180秒功能PASS |
| 比R4 formal101026.35ms慢30347.94ms | 超過`max(10000ms, baseline×20%)`＝20205.27ms；**不是timing PASS** |
| 比相同Production bytes的R4 WIP124833.72ms慢6540.58ms | 未超24966.74ms門檻；不能由single inherited pair定位因果 |

本輪没有再跑first-base。Production bytes完全未變，不用一次額外runtime把正式timing discrepancy掩蓋為修復。後續應預先固定相同executable／environment／root sets、暖機與交錯serial pairs、pair數及stop threshold，保留每次elapsed／CPU背景條件；設計先經審查，不能提高全域timeout或縮減cohort。

原227固定manifest仍有歷史價值，但比目前251少24個入口，其中包括新的Receiver contracts、first-base、third-base與smoke。R6尚有49個manifest members NOT RUN，全部251中52個UNVERIFIED；不能稱為224/227或完整failure-set一致。Protected smoke仍不得納入可執行manifest。

## H. Infrastructure Proposal — 重用現有工具，未實作

現有package.json只有兩個opportunity audit scripts，沒有統一npm test或Smoke／Targeted／Full介面。R2 per-suite policy、R4 `runSuite`、R6 structured focused gates與exclusive captures可以重用；不需在本輪建立新framework。[Runner source review](test-reliability-audit-v0.1-infrastructure-review-evidence.json)

| 能力 | 現況 | 最小後續候選 |
|---|---|---|
| Smoke | 可直接跑可讀vertical-slice smoke；protected smoke禁止 | 明列安全readable小manifest及其功能限制 |
| Targeted | R6 exported focused／related lists可用 | 版本化dependency list；區分standalone與exported-run；補新的capture labels |
| Full | 固定227及signature-aware stop可用，但main入口漏執行 | 保留舊manifest/archive；另審核current entry manifest與entry-safe launcher，不自動覆蓋227 |
| 個別timeout | R2 exact first-base180、related120、full180；explicit buffers保留 | 沿用已核准limits，對真的超時套件個別附原因；不全域加大 |
| PASS／FAIL／UNVERIFIED／NOT RUN | R6主要用exit與Debt；無完整verification層 | 添加assertion-execution evidence與profile；skipped main＝UNVERIFIED，不是PASS |
| 完整raw logs | R4/R6 child rows有stdout/stderr/elapsed；S6只有stdout tail/hash且無逐套elapsed | 重用child capture envelope；focused改child isolation並保存raw logs，structured checks另列 |
| Focused timeout | `focusedSuite`目前在parent require(file).run，沒有child timeout | 必要時用已驗證的suite CLI／explicit export invocation隔離；不得漏執行 |
| 簡潔摘要 | 逐套JSON＋finalsummary已具備 | 僅顯示suite／profile／結果／原因／elapsed，raw artifacts另存 |
| Manifest/Git evidence | 成員順序hash、source freezes、WIP hashes、protected metadata與wx已有 | 同時記錄launcher／entry mode、env及actual dependency hashes；綁定baseline objects |
| 再跑 | R6等single-use labels會拒絕既有captures | 重用exports與新run ID；execution前reserve、exclusive write，不再次呼叫舊gates/full main |

Entry-safe launcher需同時保留nested Git buffer相容與main semantics。候選是child preload加原standalone入口，或明列exported main/run呼叫；應在另行授權的最小runner修復中先以main-guard witness與raw log檢查驗證，不能本輪擅改wrapper後重新宣稱舊full PASS。

## I. 建議修復順序 / 最小Scope

1. **Runner可靠性先行。** 限launcher／entry registry及其獨立驗證：解決main guard跳過、nested Git buffer與assertion witness。保留S6/R6原captures、wrapper歷史bytes、全部test assertions與seeds。沒有可信入口，繼續增加Green數不能建立基線。
2. **一次審查剩餘source-freeze契約。** 對五套Save及兩套index clauses逐项確認責任與共同pinned bytes。若人工授權，Save重用R6 exact v1 checker，不擴張Production；index另定exact wiring例外。僅改核准comparison branch及必要專用helper，先保留RED、再完整執行各套main。沒有授權則維持conflict。
3. **精簡VM必要載入。** Opportunity-two最小runtime manifest修復；比對正式owner／index順序，保留原assertions及fixture。不要把詳細SS core owner改成optional或fake。
4. **Match36與gradient分開診斷。** 隔離observer捕捉bool operands／canonical cohort facts；先定位failure責任，再決定最小修復。不得用調assertion或更換seed消除既有Debt。
5. **First-base成對時間調查。** 使用原180秒／400場及相同source roots，事前定義repeat／stop policy；功能與performance verdict分開。
6. **補current inventory的UNVERIFIED。** 依Receiver／Save／SS6-3／third-out／Match closure优先安排targeted，再按審查後固定manifest執行一次full；同原因Debt可記錄繼續，不同原因或unexpected timeout即停。

以上都是後續proposal，未施工。沒有以本輪audit取代人工ownership授權，也没有自動進入修復Sprint。

## J. 收斂條件 / Coverage / Stop

**進入Receiver v2或Match Vertical Slice的Production限時收斂＝NO。** 現在有5個actual failing suites、52個UNVERIFIED、main入口漏執行、尚未授權的Save／index freeze衝突及未關閉timing調查。可作後續限時工作的可信子基線是已驗證Pure／contract及原Legacy／Save bounded fixtures；任何收斂工作須先明列其使用scope與停點，不能藉879 checks宣稱whole-WIP source acceptance。

開始Production convergence前至少需要：entry-safe runner與raw evidence可重現、source-freeze ownership裁決、critical runtime load與Match／gradient failure責任定位、關鍵UNVERIFIED補驗，以及在原政策下可採信的current manifest结果。Receiver v2仍DISABLED；L03、Source Acceptance、CRT、Capability、Ordinary Effort仍PARTIAL。Ready for Sprint10B＝NO；Ready for Commit＝NO。

Discovery依codebase-memory Tier2作symbols search、雙向depth1 traces與snippets，之後核對目前完整bytes及actual captures。[Architecture](test-reliability-audit-v0.1-architecture-evidence.json)、[coverage](test-reliability-audit-v0.1-coverage-evidence.json)保存分頁結果。兩個literal dependency帶leading slash被回報outside_project，已用正確project-relative paths補查；未以錯誤path作完整性結論。Dynamic global calls、main semantics與clipped snippets以磁碟及replay確認。Metadata_changed／no_recorded_issue只是best-effort訊號，不是freshness或完整性保證。

本輪交付完成即停。Production delta＝0、正式test delta＝0，945項原hash保持，原captures全部保留；沒有Full／First-base新invocation、Stage／Commit／Push或後續修復。
