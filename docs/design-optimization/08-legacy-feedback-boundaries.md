# 舊資料邊界與相關敘事收尾 — 2026-10-28

**完成：新增15項語意回歸及原14項回歸均通過。受影響既有回歸11套PASS、2套FAIL，0逾時；失敗原因分列，不宣稱全部測試通過。**

本輪以開工工作樹為基線：`accepted-gameplay-g2-b2-v0.1`／`0d3ed173952b9b8e5d5842a73761f649b50be594`。未切換、重設或提交。使用codebase-memory skill的限定source fallback；本session沒有圖譜工具，不宣稱index coverage。前輪報告、全部raw evidence與原14項測試檔都保留。

本輪只改 [script.js](../../script.js) 的文字生成／資料選取，另加 [語意回歸](../../tests/high-school-legacy-feedback-boundary-test.cjs) 及本紀錄。版型、流程、引擎、評價、健康、訓練、NPC狀態機、DTO、Save契約與依賴不變。開工2,207個既有檔案最終只有script.js不同，包含既有story.js與Match UI修改均保持開工bytes；見 [保存核對](legacy-feedback-v1/preservation.json)。

## 先確認正式入口可達性

從原正式引擎fixture開始，以固定seed45000，透過實際決策／playback走完交流賽、阿哲電話、第二次隊內評估，停在原`high_school_role_reassessment_feedback`。不手填比賽結果。之後對detached舊存檔副本省略欄位，走原`saveGame → fresh runtime loadGame → showCurrentEvent → showStory`；每次都核對「進度讀取完成」及實際事件／畫面內容，避免load已失敗但player已指派的假成功。

| 原碼觀察 | 本輪確認 | 玩家缺陷判定 |
|---|---|---|
| 第二次角色回饋把缺actualExposure寫成沒有上場 | Save對match history只deep clone，沒有補actualExposure；載入成功，正式角色回饋畫面可顯示「本次沒有實際上場」，即使同場正式record有PA | **已執行重現的玩家回饋缺陷** |
| 高一歷程把缺actualExposure寫成未出賽 | 當較早那場缺曝光與可核對的備援時，load後仍可正常選角色確認→高橋方向→年末；舊畫面把它寫成「機會1：沒有實際上場」 | **已執行重現的玩家回饋缺陷**，不是拿現在第二場反推第一場 |
| 缺目前角色時，journey用startingRole產生維持 | Save允許缺canonical role及相關目前角色欄位；直接呼叫helper可重現假維持 | **helper邊界成立**；不可直接當成玩家已遇到的年末缺陷 |
| 上述缺目前角色是否會經正常年末路由顯示 | `evaluateHighSchoolYear`在呼叫journey前，先於缺canonical role時執行原`resolveHighSchoolProvisionalRole`。實測正常走到年末時已有有效角色 | **正式年末路由的既有保護已驗證**；沒有宣稱此路由重現了假維持 |
| 高二相鄰摘要的相同fallback | 既有Save／高二senior-plan入口接受省略曝光／目前角色的legacy紀錄；原高二摘要也會預設起始角色並把缺曝光當未出賽 | 本輪補相同文字邊界；這是合法legacy輸入驗證，不宣稱跑完自然高二兩場比賽 |

舊`青棒第一年小結`載入直接顯示已存的highSchoolDetail，不會重新呼叫journey。本輪沒有重新解析或回寫已封存自由文字；修補作用於動態回饋及正常流程新生成的摘要。原碼依據：`save.js:149`附近保存history、`script.js:evaluateHighSchoolYear`的角色補評與`showCurrentEvent`原入口。

## 最小修補

### 曝光使用三種狀態

新增內部唯讀`getHighSchoolHistoryExposureFeedback`與formatter，約`script.js:13665`：

- **已出賽**：該紀錄有明確participated=true或有效正值PA／守備局數。若只有出賽事實、缺數量，就說細節還在整理，不補0。
- **確定未出賽**：該筆actual exposure明確participated=false或actual appearanceType=noAppearance。缺欄位、空物件、只有零計數都不自動等於未出賽。
- **未知**：沒有足夠資料就說「出賽紀錄還在整理」，不寫沒有上場。

補用其他來源必須核對同一matchId：依序讀同場opportunity曝光、相同history／gameRecordSummary（gameRecordId也須相同且playerId為player）、相同目前比賽的正式證據／已結算曝光。沒有matchId就不借目前比賽。只有出賽證據而非完整曝光時，保留缺少的數量為未知。

