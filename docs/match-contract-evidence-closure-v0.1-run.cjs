"use strict";
const C=require('./match-contract-evidence-closure-v0.1-capture.cjs');
const label=process.argv[2],allowed={'canonical-88222':C.prefix+'canonical.cjs','canonical-88222-replay':C.prefix+'canonical.cjs','routine-38':C.prefix+'routine.cjs'};
if(!Object.hasOwn(allowed,label))throw Error('Explicit planned diagnostic label required');
const row=C.run(label,allowed[label],[allowed[label],'docs/critical-regression-repair-b1-canonical-match-fixture-contract-harness.cjs','docs/critical-regression-repair-b1-canonical-match-fixture-contract-normal-entry-proof.cjs']);
if(row.status!=='PASS')process.exitCode=1;
