# 3B Ordinary Ground Production Integration — Sprint 2

專案：Baseball Life Simulation（棒球人生）
施工／驗證日期：2026-10-11（Asia/Taipei）
範圍：正式高中比賽的三壘手 ordinary ground；5-3、5U、5-4-3 與既有共用 owner。

**3B 已接上有界的 physical ground 垂直路徑。** 守位責任、玩家選項／自動守備、Reach / Secure、長傳／自踩、隊友接傳、Runner Timing、Force / Third-Out、GameRecord、active Evaluation 與 Save / Recovery 使用同一球的身份。最終完整回歸結果及 Commit gate 見 M、P；本輪未 Commit、Push、Stash，也未開始 Sprint 3。

## A. Git Baseline / WIP

| 開始檢查 | 結果 |
|---|---|
| 工作目錄 | `E:\meng\baseball_life_sim_semirefactor` |
| Branch | `main` |
| HEAD / origin/main | `58b9ce906e00001081dcf8e15d9b0b492a2a74b7`，相同 |
| `git diff --check` | 無 whitespace error |
| 受保護 WIP | ` M tests/fast-check-smoke-test.cjs`；`?? install.ps1` |
| 接續施工內容 | 7 個已修改 Production 檔、focused suite 與 red evidence 已存在於工作區 |

本輪接續上述 Sprint 2 草稿，保留其變更。受保護 WIP 僅出現在使用者要求的 Git 狀態／差異檢查，未讀取內容、執行、修改、暫存或清理；不宣稱未做過的內容 hash 比對。所有測試 manifest 排除 protected smoke。沒有 reset、clean、stash、commit 或 push。

## B. Architecture Before / After

可重用部分：現有 Physical Truth、當前 roster binding、Reach / Secure、Decision / Throw 的 3B-to-first long demand、runner physical states、ForceAdvancement、Third-Out、Ground Lifecycle、單一 settlement apply adapter、actor attribution、GameRecord、Evaluation envelope、Save normalization / recovery。

必須新增部分：版本化的近三壘線 ground responsibility、3B supported admission、3B execution cache、5U base-touch execution / timing、5-4-3 actor stages、thirdBase active evidence，以及後段 recurring admission。

```text
Before: ordinary ground -> SS / 2B detailed slices
        3B unsupported ordinary contact -> original PA fallback
        3B generic scenarios -> legacy composite execution

After: same physical truth / owned direction sample
       -> mutually exclusive 3B lane / legal active actor
       -> physical read / legal choices / routine gate
       -> shared Reach / Secure
       -> 5-3 long throw OR 5U base touch OR 5-4-3 relay OR hold
       -> shared arrival comparison / ordered retirements
       -> ForceAdvancement / Third-Out / one Match State apply
       -> actor GameRecord / thirdBase stage evidence / persisted recovery
```

使用 `codebase-memory` Tier 2 有界查證：先 `list_projects` / `index_status`、schema、symbol search，再對 prepare、resolver、3B builder、resolved recovery 做雙向 depth=1 trace，並讀取 builder snippet 與當前磁碟 source。查詢無未取完的分頁。Graph 起始 generation `2026-10-10T14:55:01Z`；自動更新後 coverage generation `2026-10-11T02:03:38Z`。245 個證據／回歸路徑均無 recorded coverage issue；238 為 `metadata_changed`、7 為 `metadata_match`。這不證明索引完整；結構與負面邊界以當前 source 和實際執行為準。

Graph 的 `resolveInfieldDecision` caller 數仍為零；source 透過 registry / family dispatch 呼叫，不能用缺少 CALLS edge 推論不可達。沒有把 graph freshness 當測試替代品。

## C. Modified Files

