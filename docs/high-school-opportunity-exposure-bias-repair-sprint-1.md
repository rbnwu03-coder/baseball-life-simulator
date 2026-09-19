# High School Opportunity Exposure Bias Repair — Sprint 1

最終狀態：**PASS WITH WARNINGS**。所有 correctness gates 通過；僅保留 controlled-cohort interpretation warning。沒有 commit、push 或下一 Sprint 變更。

## Baseline 與施工順序

開始時 `main` / `origin/main` / HEAD 為 `e91fc49`，ahead/behind 0/0，working tree clean。原 calibration JSON 保持原樣。先閱讀 producer / generation / selection 契約，保存四個原政策完整生涯的 flow，再新增 regression：原 v1 在 `unreachable incomingFriendlyInvitation` 失敗，之後才做最小 production repair。

原 5,000-career checkpoint 已逐筆核對，careerDigest 與已提交 calibration 相同：`bb95f8609d5d127bd4ecbffa2a98b67bf561a59db11fbd430602a4d43e0404a2`。IDs 為 audit-career-000001 至 audit-career-005000。排除新增的 audit-only 呼叫後，career fixture 程式與 baseline 逐字一致：97001 actor fixture、四 cohorts、入學 seed、第一場 gameplay seed hook、五場 lifecycle 都未更換。

## 第一個結構性流失點

完整 baseline checkpoint 證據見 `high-school-opportunity-exposure-bias-repair-before.json`；四個原政策完整 trace 見 `high-school-opportunity-exposure-bias-repair-baseline-samples.json`。

- returnVisit generated 10,000、generator-eligible 7,500、probability reachable 0、selected 0。其中 5,000 個合法 Y2 friendly 在 `typeConflict` 被排除；另外 2,500 個為 Y1 followup mandatory 阻擋，應保留。
- Y2 new-opponent generated 103,358、eligible 101,372、reachable 0、selected 0。所有 eligible new-opponent 候選均被 `typeConflict` 擋下。不是 school pool 沒有新對手，也不是 producer 完全沒有產生路徑。
- friendly generated 478,750、eligible 280,000、reachable 35,000、selected 2,500；其中 eligible typeConflict 175,000。
- camp generated 38,971、eligible 29,314、reachable 24,314、selected 12,500。Optional selected 15,000，因此 camp 83.3333%。Camp 存在的視窗，所有 friendly 在抽選之前即被排除，權重不能挽救不可達候選。
- baseline compact checkpoint 沒有保留所有 upstream exclusion reasons，不能從中捏造 208,407 個 upstreamExcluded 的更細分類；完整 reason 在四個 pre-repair trace 可查。本次新增的完整 re-audit 則保留每一筆 upstream 與 first-loss。

## Canonical semantics 與分類

ReturnVisit 最終分類：**A — BUG，canonical returnVisit-backed friendly should reach probability pool**。這不表示獨立新增 return-visit opportunity type。既有 [Friendly contract](friendly-invitation-return-visit-producer-sprint-1.md) 第 38–56 行已定義同 type/opponent/sequence 的來源優先序 `returnVisitProducer > coachNetworkProducer > schoolRelationshipProducer > foundationFallback`。原 7,500 是 generator 的 canonical candidate eligibility，不是未去重 source count；因此不能將 0 reachable 全部判作 provenance-only instrumentation false positive。Source precedence 正確，錯在其勝出的合法 friendly 隨後受到非必要 type 排除。

Camp 83.33% 分類：**B — conflict-policy-driven** 是直接排除機制；availability / relationship feedback 決定哪些視窗有 camp。不是 group-size weight multiplication：既有 group normalization 將同 camp source 的 aggregate weight 固定於最高 baseWeight，再分攤至 admitted opponents。

Y2 100% repeat 分類：**E — mixed（C conflict bias + D relationship feedback）**。完成舊對手賽事形成真實 relationship/camp sources；camp type priority 又使合法 new-opponent fallback 無法競爭。移除這層 filter 後保留真實 feedback 與 3/2/1 authority，不加 novelty bonus 或 repeat penalty。

## 最小修復及邊界

唯一 production 檔案為 `high-school-opportunity-selection.js`：selection policy 升至 `high-school-opportunity-selection-v2`，移除 deferred optional pool 的 `typeConflict` 排除。保留 legality、mandatory、existing history、semantic dedup、budget 0/1、materializer preflight。Probability module / hash / seeded draw / weights / version v1 均未修改。

Window 仍為 policy/career/year/phase/sequence/player-school tuple；Y1=2、Y2=2、Y3=1。合法候選先共同進 pool，再 draw 至多一個，沒有新增 slot。v2 policy 在既有 window identity 中，故同 career 的抽選輸入會按版本改變；這是明示 policy migration，並非更改 probability seed 演算法。既有 materialized Opportunity 的 provenance 不會被改寫。

