# Critical Regression Triage v0.1 — Root Cause & Minimal Repair Boundary

專案：Baseball Life Simulation（棒球人生）  
日期：2026-10-15（Asia/Taipei）  
正式 Git 基線：`ab3117653945de0b7013636187c446276a96e634`  
任務：Read-only Investigation / Targeted Diagnostic

**三套正式測試均重現原 FAIL；沒有修復或改列 PASS。Opportunity-two 確認為 VM manifest 缺漏；Match #36 確認為 full-match fixture／環境契約缺陷；Gradient 為固定且相關 cohort 的 STATISTICAL ASSUMPTION RISK。Production delta＝0、正式 test delta＝0。Ready for Commit／Sprint10B＝NO。**

## 1. Baseline 與 WIP Integrity

開工核對 branch=`main`、HEAD／main／origin/main tracking ref 均為指定基線，Git index 空。未 fetch，沒有重新核對遠端 server。核對下列三份前置報告與 delivery：

- [Test Reliability Audit](test-reliability-audit-v0.1.md)：delivery 20 個 entries 的 SHA-256 一致。
- [Entry-Safe Runner](test-infrastructure-sprint-0.1-entry-safe-runner.md)：delivery 292 個 entries 一致。
- [Source Freeze Phase B](source-freeze-contract-reconciliation-v0.1-phase-b.md)：delivery 44 個 entries 一致；另核對五個正式 test 的 after hashes 與七行 exact reverse。

Phase B 開工的 1269 個舊檔案以其 authorized after hashes 核對；Phase B 新交付亦核對後，保存本輪 **1314 個既有可讀檔案 SHA-256**。結案全部相同，Production、正式 tests、fixtures、seeds、pins、舊 captures 皆未改。12 個 protected paths 只核對 Git status、size／mtime；沒有讀、hash、執行或寫入內容。Metadata 一致不是 protected content hash 證明。[Baseline](critical-regression-triage-v0.1-baseline-evidence.json)、[Closeout](critical-regression-triage-v0.1-closeout-evidence.json)、[Delivery](critical-regression-triage-v0.1-delivery-evidence.json)

前置 57/57、Save／Index negative 21＋72＝93/93、Save／Guard 89/89、Legacy 25 pairs＋3 Historical 是核對過的既有證據，**本輪沒有重跑這些 gates**。Receiver v2 仍 DISABLED；L03 仍 PARTIAL。

新 bookkeeping 首次 preflight 比對了 Phase B 修改前的 status，漏排除五個已通過 hash／reverse 的授權 test changes。這是新 utility 的比對錯誤，當時 suite invocations＝0；修正後全部既有 hashes／status 通過。初次互動 stderr 曾截短，完整 stderr＝UNVERIFIED，不作測試證據；原因記於 baseline evidence。

## 2. 執行政策與正式重現

所有 11 次 child invocations 均由**未改的 Entry-Safe runner／preload** 執行 standalone：

```text
<actual node executable> --require <absolute tests/entry-safe-preload.cjs> <absolute target>
```

每份 raw capture 保存 actual command、cwd、Git refs、Node version、ENTRY_SAFE_CONFIG、source hashes 前後、timeout、buffer、stdout／stderr、exit、elapsed、assertion witness。一般政策沿用 **120000ms／16000000 bytes**；implicit Git show 相容保持原 30000000 bytes。沒有舊 require wrapper、未提高 limits。實际程式入口 main 由 witness 驗證；assertion 呼叫數與 suite check 數分開記錄。

| 正式原測試 | 本輪結果 | 到達位置 | Elapsed | Raw evidence |
|---|---|---|---:|---|
| Opportunity-two | FAIL，exit 1 | 37 項通過；第 38 項求值時 ReferenceError | 401.08ms | [raw](test-infrastructure-sprint-0.1-critical-triage-opportunity-original-evidence.json) |
| Match Foundation 2.2.2 | FAIL，exit 1 | 35 項通過；第 36 項 false | 1988.44ms | [raw](test-infrastructure-sprint-0.1-critical-triage-match-original-evidence.json) |
| Ability Gradient | FAIL，exit 1 | low multi-hit assertion；high assertion 未到達 | 14122.98ms | [raw](test-infrastructure-sprint-0.1-critical-triage-gradient-original-evidence.json) |

三套原 source、seeds、fixtures、決策與 assertions 完全保留。可重現入口為上表三個 original paths，使用 Entry-Safe `runSuite({file, entryMode:"standalone", evidencePath:<新的獨立檔名>})`；完整所需環境與 command 見各 raw capture。既有 evidence target 會拒絕重用；不能覆寫本輪 captures。

