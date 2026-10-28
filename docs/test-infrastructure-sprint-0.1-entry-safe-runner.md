# Test Infrastructure Sprint 0.1 — Entry-Safe Runner Foundation

專案：Baseball Life Simulation（棒球人生）  
日期：2026-10-14（Asia/Taipei）  
正式基線：`ab3117653945de0b7013636187c446276a96e634`

**Entry-safe foundation驗收PASS：隔離驗證25/25，正式source不變的5套target得到4 PASS＋1預期Save freeze FAIL。** 兩套UI以原自訂`verify()`的V8 coverage確認40／36次實際檢查；adapter integration以standalone入口真正執行，原Save freeze仍FAIL。沒有full251／R6 full227或first-base invocation。Ready for Commit＝**NO**，待人工審查。

## A. Baseline / WIP保護

main／HEAD／origin/main tracking ref等於指定Commit，index空；未fetch。核對R6與Test Reliability Audit delivery，開工記錄**966個可讀既有檔案SHA-256**，包含Audit的21個交付。[Baseline](test-infrastructure-sprint-0.1-baseline-evidence.json)

结案966個原hash全部相同，Production與正式test delta均為0。12個protected paths只核對Git status、size／mtime，沒有讀取、hash、執行、修改或Stage內容；這是metadata保護，不是protected content hash證明。新captures及witness在execution前拒絕existing target，寫入使用exclusive-create。[Closeout](test-infrastructure-sprint-0.1-closeout-evidence.json)

保留全部WIP、fixtures、seeds、pinned references、R6及Audit captures；沒有Reset／Clean／Stash／Stage／Commit／Push。原S6／R2／R4／R6 runners的bytes也保持；新增入口供後續審查使用，沒有覆蓋歷史wrapper或回寫舊PASS。

## B. 最小實作 / 檔案

| 新檔 | 責任 |
|---|---|
| [entry-safe-runner.cjs](../tests/entry-safe-runner.cjs) | 明列5個已審核target、entry mode、逐套policy、child execution、classification及exclusive raw evidence |
| [entry-safe-preload.cjs](../tests/entry-safe-preload.cjs) | Child-only同步Node assert observation、兩套自訂checker的V8 coverage及最小Git show相容 |
| [entry-safe-export-child.cjs](../tests/entry-safe-export-child.cjs) | 只呼叫明列的`run()`，記錄完成／summary及原error |
| [entry-safe-runner-test.cjs](../tests/entry-safe-runner-test.cjs) | 25個隔離驗證；產生獨立小fixtures，沒有改原Gameplay fixtures |
| [Sprint capture utility](test-infrastructure-sprint-0.1-capture.cjs) | Baseline／integrity／exclusive bookkeeping，不自動發現或執行套件 |

其他新檔為本報告、各次raw logs／assertion witnesses、coverage、isolated fixture sources與delivery hashes；完整path清單在closeout／delivery evidence。這個foundation沒有新增full manifest、全repository discovery、Save manager或第二個Production owner。

## C. Entry行為與證據

| 行為 | 原full wrapper | 新入口 |
|---|---|---|
| Standalone | `node -e wrapper absoluteSuite`後`require()` | `node --require entry-safe-preload.cjs absoluteSuite`；原suite成為main |
| `require.main === module` | False，可能main未執行仍exit0 | Witness核對main filename及主入口load；實際assertion／custom checker證據另驗 |
| Exported tests | 不保證呼叫run | Registry／API明列exported-run；child只調用`run()`，不猜function name |
| PASS | 可能只採信exit0 | 必須entry可確認、完整退出、source穩定、有可信assertion evidence；exported summary亦須有效 |
| 沒有assertions但印PASS | 可能Green | UNVERIFIED |

Node `assert`／`node:assert`及strict aliases在child中由proxy觀測同步呼叫，保留原參數、this、return與同一個thrown object。證據包括attempt／success／throw counts、method及有限call-site samples；只算test／declared fixture範圍，runner自己的assertions不作套件PASS證明。

自訂UI `verify()`沒有Node assert calls。對這兩個原suite，registry固定原完整test hash、unique function fragment與expected40／36；V8 precise coverage核對實際target script、function offsets與calls。**原source沒有rewrite、原verify沒有替換**。兩套throw分支range count均0，source及依賴保持，exit0；這些共同構成PASS，並非只相信stdout的40/40。

Assertion witness透過獨立繼承fd寫入exclusive檔案，包含nonce、actual main、export完成、error及coverage。Missing／invalid witness、錯誤entry、source變動、timeout／spawn／environment問題都不能成為PASS。資料不完整時保守列UNVERIFIED；這不是對惡意套件的安全sandbox。

## D. Git Buffer / Policy

