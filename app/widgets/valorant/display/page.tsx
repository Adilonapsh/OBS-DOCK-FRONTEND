'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getStringParam, getIntParam, getBoolParam } from '../../_shared/utils/url';
import { loadGoogleFont } from '../../_shared/utils/font';
import { getPositionStyle } from '../../_shared/constants/positions';
import { parseBrutalistParams } from '../../_shared/constants/brutalist';
import { VALORANT_DEFAULTS } from '../config';
import { fetchValoRank, fetchValoHistory, fetchValoMmr, fetchValoTiers, fetchValoSeason, parseRankString, parseHistoryString, type ValoTier } from '../utils/valorantApi';
import { ValorantCard, type PromoState } from '../components/ValorantCard';

const FALLBACK_ICON = 'https://media.valorant-api.com/competitivetiers/564d8e28-c226-3180-6285-e48a390db8b1/0/largeicon.png';

function ValorantInner() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const username = getStringParam(params, 'username', VALORANT_DEFAULTS.username);
  const tag = getStringParam(params, 'tag', VALORANT_DEFAULTS.tag);
  const region = getStringParam(params, 'region', VALORANT_DEFAULTS.region);
  const platform = getStringParam(params, 'platform', VALORANT_DEFAULTS.platform);
  const view = getStringParam(params, 'view', VALORANT_DEFAULTS.view);
  const refresh = getIntParam(params, 'refresh', VALORANT_DEFAULTS.refresh);
  const themeMode = getStringParam(params, 'theme', VALORANT_DEFAULTS.theme);
  const pastelMode = getStringParam(params, 'pastelMode', VALORANT_DEFAULTS.pastelMode);
  const pastelBg = getStringParam(params, 'pastelBg', VALORANT_DEFAULTS.pastelBg);
  const font = getStringParam(params, 'font', VALORANT_DEFAULTS.font);
  const accent = getStringParam(params, 'accent', VALORANT_DEFAULTS.accent);
  const showStreak = getBoolParam(params, 'showStreak', VALORANT_DEFAULTS.showStreak);
  const showWinrate = getBoolParam(params, 'showWinrate', VALORANT_DEFAULTS.showWinrate);
  const showSeason = getBoolParam(params, 'showSeason', VALORANT_DEFAULTS.showSeason);
  const showUsername = getBoolParam(params, 'showUsername', VALORANT_DEFAULTS.showUsername);
  const showTag = getBoolParam(params, 'showTag', VALORANT_DEFAULTS.showTag);
  const obsMode = getBoolParam(params, 'obs', false) || getBoolParam(params, 'transparent', false);
  const simulate = getBoolParam(params, 'simulate', false);

  const pos = getStringParam(params, 'pos', 'center');
  const brutalist = parseBrutalistParams((k) => params.get(k));
  const isBrutalist = themeMode === 'brutalist';

  const [rankName, setRankName] = useState('UNRANKED');
  const [rr, setRr] = useState(0);
  const [iconUrl, setIconUrl] = useState(FALLBACK_ICON);
  const [themeColor, setThemeColor] = useState(accent);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [shield, setShield] = useState(0);
  const [seasonText, setSeasonText] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [promo, setPromo] = useState<PromoState>(null);
  const [error, setError] = useState('');

  const tiersRef = useRef<ValoTier[]>([]);
  const tierIdxRef = useRef(-1);
  const fetchingRef = useRef(false);
  // RR yang tampil (tween menuju target biar naik/turun bertahap)
  const [displayRr, setDisplayRr] = useState(0);
  const displayRrRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => { loadGoogleFont(font, '400;700;900', 'valorant-font'); }, [font]);

  // Animasi increment/decrement RR setiap target berubah
  useEffect(() => {
    const from = displayRrRef.current;
    if (from === rr) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur = 1000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (rr - from) * eased);
      displayRrRef.current = v;
      setDisplayRr(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rr]);

  // Ghost bar ala HP boss RPG: saat RR turun, bar putih stay dulu (±600ms)
  // baru drain menyusul; saat naik, ghost langsung loncat dan bar utama menyusul.
  const [ghostRr, setGhostRr] = useState(0);
  const ghostRef = useRef(0);
  const ghostTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ghostRaf = useRef(0);
  const firstGhost = useRef(true);

  useEffect(() => {
    if (firstGhost.current) {
      firstGhost.current = false;
      ghostRef.current = rr;
      setGhostRr(rr);
      return;
    }
    if (rr >= ghostRef.current) {
      cancelAnimationFrame(ghostRaf.current);
      clearTimeout(ghostTimer.current);
      ghostRef.current = rr;
      setGhostRr(rr);
      return;
    }
    clearTimeout(ghostTimer.current);
    cancelAnimationFrame(ghostRaf.current);
    ghostTimer.current = setTimeout(() => {
      const from = ghostRef.current;
      const target = rr;
      const start = performance.now();
      const dur = 900;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 2);
        const v = Math.round(from + (target - from) * eased);
        ghostRef.current = v;
        setGhostRr(v);
        if (p < 1) ghostRaf.current = requestAnimationFrame(tick);
      };
      ghostRaf.current = requestAnimationFrame(tick);
    }, 600);
    return () => {
      clearTimeout(ghostTimer.current);
      cancelAnimationFrame(ghostRaf.current);
    };
  }, [rr]);

  const applyTier = useCallback((tier: ValoTier, rrVal: number) => {
    setRankName(tier.tierName.toUpperCase());
    setRr(rrVal);
    setIconUrl(tier.largeIcon || tier.smallIcon || FALLBACK_ICON);
    // custom = accent fix; auto & brutalist = angka + glow ikut warna tier
    if (themeMode === 'custom') setThemeColor(accent);
    else setThemeColor(tier.color ? (tier.color.startsWith('#') ? tier.color : `#${tier.color}`) : '#ffffff');
  }, [themeMode, accent]);

  useEffect(() => { setThemeColor(themeMode === 'custom' ? accent : themeColor); }, [accent, themeMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const doFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    if (!username || !tag) return;
    fetchingRef.current = true;
    setError('');
    try {
      if (tiersRef.current.length === 0) {
        const t = await fetchValoTiers();
        tiersRef.current = t.tiers;
      }
      const [rankStr, histStr, mmr] = await Promise.all([
        fetchValoRank({ username, tag, region, platform }).catch(() => ''),
        fetchValoHistory({ username, tag, region, platform }).catch(() => ''),
        fetchValoMmr({ username, tag, region }).catch(() => ({ text: '', shield: 0 })),
      ]);
      let source = rankStr;
      if (!source && mmr.text) source = mmr.text;
      if (!source) {
        setError('Upstream kosong- tampilan lama dipertahankan');
        return;
      }
      const parsed = parseRankString(source);
      const shieldVal = parsed.shield || mmr.shield || 0;
      const hist = parseHistoryString(histStr);
      const tiers = tiersRef.current;
      let idx = tiers.findIndex((t) => t.tierName.toLowerCase() === parsed.rankName.toLowerCase());
      if (idx < 0) idx = 0;
      const tier = tiers[idx] || { tierName: parsed.rankName, color: accent, largeIcon: FALLBACK_ICON, smallIcon: FALLBACK_ICON };

      // animasi rank up/down saat tier berubah
      if (tierIdxRef.current !== -1 && tierIdxRef.current !== idx) {
        const dir = idx > tierIdxRef.current ? 'up' : 'down';
        setPromo({ direction: dir, tierName: tier.tierName, iconUrl: tier.largeIcon || tier.smallIcon || FALLBACK_ICON });
        if (themeMode !== 'custom' && tier.color) setThemeColor(tier.color.startsWith('#') ? tier.color : `#${tier.color}`);
        setTimeout(() => {
          applyTier(tier, parsed.rr);
          setWins(hist.wins);
          setLosses(hist.losses);
          setShield(shieldVal);
        }, 1200);
        setTimeout(() => setPromo(null), 3000);
      } else {
        applyTier(tier, parsed.rr);
        setWins(hist.wins);
        setLosses(hist.losses);
        setShield(shieldVal);
      }
      tierIdxRef.current = idx;
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      setUpdatedAt(`${hh}:${mm}:${ss}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch gagal');
    } finally {
      fetchingRef.current = false;
    }
  }, [username, tag, region, platform, accent, applyTier, themeMode]);

  // simulate mode: data palsu + siklus naik/turun otomatis (demo animasi)
  const simStep = useRef(0);
  useEffect(() => {
    if (!simulate) return;
    setRankName('DIAMOND 2');
    setRr(67);
    setWins(12);
    setLosses(8);
    setShield(0);
    setIconUrl(FALLBACK_ICON);
    setSeasonText('EPISODE 09 · ACT II');
    setUpdatedAt('SIMULATE');
    const deltas = [18, -25, 30, -12, 22, -35, 15, -20];
    const t = setInterval(() => {
      const i = simStep.current++;
      setRr((prev) => Math.max(5, Math.min(95, prev + deltas[i % deltas.length])));
      // tiap 4 langkah, mainkan overlay rank up/down bergantian
      if (i % 4 === 3) {
        const dir = (Math.floor(i / 4) % 2 === 0 ? 'up' : 'down') as 'up' | 'down';
        setPromo({ direction: dir, tierName: dir === 'up' ? 'Diamond 3' : 'Diamond 1', iconUrl: FALLBACK_ICON });
        setTimeout(() => setPromo(null), 3000);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [simulate]);

  useEffect(() => {
    if (simulate) return;
    fetchValoSeason().then((s) => { if (s) setSeasonText(s); });
    doFetch();
    if (refresh > 0) {
      const t = setInterval(doFetch, refresh * 1000);
      return () => clearInterval(t);
    }
  }, [doFetch, refresh, simulate]);

  const winrate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
  const posStyle = getPositionStyle(pos);
  const riotId = [showUsername ? username : '', showTag ? `#${tag}` : ''].filter(Boolean).join(' ');

  return (
    <>
      {obsMode && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important} *{box-sizing:border-box}` }} />}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700;900&display=swap'); html,body{background:${obsMode ? 'transparent !important' : '#0a0a0a'};}`}</style>
      <div
        className={obsMode ? 'fixed inset-0 w-screen h-screen bg-transparent overflow-hidden flex p-2' : 'w-full min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start p-4 gap-3'}
        style={{ ...posStyle, background: obsMode ? 'transparent' : '#0a0a0a', fontFamily: `'${font}', sans-serif` } as React.CSSProperties}
      >
        {!obsMode && error && (
          <div className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest">{error}</div>
        )}
        {!obsMode && !simulate && (!username || !tag) && (
          <div className="px-3 py-1.5 bg-white/5 border border-white/15 rounded-full text-gray-300 text-[10px] font-black uppercase tracking-widest">Isi username + tag di halaman settings dulu</div>
        )}
        <ValorantCard
          view={view}
          font={font}
          themeMode={themeMode}
          pastelMode={pastelMode}
          pastelBg={pastelBg}
          brutalist={isBrutalist ? brutalist : null}
          riotId={riotId}
          seasonText={seasonText}
          rankName={rankName}
          rr={displayRr}
          ghostRr={ghostRr}
          iconUrl={iconUrl}
          themeColor={themeColor}
          wins={wins}
          losses={losses}
          winrate={winrate}
          shield={shield}
          showStreak={showStreak}
          showWinrate={showWinrate}
          showSeason={showSeason}
          updatedAt={updatedAt}
          promo={promo}
        />
      </div>
    </>
  );
}

export default function ValorantDisplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading valorant…</div>}>
      <ValorantInner />
    </Suspense>
  );
}
