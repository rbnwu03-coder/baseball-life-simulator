# Ability–Performance Correlation Audit Sprint 1

**結論：AUDIT WARN；不建議標記 Sprint 1 正式 PASS。** 測量已完成，但純能力隔離、投球情境獨立性及玩家投手 exposure 有明確限制。沒有修改 production、調參、commit 或 push。

## Baseline 與方法

`main = origin/main = 46f8d2d`；開始時 working tree clean。正式 production scripts 在既有 in-memory browser harness 中執行；不讀寫正式 save。

- Scenario ID is a routing key. The seed series changes match RNG, but identity-derived pitch RNG is shared. PA counts are canonical exposure, not a claim of independent Bernoulli trials.
- Only one raw scalar changes per tier. Derived abilities may couple; values 8–16 are raw ability tiers, not assertions that derived Contact equals 40–80.
- Three isolated child processes run independent axes; they share no VM, player state or random state.
- 300 complete games/tier with 10 equal game blocks; PA thresholds include the last complete game rather than truncating a canonical line.
- First legal decision is a fixed policy, not a skilled adaptive batter. No representative baseball rates are claimed.

固定 genesis seed 77001、學校／roster、lineup role、position、隊友、對手及其他原始能力。每場由相同 fixture 重新開始，使用 seeds 1–300。投手補充採現役 NPC、roster scale 4–8，每級 60 場；不冒充玩家 P 樣本。

## 正式 contract 與解讀邊界

- `script.js:getOffensiveSimulationCapability`：batting 同時進入 Contact 與 Power；Power 亦讀 instinct，legacy attack 也讀 instinct。observe 同時參與 recognition、Contact、Discipline 及防守判斷。
- `script.js:resolveSimulatedHighSchoolPlateAppearance`：一般 AI PA 讀 pitching effectiveness 與 defensive decision，結果集合沒有 strikeout；不是單純加大 stuff 係數便能建立 SO 分布。此輪不重寫 outcome model。
- `script.js:ensureHighSchoolPitcherRuntimeState`：roster control × 2 進入 sequencing。補充 probe 確認 control 8→16、realization stability 0.407796→0.695796，但該球仍為 competitiveStrike，完整成績未變。
- `playing-time-game-exposure.js` 明定 pitcherExposureDeferred 與 noAppearance。玩家 P 不登板，不能把實際 NPC 先發的 BF 給玩家。
- SS 的 PO+A/chances 是記帳 proxy，非完美的成功機率；DP、球種與機會組成可能影響。throwDiagnostics 僅是正式事件子集，主樣本仍是 canonical chances。
- 3B runner 無 force 或 explicit committed advancement 不得自行朝本壘移動；沿用 Defensive Runner Throw Settlement contract，沒有修改。
- ER/27 outs 僅為 audit proxy。使用固定單一先發 fixture；不宣稱已解决 inherited-runner earned-run attribution。

## Tier means 與樣本

### contact

只改：`baseballSkills.batting`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1250|1202|128|929|48|19|0|0|0|287|0|287|0|
|10|300|1250|1214|140|929|36|13|13|0|0|285|0|285|0|
|12|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|14|300|1244|1206|174|923|38|17|6|18|0|286|0|286|0|
|16|300|1242|1201|176|921|41|33|13|24|0|286|0|286|0|

### power

只改：`instinct`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1244|1206|174|923|38|17|6|18|0|286|0|286|0|
|10|300|1242|1201|174|921|41|22|7|19|0|286|0|286|0|
|12|300|1242|1201|174|921|41|22|7|19|0|286|0|286|0|
|14|300|1242|1201|175|921|41|24|10|22|0|286|0|286|0|
|16|300|1242|1201|176|921|41|32|12|24|0|286|0|286|0|

### discipline

只改：`discipline`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1249|1222|174|928|27|21|3|17|0|286|0|286|0|
|10|300|1247|1213|174|926|34|18|5|18|0|286|0|286|0|
|12|300|1247|1213|174|926|34|18|5|18|0|286|0|286|0|
|14|300|1244|1204|174|923|40|19|6|18|0|286|0|286|0|
|16|300|1242|1201|174|921|41|22|7|19|0|286|0|286|0|

### recognition

只改：`observe`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1242|1201|174|921|41|19|6|18|0|286|0|286|0|
|10|300|1242|1201|174|921|41|19|6|18|0|286|0|286|0|
|12|300|1242|1201|176|921|41|33|13|24|0|286|0|286|0|
|14|300|1242|1201|176|921|41|42|11|26|0|286|0|286|0|
|16|300|1242|1200|183|921|42|78|4|37|0|286|0|286|0|

### speed

只改：`baseballSkills.baseRunning`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|10|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|12|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|14|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|16|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|

### fielding

