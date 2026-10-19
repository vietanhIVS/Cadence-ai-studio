"use client";
import {useEffect,useRef} from 'react';
import {restNotificationsEnabled} from '@/components/rest-notifications-setting';

export const REST_NOTIFICATION_TAG='cadence-rest';

export function closeRestNotifications(){
 if(typeof window==='undefined')return;
 try{
  if('serviceWorker'in navigator){
   void navigator.serviceWorker.ready.then(async reg=>{
    try{
     const list=await reg.getNotifications({tag:REST_NOTIFICATION_TAG});
     for(const n of list)n.close();
    }catch{}
   }).catch(()=>{});
  }
 }catch{}
}

export function useRestNotifications(
 sessionId:string,
 periodId:string|null,
 timerEnd:number|null,
 remaining:number
){
 const activePeriodRef=useRef<string|null>(periodId);
 const handledRef=useRef<Set<string>>(new Set());

 // When the active rest period changes or clears (e.g. user continues to the next set
 // and ticks done while still counting down, or timer clears), close any previous rest notifications.
 useEffect(()=>{
  if(activePeriodRef.current!==periodId){
   activePeriodRef.current=periodId;
   closeRestNotifications();
  }
 },[periodId]);

 useEffect(()=>{
  if(timerEnd===null){
   closeRestNotifications();
  }
 },[timerEnd]);

 useEffect(()=>{
  if(
   !periodId||
   timerEnd===null||
   !restNotificationsEnabled()||
   !('serviceWorker'in navigator)||
   !('Notification'in window)||
   Notification.permission!=='granted'
  ){
   return;
  }

  const key=`${sessionId}:${periodId}`;

  const triggerNotification=()=>{
   // Ensure this rest period is STILL the active one before alerting
   if(activePeriodRef.current!==periodId)return;
   try{
    if(localStorage.getItem('cadence:last-rest-notification')===key||handledRef.current.has(key))return;
   }catch{}
   handledRef.current.add(key);
   try{localStorage.setItem('cadence:last-rest-notification',key)}catch{}

   void navigator.serviceWorker.ready.then(reg=>{
    if(activePeriodRef.current!==periodId)return;
    return reg.showNotification('Rest complete',{
     body:'Your rest period has ended. Ready for your next set?',
     icon:'/cadence-icon.png',
     badge:'/cadence-icon.png',
     tag:REST_NOTIFICATION_TAG,
     renotify:true,
     data:{url:'/'}
    } as NotificationOptions);
   }).catch(()=>{});
  };

  if(remaining===0){
   triggerNotification();
   return;
  }

  const msRemaining=Math.max(0,timerEnd-Date.now());
  const timer=setTimeout(()=>{
   triggerNotification();
  },msRemaining);

  return ()=>{
   clearTimeout(timer);
  };
 },[sessionId,periodId,timerEnd,remaining]);
}
