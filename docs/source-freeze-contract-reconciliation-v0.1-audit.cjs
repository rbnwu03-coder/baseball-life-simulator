"use strict";
// Phase A offline evidence extraction only. No new common checker or suite revision.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),A=require("./test-reliability-audit-v0.1-extract.cjs");
const prefix="docs/source-freeze-contract-reconciliation-v0.1-";
function reserve(label){const p=prefix+label+"-evidence.json";assert(!fs.existsSync(path.join(A.root,p)),"Existing capture: "+p);return p;}
function capture(label,data){const p=reserve(label);fs.writeFileSync(path.join(A.root,p),JSON.stringify({review:"Source Freeze Contract Reconciliation v0.1 Phase A",createdAt:new Date().toISOString(),...data},null,2)+"\n",{flag:"wx"});return p;}
function baseline(){reserve("baseline");const s=A.gitState();assert.equal(s.branch,"main");for(const k of["head","main","originMain"])assert.equal(s[k],"ab3117653945de0b7013636187c446276a96e634");assert.equal(s.index,"");
 const infra=A.json("docs/test-infrastructure-sprint-0.1-baseline-evidence.json"),delivery=A.json("docs/test-infrastructure-sprint-0.1-delivery-evidence.json"),audit=A.json(A.prefix+"delivery-evidence.json");
 for(const[p,h]of Object.entries({...infra.hashes,...delivery.hashes,...audit.hashes}))assert.equal(A.hash(A.read(p)),h,p);assert.deepEqual(A.metadata(),infra.protectedMetadata);
 const files=A.git("ls-files","--cached","--others","--exclude-standard","-z").split("\0").filter(p=>p&&!A.protectedPaths.has(p)&&!p.startsWith(prefix));
 const hashes=Object.fromEntries(files.map(p=>[p,A.hash(A.read(p))]));assert.equal(files.length,1259,"Existing inventory changed; stop for review");
 capture("baseline",{git:s,hashes,protectedMetadata:A.metadata(),priorDeliveriesVerified:true,protectedContentReadOrHashed:false});console.log(JSON.stringify({readableHashes:files.length,protected:A.protectedPaths.size,indexEmpty:true}));}
function integrity(){const b=A.json(prefix+"baseline-evidence.json");for(const[p,h]of Object.entries(b.hashes))assert.equal(A.hash(A.read(p)),h,p);assert.deepEqual(A.metadata(),b.protectedMetadata);const s=A.gitState();for(const k of["branch","head","main","originMain","index"])assert.equal(s[k],b.git[k]);
 const original=text=>text.split(/\r?\n/).filter(x=>x&&!x.slice(3).startsWith(prefix)).join("\n");assert.equal(original(s.status),original(b.git.status));return{preservedHashes:Object.keys(b.hashes).length,git:s,protectedMetadataUnchanged:true,protectedContentReadOrHashed:false};}
module.exports={...A,prefix,reserve,capture,integrity};if(require.main===module)baseline();
