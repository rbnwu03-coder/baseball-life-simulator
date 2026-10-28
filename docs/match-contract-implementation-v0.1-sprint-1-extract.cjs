"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./match-contract-implementation-v0.1-sprint-1-capture.cjs');
function proof(file,tag){const e=C.json(file),line=e.stdout.split(/\r?\n/).find(l=>l.startsWith(tag+'='));assert(line,tag);return JSON.parse(line.slice(tag.length+1));}
const acceptance=C.json(C.prefix+'acceptance-evidence.json');
const canonical=proof(C.childPrefix+'canonical-evidence.json','CANONICAL_MATCH_REGRESSION_EVIDENCE');
const routine=proof(C.childPrefix+'routine-evidence.json','ROUTINE_COMMENTARY_CONTRACT_EVIDENCE');
const prior21=proof('docs/test-infrastructure-sprint-0.1-match-contract-separation-v0.1-proof-evidence.json','MATCH_CONTRACT_SEPARATION_PROOF');
const prior22=proof('docs/test-infrastructure-sprint-0.1-match-contract-evidence-closure-v0.1-canonical-88222-evidence.json','CLOSURE_CANONICAL_PROOF');
const hashObject=x=>C.hash(JSON.stringify(x));
const atTime=x=>({inning:x.inning,half:x.half,outs:x.outs,scores:x.scores,runners:x.runners});
const games=[];
for(const seed of [88221,88222]){
 const pair=canonical.executions.filter(e=>e.seed===seed);assert.equal(pair.length,2);const a=pair[0].facts,b=pair[1].facts,m=a.finalMatch;
 assert.deepEqual(a.hashes,b.hashes);assert.deepEqual(a.decisions,b.decisions);
 const old=seed===88221?prior21.facts:prior22.facts,oldMatch=old.finalMatch||old.match;
 const oldHashes={fixture:hashObject(old.fixture),initialMatch:hashObject(old.initialMatch),record:hashObject(oldMatch.gameRecord),log:hashObject(oldMatch.simulationLog)};
 const priorParity=Object.fromEntries(Object.keys(oldHashes).map(k=>[k,a.hashes[k]===oldHashes[k]]));assert(Object.values(priorParity).every(Boolean));
 const entry=m.simulationLog.find(e=>e.type==='playerEntry'),d=a.decisions[0],ids=m.completedMoments.map(x=>x.id);
 games.push({seed,status:'CONFIRMED / formal new suite PASS',fixture:'legal sixth-inning SS substitute',entry:a.entry,initialState:a.entry.initialState,
  actualEntry:entry,finalState:a.finalState,ticks:a.safety,stateObservations:a.steps.length*2,score:m.scores,
  playerPA:m.simulationLog.filter(e=>e.type==='plateAppearance'&&e.batterId==='player').length,createdDecisions:a.decisions.length,
  completedIds:ids,defenseCreated:m.matchDecisionDensityState.defensiveMeaningfulDecisionCount,defenseCompleted:m.completedMoments.filter(x=>x.domain==='defense').length,
  record:{status:m.gameRecord.status,integrity:a.recordIntegrity,totals:m.gameRecord.totals,result:m.gameRecord.result,eventRefs:m.gameRecord.eventRefs.length,logEvents:m.simulationLog.length},
  replay:{fixture:true,initialMatch:true,record:true,log:true,decisionSequence:true,decisionArrayDeepEqual:true},hashes:a.hashes,priorEvidenceByteParity:priorParity,
  publicDuplicates:{decisions:a.duplicates,settlement:a.repeatedSettlement},saveMemory:{recordIntegrity:a.saveRecordIntegrity,requiredFieldsRetained:true,realBrowserStorageReload:false},
  career:{actualExposure:a.actualExposure,gameExposure:m.gameExposureState.actualUsage,evaluation:a.finalPlayer.highSchoolCompetitionEvaluation.exposureEvidence,
   sampleCount:a.finalPlayer.highSchoolCompetitionEvaluation.sampleCount,appliedMatchIdentities:a.finalPlayer.highSchoolCompetitionEvaluation.appliedMatchIdentities,
   experienceSettled:m.matchExperience.settled,experienceIdentity:m.matchExperience.settlementId,historyEntries:a.finalPlayer.highSchoolYearOneMatchHistory.length,
   historyActualExposure:a.finalPlayer.highSchoolYearOneMatchHistory[0].actualExposure},
  snapshot:{status:'KNOWN CONTRACT GAP',decisionBefore:atTime(d.before),resultAfter:atTime(d.after),completedMomentAfterResult:atTime(d.newCompleted[0]),
   finalCompletedMoment:atTime(m.completedMoments.at(-1)),finalSummary:atTime(m),rawEvidence:C.childPrefix+'canonical-evidence.json'},
  original36Operands:{completed:m.completed,fixedMoment1:ids.includes('hs_y1_match_moment_1'),fixedMoment3:ids.includes('hs_y1_match_moment_3'),
   defenseEquality:m.completedMoments.filter(x=>x.domain==='defense').length===m.matchDecisionDensityState.defensiveMeaningfulDecisionCount,safetyBelow1400:a.safety<1400,combined:false},
  original37SameShapeOperands:{completed:m.completed,finalIntegrityEmpty:a.finalState.integrity.length===0,combined:m.completed&&a.finalState.integrity.length===0}});
}
const matrix=[
 {id:'36.1',original:'x.match.completed',purpose:'自然完整終局',responsibility:'Canonical closure',status:'CONFIRMED',evidence:'88221 first/replay; 88222 first/replay',missing:'原 legacy fixture 及整個 #36 conjunction 未替代'},
 {id:'36.2',original:'ids.includes(highSchoolYearOneMomentIds[0])',purpose:'固定 Moment1 出現及完成',responsibility:'Synthetic slot S1; Canonical real decision observation',status:'CONFIRMED occurrence only',evidence:'Both seeds naturally completed ID1; old S1 source-flow proof retained',missing:'New Canonical suite intentionally has no fixed-ID quota; original slot assertion retained'},
 {id:'36.3',original:'ids.includes(highSchoolYearOneMomentIds[2])',purpose:'固定 Moment3 出現及完成',responsibility:'Synthetic S3',status:'UNVERIFIED',evidence:'No ID3 in either reviewed fixed seed',missing:'Legal source-flow producer/PA/completion; no new candidate search authorized'},
 {id:'36.4',original:'completed defense count === defensiveMeaningfulDecisionCount',purpose:'建立與完成守恆',responsibility:'Canonical decision conservation',status:'CONFIRMED zero equals zero',evidence:'All four games: 0 = 0',missing:'Natural nonzero player defensive Moment coverage'},
 {id:'36.5',original:'x.safety < 1400',purpose:'原政策下有界推進',responsibility:'Canonical closure',status:'CONFIRMED',evidence:'88221:110; 88222:107; each replay same',missing:'SS starting fixture unverified'},
 {id:'37.1',original:'x.match.completed (88222)',purpose:'第二固定 seed 終局',responsibility:'Canonical seed88222',status:'CONFIRMED',evidence:'New independent formal suite, both runs',missing:'Original #37 callsite unchanged / original full suite not run'},
 {id:'37.2',original:'getHighSchoolMatchStateIntegrityIssues(x.match).length === 0 (88222)',purpose:'第二固定 seed 狀態正確',responsibility:'Canonical seed88222 integrity',status:'CONFIRMED',evidence:'214 before/after observations per game plus final',missing:'Browser/other career and owner internal microsteps outside scope'},
 ...['hardGrounder','straightAtPlayer','playerRoutinePlay','selfCoverFirst','decisionTension'].map((token,i)=>({id:'38.'+(i+1),original:'!rawTokens.some(raw => t.includes(raw)) / '+token,purpose:'玩家 routine 文字不露 raw identifier',responsibility:'Independent Routine Commentary Contract',status:'CONFIRMED',evidence:'Exact original prefix, __candidate2222 default input, formatter and original #38 line; token absent',missing:'All other routine contexts outside original fixed-case scope'}))
].map(row=>({...row,formallyReplaced:false,originalSourceEdited:false}));
C.capture('findings',{formalAcceptance:acceptance,canonicalSummary:canonical.summary,games,routine:{...routine.summary,originalAssertion: routine.originalAssertion,originalPrefixSha256:routine.originalPrefixSha256},protectionMatrix:matrix,
 knownContractGap:'Last completedMoment receives terminal scores/runners/outs/half but retains original inning; decision-before and resolution-after copied separately; no semantic PASS',
 noAdditionalGameplayAfterAcceptance:true,currentTestBaselineVerification:{ready:'YES for a separately authorized read-only current baseline verification, with historical FAIL/UNVERIFIED/KNOWN CONTRACT GAP explicitly retained',started:false,allTestsGreen:false},
 readyForCommit:'NO',readyForSprint10B:'NO',receiverV2:'DISABLED'});
