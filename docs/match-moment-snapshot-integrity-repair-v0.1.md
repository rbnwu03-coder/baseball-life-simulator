# 《棒球人生》Match Moment Snapshot Integrity Repair v0.1

任務：Bounded Production Fix  
日期：2026-10-15（Asia/Taipei）  
正式 Git 參考基線：`ab3117653945de0b7013636187c446276a96e634`

**有限修復完成：終場 settlement 不再覆寫最後 completedMoment；兩個固定 seed 的事件局勢保留為 Resolution Snapshot，Match／Record 繼續保存真實終場。Experience 的打擊壓力改讀同一 PA 既有、identity 相符的 Decision Context，沒有新增 Save 欄位或重建歷史資料。**

本輪先以未改 Production 重現預定 RED，再執行修復後四套 standalone：**Canonical 50/50、Game Record 13/13、Experience 46/46、Presentation 35/35，合計144個具名 checks 通過**。原50項 Canonical 保護保留，其中4個已知覆寫觀測改成正向事件保留契約。沒有非預期正式失敗，沒有擴大修復。

**原 #36／Ability Gradient 的歷史 FAIL 保留；S3、SS先發及自然非零SS守備仍 UNVERIFIED。Ready for Commit＝NO；Ready for Sprint10B＝NO；Receiver v2＝DISABLED。完成後停止，等待人工驗收。**

## 1. 修復前重現與執行計畫

修改前先保存四個授權檔案的完整原文／SHA-256，再固定 [Plan](match-moment-snapshot-integrity-repair-v0.1-plan-evidence.json)。Production 尚未改動時，以轉為正向契約的正式 Canonical Suite 執行一次：第一場88221自然完成、前11個具名 checks通過，隨後 `Completed Moment must preserve resolution state` 的完整物件 equality 失敗，exit1。這是**事前宣告的預期RED**，不是出現非預期失敗後繼續施工。[重現判定](match-moment-snapshot-integrity-repair-v0.1-before-reproduction-evidence.json)、[完整raw](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-before-red-evidence.json)、[witness](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-before-red-evidence-assertions.json)

RED耗時297.1156ms、entryVerified／sourceStable=true，670個成功Node assertion calls後遇到預定失敗，完整stderr保留。88222的修復前數值沿用並hash核對Sprint1正式capture；**本輪未另跑88222修復前全場**。原有gap checks與captures沒有覆寫或刪除。[原文保護](match-moment-snapshot-integrity-repair-v0.1-authorized-before-evidence.json)

## 2. 精確修改與不變責任

| 修改檔案 | 本輪精確責任 |
|---|---|
| [script.js](../script.js) 的 `settleHighSchoolYearOneMatch`（current line13093） | 只移除取得最後Moment及覆寫scores／runners／outs／half的7行；保留其餘settlement、contribution、finalization、career流程 |
| [match-experience-development.js](../match-experience-development.js) 的打擊evidence consumer（line398起） | 新增小型private `deriveBatterDecisionPressure`，只從既有同PA publicContext供給pressure；既有 `buildSituation`、`derivePressure`、`deriveDifficulty`、quality與aggregation規則不改 |
| [canonical-match-contract-context.cjs](../tests/helpers/canonical-match-contract-context.cjs) | 在正式比賽完成後增加只讀CallHome及consumer fallback觀測；正常entry、fixture與playback原文保持 |
| [canonical-match-regression-integration-test.cjs](../tests/canonical-match-regression-integration-test.cjs) | 每run第12組改驗完整Moment不變、三時點、壓力來源與敘事；其他11組與replay checks原文保持，仍50項 |

Production採exact literal replacements，對開工WIP逐byte驗證：**script其餘全部bytes不變；Experience僅新增private helper及一個pressure輸入**。完整四檔after source、before hashes、替換原文與測試保護證明見 [Source](match-moment-snapshot-integrity-repair-v0.1-source-evidence.json)、[Production delta](match-moment-snapshot-integrity-repair-v0.1-production-delta-evidence.json)。原既有script WIP未被基線版本取代。

