# Receiver Execution v2.2 — Production Snapshot, Version Pin & Save Guard / Sprint 10A.3b

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
施工基線：`ab3117653945de0b7013636187c446276a96e634`

**本輪未通過驗收，Ready for Commit＝NO。** 有界 source-only 接入已形成 WIP，但相關回歸發現一項原 PASS→FAIL：`career-save-admission-test.js:372` 的 saveGame source contract。另一個 first-base suite 被新 runner 的120秒 timeout 中止，最終結果未知。依使用者附件第10節「若新增 Production regression，停止，不得宣布 Sprint PASS」停止施工／後續驗收；完整227 manifest 未啟動。沒有 Stage／Commit／Push，沒有啟用接球v2或Shadow。[Blocker evidence](receiver-execution-v2-sprint-10a3b-blocking-regression-evidence.json)

## A. Baseline / Protected WIP

main／HEAD／origin/main 均保持指定基線，index 空。開始只有 protected smoke 修改與11個原untracked；本輪未讀取、hash、執行、修改、Stage、Reset/Clean/Stash 這12個 protected 內容，只核對status／size／mtime。[Baseline](receiver-execution-v2-sprint-10a3b-baseline-evidence.json)

749個開始時可讀tracked檔案中，4個核定Production入口有修改；其餘745個hash不變，包含原v2.1/v2.2 contracts、既有tests、三項Debt與所有先前captures。Protected status/metadata保留，不是protected content hash證明。

## B. Actual Owner → Minimal Change → Invariant

施工前使用codebase-memory Tier2：symbol search、both depth1 CALLS、full snippets、coverage與當前source。12個owner traces，Save snippet兩頁12–511/512–628；metadata_changed/no_recorded_issue不代表freshness或完整性。[Pre-edit architecture](receiver-execution-v2-sprint-10a3b-initial-architecture-evidence.json)

| Actual Owner / Changed File | WIP最小變更 | 必須維持／已觀測檢查 |
|---|---|---|
| `ensureHighSchoolOrdinaryGroundBallInPlayHandoff` / script.js | fresh supported SS-primary空壘/NPC1B建立snapshot；existing同球只驗證重用 | sample前、原physical/roster/runner；沒有第二個handoff owner |
| automatic/meaningful entry / script.js | create/begin入口及resolveInfieldDecision先驗source metadata | automatic先執行、不強造玩家decision；occupied meaningful維持Legacy |
| SS Legacy cache / script.js | 原cache建立後保存独立source binding | 原sample/binary64/264 canonical ID；不改舊cache或out |
| `MatchSituationLifecycle` | context/top/execution pin明列保留；binding/closed summary新增metadata copy | beginExecution replacement不丟pin；不加transition或evaluation |
| `normalizeSave` / save.js | defaults/merge前raw source-format validation | 新格式缺失/版本/copy拒絕、historical omission不backfill |
| shared decision-throw guard / script.js | 第一行驗snapshot/pin/cache copies | 在firstBase/3B/missingfacts/settled early return之前 |
| `receiver-source-snapshot.js`（新增） | raw source schema/pin/binding/observer/Save serializer | 沒有Pure.execute、stage resolver、RNG、Settlement/record calls |
| index.html | 在lifecycle前載入source-only adapter | 不載入v2.2 Pure、不啟用接球模型 |

index.html的一行是必要adapter載入。沒有修改Runner Settlement/Force/Third-Out、Scorer/GameRecord/Evaluation或SS/2B/3B/1B成功率／責任區公式。

## C. Source Snapshot / Version Pin Contract（WIP）

唯一建立位置仍為原handoff owner，在supported contact/runner/roster建立後、classification/beginExecution/sample之前。Allowlist為新SS primary、空壘、outs0/1/2、原active SS=player、NPC1B及direct/hold surface。其他機會維持Legacy、不新增snapshot。

