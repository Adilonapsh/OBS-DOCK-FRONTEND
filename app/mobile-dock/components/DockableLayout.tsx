'use client';

/**
 * DockableLayout — Resizable & Dockable layout ala OBS/ VS Code untuk mobile-dock.
 *
 * - Semua panel bisa di-drag ke zona atas / bawah / kiri / kanan / tengah (tab stacking).
 * - Split bisa di-resize (mouse + touch via Pointer Events).
 * - Tab yang tidak aktif tetap mounted (hidden) agar iframe tidak reload saat pindah tab.
 * - State layout dikontrol dari parent (page) supaya bisa di-persist ke Supabase + localStorage.
 *
 * Model:
 *   DockNode = SplitNode { dir: 'row' | 'col', sizes: number[], children }
 *            | TabsNode  { panels: string[], active: string }
 *   DockLayoutState = { version: 1, root: DockNode, hidden: string[] }
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GripVertical, X } from 'lucide-react';

// ------------------------------------------------------------------ types

export type DockDir = 'row' | 'col';
export type DockDropPos = 'center' | 'top' | 'bottom' | 'left' | 'right';

export type DockNode =
  | { type: 'split'; id: string; dir: DockDir; sizes: number[]; children: DockNode[] }
  | { type: 'tabs'; id: string; panels: string[]; active: string };

export type DockLayoutState = {
  version: 1;
  root: DockNode;
  hidden: string[];
};

export const DOCK_LAYOUT_LS = 'mobile-dock:layout-v1';

let dockIdCounter = 0;
function nextDockId(prefix: string): string {
  dockIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${dockIdCounter}`;
}

// ------------------------------------------------------- layout factories

/** Layout bawaan: Deck | Control + [Alert|Monitor] | [Chat|BGM] */
export function createDefaultDockLayout(): DockLayoutState {
  return {
    version: 1,
    root: {
      type: 'split',
      id: 'root',
      dir: 'row',
      sizes: [25, 45, 30],
      children: [
        { type: 'tabs', id: 'tabs_deck', panels: ['deck'], active: 'deck' },
        {
          type: 'split',
          id: 'split_mid',
          dir: 'col',
          sizes: [55, 45],
          children: [
            { type: 'tabs', id: 'tabs_control', panels: ['control'], active: 'control' },
            { type: 'tabs', id: 'tabs_alert', panels: ['alert', 'monitor'], active: 'alert' },
          ],
        },
        { type: 'tabs', id: 'tabs_chat', panels: ['chat', 'bgm'], active: 'chat' },
      ],
    },
    hidden: [],
  };
}

/** Daftar panel yang terlihat (urutan baca kiri→kanan, atas→bawah). */
export function dockVisiblePanels(root: DockNode): string[] {
  if (root.type === 'tabs') return [...root.panels];
  return root.children.flatMap(dockVisiblePanels);
}

/** Sembunyikan panel (minimal 1 panel tetap terlihat). */
function hidePanelInLayout(layout: DockLayoutState, panelId: string): DockLayoutState {
  if (dockVisiblePanels(layout.root).length <= 1) return layout;
  const next = cloneNode(layout.root);
  removePanelFromNode(next, panelId);
  const clean = normalizeNode(next);
  if (!clean) return layout;
  return { version: 1, root: clean, hidden: [...layout.hidden, panelId] };
}

/** Kembalikan panel yang di-hidden ke tabs pertama (dipakai menu Layout di parent). */
export function restoreDockPanel(layout: DockLayoutState, panelId: string): DockLayoutState {
  if (!layout.hidden.includes(panelId)) return layout;
  const next = cloneNode(layout.root);
  const t = firstTabs(next);
  if (!t) return layout;
  t.panels.push(panelId);
  t.active = panelId;
  return { version: 1, root: next, hidden: layout.hidden.filter((p) => p !== panelId) };
}

/** Hapus panel dari layout (visible + hidden). Dipakai saat panel kustom dihapus. */
export function removeDockPanel(layout: DockLayoutState, panelId: string): DockLayoutState {
  const next = cloneNode(layout.root);
  removePanelFromNode(next, panelId);
  const clean = normalizeNode(next);
  return {
    version: 1,
    root: clean ?? { type: 'tabs', id: nextDockId('tabs'), panels: [], active: '' },
    hidden: layout.hidden.filter((p) => p !== panelId),
  };
}

// ------------------------------------------------------- tree operations

