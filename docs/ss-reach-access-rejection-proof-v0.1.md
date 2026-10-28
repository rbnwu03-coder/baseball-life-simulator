# 《棒球人生》SS Reach Access Rejection Proof v0.1

任務：同一受控擊球的守備到位判定追蹤  
日期：2026-10-15（Asia/Taipei）  
Git參考基線：`ab3117653945de0b7013636187c446276a96e634`

**正式判定：A — Legitimate Reach Rejection。** 同球runtime中，正式Reach owner回傳`margin=-0.325`、`reached=false`、`reachQuality=notReached`；Access回傳`canonicalReachUnavailable`，Ground access原樣承接拒絕，詳細handoff因PA未取得`groundBallDefensePending`而採ordinary fallback。正式普通結果為single。**不是Reach已到位而Handoff誤拒絕；不修守備公式或Production。**

同一Scenario首次及一次必要replay均完成；Reach／Access／Handoff witness逐物件一致，完整Match結果也與前輪相同。沒有第二個情境、換seed／能力／rolls或另行重算owner。**Ready for Commit／Sprint10B＝NO；Receiver v2＝DISABLED。完成即停止。**

## 1. 固定輸入與執行前白名單

沿用`ss-controlled-ground-v0.1`，原Player／能力、學校、invitation index0、正式SS與已入學step5 checkpoint不變。正式normalizeSave還原，Current Event=`high_school_showcase`，呼叫無自訂identity的`prepareCurrentHighSchoolYearOneMatch()`；Match仍為`hs-y1-autumn-exhibition`。

Seed維持 **2884315748**，由原pending test hook交正式seed owner消費。五項Physical rolls仍為contactQuality0.65／ballType0.1／pace0.68／direction0.05／depth0；整段Physical adapter program hash與前輪相同。政策維持secure／zone／first legal、randomSource0.72、safety1400。正式PlayingTime與roster／替補owner仍決定第六局SS替補；本球仍在**七局上0出局、空壘、home1／away4**，不直接寫Match局勢。

首次gameplay前保存 [Plan](ss-reach-access-rejection-proof-v0.1-plan-evidence.json)、[Fixture input](ss-reach-access-rejection-proof-v0.1-fixture-input-evidence.json) 與 [Recursive read whitelist](ss-reach-access-rejection-proof-v0.1-recursive-read-whitelist-evidence.json)。白名單明列10個Node入口／helper檔案、92個current-index browser-global modules、Node builtins、bootstrap JSON與fixture／前輪facts等資料輸入；本輪沒有載入前輪回歸的career test context。

遞迴檢查涵蓋本輪proof→capture／adapter→observer、Canonical VM helper及Entry-Safe入口。VM不提供module／require，Production UMD的CommonJS fallback未啟用；不是在執行中臨時擴增未知dependency。原完整WIP hash-only範圍另列，protected paths排除內容。後續reporting檔另列明確清單，不使用glob全文搜尋、git grep或git diff。

## 2. 唯讀觀測與精確owner

[observer.cjs](ss-reach-access-rejection-proof-v0.1-observer.cjs) 只在隔離VM安裝pass-through wrappers。API已freeze且consumer會捕捉reference，因此在對應module載入後、consumer載入前安裝；script globals則在script載入後安裝。正式檔案與原函式body均未修改。保留相同this／arguments，以`Reflect.apply(original,this,args)`**恰好呼叫原函式一次**，回傳同一result，原exception原樣拋出。

| 觀測owner | 用途／本球實際原呼叫數 |
|---|---|
| `DefensiveOpportunityFoundation.resolveDefensiveOpportunity` | 4次既有binding／freshness核對；輸出全為相同正式SS／player Opportunity |
| `script.getHighSchoolPhysicalDefensePlayerContext` | 1次，保存正式defender context與其Reach access |
| `script.getHighSchoolReachAccess` | 1次，保存傳給Reach owner前後的上下文 |
| `DefensiveReachSecureFoundation.resolveReach` | **1次**，真實輸入與完整resolution |
| `DefensiveReachSecureFoundation.projectAccess` | **1次**，真實Reach輸入與Access projection |
| `BattedBallGroundDefense.resolveGroundBallDefensiveAccess` | **1次**，確認拒絕由Reach access承接 |
| `OffensivePlateApproach.simulatePlateAppearance` | 本球1次；整場另外1次是既有玩家進攻PA，未當成本球 |
| `script.ensureHighSchoolOrdinaryGroundBallInPlayHandoff` | **1次**，保存unsupported handoff及ordinary result |