隔離 copies 只位於 docs。前三個完整副本與後續 A／C 副本均保存明列 transformations，逐項撤回後全文精確回到原 source。B 的 formal-manifest 比較只執行**原第 36 項**，保留原 setup／finish function、seed、決策、1400 上限及原完整 boolean。[Isolation contract](critical-regression-triage-v0.1-isolation-contract-evidence.json)、[follow-up contract](critical-regression-triage-v0.1-followup-isolation-contract-evidence.json)

## 3. Diagnostic A — Opportunity-two Runtime Dependency

**Classification：CONFIRMED TEST INFRASTRUCTURE。**

原 `runtimeFiles` 明列 59 個 modules，漏了正式 SS execution 的三個必要 owners：

1. `defensive-opportunity-foundation.js`
2. `defensive-reach-secure-foundation.js`
3. `defensive-decision-throw-foundation.js`

已載入 TeamRoster、BattedBallPhysical、ForceAdvancement、GroundDefense、RunnerThrowSettlement；它們不代替上述 owners。正式 index 在 Physical／OutcomeMapping 後載入 Opportunity、ReachSecure，再於 ForceAdvancement 後載入 DecisionThrow，之後載入下游 settlement／ground modules，最後才載入 script。

實際失敗 chain：

```text
原 check 38 的 advanceHighSchoolMatchSimulation
→ advanceHighSchoolMatchPlaybackStep
→ prepareHighSchoolDefensiveMomentFromSimulation
→ resolveRoutineDefensivePlay
→ resolveInfieldDecision（supported SS branch）
→ buildHighSchoolShortstopExecution
→ resolveHighSchoolCanonicalSecure
→ getHighSchoolControlledDecisionInput
→ DefensiveDecisionThrowFoundation.buildDecisionOpportunity
→ selectDefensiveRoute → resolveThrow
→ DefensiveRunnerThrowSettlementFoundation.resolveTiming／deriveSettlement
→ ForceAdvancement.settleForceAdvancement
```

Throw owner 的直接 module dependencies 為 Physical、Roster、Force、ReachSecure；ReachSecure 又需要正式 Opportunity。Current script 11945 的直接 owner 呼叫不容許把必要全域改為 optional。

| 隔離診斷 | 結果與原因 | Evidence |
|---|---|---|
| 只補 DecisionThrow | FAIL：input 為 null，`reading 'activeRoster'` | [raw](test-infrastructure-sprint-0.1-critical-triage-opportunity-isolated-evidence.json) |
| 補完整三個正式 owners，按 index 的依賴次序 | 完整 40/40 PASS；沒有後續已觀測失敗 | [raw](test-infrastructure-sprint-0.1-critical-triage-opportunity-dependencies-isolated-evidence.json) |

只補一個 module 並不足夠：缺 ReachSecure 時 `resolveHighSchoolCanonicalSecure` 回 null；缺 secure result 時 ControlledDecisionInput 回 null。第二份副本的第 38 項實際觀測：completed=true、id=`hs-y1-followup-evaluation-2`、eventId=`high_school_followup_evaluation`、samples=2、log=136、moments=2；原第 39／40 項亦成功。

沒有 fake module、mock owner、optional guard 或 Production 修改。隔離 40/40 只證明此三-module manifest 候選可讓該套完成；**原正式測試仍 FAIL**。SS 6-3 的 secure／route／throw／receiver／timing／force 責任保持原 owners；本轮沒有獨立重跑 SS 6-3 suite，也不能把 40/40 視為所有 SS 6-3 情境的驗收。

## 4. Diagnostic B — Baseball Match Foundation #36

**Classification：CONFIRMED CONTRACT DEFECT。** 確認的是本測試 full-match fixture 與環境的責任假設；另有確認的 manifest／UMD 環境問題。沒有確認有效 Production 路徑 regression。

原完整條件：

```js
verify("36. full match 完成兩個既定進攻 Moment；防守 Moment 只在真實 Decision 時成立",
  evaluate(`(() => {
    const x=__finish2222();
    const ids=x.match.completedMoments.map(moment=>moment.id);
    return x.match.completed
      && ids.includes(highSchoolYearOneMomentIds[0])
      && ids.includes(highSchoolYearOneMomentIds[2])
      && x.match.completedMoments.filter(moment=>moment.domain==="defense").length
         === x.match.matchDecisionDensityState.defensiveMeaningfulDecisionCount
      && x.safety<1400;
  })()`));
```

