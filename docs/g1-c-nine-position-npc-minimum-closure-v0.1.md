# G1-C — Nine-Position NPC Minimum Closure v0.1

**G1_C_PASS**

驗收完成於 2026-10-20（Asia/Taipei）。九守位的最低 NPC 正式責任均有實際執行與 Record 證據；本輪修補捕手一般第三好球接捕的執行／刺殺歸屬。原 P、內外野路徑重用。全程沒有 Stage、Commit、Push 或其他 Git 寫入。

完整可重現的 actor、能力、事件、before/after、存讀、測試命令／exit／輸出 SHA 與磁碟核對在 [Evidence JSON](g1-c-nine-position-npc-minimum-closure-v0.1-evidence.json)。

## 1. Git／WIP Baseline

- Branch：accepted-gameplay-g1-b-v0.1；HEAD：95c75a7ebeba7f052a6d227733dc48555f356d3c。
- Parent：bd657b5f18462be2c365abdec1ca14497725557e；Tree：d7f9b51be053edf0209078b2b7958e76e52ec62a。
- 開工 staged 空、1 tracked WIP、1,220 untracked；12 Protected 僅 stat size/mtime，全部一致。
- index SHA256：cfe6fb7cacc99c3bef5203cdc93e925f9acf09ec8e8a9f4703215c39dc435e02；完工相同。
- 開工 G1-B 43、G1-A 29、Match vNext Contract／Production 四套原 CLI 全 PASS；已接受來源與原報告 SHA 相符。

已讀原 G1-A／G1-B Report/Evidence、Match Gameplay Coverage Reprioritization Gate v0.1、Match Full Game Record 規格及有效 AGENTS 指令。codebase-memory skill 正常提權讀取成功；本環境無 graph/index/coverage 工具，因此使用精確來源、caller、原 VM harness 與實際 CLI，未宣稱 graph coverage。

## 2. NPC Nine-Position Matrix

下列每列均為 active NPC、真實能力與完成動作；不是以名單存在判定。完整 actor ID 與能力原值見 Evidence responsibilityMatrix。O0/O1/O2 各別執行。

| 守位 | 開工分類 | 正式實際路徑 | Record／合法 terminal | 完工 |
|---|---|---|---|---|
| P | EXISTING_CLOSED | 原 1B→P（3-1）；NPC P receive＋baseTouch | P PO/chance +1，A/E 0；打者一壘前出局 | 閉合 |
| C | EXECUTION_GAP、ATTRIBUTION_GAP | 原 called／swinging strike three→實際 C 接捕→原 PA | C PO/chance +1；P SO/BF/投球出局 +1、守備 PO 0；打者 SO/PA/AB +1 | 修補後閉合 |
| 1B | EXISTING_CLOSED | 原 vNext NPC SS→NPC 1B receive＋baseTouch | 1B PO/chance +1，A/E 0；打者一壘前出局 | 閉合 |
| 2B | EXISTING_CLOSED | NPC 2B field＋throw→實際 player 1B 接傳 | NPC A/chance +1；實際 receiver PO；一壘前出局 | 閉合 |
| 3B | EXISTING_CLOSED | NPC 3B field＋throw→實際 player 1B 接傳 | NPC A/chance +1；實際 receiver PO；一壘前出局 | 閉合 |
| SS | EXISTING_CLOSED | NPC SS field＋throw→實際 receiver；另有原 vNext SS→NPC 1B | NPC A/chance +1；實際 receiver PO；一壘前出局 | 閉合 |
| LF | EXISTING_CLOSED | 原 G1-A 接殺；原 G1-B 真落地／拾球／停一壘 | 接殺 PO/chance +1；single 不生 PO/A/E；原 PA 一次 | 閉合 |
| CF | EXISTING_CLOSED | 原 G1-A 接殺；原 G1-B 真落地／拾球／停一壘 | 同上 | 閉合 |
| RF | EXISTING_CLOSED | 原 G1-A 接殺；原 G1-B 真落地／拾球／停一壘 | 同上 | 閉合 |

