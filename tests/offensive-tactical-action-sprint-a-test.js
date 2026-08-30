const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const Opportunity = require("../offensive-tactical-opportunity.js");
const Decision = require("../offensive-tactical-decision.js");
const Action = require("../offensive-tactical-action.js");
const PitchSequencing = require("../pitch-sequencing.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}
const status = (resolved, action) => resolved.entries.find(item => item.action === action);
const resolveOpportunity = (runners, outs = 0) => Opportunity.resolveTacticalOpportunity({ inning: 5, regulationInnings: 7, outs, runners, livePA: true, half: "上", offenseTeam: "away", defenseTeam: "home", scoreDifference: 0, batterId: "batter" });

const empty = resolveOpportunity([null, null, null], 0);
verify("1. 空壘 live PA 的 standardAttack 正式 available", status(empty, "standardAttack").status === "available" && empty.candidateActions.includes("standardAttack"));
verify("2. 空壘 surpriseBunt 仍是 production candidate", status(empty, "surpriseBunt").status === "available" && empty.candidateActions.includes("surpriseBunt"));
verify("3. 空壘 sacrificeBunt 不進候選池且保留原因", status(empty, "sacrificeBunt").status === "irrelevant" && status(empty, "sacrificeBunt").reasons.includes("noRunnerToAdvance"));

const firstZero = resolveOpportunity(["r1", null, null], 0);
verify("4. 一壘零出局三個 production action 都可候選", ["standardAttack", "sacrificeBunt", "surpriseBunt"].every(action => firstZero.candidateActions.includes(action)));
verify("5. sacrificeBunt 保留 runner advance 與出局數理由", status(firstZero, "sacrificeBunt").reasons.includes("runnerAdvanceAvailable") && status(firstZero, "sacrificeBunt").reasons.includes("fewerThanTwoOuts"));
const firstTwo = resolveOpportunity(["r1", null, null], 2);
verify("6. 一壘兩出局 sacrificeBunt 為 irrelevant", status(firstTwo, "sacrificeBunt").status === "irrelevant" && status(firstTwo, "sacrificeBunt").reasons.includes("twoOutSacrificeValueAbsent"));
verify("6a. 二壘零至一出局 sacrificeBunt 均可進候選", [0, 1].every(outs => resolveOpportunity([null, "r2", null], outs).candidateActions.includes("sacrificeBunt")));
verify("6b. 二壘兩出局 sacrificeBunt 為 irrelevant", status(resolveOpportunity([null, "r2", null], 2), "sacrificeBunt").status === "irrelevant");
verify("7. 兩出局不排除 surpriseBunt", firstTwo.candidateActions.includes("surpriseBunt"));

const thirdOne = resolveOpportunity([null, null, "r3"], 1);
verify("8. 三壘一出局辨識 squeeze topology 但維持 unsupported", status(thirdOne, "squeeze").status === "unsupported" && status(thirdOne, "squeeze").reasons.includes("runnerOnThirdAvailable"));
verify("9. 3B-only 不被誤收為 sacrificeBunt", status(thirdOne, "sacrificeBunt").status === "irrelevant" && status(thirdOne, "sacrificeBunt").reasons.includes("thirdBaseOnlyBelongsToSqueezeFamily"));
verify("10. 三壘兩出局 squeeze 為 irrelevant", status(resolveOpportunity([null, null, "r3"], 2), "squeeze").status === "irrelevant");
verify("11. 多跑者 hitAndRun 只標 unsupported/deferred、不宣稱 illegal", (() => { const item = status(resolveOpportunity(["r1", "r2", "r3"], 0), "hitAndRun"); return item.status === "unsupported" && item.constraints.includes("multiRunnerCoordinationDeferred") && !JSON.stringify(item).includes("illegal"); })());
verify("12. 所有 live PA 候選池都有 standard fallback", [[null, null, null], ["r1", null, null], [null, "r2", null], [null, null, "r3"]].every(runners => resolveOpportunity(runners, 1).candidateActions.includes("standardAttack")));

const baseDecisionInput = { opportunity: firstZero, identity: "same-pa", seed: "seed-1", tacticalProfile: Decision.DEFAULT_PROFILE, playerCapabilities: { batting: 8, baseRunning: 7, baseballIQ: 8, ballSense: 7 }, recentObservableEvidence: [] };
const repeatA = Decision.resolveTacticalDecision(baseDecisionInput);
const repeatB = Decision.resolveTacticalDecision(baseDecisionInput);
verify("13. 同 seed／context／profile 決策完全 deterministic", JSON.stringify(repeatA) === JSON.stringify(repeatB));
const preserveProfile = Decision.resolveTacticalDecision({ ...baseDecisionInput, tacticalProfile: { outPreservation: 1, pressureCreation: 0, variancePreference: 0, coordinationTrust: 0, informationExploitation: 0 } });
const pressureProfile = Decision.resolveTacticalDecision({ ...baseDecisionInput, tacticalProfile: { outPreservation: 0, pressureCreation: 1, variancePreference: 1, coordinationTrust: 1, informationExploitation: 1 } });
verify("14. 不同 coach lens 產生不同 subjective distribution", JSON.stringify(preserveProfile.distribution) !== JSON.stringify(pressureProfile.distribution));
verify("15. Player Fit 只影響 utility、不改 Opportunity legality", (() => { const weak = Decision.resolveTacticalDecision({ ...baseDecisionInput, playerCapabilities: {} }); return JSON.stringify(weak.debugTrace.opportunityEntries) === JSON.stringify(repeatA.debugTrace.opportunityEntries) && JSON.stringify(weak.distribution) !== JSON.stringify(repeatA.distribution); })());
verify("16. recent evidence 只接受 observable response contract", (() => { const d = Decision.resolveTacticalDecision({ ...baseDecisionInput, recentObservableEvidence: [{ type: "recentDefensiveChargeTiming", value: "late" }, { type: "previousBuntSucceeded", value: "yes" }, { type: "finalPAResult", value: "single" }] }); return d.debugTrace.recentObservableEvidence.length === 1 && d.debugTrace.recentObservableEvidence[0].type === "recentDefensiveChargeTiming"; })());
verify("17. future pitch／PA outcome 欄位不會進入決策", JSON.stringify(Decision.resolveTacticalDecision({ ...baseDecisionInput, futurePitch: "clearBall", finalPAResult: "homeRun" })) === JSON.stringify(repeatA));
verify("18. Decision 使用獨立 RNG namespace 且未呼叫 Math.random", (() => { const original = Math.random; let calls = 0; Math.random = () => { calls += 1; return 0.1; }; const d = Decision.resolveTacticalDecision(baseDecisionInput); Math.random = original; return calls === 0 && d.rngNamespace === "offensive-tactical-decision-v1"; })());
verify("19. standardAttack 能被正式抽出而不是 null fallback", (() => { for (let seed = 0; seed < 500; seed += 1) { if (Decision.resolveTacticalDecision({ ...baseDecisionInput, seed }).selectedAction === "standardAttack") return true; } return false; })());
verify("20. 合法不同 seed 能呈現分布式選擇而非 deterministic max", (() => { const chosen = new Set(); for (let seed = 0; seed < 200; seed += 1) chosen.add(Decision.resolveTacticalDecision({ ...baseDecisionInput, seed }).selectedAction); return chosen.size >= 2; })());

const sacrifice = Action.createTacticalActionState({ identity: "sac-pa", selectedAction: "sacrificeBunt" });
verify("21. sacrifice commitment 為 bunt／conditional advance／early", sacrifice.batterCommitment === "bunt" && sacrifice.runnerCommitment === "conditionalAdvance" && sacrifice.revealTiming === "early");
verify("22. sacrifice prePitch 立即產生 high-salience observable event", sacrifice.observableEvents[0]?.type === "buntReveal" && sacrifice.observableEvents[0]?.timing === "prePitch" && sacrifice.observableEvents[0]?.salience === "high");
verify("23. sacrifice player-facing cue 只描述可見動作", Action.formatObservableTacticalInformation(sacrifice.observableEvents)[0] === "打者提早擺出短打姿勢。");
const surprise = Action.createTacticalActionState({ identity: "surprise-pa", selectedAction: "surpriseBunt" });
verify("24. surprise hidden truth 存在但 pre-reveal 無 observable event", surprise.selectedTacticalAction === "surpriseBunt" && surprise.observableEvents.length === 0);
verify("25. presentation formatter 只收 observable events，不能由 hidden state 洩漏", Action.formatObservableTacticalInformation(surprise).length === 0 && !Action.formatObservableTacticalInformation([]).join("").includes("突襲"));
const revealed = Action.advanceTacticalReveal(surprise, "lateReveal");
verify("26. surprise 到 late reveal 才產生高顯著短打動作", revealed.observableEvents[0]?.type === "lateBuntReveal" && revealed.observableEvents[0]?.timing === "lateReveal" && Action.formatObservableTacticalInformation(revealed.observableEvents)[0] === "打者突然轉棒準備觸擊。");
verify("27. 重複 advance 不會重複發 event", Action.advanceTacticalReveal(revealed, "lateReveal").observableEvents.length === 1);
const standard = Action.createTacticalActionState({ identity: "standard-pa", selectedAction: "standardAttack" });
verify("28. standardAttack 是正式 assignment 且無特殊 cue", standard.selectedTacticalAction === "standardAttack" && standard.batterCommitment === "standard" && standard.observableEvents.length === 0 && standard.executionDeferred);

const pitchFixture = { paIdentity: "rng-firewall", pitchNumber: 1, balls: 1, strikes: 1, pitcherRuntime: { control: 8 } };
const pitchBefore = PitchSequencing.createPitchDecision(pitchFixture);
Decision.resolveTacticalDecision(baseDecisionInput);
const pitchAfter = PitchSequencing.createPitchDecision(pitchFixture);
verify("29. Tactical RNG 不改變既有 Pitch Sequencing deterministic output", JSON.stringify(pitchBefore) === JSON.stringify(pitchAfter));

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "baseball-gameplay-integration.js",
  "baseball-training-resolver.js", "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js", "career-development-runtime-resolver.js",
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
  function __tacticalMatch(seed=99101) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Tactical Sprint A"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const match=prepareHighSchoolYearOneMatch();
    Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:["away-sim-2",null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",momentIndex:0,currentMomentId:highSchoolYearOneMomentIds[0],currentDomain:"flow",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手",completedMoments:[{id:highSchoolYearOneMomentIds[0],domain:"offense",decision:"zone",tier:"mixed",outcome:"測試打席",consequence:"比賽繼續",inning:4,half:"下",outs:1,scores:{home:1,away:1},runners:[]}]});
    match.battingOrderIndex.away=2; match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id; player.highSchoolMatch=match; return match;
  }
