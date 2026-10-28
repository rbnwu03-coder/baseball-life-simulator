# 《棒球人生》Connected Match Slice Readiness Audit v0.1

日期：2026-10-16（Asia/Taipei）。Production Match Continuity & Player Decision Source Audit；唯讀來源稽核。

## 1. Gate 與證據邊界

**CONDITIONALLY READY。** [S/T/I:L01–L19] 正式 Match 已具備「當下局勢 → 玩家合法選擇 → 正式結算 → 同一 Match 狀態 → 後續 PA／事件」的執行鏈；本輪既有測試也有正常流程 SS 決策、routine play 與完賽紀錄見證。下一個 play 不保證由玩家操作，更不保證仍是 SS meaningful decision。

要建立新的 Connected consumer，須先完成兩項 Foundation：**F1 逐 play 公開資料的來源映射契約**、**F2 跨 play 公開／確認與續行交接契約**。本輪沒有實作這兩項。正式來源與下一事件已存在，因此不判 BLOCKED；缺口涉及來源／權限契約，超過單純替換 Prototype 資料入口，因此不判 READY。[I:L19]

本 Gate 不表示已有接線完成的 Connected UI。**具體歷史 SS63 → 同半局下一 PA 的新 consumer 逐事件對接、同半局再次 SS 決策、任意 play 動畫及任意 career／seed 全覆蓋，均為 NOT VERIFIED。** 正常流程完賽見證不替代這些限定驗證。

證據標記：**[S]** 當前 Source；**[G]** 可用 Graph；**[T]** 既有 Test；**[D]** 文件／歷史 Evidence；**[I]** 推論或提案。L01–L19 對應本輪 evidence.json 的 claims，含 exact path、函式、行號及當前 SHA-256。沒有可用 [G] 證據。只有第9節三組測試本輪實際執行；其他歷史數字一律 [D]。

使用者在本輪附件明示：已人工觀看 UI-P2.4B 並認為可接受，UI-P2.4C不執行。這是**本輪使用者回報**；B 原報告當時記錄 Browser／人工驗收 PENDING，原報告及 Evidence 保留不改。本輪未做 Browser UX。B 的162／162 PASS為已核對 hash 的歷史結果，本輪未重跑。[D：B報告第4行]

## 2. 開工、範圍與方法

開工：2026-10-16T14:42:57.096Z。Branch **main**；HEAD與本地origin/main均為 **ab3117653945de0b7013636187c446276a96e634**。未fetch；origin/main只代表本地tracking ref。無staged內容；13個tracked WIP、1,203個untracked保留。Git index SHA-256：6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d。

以前輪B最終artifacts推進其baseline，另納入該Evidence自身：**1,941個既有readable exact paths全部hash相符**；B的11項交付物存在；本輪兩個目標在開工均不存在。12個protected paths只stat／status，未讀內容、hash或執行。完整status、refs、hash清單及protected metadata保存在evidence。

涵蓋正式入口、script.js Match owners、lifecycle/context、force/throw/runner結算、GameRecord、career test VM、必要既有測試、v0.2 Contract／offline generator／generated connect、frozen fixture、UI-P2.4A/B與歷史SS scenario。搜尋限已定位檔案，未全庫source-content搜尋或重新索引。

依AGENTS.md沿用codebase-memory skill；index_status、限定search_graph、check_index_coverage均回 **Transport closed**。改以當前exact-path Source／既有Test查證，不作graph freshness、coverage、absence或completeness宣稱。實際來源連結與範圍集中於第12節；每項結論均有對應claims定位。

## 3. Audit A：正式主資料流與所有權

[S:L01/L09] 根目錄index.html載入script.js與foundation模組；Match主狀態由 **player.highSchoolMatch** 持有，不能因文件用詞就假定另有獨立Match Engine class。以下列出實際caller→callee、輸入／輸出、owner及更新時機。

