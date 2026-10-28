# 《棒球人生》SS Strategic Scenario Fixture & PA Ledger Integration v0.1

任務：Bounded Test-Only Fixture Construction & Defensive Decision Proof  
日期：2026-10-15（Asia/Taipei）  
Git參考基線：`ab3117653945de0b7013636187c446276a96e634`

**唯一Scenario與一次必要replay完成：A — Meaningful Admitted。** 兩筆明示Setup PA經正式state／evidence／event／batting-order owners建立1出局、一壘有合法runner；下一個正式PA的受控滾地球由owner綁定玩家SS。正式gate產生4個legal routes、3個meaningful choices、high tension，density允許，public resolver接受first-legal傳一壘並完成一次出局。

兩次均 **136 ticks自然完賽，home1／away7**；完整setup、target、Record／Log／decision sequence及final player相同。本輪取得**限定本fixture與選取路線的Controlled SS Match Integration Proof**；不是Natural Production Proof，也沒有執行另外兩條攻擊路線來要求雙殺成功。

本輪 **27個diagnostic checks**（13＋14）與 **65個既有正式checks**（26＋26＋13）分開計算，全部PASS；合計4771個成功Node assertion calls。Production／既有tests／fixtures／seeds／pins／runner／registry delta＝0，1823個既有可讀檔案hashes全不變。**受控SS 6-3資料契約技術前置條件＝YES，待人工審查；UI施工未開始。Ready for Commit／Sprint10B＝NO；Receiver v2＝DISABLED。**

## 1. Baseline／WIP與執行前保護

開工branch=main，HEAD／main／origin/main tracking ref均為指定基線，index空。先核對前輪1800個hash、22個delivery entries及delivery自身，建立 **1823個既有可讀檔案SHA-256** 清單。Snapshot四檔修復、全部WIP與先前captures原樣保留；未fetch或重查遠端server。[Baseline](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-baseline-evidence.json)

在讀取工具來源前先保存明確[Bootstrap whitelist](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-bootstrap-whitelist-evidence.json)，其後明列[Source whitelist](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-whitelist-evidence.json)、[Node source roots](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-node-source-whitelist-evidence.json)與[Runtime dependency whitelist](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-execution-read-whitelist-evidence.json)。遞迴code範圍為23個Node來源、92個current-index VM modules及明列builtins；19條literal require關係已查明，沒有執行時放行未知source。

VM不提供module／require，UMD的CommonJS fallback未啟用；application-controller UI boot排除。正式回歸的共同career context及CommonJS Ground／Record遞迴來源均事先列入。12個protected paths排除內容，只核對status／size／mtime；metadata相同不是content hash證明。

五份前置報告已讀取。採codebase-memory Tier2作本次owner邊界查證；graph仍為2026-10-15T01:30:19Z，Snapshot後部分座標已舊。本輪11個material current function regions逐行／hash核對，runtime source另保存hash；不將graph metadata_changed當完整性證明，也未重做架構audit。[前置來源](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-prerequisite-source-evidence.json)、[Current source](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-source-evidence.json)、[Focused graph](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-focused-graph-evidence.json)、[Coverage](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-coverage-evidence.json)

## 2. 唯一Fixture與事前固定Plan

首次gameplay前exclusive-create [Fixture input](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-fixture-input-evidence.json)與[Plan](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-plan-evidence.json)。同一Reachable完整pre-Match fixture未改：Player、原校／對手、SS、step5、traits／其餘能力與metadata保持原資料；catching／reaction／range／throwing／armStrength五欄raw12仍是明示測試能力，不宣稱自然成長履歷。

| 固定輸入／authority | 本輪 |
|---|---|
| Scenario | `ss-strategic-pa-ledger-v0.1`；只首次及一次必要replay |
| 正式Current入口 | high_school_showcase → 無identity參數的prepareCurrentHighSchoolYearOneMatch() |
| owner Match id | hs-y1-autumn-exhibition；不供應Opportunity、不裝starter旗標 |
| Seed | 2884315748；同pending seed hook由正式owner消費並清0 |
| Actual admission | 正式PlayingTime score64／start；actual SS=player、lineup第9棒，非metadata代替上場 |
| Physical rolls | contactQuality .65、ballType .1、pace .68、direction .05、depth0 |
| 政策 | 進攻secure／zone；守備first native legal；public randomSource .72；safety1400 |
| 新增控制 | 唯一兩筆setup facts：strikeout → walk；明列isolatedScenarioSetupFixture |

