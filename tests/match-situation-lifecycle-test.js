const assert = require("assert");
const Lifecycle = require("../match-situation-lifecycle.js");

let passed = 0;
function verify(name, condition) { assert.ok(condition, name); passed += 1; console.log(`✓ ${name}`); }

const routes = [
  { routeId: "preventRunHome", matchDecision: "home", text: "傳本壘" },
  { routeId: "initiate463", matchDecision: "challenge", text: "傳二壘" },
  { routeId: "secureFirstBaseOut", matchDecision: "secure", text: "傳一壘" }
];
const input = {
  gameId: "game-1", inning: 5, half: "上", paIdentity: "pa-18", simulationPoint: "opportunity-4",
  type: Lifecycle.TYPES.groundBallDefensiveDecision,
  actor: { id: "player", role: "primaryFielder", position: "二壘手" },
  sourceAuthority: "groundBallCanonicalTruth", sourcePhysicalStateRef: "ball-18",
  createdAt: { inning: 5, half: "上", outs: 1, score: { home: 1, away: 1 }, bases: ["r1", null, "r3"], paIdentity: "pa-18", simulationPoint: "opportunity-4" },
  contextSnapshot: { physicalIdentity: "ball-18", homeThreat: "advancing", presentationText: "三壘跑者已啟動。" },
  legalRoutes: routes, recommendation: { presentation: "先確認本壘窗口。" }
};

const created = Lifecycle.createSituation(input);
verify("1. stable identity 綁定 game／inning／half／PA／simulation point／type", created.situationId === Lifecycle.createSituationId(input) && created.situationId === Lifecycle.createSituationId(input));
verify("2. created snapshot 不包含整場 match，且 canonical context deep frozen", created.lifecycleState === "created" && created.contextSnapshot.physicalIdentity === "ball-18" && Object.isFrozen(created.contextSnapshot));
const admitted = Lifecycle.admitSituation(created, { supported: true, playerOwnsDecision: true });
const presented = Lifecycle.presentSituation(admitted);
verify("3. Fixture A 三條 distinct routes 准入 playerDecision 並進入 presented", admitted.admission.mode === "playerDecision" && admitted.admission.meaningfulRouteCount === 3 && presented.lifecycleState === "presented" && presented.decision === null);

const reloadedPresented = Lifecycle.normalizeSituation(JSON.parse(JSON.stringify(presented)));
verify("4. Fixture F decision 前 reload 保留 identity、routes、recommendation、phase", reloadedPresented.situationId === presented.situationId && JSON.stringify(reloadedPresented.legalRoutes) === JSON.stringify(presented.legalRoutes) && reloadedPresented.recommendation.presentation === presented.recommendation.presentation && reloadedPresented.phase === "initial" && reloadedPresented.decision === null);

const decided = Lifecycle.recordDecision(presented, { selectedRoute: "preventRunHome", decidedBy: "player" });
const executing = Lifecycle.beginExecution(decided, { handoffRef: "ground-18" });
const resolved = Lifecycle.resolveSituation(executing, { physicalOutcomeRef: "home-tag-18", outsDelta: 1, runnerActorOutcomes: [{ runnerId: "r3", result: "out" }] });
const settled = Lifecycle.markSettled(resolved, { identity: "settlement-18" });
const closed = Lifecycle.closeSituation(settled);
verify("5. Fixture B decision 只保存 route intent，不保存 safe/out", decided.decision.selectedRoute === "preventRunHome" && !Object.hasOwn(decided.decision, "result"));
verify("6. Home execution 依序完成 decided→executing→resolved→settled→closed", closed.transitionHistory.map(item => item.state).join("|") === "created|admitted|presented|decided|executing|resolved|settled|closed");
verify("7. close 後才允許 simulation resume", !Lifecycle.canResumeSimulation(executing) && Lifecycle.canResumeSimulation(closed));
verify("8. Settlement／Close 重複呼叫 idempotent", Lifecycle.markSettled(settled) === settled && Lifecycle.closeSituation(closed) === closed);

