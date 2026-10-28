"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./current-test-baseline-verification-v0.1-capture.cjs'),i=C.json(C.prefix+'inventory-final-evidence.json'),a=C.json('docs/test-reliability-audit-v0.1-inventory-final-evidence.json');
C.integrity();assert.deepEqual(i.counters.status,{PASS:203,FAIL:2,UNVERIFIED:48,BLOCKED:2});
C.capture('provenance',{inventory:C.prefix+'inventory-final-evidence.json',suiteIdentity:'normalized repository-relative file path with suite: prefix',
 historicalCommandProvenance:a.rows.map(r=>({stableId:'suite:'+r.file,executionKind:r.observedExecutionKind||'UNVERIFIED',command:r.observedCommand||null,
  reconstructedCommandIsNotActual:r.observedExecutionKind?.startsWith('R6 in-process')||false,evidence:r.confirmedEvidence?.evidence||null})),
 counts:i.counters,currentPassEvidence:{historicalAcceptedUnchangedInputs:201,thisTurnStandalone:2},currentFailEvidence:{historicalAcceptedUnchangedInputs:2,thisTurnReproductions:0},
 distinctions:{newThisTurnFormalSuites:0,newThisTurnDiagnostics:0,postAuditNewFormalSuites:4,postAuditNewSupportFiles:5,knownSnapshotGapNotClosed:true,
  formalSuiteCountNotSumOfAssertions:true,originalMatchHistoricalFailNotOverwritten:true},
 futureRepairs:[{priority:1,task:'原Match #36／S3驗收契約關閉',scope:'先裁決固定ID3責任與可追溯合法source-flow；本輪不刪原assertion或改Production，snapshot仍另列KNOWN CONTRACT GAP'},
 {priority:2,task:'Ability Gradient統計／決策政策契約',scope:'檢查固定cohort與RNG identity相關性及first-legal政策；原tier、seed與樣本不為PASS調整'}],
 noFurtherExecutions:true,readOnly:true});
