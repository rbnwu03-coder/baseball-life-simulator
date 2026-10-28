'use strict';

// Offline candidate foundation. No Match imports, IO, callbacks, simulation or UI wiring.
const VERSION = 'match-ui-slice/0.2';
const V01 = 'match-ui-slice/0.1';
class ContractError extends Error {
  constructor(code, path = '$') { super(`${code}: ${path}`); this.name = 'ContractError'; this.code = code; }
}
function need(condition, code, path) { if (!condition) throw new ContractError(code, path); }
const text = { type: 'string', minLength: 1, maxLength: 8000 };
const nullableText = { oneOf: [text, { type: 'null' }] };
const integer = { type: 'integer', minimum: 0 };
const nullOnly = { type: 'null' };
const tuple = item => ({ type: 'array', items: item, minItems: 3, maxItems: 3 });
const array = item => ({ type: 'array', items: item, maxItems: 32 });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const enumOf = values => ({ enum: values });
const routes = ['secureFirstBaseOut', 'forceSecond', 'startDoublePlaySecond', 'holdBall'];
const route = enumOf(routes);
const commands = ['secure', 'forceSecond', 'challenge', 'contain'];
const routeLabels = ['6-3', '6-4', '6-4-3', '持球'];
const risks = ['low', 'medium', 'high', 'low'];
const scores = object({ home: integer, away: integer });
const state = object({ outs: { type: 'integer', minimum: 0, maximum: 3 }, scores, bases: tuple({ type: 'boolean' }) });
const choice = object({ routeId: route, matchDecision: enumOf(commands), matchMomentId: text, label: text,
  objectiveText: text, risk: enumOf(['low', 'medium', 'high']), routeLabel: text });
const choices = { type: 'array', minItems: 4, maxItems: 4, items: choice };
const change = object({ runnerId: text, from: enumOf(['batter', 1, 2, 3]), to: enumOf(['out', 'home', 1, 2, 3]) });
const identity = { presentationId: text, matchId: text, momentId: text };
const common = { ...identity, inning: { type: 'integer', minimum: 1 }, half: enumOf(['top', 'bottom']), presentationSequence: integer };
const oldObservations = { oneOf: [nullOnly, object({ directionText: nullableText, paceText: nullOnly,
  runnerCue: nullableText, readCue: nullableText }, [])] };
const sourceDecisionSchema = object({ schemaVersion: { const: V01 }, ...common, kind: { const: 'decision' },
  player: object({ id: text, position: { const: 'SS' } }), state, situationText: text, observations: oldObservations, choices },
  ['schemaVersion', ...Object.keys(common), 'kind', 'player', 'state', 'situationText', 'choices']);
const resultCodes = enumOf(['oneOut', 'twoOuts', 'zeroOuts', 'error']);
const sourceResolutionProperties = { schemaVersion: { const: V01 }, ...common, kind: { const: 'resolution' },
  status: { const: 'settled' }, selectedRouteId: route, actualRouteId: route, resultCode: resultCodes,
  batterResult: text, state, runnerChanges: array(change), outcomeText: text, feedbackText: nullableText };
const sourceResolutionSchema = object(sourceResolutionProperties, Object.keys(sourceResolutionProperties).filter(k => k !== 'feedbackText'));
const observations = object({ ballDirectionText: nullableText, ballTerritoryText: nullOnly, ballPaceCueText: nullOnly,
  runnerMovementText: nullableText, pressureText: nullableText, firstBasePressureText: nullOnly, secondBasePressureText: nullOnly });
const decisionSchema = object({ schemaVersion: { const: VERSION }, ...common, kind: { const: 'decision' },
  player: object({ id: text, position: { const: 'SS' }, responsibilityText: nullOnly }), state, situationText: text, observations, choices });
