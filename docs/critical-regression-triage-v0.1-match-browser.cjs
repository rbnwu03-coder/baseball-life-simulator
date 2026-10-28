"use strict";
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const C=require('./critical-regression-triage-v0.1-capture.cjs');
if(process.argv[2]==='build') {
 C.integrity();const from=C.prefix+'match-index-manifest-isolated.cjs',raw=fs.readFileSync(path.join(C.root,from),'utf8');
 const before='console, module: { exports: {} },',after='console,';assert.equal(raw.split(before).length-1,1);
 const file=C.prefix+'match-browser-manifest-isolated.cjs',text=raw.replace(before,after);assert.equal(text.replace(after+'\n    document:',before+'\n    document:'),raw);
 assert(!fs.existsSync(path.join(C.root,file)));fs.writeFileSync(path.join(C.root,file),text,{flag:'wx'});
 C.capture('match-browser-contract',{from,fromSha256:C.fileHash(from),file,sha256:C.fileHash(file),change:{before,after},reason:'Original VM advertises module.exports but supplies no require; real index scripts select browser globals when CommonJS module is absent',fixtureSeedDecisionsOriginalAssertionUnchanged:true,originalFullSuiteRemainsFail:true});console.log(file);
} else if(process.argv[2]==='run')C.run('match-browser-manifest-isolated',C.prefix+'match-browser-manifest-isolated.cjs',[C.prefix+'match-browser.cjs']);
else throw Error('Explicit build/run required');