const md=String.raw`# 《棒球人生》Current Test Baseline Verification v0.1

任務：Read-only Test Baseline Verification  
日期：2026-10-15（Asia/Taipei）  
正式 Git 基線：`+'`ab3117653945de0b7013636187c446276a96e634`'+String.raw`

**目前可信清單：255個正式套件入口＝203 PASS、2 FAIL、48 UNVERIFIED、2 BLOCKED。這是經source／輸入適用性核對的證據集合，不是Full255或Full251執行結果。** 203個PASS中，201個採信既有歷史執行、2個來自本輪targeted standalone；兩個FAIL皆沿用同source、同輸入的正式重現，本輪沒有重跑或製造新的FAIL capture。

本輪只執行 **R4 Dependency 44/44、R6 Exact Checker 23/23，兩個正式children均PASS**。沒有執行隔離gameplay診斷、原Match、Gradient、First-base或任何Full／Browser套件集合。**1552個既有可讀檔案hashes全不變；Production／正式tests／fixtures／seeds／pins／runner／registry delta＝0。**

原Match #36歷史FAIL、S3固定Moment3 UNVERIFIED及Snapshot KNOWN CONTRACT GAP均保留。Match Vertical Slice已有可用的有界Canonical測試基礎，**整體驗收仍未準備完成**。Ready for Commit＝**NO**；Ready for Sprint10B＝**NO**；Receiver v2＝**DISABLED**。本輪完成即停止。

## 1. 目前正式Inventory與Stable Identity

[完整255列入口清單](current-test-baseline-verification-v0.1-inventory-final.md)與[machine inventory](current-test-baseline-verification-v0.1-inventory-final-evidence.json)逐套保存stable identity、current source SHA-256、歷史狀態、採信capture、指令來源、依賴候選、Entry-Safe profile、registry／R6 membership及未執行限制。

Stable identity採 **suite:<repo-relative file path>**，沿用原251檔案身份，不因重跑、profile、assertion數或同seed replay新增identity。本輪核對tests實際333檔＝320個JS／CJS＋13個HTML；原251個套件均存在，沒有遺漏或重複。

| 分類 | 原Audit | 目前 | 計數責任 |
|---|---:|---:|---|
| 標準-test.js／-test.cjs套件入口 | 247 | 251 | 新增4個正式Suite |
| vertical-slice-smoke.js | 1 | 1 | Legacy smoke，不等於完整Vertical Slice |
| callbackTest與兩個Legacy comparison | 3 | 3 | 既有非標準命名assertion入口 |
| **正式Suite entries** | **251** | **255** | 一個entry file算一套 |
| Helpers／runners／probes | 60 | 65 | 不併入Suite總數 |
| Browser fixtures | 13 | 13 | 全部UNVERIFIED，另列，不併入255 |

新增4個正式Suite是：

| 新Suite（相對原Audit） | 目前狀態 | 已有證據／限制 |
|---|---|---|
| tests/entry-safe-runner-test.cjs | **BLOCKED** | 歷史25/25接受；目前舊capture／舊WIP guard阻擋安全重跑，見第5節 |
| tests/source-freeze-reconciliation-exact-contract-test.cjs | **PASS，歷史80/80** | 隔離source mutation正式contract Suite；不是五套完整Pitch Suite的替代 |
| tests/canonical-match-regression-integration-test.cjs | **PASS，歷史50/50** | 正式88221／88222替補fixtures，各首次＋replay |
| tests/routine-commentary-contract-test.cjs | **PASS，歷史1/1原斷言** | 原#38相同輸入、formatter與combined predicate的獨立正式入口 |

後續新增的5個support files為Entry-Safe runner／preload／export-child、Canonical helper、Index authorized-wiring checker；均不是額外Suite。**本輪沒有新增正式測試。**

## 2. Registry／Umbrella與入口適用性

| 核對來源 | 查證結果 |
|---|---|
| package.json | 只有兩個opportunity audit/calibration scripts；未宣告統一npm test入口 |
| Entry-Safe registry | 固定5個reviewed CLI targets；沒有自動discover255套 |
| Entry-Safe runSuite API | 可明列standalone或exported-run、政策及全新evidence path；現有清單25個Suite有被接受的Entry-Safe profile證據，包含兩個真實FAIL |
| R6 Full manifest | 由S6既有JSON讀取固定227檔；manifest SHA-256仍為871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96；新增4套皆不在其中 |
| fast-check-smoke-test.cjs | Protected，只看metadata，內容／註冊方式未讀；不能假設新增Suite已加入它 |

目前255套中227套屬固定R6 manifest，另28套不在該manifest。把既有證據映射回227個身份，可列181 PASS／2 FAIL／44 UNVERIFIED；**這仍不是一次新的R6Full227結果**。

其餘Suite的Entry-Safe adoption沒有全部驗收；歷史可信standalone／exported run證據與「尚未跑過Entry-Safe」是不同欄位。CommonJS同步Node assert、明確main或run()可作候選；async assertions、未知自訂checker或ESM不能由exit0推定PASS。兩個UI原verify有reviewed V8 coverage，保留40／36次證據。沒有把require-only跳過main的舊exit0回填PASS。

部分R6 focused證據是in-process run()與structured summary，沒有套件專屬child stdout／stderr；原inventory中的重建CLI不是actual shell command，本輪保留該限制。[Command provenance](current-test-baseline-verification-v0.1-provenance-evidence.json)、[入口／registry source核對](current-test-baseline-verification-v0.1-source-review-evidence.json)

## 3. 歷史與目前Baseline差異

| 集合 | PASS | FAIL | UNVERIFIED | BLOCKED | 合計 |
|---|---:|---:|---:|---:|---:|
| 原Test Reliability Audit | 194 | 5 | 52 | 0 | 251 |
| 同一原251身份，目前 | 200 | 2 | 48 | 1 | 251 |
| 後續新增正式Suite | 3 | 0 | 0 | 1 | 4 |
| **目前合計** | **203** | **2** | **48** | **2** | **255** |

同一251中：Phase B讓原兩個FAIL與三個UNVERIFIED取得五套正式PASS；Repair A讓Opportunity-two由FAIL變為正式PASS。原protected smoke從UNVERIFIED改列本輪清單層BLOCKED，因禁止讀取／執行；沒有新執行失敗。新增4套中的Entry-Safe自測保留歷史25/25，但目前安全重跑條件BLOCKED，不能無條件列current PASS。

PASS需有真實入口及完整assertions的接受證據；FAIL需有正式執行失敗證據；UNVERIFIED沒有足夠目前適用的證據；BLOCKED有明確不能安全啟動的原因。BLOCKED是本輪inventory層分類，沒有修改Entry-Safe classifier；NOT RUN僅是本輪是否啟動的欄位。

| 證據時點／狀態 | 身份數 |
|---|---:|
| 本輪新執行PASS | 2 |
| 沿用歷史、輸入仍適用的PASS | 201 |
| 沿用歷史、輸入仍適用的FAIL | 2 |
| UNVERIFIED／BLOCKED，沒有本輪執行 | 48／2 |

沒有把所有Suite內checks相加當成255個入口，也沒有把Node assertion calls、Legacy pairs、Historical cases、diagnostic assertions或replay場數互換。

## 4. 重點證據適用性與正式修復

| 對象 | 採信結果 | 時點與原始來源 |
|---|---|---|
| Phase B Decision | **12/12 PASS** | [歷史standalone raw](test-infrastructure-sprint-0.1-phase-b-decision-evidence.json) |
| Phase B Interpretation | **10/10 PASS** | [歷史raw](test-infrastructure-sprint-0.1-phase-b-interpretation-evidence.json) |
| Phase B Adapter Integration | **11/11 PASS** | [歷史raw](test-infrastructure-sprint-0.1-phase-b-adapter-integration-evidence.json) |
| Phase B Intent Evidence | **10/10 PASS** | [歷史raw](test-infrastructure-sprint-0.1-phase-b-intent-evidence-evidence.json) |
| Phase B Signal Projection | **14/14 PASS** | [歷史raw](test-infrastructure-sprint-0.1-phase-b-signal-projection-evidence.json) |
| Repair A Opportunity-two | **40/40 PASS** | [正式修復後raw](test-infrastructure-sprint-0.1-repair-a-opportunity-two-formal-evidence.json)；只修必要三owner的VM manifest |
| Canonical Match Regression | **50/50 PASS** | [Sprint1正式raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-canonical-evidence.json)；88221／88222各2場 |
| Routine Commentary | **1/1原斷言 PASS** | [Sprint1正式raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-routine-evidence.json) |
| Game Record | **13/13 PASS** | [Sprint1既有回歸raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-match-game-record-evidence.json) |
| Ground Settlement Lifecycle | **26/26 PASS** | [Sprint1既有回歸raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-ground-settlement-evidence.json) |
| Source／Index exact contract Suite | **80/80 PASS** | [PhaseB正式contract raw](test-infrastructure-sprint-0.1-phase-b-index-caller-evidence.json)；只驗隔離source proposals |

前六項已具備正式test修訂及完整驗收證據：Phase B保留原pins與其餘source保護，只核准五Save／兩Index branches；Repair A保留原40 checks、fixture與能力／seed。這些正式修復可讓各自狀態更新，**不等於Production regression修復或所有測試全綠**。

與原Audit的945-file snapshot比較，只有上述五個Pitch正式test及Opportunity-two正式test的6檔bytes不同；其他原bytes相同，且這6檔有授權after／delivery與正式capture。原194個PASS中，兩套靜態dependency candidates涉及Opportunity-two變動，因此本輪保守補驗。其餘歷史復用保留source／依賴候選與動態解析限制，沒有僅按capture日期判失效。

部分Phase B raw宣告的hash superset含當時未修的Opportunity-two；本輪保留該drift，沒有聲稱所有宣告hash皆等於現在。它不屬那五套的被改動runtime輸入。80-case contract Suite則使用immutable baseline.originalSuiteSources＋allowedSource生成proposal，**不讀取或執行目前五個caller test檔**；其archive strings逐項與當時raw的caller hashes一致，material roots由raw／PhaseB baseline與delivery chain核對。[Freshness與4份exact snippets](current-test-baseline-verification-v0.1-source-review-evidence.json)

## 5. 本輪兩個Targeted執行與BLOCKED

在任何child前先exclusive-create[有界執行計畫](current-test-baseline-verification-v0.1-execution-plan.md)，明列必要性、兩個檔案、原67 checks及最多240秒hard cap。沒有依清單自動掃跑其餘Suite。

| 本輪standalone | 結果 | Elapsed | 成功Node assertions | Raw／witness |
|---|---|---:|---:|---|
| R4 Dependency | **44/44 PASS** | 9979.5607ms | 94 | [raw](test-infrastructure-sprint-0.1-current-test-baseline-verification-v0.1-r4-dependency-evidence.json)／[witness](test-infrastructure-sprint-0.1-current-test-baseline-verification-v0.1-r4-dependency-evidence-assertions.json) |
| R6 Exact Checker | **23/23 PASS** | 111.6832ms | 303 | [raw](test-infrastructure-sprint-0.1-current-test-baseline-verification-v0.1-r6-exact-checker-evidence.json)／[witness](test-infrastructure-sprint-0.1-current-test-baseline-verification-v0.1-r6-exact-checker-evidence-assertions.json) |

兩次actualCommand均為actual node.exe --require absolute entry-safe-preload.cjs absolute suite；exit0、stderr空、entryVerified／sourceStable=true。Raw保留完整command、env、stdout／stderr、exit／signal／elapsed、source before／after及assertion witness；原timeout120000ms／output16000000 bytes／implicit Git show30000000 bytes不變。合計2個Suite、67個具名checks、397個成功Node assertion calls；R6另有21個被assert.throws捕捉的預期拒絕，不能把observer thrown count當新Suite FAIL。R4回傳runtimeEnabled=false、candidateExecutionCalls=0。[Targeted results](current-test-baseline-verification-v0.1-targeted-execution-evidence.json)

| BLOCKED身份 | 明確原因與證據 |
|---|---|
| tests/fast-check-smoke-test.cjs | Protected；只能metadata核對，無內容／hash／執行。原Audit UNVERIFIED保持歷史，現在明列存取限制。 |
| tests/entry-safe-runner-test.cjs | Default development-1會撞既有child evidence，focused parent capture本身不存在；新label仍會在capture bookkeeping使用舊966-file／WIP guard，拒絕6個後來已授權test變動。未啟動本Suite、未產生新fixture／覆寫capture，歷史25/25及runner能力證據保留。 |

第二項不表示Entry-Safe runner失效：本輪兩個真實standalone與既有25個accepted profiles仍可用；阻礙在自測的舊capture／WIP epoch。只讀驗證無權修舊helper或重新定義其基線。[Blocked-entry review](current-test-baseline-verification-v0.1-blocked-entry-review-evidence.json)

初版清單曾錯述為parent capture碰撞；直接查證後更正為child captures，另產生final inventory，初稿capture保留、不覆寫。分類總數沒有改變；本報告只採final inventory。

## 6. 兩個仍FAIL與原Match #36–#38

### Match Foundation 2.2.2 — FAIL

[原正式standalone capture](test-infrastructure-sprint-0.1-critical-triage-match-original-evidence.json)真實通過35項，第36項combined predicate失敗。Current原test、runtime source與fixture輸入保持；本輪沒有重跑原Suite。缺陷為舊full-match fixture／環境契約：age10 debug未走合法高中entry、starter／entry metadata與實際lineup不等價，原33-module VM缺正式owners並走legacy synthetic。

前置隔離診斷在同次原finish觀測completed=false、Moment1=true、Moment3=false、defense4＝4、safety1401；反覆deepGrounder與fieldingWindow=-0.7使原能力無法以該synthetic resolver製造出局。**這些operand／機制是診斷證據，不是新的正式Suite結果，也未證明自然合法Production比賽無法完成。** [既有根因報告](critical-regression-triage-v0.1-root-cause.md)

| 原責任 | 原順序執行狀態 | 其他正式證據／仍缺 |
|---|---|---|
| #36完整combined | **歷史FAIL**，本輪未執行 | 新Canonical不要求固定1／3；不能將其PASS回填#36 |
| #37 seed88222 completed＋integrity | **原Suite未到達／UNVERIFIED**，被#36中止 | 新Canonical 88222獨立closure／state／Record與replay PASS；原assertion／callsite未改 |
| #38五個raw tokens不外露 | **原順序未到達／UNVERIFIED** | 新Routine Suite實際執行相同原#38整行1次PASS；不是原38/38 |
| 固定Moment3／S3 | **UNVERIFIED** | 前輪唯一合法候選沒有finalOffense及threshold後live player PA；本輪不新增候選 |

### Ability Performance Gradient — FAIL

[原正式standalone capture](test-infrastructure-sprint-0.1-critical-triage-gradient-original-evidence.json)失敗於 **Low tier can have a multi-hit game**；後續high-tier hitless assertion未到達。本輪沒有執行它、沒有調能力／seed／政策／樣本，也沒有依diagnostic分布將後續assertion改列PASS。

已確認的獨立問題是固定且相關cohort的 **STATISTICAL ASSUMPTION RISK**：尾端檢查用batting8／16各seeds1–20，固定match identity，詳細PA draws並非20份完全獨立情境；原first-legal政策的詳細pitch actions全取take。前置同批資料low multiHitFraction=0、高tier AVG較高，不能推出模型已校準，也不能把「事件有可能」改解為「固定20筆必須觀測到」。需要統計／決策政策契約裁決，未證實必須修改Production模型。[Gradient既有詳細證據](critical-regression-triage-v0.1-gradient-distribution-evidence.json)、[根因與限制](critical-regression-triage-v0.1-root-cause.md)

## 7. UNVERIFIED與Remaining Critical Regression Priority

48個UNVERIFIED逐套列於完整inventory，沒有用舊formal baseline、靜態source比較、console PASS、隔離診斷或其他Suite替代。其中與Match準備相關、仍缺目前可信Suite結果的例子：PlayingTime foundation、TeamRoster foundation／match integration、Scoreboard兩套、Third-out attribution兩套及runner integrity。這8個身份只是未知清單中的重點，**沒有在本輪擴大執行**。

| 優先級 | 現況／影響 |
|---|---|
| P1 — 原Match #36／S3契約 | 舊Suite確定FAIL，固定ID3責任未閉；新Canonical的正確責任已獨立，但不能宣告原conjunction替代完成 |
| P1 — Ability Gradient | 獨立正式FAIL，有限cohort／identity RNG／first-legal假設未裁決；不把它混入Match fixture修復 |
| P1 — Snapshot語義（Known Contract Gap） | completedMoment末筆混合舊inning及終局half／outs／score；Record正確不等於decision snapshot正確，語義仍待裁決 |
| P2 — Entry-Safe自測舊WIP epoch／未知Suite覆蓋 | 自測安全重跑BLOCKED、48套未知；不因此撤銷已有runner profiles，也不自動掃Full |
| 既有First-base timing | 功能42/42歷史證據保留；timing investigation仍open，本輪0次、不更新timing verdict |

沒有新增自然Production P0重現證據。優先級是後續處理順序，不是本輪新的Production bug定論或修復授權。

## 8. Match Vertical Slice測試準備程度

| 面向 | 準備程度 |
|---|---|
| 正式高中entry／SS具體位置／PlayingTime／名單／正式替補 | **有界CONFIRMED**，兩個固定seed皆合法替補 |
| 全場終局／逐tick state／Record／Save memory／Career／公開duplicates | **有界CONFIRMED**，88221、88222各首次及replay；不是browser storage或所有career |
| Routine presentation | **限定case PASS**，原#38同formatter／輸入／tokens |
| 固定Moment3、SS開賽先發、自然非零守備Moment | **UNVERIFIED**；0＝0及守備局數1不能當非零Moment coverage |
| Decision snapshot時間語義 | **KNOWN CONTRACT GAP**；Canonical50含4個gap witnesses，不是4個語義正確性PASS |
| 原38項完整執行／其他未驗Suite／browser lifecycle | **未完成**；原#36仍阻斷，Browser fixtures另13個UNVERIFIED |
| 整體Match Vertical Slice acceptance／Receiver v2啟動 | **NO／NO**；現有測試foundation可供下一輪有界審查，不能宣稱全部ready |

兩個Canonical比賽的Record hashes仍分別為abb6ee6487c8f39a3e3de3afe945f2494a374d9b78d6c6a6a358c9808dd6cf92、6af67e71aba581ac84fc5b215d6af1d9758f14852f8a1282081023a26d2f1ebc；本輪只核對既有正式captures，沒有新比賽執行。[Sprint1限定責任](match-contract-implementation-v0.1-sprint-1.md)

## 9. 後續最多兩個必要修復項目（未施工）

1. **原Match #36／S3剩餘驗收契約。** 先由Match／Moment owner裁決固定ID3在何種合法source-flow中應為必要結果，再決定原Suite責任如何正式轉移。保留原assertions、seed及能力；無合法證據就維持FAIL／UNVERIFIED。Snapshot仍另列Known Contract Gap，不能藏入fixture/helper改動。
2. **Ability Gradient統計／決策政策契約。** 明定固定cohort、PA identity draws及決策政策能驗證的性質；保持原失敗證據，不挑seed、不調能力、不加樣本直到PASS。若需修正式test或模型，必須另案具體授權。

這兩項是建議後續scope，並非本輪修復。BLOCKED入口與未知Suite若需擴驗，須另先列必要性、明確檔案及預估，不在此自動擴張。

## 10. Git／WIP Integrity、證據限制與停止

開工與結案main／HEAD／main ref／origin/main tracking ref均為指定Commit，index空；未fetch，未向遠端server重新查證。先核對Sprint1 baseline1521個hash、delivery30 entries及delivery自身，建立本輪 **1552個既有可讀檔案SHA-256**；結案全相同，包含全部前置WIP及captures。原Production WIP與六個已授權正式test修訂完整保留，**本輪delta0**。[Baseline](current-test-baseline-verification-v0.1-baseline-evidence.json)、[Closeout](current-test-baseline-verification-v0.1-closeout-evidence.json)、[Delivery](current-test-baseline-verification-v0.1-delivery-evidence.json)

12個protected paths只核對Git status、size／mtime，未讀、hash、執行或修改內容；metadata一致不是內容hash證明。全部新captures及報告exclusive-create，沒有覆寫原capture；新增僅docs內offline inventory／source review／capture utilities、獨立兩次raw／witness及報告，沒有新增正式test。

Codebase-memory Tier2用於registry、entry分類、R6 full與自測依賴的targeted查證，4份material snippets逐行對照current source。清單以實際filesystem及原audit身份重建，不靠graph零caller推斷不存在。Coverage分批查證及direct read／hash補證；reported partial範圍直接讀取。Graph metadata_changed／not_tracked不作freshness／完整性證明；動態dependency closure不宣稱全域窮盡。[Source review](current-test-baseline-verification-v0.1-source-review-evidence.json)、[Coverage](current-test-baseline-verification-v0.1-coverage-evidence.json)、[Verification](current-test-baseline-verification-v0.1-verification-evidence.json)

未執行Full251／R6Full227／First-base timing／Browser全套，Receiver v2未啟用。沒有Reset／Clean／Stash／Stage／Commit／Push，沒有更改registry或Production以取得綠燈。

| Gate | 結案 |
|---|---|
| 目前可信Baseline清單 | **COMPLETE：255身份，203 PASS／2 FAIL／48 UNVERIFIED／2 BLOCKED** |
| 本輪新執行 | **2 suites、67 checks PASS；不是全清單實跑** |
| 原Match／Gradient／S3／Snapshot缺口 | **保留，不修復、不改列PASS** |
| 全部測試Green／Match Vertical Slice整體ready | **NO／NO** |
| Ready for Commit／Ready for Sprint10B | **NO／NO** |
| Receiver v2 | **DISABLED** |

完成後立即停止，等待人工審查；沒有自動進入任何修復、擴驗或下一個Sprint。
`;
fs.writeFileSync(path.join(C.root,C.report),md,{flag:'wx'});console.log(JSON.stringify({report:C.report,status:i.counters.status,readOnly:true,stopAfterReporting:true}));
