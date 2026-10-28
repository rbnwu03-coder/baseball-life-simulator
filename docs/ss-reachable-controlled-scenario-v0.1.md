# 《棒球人生》SS Reachable Controlled Scenario v0.1

任務：Defensive Decision Vertical Proof  
日期：2026-10-15（Asia/Taipei）  
Git參考基線：`ab3117653945de0b7013636187c446276a96e634`

**唯一固定能力情境及一次必要replay已完成並停止：Legal Fixture、正式SS admission、Physical／binding、Reach／Access及Secure成立；原owner將本球分類為routine，沒有提供玩家守備決策。完整Controlled SS Defensive Vertical Proof＝UNVERIFIED。**

Reach margin為 **4.759**、cleanArrival；Secure margin為 **4.572**、cleanControl。原routine路徑自動完成傳一壘、runner timing及一次出局；這不是玩家選擇的6-3，也沒有預先要求出局。兩次均在 **tick44、4局上1出局、home0／away1** 按事前停止條件結束；未完賽，不能宣稱Final Record／完整Career或完整Match replay通過。

**Production／既有tests／fixtures／seeds／pins delta＝0。1760個既有可讀檔案hashes全不變。Match UI Slice資料契約前置條件＝NO；Ready for Commit／Sprint10B＝NO；Receiver v2＝DISABLED。**

## 1. 能力來源、完整fixture與前置owner契約

事前先核對 `tests/ss-defensive-production-integration-test.js`：其`careerFixture`由共同Node helper建立代表性球員，再把raw baseballSkills設為12；單球`ssFixture`另有fielding／catching／reaction／range／arm／throwing／decision=10的per-play override，並直接改Match局勢。**本輪不照搬後兩種active Match／defender override。**

本輪唯一新增資料控制固定為raw12中的五個守備欄位；沒有試第二組能力：

| 完整fixture欄位 | 前輪 | 本輪固定輸入 | normalize後 |
|---|---:|---:|---:|
| baseballSkills.catching | 4 | 12 | 12 |
| baseballSkills.reaction | 3 | 12 | 12 |
| baseballSkills.range | 3 | 12 | 12 |
| baseballSkills.throwing | 4 | 12 | 12 |
| baseballSkills.armStrength | 3 | 12 | 12 |

其餘raw skills、genesis／traits、Player身份、原學校／對手、SS／慣用手、入學checkpoint與story step5均保持原資料。這是對既有fixture數值的**守備子集重用**，不是原SS fixture全部能力原樣移植，更不是新發明一組能力10的球員。[Ability spec](ss-reachable-controlled-scenario-v0.1-ability-spec-evidence.json)

五欄先在host組成完整fixture input，才交正式`normalizeSave`建立隔離player；未對active player／Match／defender寫raw skills。當時Match id為空、log0、rosters.home／away皆null。`settleHighSchoolEntryCapability`回existing／ok，`validateHighSchoolEntryCapability`、`assertHighSchoolMatchCapabilityAdmission`及invitation validation均接受。原selected school identity保持；Match prepare再由正式roster owner重新注入、投影目前能力，沒有安裝finalized lineup。[完整before／input／after及owner結果](ss-reachable-controlled-scenario-v0.1-fixture-compatibility-evidence.json)

Current contract允許有效完整fixture的current skills保留在1–20範圍，`getDefensiveSimulationCapability`再正式轉換為 **fielding10、reaction9、range9、arm9、throwing9、decision2**；offensive mobility仍2。沒有將SS per-play capability10 override塞進Match。

這是明示測試資料，不聲稱五欄12可由原自然成長歷程取得。原initial capability／ledger metadata保留；上述validator驗current值與版本，並未證明新增raw值與歷史ledger逐項等價。完整輸入的接受範圍與自然career歷史分開記錄。[Current conversion／validation source](ss-reachable-controlled-scenario-v0.1-source-evidence.json)

## 2. 事前Scenario、Current Match及adapter邊界

首次gameplay前固定 [Plan](ss-reachable-controlled-scenario-v0.1-plan-evidence.json)、[Fixture input](ss-reachable-controlled-scenario-v0.1-fixture-input-evidence.json)、[遞迴檢查範圍](ss-reachable-controlled-scenario-v0.1-recursive-read-whitelist-evidence.json) 與 [Execution whitelist](ss-reachable-controlled-scenario-v0.1-execution-read-whitelist-evidence.json)。前置fixture normalization及hook可用性檢查均0場Match prepare／0次gameplay。

