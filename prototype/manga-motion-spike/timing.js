/* Deterministic presentation remapping; no wall clock or physical units. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.defineProperty(root,'SS63Timing',{value:api});})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const boundaries=Object.freeze([0,450,1550,2400,2850,3450,4550]);
  const rates=Object.freeze([1,.65,.5,1,.65,.5]);
  const smooth=x=>x*x*(3-2*x);
  function rateAt(t,slow=true){
    if(!Number.isFinite(t)||t<0)throw Error('Invalid presentation coordinate');
    if(!slow||t>=4550)return 1;
    let i=0;while(i<5&&t>=boundaries[i+1])i++;
    for(let j=1;j<6;j++)if(Math.abs(t-boundaries[j])<80){const u=(t-boundaries[j]+80)/160;return rates[j-1]+(rates[j]-rates[j-1])*smooth(u);}
    return rates[i];
  }
  // One-unit trapezoidal quadrature table, immutable and shared by all samplers.
  const wall=Object.freeze(Array.from({length:4551},()=>0).reduce((a,_,i)=>{a.push(i? a[i-1]+.5/rateAt(i-1)+.5/rateAt(i):0);return a;},[]));
  function toWall(t,slow=true){if(!Number.isFinite(t)||t<0)throw Error('Invalid coordinate');if(!slow)return t;if(t>=4550)return wall[4550]+t-4550;const i=Math.floor(t);return wall[i]+(wall[i+1]-wall[i])*(t-i);}
  function toPlay(w,slow=true){if(!Number.isFinite(w)||w<0)throw Error('Invalid wall interval');if(!slow)return w;if(w>=wall[4550])return 4550+w-wall[4550];let lo=0,hi=4550;while(hi-lo>1){const m=(lo+hi)>>1;if(wall[m]<=w)lo=m;else hi=m;}return lo+(w-wall[lo])/(wall[hi]-wall[lo]);}
  return Object.freeze({version:'ss63-timing/0.1',boundaries,rates,rateAt,toWall,toPlay,slowWallEnd:wall[4550],units:'illustrative-presentation-ms'});
});
