# Pitch Tactical Intent Semantic Contract v0.1

日期：2026-10-09。Sprint type：**DESIGN / CONTRACT / TESTS ONLY**。

Baseline：`main`；HEAD = origin/main = `2a4b44a034b714b8de3c8a6897507995ab0f8ccd`；`feat: establish tactical decision production adapter`。

本契約分開定義 **TACTICAL PURPOSE、TRIGGER EVIDENCE、TEMPORAL SCOPE、ELIGIBILITY、FINAL SELECTION AUTHORITY**。同名不代表同 authority。Runtime gameplay changes = **ZERO**；未建立 signal consumer、arbitration、bonus、veto、floor、priority conversion、save schema 或 vocabulary rename。

## 1. Layer ownership

| Layer | 所有的資訊／責任 | 邊界 |
|---|---|---|
| Observation | 從 detailed player pitchHistory 的 completed event 投影可觀察事实；保留 pitch／PA identity 與 count | 結構驗證不能自行認證 caller provenance；compressed NPC event 不支援；不推論心理或 next-pitch strategy |
| Sequence | 同一 PA 的 observed facts、累積 counts 與 consecutive streaks；新 PA 建立 fresh state | 不保留 recommendation class／target，也不管理 PA lifecycle 或 cross-PA memory |
| Interpretation | 從 Sequence consumed counters 建立 `CURRENT_PA` pattern presence | `CURRENT_PA` 是 evidence scope，不能單獨證明 PA 仍 live；不擁有 production eligibility |
| Decision intent | **deterministic interpretation-to-purpose projection** | `selectedIntent` 代表 Foundation preferred tactical purpose，**不是 final production intent** |
| Adapter candidate | **compatibility / admission layer**；canonical vocabulary、version、PA／completed-count boundary、repeat helper gate | candidate 是 **eligible production-space proposal**，不是 final selection；Adapter 不是 arbitrator |
| Production tactical intent | count、latest observable feedback、bounded tactical memory、pitcher context 與既有 weighted hash selection | `PitcherCatcherTacticalIntegration.chooseTacticalIntent` 是 **ONLY FINAL PRODUCTION INTENT OWNER** |

現有 Decision priority 為 `changeLook > repeatSuccess > expand > challenge > resetNeutral`，只屬於 Foundation projection。Adapter 只消費 selected projection；selected repeat 被拒絕時不提升 expand runner-up。`resetNeutral` 是 Foundation fallback，Adapter abstains，Production 仍正常自行選擇。

## 2. Four canonical intent contracts

「Production arbitration eligibility」欄區分現有 shadow admission 與未來 influence readiness；本 Sprint 沒有啟用 arbitration。

| Intent | Tactical purpose | Foundation trigger | Production trigger/context | Temporal scope | Alignment | Production arbitration eligibility |
|---|---|---|---|---|---|---|
| `challenge` | 更積極攻擊可競爭的好球區；recommendation 使用既有 hittable／competitive classes | `TAKE_PATTERN_PRESENT`、`TAKE_PATTERN_STRONG`、`CALLED_STRIKE_PATTERN_PRESENT` | base challenge preference、3-ball preference、pitcher cognitive／command context、weighted selector；沒有 accumulated take-pattern rule | Foundation：CURRENT_PA；Production：當前 count 與既有 context | STRONG purpose alignment；PARTIAL trigger alignment；`NEW_PA_PATTERN_SIGNAL` | 正確 live 同 PA N→N+1 可作 shadow candidate；未來 typed pattern 可研究，沒有 override authority |
| `expand` | 使用邊角／帶外位置誘使追打，保持既有 executable-class compatibility | `CHASE_PATTERN_PRESENT` 或 `SWING_MISS_PATTERN_PRESENT` | two-strike expansion preference、previous response context、weighted selector；latest response 也參與 repeat eligibility／reason codes，並非相同累積 expansion predicate | Foundation：CURRENT_PA multi-pitch accumulated response；Production：current count／latest feedback | STRONG purpose alignment；PARTIAL trigger alignment | 正確 live boundary 可作 shadow candidate；Production 保留 count／context authority |
| `repeatSuccess` | 提議延續有正向 execution／response evidence 的戰術；Production 嘗試重用 latest successful tactical call | `REPEATED_TARGET_HITS` 加 `CHASE_PATTERN_PRESENT` 或 `SWING_MISS_PATTERN_PRESENT` | previous recommendedPitchClass exists，加 previous chased／whiffed，加 failed-repeat guard；final weighted selection | Foundation：CURRENT_PA consecutive execution／response patterns；Production：latest canonical feedback，可能由合法 match-local history 延續 | **SEMANTIC_ALIGNMENT_PARTIAL**：STRONG purpose、PARTIAL trigger、VALID_WITH_GATE | Decision proposal 加 canonical production repeat eligibility 才有 shadow candidate；gate 不證明相同 repeat pattern；不直接用 execution pattern 做 bias |
| `changeLook` | 提議改變近期 look；Production 在可執行 classes 中嘗試偏離 previous class | `LOCATION_MISS_PUNISHED` | base changeLook weight、repeated recommendation class、previous hard contact、failed repeat、weighted selector | Foundation：current-PA hard contact on measured miss；terminal fair BIP 後為 POST_PA_EVIDENCE。Production：latest／bounded history context | **SEMANTIC_ALIGNMENT_PARTIAL**，另有 **TEMPORAL_GAP** | `NOT_READY_FOR_ARBITRATION`；terminal signal 不可提供給下一 PA。Metadata-compatible adapter output 不是 live-boundary 證明 |

