"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const env=JSON.parse(fs.readFileSync(process.env.HEALTH_OPPORTUNITY_ENV||path.join(__dirname,'environment.json'))),file=path.join(env.candidate,'script.js');
const current=fs.readFileSync(file,'utf8');
let source=cp.execFileSync('git',['-c','safe.directory='+env.candidate,'show',env.base+':script.js'],{cwd:env.candidate,encoding:'utf8',maxBuffer:8e6});
if(process.argv[2]!=='--verify')assert.equal(current,source);
function replace(old,value){assert.equal(source.split(old).length,2,'Unique anchor: '+old.slice(0,80));source=source.replace(old,value);}
replace('function isCanonicalHighSchoolYearThreeRoute() {',`// Health is the only live input at the Y1 roster-confirmation boundary.
// Reuse the original resolver inputs and hash so availability cannot reroll identity.
function refreshHighSchoolYearOneOpportunityHealth(existing) {
  if (!existing) return existing;
  const refreshed = PlayingTimeGameExposure.resolveStartingOpportunity({
    matchId: existing.matchId,
    readinessSnapshot: existing.readinessSnapshot,
    actualRole: existing.actualRole,
    projectedRole: existing.projectedRolePrior,
    playingTimeEnvironment: existing.playingTimeEnvironment,
    competitionDepth: existing.competitionDepth,
    positionNeed: existing.positionNeed,
    coachUsageStyle: existing.coachUsageStyle,
    evaluationTrend: Object.hasOwn(existing.debug.scoreBreakdown, "evaluationTrend") ? existing.evaluationTrend : undefined,
    previousActualExposure: existing.previousActualExposure,
    health: player.body,
    stableVariationSeed: existing.opportunitySeed,
    directStartForced: existing.exposureSource === "direct-start-forced",
    gameContext: existing.gameContext
  });
  return Object.freeze({ ...existing, ...cloneSchoolInvitationValue(refreshed),
    decisionId: existing.decisionId, opportunitySeed: existing.opportunitySeed });
}

function confirmHighSchoolYearOneFollowupOpportunity() {
  const existing = player.highSchoolNextOpportunity;
  if (!existing || existing.matchId !== "hs-y1-followup-evaluation-2" || Number(existing.opportunityIndex) !== 2) return null;
  // The existing match lifecycle is the saved lock; never refresh a prepared match.
  if (player.highSchoolMatch?.id === existing.matchId) return player.highSchoolMatch;
  player.highSchoolNextOpportunity = cloneSchoolInvitationValue(refreshHighSchoolYearOneOpportunityHealth(existing));
  return prepareHighSchoolFollowupEvaluationMatch();
}

function isCanonicalHighSchoolYearThreeRoute() {`);
replace('  const opportunityDecision = suppliedOpportunity || createHighSchoolPlayingTimeOpportunity({','  const provisionalOpportunity = suppliedOpportunity || createHighSchoolPlayingTimeOpportunity({');
replace('  if ((suppliedOpportunity || opportunityIndex > 1) && (!opportunityDecision || opportunityDecision.matchId !== targetMatchId)) {',`  // Explicit choice transition only; display/legacy prepare calls do not refresh.
  const opportunityDecision = options.confirmHealthReadiness === true && highSchoolYear === 1 && opportunityIndex === 1
    ? refreshHighSchoolYearOneOpportunityHealth(provisionalOpportunity) : provisionalOpportunity;
  if ((suppliedOpportunity || opportunityIndex > 1) && (!opportunityDecision || opportunityDecision.matchId !== targetMatchId)) {`);
replace('  if (eventId === "high_school_long_bench") {\n    const match = prepareHighSchoolYearOneMatch();', '  if (eventId === "high_school_long_bench") {\n    const match = prepareHighSchoolYearOneMatch({ confirmHealthReadiness: true });');
replace('  if (player.chapter === "青棒") {\n    player.highSchoolStep += 1;',`  if (player.chapter === "青棒") {
    player.highSchoolStep += 1;
    // The call-home choice is complete. Lock N+1 before rendering its match event.
    if (completedEventId === "high_school_call_home") confirmHighSchoolYearOneFollowupOpportunity();
`.trimEnd());
if(process.argv[2]==='--verify')assert.equal(current,source,'Candidate must exactly reproduce from baseline');
else fs.writeFileSync(file,source);
console.log({candidate:env.candidate,mode:process.argv[2]==='--verify'?'exact-reproduction-verified':'patched',modified:'script.js'});
