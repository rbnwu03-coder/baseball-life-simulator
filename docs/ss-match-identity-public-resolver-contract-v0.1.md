# 《棒球人生》SS Match Identity & Public Resolver Contract v0.1

任務：Bounded Entry Contract Repair & Canonical Continuation  
日期：2026-10-15（Asia/Taipei）  
Git參考基線：`ab3117653945de0b7013636187c446276a96e634`

**隔離Fixture的入口契約修正完成，沒有修改Production：由正式Current Match owner決定identity後，Gate A／B成立，public resolve成功且不切換Match。唯一候選及同條件replay均在115ticks自然完賽；完整Record／Log／Decision sequence／final player一致。**

本場沒有meaningful SS defensive Moment，**Natural SS meaningful defense仍UNVERIFIED；不以0＝0代替守備驗收**。既有routing在這個正式Event／Current Match使用方式下不需要Production修復；任意自訂identity仍不在本證據保證內。**SS Match UI Slice條件＝NO；Ready for Commit／Sprint10B＝NO；Receiver v2＝DISABLED。完成後停止。**

## 1. 開工保護與明確白名單

開工與結案branch=main，HEAD／main／origin/main tracking ref均為指定基線，Git index空。核對前輪1618個既有hash、34個delivery entries及delivery自身，建立本輪 **1653個既有可讀檔案SHA-256** 清單；結案全部相同。前輪Snapshot四個授權修復、其他WIP與captures均保留，既有Production／正式tests／fixtures／seeds／pins／runner／registry delta＝0。[Baseline](ss-match-identity-public-resolver-contract-v0.1-baseline-evidence.json)、[Closeout](ss-match-identity-public-resolver-contract-v0.1-closeout-evidence.json)、[Delivery](ss-match-identity-public-resolver-contract-v0.1-delivery-evidence.json)

先exclusive-create [Whitelist](ss-match-identity-public-resolver-contract-v0.1-whitelist-evidence.json)，將source reads限定於明列的script、index、Canonical helper及Entry-Safe入口檔案。再從已核對的index取得92個exact script paths，逐項拒絕protected／越界路徑，保存 [Runtime whitelist](ss-match-identity-public-resolver-contract-v0.1-runtime-whitelist-evidence.json) 後才載入VM。內容定位只在指定檔案內進行；既有檔案hash清單另逐檔明列，沒有內容glob、跨目錄全文搜尋或git grep。

12個protected paths僅核對status與size／mtime，沒有文字擷取、hash、執行或修改；本輪沒有新增protected存取偏差。Metadata相同不是content hash證明。沒有未限定路徑的git diff／diff --stat，也沒有Reset／Clean／Stash／Stage／Commit／Push、fetch或遠端server重新查證。新captures均獨立名稱、拒絕existing target及exclusive-create，舊captures不覆寫。

## 2. 事前固定的唯一相容候選

任何本輪gameplay前保存 [Plan](ss-match-identity-public-resolver-contract-v0.1-plan-evidence.json) 與 [Fixture input](ss-match-identity-public-resolver-contract-v0.1-fixture-input-evidence.json)。只改Match啟動與identity來源：

| 項目 | 固定方式與限制 |
|---|---|
| 原玩家／入學／SS／學校 | 原樣重用前輪facts內的pre-Match fixture checkpoint；同名、同能力、正式SS、invitation index0、原學校與已完成高中入學資料 |
| Checkpoint還原 | 使用正式 `normalizeSave`，完整能力快照before／after deep equal，invitation／capability validation均ok；沒有改能力或重新選校 |
| Event起點 | **既有checkpoint已是highSchoolStep5**，由story owner解析為high_school_showcase；本輪step5→step5，沒有額外Event進度或直接event-state寫入 |
| Match啟動 | 呼叫 **prepareCurrentHighSchoolYearOneMatch()**，不傳matchId、不供應Opportunity、不自行命名identity |
| Identity | owner實際給 **hs-y1-autumn-exhibition**；不是fixture先指定字串後要求resolver配合 |
| Seed | 保留前輪actual **2884315748**，事前交給既有pending test hook，由正式seed owner消費；不是挑選新seed，也不是改Production RNG |
| PlayingTime／名單 | 正式producer重新決定Opportunity，再由正式roster／lineup／substitution owner落實；不指定starter旗標或finalized arrays |
| Policy | 原secure／zone／first-legal、randomSource0.72、safety1400 |
| Replay | 同checkpoint、同Current owner入口、同seed authority、同policy，最多一次；Gate A／B失敗不重試、不換候選 |

