# School Invitation Foundation v1 — Architecture & Population Audit

Audit date: 2026-08-23
Baseline: `e632297 feat: establish match and player capability foundations`
Contract version: `school-invitation-v1`

## 1. Scope and conclusion

本 Foundation 建立以下資料鏈：

```text
High School Entry Capability Settlement
→ Recruiting Capability Match
→ Position Need
→ School Interest
→ Projected Role
→ Deterministic Four-School Invitation Set
```

結論：Architecture PASS、v1 42/42 focused assertions PASS、v1.0.1 35/35 focused assertions PASS、1,000/1,000 generated sets valid。

本 Sprint 沒有實作 Invitation Letter UI、School Choice route、training multiplier、完整 roster、Team Strength simulation 或 Match balance change。

## 2. Single source of truth

- Final player skill truth：`player.baseballSkills`。
- Capability metadata/provenance：`player.capabilityState`。
- School Invitation persisted truth：`player.schoolInvitationState`。
- Generated invitation 保存完整 school profile、school seed、interest result、projected role、reasons 與 risk signals。
- `getSchoolInvitationDebugSnapshot()` 只建立 frozen read-only projection，不是第二份 mutable state。
- 沒有 `bestSchool`、`recommendedSchool`、`optimalSchool` 或 authoritative Player Overall。

## 3. School Profile v1 contract

每個 generated school profile 包含：

- `schoolId`
- `schoolName`
- `schoolSeed`
- `schoolTier`
- `teamStrength`
- `trainingQuality`
- `competitionDepth`
- `matchCompetitionLevel`
- `playingTimeOpportunity`
- `recruitingStandard`
- `positionNeeds`（P／C／1B／2B／3B／SS／OF，各為 low／medium／high）
- `recruitingPreference`
- `coachProfile.coachId`
- `coachProfile.coachStyle`

Invitation derive fields：

- `schoolInterest.score`
- `schoolInterest.category`
- `schoolInterest.capabilityMatch`
- `schoolInterest.preferenceFit`
- `schoolInterest.recruitingStandardFit`
- `schoolInterest.positionNeed`
- `schoolInterest.candidatePosition`
- `schoolInterest.deterministicVariation`
- `projectedRole`
- `specializedInterest`
- `interestReasons`
- `riskSignals`

## 4. Tier profiles

| Tier | Team strength | Training | Match competition | Competition depth | Playing time | Recruiting standard |
| --- | --- | --- | --- | --- | --- | ---: |
| powerhouse | elite | elite | high | veryHigh | low | 5.5 |
| competitive | strong | strong | mediumHigh | high | medium | 4.8 |
| standard | standard | standard | medium | medium | mediumHigh | 4.0 |
| development | emerging | limited | lowMedium | low | high | 3.2 |

這些是 environment categories，不是 XP／Match 倍率；Foundation 不直接改玩家能力。

## 5. Recruiting logic

School Interest 由下列 school-specific facts 組成：

```text
position-specific capability match
+ recruiting preference fit
+ position need contribution
+ recruiting standard fit
+ small deterministic school variation
```

- Capability Match 依 recruiting candidate position 使用不同技能權重，不建立跨學校共用 Overall。
- Preference 只改 skill profile weighting；v1 支援 balanced、defenseFirst、offenseFirst、athletic、baseballIQ。
- Position Need 是 team-need proxy，不生成完整 roster。
- Variation 固定在小範圍，使用 school-specific deterministic hash，不足以讓低能力隨機取得核心強權待遇。
- `specializedInterest` 允許突出工具＋high need 的球員越級受到強權注意，但不新增 Player Skill。
- Narrative Identity／Motivation 不參與 school generation、school interest、projected role、invitation eligibility 或 display order；未來只供 invitation presentation／Narrative Echo。

## 6. Recruiting position legality

Read-only recruiting position profile 包含：

- `primaryCandidate`
- `secondaryCandidates`
- `candidatePositions`
- `legalPositions`
- `positionExperience`

Canonical primary／secondary position 與 Capability position experience 經同一 adapter 轉為 P／C／1B／2B／3B／SS／OF。左投球員的內野 candidates 排除 2B／3B／SS，只保留合法的 P／1B 路徑；生成不改 handedness、skill 或 canonical position。

## 7. Expected role projection

Projected role 依：

```text
recruiting standard fit
+ position need
- competition depth
```

產生：depthCandidate、benchCandidate、rotationCandidate、starterCompetition、coreCandidate。

Projected Role 是入學前預估；它不寫入 `highSchoolRoleCode`，也不保證未來 Actual Role。正式角色仍由入學後競爭、教練與比賽證據決定。

## 8. Four-school generation and diversity

1. 由 generation seed 為四個 tier 各建立 deterministic fictional candidate pool。
2. 對每間學校計算 school-specific interest 與 projected role。
3. 依 interest eligibility／specialized fit 形成候選，不保證 powerhouse。
4. deterministic selection 禁止單一 tier 佔滿四校。
5. repair 只重新選學校，不修改 Player Capability。
6. 最後用獨立 deterministic display order 排列，第一間不代表推薦。

Diversity validator 要求：

- exactly 4 invitations
- unique school id／name／object identity
- role categories >= 2
- competition depth categories >= 2
- training quality categories >= 2
- tier categories >= 2
- mechanical signatures >= 2

## 9. Determinism and RNG isolation