Pattern presence 依既有 owner：兩次 consecutive take／called strike／chase／swing miss／target hit 建立 Present；三次 take 增加 Strong，並保留 Present。`LOCATION_MISS_PUNISHED` 是 PA-wide hard-contact-on-miss count，不是 consecutive streak。Presence 不帶 tactical score 或 confidence。

Count／cognitive／command adjustments 現在是 soft preferences，不是 tactical impossibility。Three-ball expand 仍有正權重；`eligibility.changeLook` 是提升 preference 的 cue，不是 exclusion gate。不得將同名欄位全部解讀為硬限制。

## 3. Formal semantic taxonomy

| Classification | 定義 | 例子 |
|---|---|---|
| `CURRENT_PA_NEXT_PITCH_SIGNAL` | completed pitch prefix 已支持 pattern，identity／count 一致，且 PA 仍允許下一球 | live takePattern、calledStrikePattern、chasePattern、swingMissPattern |
| `POST_PA_EVIDENCE` | 在 terminal pitch 完成後才可用，或重建時 PA 已 completed／awaitingDefense；沒有同 PA 下一球 | terminal fair BIP 的 locationMissPunished；terminal called strike 後重建的 take pattern |
| `PRODUCTION_CONTEXT_SIGNAL` | 由現有 Production context owner 提供，不屬於 Foundation current-PA pattern | two-strike count pressure、3-ball preference、cognitive load、command concern、match-local six-call memory |

`UNAVAILABLE` 表示 identity／completed-count 不符或 projection 無效，不是新 production intent。上表與 test-only oracle 未新增 runtime enum、save authority 或 signal-injection path。

## 4. Next-pitch availability and terminal exclusion

Formal rule：

```text
Signal available for N+1
iff same paIdentity
and completedPitchCount = N
and PA remains live
```

前提為受信任 completed detailed-pitch prefix 與支援的 projection。N 是 nonnegative integer，必須同時等於 PA state.pitchNumber、pitchHistory.length、Sequence／Interpretation／Decision pitchCount；實際 next-pitch context.pitchIndex = N+1。Future consumer 還必須在 selector 使用前取得 signal。

「PA remains live」不能只看球數：`completed`、`awaitingDefense`、terminal `result` 都必須關閉 availability；四壞／三好球也沒有下一球。Defensive handoff 即使尚未完成 settlement、completed=false，也沒有同 PA N+1。

**NO TERMINAL-PA SIGNAL LEAKAGE**：PA A terminal evidence 只能保留為 PA A 的 POST_PA_EVIDENCE。PA B 必須重建 fresh Sequence／Interpretation；不得重標 identity、延長 current-PA evidence、複製 contact counters 或直接產生 PA B changeLook。

Observation／Sequence／Interpretation／Decision 可以合法重建 terminal event。它們沒有 PA lifecycle input，因此 supported 或 selectedIntent=changeLook **不等於** next-pitch availability。現有 Adapter 也只驗證 supplied metadata／repeat eligibility，沒有 liveness input；捏造同 PA N+1 metadata 可能被 admission 接受。新 boundary test 明確記錄此限制，沒有把 test-only liveness oracle 宣稱成既有 runtime guard。

