'use client';
// Template bawaan ala vMix GT: lower-third, fullscreen, scorebug.
// Dipakai saat user klik "New" di /designer.

import type { DesignerLayer } from './types';
import { uid } from './types';

function baseLayer(partial: Partial<DesignerLayer> & { type: DesignerLayer['type'] }): DesignerLayer {
  const { props, ...rest } = partial;
  return {
    id: uid('layer'),
    name: 'Layer',
    visible: true,
    locked: false,
    x: 100,
    y: 100,
    w: 600,
    h: 120,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    animIn: '',
    animOut: '',
    delay: 0,
    out: null,
    ...rest,
    props: { ...(props ?? {}) },
  } as DesignerLayer;
}

export function presetLowerThird(): DesignerLayer[] {
  return [
    baseLayer({
      name: 'BG bar',
      type: 'shape',
      x: 120,
      y: 830,
      w: 760,
      h: 150,
      zIndex: 1,
      animIn: '',
      animOut: '',
      props: { shape: 'rect', fill: '#111111', bgOpacity: 88, radius: 18, borderColor: '#ffffff', borderWidth: 0 },
    }),
    baseLayer({
      name: 'Accent bar',
      type: 'shape',
      x: 120,
      y: 830,
      w: 14,
      h: 150,
      zIndex: 2,
      animIn: '',
      animOut: '',
      props: { shape: 'rect', fill: '#ffffff', bgOpacity: 100, radius: 6 },
    }),
    baseLayer({
      name: 'Nama',
      type: 'text',
      x: 170,
      y: 845,
      w: 680,
      h: 70,
      zIndex: 3,
      animIn: '',
      animOut: '',
      props: {
        text: '{{username}}',
        fontFamily: 'Outfit',
        fontSize: 52,
        fontWeight: 900,
        color: '#ffffff',
        align: 'left',
        shadow: true,
      },
    }),
    baseLayer({
      name: 'Keterangan',
      type: 'text',
      x: 170,
      y: 912,
      w: 680,
      h: 50,
      zIndex: 4,
      animIn: '',
      animOut: '',
      props: {
        text: '{{message}}',
        fontFamily: 'Outfit',
        fontSize: 30,
        fontWeight: 400,
        color: '#e5e5e5',
        align: 'left',
      },
    }),
  ];
}

export function presetTitle(): DesignerLayer[] {
  return [
    baseLayer({
      name: 'Judul',
      type: 'text',
      x: 360,
      y: 400,
      w: 1200,
      h: 140,
      zIndex: 1,
      animIn: '',
      animOut: '',
      props: {
        text: 'JUDUL ACARA',
        fontFamily: 'Anton',
        fontSize: 110,
        fontWeight: 400,
        color: '#ffffff',
        align: 'center',
        shadow: true,
        stroke: '#000000',
        strokeWidth: 0,
      },
    }),
    baseLayer({
      name: 'Subtitle',
      type: 'text',
      x: 560,
      y: 545,
      w: 800,
      h: 60,
      zIndex: 2,
      animIn: '',
      animOut: '',
      props: {
        text: '{{title}}',
        fontFamily: 'Outfit',
        fontSize: 34,
        fontWeight: 700,
        color: '#e5e5e5',
        align: 'center',
      },
    }),
  ];
}

export function presetScorebug(): DesignerLayer[] {
  return [
    baseLayer({
      name: 'BG skor',
      type: 'shape',
      x: 60,
      y: 60,
      w: 460,
      h: 110,
      zIndex: 1,
      animIn: '',
      animOut: '',
      props: { shape: 'rect', fill: '#0a0a0a', bgOpacity: 92, radius: 16, borderColor: '#ffffff', borderWidth: 1 },
    }),
    baseLayer({
      name: 'Tim A',
      type: 'text',
      x: 90,
      y: 75,
      w: 250,
      h: 45,
      zIndex: 2,
      animIn: '',
      animOut: '',
      props: { text: '{{teamA}}', fontFamily: 'Outfit', fontSize: 34, fontWeight: 900, color: '#ffffff', align: 'left' },
    }),
    baseLayer({
      name: 'Skor',
      type: 'text',
      x: 340,
      y: 75,
      w: 150,
      h: 80,
      zIndex: 3,
      animIn: '',
      animOut: '',
      props: { text: '{{scoreA}} - {{scoreB}}', fontFamily: 'Anton', fontSize: 52, fontWeight: 400, color: '#ffffff', align: 'center' },
    }),
    baseLayer({
      name: 'Clock',
      type: 'clock',
      x: 90,
      y: 122,
      w: 250,
      h: 36,
      zIndex: 4,
      animIn: '',
      animOut: '',
      props: { fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 700, color: '#a3a3a3', align: 'left', showSeconds: true },
    }),
  ];
}

export function presetTicker(): DesignerLayer[] {
  return [
    baseLayer({
      name: 'Ticker BG',
      type: 'shape',
      x: 0,
      y: 990,
      w: 1920,
      h: 90,
      zIndex: 1,
      animIn: '',
      animOut: '',
      props: { shape: 'rect', fill: '#ffffff', bgOpacity: 95, radius: 0 },
    }),
    baseLayer({
      name: 'Ticker teks',
      type: 'ticker',
      x: 40,
      y: 1000,
      w: 1840,
      h: 70,
      zIndex: 2,
      animIn: '',
      animOut: '',
      props: {
        text: '{{message}} • Jangan lupa follow! • {{username}} baru bergabung',
        fontFamily: 'Outfit',
        fontSize: 40,
        fontWeight: 700,
        color: '#ffffff',
        align: 'left',
        speed: 22,
      },
    }),
  ];
}

export const PRESETS: { id: string; title: string; desc: string; make: () => DesignerLayer[] }[] = [
  { id: 'lower-third', title: 'Lower Third', desc: 'Nama + keterangan + accent bar', make: presetLowerThird },
  { id: 'title', title: 'Title Fullscreen', desc: 'Judul besar tengah layar', make: presetTitle },
  { id: 'scorebug', title: 'Scorebug', desc: 'Skor + clock pojok kiri atas', make: presetScorebug },
  { id: 'ticker', title: 'Ticker Bawah', desc: 'Teks berjalan bawah layar', make: presetTicker },
];

export function newTextLayer(zIndex: number): DesignerLayer {
  return baseLayer({
    name: 'Teks baru',
    type: 'text',
    x: 700,
    y: 480,
    w: 520,
    h: 90,
    zIndex,
    animIn: '',
    animOut: '',
    props: { text: 'Teks baru', fontFamily: 'Outfit', fontSize: 54, fontWeight: 900, color: '#ffffff', align: 'left', shadow: true, autoSize: true },
  });
}

export function newShapeLayer(zIndex: number): DesignerLayer {
  return baseLayer({
    name: 'Shape baru',
    type: 'shape',
    x: 760,
    y: 500,
    w: 400,
    h: 160,
    zIndex,
    animIn: '',
    animOut: '',
    props: { shape: 'rect', fill: '#ffffff', bgOpacity: 100, radius: 20, borderColor: '#ffffff', borderWidth: 0 },
  });
}

export function newImageLayer(zIndex: number, src = ''): DesignerLayer {
  return baseLayer({
    name: 'Image baru',
    type: 'image',
    x: 800,
    y: 420,
    w: 320,
    h: 240,
    zIndex,
    animIn: '',
    animOut: '',
    props: { src, fit: 'contain' },
  });
}
