# 驗證方法、結果與限制

設計目標先行：選擇應改變任務／表現或付出可理解的成本；健康限制應在正確階段作用；個人判斷與執行不能被球隊勝負取代；正式證據需要進入下一機會；存讀、重繪與重複結算不應重加效果。沒有要求所有策略同勝率，也沒有把腳本完成等同遊戲設計達標。

## 執行方式與可重現條件

工作區根目錄使用目前安裝的Node，沒有安裝套件。新增腳本都只在本資料夾寫證據，原遊戲程式與測試期望不改。

```powershell
node docs/design-optimization/verify-gameplay.cjs
node docs/design-optimization/summarize.cjs
node docs/design-optimization/verify-edges.cjs
```

`verify-gameplay`預設16個seed，可用 `DESIGN_AUDIT_SAMPLE` 改樣本數；其輸出為本輪文件，重跑會覆蓋這個資料夾內同名結果。需要保留另一次實驗時先複製結果至不同位置。兩個既有測試runner使用exclusive-create，不會覆寫舊證據：

```powershell
node docs/design-optimization/run-existing.cjs
node docs/design-optimization/run-custom-checks.cjs
```

重跑上述runner需在新的交付目錄／另行更名輸出執行；不要刪除本輪證據來製造新的PASS。`capture.cjs before`也是exclusive-create；`after`用於結束時保存核對。

正式引擎從既有 `makeContext()` 依index載入；未載入ApplicationController，不測真實DOM或鍵盤。沿既有 `prepareHighSchoolYearOneMatch`、`advanceHighSchoolMatchPlaybackStep`、`chooseHighSchoolYearOneMatchMoment`、Save與各owner。每場完成檢查 `MatchGameRecord.assertIntegrity` 與 `assertHighSchoolMatchStateIntegrity`；沒有另寫簡化比賽模型。

固定fixture：ordinary高中入口、固定選校seed `design-audit-44001`、SS／2B副守；通常技能8、球感／觀察／體能／本能／紀律8、教練信任8。這是控制變因的能力fixture，**不是自然創角人口分布**。指定canonical role用於隔離比較；另有獨立實際事件流程計算角色。

112場cohort：seed **45000–45015** × 7 arms。同一seed使用相同初始狀態，只改指定身體／能力／角色／選擇政策。`pendingHighSchoolMatchSimulationSeed`是既有測試入口；選擇的 `randomSource` 與VM `Math.random`用固定LCG。正式引擎自己的PA identity、pitch identity／deterministic RNG仍保留。因不同決策改變事件與draw次數，共同亂數串不代表後續每個事件仍使用同一個draw。

學校與opportunity identity在cohort固定，改的是match seed；因此16場不能當16個獨立選校／出場機會抽樣。角色比較只是同一機會條件下的曝光差異，非各角色整體人口出場率。

## 實際結果

7組流程檢查均完成；這表示asserted invariants通過，不表示觀察到的設計缺口通過驗收。詳見 [完整JSON](gameplay-results.json)、[摘要](gameplay-summary.json)。

| 情境 | 已執行結果 | 解讀 |
|---|---|---|
| 單場smoke | seed44001，154次loop、17次決策、正式完整性通過 | 有安全可用的無畫面正式入口 |
| 同能力健康 vs 高負荷 | 16/16 pairs官方record hash完全相同；均64PA、7H、49SO、3BB；平均7局守備 | body=(0,0,0)對(疲勞16,pain8,risk12)，固定角色後表現沒有承接健康；不表示全遊戲不讀健康 |
| 健康影響重評 | average score -2.6021對-3.4981，差-0.896；moment quality相同 | 實際代價在trainingEvidence健康扣分；原因需能被玩家理解 |
| 強但高負荷 vs 普通健康 | skill16 loaded：10/64，AVG .1563；skill6 healthy：7/61，AVG .1148；兩者均49SO | first政策多take，壓低能力差異；只證明這組實際輸出，不能推出強者應必勝或精確健康抵換率 |
| starter vs rotation vs bench | starter與rotation在此條件都start，均64PA、平均7局；bench24PA、平均1.625局；全部16場都有出賽 | canonical role是安排先驗，非絕對名單；高能力輪替可先發是設計允許。沒有覆蓋所有機會identity |
| first vs last合法選項 | first：7/61 AVG .1148、49SO；last：28/60 AVG .4667、11SO、6BB | first大量take；last混合advance/powerSwing/contain/agencySimulate。這是敏感性對照，不是策略平衡或最佳策略證明 |
| 個人好但輸球 | seed45000 last，終場0:14落敗，quality2.070、sampleScore2.364，教練正評 | 球隊輸球沒有抹掉個人證據 |
| 球隊贏但個人差 | seed45011 strong-loaded，3:1獲勝，quality-3.612、sampleScore-3.724，教練負評 | 不因勝利無條件獎勵個人 |
| 決策前save/load | seed46001，原 `saveGame/loadGame`；最終record／evaluation／nextOpportunity一致 | 外部注入RNGstate明確還原，不宣稱Production存檔有保存Math.random狀態 |
| 重複結算 | 重呼settle回false；重評回duplicate；evaluation／opportunity history／development／skills／next不變 | 去重有效，不是調整期望值掩蓋失敗 |
| 完整高一年流程 | 十個主線事件、兩場正式引擎比賽、兩筆不同identity history，抵達「青棒第一年小結」 | 從高中入口fixture開始；沒有手填比賽結果；過期intro choice無效果 |
| 受傷／恢復邊界 | fixed starter plan在嚴重負荷下仍start； provisional重新評估為bench，恢復後變rotation；既有opportunity保持不變 | 驗證健康值與重新取得資格的邊界，沒有完整醫療／時間性傷癒模擬。改已承諾機會需尊重identity與防重抽設計 |

