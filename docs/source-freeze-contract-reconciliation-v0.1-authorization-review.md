# Source Freeze Contract Reconciliation v0.1 — Phase A Authorization Review

專案：Baseball Life Simulation（棒球人生）  
日期：2026-10-14（Asia/Taipei）  
正式基線：`ab3117653945de0b7013636187c446276a96e634`  
安全停點：Test Infrastructure Sprint0.1

**Authorization Review已完成；5個Save分支及2個Index分支均為AUTHORIZED CANDIDATE，尚未取得正式修訂授權。** 五套pinned Save bytes相同，既有R6 v1 checker可接受每套原來源＋同三項delta。兩個pinned index也相同，current僅新增一個metadata adapter script tag。這支持一次有限範圍的Phase B候選，但不代表已授權、Source Freeze Reconciliation PASS或任何Production acceptance。

本輪Production／正式tests／fixtures／seeds／pins／既有evidence delta＝0。沒有正式suite、Full251／R6 Full227、first-base或Receiver Production integration invocation。Receiver v2仍DISABLED，L03仍PARTIAL；Ready for Commit及Sprint10B均為NO。

## A. Baseline / Protection

main／HEAD／origin/main tracking ref均為指定Commit，index空，未fetch。先核對R6、Test Reliability Audit與Entry-Safe delivery，保存**1259個既有可讀檔案SHA-256**。[Baseline](source-freeze-contract-reconciliation-v0.1-baseline-evidence.json)

1259項原hash及原Git WIP status結案相同。12個protected paths只核對status、size／mtime，不讀取、hash、執行或修改內容；metadata證據不是protected content hash證明。全部新capture先拒絕existing target、exclusive-create，沒有overwrite舊證據或以WIP作新正式baseline。[Closeout](source-freeze-contract-reconciliation-v0.1-closeout-evidence.json)

新增本報告、兩個offline evidence utilities及machine-readable review／plan／coverage／integrity資料。Utilities沒有實作新的共用Index checker，也沒有調用正式test main／run。沒有Reset／Clean／Stash／Stage／Commit／Push。

## B. 精確檔名 / Save Authority Matrix

附件的`pitch-tactical-intent-evidence-production-integration-test.js`不符目前磁碟；實際為 **`pitch-tactical-intent-evidence-integration-test.js`**，沒有另建或改名測試。以下均使用真實source與原Git show references。

所有5套pinned Save normalized SHA-256：

`d093c730a4082a05050476a110553204e5234d72596b3cb449423f56566fe592`

Current Save normalized SHA-256：

`9a3a1013cd8451979785f118b1e43fde65d10d71ff507ae8626c771bff3287a7`

Current raw hash仍`7111e2180f93f15fdaa0c402b6fe034240e064c6acff01d0d79bb1755990ebb7`。Normalized使用原tests的CRLF／CR→LF規則。

| 精確Suite | 原pinned Commit | Guard／Save比較 | 同guard其他保護 | 判定 |
|---|---|---|---|---|
| [Tactical Decision](../tests/pitch-tactical-decision-production-integration-test.js) | `ac53bf61964bde4b40501c77e15269bae99b55cc` | Test8，L164–169；Save全檔equality | 7個其他sources；tactical exact extraction、script原scope，其餘full equality | AUTHORIZED CANDIDATE |
| [Tactical Interpretation](../tests/pitch-tactical-interpretation-production-integration-test.js) | `98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7` | Test8，L152–157；同上 | 6個其他sources；tactical exact extraction、script原scope | AUTHORIZED CANDIDATE |
| [Decision Production Adapter](../tests/pitch-tactical-decision-production-adapter-integration-test.js) | `9b9546f94a7286afef474be634fd93c57eb455db` | Test8，L177–183；同上 | 8個其他sources；tactical exact extraction、script原scope | AUTHORIZED CANDIDATE |
| [Tactical Intent Evidence](../tests/pitch-tactical-intent-evidence-integration-test.js) | `2a4b44a034b714b8de3c8a6897507995ab0f8ccd` | **Test10**，L211–217；同上 | 11個其他sources；script原scope；Index與tactical owner仍full equality | AUTHORIZED CANDIDATE |
| [Tactical Signal Projection](../tests/pitch-tactical-signal-projection-production-integration-test.js) | `674e49115a9ed7d67c69a3023b5a594d41fe584c` | **Test14**，L262–268；同上 | 11個其他sources；script原scope；Index與tactical owner仍full equality | AUTHORIZED CANDIDATE |

