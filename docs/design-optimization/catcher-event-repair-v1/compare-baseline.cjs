"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const baselineRoot = process.argv[2];
if (!baselineRoot) throw new Error("Pass the unchanged integration worktree path");
const file = "tests/high-school-integration-1-2-test.js";
const hash = filename => crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex");
const run = spawnSync(process.execPath, [file], {cwd:baselineRoot, encoding:"utf8", timeout:60000});
const log = `${run.stdout || ""}${run.stderr || ""}`.replace(/\r\n/g, "\n");
fs.writeFileSync(path.join(__dirname, "high-school-integration-1-2-baseline.txt"), log);
const after = fs.readFileSync(path.join(__dirname, "high-school-integration-1-2-test.js.txt"), "utf8");
const failure = text => text.match(/AssertionError \[ERR_ASSERTION\]: (.+)/)?.[1] || null;
const result = {baselineRoot, file, baselineExitCode:run.status, error:run.error?.message || null,
  baselineScriptSha256:hash(path.join(baselineRoot, "script.js")),
  baselineTestSha256:hash(path.join(baselineRoot, file)),
  repairTestSha256:hash(path.resolve(__dirname, "../../..", file)),
  baselineFailure:failure(log), repairFailure:failure(after),
  baselineAssertionsPassed:(log.match(/^✓ /gm) || []).length,
  repairAssertionsPassed:(after.match(/^✓ /gm) || []).length};
result.sameExistingFailure = result.baselineExitCode === 1 && result.baselineFailure !== null &&
  result.baselineFailure === result.repairFailure && result.baselineTestSha256 === result.repairTestSha256 &&
  result.baselineAssertionsPassed === result.repairAssertionsPassed;
fs.writeFileSync(path.join(__dirname, "baseline-comparison.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result));
if (!result.sameExistingFailure) process.exitCode = 1;
