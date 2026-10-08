"use client";
import {useState,useEffect,useRef,useCallback,type FocusEvent} from 'react';
import {Check,Plus,Timer,SkipForward,Repeat2,Trash2,Save,ChevronLeft,ChevronRight} from 'lucide-react';
import {State,Session,Log,Exercise,CustomExerciseInput,clone,dateLabel,localDate,exerciseLibrary,exerciseStatus,workoutProgress} from '@/lib/cadence';
import {ExercisePicker,Field} from './training-controls';
import {Checkbox} from '@/components/ui/checkbox';
import {prescriptionSummary,setPrescription,setTargetSummary,restTargetLabel,restLabel} from '@/lib/prescription';
import {Progress} from '@/components/ui/progress';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {toast} from 'sonner';
import {useRestHaptics} from '@/hooks/use-rest-haptics';
import {useRestNotifications} from '@/hooks/use-rest-notifications';
import {workoutDuration} from '@/lib/workout-duration';
import WorkoutSetInput from './workout-set-input';
import {actualSetErrors,hasInvalidActualSets,completionAdvances,nextPendingSet,plannedWorkStatus,finishWorkoutMessage} from '@/lib/workout-rules';

type Props={state:State;value:Session|Log;busy:boolean;run:(action:Record<string,unknown>)=>Promise<boolean>;confirm:(title:string,body:string,action:Record<string,unknown>)=>void;history?:boolean;onDraft?:(action:Record<string,unknown>|null,flush?:()=>Promise<boolean>)=>void;onCreateCustom?:(input:CustomExerciseInput)=>Promise<Exercise|null>};
export default function WorkoutEditor({state,value,busy,run,confirm,history=false,onDraft,onCreateCustom}:Props){
 const [draft,setDraft]=useState(clone(value)),[dirty,setDirty]=useState(false),[activeId,setActiveId]=useState<string|null>(value.exercises[0]?.id||null),[picker,setPicker]=useState<string|null>(null),[tick,setTick]=useState(()=>Date.now());
 const [saveError,setSaveError]=useState(''),[skipTarget,setSkipTarget]=useState<string|null>(null),[nextSetId,setNextSetId]=useState<string|null>(null),[manualRest,setManualRest]=useState<Record<string,number>>({});
 const dirtyRef=useRef(false),draftRef=useRef(draft),editVersion=useRef(0),savedVersion=useRef(0),inFlight=useRef<Promise<boolean>|null>(null),syncedValue=useRef(value),selectAdded=useRef<string|null>(null),root=useRef<HTMLDivElement>(null);
 const [saving,setSaving]=useState(false);
 const invalidSets=hasInvalidActualSets(draft.exercises);
 useEffect(()=>{
  if((history&&syncedValue.current!==value)||(!history&&!dirtyRef.current&&!inFlight.current)){
   draftRef.current=clone(value);setDraft(draftRef.current);if(history){dirtyRef.current=false;setDirty(false)}
   if(selectAdded.current){const added=value.exercises.filter(e=>e.exerciseId===selectAdded.current).at(-1);if(added)setActiveId(added.id);selectAdded.current=null}
  }else if(!history&&value.id===draftRef.current.id&&syncedValue.current!==value){
   // Server-owned rest state can change without replacing newer local set input.
   draftRef.current={...draftRef.current,timerEnd:value.timerEnd,timerId:value.timerId,timerSource:value.timerSource};setDraft(draftRef.current);
  }syncedValue.current=value;
 },[value,dirty,saving,history]);
 useEffect(()=>{
  if(history)return;
  const refresh=()=>setTick(Date.now()),interval=setInterval(refresh,1000);
  document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);
  return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('focus',refresh)};
 },[history]);
 const saveAction=useCallback((snapshot:Session|Log)=>({type:history?'correctLog':'saveSession',id:snapshot.id,exercises:snapshot.exercises,name:snapshot.name,notes:snapshot.notes,confirmed:history}),[history]);
 const persist=useCallback(async()=>{
  // Coalesce overlapping save boundaries. Typing alone never requests a save.
  const requested=editVersion.current;
  while(inFlight.current){if(!await inFlight.current)return false;if(savedVersion.current>=requested)return true}
  if(!dirtyRef.current)return true;
  if(hasInvalidActualSets(draftRef.current.exercises))return false;
  const snapshot=clone(draftRef.current),version=editVersion.current;setSaving(true);
  const request=(async()=>{
   try{const ok=await run(saveAction(snapshot));if(ok){savedVersion.current=version;if(editVersion.current===version){dirtyRef.current=false;setDirty(false)}setSaveError('')}else setSaveError('Couldn’t save changes. Your input is kept.');return ok}
   finally{inFlight.current=null;setSaving(false)}
  })();inFlight.current=request;return request;
 },[run,saveAction]);
 const flush=useCallback(async()=>{while(inFlight.current||dirtyRef.current){if(!await persist())return false}return true},[persist]);
 useEffect(()=>{onDraft?.(dirty&&!history?saveAction(draft):null,flush)},[draft,dirty,history,onDraft,saveAction,flush]);
 function update(next:Session|Log){draftRef.current=next;editVersion.current++;dirtyRef.current=true;setDraft(next);setDirty(true);setSaveError('');if(!history)onDraft?.(saveAction(next),flush)}
 function change(f:(d:Session|Log)=>void){const next=structuredClone(draftRef.current);f(next);update(next)}
 function saveOnBlur(event:FocusEvent<HTMLDivElement>){
  if(history||!(event.target instanceof HTMLElement)||!event.target.matches('[data-workout-set-input],textarea'))return;
  const row=event.target.closest('[data-set-id]');if(row&&event.relatedTarget instanceof Node&&row.contains(event.relatedTarget))return;
  void persist();
 }
 async function execute(action:Record<string,unknown>){if(!await flush())return false;return run(action)}
 const exercise=draft.exercises.find(e=>e.id===activeId)||draft.exercises[0],active=exercise?draft.exercises.findIndex(e=>e.id===exercise.id):0;
 const {total:planned,done}=workoutProgress(draft.exercises),countdown=Math.max(0,Math.ceil(((draft.timerEnd||0)-Math.max(tick,Date.now()))/1000)),multiplier=state.settings.unit==='lb'?2.2046226218:1;
 useRestHaptics(draft.id,draft.timerEnd!==null?(draft.timerId||`${draft.timerSource?.setId||'legacy'}:${draft.timerEnd}`):null,countdown,!history);
 useRestNotifications(draft.id,draft.timerEnd!==null?(draft.timerId||`${draft.timerSource?.setId||'legacy'}:${draft.timerEnd}`):null,draft.timerEnd,countdown);
 const previous=exercise?state.logs.filter(l=>l.id!==draft.id&&l.exercises.some(e=>e.exerciseId===exercise.exerciseId)).sort((a,b)=>b.date.localeCompare(a.date))[0]:undefined,prev=previous?.exercises.find(e=>e.exerciseId===exercise?.exerciseId);
 const pendingSet=exercise?(exercise.sets.find(set=>set.id===nextSetId&&!set.done&&!set.skipped)||nextPendingSet(exercise)):undefined,restSeconds=Math.max(1,Math.min(600,exercise?(manualRest[exercise.id]??(pendingSet?setPrescription(exercise,pendingSet)?.restSeconds:undefined)??state.settings.defaultRest):state.settings.defaultRest));
 const timerExercise=draft.exercises.find(e=>e.id===draft.timerSource?.exerciseId),timerSet=timerExercise?.sets.find(s=>s.id===draft.timerSource?.setId),restTarget=timerExercise&&timerSet?setPrescription(timerExercise,timerSet):exercise&&pendingSet?setPrescription(exercise,pendingSet):undefined;
 function navigate(index:number){setActiveId(draftRef.current.exercises[index]?.id||null);setPicker(null);setNextSetId(null);if(!history)void persist()}
 async function completeSet(index:number,checked:boolean){
  const completionControl=document.activeElement;
  const next=structuredClone(draftRef.current),e=next.exercises[active];e.sets[index].done=checked;if(!checked)e.sets[index].skipped=false;update(next);
  const advances=!history&&checked&&completionAdvances(e,index),nextPending=advances?nextPendingSet(e):undefined;
  if(advances)setNextSetId(nextPending?.id||null);
  if(!history){if(nextPending)requestAnimationFrame(()=>{if(document.activeElement===document.body||document.activeElement===completionControl)root.current?.querySelector<HTMLInputElement>(`[data-set-id="${nextPending.id}"] input`)?.focus({preventScroll:true})});await persist()}
 }
 async function skipExercise(id:string){
  const index=draft.exercises.findIndex(e=>e.id===id),e=draft.exercises[index];setSkipTarget(null);
  if(await execute({type:'skipExercise',id,skipped:true,confirmRemaining:true})){if(index<draft.exercises.length-1)navigate(index+1);toast(`${e.name}: remaining sets skipped`,{action:{label:'Undo',onClick:()=>{void run({type:'skipExercise',id,skipped:false})}}})}
 }
 async function addExercise(e:Exercise){if(!await flush())return;selectAdded.current=e.id;if(!await run({type:'addExercise',exerciseId:e.id}))selectAdded.current=null;setPicker(null)}
 const library=exerciseLibrary(state),skipping=draft.exercises.find(e=>e.id===skipTarget);
 return <div className="workout" ref={root} onBlurCapture={saveOnBlur}>
  {!history&&<div className="workout-session-controls">
   <span className="workout-total-timer" role="timer" aria-label="Total workout time" aria-live="off"><span aria-hidden="true">⏱</span><span>{workoutDuration(draft.startedAt,tick)}</span></span>
  </div>}
  <div className="row between wrap"><div><p className="eyebrow">{history?'WORKOUT LOG':draft.date<localDate()?'HISTORICAL BACKFILL':'ACTIVE WORKOUT'}</p><h2>{draft.name}</h2><p className="muted">{dateLabel(draft.date,{weekday:'long',day:'numeric',month:'long'})} · {draft.occurrence?'Scheduled':'Unscheduled'}</p></div><div className="row tight workout-header-controls"><span className="badge workout-save-status" data-save-state={saveError?'error':saving?'saving':invalidSets||dirty?'unsaved':history?'history':'saved'} role="status">{saveError?'Not saved':saving?'Saving…':invalidSets||dirty?'Unsaved changes':history?'Saved log':'Progress saved'}</span></div></div>
  {draft.occurrence?.day.notes&&<p className="planned-workout-notes">Workout plan: {draft.occurrence.day.notes}</p>}
  {invalidSets&&<p className="set-validation-error" role="alert">Fix the highlighted set values to save your changes.</p>}
  {saveError&&<div className="workout-save-error" role="alert"><span>{saveError}</span><button type="button" className="secondary" disabled={busy||saving} onClick={()=>persist()}>Retry</button></div>}
  {planned>0&&<div className="workoutprogress"><div className="row between"><span>{done} of {planned} planned sets completed</span><span>{Math.round(done/planned*100)}%</span></div><Progress value={done/planned*100}/></div>}
  <fieldset disabled={busy}>
   <div className="exercise-nav">{draft.exercises.map((e,i)=><button className={active===i?'selected':''} key={e.id} type="button" onClick={()=>navigate(i)}><span className="exnumber">{i+1}</span><span>{e.name}</span>{exerciseStatus(e)==='COMPLETED'?<Check size={16}/>:e.skipped?<SkipForward size={16}/>:null}</button>)}</div>
   {exercise?<section className="exercisework">
    <div className="row between wrap workout-exercise-heading"><div><h3>{exercise.name}</h3>{exercise.planned?<p className="muted">Planned: {exercise.planned.name} · {prescriptionSummary(exercise.planned,state.settings.unit)}</p>:<p className="muted">Additional exercise</p>}{exercise.planned?.notes&&<p className="muted planned-exercise-notes">Program note: {exercise.planned.notes}</p>}{exercise.planned?.groupId&&<p className="muted">Superset {exercise.planned.groupId}{exercise.planned.groupOrder?` · Position ${exercise.planned.groupOrder}`:''}</p>}<span className="exercise-state">{exerciseStatus(exercise).replaceAll('_',' ').toLowerCase()}</span></div>
     {!history&&<div className="row tight wrap"><button type="button" className="secondary small" onClick={()=>setPicker(picker===exercise.id?null:exercise.id)}><Repeat2 size={16}/>Substitute</button><button type="button" className="secondary small" disabled={!exercise.skipped&&!exercise.sets.some(s=>!s.done)} onClick={()=>exercise.skipped?execute({type:'skipExercise',id:exercise.id,skipped:false}):exercise.sets.some(s=>s.done)?setSkipTarget(exercise.id):skipExercise(exercise.id)}><SkipForward size={16}/>{exercise.skipped?'Restore exercise':'Skip exercise'}</button>{!exercise.planned&&<button type="button" aria-label="Remove additional exercise" className="iconbtn danger" onClick={()=>execute({type:'removeExtra',id:exercise.id})}><Trash2 size={18}/></button>}</div>}
    </div>
    {picker===exercise.id&&<div className="inset"><p className="muted">The original planned exercise and set count stay attached.</p><ExercisePicker exercises={library} onCreate={onCreateCustom} onPick={async e=>{await execute({type:'substitute',id:exercise.id,exerciseId:e.id});setPicker(null)}}/></div>}
    {!history&&<div className="workout-rest compact-rest" data-active={draft.timerEnd!==null&&countdown>0} aria-label="Workout rest timer"><div className="row between"><h3><Timer size={16}/>Rest timer</h3><b className="timerdigits" role="timer">{String(Math.floor(countdown/60)).padStart(2,'0')}:{String(countdown%60).padStart(2,'0')}</b></div>{draft.timerEnd!==null?<><div className="rest-compact-actions"><div className="rest-adjustments"><button type="button" className="secondary small" onClick={()=>execute({type:'timer',adjust:-15})}>-15s</button><button type="button" className="secondary small" onClick={()=>execute({type:'timer',adjust:15})}>+15s</button></div><button type="button" className="textbtn rest-skip" onClick={()=>execute({type:'timer',seconds:null})}>Skip rest</button></div>{countdown===0&&<p role="status" className="blue">Rest complete. Ready for your next set.</p>}{restTarget?.restSecondsMax!==undefined&&<p className="muted rest-range-note">Target rest: {restTargetLabel(restTarget)}. Timer starts at {restLabel(restTarget.restSeconds)}; adjust as needed.</p>}</>:<div className="row rest-manual"><input aria-label="Rest seconds" type="number" min={1} max={600} step={1} inputMode="numeric" value={restSeconds} onChange={e=>setManualRest({...manualRest,[exercise.id]:Math.max(1,Math.min(600,Math.trunc(Number(e.target.value)||1)))})}/><button type="button" className="secondary small" onClick={()=>execute({type:'timer',seconds:Math.max(1,Math.min(600,restSeconds))})}>Start rest</button><span className="sr-only">Starts automatically between sets.</span></div>}</div>}
    {prev&&<div className="previous"><span className="eyebrow">LAST TIME · {dateLabel(previous!.date)}</span><p>{prev.sets.filter(s=>s.done).map(s=>`${Math.round(s.weight!*multiplier*10)/10} ${state.settings.unit} × ${s.reps}`).join('   /   ')||'No performed sets'}</p></div>}
    {exercise.skipped&&<p className="skipped-exercise-message">Remaining sets are skipped. Completed sets and entered values are kept.</p>}
    <div className="sets"><div className="setrow setheading"><span>Set</span><span>Weight ({state.settings.unit})</span><span>Reps</span><span>Done</span></div>{exercise.sets.map((set,i)=>{const skipped=!set.done&&!!set.skipped,errors=actualSetErrors(set),errorId=`workout-${draft.id}-${set.id}`,target=setPrescription(exercise,set);return <div className={'setrow '+(set.done?'setdone':skipped?'setskipped':set.id===pendingSet?.id?'setnext':'')} key={set.id} data-set-id={set.id}><div>{i+1}<small className="muted">{skipped?'Skipped':!history&&!set.done&&set.id===pendingSet?.id?'Next set':set.planned?'Planned':'Extra'}</small>{!history&&!set.planned&&<button type="button" className="iconbtn danger remove-extra-set" aria-label={`Remove extra set ${i+1}`} disabled={set.done} onClick={()=>execute({type:'removeSet',exerciseId:exercise.id,setId:set.id})}><Trash2 size={14}/></button>}</div>
     <WorkoutSetInput aria-invalid={!!errors.weight} aria-describedby={errors.weight?`${errorId}-weight-error`:undefined} aria-label={`Set ${i+1} weight`} disabled={skipped} min={0} max={2000*multiplier} step="any" inputMode="decimal" placeholder={target?.targetWeight!==undefined?String(Math.round(target.targetWeight*multiplier*10)/10):undefined} value={set.weight===null?null:Math.round(set.weight*multiplier*100)/100} onValue={value=>change(d=>{d.exercises[active].sets[i].weight=value===null?null:value/multiplier})}/>
     <WorkoutSetInput aria-invalid={!!errors.reps} aria-describedby={errors.reps?`${errorId}-reps-error`:undefined} aria-label={`Set ${i+1} reps`} disabled={skipped} min={1} max={999} inputMode="numeric" placeholder={target?String(target.repMin):undefined} value={set.reps} onValue={value=>change(d=>{d.exercises[active].sets[i].reps=value})}/>
     <Checkbox aria-label={`Set ${i+1} completed`} checked={set.done} disabled={skipped||(!set.done&&(set.weight===null||set.reps===null||!!errors.weight||!!errors.reps))} onCheckedChange={checked=>completeSet(i,checked===true)}/>
     {target&&<p className="set-target">Target: {setTargetSummary(target,state.settings.unit)}{target.notes&&<span> · {target.notes}</span>}</p>}
     {errors.weight&&<p className="set-validation-error" id={`${errorId}-weight-error`}>{errors.weight}</p>}
     {errors.reps&&<p className="set-validation-error" id={`${errorId}-reps-error`}>{errors.reps}</p>}
    </div>})}</div>
    {!history&&!exercise.skipped&&<button type="button" className="textbtn" onClick={()=>execute({type:'addSet',exerciseId:exercise.id})}><Plus size={16}/>Add extra set</button>}
    <div className="row between wrap exercisebottom"><button type="button" className="secondary small" disabled={active===0} onClick={()=>navigate(active-1)}><ChevronLeft size={16}/>Previous exercise</button><button type="button" className="secondary small" disabled={active>=draft.exercises.length-1} onClick={()=>navigate(active+1)}>Next exercise<ChevronRight size={16}/></button></div>
   </section>:<div className="restmessage">Add an exercise to start your workout.</div>}
   {!history&&<section className="inset"><button type="button" className="textbtn" onClick={()=>setPicker(picker==='add'?null:'add')}><Plus size={16}/>Add exercise</button>{picker==='add'&&<ExercisePicker exercises={library} onCreate={onCreateCustom} onPick={addExercise}/>}</section>}
   <Field label="Workout notes"><textarea rows={3} maxLength={4000} value={draft.notes} placeholder="How did it feel?" onChange={e=>change(d=>{d.notes=e.target.value})}/></Field>
   {history?<div className="formfooter"><p className="muted">Corrections update actual results. The original plan remains preserved.</p><button type="button" className="primary" disabled={!dirty||invalidSets} onClick={()=>confirm('Save historical correction?','This explicitly updates your recorded set results and recalculates completion status.',saveAction(draftRef.current))}><Save size={16}/>Save correction</button></div>:<div className="formfooter"><button type="button" className="textbtn danger" onClick={()=>confirm('Discard workout?','Your progress from this workout will be removed.',{type:'discardWorkout',confirmed:true})}><Trash2 size={16}/>Discard workout</button><button type="button" className="primary" onClick={async()=>{if(!await flush())return;const counts=plannedWorkStatus(draftRef.current.exercises);if(counts.pending>0)confirm('Finish workout?',finishWorkoutMessage(counts),{type:'finishWorkout',confirmIncomplete:true});else await run({type:'finishWorkout'})}}><Check size={16}/>Finish workout</button></div>}
  </fieldset>
  <AlertDialog open={!!skipTarget} onOpenChange={open=>{if(!open)setSkipTarget(null)}}><AlertDialogContent><AlertDialogTitle>Skip remaining sets?</AlertDialogTitle><AlertDialogDescription>{skipping?.sets.filter(s=>s.done).length||0} completed sets will still be saved. Remaining sets will be skipped for this workout only.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><button type="button" className="primary" disabled={busy} onClick={()=>skipTarget&&skipExercise(skipTarget)}>Skip remaining</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}
