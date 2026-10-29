"use strict";
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),b=JSON.parse(fs.readFileSync(path.join(__dirname,'preservation-before.json'))),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const changes=Object.keys(b.hashes).filter(p=>!fs.existsSync(path.join(root,p))||hash(p)!==b.hashes[p]);
const git=(...a)=>cp.execFileSync('git',['-c','safe.directory='+root,...a],{cwd:root,encoding:'utf8'}).trim();
const result={checkedExistingFiles:Object.keys(b.hashes).length,changed:changes,unexpected:changes.filter(p=>p!=='docs/design-optimization/README.md'),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),trackedStatus:git('status','--short','--untracked-files=no'),historicalEvidenceAndFourManifestBytesPreserved:changes.every(p=>p==='docs/design-optimization/README.md')};
assert.equal(result.head,b.head);assert.equal(result.branch,b.branch);assert.equal(result.unexpected.length,0);assert.equal(git('diff','--cached','--name-only'),'');
fs.writeFileSync(path.join(__dirname,'preservation-after.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(result);