副本在**同一次原 __finish2222 呼叫**內觀測全部 operands，再執行上述原判斷；沒有因短路而遺漏後續 operands。[Full observation](test-infrastructure-sprint-0.1-critical-triage-match-isolated-evidence.json)、[machine operands](critical-regression-triage-v0.1-match-operands-evidence.json)

| Operand | 原 manifest 實際值 | Boolean |
|---|---|---|
| match.completed | false | false |
| 包含 moment_1 | true；`hs_y1_match_moment_1` | true |
| 包含 moment_3 | false | false |
| defense completed count＝meaningful count | 4＝4 | true |
| safety < 1400 | 1401 | false |

Seed＝88221；decision 選 secure／zone 或 first legal，原 randomSource＝0.72。Safety 原寫法 `safety++<1400` 在最後 false check 仍自增，所以退出值為 1401；這不是额外多跑一次 iteration。

### 4.1 原環境的確定失敗機制

原 manifest 僅 33 modules，沒有正式 roster／physical／reach／decision／lifecycle owners。Ground handoff 為 null，走 legacy synthetic infield resolver。原 setup 强制 `developmentPositionOverride="游擊手"`，`deriveHighSchoolDefensiveBallContext` 因此**每次**回 deepGrounder；不是自然 PA physical stream 的多樣落點。

實際 defensive capabilities＝fielding4／reaction3／range3／arm4／throwing4／decision2；firstStepDemand＝9，windows＝fielding **-0.7**、transfer2.3、throw0.32。原 resolver 使用：

```text
swing = (sample - 0.5) * 4
fieldControlled = windows.fielding + swing >= 2.8
```

即使合法 sample 趨近 1，-0.7＋swing < 1.3，仍不可能達 2.8。Secure／throw 的前提永遠不成立；改 seed、延長迴圈或增加同條件 samples 都不能補回出局。

實際 1371 個 routine events 全為 deepGrounder、outsCreated 全為 0（1269 errors＋102 zeroOuts）；另四個 meaningful defense resolutions 也全為 0 outs。Density 正確保留 count4，並抑制 1370 次重複 opportunity；抑制 decision presentation 不會創造 physical out。比賽停在二局上、0 outs、home2／away1372。Game-state integrityIssues=[]，但它不證明這份 fixture 能完成比賽。

因此先是 fixture 在 legacy 迴圈中無法產生出局，後續無法到 final offense／settlement。**Moment_3 不見是這條失敗鏈的後果；沒有證據可直接認定固定 Moment IDs 已過期，也沒有理由改 density count assertion。**

### 4.2 正式模組比對與 fixture 另一個問題

只換成 current index 的 92 個 scripts（排除 application-controller，與既有 career VM 一致），保留原 VM 的 `module.exports`，會在 UMD module 選 CommonJS 分支時得到 `require is not defined`。這個診斷 FAIL 的原因是 VM 宣告了 CommonJS module 卻沒有 require。[raw](test-infrastructure-sprint-0.1-critical-triage-match-index-manifest-isolated-evidence.json)

後續獨立副本取消 VM 的假 CommonJS 宣告，按 browser globals 載入相同 index，原 #36 仍 FAIL，但 actual operands 改為：

| Operand | index／browser-globals 副本 |
|---|---|
| completed | true |
| moment_1／moment_3 present | false／false |
| defense count equality | 0＝0 |
| safety < 1400 | 101 < 1400，true |

終局為七局、home2／away5、integrityIssues=[]、73 個 PA、1 個 gameEnd。原 helper 只設 `playerEntryCompleted=true`／`playerLineupStatus="starter"`；**正式 roster 的 lineup 沒有 player，player 實際在 bench**（primaryPosition2B）。原 legacy roster 則有 player。First offense routing 必須 current lineup batter.id==="player"，所以新 manifest 下這份 fixture 根本不滿足兩個玩家打席的前提。[raw](test-infrastructure-sprint-0.1-critical-triage-match-browser-manifest-isolated-evidence.json)、[manifest contract](critical-regression-triage-v0.1-match-manifest-contract-evidence.json)、[browser contract](critical-regression-triage-v0.1-match-browser-contract-evidence.json)

這證明**只补 modules 也不夠**。需要另行審查 full-match fixture 的 canonical entry／assignment；本輪沒有更動 fixture、player 能力、seed 或 assertions，也沒有把 101 ticks／completed=true 單獨列為 PASS。原 #37／38 未執行，結果仍未驗證。

