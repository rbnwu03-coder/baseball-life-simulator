# Receiver Execution v2.2 — Save Source Contract & Timeout Recovery / Sprint 10A.3b-R1

專案：Baseball Life Simulation（棒球人生）
日期：2026-10-13（Asia/Taipei）
正式基線：`ab3117653945de0b7013636187c446276a96e634`

**Save source contract 已修復；first-base 原 120 秒條件仍為 UNRESOLVED，Ready for Commit＝NO。** 最終 source 的 906/906 focused checks、25/25 Legacy pairs＋3 種 historical states、18/18 related suites 通過。沒有啟用 Receiver v2，沒有 Stage／Commit／Push。本報告補充原 Sprint 10A.3b 停工報告，沒有覆寫其 blocker 或任何原始 capture。

## A. Baseline / WIP Preservation

R1 開始時 main／HEAD／origin/main 均為指定基線，index 空。原有四個 Production 修改及 14 個 Sprint 10A.3b 新增 WIP 完整核對停工 hashes；停工 evidence 自身是在其內記錄的 Git status 之後建立，該一項 self-reference 差異已明列，沒有未知差異。[R1 baseline](receiver-execution-v2-sprint-10a3b-r1-baseline-evidence.json)

R1 只修改 `save.js` 與既有 WIP `receiver-source-snapshot.js` 的 serialization 驗證。其他 761 個開始時可讀 tracked／WIP hashes 一致，包含 script.js、MatchSituationLifecycle、index.html、既有測試、三項 Debt、Sprint 7–10A.3a 成果及原 Sprint 10A.3b captures。Protected smoke、install.ps1 與 Sprint 3／4／5 的 12 項內容沒有讀取、hash、執行或修改；只核對 status／size／mtime，這不是 protected content hash 證明。

## B. Save Source Contract Root Cause / Repair

原 `career-save-admission-test.js:372` 的 assertion39 同時要求 SAVE_VERSION＝15、SAVE_KEY＝`baseballLifeRpgSave`，以及有效的 `localStorage.setItem(SAVE_KEY, JSON.stringify(player));` source contract。原 WIP 將這個實際 storage statement 改成 serializer ternary，造成原 PASS→FAIL；不是既有 Debt。player.js 的 SAVE_VERSION 與 Player schema 並未修改，SAVE_KEY 也未變。[Root cause / before-after](receiver-execution-v2-sprint-10a3b-r1-root-cause-evidence.json)

修復採兩個實際 Save owner 分支：

- 普通 Legacy Player 先走 source metadata validation（adapter 存在時），再執行原 literal `JSON.stringify(player)` 寫入。R1 測試直接攔截 storage 並驗證完整 payload 等於原 Player；移除 adapter 時這個 Legacy 分支仍能真正存檔，並非 dead code。
- source-only admission、root16 或現存 source header 明確走 source-only serialization。先驗原來源與 pin/cache copies，在 detached root 保存既有 WIP 的 version16／`receiver-source-only-save-v1` header，再驗 raw object 後才寫 storage。沒有改寫 live Player／Match、重新產生 pin、抽 sample 或回填 settled facts。無 adapter 時這個分支拒絕。

Adapter 另拒絕 unsupported live source Save version／header，避免 serialization 用合法 header 覆蓋未知版本。後續沒有 admission 的普通新 Match 仍保存15，移除舊 root envelope 只作用於 detached 保存物件，不修改舊機會 pin。Source-only metadata 位於原 Player 的 highSchoolMatch／handoff／lifecycle 資料內；没有第二個 storage key、scorer 或 Save owner。

normalizeSave 的 raw guard 仍在 defaults／merge 之前；loadGame 的 candidate-first、admission-second、commit-last 保留。Original Career Save Admission **45/45 PASS**，原測試 bytes／assertion 完全未改。[Current source verification](receiver-execution-v2-sprint-10a3b-r1-current-source-verification.json)

Checksum／copy consistency 不是 authentication。不能承諾辨識同時重寫全部來源、header 與版本的惡意偽造。本輪 source-only format 保存的是既有 Legacy execution 加來源 metadata，**不是正式 Receiver v2 executed／settled Save PASS**。

## C. Save Compatibility Matrix

| State / Boundary | 最終驗證 | 範圍 |
|---|---|---|
| Genuine historical pending／executed／settled | PASS | 由正式基線 owner 產生原省略資料；normalize／cold 保留舊權威，無 backfill |
| Ordinary new Legacy Match | PASS | 有效原 literal storage path、root15、無 source header／自動升級 |
| Source-only pending | PASS | pin／snapshot 保存，沒有原 sample binding，duplicate／cold 不改 live facts |
| Source-only executed | PASS | 原 Legacy cache／sample binding，合法原 execution owner 產生；未建立 v2 output |
| Source-only settled | PASS | 原 record／Evaluation／closed copies，duplicate／cold 不重記 |
| Later ordinary Match after source-only save | PASS | detached root 回15，live Player／Match 不改 |
| Unknown version／format、missing header／source fields | PASS rejection | raw guard／pre-write validation 拒絕，storage 與 live Player 不變 |
| Pin／physical／actor／runner／sample／cache-copy tamper | PASS rejection | serialized dependencies／original source copies 檢查，不以 digest 單獨認證 |
| firstBase／3B／missingFacts／settled early returns | PASS bounded guard | 原 108 checks 與 R1 檢查先驗 source metadata |
| Actual v2 execution／candidate／formal v2 Save | DISABLED／NOT IMPLEMENTED | 本輪沒有接球模型執行或正式 settlement |

