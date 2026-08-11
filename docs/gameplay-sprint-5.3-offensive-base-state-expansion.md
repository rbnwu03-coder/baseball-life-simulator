# Gameplay Sprint 5.3 — Offensive Base-State Expansion

## 1. 基線與範圍

- 起始基線：`028cffb`
- Gameplay Test Level：B+
- 類型：Offensive Base-State Model Expansion
- 正式 Runtime 整合：無新增
- Player Schema、Save、Career Architecture：維持不變

Sprint 5.2 已讓 `youth_match_grounder` 成為第一個正式 live Gameplay Integration；`high_school_year_two_spring_game` 當時僅完成 readiness 登錄，且因 Offensive Core 只支援一出局一壘有人而回報 `runner-state-unsupported`。

本 Sprint 只擴充隔離式 Offensive Core，使它精確支援一出局一壘有人與一出局二壘有人。高中春季打擊事件因此改為 `readiness-only + compatible-base-state`，但不會進入正式操作流程，也不會修改 Player。

## 2. 支援的 Base State

| Base State ID | 出局數 | 壘包 | 前位跑者起點 |
|---|---:|---|---:|
| `one-out-runner-on-first` | 1 | 一壘有人 | 1 |
| `one-out-runner-on-second` | 1 | 二壘有人 | 2 |

`situation.baseState` 是必填的精確列舉值。缺少或未知值一律 fail closed，不會自動退回一壘有人。

## 3. 一壘與二壘情境的棒球差異

一壘有人仍保留 Sprint 5.1 的雙殺、野選、跑者推進、安打與觸擊機率。二壘有人不存在一般滾地球雙殺或野選結果；玩家面對的是跑者能否推進三壘或直接得分。

二壘有人時，推打額外獲得 `baseState +1` 的 Decision Quality 修正。跑者速度仍影響推打、觸擊與安打後推進，但不會把 raw Decision Score 直接灌入 Execution。

## 4. Decision Weights

### Runner Speed

| Base State | 跑速 | 拉打 | 推打 | 握短棒 | 犧牲觸擊 |
|---|---|---:|---:|---:|---:|
| 一壘 | 慢 | -1 | 0 | 0 | -1 |
| 一壘 | 平均 | 0 | 0 | 0 | 0 |
| 一壘 | 快 | 0 | +1 | 0 | +1 |
| 二壘 | 慢 | 0 | 0 | 0 | 0 |
| 二壘 | 平均 | 0 | 0 | 0 | 0 |
| 二壘 | 快 | 0 | +1 | 0 | +1 |

### Base State

| Base State | 拉打 | 推打 | 握短棒 | 犧牲觸擊 |
|---|---:|---:|---:|---:|
| 一壘 | 0 | 0 | 0 | 0 |
| 二壘 | 0 | +1 | 0 | 0 |

一出局觸擊的 `outCost -1` 保持不變。

## 5. 二壘有人 Result Model

### 一般滾地球

| Defense Interaction | 滾地出局 | 一壘安打 |
|---|---:|---:|
| defense-advantage | 70 | 30 |
| slight-defense-advantage | 62 | 38 |
| contested | 55 | 45 |
| slight-offense-advantage | 45 | 55 |
| offense-advantage | 35 | 65 |

### 軟弱滾地球

| Defense Interaction | 滾地出局 | 內野安打 |
|---|---:|---:|
| defense-advantage | 85 | 15 |
| slight-defense-advantage | 80 | 20 |
| contested | 70 | 30 |
| slight-offense-advantage | 55 | 45 |
| offense-advantage | 45 | 55 |

平飛球、飛球與內野小飛球沿用既有結果表，但二壘跑者在出局時留在二壘。本版不實作高飛犧牲打推進、離壘過早雙殺或其他 tag-up 邏輯。

### 二壘跑者推進

- 滾地出局：依拉打／推打／握短棒、跑者速度與 `runnerAdvance` 決定停在二壘或推進三壘。
- 一壘安打：慢／平均／快跑者分別有 30%／60%／80% 機率得分，否則停在三壘。
- 內野安打：打者上一壘，原跑者留在二壘。
- 長打：原跑者得分，打者到二壘。
- 守備失誤：打者上一壘，原跑者到三壘。
- 三振、平飛球出局、飛球出局、內野小飛球出局：原跑者留在二壘。

本 Prototype 不加入全壘打、保送或觸身球。

## 6. 二壘觸擊 Result Family

| Execution | 前位跑者三壘出局 | 打者出局、跑者三壘 | 全員安全 | 觸擊安打 |
|---|---:|---:|---:|---:|
| poor-bunt | 40 | 40 | 20 | 0 |
| playable-bunt | 20 | 60 | 20 | 0 |
| good-bunt | 10 | 70 | 20 | 0 |
| excellent-bunt | 5 | 65 | 0 | 30 |

`excellent-bunt` 仍需要 Bunt 至少為 high。強守備把 10 個百分點從進攻成功端移到前位跑者三壘出局；弱守備反向移動 10 個百分點。失敗觸擊以三振處理，跑者留在二壘。

## 7. 通用 State Delta

所有進攻結果提供：

```javascript
{
  outsAdded,
  runsScored,
  batterBase,
  leadRunner: {
    fromBase,
    toBase
  },
  runnersAfter,
  inningEnded
}
```

`runnersAfter` 是後續 Base State 擴充的主要壘況真相。`runnerFromFirstBase` 只在一壘情境有值；`runnerFromSecondBase` 只在二壘情境有值，另一個相容欄位回傳 `null`。

`toBase = 0` 表示跑者出局，`toBase = 4` 表示跑者得分。

## 8. Readiness 契約

`BaseballGameplayIntegration.evaluateOffensiveEventReadiness()` 會讀取 `BaseballOffensePrototype.getSupportedBaseStates()`，不再自行硬編單一 Core Base State。

`high_school_year_two_spring_game` 現在回報：

```javascript
{
  compatible: true,
  reason: "compatible-base-state",
  requiredBaseState: "one-out-runner-on-second",
  supportedBaseStates: [
    "one-out-runner-on-first",
    "one-out-runner-on-second"
  ]
}
```

事件 Registry 仍為 `mode: "readiness-only"`。本 Sprint 沒有建立進攻 Runtime resolver、Player mutation、pending state、結果旗標、Outcome renderer 或 Save guard。
