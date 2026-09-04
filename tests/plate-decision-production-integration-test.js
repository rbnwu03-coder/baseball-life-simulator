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
  "pitcher-process-state.js", "pitch-sequencing.js", "pitcher-catcher-tactical-integration.js", "batter-anticipation.js", "batted-ball-physical.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "batted-ball-ground-defense.js",
  "batted-ball-line-drive-defense.js", "batted-ball-fly-ball-defense.js", "batted-ball-tag-up-execution.js", "match-situation-lifecycle.js",
  "plate-decision-foundation.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
  "match-experience-development.js", "match-development-settlement-presentation.js", "career-spine-contract.js",
  "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
  "career-development-progression.js", "career-age22-outcome-resolver.js", "career-save-admission.js", "story.js", "save.js", "script.js"
];
const nodes = new Map();
const storage = new Map();
const context = vm.createContext({
  console, module: { exports: {} },
  document: {
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, { id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; } }); return nodes.get(id); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  },
  localStorage: { setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); } },
  window: { setTimeout() { return 1; }, clearTimeout() {} }
});
runtimeFiles.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
const evaluate = expression => vm.runInContext(expression, context);

evaluate(`
  function __plateMatch(seed=99701) {
    stopHighSchoolMatchPlayback();pendingYouthSeasonOutcome=null;isTransitioning=false;
    player=createInitialPlayer("逐球決策測試");applyDebugBookmarkCharacterProfile(player);settleHighSchoolEntryCapability(player,{originType:"test-fixture"});
    Object.assign(player,{observe:9,ballSense:9,reaction:9});Object.assign(player.baseballSkills,{batting:9,power:9,baseballIQ:9});
    player.chapter="青棒";player.highSchoolStep=5;player.highSchoolRoleCode="starter";player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;const m=prepareHighSchoolYearOneMatch();
    Object.assign(m,{inning:5,half:"下",offenseTeam:"home",defenseTeam:"away",outs:0,runners:[null,null,null],scores:{home:1,away:1},momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"offense",simulationPhase:"moment_1_ready",completed:false,settled:false,completedMoments:[],offensivePlateAppearanceState:null,plateDecisionState:null,activeSituation:null});
    return m;
  }
  function __choice(m) { return buildOffensiveDecisionChoices(m).find(x=>x.matchDecision==="zone"); }
`);

const prepared = JSON.parse(evaluate(`(() => {const m=__plateMatch();const c=__choice(m);const s=prepareHighSchoolPlateDecision(m,c,{pitch:{pitchLocationClass:"clearBall",pitchType:"changeup",velocity:78,movement:"fading",location:"below-zone"},recognitionRoll:0});return JSON.stringify({s,choices:getHighSchoolPlateDecisionChoices(m),visible:isHighSchoolMatchDecisionVisible(m),html:renderHighSchoolPlateDecisionContext(m),truth:m.offensivePlateAppearanceState.pendingPitch,state:m.plateDecisionState});})()`));
verify("1. Production PA-level approach 下接 canonical plateDecision Situation", prepared.s.type === "plateDecision" && prepared.s.lifecycleState === "presented" && prepared.visible);
verify("2. Production 只呈現 Take／Contact Swing／Power Swing 三條逐球 route", prepared.choices.map(x => x.matchDecision).join(",") === "take,contactSwing,powerSwing");
verify("3. Pitch truth 具 identity、type、velocity、location、zone、movement、pitcher、PA、count", prepared.truth.pitchId && prepared.truth.pitchType && Number.isFinite(prepared.truth.velocity) && prepared.truth.location && prepared.truth.zone && prepared.truth.movement && prepared.truth.pitcherId && prepared.truth.paIdentity && prepared.truth.count);
verify("4. UI 只顯示 perceived context，不洩漏 pitch type、mph 或 raw identity", prepared.html.includes("即時判讀") && prepared.html.includes("速度") && !prepared.html.includes("changeup") && !prepared.html.includes(prepared.truth.pitchId) && !prepared.html.includes("78"));
verify("5. Decision 前 situation 不含 whiff/contact/ball/strike outcome", !Object.hasOwn(prepared.s.contextSnapshot, "pitchResult") && !Object.hasOwn(prepared.s.contextSnapshot, "contact") && !Object.hasOwn(prepared.s.contextSnapshot, "outcome"));