新增 [R1 Save tests](../tests/receiver-execution-v2-sprint-10a3b-r1-save-test.cjs) **19/19 PASS**；原 source-only focused **108/108 PASS**。Save／duplicate／cold 比對完整 Player、Match、RNG、record／Evaluation；actual v2 execution trap count＝0。Pending、executed、settled 都由原合法 fixture 與既有 transition 建立，沒有刪除 source tags 冒充 historical。

## D. First-base Timeout Baseline Comparison

原 runner 的 `spawnSync` 使用 `timeout=120000`、`maxBuffer=16000000`。原 suite 包含兩組分別預宣告的 200 場 canonical cohorts，總共400場，另有 explicit fixtures；沒有降低遊戲數量、換 seeds／fixtures、改正式 RNG 或修改原測試。

R1 將 baseline／current index 所需 root sources 複製至不同的 isolated temporary roots；兩邊使用相同 Node executable/version、同一命令 `node tests/first-base-receive-active-ground-production-integration-test.js`、同一120000ms限額與16MB buffer。原 test 及 helper 的 SHA-256 在兩邊完全一致；baseline root bytes 取自指定 Commit，current 取自最終磁碟 WIP。Temporary roots 不使用 Git checkout、reset 或修改工作樹。

初次 baseline/current 有重疊執行，因此保留為 preliminary，沒有用其耗時作正式因果判斷。其後在其他 suites 全部結束後，依序單獨跑 baseline120、current120，排除重疊測試負載。

| Run | Timeout | Exit / Error | Elapsed |
|---|---:|---|---:|
| Sequential baseline | 120000ms | null／ETIMEDOUT | 120043.04ms |
| Sequential final WIP | 120000ms | null／ETIMEDOUT | 120030.32ms |
| Diagnostic baseline | 300000ms | 0／42 of 42 PASS | 124368.12ms |
| Diagnostic final WIP | 300000ms | 0／42 of 42 PASS | 122173.32ms |

兩邊均印出 original200 cohort PASS，但沒有整套 final exit verdict；結果為 **UNRESOLVED**。這不是 baseline PASS／WIP FAIL，也不能把局部 stdout PASS 改寫為 suite PASS。原完整 repository capture 沒有這個 suite 的正常耗時記錄，因此本輪另外實測，沒有杜撰歷史 duration。

兩個300秒限時診斷均完成42/42，完整 stdout（含兩組原200場 cohorts）完全相同，沒有結果差異；實際耗時均超過120秒，沒有觀測到 WIP 較慢。這支持本輪原 runner 限額不足的判讀，但不是跨環境效能保證，也不能替代原120秒驗收。Global timeout、原 suite 與原 captures 均未修改。[Timeout comparison](receiver-execution-v2-sprint-10a3b-r1-timeout-comparison-evidence.json)

完整 exit、elapsed、stdout／stderr、test/helper／root source hashes 保存於 [baseline120](receiver-execution-v2-sprint-10a3b-r1-first-base-baseline-serial-evidence.json)、[WIP120](receiver-execution-v2-sprint-10a3b-r1-first-base-current-serial-evidence.json)、[baseline diagnostic](receiver-execution-v2-sprint-10a3b-r1-first-base-baseline-diagnostic-300000-evidence.json)、[WIP diagnostic](receiver-execution-v2-sprint-10a3b-r1-first-base-current-diagnostic-300000-evidence.json)。先前120秒失敗證據保留。若要更改正式驗收 timeout，須先核定測試執行條件；本輪未將診斷限額變成正式設定。

## E. Final-source Focused / Legacy / Related Regression

所有以下結果使用修復後最終 source，沒有沿用原停工前的108／25當本輪結果。[Focused evidence](receiver-execution-v2-sprint-10a3b-r1-focused-evidence.json) 保存完整 named rows、source hashes、25 pair rows 與 historical matrix；[Related evidence](receiver-execution-v2-sprint-10a3b-r1-related-evidence.json) 保存完整 stdout／stderr／exit／elapsed。

