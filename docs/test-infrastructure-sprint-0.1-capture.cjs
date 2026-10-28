"use strict";
// Sprint bookkeeping only. No discovery-driven suite execution.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),A=require("./test-reliability-audit-v0.1-extract.cjs");
const prefix="docs/test-infrastructure-sprint-0.1-";
function reserve(label){const p=prefix+label+"-evidence.json";assert(!fs.existsSync(path.join(A.root,p)),"Existing capture: "+p);return p;}
function capture(label,data){const p=reserve(label);fs.writeFileSync(path.join(A.root,p),JSON.stringify({sprint:"Test Infrastructure 0.1",createdAt:new Date().toISOString(),...data},null,2)+"\n",{flag:"wx"});return p;}
function start(){reserve("baseline");const safety=A.integrity(),d=A.json(A.prefix+"delivery-evidence.json");for(const[p,h]of Object.entries(d.hashes))assert.equal(A.hash(A.read(p)),h,p);
 const files=A.git("ls-files","--cached","--others","--exclude-standard","-z").split("\0").filter(p=>p&&!A.protectedPaths.has(p)&&!p.startsWith(prefix)&&!p.startsWith("tests/entry-safe-"));
 const hashes=Object.fromEntries(files.map(p=>[p,A.hash(A.read(p))]));
 capture("baseline",{formalBaseline:safety.git.head,git:safety.git,hashes,protectedMetadata:A.metadata(),r6AndAuditDeliveryVerified:true,protectedContentReadOrHashed:false});console.log(JSON.stringify({baselineFiles:files.length,indexEmpty:true,auditVerified:true}));}
function integrity(){const b=A.json(prefix+"baseline-evidence.json");for(const[p,h]of Object.entries(b.hashes))assert.equal(A.hash(A.read(p)),h,p);assert.deepEqual(A.metadata(),b.protectedMetadata);const s=A.gitState();for(const k of["branch","head","main","originMain","index"])assert.equal(s[k],b.git[k],k);
 const originalStatus=text=>text.split(/\r?\n/).filter(x=>x&&!x.slice(3).startsWith(prefix)&&!x.slice(3).startsWith("tests/entry-safe-")).join("\n");assert.equal(originalStatus(s.status),originalStatus(b.git.status));return{preservedHashes:Object.keys(b.hashes).length,git:s,protectedMetadataUnchanged:true,protectedContentReadOrHashed:false,productionDelta:0,originalTestDelta:0};}
module.exports={...A,prefix,reserve,capture,integrity};if(require.main===module)start();
