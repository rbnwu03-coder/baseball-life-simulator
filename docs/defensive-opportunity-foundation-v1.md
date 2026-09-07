# Defensive Play Foundation 1.0 — Defensive Opportunity & Responsible Fielder

## 基線與範圍

基線：`main` / `8f9bf04e1e65a49652417d43fa44430d0e856cf1`。
本輪只建立 `BattedBallPhysicalTruth → DefensiveOpportunity → active defender`。
責任不是接得到球，也不是最有能力、最高評價或玩家角色所在的守位。

## 舊責任假設盤點

| 位置 | 原假設 | 分類與處置 |
|---|---|---|
| `batted-ball-ground-defense.js` / `resolveGroundBallDefensiveAccess` | rightSide + 玩家 2B 才有詳細 access | Vertical-slice assumption；保留 access，production 上游先驗證主責位置及 active actor |
| 同檔 runner3B advance / compatibility projection | 2B 接手、右側球文案 | Vertical-slice assumption / presentation shortcut；不提升為通用責任規則 |
| `batted-ball-line-drive-defense.js` / `resolveCatchAccess` | shallow + rightSide + 玩家 2B | Vertical-slice assumption；只有 canonical 主責 2B 且 active actor 是玩家才接手 |
| `batted-ball-fly-ball-defense.js` / `resolveFlyBallCatchAccess` | 中深層 rightSide RF、middle CF | Reusable spatial rule + limited execution scope；詳細執行仍維持原範圍 |
| `script.js` / `getHighSchoolFlyBallDefenderCatchContext` | 只按 direction 查 RF / CF | Ad hoc shortcut；正式路徑改用 direction + depth 的結構化責任表 |
| `script.js` / `getHighSchoolInfieldAssignmentPosition`、`deriveInfieldBallDirection`、`resolveDefensivePlayResponsibility` | role / 玩家位置決定 synthetic 情境與固定隊友角色 | Legacy fallback；不作新 BBP 責任 authority，未全面重寫 synthetic 比賽 |
| `script.js` / ordinary ground / bunt situation overrides | 固定 2B primary、固定 route bridge | Vertical-slice compatibility；ordinary ground 上游已受新 authority 約束，bunt 不納入本輪 |
| `offensive-bunt-defensive-handoff.js` | secondBaseSide ground bunt + 玩家 2B | Vertical-slice assumption；觸擊責任泛化 deferred |
| `script.js` / `resolveHighSchoolCatcherDecision` | 捕手 intent / 壘況驅動既有動作 | Catcher-specific legacy context；不是一般 BBP 的 responsible-fielder resolver |

## Contract 與 authority

`defensive-opportunity-foundation.js` 提供：

- `deriveDefensiveOpportunity(physicalTruth, topologyVersion)`：純守位責任，`bindingStatus=unbound`。
- `resolveDefensiveOpportunity({physicalTruth, activeRoster, topologyVersion})`：再透過 0.9 的 `validateActiveDefense` / `getCurrentDefender` 綁定 actor。

輸出包含 version、identity、physicalIdentity、topologyVersion、唯讀 ballContext 摘要、opportunityFamily、primaryPosition、secondaryPositions、primaryDefenderId、secondaryDefenders、responsibilityClassification、responsibilityBasis、supported、bindingStatus、fallbackReason。

`supported` 只指此粗分區責任可解析，不承諾 detailed execution 支援或成功。只有 `bindingStatus=bound` 才有可用的目前 actor 身份。
輸出 deep-frozen；不修改 physical truth、lineup、match 或 lifecycle，不讀能力、coach/scout evaluation，不使用 RNG。
Identity 由既有 physical identity、foundation version、topology version 構成，不包含玩家身份或能力。

## 最小拓撲

拓撲版本：`regulation-coarse-zones-v1`。以下主責均是粗分區下的 nominal owner，不是假裝知道精確落點。

