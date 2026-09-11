# AI Plate Appearance Outcome Expansion Sprint 1

Control Walk + Strikeout Semantic Parity

狀態：PASS（能力連線、語意相容及回歸驗證通過；未進行聯盟數值校準）。未 commit、未 push、未開始下一 Sprint。

1. **Baseline**：施工前確認 main = origin/main = caf2199，ahead/behind 0/0，working tree clean。最近三筆 caf2199 / 36b093f / 35ba350。

2. **Changed files**：Production：ai-plate-appearance-outcome.js（新增）、script.js（只改 resolveSimulatedHighSchoolPlateAppearance）、index.html（載入新模組）。95 個既有獨立 VM 測試加入模組載入；4 個 audit/test 檔建立 current-resolved 檢查。新增兩個測試、一個驗證 runner、兩個報告。完整清單見文末。

3. **Old authority**：caf2199 的 resolveSimulatedHighSchoolPlateAppearance 在 script.js 直接以 adjusted 分段產生七種 terminal token。Control 未讀取；SO 不在集合中。

4. **New authority**：AIPlateAppearanceOutcome.resolveCompressedPlateAppearanceOutcome；authority = compressedAIPlateAppearanceOutcomeV1；resolutionMode = compressedPlateAppearance。

5. **Resolver contract**：Stateless scalar input：identity、sample、batter(contact,power,discipline)、pitcher(pitchingQuality,decision,control)、context(hasRunner,outs,offenseTrailing)。輸出 result/authority/resolutionMode/compact trace；輸出凍結，輸入不改。

6. **Canonical batter inputs**：Adapter 重用 getOffensiveSimulationCapability。普通 roster discipline = round((contact + speed)/2)，並非新增獨立 roster ability。純 Discipline 隔離在已存在的 resolved scalar seam 進行，沒有改寫 roster 結構。

7. **Canonical pitcher inputs**：active defensive pitcher 由 getCurrentHighSchoolMatchDefender 取得；quality 沿用 Number(pitcher.pitching)||5，decision 沿用 getDefensiveSimulationCapability；Control 使用 profile scalar。沒有從 overall 推導 Control。

8. **Control source**：pitcher.pitchingProfile.control 原值直接傳入普通 AI，沒有套用 interactive runtime 的 x2。既有壓縮公式使用 raw roster 尺度；不為本次擴充改變整套能力尺度。

9. **Missing Control**：非 finite 或不存在 → controlAvailable=false、pitcherControl=null、controlFallback=missingControlNeutral、walkAdjustment=0。沒有虛構 control=10。

10. **BB design**：walkAdjustment = clamp((discipline-control)*0.004,-0.03,0.03)；walkLower = 0.58 - walkAdjustment；walkUpper 固定 0.69。只交換 productiveOut/walk 邊界；single/double/triple/HR 及 plain-out 邊界不變。係數在量測前固定，未依結果調參。

11. **Discipline interaction**：較高 Discipline 拓寬 walk band；同時保留舊 quality 中 discipline*0.008，因此仍會間接影響安打與 plain-out 機會。

12. **Pitch Quality source**：SO 消費既有 roster pitching scalar。decision 保留 generic pitcherPressure，沒有宣稱 decision 或 roster stuff 已是獨立 SO input；沒有新建 Stuff ability。

13. **SO classifier**：既有分類完成後，只在 preStrikeoutResult=out 時，以 clamp(0.18+(pitchingQuality-contact)*0.018,0.04,0.45) 與 namespaced identity roll 決定 strikeout/out。沒有第二次 safe/out bonus。

14. **Contact interaction**：Contact 越高，條件 SO probability 越低，仍至少 0.04；原 generic offensive quality 同時保留，因此 Contact 也會降低 plain-out 候選比例。

15. **Out subclassification proof**：所有受控樣本逐項檢查：strikeout 必須來自 plain out；productiveOut、walk、所有 hit token 原樣保留。直接 Control 對照的 H、HR、SO 計數完全相同。

