"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),before=require('./preservation-before.json'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...a)=>cp.execFileSync('git',['-c','safe.directory='+root,...a],{cwd:root,encoding:'utf8'}).trim();
const changed=Object.keys(before.hashes).filter(p=>!fs.existsSync(path.join(root,p))||hash(fs.readFileSync(path.join(root,p)))!==before.hashes[p]);
assert.deepEqual(changed,['docs/design-optimization/12-high-school-health-opportunity-candidate.md']);assert.equal(hash(fs.readFileSync(path.join(__dirname,'report-before.md'))),before.hashes[changed[0]]);assert.equal(git('rev-parse','HEAD'),before.head);assert.equal(git('branch','--show-current'),before.branch);assert.equal(git('diff','--cached','--name-only'),'');
fs.writeFileSync(path.join(__dirname,'preservation-after.json'),JSON.stringify({checkedExistingFiles:Object.keys(before.hashes).length,changed,originalReportArchivedExactly:true,historicalEvidenceAndV1PatchUnchanged:true,checkpointHead:before.head,checkpointBranch:before.branch,indexUnchanged:true},null,2)+'\n',{flag:'wx'});console.log({preserved:Object.keys(before.hashes).length,changed});
