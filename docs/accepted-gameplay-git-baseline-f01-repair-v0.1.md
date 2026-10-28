# Accepted Gameplay Baseline — F01 Repair & Candidate Validation v0.1

日期：2026-10-19（Asia/Taipei）。狀態：**GIT_BASELINE_READY_FOR_APPROVAL**。

本輪授權：只修一個 test caller、執行原正式測試、建立外部完整歷史隔離 clone／臨時 Git tree 與 commit，以及新增本報告與 Evidence JSON。原 Repository 未 Stage／Commit／Push。Alpha 與自然 S2 rollout 仍未開放。

## 1. F01 原始失敗與原因

前輪 Gate 原工作樹 24 套為 23 PASS／1 FAIL。唯一阻礙是 `tests/pitch-sequence-state-production-integration-test.js` 第 8 組把 OPA 與 `a0e512b439446990d8df118e3e7d737b9f2f51d3` 整檔比對，沒有使用已存在的 Match vNext exact-delta comparator。其第 1–7 組真正 Gameplay assertions 當時通過；原 Receiver Save comparator 已存在。

本輪沒有把歷史失敗改寫成 PASS。先核對原 33 候選 hashes、F01 原 hash、HEAD／main／local origin/main、空 staged、index 與 Protected metadata，全部符合必要前提。前輪 Markdown SHA 與記錄吻合；兩份舊 Gate 未覆寫。

首讀 refs 時，前輪一個 Codex capture ref 已被另一個取代，詳見第 11 節。必要來源完全一致；沒有用新內容覆蓋舊來源基線。

## 2. 兩處精確修改

僅修改 `tests/pitch-sequence-state-production-integration-test.js`：

1. 第 4 行匯入既有 `assertMatchVNextSourceDelta`。
2. 第 142 行在 `script.js` 分支後，新增 OPA exact comparator 分支。

兩個修改前錨點各匹配一次。沒有修改歷史 pins、source list、第 1–8 組原 assertions、fixtures、seeds、Receiver Save 分支或預設整檔 equality。沒有修改 Source-Scope helper、OPA、PDF 或任何 Gameplay Production，也沒有加入目前整檔 SHA allowlist。

## 3. 修改前後 SHA／Diff

| 版本 | Raw SHA256 |
| --- | --- |
| 修補前 | `7a53369d526de1c3a66b9d3e0c69f45f27f261bdb1d28c354f9831c0e8ae8327` |
| 修補後 | `887f481d810180fcc8d6bf9ba67ad8dfbc38e7b5cb42d4b765dbceaf27b9d731` |
| 前輪記憶體預覽 | `887f481d810180fcc8d6bf9ba67ad8dfbc38e7b5cb42d4b765dbceaf27b9d731` |

修補後與預覽 bytes 完全相同。原檔 LF＝156／CRLF＝0；修補後 LF＝157／CRLF＝0，沒有 BOM、沒有換行重排。反向移除這兩處修改後，重建 SHA 正好回到原 `7a53369d…`，證明沒有其他本輪變更。

```diff
--- preflight/tests/pitch-sequence-state-production-integration-test.js
+++ repaired/tests/pitch-sequence-state-production-integration-test.js
@@ -4 +4 @@
-const { assertPitchProductionSourceScope } = require('./pitch-production-source-scope.cjs');
+const { assertPitchProductionSourceScope, assertMatchVNextSourceDelta } = require('./pitch-production-source-scope.cjs');
@@ -141,2 +141,3 @@
     else if (file === 'script.js') assertPitchProductionSourceScope(current, baseline);
+    else if (file === 'offensive-plate-approach.js') assertMatchVNextSourceDelta(file, current, baseline);
     else assert.equal(current, baseline, file);
```

## 4. F01 八組正式驗證

立即以原 CLI 執行，均 exit 0：

| Command | 結果 | stdout SHA256 |
| --- | --- | --- |
| `node tests/pitch-sequence-state-production-integration-test.js` | 原 8/8 PASS | `3ade805608529870b9b45980b2468c83b911cd9057451a7e576ebbd42194c84d` |
| `node tests/pitch-production-source-scope-test.js` | 7/7 PASS；131 個 mutation rejection | `c7168d6c4c4c473dd6f07d4a36294f8d0b15ef8dc20b792aaa74e4e9d16064a8` |

八組保留 genuine multi-pitch、browser/CommonJS prefix、ON/OFF、Save/Load、零 RNG／source mutation、compressed NPC rejection、persisted rebuild 與 Source-Freeze。Source-Scope 套件仍驗證原歷史 pins、95 protected functions、25 globals 及 131 個未授權 mutation rejection。原 helper 本輪 raw SHA 未變。

