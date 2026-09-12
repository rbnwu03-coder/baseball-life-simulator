# Baseball Rules Integrity Audit — Sprint 1

Core Game-State & Settlement Rules · AUDIT ONLY · 2026-09-12

**Audit report ready / AUDIT PASS WITH FINDINGS**。分類與根因定位完成，不代表全部棒球規則正確。Production diff = 0；tests diff = 0；未 commit、push 或施工。

## 1. Baseline

main = origin/main = **e46475c**（feat: expand compressed AI plate appearance outcomes），ahead/behind 0/0，開始時 working tree clean。前兩筆 caf2199、36b093f。未找到適用 AGENTS.md。

## 2. Scope / method

本輪依使用者提供的 Baseball Rules Contract v1 稽核 31 條 core rules；不宣稱完成外部聯盟全部規則認證。只讀 source、執行既有 tests、做不落檔的記憶體診斷。沒有新增或改寫 test，沒有替換 production 函式。

RUN-MULTI-002、APPEAL 001–003、IFF 001–003、SCOREBOARD 001–003、RECORD 001–002 的細分名稱，是把本輪文字要求對應至必列 ID 的稽核命名，並非另外引用的官方條文編號。

## 3. Files inspected

以下 authority 索引均驗證本 HEAD 的實際函式與行號；另外讀取 index.html、offensive-bunt-defensive-handoff.js、match-situation-lifecycle.js、batted-ball-line-drive-defense.js、ai-plate-appearance-outcome.js、docs/defensive-runner-throw-settlement-foundation-v1.md，以及第26節既有測試。稀有規則搜尋範圍為 root production JS，排除 tests/node_modules/.git。沒有找到 producer 與實際重現錯誤會分開標示。

- force：[force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35)
- retire：[force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137)
- forceSettle：[force-advancement.js:87 settleForceAdvancement](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:87)
- build：[script.js:7284 buildInfieldMeaningfulMoment](E:/meng/baseball_life_sim_semirefactor/script.js:7284)
- runner：[script.js:7650 applyDefensiveRunnerOutcome](E:/meng/baseball_life_sim_semirefactor/script.js:7650)
- runnerFacts：[script.js:7724 buildInfieldRunnerFacts](E:/meng/baseball_life_sim_semirefactor/script.js:7724)
- settle：[defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70)
- timing：[defensive-runner-throw-settlement-foundation.js:14 resolveTiming](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:14)
- project：[defensive-runner-throw-settlement-foundation.js:120 projectExistingSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:120)
- decision：[defensive-decision-throw-foundation.js:61 buildDecisionOpportunity](E:/meng/baseball_life_sim_semirefactor/defensive-decision-throw-foundation.js:61)
- dp：[script.js:7964 resolveSecondBaseInitiatedRoute](E:/meng/baseball_life_sim_semirefactor/script.js:7964)
- dpExec：[script.js:8193 resolveInfieldDecision](E:/meng/baseball_life_sim_semirefactor/script.js:8193)
- third：[script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658)
- thirdAdapter：[script.js:10632 finalizeHighSchoolDefensiveThirdOut](E:/meng/baseball_life_sim_semirefactor/script.js:10632)
- thirdType：[script.js:10623 getHighSchoolDefensiveThirdOutType](E:/meng/baseball_life_sim_semirefactor/script.js:10623)
- pa：[script.js:6704 applyHighSchoolSimulatedPlateAppearance](E:/meng/baseball_life_sim_semirefactor/script.js:6704)
- score：[script.js:6633 scoreHighSchoolMatchRunner](E:/meng/baseball_life_sim_semirefactor/script.js:6633)
- inning：[script.js:6824 advanceHighSchoolMatchAfterHalfInning](E:/meng/baseball_life_sim_semirefactor/script.js:6824)
- mutation：[script.js:10903 applyHighSchoolDefensiveSettlementFacts](E:/meng/baseball_life_sim_semirefactor/script.js:10903)
- applyInfield：[script.js:10926 applyInfieldResolutionToHighSchoolMatch](E:/meng/baseball_life_sim_semirefactor/script.js:10926)
- fc：[batted-ball-ground-defense.js:365 derivePACompatibilityResult](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:365)
- groundRunner：[batted-ball-ground-defense.js:144 buildGroundBallRunnerRealization](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:144)
- mapping：[batted-ball-outcome-mapping.js:35 resolveOfficialBallInPlayOutcome](E:/meng/baseball_life_sim_semirefactor/batted-ball-outcome-mapping.js:35)
- retouch：[batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144)
- fly：[batted-ball-fly-ball-defense.js:134 resolveFlyBallCatchExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:134)
- tagLegal：[batted-ball-fly-ball-defense.js:168 buildTagUpLegality](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:168)
- tagExecution：[batted-ball-tag-up-execution.js:39 resolveTagUpExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-tag-up-execution.js:39)
- tagSituation：[script.js:5518 createHighSchoolRunnerTagUpSituation](E:/meng/baseball_life_sim_semirefactor/script.js:5518)
- tagApply：[script.js:5633 settleAndCloseHighSchoolRunnerTagUpSituation](E:/meng/baseball_life_sim_semirefactor/script.js:5633)
- catcher：[script.js:9672 resolveHighSchoolCatcherDecision](E:/meng/baseball_life_sim_semirefactor/script.js:9672)
- render：[script.js:2464 renderHighSchoolLineScore](E:/meng/baseball_life_sim_semirefactor/script.js:2464)
- presentation：[script.js:6085 getHighSchoolMatchPresentation](E:/meng/baseball_life_sim_semirefactor/script.js:6085)
- cursor：[script.js:4446 advanceHighSchoolPresentationCursor](E:/meng/baseball_life_sim_semirefactor/script.js:4446)
- record：[match-game-record.js:265 recordEvent](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:265)
- recordPA：[match-game-record.js:164 recordPlateAppearance](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:164)
- recordRun：[match-game-record.js:205 recordRun](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:205)
- recordRunner：[match-game-record.js:248 recordRunnerEvent](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:248)
- recordBoard：[match-game-record.js:378 getScoreboard](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:378)
- integrity：[match-game-record.js:293 getIntegrityIssues](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:293)
- event：[script.js:4341 recordHighSchoolMatchSimulationEvent](E:/meng/baseball_life_sim_semirefactor/script.js:4341)
- evidence：[high-school-competition-evidence.js:151 integrateFullGameProductionEvidence](E:/meng/baseball_life_sim_semirefactor/high-school-competition-evidence.js:151)

## 4. Runner state model

match.runners 是三格 runnerId/null，不是僅 boolean occupied。Force actor 有 originBase/targetBase/isForced/chainDepth；ground physical state 有 start/progress；runnerContext 有 movementProgress；runnerChanges 有 from/to；generic continuation 保存 pendingRunners/inTransitRunners。

缺的是一致的 entitlement→intent→commit→terminal actor ledger，不是普遍缺少 runner ID。forceState 的布林值是投影，不能取代 movement state。

## 5. Force model

[force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35) 建立真正共用的 initial chain，ground/bunt handoff 重用。空壘到滿壘、非連續壘況有專用測試。

但 [script.js:7284 buildInfieldMeaningfulMoment](E:/meng/baseball_life_sim_semirefactor/script.js:7284) 只有 overrides.forceChain 才把 chain 帶入 situation；getHighSchoolDefensiveForceState 雖建過 chain，回傳的是 compatibility forceState。[script.js:7724 buildInfieldRunnerFacts](E:/meng/baseball_life_sim_semirefactor/script.js:7724) 只在有 chain 且 route 為 doublePlay/secureFirst 時用共用 settle，其他情況走 legacy if/else。結論：**generic initial model 存在，跨路徑的完整 force/settlement 消費契約不完整**。