cohort勝場：健康0/16、負荷0/16、強負荷1/16、普通健康0/16、輪替0/16、板凳0/16、last0/16。固定敵我名單、16seeds與天真政策不足以判斷全遊戲球隊強弱平衡。摘要保留descriptive Wilson區間（例如0/16約0–19.4%，1/16約1.1–28.3%）；因PA identities與固定名單相關，**不當作母體推論或策略顯著性證據**。

## 補充與負例

[edge-results.json](edge-results.json) 的5組探查全部完成，status為EXECUTED，將「觀察到問題」與「檢查未能執行」分開。

- **75個訓練case**：5種skill × 3種current trait配置 × 5選項。全部由正式training／Development owner套用；沒有NaN或應用拒絕。15個長打／控制pair有14個控制progress≥長打，另有較低fatigue及特質／一次信任。skill18/trait8是例外：11對10。不是無條件支配證明。
- **自然無出賽**：投手正式opportunity deferred，完整比賽無player moment。summary如實說沒有出賽，但coach說「有幾球你看對了」，rival說「第七局做出的選擇」；角色same卻呈現由同角色調整到同角色。這是確定缺陷。
- **一般事件存讀**：intro choice後fresh VM load回load事件，flags/body/memories/步驟一致，無重加。該事件沒有pending outcome，本輪沒有宣稱遺失結果畫面。
- **訓練結果存讀**：重複按訓練無效果；同VM與fresh VM load進下一角色測試，progress／trust保存。pending結果閱讀狀態不保存；`showCurrentEvent`會清空它，符合既有將保存點視為已結算狀態的方式，屬閱讀取捨，不是數值遺失。
- **阿哲連續性**：bond0無共同旗標 → azhe-guides；bond4 → co-discovery；bond8＋共同旗標 → player-guides。三者fresh load一致，重呼不重複新增旗標。沒有驗證完整電話三選項的所有長期角色組合。
- **owner受控對照，非自然比賽**：保持相同個人證據，僅交換team勝負，strong score皆2.380、poor皆-2.273、未出賽中性readiness皆0。這6筆只驗評價owner，不與自然勝負實例混算。

## 既有測試基線與本輪問題分離

23套原測試以main入口執行，既有preload只觀測assertion，gitCompatibility=false、沒有source substitution／改斷言／提高buffer。初跑16 PASS、7 UNVERIFIED；對其中三套自訂checker使用既有V8 coverage再驗，最終 **19套有觀測證據通過、3套exit0但未完整觀測、1套timeout**。沒有已確認的原測試assertion FAIL。

| 套件（tests/） | 有觀測證據／結果 |
|---|---|
| development-training-result-foundation-v1 | 自訂verify 46；補驗PASS |
| playing-time-game-exposure-foundation-v1 | Node assertion 53；PASS |
| match-experience-development-foundation-v1 | 46；PASS |
| high-school-year-one-competition-loop | 28；PASS |
| high-school-year-one-opportunity-two-integration | 40；PASS |
| high-school-year-transition-continuity | 44；PASS |
| high-school-opportunity-exposure-bias-repair-production-integration | 152；PASS |
| high-school-relationship-recency-production-integration | 160；PASS |
| high-school-relationship-temporal-authority-production-integration | 133；PASS |
| plate-decision-production-integration | 15；PASS |
| pitcher-catcher-tactical-integration | 34；PASS |
| catcher-choice-outcome-integrity-v1 | 20；PASS |
| g2-b2-playable-match-decision | 171；PASS |
| g2-a-live-public-match-bridge | 616；PASS |
| coach-response-expansion | 10；PASS |
| event-continuity-pass | 自訂test 10組；補驗PASS |
| high-school-three-year-spine | 自訂verify 54；補驗PASS；包含舊fixture，不當作全高中自然流程證明 |
| high-school-entry-roster-integration | 33；PASS |
| high-school-position-code-normalization | 7；PASS |
| azhe-storyboard／takahashi-storyboard／relationship-payoff | 正確main、exit0、有原自訂throw檢查；缺本runner可信checker觀測，保留UNVERIFIED，非失敗或完整PASS |
| g2-b1-natural-mixed-match-continuity | 60,032ms達本輪每套60秒上限被終止，無完整witness；UNVERIFIED。未擅自提高timeout或修改suite，亦不引用舊9/9為本輪PASS |

raw輸出／命令／assertion witness在 `existing-tests/`；初跑紀錄不回寫成補驗結論，三套補驗另列 `custom-test-results.json`。

**本輪工具錯誤**：首次script用了不存在的 `assertHighSchoolMatchIntegrity`，4組在結尾檢查處ReferenceError。已改用現行 `assertHighSchoolMatchStateIntegrity`，完整重跑取得本輪結果；初次輸出保留 `harness-initial-error.json`。這是驗證腳本錯誤，不是遊戲bug。初次capture的PowerShell inline Node quoting亦失敗，改為獨立cjs後才成功，沒有產出假基線。

## 未完成的驗證與不確定性

未跑全repository suite、Browser視覺／鍵盤、保存所有歷史版本、長期健康／診療機制、所有九守位自然守備全覆蓋、所有choice交叉／事件冷卻、整個高中三年與成年人路線、所有關係資源兌現。未執行者均不標通過。局部timeout與工具缺口沒有阻止其餘分析；沒有將fixture、舊文件或純owner輸入假稱自然遊戲流程。
