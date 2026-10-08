"use client";
import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';

type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'type'> & {value:number|null;onValue:(value:number|null)=>void;min:number;max:number};

/** Keep the user's exact text and caret while editing, including decimal prefixes. */
export default function WorkoutSetInput({value,onValue,min,max,inputMode,...props}:Props){
 const focused=useRef(false),[text,setText]=useState(()=>value===null?'':String(value));
 useEffect(()=>{if(!focused.current)setText(value===null?'':String(value))},[value]);
 function edit(next:string){setText(next);onValue(next.trim()===''?null:Number(next))}
 return <input {...props} type="text" role="spinbutton" inputMode={inputMode} autoComplete="off" value={text} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value!==null&&Number.isFinite(value)?value:undefined} data-workout-set-input="" onFocus={()=>{focused.current=true}} onBlur={()=>{focused.current=false;if(text.trim()!==''&&Number.isFinite(Number(text)))setText(String(Number(text)))}} onChange={e=>edit(e.target.value)} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();const current=Number.isFinite(Number(text))?Number(text):min;edit(String(Math.min(max,Math.max(min,current+(e.key==='ArrowUp'?1:-1)))))}}}/>;
}
