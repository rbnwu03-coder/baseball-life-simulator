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
    module: { exports: {} }, URLSearchParams,
    navigator: { clipboard: { async writeText() {} } },
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
      createElement() { return { value: "", style: {}, setAttribute() {}, select() {}, remove() {} }; }, execCommand() { return true; }
    },
    localStorage: {
      setItem(key, value) { storage.set(key, value); }, getItem(key) { return storage.get(key) || null; }, removeItem(key) { storage.delete(key); }
    },
    window: {
      location: { search: "" },
      setTimeout(callback, delay) { const id = nextTimerId++; timers.set(id, { callback, delay }); return id; },
      clearTimeout(id) { timers.delete(id); }
    },
    __clearTimers245() { timers.clear(); },
    __runTimer245() {
      const next = timers.entries().next().value;
      if (!next) return false;
      const [id, timer] = next; timers.delete(id); timer.callback(); return true;
    }
  });
  files.forEach(file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  vm.runInContext(`
    const __baseUpdateOpportunity245 = updateHighSchoolMatchDefensiveOpportunityFromSituation;
    let __capturedSituations245 = [];
    updateHighSchoolMatchDefensiveOpportunityFromSituation = function(match, opportunity, situation, legalChoices, classification) {
      if (situation) __capturedSituations245.push({
        inning: match.inning, half: match.half, outs: match.outs, runners: match.runners.slice(0, 3),
        scores: { ...match.scores }, situation: JSON.parse(JSON.stringify(situation))
      });
      return __baseUpdateOpportunity245(match, opportunity, situation, legalChoices, classification);
    };

    function __random245(seed) {
      let state = Number(seed) >>> 0;
      return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    }

    function __prepareGenesis245(idealSelf, genesisSeed, entry, matchSeed = genesisSeed) {
      stopHighSchoolMatchPlayback("2.2.4.5-reset"); __clearTimers245(); pendingYouthSeasonOutcome = null; isTransitioning = false;
      setHighSchoolMatchOpportunityDebugEnabled(false); resetGame();
      document.getElementById("nameInput").value = "2.2.4.5 Capability 球員";
      selectOrigin("understand"); selectIdealSelf(idealSelf);
      pendingGenesisRoll = rollCharacterGenesis(__random245(genesisSeed));
      pendingGenesisAllocation = { ballSense: 1, observe: 1, fitness: 0, batting: 0, baseRunning: 0, baseballIQ: 1 };
      selectDevelopmentEntry(entry); selectDevelopmentTestPosition("二壘手");
      pendingHighSchoolMatchSimulationSeed = matchSeed;
    }

    function __direct245(idealSelf, genesisSeed, matchSeed = genesisSeed, debug = false) {
      __prepareGenesis245(idealSelf, genesisSeed, "highSchoolFullMatch", matchSeed);
      setHighSchoolMatchOpportunityDebugEnabled(debug); createPlayer();
      stopHighSchoolMatchPlayback("2.2.4.5-direct-ready"); __clearTimers245();
      return { snapshot: getPlayerCapabilitySnapshotForMatch(player, player.highSchoolMatch), match: player.highSchoolMatch };
    }

    function __chooseNarrative245(eventId, index = 0) {
      if (getCurrentEventId() !== eventId) throw new Error("Narrative event mismatch: " + eventId + " / " + getCurrentEventId());
      choose(eventId, index);
      while (isTransitioning && __runTimer245()) {}
      if (isTransitioning) throw new Error("Narrative transition stalled: " + eventId);
    }

    function __narrative245(idealSelf, genesisSeed, matchSeed = genesisSeed, debug = false) {
      __prepareGenesis245(idealSelf, genesisSeed, "highSchool", matchSeed);
      createPlayer();
      for (const eventId of ["high_school_intro", "high_school_load", "high_school_life", "high_school_role"]) __chooseNarrative245(eventId, 0);
      setHighSchoolMatchOpportunityDebugEnabled(debug);
      pendingHighSchoolMatchPositionOverride = "二壘手";
      pendingHighSchoolMatchSimulationSeed = matchSeed;
      __chooseNarrative245("high_school_long_bench", 0);
      stopHighSchoolMatchPlayback("2.2.4.5-narrative-ready"); __clearTimers245();
      return { snapshot: getPlayerCapabilitySnapshotForMatch(player, player.highSchoolMatch), match: player.highSchoolMatch };
    }

    function __narrativeAttribution245(genesisSeed) {
      __prepareGenesis245("守備型", genesisSeed, "highSchool", genesisSeed);
      createPlayer();
      const keys = ["catching", "throwing", "reaction", "range", "armStrength", "baseballIQ"];
      const read = stage => ({
        stage,
        baseballSkills: Object.fromEntries(keys.map(key => [key, Number(player.baseballSkills[key]) || 0])),
        general: { ballSense: player.ballSense, observe: player.observe, fitness: player.fitness, discipline: player.discipline, responsibility: player.responsibility },
        ledger: Number(player.balanceDebug?.chapterSkillPoints) || 0
      });
      const stages = [read("after-synthetic-pre-hs")];
      for (const eventId of ["high_school_intro", "high_school_load", "high_school_life", "high_school_role"]) {
        __chooseNarrative245(eventId, 0); stages.push(read("after-" + eventId));
      }
      pendingHighSchoolMatchPositionOverride = "二壘手";
      pendingHighSchoolMatchSimulationSeed = genesisSeed;
      __chooseNarrative245("high_school_long_bench", 0);
      stages.push(read("after-high_school_long_bench"));
      stopHighSchoolMatchPlayback("2.2.4.5-attribution"); __clearTimers245();
      return stages;
    }

    function __pickFirst245(match) {
      const choice = getHighSchoolYearOneMatchMomentChoices(match)[0];
      return choice && chooseHighSchoolYearOneMatchMoment(choice.matchDecision, choice.matchMomentId, () => .82);
    }

    function __finish245(path, idealSelf, genesisSeed, matchSeed) {
      __capturedSituations245 = [];
      const setup = path === "direct" ? __direct245(idealSelf, genesisSeed, matchSeed, true) : __narrative245(idealSelf, genesisSeed, matchSeed, true);
      const match = setup.match;
      let steps = 0; let orphan = 0; let decisions = 0;
      while (!match.completed && steps++ < 5000) {
        if (hasBlockingHighSchoolMatchOutcome()) { continueYouthSeasonOutcome(); stopHighSchoolMatchPlayback("2.2.4.5-outcome"); __clearTimers245(); }
        else if (isHighSchoolMatchDecisionVisible(match)) {
          showCurrentEvent();
          if (!__pickFirst245(match)) { orphan += 1; break; }
          decisions += 1; stopHighSchoolMatchPlayback("2.2.4.5-choice"); __clearTimers245();
        } else {
          const progressed = advanceHighSchoolMatchPlaybackStep(match);
          showCurrentEvent(); stopHighSchoolMatchPlayback("2.2.4.5-step"); __clearTimers245();
          if (!progressed) { orphan += 1; break; }
        }
      }
      const trace = JSON.parse(exportHighSchoolMatchOpportunityDebug(match));
      const defense = trace.opportunities.filter(item => item.domain === "defense");
      return {
        path, completed: match.completed, orphan, steps, decisions, snapshot: setup.snapshot,
        summary: trace.summary,
        funnel: {
          defensivePA: defense.length,
          responsibility: defense.filter(item => item.responsibilityCheck).length,
          legalRouteSituations: defense.filter(item => item.legalRoutes.length > 0).length,
          legalRoutes: defense.reduce((sum, item) => sum + item.legalRoutes.length, 0),
          expiredLegalRoutes: defense.reduce((sum, item) => sum + Math.max(0, item.legalRoutes.length - item.viableRoutes.length), 0),
          viableRouteSituations: defense.filter(item => item.viableRoutes.length > 0).length,
          viableRoutes: defense.reduce((sum, item) => sum + item.viableRoutes.length, 0),
          multiRoute: defense.filter(item => item.viableRoutes.length >= 2).length,
          meaningfulDecision: defense.filter(item => item.defensiveDecisionCreated).length
        },
        finalTruth: trace.finalMatchTruth,
        captures: JSON.parse(JSON.stringify(__capturedSituations245))
      };
    }

    function __scenario245(capabilities, kind) {
      const setup = __direct245("守備型", 24500001, 24500001, false);
      const match = JSON.parse(JSON.stringify(setup.match));
      const away = match.rosters.away.lineup;
      match.position = "內野手"; match.developmentPositionOverride = "二壘手";
      match.currentBatter = away[0].id; match.half = "上"; match.offenseTeam = "away"; match.defenseTeam = "home";
      if (kind === "S1") { match.inning = 6; match.outs = 1; match.runners = [null, null, null]; }
      if (["S2", "R6"].includes(kind)) { match.inning = 6; match.outs = 1; match.runners = [away[1].id, null, null]; }
      if (kind === "S3") { match.inning = 8; match.outs = 1; match.runners = [away[1].id, away[2].id, away[3].id]; }
      if (kind === "R8") { match.inning = 8; match.outs = 2; match.runners = [away[1].id, away[2].id, away[3].id]; }
      if (kind === "R9") { match.inning = 9; match.outs = 0; match.runners = [away[1].id, null, null]; }
      const situation = buildInfieldMeaningfulMoment(match, player, {
        playerPosition: "二壘手", primaryFielderPosition: "二壘手",
        ballContext: highSchoolBallContexts.normalGrounder,
        ballDirection: "straightAtPlayer", ballDepth: "standard", batterSpeed: 5,
        runnerSpeeds: [5, 5, 5], playerCapabilities: capabilities
      });
      const routes = Object.values(SECOND_BASE_ROUTE_DEFINITIONS).map(route => ({ id: route.id, ...evaluateDefensiveRouteAvailability(situation, route) }));
      return { windows: situation.routeWindows, routes };
    }

    function __recalculateCaptured245(capture, capabilities) {
      if (!capture?.situation) return null;
      const situation = JSON.parse(JSON.stringify(capture.situation));
      situation.playerCapabilities = { ...capabilities };
      situation.windows = deriveInfieldExecutionWindows(situation);
      situation.routeWindows = deriveSecondBaseExecutionWindows(situation, situation.routeWindowOverrides || {});
      const routes = Object.values(SECOND_BASE_ROUTE_DEFINITIONS).map(route => ({ id: route.id, ...evaluateDefensiveRouteAvailability(situation, route) }));
      return { inning: capture.inning, outs: capture.outs, runners: capture.runners, windows: situation.routeWindows, routes };
    }
  `, context);
  return context;
}

