const C = (text, effects, flags, memory, extra = {}) => ({ text, effects, flags, memory, ...extra });

const chapterOneEvents = {
  day1_morning: {
    title: "球場邊的夏天",
    text() {
      const thought = player.origin === "understand"
        ? "你看不懂為什麼每個守備員站得不一樣，卻很想把答案找出來。"
        : player.origin === "belong"
          ? "場上的孩子互相喊著名字。比起球本身，你先注意到他們像是知道彼此會在哪裡。"
          : "每次有人完成漂亮守備，場邊就會響起掌聲。你忍不住想像，有一天那個聲音會不會是給你的。";
      return `十歲那年的暑假，家人問你要不要去附近看看少棒隊練習。紅土被太陽曬得發亮。\n\n${thought}\n\n你還不知道自己是不是喜歡棒球，只知道目光一直跟著那顆球走。`;
    },
    choices: [
      C("站到最前面看他們接球", { observe: 1, confidence: 1 }, ["watched_close"], "你第一次站得離球場那麼近。"),
      C("躲在家人後面仔細看", { observe: 2, confidence: -1, pressure: 1 }, ["hesitant"], "你沒有靠近，卻記住了每個人的腳步。"),
      C("問家人：我也能試試看嗎？", { confidence: 2, familySupport: 1 }, ["asked_family"], "你第一次把想打棒球的念頭說出口。")
    ]
  },
  day1_afternoon: {
    title: "第一顆滾來的球",
    text: "一顆傳偏的球滾到你腳邊。練習中的孩子朝你招手，教練也看了過來。球明明很輕，你卻覺得所有人的目光都有重量。",
    choices: [
      C("撿起來，直接傳回去", { ballSense: 1, confidence: 1, instinct: 1 }, ["threw_back"], "你把球傳了回去，方向不完美，但沒有逃開。"),
      C("先模仿他們的動作再傳", { observe: 2, ballSense: 1 }, ["imitates"], "你照著剛才看見的姿勢，把球送回場內。"),
      C("請家人幫忙撿球", { familySupport: 1, confidence: -1, pressure: 1 }, ["relied_family"], "家人替你解了圍，你卻一直記得那一刻。")
    ]
  },
  day2_morning: {
    title: "球場、電視或公園",
    text: "第二天早上，你還在想昨天那顆球。今天沒有人替你決定，你得自己選擇怎麼靠近棒球。",
    choices: [
      C("再去球場看少棒隊", { observe: 1, confidence: 1, coachAttention: 1 }, ["returned_ballpark"], "你又回到球場，教練似乎認出了你。"),
      C("留在家裡把比賽看完", { observe: 2, familySupport: 1 }, ["watched_tv"], "你開始發現守備站位會隨打者改變。"),
      C("去公園找人玩球", { ballSense: 1, fitness: 1, instinct: 1 }, ["park_ball"], "在沒有規矩的公園裡，你用身體認識棒球。")
    ]
  },
  day2_afternoon: {
    title: "第一次被看見",
    text: "球場邊的孩子問：『你也想打嗎？』教練沒有催你，只在旁邊等你的回答。",
    choices: [
      C("承認自己很想試試看", { confidence: 2, coachAttention: 1 }, ["admitted_interest"], "你承認了自己的期待，也接受可能出糗。"),
      C("說還想再觀察幾天", { observe: 2, confidence: -1 }, ["slow_warm"], "你沒有拒絕，只是需要更多時間理解這裡。"),
      C("先問旁邊的孩子怎麼加入", { observe: 1, confidence: 1, coachAttention: 1 }, ["asked_teammate"], "你從同齡孩子那裡找到靠近球隊的方法。")
    ]
  },
  day3_morning: {
    title: "傳接球的距離",
    text: "有人把手套借給你。球從幾公尺外飛來時，你才發現『看懂』和『接住』是兩回事。",
    choices: [
      C("先靠反應把球擋下來", { ballSense: 2, instinct: 1, pressure: 1 }, ["raw_catcher"], "球撞進手套又彈出，你還是追上去撿了回來。"),
      C("注意腳步和手套位置", { observe: 2, ballSense: 1 }, ["fundamental_focus"], "你把動作拆開，一次只修正一個地方。"),
      C("漏接也繼續要求再一球", { resilience: 2, fitness: 1 }, ["kept_retrying"], "你漏了好幾球，卻沒有說要停。")
    ]
  },
  day3_afternoon: {
    title: "旁邊的小孩笑了",
    text: "你又漏了一球。旁邊傳來一聲笑，不一定有惡意，卻讓你的耳朵一下子熱了起來。",
    choices: [
      C("假裝沒聽見，準備下一球", { resilience: 2, confidence: 1 }, ["ignored_laugh"], "你把目光留在下一顆球上。"),
      C("停下來想剛才為什麼漏接", { observe: 2, resilience: 1 }, ["analyzed_failure"], "你把難堪變成一個可以回答的問題。"),
      C("先退到家人身邊休息", { pressure: 2, confidence: -1, familySupport: 1 }, ["backed_off"], "你暫時退開，家人沒有責怪你。")
    ]
  },
  day4_morning: {
    title: "被比較的一天",
    text: "一個和你差不多年紀的孩子接得又快又穩。你第一次清楚看見：喜歡棒球，不代表你會比別人厲害。",
    choices: [
      C("觀察他哪裡做得比你好", { observe: 2, resilience: 1 }, ["learned_from_peer"], "你把比較變成學習的線索。"),
      C("主動排到他後面，想證明自己", { confidence: 2, ballSense: 1, pressure: 1 }, ["prove_self"], "你沒有躲開那個比你強的人。"),
      C("去公園找回自由玩球的感覺", { instinct: 2, ballSense: 1 }, ["chose_free_play"], "你在沒有比較的地方，重新想起棒球的快樂。")
    ]
  },
  day4_afternoon: {
    title: "家人的態度",
    text: "回家路上，家人問你：『如果真的加入球隊，就要固定練習。你還想去嗎？』",
    choices: [
      C("說自己願意認真試一段時間", { familySupport: 2, confidence: 1 }, ["family_promise"], "你和家人做了一個還很小、卻認真的約定。"),
      C("坦白自己還不確定", { familySupport: 1, observe: 1 }, ["uncertain_but_curious"], "你沒有逞強，家人也願意讓你慢慢決定。"),
      C("說自己比較喜歡在公園玩", { instinct: 1, resilience: 1, familySupport: -1 }, ["independent_play"], "你選擇了自己的玩球方式。")
    ]
  },
  day5_morning: {
    title: "教練的第一句話",
    text: "教練把一顆球放進你手裡：『不用證明你很厲害，先讓我看看你怎麼學。』",
    choices: [
      C("照他的示範慢慢重做", { observe: 1, ballSense: 1, coachAttention: 2 }, ["coach_trial_observe"], "教練注意到你願意修正動作。"),
      C("照自己的感覺快速完成", { instinct: 2, ballSense: 1, coachAttention: 1 }, ["coach_trial_instinct"], "你的動作很生，但身體反應讓教練多看了一眼。"),
      C("請教練再示範一次", { observe: 1, pressure: 1, coachAttention: 1 }, ["asked_demo"], "你承認自己沒看懂，並要求再學一次。")
    ]
  },
  day5_afternoon: {
    title: "隊友或自己",
    text: "練習結束後，有人邀你一起收球，也有人留在場邊加練。你只能選一邊。",
    choices: [
      C("和大家一起收球聊天", { confidence: 1, ballSense: 1, resilience: 1 }, ["joined_kids"], "你開始記住幾個隊友的名字。"),
      C("觀察大家各自擅長什麼", { observe: 2, coachAttention: 1 }, ["scouted_kids"], "你在隊伍裡尋找自己可能的位置。"),
      C("留下來獨自多做幾次", { fitness: 2, instinct: 1, pressure: 1 }, ["solo_grind"], "你想靠多做幾次縮短和別人的距離。")
    ]
  },
  day6_morning: {
    title: "小型練習賽",
    text: "教練讓你們分隊做短短的練習。這不是正式比賽，但第一次有人會記得你的結果。",
    choices: [
      C("主動站進場內", { confidence: 2, coachAttention: 1, pressure: 1 }, ["played_scrimmage"], "你在緊張中站進了場內。"),
      C("先在旁邊研究每個人的站位", { observe: 2, coachAttention: 1 }, ["scrimmage_observer"], "你從場邊看見了比賽的秩序。"),
      C("回公園用自己的方式玩球", { instinct: 2, ballSense: 1, pressure: -1 }, ["park_over_scrimmage"], "你暫時離開制度，卻沒有離開棒球。")
    ]
  },
  day6_afternoon: {
    title: "一顆關鍵球",
    text: "一顆不規則彈跳的滾地球朝你過來。它不會決定勝負，卻可能決定你怎麼記住今天。",
    choices: [
      C("往前迎球，搶在彈跳前處理", { ballSense: 2, confidence: 1, pressure: 1 }, ["attacked_ball"], "你向球迎了上去，不再只是等待。"),
      C("先讀彈跳，再移動腳步", { observe: 2, ballSense: 1 }, ["read_bounce"], "你看清彈跳，用判斷補足反應。"),
      C("用身體擋住，不讓球過去", { resilience: 2, instinct: 1 }, ["body_block"], "球打在身上有點痛，但你把它留在面前。")
    ]
  },
  day7_morning: {
    title: "最後一天的問題",
    text: "教練問你：『這一週過後，你想怎麼繼續？』這次沒有人能替你回答。",
    choices: [
      C("主動問能不能加入球隊", { confidence: 2, coachAttention: 2 }, ["wants_team", "asked_to_join"], "你親口向教練爭取加入球隊。"),
      C("問教練自己最該先學什麼", { observe: 2, coachAttention: 2 }, ["wants_team", "asked_good_question"], "你用一個問題表達了留下來的意願。"),
      C("說想繼續在公園自由玩球", { instinct: 2, ballSense: 1 }, ["wants_free_baseball"], "你選擇繼續靠近棒球，但不急著進入球隊。")
    ]
  },
  day7_afternoon: {
    title: "第一週的答案",
    text: "夕陽落在紅土上。你沒有突然成為厲害的球員，但這七天留下的每一個選擇，已經讓你和第一天不太一樣。",
    choices: [
      C("把這一週記在心裡", { resilience: 1 }, ["finished_first_week"], "你記住了自己第一次真正靠近棒球的夏天。", { finishChapterOne: true })
    ]
  },
  ending: {
    title: "第一章小結：你靠近棒球的方式",
    text() { return `${player.ending}\n\n${player.endingDetail}\n\n這一週沒有決定你會不會成為職棒球員，卻決定了你第一次靠近棒球的姿態。`; },
    choices: [
      { text: "進入第二章：少棒入門", nextChapter: "chapter2" },
      { text: "以另一種方式重新開始", restart: true }
    ]
  }
};

