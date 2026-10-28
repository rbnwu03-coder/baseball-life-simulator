# Accepted Gameplay Git Baseline & Commit Readiness Gate v0.1

日期：2026-10-19（Asia/Taipei）。授權：唯讀 Git／來源審查、執行原有測試，以及本報告與同名 Evidence JSON。狀態：**GIT_BASELINE_BLOCKED**。

## 1. Executive Decision

已找出最小可執行基線的 33 個明確候選檔案（23 B、10 C），另有一個必須先修補的既有 Source-Freeze caller：`tests/pitch-sequence-state-production-integration-test.js`（F01）。目前不能批准 Stage／Commit；只加入這 33 檔，或連目前 F01 一起加入，都會保留同一個 guard failure。

七套最低正式驗收在目前工作樹與 33 檔記憶體候選均 PASS。擴大檢查既有 callers 後，24 套為 23 PASS／1 FAIL。失敗位於舊 OPA 整檔 freeze；前七項真正 Gameplay 測試通過。精確兩處修補的記憶體預覽使原八項全部通過，但磁碟未改，修補後的完整實體 Git 候選仍為 **COMMIT_CANDIDATE_NOT_EXECUTION_VERIFIED**。

建議先另行授權 F01 兩處 caller 修補與驗證，再以單一、依賴閉合的 34 檔 baseline commit 保存成果。本輪只交付兩份報告，立即停止；沒有 Stage、Commit、Push 或 G1-B。

## 2. Latest Git State

| 項目 | 本輪開始值 |
| --- | --- |
| Captured UTC | 2026-10-19T07:31:30.510Z |
| Branch | main |
| HEAD | ab3117653945de0b7013636187c446276a96e634 |
| local origin/main | ab3117653945de0b7013636187c446276a96e634 |
| Tracked modifications | 25 |
| Untracked | 1,224 |
| Staged | 空 |
| HEAD tracked paths | 750 |
| 全部 refs | 18 個，包含 Codex refs 與既有 stash；完整值在 JSON baseline.refs |
| Index SHA256 | 6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d |
| Porcelain SHA256 | f49c1ea46e8142b8ec3c6f6f79eab664867a4ce177f328a303ad89cef0bf82b2 |

透過唯讀 `rev-parse`、`status --porcelain=v1`、`diff --name-only`、`diff --cached --name-only`、`for-each-ref`、`ls-tree`／`ls-files -z`、`show` 取得。沒有 fetch；local origin/main 不代表本輪查驗遠端伺服器。

已為 Git 列出的 1,974 個既有檔案建立清單：1,962 個可讀內容 SHA256，12 個 E 只記 size／mtime。範圍不包括 ignored files 或 .git 內部檔案；Git index 另做 SHA，refs 另做完整比對。完整 porcelain paths 與每檔 SHA 在 JSON，沒有將 HEAD 等同已驗收工作樹。

## 3. Accepted Gameplay Baselines

| 基線 | 採用狀態與範圍 |
| --- | --- |
| `Match vNext Sprint 1` | CONTROLLED_SLICE_PASS；Early BLOCKED history is retained; latest controlled slice only；docs/match-vnext-sprint-1-same-ball-execution-v0.1.md 最新章節 9-16 |
| `Sprint 2 S2-A` | PASS；Formal infield hit; no natural rollout；docs/match-vnext-sprint-2-outcome-coverage-v0.1.md |
| `Sprint 2 Core Recovery` | CORE_RECOVERY_FACTS_PASS；Overall Sprint 2 PARTIAL; natural mode remains off；docs/match-vnext-sprint-2-outcome-coverage-v0.1.md 最新章節 25-32 |
| `Gameplay Coverage Gate` | COVERAGE_GATE_PASS；Audit/development decisions, not coverage completion；docs/match-gameplay-coverage-reprioritization-gate-v0.1.md |
| `G1-A` | G1_A_PASS；NPC flyout attribution + LF; no Alpha or OF-miss retrieval closure；docs/g1-a-outfield-flyout-attribution-lf-coverage-v0.1.md |

Sprint 1 文件早期 BLOCKED 是歷史紀錄，採其最新 9–16 節；Sprint 2 採最新 25–32 節 Core Recovery 結論。G1-A 最新來源／測試與既有 evidence hashes 比對吻合。本輪新增 caller 發現不追溯否定 G1-A 原 16 套 PASS，但會阻擋包含既有 freeze callers 的完整 Git baseline。

## 4. Runtime Dependency Closure

從 `index.html` 的 **95 個有序 classic scripts** 開始，核對 101 條 literal CommonJS／UMD fallback 依賴、global 初始化與實際測試 body reads。全部 script 路徑存在；沒有缺失 fallback 目標、外部套件或非預期機器絕對路徑。完整順序、邊、134 檔閉包及實際讀取來源在 JSON runtimeClosure／sourceReadCatalog／各測試 audit。

| 順序 | 來源／責任 |
| --- | --- |
| 1 | Roster |
| 16 | MatchGameRecord；ActionContract 為使用時查找，不在載入當下要求 DDTF |
| 42 → 44 → 45 → 46 | Physical → Opportunity → Reach/Secure → OPA |
| 57 → 58 → 60 | Force → Decision/Throw/ActionContract/Scorer → Runner/Throw Settlement |
| 62 → 63 → 64 | Line → Fly → Tag-up |
| 65 → 66 → 67 | Receiver snapshot → Lifecycle → Plate Decision |
| 71 → 76–85 | Experience → Development／Career／Save Admission |
| 90 → 92 → 93 → 94 → 95 | Save → Match vNext Contract → Adapter → script → ApplicationController |

