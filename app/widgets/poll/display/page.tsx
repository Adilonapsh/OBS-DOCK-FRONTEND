'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import BarTheme from '../themes/Bar';
import CardTheme from '../themes/Card';
import DonutTheme from '../themes/Donut';
import MinimalTheme from '../themes/Minimal';
import AnimeTheme from '../themes/Anime';
import FlowerTheme from '../themes/Flower';
import EditorialTheme from '../themes/Editorial';
import PlainTheme from '../themes/Plain';
import type { PollState } from '../themes/types';
import { getPositionStyle } from '../../_shared/constants/positions';
import { getStringParam } from '../../_shared/utils/url';

import { getSocketUrl } from '../../_shared/utils/socket';

function PollInner(){
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const privateKey = searchParams.get('key') || searchParams.get('privateKey') || '';
  const obsMode = searchParams.get('obs')==='1' || searchParams.get('transparent')==='1';
  const theme = (searchParams.get('theme') as any) || 'bar';
  const font = searchParams.get('font') || 'Outfit';
  const bg = searchParams.get('bg') || 'transparent';
  const accent = searchParams.get('accent') || '#8b5cf6';
  const showPercent = searchParams.get('showPercent') !== '0';
  const showCount = searchParams.get('showCount') !== '0';
  const showTotal = searchParams.get('showTotal') !== '0';
  const showTimer = searchParams.get('showTimer') !== '0';
  const pos = getStringParam(params,'pos','center');
  const posStyle = getPositionStyle(pos);
  const simulate = searchParams.get('simulate') === '1' || searchParams.get('preview') === '1';
  const isTransparent = obsMode;
  // fallback from URL for preview without socket
  const qFallback = searchParams.get('q') || searchParams.get('question') || '';
  const optsFallbackRaw = searchParams.get('opts') || searchParams.get('options') || '';
  const optsFallback = optsFallbackRaw ? optsFallbackRaw.split(',').map(s=>decodeURIComponent(s.trim())).filter(Boolean) : [];

  const [poll, setPoll] = useState<PollState | null>(()=>{
    if (simulate) {
      return { id:'sim', room: privateKey||'global', question:'Mana turnamen selanjutnya?', options:['Mobile Legends','Valorant','PUBG Mobile','Free Fire'], votes:[42,28,18,12], total:100, theme, duration:60, createdAt:Date.now()-10000, ended:false, visible:true, voterMap:{}, accent, bg, font, showPercent:true, showCount:true, showTotal:true, showTimer:true } as any;
    }
    if(qFallback && optsFallback.length>=2){
      return { id:'fallback', room: privateKey||'global', question: qFallback, options: optsFallback, votes: Array(optsFallback.length).fill(0), total:0, theme, duration:60, createdAt:Date.now(), ended:false, visible:true, voterMap:{} } as any;
    }
    return null;
  });
  const [displayedPoll, setDisplayedPoll] = useState<PollState | null>(poll);
  const [isExiting, setIsExiting] = useState(false);
  const [winnerKey, setWinnerKey] = useState(0);
  useEffect(()=>{
    if(poll){
      if(displayedPoll && displayedPoll.id !== poll.id){
        setIsExiting(true);
        const t=setTimeout(()=>{ setDisplayedPoll(poll); setIsExiting(false); setWinnerKey(k=>k+1); }, 360);
        return ()=>clearTimeout(t);
      } else {
        // check if just ended -> trigger winner animation
        if(displayedPoll && !displayedPoll.ended && poll.ended) setWinnerKey(k=>k+1);
        setDisplayedPoll(poll);
        setIsExiting(false);
      }
    } else {
      if(displayedPoll){
        setIsExiting(true);
        const t=setTimeout(()=>{ setDisplayedPoll(null); setIsExiting(false); }, 360);
        return ()=>clearTimeout(t);
      }
    }
  },[poll, displayedPoll]);
  const [connected,setConnected]=useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(t); },[]);
  useEffect(()=>{
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;700;900&display=swap`;
    const sel = `link[data-poll-font="${font}"]`;
    let link = document.querySelector(sel) as HTMLLinkElement|null;
    if(!link){ link=document.createElement('link'); link.rel='stylesheet'; (link as any).dataset.pollFont=font; link.href=href; document.head.appendChild(link);} else if(link.href!==href) link.href=href;
  },[font]);

  useEffect(()=>{
    if (simulate) { setConnected(true); return; } // mode simulate — demo data lokal, tidak perlu socket
    const socket: Socket = io(getSocketUrl(), { transports:['websocket','polling'] });
    const room = privateKey || 'global';
    socket.on('connect',()=>{ setConnected(true); socket.emit('join-room', room); socket.emit('poll-get', { privateKey: room }); });
    socket.on('disconnect',()=>setConnected(false));
    socket.on('poll-update',(p:PollState)=>{
      // only accept poll for our room or global
      if(p.room===room || p.room==='global' || room==='global') setPoll(p);
    });
    socket.on('poll-clear',()=>setPoll(null));
    return ()=>{ socket.disconnect(); };
  },[privateKey, simulate]);

  const hasPoll = !!displayedPoll && displayedPoll.visible !== false;

  return (
    <>
      {isTransparent && <style dangerouslySetInnerHTML={{__html:`html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}`}} />}
      <style>{`
        @keyframes pollIn { from { opacity:0; transform: translateY(18px) scale(0.96); filter: blur(6px); } to { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes pollOut { from { opacity:1; transform: translateY(0) scale(1); filter: blur(0); } to { opacity:0; transform: translateY(-12px) scale(0.96); filter: blur(6px); } }
        @keyframes winnerPulse { 0%{ transform: scale(1); } 50%{ transform: scale(1.04); } 100%{ transform: scale(1); } }
        @keyframes winnerGlow { 0%{ box-shadow: 0 0 0 rgba(255,255,255,0); } 50%{ box-shadow: 0 0 24px rgba(255,255,255,0.6); } 100%{ box-shadow: 0 0 0 rgba(255,255,255,0); } }
        @keyframes confetti { 0%{ transform: translateY(0) rotate(0); opacity:1; } 100%{ transform: translateY(-24px) rotate(180deg); opacity:0; } }
      `}</style>
      <div className={`${isTransparent ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-4' : 'w-full min-h-screen bg-[#0a0a0a] flex p-6'}`} style={{ ...posStyle, background: isTransparent ? 'transparent' : '#0a0a0a' } as any}>
        {!isTransparent && <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize:"40px 40px"}} />}
        {!hasPoll ? (
          isTransparent ? null : poll && poll.visible === false ? (
            <div className="text-center animate-[pollIn_0.5s_ease]">
              <div className="text-white font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Poll disembunyikan
              </div>
              <div className="text-gray-500 text-[11px] mt-1">Toggle <code className="bg-white/10 px-1 rounded text-white">Show</code> di dock untuk tampilkan di OBS</div>
              <div className="mt-2 text-[11px] font-bold text-white truncate">{poll.question} • {poll.total} votes</div>
            </div>
          ) : (
          <div className="text-center animate-[pollIn_0.5s_ease]">
            <div className="text-white font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected?'bg-green-500 animate-pulse':'bg-red-500'}`} />
              {connected ? 'Menunggu polling…' : 'Menghubungkan…'}
            </div>
            <div className="text-gray-500 text-[11px] mt-1">Buat poll di <code className="bg-white/10 px-1 rounded text-white">Dock → Poll</code> → Start → muncul di OBS → chat 1-6 untuk vote</div>
            {poll===null && optsFallback.length===0 && (
              <div className="mt-3 text-[10px] font-mono text-gray-600">Tambahkan ?q=Pertanyaan&opts=Opsi%20A,Opsi%20B untuk preview statis</div>
            )}
          </div>
          )
        ) : (
          <div key={displayedPoll!.id + '-' + winnerKey} className={`${isExiting ? 'animate-[pollOut_0.36s_ease_forwards]' : 'animate-[pollIn_0.55s_cubic-bezier(0.16,1,0.3,1)]'} ${displayedPoll!.ended ? 'poll-ended' : ''} flex`}>
            {theme==='plain' ? <PlainTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : theme==='editorial' ? <EditorialTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : theme==='flower' ? <FlowerTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : theme==='anime' ? <AnimeTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : theme==='donut' ? <DonutTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : theme==='minimal' ? <MinimalTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : theme==='card' ? <CardTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} /> : <BarTheme poll={displayedPoll!} theme={theme} font={font} accent={accent} bg={bg} showPercent={showPercent} showCount={showCount} showTotal={showTotal} showTimer={showTimer} />}
          </div>
        )}
        {!isTransparent && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/40 backdrop-blur border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400 pointer-events-none">
            POLL • {theme} • {displayedPoll? `${displayedPoll.total} votes${displayedPoll.visible===false?' • HIDDEN':displayedPoll.ended?' • SELESAI':''}` : 'idle'}
          </div>
        )}
      </div>
    </>
  );
}

export default function PollDisplayPage(){
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading poll…</div>}>
      <PollInner />
    </Suspense>
  );
}
