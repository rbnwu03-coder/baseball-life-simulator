# 高一健康機會切片：人工頁面驗收交接

狀態：**待人工驗收，所有以下勾選項目前均未執行。** 自動化在受支援瀏覽器連線檢查即遇到 host unavailable，沒有重新嘗試前輪被 URL 政策停止的桌面後備。

待驗程式固定為 integration 分支的 `ca3be7e6a537ae91f9bb1c8b8ae093fd0445a84f`；本輪之後的提交只更新文件，不改程式。既有 worktree 為 `%TEMP%\baseball-y1-health-integration-2026-10-29`，script SHA-256 應為 `af4e71229c6456ccd593f2ee0c7d3415877cefec10da53348bd2706bbc7b367a`。

請用本機測試 origin／獨立測試環境開啟該 worktree 的 index.html，保留既有正式存檔。從既有「開發測試書籤 → 青棒第一年」開始；不使用「高中篇測試開始」或「完整比賽」Direct Start。所有推進均操作頁面實際按鈕，不在 Console 呼叫 choose、advance、prepare、showCurrentEvent 或改寫 Player／RNG。

## 實際操作與取證表

| 待驗步驟 | 必要觀察／證據 | 人工結果 |
|---|---|---|
| 一般高中書籤入口 | 畫面為青棒第一年起點，direct_start_history=false；記錄守位與起始 body | 待驗 |
| 前期選擇 → 首次名單確認 | 按頁面原選項；確認後記下 matchId、decisionId、opportunitySeed、hash／variation、plannedUsage 與 simulationSeed；截圖名單／用途 | 待驗 |
| 第一場 | 自動播放能推進；合法決策時會停等；實際決策／繼續按鈕及終場可操作；截圖決策停等與終場 | 待驗 |
| 電話前 Save/Load | 在正式電話選項前按「儲存」、再按「讀取」；仍在電話前，原首場紀錄與 N+1 preview 未改；截圖讀取成功及電話畫面 | 待驗 |
| 阿哲電話 → N+1 | 只點一次電話選項，記錄選項；正常進入第二場，數值／關係／印象／記憶／flags 符合一次收益；用途文字符合已鎖定 opportunity | 待驗 |
| N+1 確認後 Save/Load | 在實際可合法儲存的正式停等位置操作「儲存／讀取」，比較同場 identity、snapshot、plannedUsage 與 simulationSeed；截圖讀取前後 | 待驗 |
| 重繪／重新整理 | 保存後可用頁面重新整理，再按實際「讀取」；同場 identity／鎖定用途／seed 不重抽。其他重繪僅由既有 UI 觸發 | 待驗 |
| 第二場 → 年末 | 用實際按鈕完成決策、繼續、終場、角色回饋與年末；安排文字與鎖定 snapshot 一致，記錄實際曝光／正式紀錄 | 待驗 |
| Console／資源 | 保存可取得的本機頁面 Console error／unhandled rejection 及必要 script／stylesheet 載入失敗證據；沒有觀察資料不能填零錯誤 | 待驗 |

若某場沒有玩家決策或實際出場，記錄 noAppearance／缺情境證據，不強制先發、不手填 PA，不以全自動略過替代決策停等項目通過。若存檔操作被原流程拒絕，保存訊息與當時位置，不發明同步 resolver 中的暫停點。

## 唯讀狀態快照

以下僅供人工在上述節點讀取；不推進、不修復資料，也不設定亂數。先另存各節點的輸出，再比較，不要用現在 body 冒充舊 snapshot 的原始健康輸入。

```javascript
JSON.stringify({
  chapter: player.chapter,
  step: player.highSchoolStep,
  directStart: player.flags.includes("direct_start_history"),
  body: player.body,
  choiceEvidence: {
    observe: player.observe, confidence: player.confidence,
    responsibility: player.responsibility, resilience: player.resilience,
    dormStress: player.dormStress, relationships: player.relationships,
    impression: player.impression, memories: player.memories, flags: player.flags
  },
  match: {
    id: player.highSchoolMatch?.id,
    simulationSeed: player.highSchoolMatch?.simulationSeed,
    phase: player.highSchoolMatch?.simulationPhase,
    completed: player.highSchoolMatch?.completed,
    assignment: player.highSchoolMatch?.assignment,
    exposure: player.highSchoolMatch?.gameExposureState,
    record: player.highSchoolMatch?.gameRecord
  },
  next: player.highSchoolNextOpportunity,
  roleContext: player.highSchoolRoleContext,
  opportunities: player.highSchoolOpportunityHistory,
  matches: player.highSchoolYearOneMatchHistory,
  evaluation: player.highSchoolCompetitionEvaluation,
  yearEnd: player.highSchoolDetail
}, null, 2)
```

電話前的 N+1 尚未建賽時，不能聲稱已有第二場 simulationSeed；確認後才比較實際第二場 seed。此唯讀輸出不能代替按鈕操作、畫面截圖或 Console／Network 證據。

所有表列步驟與關鍵證據完成後，才能補寫人工結果與限定 PASS；目前保留 BLOCKED，暫不指定本切片開發基線。舊 7／15／16／12 證據仍僅引用，不是本次頁面通過，也不代表原 15 個 Browser 項目、全專案或健康平衡完成。
