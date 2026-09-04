const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "match-situation-lifecycle.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
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
vm.runInContext(`
  function __b101Match(seed=77301) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Bunt Sprint B1.0.1"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const match=prepareHighSchoolYearOneMatch();
    Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:["away-sim-2",null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"flow",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手",completedMoments:[{id:highSchoolYearOneMomentIds[0],domain:"offense",decision:"zone",tier:"mixed",outcome:"測試打席",consequence:"比賽繼續",inning:4,half:"下",outs:1,scores:{home:1,away:1},runners:[]} ]});
    match.battingOrderIndex.away=2; match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id; player.highSchoolMatch=match; return match;
  }
  function __throughBuntEvent(match,event) { while(getHighSchoolPresentedEventCursor(match)<=event.sequence) advanceHighSchoolPresentationCursor(match); }
`, context);
const evaluate = expression => vm.runInContext(expression, context);

const scriptSource = fs.readFileSync(path.join(root, "script.js"), "utf8");
verify("1. production defensive entry point 直接包含 B1 production invocation hook", /function prepareHighSchoolDefensiveMomentFromSimulation[\s\S]*?resolveHighSchoolProductionBuntPitch\(match/.test(scriptSource));

const holdOptions = `{tacticalActionOverride:"sacrificeBunt",buntPitchOptions:{actualPitch:{pitchLocationClass:"clearBall",strike:false},recognition:{correct:true,perceivedPitchClass:"clearBall"},rolls:{attempt:.99}}}`;
verify("2. Production Hold：正式 defensive flow 自動進入 B1 resolver", evaluate(`(() => {const m=__b101Match();const e=prepareHighSchoolDefensiveMomentFromSimulation(m,${holdOptions});const h=m.offensiveBuntPAState.pitchHistory;return e.type==="buntPitchResolved"&&h.length===1&&h[0].buntResolution.attemptDecision==="hold"&&h[0].countResult.pitchResult==="ball";})()`));
verify("3. Production Hold：PA continues、plan persists，且沒有 fair-ball defensive moment", evaluate(`(() => {const m=player.highSchoolMatch;return m.offensiveBuntPAState.status==="active"&&m.offensiveBuntPAState.count.balls===1&&m.currentDomain==="flow"&&!m.defensiveSituation?.familyId&&!m.simulationLog.some(e=>e.type==="meaningfulMomentReached"&&e.domain==="defense");})()`));
verify("4. 同一未呈現 pitch 重複 prepare 仍只 resolve 一次", evaluate(`(() => {const m=player.highSchoolMatch;const before=m.offensiveBuntPAState.pitchHistory.length;const first=m.simulationLog.at(-1);const again=prepareHighSchoolDefensiveMomentFromSimulation(m,${holdOptions});return before===1&&m.offensiveBuntPAState.pitchHistory.length===1&&again.sequence===first.sequence;})()`));

verify("5. Production Foul：正式 flow 更新 strike、保留 PA 且不建立守備球", evaluate(`(() => {const m=__b101Match(77302);const e=prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"sacrificeBunt",buntPitchOptions:{actualPitch:{pitchLocationClass:"clearBall",strike:false},recognition:{correct:false,perceivedPitchClass:"chasePitch"},rolls:{attempt:0,preparation:0,contact:.4}}});const r=m.offensiveBuntPAState.pitchHistory[0];return e.type==="buntPitchResolved"&&r.buntResolution.contactResult==="foulContact"&&m.offensiveBuntPAState.count.strikes===1&&!m.offensiveBuntPAState.completed&&!m.defensiveSituation?.familyId;})()`));
verify("5a. Production Miss：正式 flow 更新 strike、保留 PA 且不建立 fair-ball defense", evaluate(`(() => {const m=__b101Match(773021);const e=prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"sacrificeBunt",buntPitchOptions:{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:0,contact:0}}});const r=m.offensiveBuntPAState.pitchHistory[0];return e.type==="buntPitchResolved"&&r.buntResolution.contactResult==="miss"&&r.countResult.pitchResult==="swingingStrike"&&m.offensiveBuntPAState.count.strikes===1&&!m.offensiveBuntPAState.completed&&!m.defensiveSituation?.familyId;})()`));

verify("6. Production Two-strike Foul：Count／PA authority 結束 PA 且只增加一個 out", evaluate(`(() => {const m=__b101Match(77303);const batter=m.currentBatter,index=m.battingOrderIndex.away;const e=prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"sacrificeBunt",buntInitialCount:{balls:1,strikes:2},buntPitchOptions:{actualPitch:{pitchLocationClass:"clearBall",strike:false},recognition:{correct:false,perceivedPitchClass:"chasePitch"},rolls:{attempt:0,preparation:0,contact:.4}}});return e.paResult==="strikeout"&&m.offensiveBuntPAState.completed&&m.offensiveBuntPAState.pitchHistory.length===1&&m.outs===1&&m.battingOrderIndex.away===(index+1)%9&&m.currentBatter!==batter&&m.simulationLog.filter(x=>x.type==="plateAppearance"&&x.batterId===batter).length===1;})()`));
verify("7. Two-strike Foul render／save normalization 不會重複 count、out 或 PA event", evaluate(`(() => {const m=player.highSchoolMatch;const before={outs:m.outs,index:m.battingOrderIndex.away,pa:m.simulationLog.filter(x=>x.type==="plateAppearance").length,bunt:m.simulationLog.filter(x=>x.type==="buntPitchResolved").length};getHighSchoolMatchPresentation(m);getHighSchoolMatchPresentation(m);normalizeSave(JSON.parse(JSON.stringify(player)));return m.outs===before.outs&&m.battingOrderIndex.away===before.index&&m.simulationLog.filter(x=>x.type==="plateAppearance").length===before.pa&&m.simulationLog.filter(x=>x.type==="buntPitchResolved").length===before.bunt;})()`));

const fairOptions = `{tacticalActionOverride:"sacrificeBunt",buntPitchOptions:{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:.4,contact:.99,fairBallType:.9,pace:.99,placement:.51}}}`;
verify("8. Production Fair：正式 flow 持久化 hard／secondBaseSide canonical truth", evaluate(`(() => {const m=__b101Match(77304);const runners=JSON.stringify(m.runners);const e=prepareHighSchoolDefensiveMomentFromSimulation(m,${fairOptions});const r=m.offensiveBuntPAState.pitchHistory[0].buntResolution;return e.type==="buntPitchResolved"&&r.contactResult==="fairContact"&&r.fairBallType==="groundBunt"&&r.pace==="hard"&&r.placement==="secondBaseSide"&&JSON.stringify(m.runners)===runners;})()`));
verify("9. Fair Bunt 首次 production beat 不產生 runner target、route、DP 或 final outcome", evaluate(`(() => {const m=player.highSchoolMatch,r=m.offensiveBuntPAState.pitchHistory[0].buntResolution;return r.runnerMovement===null&&r.runnerTargets===null&&r.defensiveRoutes===null&&r.finalOutcome===null&&!m.defensiveSituation?.familyId;})()`));
verify("10. Fair Bunt presentation 播放後才允許既有 defense 繼續，且不重算 B1 pitch", evaluate(`(() => {const m=player.highSchoolMatch,e=m.simulationLog.find(x=>x.type==="buntPitchResolved");__throughBuntEvent(m,e);const before=JSON.stringify(m.offensiveBuntPAState.pitchHistory);prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"sacrificeBunt",situationOverrides:{playerPosition:"二壘手",ballDirection:"rightSide"}});return before===JSON.stringify(m.offensiveBuntPAState.pitchHistory)&&m.offensiveBuntPAState.pitchHistory.length===1;})()`));

verify("11. surpriseBunt 也由正式 flow 自動進入 B1，late reveal 進 preparation", evaluate(`(() => {const m=__b101Match(77305);prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"surpriseBunt",buntPitchOptions:{actualPitch:{pitchLocationClass:"edgeStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"edgeStrike"},rolls:{attempt:0,preparation:.78,contact:.99,fairBallType:.9,pace:.26,placement:.26}}});const r=m.offensiveBuntPAState.pitchHistory[0].buntResolution;return r.revealTiming==="late"&&["rushed","broken"].includes(r.preparationState)&&r.contactResult==="fairContact";})()`));

verify("12. Standard Attack 正式 flow 完全不建立或呼叫 B1 state", evaluate(`(() => {const m=__b101Match(77306);const cursor=m.simulationCursor;const e=prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"standardAttack",situationOverrides:{playerPosition:"二壘手",ballDirection:"rightSide"}});return m.offensiveBuntPAState===null&&!m.simulationLog.some(x=>x.type==="buntPitchResolved")&&m.simulationCursor===cursor&&e?.type!=="buntPitchResolved";})()`));

verify("13. Production save/reload：未呈現 pitch 不 reroll、不重複 history/count/reveal", evaluate(`(() => {const m=__b101Match(77307);const e=prepareHighSchoolDefensiveMomentFromSimulation(m,${holdOptions});player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const before=JSON.stringify(restored.offensiveBuntPAState);const revealCount=restored.offensiveTacticalActionState.observableEvents.length;const again=prepareHighSchoolDefensiveMomentFromSimulation(restored,${holdOptions});return again.buntPitchIdentity===e.buntPitchIdentity&&JSON.stringify(restored.offensiveBuntPAState)===before&&restored.offensiveTacticalActionState.observableEvents.length===revealCount&&restored.offensiveBuntPAState.pitchHistory.length===1;})()`));
verify("14. Production pitch history 是 Actual Pitch／Recognition／Count 的單一 B1 authority", evaluate(`(() => {const h=player.highSchoolMatch.offensiveBuntPAState.pitchHistory[0];return h.buntResolution.actualPitch.pitchLocationClass==="clearBall"&&h.buntResolution.recognition.authority==="existingActualPitchRecognition"&&h.countResult.outcomeAuthority==="countAndPARules";})()`));
verify("15. Bunt presentation 只讀 canonical physical projection，hold 不會顯示球已點進場內", evaluate(`(() => {const m=player.highSchoolMatch,e=m.simulationLog.find(x=>x.type==="buntPitchResolved");const text=formatMatchSimulationEvent(e,m).text;return text.includes("收回短棒")&&text.includes("打席繼續")&&!text.includes("點進場內");})()`));

const tacticalReassessment = JSON.parse(evaluate(`(() => {
  const m=__b101Match(77308);m.outs=1;
  const beforeIdentity=createHighSchoolOffensiveTacticalIdentity(m);
  const event=prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"sacrificeBunt",buntInitialCount:{balls:1,strikes:2},buntPitchOptions:{actualPitch:{pitchLocationClass:"clearBall",strike:false},recognition:{correct:false,perceivedPitchClass:"chasePitch"},rolls:{attempt:0,preparation:0,contact:.4}}});
  const summary=JSON.parse(JSON.stringify(m.lastClosedSituationSummary));
  const next=prepareHighSchoolOffensiveTacticalAction(m);
  return JSON.stringify({eventType:event.type,outs:m.outs,beforeIdentity,nextIdentity:next.identity,selected:next.selectedTacticalAction,candidates:highSchoolOffensiveTacticalDebugTrace.candidateActions,entries:highSchoolOffensiveTacticalDebugTrace.opportunityEntries,summary,previous:highSchoolOffensiveTacticalDebugTrace.previousSituationSummary});
})()`));
verify("16. Mandatory scenario：1 out sacrifice bunt failure 只增加一個 out 並關閉前 tactical situation summary", tacticalReassessment.outs === 2 && tacticalReassessment.summary.lifecycleState === "closed" && tacticalReassessment.summary.previousTacticalAction === "sacrificeBunt" && tacticalReassessment.summary.outsBefore === 1 && tacticalReassessment.summary.outsAfter === 2);
verify("17. 下一 PA 使用新 identity 並重新執行 tactical admission", tacticalReassessment.beforeIdentity !== tacticalReassessment.nextIdentity && tacticalReassessment.previous.situationId === tacticalReassessment.summary.situationId);
verify("18. 兩出局 sacrificeBunt 從 admission 排除，不只是降低權重", !tacticalReassessment.candidates.includes("sacrificeBunt") && tacticalReassessment.entries.find(item=>item.action==="sacrificeBunt").status === "irrelevant" && tacticalReassessment.entries.find(item=>item.action==="sacrificeBunt").reasons.includes("twoOutSacrificeValueAbsent"));
verify("19. Surprise Bunt firewall：兩出局仍可 admissible", tacticalReassessment.candidates.includes("surpriseBunt") && tacticalReassessment.entries.find(item=>item.action==="surpriseBunt").status === "available");
verify("20. 新 tactical selection 不會沿用上一 PA 的 sacrificeBunt", tacticalReassessment.selected !== "sacrificeBunt");

console.log(`Offensive Tactical Action Sprint B1.0.1 tests: ${passed}/${passed} passed`);
