"use strict";
const fs=require("fs"),path=require("path"),os=require("os"),cp=require("child_process"),readline=require("readline"),A=require("./high-school-opportunity-probability-calibration-audit.cjs");
const get=(flag,fallback)=>{const i=process.argv.indexOf(flag);return i<0?fallback:process.argv[i+1];};
async function worker(){
  const mode=get("--worker"),count=Number(get("--sample",5000)),file=get("--checkpoint"),env=require("./high-school-opportunity-probability-calibration-career.cjs")();
  const done=new Set();if(fs.existsSync(file)){const input=readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity});for await(const line of input)if(line)done.add(JSON.parse(line).careerAuditId);}
  const order=Array.from({length:count},(_,i)=>i+1);if(mode==="repeat")order.reverse();if(mode==="trace")order.sort((a,b)=>(a%2)-(b%2)||a-b);
  let completed=done.size;for(const index of order){const id="audit-career-"+String(index).padStart(6,"0");if(done.has(id))continue;
    const row=A.compactCareer(env.runCareer(index,mode==="disabled"?"disabled":"enabled",mode==="trace"));
    const integrity=A.aggregateExposure([row]).integrity;
    const bad=Object.entries(integrity).filter(([k,v])=>!["reloadSamples","antiReroll:declined","antiReroll:expired","antiReroll:cancelled"].includes(k)&&v!==0);
    if(bad.length)throw Error("STOP "+id+" "+JSON.stringify(bad));
    fs.appendFileSync(file,JSON.stringify(row)+"\n");completed++;if(completed%50===0||completed===count)console.log(mode+" "+completed+"/"+count);
  }
}
async function readRows(file){const rows=[],input=readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity});for await(const line of input)if(line)rows.push(JSON.parse(line));return rows;}
async function main(){
  const sample=Number(get("--sample",5000)),output=path.resolve(get("--out","docs/high-school-opportunity-probability-calibration.json"));if(!Number.isInteger(sample)||sample<1)throw Error("Invalid sample count");
  const digest=A.signature(["e91fc49",sample,...[__filename,path.join(__dirname,"high-school-opportunity-probability-calibration-audit.cjs"),path.join(__dirname,"high-school-opportunity-probability-calibration-career.cjs"),path.join(__dirname,"high-school-opportunity-exposure-flow.cjs"),path.join(__dirname,"../high-school-opportunity-selection.js"),path.join(__dirname,"../high-school-opportunity-probability.js")].map(p=>fs.readFileSync(p,"utf8"))]);
  const directory=path.join(os.tmpdir(),"hs-opportunity-calibration-"+digest.slice(0,16));fs.mkdirSync(directory,{recursive:true});
  console.log("Audit "+sample+" identities in four full career runs; checkpoints "+directory);
  const children=[];
  try{await Promise.all(["enabled","repeat","trace","disabled"].map(mode=>new Promise((resolve,reject)=>{
    const child=cp.spawn(process.execPath,[__filename,"--worker",mode,"--sample",String(sample),"--checkpoint",path.join(directory,mode+".jsonl")],{stdio:["ignore","pipe","pipe"],windowsHide:true});children.push(child);child.stdout.on("data",b=>process.stdout.write(b));let err="";child.stderr.on("data",b=>{err+=b;process.stderr.write(b);});child.on("error",reject);child.on("exit",code=>code===0?resolve():reject(Error(mode+" failed: "+err)));
  })));}catch(error){for(const child of children)if(child.exitCode===null)child.kill();fs.writeFileSync(output,JSON.stringify({status:"FAIL",metadata:{baseline:"e91fc49",auditVersion:A.VERSION,sampleCount:sample},failures:[error.message],checkpointDirectory:directory},null,2)+"\n");throw error;}
  const summaries={};for(const mode of ["enabled","repeat","trace","disabled"]){summaries[mode]=A.aggregateExposure(await readRows(path.join(directory,mode+".jsonl")));console.log("Aggregated "+mode);}
  const report=A.buildCalibrationReport(summaries.enabled,summaries.disabled,A.aggregatePairwiseWeights(Math.max(1000,sample)),{repeatEqual:A.signature(summaries.enabled)===A.signature(summaries.repeat),traceEqual:A.signature(summaries.enabled)===A.signature(summaries.trace)});
  report.metadata.auditSourceDigest=digest;report.metadata.checkpointFormat="Per-career JSONL in OS temp directory; candidate/record references SHA-256; replay a career with the same fixed identity.";
  fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({careers:sample,windows:report.windows,multiCandidateWindows:report.multiCandidateWindows,sources:report.source_distribution,weights:report.weight_distribution,mix:report.probability_enabled_vs_disabled.enabled,fallback:report.fallback_usage,uniqueOpponentMean:report.opponent_diversity.unique.mean,repeatOpponentShare:report.opponent_diversity.repeatShare,campInflation:report.synthetic.campInflationRatio,antiRerollFailures:report.integrity.antiRerollFailures,budgetViolations:report.integrity.budgetViolation,frequencyViolations:report.integrity.frequencyViolation,warnings:report.warnings,failures:report.failures,status:report.status},null,2));
  if(report.status==="FAIL")process.exitCode=1;
}
(get("--worker",null)?worker():main()).catch(error=>{console.error(error.stack);process.exitCode=1;});