const originalPath='tests/baseball-match-foundation-2-2-2-test.js',source=fs.readFileSync(path.join(C.root,originalPath),'utf8'),graph=C.json(C.prefix+'focused-source-graph-evidence.json');
const snippets=[graph.actualExposureSnippet,...graph.snippets].map(row=>{
 const value=row.value||row;const text=value.content.find(c=>c.type==='text').text;
 const start=Number(text.match(/start_line: (\d+)/)[1]),end=Number(text.match(/end_line: (\d+)/)[1]);
 const exact=text.split('source: |\n')[1].split('\ncallers:')[0].split('\n').map(l=>l.startsWith('  ')?l.slice(2):l).join('\n').trimEnd();
 const current=fs.readFileSync(path.join(C.root,'script.js'),'utf8').split(/\r?\n/).slice(start-1,end).join('\n');assert.equal(exact,current);
 return{file:'script.js',start,end,currentSourceSha256:C.fileHash('script.js'),exactSource:current,graphSnippetMatchesCurrent:true};
});
C.capture('source',{formalFiles:C.formalFiles.map(file=>({file,sha256:C.fileHash(file),source:fs.readFileSync(path.join(C.root,file),'utf8')})),
 originalTest:{file:originalPath,sha256:C.fileHash(originalPath),exactAssertions:source.split(/\r?\n/).filter(line=>/^verify\("3[678]\./.test(line)),
 originalPrefixSha256:routine.originalPrefixSha256,originalPrefix:source.slice(0,source.indexOf('verify("1.')),unchanged:true},
 formalManifest:canonical.executions[0].facts.sources,exactCurrentSnippets:snippets,priorDeliveriesVerified:true,productionEdits:0});
console.log(JSON.stringify({newSuites:'PASS',games:games.map(g=>({seed:g.seed,ticks:g.ticks,score:g.score,parity:g.priorEvidenceByteParity,snapshot:g.snapshot})),matrixRows:matrix.length,exactCurrentSnippets:snippets.length}));