Preload只對**`execFileSync('git', ['show', ...])`沒有明列maxBuffer**的calls設定30000000 bytes。Explicit buffer（包含小buffer）與非Git calls完全沿用原options；没有改pinned內容、comparison語義、Commit或test assertion。

一般suite child仍120000ms／16000000 bytes。First-base policy函式維持既有180000ms例外，但本輪未執行first-base；没有增加全域timeout／output buffer。隔離timeout fixture另明列500ms；focused driver自身30秒只界定這組小測試，不是Production suite新policy。

相容fixture比較formal `git show ...:script.js`的完整**1,070,296 bytes及SHA-256**；disabled control真的ENOBUFS／UNVERIFIED，enabled control PASS。Explicit1024-byte Git buffer及non-Git1024-byte buffer都保持原失敗，由原`assert.throws`驗證，沒有被override。

## E. Classification

| Status | 實際採用規則 |
|---|---|
| PASS | 正確entry、成功完整退出、source hashes穩定，且有觀測的同步assertion或經review的完整custom checker coverage；有效exported summary無failed |
| FAIL | 正確entry報assertion／runtime／exported summary的確認失敗；expected negative suite仍標FAIL |
| UNVERIFIED | Entry／witness未確認、沒有assertion證據、未完成export、invalid／empty summary、未觀測async API、timeout／spawn／environment／output中斷或source變動 |
| NOT RUN | 明確未啟動；沒有捏造command、exit、elapsed或assertion evidence |

Negative assertion tests可能在內部捕捉預期throw，例如R6 exact checker有21次expected rejection；不能將observer的throw count直接當suite FAIL。反之failed summary不能因exit0／已有部分success而變PASS。環境判斷使用actual error code；AssertionError訊息帶ENOBUFS文字仍正確為FAIL。

每個child evidence保存suite、entry mode、actual command、Node／env、exit／signal／spawn error、child elapsed、timeout／buffers、assertion witness、完整stdout／stderr、Git baseline及relevant before／after hashes。輸出到terminal只列簡短結果。Relevant paths是明列／靜態candidate superset，沒有宣稱完整dynamic-load tracing；index／CSS等額外roots由開工hash及每套之間的966项integrity核對補充。[Dependency supplement](test-infrastructure-sprint-0.1-dependency-supplement-evidence.json)

## F. Accepted隔離驗證

[Accepted focused](test-infrastructure-sprint-0.1-accepted-focused-evidence.json) **25/25 PASS**是runner驗證case結果，不是19個child全部PASS。19個child spawn attempts的預期分類為**5 PASS、3 FAIL、11 UNVERIFIED**；其中1個missing-node attempt未真的啟動process。其他6項檢查驗證policy、非法／protected path、mode、wx guard、NOT RUN、invalid witness等。

| 必要案例 | Child結果／證據 |
|---|---|
| 真正standalone／main | PASS，2個Node assertions；require.main正確 |
| 明列exported run | PASS，2個callable／strict assertions及有效summary |
| Export-only用standalone | UNVERIFIED；run未呼叫 |
| 原require-only跳過main | UNVERIFIED，雖stdout有PASS字樣，實際0 assertions |
| Intentional AssertionError／runtime Error | FAIL／FAIL，原errors保持 |
| 沒有checks的exit0 | UNVERIFIED，即使印999/999 |
| Git implicit／disabled controls | PASS／ENOBUFS UNVERIFIED；pinned完整bytes不變 |
| Explicit Git及non-Git buffer | PASS，兩個原expected throws保持 |
| Timeout／spawn missing executable | UNVERIFIED／UNVERIFIED，有actual policy／error |
| Empty／failed exported summary | UNVERIFIED／FAIL |
| Async-only／mixed sync＋unsupported async | UNVERIFIED／UNVERIFIED；部分sync success不足 |
| Reviewed custom verify／未呼叫／未審核source | PASS 2calls／UNVERIFIED／UNVERIFIED |
| 第二次相同capture／protected／escaping path | Execution前拒絕；不讀protected內容 |

[Accepted parent raw log](test-infrastructure-sprint-0.1-accepted-focused-driver-evidence.json)保存25項validator的完整stdout／stderr／exit；每個child的log／witness另有link。

## G. Unchanged Target Suites / 最終同source結果

[Accepted gates](test-infrastructure-sprint-0.1-accepted-gates-evidence.json)鎖定同一份final runner hashes；gate之間沒有再施工。

