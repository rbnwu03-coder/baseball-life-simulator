"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-triage-v0.1-capture.cjs');
if(process.argv[2]==='build') {
 C.integrity();
 const original='tests/baseball-match-foundation-2-2-2-test.js',raw=fs.readFileSync(path.join(C.root,original),'utf8');
 const instrumented=fs.readFileSync(path.join(C.root,C.prefix+'match-isolated.cjs'),'utf8');
 const prefix=instrumented.slice(0,instrumented.indexOf('verify("1.'));
 const statement=instrumented.split('\n').find(l=>l.startsWith('verify("36.'));
 const manifest=prefix.match(/const files = \[[\s\S]*?\];/)[0];
 const indexFiles=[...fs.readFileSync(path.join(C.root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]).filter(x=>x!=='application-controller.js');
 const derived=prefix.replace(manifest,'const files = '+JSON.stringify(indexFiles,null,2)+';')+'\n'+statement+'\n';
 const file=C.prefix+'match-index-manifest-isolated.cjs';assert(!fs.existsSync(path.join(C.root,file)));fs.writeFileSync(path.join(C.root,file),derived,{flag:'wx'});
 C.capture('match-manifest-contract',{original,originalSha256:C.fileHash(original),file,derivedSha256:C.fileHash(file),indexSha256:C.fileHash('index.html'),indexFiles,changes:['Use exact current index script order, excluding application-controller.js as existing career VM does','Run original #36 only; other checks not invoked','Carry forward observation-only loop and operand log'],originalFixtureFunctionAndSeedPreserved:true,originalBooleanCondition:raw.split('\n').find(l=>l.startsWith('verify("36.')),assertionNotWeakened:true});
 console.log(JSON.stringify({file,modules:indexFiles.length,check:'original #36 only'}));
} else if(process.argv[2]==='run') C.run('match-index-manifest-isolated',C.prefix+'match-index-manifest-isolated.cjs',[C.prefix+'match-manifest.cjs']);
else throw Error('Explicit build/run required');
