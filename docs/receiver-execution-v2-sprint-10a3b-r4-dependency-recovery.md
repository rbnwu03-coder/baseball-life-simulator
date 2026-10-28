# Receiver Execution v2.2 — Optional Runtime Dependency & Full Regression Recovery / Sprint10A.3b-R4

專案：Baseball Life Simulation（棒球人生）

日期：2026-10-14（Asia/Taipei）

正式基線：`ab3117653945de0b7013636187c446276a96e634`

**BBP-B1 ReferenceError 已修復，原測試20/20及baseline／WIP比對PASS。唯一一次full manifest在第173/227套發現另一項新失敗，已立即停止：169 PASS、3既有Debt同原因重現、1新blocker、54 NOT RUN。Ready for Commit＝NO；Ready for Sprint10B＝NO。** Receiver v2仍DISABLED，L03仍PARTIAL。

## A. Git / WIP Protection

main／HEAD／origin/main為指定Commit，index空。R4開工的825項可讀tracked／WIP／captures全部hash；R3 delivery hashes及既有WIP相符。[Baseline](receiver-execution-v2-sprint-10a3b-r4-baseline-evidence.json)

本輪唯一既有檔案變動為 `script.js`；**824項原有hash保持不變**，包括receiver-source-snapshot.js、Save、Lifecycle、index、所有原test及10A.3b／R1／R2／R3 captures。12項protected paths只核對Git status、size及mtime，沒有讀取、hash、執行、修改或Stage內容；metadata證据不是protected content hash證明。

沒有Reset／Clean／Stash／Stage／Commit／Push。R4所有captures為獨立exclusive-create檔案；較早R4 captures亦保留。[Closeout](receiver-execution-v2-sprint-10a3b-r4-closeout-evidence.json)

## B. Runtime Dependency Root Cause — CONFIRMED

原BBP-B1 `runtimeFiles`不載入TeamRosterFoundation、ReceiverSourceSnapshot、DefensiveOpportunityFoundation或MatchSituationLifecycle。原Legacy fixture會建立有效Match／Roster facts，但source-admission block在 `typeof ReceiverSourceSnapshot` eligibility之前，先執行：

```js
const sourceSs = sourceRoster && TeamRosterFoundation.getCurrentDefender(sourceRoster, "SS");
const sourceFirst = sourceRoster && TeamRosterFoundation.getCurrentDefender(sourceRoster, "1B");
```

R4修改前先以原測試重現 `ReferenceError: TeamRosterFoundation is not defined`，exit1、86.60ms，stack指向原script.js:5337；test bytes與正式基線相同。[RED](receiver-execution-v2-sprint-10a3b-r4-red-evidence.json)

同類型檢查沒有停在單一typeof補丁：另外核對shared validator的truthy format omission分支，以及execution binding對Source／Ground／Lifecycle globals的直接使用。既有physical defense／participant／reach路徑仍保留原canonical roster owner要求；R4沒有把正常詳細SS runtime的必要核心模組改成可任意移除。

對開工時可讀test bytes的literal `runtimeFiles`／`files` arrays進行唯讀掃描，取得**78組包含script.js的固定載入集合，其中64組沒有TeamRosterFoundation，全部78組沒有ReceiverSourceSnapshot**。正常index-derived browser集合另由原helper及Production fixtures驗證。這是明列範圍的掃描，不是所有computed／dynamic VM集合的完整性宣告。[Final dependency audit](receiver-execution-v2-sprint-10a3b-r4-dependency-audit-final-evidence.json)

## C. Dependency / Boundary Matrix

