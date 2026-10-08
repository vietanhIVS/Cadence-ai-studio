"use client";
import {useState,useSyncExternalStore} from 'react';
import Image from 'next/image';

const motionQuery='(prefers-reduced-motion: reduce)';
function subscribe(onChange:()=>void){const query=window.matchMedia(motionQuery);query.addEventListener('change',onChange);return()=>query.removeEventListener('change',onChange)}
const reducedMotion=()=>window.matchMedia(motionQuery).matches;
const serverMotion=()=>true;

export default function LoadingScreen(){
 const reduced=useSyncExternalStore(subscribe,reducedMotion,serverMotion);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false);
 return <main className="loading-screen" role="status" aria-live="polite" aria-busy="true">
  <span className="sr-only">Loading Cadence. Opening your training…</span>
  {(!ready||failed||reduced)&&<div className="loading-still" aria-hidden="true"><Image src="/cadence-mark.png" alt="" width={96} height={96} unoptimized/><b>Cadence</b><p>Opening your training…</p></div>}
  {!reduced&&!failed&&<video className={ready?'loading-video is-ready':'loading-video'} src="/cadence-loading.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1} onLoadedData={()=>setReady(true)} onError={()=>setFailed(true)}/>}
 </main>;
}
