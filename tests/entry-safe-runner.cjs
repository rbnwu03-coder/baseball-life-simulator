"use strict";
// Explicit-entry foundation only: no full manifest discovery or execution.
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto");
const root=path.resolve(__dirname,".."),formalBaseline="ab3117653945de0b7013636187c446276a96e634";
const protectedPaths=new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(root,"docs/receiver-execution-v2-sprint-10a3b-baseline-evidence.json"),"utf8")).protectedMetadata));
const registry=Object.freeze({
 "contextual-status-panel":{file:"tests/contextual-status-panel-test.js",entryMode:"standalone",customAssertion:{sourceSha256:"8620a757e01c720106027dc1dfc81e97000be8c81052a85359d4798d2974680a",functionName:"verify",expectedCount:40,functionFragment:'function verify(title, condition) {\n  if (!condition) throw new Error(title);\n  passed += 1;\n  console.log(`✓ ${title}`);\n}\n'}},
 "outcome-transition-hierarchy":{file:"tests/outcome-transition-hierarchy-test.js",entryMode:"standalone",customAssertion:{sourceSha256:"419d5035db166ae027e2ad75321c132821f98e596fc8032b50fed278134d552a",functionName:"verify",expectedCount:36,functionFragment:'function verify(title, condition) {\n  if (!condition) throw new Error(title);\n  passed += 1;\n  console.log(`✓ ${title}`);\n}\n'}},
 "pitch-tactical-decision-production-adapter":{file:"tests/pitch-tactical-decision-production-adapter-test.js",entryMode:"standalone"},
 "pitch-tactical-decision-production-adapter-integration":{file:"tests/pitch-tactical-decision-production-adapter-integration-test.js",entryMode:"standalone"},
 "r6-exact-checker":{file:"tests/receiver-execution-v2-sprint-10a3b-r6-exact-checker-test.cjs",entryMode:"exported-run"}
});
const hash=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
function projectFile(relative){if(typeof relative!=="string"||path.isAbsolute(relative))throw Error("Project-relative path required");
 const absolute=path.resolve(root,relative),p=path.relative(root,absolute).replace(/\\/g,"/");
 if(p.startsWith("../")||!p||protectedPaths.has(p))throw Error("Outside project or protected path: "+relative);
 if(fs.existsSync(absolute)){const real=path.relative(root,fs.realpathSync(absolute)).replace(/\\/g,"/");if(real.startsWith("../")||protectedPaths.has(real))throw Error("Unsafe resolved path");}
 return absolute;
}
function git(...args){return cp.execFileSync("git",args,{cwd:root,encoding:"utf8",windowsHide:true,maxBuffer:30000000});}
function gitBaseline(){return {branch:git("branch","--show-current").trim(),head:git("rev-parse","HEAD").trim(),main:git("rev-parse","main").trim(),originMain:git("rev-parse","origin/main").trim(),index:git("diff","--cached","--name-only").trim()};}
function policy(file,overrides={}){return{timeoutMs:overrides.timeoutMs??(file==="tests/first-base-receive-active-ground-production-integration-test.js"?180000:120000),outputMaxBuffer:overrides.outputMaxBuffer??16000000,implicitGitShowMaxBuffer:30000000,gitCompatibility:overrides.gitCompatibility!==false};}
function classify(result,witness,nonce,entryMode,sourceStable=true){
 const valid=witness?.version===1&&witness.nonce===nonce&&witness.entryMode===entryMode;
 const entryVerified=Boolean(valid&&witness.entryStarted&&(entryMode==="standalone"?witness.standaloneMainMatches:entryMode==="exported-run"));
 const custom=witness?.customAssertion,customVerified=Boolean(custom&&custom.reviewedSourceMatches&&!custom.error&&custom.count>0&&custom.count===custom.expectedCount);
 let status,reason;
 if(result.error||result.signal||result.status===null){status="UNVERIFIED";reason="Timeout/spawn/output-buffer/signal interruption";}
 else if(!sourceStable){status="UNVERIFIED";reason="Relevant source changed during execution";}
 else if(!entryVerified){status="UNVERIFIED";reason="Missing/invalid assertion witness or entry was not invoked";}
 else if(["ENOBUFS","ENOENT","EACCES","MODULE_NOT_FOUND"].includes(witness.unhandledError?.code)){status="UNVERIFIED";reason="Environment/dependency failure prevents verification";}
 else if(result.status!==0||witness.summary?.failed>0){status="FAIL";reason="Executed entry reported assertion/runtime/summary failure";}
 else if(witness.summary&&(!["total","passed","failed"].every(k=>Number.isInteger(witness.summary[k])&&witness.summary[k]>=0)||witness.summary.total!==witness.summary.passed+witness.summary.failed||witness.summary.total===0)){status="UNVERIFIED";reason="Invalid/empty exported summary";}
 else if(entryMode==="exported-run"&&!witness.exportCompleted){status="UNVERIFIED";reason="Exported run did not complete";}
 else if(witness.assertions?.unsupportedAsync>0){status="UNVERIFIED";reason="Asynchronous assertion API was not observed; partial synchronous evidence is insufficient";}
 else if(custom&&!customVerified){status="UNVERIFIED";reason="Reviewed custom checker coverage missing or incomplete";}
 else if(!(witness.assertions?.passed>0)&&!customVerified){status="UNVERIFIED";reason="Exit0 without observed successful synchronous assertions";}
 else{status="PASS";reason="Verified entry completed with observed successful assertions";}
 return{status,reason,entryVerified,successfulAssertions:witness?.assertions?.passed||0,customCheckerInvocations:customVerified?custom.count:0};
}
function runSuite(config){
 const {file,entryMode,evidencePath}=config;if(!["standalone","exported-run"].includes(entryMode))throw Error("Explicit supported entry mode required");
 const target=projectFile(file);if(!/\.(?:js|cjs)$/.test(target))throw Error("CommonJS JS/CJS suite required");
 if(!evidencePath?.startsWith("docs/test-infrastructure-sprint-0.1-")||!evidencePath.endsWith(".json"))throw Error("Independent Sprint0.1 evidence path required");
 const output=projectFile(evidencePath),witnessPath=projectFile(evidencePath.replace(/\.json$/,"-assertions.json"));
 if(fs.existsSync(output)||fs.existsSync(witnessPath))throw Error("Existing evidence; execution refused");
 const relevant=[...new Set([file,...(config.relevantPaths||[]),"tests/entry-safe-runner.cjs","tests/entry-safe-preload.cjs","tests/entry-safe-export-child.cjs"])];
 const before=Object.fromEntries(relevant.map(p=>[p,hash(fs.readFileSync(projectFile(p)))])),baseline=gitBaseline();
 if(baseline.head!==formalBaseline||baseline.originMain!==formalBaseline||baseline.main!==formalBaseline||baseline.branch!=="main"||baseline.index)throw Error("Git baseline/index mismatch");
 const limits=policy(file,config.policy);if(!(limits.timeoutMs>0&&limits.outputMaxBuffer>0))throw Error("Invalid limits");
 const outputFd=fs.openSync(output,"wx");let witnessFd;
 try{witnessFd=fs.openSync(witnessPath,"wx");const nonce=crypto.randomBytes(16).toString("hex"),childConfig={nonce,target,entryMode,gitCompatibility:limits.gitCompatibility,customAssertion:config.customAssertion||null,assertionRoots:[path.join(root,"tests"),path.dirname(target)]};
  const executable=config.nodeExecutable||process.execPath,args=["--require",path.join(root,"tests/entry-safe-preload.cjs"),entryMode==="standalone"?target:path.join(root,"tests/entry-safe-export-child.cjs")],startedAt=new Date().toISOString(),time=process.hrtime.bigint();
  const r=cp.spawnSync(executable,args,{cwd:root,encoding:"utf8",windowsHide:true,timeout:limits.timeoutMs,maxBuffer:limits.outputMaxBuffer,env:{...process.env,ENTRY_SAFE_CONFIG:JSON.stringify(childConfig)},stdio:["ignore","pipe","pipe",witnessFd]});
  const elapsedMs=Number(process.hrtime.bigint()-time)/1e6;
  fs.closeSync(witnessFd);witnessFd=undefined;const rawWitness=fs.readFileSync(witnessPath,"utf8");let witness=null,witnessParseError=null;try{witness=JSON.parse(rawWitness);}catch(e){witnessParseError=e.message;}
  const after=Object.fromEntries(relevant.map(p=>[p,fs.existsSync(projectFile(p))?hash(fs.readFileSync(projectFile(p))):null])),sourceStable=JSON.stringify(before)===JSON.stringify(after);
  const verdict=classify(r,witness,nonce,entryMode,sourceStable),row={suiteName:config.suiteName||file,file,entryMode,actualCommand:[executable,...args],cwd:root,runnerNodeVersion:process.version,nodeVersion:witness?.nodeVersion||null,startedAt,elapsedMs,exitCode:r.status,signal:r.signal,spawnError:r.error?{code:r.error.code,message:r.error.message}:null,policy:limits,environment:{NODE_OPTIONS:process.env.NODE_OPTIONS||null,NODE_PATH:process.env.NODE_PATH||null,TZ:process.env.TZ||null,ENTRY_SAFE_CONFIG:childConfig},assertionEvidence:witness,witnessParseError,witnessPath:path.relative(root,witnessPath).replace(/\\/g,"/"),stdout:r.stdout||"",stderr:r.stderr||"",gitBaseline:baseline,relevantSourceHashesBefore:before,relevantSourceHashesAfter:after,sourceStable,...verdict};
  fs.writeSync(outputFd,JSON.stringify(row,null,2)+"\n");return row;
 }finally{if(witnessFd!==undefined)fs.closeSync(witnessFd);fs.closeSync(outputFd);}
}
function notRun(config){return{suiteName:config.suiteName||config.file,file:config.file,entryMode:config.entryMode,status:"NOT RUN",actualCommand:null,exitCode:null,elapsedMs:null,assertionEvidence:null,reason:"Suite was not started in this invocation"};}
module.exports={root,formalBaseline,protectedPaths,registry,policy,runSuite,classify,notRun};
if(require.main===module){const spec=registry[process.argv[2]];if(!spec||!process.argv[3])throw Error("Usage: node tests/entry-safe-runner.cjs <reviewed-suite-name> <new Sprint0.1 evidence.json>");
 const r=runSuite({...spec,suiteName:process.argv[2],evidencePath:process.argv[3]});console.log(JSON.stringify({suite:r.suiteName,entry:r.entryMode,status:r.status,nodeAssertions:r.successfulAssertions,customChecks:r.customCheckerInvocations,elapsedMs:r.elapsedMs,evidence:process.argv[3]}));if(r.status!=="PASS")process.exitCode=1;
}
