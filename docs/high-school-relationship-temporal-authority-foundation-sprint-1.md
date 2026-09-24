# Relationship Temporal Authority Foundation — Sprint 1

Baseline：`main` / HEAD / `origin/main` = `f300b2f` (`test: audit relationship recency and reputation feasibility`)，起始 clean，ahead/behind 0/0。既有兩份 stash 保留。本輪實作 canonical chronology 與 descriptive lifetime/source summary；沒有 recency factor、decay、reputation 或 selection 行為調整。

正式數據：[validation JSON](high-school-relationship-temporal-authority-foundation-validation.json)。最終狀態與驗證結果見末節。

## Authority and dependency ownership

新增 [high-school-relationship-temporal-authority.js](../high-school-relationship-temporal-authority.js)，version `high-school-relationship-temporal-authority-v1`。提供 CommonJS 與 browser global `HighSchoolRelationshipTemporalAuthority`；index 在 Selection 載入後載入新模組。初始化只建立 API，不查詢／改寫 player 或呼叫 RNG。

查找既有 chronology 後，沿用 **HighSchoolOpportunitySelection.LIFECYCLE_SLOTS** 作唯一已知 lifecycle phase authority。新模組以相同 careerYear 的 slot sequence 排序，對 distinct phase 推導零起算 phaseOrder；沒有复制第二份 phase array。Selection 原碼、version、資料與行為完全不變。

Dependency 是 Temporal → Selection / Network，Selection → producers → Network；沒有任何 producer 反向引用 Temporal，因此無 circular dependency。Source summary 由呼叫端顯式使用，不加進 producer/candidate 的輸出、ID 或 save payload。未來若 producer 要直接 import Temporal，必須先另案處理共享 phase authority 的依賴方向，不可直接形成 cycle。

| careerYear | phase | phaseOrder（derived） | authority slot sequence |
| --- | --- | --- | --- |
| 1 | autumn-exhibition | 0 | 1 |
| 1 | post-autumn-evaluation | 1 | 2 |
| 2 | year-two-spring-evaluation | 0 | 1 |
| 2 | year-two-autumn-evaluation | 1 | 2 |
| 3 | final-competition | 0 | 1 |

Slot sequence 在此既有 lifecycle table 內決定已知 phase 順序；evidence 的 sequence 則只在同 phase 內比較。不可把任意 evidence sequence 跨 phase 比大小。phaseOrder 每次從 owner 衍生，不持久化；caller 傳入自訂 phaseOrder 不具 authority。

## Position, comparator and age contract

`getRelationshipTemporalPosition(input, ledger?)` 回傳 version、careerYear、seasonPhase、derived phaseOrder、sequence、status、temporalConfidence。careerYear 必須為數值 1/2/3，sequence 必須為正整數；錯誤直接拒絕，不 clamp、不接受字串數字。phase 必須非空；未知但非空的舊 phase 不造成 save normalization 失敗。

`compareRelationshipTemporalPosition(a,b)`：

1. careerYear 優先，跨年不需要知道 phase：Y1任何phase < Y2任何phase < Y3任何phase。
2. 同年有任何未知 phase，回 `UNKNOWN`，即使兩者未知字串恰好一樣。
3. 同年已知 phase 比 phaseOrder；同 phase 比 sequence。
4. 相等是 `SAME`；否則 `EARLIER` / `LATER`。不使用 alphabetic phase、ledger insertion order、stable ID 或實際日期。

Phase 是 year-scoped：Y1 的 `final-competition` 沒有被定義成已知 slot，回 UNKNOWN_PHASE。未知不等於錯誤、不等於最新、不等於過期。已知 year/unknown phase 的 confidence 是 `YEAR_ONLY`；已知完整 position 為 `EXACT_SEMANTIC_POSITION`。Invalid year 直接 exception，非低confidence的合法結果。

`classifyRelationshipEvidenceAge(evidenceOrPosition,current,ledger?)`：

