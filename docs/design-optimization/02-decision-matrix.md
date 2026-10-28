# 決策與後果矩陣

範圍以高一為主；高二訓練是補充對照。數值是目前定義，尚未扣除上下限、既有 consequence 修正、能力 provenance 等條件。旗標不等於一定有專屬下游。證據與問題編號見 [因果稽核](01-scope-and-causal-audit.md)、[驗證](03-validation-report.md)、[改善清單](06-prioritized-improvements.md)。

## 高一主線與比賽

| 情境／選前資訊 | 選項 | 立即收益 | 代價／風險 | 延遲後果與適用角色 | 目前回饋／品質判斷 |
|---|---|---|---|---|---|
| 報到；學校強度、舊履歷與理想自我 | 接受重置／問最快競爭方法／觀察階級 | 韌性+2紀律+1且宿舍壓力-1／信心+2信任+1曝光+1／觀察+2 IQ+1 | 只有主動爭取明列壓力+1；其他主要是放棄另一種收益 | 情緒／生活管理、爭取信任、理解戰術各有用途；「問」沒有保證出場 | 原 stat feedback；無證據顯示每種報到旗標都有獨立教練記憶【程式確認】 |
| 守位重新評估；過往主守、能力、球隊缺口 | 保留主守參考／開放能力評估／接受一個第二守位 | 信心／責任＋信任／觀察與韌性＋IQ／責任與紀律＋信任、疲勞-1 | 過往守位不保證保留；可能偏離理想自我 | `resolveHighSchoolPositionFormation` 消費不同旗標，影響主守／副守，適用專精或工具人 | 有教練形成理由。應補選前合法性與競爭現況；不能直接宣稱選第三項就比較多出賽 |
| 球場外生活；住宿、課業、負荷 | 固定恢復／承擔團隊／優先表現 | 紀律+2責任+1，恢復+1疲勞-1／團隊關係+2信任+1／信心+1本能+1 | 後兩者分別宿舍壓力+1／課業-1倦怠+1團隊-1；恢復的代價主要是失去其他收益 | 身體可用性、信任、打擊傾向不同；健康不是每個階段都立即進入比賽解算（I-01） | 目前狀態值可取得；需說明哪些會影響暫定角色、哪些只在後評出現 |
| 暫定角色前；教練守位形成理由 | 練主守／串副守跑壘戰術／用打擊開入口 | 類別守備技術+1、信任+1／跑壘+1 IQ+1信任+1／batting+2 | 打擊疲勞+1；工具路線需副守位，否則門檻可能不成立 | `resolveHighSchoolProvisionalRole` 讀該分支工具、能力、信任、健康、既有證據；玩家沒有直接選 starter | 有角色證據。選前應讓玩家知道「工具未達門檻」與「樣本不足」差別，不必公開門檻精算 |
| 首份實戰名單；目前角色、預計任務 | 對手報告／問進場條件／短量熱身 | 觀察+2責任+1 IQ+1信任+1／信心+1紀律+1信任+1／韌性+1責任+1batting+1疲勞-1 | 未定義額外強制代價；都是準備方式的機會成本 | 報告偏戰術、熱身偏打擊與可用性；三種旗標沒有各自改變進場規則，效果主要經能力／trust／角色 | 沒有證據顯示「問清楚」真的多給一份進場條件資訊。屬資訊回饋改善提案，非無效選項 |
| 打席前 approach；分差、跑者、出局、教練指示、對手傾向 | attack／zone／advance 的情境合法變體 | 長打目標／上壘目標／擊球、推進或適時安打目標 | 風險high／low／medium等是粗標籤；推進非保證、兩出局與跑者會改選項 | 使用 batting、IQ、球感／觀察／紀律與情境；不可只按「low」推定最優 | 原 UI 提供 objective／風險／執行文字；new pitch view 不取代這一層 |
| 打席控制權；已有 approach | agencyManual／agencySimulate | 自己逐球處理／沿原引擎模擬該打席 | 操作與閱讀負擔不同；模擬不是必中、manual也非免費加成 | 影響玩家介入次數與決策證據構成；不能把不同介入量的結果直接當單一揮棒策略效果 | 原 UI保留；兩種樣本政策本輪都實際遇到 |
| 逐球；球數、可見球路線索、觀察不確定性 | take／contactSwing／powerSwing，依 legalRoutes | 不揮棒選球／接觸優先／長打嘗試 | take仍可能被判好球；power不保證好球或擊中；不要顯示尚未公開的真實位置 | 正式 PlateDecision → OffensivePlateApproach → 同球物理與 gameRecord；能力直接影響接觸／執行 | G2-B2 UI透過原唯一提交函式；公開觀察與決策品質、執行品質分開。first-legal政策大量take吞三振，不能當理性選球策略 |
| 內野／外野守備；局勢、責任、方向、時間窗口、跑者 | 合法 secure/challenge/contain，或1B/2B/雙殺/持球等 route | 爭取穩定出局／更多出局或推進阻止／控制球與跑者 | 不同路線的接球、傳球、隊友轉傳、跑者推進風險；持球仍可能讓跑者前進 | defense capability＋球／跑者／局勢，經正式 reach／throw／settlement；守位不同不應共用結局 | 原 UI 有路線與粗風險，公開窗口未必足以排最佳。不要用結果反證當時選擇一定錯 |
| 捕手已發生的守備局面；跑者、出局、教練要求 | 既有 catcherIntent 處理、傳壘／本壘或控制局面 | 爭取出局或防止額外推進 | 路線可被 reassessment 調整，能力與sample影響控制／傳球 | `resolveHighSchoolCatcherDecision` 使用 fielding/reaction/decision 等；這不是每球手動暗號配球 | 既有捕手20項完整性測試通過；原UI承接，新pitch view是 fallback【程式確認】 |
| 賽後阿哲電話；真實打席／曝光與共同經驗 | 拆解打席／比較兒時滾地球／先關心阿哲 | 觀察+1信心+1團隊+1／責任+1韌性+1團隊+1／責任+2宿舍壓力-1、阿哲trusts+1 | 無明列直接代價；取得不同成長／關係的機會成本 | 前兩項都加teammateBond，可能跨同一分支門檻；第三項印象也可能跨門檻。echo主要讀累積關係／能力／共同旗標，非目前選項的具體內容 | 不是三個完全相同的處理，但延遲回應細節容易相同。應讓阿哲回應本次話題（設計提案） |
| 第二次實戰後、面向高二 | 工具／上限／健康課業 | IQ+2球探評+1／batting+2曝光+1／紀律+1責任+2、疲勞風險-1、課業+1倦怠-1 | 上限路線疲勞+2風險+1；其餘主要機會成本 | 承接年末與高二，不可倒流影響已完成第二場 | 當時章節／已完成場次應明示，避免「第一次球探評語」舊文字混淆兩次評估 |

