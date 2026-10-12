# Infield Scorer & Recovery Integrity Repair — Sprint 5

專案：Baseball Life Simulation（棒球人生）

施工／接續日期：2026-10-11–2026-10-12（Asia/Taipei）

狀態：本輪有界修復與驗證完成；整體 Sprint gate 為 PARTIAL。L01／L02／L04 已完成有界修復；L03 的不足來源已明示，但舊模型仍沒有獨立 ordinary-effort receiver proof。最終 focused 79/79、代表套件 13/13；原 227 manifest 為 224 PASS／3 項既有 Debt，沒有新增失敗。

2026-10-12 L03 Closeout 已結案，見 Q：可推導來源接通、原 79/79＋新增 33/33、代表 13/13、獨立 Closeout 全量 224/227。L03 Source Contract 仍 PARTIAL；沒有新 Production regression，沒有進入新接球模型或自動提交。

## A. Baseline / WIP

正式基線為 `f16a7f7b2263681788f3846c2e83fbb6f8b0bc53`，main／HEAD／origin/main 相同，index 空。本次接續時已有三個 Production 修改及 Sprint 5 report／focused test／runner／red／comparison；這些是本任務的既有施工。接續快照與先前代表回歸失敗保存在 [continuation evidence](infield-scorer-recovery-sprint-5-continuation-evidence.json)。

`tests/fast-check-smoke-test.cjs`、`install.ps1`、`docs/first-base-sprint-3-focused-development-evidence.json` 的內容未讀取、執行、修改或 hash。Sprint 4 的四份原始交付與 Sprint 5 原始 red evidence 保留；對可讀的保留證據以接續前後 SHA-256 檢查。沒有 Commit／Push／Reset／Clean／Stash 或 Stage。

## B. Issue Mapping L01–L04

| Issue | 修復／處置 | 邊界 |
|---|---|---|
| L01／P0 | 接傳失敗不再直接等同 E；同球 clean-arrival／普通努力／DP leg／額外進壘分開判斷；補齊 force 相關非安打分類 | 只改 scorer interpretation；不足來源不製造 potential out |
| L02／P1 | 合法後續 receiver E 阻止已證可成立刺殺時，補 preceding completed throw 的 A | 不增加 PO／retirement／DP；already-safe 不補 A |
| L03／P1 | 保存既有 receiver／throw／window provenance，明示 `insufficientScorerFacts` | SS／2B legacy readiness／hands／accuracy 仍未完全分離；PARTIAL |
| L04／P1 | shared lifecycle route-copy guard；逐份比較存在的副本與同球 execution cache | 真正缺少副本的 historical saves 相容；矛盾／空值拒絕 |

## C. Architecture / Actual Owners

```text
owned physical play / roster / original runner state
  → unchanged builders, action facts, raw execution cache
  → ForceAdvancement / RunnerThrowSettlement / Third-Out
  → one Match State apply
  → scorer-only potential-out / effort / DP-leg interpretation
  → existing defensive actor attribution + PA record classification
  → existing GameRecord / player-stage evidence / save recovery
```

| Owner | 本輪變更與責任 |
|---|---|
| DefensiveDecisionThrowFoundation | `resolveScorerEligibility` 只解讀已保存事實；`projectDefensiveAttribution` 合併 actual-out A 與 would-be A，沿用 actor ledger |
| SS／2B／3B／1B builders | execution／capability formulas／sample／raw cache 不變；新 scorer adapter 讀既有 stages 與 arrival／window |
| script.js scorer adapter | apply 原 runner settlement 後投影 E／A／batter classification；meaningful 與 routine 共用相同邊界 |
| MatchGameRecord | 驗證 scorer interpretation；PA 的 team-E ownership delegation 與 actor E 共用原 record owner；same-play 去重 |
| MatchExperienceDevelopment | 不改 stage mapping；raw player／teammate／timing evidence 保留，不能從 official E／safe 反推 execution |
| Save／recovery | `normalizeSave` 呼叫原 validation boundary；新增 route-copy guard；raw execution 重建／settlement replay 邏輯不變 |