## 5. 原工作樹完整 24 套回歸

依舊 Gate 第 16 節 `$acceptanceTests` 的原 24 個精確路徑與順序執行，並與其 JSON 16＋8 路徑逐一比較一致。沒有增減案例、沒有改原測試內容。

| Exact command | 原工作樹 | 隔離 overlay | 乾淨候選 tree |
| --- | --- | --- | --- |
| `node tests/match-vnext-same-ball-execution-contract-test.cjs` | 0 | 0 | 0 |
| `node tests/match-vnext-same-ball-production-integration-test.cjs` | 0 | 0 | 0 |
| `node tests/bbp-b2b1-fly-ball-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | 0 | 0 | 0 |
| `node tests/match-full-game-record-test.js` | 0 | 0 | 0 |
| `node tests/match-situation-lifecycle-test.js` | 0 | 0 | 0 |
| `node tests/defensive-opportunity-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/defensive-reach-secure-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/defensive-decision-throw-foundation-test.js` | 0 | 0 | 0 |
| `node tests/defensive-decision-throw-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/bbp-b2b2-tag-up-decision-execution-test.js` | 0 | 0 | 0 |
| `node tests/bbp-b2a-line-drive-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/active-defensive-assignment-integrity-test.js` | 0 | 0 | 0 |
| `node tests/ground-ball-defensive-settlement-lifecycle-regression-test.js` | 0 | 0 | 0 |
| `node tests/canonical-match-regression-integration-test.cjs` | 0 | 0 | 0 |
| `node tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | 0 | 0 | 0 |
| `node tests/pitch-production-source-scope-test.js` | 0 | 0 | 0 |
| `node tests/high-school-year-one-opportunity-two-integration-test.js` | 0 | 0 | 0 |
| `node tests/pitch-sequence-state-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/pitch-tactical-decision-production-adapter-integration-test.js` | 0 | 0 | 0 |
| `node tests/pitch-tactical-decision-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/pitch-tactical-intent-evidence-integration-test.js` | 0 | 0 | 0 |
| `node tests/pitch-tactical-interpretation-production-integration-test.js` | 0 | 0 | 0 |
| `node tests/pitch-tactical-signal-projection-production-integration-test.js` | 0 | 0 | 0 |

三個環境都是 **24/24 PASS**，共 72 次原套件執行；另列的立即 F01／Scope 兩次驗證不混入這個分母。三輪依序約 93.4／97.9／98.9 秒。各套 exact command、cwd、UTC 起訖、耗時、exit、assertion summary、stdout bytes／SHA 及 stderr 在 Evidence JSON；任何早期 observer 或額外檢查的非零 exit 都另列保留。

原工作樹使用普通 `node <file>`；兩個隔離環境使用同一 CLI 入口、同一實體檔案，加上 data-URL 讀取監測。監測只核對 I/O／compile／唯讀 git-show，沒有 virtual FS 或 fixture／source 替換。

## 6. 最終 34 檔 SHA Manifest

原 33 檔全部 raw SHA 不變，加上已授權修好的 F01，合計 **34**；24 tracked、10 untracked。所有項目 Protected＝false。本輪兩份文件、舊 Gate reports、無關 WIP 均不在 staging 候選。

以下依序列出來源 raw SHA、候選 Git blob SHA256、乾淨 checkout raw SHA；三種 bytes 不能混為同一證據。完整 SHA、blob OID、bytes、CRLF counts、normalized equality、tracking／HEAD 與功能歸屬在 JSON `FINAL_STAGE_MANIFEST`。

