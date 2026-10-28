# 未出賽回饋與角色維持文案修補 — 2026-10-28

**本輪結果：兩項修補已實作；新增回歸14/14通過，四組固定狀態的非文案資料與修補前一致。既有測試12套通過、1套既有依賴缺漏失敗；沒有逾時。** 未將前輪PASS沿用成本輪結果。

## 基線、邊界與保存

- 分支仍為 `accepted-gameplay-g2-b2-v0.1`；HEAD仍為 `0d3ed173952b9b8e5d5842a73761f649b50be594`，沒有切換／重設／stage／commit。
- 開工已有 `match-pitch-decision-ui.js`、同名CSS、`tests/fast-check-smoke-test.cjs` 修改及前輪全部未追蹤成果。保存快照涵蓋2,091個既有檔案；最終只有允許修改的 `script.js`、`story.js` 改變，其他既有檔案原樣保留。
- 依使用者提供的AGENTS.md讀取codebase-memory skill；本session未提供圖譜工具，因此限定原始碼查核。只沿前輪I-02/I-04及同一文案來源追查，沒有重做全專案設計稽核。
- 本輪修改：既有文案生成／資料選取、回歸測試與交付紀錄。未改評價公式、機會解算、比賽引擎、健康、訓練、NPC狀態機、Save、DTO、依賴、HTML版型／CSS／動畫／素材／切換與default/opt-in。

證據：[本輪基線](feedback-repair-v1/baseline.json)、[保存核對](feedback-repair-v1/preservation.json)、[驗收摘要與數值雜湊](feedback-repair-v1/acceptance-summary.json)。前輪六份報告保持原狀，仍是前輪歷史紀錄。

## 問題原因與實作

### 1. 用同場紀錄選取比賽回饋

原賽後總評只看 contribution 的overallTier；未出賽的零strong／零failure也落入mixed。高橋只看目前角色，starter直接引用第七局，rotation直接引用打席；阿哲電話部分文字也預設存在自己的打席。角色、勝負與下一場用途都不足以證明玩家做過什麼。

新增內部唯讀 `getHighSchoolMatchFeedbackEvidence`（[script.js](../../script.js)，約13580行），取證方式：

1. 正式ledger的gameId必須等於目前match.id；讀player正式打擊／投球／守備數據及同場曝光。已結算曝光也要核對matchId。
2. 一個可引用的決策須同時存在於completedMoments、同場simulationLog的meaningfulMomentResolved，以及official eventRefs；比對sequence、局數、半局、domain、decision與outcome，並排除同事件重複引用。
3. 只有出賽紀錄、沒有可連結決策時，可以說有出賽，不能補局數、判斷或執行細節。沒有足夠參與證據時說資料不足。
4. 舊資料沒有ledger時，同matchId的finalized exposure可確認「未出賽」，不能用它生成特定場上動作。其他不完整資料採中性文案。

這是臨時的文案取證結果，不新增DTO／持久欄位，也不回寫正式曝光或改原participationTruth。原賽後成長、評價、角色與機會結算仍走原流程。

教練依已連結的decisionQuality／executionQuality選回應：未出賽不評論個人動作；判斷與執行不混淆；至少兩個有根據的判斷才說「有幾球你看對了」。有好判斷也有questionable時會同時指出兩者，不以球隊勝負掩蓋個人內容。

高橋依實際可連結的最後決策引用局數與打席／守備；缺證據就保留外部同世代標準與下次準備的語氣。原entryType（direct/limited/observed）、旗標、yearTwoPressure不變；entryType不再被當成出賽或面對面對局的證據。阿哲保留原variant／印象與關係效果，只讓打席話題依正式PA存在與否分流。

### 2. 用前後角色值描述維持、升降與未知歷史

原settlement比較 `change === "unchanged"`，實際owner回的是`same`；第二次角色回饋又直接信任change標記。舊資料缺previousRole時，會把「前次角色」或預設bench當成真實歷史。

新增 `formatHighSchoolRoleChange`（約13641行），比較existing previousRole/currentRole值：

- 同值：只寫維持該角色。
- 不同有效值：依既有bench→rotation→starter順序描述升／降；理由仍來自同場既有evaluation/history，不改分數或門檻。
- 缺前值：只說目前角色，不補升降歷史；目前值也缺就說仍待確認。

同一formatter用於當場competitionFeedback、第二次角色回饋、高一角色歷程及既有高二結算文案，沒有修改跨年或競爭計算。

### 3. 舊存檔的顯示入口

既有賽後文字綁定改為呼叫唯讀generator，避免load後再展示舊存下來的錯誤coachReaction／consequence。高橋的後續story也依目前同場紀錄讀取，避免舊rival.encounter中的第七局繼續出現。賽後關鍵表現只列可連結的決策；沒有資料時用事實成立的fallback。

