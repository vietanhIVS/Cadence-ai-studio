"use client";
import {PartyPopper,Check,X} from 'lucide-react';
import type {WorkoutAcknowledgement} from '@/lib/workout-acknowledgement';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';

export default function SchedulePostWorkout({acknowledgement:ack,onDismiss}:{acknowledgement:WorkoutAcknowledgement;onDismiss:()=>void}){
 if(ack.kind!=='saved')return <Dialog open onOpenChange={open=>{if(!open)onDismiss()}}><DialogContent className="workout-acknowledgement-modal liquid-glass-modal" overlayClassName="workout-acknowledgement-overlay modal-overlay" showCloseButton={false}>
  <button type="button" className="iconbtn frosted-close-btn" aria-label="Dismiss workout acknowledgement" onClick={onDismiss}><X size={20}/></button>
  <span className="celebration-icon" aria-hidden="true"><span className="celebration-ambient-glow"/><PartyPopper size={46}/></span>
  <DialogTitle>{ack.title}</DialogTitle><DialogDescription>{ack.message}</DialogDescription>
  {ack.next&&<p className="tinted-blue-pill">Next: {ack.next}</p>}
 </DialogContent></Dialog>;
 return <section className={`schedule-post-workout schedule-acknowledgement${ack.kind==='saved'?'':' liquid-glass-modal'}`} data-kind={ack.kind} aria-label="Workout acknowledgement">
  <span className="schedule-acknowledgement-icon" aria-hidden="true">{ack.kind==='saved'?<Check size={22}/>:<><span className="celebration-ambient-glow"/><PartyPopper size={24}/></>}</span>
  <div className="schedule-acknowledgement-copy" role="status"><h2>{ack.title}</h2>{ack.message&&<p>{ack.message}</p>}{ack.next&&<p className={`schedule-acknowledgement-next${ack.kind==='saved'?'':' tinted-blue-pill'}`}>Next: {ack.next}</p>}</div>
  <button type="button" className="iconbtn frosted-close-btn" aria-label="Dismiss workout acknowledgement" onClick={onDismiss}><X size={20}/></button>
 </section>;
}
