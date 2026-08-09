const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js",
  "current-state-boundary.js",
  "time-boundary.js",
  "relationship-boundary.js",
  "evaluation-registry.js",
  "coach-evaluation-boundary.js",
  "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js",
  "decision-flow.js",
  "day-completion-flow.js",
  "relationship-flow.js",
  "coach-response-flow.js",
  "narrative-condition-flow.js",
  "competition-presentation.js",
  "career-spine-contract.js",
  "career-transition-runtime-resolver.js",
  "career-development-runtime-resolver.js",
  "career-save-admission.js",
  "story.js",
  "save.js",
  "script.js"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeGame({ immediateTimers = true } = {}) {
  const nodes = new Map();
  const storage = new Map();
  const timers = [];
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) {
        nodes.set(id, {
          innerHTML: "",
          value: id === "nameInput" ? "十歲篇測試球員" : "",
          style: {}
        });
      }
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console,
    document,
    localStorage: {
      setItem: (key, value) => storage.set(key, value),
      getItem: key => storage.get(key) || null,
      removeItem: key => storage.delete(key)
    },
    window: {
      setTimeout(callback) {
        timers.push(callback);
        if (immediateTimers) callback();
        return timers.length;
      }
    }
  });
  runtimeFiles.forEach(file => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
      filename: file
    });
  });
  return { context, nodes, storage, timers };
}

function evaluate(context, expression) {
  return vm.runInContext(expression, context);
}

function resetFlags(context, flags) {
  evaluate(context, `player.flags = ${JSON.stringify(flags)}`);
}

function eventText(context, eventId) {
  return evaluate(context, `(() => { const event = getEvent(${JSON.stringify(eventId)}); return typeof event.text === "function" ? event.text() : event.text; })()`);
}

function assertEchoSet(context, eventId, cases) {
  cases.forEach(({ flag, expected }) => {
    resetFlags(context, [flag]);
    const text = eventText(context, eventId);
    assert(text.includes(expected), `${eventId} 沒有回收 ${flag}：缺少「${expected}」`);
  });
}

let passed = 0;
function test(title, callback) {
  callback();
  passed += 1;
  console.log(`✓ ${title}`);
}

test("新版十歲篇事件、選項 identity 與 gameplay contract 維持不變", () => {
  const { context } = makeGame();
  const expectedIds = [
    "day1_morning", "day1_afternoon", "day2_morning", "day2_afternoon",
    "day3_morning", "day3_afternoon", "day4_morning", "day4_afternoon",
    "day5_morning", "day5_afternoon", "day6_morning", "day6_afternoon",
    "day7_morning", "day7_afternoon", "ending"
  ];
  const actualIds = JSON.parse(evaluate(context, "JSON.stringify(Object.keys(chapterOneEvents))"));
  assert(JSON.stringify(actualIds) === JSON.stringify(expectedIds), "十歲篇事件 ID 或順序被改變");
  assert(evaluate(context, "Object.values(chapterOneEvents).slice(0, 13).every(event => event.choices.length === 3)"), "前三選項事件的選項數量被改變");
  assert(evaluate(context, "chapterOneEvents.day7_afternoon.choices.length === 1 && chapterOneEvents.ending.choices.length === 2"), "章末選項數量被改變");
  const contract = evaluate(context, `JSON.stringify(Object.fromEntries(
    Object.entries(chapterOneEvents).map(([id, event]) => [
      id,
      (event.choices || []).map(choice => Object.fromEntries(
        Object.entries(choice).filter(([key]) => !["text", "memory"].includes(key))
      ))
    ])
  ))`);
  const hash = crypto.createHash("sha256").update(contract).digest("hex");
  assert(hash === "da40c85f8da50192d4dd9d64283163f3e890fd5ed738c0cfaaffcd36e85fda3c", `十歲篇 gameplay contract 改變：${hash}`);
});

