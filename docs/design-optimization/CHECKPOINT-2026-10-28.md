# Git checkpoint — 2026-10-28

## 基線與目的

- 專案：[`rbnwu03-coder/baseball-life-simulator`](https://github.com/rbnwu03-coder/baseball-life-simulator)，既有 remote `origin`；原 upstream 為 `origin/accepted-gameplay-g2-b2-v0.1`。
- 開工分支：`accepted-gameplay-g2-b2-v0.1`。
- 開工 HEAD：`0d3ed173952b9b8e5d5842a73761f649b50be594`。checkpoint 分支由此 HEAD 建立；沒有切回其他提交或改寫歷史。
- Git 身分沿用既有設定。推送後的分支名稱與 commit SHA 以本文件的更新結果為準。
- 開工工作樹有 7 個已追蹤修改與 1,569 個未追蹤檔案。以目前工作樹製作 checkpoint，未清除原檔。

## 保存範圍

- Match UI：既有 `match-pitch-decision-ui.js`、CSS、必要正式模組、`contracts/`、`assets/` 及 `prototype/` 內容。新增的正式依賴和 UI 工作所需路徑均納入。
- 敘事修補：`script.js`、`story.js` 的既有工作，以及比賽回饋事實性、legacy 資料邊界與人物文字修補報告及其報告引用的證據。
- 測試與驗證：目前修改中的測試、fixtures、驗證入口與直接由報告引用的 baseline／結果／witness。沒有把驗證 JSON 全面忽略。
- 設計與交付文件：本目錄的 01–09 稽核與收尾文件、README 索引，以及工作樹中其他文件及其直接引用的必要證據。
- `.gitignore` 僅新增依賴快取、Python 快取、環境憑證、金鑰與本機私有存檔規則；JSON、測試資料、fixtures、報告和驗證結果仍可提交。

### 留在本機的中間輸出

以下 10 個較大的 JSON 未被文件引用，屬重複快照或中間候選重播輸出；原檔留在工作樹，未刪除。checkpoint 索引與報告引用的必要證據均在版本控制中。

| 本機保留路徑 | 大小 | 原因 |
|---|---:|---|
| `docs/design-optimization/feedback-repair-v1/after-acceptance.json` | 5.5 MB | 未被報告引用的重複結果快照 |
| `docs/design-optimization/feedback-repair-v1/after.json` | 5.5 MB | 未被報告引用的中間結果 |
| `docs/design-optimization/feedback-repair-v1/before-acceptance.json` | 5.5 MB | 未被報告引用的重複基線快照 |
| `docs/design-optimization/feedback-repair-v1/before-final.json` | 5.5 MB | 未被報告引用的中間基線快照 |
| `docs/design-optimization/legacy-feedback-v1/original-14-acceptance.json` | 5.5 MB | 未被報告引用的重複結果快照 |
| `docs/design-optimization/legacy-feedback-v1/original-14-final.json` | 5.5 MB | 未被報告引用的重複結果快照 |
| `docs/design-optimization/legacy-feedback-v1/original-14-initial.json` | 5.5 MB | 未被報告引用的中間結果 |
| `docs/ss-reach-access-rejection-proof-v0.1-candidate-replay-facts-evidence.json` | 9.7 MB | 與已保留 candidate-first-facts 內容相同的未引用重播輸出 |
| `docs/ss-reachable-controlled-scenario-v0.1-candidate-replay-facts-evidence.json` | 28.8 MB | 與已保留 candidate-first-facts 內容相同的未引用重播輸出 |
| `docs/ss-strategic-scenario-fixture-pa-ledger-integration-v0.1-candidate-replay-facts-evidence.json` | 45.2 MB | 與已保留 candidate-first-facts 內容相同的未引用重播輸出 |

**未提交本機輸出合計：10 檔，約 122.3 MB。** 沒有其他檔案因副檔名為 JSON 而排除。`node_modules/` 及新增的本機憑證、快取、私人存檔忽略規則不影響既有測試 fixtures。

## 測試狀態與限制

本次 checkpoint 整理沒有修改 Production 或測試程式，也沒有重新執行遊戲測試；下列結果引用最近一次的實際執行報告，不視為本次重跑。

- [`09-test-closeout.md`](09-test-closeout.md)：`high-school-integration-1-1-test.js` **16/16 PASS**，`high-school-year-two-competition-loop-test.js` **37/37 PASS**；報告記錄均正常完成、沒有逾時。包含兩項測試先前失敗的原始證據與修補後完整結果。
- [`08-legacy-feedback-boundaries.md`](08-legacy-feedback-boundaries.md)：新增 legacy 語意回歸 **15/15 PASS**，原 14 項回歸 **14/14 PASS**。這兩套在 09 的最近一次收尾中只核對保存，沒有重跑。
- [`07-feedback-repair.md`](07-feedback-repair.md) 記錄其時 14 項事實性回歸及固定狀態前後不變檢查的結果；不是本次 checkpoint 的新執行。
- 09 記錄的命令：`node docs/design-optimization/test-closeout-v1/run.cjs before`（重現原兩項 FAIL）；`node docs/design-optimization/test-closeout-v1/run.cjs final --coverage`（兩套完整 PASS）；兩個受影響測試檔的 `node --check` 與對應 `git diff --check` 均通過。08 所列新增 15 項及原 14 項命令及輸出檔留在其報告與 `legacy-feedback-v1/`。
- 09 的兩個歷史 FAIL 已在後續收尾中修復並通過。沒有執行全 repository 回歸、Browser／真人操作、高三與成人摘要完整驗收，也沒有在本輪重跑 14／15 項回歸。更早設計稽核所記的 G2-B1 長跑逾時未在本輪重試。
- 待辦仍包括高三／成人摘要邊界與健康／訓練系統的另案設計審查；本次沒有擴大玩法或敘事修改。

## 暫存與保存核對

- 暫存清單明確包含 **1,568 個路徑**（約 531 MiB）；另外 10 個本機中間輸出未暫存。最大檔案為 `docs/match-vnext-sprint-2-outcome-coverage-v0.1-evidence.json`，57.5 MiB；暫存檔案沒有單檔超過 100 MiB。
- 暫存前後對工作樹中 **1,578 個變更／新增路徑**比較 SHA-256，內容差異為 0。這確認版本整理與暫存沒有改寫原始碼、素材、測試或既有證據。
- 全體 `git diff --cached --check` 已執行，回報 125 項、涉及 81 個檔案：76 處尾端空白及 49 個檔尾空白行。這些出現在原有報告的 Markdown 硬換行及證據／腳本輸出，不是本輪新增的內容改寫；為保留原檔而未格式化。Production、Match UI、既有修改測試、本 checkpoint 與索引的範圍檢查為 exit 0。
- 沒有修改 Git 全域設定、使用者身分或既有 commit；提交前另檢查暫存路徑、體積與新增依賴模組。

## 完成後 Git 確認

- checkpoint 分支：`checkpoint/narrative-feedback-2026-10-28`（若遠端或本機原有同名分支，使用實際選定的唯一後綴）。
- 開工時本機及既有 remote 均未有上述同名分支；新分支以開工 HEAD 為父提交，推送結果由該 remote ref 核對。
- commit SHA 由 Git ref 唯一識別，並於本輪交付訊息回報完整值。
- 暫存清單使用明確路徑；提交前執行 `git diff --cached --check`，並檢查暫存差異與大檔。除本文件、README 索引與 `.gitignore` 外，不因 checkpoint 整理改寫原始碼、素材、測試、既有報告或證據。