只改既有文字資料來源，沒有重排HTML結構、事件、繼續按鈕或畫面切換。沒有遷移／重存舊欄位；過往memories、已封存的生涯摘要不做全面文字改寫。

## 修改位置與例句

| 位置 | 修補內容 |
|---|---|
| `script.js:1820` | 終場教練回應依紀錄生成，進行中的原回應不改 |
| `script.js:3730`附近 | 原賽後文字綁定改用有證據的表現、教練與角色原因；版型不變 |
| `script.js:13580–13740`附近 | 唯讀取證／文案formatter；settlement只替換文字生成，原數值處理保留 |
| `script.js:14339–14490`附近 | 阿哲話題、高橋回應、電話回顧、角色回饋與年末歷程 |
| `script.js:16506`附近 | 高二既有角色歷程使用相同角色值比較，不改高二計算 |
| `story.js:1160` | 原高橋後續事件文字讀取已證實的當場內容 |
| [新增回歸測試](../../tests/high-school-match-feedback-factuality-test.cjs) | 正式引擎fixture、舊資料／文字入口、角色與存讀檔、修補前後資料比較 |

| 情境 | 修補前 | 修補後實例 |
|---|---|---|
| 投手延期、整場未出賽 | 「有幾球你看對了，也有一步慢了」 | 「本場沒有正式上場樣本，先把備戰做好，下一次任務再看安排。」 |
| 未出賽但role=starter | 高橋指出「第七局做出的選擇」 | 「本場沒有你的正式上場樣本，先把下一次的準備做好。」 |
| 完整出賽，決策只在1／3／5局 | 固定引用第七局 | 「第5局下那次打席選擇，下一次還能不能重複？」 |
| starter維持starter | 「正式角色由『先發／關鍵任務』調整為『先發／關鍵任務』」 | 「正式角色維持『先發／關鍵任務』」 |
| 舊資料缺前次角色 | 可寫「由前次角色升為…」或補bench | 「目前角色為『輪替／替補任務』」 |
| 真實兩個正向判斷＋一個questionable | 按overallTier一律肯定全部處理 | 「有幾球你看對了，也有判斷需要再檢查。」 |

例句原始資料見 [before-verified](feedback-repair-v1/before-verified.json)、[after-verified](feedback-repair-v1/after-verified.json) 與 [驗收摘要](feedback-repair-v1/acceptance-summary.json)。

## 新增回歸：先RED，再GREEN

從開工工作樹保存script原始bytes；story的原始bytes與本輪baseline SHA核對一致。baseline測試使用兩份原碼，沒有改resolver或替代棒球模型。先在修改前實際重現；最後以同一驗收腳本對保存的原碼再次確認 **14/14 FAIL**，修補後 **14/14 PASS**。

| 檢查 | 本輪最終結果 |
|---|---|
| 完全未出賽，不評論個人決策，阿哲不預設個人打席 | PASS |
| 先發維持先發的當場結算文案 | PASS |
| 其他matchId的finalized exposure不可證明本場出賽 | PASS |
| 沒有ledger的舊finalized noAppearance資料 | PASS |
| 原Save/Load後，舊錯誤字串不再被賽後／高橋入口直接採用 | PASS |
| 真實出賽進行至第6局，不能提前聲稱第7局決策 | PASS |
| 真有連結決策，仍可取得對應局數回應 | PASS |
| 完整比賽有出賽，但完全沒有第7局玩家決策 | PASS |
| 缺completedMoments的舊資料採中性回饋 | PASS |
| 異場ledger／無法連結的log不得供應具體細節 | PASS |
| same角色值＋錯誤change標記、真實不同角色值、缺previousRole | PASS：starter/rotation維持、bench→rotation、starter→rotation |
| bench維持bench的實際比賽結算 | PASS |
| Save/Load後缺previousRole／startingRole不捏造歷史 | PASS |
| 真實至少兩筆sound判斷，保留肯定且不隱藏questionable | PASS |

角色formatter的升降案例是既有合法角色／history契約的對照輸入，刻意讓change標記矛盾以驗證採實際值；不是宣稱這些升降都由本輪自然球季達成。另以既有Opportunity Two測試確認owner升降與第二次機會流程仍通過。

四組正式比賽對照：投手starter seed45011、SS starter seed45000能力8、SS bench seed45002能力8、SS starter seed45000能力16。初始化／學校與LCG條件相同；呼叫原prepare/playback/decision/record/settlement入口，不手填比賽結果。每場檢查正式record及match state integrity。