test("十四個白天事件都有場景定位，標題在正文中以具體動作兌現", () => {
  const { context } = makeGame();
  assert(evaluate(context, "Object.entries(chapterOneEvents).filter(([id]) => /^day[1-7]_(morning|afternoon)$/.test(id)).every(([, event]) => Boolean(event.scene))"), "白天事件缺少 Visual Context");
  const checks = {
    day2_afternoon: ["第一次被看見", "停下自己的動作"],
    day3_morning: ["傳接球的距離", "三步", "六步"],
    day4_morning: ["被比較的一天", "相同速度", "三次回傳"],
    day6_afternoon: ["最後一顆不規則彈跳", "第二次彈跳"]
  };
  Object.entries(checks).forEach(([eventId, expected]) => {
    const event = evaluate(context, `getEvent(${JSON.stringify(eventId)})`);
    const text = eventText(context, eventId);
    expected.forEach(token => assert(event.title.includes(token) || text.includes(token), `${eventId} 未兌現「${token}」`));
  });
});

test("每一組重要選擇都在下一幕留下可見回音", () => {
  const { context } = makeGame();
  const groups = [
    ["day1_afternoon", [["watched_close", "手指還勾"], ["hesitant", "仍站在家人身旁"], ["asked_family", "家人便把位置讓開"]]],
    ["day2_morning", [["threw_back", "偏到阿哲右側"], ["imitates", "那一步跨"], ["relied_family", "家人替你"]]],
    ["day2_afternoon", [["returned_ballpark", "兩顆滾到場外"], ["watched_tv", "紙上的站位"], ["park_ball", "公園帶來的球"]]],
    ["day3_morning", [["admitted_interest", "直接把昨天那只"], ["slow_warm", "依約把掛在圍欄"], ["asked_teammate", "照昨天學到的順序"]]],
    ["day3_afternoon", [["raw_catcher", "沿著白線追球"], ["fundamental_focus", "接住第三球的位置"], ["kept_retrying", "多跑了幾趟"]]],
    ["day4_morning", [["ignored_laugh", "沒有去找笑聲"], ["analyzed_failure", "鞋尖畫出的短線"], ["backed_off", "水壺留在場外"]]],
    ["day4_afternoon", [["learned_from_peer", "重做高橋跨出的第一步"], ["prove_self", "第二球偏出肩膀"], ["chose_free_play", "公園的牆沒有評分"]]],
    ["day5_morning", [["family_promise", "冰箱上的第一個圈"], ["uncertain_but_curious", "只答應再來一次"], ["independent_play", "紙角記下的時間"]]],
    ["day5_afternoon", [["coach_trial_observe", "兩個記號"], ["coach_trial_instinct", "偏右的快傳"], ["asked_demo", "放慢換手"]]],
    ["day6_morning", [["joined_kids", "阿哲昨天指的位置"], ["scouted_kids", "白板上的名字"], ["solo_grind", "前臂仍留著"]]],
    ["day6_afternoon", [["played_scrimmage", "最後半局"], ["scrimmage_observer", "看了這麼久"], ["park_over_scrimmage", "候補口令"]]],
    ["day7_morning", [["attacked_ball", "向前跨出的鞋印"], ["read_bounce", "兩次彈跳"], ["body_block", "淡淡的球印"]]],
    ["day7_afternoon", [["asked_to_join", "寫有你名字"], ["asked_good_question", "圈著『第一步』"], ["wants_free_baseball", "開門時間"]]]
  ];
  groups.forEach(([eventId, cases]) => assertEchoSet(context, eventId, cases.map(([flag, expected]) => ({ flag, expected }))));
});

test("六次夜間節點只有兩次保留反思功能，其餘是具體 passage", () => {
  const { context } = makeGame();
  const expectedTitles = {
    1: "鞋底上的紅土",
    2: "約好的三球",
    3: "彈跳畫在紙上",
    4: "月曆上的第一個圈",
    5: "白板上的兩種顏色",
    6: "手套裡的一小塊紅土"
  };
  Object.entries(expectedTitles).forEach(([day, title]) => {
    evaluate(context, `player.day = ${day}; player.phase = "night"`);
    assert(evaluate(context, "getNightEvent().title") === title, `第 ${day} 天夜間節點標題不正確`);
    assert(Boolean(evaluate(context, "getNightEvent().scene")), `第 ${day} 天夜間節點缺少場景`);
    assert(evaluate(context, "getNightEvent().choices[0].sleep === true"), `第 ${day} 天夜間節點失去安全日結入口`);
  });
  evaluate(context, "player.day = 3; player.flags = ['analyzed_failure']");
  assert(eventText(context, "night").includes("兩次彈跳"), "第 3 天夜晚沒有形成隔日可執行準備");
  evaluate(context, "player.day = 6; player.flags = ['read_bounce']");
  assert(eventText(context, "night").includes("帶著實際發生過的那一球去回答"), "第 6 天夜晚沒有承接章末問題");
});

