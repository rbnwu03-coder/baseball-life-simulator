# 《棒球人生》Match Gameplay Coverage & Reprioritization Gate v0.1

日期：2026-10-19，Asia/Taipei。範圍：唯讀來源／既有測試／隔離 VM 探測；只交付本報告與同名 Evidence JSON。

## 1. Executive Decision

**COVERAGE_GATE_PASS：本輪稽核與開發決策已完成；不是 Gameplay 全覆蓋 PASS。完整 PC Alpha 目前 NO-GO；新 Same-Ball Natural Rollout 維持 NO-GO。**

最短合理路徑是：**重用已可完成整場的原混合 Match，補九角色最低 NPC 責任及外野 flyout／single 的正式記錄，再接 live 公開呈現接口與 Phaser。** 不重建 Match、Runner、Game Record、Save 或 Career，也不要求每個 NPC 打席都跑 Detailed。

直接影響排序的發現：

- **1B、3B 已有玩家玩法，不能列為零。** 公開 3U、3-1、5-3、5-4-3 都能進原 Match／Record；1B 接傳還有一場正常入口的第七局實例。自動接傳本身不是額外玩家決策。
- **CF／RF 能接殺，但守備記錄未閉環。** 實測一個 PA、一個出局成立，真正 CF／RF 的 chances／PO 仍為 0。flyBallCatchResolution 未進原守備統計派送；一般 integrity checks 仍為空，不能僅憑 PASS 忽略這個缺口。
- **LF 有正式責任與能力來源，但 fly 執行明確 unsupported。** 實例回到原 mapper 的 single，不是完成 LF 拾球／回傳。
- **C 不是空白。** 玩家有 block／hold／reset／throw 舊正式 handler；NPC 有本壘 receiving／tag-up 來源。但 NPC C 全部最低接捕與 actor 統計尚未證明。P 有真投球能力與 NPC 補位；玩家投手出賽仍明示 deferred。
- **S2 Recovery 完成的是有界 facts。** 九個既有 Production 案例、五個 runner closure，不代表 ROE／PA 已提交。若 Alpha 維持原 mode-off 混合流程，S2 recovered-reach 最後串接列 P1；若要求自然啟用新 S2 policy，立即升 P0，且不能在失敗後切回另一結果。
- **Phaser Gate：需先補一個明確的 Match 接口。** Snapshot／cursor／公開 choices／handler 已有；live allowlist DTO 與命令橋接尚缺。小切片可在接口可用後開始，不必等全部玩家守位或深 Recovery。

C0–C5 是本輪「已證明邊界」分類；沒有任何位置被提升為 C4／C5。缺少自然覆蓋或新接口證據的部分明列 UNVERIFIED；不藉此推測功能存在或不存在。

## 2. Baseline／Safety

| 項目 | 本輪基線 |
|---|---|
| HEAD／branch／local origin/main | ab3117653945de0b7013636187c446276a96e634／main／同 HEAD |
| 遠端資格 | 僅本機 tracking ref，未 fetch |
| Git index SHA-256 | 6805182aad285efb6c6dac054bbcee56058baf8adff46cbe920e025efb69d09d |
| Staged | 空 |
| 既有 WIP | 19 tracked modified；1,219 untracked files；不是乾淨 checkout |
| 最新 accepted source | Core Recovery Evidence 九份 finalSource 的 SHA 全部吻合 |
| 精確來源清單 | 125 個相關檔案；不建立全庫 manifest；hash 捕捉時間與範圍分別記錄 |
| Protected | 沿已接受報告的 12 路徑，只核對 size／mtime metadata，不讀內容、不 hash、不執行 |
| 本輪修改 | 僅指定兩份 Gate 文件；未修改 Production、測試、freeze、Save schema；未操作 Git 寫入 |

來源以目前磁碟 WIP 為準，不能只 checkout HEAD 就聲稱重現此結果。Sprint 1 文件前段 BLOCKED、Sprint 2 前段 BLOCKED 都是保留歷史；本輪採 Sprint 1 後段 CONTROLLED_SLICE_PASS、Sprint 2 S2-A PASS 與最新第25–32節 CORE_RECOVERY_FACTS_PASS。歷史「22套 PASS」不冒稱本輪重跑22套。

AGENTS.md 原要求「For structural codebase exploration, use the installed codebase-memory skill.」。該 skill 初次讀取 Access denied；四次升權讀取的自動審核均因審核模型容量不足未執行，並非不安全判定。使用者隨後明確同意「同意本輪採唯讀來源稽核」。因此本輪只用 rg／精確來源／既有測試，未使用 skill、graph、reindex，也未以其他通道讀取受阻 skill。這項方法例外只適用本輪。

## 3. Match Execution Coverage

Detailed：公開投打／守備選擇→原能力與球／接傳 facts→原 settlement。Compressed：AI PA 或 Physical outcome mapper 以簡化方式決定結果→同一原 Match／Record。

目前至少有三種來源：玩家 Detailed batting、玩家／部分 NPC 的 physical infield/airborne execution、一般 AI compressed PA。它們不是三個 Match。script 的原 applier、recordHighSchoolMatchSimulationEvent、MatchGameRecord 與終場 owner 共用。重要限制是一般 AI compressed PA 只讀 batter／P 能力，沒有逐一執行其他八個守位；不能因此宣告九位 NPC 已完成。[S04–S07、S10、S13、S21]