| 控制／owner責任 | 固定規格／實際結果 |
|---|---|
| Scenario身分 | 沿用ss-controlled-ground-v0.1；唯一新資料控制為上列五個守備skills |
| 正式入口 | high_school_showcase → prepareCurrentHighSchoolYearOneMatch()；無自訂id、supplied Opportunity或fake starter flag |
| Match／seed | hs-y1-autumn-exhibition；2884315748由原pending hook交正式seed owner消費，未改RNG |
| 原Physical rolls | contactQuality0.65／ballType0.1／pace0.68／direction0.05／depth0，沒有outcome override |
| 玩家政策 | 進攻secure／zone／first legal；若有守備決策則first legal；public randomSource0.72、safety1400 |
| Admission實際結果 | 正式PlayingTime score64、planned start；canonical membership、初始lineup與SS assignment一致，實際先發，不是手寫旗標 |
| 擊球邊界 | 實際SS已入場、對手進攻時的第一個正式ordinary fair contact；本輪自然到達4局上0出局、空壘、0：1，對手打者player-07 |

較高能力讓Opportunity從前輪score44／第六局替補變成score64／先發；正式flow因而在不同時間進入Detailed defense。**沒有強迫沿用前輪第七局／打者identity。** 前輪adapter的7上0出局空壘guard，在本輪事前改為檢查合法live outs，保留實際SS／對手進攻／active defense／state integrity驗證；這項測試guard差異與owner衍生局勢都已列於Plan。不能宣稱兩輪program除了能力資料外所有bytes相同。

[Physical adapter](ss-reachable-controlled-scenario-v0.1-adapter.cjs) 仍只在原Physical producer的input.rolls邊界固定一次擊球，原this／其餘input及輸出保留。Readonly [observer](ss-reachable-controlled-scenario-v0.1-observer.cjs) 記錄原owner呼叫與結果，每個wrapper只委派一次，不注入Reach／Secure／Throw／Settlement結果，不額外呼叫RNG。隔離loader只作明列memory replacement，正式helper與Production bytes不改。

## 3. Physical／Opportunity／Reach／Secure

本球完整Physical identity：

```text
hs-y1-autumn-exhibition|4|上|away|regional-power-school-player-07|8|0|falsefalsefalse|ordinary-contact|pitch-1
```

| 原owner真實輸出 | 本輪 |
|---|---|
| Physical | solid／groundBall／firm／leftSide／depth=null |
| Responsibility | supported／bound；primary SS＝player，從實際active roster綁定 |
| Reach inputs | reaction9／range9／mobility2；沒有reachRoll override |
| Demand | reach4.095／reaction4.5／movement3.6，coarseRelativeDemand |
| Reach variation | roll0.1793272567447275、adjustment0.641，原identity deterministic variation |
| Reach margin／quality | **4.759／cleanArrival／reached=true** |
| Access | supported=true、favored、canonicalReachArrival |
| Ground handoff | supported=true；正式PA先形成groundBallDefensePending，沒有ordinary unsupported fallback |
| Secure inputs | 原轉換fielding10／catching10、arrival cleanArrival、pressure4.5、arrivalPenalty0 |
| Secure | **margin4.572、secured=true、cleanControl**；sample／roll0.9638916750250752、adjustment-0.928 |

數值均取自同球原owner input／output，沒有另行重算或補造。Public玩家選擇的sample0.72不等於routine執行sample；本球沒有manual選擇，`resolveRoutineDefensivePlay`使用原Match simulation RNG產生0.9638916750250752，未以0.72覆蓋它。

Current pipeline實際先分類、再自動執行routine中的canonical Secure。沒有為配合概念鏈順序而在分類前另外呼叫Secure。原流程包含3次SS execution／validation計算，同identity、同sample的Secure／Throw／Timing結果相同；**只有一筆committed routine play，不是3個play或3次新增RNG抽樣**。[原始owner trace與counts](ss-reachable-controlled-scenario-v0.1-candidate-first-facts-evidence.json)、[精確source與驗證入口](ss-reachable-controlled-scenario-v0.1-source-evidence.json)

## 4. Meaningful／Density與玩家Choice的停點

| 正式gate欄位 | 原輸出 |
|---|---|
| legalChoiceCount | 2 |
| 合法routes | secureFirstBaseOut（secure）／holdBall（contain），原owner生成，沒有新增按鈕 |
| meaningfulChoiceCount | **1** |
| objectives／commitments | secureOut；throwFirst／6-3／first／player>1B／low |
| decisionTension／shouldCreateDecision | **low／false** |
| 分類 | **playerRoutinePlay** |
| density | meaningfulCandidate=false、allowed=false、suppressionReason=not-meaningful |

這不是「有meaningful但配額已滿」：兩個legal routes沒有被原gate認定為兩個有策略取捨的meaningful選擇。沒有增加density、調能力、變壘況或把holdBall硬算成第二項meaningful。