現有正常 gameplay route 不提供 terminal PA 的下一球 consumer。Completed OPA 不會 prepare／resolve 下一球；awaitingDefense 的 resolve 也回傳無 event。PA B 的 Adapter identity mismatch 和 Sequence append mismatch 拒絕舊 PA projection。**任何未來 integration 都必須沿用 lifecycle owner 並明確驗證 liveness，不能只呼叫 Adapter。** 本輪不需要 production export extraction。

Terminal evidence 可供未來 cross-PA scouting、catcher memory、pitcher／batter history 或 evaluation 設計使用，但需要另有正式 cross-PA owner。本 Sprint 不實作 consumer；Production 現有 match-local tactical history 可以繼續合法存在，與 Foundation signal leakage 是兩件事。

## 5. Repeat execution and repeated tactical call

```text
Foundation repeatSuccess = repeated execution / response pattern proposal
Production repeatSuccess = repeat latest successful tactical call
repeated execution success != repeated tactical call success
```

`REPEATED_TARGET_HITS` 回答每球是否命中該球自己的 target。它 **不代表 same previous class，也不代表 same previous target**；Sequence 不保留這些 recommendation 欄位。兩球 target execution 命中與 chase／whiff streak 可以同時存在，而這兩球的 class／target 不同。

Tests 的 `IDENTICAL_CALL_EVIDENCE` 要求前兩筆均有 recommended class 和 target，且兩者相同；否則為 `NOT_IDENTICAL_CALL_EVIDENCE`。這是 semantic diagnostic，不是新 production eligibility predicate。現有 Production 的 repeated-call changeLook cue 比較連續 recommended class，並未要求 target 相同。

Canonical eligibility 唯一來源：`getRepeatSuccessEligibility(context)`。在正常 boolean feedback contract 下：

```text
repeatFailed = previous.intent == repeatSuccess AND previous.hardContactObservable
repeatEligible = NOT repeatFailed
                 AND previous.recommendedPitchClass exists
                 AND (previous.chased OR previous.whiffed)
```

它只檢查 latest call／response，不檢查兩次 target hit、兩次相同 class／target，也不證明硬接觸以外的廣泛「失敗」。稱 successful call 是既有 chased／whiffed 的局部 operational meaning，不是安打／得分／PA 勝負評價。

兩個 predicates 可獨立變化：Production eligible 而 Foundation neutral；或 Foundation repeat proposal 而 Production ineligible。Adapter 的 conjunction 是 **semantic compatibility gate**，不是兩個 owner 看見相同 repeat pattern 的證明。

Failed-repeat fixture 中 Foundation proposal 維持 repeatSuccess，canonical helper 仍拒絕；Adapter abstains、不提升 runner-up，正常 weighted selector 的 repeat weight 為零。既有 explicit `intentOverride` API 可略過 weighted path；測試沒有使用它，未來 integration 也不能用它繞過 guard。本契約只主張 Foundation／Adapter 正常路徑不繞過 canonical gate。

Production repeat recommendation 嘗試重用 previous class／target，仍受 existing distribution／abstract-target compatibility 約束；actual pitch realization 仍屬既有 physical／control owners。

## 6. ChangeLook temporal boundary

Observation 只在 fair `ballInPlay`、contact=true、有效 physical truth 的 continuousContactScore >= 0.72 時建立 HARD_CONTACT；另須 measured targetError > 0 才建立 HARD_CONTACT_ON_LOCATION_MISS。Foul 不推論 hard contact。

Normal detailed OPA 的 fair BIP 產生 PA result 或 defensive handoff。若 miss 被懲罰的 evidence 此時才成立，它是 **POST_PA_EVIDENCE**，即使 Interpretation／Decision 可重建也沒有同 PA N+1。未來歷史記憶必須另定 owner／temporal contract；不能弱化 Adapter identity check。

Purpose 可以部分相容，但 Foundation trigger 比 Production 的 base exploration／repetition／latest hard contact／failed repeat 狹窄。Verdict：**SEMANTIC_CONSOLIDATION_REQUIRED，NOT_READY_FOR_ARBITRATION**。本輪未建立自然 locationMissPunished witness；terminal-specific proof 使用明確 unit fixture，不冒充 natural evidence。

