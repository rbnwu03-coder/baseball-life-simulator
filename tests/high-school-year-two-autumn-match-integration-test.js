const assert = require("assert");
const fs = require("fs");
const path = require("path");
const PlayingTime = require("../playing-time-game-exposure.js");
const TeamRoster = require("../team-roster-foundation.js");
const TeamStrength = require("../team-strength-model.js");

let passed = 0;
function verify(name, condition) {
  assert.ok(condition, name);
  passed += 1;
  console.log(`✓ ${name}`);
}

const root = path.resolve(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const story = fs.readFileSync(path.join(root, "story.js"), "utf8");

verify("1. Production 建立獨立 Y2 Autumn Opportunity identity", script.includes('matchId: "hs-y2-autumn-evaluation-2"') && script.includes('opportunityPhase: "year-two-autumn-evaluation"'));
verify("2. Autumn Match 明確重用 Existing Match preparation", /function prepareHighSchoolYearTwoAutumnMatch[\s\S]*return prepareHighSchoolYearOneMatch/.test(script));
verify("3. Autumn routing 納入 formal Match event authority", /eventId === "high_school_year_two_autumn_stage"[\s\S]*hs-y2-autumn-evaluation-2/.test(script));
verify("4. Autumn Opportunity 在 team responsibility 後才生成", script.includes('completedEventId === "high_school_year_two_team_responsibility"') && script.includes("ensureHighSchoolYearTwoAutumnOpportunity()"));
verify("5. Canonical Autumn story choices 交由 Match decision producer", /high_school_year_two_autumn_stage:[\s\S]*isCanonicalHighSchoolYearTwoRoute[\s\S]*getHighSchoolYearOneMatchMomentChoices/.test(story));
verify("6. Canonical Summary 不再使用 legacy spring/autumn proof 作主要 truth", /function evaluateHighSchoolYearTwo[\s\S]*getHighSchoolYearTwoJourneySnapshot/.test(script) && !/function evaluateHighSchoolYearTwo[\s\S]*year_two_autumn_secure_out[\s\S]*player\.chapter = "青棒第二年小結"/.test(script));

const readiness = PlayingTime.createOpportunityReadinessSnapshot({
  subject: { name: "Autumn", age: 17, throws: "R", primaryPosition: "2B", secondaryPositions: [] },
  position: "2B", playerId: "autumn-player",
  capabilityProvider: () => ({ fielding: 7, reaction: 7, decision: 7 }),
  positionAssessmentProvider: () => ({ rating: 21 })
});
const opportunity = PlayingTime.resolveStartingOpportunity({
  matchId: "hs-y2-autumn-evaluation-2", actualRole: "rotation", readinessSnapshot: readiness,
  evaluationTrend: 2, previousActualExposure: { appearanceType: "pinchHit", plateAppearances: 1, defensiveInnings: 0 },
  coachTrust: 8, health: { fatigue: 2, pain: 0, injuryRisk: 1 },
  playingTimeEnvironment: "medium", competitionDepth: "high", positionNeed: "medium", coachUsageStyle: "development"
});
verify("7. Autumn Opportunity contract 保存 post-Spring 與 health/trust inputs", opportunity.matchId === "hs-y2-autumn-evaluation-2" && opportunity.evaluationTrend === 2 && opportunity.previousActualExposure.plateAppearances === 1 && Object.hasOwn(opportunity.debug.scoreBreakdown, "coachTrust") && Object.hasOwn(opportunity.debug.scoreBreakdown, "healthReadiness"));

const home = TeamRoster.generateTeamRoster({ teamId: "y2-home", schoolId: "y2-home", schoolStandard: "competitive", yearIdentity: "hs-year-2-age-17", seed: "selected-y2-roster" });
const away = TeamRoster.generateTeamRoster({ teamId: "hs-y2-autumn-regional-opponent", schoolId: "hs-y2-autumn-regional-opponent", schoolStandard: "competitive", yearIdentity: "hs-year-2-age-17", seed: "autumn-opponent" });
verify("8. Autumn canonical roster inputs 可由 TeamRoster 驗證", TeamRoster.validateRoster(home).ok && TeamRoster.validateRoster(away).ok);
verify("9. Autumn 雙方 Team Strength 均由 roster 推導", TeamStrength.deriveTeamStrengthProfile(home).overallSummary > 0 && TeamStrength.deriveTeamStrengthProfile(away).overallSummary > 0);
verify("10. Autumn opponent identity 與 Spring identity 可明確分離", away.schoolId === "hs-y2-autumn-regional-opponent" && away.schoolId !== "hs-y2-spring-regional-opponent");

console.log(`High School Year Two Autumn Match Integration: ${passed}/${passed} passed.`);