| 檔案 | 變更目的 |
|---|---|
| [defensive-opportunity-foundation.js](../defensive-opportunity-foundation.js) | 版本化 coarse ground lane、sample provenance、責任邊界 |
| [batted-ball-ground-defense.js](../batted-ball-ground-defense.js) | 3B physical admission、handoff 與選項身份 |
| [defensive-reach-secure-foundation.js](../defensive-reach-secure-foundation.js) | 新 topology binding、3B demand；保留既有 SS / 2B variation 身份 |
| [defensive-decision-throw-foundation.js](../defensive-decision-throw-foundation.js) | `stepThird` / `initiate543` 與 possession-based base touch |
| [defensive-runner-throw-settlement-foundation.js](../defensive-runner-throw-settlement-foundation.js) | base-touch timing；共用 `deriveRunnerArrival`，不增加 runner owner |
| [script.js](../script.js) | 3B builder、action facts、cache validation、最終 PA error adapter、recurring scheduling |
| [match-experience-development.js](../match-experience-development.js) | 有 physical / stage facts 才接受 thirdBase active evidence |
| [focused suite](../tests/third-base-ground-production-integration-test.js) | 32 個 checks、明示 fixture 與分開的 200 場 cohort |
| [validation runner](../tests/third-base-sprint-2-validation-runner.cjs) | 原 227 manifest、完整輸出／hash、精確基線重現；不 checkout |

文件／證據：本報告、[red evidence](third-base-sprint-2-red-evidence.json)、[最終 validation](third-base-ordinary-ground-sprint-2-validation.json)、[boundary validation](third-base-sprint-2-boundary-validation.json)、[closeout repairs](third-base-sprint-2-closeout-repair-evidence.json)。未修改 `save.js`、`match-game-record.js` 或 ForceAdvancement；透過它們既有的 extension / projection contract 整合。

## D. Physical Responsibility Model

新 contract：`infield-ground-responsibility-v2`；ground topology：`regulation-coarse-ground-lanes-v2`。僅 ordinary ground 使用，非精確擊球座標。

| 現有 physical truth / owned direction sample | 新球責任 |
|---|---|
| `groundBall + leftSide`，direction roll `< .025` | `thirdBaseSide`，3B primary、SS secondary |
| `leftSide` 的其餘 sample，含 `.025` 邊界 | `shortstopSide`，SS primary |
| `middle` | 原 SS primary |
| `rightSide` | 原 2B primary |

`.025` 是本 slice 的保守 nominal lane 邊界，並非三壘手自然接球率或精確幾何。以已存在的 `BattedBallPhysicalTruth.executionEvidence.rolls.direction` 細分；不另抽 sample、不改 physicalIdentity、不讀玩家守位來提高分配率。NPC 與玩家使用同一 classifier；secondary 只表示 overlap，不能再建立第二個 primary decision。

Production router 對新 3B lane 選用 v2；既有 SS / 2B 主守區與 execution variation 身份保留。Historical v1 pending / executed saves 依保存的 topology 繼續驗證；包括舊 SS 在 `.005` 近線球的合法 v1 ownership。缺少 classifier source、不屬於玩家 primary、Reach 不可達或 airborne 不支持時，沿用原 PA source；不製造 synthetic 3B decision。

## E. Reach / Secure

重用 canonical Foundation。3B hard ground 多一級 reaction demand，reaction weight `.65`；normal near-line movement demand 比 SS 的 nominal 橫移小，weak ground 仍保留 charging demand。這是 coarse movement / reaction 需求，沒有滑接、碰撞或正反手動畫模型。

Reach 成功與 Secure 成功分開。Secure 使用實際 capability snapshot、arrival quality、球速壓力與已擁有的 execution sample；控制失敗沒有 completed throw、base touch 或 retirement。到位不可達時沒有主動傳球，原 PA 正常完成。Routine / meaningful 走同一 3B builder；變化只在 decision provenance 與 presentation gate。

## F. 5-3 Long Throw

第一傳呼叫既有 `resolveThrow`：3B-to-first 距離為 `long`，基礎 strength / accuracy demand 為 `7 / 5`，再讀 arrival / control pressure。arm 影響 delivery，throwing 影響 accuracy；不是固定加一個「3B 能力懲罰」。玩家一次 execution sample 投影到既有 stage 輸入，不再擲第二次 throw success 或 safe/out。

