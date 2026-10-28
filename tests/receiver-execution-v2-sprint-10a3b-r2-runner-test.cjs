"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const Runner = require("./receiver-execution-v2-sprint-10a3b-r2-runner.cjs");

const FIRST_BASE = "tests/first-base-receive-active-ground-production-integration-test.js";
const ORDINARY = "tests/career-save-admission-test.js";
const PROTECTED = [
    "tests/fast-check-smoke-test.cjs",
    "install.ps1",
    "docs/first-base-sprint-3-focused-development-evidence.json",
    "docs/infield-baseball-logic-audit-architecture-evidence.json",
    "docs/infield-baseball-logic-audit-evidence.json",
    "docs/infield-baseball-logic-audit-runner.cjs",
    "docs/infield-baseball-logic-validation-audit-v1.md",
    "docs/infield-scorer-recovery-sprint-5-green-evidence.json",
    "docs/infield-scorer-recovery-sprint-5-green-force-actual-only-evidence.json",
    "docs/infield-scorer-recovery-sprint-5-l03-red-evidence.json",
    "docs/infield-scorer-recovery-sprint-5-validation-force-actual-only.json",
    "docs/infield-scorer-recovery-sprint-5-validation.json"
];

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function passingPair() {
    const baseline = {
        exitCode: 0,
        error: null,
        stdout: "Original first-base cohorts: 200 + 200\n42 of 42 PASS\n",
        stderr: "",
        elapsedMs: 124000,
        summary: { passed: 42, failed: 0 },
        timeoutMs: 180000,
        maxBuffer: 16000000,
        nodeExecutable: process.execPath,
        nodeVersion: process.version,
        command: [process.execPath, FIRST_BASE],
        environment: { NODE_OPTIONS: null, NODE_ENV: null, TZ: "Asia/Taipei" },
        sourceHashes: { test: "a".repeat(64), helper: "b".repeat(64) }
    };
    const current = clone(baseline);
    current.elapsedMs = 122000;
    return { baseline, current };
}

