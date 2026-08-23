# Baseball Match Foundation 2.2.4.5 — Direct Start Capability Parity Audit

> 歷史稽核註記：本文件記錄 Player Capability Hierarchy Foundation v1 施工前的 root-cause 狀態。其「尚無 settlement／representative fixture」結論已由後續 [Player Capability Hierarchy Foundation v1 Audit](./player-capability-hierarchy-foundation-v1-audit.md) 解決；保留本文件作為修正前證據，不回寫當時數據。

## Executive conclusion

Full Match Direct Start 目前是 **Type A — Structural Test Fixture**，適合 playback、scoreboard、save/reload、route integrity 與 runner conservation，不適合用來判斷 gameplay balance、Decision distribution、readiness 或一般高一球員體驗。

問題不只是 Direct Start 漏掉一個現成 helper。Repository 目前沒有完整的 `Genesis → pre-HS development settlement → high-school-ready baseballSkills` bridge。Direct Start 的 synthetic pre-HS history 完全不增加技能；Normal High School Narrative 到 featured match 前，第一選項路徑也只增加 `catching +1`、`reaction +1`、`baseballIQ +1`。因此不能從現有 production pipeline建立可信的 Representative Gameplay Fixture，也不能合法手寫一組看似合理的能力。

本輪只新增 read-only snapshot 與 test-only audit，沒有改動 gameplay、progression、Decision Gate、route legality／viability、execution window、RNG、PA outcome 或 balance。

## Capability data flow

```text
Genesis roll（六項各 1–3，總和 12）
→ Allocation（3 點，單項最多 2）
→ applyCharacterGenesis()
   ├─ ballSense／observe／fitness → player top-level stats
   └─ batting／baseRunning／baseballIQ → player.baseballSkills
→ Ideal Self → identity／archetype metadata；不直接加能力
→ synthetic pre-HS history → route／position history／relationships／flags／memory；不加能力
→ Narrative choices／training → applySkillEffects()／applyPositionSkillEffects()
→ player.baseballSkills（0–20）
→ getDefensiveSimulationCapability()
→ deriveInfieldExecutionWindows()
→ deriveSecondBaseExecutionWindows()
→ evaluateDefensiveRouteAvailability()
→ readiness／Meaningful Decision Gate
```

六項 Genesis 對 Featured Match 的正式入口：

| Genesis ability | Match usage |
|---|---|
| `ballSense` | defensive fielding／reaction；offensive contact |
| `observe` | defensive throwing／decision；offensive contact／discipline |
| `fitness` | defensive range／arm；offensive power／speed |
| `batting` | 寫入 `baseballSkills.batting`，進入 contact／power |
| `baseRunning` | 寫入 `baseballSkills.baseRunning`，進入 speed |
| `baseballIQ` | 寫入 `baseballSkills.baseballIQ`，進入 defensive decision／offensive discipline |

## Ideal Self architecture

正式六種值是全能型、強打型、技巧型、守備型、速度型、棒球理解型。`applyCharacterGenesis()` 只把選擇寫進 `characterGenesis.archetype`；Ideal Self 參與 narrative identity、coach alignment 與部分後續判定，但不直接加 Genesis、baseballSkills 或 derived Match capability。

相同 20 個 Genesis seeds、相同 allocation 下，六種 Ideal Self 的所有 defensive capability signatures 完全相同。「守備型」不會自動得到 catching、throwing、reaction、range 或 armStrength。

## Baseball skills inventory

所有正式 baseball skills 初始值都是 0；`applySkillEffects()` 將結果限制在 0–20。

| Skill | Initialization／development source | Featured Match usage |
|---|---|---|
| catching | default 0；事件／守位訓練 | infield／outfield fielding |
| throwing | default 0；事件／傳球訓練 | infield arm、throwing；多守位傳球 |
| batting | Genesis mapping；事件／訓練 | contact、power、offensive moment score |
| baseRunning | Genesis mapping；事件／訓練 | player speed |
| baseballIQ | Genesis mapping；事件／戰術準備 | defensive decision、offensive discipline |
| armStrength | default 0；事件／訓練 | outfield arm；二壘 fallback adapter目前不讀此欄 |
| reaction | default 0；事件／守備腳步 | fielding、reaction，並在 range=0 時成為 range fallback |
| range | default 0；事件／守備腳步 | range |
| blocking | default 0；捕手事件 | catcher fielding tool |
| gameCalling | default 0；捕手事件 | catcher reaction／decision-side tool |
| control | default 0；投手事件 | pitcher fielding tool |
| pitchStamina | default 0；投手事件 | progression／role；目前 featured defensive adapter沒有直接讀取 |

Save migration 只合併既有值與 default 0，不建立年齡基準。Development runtime 及後續事件能逐點增加技能，但沒有在高中入口前進行統一 capability settlement。

## Second Base capability adapter

