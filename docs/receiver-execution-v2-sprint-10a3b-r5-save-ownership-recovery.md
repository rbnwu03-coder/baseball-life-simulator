# Receiver Execution v2.2 — Save Ownership & Source Freeze Compatibility Recovery / Sprint10A.3b-R5

專案：Baseball Life Simulation（棒球人生）

日期：2026-10-14（Asia/Taipei）

正式基線：`ab3117653945de0b7013636187c446276a96e634`

**方案 C：Save Ownership Conflict＝BLOCKED。原 Pitch Sequence 完整套件已重現 RED；第8項六個 source comparisons 獨立稽核為5 PASS、1 FAIL，唯一失敗是 `save.js` 全檔凍結。原 Save owner 沒有符合 pre-write 與 pre-default/raw 驗證條件的既有 extension seam。本輪沒有修改 Production、原測試或 pinned Commit，沒有啟動後續回歸或 full227。Ready for Commit＝NO，Ready for Sprint10B＝NO。**

## A. Git / Protected WIP Baseline

main／HEAD／origin/main 均為正式基線，index 空。R5 開工保存 **889個**可讀 tracked／WIP／captures 的 SHA-256，逐項核對 R4 delivery 及原825項 WIP（script 使用 R4 final hash），全部相符。[R5 baseline](receiver-execution-v2-sprint-10a3b-r5-baseline-evidence.json)

本輪 **889項原有 hashes 全部不變**。`save.js`、`player.js`、`script.js`、Source Snapshot、Lifecycle、index、原 tests 及 Sprint10A.3b／R1–R4 captures 保持開工 bytes。Save 開工／結案 hash 都是 `7111e2180f93f15fdaa0c402b6fe034240e064c6acff01d0d79bb1755990ebb7`。

12項 protected WIP 使用 R2 baseline 的 exact path 集合，只核對 Git status、size／mtime；沒有讀取、hash、執行或修改其內容。這是 metadata 保護證據，不能宣稱 protected content hash 相同。Test8 的「protected pitch sources」是另一個可讀 source-freeze 契約，沒有擴張或混同該12項禁止讀取的 WIP。

新增 R5 audit utility／報告／evidence，captures 一律 execution 前拒絕既有目標、寫入使用 exclusive-create；沒有覆寫早期證據。沒有 Reset／Clean／Stash／Stage／Commit／Push。[Closeout](receiver-execution-v2-sprint-10a3b-r5-closeout-evidence.json)

## B. Original RED / Root Cause — CONFIRMED

使用未變的 `tests/pitch-sequence-state-production-integration-test.js`，實際執行一次完整原套件。沿用 full 的原 `node -e` Git-show buffer wrapper、180000ms／30000000-byte buffer，explicit Git buffers 仍保留。Node 為 v24.19.0。

結果：exit1、spawn error＝null、沒有 timeout，耗時 **6135.22ms**。stdout 前7項 PASS，第8項在原141行失敗：

```text
AssertionError [ERR_ASSERTION]: save.js
```

Test SHA-256 為 `22fa869f606737b55548b869fc05d29ef8ef5b49c503d72393ce959c0d24e92c`，與 baseline／R4 相同。完整 command、環境、stdout／stderr／exit／elapsed 保存在 [Pitch RED](receiver-execution-v2-sprint-10a3b-r5-pitch-red-evidence.json)。這是同一個 R4 blocker 的重現，沒有新的失敗原因；原套件 **FAIL**，不能將前7項與獨立比較合併成8/8。

## C. Source Freeze Ownership Matrix / 全部六項比較

固定 comparison Commit 為 `a0e512b439446990d8df118e3e7d737b9f2f51d3`。原第8項使用 normalize-newline 後完整 source；只有明列兩個檔案使用原有 scoped checker。

