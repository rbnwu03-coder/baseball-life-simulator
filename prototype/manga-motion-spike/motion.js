/* Entry adapter. All state/timing/SVG writes remain in the original shared app. */
(function(root){
  'use strict';
  const slow = new URLSearchParams(root.location.search).get('speed') !== 'normal';
  const manifest = root.SS63PresentationTracks.createPlayableManifest(root.MATCH_UI_P1_FIXTURE,root.MatchUIPresentation);
  const policy = Object.freeze({autoMount:false,presentationMode:'continuous',clockContract:root.MatchPresentationClockContract.withRemapping(root.SS63Timing,slow),motionProjector:root.SS63Sampler.createProjector(manifest,root.SS63PresentationTracks)});
  Object.defineProperty(root,'MATCH_UI_BOOTSTRAP',{value:policy});
  function boot(){
    const demo=root.MatchUIP1.mount(root.document,root.MATCH_UI_P1_FIXTURE,root,{version:'match-ui-slice/0.2',adapter:root.MATCH_UI_P23_PRESENTATION},policy);
    Object.defineProperty(root,'SS63MotionDemo',{value:demo});
    const mode=root.document.getElementById('timing-choice');mode.textContent=slow?'同步慢動作 · 所有角色共用倍率':'原速演出 · 所有角色共用倍率';
    const pause=root.document.getElementById('pause-consequence');
    const update=view=>{pause.textContent=view.paused?'繼續場上動作':'暫停場上動作';};
    pause.addEventListener('click',()=>demo.getState().paused?demo.resume():demo.pause());
    const unsubscribe=demo.subscribe(update);root.addEventListener('pagehide',unsubscribe,{once:true});
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(globalThis);
