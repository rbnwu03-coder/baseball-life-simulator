# Relationship Recency / Reputation Feasibility Audit — Sprint 1

本輪只做 canonical authority、時間證據與 influence layer 可行性稽核。結論：**Recency = PARTIAL；Reputation = PARTIAL**。School/program/coach reputation 的可行性個別為 **BLOCKED**；player 的既有名聲 scalar 並非不存在，但用途受其原契約限制。

Baseline：`main` / HEAD / `origin/main` = `758e963`，起始 working tree clean，ahead/behind 0/0。所有既有 stash 保留。Selection v2、Probability v1、3/2/1、producer、save schema、gameplay production diff 均為 0。

本文件的 validation 與最終 Git 數據由本輪新執行結果填入末節；正式證據：[JSON](high-school-relationship-recency-reputation-feasibility.json)。沒有重跑 10,000-career exposure，因本輪沒有機率或來源行為變更。

## Canonical evidence authority

直接證據：[ledger constructor / normalization / writers](../high-school-exchange-network.js)、[production ingest/completion adapters](../script.js#L9582)、[save restoration](../save.js#L10)、[friendly producer](../high-school-friendly-invitation-producer.js)、[camp producer](../high-school-training-camp-producer.js)。JSON 保存 root production JS 全面搜尋結果與內容 hash；文字命中只用於定位，以下結論以 writer、persistence、consumer 的實際契約為準。

八種類型全部由 `createRelationshipEvidence` 驗證：careerYear 必須 1/2/3、seasonPhase 為非空字串、sequence 為正整數。沒有 `completedAtSemanticPosition`、`sourceCreatedYear`、`sourceOriginYear` 的獨立欄位；對 completed match 而言，year/phase/sequence 直接取 completed schedule entry，是等效 semantic position。沒有 real-date timestamp。

ID 由 version/type/career/year/source/school/coach/match/schedule refs deterministic 組成；同 ID 不同事實被拒絕。ID 不是時間解析介面：讀取明確欄位，不對 ID substring 推論。

| Evidence | Year / phase / sequence | Match / schedule / parent | Temporal authority | 類型 | Recency 適用與限制 |
| --- | --- | --- | --- | --- | --- |
| coachSchoolConnection | 必填，ingest 時當前 context | 無 match；coach/source refs | EXPLICIT_TEMPORAL_AUTHORITY（記錄時點） | durable contact fact | 可知記錄年份；無關係建立時間、最後接觸或失效契約，不應一律 decay |
| schoolExchangeMatch | completed entry 三欄 | match + schedule | EXPLICIT_TEMPORAL_AUTHORITY | episodic | 可重建 match 年距離與同 phase 順序 |
| homeVisit | 同一完成場次三欄 | match + schedule | EXPLICIT_TEMPORAL_AUTHORITY | episodic | hostedOpponent；與 exchange 同事件，不是額外接觸強度 |
| awayVisit | 同一完成場次三欄 | match + schedule | EXPLICIT_TEMPORAL_AUTHORITY | episodic | visitedOpponent；與 exchange 同事件 |
| returnVisitEligible | 完整繼承 visit 三欄 | match + schedule + parentEvidenceId | EXPLICIT_TEMPORAL_AUTHORITY | episodic-derived eligibility | 年齡指母 visit；completed=false，不是已完成回訪 |
| sharedTrainingContext | completed camp entry 三欄 | match + schedule | EXPLICIT_TEMPORAL_AUTHORITY | episodic | 時間指已完成 camp match，不是計畫建立時間 |
| competitionEncounter | completed official entry 三欄 | match + schedule | EXPLICIT_TEMPORAL_AUTHORITY | episodic | 可分析時間；friendly/camp 明確排除其作 relationship source |
| developmentExchange | completed development entry 三欄 | match + schedule | EXPLICIT_TEMPORAL_AUTHORITY | episodic | 獨立 development fact；不是正式賽聲望 |

所有原始 type 的三欄為 A（explicit）。不需要把它们錯列 B/C；**PARTIAL 是未來通用 recency 語義的完整度，不是否認已存在的時間欄位**。Coach inception/last-contact authority 則不存在，不能以 ingest 時間冒充。

Confidence：七種 match/visit 衍生 evidence 的記錄年份與 semantic position 為 HIGH（constructor、來源entry及真實completion/reload皆有驗證）；coach 的 ingest position 同為 HIGH，但以此推 relationship age 的信心為 NONE。所有類型的通用跨phase精確時間差均為 NOT AVAILABLE。A/B 分類不授權超出已保存欄位的精度。

## Temporal reconstruction and lineage

Canonical path：completed Match + final GameRecord + completed Schedule + matching Opportunity → ledger evidence → friendly/camp producer 的 evidenceRefs → generation candidate → materialized opportunity。Coach path 是 explicit contact + known school/coach identities → ingest → ledger → producer；單有 coach metadata 不會產生關係。

`normalizeSave` 使用 Network.normalizeState 重建所有 evidence，return parent 必須存在且由 parent 重算內容完全相等。Year transition 不刪除或改寫 ledger。新增 production integration 用 4 個合法 admitted careers 跑 Y1/Y2/Y3 共 20 場，捕捉 8 次 transition 前後 digest；另做四種真實 completion（incoming/outgoing/camp/development）及存讀檔，覆蓋非隨機必選類型。完整結果見 JSON。

Return eligibility 並非「最近交流」selector，也不是有期限的獨立 invitation。每次 home/away completion 產生對應 eligibility，母事件留在 ledger；跨年可繼續產生來源。Producer 僅排除 future career year、身份不符、非法學校與既有 slot consumption 等，沒有年齡上限、TTL、全生涯一次用畢或自動過期。舊 evidence 不因產生一次新來源而刪除。

Friendly 每筆來源有 evidenceRefs / originCareerYears；candidate adapter 保留 relationshipEvidenceRef 或 networkEvidenceRef 及 supporting refs。Camp 合併同 semanticCampKey 的 refs/year/source refs，source precedence 選 source type；explicit plan 可以有空 evidenceRefs，但有 plan source ref，不能因此假造 relationship age。Plan 的 current careerYear 不代表 historical contact year。

| Vocabulary / operation | 可行性 | 邊界 |
| --- | --- | --- |
| currentWindow | READY 作同一 year/phase/sequence 相等判斷 | 相等不是剛完成多久；same slot 不含更細先後 |
| samePhase | READY 作 year + phase 相等判斷 | 不能只比較 phase 名稱而忽略年份 |
| sameYear / previousYear / olderThanOneYear | READY，由 year 差 0/1/>1 得出 | future year 要拒絕或獨立標示，不夾成 recent |
| same-year earlier/later | PARTIAL | 同 phase 可比 sequence；已知 5 個 lifecycle slots 可依 [Selection.LIFECYCLE_SLOTS](../high-school-opportunity-selection.js#L11) 對照，但 ledger 接受其他非空 phase，尚無通用 phase ordinal |
| mostRecentEvidence / oldestEvidence | PARTIAL | 最大/最小 year 可求；同 phase 可再比 sequence。跨 phase tie 不以字母排序、evidenceId 或 ledger array order 假造事件先後 |
| evidenceCount | AVAILABLE | distinct refs 可數；exchange/home/return 可來自同一 match，count 不是 strength、contact count 或 weight |
| sourceAgeClass | PARTIAL | 需先決定 eligible supporting evidence 範圍、durable/episodic 分流及跨 phase tie；不能用來源生成年份替代 evidence 年份 |
| daysSinceContact / monthsAgo / continuous exponential decay | NOT AVAILABLE | lifecycle 無實際日期與尺度；edition.seasonYear 也不授權所有關係的實際日期 |

建議 categorical / ordinal year buckets；不用 continuous decay。跨已知 slot 的順序可 derivable，但不建立普遍 phase distance 的數值。現有 ledger sort 是 year → sequence → type → ID，既不包含 phase chronology，也不代表「最近期」。未來同校多 evidence 應從相關 canonical records 選 most recent，不能沿用 first entry 或 producer precedence tie-break。

## Reputation authority and dependencies

| Domain | Production authority / writer → persistence → consumer | 分類 | 為何不能擴張為 Opportunity reputation |
| --- | --- | --- | --- |
| player reputation | [player initial reputation=0](../player.js#L2014)；story careerEffects → [applyCareerEffects](../script.js#L12981) clamp 0..20，relationship payoff 也可增加 → saved player → market/status、[career evaluation.visibility](../high-school-career-evaluation.js#L86) | AVAILABLE_CANONICAL（原 scalar 範圍） | 實際名聲／可信度；沒有逐次增量 evidence ledger、學校維度或公共聲望 inference contract，不是學校邀請 authority |
| player scouting/exposure | scoutEvaluation/exposure 由 career effects、payoff 等寫入並存檔；career offers/evaluation 使用 | PARTIAL_PROXY | visibility 不是正式 performance；來源混合，不可偷渡為校譽 |
| player evaluation history | 年度 match histories、competition evidence、career completion snapshot（有 identity） | AVAILABLE_CANONICAL（evaluation facts）；PARTIAL_PROXY 作 reputation | 是玩家履歷，不是全世界各校多年戰績 |
| school/program | deterministic invitation schoolId、schoolStandard/tier、schoolInterest、coach profile | NOT_AVAILABLE（reputation）；PARTIAL_PROXY（現有資料） | Standard 控制環境/roster分布與入學競爭；interest 是校方對此 player/position 的評估，不是公眾品牌 |
| teamStrength / roster quality | [deriveTeamStrengthProfile](../team-strength-model.js#L26) 由當年 lineup/staff/bench 推導 → roster/context 保存或重建 → match/opponent/evaluation | PARTIAL_PROXY | 當年度 competitive quality；沒有名聲歷史；更改 standard 字樣而保持 players 不變不改 strength |
| coach | [coachId/style](../player.js#L1144) deterministic invitation metadata；explicit network evidence → save → friendly/camp | NOT_AVAILABLE（coach reputation） | 身份、style、聯絡來源及關係權限不等於 standing/grade/prestige |
| competition | [definition.type/level](../high-school-competition-foundation.js#L21)、edition、entries、participations；[selection relevance/exposureWeight](../high-school-competition-evidence.js#L40) → saved competition state/evidence → selection pipeline | AVAILABLE_CANONICAL（category/evaluation）；PARTIAL_PROXY 作 prestige | national/U18 是類別，exposureWeight 是選拔評估設定，並非 reputation，且不是 Opportunity 3/2/1 |
| historical school performance | player所參與賽事有 GameRecord、school/team/edition refs；未有全校全賽季完整 W/L 與多年世界歷史 | NOT_AVAILABLE（完整 rolling authority） | 觀察樣本隨玩家出賽選擇，不能由一場勝敗或偏樣本推 rolling school reputation |

所有 proxy 均標記 **DO_NOT_PROMOTE_TO_REPUTATION_WITHOUT_NEW_CONTRACT**。沒有要求更改 Player Evaluation、U18 Selection、Team Strength；這些只是 dependency map，不是本輪整合入口。

Player scalar 的 deterministic 含義是相同 canonical player/save 可得相同值，不表示所有改變都可由獨立 event log 重播。其 identity 是 player owner + field；沒有每次 reputation 增減的 stable event ID。School/coach metadata 有 stable entity ID，也不因此具備 reputation semantics。

未來 reputation 模型：categorical tier 需獨立定義與 writer；evidence-derived 需可信 facts、涵蓋範圍、去重與版本；rolling performance 需多校多年度完整結果、時間窗及 migration；network reputation 不能把聯絡數當聲望。現有 player scalar 可在原生涯展示使用；任何跨系統 weighting 均另立契約。Reputation persistence 缺口是底層世界 history/identity/settlement facts，不是先存一個 reputationScore。

## Feasibility matrix

| Domain | Existing / temporal authority | Persistent / derived | Consumer | Feasibility | Risk / required future contract |
| --- | --- | --- | --- | --- | --- |
| returnVisit | parent visit year/phase/sequence + match refs | ledger持久；source衍生 | friendly → candidate | year READY；general PARTIAL | expiry、consumption lifetime、latest tie 規則 |
| schoolExchange | completed schedule position | ledger持久；source衍生 | friendly/camp | year READY；general PARTIAL | 同場多 evidence 去重；phase順序 |
| sharedTraining | completed camp match position | ledger持久；camp refs union | camp/friendly | year READY；general PARTIAL | camp group與單場ref age聚合 |
| coachSchoolConnection | explicit ingestion position | ledger持久 | friendly/camp（camp僅 established contact） | 記錄年 READY；relationship age BLOCKED | durable有效性／撤銷／新接觸不同於重新 ingest |
| developmentExchange | completed development position | ledger持久 | friendly/camp | year READY | 不能當 official achievement |
| competitionEncounter | completed official position | ledger持久 | relationship summary，producer排除 | temporal READY；source use禁用 | 時間可用不等於合法邀請來源 |
| schoolStandard | school tier/context，無reputation時間線 | invitation/roster持久 | admission/roster | reputation BLOCKED | 新public standing契約 |
| teamStrength | roster/year身份 | derived；context可保存 | match/evaluation | reputation BLOCKED | 不可升格proxy |
| coach metadata | deterministic ID/style | invitation持久 | admission/network identity | reputation BLOCKED | 缺standing事實與writer |
| competition history | player/edition參賽與event records | 持久，evaluation衍生 | competition/selection | global reputation BLOCKED | 缺世界全校multi-year coverage |
| player evaluation history | match refs、年度、snapshot ID | facts持久，assessment衍生 | career/selection | player history READY；reputation擴張PARTIAL | visibility/performance/ability必須分開 |

## Influence-layer and collision matrix

| Factor | Source generation | Precedence | Probability | Selection legality | Explainability | 建議與原因 |
| --- | --- | --- | --- | --- | --- | --- |
| episodic recency | 未來只有正式 expiry 契約可控制有效性 | 不覆蓋現有 explicit/canonical source順位 | 可研究 optional pool factor，現在不實作 | 不碰 mandatory/budget/legal gates | 可先衍生 year + refs | 現在 D；完整 temporal契約後才考慮 C |
| durable coach contact | 不從記錄年推失效 | 不把新接觸自動置於舊回訪之上 | 未有last-contact/有效期，不做decay | 不改 | 說明contact類型與record時點 | durable/episodic分流 |
| future school/coach reputation | 要先有世界事實與合法producer契約 | 不改source authority | 缺reputation authority，暫不可用 | 禁止當legality捷徑 | 不能把label寫成聲望事實 | 先contract/history；非本輪入口 |
| existing player scalar | 不授權school source | 無權限 | 不接Opportunity weight | 不改 | 原生涯展示可以 | 原domain使用；不滲漏到U18/strength |

Explicit return visit 若很舊：當前仍依 source precedence；沒有 expiry 就不能以age降級成fallback或刪掉來源。未來需先約定來源仍合法與概率吸引力是不同決策，再處理先dedup選代表還是收集supporting refs。不能因recency把被 precedence 淘汰來源重新升格。

3/2/1 是來源相對可信度。Multiply 保留base但可能反轉方向；add 改變尺度並受可用候選數影響；bucket override 直接覆蓋base authority；explainability only 不改抽樣，現階段最安全。只評估形式，不決定factor數值；未來還須處理camp group總權重、friendly multiplicity、normalized draw與版本。若一個group多個對手分別加權，可能破壞目前camp group invariant。

Derived recency 可不新增 save state；從當前 semantic position + ledger + model version 計算。不能存 currentRecencyScore 形成第二 authority。未來若有weight改變，provenance應保存 model version、refs、class/reason 及必要的base/final scalar，不複製完整ledger或calculation table。既有已materialized decision不可因讀檔重算抽選；world canonical state與window不變，factor必須相同；draw identity/version migration需明確。

## Risk matrix

| Risk | Scenario | 未來契約／驗證需求 |
| --- | --- | --- |
| rich-get-richer | 最近對手因本次出賽刷新 → 更易再被選 | 必須測new/repeat與selection/reachable比，不將evidence count當strength |
| new-opponent starvation | 沒歷史對手沒有recent標籤而全部降權 | 明確no-evidence語義及保留新對手可達性；不預定數值 |
| camp/friendly skew | camp合併多refs，而friendly單ref；return繼承visit時間 | 同事件去重、type/group時間定義，跨type exposure audit |
| reputation circularity | 曝光→名聲→更多曝光 | 獨立canonical performance/history，隔離visibility，不以選中次數生聲望 |
| save-state duplication | score與ledger同時持久化後分歧 | preference為derive；若必須persist需version/migration及唯一authority |
| reload instability | 使用實際日期或重新抽樣 | semantic clock、deterministic inputs、既有window anti-reroll |
| cross-year drift | producer的新year被誤當evidence來源year | refs回ledger，保留原year；Y1→Y2/Y3分別+1/+2 |
| proxy misuse | strong school、coach linkage、U18 level直接變聲望 | 明確DO_NOT_PROMOTE標籤與domain ownership |
| chronology overclaim | ledger排序或字母phase當真實先後 | scope phase與sequence，未知順序保持不可判定 |

以上是未來加入factor的風險，並非聲稱目前有runaway。本輪未改抽樣；前一輪healthy exposure結論不被假設性風險推翻。

## 81-item closeout

| # | 項目 | 結論／證據 |
| --- | --- | --- |
| 1 | Baseline | main/HEAD/origin=758e963，起始clean，0/0。 |
| 2 | Changed files | 本文件、同名JSON、audit.cjs、foundation-test.js、production-integration-test.js；共5檔新增。 |
| 3 | Production diff | selection/probability/producer/save/other gameplay 全0。 |
| 4 | Evidence inventory | 八種，見authority matrix與JSON evidenceByType。 |
| 5 | Temporal fields | 全有year/phase/sequence；非coach有match/schedule，return另有parent。 |
| 6 | Temporal classification | 八種記錄位置均EXPLICIT；coach relationship inception不可判。 |
| 7 | Cross-year preservation | production transition前後相等；Y1 facts於Y3仍year1。 |
| 8 | Same-year ordering | 同phase sequence可比；已知slots可對照，無通用任意phase順序。 |
| 9 | Durable facts | coach connection；不同contact subtype不保證永久有效，也無TTL。 |
| 10 | Episodic facts | exchange/visit/camp/competition/development；return為episodic衍生資格。 |
| 11 | Return lineage | parent visit → return → producer refs → candidate。 |
| 12 | Return lifetime | 無age expiry；跨年保留，slot consumption非全生涯一次性消耗。 |
| 13 | Shared training lineage | completed camp match/schedule → evidence → camp/friendly；非plan建立時間。 |
| 14 | Coach semantics | explicit ingest位置；knownCounterpart/previousAffiliation才可產camp。 |
| 15 | Competition encounter | official completion事實；不成friendly/camp source。 |
| 16 | Development exchange | development completion獨立類型與source。 |
| 17 | Most recent | 可求最大year；phase tie未定；不能first/ID排序。 |
| 18 | Age buckets | 同year/previous/older可derive；currentWindow僅tuple相等。 |
| 19 | Continuous decay | NOT APPLICABLE：無real dates及連續時間尺度。 |
| 20 | Recency save impact | 可derive部分不需新增state。 |
| 21 | Recency determinism | 同ledger/context必相同，觀察不耗RNG。 |
| 22 | Recency anti-reroll | future不能重開consumed window；declined/expired/cancelled檢查通過。 |
| 23 | Rich-get-richer risk | 最近事件自我刷新風險；未實作factor。 |
| 24 | New-opponent starvation | 缺history不可自動當低價值；另立no-evidence語義。 |
| 25 | Recency classification | PARTIAL；年距離READY，跨phase/durable語義待契約。 |
| 26 | School reputation | NOT_AVAILABLE；standard/interest僅proxy。 |
| 27 | Player reputation | AVAILABLE_CANONICAL在既有scalar原domain；跨Opportunity PARTIAL。 |
| 28 | Coach reputation | NOT_AVAILABLE；contact不是standing。 |
| 29 | Competition reputation | PARTIAL_PROXY：category/selection relevance非public prestige。 |
| 30 | teamStrength boundary | 當年roster competitive quality，不是reputation。 |
| 31 | schoolStandard boundary | admission/environment/roster分布，不是public standing。 |
| 32 | Coach network boundary | 來源合法性與關係身份，不是聲望score。 |
| 33 | Competition tier boundary | competition taxonomy / evaluation weight，不是Opportunity權重或聲望。 |
| 34 | Historical performance | 有玩家match/competition histories；無完整世界多校多年戰績。 |
| 35 | Reputation persistence | player scalar已存；future world reputation缺facts，不先造score。 |
| 36 | Reputation determinism | scalar同save可重現；非逐筆reputation事件可回放ledger。 |
| 37 | Circularity risk | exposure→reputation→exposure需切斷自我證明。 |
| 38 | Runaway risk | future聲望權重可能回饋；非本輪觀察到故障。 |
| 39 | Reputation classification | PARTIAL總體；school/program/coach模型BLOCKED。 |
| 40 | Influence comparison | 見matrix：現階段explainability，未來optional probability另契約。 |
| 41 | Source generation | 僅明確expiry/availability契約能改，不以age猜失效。 |
| 42 | Precedence | 不讓recency override explicit source authority。 |
| 43 | Probability | 形式上可factor，未授權數值/實作；保護camp group。 |
| 44 | Selection legality | 不碰mandatory/budget/roster/legality。 |
| 45 | Explainability | 可說明原year/refs/class，不捏造精確age。 |
| 46 | Authority collisions | 合法性、precedence、抽樣吸引力分開，需versioned contract。 |
| 47 | Source precedence | 舊return沒有expiry仍合法，不因較新coach自動被取代。 |
| 48 | Weight interaction | multiply/add/override皆可能反轉權重；現階段只explain。 |
| 49 | Save schema | 0 diff；不存currentRecencyScore。 |
| 50 | Provenance | refs/version/reason及必要scalar，非整份計算表。 |
| 51 | Evidence multiplicity | refs可數，但同場三筆非三次關係強度。 |
| 52 | Recency matrix | 完成，八種逐項year/phase/sequence/ref/durable/可行性。 |
| 53 | Reputation matrix | 完成，所有proxy附不得升格條件。 |
| 54 | Influence matrix | 完成，generation/precedence/probability/legality/explainability。 |
| 55 | Risk matrix | 完成，含要求的八項及chronology overclaim。 |
| 56 | Friendly compatibility | refs指回原ledger，originCareerYears與current producer year不同。 |
| 57 | Training camp compatibility | 合併refs保留來源year；explicit plan空refs不假造age。 |
| 58 | Selection compatibility | high-school-opportunity-selection-v2，production bytes與baseline相同。 |
| 59 | Probability compatibility | v1、3/2/1 unchanged，production bytes相同。 |
| 60 | Y1 frequency | 每career 2場。 |
| 61 | Y2 frequency | 每career 2場。 |
| 62 | Y3 frequency | 每career 1場。 |
| 63 | Anti-reroll | reload/window replay/declined/expired/cancelled不重抽。 |
| 64 | Save/load | 真實saveGame/loadGame與normalizeSave，temporal refs保留。 |
| 65 | GameRecord neutrality | 20場完整record integrity；觀察版與原版同career逐筆deepEqual。 |
| 66 | CompetitionEvidence neutrality | production diff0，official encounter與competition regression驗證。 |
| 67 | Team strength neutrality | 新測試與既有強度擾動測試保持抽樣一致。 |
| 68 | Selected regression | 見下方本輪執行結果及JSON validation.selected。 |
| 69 | Syntax | 見下方本輪執行結果及JSON validation.syntax。 |
| 70 | Full regression | 見下方本輪執行結果及JSON validation.full。 |
| 71 | 1,400 audit | full suite內獨立audit，Bench1000/Starter400；見下方。 |
| 72 | Warnings | 三項能力限制：phase精度、durable contact時間語義、世界聲望authority缺口。 |
| 73 | Failures | 以本輪validation結果為準，不以缺reputation authority當correctness failure。 |
| 74 | Recency recommendation | 先補Temporal Authority contract，既有year-based explainability已可用。 |
| 75 | Reputation recommendation | 暫不做school/coach reputation；保留player scalar原domain。 |
| 76 | Combined recommendation | 不做decay/score/weight tuning，先處理時間定義。 |
| 77 | Deferred implementation | 所有recency/reputation factors、UI、save schema及balancing均未做。 |
| 78 | Next Sprint | Case B：Relationship Temporal Authority Foundation，僅建議未開始；school reputation亦符合Case D暫緩。 |
| 79 | git diff --check | 最終結果見下方；新檔另做no-index whitespace check。 |
| 80 | git status | 保留五檔新增待人工驗收；未commit/push；stash保留。 |
| 81 | Stop Conditions | PARTIAL非Stop E/F：可從persistent evidence重建年距離，load未失去lineage；其他以最終gate為準。 |

## Final validation and Git

最終 Sprint status：**PASS WITH WARNINGS**。Recency **PARTIAL**；Reputation **PARTIAL**（school/program/coach reputation 個別 BLOCKED）。三項 warning 為時間排序精度、durable contact 年齡語義、世界 reputation authority 缺口；correctness failures **0**。

| 本輪新執行驗證 | 結果 |
| --- | --- |
| Foundation | 24/24 PASS（含四項proxy邊界檢查） |
| Production integration | 22/22 PASS |
| Selected regression | 71/71 PASS；新增四項foundation檢查其後單跑及full再次通過 |
| Full JS/CJS syntax | 303/303 PASS；最後test變更後重跑 |
| Full regression | 199/199 PASS，含兩個新test files |
| 1,400-game audit | Bench1000 + Starter400 PASS；包含於上述full run，未重複跑 |
| Orphan / noProgress / match-state / GameRecord issues | bench與starter均為0 |
| Determinism / instrumentation neutrality | true / true |
| Production diff | 0；selection/probability/producer/save/gameplay未修改 |
| git diff --check | PASS；五個untracked新檔另經no-index whitespace check |
| Git | main/HEAD/origin 758e963，ahead/behind 0/0；僅五個新檔未提交 |
| Stop Conditions | 未觸發；沒有temporal lineage遺失、production變更或regression failure |

保留的stash commit：`0daf1e954f74ddb45efe620107970567dec6fffd`、`8cc34a930df052067d1bad3ea798fe0b9d2ae036`。未commit、未push、未drop stash、未開始下一Sprint。

確切新增檔案：

- `tests/high-school-relationship-recency-reputation-feasibility-audit.cjs`
- `tests/high-school-relationship-recency-reputation-feasibility-foundation-test.js`
- `tests/high-school-relationship-recency-reputation-feasibility-production-integration-test.js`
- `docs/high-school-relationship-recency-reputation-feasibility-sprint-1.md`
- `docs/high-school-relationship-recency-reputation-feasibility.json`

下一步僅建議 **Case B — Relationship Temporal Authority Foundation**，先定義phase ordering、durable/episodic與source age聚合，再決定是否值得導入recency。School/coach reputation暫不做；不為追求對稱而新增聲望score。
