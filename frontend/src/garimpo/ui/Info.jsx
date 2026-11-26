// Inspetor (cartão do que está sob o mouse ou fixado) e Guia da mina.
import * as E from '../engine.js';
import { RELICS, ROOMS, FAMILIES, DLCS, CARDS, MAX_FOLEGO, OUT_DRAWS } from '../data.js';
import { ROOM_COLOR, ROOM_GLYPH, PLAYER_HEX, roomLabel, roomDesc, relicName } from './text.js';

const TUNNELS = {
  t: { name: 'Túnel', cost: '🔦1', desc: 'passagem comum escorada com madeira' },
  dark: { name: 'Túnel apertado', cost: '🔦2', desc: 'custa 🔦1 se você jogou uma carta com 🔦2+ neste turno. Relíquia pesada (✦20+): +1. A Medusa não enxerga através' },
  rail: { name: 'Trilho', cost: '🔦1', desc: 'a pé custa 🔦1; o carrinho anda até 3 salas de trilho por 🔦1 e faz 💥2' },
  ramp: { name: 'Rampa', cost: '🔦1', desc: 'mão única: só dá para ir no sentido da seta' },
  elev: { name: 'Elevador', cost: '🤝2', desc: 'liga a sala à Boca da Mina; faz 💥1' },
  lad: { name: 'Escada', cost: '🔦1 descendo · 🔦2 subindo', desc: 'mapa clássico' },
  shaft: { name: 'Poço', cost: '🔦1', desc: 'só desce; faz 💥2 (mapa clássico)' },
};
const DEN = 'Toca de Bicho: ao atravessar, pague ⛏1 ou perca 🫧1';
const RUBBLE = 'Desabamento: bloqueado até alguém gastar ⛏3 ou uma Dinamite (fica aberto para todos)';

function RoomInfo({ s, you, id, myTurn, onGo }) {
  const kind = s.map.nodes[id]?.kind || 'vazia';
  const me = s.players[you];
  const here = s.players.filter((q) => E.inMine(q) && q.node === id);
  const relic = s.relics[id];
  const zone = s.map.nodes[id]?.zone;
  let go = null;
  if (myTurn && me && E.inMine(me) && me.node !== id) {
    const c = E.moveCost(s, me, me.node, id);
    if (!c.err) go = { c, ok: c.luz <= me.t.luz && c.prosa <= me.t.prosa && !me.t.tired };
  }
  const first = me?.visited?.includes(id);
  return (
    <>
      <div className="gm-info-head" style={{ '--rc': ROOM_COLOR[kind] || '#5b4a3a' }}>
        <span className="ico">{ROOM_GLYPH[kind] || '⛏'}</span>
        <div><b>{roomLabel(kind)}</b>{zone && <small>{zone === 'segura' ? 'peça segura' : 'peça do Fundo'} · {s.map.nodes[id].lv} peça(s) da Boca</small>}</div>
      </div>
      <p>{roomDesc(kind) || 'Sem efeito especial.'}</p>
      <ul>
        {relic && <li>🏺 Relíquia: <b>{relicName(relic)}</b> — pegue ao entrar (sobe a Fúria)</li>}
        {s.crystals[id] > 0 && <li>💠 {s.crystals[id]} cristal(is) aqui{me?.geodes?.includes(id) ? ' (você já pegou o seu)' : ''}</li>}
        {(ROOMS[kind]?.first) && <li>{first ? '✓ você já visitou (o efeito de primeira visita já foi)' : '★ efeito de primeira visita ainda disponível para você'}</li>}
        {s.grisu.includes(id) && <li>☁️ Grisu: entrar custa 🫧1. ⛏2 ventila</li>}
        {s.cerb?.node === id && <li>🐕 Cérbero ({s.cerb.awake} cabeça(s) acordada(s))</li>}
        {s.medusa?.node === id && <li>🐍 Medusa</li>}
        {here.length > 0 && <li>👥 {here.map((q) => <span key={q.id} className="who" style={{ color: PLAYER_HEX[q.color] }}>{q.name} </span>)}</li>}
      </ul>
      {go && (
        <div className="gm-info-go">
          <span>Ir até aqui: 🔦{go.c.luz}{go.c.prosa ? ` 🤝${go.c.prosa}` : ''}{go.c.den ? ' + Toca' : ''}</span>
          {go.ok && <button type="button" className="hot" onClick={() => onGo(id)}>Ir</button>}
        </div>
      )}
    </>
  );
}

