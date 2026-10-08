import type {PlanExercise} from '@/lib/cadence';
import {plannedSets,setTargetSummary,type WeightUnit} from '@/lib/prescription';

export default function PlannedExerciseDetails({exercise,unit}:{exercise:PlanExercise;unit:WeightUnit}){
 return <details className="planned-preview"><summary>Individual set targets</summary>{exercise.groupId&&<p className="muted">Superset {exercise.groupId}{exercise.groupOrder?` · Position ${exercise.groupOrder}`:''}</p>}<ol>{plannedSets(exercise).map(set=><li key={set.id}><b>Set {set.setNumber}</b><span>{setTargetSummary(set,unit)}</span>{set.notes&&<p className="muted planned-exercise-notes">{set.notes}</p>}</li>)}</ol></details>;
}
