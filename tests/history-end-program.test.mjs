import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.sites-runtime/tests',{recursive:true});
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/history';export * from './lib/schedule-review';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/history-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,historyMetrics,historyContext,historyTitle,historyTime,historyMinutes,nextScheduledWorkout,workoutPosition}=await import('../.sites-runtime/tests/history-domain.mjs');
const today='2026-10-06',timezone='Asia/Bangkok',action=(s,a)=>act(s,a,today,timezone);
function fixture(){const s=initialState();action(s,{type:'duplicateProgram',id:s.programs[0].id});const p=s.programs.at(-1);action(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id,date:today});action(s,{type:'startWorkout',date:today});return s}
function complete(s){const exercises=clone(s.session.exercises);Object.assign(exercises[0].sets[0],{weight:70,reps:10,done:true});action(s,{type:'saveSession',id:s.session.id,name:s.session.name,notes:'Kept note',exercises})}
test('confirmed program stop ends active workout and timer atomically while preserving results, plans and existing history',()=>{
 const s=fixture();complete(s);const plans=clone(s.programs),session=clone(s.session),prior=clone({...s.session,id:'prior',finishedAt:'2026-10-05T12:00:00Z',status:'PARTIALLY_COMPLETED'});s.logs.push(prior);action(s,{type:'endSchedule',date:today,confirmed:true,stopActiveWorkout:true});assert.equal(s.session,null);assert.equal(s.schedules[0].status,'ENDED');assert.equal(s.schedules[0].end,today);assert.deepEqual(s.programs,plans);assert.deepEqual(s.logs[0],prior);assert.deepEqual(s.logs[1].exercises,session.exercises);assert.equal(s.logs[1].notes,'Kept note');assert.equal(s.logs[1].startedAt,session.startedAt);assert.equal(s.logs[1].status,'PARTIALLY_COMPLETED');assert.equal(s.logs[1].timerEnd,null);assert.equal(s.logs[1].timerSource,null);
});
test('stop requires confirmation and explicit active-workout intent; invalid end date cannot finish the workout',()=>{
 const s=fixture();complete(s);const before=clone(s);for(const input of [{date:today,stopActiveWorkout:true},{date:today,confirmed:true},{date:'2026-10-05',confirmed:true,stopActiveWorkout:true}]){assert.throws(()=>action(s,{type:'endSchedule',...input}));assert.deepEqual(s,before)}
});
test('stop preserves fully completed status and handles an empty unscheduled active workout without discarding it',()=>{
 const s=fixture(),exercises=clone(s.session.exercises);for(const e of exercises)for(const set of e.sets)Object.assign(set,{weight:60,reps:10,done:true});action(s,{type:'saveSession',id:s.session.id,name:s.session.name,notes:'',exercises});action(s,{type:'endSchedule',date:today,confirmed:true,stopActiveWorkout:true});assert.equal(s.logs[0].status,'COMPLETED');
 const empty=fixture();action(empty,{type:'discardWorkout',confirmed:true});action(empty,{type:'startWorkout',date:today,unscheduled:true});action(empty,{type:'endSchedule',date:today,confirmed:true,stopActiveWorkout:true});assert.equal(empty.session,null);assert.equal(empty.logs[0].status,'UNSCHEDULED');assert.deepEqual(empty.logs[0].exercises,[]);
});
test('history counts planned work separately from extras and compares results to immutable targets',()=>{
 const s=fixture();s.session.exercises[0].planned.sets.forEach(set=>set.targetWeight=65);complete(s);action(s,{type:'addSet',exerciseId:s.session.exercises[0].id});const ex=clone(s.session.exercises);Object.assign(ex[0].sets.at(-1),{weight:75,reps:8,done:true});action(s,{type:'saveSession',id:s.session.id,name:s.session.name,notes:'',exercises:ex});action(s,{type:'finishWorkout',confirmIncomplete:true});const log=s.logs[0],metrics=historyMetrics(log);assert.deepEqual([metrics.done,metrics.total,metrics.extra,metrics.percent],[1,15,1,7]);assert.deepEqual([metrics.repHits,metrics.repTargets,metrics.weightHits,metrics.weightTargets],[1,15,1,3]);assert.equal(metrics.status,'Partial');assert.equal(historyTitle(log),'Day 1 · Push');assert.equal(historyContext(s,log),'Push / Pull / Legs · Workout 1 · Cycle 1');assert.equal(log.exercises[0].planned.sets[0].targetWeight,65);
});
test('legacy missing targets, skips, unscheduled and empty logs give honest completion values',()=>{
 const s=fixture();for(const e of s.session.exercises){e.planned={id:e.planned.id,exerciseId:e.planned.exerciseId,name:e.planned.name,sets:3,repMin:0,repMax:0,weight:0,rest:90};action(s,{type:'skipExercise',id:e.id,skipped:true})}action(s,{type:'finishWorkout',confirmIncomplete:true});const metrics=historyMetrics(s.logs[0]);assert.equal(metrics.status,'Skipped');assert.equal(metrics.percent,0);assert.equal(metrics.repTargets,0);assert.equal(metrics.weightTargets,0);
 const log={...clone(s.logs[0]),status:'UNSCHEDULED',occurrence:null,exercises:[],startedAt:'2026-10-06T12:01:00Z',finishedAt:'2026-10-06T12:03:00Z'};assert.equal(historyContext(s,log),'Unscheduled workout');assert.equal(historyMetrics(log).percent,0);assert.equal(historyMetrics(log).total,0);assert.equal(historyTime(log),'19:01');assert.equal(historyMinutes(log),2);
});
test('post-workout summary shows the next workout without assigning a future date',()=>{
 const s=fixture();complete(s);action(s,{type:'finishWorkout',confirmIncomplete:true});const before=clone(s),next=nextScheduledWorkout(s,today);assert.equal(next.date,today);assert.equal(next.day.name,'Pull');assert.deepEqual(workoutPosition(s,next),{number:2,total:3});assert.equal(nextScheduledWorkout(s,'2026-10-07').day.name,'Pull');assert.deepEqual(s,before);
});
