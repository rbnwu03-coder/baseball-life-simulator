# G1-A — Outfield Flyout Attribution & LF Coverage v0.1

日期：2026-10-19（Asia/Taipei）  
結果：**G1_A_PASS**。此結果限本輪 NPC 外野飛球接殺；Alpha 與新 S2 自然模式仍未放行。

## 1. Baseline

以磁碟工作樹施工。HEAD、main、local origin/main 均為 `ab3117653945de0b7013636187c446276a96e634`。index SHA256 為 `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`，staged 為空。開工為 19 個 tracked WIP、1,221 個 untracked files；續作前 status digest 與原先記錄一致。

指定三項開工測試皆 exit 0：Match vNext execution contract、Match vNext production、BBP-B2B1 Fly Ball production（15/15）。未在失敗基線上施工。完整時間、stdout digest 與來源 SHA 見同名 Evidence。

已閱讀 Gate、S1、S2 文件與使用者提供的 AGENTS instructions。codebase-memory skill 透過正常提權讀取成功；其圖譜工具未提供，未執行 graph、reindex 或假報 coverage，結構核對採確切來源及原測試。未沿用前輪 skill 讀取例外。

## 2. 原 CF／RF PO Missing Root Cause

原 `applyHighSchoolFlyBallCatchResolution` 已透過原 PA owner 提交一次 PA、出局、runner／third-out 與打序，另記 `flyBallCatchResolution`。Game Record 的守備派送只識別 `playerRoutinePlay`、defense meaningful moment 與 `defensivePlay`，因此沒有把接殺交給實際 CF／RF 的守備列。

本輪保留原事件型別，補 completed catch credit metadata，驗證後才派送既有 `recordDefensivePlay` 接殺分支。沒有第二個 PA、第二次增加 out，或在 script 直接修改 PO。

## 3. 精確修改檔案

| 檔案 | 修改 |
|---|---|
| `batted-ball-fly-ball-defense.js` | LF direction/position support；機會保存 admission |
| `script.js` | 四個既有飛球接點；新增 `validateHighSchoolFlyBallCatchState` |
| `match-game-record.js` | 完整接殺事件驗證、既有 catch ledger 派送與 play identity 防重 |
| `tests/bbp-b2b1-fly-ball-production-integration-test.js` | LF 正例取代原 unsupported 預期；保留 shallow／missing 負例 |
| `tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | 原 left fixture 的 RF 錯配仍拒絕；更新原因 |
| `tests/defensive-opportunity-production-integration-test.js` | LF/deep 正式 access 預期更新；所有 stale/roster 斷言保留 |
| `tests/bbp-b2b2-tag-up-decision-execution-test.js` | fixture 補實際 roster 能力、PA／admission／Physical／mapper 關聯；原 21 項斷言保留 |
| `tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | 29 組正式 Runtime 驗收與可重現 Evidence 輸出 |
| 本報告及同名 Evidence | 驗收與完整性記錄 |

`script.js` 既有修改僅 `getHighSchoolFlyBallDefenderCatchContext`、`ensureHighSchoolOrdinaryGroundBallInPlayHandoff`、`resolveHighSchoolFlyBallCatchOpportunity`、`applyHighSchoolFlyBallCatchResolution`。以開工 SHA 完全相同的 S2 accepted source 為比較基準，移除新增 helper 並還原四函式後，其餘來源逐字相同（換行正規化比較）。

未改 Record schema/version、PA 計算、Runner、Force、Third-Out、Scorer 規則、Save schema、Career formula、Source Freeze pins 或 guard callers。

## 4. LF Fly Catch Access Extension

`leftSide → 左外野手` 與原 `middle → 中外野手`、`rightSide → 右外野手` 共用 access、reach、window 與 secure/catch execution。仍限定 `flyBall`、`medium/deep`，且 primary responsibility、active roster actor 與位置必須一致。

Shallow、GroundBall、LineDrive、錯誤外野 actor、無 reach／過期 window 不會因左側球而自動接殺。LF/deep access 另由既有 Opportunity 整合測試驗證，九個正式結算案例採 medium 空壘。

## 5. 真實守備員／能力來源

正式 index Runtime 的 Opportunity 綁定 active NPC，玩家 OF exclusion 保留。能力透過原 `getDefensiveSimulationCapability(activeNPC)` 與 Reach/Secure adapter 消費；metadata 保存 actor ID、roster source、raw defense/arm/speed、catching/reaction/range、明示 fixture overrides，以及 reach／secure 的 inputs、identity、variation。

九個主案例未覆寫 NPC 能力：

| 守位 | 實際 ID | catching/reaction/range |
|---|---|---|
| LF | `school-powerhouse-409d352a-player-07` | 8/8/8 |
| CF | `school-powerhouse-409d352a-hs-year-3-age-18-incoming-02` | 9/9/9 |
| RF | `school-powerhouse-409d352a-hs-year-2-age-17-incoming-01` | 7/7/7 |

