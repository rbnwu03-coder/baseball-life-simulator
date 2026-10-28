# Receiver Execution v2.2 — Cross-Play Guard Integrity & Regression Recovery / Sprint 10A.3b-R3

專案：Baseball Life Simulation（棒球人生）

日期：2026-10-14（Asia/Taipei）

正式基線：`ab3117653945de0b7013636187c446276a96e634`

**R2 的 `non-JSON metadata` 根因已確認並修復；Full Repository 在第34/227套發現另一項基線 PASS→WIP FAIL，已立即停止。Ready for Commit＝NO，Ready for Sprint10B＝NO。** 本輪只修改 `receiver-source-snapshot.js` 的 metadata guard；`script.js`、Save、Lifecycle、index 與全部原有 tests／captures 保持開工時 bytes。Receiver v2 仍 DISABLED，L03 仍 PARTIAL。

## A. Git / Protected WIP Baseline

main／HEAD／origin/main 都是指定 Commit，index 空。[R3 baseline](receiver-execution-v2-sprint-10a3b-r3-baseline-evidence.json) 保存796個開始時可讀 tracked／WIP／capture SHA-256；其中既有R2 baseline的782項全部相符。R2之後新增的14項也納入本輪保護。

12項 protected paths（smoke、install.ps1、Sprint3／4／5中間證據）只核對Git status及size／mtime，沒有請求讀取、hash、執行或修改內容。這是metadata保護證據，不是protected content hash證明。

Sprint10A.3b、R1、R2原始WIP與captures完整保留，R3使用獨立新檔。沒有Reset／Clean／Stash／Stage／Commit／Push。

## B. Captured Root Cause Operands — CONFIRMED

診斷先於Production修復：依原gradient的fixture及執行順序，在 `baseballSkills.batting=8, seed=20` 捕捉實際失敗。只在isolated VM的 `same()` 加入失敗operand type／presence observer；Production bytes未改，observer未吞掉例外。[Root cause capture](receiver-execution-v2-sprint-10a3b-r3-root-cause-evidence.json)

| Operand | 實際值／狀態 |
|---|---|
| Current match | `hs-y3-final-competition-1` |
| Current play | 第3局上，opponent-player-08，`truefalsefalse`，ground-defense |
| Current full identity | matchId、PA、contact、physicalIdentity及playId都指向第3局該play |
| Archived admission／summary | 第2局上，opponent-player-06，`falsefalsefalse`，另一個完整physical identity |
| Match／archived format | `receiver-source-snapshot-format-v1` |
| Current state format／snapshot／pin | 均沒有own field；format type為 `undefined` |
| Current execution | shortstopExecution存在，settlementApplied=false，active lifecycle=executing |
| Current binding | 沒有own field，實際value type為 `undefined` |
| Archived summary | lifecycle=closed，有pin及object binding |
| Failed equality | left=archived binding object；right=current binding `undefined` |
| Throw site | 原 `validateMatch:165` → `same` → `canonical(undefined)` |

因此是**已closed的source play archive，被錯誤地拿來比較下一次occupied-base Legacy execution**。不是同play必要binding缺失，也不是fixture標成Historical以繞過新版本驗證。

[Compact metadata replay](receiver-execution-v2-sprint-10a3b-r3-reproduction-evidence.json) 只保存驗證所需source metadata、identity、presence及lifecycle，沒有整份Match／GameRecord dump。R3 focused以相同operands證明原R2 validator會throw、修復後會ACCEPT；[原validator snippet](receiver-execution-v2-sprint-10a3b-r3-original-validator.json) 保留。

## C. Same-play / Cross-play State Matrix

