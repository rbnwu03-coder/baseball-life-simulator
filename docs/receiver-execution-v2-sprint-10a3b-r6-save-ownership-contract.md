# Receiver Execution v2.2 — Save Ownership Contract Revision & Exact Source Freeze Exception / Sprint10A.3b-R6

專案：Baseball Life Simulation（棒球人生）

日期：2026-10-14（Asia/Taipei）

正式基線：`ab3117653945de0b7013636187c446276a96e634`

**本輪授權的 Save ownership delta／exact checker PASS，Pitch Sequence 真正8/8 PASS。唯一一次 full227 在第178套發現另一個原 PASS→WIP FAIL，立即停止：174 PASS、3項原Debt同原因重現、1新blocker、49 NOT RUN。Ready for Commit＝NO；Ready for Sprint10B＝NO。** Production delta＝0；唯一既有檔案變動是 Pitch Sequence 第8項新增一個 save.js 比較分支。Receiver v2仍DISABLED，L03仍PARTIAL。

## A. 人工授權 / Git / WIP Protection

R6人工架構授權允許原Save owner承擔Source-only pre-write／raw guard／Save16 responsibility，並允許**只修訂 `tests/pitch-sequence-state-production-integration-test.js` 第8項對save.js的比較及必要專用helper**。不涵蓋其他正式測試、pinned Commit變更、Production物理／RNG／Record／Evaluation或Receiver v2 execution。

main／HEAD／origin/main均為正式基線，index空。開工保存 **904項**可讀tracked／WIP／captures SHA-256，核對R5 delivery及原889項WIP全部相符。[R6 baseline](receiver-execution-v2-sprint-10a3b-r6-baseline-evidence.json)

結案 **903項原hash不變**，唯一變動為授權的Pitch test。Save／Player／script／Snapshot／Lifecycle／index及所有既有fixtures、seeds、其他tests、10A.3b／R1–R5 captures保持開工bytes。12項protected WIP僅核對Git status、size／mtime，沒有讀取、hash、執行、修改或Stage內容；這不是protected content hash證明。

新增R6 runner／focused tests／獨立review utility及[專用checker](../tests/receiver-source-save-authorized-delta.cjs)，所有新captures先拒絕existing target，再exclusive-create。沒有Reset／Clean／Stash／Stage／Commit／Push。[Closeout](receiver-execution-v2-sprint-10a3b-r6-closeout-evidence.json)

## B. Pinned vs Current Save Ownership Matrix

Save原始權威仍是 `a0e512b439446990d8df118e3e7d737b9f2f51d3`。其完整normalized source SHA-256＝`d093c730a4082a05050476a110553204e5234d72596b3cb449423f56566fe592`，與formal Save相同。

| Owner／責任 | Original pinned | 逐項審核的保留WIP／R6 verdict |
|---|---|---|
| SAVE_KEY、name／pending gate | 原key及gate | 完全凍結；PASS |
| saveGame writer | 原Player literal JSON writer | 原owner的exclusive Source／ordinary branches；Source detached serialize先驗證，ordinary先raw validate再原literal writer；PASS |
| normalizeSave raw entrance | first defaults／merge之前沒有Source委派 | 原函式入口先validateRawSave完整saved operand；其後原defaults、merge及nested流程凍結；PASS |
| Save version | 原SAVE_VERSION15 | 已驗證Source16保留16，其餘沿用15；PASS |
| loadGame | parse→normalize→Career admission→commit | 完整函式保持pinned bytes；PASS |
| deleteSave及其他非授權區域 | 原Save owner流程 | 整份其餘normalized bytes保持pinned；PASS |
| Source adapter | 原baseline不存在 | 保留經審核R3 metadata-only adapter；無Storage writer、RNG或candidate consumer；PASS，限該凍結版本及有界fixtures |

現有Save相對formal為17行新增、2行移除。**更正R5的hunk用語：這是3項語義patch；`git diff --unified=3` 實際顯示2個Git hunks，前兩項相鄰修改被合併。** 本輪以每項責任及原source完整差異作審核，沒有將行數或舊「3 hunks」自動當批准。舊R5報告／captures未改。

Current Save raw SHA-256仍為 `7111e2180f93f15fdaa0c402b6fe034240e064c6acff01d0d79bb1755990ebb7`；Snapshot仍為 `4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274`。**沒有Production施工。**

