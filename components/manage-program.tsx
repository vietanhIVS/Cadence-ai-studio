"use client";
import {useState} from 'react';
import {currentProgram,getVersion,workoutDays,type State} from '@/lib/cadence';
import {Choice,Field,CycleStrip} from './training-controls';

export default function ManageProgram({state,today,kind,initialProgramId,initialVersionId,busy,run,onDone}:{state:State;today:string;kind:string;initialProgramId?:string;initialVersionId?:string;busy:boolean;run:(action:Record<string,unknown>)=>Promise<boolean>;onDone:()=>void}){
 const current=currentProgram(state,today),creating=kind==='create';
 const available=state.programs.filter(p=>!p.archived&&!p.preset);
 const [pid,setPid]=useState(initialProgramId||current.program?.id||available[0]?.id||'');
 const initial=state.programs.find(p=>p.id===pid);
 const preferred=initial?.versions.find(v=>v.id===initialVersionId&&(creating||v.id!==current.version?.id||pid!==current.program?.id));
 const [vid,setVid]=useState(preferred?.id||[...(initial?.versions||[])].reverse().find(v=>creating||v.id!==current.version?.id||pid!==current.program?.id)?.id||''),[startIndex,setStartIndex]=useState(0);
 const {program,version}=getVersion(state,pid,vid),versions=(program?.versions||[]).filter(v=>creating||pid!==current.program?.id||v.id!==current.version?.id),queued=current.cursor?.queued;
 const next=queued?getVersion(state,queued.programId,queued.versionId):null;
 async function apply(mode:'NOW'|'AFTER_CYCLE'){if(await run({type:creating?'createSchedule':'applyVersion',programId:pid,versionId:vid,mode,startIndex}))onDone()}
 return <div className="manage-program">
  {!creating&&<><section className="manage-program-section"><h3>Current program</h3><b>{current.program?.name}</b><p className="muted">Version {current.version?.number}</p></section><section className="manage-program-section"><h3>Current progress</h3><b>Workout {(current.cursor?.index||0)+1} of {current.workouts.length} · {current.workouts[current.cursor?.index||0]?.name}</b><p className="muted">Cycle {current.cursor?.cycleNumber}</p></section></>}
  {queued?<section className="manage-program-section queued-version" aria-label="Queued version"><h3>Next version</h3><b>{next?.program?.name} · Version {next?.version?.number}</b><p className="muted">Applies after current cycle</p><button type="button" className="secondary" disabled={busy} onClick={()=>run({type:'cancelFuture'})}>Cancel version change</button></section>:<fieldset disabled={busy}>
   <section className="manage-program-section"><h3>{creating?'Your program':'Program version'}</h3>{(creating||available.length>1)&&<Field label="Program"><Choice label="Program" value={pid} onChange={id=>{setPid(id);setStartIndex(0);setVid([...state.programs.find(p=>p.id===id)!.versions].reverse().find(v=>creating||id!==current.program?.id||v.id!==current.version?.id)?.id||'')}} options={available.map(p=>({value:p.id,label:p.name}))}/></Field>}
   {versions.length>0?<><Field label={creating?'Program version':'Available version'}><Choice label="Program version" value={vid} onChange={id=>{setVid(id);setStartIndex(0)}} options={versions.map(v=>({value:v.id,label:`Version ${v.number}`}))}/></Field>{version&&<><CycleStrip days={workoutDays(version.days)}/><p className="muted">{workoutDays(version.days).length} workouts · Repeat at your own pace.</p><fieldset className="start-position-picker"><legend>Start from</legend><p className="muted">Choose where you are in the cycle.</p>{workoutDays(version.days).map((day,index)=><label key={`${index}-${day.name}`}><input type="radio" name="initial-cycle-position" checked={startIndex===index} onChange={()=>setStartIndex(index)}/><span>Day {index+1} · {day.name}</span></label>)}</fieldset></>}
   <div className="manage-program-actions"><button type="button" className="primary" disabled={!version||(!creating&&!!state.session)} onClick={()=>apply('NOW')}>{creating?'Start program':'Apply now'}</button>{!creating&&<button type="button" className="secondary" disabled={!version} onClick={()=>apply('AFTER_CYCLE')}>Apply after current cycle</button>}</div>{!creating&&<p className="muted">{state.session?'Finish or discard the active workout to apply now. You can queue a version for after this cycle.':'Apply now restarts at Workout 1. After current cycle keeps your place until this cycle ends.'}</p>}</>:<p className="muted">You’re using the latest available version. Edit your program to create another version.</p>}
   </section>
  </fieldset>}
  <div className="manage-program-close"><button type="button" className="secondary" disabled={busy} onClick={onDone}>Close</button></div>
 </div>;
}
