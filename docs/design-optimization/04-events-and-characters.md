# 事件與人物連續性

本輪限定高一十個主線事件與兩次實戰；高二訓練、阿哲三分支及既有敘事測試作補充。這不是全遊戲事件普查。主線觸發由 `story.js:1954` 的 `highSchoolStep` 順序，`getEvent:2004` 取事件，`script.js:3879` 驗當前id，`advanceAfterAction:15944` 推進；不是隨機抽事件。

## 現有事件表

| 事件／觸發 | 互斥、重複與冷卻 | 選擇代價 | 已存在的後續 |
|---|---|---|---|
| high_school_intro／step0 | 三選一；離開當前id後過期選項拒絕；無獨立天數cooldown | 壓力或失去其他收益 | 特質／trust／exposure／IQ；學校與舊履歷文字；不是保證上場 |
| high_school_load／step1 | 三種formation旗標互斥於一次選擇；無自行重抽 | 不保證保留理想守位 | `resolveHighSchoolPositionFormation`，主副守位與教練理由保存 |
| high_school_life／step2 | 三選一，章節進度防重播 | 表現優先有課業、倦怠、關係代價；團隊工作有宿舍壓力 | 暫定角色、後續身體／生活摘要；未見本旗標專屬高二追問 |
| high_school_role／step3 | 三準備路線，不是自選角色 | 打擊疲勞+1；其餘機會成本 | 角色門檻分支、信任／健康／過往證據；角色context持久 |
| high_school_long_bench／step4 | 三選一；starter/rotation/bench顯示不同任務 | 熱身對情報／信任的機會成本 | 套用能力後建立同一場機會與match；不是每個選項另有不同進場規則 |
| high_school_showcase／step5 | 每個moment/situation/PA/pitch身份約束；有outcome時先停；match/event/evaluation各自去重 | 決策與執行風險，可能無出賽 | 正式紀錄、成長、評價、下一機會；eventSettlementApplied防整場事件重算 |
| high_school_call_home／step6 | 三話題；echo三種variant依累積證據擇一；同旗標不重複新增 | 不同特質／關係收益的機會成本 | 阿哲echo、rivalContext、年末回收。共同旗標與關係會改分支，非只換人名 |
| high_school_followup_evaluation／step7 | 消費第一場建立的既有decisionId，不重抽；新matchId但沿用同解算 | 可能維持板凳、無樣本、表現差；無保證升級 | 第二筆history與角色重評；同樣本去重；高一輪替要升先發仍欠第三樣本 |
| high_school_role_reassessment_feedback／step8 | 一個確認選項；不自行改角色 | 閱讀／機會成本 | 觀察+1責任+1與接收旗標；敘述角色升降原因與樣本要求 |
| high_school_scout_feedback／step9 | 三高二方向互斥；不能回改已完成比賽 | 上限路線疲勞+2風險+1；其他失去相應收益 | 高一結算／高二壓力；非新球探邀請或自主選先發 |
| 高二training A/B（補充） | roster reset/role test後forcedEvent；slot完成旗標；pending鎖輸入；contact教練echo一次 | 疲勞與訓練時間 | progress／skills／trust保存；同選項第二次slot不再獲coach echo |

`schedulePendingEvent`以id去重、`remainingActions`隨行動減少，`tickPendingEvents`轉forcedEvent（`script.js:1250–1267`）。這是「行動數」機制，不能直接稱天數冷卻。本輪高一主線沒有獨立的阿哲週末待辦事件；文字中的幾天後直接寫進同一echo結果。未查遍全庫所有pending-event組合。

## 人物證據與重複內容

**阿哲【已由程式確認＋已執行驗證】**：`resolveHighSchoolAzheEcho:14266`讀 trusts＋teammateBond－distance、IQ＋observe、理想與三個sharedProof。relationship≥8且capability≥13且有sharedProof → player-guides；relationship≥4或有sharedProof → co-discovery；其餘azhe-guides。三分支都保存variant、evidence、cause/change/recall、旗標，fresh load一致。這是真實持續性；但當次選的是「先關心阿哲」或「拆打席」，分支主要仍看累積門檻，細節可能完全相同。`updateImpression`還會按人格保底某些印象，不能把單次印象+1解讀為一定跨門檻。