const secondBase = Lifecycle.beginExecution(Lifecycle.recordDecision(presented, { selectedRoute: "initiate463" }), { handoffRef: "ground-18" });
const reassessing = Lifecycle.beginReassessment(secondBase, {
  trigger: "firstLegCompleted", firstLegApplied: true,
  updatedPhysicalState: { firstLegState: { status: "completed", targetBase: "second" }, outsDelta: 1 },
  remainingLegalRoutes: [{ routeId: "secureFirstBaseOut" }], requiresDecision: false
});
verify("9. Fixture C 第一腿後維持同 situationId，以 reassessment phase 保存剩餘 route", reassessing.situationId === secondBase.situationId && reassessing.lifecycleState === "reassessing" && reassessing.phase === "reassessment" && reassessing.reassessmentState.firstLegApplied && reassessing.reassessmentState.remainingLegalRoutes[0].routeId === "secureFirstBaseOut");
const reloadReassessment = Lifecycle.normalizeSituation(JSON.parse(JSON.stringify(reassessing)));
verify("10. Fixture G reassessment reload 保留 first-leg guard 與 remaining route", reloadReassessment.reassessmentState.firstLegApplied && JSON.stringify(reloadReassessment.reassessmentState.remainingLegalRoutes) === JSON.stringify(reassessing.reassessmentState.remainingLegalRoutes));
const reassessedClosed = Lifecycle.closeSituation(Lifecycle.markSettled(Lifecycle.resolveSituation(reloadReassessment, { outsDelta: 1, reason: "automaticContinuationComplete" })));
verify("11. Reassessment 沒有 pending meaningful decision 時可解析與關閉", reassessedClosed.lifecycleState === "closed");

const expiredReassessment = Lifecycle.beginReassessment(secondBase, { trigger: "relayWindowExpired", firstLegApplied: true, remainingLegalRoutes: [], requiresDecision: false });
const expiredClosed = Lifecycle.closeSituation(Lifecycle.markSettled(Lifecycle.resolveSituation(expiredReassessment, { outsDelta: 1, reason: "noRemainingRoute" })));
verify("12. Fixture D relay window expired 不建立假選項，直接 resolve／settle／close", expiredReassessment.reassessmentState.remainingLegalRoutes.length === 0 && expiredClosed.lifecycleState === "closed");

const single = Lifecycle.admitSituation(Lifecycle.createSituation({ ...input, legalRoutes: [routes[2]], simulationPoint: "single-route" }), { supported: true, playerOwnsDecision: true });
verify("13. Fixture E 單一路線 admission 為 automaticResolution，不停在 player decision", single.admission.mode === "automaticResolution" && !single.admission.admittedToPlayer);

let illegalRejected = false;
try { Lifecycle.markSettled(presented); } catch (error) { illegalRejected = /illegal match situation transition/.test(error.message); }
verify("14. Transition guard 拒絕 presented→settled", illegalRejected);
verify("15. Closed summary 保存最小 previous-situation memory", Lifecycle.createClosedSituationSummary(closed).transitionHistory.at(-1).state === "closed" && Lifecycle.createClosedSituationSummary(closed).outsAfter === 2);

const automatic = Lifecycle.beginExecution(
  Lifecycle.admitSituation(Lifecycle.createSituation({ ...input, simulationPoint: "abandon" }), { supported: true, playerOwnsDecision: false }),
  { selectedRoute: "secureFirstBaseOut", handoffRef: "ground-abandon" }
);
const abandoned = Lifecycle.abandonSituation(automatic, { reason: "noRoutineResolution" });
verify("16. 尚無 physical consequence 的 execution 可由 lifecycle 正式 abandon", abandoned.lifecycleState === "closed" && abandoned.closeState.terminalMode === "abandoned" && abandoned.closeState.readyToResume);
verify("17. abandon 保存 terminal reason 與 transition history", abandoned.closeState.reason === "noRoutineResolution" && abandoned.transitionHistory.at(-1).reason === "noRoutineResolution" && Lifecycle.createClosedSituationSummary(abandoned).outcome === "noRoutineResolution");
verify("18. 重複 abandon 為 idempotent", Lifecycle.abandonSituation(abandoned) === abandoned);
for (const [label, state] of [["resolved", resolved], ["settled", settled], ["closed", closed]]) {
  let rejected = false;
  try { Lifecycle.abandonSituation(state); } catch (error) { rejected = /cannot be abandoned/.test(error.message); }
  verify(`19.${label} happy-path state 不可 abandon`, rejected);
}
const unknownConsequence = Object.freeze({ ...automatic, executionState: Object.freeze({ status: "inProgress" }) });
let conservativeGuard = false;
try { Lifecycle.abandonSituation(unknownConsequence); } catch (error) { conservativeGuard = /unknown/.test(error.message); }
verify("20. physical consequence 資料不足時採保守拒絕", conservativeGuard);
verify("21. runnerTagUpDecision 已是 canonical lifecycle type", Lifecycle.TYPES.runnerTagUpDecision === "runnerTagUpDecision");

console.log(`Match Situation Lifecycle tests: ${passed}/${passed} passed`);
