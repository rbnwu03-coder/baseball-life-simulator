# Baseball Match Foundation 2.2.4.3 — Player Opportunity Distribution Audit

## 1. Executive Summary

本報告只量測既有 production simulation，不調整玩法。Audit 使用正式 Character Genesis／High School Full Match Direct Start 建立相同能力的二壘手，透過 Node virtual-time runner 完整跑完 1,000 場 Bench 與 400 場 Starter Featured Matches。

主要結論：

- Bench 的「5 局下、0 出局、空壘、立即成為該半局第一位打者」是 1,000/1,000 的 **Structural Scripted Behavior**，不是機率結果。
- Bench 平均 2.029 PA；第一次 scripted offensive Decision 固定 1.000 次，後續 live-state emergent offensive Decision 平均 0.925 次，92.5% 的比賽會出現一次。
- Bench 零 defensive meaningful Decision 為 15/1,000（1.5%）；若假設獨立同分布，連續五場皆為零的機率為 `0.015^5 = 7.59375e-10`，即 0.00000007594%。
- Starter 的在場防守 PA 是 Bench 的 2.98 倍（40.253 vs 13.486），但 defensive Decision 只由 0.985 增至 1.000；原因是目前 Vertical Slice 在第一次 defensive meaningful Decision 後關閉後續 defensive Decision window，每場最多一次。
- Bench defensive funnel 的主要流失發生在 interaction window／exposure（42.57% rejection）、沒有 relevant responsibility（33.82%），以及 route legal／viable availability（合計 23.61%）。進入「至少兩個 distinct commitments」後 985/985 全部升格為 Decision，樣本中沒有證據顯示 Meaningful Gate 本身過嚴。
- 自然生成只看見 `secureFirstBaseOut` 與 `initiate463` 可用；`coverSecondFor643`、`attackLeadRunnerThird`、`preventRunHome`、`homeForceOut` 在 1,400 場中皆為 Never Seen。

## 2. Existing Structural Guarantees

### Player Entry

`prepareHighSchoolYearOneMatch()` 的正式 role assignment 為：Starter 從第 1 局先發；Rotation 的 entry window 是第 4 局；Bench 的 entry window 是第 5 局。`shouldEnterHighSchoolMatchPlayer()` 還要求主隊進攻、下半局、未完成進場且少於三出局。

進入每個新下半局時出局數與壘況先重設，因此 Bench 在第 5 局下半第一次 playback check 就符合條件。`enterHighSchoolMatchPlayer()` 把玩家插入當前 `battingOrderIndex.home`、設為 substitute，並直接設定 `currentBatter = "player"`。這不依 RNG、比分或壘況；比分只被原樣沿用。

### Offensive Decisions

- Scripted／Guaranteed：`shouldCreateHighSchoolFirstOffensiveMoment()` 在玩家進場後成為當前打者時建立 moment 1。Bench 1,000/1,000、Starter 400/400 都正好一次。
- Naturally Emergent：moment 3 必須等 defensive moment 已 resolve、至少到 target inning，且 live batting order 再次輪到玩家。Bench 925/1,000、Starter 399/400 出現一次。
- Routine PA：不符合上述 moment trigger 時，玩家打席走正式 routine PA simulation。

### Defensive Involvement

只讀 adapter 以既有 simulation log、defensive situation、responsibility、route availability 與 decision gate 為 truth：

- Routine：`playerRoutinePlay`。
- Attention：已呈現的 defensive routine attention beat 加上 defensive `meaningfulMomentReached`；這是 presentation overlay，與 Routine／Decision 不是互斥分類。
- Meaningful Decision：defensive `meaningfulMomentReached`。
- Coverage：responsibility role 為 `cover`／`coverPivot`。
- Primary fielding：responsibility role 為 `primaryFielder`／`initiator`。

## 3. Bench 2B Distribution

Audit seeds：`22430000`–`22430999`，共 1,000 場。

