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
  "tests/ai-plate-appearance-outcome-production-integration-test.js"
];
const results = suites.map(file => {
  const args = file === suites[0] ? [`--continuation-evidence=${path.join(__dirname,"continuation-after.json")}`] : [];
  const run = spawnSync(process.execPath, [file,...args], {cwd:root, encoding:"utf8", timeout:60000});
  const log = `${run.stdout || ""}${run.stderr || ""}`.replace(/\r\n/g,"\n");
  const logFile = path.basename(file)+".txt";
  fs.writeFileSync(path.join(__dirname, logFile),log);
  const row = {file, sourceSha256:hash(file), exitCode:run.status, error:run.error?.message || null,
    passed:(log.match(/^(?:✓ |PASS \d)/gm)||[]).length, failed:(log.match(/^FAIL /gm)||[]).length, log:logFile};
  console.log(JSON.stringify(row)); return row;
});
const sourceFiles = ["script.js", "offensive-bunt-defensive-handoff.js"];
fs.writeFileSync(path.join(__dirname,"verification.json"), JSON.stringify({executedAt:new Date().toISOString(),
  node:process.version, sources:sourceFiles.map(file=>({file,sha256:hash(file)})), suites:results,
  completionStatus:"BLOCKED: unsupported bunt settlement owner missing; continuation acceptance fails",
  pageAcceptance:"未完成", fullProjectRerun:false},null,2)+"\n");
if (results.some(x=>x.exitCode!==0 || x.error)) process.exitCode=1;