function EdgeInfo({ s, edgeKey }) {
  const e = s.map.edges.find((x) => x.key === edgeKey);
  if (!e) return null;
  const T = TUNNELS[e.type] || TUNNELS.t;
  return (
    <>
      <div className="gm-info-head"><span className="ico">〰</span><div><b>{T.name}</b><small>{roomLabel(E.kindOf(s, e.a))} ↔ {roomLabel(E.kindOf(s, e.b))}</small></div></div>
      <p><b>{T.cost}</b> — {T.desc}</p>
      {e.den && <p>🐾 {DEN}</p>}
      {s.rubble.includes(e.key) && <p>🪨 {RUBBLE}</p>}
    </>
  );
}

function StubInfo({ s, you, node, dir }) {
  const st = E.stubs(s, node).find((x) => x.dir === dir);
  if (!st) return null;
  const me = s.players[you];
  const T = TUNNELS[st.pass.type] || TUNNELS.t;
  const next = s.map.stack?.length;
  const safeLeft = (s.map.stack || []).filter((t) => t && t.zone === 'segura').length;
  return (
    <>
      <div className="gm-info-head"><span className="ico">?</span><div><b>Saída para o escuro</b><small>{({ N: 'norte', S: 'sul', E: 'leste', W: 'oeste' })[dir]} de {roomLabel(E.kindOf(s, node))}</small></div></div>
      {st.pass.type === 'rubble' ? <p>🪨 {RUBBLE}</p> : <p>Passagem: <b>{T.name}</b> ({T.cost}){st.pass.den ? ` · 🐾 ${DEN}` : ''}</p>}
      <p>Ao explorar, você compra a próxima peça do monte ({next} restam{safeLeft ? `, ainda ${safeLeft} segura(s) em cima` : ', agora só do Fundo'}), escolhe a rotação e entra na sala da borda.</p>
      {me?.node === node && <p className="hint">Você está na sala desta saída: clique no marcador para explorar.</p>}
    </>
  );
}

export function InfoCard({ s, you, info, myTurn, onGo, onClose }) {
  if (!info) return null;
  return (
    <div className={`gm-info${info.pinned ? ' pinned' : ''}`} role="status">
      {info.pinned && <button type="button" className="gm-info-x" onClick={onClose} aria-label="Fechar">×</button>}
      {info.room && <RoomInfo s={s} you={you} id={info.room} myTurn={myTurn} onGo={onGo} />}
      {info.edge && <EdgeInfo s={s} edgeKey={info.edge} />}
      {info.stub && <StubInfo s={s} you={you} node={info.stub.node} dir={info.stub.dir} />}
    </div>
  );
}