| Path | 原工作樹 raw SHA256 | Git blob SHA256 | 乾淨 checkout SHA256 |
| --- | --- | --- | --- |
| `batted-ball-fly-ball-defense.js` | `3a05fc05e182f32ac0c398fd84ad53ff3c9c86eba8822ae53bfe2838533df038` | `3a05fc05e182f32ac0c398fd84ad53ff3c9c86eba8822ae53bfe2838533df038` | `fe0b888c503b5e053d8c88dfc58b279ae8f7d90639e10b777adf45096da9c08e` |
| `contracts/match-vnext-execution-v0.1.cjs` | `04254272d4bfff3bff61817d8d49cb99c143885bfbbd35d0f2bca300be5e96a6` | `04254272d4bfff3bff61817d8d49cb99c143885bfbbd35d0f2bca300be5e96a6` | `8f830252ab266612eafa2da4587356e3e9bb0380fefe2d3e00322eba8f13af44` |
| `defensive-decision-throw-foundation.js` | `c5afcf9c0f0fd1a501e5dec0bdc26d30054ac9a7f29f792c716190a8f7434ed7` | `c5afcf9c0f0fd1a501e5dec0bdc26d30054ac9a7f29f792c716190a8f7434ed7` | `f1d6dac2a591d7d7b3610296152544bae711fa5edb7083d10f67f4a1c80ade60` |
| `defensive-reach-secure-foundation.js` | `899a5bc5f6c94f6105f1cfac654fb42758bc7ccd9ddb8a39556a1bc0cf937343` | `899a5bc5f6c94f6105f1cfac654fb42758bc7ccd9ddb8a39556a1bc0cf937343` | `2b0bf776e7fe3dbd5561c5c46b81d45ffb7f0b7eb546c49b5c4466bf620f5d18` |
| `defensive-runner-throw-settlement-foundation.js` | `2c7e08c73553cdcf8b5aaa6a0953aec93ba973998b6bc72704647971d070f6fb` | `2c7e08c73553cdcf8b5aaa6a0953aec93ba973998b6bc72704647971d070f6fb` | `05cc37f09d514fb4eef3ecd878adab680306ca577a611a97917a003168575133` |
| `index.html` | `a635cc3f3ad2f169ee67bab39df87a7fee6f5dbe9a50d9a84ec1593099ae688c` | `9ccd1ac6c5c59bfb53a07725f6305c3e091e469e483fa30a95a5015ae04dad3a` | `e5bf8420dd04ca8877cae2eab5f8bde918c955043cf21fe897e74d058cdaf94e` |
| `match-experience-development.js` | `544a9a3625c69d868645011ff0f67804b48cd0734bcb5b1e4410ca593df766f3` | `544a9a3625c69d868645011ff0f67804b48cd0734bcb5b1e4410ca593df766f3` | `9682064cf770a41abf859fe584b13802b6e803e3344cab39d5f6b02c782a16e8` |
| `match-game-record.js` | `748748681cea569449779ad827ea0aa688b5240ac4f13b6b7dd54b1b6e9a9f56` | `748748681cea569449779ad827ea0aa688b5240ac4f13b6b7dd54b1b6e9a9f56` | `85c3fee7dc9fb8b6ff22fd9ec76b540f93ee8528a2c26babf61c39b32bd0f04e` |
| `match-situation-lifecycle.js` | `030eb851e2cac85fff8e01f44903b8f182ce417ad03e34db57c0b523b1f3e544` | `030eb851e2cac85fff8e01f44903b8f182ce417ad03e34db57c0b523b1f3e544` | `3a7c0ee0314a4d6e402e61a2293085fc429c3df6604159bba6c2af2e946ea91c` |
| `match-vnext-same-ball-execution-adapter.js` | `832f009a14689e883a6d57590f2a85f7d475ad508fa8ec51166c5ebe50a853e6` | `832f009a14689e883a6d57590f2a85f7d475ad508fa8ec51166c5ebe50a853e6` | `6b2aa3dfcf9db2770cc2656b0cdb49bc2ef85e9c5e1b91cd0f9859fec26258ab` |
| `offensive-plate-approach.js` | `2af35f764895accbbd31d2ab8d5e04419806502b833707620420e88c93ab2a8b` | `e85d6f4e53461a1d80ac47dd159f015e72ca5fbeb7197433c30e90ee3ff1139f` | `2af35f764895accbbd31d2ab8d5e04419806502b833707620420e88c93ab2a8b` |
| `plate-decision-foundation.js` | `c67885604f81c1be2104b9935d6a1d2fbfd85c4e2cc094394782b0916fe441dc` | `c67885604f81c1be2104b9935d6a1d2fbfd85c4e2cc094394782b0916fe441dc` | `d8ebcc13397198bb8bf8b090ab492381fd0020690946ff3ede78177cda876f89` |
| `receiver-source-snapshot.js` | `4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274` | `4a9e63e98259b153c09b1c39216fd152c36e56ef911b2693df28aa8caa353274` | `9c338600def5f2335793b277b8ad9e5d722413454312657402de9d7b745677b6` |
| `save.js` | `7111e2180f93f15fdaa0c402b6fe034240e064c6acff01d0d79bb1755990ebb7` | `9a3a1013cd8451979785f118b1e43fde65d10d71ff507ae8626c771bff3287a7` | `7111e2180f93f15fdaa0c402b6fe034240e064c6acff01d0d79bb1755990ebb7` |
| `script.js` | `1bc10c1856db1259f50f553eab274440328bfa5a8a55fe2a42b070c9158e2022` | `7ca80867f861fc531e27f6437b0f7703b290e6fa28c5f8227b9b16a61c4be1f9` | `1bc10c1856db1259f50f553eab274440328bfa5a8a55fe2a42b070c9158e2022` |
| `tests/bbp-b2b1-fly-ball-production-integration-test.js` | `346d9cf87d05d68ac41eefb6fec1f458178c6d3f8135564866707a87cdcd8db8` | `346d9cf87d05d68ac41eefb6fec1f458178c6d3f8135564866707a87cdcd8db8` | `66701e886a3875e6380c0083cb7ce2798473381681308dc49cb6d9305d1762a0` |
| `tests/bbp-b2b1-fly-ball-tag-up-legality-test.js` | `5c1c04a7a12bc5fd64e24c8b3c21773f4852e7c263855be8c11eac539f858f3e` | `5c1c04a7a12bc5fd64e24c8b3c21773f4852e7c263855be8c11eac539f858f3e` | `5e68a306e2bdc02a42334321769bcd322e9334edee1a179419d171ac5a17b176` |
| `tests/bbp-b2b2-tag-up-decision-execution-test.js` | `ca381d7a5258cf262d33bc893d883705477043d0622e8501dcecd78061dc04ef` | `ca381d7a5258cf262d33bc893d883705477043d0622e8501dcecd78061dc04ef` | `72e9e74d0e676fed954cd69b74eb5e65b95a26499cc8be872b6bff069fd152b5` |
| `tests/canonical-match-regression-integration-test.cjs` | `1265fb28109fe80726f50ad7ddd82af60a95faaa2083b5ebf11883f0b799df1c` | `1265fb28109fe80726f50ad7ddd82af60a95faaa2083b5ebf11883f0b799df1c` | `de4e5be049ba53210e464bc8792dfc84b46845f25093aa6482b09fd4513236de` |
| `tests/defensive-opportunity-production-integration-test.js` | `0f77e0649a9964e6a4148d8f33015ae053a5e9f7929fe7e97410a654fce4d9bf` | `0f77e0649a9964e6a4148d8f33015ae053a5e9f7929fe7e97410a654fce4d9bf` | `2057c9504b05c8404d76bbd0639cf0209224069fdd8f1539923fc3ae275bf253` |
| `tests/g1-a-outfield-flyout-attribution-lf-coverage-test.cjs` | `9f9e2e59bb6296d4a67d8b10a573f52720b5407494aa81608c9ef06756ac50d2` | `9f9e2e59bb6296d4a67d8b10a573f52720b5407494aa81608c9ef06756ac50d2` | `8a00a2cf33806b747c4c7f8866badc6dac24e2f7e6c7c58d07a2f73fc6800191` |
| `tests/helpers/canonical-match-contract-context.cjs` | `b09b35cf404c100b6f1d00ff6b8e67e38093fd6d13a22e788413f3bb7c608fb5` | `b09b35cf404c100b6f1d00ff6b8e67e38093fd6d13a22e788413f3bb7c608fb5` | `7bb3755cd2ec0c9f8b4ba4aeb340528dc268c61aa53ed9b48d9680d0ad98a862` |
| `tests/high-school-year-one-opportunity-two-integration-test.js` | `7c67d25fcd60ac784fe01884e55a2be0a8886131178731fbde75eae19f074005` | `7c67d25fcd60ac784fe01884e55a2be0a8886131178731fbde75eae19f074005` | `3e6d7712cd9273e97357f2c7887f5bae018e079b55e0c2071ad0f67a5f58654e` |
| `tests/match-vnext-same-ball-execution-contract-test.cjs` | `70b39d748b622e3e7d16681997f56d5906b02390aea13c91090a3b4034f6fe03` | `70b39d748b622e3e7d16681997f56d5906b02390aea13c91090a3b4034f6fe03` | `c7f5883bdf667fd6914624e55cf5d21b1b62cbaad587abf3e63c3ce3704ea9b9` |
| `tests/match-vnext-same-ball-production-integration-test.cjs` | `1df515f8537ac40eb1c0648ca61508787bed46f73f5d775e670fc02156c109b4` | `1df515f8537ac40eb1c0648ca61508787bed46f73f5d775e670fc02156c109b4` | `030f4527fc291fe27394933c8afbdd5de8155d184552c96fbc1756a8bc5fc518` |
| `tests/pitch-production-source-scope.cjs` | `4d48e8ded5adfddb044fb9e7d9dc954f9a364fcf9bcd3d45831d7c7ca3836eea` | `4d48e8ded5adfddb044fb9e7d9dc954f9a364fcf9bcd3d45831d7c7ca3836eea` | `28fdedf20e60f9f89dc32a68c2434ec2b20b49a49e381a3c2f6ac506c695143a` |
| `tests/pitch-tactical-decision-production-adapter-integration-test.js` | `f25215c5d052d50e325c47bbed8af10cedb213004803d829a411da3681c8f1af` | `f25215c5d052d50e325c47bbed8af10cedb213004803d829a411da3681c8f1af` | `a7c627a5afea51ad5644c211f5aa3b65592cc40271e1693e7a81fda50ff6fd41` |
| `tests/pitch-tactical-decision-production-integration-test.js` | `92d4ebd87febb86cb4d965b696e4a46e7090f9a2a1484963232333f450c8942a` | `92d4ebd87febb86cb4d965b696e4a46e7090f9a2a1484963232333f450c8942a` | `94efa8df9111aca3eea025fff4f33f2b2662bf55ba59e44cb58be34dea025147` |
| `tests/pitch-tactical-intent-evidence-integration-test.js` | `cac3c0ebb73c74e87c80ea50ea06ec4255110270aef59a98cc0265c27b90892a` | `cac3c0ebb73c74e87c80ea50ea06ec4255110270aef59a98cc0265c27b90892a` | `7a77ea5ca07ef8e570fd23bceeafc053a33569519f1922a34ef306c73c4c3729` |
| `tests/pitch-tactical-interpretation-production-integration-test.js` | `acc6d7914ff7763a5fd01fa9993301ed05337fa8675c5f9011002f747a62936b` | `acc6d7914ff7763a5fd01fa9993301ed05337fa8675c5f9011002f747a62936b` | `e4ec6f9f2f2a7952ee620dd4453d55b5433a24e647a629095e0aee431dbb608c` |
| `tests/pitch-tactical-signal-projection-production-integration-test.js` | `09d57b03fd4a35487ef3024f7576980d8a70237385dddbf48551df43c23bcbf7` | `09d57b03fd4a35487ef3024f7576980d8a70237385dddbf48551df43c23bcbf7` | `99ee5b828108473f2f59b8698d1919d81ad9a02bb2052dda95f8007d37e5a1d7` |
| `tests/receiver-source-index-authorized-wiring.cjs` | `48fe3bc74e385bb55a991096ef0ee1445e04c5b9d38b5e75621c43c8ee06bc36` | `48fe3bc74e385bb55a991096ef0ee1445e04c5b9d38b5e75621c43c8ee06bc36` | `06417697066d45f38c1e92da252567d6f0212045756213181062cd995571eaf9` |
| `tests/receiver-source-save-authorized-delta.cjs` | `94a2cac6e155c3936ea2cd03f0d31e4e19feba87d53f87c4be5c3cc5aab28b82` | `94a2cac6e155c3936ea2cd03f0d31e4e19feba87d53f87c4be5c3cc5aab28b82` | `46fa3dae9009831875c0220645603c187ccca883cd6ce1dd7dd31e5926a6f05a` |
| `tests/pitch-sequence-state-production-integration-test.js` | `887f481d810180fcc8d6bf9ba67ad8dfbc38e7b5cb42d4b765dbceaf27b9d731` | `887f481d810180fcc8d6bf9ba67ad8dfbc38e7b5cb42d4b765dbceaf27b9d731` | `dad43633e78c6974c2f280dc6e8d9dec62656a963f08c619f0893e82a438b2cc` |