| 階段／證據 | 實際呼叫鏈與定位 | 主要輸入 → 輸出 | 狀態owner／更新時機 |
|---|---|---|---|
| 初始化 [S:L01] | prepareCurrentHighSchoolYearOneMatch依career entry選對應prepare，最後到prepareHighSchoolYearOneMatch → playing-time admission、materializeSelectedHighSchoolRoster、createHighSchoolMatchSimulationRoster、createMatchContext；script.js:9667、10113 | 已准入Player/Opportunity、規則、校隊/對手 → Match、rosters、context、seed、初始打序/局勢、log/cursor | player.highSchoolMatch；首次prepare。相同有效ID直接回既有物件（9681–9688） |
| Play當下局勢 [S:L02] | prepareHighSchoolDefensiveMomentFromSimulation → createGroundBallMatchSituation → create/admit/presentSituation；script.js:11179 | live inning/half/outs/scores/runner IDs、實體球handoff、legal routes/classification → frozen createdAt/contextSnapshot、activeSituation | Match保存activeSituation；實際責任、策略與density分類後建立 |
| 玩家提交 [S/T:L03] | chooseHighSchoolYearOneMatchMoment → resolveHighSchoolYearOneMatch → beginGroundBallSituationDecision → resolveHighSchoolDefensivePlay → infield resolver → buildHighSchoolShortstopExecution；script.js:3635、13750、8479、11938 | 當下合法choice、expectedMomentId、同球physical/runner/receiver、sample → 意圖、實際secure/throw/timing/retirement facts | Production擁有決策與執行；過期/重送拒絕或返回既有執行；UI不先填結果 |
| 正式套用 [S/T:L04] | recordGroundBallSituationResolution → advanceHighSchoolYearOneAfterMomentTwo → applyInfieldResolutionToHighSchoolMatch → applyHighSchoolDefensiveSettlementFacts；script.js:12150、12700、12256 | 同球已解析facts、before、ordered retirements、third-out → live outs/runners/legal runs、PA、completedMoment、defensiveResolution | 同一Match；驗before/identity後一次套用；不是播放結束重新結算 |
| 收束/恢復 [S/T:L04/L08] | applyInfieldResolution… → advanceHighSchoolMatchBattingOrder → settleAndCloseGroundBallSituation → restoreHighSchoolMatchAfterDefensiveDecision；script.js:12434、12208 | applied結果、pendingDefensiveResumeState → 下一棒、closed summary、恢復phase/domain | 只恢復流程欄位，不重設結算後outs/score/runners |
| 下一PA [S:L06/L08] | scheduleHighSchoolMatchPlayback callback → advanceHighSchoolMatchPlaybackStep → resolveSimulatedHighSchoolPlateAppearance → AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome → applySimulatedHighSchoolPlateAppearance → recordEvent/advanceBattingOrder；script.js:3471、6993、13625 | 同一Match live before、當前打序/active pitcher、seed/cursor → PA outcome、before/after、runnerChanges、下一棒 | Production step；先交付未公開events，無open lifecycle/blocking outcome才推進 |
| 三出局/換半局 [S/T:L07] | resolveHighSchoolThirdOutIntegrity → pendingHalfInningTermination；step在outs≥3走advanceHighSchoolMatchAfterHalfInning或終場；script.js:6847、7036、13483 | 合法third-out/得分 → halfInningEnd/sideChange、新攻守、outs0、清壘 | Match；三出局/正式終場條件時；比分與名單不歸零 |
| Record [S/T:L09] | recordHighSchoolMatchSimulationEvent → createHighSchoolMatchPresentationSnapshot → MatchGameRecord.recordEvent；settleHighSchoolYearOneMatch → finalizeHighSchoolGameRecord；script.js:4343、12884；match-game-record.js:312 | 已提交event/當前名單 → log、sequence、eventRefs、PA/投打守跑統計、final record | Match owns log/record；每event去重，終場finalize；Record不生成下一球 |
| UI公開 [S:L10] | advanceHighSchoolPresentationCursor → getHighSchoolPresentationSnapshot/getHighSchoolVisibleScoreboardProjection → getScoreboardFromEvents(prefix) → getHighSchoolMatchPresentation → renderHighSchoolLiveSituation；script.js:4448、6229、6274 | log[0,cursor)、最後公開snapshot → 可見比分、outs/壘況、打者、摘要 | cursor是公開邊界；畫面不直接取未公開live/final結果 |

[S:L06] 名單在初始化產生/materialize；後續從 **match.rosters[team].lineup** 與 **battingOrderIndex** 取下一棒。投手由getCurrentHighSchoolMatchDefender(match, defenseTeam, "投手")取當前active assignment；SS receiver由TeamRosterFoundation.getCurrentDefender取當前1B。既有合法entry/substitution可改active roster，與每play重新抽人不同。來源：script.js:6413、6666、6993、7238、11938。

[S:L07/L08] 不宣稱所有舊helper都純逐事件推進：simulateHighSchoolMatchUntilSideChange有18 PA上限及末端補outs=3（7088–7100）。本輪限定script.js caller搜尋未見其呼叫點；本表查證的正式playback step直接走PA/half owner，不使用該helper。後續應沿已查證step，不能任選helper當等價證明。

## 4. Audit B：SS 6-3與正式結算

**正式規則能力已證實；具體自然歷史鏈未由本輪重新生成。** [S/T/D:L03–L07/L13]

| 參考變化 | 正式owner／事實 | 證據與界限 |
|---|---|---|
| SS滾地 → 傳一壘 | supported SS ground handoff → buildHighSchoolShortstopExecution；buildDecisionOpportunity的secureFirstBaseOut指BR/first/當前1B | [S] script.js:11938；defensive-decision-throw-foundation.js:61 |
| BR出局 | throw/receiver/runner timing產生batterRunnerBeforeFirst，再由force/third-out套用 | [S/T] script.js:11963；SS-01及公開first-base case；選擇傳一壘不保證成功 |
| R1一壘→二壘 | initial force chain與committed movement保存runnerId；移除BR force後原已承諾movement仍重建二壘占壘 | [S/T] force-advancement.js:35、159；Force測試Q；不是任意滾地必進壘 |
| outs1→2 | settlement/thirdOut.outsAfter寫回Match；未達3不換半局 | [S] script.js:12256、6847 |
| 比分不變 | runChanges/legalScoringRunnerIds空則無加分，保留scores | [S/T] 同上；公開first-base fixture之Match/Record run delta均0 |
| Runner身分 | BR出局ID、原R1 ID與ID-array basesAfter皆保留 | [S/T] force settlement與SS runner/Record assertions，非重新生成名字或只用Boolean |

