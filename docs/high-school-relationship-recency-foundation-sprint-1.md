# Relationship Recency Foundation — Sprint 1

Baseline：`main` / HEAD / `origin/main` = `1bde29b` (`feat: establish relationship temporal authority`)，起始clean、ahead/behind 0/0。兩份stash保留。正式驗證：[validation JSON](high-school-relationship-recency-foundation-validation.json)。最終狀態見末節。

本輪新增episodic categorical recency及引用資訊；**沒有機率、權重、precedence、legality、expiry或保存格式變更**。Recency只回答「已有證據相對目前語義位置有多舊」，不回答「應有多大選中機會」。

## Contract, ownership and API

新增 [high-school-relationship-recency.js](../high-school-relationship-recency.js)，browser global `HighSchoolRelationshipRecency`，CommonJS exports相同。Model version=`high-school-relationship-recency-v1`；依賴且明確version-gate `high-school-relationship-temporal-authority-v1`。不相容dependency在載入或query時明確拒絕；帶入不同version的temporal position也拒絕，不默默重解。

Dependency單向：Recency → Temporal Authority / Exchange Network。沒有producer/probability回頭import Recency；index在Temporal之後新增一行script import。Producer輸出原封不動；Recency summary是呼叫端可選的獨立derived值，沒有塞進canonical serialized source/candidate。

| API | Canonical inputs | Output |
| --- | --- | --- |
| classifyRelationshipRecency | ledger、evidenceId、current position | 單一ref的recency summary；durable仍明確不適用 |
| resolveLatestEpisodicRelationshipEvidence | ledger、source.evidenceRefs、current position | normalized refs、eligible/excluded、exclusion reasons、Temporal latest/tie、必要temporal summary欄位、canonical evidence ages |
| buildRelationshipRecencySummary | 同上 | version/dependency version/scope/status/applicability/age/category/position/refs/reasons/confidence |

只接受canonical ledger中可解析的refs，不接受任意age-only物件。所有ledger先沿用Network.normalizeState驗證，包括return parent。source上手工附帶的age/recency不能覆蓋重新推導結果。current year/phase/sequence由Temporal Authority驗證；不重寫phase order、comparator、lifetime、age class或latest resolver。

Resolver先透過Temporal lifetime classifier取EPISODIC subset，再使用Temporal latest resolver與source summary；未複製八種類型清單作第二份lifetime authority。所有原supporting refs保留；excluded IDs及`DURABLE_RECORDED_CONTACT_NOT_EPISODIC`原因可檢查。

## Temporal → recency matrix

| Temporal age | Recency | Applicability / status | Reason |
| --- | --- | --- | --- |
| CURRENT_WINDOW | CURRENT | APPLICABLE / CLASSIFIED | exact已知year/phase/sequence相等 |
| SAME_PHASE_EARLIER | RECENT | APPLICABLE / CLASSIFIED | 同phase較早sequence；沒有額外數值ranking |
| SAME_YEAR_EARLIER | RECENT | APPLICABLE / CLASSIFIED | 同年較早已知phase；不劣化為OLD |
| PREVIOUS_YEAR | PRIOR_YEAR | APPLICABLE / CLASSIFIED | 相差一年；跨年不需知道phase順序 |
| OLDER_THAN_ONE_YEAR | OLD | APPLICABLE / CLASSIFIED | 相差超過一年；不表示失效或較低source authority |
| UNKNOWN | UNKNOWN | UNKNOWN / UNKNOWN | 有episodic證據，但無法確定所需chronology |
| FUTURE | NOT_APPLICABLE | NOT_APPLICABLE / FUTURE_EVIDENCE | 明確invalid observation，保留futureEvidenceIds，不當成CURRENT或合法recency |
| 無eligible refs | NOT_APPLICABLE | NOT_APPLICABLE | 區分DURABLE_ONLY與NO_RELATIONSHIP_EVIDENCE，不是OLD或UNKNOWN relationship |

v1沒有numeric score、continuous distance、decay或strength。SAME_PHASE_EARLIER與SAME_YEAR_EARLIER都RECENT，原temporalAgeClass仍保留，沒有暗藏強弱順序。

### Unknown phase and coarse cross-year resolution

同年unknown phase：UNKNOWN，不比較ID、array order或跨phase sequence。UNKNOWN表示證據存在而時間關係不可判，不是沒有證據。