第二次評估的「上一場」也改從既有N+1.previousMatchId找對應紀錄，不再只靠opportunityIndex=1，避免引用另一場同index的資料。

### 目前角色不由起始角色推論

新增唯讀`getHighSchoolFeedbackCurrentRole`，約`script.js:13652`：先使用有效canonical role。若缺少，只有同學年、同matchId、最新history、已套用評價的lastReassessmentAt，以及roleContext.code相互吻合時才補用該角色。沒有這組權威證據就保持未知，不用startingRole、目前比賽入場role或預計用途補值。

journey若只知道起始角色，便只描述該起點與「目前角色仍待確認」。角色重評若要補目前值，也須對應該筆matchId。高二原摘要的起始／結束角色fallback同步移除，缺資料時只改摘要文字；不改角色owner或重新評價。

### 同一批入口與玩家用語

套用於第二次角色回饋、高一journey、高一年末逐場摘要、第二場前回顧，以及高二相鄰journey／年末文字。清理本輪涉及的阿哲電話、教練未知回應、比賽表現摘要、高橋未知回應與投手摘要；保留人物語氣與原事件流程。

| 修改前 | 修改後例句 |
|---|---|
| 缺曝光仍寫「本次沒有實際上場」 | 有同場資料：「本次：4 打席、7 局守備。」；無資料：「本次：出賽紀錄還在整理。」 |
| 缺數量寫「0個打席、0局守備」 | 「已有出賽紀錄，詳細內容還在整理」 |
| 起始先發＋缺目前角色→「角色維持先發」 | 「入隊時的角色是『先發／關鍵任務』；目前角色仍待確認」 |
| 「沒有虛構守備局數、打席或比賽成長」 | 「這場比賽沒有輪到你上場，先把下一次準備做好。」 |
| 「沒有把球探內部評語當成已知事實」 | 「你和阿哲聊起這次出賽與下一次的準備。」或引用已有紀錄的實際局面 |
| 「暫不補上打席或守備選擇」 | 「這場的個人出賽細節，等紀錄整理好再慢慢說。」 |
| 「高二沒有虛構正式投球局數或投球表現證據」 | 「投手使用仍延後處理；下一次正式出賽的安排，仍要等教練確認。」 |

主要修改位置：`script.js:13614–13715`文字reader／formatter，`:14504`後的followup／role feedback／journey，以及`evaluateHighSchoolYear`、`getHighSchoolYearTwoJourneySnapshot`和`evaluateHighSchoolYearTwo`中的摘要文字。story.js、本輪以前的測試與文件未改。

## 實際驗證

權威結果：[彙總](legacy-feedback-v1/summary-delivery.json)、[修改前](legacy-feedback-v1/before-delivery.json)、[修改後](legacy-feedback-v1/after-delivery.json)、[原14項重跑](legacy-feedback-v1/original-14-delivery.json)。

新增**15/15 PASS**；在本輪開工原碼快照中為13 FAIL／2 PASS。兩個原本PASS是明確未出賽的語意與正式年末角色補評保護；這不是宣稱原碼有15個玩家bug。

| 語意案例 | 結果 |
|---|---|
| 省略actualExposure可Save/Load並由同場資料恢復已出賽 | PASS |
| 較早歷史缺證據保持未知，不借目前比賽 | PASS |
| 上述未知紀錄經正常選擇到正式年末畫面 | PASS |
| 缺目前角色時helper不拿起始角色推維持 | PASS |
| 正式高一年末路由先補評角色的既有保護 | PASS |
| 已知有出賽、缺數量不製造0 | PASS |
| 缺matchId不能借目前ledger | PASS |
| 明確未出賽仍與未知區分 | PASS |
| 缺canonical role、有相符已套用權威資料時可補值 | PASS |
| 不採用另一場gameRecordSummary | PASS |
| followup前次曝光不足時維持未知 | PASS |
| 相同opportunityIndex但matchId不符不得引用 | PASS |
| 高二缺曝光／目前角色不借高一權威推論維持 | PASS；經原Save/Load／senior-plan入口 |
| 投手摘要保留deferred語意、去除驗證用語，不增投球紀錄 | PASS |
| 本輪涉及的玩家文字不再使用所列驗證句 | PASS |

共14個legacy副本成功經原載入與顯示入口；每次核對原成功notice。高二及局部history案例是既有入口允許的legacy欄位組合，不是宣稱自然生成過所有缺資料狀態。