最終執行program SHA-256為`bbe1ba2b83bfcd06a693ad106a9e8189a2f0fe610e521f8fdac8628c5aa7cb62`。Plan保存全文與builder／adapter／observer／proof等hashes；執行後沒有改program、能力、rolls、seed、政策或assertions。`program.json`是gameplay前的draft，實際僅執行[program-final](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-program-final-evidence.json)。前置只有語法／dependency檢查，0場Match prepare／0次gameplay。

## 3. 隔離Builder與合法Setup Window

[Builder](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-builder.cjs)只存在docs測試環境，沒有安裝正式路由。由既有playback及public進攻選擇，實際到達 **4局上0out、空壘、home0／away1，moment_1_resolved**。Current reference／id／Event一致，玩家已正式SS先發，對手away攻／home守；沒有pending lifecycle、未套用PA或尚待處理的presentation工作。

Builder不直接寫Match的inning／half／outs／runners／scores／phase／lineup／binding。每筆只依次呼叫：

1. `applyHighSchoolSimulatedPlateAppearance(match,result,batterId,offenseTeam)`：原third-out／base owner更新state並回runner facts。
2. `recordHighSchoolMatchPlateAppearanceEvidence(match,batterId,result,0)`：原PA evidence。
3. `recordHighSchoolMatchSimulationEvent(match,event)`：產生sequence／snapshot／Log並由原bridge交Game Record。
4. `advanceHighSchoolMatchBattingOrder(match,offenseTeam)`：正式下一棒。

Event的outcomeAuthority為`isolatedScenarioSetupFixture`、resolutionMode為declaredSetupFixture；真實owner的inputs／outputs、完整before Player／Match及after Match均保存在兩筆ledger row。沒有假稱AI輸出、沒有直接填Record統計，也沒有在失敗後補造歷史。[首次完整facts](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-candidate-first-facts-evidence.json)、[精簡Findings](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json)

## 4. 兩筆Setup PA與Strict Prefix Validation

兩筆identity為`ss-strategic-pa-ledger-v0.1|hs-y1-autumn-exhibition|setup-1／setup-2`。球員編號不等於打序，實際正式打序為 **player-07 → player-04 → player-09**，away index8→0→1。

| Ledger | Strikeout：seq45 | Walk：seq46 |
|---|---|---|
| 真實batter | regional-power-school-player-07 | regional-power-school-player-04 |
| before | 4上0out、空壘、0：1 | 4上1out、空壘、0：1 |
| 正式after | 1out、空壘、0：1 | 1out、player-04在一壘、二三壘空、0：1 |
| 下一棒 | player-04 | player-09；與一壘runner不同 |
| batter統計增量 | PA＋1／AB＋1／SO＋1 | PA＋1／BB＋1／AB不增 |
| active pitcher | school-development-29d536a2-player-01 | 同一真實投手 |
| pitcher統計 | BF17→18、SO0→1、outs9→10 | BF18→19、BB3→4、outs維持10 |
| Record ref | hs-y1-autumn-exhibition\|4\|上\|45；記pitcherOuts1 | 同前綴seq46；沒有phantom pitcher out |
| Prefix Log／refs | 46／46，PA count＝Record PA total＝30 | 47／47，PA count＝Record PA total＝31 |

Prefix驗證遍歷真實Log：sequence與唯一event refs逐項對應；每筆PA before接上既有after，sideChange另切換半局；terminal chain必須等於Match outs／bases／scores。另核對總PA、Record比分、actual lineup、setup actor與next batter、row統計delta及原owner evidence。兩筆prefixBefore／prefixAfter、native Match與Record issues均空，**不是只靠issues=[]宣告歷史合法**。

前置Fixture PA不呼叫AI outcome、不消耗額外RNG。兩筆前後simulationSeed皆2884315748、simulationCursor皆28、presentedEventCursor皆45；target前由正式playback處理新hidden events。這不是自然PA的RNG進度，也不要求與前輪無setup的比賽結果parity。

## 5. Duplicate與Checkpoint

每筆有test-only setup identity／Set once guard；重送在任何state owner之前回accepted=false／duplicate-setup-identity。兩次重送完整Player（含Match／Record／Log）不變，Current reference不變；沒有再呼叫四個mutating owners。這個guard屬同一隔離VM，不宣稱是新增Production Save API。