**這是已審查checkpoint的Continuation，不是重新從completeEntry走完前五個故事事件的證明。** 該既有fixture的step5起點完整披露；本輪沒有偽稱已透過故事選項自然走到該點，也沒有呼叫progression helper跳過新事件。正式Current／Event owner在這個明列起點上建立及維持Match。[Driver](ss-match-identity-public-resolver-contract-v0.1-proof.cjs)、[exact source](ss-match-identity-public-resolver-contract-v0.1-source-evidence.json)

原故事intro等選項會改discipline／pressure／observe等原能力，因此沒有為了造出新入口而執行它們後再恢復數值。能力相同只指本場前置輸入；合法比賽settlement的Career effects仍由原owner處理。

## 3. Current Match Authority與Schedule／Event契約

| Owner | 實際責任與支援範圍 |
|---|---|
| story.js：getCurrentEventId | 根據目前story state選Event。還原checkpoint的章節／step5實際返回high_school_showcase |
| story.js：high_school_showcase | 正式交流賽Event；choices委派給正式Match choice owner |
| prepareCurrentHighSchoolYearOneMatch | 按Current Event分派高三／高二／followup等既有owner；本場走第一年default prepare |
| prepareHighSchoolYearOneMatch | default target identity為hs-y1-autumn-exhibition；首次消費seed、建立PlayingTime／roster／Match；已初始化或completed的同id Match重用 |
| createHighSchoolPlayingTimeOpportunity | 用同一targetMatchId、readiness、school context等產生Opportunity；career role不直接等於先發 |
| resolveHighSchoolYearOneMatch | 參數是decision、expectedMomentId、randomSource，**沒有任意Match identity參數**；先呼叫Current owner，再驗phase／identity／合法choice／重複完成 |
| HighSchoolScheduleOpportunity／launchHighSchoolScheduleEntry | 維護eligible schedule entry、Match context與啟動link；matchId由正式呼叫端options供應，Schedule link本身不會讓public resolver接受任意id |
| prepareHighSchoolFollowupEvaluationMatch | 既有followup Event消費其正式N+1 Opportunity與固定既有identity，再走Schedule entry；本輪只查source，未新增該路線runtime驗收 |

所以 `prepareHighSchoolYearOneMatch({matchId})` 的參數化能力，只能證明準備owner可建立該Match；**不能推論story current selector已承諾維持任意自訂id**。正式Schedule／followup路線有其Event、Opportunity與entry前提，不能拿任意prepare結果代替。[16份current function regions](ss-match-identity-public-resolver-contract-v0.1-source-evidence.json)、[Focused graph／traces](ss-match-identity-public-resolver-contract-v0.1-focused-graph-evidence.json)

Graph generation仍為2026-10-15T01:30:19Z；前輪Snapshot刪除7行後的舊座標不當作fresh source。Material結論均用白名單內current source直接讀取及SHA-256核對，沒有重做全面Architecture Audit。

## 4. 舊候選失敗的精確原因與本輪修正

前輪直接prepare了 `hs-y1-ss-natural-defense-validation-v0.1` 並提供該identity的Opportunity；但public resolver按既有Event取得的是default `hs-y1-autumn-exhibition`。Driver保留的m不再是player.highSchoolMatch，合法候選choice在另一個Match的phase前被拒絕，故停在moment_1_ready。前輪FAIL captures保持原狀，不被本輪PASS改寫。

本輪先還原同一checkpoint，再讓Current owner決定identity，**沒有修改resolver或在失敗後反覆prepare把identity改回來**。Gate A另外做一次同owner重選檢查，要求返回同一object且完整player bytes不變；如有差異立即停止，不安裝另一個Match掩蓋問題。實際重選沒有mutation，後續public／playback亦持續檢查current reference／id／Event一致。

