'use strict';
// New Sprint 10A captures only. Default execution is read-only and invokes only
// the readiness audit: existing LEGACY fixtures, never candidate execution.
const assert=require('assert/strict');
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const focused=require('./receiver-execution-v2-sprint-10a-readiness-test.cjs');
const baseline=focused.baseline;
const captures=Object.freeze({focused:'docs/receiver-execution-v2-sprint-10a-focused-evidence.json'});
const sources=Object.freeze([
  'tests/receiver-execution-v2-sprint-10a-readiness-test.cjs',
  'tests/receiver-execution-v2-sprint-10a-runner.cjs',
  'docs/receiver-execution-v2-sprint-10a-source-adapter-contract.json',
  'docs/receiver-execution-v2-sprint-10a-shadow-storage-contract.json'
]);
const ownerPaths=Object.freeze([
  'index.html','script.js','save.js','match-situation-lifecycle.js',
  'defensive-decision-throw-foundation.js','defensive-runner-throw-settlement-foundation.js',
  'force-advancement.js',
  'match-game-record.js','match-experience-development.js',
  'receiver-execution-v2-foundation.js','receiver-execution-v2-admission-timing-foundation.js'
]);
const git=args=>cp.execFileSync('git',args,{cwd:root,windowsHide:true,encoding:'utf8',maxBuffer:30e6});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
function hashes(paths){return Object.fromEntries(paths.map(file=>{
  assert(!focused.protectedPaths.has(file),'PROTECTED_CONTENT_READ');
  return [file,{sha256:hash(fs.readFileSync(path.join(root,file))),size:fs.statSync(path.join(root,file)).size}];
}));}
function currentGit(){return {branch:git(['branch','--show-current']).trim(),head:git(['rev-parse','HEAD']).trim(),
  originMain:git(['rev-parse','origin/main']).trim(),index:git(['diff','--cached','--name-only']).trim()};}
function run(){
  const start=currentGit();assert.equal(start.branch,'main');assert.equal(start.head,baseline);assert.equal(start.originMain,baseline);assert.equal(start.index,'');
  const ownerBefore=hashes(ownerPaths),sourceBefore=hashes(sources);
  for(const file of ownerPaths){
    const actual=fs.readFileSync(path.join(root,file));
    const committed=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,windowsHide:true,maxBuffer:30e6});
    assert.equal(actual.toString('utf8').replace(/\r\n/g,'\n'),committed.toString('utf8').replace(/\r\n/g,'\n'),'Existing owner changed: '+file);
  }
  const result=focused.run();assert.equal(result.summary.failed,0,'Readiness suite failure');
  assert.deepEqual(hashes(ownerPaths),ownerBefore);assert.deepEqual(hashes(sources),sourceBefore);assert.deepEqual(currentGit(),start);
  return {...result,runner:{baseline,mode:'READINESS_ONLY_NO_CANDIDATE_EXECUTION',
    sourceHashes:sourceBefore,existingOwnerHashes:ownerBefore,ownersUnchanged:true,
    gitBefore:start,gitAfter:currentGit(),fullRepositoryManifest:'NOT_RUN',
    priorFocusedSuites:'NOT_RERUN_THIS_READINESS_AUDIT',capturePolicy:'exclusive-create; never overwrite originals'}};
}
module.exports={run,baseline,captures,sources,ownerPaths};
if(require.main===module){
  const args=process.argv.slice(2);assert(args.every(arg=>arg==='--capture-final'),'Unsupported option');
  if(args.includes('--capture-final'))for(const file of Object.values(captures))assert(!fs.existsSync(path.join(root,file)),'Capture already exists: '+file);
  const value=run();
  if(args.includes('--capture-final'))for(const file of Object.values(captures))fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({suite:value.suite,...value.summary,runtimeEnabled:false,fullShadowComparison:false,capturesWritten:args.includes('--capture-final')}));
}