閉包共 **134** 檔：100 個 HEAD-clean 依賴、24 個 tracked 變更（含 F01）、10 個必要 untracked。95 scripts 加上 index／style／package／lock，並納入 24 套測試實際讀取的 fixture、guard helper 與測試入口。Runtime 三個新增載入是 Receiver snapshot、Match vNext Contract、Adapter。既有正式 Runner／Force／ThirdOut／Scorer／Record owners 保留，沒有重建引擎。

G1-A 經 Physical → Opportunity → actual roster defender → shared reach/secure → Fly Catch → 原 PA／ordered retirement → validated catch-credit → MatchGameRecord 原 catch ledger。雖然 G1-A credit 本身是增量派送，現行 index／script 已同時含 Receiver、Sprint 1／2 依賴；不能只拿 G1-A 十檔就宣稱整個現況可還原。

隱藏 fixture 依賴包括 `tests/match-m0-after-r2-admission-context.cjs`、`tests/match-authority-coverage-audit.cjs`、`tests/baseball-match-foundation-2-2-4-3-audit.js`（擷取 setup prefix）、`tests/high-school-career-test-context.js`、canonical contract helper 及 tactical selector helper。除下節明列的新增 canonical helper 外，其餘都在 HEAD；不需讀取 Protected runner／evidence。

ApplicationController 是 HEAD 中保留的 public-function delegate；已做來源核對，VM harness 未執行它，因此沒有真實瀏覽器／UI 操作證明。Save／Career 以原正式 integration、完整紀錄／lifecycle、canonical 固定四場驗證，不宣稱全部 Career 路徑已覆蓋。

依 AGENTS 使用已在本對話讀取的 codebase-memory skill；本輪 ALL_TOOLS 無其必要 graph tools，未宣稱 project/index/coverage/graph 結果，未 reindex。以上均來自 exact source／original tests fallback。

## 5. Tracked WIP Classification

| Path | 類別 | 本輪判斷 |
| --- | --- | --- |
| `batted-ball-fly-ball-defense.js` | B | G1-A LF medium/deep + shared access/secure |
| `defensive-decision-throw-foundation.js` | B | S2-A infield-hit classifier; S2 Core Recovery APIs |
| `defensive-reach-secure-foundation.js` | B | S2 Core Recovery reach/secure facts |
| `defensive-runner-throw-settlement-foundation.js` | B | S2 Core Recovery runner/throw settlement facts |
| `index.html` | B | Receiver prerequisite + Sprint 1 contract/adapter load order |
| `match-experience-development.js` | B | Accepted prerequisite R0 decision pressure evidence |
| `match-game-record.js` | B | G1-A completed fly catch attribution into existing ledger |
| `match-situation-lifecycle.js` | B | Receiver source snapshot prerequisite |
| `offensive-plate-approach.js` | B | Sprint 1 held BIP/trusted injection and S2 boundary |
| `plate-decision-foundation.js` | B | Sprint 1 pending BIP/lifecycle handoff |
| `save.js` | B | Accepted preexisting Receiver save validation prerequisite |
| `script.js` | B | R0 + Receiver + Sprint 1/S2 + G1-A integrated producer/settlement |
| `tests/bbp-b2b1-fly-ball-production-integration-test.js` | B | G1-A LF support fixture expectation |
| `tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | B | G1-A LF support unit expectation |
| `tests/bbp-b2b2-tag-up-decision-execution-test.js` | B | G1-A production pending-catch fixture |
| `tests/defensive-opportunity-production-integration-test.js` | B | G1-A LF detailed catch expectation |
| `tests/fast-check-smoke-test.cjs` | E | 原 WIP，metadata only；排除 |
| `tests/high-school-year-one-opportunity-two-integration-test.js` | B | Accepted prerequisite exact runtime foundation wiring |
| `tests/pitch-production-source-scope.cjs` | B | R0 + Sprint 1/S2 exact source-delta comparators |
| `tests/pitch-sequence-state-production-integration-test.js` | F | F01 必要 caller，未授權修補，暫緩 |
| `tests/pitch-tactical-decision-production-adapter-integration-test.js` | B | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-decision-production-integration-test.js` | B | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-intent-evidence-integration-test.js` | B | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-interpretation-production-integration-test.js` | B | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-signal-projection-production-integration-test.js` | B | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |

原 19 個 tracked WIP 加 G1-A 新增的 6 個 tracked 變更，共 25。23 個 B 的每個 HEAD diff hunk 已按明確路徑核對；沒有找到應剝離的無關 hunk。它們包含受本次接受版本依賴的 R0 decision-pressure 與 Receiver metadata 前置成果，不是假定「所有 dirty 檔案皆可提交」。

`script.js` 相對 HEAD 為 +428／−24，17 個既有函式改動、11 個新增、無移除。功能分布：fly defender／handoff／resolve／apply／validator 屬 G1-A；Receiver 三個 adapter／validator／binding 與既有 pitcher metadata；same-ball receipt／continuation／capability／resolver 及 plate/offensive/infield 邊界屬 Sprint 1／2；settlement/development 部分含既有 R0 prerequisite。完整函式名稱、行號、每檔 hunk 座標在 JSON scriptFunctionDelta／trackedDeltas。

`index.html` 的三個載入、`save.js`／Lifecycle 的 Receiver exact deltas、OPA／PDF 的 same-ball deltas、Source-Scope helper 與五個 tactical callers 相互配合。推薦保留整個已核對快照，沒有要求 patch staging。F01 的既有 Receiver Save 分支應保留；只增補第 12 節兩處 guard wiring，不可用刪 assertion／改 pin／新整檔 hash 取代。

725 個 HEAD-clean 檔案繼承保留；只有其中 100 個屬本 Gate 依賴閉包。其餘 625 個是 HEAD 原有檔案，這裡不宣稱它們每個都經 Gameplay 驗收，也不需要重新 staging。

## 6. Untracked Dependency Classification

必要 C 類只有以下 **10 檔**；各檔在 HEAD 不存在，記憶體候選確實使用，不能因未追蹤而忽略。

| Path | 必要性 |
| --- | --- |
| `contracts/match-vnext-execution-v0.1.cjs` | Sprint 1 contract; S2-A and Core Recovery facts |
| `match-vnext-same-ball-execution-adapter.js` | Sprint 1 same-ball; S2 scope and capability adapter |
| `receiver-source-snapshot.js` | Accepted preexisting Receiver source metadata prerequisite |
| `tests/canonical-match-regression-integration-test.cjs` | Accepted canonical 50-check/4-game regression |
| `tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | G1-A 29 acceptance groups |
| `tests/helpers/canonical-match-contract-context.cjs` | Canonical production fixture contract helper |
| `tests/match-vnext-same-ball-execution-contract-test.cjs` | Sprint 1/S2-A/Core Recovery contract acceptance |
| `tests/match-vnext-same-ball-production-integration-test.cjs` | Sprint 1/S2/Core Recovery production acceptance |
| `tests/receiver-source-index-authorized-wiring.cjs` | Receiver exact index wiring guard prerequisite |
| `tests/receiver-source-save-authorized-delta.cjs` | Receiver exact save delta guard prerequisite |