function cloneNode<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function fixSizes(node: Extract<DockNode, { type: 'split' }>): void {
  const n = node.children.length;
  if (node.sizes.length !== n || node.sizes.some((s) => !(s > 0))) {
    node.sizes = Array.from({ length: n }, () => 100 / Math.max(1, n));
    return;
  }
  const total = node.sizes.reduce((a, b) => a + b, 0);
  if (!(total > 0)) node.sizes = Array.from({ length: n }, () => 100 / Math.max(1, n));
  else node.sizes = node.sizes.map((s) => (s / total) * 100);
}

/** Normalisasi: buang tabs kosong, collapse split 1 anak, perbaiki sizes. Return null bila kosong. */
function normalizeNode(node: DockNode): DockNode | null {
  if (node.type === 'tabs') {
    if (node.panels.length === 0) return null;
    if (!node.panels.includes(node.active)) node.active = node.panels[0];
    return node;
  }
  const kids: DockNode[] = [];
  for (const c of node.children) {
    const n = normalizeNode(c);
    if (n) kids.push(n);
  }
  if (kids.length === 0) return null;
  if (kids.length === 1) return kids[0];
  node.children = kids;
  fixSizes(node);
  return node;
}

function removePanelFromNode(node: DockNode, panelId: string): boolean {
  if (node.type === 'tabs') {
    const i = node.panels.indexOf(panelId);
    if (i === -1) return false;
    node.panels.splice(i, 1);
    if (node.active === panelId) node.active = node.panels[0] ?? '';
    return true;
  }
  return node.children.some((c) => removePanelFromNode(c, panelId));
}

function findTabs(node: DockNode, tabsId: string): Extract<DockNode, { type: 'tabs' }> | null {
  if (node.type === 'tabs') return node.id === tabsId ? node : null;
  for (const c of node.children) {
    const f = findTabs(c, tabsId);
    if (f) return f;
  }
  return null;
}

function firstTabs(node: DockNode): Extract<DockNode, { type: 'tabs' }> | null {
  if (node.type === 'tabs') return node;
  for (const c of node.children) {
    const f = firstTabs(c);
    if (f) return f;
  }
  return null;
}

function replaceNode(node: DockNode, targetId: string, replacement: DockNode): DockNode {
  if (node.type === 'tabs') return node.id === targetId ? replacement : node;
  return {
    ...node,
    children: node.children.map((c) => (c.type === 'tabs' && c.id === targetId ? replacement : replaceNode(c, targetId, replacement))),
  };
}

/** Pindah panel ke zona target. */
function movePanel(root: DockNode, panelId: string, targetTabsId: string, pos: DockDropPos): DockNode {
  const next = cloneNode(root);
  const target = findTabs(next, targetTabsId);
  if (!target) return root;
  // Drop ke tab-nya sendiri di tengah = no-op
  if (pos === 'center' && target.panels.includes(panelId) && target.panels.length === 1) return root;

  removePanelFromNode(next, panelId);

  if (pos === 'center') {
    const t = findTabs(next, targetTabsId);
    if (!t) return root;
    if (!t.panels.includes(panelId)) t.panels.push(panelId);
    t.active = panelId;
  } else {
    const dir: DockDir = pos === 'left' || pos === 'right' ? 'row' : 'col';
    const newTabs: DockNode = { type: 'tabs', id: nextDockId('tabs'), panels: [panelId], active: panelId };
    const oldTarget = findTabs(next, targetTabsId);
    if (!oldTarget) return root;
    const kept: DockNode = { ...oldTarget, panels: [...oldTarget.panels], id: oldTarget.id };
    const children = pos === 'left' || pos === 'top' ? [newTabs, kept] : [kept, newTabs];
    const split: DockNode = { type: 'split', id: nextDockId('split'), dir, sizes: [50, 50], children };
    return normalizeNode(replaceNode(next, targetTabsId, split)) ?? next;
  }
  return normalizeNode(next) ?? root;
}

