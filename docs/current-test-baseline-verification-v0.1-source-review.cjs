"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./current-test-baseline-verification-v0.1-capture.cjs'),i=C.json(C.prefix+'inventory-final-evidence.json'),g=C.json(C.prefix+'focused-source-graph-evidence.json');
const rows=[g.classifySnippet,g.registrySnippet,g.umbrellaSnippet,{value:g.selfTestSnippet}];
const exact=rows.map(row=>{const value=row.value||row,text=value.content.find(c=>c.type==='text').text;
 const file=path.relative(C.root,text.match(/file_path: (.+)/)[1].trim()).replace(/\\/g,'/'),start=Number(text.match(/start_line: (\d+)/)[1]),end=Number(text.match(/end_line: (\d+)/)[1]);
 assert(!C.protectedPaths.has(file));const current=fs.readFileSync(path.join(C.root,file),'utf8').split(/\r?\n/).slice(start-1,end).join('\n');
 const fromGraph=text.split('source: |\n')[1].split('\ncallers:')[0].split('\n').map(l=>l.startsWith('  ')?l.slice(2):l).join('\n').trimEnd();assert.equal(fromGraph,current);
 return{file,start,end,sha256:C.fileHash(file),exactSource:current,graphMatchesCurrent:true};});
const e=C.json('docs/test-infrastructure-sprint-0.1-phase-b-index-caller-evidence.json'),file='tests/source-freeze-reconciliation-exact-contract-test.cjs',text=fs.readFileSync(path.join(C.root,file),'utf8'),callers=i.changedSinceAudit.filter(p=>p.includes('pitch-tactical'));
assert(text.includes('const original = baseline.originalSuiteSources[row.file], proposed = P.allowedSource(row.file, original), body = guardBody(proposed, row);'));
assert(!text.includes('P.read(row.file)'));
const reviewedRows=C.json('docs/source-freeze-contract-reconciliation-v0.1-source-review-evidence.json').suiteRows;
const inputs=[...new Set(['index.html','save.js','receiver-source-snapshot.js',file,'docs/source-freeze-contract-reconciliation-v0.1-phase-b-baseline-evidence.json','docs/source-freeze-contract-reconciliation-v0.1-phase-b-capture.cjs',...reviewedRows.flatMap(r=>r.otherGuardSources)])];
const phaseDelivery=C.json('docs/source-freeze-contract-reconciliation-v0.1-phase-b-delivery-evidence.json');
const archive=C.json('docs/source-freeze-contract-reconciliation-v0.1-phase-b-baseline-evidence.json');
const materialHashes=inputs.map(p=>({path:p,recorded:e.relevantSourceHashesAfter[p]||phaseDelivery.hashes[p]||archive.hashes[p],current:C.fileHash(p),
 provenance:e.relevantSourceHashesAfter[p]?'Actual raw execution relevant hash':phaseDelivery.hashes[p]?'Accepted Phase B delivery hash; original archive strings independently bound to execution hashes below':'Immutable Phase B baseline and preserved-source closeout chain; not an individually recorded raw execution hash'}));
for(const r of materialHashes){assert(r.recorded,'Missing archived input/delivery hash: '+r.path);assert.equal(r.current,r.recorded,r.path);}
const archiveInputs=reviewedRows.map(r=>({file:r.file,archivedSourceSha256:C.hash(archive.originalSuiteSources[r.file]),rawExecutionSourceSha256:e.relevantSourceHashesAfter[r.file]}));
for(const r of archiveInputs)assert.equal(r.archivedSourceSha256,r.rawExecutionSourceSha256,r.file);
const mutableGuards=i.rows.filter(r=>r.status==='PASS'&&r.history[0]?.origin==='Original Reliability Audit'&&C.json('docs/test-reliability-audit-v0.1-inventory-final-evidence.json').rows.find(o=>o.file===r.file)?.tags?.workingTreeGuard)
 .map(r=>({file:r.file,sha256:C.fileHash(r.file),sourceTail:fs.readFileSync(path.join(C.root,r.file),'utf8').split(/\r?\n/).slice(-44).join('\n'),reason:'Reviewed git diff scopes are architecture paths, not the six changed test files. Production bytes, HEAD and index match the audit epoch.'}));
C.capture('source-review',{materialExactSnippets:exact,registrationProof:i.registrySources,
 dedicated80HistoricalReuse:{file,evidence:'docs/test-infrastructure-sprint-0.1-phase-b-index-caller-evidence.json',recordedCurrentCallerHashDrift:callers,
 actualInput:'Archived baseline.originalSuiteSources plus deterministic allowedSource proposal. Current five caller test files are not read/executed by this suite.',
 proofLines:{start:53,end:73,source:text.split(/\r?\n/).slice(52,73).join('\n')},materialHashes,archiveInputs,historicalPASSRetained:true,
 caveat:'This 80-case contract suite validates isolated source proposals; actual current five full suites have their separate post-revision PASS captures.'},
 originalAuditReuse:{knownSourceChanges:i.changedSinceAudit,allOtherOldBaselineHashesSame:true,unresolvedHistoricalDynamicInputGuarantee:'No exhaustive dynamic loader coverage claim'},
 workingTreeScopeGuards:mutableGuards,
 originalMatchAssertions:{file:'tests/baseball-match-foundation-2-2-2-test.js',sha256:C.fileHash('tests/baseball-match-foundation-2-2-2-test.js'),lines:fs.readFileSync(path.join(C.root,'tests/baseball-match-foundation-2-2-2-test.js'),'utf8').split(/\r?\n/).filter(l=>/^verify\("3[678]\./.test(l))},
 protectedContentReadOrHashed:false,newProductionFormalTestRunnerRegistryEdits:0});
console.log(JSON.stringify({exactCurrentGraphSnippets:exact.length,dedicated80MaterialInputHashes:materialHashes.length,workingTreeScopeGuards:mutableGuards.length,sourceReview:'PASS bounded historical reuse'}));
