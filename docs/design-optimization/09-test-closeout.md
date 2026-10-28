# 兩項測試收尾 — 2026-10-28

**完成：integration-1-1原16項全部通過；高二原37項全部通過。僅修改兩個測試，Production維持開工bytes。**

基線仍為 `accepted-gameplay-g2-b2-v0.1`／`0d3ed173952b9b8e5d5842a73761f649b50be594`。保留既有工作樹、前兩輪FAIL證據、原14項及新增15項測試。本輪使用codebase-memory skill的限定source fallback；圖譜工具未提供，不作圖譜完整性宣告。

## integration-1-1載入缺漏

正式`index.html`在`offensive-plate-approach.js`與`script.js`前，依序載入：

| 正式模組 | 此路徑所需依賴／用途 |
|---|---|
| `batted-ball-physical.js` | 自足的球體物理與deterministicUnit API；原三振接捕路徑直接使用 |
| `batted-ball-outcome-mapping.js` | 依賴Physical；啟用實體場內擊球後，OffensivePlateApproach要求此正式mapping |
| `defensive-opportunity-foundation.js` | 依賴Physical及已載入的TeamRosterFoundation |
| `defensive-reach-secure-foundation.js` | 依賴Physical與DefensiveOpportunityFoundation；提供正式resolveThirdStrikeCatch |

舊 [integration測試](../../tests/high-school-integration-1-1-test.js) 的硬編manifest缺少以上模組。只補Physical仍不足以閉合路徑；補入其守備依賴後，實際後續執行又指出Physical BIP需要OutcomeMapping，因此最終補齊四個正式模組，順序與正式入口相同。原TeamRosterFoundation已在前方，不重排其他檔案。

沒有替代解算器、模組假物件或跳過斷言，未改共用loader。比對開工快照，去除manifest區段後，整個原測試內容完全相同。

除了原第10項及第11–16項全部完成，額外以V8 coverage唯讀觀察先前中止位置：`resolveHighSchoolThirdStrikeCatch`被呼叫3次；其中Physical sample與正式接捕呼叫所在區段實際執行1次，`DefensiveReachSecureFoundation.resolveThirdStrikeCatch`也實際執行1次。這不是只驗證API存在或繞過原失敗行。

## 高二第36項契約

[高二測試](../../tests/high-school-year-two-competition-loop-test.js) 原第36項硬性要求「沒有虛構正式投球局數」，與已接受的玩家文字清理衝突。本輪按授權同步該項，其他檢查保留，原第35及第37項內容不變。

| 原契約 | 新語意契約 |
|---|---|
| 不顯示raw `pitcher`；包含固定延期句及已移除的驗證用語 | 春／秋仍deferred；結算後均noAppearance、0PA、0守備局數；文字表達延期與等待安排，且不恢復驗證用語／raw `pitcher` |
| 只以摘要字串表示沒有正式投球證明 | 摘要生成前後，比較兩場正式Game Record、實際曝光、contribution、近期／球季表現、career曝光／球探值、評價、history、Development與能力，全部deep equal |

為使正式record檢查不只是`null === null`，該測試自己的manifest另載入專案正式`match-game-record.js`，位於player之前，與正式入口的相對順序一致。第36項確認兩場record均有正式VERSION，沒有球員投球數據；前後快照分別JSON detach，避免同一物件別名造成假不變。使用既有completion fixture及正式owner，沒有另寫投球模擬。

玩家文字仍為「投手使用仍延後處理；下一次正式出賽的安排，仍要等教練確認。」測試同時要求正向的延期／等待語意、結構化資料不變及零曝光，不是只驗證不包含舊句子。

## 實際執行結果

| 套件 | 開工重現 | 本輪最終完整執行 |
|---|---|---|
| high-school-integration-1-1 | 原9項後FAIL：BattedBallPhysical缺載 | **16/16 PASS**；觀測16次成功Node assertion；第10及後續11–16均完成 |
| high-school-year-two-competition-loop | 原35項後FAIL於第36項舊字串；觀測37次成功assertion | **37/37 PASS**；觀測54次成功Node assertion，含第36項新增資料檢查；第37項與末尾summary／正常退出均完成 |

兩套皆以原main入口執行、exit0、source在執行期間穩定；沿用既有entry-safe preload觀測assertion，沒有改assert參數、回傳或Git相容設定。integration另啟用Node原生V8 coverage，未包裝或替換正式解算函式。

實際命令（workspace根目錄）：

```powershell
# 開工兩項FAIL重現，預期exit 1；證據另存本輪目錄
node docs/design-optimization/test-closeout-v1/run.cjs before

# 最終兩套完整執行，exit 0
node docs/design-optimization/test-closeout-v1/run.cjs final --coverage

node --check tests/high-school-integration-1-1-test.js
node --check tests/high-school-year-two-competition-loop-test.js
git diff --check -- tests/high-school-integration-1-1-test.js tests/high-school-year-two-competition-loop-test.js
node docs/design-optimization/test-closeout-v1/capture.cjs after
node docs/design-optimization/test-closeout-v1/summarize.cjs
```

`run.cjs`實際執行 `node --require tests/entry-safe-preload.cjs tests/<suite>`，每套60秒上限；本輪無逾時。輸出exclusive-create，重跑應換phase名稱，不能覆寫舊證據。

證據：[彙總與模組順序](test-closeout-v1/summary.json)、[開工FAIL原始結果](test-closeout-v1/before/results.json)、[最終結果](test-closeout-v1/final/results.json)、[assertion witness與V8 raw coverage](test-closeout-v1/final/)、[基線](test-closeout-v1/baseline.json)、[檔案保存核對](test-closeout-v1/preservation.json)。中途OutcomeMapping缺漏的結果亦保留於`first-repair/`，沒有覆寫原FAIL。

## Production與範圍核對

開工2,305個既有檔案的SHA-256核對，只有上述兩個測試不同；script.js、story.js、index.html、正式模組、Save／DTO、既有UI修改、共用測試loader、原14項與新增15項測試及歷次證據均保持開工版本。HEAD未變，沒有stage／commit。

沒有修改共用loader，因此沒有擴跑其他套件。原14項與新增15項本輪只核對保存，**未重跑，不宣稱本輪PASS**。未執行全repository回歸或Browser驗證。高二套件沿用原completion fixture，record不變驗證不等於自然投手比賽／高二全季驗收。

本輪到此結束。高三／成人摘要仍列待辦，健康系統另案設計審查。