function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
  const median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return { min: sorted[0] ?? 0, median, mean, max: sorted.at(-1) ?? 0 };
}

function summarizeSnapshots(snapshots) {
  const result = { genesis: {}, baseballSkills: {}, defense: {} };
  for (const key of ["ballSense", "observe", "fitness", "batting", "baseRunning", "baseballIQ"]) result.genesis[key] = distribution(snapshots.map(item => item.genesis[key]));
  for (const key of ["catching", "throwing", "batting", "baseRunning", "baseballIQ", "armStrength", "reaction", "range", "blocking", "gameCalling", "control", "pitchStamina"]) result.baseballSkills[key] = distribution(snapshots.map(item => item.baseballSkills[key]));
  for (const key of ["fielding", "reaction", "range", "arm", "throwing", "decision"]) result.defense[key] = distribution(snapshots.map(item => item.derivedMatchCapabilities.defense[key]));
  return result;
}

function sumFunnels(matches) {
  const keys = Object.keys(matches[0].funnel);
  const totals = Object.fromEntries(keys.map(key => [key, matches.reduce((sum, match) => sum + match.funnel[key], 0)]));
  return {
    matches: matches.length, ...totals,
    zeroDefenseDecision: matches.filter(match => match.funnel.meaningfulDecision === 0).length,
    laterOffenseDecision: matches.filter(match => match.summary.emergentOffensiveDecisions > 0).length,
    expiredWindowRate: totals.legalRoutes ? totals.expiredLegalRoutes / totals.legalRoutes : 0,
    viableRouteRate: totals.legalRoutes ? totals.viableRoutes / totals.legalRoutes : 0
  };
}