`groundBallInPlayState`保存 `receiverSourceFormatVersion`、`receiverSourceSnapshot`、`receiverSourcePin`；match的`receiverSourceAdmission`保存一致副本/reference，供當前與後續機會保存原source pin。body保存原match/PA/contact/physical/play、outs/bases、actor role/position、batter-first obligation、fixed primaryThrow、raw capability/source reference、source provenance与missing reasons。

版本分離：`sourceSnapshotVersion=receiver-source-snapshot-v2-2`；source contract描述`receiver-pure-stages-v2-2`/UTF8 sampler/contact timing，但 `officialReceiverExecutionVersion=legacy-infield-execution-v1`、`officialExecutionOwner=existingLegacyOwner`、runtimeEnabled=false。這些欄位不使正式結算改用v2。

Formation仍C／insufficient；沒有使用nominal假位置。共同contact-global clock、independent demand/duration/touch、capability/ordinary-effort calibration也未產生正式來源。Raw能力A_OR_C保存原值/null，不以alias假稱四個獨立新能力。Snapshot/pin深凍結；pending沒有sample。

一致性checksum為明示`fnv1a32`，不是authentication或SHA-256證明；另外比對整份body/copies與原PA/handoff/cache/roster來源。不能承諾識別任意同時重寫所有Save來源與格式版本的惡意偽造。

原Legacy SS cache產生後，独立`receiverSourceExecutionBinding`綁original sample binary64、原canonical ID、route、nullable actual receiver/target、release與pin。Hold不能由planned actor補actual；acquisition failure沒有canonical throw。Observer只回identity/actor/pin、availability/missing reasons，不製造receive/hands/touch/candidate。

## D. Lifecycle / Save Guard Matrix（WIP，非最終PASS）

| State / Entry | 接入內容 | 限制 |
|---|---|---|
| created/pending | contextSnapshot與top-level保存pin；same physical snapshot重用 | 真正舊省略保留，不重admit |
| beginExecution | replacement的executionState明列保存pin | 先驗pin/copies，再走原transition |
| Legacy executed | source binding分開保存於handoff/active metadata | 不改executionEvidence／正式cache權威 |
| settled/closed | 原settle/close，summary保存pin/binding | 不重記record/Evaluation |
| Raw old15 | 沒有新tags時走原owner | 不根據缺欄位造新source |
| Source-only wire16 | Save owner serializer寫`receiver-source-only-save-v1` root header；raw guard先驗 | 該序列化接入正是目前source contract regression blocker |
| 16缺tags／unknown／copies矛盾 | 明確拒絕，不fallback | Header與格式版本是Save owner識別，不是caller history label；不是authentication |
| Future actual v2 execution | explicit not implemented/reject | 本輪沒有v2 executed/settled Save驗收 |
| Shared early returns | metadata先驗，再進firstBase/3B/missingfacts/settled原分支 | 新tag不因family或settled跳過 |

後續普通新match若沒有source admission，serializer提案回原15格式，沒有改舊receiver pin。這項Save envelope設計未通過既有source invariant，必須先審查修正接入方式，不得把它稱為正式新Save Compatibility PASS。

## E. Observed Tests / Non-Interference

[Observed validation](receiver-execution-v2-sprint-10a3b-observed-validation-evidence.json)明分初步tool結果與最終未驗收source：

- 新focused最初 **108/108 PASS**，包括pre-sample/Unicode/264ID、pin reuse、original actors、routine/meaningful其他route、nullable hold、tamper、Save/lifecycle、no RNG/no candidate。
- 新baseline/current比較最初 **25/25 pairs**；真正baseline保存的pending/executed/settled三種historical states亦相容。比較完整player/Match、roster、raw cache、RNG callback count/order/value、outs/bases/runs/cursor、GameRecord/E/A/H/FC、Evaluation/experience、cold/duplicates；只排除明列source metadata與root Save envelope16→15差異。
- 原v2.2 **155/155**、S8/9/10A.1/10A.2 **460/460**最初通過。[Initial compatibility](receiver-execution-v2-sprint-10a3b-initial-compatibility-evidence.json)
- 相關套件 **14 PASS／1 FAIL／1 timeout**；S5 scorer79+33=112、S6 safety52均通過。[Related regression](receiver-execution-v2-sprint-10a3b-related-regression-evidence.json)
- 補充Lifecycle／Ground Settlement／Multi-runner三套 **3/3 PASS**。[Lifecycle regression](receiver-execution-v2-sprint-10a3b-lifecycle-regression-evidence.json)

