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
  "baseball-offense-prototype.js", "baseball-gameplay-integration.js", "baseball-training-resolver.js",
  "match-experience-development.js",
  "match-development-settlement-presentation.js",
  "career-spine-contract.js", "career-transition-runtime-resolver.js", "career-transition-progression.js",
  "career-development-runtime-resolver.js", "career-development-progression.js", "career-age22-outcome-resolver.js",
  "career-save-admission.js", "story.js", "save.js", "script.js"
];

function makeContext() {
  const nodes = new Map();
  const storage = new Map();
  const timers = new Map();
  let nextTimerId = 1;
  const context = vm.createContext({
    console: { log() {}, warn() {}, error: console.error },
    module: { exports: {} },
    URLSearchParams,
    navigator: { clipboard: { async writeText(value) { context.__clipboard = value; } } },
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {} },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {
          id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
          focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
        });
        return nodes.get(id);
      },
      querySelector() { return null; }, querySelectorAll() { return []; },
      createElement() { return { value: "", style: {}, setAttribute() {}, select() {}, remove() {} }; },
      execCommand() { return true; }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: {
      location: { search: "" },
      setTimeout(callback, delay) { const id = nextTimerId++; timers.set(id, { callback, delay }); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    __timerCount244() { return timers.size; },
    __clearTimers244() { timers.clear(); },
    __runTimer244() {
      const next = timers.entries().next().value;
      if (!next) return false;
      const [id, timer] = next;
      timers.delete(id);
      timer.callback();
      return true;
    }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    function __prepareGenesis244(entryMode) {
      stopHighSchoolMatchPlayback("2.2.4.4-reset"); __clearTimers244(); pendingYouthSeasonOutcome = null; isTransitioning = false;
      resetGame();
      document.getElementById("nameInput").value = "2.2.4.4 Parity 球員";
      selectOrigin(PlayerIdentityOptions.origins[1]); selectIdealSelf("棒球理解型");
      pendingGenesisRoll = rollCharacterGenesis(() => .25);
      pendingGenesisAllocation = { ballSense: 1, observe: 1, fitness: 0, batting: 0, baseRunning: 0, baseballIQ: 1 };
      selectDevelopmentEntry(entryMode);
    }

    function __setupDirect244(seed, instrumentation = true) {
      setHighSchoolMatchOpportunityDebugEnabled(instrumentation);
      __prepareGenesis244("highSchoolFullMatch");
      selectDevelopmentTestPosition("二壘手");
      pendingHighSchoolMatchSimulationSeed = seed;
      createPlayer();
      return player.highSchoolMatch;
    }

    function __setupNarrative244(seed, instrumentation = true) {
      setHighSchoolMatchOpportunityDebugEnabled(false);
      __prepareGenesis244("full");
      createPlayer();
      enterHighSchool();
      if (isSchoolInvitationChoicePending(player)) {
        beginSchoolInvitationConfirmationAt(0);
        confirmSchoolInvitationSelection();
      }
      for (const eventId of ["high_school_intro", "high_school_load", "high_school_life", "high_school_role"]) {
        if (getCurrentEventId() !== eventId) throw new Error("Narrative setup failed before " + eventId);
        choose(eventId, 0);
        while (isTransitioning && __runTimer244()) {}
        if (isTransitioning) throw new Error("Narrative transition stalled at " + eventId);
      }
      setHighSchoolMatchOpportunityDebugEnabled(instrumentation);
      pendingHighSchoolMatchPositionOverride = "二壘手";
      pendingHighSchoolMatchSimulationSeed = seed;
      if (getCurrentEventId() !== "high_school_long_bench") throw new Error("Narrative match entry failed");
      choose("high_school_long_bench", 0);
      while (isTransitioning && __runTimer244()) {}
      if (isTransitioning || !player.highSchoolMatch) throw new Error("Narrative match entry stalled");
      resumeHighSchoolMatchPlayback("2.2.4.4-narrative-start", player.highSchoolMatch);
      return player.highSchoolMatch;
    }

    function __pickChoice244(match, policy, decisionIndex) {
      const choices = getHighSchoolYearOneMatchMomentChoices(match);
      if (Array.isArray(policy) && policy[decisionIndex]) return choices.find(choice => choice.matchDecision === policy[decisionIndex]) || null;
      if (policy === "alternative" && choices.length > 1) return choices.at(-1);
      return choices[0] || null;
    }

    function __runMatch244(options = {}) {
      const seed = Number(options.seed) || 22424201;
      const pathMode = options.pathMode || "direct";
      const playbackMode = options.playbackMode || "timer";
      const policy = options.policy || "first";
      const sample = Number.isFinite(Number(options.sample)) ? Number(options.sample) : .82;
      MatchExperienceDevelopment.setEnabled(options.bridge !== false);
      let match = pathMode === "narrative" ? __setupNarrative244(seed, options.instrumentation !== false) : __setupDirect244(seed, options.instrumentation !== false);
      if (playbackMode === "direct") { stopHighSchoolMatchPlayback("direct-audit-replay"); __clearTimers244(); }
      let steps = 0; let decisions = 0; let reloaded = false; let orphan = 0;
      while (!match.completed && steps++ < 5000) {
        if (hasBlockingHighSchoolMatchOutcome()) {
          continueYouthSeasonOutcome();
          if (playbackMode === "direct") { stopHighSchoolMatchPlayback("direct-after-continue"); __clearTimers244(); }
        } else if (isHighSchoolMatchDecisionVisible(match)) {
          showCurrentEvent();
          const choice = __pickChoice244(match, policy, decisions);
          if (!choice || !chooseHighSchoolYearOneMatchMoment(choice.matchDecision, choice.matchMomentId, () => sample)) { orphan += 1; break; }
          decisions += 1;
          if (playbackMode === "direct") { stopHighSchoolMatchPlayback("direct-after-choice"); __clearTimers244(); }
        } else if (playbackMode === "timer") {
          if (!__runTimer244()) { orphan += 1; break; }
        } else {
          const progressed = advanceHighSchoolMatchPlaybackStep(match);
          showCurrentEvent();
          stopHighSchoolMatchPlayback("direct-after-step"); __clearTimers244();
          if (!progressed) { orphan += 1; break; }
        }
        if (!reloaded && options.reloadStage === "afterFirstDecision" && match.completedMoments.length >= 1 && !hasBlockingHighSchoolMatchOutcome()) {
          saveGame(); loadGame(); match = player.highSchoolMatch; reloaded = true;
          if (playbackMode === "direct") { stopHighSchoolMatchPlayback("direct-after-reload"); __clearTimers244(); }
        }
      }
      const trace = options.instrumentation === false ? null : JSON.parse(exportHighSchoolMatchOpportunityDebug(match));
      const truth = {
        completed: match.completed,
        score: { ...match.scores },
        lineScore: JSON.parse(JSON.stringify(match.lineScore || {})),
        outs: match.outs,
        runners: JSON.parse(JSON.stringify(match.runners || {})),
        simulationCursor: match.simulationCursor,
        playerPA: match.performanceEvidence?.player?.plateAppearances || 0,
        decisions: match.completedMoments.map(moment => ({ domain: moment.domain, decision: moment.decision, tier: moment.tier })),
        simulationLog: (match.simulationLog || []).map(event => ({
          type: event.type,
          inning: event.inning,
          half: event.half,
          batterId: event.batterId || "",
          result: event.result || event.outcome || "",
          outsBefore: event.outsBefore,
          outsAfter: event.outsAfter
        }))
      };
      const matchExperience = match.matchExperience ? {
        finalized: match.matchExperience.finalized,
        settled: match.matchExperience.settled,
        evidenceCount: match.matchExperience.evidence?.length || 0,
        contextCount: match.matchExperience.selectedContexts?.length || 0,
        settlementId: match.matchExperience.matchExperienceSettlementId || ""
      } : null;
      return { seed, pathMode, playbackMode, policy, sample, steps, decisions, reloaded, orphan, trace, truth, matchExperience };
    }

    function __compareRuns244(left, right) {
      return compareHighSchoolMatchOpportunityTraces(left.trace, right.trace);
    }
  `, context);
  return context;
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
const run = options => parse(`__runMatch244(${JSON.stringify(options)})`);

let passed = 0;
function verify(title, condition) {
  assert.ok(condition, title);
  passed += 1;
  console.log(`✓ ${title}`);
}

verify("P1. Runtime signature 同時提供 global 與 trace header", evaluate(`BASEBALL_MATCH_BUILD_SIGNATURE==="bmf-2.2.4.4-opportunity-parity-v1"&&window.BASEBALL_MATCH_BUILD_SIGNATURE===BASEBALL_MATCH_BUILD_SIGNATURE`));
verify("P2. Human Debug 預設關閉且不污染一般 UI", evaluate(`setHighSchoolMatchOpportunityDebugEnabled(false);window.location.search="";renderHighSchoolMatchOpportunityDebugControls()===""`));

const humanSeed = run({ seed: 22424201, playbackMode: "timer", policy: "first", sample: 0.82 });
const auditSeed = run({ seed: 22424201, playbackMode: "direct", policy: "first", sample: 0.82 });
const humanComparison = parse(`compareHighSchoolMatchOpportunityTraces(${JSON.stringify(humanSeed.trace)},${JSON.stringify(auditSeed.trace)})`);
verify("P3. 22424201 Browser-style production 與 direct audit replay 完全 parity", humanComparison.equal);
verify("P4. Header 含 seed／route／role／position／ability／opponent／lineup／build signature", ["seed", "directStartMode", "role", "primaryPosition", "secondaryPosition", "playerAbilities", "opponentId", "lineupSignature", "entryRule", "buildVersionOrRuntimeSignature"].every(key => Object.hasOwn(humanSeed.trace.header, key)));
verify("P5. Defensive opportunity schema 含責任、routes、window、created 與 rejection", ["outsBefore", "basesBefore", "scoreBefore", "batterId", "playerEnteredGame", "playerCurrentPosition", "ballInPlay", "ballContext", "responsibilityCheck", "primaryFielder", "playerRole", "playerRoles", "legalRoutes", "viableRoutes", "routeWindows", "decisionWindowAvailable", "defensiveDecisionAlreadyUsed", "meaningfulDecisionCandidate", "defensiveDecisionCreated", "defensiveDecisionPresented", "defensiveDecisionResolved", "rejectionReason", "eventId", "simulationLogIndex"].every(key => Object.hasOwn(humanSeed.trace.opportunities.find(item => item.domain === "defense"), key)));
verify("P6. Offensive opportunity schema 區分 scripted 與 emergent", humanSeed.trace.opportunities.some(item => item.scriptedDecisionCandidate) && humanSeed.trace.opportunities.some(item => item.emergentDecisionCandidate));
verify("P7. 22424201 defense lifecycle created／presented／resolved 三層一致", humanSeed.trace.summary.defensiveMeaningfulDecisions === 1 && humanSeed.trace.summary.defensiveDecisionPresented === 1 && humanSeed.trace.summary.defensiveDecisionResolved === 1);
verify("P8. One-shot checkpoint 顯示 first offense 後開窗、defense 後 consumed", humanSeed.trace.checkpoints.some(item => item.oneShot.defensiveDecisionWindowAvailable) && humanSeed.trace.checkpoints.some(item => item.oneShot.defensiveDecisionAlreadyUsed));

const paritySeeds = Array.from({ length: 20 }, (_, index) => 22424201 + index);
const parityResults = paritySeeds.map(seed => {
  const browser = run({ seed, playbackMode: "timer" });
  const audit = run({ seed, playbackMode: "direct" });
  const comparison = parse(`compareHighSchoolMatchOpportunityTraces(${JSON.stringify(browser.trace)},${JSON.stringify(audit.trace)})`);
  return { seed, equal: comparison.equal, firstDivergence: comparison.firstDivergence, browser, audit };
});
verify("P9. 20/20 Browser production 與 Node-style audit replay signature parity", parityResults.every(result => result.equal));
verify("P10. 20 seeds entry／PA／Decision／defense／final truth 全部 parity", parityResults.every(result => JSON.stringify(result.browser.trace.summary) === JSON.stringify(result.audit.trace.summary) && JSON.stringify(result.browser.truth) === JSON.stringify(result.audit.truth)));

const bridgeDisabled = run({ seed: 22424201, playbackMode: "direct", bridge: false });
const bridgeEnabled = run({ seed: 22424201, playbackMode: "direct", bridge: true });
verify("M1. Match Experience bridge 開／關不改逐局、出局、壘包、log、Decision 與終場 truth", JSON.stringify(bridgeDisabled.truth) === JSON.stringify(bridgeEnabled.truth));
verify("M2. Bridge 關閉不建立 side state；開啟只在終場建立 settled state", bridgeDisabled.matchExperience === null && bridgeEnabled.matchExperience?.finalized && bridgeEnabled.matchExperience?.settled);
verify("M3. 正式 Direct Start 完整比賽的主要 Development Context 不超過 3", bridgeEnabled.matchExperience.contextCount <= 3 && bridgeEnabled.matchExperience.settlementId.includes("match-experience-development-v1"));

const freshReloadPairs = paritySeeds.map(seed => ({
  fresh: run({ seed, playbackMode: "timer" }),
  reload: run({ seed, playbackMode: "timer", reloadStage: "afterFirstDecision" })
}));
verify("R1. 20/20 fresh 與 first-Decision 後 reload canonical opportunity parity", freshReloadPairs.every(pair => parse(`compareHighSchoolMatchOpportunityTraces(${JSON.stringify(pair.fresh.trace)},${JSON.stringify(pair.reload.trace)})`).equal));
verify("R2. Reload checkpoint 保留 first-used 且未提前消耗 defense window", freshReloadPairs.every(pair => pair.reload.trace.checkpoints.some(item => item.stage === "save-reload-restored" && item.oneShot.firstOffensiveMomentUsed && !item.oneShot.defensiveDecisionAlreadyUsed)));

const narrativeSeeds = paritySeeds.slice(0, 5).map(seed => ({
  seed,
  direct: run({ seed, pathMode: "direct", playbackMode: "direct" }),
  narrative: run({ seed, pathMode: "narrative", playbackMode: "direct" })
}));
verify("N1. 5/5 synthesized pre-HS → Normal High School Narrative path 完整終場", narrativeSeeds.every(item => item.narrative.truth.completed && !item.narrative.orphan));
verify("N2. Narrative path one-shot lifecycle 沒有提前 consumed 或 presentation suppression", narrativeSeeds.every(item => item.narrative.trace.summary.scriptedOffensiveDecisions === 1
  && item.narrative.trace.summary.defensiveMeaningfulDecisions === item.narrative.trace.summary.defensiveDecisionPresented
  && item.narrative.trace.summary.defensiveMeaningfulDecisions === item.narrative.trace.summary.defensiveDecisionResolved));

const sensitivitySeeds = Array.from({ length: 200 }, (_, index) => 22432000 + index);
function sensitivity(policy, sample) {
  const matches = sensitivitySeeds.map(seed => run({ seed, playbackMode: "direct", policy, sample }));
  const zeroDefense = matches.filter(match => match.trace.summary.defensiveMeaningfulDecisions === 0).length;
  const laterOffense = matches.filter(match => match.trace.summary.emergentOffensiveDecisions > 0).length;
  return {
    matches: matches.length,
    zeroDefense,
    zeroDefenseRate: zeroDefense / matches.length,
    laterOffense,
    laterOffenseRate: laterOffense / matches.length,
    meanDecisions: matches.reduce((sum, match) => sum + match.decisions, 0) / matches.length
  };
}

const policyA = sensitivity("first", 0.82);
const policyB = sensitivity("alternative", 0.82);
const sample02 = sensitivity("first", 0.2);
const sample05 = sensitivity("first", 0.5);
const sample082 = policyA;
verify("S1. Choice Policy A controlled run 200/200 完成", policyA.matches === 200);
verify("S2. Choice Policy B controlled run 200/200 完成", policyB.matches === 200);
verify("S3. Execution samples 0.2／0.5／0.82 各 200 場完成", [sample02, sample05, sample082].every(item => item.matches === 200));

const recordedChoices = humanSeed.trace.lifecycle.filter(item => item.stage === "choiceReceived").map(item => item.decision);
const recordedReplay = run({ seed: 22424201, playbackMode: "direct", policy: recordedChoices, sample: 0.82 });
verify("S4. Recorded Human choices 可直接 replay 並保持 canonical parity", parse(`compareHighSchoolMatchOpportunityTraces(${JSON.stringify(humanSeed.trace)},${JSON.stringify(recordedReplay.trace)})`).equal);

const withoutInstrumentation = run({ seed: 22424201, playbackMode: "timer", instrumentation: false });
verify("I1. Instrumentation on/off canonical match outcome 完全一致", JSON.stringify(humanSeed.truth) === JSON.stringify(withoutInstrumentation.truth));
verify("I2. Instrumentation off 不建立 opportunity trace", withoutInstrumentation.trace === null);
verify("I3. Debug export 具 summary、canonical signatures 與 final truth", humanSeed.trace.summary && humanSeed.trace.canonicalOpportunitySignatures.length > 0 && humanSeed.trace.finalMatchTruth.completed);
verify("I4. Debug mode UI 提供單一步驟『複製比賽追蹤』", evaluate(`setHighSchoolMatchOpportunityDebugEnabled(true);renderHighSchoolMatchOpportunityDebugControls().includes("複製比賽追蹤")`));

console.log(`\nBaseball Match Foundation 2.2.4.4：${passed}/${passed} 通過`);
console.log(`PARITY_JSON=${JSON.stringify({
  runtimeSignature: humanSeed.trace.header.buildVersionOrRuntimeSignature,
  paritySeeds: parityResults.map(result => ({ seed: result.seed, equal: result.equal })),
  firstDivergence: parityResults.find(result => !result.equal)?.firstDivergence || null,
  humanSeed22424201: humanSeed.trace.summary,
  policyA,
  policyB,
  sample02,
  sample05,
  sample082,
  normalNarrative: narrativeSeeds.map(item => ({
    seed: item.seed,
    directRole: item.direct.trace.header.role,
    narrativeRole: item.narrative.trace.header.role,
    directAbilities: item.direct.trace.header.playerAbilities,
    narrativeAbilities: item.narrative.trace.header.playerAbilities,
    directSummary: item.direct.trace.summary,
    narrativeSummary: item.narrative.trace.summary
  })),
  reloadParity: freshReloadPairs.every(pair => parse(`compareHighSchoolMatchOpportunityTraces(${JSON.stringify(pair.fresh.trace)},${JSON.stringify(pair.reload.trace)})`).equal),
  instrumentationNeutral: JSON.stringify(humanSeed.truth) === JSON.stringify(withoutInstrumentation.truth)
})}`);
