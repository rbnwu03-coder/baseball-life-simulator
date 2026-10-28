/* Pure track sampling. No DTOs, DOM, timers, integrated cursor or result authority. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.defineProperty(root,'SS63Sampler',{value:api});})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const lerp=(s,t)=>{const u=Math.max(0,Math.min(1,(t-s.start)/(s.end-s.start)));return {x:s.from[0]+(s.to[0]-s.from[0])*u,y:s.from[1]+(s.to[1]-s.from[1])*u};};
  function createProjector(manifest,tracks){
    tracks.requirePlayable(manifest,'secureFirstBaseOut');
    return function project(input){
      const c=input.clock;
      if(!c||!['Playback','Resolution'].includes(input.phase)||c.revealPolicy!==manifest.revealPolicy||!Number.isFinite(c.playTime)||c.playTime<0)throw Error('No motion publication permission');
      if(input.phase==='Resolution'&&!c.resolutionConfirmed)throw Error('Unconfirmed consequence');
      const t=Math.min(c.playTime,input.phase==='Resolution'?manifest.exitEnd:manifest.motionEnd);
      const poses=manifest.tracks.map(track=>{
        const s=input.phase==='Resolution'?track.exit:track.segments.find(s=>t<s.end)||track.segments.at(-1);
        if(input.phase==='Playback'&&c.motionMilestone!==s.reveal)throw Error('Unpublished motion milestone');
        return {elementId:track.id,...lerp(s,t)};
      });
      return Object.freeze({actors:Object.freeze(poses.filter(p=>p.elementId!=='ball-marker').map(Object.freeze)),ball:Object.freeze(poses.find(p=>p.elementId==='ball-marker')),playTime:t});
    };
  }
  return Object.freeze({createProjector});
});
