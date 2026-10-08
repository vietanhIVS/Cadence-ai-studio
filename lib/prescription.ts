import type {PlanExercise,SetPrescription,ActualExercise,ResultSet} from './cadence';

export type WeightUnit='kg'|'lb';
export const EXERCISE_NOTES_LIMIT=4000;
export const weightMultiplier=(unit:WeightUnit)=>unit==='lb'?2.2046226218:1;
export const displayWeight=(kg:number,unit:WeightUnit)=>Math.round(kg*weightMultiplier(unit)*1000000)/1000000;
export const storedWeight=(value:number,unit:WeightUnit)=>value/weightMultiplier(unit);
// Legacy zero without a display unit represented an empty weight target.
export const plannedWeight=(exercise:PlanExercise)=>exercise.weight===0&&!exercise.weightUnit?undefined:exercise.weight;
export const restLabel=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
export const restTargetLabel=(set:SetPrescription)=>`${restLabel(set.restSeconds)}${set.restSecondsMax!==undefined&&set.restSecondsMax!==set.restSeconds?`–${restLabel(set.restSecondsMax)}`:''}`;
export const repLabel=(set:SetPrescription)=>set.repMin===set.repMax?String(set.repMin):`${set.repMin}–${set.repMax}`;

/** Interpret without mutating old versions, active workouts or historical snapshots. */
export function plannedSets(exercise:PlanExercise):SetPrescription[]{
 if(Array.isArray(exercise.sets))return exercise.sets;
 const count=Number.isInteger(exercise.sets)&&exercise.sets>0&&exercise.sets<=20?exercise.sets:0;
 return Array.from({length:count},(_,i)=>({id:`${exercise.id}:set:${i+1}`,setNumber:i+1,repMin:exercise.repMin??0,repMax:exercise.repMax??0,targetWeight:plannedWeight(exercise),weightUnit:exercise.weightUnit,restSeconds:exercise.restSeconds??exercise.rest??90}));
}
export const plannedSetCount=(exercise:PlanExercise)=>plannedSets(exercise).length;
/** Legacy actual rows have no prescriptionId; their original planned order is stable. */
export function setPrescription(exercise:ActualExercise,set:ResultSet){
 if(!set.planned||!exercise.planned)return undefined;
 const sets=plannedSets(exercise.planned);
 return set.prescriptionId?sets.find(p=>p.id===set.prescriptionId):sets[exercise.sets.filter(s=>s.planned).findIndex(s=>s.id===set.id)];
}
export function normalizePlan(exercise:PlanExercise,order=exercise.order??1,unit:WeightUnit='kg'):PlanExercise{
 const normalized={...exercise,order,sets:plannedSets(exercise).map((set,i)=>({...set,setNumber:i+1,weightUnit:set.weightUnit||unit}))};
 for(const set of normalized.sets){if(set.targetWeight===undefined)delete set.targetWeight;if(set.notes===undefined)delete set.notes;if(set.targetRpe===undefined)delete set.targetRpe}
 delete normalized.repMin;delete normalized.repMax;delete normalized.weight;delete normalized.weightUnit;delete normalized.rest;delete normalized.restSeconds;
 return normalized;
}
export function setTargetSummary(set:SetPrescription,unit:WeightUnit=set.weightUnit||'kg'){
 return [`${repLabel(set)} reps`,...(set.targetWeight===undefined?[]:[`${Math.round(displayWeight(set.targetWeight,unit)*100)/100} ${unit}`]),`Rest ${restTargetLabel(set)}`,...(set.targetRpe===undefined?[]:[`RPE ${set.targetRpe}`])].join(' · ');
}
export function prescriptionSummary(exercise:PlanExercise,unit?:WeightUnit){
 const sets=plannedSets(exercise),reps=sets.map(repLabel),rests=sets.flatMap(s=>[s.restSeconds,s.restSecondsMax??s.restSeconds]);
 const sameReps=reps.every(r=>r===reps[0]),sameWeight=sets.every(s=>s.targetWeight===sets[0]?.targetWeight&&s.weightUnit===sets[0]?.weightUnit);
 const first=sets[0],weight=first?.targetWeight,displayUnit=unit||first?.weightUnit||'kg';
 return [`${sets.length} ${sets.length===1?'set':'sets'}`,`${sameReps?reps[0]:reps.join(' / ')} reps`,...(sameWeight&&weight!==undefined?[`${Math.round(displayWeight(weight,displayUnit)*100)/100} ${displayUnit}`]:!sameWeight?['Weights vary by set']:[]),`Rest ${rests.length?restLabel(Math.min(...rests)):restLabel(0)}${new Set(rests).size>1?`–${restLabel(Math.max(...rests))}`:''}`].join(' · ');
}
const validNotes=(notes:unknown)=>notes===undefined||typeof notes==='string'&&notes.length<=EXERCISE_NOTES_LIMIT;
export function prescriptionError(exercise:PlanExercise):string{
 if(!Array.isArray(exercise.sets)&&(!Number.isInteger(exercise.sets)||exercise.sets<1||exercise.sets>20))return 'Sets must be a whole number from 1 to 20.';
 const sets=plannedSets(exercise);
 if(sets.length<1||sets.length>20)return 'An exercise must contain 1 to 20 planned sets.';
 const ids=new Set<string>();
 for(const [i,set] of sets.entries()){
  const prefix=`Set ${i+1}: `;
  if(!set||typeof set.id!=='string'||!set.id||set.id.length>200||ids.has(set.id))return prefix+'Planned sets need unique IDs.';ids.add(set.id);
  if(set.setNumber!==i+1)return prefix+'Set numbers must be sequential.';
  if(!Number.isInteger(set.repMin)||set.repMin<1||set.repMin>999)return prefix+'Minimum reps must be a whole number from 1 to 999.';
  if(!Number.isInteger(set.repMax)||set.repMax<set.repMin||set.repMax>999)return prefix+'Maximum reps must be a whole number at least equal to minimum reps, up to 999.';
  if(set.targetWeight!==undefined&&(!Number.isFinite(set.targetWeight)||set.targetWeight<0||set.targetWeight>2000))return prefix+'Target weight must be between 0 and 2000 kg, or left blank.';
  if(set.weightUnit!==undefined&&!['kg','lb'].includes(set.weightUnit))return prefix+'Choose kg or lb.';
  if(!Number.isInteger(set.restSeconds)||set.restSeconds<0||set.restSeconds>3600)return prefix+'Rest must be a whole number of seconds from 0 to 3600.';
  if(set.restSecondsMax!==undefined&&(!Number.isInteger(set.restSecondsMax)||set.restSecondsMax<set.restSeconds||set.restSecondsMax>3600))return prefix+'Maximum rest must be a whole number at least equal to minimum rest, up to 3600 seconds.';
  if(set.targetRpe!==undefined&&(!Number.isFinite(set.targetRpe)||set.targetRpe<1||set.targetRpe>10))return prefix+'RPE must be between 1 and 10, or left blank.';
  if(!validNotes(set.notes))return prefix+`Notes must be text with at most ${EXERCISE_NOTES_LIMIT} characters.`;
 }
 if(!validNotes(exercise.notes))return `Notes must be text with at most ${EXERCISE_NOTES_LIMIT} characters.`;
 if(exercise.groupId!==undefined&&(typeof exercise.groupId!=='string'||exercise.groupId.length>120))return 'Group name must be at most 120 characters.';
 if(exercise.groupType!==undefined&&exercise.groupType!=='SUPERSET')return 'Choose a valid exercise group type.';
 if(exercise.groupOrder!==undefined&&(!Number.isInteger(exercise.groupOrder)||exercise.groupOrder<1||exercise.groupOrder>30))return 'Group order must be a whole number from 1 to 30.';
 return '';
}
