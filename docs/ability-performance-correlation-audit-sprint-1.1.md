# Ability–Performance Correlation Audit Sprint 1.1 — Observability & Isolation Extension

狀態：**PASS_WITH_EXPLICIT_STEAL_SUBITEM_BLOCKER**。這是測量能力的驗收，不表示全部 gameplay 能力模型通過。盜壘執行子項依 Stop C 停止；合法強迫推進已完成。

## 1. Baseline 與保存

Production baseline：`main = origin/main = 46f8d2d`，ahead / behind 0 / 0。開始時已有 Sprint 1 的六個 untracked audit-only 檔案；未 reset、clean、restore、commit 或 push。

Sprint 1 四份報告／JSON 原檔保持不變，SHA-256 記錄於 1.1 JSON 的 originalArtifactHashes 並在測量結束重驗。原 runner 僅延伸 CLI dispatch；原 gradient test 保留。新 extension 共用原 runner 的 canonical aggregation、rates、block summaries 與 diagnostics，未建立另一套互斥 framework。

## 2. 隔離、independence 與 scope

- PA experiments use the existing standalone auto-approach resolver with unique identities. They are NOT full-match player career simulations; batting-only active GameRecord projections are not claimed to be completed games or complete scoring records.
- The standalone generator uses its production legacyCompatibilityFallback pitch distribution, held fixed by identity. Absolute rates must not be compared to Sprint 1 as if only independence changed.
- Defense opportunities use real foundation input/output and canonical third-out settlement; errors remain unadjudicated.
- Steal execution is absent even though the ledger can ingest SB/CS events. No fake attempt, SB or CS was created.
- NPC confirmation uses 20 full games/tier, independent game identities, actual BF event IDs and checked simulation cursor advancement; the 997-state production RNG remains unchanged.

Contact 用正式 resolver 的 batting input，Power 固定 12；Power 用獨立 power input，batting 固定 12。Recognition 用 observe input，其他 recognition inputs ballSense / baseballIQ 固定 10；沒有把 approach selectionProfile 改名成 Discipline。

五級為 canonical 0–20 上的 8/10/12/14/16。每一 paired tier 共享同一 game/PA identity 與環境，分別以新的 pure resolver state 執行；同一 tier 的不同 sample 使用不同 identity。實際 pitch IDs 與 pitchNumber 連續性逐 PA 檢查。Defense 使用原有 reach、secure、strength、accuracy namespace；不加亂數、不換 generator。

Batting 每級 1,000 真實 resolved PA；Fielding / Arm / Advancement 每級每 bucket 1,000 個機會。各分 10 blocks × 100 opportunities。NPC 每級 20 完整比賽，分 10 blocks；BF 與 unique BF event counts 相等。這些 PA 或 defense sessions 不能加總冒充 full games。

## 3. Required result matrix