| 狀態 | Guard規則／本輪結果 |
|---|---|
| 同play，完整Snapshot／Pin／Binding | ACCEPT；pending、executed、settled／closed皆驗證 |
| Pending，binding尚未產生 | ACCEPT；schema允許absence，不建立binding |
| 已execution，同play必要binding缺失或undefined | REJECT，明確required錯誤；不呼叫canonical(undefined) |
| 同playbinding被修改 | REJECT，重建原Legacy binding後比較 |
| actor或完整physical identity矛盾 | REJECT；match／PA／contact／physical／play五欄皆涵蓋 |
| 前一source play已closed，下一play真正Legacy | ACCEPT；archive自行驗證，不拿不同play的binding做equality |
| 前一source play已closed，下一play有新source admission | 各自驗證current admission與archived pin／binding；合法pair ACCEPT，archive tamper REJECT |
| Genuine Historical omission | ACCEPT；正式基線owner產生的pending／executed／settled三種資料不backfill |
| 新格式必要tag缺失、undefined或版本未知 | REJECT；以own-field與版本判斷，不能靠falsy當Legacy |
| 新格式嘗試移除Save header降級 | REJECT；沿用raw Save版本／格式guard |
| Archived pin與current physical不同 | 驗證closed lifecycle、match／situation關係、pin checksum及archive binding自身；不跨play比較current binding |
| 新格式非JSON或循環metadata | REJECT，`Invalid receiver source metadata: ... required/non-JSON metadata` 明確指出欄位 |
| First-base／3B／missingFacts早退 | Shared source guard先驗證；tamper仍REJECT |

## D. 最小修復 / Source Diff

唯一既有檔案變動是 [receiver-source-snapshot.js](../receiver-source-snapshot.js)。檔案由205行變為242行（含末尾空行計數），淨增37行；沒有修改schema版本、source producer、原gradient assertions或seed。

`currentPhysical()` 使用matchId、plateAppearanceId、contactId、physicalIdentity、playId的完整tuple。新格式current handoff必須與admission同physical；active／closed副本只有在完整identity確定相同且execution需要binding時才比較。必要binding缺失先REJECT。Archive pin保留checksum及版本檢查，archive binding對自己的pin／physical／snapshot／Legacy owner驗證。

`canonical()`與`same()`語義保持原狀；`assertJson()`把非法metadata轉成明確驗證錯誤，catch之後仍reject。沒有catch當PASS、刪除Snapshot或archive驗證、升級全部Legacy Match，也沒有新增candidate execution、RNG、settlement、record或Evaluation consumer。

[Source change evidence](receiver-execution-v2-sprint-10a3b-r3-source-change-evidence.json) 保存修復前後完整source及SHA-256。修復前bytes由唯讀重建後，必須精確符合開工hash才可寫證據：

- Before：`d049f98bdbaece9aed3aa16469167a2b3120d8f9078c0d3571bef0fb04510ceb`
- Final：`4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274`

## E. Final-source Regression Order / Tamper Evidence

下列驗證全部使用同一份鎖定的R3 final source，按授權順序完成。沒有在gate之間再改Production。

| 順序 | 實際執行結果 | Evidence |
|---|---|---|
| 1. R3專屬focused | **40/40 PASS** | [focused](receiver-execution-v2-sprint-10a3b-r3-focused-evidence.json) |
| 2. 原gradient | exit1；新例外消失，回到原 `Low tier can have a multi-hit game` assertion；14,449.60ms | [gradient](receiver-execution-v2-sprint-10a3b-r3-gradient-evidence.json) |
| 3. Career Save Admission | **45/45 PASS** | [Career Save](receiver-execution-v2-sprint-10a3b-r3-career-save-evidence.json) |
| 4. Sprint10A.3b focused | **108/108 PASS** | [Production focused](receiver-execution-v2-sprint-10a3b-r3-production-focused-evidence.json) |
| 5. R1 Save focused | **19/19 PASS** | [Save focused](receiver-execution-v2-sprint-10a3b-r3-save-focused-evidence.json) |
| 6. Legacy comparison | **25/25 pairs＋3/3 historical PASS** | [Legacy](receiver-execution-v2-sprint-10a3b-r3-legacy-evidence.json) |
| 7. Related Lifecycle／Ground／Runner等 | **17/17 suites PASS**；加上Career Save為18/18相關suites | [related](receiver-execution-v2-sprint-10a3b-r3-related-evidence.json) |
| 8. v2.2／Pure／Admission／Authority／Timing相容 | **615/615 PASS**（155＋91＋151＋122＋96） | [compatibility](receiver-execution-v2-sprint-10a3b-r3-compatibility-evidence.json) |
| 9. WIP first-base180 | **42/42 PASS** | [first-base](receiver-execution-v2-sprint-10a3b-r3-first-base-current-evidence.json) |

