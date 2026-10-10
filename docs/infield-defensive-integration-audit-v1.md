# Infield Defensive Integration Audit v1

專案：Baseball Life Simulation（棒球人生）
稽核日期：2026-10-10（Asia/Taipei）
範圍：正式高中比賽的 1B、2B、3B、SS；Architecture / Gameplay 唯讀稽核。

## 結論與審查定位

**已有足以繼續整合內野守備的共用基礎，但尚不是四守位完整 Production 系統。** SS 的一般滾地球垂直路徑已接通；2B 有正式右側滾地球、平飛球、自動補位與多條決策路線，但仍保留舊執行模型的投影。1B、3B 並非完全沒有正式玩法：它們能走通用 infield family、公開選項 handler、自動例行守備、跑者結算與 GameRecord。然而，它們尚未接通實體滾地球責任、詳細執行身份與主動守備成長證據。

**下一個新增完整垂直整合的守位建議為 3B；先完成有限的共用層整併與 2B 補齊。** 3B 能直接重用既有 Reach / Secure、長傳需求、Runner Timing、Force / Third-Out Settlement。1B 隨後整合，且必須分開「接其他守位傳球」與「自己處理擊球」，不能只替通用滾地球增加一個守位名稱。

本報告不重新驗收或重做 SS Sprint 1。引用 SS 套件是為了確認跨守位參照、共用最終得分投影及既有邊界；發現的問題僅記錄並排入後續 Sprint，本輪沒有修復。

## A. Baseline、WIP 與證據方法

### Git / WIP

工作目錄：`E:\meng\baseball_life_sim_semirefactor`。

| 檢查 | 開始時結果 |
|---|---|
| `git branch --show-current` | `main` |
| `git rev-parse HEAD` | `c54f81016ed6d495f6c6911ebae708c05bcf4b2b` |
| `git rev-parse origin/main` | `c54f81016ed6d495f6c6911ebae708c05bcf4b2b` |
| `git status --short` | ` M tests/fast-check-smoke-test.cjs`；`?? install.ps1` |
| 非預期程式修改 | 開始時沒有 |

兩個受保護 WIP 僅出現在使用者要求的 Git 狀態確認，未作內容讀取、執行、修改、暫存或提交。唯一交付變更為本報告；沒有 Commit、Push、Stash、Production 或測試檔案變更。

### Graph discovery 與 Source Fallback

使用已安裝的 `codebase-memory` 技能，以 Auditor 的有界查證方式探索：