因此本球**沒有可見玩家守備Moment、沒有public defensive resolve／duplicate submission**。前段唯一玩家進攻決策不能替代此gate。Diagnostic對無守備choice明列`NOT REACHED`，沒有讓空迴圈assertion列成守備PASS。正式routine owner自動選secureFirstBaseOut；它不是玩家按下first-legal選項。[完整classification／density](ss-reachable-controlled-scenario-v0.1-findings-evidence.json)

兩次均在routine已由原流程完成的同一tick44保存facts並停止；不再推進下一球或整場，也不取得第二個候選。

## 5. 自動routine的Throw／Runner／Settlement

| 實際正式執行 | 結果與界線 |
|---|---|
| Throw | secureFirstBaseOut、throwAttempted=true、onTarget、readyRelease；accuracyMargin4.559325756505132 |
| Receiver | 真實NPC 1B：school-development-29d536a2-player-03；ready、atBase |
| Runner timing | runner arrival7.3、ball arrival／receiver completion5；margin2.3、defenseClearlyAhead |
| Rule／settlement | playType=batterRunner；batterRunnerBeforeFirst；outRecorded=true，一個out，沒有雙殺、得分或error |
| Match state | 4上0out／空壘／0：1 → **4上1out／空壘／0：1** |
| Applied／lifecycle | playSettlement.settlementApplied=true，lastClosedSituationSummary=closed |
| 品質 | decisionQuality=reasonable、executionQuality=complete，分欄保存；這是automatic routine的歸因 |

有界 **routine Physical→Reach→Secure→Throw→Runner→Settlement** 已有同球執行證據；但不能將automatic decision identity冒稱玩家決策。沒有人工指定6-3／出局／教練正評。本輪未重送任意低階apply來補exactly-once測試；只確認單筆committed事件／settlement及同條件重現，manual defensive duplicate仍NOT REACHED。

## 6. Partial Record／Save／Career／Replay與原能力比較

停止時Record為 **active**、integrity有效，47筆unique eventRefs對應47筆log，含一筆真實playerRoutinePlay；沒有Final Result。本場玩家actual exposure為started=true、entry1／exit4、PA1、defensiveInnings3，屬當時partial觀測，不代表3次meaningful守備。

Defense meaningful created0＝completed0，routine event1。Evaluation仍null、match history0、matchExperience未settled；**Full Career／Coach終局評價及Experience settlement未驗證**。不能以例行出局或部分統計推定正面career效果。

normalizeSave memory round-trip保留partial Record、log、rosters、completedMoments、exposure、ground state及closed situation，並未重新執行本球。這是partial Save證據，不是真實browser reload。Routine event的before／after保存本球0→1out；已有進攻Moment仍是Resolution Snapshot，沒有SS decision-before snapshot，也沒有Final Summary可比。

兩次trace及全部available state／hashes完全一致；**是partial replay，不是完整比賽replay**：

| 首次／replay共同SHA-256 | 值 |
|---|---|
| Partial Record | `c627fc1458fb876232c24f0cf1e3c2e63094103215a70694a0be584c1291a86c` |
| Partial Log | `5f7ac6e16424989d3e201ffbab51a4146ccc60d7c8e6abed77b3b7936e064e6d` |
| Decision sequence | `c90c8d4a93af0d7115b3e6ed9f6a5b34b5f7ef55cde3a79fea584195547afc71` |

| 與前輪原能力案例比較 | 前輪 | 本輪 |
|---|---|---|
| reaction／range／mobility | 3／3／2 | 9／9／2 |
| Opportunity／上場 | score44、第六局替補 | score64、owner決定先發 |
| 控制球發生點 | 7上、player-04 | 4上、player-07 |
| Demand | 4.095 | 4.095 |
| variation adjustment | 0.882 | 0.641 |
| Reach margin | -0.325、notReached | **4.759、cleanArrival** |
| 後續 | ordinary single fallback | detailed routine，Secure／Throw／一個出局 |

五個能力輸入變更也改變正式readiness／admission及PA identity，deterministic variation隨identity改變。**不能把margin差異宣稱為同一PA identity下純能力算術對照**；沒有反向改identity、凍結Opportunity或恢復舊state來製造parity。

## 7. 執行證據與有限回歸採信

