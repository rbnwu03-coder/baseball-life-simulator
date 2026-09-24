# High School Opportunity Post-Repair Calibration Audit — Sprint 2

Status: **PASS**。正式 10,000 unique careers、四 cohort replay/trace、0 warnings、0 failures；final verification 採用明確授權的新基準 `ad7e831`。

## Baseline 與 scope

原 audit baseline 為 `a918199`；本次 final verification baseline 為 `ad7e831`，main=origin/main，ahead/behind=0/0，開始時 working tree clean。`ad7e831` 將本 Sprint 的11個 audit/test/docs/入口檔提交；沒有 production behavior change。本次不 reset、不 commit、不 push，不操作兩份既有 stash，亦未開始下一 Sprint。

Audit only。Selection policy 維持 `high-school-opportunity-selection-v2`；probability 維持 `high-school-opportunity-probability-v1`，3/2/1、hash、seeded draw、budget、mandatory、match frequency、schedule legality、Match Context、GameRecord 皆不改。

本輪重用既有 calibration career helper / compact trace，不另建 production engine。Helper 的新增 configuration 只選正式 genesis profile、正式 invitation index 與 namespace；原 API 預設仍使用原 ordinary / 97001 / 第一校 / audit-career namespace。新 audit module 只讀資料；新增 runner 透過 `npm run audit:opportunity-post-repair` 執行。

## Sample design

正式樣本 4 cohorts × 2,500 = 10,000 unique careers，每 career 實際完成 Y1=2、Y2=2、Y3=1 五場。每 cohort 再執行同 IDs reverse replay、permuted trace、probability-disabled，共四 passes；不是將 replay 計入 10,000 unique sample gate。

| Cohort | Identity namespace | Capability fixture | Admission |
|---|---|---|---|
| A | postrepair-A | ordinary / 97001 | 第一個正式 invitation |
| B | postrepair-B | defense / 97001 | 第一個正式 invitation |
| C | postrepair-C | ordinary / 97001 | 第二個正式 invitation |
| D | zeta-postrepair-D | ordinary / 97001 | 第一個正式 invitation |

所有 cohort 使用同一 `postrepair-A-{index}` admission generation seed 配對世界；A/D 的差異主要在 career-ID namespace，B 有 canonical 能力差異，C 有 school context 差異。不同 cohort 的後續對手／真實比賽結果可能造成 source evolution 差異，不能將 cross-cohort raw share 差異直接當 capability→weight 因果。

每個 cohort 內 index modulo 4 均勻配置既有 source-availability subcohorts：none、initiated coach contact、established coach counterpart、explicit four-school Y1 camp plan；每類 625 careers。沒有 fake source、novelty bonus 或 repeat penalty。

所有 10,000 個 index 已在比賽前通過 capability settlement、school invitation、selected-school assignment、canonical roster validity。沒有剔除、替換或縮小樣本。每次重播仍再驗入學 validity。

## Replay、reload 與 aggregation

同 cohort/ID 的 enabled、reverse-order replay、trace permutation 要求整份 canonical summary deep-equal，careerDigest 包含每筆 canonical record（含 GameRecord fingerprints），不是只比均值。完整 JSONL checkpoint 位於 OS temp，目錄由 audit helpers 與 production source content digest 決定，避免誤用舊 cache。

每 cohort 每 pass 的前 100 IDs 做正式 save/load、decline/expire/cancel no-replacement、capability/strength metadata perturbation neutrality。新增 Y1 結束及 Y2 結束的 boundary save/load，重新載入後檢查 relationship ledger / schedule 原樣保存，再走下一年正常 transition。跨年重播還比較後續 source、pool、draw、Opportunity 與 GameRecord witnesses。

Expected weighted selections 以 1e-9 observation precision 的整數累計，保證不同 batch ordering 的浮點加總不製造假差異；production 權重、draw、結果沒有 round。實際選擇與完整 records 使用原 production 精度。