// ------------------------------------------------------------------ Guia da mina
const SURFACE = [['boca', 'Boca da Mina', 'onde todos começam. Volte aqui com uma Relíquia para sair: Selo de Sobrevivente (✦20)'], ['barracao', 'Barracão', 'descanse: 🤝2 → 🫧+1, uma vez por turno']];
export function Guide({ s, onClose }) {
  const kinds = Object.entries(ROOMS).filter(([k, r]) => (!r.dlc || s.dlc.includes(r.dlc)) && !(k === 'entrada' && s.map.tiles));
  return (
    <div className="gm-modal wide gm-guide" role="dialog" aria-label="Guia da mina">
      <div className="gm-modal-head"><h3>Guia da mina</h3><button type="button" onClick={onClose}>Fechar</button></div>
      <section>
        <h4>Como se anda</h4>
        <ul className="gm-guide-tips">
          <li><b>Anel dourado</b> numa sala = dá para ir agora (clique para andar). <b>Anel branco</b> = onde você está.</li>
          <li><b>?</b> na borda da sua sala = saída para o escuro: pague a passagem, compre uma peça do monte, escolha a rotação e entre.</li>
          <li>Peça de borda <b>clara</b> = segura (soterrado aqui com Relíquia, a turma te resgata). Borda <b>escura</b> = Fundo (soterrado aqui faz 0).</li>
          <li>Passe o mouse em qualquer sala, túnel ou saída para ver o que faz. Clique numa sala longe para fixar o cartão.</li>
        </ul>
      </section>
      <section>
        <h4>Salas</h4>
        <div className="gm-guide-grid">
          {[...SURFACE.map(([k, n, d]) => [k, { name: n, desc: d }]), ...kinds.filter(([k]) => k !== 'barracao' && k !== 'boca')].map(([k, r]) => (
            <div key={k} className="gm-guide-item"><span className="ico" style={{ background: ROOM_COLOR[k] || '#5b4a3a' }}>{ROOM_GLYPH[k] || '⛏'}</span><div><b>{r.name}</b>{r.dlc && <small> · {DLCS[r.dlc]?.name}</small>}<p>{r.desc || '—'}</p></div></div>
          ))}
        </div>
      </section>
      <section>
        <h4>Túneis</h4>
        <div className="gm-guide-grid">
          {['t', 'dark', 'rail', 'ramp', 'elev'].map((k) => <div key={k} className="gm-guide-item"><span className="ico">〰</span><div><b>{TUNNELS[k].name}</b> <small>{TUNNELS[k].cost}</small><p>{TUNNELS[k].desc}</p></div></div>)}
          <div className="gm-guide-item"><span className="ico">🐾</span><div><b>Toca de Bicho</b><p>{DEN}</p></div></div>
          <div className="gm-guide-item"><span className="ico">🪨</span><div><b>Desabamento</b><p>{RUBBLE}</p></div></div>
        </div>
      </section>
      <section>
        <h4>Vida, Fúria e fim de jogo</h4>
        <ul className="gm-guide-tips">
          <li><b>Fôlego:</b> {MAX_FOLEGO} casas. Cada dano é um cubo seu no medidor; curar devolve o cubo para a reserva. Medidor cheio = soterrado.</li>
          <li><b>Fúria:</b> no fim do turno em que entra 🌋 na Fila (menos pela rotação) ou alguém pega Relíquia, saem cubos da Bateia. Pedra preta não faz nada; cubo de jogador vira dano.</li>
          <li><b>Fim:</b> quem sai ou fica soterrado tira {OUT_DRAWS(s.players.length)} cubos da Bateia no próprio turno, sem tomar dano. Acaba quando ninguém mais está na mina. Ganha quem tiver mais pontos.</li>
          <li><b>Relíquias:</b> {Object.keys(RELICS).length} no jogo; as dos Altares perto da Boca valem pouco e as do fundo valem mais.</li>
        </ul>
      </section>
      <section>
        <h4>Famílias de cartas</h4>
        <ul className="gm-guide-tips">
          {Object.entries(FAMILIES).map(([k, f]) => <li key={k}><b style={{ color: f.color }}>{f.name}</b> — {f.desc}. Ex.: {Object.values(CARDS).filter((c) => c.fam === k && c.combo && !c.dlc).slice(0, 3).map((c) => c.name).join(', ')}.</li>)}
          <li>O <b>⚡ combo</b> vale se você jogar outra carta da mesma família no mesmo turno, antes ou depois. Iniciais e a loja base não têm família.</li>
        </ul>
      </section>
    </div>
  );
}