Disabled path 保留 deterministic stable selection；其 `profiles/admitted` 是舊 calibration 的 counterfactual pool 診斷，不表示真的執行 weighted draw。新 flow 的 `reachable` 以實際 probability weights 為準。Enabled 才是 production 預設路徑。

不同 camp source 的 campId / participant / host identity 保留；不同 match intents 不合併。依既有 [Camp contract](high-school-training-camp-producer-sprint-1.md) 第 55–59 行，同 opponent/sequence 的多 camp match-source 仍是同一可執行 match 的競爭來源，由 precedence canonicalize，source facts 不刪除。本輪沒有將每個不同 source ref 重新定義成額外 lifecycle intent。

## Flow trace contract

Audit-only `tests/high-school-opportunity-exposure-flow.cjs`，version `exposure-bias-repair-audit-v1`：Producer Output → Generated → Eligibility → Semantic Dedup → Conflict → Existing Opportunity → Budget → Probability Pool → Draw → Materialization。

每筆保留 candidate/source/producer/opponent/year/phase/sequence/window、camp ref、return evidence refs、semantic key、各階段狀態、全部原始 reasons 與唯一 firstLossStage/rejectionReason/code。`generatorEligible` 保留 production 原值。Generator 本來在一次函式中包含 dedup 與 schedule 檢查，因此圖為**邏輯 first-loss projection**，不是宣稱 production 有十個獨立依序函式；postEligibility 與原 generatorEligible 不混用。第一次拒絕之後皆 notReached，draw losers 記 notSelected。Mandatory 明示 bypass。

每個語意群記錄 before/after、winner/loser IDs、理由及來源 precedence。Producer count 獨立計 friendly source、camp source、camp match source，不能以 candidate count 冒充 source count。Aggregation 按 source class、type、year、new/repeat 分類，另有 return/camp/friendly/Y2 new/repeat diagnostics。完整 checkpoint 使用 SHA-256 reference witnesses 控制輸出大小，raw trace API 與四個 baseline samples 保留原 IDs。

## Tests 與驗證進度

- 新 foundation：24/24 PASS；先在原 v1 重現 regression。
- 新 production integration：26/26 PASS，真實五場生涯、producer evidence、save/load、三種反悔狀態、GameRecord、authority neutrality、group normalization。
- Probability：41/41 foundation、37/37 integration PASS。
- Calibration：26/26 foundation、17/17 integration PASS。
- Selected regression：67/67 files PASS。
- Full syntax：296/296 PASS；最後新增 foundation assertions 的檔案也已重檢通過。
- Full regression：195/195 files PASS。
- 1,400-game audit：bench 1000、starter 400 完成；orphan / noProgress / match-state / GameRecord issues 全部 0，deterministic / instrumentationNeutral 均 true。
- 四組各 5,000 careers 完成：enabled、reverse-order repeat、trace order、disabled；同一精確 ID set。共 100,000 場 career games。Repeat / trace summary（含 GameRecord fingerprints）完全一致。
- 全 15,000 optional windows 額外核對：legalOptionalUnreachable=0、campGroupWeightViolations=0、first-loss conservation=true。

既有測試更新僅處理舊 type domination expectation、return reachable=0 expectation，以及新版不保證抽到 camp 的 route fixture。Camp route 改用正式 explicit plan 與既有 includeFoundationFallback=false API，仍走正式 materialize / accept / schedule / launch / completion；5000-career fixture 未改。

## Before / After 與 74 項 closeout

| Metric | Before | After | Delta | Interpretation |
|---|---:|---:|---:|---|
| campSelectedShare | 83.3333% | 14.7867% | -68.5467 pp | Camp 不再先排除 friendly；沒有設定曝光目標。 |
| friendlySelectedShare | 16.6667% | 85.2133% | +68.5467 pp | 同一 15,000 optional slots，friendly 得到合法競爭機會。 |
| returnVisitEligible | 7500 | 17801 | +10301 | 後續來源隨真實 match completion 改變，fixture 未改。 |
| returnVisitReachable | 0 | 13156 | +13156 | Canonical return-friendly 可達；mandatory 阻擋仍保留。 |
| returnVisitSelected | 0 | 1684 | +1684 | 是既有 friendly opportunity，不增加獨立 return type。 |
| y2NewOpponentShare | 0.0000% | 45.3100% | +45.3100 pp | 既有合法 fallback 開放競爭，沒有新對手加權。 |
| y2RepeatOpponentShare | 100.0000% | 54.6900% | -45.3100 pp | 保留真實 relationship feedback，不加 repeat penalty。 |
| fallbackUsage | 15.5067% | 57.1867% | +41.6800 pp | 權重仍為 1；實際 8,578 接近期望 8,538.21。 |
| multiCandidateWindows | 13064 | 15000 | +1936 | 全部 optional windows 現有多個可抽候選；mandatory 不抽。 |

