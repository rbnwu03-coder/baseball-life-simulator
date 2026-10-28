"use strict";
// Offline discovery/evidence bookkeeping only. No suite auto-discovery execution.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const R=require("../tests/receiver-execution-v2-sprint-10a3b-r6-runner.cjs");
const {root,read,json,hash,git,protectedPaths}=R;
const prefix="docs/test-reliability-audit-v0.1-";
function reserve(label){const p=prefix+label+"-evidence.json";assert(!fs.existsSync(path.join(root,p)),"Existing capture: "+p);return p;}
function capture(label,data){const p=reserve(label);fs.writeFileSync(path.join(root,p),JSON.stringify({audit:"Test Reliability Audit v0.1",createdAt:new Date().toISOString(),formalBaseline:R.baseline,node:process.version,...data},null,2)+"\n",{flag:"wx"});return p;}
function metadata(){return Object.fromEntries([...protectedPaths].map(p=>{const s=fs.statSync(path.join(root,p));return[p,{size:s.size,mtimeMs:s.mtimeMs}];}));}
function gitState(){return{branch:git("branch","--show-current").trim(),head:git("rev-parse","HEAD").trim(),main:git("rev-parse","main").trim(),originMain:git("rev-parse","origin/main").trim(),index:git("diff","--cached","--name-only").trim(),status:git("status","--short")};}
function start(){reserve("baseline");const state=gitState();assert.equal(state.branch,"main");for(const k of["head","main","originMain"])assert.equal(state[k],R.baseline);assert.equal(state.index,"");
  const files=git("ls-files","--cached","--others","--exclude-standard","-z").split("\0").filter(p=>p&&!protectedPaths.has(p)&&!p.startsWith("docs/test-reliability-audit-v0.1"));
  const hashes=Object.fromEntries(files.map(p=>[p,hash(read(p))])),before=json("docs/receiver-execution-v2-sprint-10a3b-r6-baseline-evidence.json"),delivery=json("docs/receiver-execution-v2-sprint-10a3b-r6-delivery-evidence.json"),change=json("docs/receiver-execution-v2-sprint-10a3b-r6-source-change-evidence.json");
  for(const[p,h]of Object.entries(before.hashes))assert.equal(hashes[p],p===R.pitch?change.afterTestSha256:h,p);for(const[p,h]of Object.entries(delivery.hashes))assert.equal(hashes[p],h,p);assert.deepEqual(metadata(),before.protectedMetadata);
  capture("baseline",{git:state,hashes,protectedMetadata:metadata(),r6DeliveryAndWipVerified:true,protectedContentReadOrHashed:false});console.log(JSON.stringify({readableBaselineFiles:files.length,protectedPaths:protectedPaths.size,indexEmpty:true}));}
function integrity(){const b=json(prefix+"baseline-evidence.json"),changes=Object.entries(b.hashes).filter(([p,h])=>hash(read(p))!==h).map(([p])=>p);assert.deepEqual(changes,[]);const state=gitState();assert.equal(state.head,R.baseline);assert.equal(state.originMain,R.baseline);assert.equal(state.index,"");assert.deepEqual(metadata(),b.protectedMetadata);return{changedExistingPaths:changes,preservedHashes:Object.keys(b.hashes).length,protectedMetadataUnchanged:true,protectedContentReadOrHashed:false,git:state};}
module.exports={root,read,json,hash,git,protectedPaths,prefix,reserve,capture,integrity,metadata,gitState};
if(require.main===module){if(process.argv[2]==="baseline")start();else throw Error("Offline audit only; explicit baseline mode required");}