| Suite | 實際結果 |
|---|---:|
| Sprint 10A.3b source focused | 108/108 |
| R1 Save focused | 19/19 |
| Sprint 10A.3a v2.2 | 155/155 |
| Sprint 8／9／10A.1／10A.2 | 91＋151＋122＋96＝460/460 |
| Sprint 5 | 79＋33＝112/112 |
| Sprint 6 | 52/52 |
| Named focused total | **906/906 PASS** |
| Legacy comparison | **25/25 pairs PASS**；historical **3/3** 另列 |
| Career Save Admission | **45/45 PASS**，包含 assertion39 |
| Related suites | **18/18 PASS**，包含上述 S5／S6／Career；不重複加到 focused count |

Legacy pairs 比對完整 Player／Match、physical／actors／raw cache、sample callback count/order/value、Match RNG、outs／bases／runs／cursor、GameRecord／E/A/H/FC、experience／Evaluation、三次 duplicate 與 cold recovery。只排除原報告已列 source metadata 與 root16→15 預期 envelope 差異。沒有 actual v2 candidate execution、baseball result、record 或 RNG 差異。

相關 suites 包含 SS／2B／3B execution、decision throw、Force、Runner Settlement、GameRecord、Evaluation、identity、pitch source freeze、MatchSituationLifecycle、handoff recovery 及 multi-runner settlement。First-base 另列 timeout gate，未加入18/18。

新 R1 harness 初次 observer 以可重assign的 oldSet 變數遞迴呼叫自身；另四項 tamper 嘗試對 frozen live metadata 寫入被 VM 忽略。已修正新 harness 為固定原 storage function、serialized-clone tamper；合法三階段沿用原 transition。[Initial R1 tool evidence](receiver-execution-v2-sprint-10a3b-r1-initial-test-evidence.json) 保留診斷，不修改任何既有 assertion、模型、fixture 或 threshold。

## F. Full Repository / Remaining Blocker

**原227 manifest＝NOT RUN。** First-base 未取得原120秒有效 PASS，依附件第6節「只有所有必要相關回歸都取得有效結果……才開始最終完整227」不符合啟動條件。不能因906／25／18通過宣告整轮驗收。

224/227 PARTIAL 沿用已提交基線；下列三项 Debt 的 test bytes 不變，本輪没有重新執行或宣稱重現其 failures：ability-performance-gradient 的 `Low tier can have a multi-hit game`、baseball-match-foundation-2-2-2 的 `36. full match`、high-school-year-one-opportunity-two 的 missing DefensiveDecisionThrowFoundation。本輪沒有新的 full-repository failure-set verdict。

Confirmed new Production regression＝**0，限本輪最終有界結果**；原 Career Save source-contract failure 已修復。First-base 原120條件仍未決，不能宣稱全 repository 新回歸＝0 或 Sprint 10A.3b PASS。

## G. Source Trace / Final Gate

使用 codebase-memory Tier2：symbol search、三個雙向 depth1 traces、Save／serialization／raw guard snippets，再讀當前磁碟與 literal diff。763 個開始時依賴／完整性 paths 分8批 coverage，無漏頁；metadata_changed 不證明 freshness。兩份 normalizeSave graph pages 使用 stale12–633 bounds，而當前函式由22開始；因此以文字 symbol 邊界取得完整 current owner source，沒有借 graph 宣稱完整。歷史 Markdown partial48–56直接讀取補證。[Architecture evidence](receiver-execution-v2-sprint-10a3b-r1-architecture-evidence.json)

| Gate | R1 結果 |
|---|---|
| Save Source Contract | **PASS**，原 assertion／有效 Legacy write 恢復 |
| Raw Save Guard | **PASS，限有界 source-only metadata matrix**；不是 actual v2 Save PASS |
| Historical Save Compatibility | **PASS，3 states＋cold／duplicates** |
| First-base Suite | **UNRESOLVED，原120秒兩邊 timeout** |
| Lifecycle Pin Retention | **PASS，有界 final source checks** |
| Source Snapshot Integrity | **PASS，來源 copies／cache binding**；非 authentication／新接球權威 |
| Focused Regression | **906/906 PASS** |
| Legacy Comparison | **25/25 pairs＋3/3 historical** |
| Related Regression | **18/18 PASS** |
| Full Repository | **NOT RUN**，first-base gate 未通過 |
| New Production Regression | **0 confirmed in final bounded tests**；原 timeout unresolved |
| Receiver v2 Runtime | **DISABLED** |
| Production Source Acceptance／CRT／Capability／Ordinary Effort | **PARTIAL**，來源與校準仍不足 |
| L03 | **PARTIAL** |
| Ready for Sprint 10B | **NO** |
| Ready for Commit | **NO** |

沒有 Stage／Commit／Push／Reset／Clean／Stash，也沒有開始 Sprint10B、11 或 Defensive Foundation Closeout。最終路徑、hash／whitespace、Git／protected metadata 及未執行 full manifest gate 見 [R1 closeout evidence](receiver-execution-v2-sprint-10a3b-r1-closeout-evidence.json)。保留修復後 WIP，等待人工審查。