[D:L13] 原歷史findings的/threeTimes/decisionBefore：4上、1out、home0/away1、一壘 **regional-power-school-player-04**，BR為 **regional-power-school-player-09**。/threeTimes/resolution保存BR out、原R1到二壘、2outs、比分不變，snapshotPreserved=true。報告記錄該public resolve新增seq48 PA、seq49 meaningfulMomentResolved、seq50 defensiveResolution，後續沿同場playback完賽。

這是**受控scenario的正式owner歷史執行**：兩筆setup PA明示人工來源、能力raw12、一次physical-roll adapter；naturalProof明記 **UNVERIFIED**。不可改稱自然遇到該球，不可把終局home1/away7當該球Resolution的0:1。原scenario未選6-4/DP，沒有這些路線在同球完成的證據。來源：歷史報告:25、42、81、112、131；findings JSON pointers見L13。

[S/T] Production另有forceSecond、startDoublePlaySecond/6-4-3、holdBall；context、active receiver、outs<2、force/window控制可用性。6-4/DP、partial relay、throw/error有本輪既有明示fixture測試，證明正式owner行為，不能冒充原歷史未選路線已發生。holdBall在buildDecisionOpportunity與resolveThrow有正式no-throw分支；本輪未執行獨立holdBall結果見證，**[T] NOT VERIFIED**。來源：defensive-decision-throw-foundation.js:82、142；SS測試:82–153。

[S:L14/L15] Prototype其餘三選項仍進Unsupported。正式系統有路線不授權把其結果加進frozen fixture、現有v0.2 Resolution或動畫。

## 5. Audit C：結算後的連續權威來源

[S:L04/L06/L08] 若正式settlement輸出2outs、二壘原R1，applyHighSchoolDefensiveSettlementFacts把它寫回同一Match；infield owner推進該進攻隊打序；restore只恢復flow。下一次resolveSimulatedHighSchoolPlateAppearance的before直接取 **match.outs、scores、runners.slice()**。因此下一個實際PA沿用結算狀態，除非中間已有正式runner事件、換人、half/end轉換；不能跳過中間事件宣稱無條件相等。

[T:L18] 本輪SS套件正常流程見證：hs-y3-final-competition-1，7局final，home1/away3，SS meaningful1/routine3，Match/Record integrity issues空。這是careerFixture seed77001的正常推進，該正常流程測試開始後未指定ball/base/capability/result；仍有明示career初始條件及測試VM。它**不是原4上0:1歷史球的重現**。其餘正常流程controls不構成任意career保證。

| 用途 | 正式權威來源 [S:L02/L09/L10] | 不可替代成 |
|---|---|---|
| 下一play內部before/打序/投手 | player.highSchoolMatch、rosters、battingOrderIndex | Prototype scoreState/SVG座標 |
| decision-before | activeSituation.createdAt/contextSnapshot + physical/PA identity + admission | 結算後Match/final summary |
| applied-after | PA before/after、完成moment snapshot、canonical playSettlement/thirdOut、同球identity | 原始first-leg中間baseChanges；可能尚未完成全部runner rebuild |
| 已提交歷史 | simulationLog sequence + GameRecord.eventRefs | 無identity的prose/outcome |
| 目前玩家可見 | presentedEventCursor prefix + 最後公開presentationSnapshot/visible scoreboard | full live Match/full final GameRecord |

[I:L19] 原具體SS63→下一PA的新consumer exact trace **NOT VERIFIED**。本輪不新增fixture/test補造trace；Source及正常流程Test支持可行性，不能升格為已接好畫面驗收。

## 6. Audit D：Play、玩家機會與呈現挑選

**A. 下一個棒球事件。** [S:L06/L08] 有效未完成Match在pending publication排空、已解析settlement送達、lifecycle closed、blocking outcome確認、outs<3、有效batter/pitcher且沒有其他decision gate時，由step產生下一PA。outs3先換半局/終場，walk-off/completed不再產生下一PA；open decision先停。一個step可能只公開已產生event，並非每次呼叫新生一球。普通PA多用compressed outcome producer，不代表逐投球/逐角色完整軌跡。script.js:13567、6993。

**B. 下一次玩家機會。** [S:L11] 不保證下一play、同半局或每場必再有SS決策。step取actual batter與active assignment，shouldReachHighSchoolDefensiveMoment檢查active、對手進攻、outs<3；一般守位依naturalPressure或entry-related fallback inning及本半局routine顯示狀態，1B有receiver分支。再由當次ordinary physical/tactical handoff、責任/可到達性、buildInfieldMeaningfulMoment、legal choices、evaluatePositionDecisionMoment、density與lifecycle決定准入。legal/viable之外，還需多個不同策略commitments/tradeoffs；不是只數按鈕。script.js:13512、13256、7810。