codebase-memory Tier 2 已做 symbol search、雙向 depth=1 traces、snippet 及當前 source fallback。最後查證 21 條依賴路徑沒有 recorded gap，但 freshness 均為 `metadata_changed`；不是完整性證明。Graph 的 scorer snippet 舊 end range 沒包含整段新 classifier，已直接讀當前磁碟完整函式補證；registry／family dispatch 亦不能只由缺少 CALLS edge 判不可達。[Architecture evidence](infield-scorer-recovery-sprint-5-architecture-evidence.json)

施工前矩陣：

| Route | 正常完成 | 傳球失敗 | 接球失敗 | 乾淨完成仍來不及 |
|---|---|---|---|---|
| 6-3／4-3／5-3／incoming 1B | actual PO／A | 同球 ordinary effort + potential out 或可歸責 extra advancement 才 E | 可接且本可出局才 E／would-be A | 不因 failed hands 自動 E／A；保留 H |
| 6-4-3／4-6-3／5-4-3／3-6-3 | 真實兩個 retirements 才 DP | 第一段與 completion throw 分開；第二傳 wild 無 extra advancement 不 E | 本可完成第二 out 的 ordinary muff 可 E／A | 保留第一 force；無第二 PO／DP；打者為非安打 FC |
| 3U／5U | possession + touch，PO 無 A | 無 throw | failed acquisition 不編造未存在的 clean throw；沿用 field scorer 相容邊界 | 原 touch timing／retirement 不改 |
| 3-1／forceSecond／home | 原 actor／target／force authority | 原 stage facts 足夠才判 E | readiness／hands／incoming quality 分開或明示不足 | 不虛構 out／assist |

## D. Error Eligibility Contract

`infield-scorer-eligibility-v1` 保存 failed action ID、actor、runner／base、ordinary-effort status/source、同球 clean completion／runner arrival 或 legacy window、DP leg／first actual force、attributable advancement、decision reason。只做 deterministic arithmetic；不取新 execution sample 或重新模擬。

charge E 需普通努力可成立，且 misplay 阻止 feasible out 或有明示可歸責的額外進壘；wild DP completion throw 無額外進壘有例外。真正 receiver muff 及第一段 inaccurate throw 不受 completion exception 保護。已退休的同 runner／base 不因初次 misplay 自動 E。沒有把初始／最終壘位差當作 error-caused extra advancement。

