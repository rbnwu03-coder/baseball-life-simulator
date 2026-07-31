# UX Sprint 1：Competition Flow Framework

## 1. Sprint 目的

本 Sprint 只處理「一個球季如何被玩家感受到」的展示節奏，不增加回合、不增加能力、不改變事件效果與比賽結果。

框架把既有事件重新辨識為兩種節奏：

- Story Beat：生活、人物、收操與反思。
- Validation Event：把已累積的能力、態度與關係放進可觀察局面。

正式比賽不是唯一驗證方式，而是 Validation Event 的一種。

---

## 2. Validation Event 定義

Validation Event 是一個展示分類，不是新的 Gameplay 類型。它不會新增效果、修改選項或改寫判定。

| 分類 | 主要目的 |
|---|---|
| 隊內紅白賽 | 觀察與嘗試 |
| 交流賽 | 適應陌生球隊 |
| 正式聯賽 | 累積戰績與名單評價 |
| 錦標賽 | 晉級與淘汰 |
| 教練測驗 | 確認目前可交付的任務 |
| 守備演練 | 驗證站位與處理選擇 |
| 打擊測驗 | 驗證攻擊策略 |
| 配球練習 | 驗證局勢閱讀與指揮 |
| 隊友合作挑戰 | 驗證合作與責任分配 |

---

## 3. Framework 資料流

```text
既有 Story Event ID
        ↓
Validation Event Registry（唯讀查表）
        ↓
既有 Match State／能力 Snapshot（複製值）
        ↓
Competition Presentation Model
        ↓
Header／Transition／Inning Summary／Score／Connector／Timeline
        ↓
既有故事正文、Choice、Effect 與 Gameplay 照常執行
```

責任邊界：

- `story.js`：只保存故事正文、選項與既有效果，不組 Header、不管理局數、不維護 Timeline。
- `competition-presentation.js`：保存 Validation Event、賽事類型與賽制參考資料，根據傳入快照產生唯讀展示。
- `script.js`：只負責把目前事件 ID 與複製後的畫面資料交給展示層。
- 既有 Match Gameplay：仍由原本流程管理，本 Sprint 不改動。

---

## 4. 少棒第一季節奏

少棒第一季仍使用原有回合與事件，沒有增加遊玩時間。既有事件被整理為五個節奏拍點：

| 拍點 | 類型 | 既有事件 | 節奏功能 |
|---|---|---|---|
| 球季報到 | Story | `youth_season_intro` | 建立球季起點 |
| 守位輪測 | Validation | `youth_position_trial` | 第一次小型驗證 |
| 收操後 | Story | `youth_teammate` | 在兩次驗證間留出人物呼吸 |
| 隊內紅白賽 | Validation | `youth_bench` | 讓板凳與名單成為正式賽前因 |
| 正式聯賽 | Validation | `youth_match_*` | 用同一場比賽連續回收前面累積 |

原始事件順序與路由保持不變；改變的是玩家對各事件功能與前後關係的理解。

---

## 5. Competition Presentation Layer

每個 Validation Event 可呈現：

- Header：驗證類型、賽事名稱、目的與目前階段。
- Transition：承接上一個生活或驗證事件。
- Inning Summary：正式賽顯示局數與出局數；非正式驗證顯示測驗範圍。
- Score Presentation：只在已有比賽狀態的正式賽顯示，不替紅白賽虛構比分。
- Connector：指出這次驗證會帶往下一個問題。
- Timeline：用五個拍點顯示整季進度，而不是把每張事件卡視為獨立章節。

正式比賽的各幕共用相同 `competitionId`，因此報到、第一個守備、失誤回應與終場會被視為同一場比賽。

---

## 6. Content & Presentation Responsibility

### Competition Presentation 負責

- 比賽或測驗身份。
- 局數、出局數、比分與壘況等結構化局面。
- 同一場比賽目前進行到哪一幕。
- 少棒第一季 Timeline。
- 上一幕如何承接到當前局面。
- 當前必須處理的任務。
- 只呈現一項與當前決策最相關的能力線索。

