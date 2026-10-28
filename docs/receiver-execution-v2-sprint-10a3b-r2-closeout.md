# Receiver Execution v2.2 — First-base Runtime Gate & Full Regression Closeout / Sprint 10A.3b-R2

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
正式基線：`ab3117653945de0b7013636187c446276a96e634`

**First-base 180秒驗收 PASS；Full Repository 在第1/227套發現不同於既有 Debt 的新失敗原因，已停止，Ready for Commit＝NO。** 本輪沒有修改 Production／Match／Save／Source adapter，只新增 R2 runner、focused tests、報告及 evidence。Receiver v2 仍 DISABLED，L03 仍 PARTIAL。不能宣告 Sprint10A.3b Production Source-only Integration＝PASS。

## A. Git / WIP Baseline

開始時 main／HEAD／origin/main 均為指定 Commit，index 空。原 Sprint10A.3b 四個 Production 修改、14個新增 WIP，加上 R1 的19個交付完整保留，R1 closeout hashes 與目前磁碟相符；沒有未知差異。[R2 baseline](receiver-execution-v2-sprint-10a3b-r2-baseline-evidence.json)

782 個開始時可讀 tracked／WIP／capture hashes 前後相同。Protected smoke、install.ps1、Sprint3／4／5 中間證據的12項內容沒有讀取、hash、執行或 Stage，只核對 Git status／size／mtime。這不是 protected content hash 證明。Sprint7–10A.3a 正式成果、原 Sprint10A.3b／R1 reports／captures 皆未覆寫。沒有 Reset／Clean／Stash／Stage／Commit／Push。

## B. Runtime Policy Root Cause / Approved Scope

R1 的原 first-base runner 使用120000ms／16MB buffer；原 suite 包含分別預宣告的兩組200場 canonical cohorts，共400場，加上 explicit production fixtures。R1 依序120秒比較兩邊均 timeout，300秒診斷兩邊42/42、完整輸出相同，耗時124.37／122.17秒。這些歷史條件與 UNRESOLVED verdict 保留，本輪不將它們改成 PASS。

本次人工授權將該 suite 的**新驗收執行條件**改為180000ms。新增 [R2 runner](../tests/receiver-execution-v2-sprint-10a3b-r2-runner.cjs) 的 exact per-suite policy，不修改原 suite、fixture／assertions／seeds、不減少400場、不修改舊 R1 runner 或任何功能程式。[Policy specification](receiver-execution-v2-sprint-10a3b-r2-runtime-policy-specification.json)

| Entry | 原政策 | R2 實際政策 |
|---|---|---|
| First-base baseline／WIP comparison | R1 120000ms／16MB | 本次核准180000ms／16MB；相同 direct Node command |
| Other related suites | R1 120000ms／16MB | 不變；本輪沿用 R1 evidence，沒有重跑 |
| Original227 full-final | S6 已為180000ms／30MB | 原時限／buffer／wrapper 完全保留，沒有全域提高 |

原 full runner 入口與 source hash 經獨立 read-only 稽核確認，執行 `node -e wrapper absoluteSuitePath`；wrapper 僅在 test 呼叫 git show 未明列 buffer 時沿用原30MB預設，保留 explicit buffers。不能省略這個原有 wrapper 而引入讀取 Git source 的 buffer failure。

**First-base 不在原227 manifest 中。** 本輪先獨立執行 first-base acceptance，再執行原227成員／順序，不把它插入 manifest 或增加總數。原 manifest 的 `JSON.stringify(files)` SHA-256＝`871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96`；227個 unique paths 與 S5 原始清單同順序，沒有 protected member。[Architecture／policy audit](receiver-execution-v2-sprint-10a3b-r2-architecture-policy-evidence.json)

## C. Baseline / WIP Same-condition Result

Baseline root sources 取自指定 Commit；WIP root sources 取自最終磁碟。兩邊在獨立 temporary roots 使用相同 Node executable／v24.19.0、同一 `node tests/first-base-receive-active-ground-production-integration-test.js` 命令、相同180000ms／16000000-byte buffer、相同環境設定。Test／helper 的完整 bytes 與基線相同，沒有 fixture／seed 變更，兩次依序執行，沒有並行 suites。

| Run | Exit | Checks | Elapsed |
|---|---:|---:|---:|
| Baseline180 | 0 | 42/42 PASS | 92359.80ms |
| Final WIP180 | 0 | 42/42 PASS | 98794.64ms |

