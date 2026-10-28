"use strict";
// Only the explicitly declared run export is invoked; no automatic function guessing.
const observer=require("./entry-safe-preload.cjs"),config=JSON.parse(process.env.ENTRY_SAFE_CONFIG);
async function main(){const suite=require(config.target);if(typeof suite.run!=="function")throw Error("Declared exported run() is missing");
 observer.beginExport();const result=await suite.run();observer.finishExport(result);
 if(result?.summary?.failed>0||result?.failed>0)process.exitCode=1;
}
main().catch(error=>{observer.recordError(error);console.error(error.stack||error);process.exitCode=1;});
