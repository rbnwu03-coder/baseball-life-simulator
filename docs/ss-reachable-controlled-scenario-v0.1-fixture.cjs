"use strict";
const assert=require('node:assert/strict');
const C=require('./ss-reachable-controlled-scenario-v0.1-capture.cjs');
const H=require('../tests/helpers/canonical-match-contract-context.cjs');
const keys=Object.freeze(['catching','reaction','range','throwing','armStrength']);
function prepare(){
 C.integrity();const prior='docs/ss-reach-access-rejection-proof-v0.1-fixture-input-evidence.json',input=C.json(prior),fixture=JSON.parse(JSON.stringify(input.fixture));
 C.capture('ability-spec',{source:'tests/high-school-career-test-context.js careerFixture raw baseballSkills=12, as used by SS integration; use defensive subset only',fields:keys,value:12,forbidden:'No active Match, roster or defender override; do not copy SS per-play capability10 overrides',onlyNewControl:'five defensive raw skill fields in a complete fixture input',fixedBeforeNormalization:true,gameplayExecutions:0});
 for(const key of keys)fixture.baseballSkills[key]=12;
 for(const key of Object.keys(fixture))if(key!=='baseballSkills')assert.deepEqual(fixture[key],input.fixture[key]);
 for(const key of Object.keys(fixture.baseballSkills))if(!keys.includes(key))assert.equal(fixture.baseballSkills[key],input.fixture.baseballSkills[key]);
 assert.equal(fixture.highSchoolMatch.id,'');assert.equal(fixture.highSchoolMatch.simulationLog.length,0);assert.deepEqual(fixture.highSchoolMatch.rosters,{home:null,away:null});
 const h=H.createContext();h.context.inputJSON=JSON.stringify(fixture);
 h.run(`globalThis.preInput=JSON.parse(inputJSON);player=normalizeSave(JSON.parse(inputJSON));globalThis.preNormalize=JSON.parse(JSON.stringify(player));globalThis.preValidation=validateHighSchoolEntryCapability(player);globalThis.preSettlement=settleHighSchoolEntryCapability(player,{originType:'test-fixture'});globalThis.preAdmission=assertHighSchoolMatchCapabilityAdmission(player);globalThis.preDefense=getDefensiveSimulationCapability(player,'游擊手');globalThis.preOffense=getOffensiveSimulationCapability(player);`);
 const normalized=h.json('preNormalize'),evidence=h.json('({validation:preValidation,settlement:preSettlement,admission:preAdmission,defense:preDefense,offense:preOffense,invitation:validateSchoolInvitationSet(player.schoolInvitationState),schoolId:player.schoolInvitationState.selectedSchoolId,matchId:player.highSchoolMatch.id,log:player.highSchoolMatch.simulationLog,rosters:player.highSchoolMatch.rosters})');
 const accepted=evidence.validation.ok&&evidence.settlement.ok&&evidence.admission&&evidence.invitation.ok&&evidence.schoolId===input.fixture.schoolInvitationState.selectedSchoolId;
 C.capture('fixture-compatibility',{accepted,before:input.fixture,completeInput:fixture,afterNormalize:normalized,ownerEvidence:evidence,fields:keys,differences:keys.map(key=>({field:'baseballSkills.'+key,before:input.fixture.baseballSkills[key],input:12,normalized:normalized.baseballSkills[key]})),origin:'Explicit complete test fixture, not natural development or reconstructed training history. Existing genesis/settlement metadata retained; validator checks current values, not historical ledger equivalence.',schoolYearContext:'Existing selected-school context is input; active Match rosters are null. Formal prepare will re-inject/re-project the player using current capability owner; no finalized arrays are installed by this utility.',gameplayExecutions:0,matchesPrepared:0,recursiveWhitelist:C.prefix+'recursive-read-whitelist-evidence.json'});
 if(!accepted){console.log(JSON.stringify({fixtureCompatibility:'GAP',gameplay:0}));return false;}
 assert.deepEqual(normalized.baseballSkills,fixture.baseballSkills);assert.equal(evidence.matchId,'');assert.equal(evidence.log.length,0);assert.deepEqual(evidence.rosters,{home:null,away:null});
 C.capture('fixture-input',{fixture,actualSeed:input.actualSeed,lineage:{file:prior,sha256:C.fileHash(prior)},abilityConfiguration:keys,onlyFiveRawSkillFieldsChanged:true,ownerValidated:true});
 console.log(JSON.stringify({fixtureCompatibility:'ACCEPTED',defense:evidence.defense,mobility:evidence.offense.speed,seed:input.actualSeed,gameplay:0}));return true;
}
module.exports={keys,prepare};if(require.main===module)prepare();