| Source | 原責任／現行 freeze 範圍 | 原套件實際到達 | R5獨立比較 |
|---|---|---|---|
| pitch-observation-foundation.js | Canonical pitch observation；完整 normalized source equality | 是 | PASS |
| offensive-plate-approach.js | PA／pitch history owner；完整 equality | 是 | PASS |
| pitcher-catcher-tactical-integration.js | Tactical selection；只准原 checker 的 exact repeat eligibility extraction／export | 是 | PASS；並非完整 bytes 相同 |
| pitch-sequencing.js | 原 pitch sequencing／runtime；完整 equality | 是 | PASS |
| save.js | Player persistence、compatibility normalization、Load admission handoff；**整份檔案 equality，沒有 Receiver 例外** | 是，FAIL後停止 | **FAIL** |
| script.js | 原95個 pitch／offense／shared owner 函式、protected constants／registrations、formal external wiring及既有 exact defensive additions | **否** | **PASS，直接呼叫未改的原 scoped checker** |

獨立稽核沒有改第8項或吞掉失敗：六個 comparisons 都使用原 assertion／helper，保存每項 verdict 與 current／formal／pinned normalized SHA-256。[All comparisons](receiver-execution-v2-sprint-10a3b-r5-freeze-comparisons-evidence.json)

`save.js` formal baseline 的完整 normalized bytes 與 pinned source 相同，WIP不同。`script.js` 整檔本來就不是 pinned bytes 相同，其**原 scoped 契約**通過，包括95個函式、top-level declarations 與 external wiring。因此沒有以修第一個檔案為由忽略後續檢查，也沒有觀測到第二個 script freeze conflict。

Freeze 起源可追到 `98bcd1d`：當時第8項六檔皆作完整 equality。既有 [Pitch Sequence specification](pitch-sequence-state-foundation-v0.1.md) 明列 Sequence State 是 derived、由 persisted pitchHistory 重建，不新增 Save schema／authority。結合該文件及原 assertion，可推論 freeze 用來證明這層不接管 persistence、production pitch 或 RNG。這是有來源的責任解讀，不宣稱作者曾授權 Receiver 修改 Save。後來加入 script scope 與 exact extraction，不會自動解除仍為完整 equality 的 Save 契約。[Ownership capture](receiver-execution-v2-sprint-10a3b-r5-ownership-contract-evidence.json)

## D. Original Save Contract / Actual WIP Responsibilities

| Owner／入口 | Pinned／formal original | 保留的 Source-only WIP |
|---|---|---|
| saveGame | name／pending gate 後，直接 `localStorage.setItem(SAVE_KEY, JSON.stringify(player))` | 同一 writer owner；new source branch 先 detached serialize／validate，再單次 write；ordinary branch先 raw validate，再原 literal JSON path |
| normalizeSave | 讀取 sourceSaveVersion，立即 `createInitialPlayer(saved.name)`，`Object.assign(fresh,saved)`，接著 nested defaults／domain normalizers | **新增 raw validation，在 first defaults／merge之前**；再執行原 normalization |
| normalizeSave version | 最後一律 `fresh.saveVersion = SAVE_VERSION`；SAVE_VERSION＝15 | 已驗證 source Save16保留16；ordinary／historical仍15 |
| loadGame | get raw → JSON.parse → normalizeSave → AdultCareerSaveAdmission → admitted 才替換 live Player | **loadGame source完全相同**；raw Source guard由normalizeSave負責 |
| ReceiverSourceSnapshot | 原 baseline 沒有該adapter | validateRawSave／serializeSave／pin與binding驗證；**沒有 Storage writer**，runtimeEnabled=false |
| PlayerDataBoundary | Snapshot／identity／restore界面，compatibility accessors | player.js完全未改；沒有既有 toJSON 或 Source Save hook |
| ApplicationController | 委派 globals saveGame／loadGame，沒有 raw body | 沒有涵蓋直接normalizeSave的原生 raw extension |

開工 WIP 與正式 `save.js` 的差異為 **17行新增、2行移除，3個 hunks**：saveGame pre-write delegation、normalizeSave pre-default raw guard、Save16 version preservation。**R5 source delta＝0**；這些是保留的前輪施工，不是本輪新增修復。

