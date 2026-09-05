const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "team-roster-foundation.js", "team-strength-model.js", "high-school-entry-roster-context.js",
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js",
  "evaluation-registry.js", "coach-evaluation-boundary.js", "narrative-condition-boundary.js",
  "evaluation-registry-bootstrap.js", "decision-flow.js", "day-completion-flow.js",
  "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js",
  "competition-presentation.js", "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js",
  "baseball-offense-prototype.js", "offensive-plate-approach.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "career-spine-contract.js", "career-transition-resolver.js", "career-transition-commit.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "npc.js", "coach.js", "rival.js", "story.js", "save.js", "script.js",
  "application-controller.js"
];

function createClassList() {
  const values = new Set();
  return {
    add: value => values.add(value), remove: value => values.delete(value),
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
        id, innerHTML: "", textContent: "",
        value: id === "nameInput" ? "路由衝突測試" : id === "batsSelect" || id === "throwsSelect" ? "R" : "",
        style: {}, dataset: {}, disabled: false, classList: createClassList(),
        focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
      });
      return nodes.get(id);
    },
    querySelector(selector) { return selector === ".debug-bookmarks" ? { open: false } : null; },
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
evaluate(`
  function __normalPreHs101(seed=19001) {
    let state=Math.max(1,Number(seed)>>>0);
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const target=createInitialPlayer("Normal Route v1.0.1");
    target.origin="understand";
    target.idealSelf="棒球理解型";
    const roll=rollCharacterGenesis(random);
    const genesis=applyCharacterGenesis(target,{
      baseRoll:roll.baseRoll,
      allocation:{ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1},
      shape:roll.shape,bats:"R",throws:"R"
    });
    if(!genesis.ok) throw new Error(genesis.error);
    applyCanonicalPositionProfile(target,"內野手",[]);
    applyYouthEventOutcome(target,{eventId:"normal-youth-catch",choiceId:"repeat",skillDeltas:{catching:1},positionExperienceDeltas:{"內野手":1},resolvedSeed:seed+"-a"});
    applyYouthEventOutcome(target,{eventId:"normal-youth-read",choiceId:"review",skillDeltas:{baseballIQ:1},resolvedSeed:seed+"-b"});
    Object.assign(target,{
      chapter:"青少棒分化",age:15,juniorSeasonStep:8,
      juniorResult:"為了上場而重新定義自己",juniorPath:"多位置工具人起點",
      juniorSeasonResult:"",juniorSeasonDetail:"",highSchoolRoute:"",
      academics:6,motivation:8,burnout:2
    });
    target.flags=(target.flags||[]).filter(flag=>!["chose_powerhouse_high_school","chose_playing_time_high_school","chose_balanced_high_school"].includes(flag));
    player=target;
    showCurrentEvent();
    return player;
  }
`);

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("1. Normal Route 在推薦信前仍未完成 HS Entry Settlement", evaluate(`(() => {
  __normalPreHs101();
  return getCurrentEventId()==="yamamoto_recommendation"
    && player.capabilityState.settlementVersion===""
    && player.schoolInvitationState.completed===false;
})()`));
verify("2. Four-School UI 前沒有 selectedSchoolId 或 finalized selection", evaluate(`player.schoolInvitationState.selectedSchoolId===""
  && player.schoolInvitationState.selectionFinalized===false`));
verify("3. 新 Normal Route 在推薦信前沒有 legacy school-choice flags", evaluate(`!hasLegacyJuniorSchoolChoice(player)`));