test("選項維持原養成方向，顯示文字改為當下可做的行動", () => {
  const { context } = makeGame();
  const optionTexts = JSON.parse(evaluate(context, `JSON.stringify(Object.entries(chapterOneEvents)
    .filter(([id]) => /^day[1-7]_(morning|afternoon)$/.test(id))
    .flatMap(([, event]) => event.choices.map(choice => choice.text)))`));
  const forbiddenConclusions = ["成為勇敢的人", "接受自己的不足", "決定人生", "理解自己", "支持他"];
  forbiddenConclusions.forEach(token => assert(optionTexts.every(text => !text.includes(token)), `選項仍直接選擇故事結論：${token}`));
  assert(optionTexts.every(text => /把|站|留|問|指|接|走|蹲|排|抱|到|聽|退|跪|攤|交|向|跨|用/.test(text)), "仍有選項不是具體行動");
});

test("快速連點同一選項只套用一次效果與一次推進", () => {
  const { context, timers } = makeGame({ immediateTimers: false });
  evaluate(context, "selectedIdealSelf = '全能型'; createPlayer()");
  const before = JSON.parse(evaluate(context, "JSON.stringify({observe:player.observe,confidence:player.confidence,phase:player.phase,memories:player.memories.length})"));
  evaluate(context, "choose('day1_morning', 0); choose('day1_morning', 0)");
  const after = JSON.parse(evaluate(context, "JSON.stringify({observe:player.observe,confidence:player.confidence,phase:player.phase,memories:player.memories.length})"));
  assert(after.observe === before.observe + 1 && after.confidence === before.confidence + 1, "快速連點重複套用能力效果");
  assert(after.phase === "afternoon" && after.memories === before.memories + 1, "快速連點重複推進事件或記憶");
  assert(timers.length === 1, "快速連點排入多個下一幕計時器");
});

function playChildhoodRoute(choiceIndex) {
  const { context } = makeGame();
  evaluate(context, `selectedIdealSelf = "全能型"; createPlayer()`);
  const visited = [];
  let guard = 0;
  while (!evaluate(context, "Boolean(player.ending)") && guard < 30) {
    const eventId = evaluate(context, "getCurrentEventId()");
    const eventExists = evaluate(context, `Boolean(getEvent(${JSON.stringify(eventId)}))`);
    assert(eventExists, `十歲篇出現 undefined event：${eventId}`);
    visited.push(eventId);
    const count = evaluate(context, `getEvent(${JSON.stringify(eventId)}).choices.length`);
    evaluate(context, `choose(${JSON.stringify(eventId)}, ${Math.min(choiceIndex, count - 1)})`);
    guard += 1;
  }
  assert(evaluate(context, "Boolean(player.ending)"), "十歲篇未在安全回合數內完成");
  return { context, visited };
}

test("三種養成方向都能從第一幕連續抵達章末與少棒入門", () => {
  [0, 1, 2].forEach(choiceIndex => {
    const { context, visited } = playChildhoodRoute(choiceIndex);
    assert(visited[0] === "day1_morning" && visited.includes("day7_afternoon"), `路線 ${choiceIndex} 缺少首幕或章末`);
    assert(visited.filter(id => id === "night").length === 6, `路線 ${choiceIndex} 的日結 passage 數量不安全`);
    assert(visited.length === 20, `路線 ${choiceIndex} 的十歲篇節點數異常：${visited.length}`);
    evaluate(context, "choose('ending', 0)");
    assert(evaluate(context, "player.chapter === '少棒入門' && getCurrentEventId() === 'chapter2_intro'"), `路線 ${choiceIndex} 沒有銜接少棒入門`);
    assert(eventText(context, "chapter2_intro").includes("紙") || eventText(context, "chapter2_intro").includes("球場"), `路線 ${choiceIndex} 的少棒入口缺少十歲篇殘留`);
  });
});

