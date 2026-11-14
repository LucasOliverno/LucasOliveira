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
