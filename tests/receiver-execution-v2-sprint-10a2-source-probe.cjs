"use strict";
// Original LEGACY fixtures in an isolated VM, only for source extraction.
const fs = require("node:fs"), path = require("node:path"), Module = require("node:module");
const cp = require("node:child_process");
const root = path.resolve(__dirname, "..");
const baseline = "9f768212116bd267f6d436a67b7ed9b0088a2f86";
const protectedPaths = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(root, "docs/receiver-execution-v2-sprint-10a2-baseline-evidence.json"), "utf8")).protectedMetadata));
const helperPath = "tests/high-school-career-test-context.js";
const fixturePath = "tests/first-base-receive-active-ground-production-integration-test.js";
function makeHarness() {
  const readPaths = new Set([helperPath, fixturePath]);
  const safeFs = Object.create(fs), ordinaryRequire = Module.createRequire(path.join(root, helperPath));
  safeFs.readFileSync = (file, options) => {
    const p = path.relative(root, path.resolve(String(file))).replace(/\\/g, "/");
    if (protectedPaths.has(p)) throw Error("Protected content read denied: " + p);
    readPaths.add(p); return fs.readFileSync(file, options);
  };
  const helper = new Module(path.join(root, helperPath), module);
  helper.filename = path.join(root, helperPath); helper.paths = Module._nodeModulePaths(path.dirname(helper.filename));
  helper.require = id => id === "fs" ? safeFs : ordinaryRequire(id);
  const hs = safeFs.readFileSync(helper.filename, "utf8"), source = safeFs.readFileSync(path.join(root, fixturePath), "utf8");
  for (const [p, s] of [[helperPath, hs], [fixturePath, source]]) {
    const old = cp.execFileSync("git", ["show", baseline + ":" + p], { cwd: root, encoding: "utf8", maxBuffer: 30 * 1024 * 1024 });
    if (s.replace(/\r\n/g, "\n") !== old.replace(/\r\n/g, "\n")) throw Error("Original fixture changed");
  }
  helper._compile(hs, helper.filename);
  const c = helper.exports.makeContext(); let loaded = 0;
  for (const m of source.matchAll(/\brun\(\x60([\s\S]*?)\x60\);/g)) if (m[1].includes("function firstBaseFixture")) { c.run(m[1]); loaded++; }
  if (loaded !== 1) throw Error("Only original fixture definitions must be loaded");
  c.run(`
    var s10a2Owned=[];
    var s10a2Prepare=prepareHighSchoolDefensiveMomentFromSimulation;
    prepareHighSchoolDefensiveMomentFromSimulation=function(match,options){
      if(typeof options?.randomSource==='function'){
        var original=options.randomSource;
        options={...options,randomSource:()=>{var value=original();s10a2Owned.push({phase:match.activeSituation?.lifecycleState||null,value});return value;}};
      }
      return s10a2Prepare(match,options);
    };
    function s10a2Before(options){
      var original=beginAutomaticGroundBallSituationExecution;
      beginAutomaticGroundBallSituationExecution=()=>{throw Error('S10A2_BEFORE_EXECUTION');};
      try{firstBaseFixture(options);throw Error('Missing expected automatic boundary');}
      catch(error){if(error.message!=='S10A2_BEFORE_EXECUTION')throw error;}
      finally{beginAutomaticGroundBallSituationExecution=original;}
      return player.highSchoolMatch;
    }
  `);
  function collect(options = {}, phase = "beforeExecution") {
    const opts = { position: "\u6e38\u64ca\u624b", direction: .1, occupied: 0, ...options };
    c.run("s10a2Owned=[];var m=" + (phase === "beforeExecution" ? "s10a2Before" : "firstBaseFixture") + "(" + JSON.stringify(opts) + ");");
    const view = c.json(`({scope:'productionSourceObservation',phase:${JSON.stringify(phase)},requestedRouteId:'secureFirstBaseOut',
      match:m,opportunity:getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth),
      observedOwnedSamples:s10a2Owned})`);
    return { view, readPaths: [...readPaths], vm: c, playerBefore: c.run("JSON.stringify(player)") };
  }
  function collectHold() {
    const before = collect({}, "beforeExecution"); before.view.requestedRouteId = "holdBall";
    c.run("var held=firstBaseExecute(m,'contain',.8);resumeResolvedHighSchoolGroundBallSettlement(m);");
    const view = c.json("({scope:'productionSourceObservation',phase:'postExecution',requestedRouteId:'holdBall',match:m,opportunity:getHighSchoolDefensiveOpportunity(m,m.groundBallInPlayState.physicalTruth),observedOwnedSamples:s10a2Owned})");
    return { before, after: { view, readPaths: [...readPaths], vm: c, playerBefore: c.run("JSON.stringify(player)") } };
  }
  return { collect, collectHold, context: c, readPaths };
}
module.exports = { makeHarness, baseline, protectedPaths };