|Capability|Metric|Observable|Isolated|Direction|Steps / 4|Low–high Δ|Verdict|Blocking reason|
|---|---|---|---|---|---|---|---|---|
|contact|AVG|true|true|positive|4|0.138536|USABLE|—|
|contact|SO|true|true|negative|4|-0.075|USABLE|—|
|power|HR|true|true|positive|4|0|WEAK|Power changes physical pace/depth, but legacy statistical adapter reads continuous contact score; no pure-power production-stat gradient.|
|power|XBHperAB|true|true|positive|4|0|WEAK|Power changes physical pace/depth, but legacy statistical adapter reads continuous contact score; no pure-power production-stat gradient.|
|power|TB|true|true|positive|4|0|WEAK|Power changes physical pace/depth, but legacy statistical adapter reads continuous contact score; no pure-power production-stat gradient.|
|recognition|BB|true|true|positive|4|0.02|USABLE|—|
|recognition|correct take / takes|true|true|positive|4|0.034432|USABLE|Decision-observable only in this complete standalone pitch stream.|
|recognition|chase swings / out-of-zone pitches|true|true|negative|4|-0.026353|USABLE|Not an AI full-game chase denominator.|
|fielding/ROUTINE|out conversions / opportunities|true|true|positive|4|0|FIXTURE_SATURATED|—|
|fielding/MODERATE|out conversions / opportunities|true|true|positive|4|0.096|USABLE|—|
|fielding/DIFFICULT|out conversions / opportunities|true|true|positive|4|0.623|USABLE|—|
|arm/MODERATE|out conversions / opportunities|true|true|positive|4|0|FIXTURE_SATURATED|SS throw demand max strength 6; arm 8–16 is above its quality thresholds. Timing consumes throw-quality categories, not continuous arm.|
|arm/DIFFICULT|out conversions / opportunities|true|true|positive|4|0|FIXTURE_SATURATED|SS throw demand max strength 6; arm 8–16 is above its quality thresholds. Timing consumes throw-quality categories, not continuous arm.|
|speed/MODERATE|forced advancement safe / attempts|true|true|positive|4|1|USABLE|—|
|speed/DIFFICULT|forced advancement safe / attempts|true|true|positive|4|0.665|USABLE|—|
|arm/MODERATE|on-target throw / attempts|true|true|positive|4|0|FIXTURE_SATURATED|Canonical throw quality is saturated above SS strength demand.|
|arm/DIFFICULT|on-target throw / attempts|true|true|positive|4|0|FIXTURE_SATURATED|Canonical throw quality is saturated above SS strength demand.|
|NPC Pitch Quality|pitcherH|true|true|negative|4|-0.023344|USABLE|—|
|NPC Pitch Quality|ER27|true|true|negative|4|-4.417519|USABLE|—|
|Fielding|scorer E|false|||—|—|NOT_OBSERVABLE|Physical foundation does not adjudicate E. Unsecured balls are not automatically errors.|
|Arm|throw quality|false|||—|—|FIXTURE_SATURATED|All requested SS tiers exceed strength threshold; acquired context and accuracy are fixed.|
|Speed|steal success|false|||—|—|OUTCOME_SPACE_GAP|Record supports SB/CS ingestion, but production has no steal execution producer. A forced attempt cannot be resolved without constructing a new result.|
|Speed|hit production|false|||—|—|NOT_OBSERVABLE|No independent infield-hit speed resolver validated in this extension.|
|Discipline|BB / decision quality|false|||—|—|NOT_OBSERVABLE|No independent discipline input in the standalone PlateApproach ability seam. Its selectionProfile is a tactical policy, not a player ability; do not relabel it discipline.|
|Pitch Control|ordinary AI BB/BF|false|||—|—|WEAK|B: ordinary AI PA has walk but does not read control. Control is read by human PA sequencing; separate from the ordinary AI stream.|
|Pitch Quality|ordinary AI SO/BF|false|||—|—|OUTCOME_SPACE_GAP|resolveSimulatedHighSchoolPlateAppearance outcome set excludes SO; human PlateApproach does support strikeout.|
|Player P|BF / outs / run prevention|false|||—|—|BLOCKED_BY_EXPOSURE|playing-time-game-exposure.js: pitcherExposureDeferred → noAppearance → script.js: shouldEnterHighSchoolMatchPlayer rejects deferred exposure → active roster incumbent remains pitcher → match-game-record.js: BF credited to active defensive P|
|Catcher-specific|blocking / framing / steal defense|false|||—|—|NOT_OBSERVABLE|Pitcher-catcher tactical calls and receiving/throw legs exist; no complete canonical catcher-specific blocking, framing, passed-ball or steal-defense statistical producer.|

完整 five-tier means、Pearson diagnostics、relative deltas、block means / variance、paired improvement frequencies 與每 block identity counts 均在 structured JSON；r 不是 PASS gate。

## 4. Contact / Power / Recognition

|Axis|Tier|PA|AVG|SO%|BB%|HR/AB|XBH/AB|TB/AB|Unique PA|
|---|---|---|---|---|---|---|---|---|---|
|contact|8|1000|0.330084|0.339|0.282|0.008357|0.143454|0.52507|1000|
|contact|10|1000|0.366295|0.318|0.282|0.01532|0.16156|0.604457|1000|
|contact|12|1000|0.409471|0.299|0.282|0.023677|0.185237|0.700557|1000|
|contact|14|1000|0.437326|0.285|0.282|0.032033|0.21727|0.784123|1000|
|contact|16|1000|0.468619|0.264|0.283|0.04742|0.239888|0.867503|1000|
|power|8|1000|0.373278|0.312|0.274|0.020661|0.187328|0.64876|1000|
|power|10|1000|0.373278|0.312|0.274|0.020661|0.187328|0.64876|1000|
|power|12|1000|0.373278|0.312|0.274|0.020661|0.187328|0.64876|1000|
|power|14|1000|0.373278|0.312|0.274|0.020661|0.187328|0.64876|1000|
|power|16|1000|0.373278|0.312|0.274|0.020661|0.187328|0.64876|1000|
|recognition|8|1000|0.353024|0.299|0.289|0.012658|0.177215|0.603376|1000|
|recognition|10|1000|0.360795|0.289|0.296|0.014205|0.183239|0.620739|1000|
|recognition|12|1000|0.362857|0.285|0.3|0.015714|0.184286|0.625714|1000|
|recognition|14|1000|0.370158|0.277|0.303|0.017217|0.189383|0.64132|1000|
|recognition|16|1000|0.379161|0.268|0.309|0.017366|0.195369|0.657019|1000|