完成兩筆後保存完整Player checkpoint，交正式normalizeSave建立**另一份memory copy**。原active Player未被安裝或替換；Current selector再次返回原Match、完整Player bytes不變。Copy的identity、inning／half／outs、runner、打序／next batter、Record／Log／rosters、completedMoments、exposure、seed／cursor／phase等16欄逐物件相同；能力與Event輸入不變、actual SS合法、無pending lifecycle，prefix重新通過。

這是memory round-trip與原Current authority驗證，**不是cold installed reload或browser storage lifecycle**。NormalizeSave並未替setup歷史背書；兩筆原owner execution與prefix ledger才是來源。[Checkpoint／duplicates](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json)

## 6. Target Physical／SS Binding／Reach

Setup與checkpoint全通過後才arm [Physical adapter](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-adapter.cjs)。它只在下一個正式ordinary contact的原Physical producer input.rolls固定一次五項rolls，直接回原truth；其他exports保留原reference。沒有加Tactical override、能力override、primary binding、Reach／Secure／meaningful或outcome答案。

本球完整Physical identity：

```text
hs-y1-autumn-exhibition|4|上|away|regional-power-school-player-09|1|1|truefalsefalse|ordinary-contact|pitch-1
```

正式輸出solid／groundBall／firm／leftSide；ground depth roll不消耗，truth depth=null。Opportunity依actual roster回supported／bound、primary SS=player，非由adapter寫入。Reach inputs為reaction9／range9／mobility2，demand4.095；identity variation roll0.7696281117387116、adjustment−0.539，**margin3.579、cleanArrival**；Access為favored／canonicalReachArrival，詳細handoff supported=true。

新版identity與前輪不同，不能沿用前輪margin4.759作本球證明。原pipeline自帶pitch的deterministicFixtureOverride標籤仍保留；不是本輪新增pitch injection，也不能稱完全自然生成。

Readonly [observer](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-observer.cjs)只記錄原owner真實inputs／outputs，每次wrapper以Reflect.apply委派一次、回同一result／exception，不另抽RNG。此球原pipeline有2次Reach／Access核對，以及3次Secure／Throw／Timing execution／validation計算；各次相同identity的輸出一致，**只有一次committed玩家play**。不能把原生重驗計算當多球或多次settlement，也沒有另做observer-free gameplay control。

## 7. Meaningful／Density／Lifecycle

| 正式route identity | objective／risk | 本球 |
|---|---|---|
| secureFirstBaseOut／secure／6-3 | secureOut／low | legal；first-legal實際選取 |
| forceSecond／forceSecond／6-4 | attackLeadRunner／medium | legal；本球未選 |
| startDoublePlaySecond／challenge／6-4-3 | attemptDoublePlay／high | legal；本球未選 |
| holdBall／contain | controlBall／low | legal；baseballValue=executionOnly，不計策略meaningful |

正式gate為legalChoiceCount4、**meaningfulChoiceCount3**，objectives／commitments／tradeoffs各3，decisionTension=high、shouldCreateDecision=true；forceAtSecond與doublePlayEligible皆true。Density保留真實history，allowed=true、meaningfulCandidate=true、suppressionReason空；沒有重設配額或提高importance。

Lifecycle為playerDecision／admittedToPlayer=true，reason=groundBallMultipleMeaningfulRoutes；owner建立 **hs_y1_match_moment_2**，phase=moment_2_ready。其`admission.meaningfulRouteCount=4`是lifecycle對unique route IDs的計數，**不等於策略gate的meaningfulChoiceCount3**，兩欄原樣分開保存。

本輪正式分類是 **A — Meaningful Admitted**。B Routine、C Density suppression、D Upstream not reached均未發生，沒有零次conditional assertion冒充守備通過。

## 8. Public Choice／Secure／Throw／Runner／Settlement

tick45以正式choices[0]的secure／secureFirstBaseOut及其owner Moment ID呼叫公開resolveHighSchoolYearOneMatch，randomSource .72。Public回有效敘事、Current object／id／Event不變；沒有直接低階apply替代玩家選擇。

