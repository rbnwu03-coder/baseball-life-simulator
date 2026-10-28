"use strict";
const fs=require('node:fs'),path=require('node:path');
const C=require('./match-contract-implementation-v0.1-sprint-1-capture.cjs');
C.integrity();
const text=String.raw`# 《棒球人生》Match Contract Implementation v0.1

## Sprint 1 — Canonical Regression Foundation

日期：2026-10-15（Asia/Taipei）  
正式 Git 基線：`+'`ab3117653945de0b7013636187c446276a96e634`'+String.raw`  
授權：新增獨立正式測試與必要 Helper；原 Production、正式既有 tests、fixtures、seeds、pins、WIP 與 captures 均保留。

**Sprint 1 完成：新增3個正式檔案；Canonical Suite 50/50、Routine 原#38斷言1/1、既有 Game Record 13/13、Ground Settlement Lifecycle 26/26，四個 standalone 入口均 PASS。** Canonical 的50個具名檢查包含4個已知 snapshot 缺口的觀測，不代表 snapshot 語義正確。新 Canonical Suite 實際執行88221／88222各首次及replay，共4場合法第六局SS替補比賽。

**原#36／#37／#38檔案完全未改；原#36歷史FAIL不變，S3固定Moment3仍UNVERIFIED。** 新測試不要求固定Moment1／3同時出現，不把替補結果稱為SS先發或非零守備Moment驗收。Snapshot維持 **KNOWN CONTRACT GAP**，未修Production或Save schema。

已具備啟動下一輪 **Current Test Baseline Verification 的技術前置條件：YES，待人工審查**；該驗證本輪未開始，也不表示所有現有測試全綠。**Ready for Commit＝NO；Ready for Sprint10B＝NO；Receiver v2＝DISABLED。完成即停止。**

## 1. 精確新增正式檔案與實作邊界

| 新增檔案 | 責任 |
|---|---|
| [tests/helpers/canonical-match-contract-context.cjs](../tests/helpers/canonical-match-contract-context.cjs) | 依current index載入正式owners的browser-global VM；正常選校／高中入學、SS、PlayingTime、roster、替補與playback；只在正式呼叫前後複製證據，提供Record／Save memory／Career觀測 |
| [tests/canonical-match-regression-integration-test.cjs](../tests/canonical-match-regression-integration-test.cjs) | 88221與88222各全新context首次＋replay，完整執行12類檢查／每場，加每seed一次replay比較，共50個具名檢查 |
| [tests/routine-commentary-contract-test.cjs](../tests/routine-commentary-contract-test.cjs) | 從未改的原正式檔取exact prefix及#38整行斷言，獨立執行相同synthetic輸入、formatter及五個禁止字串 |

三個檔案皆為新建；沒有修改原正式test、runner、preload、registry或umbrella入口。兩個Suite有standalone main guard，也可顯式呼叫exported runSuite；本輪以可信Entry-Safe standalone驗收，未以單純require冒充執行。正式檔案不依賴docs診斷driver／evidence，Helper未載入任何docs程式。[Exact新source與SHA-256](match-contract-implementation-v0.1-sprint-1-source-evidence.json)

Canonical載入current index的92個modules，依index順序、browser globals模式，排除application-controller UI boot；VM不宣告module／require。沒有包裝、替換或stub正式owner。DOM／storage／timers僅為既有風格的memory環境，不是browser lifecycle驗收。

Helper重用已審查的同名原玩家、debug genesis與capability settlement，透過正式position API表達SS；固定default invitation index0，由finalize selection及completeEntry建立合法高中狀態並設age16。原完整能力快照在準備前後不變；之後比賽成長由正式settlement負責，不禁止合法career effects。career role starter是正式role API輸入；當場名單由Opportunity／roster owner決定。沒有手改finalized lineup、starter admission flags、Match phase、completedMoments、PA或outs，沒有fake direct-start或supplied Opportunity。[事前Plan](match-contract-implementation-v0.1-sprint-1-plan-evidence.json)

## 2. 正式執行結果與入口證據

| 完整Suite | 結果 | Entry-Safe elapsed | 成功Node assertion calls | Raw／witness |
|---|---|---:|---:|---|
| 新 Canonical Match Regression | **50/50 PASS**；4場 | 891.007ms | 2668 | [raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-canonical-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-canonical-evidence-assertions.json) |
| 新 Routine Commentary Contract | **1/1原斷言 PASS** | 163.3458ms | 13 | [raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-routine-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-routine-evidence-assertions.json) |
| 既有 match-full-game-record-test.js | **13/13 PASS** | 1036.7505ms | 13 | [raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-match-game-record-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-match-game-record-evidence-assertions.json) |
| 既有 ground-ball-defensive-settlement-lifecycle-regression-test.js | **26/26 PASS** | 2323.1965ms | 60 | [raw](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-ground-settlement-evidence.json)／[witness](test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-ground-settlement-evidence-assertions.json) |

合計4次standalone children、90個具名／原assertion checks、2754個成功Node assertion calls；這三種計數不互換。既有兩套沿用各自全部cases，其中Game Record包含既有full-match／save-load，Ground套件包含lifecycle／reload／settlement及重複套用；它們的既有比賽不納入「新Canonical 4場」計數。沒有新的非預期正式失敗，沒有驗收重跑。[Acceptance](match-contract-implementation-v0.1-sprint-1-acceptance-evidence.json)

四次exit0、stderr空、entryVerified／sourceStable=true，witness確認standalone main及實際assertions。每份raw均保存actualCommand、Node v24.19.0、env、source before／after hashes、完整stdout／stderr、exit／signal／elapsed／policy。命令形態為node.exe --require tests/entry-safe-preload.cjs <實際suite檔案>，完整絕對arguments見raw。政策維持timeout120000ms／outputMaxBuffer16000000 bytes／implicit Git show30000000 bytes；沒有增限。Canonical完整stdout為9572149 bytes，未截斷。[Verification](match-contract-implementation-v0.1-sprint-1-verification-evidence.json)

## 3. 88221／88222各自結果與Replay

所有runs保持原能力、SS、default invitation index0、正常PlayingTime、sample0.72、secure／zone／first-legal政策及safety1400。新Match首次prepare不傳supplied Opportunity，以既有pending test hook指定88221或88222；actual seed與pending消費均assert。沒有換seed、學校、名字或能力尋找PASS。

| 同次execution事實 | 88221首次／replay | 88222首次／replay |
|---|---|---|
| actual simulationSeed | 88221／88221 | 88222／88222 |
| 正式Opportunity | score44、lateGameAppearance、entryInning6、assigned SS | 同左，由正式owner各自產生 |
| 初始名單／狀態 | canonical member＋bench；lineup無player；entry=false、slot=-1 | 同左 |
| 真實替補 | 六局下1 out、playerEntry seq85、第8棒，actual SS換成player | 六局下0 out、seq77、第8棒，actual SS換成player |
| Player PA／建立／完成決策 | 1／1／1 | 1／1／1 |
| 自然終局／ticks | 7局終3 outs、home1／away6；110<1400 | 7局終3 outs、home1／away3；107<1400 |
| State observations | 每場220份before／after皆issues=[] | 每場214份before／after皆issues=[] |
| Defense created／completed | 0／0 | 0／0 |
| Record／log | final、integrity=true；119 unique refs／119 events | final、integrity=true；113 unique refs／113 events |
| Completed IDs（觀測，非固定配額） | 只有hs_y1_match_moment_1 | 只有hs_y1_match_moment_1 |
| Replay | fixture／initial Match／Record／Log／Decision sequence全相同，另deep equality | 同左；與88221分開驗收 |

初始的starter career role沒有直接賦予先發。正式替補之前無玩家Moment；所有呈現決策時，entryCompleted、實際lineup、SS、進攻側、currentBatter及actual batter一致。正式choices非空，採用選項在原合法清單內；每個建立決策各有一次PA、resolved event及completed Moment，終局沒有遺留active situation。每一步完整playback或decision呼叫前後驗Match State；不宣稱取樣了owner內每個微步驟。

| Hash／Replay關係 | 88221 | 88222 |
|---|---|---|
| 完整Record SHA-256 | abb6ee6487c8f39a3e3de3afe945f2494a374d9b78d6c6a6a358c9808dd6cf92 | 6af67e71aba581ac84fc5b215d6af1d9758f14852f8a1282081023a26d2f1ebc |
| Log SHA-256 | 2be47a93cf9e5d85831de8067154a47009ff617bae49ab2bc150812e9c5b0e2e | 96679cf657a33a5e840ce74d437ed657b95d2cc35867be2000fe9b82b82a0d4a |
| 新schema Decision sequence SHA-256 | 65fcb545854cd4b89f113ff7060eadd0e7c9b0b86aefe780450722ce4bd07226 | ed259ebfd8344db8fb2f51d5421338b9aa0b1c05765b3b7233710e1db2aab227 |

兩個seed的fixture／initial Match／Record／Log亦各自與前輪已審查captures逐byte hash相同。Decision sequence本輪有自己的觀測schema，只在同一新Suite首次／replay間比較，不拿不同schema的舊hash作pin。新Helper沒有owner wrappers，這些parity是本固定case的有界證據，不擴張為所有observers中立或所有career等價。[完整Findings／Replay／hashes](match-contract-implementation-v0.1-sprint-1-findings-evidence.json)

## 4. Record／Save memory／Career與公開冪等

Record驗status=final、assertIntegrity、home／away totals與Match及result.finalScore相同、inningLines加總、所有PA總數及玩家PA；eventRefs身份唯一且sequence／type／inning／half逐筆對應真實log。只檢Record內部正確不足以證明admission，所以先另驗Opportunity與實際名單。

每次合法decision完成後，相同choice／expected ID重呼public resolve均false，完整player內容不變；終局再settle兩次＋finish一次皆false，完整player不變、gameEnd仍1。不宣稱低階Moment append等任意直接呼叫也冪等。

normalizeSave memory round-trip逐物件核對rosters、Record、simulationLog、completedMoments、gameExposureState、matchExperience與必要Match欄位，另比對evaluation及match history；Record integrity仍有效。沒有呼叫真正browser storage reload；Save保留混合snapshot不等於其語義正確。

兩場actual exposure均為participated=true、started=false、lateGameAppearance、entry6／exit7、PA1、defensiveInnings1。PA與守備局數由entry後真實log另計，與final exposure、evaluation及history一致；每個fresh context的evaluation sampleCount1、appliedMatchIdentities僅本場、experience settled=true、history1。**守備局數1不代表有meaningful防守Moment；這兩場後者皆0。** Career的結構、參與與identity一致，不替snapshot情境／成長語義作全面背書。

## 5. 獨立Routine Commentary Contract

新Suite在memory中執行原正式檔的完整33-module prefix、原makeContext／__candidate2222／verify及原#38整行；#1–37不執行。固定一壘手、hardGrounder、straightAtPlayer、level8／sample0.99、synthetic seed222201與原字串檢查完全保留。原formatter透過pass-through observer以相同this／arguments呼叫、原result回傳，只複製實際輸入／輸出，沒有RNG call。

原legacy synthetic setup包含age10、人工phase／starter flags及預置completedMoment；這些缺陷照原輸入保留，**只用於presentation責任，不被Canonical Helper載入，也不是Moment3或合法上場證明。** 原檔未改，未另外插入新fake Moment來通過Canonical。

玩家文字仍為：

> 1 出局｜一壘方向的強勁滾地球，你正面把球收住，踩上一壘完成出局。

hardGrounder、straightAtPlayer、playerRoutinePlay、selfCoverFirst、decisionTension各自均不在文字中；原combined否定some predicate原文執行一次通過，新Suite再核對相同五個tokens及真實routine event／非空text。這是獨立正式Suite的 **1/1原assertion PASS**，不是原38項順序執行38/38，亦不涵蓋其他位置或所有fallback文字。

## 6. 原#36／#37／#38保護對照

原[baseball-match-foundation-2-2-2-test.js](../tests/baseball-match-foundation-2-2-2-test.js) lines153–155完全保留；source evidence保存exact三行及hash。以下是新增責任，不刪原predicate，也未將任一列標為formallyReplaced。

| 原保護 | 新正式證據／責任 | 狀態與保留缺口 |
|---|---|---|
| #36 completed | Canonical兩seed各首次＋replay自然完賽 | **CONFIRMED限定fixtures**；原legacy fixture未修 |
| #36固定Moment1 | 本場均自然建立／完成ID1，前輪S1 source-flow證據保留 | 新Canonical不設固定ID配額；原slot assertion仍在 |
| #36固定Moment3 | S3責任維持獨立 | **UNVERIFIED**；原ID／assertion不變，未新增候選或搜尋seed |
| #36 defense completed＝created | 新Suite每場直接assert equality | **CONFIRMED 0＝0**；非零自然守備仍缺 |
| #36 safety<1400 | 110及107，各replay相同 | **CONFIRMED限定fixtures** |
| #37 completed（88222） | 新Canonical獨立88222首次＋replay | **CONFIRMED新正式責任**；原callsite未執行／未修 |
| #37 final integrity（88222） | final＋每tick before／after，另驗Record | **CONFIRMED新正式責任**；不是所有career或browser |
| #38 hardGrounder不外露 | 新Routine保留原combined predicate | **CONFIRMED該固定routine案例** |
| #38 straightAtPlayer不外露 | 同上 | **CONFIRMED該固定案例** |
| #38 playerRoutinePlay不外露 | 同上 | **CONFIRMED該固定案例** |
| #38 selfCoverFirst不外露 | 同上 | **CONFIRMED該固定案例** |
| #38 decisionTension不外露 | 同上 | **CONFIRMED該固定案例** |

Machine matrix為12列，每列formallyReplaced=false。#38五列拆解同一combined predicate，不算五個新增正式case。原完整38項Suite invocations＝0；只抽取#38斷言在新Suite執行1次。原#36歷史FAIL、原#37／#38原順序未到達的歷史狀態不被新測試回填。[Matrix](match-contract-implementation-v0.1-sprint-1-findings-evidence.json)

## 7. KNOWN CONTRACT GAP及未解決項目

| Seed | 決策前 | 正式PA結果後／settlement前 | 終局最後completedMoment | 真正Match／Record終局 |
|---|---|---|---|---|
| 88221 | 6下1 out、home1／away5 | 6下2 outs、1／5 | **6終3 outs、1／6** | **7終3 outs、1／6** |
| 88222 | 6下0 out、home1／away1 | 6下1 out、1／1 | **6終3 outs、1／3** | **7終3 outs、1／3** |

正式settlement只將最後completedMoment的scores、runners、outs、half改成終局，保留原inning。Helper分別複製決策前、正式結果後與Match final summary；Suite保留目前覆寫的gap witness，沒有把混合時間物件當正確decision snapshot。50/50中的4個相關checks證明觀測與legacy資料保留，**snapshot correctness仍未PASS**。未修改Production、completedMoment source、Game Record或Save schema；未重新做consumer全面audit。[三時點證據](match-contract-implementation-v0.1-sprint-1-findings-evidence.json)

仍未關閉：固定Moment3合法source-flow／completion、SS開賽先發、自然非零玩家防守Moment、合法noAppearance全場、supplied Opportunity分支與固定simulationSeed同時要求、browser lifecycle／真正storage reload。兩個seed的替補PASS不替代這些項目。前輪對snapshot consumer的語義裁決仍需人工審查，這輪不延伸修Production。

## 8. Git／WIP Integrity與停止

開工及結案branch=main、HEAD／main／origin/main tracking ref均為指定基線，Git index空。未fetch，未向遠端server重新查證。先驗前輪1494個hash、26個delivery entries與delivery檔案自身，再建立本輪 **1521個既有可讀檔案SHA-256** 清單；結案全相同。Production原WIP及Repair A等既有正式test修改均保留，**本輪Production／既有正式tests／既有fixtures／seeds／pins delta＝0**；正式測試新增僅第1節三檔。[Baseline](match-contract-implementation-v0.1-sprint-1-baseline-evidence.json)、[Closeout](match-contract-implementation-v0.1-sprint-1-closeout-evidence.json)、[Delivery](match-contract-implementation-v0.1-sprint-1-delivery-evidence.json)

12個protected paths僅核對Git status與size／mtime，沒有讀、hash、執行或修改內容；metadata一致不是內容hash證明。所有新captures與報告均exclusive-create，不覆寫舊captures。新helpers目錄會被porcelain折疊顯示；新bookkeeping只接受該狀態拼寫，concrete inventory仍逐檔限制為三個授權新路徑，沒有放寬既有檔案保護。正式執行前即固定Plan及source語法檢查。

採codebase-memory Tier2做必要owner查證，4份material snippets逐行對照current source；path coverage分批返回並對reported partial範圍直接讀取，未重新做全面Architecture Audit。Graph metadata_changed／not_tracked只作best-effort訊號；不能當freshness或repository完整性證明，新reporting檔另direct read／hash與語法／連結核對。[Focused source](match-contract-implementation-v0.1-sprint-1-focused-source-graph-evidence.json)、[Coverage](match-contract-implementation-v0.1-sprint-1-coverage-evidence.json)、[Verification](match-contract-implementation-v0.1-sprint-1-verification-evidence.json)

| Gate | 結果 |
|---|---|
| Sprint 1授權三個正式新增檔／新Suites／最小既有回歸 | **COMPLETE／PASS（限定責任）** |
| 原#36／S3／SS先發／非零防守／snapshot語義關閉 | **NO；FAIL／UNVERIFIED／KNOWN CONTRACT GAP保留** |
| 可啟動Current Test Baseline Verification的技術前置條件 | **YES，待人工審查；本輪NOT STARTED** |
| 全部現有測試皆綠／原38項已PASS | **未證明；不得如此宣稱** |
| Ready for Commit／Ready for Sprint10B | **NO／NO** |
| Receiver v2 | **DISABLED** |

沒有Reset／Clean／Stash／Stage／Commit／Push；Full251／R6Full227／First-base timing／Receiver v2 Integration／Browser suite invocations均0。未進入下一輪baseline verification或其他Sprint。完成Sprint 1後立即停止，等待人工審查。
`;
fs.writeFileSync(path.join(C.root,C.report),text,{flag:'wx'});
console.log(JSON.stringify({report:C.report,exclusiveCreate:true}));
