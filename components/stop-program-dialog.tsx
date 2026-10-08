"use client";
import {useRef} from 'react';
import {TriangleAlert} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';

export default function StopProgramDialog({open,body,busy,onClose,onConfirm}:{open:boolean;body:string;busy:boolean;onClose:()=>void;onConfirm:()=>Promise<void>}){
 const cancel=useRef<HTMLButtonElement>(null);
 return <Dialog open={open} onOpenChange={value=>{if(!value&&!busy)onClose()}}>
  <DialogContent role="alertdialog" className="stop-program-dialog" showCloseButton={false} onOpenAutoFocus={event=>{event.preventDefault();cancel.current?.focus()}} onEscapeKeyDown={event=>{if(busy)event.preventDefault()}} onPointerDownOutside={event=>{if(busy)event.preventDefault()}}>
   <span className="stop-dialog-warning" aria-hidden="true"><TriangleAlert size={23}/></span>
   <DialogTitle>Stop program?</DialogTitle>
   <DialogDescription>{body}</DialogDescription>
   <div className="stop-dialog-actions">
    <button ref={cancel} type="button" className="stop-dialog-cancel" disabled={busy} onClick={onClose}>Cancel</button>
    <button type="button" className="stop-dialog-confirm" disabled={busy} onClick={onConfirm}>{busy?'Stopping…':'Stop program'}</button>
   </div>
  </DialogContent>
 </Dialog>;
}