只把 shared `validateHighSchoolDecisionThrowState`／MatchSituationLifecycle／Ground normalizer 擴充，不能取代 raw guard：原 Save 已建立 fresh、merge及重建 Match／handoff 後才呼叫它們。缺失 tag／版本是否被 defaults 或正規化掩蓋，必須在原 raw body 邊界判斷。

既有 [Adult Career admission contract](architecture-sprint-4.10-adult-career-save-admission-boundary.md) 明列其輸入是 **normalized candidate**，責任是 career legitimacy。移轉 Source raw admission 到該 evaluate，時序太晚，且 direct normalizeSave 不會經過它。

## E. Adapter / Raw Guard Reachability Matrix

| 可考慮的接入點 | pre-write完整Player | raw在defaults／merge前 | direct normalizeSave | 結論 |
|---|---|---|---|---|
| 原 saveGame／normalizeSave | writer拿到Player，但沒有Receiver delegation | 沒有；first dependency只收到name | 公開top-level原入口 | 保持bytes時不符合A／B |
| 原 isBaseballGameplayPending | 只回答pending狀態；不是Save validator contract | normalizeSave不呼叫它 | 不涵蓋 | 改成驗證Player也無法補raw入口 |
| 原 createInitialPlayer／PlayerDataBoundary | default construction／identity邊界，沒有Save hook | 只拿到name，沒有raw Save／headers／Match operands | 不能從name驗證raw body | 不可建立隱藏raw global或getter side effect補洞 |
| ApplicationController saveSession／resumeSession | 包覆UI委派可能驗證Player | wrapper不能保證所有raw入口 | 直接normalizeSave繞過wrapper | 不能作唯一Source Save admission |
| AdultCareerSaveAdmission | 不負責writer | normalized之後才evaluate | 不涵蓋 | 不可改稱pre-normalize guard |
| 原Ground／Lifecycle／shared script guard | domain runtime／normalized facts | merge與nested normalization之後 | 僅後段可能到達 | 只能補domain guard，不能證明raw reachability |
| 保留WIP saveGame＋normalizeSave＋Source adapter | serialize/validate在write operands求值時完成；original owner寫入 | source.validateRawSave在first defaults之前 | 函式自身執行raw guard | 目前結構與R4 bounded fixtures有證據，但違反原Save全檔freeze |

Literal入口掃描讀取 **408個可讀JS／CJS檔案**（排除docs及protected內容），保存400個 Save／Load／normalize literal hits，其中 direct normalizeSave 223個 hit rows／90個 files。這些包含既有 source／defensive／save tests的直接入口，顯示只在UI／loadGame外層補guard不足。這是literal scan，不是所有computed call、任意外部注入或dynamic VM的完整枚舉。[Entrypoint evidence](receiver-execution-v2-sprint-10a3b-r5-entrypoint-search-evidence.json)

在原normalizeSave第一個defaults建立之前，除了讀saveVersion及name，没有將raw body委派給可擴充owner。只改現有adapter／script／player時不能取得該raw operand，除非新增owner hook或採用已禁止的global rebinding、Storage/JSON/Object.assign interception、特殊getter/toJSON或隱藏raw狀態。本輪都沒有採用。

## F. 方案 A / B / C Verdict

| 方案 | 設計驗證 | Verdict |
|---|---|---|
| A：凍結Save＋真實既有extension seam | owner完整source、Player/accessors、Controller、pending gate、domain normalizers及Career admission均核對；沒有同時滿足prewrite與pre-default完整raw委派的seam | **NOT FEASIBLE，在現行要求下** |
| B：新Source Save Adapter | adapter不能自行成為writer；原owner不呼叫新adapter，直接normalizeSave亦無pre-default委派 | **NOT FEASIBLE，在現行要求下** |
| C：ownership contract revision | Source-only Save需要original owner的安全接入；原test仍禁止該完整source delta | **SELECTED／BLOCKED** |

