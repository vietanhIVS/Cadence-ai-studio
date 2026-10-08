"use client";
import {useState,type CSSProperties} from 'react';
import {Plus,Dumbbell,Moon,Check,ArrowRight,ArrowUp,ArrowDown,Repeat2} from 'lucide-react';
import {Program,CycleDay,clone,uid,Exercise,CustomExerciseInput,CYCLE_LENGTHS,workoutDays} from '@/lib/cadence';
import {Choice,ExercisePicker,Field} from './training-controls';
import ExercisePrescriptionCard from './exercise-prescription-card';
import {normalizePlan,prescriptionError,type WeightUnit} from '@/lib/prescription';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {AlertDialog,AlertDialogContent,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';

type ProgramSave={type:'saveProgram';id?:string;name:string;description:string;days:CycleDay[]};
type Props={exercises?:Exercise[];onCreateCustom?:(input:CustomExerciseInput)=>Promise<Exercise|null>;program?:Program;unit?:WeightUnit;defaultRest?:number;busy:boolean;context?:'standalone'|'onboarding';cycleLocked?:boolean;onCancel:()=>void;onSave:(data:ProgramSave)=>Promise<boolean>};
const emptyDay=():CycleDay=>({type:'WORKOUT',name:'',exercises:[]});
const hasWorkoutData=(day:CycleDay,i:number)=>day.exercises.length>0||!!day.notes?.trim()||!['','Rest',`Workout ${i+1}`].includes(day.name.trim());

export default function ProgramEditor({exercises,onCreateCustom,program,unit='kg',defaultRest=90,busy,context='standalone',cycleLocked=false,onCancel,onSave}:Props){
 const [name,setName]=useState(program?.name||''),[description,setDescription]=useState(program?.description||'');
 const [days,setDays]=useState<CycleDay[]>(()=>clone(program?workoutDays(program.versions.at(-1)!.days):Array.from({length:3},(_,i):CycleDay=>({type:'WORKOUT',name:`Workout ${i+1}`,exercises:[]}))).map(day=>({...day,exercises:day.exercises.map((exercise,i)=>normalizePlan(exercise,i+1,unit))})));
 const [selected,setSelected]=useState('0'),[adding,setAdding]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState<string|null>(null);
 const [pendingLength,setPendingLength]=useState<number|null>(null);
 const onboarding=context==='onboarding',saveLabel=onboarding?'Save & continue':program?'Save new version':'Create program';
 function update(i:number,patch:Partial<CycleDay>){setDays(current=>current.map((day,n)=>n===i?{...day,...patch}:day));setError('')}
 function selectDay(value:string){setSelected(value);setExpanded(null);setAdding(false);setError('')}
 function resize(length:number){setDays(current=>Array.from({length},(_,i)=>current[i]||{...emptyDay(),name:`Workout ${i+1}`}));if(Number(selected)>=length)setSelected('0');setAdding(false);setExpanded(null);setPendingLength(null);setError('')}
 function changeLength(length:number){if(length<days.length&&days.some((day,i)=>i>=length&&hasWorkoutData(day,i)))setPendingLength(length);else resize(length)}
 function add(i:number,e:Exercise){const id=uid();update(i,{exercises:[...days[i].exercises,normalizePlan({id,exerciseId:e.id,name:e.name,sets:3,repMin:8,repMax:12,weightUnit:unit,rest:defaultRest},days[i].exercises.length+1,unit)]});setExpanded(id);setAdding(false)}
 function reorder(i:number,j:number,to:number){const exercises=[...days[i].exercises];[exercises[j],exercises[to]]=[exercises[to],exercises[j]];update(i,{exercises})}
 function moveWorkout(i:number,offset:number){if(cycleLocked||i+offset<0||i+offset>=days.length)return;setDays(current=>{const next=[...current];[next[i],next[i+offset]]=[next[i+offset],next[i]];return next});setSelected(String(i+offset));setError('')}
 function validate(){
  if(!name.trim()){setError('Enter a program name.');return false}
  if(!days.some(day=>day.type==='WORKOUT')){setError('Add at least one workout day to your cycle.');return false}
  for(let i=0;i<days.length;i++){
   const day=days[i];if(day.type==='REST')continue;let message='';
   if(!day.name.trim())message=`Enter a workout name for Workout ${i+1}.`;
   else if(!day.exercises.length)message=`Add at least one exercise to Workout ${i+1}.`;
   else {const invalid=day.exercises.find(exercise=>prescriptionError(exercise));if(invalid){message=`Workout ${i+1}, ${invalid.name}: ${prescriptionError(invalid)}`;setExpanded(invalid.id)}}
   if(message){setSelected(String(i));setAdding(!day.exercises.length);setError(message);return false}
  }return true;
 }
 async function save(){await onSave({type:'saveProgram',id:program?.id,name:name.trim(),description,days:days.map(day=>({...clone(day),type:'WORKOUT',name:day.name.trim()}))})}
 return <form className="program-editor" noValidate onSubmit={async e=>{e.preventDefault();if(busy||!validate())return;await save()}}>
  <fieldset disabled={busy}>
   <div className="program-editor-scroll"><div className="program-editor-layout">
    <div className="program-editor-main">
     <div className="row program-details"><Field label="Program name"><input required maxLength={120} value={name} onChange={e=>{setName(e.target.value);setError('')}} placeholder="My training program"/></Field><Field label="Cycle length"><Choice label="Cycle length" value={String(days.length)} onChange={value=>changeLength(Number(value))} options={CYCLE_LENGTHS.map(length=>({value:String(length),label:`${length} workouts`}))}/></Field></div>
     <h3 className="editor-section-title">Workouts in cycle</h3>
     <Tabs value={selected} onValueChange={selectDay}>
      <TabsList className="program-cycle-tabs" style={{'--cycle-count':days.length} as CSSProperties} aria-label="Workouts in cycle">{days.map((day,i)=><TabsTrigger key={i} value={String(i)} aria-label={`Workout ${i+1}: ${day.name||'Workout'}`}><span className="cycle-tab-number">{String(i)===selected&&<Check size={13} aria-hidden="true"/>}Workout {i+1}</span><span className="cycle-tab-name">{<Dumbbell size={14} aria-hidden="true"/>}<span>{day.type==='REST'?'Rest':day.name||'Workout'}</span></span></TabsTrigger>)}</TabsList>
      {days.map((day,i)=><TabsContent key={i} value={String(i)}>
       <div className="row workout-order-controls"><Field label="Workout name"><input required maxLength={120} value={day.name} onChange={e=>update(i,{name:e.target.value})}/></Field><div className="row"><button type="button" className="secondary" aria-label={`Move Workout ${i+1} up`} disabled={cycleLocked||i===0} onClick={()=>moveWorkout(i,-1)}><ArrowUp size={16}/><span>Move up</span></button><button type="button" className="secondary" aria-label={`Move Workout ${i+1} down`} disabled={cycleLocked||i===days.length-1} onClick={()=>moveWorkout(i,1)}><ArrowDown size={16}/><span>Move down</span></button></div></div>{cycleLocked&&<p className="muted">This program is currently in use. Use Change workout to adjust your cycle position. Workout order cannot change until it is inactive.</p>}
       <h3 className="editor-section-title">Exercises</h3>{!day.exercises.length&&<p className="muted editor-empty">Add an exercise to build this workout.</p>}
        <Field label="Workout plan notes (optional)"><textarea rows={2} maxLength={4000} value={day.notes||''} placeholder="Warmup, estimated duration, or cues for this workout" onChange={e=>update(i,{notes:e.target.value})}/></Field>
        <ol className="program-exercise-list">{day.exercises.map((exercise,j)=><li key={exercise.id}>
         <ExercisePrescriptionCard exercise={exercise} order={j+1} total={day.exercises.length} open={expanded===exercise.id} onOpenChange={open=>setExpanded(open?exercise.id:null)} onChange={patch=>update(i,{exercises:day.exercises.map(x=>x.id===exercise.id?{...x,...patch}:x)})} onMove={offset=>reorder(i,j,j+offset)} onRemove={()=>{update(i,{exercises:day.exercises.filter(x=>x.id!==exercise.id)});setExpanded(null)}}/>
        </li>)}</ol>
        <button type="button" className="secondary add-program-exercise" aria-expanded={adding} disabled={day.exercises.length>=30} onClick={()=>setAdding(!adding)}><Plus size={18}/>{adding?'Close exercise search':'Add exercise'}</button>
        {adding&&<div className="program-exercise-picker"><ExercisePicker exercises={exercises} onCreate={onCreateCustom} onPick={e=>add(i,e)} labeledFilters/></div>}
      </TabsContent>)}
     </Tabs>
     <Field label="Description (optional)"><textarea maxLength={500} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Training goals or a short description" rows={2}/></Field>
    </div>
    <aside className="program-cycle-summary" aria-label="Cycle summary"><p className="eyebrow">YOUR CYCLE</p><h3>{days.length} workouts, then repeat</h3><ol>{days.map((day,i)=><li key={i}><button type="button" aria-label={`Edit Workout ${i+1}`} aria-current={String(i)===selected?'step':undefined} onClick={()=>selectDay(String(i))}><span className="summary-day">{String(i)===selected?<Check size={14} aria-hidden="true"/>:i+1}</span><span><b>Workout {i+1} · {day.type==='REST'?'Rest':day.name||'Workout'}</b><small>{`${day.exercises.length} ${day.exercises.length===1?'exercise':'exercises'}`}</small></span>{<Dumbbell size={16} aria-hidden="true"/>}</button></li>)}</ol><p className="muted summary-repeat"><Repeat2 size={16} aria-hidden="true"/>Finish each workout to advance. Rest whenever you need.</p></aside>
   </div></div>
   <div className="program-editor-footer">{error&&<p className="editor-error" role="alert">{error}</p>}<div className="program-footer-row"><p className="muted">{onboarding?'You can start this program next.':program?'Saving creates a new version. Apply it from Manage program.':'Start your program when you’re ready.'}</p><div className="row program-footer-actions"><button type="button" className="secondary" onClick={onCancel}>{onboarding?'Back':'Cancel'}</button><button type="submit" className="primary">{saveLabel}{onboarding&&<ArrowRight size={18}/>}</button></div></div></div>
  </fieldset>
  <AlertDialog open={pendingLength!==null} onOpenChange={open=>{if(!open)setPendingLength(null)}}><AlertDialogContent><AlertDialogTitle>Reduce cycle to {pendingLength} workouts?</AlertDialogTitle><AlertDialogDescription>Workout {pendingLength!==null?pendingLength+1:''} through Workout {days.length} will be removed, including their workout details.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><button type="button" className="primary" onClick={()=>{if(pendingLength!==null)resize(pendingLength)}}>Reduce cycle</button></AlertDialogFooter></AlertDialogContent></AlertDialog>

 </form>;
}