test("自由打法留在紅白賽邊界內，最後一球由教練按候補秩序安排", () => {
  const { context } = makeGame();
  const choice = evaluate(context, "chapterOneEvents.day6_morning.choices[2]");
  assert(choice.text.includes("界外牆") && choice.text.includes("候補口令"), "自由打法沒有留在球隊可管理的範圍內");
  assert(!choice.text.includes("隔壁公園") && !choice.memory.includes("回到圍欄外"), "自由打法仍在紅白賽中途離場");
  resetFlags(context, ["park_over_scrimmage"]);
  const followUp = eventText(context, "day6_afternoon");
  assert(followUp.includes("回到白線後") && followUp.includes("補進去"), "山本教練沒有依候補秩序安排最後半局");
  assert(!followUp.includes("看見你手上還戴著手套"), "自由打法仍因離場後回來獲得特殊機會");
});

test("自由棒球路線先參加一次開放練習，再由當幕行動接受球隊訓練", () => {
  const { context } = makeGame();
  resetFlags(context, ["wants_free_baseball"]);
  evaluate(context, "player.chapterOneEnding = '公園野球'");
  const threshold = eventText(context, "day7_afternoon");
  assert(threshold.includes("沒有答應固定報到") && threshold.includes("一次開放練習"), "章末仍把自由棒球路線寫成固定入隊");
  const intro = eventText(context, "chapter2_intro");
  assert(evaluate(context, "chapterTwoEvents.chapter2_intro.title") === "少棒隊的開放練習", "少棒入口標題仍預設玩家已成為球員");
  assert(intro.includes("不是固定集合時間") && intro.includes("由你自己決定"), "少棒入口沒有演出再次回來與自行決定的原因");
  const outcomes = JSON.parse(evaluate(context, "JSON.stringify(chapterTwoEvents.chapter2_intro.choices.map(choice => choice.memory))"));
  assert(outcomes.every(memory => memory.includes("第二輪") || memory.includes("下一輪")), "少棒入口選擇後沒有具體演出玩家留下接受訓練");
});

test("舊存檔指向任一夜間或白天事件仍可安全解析", () => {
  const { context } = makeGame();
  for (let day = 1; day <= 6; day += 1) {
    evaluate(context, `player.chapter = "十歲暑假"; player.day = ${day}; player.phase = "night"`);
    assert(evaluate(context, "getCurrentEventId()") === "night", `舊存檔第 ${day} 天 night 無法解析`);
    assert(evaluate(context, "Boolean(getEvent('night'))"), `舊存檔第 ${day} 天 night 找不到事件`);
  }
  for (let day = 1; day <= 7; day += 1) {
    ["morning", "afternoon"].forEach(phase => {
      evaluate(context, `player.day = ${day}; player.phase = ${JSON.stringify(phase)}; player.ending = ""`);
      const eventId = `day${day}_${phase}`;
      assert(evaluate(context, "getCurrentEventId()") === eventId, `舊存檔無法還原 ${eventId}`);
      assert(evaluate(context, `Boolean(getEvent(${JSON.stringify(eventId)}))`), `${eventId} 相容入口遺失`);
    });
  }
});

test("十歲篇中途 Save／Load 還原同一事件、旗標與記憶", () => {
  const { context } = makeGame();
  evaluate(context, `
    selectedIdealSelf = "技術鑽研型";
    createPlayer();
    choose("day1_morning", 1);
    choose("day1_afternoon", 1);
    choose("night", 0);
    choose("day2_morning", 1);
    saveGame();
  `);
  const saved = evaluate(context, `JSON.stringify({
    eventId:getCurrentEventId(), day:player.day, phase:player.phase,
    flags:player.flags, memories:player.memories, idealSelf:player.idealSelf
  })`);
  evaluate(context, `
    choose(getCurrentEventId(), 0);
    player.flags = [];
    player.memories = [];
    loadGame();
  `);
  const restored = evaluate(context, `JSON.stringify({
    eventId:getCurrentEventId(), day:player.day, phase:player.phase,
    flags:player.flags, memories:player.memories, idealSelf:player.idealSelf
  })`);
  assert(restored === saved, "十歲篇 Save／Load 沒有還原同一穩定狀態");
});

console.log(`\nTen-Year Narrative Architecture Pass：${passed}/11 通過`);
