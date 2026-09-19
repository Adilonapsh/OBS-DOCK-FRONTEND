'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPositionStyle } from '../../_shared/constants/positions';

function formatWithTokens(date: Date, fmt: string, tz: string) {
    if (!fmt) return '';
    // resolve zoned date via localeString hack (browser-compatible)
    let zoned: Date;
    try {
        zoned = tz ? new Date(date.toLocaleString('en-US', { timeZone: tz })) : date;
        // verify invalid timezone fallback
        if (isNaN(zoned.getTime())) zoned = date;
    } catch {
        zoned = date;
    }
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    const monthsLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekdaysLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const y = zoned.getFullYear();
    const M = zoned.getMonth();
    const d = zoned.getDate();
    const wd = zoned.getDay();
    const H = zoned.getHours();
    const m = zoned.getMinutes();
    const s = zoned.getSeconds();
    const h12 = H % 12 || 12;
    const A = H >= 12 ? 'PM' : 'AM';
    const a = A.toLowerCase();
    const Do = (() => {
        const j = d % 10, k = d % 100;
        if (j === 1 && k !== 11) return d + 'st';
        if (j === 2 && k !== 12) return d + 'nd';
        if (j === 3 && k !== 13) return d + 'rd';
        return d + 'th';
    })();
    // handle escaped brackets like [at]
    // temporarily stash brackets
    const brackets: string[] = [];
    let tmp = fmt.replace(/\[([^\]]+)\]/g, (_, p1) => {
        const idx = brackets.length;
        brackets.push(p1);
        return `__BR${idx}__`;
    });
    const map: Record<string, string> = {
        'YYYY': String(y),
        'YY': String(y).slice(-2),
        'MMMM': monthsLong[M],
        'MMM': monthsShort[M],
        'MM': pad(M + 1),
        'M': String(M + 1),
        'Do': Do,
        'DD': pad(d),
        'D': String(d),
        'dddd': weekdaysLong[wd],
        'ddd': weekdaysShort[wd],
        'dd': weekdaysShort[wd].slice(0, 2),
        'HH': pad(H),
        'H': String(H),
        'hh': pad(h12),
        'h': String(h12),
        'mm': pad(m),
        'm': String(m),
        'ss': pad(s),
        's': String(s),
        'A': A,
        'a': a,
        'ZZ': '',
        'Z': '',
    };
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    const re = new RegExp(keys.join('|'), 'g');
    tmp = tmp.replace(re, (m) => map[m]);
    // restore brackets
    tmp = tmp.replace(/__BR(\d+)__/g, (_, idx) => brackets[parseInt(idx)] || '');
    return tmp;
}

function useClockParams(searchParams: URLSearchParams) {
    const get = (k: string, d: string) => searchParams.get(k) ?? d;
    const getNum = (k: string, d: number) => {
        const v = searchParams.get(k);
        if (v === null) return d;
        const n = parseFloat(v);
        return isNaN(n) ? d : n;
    };
    const getBool = (k: string, d: boolean) => {
        const v = searchParams.get(k);
        if (v === null) return d;
        return v === '1' || v === 'true';
    };
    return {
        font: get('font', get('fontFamily', 'Outfit')),
        tz: get('tz', get('timezone', 'Asia/Jakarta')),
        bg: get('bg', get('background', 'transparent')),
        // line 1
        l1: get('l1', get('l1Format', get('line1', 'hh:mm:ss A'))),
        s1: getNum('s1', getNum('line1Size', 50)),
        w1: get('w1', get('line1Weight', '800')),
        c1: get('c1', get('line1Color', '#ffffff')),
        o1: getNum('o1', getNum('line1Opacity', 1)),
        t1: get('t1', get('line1Transform', 'uppercase')),
        a1: get('a1', get('line1Align', 'center')),
        v1: getBool('v1', getBool('line1Visible', true)),
        // line 2
        l2: get('l2', get('l2Format', get('line2', 'ddd D MMM YY'))),
        s2: getNum('s2', getNum('line2Size', 40)),
        w2: get('w2', get('line2Weight', '400')),
        c2: get('c2', get('line2Color', '#ffffff')),
        o2: getNum('o2', getNum('line2Opacity', 0.9)),
        t2: get('t2', get('line2Transform', 'uppercase')),
        a2: get('a2', get('line2Align', 'center')),
        v2: getBool('v2', getBool('line2Visible', true)),
        // line 3
        l3: get('l3', get('l3Format', get('line3', ''))),
        s3: getNum('s3', getNum('line3Size', 30)),
        w3: get('w3', get('line3Weight', '600')),
        c3: get('c3', get('line3Color', '#ffffff')),
        o3: getNum('o3', getNum('line3Opacity', 1)),
        t3: get('t3', get('line3Transform', 'none')),
        a3: get('a3', get('line3Align', 'center')),
        v3: getBool('v3', getBool('line3Visible', false)),
        gap: getNum('gap', 2),
        pos: get('pos', 'center'),
    };
}

