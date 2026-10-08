import {clone,type CycleDay} from './cadence';

export const PRESET_CYCLE_OPTIONS=[
 {length:3,label:'Push → Pull → Legs',detail:'3-day cycle · no rest days'},
 {length:5,label:'Push → Pull → Rest → Legs → Rest',detail:'5-day cycle · 2 rest days'},
 {length:7,label:'Push → Pull → Rest → Legs → Rest → Rest → Rest',detail:'7-day cycle · 4 rest days'},
] as const;

export function configurePresetCycle(templates:CycleDay[],length:number):CycleDay[]{
 const workouts=templates.filter(d=>d.type==='WORKOUT');
 if(workouts.length!==3||!PRESET_CYCLE_OPTIONS.some(o=>o.length===length))throw new Error('Choose a cycle for the three workout templates.');
 const rest=():CycleDay=>({type:'REST',name:'Rest',exercises:[]});
 return length===3?clone(workouts):[clone(workouts[0]),clone(workouts[1]),rest(),clone(workouts[2]),...Array.from({length:length-4},rest)];
}