P actor：school-powerhouse-409d352a-player-16；C：regional-power-school-player-02；1B：regional-power-school-player-03。SS：school-powerhouse-409d352a-player-13；2B：school-powerhouse-409d352a-hs-year-2-age-17-incoming-05；3B：school-powerhouse-409d352a-hs-year-3-age-18-incoming-01。LF／CF／RF 接殺 actor 分別為 school-powerhouse-409d352a-player-07、school-powerhouse-409d352a-hs-year-3-age-18-incoming-02、school-powerhouse-409d352a-hs-year-2-age-17-incoming-01。各案例的對手與比賽不同，未拼接為同一場。

## 3. Existing Closed Paths

既有 Opportunity／Reach／Secure、FirstBaseExecution、Decision/Throw、Runner Timing、Force、Canonical Third-Out、原 PA applier／Defensive Record 直接重用。P／1B／2B／3B／SS／LF／CF／RF 沒有新增第二套結算。原案例在 O0/O1 可進下一 PA，O2 形成第三出局並換半局；vNext 原 Production 同時覆蓋 save、matchEnd 與 Recovery admission 邊界。

## 4. Actual Missing Gaps

開工缺口是：原 OPA called/swinging strikeout 已有 PA/SO/out，但沒有可供正式 C PO 使用的 pitch 接捕完成證據。原 throw receiving 需要已發生傳球，BattedBall Reach/Secure 需要擊球；兩者都不能虛構為 pitch。故只在既有 Reach/Secure owner 追加有界純第三好球接捕，於原 PA 寫入前驗證，並接回原 Record catch ledger。

## 5. Exact Production Modifications

| 檔案 | 精確最小變更 |
|---|---|
| defensive-reach-secure-foundation.js | additive resolveThirdStrikeCatch 與 export；原 BIP／G1-B／Recovery body 不變 |
| script.js | 新 capture／resolve 第三好球 helper；三個既有 wrapper：ensureHighSchoolOffensivePlateAppearanceState 在投球前保存真 P/C snapshot；resolveHighSchoolOffensiveDecision 在 PA/out 寫入前驗證；resolveSimulatedHighSchoolPlateAppearance 阻止未閉合 strikeout 改走 compressed skip |
| match-game-record.js | event 前驗證 live roster、pitch/PA/P/C、完成接捕、唯一 strikeout retirement；重用原 recordDefensivePlay catch branch 與 defensivePlayIdentity 防重 |
| tests/pitch-production-source-scope.cjs | 委派 G1-C 精確反轉，保留原 immutable pin／95 functions／25 globals 檢查 |
| tests/g1-b-source-delta.cjs | 僅先反轉精確 G1-C delta，再執行原 source 比對與 24 mutation guards |
| tests/g1-c-source-delta.cjs | 新精確 block/export／三 wrapper SHA；反轉後三個 owner 全文等於 95c75a7；9 個未授權變動均拒絕 |
| tests/g1-c-nine-position-npc-minimum-closure-test.cjs | 新最低矩陣／捕手控制與負向／原正常比賽測試；55 組 |

原 PA 的 pitcherId 從舊預設別名改為投球前實際 active P，作接捕事實的身份依據。C snapshot 缺席只記 null，不阻擋原打席準備或非三振結果；到第三好球結算才要求真 active NPC C。透過既有 sameBallMetadata spread 傳事件 facts，沒有新增 Game Record／Save schema 或版本。OPA、投球公式、Scorer、Runner／Force／ThirdOut、Career 公式與自然外野 admission 均未改。

### 完工精確來源／測試 SHA256

