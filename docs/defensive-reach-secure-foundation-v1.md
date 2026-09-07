# Defensive Play Foundation 1.1 — Reach & Secure Resolution

## 基線與施工邊界

`main` / HEAD 與 origin/main：`0d05378f703d24d0c6e07d191258da8e55723123`。
施工前 ahead / behind = 0 / 0、working tree clean。
本輪不 commit、不 push、不開始 1.2 或 SS Vertical Slice。

保留 BBP physical truth、1.0 responsibility topology、0.9 active assignment、Match Situation Lifecycle、Force Advancement 與既有二壘詳細執行。
新模組不擁有出局、得分、跑者、傳球、失誤記錄或評價權限。

## 舊邏輯盤點與遷移

| 原邏輯 | 1.1 邊界 |
|---|---|
| GB access：反應／範圍加球速，固定右側玩家 2B | 有 canonical Reach 時投影為既有 access；沒有新 stage 的舊 fixture 保留原公式 |
| LD access：反應／範圍／接球合成分數 | 新 Reach 不讀接球；保留 shallow-right 2B 結構門檻及 compatibility catch window |
| Fly access：範圍／反應／接球與深度 | 新 Reach 不讀接球；詳細執行仍僅現有 NPC RF／CF 中深飛球 |
| LD／Fly execution：混合 catching、reaction、range、window 與舊 catch RNG | 新路徑改吃 generic Secure 物理結果；原 catch adapter 繼續建立 retouch／continuation，再由既有 settlement 套用 |
| 二壘 fielding window、control、transfer、throw | 保留 control／transfer／throw 公式與原 execution sample；只把已有 control 事實轉成 Secure。舊 playerLeg.reach 改讀 canonical Reach，不另判第二套到位事實 |

這是 access compatibility projection（選項 B）。二壘 ground generic Secure 純函式已可獨立使用，但**不再額外呼叫它重擲既有 ground control**。
目前二壘 detailed control 仍是舊 fielding-window authority，並非假稱已全面換成 generic hands／arrival 公式。
其 arrival quality 記錄來自 canonical Reach，control 的來源、fielding window、threshold、能力及既有 sample 均明確保留。
二壘 control 與 transfer 共用既有 execution variation 的拆分留待後續遷移；本輪不改其成功率公式。

## 對外契約

`defensive-reach-secure-foundation.js`：

- `resolveReach({physicalTruth, opportunity, activeRoster, capabilities, roll})`
- `resolveSecure({physicalTruth, opportunity, activeRoster, capabilities, reachResult, roll})`
- `projectAccess(reach)`、`projectGroundControl(reach, control, evidence)`：明確的 compatibility adapters。
- `validatePendingState(state, activeRoster)`：未結算詳細 state 的存檔／執行驗證。

輸出 deep-frozen；不修改輸入。opportunity 仍由 1.0 產生，並以目前 active roster 重新核對其既有綁定，不在 1.1 另寫守位 mapping。
不合法／過期 binding 拋 integrity error；一般不支援 detailed scope 或未到位則由既有 production fallback 接手，不強制擴大執行範圍。

Reach 帶 version、identity、opportunityIdentity、physicalIdentity、defenderId、position、supported、authority、reactionDemand、movementDemand、reachDemand、ballDemand、inputs、margin、reachQuality、reached、variationEvidence。
Secure 帶自身 identity、reachIdentity、opportunityIdentity、physicalIdentity、defenderId、position、attemptAvailable、secureDemand、quality、secured、ballState、inputs、variationEvidence、authority。

## 粗粒度 demand 與能力

所有 demand 皆為相對尺度，不代表公尺、秒數或實測機率。

- 基本 pace pressure：weak 2.5、moderate 3.5、firm 4.5、hard 6。
- GB reaction 使用 pace；movement 弱球 4.5，其餘 3，表達向前處理弱球的移動需求。
- LD reaction 在 pace 上加 shallow 2／medium 0.5／deep 0；movement 分別為 3／4／5。
- Fly reaction 為 pace × 0.5；movement 分別為 3／4／5。
- movement 加上 clear 0、sharedEdge 0.3、coarseAmbiguity 0.6；不因此更換 primary actor。
- reaction 權重 GB 0.55、LD 0.6、Fly 0.3，其餘權重為 movement。
- movement capability = range × 0.75 + mobility × 0.25。
- production 使用既有 defensive capability adapter 的 reaction／range／fielding；catching 以目前 adapter 的 fielding 對應，mobility 使用既有 offensive capability adapter 的 speed。
- 不新增永久能力，不讀角色、教練／球探評價、名聲或 Opportunity 評分。

