# 提供後續畫面設計的資訊需求

本文件定義決策必需資訊、資料來源、可揭露時點與等待規則；不決定版型、美術、動畫、畫面切換、呈現模式或DTO改造。沿用現行default／opt-in。**動畫時間與玩家閱讀時間必須分開控制**；公開Bridge沒有elapsed milliseconds，不可用動畫進度推動正式比賽。

資料狀態：**A 現行公開／原敘事已可取得**；**B owner內有資料，缺該消費面的正式公開投影**；**C 本輪沒有可靠現行資料／功能**。B不是可直接讀raw Match的許可。來源如有缺值，顯示未知／尚未形成，不補0、不推定安全、不當成pending永遠等待。

## 決策資訊表

| 決策 | 選前必知 | 選後需呈現的結果與原因 | 必須等待玩家的時點 | 可延後查看 | 資料來源／可用性 |
|---|---|---|---|---|---|
| 生活／恢復 | 當前疲勞、疼痛、risk、課業／倦怠、角色要求；恢復只減fatigue還是包含pain | 已改變的值、上下限／未改變原因、這次作用在準備／角色或後評哪一步 | 選擇；有明確結果確認時等繼續 | 完整生活歷史、公式 | player.body／academic、選項effects、getPlayerSnapshot／stat feedback A；精確比賽成功率C |
| 守位形成 | 目前主副守、投球手合法性、教練理由、球隊需求與競爭概況；理想與能力差別 | 最終主副守、理由、仍需測試的項目；不可寫「你已選到先發」 | 選formation偏好與確認重要轉變 | 完整同守位名單、歷年gap | `highSchoolCoachEvaluation`／`highSchoolRoleContext` A；selectedPositionCompetitionContext內部詳細gap B，先沿現有可讀解釋 |
| 爭取機會 | canonical role、預計用途、非保證上場、樣本與健康限制 | 預計安排／實際進場要分開；為何有或沒進場、誰決定 | 玩家準備選擇；實際需決策的moment | 機會全部權重與歷史身份 | `getHighSchoolPlayingTimeAssignmentText`、原Match presentation A；opportunity raw scoreBreakdown B，不直接曝光隨機hash |
| 打席approach | 分差、出局、跑者、任務、對手已公開傾向、approach目標與粗風險 | 形成的策略／接下來是否自己逐球操作；不先顯示結果球路 | approach與agency手動選擇 | 跨場傾向與完整球史 | 原 `buildOffensiveDecisionChoices`／`BatterAnticipation.createPrePAPresentation` A；新Bridge不承包所有原敘事，保留原UI |
| 逐球打擊 | 球數、已公開觀察、球路判讀與不確定性、合法take/contact/power與tradeoff | 本球結果、球數／壘況變化、選擇與執行分開、何時打席完成 | `decision.available`且identity對齊時等玩家；未送出前不由timer越過 | 完整pitch history、公式、其他PA | `PlateDecisionFoundation.getPlayerFacingContext`提供count/perceivedPitch/routes A（原UI）；`LivePublicMatchBridge` identity/game/routes A；完整perceivedPitch在新Bridge未明列投影B，不從raw truth補 |
| 防守route | 正確場上時點、守位責任、來球方向、跑者受迫情況、粗窗口、全部正式合法route | 接球／傳球／接續結果、實際跑者推進與出局、決策與執行原因；不能顯示未選路線「必成功」 | 原activeSituation presented且合法route需玩家時等；無合約支援回原UI | 完整scorer細節、可讀正式紀錄 | 原 `getHighSchoolDefensiveSituationText`、route tradeoff、原presentation A；fine timingMargin／receiver私有資料B；完整連續XY與反事實成功率C |
| 捕手／投捕 | 說清楚是既有捕手守備或AI投捕配球；玩家目前能選什麼 | catcher意圖與最終執行若不同需說原因；AI結果是建議／自動回應 | 原catcher決策；沒有manual pitch契約不創造假選擇 | 已公開投球序列、AI傾向 | 捕手原choices A；AI tactical狀態有owner B；新pitch view手動配球C；投手正式曝光延期A（應說明） |
| 賽後與重評 | 個人真實曝光、團隊結果、樣本數、相較前次的任務與限制 | 個人表現≠勝負；角色維持／升降、原因、健康與技術證據分開、下次用途與不保證 | 完成後原outcome繼續；不能動畫完自動關閉閱讀 | 全場gameRecord、成長逐筆、所有權重 | `getHighSchoolRoleReassessmentFeedbackText`、match development presentation A；evaluation owner詳細health score B；部分文字目前有I-02/I-04缺陷，先修實際文案來源 |
| 阿哲／高橋互動 | 已有共享經驗、當前關係的定性狀態、他是否真的在場／有資訊 | 回應具體話題／本場動作；實際關係或旗標變化；「日後可能」與「已發生」分開 | 對話選項及重要閱讀回應 | 完整印象點數、人物歷史 | `highSchoolAzheEcho`／rival context／memories A（原story）；兩場間延遲獨立回應C，屬提案 |
| 保存／讀取 | 是否可存、是否有未完成場上處理；存檔代表已結算哪一步 | 成功／拒絕原因；恢復相同決策與比分、已完成選擇不重加；瞬時結果閱讀能否恢復須誠實 | 需要玩家的正式選擇不可因load被代答 | 歷史摘要、成長帳本 | `saveGame/loadGame`與原notice A；本輪訓練pending閱讀不保存，不以保留動畫位置作承諾 |

