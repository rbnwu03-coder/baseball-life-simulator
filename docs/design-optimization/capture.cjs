"use strict";
const fs = require("node:fs"), path = require("node:path"), cp = require("node:child_process"), crypto = require("node:crypto");
const root = path.resolve(__dirname, "../..");
const git = (...args) => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16000000 });
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex");
if (process.argv[2] === "before") {
  const status = git("status", "--porcelain=v1", "-uall");
  const paths = git("ls-files", "-z", "--cached", "--others", "--exclude-standard").split("\0").filter(p => p && !p.startsWith("docs/design-optimization/"));
  const files = Object.fromEntries(paths.filter(p => fs.existsSync(path.join(root,p)) && fs.statSync(path.join(root,p)).isFile()).map(p => [p, hash(p)]));
  fs.writeFileSync(path.join(__dirname,"baseline.json"), JSON.stringify({ capturedAt: new Date().toISOString(), branch: git("branch","--show-current").trim(), head: git("rev-parse","HEAD").trim(), node: process.version, status, files }, null, 2)+"\n", {flag:"wx"});
  console.log({files: paths.length, modified: status.split("\n").filter(l=>l.startsWith(" M")).length, untracked: status.split("\n").filter(l=>l.startsWith("??")).length});
} else if (process.argv[2] === "after") {
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname,"baseline.json"),"utf8"));
  const changed = Object.entries(baseline.files).filter(([p,h]) => !fs.existsSync(path.join(root,p)) || hash(p)!==h).map(([p])=>p);
  const result = { capturedAt:new Date().toISOString(), head:git("rev-parse","HEAD").trim(), checked:Object.keys(baseline.files).length, changed, status:git("status","--porcelain=v1","-uall") };
  fs.writeFileSync(path.join(__dirname,"preservation.json"),JSON.stringify(result,null,2)+"\n");
  console.log({checked:result.checked,changed,headSame:result.head===baseline.head});
} else throw Error("Use before or after");