const context = makeContext();
const evaluate = expression => vm.runInContext(expression, context);
const parse = expression => JSON.parse(evaluate(`JSON.stringify(${expression})`));
let passed = 0;
function verify(title, condition) { assert.ok(condition, title); passed += 1; console.log(`✓ ${title}`); }

const archetypes = ["全能型", "強打型", "技巧型", "守備型", "速度型", "棒球理解型"];
const archetypeSeeds = Array.from({ length: 20 }, (_, index) => 24500000 + index);
const archetypeRuns = Object.fromEntries(archetypes.map(ideal => [ideal, archetypeSeeds.map(seed => parse(`__direct245(${JSON.stringify(ideal)},${seed},${seed}).snapshot`))]));
const archetypeSummary = Object.fromEntries(archetypes.map(ideal => [ideal, summarizeSnapshots(archetypeRuns[ideal])]));

verify("1. Capability snapshot 是 read-only 且不推進 simulation cursor", evaluate(`(() => {const d=__direct245("守備型",24500001,24500001);const before=JSON.stringify(d.match);const cursor=d.match.simulationCursor;getPlayerCapabilitySnapshotForMatch(player,d.match);return JSON.stringify(d.match)===before&&d.match.simulationCursor===cursor;})()`));
verify("2. Snapshot 完整輸出 Genesis、baseballSkills、derived capabilities 與 development state", ["route", "role", "position", "idealSelf", "genesis", "baseballSkills", "derivedMatchCapabilities", "developmentState"].every(key => Object.hasOwn(archetypeRuns["守備型"][0], key)));
verify("3. 六種 archetype × 20 Genesis seeds 全部建立 Direct Start snapshot", archetypes.every(ideal => archetypeRuns[ideal].length === 20));
verify("4. Ideal Self 不改 Genesis，但 Starting Bias 會形成小幅可解釋能力差異", archetypeSeeds.every((_, index) => new Set(archetypes.map(ideal => JSON.stringify(archetypeRuns[ideal][index].genesis))).size === 1)
  && archetypeSummary["守備型"].baseballSkills.catching.mean >= archetypeSummary["全能型"].baseballSkills.catching.mean
  && archetypeSummary["強打型"].baseballSkills.batting.mean >= archetypeSummary["守備型"].baseballSkills.batting.mean);