/** Pastikan layout valid terhadap daftar panel yang dikenal. Panel baru ikut ditambahkan. */
export function sanitizeDockLayout(saved: unknown, knownPanels: string[]): DockLayoutState {
  const fallback = createDefaultDockLayout();
  try {
    if (!saved || typeof saved !== 'object') return fallback;
    const s = saved as Partial<DockLayoutState>;
    if (s.version !== 1 || !s.root || typeof s.root !== 'object') return fallback;
    const root = cloneNode(s.root as DockNode);
    const hidden = Array.isArray(s.hidden) ? s.hidden.filter((p): p is string => typeof p === 'string') : [];

    // Buang panel yang tidak dikenal
    const prune = (n: DockNode): void => {
      if (n.type === 'tabs') {
        n.panels = n.panels.filter((p) => knownPanels.includes(p));
        if (!n.panels.includes(n.active)) n.active = n.panels[0] ?? '';
        return;
      }
      n.children.forEach(prune);
    };
    prune(root);
    let clean = normalizeNode(root);

    // Panel dikenal yang hilang (baru / ke-hidden) → kembalikan: hidden tetap hidden,
    // yang visible tapi hilang ditambahkan ke tabs pertama.
    const visible = clean ? dockVisiblePanels(clean) : [];
    const hiddenSet = new Set(hidden.filter((p) => knownPanels.includes(p)));
    const missing = knownPanels.filter((p) => !visible.includes(p) && !hiddenSet.has(p));
    if (missing.length > 0) {
      if (!clean) {
        clean = { type: 'tabs', id: nextDockId('tabs'), panels: [...missing], active: missing[0] };
      } else {
        const t = firstTabs(clean);
        if (t) {
          t.panels.push(...missing);
          if (!t.active) t.active = t.panels[0];
        }
      }
    }
    if (!clean) return fallback;
    return { version: 1, root: clean, hidden: [...hiddenSet] };
  } catch {
    return fallback;
  }
}

// ------------------------------------------------------- drop-zone helpers

function zoneFromElement(el: Element | null): { tabsId: string; pos: DockDropPos } | null {
  const z = el?.closest?.('[data-dock-zone]');
  if (!z) return null;
  const tabsId = z.getAttribute('data-dock-tabs');
  const pos = z.getAttribute('data-dock-zone') as DockDropPos | null;
  if (!tabsId || !pos) return null;
  return { tabsId, pos };
}

// ---------------------------------------------------------------- component

export type DockableLayoutProps = {
  layout: DockLayoutState;
  onChange: (next: DockLayoutState) => void;
  /** Panel yang dikenal, urutan = urutan default tab & nav mobile */
  panels: string[];
  renderTitle: (panelId: string) => React.ReactNode;
  renderActions?: (panelId: string) => React.ReactNode;
  renderBody: (panelId: string) => React.ReactNode;
  isMobile: boolean;
  mobilePanel: string;
  onMobilePanelChange: (panelId: string) => void;
  /** Dipanggil saat resize aktif agar parent bisa matikan pointer-events iframe */
  onResizeActive?: (active: boolean) => void;
  onResetLayout?: () => void;
};

