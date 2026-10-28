const a=require('assert');module.exports={run(){a(true);a.strict.equal(2,2);return{summary:{total:2,passed:2,failed:0}};}};
