# Infield Baseball Logic Validation Audit v1 — Sprint 4

專案：Baseball Life Simulation（棒球人生）

稽核日期：2026-10-11（Asia/Taipei）
範圍：正式高中比賽 SS／2B／3B／1B ordinary ground 與玩家 1B incoming receive；Read-Only Production Audit。

**稽核完成；目前不宜進入正式守備 Foundation Closeout。** 有界球權、出局／得分結算及同球動作依賴沒有在本輪矩陣中發現非法結果；但正式記錄語義有兩項確定缺陷：不符合記錄規則的 E，以及接球失誤阻止出局時漏記傳球者 A。另有三守位的 lifecycle route 副本驗證缺口。Issue register 共 9 項：P0=1、P1=3、P2=5；其中兩項是 CONFIRMED RULE BUG，其餘為接入缺口、模型限制或分布證據不足。

四守位各 200 場、共 800 場完成，比分／記錄 integrity／冷重載一致。這是 deterministic integration cohort，不是自然生涯分布或平衡驗收。既有 Full Repository **224/227 PASS、PARTIAL** 沿用提交時證據；本輪沒有重跑 227 manifest，也沒有修復 Production、既有測試或三項歷史 Debt。

## A. Baseline / WIP

| 檢查 | 開始及結案結果 |
|---|---|
| 工作目錄 | `E:\meng\baseball_life_sim_semirefactor` |
| Branch | `main` |
| HEAD／origin/main | `f16a7f7b2263681788f3846c2e83fbb6f8b0bc53`，相同 |
| Staging area | 空 |
| 受保護 WIP | ` M tests/fast-check-smoke-test.cjs`；`?? install.ps1` |
| 既有未追蹤中間證據 | `?? docs/first-base-sprint-3-focused-development-evidence.json`，保留原狀 |
| 原有 tracked source／test hash | 364 個 JS／CJS／index.html 檔案前後一致；排除 protected smoke |
| 最後差異檢查 | `git diff --check` 排除 protected smoke，exit 0；4 個新增稽核檔另檢 trailing whitespace，無問題 |
| 最後 `git diff --stat` | 僅原有 protected smoke 的 10 insertions；沒有其他 tracked diff |
| 新增成果 | 僅本輪 4 個 `docs` 檔案，見 M |

兩個受保護 WIP 與既有中間證據沒有內容讀取、執行、修改、暫存或清理；本報告不宣稱受保護內容 hash 比對。Git metadata 檢查保留其原有狀態。沒有 Stage、Commit、Push、Reset、Clean 或 Stash；沒有改動守備責任邊界、能力公式或 seed。

## B. Architecture / Owners

Discovery 使用已安裝 codebase-memory Tier 2：schema／symbol search → 6 個入口的雙向 depth=1 CALLS trace → builder snippet／當前磁碟 source。對 prepare、1B builder、infield resolver、settlement apply、resolved recovery、event record 的查詢沒有未取完分頁。1B snippet 的截斷部分以 continuation read 補完。[Graph evidence](infield-baseball-logic-audit-architecture-evidence.json)

