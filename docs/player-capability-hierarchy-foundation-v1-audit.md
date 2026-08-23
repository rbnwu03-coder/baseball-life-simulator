# Player Capability Hierarchy Foundation v1 — Automated Audit

## 結論

本 Foundation 已建立正式資料因果鏈：

```text
完成三點配置的 Character Genesis
→ deterministic Initial Baseball Skill Generation
→ Youth Event Outcomes／Synthetic Youth Origin
→ HS Entry Capability Settlement
→ player.baseballSkills authoritative truth
→ Position／Context capability adapters
→ Match evidence
```

`player.baseballSkills` 仍是唯一 final skill truth。`player.capabilityState` 保存 initialization、公式與 settlement 版本、Initial Skill snapshot、Youth Outcomes、位置／專項經驗、Development Profile 與 provenance，不複製另一份可獨立修改的 final skills。

本輪沒有調整 Match window、route threshold、Opportunity one-shot cap、runner state、PA outcome 或 opponent strength。

## Initial Skill Generation v1

- Formula version：`initial-skills-v1`
- 輸入：完成三點 allocation 後的六項 Genesis final abilities。
- Trait delta：`TraitValue - 3`。
- Variation：由 character identity／final Genesis／handedness 與 skill key deterministic derivation，逐 skill 落在 `-0.5～+0.5`；不呼叫 `Math.random` 或 Match RNG。
- Universal initial provisional range：round、clamp 至 `1–7`。
- Specialist initial value：`0`。
- Ideal Self 只加入指定的 `+0.25／+0.5` Starting Bias；不改 Genesis、不啟動 specialist、不產生 Overall Rating。

## HS Entry Settlement v1

- Settlement version：`hs-entry-capability-v1`
- Universal：catching、throwing、batting、baseRunning、baseballIQ、armStrength、reaction、range 必須為 numeric `1–20`。
- Specialist：blocking、gameCalling、control、pitchStamina 必須為 numeric `0–20`；`0` 明確表示尚未建立專項經驗。
- Settlement 不重新 roll、不重套 Ideal Self、不重套已 resolved Youth Outcome，也沒有升高中 bonus。
- 第二次呼叫直接回傳既有合法 state，skills、outcomes 與 ledger 不變。
- 正式高中 Match admission 會拒絕未完成 settlement、缺少 universal、版本不符或非法 handedness 的 player。

## Youth Outcome 與 Direct Start

正式 outcome contract 保存 eventId、choiceId、skill deltas、position experience、specialist experience、identity seeds、relationship deltas、provenance 與 resolved seed。

普通 outcome 最多一個 `+1` skill effect；milestone 最多兩項各 `+1`。Position Experience 與 Baseball Skill 分開，不產生 position overall。

Direct Start 的 deterministic Synthetic Youth Origin 由四個合法 outcome 組成：

| Outcome | Skill | 其他結果 |
|---|---:|---|
| basic catch reps | catching +1 | 內野經驗 +1 |
| throwing form | throwing +1 | 內野經驗 +1 |
| first-step work | reaction +1 | 內野經驗 +1 |
| assignment review | baseballIQ +1 | identity seed |

它與 Narrative-equivalent fixture 共用相同 Initial Formula、Settlement、Validation、skill scale 與 provenance semantics；沒有 `if directStart: catching = 5` 類型的 path patch。

## Save／Migration

- 新 save 直接保存 finalized `baseballSkills` 與完整 capability metadata。
- Reload 不重新生成 variation、不重套 outcomes，也不因目前公式改動重算舊角色。
- 舊 save 優先保留既有正值技能；missing／zero universal 以舊 Genesis 或明確 neutral-3 deterministic default 恢復。
- Migration 不呼叫 `Math.random` 或 Match RNG；重複 normalize/load 不造成 stat drift。
- Migration provenance 記錄 source save version、migration version、default policy 與既有值保留策略。

## 100 人 Capability Audit

Normal Narrative-equivalent 使用合法 Youth Outcome fixture，只驗證資料契約，不宣稱是完整少年篇 population distribution。

### Direct Start

| Skill | Min | Mean | Max |
|---|---:|---:|---:|
| catching | 3 | 4.21 | 5 |
| throwing | 3 | 4.18 | 5 |
| batting | 1 | 2.40 | 3 |
| baseRunning | 1 | 2.27 | 4 |
| baseballIQ | 4 | 4.69 | 6 |
| armStrength | 1 | 2.52 | 4 |
| reaction | 3 | 3.77 | 5 |
| range | 2 | 2.81 | 4 |

- Settlement completion：100/100。
- Universal zero：0/800。
- Specialist zero：400/400，符合「尚無專項經驗」語意。

### Normal Narrative-equivalent

| Skill | Min | Mean | Max |
|---|---:|---:|---:|
| catching | 3 | 4.21 | 5 |
| throwing | 2 | 3.18 | 4 |
| batting | 1 | 2.40 | 3 |
| baseRunning | 1 | 2.27 | 4 |
| baseballIQ | 4 | 4.69 | 6 |
| armStrength | 1 | 2.52 | 4 |
| reaction | 3 | 3.77 | 5 |
| range | 3 | 3.81 | 5 |

- Universal zero：0/800。
- Specialist zero：400/400。
- Direct 與 Narrative-equivalent 的總體量級相同，個別差異可追溯至 synthetic throwing outcome 與 narrative-equivalent range outcome。

## Representative Profiles

四種 fixtures 都透過正式 Genesis、Initial Formula、Synthetic Outcomes 與 Settlement 產生：

- `ordinary`：全能型、均衡 allocation。
- `defense`：守備型、球感／觀察／體能 allocation。
- `batting`：強打型、打擊集中 allocation。
- `low`：低能力但所有 universal 合法，specialist 維持 0。

六種 Ideal Self same-seed comparison 會形成小幅 target differentiation；全能型沒有 `+0.5`，也不是所有技能的最高者。

## 2B Opportunity Re-diagnostic

使用四種 representative profiles 輪替跑 500 場完整比賽：

| Metric | Result |
|---|---:|
| completed matches | 500/500 |
| defensive responsibility | 1,222 |
| legal routes | 1,968 |
| viable routes | 1,741 |
| viable route rate | 88.465% |
| expired routes | 227 |
| expired rate | 11.535% |
| multi-route situations | 489 |
| meaningful decisions | 489 |
| zero-defense games | 11/500（2.2%） |

相較修正前 Direct fixture 的 80.192% expired 與 67% zero-defense，結果支持：先前異常主要來自 capability initialization defect，而非需要立即調低 Decision／route threshold。

本診斷不是最終 gameplay balance 結論；完整 Youth content 與 population model 仍未完成。

## Automated Validation

- Player Capability Hierarchy Foundation v1：43/43 PASS。
- Direct Start audit：100 deterministic characters。
- Narrative-equivalent audit：100 deterministic characters。
- Representative 2B diagnostic：500/500 completed。
- Match thresholds 保持 `<1.75 / <3.5 / <5.5 / ≥5.5`。
- Full regression 結果以本 Sprint 最終 closeout report 為準。
