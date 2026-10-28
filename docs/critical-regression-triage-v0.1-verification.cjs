"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-triage-v0.1-capture.cjs'),{obs,count}=require('./critical-regression-triage-v0.1-statistics.cjs');
function verify() {
 const g=C.json(C.prefix+'architecture-coverage-evidence.json');
 const snippetChecks=g.snippets.map(s=>{const p=path.relative(C.root,s.file_path).replace(/\\/g,'/');const current=fs.readFileSync(path.join(C.root,p),'utf8').replace(/\r\n?/g,'\n').split('\n').slice(s.start_line-1,s.end_line).join('\n').trimEnd();assert.equal(current,s.source.trimEnd(),p+':'+s.start_line);return{file:p,start:s.start_line,end:s.end_line,currentMatchesSnippet:true,sha256:C.fileHash(p)};});
 const flagged=C.json(C.prefix+'architecture-coverage-evidence.json').coverageSummary.flagged;
 const missedLines=flagged.map(r=>({file:r.path,sha256:C.fileHash(r.path),lines:r.coverage.flatMap(c=>c.ranges.flatMap(range=>fs.readFileSync(path.join(C.root,r.path),'utf8').split(/\r?\n/).slice(range.start-1,range.end).map((text,i)=>({line:range.start+i,text}))))}));
 const x=obs('gradient-rng-isolated','TRIAGE_RNG'),original=obs('gradient-compact-isolated','TRIAGE_GRADIENT');
 const cohort=x.games.slice(-40);assert.equal(cohort.length,40);
 const neutrality=cohort.map(r=>{const o=(r.value===8?original.low:original.high).find(g=>g.seed===r.seed);assert.equal(r.recordSha256,o.recordSha256);assert.equal(r.logSha256,o.logSha256);return{tier:r.value,seed:r.seed,recordSha256:r.recordSha256,logSha256:r.logSha256,exactRecordAndEventLogParity:true};});
 assert.deepEqual(x.lowSummary,original.lowSummary);assert.deepEqual(x.highSummary,original.highSummary);
 const rngSummary={originalCohortGames:40,newStatisticalSamples:0,all40RecordAndLogHashesEqual:true,summaryParity:true,simulationSeedCount:new Set(cohort.map(g=>g.matchSeed)).size,identityFrequency:count(cohort.flatMap(g=>g.identities)),lastPAResultsByTier:Object.fromEntries([8,16].map(v=>[v,count(cohort.filter(g=>g.value===v).map(g=>g.lastPA?.result))])),baseScalarAttributes:Object.fromEntries(['age','ballSense','observe','fitness','instinct','discipline','pressure','primaryPosition','highSchoolRoleCode'].map(k=>[k,original.base[k]])),baseSkills:original.base.baseballSkills,example:cohort.filter(g=>g.value===8&&[1,20].includes(g.seed)).map(g=>({seed:g.seed,identities:g.identities,identityDraws:g.identityDraws,lastPAResult:g.lastPA?.result}))};
 C.capture('verification',{snippetChecks,missedLines,coverageFreshnessFallback:'Relevant sources read directly and hashes locked; all old inventory files rehashed. Metadata signals are not freshness or completeness proof.',rngSummary,neutrality});
 console.log(JSON.stringify(rngSummary,null,2));
 const labels=['opportunity-original','match-original','gradient-original','opportunity-isolated','match-isolated','gradient-isolated','opportunity-dependencies-isolated','gradient-compact-isolated','match-index-manifest-isolated','match-browser-manifest-isolated','gradient-rng-isolated'];
 const runs=labels.map(label=>{const e=C.childPrefix+label+'-evidence.json',r=C.json(e);return {label,evidence:e,status:r.status,exitCode:r.exitCode,elapsedMs:r.elapsedMs,sourceStable:r.sourceStable,entryVerified:r.entryVerified,assertions:r.assertionEvidence?.assertions,actualCommand:r.actualCommand,policy:r.policy,stdoutBytes:Buffer.byteLength(r.stdout),stderrBytes:Buffer.byteLength(r.stderr),signal:r.signal,spawnError:r.spawnError,originalOfficialSuite:label.endsWith('-original')};});
 C.capture('execution-summary',{runs,invocations:runs.length,statusCounts:count(runs.map(r=>r.status)),full251:0,r6Full227:0,firstBase400:0,receiverV2Integration:0,browserFullSuite:0,limitsUnchanged:true,originalOfficialVerdictsPreserved:true});
 console.log(JSON.stringify(runs.map(({label,status,exitCode,elapsedMs,assertions})=>({label,status,exitCode,elapsedMs,attempted:assertions?.attempted,passed:assertions?.passed,thrown:assertions?.thrown}))));
 C.integrity();
}
if(require.main===module)verify();