沒有改Player source、能力輸入、Pitch／Batting／Fielding Simulation、PlayingTime／roster／lineup、Moment producer／IDs、原#36斷言、Gradient、Receiver、Save schema、runner或registry。`getHighSchoolCallHomePresentation` source未修改；資料修正後直接驗其輸出，不靠文案替換遮蔽資料問題。

## 3. Decision／Resolution／Final語義與實際結果

| 責任 | 正式資料來源 | 本輪驗收 |
|---|---|---|
| Decision Context | 正式PA準備時的既有 `batterAnticipation.publicContext`；另以helper在合法choice前只讀複製作獨立對照 | inning／outs／壘包occupancy／scoreDifference與當時Match相同，PA identity一致 |
| Resolution Snapshot | 正式結果套用後的completedMoment | 最後Moment完整物件與結果後只讀複本deep equal；保留事件ID、決策、pitch history與結果 |
| Final Match Summary | final Match／GameRecord | 保留真實7局終場、比分、totals與eventRefs；不寫回歷史Moment |

| Seed | 決策前 | 結果後Moment | 修復前終局Moment（歷史證據） | 修復後終局Moment | 真正Match／Record終局 |
|---|---|---|---|---|---|
| 88221 | 6下1out，1：5 | 6下2outs，1：5 | 6終3outs，1：6 | **6下2outs，1：5** | **7終3outs，1：6** |
| 88222 | 6下0out，1：1 | 6下1out，1：1 | 6終3outs，1：3 | **6下1out，1：1** | **7終3outs，1：3** |

四個修復後runs均為空壘；完整Moment equality也包含runners，並非只檢顯示文字或其中幾個欄位。Decision Context與Resolution Snapshot的outs刻意不同，不能互稱。[完整四runs／三時點／hashes](match-moment-snapshot-integrity-repair-v0.1-findings-evidence.json)

兩seed皆沿用原能力、SS、default invitation index0、正常高中入學／PlayingTime／替補owner、sample0.72、secure／zone／first-legal政策及safety1400。score44、lateGameAppearance、entry6、初始bench與當場lineup一致；88221為110ticks、88222為107ticks，首次及replay相同。它們是**第六局合法SS替補**，沒有改phase／finalized lineup／Moment／PA／outs或搜尋新的seed。

## 4. Experience consumer的來源與相容邊界

修改前先查證 `deriveMatchExperienceEvidence → createBatterEvidence → buildSituation／derivePressure`，並確認 `ensureHighSchoolBatterAnticipationState` 在PA結果之前建立publicContext，正式offensive resolver把同份context複製進completedMoment。這份既有資料含前置inning、outs、Boolean runners、scoreDifference及PA identity，無須新增持久化before欄位。[Focused owner graph](match-moment-snapshot-integrity-repair-v0.1-focused-source-graph-evidence.json)、[exact source核對](match-moment-snapshot-integrity-repair-v0.1-source-evidence.json)

新consumer要求identity精確等於 `matchId|momentId|player|inning|half`，並驗inning、合法outs、finite scoreDifference及三個Boolean壘包。只有符合者才用既有derivePressure計算壓力；**evidence.situation仍保存Resolution Snapshot，pressure才取Decision Context**。scoreDifference只供既有絕對分差門檻使用，沒有合成不存在的home／away before比分。`decisionQuality`沿用正式PA已產生的品質；difficulty仍是原有meaningful／route等分類，未改公式或重新推測決策前局勢。

| Seed | 修復前兩筆active batter pressure | 修復後（決策前來源） | Experience聚合totalValue（前→後） |
|---|---|---|---|
| 88221 | normal／1.02，lateGame | **normal／1.02，lateGame**；不把結果後2outs算進決策壓力 | IQ3.935→3.935；batting2.923→2.923 |
| 88222 | normal／1.02，lateGame，受終場分差影響 | **high／1.05，lateGame＋closeScore**；決策前為平手 | IQ3.935→3.994；batting2.923→2.982 |

88222既有development history的兩個`metadata.experienceValue`隨聚合值修正；兩seed的skillProgress、baseballSkills、capabilityState、evaluation、比賽history、contribution及正式球員統計均與修復前相同。這是限定consumer的情境校正，不是要求所有Experience bytes與舊錯誤資料相同。