## 6. Force removal

[force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137) 可正確解除 retired actor 前方 force：BR 先出局會解除全部既有 runner force；lead actor 出局不解除 BR 到一壘要求。generic settlement 有 forceStateAfter。

但 [defensive-decision-throw-foundation.js:61 buildDecisionOpportunity](E:/meng/baseball_life_sim_semirefactor/defensive-decision-throw-foundation.js:61) 明確只接受 initial chain，拒絕 post-settlement chain；script 主要用 projectExistingSettlement，沒有以 generic deriveSettlement 串接完整第二段。這是 continuation/接線缺口，不可說完全沒有 force removal，也不可把純函式 PASS 當完整 BR-out→tag 第二段 PASS。

## 7. Multi-runner settlement

[force-advancement.js:87 settleForceAdvancement](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:87) 能列舉所有 actor 並重建 bases；[defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70) 只結算 first leg，保留 pending/inTransit，沒有虛構第二個 out。

[script.js:7650 applyDefensiveRunnerOutcome](E:/meng/baseball_life_sim_semirefactor/script.js:7650) 的 legacy DP branch 卻凍結 R2/R3；[script.js:10926 applyInfieldResolutionToHighSchoolMatch](E:/meng/baseball_life_sim_semirefactor/script.js:10926) 依聚合 resolution 記 PA、標 settlementApplied，沒有共用的 all-runners-settled barrier。不能把「first-leg seam 正確保留 pending」誤認為全 play 已消費 pending。

## 8. Double play / BUG-01

使用既有 canonical-admission 高三二壘手 fixture，設定0 out、滿壘、正面 hard ground ball、sample=.999，正式 [script.js:8193 resolveInfieldDecision](E:/meng/baseball_life_sim_semirefactor/script.js:8193) 的 challenge 得到 twoOuts/outsCreated=2；runnersAfter=[null,R2,R3]、scoring=[]。這是記憶體執行診斷，沒有冒稱重播使用者原始存檔或 GUI。

builder forceChain=null，即使 forceState.forceAtHome=true、R2/R3 runnerContext 已標 committed，仍落到 legacy survivor branch。相同 facts 傳共用 chain 得 [null,null,R2]、R3 得1分，符合本輪 BUG-01 契約。第三出局 validator 回 halfInningEnded=false、scoringAllowed=true；漏分發生在 scoring attempt 建立之前，**不是第三出局取消得分**。

[script.js:7964 resolveSecondBaseInitiatedRoute](E:/meng/baseball_life_sim_semirefactor/script.js:7964) 有 first/relay windows、playerLeg/teammateLeg，並非只有 boolean；但 resultCode/outsCreated 仍聚合，沒有每個 out 的 actor/type/base/sequence/time 完整序列。outRunnerIds 陣列也不等於通用 ordered-out ledger。

## 9. Tag out

[defensive-runner-throw-settlement-foundation.js:14 resolveTiming](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:14) / [defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70) 要求 force 的 receiver.atBase，tag 的 tagAvailable 與 tagCompletion 先於 runner arrival。既有測試在球仍先到時延後 tag，runner 變 safe，證明不是所有路徑都只看球先到。

一般非本壘後續 leg 尚未串通；[script.js:9672 resolveHighSchoolCatcherDecision](E:/meng/baseball_life_sim_semirefactor/script.js:9672) 仍以 control/throw score 決定 runnerOut，沒有全面使用相同 tag physical facts。

## 10. Third-out scoring

[script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658) 正確區分 force、batterRunnerBeforeFirst、nonForceTag；不是 outs==3 一律取消全部 run。診斷中 force / BR-before-first 取消 beforeThirdOut 的 R3，nonForceTag 保留；既有測試亦驗 afterThirdOut 不計。

限制在上游：[script.js:10632 finalizeHighSchoolDefensiveThirdOut](E:/meng/baseball_life_sim_semirefactor/script.js:10632) 把所有 scoringRunnerIds 硬編 beforeThirdOut；[script.js:10623 getHighSchoolDefensiveThirdOutType](E:/meng/baseball_life_sim_semirefactor/script.js:10623) 依 route 推斷最後出局類型，DP 一律 force，不能重建第二 out 的 BR-before-first 細節。兩種 barred type 對比分可能恰好相同，但語意仍不完整。需要 ordered outs/home touches，而不是改寫已存在的 predicate。

## 11. Walk force

[script.js:6704 applyHighSchoolSimulatedPlateAppearance](E:/meng/baseball_life_sim_semirefactor/script.js:6704) 的 first/second nested logic 正確處理 empty/R1/R1R2/loaded；R3 only 不得分，loaded 才強迫得分。19項 AI integration 亦檢查 SO 不推進跑者。

此規則 IMPLEMENTED，但與 ForceAdvancement 各維護一套邏輯，列 duplication risk。普通 productiveOut/hit token 另帶抽象進壘，沒有共享的 runner committed intent，不可當作完整 live-BIP 物理結算證據。不能把滿壘 forced home 與第三壘單獨有人自動得分混為一談。

## 12. Tag-up

[batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144) / [batted-ball-fly-ball-defense.js:168 buildTagUpLegality](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:168) 保存 catchConfirmed、origin touch、retouchRequired/Satisfied、blocked legality，並非只 reset runners 就聲稱合法。

[script.js:5518 createHighSchoolRunnerTagUpSituation](E:/meng/baseball_life_sim_semirefactor/script.js:5518) 取第一個 candidate，正式 vertical 限 3B→home；[batted-ball-tag-up-execution.js:39 resolveTagUpExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-tag-up-execution.js:39) 有 hold/safe/tagout；[script.js:5633 settleAndCloseHighSchoolRunnerTagUpSituation](E:/meng/baseball_life_sim_semirefactor/script.js:5633) 正式 timing path 走共享 settlement，仍有舊直接 mutation fallback。未完成一般 retouch completion、其他壘或多人 continuation、appeal lifecycle。保守阻擋未 retouch 者不等於已證明其 tag-up 非法。

## 13. Fielder’s choice

[batted-ball-ground-defense.js:365 derivePACompatibilityResult](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:365) 將 BR safe 無條件映成 single，即使 physicalOutcome.officialScoring=deferred；[batted-ball-outcome-mapping.js:35 resolveOfficialBallInPlayOutcome](E:/meng/baseball_life_sim_semirefactor/batted-ball-outcome-mapping.js:35) 接受 settled defense.result，[script.js:10926 applyInfieldResolutionToHighSchoolMatch](E:/meng/baseball_life_sim_semirefactor/script.js:10926) 再記正式 PA。

legacy 有 outs 時記 out、無 outs 時記 single，同樣沒有 FC。缺 fielderChoice vocabulary 是 MISSING 子缺口，但已生效的 safe→single 行為是 CONFLICT：抓 lead runner 成功、BR safe 或全 safe，都不能依安全結果自動授予 H。

## 14. Appeal

未找到 missed-base touch history、appeal state/out、appeal 後 run 重裁 producer。retouch unsatisfied 已存在，所以 early-departure 項為 PARTIAL；其他 appeal 項 MISSING。沒有因缺 appeal 就把目前所有 tag-up 判錯。

## 15. Infield fly

