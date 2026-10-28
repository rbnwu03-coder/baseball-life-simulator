'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const A=require('./ss-strategic-ground-ball-scenario-contract-v0.1-audit.cjs'),C=A.C;A.init();
const checks=[];
const source=C.json(C.prefix+'source-evidence.json');
for(const r of source.scriptRegions){const now=A.region(r.file,r.name);assert.equal(now.source,r.source);assert.equal(now.startLine,r.startLine);assert.equal(now.endLine,r.endLine);assert.equal(now.sha256,r.sha256);}
for(const r of source.fullSources){assert.equal(C.readSource(r.file),r.source);assert.equal(C.fileHash(r.file),r.sha256);}
for(const r of source.directRanges){assert.equal(C.readSource(r.file).split(/\r?\n/).slice(r.startLine-1,r.endLine).join('\n'),r.source);assert.equal(C.fileHash(r.file),r.sha256);}
checks.push({name:'Exact current source regions/full files/ranges',status:'PASS',regions:source.scriptRegions.length,files:source.fullSources.length,ranges:source.directRanges.length});
const own=C.files().filter(C.isNew), scripts=own.filter(p=>p.endsWith('.cjs'));
for(const file of scripts){const r=cp.spawnSync(process.execPath,['--check',file],{cwd:C.root,encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);checks.push({name:'Reporting script syntax only',file,exitCode:r.status,stdout:r.stdout,stderr:r.stderr});}
for(const file of own.filter(p=>p.endsWith('.json')))C.json(file);
const report=C.readSource(C.report);assert(!report.includes('\uFFFD'));
const future=new Set([C.prefix+'verification-evidence.json',C.prefix+'closeout-evidence.json',C.prefix+'delivery-evidence.json']);
const links=[...report.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m=>m[1]);
for(const target of links){const file=path.posix.normalize('docs/'+target);C.normalized(file);assert(fs.existsSync(path.join(C.root,file))||future.has(file),'Missing report link '+file);}
const facts=C.json(C.prefix+'findings-evidence.json');assert.equal(facts.verdict,'B');assert.equal(facts.newGameplay,0);assert.equal(facts.newFormalSuites,0);assert.equal(facts.UIReady,false);
const hist=C.json(C.prefix+'historical-freshness-evidence.json');assert.equal(hist.captures.length,8);for(const h of hist.captures){assert(h.allRecordedNonDocsHashesMatch);assert.equal(h.executedThisTurn,false);for(const d of h.dependencies)assert.equal(C.fileHash(d.file),d.recorded);}
const integrity=C.integrity();
checks.push({name:'Report links/JSON/freshness/classification and integrity',status:'PASS',reportLinks:links.length,oldHashes:integrity.preservedExistingHashes});
C.capture('verification',{checks,reportSha256:C.fileHash(C.report),newArtifactsReviewed:Object.fromEntries(own.map(p=>[p,C.fileHash(p)])),integrity,newGameplay:0,newScenario:0,newReplay:0,newFormalSuites:0,vmLoads:0,productionOwnersCalled:0,entrySafeChildren:0,formalSuiteResultsThisTurn:'NOT EXECUTED',reportingOnlyFailures:[{kind:'Windows command length',beforeChildSpawn:true,noCaptureCreated:true},{kind:'stdin reporting edit module path',noFileWrite:true},{kind:'stdin Unicode anchor',noFileWrite:true}],syntaxOnlyNotFormalTests:true,protectedContentReadHashedExecuted:false,sourceAndReportDirectlyReviewed:true});
console.log(JSON.stringify({verification:'PASS',reportLinks:links.length,reportingScripts:scripts.length,preservedOldHashes:integrity.preservedExistingHashes,gameplay:0,formalSuites:0}));