| Original suite | Actual | Assertion evidence | Elapsed |
|---|---|---|---:|
| contextual-status-panel | **PASS，40/40** | 原verify精確coverage40、throw branch0；implicit Git show override1 | 132.68ms |
| outcome-transition-hierarchy | **PASS，36/36** | 原verify精確coverage36、throw branch0；implicit Git show override1 | 349.58ms |
| pitch-tactical-decision-production-adapter-test | **PASS，22/22** | 799個成功Node assertion calls | 142.01ms |
| pitch-tactical-decision-production-adapter-integration-test | **FAIL，前7項後Save freeze** | 主入口正確；3705 attempts、3704success、1原AssertionError | 17088.11ms |
| R6 exact checker，explicit run | **PASS，23/23** | 有效summary；303success、21個expected throws | 107.72ms |

**檔名澄清：**施工指令所列`...production-adapter-test.js`是原22項unit suite，沒有Save全檔freeze或main guard。Audit負向案例是`...production-adapter-integration-test.js`。本輪執行兩套，保留各自真正結果；沒有為了讓指定unit FAIL而加assertion，也沒有放寬integration。

Integration的full raw stderr仍為`AssertionError [ERR_ASSERTION]: save.js`，第8項後停止；後續checks沒有推定PASS。[Save freeze negative evidence](test-infrastructure-sprint-0.1-pitch-tactical-decision-production-adapter-integration-accepted-evidence.json)

Witness call counts不是suite check totals：799不等於799項unit tests，303也不取代23項R6 checker。25個foundation validator與原targets的check／suite units分開。

## H. Development Evidence / 未確認限制

初版isolated children的15個raw captures／witness均保留；parent在bookkeeping status比較失敗，原因是新capture utility在baseline與current兩側過濾不一致，已只修新utility。**第一次互動工具的parent stderr被截短，完整專用parent raw log＝UNVERIFIED**，不宣稱可恢復，也不把那次parent當25/25。[Development recovery](test-infrastructure-sprint-0.1-development-1-recovery-evidence.json)

後續20/20、23/23、23/23與最後25/25 captures都保留，沒有overwrite。初版5個target captures包含UI的UNVERIFIED：當時Node assert observer未涵蓋原自訂verify；後續加入reviewed V8 coverage才真正PASS。較早results不回寫Green。

實際總範圍：85個isolated child spawn attempts（5個spawn failure沒有process）、15個original target executions；最後採信19個isolated attempts＋5套targets。沒有完整251或227 invocation。重跑只由bookkeeping／custom-checker／async保守分類與elapsed修正觸發，原captures及小fixtures全部保留。

限制明列：

- 現階段支援CommonJS同步Node assert；async assert APIs若出現即UNVERIFIED，ESM／其他自訂assertion框架未驗證。
- 自訂checker coverage僅對明列source／function／expected count的reviewed契約可用；未知checker不能由印出的PASS推定。
- Registry是本輪5個target，不是251套正式manifest，也没有證明所有任意套件都完成全部checks。
- Observer／coverage可能增加執行成本；本輪不是performance acceptance，没有再跑first-base或改正式timing verdict。
- Runner不是任意測試的filesystem安全sandbox；只能在已審核scope執行，protected dispatcher邊界與WIP integrity仍需保留。
- 不完整的第一輪development parent raw log仍UNVERIFIED；最後接受的child與focused parent證據完整。

## I. 使用與下一步條件

原standalone入口保持；新CLI僅接受明列suite及全新capture名，例如：

```powershell
node tests/entry-safe-runner.cjs contextual-status-panel docs/test-infrastructure-sprint-0.1-review-status-evidence.json
```

同capture再次執行會在child啟動前拒絕。Exported tests必須明列`entryMode: "exported-run"`；unknown mode不自動猜測。後續consumer應補齊適用的declared dependency list及新run ID，不直接重跑R6已有captures的main入口。

**進入Source Freeze Contract Reconciliation的條件＝CONDITIONAL。** 技術入口Gate已PASS，已能如實呈現原Save FAIL，具備人工契約審查所需的可靠子基線；五套Save與兩套index的責任例外仍需獨立授權，本輪沒有修訂。這不是Receiver Production source acceptance、不是Match Vertical Slice PASS。

Receiver v2＝DISABLED；L03＝PARTIAL；Ready for Sprint10B＝NO；Ready for Commit＝NO。原Match36、gradient、Opportunity-two與formal timing discrepancy保持原狀。本輪不自動進入下一個Sprint。

## J. Coverage / Closeout

依codebase-memory Tier2作search、雙向depth1 traces、exact snippet及current-source fallback；219個task dependency／fixture／evidence paths分3批coverage全部返回。[Architecture／coverage](test-infrastructure-sprint-0.1-architecture-coverage-evidence.json)。Dynamic proxy、main semantics與V8 counts以actual captures核對；metadata_changed／not_tracked／no_recorded_issue不當完整性或freshness保證。

新增檔案、delivery hashes、syntax及links驗證另存。原966 hashes、Git原WIP status與protected metadata保持。停止交付，等待人工審查，沒有Stage／Commit／Push或後續修復。