| Entry metric | 結果 |
|---|---:|
| Inning | 5：1,000（100%） |
| Half | 下：1,000（100%） |
| Outs | 0：1,000（100%） |
| Bases | empty：1,000（100%） |
| Immediate first batter | 1,000（100%） |
| Entry event | `playerEntry`：1,000（100%） |

上述 inning／half／outs／bases／first batter 全部是 **Structural Scripted Behavior**。

進場打序位置分布（1-based）：第 1 棒 75、第 2 棒 160、第 3 棒 146、第 4 棒 219、第 5 棒 59、第 6 棒 110、第 7 棒 125、第 8 棒 13、第 9 棒 93。玩家不是固定棒次，而是取代第 5 局下開始時的 current batting-order slot。

進場比分差（主隊－客隊）：`-5: 8`、`-4: 16`、`-3: 11`、`-2: 75`、`-1: 189`、`0: 254`、`+1: 148`、`+2: 101`、`+3: 94`、`+4: 47`、`+5: 23`、`+6: 27`、`+7: 7`。比分不控制 entry。

| Bench metric | Min | P25 | Median | Mean | P75 | Max |
|---|---:|---:|---:|---:|---:|---:|
| Player PA | 1 | 2 | 2 | 2.029 | 2 | 5 |
| Defensive innings | 2 | 2 | 2 | 2.156 | 2 | 7 |
| Defensive PA | 8 | 12 | 13 | 13.486 | 14 | 39 |
| Defensive balls in play | 8 | 11 | 12 | 12.287 | 13 | 34 |
| Player involvement | 2 | 3 | 4 | 3.936 | 5 | 8 |

全場 PA 有 63.643% 發生在玩家進場前。玩家實際在場防守半局占全場客隊進攻半局平均 29.803%，中位數為 28.571%（通常只剩 6 上與 7 上）。

## 4. Starter 2B Distribution

Audit seeds：`22431000`–`22431399`，共 400 場。使用與 Bench 相同 Character Genesis／能力 fixture，只以既有正式 role assignment 建立 Starter 對照。

| Starter metric | Min | P25 | Median | Mean | P75 | Max |
|---|---:|---:|---:|---:|---:|---:|
| Player PA | 3 | 4 | 4 | 3.865 | 4 | 7 |
| Defensive innings | 7 | 7 | 7 | 7.273 | 7 | 11 |
| Defensive PA | 31 | 37 | 39 | 40.253 | 42 | 60 |
| Defensive balls in play | 29 | 34 | 35 | 36.180 | 38 | 56 |
| Player involvement | 2 | 3 | 4 | 4.285 | 5 | 9 |

Starter 從 1 局上開始在場，防守半局 share 為 100%；固定第 6 棒，但不會被強制設成開局第一位打者。

## 5. Offensive Opportunity

| Metric | Bench 2B | Starter 2B |
|---|---:|---:|
| Scripted offensive Decision / game | 1.000 | 1.000 |
| Scripted 0／1／2+ | 0%／100%／0% | 0%／100%／0% |
| Emergent offensive Decision / game | 0.925 | 0.9975 |
| Emergent 0／1／2+ | 7.5%／92.5%／0% | 0.25%／99.75%／0% |
| First scripted only、後續無 offensive Decision | 7.5% | 0.25% |

Bench 的 scripted Decision 全部發生在 PA1；925 次 emergent Decision 全部發生在 PA2。Starter 的 scripted Decision 也在 PA1；399 次 emergent Decision 中，371 次在 PA3、28 次在 PA4+。

## 6. Defensive Funnel

### Bench 2B

| Funnel layer | Count | Conversion from previous |
|---|---:|---:|
| Player on defense PA | 13,486 | — |
| Decision window active／checked | 8,164 | 60.54% |
| Relevant ball／responsibility trigger | 3,936 | 48.21% |
| Player involvement | 3,936 | 100.00% |
| At least one viable route | 2,663 | 67.66% |
| At least two distinct commitments | 985 | 36.99% |
| Meaningful Decision | 985 | 100.00% |

### Starter 2B