| 比較 | 前輪 | 本輪 |
|---|---|---|
| Identity來源 | fixture指定custom id | 正式Current owner的default id |
| Opportunity | supplied custom-identity producer結果，score54 | default prepare內正常producer，score44 |
| Numeric simulationSeed | 2884315748 | **2884315748** |
| Seed authority | supplied Opportunity identity hash | **既有pending test input → 正式seed owner消費並清0** |
| Public resolve | false，current Match被重新取得為另一個id | 有效結果，current object／id不變 |
| Closure | safety1400未完賽 | **115ticks自然完賽** |

數值seed刻意沿用前輪，來源則隨合法啟動方式改變，兩者分開記錄。**沒有把新default Opportunity的identity hash冒稱2884315748，也不主張兩種不同identity／plan應有所有bytes的整場parity。** 舊候選沒有final結果可作完整全場比較。[Findings／對照](ss-match-identity-public-resolver-contract-v0.1-findings-evidence.json)

## 5. Gate A／B：身份、上場與公開結算

首次及replay各自是全新VM，結果相同：

| Runtime證據 | 實際值 |
|---|---|
| Gate A | issues=[]；Current／Match／Opportunity identity一致，Event=high_school_showcase；同owner重選為同object、完整player不變 |
| 原能力／資料 | restore前後完整能力相同，step5不變、SS不變、invitation／capability validation有效 |
| 初始admission | career role starter；Opportunity score44、lateGameAppearance／entry6；player在canonical players與bench、不在lineup，entry=false |
| 正式替補 | 六局下2outs、三壘有人、1：4；playerEntry seq89、第8棒，真正換下原SS incumbent |
| 合法玩家決策 | tick86、ID1、zone；actual batter=currentBatter=player，真正已在lineup／SS |
| Public結果 | 回有效敘事，新增一次真實player PA及一次completedMoment／resolved event，outs2→3；current object／id保持相同 |
| Exactly-once | 相同choice／ID再次public resolve回false，完整player不變、Current Match不變 |
| Playback | 可繼續第七局，115<1400，completed／settled=true；沒有失敗重送或換候選 |
| 每步state | 每run230份before／after觀測，current reference／id／Event均一致、native issues=[]、active defense合法 |

**本輪只有1個真實進攻Moment／每run。** 不是固定Moment1／3配額、不是SS先發或SS防守決策的證明；原#36與固定Moment3責任保持未解。[首次完整facts](ss-match-identity-public-resolver-contract-v0.1-candidate-first-facts-evidence.json)、[Replay完整facts](ss-match-identity-public-resolver-contract-v0.1-candidate-replay-facts-evidence.json)

Gate A不一致、Gate B合法choice被拒絕／改current，driver均會在首次發現即停止，先保存facts；不再提交至safety cap。本輪兩次stop=null，沒有需要Production修復的入口拒絕。

## 6. Gate C：自然守備續行的實際分類

玩家正式替補後進入第七局上守備，outer defensive gate曾為true；但這只是外層admission，不是Physical責任或meaningful成立的證明。

| 觀測 | 可以採信的範圍 |
|---|---|
| 2份physical snapshots | **同一個physical identity**，不是2個獨立play；後一份仍保存先前球的state，不能用當時queued batter當成另一個擊球 |
| 該真實擊球 | 七局上、regional-power-school-player-04；lineDrive／middle／medium；當時actual SS=player |
| Responsibility | 正式Defensive Opportunity的bindingStatus=bound，primaryPosition=CF、primaryDefender=school-development-29d536a2-player-08；沒有把球吸到玩家SS |
| Player detailed slice | ground handoff supported=false；line catch supported=false、reason=unsupportedLineDriveDepth；ordinaryPlay沿既有結果推進 |
| 其他續行 | 4筆buntDefensiveFallback；末次bunt handoff supported=false，沒有建立可執行SS decision |
| 玩家routine／meaningful | playerRoutinePlay events0；created meaningful defense0、completed defense0 |

這場的分類是：**比賽可自然續行及完賽，玩家未取得可執行的SS routine／meaningful decision。** 不能把ordinaryPlay或unsupported fallback改列玩家routine PASS，也沒有把兩個snapshots當兩次Reach／Secure coverage。

Driver沒有傳pitch／physical-roll／擊球方向override。Raw中ordinary PA的既有pitch generator標籤來自正式pipeline自己的default，不是本輪注入假擊球。本場仍不能證明SS Reach／Secure、合法防守route取捨、Throw／receiver／runner timing或SS settlement；這些維持UNVERIFIED，沒有再挑第二個seed或候選。

