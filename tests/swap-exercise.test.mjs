import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';

await build({
 stdin:{
  contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/workout-rules';",
  resolveDir:process.cwd(),
  loader:'ts'
 },
 outfile:'.sites-runtime/tests/swap-exercise-domain.mjs',
 bundle:true,
 platform:'node',
 format:'esm',
 logLevel:'silent'
});

const {
 initialState,
 act,
 clone,
 exerciseStatus
}=await import('../.sites-runtime/tests/swap-exercise-domain.mjs');

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

test('swap: allows swapping order of two exercises within today’s program', () => {
 const s=scheduledFixture();
 const originalExercises=clone(s.session.exercises);
 assert.ok(originalExercises.length>=3, 'Should have at least 3 exercises in today’s workout');

 const firstId=originalExercises[0].id;
 const secondId=originalExercises[1].id;
 const firstName=originalExercises[0].name;
 const secondName=originalExercises[1].name;

 // Perform swap between exercise 0 and exercise 1
 action(s,{type:'swap',id:firstId,targetId:secondId});

 // Positions should be swapped
 assert.equal(s.session.exercises[0].id, secondId);
 assert.equal(s.session.exercises[0].name, secondName);
 assert.equal(s.session.exercises[1].id, firstId);
 assert.equal(s.session.exercises[1].name, firstName);

 // Original planned target prescriptions stay attached to each exercise
 assert.equal(s.session.exercises[0].planned.name, secondName);
 assert.equal(s.session.exercises[1].planned.name, firstName);

 // Swapping between non-adjacent exercises (e.g. index 0 and index 2)
 const thirdId=s.session.exercises[2].id;
 const thirdName=s.session.exercises[2].name;
 action(s,{type:'swap',id:secondId,targetId:thirdId});

 assert.equal(s.session.exercises[0].id, thirdId);
 assert.equal(s.session.exercises[0].name, thirdName);
 assert.equal(s.session.exercises[2].id, secondId);
 assert.equal(s.session.exercises[2].name, secondName);
});

test('swap: swapping exercises with completed sets preserves set data and completion state', () => {
 const s=scheduledFixture();
 const e0=s.session.exercises[0];
 const e1=s.session.exercises[1];

 // Mark first set of e0 done
 e0.sets[0].weight=80;
 e0.sets[0].reps=10;
 e0.sets[0].done=true;

 action(s,{type:'swap',id:e0.id,targetId:e1.id});

 // e1 is now first, e0 is now second
 assert.equal(s.session.exercises[0].id, e1.id);
 assert.equal(s.session.exercises[1].id, e0.id);

 // e0 still has its completed set intact
 assert.equal(s.session.exercises[1].sets[0].done, true);
 assert.equal(s.session.exercises[1].sets[0].weight, 80);
 assert.equal(s.session.exercises[1].sets[0].reps, 10);
});

test('swap: allows swapping with a catalog exercise when no sets completed (replacing substitute)', () => {
 const s=scheduledFixture();
 const target=s.session.exercises[1];
 const originalName=target.name;

 action(s,{type:'swap',id:target.id,exerciseId:'fly'});

 assert.equal(s.session.exercises[1].name, 'Cable Fly');
 assert.equal(s.session.exercises[1].exerciseId, 'fly');
 // Planned structure stays attached
 assert.notEqual(s.session.exercises[1].name, originalName);
});

test('swap: backward compatibility with substitute action type', () => {
 const s=scheduledFixture();
 const target=s.session.exercises[2];

 action(s,{type:'substitute',id:target.id,exerciseId:'curl'});
 assert.equal(s.session.exercises[2].name, 'Biceps Curl');
});