| 流程 | 已證明／既有正式接點 | 缺口／界線 |
|---|---|---|
| 正常開賽 | prepareHighSchoolYearOneMatch；Canonical 4場、Career fixture 2場正常選擇入口 | 固定 fixture，不是玩家族群統計 |
| 投打對決 | Pitch/Tactical→PlateDecision→OPA；Take／Contact／Power、真能力；兩套 vNext fresh PASS | 新 Same-Ball 只限 admitted 受控範圍 |
| 四壞／三振 | OPA balls>=4／strikes>=3；AI BB/SO；原 PA/Record；正常一壘手場 SO、三壘手場 BB/SO | K 的 C 接捕／PO 未完成最低角色對賬 |
| Fair／Foul | 原 foul/count；fair 才產同 Physical；vNext 原拒絕語義保留 | 無完整 foul-popup catch |
| 擊球結果 | AI 與 Physical mapper 的 out/1B/2B/3B/HR；有界 S2 infieldHit | 「模型結果」與「守備執行結果」分列第5節 |
| 守備結算 | SS/2B/3B/1B、P cover，部分 CF/RF catch；公開／自動來源分開 | LF、NPC C、OF hit／actor ledger 缺口 |
| 占壘／出局 | 原 Runner/Force/ThirdOut + canonical applier；公開DP兩個真 retirements | 新 R3 attemptSecond 只有 pending，不能當已到二壘 |
| 得分 | 原 scoreHighSchoolMatchRunner；同一 Record；tag-up safe／out 既有21 checks | SF/AB/RBI 的正式重分類不是已完成 |
| 打序 | apply 後由原 advanceHighSchoolMatchBattingOrder 前進一次 | 不可把一球同時送 legacy 與 held owner |
| 三出局換半局 | 原 thirdOut→advanceHighSchoolMatchAfterHalfInning；S1 O2／全場回歸 | 新類型須有 ordered retirements／terminal proof |
| 換局 | 原 half/inning/offense/defense 與 line score | 依 captured Rules；預設7局，不宣稱台灣賽制合規 |
| 比賽結束 | walkoff／completed-half→settleHighSchoolYearOneMatch；6場固定完整執行 | 不能以 helper/safety guard 直接補出局當合法玩法 |
| Game Record | PA、BF、H、PO/A/DP、eventRefs；核心沿用 | CF/RF catch 無 PO、C責任及新S2 ROE未完 |
| 賽後評價／發展 | 原終場→exposure→MatchExperience→competition reassessment/history；vNext match-end 與 Canonical 回歸 | 跨所有角色／多場 Career 因果未做新驗證 |
| Save／Load | 原 normalize／public save/load／duplicate guards；兩基線、Reach與tag-up回歸 | unresolved/partial checkpoint 是阻擋狀態，不是可玩續存成功 |

同一個 Physical 的守備若已開始，未閉合就保持阻擋；不能重抽另一 PA、把 pending 當出局，或直接給未到達的壘包。新自然模式不能因「成功分支可用」就開放，因為 admission 時不知道未來是否會失敗。

## 4. Nine-Position NPC／Player Matrix

**NPC**（C3 僅表示列出的有界正式結算，不代表整個守位已完成）：

| 守位 | 等級／實際執行 | 正式入口與來源 | Test／Witness | 未完成／沿用決策 |
|---|---|---|---|---|
| P | C3；3-1 接傳踩壘，actual P PO=1 | public choose→FirstBaseExecution；S03/S08/S13 | V1-P-CREDIT；1B原測試來源 | 主責短打/滾地/popup與自然cover UNVERIFIED；沿用接傳 |
| C | C2；tag-up接捕／能力與受控runner terminal | receiving target→tag-up handler；S16 | T06；21 checks | K接捕/PO、blocking、foul-popup與完整actor ledger UNVERIFIED；補最低責任 |
| 1B | C3；接傳/踩壘、PO、DP | 原 infield applier；S08–S10/S13 | I3/I8/I9；T02 | 不等於新Recovery已正式提交；保留 |
| 2B | C3；NPC主責傳一壘；5-4-3 pivot/PO/A/DP | incoming continuation／3B execution；S08/S09 | I7/I8 | 非所有NPC PA及球型；ADAPT |
| 3B | C3；NPC 3B→玩家1B，A+1 | incoming continuation；S02/S08 | I6 | narrow lane，未證明全左側自然主責；保留classifier |
| SS | C3；NPC SS→1B正式PA/A/PO | vNext/舊incoming；S08/S17–S19 | T01/T02/I4 | 新S2 error與多跑者自然未完；保留模式界線 |
| LF | C1；有真責任/能力，fly執行拒絕；PA由mapper single | Opportunity→FlyAccess→原fallback；S02/S11/S20 | A1-LF | 不是LF拾球/回傳；EXTEND shared airborne/NPC |
| CF | C2；接殺/PA/out成功，但本人PO=0 | FlyCatchResolution；S11–S13 | A2/V2-CF-CREDIT | PA層已入帳，defender層未閉環；ADAPT原Record事件 |
| RF | C2；同CF，真正RF PO=0 | 同CF；S11–S13 | A3/V3-RF-CREDIT | 同CF；合併一個外野closure工作 |

