"use client";
import {useState} from 'react';
import type {State,CustomExerciseInput,Exercise} from '@/lib/cadence';
import CustomExerciseFields from './custom-exercise-fields';

export default function PersonalExerciseLibrary({state,busy,run,onCreate}:{state:State;busy:boolean;run:(action:Record<string,unknown>)=>Promise<boolean>;onCreate:(input:CustomExerciseInput)=>Promise<Exercise|null>}){
 const [editing,setEditing]=useState<string|null>(null),[showArchived,setShowArchived]=useState(false),[creating,setCreating]=useState(false);
 const items=(state.customExercises||[]).filter(e=>showArchived||!e.archived);
 return <section className="panel personal-exercise-library"><div className="row between wrap"><div><h2>My exercises</h2><p className="muted">Reusable exercises for your programs and workouts.</p></div><button type="button" className="secondary" disabled={busy} onClick={()=>{setCreating(!creating);setEditing(null)}}>Create custom exercise</button></div>
  <button type="button" className="textbtn" aria-pressed={showArchived} onClick={()=>setShowArchived(!showArchived)}>{showArchived?'Hide archived exercises':'Show archived exercises'}</button>
  {creating&&<CustomExerciseFields initial={{name:'',muscle:'',equipment:'',notes:''}} onCancel={()=>setCreating(false)} onSave={async input=>{if(await onCreate(input)){setCreating(false);return true}return false}}/>}
  {!items.length&&<p className="muted">Your custom exercises will appear here.</p>}
  {items.map(e=><div key={e.id} className="personal-exercise-item"><div className="row between wrap"><div><h3>{e.name}</h3><p className="muted">{[e.muscle,e.equipment,e.archived?'Archived':'Custom'].filter(Boolean).join(' · ')}</p>{e.notes&&<p className="muted planned-exercise-notes">{e.notes}</p>}</div><div className="row wrap"><button type="button" className="secondary small" disabled={busy} aria-label={`Edit custom exercise ${e.name}`} onClick={()=>{setEditing(editing===e.id?null:e.id);setCreating(false)}}>Edit</button><button type="button" className="textbtn" disabled={busy} aria-label={`${e.archived?'Restore':'Archive'} custom exercise ${e.name}`} onClick={async()=>{if(await run({type:'archiveCustomExercise',id:e.id,archived:!e.archived}))setEditing(null)}}>{e.archived?'Restore':'Archive'}</button></div></div>
   {editing===e.id&&<CustomExerciseFields key={e.id} initial={{name:e.name,muscle:e.muscle,equipment:e.equipment,notes:e.notes||''}} label="Save changes" onCancel={()=>setEditing(null)} onSave={async input=>{if(await run({type:'editCustomExercise',id:e.id,...input})){setEditing(null);return true}return false}}/>}
  </div>)}
 </section>;
}