- Default generation seed 只由穩定 Capability character seed、`high-school-entry-recruiting-cycle-v1` namespace、handedness 與客觀 recruiting position profile derive。
- `name`、`idealSelf`、Identity／Motivation flags、relationship 與 player preference 均不進 generation seed。
- 可傳 explicit generation seed 供 deterministic audit。
- School RNG 使用 `school-invitation` namespaced stable hash。
- School Interest deterministic variation 只讀 school seed 與 Capability character seed；display order 只讀 generation seed 與 school id。
- 不呼叫 `Math.random()`。
- 不讀寫 Match `simulationSeed`／`simulationCursor`。
- 不消耗 Initial Skill variation 或 Youth Outcome RNG/state。
- 第二次 generate 遇到合法 existing set 直接回傳原 state。
- Reload 直接使用保存 set，不重新 evaluate、reroll 或依新公式替換。

## 10. Save and migration

- 新角色：HS Entry settlement 後 generate once，保存於 `schoolInvitationState`。
- Pre-HS legacy save：正常 load；到高中入口完成 settlement 後才 deterministic generate。
- Existing high-school legacy save：標記 `legacy-existing-school` compatibility bypass，不插入選校阻塞流程。
- Direct Start：生成合法四校，同時保存 `direct-start-bypass` existing test school context；不改現有 route、Capability 或 Match flow。
- Debug Bookmark：使用合法 settled capability 生成 deterministic set，但不啟動選校 UI。

## 11. Sample invitation set

Seed：`contract-seed`；代表性普通二壘候選。

| School | Tier | Preference | Need | Interest | Projected role | Training | Depth | Playing time |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 石橋高中 | development | balanced | high | high | starterCompetition | limited | low | high |
| 春浦高中 | development | balanced | high | high | starterCompetition | limited | low | high |
| 平川學園 | development | balanced | high | high | starterCompetition | limited | low | high |
| 新田學園 | standard | baseballIQ | high | high | rotationCandidate | standard | medium | mediumHigh |

Sample reasons 由實際 contributor derive：baseballUnderstanding、defensiveReliability、positionNeedHigh、preference。Development offers 同時帶 lowerTrainingEnvironment／weakerCompetitionSchedule risks；Standard offer 不帶這兩項。

## 12. Population audit

Audit composition：

- low capability：200 sets
- average：200 sets
- strong：200 sets
- defensive specialist：200 sets
- six Ideal Self representatives：200 sets

| Metric | Result |
| --- | ---: |
| Total sets | 1,000 |
| Total invitations | 4,000 |
| Powerhouse invitations | 551 (13.775%) |
| Competitive invitations | 402 (10.050%) |
| Standard invitations | 1,083 (27.075%) |
| Development invitations | 1,964 (49.100%) |
| Depth candidate | 2 |
| Bench candidate | 98 |
| Rotation candidate | 875 |
| Starter competition | 2,336 |
| Core candidate | 689 |
| Diversity pass | 1,000/1,000 (100%) |
| Duplicate school set | 0/1,000 (0%) |
| Low-profile legal four-offer set | 200/200 (100%) |
| Strong-profile set with non-powerhouse tradeoff | 200/200 (100%) |
| Specialist powerhouse cases | 102/200 |
| Position-need influence checks | 100/100 |

`powerhouse = 13.775%` 不是 population target。現階段缺少真實人口分布與內容校準，本 audit 只證明 generation、diversity、legality、position need與 specialized-interest 結構有正常工作，不進行無依據 balance tuning。

## 13. v1.0.1 Identity / Recruiting Causality Boundary

正式因果邊界：

```text
Capability / Position / School Need
→ Recruiting Reality

Identity / Motivation
→ Future Presentation / Narrative Echo Only
```

Identity invariance fixture 固定 character seed、Genesis、finalized capability、handedness、position profile、position experience 與 recruiting state，只改 neutral、challengePower、aspireToPower、proveMyself、playingTimePriority 及對應 narrative metadata。五種 variants 的完整 Invitation State 均 deepEqual，包括 school id／name／seed／tier、position needs、recruiting preference、coach profile、capability match、school interest、specialized interest、projected role、reasons、risks 與 display order。

Identity independence audit：

| Metric | Result |
| --- | ---: |
| Objective player fixtures | 200 |
| Identity variants per fixture | 5 |
| Baseline comparisons | 800 |
| Invitation set mismatches | 0 |

修正後另以 default generation seed 重跑 1,000-set population audit；這不是 balance target，也未進行 weight／threshold tuning：

| Metric | Result |
| --- | ---: |
| Total sets | 1,000 |
| Total invitations | 4,000 |
| Powerhouse invitations | 556 (13.900%) |
| Competitive invitations | 392 (9.800%) |
| Standard invitations | 1,100 (27.500%) |
| Development invitations | 1,952 (48.800%) |
| Depth candidate | 2 |
| Bench candidate | 105 |
| Rotation candidate | 920 |
| Starter competition | 2,274 |
| Core candidate | 699 |
| Diversity pass | 1,000/1,000 (100%) |
| Duplicate school set | 0/1,000 (0%) |
| Low-profile legal four-offer set | 200/200 (100%) |
| Strong-profile set with non-powerhouse tradeoff | 200/200 (100%) |
| Specialist powerhouse cases | 103/200 |

既有有效 invitation state 仍直接回傳 persisted set，不因 helper／identity 變化 silent reroll；save/reload、Direct Start 與 legacy compatibility bypass 維持原 contract。

## 14. Human validation record

User-confirmed Human Validation PASS：Normal Route 無流程中斷、Direct Start 正常、Save／Reload 正常，且未發現 School Invitation runtime error。

## 15. Deferred

- Invitation Letter／四封信 UI。
- School Choice route與 `selectSchool()`。
- Training multiplier／Development Bias。
- Full Team Strength／roster generation。
- Recruiting negotiation、scholarship、finance、geography、dormitory、academics、transfer。
- NPC simultaneous recruitment、Scout uncertainty、runtime Coach Evaluation。
- Youth v1 narrative integration、Match balance、Game Settlement。