純 Contact 的 AVG 與 SO 有方向正確的梯度，上一輪「batting 同時改 power」不再是 fixture confound。純 Power 的 input 已隔離，但 terminal HR/XBH/TB 完全相同；不能沿用 Sprint 1 的 Power USABLE 結論到這條打席路徑。

|Power tier|Balls in play|Hard physical balls|Deep physical balls|
|---|---|---|---|
|8|414|36|10|
|10|414|55|31|
|12|414|70|68|
|14|414|88|112|
|16|414|113|163|

正式 trace：`batted-ball-physical.js` 的 pace/depth 讀 Power；`offensive-plate-approach.js:resolveLegacyBallInPlayOutcome` 使用 continuousContactScore 投影統計結果，而該 contact score 讀 batting，不讀 power。`script.js:resolveHighSchoolOffensiveDecision` 的紀錄標記為 physicalTruthToLegacyDownstreamOutcome。這是路徑／投影缺口，不能以調 Power 係數解決或直接宣布所有 Power 都未連線。一般 AI PA 另有 composite quality 讀 Power。

Recognition 的完整 standalone pitch stream 可計算 chase / take quality；其 denominator 限於這個 stream。普通 full-game AI 沒有 pitch-by-pitch chase denominator。Discipline 的獨立 scalar 未進此 resolver seam，保留 NOT_OBSERVABLE，不用戰術政策當能力替身。

## 5. SS difficulty、Arm 與 Speed

ROUTINE / MODERATE / DIFFICULT 沿用 ground ball weak / firm / hard。SS、reaction/range/mobility 5.5 與 catching 4 固定；difficulty 透過正式球速與 arrival pressure 產生。Fielding conversion 透過正式 acquisition → throw → runner settlement，失敗不自行記 E。

|Axis / Bucket|五級 conversion / success|Opportunities per tier|
|---|---|---|
|fielding / ROUTINE|1 / 1 / 1 / 1 / 1|1000|
|fielding / MODERATE|0.904 / 1 / 1 / 1 / 1|1000|
|fielding / DIFFICULT|0.156 / 0.615 / 0.779 / 0.779 / 0.779|1000|
|arm / MODERATE|0.666 / 0.666 / 0.666 / 0.666 / 0.666|1000|
|arm / DIFFICULT|0 / 0 / 0 / 0 / 0|1000|
|speed / MODERATE|0 / 0 / 0.334 / 0.667 / 1|1000|
|speed / DIFFICULT|0.335 / 0.665 / 0.665 / 1 / 1|1000|

Arm isolation 本身成立，但 SS 的 strength demand 至多 6，8–16 全在相同 throw-quality category；timing 階段讀 category 而非 continuous arm。MODERATE out conversion 的差異來自固定 runner-start pool，不是 Arm；DIFFICULT 的既定 runner pressure 使球員失敗，不能據此調 Arm。保留 FIXTURE_SATURATED / categorical plateau，未修改 SS distance 或 Defensive semantics。

Speed 測合法 ground-ball force 的 1B→2B advancement execution；attempt decision 已存在且固定，不是盜壘頻率。所有已 admitted 的 acquisition / environment seed lists 在 tier 間完全相同。SB/CS ingestion 只有記帳介面，沒有正式 steal producer，因此 Stop C：不創造 attempts / SB / CS，保留 null。

3B runner 無 force 且未 explicit committed/advancing 時不往本壘移動；既有 runner-throw regression 繼續驗證此 contract。本 fixture 不修改該條規則。

## 6. P / C 與 outcome gaps

Player P structural trace：selected as P → pitcherExposureDeferred / noAppearance → incumbent NPC 保持 P assignment → ordinary AI innings → canonical BF 記給 incumbent；玩家 BF 與 outs 都是 0。分類 BLOCKED_BY_GAMEPLAY_EXPOSURE / BLOCKED_BY_EXPOSURE。後續僅提出 Player Pitcher Full-Match Exposure Integration，不在本輪施工。

