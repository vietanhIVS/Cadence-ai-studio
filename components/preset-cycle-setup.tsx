"use client";
import {useState} from 'react';
import type {CycleDay,Program} from '@/lib/cadence';
import {configurePresetCycle,PRESET_CYCLE_OPTIONS} from '@/lib/preset-cycle';

export default function PresetCycleSetup({program,busy,onSave,onCancel}:{program:Program;busy:boolean;onSave:(days:CycleDay[])=>Promise<void>;onCancel:()=>void}){
 const [length,setLength]=useState<number|null>(null);
 return <form className="preset-cycle-setup" onSubmit={async e=>{e.preventDefault();if(length!==null)await onSave(configurePresetCycle(program.versions.at(-1)!.days,length))}}><p>{program.name} includes three workout templates. Choose how they repeat before selecting a start date.</p><fieldset disabled={busy}><legend className="sr-only">Repeating cycle</legend>{PRESET_CYCLE_OPTIONS.map(option=><label key={option.length} className={'preset-cycle-option'+(length===option.length?' selected':'')}><input type="radio" name="preset-cycle" value={option.length} checked={length===option.length} onChange={()=>setLength(option.length)}/><span><b>{option.label}</b><small>{option.detail}</small></span></label>)}</fieldset><p className="muted">You can customize this saved copy in Programs. Choosing a cycle does not start a schedule.</p><div className="formfooter"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cancel</button><button type="submit" className="primary" disabled={busy||length===null}>Save cycle &amp; continue</button></div></form>;
}