其餘 untracked：1,203 個 D、11 個 E。D 是本次精確 Runtime／指定測試閉包外的 WIP，包括歷史文件、證據、舊 runner、prototype 等；全部保留。約 572 MB 的 untracked docs 不因它們是舊報告就加入可執行 baseline，也不因排除就允許刪除。這是對本次最小候選的依賴判斷，不是全庫 dead-code 判定。

## 7. Protected／Restricted Boundaries

| Path | Size | mtimeMs |
| --- | --- | --- |
| `tests/fast-check-smoke-test.cjs` | 232 | 1790843210697.4724 |
| `install.ps1` | 18481 | 1790645780931.8794 |
| `docs/first-base-sprint-3-focused-development-evidence.json` | 909541 | 1791695452470.9353 |
| `docs/infield-baseball-logic-audit-architecture-evidence.json` | 22275 | 1791724873822.1465 |
| `docs/infield-baseball-logic-audit-evidence.json` | 9987073 | 1791725791525.787 |
| `docs/infield-baseball-logic-audit-runner.cjs` | 51962 | 1791725789937.2622 |
| `docs/infield-baseball-logic-validation-audit-v1.md` | 39820 | 1791725790304.0483 |
| `docs/infield-scorer-recovery-sprint-5-green-evidence.json` | 9378500 | 1791766904157.9292 |
| `docs/infield-scorer-recovery-sprint-5-green-force-actual-only-evidence.json` | 11457925 | 1791767373630.792 |
| `docs/infield-scorer-recovery-sprint-5-l03-red-evidence.json` | 686464 | 1791788973106.34 |
| `docs/infield-scorer-recovery-sprint-5-validation-force-actual-only.json` | 889584 | 1791767570328.417 |
| `docs/infield-scorer-recovery-sprint-5-validation.json` | 1027011 | 1791767101736.8584 |

12 個 E 全部只 stat；SHA 為 null。沒有讀取、explicit hash、執行或寫入其內容。沒有重複 G1-A 先前 unscoped diff-check 的方法偏差；本輪 diff-content 讀取皆使用 nonprotected 明確路徑。Protected fast-check 雖出現在使用者要求的 status／diff-name 清單，也沒有拿它跑測試。named suites 不需要 E；無 Protected 納入授權需求。

## 8. Commit Strategy Options

| 方案 | 結論 |
| --- | --- |
| A — Single Closed Gameplay Baseline | F01 獲授權修補並通過完整驗證後推薦。34 個必要檔案一個 commit，含前置來源與正確 guards。 |
| B — Ordered Baseline Commits | 未建立可驗證中間樹。script／index／Source-Scope helper 跨前置成果、Sprint 1／2、G1-A；目前不可為分層歷史強拆。 |
| C — Baseline Blocked | 本輪採用。F01 修補未授權，現狀及 HEAD fallback 都 FAIL；修補後實體候選未驗證。 |

## 9. Proposed Commit Boundaries

預定唯一 commit message：`feat: establish accepted match gameplay baseline`。

內容：保存 Sprint 1 controlled same-ball、S2-A infield hit、S2 Core Recovery facts、G1-A NPC LF／CF／RF flyout attribution，以及使它們可執行的 Receiver／R0 前置來源與正式測試 guards。Sprint 2 維持 PARTIAL、自然模式關閉，不作 Alpha 宣告。

實際檔案為第 10 節 33 檔，**再加已另行授權且精確修補的 F01 一檔**，合計 34。現在的 F01 不在可 staging 清單。沒有多個未驗證中間 commits；兩份本輪 audit 報告亦不混入最小可執行 commit。若要版本化歷史 evidence，需另定文件保存範圍，不能順手加入全部 docs。

## 10. Precise Staging Manifest

**PROPOSED_STAGE_MANIFEST：33 檔，全部 HELD，當前不得 Stage。** T＝tracked／HEAD 已存在；U＝untracked／HEAD 不存在。R＝必要 Runtime（含 index），Q＝必要測試來源或測試所讀取依賴。所有項目 Protected＝false；所有 B 皆與原 tracked WIP 重疊，所有 C 皆為本輪前已存在的必要 untracked，沒有本輪新建 Gameplay 檔案。