const objective = object({ routeId: route, matchDecision: enumOf(commands), routeLabel: text, objectiveText: text, risk: enumOf(['low', 'medium', 'high']) });
const stateChange = object({ before: state, after: state, outsDelta: { type: 'integer', minimum: 0, maximum: 3 }, scoreDelta: scores });
const achievedOutcome = object({ resultCode: resultCodes, batterResult: text, outRunnerIds: array(text),
  advancedRunnerIds: array(text), scoringRunnerIds: array(text) });
const resolutionProperties = { ...sourceResolutionProperties, schemaVersion: { const: VERSION }, selectedObjective: objective,
  stateChange, achievedOutcome, verifiedTradeoffText: nullableText, decisionFeedbackText: nullOnly, executionFeedbackText: nullOnly };
const resolutionSchema = object(resolutionProperties, Object.keys(resolutionProperties).filter(k => !['decisionFeedbackText', 'executionFeedbackText'].includes(k)));

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze); Object.freeze(value);
  }
  return value;
}
const SCHEMA = deepFreeze({ $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'SS Decision / Resolution Public Presentation Candidate Foundation v0.2',
  oneOf: [{ $ref: '#/$defs/DecisionView' }, { $ref: '#/$defs/ResolutionView' }],
  $defs: { DecisionView: decisionSchema, ResolutionView: resolutionSchema } });

// Check descriptors before touching values: accessors, callbacks, custom prototypes,
// cycles, sparse arrays and symbol/non-JSON properties cannot enter the projection.
function plainJSON(value, path = '$', seen = new Set(), depth = 0, budget = { count: 0 }) {
  need(depth <= 24 && ++budget.count <= 5000, 'DataLimit', path);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { need(Number.isFinite(value), 'NonJSON', path); return; }
  need(typeof value === 'object', 'NonJSON', path);
  need(!seen.has(value), 'Cycle', path); seen.add(value);
  need(Object.getPrototypeOf(value) === (Array.isArray(value) ? Array.prototype : Object.prototype), 'Prototype', path);
  need(Object.getOwnPropertySymbols(value).length === 0, 'NonJSON', path);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) {
    need(value.length <= 100, 'DataLimit', path);
    need(Object.keys(descriptors).length === value.length + 1, 'SparseOrExtraArrayProperty', path);
  }
  for (const [key, d] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === 'length') continue;
    need(Object.hasOwn(d, 'value') && d.enumerable, 'AccessorOrHiddenProperty', `${path}.${key}`);
    plainJSON(d.value, `${path}.${key}`, seen, depth + 1, budget);
  }
  seen.delete(value);
}
function shape(value, schema, path = '$') {
  if (schema.oneOf) {
    let matched = 0;
    for (const candidate of schema.oneOf) {
      try { shape(value, candidate, path); matched++; } catch (e) { if (!(e instanceof ContractError)) throw e; }
    }
    need(matched === 1, 'SchemaOneOf', path); return;
  }
  if (Object.hasOwn(schema, 'const')) need(value === schema.const, 'SchemaConst', path);
  if (schema.enum) need(schema.enum.includes(value), 'SchemaEnum', path);
  if (schema.type === 'null') need(value === null, 'SchemaType', path);
  if (schema.type === 'string') need(typeof value === 'string' && value.trim().length >= schema.minLength && value.length <= schema.maxLength, 'SchemaText', path);
  if (schema.type === 'boolean') need(typeof value === 'boolean', 'SchemaType', path);
  if (schema.type === 'integer') need(Number.isSafeInteger(value) && value >= (schema.minimum ?? -Infinity) && value <= (schema.maximum ?? Infinity), 'SchemaInteger', path);
  if (schema.type === 'array') {
    need(Array.isArray(value) && value.length >= (schema.minItems ?? 0) && value.length <= (schema.maxItems ?? Infinity), 'SchemaArray', path);
    value.forEach((v, i) => shape(v, schema.items, `${path}[${i}]`));
  }
  if (schema.type === 'object') {
    need(value !== null && typeof value === 'object' && !Array.isArray(value), 'SchemaObject', path);
    for (const key of schema.required) need(Object.hasOwn(value, key), 'MissingField', `${path}.${key}`);
    for (const key of Object.keys(value)) {
      need(Object.hasOwn(schema.properties, key), 'UnknownField', `${path}.${key}`);
      shape(value[key], schema.properties[key], `${path}.${key}`);
    }
  }
}
function checked(value, schema) { plainJSON(value); shape(value, schema); }
const copy = value => JSON.parse(JSON.stringify(value));
function equal(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
  return ak.length === bk.length && ak.every((k, i) => k === bk[i] && equal(a[k], b[k]));
}
function identityMatches(a, b) {
  for (const key of Object.keys(identity)) need(a[key] === b[key], 'IdentityMismatch', key);
}
function legalChoices(list, momentId) {
  need(list.length === 4 && new Set(list.map(c => c.routeId)).size === 4, 'LegalChoices');
  for (const c of list) {
    const i = routes.indexOf(c.routeId);
    need(i >= 0 && c.matchDecision === commands[i] && c.routeLabel === routeLabels[i] && c.risk === risks[i], 'ChoiceMapping');
    need(c.matchMomentId === momentId, 'ChoiceIdentity');
  }
}
function validateSchema(view) {
  plainJSON(view);
  need(view && ['decision', 'resolution'].includes(view.kind), 'UnsupportedKind');
  shape(view, view.kind === 'decision' ? decisionSchema : resolutionSchema);
  if (view.kind === 'decision') legalChoices(view.choices, view.momentId);
  return true;
}
const issuedDecisions = new WeakSet(), issuedResolutions = new WeakMap();
const decisionGateSchema = object({ ...identity, phase: { const: 'decision' }, admitted: { const: true }, lifecycleState: { const: 'presented' } });