const afterRecommendation = parse(`(() => {
  const beforeSkills=JSON.stringify(player.baseballSkills);
  const beforeYouth=JSON.stringify(player.capabilityState.youthOutcomes);
  const result=choose("yamamoto_recommendation",0);
  return {
    result,eventId:getCurrentEventId(),chapter:player.chapter,step:player.juniorSeasonStep,
    flags:player.flags,highSchoolRoute:player.highSchoolRoute,
    settlementVersion:player.capabilityState.settlementVersion,
    skillsStable:beforeSkills===JSON.stringify(player.baseballSkills),
    youthStable:beforeYouth===JSON.stringify(player.capabilityState.youthOutcomes),
    story:document.getElementById("story").innerHTML,
    choices:document.getElementById("choices").innerHTML
  };
})()`);
verify("4. yamamoto_recommendation 後直接進 junior_season_result", afterRecommendation.eventId === "junior_season_result" && afterRecommendation.chapter === "青少棒階段小結");
verify("5. Normal Route 完全跳過 junior_school_choice", afterRecommendation.step === 10
  && !afterRecommendation.story.includes("三張高中簡章")
  && !afterRecommendation.choices.includes("挑戰強豪高中"));
verify("6. 跳過 legacy choice 後不產生任何 legacy school-choice flag", !afterRecommendation.flags.some(flag => [
  "chose_powerhouse_high_school", "chose_playing_time_high_school", "chose_balanced_high_school"
].includes(flag)));
verify("7. 青少棒結算不再建立 highSchoolRoute truth", afterRecommendation.highSchoolRoute === "");
verify("8. Capability Settlement 沒有因 route cleanup 提前", afterRecommendation.settlementVersion === "");
verify("9. 跳過 legacy choice 不修改技能或重套 youth outcome", afterRecommendation.skillsStable && afterRecommendation.youthStable);
verify("10. 結算畫面明示尚未決定學校", afterRecommendation.story.includes("尚未決定下一所學校"));
verify("11. 新 Normal 結算不顯示 legacy 高中方向", !afterRecommendation.story.includes("高中方向：")
  && !afterRecommendation.story.includes("強豪高中・高競爭高曝光")
  && !afterRecommendation.story.includes("普通高中・穩定出賽")
  && !afterRecommendation.story.includes("課業並行・保留多重道路"));
verify("12. 下一個具體時刻指向高中邀請與比較", afterRecommendation.story.includes("高中的邀請即將陸續送到")
  && afterRecommendation.story.includes("比較條件並決定下一站"));
verify("13. 結算不再提前敘述高中報到", !afterRecommendation.story.includes("高中報到日") && !afterRecommendation.story.includes("已經報到"));
verify("14.『有高中可去』相容文案仍保留且上下文不矛盾", afterRecommendation.story.includes("有高中可去，不等於已找到適合這一輪球員的高中"));
verify("15. 山本推薦選擇結果不再假設已有校名", !afterRecommendation.story.includes("確認你的校名"));

const invitationEntry = parse(`(() => {
  const beforeSkills=JSON.stringify(player.baseballSkills);
  const beforeYouth=JSON.stringify(player.capabilityState.youthOutcomes);
  const beforeLedger=JSON.stringify(player.capabilityState.provenance.capabilityLedger);
  choose("junior_season_result",0);
  return {
    eventId:getCurrentEventId(),chapter:player.chapter,age:player.age,
    invitations:player.schoolInvitationState.invitations,
    state:player.schoolInvitationState,
    validation:validateHighSchoolEntryCapability(player),
    choices:document.getElementById("choices").innerHTML,
    skillsStable:beforeSkills===JSON.stringify(player.baseballSkills),
    youthStable:beforeYouth===JSON.stringify(player.capabilityState.youthOutcomes),
    ledgerStable:beforeLedger===JSON.stringify(player.capabilityState.provenance.capabilityLedger)
  };
})()`);
verify("16. 第一個正式 school decision 是 Four-School Invitation", invitationEntry.chapter === "青少棒階段小結"
  && invitationEntry.age === 15 && invitationEntry.state.compatibilityMode === "generation-only"
  && invitationEntry.state.selectionFinalized === false);
verify("17. Invitation 仍渲染 exactly four schools", invitationEntry.invitations.length === 4
  && (invitationEntry.choices.match(/class="school-invitation-card"/g) || []).length === 4);