只改：`baseballSkills.catching`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|10|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|12|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|14|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|16|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|

### arm

只改：`baseballSkills.armStrength`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|10|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|12|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|14|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|
|16|300|1251|1226|158|930|25|19|7|11|0|285|0|285|0|

### control

只改：`baseballSkills.control`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|0|0|0|0|0|0|0|0|0|0|0|0|0|
|10|300|0|0|0|0|0|0|0|0|0|0|0|0|0|
|12|300|0|0|0|0|0|0|0|0|0|0|0|0|0|
|14|300|0|0|0|0|0|0|0|0|0|0|0|0|0|
|16|300|0|0|0|0|0|0|0|0|0|0|0|0|0|

### catcher

只改：`baseballSkills.blocking`。

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|8|300|380|380|0|380|0|0|0|0|0|237|0|0|0|
|10|300|380|380|0|380|0|0|0|0|0|237|0|0|0|
|12|300|380|380|0|380|0|0|0|0|0|237|0|0|0|
|14|300|380|380|0|380|0|0|0|0|0|237|0|0|0|
|16|300|380|380|0|380|0|0|0|0|0|237|0|0|0|

### roster_pitch_quality

只改：`highSchoolMatch.rosters.home.lineup.5.pitching`。Active NPC pitcher; does not validate player pitching admission.

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|4|60|248|232|92|0|16|22|2|21|2419|0|0|0|0|
|5|60|243|230|89|0|13|20|0|18|2363|0|0|0|0|
|6|60|244|225|90|0|19|14|3|17|2346|0|0|0|0|
|7|60|239|225|79|0|14|17|4|7|2335|0|0|0|0|
|8|60|232|223|73|0|9|12|3|8|2306|0|0|0|0|

### roster_pitch_control

只改：`highSchoolMatch.rosters.away.lineup.4.pitchingProfile.control`。Active NPC pitcher; does not validate player pitching admission.

|Tier|Games|PA|AB|H|SO|BB|2B|3B|HR|BF|Chances|PO|A|E|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|4|60|249|218|49|11|31|10|6|0|2083|0|0|0|0|
|5|60|249|218|49|11|31|10|6|0|2083|0|0|0|0|
|6|60|249|218|49|11|31|10|6|0|2083|0|0|0|0|
|7|60|249|218|49|11|31|10|6|0|2083|0|0|0|0|
|8|60|249|218|49|11|31|10|6|0|2083|0|0|0|0|

## Primary metrics

|Capability|Metric|Direction|Steps / 4|Pearson r|Low→high Δ|Relative Δ|Verdict|
|---|---|---|---|---|---|---|---|
|contact|SO|negative|3|-0.849037|-0.001654|-0.002226|NON_MONOTONIC|
|contact|AVG|positive|4|0.982369|0.040055|0.376145|COUPLED|
|power|HR|positive|4|0.94752|0.005058|0.338884|PASS|
|power|XBH|positive|4|0.952705|0.150731|0.63969|PASS|
|discipline|BB|positive|4|0.955829|0.011394|0.527077|WEAK|
|recognition|BB|positive|4|0.707107|0.000805|0.02439|WEAK|
|speed|SB|positive|—|—|—|—|NOT_OBSERVABLE|
|fielding|conversion|positive|4|—|0|0|WEAK|
|fielding|errors|negative|4|—|0|—|WEAK|
|arm|conversion|positive|4|—|0|0|WEAK|
|control|pitcherBB|negative|—|—|—|—|NOT_OBSERVABLE|
|roster_pitch_control|pitcherBB|negative|4|—|0|0|WEAK|
|roster_pitch_quality|pitcherSO|positive|4|—|0|—|NOT_OBSERVABLE|
|roster_pitch_quality|pitcherH|negative|4|-0.994854|-0.023253|-0.066724|PASS|
|roster_pitch_quality|ER27|negative|4|-0.994224|-4.614019|-0.481327|PASS|