## C. Save Ownership Authorized Delta Contract — v1

契約版本：`receiver-source-save-owner-delta-v1`。在修改Pitch test及正式gates前，已將三項責任、exact before／after fragments、pinned hash、Save diff、adapter hash與verdict固定到獨立capture。[Authorized contract](receiver-execution-v2-sprint-10a3b-r6-authorized-delta-contract-evidence.json)

| Exact patch | 原anchor／control-flow位置 | 唯一核准responsibility |
|---|---|---|
| pre-write | pinned saveGame唯一literal writer，原name／pending gate之後 | Source branch在setItem operand求值時先detached serialize／validate；ordinary branch保留原JSON.stringify(player) writer |
| raw guard | normalizeSave的sourceSaveVersion讀取之後、first createInitialPlayer之前 | 完整raw object驗證；任何defaults／merge／nested normalization尚未開始，直接normalizeSave及loadGame共用 |
| version | 原 `fresh.saveVersion = SAVE_VERSION` 的唯一位置 | 只有已驗證16保留16，Legacy／Historical15不變 |

raw validation仍交給原ReceiverSourceSnapshot的format／version／snapshot／pin／binding與Legacy cache guard。Save owner沒有重新產生Pin、重抽Canonical Throw、補造Historical metadata或新增第二Admission／Storage authority。Source-only persisted execution仍是**原Legacy cache**，不能宣稱Receiver v2 executed／settled Save已完成。

## D. Exact Save Source Checker Specification

新的checker有兩層：

1. 驗證輸入pinned完整normalized source hash，要求每個原anchor僅出現一次，從**原pinned source**套用三項事前審核patch。將整份current Save與這份expected source做完整equality。新增writer、extra hook、未授權函式修改、移位、缺guard、任意version migration，甚至非核准文字修改都不放行。不是整份current WIP Save hash whitelist。
2. 明列control-flow檢查：原SAVE_KEY／name／pending gate、serializer在write operand中、raw guard在first defaults及merge之前、loadGame／deleteSave與原函式相同。對adapter另做保守Storage／RNG／candidate token拒絕、syntax檢查、已審核adapter完整SHA凍結與future-version／raw-serialization invariants；實際non-interference另由功能fixtures驗證。Token scan不是通用JavaScript purity proof，精確adapter freeze防止未執行分支或computed code任意擴張。

Pitch test唯一新增一行 `else if (file === 'save.js')`，呼叫專用checker。Test1–7、Test8其他五個比較、固定Commit、fixture／seed、script scoped helper及其original protections均未改。移除這一行後，整份test還原原source；原file與current均為LF，沒有其他行尾轉換。

| Test8 source | R6使用的保護／actual result |
|---|---|
| pitch-observation-foundation.js | 原完整equality；PASS |
| offensive-plate-approach.js | 原完整equality；PASS |
| pitcher-catcher-tactical-integration.js | 原exact repeat extraction checker；PASS |
| pitch-sequencing.js | 原完整equality；PASS |
| save.js | 新v1 exact original＋authorized delta checker；PASS |
| script.js | 未改的原95-functions／constants／external wiring scoped checker；PASS |

R5歷史的全檔Save freeze RED仍保留，不將其改成PASS。R6是已授權的新責任例外驗收。

## E. Negative Mutation / Independent Review

[R6 exact focused](receiver-execution-v2-sprint-10a3b-r6-exact-focused-evidence.json) **23/23 PASS**，其中 **21/21 negative PASS**（預期拒絕）。Save mutation先確認改動存在且仍為合法JS，再要求exact拒絕，避免以syntax error充當成功。

必要八項均實證拒絕：移除raw guard、移到defaults／merge之後、移除pre-write validation／serialization、改Legacy writer、改SAVE_KEY、unknown version fallback、改非授權Save函式、第二Storage writer。其他負向包含Source16 downgrade、移除adapter-missing拒絕、跳過Career admission、提前commit、hidden hook、adapter新增Storage／RNG／candidate、未審核adapter branch及原pinned authority變更。

正式full之前另用[獨立review utility](../tests/receiver-execution-v2-sprint-10a3b-r6-independent-review.cjs)做反向算法：從current Save逐項移除**已先固定capture**的三個delta，再比較全部剩餘bytes與original pinned；也從current Pitch移除唯一Save branch，再比較整份原test。它不使用checker的expected-source builder。[Independent review](receiver-execution-v2-sprint-10a3b-r6-independent-review-evidence.json) PASS，並核對direct raw runtime tests、合法header遭竄改的before-default拒絕、adapter無第二writer、其他helpers與Production hashes不變。