[S:L11] Density依重複情境間隔、route family、連續密度、absolute cap可壓成routine；routine走自動execution/settlement，沒有玩家decision仍繼續。opportunityDebugTrace保存當前outs/base IDs/score/batter、責任、route、density/rejection；有trace row不等於admitted。createGroundBallMatchSituation才保存正式player-owned admission與同球identity。script.js:2796、2992、13411、11179。

[S] 名稱相似的high-school-match-opportunity-generation.js處理careerYear/seasonPhase/對手候選/整場機會，**不是單次SS play producer**，不能憑檔名宣稱直接資料鏈。該檔:18。

**C. 呈現挑選/摘要。** [S:L10/L12] recordHighSchoolMatchSimulationEvent實際呼叫importance分類：matchEntry hidden，run/half/sideChange/decision/routine等attention，普通PA多為flow，部分meaningful PA ledger刻意hidden。公開cursor每次最多交付一筆visible event。getHighSchoolMatchLiveFeed在已公開prefix做priority/玩家相關摘要及原序排序，getHighSchoolMatchPresentation顯式傳cursor；helper的explicit-range預設可能讀到全log，不能直接濫用。正式跨play feed/summary已存在。script.js:4325、6209、6307。

[D/I] Match-System架構文件描述機會驅動；上述actual step/density/feed才是實作證據。完整Manga Director、任意球種鏡頭/跨play track生成與新consumer接線 **NOT VERIFIED**，不可由importance enum或設計文推定完成。

## 7. Audit E：Contract／Adapter／Clock

| 資料/能力 | Production source及可驗轉換 | 現況／直接接線／權限風險 | 證據 |
|---|---|---|---|
| Decision DTO v0.2 | legalChoices、createdAt/contextSnapshot、admission有正式owner；contract以source+confirmation產生frozen view | 有正式原料及離線歷史映射；live bridge NOT VERIFIED；不得從Prototype四選項反造admission | [S:L02/L15/L16] Contract:124 |
| Playback Event DTO v0.1 | fixture是歷史七beats frozen copy；正式execution facts不是所有PA都輸出七beats | 目前Prototype固定形狀；非任意PA/半局stream；通用輸出需另案 | [S:L14] fixture:1；app:34 |
| Resolution DTO v0.2 | contract驗settlement、snapshots、runner IDs、route；generator取歷史完成moment | 有單球驗證；通用連續Play不足；offline confirmation不是Production receipt | [S:L15/L16] Contract:219；generator:45 |
| Match Situation Snapshot | createdAt/contextSnapshot是decision-before；event.presentationSnapshot是提交事件快照 | 正式來源存在；兩者語意不同；無連續公開envelope接線證明 | [S:L02/L09/L10] script.js:4377、11179 |
| GameRecord Event | log→recordEvent，eventRefs/sequence去重；match-game-record-v1 | 正式紀錄/前綴記分板已接線；不是七beats/未來decision producer | [S/T:L09/L10] record:312、448 |
| Player Decision/Opportunity | step→physical/route/density→lifecycle-v1 admission/presented | 正式來源存在，不保證next SS；需區分candidate/routine/admitted | [S/T:L02/L11] script.js:13639 |
| Track Manifest | ss63-bounded-tracks/0.2由歷史fixture、SVG geometry、B授權建構 | Prototype限定；secureFirstBaseOut、五actors、固定時點/尾段；無任意next-play tracks；缺資料就摘要 | [S:L17] tracks:67 |
| Presentation Clock | presentation-clock/0.1 + withRemapping(ss63-timing/0.1)，七beats/motionEnd4550/exit900 gate | 可重用單Controller clock/純sampler/單writer/epoch原理；不是正式下一PA/settlement authority | [S/D:L17] clock-contract:9 |
| 來源/版本 | fixture header、generator provenance hashes、contract版本；正式situation/physical/decision/settlement/event identities | 各自可追溯但無統一跨playconsumer契約；不能遺失setup/deterministicFixtureOverride或把示意時間當物理時間 | [S/D:L13/L14/L16/L17] generator:45 |

[S:L15] **v0.2不是只接受一個字面ID的死資料schema。** 建構器可以驗證不同identity的相符SS source/confirmation pair，有issued decision、before/after、movement驗證；但固定SS四選項vocabulary，Resolution明確限制actualRouteId=secureFirstBaseOut與同inning/half。verifiedTradeoff只在精確1→2outs/R1→2條件產生文字。因此可表示受支援的單球SS pair，**不足以表示任意連串不同Play、普通PA、pitch stream或跨半局**。現有generated connect更逐欄對照baked historical pair，不能傳任意Match即運作。Contract:208–242；generated asset:274–282。