完整test hashes、原guard snippets、每個source項目與comparison位置見[Source review evidence](source-freeze-contract-reconciliation-v0.1-source-review-evidence.json)。不是全部都在Test8；不將不同檢查scope混為同一個授權。

本輪用原equality／原script及tactical專用helpers作**48個獨立source comparisons：41符合、7不符合**，失敗為5個Save＋2個Index。這些是static comparisons，沒有改變suite verdict。另對5個pinned Save調用**既有**v1 checker做source compatibility診斷，5個都ACCEPT；不是5套正式tests PASS。

## C. 原責任與授權理由

**直接事實：** Decision／Interpretation／Adapter文件將各自層定位為pattern／intent／eligible candidate的pure projection；final production tactical selection仍由PitcherCatcherTacticalIntegration擁有。原source guards保護既有pitch、PA、sequence、Save及script owners；部分已存在經review的exact extraction／script scope例外。

Intent contract明列**DESIGN / CONTRACT / TESTS ONLY**，沒有新增runtime consumer、arbitration、Save schema或index loading。Signal contract則明列SHADOW ONLY、沒有signal-injection連線，其browser convention在test harness驗證，index保持不動。

**依文件與assertion結構的推論：** 兩套Index完整freeze用來證明當時沒有增加runtime加载或consumer；Save完整freeze用來證明該pure／shadow層沒有接管persistence。保護目的仍有效；後續Source metadata owner的新責任應以明列exact例外表示，不能直接取消原保護。

來源：[Decision contract](pitch-tactical-decision-foundation-v0.1.md)、[Interpretation](pitch-tactical-interpretation-foundation-v0.1.md)、[Adapter](pitch-tactical-decision-production-adapter-v0.1.md)、[Intent semantic contract](pitch-tactical-intent-semantic-contract-v0.1.md)、[Signal projection](pitch-tactical-signal-projection-foundation-v0.1.md)。這是有來源的責任解讀，沒有宣稱原作者已授權Receiver修訂每套guard。

每套的candidate理由分別是保留其pattern、vocabulary／repeat admission、temporal／terminal exclusion或typed projection責任，只讓它不再以舊Save全檔bytes否定另一owner已審核的三項責任。相同hash提供compatible before-source，不提供共通的人工作業授權。

## D. R6 Exact Checker可重用性

既有[checker](../tests/receiver-source-save-authorized-delta.cjs)版本`receiver-source-save-owner-delta-v1`，完整raw SHA-256：

`94a2cac6e155c3936ea2cd03f0d31e4e19feba87d53f87c4be5c3cc5aab28b82`

| 檢查 | 直接source證據／本輪結論 |
|---|---|
| 原權威 | pinned normalized hash必須為d093…；每個原anchor只可出現一次 |
| Expected Save | 從原pinned文字套用3個固定before／after fragments，再比較整份current normalized source |
| Pre-write | 原name／pending gate之後，Source分支detached serialize／validate；ordinary保留literal JSON writer |
| Raw guard | normalizeSave在first createInitialPlayer／Object.assign／nested defaults前驗證完整raw object |
| Version | 已經raw guard驗證的Source16保留16，其他沿用SAVE_VERSION15 |
| 未授權範圍 | Load／Delete與原pinned函式完整相同；Career admission、Storage key、exclusive writer及其他Save bytes凍結 |
| Adapter | 另以已review的`4a9e63e…`凍結metadata-only Source module，保守拒絕Storage／RNG／candidate tokens |

沒有current Save hash whitelist，沒有接受任意current函式body。Normalized完整equality使授權patch外的變動仍被拒；line-ending normalization沿用原契約，不擴張文字容忍範圍。Adapter token scan不是通用purity proof；精確freeze及既有runtime fixtures是不同層證據。