**Player**：

| 守位 | 等級／實際執行 | 正式入口與來源 | Test／Witness | 未完成／沿用決策 |
|---|---|---|---|---|
| P | C1；有能力/文字與legacy handler，正式exposure deferred | PlayingTimeGameExposure；S27 | 精確source；未執行玩家P案例 | 不具自然玩家P入場證明；首版延後 |
| C | C3；public secureAndHold，0新PA、原runner保留、chances+1 | public choose→CatcherDecision→Catcher applier；S15 | I5-PLAYER-C；原catcher測試未重跑 | synthetic情境；專屬active成長、全自然情境UNVERIFIED；可後續候選 |
| 1B | C3；3U/3-1主動選擇＋incoming自動接傳 | S08/S10/S22/S28 | I1/I2/I4；N1 | 自動接球非玩家決策；DP/其他自然範圍未全驗；低成本候選 |
| 2B | C3；ground pause/control/一次settlement；淺右平飛routine | infield family／line routine；S09/S14/S29 | T03 14/14；T04 12/12 | 不是全球型catch操作；與SS作首版候選 |
| 3B | C3；public 5-3/5-4-3，一PA，actor A/PO/DP正確 | S02/S09/S10/S22 | I3/I8；N2 | N2正常場無3B physical work；不可升C4；低成本後續候選 |
| SS | C3；public 6-3，玩家A+1、1B PO+1 | S09/S10/S22 | I9-PLAYER-SS；T02 | 不是全左側球；廣自然/airborne未證明；首版候選 |
| LF | C1；roster/能力與broad外野legacy surface | S02/S03/S11/S12 | source；精確LF玩家runtime UNVERIFIED | fly context明確排除player；不能拿generic外野手當LF完成；延後微操 |
| CF | C1；同LF；NPC catch不代表玩家可操作 | 同LF | source；runtime UNVERIFIED | 缺位置專屬入口/決策/執行/評價/接續驗收 |
| RF | C1；同LF | 同LF | source；runtime UNVERIFIED | 同CF |

逐位置的適用事件邊界：

| 位置 | 滾地／主責 | 平飛／飛球 | 傳接／壓力選擇 | 補位／回傳 | 合法失敗與續行 |
|---|---|---|---|---|---|
| P | 主責滾地/短打U | popup U | NPC一壘接傳已驗；玩家入場deferred | 3-1已驗 | 原1B測試有cover unavailable來源；本輪未新驗失敗 |
| C | 主責短打U | foul/pop U | player hold/reset已驗；NPC tag receiving有界 | 本壘 receiving來源有 | legacy runner safe/out可續；完整C attribution U |
| 1B | 3U已驗 | line/fly U | 主動3U/3-1、incoming已驗；3-6-3原來源 | P cover；DP回一壘 | 舊receive/secure/throw failures有原測試；新S2另受限 |
| 2B | ground已驗 | 淺右line routine；其他U | player ground、NPC pivot已驗；4-6-3來源有 | 5-4-3已驗 | Reach/Secure不可達/舊state拒絕已驗；非所有活球延續 |
| 3B | 5-3已驗；5U原來源 | airborne U | 5-4-3已驗，前位force有來源 | NPC傳/接鏈已驗 | legacy failure來源有；自然主要分支U |
| SS | 6-3已驗 | airborne U | force/DP原來源；S2 clean hit有界 | incoming已驗 | 新Recovery五runner閉合，PA未閉；不可放行 |
| LF | 落地拾球U | 有責任，但fly unsupported | throw/pressure U | secondary overlap不是relay | 原compressed PA可續，不是LF failure執行 |
| CF | 拾球/line U | medium/deep fly catch已驗，PO缺 | tag-up throw有既有有界來源 | cutoff/relay U | miss後compressed分類存在；終端守備因果未充分 |
| RF | 同CF | 同CF | 同CF | 同CF | 同CF |

U＝UNVERIFIED。沒有要求每個位置實作所有事件；要求的是該位置在 Alpha 所允許事件中的最低責任明確且能合法續行。現有九位 roster 完整與上述責任完整是兩件事。

## 5. Batted-Ball Outcome Matrix

以下六欄各自判定，不把「可抽到」「有球型」「可執行」「可裁定」「可提交」「可操作」合併為 PASS。R＝本輪受控/現有測試實測；S＝直接來源能力；U＝尚未驗證。AI generic out/single 不是 groundout/outfield hit 的 subtype 證明。

