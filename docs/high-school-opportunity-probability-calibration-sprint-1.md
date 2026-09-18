# High School Opportunity Probability Calibration & Exposure Audit — Sprint 1

狀態：**PASS WITH WARNINGS**。尚未 commit、push 或開始下一 Sprint。

## Baseline 與 audit 範圍

起始 `main`，HEAD / origin/main=`5b5367c`（`feat: add deterministic high school opportunity probability`），ahead/behind=0/0，working tree clean。

本輪只新增 audit 工具、tests、JSON / Markdown，並在 package.json 增加 `audit:opportunity-probability`。Production probability、selection、generator、source producers、admission、RNG、GameRecord、CompetitionEvidence、代表隊 selection、team strength 均未修改。3／2／1 仍是原 policy，沒有調參。

執行方式：

```text
npm run audit:opportunity-probability
```

預設 5,000 個固定 career IDs；可用 `-- --sample 1000 --out <path>` 做較小的開發驗證。正式驗收使用 5,000，因每個 career 都完整模擬五場比賽，且另做三組完整對照，不採 10,000。

Audit code：

- `tests/high-school-opportunity-probability-calibration-career.cjs`：既有 headless career context；真實 genesis/admission、source producer、generator、selection、materializer、accept/schedule、完整比賽、evidence settlement、year transition。
- `tests/high-school-opportunity-probability-calibration-audit.cjs`：逐 career compact witnesses、stable aggregation、pairwise/group/order fixtures、WARN / FAIL 判定。
- `tests/high-school-opportunity-probability-calibration-runner.cjs`：四個獨立 Node worker，逐 career checkpoint，彙總 JSON。不是 agent delegation；沒有新增依賴或 save schema。

## 樣本設計與前置問題

所有正式樣本均使用既有合法 `ordinary` 角色 fixture，character seed=97001；career / school generation IDs 完整保留 `audit-career-000001` 到 `audit-career-005000`。固定能力用來隔離 source exposure，不能把結果推論為所有能力層級或所有 live-player 的入學率。

四個初始 world cohorts 各占 25%，依 index mod 4 固定分配：無初始關係、initiated coach contact、known coach counterpart、Y1 明確四校 camp plan。Contact 經正式 ingestion API，camp 經正式 plan producer；不注入 fabricated completed-match evidence。Y1 completion 產生的實際 evidence 延續至 Y2、Y3。

每個 career 走現有五個 stable lifecycle slots，主動呼叫現有 optional selection API，接受選出的機會後正式排賽與完成。這是 API-driven exposure audit，不是估計目前 UI 自動出現機會的頻率。Y1 required followup 與 Y3 official 始終 mandatory；不讓抽選改變 slot 數量。

四組完整執行：enabled（正序）、enabled repeat（反序）、trace（偶數再奇數）、disabled（正序）。每組 5,000 careers / 25,000 場；共 20,000 次完整 career execution / 100,000 場。比較全部 summary 及 sorted per-career witnesses 的 digest，包含每場完整 GameRecord signature。

第一場 Y1 尚無 playing-time decision seed，因此使用現有 `pendingHighSchoolMatchSimulationSeed` audit hook，由 career ID 經既有 `createHighSchoolMatchSimulationSeedFromIdentity` 推導初始 seed。其餘比賽沿用正式 decision identity seed。未覆寫 RNG implementation，也未使 probability 消耗 match cursor。最初 fixture 未指定首場 seed 的重播差異，已在開始正式批次前定位為不同初始 match seeds；不能把不同初始狀態的比分差異當成 probability drift。

首次較廣泛的抽樣設計另讓 character seed 隨 index 改變。`audit-career-000421` / character seed 880421 通過 capability admission，但全部 24 所學校的 projectedRole 都是 depthCandidate，使 roleDiversity 無法成立，並連帶出現 competitionDiversity 錯誤。該批次在進入此 career 的 probability 流程前停止，沒有跳過失敗 identity；保留 checkpoint 與診斷。正式設計經使用者確認，改為對所有 IDs 一致使用既有合法角色 fixture。全部 5,000 IDs 的 School Invitation 前置檢查已通過，包含 421；沒有修改或降低 admission contract。此問題單獨列為上游入學限制，不能用正式 conditional audit 的 PASS 隱藏它。