實際 1B receiver 來自當前 lineup / roster。分開未控球、offline throw、receiver failure、clean delivery 但 runner 先到，以及合法 5-3。成功投影 3B A=1、1B PO=1；receiver failure 不記玩家 E、不虛構 out。On-target 來球的明確接球失敗記實際 receiver E；原 PA adapter 讀 action error facts 分類為 error，維持球隊 E、個人 E 與 hit totals 一致。

## G. 5U Base Touch

`stepThird` 是 `baseTouch`，沒有 throw resolution / throw margin。依 secured possession、coarse base proximity、reaction / mobility footwork、control delay，與同一二壘跑者的 arrival 比較。只有真實 initial force chain 指向 third 時可成立；單獨二壘有人不足以產生 force。

驗證：相同到位條件下 arm / throwing 1 與 10 結果一致；快跑者先到不產生 out；沒有球權不踩壘退休跑者。成功 5U 記 3B PO=1、A=0。Force third out 的 raw scoring attempt 保留，最後取消非法得分並清壘。

## H. 5-4-3 Relay / Partial DP

分段記錄 3B field / first throw、2B receive / force base touch / pivot / second throw、1B receive / base touch。每個 action 有真實 actor、上游 dependencies、能力與 timing provenance。第二傳使用有界 coarse relay demand 與同一 execution sample；第二出局比較 first-force completion 加 relay time 與共用 runner arrival，沒有重新擲 safe/out。

完整 DP 有 ordered second / first retirements；3B A / DP，2B PO / A / DP，1B PO / DP 都由實際退休跑者的 completed action chain 投影。第二傳失敗、末端 1B 接球失敗或快打者先到，只保留第一個 force out，DP=0。沒有第一傳／第一個出局，不執行 pivot / second throw。明確的隊友 inaccurate second throw 或可接來球失敗記到該 actor，玩家 E=0。

Relay units 仍是 coarse relative units；本輪不宣稱精確飛行時間或完整 receiver 幾何，也不把每段變成人工點擊。

## I. Player Decision / Routine

支援 5-3、合法 5U、合法 5-4-3，以及既有 controlled hold。選項使用同一 physical fielding situation 與 live force / runner context；不是用 career primaryPosition 改派球權。既有 meaningful / behavioral dedupe / density gate 決定是否詢問玩家；空壘無戰術分歧通常自動處理。

沒有新增「是否接穩／認真傳球／全力守備」選項。Recurring phase 加入 3B，沿用 SS / 2B 的 `finalOffense / finish` playback admission；沒有額外 PA、額外打擊事件、第二次 inning / batting-order / cursor advancement。

## J. GameRecord / Evaluation

GameRecord 沿用 Sprint 1 actor projection 與 event / play identity 去重。原 meaningful event 擁有守備統計；`defensiveResolution` 是同球的記錄參照，不能重記。5-3、5U、完整／partial DP、no-out、player error 與 teammate error 都有 fixture 與 integrity checks。

Evaluation 只有存在 `third-base-evidence-v1`、合法 actor / position、physical identity 與 player stage facts 才建立 active records；沒有只刪掉 position gate。保留 read / decision、Reach / Secure、throw 或 baseTouch、teammate stages、final legal outcome、responsible actor、difficulty / semantic novelty context。

Meaningful throw 通常有 reaction、range、catching、throwing、baseballIQ 五筆；routine throw 四筆；baseTouch 不虛構 throwing evidence。隊友失敗的 player execution quality 取玩家 stage，快跑者安全上壘不自動判錯誤決策。Exposure 與 active evidence 分開；1B emitter 與 incoming receive 不在本輪整合。

## K. Save / Load / Exactly-Once

