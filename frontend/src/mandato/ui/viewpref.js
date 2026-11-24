import { useSyncExternalStore } from 'react';

// Visualização da mesa: 'mesa' (mesa 3D estilo tabletop, Three.js), '3d' (cidades em sprites isométricos) ou '2d' (grade plana).
export const VIEWS = [['mesa', 'Mesa 3D'], ['3d', 'Cidades 2.5D'], ['2d', 'Grade 2D']];
const KEY = 'mandato.view';
const subs = new Set();
const ok = (v) => VIEWS.some(([k]) => k === v);
let cur = (() => { try { const v = localStorage.getItem(KEY); return ok(v) ? v : 'mesa'; } catch { return 'mesa'; } })();

export const getView = () => cur;
export function setView(v) {
  cur = v;
  try { localStorage.setItem(KEY, v); } catch { /* sem armazenamento */ }
  subs.forEach((f) => f());
}
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const useView = () => useSyncExternalStore(subscribe, getView, () => 'mesa');
