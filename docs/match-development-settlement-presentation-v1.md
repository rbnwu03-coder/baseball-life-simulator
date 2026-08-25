# Match Development Settlement Presentation v1

## Scope

本層只負責把已完成的 Match Experience／Development settlement 轉成玩家可讀的賽後摘要：

```text
Match Ends
→ Canonical Match Truth finalized
→ Match Experience settlement
→ Development settlement
→ Match Development Settlement Presentation
→ Continue to life route
```

它不是 Game Settlement、Box Score、batting line、pitching line 或 highlight reel。未來完整 Game Settlement 可以包住本層，但不可讓本層取得 Match 或 Development mutation ownership。

## Data Ownership

- Match Truth owner：既有完整比賽模擬與 canonical logs。
- Match Experience owner：`match-experience-development.js`，負責 exposure、evidence、aggregation、contexts 與 match-level settlement。
- Development owner：既有 `applyDevelopmentResult()`，負責 progress、level-up、cap 與 provenance。
- Presentation owner：`match-development-settlement-presentation.js`，只建立 frozen view model 與 HTML。

Presentation 禁止呼叫 `applyDevelopmentResult()` 或 `settleMatchExperienceDevelopment()`，也不重新分析 Match、重算 Evidence、重新排序 contexts 或修正 Match Truth。

## Player-visible Structure

正常賽後畫面沿用既有 outcome card，加入三個責任分離的區塊：

1. 本場參與：守備局數、打席、依 unique play 計算的守備處理次數。
2. 本場主要實戰經驗：直接依 settled contexts 的既有順序顯示最多三項。
3. 能力成長結果：區分 progress-only、永久 level-up、multi-level 與 skill cap。

玩家 UI 使用既有 `skillLabels`，不顯示 raw progress、seed、multiplier、novelty、internal quality enum、XP 或 skill point。

## Learning Semantics

Presentation 延續：

```text
Outcome ≠ Experience ≠ Development
Decision Quality ≠ Execution Quality ≠ Outcome
```

- 正確 decision＋弱 execution＋failed outcome：呈現「讀對局面，但執行仍有修正空間」。
- Poor decision＋strong execution＋successful outcome：說明執行救回結果，但判斷仍需修正。
- Exposure-only：呈現局面熟悉與維持，不聲稱 catching／throwing／reaction breakthrough。
- Progress-only：明確說明已有累積，但尚未形成永久能力提升。
- Level-up：顯示玩家可讀能力名稱與 `before → after`；不假設只升一級。

## Route、Save 與 Idempotency

`highSchoolMatch.developmentPresentationCompleted` 是持久 route gate：

- Match completion／Development settlement 後維持 `false`，先顯示摘要。
- 玩家按 Continue 後設為 `true`，才回到 life route。
- 按鈕沿用既有 outcome interaction lock；第二次 Continue 不會再次推進。
- 在摘要畫面存檔後，reload 會由 completed match＋未完成 flag 恢復同一摘要。
- Reload 不重跑 Match、不重算 Evidence、不重套 Development；settlement ID 與 summary 保持一致。
- 沒有新 flag 且沒有 Match Experience 的舊 completed save 視為已看過舊 outcome，採 compatibility bypass，避免攔截後期存檔。

## Accessibility / Responsive

摘要使用 semantic section／heading／`aria-labelledby`；Continue 是既有可鍵盤操作的 `button`，沿用 visible focus contract。Layout 具 `min-width: 0`、`overflow-wrap` 與窄畫面單欄規則，支援 desktop、390px 與 200% zoom 的結構邊界。

## Debug

既有 Match Opportunity debug export 額外包含 presentation completed flag 與 frozen view model；Match Experience snapshot 已保存 defensive innings、PA、evidence summary、aggregated skills、selected contexts、Development results 的 progress／skill before-after 及 settlement IDs。Debug 資訊不進正常 UI。

## Deferred Match Integrity Issues

本 Sprint 僅記錄、未修改：

1. Catcher Choice / Outcome mismatch：玩家選擇接穩彈球後交回投手，但 execution／outcome 可能被改寫為壓住跑者／傳向補位。
2. Third-Out Runner Resolution：兩出局時打者出局成為第三出局，結果文案仍可能描述原跑者留壘。

Presentation 永遠接受 canonical Match Truth；上述問題必須在後續獨立 Match Integrity Sprint 修正。
