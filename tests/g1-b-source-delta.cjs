'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const H=require('./pitch-production-source-scope.cjs');
const BASELINE='bd657b5f18462be2c365abdec1ca14497725557e';
const specs={
  "modules": [
    {
      "file": "batted-ball-fly-ball-defense.js",
      "names": [
        "createOutfieldSingleAdmission",
        "resolveGroundedOutfieldBall"
      ],
      "blockSha256": "4c02570918b0de7d4173373b94bfca6fd6c79c8b8c8a825f9134782081547180",
      "baselineSha256": "3a05fc05e182f32ac0c398fd84ad53ff3c9c86eba8822ae53bfe2838533df038"
    },
    {
      "file": "defensive-reach-secure-foundation.js",
      "names": [
        "resolveOutfieldRetrieval"
      ],
      "blockSha256": "b09a42f632e164318409f47907ea6d63dc19323a28fe0947b83b5b051a186f72",
      "baselineSha256": "899a5bc5f6c94f6105f1cfac654fb42758bc7ccd9ddb8a39556a1bc0cf937343"
    },
    {
      "file": "defensive-runner-throw-settlement-foundation.js",
      "names": [
        "resolveOutfieldContinuation"
      ],
      "blockSha256": "00783029996df35714d4f01d1dc736d028d1351eafe57ea5037067be05f8467c",
      "baselineSha256": "2c7e08c73553cdcf8b5aaa6a0953aec93ba973998b6bc72704647971d070f6fb"
    },
    {
      "file": "defensive-decision-throw-foundation.js",
      "names": [
        "resolveOutfieldSingleClassification"
      ],
      "blockSha256": "25f85e10d4232c74b5ace11f3a859393b29b1abe16cc85c6a75a673f98ea9e5a",
      "baselineSha256": "c5afcf9c0f0fd1a501e5dec0bdc26d30054ac9a7f29f792c716190a8f7434ed7"
    }
  ],
  "scriptChanges": [
    {
      "name": "isHighSchoolMatchPlaybackPhase",
      "added": false,
      "sha256": "7e20f5a75b863c35cb59b605c9e53701410a5dd225342574c3d1788a97ecab2d"
    },
    {
      "name": "assertHighSchoolOutfieldSingleContinuable",
      "added": true,
      "sha256": "e923977b3b99be2d7b33466f8a61aaebf03dfd2f0c57c0980b1543bbdd6c650d"
    },
    {
      "name": "createHighSchoolOutfieldSingleAdmission",
      "added": true,
      "sha256": "eb0d632f1852b18cd1bc4c7705465cbfb5c1b83287cd8e37417b3f7a84d511b4"
    },
    {
      "name": "validateHighSchoolOutfieldSingle",
      "added": true,
      "sha256": "65df29771c6c8b66e60e9a00dbb7b81d936b9e5fa2d262573a8afbd840d7064b"
    },
    {
      "name": "resolveHighSchoolOutfieldSingle",
      "added": true,
      "sha256": "acf369d6fd3889ce95fe85c0af623e00954bb971e80cb93be9e49e2fc89cc1f5"
    },
    {
      "name": "applyHighSchoolOutfieldSingle",
      "added": true,
      "sha256": "e177ee5381a085599d75e685d07ac03e3f71fb3560f084e96a3a679aa550fe12"
    },
    {
      "name": "ensureHighSchoolOrdinaryGroundBallInPlayHandoff",
      "added": false,
      "sha256": "a9d9ffaa9818c9bb083742addaafb5f98d788118674f721400cd986c87aa334f"
    },
    {
      "name": "resolveHighSchoolFlyBallCatchOpportunity",
      "added": false,
      "sha256": "fd9149f61d019e56abf2fb3f75154e7deb897e0a2f1ef0435d0f8e2d6d1ef099"
    },
    {
      "name": "applyHighSchoolFlyBallCatchResolution",
      "added": false,
      "sha256": "5439383ba6124b9fe9e929f3fa832f663096c7b6dc731a017f9724a7ac4aa719"
    },
    {
      "name": "resolveSimulatedHighSchoolPlateAppearance",
      "added": false,
      "sha256": "e431af13057f5e620302f92c396923656cd7c0d76841e29aa284af6c97d70644"
    },
    {
      "name": "prepareHighSchoolDefensiveMomentFromSimulation",
      "added": false,
      "sha256": "56ab49f6a570f5fb3380e67b2affa517e9319ee0b925bc7bccc6599610ecdb9a"
    }
  ]
};
const norm=s=>s.replace(/\r\n?/g,'\n'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const exportsEdits={
 'batted-ball-fly-ball-defense.js':['normalizeFlyBallCatchState,\n    createOutfieldSingleAdmission, resolveGroundedOutfieldBall','normalizeFlyBallCatchState'],
 'defensive-reach-secure-foundation.js':['resolveRecoveryAction, resolveOutfieldRetrieval });','resolveRecoveryAction });'],
 'defensive-runner-throw-settlement-foundation.js':['resolveRecoveryContinuation,resolveOutfieldContinuation});','resolveRecoveryContinuation});'],
 'defensive-decision-throw-foundation.js':['resolvePostDeliveryBallState, resolveOutfieldSingleClassification });','resolvePostDeliveryBallState });']
};
function stripG1BExtension(file,source) {
 const t=norm(source),spec=specs.modules.find(x=>x.file===file);assert(spec,'unknown extension owner');
 const marker='  // G1-B bounded extension.',endMarker='  // End G1-B bounded extension.\n';
 assert.equal(t.split(marker).length,2,'missing/duplicate G1-B extension');
 const start=t.indexOf(marker),end=t.indexOf(endMarker,start)+endMarker.length;assert(end>start);
 assert.equal(sha(t.slice(start,end)),spec.blockSha256,'G1-B extension differs from exact reviewed source');
 for(const name of spec.names)assert.equal(t.split('function '+name+'(').length,2,'missing/duplicate API');
 let restored=t.slice(0,start)+t.slice(end),[after,before]=exportsEdits[file];
 assert.equal(restored.split(after).length,2,'missing/duplicate exact G1-B export');
 restored=restored.replace(after,before);
 if(file==='batted-ball-fly-ball-defense.js')restored=restored.replace('\n\n\n  return deepFreeze({','\n\n  return deepFreeze({');
 assert.equal(sha(restored),spec.baselineSha256,'old core source changed outside exact additive API/export');
 return restored;
}
function readCore(file){return stripG1BExtension(file,fs.readFileSync(file,'utf8'));}
function assertScript(source){
 let restored=norm(source);
 const old=norm(cp.execFileSync('git',['--no-optional-locks','show',BASELINE+':script.js'],{encoding:'utf8',maxBuffer:16*1024*1024}));
 const parsed=H.readSource(restored),baseline=H.readSource(old);
 for(const item of specs.scriptChanges){
  assert.equal(sha(parsed.get(item.name).source),item.sha256,'G1-B script reviewed function differs: '+item.name);
  if(!item.added)restored=restored.replace(parsed.get(item.name).source,baseline.get(item.name).source);
 }
 const marker='// G1-B bounded extension.',endMarker='// End G1-B bounded extension.\n\n';
 assert.equal(restored.split(marker).length,2);const start=restored.indexOf(marker),end=restored.indexOf(endMarker,start)+endMarker.length;
 assert(end>start);restored=restored.slice(0,start)+restored.slice(end);
 assert.equal(restored,old,'script changes outside reviewed G1-B handoff and helpers');
 return true;
}
function runSourceTests(){
 let rejections=0;
 for(const spec of specs.modules){
  const t=fs.readFileSync(spec.file,'utf8');stripG1BExtension(spec.file,t);
  const changed=[
   t.replace('G1-B bounded extension.','G1-B removed extension.'),
   t+'\nfunction '+spec.names[0]+'(){}\n',
   t.replace('\"use strict\";','\"use strict\"; void 1;'),
   t.replace(exportsEdits[spec.file][0],exportsEdits[spec.file][1]),
   t+'\n// unauthorized outside delta\n'
  ];
  for(const x of changed){assert.notEqual(x,t);assert.throws(()=>stripG1BExtension(spec.file,x));rejections++;}
 }
 const script=fs.readFileSync('script.js','utf8');assertScript(script);
 for(const x of [script.replace('assertHighSchoolOutfieldSingleContinuable(match);','void 0;'),
  script.replace('if(facts.classification.status!=="supported")throw','if(false)throw'),
  script.replace('const outfieldSingleAdmission = options.outfieldSingle ?','const outfieldSingleAdmission = true ?'),
  script+'\n// unauthorized script delta\n']){
  assert.notEqual(x,script);assert.throws(()=>assertScript(x));rejections++;
 }
 return {status:'PASS',immutableBaseline:BASELINE,coreOwners:4,scriptChangedFunctions:specs.scriptChanges.length,rejections,
  oldCoreFormulasByteExactAfterReversal:true,oldPinsUnchanged:true};
}
module.exports={stripG1BExtension,readCore,assertScript,runSourceTests};
if(require.main===module)console.log(JSON.stringify(runSourceTests()));
