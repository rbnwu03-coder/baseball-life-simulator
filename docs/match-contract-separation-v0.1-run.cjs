"use strict";
const C=require('./match-contract-separation-v0.1-capture.cjs');
const row=C.run('proof',C.prefix+'proof.cjs',[C.prefix+'proof.cjs','docs/critical-regression-repair-b1-canonical-match-fixture-contract-harness.cjs','docs/critical-regression-repair-b1-canonical-match-fixture-contract-normal-entry-proof.cjs']);
if(row.status!=='PASS')process.exitCode=1;