| Runtime／狀態 | Source-only行為／結果 |
|---|---|
| 原BBP-B1精簡runtime，無Source／Roster owner，無新metadata | 維持原Legacy；原20/20及baseline／WIP完整輸出相同 |
| 正常Production，Source＋Roster owner齊備，eligible SS空壘play | 建立原規格Snapshot；使用真實roster actors及原physical／capability facts |
| Source未載入，沒有新source tags | Legacy handoff／execution照原owner進行，不建立admission |
| Source或必要Roster owner缺席，沒有新metadata | Source-only feature不可用；該admission邊界跳過，不建立假的owner或快照 |
| 任一新source tag／pin／binding存在，Source adapter缺失／不完整 | 明確REJECT：`Receiver source snapshot module required` |
| 新metadata存在，Roster owner缺失 | 明確REJECT：`Receiver source roster module required` |
| Binding需要Ground normalization owner／pinned Lifecycle owner而缺席 | 在binding寫入前明確REJECT對應module required |
| Source tag存在但值為undefined／null／false／0／空字串 | absence依own-field判斷；不能以falsy當Historical omission |
| 新版本未知、pin／binding／actor／physical矛盾 | 由原ReceiverSourceSnapshot validator拒絕；沒有關閉validation |
| 真正Historical Legacy omission | 保持原版本相容及no-backfill規則 |
| Closed source archive＋下一play Legacy | 保留R3按完整physical identity驗證archive，不跨play比較binding |

正常Production的Source模組齊備時，helper直接交給**原validator**驗證；依賴不可用時才掃描match、handoff、active、context、execution及closed summary的own metadata。這個順序保留new-format fail-closed，避免正常途徑重複做presence掃描。

R4的「缺少Roster於source邊界」新測試，使用原真實owner建置核心facts，只在source-admission邊界移除global，回到後續必要核心消費者前恢復同一owner；沒有建立fake TeamRosterFoundation。原BBP-B1則驗證整份精簡runtime持續不載入該模組的真實Legacy途徑。

## D. Minimal Source Diff / Original Fact Owners

只修改 `script.js`，淨增17行；`receiver-source-snapshot.js`保留R3 hash：`4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274`。

- 新增 `getHighSchoolReceiverSourceAdapter()`，集中處理adapter／roster availability與new metadata的required boundary。
- Admission roster reads由已驗證的source availability保護，opportunity使用nullable eligibility檢查。
- Shared validator仍執行原validateMatch及roster／raw capability比較；缺少模組時使用own-field拒絕新格式。
- Binding先檢查必要Source／Ground／Lifecycle owners，再由原Legacy cache產生原binding。

| Snapshot資料 | 原owner／facts |
|---|---|
| match／PA／contact／physical／play identity | 原Match、ordinary PA及ground handoff |
| SS thrower／1B receiver | 真實TeamRosterFoundation.getCurrentDefender |
| Thrower capability | 原defensiveAccess.secureCapabilities |
| Receiver capability | 原Roster的defense／speed／arm／contact，有限值否則null |
| Outs／bases／runner obligation | 原Match pre-execution state及batter runner |
| Sample | Admission不取得；只在原Legacy execution產生並綁定 |

沒有依球場結果、成功傳球或future outcome選擇admission；沒有改RNG、能力、正式結算、GameRecord、Evaluation、Save契約、Pure語義或任何原test bytes／fixtures／seeds。[Final source change](receiver-execution-v2-sprint-10a3b-r4-source-change-final-evidence.json)、[final helper](receiver-execution-v2-sprint-10a3b-r4-final-helper-final-evidence.json)

Script before hash：`fe0cbf4b3e8299bc376e8eafbe5f9b9e53537e78ea47fece976e7c7262ab4a1a`

Script final hash：`353adf6db78f57098d655e9ca2067020e4b6bb597c9aacda50c5281b2a65d2e9`

## E. RED / GREEN / Final-source Regression

新focused涵蓋module absent／undefined／null／deleted global、new metadata missing adapter、canonical actors、Unicode長ID、hold nullable receiver／target、same-play tamper、cross-play archive、early return、no early sample、callback／candidate／official-state不變。

新測試建置初期9項失敗屬fixture範圍及mutation問題：6項把正常runtime的必要roster移除至後續核心consumer，3項向immutable owner物件寫入undefined而未成功新增field。只修正R4新測試的邊界隔離及clone-before-mutation，原測試未改。[Development1](receiver-execution-v2-sprint-10a3b-r4-development-focused-1-evidence.json)、[Development2](receiver-execution-v2-sprint-10a3b-r4-development-focused-2-evidence.json)