34 檔在 overlay 複製後都與批准的來源 SHA 完全一致。四個來源（index／OPA／save／script）staging 時去除 CRLF，乾淨 checkout 有 31 檔 raw SHA 與來源不同；**34 檔 CRLF-only 正規化後全部相同**。沒有為讓 hashes 相同而格式化原來源。

## 7. 隔離 Clone 建立方式

新建外部任務目錄，建立時不存在，且已解析確認位於 Windows temporary root、原 repo 之外：

- Overlay：`C:\Users\User\AppData\Local\Temp\accepted-gameplay-f01-20261019082935662-0cecf3e2\overlay`
- Clean：`C:\Users\User\AppData\Local\Temp\accepted-gameplay-f01-20261019082935662-0cecf3e2\clean`

第一份 clone 的完整命令：

```powershell
git --no-optional-locks clone --no-hardlinks -- 'E:\meng\baseball_life_sim_semirefactor' 'C:\Users\User\AppData\Local\Temp\accepted-gameplay-f01-20261019082935662-0cecf3e2\overlay'
```

只逐檔複製第 6 節的 34 份批准 bytes，前後均 hash 核對。Clone 原先 HEAD 為 `ab3117653945de0b7013636187c446276a96e634`；沒有 shallow、沒有 object alternates。沒有把 Protected 工作樹版本、其他 untracked fixture、歷史 evidence／docs 或本輪報告複製進去。

