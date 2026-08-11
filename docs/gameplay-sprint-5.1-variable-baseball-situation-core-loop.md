# Gameplay Sprint 5.1 — Variable Baseball Situation Core Loop Prototype

## 1. Sprint 定位

Architecture Sprint 4.3～4.12 已建立從高中畢業到二十二歲職涯結果的安全契約與執行邊界。該階段暫時封存為 `Career Architecture Foundation v1`，本 Sprint 改以隔離 Prototype 驗證正式遊戲尚未證明的核心問題：同一組棒球選項，能否因局勢、能力、身體與對手條件不同而改變價值，並產生可解釋但不固定的結果。

本 Sprint 不延續 Architecture 4.13，也不實作二十二歲後 Eligibility、Rejoin Runtime 或正式事件整合。

## 2. 為何必須隔離

`gameplay-prototype.html` 是獨立開發入口。它不載入正式 Player、Save、Story、Application Controller 或任何 Career 模組，正式 `index.html` 也不知道 Prototype 存在。

隔離的目的：

- 先驗證棒球決策模型，而不是把尚未成立的模型接入長期存檔。
- 防止 Prototype 操作改寫玩家、劇情進度或任何 Storage key。
- 讓攻守 Resolver 可在 Node 與瀏覽器使用同一組明確輸入測試。
- 把 transient gameplay state 留在單次情境，不提早加入 Player Schema。

頁面重新整理後，Seed、Run 10 結果與 Stage A 暫存狀態都會清除。

## 3. 共用核心鏈

```text
Situation
→ Decision Quality
→ Execution
→ Baseball Consequence
```

Decision Quality 回答「在這個局勢下，這個選擇是否合理」。Execution 回答「這名球員能否把選擇做出來」。Baseball Consequence 再結合球質、守備、跑者與有限波動形成機器可讀結果。

Decision Quality 不等於結果。好判斷可能執行失敗；差判斷也可能因能力與當次執行而得到好結果。兩者都由專項測試鎖定。

## 4. Offensive Prototype A

代表情境固定為高中正式比賽第七局、一出局、一壘有人。玩家選擇整個打席的 approach，而非逐球模擬。

```text
比分／跑者／投手傾向／身體／下一棒／能力
→ 拉打／推打／握短棒／犧牲觸擊
→ Decision Quality
→ 打擊或觸擊 Execution
→ 擊球類型（觸擊除外）
→ 對方守備互動
→ 打席結果與壘包狀態
```

### 4.1 API

```js
BaseballOffensePrototype.resolveAtBat(input)
```

核心輸入包含 `situation`、`player`（僅為傳入的局部能力快照，不是正式全域 Player）、`approach`、`pitchDifficulty`、`defenseQuality` 與五個外部 rolls。

輸出包含：

- Decision raw score、tier 與來源 modifiers。
- Execution score、tier、相關能力與 variance。
- 擊球分布與抽出的 profile。
- 守備互動 score 與 tier。
- 結果分布、result type 與 machine-readable state delta。
- 可檢查的 trace。

## 5. Defensive Prototype B

守備 Prototype 明確分成兩階段，不合併為單一選項：

```text
Stage A：Ball Acquisition
來球類型／難度／打者速度／守備／身體
→ 穩定處理／主動前壓／延伸撲接
→ Decision Quality
→ Fielding Execution
→ Control Quality

Stage B：Throw Decision（只有控制球成功才出現）
比分／跑者速度／打者速度／Control／傳球／身體
→ 傳一壘／封殺二壘跑者／挑戰雙殺
→ Throw Decision Quality
→ Throw Execution
→ 防守結果與壘包狀態
```

延伸／撲接只在 `range-ball` 或 `deep-grounder + difficult` 可用。接球失敗時，傳球階段標示 unavailable，不會讓高傳球能力越過未控制球的棒球因果。

### 5.1 API

```js
BaseballDefensePrototype.resolveFieldingDecision(input)
BaseballDefensePrototype.resolveFieldingExecution(input)
BaseballDefensePrototype.resolveThrowDecision(input)
BaseballDefensePrototype.resolveThrowExecution(input)
BaseballDefensePrototype.resolveDefensivePlay(input)
```

## 6. 能力與判斷的責任邊界

能力可以：

- 影響選擇是否適合這名球員，但只提供有限的 Decision modifier。
- 主導接球、打擊、觸擊與傳球的 Execution。
- 開啟高階 Execution tier 的 skill gate。

能力不可以：

- 把 raw Decision score 當成成功率。
- 讓高傳球能力把錯誤雙殺判斷變成 Excellent。
- 讓高能力消除局勢與有限波動。

## 7. RNG Injection Boundary

Core Resolver 不呼叫 `Math.random()`、`Date.now()` 或 `performance.now()`。所有 roll 都由呼叫者傳入，合法範圍固定為 `0 <= value < 1`。非法值 fail closed，回傳 `unresolved` 而不 throw。

同一 input 與同一 rolls 必須得到 deep-equal 結果。Sandbox 使用記憶體內的 xorshift32 產生 seeded sequence，僅負責生成數字並傳給 Core。Debug Trace 會顯示實際 rolls。

## 8. Machine-readable State Result

攻守結果都不只回傳顯示文字，而會回傳：

- `resultType`
- `outsAdded`
- `runsScored` 或 `runsAllowed`
- `batterBase`
- `runnerFromFirstBase`
- `inningEnded`

Prototype 的 base code：0 代表出局／無壘位，1～3 代表壘包，4 代表得分。

## 9. 唯讀與驗證契約

- Resolver 不修改 input、rolls 或 nested object。
- 所有 resolved／unresolved 回傳值 deep frozen。
- 枚舉必須 exact match，不猜測、不修補、不 fallback 到 average。
- Core 不依賴 DOM、Storage、Player Runtime、Story、Save、NPC、Time 或 Career。

## 10. Sandbox 與 Run 10

獨立頁面提供攻擊與守備 tabs、Seed、Run Once、Run 10、Reset 以及可展開 Debug Trace。Run 10 使用相同局勢與選擇、連續 seeded sequence，彙整 Decision、Execution 與 Result 分布，供人工確認合理波動。

Prototype 顯示 raw score、tier、weights 與 rolls 是開發用途。正式遊戲未來不應直接向玩家顯示 raw Decision Quality 數字或最佳答案。

## 11. 本 Sprint 不進正式 Runtime

5.1 不修改或取代任何既有 youth／high-school event，不改 Gameplay route、Effects、Player Schema、Save version、Storage key 或 Debug 書籤。正式事件仍維持原行為。

只有後續獲得人工驗證的 Integration Pilot，才可挑選一個既有 fixed-result event，另立規格決定是否接入。5.1 的完成不代表自動授權整合。

## 12. 明確延後

- 二十二歲後 Eligibility、Rejoin Runtime／Commit／Progression。
- 少棒、高中與成年正式事件整合。
- pitch-by-pitch、球數、保送、觸身球、球種與左右投打。
- 全壘打、進階擊球物理、個別守備站位與外野／捕手／投手守備。
- 盜壘、tag-up、cutoff、relay 與進階跑壘 AI。
- 天候、球場、clutch attribute、正式敘事潤飾。
- 通用 Gameplay Framework、Save Integration 與 Gameplay Sprint 5.2。