16. **RNG / identity**：FNV-1a 32-bit，namespace compressed-ai-strikeout-v1；identity 包含 match.id、已記錄 PA 數、batter.id、active pitcher.id。tier 不放進 identity，允許配對對照。不同樣本唯一，還原同一 PA 可重現。

17. **Global RNG consumption**：native nextHighSchoolMatchSimulationRandom 每 PA 一次；SO 不抽新 global sample。注入 sample 的 fixture 不增加 native cursor。100 場配對完整比賽逐場比對 cursor 與 ordinary PA 數。

18. **Vocabulary**：out、productiveOut、walk、single、double、triple、homeRun、strikeout；無新增假的 pitch count、location、velocity、movement 或 pitch sequence。

19. **Interactive separation**：OffensivePlateApproach 與 PitchSequencing production 未修改。真正的第三好球仍由逐球流程處理；新模組只處理壓縮 AI。

20. **BIP separation**：BattedBallOutcomeMapping 與 BattedBallPhysical 未修改；沒有為 AI 安打偽造 physical truth。所有非目標 script.js 函式經 caf2199 正規化原始碼對照一致。

21. **GameRecord BB**：整合測試確認 batter PA+1/BB+1/AB+0，active pitcher BF+1/BB+1，由現有 recordEvent 統計。

22. **GameRecord SO**：確認 batter PA+1/AB+1/SO+1，active pitcher BF+1/SO+1。

23. **Out settlement**：applyHighSchoolSimulatedPlateAppearance 既有 strikeout 分支增加一個 out；pitcher outsRecorded 同增一；第三出局可完成半局轉換。未改 settlement。

24. **SO runners**：三壘單獨有人、滿壘情境均不推進、不額外得分；第三出局交由既有半局清壘流程。

25. **Walk runners**：空壘、一壘、一二壘、滿壘均通過，沿用原 force chain。

26. **3B invariant**：三壘單獨有人 + walk 不得分；SO 不得分。

27. **Loaded walk**：滿壘 + walk 僅因完整 force chain 讓三壘跑者合法得分；scoringRunnerIds 符合原 runner identity。

28. **CompetitionEvidence**：新增整合測試使用真正完成的普通 AI 比賽，active NPC P 的 BB/SO 原樣進 fullGameProductionEvidence；GameRecord 不受投影修改。另有既有 batter/pitcher BB/SO evidence contract 回歸。

29. **Evaluation sample semantics**：pitching sample.count = canonical BF，offense PA 沿用現有契約；decision 不重複算 production sample。同一 GameRecord event 與同場 Evidence 再次 ingest 均冪等。未改 County/National weighting。

30. **Control isolation**：8/10/12/14/16，每級 4,000 PA，BB/BF = 12.600% / 11.800% / 11.000% / 10.200% / 9.400%。H/BF、HR/BF、SO/BF 全相同。

31. **Quality isolation**：相同級別，每級 4,000 BF，SO/BF = 2.425% / 3.675% / 5.125% / 6.350% / 7.725%。保留 generic pressure，H/BF 隨 quality 提升下降。

32. **Contact isolation**：SO/BF = 9.575% / 6.800% / 4.850% / 2.900% / 1.825%；不是高 Contact 必不被三振。

33. **Discipline isolation**：BB/BF = 9.400% / 10.200% / 11.000% / 11.800% / 12.600%。

34. **H/BF preservation**：native quality 4/5/6/7/8，各 20 場完整遊戲，H/BF = 34.734% / 34.456% / 33.290% / 33.420% / 32.275%。低高方向保留，6→7 的局部波動保留如實呈現。

35. **ER27 preservation**：相同完整遊戲的 ER27 = 9.8125 / 7.7234 / 6.8451 / 6.1479 / 5.1702。既有 run prevention 未崩壞。

