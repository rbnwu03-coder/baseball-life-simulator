"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const env=require('../health-opportunity-candidate-v1/environment.json'),file=path.join(env.candidate,'script.js'),original=fs.readFileSync(file,'utf8');assert.equal(crypto.createHash('sha256').update(original).digest('hex'),require('./preservation-before.json').candidateScript);
const start=original.indexOf('function choose(eventId, index) {'),end=original.indexOf('\nfunction enterChapterTwo()',start);assert(start>0&&end>start);let s=original.slice(start,end);
function replace(a,b){assert.equal(s.split(a).length,2,'Unique anchor '+a.slice(0,100));s=s.replace(a,b);}
replace('  isTransitioning = true;\n  setChoiceTransitionState(true);\n  const before = getPlayerSnapshot();',`  // Only this phone event retries the entire choice when N+1 confirmation fails.
  // Capture before effects; the inner transition rollback starts too late for that.
  const callHomeChoiceBefore = player.chapter === "青棒" && eventId === "high_school_call_home"
    ? cloneSchoolInvitationValue(player) : null;
  const callHomeRelationshipsBefore = callHomeChoiceBefore ? [
    typeof coach !== "undefined" ? [coach, "trust", coach.trust] : null,
    typeof teammates !== "undefined" && teammates[0] ? [teammates[0], "friendship", teammates[0].friendship] : null,
    typeof rival !== "undefined" ? [rival, "relationship", rival.relationship] : null
  ].filter(Boolean) : [];
  isTransitioning = true;
  setChoiceTransitionState(true);
  const before = getPlayerSnapshot();`);
replace('  if (choice.finishChapterOne) finishChapterOne();\n  else advanceAfterAction(decisionContext, eventId);',`  if (choice.finishChapterOne) finishChapterOne();
  else if (callHomeChoiceBefore) {
    try {
      advanceAfterAction(decisionContext, eventId);
    } catch (error) {
      player = callHomeChoiceBefore;
      callHomeRelationshipsBefore.forEach(([actor, key, value]) => { actor[key] = value; });
      isTransitioning = false;
      setChoiceTransitionState(false);
      throw error;
    }
  } else advanceAfterAction(decisionContext, eventId);`);
fs.writeFileSync(file,original.slice(0,start)+s+original.slice(end));console.log({candidate:env.candidate,modified:'script.js',scope:'pre-effects phone snapshot and N+1-failure restoration only'});