Focused合計為**782/782**（40＋108＋19＋615），Legacy的25pairs與3historical另列。Career的45checks、17套related與first-base42另列，避免混用suite／pair／check總數。

R3專屬測試涵蓋required／undefined／tampered binding、五項identity、actor、unsupported version、nonJSON／cycle、archive自身tamper、連續ground opportunities、automatic routine、meaningful occupied-base、duplicate、cold Save，以及early-return guard。兩個完整game在seed19／20完成且candidate trap＝0。Observer／guard／duplicates前後完整Player／Match／RNG snapshot相同；25pairs另比較原sample、callback順序和值、Match RNG、record／Evaluation等正式投影。

這些是有界fixtures及原owner的non-interference證據。不能由此宣告整個WIP已通過全repository，或推論source模型／效能改善。[Gate capture](receiver-execution-v2-sprint-10a3b-r3-gates-evidence.json)

## F. First-base180

本輪guard位於shared驗證途徑，依指示重跑WIP first-base，維持原direct Node command、180000ms／16000000-byte buffer、原42checks及兩組200場canonical cohorts；沒有減少場數或改fixture／helper bytes。

WIP exit0，**42/42 PASS，98,802.48ms**，完整stdout／stderr與R2 baseline180相同。Baseline使用R2既有92,359.80ms的有效capture，沒有新baseline執行。相較該次baseline差6,442.68ms，低於R2明列的調查門檻；單次跨輪elapsed不是統計效能保證。

## G. Full Repository — One Invocation / STOPPED at34

所有相關gate通過後，啟動唯一一次原227manifest。成員／順序／全部test bytes未變；first-base不插入manifest。`JSON.stringify(files)` SHA-256＝`871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96`。原 `node -e` Git-show buffer wrapper、180000ms／30MB完全保留。

| 結果 | 實際範圍 |
|---|---|
| Executed | **34/227** |
| PASS | **31** |
| Existing Debt同原因重現 | **2** |
| New baseline-PASS→WIP-FAIL | **1** |
| 剩餘NOT RUN | **193** |
| Timeout／spawn error | **0** |

第34項 `tests/bbp-b1-ground-ball-production-integration-test.js` 在83.26ms以exit1失敗：

```text
ReferenceError: TeamRosterFoundation is not defined
  at ensureHighSchoolOrdinaryGroundBallInPlayHandoff (script.js:5337:36)
  at prepareHighSchoolDefensiveMomentFromSimulation
  at __bbpB1Prepare
```

原formal baseline該套exit0；test SHA-256在baseline／本輪均為 `c2e4b0cdf315d29ac9af2dc7cce6a1c9645f1e1ca67f9d521bce603d0a395036`。這不是原三項Debt之一。[Full capture](receiver-execution-v2-sprint-10a3b-r3-full-repository-evidence.json) 保存每套actual command／policy／stdout／stderr／exit／elapsed與剩餘清單。

發現後立即停止，沒有第二次manifest、重跑失敗suite、擴張診斷fixture或再修Production。

## H. New Blocker — Read-only Review