完整 stdout／stderr 全相同；stdout SHA-256 都是 `10a669b8368be73c4d1365abdc34081a5feb73c9abbde2c8084b3e57e4ff60a7`，也與 R1 的完整診斷輸出相同。WIP 此次慢6434.84ms（約6.97%），低於執行前明列的調查門檻 `max(10000ms, baseline×20%)`。本次沒有觀測到顯著新退化；單一 pair 不是統計或跨環境效能保證，elapsed 不能當作模型改善。

原400場與完整42項驗證均完成，沒有新 sample、fixture 改寫或新的 Match 結算途徑。R2 沒有功能 Source 修改；sample callback／RNG／record／Evaluation non-interference 另沿用 R1 在相同 final source 的25 pairs 證據，不宣稱本次加入新的 RNG observer。

完整 stdout／stderr／exit／elapsed、test/helper/root hashes／policy 保存於 [baseline180](receiver-execution-v2-sprint-10a3b-r2-first-base-baseline-evidence.json)、[WIP180](receiver-execution-v2-sprint-10a3b-r2-first-base-current-evidence.json)，比較9/9條件通過見 [runtime comparison](receiver-execution-v2-sprint-10a3b-r2-runtime-comparison-evidence.json)。R1 的120／300秒 captures 與既有 runner bytes 未改。

## D. Final Focused Gate / R1 Inheritance

依本次第5節允許「只有 runner policy 變動」引用 R1 final evidence。R2 runner 在 comparison、focused、full入口均核對782個既有 hashes 與 R1 `finalSourceHashes`；Save／Source adapter、script、lifecycle、index、既有 suites 完全不變，沒有重新施工。

| Evidence | 結果／實際執行範圍 |
|---|---|
| R1 final focused | 沿用906/906；不是本輪重跑906項 |
| R1 Legacy comparison | 沿用25/25 pairs＋3/3 genuine historical states |
| R1 related suites | 沿用18/18；含 Career Save Admission45/45 |
| R2 runner focused | 本輪實跑 **55/55 PASS** |
| R2 First-base | 本輪 baseline42/42、WIP42/42，另列 |

新增 [runner tests](../tests/receiver-execution-v2-sprint-10a3b-r2-runner-test.cjs) 驗證180秒 exact override、其他 entry 舊預設、original full wrapper、buffer isolation、protected／path拒絕、227 membership/order、conditions/hash/output mismatch、timeout不得當PASS、42 checks totals 與 slowdown stop門檻。[R2 focused evidence](receiver-execution-v2-sprint-10a3b-r2-focused-evidence.json)

引用 R1 的 Save Source Contract、raw guard、Historical Save、Lifecycle Pin／Snapshot、callback order、Match／GameRecord／Evaluation 是**原有界 fixtures 的 PASS**，不是全場 source-only acceptance。Runtime/candidate calls 仍為0／DISABLED；本輪未新增 receiver stage consumer 或修改 formal owners。

## E. Full Repository — Started Once, Stopped on New Reason

上述 Gate 通過後，依原227順序啟動唯一一次 full-final。第一項 `tests/ability-performance-gradient-test.js` 於11641.56ms以 exit1失敗，spawn error＝null，沒有 timeout。

| 項目 | Formal baseline | R2 final WIP |
|---|---|---|
| File／test hash | ability-performance-gradient／`1038c92e…` | 完全相同，test未改 |
| Exit | 1，既有 Debt | 1 |
| 原因 | `AssertionError [ERR_ASSERTION]: Low tier can have a multi-hit game` | **`Error: non-JSON metadata`** |
| Owner path | 原 gradient assertion | canonical → same → validateMatch → shared guard → recordGroundBallSituationResolution |

這不是 baseline PASS→FAIL 的檔案，但**原 Debt 的失敗原因已變成新的 source-only guard exception**。依本次第6節要求比對 assertions／原因，不能因檔名與exit相同就維持 Existing Debt 分類。完整 stderr、原 baseline stderr、每套 policy／command／elapsed 保存在 [full repository capture](receiver-execution-v2-sprint-10a3b-r2-full-repository-evidence.json)。

依新回歸停止條件，**0/1 executed PASS、1 new observed blocker，剩餘226套 NOT RUN**；沒有第二次 full invocation。原227清單、順序與全部 test bytes 不變，沒有新增 timeout。不能回報224/227、不能宣稱三項 Debt 全部已重現，不能宣告 Production Source-only Integration PASS。