| 結果 | 1 模擬產生 | 2 Physical | 3 守備執行 | 4 正式Scorer | 5 原Owner提交 | 6 玩家可見/操作/續行 |
|---|---|---|---|---|---|---|
| Groundout | generic out S | ground R | SS/2B/3B/1B R | 內野action歸屬 R | PA/outs/PO/A R | public 6-3/5-3/3U/3-1 R |
| Infield hit | single S≠infieldHit | fair ground R | SS→1B、runner先到 R | S2-A clean infieldHit R | S2-A O0/1/2 R | 受控next PA R；自然U |
| OF flyout | generic out S | fly R | CF/RF R；LF拒絕 | caught→out；fielder PO缺 | PA/out R；defender ledger缺 | NPC呈現 R；玩家OF操作U |
| OF single | single S/R | line/fly方向深度 S | LF案例只是fallback；拾球/回傳U | mapper paResultOnly，非完整hit/error因果 | generic single/H/進壘可提交 | 原結果可續；角色閉環U |
| Line drive | generic out/hit S | line R | 僅2B淺右routine R | catch→out；miss走compressed | 原routine PA R | 自動執行；專屬catch decision U |
| Double | AI/mapper S | 相容shape S | OF relay/二壘terminal U | compressed PA分類 S | 原applier/Record doubles S | 原文字/續行S；fresh逐球U |
| Triple | AI/mapper S | 相容shape S | 拾球/relay/三壘terminal U | compressed PA分類 S | 原applier/Record triples S | 同上 |
| Home run | AI/mapper S | 非ground airborne S；無越牆幾何 | 不需守備出局；場地牆U | PA HR分類 S | 原全員得分/HR S | 原文字/續行S；fresh逐球U |
| Fielding/throwing E | AI不產；legacy可 S | 失敗stage facts S/R | 舊內野有；新Recovery部分facts | 舊E有；新Recovery ROE缺 | 舊error有；新candidate不閉合 | 舊可續；新S2明確BLOCKED |
| FC | AI無FC subtype | ground+force S | 真前位force/BR safe來源 S | legacy fieldersChoice proof S | PA token out＋真bases/outs S | 內野choice已有；fresh FC U |
| DP | AI不抽DP | ground/force R | 5-4-3真兩retirements R | 真actor PO/A/DP R | 一PA兩outs R | public challenge R |
| SF/tag-up | productiveOut不等於SF | catch/retouch S/R | SEND/HOLD、NPC C receiving R(既有fixture) | runner合法；SF/AB/RBI重分類未接 | score/out R；SF正式分類缺 | 玩家三壘跑者可選；其他held/deferred |
| Foul/popup | pitch foul；無AI popup | foul/count有；無完整foul-popup模型 | foul catch/P/C pop U | foul保留count；popup scorer U | foul不提交PA；popup U | foul可續；popup操作U |
| SO/BB/HBP | SO/BB有；HBP producer未找到 | 非BIP；HBP碰撞U | C接捕歸屬不完整 | Record三者欄位有，非producer證據 | SO/BB原count owner；HBP僅接收能力 | SO/BB可續；HBP U |

最接近閉環的既有路徑：

1. Ground／infield hit：原 infield family→Runner/Force/ThirdOut→原 canonical applier／action scorer→Record；新S2只允許其既定clean proof。
2. Flyout：現CF/RF catch計算→補原 defensivePlay 型別/attribution→同一PA/Record；LF共用擴充。不能再建立一個出局owner。
3. OF single：保留同Physical與責任，補必要拾球/保守回傳/終壘與hit/error裁定；現有generic single可提供簡化PA結果，但不冒充逐野手成功。
4. 2B/3B/HR：首版可沿原明示compressed classification與保守合法進壘；不必先做精密外野relay或越牆物理。若產品要求它們由真逐野手execution產生，再另列EXTEND。
5. E/FC/DP：重用舊正式內野鏈。S2 Recovery 必須先補既有Scorer proof，再由Mapper限定接收error及原held owner提交；不把ROE改single。
6. Tag-up：原HOLD能合法續行。未接SF/AB/RBI前，Alpha不提供SEND得分分支；不得已跑回得分後才忽略記錄。Foul不接殺、HBP不生成，也能形成合法簡化比賽。

完整逐結果六層敘述、來源及最近閉環路徑在 Evidence.outcomes。[S04–S20、S30]

## 6. Match／Game Record／Career Continuity

原 continuity 可保留：

正常Career/UI admission → 同一 player.highSchoolMatch → Player Detailed／AI Compressed／原有守備執行 → 原 canonical state → 原PA/defensivePlay/run事件 → 同一GameRecord → 原half/inning/order → 原gameEnd → finalizeRecord/exposure → MatchExperience → competition reassessment/history → Save/Load。

本輪兩個額外正常入口固定 seed=77001（既有Career harness，賽前skills=12、public sample=.62；沒有賽中挑球或改結果）：

| 位置 | 結果 | 實際守備與限制 |
|---|---|---|
| 1B | 107步完成、10:7、Record final同分數、Match/Record integrity=[] | 第7局incomingReceive，一次PO；8筆experience evidence。只是單一正常入口見證 |
| 3B | 144步完成、7:2、Record final同分數、兩項integrity=[] | 該場0個3B physical event；7筆experience evidence。不能拿整場完成當3B自然覆蓋 |

Canonical回歸另跑兩個預先固定seed各first/replay，共4場、50 checks；原late-SS-substitute fixture的defenseCreated/Completed均為0。它證明原Match/Record/Save/Career接續，**不證明玩家SS自然守備**。

新Same-Ball的pending/partial拒絕、NPC不領玩家SS成長、match-end唯一成長仍由原兩套正式CLI驗證。單個守備動作不直接永久加能力。接下來要補的是新增actor/event投影與角色evidence，不需要另造Career或Save schema。[S13、S21–S23]