`thirdBaseExecution` 保存 owned sample、route、before-state、Secure、Decision / Throw 或 baseTouch、Timing、raw resolution 與 action facts。沿用 `normalizeSave` hook 作 deterministic reconstruction，不抽 RNG、不改 cursor 或結算 authority。

| 驗證範圍 | 結果 |
|---|---|
| Pending choice／冷重載／相同選項 | PASS |
| Executed but not settled：clean、failed secure、failed throw、receiver failure、partial DP | PASS |
| Resolved recovery／重送／settled 冷重載 | PASS，無新增 outs / runs / record / evidence |
| Tampered actor、route、receiver、timing、physicalIdentity、action facts | PASS，normalize 前拒絕且 input 無 mutation |
| Lifecycle execution copy／刪除 cache 或個別 stage | PASS，拒絕不一致執行狀態 |
| Historical v1 SS / 2B pending + executed recovery | PASS |
| Active ground 與其他 open situation 的 direct prepare mutex | PASS |

Closeout 修復兩個實際問題：lifecycle 副本必須對齊 canonical cache；settled play 重建時使用該球原始半局的 offense / defense side，不能使用整場結束時的當前守隊。raw execution 不被 final legal scoring projection 覆寫。

## L. Focused / Cross-Position Regression

[Red evidence](third-base-sprint-2-red-evidence.json) 保存施工前 **0 PASS / 6 FAIL**、原測試 source 與精確基線的記憶體重現方法；另有 isolated generic emitter gate 證據。最終 focused suite **32/32 PASS**，直接以 Node main entry 執行，包含 public 5-3 / 5U / 5-4-3、重送、冷重載與 200 場正常入口。

R2 / R3 的最終回歸改用真實 supported 3B production fixture，驗證相同的「self touch 不依賴 arm / throwing」和「弱末端 receiver 不產生第二出局」要求，沒有改 expected out count。Legacy generic scenario resolver 保留，避免改動本輪排除的 bunt／舊 isolated harness；它不是此次 Production slice 的 execution owner。原 single-seed recurring probe 未強行變成必有 3B 工作；使用連續 cohort 描述責任可達性，原失敗仍保存在 red evidence。

跨守位與共用檢查由原 227 manifest 實際重跑，包含 SS Production、2B Decision Throw、Shared Infield、Opportunity、Reach / Secure、ForceAdvancement、Runner Throw Settlement、Ground Identity / Recovery、GameRecord、Experience、Save、完整高中比賽與年級流程。另執行 manifest 外的 Pitch source-scope suite：**7/7 PASS、131 mutations rejected**；95 個 protected functions 與 25 個 protected globals 邊界保持。

## M. Full Repository Regression

最終版本實際完成 **224 PASS / 3 FAIL，227/227 均完成**。與指定基線相比，原 PASS → FAIL = **0**，新增 Production regression = **0**；沒有 timeout 或略過套件。整輪 Production hashes 前後相同。

使用已保存的 **227 檔名、原順序、原 manifest SHA-256**：

`871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96`

| 既有 Baseline Debt | 原因／同等重現要求 |
|---|---|
| `ability-performance-gradient-test.js` | `Low tier can have a multi-hit game` assertion |
| `baseball-match-foundation-2-2-2-test.js` | 第 36 個 full-match moment assertion |
| `high-school-year-one-opportunity-two-integration-test.js` | 舊 partial runtime 缺 `DefensiveDecisionThrowFoundation` |

Runner 使用四個 Node child processes、`windowsHide`、600000ms suite timeout，保存每套 stdout / stderr、exit code、duration、test hash 與完整 before/after manifest 比較。失敗另用 `git show` 精確 `58b9ce9` root Production source，在記憶體 compile 同一測試重現；沒有 checkout、覆寫 WIP 或換 seeds / assertions。最終 Production source hashes 必須在整輪驗證前後一致，才可作 closeout 證據。

## N. Coverage / Gameplay Findings

