'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/design-optimization/full-match-browser-2026-10-31');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const archived=[];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function event(e){return {sequence:e.sequence,type:e.type,eventId:e.eventId,inning:e.inning,half:e.half,offenseTeam:e.offenseTeam,
  batterId:e.batterId,result:e.result,outcomeAuthority:e.outcomeAuthority,paIdentity:e.paIdentity,buntPAIdentity:e.buntPAIdentity,buntPitchIdentity:e.buntPitchIdentity,
  before:e.before,after:e.after,runnerChanges:e.runnerChanges,scoringRunnerIds:e.scoringRunnerIds,thirdOutResolution:e.thirdOutResolution,
  currentBatterAfter:e.currentBatterAfter,fielderId:e.fielderId,assignment:e.assignment,actionFacts:e.actionFacts,defensiveAttribution:e.defensiveAttribution,
  sourcePitch:e.buntResolution?{truth:e.buntResolution,count:e.countResult}:undefined,receiptIdentity:e.settlementReceipt?.identity,
  lineupSlot:e.lineupSlot,replacedPlayerId:e.replacedPlayerId,pitcherId:e.compressedOutcomeTrace?.identity?.split('|').at(-1)};}
for(const file of files(out).filter(f=>f.endsWith('/trace.ndjson')||f.endsWith('\\trace.ndjson'))){
  const backup=file+'.raw.gz';
  if(fs.existsSync(backup))continue;
  const raw=fs.readFileSync(file);fs.writeFileSync(backup,zlib.gzipSync(raw,{level:9}),{flag:'wx'});
  let cursor=0;
  const compact=raw.toString('utf8').trim().split('\n').filter(Boolean).map(line=>{const r=JSON.parse(line),m=r.match;
    if(!m)return {at:r.at,chapter:r.chapter,step:r.step,choices:r.choices,story:r.story};
    const es=m.events||m.log?.slice(cursor)||[];if(m.log)cursor=m.log.length;
    return {at:r.at,chapter:r.chapter,step:r.step,choices:r.choices,story:r.story,
      match:{id:m.id,phase:m.phase,completed:m.completed,seed:m.seed,cursor:m.cursor,inning:m.inning,half:m.half,outs:m.outs,runners:m.runners,scores:m.scores,
        order:m.order,currentBatter:m.currentBatter,currentPitcher:m.currentPitcher,offense:m.offense,defense:m.defense,entered:m.entered,status:m.status,position:m.position,
        public:{currentSituation:m.public?.currentSituation,scoreboard:m.public?.scoreboard},playback:m.playback,pa:m.pa?{identity:m.pa.identity||m.pa.paIdentity,balls:m.pa.balls,strikes:m.pa.strikes,result:m.pa.result,applied:m.pa.applied||m.pa.resultApplied}:null,
        events:es.map(event)}};});
  fs.writeFileSync(file,compact.map(x=>JSON.stringify(x)).join('\n')+'\n');archived.push({file:path.relative(out,file),originalSha256:sha(raw),originalBytes:raw.length,compressed:path.relative(out,backup)});
}
if(archived.length)fs.writeFileSync(path.join(out,'trace-archive.json'),JSON.stringify(archived,null,2));
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const before=JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8'));
const protectedRefs=Object.fromEntries(['main','checkpoint/narrative-feedback-2026-10-28','integration/y1-health-opportunity-2026-10-29','fix/catcher-event-consistency-2026-10-30'].map(branch=>[branch,git('rev-parse',branch)]));
for(const [branch,head]of Object.entries(protectedRefs))if(!before.refs.includes(head+' refs/heads/'+branch))throw Error('Protected ref changed: '+branch);
const sources=Object.fromEntries(Object.keys(before.hashes).map(file=>[file,sha(fs.readFileSync(path.join(root,file)))]));
fs.writeFileSync(path.join(out,'preservation.json'),JSON.stringify({head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),protectedRefs,protectedRefsUnchanged:true,sources,
  workingTreeStatus:git('status','--porcelain'),checkpointStatus:cp.execFileSync('git',['-c','safe.directory=E:/meng/baseball_life_sim_semirefactor','status','--porcelain'],{cwd:'E:/meng/baseball_life_sim_semirefactor',encoding:'utf8'}),
  originalRepairWasClean:true,note:'Only the dedicated repair worktree was edited. Baseline dirty paths are this run new evidence/runner. Existing checkpoint worktree files were not written.'},null,2));
const manifest=files(out).filter(f=>!f.endsWith('artifact-manifest.json')).map(file=>({file:path.relative(out,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:sha(fs.readFileSync(file))}));
fs.writeFileSync(path.join(out,'artifact-manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({files:manifest.length,bytes:manifest.reduce((s,x)=>s+x.bytes,0),archivedTraces:archived.length,protectedRefsUnchanged:true}));
