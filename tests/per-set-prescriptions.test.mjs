import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('.sites-runtime/tests',{recursive:true});
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/prescription';export * from './lib/workout-rules';export * from './lib/history';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/per-set-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,plannedSets,normalizePlan,actualFromPlan,setPrescription,prescriptionSummary,prescriptionError,updateRestForSets,historyMetrics,withPresets,storedWeight,displayWeight,workoutProgress}=await import('../.sites-runtime/tests/per-set-domain.mjs');
const today='2026-10-06',zone='Asia/Bangkok',action=(s,a)=>act(s,a,today,zone);
const legacy=()=>({id:'bench-plan',exerciseId:'bench',name:'Bench Press',sets:3,repMin:10,repMax:12,rest:90,weight:0});
const rich=()=>({id:'incline-plan',exerciseId:'incline',name:'Incline Dumbbell Press',order:1,groupId:'A',groupType:'SUPERSET',groupOrder:1,notes:'Bench angle 20–30°',sets:[15,12,10,8].map((reps,i)=>({id:`incline-${i}`,setNumber:i+1,repMin:reps,repMax:i===3?10:reps,restSeconds:i<2?60:90,...(i<3?{targetWeight:60+i*5,weightUnit:'kg'}:{}),...(i===2?{targetRpe:8.5,notes:'Dropset after this set'}:{})}))});
const days=e=>[{type:'WORKOUT',name:'Push',notes:'Warm up for 5–10 minutes.',exercises:[e]},{type:'REST',name:'Rest',exercises:[]},{type:'REST',name:'Rest',exercises:[]}];
function fixture(e=rich()){const s=initialState();action(s,{type:'saveProgram',name:'Per-set test',days:days(e)});const p=s.programs.at(-1);action(s,{type:'createSchedule',programId:p.id,date:today});action(s,{type:'startWorkout',date:today});return s}
function save(s,fn){const exercises=clone(s.session.exercises);fn(exercises);action(s,{type:'saveSession',id:s.session.id,name:s.session.name,exercises,notes:'Actual note'})}

test('legacy 3 × 10–12 at 90 seconds interprets equivalently without rewriting saved snapshots',()=>{
 const original=legacy(),before=clone(original),targets=plannedSets(original),normalized=normalizePlan(original);
 assert.equal(targets.length,3);assert.ok(targets.every((s,i)=>s.setNumber===i+1&&s.repMin===10&&s.repMax===12&&s.restSeconds===90&&s.targetWeight===undefined));assert.deepEqual(original,before);assert.equal(normalized.rest,undefined);assert.deepEqual(plannedSets(normalized).map(s=>[s.repMin,s.repMax,s.restSeconds]),[[10,12,90],[10,12,90],[10,12,90]]);
 const e=actualFromPlan(original);for(const set of e.sets)delete set.prescriptionId;assert.deepEqual(e.planned,before);assert.equal(setPrescription(e,e.sets[2]).restSeconds,90);assert.equal(workoutProgress([e]).total,3);
});

test('mixed reps/rest, optional weights, set/exercise/workout notes, RPE and group metadata persist exactly',()=>{
 let s=fixture();s=JSON.parse(JSON.stringify(s));const p=s.programs.at(-1).versions[0].days[0],e=p.exercises[0];
 assert.deepEqual(e,normalizePlan(rich()));assert.equal(p.notes,days(rich())[0].notes);assert.equal(e.sets[3].targetWeight,undefined);assert.match(prescriptionSummary(e),/15 \/ 12 \/ 10 \/ 8–10 reps/);assert.match(prescriptionSummary(e),/Rest 1:00–1:30/);assert.deepEqual(s.session.occurrence.day,p);
});

test('starting creates four blank actual rows mapped to individual targets; results cannot alter programs or historical prescriptions',()=>{
 const s=fixture(),plans=clone(s.programs),original=clone(s.session.exercises[0].planned),rows=s.session.exercises[0].sets;
 assert.equal(rows.length,4);assert.ok(rows.every(s=>s.reps===null&&s.weight===null&&!s.done));assert.deepEqual(rows.map(set=>setPrescription(s.session.exercises[0],set).repMin),[15,12,10,8]);assert.deepEqual(rows.map(set=>set.prescriptionId),original.sets.map(s=>s.id));
 save(s,ex=>Object.assign(ex[0].sets[0],{reps:14,weight:55,done:true}));assert.deepEqual(s.programs,plans);action(s,{type:'finishWorkout',confirmIncomplete:true});const log=s.logs[0],ex=clone(log.exercises);ex[0].sets[0].reps=15;action(s,{type:'correctLog',id:log.id,confirmed:true,exercises:ex,notes:'Correction'});assert.deepEqual(log.exercises[0].planned,original);assert.deepEqual(s.programs,plans);
});

test('each completion uses that set’s rest; final completion stops rest and actual extras use the default',()=>{
 const s=fixture(),now=1000000;action(s,{type:'addSet',exerciseId:s.session.exercises[0].id});
 for(const [i,seconds]of [60,60,90,90,90].entries()){const next=clone(s.session.exercises);Object.assign(next[0].sets[i],{done:true,weight:60,reps:10});updateRestForSets(s.session,next,s.settings.defaultRest,now);assert.equal(s.session.timerEnd,i===4?null:now+seconds*1000);s.session.exercises=next}
});

test('history compares each result to its matching reps and weight, excluding extras',()=>{
 const s=fixture();save(s,ex=>ex[0].sets.forEach((set,i)=>Object.assign(set,{done:true,weight:[60,64,70,0][i],reps:[15,12,11,9][i]})));action(s,{type:'addSet',exerciseId:s.session.exercises[0].id});save(s,ex=>Object.assign(ex[0].sets[4],{done:true,weight:100,reps:15}));action(s,{type:'finishWorkout'});const m=historyMetrics(s.logs[0]);assert.deepEqual([m.done,m.total,m.extra,m.repHits,m.repTargets,m.weightHits,m.weightTargets],[4,4,1,3,4,2,3]);
});

