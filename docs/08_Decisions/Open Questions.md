Narrative Echo

最佳回收時間？

少棒？

高中？

成年？

## Deferred Follow-up — Pre-adult Save Admission

- 記錄日期：2026-08-12
- 來源：High School Integration 1.1
- 現況：`career-save-admission.js` 對可辨識的 pre-adult snapshot 仍回傳 `bypassed + admitted`。
- 本次決定：為避免把高中垂直重組擴張成成年存檔邊界改寫，本次不修改這個 bypass。
- 後續問題：是否要建立獨立的 pre-adult admission contract，並為事件合法性、章節結算與版本遷移提供正式驗證。

## Deferred Follow-up — High School Multi-Moment Match

- 記錄日期：2026-08-12
- 來源：High School Integration 1.1.1 人工試玩回饋。
- 現況：高一交流賽已分離 `prepareHighSchoolYearOneMatch()` 與 `resolveHighSchoolYearOneMatch()`，目前只處理一個第七局關鍵時刻。
- 後續原則：一場比賽只挑選有戰術意義的關鍵時刻；時刻之間用局數、比分與壘況摘要推進，不做逐球模擬或每局固定操作。
- 延後範圍：Match Start、Moment 1–3、Score／Inning Passage 與 Match End 的正式內容設計留待後續 Sprint；1.1.1 不增加比賽長度。

## High School Integration 1.1／1.1.1 Closeout Deferred Items

- Capability Hierarchy：基礎能力與棒球技能的長期關係、轉換及呈現規則。
- Position Identity Conflict：理想自我、教練守位與長期球員身份衝突的跨年回收。
- NPC Spiderweb emotional legibility：人物影響的情緒可讀性與完整支線擴充。
- High School Year Two content：正式高二事件與玩法內容。
- Numerical balance：能力、角色、比賽與關係門檻的最終數值平衡。
- Final narrative polish：高一完整敘事潤飾與語氣統一。
- 本次 Closeout 僅保留追蹤；以上項目、Multi-Moment Match 與 pre-adult save admission bypass 均不在 1.1／1.1.1 最終收尾中實作。
