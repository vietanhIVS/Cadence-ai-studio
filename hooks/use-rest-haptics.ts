"use client";
import {useEffect,useRef} from 'react';

export function useRestHaptics(sessionId:string,periodId:string|null,remaining:number,enabled:boolean){
 const handled=useRef(new Map<string,{ten?:boolean;zero?:boolean}>());
 useEffect(()=>{
  if(!enabled||!periodId||remaining>10)return;
  const key=`cadence:rest-haptics:${sessionId}:${periodId}`;
  let flags=handled.current.get(key);
  if(!flags){try{flags=JSON.parse(sessionStorage.getItem(key)||'{}')}catch{flags={}}}
  flags??={};
  if(remaining>0&&!flags.ten){flags.ten=true;navigator.vibrate?.(25)}
  if(remaining===0&&!flags.zero){flags.zero=true;navigator.vibrate?.([80,40,120])}
  handled.current.set(key,flags);
  try{sessionStorage.setItem(key,JSON.stringify(flags))}catch{/* Haptics still work when storage is unavailable. */}
 },[sessionId,periodId,remaining,enabled]);
}
