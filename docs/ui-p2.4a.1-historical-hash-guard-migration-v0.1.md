# 《棒球人生》
## Sprint UI-P2.4A.1 — Historical Hash Guard Migration & Regression Closeout v0.1

本輪完成 Test Contract Migration。原九個測試檔由 **142 PASS／1 FAIL** 轉為 **143／143 PASS**，exit code 0，skipped／todo 均為 0。Foundation 15 項繼續通過；未新增獨立 test，未變更執行中的 Prototype 功能。

### 原失敗與遷移理由

修改前實際重跑九個測試檔，唯一失敗仍為 `prototype/manga-match-spike/tests/manga.test.cjs:149` 的完整性測試，第 153 行迭代固定 hash 時要求 `prototype/match-ui-p1/app.js` 與 UI-P2.3 歷史版本相同。這與 UI-P2.4A 已授權的 app.js Foundation 修改衝突。

| app.js 版本／時點 | SHA-256 |
| --- | --- |
| UI-P2.3 歷史基準 | `2e5f09ae4a590aab996f0e8ecba60c5bf2b4fe2f8fe9b9f5ecc97f8dae504246` |
| 本輪開工實算 | `ebd38179076b5d1d6d3a52ec8822990467323a6947957216eb142d6a61b7a93e` |
| 測試前後與完整性核對實算 | `ebd38179076b5d1d6d3a52ec8822990467323a6947957216eb142d6a61b7a93e` |

歷史 SHA 保留在原 UI-P2.3 Evidence，本輪也明確斷言該歷史記錄沒有被替換。未將現行 app.js hash 填入舊基準；本輪 app.js 位元組未變。

### 新測試責任

仍保留第八項完整性測試，現位於第 161 行。只將精確的 `prototype/match-ui-p1/app.js` 路徑移出「必須與 UI-P2.3 位元組相同」集合。所有其他原有 byte guards 繼續執行，另加入 UI-P2.3 與 Manga 歷史 Evidence 的兩個固定 SHA 錨點。錨點來自既有 UI-P2.4A baselineReadableHashes，已與開工當前檔案交叉核對；expected 不由執行時當前 hash 產生。

app.js 相容性由既有 Manga／Prototype／Foundation 行為測試負責。本輪只在既有 Manga 測試加入最小斷言：

- 原 UI-P2.3 與 Manga HTML 皆沒有 Continuous／clock-contract／bootstrap opt-in。
- Decision 與原七段 Playback 明確維持 `presentationMode=legacy`，`presentationClock=null`。
- Legacy animation 完成才進入 readingHold；hold 時 beat 剩餘動畫為 0、elapsed 停在 duration。

沿用原有測試驗證 DTO 同一性、Decision／Resolution reveal gate、Pause／Resume／Skip／Replay、一次 submission、七段閱讀流程、同一 SVG、不同 Runner identity、原 Presentation 及 fixture 不被改寫。未變更 Foundation 測試；其明確 opt-in／缺少契約 fail-closed／Continuous 隔離等 15 項驗證仍全數通過。

沒有刪除完整性測試，沒有 .skip／.only，沒有放寬其他 assertion，沒有複製 Controller 測試或建立新 fixture。

### 保留的固定來源 hash guards

下列 12 個固定 byte guards 在遷移後皆實際通過。原有 app.js 歷史 SHA 另作歷史記錄斷言保留。

| 路徑 | 固定 expected SHA-256 | 結果 |
| --- | --- | --- |
| `prototype/match-ui-p1/index.html` | `e18e8562d013098a84a3a78527b6947e78f0ec7fd320abfca7d5c358be9a5358` | PASS |
| `prototype/match-ui-p1/style.css` | `b60969665f040d9a95e0796fbb151978b1606364b5c6ffb3fa9c7141bf2b5ba7` | PASS |
| `prototype/match-ui-p1/tests/prototype.test.cjs` | `d570c09ab3a4fd0091ead14e6471bd9f58ece0d6fda24a2a5ce2e3711895590c` | PASS |
| `prototype/match-ui-p1/generate-presentation-v02.cjs` | `3d7ebe5fc6747caa0e69ef356070a996111cfcff6930326b84e4f9839a148e88` | PASS |
| `prototype/match-ui-p1/presentation-v02.generated.js` | `82b3118a2c9ac423bcaf54d733bb342b1d61078d302f805b2e39d98b927f8674` | PASS |
| `prototype/match-ui-p1/tests/decision-consequence.test.cjs` | `8c8e387349d188a894a243bdd1c9b294eb40412c334d1c74a7a4121eba61bf0c` | PASS |
| `docs/match-ui-p2.3-decision-consequence-presentation-integration-v0.1.md` | `c69d28b7080cfdc4e531dd50469194b73dc3c9954aac9a83184ab8891412f78d` | PASS |
| `prototype/match-ui-p1/fixture.js` | `858857c5858de497d69c123ba3ad4f09c585a21d21d28df467d7c47ac8117878` | PASS |
| `prototype/match-ui-p1/presentation.js` | `cb14b9fe4bce00447a01707399598abf7c1f0f6f8194f0336a7520b5f8699e87` | PASS |
| `contracts/ss-decision-resolution-public-presentation-v0.2.cjs` | `4e3a04e50234a82835e6b0b2a2ad29ddb842655c008a87f3c199717698b22bf2` | PASS |
| `docs/match-ui-p2.3-decision-consequence-presentation-integration-v0.1-evidence.json` | `605cfb8ce1a6cda7b3711ecd1e62d59ed479c66d1eee6698788c2d04a57566cf` | PASS |
| `docs/manga-match-presentation-spike-v0.1-evidence.json` | `c317d133084d0ef618a3729809dff8a4b6a3fa8c31985289ca4235f8fe2ab1cf` | PASS |