R6及Infrastructure實跑的23項exact checker（21個negative subset）、Save boundary30、Legacy25pairs＋3Historical／R1 Save19／R3 Guard40，來源hash保持；本輪只核對及引用，沒有重跑。[Inherited evidence identities](source-freeze-contract-reconciliation-v0.1-phase-b-plan-evidence.json)

**需人工確認的措辭：** 附件「僅Source branch執行detached serialization／validation」不能解讀為刪掉ordinary metadata guard。既有v1的ordinary branch在原literal writer之前亦呼叫`validateRawSave(player)`，防止新metadata在ordinary分支繞過；它沒有detached Source envelope或第二writer。候選應明確保留這一段。若要求ordinary完全不驗證，會改變已批准v1及raw安全邊界，該替代方案＝**NOT AUTHORIZED**。

另一個metadata限制：checker回傳的`pinnedCommit`固定是v1 canonical anchor `a0e512b…`，不是每套實際Git show ref。Phase B evidence必須分開記錄**caller original ref**與contract canonical ref，不得因此改五套原Commit literals。

## E. Index差異 / Dependency與Global Review

兩套原pinned index與formal index的normalized SHA-256相同：

`01a1267379d1732437452e44f1eb49ac49a3a9565ee9f3dda820b906c498d71b`

Current normalized index SHA-256：

`3cc11be5c8a52bba7d22a4faa9f809c27f6130a385dc5fe61258f8d0d1d8f2df`

兩份完整Git diff都只有hunk `@@ -206,6 +206,7 @@`，新增current **L209**：

```html
    <script src="batted-ball-tag-up-execution.js"></script>
    <script src="receiver-source-snapshot.js"></script>
    <script src="match-situation-lifecycle.js"></script>
```

**直接驗證：** 刪去唯一新增的那一行後，全部normalized bytes回到各自原pinned；92個原script tags及其順序／attributes完全保留，current共93個，沒有duplicate src、其他新增module、刪除或重排。DOM、style/link、inline handlers、開發入口及其他index文字皆凍結。不是只有比較script名稱集合。

新tag是classic、unconditional external script，沒有async／defer／type改動。Roster、physical／tactical owners在前；新增API在Lifecycle、Save、script及ApplicationController之前可用。原Interpretation→Decision→Production Adapter及Pitch／Match／Save wiring的相對順序保持；沒有新增signal projector或signal consumer到index。

對current93個載入source作bounded literal review，`ReceiverSourceSnapshot`真正global assignment只有adapter的`root.ReceiverSourceSnapshot = api`；Save／script／Lifecycle是consumers。正確排除`===`判斷，沒有把讀取誤認為第二owner。

另在隔離VM只加载**原Roster及metadata adapter**，新增global只有ReceiverSourceSnapshot、Roster同一object保持、API frozen、runtimeEnabled=false；Storage／candidate getters未被讀取、Math.random trap未觸發。沒有呼叫Save或Match fixture。[Module-load diagnostic](source-freeze-contract-reconciliation-v0.1-source-review-evidence.json)

**推論與限制：** 在目前固定載入集合中，沒有source支持第二Storage owner、重複Source初始化或Global collision；這不是對任意computed assignment或外部browser注入的完整證明。實際full-browser网络／加载lifecycle＝UNVERIFIED。

新增tag會讓既有WIP的Source metadata guards／admission依賴可用，不能宣稱「加载完全沒有行為影響」。可以直接確認的是沒有改舊owner的index wiring、沒有新Pitch consumer、没有启用Receiver v2；whole-WIP gameplay non-interference仍限既有bounded fixtures。

## F. Future Index Checker設計 — 未實作

候選版本`receiver-source-index-wiring-delta-v1`，候選檔名`tests/receiver-source-index-authorized-wiring.cjs`。

1. 驗證傳入的原pinned index normalized hash及原unique adjacent anchor。
2. 只從原pinned source，在tag-up與Lifecycle之間插入上列exact一行。
3. 整份current normalized index必須等於expected；原DOM、attrs、styles、handlers、tags及outside bytes繼續凍結。
4. 要求新tag唯一、original tag序列保留、relative source path及classic synchronous属性不變。
5. 重用R6對metadata adapter的既有freeze／authority檢查，不新批准任何其他module、consumer或runtime开關。