## 測量邊界

Source distribution 同時列出 generated candidate、generation eligible、Selection admitted、selected、materialized、completed。Eligibility 尚未通過 type conflict / mandatory / budget，不代表可進 draw。來源 class 僅用既有 Probability profile 做分類；blocked source 的分類用途不等同真的參與抽選。

Availability share 的分母是所有 generation-eligible optional candidates；selection share 的分母是 selected optional opportunities；exposure ratio=selection share / availability share，只是 diagnostic。另列 admitted count 與 expected weighted selections。不能用全域 weight 3/2/1 selection share 推論單次 draw 的 weighting effectiveness。

比較權重另外使用同 pool size、budget=1、year/phase、type 的 synthetic fixtures：3vs2、3vs1、2vs1、3/2/1、equal weights；camp groups 比較 2/3/4 校、同 type 的另一個獨立 camp rival，避免既有 camp>friendly policy 造成混淆。同 semantic friendly multi-source 比較原 pool 與新增 duplicate source 後的完整 probability result。

Camp output 同時保留 group aggregate share、candidate count、individual opponent selection counts；不得把 candidate 個數當成 group 出現率。Opponent concentration 以每個 career 計算後平均，避免大量不同 school IDs 稀釋重複曝光；包含 top opponent、top-3、HHI、available opponents，以及 year-level new / repeat / cross-year counts。

每組前 100 個 identities 各測一次正式 save/load，且 declined / expired / cancelled 各測一個 schedule clone branch。Reload 只暫停頁面 rendering，避免 renderer 自行啟動 legacy match 改變 occupied-slot facts；正式 serializer/admission 都有執行。Anti-reroll branches 不算入完整 career 的 match frequency。

Trace 開關執行唯讀 Selection audit observer；另由 1,400-game audit 驗證既有 match instrumentation。Ability / strength neutrality 比較相同 canonical selection context、改變非加權 metadata 後的 selected IDs / probability result，不要求 provenance 的 schoolStandard 文字保持不變，也不推論能力不能影響上游世界可用性。

Checkpoint 逐 career 保存 candidate IDs / camp refs / pool / Opportunity / GameRecord 的 SHA-256 references，以及 weights、draw、budget、status、completion、evidence counts。這些是 audit witnesses，不回寫 production。JSON summary 保留前四個完整 witness，全部 records 保留在本次 OS temp checkpoint；可用相同命令與 identities 重建。Checkpoint 依 audit source digest 隔離，第一次失敗批次不混入正式樣本。

## 結果

**Sprint：PASS WITH WARNINGS；calibration status：WARN；correctness failures：0。**

Enabled 主樣本：5,000 careers，25,000 windows，15,000 optional、10,000 mandatory；全部 materialized、scheduled、completed。每 career 比賽數 mean=min=max=5，distribution={5:5000}；每年固定 2/2/1。四組完整執行均完成，summary repeat / trace / batch order deep-equal。

### Source availability 與 selection

| Source class | Generated | Eligible | Admitted | Selected | Materialized | Availability share | Selection share | Exposure ratio |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| coachNetwork | 20,000 | 16,001 | 2,500 | 1,424 | 1,424 | 5.17% | 9.49% | 1.835 |
| explicitCampPlan | 3,750 | 3,750 | 3,750 | 1,250 | 1,250 | 1.21% | 8.33% | 6.874 |
| explicitReturnVisit | 10,000 | 7,500 | 0 | 0 | 0 | 2.42% | 0.00% | 0.000 |
| foundationFallback | 350,000 | 229,969 | 33,750 | 2,326 | 2,326 | 74.35% | 15.51% | 0.209 |
| schoolRelationship | 114,763 | 40,842 | 10,562 | 5,456 | 5,456 | 13.20% | 36.37% | 2.755 |
| sharedTrainingContext | 19,208 | 11,252 | 8,752 | 4,544 | 4,544 | 3.64% | 30.29% | 8.328 |