Temporal latest resolver可能因unknown phase無法返回exact latest，即使已知year。Recency消費Temporal summary的`evidenceYearRange.latest`及Temporal對每筆evidence的age分類：若最新年份所有候選都為PREVIOUS_YEAR或OLDER_THAN_ONE_YEAR，就能給PRIOR_YEAR/OLD。此時`latestTemporalPosition=null`、`latestEvidenceIds=[]`，另列`unresolvedLatestEvidenceIds`及reason=`YEAR_ONLY_CATEGORY_EXACT_LATEST_UNRESOLVED`。這不是重作phase排序或選一筆任意tie；只使用已成立的粗粒度年份authority。

Known FUTURE只要出現在任一eligible episodic ref，summary即FUTURE_EVIDENCE，不能因其他unknown或較舊ref掩蓋。Durable不進episodic age檢查，無論recordedAt多新都不變成episodic freshness。

## Evidence matrix

| Evidence | Lifetime | Eligible? | Temporal source | Special handling |
| --- | --- | --- | --- | --- |
| schoolExchangeMatch | EPISODIC | yes | completed schedule match position | 可與visit/return同一時點，不累加freshness |
| homeVisit | EPISODIC | yes | completed hosted match | 與return的parent position一致 |
| awayVisit | EPISODIC | yes | completed visiting match | 同上 |
| returnVisitEligible | EPISODIC | yes | canonical parent visit | 沿用Temporal parent verification；非source/candidate生成year |
| sharedTrainingContext | EPISODIC | yes | completed camp match | 非camp plan year；可混合多refs |
| competitionEncounter | EPISODIC | yes | completed official match | recency不授權friendly/camp source；production exclusion保持 |
| developmentExchange | EPISODIC | yes | completed development match | 不轉換成achievement、prestige或reputation |
| coachSchoolConnection | DURABLE | no | recorded contact（不拿來算recency） | NOT_APPLICABLE / DURABLE_ONLY，保留excluded ref及reason |

Mixed來源即使最新一筆是Y2/Y3 coach record，也只使用episodic部分。Y1 exchange + Y2 camp + 更新coach → camp決定recency；coach只在exclusions。所有latest same-position IDs保留；stable ID只排序輸出，不被說成較新。

Exchange/home/return三筆同一completed match會有三個supporting/tie refs，但映射同一category；不產生三層freshness。本模型不輸出contactCount、engagementCount或relationshipStrength，也不把Temporal的event count帶進recency policy。

## Source matrix and provenance

| Source | Episodic refs / applicability | Special rule | Behavior impact |
| --- | --- | --- | --- |
| returnVisit | 有，APPLICABLE（或時間unknown/future） | 追parent visit，不用producer當年year | 0；不影響explicitReturnVisit precedence/weight |
| coachNetwork | 通常durable-only，NOT_APPLICABLE | 不能把recordedAt當inception/last contact | 0；coach來源仍依原契約合法 |
| schoolRelationship | 有episodic refs，正常分類 | latest/tie依Temporal；不以count算強度 | 0 |
| trainingCamp | merged refs，先排durable再分類 | participant set、semanticCampKey、group weight原樣 | 0 |
| explicitCampPlan無refs | NO_RELATIONSHIP_EVIDENCE / NOT_APPLICABLE | reason=PLAN_WITHOUT_RELATIONSHIP_EVIDENCE；plan current不等於relationship CURRENT | 0 |
| explicitCampPlan有refs | 只分類其relationship subset | plan authority與relationship recency是分開維度 | 0 |
| fallback／一般無refs | NO_RELATIONSHIP_EVIDENCE / NOT_APPLICABLE | 不給OLD，不視為低價值 | 0 |

Output provenance包含model version、temporalAuthorityVersion、scope、全部supportingEvidenceIds、eligibleEvidenceIds、excludedEvidenceIds、每筆exclusion reason、latest tie refs、temporalAgeClass、recencyClass、latest position與confidence。未複製evidence物件、ledger、source計算表或parent payload。Source與其authority仍由呼叫端原物件持有，summary不宣稱新的admission權限。

OLD evidence不expire、不delete、不demote，也不改source validity。即使future/unknown是診斷結果，本輪也沒有把結果接到任何candidate filtering路徑。

## Neutrality, persistence and actual audit scope