## 7. Reuse／Extend／Adapt／Replace／Defer

成本是本輪相對工程範圍，不是天數承諾。完整現況、不足、直接依賴、成本與authority影響在Evidence.reuse。

| 模組 | 決策 | 直接依賴／最小工作與成本 | Authority／Alpha價值 |
|---|---|---|---|
| Pitch/Tactical/Plate Decision | REUSE | PitchSequencing/OPA/actual P；低；沿公開choices | 原PA owner；立即支撐打擊 |
| BattedBallPhysical | REUSE | actual pitch/contact；低；保留粗方向深度 | facts producer；不需精密座標 |
| Opportunity/Reach/Secure | EXTEND | Physical/Roster；中；補最低角色及LF/其他NPC admission | 共用facts→原applier；九位最低責任核心 |
| Legacy內野SS/2B/3B/1B | WRAP/ADAPT | Decision/Runner/Force/Scorer；中；小actor/mode接層 | 不複製每守位Match結算 |
| Fly/line defense | EXTEND | 原catch/Reach/mapper/Record；中；LF/CF/RF catch/single、actor ledger | 原defensivePlay投影；最高優先 |
| AI compressed PA | REUSE | batter/P與原applier；低 | 保留快速完整比賽；不得稱逐野手執行 |
| OutcomeMapping | WRAP/ADAPT | 已閉合facts；低至中；限定settled-defense-only分類 | 不能兼任Runner/Record；新ROE需有proof |
| Action Scorer／S2 Recovery | EXTEND | actions/ordinaryEffort/terminal；中 | 原Scorer持有規則；S2自然啟用才是Alpha前置 |
| Runner/Force/ThirdOut/applier | REUSE | 真timing/retirements；低接線 | 唯一canonical state，避免重寫 |
| Record/Experience/Save/Career | REUSE | 原official events；低至中映射 | 保留schema、防重與終場owner |
| Public presentation | WRAP/ADAPT | snapshot/cursor/choices/receipt；低至中 | 唯讀consumer＋原命令；Phaser最早接點 |
| generic positional result branch | LOCAL REPLACE CANDIDATE | resolveLegacyHighSchoolDefensivePlay；局部中 | 只在共用正式NPC路徑覆蓋後替換角色錯配的admission/selection；保留舊存檔 |
| 深Receiver/多次Recovery/精密物理/美術 | DEFER | 先有基本終端與公開接口 | 不得延後一顆已啟用卻無法閉合的活球 |

局部替換理由是generic ground-style分數被套用精確外野/P角色時的責任錯配、重複結果解釋與擴充成本；捕手另有專屬legacy handler，不與這個分支混算。這不是因原程式複雜就重寫。現有Recovery 8/4/2次純驗證重算也不是重新抽樣，不足以單獨構成重寫理由。

**架構紅線：每新增一守位，不應複製 PA／outs／bases／score／Record／growth 的整套提交。** 角色執行可不同；terminal facts、Scorer與原owner必須共用。

## 8. Phaser Integration Readiness

**選定結論：需先補一個明確的 Match 接口。** 不是等待全核心玩法完成，也不是現在就把離線原型稱為正式Phaser玩法。

| 檢查 | 實際判定 |
|---|---|
| Phaser真的執行？ | 本次檢查的index載入鏈、package與三個prototype入口沒有Phaser runtime。match-ui-p1明示離線、SVG、無Production/Save；manga兩原型沿用同fixture。[S25/S26] |
| 穩定唯讀Snapshot？ | 原score/bases/inning/currentBatter快照為frozen，依presented prefix讀取；不是全套公開play DTO。[S24] |
| pitch/contact/defense/settlement事件？ | 既有pitchHistory、Physical、defense events、PA/Record與lifecycle有facts；缺統一的公開allowlist/event drain，不必新建event authority。 |
| Decision API？ | public choices＋expectedMomentId→chooseHighSchoolYearOneMatchMoment；逐球prepare/resolve既有。Bridge必須以可見decision及原handler驗證，不能直接套傳入的Match。 |
| 位置資訊？ | 有九角色、target base、球的粗方向/深度、少數station與相對時序；無全場連續座標。首版可用純展示錨點，不能把Recovery局部station當全球座標。 |
| 玩家等待/模擬切換？ | lifecycle presented/decided/executing/closed、currentDomain與simulationPhase；現有原型只是自己的presentation state，需對接。[S29] |
| 需要Adapter？ | 是：公開Decision/Playback/Resolution深複本、visible sequence、原命令、stale epoch、既有receipt/eventRefs lookup。不能傳raw Match/整個simulationLog/私有能力、RNG、未來結果。 |
| 會取代Authority？ | 不應。選擇只進原owner一次；Skip/Replay只讀本球已提交facts；Continue才要求原流程續行；動畫碰撞/結束不決定safe/out。 |

最早時點：G2接口的第一條live batting／SS/2B往返完成後，就可以做受控Phaser切片並與G1剩餘回歸並行；完整Alpha放行仍要通過G1/G2。視角採打者/捕手近主視角、投手/其他野手另一主視角基礎；位置共用視角不共用決策語義。最終美術、漫畫分鏡動畫與精密球位另列P2。