預先固定連續 seeds `77001–77200`；`careerFixture("三壘手", "starter", seed)` → `choose("critical_offseason", 1)` → `playCareerMatchToEnd()`。沒有賽中 ball、runner、能力、結果或 roster override。Harness 的 careerFixture 預設 baseballSkills=12，公開選項 sample 固定 `.62`；這是有界 deterministic integration cohort，不是自然生涯成功率／平衡統計。正式 Opportunity 最後有 83 場 starter，其他場保留既有合法 roster / entry 結果，沒有強塞玩家到 3B。

| 指標 | 200 場結果 |
|---|---:|
| 全部完成、GameRecord final、score 一致、Match / Record integrity 無問題、reload 語意等價 | 200 |
| 可見 ordinary physical contact sources（玩家守備半局；非全場所有 PA） | 1309 |
| 去重的 3B primary ground sources | 16 |
| 已接入 3B physical plays | 16，15 場有工作 |
| Routine / Meaningful | 10 / 6 |
| 後段 recurring plays（inning > 2） | 16 |
| Active thirdBase evidence records | 70 |
| 原因 | 16 次 `balancedExecution` |
| Partial DP | 0 |

Seed `77019` 有 meaningful witness；`77036` 有 routine witness；`77137` 有兩次 recurring routine。`77001` 沒有 3B physical play，沒有為了讓單場通過而改派 SS 的球。

觀察到的 throw demand 都是 long，strength=7、accuracy=5；比較值由各球的 roster、player stage、runner arrival 留存在 validation cohort `actions`。本 cohort 未觀察到自然 failure / partial DP，不能據此宣布失敗率為零或 DP 平衡已驗收；這些結果由明示 fixture 分別驗證。責任頻率偏稀疏是目前 narrow slice 與正式出場／候選 scheduling 的結果，未調整 lane、能力或 density 追求特定次数。正常入口已有 physical、routine 與 meaningful witnesses，沒有 COVERAGE BLOCKER。

## O. Remaining Risks

- 本 slice 僅近三壘線 nominal ordinary ground；非整個三壘手所有球責任。沒有精確球場座標或完成一般 airborne / bunt。
- Relay、base proximity、runner arrival 使用 coarse units；難度與頻率還不能當正式平衡參數。
- Legacy generic R2 / R3 diagnostics 仍可描述舊模型；正式 supported 3B route 已繞過該 execution owner。不得把本報告推廣為所有 development scenarios 或 bunt 的驗收。
- BIP mapper 的 result vocabulary 維持原 contract；已結算的 3B action error 由既有 PA adapter 作 error 分類。1B incoming receive、更多 tag、pitcher-cover 與精細 receiver scoring 不在本輪。
- 本輪不修復三個獨立 Baseline Debt；Full Repository gate 必須保留 PARTIAL。

## P. Final Gate

| Gate | 結果 |
|---|---|
| 3B Physical Opportunity | PASS（有界 near-line ordinary ground slice） |
| 3B Execution & Settlement | PASS（5-3 / 5U / 5-4-3 / partial / failure） |
| GameRecord / Evaluation | PASS（actual actor projection / thirdBase stage evidence） |
| Save / Exactly-Once | PASS（pending / executed / settled / cold reload / tamper） |
| SS / 2B Regression | PASS，原套件與 historical v1 admission 通過 |
| Full Repository Regression | PARTIAL，224/227 PASS；三項精確基線重現的獨立 Debt |
| Sprint Delta Regression | PASS，原 PASS → FAIL 為 0；focused 32/32 與 boundary 7/7 PASS |
| Ready for Commit | YES（有條件；只納入本 Sprint、明列三項 Debt、排除 protected WIP） |

Commit readiness 限本 Sprint 差異、明列三項 Baseline Debt、排除兩個受保護 WIP；不代表整個 repository 全綠。最終 `git diff --check` 無 whitespace error；Branch / HEAD / origin/main 維持開始時基線。工作停在人工審查，不自動 Commit / Push，也不開始下一個 Sprint。
