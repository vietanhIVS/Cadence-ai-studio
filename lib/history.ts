import {getVersion,workoutProgress,type State,type Log} from './cadence';
import {plannedSets,setPrescription} from './prescription';

export function historyTitle(log:Log){return log.occurrence&&!/^Day\s+\d+\s*[·:–-]/i.test(log.name)?`Day ${log.occurrence.cycleDay} · ${log.name}`:log.name}
export function historyContext(state:State,log:Log){
 const occurrence=log.occurrence;if(!occurrence)return 'Unscheduled workout';
 const application=state.schedules.find(s=>s.id===occurrence.scheduleId)?.applications.find(a=>a.id===occurrence.appId);
 const version=application?getVersion(state,application.programId,application.versionId).version:undefined;
 const workout=version?.days.slice(0,occurrence.cycleDay).filter(d=>d.type==='WORKOUT').length;
 return `${occurrence.programName} · ${workout?`Workout ${workout}`:`Day ${occurrence.cycleDay}`} · Cycle ${occurrence.cycleNumber}`;
}
export function historyMinutes(log:Log){const minutes=(Date.parse(log.finishedAt)-Date.parse(log.startedAt))/60000;return Number.isFinite(minutes)?Math.max(0,Math.round(minutes)):0}
export function historyTime(log:Log){const date=new Date(log.startedAt);if(!Number.isFinite(date.getTime()))return '';try{return date.toLocaleTimeString(undefined,{timeZone:log.timezone,hour:'2-digit',minute:'2-digit',hour12:false})}catch{return date.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',hour12:false})}}
export function historyMetrics(log:Log){
 const planned=workoutProgress(log.exercises),sets=log.exercises.flatMap(e=>e.sets),scheduled=planned.total>0;
 const total=scheduled?planned.total:sets.length,done=scheduled?planned.done:sets.filter(s=>s.done).length;
 let repTargets=0,repHits=0,weightTargets=0,weightHits=0;
 for(const exercise of log.exercises){const plan=exercise.planned;if(!plan)continue;
  const hasReps=(p:ReturnType<typeof plannedSets>[number])=>Number.isFinite(p.repMin)&&p.repMin>0&&Number.isFinite(p.repMax)&&p.repMax>=p.repMin;
  for(const target of plannedSets(plan)){if(hasReps(target))repTargets++;if(target.targetWeight!==undefined)weightTargets++}
  for(const set of exercise.sets){if(!set.done)continue;const target=setPrescription(exercise,set);if(!target)continue;if(hasReps(target)&&set.reps!==null&&set.reps>=target.repMin&&set.reps<=target.repMax)repHits++;if(target.targetWeight!==undefined&&set.weight!==null&&set.weight>=target.targetWeight)weightHits++}
 }
 const skipped=sets.length>0&&log.exercises.every(e=>e.sets.every(s=>!s.done&&(s.skipped||e.skipped)));
 const status=log.status==='UNSCHEDULED'?'Unscheduled':skipped?'Skipped':log.status==='COMPLETED'?'Completed':'Partial';
 return {total,done,scheduled,extra:scheduled?sets.filter(s=>!s.planned&&s.done).length:0,percent:total?Math.min(100,Math.round(done/total*100)):0,status,repTargets,repHits,weightTargets,weightHits};
}