| 同球正式執行 | 實際結果 |
|---|---|
| Secure | margin **5.06**、cleanControl；原owner使用public sample .72 |
| Throw | 6-3、onTarget／readyRelease；strength margin3.464986950159073、accuracy margin4.1400096490979195 |
| Receiver | 真實NPC 1B school-development-29d536a2-player-03；ready／atBase |
| Runner contest | batter player-09到一壘6.4；ball／receiver completion5；timingMargin **1.4**、defenseClearlyAhead |
| Legality／result | batterRunnerBeforeFirst，一個out；不是二壘force或tag contest，不是雙殺 |
| Base rebuild | player-09出局；原一壘runner player-04依正式movement／force owner到二壘；無得分／error |
| Match | 4上1out／一壘有人／0：1 → **4上2outs／二壘有人／0：1** |
| Settlement／品質 | settlementApplied=true；decisionQuality=reasonable、executionQuality=complete，分欄保存 |

同一public呼叫新增PA seq48（result out）、meaningfulMomentResolved seq49、defensiveResolution seq50及一個completedMoment，各自有唯一Record ref，shared decision／physical identity相符。Native apply／lifecycle guard完成結算與closed；沒有第二次低階手動套用。

同choice／Moment duplicate立即回false，完整Player不變、Current reference不變。玩家當場另外兩個進攻Moments的duplicate也都是no-op；它們沒有被拿來替代本球守備驗收。兩條未選戰術路線只有合法選項證據，**沒有本球6-4或DP execution PASS**。

## 9. 終局Record／Career／三時點

本球合法結算後沿同場原playback自然續行，兩run均136<1400，7局終、3outs、空壘，completed／settled=true。

| 終局責任 | 本固定Scenario證據 |
|---|---|
| Match／Record | final、integrity有效；home1run／9hits／0errors，away7runs／14hits／0errors；totals／result比分與Match一致 |
| Log／refs | 151 events、151 unique refs；sequence／type／inning／half逐項對應；兩筆人工setup來源仍保留 |
| 防守守恆 | created meaningful defense1＝completed defense1；本球正是該非零玩家守備Moment |
| Actual exposure | started=true、entry1／exit7、defensiveInnings7、PA3；守備局數不等於meaningful數 |
| Evaluation／history | sampleCount1、appliedMatchIdentities只有本場一次、history1；recentTrend neutral、trendScore−0.404，沒有要求正面評價 |
| Experience | settled=true，evidenceSummary15（exposure3／active12）；由原owner產生，未手填credit |
| Final Save memory | normalizeSave保留Record／Log／completedMoments／rosters／exposure／Experience等已驗欄位，未重演target球 |
| 終局公開冪等 | settle兩次＋finish一次皆false，完整Player不變；不推廣為任意低階helpers可重呼保證 |

三時點清楚分開：**Decision Context＝4上1out、一壘player-04、0：1；Resolution Snapshot＝4上2outs、二壘player-04、0：1；Final Summary＝7終3outs、空壘、1：7**。完整target completedMoment於終局仍與public resolve後複本deep equal，Snapshot修復保留；沒有把結果後snapshot改稱decision-before。

本能力fixture確實由owner產生Moment1／2／3，但不回填原#36／原S3契約的歷史狀態。原能力自然SS meaningful、其他career配置、真實browser/storage及未選路線仍不在本證據保證內。

## 10. 同條件Replay與執行證據

唯一Scenario×首次及一次replay，共2場完賽。完整setup／checkpoint、Physical identity、Reach／Secure／meaningful、decision／settlement、owner trace及final player相同；不是只比終場比分。

| 首次／replay共同SHA-256 | 值 |
|---|---|
| Setup ledger | e47011f84c91592eb7915335591f75569eefebc5ffebffdb151f248f5eae759d |
| Record | 0baa9e8f5c33080b40911add03d34a9f8763d3c84918a697c162b8016415a2db |
| Log | f1ca27fd1d1d97fc967da5fc893ed2a9f10ca1635ab8da8df701393e48deddd8 |
| Decision sequence | 8fbd51d57d908750b09613a790f2fbfbcc7b08bca97e72623dff4ee5a85fcb13 |
| Final player | cc31c4c5216c8a393c5ea266a1ae3ead20293273b4bd40db4c1a94f18ba259dc |

| 本輪standalone | 結果／具名checks | elapsed | 成功Node assertions | Raw／witness |
|---|---|---:|---:|---|
| Scenario first diagnostic | **PASS 13** | 2038.8043ms | 2019 | [raw](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-candidate-first-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-candidate-first-evidence-assertions.json) |
| Same-condition replay diagnostic | **PASS 14** | 2222.8199ms | 2030 | [raw](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-candidate-replay-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-candidate-replay-evidence-assertions.json) |
| 既有SS Integration | **26/26 PASS** | 3410.2194ms | 649 | [raw](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-ss-regression-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-ss-regression-evidence-assertions.json) |
| 既有Ground Lifecycle | **26/26 PASS** | 2113.8137ms | 60 | [raw](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-ground-regression-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-ground-regression-evidence-assertions.json) |
| 既有Game Record | **13/13 PASS** | 877.5205ms | 13 | [raw](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-game-record-regression-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-game-record-regression-evidence-assertions.json) |

