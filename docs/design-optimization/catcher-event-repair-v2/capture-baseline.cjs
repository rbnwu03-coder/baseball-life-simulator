"use strict";
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const {execFileSync, spawnSync} = require("node:child_process");
const root = path.resolve(__dirname, "../../..");
const commit = "5aae9bd4c7c017a38761ddd690fddbd58e16a661";
const baseline = fs.mkdtempSync(path.join(os.tmpdir(), "catcher-playback-baseline-"));
const git = (...args) => execFileSync("git", ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, ...args], {cwd:root,maxBuffer:16000000});
const index = git("show", `${commit}:index.html`).toString("utf8");
const files = ["index.html", ...[...index.matchAll(/<script src="([^"]+)"/g)].map(row=>row[1]),
  "tests/helpers/canonical-match-contract-context.cjs"];
for (const file of files) {
  const target = path.join(baseline, file);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, git("show", `${commit}:${file}`));
}
const test = "tests/catcher-event-context-consistency-test.cjs";
fs.copyFileSync(path.join(root, test), path.join(baseline, test));
const run = spawnSync(process.execPath, [test, "--continuation-only", "--capture-continuation-only",
  `--continuation-evidence=${path.join(__dirname, "continuation-before.json")}`], {cwd:baseline, encoding:"utf8", timeout:60000});
fs.writeFileSync(path.join(__dirname, "baseline-capture.txt"), `${run.stdout || ""}${run.stderr || ""}`.replace(/\r\n/g, "\n"));
fs.writeFileSync(path.join(__dirname, "baseline-source.json"), JSON.stringify({commit, baseline, files,
  methodology:"Current continuation test against exact committed baseline index/runtime/helper; no runtime resolver replaced",
  exitCode:run.status, error:run.error?.message || null}, null, 2)+"\n");
console.log(JSON.stringify({commit, baseline, exitCode:run.status}));
if (run.status !== 0) process.exitCode = 1;
