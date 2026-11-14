import { ZONES, TILE_NAMES, TILE_HINT, FACTIONS, FAC_KEYS, CARGOS, GOALS } from '../data.js';
import { calc, def, tmax } from '../engine.js';
import { Ico, Rich } from './icons.jsx';
import { HAS_ART, artUrl, terrainMap } from './cardutil.js';
import { FacEmblem, GoalEmblem } from './cards.jsx';

// ---------------------------------------------------------------- cidade (grade 4×4 ou arquipélago)

export function City({ s, p, validity, placing, onTile, selected, interactive = true, onHover }) {
  const c = calc(s, p);
  const island = p.tiles.some((t) => t.isl !== 'M');
  const map = !island ? terrainMap(p.terrain) : null; // mapa do terreno por baixo da grade (o arquipélago tem layout próprio)
  return (
    <div className={`city${island ? ' city-island' : ''}${map ? ' city-map' : ''}`} style={map ? { '--map': `url(${map})` } : undefined} role="grid" aria-label={`Cidade de ${p.name}`}>
      {island && <span className="isl-label isl-M">Ilha Principal</span>}
      {island && <span className="isl-label isl-N">Ilha Norte</span>}
      {island && <span className="isl-label isl-L">Ilha Leste</span>}
      {p.tiles.map((t, i) => {
        const b = t.b;
        const d = b ? def(b) : null;
        const zone = d ? d.zones[0] : null;
        const isOn = !b || c.act.has(i);
        const off = b && c.off.includes(i);
        const ok = placing && validity && validity[i] && !validity[i].err;
        const no = placing && !ok;
        const cls = ['tile', `k-${t.k}`];
        if (island) cls.push(`i-${t.isl}`);
        if (b) cls.push('has');
        if (b && !isOn) cls.push(off ? 'is-off' : 'is-sleep');
        if (ok) cls.push('is-ok');
        if (no) cls.push('is-no');
        if (selected === i) cls.push('is-sel');
        if (t.cleared) cls.push('cleared');
        const style = {};
        if (zone) style['--zc'] = ZONES[zone].color;
        if (island) { const o = { M: [0, 0], N: [4, 0], L: [4, 3] }[t.isl]; style.gridColumn = t.x + o[0] + 1; style.gridRow = t.y + o[1] + 1; }
        const tip = b
          ? `${d.name}${off ? ' — inativo (evento)' : !isOn ? ' — inativo: 👥 abaixo do Req' : ''}`
          : `${TILE_NAMES[t.k]}${t.k === 'F' && !t.cleared ? ' (intacta)' : ''}: ${TILE_HINT[t.k]}`;
        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            className={cls.join(' ')}
            style={style}
            disabled={!interactive}
            onClick={() => onTile && onTile(i)}
            onMouseEnter={() => onHover && onHover(i)}
            onMouseLeave={() => onHover && onHover(null)}
            title={tip}
          >
            {b ? (
              <>
                {HAS_ART.has(b.id) && <img className="t-img" src={artUrl(b.id)} alt="" draggable="false" />}
                <span className="t-zone"><Ico n={zone} s={16} /></span>
                <span className="t-name">{d.name}</span>
                {!isOn && <span className="t-state">{off ? 'inativo' : 'Req 👥'}</span>}
                {b.popBonus ? <span className="t-bonus">+{b.popBonus}👥</span> : null}
              </>
            ) : (
              <span className="t-kind">{t.k === '.' ? '' : TILE_NAMES[t.k]}{t.k === 'F' && t.cleared ? 'desmatada' : ''}</span>
            )}
            {ok && <span className="t-plus" aria-hidden="true">{validity[i].upgrade ? '↑' : '+'}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function MiniCity({ p }) {
  const island = p.tiles.some((t) => t.isl !== 'M');
  return (
    <div className={`mini${island ? ' mini-island' : ''}`} aria-hidden="true">
      {p.tiles.map((t, i) => {
        const z = t.b ? def(t.b).zones[0] : null;
        const style = { background: z ? ZONES[z].color : undefined };
        if (island) { const o = { M: [0, 0], N: [4, 0], L: [4, 3] }[t.isl]; style.gridColumn = t.x + o[0] + 1; style.gridRow = t.y + o[1] + 1; }
        return <i key={i} className={`mt k-${t.k}${z ? ' on' : ''}`} style={style} />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------- medidores

export function Meters({ s, p }) {
  const c = calc(s, p);
  const e = c.sur.e;
  const w = c.sur.w;
  return (
    <div className="meters">
      <div className={`mt-i${e < 0 ? ' bad' : ''}`} title="⚡ Energia: capacidade − consumo">
        <Ico n="e" s={20} /><b>{c.cons.e}<small>/{c.cap.e}</small></b><span>Energia {e < 0 ? `(${e})` : `(+${e})`}</span>
      </div>
      <div className={`mt-i${w < 0 ? ' bad' : ''}`} title="💧 Água: capacidade − consumo">
        <Ico n="w" s={20} /><b>{c.cons.w}<small>/{c.cap.w}</small></b><span>Água {w < 0 ? `(${w})` : `(+${w})`}</span>
      </div>
      <div className="mt-i" title="👥 População: 2 (Prefeitura) + edifícios">
        <Ico n="pop" s={20} /><b>{c.pop}</b><span>População</span>
      </div>
      <div className={`mt-i${c.poll >= 6 ? ' bad' : ''}`} title="☁️ Poluição. ≥6: −1 😊 por rodada. ≥9: Smog (−💰1 de Renda)">
        <Ico n="poll" s={20} /><b>{c.poll}</b><span>Poluição</span>
      </div>
      <div className="mt-i mt-appr" title="😊 Aprovação: ≥8 dá +🗳️1; ≤2 = Protestos (compra 4)">
        <Ico n="appr" s={20} />
        <b>{p.approval}</b>
        <span className="bar"><i style={{ width: `${p.approval * 10}%` }} className={p.approval <= 2 ? 'low' : p.approval >= 8 ? 'high' : ''} /></span>
      </div>
      <div className="mt-i" title="Tesouro: guarde até 3 💰 (Empresários +2)">
        <Ico n="v" s={20} /><b>{p.treasury}<small>/{tmax(s, p)}</small></b><span>Tesouro</span>
      </div>
      <div className={`mt-i${p.cubesBag >= 3 ? ' bad' : ''}`} title="Seus cubos 🕵️ no Saco">
        <Ico n="cube" s={20} /><b>{p.cubesBag}</b><span>No Saco</span>
      </div>
      <div className="mt-i" title="Selos: 2 = ⭐1">
        <Ico n="seal" s={20} /><b>{p.seals}</b><span>Selos</span>
      </div>
    </div>
  );
}

export function ResPool({ pool, size = 26 }) {
  return (
    <div className="pool" aria-label="Recursos do turno">
      <span className="pool-i" title="Verba"><Ico n="v" s={size} /><b>{pool.v}</b></span>
      <span className="pool-i" title="Obra"><Ico n="o" s={size} /><b>{pool.o}</b></span>
      <span className="pool-i" title="Articulação"><Ico n="a" s={size} /><b>{pool.a}</b></span>
    </div>
  );
}

// ---------------------------------------------------------------- trilha de Mérito / Cargos

export function MeritTrack({ s }) {
  const marks = Array.from({ length: s.target + 1 }, (_, i) => i);
  const cargoAt = (n) => [...CARGOS].reverse().find((c) => n >= c.min);
  return (
    <div className="track" aria-label="Trilha de Mérito">
      <div className="track-line">
        {marks.map((n) => {
          const here = s.players.filter((p) => p.merit === n);
          const rival = s.solo && s.rival.merit === n;
          const isCargo = CARGOS.some((c) => c.min === n);
          return (
            <div key={n} className={`tk${isCargo ? ' cargo' : ''}${n === s.target ? ' tk-goal' : ''}`} title={cargoAt(n).name}>
              <span className="tk-n">{n}</span>
              <span className="tk-dots">
                {here.map((p) => <i key={p.id} className="disc" style={{ background: p.color }} title={`${p.name}: ⭐${p.merit}`} />)}
                {rival && <i className="disc rival" title={`Rival: ⭐${s.rival.merit}`}>R</i>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Facções (trilhas 0–6)

export function FactionTracks({ s, me }) {
  return (
    <div className="facs">
      {FAC_KEYS.map((f) => {
        const F = FACTIONS[f];
        const holder = s.tokens[f] != null ? s.players[s.tokens[f]] : null;
        return (
          <div key={f} className="fac" style={{ '--fc': F.color }}>
            <div className="fac-head"><FacEmblem f={f} s={30} /><b>{F.name}</b></div>
            <div className="fac-track">
              {[6, 5, 4, 3, 2, 1, 0].map((n) => (
                <div key={n} className={`fac-step${n === 3 ? ' mark' : ''}${n === 5 ? ' ally' : ''}`}>
                  <span className="fn">{n}</span>
                  <span className="fd">{s.players.filter((p) => p.fac[f] === n).map((p) => <i key={p.id} className="disc sm" style={{ background: p.color }} title={`${p.name}: ${n}`} />)}</span>
                  {n === 3 && <span className="fl" title="Marco 3: ⭐1">⭐</span>}
                  {n === 5 && <span className="fl" title="Aliança: ≥5 e único mais alto">🏅</span>}
                </div>
              ))}
            </div>
            <div className="fac-foot">
              {holder ? <span className="fac-token" style={{ background: holder.color }}>Aliança: {holder.name}</span> : <span className="fac-free">Aliança livre</span>}
              <small><Rich t={F.alliance} s={12} /></small>
              {me && me.fac[f] >= 3 && <small className="fac-got">Marco ✓</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- mesa principal

// Linha compacta de medidores de uma cidade (visível para todos na mesa).
export function MetersMini({ s, p }) {
  const c = calc(s, p);
  const e = c.sur.e;
  const w = c.sur.w;
  return (
    <div className="mm">
      <span className={e < 0 ? 'bad' : ''} title="⚡ Energia: consumo / capacidade"><Ico n="e" s={15} />{c.cons.e}/{c.cap.e}</span>
      <span className={w < 0 ? 'bad' : ''} title="💧 Água: consumo / capacidade"><Ico n="w" s={15} />{c.cons.w}/{c.cap.w}</span>
      <span title="👥 População"><Ico n="pop" s={15} />{c.pop}</span>
      <span className={c.poll >= 6 ? 'bad' : ''} title="☁️ Poluição"><Ico n="poll" s={15} />{c.poll}</span>
      <span className={p.approval <= 2 ? 'bad' : p.approval >= 8 ? 'good' : ''} title="😊 Aprovação"><Ico n="appr" s={15} />{p.approval}</span>
      <span title="Tesouro"><Ico n="v" s={15} />{p.treasury}/{tmax(s, p)}</span>
      <span className={p.cubesBag >= 3 ? 'bad' : ''} title="Cubos de suspeita no Saco"><Ico n="cube" s={15} />{p.cubesBag}</span>
      <span title="Selos (2 = ⭐1)"><Ico n="seal" s={15} />{p.seals}</span>
    </div>
  );
}

// Ordem de turnos da rodada: quem já jogou, quem joga agora e quem vem depois.
export function TurnStrip({ s, act }) {
  if (!s.order.length) return null;
  return (
    <ol className="turns" aria-label="Ordem de jogo da rodada">
      {s.order.map((pid, i) => {
        const p = s.players[pid];
        const done = i < s.turnIdx;
        const now = act === pid;
        return (
          <li key={pid} className={`${done ? 'done' : ''}${now ? ' now' : ''}`} style={{ '--pc': p.color }}>
            <i className="disc" style={{ background: p.color }} />
            <span>{p.name}</span>
            {now ? <em>jogando</em> : done ? <em>✓</em> : <em>{i + 1}º</em>}
          </li>
        );
      })}
    </ol>
  );
}

// Centro da mesa: Metas (quem pegou o quê) e Facções (posição de todos) — tudo público.
export function CenterBoard({ s, onGoals }) {
  return (
    <div className="center">
      <section className="c-sec" aria-label="Metas da partida">
        <h3 className="h">Metas <small>Ouro ⭐2 · Prata ⭐1 · clique para reivindicar</small></h3>
        <div className="c-goals">
          {s.goals.slots.map((sl, i) => {
            const g = GOALS.find((x) => x.id === sl.id);
            const who = (k) => (sl[k] === 'R' ? { n: 'Rival', c: '#1B2A41' } : sl[k] != null ? { n: s.players[sl[k]].name, c: s.players[sl[k]].color } : null);
            const gold = who('gold');
            const silver = who('silver');
            return (
              <button type="button" key={sl.id + i} className="cg" onClick={onGoals} title={`${g.name}: ${g.t}`}>
                <span className="cg-h"><GoalEmblem id={g.id} s={34} /><span className="gid">{g.id}</span><b>{g.name}</b></span>
                <span className="cg-t"><Rich t={g.t} s={12} /></span>
                <span className="cg-m">
                  <span className={`cg-medal${gold ? ' got' : ''}`}>🥇 {gold ? <><i className="disc sm" style={{ background: gold.c }} />{gold.n}</> : 'livre'}</span>
                  <span className={`cg-medal${silver ? ' got' : ''}`}>🥈 {silver ? <><i className="disc sm" style={{ background: silver.c }} />{silver.n}</> : 'livre'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="c-sec" aria-label="Facções">
        <h3 className="h">Facções <small>marco 3 = ⭐1 · Aliança: ≥5 e único mais alto</small></h3>
        <div className="c-facs">
          {FAC_KEYS.map((f) => {
            const F = FACTIONS[f];
            const holder = s.tokens[f] != null ? s.players[s.tokens[f]] : null;
            return (
              <div key={f} className="cf" style={{ '--fc': F.color }}>
                <div className="cf-h"><FacEmblem f={f} s={26} /><b>{F.name}</b></div>
                <div className="cf-rows">
                  {s.players.map((p) => (
                    <div key={p.id} className="cf-r" title={`${p.name}: ${p.fac[f]}`}>
                      <i className="disc sm" style={{ background: p.color }} />
                      <span className="cf-bar">{[1, 2, 3, 4, 5, 6].map((n) => <u key={n} className={`${p.fac[f] >= n ? 'on' : ''}${n === 3 ? ' mk' : ''}${n === 5 ? ' al' : ''}`} />)}</span>
                      <b>{p.fac[f]}</b>
                    </div>
                  ))}
                </div>
                <div className="cf-f">{holder ? <span className="fac-token" style={{ background: holder.color }}>Aliança: {holder.name}</span> : <span className="fac-free">Aliança livre</span>}</div>
              </div>
            );
          })}
        </div>
      </section>
      {s.solo && (
        <section className="c-sec c-rival" aria-label="O Rival">
          <h3 className="h"><i className="disc rival">R</i> O Rival <small>avança sozinho no fim de cada rodada</small></h3>
          <p>⭐ <b>{s.rival.merit}</b> · selos {s.rival.seals}</p>
        </section>
      )}
    </div>
  );
}
