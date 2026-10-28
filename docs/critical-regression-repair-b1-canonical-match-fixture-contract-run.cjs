"use strict";
const C=require('./critical-regression-repair-b1-canonical-match-fixture-contract-capture.cjs');
if(process.argv[2]!=='natural')throw Error('Explicit natural proof mode required');
const row=C.run('natural-proof',C.prefix+'natural-proof.cjs',[C.prefix+'harness.cjs',C.prefix+'run.cjs']);
if(row.status!=='PASS')process.exitCode=1;
