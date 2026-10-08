"use client";
import {useState} from 'react';
import type {CustomExerciseInput} from '@/lib/cadence';
import {Field} from './training-controls';

export default function CustomExerciseFields({initial,onSave,onCancel,label='Save exercise'}:{initial:CustomExerciseInput;onSave:(input:CustomExerciseInput)=>Promise<boolean>;onCancel:()=>void;label?:string}){
 const [draft,setDraft]=useState(initial),[saving,setSaving]=useState(false),[error,setError]=useState('');
 async function save(){if(!draft.name.trim()){setError('Enter an exercise name.');return}setSaving(true);try{if(!await onSave({...draft,name:draft.name.trim()}))setError('Couldn’t save this exercise. Your details are kept; please try again.')}finally{setSaving(false)}}
 return <div className="custom-exercise-fields" role="group" aria-label="Custom exercise details"><h3>Custom exercise</h3><p className="muted">Save a reusable exercise. Sets, reps, weight and rest belong to its program prescription.</p><fieldset disabled={saving}>
  <Field label="Exercise name"><input maxLength={120} required value={draft.name} onChange={e=>{setDraft({...draft,name:e.target.value});setError('')}}/></Field>
  <div className="row wrap"><Field label="Primary muscle (optional)"><input maxLength={120} value={draft.muscle} onChange={e=>setDraft({...draft,muscle:e.target.value})}/></Field><Field label="Equipment (optional)"><input maxLength={120} value={draft.equipment} onChange={e=>setDraft({...draft,equipment:e.target.value})}/></Field></div>
  <Field label="Exercise library notes (optional)"><textarea rows={2} maxLength={4000} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></Field>
  {error&&<p className="editor-error" role="alert">{error}</p>}<div className="row wrap"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="button" className="primary" onClick={save}>{saving?'Saving…':label}</button></div>
 </fieldset></div>;
}
