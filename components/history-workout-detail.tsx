"use client";
import {useEffect,useRef} from 'react';
import {ArrowLeft,Check,Repeat2,Dumbbell,Edit3,Trash2} from 'lucide-react';
import {dateLabel,type State,type Log} from '@/lib/cadence';
import {historyTitle,historyContext,historyMinutes,historyMetrics} from '@/lib/history';
import {workoutDuration} from '@/lib/workout-duration';
import {completedCycleWorkouts} from '@/lib/workout-acknowledgement';

export default function HistoryWorkoutDetail({state,log,onBack,onEdit,onDelete,summary=false}:{state:State;log:Log;onBack:()=>void;onEdit:()=>void;onDelete?:()=>void;summary?:boolean}){
 const heading=useRef<HTMLHeadingElement>(null),metrics=historyMetrics(log),circumference=2*Math.PI*88,cycleTotal=summary?completedCycleWorkouts(state,log):null;
 useEffect(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'})},[log.id]);
 return <section className="history-workout-detail" aria-label={summary?'Workout Summary':'Workout history detail'}>
  <div className="history-detail-nav"><button type="button" className="iconbtn" aria-label={summary?'Back to schedule':'Back to history'} onClick={onBack}><ArrowLeft size={24}/></button><h1 ref={heading} tabIndex={-1}>{summary?'Workout Summary':historyTitle(log)}</h1></div>
  <div className="history-detail-heading"><h2>{historyTitle(log)}</h2><p>{historyContext(state,log)}</p><p>{dateLabel(log.date,{weekday:'long',month:'long',day:'numeric',year:'numeric'})} · {summary?<span aria-label="Total workout duration">Duration: {workoutDuration(log.startedAt,Date.parse(log.finishedAt))}</span>:`${historyMinutes(log)}m`}</p></div>
  {cycleTotal&&<section className="summary-cycle-complete" aria-label="Cycle completed"><h3>Cycle complete</h3><p>You finished all {cycleTotal} {cycleTotal===1?'workout':'workouts'}.</p></section>}
  <div className="history-detail-grid">
   <section className="history-completion-card" aria-label="Workout completion">
    <div className="history-completion-ring" role="progressbar" aria-label={metrics.scheduled?'Planned sets completed':'Sets completed'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metrics.percent} aria-valuetext={`${metrics.done} of ${metrics.total} sets completed`}>
     <svg viewBox="0 0 208 208" aria-hidden="true"><circle className="history-ring-track" cx="104" cy="104" r="88"/><circle className="history-ring-value" cx="104" cy="104" r="88" strokeDasharray={circumference} strokeDashoffset={circumference*(1-metrics.percent/100)} transform="rotate(-90 104 104)" style={{opacity:metrics.percent===0?0:1}}/></svg>
     <div><b>{metrics.percent}%</b><span>COMPLETED</span></div>
    </div><p>{metrics.done} / {metrics.total} {metrics.scheduled?'planned sets':'sets'}</p>{metrics.extra>0&&<span className="history-extra">+{metrics.extra} extra {metrics.extra===1?'set':'sets'} completed</span>}
   </section>
   <section className="history-performance"><h3>Performance</h3><div className="history-performance-card">
    <div><span className="history-performance-icon completed"><Check size={16}/></span><div><h4>Sets</h4><p>{metrics.done} / {metrics.total} completed</p></div></div>
    <div><Repeat2 size={21} className="history-performance-icon" aria-hidden="true"/><div><h4>Reps</h4><p>{metrics.repTargets?`${metrics.repHits} / ${metrics.repTargets} planned sets within target`:'No rep target'}</p></div></div>
    <div><Dumbbell size={21} className="history-performance-icon" aria-hidden="true"/><div><h4>Weight</h4><p>{metrics.weightTargets?`${metrics.weightHits} / ${metrics.weightTargets} planned sets reached target`:'No weight target'}</p></div></div>
   </div></section>
  </div>
  {summary&&<section className="summary-exercises" aria-label="Exercise breakdown"><h3>Exercise breakdown</h3>{log.exercises.map(exercise=><details key={exercise.id} className="summary-exercise"><summary><strong>{exercise.name}</strong><span>{exercise.sets.filter(set=>set.done).length} / {exercise.sets.length} sets completed{!exercise.planned?' · Additional exercise':''}</span></summary><ul>{exercise.sets.map((set,i)=><li key={set.id}><span>Set {i+1}{!set.planned?' · Extra':''}</span><span>{set.weight===null?'—':Math.round(set.weight*(state.settings.unit==='lb'?2.2046226218:1)*100)/100} {state.settings.unit} × {set.reps??'—'}</span><span>{set.done?'Completed':set.skipped||exercise.skipped?'Skipped':'Incomplete'}</span></li>)}</ul></details>)}</section>}
  {log.notes&&<section className="history-detail-notes"><h3>Workout notes</h3><p>{log.notes}</p></section>}
  <div className="history-detail-actions"><button type="button" className="secondary history-edit-log" onClick={onEdit}><Edit3 size={18}/>View / edit workout log</button>{onDelete&&<button type="button" className="secondary danger history-delete-log" onClick={onDelete}><Trash2 size={18}/>Delete workout</button>}</div>
  {summary&&<div className="summary-footer"><button type="button" className="primary" onClick={onBack}>Done</button></div>}
 </section>;
}
