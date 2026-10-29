"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const env=require('../health-opportunity-candidate-v1/environment.json'),file=path.join(env.candidate,'script.js');
let source=fs.readFileSync(file,'utf8');assert.equal(crypto.createHash('sha256').update(source).digest('hex'),require('./preservation-before.json').candidateScript);
function replace(a,b){assert.equal(source.split(a).length,2,'Unique anchor '+a.slice(0,90));source=source.replace(a,b);}
replace('// Health is the only live input at the Y1 roster-confirmation boundary.',`// A legacy opportunity may be playable without carrying enough evidence to refresh.
// Validate/replay only its own frozen inputs; never reconstruct history from Player.
function getHighSchoolYearOneOpportunityHealthRefreshInput(existing) {
  const object = value => value && typeof value === "object" && !Array.isArray(value);
  const text = value => typeof value === "string" && value.trim().length > 0;
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const readiness = existing?.readinessSnapshot;
  const breakdown = existing?.debug?.scoreBreakdown;
  if (!object(existing) || existing.version !== PlayingTimeGameExposure.OPPORTUNITY_VERSION
    || ![existing.matchId, existing.decisionId, existing.playerId, existing.opportunitySeed].every(text)
    || !object(existing.debug) || !object(breakdown)
    || !object(readiness) || readiness.version !== PlayingTimeGameExposure.READINESS_VERSION
    || readiness.playerId !== existing.playerId || ![readiness.position, readiness.requestedPosition].every(text)
    || !["positionReadiness", "positionFit", "experienceReadiness"].every(key => finite(readiness[key]) && readiness[key] >= 0 && readiness[key] <= 10)
    || !["positionLegal", "pitcherExposureDeferred", "positionFallbackApplied"].every(key => typeof readiness[key] === "boolean")
    || !object(existing.gameContext)
    || !["gameType", "expectedGameImportance", "importance", "leverage"].every(key => text(existing.gameContext[key]))
    || !["inning", "scoreMargin"].every(key => finite(existing.gameContext[key]))
    || !Object.hasOwn(existing, "previousActualExposure")
    || !finite(existing.evaluationTrend)
    || existing.debug.opportunityHash !== PlayingTimeGameExposure.stableHash(existing.opportunitySeed)) return null;
  const previous = existing.previousActualExposure;
  if (previous !== null && (!object(previous) || !text(previous.appearanceType)
    || !["plateAppearances", "defensiveInnings"].every(key => finite(previous[key]) && previous[key] >= 0))) return null;
  const input = {
    matchId: existing.matchId, readinessSnapshot: readiness, actualRole: existing.actualRole,
    projectedRole: existing.projectedRolePrior, playingTimeEnvironment: existing.playingTimeEnvironment,
    competitionDepth: existing.competitionDepth, positionNeed: existing.positionNeed,
    coachUsageStyle: existing.coachUsageStyle,
    evaluationTrend: Object.hasOwn(breakdown, "evaluationTrend") ? existing.evaluationTrend : undefined,
    previousActualExposure: previous, stableVariationSeed: existing.opportunitySeed,
    directStartForced: existing.exposureSource === "direct-start-forced", gameContext: existing.gameContext
  };
  const same = (left, right) => {
    if (left === right) return true;
    if (!left || !right || typeof left !== "object" || typeof right !== "object"
      || Array.isArray(left) !== Array.isArray(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && same(left[key], right[key]));
  };
  // This pre-health replay must reproduce identity, variation, inputs and usage.
  // Incomplete/inconsistent legacy evidence opts out; resolver errors still surface.
  const replayed = PlayingTimeGameExposure.resolveStartingOpportunity(input);
  return Object.keys(replayed).every(key => key === "opportunitySeed" || same(replayed[key], existing[key])) ? input : null;
}

// Health is the only live input at the Y1 roster-confirmation boundary.`);
const start=source.indexOf('  if (!existing) return existing;',source.indexOf('function refreshHighSchoolYearOneOpportunityHealth'));
const end=source.indexOf('  return Object.freeze(',start);
assert(start>0&&end>start);
source=source.slice(0,start)+`  const input = getHighSchoolYearOneOpportunityHealthRefreshInput(existing);
  if (!input) return existing;
  const refreshed = PlayingTimeGameExposure.resolveStartingOpportunity({ ...input, health: player.body });
`+source.slice(end);
replace('  return prepareHighSchoolFollowupEvaluationMatch();\n}\n\nfunction isCanonicalHighSchoolYearThreeRoute()',`  const match = prepareHighSchoolFollowupEvaluationMatch();
  player.highSchoolRoleContext.opportunity = getHighSchoolPlayingTimeAssignmentText(match.gameExposureState.opportunitySnapshot);
  return match;
}

function isCanonicalHighSchoolYearThreeRoute()`);
replace(`    player.highSchoolStep += 1;
    // The call-home choice is complete. Lock N+1 before rendering its match event.
    if (completedEventId === "high_school_call_home") confirmHighSchoolYearOneFollowupOpportunity();`, `    if (completedEventId === "high_school_call_home") {
      // Match/schedule owners may reject. Roll back this transition and rethrow;
      // do not leave a new step/opportunity without its prepared match.
      const beforeConfirmation = cloneSchoolInvitationValue(player);
      try {
        player.highSchoolStep += 1;
        confirmHighSchoolYearOneFollowupOpportunity();
      } catch (error) {
        player = beforeConfirmation;
        isTransitioning = false;
        setChoiceTransitionState(false);
        throw error;
      }
    } else player.highSchoolStep += 1;`);
fs.writeFileSync(file,source);console.log({candidate:env.candidate,modified:'script.js'});
