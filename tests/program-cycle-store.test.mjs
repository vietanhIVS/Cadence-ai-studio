import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';
await build({stdin:{contents:"export * from './db/store';export * from './lib/cadence';export * from './lib/actions';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/cycle-store.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent',plugins:[{name:'mock-db-binding',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'mock-db',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const env={get DB(){return globalThis.__cycleDB}}',loader:'js'}))}}]});
const {initialState,act,clone,readState,nextProgramWorkout}=await import('../.sites-runtime/tests/cycle-store.mjs');const today='2026-10-07',zone='Asia/Bangkok';
function fixture(){const s=initialState();act(s,{type:'duplicateProgram',id:s.programs[0].id},today,zone);const p=s.programs.at(-1);act(s,{type:'createSchedule',programId:p.id,versionId:p.versions[0].id},today,zone);act(s,{type:'startWorkout',date:today},today,zone);act(s,{type:'finishWorkout',confirmIncomplete:true},today,zone);delete s.schedules[0].cycleState;return s}
function database(state,race=false){
 let row={revision:4,data:JSON.stringify(state)},updates=0;
 globalThis.__cycleDB={prepare:query=>({bind:(...values)=>({
  first:async()=>clone(row),
  run:async()=>{
   if(!query.startsWith('UPDATE'))throw Error(query);
   updates++;
   if(race){race=false;const concurrent=JSON.parse(row.data);concurrent.settings.unit='lb';row={revision:row.revision+1,data:JSON.stringify(concurrent)}}
   if(values[3]!==row.revision)return {meta:{changes:0}};
   row={revision:row.revision+1,data:values[0]};return {meta:{changes:1}};
  }
 })})};
 return {row:()=>clone(row),updates:()=>updates};
}
test('legacy cursor migration persists once by revision check and keeps History/session data',async()=>{const state=fixture(),history=clone(state.logs),db=database(state);const first=await readState('test-user');assert.equal(first.revision,5);assert.equal(nextProgramWorkout(first.state,today).day.name,'Pull');assert.deepEqual(first.state.logs,history);assert.equal(db.updates(),1);const again=await readState('test-user');assert.deepEqual(again,first);assert.equal(db.updates(),1);assert.ok(JSON.parse(db.row().data).schedules[0].cycleState)});
test('concurrent migration re-reads the newer revision and preserves another tab’s changes',async()=>{const state=fixture(),history=clone(state.logs),db=database(state,true);const result=await readState('test-user');assert.equal(result.revision,6);assert.equal(result.state.settings.unit,'lb');assert.deepEqual(result.state.logs,history);assert.equal(nextProgramWorkout(result.state,today).day.name,'Pull');assert.equal(db.updates(),2)});
