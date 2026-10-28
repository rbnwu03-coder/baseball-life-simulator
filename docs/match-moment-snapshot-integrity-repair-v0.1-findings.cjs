"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./match-moment-snapshot-integrity-repair-v0.1-capture.cjs');
const original=C.json(C.prefix+'authorized-before-evidence.json').files;
const source=file=>fs.readFileSync(path.join(C.root,file),'utf8');
const before=file=>original.find(row=>row.file===file).source;
const normal=s=>s.replace(/\r\n/g,'\n');
const delta=C.json(C.prefix+'production-delta-evidence.json');
const exactProduction=delta.files.map(row=>{
  let expected=before(row.file);
  for(const edit of delta.edits.filter(e=>e.file===row.file)){assert.equal(expected.split(edit.before).length,2);expected=expected.replace(edit.before,edit.after);}
  assert.equal(source(row.file),expected);
  return {...row,exactOutsideReplacementsUnchanged:true};
});
const test='tests/canonical-match-regression-integration-test.cjs',helper='tests/helpers/canonical-match-contract-context.cjs';
const a=normal(before(test)),b=normal(source(test));
const oldStart=a.indexOf('    check(`${label}: three snapshot times retained;'),newStart=b.indexOf('    check(`${label}: resolution preserved,');
assert(oldStart>0&&newStart>0);assert.equal(a.slice(0,oldStart),b.slice(0,newStart));
const oldEnd=a.indexOf('\n  }\n  for(const seed',oldStart),newEnd=b.indexOf('\n  }\n  for(const seed',newStart);
const oldCheck=a.slice(oldStart,oldEnd),newCheck=b.slice(newStart,newEnd);
let expected=a.replace(oldCheck,newCheck).replace("snapshot:'KNOWN CONTRACT GAP',replay:true","snapshot:'RESOLUTION SNAPSHOT PRESERVED',replay:true")
  .replace("snapshot:'KNOWN CONTRACT GAP',original36:","snapshot:'RESOLUTION SNAPSHOT PRESERVED',decisionPressure:'Existing PA publicContext; missing/stale legacy context UNVERIFIED',original36:");
assert.equal(b,expected);
const ha=normal(before(helper)),hb=normal(source(helper));
const insertion=hb.slice(hb.indexOf('    globalThis.contractCallHome ='),hb.indexOf('    globalThis.contractReadUnchanged ='));
assert.equal(hb,ha.replace('    globalThis.contractReadUnchanged =',insertion+'    globalThis.contractReadUnchanged =')
  .replace('    readsUnchanged:contractReadUnchanged,','    callHome:contractCallHome,pressureFallbacks:contractPressureFallbacks,\n    readsUnchanged:contractReadUnchanged,')
  .replace('status: "KNOWN CONTRACT GAP"','status: "RESOLUTION SNAPSHOT CONTRACT"'));