| 路徑 | SHA256 |
|---|---|
| `script.js` | `0cf7262010e8095c455ce59a1dcc6cbb659f710dbb65f9e18689de3b0a3af314` |
| `defensive-reach-secure-foundation.js` | `2940a422ffa94659080c382f3f810ec4f80ba4048ce54bc743892710143c6e4f` |
| `match-game-record.js` | `00e5544cce1d62f6bc1f26ca7d9d36e7a36798a2d93d293c40b2298a30d53f68` |
| `tests/pitch-production-source-scope.cjs` | `a595e6a88bb23bbd0b997b145c5a36c504906ae97cc34adc36c89132a050a966` |
| `tests/g1-b-source-delta.cjs` | `38ad50475d2134ddee22436ba217282afe19fc12704214a9f052b27c30f7f787` |
| `tests/g1-c-source-delta.cjs` | `5b5c56ef51a0e1c65560885ac4e169d5402719904c9adbbb3e14d232d6624229` |
| `tests/g1-c-nine-position-npc-minimum-closure-test.cjs` | `d60ba9b6e95f2d9403c187be1a074990099bcf226e8e2bd052cd822f6acf571d` |

## 6. Catcher Strikeout Attribution

正式入口：原 ensureHighSchoolOffensivePlateAppearanceState → 原 OPA／Plate Decision terminal pitch → resolveHighSchoolThirdStrikeCatch → DefensiveReachSecureFoundation.resolveThirdStrikeCatch → 原 resolveHighSchoolOffensiveDecision／PA settlement → MatchGameRecord.recordEvent／recordPlateAppearance／recordDefensivePlay。

僅接受 count 2→3、calledStrike（take＋actual strike）或 swingingStrike（swing＋contact=false）；pitchId/PA/P/C、active roster、raw/capability 與投球前 snapshot 必須一致。bounced／touchedGround／uncaught／缺資料／偽造 throw 均拒絕；不由 strikeout token 推定接捕。

能力計算：.8 catching + .2 fielding − 2.5 + (.5 − sample) × 2。catching/fielding/reaction 沿用 actual NPC defense；demand=2.5 為既有 weak secure pressure 尺度上的暫定遊戲係數，未宣稱實際秒數或完整 pitch physics。sample 使用原 deterministicUnit，namespace=g1-c-third-strike-catch，以 PA/C 固定；不消耗 Match RNG、不得重抽。

六個 called/swinging×O0/O1/O2 正例使用 actual C defense=6/arm=7/speed=5；P 是 regional-power-school-player-01。失敗是 unclosed，不提交 PA/out/PO；阻止 compressed 跳過。同一 terminal pitch 以原 eventRefs.defensivePlayIdentity 去重，換 eventId 重送也不重記。投手僅取得原 pitching SO/BF/outsRecorded，沒有因此獲守備 PO。

## 7. Pitcher Fielding

原 3-1 路徑：實際 player 1B 撿球傳給 active NPC P，P 完成 receive＋baseTouch，原 batterRunnerBeforeFirst retirement 後 P PO/chance +1、A/E 0；傳球者的合法 A 保留。P 使用原 defense=7、arm=8、speed=7，未強化其能力。另驗證弱 P 不可完成補位時 outsCreated=0、P PO=0。沒有新 P 專用邏輯。

## 8. Infield Reuse

SS／2B／3B 使用原 first-base production fixture 的事前宣告能力（defense/arm=10），各 O0/O1/O2 實際 field/throw、receiver receive/baseTouch、Runner／Force／ThirdOut／Record。這些是控制案例，不是自然頻率證明。NPC 各 A/chance +1，PO/E 0；player 1B 因真正接傳與踩壘才有合法 PO。NPC 1B 另用原 vNext SS→1B 三個 outs 狀態，真接傳與 terminal 取得 PO。原 S2-A／Recovery 邊界未變。

## 9. Outfield G1-A／G1-B Reuse

完工原 G1-A 29/29、G1-B 43/43 全 PASS，stdout SHA 與開工相同。各 LF/CF/RF×O0/O1/O2 的 physical truth、actual actor／capabilities、catch／landing／retrieval／runner／official single／原 PA／Record／continuation 全留於 Evidence acceptedOutfieldReuse。外野公式、Source Freeze 原 pins、自然 G1-B opt-in 均未放寬。single 不虛構 PO/A/E；NPC 不取得玩家守備 growth。

## 10. Match／Record Before／After