另觀測的public `resolveSecure`與`buildGroundBallDefensiveOpportunity`在本球沒有呼叫；沒有為取證直接呼叫它們。輸入與輸出只讀複製，不寫owner資料、不獨立re-evaluate、不新增RNG呼叫。undefined明確編碼為`__witnessType:undefined`，函式參數只記reference名稱，不將其當資料或執行它。

本球保留14筆完成的boundary witness；enter／exit ordinal保存巢狀順序。所有被觀測boundary的wrapperInvocations＝originalInvocations，原呼叫無exception。這些計數、exact wrapper source及前輪結果parity是本案的有界證據；前輪沒有owner call counters，不能宣稱已對所有未觀測內部函式完成普遍call-count neutrality證明。[Source](ss-reach-access-rejection-proof-v0.1-source-evidence.json)、[Findings](ss-reach-access-rejection-proof-v0.1-findings-evidence.json)

## 3. 同球identity、primary binding與Reach真實輸入

完整Physical identity：

```text
hs-y1-autumn-exhibition|7|上|away|regional-power-school-player-04|0|0|falsefalsefalse|ordinary-contact|pitch-1
```

PA identity為上列移除最後`|pitch-1`；Opportunity identity為Physical identity加`|defensive-opportunity-v1|regulation-coarse-zones-v1`；Reach identity再加`|player|reach-v1`。完整字串、原activeRoster與全部輸入均存 [首次facts](ss-reach-access-rejection-proof-v0.1-candidate-first-facts-evidence.json) 的`reachProbe.calls`，replay同樣保存。

Physical truth仍為solid／groundBall／firm／leftSide／depth=null。原Opportunity輸入supported=true、bindingStatus=bound、primaryPosition=SS、primaryDefenderId=player；secondary是實際NPC 3B。Reach內既有binding重新核對的輸出與傳入Opportunity完全相同，actual active roster的玩家仍為SS。不是位置不合法、primary換成NPC或stale identity造成的拒絕。

| Reach原輸入 | 實際值 |
|---|---|
| capabilities.defenderId | player |
| reaction／range／mobility | **3／3／2** |
| fielding／catching | **4／4**；本次Reach不因此額外執行Secure |
| explicit roll | **undefined**；原owner自行按既有identity取deterministic variation |
| Physical／Opportunity／activeRoster | 同球真實資料，raw完整保存，沒有能力或defender override |

## 4. Reach／Access拒絕的直接runtime證據

| 原owner回傳欄位 | 實際值 |
|---|---|
| Reach.supported | true：此owner支援並接受合法binding，**不等於已到位** |
| reachDemand／reactionDemand／movementDemand | **4.095／4.5／3.6**，units=`coarseRelativeDemand` |
| ambiguity／reactionWeight | **0.6／0.55** |
| Reach.inputs | reaction3／range3／mobility2 |
| variationEvidence.namespace | defensive-reach-v1 |
| variationEvidence.roll／adjustment | **0.059226802783086896／0.882** |
| variationEvidence.consumed | true，原Reach owner本次既有variation；不是observer額外消耗 |
| **margin／reached／reachQuality** | **-0.325／false／notReached** |
| Access.supported／level／score | **false／unsupported／0** |
| Access.reason | **canonicalReachUnavailable** |

上述margin、demand、variation均為原owner實際回傳，沒有自行合成或重新跑公式。Current source的成功條件為`margin>=0`；Access條件是`reach.supported===true && reach.reached===true`。本球第一項成立、第二項不成立。runtime projection的輸入完整deep equal該次Reach輸出，並把同份reachResolution放入結果。