新API唯讀，沒有RNG；deep-frozen foundation inputs及integration的before/after完整JSON驗證mutation neutrality。沒有保存recency score/bucket/lastCalculatedRecency，save schema與version不變。Old valid save包含unknown phase仍可normalize/load；query可UNKNOWN，但不能因recency不明拒絕save。

代表性合法career用相同namespace/identity比較plain與recency-observed路徑：4組配對，每arm20場，Y1/Y2/Y3每career=2/2/1。Observer查詢後完整input與selection result保持byte-equivalent JSON；逐筆candidate array/IDs/order/source type、profiles/weights、draw namespace/identity/result、opportunities、schedule entries、GameRecord與canonical competition state都相同。40筆真實CompetitionEvidence另在正式Y3 registered competition fixture驗證不變。

70次getInput observer calls涵蓋重複materialization/query。**來源class counters與known-lifecycle gates限定具有明確probability execution options的輸入**，不把隱含default context或歷史診斷query混進曝光分布。470次source observations是query次數，不是470個獨立career、opportunity或接觸；同一來源可重複出現在query中。

| 實際execution source observations | Count |
| --- | --- |
| NOT_APPLICABLE | 56 |
| RECENT | 90 |
| PRIOR_YEAR | 249 |
| OLD | 75 |
| CURRENT | 0 |
| UNKNOWN / FUTURE / durable leakage | 0 / 0 / 0 |
| mixed lifetime observations | 12 |
| latest tie observations | 0 |
| explicit no-ref plans | 4 |

另有57筆controlled legal samples：逐筆實際evidence、同一real Y1 evidence的五個semantic viewpoints、真實merged camp source及same-match tie診斷。不是player population或exposure calibration。

| Controlled class | Count |
| --- | --- |
| CURRENT | 5 |
| RECENT | 2 |
| PRIOR_YEAR | 25 |
| OLD | 23 |
| NOT_APPLICABLE | 2 |
| UNKNOWN / FUTURE / durable leakage | 0 / 0 / 0 |
| latest tie / mixed lifetime samples | 1 / 1 |

單筆evidence分類共55筆：awayVisit13、coachSchoolConnection2、returnVisitEligible12、schoolExchangeMatch12、developmentExchange5、competitionEncounter4、sharedTrainingContext3、homeVisit4；另2筆source aggregation沒有單一evidenceType，合計57。這些sample可重複觀察同一evidence，不是55個獨立世界事件。

開發中的附加competition檢查最初誤把賽後`critical_public_attention`當成已知match phase，預期RECENT但得到UNKNOWN。定位確認該phase不在canonical五個slots：保留預期UNKNOWN，另以明確已知final-competition context驗RECENT和producer不授權。**單獨記錄diagnostic UNKNOWN=1**，與known-lifecycle UNKNOWN=0分開；不擴張phase authority、不抑制未知結果、不觸發Stop P的「unexplained known lifecycle」條件。

同一real Y1 event分類演進已驗：CURRENT → RECENT（同phase較後sequence）→ RECENT（同年較後phase）→ PRIOR_YEAR（Y2）→ OLD（Y3）。Future synthetic fixtures在foundation明確產生FUTURE_EVIDENCE，與production legal FUTURE=0分開，不將負向測試算production failure。

## Risks and future consumer boundary

| Risk | Scenario | Boundary / future requirement |
| --- | --- | --- |
| rich-get-richer | 選中產生新evidence，再因recent更易選中 | 本版無numeric effect；若未來實驗，測reachability-adjusted repeat而非只看次數 |
| new-opponent starvation | 無歷史來源被錯判OLD而降權 | NO_EVIDENCE不是OLD；future需独立no-history policy |
| camp skew | camp合併多refs，新資料較易成latest | 不以ref count放大，不動group總weight |
| friendly skew | 同一match有exchange/visit/return三筆 | tie refs保留但category只一個 |
| unknown-phase bias | unknown被當最舊或任意排序 | 同年UNKNOWN；跨年只取可信coarse category |
| durable misclassification | 新coach record蓋過實際exchange | 先用canonical lifetime排除durable |
| future-evidence bug | future被夾成CURRENT | FUTURE_EVIDENCE+refs；legal execution gate=0 |
| save-state duplication | cache bucket與ledger分歧 | 不persist recency；每次由canonical facts重建 |
| probability coupling | descriptor進入ID/namespace/weights | 本輪probability完全不consume Recency；將來另案feasibility |
| source precedence collision | 舊explicit return被recent fallback取代 | precedence untouched，recency不提供authority override |