NPC Quality 在 corrected game identities 下確認 H/BF 與 ER/27 outs 仍為 4/4 改善，維持固定情境 USABLE。沒有複製 NPC 數據給玩家。ER proxy 不宣稱已解決 inherited-runner attribution。

Control / BB gap 屬 B：ordinary AI 有 walk，但 `resolveSimulatedHighSchoolPlateAppearance` 不讀 control；meaningful human sequencing 則會讀 control。SO gap：普通 AI outcome space 沒有 strikeout，分類 OUTCOME_SPACE_GAP；這不適用於能產生 SO 的 player PA resolver。

|Catcher component|現況與分類|
|---|---|
|Pitch calling / tactical response|正式 decision / sequence trace 存在；DECISION_ONLY_OBSERVABLE|
|Throw / receiving|可讀既有 defensive leg，但無完整 catcher-specific full-game metric|
|Blocking|catcher decision 路徑存在；無獨立 canonical blocking / passed-ball 統計|
|Steal defense|沒有 steal execution producer；NOT_OBSERVABLE|
|Framing / passed ball / wild-pitch interaction|GameRecord 沒有對應完整統計 contract；NOT_OBSERVABLE，不發明 catcher score|

## 7. Regression、production diff 與 Stop

Validation：{"fullRegression":"163/163 PASS","syntax":"246/246 PASS","focused":"9/9 extension groups PASS; Sprint 1 gradient PASS","audit1400":{"matches":1400,"orphan":0,"noProgress":0,"matchStateIssues":0,"gameRecordIssues":0,"deterministic":true,"instrumentationNeutral":true},"selectedDependencies":{"mode":"Covered by full regression","files":["match-full-game-record-test.js","full-game-player-line-test.js","full-game-competition-evidence-test.js","offensive-plate-approach-foundation-v1-test.js","pitcher-catcher-tactical-integration-test.js","defensive-reach-secure-foundation-test.js","defensive-decision-throw-foundation-test.js","defensive-runner-throw-settlement-foundation-test.js","offensive-tactical-action-sprint-b2-runner-realization-test.js","opportunity-evaluation-boundary-v1-0-1-test.js","high-school-competition-evidence-test.js","county-selection-opportunity-test.js","national-selection-pipeline-test.js","ability-performance-gradient-test.js"]},"productionDiffFiles":0,"diffCheck":"PASS, including 10 untracked file whitespace checks","baseline":"main = origin/main = 46f8d2d; ahead/behind 0/0","gitStatus":"10 untracked audit-only files; tracked production diff 0","originalArtifacts":"4/4 SHA-256 unchanged","stopConditions":["C: steal execution subitem only"],"committed":false,"pushed":false}

新增 test 覆蓋：target-only views、unique IDs / duplicate rejection、explicit deterministic replay、paired first-pitch truth、difficulty demand、non-saturated fielding、Arm acquisition invariance、合法 Speed denominator、canonical sample 與 decision count 隔離、input immutability、P exposure 與 SO outcome gap。原 Sprint 1 gradient test 保留。

Stop C 僅阻擋 steal execution 子項。其餘 Stop 的最終情況依 validation；production diff 必須 0。未 commit、push、開始 Calibration / Outcome Expansion / Exposure Integration / Pitch-Level Refinement。

## 8. Next-step decision

- Contact：保留現行係數；可在後續不同政策／對手下確認，不因單一 fixture 的率直接 tuning。
- Power：先審查 physical truth → statistical outcome adapter；提出最小 wiring / mapping 設計再另行批准。不是本輪直接調參。
- Fielding：可觀測且非全面飽和；先核對期望 difficulty 曲線，再決定是否需要 calibration。
- Arm：先界定 SS continuous strength 與 coarse throw-quality 的 intended contract；不把 saturated range 當成能力沒用。
- Steal / ordinary AI SO：Match Simulation Outcome Expansion；Player P：Gameplay Exposure Integration；Catcher：明確 outcome / evidence contract。均未施工。

## Reproduce

```text
node tests/ability-performance-correlation-audit.cjs --observability
node tests/ability-performance-observability-extension-test.js
node tests/ability-performance-correlation-audit.cjs --observability-report
```

原 Sprint 1 報告與數據保持原樣。1.1 新增結果檔：ability-performance-correlation-audit-results-v1.1.json；本 addendum 為 scope 明確的獨立版本，不覆蓋舊結論。
