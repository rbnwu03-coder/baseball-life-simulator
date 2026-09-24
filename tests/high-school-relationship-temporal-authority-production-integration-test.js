'use strict';
const assert=require('assert'),fs=require('fs'),cp=require('child_process');
const T=require('../high-school-relationship-temporal-authority'),N=require('../high-school-exchange-network');
const make=require('./high-school-opportunity-probability-calibration-career.cjs');
let passed=0;const test=(n,fn)=>{fn();passed++;console.log('PASS '+n);};
const settings={namespace:'temporal-authority',extended:true,validateEntry:true};
const plain=make(settings),observed=make(settings);
observed.env.run(`
 var temporalChecks={calls:0,sources:0,plans:0};
 var originalTemporalInput=getHighSchoolMatchOpportunityGenerationInput;
 getHighSchoolMatchOpportunityGenerationInput=function(options){
   const input=originalTemporalInput(options),before=JSON.stringify(input);
   const selectionBefore=JSON.stringify(HighSchoolOpportunitySelection.selectOpportunityCandidates(input));
   const friendly=HighSchoolFriendlyInvitationSource.deriveFriendlyInvitationSources(input);
   const camp=HighSchoolTrainingCampSource.deriveTrainingCampSources(input);
   for(const source of [...friendly.sources,...camp.sources]){
     const summary=HighSchoolRelationshipTemporalAuthority.buildRelationshipTemporalSummary(input.relationshipLedger,source,input.context);
     temporalChecks.sources++;if(summary.status==='PLAN_CURRENT_CONTEXT')temporalChecks.plans++;
   }
   if(JSON.stringify(input)!==before)throw Error('Temporal read mutated generation input');
   if(JSON.stringify(HighSchoolOpportunitySelection.selectOpportunityCandidates(input))!==selectionBefore)throw Error('Temporal read changed selection');
   temporalChecks.calls++;return input;
 };
`);
const baseline=[],actual=[],finals=[];
const facts='({ledger:player.highSchoolExchangeNetwork,schedule:player.highSchoolSchedule,competition:player.competitionFoundation,competitionEvidence:player.competitionEvidenceState,gameRecord:player.highSchoolMatch.gameRecord})';
for(let i=1;i<=4;i++){
 baseline.push(plain.runCareer(i));const before=plain.env.json(facts);
 actual.push(observed.runCareer(i));finals.push(observed.env.json(facts));assert.deepStrictEqual(finals.at(-1),before);
}
const all=finals.flatMap(x=>x.ledger.evidence);
test('browser script exports versioned API',()=>assert.strictEqual(observed.env.run('HighSchoolRelationshipTemporalAuthority.TEMPORAL_AUTHORITY_VERSION'),T.TEMPORAL_AUTHORITY_VERSION));
test('real Y1 exchange evidence',()=>assert(all.some(e=>e.evidenceType==='schoolExchangeMatch'&&e.careerYear===1)));
test('real coach connection is recordedAt, not inferred inception',()=>{const e=all.find(e=>e.evidenceType==='coachSchoolConnection');assert(e);assert.strictEqual(T.classifyRelationshipEvidenceLifetime(e).recordedAtMeaning,'RECORDED_CONTACT_NOT_INCEPTION_OR_LAST_CONTACT');});
test('Y1 evidence survives Y3 and actual reload',()=>{
 const env=observed.env,before=env.json('player.highSchoolExchangeNetwork');
 env.run('saveGame();var temporalRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=temporalRenderer;}');
 assert.deepStrictEqual(env.json('player.highSchoolExchangeNetwork'),before);
 assert(before.evidence.filter(e=>e.careerYear===1).length);
 for(const e of before.evidence.filter(e=>e.careerYear===1))assert.strictEqual(T.classifyRelationshipEvidenceAge(e,{careerYear:3,seasonPhase:'final-competition',sequence:1},before),'OLDER_THAN_ONE_YEAR');
});
test('candidate identities order source types and selected opportunities identical',()=>{for(let i=0;i<4;i++)assert.deepStrictEqual(actual[i].windows.map(w=>[w.candidates,w.selected,w.opportunity]),baseline[i].windows.map(w=>[w.candidates,w.selected,w.opportunity]));});
test('weights draw results and draw identities identical',()=>{for(let i=0;i<4;i++)assert.deepStrictEqual(actual[i].windows.map(w=>[w.profiles,w.probability]),baseline[i].windows.map(w=>[w.profiles,w.probability]));});
test('schedule entries identical',()=>{for(let i=0;i<4;i++)assert.deepStrictEqual(actual[i].windows.map(w=>w.schedule),baseline[i].windows.map(w=>w.schedule));});
test('opportunity count unchanged',()=>{for(let i=0;i<4;i++)assert.strictEqual(finals[i].schedule.opportunities.length,5);});
test('Y1 Y2 Y3 remain 2 2 1',()=>{for(const c of actual)assert.deepStrictEqual([1,2,3].map(y=>c.windows.filter(w=>w.year===y&&w.completed).length),[2,2,1]);});
test('mandatory budget anti-reroll unchanged',()=>{for(const c of actual)for(const k of ['mandatoryProfiles','budgetViolation','antiRerollFailures','duplicateWindowMaterialization','reloadMismatch','crossYearReloadMismatch'])assert.strictEqual(c.checks[k],0);});
test('GameRecord byte signatures identical',()=>{for(let i=0;i<4;i++)assert.deepStrictEqual(actual[i].windows.map(w=>w.gameRecordSignature),baseline[i].windows.map(w=>w.gameRecordSignature));});
test('whole career observations remain identical',()=>assert.deepStrictEqual(actual,baseline));
test('RNG cursor and measurement neutrality',()=>assert(actual.every(c=>c.checks.gameplayRngMismatch===0&&c.checks.neutralityMismatch===0)));
test('real competition encounter retains completed official semantics',()=>assert(finals.every(x=>x.ledger.evidence.some(e=>e.evidenceType==='competitionEncounter'&&e.matchOrigin==='officialCompetition'))));
const official=require('./high-school-opportunity-selection-test-context.cjs')('enabled');
official.run(`
 careerFixture('二壘手','starter');choose('critical_offseason',1);player.highSchoolMatch=null;
 var officialPlayingTime=JSON.parse(JSON.stringify(ensureHighSchoolYearThreeOpportunity()));
 officialPlayingTime.decisionId+='|temporal-official';officialPlayingTime.plannedUsage.appearanceType='start';
 var temporalTeam=player.primaryTeamAssignment.teamId;
 HighSchoolCompetitionFoundation.registerDefinition(player,{competitionId:'temporal-series',competitionType:'school_tournament',entryUnit:'school',level:'high_school'});
 HighSchoolCompetitionFoundation.registerEdition(player,{editionId:'temporal-edition',competitionId:'temporal-series',seasonYear:2033});
 var temporalEntry=HighSchoolCompetitionFoundation.enterCompetition(player,{competitionEditionId:'temporal-edition',teamId:temporalTeam});
 HighSchoolCompetitionFoundation.recordParticipation(player,{playerId:'player',competitionEditionId:'temporal-edition',teamId:temporalTeam,rosterStatus:'active_roster',participationStatus:'appeared'});
 var officialInput=sourceInput();officialInput.sources=officialInput.sources.filter(s=>s.opportunityType==='officialCompetitionOpportunity').map(s=>({...s,competitionRefs:{competitionEntryId:temporalEntry.entryId,competitionEditionId:temporalEntry.competitionEditionId},plannedContext:{competitionEditionId:temporalEntry.competitionEditionId}}));
 var officialCandidate=HighSchoolMatchOpportunityGeneration.deriveOfficialCompetitionCandidates(officialInput).find(c=>c.eligible);
 var officialOpportunity=HighSchoolMatchOpportunityGeneration.materializeOpportunityCandidate(player.highSchoolSchedule,officialCandidate,officialInput);
 HighSchoolScheduleOpportunity.setOpportunityStatus(player.highSchoolSchedule,officialOpportunity.opportunityId,'accepted');
 var officialEntry=HighSchoolScheduleOpportunity.scheduleOpportunity(player.highSchoolSchedule,officialOpportunity.opportunityId,getHighSchoolScheduleExecutionContext());
 launchHighSchoolScheduleEntry(officialEntry.scheduleEntryId,{matchId:officialPlayingTime.matchId,eventId:'critical_tournament',matchType:'final-competition',opportunityIndex:1,opportunityDecision:officialPlayingTime});finishProducerMatch();
`);
test('nonempty CompetitionEvidence and competition state unchanged by reads',()=>{
 const before=official.json(facts);assert(before.competitionEvidence.records.length>0);assert(official.run('HighSchoolCompetitionEvidence.assertIntegrity(player)'));
 for(const e of before.ledger.evidence)T.getRelationshipTemporalPosition(e,before.ledger);
 T.buildRelationshipTemporalSummary(before.ledger,{evidenceRefs:before.ledger.evidence.map(e=>e.evidenceId)},{careerYear:3,seasonPhase:'final-competition',sequence:1});
 assert.deepStrictEqual(official.json(facts),before);
});
const scenarios=[];
for(const type of ['incomingFriendlyInvitation','outgoingFriendlyInvitation','trainingCampOpportunity','developmentMatchOpportunity']){
 const env=require('./high-school-opportunity-selection-test-context.cjs')('enabled');
 env.run('priorExchange('+JSON.stringify(type)+');var temporalInput=sourceInput();');
 const input=env.json('temporalInput'),state=input.relationshipLedger;
 const friendly=env.json('HighSchoolFriendlyInvitationSource.deriveFriendlyInvitationSources(temporalInput)');
 const camp=env.json('HighSchoolTrainingCampSource.deriveTrainingCampSources(temporalInput)');
 const sources=[...friendly.sources,...camp.sources];
 const summaries=sources.map(s=>T.buildRelationshipTemporalSummary(state,s,input.context));
 env.run('saveGame();var temporalRenderer=showCurrentEvent;try{showCurrentEvent=()=>{};loadGame();}finally{showCurrentEvent=temporalRenderer;}');
 const loaded=env.json('player.highSchoolExchangeNetwork');assert.deepStrictEqual(loaded,state);
 assert.deepStrictEqual(sources.map(s=>T.buildRelationshipTemporalSummary(loaded,s,input.context)),summaries);
 scenarios.push({type,input,friendly,camp,summaries});
}
test('real Y1 away visit',()=>assert(scenarios[0].input.relationshipLedger.evidence.some(e=>e.evidenceType==='awayVisit'&&e.careerYear===1)));
test('real Y1 home visit',()=>assert(scenarios[1].input.relationshipLedger.evidence.some(e=>e.evidenceType==='homeVisit'&&e.careerYear===1)));
test('real return age follows parent not Y2 source year',()=>{for(const x of scenarios.slice(0,2)){const e=x.input.relationshipLedger.evidence.find(e=>e.evidenceType==='returnVisitEligible');assert(e);assert.strictEqual(T.classifyRelationshipEvidenceAge(e,x.input.context,x.input.relationshipLedger),'PREVIOUS_YEAR');}});
test('real shared training latest position from completed event',()=>{const x=scenarios[2],e=x.input.relationshipLedger.evidence.find(e=>e.evidenceType==='sharedTrainingContext');assert(e);assert.strictEqual(T.getRelationshipTemporalPosition(e).sequence,2);});
test('real development exchange temporal position',()=>assert(scenarios[3].input.relationshipLedger.evidence.some(e=>e.evidenceType==='developmentExchange'&&T.getRelationshipTemporalPosition(e).careerYear===1)));
test('Y1 ledger loaded in Y2 reconstructs identical summaries',()=>assert(scenarios.every(x=>x.input.context.careerYear===2&&x.summaries.some(s=>s.latestAgeClass==='PREVIOUS_YEAR'))));
test('latest school relationship resolver uses chronology',()=>{for(const x of scenarios){const s=x.input.relationshipLedger;const result=T.resolveMostRecentRelationshipEvidence(s,{schoolId:x.input.context.playerSchoolId});assert.strictEqual(result.status,'RESOLVED');assert.strictEqual(result.temporalPosition.sequence,2);}});
test('friendly summaries preserve all refs',()=>{for(const x of scenarios)for(const s of x.friendly.sources){const r=T.buildRelationshipTemporalSummary(x.input.relationshipLedger,s,x.input.context);assert.deepStrictEqual(r.supportingEvidenceIds,[...s.evidenceRefs].sort());}});
test('merged camp refs produce one shared temporal summary',()=>{const x=scenarios[1];assert(x.camp.sources.length);for(const s of x.camp.sources){const r=T.buildRelationshipTemporalSummary(x.input.relationshipLedger,s,x.input.context);assert.strictEqual(r.evidenceCount,new Set(s.evidenceRefs).size);assert.strictEqual(r.latestAgeClass,'PREVIOUS_YEAR');}});
test('real explicit camp plan no-ref context is not fake recency',()=>assert(observed.env.json('temporalChecks').plans>0));
test('same event evidence multiplicity preserved without inflated contacts',()=>{const x=scenarios[1],e=x.input.relationshipLedger.evidence.filter(e=>e.sequence===2);const r=T.buildRelationshipTemporalSummary(x.input.relationshipLedger,{evidenceRefs:e.map(e=>e.evidenceId)},x.input.context);assert.strictEqual(r.evidenceCount,3);assert.strictEqual(r.completedEventCount,1);assert.strictEqual(r.contactCount,null);});
test('old save unknown phase still loads without new schema',()=>{const env=observed.env;env.run('var temporalOld=JSON.parse(JSON.stringify(player));for(const e of temporalOld.highSchoolExchangeNetwork.evidence)e.seasonPhase="legacy-unmapped";var temporalRestored=normalizeSave(temporalOld);');const ledger=env.json('temporalRestored.highSchoolExchangeNetwork');assert(ledger.evidence.length);assert.strictEqual(T.resolveMostRecentRelationshipEvidence(ledger).status,'UNKNOWN');});
test('selection probability producer save and record source files unchanged',()=>{for(const f of ['high-school-opportunity-selection.js','high-school-opportunity-probability.js','high-school-friendly-invitation-producer.js','high-school-training-camp-producer.js','high-school-exchange-network.js','save.js','match-game-record.js','high-school-competition-evidence.js'])assert.strictEqual(fs.readFileSync(f,'utf8').replace(/\r\n?/g,'\n'),cp.execFileSync('git',['show','f300b2f:'+f],{encoding:'utf8'}).replace(/\r\n?/g,'\n'));});
test('v2 v1 and weights unchanged',()=>{assert.strictEqual(require('../high-school-opportunity-selection').POLICY_VERSION,'high-school-opportunity-selection-v2');const P=require('../high-school-opportunity-probability');assert.strictEqual(P.VERSION,'high-school-opportunity-probability-v1');assert.deepStrictEqual([...new Set(Object.values(P.WEIGHTS))].sort(),[1,2,3]);});
const report={tests:passed,careerPairs:4,matchesPerArm:20,frequency:[2,2,1],behaviorEquivalent:true,competitionEvidenceRecords:official.run('player.competitionEvidenceState.records.length'),observer:observed.env.json('temporalChecks'),scenarios:scenarios.map(x=>({type:x.type,evidenceTypes:[...new Set(x.input.relationshipLedger.evidence.map(e=>e.evidenceType))],ageClasses:[...new Set(x.summaries.map(s=>s.latestAgeClass))],saveReload:true})),checks:actual.map(c=>c.checks)};
console.log('TEMPORAL_JSON='+JSON.stringify(report));console.log(`${passed}/${passed} PASS`);