| Class | 條件 |
| --- | --- |
| CURRENT_WINDOW | 相同已知 year/phase/sequence |
| SAME_PHASE_EARLIER | 同已知year/phase、較低sequence |
| SAME_YEAR_EARLIER | 同year、較早已知phase |
| PREVIOUS_YEAR | evidence在前一年；即使phase未知，year authority仍足夠 |
| OLDER_THAN_ONE_YEAR | evidence比current早超過一年 |
| FUTURE | comparator為LATER；未當成recent或CURRENT |
| UNKNOWN | 同年缺phase chronology，或來源summary沒有可確定latest position |

沒有 days/weeks/months/continuous distance。Age 是 descriptive ordering class，不是合法性或expiry判斷。

## Evidence lifetime and temporal matrix

`classifyRelationshipEvidenceLifetime` 是單一 classifier；未知type回 lifetime UNKNOWN / applicability UNDEFINED。所有已知type都回 `expiryPolicy: NONE`、`autoExpires: false`。

| Evidence type | Lifetime | Position source | Cross-year / cross-phase / sequence | Most-recent | Expiry applicability | Confidence / limitation |
| --- | --- | --- | --- | --- | --- | --- |
| schoolExchangeMatch | EPISODIC | completed schedule match | year可比；known phase可比；同phase sequence有效 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | exact或year-only；目前不expire |
| homeVisit | EPISODIC | completed hosted match | 同上 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | 與exchange可同事件 |
| awayVisit | EPISODIC | completed visiting match | 同上 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | 與exchange可同事件 |
| returnVisitEligible | EPISODIC | canonical parent visit position | 同上；必須parent一致 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | 未完成回訪的資格；不是新接觸事件 |
| sharedTrainingContext | EPISODIC | completed camp match position | 同上 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | 不是camp plan或producer建立時間 |
| competitionEncounter | EPISODIC | completed official match position | 同上 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | temporal可用不授權friendly/camp source |
| developmentExchange | EPISODIC | completed development match position | 同上 | 支援 | CAN_EXPIRE_BY_TEMPORAL_POLICY | 不推導正式賽聲望 |
| coachSchoolConnection | DURABLE | recorded contact ingestion position | 同上；只代表recordedAt | 支援recorded position | CANNOT_EXPIRE_BY_TEMPORAL_POLICY | 不是inception或last contact，也不保證永久有效 |

EPISODIC 的 CAN_EXPIRE 只代表未來可另立 temporal policy，**本版沒有expiry policy，也不expire任何事實**。DURABLE 不自然因event age而失效，但也不是永遠有效的承諾；撤銷、coach affiliation變更等既有producer條件不由本模組改寫。

Return temporal resolution 必須提供 canonical ledger。Network.normalizeState 先驗證 parent存在且deriveReturnVisitEvidence(parent)與child完整一致；再驗證傳入child確實是ledger同一筆事實，最後讀parent position。Conflict/orphan直接拒絕，不靜默修正，也不用當年producer year取代。

Coach API 明示 `RECORDED_CONTACT_NOT_INCEPTION_OR_LAST_CONTACT`。重複recording是否意味新接觸不在本Sprint虛構；不得拿最新coach record宣稱關係起始或最後一次真實接觸。

## Most-recent, oldest and aggregation

`resolveMostRecentRelationshipEvidence(ledger,filter)` 與 `resolveOldestRelationshipEvidence` 使用同一比較邏輯，filters 支援 schoolId（任一端）、schoolAId、schoolBId、coachId、evidenceType、sourceCategory（canonical evidence.source.type）、evidenceIds。未知filter或無法解析的ref拒絕，避免scope拼錯而靜默扩大。

Resolver 回 EMPTY / RESOLVED / UNKNOWN、temporalPosition、samePositionEvidenceIds、supportingEvidenceIds。所有 supporting IDs 保留、去重並以ID排序，排序只是 deterministic presentation。相同position全部放tie group，沒有假造「誰更新」。若未知phase使極值不能證明，回 UNKNOWN / null position；較低年份的未知phase不妨礙較高年已知position成為latest。Oldest同理。未知phase的record不能透過與自己比較而被假定有exact position。