|Capability / metric|五級 mean（raw tier: value）|Low block variance|High block variance|
|---|---|---|---|
|contact / SO|8: 0.7432; 10: 0.7432; 12: 0.743405; 14: 0.741961; 16: 0.741546|0.001011|0.000997|
|contact / AVG|8: 0.106489; 10: 0.115321; 12: 0.128874; 14: 0.144279; 16: 0.146545|0.000243|0.000157|
|power / HR|8: 0.014925; 10: 0.01582; 12: 0.01582; 14: 0.018318; 16: 0.019983|0.000106|0.000123|
|power / XBH|8: 0.235632; 10: 0.275862; 12: 0.275862; 14: 0.32; 16: 0.386364|0.008744|0.008945|
|discipline / BB|8: 0.021617; 10: 0.027265; 12: 0.027265; 14: 0.032154; 16: 0.033011|0.000244|0.000165|
|recognition / BB|8: 0.033011; 10: 0.033011; 12: 0.033011; 14: 0.033011; 16: 0.033816|0.000165|0.000102|
|speed / SB|8: —; 10: —; 12: —; 14: —; 16: —|—|—|
|fielding / conversion|8: 1; 10: 1; 12: 1; 14: 1; 16: 1|0|0|
|fielding / errors|8: 0; 10: 0; 12: 0; 14: 0; 16: 0|0|0|
|arm / conversion|8: 1; 10: 1; 12: 1; 14: 1; 16: 1|0|0|
|control / pitcherBB|8: —; 10: —; 12: —; 14: —; 16: —|—|—|
|roster_pitch_control / pitcherBB|4: 0.107537; 5: 0.107537; 6: 0.107537; 7: 0.107537; 8: 0.107537|0.000225|0.000225|
|roster_pitch_quality / pitcherSO|4: 0; 5: 0; 6: 0; 7: 0; 8: 0|0|0|
|roster_pitch_quality / pitcherH|4: 0.348491; 5: 0.343208; 6: 0.336743; 7: 0.333191; 8: 0.325239|0.000107|0.000045|
|roster_pitch_quality / ER27|4: 9.586047; 5: 8.216471; 6: 7.338785; 7: 6.488372; 8: 4.972028|0.758701|1.649728|

等值也列入非嚴格 monotonic steps；strictSteps 在 JSON 中。常數數列的 r 未定義，不能用 4/4 等值步驟宣稱梯度。r 只是五個 tier means 的描述，不是 PASS gate。Quality H/BF 與 run prevention 的 PASS 僅限 NPC 固定情境；不推論玩家投手或完整能力模型已通過。

rates.TB 為 TB/AB；derivedBatting.totalBases 才是純 audit 計算的總壘打數。所有 derived 指標都未寫回 production state。

## Block variance、單場 variance 與 convergence

每項 primary metric 的十個 block means、block variance、low/high paired block deltas 均在 JSON 的 primaryAudits。每級另保留 50 / 200 / 500 / 1000 PA 的 whole-game prefix rates；actualPA 是實際樣本，非截斷或偽造。

|Contact raw tier|Hitless fraction|Multi-hit fraction|
|---|---|---|
|8|0.59|0.016667|
|10|0.566667|0.033333|
|12|0.516667|0.043333|
|14|0.463333|0.043333|
|16|0.456667|0.043333|

|Contact prefix target PA|Tier 8 AVG|Tier 10 AVG|Tier 12 AVG|Tier 14 AVG|Tier 16 AVG|
|---|---|---|---|---|---|
|50|0.137255|0.137255|0.150943|0.150943|0.16|
|200|0.1|0.118557|0.126904|0.142857|0.147959|
|500|0.095833|0.110656|0.120408|0.13963|0.142857|
|1000|0.103842|0.113963|0.125382|0.141529|0.144341|

這些比例證明此 fixture 仍有單場重疊；focused test 亦以 20 個真實完整比賽 seed 驗證高級無安與低級多安均非零。由於 pitch identity 重複，不把窄 block variance 解釋為廣泛情境下的高統計信心。

## Cross audits、隊伍情境與 decision / production

|Arm tier|Canonical chances|Recorded throw subset|Successful throw subset|
|---|---|---|---|
|8|285|268|268|
|10|285|268|268|
|12|285|268|268|
|14|285|268|268|
|16|285|268|268|

上述 throw subset 為正式 game event 的輔助檢視，並非另造 canonical throwing statistic；chances 不以 decision count 取代。全成功表示此固定球路與操作策略飽和，不代表 Arm 沒有 production 作用。

- power → BB：low/high Δ 0.002465；WEAK。
- fielding → HR：low/high Δ 0；WEAK。
- control → errors：low/high Δ —；NOT_OBSERVABLE。

|Contact tier|County mean score|National mean score|
|---|---|---|
|8|6.57775|6.24105|
|10|6.58365|6.24535|
|12|6.58775|6.24825|
|14|6.5937|6.2525|
|16|6.60185|6.25835|

固定隊伍下的 Contact 安打訊號與 NPC quality 失分訊號仍可見，故在該 fixture 中沒有完全被隊伍淹沒；不宣稱跨隊伍成立。弱／中／強對手 sensitivity 依使用者的「主要 audit PASS 後」條件未啟動。

Selection smoke 每級 20 場，只讓正式 fullGameProduction records 進入新建的合法 selection context，固定 readiness 和 team need；保留每場 profile 分數。它測讀取與反應，不調門檻，也不把重複 game ID 包裝成多場累積高信心。

