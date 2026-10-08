import {plannedSets,plannedSetCount,normalizePlan} from './prescription';
import {userPplExercises,userPplWorkouts} from './presets/user-ppl';
export type Exercise = {id:string;name:string;muscle:string;equipment:string;source?:'SYSTEM'|'USER';notes?:string;archived?:boolean};
export type CustomExerciseInput={name:string;muscle:string;equipment:string;notes:string};
const builtInExercises:Exercise[] = [
 ['bench','Bench Press','Chest','Barbell'],['incline','Incline Dumbbell Press','Chest','Dumbbell'],['fly','Cable Fly','Chest','Cable'],['pushup','Push-up','Chest','Bodyweight'],['ohp','Overhead Press','Shoulders','Barbell'],['lateral','Lateral Raise','Shoulders','Dumbbell'],['triceps','Triceps Pushdown','Arms','Cable'],['pullup','Pull-up','Back','Bodyweight'],['pulldown','Lat Pulldown','Back','Cable'],['row','Barbell Row','Back','Barbell'],['seatedrow','Seated Cable Row','Back','Cable'],['curl','Biceps Curl','Arms','Dumbbell'],['squat','Back Squat','Legs','Barbell'],['rdl','Romanian Deadlift','Legs','Barbell'],['legpress','Leg Press','Legs','Machine'],['legcurl','Leg Curl','Legs','Machine'],['lunge','Walking Lunge','Legs','Dumbbell'],['calf','Calf Raise','Legs','Machine'],['deadlift','Deadlift','Back','Barbell'],['plank','Plank','Core','Bodyweight'],['crunch','Cable Crunch','Core','Cable']
].map(([id,name,muscle,equipment])=>({id,name,muscle,equipment,source:'SYSTEM'}));
export const catalog:Exercise[]=[...builtInExercises,...userPplExercises];
export function exerciseLibrary(s:State,includeArchived=false){return [...catalog,...(s.customExercises||[]).filter(e=>includeArchived||!e.archived)]}
export const CYCLE_LENGTHS=[1,2,3,4,5,6,7,8,9,10,11,12] as const;
// Weight uses the same canonical kg storage as actual set results. weightUnit remembers the editor's display unit.
export type SetPrescription={id:string;setNumber:number;repMin:number;repMax:number;targetWeight?:number;weightUnit?:'kg'|'lb';restSeconds:number;restSecondsMax?:number;notes?:string;targetRpe?:number};
// Scalar fields are read compatibility for existing persisted versions and logs.
// New saves use sets[] exclusively; actual results never live in this model.
export type PlanExercise={id:string;exerciseId:string;name:string;order?:number;sets:number|SetPrescription[];repMin?:number;repMax?:number;weight?:number;weightUnit?:'kg'|'lb';rest?:number;restSeconds?:number;notes?:string;groupId?:string;groupType?:'SUPERSET';groupOrder?:number};
export type CycleDay={type:'WORKOUT'|'REST';name:string;exercises:PlanExercise[];notes?:string};
export type Version={id:string;number:number;days:CycleDay[];createdAt:string;templateOnly?:boolean};
export type Program={id:string;name:string;description:string;archived:boolean;preset?:boolean;needsCycleSetup?:boolean;versions:Version[]};
export type Application={id:string;programId:string;versionId:string;effective:string;suppressed:string[]};
export type Occurrence={scheduleId:string;appId:string;id:string;date:string;originDate:string;cycleDay:number;cycleNumber:number;programName:string;versionNumber:number;day:CycleDay;overridden?:boolean};
export type Override={id:string;type:'MOVE'|'SWAP'|'REPLACE';dates:string[];values:Record<string,Occurrence>};
export type CycleState={appId:string;index:number;cycleNumber:number;queued?:{programId:string;versionId:string;index?:number}|null};
export type SkippedWorkout={occurrence:Occurrence;skippedAt:string};
export type Schedule={id:string;start:string;end:string|null;status:'ACTIVE'|'ENDED'|'CANCELLED';applications:Application[];overrides:Override[];cycleState?:CycleState;skippedWorkouts?:SkippedWorkout[]};
export type ResultSet={id:string;planned:boolean;prescriptionId?:string;reps:number|null;weight:number|null;done:boolean;skipped?:boolean};
export type ActualExercise={id:string;planned:PlanExercise|null;exerciseId:string;name:string;skipped:boolean;sets:ResultSet[]};
export type Session={id:string;name:string;date:string;startedAt:string;timezone:string;occurrence:Occurrence|null;exercises:ActualExercise[];notes:string;timerEnd:number|null;timerId?:string|null;timerSource?:{exerciseId:string;setId:string}|null};
export type Log=Session & {finishedAt:string;status:'COMPLETED'|'PARTIALLY_COMPLETED'|'UNSCHEDULED';correctedAt?:string};
export type State={programs:Program[];schedules:Schedule[];session:Session|null;logs:Log[];customExercises:Exercise[];settings:{unit:'kg'|'lb';defaultRest:number}};
export const uid=()=>crypto.randomUUID();
export const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
export function dayNumber(date:string){return Date.parse(date+'T00:00:00Z')/86400000}
export function addDays(date:string,n:number){return new Date((dayNumber(date)+n)*86400000).toISOString().slice(0,10)}
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function dateLabel(date:string,opts:Intl.DateTimeFormatOptions={day:'numeric',month:'short'}){return new Date(date+'T12:00:00').toLocaleDateString(undefined,opts)}
export function activeSchedule(s:State){return s.schedules.find(x=>x.status==='ACTIVE')}
export function getVersion(s:State,pid:string,vid?:string){const p=s.programs.find(p=>p.id===pid);return {program:p,version:vid?p?.versions.find(v=>v.id===vid):p?.versions.at(-1)}}
export const workoutDays=(days:CycleDay[])=>days.filter(day=>day.type==='WORKOUT');
// Stored calendar applications and immutable log snapshots remain readable.
// New progression uses a cursor, never elapsed dates or historical corrections.
export function ensureCycleState(s:State,today=localDate()){
 const schedule=activeSchedule(s);if(!schedule||schedule.cycleState)return;
 const ordered=[...schedule.applications].sort((a,b)=>a.effective.localeCompare(b.effective));
 const active=s.session?.occurrence?.scheduleId===schedule.id?s.session.occurrence:null;
 const application=ordered.find(a=>a.id===active?.appId)||ordered.filter(a=>a.effective<=today).at(-1)||ordered[0];if(!application)return;
 const version=getVersion(s,application.programId,application.versionId).version;if(!version)return;
 const workouts=workoutDays(version.days);if(!workouts.length)return;
 const logs=s.logs.filter(log=>log.occurrence?.scheduleId===schedule.id&&log.occurrence.appId===application.id).sort((a,b)=>a.finishedAt.localeCompare(b.finishedAt));
 const previous=active||logs.at(-1)?.occurrence;
 const number=previous?version.days.slice(0,previous.cycleDay).filter(day=>day.type==='WORKOUT').length:1;
 let index=previous?Math.max(0,number-1):0,cycleNumber=previous?.cycleNumber||1;
 if(previous&&!active){index++;if(index>=workouts.length){index=0;cycleNumber++}}
 const queued=ordered.filter(a=>a.effective>today&&a.id!==application.id).at(-1);
 schedule.cycleState={appId:application.id,index:Math.min(index,workouts.length-1),cycleNumber,queued:queued?{programId:queued.programId,versionId:queued.versionId}:null};
}
export function currentProgram(s:State,today=localDate()){
 ensureCycleState(s,today);const schedule=activeSchedule(s),cursor=schedule?.cycleState;
 const application=schedule?.applications.find(a=>a.id===cursor?.appId);
 const {program,version}=application?getVersion(s,application.programId,application.versionId):{program:undefined,version:undefined};
 return {schedule,cursor,application,program,version,workouts:version?workoutDays(version.days):[]};
}
export function nextProgramWorkout(s:State,date=localDate()):Occurrence|null{
 const {schedule,cursor,application,program,version,workouts}=currentProgram(s,date);
 if(!schedule||!cursor||!application||!program||!version||!workouts[cursor.index])return null;
 const day=workouts[cursor.index],cycleDay=version.days.indexOf(day)+1;
 return {scheduleId:schedule.id,appId:application.id,id:`${schedule.id}:${application.id}:cycle:${cursor.cycleNumber}:workout:${cursor.index}`,date,originDate:date,cycleDay,cycleNumber:cursor.cycleNumber,programName:program.name,versionNumber:version.number,day:clone(day)};
}
export function advanceProgram(s:State,occurrence:Occurrence|null,today:string){
 if(!occurrence)return;
 const {schedule,cursor,workouts}=currentProgram(s,today);
 if(!schedule||!cursor||schedule.id!==occurrence.scheduleId||cursor.appId!==occurrence.appId)return;
 cursor.index++;
 if(cursor.index>=workouts.length){cursor.index=0;cursor.cycleNumber++;if(cursor.queued){activateProgramVersion(s,cursor.queued.programId,cursor.queued.versionId,today,cursor.queued.index||0)}}
}
export function activateProgramVersion(s:State,programId:string,versionId:string,today:string,index=0){
 const schedule=activeSchedule(s)!;
 const application:Application={id:uid(),programId,versionId,effective:today,suppressed:[]};
 const length=workoutDays(getVersion(s,programId,versionId).version!.days).length;
 schedule.applications.push(application);schedule.cycleState={appId:application.id,index:Math.max(0,Math.min(Math.trunc(index),length-1)),cycleNumber:1,queued:null};
}
export function projection(s:State,date:string,today=localDate()):Occurrence|null{
 if(date>today)return null;
 if(date===today)return nextProgramWorkout(s,today);
 return s.logs.filter(log=>log.date===date&&log.occurrence).at(-1)?.occurrence||s.schedules.flatMap(schedule=>schedule.skippedWorkouts||[]).filter(skip=>skip.occurrence.date===date).at(-1)?.occurrence||null;
}
export function statusFor(s:State,o:Occurrence|null,today:string){if(!o)return 'NO_WORKOUT';if(s.session?.occurrence?.id===o.id)return 'IN_PROGRESS';const log=s.logs.find(l=>l.occurrence?.id===o.id);if(log)return log.status;if(s.schedules.some(schedule=>(schedule.skippedWorkouts||[]).some(skip=>skip.occurrence.id===o.id)))return 'SKIPPED';return o.date===today?'PLANNED':'NO_WORKOUT'}
export function completion(exercises:ActualExercise[]){return exercises.filter(e=>e.planned).every(e=>e.sets.filter(x=>x.planned&&x.done).length===plannedSetCount(e.planned!))}
export function exerciseStatus(e:ActualExercise){const done=e.sets.filter(s=>s.done).length;if(e.sets.length&&done===e.sets.length)return 'COMPLETED';if(e.sets.some(s=>!s.done&&!s.skipped))return done?'IN_PROGRESS':'PENDING';if(e.skipped||e.sets.some(s=>s.skipped))return done?'PARTIALLY_COMPLETED':'SKIPPED';return done?'IN_PROGRESS':'PENDING'}
export function workoutProgress(exercises:ActualExercise[]){return {total:exercises.reduce((n,e)=>n+(e.planned?plannedSetCount(e.planned):0),0),done:exercises.reduce((n,e)=>n+e.sets.filter(s=>s.planned&&s.done).length,0)}}
export function actualFromPlan(p:PlanExercise):ActualExercise{return {id:uid(),planned:clone(p),exerciseId:p.exerciseId,name:p.name,skipped:false,sets:plannedSets(p).map(set=>({id:uid(),planned:true,prescriptionId:set.id,reps:null,weight:null,done:false}))}}
function template(name:string,ids:string[]):CycleDay{return{type:'WORKOUT',name,exercises:ids.map((exerciseId,i)=>normalizePlan({id:`${name}:${exerciseId}`,exerciseId,name:catalog.find(e=>e.id===exerciseId)!.name,sets:3,repMin:8,repMax:12,weight:0,rest:90},i+1))}}
export function initialState():State{
 const rest:CycleDay={type:'REST',name:'Rest',exercises:[]};
 const configs=[{name:'Push / Pull / Legs',description:'A balanced split for strength and muscle.',days:[template('Push',['bench','incline','ohp','lateral','triceps']),template('Pull',['pulldown','row','seatedrow','curl']),rest,template('Legs',['squat','rdl','legcurl','calf']),rest]},{name:'Upper / Lower',description:'Train each muscle group twice per cycle.',days:[template('Upper A',['bench','row','ohp','curl']),template('Lower A',['squat','rdl','calf']),rest,template('Upper B',['incline','pulldown','lateral','triceps']),template('Lower B',['legpress','legcurl','lunge']),rest,rest]},{name:'Full Body',description:'A simple three-day cycle for total-body training.',days:[template('Full Body A',['squat','bench','row']),rest,template('Full Body B',['deadlift','ohp','pulldown'])]}];
 const programs:Program[]=configs.map((x,i)=>({id:`preset-${i+1}`,name:x.name,description:x.description,archived:false,preset:true,versions:[{id:`preset-${i+1}-v1`,number:1,days:clone(workoutDays(x.days)),createdAt:'2026-10-06T00:00:00.000Z'}]}));
 programs.push({id:'preset-user-ppl',name:'User PPL',description:'Detailed Push, Pull and Legs workouts with per-set targets, RPE and supersets. Repeat at your own pace.',archived:false,preset:true,versions:[{id:'preset-user-ppl-v1',number:1,days:clone(userPplWorkouts),createdAt:'2026-10-07T00:00:00.000Z'}]});
 return{programs,schedules:[],session:null,logs:[],customExercises:[],settings:{unit:'kg',defaultRest:90}};
}
export function withPresets(s:State):State{
 s.customExercises??=[];
 // Older sessions stored skip at exercise level. Preserve performed sets and
 // materialize only the unperformed skipped sets for the new per-set UI.
 for(const workout of [...s.logs,...(s.session?[s.session]:[])])for(const exercise of workout.exercises)if(exercise.skipped)for(const set of exercise.sets)if(!set.done&&set.skipped===undefined)set.skipped=true;
 const signature=(days:CycleDay[])=>JSON.stringify(days.map(d=>({...d,exercises:d.exercises.map((exercise,i)=>{const e=normalizePlan(exercise,i+1);const {id,...value}=e;void id;return {...value,sets:plannedSets(e).map(({id,...set})=>{void id;return set})}})})));
 for(const preset of initialState().programs){
  const existing=s.programs.find(p=>p.preset&&p.name===preset.name)||s.programs.find(p=>!p.archived&&p.name===preset.name&&p.description===preset.description&&p.versions.length===1&&signature(p.versions[0].days)===signature(preset.versions[0].days));
  if(existing)existing.preset=true;else s.programs.push(preset);
 }
 ensureCycleState(s);
 return s;
}