另行預宣告能力對照：LF defense=0 時沒有可用 reach；20 時接殺成功。相同 LF Physical identity、speed=20、secure roll=.999 下，defense=4/8 均 favored arrival，secure margin 分別 -.498/+3.502，結果為 notCaught/caught，證明能力影響執行。這些是控制實驗，不是自然頻率；原 NPC 模型以 defense 同時轉接 catching/reaction/range，未新增獨立屬性公式。有效零值在正式 fly adapter 中保留，沒有被預設 5 取代。

## 6. LF／CF／RF O0／O1／O2

| 案例 | outs | PA 增量 | 接殺者 PO/chance 增量 | 接續 |
|---|---|---|---|---|
| LF O0 | 0→1 | 1 | 1/1 | 原 mixed PA 可接下一棒 |
| LF O1 | 1→2 | 1 | 1/1 | 原 mixed PA 可接下一棒 |
| LF O2 | 2→3 | 1 | 1/1 | 原 playback 換至下半局、outs=0 |
| CF O0 | 0→1 | 1 | 1/1 | 原 mixed PA 可接下一棒 |
| CF O1 | 1→2 | 1 | 1/1 | 原 mixed PA 可接下一棒 |
| CF O2 | 2→3 | 1 | 1/1 | 原 playback 換至下半局、outs=0 |
| RF O0 | 0→1 | 1 | 1/1 | 原 mixed PA 可接下一棒 |
| RF O1 | 1→2 | 1 | 1/1 | 原 mixed PA 可接下一棒 |
| RF O2 | 2→3 | 1 | 1/1 | 原 playback 換至下半局、outs=0 |

全數經 `prepareHighSchoolDefensiveMomentFromSimulation` 與原正式 handler；使用實際 index scripts 的 VM harness、真 roster 與明示 pitch/contact/physical/secure 外生輸入。不是純函式代替 Production，亦不是瀏覽器人工驗收。

## 7. Match／Game Record Before／After

九例均為一個由原 OPA pitch history 產生的 Physical、一個 catching NPC、一 PA、一個 `caughtBallOut` ordered retirement；AB +1、H/E/A/score +0，其餘守備員 PO/chance 不變。Match／Record integrity issue lists 均空。

每例 Evidence 保存 Physical truth、admission、actual IDs/capabilities、access/secure/catch、PA/ref/retirement、事件及精簡 before/after player lines、totals、eventRefs。O2 經原播放游標排空並正常換邊，未再提交 PA，接殺者 PO 保留。

另以 seed 77001、原 Career fixture skills=12、公開選擇 sample=.62 跑一場正常入口比賽，沒有強制該場球型或結果。146 ticks 終場 5:3，Record final/score/integrity 及原 development settlement 正常。第八局上自然出現一次 RF 接殺，Physical、原 PA reference、RF credit 均保存。這一場只證明正常接續，未宣稱三外野自然頻率或全情境覆蓋。原 canonical 回歸另完成四場固定 seed 比賽。

## 8. Defensive PO／Chance Attribution

事件使用 `flyBallCatchCredit` 保存 play identity、game/PA/Physical identity、actor/position、能力來源、completed catch、原合法 retirement 與 PA event ID/sequence。

Game Record 在寫入前驗證原 PA ref 存在、合法 fly/depth/direction、active NPC、實際 caught/secured-before-ground、settled out mapping 與一致的單一 batter retirement。之後仍由原 catch ledger 記 chance +1、PO +1；PA 與 pitcher outs 保持由原 PA event 擁有。原 `defensivePlayIdentity` eventRef 欄位負責跨派送防重。

既有 action attribution 的 terminal 只接受 baseTouch/tag；本輪未偽造踩壘動作，也未擴寫該 Scorer。catch credit 是正式事件轉接證據，不另定義 PO/chance 計算。NPC 接殺不標成玩家 routine play；九例玩家守備列、contribution 不增加，玩家 active experience evidence 為 0。

## 9. Miss／Unsupported／Fail-Closed

既有 mixed 模式在 pitch 前鎖定 `preAdmittedCompressed` 與 mapping rolls，存入 admission；成功接殺採 settledDefense。未接殺保留 notCaught/live-ball facts、無 catch credit，僅依事前模式使用一次 compressedOfficialClassification。三個預宣告 miss 案例均無 PO/chance 或接殺 out；其中 single 是 compressed PA 分類，沒有宣稱已執行拾球／回傳。

未事先 admitted 的 detailed miss 在 fly resolve/apply 邊界拒絕提交，保存同一 notCaught 結果；重複 callback 換 roll 不能重接、抽新 PA 或產生 credit。此負例是非法／未放行政策的邊界測試，本輪沒有加入可自然啟用的 detailed OF miss 模式或通用 pending-play scheduler。

wrong LF/CF/RF、invalid active roster、能力/來源改動、Physical identity/trajectory/depth 錯配、過期 window、stale batter/outs、偽造 completed result 均在 Match／Record 寫入前拒絕。Record 另驗證九種不合法 projection。

## 10. Duplicate／Save／Reload