Decision diagnostics 保存 quality × result 分布，與 canonical PA/BF/chances 完全分開。固定 first-legal policy 不足以證明 good-decision/bad-result 和 bad-decision/good-result 在一般 gameplay 的相關性；未建立時明確標記未驗證，不能拿 decision count 補 sample。

## Final classification

|Capability|Classification|Reason|Confidence|
|---|---|---|---|
|Contact|WEAK|H/AB signal is present but batting also changes derived power; SO effect is small and not strictly monotonic.|Within this fixed fixture only; limited independent pitch contexts.|
|Power|USABLE|Only derived power changes in recorded capability adapters. HR and XBH rise; five raw tiers collapse to four effective power values (7/8/8/9/10). Legacy attack also reads instinct, but dominance is not established.|Usable within this fixed fixture; rounding and repeated PA identity limit generalization.|
|Discipline / Recognition|WEAK|Discipline and observe are separate raw axes. Player plate recognition reads observe/IQ/ballSense; raw discipline acts through other adapters.|Fixed first-legal-choice policy; does not establish adaptive chase reduction.|
|Speed|NOT_OBSERVABLE|No reliable steal-opportunity denominator under this fixed policy; no invented advancement rate.|Only absence in tested context, not proof that all baserunning is disconnected.|
|Fielding / Arm (SS)|WEAK|Canonical chances and PO/A/E are reported; throw subset is descriptive. Sparse or saturated conversion cannot establish a general gradient.|Below requested 750 chances where indicated; same opportunity family and position.|
|Player Pitch Control / Quality (P)|NOT_OBSERVABLE|Canonical playing-time contract defers player pitcher exposure; actual starter is an NPC. Player BF stays zero.|High confidence in observability limit; no player pitching effectiveness claim.|
|Roster Pitch Control|WEAK|Control reaches sequencing realization, but full-game BB rates are identical in this fixture; ordinary AI PA does not read control.|Micro wiring inspected; full production gradient not established.|
|Roster Pitch Quality|USABLE|Pitching effectiveness reduces H/BF and ER/27 outs, 4/4 steps; ordinary AI PA cannot produce SO.|Moderate within fixed roster/context; no player-pitcher or SO validation.|
|Catcher-specific capability|NOT_OBSERVABLE|Blocking tier is tested in completed C games; canonical defense line is not a validated catcher-specific blocking/framing statistic.|Evaluation-driven capability; full-game statistical validation remains unavailable.|
|Mental / Clutch / Anticipation|NOT_OBSERVABLE|Anticipation is contextual runtime state, not an independent player scalar; pressure-specific matched cohorts are not established by this fixture.|Not validated; no aggregate AVG claim.|

## Verification 與下一步

- Focused test：target-only fixture、canonical sample source、decision count 隔離、deterministic repeat、instrumented/unobserved record 與 event log 完全一致、aggregation、diagnostics、單場 variance。
- 17 組 selected dependencies PASS（另含三組 Position / Evaluation boundary tests），含三組 Full Game Record、Offensive Plate、Pitcher、Defensive、Team Strength、Competition Evidence、County／National Selection。
- Full regression：162 / 162 PASS。focused test 後續新增 neutrality / variance assertions 亦單跑通過。
- Full JS/CJS syntax：244 / 244 PASS。
- 1,400-game audit：PASS；orphan / no-progress / match-state / game-record issues 全部為 0；deterministic 與 instrumentationNeutral 均為 true。
- git diff --check：PASS（新檔另以 no-index whitespace check 檢查）。git status：6 個新增未追蹤檔案；tracked / production diff 為 0；HEAD 與 origin/main 保持 46f8d2d，ahead / behind 0 / 0。

本輪未發現已證明且適合最小修復的 production wiring bug。已定位 model coupling、固定 pitch identity、普通 AI 無 SO outcome、player pitcher exposure deferred，以及 under-observed/saturated 能力。這些不是本轮已完成的 calibration。

建議先以獨立的 audit-fixture / observability 範圍驗收：取得合法且不同 PA identity 的等價情境、擴充 catcher／arm 的可觀測樣本，明確界定 player P exposure 的後續範圍；有穩定獨立樣本後再決定是否開 Calibration Sprint。本輪沒有開始該 Sprint。

Stop Conditions：本 runner 對完整紀錄檢查失敗會立即停止；最終以 structured result 和 closeout 為準。功能本來未支援且本輪只標記 NOT_OBSERVABLE 的項目，依規格保留，未嘗試需要 redesign 的修復。

## 重跑

```text
node tests/ability-performance-gradient-test.js
node tests/ability-performance-correlation-audit.cjs
node tests/ability-performance-correlation-audit.cjs --pitcher
node tests/ability-performance-correlation-audit.cjs --smoke
node tests/ability-performance-correlation-audit.cjs --report
```