這是同一agent中的獨立算法審核，沒有宣称另一個agent或人工review。Full後只核對相同frozen hashes，沒有重跑或再修測試。

## F. Raw Save / Historical / Tamper / Non-interference

[R6 Save boundary](receiver-execution-v2-sprint-10a3b-r6-save-boundary-evidence.json) **30/30 PASS**，與exact23合為本輪新增 **53/53**。它使用原harness／real owners，沒有新Production fixture、fake Roster、Save manager或Production monkey patch；observer／trap僅在隔離test VM。

| 實際驗證 | Scope／結果 |
|---|---|
| Source16 pending／executed／settled | direct normalizeSave＋loadGame共6checks；root16及source format保留，raw／live／RNG／writer／candidate不變 |
| Missing header／match format／pin／executed binding | direct與Load各驗；缺失在defaults／merge前拒絕 |
| Legitimate header tamper／future17 | direct與Load各驗；guard拒絕，defaults calls＝0 |
| Physical／actor／sample tamper | direct與Load各驗；未替換live Player，沒有writer或candidate calls |
| New Source16缺adapter | direct及Load拒絕，defaults calls＝0 |
| Ordinary Legacy15無adapter | 原literal JSON writer exactly once，完整official state保持 |
| Genuine Historical pending／executed／settled | raw由formal owner產生，3checks保持15、no backfill、official projection相同 |

Load負向cases不僅檢查Player未變，另捕捉**實際guard error**，確認在正常loadGame raw path拒絕，沒有以silent early return當PASS。Witness保存error／defaults／writes／commit，不dump整份Match。

本輪另實跑R1 Save19、Production Source108、R3 Guard40、R4 Dependency44及Legacy25pairs＋3historical。這些覆蓋duplicate Save／submit、cold reload、same-play tamper、cross-play archive、Source absent Legacy／new-metadata fail-closed、early-return guard、callback count／order／value、owned sample、Match RNG、Out／GameRecord／Evaluation及candidate trap。是原owner的有界fixtures證據，不是所有任意輸入的安全或正式v2執行保證。

## G. Final-source Regression Order / Actual Counts

開跑後Production、修訂Pitch、checker及新focused tests鎖定相同hash，gate間沒有再施工。Development capture53/53保留，正式結果另存，不混入總數。[Final gates](receiver-execution-v2-sprint-10a3b-r6-gates-evidence.json)

| 順序 | 本輪實跑 | Evidence |
|---|---|---|
| 1. R6 checker／boundary | **23/23＋30/30**；negative21為23的subset | [exact](receiver-execution-v2-sprint-10a3b-r6-exact-focused-evidence.json)、[boundary](receiver-execution-v2-sprint-10a3b-r6-save-boundary-evidence.json) |
| 2. Pitch Sequence全套 | **8/8 PASS**；只修訂Test8 Save comparison | [Pitch8](receiver-execution-v2-sprint-10a3b-r6-pitch-green-evidence.json) |
| 3. Career Save Admission | **45/45 PASS** | [Career](receiver-execution-v2-sprint-10a3b-r6-career-save-evidence.json) |
| 4. 10A.3b／R1／R3／R4 focused | **108＋19＋40＋44＝211/211** | [Production](receiver-execution-v2-sprint-10a3b-r6-production-focused-evidence.json)、[R1](receiver-execution-v2-sprint-10a3b-r6-r1-save-focused-evidence.json)、[R3](receiver-execution-v2-sprint-10a3b-r6-r3-guard-evidence.json)、[R4](receiver-execution-v2-sprint-10a3b-r6-r4-dependency-evidence.json) |
| 5. v2.2／S8／S9／10A.1／10A.2 | **615/615**（155＋91＋151＋122＋96） | [Compatibility](receiver-execution-v2-sprint-10a3b-r6-compatibility-evidence.json) |
| S8 schema／cross-runtime | **10 schema rows、Node／jitless／VM及.NET 30rows PASS** | [S8](receiver-execution-v2-sprint-10a3b-r6-s8-cross-runtime-evidence.json) |
| 6. Legacy | **25/25 pairs＋3/3 genuine Historical** | [Legacy](receiver-execution-v2-sprint-10a3b-r6-legacy-evidence.json) |
| 7. BBP-B1 original | **20/20 PASS**；full member34亦PASS | [BBP](receiver-execution-v2-sprint-10a3b-r6-bbp-evidence.json) |
| 8. Match／Lifecycle／Save／Runner等 | **17/17 suites PASS**，Career另列 | [Related](receiver-execution-v2-sprint-10a3b-r6-related-evidence.json) |
| 9. First-base180 | **42/42 PASS** | [First-base](receiver-execution-v2-sprint-10a3b-r6-first-base-current-evidence.json) |

