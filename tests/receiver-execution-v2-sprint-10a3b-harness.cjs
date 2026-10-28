"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), Module = require("node:module"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), baseline = "ab3117653945de0b7013636187c446276a96e634";
const B = JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a3b-baseline-evidence.json"), "utf8"));
const protectedPaths = new Set(Object.keys(B.protectedMetadata));
const git = (...args) => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 30000000 });
function makeHarness(mode = "current") {
  const contextPath = "tests/high-school-career-test-context.js", fixturePath = "tests/first-base-receive-active-ground-production-integration-test.js", readPaths = new Set([contextPath, fixturePath]);
  const sources = {};
  if (mode === "baseline") {
    sources["index.html"] = git("show", baseline + ":index.html");
    for (const item of sources["index.html"].matchAll(/<script src="([^"]+)"/g)) if (item[1] !== "application-controller.js") sources[item[1]] = git("show", baseline + ":" + item[1]);
  } else assert.equal(mode, "current");
  const safeFs = Object.create(fs);
  safeFs.readFileSync = (file, options) => {
    const p = path.relative(root, path.resolve(String(file))).replace(/\\/g, "/"); if (protectedPaths.has(p)) throw Error("Protected content read prohibited"); readPaths.add(p);
    if (Object.hasOwn(sources, p)) return typeof options === "string" || options?.encoding ? sources[p] : Buffer.from(sources[p]);
    return fs.readFileSync(file, options);
  };
  const file = path.join(root, contextPath), helper = new Module(file, module), ordinaryRequire = Module.createRequire(file);
  helper.filename = file; helper.paths = Module._nodeModulePaths(path.dirname(file)); helper.require = id => id === "fs" ? safeFs : ordinaryRequire(id);
  const helperSource = safeFs.readFileSync(file, "utf8"), fixtureSource = safeFs.readFileSync(path.join(root, fixturePath), "utf8");
  for (const [p, s] of [[contextPath, helperSource], [fixturePath, fixtureSource]]) assert.equal(s.replace(/\r\n/g, "\n"), git("show", baseline + ":" + p).replace(/\r\n/g, "\n"), "Original fixture changed");
  helper._compile(helperSource, file); const c = helper.exports.makeContext(); let definitions = 0;
  for (const m of fixtureSource.matchAll(/\brun\(\x60([\s\S]*?)\x60\);/g)) if (m[1].includes("function firstBaseFixture") || m[1].includes("function firstBaseIncomingBoundary")) { c.run(m[1]); definitions++; }
  assert.equal(definitions, 2);
  c.run(`
    var s3bRng={callbacks:[],matchRng:[]};
    var s3bOriginalPrepare=prepareHighSchoolDefensiveMomentFromSimulation;
    prepareHighSchoolDefensiveMomentFromSimulation=function(match,options){
      if(typeof options?.randomSource==='function'){var original=options.randomSource;options={...options,randomSource:()=>{var value=original();s3bRng.callbacks.push({phase:match.activeSituation?.lifecycleState||null,value});return value;}};}
      return s3bOriginalPrepare(match,options);
    };
    var s3bOriginalRng=nextHighSchoolMatchSimulationRandom;
    nextHighSchoolMatchSimulationRandom=function(...args){var value=s3bOriginalRng(...args);s3bRng.matchRng.push(value);return value;};
    function s3bBefore(options){var original=beginAutomaticGroundBallSituationExecution;beginAutomaticGroundBallSituationExecution=()=>{throw Error('S3B_BEFORE_EXECUTION');};
      try{firstBaseFixture(options);throw Error('Missing automatic boundary');}catch(e){if(e.message!=='S3B_BEFORE_EXECUTION')throw e;}finally{beginAutomaticGroundBallSituationExecution=original;}return player.highSchoolMatch;}
  `);
  function fresh(options = {}, phase = "automatic") {
    c.run("s3bRng={callbacks:[],matchRng:[]};var m=" + (phase === "beforeExecution" ? "s3bBefore" : "firstBaseFixture") + "(" + JSON.stringify({ position: "\u6e38\u64ca\u624b", direction: .1, occupied: 0, ...options }) + ");");
    return c.json("m");
  }
  function snapshot() { return c.json("({player,match:m,rng:s3bRng})"); }
  function cold(label = "source cold") {
    c.run("var s3bSourceWire=JSON.stringify(player);saveGame();var s3bSavedWire=localStorage.getItem(SAVE_KEY);var s3bExpected=normalizeSave(JSON.parse(s3bSavedWire));player=createInitialPlayer(" + JSON.stringify(label) + ");loadGame();m=player.highSchoolMatch;");
    assert.deepEqual(c.json("player"), c.json("s3bExpected")); return snapshot();
  }
  return { ...c, mode, fresh, snapshot, cold, readPaths };
}
const METADATA = new Set(["receiverSourceFormatVersion", "receiverSourceAdmission", "receiverSourceSnapshot", "receiverSourcePin", "receiverSourceExecutionBinding", "receiverSourceSaveFormatVersion"]);
function officialProjection(value, rootPlayer = false) {
  if (Array.isArray(value)) return value.map(v => officialProjection(v));
  if (value && typeof value === "object") {
    const result = {};
    for (const [k, v] of Object.entries(value)) if (!METADATA.has(k)) result[k] = k === "saveVersion" && rootPlayer && v === 16 ? 15 : officialProjection(v, k === "player");
    return result;
  }
  return value;
}
module.exports = { makeHarness, officialProjection, baseline, protectedPaths, git };