| Funnel layer | Count | Conversion from previous |
|---|---:|---:|
| Player on defense PA | 16,101 | — |
| Decision window active／checked | 2,697 | 16.75% |
| Relevant ball／responsibility trigger | 1,714 | 63.55% |
| Player involvement | 1,714 | 100.00% |
| At least one viable route | 1,209 | 70.54% |
| At least two distinct commitments | 400 | 33.09% |
| Meaningful Decision | 400 | 100.00% |

Starter 的 window-active conversion 較低，不是較少在場，而是它通常在 2–3 局已完成唯一 defensive moment；之後剩餘 PA 繼續模擬，但不再進入 defensive Decision pipeline。

## 7. Decision Gate Rejection Reasons

| Rejection reason | Bench count | Bench share | Starter count | Starter share |
|---|---:|---:|---:|---:|
| `window-expired` | 5,322 | 42.57% | 13,404 | 85.37% |
| `no-player-responsibility` | 4,228 | 33.82% | 983 | 6.26% |
| `only-one-legal-route` | 1,662 | 13.29% | 666 | 4.24% |
| `only-one-viable-route` | 1,289 | 10.31% | 648 | 4.13% |
| `duplicate-commitment` | 0 | 0% | 0 | 0% |
| `execution-only` | 0 | 0% | 0 | 0% |
| `no-real-tradeoff` | 0 | 0% | 0 | 0% |
| `player-not-primary-role` | 0 | 0% | 0 | 0% |
| `routine-coverage` | 0 | 0% | 0 | 0% |

`window-expired` 在此表示既有 Vertical Slice defensive interaction window 已完成／關閉，而非改寫棒球局面的判定。所有非 Decision 防守 PA 都能對上上述唯一一項 rejection。

## 8. Route Frequency

| Second Base route | Bench available | Bench executed | Starter available | Starter executed | Status |
|---|---:|---:|---:|---:|---|
| `secureFirstBaseOut` | 2,663 | 2,663 | 1,209 | 1,209 | Naturally seen |
| `initiate463` | 985 | 0 | 400 | 0 | Available；固定 audit choice policy 未選 |
| `coverSecondFor643` | 0 | 0 | 0 | 0 | Never Seen |
| `attackLeadRunnerThird` | 0 | 0 | 0 | 0 | Never Seen |
| `preventRunHome` | 0 | 0 | 0 | 0 | Never Seen |
| `homeForceOut` | 0 | 0 | 0 | 0 | Never Seen |

Runner 對每個 Decision 固定選第一個合法 choice，因此 execution frequency 不是玩家偏好分布；route availability 才是本輪自然生成能力的主要證據。1,400 場都沒有自然產生 coverage role，所有已分類 involvement 都是 primary-fielding／initiator。

## 9. Interaction Density

| Metric | Bench 2B | Starter 2B |
|---|---:|---:|
| Defensive Routine / game | 1.678 | 2.023 |
| Defensive Attention / game | 2.663 | 3.023 |
| Defensive Meaningful Decision / game | 0.985 | 1.000 |
| 0／1／2+ defensive Decision | 1.5%／98.5%／0% | 0%／100%／0% |
| Total Decision min／median／mean／max | 1／3／2.910／3 | 2／3／2.9975／3 |

Bench total Decision count：0 次 0、1 次 15、2 次 60、3 次 925、4 次 0、5+ 次 0；只有一次互動的比賽為 1.5%。Starter：2 次 1、3 次 399，其餘為 0。

Bench 所有 3,936 次 defensive involvement 中，1,678（42.63%）成為 Routine、985（25.03%）成為 Meaningful Decision、1,273（32.34%）因無 viable route 而沒有 player-facing attention beat。2,663 個實際 defensive attention beats 中，Routine 占 63.01%、Decision 占 36.99%。

Bench 共 2,910 次玩家 Decision：1,000 次 scripted offense（34.36%），925 次 emergent offense 加 985 次 emergent defense（65.64%）。Starter 共 1,199 次：scripted 33.36%，emergent 66.64%。Guaranteed 與 Emergent 未混合計算。