36. **Cross-coupling**：Control 不進 generic adjusted 或 SO probability；它改 walk/productiveOut 比例，完整比賽可透過壘包、得分、之後 context 間接改變其他統計，並非宣稱全場 H 數永遠相同。Quality/Contact/Discipline 原有 adjusted coupling 保留。

37. **Single-game variance**：20 個配對 game IDs/tier，總 100 場完成（各 tier 重用相同 game IDs 以配對，不宣稱 100 個跨 tier 唯一 IDs）。每個 tier 內 BF event/PA identity 無重複；SO 範圍 0–5、0–6、0–6、0–9、0–9；BB 範圍 3–8、2–7、2–7、2–7、2–7。

38. **Block variance**：每個隔離 tier 10 blocks ×400 PA；每個主指標各 block 存在自然差異。完整 counts/rates/blocks 見 JSON。4000 PA 使用固定分散 sample 集合與唯一 identity，是 scalar resolver 診斷，不宣稱逐場 native RNG 球序。

39. **Determinism**：同 identity/input 重跑與每個 tier 第一場 instrumentation on/off 完整 record/log 相同。1,400-game determinism 與 instrumentation neutrality 均 PASS。

40. **Save/load**：相同未完成 context JSON 還原後，實際 resolver 產生完全相同 match state、event 與 cursor。沒有新增儲存結構或 RNG state。

41. **Historical audits**：原 ability v1.1、mapping audit、BIP mapping validation docs/JSON 全部保留。歷史 Control disconnected/SO absent 斷言仍讀 committed 歷史 evidence；同時新增 current-resolved 檢查。未用 CLI 覆寫舊報告；BIP validation 呼叫 run() 並將本次摘要放新 JSON。

42. **New tests**：ai-plate-appearance-outcome-test.js：17/17；ai-plate-appearance-outcome-production-integration-test.js：19/19。另有 ai-plate-appearance-outcome-validation.cjs 80,000 隔離 PA、100 場完整比賽與既有保護梯度。

43. **Selected regression**：22/22 PASS，涵蓋 user 指定的 AI、Match、PlateApproach、PitchSequencing、Pitcher-Catcher、Physical、Mapping、Defense、Runner、Record、Evidence、Ability、County、National。執行清單一度使用不存在的 batted-ball-physical-test.js；修正為實際 foundation 檔名後通過，沒有刪改 assertion。

44. **Full syntax**：256/256 JS/CJS PASS。

45. **Full regression**：168/168 PASS（原 166 組 + 2 個新增測試），包含 1,400-game audit；0 FAIL。

46. **1,400-game audit**：bench 1000/1000、starter 400/400 完成；orphan=0、no-progress=0、match-state issue=0、game-record issue=0；deterministic=true、instrumentationNeutral=true。稽核耗時 236.804 秒。

47. **git diff --check**：PASS；tracked diff 與 6 個新檔逐一檢查皆無空白錯誤。新檔統一 LF，沒有修改 boundary contract。

48. **git status**：main／HEAD caf2199，origin/main 相同，ahead/behind 0/0；101 tracked modified + 6 untracked = 107 檔，staged 0。所有修改保留 working tree；未 commit、未 push。完整清單見下方。

49. **Stop Conditions**：A–O 全部未觸發，full regression 無新增 failure。施工中新增測試曾有預期公式浮點運算順序差異、歷史 JSON 新舊觀測欄位差異，修正 test harness 後通過；未以 production 調參處理。

50. **Remaining gaps**：Player P gameplay exposure 仍 deferred；steal execution/catcher-specific official stats、error scorer、HBP、bunt、park physics、完整 NPC pitch counts 未納入。

51. **Calibration candidates**：本次只證明方向、隔離、統計語意與不退化。synthetic raw tiers 8–16 不代表生成 roster 分布；高階 H/HR 比例受舊 clamp/壓縮模型影響，不能宣稱符合真實高中聯盟。可另設校準 gate，這次未 fitting。

52. **Next Sprint recommendation**：待本次全套驗收後，建議先做 Ability–Performance Revalidation / Calibration Gate，明確決定 raw roster 與評估尺度；Player Pitcher Full-Match Exposure 可另開範圍。本輪不啟動任何下一步。