下一步若研究probability，也只能先做 **Relationship Recency Probability Feasibility Audit**，評估價值、unknown/no-history處理、group invariants及feedback。Recency READY不代表需要調3/2/1，也不代表continuous decay成立。

## 75-item closeout

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | main/HEAD/origin=1bde29b，起始clean、0/0，stash保留。 |
| 2 | Changed files | 新module、兩個test、新MD/JSON及index import，共6檔。 |
| 3 | Production diff | 新recency API＋一行import；其餘production內容不變。 |
| 4 | Recency version | high-school-relationship-recency-v1。 |
| 5 | Temporal version | high-school-relationship-temporal-authority-v1；明確version gate。 |
| 6 | Scope | EPISODIC_RELATIONSHIP_EVIDENCE，descriptive only。 |
| 7 | Included evidence | 七種episodic，見evidence matrix。 |
| 8 | Excluded evidence | coachSchoolConnection DURABLE，保留excluded refs/reason。 |
| 9 | Mapping | 五個時間類別映CURRENT/RECENT/PRIOR_YEAR/OLD；UNKNOWN及FUTURE分開。 |
| 10 | CURRENT | 相同known semantic window。 |
| 11 | RECENT | 同phase earlier或same-year earlier，不做數值排名。 |
| 12 | PRIOR_YEAR | 前一年，unknown phase亦可有年級authority。 |
| 13 | OLD | 超過一年；不失效、不降級。 |
| 14 | UNKNOWN | 有episodic refs但無法判所需chronology；非NO_EVIDENCE。 |
| 15 | FUTURE | explicit invalid status及future refs；不CURRENT。 |
| 16 | NO_EVIDENCE | NO_RELATIONSHIP_EVIDENCE / NOT_APPLICABLE；不OLD。 |
| 17 | NOT_APPLICABLE | durable-only或no-ref；future invalid也不適用但status不同。 |
| 18 | Episodic resolver | lifetime篩選後沿用Temporal latest/tie；不重做phase order。 |
| 19 | Durable exclusion | classifier唯一owner為Temporal；不用coach recordedAt算freshness。 |
| 20 | Mixed evidence | 只從episodic求latest；真實camp merged refs已驗。 |
| 21 | Return handling | parent temporal authority；不讀producer當年year。 |
| 22 | Shared training | completed camp match position。 |
| 23 | Competition encounter | 可分類，不授權friendly/camp；production exclusion不變。 |
| 24 | Development exchange | episodic descriptive；非achievement/reputation。 |
| 25 | Ties | 保留所有latest same-position refs；不ID挑新。 |
| 26 | Multiplicity | 同場三筆同category，不放大freshness或輸出strength。 |
| 27 | Summary | version/status/applicability/category/position/refs/reasons/confidence。 |
| 28 | Friendly | source/precedence/ID/order/weight不变。 |
| 29 | Camp | merged refs可分類；group/participants/semanticCampKey不变。 |
| 30 | Explicit plan | 無refs不適用；有refs只分類relationship部分。 |
| 31 | Provenance | model/dependency versions、eligible/excluded/latest refs與reason；無ledger copy。 |
| 32 | Mutation | frozen inputs、before/after input與final player domain facts比對。 |
| 33 | RNG | throw-on-RNG測試；game cursor不變。 |
| 34 | Determinism | permutation/replay/ties與兩arm完整career相同。 |
| 35 | Save schema | 0 change、無version bump、無persisted recency。 |
| 36 | Old save | unknown phase正常normalize，新query可UNKNOWN。 |
| 37 | Save/load | 真實Y2/Y3與JSON restore得到相同descriptor。 |
| 38 | Cross-year evolution | Y1 evidence在Y2 PRIOR_YEAR，Y3 OLD。 |
| 39 | Same-year evolution | CURRENT到RECENT，不變OLD。 |
| 40 | Candidate identity | 完整candidate arrays比對相同。 |
| 41 | Candidate order | 相同，無metadata進排序或ID。 |
| 42 | Selection profile | profiles與weights相同。 |
| 43 | Draw identity | draw namespace/refs相同。 |
| 44 | Draw result | probability result完整相同。 |
| 45 | Opportunities | selected/materialized objects相同。 |
| 46 | Schedule entries | 完整entry與final schedule相同。 |
| 47 | Selection version | high-school-opportunity-selection-v2。 |
| 48 | Probability version | high-school-opportunity-probability-v1。 |
| 49 | Weights | 3/2/1 unchanged。 |
| 50 | Anti-reroll | declined/expired/cancelled、reload、repeat materialization全部neutral。 |
| 51 | Y1 | 每career 2場。 |
| 52 | Y2 | 每career 2場。 |
| 53 | Y3 | 每career 1場。 |
| 54 | GameRecord | 兩arm逐場signature及final record相同。 |
| 55 | CompetitionEvidence | canonical state不變，40筆真實records另驗。 |
| 56 | Class audit | 470 execution source observations＋57 controlled samples；分母與重複查詢已說明。 |
| 57 | UNKNOWN | legal execution0 / controlled known0；另有明確post-match phase diagnostic1。 |
| 58 | FUTURE | legal execution0 / controlled legal0；synthetic負向case另驗。 |
| 59 | Durable leakage | 0；durable始終NOT_APPLICABLE。 |
| 60 | Foundation | 46/46 PASS。 |
| 61 | Integration | 38/38 PASS。 |
| 62 | Selected regression | 75/75 PASS。 |
| 63 | Syntax | 309/309 PASS。 |
| 64 | Full regression | 203/203 PASS。 |
| 65 | 1,400 audit | Bench1000/Starter400 PASS；四项issue皆0，deterministic/instrumentationNeutral=true。 |
| 66 | Warnings | unknown非match/legacy phase；no expiry/continuous time/coach last-contact/numeric effect policy。 |
| 67 | Failures | 最終correctness failures=0；full regression無failure。 |
| 68 | Status | PASS WITH WARNINGS；warnings為明確scope limitations。 |
| 69 | Recency readiness | 已知lifecycle episodic descriptors READY；未知phase保守且可解釋。 |
| 70 | Probability readiness | 只到可做feasibility audit；未有numeric effect/benefit證據，不能直接實作weight。 |
| 71 | Remaining gaps | intentional scope exclusions，非猜測phase/durable age可補的資料。 |
| 72 | Next recommendation | Case A：Relationship Recency Probability Feasibility Audit；只建議稽核，不直接實作weight，未開始。 |
| 73 | git diff --check | PASS；新增五檔no-index whitespace亦PASS。 |
| 74 | git status | 保留6檔供驗收，未commit/push/drop stash。 |
| 75 | Stop Conditions | 未觸發A–S；post-match UNKNOWN有明確非match-phase原因，legal known gates均0。 |

