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
        id, innerHTML: "", textContent: "", value: id === "nameInput" ? "選校測試球員" : "",
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
evaluate(`function __prepareNormalSchoolChoice(seed=17001) {
  player=createRepresentativeHighSchoolEntryFixture("ordinary",seed);
  player.chapter="青少棒分化";
  player.age=15;
  player.highSchoolRoute="普通高中・穩定出賽";
  enterHighSchool();
  return player;
}`);

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("1. 正常高中入口完成 settlement 後停在選校 gate", evaluate(`(() => {
  __prepareNormalSchoolChoice();
  return validateHighSchoolEntryCapability(player).ok && isSchoolInvitationChoicePending(player)
    && player.chapter === "青少棒分化" && player.age === 15;
})()`));
verify("2. 選校 gate 使用既有且合法的四校 Invitation Set", evaluate(`validateSchoolInvitationSet(player.schoolInvitationState).ok
  && player.schoolInvitationState.compatibilityMode === "generation-only"
  && player.schoolInvitationState.invitations.length === 4`));
verify("3. 四筆 invitation 恰好渲染為四個可選學校區塊", evaluate(`(() => {
  const html=document.getElementById("choices").innerHTML;
  return (html.match(/class="school-invitation-card"/g)||[]).length===4
    && (html.match(/<button type="button"/g)||[]).length===4;
})()`));
verify("4. 四張卡片名稱與持久化資料一一對應", evaluate(`player.schoolInvitationState.invitations.every(item => document.getElementById("choices").innerHTML.includes(item.schoolName))`));
verify("5. 比較畫面提供升學脈絡與無單一答案的取捨提示", evaluate(`document.getElementById("story").innerHTML.includes("少年階段結束")
  && document.getElementById("story").innerHTML.includes("沒有單一答案")`));

const mappings = parse("SCHOOL_INVITATION_PRESENTATION_LABELS");
verify("6. 所有 tier identifier 都有玩家可讀標籤", Object.keys(mappings.tier).length === 4 && Object.values(mappings.tier).every(Boolean));
verify("7. 所有 training identifier 都有玩家可讀標籤", Object.keys(mappings.training).length === 4 && Object.values(mappings.training).every(Boolean));
verify("8. 所有 competition identifier 都有玩家可讀標籤", Object.keys(mappings.competition).length === 4 && Object.values(mappings.competition).every(Boolean));
verify("9. 所有 playing-time identifier 都有玩家可讀標籤", Object.keys(mappings.playingTime).length === 4 && Object.values(mappings.playingTime).every(Boolean));
verify("10. 所有 projected-role identifier 都明示只是預期", Object.keys(mappings.projectedRole).length === 5 && Object.values(mappings.projectedRole).every(value => value.includes("預期")));
verify("11. 所有 invitation reason code 都有可讀說明", evaluate(`Object.keys(SCHOOL_INVITATION_PRESENTATION_LABELS.reason).every(code => {
  const text=getSchoolInvitationReasonText(code); return text && !text.includes(code);
})`));
verify("12. preference reason 走共用 fallback 而不洩漏 identifier", evaluate(`!getSchoolInvitationReasonText("preference:development").includes("preference")`));
verify("13. 所有 risk code 都有可讀說明", evaluate(`Object.keys(SCHOOL_INVITATION_PRESENTATION_LABELS.risk).every(code => {
  const text=getSchoolInvitationRiskText(code); return text && !text.includes(code);
})`));
verify("14. 正常 UI 不會輸出 undefined 或 object 字串", evaluate(`(() => {
  const html=document.getElementById("story").innerHTML+document.getElementById("choices").innerHTML;
  return !html.includes("undefined") && !html.includes("[object Object]");
})()`));
verify("15. 正常 UI 不顯示 score、fit、seed 或其他內部欄位", evaluate(`(() => {
  const html=document.getElementById("story").innerHTML+document.getElementById("choices").innerHTML;
  return !/schoolInterest|capabilityMatch|recruitingStandard|deterministic|schoolSeed|coachId|school-(?:powerhouse|competitive|standard|development)/i.test(html);
})()`));
verify("16. 正常 UI 不使用最佳或推薦式措辭", evaluate(`(() => {
  const html=document.getElementById("story").innerHTML+document.getElementById("choices").innerHTML;
  return !/最佳|推薦|optimal|recommended|bestSchool/i.test(html);
})()`));
verify("17. 四校資訊區塊使用 article、heading 與語意 button", evaluate(`(() => {
  const html=document.getElementById("choices").innerHTML;
  return (html.match(/<article class="school-invitation-card"/g)||[]).length===4
    && (html.match(/<h3 id="schoolInvitationName/g)||[]).length===4
    && (html.match(/<button type="button"/g)||[]).length===4
    && !/<div[^>]*onclick=/.test(html);
})()`));
verify("18. 每張卡片都以一致順序呈現四個比較欄位", evaluate(`(() => {
  const html=document.getElementById("choices").innerHTML;
  const cards=html.split('<article class="school-invitation-card"').slice(1);
  return cards.every(card => {
    const labels=["訓練環境","隊內競爭","出賽機會","校方預期"];
    const positions=labels.map(label=>card.indexOf(label));
    return positions.every(value=>value>=0) && positions.every((value,index)=>index===0||value>positions[index-1]);
  });
})()`));