較早R4 source的相關驗證亦完成，但first-base時間調查後，helper順序修正，**全部必要related gate再次使用final source依授權順序執行**。以下是最後一輪，較早captures沒有被替換：

| 順序 | Final實際結果 | Evidence |
|---|---|---|
| 1. R4 focused | **44/44 PASS** | [focused-final](receiver-execution-v2-sprint-10a3b-r4-focused-final-evidence.json) |
| 2. BBP-B1原測試 | **20/20 PASS** | [BBP green-final](receiver-execution-v2-sprint-10a3b-r4-bbp-green-final-evidence.json) |
| 3. BBP baseline／WIP同條件 | **PASS；兩邊exit0、完整stdout／stderr相同** | [comparison-final](receiver-execution-v2-sprint-10a3b-r4-bbp-comparison-final-evidence.json) |
| 4. R3 Guard focused | **40/40 PASS** | [R3 guard-final](receiver-execution-v2-sprint-10a3b-r4-r3-guard-final-evidence.json) |
| 5. Original gradient | 原 `Low tier can have a multi-hit game` Debt重現；沒有nonJSON例外 | [gradient-final](receiver-execution-v2-sprint-10a3b-r4-gradient-final-evidence.json) |
| 6. Career Save Admission | **45/45 PASS** | [Career Save-final](receiver-execution-v2-sprint-10a3b-r4-career-save-final-evidence.json) |
| 7. Sprint10A.3b／R1 tests | **108/108＋19/19 PASS** | [Production-final](receiver-execution-v2-sprint-10a3b-r4-production-focused-final-evidence.json)、[Save-final](receiver-execution-v2-sprint-10a3b-r4-save-focused-final-evidence.json) |
| 8. Legacy | **25/25 pairs＋3/3 historical PASS** | [Legacy-final](receiver-execution-v2-sprint-10a3b-r4-legacy-final-evidence.json) |
| 9. Related Match／Lifecycle／Runner等 | **17/17 suites PASS**；Career另列 | [related-final](receiver-execution-v2-sprint-10a3b-r4-related-final-evidence.json) |
| 10. v2.2／S8／S9／10A.1／10A.2 contracts | **615/615 PASS**（155＋91＋151＋122＋96） | [compatibility-final](receiver-execution-v2-sprint-10a3b-r4-compatibility-final-evidence.json) |
| S8 schema／cross-runtime | **10 schema rows PASS；Node／jitless／VM及.NET 30rows PASS** | [S8-final](receiver-execution-v2-sprint-10a3b-r4-s8-cross-runtime-final-evidence.json) |
| 11. First-base180 | **42/42 PASS** | [first-base-final](receiver-execution-v2-sprint-10a3b-r4-first-base-current-final-evidence.json) |

主focused清單合計**826/826**（44＋40＋108＋19＋615）；S8 schema準備另再次執行Pure.run的91checks，不把這次重複執行或schema／cross-runtime rows混入主清單總數。Legacy、Career、BBP及first-base亦各自明列。

BBP comparison使用相同Node v24.19.0／executable、direct Node命令、120000ms／16MB及相同環境設定；兩個獨立temporary roots使用原test bytes與原固定runtimeFiles，baseline sources來自正式Commit，WIP sources來自final磁碟。沒有補載module到原test。

Legacy25pairs比較原sample、callback count／order／value、Match RNG、outs／bases／record／Evaluation、cold reload及duplicate；R4 focused另比較Source available／absent的完整official projection與正式baseline。這些是有界non-interference證據；新的full blocker仍使整體WIP驗收不通過。[Final gates](receiver-execution-v2-sprint-10a3b-r4-gates-final-evidence.json)

## F. First-base / Runtime Investigation — Captures全部保留

修復位於shared handoff，重新執行原first-base180政策、16MB、42checks及兩組200場canonical cohorts。沒有減少場數、改fixture／helper或提高時限。

