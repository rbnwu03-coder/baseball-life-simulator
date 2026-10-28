# 改善清單、最小方案與驗收

排序依玩家核心因果鏈與可修補程度。**確定缺陷**＝目前輸出與真實狀態矛盾；**設計取捨／接線缺口**＝程式事實已確定，但新行為需產品決策；**尚未驗證假設**＝缺資料，不當bug。本輪只交提案，沒有改Production／Match／Career／NPC／Save／DTO或畫面。

## 高優先項目

### I-01　高一健康代價主要出現在賽後，機會與場上表現承接不足

- **分類／優先**：P1，已由程式確認＋已執行驗證的接線缺口。不是宣稱現有規格承諾了每球疲勞懲罰；是否改場上能力仍是設計取捨。
- **玩家影響**：休息的好處難以理解；同角色下嚴重疼痛／風險可照樣完整出賽，隨後才評價較低，玩家可能覺得健康是隱藏扣分。高負荷強者與健康普通者缺乏足夠不同的可用性代價。
- **依據**：`script.js:4225`暫定角色讀pain/risk；`:9550–9580`動態trust/body為opt-in；`:9903`高一首次機會及`:13500`第二機會均未傳includeDynamicReadiness；`:6714,6728`full-match capability不讀body。`high-school-competition-reassessment.js:103–114`明確扣健康trainingEvidence。`gameplay-summary.json`顯示16/16對official record hash相同、評價差-0.896。
- **重現**：`node docs/design-optimization/verify-gameplay.cjs`，查看healthy/loaded，同seed45000–45015、同角色／能力，body (0,0,0)對(16,8,12)。再查看healthOpportunity：provisional會下降，但既有plannedUsage相同。這是隔離fixture，不冒充自然流程一定能持續維持受傷starter。
- **最小方案【設計提案】**：先只決定「尚未建立的高一機會是否讀當前健康與trust」。若採用，兩個建立點使用既有dynamic input；已承諾的decisionId／opportunity snapshot不因重繪或reload重抽。對需要完全停賽的健康門檻另做明確設計，不假設加權扣分能禁止受傷先發。第一步不新增逐球疲勞或改Match physical公式。
- **替代方案**：若刻意保留高一固定安排，明確把健康代價定位為暫定角色／長期可用性／賽後準備證據，並提供原因回饋；不能聲稱疲勞已降低本場擊球／守備成功率。此方案解釋現況，未完整達成健康影響出場的體驗。
- **受影響系統**：機會建立caller、PlayingTime輸入、角色重評與原因文字；不動DTO／保存架構／Match Engine。能力懲罰與逐局負荷如要做，另案。
- **驗收**：固定same readiness、role、school、stableVariationSeed，healthy／fatigue／pain/risk多級組先比機會分數，避免身份hash不同造成假方向；差距足夠時用途應有可解釋變化，但不要求每個pair換角色。舊已建立opportunity save/load與反重抽不變；兩次機會、無出賽零假成長、健康恢復後新機會可提高全部重跑。若保留現況，驗收文字能準確區分健康與技術扣分。

### I-02　未出賽仍被評論場上動作，高橋引用不存在的第七局

- **分類／優先**：P1，確定敘事缺陷；已執行正式無出賽比賽重現。
- **玩家影響**：人物像沒在看比賽；玩家無法分辨自己是否真的上場、教練是否根據證據評價。這直接破壞「表現→人物反應」的核心目標。
- **依據**：`script.js:13579–13605`有participationTruth且summary分支正確，但coachReaction先按overallTier套mixed；`:14305–14320`只依role寫高橋遭遇。`edge-results.json/experiments.noAppearance`：pitcher deferred、0 moments，仍說看對幾球與第七局選擇。
- **重現**：`node docs/design-optimization/verify-edges.cjs` 的Pitcher actual no-appearance。fixture固定starter是為隔離「角色≠實際曝光」；正式owner自行產生noAppearance、未手填結果。其他途徑未出賽亦應共用同真相分支。
- **最小方案【設計提案】**：賽後coach/consequence先按finalized actual exposure處理未出賽；高橋回應先核對實際moment／既有遭遇證據，沒有證據就採「觀察紀錄／尚無直接對局」。有出賽時引用真實已公開動作與局數，不能寫死第七局。保留所有評分、關係數值與機會邏輯。
- **受影響系統**：既有賽後文字owner與rival context建立處；不加NPC framework、不改UI版型、引擎、保存schema。
- **驗收**：未出賽、先發有樣本、替補短局三案；未出賽不得提接過球／第七局／打席，無共同場次不得說面對面對局。有樣本時引用存在的record／moment；同樣本只產一次結果、save/load不變；個人好輸球與個人差贏球仍保留不同反應。

### I-03　長打與控制訓練的收益差異不足，入門／中段有局部優勢解