接著`getHighSchoolPhysicalDefensePlayerContext`將這份Access交給Ground owner；Ground輸入中`defenderContext.reachAccess.reachResolution`與原Reach resolution deep equal，Ground輸出保留相同margin／identity／reason。其回傳不是`leftSideNoPlayerBallMagnet`或`unsupportedScope`，而是**正式Reach projection的拒絕**。因此這次可以用runtime證據排除前輪僅靠source推論的歧義。

**NOT EXPOSED欄位：** Reach resolution沒有獨立名為`reason`的字串欄位；handoff也沒有獨立`reason`欄位。本報告不新增failureReason。Reach的`notReached`／negative margin、Access的真實reason，以及handoff的sourceAuthority與輸入／輸出，已足以區分本案A／B／C。[12份current function regions](ss-reach-access-rejection-proof-v0.1-source-evidence.json)、[Focused graph／traces](ss-reach-access-rejection-proof-v0.1-focused-graph-evidence.json)

## 5. Handoff與ordinary fallback收到的結果

同一個handoff呼叫的runtime順序為：Reach enter11／exit14 → Access15／16 → Ground access19／20 → PA simulate回傳exit25 → handoff回傳exit30。沒有在中間插入另一個PA或重新算Reach。

| 邊界 | 真實輸入／輸出與責任 |
|---|---|
| Ground access | supported=false、reason=canonicalReachUnavailable，仍攜帶同球Reach resolution |
| Ordinary PA | completed=true、awaitingDefense=false、**result=single**；沒有`groundBallDefensePending` |
| Official outcome | authority=physicalOutcomeMappingV1、resolutionMode=compressedOfficialClassification、defenseConsumed=false、physicalIdentity相同 |
| Detailed handoff | **supported=false**、sourceAuthority=unsupportedOrdinaryContactLegacyFallback、legacyFallbackResult=single |
| Match apply | seq95為ordinaryPlay／plateAppearance，outcomeAuthority=existingOrdinaryPhysicalOutcome，result=single；對應唯一Game Record event ref |

原因鏈已取得同identity的實測：**Reach未到位 → Access不准詳細處理 → 原PA未回ground pending而回official single → handoff走unsupported分支 → Match沿同一single推進**。Official outcome內`trace.fallbackUsed=false`描述的是outcome mapping自己的分類；不否定Match層級使用unsupported detailed-handoff的ordinary fallback，兩個欄位屬於不同邊界。

本球outs維持0、打者進一壘、比分1：4。沒有Secure、玩家守備Moment或Throw／Runner Timing結果，不能把single稱為玩家傳球Safe、守備失誤或routine守備完成。這些後續gate仍未驗證。

## 6. Replay、執行證據與前輪parity

| 本輪Entry-Safe standalone diagnostic | 結果 | elapsed | 成功Node assertion calls | Evidence |
|---|---|---:|---:|---|
| first | **PASS，14個具名checks** | 495.4923ms | 1658 | [raw](test-infrastructure-sprint-0.1-ss-reach-access-rejection-proof-v0.1-candidate-first-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-reach-access-rejection-proof-v0.1-candidate-first-evidence-assertions.json) |
| same-condition replay | **PASS，15個具名checks** | 521.5152ms | 1668 | [raw](test-infrastructure-sprint-0.1-ss-reach-access-rejection-proof-v0.1-candidate-replay-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-reach-access-rejection-proof-v0.1-candidate-replay-evidence-assertions.json) |

共2個children、29個具名diagnostic checks、3326個成功Node assertion calls，**不是正式Suite結果**。兩次exit0／stderr空，entryVerified／sourceStable=true，Node v24.19.0。沒有第三次gameplay或新正式Suite invocation。

