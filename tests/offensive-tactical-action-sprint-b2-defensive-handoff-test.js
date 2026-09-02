const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const Handoff = require("../offensive-bunt-defensive-handoff.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }
const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "force-advancement.js", "offensive-bunt-defensive-handoff.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "playing-time-game-exposure.js", "match-experience-development.js", "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
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
  function __b2Match(seed=88221) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("B2"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const m=prepareHighSchoolYearOneMatch();
    Object.assign(m,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:["away-sim-2",null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手"});
    m.battingOrderIndex.away=2; m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id; player.highSchoolMatch=m; return m;
  }
  function __b2Prepare(speed=2,action="sacrificeBunt",seed=88221) {
    const m=__b2Match(seed); const batter=getHighSchoolMatchSimulationEntity(m,m.currentBatter); batter.speed=speed;
    const opts={tacticalActionOverride:action,situationOverrides:{playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},buntPitchOptions:{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:0,contact:.99,fairBallType:.9,pace:.99,placement:.51}}};
    const pitchEvent=prepareHighSchoolDefensiveMomentFromSimulation(m,opts); m.presentedEventCursor=m.simulationLog.length;
    const defenseEvent=prepareHighSchoolDefensiveMomentFromSimulation(m,opts);
    return {m,pitchEvent,defenseEvent,choices:getHighSchoolDefensiveMomentChoices(m),text:getHighSchoolDefensiveSituationText(m)};
  }
`, context);
const evaluate = expression => vm.runInContext(expression, context);

const slow = evaluate(`__b2Prepare(2,"sacrificeBunt",88221)`);
verify("1. B1 physical truth 正式建立 B2 handoff", slow.m.buntBallInPlayState?.sourceAuthority === "offensiveBuntPAState.pitchHistory");
verify("2. production 不再重抽一般 ground-ball context", slow.m.ballContext.sourceFamily === "bunt" && slow.m.ballContext.physicalTruth.pace === "hard" && slow.m.ballContext.physicalTruth.placement === "secondBaseSide");
verify("3. secondBaseSide + 2B 建立 favored access 而非 route", slow.m.buntBallInPlayState.defensiveAccess.level === "favored" && !Object.hasOwn(slow.m.buntBallInPlayState.defensiveAccess, "route"));
verify("4. canonical runner projection 進入既有 runnerContext", slow.m.defensiveSituation.runnerContext[0].movementProgress === "advancing" && slow.m.defensiveSituation.runnerContext[0].targetBase === "second");
verify("5. batter-runner physical actor 與原跑者分離", slow.m.buntBallInPlayState.runnerPhysicalStates.some(state => state.originBase === "batter") && slow.m.buntBallInPlayState.runnerPhysicalStates.some(state => state.originBase === 1));
verify("6. 2B primary fielder 不同時 cover second", slow.m.defensiveSituation.responsibility.primaryFielder.actor === "player" && slow.m.defensiveSituation.responsibility.coverageAssignments.some(item => item.actor === "SS"));
verify("7. 短打第一層選項是第一出局目標", slow.choices.some(choice => choice.routeId === "secureFirstBaseOut" && choice.text.includes("打者")) && slow.choices.some(choice => choice.routeId === "initiate463" && choice.text === "傳二壘封殺前位跑者"));
verify("8. 短打決策前資訊明示球速、落點與兩名跑者", slow.text.includes("偏強的短打") && slow.text.includes("二壘手一側") && slow.text.includes("一壘跑者已啟動") && slow.text.includes("打者跑者"));
verify("9. lead force 與 batter first-base window 分離", slow.m.buntBallInPlayState.timingWindows.leadRunnerForceWindow && slow.m.buntBallInPlayState.timingWindows.batterRunnerFirstBaseWindow);
verify("10. slow batter relay window 為 open equivalent", slow.m.buntBallInPlayState.timingWindows.relayToFirstWindow.state === "normal");
const slowResolution = evaluate(`resolveHighSchoolDefensivePlay(player.highSchoolMatch,"challenge",()=>.99)`);
verify("11. initiate463 第一段與 continuation 分開記錄", slowResolution.firstLegState.status === "completed" && slowResolution.continuationState.status === "completed");
verify("12. slow fixture 只在完整兩段成功後形成 DP", slowResolution.outsCreated === 2 && slowResolution.resultCode === "twoOuts");

const fast = evaluate(`__b2Prepare(9,"sacrificeBunt",88222)`);
const fastResolution = evaluate(`resolveHighSchoolDefensivePlay(player.highSchoolMatch,"challenge",()=>.99)`);
verify("13. 同球 fast batter 關閉 relay window", fast.m.buntBallInPlayState.timingWindows.relayToFirstWindow.state === "expired");
verify("14. fast batter 第一封殺可成功但不會魔法雙殺", fastResolution.firstLegState.status === "completed" && fastResolution.outsCreated === 1 && fastResolution.continuationState.status === "windowClosed");
verify("15. fast batter 失去第二出局歸因既有 timingWindow", fastResolution.primaryCause === "timingWindow" && fastResolution.responsibleActor === "timingWindow");

const tacticalA = Handoff.createHandoff({ identity: "same", physicalTruth: { contactResult: "fairContact", fairBallType: "groundBunt", pace: "hard", placement: "secondBaseSide", preparationState: "set" }, existingRunners: [{ runnerId: "r1", originBase: 1, speed: 4, reaction: 6 }], batterRunner: { runnerId: "b", speed: 5 }, forceState: { forceAtSecond: true }, priorRunnerCommitment: "conditionalAdvance", defenderContext: { playerPosition: "二壘手" }, selectedTacticalAction: "sacrificeBunt", targetRunnerId: "r1" });
const tacticalB = Handoff.createHandoff({ identity: "same", physicalTruth: { contactResult: "fairContact", fairBallType: "groundBunt", pace: "hard", placement: "secondBaseSide", preparationState: "set" }, existingRunners: [{ runnerId: "r1", originBase: 1, speed: 4, reaction: 6 }], batterRunner: { runnerId: "b", speed: 5 }, forceState: { forceAtSecond: true }, priorRunnerCommitment: "conditionalAdvance", defenderContext: { playerPosition: "二壘手" }, selectedTacticalAction: "surpriseBunt", targetRunnerId: "other" });
verify("16. Tactical firewall：相同 physical inputs 產生相同 defense", JSON.stringify(tacticalA) === JSON.stringify(tacticalB));
const unsupported = Handoff.createHandoff({ identity: "third", physicalTruth: { contactResult: "fairContact", fairBallType: "groundBunt", pace: "controlled", placement: "thirdBaseSide", preparationState: "set" }, existingRunners: [{ runnerId: "r1", originBase: 1, speed: 5, reaction: 6 }], batterRunner: { runnerId: "b", speed: 5 }, forceState: { forceAtSecond: true }, priorRunnerCommitment: "conditionalAdvance", defenderContext: { playerPosition: "二壘手" } });
verify("17. thirdBaseSide physical truth 保留但不強塞 2B", unsupported.ballContext.physicalTruth.placement === "thirdBaseSide" && !unsupported.supported && unsupported.ballContext.downstreamSupport === "unsupportedPlacementFallback");
const pop = Handoff.createHandoff({ identity: "pop", physicalTruth: { contactResult: "fairContact", fairBallType: "popBunt", preparationState: "broken" }, existingRunners: [{ runnerId: "r1", originBase: 1, speed: 5, reaction: 6 }], batterRunner: { runnerId: "b", speed: 5 }, forceState: { forceAtSecond: true }, priorRunnerCommitment: "conditionalAdvance", defenderContext: { playerPosition: "二壘手" } });
verify("18. pop bunt 明確 unsupported 且無自動 out", !pop.supported && pop.runnerReassessment.existingRunners[0].movementState === "retreating" && !Object.hasOwn(pop, "outsCreated"));
verify("19. Save/reload 保留 handoff、windows 與 pending legs", evaluate(`(() => {const x=__b2Prepare(2,"sacrificeBunt",88223);player.highSchoolMatch=x.m;const before=JSON.stringify(x.m.buntBallInPlayState);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return before===JSON.stringify(restored.buntBallInPlayState)&&restored.buntBallInPlayState.firstLegState.status==="pending";})()`));
verify("20. Decision view 不混入久遠的前一個結果", evaluate(`(() => {const x=__b2Prepare(2,"sacrificeBunt",88224);x.m.previousMomentOutcome="數局以前的結果";return !getHighSchoolYearOneMatchPresentation().includes("前一個結果");})()`));

const ordinary = evaluate(`(() => {const m=__b2Match(88225);m.offensiveTacticalActionState=null;m.offensiveBuntPAState=null;setHighSchoolDefensiveBallContext(m,"normalGrounder");buildInfieldMeaningfulMoment(m,player,{playerPosition:"二壘手",primaryFielderPosition:"二壘手",ballDirection:"straightAtPlayer"});return {source:m.ballContext.sourceFamily||"",routes:getHighSchoolDefensiveMomentChoices(m).map(c=>c.routeId),text:getHighSchoolDefensiveSituationText(m)};})()`);
verify("21. ordinary ground ball 不依賴 Bunt adapter", ordinary.source === "" && ordinary.routes.includes("secureFirstBaseOut") && ordinary.routes.includes("initiate463") && !ordinary.text.includes("這是短打形成的守備"));
verify("22. Bunt 與普通滾地球 pre-decision information 明顯不同", slow.text !== ordinary.text && slow.text.includes("短打") && !ordinary.text.includes("短打"));
verify("23. B2 state 不建立 buntRunnerState／buntDefensiveRoute", !Object.hasOwn(slow.m, "buntRunnerState") && !Object.hasOwn(slow.m, "buntDefensiveRoute"));
verify("24. 已解析 first leg／continuation 經 apply 與 save-reload 不重算", evaluate(`(() => {const x=__b2Prepare(2,"sacrificeBunt",88226);const r=resolveHighSchoolDefensivePlay(x.m,"challenge",()=>.99);applyInfieldResolutionToHighSchoolMatch(x.m,"challenge",r);player.highSchoolMatch=x.m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return restored.buntBallInPlayState.firstLegState.status==="completed"&&restored.buntBallInPlayState.continuationState.status==="completed"&&restored.lastDefensiveResolution.outsCreated===2;})()`));
verify("25. tight lead／wide first 的積極判斷不因失敗 outcome 改寫", evaluate(`(() => {const x=__b2Prepare(2,"sacrificeBunt",88227),s=x.m.defensiveSituation;s.buntDefensiveContext.timingWindows.leadRunnerForceWindow.state="narrow";s.buntDefensiveContext.timingWindows.batterRunnerFirstBaseWindow.state="wide";s.routeWindowOverrides={firstBaseOutWindow:"wide",doublePlayWindow:"narrow"};s.routeWindows=deriveSecondBaseExecutionWindows(s,s.routeWindowOverrides);const c=generateInfieldLegalChoices(s,x.m).find(c=>c.routeId==="initiate463");s.legalChoices=generateInfieldLegalChoices(s,x.m);const r=resolveHighSchoolDefensivePlay(x.m,"challenge",()=>0);return c.advisable==="aggressive"&&r.decisionQuality==="aggressive"&&r.outsCreated===0&&r.runnersAfter[0]===s.batterId&&r.runnersAfter[1]===s.runners[0];})()`));
verify("26. Bunt 1B+2B successful 4-6-3 共用 Force Foundation 並留下 original2B 於 3B", evaluate(`(() => {const m=__b2Match(88228);m.runners=["away-sim-2","away-sim-6",null];const batter=getHighSchoolMatchSimulationEntity(m,m.currentBatter);batter.speed=2;const opts={tacticalActionOverride:"sacrificeBunt",situationOverrides:{playerCapabilities:{fielding:10,reaction:10,range:10,arm:10,throwing:10,decision:10}},buntPitchOptions:{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:0,contact:.99,fairBallType:.9,pace:.99,placement:.51}}};prepareHighSchoolDefensiveMomentFromSimulation(m,opts);m.presentedEventCursor=m.simulationLog.length;prepareHighSchoolDefensiveMomentFromSimulation(m,opts);const r=resolveHighSchoolDefensivePlay(m,"challenge",()=>.99);applyInfieldResolutionToHighSchoolMatch(m,"challenge",r);return m.buntBallInPlayState.forceChain.version==="force-advancement-foundation-v1"&&m.outs===2&&m.runners[0]===null&&m.runners[1]===null&&m.runners[2]==="away-sim-6";})()`));

console.log(`Offensive Tactical Action Sprint B2 Defensive Handoff tests: ${passed}/${passed} passed`);
