/* Pure presentation coordinate contract. No timers, Controller or baseball rules. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.defineProperty(root, 'MatchPresentationClockContract', { value: api });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 'presentation-clock/0.1';
  const beats = Object.freeze(['ballInPlay', 'approach', 'control', 'throw', 'receive', 'contest', 'result']);
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  function createPlan(events, durationFor) {
    if (events.length !== 7 || events.some((e, i) => e.type !== beats[i])) throw new Error('Invalid semantic plan');
    let offset = 0;
    const intervals = events.map(event => {
      const duration = durationFor(event.type);
      if (!Number.isFinite(duration) || duration <= 0) throw new Error('Invalid presentation duration');
      const start = offset; offset += duration;
      return { beat: event.type, start, end: offset, duration };
    });
    // Result is a static verdict node. Motion completion never confirms Resolution.
    return freeze({ version: VERSION, intervals, motionEnd: intervals[6].start, rate: 1, units: 'illustrative-presentation-ms' });
  }
  function integrate(playTime, activeWallTime, limit) {
    if (![playTime, activeWallTime, limit].every(Number.isFinite) || playTime < 0 || activeWallTime < 0 || limit < playTime) throw new Error('Invalid clock coordinate');
    return Math.min(limit, playTime + activeWallTime); // Foundation rate=1; no slow-mo profile yet.
  }
  function snapshot(value) {
    if (!Number.isFinite(value.playTime) || value.playTime < 0 || !Number.isInteger(value.epoch) || !Number.isInteger(value.playbackRunId)) throw new Error('Invalid clock snapshot');
    return freeze({ ...value, readingState: { ...value.readingState } });
  }
  function withRemapping(timing, slow = true) {
    if (timing?.version !== 'ss63-timing/0.1' || !['toWall','toPlay','rateAt'].every(k=>typeof timing[k]==='function')) throw Error('Missing timing profile');
    return Object.freeze({ VERSION, snapshot, beats,
      createPlan(events, durationFor) { const base=createPlan(events,durationFor); if(base.motionEnd!==4550 || base.intervals.slice(0,6).some((s,i)=>s.start!==timing.boundaries[i] || s.end!==timing.boundaries[i+1])) throw Error('Unsupported timing source'); return freeze({...base, independentMotion:true, revealPolicy:'ss63-motion-milestones/0.1', exitEnd:base.motionEnd+900, slow}); },
      integrate(p, delta, limit) { integrate(p, delta, limit); return Math.min(limit,timing.toPlay(timing.toWall(p,slow)+delta,slow)); },
      remainingWall(p, end) { return Math.max(0,timing.toWall(end,slow)-timing.toWall(p,slow)); },
      rateAt(p) { return timing.rateAt(p,slow); }
    });
  }
  return Object.freeze({ VERSION, beats, createPlan, integrate, snapshot, withRemapping });
});
