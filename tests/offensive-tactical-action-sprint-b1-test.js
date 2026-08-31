const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const CountRules = require("../offensive-bunt-count-rules.js");
const Bunt = require("../offensive-bunt-execution.js");
const Action = require("../offensive-tactical-action.js");
const PitchSequencing = require("../pitch-sequencing.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const capabilities = { batting: 10, reaction: 10, baseballIQ: 10, ballSense: 10 };
const fit = Bunt.createProvisionalBuntExecutionFit(capabilities);
const makePlan = (action = "sacrificeBunt", count = { balls: 0, strikes: 0 }, identity = `${action}-pa`) => Bunt.createPATacticalPlan({
  actionState: Action.createTacticalActionState({ identity, selectedAction: action }), count
});
const resolve = (overrides = {}) => {
  const plan = overrides.plan || makePlan(overrides.action, overrides.count, overrides.identity);
  return Bunt.resolveAndAdvanceBuntPitch({
    plan,
    actualPitch: overrides.actualPitch || { pitchLocationClass: "competitiveStrike", strike: true },
    recognition: overrides.recognition || { correct: true, perceivedPitchClass: overrides.actualPitch?.pitchLocationClass || "competitiveStrike" },
    capabilities: overrides.capabilities || capabilities,
    rolls: overrides.rolls || { attempt: 0, preparation: 0, contact: 0.99, fairBallType: 0.9, pace: 0.6, placement: 0.9 }
  });
};

verify("1. PA Tactical Plan 與 Current Pitch Tactical Commitment 是不同層級", (() => { const p = makePlan(); const c = Bunt.createCurrentPitchTacticalCommitment(p); return p.identity === c.planIdentity && p.pitchNumber === 0 && c.pitchNumber === 1 && !Object.hasOwn(p, "commitment"); })());
verify("2. sacrificeBunt 建立 early／active 的可持續 PA plan", (() => { const p = makePlan(); return p.revealTiming === "early" && p.status === "active" && !p.completed; })());
verify("3. surpriseBunt 建立 late reveal 的可持續 PA plan", makePlan("surpriseBunt").revealTiming === "late");
verify("4. standardAttack 不建立可執行短打 commitment", (() => { const p = makePlan("standardAttack"); return p.status === "notApplicable" && Bunt.createCurrentPitchTacticalCommitment(p) === null; })());
verify("5. provisional fit 僅含 batting／reaction／baseballIQ／ballSense", JSON.stringify(Object.keys(fit.components).sort()) === JSON.stringify(["ballSense", "baseballIQ", "batting", "reaction"].sort()));
verify("6. provisional fit 不接受 speed／power／arm 等額外能力改寫", JSON.stringify(fit) === JSON.stringify(Bunt.createProvisionalBuntExecutionFit({ ...capabilities, speed: 20, power: 20, arm: 20, range: 20, throwing: 20 })));
verify("7. Attempt／Preparation／Contact／Ball 使用四個互異 RNG namespace", new Set(Object.values(Bunt.RNG_NAMESPACES)).size === 4);

const heldBall = resolve({ actualPitch: { pitchLocationClass: "clearBall", strike: false }, recognition: { correct: true, perceivedPitchClass: "clearBall" }, rolls: { attempt: 0.99 } });
verify("8. 正確辨識 clearBall 時可收棒", heldBall.resolution.attemptDecision === "hold" && heldBall.resolution.preparationState === null && heldBall.resolution.contactResult === null);
verify("9. 收棒壞球由 Count 規則記為 ball，PA plan 繼續", heldBall.countResult.pitchResult === "ball" && heldBall.plan.count.balls === 1 && heldBall.plan.status === "active");
const heldStrike = resolve({ actualPitch: { pitchLocationClass: "edgeStrike", strike: true }, rolls: { attempt: 0.99 } });
verify("10. 收棒好球由 Count 規則記為 calledStrike", heldStrike.countResult.pitchResult === "calledStrike" && heldStrike.plan.count.strikes === 1);
const attemptedClearBall = resolve({ actualPitch: { pitchLocationClass: "clearBall", strike: false }, recognition: { correct: true, perceivedPitchClass: "clearBall" }, rolls: { attempt: 0, preparation: 0, contact: 0.99, fairBallType: 0.9, pace: 0, placement: 0 } });
verify("11. clearBall 即使辨識正確仍保留非零 attempt 可達性", attemptedClearBall.resolution.attemptDecision === "attempt");

const prepInput = { actualPitch: { pitchLocationClass: "competitiveStrike" }, recognition: { correct: true, perceivedPitchClass: "competitiveStrike" }, provisionalBuntFit: fit, revealTiming: "early" };
verify("12. preparation set 可由 deterministic roll 達成", Bunt.resolvePreparation({ ...prepInput, rolls: { preparation: 0 } }).preparationState === "set");
verify("13. preparation adjusted 可由 deterministic roll 達成", Bunt.resolvePreparation({ ...prepInput, rolls: { preparation: 0.4 } }).preparationState === "adjusted");
verify("14. preparation rushed 可由 deterministic roll 達成", Bunt.resolvePreparation({ ...prepInput, rolls: { preparation: 0.78 } }).preparationState === "rushed");
verify("15. preparation broken 可由 deterministic roll 達成", Bunt.resolvePreparation({ ...prepInput, rolls: { preparation: 0.99 } }).preparationState === "broken");
verify("16. early reveal 的 preparation stability 高於 late reveal", Bunt.resolvePreparation({ ...prepInput, revealTiming: "early", rolls: { preparation: 0.5 } }).stability > Bunt.resolvePreparation({ ...prepInput, revealTiming: "late", rolls: { preparation: 0.5 } }).stability);

const miss = resolve({ rolls: { attempt: 0, preparation: 0, contact: 0 } });
verify("17. contact miss 可達且只形成 swingingStrike", miss.resolution.contactResult === "miss" && miss.countResult.pitchResult === "swingingStrike" && miss.plan.status === "active");
const foul = resolve({ rolls: { attempt: 0, preparation: 0, contact: 0.15 } });
verify("18. foulContact 可達且非終結時 PA plan 持續", foul.resolution.contactResult === "foulContact" && foul.countResult.pitchResult === "foul" && foul.plan.status === "active");
const fair = resolve();
verify("19. fairContact 進入 ballInPlayPendingDefense 並結束此 PA plan", fair.resolution.contactResult === "fairContact" && fair.countResult.paResult === "ballInPlayPendingDefense" && fair.plan.completed && fair.plan.status === "completed");
verify("20. rushed preparation 仍可 fairContact", Bunt.resolveContact({ ...prepInput, preparationState: "rushed", rolls: { contact: 0.99 } }).contactResult === "fairContact");
verify("21. set preparation 仍可 miss", Bunt.resolveContact({ ...prepInput, preparationState: "set", rolls: { contact: 0 } }).contactResult === "miss");
verify("22. 辨識錯誤時仍保留 fairContact 可達性", Bunt.resolveContact({ ...prepInput, recognition: { correct: false, perceivedPitchClass: "edgeStrike" }, preparationState: "adjusted", rolls: { contact: 0.99 } }).contactResult === "fairContact");

verify("23. fairContact 可形成 popBunt", Bunt.realizeFairBuntBall({ contactResult: "fairContact", preparationState: "set", rolls: { fairBallType: 0 } }).fairBallType === "popBunt");
const groundCases = [
  [0.01, 0.01, "dead", "firstBaseSide"], [0.26, 0.26, "soft", "pitcherArea"],
  [0.51, 0.51, "controlled", "secondBaseSide"], [0.99, 0.99, "hard", "thirdBaseSide"]
];
groundCases.forEach(([pace, placement, expectedPace, expectedPlacement], index) => verify(`${24 + index}. groundBunt ${expectedPace}／${expectedPlacement} 可達`, (() => { const b = Bunt.realizeFairBuntBall({ contactResult: "fairContact", preparationState: "set", rolls: { fairBallType: 0.9, pace, placement } }); return b.fairBallType === "groundBunt" && b.pace === expectedPace && b.placement === expectedPlacement; })()));
verify("28. 非 fairContact 不會生成場內球形態", Bunt.realizeFairBuntBall({ contactResult: "foulContact" }) === null);
verify("29. canonical formatter 不曝露 raw identifier", !Bunt.formatBuntPhysicalTruth(fair.resolution).match(/groundBunt|controlled|thirdBaseSide|fairContact/));

const twoStrikeFoul = resolve({ count: { balls: 1, strikes: 2 }, rolls: { attempt: 0, preparation: 0, contact: 0.15 } });
verify("30. 兩好球短打界外由 Count／PA layer 判定 strikeout", twoStrikeFoul.countResult.paEnded && twoStrikeFoul.countResult.paResult === "strikeout" && twoStrikeFoul.countResult.endReason === "twoStrikeBuntFoul" && twoStrikeFoul.countResult.outcomeAuthority === "countAndPARules");
verify("31. Bunt physical resolution 本身不宣告 batter out／final outcome", twoStrikeFoul.resolution.batterOut === false && twoStrikeFoul.resolution.finalOutcome === null);
verify("32. strikeout 的 batter-out truth 由 Count／PA layer 正式持有", twoStrikeFoul.countResult.batterOut === true);
verify("33. fair ball 不自動移動跑者或產生防守 route", fair.resolution.runnerMovement === null && fair.resolution.runnerTargets === null && fair.resolution.defensiveRoutes === null);
verify("34. hold／miss／foul 的 plan identity 都跨 pitch 保留", [heldBall, miss, foul].every(result => result.plan.identity === result.resolution.paTacticalPlan.identity && result.plan.pitchNumber === 1));
verify("35. plan 終結後不再建立下一顆 pitch commitment", Bunt.createCurrentPitchTacticalCommitment(fair.plan) === null);
verify("36. explicit cancellation 與 PA result 分離", (() => { const p = Bunt.cancelPATacticalPlan(makePlan(), "fixtureStop"); return p.cancelled && p.status === "cancelled" && p.endReason === "fixtureStop" && !p.paResult; })());
verify("37. JSON save/reload 保留 active plan、count、history 與 current pitch state", (() => { const restored = Bunt.normalizePATacticalPlan(JSON.parse(JSON.stringify(foul.plan))); return JSON.stringify(restored) === JSON.stringify(foul.plan) && restored.count.strikes === 1 && restored.pitchHistory.length === 1; })());
verify("38. JSON save/reload 保留 completed fair-ball realization", (() => { const restored = Bunt.normalizePATacticalPlan(JSON.parse(JSON.stringify(fair.plan))); return restored.completed && restored.pitchHistory[0].buntResolution.placement === "thirdBaseSide"; })());

verify("39. 相同 context 與 identity 的完整解析完全 deterministic", JSON.stringify(resolve({ identity: "repeatable" })) === JSON.stringify(resolve({ identity: "repeatable" })));
verify("40. Bunt resolution 不呼叫 Math.random", (() => { const original = Math.random; let calls = 0; Math.random = () => { calls += 1; return 0.5; }; resolve({ identity: "no-global-rng", rolls: undefined }); Math.random = original; return calls === 0; })());
verify("41. Bunt 執行不污染既有 Pitch Sequencing deterministic output", (() => { const fixture = { paIdentity: "bunt-rng-firewall", pitchNumber: 1, balls: 0, strikes: 0, pitcherRuntime: { control: 8 } }; const before = PitchSequencing.createPitchDecision(fixture); resolve({ identity: "firewall" }); return JSON.stringify(before) === JSON.stringify(PitchSequencing.createPitchDecision(fixture)); })());
verify("42. early／late reveal 只透過 preparation 影響，不改 fair-ball realization mapping", (() => { const common = { contactResult: "fairContact", preparationState: "set", pitchCommitment: { pitchIdentity: "same-physical" }, rolls: { fairBallType: 0.9, pace: 0.51, placement: 0.51 } }; return JSON.stringify(Bunt.realizeFairBuntBall({ ...common, revealTiming: "early" })) === JSON.stringify(Bunt.realizeFairBuntBall({ ...common, revealTiming: "late" })); })());

const samples = Array.from({ length: 600 }, (_, index) => index / 600);
const prepStateFor = (timing, roll) => Bunt.resolvePreparation({ ...prepInput, revealTiming: timing, rolls: { preparation: roll } }).preparationState;
const stableRate = timing => samples.filter(roll => ["set", "adjusted"].includes(prepStateFor(timing, roll))).length / samples.length;
verify("43. deterministic semantic audit：early reveal 的穩定準備率高於 late reveal", stableRate("early") > stableRate("late"));
const fairRate = (candidateFit, correct) => samples.filter(roll => Bunt.resolveContact({ ...prepInput, provisionalBuntFit: candidateFit, recognition: { correct, perceivedPitchClass: "competitiveStrike" }, preparationState: "adjusted", rolls: { contact: roll } }).contactResult === "fairContact").length / samples.length;
const highFit = Bunt.createProvisionalBuntExecutionFit({ batting: 18, reaction: 18, baseballIQ: 18, ballSense: 18 });
const lowFit = Bunt.createProvisionalBuntExecutionFit({ batting: 3, reaction: 3, baseballIQ: 3, ballSense: 3 });
verify("44. deterministic semantic audit：正確辨識提高 fair-contact rate，但不保證成功", (() => { const good = fairRate(fit, true); const poor = fairRate(fit, false); return good > poor && good < 1 && poor > 0; })());
verify("45. deterministic semantic audit：較佳 provisional fit 提高 fair-contact rate", fairRate(highFit, true) > fairRate(lowFit, true));
verify("46. deterministic semantic audit：所有 preparation／contact／ball taxonomy 均可達", Bunt.PREPARATION_STATES.every(state => [0, 0.4, 0.78, 0.99].some(roll => prepStateFor("early", roll) === state)) && Bunt.CONTACT_RESULTS.every(result => [0, 0.15, 0.99].some(roll => Bunt.resolveContact({ ...prepInput, preparationState: "set", rolls: { contact: roll } }).contactResult === result)) && Bunt.GROUND_PACES.length === 4 && Bunt.PLACEMENTS.length === 4);
verify("46a. 0 strike + missed bunt 推進為 strike 1", resolve({ count: { balls: 0, strikes: 0 }, rolls: { attempt: 0, preparation: 0, contact: 0 } }).plan.count.strikes === 1);
verify("46b. 1 strike + missed bunt 推進為 strike 2 且 PA 繼續", (() => { const r = resolve({ count: { balls: 0, strikes: 1 }, rolls: { attempt: 0, preparation: 0, contact: 0 } }); return r.plan.count.strikes === 2 && !r.countResult.paEnded; })());
verify("46c. 2 strikes + missed bunt 由 Count／PA layer 判定 strikeout", (() => { const r = resolve({ count: { balls: 0, strikes: 2 }, rolls: { attempt: 0, preparation: 0, contact: 0 } }); return r.countResult.paResult === "strikeout" && r.countResult.endReason === "strikeThree"; })());
verify("46d. 1 strike + foulContact 推進為 strike 2 且 PA 繼續", (() => { const r = resolve({ count: { balls: 0, strikes: 1 }, rolls: { attempt: 0, preparation: 0, contact: 0.15 } }); return r.plan.count.strikes === 2 && !r.countResult.paEnded; })());
const hardSecond = resolve({ rolls: { attempt: 0, preparation: 0.4, contact: 0.99, fairBallType: 0.9, pace: 0.99, placement: 0.51 } });
verify("46e. 人工發現的 hard／secondBaseSide vertical fixture 為 canonical physical truth", hardSecond.resolution.fairBallType === "groundBunt" && hardSecond.resolution.pace === "hard" && hardSecond.resolution.placement === "secondBaseSide");
verify("46f. hard／secondBaseSide 不自動建立跑者移動、DP 或守備 route", hardSecond.resolution.runnerMovement === null && hardSecond.resolution.runnerTargets === null && hardSecond.resolution.defensiveRoutes === null && hardSecond.resolution.finalOutcome === null);
verify("46g. surprise late reveal 可呈現 preparation disadvantage 且仍能 fairContact", (() => { const r = resolve({ action: "surpriseBunt", rolls: { attempt: 0, preparation: 0.78, contact: 0.99, fairBallType: 0.9, pace: 0.26, placement: 0.26 } }); return ["rushed", "broken"].includes(r.resolution.preparationState) && r.resolution.contactResult === "fairContact"; })());
verify("46h. 相同 forced physical rolls 不因 sacrifice／surprise label 改寫球形", (() => { const rolls = { attempt: 0, preparation: 0.4, contact: 0.99, fairBallType: 0.9, pace: 0.51, placement: 0.51 }; const a = resolve({ action: "sacrificeBunt", rolls }).resolution; const b = resolve({ action: "surpriseBunt", rolls }).resolution; return a.contactResult === b.contactResult && a.fairBallType === b.fairBallType && a.pace === b.pace && a.placement === b.placement; })());

const root = path.resolve(__dirname, "..");
const runtimeFiles = [
  "player.js", "current-state-boundary.js", "time-boundary.js", "relationship-boundary.js", "evaluation-registry.js",
  "coach-evaluation-boundary.js", "narrative-condition-boundary.js", "evaluation-registry-bootstrap.js", "decision-flow.js",
  "day-completion-flow.js", "relationship-flow.js", "coach-response-flow.js", "narrative-condition-flow.js", "competition-presentation.js",
  "baseball-gameplay-prototype-utils.js", "baseball-defense-prototype.js", "baseball-offense-prototype.js", "pitcher-mental-state.js",
  "pitcher-process-state.js", "pitch-sequencing.js", "batter-anticipation.js", "offensive-plate-approach.js",
  "offensive-tactical-opportunity.js", "offensive-tactical-decision.js", "offensive-tactical-action.js", "offensive-bunt-count-rules.js",
  "offensive-bunt-execution.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js", "playing-time-game-exposure.js",
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
  function __b1Match(seed=77221) {
    stopHighSchoolMatchPlayback(); pendingYouthSeasonOutcome=null; isTransitioning=false;
    player=createInitialPlayer("Bunt Sprint B1"); applyDebugBookmarkCharacterProfile(player);
    settleHighSchoolEntryCapability(player,{originType:"test-fixture"}); applyCanonicalPositionProfile(player,"內野手",["外野手"]);
    player.chapter="青棒"; player.highSchoolStep=5; player.highSchoolRoleCode="starter"; player.highSchoolTeamRole="starter";
    pendingHighSchoolMatchSimulationSeed=seed;
    const match=prepareHighSchoolYearOneMatch();
    Object.assign(match,{inning:5,half:"上",offenseTeam:"away",defenseTeam:"home",outs:0,runners:["away-sim-2",null,null],scores:{home:1,away:1},simulationPhase:"moment_1_resolved",currentDomain:"defense",playerEntryCompleted:true,playerLineupStatus:"starter",position:"內野手",developmentPositionOverride:"二壘手"});
    match.battingOrderIndex.away=2; match.currentBatter=getHighSchoolMatchLineupBatter(match,"away").id; player.highSchoolMatch=match; return match;
  }
`, context);
const evaluate = expression => vm.runInContext(expression, context);
verify("47. production sacrifice fixture 建立 canonical Bunt PA plan", evaluate(`(() => {const m=__b1Match();prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"sacrificeBunt"});return m.offensiveBuntPAState?.status==="active"&&m.offensiveBuntPAState.identity===m.offensiveTacticalActionState.identity;})()`));
verify("48. production vertical fixture 可解析 controlled／third-base-side ground bunt", evaluate(`(() => {const m=__b1Match();prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"sacrificeBunt"});const r=resolveHighSchoolOffensiveBuntPitch(m,{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:0,contact:0.99,fairBallType:0.9,pace:0.6,placement:0.9}});return r.resolution.fairBallType==="groundBunt"&&r.resolution.pace==="controlled"&&r.resolution.placement==="thirdBaseSide"&&r.plan.completed;})()`));
verify("49. production debug trace 完整保留 reveal→pitch→recognition→attempt→preparation→contact→count", evaluate(`(() => {const t=getHighSchoolOffensiveBuntDebugTrace();return t.revealTiming==="early"&&t.actualPitch.pitchLocationClass&&typeof t.recognition.correct==="boolean"&&t.attemptDecision==="attempt"&&t.preparationState&&t.contactResult==="fairContact"&&t.countResult.pitchResult==="ballInPlay"&&t.paEnds===true;})()`));
verify("50. production save/reload 保留 completed Bunt realization 且不重抽", evaluate(`(() => {const before=JSON.stringify(player.highSchoolMatch.offensiveBuntPAState);const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;return before===JSON.stringify(restored.offensiveBuntPAState)&&restored.offensiveBuntPAState.pitchHistory[0].buntResolution.placement==="thirdBaseSide";})()`));
verify("51. production foul 後 save/reload 保留 count 並可接續下一球", evaluate(`(() => {const m=__b1Match(77222);prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"surpriseBunt"});resolveHighSchoolOffensiveBuntPitch(m,{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:0,contact:0.15}});player.highSchoolMatch=m;const restored=normalizeSave(JSON.parse(JSON.stringify(player))).highSchoolMatch;const second=resolveHighSchoolOffensiveBuntPitch(restored,{actualPitch:{pitchLocationClass:"clearBall",strike:false},recognition:{correct:true,perceivedPitchClass:"clearBall"},rolls:{attempt:0.99}});return restored.offensiveBuntPAState.count.balls===1&&restored.offensiveBuntPAState.count.strikes===1&&second.plan.pitchNumber===2;})()`));
verify("52. 新打者不繼承上一位打者的 Bunt PA plan", evaluate(`(() => {const m=__b1Match(77223);prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"sacrificeBunt"});const old=m.offensiveBuntPAState.identity;m.battingOrderIndex.away+=1;m.currentBatter=getHighSchoolMatchLineupBatter(m,"away").id;prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"sacrificeBunt"});return m.offensiveBuntPAState.identity!==old&&m.offensiveBuntPAState.pitchNumber===0;})()`));
verify("53. standardAttack production path 清空 Bunt plan 且不產生 Bunt execution", evaluate(`(() => {const m=__b1Match(77224);prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"standardAttack"});return m.offensiveBuntPAState===null&&resolveHighSchoolOffensiveBuntPitch(m)===null;})()`));
verify("54. production fair bunt 未提前改寫 runners／defensiveSituation／player truth", evaluate(`(() => {const m=__b1Match(77225);prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"sacrificeBunt"});const before={runners:JSON.stringify(m.runners),defense:JSON.stringify(m.defensiveSituation),player:JSON.stringify(player.playerCapabilities)};resolveHighSchoolOffensiveBuntPitch(m,{actualPitch:{pitchLocationClass:"competitiveStrike",strike:true},recognition:{correct:true,perceivedPitchClass:"competitiveStrike"},rolls:{attempt:0,preparation:0,contact:0.99,fairBallType:0.9,pace:0.6,placement:0.9}});return before.runners===JSON.stringify(m.runners)&&before.defense===JSON.stringify(m.defensiveSituation)&&before.player===JSON.stringify(player.playerCapabilities);})()`));
verify("55. production Bunt pitch 使用既有 actual-pitch recognition authority", evaluate(`(() => {const m=__b1Match(77226);prepareHighSchoolOffensiveTacticalAction(m,{tacticalActionOverride:"surpriseBunt"});const r=resolveHighSchoolOffensiveBuntPitch(m,{recognitionRoll:0,rolls:{attempt:0.99}});return r.resolution.actualPitch.pitchId.startsWith(m.offensiveBuntPAState.identity)&&r.resolution.recognition.authority==="existingActualPitchRecognition";})()`));

console.log(`Offensive Tactical Action Sprint B1 tests: ${passed}/${passed} passed`);