無 infieldFly predicate/token/rule-out/live-continuation。一般 fly catchability 並不等於 ordinary-effort 規則裁定。符合 R1R2/loaded、<2 outs 的 eligible dropped fly 是可構造缺口；未 caught 球可進入一般 hit mapping，而沒有 rule-out。

本輪沒有宣稱已跑到完整 GUI 的 IFF fixture；這是 source-confirmed missing rule transition。需建立 rule-out解除force並保持活球，不能只加 token。

## 16. Inning lifecycle

主要順序：proposed bases/scoringAttempts → third-out validator先得legal/stranded → scoreHighSchoolMatchRunner commit → 更新bases/pendingHalfInningTermination → [script.js:6824 advanceHighSchoolMatchAfterHalfInning](E:/meng/baseball_life_sim_semirefactor/script.js:6824) 記halfInningEnd → clear/swap → sideChange。

bases可能在halfEnd事件前清空，但run validity已先完成，不是「先清壘才裁分」。缺官方全runner LOB ledger：terminal.stranded 是暫存，halfEnd主要保存 playerStranded 與 basesBefore；GameRecord不計LOB。因而為 PARTIAL，不把正確的run-before-clear順序誤判CONFLICT。

## 17. GameRecord

[script.js:4341 recordHighSchoolMatchSimulationEvent](E:/meng/baseball_life_sim_semirefactor/script.js:4341) 將 settled event 交 [match-game-record.js:265 recordEvent](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:265)，PA即增 H/BB/SO，run即增 inning/R。[high-school-competition-evidence.js:151 integrateFullGameProductionEvidence](E:/meng/baseball_life_sim_semirefactor/high-school-competition-evidence.js:151) 從 final GameRecord 複製 stats；實際是 **GameRecord分叉到Scoreboard與CompetitionEvidence**，不是Scoreboard再產生Evidence。

gameplay match.scores/lineScore 仍與 GameRecord totals/inningLines 並存；[match-game-record.js:293 getIntegrityIssues](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:293) 檢查代數關係與event ID，未檢force/FC/所有actor結算。

**新增P0發現**：pitcher.outsRecorded只在PA的before/after差值增加；[match-game-record.js:248 recordRunnerEvent](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:248) 處理SB/CS，沒有處理獨立 runnerTagUpResolution out。ingestion診斷（不是完整GUI tag-up重播）傳before.outs=1/after.outs=2，eventRecorded=1、pitcherOuts=0、integrityIssues=[]。這會影響投球局數、run-prevention分母及Evidence。

## 18. Scoreboard H / BUG-02

一次已settled single，[match-game-record.js:164 recordPlateAppearance](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:164) 同步把 batter H與team hits各+1。[match-game-record.js:378 getScoreboard](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:378) 接受active record，不需要final；model.hits可讀到1。

真正遮罩在 [script.js:2464 renderHighSchoolLineScore](E:/meng/baseball_life_sim_semirefactor/script.js:2464)：model.completed ? team.hits : "—"。**本HEAD要求整場completed，不是半局結束**。使用者觀察到半局後才更新，不能讓報告忽略這個更嚴格的code門檻。最小修復層是游標一致的projection/renderer，不應延後或挪動GameRecord記H。

## 19. Current-inning R / BUG-03

診斷透過正式single讓原3B跑者得分，canonical total R=1、inningRuns=1、model.runs[0]=1、visibleTotal=1，但cell="…"。

[script.js:6085 getHighSchoolMatchPresentation](E:/meng/baseball_life_sim_semirefactor/script.js:6085) 的halfIndex===revealHalfIndex固定輸出ellipsis；[script.js:4446 advanceHighSchoolPresentationCursor](E:/meng/baseball_life_sim_semirefactor/script.js:4446) 遇sideChange推reveal，playback亦逐半局展開歷史。即使presentedEventCursor已追上、reveal已對齊目前半局，仍隱藏current cell。這是將未finalized等同未有可見資料；不是run event晚入帳。

## 20. Known bug root-cause classification

| Bug | Reproduction | Root authority | Classification |
|---|---|---|---|
| BUG-01 | 正式resolver twoOuts，R2/R3留原壘、0 run | builder → buildInfieldRunnerFacts → applyDefensiveRunnerOutcome | P0 force-chain接線／survivor settlement分裂；不是沒有任何force模型，也不是third-out取消run |
| BUG-02 | canonical H=1、model H=1、render H=— | renderHighSchoolLineScore.renderTeam | P2 completed-gated render，現HEAD是整場門檻 |
| BUG-03 | canonical inningR=1、model.runs=1、cell=… | getHighSchoolMatchPresentation.createTeamPresentation | P2 current-half cell / reveal policy |

## 21. Required matrix

31條：IMPLEMENTED 6、PARTIAL 13、CONFLICT 7、MISSING 5。OUT_OF_SCOPE見第25節。IMPLEMENTED的P0代表該規則影響層級重要，不表示仍有P0 bug。