Diagnostic27 checks／4049成功assertions，正式65 checks／722成功assertions；合計4771 calls，計數不互換。五個children皆exit0、stderr空、entryVerified／sourceStable=true；Node v24.19.0。Raw保存actualCommand、source before／after hashes、完整stdout／stderr、limits及assertion witness；大型完整facts另exclusive-create，沒有stdout截短取代原始capture。

使用原Entry-Safe preload／standalone main；正式runner檔案不改。Docs profile僅沿用已審查的cached-diff→porcelain index metadata觀測替換，避免unscoped diff；其餘entry／nonce／assertion／classification／policy保留。Timeout120000ms／stdout buffer16000000 bytes／implicit Git show30000000 bytes未增限。[Entry profile](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-entry-profile-evidence.json)

## 11. 回歸freshness與白名單記帳限制

三套正式回歸原source及自身明示fixtures照跑，沒有為本Scenario更改能力或結果；其內部fixtures不算第二個受控候選搜尋。Canonical採Snapshot Repair歷史可信50/50；其440個記錄的非docs hash候選與current均相同，**本輪未重跑Canonical**。原#36／Gradient歷史FAIL保留，沒有拿本輪diagnostic綠燈改寫正式舊Suite狀態。

**一項dataPaths列舉缺口保留：** replay讀取首次`candidate-first-facts-evidence.json`；這個exact路徑已存在於事前凍結proof source，Plan也固定first／replay命名及source hash，但未另外列入execution whitelist的`dataPaths`陣列。所有遞迴code來源已事先列明，沒有因此載入未知code或protected內容；**不能宣稱每個data input均已在dataPaths逐項列出**。未重寫凍結manifest或追加gameplay掩蓋此事。[記帳證據](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-dependency-accounting-evidence.json)

## 12. Git／Protected Integrity、UI Readiness與停止

結案1823個既有hashes全部相同；branch／HEAD／main／origin/main tracking ref／index及原WIP一致，Snapshot四檔修復與所有原captures保留。Production、既有正式tests／helpers、fixtures／seeds／pins、runner／registry／Receiver wiring delta＝0。12個protected paths未read／hash／執行／修改內容，status／size／mtime相同。[Closeout](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-closeout-evidence.json)、[Delivery](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-delivery-evidence.json)

新evidence獨立命名、exclusive-create；source定位及遞迴掃描限事前明列檔案，無全域文字搜尋、git grep或git diff。沒有Reset／Clean／Stash／Stage／Commit／Push，也未執行Full255／Full251／R6Full227／First-base timing／Receiver Integration／Browser全套。完成replay與三套計畫回歸後沒有第三次Scenario。[Verification](ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-verification-evidence.json)

| 結案Gate | 判定 |
|---|---|
| Test-only fixture／prefix／duplicate／checkpoint | **CONFIRMED限定本契約**；memory copy，dataPaths列舉缺口如上 |
| Meaningful／public decision／SS 6-3 execution | **CONFIRMED**；4 legal／3 meaningful，first-legal一壘路線 |
| Controlled Match Integration／Final Career／Replay | **CONFIRMED限定本fixture及選取路線**；兩run自然完賽 |
| Natural Production Proof／未選forceSecond／DP execution | **UNVERIFIED本Scenario**；不能從合法路線存在推定完成 |
| 受控SS 6-3 UI資料契約技術前置條件 | **YES，待人工審查**；已有同play decision／execution／settlement與三時點資料 |
| UI正式施工／Phase B2／Sprint10B | **NOT STARTED／NOT STARTED／NO**；本輪未授權開始UI |
| Ready for Commit／Receiver v2 | **NO／DISABLED** |

**下一步唯一最小建議：** 人工審查builder的四owner組合、prefix／setup人工來源、同球decision／execution資料及dataPaths記帳缺口，再另案決定受控SS 6-3 UI slice的資料消費契約。此結果不需要Production修補，也不授權追加seed／能力／DP候選或UI施工。

完成本輪後停止，等待人工審查。
