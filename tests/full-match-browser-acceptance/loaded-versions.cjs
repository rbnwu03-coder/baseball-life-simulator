async(page)=>{
  const rows=[];
  for(const [index,tab] of page.context().pages().entries()){
    if(!tab.url().startsWith('http://127.0.0.1:8770/'))continue;
    const session=await tab.context().newCDPSession(tab),scripts=[];
    session.on('Debugger.scriptParsed',s=>scripts.push(s));await session.send('Debugger.enable');
    const hashes={};
    for(const s of scripts){
      let key;try{key=new URL(s.url).pathname.slice(1);}catch{continue;}
      if(!['script.js','save.js','match-pitch-decision-ui.js','player.js','competition-rules.js','team-roster-foundation.js','offensive-bunt-defensive-handoff.js'].includes(key))continue;
      const {scriptSource}=await session.send('Debugger.getScriptSource',{scriptId:s.scriptId});
      hashes[key]=await tab.evaluate(async t=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(n=>n.toString(16).padStart(2,'0')).join(''),scriptSource);
    }
    await session.detach();
    const state=await tab.evaluate(()=>({id:player.highSchoolMatch?.id,seed:player.highSchoolMatch?.simulationSeed,phase:player.highSchoolMatch?.simulationPhase,primary:player.primaryPosition}));
    const row={index,url:tab.url(),at:new Date().toISOString(),hashes,state,policy:'Read-only Debugger.getScriptSource. These are actual loaded source hashes, distinct from the current worktree HTTP manifest.'};
    await page.request.post('http://127.0.0.1:8770/__evidence/loaded-versions/tab-'+index+'.json',{data:JSON.stringify(row,null,2)});rows.push(row);
  }
  return rows.map(x=>({index:x.index,state:x.state,script:x.hashes['script.js'],save:x.hashes['save.js']}));
}
