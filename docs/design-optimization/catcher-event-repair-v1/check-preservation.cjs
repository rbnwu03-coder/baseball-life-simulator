"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const manifestPath = process.argv[2];
if (!manifestPath) throw new Error("Pass the pre-repair root-preservation-before.json path");
const parse = file => JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const before = parse(path.join(__dirname, "scene-before.json"));
const manifest = parse(manifestPath);
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const git = (cwd, ...args) => execFileSync("git", ["-c", `safe.directory=${cwd.replaceAll("\\", "/")}`, ...args], {cwd, encoding:"utf8"}).trim();
const changes = manifest.filter(row => {
  const file = path.join(before.root.path, row.path);
  return !fs.existsSync(file) || hash(file) !== row.sha256;
}).map(row => row.path);
const current = {branch:git(before.root.path,"branch","--show-current"), head:git(before.root.path,"rev-parse","HEAD"),
  status:git(before.root.path,"status","--porcelain=v1")};
const integration = {branch:git(before.integration.path,"branch","--show-current"), head:git(before.integration.path,"rev-parse","HEAD"),
  status:git(before.integration.path,"status","--porcelain=v1"), scriptSha256:hash(path.join(before.integration.path,"script.js"))};
const result = {checkedFiles:manifest.length, changedExistingFiles:changes,
  beforeManifestPath:manifestPath, beforeManifestSha256:hash(manifestPath),
  rootUnchanged:changes.length===0 && current.branch===before.root.branch && current.head===before.root.head &&
    current.status.replaceAll("\r","")===before.root.status.join("\n").trim(),
  integrationUnchanged:integration.branch===before.integration.branch && integration.head===before.integration.head &&
    integration.scriptSha256===before.integration.scriptSha256 && integration.status===before.integration.status.join("\n").trim(),
  root:current, integration};
fs.writeFileSync(path.join(__dirname,"preservation-after.json"), JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result));
if (!result.rootUnchanged || !result.integrationUnchanged) process.exitCode=1;