## 5. Diagnostic C — Ability Performance Gradient

**Classification：STATISTICAL ASSUMPTION RISK。** 固定 cohort 的尾端事件期望、共享 PA identity draws 與 first-legal 決策政策均已確認；尚無有效規則支持判定 Production 機率 regression。

原契約：

```js
for(let seed=1;seed<=20;seed++) {
  low.push(h.play('baseballSkills.batting',8,seed));
  high.push(h.play('baseballSkills.batting',16,seed));
}
assert(audit.summarize(low).multiHitFraction>0, 'Low tier can have a multi-hit game');
assert(audit.summarize(high).hitlessFraction>0, 'High tier can have a hitless game');
```

### 5.1 原 cohort／設定

原 audit 宣告 tiers=[8,10,12,14,16]；本測試尾端事件只跑 batting8／16，各 seeds1–20、各20 games。Base 由 careerFixture(游擊手,starter,77001)＋critical_offseason 選項1建立；match.id 固定為 `hs-y3-final-competition-1`，是高三 match，不是20個新 scenario IDs。

Base age18、ballSense3、observe4、fitness1、instinct0、discipline0、pressure0；所有 baseballSkills 原為12。每份 tier fixture 只改 batting，沒有把其餘能力同步調高。Derived offense：

| Tier | Contact | Power | Speed | Discipline | Derived defense |
|---|---:|---:|---:|---:|---|
| batting8 | 6 | 3 | 8 | 5 | fielding10／reaction9／range8／arm8／throwing9／decision5 |
| batting16 | 10 | 6 | 8 | 5 | 相同 |

Batting 同時影响 derived contact／power；它不是兩個整體均衡的 low／high tier players。原 policy＝所有 decision 都取 first legal，playback 未完成上限2500，sample 取正式 finalized gameRecord.playerLines.player，完整 canonical record integrity／score parity 保留。[Distribution](critical-regression-triage-v0.1-gradient-distribution-evidence.json)

| 原20-game結果 | Low | High |
|---|---:|---:|
| H=0 games | 15 | 10 |
| H=1 games | 5 | 8 |
| H=2 games | 0 | 2 |
| PA／AB／H | 81／74／5 | 80／79／12 |
| multiHitFraction | 0 | 0.10 |
| hitlessFraction | 0.75 | 0.50 |
| AVG | 0.0675676 | 0.1518987 |
| SO／BB | 48／7 | 47／1 |

Low 有1安打的 seeds＝2、11、14、16、19；high multi-hit seeds＝11、16。逐seed PA／AB／H、aggregate、全record／event log hashes 均保存。High hitless boolean 可由同批已完成資料觀測為 true；**原正式 assertion 沒有到達 high，因此不將它宣稱為正式 assertion PASS**。

### 5.2 RNG／routing／decision 依賴

1. Audit execution RNG 使用原 LCG：state=seed>>>0；state=(imul(state,1664525)+1013904223)>>>0。每次 decision 呼叫沿用此 source，沒有 override。
2. Ordinary simulation 的 `nextHighSchoolMatchSimulationRandom` 由 simulationSeed／simulationCursor 產生；compressed AI outcome 的 SO subclass另以完整 PA identity hash 決定。
3. Detailed player PA identity 由 matchId／momentId／batterId／inning／half 建立；**沒有 simulationSeed**。OffensivePlateApproach 的 pure hash draws 由 namespace `player-meaningful-pa-pitch-v1`＋identity＋label 建立。PitchSequencing／physical owners亦有自身 identity-based draws。
4. Canonical scenario IDs 同時是 routing keys。原 `seedFixture` 刻意只改 simulationSeed、不改 match.id；改 scenario IDs 來增加 RNG variety 會改變測試責任，不能視為單純更換隨機樣本。

全部40 games 的第一個 player PA 共用 identity：
`hs-y3-final-competition-1|hs_y1_match_moment_1|player|1|下`。
最後的 fixed moment_3 identity 只在5／6局間變化；其餘 emergent IDs 亦有限。例：low seed1／20 同 identity 的 pitch-class|1 pure draw 都為0.9789319403935224。Evidence 中額外 label 值是**純函式重算值，不代表每個 label 實際被消耗**。