`buildRelationshipTemporalSummary(ledger,source,current)` 只需要 source.evidenceRefs 與current semantic position；source由既有producer提供，helper本身不是新的producer admission validator。回傳：

- version/status、evidenceCount、全部supportingEvidenceIds。
- latestTemporalPosition/latestAgeClass、oldestTemporalPosition/oldestStatus、latest tie IDs。
- lifetimeClass（EPISODIC/DURABLE/MIXED/NONE）、temporalConfidence、evidenceYearRange。
- completedEventCount/completedEventGroups、nonMatchEvidenceCount；contactCount固定null。
- expiryPolicy NONE / autoExpires false。

事件group identity採現存 `careerId + careerYear + matchId + scheduleEntryId`，避免不同career或year的短match ID碰撞。Exchange + home/away + return從同一match產生時：evidenceCount=3，completedEventCount=1。Return-only group亦指其已驗證完成parent match。Coach沒有match identity，不擅自算成一個獨立實際contact；所以completedEventCount不等於所有類型的contactCount。

| Source | Summary rule | Neutrality boundary |
| --- | --- | --- |
| Friendly | 以source.evidenceRefs解析canonical records，latest看chronology，refs不丟失 | 不替換producer precedence、sourceId或candidate順序 |
| Camp | 以既有合併後evidenceRefs求latest/oldest/ties | 不增減participants、camp group、semanticCampKey或總weight |
| Explicit camp plan，有refs | 正常解析其真實supporting relationship；不推造plan年齡 | 不把plan precedence混入chronology |
| Explicit camp plan，無refs | sourceType=explicitCampPlan且source位置=current時回PLAN_CURRENT_CONTEXT；不相符／不可判定為PLAN_CONTEXT_UNRESOLVED | latestTemporalPosition=null、latestAgeClass=UNKNOWN；不是recent relationship |
| 其他無refs來源 | NO_RELATIONSHIP_EVIDENCE | 不用source current year偽造history |

Source有未知phase導致latest不確定時，仍提供year range與全部refs，latestAgeClass保持UNKNOWN；caller可另看year-only事實，但不能猜一筆latest。混合durable與episodic的summary回MIXED，未來recency政策必須自行先scope evidence type，不應把durable錄入新舊當成所有關係的新舊。

## Save, integration and equivalence

沒有save version bump、migration、新persistent欄位或mutable recency score。舊save仍走原Network.normalizeState；Temporal不接管save admission。未知phase的合法舊資料保留，只在新API內標UNKNOWN。Summary不寫入player、ledger、source、candidate、provenance或schedule。

Production變更僅新增temporal module與index的一行script import。Selection/probability/producers/Network/save/GameRecord/CompetitionEvidence原檔保持baseline內容；v2/v1及3/2/1保持原樣。

上一Sprint的feasibility integration有一項「整個repo不得有production diff」的audit-only gate，與本輪明確授權新module不相容。本輪將其改為逐檔比對該audit baseline既有root production JS內容；未skip/assertion減量，原22項仍保留，新gate逐檔assert。只允许後續獨立module/import存在，不放寬既有behavior/source檢查。其餘前一Sprint formal JSON/closeout未重寫。

Behavioral equivalence實測4組同identity合法career，每組plain vs temporal-observed各Y1=2/Y2=2/Y3=1，共每arm20場。Observer在getInput後、抽選前查詢friendly/camp temporal summaries，前後比較完整input與selection JSON。完整career rows與final ledger/schedule/competition state/CompetitionEvidence/GameRecord也deepEqual。檢查candidate IDs/order/source types、profiles/weights、draw IDs/results、selected opportunities及entries；沒有只比較場數。

另外四種真實completion scenarios覆蓋Y1 home/away/camp/development；Y2真實save/load比較summary，Y3保留Y1原始year。Real coach與official competition來自完整career；不是以手工field代替production evidence。