原**14/14 PASS**，測試檔bytes保持開工版本；四組固定狀態的record、能力、body、Development、評價、關係、旗標、角色與機會結果仍和前輪結果deep equal。此外，正常走完高一兩場實戰的base record亦與本輪修改前一致。讀取高二journey前後的player JSON一致，reader沒有回填或改寫狀態。

### 既有回歸

原suite以main入口執行，沿用既有assertion／V8 checker觀測，不修改期望。完整raw輸出與witness在 [existing-tests-final/](legacy-feedback-v1/existing-tests-final/)，最後小幅previousMatchId修補另跑 [existing-tests-retry/](legacy-feedback-v1/existing-tests-retry/)。

**11套PASS**：高一competition loop（28）、Opportunity Two（40）、year transition（44）、integration1-2-3（28）、three-year spine（自訂54）、coach response（10）、match experience（46）、playing time（53）、career save admission（自訂45）、G2-B2（171）、G2-A bridge（616）。數字為被觀測的assertion或自訂checker次數，不把它們當玩家情境數。

**2套FAIL，未掩蓋：**

1. `high-school-integration-1-1-test.js`：9項後遇到`BattedBallPhysical is not defined`。本輪以開工script/story快照重播同樣失敗，屬既有runtime manifest缺載；沒有補依賴或換resolver。
2. `high-school-year-two-competition-loop-test.js`：第36項仍精確要求`沒有虛構正式投球局數`，與本輪明確移除玩家驗證用語的要求衝突。本輪沒有把原期望改掉，也沒有把該字句藏回玩家文字；以新增投手語意案例確認保留延期且無新增投球表現。該suite在第36項中止，第37項未執行，不標PASS。開工原碼快照重播此suite會成功，故這是本輪有意文案變更造成的既有文字契約衝突，不冒稱原有失敗。

兩種分類的本輪重播證據：[baseline-failure-classification.json](legacy-feedback-v1/baseline-failure-classification.json)。此隔離診斷只將script/story讀取指向精確開工bytes，沒有改原suite、assertion或解算器，不作正式工作樹PASS宣告。

**逾時：0。未執行：**全repository套件、G2-B1長跑、Browser視覺／真人操作、所有歷史存檔版本，以及高三／成人的其他摘要。這些不標通過。

## 命令與證據保存

```powershell
# 本輪開工原碼：預期exit 1，重現語意缺口
node tests/high-school-legacy-feedback-boundary-test.cjs --baseline --out docs/design-optimization/legacy-feedback-v1/before-delivery.json

# exit 0：15個語意案例
node tests/high-school-legacy-feedback-boundary-test.cjs --out docs/design-optimization/legacy-feedback-v1/after-delivery.json

# exit 0：原14項及四組受保護資料不變
node tests/high-school-match-feedback-factuality-test.cjs --compare-to docs/design-optimization/feedback-repair-v1/after-verified.json --out docs/design-optimization/legacy-feedback-v1/original-14-delivery.json

# 原suite；因兩項上列失敗，整組exit 1
node docs/design-optimization/legacy-feedback-v1/run-regressions.cjs --final
node docs/design-optimization/legacy-feedback-v1/run-regressions.cjs --retry
node docs/design-optimization/legacy-feedback-v1/verify-baseline-failures.cjs
node --check script.js
node --check tests/high-school-legacy-feedback-boundary-test.cjs
git diff --check -- script.js
node docs/design-optimization/legacy-feedback-v1/capture.cjs after
```

輸出使用exclusive-create；重跑須換新`--out`／目錄名稱，不覆寫舊證據。原14項、前輪所有evidence及中間結果都保留。中間followup測試曾錯用「第二場結束、N+1已清空」的副本倒退到第二場入口，觸發既有N+1拒絕；它不是玩家缺陷。已改從真正第二場開始前保存副本，且強制確認load成功notice，最終可達性結論只依此正確入口。另曾不必要地改動健康小結標題，已撤回本輪該改動；健康邏輯未改。

## 限制與待辦

缺matchId或足夠權威證據時，無法重建過去的出賽／角色，保留未知。已封存自由文字不做全域解析／回寫；新生成摘要與動態入口採新reader。原碼的高三邀請／career summary另有類似布林化曝光顯示，本輪沒有擴到那些入口，列為待查，不宣稱已驗證其玩家可達性。既有高二第36項文字契約仍需另行同步審查；本輪不調整原測試期望。

本輪到此結束。
