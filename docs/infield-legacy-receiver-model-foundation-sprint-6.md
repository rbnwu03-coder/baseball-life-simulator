# Legacy Receiver Model Foundation — Sprint 6

專案：Baseball Life Simulation（棒球人生）

施工日期：2026-10-12（Asia/Taipei）

**Receiver model gate 為 PARTIAL，採策略 C。** 既有 SS／2B／relay 沒有足以獨立證明 readiness 與 hands 的執行來源；所有可推導診斷已由 Sprint 5 接通，本輪不偽造 stage、不啟用新接球權威。完成來源矩陣與版本遷移提案，並修復 Phase G 發現的 SS lifecycle execution 副本驗證缺口。此修復只有 `script.js` 七行 guard，不改守備執行或 scorer 規則。

新增 safety／compatibility focused **52/52**；原 Sprint 5 **79/79＋33/33**、代表 **13/13** 均通過。獨立 receiver source gate 的 **8 項 Red 仍未解決**，不能以 safety green 宣告 L03 完成。34 個同球 fixture 前後 execution／scorer／GameRecord／Evaluation 相同。原 227 manifest 最終執行一次，**224 PASS／3 項既有 Debt，新增 Production regression=0**。

## A. Git Baseline / WIP

| 檢查 | 本輪起點 |
|---|---|
| 目錄／branch | `E:\meng\baseball_life_sim_semirefactor`／`main` |
| HEAD／origin/main | `c4121ce1fa0a2a3fac808226cf610706976fcc24`，相同 |
| Staging area | 空 |
| 初始 tracked WIP | 僅 `tests/fast-check-smoke-test.cjs` |
| 初始 untracked | 11 個既有受保護檔案；詳細 paths 見 baseline evidence |
| 可讀 tracked snapshot | 575 個 JS／CJS／JSON／Markdown／index.html hashes，排除 protected smoke |
| 本輪 Git mutation | 無 Stage／Commit／Push／Reset／Clean／Stash |

[Baseline evidence](infield-legacy-receiver-model-sprint-6-baseline-evidence.json) 保存原 Git metadata 與可讀來源 hashes。以下 protected contents 均沒有讀取、執行、修改或 hash：protected smoke、`install.ps1`、Sprint 3 untracked evidence、Sprint 4 四個原始交付，以及五個未提交 Sprint 5 中間 evidence。只比較其檔案 size／mtime 與 Git status；**不宣稱內容 hash 證明**。本輪讀取的是已提交 Sprint 5 正式報告／來源矩陣／final evidence。

原三項 Baseline Debt 的測試、原 Sprint 5 112 項 assertions、fixtures 與 seeds 都保持原檔案。最後安全檢查與本輪產物 hashes 見 [final evidence](infield-legacy-receiver-model-sprint-6-final-evidence.json)。

## B. Execution Authority Map

Discovery 採已安裝 codebase-memory Tier 2：schema／symbol search → caller／callee depth=1 trace → snippet → 當前 source。registry／family dispatch 在 `script.js`，`resolveHighSchoolDefensivePlay` 透過 family property 呼叫 `resolveInfieldDecision`；缺少直接 CALLS edge 不代表不可達。

| Owner | 現行權威與邊界 |
|---|---|
| `buildHighSchoolShortstopExecution` | SS acquisition／第一傳 canonical；下游 receiver 是舊 fielding＋owned sample proxy |
| `resolveSecondBaseInitiatedRoute` | 2B control／transfer／throw／window authority；`legacyUsableDelivery` 不代表精確來球位置 |
| `resolveHighSchoolInfieldReceiver` | availability flag、fielding＋同一 sample 的 combined ready；secured 與 delivery／ready 合取 |
| `resolveInfieldRelayToFirst` | SS／2B relay 的 receive／turn／firstBaseReceive thresholds；不是分離的 arrival／Secure authority |
| `resolveSecondBaseCoverage643` | 已存在的 player 2B cover/pivot slice；有 coverage／upstream quality，但不是新的 ordinary primary physical admission |
| `resolveIncomingReceive`／1B builder | 已有 player 1B incoming 的獨立 readiness／hands；依原 throw quality、能力與 sample 判定 |
| RunnerThrowSettlement／ForceAdvancement／Third-Out | 真實 base contest、ordered retirement、legal scoring；本輪不改 |
| Sprint 5 scorer／MatchGameRecord | E eligibility、would-be A、actual PO／DP、PA classification、同球唯一記錄 owner；本輪不改 |
| Lifecycle／Save validation | 原 cache 重建、route-copy guard、exactly-once recovery；本輪只補 SS execution evidence 副本一致性 |

