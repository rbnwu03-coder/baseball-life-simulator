"use strict";
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const C = require('./match-moment-snapshot-integrity-repair-v0.1-capture.cjs');
const originals = C.json(C.prefix + 'authorized-before-evidence.json').files;
const edits = [
  {
    file: 'script.js',
    before: [
      '  const finalMoment = match.completedMoments.at(-1);',
      '  if (finalMoment) {',
      '    finalMoment.scores = { ...match.scores };',
      '    finalMoment.runners = [null, null, null];',
      '    finalMoment.outs = 3;',
      '    finalMoment.half = "終";',
      '  }',
      ''
    ].join('\r\n'),
    after: ''
  },
  {
    file: 'match-experience-development.js',
    before: '  function createBatterEvidence(match, source, index) {',
    after: [
      '  function deriveBatterDecisionPressure(match, source) {',
      '    const anticipation = source.batterAnticipation;',
      '    const context = anticipation?.publicContext;',
      '    const identity = [match.id, source.id, "player", source.inning, source.half].join("|");',
      '    // Only the same PA\'s existing pre-resolution context can supply decision pressure.',
      '    if (!context || anticipation.identity !== identity',
      '      || !Number.isInteger(context.inning) || context.inning !== source.inning',
      '      || !Number.isInteger(context.outs) || context.outs < 0 || context.outs > 2',
      '      || !Number.isFinite(context.scoreDifference)',
      '      || !Array.isArray(context.runners) || context.runners.length !== 3',
      '      || !context.runners.every(value => typeof value === "boolean")) return undefined;',
      '    return derivePressure({ ...context, scoreMargin: context.scoreDifference, regulationInnings: match.regulationInnings });',
      '  }',
      '',
      '  function createBatterEvidence(match, source, index) {'
    ].join('\n')
  },
  {
    file: 'match-experience-development.js',
    before: '      situation, meaningful: true, decisionQuality, executionQuality,',
    after: '      situation, meaningful: true, decisionQuality, executionQuality,\n      pressure: deriveBatterDecisionPressure(match, source),'
  }
];
C.integrity('red');
const sources = new Map(originals.map(row => [row.file, row.source]));
for (const file of new Set(edits.map(edit => edit.file))) {
  assert.equal(fs.readFileSync(path.join(C.root, file), 'utf8'), sources.get(file), file + ' must still match authorized before');
}
for (const edit of edits) {
  const before = sources.get(edit.file);
  assert.equal(before.split(edit.before).length, 2, 'Unique replacement: ' + edit.file);
  sources.set(edit.file, before.replace(edit.before, edit.after));
}
for (const file of new Set(edits.map(edit => edit.file))) fs.writeFileSync(path.join(C.root, file), sources.get(file));
C.capture('production-delta', {
  edits,
  files: [...new Set(edits.map(edit => edit.file))].map(file => ({file, beforeHash: originals.find(row => row.file === file).sha256, afterHash: C.fileHash(file), exactOutsideReplacementsUnchanged: fs.readFileSync(path.join(C.root, file), 'utf8') === sources.get(file)})),
  saveSchemaChanged: false,
  producersAndRngOutsideReplacementsUnchanged: true
});
C.integrity();
console.log('Applied two bounded Production edits; all bytes outside exact replacements preserved.');
