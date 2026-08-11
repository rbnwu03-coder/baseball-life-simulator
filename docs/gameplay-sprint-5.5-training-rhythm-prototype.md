# Gameplay Sprint 5.5：Training Rhythm Prototype

## 1. 基線與目的

- 起始基線：`9bb2eb7`
- 測試級別：Gameplay Test Level C — Production Training Rhythm Prototype
- 正式接入範圍：青棒第二年春季聯賽前兩個自主訓練時段

本 Sprint 驗證同一段正式生涯流程能否形成「生活事件 → 主動準備 → 驗證事件」的節奏。它不建立日曆、完整養成模式或自由行動選單，也不增加高一、高三與成年回合。

## 2. 高二春季節奏

```text
名單重新洗牌
→ Training A：第一次自主訓練
→ 原本的角色測試
→ Training B：春季聯賽前的最後調整
→ 原本的春季聯賽打席
```

兩個 Training 都透過既有 `forcedEventId` 暫時覆蓋顯示。底層 `highSchoolYearTwoStep` 仍維持原本八幕，Career Spine Contract 與 `high_school_year_two_spring_game` 的正式位置不變。

## 3. 五種固定訓練

| 代碼 | 直接效果 | 取捨 |
|---|---|---|
| `power-hitting` | 打擊 +1 | 疲勞 +2 |
| `contact-control` | 球感 +1、紀律 +1 | 疲勞 +1 |
| `defensive-footwork` | 反應 +1、守備範圍 +1 | 疲勞 +1 |
| `throwing-basics` | 傳球 +1 | 疲勞 +1 |
| `recovery` | 疲勞 -2 | 不增加技能 |

效果由唯讀 `BaseballTrainingResolver` 決定。Resolver 不讀取 DOM、全域 Player、Story 或 Save，也不呼叫亂數；未知代碼或缺少必要事實時會回傳 `unresolved`。

## 4. Resolver 與 Mutation Ownership

```text
Story Training Choice
→ readonly Player Snapshot
→ BaseballTrainingResolver
→ readonly machine result
→ script.js 單次套用
→ Outcome Hold
→ Continue 回到原 Career Spine
```

Resolver 回傳：

- `status`
- `code`
- `skillDeltas`
- `bodyDeltas`
- `before`
- `after`
- `changes`
- `issues`

所有結果皆 deep frozen。`script.js` 仍是正式 Player mutation owner，並沿用既有 0～20 上下限。訓練結果只套用一次，不透過 Story effects 重複加值。

## 5. 訓練選擇紀錄

每個時段只留下實際選擇旗標：

```text
hs_y2_training_a_<training_code>
hs_y2_training_b_<training_code>
```

旗標只記錄玩家做過的選擇，不被當成技能或比賽結果真相。Training A 與 B 各只能完成一次。

## 6. 人物短回應

第一次選擇 `contact-control` 時，高中現任教練會以訓練表上的具體評語回應，並小幅增加既有 `coachTrust`。這個 Hook 最多觸發一次。

山本在高中階段仍是長期導師，不在本事件中行使現任教練權力。本 Sprint 未新增 NPC Schema 或人物系統。

## 7. Gameplay 來源事實

訓練不改寫 5.4 進攻公式與 5.2 防守公式，只改變公式已經讀取的正式來源事實：

- `contact-control` 會改變 Contact Adapter 使用的 `ballSense` 與 `discipline`。
- `defensive-footwork` 會改變 Defense Adapter 使用的 `reaction` 與 `range`。
- `throwing-basics` 會改變 Defense Adapter 使用的 `throwing`。
- `recovery` 可使疲勞跨過既有 Body Adapter 的 `fatigued` 門檻。

玩家因此能在比賽前主動準備，但訓練不保證比賽出現好結果。

## 8. Exactly Once、Outcome 與 Save

- 點選訓練後立即鎖定互動。
- `pendingTrainingOutcome` 只存在記憶體，不進入 Player Schema 或 Save。
- 完成結算後清除 `forcedEventId`，再顯示結果畫面。
- 結果畫面明確顯示選擇、實際數值前後變化與可選的人物回應。
- 玩家按下「繼續」後才回到原本事件。
- 已完成訓練的結果畫面可正常手動存檔；讀檔後回到底層正式事件，不重複套用訓練。

## 9. 保持不變的契約

- Player Schema 不變。
- `SAVE_VERSION` 維持 `14`。
- `SAVE_KEY` 維持 `baseballLifeRpgSave`。
- Career Spine 八幕與 progress 欄位不變。
- 5.4 Offensive Core、5.2 Defensive Core 與 Competition Presentation 不變。
- 春季聯賽事件 ID、策略、Base State、RNG 與結果公式不變。
- 高一、高三、成年路由與事件不變。

## 10. 延後項目

本 Sprint 不處理完整 Calendar、每週自由行動、訓練菜單擴充、第三個以上正式 Training Slot、訓練隨機事件、長期訓練記憶、其他年級接入、Gameplay Sprint 5.6 或 Architecture 4.13。
