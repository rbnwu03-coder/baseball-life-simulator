const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "npc.js", "coach.js", "rival.js", "story.js", "save.js", "script.js",
  "application-controller.js"
];

function createClassList() {
  const values = new Set();
  return {
    add: value => values.add(value),
    remove: value => values.delete(value),
    toggle(value, force) {
      if (force === true) values.add(value);
      else if (force === false) values.delete(value);
      else if (values.has(value)) values.delete(value);
      else values.add(value);
    },
    contains: value => values.has(value)
  };
}

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const document = {
    body: { classList: createClassList() },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        id,
        innerHTML: "",
        textContent: "",
        value: id === "nameInput" ? "直達測試球員" : id === "batsSelect" || id === "throwsSelect" ? "R" : "",
        style: {}, dataset: {}, disabled: false, classList: createClassList(),
        focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
      });
      return nodes.get(id);
    },
    querySelector(selector) {
      return selector === ".debug-bookmarks" ? { open: false } : null;
    },
    querySelectorAll() { return []; }
  };
  const context = vm.createContext({
    console, document, module: { exports: {} },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: { setTimeout(callback) { callback(); return 1; } }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  context.__nodes = nodes;
  context.__storage = storage;
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("1. Direct Start 可在創角前合法選取", evaluate("selectDevelopmentEntry('highSchool') === true && selectedDevelopmentEntry === 'highSchool'"));
verify("2. Direct Start 仍要求完成 Character Genesis", evaluate(`(() => {
  selectedIdealSelf="技巧型"; pendingGenesisRoll=null; createPlayer();
  return !player.name && document.getElementById("characterCreationFeedback").textContent.includes("初始能力");
})()`));
verify("3. Genesis 完成後會直接進入高中第一年", evaluate(`(() => {
  selectDevelopmentEntry("highSchool"); selectedOrigin="understand"; selectedIdealSelf="棒球理解型";
  pendingGenesisRoll=rollCharacterGenesis(()=>0.25);
  pendingGenesisAllocation={ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1};
  createPlayer();
  return player.characterGenesis.completed && player.chapter==="青棒" && player.age===16 && getCurrentEventId()==="high_school_intro";
})()`));
verify("3a. Direct Start 同步建立合法四校並保留 compatibility bypass", evaluate(`validateSchoolInvitationSet(player.schoolInvitationState).ok&&player.schoolInvitationState.compatibilityMode==="direct-start-bypass"&&player.schoolInvitationState.legacyExistingSchool.schoolName===player.highSchoolRoute`));

const syntheticA = parse("createHighSchoolDirectStartHistory()");
const syntheticB = parse("createHighSchoolDirectStartHistory()");
verify("4. synthetic history 完全 deterministic", JSON.stringify(syntheticA) === JSON.stringify(syntheticB));
verify("5. synthetic history 僅提供高一必要的有限前史", syntheticA.primaryPosition === "內野手" && syntheticA.flags.includes("azhe_hidden_error_seen") && Object.values(syntheticA.relationships).every(value => value <= 4));
verify("6. Direct Start 不製造異常能力或關係", evaluate("player.characterGenesis.total === 15 && Math.max(...Object.values(player.relationships)) <= 4"));
verify("6a. 正常高中入口在 settlement 後停在正式四校選擇，不提前進高中", evaluate(`(() => {
  player=createRepresentativeHighSchoolEntryFixture("ordinary",11001);player.chapter="青少棒分化";player.age=15;player.highSchoolRoute="普通高中・穩定出賽";
  const route=player.highSchoolRoute;enterHighSchool();
  const markup=document.getElementById("choices").innerHTML;
  return validateSchoolInvitationSet(player.schoolInvitationState).ok&&isSchoolInvitationChoicePending(player)&&player.highSchoolRoute===route&&player.chapter==="青少棒分化"&&player.age===15&&document.getElementById("story").innerHTML.includes("高中邀請")&&(markup.match(/class="school-invitation-card"/g)||[]).length===4;
})()`));

verify("7. 正常完整人生仍從十歲夏天開始", evaluate(`(() => {
  resetGame(); selectedOrigin="prove"; selectedIdealSelf="全能型";
  pendingGenesisRoll=rollCharacterGenesis(()=>0.25);
  pendingGenesisAllocation={ballSense:1,observe:1,fitness:1,batting:0,baseRunning:0,baseballIQ:0};
  createPlayer(); return player.chapter==="十歲暑假" && player.age===10 && getCurrentEventId()==="day1_morning" && !hasFlag("direct_start_history");
})()`));

const abilityUi = evaluate(`(() => {
  player=createInitialPlayer("能力摘要"); player.idealSelf="速度型"; player.origin="belong";
  const roll=rollCharacterGenesis(()=>0.25);
  applyCharacterGenesis(player,{baseRoll:roll.baseRoll,allocation:{ballSense:1,observe:0,fitness:0,batting:0,baseRunning:2,baseballIQ:0},shape:formatCharacterGenesisShape(roll.shape),bats:"S",throws:"L"});
  applyCanonicalPositionProfile(player,"外野手",[]); updateStatus(); return document.getElementById("status").innerHTML;
})()`);
verify("8. Genesis 後預設摘要可讀取能力輪廓", abilityUi.includes("球員概況") && abilityUi.includes("創角擲到") && abilityUi.includes("加點後著重") && abilityUi.includes("明顯優勢") && abilityUi.includes("仍待磨練"));
verify("9. Ideal Self、主守位與投打保持可見", abilityUi.includes("速度型") && abilityUi.includes("外野手") && abilityUi.includes("左右開弓／左投"));
verify("10. 玩家可見能力摘要不洩漏 raw identifiers", !["ballSense", "observe", "fitness", "batting", "baseRunning", "baseballIQ"].some(key => abilityUi.includes(key)));
verify("11. 精確能力仍留在既定預設展開詳細區塊", abilityUi.includes('<details class="status-section" data-status-disclosure="abilities" open>\n    <summary>能力與技能</summary>') && abilityUi.includes("球感"));

const contexts = parse(`(() => {
  const run=(ideal,skills,stats)=>{ player=createInitialPlayer(ideal); player.idealSelf=ideal; player.highSchoolRoute="普通高中・穩定出賽"; player.primaryPosition="內野手"; Object.assign(player.baseballSkills,skills); Object.assign(player,stats); return resolveHighSchoolPositionFormation(); };
  return [
    run("強打型",{batting:12,catching:4,throwing:4},{ballSense:8}),
    run("速度型",{batting:8,baseRunning:7,catching:4,throwing:4},{fitness:4,ballSense:4}),
    run("速度型",{batting:15,baseRunning:1,catching:4,throwing:4},{ballSense:10,fitness:1})
  ];
})()`);
verify("12. alignment／partial／conflict 都具有可讀理由", new Set(contexts.map(item => item.idealAlignment)).size === 3 && contexts.every(item => item.context.includes("你原本憧憬") && item.context.includes("球隊")));
verify("13. 三種位置對照不會阻斷正常高一 progression", contexts.every(item => item.primaryPosition) && evaluate("player.chapter='青棒'; player.highSchoolStep=1; getCurrentEventId()==='high_school_load'"));

const azheProof = parse(`(() => {
  player=createInitialPlayer("阿哲回音"); player.idealSelf="棒球理解型";
  Object.assign(player.impression.azhe,{trusts:8,feelsDistance:0}); player.relationships.teammateBond=8; player.observe=8; player.baseballSkills.baseballIQ=10; addFlags(["azhe_error_reworked"]);
  return resolveHighSchoolAzheEcho();
})()`);
verify("14. composite trigger 成立時呈現 Cause → Change → Recall", azheProof.variant === "player-guides" && azheProof.cause.includes("交流賽") && azheProof.change.includes("地方球隊") && azheProof.recall.includes("這次我先把下一個任務說清楚了"));
verify("15. 缺少共享經驗時不會錯誤觸發玩家改變阿哲", evaluate(`(() => { player=createInitialPlayer("缺證據"); player.idealSelf="棒球理解型"; player.impression.azhe.trusts=8; player.relationships.teammateBond=8; player.observe=8; player.baseballSkills.baseballIQ=10; return resolveHighSchoolAzheEcho().variant!=="player-guides"; })()`));
verify("16. 阿哲可見後果可經 save/load 保留", evaluate(`(() => {
  player=createInitialPlayer("保存回音"); player.idealSelf="棒球理解型"; player.impression.azhe.trusts=8; player.relationships.teammateBond=8; player.observe=8; player.baseballSkills.baseballIQ=10; addFlags(["azhe_error_reworked"]); resolveHighSchoolAzheEcho();
  saveGame(); const expected=player.highSchoolAzheEcho.summary; player=createInitialPlayer(); loadGame(); return player.highSchoolAzheEcho.summary===expected && hasFlag("hs_y1_azhe_player_guides");
})()`));

verify("17. 正常 Career Spine 合約仍保留少年與青少棒節點", evaluate("CareerSpineContract.getNodeByChapter('少棒入門').chapter === '少棒入門' && CareerSpineContract.getNodeByChapter('青少棒').chapter === '青少棒'"));
verify("18. 比賽仍保留 prepare／resolve 分層作為後續關鍵時刻入口", evaluate("typeof prepareHighSchoolYearOneMatch==='function' && typeof resolveHighSchoolYearOneMatch==='function'"));

const bookmarkProfiles = parse(`(() => {
  const snapshots={};
  for (const bookmark of ["firstMatch","junior","highSchool","highSchoolYearTwo"]) {
    loadTestBookmark(bookmark);
    snapshots[bookmark]={
      chapter:player.chapter,
      completed:player.characterGenesis.completed,
      baseRoll:player.characterGenesis.baseRoll,
      allocation:player.characterGenesis.allocation,
      idealSelf:player.idealSelf,
      bats:player.bats,
      throws:player.throws,
      primaryPosition:player.primaryPosition,
      secondaryPositions:player.secondaryPositions,
      seasonPosition:player.seasonPosition,
      secondaryPosition:player.secondaryPosition,
      html:renderReadableAbilityProfile()
    };
  }
  return snapshots;
})()`);
verify("19. highSchool bookmark 具有合法 completed Character Genesis", bookmarkProfiles.highSchool.completed === true
  && Object.values(bookmarkProfiles.highSchool.baseRoll).reduce((sum, value) => sum + value, 0) === 12
  && Object.values(bookmarkProfiles.highSchool.baseRoll).every(value => Number.isInteger(value) && value >= 1 && value <= 3)
  && Object.values(bookmarkProfiles.highSchool.allocation).reduce((sum, value) => sum + value, 0) === 3
  && Object.values(bookmarkProfiles.highSchool.allocation).every(value => Number.isInteger(value) && value >= 0 && value <= 2));
verify("20. youth／junior／highSchool／Year Two 都能渲染球員概況", Object.values(bookmarkProfiles).every(item => item.html.includes("球員概況")));
verify("21. 書籤 Ideal Self、投打與主守皆為玩家可讀文字", Object.values(bookmarkProfiles).every(item => item.html.includes("棒球理解型") && item.html.includes("右打／右投") && item.html.includes(item.primaryPosition)));
verify("22. 書籤球員概況不洩漏 raw identifiers", Object.values(bookmarkProfiles).every(item => !["ballSense","observe","fitness","batting","baseRunning","baseballIQ"].some(key => item.html.includes(key))));
verify("23. canonical 與 legacy position 永遠指向同一份守位", Object.values(bookmarkProfiles).every(item => item.primaryPosition === item.seasonPosition && (item.secondaryPositions[0] || "") === item.secondaryPosition));
verify("24. 代表性書籤保留原 chapter 語意", bookmarkProfiles.firstMatch.chapter === "少棒第一季" && bookmarkProfiles.junior.chapter === "青少棒" && bookmarkProfiles.highSchool.chapter === "青棒" && bookmarkProfiles.highSchoolYearTwo.chapter === "青棒第二年");
verify("25. 所有代表性書籤共用相同 deterministic Genesis fixture", new Set(Object.values(bookmarkProfiles).map(item => JSON.stringify([item.baseRoll,item.allocation,item.idealSelf,item.bats,item.throws]))).size === 1);

console.log(`\nHigh School Integration 1.1.1：${passed}/${passed} 通過`);
