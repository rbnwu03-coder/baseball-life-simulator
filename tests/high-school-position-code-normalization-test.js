const assert = require("assert");
const PlayingTime = require("../playing-time-game-exposure.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const pairs = {
  P: "投手", C: "捕手", "1B": "一壘手", "2B": "二壘手", "3B": "三壘手", SS: "游擊手",
  LF: "外野手", CF: "外野手", RF: "外野手", OF: "外野手"
};
verify("1. Canonical roster codes 共用單一玩家守位 normalization", Object.entries(pairs).every(([code, label]) => PlayingTime.normalizeBaseballPosition(code) === label));
verify("2. 中文 compatibility positions 保持 canonical player-facing label", Object.values(pairs).every(label => PlayingTime.normalizeBaseballPosition(label) === label));

function opportunity(position, throws = "R") {
  const subject = { name: "Position Boundary", age: 17, throws, primaryPosition: position, secondaryPositions: [] };
  const readiness = PlayingTime.createOpportunityReadinessSnapshot({
    subject, position, playerId: `player-${position}`,
    capabilityProvider: () => ({ fielding: 9, reaction: 9, decision: 9 }),
    positionAssessmentProvider: () => ({ rating: 27 })
  });
  return PlayingTime.resolveStartingOpportunity({
    matchId: `position-${position}`, actualRole: "starter", readinessSnapshot: readiness,
    playingTimeEnvironment: "high", competitionDepth: "low", positionNeed: "high", coachUsageStyle: "development"
  });
}

const pitcherCode = opportunity("P");
const pitcherLabel = opportunity("投手");
verify("3. P 與投手都一致標記 pitcher deferred", pitcherCode.pitcherExposureDeferred && pitcherLabel.pitcherExposureDeferred);
verify("4. P 與投手都一致 fail closed 為 noAppearance", pitcherCode.plannedUsage.appearanceType === "noAppearance" && pitcherLabel.plannedUsage.appearanceType === "noAppearance");
verify("5. P route 不會因高能力被當成 generic starter", pitcherCode.debug.opportunityScore >= 55 && pitcherCode.plannedUsage.appearanceType !== "start");

const catcherCode = opportunity("C");
const catcherLabel = opportunity("捕手");
verify("6. C 與捕手都保留 Catcher gameplay admission", !catcherCode.pitcherExposureDeferred && !catcherLabel.pitcherExposureDeferred && catcherCode.assignedPosition === "捕手" && catcherLabel.assignedPosition === "捕手");
verify("7. 左投 C code 與中文捕手共用相同 legality fallback", opportunity("C", "L").assignedPosition === "一壘手" && opportunity("捕手", "L").assignedPosition === "一壘手");

console.log(`High School Position Code Normalization: ${passed}/${passed} passed.`);