## 7. Record／Career／Save／Replay與三時點

| 責任 | 首次／replay的同場結果 |
|---|---|
| Final Match／Record | 7局終、3outs、home1／away4；Record status=final、integrity=true，totals／result比分一致 |
| Event refs | 121 unique refs逐筆對應121 log events的sequence／type／inning／half |
| Actual Exposure | participated=true、started=false、entry6／exit7、PA1、defensiveInnings1；守備局數1不代表meaningful防守1 |
| Career | evaluation sampleCount1、本場identity一次、history1、Experience settled=true |
| Save memory | 正式normalizeSave round-trip保留本場Record／log／completedMoments／rosters／exposure／Experience／evaluation |
| 公開終局duplicates | settle兩次＋finish一次皆false，完整player不變；不是低階helpers任意重呼保證 |
| 完整Replay | 相同入口、checkpoint、seed authority與policy；Record、log、decisions及完整final player deep equal |

本輪的Decision Context為 **6下2outs、三壘有人、1：4**；正式結果後completedMoment為 **6下3outs、空壘、1：4**；真正Final Summary為 **7終3outs、1：4**。完整completedMoment與結果後複本在finalization後deep equal，沿用Snapshot修復的Resolution語義，沒有把它改稱決策前snapshot或終場摘要。

| Replay項目 | 首次／replay共同SHA-256 |
|---|---|
| Record | `98f6361db48929e18233404e1d48a426e25e30e5027c2faaafda362accbb06ca` |
| Log | `b975ebf90308cd21ea7437d28c2ed0901907e9ba1b4adbc9c177caba3d65d8a8` |
| Decision sequence | `3abb5204e7aa101716892bd523c1a55146d2f04e0c23fa50ab737c4a1e962428` |
| Final player | `6014ad16731c7afa9946e7a963a1c4df197d3761466f3e024a22a2dc6c4772d6` |

這是同profile的完整Match replay，沒有宣稱observer-free neutrality、真實browser storage reload或所有career配置均已驗證。[完整比較與time snapshots](ss-match-identity-public-resolver-contract-v0.1-findings-evidence.json)

## 8. 執行證據與最小正式回歸策略

| 本輪standalone diagnostic | 結果 | elapsed | 成功Node assertion calls | Raw／witness |
|---|---|---:|---:|---|
| candidate-first | **PASS，10個具名diagnostic checks** | 400.2564ms | 1582 | [raw](test-infrastructure-sprint-0.1-ss-match-identity-public-resolver-contract-v0.1-candidate-first-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-match-identity-public-resolver-contract-v0.1-candidate-first-evidence-assertions.json) |
| candidate-replay | **PASS，11個具名diagnostic checks** | 411.7022ms | 1590 | [raw](test-infrastructure-sprint-0.1-ss-match-identity-public-resolver-contract-v0.1-candidate-replay-evidence.json)／[witness](test-infrastructure-sprint-0.1-ss-match-identity-public-resolver-contract-v0.1-candidate-replay-evidence-assertions.json) |

共1個候選、2次執行／2場完成；21個具名diagnostic checks、3172個成功Node assertion calls，與正式Suite checks不同。兩次exit0／stderr空、entryVerified／sourceStable=true，Node v24.19.0。**Diagnostic PASS不把SS meaningful UNVERIFIED變成PASS，也不代表原正式#36已修復。**

使用原Entry-Safe preload及standalone main。正式runner檔案不改；docs profile只保留前輪已審查的index metadata替換，避免內部unscoped cached diff，其他execution／witness／classification／policy原樣。[Entry profile](ss-match-identity-public-resolver-contract-v0.1-entry-profile-evidence.json)

Raw保留actual command、env、Git refs、完整stdout／stderr、source before／after hashes、exit／elapsed／limits與assertion witness；完整Match facts由child以新路徑exclusive-create。Timeout120000ms／stdout buffer16000000 bytes／implicit Git show30000000 bytes，沒有增限。[Verification](ss-match-identity-public-resolver-contract-v0.1-verification-evidence.json)

沒有Production或正式test delta，以下可信captures的全部非docs dependencies均逐項hash匹配current，因此優先重用，**本輪正式Suite新執行數＝0**：

