"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const env=JSON.parse(fs.readFileSync(path.join(__dirname,'environment.json'))),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'spec.json')));
const git=(root,...a)=>cp.execFileSync('git',['-c','safe.directory='+root,'-c','core.autocrlf=false',...a],{cwd:root,maxBuffer:12e6});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),read=(root,p)=>fs.readFileSync(path.join(root,p));
const write=(p,v)=>fs.writeFileSync(path.join(__dirname,p),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const patch=git(env.candidate,'diff','--binary','--','script.js'),shared=git(env.baseline,'diff','--binary','--','tests');
write('candidate.patch',patch);write('shared-manifests.patch',shared);
const files=git(env.baseline,'ls-files','-z').toString().split('\0').filter(Boolean),differences=files.filter(p=>!read(env.baseline,p).equals(read(env.candidate,p)));
assert.deepEqual(differences,['script.js']);
for(const r of env.manifests)for(const root of [env.baseline,env.candidate])assert.equal(hash(read(root,r.file)),r.sha256);
const baselineRegressions=JSON.parse(fs.readFileSync(path.join(__dirname,'regressions-baseline/results.json'))),candidateRegressions=JSON.parse(fs.readFileSync(path.join(__dirname,'regressions-candidate-final/results.json'))),formal=JSON.parse(fs.readFileSync(path.join(__dirname,'formal-final.json')));
assert(formal.rows.every(r=>r.status==='PASS'));
for(const rows of [baselineRegressions,candidateRegressions])assert(rows.every(r=>r.status==='PASS'));
assert.deepEqual(baselineRegressions.map(r=>r.sourceSha256),candidateRegressions.map(r=>r.sourceSha256));
const customProof={};for(const label of ['baseline','candidate-final']){const stdout=fs.readFileSync(path.join(__dirname,'regressions-'+label,'career-save-admission-test.js.stdout.log'),'utf8');assert.match(stdout,/45\/45 通過/);assert.equal((stdout.match(/^✓ /gm)||[]).length,45);customProof[label]={footer:'45/45 通過',printedCustomChecks:45,nodeAssertions:0,qualification:'Original custom verify checker, unchanged source; observed complete numbered output, not a Node assert count.'};}
const names=['getHighSchoolYearOneMatchPresentation','createHighSchoolPlayingTimeOpportunity','refreshHighSchoolYearOneOpportunityHealth','confirmHighSchoolYearOneFollowupOpportunity','refreshHighSchoolYearTwoSpringOpportunity','prepareHighSchoolYearOneMatch','prepareHighSchoolFollowupEvaluationMatch','applyHighSchoolCompetitionMatchSettlement','processHighSchoolYearOneChoice','advanceAfterAction'];
const sourceMap={};for(const label of ['baseline','candidate']){const lines=read(env[label],'script.js').toString().split('\n');sourceMap[label]=Object.fromEntries(names.map(n=>[n,lines.findIndex(s=>s.startsWith('function '+n+'('))+1]).filter(x=>x[1]));}
write('source-map.json',sourceMap);
const lower=formal.observations.filter(r=>r.kind==='lower-readiness').map(r=>({seed:r.seed,role:r.role,first:r.first.map(s=>({score:s.score,usage:s.plan.appearanceType,PA:s.PA})),followup:r.followups.map(s=>({score:s.score,usage:s.plan.appearanceType,PA:s.PA,defensiveInnings:s.defensiveInnings}))}));
const result={base:env.base,branch:env.branch,branchHead:git(env.candidate,'rev-parse','HEAD').toString().trim(),candidateState:'Uncommitted isolated patch; review by exact patch/script hashes. No checkpoint commit or push.',candidatePatchSha256:hash(patch),baselineScriptSha256:hash(read(env.baseline,'script.js')),candidateScriptSha256:hash(read(env.candidate,'script.js')),sharedManifestPatchSha256:hash(shared),comparedTrackedFiles:files.length,baselineCandidateByteDifferences:differences,baselineDiff:git(env.baseline,'diff','--name-only').toString().trim().split('\n'),candidateDiff:git(env.candidate,'diff','--name-only').toString().trim().split('\n'),manifestParity:true,unchangedRegressionSourceHashes:true,baselineRegressions:baselineRegressions.map(({file,status})=>({file,status})),candidateRegressions:candidateRegressions.map(({file,status})=>({file,status})),customProof,formalCaseGroups:{pass:formal.rows.length,fail:0},seeds:spec.seeds,zeroBodyRecordPairs:6,lowerReadiness:lower,healthCalibration:false};
write('summary.json',result);console.log(JSON.stringify(result,null,2));
