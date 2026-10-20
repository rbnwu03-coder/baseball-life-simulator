'use strict';
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const norm = x => x.replace(/\r\n?/g, '\n');
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const css = '  <link rel="stylesheet" href="style.css">';
const js = '  <script src="application-controller.js"></script>';
const cssAdded = css + '\n  <link rel="stylesheet" href="match-pitch-decision-ui.css">';
const jsAdded = js + '\n  <script src="match-pitch-decision-ui.js"></script>';
const scopeLine = "  currentText = require('./g2-b2-source-delta.cjs').stripMatchSource(file, currentText);\n";
function stripIndex(source) {
  let s = norm(source);
  if (!/match-pitch-decision-ui\.(?:js|css)/.test(s)) return s;
  for (const anchor of [cssAdded, jsAdded]) assert.equal(s.split(anchor).length, 2, 'G2-B2 exact loader missing/duplicated');
  s = s.replace(cssAdded, css).replace(jsAdded, js);
  assert.equal(sha(s), '67c117f897cf86e2a55ee3ed26ddf1c5eaf8a4f73a3017ede1436220d278cf30', 'G2-B2 index outside exact additive loader');
  return s;
}
function stripScope(source) {
  const s = norm(source);
  assert.equal(s.split(scopeLine).length, 2, 'G2-B2 guard migration missing/duplicated');
  const original = s.replace(scopeLine, '');
  assert.equal(sha(original), 'cc98ef0fd98f4ad128e5a714b1823c3a294bef1b6c01d06bfc7391f049046644', 'G2-A scope body/pins changed');
  return original;
}
function assertPriorBridgeTest(source) {
  let s = norm(source);
  const edits = [
    ["const index=require('./g2-b2-source-delta.cjs').stripIndex(norm(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8')));",
      "const index=norm(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));"],
    ["const scope=require('./g2-b2-source-delta.cjs').stripScope(norm(fs.readFileSync(path.join(__dirname,'pitch-production-source-scope.cjs'),'utf8')));",
      "const scope=norm(fs.readFileSync(path.join(__dirname,'pitch-production-source-scope.cjs'),'utf8'));"]
  ];
  for (const [after, before] of edits) { assert.equal(s.split(after).length, 2); s = s.replace(after, before); }
  assert.equal(sha(s), '8ed2c64b539c0d78e4207927f298fde7a5c787791c04296f36fe778edd626b3e', 'Original G2-A test/assertions changed');
  return true;
}
module.exports = { stripIndex, stripScope, assertPriorBridgeTest, scopeLine, cssAdded, jsAdded,
  stripMatchSource(file, source) { return file === 'index.html' ? stripIndex(source) : source; } };
