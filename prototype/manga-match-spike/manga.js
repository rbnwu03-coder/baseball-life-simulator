/* Presentation-only observer. The shared app alone owns state, timing and reveal. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    Object.defineProperty(root, 'MangaMatchSpike', { value: api });
    const boot = () => {
      const dispose = api.attach(root.document, root);
      root.addEventListener('pagehide', dispose, { once: true });
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const units = Object.freeze({
    wide: Object.freeze({ number: '01', title: 'Wide Field · 局勢', guide: '先讀局勢與跑者，再選擇守備路線。' }),
    fielding: Object.freeze({ number: '02', title: 'Fielding Focus · 處理來球', guide: '左側看你的接球動作，同時留意場上跑者。' }),
    action: Object.freeze({ number: '03', title: 'Action Sequence · 動作', guide: '沿傳球方向看向接傳點，同時留意兩名跑者。' }),
    impact: Object.freeze({ number: '04', title: 'Impact Frame · 判決', guide: '停在這一刻。確認後，再看本球局勢變化。' }),
    consequence: Object.freeze({ number: '05', title: 'Consequence Frame · 回看選擇', guide: '對照原本目標與本球實際變化。' })
  });
  const beatUnits = Object.freeze({ ballInPlay: 'wide', approach: 'fielding', control: 'fielding', throw: 'action', receive: 'action', contest: 'action', result: 'impact' });
  // Input is already-rendered phase/stage only. No fixture, DTO, future beat or
  // result payload enters this mapping; it cannot authorize or advance a reveal.
  function frameFor(phase, stage, textMode = false, reducedMotion = false) {
    let unit = null, guide;
    if (['Decision', 'Submitting', 'Unsupported'].includes(phase)) {
      unit = 'wide';
      if (phase === 'Submitting') guide = '選擇已確認，準備回到球場。';
      if (phase === 'Unsupported') guide = '此路線尚未收錄；返回選項，繼續比較。';
    } else if (phase === 'Playback' && Object.hasOwn(beatUnits, stage)) {
      unit = beatUnits[stage];
      if (stage === 'ballInPlay') guide = '看來球進入守區，並留意兩名跑者。';
      if (stage === 'receive') guide = '把視線留在主球場接傳點，留意打者跑者。';
      if (stage === 'contest') guide = '看接傳點與打者跑者，等待判決。';
    } else if (phase === 'Resolution' && stage === 'resolution') unit = 'consequence';
    if (!unit) return null;
    if (unit === 'fielding' && (textMode || reducedMotion)) guide = '逐段閱讀接近與控制來球的文字；可暫停或確認繼續。';
    return Object.freeze({ unit, ...units[unit], guide: guide || units[unit].guide });
  }
  function attach(document, environment) {
    const page = document.getElementById('demo'), field = document.getElementById('field');
    const caption = document.getElementById('manga-caption');
    const media = environment.matchMedia?.('(prefers-reduced-motion: reduce)');
    let lastKey = '', disposed = false;
    function render() {
      if (disposed) return;
      const frame = frameFor(page.dataset.phase, field.dataset.stage, page.dataset.textMode === 'true', Boolean(media?.matches));
      const key = frame ? frame.unit + ':' + frame.guide : '';
      if (key === lastKey && page.dataset.mangaUnit !== undefined) return;
      lastKey = key;
      page.dataset.mangaUnit = frame?.unit || 'none';
      caption.hidden = !frame;
      for (const [id, value] of [['manga-number', frame?.number], ['manga-title', frame?.title], ['manga-guide', frame?.guide]]) document.getElementById(id).textContent = value || '';
    }
    const observer = new environment.MutationObserver(render);
    observer.observe(page, { subtree: true, attributes: true, attributeFilter: ['data-phase', 'data-stage', 'data-text-mode', 'data-playback-stage'] });
    media?.addEventListener?.('change', render);
    render();
    return () => { disposed = true; observer.disconnect(); media?.removeEventListener?.('change', render); };
  }
  return Object.freeze({ units, beatUnits, frameFor, attach });
});