| 本輪Entry-Safe diagnostic | 實際結果 | elapsed | 成功Node assertion calls | Evidence |
|---|---|---:|---:|---|
| first | **PASS，9個具名checks；依routine gate停止** | 932.4164ms | 816 | [raw](test-infrastructure-sprint-0.1-ss-reachable-controlled-scenario-v0.1-candidate-first-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-reachable-controlled-scenario-v0.1-candidate-first-evidence-assertions.json) |
| 同條件replay | **PASS，10個具名checks；相同停點** | 861.0965ms | 825 | [raw](test-infrastructure-sprint-0.1-ss-reachable-controlled-scenario-v0.1-candidate-replay-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-reachable-controlled-scenario-v0.1-candidate-replay-evidence-assertions.json) |

2個children、19個具名diagnostic checks、1641個成功Node assertion calls；0場完賽、0個新正式Suite invocation。兩次exit0／stderr空，entryVerified／sourceStable=true；Node v24.19.0。Raw明列NOT REACHED／NOT EXECUTED的守備choice及Final／Career檢查，不回填成PASS。

Raw保留actual command、source hashes、完整stdout／stderr、exit／policy及assertion witness；完整large facts另exclusive-create。原Entry-Safe preload與正式runner不改，docs profile僅延用已審查的cached-diff→porcelain index metadata替換。Timeout120000ms、stdout buffer16000000 bytes、implicit Git show30000000 bytes未增限。[Verification](ss-reachable-controlled-scenario-v0.1-verification-evidence.json)

Canonical50/50、SS Integration26/26、Ground Lifecycle26/26、Game Record13/13均採既有正式capture，其全部非docs dependency hashes逐項匹配current，**本輪未重跑**。這些既有明示fixtures不能補本Scenario未形成的manual choice或Final Career。[Freshness／完整matrix](ss-reachable-controlled-scenario-v0.1-findings-evidence.json)

## 8. 驗收矩陣、WIP與停止

| Gate | 判定 |
|---|---|
| Legal Fixture／SS admission | **CONFIRMED本能力fixture**，包含owner產生的SS先發；不替代原能力先發缺證 |
| Physical／Opportunity／Player binding | **CONFIRMED** |
| Reach／Access | **CONFIRMED** |
| Secure／Ground Handoff | **CONFIRMED** |
| Routine／Meaningful Classification | **CONFIRMED routine／NOT ADMITTED meaningful** |
| Player Defensive Choice | **NOT REACHED** |
| Throw／Runner／Settlement | **CONFIRMED automatic routine／NOT REACHED玩家選擇鏈** |
| Record／Career／Replay | **PARTIAL**；沒有Final Record、完整Career或整場replay |
| Controlled SS Defensive Vertical Proof | **UNVERIFIED**，手動meaningful gate未成立 |
| Match UI Slice資料契約前置條件 | **NO** |
| Phase B2／UI施工／Sprint10B | **NOT STARTED／NOT STARTED／NO** |
| Ready for Commit／Receiver v2 | **NO／DISABLED** |

開工與結案branch=main，HEAD／main／origin/main tracking ref均為指定基線、index空。核對前輪1724個hash、35個delivery entries及delivery自身，建立 **1760個既有可讀檔案SHA-256**；結案全相同，全部WIP、Snapshot四檔修復與captures保留。[Baseline](ss-reachable-controlled-scenario-v0.1-baseline-evidence.json)、[Closeout](ss-reachable-controlled-scenario-v0.1-closeout-evidence.json)、[Delivery](ss-reachable-controlled-scenario-v0.1-delivery-evidence.json)

12個protected paths只核對status／size／mtime，沒有read／hash／執行／修改；metadata不是內容hash證明。Source reads限明列範圍與遞迴入口，VM modules由current index明列；未知依賴不臨時放行。新capture拒絕existing target、exclusive-create；沒有glob全文搜尋、git grep或git diff，沒有Reset／Clean／Stash／Stage／Commit／Push、fetch或遠端server重新查證。

前置adapter複製工具曾因Unicode literal查找失敗而未建立檔案，隨後語法檢查回報檔案不存在；改成ASCII行定位後，才固定Plan。這是gameplay前的工具修正，沒有試跑後換能力／rolls或重新選情境。採codebase-memory Tier2作必要owner查證，graph舊座標以current direct source／hash補證，不做新全面稽核。[Source](ss-reachable-controlled-scenario-v0.1-source-evidence.json)、[Coverage](ss-reachable-controlled-scenario-v0.1-coverage-evidence.json)

**唯一最小下一步建議：** 人工裁決並另案定義一個可由正式owner建立、確實有兩種策略取捨的壘況契約，沿用固定能力與原公式；不要修分類／density以讓本routine假裝meaningful。本輪不建立該下一個情境、不調參重試。原#36／Gradient歷史FAIL與S3未驗證狀態保留。

未執行Full255／Full251／R6Full227／First-base timing／Receiver Integration／Browser全套。完成本輪後立即停止，等待人工審查。