本輪明示 benchmark 為 [MLB 2026 OBR](https://mktg.mlbstatic.com/mlb/official-information/2026-official-baseball-rules.pdf)：9.12(a)／(d) 的 error eligibility 與 DP throw／muff 差異；9.10(a)(1) 的後續 E 助殺；9.05(b)(1) 的實際或被 E 阻止之 force 非安打。這是本有界合約的規則解讀，不宣稱取得全部臺灣高中賽事特別規程。

## E. Would-Be Putout Assist Contract

先驗證同球 scorer contest 的 runner／base，throw／receive contest 必須連到正確 terminal action dependency。僅 charged receiver E + feasible out 追溯 completed throw ancestors，補 A=1；與 actual-out A 共用 actor projection，同 actor 同 play 不重複 A。未完成上游、其他 runner／base、無關 terminal chain、already-safe 或沒有 ordinary-effort proof 都不能獲得 would-be A。

5-3 的 3B、5-4-3 第二段的 2B、3-6-3 第二段的 SS 都有正例；already-safe incoming 與 fast-safe return 有反例。PO／DP／retirement 仍只由 actual completed chain 及原 retirement ledger 決定。

## F. Legacy SS / 2B Adapter

SS 的 first throw 仍 canonical，receiver 仍舊 fielding proxy；2B 的 `legacyUsableDelivery`、route window、combined readiness／hands 保留原 authority。新 envelope 從 action facts 保存真實 actor／target，從 receiver projection 讀 available／ready／fielding／sample／threshold，從 saved window／arrival 讀 potential-out provenance。

這些資料不能證明獨立 ordinary-effort 接球時，回 `insufficientScorerFacts`，不依 failed receiver 機械式判 E／A，也不加第二次 receiver success roll。L03 的資訊不足已可觀察、可測；底層事實完整性仍 PARTIAL，沒有偷偷換成 canonical SS resolver。

初次 ground acquisition failed 時，沒有 selected clean throw／arrival cache。本輪保留既有 field scorer 分類並附 `scorerCompatibility.status=insufficientScorerFacts`，不把無來源的新 projection 當作修復，亦不宣稱這些 field E 已通過完整 official scorer 驗收。此相容處置避免原合法／既有 field 記錄被全數清為零；歷史 settled GameRecord 不作 retroactive backfill。

## G. Route-Copy Validation

`validateHighSchoolGroundLifecycleRoutes` 在原 decision-throw validation 入口執行，檢查存在的 `decision.selectedRoute`、`executionState.selectedRoute`、legal route list，以及同球 SS／3B／1B cache choice 或 2B preControlIntent。矛盾、`forged` 或空值拒絕；不是優先相信一份而忽略另一份。

四守位 × pending／executed／settled × 兩份副本 × forged／空值，共 48 個新增拒絕 probes，全部查 input／live player／cursor 不變；原四個 executed tamper 亦通過。settled fixture 捕捉 Production markSettled 後、立即 close 前的合法 transient boundary；普通閉合後 cold reload 另測。12 個真正省略 execution route copy 的 saves 可 admission，另四個 v1／v2／v3 historical topology cases 保留 ownership。

## H. Modified Files

| Tracked file | 變更 |
|---|---|
| `defensive-decision-throw-foundation.js` | pure scorer eligibility／target-chain validation／would-be A；原 execution resolvers 不改 |
| `script.js` | scorer projection／force FC classification／兩個 additive PA ownership markers／route-copy guard |
| `match-game-record.js` | scorer validation／同球 actor 與 team E ownership；H 仍由 PA record owner 計算 |
| `tests/third-base-ground-production-integration-test.js` | 修正 L01 已確認錯誤的 second-throw E=1 assertion 為 E=0；加 team E／reason，原 execution assertions／seed／fixture 保留 |
| `tests/pitch-production-source-scope.cjs` | 只白名單兩處完全相同的 additive scorer-owner metadata；95 protected functions／25 globals／wiring guard 保留 |

新增 focused test 與 validation runner；其餘新檔是本 Sprint 報告及 evidence。原 227 manifest 中的 test sources 未修改；上述 3B suite 與 source-scope helper 不在該原 manifest。三項 Debt 的 assertions／seeds 不改。

## I. Red / Green Evidence

原始 exact f16 red：8 PASS／12 FAIL（9 confirmed defects、3 missing contract）；保存當時完整 test source／source hashes／snapshots，不覆寫。[Immutable red](infield-scorer-recovery-sprint-5-red-evidence.json)

最終 focused：**79/79 PASS**，包括四守位 actor totals／legal E／非 E failure／would-be A／extra advancement pure contract／PA classification／meaningful-routine／dedupe／save／historical topology／route copies／no reroll。

驗證途中發現修復引入的 FC／H 分類缺口，已保存 [PA classification red](infield-scorer-recovery-sprint-5-pa-classification-red.json)，再補八個 actual-force meaningful／routine cases 與四個 prevented-force cases。不是歷史 Debt；沒有用舊 67／75 PASS 宣稱此邊界已完成。[Final green](infield-scorer-recovery-sprint-5-green-final-evidence.json)

初版新增 probe 曾用不存在的 own-1B／SS route ID，並把 closed 後的 null lifecycle 當 settled；只修正新 harness，改用真實 `selfCoverFirst`／`startDoublePlaySecond` 與合法 settled transient boundary，不改 Production 結果或 seeds。

## J. Scorer Semantics Before / After

| Exact f16 fixture | Before | Final After | Actual execution |
|---|---|---|---|
| Fast batter clean receive 也 safe；1B failed hands | player／team E=1，away H=0 | E=0，H=1，A／PO=0 | outs=0，原 batter 只在一壘，same scores／identities |
| 5-4-3／3-6-3 first force 成功、wild second throw、無額外進壘 | relay E=1／team E=1，H=0 | relay E=0／team E=0，H=0；FC | 原 first out=1；無第二 PO／DP |
| 5-3 on-target ordinary receiver muff 阻止 slow batter out | receiver E=1，3B A=0 | receiver E=1，3B A=1 | outs=0／PO=0，不虛構 retirement |
| 5-4-3／3-6-3 final muff 阻止第二 out | receiver E=1，relay A=0 | receiver E=1，relay A=1；非安打 FC | first out=1；第二 PO／DP=0 |
| First-leg inaccurate throw 阻止可證 force | 原 E，非 H | 合法 thrower E + FC／H=0；receiver E=0 | outs=0，兩跑者仍依原 settlement safe |
| Already-safe throw/receive，無可歸責額外進壘 | 某些 raw failure 會 E | 不因 failure／safe 自動 E／A | 同一 ball、target、actions 與 runner settlement |
| 已證 extra advancement、無 potential out | 無 scorer contract | 可 E；原本 H 保留；A=0 | 本項是 declared pure contract + real record owner，不是自然 Production extra-base witness |

FC 沿用現有 PA vocabulary 的 `out` 作非安打 compatibility result，另存 `batterScoring.classification=fieldersChoice` 與 actual／prevented force proof。此 `out` 不代表 batter retirement；tests 明查 batter 仍在一壘、actual outs／PO／DP 未增加。

32 場固定 playback 前後對照只有 1B 的兩場 official record 改變：seed 77006 away H 14→12（PA sequence 93／115），seed 77007 H 15→14（sequence 85）。都是 partial incoming DP 的 `single`→非安打 FC compatibility `out`；batter H／pitcher H 同步下降，比分／壘況／出局／cursor 無差異。

## K. GameRecord / Evaluation

`scorerFacts` 由原 action facts／retirements 再推導驗證，tampered charged flag／physical identity／無關 runner 或 chain 拒絕。PA `scorerErrorOwner` 把 team E 委交同一 defensive actor attribution；因此 extra-advancement E 可以與 base hit 共存，receiver E 不會在 PA 與 defense event 各加一次。同一 ball 的 meaningful／routine／defensiveResolution references 不重記 actor statistics。

player／teammate stage labels 與 raw cache 保留。接穩但 runner safe 不降接球品質；真正 failed hands 即使依法沒有 E，也仍是 failed receive 的 execution evidence。MatchExperienceDevelopment source 不變。未宣稱完成全 official RBI／earned-run／rundown／appeal reconstruction，既有 coarse quality 限制仍在。

## L. Save / Replay / Observer Neutrality

四守位 × clean／low throwing／low hands，12 組 pending→executed→settled cold reload；initial public sample callback=1，recovery／duplicate 禁用 Math.random，match／record／experience／cursor 相同。四個 public handler duplicate 不再讀 sample、不重記 E／A／PA。

預宣告四守位 × seeds 77001–77008，共 32 pairs：exact f16 root Production 由 `git show` 在記憶體編譯，current 用磁碟 source；原 careerFixture 初始化 skills=12，既有 first legal choice／sample .62；不覆寫賽中 ball／runner／capability／result。

32 pairs 的 physical truth／owned samples、match RNG values/count、public samples、每步 outs／bases／runs／cursor transitions、raw action/retirement projection／settlement 全部相同。8 current wrapped／unwrapped（各守位 seeds 77001–77002）完整 match／record／cold-reload hashes 相同。record 差異另列 J；observer 不補造全 PA physical denominator。[Comparison](infield-scorer-recovery-sprint-5-execution-comparison.json)

## M. Cross-Position Regression

Sprint 5 最終代表性 13 suites 為 13/13 PASS：MatchGameRecord、SS Production、DecisionThrow Production、2B Shared Infield、3B Production、1B Production、ForceAdvancement、RunnerThrowSettlement、MatchExperienceDevelopment、Ground Identity、Ground Lifecycle、Save Admission、Pitch Source Scope。L03 Closeout 的獨立結果見 Q。

此前 10/13 的三項失敗保留在 continuation evidence：failed-acquisition scorer 被無來源清零（改為 explicit compatibility）、舊 L01 DP E assertion（依法更新）、source freeze 不知 additive marker（精確白名單 + negative mutation probes）。均另查證，不挪入 Debt。此前 13/13 屬較早 scorer snapshot；最終以本輪最新 hashes 的代表 regression 為準。

## N. Full 227 Regression

原 manifest 數量／順序／SHA-256 `871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96` 保留。Sprint 5 最終穩定 source 的 `full-final` 已完成 224/227 PASS；前兩次 validation 是中間 snapshot，不能取代 final evidence。L03 Closeout 的獨立結果見 Q。

明示驗證次數：中間無 buffer shim 的原 227 为 222/227，含三项 Debt + 兩個 `git show` ENOBUFS；actual-force-only 中間修復为 224/227／focused 75；之後仍發現 prevented-force 非安打缺口，因此再完成最終 source 的 227 manifest。不是只跑一次；前兩份原始結果完整保留，沒有覆寫成全綠。

ENOBUFS 為 TEST HARNESS ISSUE：exact f16 `script.js` 1,050,740 bytes，已超過 Node 預設 1,048,576 buffer。兩個舊 UI tests 在 assertion 前讀 baseline 被截断，current 與 exact f16 都重現。final harness 僅對沒有明示 maxBuffer 的 `git show` 給 30 MB；不改 tests、assertions、Production 或 seeds。已有明示 buffer 的呼叫不改。

| 歷史 Debt | Final current／exact f16 要求 |
|---|---|
| ability-performance-gradient-test.js | 相同 Low tier can have a multi-hit game failure；test hash 不變 |
| baseball-match-foundation-2-2-2-test.js | 相同第 36 full-match assertion；test hash 不變 |
| high-school-year-one-opportunity-two-integration-test.js | 相同缺 DefensiveDecisionThrowFoundation 的 partial-runtime failure；test hash 不變 |

[Final manifest evidence](infield-scorer-recovery-sprint-5-validation-final.json)；[最初完整結果](infield-scorer-recovery-sprint-5-validation.json)；[actual-force-only 中間結果](infield-scorer-recovery-sprint-5-validation-force-actual-only.json)。

## O. Remaining Risks

1. L03 底層 receiver ordinary effort／arrival／accuracy 的 legacy 缺口尚未補成獨立可證事實；本輪明示不足，不把無 E／A 反過來當作所有 legacy scorer 已正確。
2. Failed acquisition 保留原 field scorer 相容分類，未新增 clean throw simulation；此範圍的完整正式 E gate 未宣稱完成。
3. Production movement intents 沒有 error-specific extra-base provenance；extra-advancement branch 已有 pure contract／GameRecord test，不能說有自然 extra-base witness。
4. Coarse arrival units／receiver proxies／force-on-touch retreat／process-quality／ability input coupling／完整分布分母仍沿用 Sprint 4 邊界；沒有調責任區或平衡。
5. 本輪不能正式宣告 Defense Foundation Closeout；L03 的資料完整性與歷史 full-repository Debt 仍需人工決定後續工作。

## P. Final Gate

| Gate | 結果 |
|---|---|
| L01 Error Eligibility | PASS（已確認 witnesses／同球有來源子範圍；含 force non-hit 修復） |
| L02 Would-Be Assist | PASS（可證 receiver E 子範圍；無 virtual out／PO／DP） |
| L03 Legacy Receiver Facts | PARTIAL（explicit insufficiency contract 通過；原事實仍不足） |
| L04 Route-Copy Validation | PASS |
| GameRecord / PA Classification | PASS（本輪有界 E／A／H／FC；非全 official scoring） |
| Save / Exactly-Once | PASS |
| SS／2B／3B／1B Regression | PASS（final 代表套件 13/13；focused 79/79） |
| Full Repository Regression | PARTIAL（224/227 PASS；僅三項原有 Debt，exact f16 同訊息重現） |
| Sprint Delta Regression | PASS（新增失敗=0；final 測試／比較／代表來源一致） |
| Ready for Commit | NO（L03 仍 PARTIAL；提交前先人工審查有界處置與剩餘 scope） |

整體 Sprint gate 為 PARTIAL，不宣稱全部 scorer facts／正式 Foundation Closeout 完成。已確認 P0 witnesses 的 E／hit attribution 與 L02／L04 已修復；尚未提交。

最終 source／保留證據 hashes、diff check、status／stat、新增文件 trailing whitespace 檢查保存在 [continuation evidence](infield-scorer-recovery-sprint-5-continuation-evidence.json)。完成後停止，等待人工審查。

最終交付入口：

- [Final focused green evidence](infield-scorer-recovery-sprint-5-green-final-evidence.json)：79/79。
- [Final 227 evidence](infield-scorer-recovery-sprint-5-validation-final.json)：224/227、三項 Debt 的 exact f16 重現、原 manifest 與 suite hashes。
- [Execution comparison／representative evidence](infield-scorer-recovery-sprint-5-execution-comparison.json)：32 對前後執行比較、8 組 observer neutrality、13/13 代表回歸。
- [Architecture evidence](infield-scorer-recovery-sprint-5-architecture-evidence.json)、[immutable red](infield-scorer-recovery-sprint-5-red-evidence.json)、[新增 PA red](infield-scorer-recovery-sprint-5-pa-classification-red.json)：來源查證、原始缺陷及後續反例。
- [Focused test](../tests/infield-scorer-recovery-integrity-repair-test.js)、[validation runner](../tests/infield-scorer-sprint-5-validation-runner.cjs)：可重跑的驗證來源。

## Q. L03 Legacy Receiver Scorer Facts Closeout — 2026-10-12

本節接續 Sprint 5，沒有啟動 Legacy Receiver Model Sprint。保留本節施工前全部 Production／測試／原始證據；原 79 項 focused test 檔案也沒有修改。只新增來源投影、修正 scorer 讀取現有 2B window 的欄位，以及獨立的 L03 tests／runner／JSON。既有 Sprint 5 的 L01／L02 eligibility rules、L04 validation 與 scorer ledger owner 不變。

### Q1. Source-to-Scorer Matrix

A=原有 authoritative execution fact；B=從原有事實作 deterministic projection；C=unavailable／insufficient。**C 不是普通努力漏接的證明，也不是乾淨完成必定出局的證明。** 完整欄位、owner 與 route 限制見 [source matrix](infield-scorer-recovery-sprint-5-l03-source-matrix.json)。

| Route／actor path | Delivery／incoming | Readiness／hands | Clean completion／runner arrival | Ordinary effort／extra advancement | E／A／H／FC 處置 |
|---|---|---|---|---|---|
| 6-3：SS→NPC 1B | A canonical first throw quality／真實 actor | A saved receiverCompletion 與 combined ready；B 原 fielding／sample score；獨立到位與 hands=C | A runner arrival；B 原 distance／release／delay 的同球比較 | 獨立 ordinary effort=C；misplay-specific advancement=C | 已可證 thrower E 保留；receiver proxy failure 明示不足，不自動 E／would-be A／剝奪 H |
| 4-3：2B→NPC 1B | A legacyUsableDelivery；獨立來球位置=C | A available／ready／secured／fielding／owned sample／threshold；獨立 readiness／hands=C | A firstLegTimingWindow；B ordinal window feasibility；continuous arrival=C | C | 原合法 out／A／PO 不變；failure 不以未證明的普通努力補 E／A |
| 6-4-3：SS→2B→1B | 第一傳 A；第二段 turn／delivery stage=A；獨立第二傳 accuracy=C | A relay receive／firstBaseReceive；B 原 threshold diagnostic；獨立階段=C | A 第一 force／continuation window；第二段 continuous arrival=C | C | 保留第一 out／A／PO／FC；未證的第二次 E／A／PO／DP 不補造 |
| 4-6-3：2B→SS→1B | A first delivery／SS secondThrow stage | A SS receive／firstBaseReceive；B 原 capability＋sample | A 第一 force／continuation window；第二段 exact arrival=C | C | 同上；同球 actual assist 不重記 |
| SS forceSecond／homeForceOut | A canonical first throw／合法 2B 或 C actor | A combined receiver proxy；B score；分離事實=C | A arrival＋B timing | C | 原 actual target／retirement／A／PO／非安打分類保留 |
| 2B attackLeadRunnerThird／homeForceOut | A composite delivery／合法 3B 或 C actor；location=C | A receiverResolution；B score；獨立事實=C | A 原 target window；B ordinal feasibility；exact arrival=C | C | 原 force 結算與記錄保留 |
| 2B preventRunHome | A composite throw／catcher receive／tag facts | B 原 fielding＋reaction＋sample diagnostic；獨立接傳事實=C | A homeTagLeg；failed receive 的 clean tag timing=C | C | 本節只作 source review；沒有補造新的 home-tag witness |
| player 2B coverSecondFor643 | A 原 upstreamThrowQuality／coverageQuality／receive／pivot stages | B 原 receive penalty＋capability＋sample；獨立 ordinary-effort secure=C | A 原 force／route window；continuous clean arrival=C | C | 既有 legacy coverage slice；不是本節 ordinary 2B-primary admission witness |
| NPC SS／2B→player 1B incoming | A 原 upstream identity／delivery | A 既有獨立 incoming readiness／hands | B 原 saved arrival comparison | 沿用已完成 L01／L02 的有來源條件 | 真正 player receiving E＋preceding A 正例仍成立；not-at-base／already-safe 無 E／A |

### Q2. 有界接入與停止邊界

新增 `getHighSchoolLegacyReceiverScorerSource`。它只讀 saved action identity、capability snapshot、original owned sample、receiver projection 與 timing；把 A／B／C 放進失敗 action 的 scorer contest evidence。combined-score arithmetic 只是來源診斷，不再跑 receive success decision，不把 threshold 當成獨立 Secure 或 ordinary-effort authority。

2B 原有 `resolution.firstLegTimingWindow` 已保存 `{value,state}`，舊 scorer 卻讀 `timingResolution.firstLegTimingWindow`／字串 `routeWindow`，因此錯失既有 ordinal window。現在讀原保存物件；原 usable delivery＋available receiver 能支持窗口層級的 feasibility，但 ordinary effort 仍明示 insufficient。此修正沒有改 E／A／H／FC，也沒有改實際 out。

**模型施工已在此停止。** 6-3 的 combined ready、4-3 的 composite delivery／receive、兩種 DP 的 relay.turn／firstBaseReceive，都不足以區分「尚未到位」「來球不可接」「普通努力漏接」。第二段缺 continuous arrival，亦不能把 ordinal window 捏成清潔接傳所需時間。取得這些事實需要另有 receiver location／readiness／secure execution authority，或獨立來球位置／時間合約；本節沒有引入。

可以安全維持 `insufficientScorerFacts`：不足不自動產生 E／would-be A，不新增退休／PO／DP，不回填已 settled GameRecord。原 canonical player 1B／3B NPC receive 的合法 E／A仍有正例，故沒有全域豁免 receiver failure。若需要完成 legacy 普通努力漏接的正式判定，應另立有界 **Legacy Receiver Model Sprint**，再明定獨立接球責任及時間來源。

### Q3. Red／Green、正反例與來源界限

原 Sprint 5 Red 及其他既有 JSON 均保留。本節的 [L03 red-source](infield-scorer-recovery-sprint-5-l03-red-source-evidence.json) 為 Production 修改前 26 項：2 PASS／24 missing-contract FAIL；沒有把不存在的 ordinary-effort counterfactual 當成 rule bug。更早的 [初版 red](infield-scorer-recovery-sprint-5-l03-red-evidence.json) 也保留，其中兩項 player incoming 測試先錯用 direct route；改從已公開的 `startDoublePlaySecond`／`initiate463` 執行，不改 Production 或 expected scorer 規則。

新增 focused tests 已涵蓋 33 項：四組 meaningful／routine 的 direct out、slow／fast combined failure、partial DP；SS offline throw；SS 未完成 turn／未啟動第二傳；2B 第一／第二段 delivery failure；2B explicit unavailable receiver；獨立 player 1B not-at-base；canonical NPC 與 player receiving E／A 正例；同球重複 A／PO guard；其他合法 force targets；兩守位 pending／executed／settled replay。

每項結果型 fixture 同時檢查 E／A／H／FC 及 actual outs／bases／runs；不是只查 reason。legacy 普通努力漏接、獨立尚未到位與已來不及刺殺的完整 SS／2B 正例，**仍受 C 所限**：SS 可用原 arrival 比較查 already-safe；2B admitted narrow window 不等於 clean reception 已來不及，不能借 fast batter 名稱宣稱同類物理證明。正確未嘗試的第二傳也不改成 wild throw；新增 harness 的初次 `failed` 預期已按原 action ledger 查明為 `notAttempted`，不改原 79 assertions。

### Q4. 回歸與前後對照

Closeout final validation 已完成：原 focused **79/79**，檔案與 assertions 保持原 SHA-256；新增 L03 **33/33**；代表套件 **13/13**。本節 Production 修改僅 `script.js` 的來源投影與原 window 欄位接入；SS／2B／relay／receiver execution 函式、L01／L02 pure rules、L04 guard 與其他 Production 檔案內容不變。新增 test 與 runner 採獨立檔案，沒有修改或覆寫原 Sprint 5 runner／green／comparison／validation evidence。

本節最終只執行原 227 manifest **一次**，結果 **224/227 PASS／3 FAIL**，新增 Production regression=**0**。manifest 數量／順序／hash 與 227 個 suite source hashes 不變；final source／validation input hashes 在整次執行中相同。三項 FAIL 都在 exact f16 以相同原 test、原 signature 重現：Low tier multi-hit、第 36 full-match assertion、缺 DefensiveDecisionThrowFoundation 的 partial runtime。保持原 Baseline Debt 分類，沒有修復或挪入新失敗。沿用先前已查證的 30 MB `git show` buffer compatibility，不改原 tests／assertions。[Closeout full evidence](infield-scorer-recovery-sprint-5-l03-validation-final.json)、[L03 green](infield-scorer-recovery-sprint-5-l03-green-evidence.json)

相關比較以 [施工前 Sprint 5 source snapshot](infield-scorer-recovery-sprint-5-l03-prior-source.json) 作 baseline，沒有用 exact f16 取代「本節前後」比較。31 個完整結果型 fixture 的 raw execution、actor statistics、E／A／H／FC、outs／bases／runs／cursor 均相等；新增來源資訊與 window feasibility projection 單獨保存，沒有以記錄修正掩蓋執行差異。[Fixture comparison](infield-scorer-recovery-sprint-5-l03-fixture-comparison.json)

32 pairs（四守位 × 原固定 seeds 77001–77008）physical truth／owned samples、RNG draws、action／retirement、outs／bases／runs／cursor 全相等，**E／A／H／FC record changes=0**。8 wrapped／unwrapped pilot 的完整 match／record／reload hashes 相等。SS／2B／coverage／receiver proxy／relay 的原 execution 函式內容也與施工前逐段相同；scorer rules、MatchGameRecord、MatchExperienceDevelopment、Save、Runner Settlement 檔案未修改。[Closeout comparison](infield-scorer-recovery-sprint-5-l03-execution-comparison.json)

### Q5. Closeout Gate

| Gate | 本節結果 |
|---|---|
| L03 Source Contract | PARTIAL：現有來源接通並明示 C；缺少獨立 receiver authority 的範圍未完成 |
| L01／L02 Regression | PASS：原 known scorer witnesses 未重現，原 79 assertions 不變 |
| L04 Route-Copy Regression | PASS：原四守位 tamper／historical／三階段 checks 保留 |
| GameRecord／PA Classification | PASS：有界 regression／去重／前後 E／A／H／FC 一致；C 不等於完整 official scorer 驗收 |
| SS／2B／3B／1B Regression | PASS：代表 13/13，原 focused 79/79＋L03 33/33 |
| Save／Exactly-Once | PASS：兩守位新增三階段 replay＋原四守位 replay；無 reroll／重記 |
| Full Repository | PARTIAL：224/227，僅原三項 Debt；本節 manifest 執行一次 |
| 新增 Production Regression 數量 | 0 |
| Ready for Commit | NO；剩餘 ordinary-effort source 欠缺仍須人工決定後續模型與有界合約 |

沒有自動 Commit／Push／Stage，也沒有要求或默認開啟下一個模型 Sprint。最終完整性、受保護 WIP 與所有原始證據的保留檢查見 [L03 closeout evidence](infield-scorer-recovery-sprint-5-l03-closeout-evidence.json)。完成後停止，等待人工審查。

本節尚未提出 Ready for Commit=YES：對普通努力 receiver error 的完整 legacy 判定仍沒有來源，不能把有界 regression 全綠視為其證明。若人工決定將剩餘 L03 限縮為後續模型擴充，可依 source matrix／明示不足／不自動 E 或 would-be A／P0-P1 known regression／已界定後續權威五項證據再審查有條件提交；本節沒有代為接受此風險或自動提交。

來源 discovery 採 codebase-memory Tier 2；18 條 evidence paths 完整回傳，皆 no_recorded_issue，但 freshness 為 metadata_changed／not_tracked。已讀當前 source 補證，沒有把 graph metadata 當成新鮮度或完整性證明。[Closeout architecture](infield-scorer-recovery-sprint-5-l03-architecture-evidence.json)

可重跑的新來源：[L03 focused](../tests/infield-legacy-receiver-scorer-closeout-test.js)、[isolated runner](../tests/infield-legacy-receiver-scorer-closeout-runner.cjs)。原始 captures 均有不可覆寫 guard；不要直接重跑 prepare／full-final 覆寫已結案證據。