指定二壘手是 match responsibility override，不會改 canonical primary position，也不會加技能。由於 `二壘手` 不在 generic position tool map，adapter 使用 infield fallback：

```text
fielding = round((catching×2 + reaction + ballSense) / 4)
reaction = round((reaction×2 + ballSense) / 3)
range    = round(((range || reaction)×2 + fitness) / 3)
arm      = round((throwing×2 + fitness) / 3)
throwing = round((throwing×2 + observe) / 3)
decision = round((baseballIQ + observe + discipline) / 3)
```

因此 raw defensive skills 全為 0 時，Genesis top-level stats 仍會形成 0–3 的 derived capability；但這些值非常容易讓 route window expired。`armStrength` 對目前二壘 adapter沒有作用。

## Meaning of zero and scale

Code truth 的 skill scale 是 0–20。現有 tests 常以 2 表示低能力、5 表示中段測試值、8–10 表示較強能力，20 是上限；simulation roster 的 defense／arm 約落在 4–8。

玩家的 0 來自 `createInitialPlayer()` default，語意較接近「尚未透過正式成長建立」，不是一個明確定義的普通高一基準。但 Match Engine 會把它當低能力輸入計算；少數公式又用 `||` 將 0 換成 reaction 或 fallback 5。這種語意不一致正是 Capability Hierarchy Foundation 尚未完成的證據。

## Direct Start and Narrative initialization

Direct Start：

```text
Character Genesis
→ applyHighSchoolDirectStartHistory()
→ enterHighSchool()
→ highSchoolStep = 5
→ resolveHighSchoolProvisionalRole()
→ prepareHighSchoolYearOneMatch()
```

`applyHighSchoolDirectStartHistory()` 只補 route、過去結果、內野手履歷、relationship、impression、character arc、flags 與 memory，完全不寫 baseballSkills。

Normal High School Narrative audit：

```text
同一 synthetic pre-HS
→ high_school_intro choice 0
→ high_school_load choice 0
→ high_school_life choice 0
→ high_school_role choice 0
→ high_school_long_bench choice 0
→ featured match
```

逐步 attribution：

- Synthetic pre-HS：defensive skills 全 0。
- Intro／Load／Life：增加 discipline、responsibility 等 general state；不增加 raw defensive skills。
- Role：依內野手 position effects 增加 catching 1、reaction 1。
- Long Bench：增加 baseballIQ 1。

## Capability distributions

固定 allocation：ballSense 1、observe 1、baseballIQ 1。

### Six-archetype Direct Start, 20 seeds each

六種 archetype 的 raw defensive distributions 完全相同：

| Skill | Min | Median | Mean | Max |
|---|---:|---:|---:|---:|
| catching | 0 | 0 | 0 | 0 |
| throwing | 0 | 0 | 0 | 0 |
| reaction | 0 | 0 | 0 | 0 |
| range | 0 | 0 | 0 | 0 |
| armStrength | 0 | 0 | 0 | 0 |

這是 **Structural Capability Initialization Gap**，不是守備型 balance 問題。

### Direct Start vs Narrative, same 100 Genesis seeds

| Capability | Direct min／median／mean／max | Narrative min／median／mean／max |
|---|---:|---:|
| Genesis ballSense | 2／3／2.76／4 | 2／3／2.76／4 |
| Genesis observe | 2／3／2.80／4 | 2／3／2.80／4 |
| Genesis fitness | 1／2／1.85／3 | 1／2／1.85／3 |
| baseballSkills.baseballIQ | 4／4／4／4 | 5／5／5／5 |
| catching | 0／0／0／0 | 1／1／1／1 |
| throwing | 0／0／0／0 | 0／0／0／0 |
| reaction | 0／0／0／0 | 1／1／1／1 |
| range | 0／0／0／0 | 0／0／0／0 |
| armStrength | 0／0／0／0 | 0／0／0／0 |
| derived fielding | 1／1／1.00／1 | 1／2／1.57／2 |
| derived reaction | 1／1／1.00／1 | 1／2／1.57／2 |
| derived range | 0／1／0.64／1 | 1／1／1.21／2 |
| derived arm | 0／1／0.64／1 | 0／1／0.64／1 |
| derived throwing | 1／2／1.61／2 | 2／2／2.19／3 |
| derived decision | 3／3／3.00／3 | 5／6／5.61／6 |

20/20 same-seed comparisons保留完全相同 Genesis；差值來自 path。Narrative 確實顯著改善 window，但 raw skills 仍只有 0–1，因此不能宣稱這是普通高一代表分布。

## Window sensitivity

Production threshold：`<1.75 expired`、`1.75–<3.5 narrow`、`3.5–<5.5 normal`、`≥5.5 wide`。

受控 normal ground ball、batter／runner speed 5：