Git 寫入前逐次核對 isolation root，並移除可能把 Git 指向原 repo 的 GIT_DIR／WORK_TREE／INDEX_FILE／COMMON_DIR／OBJECT_DIRECTORY／ALTERNATE_OBJECT_DIRECTORIES 環境變數。原 repo HEAD／index／refs 在 clone 與候選寫入前後均做比較。所有 Git 寫入均限定隔離 clone。

原 `EXCLUDED_WIP_MANIFEST` 的 1,216 檔包含 F01 本身；本輪明確授權將它納入後，其他 **1,215** 個舊排除 WIP 仍不複製，另排除兩份舊 Gate 文件。這是分母的授權調整，不是偷偷多收檔案。

## 8. 隔離來源依賴驗證

Overlay 與 Clean 各 24 套完整原 assertions 都 PASS；讀取／compile 監測涵蓋 **130 個實際來源路徑**，全部位於各自 clone，沒有讀取原工作樹、Protected 內容或額外未追蹤 fixture。僅允許 clone cwd 內原有的歷史 `git show`；完整歷史 objects 留在 clone，沒有 alternates 指回原 repo。

130 個實際 read／compiled paths 在三個環境經 CRLF-only 正規化後內容均相同。原 Gate 的 95 classic scripts 載入順序與 134 檔靜態／測試閉包保持；其餘 HEAD 來源由完整歷史 clone 繼承，未用本機 WIP 補洞。沒有 npm install 或額外 Runtime package。