[S:L14/L16/L17] motion.js由原fixture建立manifest並mount；app.submit不呼叫Production，其他三route進Unsupported，Replay重用同DTO，finish只改本地Continue。offline generator的confirmation是從歷史資料推導的宣告，並非live receipt。故本輪限定來源沒有live Connected wiring證據；不作全庫graph absence宣稱。

[S/I] 正式handler在玩家合法選擇時已執行並套用settlement；Prototype Resolution「確認」控制公開/播放，不能接成第二次結算。Skip/Replay/RAF完成也不能呼叫PA producer。Production scheduler與Prototype clock若同時續行會衝突；應由既有Production cursor/交接契約仲裁，Clock保持presentation-only。[L03/L04/L08/L14/L17]

## 8. Readiness Gap Matrix

| 能力 | 來源 | 現況 | 證據 | 缺口 | 建議 |
|---|---|---|---|---|---|
| Match State Continuity | Match、settlement/restore/step | 已證實正式鏈 | [S/T:L01/L04/L08/L18] | 新consumer chain未見證 | 用原Match，不建第二局勢owner |
| Runner Identity | force/runnerChanges/ID bases/PA snapshots | 已證實規則及測試 | [S/T:L05/L06] | Boolean DTO不足證連續ID | 映射保留canonical runnerId |
| Next Batter/PA | advanceBattingOrder→lineup→compressedPA | 已證實有條件續行；非每tick新PA | [S/T:L06/L08/L18] | 原具體歷史球後consumer exact trace NOT VERIFIED | 驗after→next-before及打序只進一次 |
| Next Player Opportunity | physical/route/density/lifecycle | 有正式規則及bounded witness；不保證下一球/同半局 | [S/T:L02/L11/L18] | 無下一SS保證 | 允許非玩家摘要，准入才停 |
| Defensive Decisions | execution/throw/timing/force/third-out | 正式6-3/6-4/DP有test，hold有source | [S/T:L03–L07] | Prototype其餘三路Unsupported；hold本輪無結果test | 保持凍結範圍，不補未選結果 |
| Game Record | recordEvent→refs/stats→finalize | 正式紀錄及正常流程integrity已證實 | [S/T:L09/L18] | 非公開七beats producer；fullrecord可能領先畫面 | refs稽核、公開prefix消費 |
| Match UI Adapter | offline generator/generated connect/mount | 歷史映射存在；live bridge NOT VERIFIED | [S:L14–L16] | **F1：逐play公開來源映射contract** | 獨立版本，分清decision/play/summary/half/end |
| Cross-Play Reveal | Production cursor/snapshot；Prototype result gate | 前綴已證實；兩端handoff NOT VERIFIED | [S:L08/L10/L14] | **F2：公開/確認/續行contract** | 續行一次，Replay零mutation |
| Match Director/Importance | importance/density/liveFeed/summary | 基礎挑選已接線；完整Director NOT VERIFIED | [S/D:L11/L12] | 任意Play tracks/演出挑選非現成 | 沿原flow/attention做文字摘要，缺資料fail closed |

## 9. 本輪驗證與限制

| 既有命令 | 實際結果 | 範圍 |
|---|---|---|
| node tests/match-situation-lifecycle-test.js | exit0，23/23 | context/transition/close-resume、duplicate、abandon |
| node tests/force-advancement-foundation-test.js | exit0，22/22 | force/committed movement、ID/base rebuild、secure-first |
| node tests/ss-defensive-production-integration-test.js | exit0，26/26 | 明示production fixtures/public handler、thirdout、來源防竄改、duplicate、memory reload、bounded完賽/Record |

[T:L18] **71/71既有檢查通過，三個process exit0、stderr空。** 這是原腳本自定assertion/case count，不是71項Node TAP subtests。完整stdout、時間、Node版本、source hashes見evidence。

[T] SS套件原有五次bounded playCareerMatchToEnd（左投准入control一次、SS正常流程一次、2B/1B/3B controls三次）及明示scenario cases原樣執行；無新增seed、候選搜尋、simulation runner或重跑。harness DOM/localStorage/timer皆VM內Map；不寫正式存檔。入口93個scripts按原harness排除application-controller.js，載入其餘92個；protected不在runtime清單。

[D] match-full-game-record-test.js、ground-settlement-handoff-r2…及public-presentation-contract測試本輪只讀source，**未執行**，不列fresh PASS。沒有重跑B162、全庫regression、額外Match搜尋或Browser UX。freshness僅限當前工作樹與上述三命令。

## 10. Audit F：最小施工提案（未授權）

**建議另案先做「Connected Match Public Source & Handoff Foundation」，人工審查後再另案授權同半局兩個真實play的有限consumer。** [I:L19] 以下是提案，沒有新增DTO/API/測試或實作。

### F1：逐play公開來源映射

[I] 定義獨立版本有限envelope/adapter，至少區分admitted playerDecision、settledPlay、ordinary/routine summary、half transition、gameEnd。綁matchId、適用的PA/physical/situation/decision/settlement identity、log起訖sequence、公開cursor、before/after、完整runner IDs、actual batter/pitcher/team/roster來源、schema/source版本及setup標籤。這些是**建議欄位**，不是宣稱已有契約；不拷整個Match或未公開Resolution給場景。