所有 selected 的 completed count 等於 materialized count。Unknown source、neutral exchange、ordinary optional development 在此 cohort 未產生；required development 是 5,000 場 mandatory，不納入 probability。

### Friendly / camp producer 明細

| Canonical family/reason | Generated | Eligible | Admitted | Selected | Materialized |
| --- | --- | --- | --- | --- | --- |
| friendly:coachConnectionToOpponentSchool | 18,750 | 14,751 | 1,250 | 174 | 174 |
| friendly:foundationFallback | 350,000 | 229,969 | 33,750 | 2,326 | 2,326 |
| friendly:priorAwayVisit | 9,608 | 0 | 0 | 0 | 0 |
| friendly:priorDevelopmentExchange | 30,000 | 19,314 | 0 | 0 | 0 |
| friendly:priorHomeVisit | 10,392 | 0 | 0 | 0 | 0 |
| friendly:returnVisitFromPriorAwayVisit | 4,804 | 3,603 | 0 | 0 | 0 |
| friendly:returnVisitFromPriorHomeVisit | 5,196 | 3,897 | 0 | 0 | 0 |
| friendly:sharedTrainingContact | 50,000 | 8,466 | 0 | 0 | 0 |
| trainingCamp:eligibleCoachNetwork | 1,250 | 1,250 | 1,250 | 1,250 | 1,250 |
| trainingCamp:eligibleExplicitPlan | 3,750 | 3,750 | 3,750 | 1,250 | 1,250 |
| trainingCamp:eligibleSchoolRelationship | 14,763 | 13,062 | 10,562 | 5,456 | 5,456 |
| trainingCamp:eligibleSharedTrainingContext | 19,208 | 11,252 | 8,752 | 4,544 | 4,544 |

### Weight 與可比情境

| Base weight | Admitted | Selected | Selected / admitted | Global optional share |
| --- | --- | --- | --- | --- |
| 1 | 33750 | 2326 | 6.89% | 15.51% |
| 2 | 21814 | 11424 | 52.37% | 76.16% |
| 3 | 3750 | 1250 | 33.33% | 8.33% |

Global weight 2 share 高於 weight 3，不能據此判定 3/2/1 失效；各 class 的 availability、type authority、pool size 不同。獨立 head-to-head 控制同 type / pool size / budget / year / phase：

| Pairwise | N | 較高 weight 勝出 | Share | 方向 |
| --- | --- | --- | --- | --- |
| 2vs1 | 5000 | 3337 | 66.74% | PASS |
| 3vs1 | 5000 | 3731 | 74.62% | PASS |
| 3vs2 | 5000 | 3013 | 60.26% | PASS |

三方 1/2/3 權重各選中 863 / 1,632 / 2,505。Equal four-position counts 為 1,266 / 1,226 / 1,188 / 1,320（23.76%–26.40%）；三組 ID prefix 的最大偏離為 1.40 個百分點。每 500 IDs 分 block，position share 範圍 19.60%–30.00%；未見固定 lexical winner 或明顯週期性支配。這些僅是有限樣本 sanity，不是 hash 隨機性的數學證明。

### Camp group bias

| Camp schools | Candidates | Group total weight | Group selected | Group share | Opponent selected counts |
| --- | --- | --- | --- | --- | --- |
| 2 | 1 | 3 | 2983 | 59.66% | 2983 |
| 3 | 2 | 3 | 3016 | 60.32% | 1505 / 1511 |
| 4 | 3 | 3 | 3000 | 60.00% | 1055 / 968 / 977 |