const firstSelection = parse(`(() => {
  __prepareNormalSchoolChoice(17002);
  const ids=player.schoolInvitationState.invitations.map(item=>item.schoolId);
  const names=player.schoolInvitationState.invitations.map(item=>item.schoolName);
  const started=beginSchoolInvitationConfirmationAt(0);
  return {ids,names,started,story:document.getElementById("story").innerHTML,choices:document.getElementById("choices").innerHTML};
})()`);
verify("19. 選擇 A 後確認頁正確顯示 A", firstSelection.started && firstSelection.story.includes(firstSelection.names[0]));
verify("20. 確認頁清楚說明預期角色不保證實際先發", firstSelection.story.includes("不保證實際先發") && firstSelection.story.includes("校方預期"));
verify("21. 取消確認會回到同一組四校比較", evaluate(`cancelSchoolInvitationConfirmation()
  && (document.getElementById("choices").innerHTML.match(/class="school-invitation-card"/g)||[]).length===4
  && player.schoolInvitationState.selectionFinalized===false`));
verify("22. 取消後可重新選擇原本的 A", evaluate("beginSchoolInvitationConfirmationAt(0) === true"));

const confirmed = parse(`(() => {
  const beforeSkills=JSON.stringify(player.baseballSkills);
  const expected=player.schoolInvitationState.invitations[0];
  const didConfirm=confirmSchoolInvitationSelection();
  const saved=JSON.parse(localStorage.getItem("baseballLifeRpgSave"));
  return {
    didConfirm, expected, beforeSkills, afterSkills:JSON.stringify(player.baseballSkills),
    state:player.schoolInvitationState, context:getSelectedHighSchoolContext(player),
    chapter:player.chapter, age:player.age, highSchoolStep:player.highSchoolStep,
    savedChapter:saved.chapter, savedState:saved.schoolInvitationState
  };
})()`);
verify("23. 確認 A 只持久化唯一 selectedSchoolId", confirmed.didConfirm && confirmed.state.selectedSchoolId === confirmed.expected.schoolId
  && confirmed.state.selectionFinalized === true && confirmed.state.selectionVersion === "school-choice-v1");
verify("24. B／C／D 沒有被複製成額外 selected truth", confirmed.state.invitations.slice(1).every(item => item.schoolId !== confirmed.state.selectedSchoolId)
  && !Object.prototype.hasOwnProperty.call(confirmed.state, "selectedSchoolProfile"));
verify("25. 選校確認先把 finalized 生涯狀態寫入存檔", confirmed.savedState.selectionFinalized === true
  && confirmed.savedState.selectedSchoolId === confirmed.expected.schoolId && confirmed.savedChapter === "青少棒分化");
verify("26. 確認後才進入既有高中第一年故事", confirmed.chapter === "青棒" && confirmed.age === 16 && confirmed.highSchoolStep === 0);
verify("27. 選校展示與選擇不改變 Capability 數值", confirmed.beforeSkills === confirmed.afterSkills);
verify("28. projected role 沒有偷寫成實際高中 role", confirmed.context.projectedRole === confirmed.expected.projectedRole
  && evaluate("player.highSchoolRoleCode === ''"));
verify("29. 高中 context 由選中的 invitation 唯讀投影", confirmed.context.schoolId === confirmed.expected.schoolId
  && confirmed.context.schoolName === confirmed.expected.schoolName && confirmed.context.schoolTier === confirmed.expected.schoolTier
  && confirmed.context.trainingQuality === confirmed.expected.trainingQuality
  && confirmed.context.competitionDepth === confirmed.expected.competitionDepth
  && confirmed.context.playingTimeOpportunity === confirmed.expected.playingTimeOpportunity
  && JSON.stringify(confirmed.context.coachProfile) === JSON.stringify(confirmed.expected.coachProfile));
verify("30. School Context 深層 frozen，不能成為可漂移副本", evaluate(`Object.isFrozen(getSelectedHighSchoolContext(player))
  && Object.isFrozen(getSelectedHighSchoolContext(player).coachProfile)`));
verify("31. 完成選擇後 status 顯示校名而不顯示原始 tier", evaluate(`(() => {
  updateStatus(); const html=document.getElementById("status").innerHTML;
  const selected=getSelectedSchoolInvitation(player);
  return html.includes(selected.schoolName) && !html.includes(selected.schoolTier);
})()`));
verify("32. finalized 狀態重新 render 不會重開選校", evaluate(`(() => {
  showCurrentEvent(); updateStatus();
  return !document.getElementById("choices").innerHTML.includes("school-invitation-card");
})()`));
verify("33. double confirm 不會第二次推進高中 step", evaluate(`(() => {
  const step=player.highSchoolStep; const second=confirmSchoolInvitationSelection();
  return second===false && player.highSchoolStep===step;
})()`));
verify("34. finalized 核心操作同校 idempotent、異校拒絕改選", evaluate(`(() => {
  const ids=player.schoolInvitationState.invitations.map(item=>item.schoolId);
  return finalizeSchoolInvitationSelection(player,ids[0]).ok
    && finalizeSchoolInvitationSelection(player,ids.find(id=>id!==ids[0])).ok===false;
})()`));

