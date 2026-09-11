'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TIMER_DEFAULTS, type TimerSettings } from '../config';
import { loadSettings, saveSettings, resolvePrivateKey } from '../../_shared/utils/storage';
const STORAGE_KEY='timer-settings';
export function useTimerSettings(){
  const searchParams=useSearchParams();
  const [privateKey,setPrivateKey]=useState('');
  // Init sync dari localStorage biar preview langsung sinkron tanpa flicker 50:00 -> 10:00
  const [state,setState]=useState<TimerSettings>(()=>{
    if(typeof window==='undefined') return {...TIMER_DEFAULTS} as TimerSettings;
    // jika ada query param, jangan load LS dulu — biar effect yang handle
    try{
      const sp = new URLSearchParams(window.location.search);
      const hasQuery = sp.get('theme')||sp.get('focusMinutes')||sp.get('accent')||sp.get('bg');
      if(hasQuery) return {...TIMER_DEFAULTS} as TimerSettings;
    }catch{}
    return loadSettings(STORAGE_KEY, TIMER_DEFAULTS as unknown as TimerSettings);
  });
  useEffect(()=>{
    const pk=resolvePrivateKey(searchParams);
    if(pk) setPrivateKey(pk);
    const has=searchParams.get('theme')||searchParams.get('focusMinutes')||searchParams.get('accent')||searchParams.get('bg')||searchParams.get('font');
    if(has){
      const s:Record<string,unknown>={...TIMER_DEFAULTS};
      for(const k of Object.keys(TIMER_DEFAULTS)){
        const v=searchParams.get(k);
        if(v!==null){
          const def=(TIMER_DEFAULTS as Record<string,unknown>)[k];
          if(typeof def==='number') s[k]=parseInt(v)||(def as number);
          else s[k]=v;
        }
      }
      setState(s as TimerSettings);
    }
  },[searchParams]);
  useEffect(()=>{saveSettings(STORAGE_KEY, state);},[state]);
  const update=(k:keyof TimerSettings,v:unknown)=>setState(p=>({...p,[k]:v} as TimerSettings));
  const reset=()=>setState({...TIMER_DEFAULTS} as TimerSettings);
  const loadFromUrl=(url:string)=>{
    const u=new URL(url); const p=u.searchParams; const s:Record<string,unknown>={...TIMER_DEFAULTS};
    for(const k of Object.keys(TIMER_DEFAULTS)){
      const v=p.get(k);
      if(v!==null){
        const def=(TIMER_DEFAULTS as Record<string,unknown>)[k];
        if(typeof def==='number') s[k]=parseInt(v)||(def as number);
        else s[k]=v;
      }
    }
    setState(s as TimerSettings);
    if(p.get('key')) setPrivateKey(p.get('key')||'');
  };
  return {state,setState,update,reset,privateKey,setPrivateKey,loadFromUrl};
}

