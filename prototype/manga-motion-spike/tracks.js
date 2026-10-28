/* Offline, bounded source inventory. This is not an end-to-end motion implementation. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.defineProperty(root, 'SS63PresentationTracks', { value: api });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const requiredGaps = Object.freeze(['BALL_APPROACH_CONTROL', 'R1_RESULT_SECOND', 'BR_ARRIVAL_RETIREMENT']);
  function createManifest(fixture, presentation) {
    if (fixture.resolution.actualRouteId !== 'secureFirstBaseOut' || fixture.playback.length !== 7 || fixture.playback.some(e => e.actualRouteId !== 'secureFirstBaseOut')) throw new Error('Unsupported track source');
    const scenes = fixture.playback.map((currentBeat, i) => presentation.project({ phase: 'Playback', decision: fixture.decision,
      currentBeat, revealedBeats: fixture.playback.slice(0, i + 1), scoreState: fixture.decision.state, session: 1, playbackRuns: 1 }));
    const resolved = presentation.project({ phase: 'Resolution', decision: fixture.decision, resolution: fixture.resolution, scoreState: fixture.resolution.state });
    const point = (scene, id) => { const actor = id === 'ball-marker' ? scene.ball : scene.actors.find(a => a.elementId === id); return [actor.x, actor.y]; };
    const r1 = fixture.resolution.runnerChanges.find(c => c.from === 1), br = fixture.resolution.runnerChanges.find(c => c.from === 'batter');
    if (r1?.runnerId !== 'regional-power-school-player-04' || br?.runnerId !== 'regional-power-school-player-09') throw new Error('Runner identity mismatch');
    const receiver = fixture.playback.find(e => e.type === 'throw').payload.receiverId;
    if (!receiver || fixture.playback.find(e => e.type === 'receive').payload.actorId !== receiver || fixture.playback.find(e => e.type === 'contest').payload.runnerId !== br.runnerId) throw new Error('Actor binding mismatch');
    const bindings = [['ball-marker', 'Ball', null, 'playback[0,2,3,4].payload'],
      ['actor-ss', 'SS', fixture.decision.player.id, 'decision.player.id; playback[1,2,3].payload.actorId'],
      ['actor-receiver', '1B', receiver, 'playback[3].payload.receiverId; playback[4].payload.actorId'],
      ['actor-original-runner', 'R1', r1.runnerId, 'resolution.runnerChanges[from=1].runnerId'],
      ['actor-batter-runner', 'BR', br.runnerId, 'playback[5].payload.runnerId; resolution.runnerChanges[from=batter].runnerId']];
    const tracks = bindings.map(([id, role, sourceId, field]) => ({ id, role, sourceId,
      identitySource: { file: 'prototype/match-ui-p1/fixture.js', field },
      identityAvailability: role === 'R1' ? 'Resolution; offline binding only before reveal' : role === 'BR' ? 'contest; offline binding before contest' : role === '1B' ? 'throw' : 'Decision',
      segments: scenes.map((scene, i) => {
        const movement = scene.movements.find(m => m.key === id), pose = point(scene, id);
        return { phase: 'Playback', motionInterval: fixture.playback[i].type, normalizedInterval: [0, 1],
          from: [...(movement?.from || pose)], to: [...(movement?.to || pose)], originalMovement: Boolean(movement), newPresentationInterpolation: false,
          stationaryAllowed: !movement || JSON.stringify(movement.from) === JSON.stringify(movement.to),
          unresolvedGap: id === 'ball-marker' && i === 2 ? 'BALL_APPROACH_CONTROL' : null,
          involvesUnpublishedInformation: true, availableWhen: 'Only after this semantic beat is public',
          sources: [{ file: 'prototype/match-ui-p1/presentation.js', field: 'project: movements / actors / ball for current beat' },
            { file: 'prototype/match-ui-p1/fixture.js', field: 'playback[' + i + ']' }] };
      }) }));
    const gap = (id, actor, from, to, interval, availableWhen) => ({ id, actor, from, to, phase: interval === 'approach -> control' ? 'Playback' : 'Resolution',
      motionInterval: interval, originalMovement: false, newPresentationInterpolation: false, authorized: false,
      stationaryAllowed: false, unresolvedGap: true, involvesUnpublishedInformation: true, availableWhen,
      sources: [{ file: 'prototype/match-ui-p1/presentation.js', field: 'project: current pose and resolution arrangement' }], policy: 'BLOCK; no interpolation or arrival-time inference' });
    const gaps = [gap(requiredGaps[0], 'ball-marker', point(scenes[1], 'ball-marker'), point(scenes[2], 'ball-marker'), 'approach -> control', 'control'),
      gap(requiredGaps[1], 'actor-original-runner', point(scenes[6], 'actor-original-runner'), point(resolved, 'actor-original-runner'), 'result -> second base', 'Resolution'),
      gap(requiredGaps[2], 'actor-batter-runner', point(scenes[6], 'actor-batter-runner'), point(resolved, 'actor-batter-runner'), 'arrival / retirement undefined', 'Resolution')];
    return freeze({ version: 'ss63-bounded-tracks/0.1', sourceKind: 'SVG illustrative coordinates; not physical measurements',
      routeId: 'secureFirstBaseOut', readyForEndToEnd: false, runtimeUse: 'Inventory only; no complete playable track', tracks, gaps });
  }
  function validateManifest(manifest) {
    if (manifest?.version !== 'ss63-bounded-tracks/0.1' || manifest.routeId !== 'secureFirstBaseOut' || manifest.readyForEndToEnd !== false || manifest.tracks?.length !== 5) throw new Error('Invalid bounded manifest');
    if (manifest.gaps?.length !== 3 || requiredGaps.some(id => !manifest.gaps.some(g => g.id === id && g.authorized === false && g.originalMovement === false && g.unresolvedGap === true))) throw new Error('Missing or incorrectly approved gap');
    const bindings = { 'actor-ss': 'player', 'actor-original-runner': 'regional-power-school-player-04', 'actor-batter-runner': 'regional-power-school-player-09' };
    if (new Set(manifest.tracks.map(t => t.id)).size !== 5 || Object.entries(bindings).some(([id, source]) => manifest.tracks.find(t => t.id === id)?.sourceId !== source)) throw new Error('Invalid actor binding');
    for (const gap of manifest.gaps) if (![...gap.from, ...gap.to].every(Number.isFinite)) throw new Error('Invalid gap coordinates');
    for (const track of manifest.tracks) for (const s of track.segments) {
      if (s.phase !== 'Playback' || s.newPresentationInterpolation !== false || ![...s.from, ...s.to].every(Number.isFinite)) throw new Error('Invalid source segment');
    }
    return true;
  }
  function assertPlayable(manifest, routeId) {
    validateManifest(manifest);
    if (routeId !== manifest.routeId) throw new Error('Unsupported motion route');
    throw new Error('Unapproved bounded track gaps: ' + requiredGaps.join(', '));
  }
  const issued = new WeakSet();
  const authority = 'Sprint UI-P2.4B user attachment 4c1d39ae-e729-473f-a583-f83d5d86cefe sections 6-8';
  function createPlayableManifest(fixture,presentation) {
    const inventory=createManifest(fixture,presentation); validateManifest(inventory);
    if(fixture.resolution.resultCode!=='oneOut' || fixture.resolution.state.outs!==2 || fixture.resolution.runnerChanges.find(c=>c.from===1)?.to!==2 || fixture.resolution.runnerChanges.find(c=>c.from==='batter')?.to!=='out') throw Error('Unverified SS6-3 result');
    if(fixture.playback[0].payload.ballType!=='groundBall'||fixture.playback[0].payload.direction!=='leftSide'||[1,2,3,4].some(i=>fixture.playback[i].payload.status!=='completed')||fixture.playback[3].payload.targetBase!=='first'||fixture.playback[4].payload.targetBase!=='first'||fixture.resolution.state.scores.home!==fixture.decision.state.scores.home||fixture.resolution.state.scores.away!==fixture.decision.state.scores.away)throw Error('Unverified motion source');
    const times=[0,450,1550,2400,2850,3450,4550];
    const geometry={
      'ball-marker':[[170,244],[137,132],[128,123],[128,123],[268,154],[268,154],[268,154]],
      'actor-ss':[[115,101],[115,101],[128,123],[128,123],[128,123],[128,123],[128,123]],
      'actor-receiver':[[280,141],[280,141],[280,141],[280,141],[268,154],[268,154],[268,154]],
      'actor-original-runner':[[253,137],[244,129],[233,119],[222,109],[212,99],[202,91],[184,71]],
      'actor-batter-runner':[[182,237],[193,224],[207,210],[227,191],[242,177],[255,164],[258,164]]
    };
    const tracks=inventory.tracks.map(t=>({id:t.id,role:t.role,sourceId:t.sourceId,identitySource:t.identitySource,
      segments:times.slice(1).map((end,i)=>({start:times[i],end,from:geometry[t.id][i],to:geometry[t.id][i+1],reveal:'motion:'+['ballInPlay','approach','control','throw','receive','contest'][i],sources:[...t.segments[i].sources,...t.segments[Math.min(6,i+1)].sources,{file:authority,field:"approved illustrative checkpoint / retiming; not physical arrival"}],authorization:authority,kind:'presentation-only interpolation'})),
      exit:{start:4550,end:5450,from:geometry[t.id][6],to:t.id==='actor-original-runner'?[170,56]:t.id==='actor-batter-runner'?[294,215]:geometry[t.id][6],reveal:'Resolution-confirmed',sources:[t.identitySource,{file:'prototype/match-ui-p1/presentation.js',field:'POINTS / Resolution arrangement; not sprint endpoint'},{file:authority,field:'Gap B or C confirmed consequence interpolation'}],authorization:authority,kind:t.role==='BR'?'retirement arrangement; never sprint arrival':'confirmed consequence interpolation'}
    }));
    const manifest=freeze({version:'ss63-bounded-tracks/0.2',routeId:inventory.routeId,sourceKind:inventory.sourceKind,units:'illustrative-presentation-ms',authority,legacyInventory:inventory,tracks,motionEnd:4550,exitEnd:5450,revealPolicy:'ss63-motion-milestones/0.1',readyForEndToEnd:true,
      gapPolicies:[{id:requiredGaps[0],policy:'approach-only ball linkage; no bounce or quality inference'},{id:requiredGaps[1],policy:'pre-verdict approach stops short of second; final arrival only after Resolution confirmation; occupancy unchanged until Resolution'},{id:requiredGaps[2],policy:'sprint stops short of first; retirement movement only after Resolution confirmation; resolution arrangement is not sprint endpoint'}]});
    issued.add(manifest); validatePlayable(manifest); return manifest;
  }
  function validatePlayable(m) {
    if(!issued.has(m)||m.version!=='ss63-bounded-tracks/0.2'||m.routeId!=='secureFirstBaseOut'||m.authority!==authority||m.revealPolicy!=='ss63-motion-milestones/0.1'||m.tracks.length!==5)throw Error('Unissued or invalid playable manifest');
    validateManifest(m.legacyInventory);
    for(const t of m.tracks){if(t.segments.length!==6)throw Error('Missing segment');let previous=null;for(const s of [...t.segments,t.exit]){if(!s.authorization||!s.sources?.length||![...s.from,...s.to,s.start,s.end].every(Number.isFinite)||s.end<=s.start)throw Error('Invalid endpoint');if(previous&&(previous.end!==s.start||JSON.stringify(previous.to)!==JSON.stringify(s.from)))throw Error('Discontinuous track');previous=s;}if(t.exit.reveal!=='Resolution-confirmed')throw Error('Invalid reveal');}
    const br=m.tracks.find(t=>t.role==='BR'),r1=m.tracks.find(t=>t.role==='R1');
    if(JSON.stringify(br.segments[5].to)===JSON.stringify(br.exit.to)||JSON.stringify(r1.segments[5].to)==='[170,56]')throw Error('Premature arrival');
    return true;
  }
  function requirePlayable(m,route){validatePlayable(m);if(route!==m.routeId)throw Error('Unsupported motion route');return true;}
  return Object.freeze({ createManifest, validateManifest, assertPlayable, requiredGaps, createPlayableManifest, validatePlayable, requirePlayable });
});
