# 可重跑瀏覽器驗收

使用這個分支的最新工作樹。先執行 `node tests/full-match-browser-acceptance/server.cjs 8770`，確認 `/__version` 的 HEAD、dirty、hash；不要啟動先前固定 Git blobs 的 8766 服務作為本輪版本。

以 Playwright MCP 開啟 `http://127.0.0.1:8770/index.html`。正常捕手流程由創角後頁面「開發測試書籤 → 青棒第一年」進入，Direct Start 關閉。依登記順序：觀察訓練組、保留國中主守、團隊工作、用打擊增加入口、短量熱身。新 match seed 由正式入口產生，只記錄、不重抽。每次存檔前取得新 DOM，看到成功並核對 localStorage 才重整／讀取。

`runner.cjs` 是 `async(page)=>...` 的 Playwright MCP code body。用 MCP `browser_run_code_unsafe` 執行檔案內容（worktree 在 MCP allowed roots 時可直接用 filename）。它只讀 snapshot 並按目前真正可見的 DOM 按鈕；不呼叫 choose／advance／prepare。`run-config.json` 提供 case 證據子目錄、單批最長 40 秒、`stopAtChoices`、`saveFirstDecision` 與 DOM 文字選擇優先序。每批結束先看結果；ERROR／STALLED 保存現場，不換 seed 繞過。首次失敗與重驗用不同 case 名稱，避免覆蓋。

測試頁 `http://127.0.0.1:8770/__fixture` 有獨立一次性的「建立已登記測試局面」按鈕。參數 `position` 是具體中文守位，`scenario=full|substitution|no-appearance|bunt`。所有 setup 都在按鈕處透過正式 bookmark／position／role／opportunity／match owner 完成；其後只用正式 UI。它不是正常捕手流程的替代證據。substitution 使用固定 `browser-substitution-v1` opportunity input；P 延期與健康 no-appearance 仍由原 owner 決定，沒有強迫上場。

`bunt-matrix.cjs` 讀 `matrix-config.json`。四組固定 placement=0..3，各 pace=0..3；pop=1 另列。這些數字是已登記 generator roll bins，不能換 seed 搜尋。初始化僅在獨立 2 上前置局面，由原 pitch owner 產生觸球；不供給 catch／out／hit 或 refs。開始後讓原 playback 自行承接，原生決策按正式按鈕。每案必須 `sourceSame=true` 才計覆蓋。runner 本身沒有解決 pending 球的後門。

`branch-entries.cjs` 只驗各具體守位的初始名單與呈現，不宣稱各分支守備結算。`legacy-pages.cjs` 逐頁開啟 `html-inventory.json` 的全部現有 HTML，保存頁面錯誤與資源失敗；舊 fixture 的快速完成／手填結果按鈕不作本輪通過證據。

`loaded-versions.cjs` 以只讀 DevTools source 取得每個頁面真正已載入的 script hash；當伺服器工作樹變動時必須區分此資料與 `/__version`。先驗證來源相同，才比較或合併同版本證據。

輸出只寫本輪 `docs/design-optimization/full-match-browser-2026-10-31/`。`/__evidence/<case>/<file>` 是 loopback server 的限定取證端點，與遊戲存檔完全分開；它不把 JSON 注入 Player 或 localStorage。正式存檔只能透過頁面儲存／讀取。本機服務不要對外綁定。

輔助命令：`node tests/full-match-browser-acceptance/fact-check.cjs` 只檢查已捕獲的瀏覽器事實；`node tests/full-match-browser-acceptance/verify.cjs` 執行五套直接相關 Node 回歸。兩者都不是完整比賽的頁面證據。

後續必做清單：補 G1 契約並實作 → 重驗 17 種短打與同球存讀 → 同版本捕手首場／電話／N+1／第二場／角色回饋／年末 → 同版本完整內野與外野 → 替補／未出賽／投手延期 → WBSC 球數、第三好球、封殺解除、回壘、第三出局、終場各合法邊界 → 全部正式紀錄與公開游標核對 → 最終定向 Node 回歸。尚未全部完成時總結保持 BLOCKED。