verify("35. 選校前 save/reload 保留同一組四校且仍未選校", evaluate(`(() => {
  __prepareNormalSchoolChoice(17003);
  const before=JSON.stringify(player.schoolInvitationState.invitations);
  saveGame(); player=createInitialPlayer(); loadGame();
  return JSON.stringify(player.schoolInvitationState.invitations)===before
    && isSchoolInvitationChoicePending(player) && player.schoolInvitationState.selectionFinalized===false;
})()`));
verify("36. 選校後 reload 保留同校與完整 context 並直接續進高中", evaluate(`(() => {
  __prepareNormalSchoolChoice(17004);
  const expected=player.schoolInvitationState.invitations[2];
  finalizeSchoolInvitationSelection(player,expected.schoolId);
  saveGame(); player=createInitialPlayer(); loadGame();
  const context=getSelectedHighSchoolContext(player);
  return player.chapter==="青棒" && player.age===16 && context.schoolId===expected.schoolId
    && context.schoolTier===expected.schoolTier && context.trainingQuality===expected.trainingQuality
    && context.competitionDepth===expected.competitionDepth
    && context.playingTimeOpportunity===expected.playingTimeOpportunity
    && context.coachProfile.coachId===expected.coachProfile.coachId
    && context.coachProfile.coachStyle===expected.coachProfile.coachStyle
    && !document.getElementById("choices").innerHTML.includes("school-invitation-card");
})()`));

const echoAudit = parse(`(() => {
  const base=__prepareNormalSchoolChoice(17010);
  const left=normalizeSave(JSON.parse(JSON.stringify(base)));
  const right=normalizeSave(JSON.parse(JSON.stringify(base)));
  left.flags=[...(left.flags||[]),"challengePower"];
  right.flags=[...(right.flags||[]),"aspireToPower"];
  const invitation=createSchoolProfile("identity-echo-powerhouse","powerhouse",0);
  return {
    leftState:left.schoolInvitationState,
    rightState:right.schoolInvitationState,
    leftEcho:getSchoolInvitationIdentityEcho(left,invitation),
    rightEcho:getSchoolInvitationIdentityEcho(right,invitation)
  };
})()`);
verify("37. challengePower 與 aspireToPower 只改敘事回音", echoAudit && echoAudit.leftEcho && echoAudit.rightEcho && echoAudit.leftEcho !== echoAudit.rightEcho);
verify("38. Identity Echo 不改四校結構或招生現實", JSON.stringify(echoAudit.leftState) === JSON.stringify(echoAudit.rightState));

verify("39. High School Direct Start 仍 bypass 選校並直接進高中", evaluate(`(() => {
  player=createRepresentativeHighSchoolEntryFixture("direct",17030);
  player.chapter="青少棒分化";player.age=15;player.flags=[...(player.flags||[]),"direct_start_history"];
  enterHighSchool();
  return player.chapter==="青棒" && player.schoolInvitationState.compatibilityMode==="direct-start-bypass"
    && player.schoolInvitationState.selectionFinalized===false
    && !document.getElementById("choices").innerHTML.includes("school-invitation-card");
})()`));
verify("40. Debug Bookmark 不 crash 且不被正常選校 gate 攔截", evaluate(`(() => {
  loadTestBookmark("highSchool");
  return player.chapter==="青棒" && player.schoolInvitationState.compatibilityMode==="debug-bookmark-bypass"
    && !isSchoolInvitationChoicePending(player)
    && !document.getElementById("choices").innerHTML.includes("school-invitation-card");
})()`));
verify("41. Existing High-School legacy save 會走 compatibility bypass", evaluate(`(() => {
  const legacy=createInitialPlayer("舊高中存檔");legacy.chapter="青棒";legacy.age=16;legacy.highSchoolRoute="地方高中";
  const restored=normalizeSave(legacy);
  return restored.schoolInvitationState.compatibilityMode==="legacy-existing-school"
    && !isSchoolInvitationChoicePending(restored);
})()`));

const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
verify("42. 四校卡片具備桌面 grid 與窄畫面單欄規則", /\.school-invitation-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css)
  && /@media \(max-width: 900px\)[\s\S]*?\.school-invitation-grid[\s\S]*?grid-template-columns:\s*1fr/.test(css));
verify("43. 選校按鈕沿用全域可見 focus contract", /button[^}]*:focus-visible|:where\(button[^)]*\):focus-visible/.test(css)
  && /:focus-visible\s*\{[\s\S]*?outline/.test(css));

console.log(`\nInvitation Presentation / School Choice Integration v1: ${passed}/${passed} PASS`);
