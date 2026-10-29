"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const env=require('../health-opportunity-candidate-v1/environment.json'),file=path.join(env.candidate,'script.js');let s=fs.readFileSync(file,'utf8');
function replace(a,b){assert.equal(s.split(a).length,2,'Unique anchor '+a.slice(0,90));s=s.replace(a,b);}
replace('function confirmHighSchoolYearOneFollowupOpportunity() {',`function syncHighSchoolYearOneLockedOpportunityText(match) {
  const locked = match?.gameExposureState?.opportunitySnapshot;
  if (match?.id === "hs-y1-followup-evaluation-2" && locked?.matchId === match.id && locked.plannedUsage) {
    player.highSchoolRoleContext.opportunity = getHighSchoolPlayingTimeAssignmentText(locked);
  }
}

function confirmHighSchoolYearOneFollowupOpportunity() {`);
replace('  if (!existing || existing.matchId !== "hs-y1-followup-evaluation-2" || Number(existing.opportunityIndex) !== 2) return null;',`  if (!existing) return null;
  // Preserve the original entry guard, including its error, inside the transition.
  if (existing.matchId !== "hs-y1-followup-evaluation-2" || Number(existing.opportunityIndex) !== 2) return prepareHighSchoolFollowupEvaluationMatch();`);
replace('  if (player.highSchoolMatch?.id === existing.matchId) return player.highSchoolMatch;\n  player.highSchoolNextOpportunity = cloneSchoolInvitationValue(refreshHighSchoolYearOneOpportunityHealth(existing));',`  if (player.highSchoolMatch?.id === existing.matchId) {
    syncHighSchoolYearOneLockedOpportunityText(player.highSchoolMatch);
    return player.highSchoolMatch;
  }
  player.highSchoolNextOpportunity = cloneSchoolInvitationValue(refreshHighSchoolYearOneOpportunityHealth(existing));`);
replace('  player.highSchoolRoleContext.opportunity = getHighSchoolPlayingTimeAssignmentText(match.gameExposureState.opportunitySnapshot);','  syncHighSchoolYearOneLockedOpportunityText(match);');
replace('  const formation = player.highSchoolCoachEvaluation || {};\n  const role = player.highSchoolRoleContext || {};',`  const formation = player.highSchoolCoachEvaluation || {};
  // Older confirmed Saves may carry a stale preview string. This year-end writer
  // reads the already-locked match; display getters never repair Player state.
  syncHighSchoolYearOneLockedOpportunityText(player.highSchoolMatch);
  const role = player.highSchoolRoleContext || {};`);
fs.writeFileSync(file,s);console.log('Synchronized confirmed assignment and legacy year-end writer; preserved original invalid-opportunity guard.');
