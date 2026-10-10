'use strict';
const assert = require('assert/strict'), vm = require('vm'), cp = require('child_process'), path = require('path');
const SPRINT_BASELINE = 'c54f81016ed6d495f6c6911ebae708c05bcf4b2b';
let wiringBaseline;

// Explicit contract manifest, reviewed against the original tactical baselines.
// Pitch generation/selection, batter readiness, public dispatch, PA identity,
// persistence handoff and offensive presentation retain exact source guards.
const PROTECTED_FUNCTIONS = Object.freeze([
  'createOffensiveGameplayRolls', 'applyIntegratedOffensivePlayResult',
  'renderHighSchoolCurrentBatter', 'getHighSchoolFirstOffensiveMomentRolePresentation',
  'renderHighSchoolYearOneMatch', 'recordHighSchoolMatchOffensiveOpportunity',
  'chooseHighSchoolOffensiveAgency', 'chooseHighSchoolYearOneMatchMoment', 'getHighSchoolYearOneMomentId',
  'getHighSchoolCurrentBatterPresentation', 'formatHighSchoolBatterHandedness',
  'getHighSchoolOffensiveTacticalDebugTrace', 'getHighSchoolOffensiveBuntDebugTrace',
  'createHighSchoolOffensiveTacticalIdentity', 'getHighSchoolProvisionalOffensiveTacticalProfile',
  'getHighSchoolProvisionalOffensiveTacticalCapabilities', 'prepareHighSchoolOffensiveTacticalAction',
  'ensureHighSchoolOffensiveBuntPATacticalPlan', 'createHighSchoolBuntActualPitch',
  'getHighSchoolBuntPitchRecognition', 'resolveHighSchoolOffensiveBuntPitch',
  'getHighSchoolLatestBuntPitchRecord', 'findPendingHighSchoolBuntPitchPresentation',
  'recordHighSchoolProductionBuntPitchEvent', 'resolveHighSchoolProductionBuntPitch',
  'cancelHighSchoolOffensiveBuntPATacticalPlan', 'advanceHighSchoolOffensiveTacticalReveal',
  'getHighSchoolOpponentObservableCues', 'getOffensiveSimulationCapability',
  'getHighSchoolMatchLineupBatter', 'getHighSchoolMatchNextLineupBatter', 'getCurrentHighSchoolMatchDefender',
  'analyzeHighSchoolOffensiveDecisionContext', 'getHighSchoolOffensiveObjectiveContext',
  'getHighSchoolOffensivePlayerPANumber', 'classifyHighSchoolOffensiveOpportunity',
  'evaluateHighSchoolOffensiveDecisionDensity', 'applyHighSchoolOffensiveDecisionDensity',
  'evaluateHighSchoolOffensivePlayerAgency', 'createHighSchoolOffensiveAgencyIdentity',
  'prepareHighSchoolOffensiveAgencyChoice', 'getHighSchoolOffensiveAgencyChoices',
  'renderHighSchoolOffensiveAgencyContext', 'renderHighSchoolPlateDecisionContext',
  'getHighSchoolPlateDecisionChoices', 'renderHighSchoolBatterAnticipationPanel',
  'buildOffensiveDecisionChoices', 'isOffensiveDecisionChoiceLegal', 'getHighSchoolYearOneMatchMomentChoices',
  'getHighSchoolOpponentTeamSide', 'prepareHighSchoolYearOneMatch', 'prepareCurrentHighSchoolYearOneMatch',
  'getHighSchoolOffensivePlateApproachAbilities', 'ensureHighSchoolPitcherRuntimeState',
  'ensureHighSchoolBatterAnticipationState', 'deriveHighSchoolPitcherMentalStimulus',
  'settleHighSchoolPitcherRuntimeAfterPlateAppearance', 'syncHighSchoolPitcherTacticalState',
  'createHighSchoolOffensivePlateAppearanceIdentity', 'ensureHighSchoolOffensivePlateAppearanceState',
  'resolveHighSchoolOffensivePlateAppearance', 'prepareHighSchoolPlateDecision', 'resolveHighSchoolPlateDecisionPitch',
  'formatHighSchoolPlateDecisionPitchResult', 'formatHighSchoolOffensivePitchSequence',
  'createHighSchoolOffensiveExplainabilityModel', 'renderHighSchoolOffensiveExplainability',
  'formatHighSchoolOffensiveExecutionText', 'formatHighSchoolOffensiveCoachFeedback',
  'formatHighSchoolOffensivePitchFeed', 'deriveHighSchoolOffensiveBaseballMeaning',
  'formatHighSchoolOffensivePlayerFacingResult', 'didHighSchoolOffensiveObjectiveSucceed',
  'resolveHighSchoolOffensiveDecision', 'settleHighSchoolYearOneMatch',
  'shouldCreateHighSchoolFirstOffensiveMoment', 'prepareHighSchoolFirstOffensiveMomentFromSimulation',
  'prepareHighSchoolMeaningfulOffensiveMomentFromSimulation', 'prepareHighSchoolFinalOffensiveMomentFromSimulation',
  'shouldReachHighSchoolFinalOffensiveMoment', 'resolveHighSchoolYearOneMatch',
  'calculateOffensiveRating', 'getOffensiveCareerValue',
  'recordHighSchoolMatchPlateAppearanceEvidence', 'recordHighSchoolMeaningfulPlateAppearance',
  'recordHighSchoolYearOneMoment', 'recordHighSchoolRoutinePlateAppearance',
  'recordHighSchoolMatchSimulationEvent', 'applyHighSchoolSimulatedPlateAppearance',
  'advanceHighSchoolMatchBattingOrder', 'getHighSchoolPlayerTeamSide',
  'resolveHighSchoolThirdOutIntegrity', 'scoreHighSchoolMatchRunner', 'syncHighSchoolMatchPlayerRunnerLocation',
  'assertHighSchoolMatchStateIntegrity'
]);
const MODULE_SYMBOLS = Object.freeze([
  'PitchSequencing', 'PitcherMentalState', 'BatterAnticipation', 'OffensivePlateApproach',
  'PlateDecisionFoundation', 'PitcherCatcherTacticalIntegration', 'PitchObservationFoundation',
  'PitchSequenceStateFoundation', 'PitchTacticalInterpretationFoundation',
  'PitchTacticalDecisionFoundation', 'PitchTacticalDecisionProductionAdapter', 'PitchTacticalSignalProjectionFoundation'
]);
// Match/PA scheduling and identity are inputs to the public pitch boundary.
// Unrelated career, narrative and defensive route constants are outside it.
const PROTECTED_GLOBALS = Object.freeze([
  'isTransitioning', 'pendingYouthSeasonOutcome', 'pendingBaseballGameplay', 'pendingTrainingOutcome',
  'pendingHighSchoolMatchPositionOverride', 'pendingHighSchoolFullMatchTest', 'pendingHighSchoolMatchSimulationSeed',
  'MATCH_FLOW_BEAT_MS', 'MATCH_ATTENTION_BEAT_MS', 'MATCH_MAJOR_TRANSITION_MS',
  'highSchoolMatchPlaybackTimer', 'highSchoolMatchPlaybackScheduled', 'highSchoolMatchPlaybackGeneration',
  'highSchoolMatchPlaybackTimerGeneration',
  'MATCH_DECISION_DENSITY_VERSION', 'MATCH_DECISION_ABSOLUTE_SAFETY_CAP',
  'MATCH_DECISION_REPEAT_SPACING', 'MATCH_DECISION_MAX_CONSECUTIVE',
  'highSchoolYearOneMomentIds', 'highSchoolYearOneMatchEventIds', 'highSchoolBallContexts',
  'highSchoolOffensiveTacticalDebugTrace', 'highSchoolOffensiveBuntDebugTrace', 'positionDecisionFamilyRegistry',
  'HIGH_SCHOOL_THIRD_OUT_TYPES'
]);
const SHARED_OUTCOME_OWNERS = Object.freeze([
  'recordHighSchoolMatchPlateAppearanceEvidence', 'recordHighSchoolMeaningfulPlateAppearance',
  'recordHighSchoolYearOneMoment', 'recordHighSchoolRoutinePlateAppearance', 'recordHighSchoolMatchSimulationEvent',
  'applyHighSchoolSimulatedPlateAppearance', 'advanceHighSchoolMatchBattingOrder',
  'getHighSchoolPlayerTeamSide', 'resolveHighSchoolThirdOutIntegrity', 'scoreHighSchoolMatchRunner',
  'syncHighSchoolMatchPlayerRunnerLocation', 'assertHighSchoolMatchStateIntegrity'
]);
const ROUTINE_INFIELD_ADDITION = `    ...(runnerFacts.outcomeAuthority === "existingOrdinaryPhysicalOutcome" ? {
      eventClassification: "ordinaryPlay", outcomeAuthority: runnerFacts.outcomeAuthority,
      physicalTruth: JSON.parse(JSON.stringify(runnerFacts.physicalTruth)), physicalIdentity: runnerFacts.physicalTruth?.identity || null,
      defensiveOpportunity: runnerFacts.defensiveOpportunity ? JSON.parse(JSON.stringify(runnerFacts.defensiveOpportunity)) : null
    } : {}),
`;
const normalize = text => text.replace(/\r\n?/g, '\n');
const cache = new Map();
function readSource(text) {
  const source = normalize(text);
  if (cache.has(source)) return cache.get(source);
  // Parse without executing production globals or reading RNG/state.
  new vm.Script(source, { filename: 'frozen-script.js' });
  const headers = [...source.matchAll(/^function ([\w$]+)\s*\(/gm)];
  const byName = new Map();
  for (const header of headers) {
    assert(!byName.has(header[1]), 'duplicate top-level declaration: ' + header[1]);
    byName.set(header[1], header);
  }
  const functions = new Map();
  function get(name) {
    if (functions.has(name)) return functions.get(name);
    const header = byName.get(name);
    assert(header, 'missing protected function: ' + name);
    const firstLineEnd = source.indexOf('\n', header.index);
    const firstLine = source.slice(header.index, firstLineEnd < 0 ? source.length : firstLineEnd);
    if (/\}\s*$/.test(firstLine)) {
      try {
        new vm.Script(firstLine);
        const result = { source: firstLine, start: header.index, end: header.index + firstLine.length };
        functions.set(name, result); return result;
      } catch (error) { if (!(error instanceof SyntaxError)) throw error; }
    }
    // This source uses column-zero function declarations/closing braces. A
    // candidate closing brace is accepted only when Node parses the COMPLETE
    // declaration, so braces in strings/templates/nested blocks cannot truncate it.
    const closes = /^\}/gm; closes.lastIndex = header.index;
    for (let close = closes.exec(source); close; close = closes.exec(source)) {
      const end = close.index + 1, body = source.slice(header.index, end);
      try { new vm.Script(body); } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
      const result = { source: body, start: header.index, end };
      functions.set(name, result); return result;
    }
    assert.fail('unparseable function boundary: ' + name);
  }
  let topLevelNames;
  const result = { source, get,
    get names() {
      if (!topLevelNames) {
        topLevelNames = []; let previousEnd = -1;
        for (const header of headers) {
          // A column-zero declaration inside a template or nested body is NOT
          // a new top-level binding. The complete enclosing parse owns it.
          if (header.index < previousEnd) continue;
          const declaration = get(header[1]); previousEnd = declaration.end;
          topLevelNames.push(header[1]);
        }
      }
      return topLevelNames;
    }
  };
  // Baselines repeat across suites; retain only a small number of full snapshots.
  if (cache.size >= 6) cache.delete(cache.keys().next().value);
  cache.set(source, result); return result;
}
function withoutFunctions(parsed, names) {
  const ranges = names.map(name => parsed.get(name)).sort((a, b) => b.start - a.start);
  let remaining = parsed.source;
  for (const range of ranges) remaining = remaining.slice(0, range.start) + remaining.slice(range.end);
  return remaining;
}
function topLevelSource(parsed) {
  const remaining = withoutFunctions(parsed, parsed.names);
  // Fail closed if the column-zero declaration convention ever stops describing
  // this file: removing true top-level declarations must leave valid JavaScript.
  new vm.Script(remaining, { filename: 'frozen-script-top-level.js' });
  return PROTECTED_GLOBALS.map(name => {
    const declarations = [...remaining.matchAll(new RegExp('^(?:let|const|var) ' + name + '(?=\\s|=)', 'gm'))];
    assert.equal(declarations.length, 1, 'missing/duplicate protected global: ' + name);
    const start = declarations[0].index, ends = /;[ \t]*$/gm; ends.lastIndex = start;
    for (let end = ends.exec(remaining); end; end = ends.exec(remaining)) {
      const declaration = remaining.slice(start, end.index + 1);
      try { new vm.Script(declaration); return declaration; } catch (error) {
        if (error instanceof SyntaxError) continue;
        throw error;
      }
    }
    assert.fail('unparseable protected global: ' + name);
  });
}
function protectedWiring(parsed) {
  const outside = withoutFunctions(parsed, PROTECTED_FUNCTIONS);
  // Shared scoring/recording owners are also used by defense. Their exact bodies
  // remain protected above; changing a defensive caller's arguments is outside
  // the pitch scope. Rebinding those owners is still rejected below.
  const names = [...PROTECTED_FUNCTIONS.filter(name => !SHARED_OUTCOME_OWNERS.includes(name)),
    ...MODULE_SYMBOLS, ...PROTECTED_GLOBALS];
  const pattern = new RegExp('\\b(?:' + names.join('|') + ')\\b');
  const override = new RegExp('\\b(?:' + SHARED_OUTCOME_OWNERS.join('|') + ')\\s*=');
  return outside.split('\n').filter(line => !/^\s*\/\//.test(line) && (pattern.test(line) || override.test(line))).map(line => line.trim());
}
function expectedFunction(baseline, name) {
  const original = baseline.get(name).source;
  // Preserve both shared recording owners. Only these exact reviewed additive
  // defensive projections are authorized; the old ordinary/offensive path is
  // still frozen, and changing the additions themselves also fails the guard.
  if (name === 'recordHighSchoolYearOneMoment') return original.replace(
    '    error: Boolean(eventFacts.error)\n',
    '    error: Boolean(eventFacts.error),\n    ...(eventFacts.defensiveFacts || {})\n');
  if (name === 'recordHighSchoolRoutinePlateAppearance') return original.replace(
    '    eventClassification: "playerRoutinePlay",\n',
    '    eventClassification: "playerRoutinePlay",\n' + ROUTINE_INFIELD_ADDITION);
  return original;
}
function assertPitchProductionSourceScope(currentText, baselineText) {
  const current = readSource(currentText), baseline = readSource(baselineText);
  for (const name of PROTECTED_FUNCTIONS) {
    const actual = current.get(name).source, original = baseline.get(name).source;
    assert(actual === original || actual === expectedFunction(baseline, name), 'protected source changed: script.js#' + name);
  }
  for (const name of PROTECTED_FUNCTIONS) assert(current.names.includes(name), 'protected declaration is no longer top-level: ' + name);
  assert.deepEqual(topLevelSource(current), topLevelSource(baseline), 'script.js protected top-level constants/registrations changed');
  // The historical projection baselines predate the already accepted SS entry.
  // Keep their protected implementations unchanged, while freezing shared-owner
  // call sites against the immutable FORMAL Sprint baseline (not mutable WIP).
  if (!wiringBaseline) wiringBaseline = readSource(cp.execFileSync('git', ['show', SPRINT_BASELINE + ':script.js'], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
  }));
  assert.deepEqual(protectedWiring(current), protectedWiring(wiringBaseline), 'script.js pitch/offense call or hook wiring changed');
  return { protectedFunctions: PROTECTED_FUNCTIONS.length, topLevelDeclarations: true, externalWiring: true };
}
module.exports = { assertPitchProductionSourceScope, PROTECTED_FUNCTIONS, PROTECTED_GLOBALS, MODULE_SYMBOLS, SPRINT_BASELINE, readSource, normalize };