這是設計資料，本輪沒有新增／匯出可供正式tests使用的Index checker。Machine-readable anchor、expected fragment與algorithm見[Phase B plan](source-freeze-contract-reconciliation-v0.1-phase-b-plan-evidence.json)。Current index hash只作observation，不能成為expected authority或whitelist。

Negative候選必須拒絕：duplicate／missing／moved Source tag、舊tag重排／移除／重複、async／defer／type／src／query改動、其他module插入、DOM／style／inline-handler／其他文字變動、wrong pinned authority，以及adapter取得Storage／RNG／candidate或變更reviewed版本。

## G. Entry-Safe Compatibility / 可採信現狀

| Suite | 真正入口 | main guard | CLI Registry | Current完整suite證據 |
|---|---|---|---|---|
| Decision | standalone top-level | 無 | 未加入 | Audit實際FAIL，第8 Save |
| Interpretation | standalone top-level | 無 | 未加入 | UNVERIFIED |
| Adapter integration | standalone main | 有；export的是main，**不是run** | 已加入 | Infrastructure真正FAIL，第8 Save |
| Intent Evidence | standalone main | 有；export main | 未加入 | UNVERIFIED |
| Signal Projection | standalone main | 有；export main | 未加入 | UNVERIFIED |

五套都用同步Node assert／strict，不需要新增custom verify coverage。沒有任何一套需要把exported main誤送到只支援run的child。All five只有一套已在CLI Registry，不能把v1 checker相容當成runner已全面支援。[Entry details](source-freeze-contract-reconciliation-v0.1-source-review-evidence.json)

原source guards的explicit Git buffer均8MiB，保留不變。Historical full per-suite是180000ms／30MB；adapter的有效Infrastructure targeted capture是120000ms／16MB。Phase B候選對五套明列原full個別180秒／30MB並使用entry-safe standalone，不改变其他suite/global policy。

Registry若採CLI需另審核加入4個精確target；也可用經審查的explicit API specs，不猜run／main。Current API只允許`docs/test-infrastructure-sprint-0.1-*.json` capture path；可用全新`phase-b/run-ID` labels並由Phase B報告連結。擴大path allowlist須另明列範圍，不擅改existing runner。

本輪沒有重跑五套；兩個FAIL保持FAIL，三個unknown保持UNVERIFIED。48個static comparisons及5個checker診斷都不能推翻這些狀態。

## H. Cross-Contract Safety / 每套候選

Save exception保留原唯一writer／raw input順序，Index exception只准載入同一凍結metadata adapter；兩者互相補足availability，沒有共用第二Admission／Storage／Pitch authority。

**必须保持不變：** 全部behavior tests、fixture／seed／原pinned literals、Sequence ON/OFF、incremental／rebuild、RNG／source／GameRecord non-interference、reload／persistence、NPC unsupported、terminal PA隔離、Production final selection、其他source guards及原script scope、Save Historical／same-play／cross-play guard、Legacy Receiver／SS6-3 owner。每套完整other-source清單都在JSON，而非只檢查Save第一個fail。

| Suite／衝突位置 | Phase B精確候選 | Additional negatives | 主要risk／授權 |
|---|---|---|---|
| Decision Test8 L164–169 | 加Save專用else-if；保留tactical extraction及script scope | 原pin、raw／writer／version、其他guard mutation | 新checker不可替代behavior Tests1–7、9–12；AUTHORIZED CANDIDATE |
| Interpretation Test8 L152–157 | 同一Save分支；其他7-source loop規則保留 | 同上 | 整套尚UNVERIFIED，修guard不保證behavior Green；AUTHORIZED CANDIDATE |
| Adapter Test8 L177–183 | 同一Save分支；保持main／11項行為 | Same pin、raw／writer、selector／script guard | 禁止再次require-only skipped main；AUTHORIZED CANDIDATE |
| Intent Test10 L211–217 | Save分支＋future exact Index分支，其餘12-source loop不變 | Save negatives＋所有Index negatives | 不得變成semantic signal consumer、排除terminal guard；AUTHORIZED CANDIDATE |
| Signal Test14 L262–268 | 同上；Typed／liveness／projection behavior保持 | Save＋Index negatives、其他owners mutation | Coverage gap及整套unknown不可改成Green；AUTHORIZED CANDIDATE |