- 專案：`E-meng-baseball_life_sim_semirefactor`。
- `list_projects` / `index_status`：ready；generation 為 `2026-10-10T06:46:31Z`。
- `get_graph_schema`、`search_graph`：定位正式入口、infield resolver、SS builder、結算、GameRecord、Evaluation 與 Save。
- 對 `prepareHighSchoolDefensiveMomentFromSimulation`、`resolveHighSchoolDefensivePlay`、`applyInfieldResolutionToHighSchoolMatch`、`resolveInfieldDecision` 做 depth=1 的雙向 CALLS trace；上述查詢均完整返回，沒有未取完的分頁。
- `check_index_coverage`：28 個候選證據路徑及 5 個主要功能 scope 均無 recorded issue，但所有路徑 freshness 都是 **`metadata_changed`**。這不能證明 graph 新鮮或完整。因此，重要結論以當前磁碟上的實際 source、守位 gate、adapter 與記憶體執行結果為準，未重新建立索引。
- Graph 對 `resolveInfieldDecision` 回報零 caller，但 source 明確以 registry 的 `resolve: resolveInfieldDecision` 及 `infieldDecisionFamily.resolve(...)` 使用它。這是不能把缺少 CALLS edge 當成功能不存在的實例。[registry](../script.js#L8485)、[正式 resolver](../script.js#L10115)

本輪限定的負面結論，例如詳細 catch 的守位限制、1B/3B Evaluation gate，均由 source 的明確條件支持。對未覆蓋情境則標明證據不足，不宣稱全域不存在。

本機 PowerShell / Node 最初因 sandbox `setup refresh had errors` 無法啟動；後續工具執行使用獲准的 sandbox 外流程。這是執行環境限制，並非專案測試失敗。

### 執行的既有代表性測試

| 命令 | 本輪結果 | 證據範圍 |
|---|---:|---|
| `node tests/defensive-opportunity-production-integration-test.js` | 14/14 PASS | 實體球責任、2B ground / line、fly actor 分派、stale actor、存檔 |
| `node tests/defensive-decision-throw-production-integration-test.js` | 16/16 PASS | 2B 控球／第一傳投影、receiver identity、4-6-3、重送／reload、legacy home legality |
| `node tests/match-full-game-record-test.js` | 13/13 PASS | 完整高中比賽、正式記錄、局中 reload、重複 finalize |
| `node tests/ss-defensive-production-integration-test.js` | 26/26 PASS | SS 參照、2B meaningful / routine 最終得分一致性、公開 handler、exactly-once |
| **合計** | **69/69 PASS，4 套件** | 未重跑全套測試 |

引用但未重跑的舊 fixture 測試包括 [2.2.2](../tests/baseball-match-foundation-2-2-2-test.js)、[2.2.3](../tests/baseball-match-foundation-2-2-3-test.js)、[Timing Foundation](../tests/defensive-runner-throw-settlement-foundation-test.js)。2.2.2 / 2.2.3 使用明示 scenario / development position 及精簡 VM runtime，不能單獨證明目前完整 roster、physical identity、Evaluation 與生命週期均已接通。

另以既有 `tests/high-school-career-test-context.js` 執行記憶體 diagnostic；未建立、修改或保存測試檔案。以下區分三種證據：

1. **Source contract**：條件、呼叫與 owner 的直接證據。
2. **明示 Production fixture / public handler**：合法 roster 加宣告的球、跑者、能力與 roll，再通過正式 handler；證明可達性，不證明自然頻率。
3. **既有 careerFixture 啟動完整 Production 比賽**：fixture 先建立合法 starter，之後不覆寫球、跑者、能力或結果，使用 `playCareerMatchToEnd()`。fixture 本身將 baseballSkills 設為 12，故也不是自然生涯分布或頻率 cohort。[context](../tests/high-school-career-test-context.js)

## B. Production Coverage Matrix

### 分類規則

- **PRODUCTION**：在註明範圍內，正式比賽可達並使用既有 owner；可以是自動處理，不代表一定有玩家選項。
- **PARTIAL**：已有正式子路徑，但缺少重要責任、執行、證據或身份階段。
- **FOUNDATION ONLY**：存在可重用的共用能力／合約，該守位的目標正式路徑未接通。
- **SIMULATION ONLY**：只確認壓縮 PA 或其他守位路徑中的 NPC 處理，沒有該玩家守位的完整操作／證據链。
- **NOT IMPLEMENTED**：有界 source 明確沒有目標能力；不能僅憑未觀察到來使用。
- **NOT APPLICABLE**：棒球工作本身不適用；本矩陣所列能力對四個內野守位都有意義，因此沒有用此標籤迴避缺口。

矩陣以「玩家在該正式守位的工作」為主。其他玩家守位路徑中的 NPC 1B／SS 接傳，不能算成玩家 1B／SS 已完成整合。詳細物理路徑的有限範圍與證據不足，在 E01–E16 說明；標籤不是全棒球規則覆蓋率。

| Capability | 1B | 2B | 3B | SS | 證據 |
|---|---|---|---|---|---|
| Ground Ball Opportunity | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E01 |
| Line Drive | SIMULATION ONLY | PRODUCTION | SIMULATION ONLY | FOUNDATION ONLY | E02 |
| Fly Ball | SIMULATION ONLY | FOUNDATION ONLY | SIMULATION ONLY | FOUNDATION ONLY | E03 |
| Defensive Read | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E04 |
| Player Decision | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E05 |
| Reach / Secure | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E06 |
| Throw Execution | PARTIAL | PARTIAL | PARTIAL | PRODUCTION | E07 |
| Receive Throw | PARTIAL | PARTIAL | SIMULATION ONLY | SIMULATION ONLY | E08 |
| Force Out | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E09 |
| Tag Out | FOUNDATION ONLY | PRODUCTION | PARTIAL | PARTIAL | E10 |
| Double Play | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E11 |
| Runner Timing | PARTIAL | PARTIAL | PARTIAL | PRODUCTION | E12 |
| Play Settlement | PRODUCTION | PRODUCTION | PRODUCTION | PRODUCTION | E13 |
| Game Record | PARTIAL | PARTIAL | PARTIAL | PRODUCTION | E14 |
| Evaluation | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E15 |
| Save / Load | PARTIAL | PRODUCTION | PARTIAL | PRODUCTION | E16 |

### 每列證據與邊界

**E01 — Ground Ball Opportunity。** 一般實體滾地球詳細 access 只支持 SS 的 `leftSide / middle` 與 2B 的 `rightSide`；正式 shim 還要求當前 primary defender 是玩家。共用 topology 將左側／中線 primary 指定 SS，右側 primary 指定 2B；3B、1B 目前是 secondary overlap，沒有自己的 primary ground bin。1B、3B 的通用正式 ground scenario 仍存在，因此是 PARTIAL 而非「沒有玩法」。2B 的 PRODUCTION 僅限已接通的右側 slice，其他球的 synthetic fallback 是 R1 缺口。[access](../batted-ball-ground-defense.js#L233)、[topology](../defensive-opportunity-foundation.js#L34)、[shim](../script.js#L4986)、[測試](../tests/defensive-opportunity-production-integration-test.js)

**E02 — Line Drive。** 詳細 catch gate 是 `lineDrive + shallow + rightSide + 二壘手`；正式路徑自動 resolve / apply，再產生 `playerRoutinePlay`，不詢問要不要接穩。SS 的 shallow-left / middle nominal responsibility 與通用 Reach / Secure 可重用，但正式 physical shim 不接納 SS line drive。1B、3B 只確認通用 PA outcome 層，沒有獨立 detailed catch 工作。[catch gate](../batted-ball-line-drive-defense.js#L73)、[自動接殺](../script.js#L5275)、[正式事件](../script.js#L5345)、[PA fallback](../script.js#L5199)

**E03 — Fly Ball。** 共用 topology 有 shallow-left SS、shallow-right 2B；詳細 fly catch 卻只支持 medium/deep 的 RF、CF。因此不能將正式比賽中成功的 NPC fly catch 算為內野玩家 catch；1B、3B 仍只有 PA 級壓縮結果證據。此為 scoped implementation gap，並非四個內野守位不應處理飛球。[topology](../defensive-opportunity-foundation.js#L43)、[fly gate](../batted-ball-fly-ball-defense.js#L63)、[正式 catch 分支](../script.js#L12343)、[測試](../tests/defensive-opportunity-production-integration-test.js)

**E04 — Defensive Read。** `adaptInfieldInformation` 四守位可用，讀壘況、球速、方向、深度與路線窗口。SS / 2B 的 supported ordinary ground 以真實 handoff 作來源；1B / 3B 多為 synthetic context；其讀取畫面不能證明來源球責任正確。舊「反手／正手」或動作詞沒有對應獨立 SS execution state。[read adapter](../script.js#L8316)、[situation derivation](../script.js#L7345)、[fallback](../script.js#L12380)

**E05 — Player Decision。** 四守位可生成 legal choices，正式 handler 會檢查可見性、momentId、phase 與 completed moment。1B / 3B 的公開 fixture 已得到 `true`，重送 `false` 且無權威狀態變更；但 `groundBallInPlayState.supported=false`、沒有 ground lifecycle / decisionIdentity，所以是 PARTIAL。2B 公開選項並不等於 Foundation 所有 `availableRoutes`：例如 `forceSecond` 出現在 post-control Foundation surface，不代表已是一個獨立玩家 UI 選項。[選項](../script.js#L7507)、[公開 handler](../script.js#L3635)、[路由](../script.js#L12740)、[2B 測試](../tests/defensive-decision-throw-production-integration-test.js)

**E06 — Reach / Secure。** 通用 Foundation 已把 reaction / range / mobility 的 reach 與 fielding / catching 的 secure 分開。SS supported ground 使用 canonical secure；2B ground 保留既有 control authority，再由 `projectGroundControl` 投影，2B line 使用 canonical secure。1B / 3B 只有通用 fielding window，沒有該球綁定的 canonical reach / secure identity。[Foundation](../defensive-reach-secure-foundation.js#L49)、[SS](../script.js#L11022)、[2B projection](../script.js#L11171)、[generic](../script.js#L8233)

**E07 — Throw Execution。** SS 的第一傳實際呼叫 `resolveThrow`，分離 arm / accuracy、distance、transfer readiness、deterministic variation。2B 是 `projectExistingThrow`，`strengthMargin / accuracyMargin=null`，不能聲稱已具 SS 等級的獨立傳球物理。1B / 3B 用 composite window，且自踩／踩三壘錯用 throw completion（R2）。SS relay 第二傳仍用既有 relay model，並非每段都已有獨立 throw-strength simulation。[throw](../defensive-decision-throw-foundation.js#L119)、[2B adapter](../defensive-decision-throw-foundation.js#L160)、[generic](../script.js#L8233)、[SS 第一傳](../script.js#L11027)

**E08 — Receive Throw。** 1B 在自身 3-6-3 有回壘／回傳接球 proxy，但尚無接其他內野手來球的獨立玩家正式 entry。2B 有 `coverSecondFor643` 的 receive / force / pivot / secondThrow 自動工作，但來源仍可能是 synthetic SS scenario，而不是已解出的 SS physical first throw handoff。NPC SS、1B 接傳已在 2B / SS route 模型使用；3B 也能作為 NPC receiver。這些不能替代玩家 SS／3B 的 receiver path。[1B return](../script.js#L8248)、[2B coverage](../script.js#L8139)、[receiver role](../script.js#L7160)、[共用 relay](../script.js#L7973)

**E09 — Force Out。** 四守位共用真實 runner identity 與 force owner。SS 一壘、二壘封殺及 6-4-3 已有公開證據；2B 的 4-6-3 第一段、三壘與本壘 force route 已有 source / fixture。1B 自踩、3B `5U` 路線有正式 generic execution，但非傳球動作與 receiver 驗證仍不完整，不能稱完整 force execution。[choices](../script.js#L7574)、[force settlement](../force-advancement.js#L103)、[SS 套件](../tests/ss-defensive-production-integration-test.js)

**E10 — Tag Out。** 2B 非 force home route 明確分出 catcher possession、receive、tag opportunity、tag timing，再作 `nonForceTag` 結算。3B generic `tagHome` 只有 composite first-out / throw window，沒有同等 catcher tag leg。SS Foundation 第一傳具 tag delay / receiver state 與可選 home route，但本輪沒有取得 SS 非封殺觸殺的公開完整情境證據，故標 PARTIAL、證據不足以列 PRODUCTION。1B 玩家選項目前未接此 tag 工作，只有可重用的 generic tag Foundation。[2B tag leg](../script.js#L8055)、[generic](../script.js#L8273)、[tag rule](../defensive-runner-throw-settlement-foundation.js#L73)、[SS receiver state](../script.js#L11035)、[Foundation 測試](../tests/defensive-runner-throw-settlement-foundation-test.js)

**E11 — Double Play。** SS 6-4-3 與 2B 4-6-3 都是現存正式多段執行，並分辨 player / teammate leg。2B coverage 的 6-4-3 屬 execution-only，合理維持自動。1B 3-6-3、3B 5-4-3 有 generic choices / resolver，但没有同等逐段物理與 receiver truth；3B 更可在弱 1B receiver 下仍生成二出局（R3）。[SS](../script.js#L11049)、[2B](../script.js#L8039)、[coverage](../script.js#L8176)、[generic](../script.js#L8243)、[1B fixture](../tests/baseball-match-foundation-2-2-3-test.js)

**E12 — Runner Timing。** SS 第一段使用 runner start / progress / speed 與球到達、接球完成的相對時間比較，不重新擲 safe/out。2B 投影已有窗口與 receiver facts，但 `timingMargin=null`；1B / 3B 更主要是 composite speed / windows。這些都有 timing influence，不能判成不存在；也不能把 window state 當成完整 arrival comparison。所有時間仍是 coarse relative units。[resolveTiming](../defensive-runner-throw-settlement-foundation.js#L14)、[projection](../defensive-runner-throw-settlement-foundation.js#L113)、[generic windows](../script.js#L7319)

**E13 — Play Settlement。** 四守位的 infield branch 都接 `ForceAdvancement`、`finalizeHighSchoolDefensiveThirdOut`、`applyHighSchoolDefensiveSettlementFacts`；最後只由 Match State owner 變更 outs / bases / scores。1B / 3B 上游 execution 的不足不代表結算 owner 缺失。第三出局最終 projection 用 legal scoring facts，保留 raw scoring attempt；不能把 raw `runsAllowed` 再覆蓋事件。[runner facts](../script.js#L7735)、[third out](../script.js#L10884)、[single apply adapter](../script.js#L11264)、[meaningful / routine](../script.js#L11288)、[SS 與 2B regression](../tests/ss-defensive-production-integration-test.js)

**E14 — Game Record。** 四守位事件確實進入同一記錄 owner，整場比分亦正確。SS initiator 的 A / E / DP 已有公開 handler regression，因此在此 scope 列 PRODUCTION。更廣的 receiver / base-touch scorekeeping 仍有 shared limitation：目前依 player position 或 catch family 判 PO/A，並不是依每個 retirement 的 actor action；不能正確完整描述 3B 踩壘、2B 接球封殺、1B 傳二壘，以及所有 NPC 雙殺參與者（R6）。[event adapter](../script.js#L4343)、[record dispatch](../match-game-record.js#L282)、[stat attribution](../match-game-record.js#L225)、[GameRecord 測試](../tests/match-full-game-record-test.js)

**E15 — Evaluation。** `createDefensiveEvidence` 明確只接納二壘手、游擊手。兩者可拆 decision / execution / outcome / stage / attribution。1B / 3B 並非完全沒有比賽成長：有 defensive innings exposure 與進攻證據；欠缺的是 active defensive evidence，不會因已記錄 PO/A 就自動補出。[position gate](../match-experience-development.js#L238)、[evidence derivation](../match-experience-development.js#L341)、[比賽結束 owner](../script.js#L12128)

**E16 — Save / Load。** 正式 state / roster / record / evidence 共用 normalization，1B / 2B / 3B 完整比賽 probe 的 reload 均語意等價。2B / SS supported ground 有 persisted stage validation、resolved execution recovery 與 exactly-once regression。1B / 3B generic 沒有 equivalent ground execution cache / reconstruction contract，不能把整場 reload PASS 推論成 executed-but-unsettled replay protection 已完成。[normalization](../save.js#L408)、[stale validation](../save.js#L534)、[cached replay](../script.js#L10115)、[recovery](../script.js#L12524)、[identity guards](../script.js#L11288)

## C. Shared Foundation Inventory 與實際 Call Path

### 共用 inventory

| 共用模組／owner | 目前實際使用者 | 可重用內容與限制 |
|---|---|---|
| Match Context / Team Roster / PlayingTimeGameExposure | 四守位正式比賽 | 比賽 identity、主客場、合法 assignment、當前 lineup actor；不是以 career primaryPosition 代替當前守位。[入口](../script.js#L9443) |
| `DefensiveOpportunityFoundation` | SS / 2B ordinary ground、2B line、現有 NPC fly lookup | Ball Type / Direction / Pace / Depth 與當前 roster 綁定；secondary 是 spatial overlap，不能自動當 relay assignment。1B/3B primary bin 尚缺。 |
| `DefensiveReachSecureFoundation` | SS canonical ground secure、2B reach + control adapter、2B line / supported fly catch | reaction / range / mobility、到位品質、fielding / catching、獨立 secure variation；不判 outs / scores。 |
| `DefensiveDecisionThrowFoundation` | SS 第一傳、2B first-throw projection | possession、route target、receiver identity、force context、throw demand / quality；self-cover 明確不是傳給自己。[合約](../defensive-decision-throw-foundation.js#L69) |
| `OffensiveBuntDefensiveHandoff` 的 runner primitives | ordinary ground、bunt、Timing | 共享 runner physical state、arrival profile、timing windows；名字含 bunt 不代表必須重建 ground runner 系統。[ordinary ground reuse](../batted-ball-ground-defense.js#L140) |
| `ForceAdvancement` | 四守位 infield resolver、SS 多段 retirement | 初始 force chain、movement intents、ordered retirements、force removal、所有 survivor 的壘位重建；碰撞與身份不合法會拒絕。 |
| `DefensiveRunnerThrowSettlementFoundation` | SS 第一段 contest、2B timing projection、四守位最終 settlement projection | 分開 timing 與規則，提供 first-leg continuation、before-state validation；不可直接把 first-leg provisional bases 當整球全部跑者結果。 |
| `resolveHighSchoolThirdOutIntegrity` | 四守位 ground 與其他 PA / catch adapter | 唯一合法第三出局／得分判定；force、打者到一壘前出局、catch 等取消得分；non-force 需時序。 |
| `MatchSituationLifecycle` | supported SS / 2B ground 與既有其他 situation | admission、present、decide、execute、resolve、settle、close 與 replay gate；generic 1B/3B ground 尚未接入。 |
| `MatchGameRecord` | 四守位 | 統一 sequence/event identity、比分、PA、玩家守備摘要、finalize；多 actor PO/A/E/DP attribution 尚不足。 |
| `MatchExperienceDevelopment` | 四守位 exposure；2B / SS active defense | 證據 envelope、decision / execution / outcome、attribution、novelty / difficulty；正式 defensive emitter 有 2B/SS gate。 |
| `normalizeSave` / recovery | 四守位一般 state；2B / SS detailed ground | active roster、situation、cached resolution、stage validation；1B/3B 不能只靠 JSON round-trip 當作完整 reconstruction。 |

### 共用正式入口與下游

```text
prepareCurrentHighSchoolYearOneMatch
  -> prepareHighSchoolYearOneMatch / 對應高中年級的既有 Opportunity
  -> createHighSchoolPlayingTimeOpportunity / supplied Opportunity
  -> materializeSelectedHighSchoolRoster
  -> createHighSchoolMatchSimulationRoster + MatchContextFoundation

advanceHighSchoolMatchPlaybackStep
  -> beginHighSchoolMatchDefensiveOpportunity
  -> shouldReachHighSchoolDefensiveMoment
  -> prepareHighSchoolDefensiveMomentFromSimulation
  -> tactical action -> ordinary physical PA / bunt handoff
  -> buildInfieldMeaningfulMoment -> read / legal choices / meaningful + density gate
```

上述函式名含 YearOne，仍被 Year3 正式比賽入口使用；本輪 observed matchId 為 `hs-y3-final-competition-1`。不能以函式命名推論只接第一年。[prepare](../script.js#L9399)、[playback](../script.js#L12558)、[public resolution](../script.js#L12710)

```text
玩家路徑：
getHighSchoolYearOneMatchMomentChoices
  -> getHighSchoolDefensiveMomentChoices
  -> chooseHighSchoolYearOneMatchMoment
  -> resolveHighSchoolYearOneMatch
  -> resolveHighSchoolDefensivePlay -> infieldDecisionFamily.resolve
  -> advanceHighSchoolYearOneAfterMomentTwo
  -> applyInfieldResolutionToHighSchoolMatch

自動路徑：
routine / density suppression
  -> resolveRoutineDefensivePlay -> 同一 infield resolver
  -> applyRoutineDefensiveResolutionToHighSchoolMatch

共用下游：
buildInfieldRunnerFacts / ForceAdvancement ordered retirements
  -> finalizeHighSchoolDefensiveThirdOut
  -> settlement projection -> applyHighSchoolDefensiveSettlementFacts
  -> final scoring projection -> simulation events / completed moments / cache
  -> recordHighSchoolMatchSimulationEvent -> MatchGameRecord.recordEvent
  -> 比賽結束 -> MatchExperienceDevelopment.settleMatchExperienceDevelopment
  -> saveGame / loadGame -> normalizeSave -> stage validation / recovery
```

[public choice](../script.js#L9040)、[handler](../script.js#L3635)、[infield handoff](../script.js#L11691)、[routine](../script.js#L10142)、[settlement](../script.js#L11288)、[event record](../script.js#L4343)、[evaluation owner](../script.js#L12128)

### 四守位的實际分支

| 守位 | 從 common prepare 向下的實際 path | Production 邊界 |
|---|---|---|
| SS | ordinary physical truth -> primary SS actor -> ground access/reach -> supported handoff -> ground lifecycle -> `resolveInfieldDecision` SS branch -> `buildHighSchoolShortstopExecution` -> canonical secure / decision / first throw / arrival timing -> relay -> ForceAdvancement -> shared final settlement | 左側／中線 ordinary ground 完整接通；outside scope 保留 ordinary PA；不是所有 airborne / receive 工作皆接通。 |
| 2B | ordinary physical truth -> primary 2B actor -> right ground reach -> supported handoff -> ground lifecycle -> `resolveSecondBaseInitiatedRoute` -> old control / first throw / teammate model -> `projectGroundControl` / `projectExistingThrow` / `projectExistingTiming` -> shared settlement | 支持右側詳細 ground；4-6-3 及 home tag 有現有路徑。shallow-right line 直接自動 catch / PA settlement。SS-side coverage 由另一 legacy scenario 進入。 |
| 3B | ordinary detailed ground gate 不接納 -> synthetic ball context -> `buildInfieldMeaningfulMoment` -> generic choices（傳一壘、5-4-3、5U、home）-> `resolveInfieldDecision` generic branch -> shared Force / Third-Out / apply / GameRecord | 玩家公開 handler 可達；沒有 3B primary physical opportunity、canonical ground lifecycle、active defensive Evaluation。 |
| 1B | ordinary detailed ground gate 不接納 -> synthetic ball context -> generic choices（selfCoverFirst、3-6-3、home force）-> generic resolver（含 returnReception proxy）-> shared Force / Third-Out / apply / GameRecord | 玩家公開 handler 可達；缺獨立 incoming throw receive entry、1B primary physical ground 與 active defensive Evaluation。 |

[physical gate](../script.js#L4986)、[ordinary handoff](../script.js#L5055)、[prepare fallback](../script.js#L12360)、[dispatch](../script.js#L8211)、[ground lifecycle gate](../script.js#L10909)

### 重複邏輯與權威判定

1. **執行模型並存**：SS canonical secure / throw / timing、2B legacy staged resolver + projections、1B/3B generic windows。這是同一比賽內不同接入深度，不能簡單稱為同一物理模型，也不適合直接把 SS 公式套給所有守位。
2. **多個 force/window compatibility 計算**：canonical ForceAdvancement 之外，仍有 occupancy fallback 與 scenario window derivation；supported path 應以 canonical runner identity / force state 為準。[force compatibility](../script.js#L7005)、[fallback shape](../script.js#L7149)、[windows](../script.js#L7201)
3. **兩個 presentation / event apply wrapper**：meaningful 與 routine 均需維持同一合法得分投影。目前兩者都把最後 `runsAllowed` 設為 legal scoring runner count，且有 2B/SS regression；這是值得維持的 consolidation boundary。[meaningful](../script.js#L11320)、[routine](../script.js#L11487)
4. **沒有發現四守位 infield ground 路徑另建獨立跑者結算權威**：generic 與 detailed 都交給 ForceAdvancement；SS 第一段 `deriveSettlement` 是局部 contest / continuation，不是第二份完整 Match State。最終 outs/bases/scores 都經 `applyHighSchoolDefensiveSettlementFacts`。Airborne / compressed PA 使用既有 PA adapter 與相同 third-out legality；不要為 1B/3B 再複製一套 runner settlement。

## D. Position-Specific Differences 與 Gameplay Depth

### SS

已完成的核心：左側／中線 ordinary ground；read、傳一壘、傳二壘 force、6-4-3；第一傳 timing；隊友 receive / pivot / first-base receive 分段；有序 retirement；GameRecord；active decision / execution evidence；pending / executed / settled reload、stale rejection、exactly-once。依 seed 77001 的既有完整 Production 參照，有 1 次 meaningful、3 次 routine，final score home 1 / away 3，match / record integrity 均空。[SS suite](../tests/ss-defensive-production-integration-test.js)

合理維持：SS 較長橫移與傳球、轉傳給 2B、deep/hole 處理窗口。剩餘深度缺口：forehand / backhand 沒有獨立 action truth；movement/time 是 coarse units；relay 第二段不是獨立 arrival/accuracy 模型；SS 作 incoming throw receiver 與 airborne catch 尚未有相同完整 slice。這些不是 SS Sprint 1 失敗，也不要求本輪新增。

### 2B

正式右側 ground 與 shallow-right line 已接入；4-6-3 由 SS 接第一傳；6-4-3 的玩家 2B cover/pivot 是現有自動工作；home force / non-force home tag 有路線與 stage semantics。[2B routes](../script.js#L7127)、[execution](../script.js#L7983)、[coverage](../script.js#L8139)

與 SS 相同的是 runner、第三出局、最終結算、record/evidence owner；不同的是控制／傳球／timing 仍以旧 resolver 結果投影，不應為了表面統一再加第二個 success roll。中線名義責任由 coarse topology 指定 SS，2B secondary overlap 不能直接視為 4-6-3 起始 ground ownership。2B cover/pivot 的上游 SS throw quality 目前可由 sample 或 fixture 推出，還不是從同一球 SS canonical first throw 接續。

角色責任必須區分 2B 起始傳球、NPC SS receive/pivot、玩家 2B 接 SS 傳球，以及 NPC 1B receive。現有 route explanation 有這些區分；GameRecord 的 PO/A 摘要仍未同樣細分。一般直接傳一壘的 2B resolver 也沒有與 SS 相同的 receiver capability check（R3）。

### 3B

已有 generic 模型：hard pace 增加 first-step demand；3B 傳一壘的 throw window 距離 modifier 較不利；5-4-3、5U、傳本壘路線都存在。共用 throw Foundation 已有 3B-to-first `long` demand，不需要重建 Reach / Secure 或 Runner Settlement。[需求](../script.js#L7309)、[windows](../script.js#L7319)、[commitment](../script.js#L7467)、[throw distance](../defensive-decision-throw-foundation.js#L119)

缺的是：3B primary 的 physical admission、與 SS 區分的球責任、canonical stage / receiver / identity，以及 active defensive Evaluation。現有 `leftSide` 太粗，不能直接把所有左側 ground 同時交给 SS 與 3B。三壘線、近身 hard ground、充足反應後的長傳，以及自踩三壘，都應有位置相關動作需求；自踩 5U 不能通過傳球成功率判定。

3B tag / bunt 目前不是完整自身 slice。已實作的 bunt defense handoff 僅支持 `secondBaseSide + 二壘手`；3B 短打處理不應由 synthetic slowGrounder 的文字存在來宣稱完成。[bunt gate](../offensive-bunt-defensive-handoff.js#L131)、[fallback](../script.js#L12311)

### 1B

**接其他內野手傳球**：SS / 2B 路徑會評估 NPC 1B 接球能力；這代表 receiver model 存在。玩家本身站 1B 時，尚未發現由別的內野手正式解出的 incoming throw 觸發該玩家 receive stage / evidence 的 entry。壓縮 NPC PA out 不是此工作已完成的證據。

**自己處理擊球**：已有自踩一壘、3-6-3 與回一壘接球 proxy；慢滾球的 routine event 可標 `pitcherCoverFirst`。但後者目前是 executionRoute 描述，不代表已完成 canonical pitcher receiver / base-touch contest；generic commitment 與 execution 仍有錯配，需後續追蹤。[routine route](../script.js#L10133)、[generic commitment](../script.js#L7472)、[return proxy](../script.js#L8248)、[既有 fixture](../tests/baseball-match-foundation-2-2-2-test.js)

1B 的特色應在 possession、守壘、到位、incoming throw quality、接球可靠度、自踩或交給既有補位者，以及 3-6-3 的回壘。壞球接傳／伸展／挖地球沒有完整獨立動作狀態的證據，不能把 generic fielding threshold 視為完成。這些需要 receive contract，而不是更多重複的「穩穩處理／積極處理」按鈕。

### 七個深度維度

| 維度 | SS | 2B | 3B | 1B |
|---|---|---|---|---|
| 守位責任頻率 | 有 physical ground 與 recurring phase | 右側 physical + recurring phase；中線多為 SS primary | formal flow 多仍限初始 defense phase，沒有自身 primary bin | 同 3B；日常接傳責任未獨立呈現 |
| 有意義決策頻率 | first vs force second / DP 等不同結果 | first vs 4-6-3 / lead / home；cover/pivot 自動 | generic 多 route 存在，但 physical eligibility 缺失 | self-out vs throw/DP 有價值；incoming receive 通常不需 route 選擇 |
| 執行難度 | 移動、控制、第一傳、relay窗口 | 起始與pivot工作不同；舊 composite 尚待接續 | 快反應、長傳、自踩動作需區分 | hands / base readiness / return，不應依賴不存在的傳球 |
| 隊友合作 | 2B / 1B relay 已分段 | SS / 1B relay；接 SS feed 的上游真實性不足 | 2B pivot / 1B receive 尚未完整 | passive receiver、投手補位及 SS return 是不同工作 |
| 局面影響 | 一出局、force、DP、得分壓力 | 同時有 lead/home tradeoff | 5U、長傳與防得分有高局面價值 | 穩定完成隊友傳球可影響大量出局，不能只看按鈕數 |
| 失敗代價 | 控球、offline、隊友失敗、快跑者已有區分 | 部分 route 有分段；direct receiver 與fallback仍不足 | composite原因可能漏掉 receiver 或錯怪 throwing | 目前缺 passive receive 的個別失誤／成功證據 |
| 成長與評價 | active + exposure | active + exposure | exposure；active defense 被 emitter gate 排除 | exposure；active defense 被 emitter gate 排除 |

頻率限制有明確程式來源：`advanceHighSchoolMatchPlaybackStep` 只讓 2B / SS 在 `finalOffense / finish` 繼續查 defensive opportunities，1B / 3B 通常只有 `target=defense` 的初始階段。這是 engine 接入差異，不是棒球守位自然頻率。[phase gate](../script.js#L12636)

應維持自動：無戰術分岔的接殺、routine ground-to-first、自踩一壘、既定 cover/pivot、一般正常接傳。值得玩家決策：有多個不同且 viable 的目標，並有出局／失分／雙殺風險取捨；控制失誤後若仍有真實可選 continuation，才可考慮 reassessment。既有 dedupe、meaningful gate 與 density gate 已支持此方向；單純問「是否接穩」不是有意義選項。[meaningful gate](../script.js#L7613)、[density](../script.js#L2796)

不能以 seed 77001 的單場 decision 數量定義各守位深度；也不建議用新增打擊事件補償守備接入不足。

## E. Missing Production Links 與觀察結果

### 本輪完整 Production 比賽觀察

條件：`careerFixture(position, "starter", 77001)` -> `choose("critical_offseason", 1)` -> `playCareerMatchToEnd()`；無賽中球、跑者或結果 override。

| 守位 | 完成／final record | 比分 home-away | Meaningful defense | Routine player defense | Active defense evidence | Match / Record issues | Reload 語意等價 |
|---|---|---:|---:|---:|---:|---|---|
| SS（既有 suite witness） | true / final | 1-3 | 1 | 3 | 有 shortstop families | [] / [] | true（既有 regression） |
| 2B（記憶體 probe） | true / final | 4-3 | 0 | 2 | 7 | [] / [] | true |
| 3B（記憶體 probe） | true / final | 8-6 | 0 | 1 | 0 | [] / [] | true |
| 1B（記憶體 probe） | true / final | 10-7 | 0 | 1 | 0 | [] / [] | true |

各場 Record final score 都等於 Match score。Reload 使用 host plain JSON objects 的 `isDeepStrictEqual` 比較；沒有實質差異。最初 `JSON.stringify` byte comparison 為 false 的原因是鍵順序，不是存檔資料遺失。此小樣本只證明 completion / integration 現象，不能當守位頻率、平衡或成功率的統計。

### 缺口清單

| ID | 現有證據 | 缺失階段／守位 | 玩家實質影響 | 是否阻礙後續整合 |
|---|---|---|---|---|
| G1 | topology 只有 SS / 2B primary ground；1B/3B public handler fixture 仍成功 | Physical responsibility -> opportunity；1B、3B，2B outside scope | synthetic 球可進入玩家守區，不能保證每次決策對應同一實體球 | 是，應先立 admission 邊界 |
| G2 | generic selfCoverFirst / stepThird 共用 throwCompleted | Action-specific execution；1B、3B | 無傳球的動作被低 arm/throwing 判成 late / safe | 是，新增 physical slice 前須定義 action contract |
| G3 | SS relay已有 receive checks；3B generic DP不看1B receiver；2B direct route自動假定receiver | Receive / continuation；3B、2B，未完整的1B工作 | 隊友失敗可被忽略，甚至仍算完成出局；玩家原因與隊友原因不完整 | 是，接傳責任共用前需處理 |
| G4 | `createDefensiveEvidence` 僅接受 2B/SS | Active evidence emitter；1B、3B | 已完成正式守備只剩 exposure，不能形成按階段的守備成長證據 | 是，Production 定義需包含 evidence |
| G5 | ground lifecycle gate要求supported handoff；event provenance目前SS conditional | Decision / lifecycle / identity；1B、3B；2B event一致性 | 公開可選但無同等 physical-linked decision provenance / recovery | 是，不能僅靠新 route 名稱驗收 |
| G6 | PO/A依position；recordDefensivePlay只記單一player line | Actor-specific GameRecord；四守位 receiver / base-touch | 摘要比分對，但接球刺殺、協助刺殺與雙殺參與不完整 | 是，尤其擴充1B receive / 3B自踩時 |
| G7 | phase gate recurring僅2B/SS | Opportunity scheduling；1B、3B | 即使有routine責任，也不能像2B/SS在後段持續走既有defense entry | 是，應在physical admission接通後補齊 |
| G8 | line / fly detailed gate有限；bunt只2B side | Airborne / bunt；部分或全部內野守位 | 球型／落點不支持時回PA或synthetic；不能保證真實對應工作 | 首個3B ordinary ground整合可先不擴張，但須明示fallback與範圍 |

### 可重現條件：已觀察問題，不在本輪修復

**R1 / G1 — physical ball 被 synthetic fallback 重新指定守位。** 使用合法 starter、inning 5 上、0 out、一壘有人、standardAttack、playerCapabilities 全 10，ordinary physical rolls `{contactQuality:.65, ballType:.1, pace:.68, direction:.05, depth:0}`、outcomeRoll `.5`。取得真實 `groundBall / firm / leftSide`，nominal primary 為 SS：

| 玩家守位 | physical handoff supported | synthetic primary / direction | 可選 route |
|---|---|---|---|
| 1B | false | 一壘手 / straightAtPlayer | selfCoverFirst、3-6-3、controlledHold |
| 3B | false | 三壘手 / leftSide | 三壘手-3、5-4-3、controlledHold |
| 2B | false | 二壘手 / straightAtPlayer | 4-3、4-6-3 |

1B、3B 分別將 presentation cursor 推至 decision，再以公開 `chooseHighSchoolYearOneMatchMoment(..., ()=>.8)` 選 secure，均返回 true、記錄一出局；重送返回 false、Match/Record 無 mutation。兩者的 decisionIdentity 為 null、沒有 closed ground situation、active defensive evidence 為 0。這是**明示 Production fixture 的公開 handler 重現**，不是自然 witness。根因為 unsupported ordinary contact 之後，只有 SS 提早走 ordinary PA return；其他 infield 會落入 `setHighSchoolDefensiveBallContext` / synthetic build。[SS return 與 fallback](../script.js#L12360)

**R2 / G2 — 自踩壘使用傳球能力門檻。** 以合法 roster 在記憶體 `buildInfieldMeaningfulMoment` 建明示 generic scenario：normalGrounder、straightAtPlayer、normal depth、runner/batter speeds=1、0 out、1B/2B有人、fielding/catching/reaction/range/decision=10、sample=.5；只比較 arm/throwing=1 與 10。

| action | arm / throwing=1 | arm / throwing=10 |
|---|---|---|
| 1B secure -> selfCoverFirst | 0 out、late、throwingIssue、throwWindow 2.72 | 1 out、complete、throwWindow 10.82 |
| 3B lead -> stepThird / 5U | 0 out、late、throwingIssue、throwWindow .42 | 1 out、complete、throwWindow 8.52 |

原因：generic route 非DP出局仍要求 `firstOutCompleted && throwCompleted`，沒有按 action 分出 possession + base touch。影響1B/3B generic路徑；不能用提高能力或重新平衡成功率掩蓋。[commitments](../script.js#L7472)、[generic result](../script.js#L8273)

**R3 / G3 — generic 5-4-3 漏掉一壘接球失敗。** 使用上述3B scenario、player能力全10、pivot fielding/reaction/throwing=10、batter/runner speed=1、sample=.8；只把 `situation.teammates.firstBaseReceiver.capabilities.fielding` 從10改為1。兩者都產生2 outs、balancedExecution、responsibleActor=player。generic secondOut只看pivot、window與1B玩家回壘proxy，3B情境不檢查末端1B receiver。[generic relay](../script.js#L8243)

另有 source-confirmed 2B direct-route 缺口：非DP、非home-tag的route只判 `firstThrowCompleted && window != expired`，`teammateStages.receiver`直接依completed生成，未讀receiver能力。SS direct-first的receiver failure regression已存在，但不能推論2B所有route同樣處理。[2B direct](../script.js#L8085)、[SS receiver regression](../tests/ss-defensive-production-integration-test.js)

**R4 / G4 — active defensive Evaluation 的位置 gate。** 完整比賽中的1B/3B `playerRoutinePlay`與GameRecord正常，卻沒有firstBase/thirdBase active family。source直接排除非2B/SS；這是確定的production link缺口，不是依單場零決策推測。[gate](../match-experience-development.js#L238)

以上R2/R3為明示scenario的resolver diagnostic，未宣稱已經在自然比賽觀察到其頻率；本輪不擴充成新回歸測試。

## F. Architecture / Cross-Position Risks

| 風險 | 判定與範圍 | 後續要求 |
|---|---|---|
| 守位合法性 | 高中年齡下PlayingTimeGameExposure與Roster都禁止左投2B/SS/3B，退到合法副守位或1B；SS套件包含正式fallback。二者低齡門檻不同（>12與>=10），本輪高中範圍一致，未擴張低齡稽核。[exposure](../playing-time-game-exposure.js#L84)、[roster](../team-roster-foundation.js#L69) | 重用正式Opportunity / assignment，不用development override繞過；年級與左投都列驗收。 |
| Override污染 | 比賽有developmentPositionOverride / capability adapter；SS既有測試確認career primaryPosition與baseballSkills不變。不能把overridefixture當正式physical responsibility證據。[prepare](../script.js#L9430)、[capability](../script.js#L6397) | 維持one-match scope與透明來源，不寫回career能力。 |
| 球責任／互斥決策 | canonical primary / active actor有綁定與stale guard；SS outside-scope不製造新ground；其他legacy fallback仍有R1。secondary overlap不是第二個同時player decision。 | 同physicalIdentity只建立一個互斥situation；receiver與primary的角色可同球接續，但不是兩次獨立重新生成球。 |
| Lifecycle / mutex | normal playback會檢查activeSituation並阻止繼續；prepare頂端的額外mutex是SS專用。1B/3B缺supported ground lifecycle，而不是已證明normal playback會同時開兩個決策。[playback gate](../script.js#L12563)、[prepare gate](../script.js#L12254) | 新守位entry必須有共用admission/mutex；不能只保留SS guard再新增直接呼叫入口。 |
| 接傳責任 | SS/2B部分route已有player、teammate、timingWindow分離，但R3顯示並非所有route一致；receiver ready與base-touch/tag目前仍多為proxy。 | 分別保留player read、secure、throw、teammate receive、pivot、runner speed，不能把teammate miss全部算player error。 |
| GameRecord (R6) | 單一player summary按position決定PO/A。2B cover force、3B stepThird / tag、1B throw-to-second不能只按守位推PO/A；NPC relay participation沒有完整ledger。[record](../match-game-record.js#L225) | 以實際actor/action/retirement投影PO/A/E/DP，事件序列去重；不能將同一play的meaningfulMomentResolved與defensiveResolution各計一次。後者目前只作eventRef。 |
| Evaluation | 共用envelope足夠，但emitter硬編碼2B/SS；generic 1B/3B也缺playerLeg，不能只刪掉position gate就宣稱完成stage evidence。 | 一起接stage facts、position、responsible actor、provenance；exposure與active分開，不從out數倒推決策或接球品質。 |
| 第三出局與得分 | legal scoring authority已共用，69項代表性checks沒有回歸。SS/2B非force第三出局且缺before/after時序時，canonical authority會標TIMING_PLAY_UNRESOLVED而拒絕commit。[third-out](../script.js#L6696)、[commit barrier](../script.js#L11264) | 所有新增route沿用ordered retirements / scoring attempts；沒有時序不得猜award；event/cache/evidence只讀最終投影，rawexecution保留。 |
| Save / replay | 2B/SS stage validation與resolved recovery接通；generic 1B/3B有moment/settlement identity guard但沒有同等cached executed state。整場save/load成功不等於所有中間phase已驗證。 | pending、executed未settled、failed-control、settled、reloadedduplicate、tamperedactor/route/timing都需逐階段驗收；rebuild不得讀RNG或改simulationCursor。 |
| 方程式consolidation | 新canonical與legacy模型使用不同roll／threshold／time units。直接替換會變更難度、球權或再消耗RNG。 | 先統一輸入/輸出與owner；保留已驗證2B execution authority，以adapter逐步移交，任何行為變更要有明確驗收。 |

## G. 最多三個後續 Sprint 建議

### Sprint 1 — 共用內野合約整併與 2B Production 補齊

**核心目標**：在不重做SS的前提下，建立一致的physical admission、action / receiver事實與final evidence投影，補齊2B與SS之間的接入落差。

**為何優先**：R1、R3、R6與identity/provenance差異會被新的3B/1B入口放大。2B已有正式route和舊authority，適合先定清adapter邊界；不是要求全repo重構。

**重用Foundation**：DefensiveOpportunity、ReachSecure、DecisionThrow、RunnerThrowSettlement、ForceAdvancement、Third-Out、Lifecycle、GameRecord、MatchExperience。

**施工邊界**：僅共用infield contracts與2B現有ordinary ground / receiver接續；修正outside-scope admission，補receiver/actor evidence與統計投影。保持已驗證SS行為與2B既有execution ownership，禁止增加第二個control/throw/safe-out roll；不擴張外野／投捕玩法或以更高能力掩蓋bug。self-cover/base-touch所需合約可先定義，其具體1B/3B整合留下一輪。

**驗收條件**：同球physicalIdentity／primary actor唯一；unsupported球保留原PA來源；2B第一傳、SS feed與receiver各有真實actor/provenance；direct receiver失敗不虛構out／不錯怪玩家；PO/A/E/DP依actor/action投影且不雙記；routine / meaningful都使用最終legal scoring；pending/executed/settled reload與重送不reroll、不mutation；SS現有regression維持通過。

**主要風險**：把2B legacy projection誤當全新physical resolver；修admission後候選頻率改變；把NPC relay與player decision合成重複事件。需同時保留明示fixtures與無賽中override的完整Production觀察。

### Sprint 2 — 3B Ordinary Ground Production Integration

**核心目標**：接通physical opportunity -> playerread/choice -> canonical execution -> shared settlement ->record/evaluation/save；首個slice包含傳一壘與自踩三壘，5-4-3按真實relay stage驗收。

**為何優先**：目前缺口大部分是接入與position-specific action，而現有Foundation已有反應／移動／secure、3B長傳demand、force與third-out owner。工程範圍比1B的雙入口工作較集中。

**重用Foundation**：上述全部owner，尤其3B-to-first long throw、ForceAdvancement ordered retirements、SS/2B既有relay primitive與final evidence projection。

**施工邊界**：新增可區分SS與3B的responsibility evidence／topology版本或等價可驗證binding；不能把原有全部leftSide改交3B。ordinary ground的短反應與長傳、自踩5U分成不同action需求；不複製跑者結算。不承諾本Sprint同時完成bunt、內野fly、全種類tag或精細forehand/backhand動畫/UI。

**驗收條件**：3B合法active actor，左投正式fallback；SS/3B同球責任不重疊；沒有賽中ball/result override的正式入口能產生3B routine與有價值decision；低throwing不應直接讓已控制球的5U失败；長傳失誤、弱receiver、只拿DP第一out與快runner可區分；同一runner retirement、force第三出局取消run、non-force時序規則不變；active thirdBase evidence與正確PO/A/E/DP；四種reloadphase與exactly-once；career position/skills不受override污染。

**主要風險**：coarse leftSide資料不足造成球吸附；直接重用generic throw導致R2/R3；新增Evaluation只移除gate卻無stage truth；其他守位候選責任意外改變。

### Sprint 3 — 1B Receive 與 Active Ground 的雙入口整合

**核心目標**：讓玩家1B既能接其他內野手的已解出傳球，也能處理自己的ordinary ground；兩者共享possession / actor / settlement / evidence，但保留各自入口與動作。

**為何第三**：1B常見接傳工作對團隊出局品質很重要，但不能透過擴充groundaccess單一gate完成。Sprint1/2先提供可接續的throw與receiver事實後，1B才能取得正確的incoming source與責任歸屬。

**重用Foundation**：DecisionThrow的resolved throw facts、Receiver readiness／timing、canonical roster與Lifecycle、Force／Third-Out、單一applyadapter、GameRecord與MatchExperience；自踩使用Sprint1定義的base-touch actioncontract。

**施工邊界**：分開incomingreceive與primaryground；自踩一壘、既有補位者接球、3-6-3返回一壘是不同action／participant role。先用可驗證coarse incoming quality與到位／接球完成，不要求同輪完成精細挖地球、伸展或碰撞幾何。補位者只消費既有roster actor，不擴張投手系統；不新增獨立runner settlement。

**驗收條件**：正常receive與challenging/offline/unavailablereceive可分辨；thrower failure与1B receive failure各自 attribution；自身控制球自踩不讀throw margin；3-6-3第一out、pivot、回壘/接球、第二out各記真實stage；player1B PO/A/E/DP與firstBase active evidence對齊；ordinary routinereceive維持自動，有不同局面結果才給decision；pending/executed/settled reload與duplicate不重播；共享scorelegality維持一致。

**主要風險**：將NPC1B既有threshold冒充玩家接傳完成；把同球primary与receiver各做一次完整PA／settlement；接球失敗直接歸責thrower或把offline全算1Berror；為了增加操作而要求每球人工確認接穩。

## H. Final Recommendation

1. **是否具備完整內野守備的共用基礎？** 具備可重用核心與統一結算／記錄／存檔owner，足以支撐後續整合；但physical responsibility、action/receiver契約、多actor統計與1B/3B active evidence仍不足，不能宣稱四守位已完成。
2. **下一個最值得新增Production Integration的守位？** 3B。先做有界共用整併／2B補齊，再接3B ordinary ground；1B随后以receive與active ground雙入口整合。
3. **是否先做Consolidation？** 是，範圍限physical admission、action/receiver truth、final projection、identity/provenance與record/evidence，不做大規模公式合併、不重做SS、不複製runner系統。
4. **哪些差異應保留？** SS/2B左右／中線責任、4-6-3與6-4-3的actor拓撲；3B快速反應／長傳與自踩三壘；1B incomingreceive／自踩／回壘工作；守位各自的routine比例、meaningfulgate與失敗來源。不要求決策數量相同，不把airbornecatch、pivot或正常receive強制變成人工決策。

本輪交付止於此稽核報告，等待人工審查。