**3B 的 acquisition／first throw 是 canonical，但其 NPC receiver 仍是 proxy。** `receiverCompletion.atBase=true` 不證明獨立到位；沒有 readinessMargin。3B 的既有有界 ordinary-muff scorer 正例予以保留，不能因此把它當成完整獨立 receiver 模型。

[Architecture evidence](infield-legacy-receiver-model-sprint-6-architecture-evidence.json) 保留查詢、trace、snippet、continuation read 與 source fallback。最後 [coverage](infield-legacy-receiver-model-sprint-6-architecture-final-coverage.json) 的 21 個路徑完整回傳、無未取完分頁；均 no_recorded_issue，但 freshness 為 metadata_changed，scope query 亦沒有匹配 coverage rows。這些不是 source 新鮮度或功能完整性的證明。關鍵 owner／formula／negative boundary 均讀當前 source，七行 final diff 另有 normalized-source 比對。

## C. Existing Source Facts

A＝Existing authoritative execution fact；B＝Deterministic derivation；C＝Unavailable。A 的 combined outcome 不等於獨立 stage。完整十個 route groups、十項欄位、owner／sample／cache／source lines 見 [source matrix](infield-legacy-receiver-model-sprint-6-source-matrix.json)。

| Route／actor | 原 sample／delivery | Availability／readiness／Secure | Runner timing／scorer／save |
|---|---|---|---|
| 6-3，SS→1B | A cached public execution sample；A canonical first throw quality | A legal receiver actor；A fielding＋swing combined ready；獨立 readiness／hands=C。舊 `receivingAvailable` flag 不參與 SS 判定 | A first-leg runner arrival；B saved release／distance／delay 比較；receiver ordinary effort=C。SS cache＋decision-throw version 沿用 |
| 4-3，2B→1B | A original resolver sample；A usable／offline delivery；獨立 location=C | A actor／`receivingAvailable`；A threshold combined ready／secured；獨立 stage=C | A `{value,state}` firstLegTimingWindow；B ordinal feasibility；continuous clean arrival=C。2B decisionThrow cache 沿用 |
| 6-4-3，SS→2B→1B | A first throw；A relay receive／turn／firstBaseReceive statuses | A stage thresholds；獨立 final arrival／hands／accuracy=C | A 第一 force 與 continuation window；保留 actual A／PO／FC。SS cache 不升版 |
| 4-6-3，2B→SS→1B | A first delivery、SS secondThrow threshold | A relay statuses；獨立 final readiness／hands=C | A 第一 force／window；第二段 exact arrival=C。2B cache 不升版 |
| SS forceSecond／homeForceOut | A canonical first throw、原 sample；合法 2B／C receiver | A combined receiver proxy；獨立 stage=C | A runner arrival＋B saved timing；force retirement／scorer owner 不變 |
| 2B attackLeadRunnerThird／homeForceOut | A composite delivery／原 sample；合法 3B／C receiver | A available／combined ready；location／獨立 stage=C | A target window、B ordinal feasibility；force record 不變 |
| Player 2B coverSecondFor643 | A original owned sample、coverage／upstream quality；B receive penalty diagnostic | A declared legacy execution；獨立 readiness／Secure=C | A force／route window；continuous timing=C。驗證 fixture 的 physicalIdentity=null，不能宣稱正常 physical admission |
| 2B preventRunHome | A composite throw／receive／tag；B sample＋能力 diagnostic | 分離接傳來源=C | A homeTagLeg；failed receive 的 clean tag timing=C。僅 source review，不新增 home-tag witness |
| 3B NPC receive reference | A canonical first throw／原 sample | A fielding proxy；atBase 是既有常數；獨立 readiness／hands=C | A arrival comparison、既有 bounded E／A proof；不是新 receiver authority |
| Player 1B incoming reference | A original upstream throw／receiver actor／sample | A 獨立 readinessMargin／secureMargin | B 原 ball／runner arrival 比較；沿用 L01／L02 與原 incoming version |