function run() {
    const checks = [];
    function check(name, action) {
        try {
            action();
            checks.push({ name, pass: true });
        } catch (error) {
            checks.push({ name, pass: false, message: error.message });
        }
    }
    function rejects(name, action) {
        check(name, () => assert.throws(action));
    }
    function rejectedPair(name, mutate) {
        check(name, () => {
            const pair = passingPair();
            mutate(pair.baseline, pair.current);
            const result = Runner.evaluateRuntimePair(pair.baseline, pair.current);
            assert.equal(result.passed, false);
            assert.ok(result.checks.some(row => row.pass === false));
        });
    }

    check("Runner fixes the approved first-base target and Git baseline", () => {
        assert.equal(Runner.FIRST_BASE, FIRST_BASE);
        assert.equal(Runner.BASELINE, "ab3117653945de0b7013636187c446276a96e634");
    });
    check("First-base comparison receives the approved 180 seconds and original 16 MB buffer", () => {
        const policy = Runner.policyFor(FIRST_BASE, "comparison");
        assert.equal(policy.timeoutMs, 180000);
        assert.equal(policy.maxBuffer, 16000000);
    });
    check("Related first-base receives 180 seconds without changing its buffer", () => {
        const policy = Runner.policyFor(FIRST_BASE, "related");
        assert.equal(policy.timeoutMs, 180000);
        assert.equal(policy.maxBuffer, 16000000);
    });
    check("Other related suites retain their original 120 seconds and 16 MB buffer", () => {
        for (const file of [ORDINARY, "tests/match-situation-lifecycle-test.js"]) {
            const policy = Runner.policyFor(file, "related");
            assert.equal(policy.timeoutMs, 120000);
            assert.equal(policy.maxBuffer, 16000000);
        }
    });
    check("Full repository retains its original 180 seconds and 30 MB buffer", () => {
        for (const file of [ORDINARY, FIRST_BASE]) {
            const policy = Runner.policyFor(file, "full");
            assert.equal(policy.timeoutMs, 180000);
            assert.equal(policy.maxBuffer, 30000000);
        }
    });
    check("Canonical spelling permits backslashes and leading dot without changing policy", () => {
        const canonical = Runner.policyFor(FIRST_BASE, "comparison");
        const alternate = Runner.policyFor(".\\tests\\first-base-receive-active-ground-production-integration-test.js", "comparison");
        assert.equal(alternate.timeoutMs, canonical.timeoutMs);
        assert.equal(alternate.maxBuffer, canonical.maxBuffer);
    });
    rejects("Comparison cannot be repurposed to execute another suite", () => Runner.policyFor(ORDINARY, "comparison"));
    rejects("Unknown execution entry cannot gain a fallback timeout", () => Runner.policyFor(FIRST_BASE, "unknown"));
    rejects("Absolute drive paths are refused", () => Runner.policyFor("E:\\tests\\first-base-receive-active-ground-production-integration-test.js", "related"));
    rejects("Absolute slash paths are refused", () => Runner.policyFor("/tests/first-base-receive-active-ground-production-integration-test.js", "related"));
    rejects("Parent traversal is refused even when its normalized destination is a suite", () => Runner.policyFor("docs/../" + FIRST_BASE, "related"));
    rejects("Backslash parent traversal is refused", () => Runner.policyFor("tests\\..\\" + FIRST_BASE.replaceAll("/", "\\"), "related"));
    rejects("Non-suite artifacts cannot be executed", () => Runner.policyFor("docs/receiver-execution-v2-sprint-10a3b-r1-recovery.md", "full"));
    rejects("Missing paths cannot be executed", () => Runner.policyFor("", "related"));
    rejects("Non-string paths cannot be executed", () => Runner.policyFor(null, "related"));
    check("Every protected path is rejected before any child execution", () => {
        for (const file of PROTECTED) assert.throws(() => Runner.policyFor(file, "full"), file);
    });
    check("First-base comparison command is the unchanged direct Node entry", () => {
        assert.deepEqual(Runner.commandFor(FIRST_BASE, "comparison"), [process.execPath, FIRST_BASE]);
    });
    check("Full command keeps its target as an absolute argument to the original wrapper", () => {
        const command = Runner.commandFor(ORDINARY, "full");
        assert.equal(command.length, 4);
        assert.equal(command[0], process.execPath);
        assert.equal(command[1], "-e");
        assert.equal(typeof command[2], "string");
        assert.ok(path.isAbsolute(command[3]));
        assert.equal(command[3], path.resolve(__dirname, "..", ORDINARY));
        const firstBase = Runner.commandFor(FIRST_BASE, "full");
        assert.equal(firstBase[2], command[2]);
        assert.equal(firstBase[3], path.resolve(__dirname, "..", FIRST_BASE));
    });
    check("Original full wrapper preserves explicit buffers and non-git-show calls", () => {
        const command = Runner.commandFor(ORDINARY, "full");
        const calls = [];
        const childProcess = {
            execFileSync: function (...args) {
                calls.push(args);
                return "mock result";
            }
        };
        const loaded = [];
        vm.runInNewContext(command[2], {
            process: { argv: [process.execPath, command[3]] },
            require: function (name) {
                if (name === "child_process") return childProcess;
                loaded.push(name);
                return {};
            }
        });
        assert.deepEqual(loaded, [command[3]]);
        const implicit = { encoding: "utf8" };
        childProcess.execFileSync("git", ["show", "revision:file"], implicit);
        assert.equal(calls[0][2].maxBuffer, 30000000);
        assert.equal(implicit.maxBuffer, undefined);
        const explicit = { encoding: "utf8", maxBuffer: 123456 };
        childProcess.execFileSync("git", ["show", "revision:file"], explicit);
        assert.strictEqual(calls[1][2], explicit);
        childProcess.execFileSync("git", ["status"], implicit);
        assert.strictEqual(calls[2][2], implicit);
        childProcess.execFileSync(process.execPath, [FIRST_BASE], implicit);
        assert.strictEqual(calls[3][2], implicit);
    });

    const expected = Array.from({ length: 227 }, (_, index) => "tests/r2-policy-fixture-" + String(index).padStart(3, "0") + "-test.js");
    check("An unchanged ordered 227-member manifest is accepted without input mutation", () => {
        const files = expected.slice();
        const before = JSON.stringify({ files, expected });
        Runner.validateManifest(files, expected);
        assert.equal(JSON.stringify({ files, expected }), before);
    });
    rejects("Manifest removal is rejected", () => Runner.validateManifest(expected.slice(0, 226), expected));
    rejects("Manifest addition is rejected", () => Runner.validateManifest([...expected, FIRST_BASE], expected));
    rejects("An equal count cannot conceal a different member", () => {
        const files = expected.slice();
        files[50] = FIRST_BASE;
        Runner.validateManifest(files, expected);
    });
    rejects("Original ordering cannot be changed", () => {
        const files = expected.slice();
        [files[10], files[11]] = [files[11], files[10]];
        Runner.validateManifest(files, expected);
    });
    rejects("Duplicate members cannot preserve the numeric manifest total", () => {
        const files = expected.slice();
        files[1] = files[0];
        Runner.validateManifest(files, expected);
    });
    rejects("A duplicate expected list cannot legitimize duplicate execution", () => {
        const duplicated = expected.slice();
        duplicated[1] = duplicated[0];
        Runner.validateManifest(duplicated.slice(), duplicated);
    });
    rejects("A protected member cannot be legitimized by matching expected membership", () => {
        const files = expected.slice();
        files[4] = PROTECTED[0];
        Runner.validateManifest(files.slice(), files);
    });
    rejects("Expected manifest must itself retain the original 227-member total", () => {
        const shorter = expected.slice(0, 226);
        Runner.validateManifest(shorter.slice(), shorter);
    });

    check("Matching successful first-base runs satisfy the runtime gate", () => {
        const pair = passingPair();
        const before = JSON.stringify(pair);
        const result = Runner.evaluateRuntimePair(pair.baseline, pair.current);
        assert.equal(result.passed, true);
        assert.ok(result.checks.length > 0);
        assert.ok(result.checks.every(row => row.pass === true));
        assert.equal(JSON.stringify(pair), before);
    });
    rejectedPair("Baseline failure cannot be ignored when WIP passes", baseline => { baseline.exitCode = 1; });
    rejectedPair("WIP failure cannot be ignored when baseline passes", (_, current) => { current.exitCode = 1; });
    rejectedPair("Matching functional failures cannot count as output-parity PASS", (baseline, current) => {
        baseline.exitCode = current.exitCode = 1;
        baseline.summary = current.summary = { passed: 41, failed: 1 };
    });
    rejectedPair("A printed total cannot turn a timeout into a valid result", (_, current) => {
        current.exitCode = null;
        current.error = { code: "ETIMEDOUT", message: "spawnSync timed out" };
    });
    rejectedPair("Two matching timeouts remain unresolved", (baseline, current) => {
        baseline.exitCode = current.exitCode = null;
        baseline.error = current.error = { code: "ETIMEDOUT" };
    });
    rejectedPair("An execution error disqualifies an apparent successful exit", (_, current) => { current.error = { code: "ENOBUFS" }; });
    rejectedPair("Partial stdout does not substitute for all 42 checks", (_, current) => { current.summary.passed = 41; });
    rejectedPair("A failed named check is not PASS despite the expected passed count", (_, current) => { current.summary.failed = 1; });
    rejectedPair("An unexpected extra total is rejected", (_, current) => { current.summary.passed = 43; });
    rejectedPair("Identical old 120-second conditions do not satisfy the approved 180-second gate", (baseline, current) => {
        baseline.timeoutMs = current.timeoutMs = 120000;
    });
    rejectedPair("Identical diagnostic 300-second conditions do not satisfy the 180-second gate", (baseline, current) => {
        baseline.timeoutMs = current.timeoutMs = 300000;
    });
    rejectedPair("Different limits break the same-condition comparison", (_, current) => { current.timeoutMs = 120000; });
    rejectedPair("Different output buffers break the same-condition comparison", (_, current) => { current.maxBuffer += 1; });
    rejectedPair("Different Node executable breaks the same-condition comparison", (_, current) => { current.nodeExecutable += ".different"; });
    rejectedPair("Different Node version breaks the same-condition comparison", (_, current) => { current.nodeVersion = "v0.0.0"; });
    rejectedPair("Different command or CLI options breaks the same-condition comparison", (_, current) => { current.command.push("--alter-fixture"); });
    rejectedPair("Different environment settings break the same-condition comparison", (_, current) => { current.environment.NODE_OPTIONS = "--jitless"; });
    rejectedPair("Changed original test bytes invalidate fixture parity", (_, current) => { current.sourceHashes.test = "c".repeat(64); });
    rejectedPair("Changed original helper bytes invalidate fixture parity", (_, current) => { current.sourceHashes.helper = "c".repeat(64); });
    rejectedPair("Missing source hashes cannot certify original fixture parity", (_, current) => { delete current.sourceHashes.helper; });
    rejectedPair("Changed result or sample stdout fails exact output parity", (_, current) => { current.stdout += "unexpected new sample\n"; });
    rejectedPair("Changed stderr fails exact output parity", (_, current) => { current.stderr = "unexpected warning\n"; });
    rejectedPair("A completed run beyond the approved timeout cannot be accepted", (_, current) => { current.elapsedMs = 180001; });
    rejectedPair("A baseline run beyond the approved timeout cannot validate the condition", baseline => { baseline.elapsedMs = 180001; });
    check("Performance threshold permits exactly 20 percent and rejects a larger increase", () => {
        const pair = passingPair();
        pair.baseline.elapsedMs = 120000;
        pair.current.elapsedMs = 144000;
        assert.equal(Runner.evaluateRuntimePair(pair.baseline, pair.current).passed, true);
        pair.current.elapsedMs += 1;
        assert.equal(Runner.evaluateRuntimePair(pair.baseline, pair.current).passed, false);
    });
    check("Performance threshold retains a 10-second allowance for short baseline durations", () => {
        const pair = passingPair();
        pair.baseline.elapsedMs = 30000;
        pair.current.elapsedMs = 40000;
        assert.equal(Runner.evaluateRuntimePair(pair.baseline, pair.current).passed, true);
        pair.current.elapsedMs += 1;
        assert.equal(Runner.evaluateRuntimePair(pair.baseline, pair.current).passed, false);
    });

    const passed = checks.filter(row => row.pass).length;
    return { summary: { total: checks.length, passed, failed: checks.length - passed }, checks };
}

module.exports = { run };

if (require.main === module) {
    const result = run();
    process.stdout.write("R2_RUNNER_TEST_SUMMARY " + JSON.stringify(result.summary) + "\n");
    for (const row of result.checks.filter(check => !check.pass)) {
        process.stderr.write("FAIL " + row.name + ": " + row.message + "\n");
    }
    if (result.summary.failed) process.exitCode = 1;
}