監測使用 Node builtins 的 data-URL preload，沒有新增 runner／preload 檔案到原 repo 或 candidate tree。這是具體命名測試的 I/O 證據，不是全 OS sandbox 宣告。第一個監測版本誤擋原有 `--no-optional-locks show`，另一次診斷重現同一擋法；修正的是 observer 的 optional flag 處理，完整原 24 套才重新執行通過，沒有改測試來配合 observer。

依 AGENTS 沿用本對話已正常讀取的 codebase-memory skill 指引；本輪沒有其 graph tools，沒有宣稱 graph／coverage／reindex。沒有重用一次性讀取例外。完整 read catalog、每套讀取 IDs／compiled 路徑與 git calls 在 Evidence。

## 9. 乾淨候選 Git Tree 驗證

僅在 Overlay 內以精確 34 paths staging，staged 集合與預期完全一致，再建立 tree／臨時 commit：

| 項目 | 值 |
| --- | --- |
| Parent | `ab3117653945de0b7013636187c446276a96e634` |
| Candidate tree | `c99ee839b7bb115179c473f5020e6291d38357a6` |
| Temporary candidate commit | `c9a4f279dfee4ad17fb5a9c54e56c4aa82c64f1b` |
| 隔離 ref | `refs/heads/f01-validated-candidate` |
| Parent → candidate changed paths | 精確 34 |
| Clean checkout 前後 status | 空 |
| 完整歷史 pins | 8 個全部可達、全部為 candidate ancestors |
| core.autocrlf | true；clone／staging 明確核對 |

第二份 clone **只從 Overlay 的候選 commit 還原**，未再拷貝任何來源，實際命令：

```powershell
git --no-optional-locks -c core.autocrlf=true clone --no-hardlinks --branch f01-validated-candidate -- 'C:\Users\User\AppData\Local\Temp\accepted-gameplay-f01-20261019082935662-0cecf3e2\overlay' 'C:\Users\User\AppData\Local\Temp\accepted-gameplay-f01-20261019082935662-0cecf3e2\clean'
```

Clean HEAD／tree 分別等於上述 commit／tree，沒有 alternates，shallow=false；24 套再跑全過，完成後 working tree 仍乾淨。這輪已完成真正實體還原，前輪的 `COMMIT_CANDIDATE_NOT_EXECUTION_VERIFIED` 限制對這份候選已解除；舊 Gate 本身仍保留原結論供歷史查核。

**保留的 whitespace 檢查結果：** `git diff --cached --check` exit 2，精確四項：

```text
contracts/match-vnext-execution-v0.1.cjs:140: new blank line at EOF.
match-vnext-same-ball-execution-adapter.js:98: new blank line at EOF.
tests/match-vnext-same-ball-execution-contract-test.cjs:223: new blank line at EOF.
tests/match-vnext-same-ball-production-integration-test.cjs:715: new blank line at EOF.
```

這四檔都是批准清單中的既有 bytes，並非本輪加出的空白。沒有授權重新格式化；沒有將 exit 2 記成 PASS。它不構成執行／必要依賴衝突，但正式 Commit 審查必須知道這些提示；本報告不宣稱 whitespace check PASS。

## 10. Canonical／Game Record／G1-A 結果