所有 legacy route 的 misplay-specific extra advancement 都為 C。初始／最終壘位差、失敗字串或 safe/out 不可當作 error-caused advancement。NPC `defense` 同時映射 fielding／reaction／range，不能宣稱具獨立 career skill 證據。

## D. Proposed Receiver Contract

[Versioned contract／migration proposal](infield-legacy-receiver-model-sprint-6-contract-migration-proposal.json) 提出 `legacy-receiver-stage-v1`，**僅提案，runtimeEnabled=false**。

最小 contract 保存同球 play／physical identity、source throw action identity、active receiver actor／position、target runner／base、execution authority version、original sample namespace、能力 snapshot、delivery availability／incoming quality、positioning／readiness、receive attempt、Secure、ordinary-effort source、arrival units／provenance、actual outcome、既有 scorer provenance，以及可歸責 advancement。

未知事實使用 `value=null`、具體 source 缺口與 `insufficientScorerFacts`；不填精確座標或時間。receive attempt 必須依 completed delivery＋可信 readiness，Secure 是獨立 pre-outcome decision；不能由 receiverCompletion 布林值改名、safe/out 倒推或額外抽樣取得。ordinal window 保留原 units，沒有轉成 continuous arrival。

本輪未建立 new-version pending／executed／settled fixtures，因為不存在已啟用的新權威；因此不宣稱新版本 save compatibility PASS。

## E. SS Integration

保留 SS first throw、receiver proxy、能力、sample 與實際 out。測得 clean receive、offline、combined failure、already-safe、第一 force failure、partial DP、其他 force targets，meaningful／routine 共用既有 scorer owner。

SS legacy receiver 的 `fielding+swing >= 3.2` 同時承擔 combined ready；`atBase=true` 是建構時常數。將 NPC `receivingAvailable=false` 送入合法 fixture，SS 仍完成相同 receive/out，證明該 flag 不是此 owner 的 availability authority。這是明示模型限制，不把常數 atBase 當獨立 location 或 arrival。

同球遷移反例：sample `.5`、SS throwing `4`、NPC 1B defense `4`，first throw 是 `challengingReceive`；legacy 完成接球、actual out=1。以相同保存的 throw／receiver capabilities／sample 單獨呼叫現有 incoming resolver，得到 ready=true、secureMargin=`-.2`、secured=false。**候選僅 isolated，不 apply、不作 runner settlement 或 scorer**；不宣稱候選比賽必然 out=0。它已足以排除「直接替換只是 metadata」的說法。

獨立「接球者晚到」「已到位但 hands 失敗」「漏接造成額外進壘」仍沒有 SS 真實來源。1B reference 的獨立 stage 正例不使 SS PASS。SS Receiver gate=PARTIAL。

## F. 2B Integration

保留 2B legacy control／throw／receiver／route window authority。`resolveHighSchoolInfieldReceiver` 的 available 是合法 NPC 與 `receivingAvailable` flag；ready 是 available＋fielding／sample threshold；secured 是 deliveryCompleted＋ready。後兩者無法分成可信獨立到位與 hands 判定。

Production fixture 證明 explicit unavailable flag 阻止 receive/out、E／would-be A 不被虛構；正常 4-3、4-6-3、forceThird／home actors、actual retirements 保留。fast runner fixture 名稱不表示已證 continuous clean-reception arrival；2B narrow ordinal window 不等於獨立球與跑者時間。

現有 incoming resolver 明確拒絕 `legacyUsableDelivery`（`invalid incoming throw continuation`）。不將它映成 onTarget，不換成 SS Throw，也不新增 Secure roll。2B readiness／hands／incoming location／continuous timing 須另有權威，gate=PARTIAL。

## G. Relay Integration

6-4-3／4-6-3 逐段保留原 first throw→receive→force touch→pivot→second throw→final receive→second contest。第一 receive/force 失敗時，第二傳為 notAttempted，不改成 wild throw；第二傳完成或末端接穩不保證第二 out。

partial DP 保留第一個 actual force、原 A／PO、batter FC／H=0；沒有第二 PO／DP、沒有重記同 actor A。兩種 relay delivery failure 的 final receive 不嘗試；source matrix 分別標示原 turn／secondThrow 與 final receive thresholds。

第二段缺獨立 incoming accuracy／receiver positioning／hands／continuous arrival，legacy receiver failure 不能單凭 threshold補 E／would-be A。末端 ordinary muff 與 potential out 的完整正例沿用 canonical player 1B／Sprint 5 子範圍，不擴稱 SS／2B relay 已完備。Relay gate=PARTIAL。

