async (page) => {
  const base='http://127.0.0.1:8770';
  const config=await (await page.request.get(base+'/tests/full-match-browser-acceptance/matrix-config.json')).json();
  const rows=[];
  for(const input of config.inputs){
    const url=new URL('/__fixture',base);
    Object.entries({position:'捕手',scenario:'bunt',...input}).forEach(([k,v])=>url.searchParams.set(k,String(v)));
    const errors=[];const error=m=>errors.push(m.type?m.type()+': '+m.text():String(m));
    page.on('pageerror',error);page.on('console',error);
    try{
      await page.goto(url.toString());
      await page.getByRole('button',{name:'建立已登記測試局面',exact:true}).click();
      const initial=await page.evaluate(()=>acceptanceFixture);
      await page.waitForFunction(()=>!!player.highSchoolMatch.playbackFailure||player.highSchoolMatch.simulationLog.some(e=>e.settlementReceipt),null,{timeout:12000,polling:100});
      const final=await page.evaluate(()=>({match:player.highSchoolMatch,public:LivePublicMatchBridge.readCurrent(),text:document.body.innerText}));
      const name=(config.prefix||'bunt-replay')+'-'+(input.pop?'pop':input.pace+'-'+input.placement);
      await page.request.post(base+'/__evidence/'+name+'/scene.json',{data:JSON.stringify({input,initial,final,errors},null,2)});
      await page.request.post(base+'/__evidence/'+name+'/final.png',{data:await page.screenshot({fullPage:true})});
      rows.push({input,sourceSame:initial.initial.offensiveBuntPAState.identity===final.match.offensiveBuntPAState?.identity,
        sourcePitch:initial.initial.offensiveBuntPAState.pitchHistory.at(-1).buntResolution,
        failure:final.match.playbackFailure?.message,receipt:final.match.simulationLog.find(e=>e.settlementReceipt)?.settlementReceipt?.identity,
        original:final.match.offensiveBuntPAState?.pitchHistory?.at(-1)?.buntResolution?.fairBallType,errors});
    }finally{page.off('pageerror',error);page.off('console',error);}
  }
  await page.request.post(base+'/__evidence/bunt-matrix/'+config.name+'.json',{data:JSON.stringify(rows,null,2)});
  return rows.map(({input,sourceSame,failure,receipt,original})=>({input,sourceSame,failure,receipt,original}));
}
