import {getVersion,nextProgramWorkout,type State,type Occurrence} from './cadence';
export function workoutPosition(state:State,occurrence:Occurrence){
 const application=state.schedules.find(s=>s.id===occurrence.scheduleId)?.applications.find(a=>a.id===occurrence.appId);
 const version=application?getVersion(state,application.programId,application.versionId).version:undefined;
 return {number:version?.days.slice(0,occurrence.cycleDay).filter(d=>d.type==='WORKOUT').length||occurrence.cycleDay,total:version?.days.filter(d=>d.type==='WORKOUT').length||null};
}
export function nextScheduledWorkout(state:State,after:string){
 return nextProgramWorkout(state,after);
}