| Path | 類別/HEAD | 用途 | Current SHA256 | 已接受功能 |
| --- | --- | --- | --- | --- |
| `batted-ball-fly-ball-defense.js` | B/T/yes | RQ | `3a05fc05e182f32ac0c398fd84ad53ff3c9c86eba8822ae53bfe2838533df038` | G1-A LF medium/deep + shared access/secure |
| `contracts/match-vnext-execution-v0.1.cjs` | C/U/no | RQ | `04254272d4bfff3bff61817d8d49cb99c143885bfbbd35d0f2bca300be5e96a6` | Sprint 1 contract; S2-A and Core Recovery facts |
| `defensive-decision-throw-foundation.js` | B/T/yes | RQ | `c5afcf9c0f0fd1a501e5dec0bdc26d30054ac9a7f29f792c716190a8f7434ed7` | S2-A infield-hit classifier; S2 Core Recovery APIs |
| `defensive-reach-secure-foundation.js` | B/T/yes | RQ | `899a5bc5f6c94f6105f1cfac654fb42758bc7ccd9ddb8a39556a1bc0cf937343` | S2 Core Recovery reach/secure facts |
| `defensive-runner-throw-settlement-foundation.js` | B/T/yes | RQ | `2c7e08c73553cdcf8b5aaa6a0953aec93ba973998b6bc72704647971d070f6fb` | S2 Core Recovery runner/throw settlement facts |
| `index.html` | B/T/yes | RQ | `a635cc3f3ad2f169ee67bab39df87a7fee6f5dbe9a50d9a84ec1593099ae688c` | Receiver prerequisite + Sprint 1 contract/adapter load order |
| `match-experience-development.js` | B/T/yes | RQ | `544a9a3625c69d868645011ff0f67804b48cd0734bcb5b1e4410ca593df766f3` | Accepted prerequisite R0 decision pressure evidence |
| `match-game-record.js` | B/T/yes | RQ | `748748681cea569449779ad827ea0aa688b5240ac4f13b6b7dd54b1b6e9a9f56` | G1-A completed fly catch attribution into existing ledger |
| `match-situation-lifecycle.js` | B/T/yes | RQ | `030eb851e2cac85fff8e01f44903b8f182ce417ad03e34db57c0b523b1f3e544` | Receiver source snapshot prerequisite |
| `match-vnext-same-ball-execution-adapter.js` | C/U/no | RQ | `832f009a14689e883a6d57590f2a85f7d475ad508fa8ec51166c5ebe50a853e6` | Sprint 1 same-ball; S2 scope and capability adapter |
| `offensive-plate-approach.js` | B/T/yes | RQ | `2af35f764895accbbd31d2ab8d5e04419806502b833707620420e88c93ab2a8b` | Sprint 1 held BIP/trusted injection and S2 boundary |
| `plate-decision-foundation.js` | B/T/yes | RQ | `c67885604f81c1be2104b9935d6a1d2fbfd85c4e2cc094394782b0916fe441dc` | Sprint 1 pending BIP/lifecycle handoff |
| `receiver-source-snapshot.js` | C/U/no | RQ | `4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274` | Accepted preexisting Receiver source metadata prerequisite |
| `save.js` | B/T/yes | RQ | `7111e2180f93f15fdaa0c402b6fe034240e064c6acff01d0d79bb1755990ebb7` | Accepted preexisting Receiver save validation prerequisite |
| `script.js` | B/T/yes | RQ | `1bc10c1856db1259f50f553eab274440328bfa5a8a55fe2a42b070c9158e2022` | R0 + Receiver + Sprint 1/S2 + G1-A integrated producer/settlement |
| `tests/bbp-b2b1-fly-ball-production-integration-test.js` | B/T/yes | Q | `346d9cf87d05d68ac41eefb6fec1f458178c6d3f8135564866707a87cdcd8db8` | G1-A LF support fixture expectation |
| `tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | B/T/yes | Q | `5c1c04a7a12bc5fd64e24c8b3c21773f4852e7c263855be8c11eac539f858f3e` | G1-A LF support unit expectation |
| `tests/bbp-b2b2-tag-up-decision-execution-test.js` | B/T/yes | Q | `ca381d7a5258cf262d33bc893d883705477043d0622e8501dcecd78061dc04ef` | G1-A production pending-catch fixture |
| `tests/canonical-match-regression-integration-test.cjs` | C/U/no | Q | `1265fb28109fe80726f50ad7ddd82af60a95faaa2083b5ebf11883f0b799df1c` | Accepted canonical 50-check/4-game regression |
| `tests/defensive-opportunity-production-integration-test.js` | B/T/yes | Q | `0f77e0649a9964e6a4148d8f33015ae053a5e9f7929fe7e97410a654fce4d9bf` | G1-A LF detailed catch expectation |
| `tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | C/U/no | Q | `9f9e2e59bb6296d4a67d8b10a573f52720b5407494aa81608c9ef06756ac50d2` | G1-A 29 acceptance groups |
| `tests/helpers/canonical-match-contract-context.cjs` | C/U/no | Q | `b09b35cf404c100b6f1d00ff6b8e67e38093fd6d13a22e788413f3bb7c608fb5` | Canonical production fixture contract helper |
| `tests/high-school-year-one-opportunity-two-integration-test.js` | B/T/yes | Q | `7c67d25fcd60ac784fe01884e55a2be0a8886131178731fbde75eae19f074005` | Accepted prerequisite exact runtime foundation wiring |
| `tests/match-vnext-same-ball-execution-contract-test.cjs` | C/U/no | Q | `70b39d748b622e3e7d16681997f56d5906b02390aea13c91090a3b4034f6fe03` | Sprint 1/S2-A/Core Recovery contract acceptance |
| `tests/match-vnext-same-ball-production-integration-test.cjs` | C/U/no | Q | `1df515f8537ac40eb1c0648ca61508787bed46f73f5d775e670fc02156c109b4` | Sprint 1/S2/Core Recovery production acceptance |
| `tests/pitch-production-source-scope.cjs` | B/T/yes | Q | `4d48e8ded5adfddb044fb9e7d9dc954f9a364fcf9bcd3d45831d7c7ca3836eea` | R0 + Sprint 1/S2 exact source-delta comparators |
| `tests/pitch-tactical-decision-production-adapter-integration-test.js` | B/T/yes | Q | `f25215c5d052d50e325c47bbed8af10cedb213004803d829a411da3681c8f1af` | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-decision-production-integration-test.js` | B/T/yes | Q | `92d4ebd87febb86cb4d965b696e4a46e7090f9a2a1484963232333f450c8942a` | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-intent-evidence-integration-test.js` | B/T/yes | Q | `cac3c0ebb73c74e87c80ea50ea06ec4255110270aef59a98cc0265c27b90892a` | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-interpretation-production-integration-test.js` | B/T/yes | Q | `acc6d7914ff7763a5fd01fa9993301ed05337fa8675c5f9011002f747a62936b` | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/pitch-tactical-signal-projection-production-integration-test.js` | B/T/yes | Q | `09d57b03fd4a35487ef3024f7576980d8a70237385dddbf48551df43c23bcbf7` | Accepted Sprint 1 scoped OPA/PDF comparator caller + Receiver Save exact guard |
| `tests/receiver-source-index-authorized-wiring.cjs` | C/U/no | Q | `48fe3bc74e385bb55a991096ef0ee1445e04c5b9d38b5e75621c43c8ee06bc36` | Receiver exact index wiring guard prerequisite |
| `tests/receiver-source-save-authorized-delta.cjs` | C/U/no | Q | `94a2cac6e155c3936ea2cd03f0d31e4e19feba87d53f87c4be5c3cc5aab28b82` | Receiver exact save delta guard prerequisite |