`, context);
const evaluate = expression => vm.runInContext(expression, context);
verify("30. production defensive orchestration 建立 canonical tactical truth 與完整 transient debug trace", evaluate(`(() => {const m=__tacticalMatch();prepareHighSchoolDefensiveMomentFromSimulation(m,{tacticalActionOverride:"sacrificeBunt",tacticalRevealPhase:"prePitch",situationOverrides:{playerPosition:"二壘手",ballDirection:"rightSide",playerCapabilities:{fielding:8,reaction:8,range:8,arm:8,throwing:8,decision:8}}});const trace=getHighSchoolOffensiveTacticalDebugTrace();return m.offensiveTacticalActionState.selectedTacticalAction==="sacrificeBunt"&&m.opponentTacticalTruth.code==="sacrificeBunt"&&trace.executionDeferred===true&&trace.rngNamespace==="offensive-tactical-decision-v1"&&trace.opportunityEntries.length===5&&!Object.hasOwn(m,"offensiveTacticalDebugTrace");})()`));
verify("31. production player-facing cue 只由 emitted observable event 產生", evaluate(`(() => {const m=__tacticalMatch();m.currentDomain="defense";prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"surpriseBunt"});const before=getHighSchoolOpponentObservableCues(m).join(" ");advanceHighSchoolOffensiveTacticalReveal(m,"lateReveal");const after=getHighSchoolOpponentObservableCues(m).join(" ");return !before.includes("短打")&&!before.includes("觸擊")&&after.includes("突然轉棒準備觸擊")&&!after.includes("surpriseBunt");})()`));
verify("32. save/reload 保留 selected action、reveal phase 與 emitted event 且不重抽／重複", evaluate(`(() => {const m=__tacticalMatch();m.currentDomain="defense";prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"surpriseBunt"});advanceHighSchoolOffensiveTacticalReveal(m,"lateReveal");player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const before=JSON.stringify(restored.offensiveTacticalActionState);prepareHighSchoolOffensiveTacticalAction(restored);advanceHighSchoolOffensiveTacticalReveal(restored,"lateReveal");return restored.offensiveTacticalActionState.selectedTacticalAction==="surpriseBunt"&&restored.offensiveTacticalActionState.currentPhase==="lateReveal"&&restored.offensiveTacticalActionState.observableEvents.length===1&&before===JSON.stringify(restored.offensiveTacticalActionState);})()`));
verify("33. standard production fixture 不產生 tactical cue", evaluate(`(() => {const m=__tacticalMatch();m.currentDomain="defense";prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"standardAttack"});return m.opponentTacticalTruth.code==="standardAttack"&&!getHighSchoolOpponentObservableCues(m).join(" ").includes("短打")&&!getHighSchoolOpponentObservableCues(m).join(" ").includes("觸擊");})()`));
verify("34. 3B／1 out standardAttack target 不會推導跑者攻本壘或本壘 route", evaluate(`(() => {const m=__tacticalMatch();const r3=m.rosters.away.lineup[4].id;Object.assign(m,{outs:1,runners:[null,null,r3],currentDomain:"defense",defensiveSituation:{}});prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"standardAttack"});const s=buildInfieldMeaningfulMoment(m,player,{playerPosition:"二壘手",ballDirection:"rightSide",playerCapabilities:{fielding:8,reaction:8,range:8,arm:8,throwing:8,decision:8}});return m.opponentTacticalTruth.targetRunnerId===r3&&s.runnerContext[2].movementProgress==="holding"&&!s.legalChoices.some(c=>["preventRunHome","homeForceOut"].includes(c.routeId))&&!getHighSchoolOpponentObservableCues(m).join(" ").includes("短打");})()`));
verify("35. sacrificeBunt commitment／early evidence 不會推導一壘跑者實際前進或改變 routes", evaluate(`(() => {const standardMatch=__tacticalMatch(99102);standardMatch.currentDomain="defense";standardMatch.defensiveSituation={};prepareHighSchoolOffensiveTacticalAction(standardMatch,{tacticalActionOverride:"standardAttack"});const standardSituation=buildInfieldMeaningfulMoment(standardMatch,player,{playerPosition:"二壘手",ballDirection:"rightSide"});const buntMatch=__tacticalMatch(99102);buntMatch.currentDomain="defense";buntMatch.defensiveSituation={};prepareHighSchoolOffensiveTacticalAction(buntMatch,{tacticalActionOverride:"sacrificeBunt"});const buntSituation=buildInfieldMeaningfulMoment(buntMatch,player,{playerPosition:"二壘手",ballDirection:"rightSide"});const state=buntMatch.offensiveTacticalActionState;return state.batterCommitment==="bunt"&&state.runnerCommitment==="conditionalAdvance"&&state.observableEvents[0].type==="buntReveal"&&buntSituation.runnerContext[0].movementProgress==="holding"&&JSON.stringify(buntSituation.legalChoices.map(c=>c.routeId))===JSON.stringify(standardSituation.legalChoices.map(c=>c.routeId));})()`));
verify("36. surpriseBunt reveal 只改 observable evidence，不改跑者、壘包或 defensive routes", evaluate(`(() => {const m=__tacticalMatch(99103);m.currentDomain="defense";m.defensiveSituation={};prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"surpriseBunt"});const beforeSituation=buildInfieldMeaningfulMoment(m,player,{playerPosition:"二壘手",ballDirection:"rightSide"});const before={runners:m.runners.slice(),runnerContext:beforeSituation.runnerContext,routes:beforeSituation.legalChoices.map(c=>c.routeId),cues:getHighSchoolOpponentObservableCues(m)};advanceHighSchoolOffensiveTacticalReveal(m,"lateReveal");const afterSituation=buildInfieldMeaningfulMoment(m,player,{playerPosition:"二壘手",ballDirection:"rightSide",runnerMovementProgress:Object.fromEntries(beforeSituation.runnerContext.map((r,i)=>r?[i,r.movementProgress]:null).filter(Boolean)),runnerTargets:Object.fromEntries(beforeSituation.runnerContext.map((r,i)=>r?[i,r.targetBase]:null).filter(Boolean))});const after={runners:m.runners.slice(),runnerContext:afterSituation.runnerContext,routes:afterSituation.legalChoices.map(c=>c.routeId),cues:getHighSchoolOpponentObservableCues(m)};return before.cues.join(" ").includes("短打")===false&&after.cues.join(" ").includes("突然轉棒準備觸擊")&&JSON.stringify(before.runners)===JSON.stringify(after.runners)&&JSON.stringify(before.runnerContext)===JSON.stringify(after.runnerContext)&&JSON.stringify(before.routes)===JSON.stringify(after.routes);})()`));
verify("37. 明確 canonical physical movement override 仍可建立本壘 tag route", evaluate(`(() => {const m=__tacticalMatch(99104);const r3=m.rosters.away.lineup[4].id;Object.assign(m,{outs:1,runners:[null,null,r3],currentDomain:"defense",defensiveSituation:{}});prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"standardAttack"});const s=buildInfieldMeaningfulMoment(m,player,{playerPosition:"二壘手",ballDirection:"rightSide",runnerMovementProgress:{2:"advancing"},runnerTargets:{2:"home"},routeWindowOverrides:{homeOutWindow:"wide"}});return s.runnerContext[2].movementProgress==="advancing"&&s.legalChoices.some(c=>c.routeId==="preventRunHome");})()`));

console.log(`Offensive Tactical Action Sprint A tests: ${passed}/${passed} passed`);
