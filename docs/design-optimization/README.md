# 《棒球人生》設計優化與驗證 — 2026-10-28

## 開工版本與範圍紀錄

- 分支：`accepted-gameplay-g2-b2-v0.1`；HEAD：`0d3ed173952b9b8e5d5842a73761f649b50be594`。
- 採目前工作樹為驗證對象；HEAD 不是完整工作樹的替代。開工已有 `match-pitch-decision-ui.js`、同名 CSS、`tests/fast-check-smoke-test.cjs` 修改，以及大量未追蹤成果，全部保留。
- 入口：`index.html` → classic scripts → `ApplicationController`／`script.js`；無畫面驗證沿用 `tests/high-school-career-test-context.js` 的 VM 與既有正式引擎函式。Node v24.19.0，既有 devDependency fast-check，未新增依賴。
- 指令基線：使用者提供的 AGENTS.md 要求結構探索使用 codebase-memory。已讀取安裝 skill；此 session 沒有 `list_projects`／`index_status`／`check_index_coverage` 等圖譜工具，因此採 skill 的 source read／rg fallback，不宣稱圖譜完整性。
- 設計基線：最新已提交 G2-B2 的原公開提交／G2-A Bridge 與既有高中生涯系統。舊報告的 PASS、附件排程與 prototype 計畫均不視為本輪已實作或已重跑。
- 優先範圍：高中第一年訓練、定位、秋季正式比賽、賽後競爭重評及下一次機會；將實際可走入口、fixture 與跨年邊界分別記錄。保留 Production、Match Engine、Career Spine、NPC、Save 與 DTO；不改畫面或核心行為。

標記：**已由程式確認**／**已執行驗證**／**設計提案**／**尚待確認**。程式存在、檢查成功、設計達標是三件不同的事；驗證腳本的 PASS 不代表所有被觀察的玩法符合目標。

## 交付索引

1. [版本、實際範圍與系統因果鏈](01-scope-and-causal-audit.md)
2. [決策與後果矩陣](02-decision-matrix.md)
3. [驗證方法、實際結果與限制](03-validation-report.md)
4. [事件與人物連續性提案](04-events-and-characters.md)
5. [畫面資訊需求](05-information-requirements.md)
6. [依優先順序排列的改善清單與驗收](06-prioritized-improvements.md)

### 後續修補與版本保存

- [比賽回饋事實性修補](07-feedback-repair.md)
- [舊資料邊界與敘事收尾](08-legacy-feedback-boundaries.md)
- [兩項測試收尾](09-test-closeout.md)
- [Git checkpoint — 2026-10-28](CHECKPOINT-2026-10-28.md)

原始證據：[版本快照](baseline.json)、[遊戲驗證完整資料](gameplay-results.json)、[配對摘要](gameplay-summary.json)、[訓練／敘事／存讀檔邊界](edge-results.json)、[既有測試](existing-test-results.json)、[自訂 checker 補驗](custom-test-results.json)、[既有檔案保存核對](preservation.json)。`existing-tests/` 保留逐套輸出及 assertion witness。首次驗證腳本的函式名稱錯誤另外保存於 `harness-initial-error.json`，沒有算成遊戲缺陷。

## 主要發現

- 高一存在完整的兩次實戰年循環。本輪實際走通十個主線事件、兩場正式引擎比賽和年末小結；從高中入口 fixture 起跑，沒有宣稱從創角跑完整個童年。
- 同角色與能力下，健康和嚴重負荷兩組 **16/16 對官方比賽紀錄相同**，健康代價出現在後段評價。高一沒有把動態健康傳入機會解算；這是已確認的接線缺口，是否改變比賽能力仍屬設計提案。
- 未出賽仍得到「有幾球你看對了」與「第七局做出的選擇」等回饋；角色未變卻寫「由先發調整為先發」。這些是確定的敘事／狀態說明缺陷。
- 高二補充稽核中，長打與擊球控制都成長 batting；15 組配對有 14 組控制的進度不低於長打，且負荷較低、另有特質與一次教練信任。這是選項差異不足的強訊號，沒有證明全域固定最優解。

本輪新增內容限於此資料夾；沒有修改 Production、原測試期望、畫面、DTO、依賴或 Git 歷史。下一輪建議先以最小敘事修補處理「未出賽與角色未變」兩種情境，再分開審查高一健康輸入的核心行為提案。

- [高一健康機會刷新候選與舊資料邊界收尾](12-high-school-health-opportunity-candidate.md)

- [高一健康機會限定整合驗收（頁面 BLOCKED）](13-y1-health-integration-acceptance.md)