### 74 項 closeout

| # | Item | Result |
|---:|---|---|
| 1 | Baseline | e91fc49；main/origin/main 0/0；初始 clean。 |
| 2 | Changed files | 17 檔，詳見下方清單及 validation.changedFiles。 |
| 3 | Existing audit warnings | Camp 83.3333%、returnVisit eligible 7500/reachable 0、Y2 repeat 100%。 |
| 4 | Candidate flow architecture | 既有 producer→generation→selection→probability→materialization；新增 audit-only projection。 |
| 5 | Flow trace contract | 10 stages，raw refs / semantic groups / original reasons / unique first loss。 |
| 6 | First-loss attribution | after: {"notSelected":222720,"scheduleConflict":160234,"sourceSuperseded":149576}；總數等於 generated−selected。 |
| 7 | ReturnVisit producer semantics | 反向訪問來源，canonical evidence parent chain；不是自動接受或額外賽事。 |
| 8 | ReturnVisit candidate semantics | 同 friendly type/opponent/slot；return 來源優先。 |
| 9 | ReturnVisit eligibility | 17801 observed generator-eligible。 |
| 10 | ReturnVisit dedup stage | 29784 postDedup（schedule legality 尚在後階段）。 |
| 11 | ReturnVisit conflict stage | 13156 postConflict。 |
| 12 | ReturnVisit probability reachability | 13156 reachable，1684 selected。 |
| 13 | ReturnVisit final classification | A — canonical friendly candidate 的 typeConflict 是 BUG；未新增 return type。 |
| 14 | Camp source count | 45454 camp sources；47954 match sources。 |
| 15 | Camp candidate count | 47954 |
| 16 | Camp dedup survival | 47954 |
| 17 | Camp conflict survival | 27720 |
| 18 | Camp probability reachability | 27720 |
| 19 | Camp selected exposure | 2218/15000 = 14.7867%。 |
| 20 | Camp 83.33% decomposition | B conflict-policy-driven；availability 產生 camp 視窗，type filter 壓掉 friendly；加權只處理倖存者。 |
| 21 | Camp group-size bias | 全部生涯 group total violations=0；2/3/4-school synthetic inflation ratio=1.011063。 |
| 22 | Friendly source count | 149576 canonical producer source facts；fallback 為既有 generator authority，另計。 |
| 23 | Friendly candidate count | 499576 |
| 24 | Friendly dedup | 350000 |
| 25 | Friendly conflict survival | 210000 |
| 26 | Friendly probability reachability | 210000 |
| 27 | Type priority review | Enabled optional pool 移除非 legality absolute type domination；disabled stable route 保留。 |
| 28 | Selection window granularity | year/phase/sequence 既有 slot；沒有展開頻率。 |
| 29 | Budget placement review | 所有合法 alternative 先進 pool，再 draw 至多 1。 |
| 30 | Probability pool construction | first legal / canonical / unconsumed pool；沒有 lexical take(1)。 |
| 31 | Same-opponent rule | 相同 friendly semantic source 去重；不同 type/direction 的合法 alternatives 可參與，但只 materialize 一個。 |
| 32 | Multi-source dedup | Friendly precedence、Camp scoped source grouping / match-alias 去重未改；friendly inflation=0。 |
| 33 | Y2 opponent pool | 每窗 7 個 canonical opponents；原始存在合法新對手 fallback。 |
| 34 | Y2 new opponent generation | 103733 |
| 35 | Y2 new opponent reachability | 98970 reachable；4531 selected。 |
| 36 | Y2 repeat opponent generation | 129886 |
| 37 | Y2 repeat opponent reachability | 63750 reachable；5469 selected。 |
| 38 | Relationship feedback decomposition | 真實 completed match→relationship/camp source→canonical candidate→authority weights；原 type filter 使該 feedback 成為排他優勢。 |
| 39 | Rich-get-richer classification | E mixed；移除排他性 filter，保留合法 feedback，不做 damping。 |
| 40 | Production logic changes | 只修改 selection 檔三處：version、錯誤訊息版本文字、移除 deferred pool typeConflict。 |
| 41 | Selection policy version | high-school-opportunity-selection-v2；window namespace 明示升版。 |
| 42 | Probability version | high-school-opportunity-probability-v1。 |
| 43 | Weight constants | 3/2/1 unchanged；probability module diff=0。 |
| 44 | Mandatory neutrality | 10,000 mandatory selected，profiles=0；Y1 protected development/Y3 official 不抽選。 |
| 45 | Budget neutrality | 0/1 unchanged；budgetViolation=0。 |
| 46 | Match frequency neutrality | 每 career Y1=2、Y2=2、Y3=1；frequencyViolation=0。 |
| 47 | Anti-reroll | 每模式 decline/expire/cancel 各 100 samples；failures=0。 |
| 48 | Save/load | 每模式 100 實際 reload samples；mismatch=0。 |
| 49 | Determinism | 5000 IDs reverse-order replay exact summary equality=true。 |
| 50 | Instrumentation neutrality | 5000 IDs trace order equality=true；match RNG mismatch=0。 |
| 51 | Before calibration metrics | 原 committed calibration 保留；checkpoint digest 相同，before.json 詳列。 |
| 52 | After repair metrics | validation.json 為完成的 full re-audit，非小樣本估計。 |
| 53 | Before/after delta table | 見上表；同 5000 IDs、fixture、cohorts。 |
| 54 | ReturnVisit before/after | eligible 7500→17801；reachable 0→13156；selected 0→1684。 |
| 55 | Camp before/after | 12500→2218 optional selections；83.3333%→14.7867%。 |
| 56 | Y2 diversity before/after | new 0→4531；repeat 10000→5469。 |
| 57 | 5000-career re-audit | 四組各 5000 exact IDs；所有 checkpoint identity sets 已逐筆核對。 |
| 58 | Calibration warnings remaining | 只有 CONTROLLED_SOURCE_AVAILABILITY；不是 correctness failure。 |
| 59 | GameRecord neutrality | Production module/schema 未改；1400-game integrity=0，trace/replay record fingerprints 相同。不同對手產生不同實際比分是正常結果。 |
| 60 | CompetitionEvidence neutrality | Production code 未改；evidenceOrphans=0，相關正式回歸 PASS。 |
| 61 | Representative selection neutrality | Production code 未改；county/national/U18/team strength/roster 回歸 PASS。 |
| 62 | Ground-ball blocker | 相關 selected regression PASS；1400-game settlement integrity PASS。 |
| 63 | Selected regression | 67/67 files PASS。 |
| 64 | Syntax | 296/296 JS/CJS PASS；最後 foundation 檔重檢 PASS。 |
| 65 | Full regression | 195/195 files PASS，0 FAIL。 |
| 66 | 1400 audit | Bench1000+starter400；四種 integrity failure 全 0；determinism/trace true。 |
| 67 | Status | PASS WITH WARNINGS。 |
| 68 | Remaining structural gaps | 本批 15000 optional windows 無合法候選不可達。未重新定義既有 camp 同 opponent/slot match-alias 契約。 |
| 69 | Deferred source coverage | 本批無需 DEFERRED_SOURCE_COVERAGE；world pool 的新 opponent 已有 canonical fallback。Live-world source breadth 留待另案。 |
| 70 | Deferred weight calibration | 不調權重，沒有 target exposure；controlled fixture 分布不推論真實玩家人口。 |
| 71 | Next Sprint recommendation | Case A：Probability Calibration Sprint 2；僅建議，未開始。 |
| 72 | git diff --check | PASS：tracked diff + 全部 10 個新增檔案；詳見 validation.finalWorkspaceChecks。 |
| 73 | git status | main HEAD=e91fc49，未提交 working tree 7 modified / 10 untracked；no commit/no push/no stash drop。 |
| 74 | Stop Conditions | A–P 均未觸發；測試開發期的 assertion/fixture 調整發生於 full regression 前。 |