Max/min group-share ratio=1.0111；2→4 校並未線性增加 group 出現率。三校 camp 的兩個 opponents 幾乎各半；四校 camp 各 opponent 為 1,055 / 968 / 977，沒有 fixed ID-order winner。Same-semantic friendly 增加 source 的 5,000 組對照全部保持同一 probability result；admitted fallback-real duplicate=0。

### 年度、phase 與 pool

| Year | Completed matches | Optional selected | New opponent matches | Repeated opponent matches | Optional source mix |
| --- | --- | --- | --- | --- | --- |
| 1 | 10000 | 5000 | 9657 | 343 | coachNetwork: 1424; explicitCampPlan: 1250; foundationFallback: 2326 |
| 2 | 10000 | 10000 | 0 | 10000 | schoolRelationship: 5456; sharedTrainingContext: 4544 |
| 3 | 5000 | 0 | 4250 | 750 | mandatory only |

| Phase | Windows | Eligible optional | Selected optional |
| --- | --- | --- | --- |
| autumn-exhibition | 5000 | 75000 | 5000 |
| final-competition | 5000 | 0 | 0 |
| post-autumn-evaluation | 5000 | 75000 | 0 |
| year-two-autumn-evaluation | 5000 | 79657 | 5000 |
| year-two-spring-evaluation | 5000 | 79657 | 5000 |

| Year:phase:pool size | Windows |
| --- | --- |
| 1:autumn-exhibition:1 | 1250 |
| 1:autumn-exhibition:3 | 1250 |
| 1:autumn-exhibition:4+ | 2500 |
| 1:post-autumn-evaluation:0 | 5000 |
| 2:year-two-autumn-evaluation:1 | 343 |
| 2:year-two-autumn-evaluation:2 | 4657 |
| 2:year-two-spring-evaluation:1 | 343 |
| 2:year-two-spring-evaluation:2 | 4657 |
| 3:final-competition:0 | 5000 |

Empty mandatory windows=10,000；single-candidate=1,936（單獨列出，不作 calibration signal）；multi-candidate=13,064。每 window 可用 opponent 都為 7，但被既有 authority 接納的 pool 更小。

### Mode comparison

| Optional share | Enabled | Disabled | Delta pp |
| --- | --- | --- | --- |
| fallback | 15.51% | 8.33% | 7.17 |
| friendly | 16.67% | 16.67% | 0.00 |
| highAuthority | 8.33% | 8.33% | 0.00 |
| trainingCamp | 83.33% | 83.33% | 0.00 |

Enabled/disabled 各完成 25,000 matches、25,000 Opportunities；mandatory 各 10,000、optional 各 15,000。Type mix完全相同，因既有 type conflict先於 draw。Fallback 增加 7.17 個百分點，來自原 disabled stable source-order 優先選 coach source，而 enabled 依同 pool 中所有候選的相對權重抽選；不是 semantic duplicate。Enabled fallback 實際 2,326，admitted-context expected sum 為 2,333.33，沒有 fallback overuse 證據。

### Opponent 與 longitudinal exposure

每 career unique opponents mean=2.7814（min 2、max 3）；3 個對手 3,907 careers、2 個對手 1,093 careers。Repeated matches mean=2.2186、全 career match share=44.372%；平均 top-opponent share=54.276%、top-3 share=100%、HHI=0.44328。

Y1 new/repeat=9,657/343；Y2=0/10,000；Y3=4,250/750（相對所有之前年度）。Y2 同年第二場重複同一對手 2,671 次。相對「緊前一年」的 transition 則為 Y1→Y2 repeat 10,000；Y2→Y3 new 4,445 / repeat 555。兩種 repeat 分母不同，不應混用。

Y2 spring schoolRelationship/sharedTrainingContext=3,752/1,248；autumn=1,704/3,296。Completion 將來源轉為 sharedTrainingContext，但兩者 base weight 都是 2；不能把 class transition 直接說成權重越疊越高。此 cohort 沒有新增外部 Y2 plans/contacts，existing camp priority 使已完成比賽的對手持續可見；這是 conditional feedback / availability 訊號，不足以宣稱所有 live careers 必然壟斷。完整 transition counters 在 JSON。