const chapterTwoEvents = {
  chapter2_intro: {
    title: "少棒隊的第一天",
    text() {
      const intros = {
        "主動入隊": "你是自己走到教練面前的孩子。教練記得你爭取機會的眼神。",
        "觀察型入隊": "你不是最吵、最衝的孩子，但教練記得你問過的問題。",
        "公園野球": "你習慣在公園自由玩球。現在，棒球第一次有了隊形與規矩。",
        "看球分析型": "你看懂不少細節，但今天必須把理解變成身體動作。",
        "暫時退開": "你曾經退開，這一次家人只陪你再來看看，沒有催促。"
      };
      return `${intros[player.chapterOneEnding] || "你還不確定自己是哪種孩子，但你又回到了球場。"}\n\n教練把球放進你手裡：『先讓我看看你怎麼接球、怎麼丟球、怎麼面對失誤。』`;
    },
    choices: [
      C("認真照基本動作做", { observe: 1, ballSense: 1, coachAttention: 1 }, ["chapter2_basic_training"], "你開始接受正式訓練。", { skillEffects: { catching: 1, baseballIQ: 1 } }),
      C("先照自己的感覺接球", { instinct: 1, ballSense: 2, pressure: 1 }, ["chapter2_raw_style"], "教練看得出你有球感，也看得出動作還很生。", { skillEffects: { catching: 1, throwing: 1 } }),
      C("先看其他人怎麼做", { observe: 2, confidence: -1, pressure: 1 }, ["chapter2_watch_first"], "你先觀察其他孩子的動作。", { skillEffects: { baseballIQ: 2 } })
    ]
  },
  chapter2_day1_training: {
    title: "第一天：手套先接住球",
    text: "球來、接住、踩穩、傳回去。看起來簡單，但每一次球進手套，你都感覺自己的身體慢了半拍。",
    choices: [
      C("先把球確實接進手套", { ballSense: 1, observe: 1 }, ["chapter2_catching_focus"], "你選擇先穩住基本功。", { skillEffects: { catching: 2, baseballIQ: 1 } }),
      C("接到球後立刻傳回去", { instinct: 1, pressure: 1 }, ["chapter2_throw_fast"], "你的動作有點亂，但不怕出手。", { skillEffects: { throwing: 2, catching: 1 } }),
      C("觀察前面的人再輪到自己", { observe: 2, confidence: -1 }, ["chapter2_watch_line", "怕失誤"], "你記住了別人的腳步與節奏，也暫時把表現壓力留到下一輪。", { skillEffects: { catching: 1, baseballIQ: 2 } })
    ]
  },
  chapter2_team_breath: {
    title: "練習結束後，大家還沒有回家",
    text() {
      const echo = hasFlag("joined_kids") ? "有人記得你曾經主動留下來收球，順手把球袋的一端交給你。" : hasFlag("hesitant") || hasFlag("backed_off") ? "你站在器材室門口，一時不知道自己算不算已經是這支隊伍的人。" : "孩子們一邊收球一邊談學校和晚餐，棒球暫時不再是測驗。";
      return `${echo}\n\n沒有教練評分，也沒有能力測驗。你只需要決定，練習之外要怎麼留在隊伍裡。`;
    },
    choices: [
      C("一起收球，記住每個人的名字", { responsibility: 1 }, ["chapter2_joined_cleanup"], "你第一次在沒有比賽的時候，感覺自己像隊伍的一員。", { relationshipEffects: { teammateBond: 2 } }),
      C("留在旁邊整理今天犯過的錯", { observe: 1, pressure: -1 }, ["chapter2_processed_training"], "你讓練習慢慢沉澱，而不是立刻追求下一次進步。", { skillEffects: { baseballIQ: 1 } }),
      C("先回家，把第一天說給家人聽", { familySupport: 1, pressure: -1 }, ["chapter2_shared_first_day"], "家人沒有替你分析，只聽你把第一次正式訓練說完。")
    ]
  },
  chapter2_day2_correction: {
    title: "第二天：教練修正你的動作",
    text() {
      const extra = hasFlag("chapter2_raw_style") ? "教練提醒你：『有球感很好，但不能每球都只靠反應。』" : hasFlag("chapter2_watch_first") ? "教練說：『看懂之後，身體也要跟上。』" : "教練點點頭：『願意照基本動作做，是好事。』";
      return `教練不斷重複：『腳先到，手套才會到。』\n\n${extra}\n\n正式訓練最難的不是累，而是每個錯誤都會被看見。`;
    },
    choices: [
      C("照教練說的重新做十次", { resilience: 2, coachAttention: 1, pressure: 1 }, ["chapter2_accept_correction"], "你沒有逃避修正。", { skillEffects: { catching: 2, throwing: 1 } }),
      C("問教練：我是哪裡慢了？", { observe: 2, coachAttention: 1 }, ["chapter2_asked_correction"], "你把錯誤變成了問題。", { skillEffects: { baseballIQ: 2, catching: 1 } }),
      C("想用下一球證明自己", { confidence: 1, instinct: 1, pressure: 2 }, ["chapter2_prove_after_correction"], "球傳得很快，方向卻差了一點。", { skillEffects: { throwing: 2 } })
    ]
  },
  chapter2_batting_intro: {
    title: "第一次站進打擊區",
    text: "教練終於把球棒交給你。前幾天你一直在學怎麼接住別人打出的球，現在整座球場忽然反過來面向你。\n\n教練說：『不用打遠。先讓我看看你怎麼選一顆願意揮的球。』",
    choices: [
      C("縮短揮棒，先讓球碰到球棒", { discipline: 1, ballSense: 1 }, ["chapter2_contact_swing"], "你沒有把球打遠，卻第一次清楚感覺擊球點留在手上。", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 1 } }),
      C("用力揮，想讓所有人聽見聲音", { confidence: 2, instinct: 1, pressure: 1 }, ["chapter2_power_swing"], "你揮空兩次，第三球打出全場最響的一聲滾地球。", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 1 } }),
      C("先看三球，記住出手和進壘位置", { observe: 2, confidence: -1 }, ["chapter2_studied_pitches"], "你少揮了幾次，卻開始理解打擊不是見球就打。", { skillEffects: { batting: 1, baseballIQ: 2 } })
    ]
  },
  chapter2_day3_test: {
    title: "第三天：隊內小測驗",
    text: "教練把新來的孩子排成一列：接起滾地球，再傳向一壘。輪到你時，旁邊的孩子都在看。",
    choices: [
      C("穩穩接住，先求完成動作", { confidence: 1, resilience: 1 }, ["chapter2_test_safe"], "你的傳球不快，但完成了整個動作。", { skillEffects: { catching: 2, baseballIQ: 1 } }),
      C("接起來後快速傳一壘", { instinct: 1, confidence: 1, pressure: 1 }, ["chapter2_test_fast"], "動作帶著衝勁，也帶著一點失控。", { skillEffects: { throwing: 2, catching: 1 } }),
      C("先判斷彈跳，再決定怎麼接", { observe: 2 }, ["chapter2_test_read"], "這一球讓教練看見你的觀察力。", { skillEffects: { baseballIQ: 2, catching: 1 } })
    ]
  },
  chapter2_result: {
    title: "垂直切片完成：少棒入門評估",
    text() {
      const memories = player.memories.slice(-5).map(item => `・${item}`).join("\n");
      return `${player.chapter2Result}\n\n${player.chapter2ResultDetail}\n\n教練評語：\n${player.chapter2CoachComment}\n\n最近留下的記憶：\n${memories}\n\n你還不是一名真正的球員，但你已經開始成為某一種球員。`;
    },
    choices: [
      { text: "進入少棒第一季", nextChapter: "youthSeason" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  },
  slice_complete: {
    title: "二十二歲，暫時寫到這裡",
    text() { return `測試完成。\n\n你的生涯出口：${player.careerExit || "尚未決定"}\n你的組織角色：${player.organizationRole || "尚未形成"}\n你的市場結果：${player.marketOutcome || "尚未形成"}\n你的發展期評估：${player.developmentResult || "尚未評估"}\n\n你成為的那種人：${getPersonalitySummary()}\n\n阿哲眼中的你：${getNpcReflection("azhe")}\n高橋眼中的你：${getNpcReflection("takahashi")}\n${getNpcDisplayName("yamamoto")}眼中的你：${getNpcReflection("coach")}\n\n下一階段將依市場結果進入職棒升降、大卒選秀、晚成測試或棒球第二角色。`; },
    choices: [{ text: "重新開始", restart: true }]
  }
};

function getYouthBenchEcho() {
  if (hasFlag("studied_rival_on_bench")) {
    return "紅白賽那天，你在板凳上畫下高橋三次接球的第一步；那張紙後來被夾進訓練筆記。";
  }
  if (hasFlag("supported_from_bench")) {
    return "紅白賽那天，你每半局都沿界外線熱身；教練收名單時，記得你一直處在能被叫上場的位置。";
  }
  if (hasFlag("resented_bench")) {
    return "紅白賽那天，你把掌聲收了起來，只盯著高橋守的位置；教練也把那段沉默記在名單旁。";
  }
  if (hasFlag("bench_studied_pitching")) {
    return "紅白賽那天，你替投手的偏高、偏外球畫了記號；那頁筆記跟著你進入後來幾次練習。";
  }
  return "紅白賽結束時，你沒有上場；教練只把你在板凳上的反應留進下一次名單考量。";
}

function getYouthPreviousPlayEcho() {
  const echoes = [
    {
      flag: "match_safe_fielding",
      error: false,
      summary: "上一個守備，你退半步守住正面，傳一壘拿到出局；原來的一壘跑者停在二壘。"
    },
    {
      flag: "match_aggressive_fielding",
      error: true,
      summary: "上一個守備，你在二壘封殺前位跑者，回傳卻把一壘手拉離壘包；記錄留下傳球瑕疵。"
    },
    {
      flag: "match_read_fielding",
      error: false,
      summary: "上一個守備，你等最後彈跳進手套，踩二壘再傳一壘，完成了雙殺。"
    },
    {
      flag: "outfield_took_route",
      error: false,
      summary: "上一個守備，你一路跑到警戒區接殺深遠飛球，一壘跑者只能退回去。"
    },
    {
      flag: "outfield_set_throw",
      error: false,
      summary: "上一個守備，你側身接球後快速回傳；跑者看見球先到，沒有多推進一個壘包。"
    },
    {
      flag: "outfield_diving_attempt",
      error: true,
      summary: "上一個守備，你撲球碰到球卻沒有留下；球滾向牆角，一壘跑者繞回本壘得分。"
    },
    {
      flag: "match_catcher_block_first",
      error: false,
      summary: "上一個守備，你擋住提前落地的第三好球並完成出局，一壘跑者留在原位。"
    },
    {
      flag: "match_catcher_called_defense",
      error: false,
      summary: "上一個守備，你的內角配球把滾地球引向提前移動的三壘手，守備完成出局。"
    },
    {
      flag: "match_catcher_backed_pitcher",
      error: false,
      summary: "上一個守備，你接受投手的高位快速球選擇；球被打穿外野，一壘跑者回本壘得分。"
    },
    {
      flag: "pitcher_first_strike",
      error: false,
      summary: "上一個打者，你用相同節奏連投外角，讓他打成一壘方向的軟弱飛球。"
    },
    {
      flag: "pitcher_challenged_hitter",
      error: true,
      summary: "上一個打者，你用內角快速球取得出局，其中一球卻從捕手上方飛過，記錄留下暴投。"
    },
    {
      flag: "pitcher_read_swing",
      error: false,
      summary: "上一個打者，你依揮棒改變內外角順序，讓他打成投手前滾地球並完成出局。"
    }
  ];
  const matched = echoes.find(item => hasFlag(item.flag));
  return matched || {
    flag: "",
    error: player.seasonErrors > 0,
    summary: player.seasonErrors > 0
      ? "上一個守備留下了瑕疵，記錄仍在場邊的記分紙上。"
      : "上一個守備已經完成，但這場比賽還沒有結束。"
  };
}

function getYouthNextPositionTask() {
  return {
    "內野手": "新的滾地球朝二游之間而來，你必須先判斷最近的出局點。",
    "外野手": "風把一顆平飛球推向邊線，你身後的空間正在縮小。",
    "捕手": "下一球提前落地，一壘跑者同時往前試探。",
    "投手": "下一名打者連續碰掉兩顆球，新的對決還在延長。"
  }[player.seasonPosition] || "新的守備任務已經朝你而來。";
}

const youthSeasonEvents = {
  youth_season_intro: {
    title: "少棒第一季：成為隊伍的一員",
    text() {
      const typeText = {
        "理解型新生": "教練知道你看得懂，但也想確認你能不能在來不及思考時做出動作。",
        "基本功型新生": "教練相信你的穩定，卻還不知道你是否敢在比賽中承擔責任。",
        "直覺型新生": "隊友已注意到你的反應，但教練擔心你不願意照球隊的方法做。",
        "緊張的新生": "教練沒有立刻要求你證明自己，而是先把你放在容易完成任務的位置。",
        "均衡型新生": "教練想讓你多碰幾個位置，再決定你最適合在哪裡。",
        "打擊入口型新生": "教練記得你第一次站進打擊區的選球方式，但也提醒你，光靠一聲響亮擊球還換不到固定打席。"
      };
      return `${typeText[player.chapter2Result] || "教練還在觀察你能替球隊做些什麼。"}\n\n新球季開始，山本教練說：『從今天開始，我看的不只是你會不會接球，也看你怎麼和別人一起打球。』`;
    },
    choices: [
      C("把手套放進球隊器材籃，照分組開始熱身", { resilience: 1, discipline: 1 }, ["season_accept_structure"], "你跟著口令跑完兩圈，再把下一組要用的球排好。教練沒有停下筆，只在你的名字旁畫了一個小勾。", { relationshipEffects: { coachTrust: 1 } }),
      C("指著守位分組表，問自己會先從哪裡開始", { observe: 1, confidence: 1 }, ["season_ask_position"], "教練用筆尖依序點過內野、外野、本壘與投手丘：『每個地方都做三球，再告訴我你看見什麼。』", { relationshipEffects: { coachTrust: 1 } }),
      C("排到隊伍最後，記住大家輪流搬器材的順序", { observe: 2 }, ["season_watch_team"], "你看見有人先搬壘包、有人清點球袋，也看見阿哲會替後面的人扶住推車。輪到你時，你接過了最容易掉下來的那袋球。", { relationshipEffects: { teammateBond: 1 } }),
      C("拿起球棒，請教練把自己排進下一組打擊", { confidence: 2, pressure: 1 }, ["season_declared_bat_path"], "教練把你的名字補進打擊組，讓你多揮十球；最後仍把一只手套推回你面前：『打完，守備照做。』", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 1 } })
    ]
  },
  youth_position_trial: {
    title: "第一次位置測試",
    text: "內野、外野、本壘與投手丘的輪測都已做過一遍。山本教練把最後十二顆球分成四排：四個位置各剩三球，也各有一項收尾任務。\n\n『不要告訴我你想守哪裡。』教練抬起筆，『選一件你現在做得到的事。三球結束後，由我決定你先去哪一組。』其他孩子退到網子後方，等你走向其中一排球。",
    choices: [
      C("壓低身體，等最後一次彈跳再傳一壘", { observe: 1, pressure: 1 }, ["tried_infield"], "前兩球都進了手套，第三球在最後一下彈高。你跟著球上升，踩穩後把球送進一壘手胸前。教練看完三球，把你的名字寫進內野組。", { setPrimaryPosition: "內野手", skillEffects: { catching: 1, throwing: 1, baseballIQ: 1, reaction: 2, range: 1 }, positionEffects: { infield: 3 } }),
      C("先跑到飛球後方，接住後朝內野回傳", { fitness: 2, instinct: 1 }, ["tried_outfield"], "你先往球後方繞，再迎著落點往前。第三顆球進手套時，身體已朝內野，回傳只在草地上彈了一次。教練沿著路線畫完一筆，把你的名字寫進外野組。", { setPrimaryPosition: "外野手", skillEffects: { catching: 1, reaction: 1, range: 2, armStrength: 2 }, positionEffects: { outfield: 3 } }),
      C("蹲到本壘後方，擋住低球再喊回傳方向", { observe: 2, resilience: 1 }, ["tried_catcher"], "第二球提前落地，你把膝蓋併起來，讓球停在胸前。撿球時，你朝一壘喊出回傳方向。教練看完第三球，把你的名字寫進捕手組。", { setPrimaryPosition: "捕手", skillEffects: { catching: 1, baseballIQ: 2, blocking: 1, gameCalling: 2 }, positionEffects: { catcher: 3 } }),
      C("站上投手丘，用七成力把三球投進手套", { confidence: 1, resilience: 1, pressure: 1 }, ["tried_pitcher"], "第一球偏高，第二球碰到手套外緣。你放慢抬腿，第三球落進捕手胸前。教練記下你修正偏差的方式，把你的名字寫進投手組。", { setPrimaryPosition: "投手", skillEffects: { throwing: 1, armStrength: 1, control: 2, pitchStamina: 1 }, positionEffects: { pitcher: 3 } })
    ]
  },
  youth_teammate: {
    title: "沒有被教練看見的失誤",
    text() {
      const i = player.impression.azhe;
      const admission = i.trusts >= 2 || player.personality.kind >= 3
        ? "他看見你還在，才用鞋尖把球停住：『剛才是不是又慢了一步？』"
        : player.personality.ambitious >= 3
          ? "他先看一眼器材室，才壓低聲音：『那球沒有算進測驗，對吧？』"
          : "他發現你回頭，立刻蹲下去整理鞋帶，像那顆球只是忘了收進袋子。";
      return `傍晚收操後，器材室的鐵門一開一闔。鋁棒碰進球袋，發出一連串乾硬的聲音；教練在遠處催大家把最後一袋球搬走。\n\n阿哲卻還站在二游之間。他獨自把一顆沾灰的球滾回原位，再向前跨步。球碰到手套外緣，「喀」一聲，又從他的腳邊溜出去。\n\n${admission}\n\n器材室又有人喊了一次阿哲的名字。他把漏掉的球踩在鞋底下，沒有抬頭。`;
    },
    choices: [
      C("蹲回原來的位置，把球重新滾給他", { observe: 1, resilience: 1 }, ["azhe_hidden_error_seen", "azhe_error_reworked", "azhe_grounder_object"], "你把那顆沾灰的球放回起點，一次又一次滾向同一道彈跳。最後一球收進手套時，阿哲沒有道謝，只把球在掌心轉半圈，問：『明天還記得從這裡開始嗎？』器材室的門在你們身後關上。", { personalityEffects: { kind: 2, reliable: 1 }, impressionEffects: { azhe: { trusts: 2, depends: 1 } }, skillEffects: { catching: 1, baseballIQ: 1 }, relationshipEffects: { teammateBond: 2 }, bodyEffects: { fatigue: 1 }, arcEffects: { azhe: "confided" } }),
      C("把球丟進袋子，告訴他剛才沒有人看見", { confidence: 1 }, ["azhe_hidden_error_seen", "azhe_error_minimized", "azhe_grounder_object"], "球落進袋底，撞出一聲悶響。阿哲肩膀鬆了一點，立刻拉緊袋口；他沒有再重做那個腳步。隔天同樣的球滾來時，他先看的是教練站在哪裡。", { personalityEffects: { thoughtful: 1 }, impressionEffects: { azhe: { feelsDistance: 1 } }, relationshipEffects: { teammateBond: 0 } }),
      C("打開自己的球袋，回到原定的十球訓練", { confidence: 1, pressure: 1 }, ["azhe_hidden_error_seen", "chose_solo_over_teammate", "youth_bat_work", "azhe_grounder_object"], "你把自己的十顆球排在打擊網旁。阿哲隔著二游之間的距離看了一會，彎腰撿起那顆漏接球，只說『明天見』。接下來只剩球棒擊網的聲音，和他一個人把球滾回原位的聲音。", { personalityEffects: { ambitious: 2, selfish: 1 }, impressionEffects: { coach: { competitive: 1 }, azhe: { feelsDistance: 2 } }, skillEffects: { batting: 2 }, relationshipEffects: { teammateBond: -1 }, bodyEffects: { fatigue: 2 } })
    ]
  },
  youth_bench: {
    title: "紅白賽名單沒有你的名字",
    text: "紅白兩隊穿著同一套練習衣，喊暗號時卻誰也不肯讓。山本教練站在一壘側，手裡的名單每完成一個守備就多一道短線。\n\n你的名字在候補欄。阿哲已經上場，高橋守在你試過的位置；他接完一顆偏慢的滾地球，沒有急著傳，而是先把腳步踩正。教練的筆又動了一次。板凳旁仍放著筆記本、代跑背心和一袋還沒用過的球。",
    choices: [
      C("在筆記本畫下高橋三次接球的第一步和傳球點", { observe: 2, pressure: 1 }, ["studied_rival_on_bench"], "第三次滾地球結束，你的紙上多了三個箭頭。最後半局結束，教練收起名單，大家開始搬壘包；你整場沒有上場，但那頁筆記被他看見了。", { personalityEffects: { thoughtful: 2, ambitious: 1 }, impressionEffects: { takahashi: { rivalry: 1, respect: 1 } }, skillEffects: { baseballIQ: 2 }, relationshipEffects: { rivalRespect: 1, rivalCompetition: 2 } }),
      C("每半局沿界外線熱身，聽到叫代跑就站到一壘側", { resilience: 2, confidence: 1 }, ["supported_from_bench"], "阿哲上壘後回頭找代跑指示，你已穿好背心站在一壘側。最後半局仍沒有換人；你整場沒有上場，紅白賽結束後，教練收回名單並記下你一直保持熱身。", { personalityEffects: { kind: 2, reliable: 2 }, impressionEffects: { coach: { dependable: 1 }, azhe: { trusts: 1 } }, skillEffects: { baseRunning: 1 }, relationshipEffects: { teammateBond: 2, coachTrust: 1 } }),
      C("收起喊聲，只盯著高橋守的那個位置", { confidence: 1, pressure: 2, instinct: 1 }, ["resented_bench"], "隊友完成出局時，板凳一起拍手，你的手卻留在膝蓋上。最後半局結束，大家開始收器材；你沒有上場，教練也把這段沉默留在名單旁。", { personalityEffects: { ambitious: 1, emotional: 2 }, impressionEffects: { coach: { immature: 1 }, takahashi: { rivalry: 2, underestimate: 1 } }, relationshipEffects: { rivalCompetition: 3, coachTrust: -1 } }),
      C("把投手偏高、偏外的球各畫一個記號", { observe: 2 }, ["bench_studied_pitching"], "兩局後，投手在落後球數時又把球投高。最後半局結束，教練收起名單，隊友開始整理球袋；你沒有上場，只把第三個記號和握短球棒的位置一起留在紙上。", { skillEffects: { batting: 1, baseballIQ: 1 } })
    ]
  },
  youth_match_entry: {
    title: "教練叫到你的名字",
    text() {
      const contextResult = CoachResponseFlow.createCoachResponseContext(
        "youth_match_entry",
        null
      );
      if (!contextResult.ok) throw new Error(contextResult.error);
      const responseResult = CoachResponseFlow.resolveCoachResponse(
        contextResult.context
      );
      if (!responseResult.ok) throw new Error(responseResult.error);
      const narrativeResult = CoachResponseFlow.applyCoachResponse(
        responseResult
      );
      if (!narrativeResult.ok) throw new Error(narrativeResult.error);

      const assignments = { "內野手": "去二壘，把接傳完成", "外野手": "去右外野，先守住身後", "捕手": "穿護具，從下一名打者開始接", "投手": "去牛棚，下一局由你接手" };
      const assignment = assignments[player.seasonPosition] || "手套拿著，準備上場";
      const call = narrativeResult.category === "supportive"
        ? `山本教練沒有回頭，只朝你招手：『${assignment}。』他說得像是早就決定要給你機會。`
        : `教練看了板凳一圈，最後叫到你的名字：『${assignment}。』這個機會來得比你預期突然。`;
      const benchEcho = getYouthBenchEcho();
      return `紅白賽結束後，球隊又練了幾次。正式聯賽那天，新的出賽名單貼在休息區：你的名字仍在候補欄，先從板凳等待。\n\n${benchEcho}\n\n比賽進行到中段，板凳上的說話聲忽然斷了一拍。${call}\n\n旁邊的隊友把手套推到你腳邊。釘鞋踩進界外的紅土，場外聲音一下子退遠；守備員正朝各自的位置散開，沒有人會停下來等你緊張完。`;
    },
    choices: [
      C("套上手套，直接跑向教練指的守位", { confidence: 2, pressure: 1 }, ["entered_match_confident"], "你越過界外線時朝教練點了一次頭，接著把腳踩進守備位置。內野手用手套指向跑者，第一個暗號已經在你到位前傳過來。", { relationshipEffects: { coachTrust: 1 }, matchEffects: { performance: 1 } }),
      C("指著一壘跑者，先確認球來時要傳哪裡", { observe: 2 }, ["confirmed_assignment"], "教練先指二壘，再指一壘：『來得及就抓前面的，來不及先拿一個出局。』你複誦一次，才跑進場內。", { skillEffects: { baseballIQ: 1 }, matchEffects: { performance: 1 } }),
      C("在界外線深呼吸三次，再戴上手套進場", { resilience: 1, pressure: 2 }, ["entered_match_nervous"], "第三次吐氣後，手心仍然潮濕。你用球衣擦過掌心才跨進場內；教練沒有催，只把最基本的傳球方向再喊一次。", { personalityEffects: { brave: 1 }, impressionEffects: { coach: { dependable: 1 } }, matchEffects: { performance: 0 } })
    ]
  },
  youth_match_grounder: {
    title: "第一顆正式滾地球",
    text() {
      const insight = player.chapter2Result === "理解型新生" ? "你立刻注意到球會在最後一次彈跳偏向手套側。" : player.chapter2Result === "直覺型新生" ? "你的身體比腦袋更早往球的方向動了。" : "教練反覆要求的腳步在你腦中閃過。";
      return `一壘跑者把離壘距離拉得比上一球更遠。投手抬腿時，他立刻往二壘衝；球棒隨即發出短促的「喀」一聲。\n\n球沿著紅土朝你滾來。${insight}\n\n游擊手在你右側喊：「二壘！」他的腳已往壘包移動，你只有一次接球動作決定要拿哪個出局數。`;
    },
    choices: [
      C("退半步守住正面，接穩後傳一壘", { resilience: 1 }, ["match_safe_fielding"], "你讓球進到胸前，雙手合住手套後才傳向一壘。一壘手在跑者前踩住壘包；原來的一壘跑者抵達二壘，但你確實拿到第二個出局數。", { skillEffects: { catching: 1, throwing: 1, reaction: 1 }, relationshipEffects: { coachTrust: 2 }, matchEffects: { performance: 2, outs: 1, advanceRunners: true } }),
      C("往二壘前方搶一步，反手餵給游擊手", { instinct: 1, pressure: 1 }, ["match_aggressive_fielding"], "你在跑者前把球反手送出，游擊手踩到二壘；他的回傳卻把一壘手拉離壘包。前面的跑者已出局，打者安全上壘，場邊的歡呼立刻變成一聲嘆氣。", { skillEffects: { throwing: 2 }, relationshipEffects: { rivalRespect: 1 }, matchEffects: { performance: 2, errors: 1, outs: 1, clearBases: true } }),
      C("等最後一次彈跳進手套，自己踩二壘再傳一壘", { observe: 1 }, ["match_read_fielding"], "球彈進手套後，你順著移動方向踩過二壘，再轉髖把球送往一壘。兩名裁判先後握拳——雙殺。隊友的喊聲一下子蓋過你的心跳。", { skillEffects: { catching: 1, baseballIQ: 2, reaction: 1, range: 1 }, relationshipEffects: { coachTrust: 1 }, matchEffects: { performance: 3, outs: 2, clearBases: true } })
    ]
  },
  youth_match_outfield: {
    title: "第一顆越過頭頂的飛球",
    text: "右打者上一球拉成界外，這一次擊球聲更厚。球越過內野手頭頂，繼續往右外野深處升高。\n\n你第一步往前，立刻發現判斷太淺；一壘跑者已越過二壘，右側邊線和身後的全壘打牆正在把追球路線越縮越窄。",
    choices: [
      C("立刻轉身跑向牆前，再回頭找球", { observe: 1, discipline: 1 }, ["outfield_took_route"], "你先沿著落點路線跑，直到警戒區才回頭舉起手套。球落進掌心，一壘跑者已繞過二壘，只能急踩煞車再退回去。", { skillEffects: { range: 2, reaction: 1, catching: 1 }, relationshipEffects: { coachTrust: 2 }, matchEffects: { performance: 3, outs: 1 } }),
      C("追到落點後側身接球，讓身體朝向內野", { confidence: 1, pressure: 1 }, ["outfield_set_throw"], "球進手套時，你的右腳已踩向內野。回傳只落地一次就進入截球手套，跑者看見球先到，沒有再多跨一個壘包。", { skillEffects: { armStrength: 2, throwing: 1 }, matchEffects: { performance: 2, outs: 1 } }),
      C("朝球的前方撲下，阻止它落地彈向牆邊", { instinct: 2, pressure: 2 }, ["outfield_diving_attempt"], "手套碰到球，卻沒有把它留下。球沿草地滾向牆角，你起身追球時，一壘跑者已經繞回本壘；隊友的掌聲和急促回傳聲混在一起。", { skillEffects: { reaction: 1 }, matchEffects: { performance: 1, errors: 1, opponentRuns: 1 } })
    ]
  },
  youth_match_catcher: {
    title: "本壘前的第一次指揮",
    text: "投手把球握緊又鬆開，等著你給下一個暗號。打者前兩次揮棒都提早打開肩膀；一壘跑者則把離壘距離拉得更長，眼睛一直看著會不會出現低球。\n\n內野手彎下腰等你喊聲。這一球不只要選位置，也要讓投手和守備知道接下來可能發生什麼。",
    choices: [
      C("比出低球暗號，膝蓋先往內收準備擋球", { observe: 1, responsibility: 1 }, ["match_catcher_block_first"], "打者揮空，球卻提前落地。你用胸口把球留在面前，撿起後完成第三好球的處理；一壘跑者只能退回原位。", { skillEffects: { blocking: 2, catching: 1 }, relationshipEffects: { coachTrust: 2 }, matchEffects: { performance: 2, outs: 1 } }),
      C("喊內角球，提醒三壘手往線邊靠一步", { confidence: 1, pressure: 1 }, ["match_catcher_called_defense"], "打者的球棒從內側擠過去，滾地球正好進入三壘手提前移動的路線。傳球抵達一壘時，你的喊聲還留在整組守備裡。", { skillEffects: { gameCalling: 2, baseballIQ: 2 }, relationshipEffects: { teammateBond: 1 }, matchEffects: { performance: 3, outs: 1 } }),
      C("照投手搖頭後的選擇，配一顆高位快速球", { resilience: 1 }, ["match_catcher_backed_pitcher"], "快速球有速度，位置卻留在打者胸前。球穿過外野空隙，一壘跑者一路繞回本壘；你接回傳球後立刻走上投手丘，把下一個暗號當面說清楚。", { skillEffects: { gameCalling: 1 }, relationshipEffects: { teammateBond: 2 }, matchEffects: { performance: 1, opponentRuns: 1 } })
    ]
  },
  youth_match_pitcher: {
    title: "投手丘上的第一個打者",
    text: "捕手把手套擺在外角，打者卻站得離本壘板很近，像是準備把外角球推向另一邊。一壘跑者每次在你低頭看暗號時就多跨半步。\n\n你把鞋尖踩進投手板。第一球還沒出手，打者、跑者和捕手已經同時等著你的動作。",
    choices: [
      C("用七成力量連投外角，先把球送進手套", { discipline: 2 }, ["pitcher_first_strike"], "第一球落在手套邊緣，打者沒有出棒。你照同樣節奏再投兩次，第三球被打成一壘方向的軟弱飛球；一壘手接住後，先指了指你剛才穩住的位置。", { skillEffects: { control: 2, pitchStamina: 1 }, relationshipEffects: { coachTrust: 2 }, matchEffects: { performance: 2, outs: 1 } }),
      C("抬高出手點，用最快的球攻擊內角", { confidence: 2, pressure: 1 }, ["pitcher_challenged_hitter"], "第一球讓打者揮空，場邊第一次因你的球速出聲。第二球卻從捕手手套上方飛過；重新對準後，打者把下一球打成內野高飛球。出局拿到了，暴投也留在記錄裡。", { skillEffects: { armStrength: 2, throwing: 1 }, bodyEffects: { fatigue: 1 }, matchEffects: { performance: 2, errors: 1, outs: 1 } }),
      C("先投外角看揮棒，再把下一球移到內側", { observe: 2 }, ["pitcher_read_swing"], "打者的第一棒追著外角出去。你把第二球移到內側，第三球再回到外角；他只能用棒頭碰成投手前的軟弱滾地球，你下丘把球傳向一壘。", { skillEffects: { control: 1, baseballIQ: 2 }, relationshipEffects: { teammateBond: 1 }, matchEffects: { performance: 3, outs: 1 } })
    ]
  },
  youth_match_mistake: {
    get title() {
      return getYouthPreviousPlayEcho().error ? "那次瑕疵之後" : "下一次守備";
    },
    text() {
      const previousPlay = getYouthPreviousPlayEcho();
      const task = getYouthNextPositionTask();
      const oldFear = hasCallback("fear_of_failure", false) ? "你又聽見場邊孩子的笑聲，和第一次幾乎一樣。" : hasCallback("family_safe_place", false) ? "你想起第一次失敗後退到家人身邊；這一次，休息區離你很遠。" : "";
      return `${previousPlay.summary}\n\n前一個半局結束後，又過了一局。五局上，零出局、無人在壘，你回到${player.seasonPosition || "原來的守位"}。${oldFear}\n\n${task}隊友已經喊出站位，這是同一場比賽裡的新任務。`;
    },
    choices: [
      C("退回基本站位，接到球後只做最近的出局點", { resilience: 2, pressure: -1 }, ["recovered_after_play"], "教練喊出『下一球』時，你先把雙腳放回練習過的位置。球進入守區後，你沒有多看第二個跑者，只把傳球送到最近的壘包；裁判的拳頭舉起，這一球乾淨結束。", { positionSkillEffects: { "內野手": { catching: 1, throwing: 1 }, "外野手": { catching: 1, range: 1 }, "捕手": { blocking: 1, gameCalling: 1 }, "投手": { control: 1, pitchStamina: 1 } }, relationshipEffects: { coachTrust: 1 }, matchEffects: { performance: 2, outs: 1 } }),
      C("朝阿哲喊『往左還是往右？』，照他的手勢移半步", { observe: 1, confidence: 1 }, ["asked_teammate_in_match"], "阿哲沒有回頭，只把手套往左比了一下。你剛移完半步，球就進入兩人之間；你收球、他補位，一聲短促的提醒換來一個出局數。", { skillEffects: { baseballIQ: 1 }, relationshipEffects: { teammateBond: 2 }, matchEffects: { performance: 2, outs: 1 } }),
      C("往第一個落點衝，試著做全場最難的出局", { instinct: 2, pressure: 2 }, ["forced_highlight_play"], "你在隊友喊聲前就離開原位，手套確實碰到球，身體卻來不及停穩。球從指尖彈開，跑者趁守備重新撿球時跨回本壘；高橋把回傳截住，沒有說話。", { positionSkillEffects: { "內野手": { reaction: 1 }, "外野手": { range: 1 }, "捕手": { throwing: 1 }, "投手": { armStrength: 1 } }, relationshipEffects: { rivalCompetition: 1 }, matchEffects: { performance: 1, errors: 1, opponentRuns: 1 } })
    ]
  },
  youth_match_after: {
    title: "賽後：勝負之外",
    text() {
      const personal = player.seasonPerformance >= 6 ? "你完成了教練交代的任務，也讓隊友開始把你當成能上場的人。" : "你的第一次上場並不完整，但至少你知道正式比賽的速度和練習完全不同。";
      const error = player.seasonErrors ? `你留下了 ${player.seasonErrors} 次明顯失誤或瑕疵。` : "你沒有留下明顯失誤。";
      return `記分員把白板最後一格框起來，裁判收好面罩，兩隊在本壘前排成一列。\n\n${personal}\n\n${error}\n\n握手隊伍散開後，教練手上的筆仍沒有停。高橋把比賽球放回籃子才經過你身邊；阿哲則提著兩只水壺，留在休息區入口等你。`;
    },
    choices: [
      C("和補位的隊友逐一碰手套，再拿記分紙找教練", { responsibility: 1, resilience: 1 }, ["reviewed_with_team"], "你先向替自己補位的人碰了手套，再把記分紙攤到教練膝上。教練用筆圈出一次完成的任務和一次遲疑，隊友也留在旁邊聽完。", { relationshipEffects: { teammateBond: 1, coachTrust: 2 } }),
      C("把球滾給高橋，問他第一步會往哪裡", { observe: 2 }, ["asked_rival_after_match"], "高橋沒有先回答，而是把球照原本方向滾回來，自己示範了一次墊步。第二次，他站到旁邊讓你做；直到你的肩膀對準傳球點，他才把球收走。", { relationshipEffects: { rivalRespect: 2, rivalCompetition: 1 } }),
      C("把壘包放回原位，照剛才的彈跳重做十球", { resilience: 2, fitness: -1 }, ["repeated_mistake_after_match"], "第六球開始，你的腳步終於不再追著球跑。第十球進手套時，球場只剩整理器材的聲音；教練看完最後一球，先指了指你的腿，叫你回家冰敷。", { skillEffects: { catching: 1, throwing: 1 }, relationshipEffects: { coachTrust: 1 } }),
      C("走進打擊網，補完教練沒排到的十次揮棒", { confidence: 1, resilience: 1 }, ["postgame_batting_work"], "你把十顆球排在打擊網外，逐顆揮完。最後一球打中網心時，隊友已經離開，阿哲留下的水壺也不再冒水珠。", { skillEffects: { batting: 2 }, relationshipEffects: { teammateBond: -1 }, bodyEffects: { fatigue: 2 } })
    ]
  },
  youth_season_result: {
    title: "少棒第一季評估",
    text() {
      return `${player.seasonResult}\n\n${player.seasonResultDetail}\n\n初步位置：${player.seasonPosition}\n隊內定位：${player.seasonRole}\n\n教練評語：\n${player.seasonCoachComment}\n\n你已不只是喜歡棒球的孩子。你開始知道，在隊伍裡留下來需要能力，也需要別人願意把下一球交給你。`;
    },
    choices: [
      { text: "進入位置競爭與事件回響", nextChapter: "positionCompetition" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const positionCompetitionEvents = {
  competition_intro: {
    title: "第二輪名單",
    text() {
      return `第一季結束後，教練重新貼出守備分組。你的名字被寫在「${player.seasonPosition}」旁邊，但後面還有一個小小的問號。\n\n高橋也在同一組。阿哲看完名單後，先回頭看你的表情。\n\n山本教練說：『位置不是獎品。誰能讓球隊放心，誰就留在那裡。』`;
    },
    choices: [
      C("把問號當成下一次機會", { confidence: 1, resilience: 1 }, ["accepted_position_competition", "主動競爭"], "你沒有把暫時的位置誤認成保證。", { relationshipEffects: { coachTrust: 1 }, personalityEffects: { brave: 1, ambitious: 1 }, impressionEffects: { coach: { competitive: 1 }, takahashi: { rivalry: 1 } } }),
      C("先研究高橋為什麼排在前面", { observe: 2 }, ["studied_position_rival"], "你開始把競爭差距拆成可以學習的部分。", { relationshipEffects: { rivalRespect: 1, rivalCompetition: 1 }, personalityEffects: { thoughtful: 2, ambitious: 1 }, impressionEffects: { takahashi: { respect: 1, rivalry: 1 } } }),
      C("找阿哲一起確認分組內容", { responsibility: 1 }, ["shared_roster_with_teammate"], "你第一個想到的不只是自己有沒有位置。", { relationshipEffects: { teammateBond: 1 }, personalityEffects: { kind: 1, reliable: 1 }, impressionEffects: { azhe: { trusts: 1 } } })
    ]
  },
  echo_coach: {
    title: "教練留下的一籃球",
    text() { return `其他人離開後，山本教練把一籃球留在場邊。這不是公開獎勵，而是他願意多花十分鐘確認你值不值得繼續投資。\n\n「${player.impression.coach.dependable >= 3 ? "你讓人放心，但不要什麼都自己扛。" : player.impression.coach.competitive >= 3 ? "你很想贏。接下來要證明你也懂得怎麼贏。" : "我還在看，你會怎麼使用這次機會。"}」` },
    choices: [
      C("請教練只修正最重要的一件事", { observe: 1, discipline: 1 }, ["yamamoto_private_training_done", "focused_coach_extra", "被教練注意"], "你沒有貪多，而是把一次機會用在最關鍵的修正。", { skillEffects: { baseballIQ: 2 }, relationshipEffects: { coachTrust: 2 }, personalityEffects: { thoughtful: 2, reliable: 1 }, impressionEffects: { coach: { dependable: 2 } } }),
      C("要求多做幾球證明穩定", { resilience: 2, fitness: -1 }, ["yamamoto_private_training_done", "proved_consistency_extra", "喜歡加練", "被教練注意"], "你用重複動作換取教練的信任，也感覺到疲勞。", { skillEffects: { catching: 2 }, relationshipEffects: { coachTrust: 1 }, bodyEffects: { fatigue: 2 }, personalityEffects: { ambitious: 2, stubborn: 1 }, impressionEffects: { coach: { competitive: 2 } } })
    ]
  },
  echo_teammate: {
    title: "阿哲把球留給你",
    text: "阿哲知道你正在競爭位置，主動說願意陪你練到天黑。但他自己明天也有測驗，這份幫忙並不是沒有代價。",
    choices: [
      C("一起練，但約好準時結束", { discipline: 1, responsibility: 1 }, ["balanced_teammate_training"], "你接受幫助，也沒有把隊友的付出當成理所當然。", { skillEffects: { throwing: 1, catching: 1 }, relationshipEffects: { teammateBond: 2 } }),
      C("婉拒，叫他先顧好自己的測驗", { responsibility: 2 }, ["protected_teammate_time"], "你放棄一次加練，卻讓阿哲更相信你。", { relationshipEffects: { teammateBond: 2 } })
    ]
  },
  echo_rival: {
    title: "高橋的直接挑戰",
    text: "高橋把球丟進你手套：『你從來不會逃開競爭。既然我們守同一個位置，就比十球。失誤多的人幫忙收器材。』他的語氣不像欺負，更像開始承認你是值得比較的對手。",
    choices: [
      C("接受十球挑戰", { confidence: 2, pressure: 1 }, ["takahashi_first_challenge_done", "accepted_rival_drill"], "你和高橋一球一球比到最後。", { skillEffects: { catching: 2 }, relationshipEffects: { rivalRespect: 2, rivalCompetition: 2 }, personalityEffects: { brave: 2, ambitious: 2, emotional: 1 }, impressionEffects: { takahashi: { respect: 2, rivalry: 2 } } }),
      C("提議比較不同難度的球", { observe: 2 }, ["takahashi_first_challenge_done", "redesigned_rival_drill"], "你沒有逃避挑戰，而是讓比較更接近真正比賽。", { skillEffects: { baseballIQ: 2 }, relationshipEffects: { rivalRespect: 2 }, personalityEffects: { thoughtful: 2, brave: 1 }, impressionEffects: { takahashi: { respect: 2 } } })
    ]
  },
  echo_coach_leadership: {
    title: "山本教練交出的名單",
    text: "山本教練把分組名單交給你：『今天少一個人帶隊。你來確認熱身和器材。』這不是獎勵，而是他第一次把別人的準備也交到你手上。\n\n『你最大的優點是可靠，最大的缺點也是太想把所有事扛完。』",
    choices: [
      C("先確認每個人需要什麼", { responsibility: 2, observe: 1 }, ["yamamoto_group_task_done", "accepted_team_leadership"], "你沒有急著命令，而是先讓整組的人知道自己的任務。阿哲開始等你的分配，高橋則確認規則後才接受指揮。", { personalityEffects: { reliable: 2, kind: 1 }, impressionEffects: { coach: { dependable: 2, leader: 2 }, azhe: { depends: 1 }, takahashi: { respect: 1 } }, relationshipEffects: { coachTrust: 2, teammateBond: 1 }, arcEffects: { yamamoto: "mentor" } }),
      C("訂出標準，要求所有人跟上", { confidence: 2, pressure: 1 }, ["yamamoto_group_task_done", "led_with_high_standard"], "你的要求讓練習更整齊。高橋第一個跟上，阿哲卻逐漸不再問你問題。", { personalityEffects: { ambitious: 2, stubborn: 1 }, impressionEffects: { coach: { leader: 1, competitive: 2 }, azhe: { feelsDistance: 1 }, takahashi: { rivalry: 1 } }, relationshipEffects: { coachTrust: 1 } })
    ]
  },
  echo_rival_respect: {
    title: "高橋主動邀請特訓",
    text: "高橋第一次不是來宣戰，而是拿著兩人的守備筆記找你：『你會看出我漏掉的地方，我也能逼你把動作做快。一起練。』他已經不再把你當成陪襯。",
    choices: [
      C("互相指出一個最明顯的弱點", { observe: 2, confidence: 1 }, ["rival_shared_weakness"], "競爭沒有消失，但你們開始用競爭幫彼此變強。", { personalityEffects: { thoughtful: 1, brave: 1, ambitious: 1 }, impressionEffects: { takahashi: { respect: 2, rivalry: 1 } }, relationshipEffects: { rivalRespect: 2 }, skillEffects: { baseballIQ: 1, reaction: 1 }, arcEffects: { takahashi: "partner" } }),
      C("只比結果，不交換訣竅", { confidence: 2, pressure: 1 }, ["kept_rivalry_pure"], "你接受他的認可，卻仍把成長方法留給自己。", { personalityEffects: { ambitious: 2, selfish: 1 }, impressionEffects: { takahashi: { rivalry: 2, respect: 1 } }, relationshipEffects: { rivalCompetition: 2 }, arcEffects: { takahashi: "rival" } })
    ]
  },
  echo_coach_immature: {
    title: "山本教練沒有立刻給球",
    text: "你又一次因失誤把手套摔在腿邊。山本教練沒有罵，只把下一顆球扣在手裡：『能力夠不夠是一回事。大家敢不敢把下一球交給你，是另一回事。』",
    choices: [
      C("承認自己把焦躁丟給了隊友", { resilience: 2, pressure: -1 }, ["owned_emotional_reaction"], "你第一次不是替失誤辯解，而是處理失誤後的自己。", { personalityEffects: { thoughtful: 2, reliable: 1, emotional: -1 }, impressionEffects: { coach: { immature: -2, dependable: 1 }, azhe: { trusts: 1 } }, relationshipEffects: { coachTrust: 1 } }),
      C("要求下一球立刻證明自己", { confidence: 1, pressure: 2 }, ["demanded_immediate_redemption"], "你把挫折變成衝勁，但教練仍在等你學會控制。", { personalityEffects: { stubborn: 2, ambitious: 1, emotional: 1 }, impressionEffects: { coach: { immature: 2, competitive: 1 } }, relationshipEffects: { coachTrust: -1 } })
    ]
  },
  echo_solo: {
    title: "沒有人特別留下來",
    text: "練習結束後，教練忙著整理名單，阿哲和高橋也各自離開。球場沒有為你的競爭停下來，你只能決定如何使用剩下的時間。",
    choices: [
      C("照筆記完成一組基本動作", { discipline: 2, resilience: 1 }, ["solo_structured_work"], "沒有人看著，你仍完成了自己答應的練習。", { skillEffects: { catching: 1, baseballIQ: 1 } }),
      C("準時回家，讓身體恢復", { responsibility: 1, pressure: -1 }, ["chose_recovery"], "你第一次把休息也當成訓練的一部分。")
    ]
  },
  azhe_bond_high: {
    title: "阿哲只對你說的事",
    text() {
      return `先發測試結束後，夕陽只剩在一壘休息區的長椅下。別人的釘鞋聲已經穿過鐵門，阿哲還坐著，把同一截鞋帶拆開、綁緊，又拆開。\n\n他先問：『你明天幾點到？』停了一會，拇指才去摳手套邊緣磨白的線。\n\n『最近球打到二游中間，我會先想是不是會害你來不及補。』他盯著紅土，沒有看你，『有時候一想到，就連自己的第一步也出不去。』\n\n遠處管理員開始收壘包。留給你們的時間，只剩他走到這邊以前反覆想過、卻還沒有說完的幾句話。`;
    },
    choices: [
      C("把水放在他腳邊，坐下來等他說完", { resilience: 1, pressure: -1 }, ["azhe_confession_resolved", "azhe_felt_heard"], "你把水瓶放在長椅下，沒有去碰那副被捏得變形的手套。阿哲斷斷續續說完三顆球，最後把鞋帶一次綁好：『明天提早十分鐘，可以嗎？』管理員熄燈前，你們才一起起身。", { relationshipEffects: { teammateBond: 2 }, personalityEffects: { kind: 2, thoughtful: 1 }, impressionEffects: { azhe: { trusts: 3 } }, arcEffects: { azhe: "confided" } }),
      C("用球在紅土畫出責任線，和他約好提醒聲", { responsibility: 2, observe: 1 }, ["azhe_confession_resolved", "azhe_shared_fear", "azhe_private_signal", "azhe_red_dirt_line"], "你用球沿著二游之間壓出一道短線，再把提醒聲喊給他聽。阿哲蹲下，用兩根手指把線尾補直；起身後，他先朝你的位置看了一次，才把球滾過去。那道線隔天會被整平，短音卻留了下來。", { skillEffects: { baseballIQ: 1 }, relationshipEffects: { teammateBond: 2 }, bodyEffects: { fatigue: 1 }, personalityEffects: { kind: 1, reliable: 2 }, impressionEffects: { azhe: { trusts: 2, depends: 3 } }, arcEffects: { azhe: "dependent" } }),
      C("把球推回他手裡，說明天照常練", { confidence: 1 }, ["azhe_confession_resolved", "azhe_fear_minimized"], "球碰到阿哲手套，他下意識接住。你站起來說明天照常，他也跟著戴回手套；走出鐵門後，他把沒說完的那句話留在空球場裡。下一次害怕出現時，他只自己多做了五球。", { personalityEffects: { thoughtful: 1 }, impressionEffects: { azhe: { trusts: -1, feelsDistance: 1 } } }),
      C("收好手套，提醒彼此都得完成自己的測試", { pressure: 1, responsibility: 1 }, ["azhe_confession_resolved", "azhe_competition_boundary"], "你扣上球袋，阿哲也把鞋帶塞進鞋舌裡。他說『我知道』，先一步走向鐵門。隔天測試前，他把站位往另一側挪了兩步，中間留下的紅土沒有人踩過。", { personalityEffects: { ambitious: 1, selfish: 1 }, impressionEffects: { azhe: { feelsDistance: 2 } }, relationshipEffects: { teammateBond: -1 }, arcEffects: { azhe: "distant" } })
    ]
  },
  azhe_bond_mid: {
    title: "練習後的一瓶水",
    text: "午休結束前，休息區只剩風扇轉動和自動販賣機落罐的聲音。阿哲從販賣機走回來，手上多一瓶水。他沒有叫你，只把冰涼的瓶身放在你的守備筆記旁，水珠慢慢暈濕紙角。集合哨還沒響，你們都看著那瓶沒有被打開的水。",
    choices: [
      C("旋開瓶蓋，問他哪一球最不對勁", { observe: 1 }, ["checked_on_azhe"], "瓶蓋喀一聲鬆開。阿哲先說『沒什麼』，又用手指在長椅上畫出那顆球的路線。集合哨響時，他還在比最後一次彈跳；你把沒喝完的水一起帶進球場。", { relationshipEffects: { teammateBond: 2 } }),
      C("把自己的水放到旁邊，和他坐到集合", { resilience: 1 }, ["shared_silence_with_azhe"], "兩個瓶子並排立在腳邊，外壁的水珠落成兩小圈深色痕跡。阿哲沒有找話說，只在哨響時順手把你的那瓶也拿起來。你們一前一後走回守位。", { relationshipEffects: { teammateBond: 1 } }),
      C("把水推回去，攤開筆記繼續研究守備", { discipline: 1 }, ["kept_distance_from_azhe"], "瓶子沿著長椅滾回阿哲手邊，碰到他的指節才停。他把水收進袋子，沒有再問。你在筆記上補完站位箭頭；下一次集合，他站到了另一排。", { relationshipEffects: { teammateBond: -1 }, skillEffects: { baseballIQ: 1 } })
    ]
  },
  azhe_bond_low: {
    title: "沒有人喊出的補位",
    text: "午後分組守備，打者把球削向二游之間。你往左跨，阿哲也往右啟動；兩個人都在第二步停下，等對方先喊。\n\n球沿著紅土滾過兩副手套中間，碰上外野草皮才慢下來。教練的哨聲立刻切斷場邊說話聲。\n\n阿哲跑去撿球，回來時避開你的視線，把球交給教練：『我以為他會處理。』你們腳邊沒有責任線，也沒有約好的提醒聲。下一組已經在本壘後排隊。",
    choices: [
      C("用鞋尖畫出責任區，先說自己剛才沒有喊", { responsibility: 2, confidence: 1 }, ["repaired_azhe_signal", "azhe_red_dirt_line"], "你在兩人中間拖出一道紅土線，先指向自己剛才停下的位置。阿哲沒有回話，只用鞋底把線尾往自己那側補了一截。下一球你先喊，他跨過那道線完成補位；教練吹了一聲短哨，示意繼續。", { relationshipEffects: { teammateBond: 3, coachTrust: 1 }, skillEffects: { baseballIQ: 1 } }),
      C("把球放在分界上，只說清楚下一球歸誰", { discipline: 1, pressure: 1 }, ["formalized_azhe_assignment", "azhe_red_dirt_line"], "你把球壓在兩個守區交界，阿哲用手套指向自己負責的方向。你們沒有談剛才，也沒有靠近；下一顆球按照規則被接住，球進手套後仍沒有人擊掌。", { relationshipEffects: { teammateBond: 1 }, skillEffects: { baseballIQ: 1 } }),
      C("把球塞進阿哲手裡，說那本來就是他的球", { confidence: 1, instinct: 1 }, ["blamed_azhe_missed_cover"], "阿哲接住球，手套卻垂在腿邊。他往後退一步，把球再交給教練，站到責任區最外側。紀錄板上那次失誤仍寫在整組名下；下一球來時，他沒有再越過中線。", { relationshipEffects: { teammateBond: -2, coachTrust: -1 }, matchEffects: { errors: 1 } })
    ]
  },
  competition_position_test: {
    title: "位置測驗的最後一球",
    text() {
      const situations = {
        "內野手": "一顆慢滾地球沿三壘線前進。你必須往前處理，再從移動中完成傳球。",
        "外野手": "一顆飛球越過內野，風把球往界外推。跑者已經繞過一壘。",
        "捕手": "投手的球提前落地，三壘跑者離壘過遠。你必須先擋住，再決定是否傳球。",
        "投手": "打者連續碰掉三球。捕手給出暗號，你的手臂已開始發沉。"
      };
      return `${situations[player.seasonPosition] || "教練給了你一個沒有標準答案的守備局面。"}\n\n教練沒有提示。高橋在旁邊等自己的下一輪。`;
    },
    choices: [
      C("選擇最穩定的處理方式", { discipline: 1, resilience: 1 }, ["competition_safe_solution"], "你沒有追求最漂亮的答案，而是完成球隊需要的出局。", { positionSkillEffects: { "內野手": { catching: 1, throwing: 1 }, "外野手": { catching: 1, range: 1 }, "投手": { control: 1, pitchStamina: 1 } }, relationshipEffects: { coachTrust: 2 }, matchEffects: { performance: 2 } }),
      C("依照觀察即時調整", { observe: 2 }, ["competition_adaptive_solution"], "你根據局面改變原本計畫，讓教練看見你的理解力。", { skillEffects: { baseballIQ: 1 }, positionSkillEffects: { "內野手": { reaction: 1 }, "外野手": { reaction: 1, range: 1 }, "投手": { control: 1 } }, relationshipEffects: { coachTrust: 1 }, matchEffects: { performance: 2 } }),
      C("用最有把握的直覺動作", { instinct: 2, pressure: 1 }, ["competition_instinct_solution"], "你的處理並不制式，卻讓高橋第一次認真點了頭。", { relationshipEffects: { rivalRespect: 2 }, matchEffects: { performance: 2 } })
    ]
  },
  competition_catcher_test: {
    title: "捕手測驗：一顆提前落地的球",
    text() {
      const bond = player.relationships.teammateBond >= 6
        ? "投手看向你，等你給出暗號。你們已經熟悉彼此緊張時會出現的動作。"
        : "投手一直摸著帽沿。他不確定下一球該投什麼，你也不確定他是否相信你的暗號。";
      return `兩出局、三壘有人。打者已連續追打兩顆外角球。\n\n${bond}\n\n你比出暗號，投手點頭，球卻在本壘前提前落地。三壘跑者同時起跑。\n\n這一球會同時檢驗你能不能擋住球，以及你是否有能力指揮下一個動作。`;
    },
    choices: [
      C("先用身體封住球，再確認跑者", { resilience: 2, responsibility: 1 }, ["competition_safe_solution", "catcher_blocked_run"], "你把球留在胸前。跑者被迫停下，教練記住你先守住最壞結果。", { skillEffects: { blocking: 2, catching: 1 }, relationshipEffects: { coachTrust: 2 }, bodyEffects: { fatigue: 1 }, matchEffects: { performance: 2 } }),
      C("提前讀出低球，擋球後立刻指揮補位", { observe: 2, pressure: 1 }, ["competition_adaptive_solution", "catcher_directed_defense"], "你在球落地前移動，擋住後立刻喊出三壘補位。整組守備因你的聲音一起動了。", { skillEffects: { blocking: 1, gameCalling: 2, baseballIQ: 1 }, relationshipEffects: { coachTrust: 2, teammateBond: 1 }, matchEffects: { performance: 3 } }),
      C("改變下一球暗號，先讓投手重新穩定", { responsibility: 2, confidence: 1 }, ["competition_instinct_solution", "catcher_calmed_pitcher"], "你沒有責怪暴投，而是走上投手丘重新確認暗號。下一球，投手第一次完全照你的節奏出手。", { skillEffects: { gameCalling: 3, baseballIQ: 1 }, relationshipEffects: { teammateBond: 2, coachTrust: 1 }, matchEffects: { performance: 2 } })
    ]
  },
  starter_selection_test: {
    title: "倒數結束：先發守位測試",
    text() {
      const c = player.startingCompetition;
      return `三次準備行動結束，山本教練把名單夾在板子背面。\n\n「今天不是看誰做出最漂亮的一球，而是看誰能讓我把下一場的第一局交出去。」\n\n${c.rivalName || "競爭者"}目前評價 ${c.rivalRating}，你的評價 ${c.playerRating}。最後五球會決定你進入先發候選，或繼續從板凳等待。`;
    },
    choices: [
      C("降低難度，五球都先求確實完成", { discipline: 1, pressure: -1 }, ["starter_test_stable"], "你放棄搶眼表現，換取五球都能被預期的穩定。", { skillEffects: { catching: 1 }, relationshipEffects: { coachTrust: 2 }, resolveStartingCompetition: true }),
      C("依打者與彈跳逐球調整站位", { observe: 2, pressure: 1 }, ["starter_test_adaptive"], "你承擔判斷錯誤的風險，讓教練看見你能讀懂局面。", { skillEffects: { baseballIQ: 1, reaction: 1 }, relationshipEffects: { coachTrust: 1 }, resolveStartingCompetition: true }),
      C("用最快動作正面壓過競爭者", { confidence: 2, pressure: 2 }, ["starter_test_aggressive"], "你選擇爭取最醒目的印象，也接受一次失手可能放大代價。", { skillEffects: { throwing: 1, reaction: 1 }, relationshipEffects: { rivalCompetition: 1 }, bodyEffects: { fatigue: 1 }, resolveStartingCompetition: true })
    ]
  },
  starter_selection_result: {
    title: "先發名單公布",
    text() {
      const c = player.startingCompetition;
      const echo = hasFlag("怕失誤") ? "你想起自己曾經選擇先看別人怎麼做；這一次，你已經能在被注視時完成自己的動作。" : hasFlag("喜歡加練") ? "那些沒有人記錄的加練替你換來了評價，也把疲勞留在身體裡。" : "教練看的不只是最後五球，也包括你此前怎麼練、怎麼和隊友相處。";
      const won = c.playerRating >= c.rivalRating;
      const takahashi = won ? (hasFlag("starter_test_aggressive") ? "高橋只問：『那種球，你能每次都做嗎？』" : "高橋看完名單很平靜，把下一顆球丟進你的手套：『明天照樣比。』") : `高橋沒有慶祝，只指出你在測驗中完成最好的一球：『那球不是運氣。別把其他球也當成運氣。』`;
      const azhe = player.impression.azhe.feelsDistance >= 5 ? "阿哲看了你的表情，最後沒有走過來。" : player.impression.azhe.trusts >= 3 ? "阿哲先問的不是你有沒有先發，而是你現在想不想說話。" : "阿哲站在名單旁邊，等著看你如何面對結果。";
      const coach = player.impression.coach.immature >= 5 ? "山本教練先說：『不論結果，先把情緒留到所有人看完名單之後。』" : player.impression.coach.dependable >= 5 ? "山本教練把下一場的守備任務一起交給你，沒有重新解釋。" : "山本教練只提醒，名單評的是現在，不是身分。";
      return `${c.result}\n\n${c.detail}\n\n${echo}\n\n${takahashi}\n${azhe}\n${coach}\n\n同一張名單讓三個人用不同方式看見你如何面對輸贏。`;
    },
    choices: [
      C("收起名單，回到下一次練習", { resilience: 1 }, ["takahashi_selection_echo_done", "starter_result_received"], "你知道了目前的位置，也知道三個人都記住了你看完名單後的第一個動作。", { resumeAfterPending: true }),
      C("先找教練確認下一個考核標準", { observe: 1, pressure: 1 }, ["takahashi_selection_echo_done", "starter_asked_next_standard"], "答案沒有讓競爭變輕鬆。高橋留在旁邊聽完，阿哲則記住你先找的是標準。", { relationshipEffects: { coachTrust: 1 }, impressionEffects: { coach: { dependable: 1 }, takahashi: { respect: 1 } }, resumeAfterPending: true }),
      C("去找高橋約下一組傳接球", { confidence: 1, fitness: -1 }, ["takahashi_selection_echo_done", "starter_kept_competing"], "名單公布後，你沒有避開高橋。阿哲看著你們走回球場，沒有跟上。", { relationshipEffects: { rivalRespect: 1, rivalCompetition: 1 }, impressionEffects: { takahashi: { respect: 1, rivalry: 1 }, azhe: { feelsDistance: 1 } }, bodyEffects: { fatigue: 1 }, resumeAfterPending: true })
    ]
  },
  competition_result: {
    title: "位置競爭小結",
    text() {
      return `${player.competitionResult}\n\n${player.competitionDetail}\n\n目前位置：${player.seasonPosition}\n教練信任：${player.relationships.coachTrust}\n隊友連結：${player.relationships.teammateBond}\n宿敵敬意：${player.relationships.rivalRespect}\n\n同一張名單，因為你過去建立的關係不同，走向了不同的競爭方式。`;
    },
    choices: [
      { text: "進入青少棒：十三歲的分化", nextChapter: "juniorBaseball" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const juniorBaseballEvents = {
  junior_intro: {
    title: "十三歲：同一條起跑線消失了",
    text() {
      const positionEcho = player.seasonPosition ? `你仍被安排在${player.seasonPosition}組。` : "你的位置仍未完全固定。";
      const historyEcho = player.competitionResult ? `少棒最後留下的評語是「${player.competitionResult}」。那句話沒有隨升上國中消失。` : `少棒時你被視為「${player.seasonResult || "仍待觀察的球員"}」。`;
      const bondEcho = player.relationships.teammateBond >= 7 ? "阿哲仍會在熱身時自然站到你旁邊。" : player.relationships.teammateBond <= 2 ? "阿哲和你被分到同一組，彼此卻很少主動說話。" : "熟悉的隊友還在，但每個人都開始忙著守住自己的位置。";
      return `三年過去。有人一個暑假抽高十公分，有人的傳球忽然帶著你接不住的重量。\n\n${positionEcho}\n${historyEcho}\n${bondEcho}\n\n你沒有停止進步，但第一次清楚感覺到：別人的身體正在用不同速度往前走。`;
    },
    choices: [
      C("承認差距，重新評估自己", { observe: 2, resilience: 1 }, ["junior_accepted_gap"], "你沒有假裝差距不存在。", { bodyEffects: { maturity: 1 } }),
      C("增加一組核心與遠傳訓練", { fitness: 2, pressure: 1 }, ["junior_doubled_training"], "你用更明確的訓練追趕發育差距，而不是單純增加所有份量。", { skillEffects: { armStrength: 1 }, bodyEffects: { fatigue: 2 } }),
      C("相信自己的技術仍能競爭", { confidence: 2, instinct: 1 }, ["junior_trusted_skill"], "你決定先讓技術替身體爭取時間。", { relationshipEffects: { rivalCompetition: 1 } })
    ]
  },
  junior_growth_test: {
    title: "身體測驗公布",
    text() {
      const rival = player.relationships.rivalCompetition >= 5 ? "高橋的球速與跑速都排在前段，他看見你的成績後沒有嘲笑，只說：『正式比賽不會等你長大。』" : "測驗表上，你的名字落在中段。沒有人特別議論，這反而讓差距更真實。";
      return `球隊測量跑速、遠投與折返跑。\n\n${rival}\n\n教練提醒：數字不是判決，但位置會受到它影響。`;
    },
    choices: [
      C("把重點放在反應與站位", { observe: 2, discipline: 1 }, ["junior_compensate_with_iq"], "你開始用預判縮短身體差距。", { skillEffects: { baseballIQ: 2, catching: 1 } }),
      C("強化跑動和核心體能", { fitness: 2, resilience: 1 }, ["junior_build_body"], "你接受身體需要時間，也開始有計畫地訓練。", { bodyEffects: { stamina: 1, fatigue: 1 } }),
      C("挑戰高橋最擅長的項目", { confidence: 2, pressure: 2 }, ["junior_challenged_growth_rival"], "你沒有贏，卻逼自己看見差距到底有多遠。", { relationshipEffects: { rivalRespect: 2, rivalCompetition: 2 }, bodyEffects: { fatigue: 1 } }),
      C("把有限成長時間集中在打擊", { discipline: 1, ballSense: 1 }, ["junior_bat_compensation"], "你接受守備和身體暫時追不上，先磨出能改變打線的揮棒。", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 1 } })
    ]
  },
  junior_position_change: {
    title: "教練提出轉守位",
    text() {
      const suggestions = { "內野手": "二壘與外野", "外野手": "一壘與二壘", "捕手": "三壘與一壘", "投手": "外野與代打" };
      return `教練把你叫到旁邊：『現在的身體條件，${player.seasonPosition}不一定是你最容易上場的位置。』\n\n他建議你試試${suggestions[player.seasonPosition] || "其他位置"}。\n\n這不是淘汰，卻像有人要你放下已經努力很久的名字。`;
    },
    choices: [
      C("接受測試，把上場放在位置之前", { responsibility: 2, discipline: 1 }, ["accepted_junior_position_change"], "你同意暫時放下原本守位，尋找球隊需要你的方式。", { acceptSuggestedPosition: true, relationshipEffects: { coachTrust: 2 }, skillEffects: { baseballIQ: 1 } }),
      C("請教練給自己最後一次競爭機會", { confidence: 2, pressure: 1 }, ["requested_final_position_chance"], "你沒有直接拒絕，而是替原本的位置爭取期限。", { relationshipEffects: { coachTrust: 1, rivalCompetition: 1 } }),
      C("拒絕轉守位，想守出自己的風格", { instinct: 2, confidence: 1 }, ["refused_junior_position_change"], "你選擇承擔更少上場機會，也不願太早放棄自己的位置。", { relationshipEffects: { coachTrust: -2 } })
    ]
  },
  junior_azhe_cover: {
    title: "二游之間的下一球",
    text() {
      const arc = player.characterArc.azhe;
      const rememberedGrounder = hasFlag("azhe_grounder_object") ? "那個聲音讓你想起少棒時，球撞上他手套外緣的那一晚。" : "球在不規則的紅土上突然往兩人中間偏。";
      const rememberedLine = hasFlag("azhe_red_dirt_line") ? "練習前整平過的紅土上，已看不見當年那道責任線。" : "你們腳邊只有剛被釘鞋刮開的新痕跡。";
      if (arc === "respected_equal" || arc === "confided") return `國中隊的黃昏守備，打者把球敲進二游交界。${rememberedGrounder}\n\n阿哲直接喊出以前約好的短音，沒有先確認你在不在。你踩向壘包時，他的傳球已經貼著紅土送來。球進手套的「啪」聲和他的喊聲幾乎接在一起。\n\n${rememberedLine}下一組打者已經抬棒，你們必須決定這個舊暗號是否仍屬於現在的守備。`;
      if (arc === "dependent") return `國中隊的黃昏守備，二游之間的球突然改變方向。${rememberedGrounder}\n\n阿哲沒有先喊。他轉頭看你，像在等你替那顆球命名；你也因那一眼慢了半步。球從兩人都伸得到、卻都沒到的位置穿過，外野才把它攔下。\n\n${rememberedLine}教練把下一顆球放上發球架，沒有留時間讓你們解釋。`;
      if (arc === "distant" || player.impression.azhe.feelsDistance >= 5) return `國中隊的黃昏守備，打者把球敲進二游交界。沒有人喊聲，球從兩副手套之間穿過，只留下滾過紅土的細線。\n\n阿哲跑去撿球，回來時沒有看你，也沒有提少棒那顆球。他把球放進現任教練掌心，轉身站回自己的守區。\n\n下一球已經被舉起；你們之間只剩教練劃定的距離。`;
      return `國中隊的黃昏守備，二游之間的滾地球逼近。${rememberedGrounder}\n\n你和阿哲都搶著證明自己不會退。你先喊，他也在最後一步伸出手套；兩邊肩膀差點撞在一起，球被鞋尖踢歪。\n\n${rememberedLine}阿哲把手套抵在膝上喘氣，下一組已經開始倒數。你們得在下一球前重新說清楚。`;
    },
    choices: [
      C("下一球直接喊出以前的短音", { responsibility: 1, observe: 1 }, ["azhe_cover_echo_done", "kept_azhe_signal"], "你在球離棒時先喊出短音。阿哲肩膀沒有再停，從你身後切進來補位，傳球擦過當年畫線的位置。完成出局後，他只用手套背碰了一下你的手肘，立刻面向下一名打者。", { personalityEffects: { reliable: 1 }, relationshipEffects: { teammateBond: 1 }, skillEffects: { baseballIQ: 1 }, azheCoverSignalOutcome: true }),
      C("用鞋尖把責任區重新畫在紅土上", { observe: 2 }, ["azhe_cover_echo_done", "redrew_cover_assignment", "azhe_red_dirt_line"], "你重新拖出一條線，阿哲蹲下把球放在交界，逐一指過兩種彈跳。下一球照規則完成，卻在啟動前多了一次彼此確認的停頓。哨聲響後，那道線仍清楚留在兩人中間。", { personalityEffects: { thoughtful: 1 }, impressionEffects: { azhe: { depends: 2 } }, skillEffects: { baseballIQ: 1 }, arcEffects: { azhe: "dependent" } }),
      C("把球放在中線，約定只守各自責任區", { discipline: 1, pressure: 1 }, ["azhe_cover_echo_done", "separated_azhe_cover"], "你把球放在中線，阿哲用手套指向自己的半邊。接下來三球沒有再漏，也沒有一次越區補位。收操時他把那顆球交回球袋；你們的守備可以運作，距離也被規則固定下來。", { impressionEffects: { azhe: { feelsDistance: 2 } }, relationshipEffects: { teammateBond: -1 }, arcEffects: { azhe: "distant" } })
    ]
  },
  junior_takahashi_failure: {
    title: "高橋第一次失常",
    text: "國中隊午後的內野滾地練習，發球機每隔七秒吐出一顆球。高橋前九球都比別人早半步到位；接球、踩穩、傳向一壘，手套與胸前護網輪流響起乾脆的「啪」聲。\n\n第十球照樣進手套，他的傳球卻第一次高過一壘手肩膀。高橋走去撿回那顆球，在縫線旁畫一小道黑記號，重新戴緊手套。接著兩球又微微偏高。排隊的孩子先看球，再互看，原本催促下一輪的聲音全停了。\n\n回母隊看練習的山本沒有責罵，只在高橋重新站回原位時多看了一眼。發球機已經亮起綠燈；你只能決定下一顆球要放回哪裡。",
    choices: [
      C("撿回畫了記號的球，放回發球機旁的固定籃位", { observe: 2 }, ["takahashi_first_failure_seen", "takahashi_failure_direct", "takahashi_first_wild_ball"], "你撿回那顆偏高的球，讓黑記號朝上放進固定籃位。高橋沒有道謝，只照原本七秒的間隔重新跨步；下一球仍高，卻回到一壘手伸手可及的位置。", { personalityEffects: { thoughtful: 1, brave: 1 }, impressionEffects: { takahashi: { respect: 2, rivalry: 1 } }, relationshipEffects: { rivalRespect: 2 }, arcEffects: { takahashi: "partner" } }),
      C("把記號球放回原位，站到他慣用的傳球終點", { resilience: 1, kind: 1 }, ["takahashi_first_failure_seen", "takahashi_failure_practiced", "takahashi_first_wild_ball"], "你踩回他每次瞄準的白線外，手套維持在胸口高度。高橋把球一顆顆送來，沒有改短距離；收球聲重新連起來，但每次出手前都多了一次握縫線的停頓。", { personalityEffects: { kind: 1, ambitious: 1 }, impressionEffects: { takahashi: { respect: 2 } }, relationshipEffects: { rivalRespect: 1 }, bodyEffects: { fatigue: 1 } }),
      C("照原本順序完成自己的五顆球", { confidence: 2, pressure: 1 }, ["takahashi_first_failure_seen", "used_rival_failure", "takahashi_first_wild_ball"], "你沒有回頭看籃位，依序接完自己的五顆球。記錄員把你的欄位填滿時，高橋仍在後方重戴手套；下一輪名單照成績往下排，沒有為任何人停住。", { personalityEffects: { ambitious: 2, selfish: 1 }, impressionEffects: { takahashi: { rivalry: 3, underestimate: 1 } }, relationshipEffects: { rivalCompetition: 2 } }),
      C("把計分板翻到下一輪，保留他的原始分數", { responsibility: 1 }, ["takahashi_first_failure_seen", "covered_rival_failure", "takahashi_first_wild_ball"], "你沒有擦掉偏高球旁的記號，只把計分板翻到下一輪。高橋經過時用指節敲了一下那格，隨即站回隊伍最前面；所有人也跟著移動，沒有人替那三球加上解釋。", { personalityEffects: { kind: 1 }, impressionEffects: { takahashi: { respect: 1, rivalry: 1 } } })
    ]
  },
  junior_takahashi_pressure: {
    title: "白板上越來越多的名字",
    text: "一週後，選拔練習換到有看台的主球場。白板中央寫著高橋的名字，旁邊依序貼上守備順位、測速數字和高中球隊來訪的時間。新的比賽球整籃送到他腳邊，隊友卻仍把磨損最久的球遞給他，等他示範縫線怎麼握。\n\n學弟排隊請教，家長隔著鐵網比對成績，現任教練每念一個測驗項目，所有人都先看高橋是否站好。高橋前幾輪仍做得比別人乾淨；每一次「啪」聲落下，看台就安靜等下一球。\n\n輪到那顆畫著黑記號的球時，他拇指在縫線上停了一拍。白板還空著下一格，記錄筆懸在格線上方。",
    choices: [
      C("把白板翻到下一頁，照原欄位登記每一球", {}, ["takahashi_pressure_seen", "takahashi_scoreboard", "kept_takahashi_score_raw"], "你把上一頁連同偏高的記號完整折到背面，新頁仍照相同欄位記錄。高橋看見空白格後直接開始；看台沒有變少，筆尖也沒有停，只是每一球都留下原來的結果。", { impressionEffects: { takahashi: { respect: 1 } }, lifeThemeEffects: { competition: 1 } }),
      C("把新球排在磨損球後面，維持原本出球順序", {}, ["takahashi_pressure_seen", "takahashi_scoreboard", "kept_takahashi_ball_order"], "你把發亮的新球推到籃底，先送出大家平常使用的磨損球。高橋沒有挑球，依序完成；輪到新球時，鐵網後同時響起快門聲，他的手套在胸前多停了半秒。", { impressionEffects: { takahashi: { rivalry: 1 } }, lifeThemeEffects: { competition: 1 } }),
      C("站到高橋平常回傳的固定位置，等下一球", {}, ["takahashi_pressure_seen", "takahashi_scoreboard", "held_takahashi_target"], "你踩在白線外，手套維持在他每天瞄準的高度。高橋把球送來，後方的人仍在等示範，白板旁的人仍在寫數字；你只把每顆球收進同一個位置，再逐顆放回籃裡。", { impressionEffects: { takahashi: { respect: 1 } }, lifeThemeEffects: { competition: 1 } })
    ]
  },
  junior_takahashi_break: {
    title: "手套裡消失的節奏",
    text: "地區賽前最後一輪守備，高橋站在平常不必提醒的位置。第一顆正面滾地球鑽過手套下緣，撞上外野草皮；第二顆他提早跨步，傳球擦過一壘手的指尖；第三顆只是慢速彈跳，他卻在球到面前時換了兩次重心。\n\n不是一次失誤。計分板連續三格留下叉號，原本每七秒一次的接球聲被撿球腳步切斷。高橋把手套脫下、戴回，又重新拉緊束帶；掌心磨到發亮的皮革在夕陽下反光。隊伍沒有人先開口，也沒有人把自己的球交給他示範。\n\n現任教練只把最後三顆球放到籃邊。今天不會有人替高橋找回答；你也只能決定，這一輪要怎麼結束。",
    choices: [
      C("站到他慣用的回傳點，把最後三顆球逐一放回球籃", {}, ["takahashi_break_seen", "takahashi_shined_glove", "finished_takahashi_last_three"], "你沒有改短距離，也沒有先說下一球會更好。高橋完成最後三次回傳，仍有一球偏離手套；哨聲響後，他把那副發亮的手套壓進球袋，拉鍊一路拉到底。", { impressionEffects: { takahashi: { respect: 1 } }, lifeThemeEffects: { competition: 1 } }),
      C("把計分板翻到最後一格，照原順序開始自己的下一輪", {}, ["takahashi_break_seen", "takahashi_shined_glove", "continued_after_takahashi_break"], "你把三個叉號留在背面，沒有擦掉，也沒有加註原因。自己的第一顆球滾來時，高橋站到隊伍末端；他一邊重新拉緊手套束帶，一邊看著計分板從新的一格開始。", { impressionEffects: { takahashi: { rivalry: 1 } }, lifeThemeEffects: { competition: 1 } }),
      C("收起散在界外的器材，把那副手套留在長椅中央", {}, ["takahashi_break_seen", "takahashi_shined_glove", "closed_takahashi_training_day"], "你把球籃、白板和發球機電線依序收好，沒有碰長椅上的手套。燈熄掉一排後，高橋才回來拿起它；磨亮的掌心朝外，他沿著無人的一壘線走出球場。", { impressionEffects: { takahashi: { respect: 1 } }, lifeThemeEffects: { competition: 1 } })
    ]
  },
  junior_coach_disagreement: {
    title: "國中隊教練做了你不認同的決定",
    text() {
      const opening = player.impression.coach.immature >= 5 ? "國中隊教練先叫你把手套放下：『先把聲音放低，再來問名單。』" : player.impression.coach.dependable >= 5 ? "國中隊教練沒有避開你的眼神：『你會把話聽完，所以我直接說。今天我選高橋。』" : player.personality.thoughtful >= 5 ? "國中隊教練把名單推到你面前：『你每次都說知道了。這次我想知道你真正不同意什麼。』" : "國中隊教練讓高橋繼續先發，即使上一輪你的完成度更高。";
      const mentorEcho = "幾天後，你把這件事寫進訊息。少棒恩師山本只回：『我不能替你改名單。先想清楚，你要問的是標準，還是不服結果。』";
      return `${opening}\n\n現任教練必須選擇現在最能使用的人；你則必須決定，要如何面對一個不完全認同的答案。\n\n${mentorEcho}`;
    },
    choices: [
      C("等其他人離開，再問三項評分依據", { observe: 2 }, ["yamamoto_disagreement_done", "asked_coach_reason_privately"], "教練說明了戰術配合，也承認自己更容忍高橋的失誤。", { personalityEffects: { thoughtful: 2, brave: 1 }, impressionEffects: { coach: { dependable: 1 }, takahashi: { respect: 1 } }, relationshipEffects: { coachTrust: 1 }, arcEffects: { yamamoto: "trusted" } }),
      C("在名單前說明自己完成得更好", { confidence: 2, pressure: 2 }, ["yamamoto_disagreement_done", "challenged_coach_publicly"], "球場安靜下來。教練沒有改名單，只要求你明天把同樣表現再做一次。", { personalityEffects: { brave: 2, ambitious: 1, emotional: 1 }, impressionEffects: { coach: { competitive: 2, immature: 1 }, takahashi: { rivalry: 1 } }, relationshipEffects: { coachTrust: -1 } }),
      C("接下替補任務，但請教練記住自己的異議", { responsibility: 2 }, ["yamamoto_disagreement_done", "accepted_with_reservation"], "你照常完成任務。練習後，教練第一次把你的沉默和服從分開看待。", { personalityEffects: { reliable: 2, brave: 1 }, impressionEffects: { coach: { dependable: 2, leader: 1 } }, relationshipEffects: { coachTrust: 2 } }),
      C("不再談名單，把下一次訓練量加倍", { resilience: 1, pressure: 2 }, ["yamamoto_disagreement_done", "turned_disagreement_inward"], "教練沒有阻止你，只在訓練表旁寫下：『他又想用疲勞回答問題。』", { personalityEffects: { ambitious: 2, stubborn: 1 }, impressionEffects: { coach: { competitive: 1, immature: 1 } }, bodyEffects: { fatigue: 2 } })
    ]
  },
  junior_friend_exit: {
    title: "阿哲考慮怎麼留下",
    text() {
      const arc = player.characterArc.azhe;
      const setting = "畢業前一週，器材室的日光燈不時閃一下。桌上壓著一張折成四折的退出申請、球隊經理的工作表和補習班時間表；門邊那只球袋還留著沒拍乾淨的紅土。";
      if (arc === "respected_equal") return `${setting}\n\n阿哲把工作表攤開，鉛筆停在「紀錄」和「牛棚協助」兩欄之間：『我不想再假裝只有先發才算留下。』他把退出申請放在旁邊，沒有推給你，『但這兩格真的是我想做的嗎？』\n\n走廊已有人催你們鎖門。他等的是你看見哪一格，不是替他簽名。`;
      if (arc === "dependent") return `${setting}\n\n阿哲把折好的退出申請捏在掌心，紙角已經被汗壓軟：『如果是你，會叫我繼續嗎？』工作表仍是一片空白，補習班時間正好劃掉每週兩次練習。\n\n鎖門的人在走廊數到三。只要你替他指出一格，他就可能把整張答案交過來。`;
      if (arc === "distant" || player.impression.azhe.feelsDistance >= 5) return `${setting}\n\n你是從現任教練口中先聽見消息的。整理器材時，阿哲把退出申請壓在工作表上，只把球袋的拉鍊拉好：『你比較想知道名單會空出哪個位置吧。』\n\n他把表格收進資料夾，沒有讓你看勾了哪一欄。`;
      return `${setting}\n\n阿哲把補習班時間表和球隊工作表對齊，怎麼排都會少掉兩個下午。他沒有說討厭棒球，只用鉛筆敲著空白的「想保留的任務」欄。\n\n退出申請已經填好名字，簽名欄還空著。門外傳來第二次鎖門提醒。`;
    },
    choices: [
      C("攤平工作表，圈出他反覆提過的兩項任務", { responsibility: 2, observe: 1 }, ["azhe_exit_decision_done", "respected_azhe_exit", "azhe_record_sheet"], "你只圈下「紀錄」和「牛棚協助」，把鉛筆留在紙上。阿哲看了很久，自己在旁邊補上一句：『偶爾上場，不保證。』隔天他拿著同一張表去找教練；退出申請仍折著，沒有被撕掉。", { relationshipEffects: { teammateBond: 2 }, personalityEffects: { kind: 2, thoughtful: 2 }, impressionEffects: { azhe: { trusts: 2 } }, arcEffects: { azhe: "respected_equal" } }),
      C("把退出申請折回原樣，交還他決定是否送出", { resilience: 1, confidence: 1 }, ["azhe_exit_decision_done", "left_door_open_for_azhe"], "你沿著原來的摺痕把申請折好，放回阿哲掌心。紙角從他指縫露出來；他沒有立刻收進口袋。幾天後，他親自把答案交給教練，也把工作表的照片第一個傳給你。", { relationshipEffects: { teammateBond: 2 }, personalityEffects: { kind: 2, reliable: 1 }, impressionEffects: { azhe: { trusts: 2, depends: -1 } }, arcEffects: { azhe: "confided" } }),
      C("指著名單空格，說位置很快會有人補上", { pressure: 1, instinct: 1 }, ["azhe_exit_decision_done", "questioned_azhe_exit"], "你的指尖停在名單空格。阿哲順著看了一眼，把退出申請壓回工作表上，拉起沾紅土的球袋。之後他把最後答案只交給教練；那張表格去了哪裡，你沒有再看見。", { relationshipEffects: { teammateBond: -1 }, personalityEffects: { emotional: 1, ambitious: 1 }, impressionEffects: { azhe: { feelsDistance: 2 } }, arcEffects: { azhe: "distant" } })
    ]
  },
  junior_pain: {
    title: "第一次不會立刻消失的疼痛",
    text: "連續幾天訓練後，你的右肩在傳球時出現一陣刺痛。放下手臂後，疼痛又像什麼都沒發生。明天就是位置測試。",
    choices: [
      C("立刻告訴教練和家人", { responsibility: 2, pressure: 1 }, ["reported_first_pain"], "你第一次承認，想留在場上不代表可以假裝身體沒事。", { relationshipEffects: { coachTrust: 1 }, bodyEffects: { pain: -1, injuryRisk: -1 }, personalityEffects: { brave: 2, reliable: 2 }, impressionEffects: { coach: { dependable: 2 }, family: { worry: 1, pride: 1 } } }),
      C("減少傳球，觀察一天", { observe: 2, discipline: 1 }, ["monitored_first_pain"], "你沒有完全停下，也沒有照常硬撐，而是開始記錄疼痛。", { bodyEffects: { fatigue: -1 }, personalityEffects: { thoughtful: 2, reliable: 1 }, impressionEffects: { family: { worry: 1 } } }),
      C("不說，先完成明天測試", { confidence: 1, resilience: 1, pressure: 2 }, ["hid_first_pain"], "你把疼痛藏在揮臂之後。沒有人發現，但身體記住了。", { bodyEffects: { pain: 2, injuryRisk: 3 }, personalityEffects: { stubborn: 2, selfish: 1, emotional: 1 }, impressionEffects: { coach: { immature: 2 }, family: { worry: 2 } } })
    ]
  },
  junior_result: {
    title: "青少棒開場評估",
    text() {
      return `${player.juniorResult}\n\n${player.juniorDetail}\n\n目前道路：${player.juniorPath}\n疲勞：${player.body.fatigue}　傷病風險：${player.body.injuryRisk}　疼痛：${player.body.pain}\n\n十三歲的第一次分化沒有決定你能走多遠，卻開始決定你願意用什麼代價留下來。`;
    },
    choices: [
      { text: "進入青少棒分化與升學選擇", nextChapter: "juniorSeason" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const juniorSeasonEvents = {
  junior_consequence: {
    title: "那次肩膀疼痛的後續",
    text() {
      if (hasFlag("hid_first_pain")) {
        return "你瞞著疼痛完成測試。兩週後，一次遠傳讓右肩像被細線突然拉緊，球在半途失去力道。教練第一次不是問你痛不痛，而是問：『這多久了？』";
      }
      if (hasFlag("reported_first_pain")) {
        return "你錯過了一次位置測試，卻在防護員安排下完成休息與動作調整。重新傳球的第一天，教練限制你只能投二十球。";
      }
      return "你持續記錄肩膀狀況。疼痛沒有立刻惡化，但每次長傳前，你都比以前更注意熱身與出手感覺。";
    },
    choices: [
      C("接受檢查與暫停出賽", { responsibility: 2, pressure: 1 }, ["accepted_junior_rehab"], "你第一次因身體狀況離開名單，也第一次學習復健。", { bodyEffects: { pain: -2, injuryRisk: -2, fatigue: -1 }, relationshipEffects: { coachTrust: 1 } }),
      C("要求改做不痛的訓練", { observe: 1, discipline: 2 }, ["modified_junior_training"], "你沒有完全停下，而是把訓練改成身體能承受的形式。", { bodyEffects: { pain: -1, injuryRisk: -1 }, skillEffects: { baseballIQ: 1 } }),
      C("繼續隱瞞，只降低傳球力道", { confidence: 1, pressure: 2 }, ["continued_hiding_pain"], "你保住了眼前的出賽資格，卻開始改變動作來避開疼痛。", { bodyEffects: { pain: 2, injuryRisk: 3 }, relationshipEffects: { coachTrust: -1 } })
    ]
  },
  junior_senior: {
    title: "學長說：照規矩來",
    text: "新學期，高年級學長負責帶隊熱身。他要求所有人完成同樣的跑量，即使你仍在調整肩膀。拒絕可能被視為不合群，照做則會增加疲勞。",
    choices: [
      C("完成跑量，不讓自己成為例外", { resilience: 1, discipline: 1 }, ["followed_senior_load"], "你完成所有跑量，得到學長認可，也把疲勞留到第二天。", { bodyEffects: { fatigue: 2 }, relationshipEffects: { teammateBond: 1 } }),
      C("拿出防護員安排，說明自己的限制", { confidence: 1, responsibility: 2 }, ["explained_medical_limit"], "你沒有挑戰學長的地位，只清楚說明自己現在能做什麼。", { bodyEffects: { injuryRisk: -1 }, relationshipEffects: { coachTrust: 1 } }),
      C("私下減量，不讓任何人發現", { observe: 1, pressure: 1 }, ["secretly_reduced_load"], "你保護了身體，卻留下不願直接溝通的痕跡。", { bodyEffects: { fatigue: -1 }, relationshipEffects: { teammateBond: -1 } })
    ]
  },
  junior_starting_job: {
    title: "主力名單只剩一個位置",
    text() {
      const rival = player.relationships.rivalRespect >= 5 ? "高橋在測驗前對你說：『不管誰先發，別讓這個位置變弱。』" : "高橋沒有和你說話，只反覆練著同一個腳步。";
      return `大賽前，${player.seasonPosition}只剩一個主力名額。\n\n${rival}\n\n教練公布三項測驗：穩定完成、困難球處理，以及團隊戰術理解。`;
    },
    choices: [
      C("把穩定完成放在第一位", { discipline: 2, resilience: 1 }, ["junior_competed_consistency"], "你沒有拿到最多掌聲，卻很少讓球離開控制。", { skillEffects: { catching: 2 }, relationshipEffects: { coachTrust: 2 } }),
      C("挑戰困難球，爭取明顯優勢", { instinct: 2, pressure: 2 }, ["junior_competed_highlight"], "你完成一次最難的動作，也出現一次不必要的失誤。", { skillEffects: { throwing: 2 }, relationshipEffects: { rivalRespect: 1 }, matchEffects: { performance: 2, errors: 1 } }),
      C("在戰術測驗中指揮隊友", { observe: 2, responsibility: 1 }, ["junior_competed_leadership"], "你讓整組人的站位更清楚，教練開始用不同方式評估你的價值。", { skillEffects: { baseballIQ: 2 }, relationshipEffects: { teammateBond: 2, coachTrust: 1 } })
    ]
  },
  junior_academics: {
    title: "考試與大賽在同一週",
    text: "期中考和地區大賽排在同一週。家人沒有要求你放棄棒球，只把成績單放在桌上：『你要怎麼安排，我們想聽你的計畫。』",
    choices: [
      C("減少自主訓練，先守住課業", { responsibility: 2, discipline: 1 }, ["balanced_school_first"], "你少練幾天，卻第一次把棒球以外的未來也放進計畫。", { academicEffects: { academics: 2, motivation: -1, burnout: -1 }, bodyEffects: { fatigue: -1 } }),
      C("維持訓練，利用零碎時間讀書", { resilience: 2, pressure: 2 }, ["balanced_both_at_cost"], "你把每天塞得很滿，兩邊都沒有放棄，睡眠卻開始不足。", { academicEffects: { academics: 1, burnout: 2 }, bodyEffects: { fatigue: 2 } }),
      C("全力準備大賽，考試之後再補", { confidence: 1, instinct: 1 }, ["chose_tournament_over_school"], "你把這次曝光機會放在最前面，也讓家庭開始擔心長期選擇。", { academicEffects: { academics: -2, motivation: 2 }, relationshipEffects: { coachTrust: 1 } })
    ]
  },
  junior_tournament: {
    title: "地區大賽：你是否先發",
    text() {
      const trust = player.relationships.coachTrust;
      const condition = player.body.pain + player.body.fatigue;
      if (trust >= 8 && condition <= 5) return "名單上，你的名字排在先發。教練只說：『你是靠讓人放心拿到的，不代表今天不會失去。』";
      if (condition >= 7) return "你的名字在替補區。教練看了一眼你的肩膀：『我知道你想上，但我也要決定你能不能撐完整場。』";
      return "你和高橋被列為輪替。誰先上場，要看比賽前最後一輪守備。";
    },
    choices: [
      C("接受教練安排，準備自己的任務", { discipline: 1, responsibility: 1 }, ["accepted_tournament_role"], "無論先發或替補，你先把自己可能接到的任務想清楚。", { relationshipEffects: { coachTrust: 1 }, matchEffects: { performance: 2 } }),
      C("主動爭取先發，說明自己能做什麼", { confidence: 2, pressure: 1 }, ["argued_for_tournament_start"], "你沒有只說『我想上』，而是說明自己能替球隊完成什麼。", { relationshipEffects: { coachTrust: 1 }, matchEffects: { performance: 2 } }),
      C("若肩膀不對勁，主動退出先發競爭", { responsibility: 2, resilience: 1 }, ["withdrew_for_health"], "你放棄一次大賽先發，也第一次主動替更長的生涯做決定。", { bodyEffects: { pain: -1, injuryRisk: -2 }, academicEffects: { burnout: -1 } })
    ]
  },
  takahashi_school_question: {
    title: "如果去不同的學校",
    text() {
      const mood = player.impression.takahashi.respect >= 5 ? "高橋等所有人離開才把簡章折起來。『如果去不同學校，我們還算對手嗎？』他沒有看你，卻沒有先走。" : player.impression.takahashi.underestimate >= 5 ? "高橋看著你的簡章：『你要去哪裡都可以。只是別以為我們現在還在同一條線上。』" : "高橋把兩張不同學校的簡章並排放在長椅上：『下一次比較，可能不是每天放學後了。』";
      return `${mood}\n\n這不是選校決定，卻會決定你們把這段競爭帶到哪裡。`;
    },
    choices: [
      C("說下次要在正式大賽分勝負", { confidence: 2 }, ["takahashi_school_question_done", "promised_official_rematch"], "高橋只回答『好』，把其中一張簡章收進球袋。", { personalityEffects: { brave: 1, ambitious: 1 }, impressionEffects: { takahashi: { respect: 2, rivalry: 2 } }, relationshipEffects: { rivalCompetition: 2 }, arcEffects: { takahashi: "rival" } }),
      C("問他是否想去同一所學校", { observe: 1, pressure: 1 }, ["takahashi_school_question_done", "asked_same_school"], "高橋沉默很久：『同隊也可以比。但別因為我選。』", { personalityEffects: { thoughtful: 1, kind: 1 }, impressionEffects: { takahashi: { respect: 1 } }, arcEffects: { takahashi: "same_school" } }),
      C("說對手不必一直出現在身邊", { responsibility: 1 }, ["takahashi_school_question_done", "defined_rivalry_apart"], "高橋把球丟給你一次，像替這段每天見面的競爭做最後確認。", { personalityEffects: { thoughtful: 1, reliable: 1 }, impressionEffects: { takahashi: { respect: 2 } }, arcEffects: { takahashi: "rival" } })
    ]
  },
  yamamoto_recommendation: {
    title: "推薦信沒有只寫能力",
    text() {
      const azhe = player.characterArc.azhe === "distant" ? "阿哲的離隊消息沒有由他親口告訴你。" : player.characterArc.azhe === "dependent" ? "阿哲仍在等你替他回答該不該留下。" : "阿哲正決定要用什麼方式留在棒球裡。";
      const taka = player.characterArc.takahashi === "same_school" ? "高橋把同一所學校的簡章留在長椅上。" : "高橋已經把下一次勝負約在不同學校的球場。";
      return `少棒恩師山本把推薦信放進沒有封口的信封，讓你先讀。這封信只證明他在少棒時期親眼看見的你；高中是否採用、如何安排，仍由現任球隊決定。\n\n${generateCoachRecommendation()}\n\n${azhe}\n${taka}\n\n你第一次看見，恩師記錄的不只是守位和成績，也是你怎麼對待一起走到這裡的人。`;
    },
    choices: [
      C("請恩師保留原文，直接封口", { resilience: 1 }, ["yamamoto_recommendation_done", "accepted_coach_recommendation"], "少棒恩師山本沒有再補一句鼓勵，只在封口前確認你的校名。", { impressionEffects: { coach: { dependable: 1 } }, arcEffects: { yamamoto: "recommendation" } }),
      C("請教練把自己的缺點也寫清楚", { confidence: 1, observe: 1 }, ["yamamoto_recommendation_done", "requested_honest_recommendation"], "教練加上一句風險評語：『願意修正，不代表每次都能及時開口。』", { personalityEffects: { brave: 1, thoughtful: 1 }, impressionEffects: { coach: { dependable: 1 } }, arcEffects: { yamamoto: "recommendation" } }),
      C("問他為什麼沒有多寫比賽成績", { pressure: 1 }, ["yamamoto_recommendation_done", "questioned_recommendation_focus"], "教練把筆放下：『成績表學校自己會看。我寫的是他們看不到的部分。』", { personalityEffects: { ambitious: 1 }, impressionEffects: { coach: { competitive: 1 } }, arcEffects: { yamamoto: "recommendation" } })
    ]
  },
  junior_school_choice: {
    title: "三張高中簡章",
    text: "畢業前，桌上放著三張簡章：競爭激烈、曝光很高的強豪；能承諾較多出賽的普通高中；以及一所以課業為主、仍保留棒球隊的學校。",
    choices: [
      C("挑戰強豪高中", { confidence: 2, pressure: 2 }, ["chose_powerhouse_high_school"], "你選擇最擁擠的環境，接受可能長期坐板凳的風險。", { academicEffects: { motivation: 2, burnout: 1 }, personalityEffects: { ambitious: 2, brave: 1 }, impressionEffects: { family: { worry: 1, pride: 1 }, takahashi: { rivalry: 1 } } }),
      C("選擇能穩定競爭出賽的高中", { responsibility: 1, observe: 1 }, ["chose_playing_time_high_school"], "你把上場與成長放在名氣之前。", { academicEffects: { motivation: 1 }, personalityEffects: { thoughtful: 2, ambitious: 1 }, impressionEffects: { coach: { dependable: 1 }, family: { pride: 1 } } }),
      C("選擇兼顧課業的學校", { discipline: 1, responsibility: 2 }, ["chose_balanced_high_school"], "你沒有離開棒球，只是不願讓它成為唯一的未來。", { academicEffects: { academics: 2, burnout: -1 }, personalityEffects: { thoughtful: 1, reliable: 2 }, impressionEffects: { family: { pride: 2 } } })
    ]
  },
  junior_season_result: {
    title: "青少棒階段結算：前往青棒",
    text() {
      const fit = player.juniorSchoolFit || {};
      return `${player.juniorSeasonResult}\n\n${player.juniorSeasonDetail}\n\n高中方向：${player.highSchoolRoute}\n入口適配：${fit.label || "待評估"}\n${(fit.reasons || []).join("；")}\n${fit.recovery ? `後續修正：${fit.recovery}\n` : ""}課業：${player.academics}　動機：${player.motivation}　倦怠：${player.burnout}\n疲勞：${player.body.fatigue}　傷病風險：${player.body.injuryRisk}\n\n有高中可去，不等於已找到適合這一輪球員的高中。`;
    },
    choices: [
      { text: "進入青棒第一年", nextChapter: "highSchool" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const highSchoolEvents = {
  high_school_intro: {
    title: "高中球場比記憶中更大",
    text() {
      const callbackEcho = hasCallback("takahashi_ten_ball", true) ? "高橋當年的十球挑戰仍留在你衡量競爭的方式裡。" : hasCallback("azhe_hidden_grounder", true) ? "你偶爾仍會想起阿哲反覆重做、卻沒被教練看見的那顆球。" : "";
      const past = `你帶著「${player.juniorSeasonResult || player.juniorResult || "尚未定型"}」的國中評語，以及${player.secondaryPosition ? `${player.seasonPosition}／${player.secondaryPosition}` : player.seasonPosition || "未定"}的守位履歷報到。${callbackEcho}`;
      if (player.highSchoolRoute.startsWith("強豪")) return `${past}\n\n報到第一天，休息區坐著十幾名和你守相同位置的球員。有人國中就是全國大賽主力，卻連一軍練習組都排不進去。你第一次明白，曝光最高的地方也可能最看不見你。`;
      if (player.highSchoolRoute.startsWith("普通")) return `${past}\n\n教練在報到表上圈起你的名字：『我們需要你盡快進入輪替。』這裡沒有滿牆獎盃，卻把真正的比賽責任直接放到你面前。`;
      return `${past}\n\n放學鐘響後，你得穿過半個校園才能趕到球場。隊友已開始熱身，而書包裡還放著明天要交的報告。你保留了多條道路，也必須每天重新安排它們。`;
    },
    choices: [
      C("先接受自己在新環境從零開始", { resilience: 2, discipline: 1 }, ["accepted_high_school_reset"], "你沒有把國中的位置當成高中理所當然的起點。", { highSchoolEffects: { dormStress: -1 } }),
      C("主動問教練最快的競爭方式", { confidence: 2, pressure: 1 }, ["asked_high_school_path"], "你第一天就把想爭取機會的意圖說清楚。", { relationshipEffects: { coachTrust: 1 }, highSchoolEffects: { exposure: 1 } }),
      C("先觀察訓練組與球隊階級", { observe: 2 }, ["observed_high_school_hierarchy"], "你開始看懂這支球隊如何分配資源與機會。", { skillEffects: { baseballIQ: 1 } })
    ]
  },
  high_school_load: {
    title: "第一次高強度訓練週",
    text() {
      const warning = player.body.injuryRisk >= 5 || hasFlag("continued_hiding_pain") ? "第三天，你熟悉的肩膀緊繃又回來了。這次訓練量比國中更高，身體不再允許你假裝過去沒有發生。" : "到第三天，腿像灌了水泥，揮臂速度也開始下降。高中訓練第一次逼你思考恢復，而不是只想多做幾次。";
      return `清晨體能、放學守備、晚間自主訓練連續排在一起。\n\n${warning}`;
    },
    choices: [
      C("完整回報身體狀況，調整訓練量", { responsibility: 2, discipline: 1 }, ["managed_high_school_load"], "你接受短期落後訓練進度，換取身體能繼續適應。", { bodyEffects: { fatigue: -2, injuryRisk: -2, pain: -1 }, relationshipEffects: { coachTrust: 1 } }),
      C("照表完成，但取消自主加練", { observe: 1, resilience: 1 }, ["cut_high_school_extra_work"], "你完成團隊要求，也第一次主動刪除不必要的額外負荷。", { bodyEffects: { fatigue: -1 }, academicEffects: { burnout: -1 } }),
      C("全部做完，不能第一週就落後", { confidence: 1, pressure: 2 }, ["overtrained_high_school"], "你撐過第一週，名字沒有掉出訓練組，身體風險卻繼續累積。", { bodyEffects: { fatigue: 3, injuryRisk: 2, pain: 1 }, highSchoolEffects: { exposure: 1 } })
    ]
  },
  high_school_life: {
    title: "球場之外也在消耗你",
    text() {
      if (player.highSchoolRoute.startsWith("強豪")) return "寮生活裡，學長決定洗澡順序、熄燈時間與公共區域工作。你很少真正獨處，連疲勞都得等到棉被裡才敢承認。";
      if (player.highSchoolRoute.startsWith("普通")) return "球隊人手不足，你除了訓練還得整理場地、協助學弟與記錄器材。上場機會多，責任也沒有替補。";
      return "課業老師提醒你缺交作業，教練則問你為什麼總是最後到場。沒有人要求你放棄其中一邊，但兩邊都只看見你缺席的部分。";
    },
    choices: [
      C("建立固定作息，把恢復排進行程", { discipline: 2, responsibility: 1 }, ["built_high_school_routine"], "你沒有增加一天的時間，只讓每段時間有清楚用途。", { bodyEffects: { recovery: 1, fatigue: -1 }, highSchoolEffects: { dormStress: -1 } }),
      C("多承擔團隊工作，先取得信任", { responsibility: 2, resilience: 1 }, ["carried_high_school_team_work"], "你在沒有上場時仍替球隊完成工作。", { relationshipEffects: { teammateBond: 2, coachTrust: 1 }, highSchoolEffects: { dormStress: 1 } }),
      C("把有限精力優先留給球場表現", { confidence: 1, instinct: 1 }, ["prioritized_high_school_performance"], "你減少其他投入，訓練狀況提高，人際與課業卻開始留下欠帳。", { academicEffects: { academics: -1, burnout: 1 }, relationshipEffects: { teammateBond: -1 } })
    ]
  },
  high_school_role: {
    title: "你在高中球隊的第一個角色",
    text() {
      const route = player.highSchoolRoute;
      if (route.startsWith("強豪")) return "一軍名單暫時沒有你的名字。教練問你是否願意先成為守備與跑壘替補，等待少量但真實的機會。";
      if (route.startsWith("普通")) return `教練準備讓你以${player.seasonPosition}進入先發輪替，但要求你同時支援另一個位置。`;
      return "教練願意讓你參與週末比賽，但平日訓練時數不足，你必須選擇最值得保留的能力。";
    },
    choices: [
      C("接受工具人、代跑與替補角色", { responsibility: 2, resilience: 1 }, ["accepted_high_school_utility_role"], "你先爭取被帶進比賽，而不是堅持理想位置。", { skillEffects: { baseRunning: 2, baseballIQ: 1 }, relationshipEffects: { coachTrust: 2 } }),
      C("集中原守位，等待完整競爭機會", { confidence: 2, pressure: 1 }, ["focused_high_school_position"], "你接受機會更少，也希望用專精建立不可替代性。", { positionSkillEffects: { "內野手": { catching: 1, reaction: 2 }, "外野手": { range: 2, armStrength: 1 }, "捕手": { blocking: 1, gameCalling: 2 }, "投手": { control: 2, pitchStamina: 1 } }, highSchoolEffects: { exposure: 1 } }),
      C("優先發展打擊，增加上場入口", { instinct: 1, discipline: 1 }, ["developed_high_school_bat"], "你開始把打擊視為跨過守位競爭的另一扇門。", { skillEffects: { batting: 3 }, bodyEffects: { fatigue: 1 } })
    ]
  },
  high_school_showcase: {
    title: "球探第一次坐在看台上",
    text() {
      const contextResult = CoachResponseFlow.createCoachResponseContext(
        "high_school_showcase",
        null
      );
      if (!contextResult.ok) throw new Error(contextResult.error);
      const responseResult = CoachResponseFlow.resolveCoachResponse(
        contextResult.context
      );
      if (!responseResult.ok) throw new Error(responseResult.error);
      const narrativeResult = CoachResponseFlow.applyCoachResponse(
        responseResult
      );
      if (!narrativeResult.ok) throw new Error(narrativeResult.error);

      const chance = narrativeResult.category === "early-opportunity" ? "教練在第五局讓你上場，並在名單旁寫下你的兩個守位。" : "你直到第七局才被叫去熱身。看台上的球探已收起一部分資料，但還沒有離開。";
      return `秋季交流賽，看台後方坐著一名拿測速槍與筆記本的人。\n\n${chance}\n\n這可能只是普通觀察，也可能是你第一次被棒球市場看見。`;
    },
    choices: [
      C("完成球隊任務，不改變平常打法", { discipline: 1, resilience: 1 }, ["showcase_team_task"], "你沒有為球探改變處理方式，留下穩定但不突出的紀錄。", { matchEffects: { performance: 2 }, highSchoolEffects: { exposure: 1, scoutEvaluation: 2 } }),
      C("主動展現守位最醒目的工具", { confidence: 2, pressure: 2 }, ["showcase_tools"], "你留下該守位最容易被看見的一次亮點，也出現一次過於急躁的處理。", { positionSkillEffects: { "內野手": { throwing: 1, reaction: 1 }, "外野手": { armStrength: 2, range: 1 }, "捕手": { throwing: 1, blocking: 1 }, "投手": { armStrength: 2, control: 1 } }, matchEffects: { performance: 2, errors: 1 }, highSchoolEffects: { exposure: 2, scoutEvaluation: 2 }, bodyEffects: { fatigue: 1 } }),
      C("用站位與指揮展現理解力", { observe: 2, responsibility: 1 }, ["showcase_baseball_iq"], "球探未必記得你的速度，卻記下你在球出手前就讀懂局面。", { skillEffects: { baseballIQ: 1 }, positionSkillEffects: { "內野手": { reaction: 1 }, "外野手": { range: 1 }, "捕手": { gameCalling: 2 }, "投手": { control: 1 } }, highSchoolEffects: { exposure: 1, scoutEvaluation: 3 } })
    ]
  },
  high_school_scout_feedback: {
    title: "球探沒有給你答案",
    text() {
      const contextResult = NarrativeConditionFlow.createNarrativeContext(
        "high_school_scout_feedback"
      );
      if (!contextResult.ok) throw new Error(contextResult.error);
      const responseResult = NarrativeConditionFlow.resolveNarrativeCondition(
        contextResult.context
      );
      if (!responseResult.ok) throw new Error(responseResult.error);
      const narrativeResult =
        NarrativeConditionFlow.applyNarrativeCondition(responseResult);
      if (!narrativeResult.ok) throw new Error(narrativeResult.error);

      const evalText = narrativeResult.category === "recognized" ? "球探透過教練留下一句話：『現在不是明星，但有可使用的位置價值。』" : "球探的筆記沒有留下明確評語。教練只說，沒被否定不等於已經被看見。";
      return `${evalText}\n\n你必須決定，下一年要用什麼方式提高自己的價值。`;
    },
    choices: [
      C("繼續增加多位置與戰術價值", { observe: 1, responsibility: 1 }, ["high_school_commit_utility"], "你接受自己可能不是球星，卻能成為球隊很難取代的人。", { skillEffects: { baseballIQ: 2 }, highSchoolEffects: { scoutEvaluation: 1 } }),
      C("集中打擊與身體能力，追求更高上限", { confidence: 1, instinct: 1 }, ["high_school_commit_upside"], "你選擇提高被看見的上限，也接受更高訓練與傷病風險。", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 2, injuryRisk: 1 }, highSchoolEffects: { exposure: 1 } }),
      C("先確保健康與課業，不追逐一次評價", { discipline: 1, responsibility: 2 }, ["high_school_commit_balance"], "你不讓第一次球探評語決定整個高中生活。", { bodyEffects: { injuryRisk: -1, fatigue: -1 }, academicEffects: { academics: 1, burnout: -1 } })
    ]
  },
  high_school_result: {
    title: "青棒第一年評估",
    text() {
      const value = player.highSchoolValueAssessment || {};
      return `${player.highSchoolResult}\n\n${player.highSchoolDetail}\n\n球隊角色：${player.highSchoolTeamRole}\n角色建立：${value.label || "待評估"}\n${(value.reasons || []).join("；")}\n${value.recovery ? `下一步：${value.recovery}\n` : ""}曝光：${player.exposure}　球探評價：${player.scoutEvaluation}\n疲勞：${player.body.fatigue}　傷病風險：${player.body.injuryRisk}　倦怠：${player.burnout}\n\n取得任務只是入口；方向、能力與實際證明同時成立，才算建立球隊能描述的價值。`;
    },
    choices: [
      { text: "進入青棒關鍵年與生涯出口", nextChapter: "criticalYear" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const criticalYearEvents = {
  critical_offseason: {
    title: "最後一個完整休賽季",
    text() {
      const role = player.highSchoolTeamRole || "尚未固定的角色";
      return `升上高三前，你在球隊的定位是「${role}」。\n\n教練提醒，下一個夏天之後，球探、大學與業餘隊不再只看潛力，而會問你現在能替一支球隊做什麼。你只能把有限的恢復與訓練時間押在一個方向。`;
    },
    choices: [
      C("強化多位置與戰術執行", { observe: 1, responsibility: 2 }, ["critical_invest_utility"], "你把價值建立在主守位之外還能替球隊解決多少問題。", { skillEffects: { baseballIQ: 1 }, positionSkillEffects: { "內野手": { catching: 1, throwing: 1 }, "外野手": { range: 1, throwing: 1 }, "捕手": { blocking: 1, gameCalling: 1 }, "投手": { control: 1, pitchStamina: 1 } }, careerEffects: { reputation: 1 } }),
      C("集中打擊與爆發力", { confidence: 1, instinct: 2 }, ["critical_invest_offense"], "你追求最容易被球探看見的成長，也增加身體負荷。", { skillEffects: { batting: 3 }, bodyEffects: { fatigue: 2, injuryRisk: 1 }, careerEffects: { exposure: 1 } }),
      C("先完成身體重整與恢復", { discipline: 2, responsibility: 1 }, ["critical_invest_health"], "你放棄部分短期進步，把最後一季的可用性放在第一位。", { bodyEffects: { fatigue: -3, pain: -2, injuryRisk: -2, recovery: 1 } })
    ]
  },
  critical_tournament: {
    title: "夏季大賽：沒有下一場保證",
    text() {
      const tracked = player.scoutEvaluation >= 4 ? "看台上有熟悉的球探，他已不是第一次來看你。" : "看台後方出現幾張陌生面孔，你不知道其中誰在記錄。";
      return `淘汰賽第六局，球隊落後一分，兩人出局、二壘有人。${tracked}\n\n你被安排上場。這個局面可能是高中生涯最後一次被正式記錄。`;
    },
    choices: [
      C("照教練任務，優先推進與延續攻勢", { discipline: 1, responsibility: 1 }, ["critical_team_baseball"], "你把球送往正確方向，並用判斷多推進一個壘包。你沒有成為英雄，卻讓攻勢繼續。", { skillEffects: { baseRunning: 1 }, matchEffects: { performance: 2 }, careerEffects: { recentPerformance: 2, reputation: 2, scoutEvaluation: 1 } }),
      C("鎖定能攻擊的球，追求致勝長打", { confidence: 2, pressure: 2 }, ["critical_chased_big_hit"], "你揮向最有把握的一球。擊球很強，卻直接飛進外野手手套。", { skillEffects: { batting: 1 }, careerEffects: { recentPerformance: 1, exposure: 2 } }),
      C("耐心選球，逼投手進入好球帶", { observe: 2, resilience: 1 }, ["critical_patient_plate"], "滿球數後你選到保送。球探記下的不是安打，而是你沒有被局面催促。", { skillEffects: { baseballIQ: 1 }, careerEffects: { recentPerformance: 2, scoutEvaluation: 2 } })
    ]
  },
  critical_injury: {
    title: "比賽後，手臂抬不起來",
    text() {
      const risky = player.body.injuryRisk >= 6 || hasFlag("continued_hiding_pain") || hasFlag("overtrained_high_school");
      return risky
        ? "賽後冰敷時，右肩的疼痛一路延伸到手臂。防護員說這不像單純疲勞，建議立即影像檢查。下一場同時有更多球探到場。"
        : "賽後你的手臂異常沉重。防護員認為目前可能只是過度使用，但若繼續出賽，風險會快速上升。下一場同時有更多球探到場。";
    },
    choices: [
      C("接受檢查，退出下一場", { responsibility: 2, pressure: 2 }, ["critical_chose_medical_exam"], "你在最需要曝光時離開名單，卻取得完整診斷。", { bodyEffects: { pain: -1, injuryRisk: -2 }, careerEffects: { exposure: -1, reputation: 1 } }),
      C("和教練協商，只執行有限任務", { observe: 1, confidence: 1 }, ["critical_limited_role"], "你沒有完全退出，而是縮小守備與傳球負荷。", { bodyEffects: { fatigue: 1, injuryRisk: 1 }, relationshipEffects: { coachTrust: 1 }, careerEffects: { recentPerformance: 1 } }),
      C("隱瞞疼痛，把最後大賽打完", { resilience: 1, pressure: 3 }, ["critical_played_through_injury"], "你保住曝光，也讓一次可能恢復的傷勢變得更難預測。", { bodyEffects: { pain: 3, injuryRisk: 4 }, careerEffects: { exposure: 2, recentPerformance: 1 } })
    ]
  },
  critical_scout_interview: {
    title: "球探問：你覺得自己是什麼球員？",
    text() {
      const concern = player.body.injuryRisk >= 7 ? "他特別追問肩膀狀況與過去的疼痛紀錄。" : "他翻著比賽紀錄，沒有透露目前把你排在哪裡。";
      return `大賽後，一名球探透過教練和你談了十分鐘。${concern}\n\n最後，他問：『如果進到更高層級，你憑什麼留下來？』`;
    },
    choices: [
      C("我能守多個位置，理解球隊需要", { confidence: 1, responsibility: 1 }, ["scout_pitch_utility"], "你沒有把自己說成明星，而是說明可使用性。", { careerEffects: { scoutEvaluation: 2, reputation: 1 } }),
      C("我的上限還沒完全被看見", { confidence: 2, pressure: 1 }, ["scout_pitch_upside"], "你要求球探評估未來，而不只看現在。", { careerEffects: { scoutEvaluation: 1, exposure: 1 } }),
      C("先誠實說明傷勢與能完成的事", { responsibility: 2 }, ["scout_pitch_honest_health"], "你可能降低短期順位，卻避免讓球團從別處發現不同版本。", { careerEffects: { reputation: 2, scoutEvaluation: -1 }, bodyEffects: { injuryRisk: -1 } })
    ]
  },
  critical_family: {
    title: "家人問的不是夢想，是風險",
    text() {
      return `家人把大學招生資料、選秀報導和醫療單據放在桌上。\n\n『我們不是不支持你。只是如果順位很後、肩膀又需要時間，你希望我們怎麼陪你承擔？』\n\n這次選擇不只影響球場。`;
    },
    choices: [
      C("如果有球團願意選，就直接挑戰職棒", { confidence: 2, pressure: 2 }, ["family_declared_pro"], "你把最短、風險最高的道路說出口。", { careerEffects: { reputation: 1 } }),
      C("先以大學為主，保留選秀可能", { observe: 1, responsibility: 2 }, ["family_declared_college"], "你選擇更多成長時間，也接受未來可能不再被看見。", { academicEffects: { academics: 1 }, bodyEffects: { recovery: 1 } }),
      C("先把身體治好，再決定球員道路", { responsibility: 2, resilience: 1 }, ["family_declared_rehab"], "你沒有放棄夢想，只拒絕讓期限替身體做決定。", { bodyEffects: { injuryRisk: -2, pain: -1 }, careerEffects: { exposure: -1 } })
    ]
  },
  critical_exit_choice: {
    title: "畢業前的四條出口",
    text() {
      const interest = player.scoutEvaluation >= 5 ? "有球團表達後段順位或培訓興趣，但沒有任何保證。" : "目前沒有球團給出明確承諾。大學與業餘隊仍願意讓你參加測試。";
      return `${interest}\n\n高中棒球結束了。你必須選擇下一個願意承擔的風險。`;
    },
    choices: [
      C("提交選秀，接受任何順位", { confidence: 2 }, ["entered_high_school_draft"], "你把名字放進選秀名單，讓市場決定第一次職業答案。", { careerEffects: { exposure: 2 } }),
      C("進入大學，繼續成長與復健", { discipline: 1, responsibility: 1 }, ["chose_college_baseball"], "你選擇四年時間，期待把未完成的身體與技術接起來。", { academicEffects: { academics: 1 }, bodyEffects: { recovery: 1 } }),
      C("加入業餘／社會人體系", { resilience: 1, responsibility: 1 }, ["chose_amateur_baseball"], "你選擇在工作與棒球之間繼續等待晚成機會。", { careerEffects: { reputation: 1 } }),
      C("暫停正式競爭，優先完成復健", { responsibility: 2 }, ["chose_rehab_before_career"], "你暫時離開名單競爭，避免讓傷勢替整段人生下結論。", { bodyEffects: { pain: -2, injuryRisk: -2 } })
    ]
  },
  critical_year_result: {
    title: "青棒生涯出口評估",
    text() {
      return `${player.criticalYearResult}\n\n${player.criticalYearDetail}\n\n下一站：${player.careerExit}\n主要市場工具：${player.careerPrimaryTool}\n守位價值修正：+${getPositionCareerValue()}　進攻價值修正：+${getOffensiveCareerValue()}\n近期表現：${player.recentPerformance}　名聲：${player.reputation}\n球探評價：${player.scoutEvaluation}　曝光：${player.exposure}\n傷病風險：${player.body.injuryRisk}　疼痛：${player.body.pain}\n\n你離開高中時帶走的不只是成績，也帶著市場如何看你、身體還能承受什麼，以及家人願意共同承擔的現實。`;
    },
    choices: [
      { text: "進入十八歲生涯轉換期", nextChapter: "careerTransition" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const careerTransitionEvents = {
  transition_draft_day: {
    title: "選秀會：名字是否被念到",
    text() {
      return player.careerExit.includes("候選")
        ? "選秀進入中後段，你的名字終於被念到。掌聲沒有想像中巨大，球團代表很快補上一句：『我們看中的是多位置與可塑性。』你進入職棒，卻沒有任何位置保證。"
        : "正式順位一輪輪結束，你的名字沒有出現。散場前，一支球團詢問你是否願意參加培訓測試。這不是指名，只是一扇還沒關死的門。";
    },
    choices: [
      C("接受任何起點，先進入職業體系", { resilience: 2, responsibility: 1 }, ["accepted_low_pro_entry"], "你沒有把低順位或培訓身分當成羞辱。", { careerEffects: { reputation: 1 }, financeEffects: { finances: 1 } }),
      C("先確認養成計畫與守位需求", { observe: 2 }, ["asked_pro_development_plan"], "你先問球團打算如何使用你，而不是只問簽約金。", { careerEffects: { scoutEvaluation: 1 } }),
      C("要求時間評估，不立刻簽下去", { responsibility: 2, pressure: 1 }, ["delayed_pro_decision"], "你沒有因職棒兩個字放棄判斷風險。", { bodyEffects: { injuryRisk: -1 } })
    ]
  },
  transition_rookie_camp: {
    title: "新人營：職業球團先看你能不能被使用",
    text: "新人營第一週，教練讓你在三個守位輪轉，打擊練習卻排在最後一組。球團不是在尋找你最喜歡的位置，而是在測試名單哪裡能塞進你。",
    choices: [
      C("接受多位置測試，記住每組暗號", { discipline: 2, responsibility: 1 }, ["pro_accepted_utility_test"], "你用可使用性爭取留隊空間。", { skillEffects: { baseballIQ: 2, catching: 1 }, careerEffects: { reputation: 2 } }),
      C("集中展示最強守位與臂力", { confidence: 2, pressure: 1 }, ["pro_showed_primary_tool"], "你要求球團先看見自己的上限。", { skillEffects: { throwing: 2 }, bodyEffects: { fatigue: 1 }, careerEffects: { exposure: 1 } }),
      C("主動爭取額外打擊組數", { instinct: 1, resilience: 1 }, ["pro_fought_for_bats"], "你不想只被當成守備名額，卻也增加了新人營負荷。", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 2, injuryRisk: 1 } })
    ]
  },
  transition_college_arrival: {
    title: "大學報到：高中履歷歸零",
    text: "大學球隊有旅外落選者、甲組主力和傷後重來的球員。教練看完你的資料，只說：『高中定位不重要，先讓我看你現在能完成什麼。』",
    choices: [
      C("接受重新測試所有位置", { resilience: 2, observe: 1 }, ["college_reset_positions"], "你把大學當成重新定義球員類型的機會。", { skillEffects: { baseballIQ: 1 }, relationshipEffects: { coachTrust: 1 } }),
      C("以原本角色爭取立即輪替", { confidence: 2, pressure: 1 }, ["college_claimed_role"], "你用高中累積要求較快的上場路徑。", { careerEffects: { exposure: 1 } }),
      C("先完成身體評估與復健計畫", { responsibility: 2, discipline: 1 }, ["college_health_first"], "你讓大學的第一份進步來自身體可用性。", { bodyEffects: { injuryRisk: -2, recovery: 1 } })
    ]
  },
  transition_college_balance: {
    title: "大學不是延長版高中",
    text: "早八課程、重量訓練與客場比賽擠在一起。缺課會影響資格，少練則可能掉出輪替。你第一次必須自己管理整週，而不是等待教練安排。",
    choices: [
      C("建立課業與訓練的固定週表", { discipline: 2, responsibility: 1 }, ["college_built_schedule"], "你讓兩種身份都能被長期維持。", { academicEffects: { academics: 2, burnout: -1 } }),
      C("優先搶進主力，再補課業", { confidence: 1, pressure: 2 }, ["college_ball_first"], "你取得更多訓練曝光，學業風險也開始累積。", { careerEffects: { exposure: 2 }, academicEffects: { academics: -2, burnout: 1 } }),
      C("控制負荷，等待身體成熟", { observe: 1, resilience: 1 }, ["college_late_bloom_plan"], "你接受成長速度較慢，避免在第一年耗盡。", { bodyEffects: { fatigue: -2, injuryRisk: -1, maturity: 1 } })
    ]
  },
  transition_amateur_job: {
    title: "白天工作，晚上練球",
    text: "業餘隊提供器材與比賽，但你仍得完成白天工作。加班那天，隊友已開始打擊練習；準時離開公司，又可能影響收入與主管評價。",
    choices: [
      C("和主管談固定訓練日", { confidence: 1, responsibility: 2 }, ["amateur_negotiated_schedule"], "你把棒球需求放進現實協商，而不是每次臨時請假。", { financeEffects: { finances: 1 }, academicEffects: { burnout: -1 } }),
      C("工作優先，利用週末維持狀態", { discipline: 1, responsibility: 1 }, ["amateur_work_first"], "你的成長速度下降，經濟與生活先穩定下來。", { financeEffects: { finances: 2 }, careerEffects: { exposure: -1 } }),
      C("訓練優先，接受收入不穩", { resilience: 2, pressure: 2 }, ["amateur_baseball_first"], "你保留球員可能，也讓經濟壓力進入每天。", { careerEffects: { exposure: 1 }, financeEffects: { finances: -2 }, bodyEffects: { fatigue: 1 } })
    ]
  },
  transition_amateur_test: {
    title: "一場只有少數球探看的測試賽",
    text: "業餘盃賽來了兩名球探。他們主要看年輕投手，卻也可能注意能立即使用的成熟球員。你沒有高中明星光環，只剩當天能完成的內容。",
    choices: [
      C("展現穩定守備與戰術執行", { discipline: 1, responsibility: 1 }, ["amateur_showed_floor"], "你留下立即可用、風險較低的評價。", { careerEffects: { scoutEvaluation: 2, recentPerformance: 2 } }),
      C("挑戰長打與高難度動作", { confidence: 2, pressure: 1 }, ["amateur_showed_ceiling"], "你試著讓球探重新想像上限，也留下波動。", { careerEffects: { exposure: 2, recentPerformance: 1 }, matchEffects: { errors: 1 } }),
      C("主動提供多位置與健康資料", { observe: 1, responsibility: 2 }, ["amateur_presented_profile"], "你讓球探看見完整風險與用途，而不只是一場結果。", { careerEffects: { reputation: 2, scoutEvaluation: 1 } })
    ]
  },
  transition_rehab_plateau: {
    title: "復健進度停在百分之七十",
    text: "日常生活已不再疼痛，但高速傳球時肩膀仍會緊縮。醫療人員說你可以繼續復健，也可以接受某些能力可能回不到原點。",
    choices: [
      C("延長復健，不急著參加測試", { discipline: 2, resilience: 1 }, ["rehab_extended_timeline"], "你讓恢復進度決定時間，而不是畢業後的焦慮。", { bodyEffects: { pain: -2, injuryRisk: -2, recovery: 1 }, careerEffects: { exposure: -1 } }),
      C("改變傳球動作與守位需求", { observe: 2, responsibility: 1 }, ["rehab_changed_style"], "你接受原本球員樣貌可能回不來，開始建立替代方案。", { skillEffects: { baseballIQ: 2 }, bodyEffects: { pain: -1 } }),
      C("提早參加測試，確認自己還剩多少", { confidence: 2, pressure: 2 }, ["rehab_early_test"], "你得到真實回饋，也承擔復發風險。", { bodyEffects: { injuryRisk: 2, pain: 1 }, careerEffects: { exposure: 1 } })
    ]
  },
  transition_rehab_identity: {
    title: "沒有球隊制服的日子",
    text: "復健中心的人不會每天問你比賽結果。朋友開始大學生活或工作，你的日程只剩治療、訓練與等待。你第一次懷疑，如果不能當原本的球員，自己還是不是棒球人。",
    choices: [
      C("把復健本身當成新的訓練", { resilience: 2, discipline: 1 }, ["rehab_owned_process"], "你不再只用上場與否衡量一天。", { academicEffects: { burnout: -2 }, bodyEffects: { recovery: 1 } }),
      C("開始協助基層球隊，維持與棒球連結", { responsibility: 2, observe: 1 }, ["rehab_helped_youth"], "你在教別人時重新看見自己的棒球理解。", { careerEffects: { reputation: 2 }, skillEffects: { baseballIQ: 1 } }),
      C("暫時遠離球場，恢復普通生活", { responsibility: 1 }, ["rehab_took_distance"], "你允許自己不是每一天都必須證明還能回去。", { academicEffects: { burnout: -2 }, bodyEffects: { fatigue: -2 } })
    ]
  },
  transition_pro_roster_window: {
    title: "第一次升降窗口",
    text: "球團一軍出現傷兵，臨時空出一個名額。你和同期新人都在候選名單裡：他身體狀況更穩定，只有一個守位特別明確；你不一定比較弱，卻需要更多句話才能說清楚用途。名單會議比較的不只是哪個人更強，也比較此刻的一軍究竟缺誰。",
    choices: [
      C("接受短期工具人任務", { discipline: 1, responsibility: 2 }, ["pro_roster_utility"], "二軍教練把第二守位、代跑、牛棚接捕與臨時守備寫進你的任務表。你更容易被塞進短期名單，代價是主守位專精時間被切成更小的區塊。", { skillEffects: { baseballIQ: 1, catching: 1 }, careerEffects: { reputation: 2, exposure: 1 }, bodyEffects: { fatigue: 1 } }),
      C("要求用主守位進行直接比較", { confidence: 2, pressure: 2 }, ["pro_roster_primary_showdown"], "教練同意安排一次同守位測試。這可能改寫球團給你的標籤；如果沒有拉開差距，本次窗口也會直接交給用途更清楚的同期新人。", { careerEffects: { exposure: 2, recentPerformance: 2 }, bodyEffects: { fatigue: 1 } }),
      C("完整說明健康與負荷限制", { responsibility: 2, observe: 1 }, ["pro_roster_health_limit"], "防護員把疼痛、恢復速度、可承擔局數與不宜連續使用的方式放進報告。名單會議少了一項立即升格的理由，卻多了一份組織敢長期採信的健康資料。", { bodyEffects: { pain: -1, injuryRisk: -2, recovery: 1 }, careerEffects: { reputation: 2, exposure: -1 } })
    ]
  },
  transition_college_eligibility: {
    title: "資格、主力與選秀窗口",
    text: "全國賽前，主力位置突然空了出來。你有機會進入輪替，但一門課的出席與成績也來到參賽資格警戒線。助教把補課期限圈在行事曆上，教練則把追加訓練排在同一個下午。大學給了你更多發展時間，學籍與參賽資格也替這段時間畫出邊界。",
    choices: [
      C("先處理資格，再爭取輪替", { discipline: 2, responsibility: 2 }, ["college_secured_eligibility"], "你和教授、助教及教練重排補課與訓練。參賽資格暫時保住，別人則先拿走額外守備組數；你的順位成長變慢，但整個賽季仍在。", { academicEffects: { academics: 2, burnout: -1 }, careerEffects: { exposure: -1 } }),
      C("先搶下主力，再處理學業", { confidence: 2, pressure: 2 }, ["college_chased_starting_job"], "你把全國賽前的訓練排在最前面，得到更多被比較的球數。成績單上的警示沒有消失，疲勞和倦怠也開始影響下一週；教練仍未承諾主力。", { careerEffects: { exposure: 2, recentPerformance: 2 }, academicEffects: { academics: -2, burnout: 2 }, bodyEffects: { fatigue: 2 } }),
      C("放棄這次競爭，延長發展時間", { observe: 1, resilience: 2 }, ["college_delayed_competition"], "你把名字從這次追加測試移開，公開舞台因此少了一次。身體、學籍與下一學期的訓練計畫被完整保留下來，只是下一次空缺何時出現，沒有人能先答應。", { bodyEffects: { fatigue: -2, injuryRisk: -1, maturity: 1 }, academicEffects: { academics: 1, burnout: -1 }, careerEffects: { exposure: -2 } })
    ]
  },
  transition_amateur_company_conflict: {
    title: "公司要你留下，球隊也要你報到",
    text: "公司專案進入最後整合，全組今晚都要留下；同一時間，球隊正在進行都市對抗賽最後名單測試。主管並不反對你打球，教練也知道你需要這份工作，但今天兩邊都缺少能接手你任務的人。",
    choices: [
      C("和主管協商交換班與完成期限", { responsibility: 2, confidence: 1 }, ["amateur_negotiated_conflict"], "你先完成能交付的部分，和同事換班，承諾賽後補回工時。公司與球隊都保留了一部分信用，人情、睡眠和恢復時間則一起被借到明天。", { financeEffects: { finances: 1 }, careerEffects: { reputation: 1, exposure: 1 }, bodyEffects: { fatigue: 2 } }),
      C("留在公司完成專案", { discipline: 1, responsibility: 2 }, ["amateur_chose_company"], "主管把最終版本交給你收尾，工作與收入信用上升。球隊測試照常進行，另一名球員接走了原本屬於你的比較球數。", { financeEffects: { finances: 2 }, careerEffects: { exposure: -2, recentPerformance: -1 } }),
      C("直接請假參加名單測試", { confidence: 2, pressure: 2 }, ["amateur_chose_roster_test"], "你在測試開始前趕到球場，取得正式被比較的機會。手機裡同時留下主管未讀的排班訊息；名單尚未公布，收入與職場信用已先付出代價。", { careerEffects: { exposure: 2, recentPerformance: 1 }, financeEffects: { finances: -2 }, bodyEffects: { fatigue: 1 }, academicEffects: { burnout: 1 } })
    ]
  },
  transition_rehab_reentry_deadline: {
    title: "測試邀請只保留到月底",
    text: "一支業餘隊願意把月底測試留給你。醫療報告顯示日常動作已不再疼痛，高速傳球卻仍有波動；多等六到八週可能恢復得更完整，球隊也說不保證屆時還有名額。你必須決定，願意在什麼恢復程度重新接受競爭。",
    choices: [
      C("接受測試，但限制負荷與任務", { responsibility: 2, observe: 1 }, ["rehab_tested_with_limits"], "你只接受有限守備、指定局數與有限打席，不做最大強度傳球。球隊留下你的測試資料，也在旁邊註記負荷受限；入口仍在，復發風險沒有消失。", { careerEffects: { exposure: 1, scoutEvaluation: 1, reputation: 1 }, bodyEffects: { injuryRisk: 1, fatigue: 1 } }),
      C("放棄本次測試，完成復健", { discipline: 2, resilience: 1 }, ["rehab_skipped_reentry_test"], "你回覆球隊不參加月底測試，讓醫療進度繼續決定訓練強度。這個名額不會等你，下一次邀請也沒有日期；肩膀則得到完整恢復的時間。", { bodyEffects: { pain: -1, injuryRisk: -2, recovery: 2 }, careerEffects: { exposure: -2 } }),
      C("不限制強度，完整測試自己", { confidence: 2, pressure: 3 }, ["rehab_full_reentry_test"], "你要求和其他人接受同一套測試，讓球隊看到最接近完整球員的版本。最後幾次高速傳球後，肩膀重新出現緊繃；測試結果尚未公布，疼痛與復發風險已寫回醫療紀錄。", { careerEffects: { exposure: 3, recentPerformance: 2 }, bodyEffects: { pain: 2, injuryRisk: 3, fatigue: 2 } })
    ]
  },
  transition_result: {
    title: "十八歲生涯轉換期評估",
    text() {
      return `${player.transitionResult}\n\n${player.transitionDetail}\n\n目前組織角色：${player.organizationRole}\n主要市場工具：${player.careerPrimaryTool}\n進攻評價：${calculateOffensiveRating()}\n經濟穩定：${player.finances}　曝光：${player.exposure}\n球探評價：${player.scoutEvaluation}　恢復力：${player.body.recovery}\n\n四條出口沒有高低之分，只把你帶進不同的風險、時間尺度與棒球生活。`;
    },
    choices: [
      { text: "進入二十至二十二歲發展期", nextChapter: "developmentYears" },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const developmentEvents = {
  development_daily_life: {
    title: "這條路兩年後的普通早晨",
    text() {
      const role = `兩年前你被整理成「${player.organizationRole || "尚待觀察"}」，主要市場工具是${player.careerPrimaryTool || "綜合能力"}。`;
      if (player.careerExit.startsWith("高卒")) return `${role}\n\n早上七點，你已在二軍球場貼紮。昨天沒有出賽，今天也不保證有打席。職業生活最難適應的不是強度，而是每天都像可能被評估的普通日子。`;
      if (player.careerExit === "大學棒球") return `${role}\n\n早八點名結束後，你帶著早餐趕往重量室。大二球員不再被當新生照顧，卻還沒有主力身分可以保護。`;
      if (player.careerExit === "業餘／社會人棒球") return `${role}\n\n打卡後，你先確認今晚能不能準時離開公司。週末賽事將有球探，但主管剛通知部門可能加班。`;
      return `${role}\n\n復健中心開門時，你已做完第一組熱身。疼痛下降了，球隊邀請卻沒有因此自動回來。`;
    },
    choices: [
      C("照固定流程完成，不追逐每天的情緒", { discipline: 2, resilience: 1 }, ["development_kept_routine"], "你用規律抵抗不確定。", { bodyEffects: { injuryRisk: -1 } }),
      C("每天多做一項能被看見的內容", { confidence: 1, pressure: 1 }, ["development_sought_notice"], "你增加被評估的機會，也增加長期消耗。", { careerEffects: { exposure: 1 }, bodyEffects: { fatigue: 1 } }),
      C("先確認生活與身體能長期維持", { responsibility: 2 }, ["development_protected_life"], "你不讓短期焦慮破壞整條道路。", { financeEffects: { finances: 1 }, academicEffects: { burnout: -1 } })
    ]
  },
  development_competition: {
    title: "組織裡出現新的競爭者",
    text() {
      const echo = getCareerArcNpcEcho();
      if (player.careerExit.startsWith("高卒")) return `球團又選進一名和你功能相似、年紀更小的球員。教練開始把有限守備局數分給他。\n\n${echo}`;
      if (player.careerExit === "大學棒球") return `一名身體成熟的新生直接進入一軍練習組。你等待兩年的位置，他第一週就站了上去。\n\n${echo}`;
      if (player.careerExit === "業餘／社會人棒球") return `球隊找來曾待過職棒二軍的前球員。你的穩定不再稀有，上場順位開始下降。\n\n${echo}`;
      return `同一場測試裡，其他復健球員的球速和跑速已接近原本水準。你的恢復曲線看起來最慢。\n\n${echo}`;
    },
    choices: [
      C("強化自己最難被取代的能力", { discipline: 1, confidence: 1 }, ["development_specialized"], "你停止平均分配時間，開始建立與守位一致的清楚標籤。", { positionSkillEffects: { "內野手": { reaction: 2, baseballIQ: 1 }, "外野手": { range: 2, armStrength: 1 }, "捕手": { gameCalling: 2, blocking: 1 }, "投手": { control: 2, pitchStamina: 1 }, default: { baseballIQ: 2, catching: 1 } }, careerEffects: { reputation: 1 } }),
      C("增加第二守位、代跑與不同任務", { observe: 1, responsibility: 1 }, ["development_expanded_role"], "你沒有只守住舊位置，而是把主守位能力轉換成另一種用途。", { skillEffects: { baseRunning: 1 }, positionSkillEffects: { "內野手": { catching: 1, baseballIQ: 1 }, "外野手": { range: 1, baseballIQ: 1 }, "捕手": { gameCalling: 1, baseballIQ: 1 }, "投手": { control: 1, baseballIQ: 1 }, default: { catching: 1 } } }),
      C("正面比較，要求公平測試", { confidence: 2, pressure: 2 }, ["development_demanded_trial"], "你取得一次明確比較，也把結果風險放到檯面上。", { careerEffects: { exposure: 1, recentPerformance: 1 } }),
      C("放棄平均成長，把名額押在打擊上", { confidence: 2, discipline: 1, pressure: 1 }, ["development_bat_first"], "你要求教練用打席而不是守位比較你；守備用途成長放慢，棒子成為續留條件。", { skillEffects: { batting: 3 }, bodyEffects: { fatigue: 2 }, careerEffects: { exposure: 1 } })
    ]
  },
  development_mentor: {
    title: "一名老球員看見你的用力方式",
    text() { return `一名即將離隊的老球員提醒：『你每次都像這是最後一次機會。這會讓教練知道你很拚，也會讓身體比機會更早用完。』\n\n${getCareerArcNpcEcho()}`; },
    choices: [
      C("請他教你如何準備長期賽季", { observe: 2, discipline: 1 }, ["learned_from_veteran"], "你開始學習如何把能力分配到整個賽季。", { bodyEffects: { recovery: 1, fatigue: -1 }, careerEffects: { reputation: 1 } }),
      C("告訴他自己沒有餘裕慢慢等", { confidence: 1, pressure: 2 }, ["told_veteran_urgency"], "你說出名單邊緣球員的時間壓力。", { careerEffects: { exposure: 1 } }),
      C("先觀察他的日常，不急著回答", { observe: 1 }, ["observed_veteran_routine"], "你發現老將的穩定來自許多不顯眼的小選擇。", { skillEffects: { baseballIQ: 1 }, academicEffects: { burnout: -1 } })
    ]
  },
  development_body_choice: {
    title: "身體恢復速度開始決定上場頻率",
    text() { return `連續賽程後，你需要比同隊年輕球員多一天才能恢復。檢查沒有新傷，但疲勞會讓反應、傳球與判斷一起下降。\n\n${getCareerArcNpcEcho()}`; },
    choices: [
      C("主動申請一次輪休", { responsibility: 2, pressure: 1 }, ["development_requested_rest"], "你放棄一次出場，保留後面幾週的可用性。", { bodyEffects: { fatigue: -3, injuryRisk: -1 }, careerEffects: { exposure: -1 } }),
      C("和教練協調較低負荷角色", { observe: 1, confidence: 1 }, ["development_adjusted_role"], "你沒有完全退出，而是改變使用方式。", { bodyEffects: { fatigue: -1 }, relationshipEffects: { coachTrust: 1 } }),
      C("照常出賽，機會不能讓給別人", { resilience: 1, pressure: 2 }, ["development_played_tired"], "你保住眼前順位，反應與疼痛風險卻開始惡化。", { bodyEffects: { fatigue: 3, injuryRisk: 2 }, careerEffects: { recentPerformance: 1 } })
    ]
  },
  development_opportunity: {
    title: "真正能改變評價的一次機會",
    text() {
      const context = player.careerExit.startsWith("高卒") ? "一軍主力臨時受傷，球團需要短期替補。" : player.careerExit === "大學棒球" ? "全國大賽前，主力因狀態下滑，教練開放最後一次競爭。" : player.careerExit === "業餘／社會人棒球" ? "都市對抗賽預選有多名球探到場，球隊讓你進入先發。" : "一支業餘隊願意在練習賽給你三局守備與兩個打席。";
      return `${context}\n\n這次機會不保證成功，但會留下比日常更重的紀錄。\n\n${getCareerArcNpcEcho()}`;
    },
    choices: [
      C("照自己的組織角色完成任務", { discipline: 1, responsibility: 1 }, ["development_completed_role"], "你沒有追逐英雄表現，留下穩定可用的紀錄。", { careerEffects: { recentPerformance: 3, reputation: 2, scoutEvaluation: 1 } }),
      C("主動擴大表現，爭取改變定位", { confidence: 2, pressure: 2 }, ["development_chased_breakthrough"], "你完成一個亮點，也出現一次冒進。", { careerEffects: { recentPerformance: 2, exposure: 2, scoutEvaluation: 1 }, matchEffects: { errors: 1 } }),
      C("如果身體有警訊，立即縮小任務", { responsibility: 2, observe: 1 }, ["development_health_limited_opportunity"], "你沒有榨乾這次機會，市場也會評估你的健康限制。", { bodyEffects: { injuryRisk: -1 }, careerEffects: { recentPerformance: 1, reputation: 1 } })
    ]
  },
  development_market: {
    title: "二十二歲市場重新評估",
    text() { const market = evaluateMarket(); return `職業球團、球探或組織教練重新整理名單。二十二歲不再只看潛力：守位用途、健康、近期表現與能否立即使用一起被放進評估。\n\n進攻 ${market.offense}　守備 ${market.defense}　工具性 ${market.utility}\n領導 ${market.leadership}　健康 ${market.health}`; },
    choices: [
      C("強調多位置與立即可用性", { responsibility: 1 }, ["market_presented_utility"], "你把自己定位成能快速填補名單缺口的人。", { careerEffects: { reputation: 2, scoutEvaluation: 1 } }),
      C("強調仍未完全開發的上限", { confidence: 2 }, ["market_presented_upside"], "你要求市場相信下一段成長，而不只購買現在。", { careerEffects: { exposure: 2, scoutEvaluation: 1 } }),
      C("完整揭露健康與負荷限制", { responsibility: 2 }, ["market_disclosed_health"], "你降低部分機會，也提高願意接手者對你的信任。", { careerEffects: { reputation: 2 }, bodyEffects: { injuryRisk: -1 } })
    ]
  },
  development_decision: {
    title: "如果下一次機會仍沒有來",
    text() { return `你已經二十二歲。繼續追逐球員道路仍合理，但時間、收入、身體與其他人生可能不會停止計算。你需要替下一段設定期限或新定義。\n\n${hasCallback("freedom_origin", false) ? "十歲時，你不願讓棒球只剩規矩。現在你才明白，自由也包括決定要用哪一種身分留下。" : getCallbackNarrative()}`; },
    choices: [
      C("再給自己兩年，全力追逐職業機會", { confidence: 2, pressure: 2 }, ["development_two_more_years"], "你替夢想設定新期限，也接受兩年後重新結算。", { careerEffects: { exposure: 1 }, financeEffects: { finances: -1 } }),
      C("繼續打球，但同步建立第二專長", { discipline: 1, responsibility: 2 }, ["development_dual_track"], "你不離開球場，也不再讓球員身分承擔全部人生。", { academicEffects: { academics: 1, burnout: -1 }, financeEffects: { finances: 1 } }),
      C("開始考慮教練、分析或球探角色", { observe: 2, responsibility: 1 }, ["development_baseball_second_role"], "你第一次主動想像，不以出賽為唯一形式的棒球人生。", { careerEffects: { reputation: 2 }, skillEffects: { baseballIQ: 1 } })
    ]
  },
  development_result: {
    title: "二十二歲職涯評估",
    text() {
      return `${player.developmentResult}\n\n${player.developmentDetail}\n\n市場結果：${player.marketOutcome}\n球員型態：${refreshPlayerArchetype()}\n系統角色：${player.roleIdentity.primary || player.organizationRole}\n過去角色：${player.roleIdentity.previous.join(" → ") || "尚無"}\n生涯階段：${player.careerArc.stage}\n生涯價值：目前 ${player.careerValue.current}／最高 ${player.careerValue.peak}／最低 ${player.careerValue.minimum}\n\n${generateCareerSummary()}\n\n人生記憶：\n${generateLifeStory()}\n\n這一生反覆回到的問題，是${getLifeThemeSummary()}。\n${getCallbackNarrative()}\n\n二十二歲不是所有人生的選秀終點，卻是第一次必須同時回答棒球與生活能否繼續的年紀。`;
    },
    choices: [
      { text: "完成二十二歲發展期測試", completeSlice: true },
      { text: "重新體驗另一條人生", restart: true }
    ]
  }
};

const pacingEvents = {
  competition_training_week: {
    title: "名單公布後的普通星期三",
    text: "沒有測驗、沒有觀眾，也沒有人特別盯著你。教練只安排四十顆重複球。位置競爭真正消耗人的，往往是這些不會被記進故事的下午。",
    choices: [
      C("每十球記錄一次失誤原因", { observe: 1, discipline: 1 }, ["logged_competition_reps"], "你讓重複練習留下紀錄，也多用掉一些恢復時間。", { skillEffects: { baseballIQ: 1, catching: 1 }, bodyEffects: { fatigue: 1 } }),
      C("和高橋輪流增加難度", { confidence: 1, pressure: 1 }, ["raised_drill_with_rival", "主動競爭"], "競爭讓普通練習更接近比賽，失敗壓力也跟著提高。", { relationshipEffects: { rivalRespect: 1, rivalCompetition: 1 }, skillEffects: { reaction: 1 }, bodyEffects: { fatigue: 1 } }),
      C("陪阿哲完成他的弱項", { responsibility: 1, fitness: -1 }, ["helped_teammate_drill"], "你犧牲部分個人球數，換來更好的隊形配合。", { relationshipEffects: { teammateBond: 2, coachTrust: -1 } })
    ]
  },
  competition_role_talk: {
    title: "如果不是先發，你還算球員嗎？",
    text: "阿哲問得很直接。高橋在不遠處整理手套，像是也在等你的答案。教練沒有參與這段對話，但你的回答會決定你如何理解競爭。",
    choices: [
      C("先把替補能做的任務做到最好", { resilience: 1, responsibility: 2 }, ["valued_bench_role"], "你把位置看成任務，而不只是身分。", { relationshipEffects: { coachTrust: 1, teammateBond: 1 }, personalityEffects: { reliable: 2, kind: 1 }, impressionEffects: { coach: { dependable: 2 }, azhe: { trusts: 1 } } }),
      C("我會繼續競爭，直到成為先發", { confidence: 2, pressure: 1 }, ["declared_starting_goal"], "你沒有貶低替補，也沒有放下先發目標。", { relationshipEffects: { rivalCompetition: 2 }, personalityEffects: { ambitious: 2, brave: 1 }, impressionEffects: { coach: { competitive: 1 }, takahashi: { rivalry: 2, respect: 1 } } }),
      C("我還不知道，但不想因名單討厭棒球", { observe: 1, resilience: 1 }, ["protected_love_of_game"], "你替競爭之外的自己保留一點空間。", { academicEffects: { burnout: -1 }, personalityEffects: { thoughtful: 2, emotional: 1 } }),
      C("守位排不到，就先靠棒子進打線", { confidence: 2, discipline: 1 }, ["declared_bat_first_role"], "你不放棄守備，但開始把打席視為另一條通往先發的路。", { skillEffects: { batting: 2 }, bodyEffects: { fatigue: 1 }, personalityEffects: { ambitious: 2, stubborn: 1 }, impressionEffects: { coach: { competitive: 2 }, takahashi: { rivalry: 1 } } })
    ]
  },
  junior_repetition: {
    title: "身體長大以前，動作先改變",
    text: "發育沒有照你的計畫前進。你只能在每天二十分鐘的基本動作裡，嘗試讓腳步、出手和站位先變得更有效率。",
    choices: [
      C("縮短多餘腳步", { discipline: 1, observe: 1 }, ["junior_cleaned_footwork"], "你的動作沒有更有力，卻少浪費了一點時間。", { skillEffects: { reaction: 1, range: 1 } }),
      C("加強核心、下肢與起跑動作", { fitness: 2 }, ["junior_built_foundation"], "你把尚未出現的力量，先建立在能承受它的身體和第一步上。", { skillEffects: { baseRunning: 1, armStrength: 1 }, bodyEffects: { stamina: 1, fatigue: 1 } }),
      C("用錄影比較自己和高橋", { observe: 2, pressure: 1 }, ["junior_used_video"], "你看見差距，也看見幾個不必等長高就能修正的地方。", { skillEffects: { baseballIQ: 1 } })
    ]
  },
  junior_home_night: {
    title: "回家後沒有人談棒球",
    text: "晚餐桌上，家人談工作、帳單和學校。你忽然發現，球隊裡巨大的問題在家裡只占很小一角。這讓你安心，也讓你有點孤單。",
    choices: [
      C("主動說出最近的競爭壓力", { confidence: 1, familySupport: 1, pressure: -1 }, ["shared_junior_pressure"], "你讓家人知道你在怕什麼，而不只報告結果。"),
      C("先聽家人的近況", { responsibility: 2 }, ["listened_to_family"], "你開始理解支持不是單向資源。", { academicEffects: { burnout: -1 } }),
      C("什麼都不說，早點休息", { discipline: 1 }, ["rested_without_explaining"], "你沒有得到安慰，但身體確實多休息了一晚。", { bodyEffects: { fatigue: -1 } })
    ]
  },
  junior_coach_preference: {
    title: "新教練喜歡另一種球員",
    text: "球隊助理教練換人。新教練偏好速度與攻擊性，原本重視的穩定和理解忽然不再是第一順位。能力沒變，評價環境卻變了。",
    choices: [
      C("學習他的要求，但保留自己的優勢", { observe: 1, discipline: 1 }, ["adapted_to_new_coach"], "你調整呈現方式，沒有把自己完全重做。", { relationshipEffects: { coachTrust: 1 }, skillEffects: { baseRunning: 1 } }),
      C("直接問清楚上場標準", { confidence: 2, pressure: 1 }, ["asked_new_coach_criteria"], "你得到明確標準，也失去假裝機會公平的空間。", { relationshipEffects: { coachTrust: 1 } }),
      C("維持原來方法，等待結果證明", { resilience: 1, instinct: 1 }, ["held_style_under_new_coach"], "你沒有迎合偏好，但上場機會變得更不確定。")
    ]
  },
  junior_after_loss: {
    title: "輸掉比賽後還要收球",
    text: "地區賽結束，球隊輸了。有人哭，有人怪裁判，教練要求所有人照常整理器材。失敗沒有戲劇性結束，只變成回家前還要完成的工作。",
    choices: [
      C("和隊友一起完成整理", { responsibility: 2, resilience: 1 }, ["worked_after_loss"], "你沒有用失望免除自己的責任。", { relationshipEffects: { teammateBond: 1 } }),
      C("先獨處十分鐘再回來", { observe: 1, pressure: -1 }, ["processed_loss_alone"], "你先讓情緒降下來，才回到隊伍。"),
      C("找教練檢討自己那一球", { discipline: 1, pressure: 1 }, ["reviewed_loss_immediately"], "你很快進入修正，也可能沒有給情緒足夠時間。", { skillEffects: { baseballIQ: 1 } })
    ]
  },
  high_school_long_bench: {
    title: "一個月沒有正式上場",
    text: "練習狀況不差，名單卻連續四週沒有你的名字。你開始熟悉替別人撿頭盔、記球數和在第七局才熱身的節奏。",
    choices: [
      C("把板凳資訊整理成對手筆記", { observe: 2, responsibility: 1 }, ["built_bench_report"], "你讓沒有上場的時間也能產生球隊價值。", { skillEffects: { baseballIQ: 2 }, relationshipEffects: { coachTrust: 1 } }),
      C("要求教練說明自己缺少什麼", { confidence: 2, pressure: 1 }, ["challenged_bench_feedback"], "答案不溫柔，但比猜測更有用。", { relationshipEffects: { coachTrust: 1 } }),
      C("增加自主訓練，逼出明顯進步", { resilience: 2 }, ["trained_through_bench"], "你的能力增加，疲勞也在無人注意時累積。", { bodyEffects: { fatigue: 2, injuryRisk: 1 }, skillEffects: { batting: 1 } })
    ]
  },
  high_school_call_home: {
    title: "寮裡熄燈後的一通電話",
    text: "家人問你高中生活好不好。走廊有人經過，你下意識把聲音壓低。說『很好』最簡單，但也會讓真正的疲勞只留在自己身上。",
    choices: [
      C("說出最近沒有上場的失落", { confidence: 1, pressure: -1 }, ["admitted_high_school_struggle"], "你沒有讓家人只看見堅強版本。", { academicEffects: { burnout: -1 } }),
      C("只報告訓練進度", { discipline: 1 }, ["reported_only_progress"], "你維持了讓人放心的形象，也繼續獨自承擔。"),
      C("先問家裡最近怎麼樣", { responsibility: 2 }, ["checked_family_from_dorm"], "你想起支持你的人也有自己的生活。", { highSchoolEffects: { dormStress: -1 } })
    ]
  },
  critical_public_attention: {
    title: "地方媒體寫了你的名字",
    text: "一篇大賽報導提到你的多位置或關鍵表現。內容只有兩行，卻被同學、家人與球探轉傳。第一次被看見，並沒有自動告訴你該怎麼回應。",
    choices: [
      C("把注意力留在下一場任務", { discipline: 2 }, ["stayed_grounded_after_media"], "你沒有否認喜悅，也沒有讓兩行文字改變訓練。", { careerEffects: { reputation: 1 } }),
      C("利用機會主動展示更多能力", { confidence: 2, pressure: 1 }, ["used_media_momentum"], "你增加曝光，也提高下一次表現被比較的壓力。", { careerEffects: { exposure: 2 } }),
      C("擔心報導提到傷勢，先和教練確認", { responsibility: 1, observe: 1 }, ["managed_media_health_story"], "你開始理解公開資訊也會影響市場評價。", { careerEffects: { reputation: 1 }, bodyEffects: { injuryRisk: -1 } })
    ]
  },
  critical_farewell: {
    title: "最後一次替高中球場整地",
    text: "畢業前，學弟接過你用過的耙子。那些曾經讓你覺得浪費時間的整理工作，忽然有了最後一次。球場不會因你離開而停下。",
    choices: [
      C("把自己的守備筆記留給學弟", { responsibility: 2 }, ["left_notes_for_juniors"], "你留下的不只是成績，也有別人能繼續使用的方法。", { careerEffects: { reputation: 2 } }),
      C("和高橋重新談起第一次競爭", { resilience: 1, confidence: 1 }, ["closed_rivalry_with_takahashi"], "你們沒有分出永遠的勝負，卻承認彼此改變了對方。", { relationshipEffects: { rivalRespect: 2 } }),
      C("一個人走過所有守過的位置", { observe: 1, pressure: -1 }, ["walked_old_positions"], "你記住每個位置曾要求你成為什麼樣的人。")
    ]
  },
  transition_checkpoint: {
    title: "三個月後，這條路真正的日常",
    text() {
      const texts = {
        "高卒": "職業球團的每一天都有人被升降。你開始明白，昨天表現好只代表今天仍有訓練位置。",
        "大學棒球": "新生期過去，課表、重量訓練和學長競爭成為固定生活。大學四年忽然沒有想像中長。",
        "業餘／社會人棒球": "薪資入帳、加班通知和週末賽程同時出現在手機裡。棒球開始和生活共享同一個行事曆。",
        "復健與生涯暫停": "復健進度不再每週明顯增加。真正困難的變成接受緩慢，以及不知道結果的生活。"
      };
      const key = player.careerExit.startsWith("高卒") ? "高卒" : player.careerExit;
      return texts[key];
    },
    choices: [
      C("維持原計畫，不因焦慮亂加量", { discipline: 2, resilience: 1 }, ["transition_stayed_course"], "你接受成長有時沒有立即回饋。", { bodyEffects: { injuryRisk: -1 } }),
      C("尋求教練、前輩或醫療人員回饋", { observe: 1, responsibility: 1 }, ["transition_sought_feedback"], "你讓外部回饋修正自己的判斷。", { careerEffects: { reputation: 1 } }),
      C("增加投入，逼自己更快得到答案", { confidence: 1, pressure: 2 }, ["transition_forced_progress"], "你換到一次額外測試，也把疲勞與倦怠往後推。", { careerEffects: { exposure: 1 }, bodyEffects: { fatigue: 2 }, academicEffects: { burnout: 1 } })
    ]
  },
  transition_relationship: {
    title: "有人問你：現在還喜歡棒球嗎？",
    text() { return `這個問題來自家人、舊隊友或復健中心認識的人。它沒有問你表現、順位或恢復百分比，只問你現在還喜不喜歡。\n\n${hasCallback("family_safe_place", false) ? "你想起十歲時，自己曾在不知道怎麼辦時先回頭找家人。現在他們仍在等一個不必漂亮的答案。" : "這次沒有人替你準備標準答案。"}`; },
    choices: [
      C("喜歡，但和小時候已經不一樣", { observe: 1, resilience: 1 }, ["transition_love_matured"], "你接受喜歡也會隨人生改變形狀。", { academicEffects: { burnout: -1 } }),
      C("我現在更在意能不能留下", { confidence: 1, pressure: 1 }, ["transition_survival_first"], "棒球已從願望變成需要守住的身份。", { careerEffects: { reputation: 1 } }),
      C("我不確定，所以想再給自己一段時間", { responsibility: 1 }, ["transition_admitted_uncertainty"], "你沒有用漂亮答案掩蓋倦怠或迷惘。", { academicEffects: { burnout: -2 } })
    ]
  },
  azhe_adult_record_echo: {
    title: "工作表背面的那條線",
    text() {
      const sheet = hasFlag("azhe_record_sheet")
        ? "照片裡那張紀錄表的欄位，和畢業前器材室裡被你圈過的工作表幾乎一樣；紙角還留著一道反覆折過的白痕。"
        : "照片裡的紀錄表背面，畫著一條歪斜的守備責任線，旁邊用原子筆註記『先喊，再動』。";
      const distance = player.characterArc.azhe === "distant" || player.impression.azhe.feelsDistance >= 5;
      const message = distance
        ? "訊息不是阿哲直接傳來的。地方球隊的群組轉發了一張週末聯賽紀錄照，檔名裡才看見他的名字。"
        : "晚間訓練結束後，手機震了一下。阿哲傳來一張地方週末球隊的攻守紀錄照，沒有先問你的近況。";
      const life = distance
        ? "照片角落，他穿著工作服替球隊收球，背號被外套遮住一半。"
        : "他現在白天上班，週末替地方球隊記錄、接牛棚，偶爾在人數不夠時上場。";
      return `${message}\n\n${sheet}\n\n${life}\n\n照片下面只有一句：『我們現在把二游責任線畫在這裡。你那邊呢？』\n\n你明天仍有自己的測試、復健或工作要完成。這張照片沒有替你整理生涯，只把一個很久以前用球畫過的問題送回來。`;
    },
    choices: [
      C("傳回最近一場紀錄，只圈出那次沒完成的補位", { observe: 1 }, ["azhe_adult_record_echo_done", "azhe_adult_shared_record"], "你拍下最近的比賽紀錄，把那一格失誤圈起來，沒有附上整段近況。幾分鐘後，阿哲只回一張他們球場中線的照片；兩張紀錄表在對話框裡上下並排。", { personalityEffects: { thoughtful: 1 }, lifeThemeEffects: { trust: 1 }, resumeAfterPending: true }),
      C("問他現在把責任線畫在哪裡", { responsibility: 1, pressure: 1 }, ["azhe_adult_record_echo_done", "azhe_adult_asked_line"], "阿哲傳來一段七秒影片：鞋尖在地方球場的紅土拖過一條線，隊友從畫面外喊了一聲。他沒有替你回答該去哪裡，只說那條線每一季都會重畫。", { personalityEffects: { thoughtful: 1 }, lifeThemeEffects: { responsibility: 1 }, resumeAfterPending: true }),
      C("關掉訊息，先完成眼前的測試或工作", { discipline: 1, pressure: -1 }, ["azhe_adult_record_echo_done", "azhe_adult_finished_current_task"], "螢幕暗下去，紀錄表的摺線消失在黑色玻璃裡。你把手機放回袋中，完成今天剩下的項目；收拾時，那張照片仍停在未回覆的位置。", { personalityEffects: { reliable: 1 }, lifeThemeEffects: { freedom: 1 }, resumeAfterPending: true })
    ]
  },
  takahashi_adult_restart_echo: {
    title: "從零開始的三十球",
    text() {
      const markedBall = hasFlag("takahashi_first_wild_ball") ? "籃子最上方放著一顆縫線旁有黑記號的舊球。" : "籃子最上方放著一顆被反覆握過的舊球。";
      const scoreBoard = hasFlag("takahashi_scoreboard") ? "牆邊白板仍畫著當年的格線，只是標題換成『復健傳球 0／30』。" : "牆邊白板畫著三十個尚未填寫的格子。";
      const glove = hasFlag("takahashi_shined_glove") ? "高橋手上那副掌心磨到發亮的手套已換過束帶，舊皮仍留在最深的位置。" : "高橋戴著一副換過束帶的舊手套。";
      return `發展期某個清晨，手機新聞推播沒有比分，只有一段球隊公開的復健影片。鏡頭固定在空牛棚後方，沒有旁白，也沒剪掉高橋第一次回傳偏高的畫面。\n\n${markedBall}${scoreBoard}${glove}\n\n球探報告只列出出手角度、間隔秒數和允許球數，沒有寫他曾經比所有人早半步。影片裡，高橋撿回偏高的球，照原位置重新站好；接住下一次回傳後，他走到白板前，把「0／30」改成「1／30」。鏡頭外沒有人鼓掌，計時器已經再次開始倒數。`;
    },
    choices: [
      C("存下影片，把「1／30」圈進自己的訓練筆記", {}, ["takahashi_adult_restart_echo_done", "saved_takahashi_restart_video"], "你沒有轉傳新聞，只在自己的筆記頁角寫下日期，圈起一個小小的「1／30」。下一次測試開始前，那個數字仍和你的今日項目放在同一頁。", { lifeThemeEffects: { competition: 1 }, resumeAfterPending: true }),
      C("翻開舊計分頁，在下一格記下自己的第一次嘗試", {}, ["takahashi_adult_restart_echo_done", "used_takahashi_scoreboard_echo"], "舊頁上仍留著當年的三個叉號。你沒有重算高橋的結果，只翻到背面，替自己今天的第一球畫下一格；紙張翻動聲蓋過了影片重新播放的倒數。", { lifeThemeEffects: { responsibility: 1 }, resumeAfterPending: true }),
      C("關掉報告，帶著自己的手套走回目前的測試位置", {}, ["takahashi_adult_restart_echo_done", "returned_after_takahashi_echo"], "螢幕熄掉後，高橋發亮的舊手套消失在黑色玻璃裡。你把自己的手套拉緊，走回現在被分配的位置；場內的計時器也正從零重新開始。", { lifeThemeEffects: { freedom: 1 }, resumeAfterPending: true })
    ]
  },
  transition_cost_check: {
    title: "半年後，這條選擇開始收取代價",
    text() {
      const costs = player.careerExit.startsWith("高卒")
        ? "職業球團給你更好的設備，也能在任何一天把名額交給更年輕的人。"
        : player.careerExit === "大學棒球"
          ? "大學延長了成長時間，課業資格和學長競爭卻一起消耗這四年。"
          : player.careerExit === "業餘／社會人棒球"
            ? "穩定收入讓你能繼續打球，加班和通勤也開始拿走恢復時間。"
            : "復健保住身體可能，曝光、收入和球隊歸屬則持續下降。";
      const batEcho = getOffensiveCareerValue() > getPositionCareerValue() ? "你仍相信棒子能重新打開名單，但每一次打席都更像不能浪費的測試。" : "你必須證明自己的守位用途，能抵銷年齡、健康或養成成本。";
      return `${costs}\n\n${batEcho}\n\n這不是重新選一次道路，而是決定如何承擔已經選下去的生活。`;
    },
    choices: [
      C("維持原路線，接受它本來就有代價", { resilience: 2, discipline: 1 }, ["transition_accepted_cost"], "你停止幻想另一條路完全沒有風險，把注意力放回今天能完成的事。", { academicEffects: { burnout: -1 } }),
      C("縮小短期目標，先讓生活穩定", { responsibility: 2, pressure: -1 }, ["transition_reduced_scope"], "你放慢曝光與成長，換取身體和生活可以持續。", { financeEffects: { finances: 1 }, bodyEffects: { fatigue: -1 }, careerEffects: { exposure: -1 } }),
      C("增加投入，要求一年內得到答案", { confidence: 2, pressure: 2 }, ["transition_set_deadline"], "期限讓行動變得清楚，也讓每次失敗更難忽略。", { careerEffects: { exposure: 1 }, bodyEffects: { fatigue: 1 } })
    ]
  }
};

function getNightEvent() {
  const latest = player.memories[player.memories.length - 1] || "你還在回想今天發生的事。";
  const reflections = {
    1: player.confidence > player.observe ? "你反覆想著白天那些看向自己的目光。想被看見和害怕出糗，原來可以同時存在。" : "你閉上眼，仍能看見每個人的腳步。你開始習慣先理解，再決定要不要靠近。",
    2: hasFlag("park_ball") ? "公園裡沒有名單，但你第一次知道自由和球隊規矩帶來的是兩種不同快樂。" : "第二次回到球場後，那裡不再只是陌生人的練習地。",
    3: hasFlag("backed_off") ? "被笑的聲音已經變小，身體卻還記得當時想退開的感覺。" : "漏接沒有消失，但你開始記得自己是怎麼準備下一球。",
    4: hasFlag("family_promise") ? "你和家人的約定還很小，卻讓明天不再只是臨時起意。" : "你還沒有答應任何人，只知道棒球已經占據越來越多睡前時間。",
    5: hasFlag("solo_grind") ? "你想靠多做幾次追上別人，也第一次感覺到努力可能把人留在自己的世界裡。" : "隊友的名字開始和球場上的位置連在一起。",
    6: hasFlag("played_scrimmage") ? "比賽很短，輪到自己的那一秒卻比整個下午都長。" : "你從場邊看完一場練習，仍在想如果站進去會發生什麼。"
  };
  return {
    title: `第 ${player.day} 天晚上`,
    text: `晚上，你躺在床上。\n\n${latest}\n\n${reflections[player.day] || "棒球像一面鏡子，慢慢照出你是什麼樣的孩子。"}`,
    choices: [{ text: "睡覺，進入明天", sleep: true }]
  };
}

function getCurrentEventId() {
  if (player.completed) return "slice_complete";
  if (player.forcedEventId) return player.forcedEventId;
  if (player.chapter === "二十二歲職涯小結") return "development_result";
  if (player.chapter === "發展期") {
    const sequence = ["development_daily_life", "development_competition", "development_mentor", "development_body_choice", "development_opportunity", "development_market", "development_decision"];
    return sequence[player.developmentStep] || "development_result";
  }
  if (player.chapter === "生涯轉換期小結") return "transition_result";
  if (player.chapter === "生涯轉換期") {
    const route = player.careerExit.startsWith("高卒") ? "draft" : player.careerExit === "大學棒球" ? "college" : player.careerExit === "業餘／社會人棒球" ? "amateur" : "rehab";
    const sequences = {
      draft: ["transition_draft_day", "transition_rookie_camp", "transition_pro_roster_window", "transition_relationship", "transition_cost_check"],
      college: ["transition_college_arrival", "transition_college_balance", "transition_college_eligibility", "transition_relationship", "transition_cost_check"],
      amateur: ["transition_amateur_job", "transition_amateur_test", "transition_amateur_company_conflict", "transition_relationship", "transition_cost_check"],
      rehab: ["transition_rehab_plateau", "transition_rehab_identity", "transition_rehab_reentry_deadline", "transition_relationship", "transition_cost_check"]
    };
    return sequences[route][player.transitionStep] || "transition_result";
  }
  if (player.chapter === "青棒生涯出口") return "critical_year_result";
  if (player.chapter === "青棒關鍵年") {
    const sequence = ["critical_offseason", "critical_tournament", "critical_public_attention", "critical_injury", "critical_scout_interview", "critical_family", "critical_farewell", "critical_exit_choice"];
    return sequence[player.criticalYearStep] || "critical_year_result";
  }
  if (player.chapter === "青棒第一年小結") return "high_school_result";
  if (player.chapter === "青棒") {
    const sequence = ["high_school_intro", "high_school_load", "high_school_life", "high_school_call_home", "high_school_role", "high_school_long_bench", "high_school_showcase", "high_school_scout_feedback"];
    return sequence[player.highSchoolStep] || "high_school_result";
  }
  if (player.chapter === "青少棒階段小結") return "junior_season_result";
  if (player.chapter === "青少棒分化") {
    const sequence = ["junior_consequence", "junior_coach_preference", "junior_senior", "junior_starting_job", "junior_academics", "junior_tournament", "junior_after_loss", "takahashi_school_question", "yamamoto_recommendation", "junior_school_choice"];
    return sequence[player.juniorSeasonStep] || "junior_season_result";
  }
  if (player.chapter === "青少棒開場小結") return "junior_result";
  if (player.chapter === "青少棒") {
    const sequence = ["junior_intro", "junior_repetition", "junior_growth_test", "junior_position_change", "junior_azhe_cover", "junior_takahashi_failure", "junior_coach_disagreement", "junior_home_night", "junior_friend_exit", "junior_pain"];
    return sequence[player.juniorStep] || "junior_result";
  }
  if (player.chapter === "位置競爭小結") return "competition_result";
  if (player.chapter === "位置競爭") {
    if (player.competitionStep === 0) return "competition_intro";
    if (player.competitionStep === 1) return "competition_training_week";
    if (player.competitionStep === 2) {
      if (player.impression.coach.immature >= 5) return "echo_coach_immature";
      if (player.impression.coach.dependable >= 5 && player.impression.coach.leader >= 3) return "echo_coach_leadership";
      if (player.impression.takahashi.respect >= 5) return "echo_rival_respect";
      if (player.relationships.coachTrust >= 6) return "echo_coach";
      if (player.relationships.teammateBond >= 5) return "echo_teammate";
      if (player.relationships.rivalCompetition >= 5) return "echo_rival";
      return "echo_solo";
    }
    if (player.competitionStep === 3) {
      if (player.impression.azhe.feelsDistance >= 5 || player.relationships.teammateBond <= 1) return "azhe_bond_low";
      if (player.impression.azhe.trusts >= 5 || player.relationships.teammateBond >= 6) return "azhe_bond_high";
      return "azhe_bond_mid";
    }
    if (player.competitionStep === 4) return "competition_role_talk";
    return player.seasonPosition === "捕手" ? "competition_catcher_test" : "competition_position_test";
  }
  if (player.chapter === "少棒第一季小結") return "youth_season_result";
  if (player.chapter === "少棒第一季") {
    const positionPlay = { "內野手": "youth_match_grounder", "外野手": "youth_match_outfield", "捕手": "youth_match_catcher", "投手": "youth_match_pitcher" }[player.seasonPosition] || "youth_match_grounder";
    const sequence = ["youth_season_intro", "youth_position_trial", "youth_teammate", "youth_bench", "youth_match_entry", positionPlay, "youth_match_mistake", "youth_match_after"];
    return sequence[player.seasonStep] || "youth_season_result";
  }
  if (player.chapter === "少棒入門小結") return "chapter2_result";
  if (player.chapter === "少棒入門") {
    const sequence = ["chapter2_intro", "chapter2_day1_training", "chapter2_team_breath", "chapter2_day2_correction", "chapter2_batting_intro", "chapter2_day3_test"];
    return sequence[player.chapter2Step] || "chapter2_result";
  }
  if (player.ending) return "ending";
  if (player.phase === "night") return "night";
  return `day${player.day}_${player.phase}`;
}

function getEvent(eventId) {
  if (eventId === "night") return getNightEvent();
  return chapterOneEvents[eventId] || chapterTwoEvents[eventId] || youthSeasonEvents[eventId] || positionCompetitionEvents[eventId] || juniorBaseballEvents[eventId] || juniorSeasonEvents[eventId] || highSchoolEvents[eventId] || criticalYearEvents[eventId] || careerTransitionEvents[eventId] || pacingEvents[eventId] || developmentEvents[eventId] || null;
}