每檔完整 runtimeDependency／testDependency／originalWipOverlap／protected／inclusionReason／exclusionRisk 在 JSON 同名 manifest，SHA 是 raw working-tree bytes。未使用 wildcard、資料夾 staging 或「所有新增檔」規則。排除任一 C 會缺 runtime global／require helper／正式驗收入口；排除任一 B 會回退已接受行為或使既有 source guard 不能接受其精確 delta。

## 11. Excluded WIP Manifest

**EXCLUDED_WIP_MANIFEST：1,216 個明確檔名**，完整逐檔 path、tracking／HEAD、SHA（E 為 null）、metadata、分類與理由碼皆在 Evidence JSON；不是 glob 清單。與 33 檔候選互斥，兩者聯集恰為原有 1,249 個 WIP paths。

| 分類 | 數量 | 處置 |
| --- | --- | --- |
| D | 1,203 | 閉包外 WIP：完整保留，最小可執行 baseline 排除 |
| E | 12 | Protected：只記 metadata，排除 |
| F | 1 | F01：必要 guard caller 未解決，暫緩，不能當作無關 |

本輪兩份新報告是獨立交付物，不屬原 1,249 WIP，也不在 33 檔 staging 候選；它們沒有悄悄改變排除清單分母。舊的 Sprint／Coverage／G1-A reports 與 evidence 保留原位，在最小 executable candidate 中不需 runtime/test body read；不代表它們可刪除或沒有審查價值。

## 12. Unresolved Dependencies

**F01 — `tests/pitch-sequence-state-production-integration-test.js`**。目前 SHA256：`7a53369d526de1c3a66b9d3e0c69f45f27f261bdb1d28c354f9831c0e8ae8327`。第 8 組仍將 `offensive-plate-approach.js` 與 pin `a0e512b439446990d8df118e3e7d737b9f2f51d3` 整檔比較。Receiver Save exact branch 已有，Match vNext OPA import／branch 缺少，因此接受的 OPA 三處 exact deltas 觸發 AssertionError。

精確修補提案（**未寫入，需新授權**）：

```diff
-const { assertPitchProductionSourceScope } = require('./pitch-production-source-scope.cjs');
+const { assertPitchProductionSourceScope, assertMatchVNextSourceDelta } = require('./pitch-production-source-scope.cjs');
@@
     else if (file === 'script.js') assertPitchProductionSourceScope(current, baseline);
+    else if (file === 'offensive-plate-approach.js') assertMatchVNextSourceDelta(file, current, baseline);
```

其餘 pin、source list、fixture、seed、assertions、Receiver Save 分支與預設整檔 equality 完全保留。這個 caller 的 source list 不含 PDF，不增添多餘分支。既有 helper 對同一 pin 的 OPA 回傳 `{exact:true, edits:3}`；normalized baseline SHA 為 `426538ad6f3d4b4257e0114549724e691cf4eab3f3546686896f972cebfd093a`。

記憶體 patch 預覽：原八項全部 PASS、無 denied read；預覽 bytes SHA 為 `887f481d810180fcc8d6bf9ba67ad8dfbc38e7b5cb42d4b765dbceaf27b9d731`。此 SHA 不是目前磁碟 hash，也不是 approved fixed source。不能跳過失敗測試、更新 pin、改為接受 current 整檔 hash，或自動 staging F 類。