| RULE ID | 中文名稱 | English Name | STATUS | SEVERITY | AUTHORITY | PRIMARY GAP |
|---|---|---|---|---|---|---|
| RUN-FORCE-001 | 打者跑者一壘權利 | Batter first-base entitlement | IMPLEMENTED | P0 | [force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35) | 初始契約成立；不代表後續所有路徑消費同一鏈。 |
| RUN-FORCE-002 | 一壘強迫進壘 | First-base force | PARTIAL | P0 | [force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35) | initial force 與 movement intent／後續結算未統一。 |
| RUN-FORCE-003 | 連鎖強迫進壘 | Chained force advancement | CONFLICT | P0 | [script.js:7284 buildInfieldMeaningfulMoment](E:/meng/baseball_life_sim_semirefactor/script.js:7284) | 建立的布林 forceState 與實際 survivor 結算分離。 |
| RUN-FORCE-004 | 無後方推擠不強迫 | No disconnected force | IMPLEMENTED | P0 | [force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35) | 成立於 initial force 與受查路徑；explicit advance 必須另行判定。 |
| RUN-FORCE-005 | 出局後解除強迫 | Force removal | PARTIAL | P0 | [force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137) | Decision builder 只接受 initial chain，通用第二段 consumer 未完成；舊 aggregate settlement 不依 ordered retirement 動態裁定。 |
| RUN-MULTI-001 | 全跑者結算 | All-runner settlement | CONFLICT | P0 | [script.js:7650 applyDefensiveRunnerOutcome](E:/meng/baseball_life_sim_semirefactor/script.js:7650) | 沒有跨路徑的完整 continuation drain / all-actors-settled barrier。 |
| RUN-MULTI-002 | 跑者身分與結算完整性 | Runner identity and completion | PARTIAL | P0 | [defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70) | 各 state 欄位不同；沒有統一 committed + terminal status，legacy 未用 intents。 |
| RUN-TAG-001 | 非強迫需觸殺 | Non-force tag required | PARTIAL | P0 | [defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70) | 非本壘的 generic leg 尚無完整 production continuation；舊路線及 catcher 分數判定無普遍 tag facts。 |
| RUN-TAG-002 | 解除強迫後需觸殺 | Tag after force removal | PARTIAL | P0 | [force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137) | 兩者尚未連成可繼續執行的第二段 authority；不得把兩個 unit PASS 當整 play PASS。 |
| OUT-DP-001 | 依序保存雙殺出局 | Ordered double-play outs | PARTIAL | P0 | [script.js:7964 resolveSecondBaseInitiatedRoute](E:/meng/baseball_life_sim_semirefactor/script.js:7964) | outRunnerIds 不是具各自 type/time 的 ordered out ledger；第三出局類型以路線推斷。 |
| OUT-DP-002 | 雙殺倖存跑者推進 | Survivors during double play | CONFLICT | P0 | [script.js:7650 applyDefensiveRunnerOutcome](E:/meng/baseball_life_sim_semirefactor/script.js:7650) | fallback 不消費已標 committed 的 R2/R3。 |
| RUN-SCORE-001 | 本壘觸及先暫定 | Provisional home touch | PARTIAL | P0 | [script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658) | 缺少共用 crossing timeline；defensive finalizer 把所有 scoringRunnerIds 一律標 beforeThirdOut。 |
| RUN-SCORE-002 | 強迫第三出局不計分 | Force third out cancels runs | IMPLEMENTED | P0 | [script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658) | 成立以正確第三出局類型輸入為前提。 |
| RUN-SCORE-003 | 打者一壘前第三出局不計分 | Batter before first cancels runs | IMPLEMENTED | P0 | [script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658) | 普通 out 路徑用該類型；未建 appeal 類型。 |
| RUN-SCORE-004 | 非強迫第三出局時間判定 | Timing-play run validity | PARTIAL | P0 | [script.js:10632 finalizeHighSchoolDefensiveThirdOut](E:/meng/baseball_life_sim_semirefactor/script.js:10632) | production finalizer 對所有 scoring IDs硬編 beforeThirdOut；無通用 ordered crossing。 |
| RUN-WALK-001 | 保送強迫鏈 | Walk force chain | IMPLEMENTED | P0 | [script.js:6704 applyHighSchoolSimulatedPlateAppearance](E:/meng/baseball_life_sim_semirefactor/script.js:6704) | 與 ForceAdvancement 獨立維護，屬 architecture duplication；本輪未見所列壘況語意錯誤。 |
| RUN-TAGUP-001 | 接殺後再觸壘與進壘 | Retouch and tag-up | PARTIAL | P1 | [batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144) | 不觸原壘時blocked；無通用retouch completion/appeal；只選候選第一人且垂直範圍3B→home。 |
| RUN-FC-001 | 野選不自動記安打 | Fielder choice is not a hit | CONFLICT | P0 | [batted-ball-ground-defense.js:365 derivePACompatibilityResult](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:365) | 無 fielderChoice token；BR safe即single。legacy有outs則out也未保存FC原因。 |
| RUN-FC-002 | 野選全安全仍需記錄裁定 | All-safe fielder-choice scoring | CONFLICT | P0 | [batted-ball-ground-defense.js:365 derivePACompatibilityResult](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:365) | 結果安全與安打裁定混為一談；officialScoring deferred仍送入正式統計。 |
| RUN-APPEAL-001 | 漏踩壘申訴 | Missed-base appeal | MISSING | P1 | [batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144) | 缺base touch history與appeal生命周期。 |
| RUN-APPEAL-002 | 提早離壘申訴 | Early-departure appeal | PARTIAL | P1 | [batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144) | 沒有提出/結算appeal；只是較保守的合法性gate。 |
| RUN-APPEAL-003 | 申訴後出局得分重裁 | Appeal outcome and run revalidation | MISSING | P1 | [script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658) | 沒有appeal out、觸壘序或後續重裁狀態；包含額外出局申訴尚未建。 |
| BIP-IFF-001 | 內野高飛必死球條件 | Infield-fly eligibility | MISSING | P0 | [batted-ball-fly-ball-defense.js:134 resolveFlyBallCatchExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:134) | 缺條件集合與ordinaryEffort規則判定；未把一般physical catchability當規則。 |
| BIP-IFF-002 | 內野高飛規則出局仍活球 | Infield-fly out with live ball | MISSING | P0 | [batted-ball-fly-ball-defense.js:134 resolveFlyBallCatchExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:134) | 缺rule-out與catch-out分離。 |
| BIP-IFF-003 | 內野高飛跑者後續 | Infield-fly runner continuation | MISSING | P0 | [force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137) | 缺IFF→retirement→live runner continuation wiring。 |
| INNING-001 | 半局生命週期 | Half-inning lifecycle | PARTIAL | P0 | [script.js:6824 advanceHighSchoolMatchAfterHalfInning](E:/meng/baseball_life_sim_semirefactor/script.js:6824) | 沒有官方全員LOB ledger；pending stranded非持久LOB。clear雖早於halfEnd事件，但晚於run判定，不是先清壘才裁分。 |
| SCOREBOARD-001 | 即時安打欄 | Live hit total | CONFLICT | P2 | [script.js:2464 renderHighSchoolLineScore](E:/meng/baseball_life_sim_semirefactor/script.js:2464) | renderTeam使用model.completed門檻；不是只半局門檻。 |
| SCOREBOARD-002 | 當前半局得分格 | Current-half run cell | CONFLICT | P2 | [script.js:6085 getHighSchoolMatchPresentation](E:/meng/baseball_life_sim_semirefactor/script.js:6085) | 把當前可見半局與未知資料等同。 |
| SCOREBOARD-003 | 播放游標一致投影 | Cursor-consistent scoreboard | PARTIAL | P2 | [script.js:4446 advanceHighSchoolPresentationCursor](E:/meng/baseball_life_sim_semirefactor/script.js:4446) | 直接解除H遮罩會洩漏尚未播放canonical future；沒有同游標的H投影。 |
| RECORD-001 | 事件驅動官方紀錄 | Canonical event record | IMPLEMENTED | P0 | [match-game-record.js:265 recordEvent](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:265) | 此結論只關於ingestion，不證明上游規則正確。 |
| RECORD-002 | 記錄與規則一致性 | Rules-to-record consistency | PARTIAL | P0 | [match-game-record.js:293 getIntegrityIssues](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:293) | 除不驗force/FC外，pitcher.outsRecorded只在PA事件增加；runnerTagUpResolution的出局不由recordRunnerEvent計入。事件可被接納且integrity無報錯。 |

### RUN-FORCE-001 — 打者跑者一壘權利

