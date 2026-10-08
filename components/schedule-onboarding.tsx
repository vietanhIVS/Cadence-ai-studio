"use client";
import {Dumbbell,Moon,ChevronRight,Repeat2} from 'lucide-react';

export default function ScheduleOnboarding({onChoose,onCreate,mobile=false}:{onChoose:()=>void;onCreate:()=>void;mobile?:boolean}){
 const example=[{name:'Chest',rest:false},{name:'Back',rest:false},{name:'Legs',rest:false}];
 return <section className="panel welcome schedule-onboarding" aria-labelledby="cycle-onboarding-title">
  <div className="onboarding-title"><div className="iconplate" aria-hidden="true"><Repeat2 size={24}/></div><h2 id="cycle-onboarding-title">Build your training cycle</h2></div>
  <p className="muted onboarding-description">Finish a workout to advance. Rest whenever you need.</p>
  <div className="cycle-example">
   <ol aria-label="Example three-workout cycle">{example.map((day,i)=><li key={i}>
    <div className="cycle-example-day"><span>Workout {i+1}</span><b><Dumbbell size={15} aria-hidden="true"/>{day.name}</b></div>
    {i<example.length-1&&<ChevronRight className="cycle-example-arrow" size={16} aria-hidden="true"/>}
   </li>)}</ol>
   <span className="cycle-example-repeat"><Repeat2 size={17} aria-hidden="true"/>Repeat from Workout 1</span>
  </div>
  <div className="onboarding-actions"><button className="primary" onClick={onChoose}>Choose a program</button><button className="textbtn" onClick={onCreate}>{mobile?'Create your own program':'Create your own'}</button></div>
  <p className="muted onboarding-next">Your program determines what’s next. Your calendar records when you train.</p>
 </section>;
}