隔離結果（每列 BF=4,000；相同 axis 內使用配對 identity/sample）：

| Axis | Tier | BB | BB/BF | SO | SO/BF | H/BF | HR/BF |
|---|---:|---:|---:|---:|---:|---:|---:|
| control | 8 | 504 | 12.600% | 201 | 5.025% | 49.375% | 19.875% |
| control | 10 | 472 | 11.800% | 201 | 5.025% | 49.375% | 19.875% |
| control | 12 | 440 | 11.000% | 201 | 5.025% | 49.375% | 19.875% |
| control | 14 | 408 | 10.200% | 201 | 5.025% | 49.375% | 19.875% |
| control | 16 | 376 | 9.400% | 201 | 5.025% | 49.375% | 19.875% |
| quality | 8 | 440 | 11.000% | 97 | 2.425% | 52.575% | 23.075% |
| quality | 10 | 440 | 11.000% | 147 | 3.675% | 50.975% | 21.475% |
| quality | 12 | 440 | 11.000% | 205 | 5.125% | 49.375% | 19.875% |
| quality | 14 | 440 | 11.000% | 254 | 6.350% | 47.775% | 18.275% |
| quality | 16 | 440 | 11.000% | 309 | 7.725% | 46.175% | 16.675% |
| contact | 8 | 440 | 11.000% | 383 | 9.575% | 39.375% | 9.900% |
| contact | 10 | 440 | 11.000% | 272 | 6.800% | 44.375% | 14.875% |
| contact | 12 | 440 | 11.000% | 194 | 4.850% | 49.375% | 19.875% |
| contact | 14 | 440 | 11.000% | 116 | 2.900% | 54.375% | 24.875% |
| contact | 16 | 440 | 11.000% | 73 | 1.825% | 59.375% | 29.875% |
| discipline | 8 | 376 | 9.400% | 206 | 5.150% | 46.175% | 16.675% |
| discipline | 10 | 408 | 10.200% | 197 | 4.925% | 47.775% | 18.275% |
| discipline | 12 | 440 | 11.000% | 186 | 4.650% | 49.375% | 19.875% |
| discipline | 14 | 472 | 11.800% | 173 | 4.325% | 50.975% | 21.475% |
| discipline | 16 | 504 | 12.600% | 162 | 4.050% | 52.575% | 23.075% |

修改檔案完整清單：