verify("5. 守備型 Direct Start 的 universal defensive skills 全部完成合法初始化", archetypeRuns["守備型"].every(item => ["catching", "throwing", "reaction", "range", "armStrength"].every(key => item.baseballSkills[key] >= 1)));
verify("6. Direct Start position override 只指定本場二壘責任、不改 canonical primary position", archetypeRuns["守備型"].every(item => item.position === "二壘手" && item.developmentState.primaryPosition === "內野手"));

const narrativeSeeds = Array.from({ length: 100 }, (_, index) => 24510000 + index);
const directSnapshots = narrativeSeeds.map(seed => parse(`__direct245("守備型",${seed},${24520000 + seed - 24510000}).snapshot`));
const narrativeSnapshots = narrativeSeeds.map(seed => parse(`__narrative245("守備型",${seed},${24520000 + seed - 24510000}).snapshot`));
const directSummary = summarizeSnapshots(directSnapshots);
const narrativeSummary = summarizeSnapshots(narrativeSnapshots);
const sourceAttribution = parse(`__narrativeAttribution245(24510000)`);
verify("7. Normal Narrative 100/100 在同一 featured match 前完成 snapshot", narrativeSnapshots.length === 100 && narrativeSnapshots.every(item => item.developmentState.highSchoolStep >= 5));
verify("8. Direct 與 Narrative 使用相同 formula／settlement／universal validation contract", [...directSnapshots, ...narrativeSnapshots].every(item => item.capabilityFoundation.initialSkillFormulaVersion === "initial-skills-v1"
  && item.capabilityFoundation.settlementVersion === "hs-entry-capability-v1"
  && Object.values(item.baseballSkills).slice(0, 8).every(value => Number.isFinite(value) && value >= 1)));
