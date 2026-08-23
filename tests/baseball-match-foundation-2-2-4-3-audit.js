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
    document: {
      body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
      getElementById(id) {
        if (!nodes.has(id)) nodes.set(id, {
          id, innerHTML: "", textContent: "", value: "", style: {}, dataset: {}, disabled: false,
          classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
          focus() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll() { return []; }
        });
        return nodes.get(id);
      },
      querySelector() { return null; }, querySelectorAll() { return []; }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, value); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); }
    },
    window: {
      setTimeout(callback, delay) { const id = nextTimerId++; timers.set(id, { callback, delay }); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    __timerCount() { return timers.size; },
    __clearTimers() { timers.clear(); },
    __runNextTimer() {
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
    let __activeOpportunityAudit = null;
    const __originalShouldReachHighSchoolDefensiveMoment243 = shouldReachHighSchoolDefensiveMoment;
    const __originalClassifyPositionFamilyPlay243 = classifyPositionFamilyPlay;

    function __auditStateKey243(match) {
      return [match.inning, match.half, match.outs, match.battingOrderIndex?.away,
        match.simulationLog?.length, match.simulationPhase].join("|");
    }

    function __increment243(target, key, amount = 1) {
      target[key] = (target[key] || 0) + amount;
    }

    function __classifyRejection243(situation, routeAvailability, gate) {
      const role = situation?.responsibility?.playerRole || "";
      const legalCount = routeAvailability.filter(route => route.legal).length;
      const viableCount = routeAvailability.filter(route => route.viable).length;
      if (legalCount <= 1) return "only-one-legal-route";
      if (viableCount <= 1) return "only-one-viable-route";
      if ((gate?.meaningfulChoiceCount || 0) < 2) {
        return role === "coverPivot" || role === "cover" ? "routine-coverage" : "execution-only";
      }
      if ((gate?.commitments || []).length < 2) return "duplicate-commitment";
      if ((gate?.tradeoffs || []).length < 2) return "no-real-tradeoff";
      if (routeAvailability.some(route => route.legal && !route.viable)) return "window-expired";
      if (role && !["primaryFielder", "initiator"].includes(role)) return "player-not-primary-role";
      return "no-real-tradeoff";
    }

    shouldReachHighSchoolDefensiveMoment = function(match) {
      const result = __originalShouldReachHighSchoolDefensiveMoment243(match);
      const audit = __activeOpportunityAudit;
      if (!audit || audit.match !== match) return result;
      const key = __auditStateKey243(match);
      if (audit.seenDefensiveChecks.has(key)) return result;
      audit.seenDefensiveChecks.add(key);
      audit.defensiveChecks += 1;
      if (result) audit.relevantResponsibility += 1;
      else __increment243(audit.rejections, "no-player-responsibility");
      return result;
    };

    classifyPositionFamilyPlay = function(situation, legalChoices = [], playerInvolved = true) {
      const result = __originalClassifyPositionFamilyPlay243(situation, legalChoices, playerInvolved);
      const audit = __activeOpportunityAudit;
      if (!audit || !audit.match) return result;
      const key = [__auditStateKey243(audit.match), situation?.ballContext?.type,
        situation?.primaryFielderPosition, situation?.responsibility?.playerRole].join("|");
      if (audit.seenClassifications.has(key)) return result;
      audit.seenClassifications.add(key);
      const routeAvailability = Object.values(SECOND_BASE_ROUTE_DEFINITIONS).map(route => ({
        id: route.id,
        ...evaluateDefensiveRouteAvailability(situation, route)
      }));
      audit.playerInvolvements += playerInvolved ? 1 : 0;
      if (routeAvailability.some(route => route.viable)) audit.viableRouteSituations += 1;
      routeAvailability.filter(route => route.viable).forEach(route => __increment243(audit.routesAvailable, route.id));
      const gate = result.gate || evaluatePositionDecisionMoment(situation, legalChoices);
      if ((gate.commitments || []).length >= 2) audit.multiCommitmentSituations += 1;
      if (result.eventClassification === "playerMeaningfulDecision") audit.meaningfulDecisions += 1;
      else __increment243(audit.rejections, __classifyRejection243(situation, routeAvailability, gate));
      const role = situation?.responsibility?.playerRole || "";
      if (["coverPivot", "cover"].includes(role)) audit.coverageInvolvements += 1;
      if (["primaryFielder", "initiator"].includes(role)) audit.primaryFieldingInvolvements += 1;
      audit.classifications.push({
        inning: audit.match.inning, half: audit.match.half, outs: audit.match.outs,
        role, classification: result.eventClassification,
        legalChoiceCount: gate.legalChoiceCount || 0,
        meaningfulChoiceCount: gate.meaningfulChoiceCount || 0,
        commitments: (gate.commitments || []).length,
        viableRoutes: routeAvailability.filter(route => route.viable).map(route => route.id)
      });
      return result;
    };

    function __makeOpportunityAudit243(match) {
      return {
        match, defensiveChecks: 0, relevantResponsibility: 0, playerInvolvements: 0,
        viableRouteSituations: 0, multiCommitmentSituations: 0, meaningfulDecisions: 0,
        coverageInvolvements: 0, primaryFieldingInvolvements: 0,
        routesAvailable: {}, rejections: {}, classifications: [],
        seenDefensiveChecks: new Set(), seenClassifications: new Set()
      };
    }

    function __setupOpportunityAudit243(seed, role = "bench", instrumentation = true) {
      stopHighSchoolMatchPlayback("2.2.4.3-reset");
      __clearTimers(); pendingYouthSeasonOutcome = null; isTransitioning = false; __activeOpportunityAudit = null;
      setHighSchoolMatchOpportunityDebugEnabled(instrumentation);
      player = createInitialPlayer();
      document.getElementById("nameInput").value = "2.2.4.3 Opportunity Audit 球員";
      selectOrigin(PlayerIdentityOptions.origins[1]); selectIdealSelf("棒球理解型");
      pendingGenesisRoll = rollCharacterGenesis(() => .25);
      pendingGenesisAllocation = { ballSense: 1, observe: 1, fitness: 0, batting: 0, baseRunning: 0, baseballIQ: 1 };
      selectDevelopmentEntry("highSchoolFullMatch"); selectDevelopmentTestPosition("二壘手");
      pendingHighSchoolMatchSimulationSeed = seed;
      createPlayer();
      if (role === "starter") {
        stopHighSchoolMatchPlayback("2.2.4.3-starter-compare"); __clearTimers(); pendingYouthSeasonOutcome = null;
        player.highSchoolMatch = null;
        player.highSchoolRoleCode = "starter"; player.highSchoolTeamRole = "starter";
        pendingHighSchoolMatchPositionOverride = "二壘手";
        pendingHighSchoolMatchSimulationSeed = seed;
        prepareHighSchoolYearOneMatch();
        resumeHighSchoolMatchPlayback("2.2.4.3-starter-start", player.highSchoolMatch);
      }
      const match = player.highSchoolMatch;
      __activeOpportunityAudit = instrumentation ? __makeOpportunityAudit243(match) : null;
      return match;
    }

    function __chooseOpportunityDecision243(sample = .82, policy = "first", decisionIndex = 0) {
      const choices = getHighSchoolYearOneMatchMomentChoices(player.highSchoolMatch);
      const recordedDecision = Array.isArray(policy) ? policy[decisionIndex] : "";
      const choice = recordedDecision ? choices.find(item => item.matchDecision === recordedDecision)
        : policy === "alternative" && choices.length > 1 ? choices.at(-1) : choices[0];
      return Boolean(choice) && chooseHighSchoolYearOneMatchMoment(choice.matchDecision, choice.matchMomentId, () => sample);
    }

    function __normalizeRoute243(event) {
      const raw = event.routeId || event.initialRoute || event.activeRoute || event.executionRoute || event.route || "";
      if (SECOND_BASE_ROUTE_DEFINITIONS[raw]) return raw;
      if (["secureFirst", "throwFirst", "4-3"].includes(raw)) return "secureFirstBaseOut";
      if (["forceThird", "throwThird", "4-5"].includes(raw)) return "attackLeadRunnerThird";
      if (["tagHome", "throwHomeForTag", "4-2-tag"].includes(raw)) return "preventRunHome";
      if (["forceHome", "throwHomeForForce", "4-2-force"].includes(raw)) return "homeForceOut";
      if (["doublePlay", "secondThenFirst", "4-6-3", "6-4-3"].includes(raw)) {
        return event.playerRole === "coverPivot" ? "coverSecondFor643" : "initiate463";
      }
      return raw;
    }

    function __runOpportunityMatch243(seed, role = "bench", instrumentation = true, choicePolicy = "first", executionSample = .82) {
      const match = __setupOpportunityAudit243(seed, role, instrumentation);
      let steps = 0; let orphan = 0; let noProgress = 0; let decisionIndex = 0;
      while (!match.completed && steps++ < 5000) {
        const before = [match.simulationLog.length, match.presentedEventCursor, match.inning, match.half,
          match.outs, match.scores.home, match.scores.away, match.simulationPhase, Boolean(pendingYouthSeasonOutcome)].join("|");
        if (hasBlockingHighSchoolMatchOutcome()) continueYouthSeasonOutcome();
        else if (isHighSchoolMatchDecisionVisible(match)) {
          if (!__chooseOpportunityDecision243(executionSample, choicePolicy, decisionIndex++)) { orphan += 1; break; }
        } else if (!__runNextTimer()) { orphan += 1; break; }
        const after = [match.simulationLog.length, match.presentedEventCursor, match.inning, match.half,
          match.outs, match.scores.home, match.scores.away, match.simulationPhase, Boolean(pendingYouthSeasonOutcome)].join("|");
        if (before === after) noProgress += 1;
      }
      const audit = __activeOpportunityAudit || __makeOpportunityAudit243(match);
      const log = match.simulationLog || [];
      const entry = log.find(event => event.type === "playerEntry") || null;
      const entrySequence = entry?.sequence ?? -1;
      const plateAppearances = log.filter(event => event.type === "plateAppearance");
      const playerPlateAppearances = plateAppearances.filter(event => event.batterId === "player");
      const offensiveMoments = log.filter(event => event.type === "meaningfulMomentReached" && event.domain === "offense");
      const scriptedOffense = offensiveMoments.filter(event => event.momentId === highSchoolYearOneMomentIds[0]);
      const emergentOffense = offensiveMoments.filter(event => event.momentId === highSchoolYearOneMomentIds[2]);
      const defensiveMoments = log.filter(event => event.type === "meaningfulMomentReached" && event.domain === "defense");
      const routineEvents = log.filter(event => event.type === "playerRoutinePlay");
      const defensiveResolutionEvents = log.filter(event => event.type === "defensiveResolution");
      const defensiveEvents = [...routineEvents, ...defensiveResolutionEvents];
      const routesExecuted = {};
      defensiveEvents.forEach(event => {
        const route = __normalizeRoute243(event);
        if (route) __increment243(routesExecuted, route);
      });
      const activeDefensivePAs = plateAppearances.filter(event => event.offenseTeam === "away"
        && (role === "starter" || event.sequence > entrySequence));
      const defensiveHalves = new Set(activeDefensivePAs.map(event => event.inning + event.half));
      const totalDefensiveHalves = new Set(plateAppearances.filter(event => event.offenseTeam === "away").map(event => event.inning + event.half));
      const preEntryPAs = role === "starter" ? 0 : plateAppearances.filter(event => event.sequence < entrySequence).length;
      const immediateFirstBatter = role === "starter" ? false : Boolean(entry
        && playerPlateAppearances.some(event => event.inning === entry.inning && event.half === entry.half)
        && entry.lineupSlot === (entry.presentationSnapshot?.battingOrderSlot ?? entry.lineupSlot));
      const entryBases = entry ? entry.runners.map(Boolean) : [false, false, false];
      const attentionBeats = routineEvents.length + defensiveMoments.length;
      const result = {
        seed, role, choicePolicy, executionSample, completed: match.completed, steps, orphan, noProgress,
        integrityIssues: getHighSchoolMatchStateIntegrityIssues(match), finalScore: { ...match.scores },
        entry: role === "starter" ? { inning: 1, half: "上", outs: 0, runners: [null, null, null],
          scoreDifferential: 0, lineupSlot: match.playerLineupSlot, immediateFirstBatter: false, eventType: "starter-lineup" }
          : entry ? { inning: entry.inning, half: entry.half, outs: entry.outs, runners: entry.runners.slice(),
            scoreDifferential: entry.scores.home - entry.scores.away, lineupSlot: entry.lineupSlot,
            immediateFirstBatter, eventType: entry.type } : null,
        entryBaseKey: entryBases.every(Boolean) ? "loaded" : entryBases[0] && entryBases[1] ? "1B+2B"
          : entryBases[0] && entryBases[2] ? "1B+3B" : entryBases[1] && entryBases[2] ? "2B+3B"
            : entryBases[0] ? "1B" : entryBases[1] ? "2B" : entryBases[2] ? "3B" : "empty",
        totalPA: plateAppearances.length, preEntryPA: preEntryPAs,
        playerPA: playerPlateAppearances.length,
        offensiveRoutine: playerPlateAppearances.filter(event => !event.meaningful).length,
        scriptedOffensiveDecision: scriptedOffense.length,
        emergentOffensiveDecision: emergentOffense.length,
        offensiveDecisionTiming: [...scriptedOffense.map(event => ({ type: "scripted", inning: event.inning, half: event.half,
          paNumber: playerPlateAppearances.filter(pa => pa.sequence < event.sequence).length + 1 })),
          ...emergentOffense.map(event => ({ type: "emergent", inning: event.inning, half: event.half,
            paNumber: playerPlateAppearances.filter(pa => pa.sequence < event.sequence).length + 1 }))],
        defensivePA: activeDefensivePAs.length,
        defensiveBallsInPlay: activeDefensivePAs.filter(event => !["walk", "strikeout"].includes(event.result)).length,
        defensiveInnings: defensiveHalves.size,
        defensiveHalfShare: totalDefensiveHalves.size ? defensiveHalves.size / totalDefensiveHalves.size : 0,
        defensiveRoutine: routineEvents.length,
        defensiveAttention: attentionBeats,
        defensiveDecision: defensiveMoments.length,
        defensiveDecisionTiming: defensiveMoments.map(event => ({ inning: event.inning, half: event.half })),
        defensiveCoverage: audit.coverageInvolvements,
        defensivePrimaryFielding: audit.primaryFieldingInvolvements,
        defensiveChecks: audit.defensiveChecks,
        relevantResponsibility: audit.relevantResponsibility,
        playerInvolvements: audit.playerInvolvements,
        viableRouteSituations: audit.viableRouteSituations,
        multiCommitmentSituations: audit.multiCommitmentSituations,
        meaningfulDefensiveOpportunities: audit.meaningfulDecisions,
        routesAvailable: { ...audit.routesAvailable }, routesExecuted,
        rejections: { ...audit.rejections }, classifications: audit.classifications,
        totalDecisions: scriptedOffense.length + emergentOffense.length + defensiveMoments.length
      };
      result.canonicalSignature = JSON.stringify({
        entry: result.entry, playerPA: result.playerPA,
        scripted: result.scriptedOffensiveDecision, emergent: result.emergentOffensiveDecision,
        defense: result.defensiveDecision, routes: result.routesExecuted,
        score: result.finalScore, completed: result.completed
      });
      result.opportunityTrace = instrumentation ? JSON.parse(exportHighSchoolMatchOpportunityDebug(match)) : null;
      __activeOpportunityAudit = null;
      return result;
    }
  `, context);
  return context;
}

function percentile(sorted, fraction) {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    min: sorted[0] || 0,
    max: sorted.at(-1) || 0,
    mean: sorted.length ? sum / sorted.length : 0,
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75)
  };
}

function frequency(values) {
  return values.reduce((result, value) => {
    const key = String(value);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function sumObjects(matches, key) {
  return matches.reduce((total, match) => {
    Object.entries(match[key] || {}).forEach(([name, count]) => {
      total[name] = (total[name] || 0) + count;
    });
    return total;
  }, {});
}

function timingFrequency(matches, key, formatter) {
  return frequency(matches.flatMap(match => match[key].map(formatter)));
}

function summarize(matches) {
  const count = matches.length;
  const values = key => matches.map(match => match[key]);
  const zeroDefense = matches.filter(match => match.defensiveDecision === 0).length;
  const firstOnly = matches.filter(match => match.scriptedOffensiveDecision === 1 && match.emergentOffensiveDecision === 0).length;
  const archetypes = frequency(matches.map(match => {
    if (match.scriptedOffensiveDecision === 1 && match.emergentOffensiveDecision === 0 && match.defensiveDecision === 0) return "A-scripted-only-no-defense";
    if (match.scriptedOffensiveDecision === 1 && match.emergentOffensiveDecision > 0 && match.defensiveDecision === 0) return "B-scripted-plus-emergent-no-defense";
    if (match.scriptedOffensiveDecision === 1 && match.defensiveDecision > 0 && match.emergentOffensiveDecision === 0) return "C-scripted-plus-defense-only";
    return "D-scripted-plus-defense-plus-emergent-offense";
  }));
  const decisionWindowChecks = values("defensiveChecks").reduce((a, b) => a + b, 0);
  const playerOnDefensePA = values("defensivePA").reduce((a, b) => a + b, 0);
  const rejections = sumObjects(matches, "rejections");
  rejections["window-expired"] = playerOnDefensePA - decisionWindowChecks;
  return {
    matches: count,
    entryInning: frequency(matches.map(match => match.entry?.inning ?? "none")),
    entryHalf: frequency(matches.map(match => match.entry?.half ?? "none")),
    entryOuts: frequency(matches.map(match => match.entry?.outs ?? "none")),
    entryBases: frequency(matches.map(match => match.entryBaseKey)),
    entryScoreDifferential: frequency(matches.map(match => match.entry?.scoreDifferential ?? "none")),
    entryLineupSlot: frequency(matches.map(match => match.entry?.lineupSlot ?? "none")),
    immediateFirstBatter: matches.filter(match => match.entry?.immediateFirstBatter).length,
    playerPA: distribution(values("playerPA")),
    scriptedOffense: distribution(values("scriptedOffensiveDecision")),
    scriptedOffenseCounts: frequency(values("scriptedOffensiveDecision")),
    emergentOffense: distribution(values("emergentOffensiveDecision")),
    emergentOffenseCounts: frequency(values("emergentOffensiveDecision")),
    firstOnly, firstOnlyRate: firstOnly / count,
    defensiveInnings: distribution(values("defensiveInnings")),
    defensiveHalfShare: distribution(values("defensiveHalfShare")),
    defensivePA: distribution(values("defensivePA")),
    defensiveBallsInPlay: distribution(values("defensiveBallsInPlay")),
    defensiveInvolvement: distribution(values("playerInvolvements")),
    defensiveRoutine: distribution(values("defensiveRoutine")),
    defensiveAttention: distribution(values("defensiveAttention")),
    defensiveDecision: distribution(values("defensiveDecision")),
    zeroDefense, zeroDefenseRate: zeroDefense / count,
    coverage: distribution(values("defensiveCoverage")),
    primaryFielding: distribution(values("defensivePrimaryFielding")),
    funnel: {
      playerOnDefensePA,
      decisionWindowChecks,
      relevantResponsibility: values("relevantResponsibility").reduce((a, b) => a + b, 0),
      playerInvolvement: values("playerInvolvements").reduce((a, b) => a + b, 0),
      viableRoutes: values("viableRouteSituations").reduce((a, b) => a + b, 0),
      multiCommitment: values("multiCommitmentSituations").reduce((a, b) => a + b, 0),
      meaningfulDecision: values("meaningfulDefensiveOpportunities").reduce((a, b) => a + b, 0)
    },
    rejections,
    routesAvailable: sumObjects(matches, "routesAvailable"),
    routesExecuted: sumObjects(matches, "routesExecuted"),
    totalDecisions: distribution(values("totalDecisions")),
    decisionCounts: frequency(matches.map(match => match.totalDecisions >= 5 ? "5+" : match.totalDecisions)),
    offensiveDecisionTiming: timingFrequency(matches, "offensiveDecisionTiming", item => item.type + ":PA" + Math.min(4, item.paNumber) + (item.paNumber >= 4 ? "+" : "")),
    defensiveDecisionTiming: timingFrequency(matches, "defensiveDecisionTiming", item => item.inning + item.half),
    preEntryPAShare: matches.reduce((sum, match) => sum + match.preEntryPA, 0) / matches.reduce((sum, match) => sum + match.totalPA, 0),
    archetypes,
    completed: matches.filter(match => match.completed).length,
    orphan: matches.reduce((sum, match) => sum + match.orphan, 0),
    noProgress: matches.reduce((sum, match) => sum + match.noProgress, 0),
    integrityIssues: matches.reduce((sum, match) => sum + match.integrityIssues.length, 0)
  };
}

const context = makeContext();
const run = (seed, role, instrumentation = true, choicePolicy = "first", executionSample = 0.82) => JSON.parse(vm.runInContext(
  `JSON.stringify(__runOpportunityMatch243(${seed}, ${JSON.stringify(role)}, ${instrumentation}, ${JSON.stringify(choicePolicy)}, ${Number(executionSample)}))`, context
));

const seedArgumentIndex = process.argv.indexOf("--seed");
if (seedArgumentIndex >= 0) {
  const seed = Number(process.argv[seedArgumentIndex + 1]);
  const roleArgumentIndex = process.argv.indexOf("--role");
  const policyArgumentIndex = process.argv.indexOf("--policy");
  const sampleArgumentIndex = process.argv.indexOf("--sample");
  const role = roleArgumentIndex >= 0 ? process.argv[roleArgumentIndex + 1] : "bench";
  const policy = policyArgumentIndex >= 0 ? process.argv[policyArgumentIndex + 1] : "first";
  const sample = sampleArgumentIndex >= 0 ? Number(process.argv[sampleArgumentIndex + 1]) : 0.82;
  assert.ok(Number.isFinite(seed) && seed > 0, "--seed 必須是正整數");
  const replay = run(seed, role, true, policy, sample);
  assert.ok(replay.completed && !replay.orphan && !replay.integrityIssues.length, "single-seed replay 必須完整終場");
  console.log("Baseball Match Foundation 2.2.4.3 Single-seed Replay：PASS");
  console.log(`OPPORTUNITY_TRACE_JSON=${JSON.stringify(replay.opportunityTrace)}`);
  process.exit(0);
}

const startedAt = Date.now();
const bench = Array.from({ length: 1000 }, (_, index) => run(22430000 + index, "bench"));
const starter = Array.from({ length: 400 }, (_, index) => run(22431000 + index, "starter"));
const benchSummary = summarize(bench);
const starterSummary = summarize(starter);

const repeatSeeds = Array.from({ length: 10 }, (_, index) => 22430000 + index);
const repeatA = repeatSeeds.map(seed => run(seed, "bench", true));
const repeatB = repeatSeeds.map(seed => run(seed, "bench", true));
const withoutInstrumentation = repeatSeeds.map(seed => run(seed, "bench", false));
const deterministic = repeatA.every((match, index) => match.canonicalSignature === repeatB[index].canonicalSignature
  && JSON.stringify(match.routesAvailable) === JSON.stringify(repeatB[index].routesAvailable));
const instrumentationNeutral = repeatA.every((match, index) => match.canonicalSignature === withoutInstrumentation[index].canonicalSignature);

assert.strictEqual(benchSummary.completed, bench.length, "所有 Bench audit matches 應完成");
assert.strictEqual(starterSummary.completed, starter.length, "所有 Starter audit matches 應完成");
assert.strictEqual(benchSummary.orphan + starterSummary.orphan, 0, "Audit 不應產生 orphan playback");
assert.strictEqual(benchSummary.noProgress + starterSummary.noProgress, 0, "Audit 不應接受 no-progress callback");
assert.strictEqual(benchSummary.integrityIssues + starterSummary.integrityIssues, 0, "Audit 不應產生 game-state integrity issue");
assert.ok(deterministic, "相同 seeds 的 audit events 必須可重現");
assert.ok(instrumentationNeutral, "Instrumentation 開關不得改變 canonical match outcome");

const result = {
  schemaVersion: "2.2.4.3",
  seedStrategy: {
    bench: { base: 22430000, count: bench.length, last: 22430000 + bench.length - 1 },
    starter: { base: 22431000, count: starter.length, last: 22431000 + starter.length - 1 },
    deterministicRepeatSeeds: repeatSeeds
  },
  choicePolicy: "每個正式 Decision 選第一個合法 choice；execution sample 固定為 0.82；不消耗 match simulation RNG。",
  bench: benchSummary,
  starter: starterSummary,
  deterministic,
  instrumentationNeutral,
  fiveConsecutiveZeroDefenseProbability: benchSummary.zeroDefenseRate ** 5,
  runtimeMs: Date.now() - startedAt
};

console.log("Baseball Match Foundation 2.2.4.3 Opportunity Audit：PASS");
console.log(`AUDIT_JSON=${JSON.stringify(result)}`);