## 7. Validation and witnesses

執行：

```powershell
node tests/pitch-tactical-intent-semantic-boundary-test.js
node tests/pitch-tactical-intent-evidence-integration-test.js
```

Boundary suite：**16 passed / 0 failed**。Fixture 使用既有公開 OPA／physical／Foundation／Adapter API；沒有 production source 修改。涵蓋 live N→N+1、stale count／PA identity、owner-resolved terminal hard contact on measured miss、completed／defensive handoff availability、PA B fresh reset、repeat predicates 的兩個反例、different class／target、failed guard、runner-up 不提升、single final owner、future-field getter traps、determinism／zero mutation／zero RNG。

Evidence integration suite：**10 passed / 0 failed**。三條固定正常 UI route，每條最多兩場 match，再各跑一組 ON/OFF；不搜尋到所需結果才停止，也不注入 intent／pitch truth／能力。Admission 使用既有 normal-UI harness；follow-up 由 continue／event choices 到達。

| Seed | Legal policy | Reached match identities |
|---|---|---|
| 440000 | take | hs-y1-autumn-exhibition；hs-y1-followup-evaluation-2 |
| 440001 | contactSwing | hs-y1-autumn-exhibition；hs-y1-followup-evaluation-2 |
| 440003 | powerSwing | hs-y1-autumn-exhibition；hs-y1-followup-evaluation-2 |

ON 6 場、OFF 6 場；**51 boundaries、41 distinct tactical identities、12 distinct pitcher context states**。所有 completed detailed player pitches 均有 pre-pitch capture。相同 tactical identity 可能跨 seeds／policies 重複，因此這是 bounded witness coverage，不是獨立機率樣本或 gameplay quality 評分。

| Interpretation | Live boundary count |
|---|---:|
| TAKE_PATTERN_PRESENT | 13 |
| TAKE_PATTERN_STRONG | 7 |
| CALLED_STRIKE_PATTERN_PRESENT | 5 |
| CHASE_PATTERN_PRESENT | 1 |
| SWING_MISS_PATTERN_PRESENT | 7 |
| REPEATED_TARGET_HITS | 6 |
| LOCATION_MISS_PUNISHED | 0 |

Count 允許同一 boundary 多個 interpretations。四個自然 Foundation repeat proposals 中，一個為 NOT_IDENTICAL_CALL_EVIDENCE，且 canonical gate admit；另有三個相同 call witnesses。Live chase witness（440001 contactSwing）在 follow-up evaluation、PA hs_y1_match_moment_3、inning 6 下，completed N=2／next=3；whiff＋repeat 的不同 call witness 在 first exhibition、PA hs_y1_match_offense_2、inning 3 下，N=2／next=3。

自然 terminal BIP 有 **3** 筆，從 genuine completed history 重建 POST_PA_EVIDENCE，確認沒有同 PA 下一球 capture；沒有自然 hard-contact-on-location-miss。重建時 paResult 僅作 lifecycle closure marker，不用其 outcome 判斷 signal correctness。

First-match pitcher control=14；follow-up=12，皆來自正常 UI。Cognitive load 32–40；command values 為空、heldTarget、adjacentDrift。以下明列 **COVERAGE_GAP**，不使用 unit fixtures 補成自然 evidence：

- NATURAL_TERMINAL_LOCATION_MISS_PUNISHED／natural changeLook。
- HIGH_COGNITIVE_LOAD >=68。
- MAJOR_DRIFT。
- FAILED_REPEAT。
- Second-year／其他 normal match routes 尚未覆蓋；本次止於 first-year follow-up。

Outcome-blind proof：Foundation／availability projection 對 pending N+1 truth、nextPitchResult、paOutcome、runsScored 的 getter traps 全未觸發。PA result 只用於 terminal availability。Next-pitch outcome、PA 勝負、得分不參與 tactical correctness classification。

Host／browser shadow projection 的 RNG draws=0、input/source mutations=0；snapshot／cursor assertions 實際執行。ON/OFF deep equality 涵蓋整個 final player、兩場 whole matches、tactical state、GameRecord 和 RNG cursor，包含 normal UI progression。Runtime owner／loading／save sources 與本 Sprint baseline 逐檔內容相等；沒有 shadow schema 持久化。