原BBP-B1 test以固定 `runtimeFiles` 建立VM，其中沒有 `team-roster-foundation.js` 或 `receiver-source-snapshot.js`。目前 [script.js:5337](../script.js#L5337) 的source-admission block先計算 `sourceSs`／`sourceFirst`，再進入 `typeof ReceiverSourceSnapshot` 及SS空壘eligibility條件，故這個保留的WIP會在該VM觸發缺少global的ReferenceError。

該source block不在formal baseline中；`script.js`與R3開工hash完全相同。本輪只修receiver metadata guard，這項exception在R2停止於第1套時尚未被觀測。**R3無script delta不能把此baseline PASS→WIP FAIL改列Existing Debt。**

以上只做source／test及captured stderr的唯讀核對；沒有另取新runtime operands或宣称完成BBP-B1修復。[Blocking evidence](receiver-execution-v2-sprint-10a3b-r3-blocking-regression-evidence.json)、[blocker architecture](receiver-execution-v2-sprint-10a3b-r3-blocker-architecture-evidence.json)

## I. Existing Debt Comparison

| Formal baseline Debt | R3 full實際結果 |
|---|---|
| ability-performance-gradient：Low tier can have a multi-hit game | 第1套exit1；原assertion同原因重現，新nonJSON exception消失 |
| baseball-match-foundation-2-2-2：36. full match | 第17套exit1；原assertion同原因重現 |
| high-school-year-one-opportunity-two：DefensiveDecisionThrowFoundation is not defined | **NOT RUN** |

本輪同原因重現2/3，另一項未跑。新BBP-B1 exception不能合併到第三項不同module／owner的ReferenceError。不能報224/227、三項Debt全重現或完整failure-set一致。

## J. Integrity / Coverage

796項原有可讀檔案中，**795項hash不變，唯一變動為receiver-source-snapshot.js**。原4個Production WIP、Save修復、原test bytes、10A.3b／R1／R2 captures均保持。Protected size／mtime及Git index保持；新檔清單、hash、whitespace與每套primary failure reason比較見 [closeout evidence](receiver-execution-v2-sprint-10a3b-r3-closeout-evidence.json)。

Discovery依codebase-memory Tier2使用search、雙向depth1 traces及exact snippets；動態guard跨module關係另由actual stack驗證。329個manifest／browser-script／helper／R3 source paths的coverage分4頁全部取完，另核對review utility／blocker paths。Graph freshness訊號有metadata_changed／not_tracked，故主要結論皆以當前磁碟／hash／實際capture查證；no_recorded_issue不是完整性保證。[Architecture](receiver-execution-v2-sprint-10a3b-r3-architecture-evidence.json)、[coverage](receiver-execution-v2-sprint-10a3b-r3-coverage-evidence.json)、[extra coverage](receiver-execution-v2-sprint-10a3b-r3-extra-coverage-evidence.json)

## K. Final Assessment

| 項目 | R3結果 |
|---|---|
| Root Cause | **CONFIRMED**，已捕捉actual undefined operand與cross-play identity |
| Cross-play Guard | **PASS，限R3 matrix／fixtures** |
| Same-play Tamper Rejection | **PASS** |
| Gradient New Exception | **RESOLVED** |
| Gradient Original Debt | **REPRODUCED** |
| Career Save Contract | **PASS，45/45** |
| First-base180 | **PASS，本輪WIP42/42，R2 baseline引用** |
| Focused | **782/782 PASS**；各組實跑數明列 |
| Legacy | **25/25 pairs＋3/3 historical PASS** |
| Related | **17/17 suites PASS，Career另列** |
| Full Repository | **FAIL／STOPPED，34/227執行，193 NOT RUN** |
| New Regression | **1 observed，BBP-B1 TeamRosterFoundation exception** |
| Receiver v2 | **DISABLED** |
| L03／Production Source Acceptance／CRT／Capability／Ordinary Effort | **PARTIAL** |
| Sprint10A.3b Production Source-only Integration | **NOT PASS，新的full blocker** |
| Ready for Sprint10B | **NO** |
| Ready for Commit | **NO** |

完成停工結案，保留修復與全部WIP／captures，等待人工審查。沒有開始Sprint10B、11或Defensive Foundation Closeout。