其餘必要依賴均在 HEAD 或明確 C 中；沒有發現另外需要 Protected／無關 WIP 的路徑。F01 是本輪具體未解決項。

## 13. Current Worktree Regression

七套最低入口皆以未修改原測試直接 `node <file>` 執行、exit 0：

| 原正式測試 | Exit | stdout SHA256 |
| --- | --- | --- |
| `tests/match-vnext-same-ball-execution-contract-test.cjs` | 0 | `722ecd88b230099a0a7900eaa6e27102dfaacb88984045ae1a9078725dda3bd0` |
| `tests/match-vnext-same-ball-production-integration-test.cjs` | 0 | `d795f6c1f7439eadc0da30d7205a5ffa7ae157aa286e12350cf808f9496c084a` |
| `tests/bbp-b2b1-fly-ball-production-integration-test.js` | 0 | `8b1d7855ba82fd616956d8215277857572556794dc553be8ce33b852214191ce` |
| `tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | 0 | `b3ce1ca37314218b649b0278b975e056189d0a294ed6dcf36a710b719dcaf961` |
| `tests/match-full-game-record-test.js` | 0 | `20feab05f990c24494703cdc82a673ccc4d7607430804fae7fb39bc6ea84480c` |
| `tests/match-situation-lifecycle-test.js` | 0 | `0c054a9db88859133ba0973edf0fd9f318a78c1ac1085d70e1a806ed8dccb4a0` |
| `tests/canonical-match-regression-integration-test.cjs` | 0 | `2288558e29c08cc57c17999977424e60d933f475bbdb863af8a17d6f5e37d6eb` |

另外保留完整 G1-A 原 16 套，本輪均 PASS；延伸 8 套 caller／freeze／opportunity 檢查後如下。完整 timestamps、stdout bytes/hash、原 assertions 的 check 摘要與每套讀取證據在 JSON。

| 24 套實際入口 | Exit |
| --- | --- |
| `tests/match-vnext-same-ball-execution-contract-test.cjs` | 0 PASS |
| `tests/match-vnext-same-ball-production-integration-test.cjs` | 0 PASS |
| `tests/bbp-b2b1-fly-ball-production-integration-test.js` | 0 PASS |
| `tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | 0 PASS |
| `tests/match-full-game-record-test.js` | 0 PASS |
| `tests/match-situation-lifecycle-test.js` | 0 PASS |
| `tests/defensive-opportunity-production-integration-test.js` | 0 PASS |
| `tests/defensive-reach-secure-production-integration-test.js` | 0 PASS |
| `tests/defensive-decision-throw-foundation-test.js` | 0 PASS |
| `tests/defensive-decision-throw-production-integration-test.js` | 0 PASS |
| `tests/bbp-b2b2-tag-up-decision-execution-test.js` | 0 PASS |
| `tests/bbp-b2a-line-drive-production-integration-test.js` | 0 PASS |
| `tests/active-defensive-assignment-integrity-test.js` | 0 PASS |
| `tests/ground-ball-defensive-settlement-lifecycle-regression-test.js` | 0 PASS |
| `tests/canonical-match-regression-integration-test.cjs` | 0 PASS |
| `tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | 0 PASS |
| `tests/pitch-production-source-scope-test.js` | 0 PASS |
| `tests/high-school-year-one-opportunity-two-integration-test.js` | 0 PASS |
| `tests/pitch-sequence-state-production-integration-test.js` | 1 FAIL — F01 group 8 |
| `tests/pitch-tactical-decision-production-adapter-integration-test.js` | 0 PASS |
| `tests/pitch-tactical-decision-production-integration-test.js` | 0 PASS |
| `tests/pitch-tactical-intent-evidence-integration-test.js` | 0 PASS |
| `tests/pitch-tactical-interpretation-production-integration-test.js` | 0 PASS |
| `tests/pitch-tactical-signal-projection-production-integration-test.js` | 0 PASS |

合計 23 PASS／1 FAIL；F01 前七項真實 sequence／save／ON-OFF／RNG 等 assertions 通過，第八項 OPA source freeze 失敗。G1-A 專項 29 組、Record 13、Lifecycle 23、Canonical 50（固定四場）均通過。沒有將它寫成全庫 regression PASS，也未執行 Protected smoke。

## 14. Commit Candidate Reproducibility

實際做了兩個 **唯讀記憶體候選**：

| 候選 | 來源規則 | 結果 |
| --- | --- | --- |
| 診斷 34 檔（含現有 F01） | SHA 核對後的 34 current files，其餘全部 git show HEAD；無 HEAD／無 overlay 讀取即拒絕 | 24 套：23 PASS／1 FAIL（F01） |
| 正式暫緩清單 33 檔 | 同上；F01 回到 HEAD bytes，不能讀取目前 caller WIP | 最低七套 PASS；HEAD caller 的第八組同樣 FAIL |
| 33 檔＋兩處 F01 記憶體 preview | 只在 in-memory caller source 替換兩個唯一錨點 | 該原八組 PASS；未完成完整實體修補候選驗證 |

執行原 main test/module bodies、VM scripts 與 fixtures；loader 捕捉 readFileSync／module compile 與歷史 git-show 讀取，封鎖常見寫入與非允許 subprocess。每個候選使用自己的來源 provenance，不依賴未列出的 untracked 檔；所有 audit.denied 均為空。原測試邏輯沒有改成較弱的 assertions；只有明確標記 proposal-preview 使用兩處 proposed caller wiring。

這是可執行的依賴隔離診斷，但不是全 OS sandbox，也不是 Git clean/smudge／checkout normalization 的完整模擬。Node `v24.19.0`，Git 2.55.0.windows.3，core.autocrlf=true；候選路徑未見 explicit attributes。九個繼承 HEAD source raw hash 與工作樹不同，逐一確認 CRLF 正規化後相同；Canonical evidence 會輸出這些 source hashes，因此 stdout hash 不同，但 50 assertions 兩邊均 PASS。沒有為消除此差異格式化來源。

8 個實際歷史 pins 都是 HEAD 與 local origin/main 的 ancestors，可由一般完整歷史還原，無 Codex-only ref 依賴：

| Pin | HEAD/local origin/main 可達 |
| --- | --- |
| `ac53bf61964bde4b40501c77e15269bae99b55cc` | yes / yes |
| `98bcd1db941f63d17bacd2cbf75d8c4b8e717ac7` | yes / yes |
| `9b9546f94a7286afef474be634fd93c57eb455db` | yes / yes |
| `2a4b44a034b714b8de3c8a6897507995ab0f8ccd` | yes / yes |
| `674e49115a9ed7d67c69a3023b5a594d41fe584c` | yes / yes |
| `c54f81016ed6d495f6c6911ebae708c05bcf4b2b` | yes / yes |
| `a0e512b439446990d8df118e3e7d737b9f2f51d3` | yes / yes |
| `ab3117653945de0b7013636187c446276a96e634` | yes / yes |

正式提交前仍須：授權並落實 F01 exact repair、刷新 34 檔 hashes、重跑全部 24 套、在新的完整歷史實體隔離 clone 只套用批准 34 檔再跑相同測試，確認 normalization 與現存 guards。原 repository 不做 checkout／worktree／index 操作；不拷貝 12 E 或其他 WIP。最終修補後實體候選標記 **COMMIT_CANDIDATE_NOT_EXECUTION_VERIFIED**，不能以工作樹或記憶體 preview PASS 取代。

## 15. Source／Git Integrity

最終核對 **PASS**：1,962 個既有檔案內容 SHA 全部不變；12 個 Protected size／mtime 全部不變。原 status 排除精確兩份新報告後，SHA 仍為 `f49c1ea46e8142b8ec3c6f6f79eab664867a4ce177f328a303ad89cef0bf82b2`。HEAD／main／local origin/main、全部 18 個 refs、index SHA 均不變，staged 為空。最終為 25 tracked WIP、1,226 untracked；僅比開始多出授權的兩份報告。

比對原有 1,962 份可讀內容 hashes、12 份 Protected metadata、原 status（僅排除本輪兩個精確輸出檔名）、index SHA、HEAD／branch／local origin/main 及全部 refs。JSON 不自我 hash；最終記錄本 Markdown SHA。此範圍包括原 19 個 tracked WIP、其餘 G1-A 來源及所有 Git-listed untracked，未將 ignored 或 .git 任意內容宣稱納入。

沒有執行 git add／commit／push／reset／restore／clean／stash／checkout／switch／worktree add／rebase／merge；未改 .gitignore、來源、測試、pin 或既有報告。

## 16. Exact Next Authorized Git Commands — PROPOSE ONLY

**以下全部未執行，現在不得照做。** 第一個待授權行動僅為第 12 節 F01 的兩處修補與重驗，不是 Git 提交授權。修補後需更新 Gate；只有 READY_FOR_APPROVAL 且使用者另行明確批准 branch／stage／commit 時，後段 Git commands 才可執行。

預定完整檔名（下列 34，最後一檔必須已精確修補並在新報告解除 F01；目前原樣不可加入）：

```powershell
$candidatePaths = @(
  'batted-ball-fly-ball-defense.js'
  'contracts/match-vnext-execution-v0.1.cjs'
  'defensive-decision-throw-foundation.js'
  'defensive-reach-secure-foundation.js'
  'defensive-runner-throw-settlement-foundation.js'
  'index.html'
  'match-experience-development.js'
  'match-game-record.js'
  'match-situation-lifecycle.js'
  'match-vnext-same-ball-execution-adapter.js'
  'offensive-plate-approach.js'
  'plate-decision-foundation.js'
  'receiver-source-snapshot.js'
  'save.js'
  'script.js'
  'tests/bbp-b2b1-fly-ball-production-integration-test.js'
  'tests/bbp-b2b1-fly-ball-tag-up-legality-test.js'
  'tests/bbp-b2b2-tag-up-decision-execution-test.js'
  'tests/canonical-match-regression-integration-test.cjs'
  'tests/defensive-opportunity-production-integration-test.js'
  'tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs'
  'tests/helpers/canonical-match-contract-context.cjs'
  'tests/high-school-year-one-opportunity-two-integration-test.js'
  'tests/match-vnext-same-ball-execution-contract-test.cjs'
  'tests/match-vnext-same-ball-production-integration-test.cjs'
  'tests/pitch-production-source-scope.cjs'
  'tests/pitch-tactical-decision-production-adapter-integration-test.js'
  'tests/pitch-tactical-decision-production-integration-test.js'
  'tests/pitch-tactical-intent-evidence-integration-test.js'
  'tests/pitch-tactical-interpretation-production-integration-test.js'
  'tests/pitch-tactical-signal-projection-production-integration-test.js'
  'tests/receiver-source-index-authorized-wiring.cjs'
  'tests/receiver-source-save-authorized-delta.cjs'
  'tests/pitch-sequence-state-production-integration-test.js'
)
$acceptanceTests = @(
  'tests/match-vnext-same-ball-execution-contract-test.cjs'
  'tests/match-vnext-same-ball-production-integration-test.cjs'
  'tests/bbp-b2b1-fly-ball-production-integration-test.js'
  'tests/bbp-b2b1-fly-ball-tag-up-legality-test.js'
  'tests/match-full-game-record-test.js'
  'tests/match-situation-lifecycle-test.js'
  'tests/defensive-opportunity-production-integration-test.js'
  'tests/defensive-reach-secure-production-integration-test.js'
  'tests/defensive-decision-throw-foundation-test.js'
  'tests/defensive-decision-throw-production-integration-test.js'
  'tests/bbp-b2b2-tag-up-decision-execution-test.js'
  'tests/bbp-b2a-line-drive-production-integration-test.js'
  'tests/active-defensive-assignment-integrity-test.js'
  'tests/ground-ball-defensive-settlement-lifecycle-regression-test.js'
  'tests/canonical-match-regression-integration-test.cjs'
  'tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs'
  'tests/pitch-production-source-scope-test.js'
  'tests/high-school-year-one-opportunity-two-integration-test.js'
  'tests/pitch-sequence-state-production-integration-test.js'
  'tests/pitch-tactical-decision-production-adapter-integration-test.js'
  'tests/pitch-tactical-decision-production-integration-test.js'
  'tests/pitch-tactical-intent-evidence-integration-test.js'
  'tests/pitch-tactical-interpretation-production-integration-test.js'
  'tests/pitch-tactical-signal-projection-production-integration-test.js'
)
```

隔離驗證提案：另行授權後以 full-history clone 建立全新目錄。先在原位置逐一 Get-FileHash 比對新批准 34 檔清單；F01 必須是新批准修補 SHA（本次 preview 為 887f481d…），不能接受目前 7a53369d…；其餘 33 必須吻合第 10 節。新目錄已存在就停止，未驗證路徑不得覆蓋。clone／copy／test commands 亦僅為提案：

```powershell
$sourceRepo = 'E:\meng\baseball_life_sim_semirefactor'
$candidateRepo = Join-Path ([IO.Path]::GetTempPath()) ('accepted-gameplay-baseline-' + [guid]::NewGuid().ToString('N'))
if (Test-Path -LiteralPath $candidateRepo) { throw 'Candidate directory already exists' }
git --no-optional-locks clone --no-hardlinks -- $sourceRepo $candidateRepo
if ($LASTEXITCODE -ne 0) { throw 'Full-history clone failed' }
foreach ($candidatePath in $candidatePaths) {
  $candidateTarget = Join-Path $candidateRepo $candidatePath
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $candidateTarget) | Out-Null
  Copy-Item -LiteralPath (Join-Path $sourceRepo $candidatePath) -Destination $candidateTarget
}
Push-Location -LiteralPath $candidateRepo
try {
  foreach ($acceptanceTest in $acceptanceTests) {
    node $acceptanceTest
    if ($LASTEXITCODE -ne 0) { throw ('Candidate test failed: ' + $acceptanceTest) }
  }
} finally { Pop-Location }
```

clone 不使用 depth，必須保有上述 8 個歷史 pins。此 raw-file rehearsal 仍需比對 Git normalization；正式 stage 後只允許原批准 paths，並再次驗證 commit-tree checkout。原 repo WIP 保留，不從 temp clone 搬回來源，不刪任何原檔案。

待新 Gate PASS 與**另外的 Git 寫入授權**後，預定原 repo commands：

```powershell
# Preconditions: refreshed Gate READY, 34 approved hashes match, index empty,
# HEAD ab3117653945de0b7013636187c446276a96e634, exact F01 repair approved.
git --no-optional-locks status --porcelain=v1 --untracked-files=all
git --no-optional-locks diff --cached --name-only
git switch -c accepted-gameplay-baseline-v0.1
if ($LASTEXITCODE -ne 0) { throw 'Branch creation failed' }
git add -- $candidatePaths
if ($LASTEXITCODE -ne 0) { throw 'Exact staging failed' }
git --no-optional-locks diff --cached --name-only
git --no-optional-locks diff --cached --check -- $candidatePaths
# Verify cached path set equals exactly the 34 approved paths; inspect exact diff;
# verify every excluded WIP and all protected metadata remain unchanged.
git --no-optional-locks diff --cached -- $candidatePaths
# STOP if any staged mismatch or failed check; commit only after review passes.
git commit -m 'feat: establish accepted match gameplay baseline'
if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
foreach ($acceptanceTest in $acceptanceTests) {
  node $acceptanceTest
  if ($LASTEXITCODE -ne 0) { throw ('Post-commit test failed: ' + $acceptanceTest) }
}
git --no-optional-locks status --porcelain=v1 --untracked-files=all
git --no-optional-locks log -1 --format=fuller
```

正式 commit 前後都要核對 staged 精確集合、未納入 WIP、index／refs 的預期變化、完整 24 套與 full-history commit-tree isolation；有任何差異就停止，不 reset／restore／clean。沒有提出 git add -p，因 B 沒有待拆無關 hunk；沒有 push command 或遠端安全宣告。

## 17. Final Readiness Decision

**GIT_BASELINE_BLOCKED**。已完成本輪只讀可提交性審查與兩份報告；必要 Runtime／fixture／guard closure 具體，33 個候選與 1,216 個排除 paths 清楚，F01 不可自動 staging。

唯一必要來源修補是第 12 節既有 caller 的兩處 exact comparator wiring；需新的窄範圍授權。完成後還要以修補的完整 34 檔重跑 24 套並驗證實體 Git 候選。現在不要求批准 Commit，也不把最低七套 PASS 誤寫成整體 Git-ready。本輪在報告交付後停止。