| Run | Source／用途 | Exit／checks | Elapsed |
|---|---|---|---:|
| 初版R4 WIP | script `1783fc…`；原gate，較早capture保留 | 0／42/42 | 123,072.55ms |
| 本輪正式baseline | 指定Commit；新baseline180 | 0／42/42 | 101,026.35ms |
| Final R4 WIP | script `353adf…`；全部gate重跑後 | 0／42/42 | 124,833.72ms |
| 原R3 WIP診斷對照 | R4開工時script `fe0cbf…`＋未變其他R3 owners | 0／42/42 | 117,608.09ms |

各run完整stdout／stderr相同。初版及final R4對正式baseline的耗時差，均超過沿用的調查門檻 `max(10000ms, baseline×20%)`；**兩份runtime-comparison都保留4/5、passed=false，沒有改判PASS**。[初版比較](receiver-execution-v2-sprint-10a3b-r4-first-base-runtime-comparison-evidence.json)、[final比較](receiver-execution-v2-sprint-10a3b-r4-first-base-runtime-comparison-final-evidence.json)、[baseline180](receiver-execution-v2-sprint-10a3b-r4-first-base-baseline180-evidence.json)

原R3 WIP與R4 final在目前環境的差為7,225.63ms（約6.14%），低於同一調查門檻；before／after WIP比較4/4通過，沒有觀測到顯著新增R4 slowdown。[R3 WIP diagnostic](receiver-execution-v2-sprint-10a3b-r4-first-base-r3-wip-diagnostic-final-evidence.json)、[runtime investigation](receiver-execution-v2-sprint-10a3b-r4-runtime-investigation-final-evidence.json)

Full使用原180秒政策的功能驗收與已完成的R4前後調查作為入口；沒有把正式baseline timing差距刪除或當成已修復。單次pair不能證明整體WIP沒有perf差異、不能定位所有耗時差的因果，也不能當作模型改善。Helper順序調整沒有呈現明確elapsed改善，該事實保留。

## G. Full227 — One Invocation / STOPPED at173

在final功能gates及時間調查完成後，唯一一次full於2026-10-14 13:38:58至13:45:21（Asia/Taipei）執行。原227成員／順序／test bytes、Node wrapper、180000ms／30MB全部保留。First-base不在manifest，沒有插入。

完整stdout hash稽核另發現goal-balance的動態aggregate tables與歷史capture不同；該原測試仍PASS，其一般200次模擬沒有注入固定randomSource，captured固定tape的 `LONG_GAME_WITNESS` 則逐字相同。此動態report差異及新pitch-sequence失敗均明列，不宣稱所有full stdout byte parity。[Stdout audit](receiver-execution-v2-sprint-10a3b-r4-stdout-audit-evidence.json)

Manifest `JSON.stringify(files)` SHA-256＝`871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96`。

| 結果 | R4 actual |
|---|---|
| Executed | **173/227** |
| PASS | **169** |
| Existing Debt同原因重現 | **3** |
| New blocker | **1** |
| NOT RUN | **54** |
| Timeout／spawn error | **0** |

BBP-B1在第34套以exit0通過。第173套 `tests/pitch-sequence-state-production-integration-test.js` 在3,693.17ms以exit1失敗：

```text
PASS 1 ...
...
PASS 7 finished persisted copies rebuild identically without a new save authority
AssertionError [ERR_ASSERTION]: save.js
  at tests/pitch-sequence-state-production-integration-test.js:141:17
```

這套formal baseline為exit0，原test hash未變：`22fa869f606737b55548b869fc05d29ef8ef5b49c503d72393ce959c0d24e92c`。Capture保存每套完整actual stdout／stderr、exit、command、policy、elapsed與剩餘清單；Node自己的assertion字串截短也照原stderr保留。[Full capture](receiver-execution-v2-sprint-10a3b-r4-full-repository-final-evidence.json)

即刻停在第173套後，沒有第二次manifest、失敗suite replay、診斷fixture或Source／Save／assertion修復。

## H. New Blocker — Read-only Save Source Freeze Review

