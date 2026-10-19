"use client";
import {useState,useEffect,useRef,useCallback,type FocusEvent} from 'react';
import {Check,Plus,Timer,SkipForward,ArrowLeftRight,Trash2,Save,ChevronLeft,ChevronRight,MoreVertical} from 'lucide-react';
import {State,Session,Log,Exercise,CustomExerciseInput,clone,dateLabel,exerciseLibrary,exerciseStatus,workoutProgress} from '@/lib/cadence';
import {ExercisePicker,Field} from './training-controls';
import {Checkbox} from '@/components/ui/checkbox';
import {prescriptionSummary,setPrescription,setTargetSummary} from '@/lib/prescription';
import {Progress} from '@/components/ui/progress';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {toast} from 'sonner';
import {useRestHaptics} from '@/hooks/use-rest-haptics';
import {useRestNotifications,closeRestNotifications} from '@/hooks/use-rest-notifications';
import {workoutDuration} from '@/lib/workout-duration';
import WorkoutSetInput from './workout-set-input';
import {actualSetErrors,hasInvalidActualSets,completionAdvances,nextPendingSet,plannedWorkStatus,finishWorkoutMessage} from '@/lib/workout-rules';

type Props={state:State;value:Session|Log;busy:boolean;run:(action:Record<string,unknown>)=>Promise<boolean>;confirm:(title:string,body:string,action:Record<string,unknown>)=>void;history?:boolean;onDraft?:(action:Record<string,unknown>|null,flush?:()=>Promise<boolean>)=>void;onCreateCustom?:(input:CustomExerciseInput)=>Promise<Exercise|null>};
export default function WorkoutEditor({state,value,busy,run,confirm,history=false,onDraft,onCreateCustom}:Props){
 const [draft,setDraft]=useState(clone(value)),[dirty,setDirty]=useState(false),[activeId,setActiveId]=useState<string|null>(value.exercises[0]?.id||null),[picker,setPicker]=useState<string|null>(null),[tick,setTick]=useState(()=>Date.now());
 const [saveError,setSaveError]=useState(''),[skipTarget,setSkipTarget]=useState<string|null>(null),[nextSetId,setNextSetId]=useState<string|null>(null),[exerciseMenuId,setExerciseMenuId]=useState<string|null>(null);
 const dirtyRef=useRef(false),draftRef=useRef(draft),editVersion=useRef(0),savedVersion=useRef(0),inFlight=useRef<Promise<boolean>|null>(null),syncedValue=useRef(value),selectAdded=useRef<string|null>(null),root=useRef<HTMLDivElement>(null);
 const [saving,setSaving]=useState(false);
 const invalidSets=hasInvalidActualSets(draft.exercises);
 useEffect(()=>{
  if(!exerciseMenuId)return;
  const dismiss=(e:MouseEvent)=>{if(!(e.target instanceof HTMLElement)||!e.target.closest('[data-exercise-menu]'))setExerciseMenuId(null)};
  document.addEventListener('click',dismiss);
  return()=>document.removeEventListener('click',dismiss);
 },[exerciseMenuId]);
 useEffect(()=>{
  const structureChanged=!history&&(value.exercises.length!==draftRef.current.exercises.length||!value.exercises.every((e,i)=>e.id===draftRef.current.exercises[i]?.id));
  if((history&&syncedValue.current!==value)||(!history&&!dirtyRef.current&&!inFlight.current)||structureChanged){
   draftRef.current=clone(value);setDraft(draftRef.current);if(history){dirtyRef.current=false;setDirty(false)}
   if(selectAdded.current){const added=value.exercises.filter(e=>e.exerciseId===selectAdded.current).at(-1);if(added)setActiveId(added.id);selectAdded.current=null}
   else if(!value.exercises.some(e=>e.id===activeId)){setActiveId(value.exercises[0]?.id||null)}
  }else if(!history&&value.id===draftRef.current.id&&syncedValue.current!==value){
   // Server-owned rest state can change without replacing newer local set input.
   draftRef.current={...draftRef.current,timerEnd:value.timerEnd,timerId:value.timerId,timerSource:value.timerSource};setDraft(draftRef.current);
  }syncedValue.current=value;
 },[value,dirty,saving,history,activeId]);
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
 const pendingSet=exercise?(exercise.sets.find(set=>set.id===nextSetId&&!set.done&&!set.skipped)||nextPendingSet(exercise)):undefined;
 function navigate(index:number){setActiveId(draftRef.current.exercises[index]?.id||null);setPicker(null);setNextSetId(null);if(!history)void persist()}
 async function completeSet(index:number,checked:boolean){
  const completionControl=document.activeElement;
  const next=structuredClone(draftRef.current),e=next.exercises[active];e.sets[index].done=checked;if(!checked)e.sets[index].skipped=false;
  if(!history){
   closeRestNotifications();
   const advances=checked&&completionAdvances(e,index);
   if(checked&&advances){
    const hasRemainingInExercise=e.sets.some((s,i)=>i!==index&&!s.done&&!s.skipped);
    const hasRemainingInWorkout=next.exercises.some((other:any)=>other.id!==e.id&&other.sets.some((s:any)=>!s.done&&!s.skipped));
    const isUnscheduled=!(next as Session).occurrence;
    if(hasRemainingInExercise||hasRemainingInWorkout||isUnscheduled){
     const restSec=setPrescription(e,e.sets[index])?.restSeconds??state.settings.defaultRest;
     const now=Date.now();
     (next as Session).timerEnd=now+restSec*1000;
     (next as Session).timerSource={exerciseId:e.id,setId:e.sets[index].id};
     (next as Session).timerId=`${e.id}:${e.sets[index].id}:${now}`;
    }else{
     (next as Session).timerEnd=null;
     (next as Session).timerSource=null;
     (next as Session).timerId=null;
    }
   }else if(!checked&&(next as Session).timerSource?.setId===e.sets[index].id&&(next as Session).timerSource?.exerciseId===e.id){
    (next as Session).timerEnd=null;
    (next as Session).timerSource=null;
    (next as Session).timerId=null;
   }
  }
  update(next);
  const advances=!history&&checked&&completionAdvances(e,index),nextPending=advances?nextPendingSet(e):undefined;
  if(advances)setNextSetId(nextPending?.id||null);
  if(!history){if(nextPending)requestAnimationFrame(()=>{if(document.activeElement===document.body||document.activeElement===completionControl)root.current?.querySelector<HTMLInputElement>(`[data-set-id="${nextPending.id}"] input`)?.focus({preventScroll:true})});await persist()}
 }
 async function skipExercise(id:string){
  closeRestNotifications();
  const index=draft.exercises.findIndex(e=>e.id===id),e=draft.exercises[index];setSkipTarget(null);
  if(await execute({type:'skipExercise',id,skipped:true,confirmRemaining:true})){if(index<draft.exercises.length-1)navigate(index+1);toast(`${e.name}: remaining sets skipped`,{action:{label:'Undo',onClick:()=>{void run({type:'skipExercise',id,skipped:false})}}})}
 }
 async function addExercise(e:Exercise){if(!await flush())return;selectAdded.current=e.id;if(!await run({type:'addExercise',exerciseId:e.id}))selectAdded.current=null;setPicker(null)}
 async function handleFinishWorkout(){
  closeRestNotifications();
  if(!await flush())return;
  const counts=plannedWorkStatus(draftRef.current.exercises);
  if(counts.pending>0)confirm('Finish workout?',finishWorkoutMessage(counts),{type:'finishWorkout',confirmIncomplete:true});
  else await run({type:'finishWorkout'});
 }
 const library=exerciseLibrary(state),skipping=draft.exercises.find(e=>e.id===skipTarget);
 return <div className="workout" ref={root} onBlurCapture={saveOnBlur} style={{paddingBottom:!history?(draft.timerEnd!==null&&countdown>0?'260px':'140px'):undefined}}>
  {!history&&<div className="active-workout-topbar sticky top-[calc(8px+env(safe-area-inset-top,0px))] z-30 px-4 py-3.5 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/80 dark:border-white/15 rounded-2xl flex items-center justify-between gap-3 shadow-[0_8px_30px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.1)] mb-4">
   <div className="min-w-0 flex-1">
    <h2 className="text-base sm:text-lg font-bold truncate leading-tight text-slate-900 dark:text-white">{draft.name}</h2>
   </div>
   <div className="workout-session-controls shrink-0 inline-flex m-0 p-0">
    <span className="workout-total-timer inline-flex items-center gap-2 text-sm sm:text-base font-bold font-mono tracking-tight" role="timer" aria-label="Total workout time" aria-live="off">
     <span aria-hidden="true">⏱</span>
     <span>{workoutDuration(draft.startedAt,tick)}</span>
    </span>
   </div>
  </div>}
  {history?<div className="row between wrap"><div><p className="eyebrow">WORKOUT LOG</p><h2>{draft.name}</h2><p className="muted">{dateLabel(draft.date,{weekday:'long',day:'numeric',month:'long'})} · {draft.occurrence?'Scheduled':'Unscheduled'}</p></div><div className="row tight workout-header-controls"><span className="badge workout-save-status" data-save-state={saveError?'error':saving?'saving':invalidSets||dirty?'unsaved':'saved'} role="status">{saveError?'Not saved':saving?'Saving…':invalidSets||dirty?'Unsaved changes':'Saved log'}</span></div></div>:<div className="row between wrap mt-3"><div><p className="muted text-sm">{dateLabel(draft.date,{weekday:'long',day:'numeric',month:'long'})} · {draft.occurrence?'Scheduled':'Unscheduled'}</p></div><div className="row tight workout-header-controls"><span className="badge workout-save-status" data-save-state={saveError?'error':saving?'saving':invalidSets||dirty?'unsaved':'saved'} role="status">{saveError?'Not saved':saving?'Saving…':invalidSets||dirty?'Unsaved changes':'Progress saved'}</span></div></div>}
  {draft.occurrence?.day.notes&&<p className="planned-workout-notes">Workout plan: {draft.occurrence.day.notes}</p>}
  {invalidSets&&<p className="set-validation-error" role="alert">Fix the highlighted set values to save your changes.</p>}
  {saveError&&<div className="workout-save-error" role="alert"><span>{saveError}</span><button type="button" className="secondary" disabled={busy||saving} onClick={()=>persist()}>Retry</button></div>}
  {planned>0&&<div className="workoutprogress"><div className="row between"><span>{done} of {planned} planned sets completed</span><span>{Math.round(done/planned*100)}%</span></div><Progress value={done/planned*100}/></div>}
  <fieldset disabled={busy}>
   <div className="exercise-nav">{draft.exercises.map((e,i)=><button className={active===i?'selected':''} key={e.id} type="button" onClick={()=>navigate(i)}><span className="exnumber">{i+1}</span><span>{e.name}</span>{exerciseStatus(e)==='COMPLETED'?<Check size={16}/>:e.skipped?<SkipForward size={16}/>:null}</button>)}</div>
   {exercise?<section className="exercisework">
    <div className="row between wrap workout-exercise-heading relative" data-exercise-menu>
     <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
       <h3 className="truncate">{exercise.name}</h3>
       {!history&&<div className="relative">
        <button
         type="button"
         className="iconbtn text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
         aria-label="Exercise options"
         aria-haspopup="true"
         aria-expanded={exerciseMenuId===exercise.id}
         onClick={()=>setExerciseMenuId(exerciseMenuId===exercise.id?null:exercise.id)}
        >
         <MoreVertical size={16}/>
        </button>
        {exerciseMenuId===exercise.id&&<div className="absolute left-0 sm:left-auto sm:right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-20 text-sm" role="menu">
         <button
          type="button"
          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
          role="menuitem"
          aria-label="Swap exercise"
          onClick={()=>{setPicker(picker===exercise.id?null:exercise.id);setExerciseMenuId(null)}}
         >
          <ArrowLeftRight size={16}/><span>Swap</span>
         </button>
         <button
          type="button"
          className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
          role="menuitem"
          disabled={!exercise.skipped&&!exercise.sets.some(s=>!s.done)}
          onClick={()=>{setExerciseMenuId(null);if(exercise.skipped)execute({type:'skipExercise',id:exercise.id,skipped:false});else if(exercise.sets.some(s=>s.done))setSkipTarget(exercise.id);else skipExercise(exercise.id)}}
         >
          <SkipForward size={16}/><span>{exercise.skipped?'Restore exercise':'Skip exercise'}</span>
         </button>
         {!exercise.planned&&<button
          type="button"
          className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-rose-600 font-medium cursor-pointer"
          role="menuitem"
          onClick={()=>{setExerciseMenuId(null);execute({type:'removeExtra',id:exercise.id})}}
         >
          <Trash2 size={16}/><span>Remove exercise</span>
         </button>}
        </div>}
       </div>}
      </div>
      {exercise.planned?<p className="muted">Planned: {exercise.planned.name} · {prescriptionSummary(exercise.planned,state.settings.unit)}</p>:<p className="muted">Additional exercise</p>}
      {exercise.planned?.notes&&<p className="muted planned-exercise-notes">Program note: {exercise.planned.notes}</p>}
      {exercise.planned?.groupId&&<p className="muted">Superset {exercise.planned.groupId}{exercise.planned.groupOrder?` · Position ${exercise.planned.groupOrder}`:''}</p>}
      <span className="exercise-state">{exerciseStatus(exercise).replaceAll('_',' ').toLowerCase()}</span>
     </div>
    </div>
    {picker===exercise.id&&<div className="inset rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-4">
     <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
      <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-100">
       <ArrowLeftRight size={16} className="text-blue-500 shrink-0"/>
       <span>Swap “{exercise.name}”</span>
      </div>
      <button
       type="button"
       className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
       onClick={()=>setPicker(null)}
      >
       ✕ Close
      </button>
     </div>
     <div>
      <div className="flex items-center justify-between mb-2">
       <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Swap with exercise in today’s program
       </span>
      </div>
      {draft.exercises.filter(e=>e.id!==exercise.id).length>0?(
       <div className="flex flex-col gap-2">
        {draft.exercises.filter(e=>e.id!==exercise.id).map(other=>{
         const otherIdx=draft.exercises.findIndex(e=>e.id===other.id)+1;
         return (
          <button
           type="button"
           key={other.id}
           className="w-full text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
           onClick={async()=>{
            const targetId=other.id;
            const ok=await execute({type:'swap',id:exercise.id,targetId});
            if(ok){
             setActiveId(targetId);
             setPicker(null);
             toast(`Swapped “${exercise.name}” with “${other.name}”`);
            }
           }}
          >
           <div className="min-w-0 flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
             #{otherIdx}
            </span>
            <div className="min-w-0">
             <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {other.name}
             </div>
             <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {other.sets.length} sets {other.planned?'· Planned':'· Extra'} · {exerciseStatus(other).replaceAll('_',' ').toLowerCase()}
             </div>
            </div>
           </div>
           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
            <ArrowLeftRight size={13}/>
            <span>Swap order</span>
           </span>
          </button>
         );
        })}
       </div>
      ):(
       <p className="text-xs text-slate-500 dark:text-slate-400 py-1">
        No other exercises in today’s program to swap with.
       </p>
      )}
     </div>
     <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
      <div className="mb-2">
       <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Or substitute from catalog
       </span>
       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        The original planned exercise targets and set count stay attached.
       </p>
      </div>
      <ExercisePicker
       exercises={library}
       onCreate={onCreateCustom}
       onPick={async e=>{
        await execute({type:'swap',id:exercise.id,exerciseId:e.id});
        setPicker(null);
       }}
      />
     </div>
    </div>}
    {prev&&<div className="previous"><span className="eyebrow">LAST TIME · {dateLabel(previous!.date)}</span><p>{prev.sets.filter(s=>s.done).map(s=>`${Math.round(s.weight!*multiplier*10)/10} ${state.settings.unit} × ${s.reps}`).join('   /   ')||'No performed sets'}</p></div>}
    {exercise.skipped&&<p className="skipped-exercise-message">Remaining sets are skipped. Completed sets and entered values are kept.</p>}
    <div className="sets"><div className="setrow setheading"><span>Set</span><span>Weight ({state.settings.unit})</span><span>Reps</span><span>Done</span></div>{exercise.sets.map((set,i)=>{const skipped=!set.done&&!!set.skipped,errors=actualSetErrors(set),errorId=`workout-${draft.id}-${set.id}`,target=setPrescription(exercise,set);const isPending=!history&&!set.done&&!skipped&&set.id===pendingSet?.id;return <div className={'setrow '+(set.done?'setdone ':skipped?'setskipped ':isPending?'setnext pending-set-row ':'')} key={set.id} data-set-id={set.id}>
     <div className="flex items-center justify-center gap-1 font-bold">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition-colors ${set.done?'bg-blue-600 text-white shadow-xs':skipped?'line-through text-slate-400 bg-slate-100 dark:bg-slate-800':isPending?'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold ring-1 ring-blue-500/40':'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200'}`}>{i+1}</span>
      {!history&&!set.planned&&<button type="button" className="iconbtn danger remove-extra-set" aria-label={`Remove extra set ${i+1}`} disabled={set.done} onClick={()=>execute({type:'removeSet',exerciseId:exercise.id,setId:set.id})}><Trash2 size={13}/></button>}
     </div>
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
   {history?<div className="formfooter"><p className="muted">Corrections update actual results. The original plan remains preserved.</p><button type="button" className="primary" disabled={!dirty||invalidSets} onClick={()=>confirm('Save historical correction?','This explicitly updates your recorded set results and recalculates completion status.',saveAction(draftRef.current))}><Save size={16}/>Save correction</button></div>:<div className="formfooter"><button type="button" className="textbtn danger" onClick={()=>confirm('Discard workout?','Your progress from this workout will be removed.',{type:'discardWorkout',confirmed:true})}><Trash2 size={16}/>Discard workout</button><button type="button" className="primary" onClick={handleFinishWorkout}><Check size={16}/>Finish workout</button></div>}
  </fieldset>
  {!history&&draft.timerEnd!==null&&countdown>0&&<div className="floating-rest-timer-bar" role="timer" aria-label="Workout rest timer" aria-live="polite">
   {/* Line 1: Centered Clock Icon and bold countdown digits with generous spacing */}
   <div className="flex flex-col items-center justify-center w-full py-0.5">
    <div className="flex items-center justify-center gap-2.5">
     <Timer size={22} className="text-blue-600 dark:text-blue-400 shrink-0" />
     <b className="timerdigits font-mono text-3xl sm:text-4xl font-black tracking-tight text-blue-600 dark:text-blue-400 leading-none">
      {String(Math.floor(countdown/60)).padStart(2,'0')}:{String(countdown%60).padStart(2,'0')}
     </b>
    </div>
    {exercise&&exercise.sets.every(s=>s.done||s.skipped)&&(!draft.occurrence||draft.exercises.some(other=>other.id!==exercise.id&&other.sets.some(s=>!s.done&&!s.skipped)))&&<span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase mt-1">Rest before next exercise</span>}
   </div>
   {/* Line 2: Quick -15s and +15s adjustments */}
   <div className="flex items-center justify-between gap-3 w-full">
    <button
     type="button"
     className="timer-pill-btn flex-1 min-h-[44px] cursor-pointer"
     onClick={()=>execute({type:'timer',adjust:-15})}
     title="Subtract 15 seconds"
    >
     -15s
    </button>
    <button
     type="button"
     className="timer-pill-btn flex-1 min-h-[44px] cursor-pointer"
     onClick={()=>execute({type:'timer',adjust:15})}
     title="Add 15 seconds"
    >
     +15s
    </button>
   </div>
   {/* Line 3: Full-width skip rest action */}
   <button
    type="button"
    className="timer-skip-btn w-full min-h-[44px] cursor-pointer"
    onClick={()=>{
     closeRestNotifications();
     change(d=>{d.timerEnd=null;d.timerId=null;d.timerSource=null});
     void execute({type:'timer',seconds:null});
    }}
   >
    <SkipForward size={16} />
    <span>Skip rest</span>
   </button>
  </div>}
  <AlertDialog open={!!skipTarget} onOpenChange={open=>{if(!open)setSkipTarget(null)}}><AlertDialogContent><AlertDialogTitle>Skip remaining sets?</AlertDialogTitle><AlertDialogDescription>{skipping?.sets.filter(s=>s.done).length||0} completed sets will still be saved. Remaining sets will be skipped for this workout only.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><button type="button" className="primary" disabled={busy} onClick={()=>skipTarget&&skipExercise(skipTarget)}>Skip remaining</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>;
}
