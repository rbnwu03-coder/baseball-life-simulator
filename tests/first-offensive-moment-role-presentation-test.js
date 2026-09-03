const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "match-experience-development.js", "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const context = vm.createContext({
  console, module: { exports: {} },
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } }); return nodes.get(id); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);

evaluate(`
  function __rolePresentationMatch(careerRole="starter",actualStatus="starter",entered=true,appearanceType="start") {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Actual Role");applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"});applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";player.highSchoolTeamRole="先發測試";
    pendingHighSchoolMatchSimulationSeed=99301;
    const m=prepareHighSchoolYearOneMatch();
    Object.assign(m,{role:careerRole,playerLineupStatus:actualStatus,playerEntryCompleted:entered,momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"offense",simulationPhase:"moment_1_ready",offenseTeam:"home",defenseTeam:"away",currentBatter:"player",position:"內野手",developmentPositionOverride:"二壘手",currentFieldingPosition:"二壘手",playerFieldingAssignment:"二壘手"});
    m.gameExposureState={...(m.gameExposureState||{}),plannedUsage:{...((m.gameExposureState||{}).plannedUsage||{}),appearanceType}};
    if(actualStatus==="substitute"&&entered)m.simulationLog.push({type:"playerEntry",sequence:m.simulationLog.length,plannedAppearanceType:appearanceType,inning:m.inning,half:m.half});
    player.highSchoolMatch=m;return m;
  }
`);

const benchStarter = evaluate(`(() => {const m=__rolePresentationMatch("bench","starter",true,"start");return getHighSchoolYearOneMatchPresentation();})()`);
verify("A. Career bench + actual starter 使用先發第一打席文案", benchStarter.includes("先發計畫裡迎來前段打席") && !/代打|替補上場|拿起球棒/.test(benchStarter));

const rotationStarter = evaluate(`(() => {const m=__rolePresentationMatch("rotation","starter",true,"start");return getHighSchoolYearOneMatchPresentation();})()`);
verify("B. Career rotation + actual starter 仍使用先發文案", rotationStarter.includes("先發計畫裡迎來前段打席") && !/代打|替補/.test(rotationStarter));

const starterStarter = evaluate(`(() => {const m=__rolePresentationMatch("starter","starter",true,"start");return getHighSchoolYearOneMatchPresentation();})()`);
verify("C. Career starter + actual starter 保留既有 starter wording", starterStarter.includes("你在先發計畫裡迎來前段打席。"));

const benchSubstitute = evaluate(`(() => {const m=__rolePresentationMatch("bench","substitute",true,"pinchHit");return getHighSchoolYearOneMatchPresentation();})()`);
verify("D. Career bench + canonical pinch-hit substitute 才允許代打語義", benchSubstitute.includes("準備代打") && benchSubstitute.includes("進入本場後的第一個打席"));

const starterSubstitute = evaluate(`(() => {const m=__rolePresentationMatch("starter","substitute",true,"lateGameAppearance");return getHighSchoolYearOneMatchPresentation();})()`);
verify("E. Career starter 不會覆蓋 actual substitute 身分", starterSubstitute.includes("替補進入本場打序後") && !starterSubstitute.includes("先發計畫"));

const later = evaluate(`(() => {const m=__rolePresentationMatch("bench","starter",true,"start");m.momentIndex=2;m.currentMomentId=highSchoolYearOneMomentIds[2];const a=getHighSchoolYearOneMatchPresentation();m.role="starter";const b=getHighSchoolYearOneMatchPresentation();return a===b;})()`);
verify("F. Later offensive moment 文案不受 first-PA authority 修正影響", later);

const continuity = JSON.parse(evaluate(`(() => {const m=__rolePresentationMatch("bench","starter",true,"start"),before={position:m.playerFieldingAssignment,override:m.developmentPositionOverride,slot:m.playerLineupSlot,entered:m.playerEntryCompleted,lineup:m.rosters.home.lineup.map(x=>x.id)};getHighSchoolYearOneMatchPresentation();const after={position:m.playerFieldingAssignment,override:m.developmentPositionOverride,slot:m.playerLineupSlot,entered:m.playerEntryCompleted,lineup:m.rosters.home.lineup.map(x=>x.id)};return JSON.stringify({same:JSON.stringify(before)===JSON.stringify(after),before,after});})()`));
verify("G. Presentation 不修改二壘守位、entry state、lineup slot 或 lineup", continuity.same && continuity.after.position === "二壘手" && continuity.after.entered);

const noFalseEvidence = JSON.parse(evaluate(`(() => {const m=__rolePresentationMatch("bench","starter",true,"start"),before={log:JSON.stringify(m.simulationLog),exposure:JSON.stringify(m.gameExposureState),status:m.playerLineupStatus};getHighSchoolYearOneMatchPresentation();const after={log:JSON.stringify(m.simulationLog),exposure:JSON.stringify(m.gameExposureState),status:m.playerLineupStatus};return JSON.stringify({same:JSON.stringify(before)===JSON.stringify(after),hasEntry:m.simulationLog.some(e=>e.type==="playerEntry")});})()`));
verify("H. Career bench + actual starter 不產生假 substitution／bench-entry evidence", noFalseEvidence.same && !noFalseEvidence.hasEntry);

const benchGuard = evaluate(`(() => {const m=__rolePresentationMatch("bench","bench",false,"noAppearance");m.rosters.home.lineup[m.playerLineupSlot]={id:"player",position:"二壘手"};m.battingOrderIndex.home=m.playerLineupSlot;m.currentBatter="player";return shouldCreateHighSchoolFirstOffensiveMoment(m)===false;})()`);
verify("Guard. Bench 未進場即使遇到矛盾 lineup fixture 也不建立正式玩家 PA", benchGuard);

console.log(`First Offensive Moment Actual Role Presentation tests: ${passed}/${passed} passed`);