function decisionProjection(source, confirmation) {
  checked(source, sourceDecisionSchema); checked(confirmation, decisionGateSchema);
  identityMatches(source, confirmation); legalChoices(source.choices, source.momentId);
  const o = source.observations;
  return { schemaVersion: VERSION, presentationId: source.presentationId, matchId: source.matchId, momentId: source.momentId,
    inning: source.inning, half: source.half, presentationSequence: source.presentationSequence, kind: 'decision',
    player: { id: source.player.id, position: source.player.position, responsibilityText: null }, state: copy(source.state),
    situationText: source.situationText, observations: { ballDirectionText: o?.directionText ?? null,
      ballTerritoryText: null, ballPaceCueText: null, runnerMovementText: o?.runnerCue ?? null,
      pressureText: o?.readCue ?? null, firstBasePressureText: null, secondBasePressureText: null }, choices: copy(source.choices) };
}
function createDecisionView(source, confirmation) {
  const result = decisionProjection(source, confirmation); validateSchema(result);
  deepFreeze(result); issuedDecisions.add(result); return result;
}
function validateDecisionView(view, source, confirmation) {
  validateSchema(view); need(view.kind === 'decision' && equal(view, decisionProjection(source, confirmation)), 'SourceMismatch'); return true;
}

function validateRoutePair(pair, decision) {
  checked(pair, object({ selectedRouteId: route, actualRouteId: route })); validateSchema(decision);
  need(decision.kind === 'decision', 'ExpectedDecision');
  need(decision.choices.some(c => c.routeId === pair.selectedRouteId) && decision.choices.some(c => c.routeId === pair.actualRouteId), 'IllegalRoute');
  // Deliberately no selected === actual constraint. This helper creates no outcome.
  return true;
}
const runners = tuple({ oneOf: [text, nullOnly] });
const resultGateSchema = object({ ...identity, phase: { const: 'resolution' }, status: { const: 'settled' },
  settlementApplied: { const: true }, completedMomentId: text, selectedRouteId: route, actualRouteId: route,
  beforeState: state, afterState: state, beforeRunners: runners, afterRunners: runners,
  batterRunnerId: text, outsCreated: { type: 'integer', minimum: 0, maximum: 3 }, scoringRunnerIds: array(text) });

