import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';

await build({
 stdin:{
  contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/workout-rules';export * from './hooks/use-rest-notifications';",
  resolveDir:process.cwd(),
  loader:'ts'
 },
 outfile:'.sites-runtime/tests/rest-notification-domain.mjs',
 bundle:true,
 platform:'node',
 format:'esm',
 logLevel:'silent'
});

const {
 initialState,
 act,
 clone,
 REST_NOTIFICATION_TAG,
 updateRestForSets
}=await import('../.sites-runtime/tests/rest-notification-domain.mjs');

const today='2026-10-06',timezone='Asia/Bangkok';
const action=(s,input)=>act(s,input,today,timezone);

function fixture(){
 const s=initialState();
 action(s,{type:'duplicateProgram',id:s.programs[0].id});
 const p=s.programs.at(-1);
 action(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id,date:today});
 action(s,{type:'startWorkout',date:today});
 return s;
}

test('rest notification tag is unified so subsequent sets cannot accumulate multiple notifications',()=>{
 assert.equal(REST_NOTIFICATION_TAG,'cadence-rest');
});

test('ticking done on next set while previous rest timer is counting down supersedes the timer and preserves single rest lifecycle',()=>{
 const s=fixture();
 const ex=s.session.exercises[0];
 assert.ok(ex.sets.length>=3,'Fixture has at least 3 sets');

 // Step 1: User ticks done on Set 1 -> Rest countdown starts
 const next1=clone(s.session.exercises);
 next1[0].sets[0].weight=50;
 next1[0].sets[0].reps=10;
 next1[0].sets[0].done=true;
 updateRestForSets(s.session,next1,90,100000);
 s.session.exercises=next1;

 const firstTimerEnd=s.session.timerEnd;
 const firstTimerId=s.session.timerId;
 assert.equal(firstTimerEnd,100000+90000);
 assert.equal(s.session.timerSource.setId,ex.sets[0].id);

 // Step 2: While timer 1 is still counting down (e.g. at timestamp 120000, 70s remaining),
 // user fills in Set 2 and ticks done
 const next2=clone(s.session.exercises);
 next2[0].sets[1].weight=50;
 next2[0].sets[1].reps=10;
 next2[0].sets[1].done=true;
 updateRestForSets(s.session,next2,90,120000);
 s.session.exercises=next2;

 // The rest timer is superseded by Set 2's rest timer:
 assert.equal(s.session.timerEnd,120000+90000);
 assert.equal(s.session.timerSource.setId,ex.sets[1].id);
 assert.notEqual(s.session.timerId,firstTimerId);

 // Step 3: When final set of an exercise is completed and subsequent exercises remain in the workout,
 // rest timer triggers for the transition to the next exercise
 const next3=clone(s.session.exercises);
 next3[0].sets[2].weight=50;
 next3[0].sets[2].reps=10;
 next3[0].sets[2].done=true;
 updateRestForSets(s.session,next3,90,140000);
 s.session.exercises=next3;

 assert.equal(s.session.timerEnd,140000+90000);
 assert.equal(s.session.timerSource.setId,ex.sets[2].id);

 // Step 4: When the very last set of the entire workout is completed, timer clears
 const nextFinal=clone(s.session.exercises);
 for(const e of nextFinal){
  for(const st of e.sets){
   st.done=true;
   st.weight=50;
   st.reps=10;
  }
 }
 updateRestForSets(s.session,nextFinal,90,200000);
 s.session.exercises=nextFinal;

 assert.equal(s.session.timerEnd,null);
 assert.equal(s.session.timerSource,null);
 assert.equal(s.session.timerId,null);
});
