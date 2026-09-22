# High School Opportunity Post-Repair Calibration Audit — Sprint 2

Status: IN PROGRESS. 不以小樣本宣告 PASS；正式 10,000 careers 與 replay / trace / disabled passes 正在執行。

## Baseline 與 scope

Baseline `a918199 fix: remove optional type conflict exposure bias`，main / origin/main ahead-behind 0/0，初始 working tree clean。兩份既有 stash 保留；本輪沒有 commit、push、drop stash 或下一 Sprint 工作。

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
- Y3 是 mandatory official competition，optional weighted pool 為空。Y3 repeat 可測且會提出 longitudinal warning，但不能以此宣稱 optional relationship weights runaway。
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
- Selected / full regression、1,400-game audit、formal multi-cohort audit：執行中。

完整結果、baseline comparison 與 87 項 closeout 待正式稽核完成後填入。
