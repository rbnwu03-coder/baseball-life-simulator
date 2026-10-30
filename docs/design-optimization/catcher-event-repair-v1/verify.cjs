"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../../..");
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex");
const suites = [
  "tests/catcher-event-context-consistency-test.cjs",
  "tests/catcher-choice-outcome-integrity-v1-test.js",
  "tests/offensive-tactical-action-sprint-b2-defensive-handoff-test.js",
  "tests/offensive-tactical-action-sprint-b1-0-1-test.js",
  "tests/high-school-integration-1-2-test.js",
  "tests/match-situation-lifecycle-test.js"
];
const results = suites.map(file => {
  const start = Date.now();
  const extra = file === suites[0] ? [`--evidence=${path.join(__dirname, "reproduction-after.json")}`] : [];
  const run = spawnSync(process.execPath, [file, ...extra], {cwd:root, encoding:"utf8", timeout:60000});
  const log = path.basename(file) + ".txt";
  fs.writeFileSync(path.join(__dirname, log), `${run.stdout || ""}${run.stderr || ""}`.replace(/\r\n/g, "\n"));
  const result = {file, sourceSha256:hash(file), exitCode:run.status,
    error:run.error?.message || null, elapsedMs:Date.now()-start,
    assertionsPassed:(run.stdout.match(/^✓ /gm) || []).length, log};
  console.log(JSON.stringify(result));
  return result;
});
const historical = "docs/design-optimization/y1-health-integration-acceptance-v1/historical-evidence.json";
const references = JSON.parse(fs.readFileSync(path.join(root, historical), "utf8")).references.map(ref => ({
  ...ref, actualSha256:hash(ref.file), hashMatches:hash(ref.file) === ref.sha256, rerunThisTurn:false
}));
fs.writeFileSync(path.join(__dirname, "verification.json"), JSON.stringify({
  executedAt:new Date().toISOString(), runtime:process.version,
  scriptSha256:hash("script.js"), execution:"Node/VM; not browser acceptance",
  suites:results, historicalEvidence:{manifest:historical, sha256:hash(historical), references},
  fullProjectRerun:false, pageAcceptance:"未完成，修補後待人工續驗"
}, null, 2) + "\n");
if (results.some(x => x.exitCode !== 0 || x.error) || references.some(x => !x.hashMatches)) process.exitCode = 1;