### Story Event 負責

- 人物的動作與反應。
- 球被打向哪裡、跑者如何移動、隊友怎麼補位。
- 場上聲音、空間與比賽氣氛。
- 玩家需要判斷的具體問題。
- 可想像、符合少棒程度的棒球選項。
- 選擇後實際發生的動作與人物回應。

### Choice／Effect 負責

- 實際 Gameplay 結果。
- 能力與身體數值變化。
- 關係與教練信任變化。
- Match Effect、位置 Effect 與分支結果。
- 原本的成功率、門檻、隨機與路由。

Presentation 不取代 Story；Story 也不重新組裝一套比分、局數或 Timeline。正文需要引用局面時，只描述會影響判斷的可觀察細節。

---

## 7. 能力存在感

Validation Event 會把下列既有能力顯示成情境描述：

- 壓力：目前是否已影響注意力與動作確認。
- 觀察：目前能否看見站位、彈跳與對手節奏。
- 棒球理解：目前能否把出局數、跑者與下一個處理連在一起。

這些文字只根據傳入數值選擇展示版本，不會改變能力、公式、判定門檻、Choice 或 Effect。

---

## 8. 台灣棒球賽事分類與層級資料

以下資料只作為後續 Presentation 與企劃參考，不代表目前已全面實作：

| 層級 | 常見局數 | 常見賽事 | 球季節奏摘要 |
|---|---:|---|---|
| 少棒 | 6 | 紅白賽、交流賽、聯賽、錦標賽 | 基本功與短局數驗證交錯，再以聯賽或盃賽回收 |
| 青少棒 | 7 | 隊內對抗、交流賽、學生聯賽、全國錦標賽 | 位置競爭與升學觀察開始連動 |
| 青棒 | 7 | 紅白賽、交流賽、高中聯賽、盃賽／邀請賽 | 秋冬賽事、聯賽與曝光並行 |
| 大學 | 9（高層級常見） | 隊內賽、熱身賽、大專聯賽、邀請賽 | 學期與聯賽分段，級組影響密度 |
| 成棒 | 9 | 熱身賽、甲組春季聯賽、爆米花聯盟、盃賽 | 工作、訓練與曝光並行 |
| 職棒 | 9 | 熱身賽、例行賽、季後賽、總冠軍賽 | 長期例行賽累積，再由季後賽集中決定結果 |

局數、提前結束、延長與投球限制仍須依各賽事當屆規程，不應由此資料表取代正式競賽規則。

參考：

- 中華民國棒球協會賽事規則頁面（少棒六局、青少棒七局）：https://www.ctba.org.tw/news_detail.php?cate=news&id=581&type=11
- 中華民國大專院校體育總會 UBL 規程：https://www.ctusf.org.tw/upload/news/20251007102311_1.pdf
- 中華職棒 2025 棒球規則：https://www.cpbl.com.tw/files/file_pool/1/0p065549820043528193/2025%E6%A3%92%E7%90%83%E8%A6%8F%E5%89%87%28%E5%AE%98%E7%B6%B2%E7%94%A8%29.pdf
- 中華職棒組織與賽季資料：https://www.cpbl.com.tw/about/structure

---

## 9. 明確未修改範圍

- Decision、Boundary、Flow、Evaluation、Save。
- Player Schema、Relationship、Coach Trust、Scout Evaluation。
- Random、Choice、Effect、Gameplay Threshold。
- Match Gameplay、比賽結果公式、局數推進寫入。
- 任何既有能力值與能力成長公式。
- 章節長度與遊玩回合數。

---

## 10. 驗證方式

- 模組測試確認賽事分類、六層級規則與少棒五拍點。
- 確認正式賽各幕共用同一 `competitionId`。
- 確認紅白賽不偽造比分，生活事件不插入 Validation UI。
- 確認 Presentation 不讀寫 DOM、Save、Random、Boundary、Decision 或 Evaluation。
- 全專案回歸測試確認既有垂直切片仍能完成。
- 瀏覽器人工驗證 Header、比分、壘包、能力描述、Connector 與 Timeline。
