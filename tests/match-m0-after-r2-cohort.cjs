const fs=require('fs'),path=require('path'),os=require('os'),zlib=require('zlib');
const {discover,playAdmitted}=require('./match-m0-after-r2-admission-context.cjs');
const {projectGame}=require('./match-m0-after-r2-coverage.cjs');
const directory=path.join(os.tmpdir(),'m0-after-r2-4b60ac3');
function setupForSeed(seed){const offset=seed-(seed<440100?440000:seed<440300?440100:440300);return {schoolIndex:offset%4,choiceIndex:Math.floor(offset/4)%3,youthChoiceIndex:seed<440100?0:seed<440200?1:2};}
function compact(row){const {steps,capability,...rest}=row;return {...rest,stepCount:steps.length,capability:{initialized:capability.initialized,settlementVersion:capability.settlementVersion,characterSeed:capability.characterSeed,positionExperience:capability.positionExperience,settlement:capability.settlement}};}
function discovery(){
  fs.mkdirSync(directory,{recursive:true});
  const checkpoint=path.join(directory,'admission-checkpoint.json');
  const rows=fs.existsSync(checkpoint)?JSON.parse(fs.readFileSync(checkpoint)):
    ['admission-discovery','admission-discovery-varied'].every(n=>fs.existsSync(path.join(directory,n+'.json')))
      ? ['admission-discovery','admission-discovery-varied'].flatMap(n=>JSON.parse(fs.readFileSync(path.join(directory,n+'.json'))).rows.map(compact)) : [];
  if(rows.some(r=>r.error))throw Error('Discovery checkpoint contains a recorded failure; do not skip it');
  let bench=rows.filter(r=>r.actualAdmittedRole==='bench').length,starter=rows.filter(r=>r.actualAdmittedRole==='starter').length;
  const failures=[];
  for(let seed=rows.length?rows.at(-1).seed+1:440000;seed<445300&&(bench<1000||starter<400);seed++){
    const options=setupForSeed(seed);
    const {row}=discover(seed,options);rows.push(compact(row));
    if(row.error){failures.push({seed,error:row.error});fs.writeFileSync(checkpoint,JSON.stringify(rows));break;}
    if(row.actualAdmittedRole==='bench')bench++;
    if(row.actualAdmittedRole==='starter')starter++;
    if(rows.length%100===0){fs.writeFileSync(checkpoint,JSON.stringify(rows));console.log('Discovery '+rows.length+' bench='+bench+' starter='+starter);}
  }
  const selected=['bench','starter'].flatMap(role=>rows.filter(r=>r.actualAdmittedRole===role).slice(0,role==='bench'?1000:400));
  const report={baseline:'4b60ac3',candidateBound:[440000,445299],candidateSeedsExamined:rows.length,bench,starter,other:rows.length-bench-starter,failures,selected: selected.map(r=>({seed:r.seed,role:r.actualAdmittedRole,setup:r.requestedSetup})),rows};
  fs.writeFileSync(path.join(directory,'formal-admission.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,rows:undefined,selected:undefined}));
  return report;
}
function cohort(){
  const admission=JSON.parse(fs.readFileSync(path.join(directory,'formal-admission.json')));
  if(admission.failures.length||admission.selected.length!==1400)throw Error('Admission quota/gate incomplete');
  const raw=path.join(directory,'formal-games.jsonl.gz');
  if(fs.existsSync(raw))throw Error('Preserve prior formal evidence; refusing overwrite');
  const report={baseline:'4b60ac3',planned:1400,attempted:0,completed:0,exceptions:0,roles:{bench:0,starter:0},games:[],failures:[]};
  for(const candidate of admission.selected){
    report.attempted++;
    const g=playAdmitted(candidate.seed,{...candidate.setup,observe:true});
    const check=g.check||{seed:candidate.seed,failures:[{error:g.error}]};
    const projection=g.match?projectGame({admission:g.row,match:g.match,observed:g.observed}):null;
    if(projection?.integrity.length)check.failures.push({code:'COVERAGE_INTEGRITY',issues:projection.integrity});
    if(g.row.actualAdmittedRole!==candidate.role)check.failures.push({code:'ADMISSION_REPLAY_MISMATCH'});
    fs.appendFileSync(raw,zlib.gzipSync(JSON.stringify({admission:compact(g.row),match:g.match,observed:g.observed,check,projection})+'\n'));
    report.games.push(check);
    if(check.failures.length){report.exceptions+=check.failures.some(f=>f.code==='PRODUCTION_EXCEPTION')?1:0;report.failures.push(check);fs.writeFileSync(path.join(directory,'formal-blocked.json'),JSON.stringify({admission:g.row,match:g.match,check,observed:g.observed},null,2));break;}
    report.completed++;report.roles[candidate.role]++;
    if(report.completed%50===0){console.log('Formal '+report.completed+'/1400');fs.writeFileSync(path.join(directory,'formal-cohort.json'),JSON.stringify(report,null,2));}
  }
  report.status=report.failures.length?'STOP_NEW_PRODUCTION_BLOCKER':'PASS';
  fs.writeFileSync(path.join(directory,'formal-cohort.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,games:undefined}));
  return report;
}
module.exports={discovery,cohort,setupForSeed};
if(require.main===module){const r=process.argv[2]==='cohort'?cohort():discovery();if(r.failures.length)process.exitCode=1;}
