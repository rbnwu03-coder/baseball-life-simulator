"use strict";
const C=require('./critical-regression-repair-b1-canonical-match-fixture-contract-capture.cjs');
const r=C.run('normal-entry-replay',C.prefix+'normal-entry-proof.cjs',[C.prefix+'harness.cjs',C.prefix+'normal-entry-replay-run.cjs']);if(r.status!=='PASS')process.exitCode=1;