**現任高中教練【已由程式確認＋已執行驗證】**：守位／角色／兩次重評持續使用同一player證據。賽後總評主要由strong對failure比較；逐球另外有decisionQuality／executionQuality與coachFeedback。總評字串不修改coachTrust，正式機會由重評owner建立。問題是未出賽也套mixed評語，以及差表現一律寫「不是沒看懂、動作慢一步」，會把判斷錯誤說成純執行問題。

**高橋【已由程式確認＋已執行驗證】**：`prepareHighSchoolRivalPressure:14305`只讀canonical role，starter/direct、rotation/limited、bench/observed；固定聲稱第七局選擇或同場打席，沒有依actual exposure與實際moment取證。rivalContext與兩個flag被保存，年末摘要會回收；沒有查到高二壓力旗標直接改變出場權重。這個人物應提供外部同世代標準，不能成為隊內名單權威。

**敘事重複【已由程式確認】**：教練mixed/failure與下一輪接傳建議在不同守位／決策下重用；阿哲兩個話題都加teammateBond+1、共用echo；高橋三入口的後續yearTwoPressure相同。回饋可以共用模板，但具體動作、是否出賽、判斷／執行失敗的原因必須一致。

## 小量代表事件深化提案（以下全部尚未實作）

| 代表情境 | 最小前因證據 | 本次回應提案 | 下一次承接提案 | 代價與驗收 |
|---|---|---|---|---|
| 阿哲：玩家打得好但輸球 | 已完成match.id、真實moment／line、個人正向quality、teamResult落敗、sharedProof | 讓他提一個真實動作：「你放過邊角後把下一球打進場內，這件事不會因輸球消失」；沒有該動作時不用此句 | 在第二次評估後，回問該用途是否重複。先比較兩場證據；無第二樣本就說尚未確認 | 不加免費能力／機會。一次matchId只回應一次；存讀後不重觸。引用哪個動作需owner確認，不從比分反推 |
| 阿哲：本次先問他的生活 | choice第三項＋既有characterArc／echo | 先回他的地方球隊／是否仍在棒球，而後才談玩家；已有共同經歷才具名回憶 | 使用既有flags／memories／pendingEvents留一個可回應節點；行動數到期不自稱真實週末已過 | 保留現有關係效果，專屬延遲效果另行審查。低關係不免費給高信任支援；缺共同證據不用共同滾地球 |
| 教練：贏球但判斷差 | completedMoment.decisionQuality低、executionQuality高，team勝 | 說明「球隊贏了，但當時的路線讓前位跑者多走一壘」等真正已發生後果；不說一定只是動作慢 | 下一次任務指出同類情境的改善要求；角色仍由正式evaluation解算 | 首先只修文字，不改任何評分。反例：合理決策但隊友傳球失誤，不責怪玩家判斷 |
| 教練：未出賽 | finalized exposure.noAppearance／0PA／0守備 | 「本場沒有正式執行樣本；準備與身體狀態另行評估」，不稱處理過幾顆球 | 說清楚下一次是等待名額、能力差距還是健康限制；不保證上場 | 重評及門檻不變，無假成長；無樣本不說比賽表現退步 |
| 高橋：真有共同對局 | 名單中存在確定對手identity，或已有正式遭遇context；實際moment、當時局數 | 提一個已發生的打席／路線，區分尊重與競爭；不固定第七局 | 第二次機會後以「能否重複」比較，別把信任直接兌成先發 | 不讀未公開球路、不補未選反事實。對手不在同場時改為看紀錄／外部標準，不能虛構對話 |
| 高橋：板凳／投手延期 | actual exposure為noAppearance | 提供外部參照與尚無直接樣本的事實，保留觀察入口 | 等第一次真實樣本再解鎖具體評語；不是先虛構第七局再回收 | 不新增投手引擎；留在既有角色與framework |

提案若需要延遲記憶，優先評估既有flags、memories與pendingEvents，使用同一player／match identity；新增schema或獨立NPC owner均不在本輪。先做兩個對照事件足夠：未出賽、個人正向但輸球。驗收同時核對文字、引用的真實證據及重複觸發，不只看句子是否好讀。