| 控制的原 PA／Record 指標 | Before→After delta |
|---|---|
| 捕手一般第三好球 | C PO +1、chance +1、A/E 0 |
| 投手 | pitching BF +1、SO +1、outsRecorded +1；defense PO +0 |
| 打者 | PA +1、AB +1、SO +1；H/R/壘包無新增 |
| Match | out 恰 +1、比分不變；O2 第三出局清壘並可換半局 |
| 重送 | 原 callback 或換 eventId、同 catch identity，PA/BF/SO/PO/out 均 +0 |

Evidence production.catcher 保存六例完整原 Record before/after、original PA event／thirdOutResolution 與 continuation；內野保存 actions→ordered retirement→attribution→原 playerLine，外野保存原完整事件。

## 11. Normal Full-Match Evidence

使用原 makeContext／careerFixture（二壘手情境，seed 77001）→choose(critical_offseason,1)→原 public choices／playback。事前固定策略：有 take 選 take，否則首個合法 choice；原 public choice sample .62。未強制投球、擊球、接捕、actor、能力或結果，未將控制案例拼成比賽。

實測 146 ticks 完整終場，home 5：away 3；Record status=final，finalScore 與 Match 一致，H=home 15／away 14，E=0／0。兩邊各九人、ID 唯一、active defense validation 均 ok；15 次半局結束全為三出局、清壘，86 個帶 before/after 事件核對 outs 範圍及壘上身份唯一。終場為原合法 walk-off，未要求最後半局額外三出局。

正常流程出現 2 個真第三好球接捕事件，正式 C PO 已入帳；Match integrity／Record integrity 均 []。第 50 tick 真 saveGame/loadGame 後續打至終場；原 development settled=true，兩個既有 development settlement ID 唯一，完成後再存讀＋原 settle 不改 Record／experience／永久 skills。未生成 G1-B natural single resolution。完整 log／rosters／Record／experience 在 Evidence production.normalGame。這是原 VM 正式入口驗證，未宣稱人工瀏覽器操作驗收。

## 12. Save／Reload／Duplicate

prepared／executed／settled 三個真 saveGame/loadGame checkpoint 在 O2 保留 PA/P/C/pitch identity，還原後只提交一次 PA/BF/SO/out/C PO。另有同 callback、換 eventId 的防重與 failed catch 重試固定 sample。正常比賽進行中與終場存讀皆通過。

負向涵蓋錯 C／守位／P、stale PA/batter、投球後能力變動、未捕／落地、假 possession、假 throw、非法 runner terminal／third-out、duplicate C／同時在 bench、改 sample 重新計算 facts、未完成 P 補位。拒絕前後 Record 不變；新增 C 正例亦確認玩家沒有 NPC 捕手守備的 active evidence，永久 skills 未被直接改動。

## 13. Regression Results

| 驗證 | 結果 |
|---|---|
| 開工原四套關鍵 CLI | 4/4 PASS |
| G1-C 新專項（含正常完整比賽） | 55/55 PASS |
| 完工相關原 CLI | 25/25 PASS，全部 exit 0 |
| 原 pitch Source Freeze | 7 組／95 functions／25 globals／131 rejected mutations PASS |
| 原 G1-B Source Freeze | 24 rejected mutations PASS |
| 新 G1-C 精確反轉 guard | 9 rejected mutations PASS |
| 僅五個既有變更檔 git diff --check | exit 0 |

完成期首輪第 24 個 Plate Decision 原測試曾因新增捕手檢查過早，在精簡 roster 的 PA 準備階段失敗（exit 1）。保留失敗紀錄；將缺 C 記為 null，於三振正式提交時才檢查，原測試未改。之後重新執行全部 25 套，皆通過。該修正亦未放行缺 C／未捕第三好球結算。

### 完工原 CLI 命令