```text
index.html
script.js
tests/ability-performance-observability-extension-test.js
tests/ability-performance-observability-extension.cjs
tests/adult-route-chain-test.js
tests/application-controller-test.js
tests/aspiration-narrative-test.js
tests/azhe-storyboard-test.js
tests/baseball-gameplay-integration-test.js
tests/baseball-match-foundation-2-1-1-1-test.js
tests/baseball-match-foundation-2-1-1-test.js
tests/baseball-match-foundation-2-1-test.js
tests/baseball-match-foundation-2-2-1-test.js
tests/baseball-match-foundation-2-2-2-test.js
tests/baseball-match-foundation-2-2-3-test.js
tests/baseball-match-foundation-2-2-4-1-test.js
tests/baseball-match-foundation-2-2-4-2-test.js
tests/baseball-match-foundation-2-2-4-3-audit.js
tests/baseball-match-foundation-2-2-4-4-test.js
tests/baseball-match-foundation-2-2-4-5-test.js
tests/baseball-match-foundation-2-2-4-test.js
tests/baseball-match-foundation-2-2-test.js
tests/baseball-offensive-production-integration-test.js
tests/baseball-training-rhythm-test.js
tests/batted-ball-physical-production-integration-test.js
tests/bbp-b1-ground-ball-production-integration-test.js
tests/bbp-b2a-line-drive-production-integration-test.js
tests/bbp-b2b1-fly-ball-production-integration-test.js
tests/bbp-b2b2-tag-up-decision-execution-test.js
tests/callbackTest.js
tests/career-age22-outcome-resolver-test.js
tests/career-arc-test.js
tests/career-development-progression-test.js
tests/career-development-runtime-resolver-test.js
tests/career-network-contract-test.js
tests/career-rejoin-contract-test.js
tests/career-transition-commit-test.js
tests/career-transition-progression-test.js
tests/career-transition-resolver-test.js
tests/career-transition-role-test.js
tests/career-transition-route-difference-test.js
tests/career-transition-runtime-resolver-test.js
tests/catcher-choice-outcome-integrity-v1-test.js
tests/content-flow-audit.js
tests/contextual-status-panel-test.js
tests/defensive-outcome-cause-explainability-foundation-v1-test.js
tests/development-match-position-test-fallback-v1-test.js
tests/emotional-payoff-test.js
tests/event-continuity-pass-test.js
tests/first-offensive-moment-role-presentation-test.js
tests/generic-infield-position-admission-diagnostic-test.js
tests/goal-balance-test.js
tests/ground-ball-home-route-production-integration-test.js
tests/high-school-entry-roster-integration-test.js
tests/high-school-integration-1-1-1-test.js
tests/high-school-integration-1-1-test.js
tests/high-school-integration-1-2-1-test.js
tests/high-school-integration-1-2-2-1-test.js
tests/high-school-integration-1-2-2-2-test.js
tests/high-school-integration-1-2-2-test.js
tests/high-school-integration-1-2-3-test.js
tests/high-school-integration-1-2-test.js
tests/high-school-three-year-spine-test.js
tests/high-school-year-one-competition-loop-test.js
tests/high-school-year-one-opportunity-two-integration-test.js
tests/high-school-year-transition-continuity-test.js
tests/high-school-year-two-competition-loop-test.js
tests/invitation-presentation-school-choice-integration-v1-test.js
tests/invitation-presentation-v1-0-1-legacy-route-conflict-test.js
tests/match-development-settlement-presentation-v1-test.js
tests/match-opportunity-structural-completion-v1-test.js
tests/match-simulation-outcome-mapping-audit.cjs
tests/match-simulation-outcome-mapping-test.js
tests/narrative-continuity-test.js
tests/npc-role-refactor-test.js
tests/offensive-plate-approach-foundation-v1-test.js
tests/offensive-production-presentation-sprint-c-test.js
tests/offensive-tactical-action-sprint-a-test.js
tests/offensive-tactical-action-sprint-b1-0-1-test.js
tests/offensive-tactical-action-sprint-b1-test.js
tests/offensive-tactical-action-sprint-b2-defensive-handoff-test.js
tests/outcome-transition-hierarchy-test.js
tests/plate-decision-production-integration-test.js
tests/player-archetype-test.js
tests/player-capability-hierarchy-foundation-v1-0-1-test.js
tests/player-capability-hierarchy-foundation-v1-test.js
tests/player-data-boundary-test.js
tests/playing-time-game-exposure-foundation-v1-test.js
tests/presentation-interaction-clarity-test.js
tests/relationship-payoff-test.js
tests/responsive-accessibility-pass-test.js
tests/scene-context-layer-test.js
tests/scene-depth-test.js
tests/sprint-c-human-ux-closeout-test.js
tests/status-panel-disclosure-persistence-test.js
tests/takahashi-storyboard-test.js
tests/team-roster-match-integration-test.js
tests/ten-year-narrative-architecture-test.js
tests/third-out-runner-resolution-integrity-v1-test.js
tests/vertical-slice-smoke.js
tests/youth-season-content-pass-test.js
ai-plate-appearance-outcome.js
tests/ai-plate-appearance-outcome-test.js
tests/ai-plate-appearance-outcome-production-integration-test.js
tests/ai-plate-appearance-outcome-validation.cjs
docs/ai-plate-appearance-outcome-expansion-sprint-1.md
docs/ai-plate-appearance-outcome-validation.json
```
