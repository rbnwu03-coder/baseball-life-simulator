"use strict";
// Exclusive captures only; no legacy suite execution, Git mutation or protected reads.
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"..");
const F=require("../receiver-execution-v2-foundation.js"),T=require("./receiver-execution-v2-pure-contract-test.cjs");
const sha=p=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,p))).digest("hex");
const git=(...args)=>cp.execFileSync("git",args,{cwd:root,encoding:"utf8",maxBuffer:30*1024*1024}).trimEnd();
const output={
  schema:"docs/receiver-execution-v2-sprint-8-final-contract-schema.json",
  specification:"docs/receiver-execution-v2-sprint-8-contract-specification.json",
  focused:"docs/receiver-execution-v2-sprint-8-focused-evidence.json",
  runtime:"docs/receiver-execution-v2-sprint-8-cross-runtime-evidence.json",
  integrity:"docs/receiver-execution-v2-sprint-8-non-interference-evidence.json"
};
function schema() {
  const token={type:"string",pattern:"^[A-Za-z0-9_.:|/\\-]{1,512}$"},enumOf=(...values)=>({enum:values});
  const integer=(min=0,max=1000000000)=>({type:"integer",minimum:min,maximum:max});
  const ref=name=>({$ref:"#/$defs/"+name});
  const obj=properties=>({type:"object",properties,required:Object.keys(properties),additionalProperties:false});
  const time=obj({version:{const:F.versions.timing},originId:token,status:{const:"known"},ticks:integer()});
  const unknown=obj({version:{const:F.versions.timing},originId:token,status:{const:"unknown"},reason:token});
  const capabilities=obj(Object.fromEntries(["reaction","range","mobility","catching","fielding","arm","throwing","decision"].map(k=>[k,integer(0,20)])));
  const source=obj({classification:enumOf("A","B","C"),scope:enumOf("pureFixture","ownedInput"),owner:token,reference:token,version:token});
  const physical=obj({version:{const:F.versions.physical},matchId:token,plateAppearanceId:token,contactId:token,physicalIdentity:token});
  const actor=obj({actorId:token,position:enumOf("P","C","1B","2B","3B","SS","LF","CF","RF")});
  const target=obj({runnerId:token,base:enumOf("first","second","third","home")});
  const identity=obj({playId:token,physical:ref("physical"),leg:obj({actionId:token,sourceThrowActionId:token,physicalSlot:enumOf("primaryThrow","relayThrow"),parentActionId:{anyOf:[token,{type:"null"}]}}),thrower:ref("actor"),receiver:ref("actor"),target:ref("target")});
  const context=obj({initialOuts:integer(0,2),originId:token,routeId:token,competitionLevel:token,environmentId:token,receiverAvailable:{type:"boolean"}});
  const input=obj({contractVersion:{const:F.versions.contract},versions:obj(Object.fromEntries(["execution","adapter","timing","sampler","effort"].map(k=>[k,{const:F.versions[k]}]))),identity:ref("identity"),context:ref("context"),
    handoff:obj({playId:token,physicalIdentity:token,throwerId:token,receiverId:token,runnerId:token,base:enumOf("first","second","third","home")}),
    capabilities:obj({actorId:token,adapterVersion:{const:F.versions.adapter},values:ref("capabilities")}),ownedSample:{type:"number",minimum:0,exclusiveMaximum:1},
    delivery:obj({actionId:token,upstreamActionId:token,upstreamStatus:enumOf("completed","failed","notAttempted"),status:enumOf("completed","notAttempted"),accuracy:enumOf("onTarget","challenging","offline","none"),quality:enumOf("clean","challenging","none"),launch:ref("time"),ballArrival:ref("time")}),
    positioning:obj({actionId:token,startContext:enumOf("atBase","covering","lateCover","distant"),movementMdu:integer(0,8),startTime:ref("time")}),
    secure:obj({actionId:token,demandMilli:integer(0,30000),cleanDelayTicks:integer(0,1000000),bobbleDelayTicks:integer(0,1000000)}),
    contest:obj({actionId:token,type:enumOf("force","batterBeforeFirst","tag"),attempted:{type:"boolean"},contact:{type:"boolean"},legality:obj({status:enumOf("eligible","ineligible","unknown"),runnerId:token,base:enumOf("first","second","third","home"),sourceActionId:token}),delayTicks:integer(0,1000000),runnerArrival:ref("runnerTime")}),
    provenance:obj(Object.fromEntries(["physicalIdentity","actors","capabilities","delivery","positioning","runnerArrival","contest"].map(k=>[k,ref("source")]))),
    effortReference:{anyOf:[{type:"null"},obj({version:{const:F.versions.effort},status:enumOf("uncalibrated","calibrated"),position:actor.properties.position,competitionLevel:token,environmentId:token,referenceId:token,capabilities:ref("capabilities"),provenance:ref("source")})]},
    continuation:{anyOf:[{type:"null"},obj({firstRetirement:obj({status:enumOf("completed","failed"),actionId:token,runnerId:token,base:target.properties.base,outsBefore:integer(0,2),outsAfter:integer(0,3)}),pivot:obj({status:enumOf("completed","failed","notAttempted"),actorId:token,actionId:token}),provenance:ref("source")})]}
  });
  const stageCommon={stage:{type:"string"},status:{type:"string"},playId:token,physicalIdentity:token,legActionId:token,receiverId:token,target:ref("target"),actionId:token};
  // Closed union of actual serialized stage shapes, not a promise of runtime admission.
  const variant=(name,status,extra)=>obj({...stageCommon,stage:{const:name},status:{const:status},...extra});
  const reason={reason:token},notAttempt={secured:{const:false},attempted:{const:false},...reason};
  const delivery={anyOf:[variant("delivery","blocked",reason),variant("delivery","notAttempted",reason),variant("delivery","insufficient",reason),
    ...["completed","offline"].map(s=>variant("delivery",s,{accuracy:enumOf("onTarget","challenging","offline"),quality:enumOf("clean","challenging"),launch:ref("knownTime"),ballArrival:ref("knownTime"),upstreamActionId:token}))]};
  const positionCompletion={completion:ref("knownTime"),durationTicks:integer(0,1000000000)};
  const positioning={anyOf:[variant("positioning","blocked",reason),...["unavailable","unreachable"].map(s=>variant("positioning",s,{ready:{const:false}})),variant("positioning","insufficient",{ready:{const:false},...reason}),
    variant("positioning","positionedWithoutReception",{ready:{const:false},...positionCompletion}),variant("positioning","ready",{ready:{const:true},...positionCompletion}),variant("positioning","late",{ready:{const:false},...positionCompletion})]};
  const secure={anyOf:[variant("secure","notAttempted",notAttempt),variant("secure","failedHands",{secured:{const:false},attempted:{const:true},handsMarginMilli:integer(-31000,30000)}),
    ...["cleanControl","bobbleControl"].map(s=>variant("secure",s,{secured:{const:true},attempted:{const:true},handsMarginMilli:integer(-31000,30000),completion:ref("knownTime"),possession:obj({actorId:token,actionId:token,sourceThrowActionId:token})}))]};
  const candidate=obj({kind:{const:"unappliedRetirementCandidate"},runnerId:token,base:target.properties.base,receiverId:token,actionId:token,type:enumOf("force","batterBeforeFirst","tag"),initialOuts:integer(0,2),wouldBeThirdOut:{type:"boolean"},legalScoring:{const:"requiresExistingThirdOutOwner"},possessionActionId:token});
  const contest={anyOf:[variant("contest","notAttempted",{candidate:{type:"null"},...reason}),variant("contest","ineligible",{candidate:{type:"null"}}),
    variant("contest","insufficient",{candidate:{type:"null"},...reason}),variant("contest","insufficient",{completion:ref("knownTime"),candidate:{type:"null"},...reason}),
    ...["retirementCandidate","tie","alreadySafe"].map(s=>variant("contest",s,{completion:ref("knownTime"),runnerArrival:ref("knownRunnerTime"),timingMarginTicks:integer(-2003000015,2000000000),candidate:s==="retirementCandidate"?ref("candidate"):{type:"null"}}))]};
  const execution=obj({status:{const:"ok"},runtimeEnabled:{const:false},inputDigest:{type:"string",pattern:"^[0-9a-f]{64}$"},identity:ref("identity"),
    stages:obj({delivery:ref("deliveryOutput"),positioning:ref("positioningOutput"),secure:ref("secureOutput"),contest:ref("contestOutput")}),
    scorerFacts:obj({status:{const:"insufficientScorerFacts"},referenceVersion:{const:F.versions.effort},referenceId:{anyOf:[token,{type:"null"}]},reason:enumOf("missingOrdinaryEffortReference","uncalibratedOrdinaryEffortReference"),officialScorerEligibility:{const:"insufficient"},officialError:{type:"null"},wouldBeAssist:{type:"null"}}),
    application:obj({matchStateWrites:{const:0},gameRecordWrites:{const:0},rngCallbacks:{const:0},actualRetirements:{const:0}})});
  const invalid=obj({status:enumOf("invalid","insufficient"),code:token,details:{type:"array",items:{type:"string"}}});
  return {$schema:"https://json-schema.org/draft/2020-12/schema",title:"Receiver v2 isolated pure input and output contract",$ref:"#/$defs/input",
    $comment:"Structural schema only. Runtime validate additionally checks canonical data, cross-field identity, provenance, timing and causal dependencies. Calibrated profile is structurally recognized but returns insufficient until independent calibration authority exists. Not a formal Match/Save schema.",
    $defs:{input,physical,actor,target,identity,context,capabilities,source,time:{anyOf:[time,unknown]},runnerTime:{anyOf:[{...time,properties:{...time.properties,ticks:integer(-1000000000)}},unknown]},
      knownTime:{...time,properties:{...time.properties,ticks:integer(0,1003000015)}},knownRunnerTime:{...time,properties:{...time.properties,ticks:integer(-1000000000)}},
      candidate,deliveryOutput:delivery,positioningOutput:positioning,secureOutput:secure,contestOutput:contest,execution,invalid,result:{anyOf:[ref("execution"),ref("invalid")]}}};
}
// Independent small JSON-Schema evaluator for the exact keywords used above.
// Identity/causality tests remain separate from structural schema validation.
function conforms(value,s,defs) {
  if(s.$ref)return conforms(value,defs[s.$ref.split("/").pop()],defs);
  if(s.anyOf)return s.anyOf.some(v=>conforms(value,v,defs));
  if(Object.hasOwn(s,"const")&&value!==s.const)return false;
  if(s.enum&&!s.enum.includes(value))return false;
  if(s.type){const type=value===null?"null":Array.isArray(value)?"array":typeof value;if(s.type==="integer"?!Number.isInteger(value):type!==s.type)return false;}
  if(s.minimum!==undefined&&value<s.minimum||s.maximum!==undefined&&value>s.maximum||s.exclusiveMaximum!==undefined&&value>=s.exclusiveMaximum)return false;
  if(s.pattern&&!new RegExp(s.pattern).test(value))return false;
  if(s.required&&s.required.some(k=>!Object.hasOwn(value,k)))return false;
  if(s.properties){if(s.additionalProperties===false&&Object.keys(value).some(k=>!Object.hasOwn(s.properties,k)))return false;for(const [key,child]of Object.entries(s.properties))if(Object.hasOwn(value,key)&&!conforms(value[key],child,defs))return false;}
  if(s.items&&!value.every(v=>conforms(v,s.items,defs)))return false;
  return true;
}
function crossRuntime() {
  const expected=T.runtimeProbe();
  const cold=JSON.parse(cp.execFileSync(process.execPath,["--jitless",path.join(__dirname,"receiver-execution-v2-pure-contract-test.cjs"),"--cross-runtime-probe"],{cwd:root,encoding:"utf8",maxBuffer:10*1024*1024,stdio:["pipe","pipe","pipe"]}));
  assert.deepEqual(cold,expected);
  const rows=expected.cases.flatMap(c=>Object.entries(c.sealed.samples.stages).map(([stage,s])=>({case:c.name,stage,canonical:s.canonical,sha256:s.sha256,u32:s.u32,
    unitHex:F.binary64(s.unit),capabilities:c.sealed.input.capabilities.values,movementMdu:c.sealed.input.positioning.movementMdu,demandMilli:c.sealed.input.secure.demandMilli})));
  // Independent .NET SHA-256/UTF-8/u32/double and integer-stage arithmetic reference.
  const powershell=String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$receiverRows = [Console]::In.ReadToEnd() | ConvertFrom-Json
$receiverResults = @()
foreach ($receiverRow in $receiverRows) {
  $receiverHasher = [System.Security.Cryptography.SHA256]::Create()
  try { $receiverHash = $receiverHasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($receiverRow.canonical)) } finally { $receiverHasher.Dispose() }
  $receiverHex = -join ($receiverHash | ForEach-Object { $_.ToString('x2') })
  $receiverU32 = [long]$receiverHash[0]*16777216 + [long]$receiverHash[1]*65536 + [long]$receiverHash[2]*256 + [long]$receiverHash[3]
  $receiverUnit = ([double]$receiverU32 + 0.5) / 4294967296.0
  $receiverBits = [BitConverter]::GetBytes($receiverUnit)
  if ([BitConverter]::IsLittleEndian) { [Array]::Reverse($receiverBits) }
  $receiverBitHex = -join ($receiverBits | ForEach-Object { $_.ToString('x2') })
  $receiverBin = ([long]$receiverU32 -shr 28) - 8
  $receiverDuration = [Math]::Max(100, 1500 - 60*$receiverRow.capabilities.reaction + 10*$receiverBin) + [Math]::Ceiling($receiverRow.movementMdu*1000000.0 / (500 + 60*$receiverRow.capabilities.mobility))
  $receiverMargin = 650*$receiverRow.capabilities.catching + 350*$receiverRow.capabilities.fielding + 125*$receiverBin - $receiverRow.demandMilli
  $receiverResults += [PSCustomObject]@{ case=$receiverRow.case; stage=$receiverRow.stage; sha256=$receiverHex; u32=$receiverU32; unitHex=$receiverBitHex; durationTicks=[long]$receiverDuration; handsMarginMilli=[long]$receiverMargin }
}
$receiverResults | ConvertTo-Json -Depth 6 -Compress
`;
  const dotnet=JSON.parse(cp.execFileSync("powershell.exe",["-NoProfile","-NonInteractive","-EncodedCommand",Buffer.from(powershell,"utf16le").toString("base64")],{input:JSON.stringify(rows),encoding:"utf8",maxBuffer:1024*1024,timeout:30000}));
  const comparisons=rows.map((r,index)=>{
    const actual=dotnet[index],bin=(r.u32>>>28)-8;
    assert.equal(actual.sha256,r.sha256);assert.equal(actual.u32,r.u32);assert.equal(actual.unitHex,r.unitHex);
    const duration=Math.max(100,1500-60*r.capabilities.reaction+bin*10)+Math.ceil(r.movementMdu*1000000/(500+60*r.capabilities.mobility));
    const margin=650*r.capabilities.catching+350*r.capabilities.fielding+125*bin-r.demandMilli;
    assert.equal(actual.durationTicks,duration);assert.equal(actual.handsMarginMilli,margin);
    return {...r,durationTicks:duration,handsMarginMilli:margin,dotnet:actual,status:"PASS"};
  });
  return {status:"PASS",normalNode:process.version,jitlessSeparateProcess:{status:"PASS",fullProbeEqual:true,cases:expected.cases.length},
    browserStyleVm:"Covered in focused suite: UMD, no CommonJS/imports, forbidden Math.random. Not a real browser engine test.",dotnet:{runtime:"Windows PowerShell/.NET",rows:comparisons.length,status:"PASS"},
    canonicalGolden:expected.encoding,utf8GoldenHash:expected.sha,ownedSampleBinary64:expected.binary64,comparisons,
    limits:["No claim of statistical independence or calibrated distribution.","No real browser/runtime Match or Save integration executed."]};
}
function specification() {
  return {sprint:8,scope:"ISOLATED_PURE_CONTRACT",versions:F.versions,runtimeEnabled:false,
    canonicalEncoding:{strings:"UTF-8 of JSON strings, reject unpaired surrogates; no Unicode normalization",keys:"recursive UTF-16 code-unit sort; preserve arrays",numbers:"safe integers only; reject negative zero; original sample encoded as big-endian IEEE754 binary64 hex",nonData:"reject undefined, NaN, Infinity, cycles, getters, symbols, sparse arrays and nonplain objects"},
    sampler:{scheme:"B",key:["executionVersion","physical {version,matchId,plateAppearanceId,contactId,physicalIdentity}","physicalSlot","samplerVersion","stage"],slots:["primaryThrow","relayThrow"],stages:["positioning","secure","touch"],excluded:["actor","ability","route","retry","outcome","originalOwnedSample"],hash:"SHA-256 UTF-8; first four bytes unsigned big-endian",unit:"(u32+0.5)/2^32; exact binary64",stageQuantization:"bin=(u32 >>> 28)-8; 16 fixed bins; no redraw"},
    timing:{version:F.versions.timing,unit:"1000 integer ticks per coarse relative time CRT; not seconds",inputTicksRange:[0,1000000000],runnerInputRange:[-1000000000,1000000000],origin:"one same-play upstream launch origin; primary launch=0, relay launch absolute and >= first contest completion",precision:"No float timing conversion accepted; adapter must provide already versioned integer ticks. Positive movement duration uses ceil. No epsilon/tie tolerance.",moments:["launch","ballArrival","positioningStart","positioningCompletion","secureCompletion","touch/tagCompletion","runnerArrival"],tie:"no retirement candidate",unknown:"explicit reason; insufficient, never zero",ordinalWindow:"v1 {value,state} rejected",thirdOut:"candidate flag only; scoring requires current Third-Out owner",seam:{currentFile:"defensive-runner-throw-settlement-foundation.js",currentFunction:"deriveSettlement",blocker:"requires equality to legacy resolveTiming; cannot accept added v2 positioning/secure/touch times",futureOwner:"same RunnerThrowSettlement owner with explicit version discriminator + timing validation; no parallel apply",implemented:false}},
    pureArithmetic:{calibration:"FROZEN_UNCALIBRATED_PURE_POLICY; not authorized for Production probabilities or balance",abilityScale:"explicit integer 0..20; no Career/NPC aliases or hidden defaults",movementScale:"MDU integer0..8; not measured meters",positioning:"reachable:MDU*1000<=1000+400*range; duration=max(100,1500-60*reaction+10*binPosition)+ceil(MDU*1000000/(500+60*mobility)); absolute completion=start+duration",hands:"marginMilli=650*catching+350*fielding+125*binSecure-demandMilli; negative=>failedHands; [0,1000)=>bobble; >=1000 clean",secureCompletion:"ballArrival+declared cleanDelay + bobbleDelay only on bobble",touchCompletion:"secureCompletion+declared delayTicks+binTouch+8; duration never negative",delivery:"Consumes explicit completed upstream fact, accuracy/quality and arrival; no new throw roll or flight inference",notes:["A/B classifications within pureFixture are declared fixture facts, not observed Production authority.","No historical synthetic projection can supply missing execution fact via success boolean.","Digest is consistency evidence, not authentication."]},
    dependencies:[{stage:"A",requires:"completed acquisition/transfer and delivery; original sourceThrowActionId",missing:"notAttempted/insufficient; offline blocks Secure"},{stage:"B",requires:"owned receiver availability, start, MDU and actual abilities",missing:"unavailable/unreachable/late/insufficient; no hands failure"},{stage:"C",requires:"A completed receivable delivery + B ready; matching leg/actor/target",missing:"notAttempted; no possession"},{stage:"D",requires:"C possession + declared touch/tag contact + eligible live legality + known runner timing",missing:"no candidate; insufficient timing stays unresolved"},{stage:"relay",requires:"validated prior serialized output, same contact/origin, declared completed first retirement and pivot, outs<3, live target",missing:"blocked second delivery; no second candidate"}],
    effortBoundary:{version:F.versions.effort,actual:"receiver capabilities determine execution only",reference:"independent position/league/environment/version/provenance profile; does not change execution",calibrationAuthority:"NOT_IMPLEMENTED",missingOrUncalibrated:"insufficientScorerFacts; official E and would-be A null",claimedCalibrated:"returns insufficient unavailableCalibrationAuthority",officialScorerCalled:false},
    blockersFor63Shadow:["Approve explicit physical contact/slot identity adapter; verify source handoff/roster copies rather than trusting digest.","Provide real NPC1B start/movement, incoming quality/demand, touch and same-origin CRT input sources; legacy combined booleans cannot supply them.","Review and calibrate pure coefficients/real ability mapping; no activation from pure fixtures.","Define model pins, read-only shadow storage and meaningful/routine/cold/duplicate no-interference tests without changing official outcome.","Design version-aware timing seam before any authoritative settlement.","Independent effort calibration and clean counterfactual/late attribution before official scorer eligibility; L03 remains PARTIAL."]};
}
function integrity() {
  const baseline=JSON.parse(fs.readFileSync(path.join(root,"docs/receiver-execution-v2-sprint-8-baseline-evidence.json"),"utf8"));
  const changed=Object.entries(baseline.trackedHashes).filter(([p,h])=>sha(p)!==h).map(([p])=>p);assert.deepEqual(changed,[]);
  const protectedMetadata=Object.fromEntries(Object.keys(baseline.protectedMetadata).map(p=>{const s=fs.statSync(path.join(root,p));return [p,{size:s.size,mtimeMs:s.mtimeMs}];}));
  assert.deepEqual(protectedMetadata,baseline.protectedMetadata);
  assert.equal(git("rev-parse","HEAD"),baseline.baseline);assert.equal(git("rev-parse","origin/main"),baseline.baseline);assert.equal(git("branch","--show-current"),"main");assert.equal(git("diff","--cached","--name-only"),"");
  const protectedSet=new Set(Object.keys(baseline.protectedMetadata));
  const refs=Object.keys(baseline.trackedHashes).filter(p=>/\.(js|cjs|html)$/.test(p)).filter(p=>!protectedSet.has(p)).filter(p=>/ReceiverExecutionV2Foundation|receiver-execution-v2-foundation/.test(fs.readFileSync(path.join(root,p),"utf8")));
  assert.deepEqual(refs,[]);
  const moduleText=fs.readFileSync(path.join(root,"receiver-execution-v2-foundation.js"),"utf8");assert(!/\brequire\s*\(|Math\.random|\bimport\s|MatchRNG|MatchGameRecord|applyHighSchool/.test(moduleText));
  const architecture=JSON.parse(fs.readFileSync(path.join(root,"docs/receiver-execution-v2-sprint-8-architecture-evidence.json"),"utf8"));
  for(const row of architecture.snippets){const lines=fs.readFileSync(row.file_path,"utf8").replace(/\r\n/g,"\n").split("\n");assert.equal(lines.slice(row.start_line-1,row.end_line).join("\n")+"\n",row.source);}
  const debt=["tests/ability-performance-gradient-test.js","tests/baseball-match-foundation-2-2-2-test.js","tests/high-school-year-one-opportunity-two-integration-test.js"].map(p=>({path:p,sha256:sha(p),unchanged:sha(p)===baseline.trackedHashes[p]}));assert(debt.every(d=>d.unchanged));
  const status=git("status","--short");const baselineRows=baseline.status.split(/\r?\n/);for(const row of baselineRows)assert(status.split(/\r?\n/).includes(row));
  const diff=cp.spawnSync("git",["diff","--check","--",".",":(exclude)tests/fast-check-smoke-test.cjs"],{cwd:root,encoding:"utf8"});assert.equal(diff.status,0);
  return {status:"PASS",baseline:baseline.baseline,originMain:git("rev-parse","origin/main"),branch:"main",staging:[],trackedCount:Object.keys(baseline.trackedHashes).length,changedTrackedFiles:changed,
    protectedMetadata,protectedContentReadOrHashed:false,protectedStatusRowsPreserved:true,newModuleReferencesInExistingSource:refs,standaloneImportsOrRngCalls:0,currentGraphSnippetsEqual:architecture.snippets.length,debt,
    formalMatchPlayback:"UNCHANGED/NOT_REGISTERED",formalSaveSchema:"UNCHANGED",legacyExecution:"UNCHANGED",scorerAndRecordOwner:"UNCHANGED",responsibilityLanes:"UNCHANGED",settlementAndThirdOut:"UNCHANGED",
    full227:{executed:false,reason:"Independent unloaded module and new tests only; all existing tracked bytes identical. No cross-module changes."},
    productionRegression:{executed:false,reason:"Pure tests are not Production integration; no claim of new full regression result",trackedProductionChanges:0},diffCheck:{exit:diff.status,output:diff.stdout+diff.stderr},gitStatus:status};
}
function run(capture=false) {
  // Gate BEFORE any file write so a repeat capture cannot overwrite final evidence.
  if(capture)for(const p of Object.values(output))assert(!fs.existsSync(path.join(root,p)),"capture already exists: "+p);
  const focused=T.run();assert.equal(focused.failed,0,JSON.stringify(focused.rows.filter(r=>r.status==="FAIL")));
  const witnesses=focused.cases.slice();
  const mutations={unknownPosition:i=>{i.positioning.startTime={version:F.versions.timing,originId:i.context.originId,status:"unknown",reason:"missing-position"};},
    unknownBall:i=>{i.delivery.ballArrival={version:F.versions.timing,originId:i.context.originId,status:"unknown",reason:"missing-ball"};},
    noDelivery:i=>{i.delivery.status="notAttempted";i.delivery.upstreamStatus="failed";i.delivery.accuracy="none";i.delivery.quality="none";i.delivery.ballArrival={version:F.versions.timing,originId:i.context.originId,status:"unknown",reason:"not-thrown"};},
    unreachable:i=>{i.positioning.startContext="distant";i.positioning.movementMdu=8;i.capabilities.values.range=0;},
    ineligible:i=>{i.contest.legality.status="ineligible";},unknownForce:i=>{i.contest.legality.status="unknown";},challenging:i=>{i.delivery.accuracy="challenging";i.delivery.quality="challenging";},
    maximumTime:i=>{i.delivery.ballArrival.ticks=1000000000;i.secure.cleanDelayTicks=1000000;i.secure.bobbleDelayTicks=1000000;i.contest.delayTicks=1000000;i.contest.runnerArrival.ticks=-1000000000;
      i.secure.demandMilli=15500+(((F.sampleVector(i.identity.physical,"primaryThrow").stages.secure.u32>>>28)-8)*125);}};
  for(const [name,mutate]of Object.entries(mutations)){const i=T.fixture();mutate(i);const sealed=F.seal(i),execution=F.execute(sealed);assert.equal(execution.status,"ok");witnesses.push({name,sealed,execution});}
  const tie=T.fixture();tie.contest.runnerArrival.ticks=focused.cases[0].execution.stages.contest.completion.ticks;const tieSeal=F.seal(tie);witnesses.push({name:"tie",sealed:tieSeal,execution:F.execute(tieSeal)});
  const first={sealed:focused.cases[0].sealed,execution:focused.cases[0].execution},relayInput=T.relay(first),relaySeal=F.seal(relayInput);witnesses.push({name:"relay",sealed:relaySeal,execution:F.execute(relaySeal,first)});
  const failedCase=focused.cases.find(c=>c.name==="hands"),failedFirst={sealed:failedCase.sealed,execution:failedCase.execution},blockedInput=T.relay(failedFirst),blockedSeal=F.seal(blockedInput);witnesses.push({name:"blockedRelay",sealed:blockedSeal,execution:F.execute(blockedSeal,failedFirst)});
  const finalSchema=schema(),schemaCases=witnesses.map(c=>{assert(conforms(c.sealed.input,finalSchema.$defs.input,finalSchema.$defs),"input schema "+c.name);assert(conforms(c.execution,finalSchema.$defs.execution,finalSchema.$defs),"output schema "+c.name);return {case:c.name,input:"PASS",output:"PASS"};});
  const cross=crossRuntime(),noninterference=integrity();
  const hashes=Object.fromEntries(["receiver-execution-v2-foundation.js","tests/receiver-execution-v2-pure-contract-test.cjs","tests/receiver-execution-v2-sprint-8-runner.cjs"].map(p=>[p,sha(p)]));
  const data={schema:finalSchema,specification:specification(),focused:{...focused,schemaValidation:{status:"PASS",keywordScope:"Only keywords used in delivered schema; not a general JSON-Schema implementation",cases:schemaCases},sourceHashes:hashes},runtime:{...cross,sourceHashes:hashes},integrity:{...noninterference,sourceHashes:hashes}};
  if(capture)for(const [key,p]of Object.entries(output))fs.writeFileSync(path.join(root,p),JSON.stringify(data[key],null,2)+"\n",{flag:"wx"});
  return {focused:{total:focused.total,passed:focused.passed,failed:focused.failed},schemaRows:schemaCases.length,crossRuntime:cross.status,dotnetRows:cross.dotnet.rows,legacyNonInterference:noninterference.status,trackedHashCount:noninterference.trackedCount,captured:capture};
}
module.exports={schema,conforms,crossRuntime,specification,integrity,run};
if(require.main===module)console.log(JSON.stringify(run(process.argv.includes("--capture-final")),null,2));