[I/S] SS63符合原支援條件時可參照既有constructor invariant；不修改frozen v0.1/v0.2，不把三路Unsupported當完成。無軌跡的Play2先用正式event摘要；缺合法資料就標missing/unsupported，不以動畫推導safe/out。Record refs是稽核鏈，Production Match保持唯一狀態owner。[L04/L09/L14–L17]

### F2：公開、確認與續行交接

[I] 分清Production admission、execution/settlement applied、presentation reveal、使用者繼續。沿既有pendingYouthSeasonOutcome/continueYouthSeasonOutcome、presentedEventCursor/activeSituation gate接手，不建第二個Match推進timer、不繞open situation。

[I] 續行綁當前play identity/公開cursor及一次性狀態，stale/duplicate/跨play callback不得多推打序或settlement。Next/Skip只控制當前合法演出；Replay重用已公開frozen單球資料，零RNG/PA/settlement/Record mutation。內部模擬可領先畫面，但不得把未公開live狀態灌入記分板。示意Clock不改physical arrival或結果。[L03/L08/L10/L14/L17]

### 最小slice驗收順序

1. [I] Play1須真實可追溯且已准入，由正式公開handler選擇/結算，保存decision-before、applied-after及source refs。用原4上0:1案例時明示受控歷史scenario。
2. [I] 經既有確認邊界續行，排空同球公開events，取得**實際**下一PA/event。驗sameMatch/sameHalf、after→next-before、R1 ID、打序、投手、sequence；禁止安排下一棒single/out來湊展示。
3. [I] Play2無玩家准入就摘要。若造成第三出局，按正式half/end承接，同半局slice到此停止；無合法同半局Play2時明示不滿足條件，不強塞第三球。
4. [I] 只有正式產生下一PlayerOpportunity才開decision；未發生允許合法stop/summary，不重設density、配額、outs/runner。多個非玩家事件後下一機會可另案評估，不保證同半局內發生。
5. [I] 有限Foundation驗收須查跨play identity誤用、重送/Replay無mutation、未公開比分隔離、普通PA摘要、thirdout/half/end。未覆蓋支線明示NOT VERIFIED。

### 保護契約與後續停止條件

[S/I] 保留MatchContext home/away身份、active roster/entry、lifecycle admission/resolved/settled/closed、force/ordered retirements/thirdout scoring、PA/Record去重統計、decision-before/after/final三時點、public prefix、原frozen Fixture/Playback/v0.2路線限制、B示意track/time與動畫無結果權限的原則。

[I] 若before不符、identity錯配、缺source/applied confirmation、涉及future data、需虛構下一結果或覆寫protected/歷史資料才能成立，停止該支線並報缺口。F1/F2經人工架構審查且獲另案施工授權後才能寫程式；本Gate不是授權。

## 11. 交付與停止

本輪只新增本報告及connected-match-slice-readiness-audit-v0.1-evidence.json。既有1,941 readable baseline hashes、HEAD/branch/main/origin-main/index/原status及protected metadata逐項核對見evidence.integrity；所有既有Production/Save/tests/helpers/Fixture/Contract/B與歷史資料保留。

**Ready for Commit＝NO。Connected Match Slice Implementation＝NOT AUTHORIZED。Sprint10B＝NO。Receiver v2＝DISABLED。** UI-P2.4C不執行，UI-P3/正式Manga Director未啟動；無Commit/Push。完成兩份稽核文件即停止，等待架構審查與下一階段施工授權。

## 12. 來源定位索引

每條L項的[S/T/D/I]標籤、精確區間、來源hash與caller/input/output/owner細節亦保存在evidence；以下連結定位當前工作樹，不代表已提交版本。