export default function DockableLayout(props: DockableLayoutProps) {
  const { layout, onChange, renderTitle, renderBody, isMobile, mobilePanel, onMobilePanelChange, onResizeActive } = props;
  const [dragPanel, setDragPanel] = useState<string | null>(null);
  const [hoverZone, setHoverZone] = useState<{ tabsId: string; pos: DockDropPos } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const visible = useMemo(() => dockVisiblePanels(layout.root), [layout.root]);
  const visibleSet = useMemo(() => new Set(visible), [visible]);
  const effMobile = visibleSet.has(mobilePanel) ? mobilePanel : visible[0] ?? '';

  // Jaga agar panel mobile selalu valid mengikuti layout
  useEffect(() => {
    if (effMobile && effMobile !== mobilePanel) onMobilePanelChange(effMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effMobile]);

  // ---- hide (restore dilakukan parent via restoreDockPanel + menu Layout)
  const hidePanel = useCallback(
    (panelId: string) => {
      onChange(hidePanelInLayout(layout, panelId));
    },
    [layout, onChange]
  );

  // ---- drag & drop (pointer based, works with touch + mouse).
  // Handler fresh tiap render: closure selalu baca layout/onChange terbaru,
  // listener window didaftar sekali per drag lalu dilepas.
  const beginDrag = (e: React.PointerEvent, panelId: string) => {
    // Hanya tombol kiri / sentuhan
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const drag = { panelId, startX: e.clientX, startY: e.clientY, active: false };
    const onMove = (ev: PointerEvent) => {
      if (!drag.active) {
        if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < 6) return;
        drag.active = true;
        setDragPanel(drag.panelId);
      }
      setGhostPos({ x: ev.clientX, y: ev.clientY });
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      setHoverZone(zoneFromElement(el));
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointerup', onUp);
      setDragPanel(null);
      setGhostPos(null);
      setHoverZone(null);
      if (drag.active) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const zone = zoneFromElement(el);
        if (zone) {
          onChange({ ...layout, root: movePanel(layout.root, drag.panelId, zone.tabsId, zone.pos), hidden: layout.hidden });
        }
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // ---- resize (state lokal per-drag, tanpa ref)
  const beginResize = (
    e: React.PointerEvent, splitId: string, index: number, dir: DockDir, sizes: number[]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const container = (e.currentTarget as HTMLElement).parentElement;
    const rect = container?.getBoundingClientRect();
    const containerSize = dir === 'row' ? rect?.width ?? 1 : rect?.height ?? 1;
    const start = dir === 'row' ? e.clientX : e.clientY;
    // Ukuran awal di-capture sekali; tiap move dihitung dari TOTAL delta sejak start.
    // (Jangan akumulasi ke baseSizes — itu bikin resize lebih cepat dari mouse.)
    const startSizes = [...sizes];
    onResizeActive?.(true);
    const onMove = (ev: PointerEvent) => {
      const deltaPct = (((dir === 'row' ? ev.clientX : ev.clientY) - start) / Math.max(1, containerSize)) * 100;
      const a = Math.min(85, Math.max(10, startSizes[index] + deltaPct));
      const b = Math.min(85, Math.max(10, startSizes[index + 1] - deltaPct));
      // Kompensasi bila salah satu mentok clamp
      const applied = Math.min(a - startSizes[index], startSizes[index + 1] - b);
      const next = [...startSizes];
      next[index] = startSizes[index] + applied;
      next[index + 1] = startSizes[index + 1] - applied;
      const walk = (n: DockNode): DockNode => {
        if (n.type === 'split' && n.id === splitId) return { ...n, sizes: next };
        if (n.type === 'split') return { ...n, children: n.children.map(walk) };
        return n;
      };
      onChange({ ...layout, root: walk(layout.root) as DockNode, hidden: layout.hidden });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      onResizeActive?.(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const setActive = useCallback(
    (tabsId: string, panelId: string) => {
      const walk = (n: DockNode): DockNode => {
        if (n.type === 'tabs' && n.id === tabsId) return { ...n, active: panelId };
        if (n.type === 'split') return { ...n, children: n.children.map(walk) };
        return n;
      };
      onChange({ ...layout, root: walk(layout.root) });
    },
    [layout, onChange]
  );

  // ---- render nodes (desktop)
  const renderNode = (node: DockNode): React.ReactNode => {
    if (node.type === 'tabs') {
      return (
        <div className="relative flex flex-col min-h-0 min-w-0 flex-1 basis-0 bg-[var(--panel-bg)] border border-[var(--border-color)] overflow-hidden" data-dock-tabs-root={node.id}>
          {/* Tab bar = juga handle drag untuk panel aktif */}
          <div className="flex items-stretch gap-0.5 p-1 bg-[var(--bg-color)] border-b border-[var(--border-color)] overflow-x-auto shrink-0">
            {node.panels.map((p) => {
              const active = node.active === p;
              // Tab-bar juga target drop (tengah = gabung jadi tab) — seperti browser/VS Code.
              const tabDropHot = !!dragPanel && hoverZone?.tabsId === node.id && hoverZone?.pos === 'center';
              return (
                <div
                  key={p}
                  data-dock-zone="center"
                  data-dock-tabs={node.id}
                  onPointerDown={(e) => {
                    // Drag mulai dari grip atau dari tab non-aktif; tab aktif diklik biasa untuk select
                    const fromGrip = (e.target as HTMLElement).closest?.('[data-dock-grip]');
                    if (fromGrip || !active) beginDrag(e, p);
                  }}
                  onClick={() => setActive(node.id, p)}
                  className={`group flex items-center gap-1 pl-1.5 pr-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md cursor-grab active:cursor-grabbing select-none shrink-0 touch-none ${
                    active ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-label)] hover:text-[var(--text-main)] hover:bg-[var(--panel-bg)]'
                  } ${tabDropHot ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/30 text-white' : ''}`}
                  title={active ? 'Drag untuk pindahkan panel • drop panel lain ke sini untuk gabung' : `Aktifkan ${p} • drop panel ke sini untuk gabung`}
                >
                  <span data-dock-grip className={`cursor-grab active:cursor-grabbing ${active ? 'text-white/80' : 'text-[var(--text-label)]'}`}>
                    <GripVertical className="w-3 h-3" />
                  </span>
                  <span className="flex items-center gap-1 max-w-[120px] truncate">{renderTitle(p)}</span>
                  {visible.length > 1 && (
                    <button
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        hidePanel(p);
                      }}
                      className={`p-0.5 rounded ${active ? 'hover:bg-white/20' : 'hover:bg-[var(--bg-color)]'} opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                      title="Sembunyikan panel (bisa dikembalikan via menu Layout)"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {/* Bodies: semua tetap mounted, yang non-aktif hidden (iframe tidak reload) */}
          <div className="flex-1 min-h-0 relative">
            {node.panels.map((p) => (
              <div key={p} className={node.active === p ? 'absolute inset-0 flex flex-col min-h-0' : 'hidden'} aria-hidden={node.active !== p}>
                {renderBody(p)}
              </div>
            ))}
          </div>
          {/* Drop zones overlay saat dragging */}
          {dragPanel && <DropZones tabsId={node.id} hover={hoverZone} panels={node.panels} dragPanel={dragPanel} />}
        </div>
      );
    }
    // split
    const isRow = node.dir === 'row';
    return (
      <div className={`flex min-h-0 min-w-0 flex-1 basis-0 gap-0.5 ${isRow ? 'flex-row' : 'flex-col'}`}>
        {node.children.map((child, i) => (
          <React.Fragment key={child.id}>
            {i > 0 && (
              <div
                onPointerDown={(e) => beginResize(e, node.id, i - 1, node.dir, node.sizes)}
                className={`${isRow ? 'w-3 cursor-col-resize flex-row' : 'h-3 cursor-row-resize flex-col'} hidden md:flex self-stretch items-center justify-center group shrink-0 touch-none`}
                style={{ touchAction: 'none' }}
              >
                <div className={`${isRow ? 'w-[2px] h-8' : 'h-[2px] w-10'} bg-[var(--handle-color)] group-hover:bg-[var(--accent)]`} />
              </div>
            )}
            <div className="flex min-h-0 min-w-0" style={{ flexGrow: node.sizes[i] ?? 1, flexShrink: 1, flexBasis: 0 }}>
              {renderNode(child)}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ---- mobile: satu panel penuh
  if (isMobile) {
    if (!effMobile) return null;
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-[var(--panel-bg)] border border-[var(--border-color)] overflow-hidden">{renderBody(effMobile)}</div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex h-full select-none relative gap-0.5">
      {renderNode(layout.root)}
      {/* Ghost saat drag */}
      {dragPanel && ghostPos && (
        <div
          className="fixed z-[300] pointer-events-none px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-[11px] font-bold shadow-xl opacity-90"
          style={{ left: ghostPos.x + 12, top: ghostPos.y + 12 }}
        >
          {renderTitle(dragPanel)}
        </div>
      )}
    </div>
  );
}

/** Overlay 5 zona drop (tengah = gabung jadi tab, tepi = split). */
function DropZones({ tabsId, hover, panels, dragPanel }: { tabsId: string; pos?: DockDropPos; hover: { tabsId: string; pos: DockDropPos } | null; panels: string[]; dragPanel: string }) {
  const isSelfSingle = panels.length === 1 && panels[0] === dragPanel;
  const edge = 'absolute flex items-center justify-center transition-colors cursor-copy';
  const on = (pos: DockDropPos) => hover?.tabsId === tabsId && hover?.pos === pos;
  const cls = (pos: DockDropPos, base: string) =>
    `${edge} ${base} ${on(pos) ? 'bg-[var(--accent)]/40 border-[var(--accent)]' : 'bg-[var(--accent)]/5 border-transparent hover:bg-[var(--accent)]/20'} border-2 border-dashed`;
  const tag = (t: string) => (
    <span className="text-[9px] font-black uppercase tracking-widest text-white bg-black/50 px-1.5 py-0.5 rounded pointer-events-none">{t}</span>
  );
  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {!isSelfSingle && (
        <>
          <div data-dock-zone="top" data-dock-tabs={tabsId} className={cls('top', 'top-0 left-0 right-0 h-[22%] pointer-events-auto')}>{tag('▲ Atas')}</div>
          <div data-dock-zone="bottom" data-dock-tabs={tabsId} className={cls('bottom', 'bottom-0 left-0 right-0 h-[22%] pointer-events-auto')}>{tag('▼ Bawah')}</div>
          <div data-dock-zone="left" data-dock-tabs={tabsId} className={cls('left', 'left-0 top-[22%] bottom-[22%] w-[22%] pointer-events-auto')}>{tag('◀')}</div>
          <div data-dock-zone="right" data-dock-tabs={tabsId} className={cls('right', 'right-0 top-[22%] bottom-[22%] w-[22%] pointer-events-auto')}>{tag('▶')}</div>
        </>
      )}
      <div
        data-dock-zone="center"
        data-dock-tabs={tabsId}
        className={`absolute left-[22%] right-[22%] top-[22%] bottom-[22%] flex items-center justify-center border-2 border-dashed transition-colors pointer-events-auto cursor-copy ${
          on('center') ? 'bg-[var(--accent)]/40 border-[var(--accent)]' : 'bg-black/20 border-white/20'
        }`}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/50 px-2 py-1 rounded pointer-events-none">+ Gabung Tab</span>
      </div>
    </div>
  );
}