108 focused與25 pairs只保存tool stdout summary，沒有宣稱已完成final完整named-row/pair capture。後續在失敗結果回傳前新增了原cache副本/identity lineage及future-tag guard；**最終source沒有重跑這些有界Green**。失敗觀測後沒有再修改程式，不用早期Green放行目前WIP。

合法Production沒有建立meaningful空壘SS fixture；以原共同handoff及occupied SS/2B/3B/1B meaningful入口驗guard，該空壘meaningful情境未宣稱覆蓋。所有candidate execution observed=0，不是Shadow/cohort驗收。

## F. Blocker / Required Follow-up

`career-save-admission-test.js:372`直接要求 `save.js`保留既有literal `localStorage.setItem(SAVE_KEY, JSON.stringify(player))`，SAVE_VERSION=15與SAVE_KEY不變。本輪改為source-aware serializer expression後該source check失敗；不是三項Baseline Debt。既有test bytes沒有修改。後續應審查可保留原Legacy storage branch/source contract的source-only序列化接入，**不能改test換PASS**。

`first-base-receive-active-ground-production-integration-test.js`在runner120秒限額被中止（ETIMEDOUT）。最後stdout已印出原200 canonical 1B entry games PASS，但整套沒有final exit verdict；不將timeout假稱PASS或直接當球場結果回歸。

完整227尚未執行；既有224/227 PARTIAL/三Debt只是基線，不能本輪重現或宣告同集合。需先解source contract blocker與timeout結果，重新完成focused/相關回歸，再執行最終manifest；本次依指定stop trigger沒有繼續。

## G. Final Gate

| Gate | 停工時結果 |
|---|---|
| Production Snapshot Authority | **PARTIAL**：WIP已接唯一owner，初步有界驗證，非final acceptance |
| Physical/Actor/Fixed Slot Binding | **PARTIAL**：初步通過，最後refinements未再驗 |
| Pre-execution Version Pin | **PARTIAL**：初步sample前/pin reuse證据，未final |
| Routine/Meaningful Coverage | **PARTIAL**：routine與合法其他meaningful；沒有造空壘meaningful |
| Lifecycle Retention | **PARTIAL**：source-only初步三階段/closedcopy通過 |
| Raw Save Format Guard | **FAIL acceptance gate**：guard WIP有界測試通過，但serializer違反既有Save source contract |
| Shared Early-return Guard | **PARTIAL**：有界初步覆蓋，final未驗收 |
| Historical Save Compatibility | **未final驗收**：3種基線state初步PASS，相關Save套件FAIL |
| Source-only Diagnostics | **PARTIAL**：read-only有界證據，非full readiness |
| RNG Non-Interference | **未final驗收**：25 pairs初步相同 |
| Match/Record/Evaluation Non-Interference | **未final驗收**：25 pairs初步相同 |
| Focused Tests | **108/108初步PASS；final未重跑** |
| Prior Focused Regression | **155+460+112+52＝779初步PASS** |
| Full Repository | **NOT RUN**，blocker先觸發；原227 manifest已核對且不含protected |
| New Production Regression | **1 confirmed source-contract FAIL；另1 timeout unresolved** |
| Production Source Acceptance | **PARTIAL**：formation/clock/demand/touch仍缺源 |
| L03 | **PARTIAL** |
| Ready for Sprint 10B | **NO** |
| Ready for Commit | **NO** |

停工時完整path/hash/whitespace/Git保存見[Stop evidence](receiver-execution-v2-sprint-10a3b-stop-evidence.json)。保留未提交WIP供人工審查；未啟用v2、未開始10B/11或Defensive Foundation Closeout。
