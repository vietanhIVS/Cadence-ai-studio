import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.sites-runtime/tests',{recursive:true});
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/prescription';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/prescription-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,prescriptionSummary,prescriptionError,plannedWeight,plannedSets,plannedSetCount,displayWeight,storedWeight}=await import('../.sites-runtime/tests/prescription-domain.mjs');
const today='2026-10-06',timezone='Asia/Bangkok';
const exercise=()=>({id:'one',exerciseId:'bench',name:'Bench Press',sets:4,repMin:8,repMax:10,weight:70,weightUnit:'kg',rest:120,notes:'Pause 1 sec at chest'});
const days=(e)=>[{type:'WORKOUT',name:'Push',exercises:[e]},{type:'REST',name:'Rest',exercises:[]},{type:'REST',name:'Rest',exercises:[]}];
function save(s,e){return act(s,{type:'saveProgram',name:'Prescription program',days:days(e)},today,timezone)}
test('optional weight, notes, fixed reps and units survive the storage JSON round trip',()=>{
 const s=initialState(),e={...exercise(),weight:undefined,repMin:10,repMax:10};save(s,e);const loaded=JSON.parse(JSON.stringify(s));const p=loaded.programs.at(-1).versions[0].days[0].exercises[0];
 assert.ok(plannedSets(p).every(set=>set.targetWeight===undefined));assert.equal(p.notes,e.notes);assert.match(prescriptionSummary(p),/10 reps/);assert.doesNotMatch(prescriptionSummary(p),/10–10|0 kg/);
 const pounds={...exercise(),weight:storedWeight(154.5,'lb'),weightUnit:'lb'};save(s,pounds);const roundTrip=JSON.parse(JSON.stringify(s)).programs.at(-1).versions[0].days[0].exercises[0];assert.equal(displayWeight(plannedSets(roundTrip)[0].targetWeight,'lb'),154.5);assert.match(prescriptionSummary(roundTrip),/154.5 lb/);
});
test('legacy targets remain loadable; blank legacy zero differs from new explicit zero',()=>{
 const legacy={...exercise()};delete legacy.weightUnit;delete legacy.notes;save(initialState(),legacy);assert.match(prescriptionSummary(legacy),/70 kg/);
 assert.equal(plannedWeight({...legacy,weight:0}),undefined);assert.doesNotMatch(prescriptionSummary({...legacy,weight:0}),/0 kg/);assert.match(prescriptionSummary({...legacy,weight:0,weightUnit:'kg'}),/0 kg/);
});
test('server rejects invalid sets, reps, weight, unit, rest and notes',()=>{
 for(const patch of [{sets:0},{sets:-1},{sets:1.5},{repMin:0},{repMin:1.2},{repMax:7},{repMax:10.5},{weight:-1},{weight:Infinity},{weightUnit:'stone'},{rest:-1},{rest:1.5},{notes:3},{notes:'a'.repeat(4001)}])assert.throws(()=>save(initialState(),{...exercise(),...patch}),/./,JSON.stringify(patch));
 assert.equal(prescriptionError({...exercise(),rest:0,weight:0}),'');
});
test('prescriptions keep their identity and order; version edits preserve prior values',()=>{
 const s=initialState();const second={...exercise(),id:'two',exerciseId:'pullup',name:'Pull-up',sets:3,weight:undefined,notes:'Controlled descent'};
 const firstDays=days(exercise());firstDays[0].exercises.push(second);act(s,{type:'saveProgram',name:'Order',days:firstDays},today,timezone);const p=s.programs.at(-1),before=clone(p.versions[0]);
 const next=clone(p.versions[0].days);next[0].exercises.reverse();act(s,{type:'saveProgram',id:p.id,name:p.name,days:next},today,timezone);
 assert.deepEqual(p.versions[0],before);assert.deepEqual(p.versions[1].days[0].exercises.map(e=>[e.id,plannedSetCount(e),e.notes]),[['two',3,'Controlled descent'],['one',4,'Pause 1 sec at chest']]);
});
test('actual results and historical corrections cannot overwrite a planned prescription',()=>{
 const s=initialState();save(s,exercise());const p=s.programs.at(-1);act(s,{type:'createSchedule',programId:p.id,date:today},today,timezone);act(s,{type:'startWorkout',date:today},today,timezone);const original=clone(p.versions[0].days[0].exercises[0]);
 const actual=clone(s.session.exercises);actual[0].sets[0]={...actual[0].sets[0],weight:67.5,reps:9,done:true};act(s,{type:'saveSession',id:s.session.id,name:s.session.name,notes:'Actual session note',exercises:actual},today,timezone);
 assert.deepEqual(p.versions[0].days[0].exercises[0],original);assert.deepEqual(s.session.exercises[0].planned,original);
 const tampered=clone(actual);tampered[0].planned.weight=99;assert.throws(()=>act(s,{type:'saveSession',id:s.session.id,name:s.session.name,exercises:tampered},today,timezone),/plans must stay unchanged/);
 act(s,{type:'finishWorkout',confirmIncomplete:true},today,timezone);const log=s.logs[0],corrected=clone(log.exercises);corrected[0].sets[0].weight=65;act(s,{type:'correctLog',id:log.id,confirmed:true,exercises:corrected,notes:'Corrected actual note'},today,timezone);assert.deepEqual(log.exercises[0].planned,original);assert.deepEqual(p.versions[0].days[0].exercises[0],original);
});