## 9. Playable Alpha Minimum Scope

第一版以PC、目前Rules snapshot/局數、原Mixed Match與原Career為邊界：

- 一場可正常開始、選擇、換棒、得分、換邊、終場與存讀；同一Match/Record/賽後發展，重要事件有identity與來源。
- 玩家Detailed打擊；SS/2B既有守備選擇。其餘守位先以符合角色的最低NPC處理運作；G1補能力與actor終端缺口。
- 基本groundout、合理hit/extra-base/HR、BB/SO；error/force/DP使用既有已閉合範圍。允許多數NPC PA採Compressed，不偽造逐野手動作。
- 至少文字＋粗2D結果、合法choices、等待/模擬/結果清楚；重播與略過不得重交或領成長。

候選比較：

| 玩家範圍 | 現況／接入成本 | 決策 |
|---|---|---|
| Batting＋SS/2B | 有公開API、正式settlement與現有presentation基礎；仍需bridge/操作驗收 | 第一版主要候選 |
| 加1B | 3U/3-1主動與自動receive已有，單場正常入場PO證明；畫面/角色evidence低至中成本 | 最有理由納入比較，不能把自動接傳算多一個玩家決策 |
| 加3B | 5-3/5-4-3已有；單場正常例沒有主責球，需要有限入場證明 | 低成本後續候選，不要求重建 |
| 加C | legacy公開handler與Record有；same-ball/active development仍不足 | 在內野之後比較 |
| 加P或三外野玩家 | P入場deferred、OF player catch排除 | 延後，不妨礙NPC角色補齊 |

可延後項目與合法替代必須在事件開始前選定：

| 延後 | 首版合法處理 |
|---|---|
| 全守位玩家微操 | 其他守位由G1明示NPC policy處理，保留真正角色/能力/terminal |
| 精密球場/relay/越牆物理 | 原compressed hit/extra-base/HR與保守進壘；只呈現它確實擁有的facts |
| 深S2 Recovery | Alpha維持原mode-off，不admit新S2 pending policy；舊已閉合error仍可用 |
| SF/SEND深度 | 原tagUpHoldThird/retouch；未提供得分分支就不需要假SF；要開SEND須先補記錄 |
| HBP/可接殺foul-popup | 不生成HBP；普通foul dead-ball/count續行，不生成無handler的popup catch |
| 完整美術/漫畫動畫 | 文字/靜態或粗2D錨點；不參與結果計算 |

**不能延後：** 已admit活球的合法終壘/出局/得分、九NPC最低責任、正式記錄、下一PA、三出局/終場、原賽後與基本輸入。沒有合法替代的項目不能寫成DEFER。

## 10. P0／P1／P2 Priority

每項的名稱、現況、最小施工、直接依賴、core owner影響、程式接點、驗收、coverage、風險均另有完整JSON欄位。

| ID／優先級 | 現況→最小施工／接點 | 依賴／Owner影響 | 正式或玩家可見驗收／Coverage | 主要風險 |
|---|---|---|---|---|
| P0-01 NPC Basic/OF closure | LF C1、C/CF/RF C2；補LF、OF single、CF/RF PO、C最低接捕/K-PO；Opportunity/Fly/script producer | 原Reach/Runner/Scorer；保留canonical/Record schema；純API不足只擴原Scorer | 九角色真actor/能力/terminal；OF接殺者PO＋single後下一PA；全場可續 | AI generic結果不能冒充野手執行 |
| P0-02 Natural mixed loop | 原完整模式可用；鎖PA模式、接續與checkpoint；prepare/advance/appliers | P0-01/lifecycle/save；不重寫owner | public開始至終場、不同選擇/能力影響、PA唯一、第三出局/存讀正確 | 失敗後切模式會產第二權威 |
| P0-03 Public bridge | Snapshot/choices已有；補live allowlist＋command/event drain | 原visible prefix/handler；薄adapter | 真選擇→原結算→畫面→下一球；skip/replay/連按不重交 | future/private leakage與UI回寫 |
| P0-04 PC playable slice | 原HTML可用、Phaser未接；batting/SS/2B可操作到賽後 | P0-02/03；Alpha放行須01；UI consumer施工 | 完整可玩一場、原Record/成長/Save，約10人可測版本 | 動畫結束不能結算 |
| P1-01 S2 Scorer/ROE | 五runner closed、PA=0；補proof→Mapper error→held owner | 原Scorer/Recovery/Runner；需精確擴原分類與接點 | 真ROE/H/E/PA/BF唯一＋next PA/save | **若自然啟用新S2則升P0** |
| P1-02 玩家1B/3B | 已C3；接既有UI/evidence、確認有限正常入場 | bridge/原infield；無新owner | 可見3U/3-1/receive、5-3/5U/5-4-3正確記錄 | rare lane/自動stage不能灌決策數 |
| P1-03 Line/FC/SF/tag-up | 有部分鏈；補角色/actor/SF分類 | 原catch/Runner/Scorer/Record mapping | retouch/得分/AB/RBI/third-out一致 | SEND啟用時，SF記錄缺口不可延後 |
| P1-04 玩家C/OF/P | C legacy C3、OF/P C1；位置專屬入場/決策 | NPC穩定/bridge/exposure；另案定界 | 真能力/選擇改執行，該角色評價可回比賽 | generic role文字不足 |
| P2-01 深Recovery | target1B一次；二壘attempt仍pending | P1-01或獨立完整舊鏈 | 新terminal可續行 | 已啟用的unresolved不能放著 |
| P2-02 物理/美術/分鏡 | 粗球型/離線節奏已有 | bridge/PC slice；presentation純讀 | 改善讀取/節奏不改結果 | 畫面座標不可回寫authority |
| P2-03 HBP/popup/進階規則 | 有Record欄位、producer不足 | 原pitch/Physical/Record另案 | producer→runner→record完整新增事件 | 不能只因欄位存在而開放 |