小批 smoke 首次顯示的 summary mismatch 僅是 `sample` 示範 ID 清單按 traversal order 取前兩筆；逐欄比對只此欄不同，careerDigest、draw、GameRecord 及所有統計一致。已將示範 ID 按 canonical ID 排序，新增 reverse aggregation regression。這是新增 audit harness 的顯示排序問題，沒有 production correctness bug，也未繞過 determinism gate。

## Metrics 與解讀邊界

- Generated / generator-eligible / postDedup / actual probability reachable / selected / materialized 分開統計。
- Source mix、friendly producer class、camp source class、optional opportunity type、base weight class，均保留 cohort/year 分層。
- Candidate pool 與 actual reachable pool 使用 0/1/2/3/4+ buckets；sparse map 缺少的 bucket 代表 0。
- Prior relationship 直接取該視窗開始前 canonical evidence，排除 competitionEncounter；同時列 raw evidence facts 數與 unique related schools 數，避免把 supporting evidence multiplicity 當成額外學校。
- New/repeat 以實際之前完成賽事的 opponent set 判定；available 只數目前 canonical school pool，generated / reachable / selected 各自獨立。
- 每 career unique、repeat、max appearances、top opponent、top-3、HHI 與 cohort-wide concentration 分開；source persistence 使用年度 source-set transitions，opponent persistence 區分 same / different-known / new。
- Mandatory reference 不混入 optional source selection share。
- Y3 是 mandatory official competition，optional weighted pool 為空。Y3 repeat 可測，只有達門檻才提出 longitudinal warning，但不能以此宣稱 optional relationship weights runaway。
- Disabled retains stable selection，沒有 probability draw；比較其實際 match/opportunity counts、mandatory counts 與 source mix，而不將 counterfactual profiles 冒充 actual reachability。

## Diagnostic thresholds（不是 tuning targets）

- Camp overexposure >70%；有 >100 reachable 而 optional selection share <1% 為 underexposure。
- ReturnVisit >100 reachable 而 selection share <0.1% 為 starvation；selected >1.25×expected +30 為 overexposure。另輸出 raw reachable share、selection share及其比值，3/2/1 的預期加權效果不自動視為 bug。
- Fallback selected >1.2×expected +30 為 overuse。
- Reachable >100 而 selected=0 為 ZERO_EXPOSURE_WARN。
- Y3 repeat 比 Y2 多超過 15 percentage points 為 longitudinal warning；需結合 mandatory context 解讀。
- Cohort share range >20 percentage points 為 sensitivity warning。
- Runaway 要求各年度均有 optional selections、充足 new-opponent reachable pool，且 related-opponent optional selection/reachability ratio 逐年增加超過 0.2；不能只用 repeat>new。現有 mandatory-only Y3 不滿足此 optional causal判準，會明示 scope limitation。
- 每 cohort 3vs2、3vs1、2vs1 pairwise 用同一批 namespace IDs；cohort inversion 為 WARN、global inversion 為 FAIL。Equal-weight ordering / prefix / camp group size 另做可比實驗。

## Validation progress

- New foundation: 24/24 PASS。
- New production integration: 25/25 PASS。
- All cohort entry preflight: 10,000/10,000 PASS。
- Full JS/CJS syntax: 300/300 PASS。
- Selected regression：69/69 PASS；full regression：197/197 PASS。
- 1,400-game audit：bench1000、starter400全部完成，四類 integrity issues均0，deterministic / instrumentationNeutral均true。
- Formal audit：4×2500 unique careers，四模式完成，replay / trace一致；warnings0、failures0。
- 本次採既有完整 artifacts 核對，未重跑生涯、全量回歸或比賽 audit。

## Final baseline provenance

