# G2-A — Live Public Match Bridge v0.1

狀態：**G2_A_PASS**。本輪限定於唯讀 Public Read Model、正式載入接線及相關驗證；沒有改變 Match、投打／物理／守備／跑壘／Scorer 或 Save schema。

## Baseline 與施工範圍

- Branch：accepted-gameplay-g1-c-v0.1
- HEAD：9c829c32663c808686b187ce15807b297663ed4f
- Parent：95c75a7ebeba7f052a6d227733dc48555f356d3c
- Tree：cc7c37244b6c6f9151792e64157b874ff0f8aa8f
- Upstream：origin/accepted-gameplay-g1-c-v0.1；Ahead／Behind 0／0。
- 原 tracked WIP 1、原 untracked 1,222、staged 空；初始 12 Protected metadata 全符合。
- 本機與 origin 四條正式分支 baseline 均先經唯讀核對。未執行任何 Git 寫入或分支切換。

新增 live-public-match-bridge.js、G2-A 專項測試與兩份 G2-A 文件；index.html 只增加一行 Bridge 載入。tests/pitch-production-source-scope.cjs 僅增加精確載入反轉，之後仍執行原完整比對與歷史 pins。

## Phase 0 與 Source Owner Matrix

已依使用者 AGENTS 指令讀取 C:/Users/User/.codex/skills/codebase-memory/SKILL.md。正常唯讀提權成功；目前沒有圖工具可呼叫，因此以限定來源／caller 檢查與原 VM 受控執行核對，沒有宣稱 graph/index coverage。未發現需要重構核心 Match 的本輪必要變更。

| Public 欄位／介面 | 正式來源與 Owner | 讀取邊界 |
|---|---|---|
| Match identity/state | player.highSchoolMatch；script.js original Match execution; player.js defaults | No prepare/ensure helper is invoked on read |
| Visible scoreboard/inning/outs/bases/batter | simulationLog.slice(0,presentedEventCursor), event.presentationSnapshot；recordHighSchoolMatchSimulationEvent / advanceHighSchoolPresentationCursor / MatchGameRecord.getScoreboardFromEvents | Exclusive cursor, same as existing presentation; no full-future scores |
| PA/Pitch/Situation identity and routes | activeSituation.contextSnapshot.paIdentity / sourcePhysicalStateRef / situationId / legalRoutes; offensivePlateAppearanceState；PlateDecisionFoundation.prepare / MatchSituationLifecycle | Actual presented admitted situation; reject stale identity; other decision adapters explicitly unsupported |
| Original decision submission | chooseHighSchoolYearOneMatchMoment(decision,expectedMomentId)；script.js original controller | Read model exposes no submit method; compatibility test uses original entry |
| Executed pitches/physical/defensive/terminal | retained pitchHistory + original event physicalTruth / executionRefs / actionFacts / catchResult / outfieldSingleFacts / thirdStrikeCatch；OffensivePlateApproach, same-ball adapter, G1-A/G1-B/G1-C settlement owners | Only observed, completed facts; strict output allowlists; no private pitch intent/samples |
| PO/A/SO and record consistency | MatchGameRecord eventRefs, existing defensiveAttribution, canonical playerLines only when entire current log is revealed；MatchGameRecord.recordEvent | Never recompute scorer; pending if complementary/future events remain |
| Next PA/final | event.presentationSnapshot.currentBatter, sideChange, gameEnd；original batting-order/playback/finalization | No derived PA identity; absent identity remains unavailable |
| Save/reload | save.js normalizeSave restores simulationLog/cursor/record/lifecycle and retained histories；saveGame/loadGame/normalizeSave | No Save schema change; transient histories without retained source are unavailable |

getHighSchoolYearOneMatchMomentChoices 可能呼叫 ensure，因此投影不呼叫它。Plate routes 直接讀取原 activeSituation；尚未接入的高階打擊／agency／守備／tag-up routes 回報 unsupported，保留原 UI 與原決策入口。

## Public Snapshot Contract

正式 API 全部位於 LivePublicMatchBridge，版本 g2-a-live-public-match-v1：

- project(match, {matchId?,paId?}) -> {snapshot,timeline}
- projectSnapshot(match, expected?)
- projectTimeline(match, expected?)
- readCurrent(expected?)
- createConsumer(readSource?) -> {read,advancePresentation}

沒有有效 Match 時回傳有 status／reason 的不可用 envelope；有效 Match 的 snapshot 包含 identity、revision、sourceAuthority、game、participants、decision、lastResolution、continuation、record。值欄採 {status,value,source,reason?}；四種 status 為 available／unavailable／pending／unsupported。缺值用 null，沒有以 0 或空壘假裝已知狀態。

