import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {mkdir,readFile} from 'node:fs/promises';
await mkdir('.sites-runtime/tests',{recursive:true});
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/prescription';export * from './lib/workout-rules';export * from './lib/presets/user-ppl';export * from './lib/preset-cycle';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/user-ppl-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {userPplWorkouts,catalog,initialState,act,clone,withPresets,prescriptionError,setTargetSummary,prescriptionSummary,normalizePlan,actualFromPlan,setPrescription,updateRestForSets,configurePresetCycle}=await import('../.sites-runtime/tests/user-ppl-domain.mjs');
const source=await readFile('docs/USER_PPL_SOURCE.md','utf8'),today='2026-10-07',zone='Asia/Bangkok';

test('import preserves every source exercise and all 73 original set rows exactly',()=>{
 const exerciseNames=[...source.matchAll(/^### \d+\. (.+)$/gm)].map(m=>m[1].trim()),exercises=userPplWorkouts.flatMap(d=>d.exercises);
 assert.deepEqual(exercises.map(e=>e.name),exerciseNames);assert.deepEqual(userPplWorkouts.map(d=>[d.name,d.exercises.length,d.exercises.reduce((sum,e)=>sum+e.sets.length,0)]),[['Push',7,22],['Pull',9,29],['Legs',7,22]]);
 const rows=source.split(/\r?\n/).filter(line=>/^\|\s*\d+\s*\|/.test(line)).map(line=>line.split('|').slice(1,-1).map(x=>x.trim())),sets=exercises.flatMap(e=>e.sets);assert.equal(rows.length,73);
 for(const [i,row] of rows.entries()){const set=sets[i],hasRpe=row.length===6,rep=row[1].split('–').map(Number),rest=row[hasRpe?4:3].replace('s','').split('–').map(Number),note=row[hasRpe?5:4];assert.equal(set.setNumber,Number(row[0]));assert.deepEqual([set.repMin,set.repMax],[rep[0],rep.at(-1)]);assert.deepEqual([set.restSeconds,set.restSecondsMax],[rest[0],rest.length===2?rest[1]:undefined]);assert.equal(set.targetRpe,hasRpe&&row[2]!=='—'?Number(row[2]):undefined);assert.equal(set.notes,note&&note!=='—'?note:undefined);assert.equal(set.targetWeight,undefined)}
 for(const exercise of exercises){assert.equal(prescriptionError(exercise),'');assert.equal(catalog.find(e=>e.id===exercise.exerciseId)?.name,exercise.name);assert.deepEqual(exercise.sets.map(s=>s.setNumber),Array.from({length:exercise.sets.length},(_,i)=>i+1))}assert.equal(new Set(exercises.flatMap(e=>e.sets.map(s=>s.id))).size,73);
});

test('phase, original Vietnamese cues, per-side/dropset/superset notes, durations and warmup survive normalization',()=>{
 const [push,pull,legs]=clone(userPplWorkouts).map(d=>({...d,exercises:d.exercises.map((e,i)=>normalizePlan(e,i+1))}));
 assert.equal(push.exercises[1].notes,'Ngồi chéo ~20–30°');assert.equal(push.exercises[4].notes,'1 tay');assert.match(pull.exercises[0].notes,/Heavy Compound/);assert.match(pull.exercises[1].notes,/Đeo Strap/);assert.match(pull.exercises[2].notes,/Lat Focus\n10–12 reps\/bên/);assert.ok(pull.exercises[2].sets.every(s=>s.notes==='Per side'));assert.equal(pull.exercises[3].sets[2].notes,'Dropset');assert.match(pull.exercises[5].notes,/Hơi gập người 15 độ \| Đeo Strap/);assert.match(pull.exercises[6].notes,/Ghế 45 độ/);assert.match(pull.exercises[8].notes,/Lòng bàn tay úp/);assert.equal(pull.notes,'Estimated duration: ~120 minutes.');assert.equal(legs.notes,'Warmup: 5–10 minutes before Squat.\nEstimated duration: ~60–70 minutes.');
 for(const [indices,id]of [[[4,5],'pull-superset-a'],[[6,7],'pull-superset-b']])assert.deepEqual(indices.map(i=>[pull.exercises[i].groupId,pull.exercises[i].groupType,pull.exercises[i].groupOrder]),[[id,'SUPERSET',1],[id,'SUPERSET',2]]);assert.ok(pull.exercises[5].sets.every(s=>s.notes==='Rest after completing both superset exercises'));assert.ok(pull.exercises[7].sets.every(s=>s.notes==='Rest after completing both superset exercises'));
});

test('rest ranges are stored/displayed exactly, editable through server saves, and start the timer at their minimum',()=>{
 const row=userPplWorkouts[1].exercises[0];assert.match(prescriptionSummary(row),/Rest 2:00–3:00/);assert.match(setTargetSummary(row.sets[0]),/Rest 2:00–3:00/);const e=actualFromPlan(row),session={exercises:[e],timerEnd:null,timerSource:null},next=clone(session.exercises);Object.assign(next[0].sets[0],{done:true,reps:7,weight:60});updateRestForSets(session,next,90,1000);assert.equal(session.timerEnd,121000);assert.equal(setPrescription(e,e.sets[0]).restSecondsMax,180);
 const state=initialState(),days=clone(userPplWorkouts);act(state,{type:'saveProgram',name:'Import test',days},today,zone);const saved=JSON.parse(JSON.stringify(state)).programs.at(-1).versions[0].days;assert.deepEqual(saved.map(d=>d.exercises.map(e=>e.sets.map(s=>[s.restSeconds,s.restSecondsMax]))),days.map(d=>d.exercises.map(e=>e.sets.map(s=>[s.restSeconds,s.restSecondsMax]))));
 for(const value of [119,180.5,-1,3601,null]){const invalid=clone(row);invalid.sets[0].restSecondsMax=value;assert.match(prescriptionError(invalid),/Maximum rest/)}
});

test('adding the preset to existing state is idempotent and leaves existing programs and logs intact',()=>{
 const state=initialState();state.programs=state.programs.filter(p=>p.id!=='preset-user-ppl');const before=clone(state.programs);withPresets(state);withPresets(state);assert.equal(state.programs.filter(p=>p.id==='preset-user-ppl').length,1);assert.deepEqual(state.programs.slice(0,before.length),before);assert.deepEqual(state.logs,[]);assert.equal(state.schedules.length,0);
});

test('source templates require an explicit cycle; choosing one saves an editable version and does not start a schedule',()=>{
 const s=initialState(),preset=clone(s.programs.find(p=>p.id==='preset-user-ppl'));assert.equal(preset.needsCycleSetup,true);act(s,{type:'duplicateProgram',id:preset.id},today,zone);const copy=s.programs.at(-1);assert.equal(copy.needsCycleSetup,true);assert.equal(copy.preset,undefined);assert.throws(()=>act(s,{type:'createSchedule',programId:copy.id,date:today},today,zone),/Choose and save a repeating cycle/);const original=clone(copy.versions[0]);act(s,{type:'saveProgram',id:copy.id,name:copy.name,days:configurePresetCycle(copy.versions[0].days,5)},today,zone);assert.equal(copy.needsCycleSetup,undefined);assert.deepEqual(copy.versions[0],original);assert.equal(copy.versions.at(-1).days.length,5);assert.equal(s.schedules.length,0);assert.deepEqual(s.programs.find(p=>p.id===preset.id),preset);assert.throws(()=>act(s,{type:'createSchedule',programId:copy.id,versionId:copy.versions[0].id,date:today},today,zone),/Choose and save/);act(s,{type:'createSchedule',programId:copy.id,versionId:copy.versions.at(-1).id,date:today},today,zone);assert.equal(s.schedules.length,1);assert.throws(()=>act(s,{type:'applyVersion',programId:copy.id,versionId:copy.versions[0].id,date:'2026-10-08'},today,zone),/Choose and save/);
});

test('the selected 3, 5 or 7 day cycle preserves every workout and never mutates the preset templates',()=>{
 const original=clone(userPplWorkouts),layouts={3:['Push','Pull','Legs'],5:['Push','Pull','Rest','Legs','Rest'],7:['Push','Pull','Rest','Legs','Rest','Rest','Rest']};for(const length of [3,5,7]){const days=configurePresetCycle(userPplWorkouts,length);assert.deepEqual(days.map(d=>d.name),layouts[length]);assert.deepEqual(days.filter(d=>d.type==='WORKOUT'),original);assert.ok(days.filter(d=>d.type==='REST').every(d=>!d.exercises.length));days[0].exercises[0].sets[0].repMin=99;assert.deepEqual(userPplWorkouts,original)}assert.throws(()=>configurePresetCycle(userPplWorkouts,4));
});