## 8. Required regressions

| Suite | Passed | Failed |
|---|---:|---:|
| New semantic boundary | 16 | 0 |
| New evidence integration | 10 | 0 |
| Adapter unit / production | 22 / 11 | 0 |
| Decision unit / production | 33 / 12 | 0 |
| Interpretation unit / production | 24 / 10 | 0 |
| Sequence unit / production | 25 / 8 | 0 |
| Observation unit / production | 22 / 7 | 0 |
| Existing Tactical Integration | 34 | 0 |
| Selector equivalence | 5 | 0 |
| **Total: 14 suites** | **239** | **0** |

Selector equivalence 保留既有 extraction baseline 9b9546f；23,040 contexts／161,280 comparisons，weights、eligibility、selection、hash cursor 相等。新 integration 另對本 Sprint 2a4b44a baseline 比對 runtime source。未執行 protected fast-check test；runtime 未修改，沒有擴大到全文 regression。

## 9. Alignment verdict and future readiness

| Intent | Purpose alignment | Trigger alignment | Temporal alignment | Final verdict |
|---|---|---|---|---|
| challenge | STRONG | PARTIAL：new accumulated PA pattern | VALID：live same-PA N→N+1 | VALID_SIGNAL_PURPOSE；沒有 selection authority |
| expand | STRONG | PARTIAL：multi-pitch response vs count／latest context | VALID：live same-PA N→N+1 | VALID_SIGNAL_PURPOSE；保留 Production context |
| repeatSuccess | STRONG | PARTIAL：execution streak vs latest successful call | VALID_WITH_GATE：live same-PA＋canonical eligibility | SEMANTIC_ALIGNMENT_PARTIAL；execution pattern 尚未 ready for bias |
| changeLook | PARTIAL | PARTIAL：punished miss vs exploration／memory／failure | TEMPORAL_GAP：terminal fair BIP 通常無 N+1 | NOT_READY_FOR_ARBITRATION |

未來適合研究進入 existing production selector context 的 typed signals：`takePattern`、`calledStrikePattern`、`chasePattern`、`swingMissPattern`，但須攜帶同 PA identity、completed N、來源 lineage 與 live availability；它們是 structured facts，不是 weight、intent override 或 final selector。

**NOT READY**：`repeatExecutionPattern`（execution／call evidence 與 gate 必須保持分離）；`locationMissPunished`（terminal／cross-PA owner 問題與自然 coverage gap）。Count、command、memory 保持 Production context ownership。本輪不決定任何數值或 signal mapping 的 runtime API。

Rename recommendation：**NO_RENAME_RECOMMENDED_IN_V0_1**。Purpose／trigger／scope 的正式標記已能表達 partial alignment；沒有證據要求立即改名。未施工 rename。

## 10. Scope integrity and acceptance

只新增此文件與兩個測試。Production weights、chooser、recommendation、pitcher response、sequencing、physical／repertoire、save、index loading 全未修改。沒有 stage、commit、push。

Protected fast-check 維持 modified／unstaged；install.ps1 維持 untracked。兩者未讀取、修改、執行、stage 或 commit；兩個既存 stash 保持 hash／順序：

```text
0daf1e954f74ddb45efe620107970567dec6fffd
8cc34a930df052067d1bad3ea798fe0b9d2ae036
```

Acceptance report：**PASS_WITH_WARNINGS**。所有 contract／guard／regression／equivalence gates 通過；warnings 僅為上述自然 coverage gaps，以及 Adapter metadata admission 不能單獨認證 lifecycle 的已明列責任邊界。這不是批准 signal injection 或 arbitration gameplay sprint。

Source verification：依 codebase-memory Tier 2 symbol search／caller-callee trace／snippets／exact-path coverage；metadata_changed 的 relevant current source 另直接讀取。結論限於 inspected detailed-player first-year route，沒有 repository-wide completeness 主張。

可核對的 owner anchors：Observation.observePitch；Sequence.appendPitchObservation／build；Interpretation.interpret；Decision.decide；Adapter.adapt；Tactical.getRepeatSuccessEligibility／chooseTacticalIntent／buildCatcherRecommendation；OPA.createPlateAppearanceState／resolveNextPitch；既有 normal-UI admission harness。New test-only availability／call-evidence helpers 不載入 index，也不被 runtime import。
