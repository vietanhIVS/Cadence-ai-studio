import {SlidersHorizontal, ChevronDown, ChevronUp} from 'lucide-react';
import type {ReactNode} from 'react';

export default function HistoryToolbar({open,onToggle,children}:{open:boolean;onToggle:()=>void;onAdd?:()=>void;busy?:boolean;hasSession?:boolean;children:ReactNode}){
 return <section className="history-filter-panel" aria-label="History controls">
  <div className="history-tools flex items-center gap-3 rounded-full">
   <button
    type="button"
    className="history-filter-toggle flex min-w-0 flex-1 items-center justify-between gap-2"
    aria-expanded={open}
    aria-controls="history-filters"
    onClick={onToggle}
   >
    <span className="flex items-center gap-2 font-semibold">
     <SlidersHorizontal size={18} aria-hidden="true"/>
     Search and filter
    </span>
    <span className="history-filter-chevron flex shrink-0 items-center justify-center text-slate-500 transition-transform dark:text-slate-400">
     {open ? <ChevronUp size={18} aria-hidden="true"/> : <ChevronDown size={18} aria-hidden="true"/>}
    </span>
   </button>
  </div>
  {open&&<div id="history-filters" className="history-filter-content">{children}</div>}
 </section>;
}
