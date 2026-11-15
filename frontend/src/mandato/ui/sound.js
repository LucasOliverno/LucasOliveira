// Aviso sonoro curto ("sua vez") com Web Audio, sem arquivos. Silencioso se o navegador bloquear o áudio.
let ctx = null;

export function chime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    [[660, 0], [880, 0.12]].forEach(([f, d]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + 0.3);
    });
  } catch { /* sem áudio */ }
}

const KEY = 'mandato:muted';
export const loadMuted = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const saveMuted = (v) => { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* sem armazenamento */ } };

// Efeitos curtos sintetizados (sem arquivos): moeda, carta, obra, sino da Fiscalização e fanfarra de ⭐.
const NOTES = {
  coin: [[1320, 0, 0.08, 'triangle'], [1760, 0.07, 0.12, 'triangle']],
  card: [[420, 0, 0.05, 'square', 0.03], [300, 0.04, 0.06, 'square', 0.03]],
  build: [[110, 0, 0.14, 'sawtooth', 0.09], [82, 0.12, 0.16, 'sawtooth', 0.08], [140, 0.26, 0.1, 'square', 0.05]],
  bell: [[988, 0, 0.5, 'sine'], [1318, 0.02, 0.45, 'sine', 0.06], [988, 0.35, 0.5, 'sine']],
  fanfare: [[523, 0, 0.14, 'triangle'], [659, 0.13, 0.14, 'triangle'], [784, 0.26, 0.3, 'triangle']],
};
export function sfx(kind) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || !NOTES[kind]) return;
    ctx = ctx || new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    NOTES[kind].forEach(([f, d, len, type, vol = 0.1]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(vol, t0 + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + len);
      o.connect(g).connect(ctx.destination);
      o.start(t0 + d);
      o.stop(t0 + d + len + 0.02);
    });
  } catch { /* sem áudio */ }
}
