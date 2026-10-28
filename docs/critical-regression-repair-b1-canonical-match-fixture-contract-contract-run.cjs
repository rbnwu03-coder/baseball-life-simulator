"use strict";
const C=require('./critical-regression-repair-b1-canonical-match-fixture-contract-capture.cjs');
const row=C.run('contract-proof',C.prefix+'contract-proof.cjs',[C.prefix+'harness.cjs',C.prefix+'contract-run.cjs']);if(row.status!=='PASS')process.exitCode=1;