14筆同球trace、所有observer counters及adapter witness在first／replay完全相同。完整initial Match、Record、Log、decision sequence及final player hashes各自相同，並與**前輪沒有Reach observer的受控capture**逐一相同：Record `98f6361d…06ca`、Log `9e89d322…fdcf`、final player `069139ba…1b89`。兩次仍115ticks、7局終、home1／away4、121 events／unique refs、守備Moment0；沒有為取得觀測改變比賽答案。[完整hashes／replay核對](ss-reach-access-rejection-proof-v0.1-findings-evidence.json)

Raw保存actual command、env、source before／after hashes、完整stdout／stderr、exit／limits／assertion witness；大型facts以新路徑exclusive-create。原Entry-Safe preload不改；docs runner profile延用既有cached-diff→porcelain index metadata替換，正式runner bytes不改。Timeout120000ms／stdout buffer16000000 bytes／implicit Git show30000000 bytes未增限。[Entry profile](ss-reach-access-rejection-proof-v0.1-entry-profile-evidence.json)、[Verification](ss-reach-access-rejection-proof-v0.1-verification-evidence.json)

## 7. A／B／C正式判定與後續界線

| 分類 | 本球判定 |
|---|---|
| **A — Legitimate Reach Rejection** | **CONFIRMED**：正式binding合法，真實Reach未到位，Access與Handoff一致拒絕，single沿原owner完成 |
| B — Handoff Contract Gap | **本球不成立**；沒有Reach／Access已滿足卻下游拒絕的證據，不提出Production fix |
| C — Insufficient Evidence | **本球不適用**；足以區分拒絕原因，獨立reason字串未暴露不妨礙現有證據鏈 |
| 同球成功SS守備／meaningful／Throw | **UNVERIFIED**，不因本輪診斷PASS升格 |
| 完整Controlled SS Integration／Natural Proof／UI Slice | 仍未取得前輪缺少的成功決策／執行證據；UI資料契約前置條件仍NO |

依A的處置：**接受這顆球未形成玩家決策，不修守備公式、Handoff或能力。** 後續若要可處理的守備Scenario，必須另案事前固定合法輸入與接受條件；本輪不設計第二個球、不挑seed或更容易的rolls，不開始Phase B2／Match UI／Sprint10B。

本輪診斷raw summary沿用的gateA／gateB是Current identity／public入口標籤，不是本任務A／B分類；以本節及machine Findings的`verdict:A`為正式判定。原#36／Gradient歷史FAIL、S3與自然非零SS守備未驗證狀態不變，沒有修改其tests或回填PASS。

## 8. Git／WIP／protected integrity與停止

開工及結案branch=main，HEAD／main／origin/main tracking ref均為指定基線，index空。核對前輪1685個hash、38個delivery entries及delivery自身，建立 **1724個既有可讀檔案SHA-256** 清單，結案全相同；全部WIP、Snapshot四檔修復與既有captures保留。Production、既有tests／fixtures／seeds／pins、runner／registry delta＝0。[Baseline](ss-reach-access-rejection-proof-v0.1-baseline-evidence.json)、[Closeout](ss-reach-access-rejection-proof-v0.1-closeout-evidence.json)、[Delivery](ss-reach-access-rejection-proof-v0.1-delivery-evidence.json)

12個protected paths維持status／size／mtime核對，沒有read／hash／執行／修改；metadata一致不是content hash證明。本輪沒有前輪nested regression context的白名單例外，因為不執行那些套件。新capture均拒絕existing target並exclusive-create；未fetch或重查遠端server，沒有Reset／Clean／Stash／Stage／Commit／Push。

依codebase-memory Tier2作必要邊界查證，舊graph座標由current exact source／hash補證；focused coverage包含實際runtime、遞迴入口／helper與引用evidence，不重做廣泛架構稽核。Metadata／not_tracked不是freshness或完整性證明。[Coverage](ss-reach-access-rejection-proof-v0.1-coverage-evidence.json)

未執行Full255／Full251／R6Full227／First-base timing／Receiver Integration／Browser全套。**A判定及本輪交付完成後停止；Ready for Commit＝NO；Sprint10B＝NO；Receiver v2＝DISABLED。**