## F. Blocker / Read-only Source Review

當前 stack 指向 [receiver-source-snapshot.js:165](../receiver-source-snapshot.js#L165) 的 closed-summary binding comparison。該分支在 summary pin 與 archived admission相符、`state.shortstopExecution` truthy時比較 summary／current binding；它沒有在該分支明列 current binding存在與 current physical identity相同的條件。`canonical` 會拒絕 undefined／非JSON／循環值。

缺少 current binding，或 archived pin 對到之後未pin的 Legacy state，是 source 支持的**可能原因**。Captured stack 沒有保存 operands，不能宣稱已證明是哪個值或 cross-play scenario。遵守停工規則，本輪沒有另跑診斷 fixture、沒有修 Source／Save、沒有改既有 assertions或重跑 manifest。[Blocking evidence](receiver-execution-v2-sprint-10a3b-r2-blocking-regression-evidence.json)

獨立 read-only reviewer 確認 actual stderr 與原 Debt signature不符，並確認原 wrapper／member/order／limits 保留。另指出新 runner 僅在寫 capture時以wx拒絕覆寫，沒有 execution前的 existing-capture guard；因此本輪 single-use執行證據有效，但不應再次對既有R2 captures執行同命令。沒有 repeat或overwrite，停工後沒有為此改 runner或擴張驗收。

## G. Existing Debt Comparison

| Original Debt | R2 結果 |
|---|---|
| ability-performance-gradient-test.js：Low tier can have a multi-hit game | 已執行；不同原因的source exception，**不能認作原Debt重現** |
| baseball-match-foundation-2-2-2-test.js：36. full match | NOT RUN，停在第1套後 |
| high-school-year-one-opportunity-two-integration-test.js：DefensiveDecisionThrowFoundation is not defined | NOT RUN |

Existing Debt 的**基線集合為3項**；本輪同原因重現數＝0，剩餘2未執行。R2 不是新的完整 failure-set verdict；原224/227 PARTIAL只作歷史參照。New Production blocker＝**1 observed reason regression**，不是將原gradient balance assertion改成已修復。

## H. Non-Interference / Git Evidence

R2 Production delta＝0；Save source修復、原4個Production WIP與source adapter全部相同。R2新runner／tests沒有加入index或Family Registry、没有Actual v2 execution／Scorer／Settlement／GameRecord／Evaluation consumer。

這證明本輪沒有功能改動；**不代表整體 Sprint10A.3b WIP 已通過全場 non-interference**。Full test的新exception已揭露該WIP一項未通過的行為，本輪既有有界Green不能推翻它。

Discovery 使用 codebase-memory Tier2、雙向depth1 traces／snippets，再與当前磁碟比對；3份R1 runtime snippets相同。獨立 manifest audit依賴231paths coverage全數回傳，沒有未取完分頁；metadata訊號不當freshness／完整性保證。最終 integrity／coverage、所有R2新檔清單、whitespace、Git／protected metadata見 [R2 closeout evidence](receiver-execution-v2-sprint-10a3b-r2-closeout-evidence.json)。

## I. Final Gate

| Gate | R2結果 |
|---|---|
| Save Source Contract | **PASS，沿用未變Source的R1 45/45** |
| First-base180 Baseline | **PASS，42/42** |
| First-base180 WIP | **PASS，42/42** |
| First-base Output Parity | **PASS，完整stdout／stderr相同** |
| Runner Policy Isolation | **PASS，actual policy／command／members未擴張**；single-use限制明列 |
| Focused Regression | **R1引用906/906；R2實跑55/55** |
| Legacy Comparison | **R1引用25/25＋3 historical** |
| Historical Save | **PASS，限R1 fixtures**；非新full-game verdict |
| Full Repository | **FAIL／STOPPED，執行1/227，剩餘226 NOT RUN** |
| Existing Debt | 基線3項；本輪同原因重現0，另2未跑 |
| New Production Regression | **1 observed new reason** |
| Receiver v2 Runtime | **DISABLED** |
| L03 | **PARTIAL** |
| Production Source Acceptance／CRT／Capability／Ordinary Effort | **PARTIAL** |
| Sprint10A.3b Production Source-only Integration | **NOT PASS，new blocker** |
| Ready for Sprint10B | **NO** |
| Ready for Commit | **NO** |

完成停工結案，保留全部WIP與captures，等待人工審查。沒有 Stage／Commit／Push，也沒有開始 Sprint10B、11 或 Defensive Foundation Closeout。
