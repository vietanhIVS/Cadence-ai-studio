"use client";
import {Dumbbell,Plus} from 'lucide-react';
import {Program,State,workoutDays} from '@/lib/cadence';
import {cardLabel} from '@/lib/display-label';
import {CycleStrip} from './training-controls';

export default function ProgramChooser({state,busy,onSelect,onCreate,onlyPresets=false}:{state:State;busy:boolean;onSelect:(p:Program)=>void|Promise<void>;onCreate?:()=>void;onlyPresets?:boolean}){
 const own=state.programs.filter(p=>!p.preset&&!p.archived),presets=state.programs.filter(p=>p.preset);
 const cards=(programs:Program[])=> <div className="programgrid">{programs.map(p=>{const days=workoutDays(p.versions.at(-1)!.days);return <section className="panel programcard" key={p.id}><div className="row between"><div className="programicon"><Dumbbell/></div>{p.preset&&<span className="badge">Preset program</span>}</div><h3 title={p.name} aria-label={p.name}>{cardLabel(p.name,30)}</h3><p className="muted">{p.description}</p><CycleStrip days={days} labelLimit={10}/><p className="muted">{days.length} workouts per cycle</p><button className="primary" disabled={busy} onClick={()=>onSelect(p)}>{p.preset?'Choose preset':'Choose program'}</button></section>})}</div>;
 return <div>{onCreate&&<div className="row between sectionline"><p className="muted">Start with a preset or build your own cycle.</p><button className="secondary" disabled={busy} onClick={onCreate}><Plus size={18}/>Create program</button></div>}{!onlyPresets&&own.length>0&&<><h3 className="previewtitle">Your programs</h3>{cards(own)}</>}<h3 className="previewtitle">Preset programs</h3><p className="muted">Choosing a preset saves your own copy. You can customize it from Programs.</p>{cards(presets)}</div>;
}