- **分類／優先**：P2，高二補充範圍的高優先設計問題。14/15配對訊號已驗證；全域固定最優解尚未證明。
- **玩家影響**：想練長打的玩家多付fatigue卻常得到較少或相同batting進度；選項名稱使人期待不同能力方向，實際主要是同一能力的難度差。
- **依據**：`baseball-training-resolver.js:5–57`兩者都是batting／technical／standard，長打challenging疲勞+2、控制appropriate疲勞+1且球感/紀律+1。`script.js:1916`首次控制信任+1；`player.js:222–230`challenging適配大部分readiness<1。`edge-results.json`75case，其中15個長打/控制配對14個控制progress≥長打。
- **重現**：`verify-edges.cjs`，skill2/8/14/18/20 × trait2/5/8。例skill8/trait5：21對22progress，疲勞8對7；例外skill18/trait8：11對10。不要只挑例外或把技能20的零成長隱藏。
- **最小方案【設計提案】**：保留現有技能、Development與DTO，先定義兩種課表的適用條件。方案A：仍同batting，高readiness／高品質時高強度訓練給足以辨識的進度優勢，低readiness保留風險／低吸收；需沿既有合法context調整並校準。方案B：接受只是強度不同，後續用文字準確說明，不暗示獨立power成長。若要求真正打擊型態分化，需另案能力設計，不能偷偷新增power skill。
- **受影響系統**：training definition/context、Development校準、既有relationship hook的可見說明；不修改Match公式／保存格式。這輪不改選項呈現。
- **驗收**：預先定義新手／熟練／精熟與低／高負荷的目標，再掃現行能力範圍與多個來源identity；有至少一組合理情境高強度值得其額外負荷，另一組控制更適用。保留上限、progress-first與每slot去重。不要要求兩種課表同勝率、任意一輪都升級，或移除控制的正常用途來製造差異。

## 其餘依序處理

| ID／分類 | 玩家影響與依據 | 重現 | 最小方案／系統 | 驗收 |
|---|---|---|---|---|
| I-04 P2 確定文字缺陷：same被當角色變動 | 角色未變寫「由先發調整為先發」；`high-school-competition-reassessment.js:179`回same，`script.js:13650`比較unchanged | edge-results無出賽feedback，及普通單場第一樣本role未變 | 原既有reason渲染判別same；只改文字，不改role | same／promotion／demotion三種正確敘述；歷史／數值／保存不變。可與I-02同個最小修補 |
| I-05 P2 範圍缺口：玩家投手出賽延期，新view未提供手動投捕配球 | 玩家以為所有守位都有完整高一年；`playing-time-game-exposure.js:288`deferred；PublicBridge只live plateDecision、其他原UI | pitcher完整無出賽；既有34項投捕測試只是模組，不是玩家投手生涯 | 先確保既有入口／任務文字誠實說明延期與證據限制；功能閉合另案，不開引擎移植 | 投手不被宣稱完成正式投球、沒有假投球成長／職業offer；捕手原決策仍可用。新manual pitch功能未做前不聲稱通過 |
| I-06 P2 設計提案：人物回應缺少具體行為延續 | 阿哲具累積分支，但兩話題常共echo；高橋壓力不直接改可選行動；見04及`script.js:14266,14305,16326` | 同variant的電話不同選項、不同真實moments後比較rivalContext | 先做04的兩個代表事件，使用既有memory/flags、同match identity；不給免費先發 | 具體前因→本次回應→第二場後追問有可追蹤證據；不同前因不可套同一不成立細節；冷卻／去重與save/load驗證 |
| I-07 P2 資訊取捨：成長進度／健康原因與機會未完整解釋 | 當次未升級不等於白練；同表現健康不同被評低；原view與新Bridge覆蓋不同 | 控制progress22但levelUps0；healthpair | 依05提供既有可讀原因，缺投影另立owner議題；不由UI讀私有truth | 玩家能回答成長是否保存、角色為何未升、健康影響哪一步；未知不顯示0；原公開揭露邊界不變 |
| I-08 P3 設計取捨：訓練結果閱讀不保存 | load跳到已結算下一事件，數值不丟；`showCurrentEvent:16563`清pendingTrainingOutcome | edge training save/load，同VM及fresh VM皆進role test，progress/trust一致 | 先維持現有Save架構，以既有歷史供延後查看；是否恢復閱讀層另案，不能因此重套訓練 | 任何閱讀恢復不得重加fatigue/skills/trust；沒做閱讀恢復時說清楚，不誤標state loss |
| I-09 P3 尚待確認：長期固定最優解／全部能力敏感性 | 天真first政策大量take，last混有自動打席；固定敵我名單不適合推人口平衡 | cohort詳細decisions與1/112勝場分布 | 先定義2–3種真正讀情境的合法策略，配多school/opportunity identities與更多seed，用正式入口 | 報PA／曝光／判斷／執行／生涯效用，不只勝率；區分policy、ability與RNG，沒有假模擬器 |
| I-10 P3 驗證限制 | G2-B1達本輪60秒上限，三套custom throw缺完整checker witness；舊PASS不可代替 | existing-test-results與logs | 後續若需全基線，沿專案既有合理timeout政策單獨跑並保存entry／assertion證據；不改測試期望 | 取得完整退出與真實checker證據；timeout／未執行不列PASS |

## 建議下一輪最小修改範圍

第一個可獨立驗收的patch：**I-02＋I-04**，只改原賽後／高橋文字選擇的狀態條件與same判別，新增未出賽／實際出賽／角色維持的有意義回歸測試。保留既有評分、random、角色門檻、DTO、保存與所有畫面。先重跑高一兩次機會、角色回饋、noAppearance、event去重及save/load；不把文字修補擴成NPC或引擎重構。

第二個獨立patch才處理I-01機會輸入，先形成健康門檻／已承諾機會的明確規則再實作。I-03訓練校準另行驗收，避免一次混改健康、成長與人物造成因果難以歸因。

本輪完成的設計成果足以提供畫面工作資料需求與具體修補議題；所有核心行為變動仍停留在提案，未自動啟動下一輪。