對**缺少或identity過期**context的consumer-only memory副本，Suite確認仍採既有Resolution fallback；副本未安裝回真實Match，沒有假造before或執行新PA。其「決策前壓力正確性」保持 **UNVERIFIED**。其他非法context的形狀檢查有source guards，本輪沒有逐一新增runtime negatives。未遷移既有Save、未重建舊Moment，也未宣稱修好了所有歷史情境。

## 5. Presentation、Record、Save與Career

`getHighSchoolCallHomePresentation`在四runs實際輸出「**6局下**」事件片段，沒有「6局終」；同段全場摘要分別維持「終場1：6／1：3」（實際文字含原空格與全形標點）。事件敘事直接讀未被覆寫的Moment，整場結果仍讀Match outcome。此為memory正式函式輸出驗證，沒有browser視覺驗收。

| 回歸責任 | 實際證據 |
|---|---|
| Match／Record final | final Record integrity有效、totals／result比分與Match相同；88221為119 unique refs／119 events，88222為113／113 |
| 修復前後parity | fixture、initial Match、全部decision sequence、完整Record、log、rosters、contribution與比分逐物件相同；Record hashes仍為88221 `abb6ee64…cf92`、88222 `6af67e71…1ebc` |
| 每步state／完成守恆 | 每場220或214份before／after state觀測無issues；每場1個真實玩家PA／created／resolved／completed；防守0＝0 |
| Replay | 各seed全新context replay之fixture／initial／Record／log／decision hashes相同，完整final player另deep equal |
| Save memory | normalizeSave round-trip保留修正後completedMoments、Record、log、rosters、exposure、Experience、evaluation及history，Record integrity仍有效 |
| Career | 真實替補參與、PA1／defensiveInnings1；evaluation sampleCount1、本場identity一次、history1、Experience settled；不是非零meaningful防守證明 |
| 公開冪等 | 每場相同decision重呼resolve回false；終局settle兩次＋finish一次皆false，完整player不變、gameEnd仍1 |

以上均保留原Canonical checks，另由既有Game Record及Experience／Presentation suites驗收。後者含memory save/reload及duplicate development settlement；沒有把memory測試稱為真實browser storage lifecycle或低階append任意重呼保證。[Findings／parity](match-moment-snapshot-integrity-repair-v0.1-findings-evidence.json)

## 6. Targeted正式執行證據

| 修復後完整Suite | 結果 | elapsed | 成功Node assertion calls | Raw／witness |
|---|---|---:|---:|---|
| Canonical Match Regression | **50/50 PASS**，兩seed各首次＋replay共4場 | 792.6183ms | 2772 | [raw](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-canonical-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-canonical-evidence-assertions.json) |
| Match Full Game Record | **13/13 PASS** | 836.8885ms | 13 | [raw](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-game-record-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-game-record-evidence-assertions.json) |
| Match Experience Development Foundation v1 | **46/46 PASS** | 632.7192ms | 46 | [raw](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-experience-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-experience-evidence-assertions.json) |
| Match Development Settlement Presentation v1 | **35/35 PASS** | 174.629ms | 35 | [raw](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-presentation-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-moment-snapshot-integrity-repair-v0.1-presentation-evidence-assertions.json) |

四個GREEN children合計144具名 checks、2866成功Node assertion calls，皆exit0／stderr空、entryVerified／sourceStable=true。另有1個預定RED child，兩種結果分開保留。新Canonical總計5場已走到終局：修復前RED的第一場＋修復後4場；既有suites自己的fixtures不併入此5場計數。Experience既有1000-sample結構檢查是其原suite內容，沒有增加樣本校準能力或處理Gradient。

使用未改Entry-Safe runner／preload及Node v24.19.0，standalone main實際執行。Raw各自保存完整actualCommand／source before-after hashes／stdout／stderr／exit／limits／witness。政策timeout120000ms、outputMaxBuffer16000000 bytes、implicit Git show30000000 bytes；Canonical stdout9598619 bytes完整保存，沒有截短或增限。[Acceptance](match-moment-snapshot-integrity-repair-v0.1-acceptance-evidence.json)、[Verification](match-moment-snapshot-integrity-repair-v0.1-verification-evidence.json)

沒有重跑原38項Suite、Routine Suite或其他已通過且不受本delta影響的套件；Full255／Full251／R6Full227／First-base timing／Receiver Integration／Browser全套皆未執行。