Reach margin = 加權能力 − 加權需求 + variation。
margin ≥ 1.25：cleanArrival；0 至 1.25：stretchedArrival；小於 0：notReached。
compatibility access：clean → favored／3；stretched → possible／2；not reached → unsupported／0。

## Secure 與 live-ball state

未到位時直接回傳 notAttempted／notReached，沒有 Secure RNG 或 hands 讀取。
可到位時，generic secure pressure 為基本 pace pressure，LD 加 1、Fly 減 1；stretched arrival 再加 2。
GB hands = fielding × 0.75 + catching × 0.25；空中球 hands = catching × 0.8 + fielding × 0.2。

| 球種／條件 | secureQuality | ballState |
|---|---|---|
| 未到位 | notAttempted | notReached |
| GB margin ≥ 1.5 | cleanControl | secured |
| GB 0 ≤ margin < 1.5 | bobbleButControlled | secured |
| GB margin < 0 | notControlled | looseLiveBall |
| LD／Fly margin ≥ 0 | caughtBeforeGround | secured |
| LD／Fly margin < 0 | notCaught | groundContactLive |

Secure 本身不把 caughtBeforeGround 寫成 batter out。只有既有 catch compatibility／settlement 層處理棒球結果。
Bobble 不是官方失誤；ground legacy projection 也只讀 playerLeg.control，不從 outs／error／投傳成敗反推控球。

## Determinism 與保存

generic Reach／Secure 分別使用 `defensive-reach-v1`、`defensive-secure-v1` namespace，沿用 BBP deterministicUnit。
identity 由 physical／opportunity／actor／stage 連結，explicit roll 可注入，variation = (0.5 − roll) × 2。
無 Math.random、無共用 match RNG 消耗；上游同一球的預覽及建構呼叫會得到同一結果。

有詳細路徑的既有 handoff 保存 `defensiveAccess.reachResolution` 與 hands capability snapshot。
LD／Fly 已解析 Secure 存在 `catchResult.secureResolution`；二壘 control projection 存在 ground handoff 的 `secureResolution`。
Fly defenderContext 不另複製 reachAccess；不增加 player 頂層 state 或第二份 DefensiveOpportunity authority。

正常 repeated admission／catch execution 直接使用已存在 stage；save normalization 只驗證，不重擲。
未結算詳細 state 若 active actor、physical／opportunity link 或 stage 不一致則拒絕；不偷偷改綁替補。
已結算資料保留歷史 actor，不拿下一球的 assignment 覆寫。未進詳細路徑的 fallback 不被當作等待執行的 stage。
舊存檔沒有 Reach 時保留舊路徑，沒有補抽或新 save-version migration。

## 驗證範圍

新增 foundation 測試：37／37 cases，含 28 組球種／深度／pace，各跑左中右三方向。
新增 production 測試：12／12 cases，含 ground pause、air Secure、save/reload、不重擲、exactly-once、stale link、舊 state、未到位 fallback。
更新 1.0 production 測試：允許 Reach 保存 opportunity identity；過期已保存 Reach 在 normalizeSave 即 fail closed。
最終以 25 個 targeted test files 驗證新 foundation、production、0.9、1.0、BBP、二壘、force、third-out、lifecycle、roster match、Y3 與 save admission，25／25 PASS、0 failed。
index.html 載入的 production JavaScript 語法檢查：67／67 PASS；git diff --check：PASS。
本輪不執行全域 regression；沒有 UI 或人工試玩通過的宣稱。

## Deferred

Defensive decision／throw release／arm timing／accuracy、receiver、runner/throw race、force/tag 與 DP 泛化、官方 error／fielder's choice scoring、cutoff／relay、secondary takeover、collision／communication、P/C 特殊守備、bunt 泛化、shifts／球場座標／天候、evaluator、background PA defense sensitivity、SS Vertical Slice 全數保留。
未擴大 LF、玩家外野等既有不支援 detailed execution；foundation 可解析責任與 Reach／Secure 不等於該守位已有完整 production vertical。
