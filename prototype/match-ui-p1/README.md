# Match UI-P1 · 離線原型

直接用瀏覽器開啟同一資料夾的 [index.html](index.html)。可雙擊檔案，或將它拖入瀏覽器。無需安裝、啟動伺服器、CDN、網路連線或 fetch；請保留 index.html、style.css、app.js、fixture.js 在同一資料夾。

畫面會明示 `OFFLINE DEMO — NOT CONNECTED TO MATCH SIMULATION`。

## 操作

- 四個選項依原 DTO 順序呈現。選「先處理一壘的打者跑者」（secureFirstBaseOut／6-3），會鎖定提交並播放七段固定事件。
- forceSecond、startDoublePlaySecond、holdBall 會顯示 Unsupported；按「返回選擇」回到該選項，不會套用6-3結果。
- 演出每段約2.8秒，可暫停、繼續、下一段或略過。啟用系統「減少動態效果」時，預設暫停，仍可手動繼續播放。
- 前六段沒有本球結果；第七段才揭露 result beat。整段 Playback 的記分板保持四局上、一出局、一壘有人、主0客1。
- 演出結束或略過後，Resolution 才更新為四局上、二出局、二壘有人、主0客1，並呈現原 outcomeText／feedbackText 及兩個 routeId。
- 「重播本球」只重讀原 DTO；「確認，結束示範」只進入 Continue。可再選「重新開始示範」，不會推進正式比賽。

## 鍵盤與文字模式

所有操作使用原生 button，以 Tab 移動、Enter／Space 啟動。頁首有跳至目前事件的連結；每次切換畫面會聚焦事件標題，Unsupported 返回時則回到原選項。播放途中不因下一段搶走控制鈕焦點。結果透過 aria-live 宣告一次；null observations 不產生空白欄。

球場為靜態 SVG；占壘另以文字說明，不只依靠顏色。所有事件都有文字，沒有動畫或 Canvas 依賴。實際瀏覽器鍵盤流程、視覺版面與讀屏體驗仍待人工驗收，不能以 Node 的 DOM adapter 測試代替。

## 固定資料來源

`fixture.js` 是 `docs/match-ui-slice-data-contract-v0.1-evidence.json` 的 `examples` 忠實複本，包含 decision、七個 playback DTO、resolution。所有物件／陣列遞迴 freeze；狀態與計時器只存在 app.js 的 Controller 中。原始 situationText、eventId、排序及 route identities 均保留。

這是演出示範。可在開發者工具或原始碼中看到完整離線資料；phase 控制的是畫面揭露，不提供資料存取安全隔離。本原型不提供其他路線結果、能力評分、終場比分、Production resolver／adapter、Phaser 或 Save 寫入。

## 隔離測試

在專案根目錄執行：

```powershell
node --test --test-reporter=tap prototype/match-ui-p1/tests/prototype.test.cjs
```

僅使用 Node 內建模組及原型自身程式，不載入 Production modules。測試包含 DTO fidelity、提交防重、Unsupported、逐段揭露、記分板 gate、計時器取消、Replay／Skip／Continue、immutable fixture、DOM 文字遮罩、焦點策略與本地資源限制。

`tests/prototype-test-results-final.json` 保存最終命令、完整 TAP／stderr、退出碼與來源 hashes；`prototype-test-results.json` 保留先前27項通過的執行紀錄與首次測試 helper 修正說明。Node renderer／一般 script 啟動測試使用小型 DOM／VM adapter，**不是 Browser PASS**。本輪瀏覽器 smoke 因 IAB／Chrome 工具均回「Browser is not available」而未執行。

Ready for Commit＝NO；Ready for Sprint10B＝NO；Receiver v2＝DISABLED。等待人工驗收。