| Situation／window | Direct | Narrative |
|---|---:|---:|
| S1 空壘，firstBaseOut | 1.40 expired | 2.09 narrow／viable |
| S2 一壘有人，firstBaseOut | 1.40 expired | 2.09 narrow／viable |
| S2 一壘有人，doublePlay | 0.37 expired | 0.89 expired |
| S3 滿壘，firstBaseOut | 1.40 expired | 2.09 narrow／viable |
| S3 滿壘，doublePlay | 0.37 expired | 0.89 expired |
| S3 滿壘，homeOut | -0.44 expired | 1.07 expired |

Normal Narrative 的少量能力足以打開最基本的一壘 route，但仍打不開受控 double-play 或 home-force window。

## 100-match capability funnel

相同 100 組 Genesis／match seeds，Bench 2B：

| Funnel | Direct Start | Narrative |
|---|---:|---:|
| defensive PA traced | 1,295 | 1,398 |
| responsibility checks before one-shot resolution | 770 | 394 |
| legal routes | 1,247 | 695 |
| expired legal routes | 1,000（80.19%） | 321（46.19%） |
| viable routes | 247（19.81%） | 374（53.81%） |
| multi-route situations | 33 | 96 |
| meaningful defensive Decisions | 33 | 96 |
| zero defensive Decision | 67/100 | 4/100 |
| later offensive Decision | 27/100 | 86/100 |

Responsibility totals不能直接解讀為 exposure：Narrative 更早建立並解決唯一 defensive Decision，之後 one-shot window 關閉，不再繼續累積同層 responsibility checks。結果仍清楚顯示 capability state 對 viable／multi-route／Decision distribution 有巨大影響。

## Seed 81438

在 current build、固定 Genesis seed 81438、固定 allocation、守備型、Bench 2B 下：

| Metric | Direct | Narrative |
|---|---:|---:|
| defensive responsibility | 9 | 4 |
| viable-route situations | 4 | 3 |
| multi-route | 0 | 1 |
| defensive Decision | 0 | 1 |
| later offense | 0 | 1 |

Direct derived defense 為 fielding 1、reaction 1、range 1、arm 1、throwing 2、decision 2；Narrative 為 2、2、1、1、2、5。

目前重播沒有重現人工 trace 的「22 responsibility、0 viable routes」，也沒有出現所描述的 6上1 out一壘、8上2 out滿壘、9上0 out一壘三個 exact captures。這表示單獨的 match seed 不足以重建人工場次；還需要原 Genesis roll／allocation、choices 與 runtime signature。`81438` 應保留為 regression identifier，但必須搭配完整 capability fixture／trace。

由於原始完整 situation payload 未附於本輪，三個文字描述局面使用同一 production formula、normal ground ball 與固定 speed 5 做 controlled comparison：

- 6上1 out一壘：Direct 的 first／DP 都 expired；Narrative 只有 first viable，DP expired。
- 8上2 out滿壘：Direct 的 first／home 都 expired；Narrative 只有 first viable，home expired。
- 9上0 out一壘：與同能力／同球況的 6上結果相同；Direct 全 expired，Narrative 只有 first viable。

## Root cause and interpretation

1. Direct Start 確實以創角完成當下的能力直接進入比賽。
2. 它跳過正常高一 event effects，也沒有 pre-HS skill settlement。
3. Synthetic pre-HS 的原始作用是補敘事 continuity 與有限履歷，不是 capability normalization。
4. Normal Narrative 有局部 event bridge，但到 featured match 前仍只有 0–1 raw defensive skill，無法提供可被稱為高一普通球員的 production distribution。
5. 因此 exact root cause 是 **Capability Hierarchy / Development Bridge 尚未建立**；Direct Start 又進一步跳過局部高一 effects，使問題更嚴重。

2.2.4.3 的 1.5% zero-defense rate 應重新標記為「特定 fixed Genesis／allocation 的 Structural Direct Start Distribution」，不能代表一般 Human gameplay。其 audit runner 本身仍 deterministic 且正確，但 fixture capability 不具產品代表性。

## Recommended next architecture step

下一步應先建立 Capability Hierarchy Foundation：明確定義 Genesis、年齡／階段、訓練證據、守位技能與 Match capability 之間的 production bridge，以及 skill 0 的唯一語意。完成後再讓 Direct Start 透過同一正式 settlement 建立 Representative Match Test Entry。

目前沒有可安全補上的既有 missing call，因此不提出「呼叫現成 helper」式 narrow fix，也不應先修改 Match Opportunity viability。完成 capability foundation 後，再用保留的 `81438` trace 與代表性 500-match distribution 決定 Opportunity Foundation。

## Deferred

- Representative Gameplay Fixture 與 500-match distribution：前提未成立，未建立。
- Match Opportunity legality／viability／readiness／Decision Gate：未修改。
- Game Settlement：未處理。
- SS 與其他守位 capability／route foundation：未開始。
