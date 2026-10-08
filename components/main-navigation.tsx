"use client";
import {useEffect,useRef} from 'react';
import {Home,Dumbbell,History,Settings} from 'lucide-react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';

export default function MainNavigation({tab,onChange}:{tab:string;onChange:(tab:string)=>void}){
 const dock=useRef<HTMLDivElement>(null),show=useRef<()=>void>(()=>{}),opened=useRef<()=>void>(()=>{});
 useEffect(()=>{
  const nav=dock.current;if(!nav)return;
  const media=matchMedia('(max-width:650px)');let timer:ReturnType<typeof setTimeout>|undefined,frame=0,lastY=scrollY,touchY:number|null=null,held=false,keyboard=false,measuredHeight=0;
  const clear=()=>{if(timer)clearTimeout(timer);timer=undefined};
  const visible=()=>{nav.dataset.dockHidden='false';nav.inert=false};
  const schedule=(delay=1500)=>{clear();if(media.matches&&!held&&!(keyboard&&nav.contains(document.activeElement)))timer=setTimeout(()=>{nav.dataset.dockHidden='true';nav.inert=true},delay)};
  const reveal=()=>{visible();schedule()};show.current=()=>{visible();keyboard=true;nav.querySelector<HTMLButtonElement>('[data-state=active]')?.focus()};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(Math.abs(scrollY-lastY)>=2){lastY=scrollY;reveal()}})};
  const wheel=(e:WheelEvent)=>{if(Math.abs(e.deltaY)>=2)reveal()};
  const down=(e:PointerEvent)=>{keyboard=false;touchY=e.clientY;held=nav.contains(e.target as Node);if(held||e.clientY>innerHeight-100)reveal()};
  const move=(e:PointerEvent)=>{if(nav.contains(e.target as Node)||(e.pointerType==='touch'&&touchY!==null&&Math.abs(e.clientY-touchY)>=4)){touchY=e.clientY;reveal()}};
  const up=()=>{touchY=null;held=false;schedule()};
  const key=(e:KeyboardEvent)=>{if(e.key==='Tab'){keyboard=true;visible();schedule()}};
  const focus=()=>{if(nav.contains(document.activeElement)){visible();clear()}else schedule()};
  const measure=()=>{const height=Math.ceil(nav.getBoundingClientRect().height);if(height&&height!==measuredHeight){measuredHeight=height;document.documentElement.style.setProperty('--cadence-dock-height',`${height}px`)}};
  const resize=()=>{measure();visible();schedule(2000)};opened.current=()=>{visible();schedule(2000)};
  const observer=new ResizeObserver(measure);observer.observe(nav);resize();
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('wheel',wheel,{passive:true});
  window.addEventListener('pointerdown',down,{passive:true});window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up,{passive:true});window.addEventListener('pointercancel',up,{passive:true});window.addEventListener('keydown',key);
  nav.addEventListener('focusin',focus);nav.addEventListener('focusout',focus);media.addEventListener('change',resize);window.visualViewport?.addEventListener('resize',resize);
  return()=>{clear();cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('wheel',wheel);window.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('keydown',key);nav.removeEventListener('focusin',focus);nav.removeEventListener('focusout',focus);media.removeEventListener('change',resize);window.visualViewport?.removeEventListener('resize',resize)};
 },[]);
 useEffect(()=>{opened.current()},[tab]);
 return <><button type="button" className="sr-only dock-reveal" onClick={()=>show.current()}>Show navigation</button><Tabs value={tab==='Schedule'?'Home':tab} onValueChange={onChange}><TabsList ref={dock} className="mainnav liquid-glass-navbar" aria-label="Main navigation" data-dock-hidden="false">{[[Home,'Home'],[Dumbbell,'Programs'],[History,'History'],[Settings,'Settings']].map(([Icon,label]:any)=><TabsTrigger key={label} value={label} className={(tab===label||(label==='Home'&&tab==='Schedule'))?'active-blue-pill':'nav-tab-inactive'}><Icon/>{label}</TabsTrigger>)}</TabsList></Tabs></>;
}
