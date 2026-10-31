async (page) => {
  const base = new URL(page.url()).origin;
  const config = await (await page.request.get(base+'/tests/full-match-browser-acceptance/run-config.json')).json();
  const out = '/__evidence/'+config.case+'/';
  const write = async (name,value)=>{const r=await page.request.post(base+out+name,{data:JSON.stringify(value,null,2)});if(!r.ok())throw Error('evidence write failed '+r.status());};
  const append=async(name,value)=>{const r=await page.request.post(base+out+name,{data:JSON.stringify(value)+'\n'});if(!r.ok())throw Error('trace write failed');};
  const errors=[],network=[];
  const onError=e=>errors.push(String(e.stack||e));
  const onConsole=m=>{if(['error','warning'].includes(m.type()))errors.push(m.type()+': '+m.text());};
  const onResponse=r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});};
  page.on('pageerror',onError);page.on('console',onConsole);page.on('response',onResponse);
  async function snapshot() {
    return page.evaluate(()=>{
      const m=player.highSchoolMatch;
      return {at:Date.now(),url:location.href,chapter:player.chapter,step:player.highSchoolStep,
        direct:player.flags.includes('direct_start_history'),body:player.body,
        story:document.body.innerText,choices:[...document.querySelectorAll('main button')].filter(b=>b.getClientRects().length&&!b.disabled).map(b=>b.innerText),
        pendingOutcome:!!pendingYouthSeasonOutcome,
        match:m?{id:m.id,phase:m.simulationPhase,completed:m.completed,seed:m.simulationSeed,cursor:m.simulationCursor,
          inning:m.inning,half:m.half,outs:m.outs,runners:m.runners,scores:m.scores,order:m.battingOrderIndex,
          currentBatter:m.currentBatter,currentPitcher:m.currentPitcher,offense:m.offenseTeam,defense:m.defenseTeam,
          entered:m.playerEntryCompleted,status:m.playerLineupStatus,position:m.position,
          opportunity:m.gameExposureState?.opportunitySnapshot,plannedUsage:m.gameExposureState?.plannedUsage,
          active:m.activeSituation,pa:m.offensivePlateAppearanceState,bunt:m.offensiveBuntPAState,handoff:m.buntBallInPlayState,
          public:getHighSchoolMatchPresentation(m),playback:getHighSchoolMatchPlaybackDebugState(m),log:m.simulationLog,
          record:m.gameRecord}:null};
    });
  }
  await write('version.json',await (await page.request.get(base+'/__version')).json());
  let last='',count=0,lastChange=Date.now(),result='TIMEBOX',saved=false,logIndex=0;
  const started=Date.now();
  try {
    while(Date.now()-started<(config.milliseconds||40000)) {
      const s=await snapshot(), signature=JSON.stringify([s.chapter,s.step,s.story,s.choices,s.match?.phase,s.match?.cursor,s.match?.log.length,s.match?.public]);
      if(signature!==last){
        const m=s.match;
        await append('trace.ndjson',{at:s.at,chapter:s.chapter,step:s.step,choices:s.choices,story:s.story,
          match:m?{id:m.id,phase:m.phase,completed:m.completed,seed:m.seed,cursor:m.cursor,
            inning:m.inning,half:m.half,outs:m.outs,runners:m.runners,scores:m.scores,order:m.order,
            currentBatter:m.currentBatter,currentPitcher:m.currentPitcher,offense:m.offense,defense:m.defense,
            entered:m.entered,status:m.status,position:m.position,public:m.public,playback:m.playback,
            pa:m.pa?{identity:m.pa.paIdentity,balls:m.pa.balls,strikes:m.pa.strikes,result:m.pa.result,applied:m.pa.resultApplied}:null,
            events:m.log.slice(logIndex)}:null});
        logIndex=m?.log.length||0;
        last=signature;lastChange=Date.now();count++;
      }
      if(errors.length){result='ERROR';break;}
      if(s.match?.completed){result='COMPLETED';break;}
      if(config.saveFirstDecision&&!saved&&s.match&&s.choices.length&&!s.pendingOutcome){
        await write('before-save.json',s);
        await page.getByRole('button',{name:'儲存',exact:true}).click();
        await page.waitForFunction(()=>document.body.innerText.includes('進度已儲存'));
        const stored=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
        await write('save-confirmed.json',{state:await snapshot(),stored});
        await page.reload();
        await page.getByRole('button',{name:'讀取',exact:true}).click();
        await page.waitForFunction(()=>!!player.highSchoolMatch);
        await write('after-load.json',await snapshot());saved=true;
        continue;
      }
      if(s.choices.length){
        if(config.stopAtChoices){result='DECISION';break;}
        const preferences=config.preferences||['放掉','縮小攻擊區','先確保','穩穩','自己操作','繼續'];
        let i=-1;
        for(const p of preferences){i=s.choices.findIndex(t=>t.includes(p));if(i>=0)break;}
        if(i<0)i=0;
        await append('actions.ndjson',{at:s.at,index:i,text:s.choices[i],phase:s.match?.phase});
        // Reacquire a DOM locator after every redraw. Never call a gameplay API.
        await page.locator('main button:visible:enabled').nth(i).click();
      } else if(Date.now()-lastChange>5000){result='STALLED';break;}
      await page.waitForTimeout(100);
    }
    await write('final.json',await snapshot());
    await write('official-match.json',await page.evaluate(()=>player.highSchoolMatch));
    await page.request.post(base+out+'final.png',{data:await page.screenshot({fullPage:true}),headers:{'content-type':'image/png'}});
  } finally {
    page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);
    await write('run-result.json',{result,count,elapsed:Date.now()-started,errors,network,saved});
  }
  return {result,count,errors,network,saved,final:await page.locator('#choices').innerText(),out};
}
