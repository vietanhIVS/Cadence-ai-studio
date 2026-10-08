import type {ActualExercise,ResultSet,Session} from './cadence';
import {setPrescription,plannedSetCount} from './prescription';

export function plannedWorkStatus(exercises:ActualExercise[]){
 const counts={total:0,completed:0,skipped:0,pending:0};
 for(const exercise of exercises){
  if(!exercise.planned)continue;
  counts.total+=plannedSetCount(exercise.planned);
  for(const set of exercise.sets){
   if(!set.planned)continue;
   if(set.done)counts.completed++;
   else if(set.skipped)counts.skipped++;
  }
 }
 counts.pending=Math.max(0,counts.total-counts.completed-counts.skipped);
 return counts;
}

export function finishWorkoutMessage(counts:ReturnType<typeof plannedWorkStatus>){
 return counts.skipped>0
  ?`${counts.completed} of ${counts.total} planned sets completed · ${counts.skipped} skipped · ${counts.pending} still pending.`
  :`You completed ${counts.completed} of ${counts.total} planned sets. ${counts.pending} ${counts.pending===1?'set is':'sets are'} still pending.`;
}

export function actualSetErrors(set:ResultSet){
 const errors:{weight?:string;reps?:string}={};
 if(set.weight===null){if(set.done)errors.weight='Weight is required for a completed set.'}
 else if(!Number.isFinite(set.weight)||set.weight<0||set.weight>2000)errors.weight='Enter a valid weight within the allowed range.';
 if(set.reps===null){if(set.done)errors.reps='Reps are required for a completed set.'}
 else if(!Number.isInteger(set.reps)||set.reps<1||set.reps>999)errors.reps='Reps must be a whole number from 1 to 999.';
 return errors;
}
export function hasInvalidActualSets(exercises:ActualExercise[]){return exercises.some(e=>e.sets.some(set=>Object.keys(actualSetErrors(set)).length>0))}
export function completionAdvances(exercise:ActualExercise,index:number){return !exercise.sets.slice(index+1).some(set=>set.done)}
export function nextPendingSet(exercise:ActualExercise){const lastDone=exercise.sets.findLastIndex(set=>set.done);return exercise.sets.slice(lastDone+1).find(set=>!set.done&&!set.skipped)||exercise.sets.find(set=>!set.done&&!set.skipped)}

// Set completion and the one session timer are committed together by saveSession.
export function updateRestForSets(session:Session,next:ActualExercise[],defaultRest:number,now=Date.now()){
 for(const exercise of next){
  const previous=session.exercises.find(e=>e.id===exercise.id);
  for(const [index,set] of exercise.sets.entries()){
   const old=previous?.sets.find(s=>s.id===set.id);if(!old||old.done===set.done)continue;
   if(set.done){
    // Re-completing an earlier set is a correction, not a new rest interval
    // in the current progression. Leave any later set's timer untouched.
    if(!completionAdvances(exercise,index))continue;
    if(exercise.sets.some(s=>!s.done&&!s.skipped)){
     session.timerEnd=now+(setPrescription(exercise,set)?.restSeconds??defaultRest)*1000;
     session.timerSource={exerciseId:exercise.id,setId:set.id};session.timerId=`${exercise.id}:${set.id}:${now}`;
    }else{session.timerEnd=null;session.timerId=null;session.timerSource=null}
   }else if(session.timerSource?.setId===set.id&&session.timerSource.exerciseId===exercise.id){session.timerEnd=null;session.timerId=null;session.timerSource=null}
  }
 }
}