CompetitionEvidence另外使用註冊competition/edition/entry/participation的正式Y3 match，產生40筆實際`competitionEvidenceState.records`，查詢前後deepEqual。開發覆核時修正了測試誤讀欄位與Y2 fixture沒有official candidate的問題，改用既有合法Y3流程；沒有修改production來容納fixture。最終targeted及full均通過，沒有full regression failure。

## 61-item closeout

| # | Item | Result |
| --- | --- | --- |
| 1 | Baseline | main / HEAD / origin=f300b2f，起始clean、0/0，兩stash保留。 |
| 2 | Changed files | 新module、新foundation/integration tests、新MD/JSON；index import及既有feasibility test gate調整，共7檔。 |
| 3 | Production diff | 只新temporal API與一行import；既有selection/probability/source/save/gameplay behavior 0。 |
| 4 | Version | high-school-relationship-temporal-authority-v1。 |
| 5 | Phase authority | Selection.LIFECYCLE_SLOTS單一owner；無第二份phase表。 |
| 6 | Known phases | Y1 autumn→post-autumn；Y2 spring→autumn；Y3 final。 |
| 7 | Unknown phase | 同年comparison UNKNOWN；不排序字串、不拒絕舊save。 |
| 8 | Career-year ordering | 只接受數值1/2/3，不clamp。 |
| 9 | Same-phase ordering | 正整數sequence比較；相等SAME。 |
| 10 | Cross-phase ordering | 同年known phaseOrder優先sequence。 |
| 11 | Cross-year ordering | year優先，包括未知phase。 |
| 12 | Comparator | EARLIER / SAME / LATER / UNKNOWN；invalid input exception。 |
| 13 | Age classes | 七種；見age matrix。 |
| 14 | Future evidence | FUTURE，不變成recent、不修改合法性。 |
| 15 | Episodic | 七種match/visit/return類型。 |
| 16 | Durable | coachSchoolConnection；不等於永久。 |
| 17 | Expiry applicability | episodic CAN、durable CANNOT、unknown UNDEFINED；全NONE/autoExpires=false。 |
| 18 | Return parent | normalize驗parent全內容，讀parent position；不一致拒絕。 |
| 19 | Shared training | completed camp match position，非plan建立年。 |
| 20 | Coach recordedAt | recorded contact，明示非inception/last contact。 |
| 21 | Most recent | comparator極值；school/coach/type/source/ref filters。 |
| 22 | Tie | samePosition group；ID只排序輸出。 |
| 23 | Oldest | 實作，同一極值helper反向比較。 |
| 24 | Same-match multiplicity | 三個evidence可為一個completedEvent。 |
| 25 | Contact identity | existing career/year/match/schedule tuple；無全類型contactCount。 |
| 26 | Source summary | refs→positions→latest/oldest/age/lifetime/confidence/events；不持久化。 |
| 27 | Friendly aggregation | 引用全部canonical refs，不變precedence。 |
| 28 | Camp aggregation | 既有merged refs，不變group/participants/weight。 |
| 29 | Explicit plan | 無refs為PLAN_CURRENT_CONTEXT或PLAN_CONTEXT_UNRESOLVED；無fake recency。 |
| 30 | Confidence | known exact / unknown phase YEAR_ONLY / 無證據UNKNOWN；invalid year拒絕。 |
| 31 | Save schema | 0 diff，不bump。 |
| 32 | Old save | 合法未知phase正常normalize，新API回UNKNOWN。 |
| 33 | Save/load | Y2/Y3 lineage與summary真實存讀檔驗證。 |
| 34 | Determinism | 同inputs同summary，order permutation/tie穩定。 |
| 35 | RNG | 所有新API不使用RNG；throw-on-RNG測試。 |
| 36 | Anti-reroll | window/draw身份與declined/expired/cancelled不變。 |
| 37 | Selection version | high-school-opportunity-selection-v2。 |
| 38 | Probability version | high-school-opportunity-probability-v1。 |
| 39 | Weights | explicit return/camp3，coach/school/shared2，fallback/unknown1。 |
| 40 | Candidate identities | plain vs observer逐筆相同。 |
| 41 | Candidate ordering | 完整candidate array相同。 |
| 42 | Selection result | 完整result/profiles/draws/opportunities/entries相同。 |
| 43 | Match frequency | 每career 2/2/1；5 opportunities。 |
| 44 | GameRecord | 各場signature與final完整record相同。 |
| 45 | CompetitionEvidence | final canonical state前後/兩arm相同，原module unchanged。 |
| 46 | Reputation | 未新增任何school/coach/program score。 |
| 47 | Foundation | 45/45 PASS。 |
| 48 | Production integration | 29/29 PASS；70 input reads、476 summaries、4 no-ref plans。 |
| 49 | Selected regression | 73/73 PASS；CompetitionEvidence測試補強後targeted 29/29及full重驗通過。 |
| 50 | Syntax | 306/306 PASS，最後測試改動後重跑。 |
| 51 | Full regression | 201/201 PASS。 |
| 52 | 1,400 audit | Bench1000/Starter400 PASS，四項完整性issue均0，deterministic/instrumentationNeutral=true。 |
| 53 | Warnings | unknown legacy phase；coach inception/last contact不可推；非match contactCount不可推；無expiry policy。 |
| 54 | Failures | 最終correctness failures=0；full regression從未失敗。 |
| 55 | Final status | PASS WITH WARNINGS，四項明確semantic limitations，非behavior regression。 |
| 56 | Recency readiness | 已知lifecycle＋episodic evidence之categorical recency READY；一般unknown phase與durable event-age用途仍受限制。 |
| 57 | Remaining gaps | 尚未定義real dates、coach inception、universal contact count；這些不是本Sprint要偽造的資料。 |
| 58 | Next recommendation | Case A：Relationship Recency Foundation — Sprint 1；限已知lifecycle/episodic scope，不等於現在需要weight tuning；未開始。 |
| 59 | git diff --check | PASS；五個新增檔另做no-index whitespace check。 |
| 60 | git status | 保留7檔變更；未commit/push/drop stash。 |
| 61 | Stop Conditions | 未觸發A–O。未知phase保持UNKNOWN，沒有fake chronology/expiry或behavior變更。 |