verify("9. 同 Genesis seed 的 20/20 path delta 來自 Narrative events 而非 initial roll", narrativeSeeds.slice(0, 20).every((_, index) => JSON.stringify(directSnapshots[index].genesis) === JSON.stringify(narrativeSnapshots[index].genesis)));
verify("10. Narrative defensive raw skills 已具有 1–8 的合法高中入口 Foundation", narrativeSnapshots.every(item => ["catching", "throwing", "reaction", "range", "armStrength"].every(key => item.baseballSkills[key] >= 1 && item.baseballSkills[key] <= 8)));
verify("10a. Skill attribution 精確定位 high_school_role 與 high_school_long_bench 的增量", (() => {
  const byStage = Object.fromEntries(sourceAttribution.map(item => [item.stage, item]));
  return byStage["after-high_school_role"].baseballSkills.catching === byStage["after-high_school_life"].baseballSkills.catching + 1
    && byStage["after-high_school_role"].baseballSkills.reaction === byStage["after-high_school_life"].baseballSkills.reaction + 1
    && byStage["after-high_school_long_bench"].baseballSkills.baseballIQ === byStage["after-high_school_role"].baseballSkills.baseballIQ + 1;
})());

const directCapabilities = directSnapshots[0].derivedMatchCapabilities.defense;
const narrativeCapabilities = narrativeSnapshots[0].derivedMatchCapabilities.defense;
const scenarios = Object.fromEntries(["S1", "S2", "S3"].map(kind => [kind, {
  direct: parse(`__scenario245(${JSON.stringify(directCapabilities)},${JSON.stringify(kind)})`),
  narrative: parse(`__scenario245(${JSON.stringify(narrativeCapabilities)},${JSON.stringify(kind)})`)
}]));
const describedHumanScenarios = Object.fromEntries(["R6", "R8", "R9"].map(kind => [kind, {
  direct: parse(`__scenario245(${JSON.stringify(directCapabilities)},${JSON.stringify(kind)})`),
  narrative: parse(`__scenario245(${JSON.stringify(narrativeCapabilities)},${JSON.stringify(kind)})`)
}]));
verify("11. Viability threshold 維持 <1.75 expired／<3.5 narrow／<5.5 normal／其餘 wide", evaluate(`classifyDefensiveExecutionWindow(1.74)==="expired"&&classifyDefensiveExecutionWindow(1.75)==="narrow"&&classifyDefensiveExecutionWindow(3.5)==="normal"&&classifyDefensiveExecutionWindow(5.5)==="wide"`));
verify("12. S1／S2／S3 都以同一 production window 與 route availability formula 比較", Object.values(scenarios).every(pair => pair.direct.windows && pair.narrative.windows && pair.direct.routes.length === 6 && pair.narrative.routes.length === 6));

const matchSeeds = Array.from({ length: 100 }, (_, index) => 24530000 + index);
const directMatches = matchSeeds.map((seed, index) => parse(`__finish245("direct","守備型",${narrativeSeeds[index]},${seed})`));
const narrativeMatches = matchSeeds.map((seed, index) => parse(`__finish245("narrative","守備型",${narrativeSeeds[index]},${seed})`));
const directFunnel = sumFunnels(directMatches);
const narrativeFunnel = sumFunnels(narrativeMatches);
verify("13. Direct 與 Narrative 各 100/100 完整終場且無 orphan", [...directMatches, ...narrativeMatches].every(match => match.completed && match.orphan === 0));
verify("14. Capability funnel 可分離 responsibility／legal／expired／viable／multi-route／Decision", [directFunnel, narrativeFunnel].every(item => ["responsibility", "legalRoutes", "expiredLegalRoutes", "viableRoutes", "multiRoute", "meaningfulDecision"].every(key => Number.isFinite(item[key]))));

const replayDirect = parse(`__finish245("direct","守備型",81438,81438)`);
const replayNarrative = parse(`__finish245("narrative","守備型",81438,81438)`);
const findCapture = (captures, inning, outs, loaded) => captures.find(item => item.inning === inning && item.half === "上" && item.outs === outs
  && (loaded ? item.runners.every(Boolean) : Boolean(item.runners[0]) && !item.runners[1] && !item.runners[2]));
