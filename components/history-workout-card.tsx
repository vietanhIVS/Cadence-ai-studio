import {Timer,Check} from 'lucide-react';
import {dateLabel,type State,type Log} from '@/lib/cadence';
import {historyTitle,historyContext,historyTime,historyMinutes,historyMetrics} from '@/lib/history';

export default function HistoryWorkoutCard({state,log,onOpen}:{state:State;log:Log;onOpen:()=>void}){
 const metrics=historyMetrics(log),title=historyTitle(log),context=historyContext(state,log);
 return <button type="button" className="history-workout-card w-full min-w-0 text-left" data-history-id={log.id} onClick={onOpen} aria-label={`View ${title}, ${dateLabel(log.date,{day:'numeric',month:'long',year:'numeric'})}, ${historyTime(log)}`}>
  <span className="history-card-date"><span>{dateLabel(log.date,{month:'short'}).toUpperCase()}</span><b>{Number(log.date.slice(-2))}</b><span>{historyTime(log)}</span></span>
  <span className="history-card-content"><strong>{title}</strong><span className="history-card-context" title={context}>{context}{log.correctedAt?' · Corrected':''}</span><span className="history-card-stats"><span><Timer size={15} aria-hidden="true"/>{historyMinutes(log)}m</span><span><Check size={15} aria-hidden="true"/>{metrics.done}/{metrics.total} sets</span>{metrics.extra>0&&<span className="history-extra">+{metrics.extra} extra</span>}</span></span>
  <span className={`history-result-status ${metrics.status.toLowerCase()}`}>{metrics.status==='Completed'&&<span className="history-status-dot" aria-hidden="true"/>}{metrics.status}</span>
 </button>;
}