## Final validation

**PASS WITH WARNINGS**。Foundation **45/45**、production integration **29/29**、selected **73/73**、full JS/CJS syntax **306/306**、full regression **201/201** 全部通過。

1,400-game audit於本輪full執行一次：Bench1000、Starter400；兩組orphan/noProgress/integrityIssues/gameRecordIntegrityIssues皆0；deterministic=true、instrumentationNeutral=true。沒有重跑10,000-career exposure。

四項warnings：unknown legacy phase不猜順序、coach inception/last contact不可推、非match類型無完整contact event identity、尚無expiry policy。這些是刻意保留的語義邊界。已知lifecycle的episodic categorical recency已READY；無須為支持當前五個slots再做Temporal Sprint 2。下一步建議 **Case A — Relationship Recency Foundation Sprint 1**，以此範圍為前提；這不是提高/降低3/2/1的需求證据，也不授權對durable contacts套event decay。

最終Git：main/HEAD/origin=f300b2f，ahead/behind 0/0；git diff --check PASS，新增檔no-index whitespace check PASS。保留以下7檔供人工驗收：

- `high-school-relationship-temporal-authority.js`（新增）
- `index.html`（一行script import）
- `tests/high-school-relationship-temporal-authority-foundation-test.js`（新增）
- `tests/high-school-relationship-temporal-authority-production-integration-test.js`（新增）
- `tests/high-school-relationship-recency-reputation-feasibility-production-integration-test.js`（既有audit-only gate作用域修正）
- `docs/high-school-relationship-temporal-authority-foundation-sprint-1.md`（新增）
- `docs/high-school-relationship-temporal-authority-foundation-validation.json`（新增）

兩份stash完整保留：`0daf1e954f74ddb45efe620107970567dec6fffd`、`8cc34a930df052067d1bad3ea798fe0b9d2ae036`。未commit、未push、未drop stash、未開始下一Sprint。
