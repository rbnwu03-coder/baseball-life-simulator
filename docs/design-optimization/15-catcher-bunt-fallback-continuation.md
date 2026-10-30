# 捕手短打 fallback 限定收尾（2026-10-30）

**狀態：文字已清理；PA 續行仍阻塞，不能宣稱修補完成。頁面限定驗收維持未完成。**

沿用 `fix/catcher-event-consistency-2026-10-30`，父版本 `5aae9bd4c7c017a38761ddd690fddbd58e16a661`。本輪不合回 integration，不調整健康公式或 UI 結構。

## 玩家文字

界內滾動短打現在顯示：「壘上無人，偏強的短打往二壘手一側滾動；球仍在場內，守備處理尚未完成。」有人案例依正式 runners 顯示壘況。小飛球只顯示短打形成小飛球、接球結果尚未確定。

同步清理 handoff 的其他已知落點線索，移除「垂直切片」「本階段」「尚未納入」等開發用語。沒有宣稱完成接球、出局或跑者推進。

## 正式 playback 證據

延伸原有空壘／一壘有人案例，加上兩者的 fallback 後 Save/Load。短打投球事件與 fallback 都由 `advanceHighSchoolMatchPlaybackStep` 呈現；fallback 之後只呼叫此正式入口，不直接調用結算器、不改 cursor、不手填結果。Save/Load 使用實際 `saveGame`／`loadGame` 與記憶體 localStorage，未改讀取准入或保護。

[修補前](catcher-event-repair-v2/continuation-before.json)使用同一支新增測試，載入父 commit 的完整正式 index 腳本與 helper；[來源記錄](catcher-event-repair-v2/baseline-source.json)及 capture 程式可重現，沒有替換 production resolver。[修補後](catcher-event-repair-v2/continuation-after.json)保存正式軌跡、pitch truth、PA identity、打序與正式紀錄差量。

| 案例 | 父版本續行 | 本輪安全保護後 | 完成該 PA／下一棒 |
|---|---|---|---|
| 空壘 | 原界內短打被另抽成 walk；PA +1、打序 0→1 | 保留原球，PA +0、打序 0→0 | **FAIL／阻塞** |
| 一壘有人 | 同上，且依新 walk 推進跑者 | 保留原球與 runners，PA +0、打序 0→0 | **FAIL／阻塞** |
| 空壘 Save/Load | 正式讀取成功後仍被另抽成 walk | 正式讀取成功，原球／壘況保留 | **FAIL／阻塞** |
| 一壘有人 Save/Load | 正式讀取成功後仍被另抽成 walk | 正式讀取成功，原球／壘況保留 | **FAIL／阻塞** |

父版本四個案例的新增 PA authority 都是 `compressedAIPlateAppearanceOutcomeV1`；它沒有承接原 `groundBunt / hard / secondBaseSide`，即使只寫一次紀錄與只前進一次打序，也不能當成通過。

## 第一個 owner 缺口與本輪最小保護

1. `resolveHighSchoolProductionBuntPitch` 將界內短打保留為 `ballInPlayPendingDefense`。此處的 `plan.completed=true` 代表投球／球數階段已結束，不代表正式 PA 結算完成。
2. `ensureHighSchoolBuntBallInPlayHandoff` 正確保留捕手守位後，事件屬於現有不支援的守備 handoff。`prepareHighSchoolDefensiveMomentFromSimulation` 只產生 fallback；下次呼叫因 `fallbackPresented=true` 回傳 `null`。
3. `advanceHighSchoolMatchPlaybackStep` 將此 `null` 視為可以進入一般 PA，呼叫 `resolveSimulatedHighSchoolPlateAppearance`；第一個錯誤的接手在這裡，原短打被重新抽成壓縮 PA。
4. 目前 `OffensiveBuntDefensiveHandoff` 只有 physical runner state 與 timing windows；現有落地短打結算經 `defensiveSituation.buntDefensiveContext → applyInfieldResolutionToHighSchoolMatch`，需要已支援的內野 actor／route。捕手視角下這球沒有 NPC 守備結算 owner 或正式 settlement receipt。普通 `BattedBallOutcomeMapping` 要求另一種完整 physical-truth schema，不能將短打硬填欄位後另做壓縮抽樣。

本輪增加 `assertHighSchoolBuntFallbackSettlementReady`，在 fallback 已呈現、同一 handoff 的界內短打仍待守備結算時，以 `BUNT_FALLBACK_SETTLEMENT_OWNER_MISSING` 停止。正式 playback 在消費既有呈現事件後才檢查；一般壓縮 PA resolver 入口也檢查，避免繞路消耗 RNG 或改寫正式紀錄。沒有跳過 PA、換棒、人工給結果或放寬 activeSituation／Save/Load 保護。

四案確認 source、handoff、runners、outs、比分、打序、simulation RNG cursor 及 gameRecord 在停止前後保持不變。這是防止資料損壞的保護，**不是續行完成**。

## 最小後續提案（尚未實作）

- 先限 `groundBunt / hard / secondBaseSide`：在 fallback 邊界新增 NPC 短打結算 owner，從當場正式 roster 取得真正二壘手與能力。不要把捕手改成二壘手，也不要借用玩家能力。其他落點與 pop bunt 維持未支援。
- 同 PA 原 `pitchIdentity → handoff.identity` 必須成為唯一來源；用既有 runner physical state／force chain／timing windows，產生具體接球、傳球及跑者處理事實。需要擴充內野執行介面以接納 NPC actor；不能拿一個預定 out/single 當結算。
- 透過既有 runner settlement／third-out／game-record owner 寫入一次，保存來源與 settlement receipt。receipt 同時保護正式紀錄、打序前進及 replay；Save/Load 必須保留它，重複續行不能重算。
- 本輪四個紅色續行案例須全部轉綠：每案原短打來源被正式 PA 承接、PA／record ref 各一次、打序只進一次並輪到下一棒，沒有壓縮 PA 替代或卡住，再回到人工頁面驗收。

## 本輪實際測試

[原始 logs／來源雜湊／exit code](catcher-event-repair-v2/verification.json)：

| 測試 | 結果 |
|---|---|
| catcher context + continuation | **29 項 PASS、4 個 PA 續行 FAIL，exit 1** |
| catcher choice outcome integrity | 20/20 PASS |
| B2 defensive handoff | 26/26 PASS |
| B2 runner realization | 22/22 PASS |
| B1.0.1 production tactical action | 21/21 PASS |
| compressed AI production integration | 19/19 PASS |

未重跑全專案或健康驗收。首輪高中整合第 8 項的既有失敗沿用原比對證據，不在此輪重跑或擴修。`node --check` 與來源 `git diff --check` 通過。本輪 [code/test diff](catcher-event-repair-v2/minimal.diff) 包含兩個 production 檔案及延伸的既有捕手測試。

## 本機人工網址與版本

本機服務為 `http://127.0.0.1:8766/index.html`，版本資訊在 `http://127.0.0.1:8766/__version`。服務直接讀取啟動時指定完整 commit 的 Git blob；所有資源帶 `X-Test-Commit`，不會混入後續工作區修改。啟動與 HTTP hash 核對工具一併提交；最終完整 SHA 與實際啟動結果由交付訊息提供。

此網址可檢查文字與停止狀態；**捕手短打 PA 目前仍會在結算 owner 缺口停止，不能用它宣告人工完整流程通過**。本輪未操作實際瀏覽器或正式存檔。
