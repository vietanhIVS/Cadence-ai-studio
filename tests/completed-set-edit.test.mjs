import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.sites-runtime/tests',{recursive:true});
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/workout-rules';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/completed-edit-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,workoutProgress,actualSetErrors,hasInvalidActualSets,nextPendingSet,completionAdvances}=await import('../.sites-runtime/tests/completed-edit-domain.mjs');
const today='2026-10-06',timezone='Asia/Bangkok';
const action=(s,input)=>act(s,input,today,timezone);
function fixture(){const s=initialState();action(s,{type:'duplicateProgram',id:s.programs[0].id});const p=s.programs.at(-1);action(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id,date:today});action(s,{type:'startWorkout',date:today});return s}
function save(s,change){const exercises=clone(s.session.exercises);change(exercises);action(s,{type:'saveSession',id:s.session.id,name:s.session.name,notes:s.session.notes,exercises})}
function complete(s,index){save(s,ex=>Object.assign(ex[0].sets[index],{weight:70,reps:10,done:true}))}
test('completed corrections preserve completion, progress, plan, other sets, timer and existing timestamps through reload',()=>{
 let s=fixture();complete(s,0);complete(s,1);s.session.exercises[0].sets[0].completedAt='2026-10-06T12:05:00Z';const before=clone(s),progress=workoutProgress(s.session.exercises);
 save(s,ex=>Object.assign(ex[0].sets[0],{weight:72.5,reps:9}));s=JSON.parse(JSON.stringify(s));const set=s.session.exercises[0].sets[0];assert.equal(set.done,true);assert.equal(set.weight,72.5);assert.equal(set.reps,9);assert.equal(set.completedAt,before.session.exercises[0].sets[0].completedAt);assert.equal(s.session.startedAt,before.session.startedAt);assert.deepEqual(workoutProgress(s.session.exercises),progress);assert.deepEqual(s.programs,before.programs);assert.deepEqual(s.session.exercises[0].sets.slice(1),before.session.exercises[0].sets.slice(1));assert.equal(s.session.timerEnd,before.session.timerEnd);assert.deepEqual(s.session.timerSource,before.session.timerSource);
});
test('older uncheck/recheck changes progress but keeps later rest and progression',()=>{
 const s=fixture();complete(s,0);complete(s,1);const end=s.session.timerEnd,source=clone(s.session.timerSource);save(s,ex=>{ex[0].sets[0].done=false});assert.equal(workoutProgress(s.session.exercises).done,1);assert.deepEqual([s.session.exercises[0].sets[0].weight,s.session.exercises[0].sets[0].reps],[70,10]);complete(s,0);assert.equal(workoutProgress(s.session.exercises).done,2);assert.equal(s.session.timerEnd,end);assert.deepEqual(s.session.timerSource,source);assert.equal(completionAdvances(s.session.exercises[0],0),false);assert.equal(nextPendingSet(s.session.exercises[0]).id,s.session.exercises[0].sets[2].id);
 save(s,ex=>{ex[0].sets[0].done=false});action(s,{type:'timer',seconds:null});complete(s,0);assert.equal(s.session.timerEnd,null);
});
test('own-source uncheck stops rest; sequential recheck starts it; final completion stops it',()=>{
 const s=fixture();complete(s,0);save(s,ex=>{ex[0].sets[0].done=false});assert.equal(s.session.timerEnd,null);assert.equal(s.session.timerSource,null);assert.equal(workoutProgress(s.session.exercises).done,0);complete(s,0);assert.ok(s.session.timerEnd);assert.equal(s.session.timerSource.setId,s.session.exercises[0].sets[0].id);complete(s,1);complete(s,2);assert.equal(s.session.timerEnd,null);
});
test('higher completed extra sets prevent older rechecks from starting rest',()=>{
 const s=fixture();action(s,{type:'addSet',exerciseId:s.session.exercises[0].id});complete(s,3);const end=s.session.timerEnd,source=clone(s.session.timerSource);complete(s,0);assert.equal(s.session.timerEnd,end);assert.deepEqual(s.session.timerSource,source);assert.equal(workoutProgress(s.session.exercises).done,1);
});
test('invalid completed edits never commit or uncomplete; correction or explicit uncheck resolves blank input',()=>{
 const s=fixture();complete(s,0);const before=clone(s);
 for(const values of [{reps:null},{weight:null},{reps:1.5},{reps:0},{reps:1000},{weight:-1},{weight:2001}]){const set={...s.session.exercises[0].sets[0],...values};assert.ok(Object.keys(actualSetErrors(set)).length);assert.throws(()=>save(s,ex=>Object.assign(ex[0].sets[0],values)));assert.deepEqual(s,before)}
 const invalid=clone(s.session.exercises);invalid[0].sets[0].reps=null;assert.equal(hasInvalidActualSets(invalid),true);assert.equal(actualSetErrors(invalid[0].sets[0]).reps,'Reps are required for a completed set.');assert.equal(invalid[0].sets[0].done,true);
 save(s,ex=>{ex[0].sets[0].reps=12});assert.equal(s.session.exercises[0].sets[0].done,true);save(s,ex=>Object.assign(ex[0].sets[0],{reps:null,done:false}));assert.equal(s.session.exercises[0].sets[0].weight,70);assert.equal(hasInvalidActualSets(s.session.exercises),false);assert.equal(s.session.timerEnd,null);
});