## H. Scorer Contract

完整重用 Sprint 5 `resolveScorerEligibility`、would-be assist、actual actor ledger、PA H／FC 與 team-E ownership。本輪 scorer Foundation／MatchGameRecord／MatchExperienceDevelopment source 均不改，也沒有第二個 owner。

SS already-safe 即使 receive completed，仍無 PO／A／E、H=1；offline 原可成立 out 的 thrower E 保留，receiver 不被算 E。legacy combined receiver failure 明示 insufficient，不自動判 E 或 A。partial DP 的第一 out 與 FC 不變。player 1B 已到位、普通努力 muff 阻止 out 的 E／preceding A 正例，以及 not-ready／already-safe 反例，仍通過。

extra-advancement eligibility 只沿用原 79 的 declared pure contract／record owner 測試；本輪沒有自然 Production misplay-specific advancement witness。L03 普通努力來源仍 PARTIAL；L01／L02 regression PASS 是既有有來源子範圍的回歸結果，不能推論所有 legacy scorer 已正確。

## I. Save / Version Compatibility

Phase G 查出既有 **SS lifecycle execution 副本驗證缺口**：cache 可重建且驗證通過，但 `activeSituation.resolution.executionEvidence` 沒有對照原 cache；後續 stored-resolution validation 以 lifecycle copy 比自身。

只改該副本的 receiver actor、receive dependsOn、executionSample 或 receiver capability，exact `c4121ce` 與施工前 source 均接納四種 tamper；recovery 會用矛盾副本。dependsOn=[] 的 actual out=1 不變，player A 卻由 1→0，record integrity 仍為空；forged receiver 可進入 attribution。**沒有非法 out／run／second settlement witness**。這是新發現的既有 validation gap，不移入三項 Baseline Debt。

Red 在 Production 修復前保存：[save red](infield-legacy-receiver-model-sprint-6-save-red-evidence.json)、[actual recovery probe](infield-legacy-receiver-model-sprint-6-save-probe.json)。唯一 Production 改動是 SS validation 分支重建 stored resolution 後，把存在的 lifecycle evidence owned fields 逐項對照 stored resolution；矛盾拒絕。真正省略 additive actionFacts／executionSample 的 pre-contract saves 保持 admission。沒有重跑 receiver 或重新抽 sample。

[Repair evidence](infield-legacy-receiver-model-sprint-6-validation-repair.json) 保存七行 exact addition／before-after hash；去除 addition 後 normalized source 相等。[Final probe](infield-legacy-receiver-model-sprint-6-save-probe-final.json) 的 untampered control 與 exact baseline 完全相同，四種新拒絕及既有 route/cache tamper 都 input/live 不 mutation。

新增 SS／2B × baseline／pre-action-contract 四組 pending→executed→settled cold reload：initial sample=1，恢復禁用 Math.random，out／cursor／record／evaluation 不重記。原 79 的四守位 route-copy／v1-v2-v3 topology／historical omission／duplicate checks 也通過。這是現有 legacy compatibility 的有界 PASS，不是尚未實作新版本的 admission proof；不升級 executed cache、不回填 settled GameRecord。

## J. Modified Files

| 檔案 | 本輪責任 |
|---|---|
| `script.js` | 七行 SS execution-evidence copy validation；其餘 normalized source 不變 |
| [New focused test](../tests/infield-legacy-receiver-model-foundation-test.js) | 真實來源 A/B/C、same-input migration witnesses、E/A/H/FC＋actual state、cold replay、tamper checks |
| [Isolated runner](../tests/infield-legacy-receiver-model-sprint-6-runner.cjs) | 只寫 S6 evidence、immutable capture guard、fixed final manifest／representative suite execution |
| [Save probe](../tests/infield-legacy-receiver-model-save-probe.cjs) | exact c412／current normalize＋recovery 對照；不改原 harness |
| 本報告與 `docs/infield-legacy-receiver-model-sprint-6-*.json` | 來源、提案、red／green、compare、regression、final integrity evidence；皆新增，不覆寫舊 Sprint |