function ClockInner() {
    const searchParams = useSearchParams();
    const obsMode = searchParams.get('obs') === '1' || searchParams.get('transparent') === '1';
    const params = useClockParams(searchParams as unknown as URLSearchParams);
    const [now, setNow] = useState<Date>(() => new Date());
    const [fontLoaded, setFontLoaded] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // google font
    useEffect(() => {
        const f = params.font || 'Outfit';
        const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@300;400;600;800&display=swap`;
        const sel = `link[data-clock-font="${f}"]`;
        let link = document.querySelector(sel) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            (link as any).dataset.clockFont = f;
            link.href = url;
            document.head.appendChild(link);
        } else if (link.href !== url) link.href = url;
        setFontLoaded(true);
    }, [params.font]);

    const line1Text = useMemo(() => params.v1 && params.l1 ? formatWithTokens(now, params.l1, params.tz) : '', [now, params.l1, params.tz, params.v1]);
    const line2Text = useMemo(() => params.v2 && params.l2 ? formatWithTokens(now, params.l2, params.tz) : '', [now, params.l2, params.tz, params.v2]);
    const line3Text = useMemo(() => params.v3 && params.l3 ? formatWithTokens(now, params.l3, params.tz) : '', [now, params.l3, params.tz, params.v3]);

    const isTransparent = obsMode;
    const posStyle = getPositionStyle((params as unknown as { pos: string }).pos || 'center');

    return (
        <>
            {isTransparent && <style dangerouslySetInnerHTML={{ __html: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;width:100vw!important;height:100vh!important;background:transparent!important}` }} />}
            <div
                id="main-container"
                className={`${isTransparent ? 'fixed inset-0 w-screen h-screen overflow-hidden flex p-6' : 'w-full min-h-screen bg-[#0a0a0a] flex p-6'}`}
                style={{ background: isTransparent ? (params.bg === 'transparent' ? 'transparent' : params.bg) : '#0a0a0a', ...posStyle } as any}
            >
                {/* checker for non-transparent preview */}
                {!isTransparent && <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />}

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: `${params.gap}px`,
                        fontFamily: `'${params.font}', sans-serif`,
                        width: '100%',
                        maxWidth: '900px',
                        alignItems: 'stretch',
                    }}
                >
                    {params.v1 && (
                        <label
                            id="line1"
                            className="timeLabel"
                            style={{
                                fontSize: `${params.s1}px`,
                                fontWeight: params.w1 as any,
                                color: params.c1,
                                opacity: params.o1,
                                textTransform: params.t1 as any,
                                textAlign: params.a1 as any,
                                lineHeight: 1.1,
                                display: line1Text ? 'block' : 'none',
                                wordBreak: 'break-word',
                            }}
                        >
                            {line1Text}
                        </label>
                    )}
                    {params.v2 && (
                        <label
                            id="line2"
                            className="timeLabel"
                            style={{
                                fontSize: `${params.s2}px`,
                                fontWeight: params.w2 as any,
                                color: params.c2,
                                opacity: params.o2,
                                textTransform: params.t2 as any,
                                textAlign: params.a2 as any,
                                lineHeight: 1.15,
                                display: line2Text ? 'block' : 'none',
                                wordBreak: 'break-word',
                            }}
                        >
                            {line2Text}
                        </label>
                    )}
                    {params.v3 && (
                        <label
                            id="line3"
                            className="timeLabel"
                            style={{
                                fontSize: `${params.s3}px`,
                                fontWeight: params.w3 as any,
                                color: params.c3,
                                opacity: params.o3,
                                textTransform: params.t3 as any,
                                textAlign: params.a3 as any,
                                lineHeight: 1.2,
                                display: line3Text ? 'block' : 'none',
                                wordBreak: 'break-word',
                            }}
                        >
                            {line3Text}
                        </label>
                    )}
                </div>

                {!isTransparent && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/40 backdrop-blur border border-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400 pointer-events-none">
                        CLOCK • {params.tz} • {params.font}
                    </div>
                )}
            </div>
        </>
    );
}

export default function ClockDisplayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black grid place-items-center text-white/60 text-sm">Loading clock…</div>}>
            <ClockInner />
        </Suspense>
    );
}
