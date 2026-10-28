"use strict";
const C=require('./critical-regression-repair-b1-canonical-match-fixture-contract-capture.cjs');
const row=C.run('entry-boundary',C.prefix+'entry-boundary-proof.cjs',[C.prefix+'harness.cjs',C.prefix+'entry-run.cjs']);if(row.status!=='PASS')process.exitCode=1;