Test8標題為 `protected pitch sources retain scoped script freeze and exact repeat eligibility extraction`。它依序比較六個檔案；Save使用normalize-newline後的完整bytes，對照固定commit `a0e512b439446990d8df118e3e7d737b9f2f51d3`，在第141行 `assert.equal(current, baseline, file)` 失敗。

Captured diff指向既有source-only Save envelope及raw validation／normalization變更。`save.js`在R4前後hash相同；formal baseline則與該pinned Save bytes相符。**這是保留WIP首次觀測到的baseline PASS→FAIL source-freeze assertion，不能列為原三項Debt。** R4沒有修改Save，仍不能據此把整體WIP的新失敗忽略。

前7項Sequence ON/OFF、incremental/rebuilt、save/load、RNG／source mutation及NPC unsupported行為檢查已通過；這不推翻第8項失敗。Loop中的最後 `script.js` scoped assertion尚未執行，不能宣稱Test8全部其他檢查完成。

只做actual stderr、test及current／pinned／formal source的唯讀核對，沒有改assertion、更新pinned baseline或宣稱Save freeze conflict已解決。[Blocking evidence](receiver-execution-v2-sprint-10a3b-r4-blocking-regression-evidence.json)、[blocker architecture](receiver-execution-v2-sprint-10a3b-r4-blocker-architecture-evidence.json)

## I. Existing Debt / Failure Set

| 原Debt | R4 full結果 |
|---|---|
| ability-performance-gradient：Low tier can have a multi-hit game | 第1套exit1；primary error與原基線同原因 |
| baseball-match-foundation-2-2-2：36. full match | 第17套exit1；primary error與原基線同原因 |
| high-school-year-one-opportunity-two：DefensiveDecisionThrowFoundation is not defined | 第140套exit1；primary error及buildHighSchoolShortstopExecution owner相符 |
| pitch-sequence-state-production-integration：save.js source freeze | **新增第173套；formal baseline PASS，本輪FAIL** |

本輪三項原Debt均同原因重現，但actual failure集合另外包含新pitch-sequence blocker，且54套未跑。不能宣稱完整224/227或完整failure-set一致。

## J. Coverage / Integrity / Commit Readiness

codebase-memory Tier2使用search、雙向depth1 trace及exact snippets，並核對339個manifest／root／helper／audit paths的coverage（4頁全部取完）；review utility與blocker另核對。Metadata changed／not tracked不當完整性或freshness證明，主要claim均以目前磁碟、原hash及actual captures核對。[Architecture](receiver-execution-v2-sprint-10a3b-r4-architecture-evidence.json)、[coverage](receiver-execution-v2-sprint-10a3b-r4-coverage-evidence.json)

Final Source保持鎖定；Source boundary修復及R3 guard保留，但whole-WIP full未通過。最終source／old captures／protected metadata／index、新檔清單、hash及whitespace見closeout與delivery evidence。沒有因green數量忽略不同失敗原因。

| Final Gate | R4結果 |
|---|---|
| BBP-B1 Root Cause | **CONFIRMED** |
| BBP-B1 Original Test | **PASS，20/20；full member34亦PASS** |
| Optional Runtime Dependency | **PASS，限明列邊界及fixtures** |
| New-format Fail-closed | **PASS** |
| Same-play Tamper | **PASS** |
| Cross-play Legacy | **PASS** |
| Career Save | **PASS，45/45；不代表新的Save byte-freeze blocker已通過** |
| First-base | **PASS，final42/42／180秒政策；timing限制明列** |
| Focused／Legacy | **主focused826/826；Legacy25/25＋3/3** |
| Full Repository | **FAIL／STOPPED，173/227，169PASS＋3Debt＋1新blocker，54未跑** |
| New Regression | **1 observed新的test failure；整體timing差距另列** |
| Receiver v2 | **DISABLED** |
| L03／Source Acceptance／CRT／Capability／Ordinary Effort | **PARTIAL** |
| Sprint10A.3b Production Source-only Integration | **NOT PASS** |
| Ready for Sprint10B | **NO** |
| Ready for Commit | **NO** |

停工結案，保留全部WIP與captures，等待人工審查。沒有開始Sprint10B、11或Defensive Foundation Closeout。