test('server rejects invalid per-set targets, duplicate IDs, missing/invalid numbering and invalid notes/metadata',()=>{
 for(const patch of [{repMin:0},{repMin:1.5},{repMax:14},{targetWeight:-1},{targetWeight:null},{weightUnit:'stone'},{restSeconds:-1},{restSeconds:1.5},{targetRpe:10.1},{notes:4},{notes:'x'.repeat(4001)},{setNumber:2},{id:''}]){const e=rich();Object.assign(e.sets[0],patch);assert.ok(prescriptionError(e));assert.throws(()=>fixture(e))}
 const e=rich();e.sets[1].id=e.sets[0].id;assert.throws(()=>fixture(e),/unique IDs/);assert.throws(()=>fixture({...rich(),sets:[]}),/1 to 20/);assert.throws(()=>fixture({...rich(),groupOrder:0}),/Group order/);const s=initialState(),d=days(rich());d[0].notes=4;assert.throws(()=>action(s,{type:'saveProgram',name:'Bad notes',days:d}),/Workout notes/);
});

test('actual target associations and ordering cannot be forged, removed or duplicated',()=>{
 const s=fixture(),before=clone(s);for(const change of [ex=>ex[0].sets[0].prescriptionId=ex[0].sets[1].prescriptionId,ex=>delete ex[0].sets[0].prescriptionId,ex=>ex[0].sets.reverse(),ex=>ex[0].sets[1]=clone(ex[0].sets[0]),ex=>ex[0].planned.sets[0].restSeconds=1]){assert.throws(()=>save(s,change));assert.deepEqual(s,before)}
});

test('editing an old program creates an array version while its existing session and old logs keep scalar snapshots',()=>{
 const s=initialState(),p={id:'legacy',name:'Old program',description:'',archived:false,versions:[{id:'old-v1',number:1,days:days(legacy()),createdAt:'2025-01-01T00:00:00Z'}]};s.programs.push(p);action(s,{type:'createSchedule',programId:p.id,date:today});action(s,{type:'startWorkout',date:today});const oldVersion=clone(p.versions[0]),session=clone(s.session);const edited=clone(p.versions[0].days);edited[0].exercises[0]=normalizePlan(edited[0].exercises[0]);edited[0].exercises[0].sets[0].restSeconds=60;action(s,{type:'saveProgram',id:p.id,name:p.name,days:edited});assert.deepEqual(p.versions[0],oldVersion);assert.deepEqual(s.session,session);assert.ok(Array.isArray(p.versions[1].days[0].exercises[0].sets));assert.equal(setPrescription(s.session.exercises[0],s.session.exercises[0].sets[0]).restSeconds,90);
});

test('legacy presets are recognized equivalently; newly seeded presets use per-set arrays without changing routines',()=>{
 const s=initialState();s.programs=s.programs.filter(p=>p.id!=='preset-user-ppl');for(const p of s.programs){delete p.preset;for(const d of p.versions[0].days)for(const e of d.exercises){e.sets=3;delete e.order;e.repMin=8;e.repMax=12;e.rest=90;e.weight=0}}const before=clone(s.programs.map(p=>p.versions));withPresets(s);assert.equal(s.programs.length,4);assert.ok(s.programs.every(p=>p.preset));assert.deepEqual(s.programs.slice(0,3).map(p=>p.versions),before);const fresh=initialState();assert.ok(fresh.programs.filter(p=>p.id!=='preset-user-ppl').every(p=>p.versions[0].days.flatMap(d=>d.exercises).every(e=>Array.isArray(e.sets)&&e.sets.length===3)));
});

test('canonical kg targets retain pounds display per set and explicit zero remains a target',()=>{
 const e=rich();e.sets[0].targetWeight=storedWeight(154.5,'lb');e.sets[0].weightUnit='lb';e.sets[3].targetWeight=0;e.sets[3].weightUnit='kg';const s=JSON.parse(JSON.stringify(fixture(e))),targets=s.programs.at(-1).versions[0].days[0].exercises[0].sets;assert.equal(displayWeight(targets[0].targetWeight,'lb'),154.5);assert.equal(targets[3].targetWeight,0);
});

test('rich Push/Pull/Legs preset data retains heavy phases, long rests, warmup and group/RPE/dropset metadata',()=>{
 const s=initialState(),source=clone(s.programs[0].versions[0].days);source[0].exercises[1]=normalizePlan(rich(),2);
 const pull=source[1].exercises;pull[1].sets[0].repMin=4;pull[1].sets[0].repMax=6;pull[1].sets[0].restSeconds=180;pull[1].sets[0].targetRpe=9;pull[1].notes='Use straps';pull[2].groupId='A';pull[2].groupType='SUPERSET';pull[2].groupOrder=1;pull[3].groupId='A';pull[3].groupType='SUPERSET';pull[3].groupOrder=2;pull[3].sets[2].notes='Dropset';
 source[3].notes='Warm up 5–10 minutes before squats.';source[3].exercises[0].sets.forEach(set=>set.restSeconds=180);
 action(s,{type:'saveProgram',name:'Rich preset copy',days:source});const roundTrip=JSON.parse(JSON.stringify(s)).programs.at(-1).versions[0].days;
 assert.deepEqual(roundTrip,source);assert.equal(roundTrip[1].exercises[1].sets[0].restSeconds,180);assert.equal(roundTrip[3].notes,source[3].notes);
});
