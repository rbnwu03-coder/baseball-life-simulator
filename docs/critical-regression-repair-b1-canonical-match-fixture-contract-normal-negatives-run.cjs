"use strict";
const C=require('./critical-regression-repair-b1-canonical-match-fixture-contract-capture.cjs');
const r=C.run('normal-negatives',C.prefix+'normal-negatives.cjs',[C.prefix+'harness.cjs',C.prefix+'normal-entry-proof.cjs',C.prefix+'contract-proof.cjs',C.prefix+'normal-negatives-run.cjs']);if(r.status!=='PASS')process.exitCode=1;