- identity：原 matchId、當前已呈現 PA／Pitch／Situation identity；已結算 PA 不被當成下一 PA 身分。
- revision：純公開內容的確定性指紋，僅供畫面更新判斷，不能用來授權 Gameplay。
- game：局數、上下半局、R、outs、球數、壘包、攻守隊與 gameStatus。Scoreboard 經原 MatchGameRecord.getScoreboardFromEvents 的可見前綴 query，沒有另寫 Scorer。
- participants：打者、投手、玩家角色／守位與可操作 actor；只輸出公開身分，沒有 NPC 能力或私有計畫。
- decision：等待狀態、contract、實際 legalRoutes 與來源標籤、decision identity、提交狀態、原入口名稱與 expectedMomentId。沒有新增 submit API。
- lastResolution：最後可見正式結算的 Public Event，附原來源及 before／after、runner changes／retirements／attribution（來源實際存在時）。
- record：可見 Scoreboard；完整目前 log 都已揭露後才提供原 playerLines 的白名單統計，否則 pending。
- continuation：只說明原流程仍需決策／執行／揭露，沒有推進比賽的能力。

全部輸出遞迴 frozen，與原狀態分離；投影不初始化 Match、不寫 cache、不消耗 RNG，也不呼叫原決策或結算函式。

## Public Timeline Contract

支援來源確有證據的 MATCH_STATE、DECISION_PRESENTED、DECISION_ACCEPTED、PITCH_RESOLVED、BALL_IN_PLAY、DEFENSIVE_ACTION、PLAY_SETTLED、PA_SETTLED、HALF_INNING_CHANGED、MATCH_FINAL。每場不強制產生所有種類。

每個事件含穩定 eventId、matchId、paId（非 PA 事件可能 null）、source.owner／identity／eventId、order.sourceSequence／evidenceOrder／basis 與白名單 facts。identity 由版本＋原 Match＋類型＋原來源 identity 組成；先核對 GameRecord.eventRefs provenance，拒絕身分錯誤、來源亂序及衝突證據，按 identity 去重。

排序沿用原 simulationLog.sequence；同來源封包內依已存在的 pitch index／lifecycle／completed action 順序。G1-A／G1-B 的原 journal 先寫 PA，再寫外野 Resolution，所以公開 Timeline 忠實保留該來源順序，不能把它冒稱逐毫秒物理時間軸。原來沒有保留的早期 decision transitions 不會補造。

球種／球速／位置只取已執行 pitchHistory 實際欄位；Physical 只取粗分類 identity／contactQuality／ballType／pace／direction／depth。Pending pitch truth、AI intent／target／distribution／samples／debug payload 不公開。

## 四條正式受控 Gameplay 投影

| 案例 | 原入口與結果 | 公開核對 |
|---|---|---|
| A | 原 Career admission → chooseHighSchoolYearOneMatchMoment → actual pitch/contact → 原 same-ball SS→1B adapter → 原 PA／GameRecord | 提交前／後、原 Pitch／Physical identity、field→throw→receive→baseTouch、outs 0→1、1B PO+1／SS A+1、PA+1、下一打席 |
| B | 原 G1-A LF fixture/setup → prepareHighSchoolDefensiveMomentFromSimulation → 實際 NPC 接殺 | LF identity、completed catch、outs 0→1、LF PO+1、原 PA／Record、下一打席 |
| C | 原 G1-B CF fixture/setup → 原 fair landing／approach／pickup／first hold | 真實 CF、controlled possession、outs 維持 0、player 停一壘、H+1／PA+1、原 Record、下一打席 |
| D | 原 public pitch decision 連續 take → 原第三好球接捕／原 PA settlement | 3 個原 Pitch、C possession／PO+1、P SO+1、打者 SO+1、outs 0→1、下一打席 |

- Case A：Match `hs-y1-autumn-exhibition`；PA `hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|1|下`；15 個 settled-view Public Events；下一打者 `school-powerhouse-0bfa7b80-player-05`。
- Case B：Match `hs-y3-final-competition-1`；PA `hs-y3-final-competition-1|5|上|away|hs-y3-final-regional-opponent-player-05|2|0|falsefalsefalse|ordinary-contact`；8 個 settled-view Public Events；下一打者 `hs-y3-final-regional-opponent-player-08`。
- Case C：Match `hs-y3-final-competition-1`；PA `hs-y3-final-competition-1|5|下|home|player|0|0|falsefalsefalse|ordinary-contact`；8 個 settled-view Public Events；下一打者 `school-powerhouse-409d352a-hs-year-2-age-17-incoming-04`。
- Case D：Match `hs-y1-autumn-exhibition`；PA `hs-y1-autumn-exhibition|hs_y1_match_moment_1|player|1|下`；12 個 settled-view Public Events；下一打者 `school-powerhouse-0bfa7b80-player-05`。

