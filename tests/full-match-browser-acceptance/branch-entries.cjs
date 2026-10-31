async(page)=>{
  const base='http://127.0.0.1:8770',rows=[];
  for(const position of ['一壘手','二壘手','游擊手','三壘手','左外野手','中外野手','右外野手']){
    const errors=[],onError=e=>errors.push(String(e.stack||e));page.on('pageerror',onError);
    try{
      await page.goto(base+'/__fixture?scenario=full&position='+encodeURIComponent(position));
      await page.getByRole('button',{name:'建立已登記測試局面',exact:true}).click();
      await page.waitForTimeout(1100);
      rows.push(await page.evaluate(({position,errors})=>{const m=player.highSchoolMatch;return {
        position,errors,seed:m.simulationSeed,assigned:m.playerFieldingAssignment,status:m.playerLineupStatus,
        active:m.rosters.home.lineup.map(a=>({id:a.id,position:a.defensivePosition,source:a.source})),
        scheduled:isHighSchoolMatchPlaybackScheduled(),public:LivePublicMatchBridge.readCurrent().snapshot,
        text:document.body.innerText,scope:'entry/active-roster/render only; no claim of defensive settlement or full match'};},{position,errors}));
    }finally{page.off('pageerror',onError);}
  }
  await page.request.post(base+'/__evidence/position-entries/results.json',{data:JSON.stringify(rows,null,2)});
  return rows.map(r=>({position:r.position,seed:r.seed,actor:r.active.find(a=>a.id==='player'),errors:r.errors,scheduled:r.scheduled}));
}