更具體的 policy 觀測：40 games 的最後 detailed PA 全為 strikeout，155 個實際 pitch actions 全為 **take**（120 calledStrike、35 ball）；即使 approach label 是 aggressiveEarlySwing，原 first-legal policy 仍每球選 take。能力提升不能讓一個從未出棒的打席產生 hit。[Policy](critical-regression-triage-v0.1-gradient-policy-evidence.json)、[RNG raw](test-infrastructure-sprint-0.1-critical-triage-gradient-rng-isolated-evidence.json)、[source proof](critical-regression-triage-v0.1-rng-source-evidence.json)

因此20 seeds沒有提供20份彼此獨立的 detailed PA 隨機情境；原 assertion 將「事件有可能發生」當成「這份固定、相關、first-legal cohort 必須至少觀測一次」。目前分布既有 low hits，high AVG也較高，但這些有限結果不能證明完整模型校準正確，亦不能證明low multi-hit不可能。

### 5.3 可重現性與觀測中立

完整 compact 副本維持原 low assertion FAIL。RNG observer 再執行**同40個 fixture／seed samples**，沒有新 seeds 或增加統計樣本；40/40 全record與event-log hashes逐一相同，low／high完整summary一致。原相同seed重播與instrumentation-neutrality assertions也仍通過。[Verification](critical-regression-triage-v0.1-verification-evidence.json)

首次直接輸出40份巨大record／log超出原16MB output政策，被終止；該 capture 保留 **UNVERIFIED／ENOBUFS／stdout不完整／witness缺失**，不是完整測試結果。[retained incomplete raw](test-infrastructure-sprint-0.1-critical-triage-gradient-isolated-evidence.json) 隨後減少觀測payload，保留相同40 games、原limits、逐game record/log hashes與必要分布；完整compact logs／witness正常取得。[compact raw](test-infrastructure-sprint-0.1-critical-triage-gradient-compact-isolated-evidence.json)

**需要獨立統計契約審查。** 不能直接换 seeds、加樣本直到PASS、調tier、調機率、刪尾端assertion或改成僅要求AVG較高。

## 6. Production／Contract／Infrastructure 分界與最小提案

以下全部是未實施候選；**每項都需要獨立人工授權**。不能合併成共同 Production 修改。

| 問題 | 最小檔案範圍 | 必須保留 | 必要負向驗證 | Targeted Regression／完成條件 |
|---|---|---|---|---|
| A | `tests/high-school-year-one-opportunity-two-integration-test.js` 的 runtimeFiles；新增獨立 manifest validation evidence | 原40 checks、fixtures、seeds、reassessment門檻、exactly-once、reload；正式owners | 隔離省略任一必要owner須被manifest preflight拒絕或實際失敗；不得fallback fake／optional；錯載order須拒絕 | 原suite standalone 40/40；再按批准範圍驗 SS defensive／6-3、ground lifecycle、settlement。最小差異只三個module names及位置；Production 0 |
| B | 同一原test內**只針對__finish2222使用的full-match context／setup**，或新增小型專用context helper；原synthetic #1–35 context保留 | 原seed88221／88222、secure／zone政策、0.72、原能力、Moment_1／3 IDs、count equality、safety<1400與state invariant | 旗標starter但player仍bench的fixture須拒絕；缺owner／假CommonJS環境須拒絕；routine不得創造meaningful count或fake out；duplicate settlement不得重複推進 | 先取得合法canonical entry／assignment fixture契約批准，再讓原38項全部真正到達且PASS；#36逐operand、#37seed88222及#38證據完整。若仍FAIL，另立診斷，不能弱化assertions |
| C | `tests/ability-performance-gradient-test.js` 及必要時 `tests/ability-performance-correlation-audit.cjs` 的**統計契約／policy明示**；先交付契約proposal | 保留原20-seed失敗與tail-event需求；canonical record、target-only、immutability、seed replay、record/log neutrality、scenario IDs、能力與Production機率 | 拒絕非canonical samples、重複game冒充獨立、decisionCount當PA、共享identity當IID、挑seed／追加樣本直到PASS；first-legal take-only policy須明示 | 預先批准measurement objective、policy、RNG diversity邊界、樣本與failure判準；分開驗確定性接線／重播及統計tail支持。原歷史FAIL不覆寫；若需換policy／cohort須新契約授權 |

A 的可能 Production paths＝SS secure／controlled decision／throw／receiver／runner timing／force settlement；實際候選只修 manifest。B＝roster entry／assignment→playback→moment routing→defensive density→settlement，**沒有已授權的Production修改點**。C＝capability adapters→ordinary compressed PA／detailed PlateApproach→PitchSequencing／physical outcome→canonical GameRecord；目前沒有證據支持改這些Production owners。

