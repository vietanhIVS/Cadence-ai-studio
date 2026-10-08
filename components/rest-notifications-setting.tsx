"use client";
import {useEffect,useState} from 'react';
import {Bell,BellOff} from 'lucide-react';

const preferenceKey='cadence-rest-notifications-enabled';
export function restNotificationsEnabled(){try{return localStorage.getItem(preferenceKey)==='true'}catch{return false}}

export default function RestNotificationsSetting(){
 const [permission,setPermission]=useState<NotificationPermission|'unsupported'>('unsupported');
 const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{if('Notification'in window&&'serviceWorker'in navigator){setPermission(Notification.permission);setEnabled(restNotificationsEnabled())}},[]);
 async function toggle(){
  setMessage('');setBusy(true);
  try{
   if(enabled){localStorage.setItem(preferenceKey,'false');setEnabled(false);setMessage('Rest reminders are off.');return}
   if(!('Notification'in window)||!('serviceWorker'in navigator)){setMessage('Notifications are not available in this browser.');return}
   if(Notification.permission==='denied'){setPermission('denied');setMessage('Allow notifications for Cadence in iPhone Settings, then try again.');return}
   const result=Notification.permission==='granted'?'granted':await Notification.requestPermission();setPermission(result);
   if(result!=='granted'){setMessage('Notifications were not enabled.');return}
   await navigator.serviceWorker.register('/sw.js',{scope:'/'});await navigator.serviceWorker.ready;
   localStorage.setItem(preferenceKey,'true');setEnabled(true);
   setMessage('Rest reminders are on.');
  }catch{setMessage('Could not enable notifications. Please try again.')}finally{setBusy(false)}
 }
 return <section className="panel rest-notification-setting"><div><h2>Rest timer reminders</h2><p className="muted">Get a notification when a rest period ends. Add Cadence to your Home Screen and allow notifications on iPhone.</p><p className="muted rest-notification-limit">iOS may pause Cadence while it’s in the background, so reminders are not guaranteed if the app is closed.</p>{message&&<p role="status" className="muted">{message}</p>}</div><button type="button" className={enabled?'secondary':'primary'} disabled={busy||permission==='unsupported'} onClick={()=>void toggle()}>{enabled?<BellOff size={17}/>:<Bell size={17}/>}{busy?'Please wait':enabled?'Turn off reminders':'Enable reminders'}</button></section>
}
