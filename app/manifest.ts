import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
 return {name:'Cadence · Workout tracker',short_name:'Cadence',description:'Plan your training cycle, follow your schedule, and record every workout.',start_url:'/',scope:'/',display:'standalone',background_color:'#EFF4FA',theme_color:'#2563EB',icons:[{src:'/cadence-icon.png',sizes:'512x512',type:'image/png',purpose:'any'}]};
}