const reloaded = JSON.parse(evaluate(`(() => {const m=__plateMatch(99702),c=__choice(m);prepareHighSchoolPlateDecision(m,c,{recognitionRoll:.5});player.highSchoolMatch=m;const before={pitch:m.offensivePlateAppearanceState.pendingPitch,perceived:m.activeSituation.contextSnapshot.perceivedPitch,id:m.activeSituation.situationId};player=normalizeSave(JSON.parse(JSON.stringify(player)));const after=player.highSchoolMatch;return JSON.stringify({before,after:{pitch:after.offensivePlateAppearanceState.pendingPitch,perceived:after.activeSituation.contextSnapshot.perceivedPitch,id:after.activeSituation.situationId,type:after.activeSituation.type,plate:after.plateDecisionState}});})()`));
verify("6. Save/reload before decision 保留同一 actual pitch、tactical call、perception 與 situation identity", JSON.stringify(reloaded.before) === JSON.stringify({ pitch: reloaded.after.pitch, perceived: reloaded.after.perceived, id: reloaded.after.id }) && reloaded.before.pitch.pitchTacticalState?.pitcherResponse.accepted && reloaded.after.type === "plateDecision" && reloaded.after.plate.situationId === reloaded.after.id);

const oneBall = JSON.parse(evaluate(`(() => {const m=__plateMatch(99703),c=__choice(m);prepareHighSchoolPlateDecision(m,c,{pitch:{pitchLocationClass:"clearBall"},recognitionRoll:0});const first=m.activeSituation.situationId;const r=resolveHighSchoolPlateDecisionPitch(m,"take");return JSON.stringify({r,count:m.offensivePlateAppearanceState,first,next:m.activeSituation,history:m.offensivePlateAppearanceState.pitchHistory});})()`));
verify("7. Take ball 只更新一次 count，未提前完成 PA", oneBall.r.event.pitchResult === "ball" && oneBall.count.balls === 1 && oneBall.count.pitchNumber === 1 && !oneBall.count.completed);
verify("8. 未終止 PA 會建立下一顆不同 identity，上一球不 reroll", oneBall.next.type === "plateDecision" && oneBall.next.situationId !== oneBall.first && oneBall.history.length === 1);

const contact = JSON.parse(evaluate(`(() => {const m=__plateMatch(99704),c=__choice(m);prepareHighSchoolPlateDecision(m,c,{pitch:{pitchLocationClass:"hitterPitch"},recognitionRoll:0});const r=resolveHighSchoolPlateDecisionPitch(m,"contactSwing",{timingRoll:0,batToBallRoll:0,foulRoll:1,physicalRolls:{contactQuality:.7,ballType:.2,pace:.6,direction:.6},outcomeRoll:.5});return JSON.stringify({r,pa:m.offensivePlateAppearanceState,active:m.activeSituation});})()`));
verify("9. Production Contact Swing 成功交給既有 BBP authority", contact.r.event.pitchResult === "ballInPlay" && contact.pa.battedBallPhysicalTruth?.version === "batted-ball-physical-v1" && contact.r.plateAppearanceCompleted && contact.active === null);

