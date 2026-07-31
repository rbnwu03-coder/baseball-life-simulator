# UX Sprint 2.5：Event Continuity Pass

## 1. 修改目的

本次只修正少棒第一季三個已驗證的敘事斷點：

1. `youth_position_trial` 的正文曾讓玩家像在直接選守位，削弱教練的分組權限。
2. `youth_bench` 的選擇結果尚未收束紅白賽，下一幕卻已進入正式比賽。
3. 第一個正式守備的結果只短暫出現在變化列，約 420ms 後即被下一事件覆蓋。

本次沒有增加回合、事件 ID、能力、判定或新的遊戲流程。

---

## 2. 事件閱讀順序

少棒第一季現在遵循：

```text
Situation
↓
Choice
↓
Outcome
↓
Reaction
↓
Transition
↓
Next Situation
```

玩家按下選項時，原本的 Effect、Flag、Match Effect、關係變化、記憶與回合推進仍立即執行一次。畫面接著停在 Choice Outcome，直到玩家按「繼續」才顯示已推進的下一事件。

---

## 3. Choice Outcome

Choice Outcome 是少棒第一季限定的前端暫時畫面，不是新事件。

呈現順序：

1. 玩家選擇的具體動作。
2. `choice.memory` 保存的場上結果。
3. 教練、隊友或記錄員的回應。
4. 能力、關係、目標與其他既有回饋。
5. 唯一的「繼續」按鈕。

它不具備 Event ID、不寫入 `player`、不進入 Registry、不存入 Save，也不重新執行 Choice。重新整理或讀檔時，遊戲依已推進的 Player State 顯示下一事件。

---

## 4. 守位輪測

四個位置的基本輪測已經完成，玩家只選擇最後三球要交付的任務。山本教練明確說明：玩家不直接宣告守位，由他依三球結果決定初始分組。

四個 Choice 的索引、效果、Flag 與 `setPrimaryPosition` 全部保留；結果記憶分別由教練把名字放入：

- 內野組。
- 外野組。
- 捕手組。
- 投手組。

---

## 5. 板凳到正式聯賽

`youth_bench` 的四種結果都明確收束最後半局，交代玩家整場未上場，以及教練如何留下板凳紀錄或隊伍如何收操。

`youth_match_entry` 再負責新的時間橋接：

```text
紅白賽結束
↓
又經過幾次練習
↓
正式聯賽名單公布
↓
玩家先在候補欄等待
↓
比賽中段被叫上場
```

四個板凳 Flag 會以一句具體文字回響，但不改變原本資格、數值或上場結果：

- `studied_rival_on_bench`：回收高橋三次接球的筆記。
- `supported_from_bench`：回收沿界外線持續熱身的行動。
- `resented_bench`：回收沒有跟著板凳鼓掌的沉默。
- `bench_studied_pitching`：回收偏高、偏外球的記號。

---

## 6. 正式守備的精確回收

`youth_match_mistake` 保留既有 ID，但標題與首段改由上一個實際 Choice 決定。

- 有實際守備瑕疵或暴投：`那次瑕疵之後`。
- 成功完成任務或只是被得分：`下一次守備`。

內野、外野、捕手與投手共十二個 Choice Flag 都有專屬回收句，不再只依 `seasonErrors` 使用抽象描述。

接著明確交代一局經過，進入既有的五局上、零出局、無人在壘狀態，再提出各守位的新任務。比分與結果沒有被額外杜撰。

---

## 7. 不變的 Gameplay Contract

以下內容未修改：

- Event ID、Choice 數量、順序與 `eventId + choiceIndex` identity。
- Effect、Flag、Skill Effect、Position Effect、Match Effect。
- `setPrimaryPosition`、Personality、Impression、Relationship、Body 等效果。
- Random、Threshold、Coach Trust、Evaluation、成功率與八回合路由。
- Competition ID、Match State 寫入規則與 `prepareMatchStateForEvent()`。
- Boundary、Flow、Registry、Dispatcher、Save 與 Player Schema。

少棒 Gameplay 合約 SHA-256：

```text
c3f3210302b281c5423ee946f3f03cd6791e724f849b70af2db02b6754e6f703
```

---

## 8. 驗證

`tests/event-continuity-pass-test.js` 驗證：

- 合約雜湊、事件 ID 與 Choice identity。
- 教練保有輪測分組權，四個結果各自進入正確組別。
- 板凳四結果收束紅白賽，正式賽入口具有時間與名單因果。
- Choice Outcome 不使用 420ms 自動跳轉，只顯示一個「繼續」。
- 連點選項與連點繼續都不會重複套用效果。
- 十二個正式守備 Flag 都能精確回收，且標題正確區分瑕疵與完成。
- 第五局既有局數、出局與壘況保持不變。
- 暫時結果不進入 Save 或 Player Schema，讀檔不會重套 Effect。
- 四守位仍以原本八回合完成少棒第一季。
