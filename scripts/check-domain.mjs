import {spawnSync} from 'node:child_process';
// Core rules are exercised by the maintained completion-driven program and workout suites.
const result=spawnSync(process.execPath,['--test','tests/program-schedule.test.mjs','tests/program-cycle-store.test.mjs','tests/workout-custom-exercises.test.mjs','tests/completed-set-edit.test.mjs','tests/finish-workout.test.mjs','tests/history-end-program.test.mjs'],{stdio:'inherit'});
if(result.error)throw result.error;process.exit(result.status??1);