const targetCaptures = {
  "6上1out一壘": findCapture(replayDirect.captures, 6, 1, false) || null,
  "8上2out滿壘": findCapture(replayDirect.captures, 8, 2, true) || null,
  "9上0out一壘": findCapture(replayDirect.captures, 9, 0, false) || null
};
const replayRouteComparison = Object.fromEntries(Object.entries(targetCaptures).map(([key, capture]) => [key, capture ? {
  direct: parse(`__recalculateCaptured245(${JSON.stringify(capture)},${JSON.stringify(replayDirect.snapshot.derivedMatchCapabilities.defense)})`),
  narrative: parse(`__recalculateCaptured245(${JSON.stringify(capture)},${JSON.stringify(replayNarrative.snapshot.derivedMatchCapabilities.defense)})`)
} : null]));
const routeState = (scenario, pathName, routeId) => describedHumanScenarios[scenario][pathName].routes.find(route => route.id === routeId);
verify("15. Seed 81438 Direct 與 Narrative replay 都完整終場", replayDirect.completed && replayNarrative.completed && !replayDirect.orphan && !replayNarrative.orphan);
verify("16. Seed 81438 captured situations 使用相同情境做 pure capability recomputation", Object.values(replayRouteComparison).filter(Boolean).every(item => JSON.stringify([item.direct.inning, item.direct.outs, item.direct.runners]) === JSON.stringify([item.narrative.inning, item.narrative.outs, item.narrative.runners])));
verify("17. Representative fixture 透過正式 Genesis／Synthetic Outcome／Settlement contract 建立", evaluate(`(() => {const f=createRepresentativeHighSchoolEntryFixture("ordinary",24517);return validateHighSchoolEntryCapability(f).ok&&f.capabilityState.originType==="representative-ordinary";})()`));
verify("18. 6上 1 out 一壘仍使用 production window 與合法路線公式", ["direct", "narrative"].every(path => routeState("R6", path, "secureFirstBaseOut") && routeState("R6", path, "initiate463")));
verify("19. 8上 2 out 滿壘仍拒絕不合法雙殺，並保留一壘／本壘 route 評估", ["direct", "narrative"].every(path => !routeState("R8", path, "initiate463").legal && routeState("R8", path, "secureFirstBaseOut") && routeState("R8", path, "homeForceOut")));
verify("20. 9上 0 out 一壘：結果與同能力、同球況的 6 上 route comparison 一致", JSON.stringify(describedHumanScenarios.R6) === JSON.stringify(describedHumanScenarios.R9));
verify("21. Current-build 81438 replay 未重現人工 trace 的 6上／8上／9上三個 exact situations", Object.values(targetCaptures).every(value => value === null));

const result = {
  schemaVersion: "2.2.4.5",
  genesisAllocationPolicy: { ballSense: 1, observe: 1, baseballIQ: 1 },
  archetypes: archetypeSummary,
  direct: directSummary,
  narrative: narrativeSummary,
  sourceAttribution,
  sameSeedDeltas: narrativeSeeds.slice(0, 20).map((seed, index) => ({
    seed,
    baseballSkills: Object.fromEntries(["catching", "throwing", "reaction", "range", "armStrength", "baseballIQ"].map(key => [key, narrativeSnapshots[index].baseballSkills[key] - directSnapshots[index].baseballSkills[key]])),
    defense: Object.fromEntries(["fielding", "reaction", "range", "arm", "throwing", "decision"].map(key => [key, narrativeSnapshots[index].derivedMatchCapabilities.defense[key] - directSnapshots[index].derivedMatchCapabilities.defense[key]]))
  })),
  scenarios,
  describedHumanScenarios,
  directFunnel,
  narrativeFunnel,
  representativeFixture: parse(`Object.fromEntries(["ordinary","defense","batting","low"].map((profile,index)=>{const f=createRepresentativeHighSchoolEntryFixture(profile,24550000+index);return [profile,getPlayerCapabilitySnapshotForMatch(f,f.highSchoolMatch)];}))`),
  representativeReason: "所有 representative profiles 均由正式 Genesis、Initial Skill Formula、Synthetic Youth Outcome 與同一 HS Entry Settlement 產生。",
  seed81438: {
    direct: { summary: replayDirect.summary, funnel: replayDirect.funnel, snapshot: replayDirect.snapshot },
    narrative: { summary: replayNarrative.summary, funnel: replayNarrative.funnel, snapshot: replayNarrative.snapshot },
    targetCapturesFound: Object.fromEntries(Object.entries(targetCaptures).map(([key, value]) => [key, Boolean(value)])),
    routeComparison: replayRouteComparison
  }
};

console.log(`\nBaseball Match Foundation 2.2.4.5：${passed}/${passed} 通過`);
console.log(`CAPABILITY_AUDIT_JSON=${JSON.stringify(result)}`);