Recorded source digest：`25da3c5e02872ae1e7afdc8aa6e9bcf0ac4a4929c77c9039106d8180658ebe03`。重新讀取目前 runner、audit helpers與production JS/HTML後摘要完全相同。原JSON metadata.baseline=a918199是建置起點，不改寫為生成時HEAD；新增closeoutVerification.revisedBaseline=ad7e831記錄本次驗收。a918199→ad7e831沒有selection、probability或other gameplay diff；所有11檔均屬本Sprint。歷史中途批次log不能推翻後來完整formal JSON；本次以提交的完整JSON、identity digests、replay/trace flags與regression artifacts為依據。

## Measured conclusions

| Cohort | Camp | Friendly | ReturnVisit | Y2 new | Replay / trace |
|---|---|---|---|---|---|
| A | 15.0800% | 84.9200% | 11.5733% | 44.4600% | PASS / PASS |
| B | 14.8533% | 85.1467% | 11.4000% | 44.8400% | PASS / PASS |
| C | 14.6667% | 85.3333% | 10.3600% | 46.0400% | PASS / PASS |
| D | 14.0533% | 85.9467% | 11.7600% | 44.4000% | PASS / PASS |

| Year | New / repeat selected | Camp optional exposure |
|---|---|---|
| 1 | new 18647 / repeat 1353（93.2350% / 6.7650%） | 6.8500% |
| 2 | new 8987 / repeat 11013（44.9350% / 55.0650%） | 18.5700% |
| 3 | new 7235 / repeat 2765（72.3500% / 27.6500%） | NOT APPLICABLE — mandatory-only |

| Metric | Previous repair audit (5000 careers) | Current (10000 careers) | Interpretation |
|---|---|---|---|
| Camp optional share | 14.7867% | 14.6633% | Delta -0.1233 pp；跨cohort穩定。 |
| ReturnVisit reachable | 13156；2.6312 / career | 26324；2.6324 / career | Raw count必須按樣本量解讀，沒有把兩倍sample當暴增。 |
| Y2 new opponent share | 45.3100% | 44.9350% | Delta -0.3750 pp。 |

ReturnVisit reachable share=5.5396%、selected share=11.2733%，raw exposure ratio=2.0350。這包含權重3的預期作用；observed/weighted-expected=1.0275，不支持額外 overexposure concern。Camp observed/expected=0.9834。

| Year | Prior evidence facts | Prior school-window count | Future candidates with prior | Reachable with prior | Selected with prior (all / optional) | Optional exposure/reachability ratio |
|---|---|---|---|---|---|---|
| 1 | 38630 | 18647 | 97146 | 12500 | 2706 / 1353 | 1.6236 |
| 2 | 113732 | 48862 | 284786 | 142920 | 12182 / 12182 | 1.3859 |
| 3 | 96202 | 30112 | 204715 | 0 | 2765 / 0 | NOT APPLICABLE |

Y1→Y2 related-opponent normalized ratio下降；Y3沒有optional權重路徑，因此額外optional Y3的runaway推論為NOT APPLICABLE。Career平均unique=3.4869、repeat=1.5131；scope限於現有五場生涯，未外推未實作賽程。整體及cohort各pairwise皆同方向；equal/prefix最大偏離在既定範圍內。沒有需要把JSON的0 warnings改為WARN的實質矛盾。

## 87-item closeout