沒有變更守備公式、`.025`／`.99` lanes、roster actor mapping、SS／2B execution functions、投手或打者模型、ForceAdvancement／Runner Settlement／Third-Out、UI／敘事。575 個原可讀 tracked hashes 只允許已宣告的 script validation addition；不讀 protected smoke。三項 Debt 和 Sprint 5 原 tests／JSON／Markdown 不改。

## K. Red / Green

| Capture | 結果／涵義 |
|---|---|
| [Independent source Red](infield-legacy-receiver-model-sprint-6-red-evidence.json) | 8 個真正 source gaps：SS／2B readiness-hands、ordinary effort、relay stages-arrival、2B location、misplay advancement。仍 Red；非 fabricated field assertion |
| SS save Red | 當時新 test 44 項：40 PASS／4 FAIL；current 與 exact c412 的四種矛盾 copy failures 相同 |
| [Final focused green](infield-legacy-receiver-model-sprint-6-green-evidence.json) | 52/52，新增 safety／compatibility assertions 通過；並非獨立 receiver stage PASS |
| Exact baseline final test 對照 | 最終 52 項在 exact c412 為 48 PASS／4 FAIL；同四個 validation assertions，current 全部通過 |

52 相比原 save-red 的 44，多八項原 cache rejection 與 legacy compatibility 等檢查；四個 failing expected 沒有改成接受 tamper。原 79／33 檔案 SHA-256 不變。新增測試直接重用其合法 fixture 前段，沒有執行／改寫 protected smoke。

## L. Regression

Final representative capture 在唯一 Production guard 修改後完成：原 focused **79/79**、L03 **33/33**、13 representative suites **13/13**；共 15 個 subprocess 都 exit 0。[Final regression](infield-legacy-receiver-model-sprint-6-regression-final.json)。[Pre-repair regression](infield-legacy-receiver-model-sprint-6-regression.json) 保留但不代替 final。

Representative 包含 MatchGameRecord、SS、DecisionThrow、Shared Infield 2B、3B、1B、ForceAdvancement、RunnerThrowSettlement、MatchExperienceDevelopment、Ground Identity、Ground Lifecycle、Save Admission、Pitch Source Scope。

原 227 manifest 最終 **224/227 PASS／3 FAIL**，**本輪只執行一次**（2026-10-12 08:54:24–09:02:08 UTC）。數量／順序／SHA-256 `871902b4d5ecd7beb2bd23848be8c985ed7ddc52ecc5ebc6b40ba57d2f335a96` 與原 227 個 suite source hashes 不變。三項 FAIL 全為原 Debt，相同 signature；沒有其他失敗或 subprocess error。script.js 的 before／after source hash 相同，新增 Production regression=0。沿用先前已驗證的 git-show 30 MB buffer compatibility，只補未指定 maxBuffer 的舊 test 呼叫；不改 tests/assertions/seeds。

| 原 Baseline Debt | 原分類／signature |
|---|---|
| `ability-performance-gradient-test.js` | Low tier can have a multi-hit game |
| `baseball-match-foundation-2-2-2-test.js` | 第 36 full-match assertion |
| `high-school-year-one-opportunity-two-integration-test.js` | partial runtime 缺 DefensiveDecisionThrowFoundation |

歷史 exact f16 的相同失敗證據沿用已提交 Sprint 5 validation，不宣稱本輪重跑了這三項 exact baseline。新發現 SS copy gap 則另有本輪 exact c412 記憶體重現，不歸入三項 Debt。最終全量結果見 [manifest evidence](infield-legacy-receiver-model-sprint-6-validation-final.json)。

## M. Production Comparison

[Bounded comparison](infield-legacy-receiver-model-sprint-6-comparison.json) 由 exact c412 root Production `git show` 在記憶體編譯，與 final source 相比；同一 physicalIdentity／roster actor／初始 runners／能力 snapshot／owned sample／route。**34 個完整 fixture projections 全部相等**：physical truth、raw acquisition/delivery/receive、action依賴與退休、outs／bases／runs／cursor、E／A／H／FC、GameRecord hash、Evaluation hash。

Expected versioned execution changes=0；enabled scorer interpretation changes=0；fixture unintended changes=0。四個期望改變僅是 save admission 拒絕矛盾 SS copy，沒有當作模型 execution changes。new-version incoming 候選只有 isolated witness，沒有 Production activation。

