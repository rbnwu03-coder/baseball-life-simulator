const fc = require('fast-check');
const assert = require('node:assert');

fc.assert(
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    assert.strictEqual(a + b, b + a);
  })
);

console.log('fast-check smoke PASS');