| # | Item | Result |
|---|---|---|
| 1 | Baseline | Final verification 基準 ad7e831；main=origin/main，0/0，開始時 clean。audit 原記錄基準 a918199 保留。 |
| 2 | Changed files | 本次只改本 Markdown 與 formal JSON 的 closeoutVerification；a918199→ad7e831 的 11 檔均屬 Sprint 2。 |
| 3 | Production diff summary | Selection=0；probability=0；other gameplay=0。 |
| 4 | Selection policy version | high-school-opportunity-selection-v2 |
| 5 | Probability version | high-school-opportunity-probability-v1 |
| 6 | Weight constants | 3/2/1 unchanged；explicitReturnVisit/explicitCampPlan=3，coach/school/shared=2，fallback/unknown=1。 |
| 7 | Cohort design | A ordinary；B defense；C 第二個正式 invitation；D zeta namespace。每組 2500，source subcohorts 各625。 |
| 8 | Cohort validity | 4×2500 entry preflight 通過；invalid=0，沒有剔除或替換。 |
| 9 | Total career sample | 10000 unique careers；每模式50000 matches，四 passes 共200000 simulated matches。 |
| 10 | Replay strategy | 相同 IDs，reverse-order replay、permuted trace；四 cohort canonical summary deep-equal。 |
| 11 | Camp overall exposure | 4399/30000 = 14.6633%；期望 4473.4720，無 under/overexposure。 |
| 12 | Camp cohort range | 14.0533%–15.0800%；range 1.0267%（percentage-point span）。 |
| 13 | Camp Y1 | eligible 21684 / reachable 10000 / selected 685 / materialized 685；optional share 6.85%。 |
| 14 | Camp Y2 | eligible/reachable 45196；selected/materialized 3714；optional share 18.57%。 |
| 15 | Camp Y3 | generated 28625，eligible/reachable/selected/materialized=0；optional share NOT APPLICABLE：mandatory-only year。 |
| 16 | ReturnVisit reachable | generated 61782；eligible 35639；postDedup 59662；reachable 26324。 |
| 17 | ReturnVisit selected | 3382 selected/materialized；11.2733% optional exposure；期望 3291.5192。 |
| 18 | ReturnVisit cohort range | 10.3600%–11.7600%；無 starvation/overexposure warning。 |
| 19 | Friendly source mix | coachNetwork: 1961；explicitReturnVisit: 3382；foundationFallback: 17024；schoolRelationship: 3234；cohort/year 細分在 JSON。 |
| 20 | Training camp source mix | trainingCamp:eligibleCoachNetwork: 619；trainingCamp:eligibleExplicitPlan: 419；trainingCamp:eligibleSchoolRelationship: 3102；trainingCamp:eligibleSharedTrainingContext: 259；cohort/year 細分在 JSON。 |
| 21 | Opportunity type mix | friendly: 25601；trainingCamp: 4399；未出現的 optional development/neutralExchange=0；mandatory development10000+official10000另計。 |
| 22 | Y1 new opponent share | 93.2350%（18647/20000）。 |
| 23 | Y1 repeat opponent share | 6.7650%（1353/20000）。 |
| 24 | Y2 new opponent share | 44.9350%（8987/20000）；cohort 44.4000%–46.0400%。 |
| 25 | Y2 repeat opponent share | 55.0650%（11013/20000）。 |
| 26 | Y3 new opponent share | 72.3500%（7235/10000 mandatory matches）。 |
| 27 | Y3 repeat opponent share | 27.6500%（2765/10000）；低於 Y2，沒有 longitudinal domination warning。 |
| 28 | Unique opponent mean | 3.4869 / career。 |
| 29 | Repeat opponent rate | 1.5131 repeats/career；30.2620% of all appearances。 |
| 30 | Top opponent concentration | 每 career mean max appearances 2.2348 / 5、top share 44.6960%；cohort-wide top share 33.2040%。 |
| 31 | Top-3 concentration | per-career mean 88.9640%；cohort-wide 71.4620%；HHI 0.3474 / 0.2017。 |
| 32 | Relationship feedback funnel | 見下表：prior evidence facts / generated / reachable / selected 逐年拆分；priorRelationshipSchools 是跨視窗加總，不是唯一全球學校數。 |
| 33 | Relationship selection exposure ratio | Optional selection-share / reachable-share：Y1 1.6236；Y2 1.3859；Y3 NOT APPLICABLE（無 optional pool）。 |
| 34 | Rich-get-richer analysis | Related sources 有較高 authority；raw repeat>new 不能直接判失控。Y1→Y2 normalized ratio 下降，Y2 new pool仍198503 reachable。 |
| 35 | Relationship runaway classification | 本模型/樣本未觀測 runaway；Y3 optional-runaway 推論 NOT APPLICABLE。未對額外 optional Y3 或更長生涯作保證。 |
| 36 | Source transition matrix | JSON source_transition：Y1→Y2、Y2→Y3 source-set persistence。完整 keys/counts 保留，不以單一 rate 代替。 |
| 37 | Opponent transition matrix | JSON opponent_transition：sameOpponent / differentKnownOpponent / newOpponent，含年度與年內 scope。 |
| 38 | Candidate pool-size distribution | Y1 20000、Y2 20000、Y3 10000 windows 均 generated 4+；0/1/2/3 buckets=0。 |
| 39 | Reachable pool-size distribution | Y1：0=10000、4+=10000；Y2：4+=20000；Y3：0=10000。1/2/3=0。 |
| 40 | Single-candidate windows | 0 actual probability-reachable single-candidate windows。 |
| 41 | Multi-candidate windows | 30000；另20000 mandatory bypass windows reachable=0。 |
| 42 | Weight 3 exposure | selected 3801 / reachable 33824；selection rate 11.2376%。 |
| 43 | Weight 2 exposure | selected 9175 / reachable 106073；selection rate 8.6497%。 |
| 44 | Weight 1 exposure | selected 17024 / reachable 335299；selection rate 5.0773%。 |
| 45 | 3 vs 2 | 6064:3936；高權重選中率 60.6400%；四 cohort 方向一致。 |
| 46 | 3 vs 1 | 7609:2391；高權重選中率 76.0900%；四 cohort 方向一致。 |
| 47 | 2 vs 1 | 6773:3227；高權重選中率 67.7300%；四 cohort 方向一致。 |
| 48 | Equal-weight fairness | 四 cohort max deviation from25%：A 1.0000%；B 2.4000%；C 1.7600%；D 0.9200%。 |
| 49 | Candidate position bias | Reverse ordering mismatch=0；各 sorted index 都有選中，完整 counts 在 candidate_position_bias。 |
| 50 | ID prefix bias | 所有 prefix/cohort 的最大偏離25%為 2.5200%，低於既定8pp gate。 |
| 51 | Career namespace bias | 四 namespaces 同規則下差異小；不要求跨 namespace 相同 draws。 |
| 52 | Cohort sensitivity | Camp range 1.0267%、friendly 1.0267%、return 1.4000%、Y2 new 1.6400%；均低於20pp gate。 |
| 53 | Probability enabled vs disabled | 兩者均50000 completed matches、30000 optional、20000 mandatory；mix不同屬預期 stable vs weighted 政策差異，非 frequency drift。 |
| 54 | Match frequency | 每 career Y1=2/Y2=2/Y3=1；violations=0，並非只比 mean。 |
| 55 | Mandatory integrity | selected20000；probability participation=0。 |
| 56 | Budget integrity | budgetViolation=0；optional budget0/1未變。 |
| 57 | Anti-reroll | Enabled declined/expired/cancelled 各400 samples；failure0。Disabled 摘要亦0。 |
| 58 | Save/reload | Enabled400 samples（每 cohort100），mismatch0；disabled亦400/0。 |
| 59 | Cross-year reload | Enabled800 year-boundary samples，ledger/schedule mismatch0；disabled亦800/0。 |
| 60 | Semantic dedup | semanticDuplicate=0；duplicateWindowMaterialization=0；非 materialized source facts 不算重複賽事。 |
| 61 | Camp group bias | 2/3/4-school aggregate totalWeight 均3；最大 group selection inflation ratio 1.0505；無線性膨脹。 |
| 62 | Friendly source multiplicity | semanticDuplicate=0；來源 precedence 與 production dedup 未改。 |
| 63 | TypeConflict regression | typeConflictRegression=0；mixed camp/friendly v2 fixture PASS。 |
| 64 | Gameplay RNG neutrality | gameplayRngMismatch=0；關閉 flow observer 的五場實測也保持選擇與 GameRecord fingerprints 一致（integration25）。 |
| 65 | Determinism | 四 cohort replayEqual=true，包含 records；0 failures。 |
| 66 | Batch-order neutrality | Reverse/reordered batches canonical summary 相同；expected-weight 固定1e-9 observation precision。 |
| 67 | Instrumentation neutrality | 四 cohort traceEqual=true；1400 audit instrumentationNeutral=true。 |
| 68 | GameRecord neutrality | Production source/schema diff0；1400 integrity issues0，career record assertions與 replay fingerprints通過。 |
| 69 | CompetitionEvidence neutrality | Production diff0；full-game evidence / competition regressions PASS；evidenceOrphans=0。 |
| 70 | Representative selection neutrality | Production diff0；county/national/U18 selection regressions PASS。 |
| 71 | Team strength neutrality | Production diff0；strength perturbation neutralityMismatch=0，相關回歸PASS。 |
| 72 | Ground-ball blocker | Selected/full相關 blocker regression PASS；1400-game settlement audit PASS。 |
| 73 | Selected regression | 69/69 files PASS。 |
| 74 | Syntax | 300/300 JS/CJS PASS；integration最後新增 observer case 的單檔 syntax亦有通過紀錄。 |
| 75 | Full regression | 197/197 files PASS。 |
| 76 | 1400 audit | Bench1000+starter400；orphan/noProgress/match-state/GameRecord各0；deterministic/instrumentationNeutral=true。 |
| 77 | Warnings | 0；本輪結果不繼承 Sprint1 warning。Controlled fixtures 的外推限制是研究範圍，不另捏造 exposure warning。 |
| 78 | Failures | 0。 |
| 79 | Final status | PASS；架構 integrity green，沒有 substantive exposure concern。 |
| 80 | Tuning recommendation | 目前不調 constants；raw比例可由 pool availability與既有權重解釋。 |
| 81 | Relationship damping recommendation | 不建議此時 damping；沒有 runaway證據。 |
| 82 | Weight calibration recommendation | 不開始 weight calibration；3>2、3>1、2>1均成立。 |
| 83 | Recency feasibility recommendation | 建議先做 Relationship Recency / Reputation Feasibility Audit，評估契約与資料需求，非直接引入衰減。 |
| 84 | Next Sprint recommendation | A — Relationship Recency / Reputation Feasibility Audit；未開始。 |
| 85 | git diff --check | Final documentation-only diff check；結果見本文件末尾及 JSON closeoutVerification.finalGit。 |
| 86 | git status | Final working tree僅本 Markdown與formal JSON兩檔修改；HEAD/main/origin仍ad7e831，0/0。 |
| 87 | Stop Conditions | 本次核對未觸發；先前 baseline mismatch 已獲 user 明確授權改用ad7e831。兩份stash原樣保留。 |

## Evidence and changed files

本次僅修改：

- `docs/high-school-opportunity-post-repair-calibration-sprint-2.md`
- `docs/high-school-opportunity-post-repair-calibration.json`（新增核對/provenance與直接衍生summary，原測量欄位保持原值）

Evidence：[formal audit](high-school-opportunity-post-repair-calibration.json)、[selected regression](high-school-opportunity-post-repair-calibration-selected.json)、[syntax](high-school-opportunity-post-repair-calibration-syntax.json)、[full regression / 1400 audit](high-school-opportunity-post-repair-calibration-full.json)。

Preserved stashes：`0daf1e954f74ddb45efe620107970567dec6fffd`、`8cc34a930df052067d1bad3ea798fe0b9d2ae036`。

Final status：**PASS**。Recommendation A only；不開始下一Sprint。

Final Git verification：`git diff --check` PASS；working tree 僅上述兩個文件修改。`main` / HEAD / `origin/main` = `ad7e831`，ahead / behind = 0 / 0。未 commit、未 push，兩份 stash 保持原樣。