### Integrity 與 regression

Mandatory profiles、budget breaches、selectedWithoutOpportunity、unselectedMaterialized、duplicate-window materialization、fallback semantic duplicates、friendly source-count inflation、orphan evidence、incomplete schedule、frequency violations、gameplay cursor mismatch 均為 0。每組 save/reload 100/100；declined/expired/cancelled 各 100/100，failure=0。

Foundation 26/26、production integration 17/17；selected regression 65/65、JS/CJS syntax 293/293、full regression 193/193（含既有 audit）。固定 fixture 後已重跑兩個受影響 calibration tests 及兩個 CJS syntax checks；其餘 production/tests 未改。1,400-game audit：Bench 1000/1000、Starter 400/400，orphan / noProgress / match-state / GameRecord issue 全 0；deterministic=true、instrumentationNeutral=true。

WARN：ZERO_EXPOSURE_WARN（returnVisit eligible 7,500、admitted 0、selected 0）；RELATIONSHIP_FEEDBACK_WARN（optional new 5,000、repeat 10,000）；CONTROLLED_SOURCE_AVAILABILITY（四個人工控制的 canonical world cohorts，非人口比例估計）。首次入學問題另列 initialSamplingBlocker，不混入正式 audit failure counters。

## Closeout（71 項）

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | 5b5367c；main/origin 0/0；初始乾淨 |
| 2 | Changed files | package.json + 5 audit/test files + 2 docs；production JS diff=0 |
| 3 | Audit architecture | 真實五場 career + source evolution；3 個 CJS 工具 |
| 4 | Sample size | 5,000 unique identities × 4 complete runs |
| 5 | Identity | audit-career-000001..005000；固定合法角色97001 |
| 6 | Probability version | high-school-opportunity-probability-v1 |
| 7 | Selection version | high-school-opportunity-selection-v1 |
| 8 | Source availability | 上方 Generated / Eligible / Admitted 分開列 |
| 9 | Source selection | Optional 15,000；selected/materialized/completed一對一 |
| 10 | Exposure ratio | Selection share / generation-eligible availability share；僅 diagnostic |
| 11 | Weight 3 | admitted 3750 / selected 1250 |
| 12 | Weight 2 | admitted 21814 / selected 11424 |
| 13 | Weight 1 | admitted 33750 / selected 2326 |
| 14 | 3 vs 2 | 3013/5000 = 60.26% |
| 15 | 3 vs 1 | 3731/5000 = 74.62% |
| 16 | 2 vs 1 | 3337/5000 = 66.74% |
| 17 | Equal fairness | 23.76%–26.40%；無 fixed winner |
| 18 | Pool distribution | 0/1/2/3/4+ 分 year/phase 表 |
| 19 | Single candidate | 1936，分開報告 |
| 20 | Multi candidate | 13064 |
| 21 | Friendly mix | coach 174 / fallback 2326；return/relationship未進draw |
| 22 | Camp mix | explicit1250 / coach1250 / relationship5456 / shared4544 |
| 23 | Type mix | optional friendly16.67%、camp83.33%；mandatory另計 |
| 24 | Y1 mix | optional5000 + required development5000 |
| 25 | Y2 mix | optional10000；camp all |
| 26 | Y3 mix | official5000；optional0 |
| 27 | Phase mix | 五個stable phase；不建real month |
| 28 | Frequency | 每career 2/2/1；mean=min=max=5 |
| 29 | Enabled vs disabled | count一致；fallback+7.17pp；type mix不變 |
| 30 | Fallback usage | 2326；expected2333.33，無overuse證據 |
| 31 | Fallback supersession | admitted real semantic duplicate0 |
| 32 | Friendly source inflation | 5000比較，inflation0 |
| 33 | Camp size bias | group shares59.66/60.32/60.00%；ratio1.0111 |
| 34 | Camp opponent distribution | 2/3/4校詳細counts上表 |
| 35 | Ordering bias | 四個sorted positions均有曝光 |
| 36 | Candidate ID bias | 三個prefix均衡sanity |
| 37 | Career ID bias | 10個500-ID blocks；無明顯週期winner |
| 38 | Diversity | unique mean2.7814，available7 |
| 39 | Repeat rate | 44.372% of all matches |
| 40 | New vs repeat | Y1 9657/343；Y2 0/10000；Y3 4250/750 |
| 41 | Feedback | Y2只有prior opponents；WARN |
| 42 | Rich-get-richer | source availability/type限制；未觀察count-weight加乘 |
| 43 | Source transitions | spring shared1248→autumn3296；JSON matrix |
| 44 | Mandatory bypass | 10000 retained，profiles0 |
| 45 | Budget | violations0 |
| 46 | Materialization | selectedWithoutOpportunity/unselectedMaterialized0 |
| 47 | Window consumption | duplicateWindowMaterialization0 |
| 48 | Decline | 100 samples/mode；fail0 |
| 49 | Expired | 100 samples/mode；fail0 |
| 50 | Cancelled | 100 samples/mode；fail0 |
| 51 | Save/reload | 100 samples/mode；mismatch0；formal serializer/admission |
| 52 | Determinism | 全部5000 repeat summary/digest相同 |
| 53 | Instrumentation | 全部5000 trace summary/digest相同；1400 audit true |
| 54 | Gameplay RNG | cursor mismatch0；same-seed GameRecord replay一致 |
| 55 | Ability neutrality | 固定能力；same-context metadata perturbation無draw差異 |
| 56 | Strength neutrality | 同context strength/standard metadata不改draw |
| 57 | Production changes | 0 behavioral change；只有package新增命令 |
| 58 | Probability changes | 0；3/2/1不動 |
| 59 | Warnings | return zero exposure、relationship feedback、conditional cohort |
| 60 | Failures | 正式5000 audit correctness0；首次入學限制另外保留 |
| 61 | Selected regression | 65/65 PASS |
| 62 | Syntax | 293/293 PASS |
| 63 | Full regression | 193/193 PASS |
| 64 | 1400 audit | 1000 bench +400 starter；四類issues0；deterministic/instrumentation true |
| 65 | Calibration status | WARN；Sprint PASS WITH WARNINGS |
| 66 | Tuning recommendation | 不調3/2/1；先釐清Y2來源與type authority限制 |
| 67 | Deferred factors | performance/reputation/recency/count/strength全部deferred |
| 68 | Next Sprint | Case D feasibility：relationship exposure damping；先確認上游admission/type policy |
| 69 | git diff --check | PASS，包含所有新增檔案 |
| 70 | git status | 1 modified +7 untracked；main/5b5367c；未commit/push |
| 71 | Stop Conditions | A–N未觸發；使用者確認的uniform fixture未修production契約 |

## 調參與下一步

先維持 3／2／1。Pairwise 方向、weight-normalized exposure、camp group normalization 都正常；調 weight 不會讓被 type/mandatory authority 擋住的 returnVisit 進入 draw。

依 Case D 的觀察，下一步優先評估 Relationship Exposure Damping 的可行性：先確定 Y2 全為既有對手是否符合 intended world-source / type policy，再設計新來源或阻尼；不先把合法回訪一律當 bug。若確認既有 admission/type preference 與產品意圖不符，才進 Case B 的 bias repair。現有結果不支持直接進 Case C 調常數，也不支持直接新增 reputation/recency/performance。上述均為建議，本次沒有開始下一 Sprint。

本輪不新增 performance、reputation、recency、relationship count multiplier、team strength、geography、dynamic budget、UI 或 narrative；沒有 commit、push、drop stash 或開始下一 Sprint。
