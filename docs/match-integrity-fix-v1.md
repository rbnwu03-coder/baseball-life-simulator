# Match Integrity Fix v1

## Third-Out termination model

正式打席依序完成 play result、跑者過本壘 timing、第三出局類型、得分合法性，再終止半局。`outsAfter >= 3` 是 canonical terminal guard；terminal play 的 active bases 立即收斂為空壘，換邊後固定為 `outs = 0`、空壘並交換攻守。

第三出局分為：

- `force`：該 play 的得分不成立。
- `batterRunnerBeforeFirst`：該 play 的得分不成立。
- `nonForceTag`：只有在第三出局前已合法過本壘的得分成立。

事件保存 `thirdOutType`、`scoringAllowed`、合法／失效得分跑者、`basesBefore`、`basesAfter` 與 transition 狀態。Terminal runner 不再產生「留在原壘」或「推進到下一壘」的敘述；合法得分仍先呈現，接著說明第三出局與半局結束。

## Runner-state boundary

第三出局 play snapshot 保留三出局事實，但 active base occupancy 為空。半局結束事件可透過 pending terminal state 辨識殘壘玩家，不會把因半局終止而離開壘包的玩家誤判成被觸殺。換邊只執行一次，不重算比分、不跳過打序，也不攜帶上一半局 runner identity。

## Catcher choice causality

捕手選項使用位置專屬 canonical route，而不再共用一般守備的 `contain`：

- `secureAndHold`：控制彈球並守住跑者，不傳壘。
- `secureAndReset`：控制彈球、確認無啟動、交回投手並重設下一球。
- `holdRunnerAndReset`：讀取跑者、壓住起步、交回投手。
- `blockAndControl`：用身體封住彈球並保有球權。
- `attemptLeadRunnerOut`：讀取離壘跑者後向最前方壘包傳球。
- `attemptHomeOut`：控制彈球後處理本壘跑者。

每個 player-visible option 都有唯一 intent ID。Match truth 保存 available routes、selected route、final route、execution stages 與 attribution。Outcome 由 final route 產生；只有抓跑者 route 可以出現傳壘、觸殺、傳球失誤或趁傳推進。

## Reassessment rule

Selected route 預設必須一路保持到 outcome。只有出現明確的 live trigger（例如控制球後跑者突然啟動）才可建立 reassessment；紀錄必須同時保留原 route、原因、新 route 與玩家可讀的局勢變化。沒有 explicit reassessment 時，`selectedRoute !== finalRoute` 是 integrity failure。

## Boundaries and deferred work

本修正沒有新增 Match RNG consumption、沒有修改能力或比賽平衡，也沒有新增永久成長。Match Experience v1 仍只支援二壘守備與一般打者；Catcher Experience、blocking／gameCalling 成長、Pitcher Experience、其他守位 Match Experience、Game Settlement 與完整計分規則引擎均 deferred。

尚未支援的進階棒球邊界包括 appeal play、fourth-out appeal、obstruction、interference、完整 dropped-third-strike 特例與 infield-fly edge cases。
