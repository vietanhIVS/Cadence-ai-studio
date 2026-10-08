/** Elapsed wall-clock time, independent of rest periods and editor visibility. */
export function workoutDuration(startedAt:string,now:number){
 const start=Date.parse(startedAt);
 const seconds=Number.isFinite(start)&&Number.isFinite(now)?Math.max(0,Math.floor((now-start)/1000)):0;
 return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
