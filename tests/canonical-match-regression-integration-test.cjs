"use strict";
const assert = require("node:assert/strict");
const { policy, playCanonicalMatch } = require("./helpers/canonical-match-contract-context.cjs");

function runSuite() {
  let passed = 0;
  const executions = [], results = [];
  function check(title, fn) { fn(); passed += 1; console.log(`PASS ${title}`); }
  function validate(f, label) {
    const m=f.finalMatch, initial=f.initialMatch, log=m.simulationLog, side=f.entry.initialState.playerSide;
    const entries=log.filter(e=>e.type==='playerEntry'), entry=entries[0];
    const reached=log.filter(e=>e.type==='meaningfulMomentReached'), resolved=log.filter(e=>e.type==='meaningfulMomentResolved');
    const playerPAs=log.filter(e=>e.type==='plateAppearance'&&e.batterId==='player');
    check(`${label}: seed and browser-global owners`,()=>{
      assert.equal(m.simulationSeed,f.seed); assert.equal(f.entry.pendingSeedAfterPrepare,0); assert(f.browserGlobals);
      for(const value of Object.values(f.entry.globals)) assert.notEqual(value,'undefined');
      assert(!f.sources.files.includes('application-controller.js'));
    });
    check(`${label}: lawful entry, unchanged capability and Opportunity/roster agreement`,()=>{
      assert(f.entry.accepted); assert.equal(f.entry.age,16); assert(f.entry.invitationValidation.ok);
      assert(f.entry.capabilityValidation.ok); assert(f.entry.abilitiesUnchanged); assert.equal(f.entry.primaryPosition,'游擊手');
      assert.equal(f.entry.invitationIndex,policy.invitationIndex); assert.equal(f.entry.schoolId,'school-development-29d536a2');
      const exposure=initial.gameExposureState, opportunity=exposure.opportunitySnapshot;
      assert.equal(exposure.exposureSource,'opportunity-resolver'); assert(opportunity.decisionId);
      assert.equal(opportunity.assignedPosition,'游擊手'); assert.deepEqual(exposure.plannedUsage,opportunity.plannedUsage);
      assert.equal(exposure.plannedUsage.appearanceType,'lateGameAppearance'); assert.equal(exposure.plannedUsage.entryInning,6);
      assert.equal(initial.role,'starter'); assert.equal(initial.playerLineupStatus,'bench');
      assert.equal(initial.playerEntryCompleted,false); assert.equal(initial.playerLineupSlot,-1);
      assert(!initial.rosters[side].lineup.some(a=>a.id==='player')); assert(initial.rosters[side].bench.some(a=>a.id==='player'));
      assert(initial.rosters[side].teamRoster.players.some(a=>(a.playerId||a.id)==='player'));
    });
    check(`${label}: actual substitution precedes every player decision`,()=>{
      assert.equal(entries.length,1); assert.equal(entry.inning,initial.gameExposureState.plannedUsage.entryInning);
      assert.equal(entry.lineupSlot,7); assert.equal(m.playerLineupStatus,'substitute');
      assert.equal(m.rosters[side].lineup[entry.lineupSlot].id,'player'); assert.equal(f.finalState.actualSS,'player');
      for(const row of f.steps) for(const state of [row.before,row.after]) if(!state.entryCompleted) {
        assert(!state.playerInLineup); assert.deepEqual(state.completedIds,[]);
      }
      assert(reached.length>0); assert(reached.every(e=>e.sequence>entry.sequence));
      for(const d of f.decisions) {
        assert(d.before.entryCompleted&&d.before.playerInLineup); assert.equal(d.before.actualSS,'player');
        assert.equal(d.before.currentBatter,d.before.actualBatter);
        if(d.before.domain==='offense') { assert.equal(d.before.offenseTeam,side); assert.equal(d.before.actualBatter,'player'); }
      }
      assert(playerPAs.every(e=>e.sequence>entry.sequence));
    });
    check(`${label}: legal decisions each create one result and one completion`,()=>{
      assert(f.decisions.length>0); assert.equal(reached.length,f.decisions.length); assert.equal(resolved.length,f.decisions.length);
      assert.equal(m.completedMoments.length,f.decisions.length);
      assert.equal(new Set(m.completedMoments.map(x=>x.id)).size,m.completedMoments.length);
      for(const d of f.decisions) {
        assert(d.legalChoices.length>0); assert(d.legalChoices.some(c=>c.matchDecision===d.choice.matchDecision&&c.matchMomentId===d.choice.matchMomentId));
        const expected=d.legalChoices.find(c=>c.matchDecision==='secure'||c.matchDecision==='zone')||d.legalChoices[0];
        assert.deepEqual(d.choice,expected); assert.equal(d.sample,policy.sample); assert(d.returned);
        assert.equal(d.newCompleted.length,1); assert.equal(d.newCompleted[0].id,d.choice.matchMomentId);
        assert.equal(d.newCompleted[0].decision,d.choice.matchDecision);
        assert.equal(d.newEvents.filter(e=>e.type==='meaningfulMomentResolved').length,1);
        if(d.before.domain==='offense') assert.equal(d.newEvents.filter(e=>e.type==='plateAppearance'&&e.batterId==='player').length,1);
      }
      assert.equal(m.currentDomain,'complete'); assert.equal(m.activeSituation??null,null);
    });
    check(`${label}: natural full-match closure within original safety bound`,()=>{
      assert(m.completed&&m.settled); assert(f.safety<policy.safety); assert.equal(f.steps.length,f.safety);
      assert.equal(log.filter(e=>e.type==='gameEnd').length,1); assert.equal(m.half,'終'); assert.equal(m.outs,3);
    });
    check(`${label}: every playback/decision transition has valid Match State`,()=>{
      assert(f.steps.length>0); for(const row of f.steps) { assert.deepEqual(row.before.integrity,[]); assert.deepEqual(row.after.integrity,[]); }
      assert.deepEqual(f.finalState.integrity,[]);
    });
    check(`${label}: created/completed defense conservation (zero-coverage fixture)`,()=>{
      const count=m.completedMoments.filter(x=>x.domain==='defense').length;
      assert.equal(count,m.matchDecisionDensityState.defensiveMeaningfulDecisionCount); assert.equal(count,0);
    });
    check(`${label}: final Record agrees with score, totals, PA and event identities`,()=>{
      const r=m.gameRecord; assert.equal(r.status,'final'); assert.equal(f.recordIntegrity,true);
      for(const team of ['home','away']) {
        assert.equal(r.totals[team].runs,m.scores[team]); assert.equal(r.result.finalScore[team],m.scores[team]);
        assert.equal(r.inningLines.reduce((sum,line)=>sum+line[team==='home'?'homeRuns':'awayRuns'],0),m.scores[team]);
      }
      assert.equal(r.eventRefs.length,log.length); assert.equal(new Set(r.eventRefs.map(e=>e.eventId)).size,log.length);
      assert.deepEqual(r.eventRefs.map(e=>[e.sequence,e.type,e.inning,e.half]),log.map(e=>[e.sequence,e.type,e.inning,e.half]));
      assert.equal(r.playerLines.player.batting.PA,playerPAs.length);
      assert.equal(Object.values(r.playerLines).reduce((sum,line)=>sum+line.batting.PA,0),log.filter(e=>e.type==='plateAppearance').length);
    });
    check(`${label}: public resolve/settle/finish duplicates have no effects`,()=>{
      assert.equal(f.duplicates.length,f.decisions.length); for(const d of f.duplicates) { assert.equal(d.returned,false); assert(d.fullPlayerUnchanged); }
      assert.deepEqual(f.repeatedSettlement.returns,[false,false,false]); assert(f.repeatedSettlement.fullPlayerUnchanged); assert(f.readsUnchanged);
    });
    check(`${label}: Save memory round-trip retains Match, Record and Career`,()=>{
      const saved=f.restored; assert.equal(f.saveRecordIntegrity,true);
      for(const key of ['id','completed','settled','simulationSeed','scores','inning','half','outs','playerLineupStatus','playerEntryCompleted','rosters','gameRecord','simulationLog','completedMoments','gameExposureState','matchExperience'])
        assert.deepEqual(saved.highSchoolMatch[key],m[key],key);
      assert.deepEqual(saved.highSchoolCompetitionEvaluation,f.finalPlayer.highSchoolCompetitionEvaluation);
      assert.deepEqual(saved.highSchoolYearOneMatchHistory,f.finalPlayer.highSchoolYearOneMatchHistory);
    });
    check(`${label}: Career exposure agrees with real participation and settles once`,()=>{
      const a=f.actualExposure, exposure=m.gameExposureState, evaluation=f.finalPlayer.highSchoolCompetitionEvaluation;
      const defenseHalf=side==='home'?'上':'下';
      const innings=new Set(log.filter(e=>e.type==='halfInningEnd'&&e.half===defenseHalf&&e.sequence>=entry.sequence).map(e=>e.inning)).size;
      assert(a.participated); assert.equal(a.started,false); assert.equal(a.appearanceType,'lateGameAppearance');
      assert.equal(a.entryInning,entry.inning); assert.equal(a.exitInning,m.inning); assert.equal(a.plateAppearances,playerPAs.length); assert.equal(a.defensiveInnings,innings);
      assert(exposure.finalized); assert.equal(exposure.plateAppearances,playerPAs.length); assert.equal(exposure.defensiveInnings,innings);
      assert.equal(evaluation.sampleCount,1); assert.deepEqual(evaluation.appliedMatchIdentities,[m.id]);
      assert.equal(evaluation.exposureEvidence.started,false); assert.equal(evaluation.exposureEvidence.enteredGame,true);
      assert.equal(evaluation.exposureEvidence.plateAppearances,playerPAs.length); assert.equal(evaluation.exposureEvidence.defensiveInnings,innings);
      assert(m.matchExperience.settled); const history=f.finalPlayer.highSchoolYearOneMatchHistory;
      assert.equal(history.length,1); assert.equal(history[0].matchId,m.id);
      assert.deepEqual(history[0].actualExposure,{appearanceType:a.appearanceType,plateAppearances:a.plateAppearances,defensiveInnings:a.defensiveInnings,participated:a.participated});
    });
    check(`${label}: resolution preserved, decision pressure sourced, final summary separate`,()=>{
      assert.equal(f.snapshots.status,'RESOLUTION SNAPSHOT CONTRACT'); assert.equal(f.snapshots.decisions.length,f.decisions.length);
      assert.equal(f.snapshots.finalSummary.inning,m.inning); assert.deepEqual(f.snapshots.finalSummary.scores,m.scores);
      for(const d of f.decisions) {
        const pa=d.newEvents.find(e=>e.type==='plateAppearance'&&e.batterId==='player');
        if(pa) { assert.equal(pa.before.outs,d.before.outs); assert.equal(pa.after.outs,d.after.outs); }
        assert.equal(d.newCompleted[0].inning,d.after.inning); assert.equal(d.newCompleted[0].half,d.after.half);
      }
      const last=f.snapshots.decisions.at(-1), result=last.resolutionMoments.at(-1), final=last.finalCompletedMoment;
      assert.deepEqual(final,result,'Completed Moment must preserve resolution state');
      const expected=f.seed===88221?{outs:2,scores:{home:1,away:5},finalAway:6}:{outs:1,scores:{home:1,away:1},finalAway:3};
      assert.equal(final.inning,6); assert.equal(final.half,'下'); assert.equal(final.outs,expected.outs);
      assert.deepEqual(final.scores,expected.scores); assert.deepEqual(final.runners,[null,null,null]);
      assert.equal(m.inning,7); assert.equal(m.half,'終'); assert.equal(m.outs,3); assert.deepEqual(m.scores,{home:1,away:expected.finalAway});
      assert.notEqual(final.inning,m.inning);
      const before=last.decisionBefore, context=final.batterAnticipation.publicContext;
      assert.equal(final.batterAnticipation.identity,[m.id,final.id,'player',final.inning,final.half].join('|'));
      assert.equal(context.inning,before.inning); assert.equal(context.outs,before.outs);
      assert.deepEqual(context.runners,before.runners.map(Boolean));
      assert.equal(context.scoreDifference,before.scores.home-before.scores.away);
      function expectedPressure(state) {
        const reasons=[];if(state.inning>=m.regulationInnings-1)reasons.push('lateGame');
        if(Math.abs(state.scores.home-state.scores.away)<=1)reasons.push('closeScore');
        if(state.runners.filter(Boolean).length>=2)reasons.push('traffic');if(state.outs===2)reasons.push('twoOuts');
        return {band:reasons.length>=2?'high':reasons.length?'normal':'low',modifier:reasons.length>=2?1.05:reasons.length?1.02:1,reasons};
      }
      const active=m.matchExperience.evidence.filter(e=>e.evidenceType==='active'&&e.role==='batter');assert.equal(active.length,2);
      for(const e of active){assert.equal(e.situation.outs,final.outs);assert.equal(e.situation.half,final.half);
        assert.equal(e.situation.scoreMargin,final.scores.home-final.scores.away);assert.deepEqual(e.pressure,expectedPressure(before));}
      for(const probe of f.pressureFallbacks)for(const e of probe.evidence)assert.deepEqual(e.pressure,expectedPressure(final));
      assert(f.callHome.includes('6局下'));assert(!f.callHome.includes('6局終'));assert(f.callHome.includes('終場 1：'+expected.finalAway));
    });
  }
  for(const seed of policy.seeds) {
    const first=playCanonicalMatch(seed); executions.push({seed,run:'first',facts:first}); validate(first,`${seed}/first`);
    const replay=playCanonicalMatch(seed); executions.push({seed,run:'replay',facts:replay}); validate(replay,`${seed}/replay`);
    check(`${seed}: identical fresh-context replay Record/Log/Decision sequence`,()=>{
      assert.deepEqual(first.hashes,replay.hashes); assert.deepEqual(first.finalMatch.gameRecord,replay.finalMatch.gameRecord);
      assert.deepEqual(first.finalMatch.simulationLog,replay.finalMatch.simulationLog); assert.deepEqual(first.decisions,replay.decisions);
    });
    results.push({seed,status:'PASS',fixture:'legal sixth-inning SS substitute',runs:2,ticks:first.safety,score:first.finalMatch.scores,
      completedIds:first.finalMatch.completedMoments.map(x=>x.id),defenseCreated:first.finalMatch.matchDecisionDensityState.defensiveMeaningfulDecisionCount,
      defenseCompleted:first.finalMatch.completedMoments.filter(x=>x.domain==='defense').length,hashes:first.hashes,snapshot:'RESOLUTION SNAPSHOT PRESERVED',replay:true});
  }
  const summary={suite:'canonical-match-regression',passed,failed:0,fullGames:executions.length,results,
    S3:'UNVERIFIED',SSStartingAdmission:'UNVERIFIED',nonzeroDefensiveMoment:'UNVERIFIED',snapshot:'RESOLUTION SNAPSHOT PRESERVED',decisionPressure:'Existing PA publicContext; missing/stale legacy context UNVERIFIED',original36:'NOT EXECUTED / historical verdict unchanged'};
  console.log('CANONICAL_MATCH_REGRESSION_EVIDENCE='+JSON.stringify({policy,summary,executions}));
  console.log('CANONICAL_MATCH_REGRESSION_SUMMARY='+JSON.stringify(summary));
  console.log(`Canonical Match Regression: ${passed}/${passed} passed.`);
  return summary;
}
module.exports={runSuite};
if(require.main===module) runSuite();