### Changed files

- `high-school-opportunity-selection.js`
- `tests/high-school-opportunity-probability-calibration-audit.cjs`
- `tests/high-school-opportunity-probability-calibration-career.cjs`
- `tests/high-school-opportunity-probability-calibration-foundation-test.js`
- `tests/high-school-opportunity-probability-calibration-runner.cjs`
- `tests/high-school-opportunity-probability-foundation-test.js`
- `tests/high-school-opportunity-probability-production-integration-test.js`
- `docs/high-school-opportunity-exposure-bias-repair-baseline-samples.json`
- `docs/high-school-opportunity-exposure-bias-repair-before.json`
- `docs/high-school-opportunity-exposure-bias-repair-full.json`
- `docs/high-school-opportunity-exposure-bias-repair-selected.json`
- `docs/high-school-opportunity-exposure-bias-repair-sprint-1.md`
- `docs/high-school-opportunity-exposure-bias-repair-syntax.json`
- `docs/high-school-opportunity-exposure-bias-repair-validation.json`
- `tests/high-school-opportunity-exposure-bias-repair-foundation-test.js`
- `tests/high-school-opportunity-exposure-bias-repair-production-integration-test.js`
- `tests/high-school-opportunity-exposure-flow.cjs`

完整數據與驗證：[validation JSON](high-school-opportunity-exposure-bias-repair-validation.json)、[selected](high-school-opportunity-exposure-bias-repair-selected.json)、[syntax](high-school-opportunity-exposure-bias-repair-syntax.json)、[full regression / 1400 audit](high-school-opportunity-exposure-bias-repair-full.json)。
