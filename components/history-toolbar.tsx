import {Plus,SlidersHorizontal} from 'lucide-react';
import type {ReactNode} from 'react';

export default function HistoryToolbar({open,onToggle,onAdd,busy,hasSession,children}:{open:boolean;onToggle:()=>void;onAdd:()=>void;busy:boolean;hasSession:boolean;children:ReactNode}){
 const addLabel=hasSession?'Resume workout':'Start unscheduled workout';
 return <section className="history-filter-panel" aria-label="History controls">
  <div className="history-tools flex items-center gap-3 rounded-full">
   <button type="button" className="history-filter-toggle flex min-w-0 flex-1 items-center gap-2" aria-expanded={open} aria-controls="history-filters" onClick={onToggle}><SlidersHorizontal size={18} aria-hidden="true"/>Search and filter</button>
   <button type="button" className="history-quick-add grid shrink-0 place-items-center" aria-label={addLabel} title={addLabel} disabled={busy} onClick={onAdd}><Plus size={18} aria-hidden="true"/></button>
  </div>
  {open&&<div id="history-filters" className="history-filter-content">{children}</div>}
 </section>;
}