與先前順序相比，**先把已能玩的原模式補到最低完整coverage，不把S2單線深挖當整個Alpha的唯一通道**。S2未閉合不得自然放行，但可在原模式維持關閉；現有成功球也不能在未來失敗時事後fallback。

## 11. Next Three Gameplay Sprint Proposals

### G1 — NPC Basic Coverage & Outfield Flyout/Single Closure

依賴：原owners；本Gate完成。範圍僅九角色最低責任與已實測OF斷點：保留內野/cover，補LF catch、CF/RF原defensivePlay PO、OF single合法拾球/保守回傳/終壘、C最低接捕/本壘責任。共用Scorer/Runner/Record，不做九套settlement，不做玩家全守位與深S2。

**結束條件：** 正常比賽可看到追溯到真守備員/能力的外野接殺與落地安打，出局/壘包/PO/H/E正確後進下一PA；九位置各有適用責任的成功與必要失敗證據，完整一場不因這些事件卡住。不是只完成幾個API。

### G2 — Natural Mixed Match Loop & Live Public Bridge

依賴：G1基本事件。保留原Detailed batting＋Compressed其他PA＋SS/2B既有玩法；明示admission policy及原owner，完成公開allowlist、可見事件游標、命令與stale/duplicate接點。新S2 policy仍不自然開啟。

**結束條件：** 原HTML測試面實際從正常入口走到終場；玩家不同打擊/守備選擇與能力可改執行，結果可見且能接下一球；occupied bases、第三出局、比分、打序、Save/Load/Replay/賽後成長一致。必須交付live玩家回合與完整比賽，不只DTO/Contract。

### G3 — Phaser Batting / SS / 2B PC Playable Alpha

依賴：G2接口；完整Alpha放行須G1/G2。HTML/CSS＋Phaser只作consumer，先batting/SS/2B，1B/3B列低成本擴充候選；保留兩種主視角方向但各位置決策不同。無最終美術或新玩法owner。

**結束條件：** 玩家可用鍵鼠正常開始並完成一場，看正式GameRecord/原Career評價與成長，能存讀/重播；交付約10人可照做的測試版本及情境腳本。需瀏覽器人工操作/閱讀驗收，不能用VM等同真人體驗。G2接口第一條往返可用後即可先做小切片，不必等全守位玩家操作。

S2 recovered-reach Scorer/ROE 作P1後續有界工作；若產品改要求這三個Sprint內自然啟用新S2，先將P1-01升P0並重定scope，不能偷偷把未閉合case排除或改抽結果。

## 12. Source Evidence／Runtime／Tests

| ID | 本輪既有CLI | 實際結果 |
|---|---|---|
| T01 | node tests/match-vnext-same-ball-execution-contract-test.cjs | exit0／PASS；source94、script-lock拒絕13、candidate拒絕32，另含S2/Recovery組；首輪stdout過大在工具顯示截斷，未偽稱完整raw已保存 |
| T02 | node tests/match-vnext-same-ball-production-integration-test.cjs | exit0／PASS；原S1/S2/Recovery production groups |
| T03 | node tests/defensive-opportunity-production-integration-test.js | exit0；14/14 PASS |
| T04 | node tests/defensive-reach-secure-production-integration-test.js | exit0；12/12 PASS |
| T05 | node tests/canonical-match-regression-integration-test.cjs | 最終exit0；50 PASS checks，兩固定seed各fresh/replay共4場 |
| T06 | node tests/bbp-b2b2-tag-up-decision-execution-test.js | exit0；21/21 PASS，含原1.3 timing |

T05第一次外層觀察器maxBuffer=8MB，因suite輸出大型Evidence而ENOBUFS/SIGTERM；沒有算測試成功。改成stream收集後原檔未改、exit0；50個checks PASS。其後摘要解析器因大型JSON行後尚有其他文字而parseError，屬觀察器摘要問題，保留原檢查文字、bytes/hash與exit；不靠那個解析錯誤製造測試PASS，也不再為格式問題重跑。

唯讀Runtime Probe在原index載入的隔離VM中，以未修改的first-base測試fixture setup建立明示controlled inputs。沒有改原測試檔/Production/公式/輸出結果；public choose為原handler；storage/timer只在VM記憶體。補probe針對3B/NPC角色與疑似缺PO；另兩場預先固定正常Career入口。I1–I9/A1–A3/V1–V3的輸入、公開route、實際actor actions、Record與integrity結果及可重跑inline program在JSON。I3初次route查詢誤用throwFirst，修正查原公開routeId=secureFirstBaseOut後成功；沒有改Production route。早期PowerShell文字編碼與空壘已自動routine的probe設定錯誤也保留歷史，不算玩法失敗或natural evidence。