主focused＝**879/879**（23＋30＋108＋19＋40＋44＋615），不是沿用R4 826。Pure為schema準備再次實跑91checks，與schema／cross-runtime rows另列，不重複加入879。Legacy、Historical、Career、Pitch、BBP及first-base也各自明列，不混用suite／pair／check。

Pitch門檻中前7項保留原Sequence ON／OFF、browser/CommonJS、incremental／rebuilt、live reload、no RNG／source mutation、NPC unsupported及persisted copies assertions。全套8/8及full member173均PASS；完整stdout SHA與formal歷史capture也相同，沒有以新版checker的pass數取代原行為驗證。

## H. First-base180 / Timing Limitations

原direct Node command、180000ms／16000000-byte buffer、42checks、兩組200場canonical cohorts及原helper／test bytes保留。本輪WIP exit0，耗時 **131374.29ms**，完整stdout／stderr與R4 formal baseline180及R4 final WIP相同；沒有新baseline invocation。

| 比較 | Reference elapsed | R6 delta | 原threshold／結果 |
|---|---:|---:|---|
| R4 formal baseline180 | 101026.35ms | +30347.94ms | 20205.27ms；**超過門檻，不當timing PASS** |
| R4 final WIP，完全相同Production bytes | 124833.72ms | +6540.58ms（約5.24%） | 24966.74ms；未超過 |

[Runtime comparison](receiver-execution-v2-sprint-10a3b-r6-runtime-comparison-evidence.json)保留兩個actual verdict。Full入口使用180秒功能PASS、未變Production及先前R4調查／本輪相同WIP比較；沒有刪除對formal timing差距。Single inherited pair不是統計／跨環境效能證明，也不能定位所有差距的因果或宣稱模型改善。

## I. Full227 — One Invocation / STOPPED at178

原227成員／順序、Git-show wrapper、180000ms／30000000-byte buffer保留，沒有protected member，first-base仍獨立而未插入。Manifest SHA-256＝`871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96`。[Manifest policy](receiver-execution-v2-sprint-10a3b-r6-manifest-policy-evidence.json)

227個test只有Pitch的授權branch不同，其餘226bytes與開工hash相同；三項Debt test內容未改。唯一full於 **2026-10-14 14:45:40–14:51:48（Asia/Taipei）** 執行。

| Actual結果 | 數量 |
|---|---:|
| Executed | **178/227** |
| PASS | **174** |
| Existing Debt同原因 | **3** |
| 新baseline PASS→WIP FAIL | **1** |
| NOT RUN | **49** |
| Timeout／spawn error | **0** |

[Full capture](receiver-execution-v2-sprint-10a3b-r6-full-repository-evidence.json)保存每套actual command／policy／exit／完整stdout／stderr／elapsed及未跑清單。沒有第二full invocation或失敗suite replay；不能回報224/227或完整failure-set一致。

Stdout hash audit僅有goal-balance一般unseeded aggregate tables及新失敗suite不同；goal仍PASS，其固定tape `LONG_GAME_WITNESS`逐字相同，Pitch Sequence stdout亦與baseline相同。沒有全full stdout parity宣稱。[Stdout audit](receiver-execution-v2-sprint-10a3b-r6-stdout-audit-evidence.json)、[confirmation](receiver-execution-v2-sprint-10a3b-r6-stdout-audit-confirmation-evidence.json)。補充stdout-witness capture有一項未查證separator label誤填，confirmation明確更正；actual strings／原audit皆為`=`且相同，舊capture沒有覆寫，failures數量不受影響。

## J. New Blocker / Read-only Scope Review