除上述持續執行的 guards，本輪再對開工 1,931 個 exact-path readable 檔案做前後 hash 核對。唯一變更為授權的 Manga 測試；其餘 1,930 個不變，無缺失。Clock Foundation 三檔、所有歷史報告／Evidence、HTML／style、正式 Contract、fixture、generated asset、Production／Save／Match Engine 原有檔案未被本輪修改。12 個 protected 路徑只比較 stat／Git status metadata，未讀取內容、計算 hash 或執行。

### 實際驗證

Node `v24.19.0`，時間為 UTC。

| 執行 | 時間 | 結果 |
| --- | --- | --- |
| 修改前原九檔 | 2026-10-16T13:46:47.847Z 至 2026-10-16T13:46:48.053Z | 143 tests；142 PASS／1 historical hash FAIL；exit 1 |
| 遷移後原九檔 | 2026-10-16T13:47:48.986Z 至 2026-10-16T13:47:49.199Z | 143 tests；143 PASS／0 FAIL；exit 0 |
| node --check Manga 測試 | 遷移後 | exit 0 |
| scoped before/after diff | 僅本輪測試檔 | 保留完整 patch 於 Evidence；無 whitespace error |
| app.js／未授權檔案完整性 | 開工至結案核對 | app.js 同 hash；只有測試檔變動 |

遷移後分組：UI-P2.3 **120／120**、Manga **8／8**、Foundation **15／15**。兩次原九檔執行均無 cancelled／skipped／todo；完整 TAP、命令與 syntax 結果收錄於 Evidence。原命令包含純離線 v0.2 asset 再生一致性檢查，未寫回 asset，未執行 Production 全套 regression 或 Match simulation。

測試原先就是 untracked WIP，普通 tracked git diff 不能顯示其本輪差異。因此 scoped diff 使用開工精確來源的暫存副本（SHA 與開工測試檔完全一致）對照當前測試；副本已移除，未新增 workspace helper。`git diff --no-index --check` exit 1 表示檔案有差異，stdout 空白，stderr 僅 LF→CRLF 提示，沒有 whitespace diagnostic；另逐行核對無 trailing whitespace 或 conflict markers。未將該 exit 1 當作 exit 0。

### Git／WIP 與範圍

實查分支 `main`，HEAD `ab3117653945de0b7013636187c446276a96e634`。開工 13 個 tracked WIP、1,193 個 untracked 檔案。交付前所有原 status entry 保留，HEAD／branch／refs／index hash 未變；結案僅增加本輪兩個新文件的 untracked entry。測試檔原為 untracked，已用位元組 hash 與 scoped patch 記錄其修改，未用 status 不變推論內容不變。

本輪變更清單：

1. 修改 `prototype/manga-match-spike/tests/manga.test.cjs`。
2. 新增 `docs/ui-p2.4a.1-historical-hash-guard-migration-v0.1.md`。
3. 新增 `docs/ui-p2.4a.1-historical-hash-guard-migration-v0.1-evidence.json`。

新增前已確認兩文件不存在。無 stage／commit／push／reset／clean／stash，無安裝依賴，無 subagent。完整基準 hashes、status、protected metadata 與結案核對收錄於 Evidence。

### 查證方法與限制

依 codebase-memory skill 嘗試 index_status、精確 symbol search 及 cited-path coverage；本輪均回報 `Transport closed`，無法提供目前 graph coverage。採當前精確來源、歷史 hash 溯源及實際 isolated tests 作 fallback，未 reindex，未宣稱 graph 完整。沿用已讀 skill，未進行全庫來源內容搜尋；完整性比對僅 hash 前輪精確 readable allowlist，protected 排除。

Browser **NOT RUN**；人工動態驗收與架構審查維持 **PENDING**。本輪僅測試契約遷移，fake DOM／clock／VM 的 PASS 不代表 native Browser 或 Continuous Motion 視覺驗收。

### 結案狀態

**UI-P2.4B 的 Regression 前置條件已通過，可建議進入下一輪審查；未授權或啟動 UI-P2.4B 施工。** 三個 Presentation Track Gap 仍未核准，Clock Foundation／track inventory 未變，未新增 Slow-Mo、UI、完整 Continuous sampler 或 Match Gameplay；不得據此宣告完整 Match UX／Continuous Motion 完成。

Ready for Commit＝**NO**。Ready for Sprint10B＝**NO**。Receiver v2＝**DISABLED**。未 Commit／Push，完成後等待驗收。