- Expected：uncaught fair BIP 建立 BR→1B entitlement。
- Current / state：buildInitialLiveBallForceChain.batterRunner / chainDepth=0 明確建立；ground-ball handoff 重用。
- Exact gap：初始契約成立；不代表後續所有路徑消費同一鏈。
- Scenario / diagnostic：空壘 fair ground ball。
- Downstream：BR targetBase 與守備一壘出局。
- Authority：[force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35)
- Repair layer：Cluster A
- Existing test：[force-advancement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/force-advancement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-FORCE-002 — 一壘強迫進壘

- Expected：R1 由 BR 推往 2B。
- Current / state：共用鏈正確；舊 builder 僅保存 forceState，runnerContext R1 可仍標 holding。
- Exact gap：initial force 與 movement intent／後續結算未統一。
- Scenario / diagnostic：R1 ground ball，走無 physicalOverrides 的內野路徑。
- Downstream：runner movement、force contest。
- Authority：[force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35)
- Repair layer：Cluster A/B
- Existing test：[force-advancement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/force-advancement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-FORCE-003 — 連鎖強迫進壘

- Expected：一二壘／滿壘逐級建立 required movement；BUG-01 survivor 應完成契約指定進壘。
- Current / state：共用 force chain 可到 home；普通 builder forceChain=null，DP fallback 固定保留 R2/R3。
- Exact gap：建立的布林 forceState 與實際 survivor 結算分離。
- Scenario / diagnostic：0 out loaded successful 4-6-3：實得 2 out、R2/R3 原壘、0 run。
- Downstream：比分、壘況、R/RBI、Evidence。
- Authority：[script.js:7284 buildInfieldMeaningfulMoment](E:/meng/baseball_life_sim_semirefactor/script.js:7284)
- Repair layer：Cluster A/B
- Existing test：[force-advancement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/force-advancement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-FORCE-004 — 無後方推擠不強迫

- Expected：2B only、3B only、2B+3B 無 BR force；1B+3B 僅 R1 forced。
- Current / state：force chain 遇空壘停止，unforcedRunners 保留 identity；walk/secureFirst 對第三壘單獨有人不憑空得分。
- Exact gap：成立於 initial force 與受查路徑；explicit advance 必須另行判定。
- Scenario / diagnostic：所有非連續壘況。
- Downstream：force target 合法性。
- Authority：[force-advancement.js:35 buildInitialLiveBallForceChain](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:35)
- Repair layer：Cluster A
- Existing test：[force-advancement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/force-advancement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-FORCE-005 — 出局後解除強迫

- Expected：BR 先出局則前方 runners 解除 force。
- Current / state：deriveForceChainAfterRetirements 正確移除 depth 之後的 forced actors；after state 有保存。
- Exact gap：Decision builder 只接受 initial chain，通用第二段 consumer 未完成；舊 aggregate settlement 不依 ordered retirement 動態裁定。
- Scenario / diagnostic：BR 先在一壘出局，繼續傳二壘。
- Downstream：若沿用初始 force 會錯把踩壘當 out；本輪未觀測完整第二段。
- Authority：[force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137)
- Repair layer：Cluster A/B
- Existing test：[defensive-runner-throw-settlement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/defensive-runner-throw-settlement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-MULTI-001 — 全跑者結算

- Expected：每個 active runner 的 intent、retirement、survival 都需在 finalize 前結算。
- Current / state：共用 settle 枚舉 actors；generic first leg 保留 pending/inTransit；legacy DP 只處理兩個 out 並凍結 survivors。
- Exact gap：沒有跨路徑的完整 continuation drain / all-actors-settled barrier。
- Scenario / diagnostic：BUG-01 loaded DP。
- Downstream：丟失推進與得分，錯誤半局輸入。
- Authority：[script.js:7650 applyDefensiveRunnerOutcome](E:/meng/baseball_life_sim_semirefactor/script.js:7650)
- Repair layer：Cluster B
- Existing test：[defensive-runner-throw-settlement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/defensive-runner-throw-settlement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-MULTI-002 — 跑者身分與結算完整性

- Expected：runnerId/origin/target/forced/committed/out/scored 可追且所有 actor 有終態。
- Current / state：bases 是 ID/null，不是僅 boolean；force/physical/runnerChanges 有 ID，generic pending 也保留 ID。
- Exact gap：各 state 欄位不同；沒有統一 committed + terminal status，legacy 未用 intents。
- Scenario / diagnostic：目標壘 occupied 且 runner 還在途中。
- Downstream：continuation 若未消費會遺留或誤覆寫 actor。
- Authority：[defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70)
- Repair layer：Cluster B
- Existing test：[defensive-runner-throw-settlement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/defensive-runner-throw-settlement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-TAG-001 — 非強迫需觸殺

- Expected：非 forced runner，踩壘先到不足以構成 out。
- Current / state：generic deriveSettlement 明確比較 tagAvailable/tagCompletion；home detailed/tag-up 有 tag leg。
- Exact gap：非本壘的 generic leg 尚無完整 production continuation；舊路線及 catcher 分數判定無普遍 tag facts。
- Scenario / diagnostic：R2 only 自願跑3B；或 catcher 抓離壘者。
- Downstream：錯誤 out/third-out type 的結構風險。
- Authority：[defensive-runner-throw-settlement-foundation.js:70 deriveSettlement](E:/meng/baseball_life_sim_semirefactor/defensive-runner-throw-settlement-foundation.js:70)
- Repair layer：Cluster A/B
- Existing test：[defensive-runner-throw-settlement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/defensive-runner-throw-settlement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-TAG-002 — 解除強迫後需觸殺

- Expected：BR 先出局後，R1 須 tag，不能只踩2B。
- Current / state：retirement projection 成立、tag first-leg 成立。
- Exact gap：兩者尚未連成可繼續執行的第二段 authority；不得把兩個 unit PASS 當整 play PASS。
- Scenario / diagnostic：BR-out→R1 contest。
- Downstream：force/tag/out/run validity。
- Authority：[force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137)
- Repair layer：Cluster A/B
- Existing test：[defensive-runner-throw-settlement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/defensive-runner-throw-settlement-foundation-test.js)（覆蓋範圍依上文限制）

### OUT-DP-001 — 依序保存雙殺出局

- Expected：保存每個 out 的 actor/type/base/sequence，按順序更新 force。
- Current / state：二壘 detailed route 有 first/relay windows、playerLeg/teammateLeg；terminal 卻以 resultCode/outsCreated 聚合。
- Exact gap：outRunnerIds 不是具各自 type/time 的 ordered out ledger；第三出局類型以路線推斷。
- Scenario / diagnostic：twoOuts 成立，或先 BR 再tag的雙殺。
- Downstream：force removal 與第三出局分類無法完整重建。
- Authority：[script.js:7964 resolveSecondBaseInitiatedRoute](E:/meng/baseball_life_sim_semirefactor/script.js:7964)
- Repair layer：Cluster B/C
- Existing test：[high-school-integration-1-2-2-2-test.js](E:/meng/baseball_life_sim_semirefactor/tests/high-school-integration-1-2-2-2-test.js)（覆蓋範圍依上文限制）

### OUT-DP-002 — 雙殺倖存跑者推進

- Expected：DP 不凍結其他 runner。
- Current / state：Force settle 可給 loaded 正確結果；legacy doublePlay twoOuts 回 [null,R2,R3]。
- Exact gap：fallback 不消費已標 committed 的 R2/R3。
- Scenario / diagnostic：BUG-01。
- Downstream：少1分、R2未到3B。
- Authority：[script.js:7650 applyDefensiveRunnerOutcome](E:/meng/baseball_life_sim_semirefactor/script.js:7650)
- Repair layer：Cluster B
- Existing test：[force-advancement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/force-advancement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-SCORE-001 — 本壘觸及先暫定

- Expected：provisional scoring→第三出局→legal run commit。
- Current / state：主要 adapter 先建 scoringAttempts，經 validator 才呼叫 scoreHighSchoolMatchRunner。
- Exact gap：缺少共用 crossing timeline；defensive finalizer 把所有 scoringRunnerIds 一律標 beforeThirdOut。
- Scenario / diagnostic：多runner在tag第三出局前後先後過本壘。
- Downstream：run可能依錯誤 timing label 被接納。
- Authority：[script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658)
- Repair layer：Cluster C
- Existing test：[third-out-runner-resolution-integrity-v1-test.js](E:/meng/baseball_life_sim_semirefactor/tests/third-out-runner-resolution-integrity-v1-test.js)（覆蓋範圍依上文限制）

### RUN-SCORE-002 — 強迫第三出局不計分

- Expected：force third out 取消同play得分。
- Current / state：validator scoringBarredByOutType；fixture beforeThirdOut 也被取消。
- Exact gap：成立以正確第三出局類型輸入為前提。
- Scenario / diagnostic：2 outs+force out+同play home touch。
- Downstream：legalScoringRunnerIds=[]。
- Authority：[script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658)
- Repair layer：Cluster C
- Existing test：[third-out-runner-resolution-integrity-v1-test.js](E:/meng/baseball_life_sim_semirefactor/tests/third-out-runner-resolution-integrity-v1-test.js)（覆蓋範圍依上文限制）

### RUN-SCORE-003 — 打者一壘前第三出局不計分

- Expected：BR 一壘前第三出局取消同play得分。
- Current / state：batterRunnerBeforeFirst 與 force 同樣排除 scoring。
- Exact gap：普通 out 路徑用該類型；未建 appeal 類型。
- Scenario / diagnostic：2 outs+BR一壘前出局。
- Downstream：run commit 正確取消。
- Authority：[script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658)
- Repair layer：Cluster C
- Existing test：[third-out-runner-resolution-integrity-v1-test.js](E:/meng/baseball_life_sim_semirefactor/tests/third-out-runner-resolution-integrity-v1-test.js)（覆蓋範圍依上文限制）

### RUN-SCORE-004 — 非強迫第三出局時間判定

- Expected：tag third out 前合法到home可計；之後不得計。
- Current / state：validator 接納 beforeThirdOut、拒絕 afterThirdOut；generic seam 可傳不同label。
- Exact gap：production finalizer 對所有 scoring IDs硬編 beforeThirdOut；無通用 ordered crossing。
- Scenario / diagnostic：多人跑者同play tag第三出局。
- Downstream：有predicate，缺完整producer時間證據。
- Authority：[script.js:10632 finalizeHighSchoolDefensiveThirdOut](E:/meng/baseball_life_sim_semirefactor/script.js:10632)
- Repair layer：Cluster C
- Existing test：[defensive-runner-throw-settlement-foundation-test.js](E:/meng/baseball_life_sim_semirefactor/tests/defensive-runner-throw-settlement-foundation-test.js)（覆蓋範圍依上文限制）

### RUN-WALK-001 — 保送強迫鏈

- Expected：empty/R1/R1R2/loaded 推進；R3 only留壘。
- Current / state：applyHighSchoolSimulatedPlateAppearance 的 nested first/second 正確實作。
- Exact gap：與 ForceAdvancement 獨立維護，屬 architecture duplication；本輪未見所列壘況語意錯誤。
- Scenario / diagnostic：loaded walk +1；R3 only walk +0。
- Downstream：bases、BB、R一致。
- Authority：[script.js:6704 applyHighSchoolSimulatedPlateAppearance](E:/meng/baseball_life_sim_semirefactor/script.js:6704)
- Repair layer：Cluster A
- Existing test：[ai-plate-appearance-outcome-production-integration-test.js](E:/meng/baseball_life_sim_semirefactor/tests/ai-plate-appearance-outcome-production-integration-test.js)（覆蓋範圍依上文限制）

### RUN-TAGUP-001 — 接殺後再觸壘與進壘

- Expected：caught batter out；runner legal retouch 後方可advance。
- Current / state：catchResult、readState、retouchRequired/Satisfied、tagUpLegality 有狀態；3B→home有正式執行。
- Exact gap：不觸原壘時blocked；無通用retouch completion/appeal；只選候選第一人且垂直範圍3B→home。
- Scenario / diagnostic：R1/R2 tag-up、先離壘再回壘、多人tag-up。
- Downstream：可能保守holding或尚未執行，不可概括為全部非法。
- Authority：[batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144)
- Repair layer：Cluster D
- Existing test：[bbp-b2b2-tag-up-decision-execution-test.js](E:/meng/baseball_life_sim_semirefactor/tests/bbp-b2b2-tag-up-decision-execution-test.js)（覆蓋範圍依上文限制）

### RUN-FC-001 — 野選不自動記安打

- Expected：守備抓existing runner而BR上1B，不能自動H。
- Current / state：physical compatibility 按 batter out/safe 映成 out/single；正式mapper承接settled result。
- Exact gap：無 fielderChoice token；BR safe即single。legacy有outs則out也未保存FC原因。
- Scenario / diagnostic：lead runner force out、BR safe。
- Downstream：H/AB/RBI與selection evidence失真。
- Authority：[batted-ball-ground-defense.js:365 derivePACompatibilityResult](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:365)
- Repair layer：Cluster F
- Existing test：[match-full-game-record-test.js](E:/meng/baseball_life_sim_semirefactor/tests/match-full-game-record-test.js)（覆蓋範圍依上文限制）

### RUN-FC-002 — 野選全安全仍需記錄裁定

- Expected：lead-runner attempt全safe仍需scorer判定，不能直接single。
- Current / state：derivePACompatibilityResult safe→single，routine adapter zeroOuts亦single。
- Exact gap：結果安全與安打裁定混為一談；officialScoring deferred仍送入正式統計。
- Scenario / diagnostic：throw lead runner late，全safe。
- Downstream：H與pitcher H被高估。
- Authority：[batted-ball-ground-defense.js:365 derivePACompatibilityResult](E:/meng/baseball_life_sim_semirefactor/batted-ball-ground-defense.js:365)
- Repair layer：Cluster F
- Existing test：[batted-ball-outcome-production-integration-test.js](E:/meng/baseball_life_sim_semirefactor/tests/batted-ball-outcome-production-integration-test.js)（覆蓋範圍依上文限制）

### RUN-APPEAL-001 — 漏踩壘申訴

- Expected：missed base事件、pending appeal及out裁定可表達。
- Current / state：未找到missed-base或appeal producer/state/token。
- Exact gap：缺base touch history與appeal生命周期。
- Scenario / diagnostic：跑者漏踩2B後到3B；目前不能表達。
- Downstream：此類out/run修正無法執行；非已重現GUI事件。
- Authority：[batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144)
- Repair layer：Cluster D
- Existing test：未找到對應專用測試；沒有新增測試。

### RUN-APPEAL-002 — 提早離壘申訴

- Expected：caught-ball未retouch可被申訴，不等同自動全員錯誤。
- Current / state：retouch unsatisfied 已表達並阻擋tag-up。
- Exact gap：沒有提出/結算appeal；只是較保守的合法性gate。
- Scenario / diagnostic：left-early / retreatUnresolved runner。
- Downstream：不能處理defense appeal out。
- Authority：[batted-ball-fly-ball-defense.js:144 buildRetouchState](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:144)
- Repair layer：Cluster D
- Existing test：[bbp-b2b1-fly-ball-tag-up-legality-test.js](E:/meng/baseball_life_sim_semirefactor/tests/bbp-b2b1-fly-ball-tag-up-legality-test.js)（覆蓋範圍依上文限制）

### RUN-APPEAL-003 — 申訴後出局得分重裁

- Expected：申訴裁定需串回out/run validity。
- Current / state：thirdOut types僅force/batterBeforeFirst/nonForceTag/none。
- Exact gap：沒有appeal out、觸壘序或後續重裁狀態；包含額外出局申訴尚未建。
- Scenario / diagnostic：已過home後發現需申訴的漏壘。
- Downstream：run/inning不能按該程序重裁。
- Authority：[script.js:6658 resolveHighSchoolThirdOutIntegrity](E:/meng/baseball_life_sim_semirefactor/script.js:6658)
- Repair layer：Cluster D/C
- Existing test：未找到對應專用測試；沒有新增測試。

### BIP-IFF-001 — 內野高飛必死球條件

- Expected：R1R2或loaded、<2outs、fair非bunt非LD且ordinary-effort內野可接。
- Current / state：只有一般fly physical/access/catch route，無規則predicate。
- Exact gap：缺條件集合與ordinaryEffort規則判定；未把一般physical catchability當規則。
- Scenario / diagnostic：符合條件pop fly，實際漏接。
- Downstream：BR可能被當safe，force未解除。
- Authority：[batted-ball-fly-ball-defense.js:134 resolveFlyBallCatchExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:134)
- Repair layer：Cluster A/F
- Existing test：未找到對應專用測試；沒有新增測試。

### BIP-IFF-002 — 內野高飛規則出局仍活球

- Expected：batter依rule出局不依實際接到，ball remains live。
- Current / state：無infieldFly token/branch；caught結果才產生out，未caught可mapping成hit。
- Exact gap：缺rule-out與catch-out分離。
- Scenario / diagnostic：eligible fly dropped；是可構造production input類型，非已重現正式IFF fixture。
- Downstream：outs、BR state、force錯誤。
- Authority：[batted-ball-fly-ball-defense.js:134 resolveFlyBallCatchExecution](E:/meng/baseball_life_sim_semirefactor/batted-ball-fly-ball-defense.js:134)
- Repair layer：Cluster A/F
- Existing test：未找到對應專用測試；沒有新增測試。

### BIP-IFF-003 — 內野高飛跑者後續

- Expected：rule-out解除BR force，caught時仍需retouch；未caught仍活球。
- Current / state：retirement模組有能力但無IFF caller。
- Exact gap：缺IFF→retirement→live runner continuation wiring。
- Scenario / diagnostic：eligible dropped fly後守方踩2B。
- Downstream：錯誤force-out與壘況風險。
- Authority：[force-advancement.js:137 deriveForceChainAfterRetirements](E:/meng/baseball_life_sim_semirefactor/force-advancement.js:137)
- Repair layer：Cluster A/B/F
- Existing test：未找到對應專用測試；沒有新增測試。

### INNING-001 — 半局生命週期

- Expected：先裁run、finalize play/half、記LOB，再clear/swap。
- Current / state：先validator得legalScoring及stranded，再commit run/clear bases，pending保存；halfEnd後swap。
- Exact gap：沒有官方全員LOB ledger；pending stranded非持久LOB。clear雖早於halfEnd事件，但晚於run判定，不是先清壘才裁分。
- Scenario / diagnostic：2 outs+最後出局+留壘者。
- Downstream：LOB資料不完整，需保留finalization順序。
- Authority：[script.js:6824 advanceHighSchoolMatchAfterHalfInning](E:/meng/baseball_life_sim_semirefactor/script.js:6824)
- Repair layer：Cluster B/C
- Existing test：[third-out-runner-resolution-integrity-v1-test.js](E:/meng/baseball_life_sim_semirefactor/tests/third-out-runner-resolution-integrity-v1-test.js)（覆蓋範圍依上文限制）

### SCOREBOARD-001 — 即時安打欄

- Expected：已settled且已展示的H應即時顯示。
- Current / state：record H即增、model.hits=1，render卻因completed=false顯示—。
- Exact gap：renderTeam使用model.completed門檻；不是只半局門檻。
- Scenario / diagnostic：已展示single但整場未終場。
- Downstream：畫面H缺值，canonical H正確。
- Authority：[script.js:2464 renderHighSchoolLineScore](E:/meng/baseball_life_sim_semirefactor/script.js:2464)
- Repair layer：Cluster E
- Existing test：[match-full-game-record-test.js](E:/meng/baseball_life_sim_semirefactor/tests/match-full-game-record-test.js)（覆蓋範圍依上文限制）

### SCOREBOARD-002 — 當前半局得分格

- Expected：當前半局已展示得分應顯示目前數字。
- Current / state：canonical inningRuns=1/model.runs=1，但halfIndex==revealHalfIndex時cell固定…；R可為1。
- Exact gap：把當前可見半局與未知資料等同。
- Scenario / diagnostic：同一半局已得1分，尚未3out。
- Downstream：inning cell延遲；score record不遲。
- Authority：[script.js:6085 getHighSchoolMatchPresentation](E:/meng/baseball_life_sim_semirefactor/script.js:6085)
- Repair layer：Cluster E
- Existing test：[high-school-integration-1-2-2-2-test.js](E:/meng/baseball_life_sim_semirefactor/tests/high-school-integration-1-2-2-2-test.js)（覆蓋範圍依上文限制）

### SCOREBOARD-003 — 播放游標一致投影

- Expected：所有R/H/inning數字只顯示目前已播放事件。
- Current / state：R/currentSituation讀presentation snapshot；hits讀完整canonical totals；historical reveal另遮數值。
- Exact gap：直接解除H遮罩會洩漏尚未播放canonical future；沒有同游標的H投影。
- Scenario / diagnostic：simulation跑在presentation前方。
- Downstream：比分板欄位時間不一致。
- Authority：[script.js:4446 advanceHighSchoolPresentationCursor](E:/meng/baseball_life_sim_semirefactor/script.js:4446)
- Repair layer：Cluster E
- Existing test：[high-school-integration-1-2-2-2-test.js](E:/meng/baseball_life_sim_semirefactor/tests/high-school-integration-1-2-2-2-test.js)（覆蓋範圍依上文限制）

### RECORD-001 — 事件驅動官方紀錄

- Expected：正式PA/run事件各一次進GameRecord。
- Current / state：recordEvent以eventId冪等；PA即增H/BB/SO，run即增inning/R；scoreboard為clone projection。
- Exact gap：此結論只關於ingestion，不證明上游規則正確。
- Scenario / diagnostic：single、walk、SO、run、重播event。
- Downstream：Stats canonical owner清楚。
- Authority：[match-game-record.js:265 recordEvent](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:265)
- Repair layer：Cluster F
- Existing test：[match-full-game-record-test.js](E:/meng/baseball_life_sim_semirefactor/tests/match-full-game-record-test.js)（覆蓋範圍依上文限制）

### RECORD-002 — 記錄與規則一致性

- Expected：統計應反映完整且合法的play outcomes。
- Current / state：integrity檢查H/AB、team H、run totals、event IDs等代數關係。
- Exact gap：除不驗force/FC外，pitcher.outsRecorded只在PA事件增加；runnerTagUpResolution的出局不由recordRunnerEvent計入。事件可被接納且integrity無報錯。
- Scenario / diagnostic：獨立tag-up第三段runner out：before.outs=1、after.outs=2，recorded event=1但pitcher outs=0；為ingestion診斷，未冒稱完整GUI重播。
- Downstream：GameRecord與Evidence忠實放大上游錯誤。
- Authority：[match-game-record.js:293 getIntegrityIssues](E:/meng/baseball_life_sim_semirefactor/match-game-record.js:293)
- Repair layer：Cluster B/C/F
- Existing test：[full-game-competition-evidence-test.js](E:/meng/baseball_life_sim_semirefactor/tests/full-game-competition-evidence-test.js)（覆蓋範圍依上文限制）

## 22. Architecture findings A–H

- A. Canonical authorities：initial/retired force、physical runner arrival、detailed throw、third-out predicate、match mutation及GameRecord ingestion皆有可判定owner。

- B. Duplicated authorities：Force.settle、legacy applyDefensiveRunnerOutcome、walk nested rules、catcher及tag-up fallback；match.scores/lineScore與record totals/inningLines。

- C. Implicit state：route→out type、resultCode→out count、safe→single、score ID→beforeThirdOut。

- D. Missing state：全actor committed/terminal ledger、ordered outs/home touches、通用next-leg consumer、FC scorer、IFF、appeal、official LOB。

- E. Premature finalization：applyInfieldResolutionToHighSchoolMatch依aggregate facts提交PA與settlementApplied；沒有阻擋未settled survivor。generic first-leg正確保留pending，本身沒有假裝完成第二個out。

- F. Record risks：漏run或錯FC token仍可代數一致；runner-only out未記pitcher outs；Evidence會保留上游錯誤。

- G. Projection risks：R讀snapshot，H讀完整record再遮罩；直接移除H遮罩可能洩漏未播放future H。需要同cursor投影。

- H. Highest-risk clusters：A→B→C與F；E可獨立。既有1.3文件明言generic第二段deferred，與code相符，沒有ownership不可判定的嚴重文件衝突。

## 23. Repair clusters

### Cluster A — Force / Entitlement Integration

- Rules：RUN-FORCE-001～005, RUN-WALK-001, RUN-TAG-002, BIP-IFF-003
- Files：force-advancement.js, script.js, defensive-decision-throw-foundation.js, batted-ball-ground-defense.js, offensive-bunt-defensive-handoff.js
- Dependency：可獨立起始
- Architectural risk：HIGH
- Proposal：保留既有 initial/retirement foundation，讓所有路徑攜帶同一 play force/entitlement，區分 initial force、當前 force 與 committed movement；不是重新發明不存在的 force graph。

### Cluster B — Multi-Runner / Ordered-Out Settlement

- Rules：RUN-MULTI-001～002, OUT-DP-001～002, RUN-TAG-001～002, INNING-001
- Files：script.js, defensive-runner-throw-settlement-foundation.js, force-advancement.js, match-situation-lifecycle.js
- Dependency：A
- Architectural risk：HIGH
- Proposal：以全 actor 的 pending/inTransit/terminal 狀態、ordered outs 與 finalization barrier 統一結算，保留 detailed execution。不要只替滿壘 DP 補一條得分 if。

### Cluster C — Third-Out / Run Validation

- Rules：RUN-SCORE-001～004, INNING-001, RECORD-002
- Files：script.js, defensive-runner-throw-settlement-foundation.js, match-game-record.js
- Dependency：A → B
- Architectural risk：HIGH
- Proposal：保留 third-out predicate，補最後 out 的實際 type/sequence 與各 runner home-touch timing、LOB。取消全體 scoring ID 硬編 beforeThirdOut 的假設。

### Cluster D — Tag-Up / Retouch / Appeal

- Rules：RUN-TAGUP-001, RUN-APPEAL-001～003
- Files：batted-ball-fly-ball-defense.js, batted-ball-line-drive-defense.js, batted-ball-tag-up-execution.js, script.js, match-situation-lifecycle.js
- Dependency：A → B → C
- Architectural risk：HIGH
- Proposal：先確認擴充範圍，再建立 retouch completion、其他壘及多人 continuation、appeal lifecycle；不因缺 appeal 就否定現有合法 3B→home vertical。

### Cluster E — Live Scoreboard Projection

- Rules：SCOREBOARD-001～003
- Files：script.js, match-game-record.js
- Dependency：可獨立起始
- Architectural risk：MEDIUM
- Proposal：先統一 presentedEventCursor 下的 R/H/inning projection，再解除 completed/ellipsis 遮罩；不能直接洩漏 simulation 已計算但尚未播放的 H，也不要加 UI own stats。

### Cluster F — Official Outcome / Event Vocabulary

- Rules：RUN-FC-001～002, BIP-IFF-001～003, RECORD-001～002
- Files：script.js, batted-ball-ground-defense.js, batted-ball-outcome-mapping.js, match-game-record.js, high-school-competition-evidence.js
- Dependency：A → B → C
- Architectural risk：HIGH
- Proposal：將 BR safe 與 scorer hit 分離，支援 FC/rule-out；補 runner-only out 官方投影並防止與 PA 重算。IFF 需要 rule predicate + live continuation，不能只加 token。

## 24. Recommended construction order

A整合既有force/intent → B全actor settlement與ordered outs → C run validity/LOB → F official vocabulary與runner-only out投影 → D retouch/appeal擴充。E可另外獨立處理，先定cursor一致性再改顯示。這是建議順序，本輪沒有啟動任何施工。

## 25. Deferred / adjacent rules

- **Dropped third strike — OUT_OF_SCOPE / DEFERRED**：未找到 producer；普通 SO 為 terminal，不把 catcher blocking 冒稱未接第三好球規則。

- **HBP — OUT_OF_SCOPE / DEFERRED**：GameRecord 支援 hitByPitch/HBP ingestion、Evidence讀counter，但未找到 gameplay producer；ledger token 不等於半套 gameplay award。

- **Balk — OUT_OF_SCOPE / DEFERRED**：受查 production 無 balk/rule award branch。

- **Wild pitch / passed ball — PARTIAL / P1**：已有捕手彈球 block/control/傳壘情境，因此不能全域稱無相關 producer；沒有 WP/PB official classification 或完整逃逸球進壘模型。 Authority：[script.js:9672 resolveHighSchoolCatcherDecision](E:/meng/baseball_life_sim_semirefactor/script.js:9672)

- **Obstruction / interference — OUT_OF_SCOPE / DEFERRED**：未找到 rule state 或 award producer。沒有聲稱已支援此類碰撞。

- **Dead-ball awards — OUT_OF_SCOPE / DEFERRED**：未找到 dead-ball award/live-dead 邊界；catcher throwingError 不足以證明死球給壘。

- **Overthrow awards — PARTIAL / P1**：throwingError 已讓目標跑者多進一壘或回home；未區分活球續跑與出界給壘、投球時/傳球時基準，不能標成完全無 producer。 Authority：[script.js:9672 resolveHighSchoolCatcherDecision](E:/meng/baseball_life_sim_semirefactor/script.js:9672)

## 26. Stop conditions / validation

Stop A–E均未觸發：無production或test修改需求、基線正確、開始clean、ownership可從code與文件確定。只生成本輪兩份docs。

- tests/force-advancement-foundation-test.js：22/22 PASS。
- tests/defensive-runner-throw-settlement-foundation-test.js：22/22 PASS。
- tests/third-out-runner-resolution-integrity-v1-test.js：16/16 PASS。
- tests/bbp-b2b1-fly-ball-tag-up-legality-test.js：17/17 PASS。
- tests/bbp-b2b2-tag-up-decision-execution-test.js：21/21 PASS。
- tests/match-full-game-record-test.js：13/13 PASS。
- tests/high-school-integration-1-2-2-2-test.js：27/27 PASS。
- tests/ai-plate-appearance-outcome-production-integration-test.js：19/19 PASS。

合計8檔、157項既有assertion通過。**本輪未跑full regression，亦未用先前168/168宣稱規則完整。** Force測試已有1B+2B DP survivor，但loaded只查初始home target，沒有覆蓋本次legacy builder的滿壘DP。scoreboard測試明確期待current cell為…，其PASS與本輪CONFLICT可以並存。

記憶體probe沒有落成新tests、沒有替換production函式。BUG-01實際使用正式resolveInfieldDecision產生twoOuts；GameRecord獨立runner-out探針是ingestion邊界證據，非完整GUI replay。

## 27. Git status / closeout

唯一新增文件為本報告與 docs/baseball-rules-integrity-audit-results.json。Production diff=0、tests diff=0、other non-doc diff=0。main仍e46475c，origin/main相同，ahead/behind 0/0；staged與tracked diff皆0。git status只有這兩份untracked docs。最終tracked diff及兩個新檔的空白檢查均PASS；沒有commit/push，等待人工驗收。