verify("18. Four-School 畫面沒有 legacy 三選一按鈕", !["挑戰強豪高中", "選擇能穩定競爭出賽的高中", "選擇兼顧課業的學校"]
  .some(text => invitationEntry.choices.includes(text)));
verify("19. Normal Route 在 HS Entry 前只有 Four-School 一次正式選校", invitationEntry.state.selectedSchoolId === ""
  && invitationEntry.state.selectionFinalized === false
  && (invitationEntry.choices.match(/選擇這間學校/g) || []).length === 4);
verify("20. HS Entry Settlement 只在正式 boundary 完成", invitationEntry.validation.ok
  && invitationEntry.state.generatedAtCapabilityVersion === "hs-entry-capability-v1"
  && invitationEntry.state.selectionFinalizedAtCapabilityVersion === "");
verify("21. Settlement 不改既有技能、Youth outcomes 或 capability ledger", invitationEntry.skillsStable && invitationEntry.youthStable && invitationEntry.ledgerStable);

verify("22. 選校前 save/reload 保留同一組四校且不回 legacy event", evaluate(`(() => {
  const invitations=JSON.stringify(player.schoolInvitationState.invitations);
  saveGame(); player=createInitialPlayer(); loadGame();
  return JSON.stringify(player.schoolInvitationState.invitations)===invitations
    && isSchoolInvitationChoicePending(player)
    && getCurrentEventId()==="junior_season_result"
    && !document.getElementById("choices").innerHTML.includes("挑戰強豪高中");
})()`));
verify("23. Reload 前後 invitation generation seed 不 drift", evaluate(`(() => {
  const seed=player.schoolInvitationState.generationSeed;
  const result=generateSchoolInvitationSet(player);
  return result.generationSeed===seed && result===player.schoolInvitationState;
})()`));

const completedChoice = parse(`(() => {
  const expected=player.schoolInvitationState.invitations[1];
  beginSchoolInvitationConfirmationAt(1);
  const confirmText=document.getElementById("story").innerHTML;
  const confirmed=confirmSchoolInvitationSelection();
  const context=getSelectedHighSchoolContext(player);
  return {expected,confirmText,confirmed,state:player.schoolInvitationState,context,chapter:player.chapter,age:player.age};
})()`);
verify("24. Selection／confirmation 核心維持正常", completedChoice.confirmText.includes(completedChoice.expected.schoolName) && completedChoice.confirmed);
verify("25. 確認後唯一 selectedSchoolId 與 finalized state 正確", completedChoice.state.selectedSchoolId === completedChoice.expected.schoolId
  && completedChoice.state.selectionFinalized === true && completedChoice.state.selectionVersion === "school-choice-v1");
verify("26. 選校後正確進入既有高中故事", completedChoice.chapter === "青棒" && completedChoice.age === 16);
verify("27. School Context 仍由選中 invitation 唯讀投影", completedChoice.context.schoolId === completedChoice.expected.schoolId
  && completedChoice.context.schoolName === completedChoice.expected.schoolName
  && completedChoice.context.schoolTier === completedChoice.expected.schoolTier);
verify("28. 選校後 reload 不重選且 context 不 drift", evaluate(`(() => {
  const before=JSON.stringify(getSelectedHighSchoolContext(player));
  player=createInitialPlayer();loadGame();
  return player.chapter==="青棒" && !isSchoolInvitationChoicePending(player)
    && JSON.stringify(getSelectedHighSchoolContext(player))===before
    && !document.getElementById("choices").innerHTML.includes("school-invitation-card");
})()`));

verify("29. Legacy junior_school_choice event 與三個 choice 仍完整存在", evaluate(`juniorSeasonEvents.junior_school_choice.choices.length===3
  && juniorSeasonEvents.junior_school_choice.choices.some(choice=>choice.flags.includes("chose_powerhouse_high_school"))
  && juniorSeasonEvents.junior_school_choice.choices.some(choice=>choice.flags.includes("chose_playing_time_high_school"))
  && juniorSeasonEvents.junior_school_choice.choices.some(choice=>choice.flags.includes("chose_balanced_high_school"))`));