| 既有正式證據 | 採信結果與時點 |
|---|---|
| Snapshot Repair Canonical Regression | 歷史50/50 PASS，current source freshness相符；不是本輪新跑88221／88222 |
| 前輪SS Defensive Integration | 歷史26/26 PASS，current依賴相符；明示fixtures不能替代自然proof |
| 前輪Ground Settlement Lifecycle | 歷史26/26 PASS，涵蓋直接相關lifecycle／recovery／settlement；本輪未重跑 |
| Snapshot Repair Game Record | 歷史13/13 PASS，current依賴相符；本輪另有新候選Record觀測 |

完整capture路徑、hash與逐dependency freshness見 [Findings](ss-match-identity-public-resolver-contract-v0.1-findings-evidence.json)。沒有為了重複PASS報告執行其他套件，未執行Full255／Full251／R6Full227／First-base timing／Receiver Integration／Browser全套。

## 9. 驗收矩陣與未解決邊界

| Gate | 判定 | 精確適用範圍 |
|---|---|---|
| Formal Schedule／Current Match identity | **CONFIRMED** | 本場Current Event route；新的Schedule entry launch未跑 |
| Match prepare／public resolver identity parity | **CONFIRMED** | 正式owner identity、同object，全流程未切換 |
| Legal admission／lineup／substitution | **CONFIRMED** | 原樣還原合法entry checkpoint，正式SS替補；非先發 |
| Public decision exactly-once | **CONFIRMED** | 每run一個實際進攻決策；duplicate no-op |
| Playback continuation | **CONFIRMED** | public成功後續行至自然完賽 |
| Active SS defensive responsibility | **UNVERIFIED** | 記錄到的lineDrive由NPC CF負責；沒有可執行SS play |
| Meaningful SS defensive decision | **UNVERIFIED** | 0個，不能以0＝0代替 |
| Throw／Runner／Settlement | **UNVERIFIED（SS）** | 沒有SS防守執行；一般Match結算另已確認 |
| Final Record／Career | **CONFIRMED** | 本固定fixture的Record／exposure／identity／Save memory |
| Replay parity | **CONFIRMED** | 同入口與seed authority的完整replay |

仍未驗證：自然非零SS meaningful／SS 6-3、SS開賽先發、完整入學後故事進度、其他Schedule／year routes、browser lifecycle與observer-free control。原#36／Gradient歷史FAIL與S3 UNVERIFIED保留，未執行原suite或修改其source／Moment IDs。

## 10. Production Routing Fix／UI Slice與停止

**本證據不需要Production Routing Fix。** 入口問題由隔離Fixture採用現有Current owner契約解決；不應把public resolver改成盲目信任任意active id，來配合未被Event／Schedule接納的字串。若產品未來需要任意custom-id公開結算，應另案定義其current authority、Event與Save相容，不由本輪推論已支援。

| 停止Gate | 結案 |
|---|---|
| 本輪入口契約／唯一候選Continuation | **COMPLETE，A／B及完整replay成立** |
| Natural SS meaningful proof | **UNVERIFIED**，候選完成即止 |
| 支援的Current Match入口是否需Production修補 | **NO（本場證據）**；不作所有routing的普遍正確性結論 |
| SS Match UI Slice技術條件 | **NO**；仍缺非零SS defensive decision／execution完整證據，browser UI亦未驗收 |
| Phase B2／SS UI正式施工 | **NOT STARTED／NOT STARTED** |
| Ready for Commit／Sprint10B／Receiver v2 | **NO／NO／DISABLED** |

下一步最小建議是先人工審查本checkpoint／Current owner入口配方，將它作為後續相容性前置；若要補自然SS meaningful，須另案明定單一情境與接受條件，不用本輪成功反推可挑seed直到PASS。本輪不追加候選、不改Production／正式helper／tests，也不進入UI施工。

本輪source與evidence只使用明列白名單。Focused coverage限正式runtime modules、相關入口／helpers、引用captures與本輪artifacts，完整返回；freshness由direct source／hash與runtime補證，不把graph metadata當完整性證明。[Coverage](ss-match-identity-public-resolver-contract-v0.1-coverage-evidence.json)

完成後立即停止，等待人工審查。