| 驗收 | 原工作樹 | Overlay | Clean |
| --- | --- | --- | --- |
| G1-A 專項 | 29/29 | 29/29 | 29/29 |
| Fly Ball Production | 15/15 | 15/15 | 15/15 |
| Game Record | 13/13 | 13/13 | 13/13 |
| Situation Lifecycle | 23/23 | 23/23 | 23/23 |
| Canonical（原固定四場） | 50/50 | 50/50 | 50/50 |
| F01 原八組 | 8/8 | 8/8 | 8/8 |

三環境有 23/24 套的 stdout digest 完全一致。Canonical 輸出包含來源 raw SHA 證據，全文 digest 因換行不同而不同；三邊 50 項 assertions 都通過，130 個實際讀取來源 normalized-equal。未用「digest 不同就忽略 assertions」或「工作樹 PASS 代替 candidate PASS」的方式判定。

保留 Sprint 1 controlled slice、S2-A／Core Recovery facts 與 G1-A 接殺歸屬的已接受範圍；Sprint 2 整體 PARTIAL，沒有自然模式 rollout、Alpha、G1-B 或新 Gameplay 功能。

## 11. 原 WIP／Protected／Git 完整性

最終完整性 **PASS**：核對 1,964 個既有可讀檔案，只有 F01 的 raw SHA 從 `7a53369d…` 變為批准的 `887f481d…`；反向兩處修改可精確重建原 SHA。33 個原候選與兩份舊 Gate 全部不變，12 個 Protected size／mtime 不變。原 HEAD／main／local origin/main 保持 `ab3117653945de0b7013636187c446276a96e634`，index SHA 保持 `6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d`，staged 空，本輪首讀的 18 個 refs 全部不變。原 status 排除兩份新報告後 SHA 保持 `72b8fd81e6654fa668a7d25c90749690281728112cf080ec89ab25bcdec93398`；最終 25 tracked WIP／1,228 untracked，只多出授權兩份文件。Clean candidate 測試後 HEAD／tree 正確且 status 仍空。

兩份舊 Gate SHA：

| Path | SHA256（本輪前後一致） |
| --- | --- |
| `docs/accepted-gameplay-git-baseline-readiness-v0.1-evidence.json` | `cba6fa233592acae28fec4f7e66903bbdee31fd9ba1fc44fa238429665632512` |
| `docs/accepted-gameplay-git-baseline-readiness-v0.1.md` | `d94f463aa4ace3e4eddc237cc5f075081d99d659a4e6f836e786eaa23cb53d7f` |

跨輪 refs 差異在本輪第一個 Git 讀取時已存在，明確保留：

| Ref | 前輪 Gate | 本輪 preflight |
| --- | --- | --- |
| `refs/codex/turn-diffs/captures/1792395027074/9f0bdcaf-4f50-4cb4-9bba-899f7d89fe72/base` | `5a2fdf9fe0fb82286a49871ec85b3a9c0d55cc06` | 不存在 |
| `refs/codex/turn-diffs/captures/1792398202230/5c3db40c-4e34-40ca-9de6-2ee613281b24/base` | 不存在 | `8582944e06e34603949497c644bbabf6d383d243` |

沒有回寫這兩個 refs，也不把它們宣稱為跨輪不變。main／HEAD／local origin/main／index 與必要來源均符合固定值；本輪最終 refs 比對採首讀的全部 18 個 refs。Gate Evidence 內容未被新狀態覆蓋。

## 12. 最終可提交性結論

**GIT_BASELINE_READY_FOR_APPROVAL**。F01 精確修補、原八組、原工作樹 24、隔離 24、乾淨候選 24、34 檔 closure／Git tree 重現與原 repo 完整性均已完成。沒有未解析的必要依賴。

此結論只表示可以申請原 repository 的 branch／精確 staging／single commit 授權。原 repo 尚未 Stage／Commit／Push，不宣告遠端安全；隔離臨時 commit 是本輪明確批准的驗證產物。四項既有 EOF 空白行提示需隨正式提交審查保留，不在本輪修掉。

## 13. 待使用者授權的精確 Stage／Commit 步驟

**以下命令本輪未在原 repo 執行。** 本輪附件只授權修補與驗證；需要另行批准在原 repo 建立 `accepted-gameplay-baseline-v0.1` 分支、精確 Stage 34 檔，並建立一個 commit。不包含 Push。

預定 message：`feat: establish accepted match gameplay baseline`。內容為：Receiver／R0 必要前置來源、Sprint 1 controlled same-ball、S2-A／Core Recovery facts、G1-A LF／CF／RF flyout attribution，以及對應正式測試／精確 guards。兩份新驗收報告、兩份舊 Gate、其他 WIP 都排除。