逐組deep equality與canonical SHA確認以下保持一致：official gameRecord、simulationLog、baseballSkills、身體／特質、Development、evaluation分數／證據、人物關係／impression、canonical role、名單與選校狀態、opportunity history／next解算、個人contribution、表現／曝光／球探數值、旗標、高橋entryType及阿哲variant。差異限現有文案值與文案選取。保存契約與欄位集合沒有新增。

### 實際命令

```powershell
# 預期 exit 1：使用開工原碼重現缺陷
node tests/high-school-match-feedback-factuality-test.cjs --baseline --out docs/design-optimization/feedback-repair-v1/before-verified.json

# exit 0：14個案例＋四組受保護資料一致
node tests/high-school-match-feedback-factuality-test.cjs --compare-to docs/design-optimization/feedback-repair-v1/before-verified.json --out docs/design-optimization/feedback-repair-v1/after-verified.json

# 正式工作樹原測試；因既有缺依賴suite而 exit 1
node docs/design-optimization/feedback-repair-v1/run-regressions.cjs --acceptance

# 對照開工原碼，確認同一既有錯誤；exit 0表示重現符合預期
node docs/design-optimization/feedback-repair-v1/verify-known-baseline.cjs

node --check script.js
node --check story.js
git diff --check -- script.js story.js
node docs/design-optimization/feedback-repair-v1/capture.cjs after
```

所有JSON evidence採exclusive-create；上述`--out`與既有測試runner重跑時要改用新輸出名稱／目錄，不能覆寫既有證據。只跑新回歸、不產檔可使用 `node tests/high-school-match-feedback-factuality-test.cjs`。

## 既有回歸、失敗與限制

沿用既有entry-safe preload觀測assertions／V8 checker，原suite作main執行；gitCompatibility=false、每套60秒、未改任何原期望。最終原始輸出與witness位於 [existing-tests-acceptance/](feedback-repair-v1/existing-tests-acceptance/)，總表為 [regressions-acceptance.json](feedback-repair-v1/regressions-acceptance.json)。

| 原測試 | 本輪結果／觀測檢查數 |
|---|---|
| high-school-year-one-competition-loop | PASS 28 |
| high-school-year-one-opportunity-two-integration | PASS 40 |
| high-school-year-transition-continuity | PASS 44 |
| high-school-integration-1-2-3 | PASS 28 |
| high-school-year-two-competition-loop | PASS 39 |
| high-school-three-year-spine | PASS 自訂verify 54 |
| coach-response-expansion | PASS 10 |
| match-experience-development-foundation-v1 | PASS 46 |
| playing-time-game-exposure-foundation-v1 | PASS 53 |
| career-save-admission | PASS 自訂verify 45；故意損壞JSON的負例會印出SyntaxError，suite仍正常完成，沒有把它誤判成新錯誤 |
| g2-b2-playable-match-decision | PASS 171 |
| g2-a-live-public-match-bridge | PASS 616 |
| high-school-integration-1-1 | **FAIL**：9項完成後，`resolveHighSchoolThirdStrikeCatch`遇`ReferenceError: BattedBallPhysical is not defined` |

**既有失敗**：用開工script/story原始bytes，原測試與assertion均不改，在隔離child重播同一錯誤，詳見 [existing-baseline-failure.json](feedback-repair-v1/existing-baseline-failure.json)。該診斷的fs preload只將這兩個來源讀取導向保存原碼；不是正式工作樹PASS、沒有補載依賴或換resolver。本輪不擴大修復其硬編runtime manifest。

**本輪修補過程失敗**：最初Opportunity Two第30項失敗，揭露沒有ledger的舊noAppearance情境；已補同場finalized exposure的保守absence分支，原40項完整重跑通過，期望不變。初次Save suite的自訂checker未被觀測，另補V8 coverage後確認45次，沒有拿exit0當成完整PASS。中途外來exposure負例曾直接改frozen物件而未生效，已改為detached舊資料副本並先assert matchId實際改變；權威結果以before/after-verified為準。初次與中間結果保留，沒有回寫成最終PASS。

**逾時**：本輪0。**未執行**：全repository suite、G2-B1長跑、Browser視覺／真人操作、所有歷史存檔版本及完整高中三年自然路線，不標通過。本輪對DOM字串讀取只驗證原文字入口，非Browser QA。

**資料限制**：舊檔缺少連結事件／品質／前次角色時，無法恢復當年的細節，採中性文字；不把關係、名單或球隊勝負補成決策。封存的舊memories不做全域改寫。高橋entryType保留既有分類，不作實際遭遇的證明。健康、訓練與投手正式曝光延期均未改，仍依前輪另案清單處理。

本輪到此完成；不自動啟動健康或訓練調整。
