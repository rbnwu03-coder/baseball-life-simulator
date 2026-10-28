"use strict";
const assert=require('node:assert/strict'),H=require('./critical-regression-repair-b1-canonical-match-fixture-contract-harness.cjs');
const h=H.makeContext(),fixture=H.prepare(h);
const before=h.json('player');const beforeHash=H.hash(before);
const validation=h.json('({capability:validateHighSchoolEntryCapability(player),invitation:validateSchoolInvitationSet(player.schoolInvitationState),selectedSchool:getSelectedHighSchoolContext(player),age:player.age,chapter:player.chapter})');
const result=h.run('completeHighSchoolEntry({source:"b1-entry-boundary-validation"})');
assert.equal(validation.capability.ok,true);assert.equal(validation.invitation.ok,false);assert.equal(result,false);assert.equal(H.hash(h.json('player')),beforeHash);
console.log('B1_ENTRY_BOUNDARY='+JSON.stringify({classification:'CONFIRMED',inputFixtureSha256:fixture.beforePreparation&&H.hash(fixture.beforePreparation),beforeHash,afterHash:H.hash(h.json('player')),validation,completeEntryReturned:result,normalEntryNotCompleted:true,noNumericAbilityChange:true,noRosterOrMatchRewrite:true,developmentDirectStartNotExecuted:{reason:'applyHighSchoolDirectStartHistory calls applySyntheticYouthOrigin, which adds catching/throwing/reaction/baseballIQ and position experience. This is outside the unchanged-ability proof.'},hypothesisLimits:'This rejects this original-derived debug fixture; it is not an exhaustive claim that no other normal career can start legally.'}));
console.log('B1_ENTRY_BOUNDARY_SUMMARY='+JSON.stringify({capabilityValid:true,invitationValid:false,normalEntryAccepted:false,age:validation.age,originalPlayerPreserved:true}));