## Final validation and Git

**PASS WITH WARNINGS**。Foundation **46/46**、production integration **38/38**、selected regression **75/75**、full JS/CJS syntax **309/309**、full regression **203/203** 全部通過。

本輪1,400-game audit（包含於full，只執行一次）：Bench1000、Starter400；兩組orphan、noProgress、match-state integrity、GameRecord integrity問題皆0；deterministic=true、instrumentationNeutral=true。未重跑10,000-career calibration。

Warnings是unknown legacy/非match phase、未有expiry、coach last-contact、continuous time及numeric effect policy。Known lifecycle UNKNOWN=0、legal FUTURE=0、durable leakage=0。另列post-match narrative phase的預期diagnostic UNKNOWN=1；未隱藏、不改phase authority。

Next recommendation：**Case A — Relationship Recency Probability Feasibility Audit**。選擇A的依據是clean categorical output、實際RECENT/PRIOR_YEAR/OLD差異、mixed exclusion與完整neutrality；這不證明recency應影響選擇，下一步只研究效益及風險，不實作權重。未開始下一Sprint。

最終git diff --check與新增檔whitespace check PASS。main/HEAD/origin仍1bde29b，ahead/behind 0/0。保留以下6檔供人工驗收：

- `high-school-relationship-recency.js`（新增）
- `index.html`（一行script import）
- `tests/high-school-relationship-recency-foundation-test.js`（新增）
- `tests/high-school-relationship-recency-production-integration-test.js`（新增）
- `docs/high-school-relationship-recency-foundation-sprint-1.md`（新增）
- `docs/high-school-relationship-recency-foundation-validation.json`（新增）

Stashes保持原樣：`0daf1e954f74ddb45efe620107970567dec6fffd`、`8cc34a930df052067d1bad3ea798fe0b9d2ae036`。未commit、未push、未drop stash、未開始下一Sprint。