## 等待與揭露規則

1. **Gameplay決策等待**：原admission／activeSituation presented與合法choices是權威；newview必須每次提交重讀Bridge，核對matchId、paId、pitchId、situationId、expectedMomentId、routeId及view epoch。雙擊、長按、舊callback、reload後按鈕不得套到新球。
2. **Execution／Reveal等待**：`pending`表示原執行或公開時點尚未到；只沿用原playback。`unsupported`且有原選項應回原UI，不能把它當系統還在計算。UI不得另抽球、重算球數或用consumer.advancePresentation推正式match。
3. **閱讀等待**：原結果的「繼續」只在玩家確認後離開。不得因動畫結束、沒有動畫、視窗切換或速度切換而自動確認。資料若已結算，重繪／重讀不再套效果。
4. **動畫控制**：可調快慢、減少或跳過演出是呈現需求；這不應改變決策等待、正式RNG、紀錄、球數或玩家閱讀時間。這輪沒有實作任何速度選單。
5. **公開邊界**：scoreboard／bases／outs必須來自visible presentation snapshot與公開cursor；不可讀引擎已算完但尚未揭露的後續events。新Bridge的`timeline.coverage.elapsedMilliseconds`為unsupported；無時間資料時不編造倒數或精準秒數。
6. **資訊分層**：必要的是「現在發生什麼、可選什麼、代價、結果為何、接下來能做什麼」。debug IDs、權重、rawreason codes與完整公式可放開發證據，不出現在主要玩家流程。樣本不足、未知與沒有出賽需用正常語言區分。

## 提供畫面工作的最小資料交接

沿用既有資料，不要求新DTO：每個節點記下當前event／公開identity、當下情境字串、合法choices＋tradeoff、已公開結果、角色／能力／健康的可讀變化、原繼續權威。UI整合時每項來源缺失都應清楚fallback，不能以外部文件或預先寫好的demo結果補齊。

以下需求需另立owner投影／設計議題，**本輪不實作**：完整新pitch view觀察cue、careerevaluation健康原因的正式公開文字、非plate決策的完整Public Bridge投影、玩家手動配球、逐球連續幾何與精細時間、獨立跨事件人物追問。對這些缺口的暫行策略是保留原UI／正常文字與未知狀態，不決定新模式或版型。

後續驗收宜使用三個固定資料案例：①選前未知與結果尚未揭露；②個人正向但球隊輸球；③全場未出賽但有下一評估安排。再加動作連點／reload。畫面正確性依同一正式紀錄核對，真人閱讀理解另行驗收；本輪未執行Browser QA。