const graph=C.json(C.prefix+'focused-source-graph-evidence.json');
const snippets=[...graph.ownerSnippets,graph.anticipation[1]].map(row=>{
  assert.equal(row.status,'fulfilled');const text=row.value.content[0].text;
  const file=text.match(/^file_path: (.+)$/m)[1].replace(/\\/g,'/').replace(C.root.replace(/\\/g,'/')+'/','');
  const start=+text.match(/^start_line: (\d+)/m)[1],end=+text.match(/^end_line: (\d+)/m)[1];
  const exact=text.split('source: |\n')[1].split('\ncallers:')[0].split('\n').map(line=>line.startsWith('  ')?line.slice(2):line).join('\n').trimEnd();
  assert.equal(exact,normal(before(file)).split('\n').slice(start-1,end).join('\n').trimEnd(),file+':'+start);
  return {file,start,end,source:exact,sha256:C.hash(exact),exactBeforeSourceMatched:true};
});
C.capture('source',{exactProduction,testPreservation:{allFirstElevenGroupsExact:true,replayChecksExact:true,namedChecksBefore:50,namedChecksAfter:50,oldCheck,newCheck,onlyOtherChanges:'Summary status labels and explicit legacy-context limitation'},helperPreservation:{exactEntryAndPlaybackPrefixUnchanged:true,readOnlyInsertion:insertion,secondObservationFieldOnly:true},snippets,files:C.allowed.map(file=>({file,beforeHash:original.find(row=>row.file===file).sha256,afterHash:C.fileHash(file),source:source(file)})),unchangedSources:['save.js','player.js','match-game-record.js','tests/baseball-match-foundation-2-2-2-test.js','tests/ability-performance-gradient-test.js','tests/entry-safe-runner.cjs','tests/entry-safe-preload.cjs'].map(file=>({file,sha256:C.fileHash(file),sameAsOpening:C.fileHash(file)===C.json(C.prefix+'baseline-evidence.json').hashes[file]})),noPersistedSchemaOrVersionChange:true});
function tagged(file,tag){const row=C.json(file),line=row.stdout.split('\n').find(line=>line.startsWith(tag));assert(line,file);return JSON.parse(line.slice(tag.length));}
const oldFile='docs/test-infrastructure-sprint-0.1-match-contract-implementation-v0.1-sprint-1-canonical-evidence.json';
const old=tagged(oldFile,'CANONICAL_MATCH_REGRESSION_EVIDENCE='),now=tagged(C.childPrefix+'canonical-evidence.json','CANONICAL_MATCH_REGRESSION_EVIDENCE=');
const view=x=>({inning:x.inning,half:x.half,outs:x.outs,runners:x.runners,scores:x.scores});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function diff(a,b,p=''){if(same(a,b))return[];if(a&&b&&typeof a==='object'&&typeof b==='object')return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p+'.'+k));return[{path:p,before:a,after:b}];}
const runs=now.executions.map(e=>{
  const f=e.facts,m=f.finalMatch,prior=old.executions.find(x=>x.seed===e.seed&&x.run===e.run).facts;
  const last=f.snapshots.decisions.at(-1),resolution=last.resolutionMoments.at(-1),finalMoment=last.finalCompletedMoment;
  assert.deepEqual(finalMoment,resolution);
  const parity={};for(const k of ['fixture','initialMatch','decisions']){parity[k]=same(prior[k],f[k]);assert(parity[k],k);}
  for(const k of ['gameRecord','simulationLog','playerContribution','rosters','scores']){parity[k]=same(prior.finalMatch[k],m[k]);assert(parity[k],k);}
  for(const k of ['baseballSkills','capabilityState','highSchoolYearOneMatchHistory','highSchoolCoachEvaluation','highSchoolCompetitionEvaluation']){parity[k]=same(prior.finalPlayer[k],f.finalPlayer[k]);assert(parity[k],k);}
  parity.skillProgress=same(prior.finalPlayer.developmentState.skillProgress,f.finalPlayer.developmentState.skillProgress);assert(parity.skillProgress);
  const developmentDiff=diff(prior.finalPlayer.developmentState,f.finalPlayer.developmentState);
  assert(developmentDiff.every(row=>/^\.history\.\d+\.metadata\.experienceValue$/.test(row.path)));
  const active=m.matchExperience.evidence.filter(x=>x.evidenceType==='active'&&x.role==='batter');
  const oldActive=prior.finalMatch.matchExperience.evidence.filter(x=>x.evidenceType==='active'&&x.role==='batter');
  return {seed:e.seed,run:e.run,fixture:'legal sixth-inning SS substitute',hashes:f.hashes,ticks:f.safety,decisionBefore:view(last.decisionBefore),resolutionSnapshot:view(resolution),lastMomentAtFinal:view(finalMoment),oldLastMomentAtFinal:view(prior.finalMatch.completedMoments.at(-1)),finalSummary:view(m),entireLastMomentUnchanged:true,entireLastMomentHash:C.hash(JSON.stringify(finalMoment)),resolutionHash:C.hash(JSON.stringify(resolution)),parityWithAcceptedSprint1:parity,oldEvidence:oldFile,pressure:{before:oldActive.map(x=>({pressure:x.pressure,situation:x.situation})),after:active.map(x=>({pressure:x.pressure,situation:x.situation})),identity:finalMoment.batterAnticipation.identity,publicContext:finalMoment.batterAnticipation.publicContext,fallbackProbes:f.pressureFallbacks.map(x=>({kind:x.kind,pressure:x.evidence.map(x=>x.pressure)})),legacyDecisionBeforeCorrectness:'UNVERIFIED when existing context missing/stale/invalid; resolution fallback retained'},developmentDiff,aggregated:{before:prior.finalMatch.matchExperience.aggregated,after:m.matchExperience.aggregated},callHome:f.callHome,record:{integrity:f.recordIntegrity,saveIntegrity:f.saveRecordIntegrity,eventRefs:m.gameRecord.eventRefs.length,logEvents:m.simulationLog.length,result:m.gameRecord.result,totals:m.gameRecord.totals},exposure:f.actualExposure,duplicates:f.duplicates,repeatedSettlement:f.repeatedSettlement,savePreserved:same(f.restored.highSchoolMatch.completedMoments,m.completedMoments),readOnlyProbesDidNotChangePlayer:f.readsUnchanged};
});
const replay=[88221,88222].map(seed=>{const a=now.executions.find(x=>x.seed===seed&&x.run==='first').facts,b=now.executions.find(x=>x.seed===seed&&x.run==='replay').facts;assert.deepEqual(a.hashes,b.hashes);assert.deepEqual(a.finalPlayer,b.finalPlayer);return {seed,hashes:a.hashes,fullPlayerDeepEqual:true};});
const acceptance=C.json(C.prefix+'acceptance-evidence.json');
C.capture('findings',{beforeReproduction:C.prefix+'before-reproduction-evidence.json',openingBaseline:'255 suites: 203 PASS / 2 FAIL / 48 UNVERIFIED / 2 BLOCKED; historical evidence, not revalidated wholesale after Production delta',summary:now.summary,runs,replay,acceptance:acceptance.results,greenNamedChecks:acceptance.namedChecks,fullGamesInNewCanonicalGreen:4,expectedRedCanonicalGames:1,publicIdempotency:'CONFIRMED in all four fixed-context runs',decisionContext:'Existing immutable publicContext from same formal PA identity only; no invented before or persisted field',eventSnapshotCorrectness:'CONFIRMED in two fixed seeds and replays',finalMatchRecordCorrectness:'CONFIRMED; exact prior Record/Log parity',remaining:{original36:'Historical FAIL retained; NOT EXECUTED; original assertion unchanged',abilityGradient:'Historical FAIL retained; NOT EXECUTED; no ability/seed/sample tuning',S3:'UNVERIFIED',SSStartingAdmission:'UNVERIFIED',nonzeroNaturalSSDefensiveMoment:'UNVERIFIED',legacyMissingContext:'Decision-before pressure UNVERIFIED; no backfill/migration',browserLifecycle:'UNVERIFIED; memory round-trip only'},readyForCommit:false,readyForSprint10B:false,receiverV2:'DISABLED'});
console.log(JSON.stringify({sourceContracts:'VERIFIED',runs:runs.length,replay:replay.length,greenChecks:acceptance.namedChecks,oldRecordAndLogParity:true,developmentDiff:runs.filter(r=>r.run==='first').map(r=>({seed:r.seed,diff:r.developmentDiff}))}));