B 的可審查邊界已確認，但**具體canonical fixture patch 尚未驗收**；只換manifest的候選已被本輪否定為不足。保留固定Moment IDs是否適用於完成後的合法fixture，仍須下一階段證據；本輪不先批准ID修訂。C的統計契約方案亦需review，不能立即做「最小green patch」。

## 7. 建議順序與 Repair Gate

1. **A：先審查三-module manifest 修復。** 已有完整隔離40/40、責任小且沒有Production delta。
2. **B：審查 full-match fixture／owner環境契約。** 先證明player真正在canonical lineup／正確守備assignment，再執行原完整斷言；不調出局或density規則。
3. **C：獨立統計契約修訂。** 決策政策與RNG相關性先明示，再預先決定tail-event驗證方法；不能用收集到PASS的策略。

**具備進入 Critical Regression Repair 的條件：有限 YES，供人工審查；A有具體可驗收候選，B／C須先批准上述契約邊界。** 這不是整體Production修復或Sprint10B批准；Ready for Commit仍NO。

## 8. Coverage、證據限制與未解決風險

Codebase-memory Tier2使用 symbols search、雙向depth1 traces、exact snippets；1361個當時snapshot paths分11批check_index_coverage均有效返回（沒有超過128-path上限）。結果：1234 metadata_changed、41 not_tracked、68 metadata_match、18 missing。這些是graph metadata訊號，不是檔案消失或source freshness證明。唯一reported partial為舊audit lines48–56，已直接讀取；該舊文字只用作coverage fallback，不用來推斷current Production。[Raw architecture／coverage](critical-regression-triage-v0.1-architecture-coverage-evidence.json)

全部既有檔案重新hash；material current source直接讀取，保存九個snippet與current逐行比對，加上兩個RNG snippets直接核對。Dynamic VM globals／anonymous source loops的graph解析有限，以當前source與actual execution補證；不作graph absence推論。[Verification](critical-regression-triage-v0.1-verification-evidence.json)

保留限制：

- A的40/40不是SS全路徑、所有6-3球或browser loading驗收。
- B的原suite #37／38尚未到達；formal-manifest副本只跑#36，且fixture本身不具canonical玩家上場前提，不能拿它宣稱Production全match驗收。
- C的first-legal policy及identity共享已確認；有效獨立樣本數、tail-event probability及完整ability模型校準仍未確認。
- Browser network／loading lifecycle、Full251、R6Full227、First-base400-game timing與Receiver v2整合均未測；原歷史verdict維持。
- 沒有確認新的有效Production regression；若後續合法fixture揭露此類問題，必須另行停點與授權。

## 9. 執行總數與停止

本輪 **11 child invocations＝3個原正式FAIL＋8個必要隔離診斷**；結果1 PASS／9 FAIL／1 UNVERIFIED。PASS只有A的三-owner副本；原正式三FAIL皆保留。9個FAIL包括用來找後續缺漏／VM差異的診斷，不是9個新的Production regressions。除明列的buffer中斷外，其餘10次raw stdout／stderr、witness與退出證據完整。[Execution summary](critical-regression-triage-v0.1-execution-summary-evidence.json)

新檔案僅docs內獨立diagnostic copies／utilities、report、machine evidence與raw captures／witnesses；完整新增列表與SHA-256見delivery。所有正式capture在啟動前拒絕existing target，採exclusive-create；沒有覆寫任何既有capture。

本輪已停止。沒有Reset／Clean／Stash／Stage／Commit／Push，沒有開始Critical Regression Repair，沒有修改正式test／Production／fixtures／seeds／pins，沒有啟動Receiver v2、Sprint10B或其他修復。等待人工審查。

| Gate | 結果 |
|---|---|
| Baseline／WIP integrity | PASS，1314個既有hash不變；protected metadata一致 |
| 正式三套 | FAIL／FAIL／FAIL，未改列PASS |
| A root cause | CONFIRMED TEST INFRASTRUCTURE |
| B root cause | CONFIRMED CONTRACT DEFECT（fixture／環境）；Production regression未確認 |
| C root cause | STATISTICAL ASSUMPTION RISK |
| 最小Repair review readiness | 有限YES；逐項獨立人工授權 |
| Receiver v2／L03 | DISABLED／PARTIAL |
| Ready for Sprint10B／Commit | NO／NO |