重複 resolve/apply 不改 PA、outs、打序、log、PO/chance。原 fly 事件與同球 defensivePlay projection 重複派送時回 duplicate，原 eventRefs 也不增加。

真正呼叫 `saveGame/loadGame`：pending、已 execution、已 settlement 三個 checkpoint 均保留 catch state；載入後每例 PA=1、outs=1、PO=1、chance=1，再次 callback 無副作用。自然終場重複 settlement 未改 Record、experience 或 skills。

相容性界線：歷史已 settlement 的 fly state 直接返回既存 receipt，不倒補舊 PO；缺少 admission/能力證據的舊未結算狀態會保守拒絕，不自行猜補資料。本輪未開發該類舊 pending save 的 migration，亦未改 Save schema。

## 11. 既有系統回歸

全部列出的命令均 `node tests/<file>`、exit 0；確切命令、時間、stdout digest 見 Evidence。

| 測試 | 結果 |
|---|---|
| match-vnext-same-ball-execution-contract-test.cjs | PASS；94 source assertions、95 protected script functions |
| match-vnext-same-ball-production-integration-test.cjs | PASS；R0/S1/S2-A/Recovery 既有 groups |
| bbp-b2b1-fly-ball-production-integration-test.js | 15/15 |
| bbp-b2b1-fly-ball-tag-up-legality-test.js | 17/17 |
| match-full-game-record-test.js | 13/13 |
| match-situation-lifecycle-test.js | 23/23 |
| defensive-opportunity-production-integration-test.js | 14 PASS |
| defensive-reach-secure-production-integration-test.js | 12 PASS |
| defensive-decision-throw-foundation-test.js | 24 PASS |
| defensive-decision-throw-production-integration-test.js | 16 PASS |
| bbp-b2b2-tag-up-decision-execution-test.js | 21/21 |
| bbp-b2a-line-drive-production-integration-test.js | 17/17 |
| active-defensive-assignment-integrity-test.js | 30 PASS |
| ground-ball-defensive-settlement-lifecycle-regression-test.js | 26 PASS |
| canonical-match-regression-integration-test.cjs | 50/50，四場固定 seed |
| g1-a-outfield-flyout-attribution-lf-coverage-test.cjs | 29 組 PASS |

開發中修正過測試 observer 的 before 物件引用、frozen fixture mutation、miss 控制能力/mapper sample，以及測試使用錯誤 development property；它們不是正式來源 baseline failure。相關舊 LF 預期與直接拼接的 Tag-up fixture 已明示更新，沒有刪除斷言或放寬 source guard。

## 12. Git／WIP／Protected Integrity

HEAD/branch/local origin-main、index SHA、staged 均維持開工值。原 status 排除本輪新增六個 tracked 修改及三個新檔後，與開工 digest 一致；原 script WIP 以精確函式外比對保留。預期交付為 25 tracked modifications、1,224 untracked，只有本輪 10 個允許路徑新增內容變更。

Gate 的 125 來源 SHA 再核對，只有六個本輪授權來源不同，其他 119 個一致；這是既有 accepted manifest 比對，不是本輪全庫開工內容 manifest。額外修改的 fly unit test 原為 clean tracked 檔，精確單行 delta 另列 SHA。12 個 Protected size/mtime 全部一致，未執行或寫入這些檔案。未 Stage/Commit/Push/Reset/Restore/Clean/Stash。

方法偏差：有一次 `git diff --check` 未限定路徑，Git 可能讀取既有 `tests/fast-check-smoke-test.cjs` WIP 差異；工具沒有輸出其內容，未做其內容 hash。因此不宣稱全程嚴格 metadata-only。後續格式檢查均限定本輪 allowlist，exit 0；最終 Protected 證據仍僅為 size/mtime，不宣稱其內容 hash 完整性。未修改或讀取其他受保護報告內容。

Evidence 記錄最終檢查時間與本 Markdown SHA；JSON 不自我雜湊。

## 13. G1-A 最終狀態

**G1_A_PASS**：LF/CF/RF 共用合法 catch → 原 PA/retirement → 實際 NPC PO/chance → 下一 PA／換邊，九個控制案例、存讀防重與一場正常 Career 接續成立。所有指定與直接相關回歸通過，授權外來源比較及 Git/index/Protected metadata 檢查通過；方法偏差及舊 pending 相容性限制如上。

完成本輪後停止等待審查。Alpha、Phaser、九守位最低責任與新 S2 Recovery 自然開放均不是本輪 PASS 的含義。

## 14. G1-B 尚待處理的外野 Single 缺口

尚未開發同球落地拾球、保守回傳、終壘證據、OF hit/error scorer 或 relay。現有 compressed single 與未接殺 live-ball facts 保持清楚區分。G1-B 應補真正的 retrieve/return/runner terminal 與原記錄串接，再考慮放行 detailed OF miss；不得以 failed catch 直接指定 single。既有 SF/RBI/AB 重分類缺口仍未解決，未加入捷徑。

本輪未開始 G1-B、G1-C、G2、G3 或 Sprint 2 Scorer/Recovery。

