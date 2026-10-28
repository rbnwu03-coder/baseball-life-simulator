# Current Test Baseline Verification v0.1 — 有界執行計畫

此計畫在本輪任何suite child執行前exclusive-create。只重跑兩個靜態依賴涉及Repair A Opportunity-two修訂的既有guard；不重新跑已具備相同source可信證據的五套Phase B、Repair A、Sprint1、Match或Gradient。

| Suite | 原具名checks | 必要性 |
|---|---:|---|
| tests/receiver-execution-v2-sprint-10a3b-r4-dependency-test.cjs | 44 | static closure含已修改Opportunity-two，保守補驗目前相容性 |
| tests/receiver-execution-v2-sprint-10a3b-r6-exact-checker-test.cjs | 23 | static closure含已修改Opportunity-two，保守補驗目前相容性 |

預估2個standalone children、67個checks，歷史時間為數秒；每套原120000ms／16000000-byte限制，總hard cap240秒。候選執行不啟用Receiver v2，R4回傳runtimeEnabled=false／candidateExecutionCalls=0。

其他無可信證據的項目維持UNVERIFIED。不得擴張為Full251／R6Full227／First-base／Browser全套，不增加seed／樣本、不改能力。完整inputs、理由及引用來源見[plan evidence](current-test-baseline-verification-v0.1-execution-plan-evidence.json)。