完整逐套原Commit/hash、original clause、候選replacement literal、preserved protections、risk及authorization status見[per-suite plan](source-freeze-contract-reconciliation-v0.1-phase-b-plan-evidence.json)。所有`formalRevisionPermissionReceived=false`。

**NEEDS REVIEW：** ordinary pre-write措辭的人工確認、Phase B具體registry／capture規格、未跑三套的behavior及full-browser loading。這些不以static一致性宣稱已解決。

**NOT AUTHORIZED alternatives：** current Save／index整檔whitelist、移除freeze、更新pins、任意新增module／改old load order、删ordinary metadata guard、改behavior assertions／fixtures／seeds、啟用Receiver v2或新增Pitch consumer。沒有實作任何替代方案。

## I. 一次性Phase B最小範圍 / Stops

建議人工一次審查**5個Save比較分支＋2個Index比較分支**，而非逐個被full發現後追加例外；每套caller scope仍獨立。

候選修改清單僅：上述5個正式suite的精確comparison branches、1個new Index checker、必要的獨立contract mutation test與至多4個reviewed runner registry entries／Phase B explicit orchestrator。既有Save checker、Production、其他source helpers、fixtures／seeds／pins及原runtime behavior不改。

候選Save分支調用既有`assertReceiverSourceSaveAuthorizedDelta(current, baseline, actualAdapterText)`；Intent／Signal另調用future Index exact checker。`baseline`仍是**該suite原Git show來源**，不是current WIP，也不改成R6 canonical Commit。

授權後才依序：固定原suite／helper hashes與exact allowed edits → 保留5套original RED／UNVERIFIED真實entry證據 → 新Index／caller guard negative mutations → 逐項接入核准branches → reverse exact branches還原原suite bytes，確認所有behavior／其他guards／pins未變 → entry-safe完整五套驗證 → 核對Save raw／Historical及Legacy bounded證據是否仍適用。Full／first-base或后续Gameplay acceptance必须另有scope，不自動啟動。

Negative gate除原R6 21拒絕情形外，應驗證每套分支不能掩蓋wrong caller ref、original other-source mismatch、extra branch／hook，以及上述Index9類mutation；不能以全部使用同一helper就減少caller protection。

發現baseline/hash差異、不同原authority、額外Index delta、無assertion evidence、helper放行未授权變動、different/new runtime failure或unexpected timeout時立即停、保存完整capture；不順手修Source、fixture、Match36、Gradient或Opportunity-two。

## J. 證據層級 / 完成與停止

直接驗證：1259項baseline與舊delivery、五套原refs/hashes／guards、48項original comparisons、既有checker5個compatible inputs、Index完整diff／原tag序列及sole insertion、93-script bounded references、兩module隔離load probe、runner原registry與entry facts。

結構推論：freeze的歷史scope意圖、共同old authority可支持有限exact exception、目前固定browser集合沒有第二owner／collision。推論有明列範圍，不冒稱作者已批准或任意runtime完整證明。

待人工授權：正式5-suite／2-index revision、future Index checker／mutation tests、所需runner registry／Phase B orchestration。Current unresolvedsuite及browser结果全部UNVERIFIED；Phase B invocation＝0。

Codebase-memory Tier2 search／雙向depth1 trace／snippets後以完整current bytes及actual captures查證；dynamic Save adapter calls在graph未完整解析，不能以單一caller trace否認Save入口。[Architecture／coverage](source-freeze-contract-reconciliation-v0.1-architecture-coverage-evidence.json)。Coverage metadata不是freshness／完整性保證。

**只宣告Authorization Review完成。** 不宣告Source Freeze Reconciliation PASS、Full Repository PASS、Receiver Production Acceptance PASS或Commit/Sprint10B readiness。Receiver v2＝DISABLED，L03＝PARTIAL。報告交付後停止，等待人工審查，不進入Phase B。
