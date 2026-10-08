"use client";
import {useSyncExternalStore} from 'react';

const MOBILE_QUERY='(max-width: 650px)';
function subscribe(onChange:()=>void){const query=window.matchMedia(MOBILE_QUERY);query.addEventListener('change',onChange);return()=>query.removeEventListener('change',onChange)}
const getSnapshot=()=>window.matchMedia(MOBILE_QUERY).matches;
const getServerSnapshot=()=>false;

export function useMobileLayout(){return useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot)}