## 高二訓練補充比較

依據 `baseball-training-resolver.js:5–57`、`script.js:1887–2028`、`player.js:211–230,300–324`。本輪跑75個正式 owner case，不宣稱高一已有此選單。

| 選項 | 真正成長目標／立即變化 | 負荷 | 延遲用途與風險 |
|---|---|---|---|
| power-hitting 長打 | batting progress；technical/challenging；沒有獨立power技能加成 | 疲勞+2 | batting也影響power capability，但同時影響contact。需要高readiness才可能較appropriate多一點progress；本輪15配對僅1組多1點 |
| contact-control 控制 | 同一batting progress；technical/appropriate；球感+1紀律+1 | 疲勞+1 | 第一次選此項額外教練信任+1及旗標echo；之後也可再練，信任不重複。入門／中段常形成局部優勢（I-03） |
| defensive-footwork 腳步 | reaction progress；recognition/appropriate | 疲勞+1 | 提升反應，不是所有range、catching都直接+1；適合第一步不足者 |
| throwing-basics 傳球 | throwing progress；repetition/appropriate | 疲勞+1 | 不是armStrength直接+1；適合出手與傳球穩定性不足者 |
| recovery 恢復 | 無development context | 疲勞-2 | 不減pain／injuryRisk，也不是醫療復健。疲勞0時沒有數值收益；上限狀態應事前提示，仍保留玩家選擇 |

15組比較的 skill為2/8/14/18/20，current球感／觀察／體能為2/5/8，其餘同fixture。同一來源／種子，兩種choice會生成各自正式 deterministic variation；這是實際選項差異，不是把variation替換成共用常數。高技能18／trait8時長打11、控制10，足以否定「所有狀態控制嚴格支配長打」的宣稱；但大多數狀態的成本與回饋差距需要改善。

## 假選擇、最優解與隱藏懲罰結論

- **已確認差異**：守位旗標、role工具條件、逐球、守備路線確實讀不同輸入／走不同執行；沒有把不同文字一律視為有效，也沒有把相同目標一律視為假選擇。
- **已執行驗證的局部優勢**：高二控制訓練在14/15組進度不低於長打且疲勞少1；同時多特質、一次信任。屬高優先設計風險，不是完整政策最優性證明。
- **有成本但理解不足**：高一健康在角色與賽後評價生效，固定角色下比賽紀錄不變；若玩家只看到賽後承壓，形成隱藏懲罰感。畫面應給真實作用原因，不能虛構健康命中率。
- **未證明**：任一全生涯固定最優解、合理玩家manual與simulate誰較強、powerSwing是否全局優於其他球路策略。本輪first／last只做引擎與選擇敏感性探查；沒有讀球政策、所有情境與長期效用搜索。

## Match UI接線核對

| 能力 | 原正式入口 | 目前新pitch view | 本輪結論 |
|---|---|---|---|
| approach／控制權 | 原choices與 `chooseHighSchoolYearOneMatchMoment` | 不自行重建；回原UI | 有承接，保留原決策階段 |
| 逐球打擊 | PlateDecision legalRoutes → 原唯一提交 | 讀Public Bridge＋核對match/PA/pitch/situation/moment與view epoch | 已由程式確認；G2-B2 171次觀測assertion、G2-A 616次通過；不是本輪真人Browser驗收 |
| 能力影響 | 正式 capability → PA／守備解算 | 沿用原解算，不以UI抽結果 | 有接線；能力profile實驗有輸出差異，不能從差異推出所有能力都已平衡 |
| 投捕配球 | `PitcherCatcherTacticalIntegration` 產生AI建議／自動投手回應，feedback更新序列 | 沒有玩家手動配球view；捕手守備用原UI | 「AI存在」與「玩家可配球」必須分開；完整玩家投手出賽延期 |
| 評價與人物 | completedMoments → 正式settlement → evaluation／角色 | 公開match結果可讀，非完整career評價DTO | 引擎有評價，但新view不是完整教練／關係解釋介面；資訊需求見05 |

不修改CSS、版型、動畫或DTO。後續畫面只需忠實呈現已有資料與缺口；缺少手動投捕功能不能用畫面按鈕假裝已實作。
