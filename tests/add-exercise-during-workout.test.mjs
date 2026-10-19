import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';

await build({
 stdin:{
  contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/workout-rules';",
  resolveDir:process.cwd(),
  loader:'ts'
 },
 outfile:'.sites-runtime/tests/add-exercise-during-workout-domain.mjs',
 bundle:true,
 platform:'node',
 format:'esm',
 logLevel:'silent'
});

const {
 initialState,
 act,
 clone,
 updateRestForSets,
 workoutProgress
}=await import('../.sites-runtime/tests/add-exercise-during-workout-domain.mjs');

const today='2026-10-06',timezone='Asia/Bangkok';
const action=(s,input)=>act(s,input,today,timezone);

function scheduledFixture(){
 const s=initialState();
 action(s,{type:'duplicateProgram',id:s.programs[0].id});
 const p=s.programs.at(-1);
 action(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id,date:today});
 action(s,{type:'startWorkout',date:today});
 return s;
}

function unscheduledFixture(){
 const s=initialState();
 action(s,{type:'startWorkout',date:today,unscheduled:true});
 return s;
}

test('scheduled workout: adding an exercise during workout appends extra exercise without disturbing active progression or rest', () => {
 const s=scheduledFixture();
 const initialCount=s.session.exercises.length;
 assert.ok(initialCount>0);

 // Complete first set of first exercise
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=70;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;

 const timerEndBefore=s.session.timerEnd;
 assert.ok(timerEndBefore>100000);

 // User adds an exercise during workout
 action(s,{type:'addExercise',exerciseId:'curl'});
 assert.equal(s.session.exercises.length, initialCount+1);

 const added=s.session.exercises.at(-1);
 assert.equal(added.name,'Biceps Curl');
 assert.equal(added.exerciseId,'curl');
 assert.equal(added.planned,null);
 assert.equal(added.sets.length,1);
 assert.equal(added.sets[0].done,false);
 assert.equal(added.sets[0].planned,false);

 // Adding an exercise retains the running rest timer from set 1
 assert.equal(s.session.timerEnd, timerEndBefore);

 // User can add an extra set to the added exercise
 action(s,{type:'addSet',exerciseId:added.id});
 assert.equal(s.session.exercises.at(-1).sets.length, 2);

 // Saving session with the new exercise succeeds
 action(s,{type:'saveSession',id:s.session.id,name:s.session.name,notes:s.session.notes,exercises:s.session.exercises});
});

test('unscheduled workout: adding multiple exercises during workout preserves all work and progression', () => {
 const s=unscheduledFixture();
 assert.equal(s.session.exercises.length, 0);

 // Add first exercise
 action(s,{type:'addExercise',exerciseId:'bench'});
 assert.equal(s.session.exercises.length, 1);

 // Complete Set 1 of bench press
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=60;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;

 // Add second exercise during workout while rest timer is active
 action(s,{type:'addExercise',exerciseId:'squat'});
 assert.equal(s.session.exercises.length, 2);
 assert.equal(s.session.timerEnd, 100000+90000);

 // Complete set of second exercise -> transitions rest timer to the second exercise
 const next2=clone(s.session.exercises);
 next2[1].sets[0].weight=100;
 next2[1].sets[0].reps=5;
 next2[1].sets[0].done=true;
 updateRestForSets(s.session,next2,90,150000);
 s.session.exercises=next2;

 assert.equal(s.session.timerEnd, 150000+90000);
 assert.equal(s.session.timerSource.setId, next2[1].sets[0].id);

 // Finish workout records both exercises
 action(s,{type:'finishWorkout'});
 assert.equal(s.session, null);
 assert.equal(s.logs.length, 1);
 assert.equal(s.logs[0].exercises.length, 2);
 assert.equal(s.logs[0].status, 'UNSCHEDULED');
});

test('removing an extra exercise added during workout cleans up session and associated timer', () => {
 const s=scheduledFixture();
 action(s,{type:'addExercise',exerciseId:'curl'});
 const addedId=s.session.exercises.at(-1).id;

 // Mark set on added exercise done and trigger timer
 const next=clone(s.session.exercises);
 next.at(-1).sets[0].weight=15;
 next.at(-1).sets[0].reps=12;
 next.at(-1).sets[0].done=true;
 updateRestForSets(s.session,next,90,200000);
 s.session.exercises=next;
 assert.equal(s.session.timerSource.exerciseId, addedId);

 // Remove the extra exercise
 action(s,{type:'removeExtra',id:addedId});
 assert.ok(!s.session.exercises.some(e=>e.id===addedId));
 assert.equal(s.session.timerEnd, null);
 assert.equal(s.session.timerSource, null);

 // Planned exercises cannot be removed via removeExtra
 assert.throws(()=>action(s,{type:'removeExtra',id:s.session.exercises[0].id}),/Planned exercises can be skipped/);
});
