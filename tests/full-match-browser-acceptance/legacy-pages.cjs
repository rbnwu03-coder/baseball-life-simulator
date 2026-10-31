async(page)=>{
  const base='http://127.0.0.1:8770',manifest=await (await page.request.get(base+'/tests/full-match-browser-acceptance/html-inventory.json')).json(),rows=[];
  for(const input of manifest){
    if(input.path==='index.html'){rows.push({...input,status:'EXECUTED_SEPARATELY',evidence:'catcher natural + canonical fixture; not a blanket PASS'});continue;}
    const errors=[],failures=[];
    const onError=e=>errors.push(String(e.stack||e)),onResponse=r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});};
    page.on('pageerror',onError);page.on('response',onResponse);
    try{
      const response=await page.goto(base+'/'+input.path);
      await page.waitForTimeout(200);
      const dom=await page.evaluate(()=>({title:document.title,text:document.body.innerText,buttons:[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({text:b.innerText,handler:b.getAttribute('onclick')}))}));
      rows.push({...input,status:input.classification==='prototype'?'NOT_APPLICABLE_TO_FORMAL_MATCH':errors.length?'BLOCKED':'LOADED_NOT_BASEBALL_ACCEPTANCE',httpStatus:response.status(),errors,failures,dom});
    }catch(e){rows.push({...input,status:'BLOCKED',errors:[...errors,String(e)],failures});}
    finally{page.off('pageerror',onError);page.off('response',onResponse);}
  }
  await page.request.post(base+'/__evidence/html-inventory/browser-results.json',{data:JSON.stringify(rows,null,2)});
  return rows.map(({path,status,errors})=>({path,status,errors}));
}