使用本節精確路徑；執行前重新核對此報告、原 HEAD／branch／index／refs、空 staged、34 raw hashes、其餘 WIP 與 Protected metadata。任一必要來源改變就停止，不能自動更新基線。

```powershell
# PROPOSE ONLY: requires new explicit original-repository Git authorization.
Set-Location -LiteralPath 'E:\meng\baseball_life_sim_semirefactor'
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
$gate = Get-Content -LiteralPath 'docs/accepted-gameplay-git-baseline-f01-repair-v0.1-evidence.json' -Raw -Encoding UTF8 | ConvertFrom-Json
if ($gate.status -ne 'GIT_BASELINE_READY_FOR_APPROVAL') { throw 'Gate not ready' }
if ((git --no-optional-locks branch --show-current) -ne 'main') { throw 'Branch changed' }
if ((git --no-optional-locks rev-parse HEAD) -ne 'ab3117653945de0b7013636187c446276a96e634') { throw 'HEAD changed' }
if ((Get-FileHash -LiteralPath '.git/index' -Algorithm SHA256).Hash.ToLowerInvariant() -ne '6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d') { throw 'Index changed' }
if (@(git --no-optional-locks diff --cached --name-only).Count -ne 0) { throw 'Index not empty' }
if ($gate.FINAL_STAGE_MANIFEST.Count -ne 34) { throw 'Manifest count mismatch' }
if (Compare-Object ($candidatePaths | Sort-Object) ($gate.FINAL_STAGE_MANIFEST.path | Sort-Object)) { throw 'Manifest paths mismatch' }
foreach ($candidatePath in $candidatePaths) {
  $entry = $gate.FINAL_STAGE_MANIFEST | Where-Object { $_.path -eq $candidatePath }
  if ((Get-FileHash -LiteralPath $candidatePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw ('SHA changed: ' + $candidatePath) }
}
git --no-optional-locks status --porcelain=v1 --untracked-files=all
# Recheck excluded WIP, protected metadata and all refs against the final evidence.
git switch -c accepted-gameplay-baseline-v0.1
if ($LASTEXITCODE -ne 0) { throw 'Branch creation failed' }
git -c core.autocrlf=true add -- $candidatePaths
if ($LASTEXITCODE -ne 0) { throw 'Exact staging failed' }
$stagedPaths = @(git --no-optional-locks diff --cached --name-only)
if (Compare-Object ($candidatePaths | Sort-Object) ($stagedPaths | Sort-Object)) { throw 'Unexpected staged path' }
if ((git --no-optional-locks write-tree) -ne 'c99ee839b7bb115179c473f5020e6291d38357a6') { throw 'Staged tree differs from validated candidate' }
$whitespaceOutput = @(git --no-optional-locks diff --cached --check -- $candidatePaths)
$whitespaceExit = $LASTEXITCODE
$expectedWhitespace = @(
  'contracts/match-vnext-execution-v0.1.cjs:140: new blank line at EOF.'
  'match-vnext-same-ball-execution-adapter.js:98: new blank line at EOF.'
  'tests/match-vnext-same-ball-execution-contract-test.cjs:223: new blank line at EOF.'
  'tests/match-vnext-same-ball-production-integration-test.cjs:715: new blank line at EOF.'
)
if ($whitespaceExit -ne 0 -and ($whitespaceExit -ne 2 -or (Compare-Object $expectedWhitespace $whitespaceOutput))) { throw 'Unexpected whitespace check result' }
# Review exact staged diff and retained known EOF warnings before commit.
git --no-optional-locks diff --cached -- $candidatePaths
git commit -m 'feat: establish accepted match gameplay baseline'
if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
if ((git --no-optional-locks rev-parse 'HEAD^{tree}') -ne 'c99ee839b7bb115179c473f5020e6291d38357a6') { throw 'Committed tree mismatch' }
```

正式提交後應再跑下列原 24 套，記錄每個 exit 與 stdout digest；並以新正式 commit 做乾淨 full-history 還原驗證、核對未納入 WIP 與 Protected metadata。不可 reset／restore／clean 去處理保留的 WIP，也不能要求 status 變乾淨：

```powershell
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
foreach ($acceptanceTest in $acceptanceTests) {
  node $acceptanceTest
  if ($LASTEXITCODE -ne 0) { throw ('Post-commit test failed: ' + $acceptanceTest) }
}
git --no-optional-locks status --porcelain=v1 --untracked-files=all
git --no-optional-locks log -1 --format=fuller
```

本輪在兩份新驗收文件交付後停止。沒有原 repo Stage／Commit／Push、G1-B／G1-C／G2／G3 或任何新 Gameplay Sprint。

