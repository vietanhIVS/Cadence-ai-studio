import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';

await build({
 stdin:{
  contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/workout-rules';export * from './hooks/use-rest-notifications';",
  resolveDir:process.cwd(),
  loader:'ts'
 },
 outfile:'.sites-runtime/tests/unscheduled-rest-domain.mjs',
 bundle:true,
 platform:'node',
 format:'esm',
 logLevel:'silent'
});

const {
 initialState,
 act,
 clone,
 updateRestForSets
}=await import('../.sites-runtime/tests/unscheduled-rest-domain.mjs');

const today='2026-10-06',timezone='Asia/Bangkok';
const action=(s,input)=>act(s,input,today,timezone);

function unscheduledFixture(){
 const s=initialState();
 action(s,{type:'startWorkout',date:today,unscheduled:true});
 return s;
}

test('unscheduled workout: completing intermediate set starts rest timer with default rest', () => {
 const s=unscheduledFixture();
 action(s,{type:'addExercise',exerciseId:'bench'});
 const exId=s.session.exercises[0].id;
 action(s,{type:'addSet',exerciseId:exId});
 action(s,{type:'addSet',exerciseId:exId});

 assert.equal(s.session.occurrence, null);
 assert.equal(s.session.exercises[0].sets.length, 3);

 // User completes Set 1 (weight 60, reps 10)
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=60;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;

 assert.equal(s.session.timerEnd, 100000+90000);
 assert.equal(s.session.timerSource.setId, next1[0].sets[0].id);
});

test('unscheduled workout: completing final set of an exercise triggers rest timer for transition before next exercise', () => {
 const s=unscheduledFixture();
 action(s,{type:'addExercise',exerciseId:'bench'});
 const exId=s.session.exercises[0].id;
 action(s,{type:'addSet',exerciseId:exId});

 // Mark Set 1 done
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=60;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;

 // Mark Set 2 done (final set of bench press, no other exercises added yet)
 const next2=clone(s.session.exercises);
 next2[0].sets[1].weight=60;
 next2[0].sets[1].reps=10;
 next2[0].sets[1].done=true;
 updateRestForSets(s.session,next2,90,120000);
 s.session.exercises=next2;

 // Rest timer triggers for transition to next exercise!
 assert.equal(s.session.timerEnd, 120000+90000);
 assert.equal(s.session.timerSource.setId, next2[0].sets[1].id);

 // Adding a subsequent exercise while resting retains the active rest countdown
 action(s,{type:'addExercise',exerciseId:'squat'});
 assert.equal(s.session.timerEnd, 120000+90000);
 assert.equal(s.session.exercises.length, 2);
});

test('unscheduled workout: completing set in subsequent exercise supersedes previous rest timer', () => {
 const s=unscheduledFixture();
 action(s,{type:'addExercise',exerciseId:'bench'});
 const benchId=s.session.exercises[0].id;
 action(s,{type:'addExercise',exerciseId:'squat'});
 const squatId=s.session.exercises[1].id;

 // Finish bench set
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=60;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;
 assert.equal(s.session.timerEnd, 100000+90000);

 // Start squat set at timestamp 150000
 const next2=clone(s.session.exercises);
 next2[1].sets[0].weight=100;
 next2[1].sets[0].reps=5;
 next2[1].sets[0].done=true;
 updateRestForSets(s.session,next2,90,150000);
 s.session.exercises=next2;

 assert.equal(s.session.timerEnd, 150000+90000);
 assert.equal(s.session.timerSource.setId, next2[1].sets[0].id);
});

test('unscheduled workout: finishWorkout clears timer and logs unscheduled workout', () => {
 const s=unscheduledFixture();
 action(s,{type:'addExercise',exerciseId:'bench'});
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=60;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;
 assert.ok(s.session.timerEnd);

 action(s,{type:'finishWorkout'});
 assert.equal(s.session, null);
 assert.equal(s.logs.length, 1);
 assert.equal(s.logs[0].status, 'UNSCHEDULED');
 assert.equal(s.logs[0].timerEnd, null);
});
