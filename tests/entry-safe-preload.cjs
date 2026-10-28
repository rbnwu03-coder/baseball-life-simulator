"use strict";
// Child-only observation. Assertion arguments, results and thrown objects are preserved.
const fs=require("node:fs"),path=require("node:path"),Module=require("node:module"),cp=require("node:child_process"),crypto=require("node:crypto"),{fileURLToPath}=require("node:url");
const config=JSON.parse(process.env.ENTRY_SAFE_CONFIG),target=path.resolve(config.target),self=__filename;
const state={version:1,nonce:config.nonce,entryMode:config.entryMode,target,nodeVersion:process.version,nodeExecutable:process.execPath,entryStarted:false,exportCompleted:false,summary:null,unhandledError:null,
 assertions:{attempted:0,passed:0,thrown:0,unsupportedAsync:0,methods:{},samples:[]},customAssertion:null,gitCompatibility:{enabled:config.gitCompatibility,calls:[]}};
let active=false;
let session=null,customSource=null;
if(config.customAssertion){
 const spec=config.customAssertion;customSource=fs.readFileSync(target,"utf8");const sourceHash=crypto.createHash("sha256").update(fs.readFileSync(target)).digest("hex");
 state.customAssertion={sourceHash,reviewedSourceMatches:sourceHash===spec.sourceSha256,functionName:spec.functionName,expectedCount:spec.expectedCount,count:0,ranges:[],error:null};
 if(state.customAssertion.reviewedSourceMatches&&customSource.split(spec.functionFragment).length===2){
  const {Session}=require("node:inspector");session=new Session();session.connect();session.post("Profiler.enable");session.post("Profiler.startPreciseCoverage",{callCount:true,detailed:true});
 }else state.customAssertion.error="Custom checker source/unique function fragment does not match reviewed contract";
}
const syncMethods=new Set(["ok","equal","notEqual","deepEqual","notDeepEqual","deepStrictEqual","notDeepStrictEqual","strictEqual","notStrictEqual","throws","doesNotThrow","ifError","fail","partialDeepStrictEqual"]);
function assertionSite(){
 const lines=new Error().stack.split("\n").slice(2);
 const line=lines.find(s=>!s.includes(self)&&!s.includes("node:")&&!s.includes("(<anonymous>)"));
 return line&&config.assertionRoots.some(root=>line.includes(root))?line.trim():null;
}
function observedCall(fn,thisArg,args,method){
 const site=active&&assertionSite();if(!site)return Reflect.apply(fn,thisArg,args);
 state.assertions.attempted++;state.assertions.methods[method]=(state.assertions.methods[method]||0)+1;
 const sample={method,site};if(state.assertions.samples.length<40)state.assertions.samples.push(sample);
 try{const value=Reflect.apply(fn,thisArg,args);state.assertions.passed++;sample.returned=true;return value;}
 catch(error){state.assertions.thrown++;sample.returned=false;sample.errorName=error?.name;throw error;}
}
const proxies=new WeakMap();
function observeAssert(original){
 if(proxies.has(original))return proxies.get(original);
 const wrappers=new Map(),proxy=new Proxy(original,{
  apply(fn,thisArg,args){return observedCall(fn,thisArg,args,"assert");},
  get(object,key,receiver){const value=Reflect.get(object,key,receiver);
   if(key==="strict"&&typeof value==="function")return observeAssert(value);
   if(typeof value!=="function"||!syncMethods.has(key)&&key!=="rejects"&&key!=="doesNotReject")return value;
   if(!wrappers.has(key))wrappers.set(key,new Proxy(value,{apply(fn,thisArg,args){
    if(key==="rejects"||key==="doesNotReject"){if(active&&assertionSite())state.assertions.unsupportedAsync++;return Reflect.apply(fn,thisArg,args);}
    return observedCall(fn,thisArg,args,String(key));
   }}));return wrappers.get(key);
  }
 });proxies.set(original,proxy);return proxy;
}
const load=Module._load;
Module._load=function(request,parent,isMain){
 if(isMain&&path.resolve(request)===target&&config.entryMode==="standalone"){state.entryStarted=true;active=true;}
 const value=Reflect.apply(load,this,arguments);
 return ["assert","node:assert","assert/strict","node:assert/strict"].includes(request)?observeAssert(value):value;
};
if(config.gitCompatibility){const original=cp.execFileSync;
 cp.execFileSync=function(command,args,options){
  if(command==="git"&&Array.isArray(args)&&args[0]==="show"&&(options===undefined||options&&typeof options==="object")&&options?.maxBuffer===undefined){
   state.gitCompatibility.calls.push({command,args:[...args],policy:"implicit git show only",maxBuffer:30000000});
   return Reflect.apply(original,this,[command,args,{...options,maxBuffer:30000000}]);
  }
  return Reflect.apply(original,this,arguments);
 };
}
function beginExport(){if(config.entryMode!=="exported-run")throw Error("Wrong export entry mode");state.entryStarted=true;active=true;}
function finishExport(result){state.exportCompleted=true;const s=result?.summary||(result&&["total","passed","failed"].every(k=>Number.isInteger(result[k]))?result:null);
 if(s)state.summary={total:s.total,passed:s.passed,failed:s.failed};active=false;}
function recordError(error){state.unhandledError={name:error?.name,code:error?.code||null,message:error?.message};}
process.on("uncaughtExceptionMonitor",recordError);
process.on("exit",code=>{
 state.exitCode=code;state.mainFilename=process.mainModule?.filename||null;
 state.standaloneMainMatches=state.mainFilename!==null&&path.resolve(state.mainFilename)===target;
 if(session){let completed=false;session.post("Profiler.takePreciseCoverage",(error,result)=>{
  completed=true;if(error){state.customAssertion.error=error.message;return;}
  const script=result.result.find(s=>{try{return path.resolve(s.url.startsWith("file:")?fileURLToPath(s.url):s.url)===target;}catch{return false;}});
  const start=customSource.indexOf(config.customAssertion.functionFragment),end=start+config.customAssertion.functionFragment.trimEnd().length;
  const candidates=script?.functions.filter(f=>f.functionName===config.customAssertion.functionName&&f.ranges[0]?.startOffset===start&&f.ranges[0]?.endOffset===end)||[];
  if(candidates.length===1){state.customAssertion.ranges=candidates[0].ranges;state.customAssertion.count=candidates[0].ranges[0].count;}
  else state.customAssertion.error="Unique reviewed V8 function range not found";
 });if(!completed)state.customAssertion.error="Coverage callback did not complete synchronously at exit";session.disconnect();}
 fs.writeSync(3,JSON.stringify(state)+"\n");
});
module.exports={beginExport,finishExport,recordError};
