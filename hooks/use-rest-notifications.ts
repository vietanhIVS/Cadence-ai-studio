"use client";
import {useEffect,useRef} from 'react';
import {restNotificationsEnabled} from '@/components/rest-notifications-setting';

export function useRestNotifications(sessionId:string,periodId:string|null,timerEnd:number|null,remaining:number){
 const handled=useRef(new Set<string>());
 useEffect(()=>{
  if(!periodId||timerEnd===null||remaining!==0||!restNotificationsEnabled()||!('serviceWorker'in navigator)||!('Notification'in window)||Notification.permission!=='granted')return;
  const key=`${sessionId}:${periodId}`;
  try{if(localStorage.getItem('cadence:last-rest-notification')===key||handled.current.has(key))return}catch{}
  handled.current.add(key);
  try{localStorage.setItem('cadence:last-rest-notification',key)}catch{}
  void navigator.serviceWorker.ready.then(registration=>registration.showNotification('Rest complete',{body:'Your rest period has ended. Ready for your next set?',icon:'/cadence-icon.png',badge:'/cadence-icon.png',tag:`cadence-rest-${periodId}`,data:{url:'/'}})).catch(()=>{});
 },[sessionId,periodId,timerEnd,remaining]);
}
