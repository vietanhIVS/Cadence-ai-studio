import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/delete-workout-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,withPresets,nextProgramWorkout}=await import('../.sites-runtime/tests/delete-workout-domain.mjs');
const today='2026-10-07',zone='Asia/Bangkok';
function fixture(){
 const s=initialState();act(s,{type:'duplicateProgram',id:s.programs[0].id},today,zone);const p=s.programs.at(-1);
 act(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id},today,zone);
 for(const status of ['completed','partial','skipped','unscheduled']){
  act(s,{type:'startWorkout',date:today,unscheduled:status==='unscheduled'},today,zone);
  if(status==='unscheduled'){s.session.exercises=[clone(s.logs[0].exercises[0])];s.session.exercises[0].planned=null;for(const set of s.session.exercises[0].sets)set.planned=false}
  if(status==='completed')for(const e of s.session.exercises)for(const set of e.sets)Object.assign(set,{done:true,weight:20,reps:10});
  if(status==='partial')Object.assign(s.session.exercises[0].sets[0],{done:true,weight:20,reps:8});
  if(status==='skipped')for(const e of s.session.exercises)for(const set of e.sets)set.skipped=true;
  act(s,{type:'finishWorkout',confirmIncomplete:true},today,zone);
 }
 return s;
}
for(const index of [0,1,2,3])test(`delete historical workout ${index} without changing active session, cursor, queued version or templates`,()=>{
 const s=fixture();act(s,{type:'applyVersion',programId:s.programs[1].id,versionId:s.programs[1].versions[0].id,mode:'AFTER_CYCLE'},today,zone);
 act(s,{type:'startWorkout',date:today},today,zone);s.session.notes='Keep this session';s.session.exercises[0].sets[0].reps=9;
 const id=s.logs[index].id,before=clone(s),next=nextProgramWorkout(s,today);
 act(s,{type:'deleteLog',id,confirmed:true},today,zone);
 assert.deepEqual(s,{...before,logs:before.logs.filter(l=>l.id!==id)});
 const reloaded=withPresets(clone(s));assert.deepEqual(reloaded,s);assert.deepEqual(nextProgramWorkout(reloaded,today),next);
 assert.throws(()=>act(s,{type:'deleteLog',id,confirmed:true},today,zone),/not found/);
});
test('deletion requires confirmation and a valid log ID',()=>{
 const s=fixture(),before=clone(s);
 for(const action of [{type:'deleteLog',id:s.logs[0].id},{type:'deleteLog',id:'missing',confirmed:true},{type:'deleteLog',confirmed:true}])assert.throws(()=>act(s,action,today,zone));
 assert.deepEqual(s,before);
});
test('deleting the last source log freezes a legacy cursor before removing history',()=>{
 const s=initialState();act(s,{type:'duplicateProgram',id:s.programs[0].id},today,zone);const p=s.programs.at(-1);
 act(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id},today,zone);act(s,{type:'startWorkout',date:today},today,zone);act(s,{type:'finishWorkout',confirmIncomplete:true},today,zone);
 delete s.schedules[0].cycleState;
 act(s,{type:'deleteLog',id:s.logs[0].id,confirmed:true},today,zone);
 assert.equal(s.logs.length,0);assert.equal(nextProgramWorkout(withPresets(clone(s)),today).day.name,'Pull');assert.equal(s.schedules[0].cycleState.index,1);
});