| 球型／深度 | leftSide 主責／空間支援 | middle 主責／空間支援 | rightSide 主責／空間支援 |
|---|---|---|---|
| Ground | SS / 3B | SS / 2B, P | 2B / 1B |
| Line / shallow | SS / 3B, LF | SS / 2B, P, CF | 2B / 1B, RF |
| Fly / shallow | SS / 3B, LF | CF / SS, 2B | 2B / 1B, RF |
| Line 或 Fly / medium、deep | LF / CF | CF / LF, RF | RF / CF |

Ground 與所有 shallow 格子為 `coarseAmbiguity`。
中深層左右外野為 `sharedEdge`；中深層 middle 為 `clear`，仍可有鄰近外野支援。
`clear` 是此模型的主責分類，不保證沒有真實世界重疊。
P 目前只列為 middle 空間候選；沒有足夠精度去推論投手觸球、偏折或觸擊。
Secondary 只表示場域相關性，**不是接球者、cutoff、relay 或壘包補位指令**。
未知 physical bin、缺少 airborne depth、無 physical identity、未知 topology 回傳 unsupported，不用亂數打破歧義。

## Production 與過渡邊界

`script.js` 的 ordinary-contact callback 在呼叫既有 access/catch resolver 前先取得新責任結果。
玩家細節範圍仍限現有 2B vertical；其 admission 必須同時滿足 `primaryPosition=2B` 與 `primaryDefenderId=player`。
玩家為 SS 或 bench 不會吸引原屬 2B 的球。
飛球 actor lookup 改讀新責任；例如 shallow right 不再直接查 RF，deep left 已能產生 LF 責任，但原 catch execution 的 left-side 不支援維持不變。
玩家外野接球執行仍 deferred；這不影響新 foundation 對玩家外野 actor 的責任綁定。
只有未載入新模組的隔離舊測試環境會走原相容查詢；正式 `index.html` 在 BBP 與 TeamRoster 之後載入新模組。

## Persistence / Lifecycle

新 opportunity 是唯讀 projection，**不加入 match 或 activeSituation 持久化欄位**。
現有 BBP physical truth、active lineup、pending detailed state 已由原 save 流程保存。
Reload 後從這些 authority 重新解析，避免第三份 actor truth。
合法替換後相同球的 opportunity identity 不變，但 actor binding 改為目前守備員。
尚未執行／結算的舊 ground / line / fly detailed state 若不再匹配當前主責，production guard 明確拒絕，不改派別人、不修復 lineup。
已完成的 settlement 保持歷史身份及 exactly-once 邊界，不以後來陣容回寫歷史。

## Evidence 邊界

結果已可供未來 evidence 消費 actorId、position、opportunityFamily、responsibilityClassification、physicalIdentity。
本輪沒有新增完整 Defensive Evidence producer、evaluator grade、good/bad play 解釋或 Development 接線。

## 定向驗證

新增 foundation 測試涵蓋 21 種 physical bins、ambiguity、active/bench/replaced、alias、能力互換與禁止能力讀取、2B/SS/bench 玩家配置、穩定 identity、唯讀與無 RNG。
新增 production 測試透過正式 index 的 runtime modules，驗證 2B ground/line、fly lookup、未擴充的 execution、Lifecycle、save/reload 及 stale actor 拒絕。
既有 BBP、2B、Tag-Up、0.9、runner、roster 與 Y3 定向回歸保留；不自動跑 full suite。

本輪結果：Foundation 32/32、production integration 14/14；含既有相關套件的定向回歸共 22/22 個測試檔 PASS。

## Deferred

Reach、Secure/Catch 泛化、SS execution、player decision UI、throw/runner race、force/tag/DP 泛化、error taxonomy、cutoff/relay、pitcher/catcher special defense、bunt、shift、場地座標、背景守備敏感度、evaluator lenses、scout personalities。
未開始 1.1，未開始 SS Vertical Slice，未 commit / push。