function movementFacts(decision, source, confirmation) {
  const before = confirmation.beforeRunners, after = confirmation.afterRunners, batter = confirmation.batterRunnerId;
  need(new Set(before.filter(Boolean)).size === before.filter(Boolean).length && new Set(after.filter(Boolean)).size === after.filter(Boolean).length, 'DuplicateRunner');
  need(!before.includes(batter), 'BatterAlreadyOnBase');
  need(equal(before.map(Boolean), decision.state.bases) && equal(after.map(Boolean), source.state.bases), 'OccupancyMismatch');
  const known = new Set([...before.filter(Boolean), batter]), changes = source.runnerChanges;
  need(after.filter(Boolean).every(id => known.has(id)), 'UnknownAfterRunner');
  need(new Set(changes.map(c => c.runnerId)).size === changes.length, 'DuplicateChange');
  for (const c of changes) {
    need(known.has(c.runnerId), 'UnknownRunner');
    need(c.from === 'batter' ? c.runnerId === batter : before[c.from - 1] === c.runnerId, 'RunnerOrigin');
    need(c.from !== c.to, 'NoMovement');
    need(typeof c.to === 'number' ? after[c.to - 1] === c.runnerId : !after.includes(c.runnerId), 'RunnerDestination');
  }
  for (const id of known) {
    const from = id === batter ? 'batter' : before.indexOf(id) + 1;
    const to = after.indexOf(id) + 1;
    if (to === 0 || from !== to) need(changes.some(c => c.runnerId === id), 'MissingRunnerChange');
  }
  const outRunnerIds = changes.filter(c => c.to === 'out').map(c => c.runnerId);
  const scoringRunnerIds = changes.filter(c => c.to === 'home').map(c => c.runnerId);
  const advancedRunnerIds = changes.filter(c => typeof c.from === 'number' && typeof c.to === 'number' && c.to > c.from).map(c => c.runnerId);
  const outsDelta = source.state.outs - decision.state.outs;
  const scoreDelta = { home: source.state.scores.home - decision.state.scores.home, away: source.state.scores.away - decision.state.scores.away };
  need(outsDelta >= 0 && outsDelta === confirmation.outsCreated && outsDelta === outRunnerIds.length, 'OutsMismatch');
  need(scoreDelta.home >= 0 && scoreDelta.away >= 0 && scoreDelta.home + scoreDelta.away === scoringRunnerIds.length, 'ScoreMismatch');
  need(equal([...scoringRunnerIds].sort(), [...confirmation.scoringRunnerIds].sort()), 'ScoringRunnerMismatch');
  need(new Set(confirmation.scoringRunnerIds).size === confirmation.scoringRunnerIds.length, 'DuplicateScorer');
  need((source.batterResult === 'out') === outRunnerIds.includes(batter), 'BatterResultMismatch');
  if (source.resultCode === 'oneOut') need(outsDelta === 1, 'ResultCodeMismatch');
  if (source.resultCode === 'twoOuts') need(outsDelta === 2, 'ResultCodeMismatch');
  if (source.resultCode === 'zeroOuts') need(outsDelta === 0, 'ResultCodeMismatch');
  return { outsDelta, scoreDelta, outRunnerIds, scoringRunnerIds, advancedRunnerIds };
}
function verifiedTradeoff(decision, source, selected, confirmation, facts) {
  const runner = confirmation.beforeRunners[0];
  const exact = selected.routeId === 'secureFirstBaseOut' && source.actualRouteId === 'secureFirstBaseOut'
    && source.resultCode === 'oneOut' && source.batterResult === 'out'
    && decision.state.outs === 1 && source.state.outs === 2
    && equal(decision.state.bases, [true, false, false]) && equal(source.state.bases, [false, true, false])
    && facts.scoreDelta.home === 0 && facts.scoreDelta.away === 0
    && facts.outRunnerIds.includes(confirmation.batterRunnerId) && facts.advancedRunnerIds.includes(runner)
    && source.runnerChanges.some(c => c.runnerId === runner && c.from === 1 && c.to === 2);
  return exact ? `${selected.objectiveText}；實際完成打者出局，原一壘跑者推進二壘。` : null;
}
function resolutionProjection(decision, source, confirmation) {
  need(issuedDecisions.has(decision), 'UnissuedDecision');
  checked(source, sourceResolutionSchema); checked(confirmation, resultGateSchema);
  identityMatches(decision, source); identityMatches(source, confirmation);
  need(source.momentId === confirmation.completedMomentId, 'CompletedMomentMismatch');
  need(source.inning === decision.inning && source.half === decision.half, 'UnsupportedHalfTransition');
  need(source.presentationSequence > decision.presentationSequence, 'SequenceMismatch');
  need(equal(confirmation.beforeState, decision.state) && equal(confirmation.afterState, source.state), 'SnapshotMismatch');
  validateRoutePair({ selectedRouteId: source.selectedRouteId, actualRouteId: source.actualRouteId }, decision);
  need(source.selectedRouteId === confirmation.selectedRouteId && source.actualRouteId === confirmation.actualRouteId, 'RouteProvenanceMismatch');
  need(source.actualRouteId === 'secureFirstBaseOut', 'UnsupportedRoute');
  const selected = decision.choices.find(c => c.routeId === source.selectedRouteId);
  const facts = movementFacts(decision, source, confirmation);
  const result = { schemaVersion: VERSION, presentationId: source.presentationId, matchId: source.matchId, momentId: source.momentId,
    inning: source.inning, half: source.half, presentationSequence: source.presentationSequence, kind: 'resolution', status: 'settled',
    selectedRouteId: source.selectedRouteId, actualRouteId: source.actualRouteId, resultCode: source.resultCode, batterResult: source.batterResult,
    state: copy(source.state), runnerChanges: copy(source.runnerChanges), outcomeText: source.outcomeText, feedbackText: source.feedbackText ?? null,
    selectedObjective: { routeId: selected.routeId, matchDecision: selected.matchDecision, routeLabel: selected.routeLabel,
      objectiveText: selected.objectiveText, risk: selected.risk },
    stateChange: { before: copy(decision.state), after: copy(source.state), outsDelta: facts.outsDelta, scoreDelta: facts.scoreDelta },
    achievedOutcome: { resultCode: source.resultCode, batterResult: source.batterResult,
      outRunnerIds: facts.outRunnerIds, advancedRunnerIds: facts.advancedRunnerIds, scoringRunnerIds: facts.scoringRunnerIds },
    verifiedTradeoffText: verifiedTradeoff(decision, source, selected, confirmation, facts), decisionFeedbackText: null, executionFeedbackText: null };
  validateSchema(result); return result;
}
function createResolutionView(decision, source, confirmation) {
  const result = deepFreeze(resolutionProjection(decision, source, confirmation)); issuedResolutions.set(result, decision); return result;
}
function validateResolutionView(view, decision, source, confirmation) {
  validateSchema(view); const expected = resolutionProjection(decision, source, confirmation);
  // Optional feedback keys may be omitted; any present value must still be null.
  const normalized = { ...view, decisionFeedbackText: view.decisionFeedbackText ?? null, executionFeedbackText: view.executionFeedbackText ?? null };
  need(view.kind === 'resolution' && equal(normalized, expected), 'SourceMismatch'); return true;
}
function createReplayCache(decision, resolution) {
  need(issuedDecisions.has(decision) && issuedResolutions.get(resolution) === decision, 'UnissuedPair');
  return Object.freeze({ decision, resolution, replay: () => resolution });
}

module.exports = Object.freeze({ VERSION, SCHEMA, ContractError, validateSchema, createDecisionView, validateDecisionView,
  validateRoutePair, createResolutionView, validateResolutionView, createReplayCache });
