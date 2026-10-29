"use strict";
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const env=JSON.parse(fs.readFileSync(process.env.HEALTH_OPPORTUNITY_ENV||path.join(__dirname,'environment.json'))),spec=JSON.parse(fs.readFileSync(path.join(__dirname,'spec.json'))),label=process.argv[2],root=env[label];
if(!['baseline','candidate'].includes(label))throw Error('baseline/candidate required');
const run=process.argv[3]||label;if(!/^[\w-]+$/.test(run))throw Error('Invalid output name');
const out=path.join(__dirname,'regressions-'+run);fs.mkdirSync(out);const rows=[];
for(const file of spec.regressions){
 const target=path.join(root,'tests',file),witness=path.join(out,file+'.assertions.json'),fd=fs.openSync(witness,'wx'),config={nonce:label+file,target,entryMode:'standalone',gitCompatibility:true,assertionRoots:[path.join(root,'tests')]};
 const r=cp.spawnSync(process.execPath,['--require',path.join(root,'tests/entry-safe-preload.cjs'),target],{cwd:root,encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:8e6,env:{...process.env,NODE_PATH:'',NODE_OPTIONS:'',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'safe.directory',GIT_CONFIG_VALUE_0:root,ENTRY_SAFE_CONFIG:JSON.stringify(config)},stdio:['ignore','pipe','pipe',fd]});fs.closeSync(fd);
 for(const stream of ['stdout','stderr'])fs.writeFileSync(path.join(out,file+'.'+stream+'.log'),r[stream]||'',{flag:'wx'});
 let w;try{w=JSON.parse(fs.readFileSync(witness));}catch{}
 const row={file,status:r.error?.code==='ETIMEDOUT'?'TIMEOUT':r.status===0&&w?.entryStarted&&w?.standaloneMainMatches?'PASS':'FAIL',exitCode:r.status,successfulNodeAssertions:w?.assertions.passed,error:w?.unhandledError||String(r.error||''),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')};rows.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