Source-only Requirement、Save owner的委派權與source-freeze允許範圍需要人工一起定義。不能以Career45/45、Pitch前7項或舊fixture Green，將整檔assertion的FAIL改判PASS。

## G. Minimal Ownership Contract Revision Proposal — 尚未實作

建議人工架構審查授權一個獨立後續工作，內容限於：

1. **Save owner仍唯一。** 明確允許saveGame委派既有ReceiverSourceSnapshot進行detached source serialization／pre-write validation；adapter不讀寫Storage、不重抽sample、不產生Pin、不改live Player。
2. **Raw admission由normalizeSave入口負責。** 明確允許在first defaults／merge前驗證完整raw object；直接normalizeSave與loadGame必須共用該guard。保留unknown version、missing header／pin／binding與adapter缺席的fail-closed；合法Legacy omission不backfill。
3. **明列版本責任。** 已驗證Source-only Save16保持16；普通Legacy沿用SAVE_VERSION15及原SAVE_KEY；不得將unknown format降級。
4. **授權Save source-freeze的最小scope修訂。** 在另外授權的工作中，review第8項的Save比較是否改為「原pinned source＋明列exact owner delegation／raw guard／version preservation delta」的嚴格checker。保存原pinned Commit，不以目前整份WIP當新baseline，不取消freeze，不接受整函式任意變動；其餘Save、Load admission及五個source comparisons保持原契約。17／2、3hunks是目前待審WIP範圍，**不是已核准例外**。
5. **驗收仍需完整重跑。** 先新增獨立owner contract／raw entry tests，再讓原Pitch完整套件GREEN；接著依R5順序重跑Career、Source Save／historical／cold／tamper、R4／R3／R1／10A.3b、compatibility、Legacy、BBP、first-base180、related，最後原227一次。保留完整captures及新原因停止規則。

需要的是 **「允許Save原owner新增上述三項責任，並允許審查第8項Save freeze的精確例外」的人工架構授權**。本輪沒有改Save、original assertion、helper、pinned Commit或期望值，也沒有提出另一套存檔管理器作替代。若人工要求Save完整bytes永久不動，同時堅持所有raw入口在defaults前驗證，現行架構下兩項要求仍衝突；維持BLOCKED。

## H. Historical / Cold / Tamper / Non-interference Evidence

R5沒有safe implementation，原套件未GREEN；依指示不繼續相關功能回歸。以下是**沿用R4相同source及原tests的有界證據**，hash逐項核對，不能視為R5重跑或方案A／B的驗證：[Inheritance evidence](receiver-execution-v2-sprint-10a3b-r5-inherited-regression-evidence.json)。

| 原證據 | 既有實跑範圍／本輪引用限制 |
|---|---|
| R4 R1 Save focused | 19/19；Source pending／executed／settled的real Save／duplicate／cold；pre-write拒寫；raw erased format在defaults前拒絕 |
| R4 Production Source focused | 108/108；版本、required header／snapshot／pin／binding、actor／physical tamper、cold／duplicate、nullable hold、no writes/RNG/candidate |
| R4 R3 guard | 40/40；同play binding拒絕、cross-play archive自行驗證、Historical omission、early-return guard |
| R4 dependency focused | 44/44；source absent Legacy、new metadata缺adapter拒絕、callbacks／official projection保持 |
| R4 Legacy | 25/25 pairs；sample／callback／Match RNG／outs／bases／record／Evaluation／cold／duplicate；另3/3 baseline-owner Historical pending／executed／settled，no backfill |
| R4 Career | 45/45；normalized Career admission，不是Save source-freeze PASS |
| R4 BBP-B1 | 20/20、baseline／WIP output comparison及full member34 PASS |
| R4 First-base180 | 42/42功能PASS；對formal baseline timing比較4/5、passed=false仍保留，本輪NOT RUN |

R5 Production delta＝0，沒有加入額外writer、candidate execution、RNG、Out／Record／Evaluation consumer。這是本輪沒有功能變動的證據；不代表保留的whole-WIP已通過所有Regression，或正式baseline timing差距已解決。