沒有執行全庫測試、Monte Carlo、1B原400場／3B原200場cohort或protected tests。沒有新增測試檔。Double/Triple/HR、部分FC/error與所有C4/C5不因檔名或source存在就標fresh PASS。

主要Source anchors（精確行號、函式、hash另見JSON.sourceReferences／scopedManifest）：

- S01–S03：team-roster-foundation.js；defensive-opportunity-foundation.js:39/60/133；script.js:4954/4972/6539。
- S04/S05：script.js:6908/6994；ai-plate-appearance-outcome.js:33。Compressed只讀batter/P的實際證據。
- S06/S07：offensive-plate-approach.js:444/507/671；script.js:10616/10901/10941；plate-decision-foundation.js:39/85。
- S08–S10：script.js:5003/5040/8203/11887/12060/12191/12533/12699；原各角色execution與共同settlement。
- S11–S14：batted-ball-fly-ball-defense.js:63；script.js:5530/5549；match-game-record.js:237/312；batted-ball-line-drive-defense.js:73。
- S15/S16：script.js:10189/12820/5649/5777；batted-ball-tag-up-execution.js:39。
- S17–S20：defensive-decision-throw-foundation.js:271/325/362/491；defensive-reach-secure-foundation.js:162；defensive-runner-throw-settlement-foundation.js:15/23/219；match-vnext-same-ball-execution-adapter.js:17；batted-ball-outcome-mapping.js:35。
- S21–S24：script.js:13346/13820/4377/4416；match-experience-development.js:238/300/581；save.js:22/645。
- S25–S30：prototype/match-ui-p1/app.js:103及README；playing-time-game-exposure.js:93/288；script.js:13765/13900；match-situation-lifecycle.js:90/199；batted-ball-physical.js:105。
- Accepted history：Sprint1報告第9–16節、Sprint2第25–32節及Evidence.coreRecovery；UI原型README與match-ui-slice-data-contract報告。

## 13. Unknowns／Limitations

- 未驗證九位主要自然情境頻率、全角色完整C4/C5、10人真人操作、Phaser瀏覽器接線；本輪不施工來補表格。
- NPC C已有來源/受控execution，但全最低接捕/PO/本壘歸屬未證明；LF執行是明確unsupported，CF/RF則是已實測ledger缺口。不能統一說其餘七位不存在。
- 原Compressed能提交2B/3B/HR，不代表真外野execution支持那些結果。首版若要逐野手因果需G1；若明示compressed則維持相容舊結果，不能編造動作。
- 原1B測試有400場、3B測試有200場normal-entry cohort，但本輪未執行；也不採受保護歷史Evidence內容。正常3B一場無physical work，不推算機率。
- SF/AB/RBI、HBP producer、完整foul-popup、玩家OF與P入場等皆有限或UNVERIFIED；DEFER必須有第9節的合法事前處理。
- 新S2 Recovery僅target1B有限region／CRT時基／一次補救；其位置不是全場座標，係數不是實測統計。新ROE與二壘terminal缺口維持。
- graph/skill未使用；方法已由使用者明確例外授權。來源負面判斷限本次正式入口/模組，未宣稱全庫絕無其他原型。
- 本輪所有建議都是下一輪scope，不包含對Gameplay/Scorer/Mapper/UI/freeze/Save的新施工授權。

## 14. Git／WIP／Protected Integrity

交付前精確核對：125份相關既存來源hash零差異；其中9份關鍵來源開工前即與最新accepted finalSource相符，測試後仍相同。109份依賴/報告及另16份來源各有獨立捕捉時間；不是全庫逐檔保證。12份Protected metadata零差異。Git status digest、HEAD/main/local origin/main、index與staged均吻合初始基線。

交付後實測PASS，寫於Evidence.integrity.final：新增恰為本兩份報告，原status移除這兩行後與開工digest完全相同；19 tracked WIP保留，untracked實際1,221（原1,219＋2）。125份來源與12份Protected metadata比對皆無差異。未宣稱所有Codex內部refs不變；本輪沒有執行任何Git寫入命令。

本輪未Reset/Restore/Clean/Stash、未切分支、未Stage/Commit/Push；無自動修復失敗。兩個文件以外不產生artifact或暫存runner。

## 15. Final Go／No-Go Recommendation

- **GO：採用本Gate與G1優先順序。** 現有Match已足以重用為完整比賽骨架；真正短板是最低NPC責任/外野正式歸屬及live公開接面，不是再新增一輪泛用Foundation。
- **GO（前置接口）：Phaser受控小切片。** G2第一條公開live往返可用即可開始；不等全守位玩家玩法與美術。
- **NO-GO：現在宣稱完整PC Alpha可交約10位測試者。** 先完成P0-01–04的玩家可見/正式全場成果。
- **NO-GO：自然開放新S2 Same-Ball或把Recovery facts當ROE/PA成功。** 需要那條路徑時，補原Scorer/Mapper/held-owner閉環。
- **STOP：本輪只交兩份報告。** 不開始G1/G2/G3或S2施工，等待下一輪選定範圍。