32 對自然 playback 沿用 Sprint 5，不加入本輪證據或重新宣稱本輪 cohort。Player 2B coverage witness 是 declared legacy scenario，physicalIdentity=null，與 34 physical fixture 分開。沒有增加全場 contact denominator、強制 starter、seed／能力調整或湊 failure 頻率。

## N. Remaining Gaps

1. SS：真實 positioning／到位時間、independent hands、proxy 與 availability 的責任邊界；atBase 常數不能補證。
2. 2B：delivery 的可接位置／品質、combined ready／hands 分離、continuous ball／receiver／runner arrival。原 ordinal window 僅保留窗口層級事實。
3. Relay：兩種 DP 的末段 incoming accuracy、receiver readiness／Secure、第二 contest 的 continuous arrival。不可從 first force／final bool 推導。
4. Ordinary effort 與 error-specific advancement：legacy 缺獨立來源；不能以失敗、safe/out 或壘位差補造。3B NPC receiver 也不是完整獨立參照模型。
5. New-version pending／executed／settled admission 尚未實作；source contract 是 proposal。現有 legacy replay PASS 不能代替新版本遷移驗證。

因此無法提供所有 SS／2B 普通努力漏接／晚到／extra advancement 的 Production 正例。這些列為來源與模型限制，不換 expected、不以新欄位宣告 PASS。L03 仍是未完成範圍。

## O. Model Migration Decision

選擇 **C：保留 legacy execution＋explicit insufficiency**，停止 receiver 模型擴張。策略 A 無法獲得獨立 stage；策略 B 有 same-input secure outcome 改變與 2B delivery 型別拒絕，尚未完成版本 activation 前提。

後續提案需先審查 ready／secure 的能力映射、需求與時間 units，再提供各 leg 真實 delivery／positioning owner，預宣告 expected execution 與 scorer 差異。old pending 預設 legacy；只可在第一次 execution 前以明示 version 選擇轉換。old executed 不重跑、不默默升版；old settled 不回填。new-version 必須 version-specific admission、actor／route／sample／physical chain 一致，未知 version 或缺必要 facts 明確拒絕／延後，不 fallback 偽裝舊版。

本輪唯一例外是已完成的 Phase G copy validation 修復，來源與 exact baseline red 在模型施工前已確立；不新增 receiver authority。沒有開始另一 Sprint，也沒有 Defensive Foundation Closeout。

## P. Final Gate

| Gate | 本輪結果 |
|---|---|
| Receiver Stage Provenance | PARTIAL：現有 A/B 已查證，獨立 C 仍缺來源 |
| SS Receiver | PARTIAL：legacy 不變，未啟用新 readiness／Secure |
| 2B Receiver | PARTIAL：combined authority 不拆造 stages |
| Relay Receiver | PARTIAL：stage／timing 缺口保留 |
| L03 Scorer Source | PARTIAL：explicit insufficiency；不是正式 ordinary-muff 完成 |
| L01／L02 Regression | PASS：原 112 assertions 與有界正反例通過 |
| GameRecord／Evaluation | PASS：34 pairs 相同、原 suites 通過；非全 official scorer 驗收 |
| Save／Exactly-Once | PASS：existing legacy scope；新增 SS copy guard、replay／duplicate／tamper 通過；不包含 proposal version |
| SS／2B／3B／1B Regression | PASS：13/13 representative＋79/79＋33/33＋新增 52/52 |
| Full Repository | PARTIAL：224/227，僅三項原 Baseline Debt |
| New Production Regression | 0 |
| Ready for Commit | NO：receiver stage／L03 仍 PARTIAL，需人工驗收 |

完整性與最後 status／diff check 見 final evidence。diff check／stat 以明確 pathspec 排除 protected smoke，避免讀取其內容；本輪 tracked diff 僅 script.js 七行，其他原可讀 tracked hashes 不變。所有新增檔案另外檢查 trailing whitespace／blank EOF；JSON 均可解析。保留受保護 WIP 與所有舊證據，無 Git mutation，完成後停止等待人工審查。

可重跑 focused：`node tests/infield-legacy-receiver-model-foundation-test.js`；`--red` 會依未解決來源缺口 exit 1，`--baseline` 在 exact c412 重現四項 copy rejection FAIL。這些是明示不同的驗證目的，不能把 Red exit 1 當作新增 Production regression。runner 各 capture 使用不可覆寫 guard；已有證據時不要重跑 red／red-save／green／compare／regression-final／full-final 覆寫或追加 manifest。