verify("30. 明確停在 legacy step 9 的 save 仍可 load", evaluate(`(() => {
  __normalPreHs101(19030);player.juniorSeasonStep=9;saveGame();player=createInitialPlayer();loadGame();
  return getCurrentEventId()==="junior_school_choice"
    && document.getElementById("choices").innerHTML.includes("挑戰強豪高中");
})()`));
verify("31. Legacy event 可完成並保留既有 flag／route compatibility", evaluate(`(() => {
  choose("junior_school_choice",0);
  return getCurrentEventId()==="junior_season_result"
    && hasFlag("chose_powerhouse_high_school")
    && player.highSchoolRoute==="強豪高中・高競爭高曝光"
    && getEvent("junior_season_result").text().includes("高中方向：強豪高中・高競爭高曝光");
})()`));
verify("32. Legacy choice 不會偷偷 finalize 新 School Choice", evaluate(`player.schoolInvitationState.selectedSchoolId===""
  && player.schoolInvitationState.selectionFinalized===false`));

verify("33. Existing High-School legacy save 不重開四校選校", evaluate(`(() => {
  const restored=normalizeSave({saveVersion:14,name:"既有高中舊存檔",age:17,chapter:"青棒第二年",idealSelf:"守備型",primaryPosition:"內野手",highSchoolRoute:"普通高中・穩定出賽",baseballSkills:{batting:4,baseRunning:3,baseballIQ:4}});
  player=restored;showCurrentEvent();
  return player.schoolInvitationState.compatibilityMode==="legacy-existing-school"
    && !isSchoolInvitationChoicePending(player)
    && !document.getElementById("choices").innerHTML.includes("school-invitation-card");
})()`));
verify("34. Direct Start 維持 direct-start-bypass 並直接進高中", evaluate(`(() => {
  resetGame();document.getElementById("nameInput").value="Direct v1.0.1";selectDevelopmentEntry("highSchool");selectedOrigin="understand";selectedIdealSelf="棒球理解型";
  pendingGenesisRoll=rollCharacterGenesis(()=>.25);
  pendingGenesisAllocation={ballSense:1,observe:1,fitness:0,batting:0,baseRunning:0,baseballIQ:1};
  createPlayer();
  return player.chapter==="青棒" && player.schoolInvitationState.compatibilityMode==="direct-start-bypass"
    && !isSchoolInvitationChoicePending(player);
})()`));
verify("35. High-School Debug Bookmark 維持 bypass 且不 crash", evaluate(`(() => {
  loadTestBookmark("highSchool");
  return player.chapter==="青棒" && player.schoolInvitationState.compatibilityMode==="debug-bookmark-bypass"
    && !isSchoolInvitationChoicePending(player);
})()`));

const playerSource = fs.readFileSync(path.join(root, "player.js"), "utf8");
const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
const storySource = fs.readFileSync(path.join(root, "story.js"), "utf8");
verify("36. School Invitation generator source 未因 v1.0.1 route fix 改寫", !scriptSource.includes("function generateSchoolInvitationSet")
  && playerSource.includes("function generateSchoolInvitationSet(target, options = {})"));
verify("37. Legacy event 註記未來只能重用為 preference／motivation seed", storySource.includes("preference／motivation seed")
  && storySource.includes("不能 finalize school"));
verify("38. Normal skip 明確只掛在 yamamoto_recommendation completion", scriptSource.includes('completedEventId === "yamamoto_recommendation"')
  && scriptSource.includes("index 9 僅留給明確載入的 legacy state"));

console.log(`\nInvitation Presentation v1.0.1 Legacy Route Conflict Fix：${passed}/${passed} PASS`);