| Command | Exit |
|---|---|
| `node tests/g1-b-outfield-single-grounded-continuation-test.cjs` | 0 |
| `node tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | 0 |
| `node tests/match-vnext-same-ball-execution-contract-test.cjs` | 0 |
| `node tests/match-vnext-same-ball-production-integration-test.cjs` | 0 |
| `node tests/bbp-b2b1-fly-ball-production-integration-test.js` | 0 |
| `node tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | 0 |
| `node tests/match-full-game-record-test.js` | 0 |
| `node tests/match-situation-lifecycle-test.js` | 0 |
| `node tests/defensive-opportunity-production-integration-test.js` | 0 |
| `node tests/defensive-reach-secure-production-integration-test.js` | 0 |
| `node tests/defensive-decision-throw-foundation-test.js` | 0 |
| `node tests/defensive-decision-throw-production-integration-test.js` | 0 |
| `node tests/defensive-runner-throw-settlement-foundation-test.js` | 0 |
| `node tests/defensive-reach-secure-foundation-test.js` | 0 |
| `node tests/force-advancement-foundation-test.js` | 0 |
| `node tests/canonical-match-regression-integration-test.cjs` | 0 |
| `node tests/pitch-production-source-scope-test.js` | 0 |
| `node tests/bbp-b2b2-tag-up-decision-execution-test.js` | 0 |
| `node tests/bbp-b2a-line-drive-production-integration-test.js` | 0 |
| `node tests/active-defensive-assignment-integrity-test.js` | 0 |
| `node tests/ground-ball-defensive-settlement-lifecycle-regression-test.js` | 0 |
| `node tests/pitch-sequence-state-production-integration-test.js` | 0 |
| `node tests/pitch-tactical-decision-production-integration-test.js` | 0 |
| `node tests/plate-decision-production-integration-test.js` | 0 |
| `node tests/full-game-player-line-test.js` | 0 |

測試全為原 node <exact-file> 實際磁碟 CLI，使用既有 classic-script VM harness，無來源替換或虛擬檔案系統。內野只取原 fixture 宣告／setup prefix，再執行原 production；未執行該測試的大型 400-game cohort。沒有無差別全庫 regression／Monte Carlo。

## 14. Protected／WIP Integrity

完工 tracked modified=6：原 Protected tests/fast-check-smoke-test.cjs 1 個＋本輪 5 個既有檔案。untracked=1,224：原 1,220 全保留＋本輪 test／guard／兩報告 4 個。僅本輪九個精確路徑改變；清單外 1,965 個可讀原檔 SHA 全同，12 Protected size/mtime 全同。原 G1-A／G1-B 與歷史報告未改。Protected 未讀內容、雜湊或執行。

HEAD／Parent／Tree／index 與開工全同，staged 空，upstream origin/accepted-gameplay-g1-b-v0.1 為 0/0。main、origin/main、原 Accepted Baseline 及其 tracking refs、origin/G1-B 全同。跨使用者繼續執行輪次的三筆 Codex capture refs 新增／替換獨立記錄，未宣稱所有內部 refs 跨輪不變；所有非 Codex refs 變化為空。未執行 Git 寫入。

## 15. Remaining Natural Gameplay Gaps

本輪閉合最低 NPC 責任，不是全自然 detailed outcomes：保留合法 compressed PA；compressed／historical K 缺真接捕 facts 時不追補 C PO。未捕第三好球跑壘、bounced／特殊詳細 K、不具接捕證據的詳細三振保持 fail-closed，未新增自動出局捷徑。player C 不在 NPC 接捕新路徑內。

G1-B detailed single 自然 admission、S2 Recovery 自然模式仍關閉；外野長打／error／relay、九守位玩家操作、全自然逐球接捕及 Phaser 不在此驗收。暫定 catch demand 需未來獨立 gameplay 校準，不能由本輪一場正常比賽推論所有 seed 或特殊情境安全。

## 16. G1-C Final Status

**G1_C_PASS**：九個最低 NPC 責任路徑、合法實際動作、正式歸屬、原 PA/Runner/Record 一次性、正常整場、存讀／防重、25 套相關回歸與原 WIP/Protected/Git 完整性均通過。

適合另行授權 G2 Live Public Match Bridge 的有界工作：接既有 public Match／event／Record，保留 admission 與未支援情境限制。這是下一階段適用性評估；本輪沒有開始 G2／G3 或新 Sprint，沒有 Stage／Commit／Push，沒有宣告 NATURAL_DETAILED_MATCH_READY、PLAYER_NINE_POSITION_READY 或 PHASER_ALPHA_READY。