四案例的完整 submitted／settled／next Snapshots、Timeline、來源 identity 與原 Owner proof 均在 Evidence.cases。A/D 透過原 public decision handler；B/C 只重用原已驗收 fixture/setup prefix 的合法輸入，沒有以靜態 Snapshot 代替 Match 結算，沒有執行其舊 cohort 來冒充本輪證據。測試使用原 classic-script dependencies 與原 VM harness，未作手動瀏覽器驗收。

## 原 Match → Public 差異與缺失資料

原始 Match 可能領先畫面。A 提交後、cursor 尚未揭露 PA 時，公開 outs 仍為 0，Record playerLines 為 pending；原揭露完成後才出現 outs 1 與 PO／A。重複讀取相同來源會得到相同 byte-stable 投影。

當原系統已移到下一打者，但尚未建立／呈現新的 PA identity，公開 batter 正確切換，paId 則 unavailable；不沿用已結算 PA。對 expected matchId／paId 的 stale 請求會拒絕。

| 覆蓋項目 | 狀態 | 限制 |
|---|---|---|
| Presented plate-decision identity/routes/count | available | Only an actual admitted presented PlateDecision; other contracts unsupported. |
| Current next-PA identity | unavailable | Until original producer creates/presents it; batter identity is separately available from original presentationSnapshot. |
| Future Game Record player lines | pending | Canonical player lines exposed only when current simulation log is completely revealed; scoreboard always uses original prefix query. |
| Held same-ball or incomplete defense | pending | No PA_SETTLED/PLAY_SETTLED without original recorded completion. |
| Executed pitch type/velocity/location | available | Only keys present in retained executed pitch evidence. Missing observations stay absent. |
| AI intent, pre-execution samples, private distributions | unsupported | Never exported, even from completed raw debug payloads. |
| Historical exact decision/pitch observations not retained by original save | unavailable | Timeline reports unavailablePaEventIds; no outcome-to-pitch reconstruction. |
| Millisecond trajectories / complete animation path | unsupported | Source journal/lifecycle order only; no invented flight timing or coordinates. |

## Save／Reload

六個實際 saveGame／loadGame 檢查：A settled、B settled、C settled、D nonterminal pitch、D settled、normal final。每次公開 Snapshot／Timeline 全等，原比分／outs／Record／RNG seed／永久能力不因讀取或 Reload 再結算。另有原完成 callback 與決策重送測試。

可重建 Snapshot 來自原持久化 Match、log／cursor、GameRecord。Timeline 只來自仍保留的事件／pitchHistory／closed situation；缺失原逐球歷史時明確列 unavailablePaEventIds，仍保留已證實的 PA／守備事件。沒有改 Save schema，也沒有替原 same-ball transient proof 建立新的恢復權限。

G1-B 原已結算 outfield resolution 可和舊 awaitingDefense 旗標並存；Bridge 以原已記錄的完成事件判定，避免 normalizeSave 清除暫態旗標後讓公開狀態變動，未改原 Gameplay。

## Consumer 使用方式

```javascript
const { snapshot, timeline } = LivePublicMatchBridge.readCurrent();
const view = LivePublicMatchBridge.createConsumer();
const nextPublicEvent = view.advancePresentation(); // 只讀／只推進消費者已播放 ID
// 提交 Gameplay 仍走原入口，Bridge 沒有 submit 方法：
const d = snapshot.decision;
if (d.status === "available" && d.waiting) {
  const route = d.routes.value[0];
  chooseHighSchoolYearOneMatchMoment(route.matchDecision, d.expectedMomentId.value);
}
// 決策後重新 readCurrent；原 Match playback 負責執行及可見 cursor。
```

createConsumer 的唯一播放記憶是已讀 event identity Set；不保存第二套 Match state。HTML/CSS 或 Phaser 可讀同一 API。本輪未新增 DOM、漫畫分鏡、動畫、場景、素材或 Phaser 工程。

## 測試與回歸

G2-A 專項 **34/34 PASS**；11 套直接相關驗證全部 PASS。涵蓋 schema／immutability／provenance／ordering／dedup／stale identity／pending與unsupported／四條 Gameplay／Record／Save／No RNG與No mutation。最後調整 unsupported decision waiting 語意後，再執行 G2-A CLI，仍 34/34 PASS。

