import {nextProgramWorkout,workoutProgress,type State,type Log} from './cadence';
import {workoutPosition} from './schedule-review';

export type WorkoutAcknowledgement={kind:'success'|'cycle'|'saved';title:string;message:string|null;next:string|null};

export function completedCycleWorkouts(state:State,log:Log){
 if(!log.occurrence)return null;
 const {number,total}=workoutPosition(state,log.occurrence);
 return total&&number===total?total:null;
}

/** Build only when leaving this finish's Summary; never reconstruct on app load. */
export function workoutAcknowledgement(state:State,log:Log,today:string):WorkoutAcknowledgement{
 const planned=workoutProgress(log.exercises),complete=planned.total>0&&planned.done===planned.total;
 const total=completedCycleWorkouts(state,log),next=nextProgramWorkout(state,today);
 const nextPosition=next?workoutPosition(state,next):null;
 const nextLabel=next?`Workout ${nextPosition!.number}${nextPosition!.total?` of ${nextPosition!.total}`:''} · ${next.day.name}`:null;
 if(!complete)return {kind:'saved',title:'Workout saved',message:null,next:nextLabel};
 if(total)return {kind:'cycle',title:'CYCLE COMPLETE',message:`You finished all ${total} ${total===1?'workout':'workouts'}.`,next:nextLabel};
 return {kind:'success',title:'KUDOS!',message:'Great work.',next:nextLabel};
}