起始 graph generation 為 `2026-10-11T10:47:35Z`，最後 coverage 為 `2026-10-11T13:20:57Z`。24 個依賴證據路徑均為 no_recorded_issue，但 freshness 全為 **metadata_changed**；這不是新鮮度或完整性證明。重要條件、負面邊界與 owner 都以當前 source 查證，執行結果高於 graph。Graph 對 `resolveInfieldDecision` 沒有 caller，source 卻透過 registry／family dispatch 呼叫；不能把缺少 edge 當作不可達。[dispatch](../script.js#L10316)

```text
current legal roster / canonical playback / original PA
  → ordinary physical truth + owned direction roll
  → one nominal primary / active actor / supported admission / Reach
  → canonical SS OR legacy 2B projection OR canonical 3B OR bounded 1B
  → field / throw / receive / baseTouch / tag / pivot facts
  → runner arrival / ordered retirements / ForceAdvancement
  → Third-Out Integrity / final legal scoring
  → one Match State apply
  → same-play GameRecord / player-stage Evaluation
  → normalizeSave / cache validation / deterministic recovery
```

| Owner | 當前實際責任與邊界 |
|---|---|
| DefensiveOpportunityFoundation／BattedBallGroundDefense | 原球責任、actor binding、ground access；v1 SS／2B、v2 3B、v3 1B。[classifier](../defensive-opportunity-foundation.js#L60)、[access](../batted-ball-ground-defense.js#L233) |
| ReachSecure | 到位與控球分開；SS／3B／1B canonical，2B ground control 保留既有 authority 的 projection。[Reach](../defensive-reach-secure-foundation.js#L53)、[Secure](../defensive-reach-secure-foundation.js#L91) |
| DecisionThrow | 合法 route、resolved throw、self baseTouch、incoming receive、action facts／attribution；不直接改 outs／scores。[throw](../defensive-decision-throw-foundation.js#L142)、[receive](../defensive-decision-throw-foundation.js#L216) |
| RunnerThrowSettlement／ForceAdvancement | 共用 arrival、force chain、ordered retirements、survivor bases；不是各守位另建跑者結算。[arrival](../defensive-runner-throw-settlement-foundation.js#L14)、[force](../force-advancement.js#L103) |
| Third-Out／Match State | 唯一 legal scoring projection；unresolved timing 阻止 commit；最後由單一 adapter 改狀態。[third-out](../script.js#L6770)、[apply](../script.js#L11945) |
| Lifecycle／Save | 同球 admission、decision／execution identity、cached recovery、replay；副本 route 驗證落差見 L04。[lifecycle entry](../script.js#L11162)、[save](../save.js#L408)、[recovery](../script.js#L13223) |
| GameRecord／MatchExperience | actual actor ledger／same-play 去重、player stage evidence、exposure；內部一致性不等於正式 scorer 正確。[record](../match-game-record.js#L237)、[evidence](../match-experience-development.js#L345) |
| Match Playback／Roster | 當前合法 lineup actor、入替、PA／cursor advancement、recurring admission。[playback](../script.js#L13257)、[binding](../script.js#L5003)、[合法守位](../team-roster-foundation.js#L69) |

證據分類：**Actual Production** 是既有 careerFixture 初始化後不覆寫賽中球／跑者／能力／結果的 canonical playback；初始化 skills=12，仍屬 harness cohort。**Production fixture** 宣告合法 roster、球、能力、跑者、sample，再呼叫正式 family resolver／apply／recovery。**Isolated Foundation** 直接驗證純合約。**Legacy／synthetic scenario** 只作 source／模型邊界參照，不當作正常比賽 witness。本輪矩陣主要是 Production fixture，沒有將 family resolve 說成每格都經玩家 public choice handler。

## C. Physical Responsibility

| Ground physical truth + 已有 raw direction roll | 現行 router 的 nominal primary／topology |
|---|---|
| leftSide 且 `< .025` | 3B／v2；SS secondary |
| leftSide 且 `= .025` 或其餘 leftSide／middle | SS／v1 |
| rightSide 且 `≤ .99`，包括 exact `.99` | 2B／v1 |
| rightSide 且 `> .99` | 1B／v3；2B secondary |

方向分類先使用 handedness-adjusted roll：L 加 `.035`、R 減 `.035`，在 `.33`／`.67` 分 left／middle／right；near-line classifier 使用保存的 **raw roll + 已分類 direction**。它不是球場座標，也不是各守位的自然接球率。[physical direction](../batted-ball-physical.js#L87)、[router](../script.js#L4954)

本輪 42 個 Foundation boundary checks：L／R × 7 個 samples（`.024999`、`.025`、`.33`、`.5`、`.67`、`.99`、`.990001`）× v1／v2／v3。各版本 primary／secondary 符合宣告規則；把同一 roster 的 primary actor 換成 player，nominal classification 不變，physicalIdentity 保留。不是同一球依玩家守位吸附到不同 primary。

4 個 Production save fixtures 驗證 historical v1 SS `.005`、v1 2B `.995`、v2 3B `.005`、v3 1B `.995`：pending／executed cold reload／recovery 均保留原 ownership。v1 沒有 explicit topology 欄位時，router 依原 reach state 作 v1 inference；不是強迫升版。另 4 個 out-of-slice／airborne fixtures 均沒有 supported player ground 或新 open ground decision，沿用原 PA；800 場也沒有同球重複 PA 的 integrity 問題。[historical inference](../script.js#L4958)、[original PA fallback](../script.js#L13052)

Active actor、nominal primary、supported opportunity、實際 retirement 分開保存。Live actor tamper 在四守位皆遭 normalization 拒絕；secondary overlap 僅是 overlap，不是第二次 PA／第二個 primary decision。這些支持有界 ownership 合約；不宣稱全部飛球、短打、接傳、換位幾何都已完成。

## D. Baseball Rule Matrix

規則對照採 [MLB 2026 Official Baseball Rules](https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf) 作明示 benchmark；本轮沒有取得各臺灣高中賽事的完整特別規程，不宣稱完成該部分法規對照。5.08(a) 的 force／batter-before-first 第三出局取消得分，以及非 force 的先後判定，與本輪測試期望一致；5.09(b)(6) 的 force removal 以已實作的 retirement 子範圍查證。

| Production fixture 路線 | 已接納的 outs／八種壘況組合數 | 邊界 |
|---|---:|---|
| 6-3／4-3／5-3／3U | 各 24 | 0／1／2 outs × empty、R1、R2、R3、R1/R2、R1/R3、R2/R3、loaded |
| 6-4-3／4-6-3／5-4-3／3-6-3 | 各 8 | 0／1 out 且有 R1；兩出局不提供 DP route |
| 5U | 6 | R1/R2 或 loaded，第三壘 initial force 真實存在 |
| 3-1 | 另 24 | weak ground fixture；firm ground 主矩陣不提供此選項 |
| SS／1B forceSecond | 各 12 | 包含兩出局；實際 target 是原 R1 |
| 2B attackLeadRunnerThird | 6 | 真實 third-base force |
| SS／2B／1B homeForceOut | 各 3 | loaded 的真實 home force |
| 2B preventRunHome 非 force tag | 2 | 現有合法 route slice；不是全部 home-tag 情境 |

主矩陣 480 個候選格：**175 admitted、305 not offered、0 執行錯誤、0 已檢查 invariant violation**。Not offered 代表此明示局面下公開 route surface 沒有該路線，不是所有候選都應可選。另有 64 個 targeted fixtures，包括上述 24 格 3-1、低 hands／throw、快 runner、弱 receiver、relay failure、incoming receive；均可接納。`failedSecure` 名稱的 targeted row 指低 hands counterfactual，**不預設一定失敗**；2B composite model 仍可能控制球。

所有 admitted 格查 target runner、distinct retirement IDs、live force proof、outs≤3、無重複占壘、半局結束清壘、match／record integrity、第三出局 legal run cancellation。第一段失敗沒有第二出局；快 runner 不被後來已完成的 throw／receive 改成 out。

Isolated checks：force chain 在 lead runner 退休後保留仍有效的後段 force；trailing runner 或 batter 退休後移除相應 force。Batter 先退休後再要求 R1 forceSecond 的 candidate 不成立，continuation 要求 tag。9 組第三出局測試中，force／batter-before-first 對 before／after／unknown 都取消得分；non-force before 計分、after 不計、unknown 回 **TIMING_PLAY_UNRESOLVED／settlementReady=false**。另以兩出局、兩個 proposed retirement 證明最終只保留第三出局，outs=3，沒有第四出局或非法 run。[ordered projection](../script.js#L6806)

仍未涵蓋 force runner 已觸及應到壘後解除 force、再退回原壘的 reinstatement，以及全種類 appeal／rundown。這些沒有足夠連續 base-touch truth，列模型／證據邊界，不猜結果。**核心 retirement／score 子矩陣 PASS；包含第 9 章正式 scorer 語義的整體 Baseball Rules gate FAIL，見 G、J。**

## E. Execution Causality

| Action | 本輪查證的必要事實／依賴 |
|---|---|
| field | 合法 primary actor、Reach 可達、Secure／legacy control、owned sample／capability snapshot |
| throw | completed possession／transfer → 真實 thrower／receiver／runner target；offline 不形成 completed receive |
| receive | 真實上游 throw identity／delivery、readiness／hands；成功接球與 runner out 分開 |
| baseTouch | secured possession 或 completed receive → 同 runner／base 的合法 contest；3U／5U 沒有 throw margin |
| tag | 原球 receive／possession + 非 force tag 機會／timing；本輪實際 2B home-tag slice |
| pivot | 第一個 force baseTouch 已完成、局面可繼續；pivot／second throw／第二 retirement 各自獨立 |

247 個 admitted matrix／targeted／exact-replay projections 涵蓋六種 action；**completed action 依賴未完成上游的 violation=0**。實際 actor ID、status、dependsOn、provenance、sample owner、retirement ledger 都在新 JSON。沒有接球即傳球、第一 force 失敗仍 pivot、只憑 pivot 算第二 out 的 witness。[action contract](../defensive-decision-throw-foundation.js#L247)、[completed chain projection](../defensive-decision-throw-foundation.js#L269)

| 守位／路徑 | Execution maturity |
|---|---|
| SS first throw | canonical Secure／arm strength／throwing accuracy／relative arrival；variation 可由 namespace + decision identity 推出，不額外讀 match RNG |
| SS relay | 既有 teammate relay model；不是每段都有獨立 strength／accuracy／arrival |
| 2B | 既有 staged control／throw／window authority 投影；strengthMargin／accuracyMargin／timingMargin 可為 null，禁止當作 canonical 物理值 |
| 3B | canonical Secure／long first throw、5U possession-based touch；第二傳 coarse relay margins／arrival |
| 1B | 自身 canonical ground／3U；bounded NPC acquisition／throw → player receive；3-1／3-6-3 分 readiness／hands／return／arrival |

12 組 pending／executed／settled cold reload fixtures 每組 initial execution sample callback=1；恢復與重送在禁止 Math.random 的條件下不 reroll、不改 cursor、不增加 outs／runs／record／evidence。Historical topology 同樣可恢復。這是重送子範圍的證據，不代表四守位已共用相同公式。[builders](../script.js#L11354)、[3B](../script.js#L11527)、[SS](../script.js#L11658)

16 個 normalization tamper probes：physicalIdentity、live player actor、timing 在四守位各自拒絕且 input 不 mutation；executionState.selectedRoute 副本 tamper 只有 1B 拒絕。SS／2B／3B 保留 `forged` 副本，但仍依原 decision/cache 正常結算；exact baseline 重現，未觀察到錯誤 route 執行、非法 outs 或第二次 settlement。此為 **L04 validation gap**，不能宣稱全部 route-copy tamper PASS。[1B compare both copies](../script.js#L11520)、[3B first-truth precedence](../script.js#L11647)、[recovery route](../script.js#L13248)

## F. Ability Sensitivity

本輪固定 ball identity、roster、runner states、route、其他能力及 sample；每次只改一項。Foundation 800 rows：reaction／range／mobility／fielding／catching／arm／throwing／decision，levels 1／5／10／20、samples `.1/.3/.5/.7/.9`，分 SS／2B／3B throw、3B touch、1B touch。Incoming receive 64 rows 分 onTarget／challengingReceive；Production fixture 112 rows 分四守位、7 個可覆寫能力、4 levels，**各組 physical hash 不變**。

| 能力／環節 | 實際結果與限制 |
|---|---|
| reaction／range／mobility → Reach | Comparable non-null margin 沒有反向單調 violation；3B hard demand 與 range／mobility 分量依原公式 |
| fielding／catching → Secure | Pure Foundation 各自影響 hands margin；到位失敗不產生 Secure 成功 |
| arm → first throw | 3B 固定 sample `.5` strengthMargin 隨 1／5／10／20 為 `-6/-2/3/13`；slow runner 仍可能輸給 lateWeak throw，不要求每次 binary out 改變 |
| throwing → accuracy | 同組 3B accuracyMargin 為 `-4/0/5/15`，offline／challenging／onTarget 有區分 |
| catching → receive | Pure incoming hands margin 隨 catching 改善；reaction／range 改 readiness；arm／throwing 不虛構接球改善 |
| arm／throwing → 3U／5U | 同 sample 下 completion、timing margin、retirement 完全一致，throw margin 為 null |
| decision／baseballIQ | Fixed explicit choice 的正確性由局面／route 評價，不另擲 IQ safe/out；本輪不能證明自然決策策略或 IQ 對所有 legacy window 的成長梯度 |
| player／NPC capability | NPC defense／arm／speed 映射多個能力，mobility 以 roster speed 供應；不是全 career skill 都有獨立 production input |

Pure Foundation 可比較的 stage margins **0 monotonic violation**；Production sensitivity **0 執行錯誤**。不是全 Production pipeline 的共同 sample 單調性證明：例如 SS throw variation identity 可能隨 upstream secure inputs 改變。

**L06 input limitation**：ordinary primary player 的 physical defender context 將 `catching: defender.fielding` 送給 ground Secure。3B fixture 只改 catching 1／5／10／20，secureMargin 都為 5.5；改 fielding 才改 hands margin。Career catching 本身仍參與 fielding composite，player 1B incoming receive 亦有獨立 catching；不能寫成「catching 全域無效」。[adapter](../script.js#L5143)、[career mapping](../script.js#L6466)

弱 relay actor 單改 arm 使 3B／1B 第二傳 margins／結果改變；SS 既有 relay 可能仍成功，因舊模型合併其他 stage／window。這是 L05 maturity limitation，沒有把同一能力差異強行變成成功率 bug。

## G. GameRecord / Evaluation

成功 5-3 的 3B A／1B PO、5U／3U 的 player PO 無 A、3-6-3 同 player 1B A+PO+DP、pivot PO+A+DP，由 completed chain 投影且每 actor A／DP 每球不重複。Partial DP 只留第一 retirement；receiver／thrower actor 分開。Meaningful／routine 為統計 owner，defensiveResolution reference 不重記。12 組 reload／duplicate、800 場 PA／out／score／record integrity 皆一致；代表 record suite 13/13 PASS。投手／打者 PA 與狀態的內部對帳通過，**本輪沒有完成全部 official hit／RBI／earned-run reconstruction 語義驗收**。

正式記錄 benchmark：9.10(a)(1) 包含因後續守備者失誤而未完成的可成立刺殺之助殺；9.12(d)(3) 對完成 DP 的 wild throw 有無額外進壘例外。9.12(a)(1) 需誤守實際延長打席／跑壘或額外進壘；不是每個 failed hands 都自動 E。依此對照下列可重現結果。[OBR 2026，第 9 章](https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf)

| Exact f16 Production fixture | Expected | Actual |
|---|---|---|
| 5-4-3／3-6-3 第一 force 成功、第二傳 wild、打者只留一壘，沒有額外進壘 | 本例第二傳 E=0；保留第一 out | 2B／SS relay actor E=1、team E=1，out=1 |
| Player 1B receive：同球 batterSpeed=18；乾淨接球也來不及 out，未接穩仍只到一壘 | 本例接球失敗不改成 E／剝奪原 hit | clean：E=0／away H=1；failed hands：player E=1／team E=1／away H=0；outs／bases 相同 |
| 5-3 onTarget throw，本可退休慢打者；1B 明確接球失誤阻止 out | Receiver E；3B A=1 | Receiver E=1，3B A=0 |
| 5-4-3 第一 out 成功；末端 1B 接球失誤阻止第二 out | 保留第一 out；2B 完成轉傳 A=1 | 第一 out／1B E 正確，但 2B A=0 |

上述記錄差異是新發現的 **L01／L02**，不能歸入三項歷史 Debt。Source 分別將 failed/onTarget／offline 直接設 errorCharged，以及只由 actual retirement ledger 計 A；缺少合法 scorer exception／potential-out facts。[receiver E](../defensive-decision-throw-foundation.js#L240)、[relay E](../script.js#L11342)、[1B relay](../script.js#L11445)、[assist ledger](../defensive-decision-throw-foundation.js#L275)

Evaluation 的五種 fixture 對照：

| 情境 | 實際 evidence |
|---|---|
| 好的 3B throw、隊友 receiver 失誤、0 out | player throwing／hands／reach strong，player E=0；不因隊友結果降玩家 execution |
| Player 1B 接穩但快 runner safe | receive evidence strong；不從 safe 反推接球差 |
| Challenging throw 被 player 1B 接穩完成 out | receive completed／catching strong，沒有玩家 throwing 或 decision 證據 |
| 3B bobbleButControlled、仍取得 out | catching evidence 仍 strong：control 被壓成 completed，L07 模型限制 |
| 正常 routine incoming receive | reaction／range／catching，decision=none；不生成不存在的玩家 route 決策 |

Player stage 評價基本分離 outcome；但 coarse stage labels 尚不足以保留 clean 與 bobble／補救難度的完整過程梯度。E 語義錯誤不代表本轮證明所有 coach quality 都錯誤；已證明的錯誤是 actor E／team E／hit attribution，其他下游影響需 Repair Sprint 再驗證。[quality mapping](../match-experience-development.js#L64)

## H. Four-Position Cohort

**四守位各 200 場，均預先固定 seeds 77001–77200。** 既有 careerFixture → critical_offseason choice → playCareerMatchToEnd；初始化 skills=12、第一個合法選項／sample `.62`。沒有賽中 ball／runner／capability／result override、強制 starter、額外 PA。相同 seeds 在不同守位可能因入口／RNG consumption 形成不同整場 trajectory，因此也不是四守位共用同一批擊球的自然責任率比較。

Active defensive innings 是 engine 的出場半局 exposure 口徑：observer 去重 inning／half，800 場逐場等於 canonical matchExperience.exposure.defensiveInnings；不是將部分守備局細分為 out/3。Final active position 是比賽終了時合法 lineup；不在 final lineup 的玩家仍可能 earlier entry。每場相關位置與半局都留在 JSON。

| 指標 | SS | 2B | 3B | 1B |
|---|---:|---:|---:|---:|
| 完成／Record final／score 一致／integrity=[]／cold reload 相等 | 200 | 200 | 200 | 200 |
| 初始 starter／bench | 88／112 | 48／152 | 83／117 | 52／148 |
| 最終在該守位／不在 active lineup | 173／27 | 147／53 | 169／31 | 161／39 |
| Active defensive innings | 748 | 487 | 702 | 510 |
| 全場 PA（兩隊） | 13965 | 14290 | 14493 | 14085 |
| 全場 BIP-like PA result（排除 BB／K／HBP，含 HR） | 10907 | 11272 | 11465 | 11115 |
| 可見 physical contact sources，按 identity 去重 | 1296 | 882 | 1546 | 1149 |
| 可見 ground／infield nominal ground | 464 | 311 | 546 | 417 |
| Nominal primary：SS／2B／3B／1B | 315／132／13／4 | 211／86／11／3 | 366／159／16／5 | 257／142／18／0 |
| 合法 player primary | 315 | 86 | 16 | 0 |
| Supported detailed ground（含 1B incoming source） | 315 | 86 | 16 | 417 |
| Incoming receive source plays（含 upstream 未 delivery） | 0 | 0 | 0 | 417 |
| Routine／meaningful ground | 193／122 | 60／26 | 10／6 | 417／0 |
| Ground decisions／active defensive inning | .1631 | .0534 | .0085 | 0 |
| 可見 ground 未 detailed、保留 ordinary PA | 149 | 225 | 530 | 0 |
| Detailed plays 實際成功 outs（含 NPC 第一 force） | 314 | 86 | 16 | 358 |
| Player failed secure／throw／receive | 0／0／0 | 0／0／0 | 0／0／0 | 0／0／0 |
| Player E／所有 action errorCharged 次數 | 0／0 | 0／0 | 0／0 | 0／8 |
| 完整 DP／partial DP | 0／0 | 0／0 | 0／0 | 1／48 |
| Active defensive evaluation records | 1215 | 961 | 70 | 1218 |

分母不可混用。Full BIP-like 是 result vocabulary 的操作性計數，含 HR；不是精確 fair BIP 統計。Physical stream 是現有 player-defense admission 可觀察的 contact 子集，沒有涵蓋兩隊所有 PA，也不為壓縮 PA 補造 physical truth。故 **全部 ground／infield ground 的全場總數及各守位自然比例目前不可得**。表內 nominal primary 的分母只用該欄可見 ground；ordinary fallback 只用該觀察子集，不能拿它除全場 BIP 宣稱引擎 detailed coverage rate。L08 將此列為 INSUFFICIENT EVIDENCE。

1B 的 358 outs 不等於 player PO：其中 48 個 partial incoming DP 保留 NPC 第一 force，玩家末端接球未形成第二 out；不是 own 3-6-3。正常入口仍没有 1B primary、own 3-1／3-6-3 或 player receiving failure；3B 也沒有自然 partial DP。此前 Sprint 3 另批 seeds 77201–77400 有兩個 3U witnesses，只作既有參照，不合併本輪頻率、不追加 seeds 湊次數。[此前分開的 cohort](first-base-receive-active-ground-production-integration-sprint-3.md)

零次 failure／稀少 3B／1B 工作不能當機率零或規則 bug。樣本初始化高能力、固定 first-choice policy、正式 entry 差异、narrow lane 與採樣口徑都限制 distribution plausibility。1B cohort 的 8 個 upstream action errors 只是目前模型的 charged flags，沒有把它們全都宣稱為 L01 的違規 E。

## I. Observer Neutrality

先執行四守位 × seeds 77001／77002，共 **8 對 observer OFF／ON**。兩側都保留讀取 raw truth、RNG／public sample 計數的最小量測；ON 才增加 opportunity／action／active-innings 資訊。Observer 不抽額外 sample，不改球／狀態，也不作第二次 apply。

8 對的 raw physical truth hash、完整 final match hash、GameRecord hash、match RNG callback count、public execution sample count、simulationCursor、cold reload hash **全部相同**。再用完全未包裝的原 runner 重跑同 8 場，完整 match／record／cursor／reload hashes 亦相同。不是只比較比分；也沒有把每個 deterministic stage 的純 hash variation 當作 match RNG 抽取。

因此 observer neutrality 在此 pilot 為 PASS；800 場皆通過 reload／integrity，但沒有宣稱全部 800 場均逐場 OFF／ON 配對。

## J. Findings / Issue Register

**已確認規則缺陷：L01、L02。** **已確認接入／驗證缺口：L03、L04**，未以它們推論非法 outs／重播。**模型／分布風險：L05–L09。** 本輪沒有取得 CONFIRMED CAUSALITY BUG 的非法 retirement witness。

| ID／Severity／分類 | Owner、重現條件與 Expected／Actual | 影響／證據／Source | 修復邊界／Next Sprint disposition |
|---|---|---|---|
| **L01／P0／CONFIRMED RULE BUG** | Error eligibility。5-4-3／3-6-3 的第二傳 wild，第一 force 已完成、無額外進壘；以及 fast batter 即使 clean receive 也 safe 的 1B incoming pair。Expected 本例 E=0；Actual relay／receiver E=1。Fast pair 同 outs／bases，卻 H 由 1→0。 | 3B／1B 相關 participant paths，含 NPC 2B／SS；exact f16 fixture，非自然頻率。actor 沒認錯，**E 的法定成立條件錯誤**。[receive](../defensive-decision-throw-foundation.js#L240)、[543 relay](../script.js#L11342)、[363 relay](../script.js#L11445) | 以 potential-out、extra advancement、ordinary-effort 及 first／second leg context 定義 scorer E；DP 第一傳失誤與末端 muff 不可一律豁免。不改 execution rolls／outs。**Closeout 前必修**，新回歸不歸入舊 Debt。 |
| **L02／P1／CONFIRMED RULE BUG** | Assist projection。Clean 5-3／543 second throw 本可完成 out，被下一 receiver E 阻止。Expected preceding thrower A=1；Actual 3B／2B A=0，因 ledger 只接受實際退休跑者。 | 3B、1B incoming／所有共用 actor projection potential-out paths；exact f16 fixture。[actual-only ledger](../defensive-decision-throw-foundation.js#L275) | 新增 would-be-putout evidence／scorer exception；不能因此虛構 PO、retirement 或把 already-safe throw 都記 A。與 L01 同一 scorer repair sprint。 |
| **L03／P1／COVERAGE GAP** | Legacy actor scorer facts。SS／2B direct weak receiver fixture 為 receive failed／0 out，NPC receiver E=0；source adapter 沒有同等 receiver ordinary-effort／would-out error facts。Expected 四守位可提出相同 scorer 所需事實；Actual 舊 proxy 無法完整判定。 | SS／2B direct／relay；Production fixture + source。[legacy action facts](../script.js#L11217)、[receiver adapter](../script.js#L8110) | 補 readiness／hands／incoming quality／potential-out provenance 後再判 E。**不宣稱每個 failed receiver 都必須 E**；保留既有 2B execution authority，不加 second success roll。納入 L01／L02 的 cross-position contract 驗收。 |
| **L04／P1／COVERAGE GAP** | Recovery route-copy validation。只改 executionState.selectedRoute=`forged`，decision/cache 不變。Expected persisted copies 一致或拒絕；Actual SS／2B／3B normalize 保留矛盾、1B 拒絕。 | 三守位 pending→executed reload，exact f16 重現；恢復仍走 canonical 原 route、合法 2 outs、integrity=[]，**沒有非法 route／重算 witness**。[3B OR precedence](../script.js#L11647)、[recovery](../script.js#L13248) | 共用 route-copy consistency guard／明定哪份是唯一 authority。只做 validation，不能換公式或重播 settlement。下一修復 Sprint，Closeout 前補齊跨守位 contract。 |
| **L05／P2／MODEL LIMITATION** | Execution maturity／time units。2B legacy margins 為 null；SS relay single arm perturbation 不等同 canonical relay demand；force-on-touch／retreat 無連續 truth。Expected 明示成熟度；Actual 各守位不同模型，未發現本輪非法 out。 | 四守位；Source + Foundation／fixture。[2B projection](../defensive-decision-throw-foundation.js#L181)、[SS builder](../script.js#L11658)、[force removal](../force-advancement.js#L188) | 先統一 stage facts／units 邊界，再獨立驗證必要 sub-slices；不能直接套 SS 公式或把 limitation 寫成已修復。後續有界模型 Sprint。 |
| **L06／P2／MODEL LIMITATION** | Ability input coupling。只改 primary-ground fixture catching 不改 Secure；NPC defense／arm 映射多能力。Expected 能區分純 Foundation 與 production capability adapter；Actual primary catching alias fielding，incoming catching 独立。 | SS／3B／1B canonical ground；2B legacy 有自己 composite；112 fixture rows + pure matrix。[adapter](../script.js#L5143)、[mapping](../script.js#L6466) | 定義 career skill→stage capability 合約，再作固定 truth／sample counterfactual；不在本輪調公式或稱 catching 全域無效。後續能力模型 Sprint。 |
| **L07／P2／MODEL LIMITATION** | Player process quality。3B bobbleButControlled 仍有 out，catching evidence strong，因 control=completed 被標 strong。Expected 保存過程梯度；Actual completion label 遺失區別。 | 3B fixture；同類 stage-label emitters 可受影響，不推論全部已錯。[quality](../match-experience-development.js#L64)、[3B leg](../script.js#L11588) | 用現有 Secure／receive quality 投影 evidence；維持玩家／隊友／runner outcome 分離，不從 out 或 E 反推。後續 evidence refinement。 |
| **L08／P2／INSUFFICIENT EVIDENCE** | Distribution denominator。Full PA 與可見 physical stream 範圍不同，壓縮 PA 未有足夠球型資料。Expected all-ground denominator；Actual 只能統計明示 contact 子集。 | 四守位 800 場；正式 PA source／observer。[PA fallback](../script.js#L13052)、[playback](../script.js#L13341) | 先建立不中斷、無 RNG 副作用的全 PA contact provenance 觀察方案並驗證 neutrality；再談自然責任比例。後續可觀測性稽核，不能補造球型。 |
| **L09／P2／DISTRIBUTION CONCERN** | Sparse own-ground／failure witnesses。此 1B 200 場 primary=0、own 3-1／363=0；3B partial DP=0，高能力 player failures=0。Expected 可研究自然分布；Actual integration 可執行但 cohort 不足。 | Actual Production cohort；已有明示 fixtures與先前 separate 3U witnesses。不是 P0／不是機率零。[cohort harness](../tests/high-school-career-test-context.js) | 在 L08 分母完整後預先宣告 skill／entry／strategy cohorts；不得擴 lane／改 seed／能力湊次數。平衡驗收留後續 Sprint。 |

P0 的依據是系統性錯誤個人 E／team E／hit 統計，符合本輪「統計系統性錯怪球員」準則；**不是把稀少機會當 P0，也不是宣稱找到非法 outs／scores**。兩項 scorer defects 都有當前源碼及 exact baseline 記憶體重現，不僅靠未觀察到的情境推論。

## K. Existing Baseline Debt

| 保留的歷史 Debt | 既有失敗與本輪定位 |
|---|---|
| `ability-performance-gradient-test.js` | Low tier can have a multi-hit game；可能涉及能力／分布研究，但本輪未建立與 L06／L09 的因果，不修復或重新標類 |
| `baseball-match-foundation-2-2-2-test.js` | 第 36 個 full-match moment assertion；舊 fixture／flow 證據不取代本輪 physical cohort |
| `high-school-year-one-opportunity-two-integration-test.js` | 舊 partial runtime 缺 DefensiveDecisionThrowFoundation；屬既有 harness boundary，不是本輪 scorer 缺陷的解釋 |

前次提交基線為 **224/227 PASS／3 FAIL，Full Repository PARTIAL**。本輪 364 個原 source/test hashes 不變；沒有重跑完整 manifest，因此不報「本輪 224/227」或新全量 regression=0。L01／L02／L04 的 exact f16 重現是新 audit evidence，**沒有把新失敗挪入這三项 Debt，也沒有改 assertions／seeds**。

## L. Recommended Repair Sequence

1. **合法 E 判定（L01，合併 L03 facts）**：建立 scorer 所需的 potential out／ordinary effort／extra advancement／DP leg context，維持 execution 與 score authority；對 player／NPC、meaningful／routine、fast-safe／partial DP／receiver muff 作跨守位回歸。先消除 P0，不能靠提高能力降低重現頻率。
2. **因後續 E 未完成刺殺的助殺（L02）**：以可證的 would-be-putout action chain 作 scorer A，保留 actual retirement／PO／DP 的真實結果與 same-play 去重。正常已來不及出局的傳球不可因後續 miss 自動得 A。
3. **跨守位 lifecycle route 副本一致性（L04）**：以 1B 的明確 validation boundary 為參照，補 SS／2B／3B pending／executed／settled normalize guard；不改 canonical builder／RNG／settlement。其後再處理 ability／quality 梯度與有完整分母的平衡研究。

以上只是具體修復邊界與排序，本輪沒有開始 Repair Sprint。**Formal Defense Foundation Closeout 必須先解決 P0；P1 scorer／identity contracts 也應納入 Closeout gate。**

## M. Audit Evidence / Coverage Limits

新增檔案只有：

- [本報告](infield-baseball-logic-validation-audit-v1.md)。
- [執行證據](infield-baseball-logic-audit-evidence.json)：baseline／source hashes、預宣告 seeds、pilot／unwrapped equality、800 rows／summaries、rule／action／ability／save／exact replay projections、代表套件 outputs。約 10 MB，是本輪機器可讀 evidence，沒有完整臨時 console dump 或機密憑證。
- [Architecture evidence](infield-baseball-logic-audit-architecture-evidence.json)：schema／symbols／6 traces／coverage 完整分頁與 source-fallback 限制。
- [唯讀 runner](infield-baseball-logic-audit-runner.cjs)：只讀原 Production／測試、Git metadata／git show，寫入本輪 evidence；不作 Git mutation。JSON 是診斷 projection，非可直接載入遊戲的執行 cache；相同 parent timing 的重複 action provenance 以 `timingReference=row.timing` 去重。

| 本輪實際執行 | 結果 |
|---|---|
| Responsibility boundary／historical／fallback | 42／4／4 checks，預期成立 |
| Production route matrix | 480 candidates：175 admitted、305 not offered、0 errors／invariant violations |
| Targeted fixture／third-out | 64 admitted／9 timing cases；另 force-removal／兩出局 truncation |
| Foundation／incoming／Production sensitivity | 800／64／112 rows；comparable margins 無反向單調 violation；Production errors=0 |
| Action dependency proof | 247 projections，六種 action，incomplete completed dependency=0 |
| Save／replay | 12 三階段 cold reload／duplicate 一致；initial sample=1；16 tamper 中 13 拒絕、3 route-copy 缺口 |
| Exact f16 | 8 scorer fixtures；另四守位 route-copy equivalent reproduction |
| Normal cohort | 4×200=800 場完成／完整 record／score／reload 一致 |
| Observer | 8 OFF／ON pairs + 8 unwrapped baseline，hash／cursor 對照一致 |
| `node tests/force-advancement-foundation-test.js` | 22/22 PASS |
| `node tests/defensive-runner-throw-settlement-foundation-test.js` | 22/22 PASS |
| `node tests/match-full-game-record-test.js` | 13/13 PASS |

可重跑：在相同 baseline 與受保護 WIP 排除條件下，用 `node docs/infield-baseball-logic-audit-runner.cjs <phase>`。已有 evidence 時不要重跑 init；pilot → observer_unwrapped → cohort → probes → targeted → ability → evaluation_cases → save_focused → proofs → physical → exact_replay → regression → measurement_finalize → finalize。這些 phases 覆寫**本輪**指定 JSON，不覆寫任何其他 Sprint evidence。沒有另外重跑 SS／2B／3B 完整 focused cohorts或全 227 manifest。

Observer／diagnostic 修正記錄（TEST HARNESS ISSUE，非 Production defect）：初版以 sourceSnapshot.physicalIdentity 篩 active evidence，漏計 SS／2B；改以 defensive family 篩選，重跑兩守位各 200 場，**除 evaluation count 外全部 saved measurements 一致**。Partial DP 初版讀未保存的 generic route／detailedResult；改從已保存 initialRoute+outs=1 重計，保留 1B 的 48 次 partial。初版 isolated force third-out 缺 force proof，historical v1 卻讀 explicit topology，以及 fallback 判斷用錯 enum，均修正 runner／證據解讀，沒有改 Production 或期望合法 outs。PowerShell stdin 的非 UTF-8 字串／`node -e` 引號問題以 UTF-8 runner／ASCII diagnostic 解決，不列專案測試失敗。

Runner 的 exit 0 表示完成收集，不代表 scorer audit 全通過；JSON 的 `scorerAuditAssertions` 明列 L01／L02 的 5 個 expected／actual 不符合結果。Route-copy 的 3 個不拒絕結果也完整保留，沒有改成 PASS。

Coverage limits：僅 ordinary ground／已接通 incoming slice；airborne／bunt／pickoff／appeal／完整 rundowns、精細 field geometry／伸展／挖地球、全 official scorekeeping、自然 career strategy 與平衡都不在完整驗收範圍。Whole-match completion 與 identity integrity 不消除 scorer rule bugs；fixture success 不證明自然頻率。Graph 的 no_recorded_issue 亦不證明全 repository 功能完整。

## N. Final Gate

| Gate | 結果與依據 |
|---|---|
| Physical Responsibility | **PASS**，有界 lanes／唯一 actor／歷史版本／原 PA fallback；非幾何或自然率驗收 |
| Baseball Rules | **FAIL**，core force／third-out 子矩陣通過，但 L01／L02 正式 scorer 規則缺陷存在 |
| Execution Causality | **PARTIAL**，實際依賴／possession／retirement checks 通過；模型成熟度不同、L04 copy guard 有缺口 |
| Ability Sensitivity | **PARTIAL**，純 Foundation margins／自踩不依赖 arm 通過；production adapter／IQ／mobility 梯度仍有限 |
| GameRecord / Evaluation | **FAIL**，內部 record／player stage 分離通過，但 E／A／hit 語義有確定缺陷；process quality 仍 coarse |
| Opportunity Distribution | **INSUFFICIENT**，800 場有界入口可重現；全場 ground 分母與稀少 own routes／failures不足，不能驗收自然分布 |
| Observer Neutrality | **PASS**，8 pairs + 8 unwrapped comparison；限定 pilot |
| Baseline Integrity | **PASS**，main／origin 同 f16，index 空，原 source／test hashes 不變，既有 WIP 原狀 |
| Audit Completeness | **PASS**，所要求的有界稽核／重現／分類／證據完成；不代表全部棒球邏輯正確 |

Issue counts：**P0 1／P1 3／P2 5，共 9**。已確認 Rule Bugs 為 L01／L02；缺口與風險另外列示。優先修復順序：合法 E → 潛在刺殺的 A → lifecycle route-copy validation。**需要先修 P0 才能進入正式守備 Foundation Closeout。**

結案新增內容只限上述 4 個稽核檔案。Production／既有 tests 不變；兩個 protected WIP 及既有 untracked 中間證據保留，未作內容 hash 宣稱。本輪沒有 Git mutation，完成後停止，不開始 Repair Sprint。
