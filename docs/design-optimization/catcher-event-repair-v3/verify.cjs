"use strict";
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const {spawnSync} = require("node:child_process");
const root = path.resolve(__dirname, "../../..");
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex");
const suites = [
  "tests/catcher-event-context-consistency-test.cjs",
  "tests/catcher-choice-outcome-integrity-v1-test.js",
  "tests/offensive-tactical-action-sprint-b2-defensive-handoff-test.js",
  "tests/offensive-tactical-action-sprint-b2-runner-realization-test.js",
  "tests/offensive-tactical-action-sprint-b1-0-1-test.js",
  "tests/ai-plate-appearance-outcome-production-integration-test.js",
  "tests/third-out-runner-resolution-integrity-v1-test.js",
  "tests/force-multi-runner-settlement-production-integration-test.js",
  "tests/defensive-runner-throw-settlement-foundation-test.js",
  "tests/match-full-game-record-test.js",
  "tests/shared-infield-contract-2b-production-integration-test.js"
];
const results = suites.map(file => {
  const args = file === suites[0] ? [`--continuation-evidence=${path.join(__dirname,"continuation-after.json")}`] : [];
  const run = spawnSync(process.execPath,[file,...args],{cwd:root,encoding:"utf8",timeout:60000});
  const log = `${run.stdout || ""}${run.stderr || ""}`.replace(/\r\n/g,"\n");
  const logFile = path.basename(file)+".txt"; fs.writeFileSync(path.join(__dirname,logFile),log);
  const row = {file,sourceSha256:hash(file),exitCode:run.status,error:run.error?.message || null,
    passed:(log.match(/^(?:✓ |PASS )/gm)||[]).length,log:logFile};
  console.log(JSON.stringify(row)); return row;
});
fs.writeFileSync(path.join(__dirname,"verification.json"),JSON.stringify({executedAt:new Date().toISOString(),node:process.version,
  baseline:"009037725fbbdc0ce8603105fc6682bca6c4da4f",sources:["script.js","offensive-bunt-defensive-handoff.js"].map(file=>({file,sha256:hash(file)})),
  suites:results,scope:"catcher NPC hard ground bunt toward second base",fullProjectRerun:false,
  fullYearHealthAcceptance:"未完成；仍需原定兩場至年末流程"},null,2)+"\n");
if(results.some(row=>row.exitCode!==0 || row.error)) process.exitCode=1;