第178項 `tests/pitch-tactical-decision-production-integration-test.js` 耗時 **4144.18ms**、exit1、無timeout：

```text
AssertionError [ERR_ASSERTION]: save.js
```

這個原測試的Test8仍對Save完整normalized source比較，pinned Commit為 `ac53bf61964bde4b40501c77e15269bae99b55cc`。該pinned Save與formal及R6 Save權威的原bytes相同，WIP保留Source-only三項delta，所以assertion失敗。Test hash＝`ee6c443aad8093e3f3d14802779eda6a05b50297638ee32657febc1040c0de82`，與baseline／開工完全相同，formal exit0。

Captured stdout前7项PASS（Decision ON／OFF、RNG、Sequence／Interpretation mutations、reload等），但Test8 Save FAIL後其script comparison未到達，Tests9–12也未執行。不能推論該完整12項或其餘source comparisons都PASS。

這是另一套original PASS test的首次觀測source-freeze conflict，**不是原三項Debt**。R6沒有Production delta、已修第173套，仍不能忽略這個新failure。人工授權限於Pitch Sequence第8項；本輪沒有將checker接到第178套、修改其assertion／pinned Commit／fixture或再修Save。[Blocking evidence](receiver-execution-v2-sprint-10a3b-r6-blocking-regression-evidence.json)、[blocker architecture](receiver-execution-v2-sprint-10a3b-r6-blocker-architecture-evidence.json)

後續需人工審查其他仍保有Save全檔freeze的契約是否也應採用已核准的exact responsibility boundary，以及各自pinned來源是否相同；這是另行授權範圍。本輪沒有擴張修訂或重啟manifest。

## K. Failure Set / Safety / Final Assessment

| Failure | R6 full actual |
|---|---|
| gradient：Low tier can have a multi-hit game | 第1套；原reason重現 |
| baseball-match-foundation-2-2-2：36. full match | 第17套；原reason重現 |
| high-school-year-one-opportunity-two：DefensiveDecisionThrowFoundation | 第140套；原reason及buildHighSchoolShortstopExecution owner重現 |
| pitch-tactical-decision-production-integration：save.js freeze | **第178套；新baseline PASS→FAIL** |

codebase-memory Tier2 search／雙向depth1 traces／snippets後核對磁碟及actual captures。349個manifest／browser／helper／authority paths分4批coverage全部返回；沒有未取完頁面。Dynamic adapter calls、anonymous Test8 source-equality relation及clipped snippets用完整source／captured stderr驗證；metadata_changed／no_recorded_issue不當freshness／完整性保證。[Architecture](receiver-execution-v2-sprint-10a3b-r6-architecture-evidence.json)、[coverage](receiver-execution-v2-sprint-10a3b-r6-coverage-evidence.json)

| Final Gate | R6結果 |
|---|---|
| Save Ownership Authorized Delta | **PASS，三項責任逐項審核** |
| Exact Source Freeze Checker | **PASS，限此次授權邊界與version1** |
| Negative Mutation Tests | **21/21 PASS，為exact23的subset** |
| Pitch Sequence | **8/8 PASS；full member173亦PASS** |
| Raw Guard Reachability | **PASS，限current Source16 direct／Load／pre-write fixtures及原owner結構** |
| Historical Save Compatibility | **PASS；R6 boundary3 phases及Legacy3/3實跑，不backfill** |
| Career Save | **45/45 PASS** |
| BBP-B1 | **20/20 PASS；full member34 PASS** |
| First-base180 | **42/42 PASS；formal timing比較超過門檻仍明列** |
| Focused／Legacy | **879/879；25/25 pairs＋3/3 historical**，其他units另列 |
| Full Repository | **FAIL／STOPPED，178/227；174PASS＋3Debt＋1new，49 NOT RUN** |
| New Production Regression | **1 observed新test failure；本輪Production delta＝0** |
| Receiver v2 | **DISABLED** |
| L03／Production Source Acceptance／CRT／Capability／Ordinary Effort | **PARTIAL** |
| Sprint10A.3b Production Source-only Integration | **NOT PASS，另有未授權修訂的full blocker** |
| Ready for Sprint10B | **NO** |
| Ready for Commit | **NO** |

完成停工交付，保留授權修訂、全部WIP及captures，等待人工審查。沒有開始Sprint10B、11或Defensive Foundation Closeout，也沒有Stage／Commit／Push。