| 正式 CLI | PASS 項目或摘要 |
|---|---|
| tests/g2-a-live-public-match-bridge-test.cjs | 34 |
| tests/g1-c-nine-position-npc-minimum-closure-test.cjs | 55 |
| tests/g1-b-outfield-single-grounded-continuation-test.cjs | 43 |
| tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs | 29 |
| tests/match-vnext-same-ball-execution-contract-test.cjs | 套件 PASS |
| tests/match-vnext-same-ball-production-integration-test.cjs | 套件 PASS |
| tests/scoreboard-presentation-integrity-test.js | 22 |
| tests/scoreboard-presentation-production-integration-test.js | 14 |
| tests/match-situation-lifecycle-test.js | 23 |
| tests/plate-decision-production-integration-test.js | 15 |
| tests/pitch-production-source-scope-test.js | 7 |

Match vNext Contract 原 94 項 source delta／5 個歷史 pins 保留；Source-Scope 原 95 functions／25 globals 與 131 mutation rejections 保留。新 G2-A Guard 另核對整個原 scope helper 在精確反轉後與 G1-C Commit 完全相同，並拒絕 5 種 loader 變異。

首輪選定回歸曾因新 index 載入行被舊 full-source freeze 擋下，該原始失敗紀錄另存 temp；隨後加入唯一 loader 反轉，再執行原完整檢查，全數通過。沒有改 pins、skip、削減原 assertions 或替換測試檔。

正常公開 Career 比賽：146 步、11 個 decision-boundary 讀取、最終 5：3、272 個 Public Events；半局轉換／MATCH_FINAL／GameRecord totals／unique development settlement 與 final Reload 均通過。Syntax 與指定兩個 tracked delta 的 diff --check 通過。

## WIP／Protected／Git 完整性

原 tracked WIP 1 與原 1,222 untracked 的路徑／狀態全部保留。除授權 index／Guard 以外，1,964 個其他允許核對的原檔案 SHA、六個原 G1-C core/candidate 檔案 SHA、兩份原 G1-C 報告與歷史驗收 artifacts SHA 均未變。12 Protected 只核對 size／mtime，不明確讀取／雜湊／執行其內容。

HEAD／Tree／upstream／正式本機及遠端 refs 維持 baseline；staged 空，index SHA256 `5a054101f435dd13fc660543f16b00e93279df2c4724610a54285d015d5e01e2` 未變。執行中使用者「繼續執行」訊息前後的工具管理 refs/codex captures/checkpoints 差異單列於 Evidence.integrity.refDifferences；不是本輪 Git 命令寫入，未將其宣稱為原值不變。

最終預期 tracked modified 3（原 WIP 1＋index／scope 2）、untracked 1,226（原 1,222＋本輪新增 4）。本輪沒有 Stage／Commit／Push／分支切換／Merge／Rebase／Reset／Restore／Clean／Stash。

## 修改檔案 SHA256

| 路徑 | 狀態 | SHA256 |
|---|---|---|
| index.html | M | ba32b21f24f62dac28b4300cf701a1fdfdb3a419db3580a8972c66ed62ecddcd |
| tests/pitch-production-source-scope.cjs | M | cc98ef0fd98f4ad128e5a714b1823c3a294bef1b6c01d06bfc7391f049046644 |
| live-public-match-bridge.js | A | a7b250c7ed8d284a142377b5f33219be74de25498ab2c19fa1335fb74c54ccf9 |
| tests/g2-a-live-public-match-bridge-test.cjs | A | 8ed2c64b539c0d78e4207927f298fde7a5c787791c04296f36fe778edd626b3e |

另新增本報告與同名 Evidence JSON。六檔完整最終 SHA Manifest（包括報告與 Evidence 本身）保存在 `C:\Users\User\AppData\Local\Temp\g2-a-bridge-1Hzi3O\changed-files-manifest.json`，避免自我引用檔案 SHA 循環。

## G2-B／G3 Readiness

G2-B 尚未驗收，ready=false：需另定 Natural Mixed Match 範圍、各種高階 approach／agency／守備／tag-up decision 的 public route adapters、更多自然模式資料覆蓋與缺失逐球來源政策。本輪只有四條已驗收 controlled paths 加一場既有正常 Career 完整比賽，沒有開啟新 detailed branches 或改 admission policy。

G3 Presentation ready=false：仍缺前端呈現設計、動畫時間／空間資產規格、場景與資產；本 Bridge 不提供不存在的精確軌跡或毫秒 clock。本輪不開始 G2-B／G3／Phaser，alpha readiness 不因本輪 PASS 而變更。