## 10. Human Five-Game Pattern

| 人工觀察 | Audit 判定 |
|---|---|
| 五場都在 5 下進場 | 100% Structural Scripted Behavior |
| 五場都成為該半局第一打者 | 100% Structural Scripted Behavior |
| 五場都 0 defensive Decision | 單場 1.5%；獨立五連為 0.00000007594%，在本 seed 分布下極不常見 |
| 五場都有首次 offensive Decision | 100% Structural Scripted Behavior |
| 後續幾乎無 offensive Decision | 與 Audit 不符；92.5% Bench matches 有一次 PA2 emergent offensive Decision |

因此人工五場中的 entry／first PA 部分可由結構完全解釋；defensive zero 與 later offense 部分不能由本 Audit 分布解釋。產品複核時應先確認人工場次是否使用相同版本、正式 Featured Match route、角色／守位與完整 Continue 流程，而不是直接調高 Decision 機率。

## 11. Findings

1. Q1：Bench 2B 第五局進場完全固定；1,000/1,000 都是 5 局下。
2. Q2：玩家立即打擊是因 entry function 插入當前打序並直接設定玩家為 current batter；這是 Structural Scripted Behavior。
3. Q3：Bench 平均 2.029 PA（min 1、median 2、max 5）。
4. Q4：第一次以外的 emergent offensive Decision 出現在 92.5% Bench matches，平均 0.925/game；全部是 PA2。
5. Q5：Bench 完全沒有 defensive Decision 的比例為 1.5%。
6. Q6：Starter 將零防守 Decision 從 1.5% 降至 0%，但平均只由 0.985 增至 1.000；更大的差異是防守 exposure 由 13.486 PA／2.156 innings 增至 40.253 PA／7.273 innings。
7. Q7：稀少機會主要卡在 interaction window／Exposure、Responsibility 與 Route Availability；一旦形成至少兩個 distinct commitments，1,385/1,385 全部通過 Meaningful Gate。
8. Q8：Bench 每場平均 1.000 次 scripted interaction、1.910 次 emergent interaction；按全部 Decision 計算為 34.36% scripted、65.64% emergent。但 emergent 結構仍被 Vertical Slice 限制為最多一次 defense 與一次 later offense。

Experience archetypes（Bench）：

- Type A — scripted offense only、0 defense：15（1.5%）。
- Type B — scripted + emergent offense、0 defense：0（0%）。
- Type C — scripted + defense、無 later offense：60（6.0%）。
- Type D — scripted + defense + emergent offense：925（92.5%）。

Sequence repetition：`5下 → 0 OUT → empty → player enters → first batter → scripted Decision` 為 1,000/1,000（100% deterministic structural behavior）。

## 12. No-Change Recommendation

本輪不建議直接調高 Decision 機率或放寬 Meaningful Gate。數據支持先做產品判斷：

- Hypothesis A（未施工）：Entry model 的重複感主要來自完全固定的 Structural Scripted Behavior。
- Hypothesis B（未施工）：Bench exposure 較短會造成少量零 defense Decision，但目前零率只有 1.5%。
- Hypothesis C（未施工）：Offensive emergent opportunity 並不稀少；若人工看不到，優先檢查實際 route／版本／Continue 行為。
- Hypothesis D（未施工）：Second Base 自然 situation generation 只產生兩種 route，coverage 與 lead-runner／home routes 在大量模擬中完全缺席，值得下一階段產品決策。
- Hypothesis E（未施工）：目前 defensive Vertical Slice 每場最多一次 meaningful Decision；Starter 的額外 exposure 大多在 window 關閉後，因此不會線性增加互動數。

已知限制：Starter 是保持相同能力 fixture 的受控 role comparison；固定第一合法 choice 與固定 execution sample 讓所有場次可比較，但 route execution 不代表真實玩家選擇偏好。Audit 沒有量測 UI pacing，也沒有改動任何 production gameplay、entry、RNG、PA outcome、route、Second Base logic、敘事或平衡參數。
