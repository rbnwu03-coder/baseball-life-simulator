# 正式比賽契約與未解缺口

查核來源為 [WBSC 2025–2026 Official Rules of Baseball](https://static.wbsc.org/uploads/federations/279/documents/86c3561b-d78f-2a72-9194-efaddcff2ec0.pdf)。規則索引：6.45（短打排除於內野高飛必死）、7.6（換人）、7.7（局數與結束）、9.1／9.3（打序／DH）、9.10／10.2.2（第三好球、打者成為跑者）、10.8（第三出局與得分）、16–18（記錄）。賽事附錄不自動套入本專案。

| 項目 | 目前正式程式契約／依據 | 驗收限制 |
|---|---|---|
| 正規局數 | `competition-rules.js` 三種預設 ruleset 為七局；舊 captured rules 可保留原局數；不是從 MLB 預設九局 | 這是專案契約，不宣稱為某真實高中聯賽章程 |
| 主客 | `MatchContextFoundation`；legacy 高一 player home，明確 context 可安排客場／中立；本輪兩隊身份由 ID 核對 | 其他主客入口未完整跑完 |
| 打序／DH | active defense 九人 P/C/1B/2B/3B/SS/LF/CF/RF，九棒循環，投手列打序；目前沒有 DH 模式 | 不套用 WBSC 可選 DH；需要賽事特例時另立契約 |
| 換人 | `shouldEnterHighSchoolMatchPlayer`／`insertPlayerIntoHighSchoolMatchLineup`：正式安排允許，輪到原同守位者棒次才入場，替掉 incumbent，名單保持九位 | 本輪實際 SS 5 下入場；未驗所有 pinchHit／防守換人分支或再次入場 |
| 終場 | `shouldEndHighSchoolMatchAfterHalf`／`isHighSchoolMatchWalkOff`：七局起，上半三出局主隊領先即結束；下半主隊超前即再見；完整下半比分不等即終場 | 普通客隊勝的七局已觀察；省略下半／再見需獨立頁面案例 |
| 平手／延長 | 平手不在七局結束。正式賽／友誼／developmentMatch 啟用第八局起二壘跑者，來自上一打序槽；ER 視同失誤上壘。trainingCamp／legacy 不啟用；來源 `CompetitionRules` | 二壘單一跑者是專案規則，不能冒稱 WBSC 某賽事突破僵局；沒有延長上限或平手終止契約 |
| 提前結束 | 未配置 mercy、天候、宵禁、棄權等正常結束 owner | blocker 只是播放停止，不是合法提前終場 |
| 投手玩家 | `PlayingTimeGameExposure` 明確 deferred → noAppearance；無玩家 PA／BF／守備或投球曝光。NPC P 仍取防守隊正式名單 | 本輪 P 兩場與年末已實際操作，來源版本分列 |
| 逐球／壓縮 | 玩家打席 `plateDecision` 逐球；一般 NPC／低密度打席走明列的 compressed PA；正式 NPC bunt 走原 bunt pitch／handoff | 不得用 compressed PA 取代已形成的短打。壓縮記錄不是逐球 catch／touch 證據 |
| 存讀 | 正式 Save 准入與 player snapshot；match 既有安排鎖定；讀取不重抽已完成事實 | 同步 resolver 內沒有額外發明停點；自動播放中只能使用真實可按的儲存位置 |

下列缺口需要完成契約後再施工，不任填球結果：

**G1：短打 continuation owner 不完整（正式可達阻塞，已實際證實）。** `deriveNpcGroundResponsibility` 只支援 hard/secondBaseSide，且目前 NPC adapter 限捕手視角；玩家二壘 handoff 也沒有涵蓋所有落點／pop。最終捕手實際在 soft/pitcherArea 阻塞，SS 替補在 popBunt 阻塞；17 案只一種完成。

最小方案是建立同球 `BuntContinuationPhysicalV1` owner，輸入原 PA／pitch／handoff identity、原球型／pace／placement、正式 active roster 與 runner physical states。地面短打責任表為 firstBaseSide→1B（必要時 P 補位）、pitcherArea→P、secondBaseSide→2B、thirdBaseSide→3B，接球與觸壘分開保留 actor／時間。沿用已有能力與執行階段前，先驗證其位置／單位相容，不能把 2B 時間窗口硬套給 P 或 1B。缺少時間／空間資料由這個 owner 補充一次、綁定原 source，Save 保留 receipt；不另抽 PA。

`popBunt` 原生成器只有球型、pace=null、placement=null，現有一般 fly-ball owner 只承接中深外野球，沒有可直接接用的內野短打飛行契約。最小新增資料是接觸原點、落點／責任區、首次觸球／落地／穩定控球時間與 runner 回壘狀態。先產生並保存 trajectory，再由實際野手 reach／secure 決定接住或落地；接殺後解除打者封殺鏈並依回壘事實續行，落地則承接同一打者跑者。短打禁止套 infield fly。採樣範圍與時間模型目前沒有專案依據，本輪沒有擅訂數值或機率；這是要確認／實作的新契約部分。

完成 G1 的准入條件：17 種來源各有合法 PA 完成路徑；空壘、一壘、滿壘、兩出局均驗；原 source 不變；傳球、接球、觸壘／觸殺均有事實；第三出局、得分及 A/PO 符合 actor；同球 pending／committed 存讀及重複續行各一次 refs；再回捕手兩場與內野完整場。

**G2：未捕第三好球的正式續行契約不足（source gap，瀏覽器邊界 NOT_RUN）。** `resolveHighSchoolThirdStrikeCatch` 在實際 catch execution 未完成時直接拒絕，尚未提供完整打者跑者續行。最小方案保留本球三振事實，另依一壘與出局數決定是否成為跑者，再交接同球控球／傳接／一壘結果；K、PA、實際 out 與上壘分開。不能以「三振必然出局」填補，亦不捏造 WP/PB 普通努力判定。

**G3：壓縮打席與部分既有 scorer 的證據精度不足。** 本輪 R/H/E、個人 PA/BF/SO、逐局與 refs 代數相符，但 compressed out／hit 不提供每球 catch／touch／普通努力／犧牲／野選證據。NPC 短打的傳接動作可核對，單純未完成出局直接記 single 的 scorer 仍缺少所有情況的普通努力判定。最小方案由實際執行 owner 提供 scorer input 與可追溯理由，交記錄 owner 分類一次；資料不足明列 unknown／契約缺口，不改事件湊統計。新增 scorer 政策須獨立評審。

短打 pending 畫面目前透過 public bridge 的 B/S 為 unavailable，顯示「—」而不是捏造 0；完整 bunt count 公開投影仍須隨 G1 補上。P 的 pitches 欄位為 null（尚未提供逐球計數）；零投球曝光由未入場、BF=0、無玩家投球事件與正式 NPC P actor 核對，不把 null 改寫成數字 0。

**G4：尚未驗到的邊界。** 一般兩好界外、兩好觸擊界外、界外接殺／擦棒被捕，跑者第三出局造成未完成 PA 的下一棒政策，封殺解除、回壘、時間性第三出局的得分，省略最後下半／再見／延長與安全重複終場按鈕，均不能以本輪普通七局／Node 結果代替。重跑清單保留 NOT_RUN。

本輪依 AGENTS.md 讀取 codebase-memory skill。session 沒有 list_projects／index_status／check_index_coverage 等圖譜工具，採限定 source／rg fallback，沒有聲稱圖譜 exhaustive 或所有守位完整影響分析。