## 7. Git／WIP Integrity

開工與結案branch=main，HEAD／main／origin/main tracking ref均為指定基線，index空。未fetch或重新核對遠端server。先核對Baseline Verification的1552個hash與29個delivery entries及delivery自身，形成 **1582個既有可讀檔案** 開工清單；結案 **1578個hash不變，4個精確授權delta**。所有其他WIP、既有captures與前置交付均保持；原script WIP已以exact-before及限定替換證明保留。[Baseline](match-moment-snapshot-integrity-repair-v0.1-baseline-evidence.json)、[Closeout](match-moment-snapshot-integrity-repair-v0.1-closeout-evidence.json)、[Delivery](match-moment-snapshot-integrity-repair-v0.1-delivery-evidence.json)

12個protected paths的專用保護檢查只核對Git status與size／mtime，未直接read／hash／執行或修改其內容。**另有一項操作邊界偏差：本輪曾執行未限定路徑的 `git diff --stat`，輸出包含protected `tests/fast-check-smoke-test.cjs` 的10行新增統計。Git為此計算diff，超出嚴格metadata-only範圍；未輸出該檔source，未執行或修改檔案。不能宣稱本輪全程只碰protected metadata。** 專用hash loop內的`protectedContentReadOrHashed:false`僅描述該loop，不代表這個session例外不存在。[邊界紀錄](match-moment-snapshot-integrity-repair-v0.1-boundary-accounting-evidence.json)

結案protected metadata仍相同，但不是內容hash或全程存取證明。新captures獨立命名、existing target拒絕並exclusive-create，舊檔不覆寫。沒有Reset／Clean／Stash／Stage／Commit／Push。新docs結案utility另有一次將Set誤用includes的TypeError；只修正該utility為has，保留已建立capture後重做reporting核對，沒有重跑正式suite或改Production。

依codebase-memory Tier2做必要owner／consumer查證，7份material snippets與開工source逐行一致；after source另直接read與exact替換核對，沒有重新做全面Architecture Audit。1582個既有paths分14批coverage完整返回，唯一reported partial為舊audit lines48–56，已直接讀取。新交付另做coverage及direct read／hash／語法與連結核對。Graph metadata_changed／not_tracked不能當source freshness或完整性證明。[Coverage](match-moment-snapshot-integrity-repair-v0.1-coverage-evidence.json)、[Verification](match-moment-snapshot-integrity-repair-v0.1-verification-evidence.json)

## 8. 剩餘事項與停止判定

| Gate／未關閉事項 | 結論 |
|---|---|
| Event Snapshot Correctness | **CONFIRMED**：新執行的88221／88222及replays，完整最後Moment結算前後不變 |
| Decision Context Correctness | **CONFIRMED限定同PA既有publicContext**；missing／stale／invalid legacy context不宣稱已取得before |
| Match／Record Final Correctness | **CONFIRMED限定回歸**；與已審查的原Record／log完全相同 |
| 舊Save內已被覆寫的Moment | 本輪沒有重建／migration，歷史decision-before恢復仍 **UNVERIFIED** |
| 原#36／Gradient | **歷史FAIL保留，本輪NOT EXECUTED**；原source／assertions不改，不用本輪綠燈替代 |
| S3／SS開賽先發／自然非零SS守備 | **UNVERIFIED**；沒有新增候選或擴大調查 |
| Browser／storage lifecycle與所有career配置 | 未驗收；不能由memory／兩seed回歸推廣 |
| 原255-suite清單 | 203 PASS／2 FAIL／48 UNVERIFIED／2 BLOCKED是開工歷史基線；Production已變，不宣稱本輪重新驗證全255或更新其freshness |
| 本輪Snapshot bounded fix | **COMPLETE，限定驗收通過** |
| Ready for Commit／Sprint10B／Receiver v2 | **NO／NO／DISABLED** |

下一步僅需人工審查四個delta與本報告。若要求修復缺少可信before的歷史Save，需另案界定來源與相容性；原#36／S3契約仍需獨立裁決。本輪不啟動這些工作，也不延伸Baseline全套、Receiver或下一Sprint。完成後停止。