## I. Actual Runs / Regression / Full Repository

| R5實際工作 | 數量／結果 |
|---|---|
| Original Pitch完整套件RED | **1次；exit1，前7項PASS，第8項FAIL** |
| Test8全部比較獨立稽核 | **6 comparisons；5 PASS＋1 FAIL**；其中script PASS不是原套件到達 |
| Read-only source contract assertions | **21/21**；檢查source順序及owner responsibilities，沒有執行新的Save／Match fixture |
| R5功能focused／Legacy／Historical | **0 checks／0 pairs／0 cases**；R4引用另列 |
| 後續Career／related／compatibility／BBP | **0 suites，本輪NOT RUN** |
| First-base180 | **NOT RUN** |
| Full227 | **0/227；0 invocations，全部227 NOT RUN** |

R4 historical full仍為173/227執行、169PASS＋3Debt＋1pitch source-freeze blocker、54NOT RUN。其失敗集合為gradient、baseball-match-foundation-2-2-2、high-school-year-one-opportunity-two及本輪重現的pitch-sequence；這不是R5的新full verdict。不宣稱224/227、完整failure-set相同或三項Debt本輪重新執行。

## J. Coverage / Safety / Final Gate

codebase-memory Tier2使用search、雙向depth1 traces及snippets，再核對current與formal sources。Dynamic Save→adapter member calls在部分graph trace未解析；normalizeSave snippet受輸出長度限制，因此owner完整source由磁碟直接讀取及保存。Literal掃描的408個source paths全部讀取完整bytes；**470個依賴／scan／evidence paths分5批coverage全部返回**，沒有未取完頁面。446個metadata_changed、24個metadata_match，沒有recorded coverage gap；這些訊號不是完整性／freshness保證。[Architecture](receiver-execution-v2-sprint-10a3b-r5-architecture-evidence.json)、[extra snippets](receiver-execution-v2-sprint-10a3b-r5-architecture-extra-evidence.json)、[coverage](receiver-execution-v2-sprint-10a3b-r5-coverage-evidence.json)

最終原hash、Git／protected metadata、新檔清單、syntax／whitespace及delivery hashes另存；没有Production diff或未核准修復。

| Final Gate | R5結果 |
|---|---|
| Source Freeze Root Cause | **CONFIRMED** |
| Save Ownership Conflict | **BLOCKED，方案C** |
| Original Save Contract | **FAIL，保留WIP不符合原Save完整source freeze**；不宣稱Career功能失敗 |
| Pitch Sequence Full Suite | **FAIL，7項PASS後第8項save.js失敗** |
| Raw Save Guard Reachability | **PARTIAL**：current WIP的三入口順序read-only確認、R4 bounded fixtures引用；凍結original替代方案無必要seam、未實作，不能報整體PASS |
| Historical Compatibility | **PASS，限未變source的R4 3/3引用；本輪0 cases** |
| BBP-B1 | **PASS，限R4 20/20＋comparison引用；本輪NOT RUN** |
| First-base180 | **NOT RUN**；R4功能及timing限制保留 |
| Focused／Legacy | **R5功能0／0；static contract21/21、comparisons5/6另列；R4主focused826/826、Legacy25/25＋3 historical僅引用** |
| Full Repository | **NOT RUN，0/227、0 invocation**；historical R4結果另列 |
| New Production Regression | **R5新原因0；1個保留WIP blocker本輪重現**，未跑full不能推論剩餘集合 |
| Receiver v2 | **DISABLED** |
| L03／Production Source Acceptance／CRT／Capability／Ordinary Effort | **PARTIAL** |
| Sprint10A.3b Production Source-only Integration | **NOT PASS，ownership conflict未解** |
| Ready for Sprint10B | **NO** |
| Ready for Commit | **NO** |

完成方案C停工交付，保留全部既有WIP及captures，等待人工架構審查。沒有開始Sprint10B、11或Defensive Foundation Closeout。