- **L01 [S]** 同一已准入 Match 由 player.highSchoolMatch 持續持有；有效相同 ID prepare 直接回傳，不逐 play 重建。 [prepareHighSchoolYearOneMatch (script.js:9667)](../script.js#L9667)；[prepareCurrentHighSchoolYearOneMatch (script.js:10113)](../script.js#L10113)；[createMatchContext / deriveBattingSide (match-context-foundation.js:17)](../match-context-foundation.js#L17)

- **L02 [S]** 守備 Situation 的 createdAt 保存當下 outs/score/runner IDs/PA identity；具備前一 closed summary，不等於最終比賽狀態。 [createGroundBallMatchSituation (script.js:11179)](../script.js#L11179)；[createSituationId / createSituation (match-situation-lifecycle.js:39)](../match-situation-lifecycle.js#L39)

- **L03 [S/T]** SS 正式決策由公開 handler 核對 current Moment 與 legal choice，執行既有接傳/跑者 timing，再走正式 settlement；結果非 UI 產生。 [chooseHighSchoolYearOneMatchMoment (script.js:3635)](../script.js#L3635)；[resolveHighSchoolYearOneMatch (script.js:13750)](../script.js#L13750)；[resolveHighSchoolDefensivePlay (script.js:10383)](../script.js#L10383)；[infield resolver SS branch (script.js:8479)](../script.js#L8479)；[buildHighSchoolShortstopExecution (script.js:11938)](../script.js#L11938)

- **L04 [S/T]** 只有 canonical settlement 驗證 before、third-out 與 identities 後更新 outs/runners/score；PA/log/order/lifecycle 同鏈完成。 [applyHighSchoolDefensiveSettlementFacts / applyInfieldResolutionToHighSchoolMatch (script.js:12256)](../script.js#L12256)；[advanceHighSchoolYearOneAfterMomentTwo (script.js:12700)](../script.js#L12700)

- **L05 [S/T]** R1 既定 committed movement 不因 BR 先被移除而自動回壘；每名 runner 依同一 ID 重建占壘。 [buildInitialLiveBallForceChain (force-advancement.js:35)](../force-advancement.js#L35)；[settleForceAdvancement (force-advancement.js:103)](../force-advancement.js#L103)；[secureFirst assertion Q (tests/force-advancement-foundation-test.js:43)](../tests/force-advancement-foundation-test.js#L43)

- **L06 [S/T]** 結算後保留同一打序/陣容；advanceBattingOrder 取下一棒，下一 PA before 直接複製 live outs/score/runners。 [getHighSchoolMatchLineupBatter (script.js:6624)](../script.js#L6624)；[getHighSchoolMatchNextLineupBatter / advanceHighSchoolMatchBattingOrder / integrity (script.js:6666)](../script.js#L6666)；[resolveSimulatedHighSchoolPlateAppearance (script.js:6993)](../script.js#L6993)；[getCurrentHighSchoolMatchDefender (script.js:7238)](../script.js#L7238)；[createHighSchoolMatchSimulationRoster (script.js:6413)](../script.js#L6413)

- **L07 [S/T]** 第三出局以正式 third-out integrity 決定合法得分與清壘，換半局重設 outs/bases 並換攻守；比分與球員名單保留。 [resolveHighSchoolThirdOutIntegrity (script.js:6847)](../script.js#L6847)；[advanceHighSchoolMatchAfterHalfInning (script.js:7036)](../script.js#L7036)；[finish/end-of-game conditions (script.js:13469)](../script.js#L13469)；[SS-08 third out (tests/ss-defensive-production-integration-test.js:165)](../tests/ss-defensive-production-integration-test.js#L165)

- **L08 [S]** 跨 play 已有正式 step scheduler；先交付 queue prefix、等待 unresolved lifecycle/outcome，再生成下一 PA/decision/half/end。 [scheduleHighSchoolMatchPlayback (script.js:3471)](../script.js#L3471)；[continueYouthSeasonOutcome (script.js:3851)](../script.js#L3851)；[resumeResolvedHighSchoolGroundBallSettlement / advanceHighSchoolMatchPlaybackStep (script.js:13533)](../script.js#L13533)

- **L09 [S/T]** 每個 simulation event 具 sequence 與凍結 presentationSnapshot，GameRecord 按 eventId 去重並記 PA、得分、守備、投手、跑者資料。 [recordHighSchoolMatchSimulationEvent / createHighSchoolMatchPresentationSnapshot (script.js:4343)](../script.js#L4343)；[createGameRecord / seedRosterPlayers (match-game-record.js:66)](../match-game-record.js#L66)；[recordPlateAppearance (match-game-record.js:165)](../match-game-record.js#L165)；[recordEvent (match-game-record.js:312)](../match-game-record.js#L312)；[finalizeHighSchoolGameRecord (script.js:12884)](../script.js#L12884)；[settleHighSchoolYearOneMatch (script.js:13093)](../script.js#L13093)

- **L10 [S]** Production UI 以 presentedEventCursor 的 prefix 及最後已公開 snapshot 計分與顯示；不是直接讀完整未公開終局 record。 [getHighSchoolPresentedEventCursor / getHighSchoolPresentationSnapshot / advanceHighSchoolPresentationCursor (script.js:4406)](../script.js#L4406)；[live feed / getHighSchoolVisibleScoreboardProjection / getHighSchoolMatchPresentation (script.js:6209)](../script.js#L6209)；[getScoreboardFromEvents (match-game-record.js:448)](../match-game-record.js#L448)；[renderHighSchoolLiveSituation (script.js:2478)](../script.js#L2478)

- **L11 [S/T]** 下一個 PA 與玩家決策不同。實際出場/攻守/壓力或局數 gate、physical responsibility、可行多策略 route、density 才能產生 SS decision。 [shouldReachHighSchoolDefensiveMoment (script.js:13512)](../script.js#L13512)；[prepareHighSchoolDefensiveMomentFromSimulation (script.js:13256)](../script.js#L13256)；[evaluatePositionDecisionMoment / classifyPositionFamilyPlay / classifyHighSchoolMatchDefensiveOpportunity (script.js:7810)](../script.js#L7810)；[evaluate/applyHighSchoolMatchDefensiveDecisionDensity (script.js:2796)](../script.js#L2796)；[defensive opportunity trace (script.js:2992)](../script.js#L2992)；[bounded normal-flow SS witness (tests/ss-defensive-production-integration-test.js:327)](../tests/ss-defensive-production-integration-test.js#L327)

- **L12 [S]** Importance/可讀摘要已在正式執行路徑，不是僅有架構設計；不等於完整 Manga Director。 [getHighSchoolMatchEventPresentationImportance (script.js:4325)](../script.js#L4325)；[getHighSchoolMatchLiveFeed (script.js:6209)](../script.js#L6209)；[actual step classifications and summaries (script.js:13639)](../script.js#L13639)；[schedule-level opportunity context (high-school-match-opportunity-generation.js:9)](../high-school-match-opportunity-generation.js#L9)

- **L13 [D]** 參考 4上 1out/R1→6-3→2outs/R1二壘是有人工 setup/能力/physical rolls 的歷史正式 owner 執行；naturalProof 明記 UNVERIFIED，不能泛稱自然鏈。 [declared setup and physical adapter (docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1.md:25)](../docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1.md#L25)；[actual target and historical continuation (docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1.md:112)](../docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1.md#L112)；[JSON pointers /threeTimes /naturalProof (docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json:1)](../docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-findings-evidence.json#L1)

- **L14 [S]** Prototype 只有 frozen fixture 與七段 Playback；submit 不呼叫正式 Match，Replay 使用相同 DTO，finish 只變本地 Continue。 [fixed source / schema / identity (prototype/match-ui-p1/fixture.js:1)](../prototype/match-ui-p1/fixture.js#L1)；[validateFixture (prototype/match-ui-p1/app.js:34)](../prototype/match-ui-p1/app.js#L34)；[getView / start / submit / next / replay / finish (prototype/match-ui-p1/app.js:201)](../prototype/match-ui-p1/app.js#L201)；[boot (prototype/manga-motion-spike/motion.js:1)](../prototype/manga-motion-spike/motion.js#L1)

- **L15 [S]** v0.2 建構器可驗證具相符身份的 SS 單一 pair，但 Resolution 限 secureFirstBaseOut 與同 inning/half；不代表任意連續不同 plays。 [decisionGate / resultGate / createDecisionPresentation / createResolutionPresentation / Replay (contracts/ss-decision-resolution-public-presentation-v0.2.cjs:124)](../contracts/ss-decision-resolution-public-presentation-v0.2.cjs#L124)

- **L16 [S]** 現有 offline generator 的 confirmation 是歷史資料推導宣告，不是 Production receipt；generated connect 對照固定資料，沒有 live Match bridge。 [build / offline confirmations / render (prototype/match-ui-p1/generate-presentation-v02.cjs:17)](../prototype/match-ui-p1/generate-presentation-v02.cjs#L17)；[connect (prototype/match-ui-p1/presentation-v02.generated.js:274)](../prototype/match-ui-p1/presentation-v02.generated.js#L274)

- **L17 [S/D]** Clock/sampler/single writer 原理可重用；目前 manifest 0.2/timing 是這個 SS63 範例的示意時間與座標，不能當下一球物理或結算依據。 [createPlayableManifest / validatePlayable (prototype/manga-motion-spike/tracks.js:67)](../prototype/manga-motion-spike/tracks.js#L67)；[createPlan / withRemapping (prototype/manga-motion-spike/clock-contract.js:9)](../prototype/manga-motion-spike/clock-contract.js#L9)；[explicit entry policy (prototype/manga-motion-spike/motion.js:1)](../prototype/manga-motion-spike/motion.js#L1)；[bounded Clock flow (docs/ui-p2.4b-continuous-motion-time-remapping-v0.1.md:20)](../docs/ui-p2.4b-continuous-motion-time-remapping-v0.1.md#L20)

- **L18 [T]** 本輪三組原封不動既有套件 23+22+26=71 檢查通過。正常流程 SS 完賽見證包含 meaningful 1、routine 3、record final、Match/Record integrity 空。 [existing lifecycle assertions (tests/match-situation-lifecycle-test.js:1)](../tests/match-situation-lifecycle-test.js#L1)；[existing force assertions (tests/force-advancement-foundation-test.js:1)](../tests/force-advancement-foundation-test.js#L1)；[existing SS integration suite (tests/ss-defensive-production-integration-test.js:1)](../tests/ss-defensive-production-integration-test.js#L1)；[isolated VM and in-memory localStorage (tests/high-school-career-test-context.js:5)](../tests/high-school-career-test-context.js#L5)

- **L19 [I]** CONDITIONALLY READY：正式 continuity/next-PA 來源存在；需兩項 Foundation（public per-play source mapping contract、cross-play publication/confirmation handoff）。具體歷史球後同半局下一事件及再下一 SS window 的新 connected consumer 驗證尚未完成。 推論依據：L01、L04、L06、L08、L10、L11、L14、L15、L16、L17、L18

[本輪Evidence](connected-match-slice-readiness-audit-v0.1-evidence.json)