const walkSettlement = JSON.parse(evaluate(`(() => {const m=__plateMatch(99705),c=__choice(m);let pa=ensureHighSchoolOffensivePlateAppearanceState(m,c);m.offensivePlateAppearanceState=JSON.parse(JSON.stringify(OffensivePlateApproach.createPlateAppearanceState({...pa,balls:3})));prepareHighSchoolPlateDecision(m,c,{pitch:{pitchLocationClass:"clearBall"},recognitionRoll:0});const pitch=resolveHighSchoolPlateDecisionPitch(m,"take");const before=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;const moment=resolveHighSchoolOffensiveDecision(m,pitch.selectedOffensiveChoice,null);const after=m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId==="player").length;const again=resolveHighSchoolOffensiveDecision(m,pitch.selectedOffensiveChoice,null);return JSON.stringify({pitch,moment,before,after,again,count:m.offensivePlateAppearanceState});})()`));
verify("10. Ball four 由逐球 count 終止並交既有 PA settlement", walkSettlement.pitch.plateAppearanceCompleted && walkSettlement.moment.resultCode === "walk" && walkSettlement.after === walkSettlement.before + 1);
verify("11. PA settlement idempotent，不 double walk／PA／打序", walkSettlement.again === false && walkSettlement.count.resultApplied === true);

const strikeout = JSON.parse(evaluate(`(() => {const m=__plateMatch(99706),c=__choice(m);let pa=ensureHighSchoolOffensivePlateAppearanceState(m,c);m.offensivePlateAppearanceState=JSON.parse(JSON.stringify(OffensivePlateApproach.createPlateAppearanceState({...pa,strikes:2})));prepareHighSchoolPlateDecision(m,c,{pitch:{pitchLocationClass:"competitiveStrike"},recognitionRoll:0});const r=resolveHighSchoolPlateDecisionPitch(m,"powerSwing",{timingRoll:1,batToBallRoll:1});return JSON.stringify({r,pa:m.offensivePlateAppearanceState});})()`));
verify("12. Production Power Swing miss 在兩好球形成 strikeout", strikeout.r.event.pitchResult === "swingingStrike" && strikeout.pa.result === "strikeout" && strikeout.pa.strikes === 3);

const nonPlayer = JSON.parse(evaluate(`(() => {const m=__plateMatch(99707);m.half="上";m.offenseTeam="away";m.defenseTeam="home";m.currentBatter=m.rosters.away.lineup[0].id;const result=resolveSimulatedHighSchoolPlateAppearance(m);return JSON.stringify({result,plate:m.plateDecisionState,active:m.activeSituation});})()`));
verify("13. 非玩家 PA 維持既有 simulation，未被 plateDecision 攔截", Boolean(nonPlayer.result) && nonPlayer.plate === null && nonPlayer.active === null);
const tacticalContinuity = JSON.parse(evaluate(`(() => {const m=__plateMatch(99708),c=__choice(m);prepareHighSchoolPlateDecision(m,c,{recognitionRoll:0});const first=m.offensivePlateAppearanceState.pendingPitch.pitchId;resolveHighSchoolPlateDecisionPitch(m,"powerSwing",{timingRoll:1,batToBallRoll:1});player.highSchoolMatch=m;player=normalizeSave(JSON.parse(JSON.stringify(player)));const saved=player.highSchoolMatch;const history=saved.pitcherTacticalSequenceHistory;const trace=saved.pitcherTacticalDebugTrace;const next=saved.offensivePlateAppearanceState.pendingPitch;return JSON.stringify({first,history,trace,next});})()`));
verify("14. Production pitch feedback 同步至 match-local history 並跨 reload 餵入下一球", tacticalContinuity.history.length === 1 && tacticalContinuity.history[0].pitchIdentity === tacticalContinuity.first && tacticalContinuity.trace.length === 1 && tacticalContinuity.next.pitchTacticalState.context.sequenceHistory.length === 1);
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
verify("15. Runtime load order 先建立 Sequencing／Tactical／OPA，再於 lifecycle 後載入 Plate Decision", indexHtml.indexOf("pitch-sequencing.js") < indexHtml.indexOf("pitcher-catcher-tactical-integration.js") && indexHtml.indexOf("pitcher-catcher-tactical-integration.js") < indexHtml.indexOf("offensive-plate-approach.js") && indexHtml.indexOf("match-situation-lifecycle.js") < indexHtml.indexOf("plate-decision-foundation.js") && indexHtml.indexOf("plate-decision-foundation.js") < indexHtml.indexOf("script.js"));

console.log(`Plate Decision Production Integration tests: ${passed}/${passed} passed`);
