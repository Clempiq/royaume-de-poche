import { useEffect, useReducer, useRef, useState } from 'react'
import { creerCombat, avancer, agir, tourMonstre, bilanCombat, vivants, unite, competenceParId } from '../engine/battle.js'
import { CLASSES } from '../data/heroes.js'
import { CONSOMMABLES } from '../data/items.js'
import { efficacite } from '../data/types.js'
import { Barre, Type, art } from './commun.jsx'
import { son } from './sons.js'

const pause = (ms) => new Promise((r) => setTimeout(r, ms))

export default function Combat({ heros, ennemis, boss, sac, fond, titre, onFin }) {
  const bRef = useRef(null)
  if (!bRef.current) bRef.current = creerCombat({ heros, ennemis, boss, sac })
  const b = bRef.current

  // Ce qui est affiché (PV, PM, K.O.) avance au rythme des animations
  const affRef = useRef(null)
  if (!affRef.current) affRef.current = Object.fromEntries(b.units.map((u) => [u.uid, { pv: u.pv, pm: u.pm, ko: u.ko }]))
  const aff = affRef.current

  const [, rafraichir] = useReducer((x) => x + 1, 0)
  const [annonce, setAnnonce] = useState({ grand: titre || (boss ? 'Un champion vous défie !' : 'Des monstres surgissent !'), petit: '' })
  const [nombres, setNombres] = useState([])
  const [touches, setTouches] = useState({})
  const [agitUid, setAgitUid] = useState(null)
  const [tourDe, setTourDe] = useState(null)
  const [mode, setMode] = useState('attente')
  const [enAttente, setEnAttente] = useState(null)
  const elts = useRef({})
  const zone = useRef(null)
  const lance = useRef(false)

  function position(uid) {
    const el = elts.current[uid]
    const z = zone.current
    if (!el || !z) return { x: 50, y: 50 }
    const r = el.getBoundingClientRect()
    const rz = z.getBoundingClientRect()
    return { x: r.left - rz.left + r.width / 2, y: r.top - rz.top + r.height * 0.3 }
  }

  function afficherNombre(uid, txt, cls, mention) {
    const id = Math.random()
    const p = position(uid)
    setNombres((n) => [...n, { id, ...p, txt, cls, mention }])
    setTimeout(() => setNombres((n) => n.filter((x) => x.id !== id)), 1150)
  }

  async function jouer(evenements) {
    for (const e of evenements) {
      if (e.t === 'action') {
        const s = unite(b, e.source)
        setAgitUid(e.source)
        setAnnonce({ grand: e.objet ? `${s.nom} utilise ${e.nom}` : `${s.nom} : ${e.nom}`, petit: '' })
        son(e.objet ? 'objet' : 'action')
        await pause(420)
        setAgitUid(null)
      } else if (e.t === 'degats') {
        const a = aff[e.cible]
        a.pv = Math.max(0, a.pv - e.valeur)
        setTouches((t) => ({ ...t, [e.cible]: (t[e.cible] || 0) + 1 }))
        let mention = ''
        let cls = ''
        if (e.mult > 1) { mention = 'Super efficace !'; cls = 'super' }
        else if (e.mult < 1) { mention = 'Peu efficace…'; cls = 'faible' }
        if (e.crit) { mention = (mention ? mention + ' ' : '') + 'Critique !'; cls += ' crit' }
        afficherNombre(e.cible, e.valeur, cls, mention)
        if (e.texte) setAnnonce({ grand: e.texte, petit: '' })
        else if (e.mult > 1) setAnnonce((x) => ({ ...x, petit: 'C\'est super efficace !' }))
        else if (e.mult < 1) setAnnonce((x) => ({ ...x, petit: 'Ce n\'est pas très efficace…' }))
        son(e.crit ? 'critique' : e.mult > 1 ? 'super' : 'coup')
        if (navigator.vibrate && unite(b, e.cible)?.camp === 'h') navigator.vibrate(30)
        rafraichir()
        await pause(560)
      } else if (e.t === 'soin') {
        const a = aff[e.cible]
        if (e.reanime) a.ko = false
        a.pv = Math.min(unite(b, e.cible).max.pv, a.pv + e.valeur)
        afficherNombre(e.cible, '+' + e.valeur, 'soin')
        if (e.texte) setAnnonce({ grand: e.texte, petit: '' })
        son('soin')
        rafraichir()
        await pause(520)
      } else if (e.t === 'pm') {
        aff[e.cible].pm += e.valeur
        afficherNombre(e.cible, '+' + e.valeur + ' PM', 'pm')
        rafraichir()
        await pause(450)
      } else if (e.t === 'ko') {
        aff[e.cible].ko = true
        aff[e.cible].pv = 0
        setAnnonce({ grand: e.texte, petit: '' })
        son('ko')
        rafraichir()
        await pause(600)
      } else if (e.t === 'invoque') {
        const u = unite(b, e.cible)
        aff[e.cible] = { pv: u.pv, pm: 0, ko: false }
        setAnnonce({ grand: e.texte, petit: '' })
        rafraichir()
        await pause(800)
      } else if (e.t === 'statut' || e.t === 'type' || e.t === 'texte') {
        setAnnonce({ grand: e.texte, petit: '' })
        rafraichir()
        await pause(650)
      }
    }
    // Recaler l'affichage sur l'état réel
    for (const u of b.units) aff[u.uid] = { pv: u.pv, pm: u.pm, ko: u.ko }
    rafraichir()
  }

  async function boucle() {
    for (;;) {
      const { unite: u, evenements } = avancer(b)
      await jouer(evenements)
      if (!u) return terminer()
      setTourDe(u.uid)
      if (u.camp === 'm') {
        await pause(380)
        await jouer(tourMonstre(b))
        if (b.fini) return terminer()
      } else {
        setAnnonce({ grand: `À ${u.nom} de jouer !`, petit: '' })
        setMode('menu')
        return
      }
    }
  }

  async function executer(action) {
    setMode('attente')
    setEnAttente(null)
    await jouer(agir(b, action))
    if (b.fini) return terminer()
    boucle()
  }

  async function terminer() {
    setMode('fin')
    setTourDe(null)
    const textes = { victoire: 'Victoire !', defaite: 'L\'équipe est à terre…', fuite: 'Vous avez pris la fuite.' }
    setAnnonce({ grand: textes[b.fini], petit: '' })
    son(b.fini === 'victoire' ? 'victoire' : 'defaite')
    await pause(1100)
    onFin(bilanCombat(b))
  }

  useEffect(() => {
    if (lance.current) return
    lance.current = true
    pause(900).then(boucle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const acteur = tourDe ? unite(b, tourDe) : null
  const ennemisVivants = vivants(b, 'm')

  // Choix d'une compétence ou d'un objet : passe au choix de la cible si besoin
  function preparer(action, cible) {
    if (cible === 'ennemi') {
      if (ennemisVivants.length === 1) return executer({ ...action, cible: ennemisVivants[0].uid })
      setEnAttente(action)
      setMode('cible-ennemi')
    } else if (cible === 'allie' || cible === 'allie-ko') {
      setEnAttente({ ...action, ko: cible === 'allie-ko' })
      setMode('cible-allie')
    } else executer(action)
  }

  function toucherEnnemi(uid) {
    if (mode !== 'cible-ennemi' || !enAttente) return
    executer({ ...enAttente, cible: uid })
  }
  function toucherHeros(uid) {
    if (mode !== 'cible-allie' || !enAttente) return
    const u = unite(b, uid)
    if (enAttente.ko ? !u.ko : u.ko) return
    executer({ kind: enAttente.kind, id: enAttente.id, cible: uid })
  }

  const herosUnits = b.units.filter((u) => u.camp === 'h')
  const monstres = b.units.filter((u) => u.camp === 'm')

  return (
    <div className="combat" ref={zone}>
      <div className="fond" style={{ backgroundImage: `url(${art(fond)})` }} />
      <div className="combat-haut">
        <div className="annonce">
          <div>
            <div className="grand">{annonce.grand}</div>
            {annonce.petit && <div style={{ color: '#ffcf5a', fontSize: 13 }}>{annonce.petit}</div>}
          </div>
        </div>
        <div className="tour-de">Tour {Math.max(1, b.tour)}</div>
      </div>

      <div className="ennemis">
        {monstres.map((u) => {
          const a = aff[u.uid] || { pv: u.pv, ko: u.ko }
          const ciblable = mode === 'cible-ennemi' && !u.ko
          return (
            <div
              key={u.uid}
              ref={(el) => (elts.current[u.uid] = el)}
              className={`ennemi ${u.boss ? 'boss' : ''} ${a.ko ? 'ko' : ''} ${ciblable ? 'ciblable' : ''} ${agitUid === u.uid ? 'agit' : ''}`}
              onClick={() => toucherEnnemi(u.uid)}
            >
              <div className="infos">
                <div className="nom">
                  <span>{u.nom} <small>niv. {u.niveau}</small></span>
                  <Type t={u.type} />
                </div>
                <Barre val={a.pv} max={u.max.pv} className={u.boss ? 'boss' : ''} texte={u.boss ? `${a.pv} / ${u.max.pv}` : null} />
                <Statuts u={u} />
              </div>
              <img key={touches[u.uid] || 0} className={touches[u.uid] ? 'touche' : ''} src={art(u.image)} alt={u.nom} draggable="false" />
            </div>
          )
        })}
      </div>

      <div className="heros-zone">
        {herosUnits.map((u) => {
          const a = aff[u.uid]
          const ciblable = mode === 'cible-allie' && enAttente && (enAttente.ko ? a.ko : !a.ko)
          return (
            <div
              key={u.uid}
              ref={(el) => (elts.current[u.uid] = el)}
              className={`carte-heros ${tourDe === u.uid && mode !== 'fin' ? 'actif' : ''} ${a.ko ? 'ko' : ''} ${ciblable ? 'ciblable' : ''} ${agitUid === u.uid ? 'agit' : ''}`}
              onClick={() => toucherHeros(u.uid)}
            >
              <div className="portrait">
                <img key={touches[u.uid] || 0} className={touches[u.uid] ? 'touche' : ''} src={art(u.image)} alt={u.nom} draggable="false" />
              </div>
              <div className="nom">
                <span>{u.nom}</span>
                <small>niv. {u.niveau}</small>
              </div>
              <Barre val={a.pv} max={u.max.pv} />
              <div className="chiffres"><span>PV</span><span>{a.pv}/{u.max.pv}</span></div>
              <Barre val={a.pm} max={u.max.pm} sorte="pm" />
              <div className="chiffres"><span>PM</span><span>{a.pm}/{u.max.pm}</span></div>
              <Statuts u={u} />
            </div>
          )
        })}
      </div>

      <div className="actions">
        <Menu
          mode={mode}
          acteur={acteur}
          b={b}
          ennemis={ennemisVivants}
          setMode={setMode}
          preparer={preparer}
          executer={executer}
          annuler={() => { setEnAttente(null); setMode('menu') }}
        />
      </div>

      <div className="nombres">
        {nombres.map((n) => (
          <div key={n.id} className={`nombre ${n.cls || ''}`} style={{ left: n.x, top: n.y }}>
            {n.txt}
            {n.mention && <span className="mention">{n.mention}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function Statuts({ u }) {
  const s = []
  if (u.brulure > 0) s.push(['🔥', 'Brûlé'])
  if (u.etourdi) s.push(['💫', 'Étourdi'])
  if (u.provoc > 0) s.push(['😤', 'Provocation'])
  if (u.defend) s.push(['🛡️', 'En garde'])
  for (const x of u.buffs) s.push([x.stat === 'def' ? '🛡️⬆' : x.stat === 'atq' ? '⚔️⬆' : '✨⬆', 'Bonus'])
  return (
    <div className="statuts">
      {s.slice(0, 4).map(([i, t], k) => (
        <span key={k} title={t}>{i}</span>
      ))}
    </div>
  )
}

function Menu({ mode, acteur, b, ennemis, setMode, preparer, executer, annuler }) {
  if (mode === 'fin') return <div className="attente">…</div>
  if (!acteur || acteur.camp !== 'h' || mode === 'attente') return <div className="attente">Les monstres préparent un mauvais coup…</div>

  if (mode === 'cible-ennemi' || mode === 'cible-allie') {
    return (
      <div>
        <div className="attente" style={{ padding: '14px 0 6px' }}>
          {mode === 'cible-ennemi' ? '👆 Touchez l\'ennemi à viser' : '👆 Touchez le héros à aider'}
        </div>
        <button className="btn bois petit" onClick={annuler}>Retour</button>
      </div>
    )
  }

  if (mode === 'competences') {
    const comps = acteur.competences.map((id) => competenceParId(acteur.classe, id))
    return (
      <div>
        <div className="liste-choix">
          {comps.map((c) => {
            const effic = c.puissance && c.type ? Math.max(...ennemis.map((e) => efficacite(c.type, e.type))) : 1
            return (
              <button
                key={c.id}
                className="choix"
                disabled={acteur.pm < c.cout}
                onClick={() => preparer({ kind: 'competence', id: c.id }, c.cible === 'ennemi' ? 'ennemi' : c.cible === 'allie' ? 'allie' : 'auto')}
              >
                <div style={{ flex: 1 }}>
                  <div className="ligne">
                    <span className="nom">{c.nom}</span>
                    {c.type && <Type t={c.type} />}
                    {effic > 1 && <span style={{ color: '#d0661a', fontSize: 11 }}>💥 efficace</span>}
                  </div>
                  <div className="desc">{c.desc}</div>
                </div>
                <span className="cout">{c.cout} PM</span>
              </button>
            )
          })}
        </div>
        <button className="retour" onClick={() => setMode('menu')}>◂ Retour</button>
      </div>
    )
  }

  if (mode === 'objets') {
    const objets = Object.entries(b.sac).filter(([, n]) => n > 0)
    return (
      <div>
        <div className="liste-choix">
          {!objets.length && <div className="attente">Le sac est vide.</div>}
          {objets.map(([id, n]) => {
            const o = CONSOMMABLES[id]
            const koDispo = b.units.some((u) => u.camp === 'h' && u.ko)
            const desactive = o.effet.reanime && !koDispo
            return (
              <button key={id} className="choix" disabled={desactive} onClick={() => preparer({ kind: 'objet', id }, o.effet.reanime ? 'allie-ko' : 'allie')}>
                <span style={{ fontSize: 24 }}>{o.icone}</span>
                <div style={{ flex: 1 }}>
                  <div className="nom">{o.nom}</div>
                  <div className="desc">{o.desc}</div>
                </div>
                <span className="cout">×{n}</span>
              </button>
            )
          })}
        </div>
        <button className="retour" onClick={() => setMode('menu')}>◂ Retour</button>
      </div>
    )
  }

  const c = CLASSES[acteur.classe]
  return (
    <div className="grille">
      <button className="btn rouge petit" onClick={() => preparer({ kind: 'attaque' }, 'ennemi')}>⚔️ {c.attaque.nom}</button>
      <button className="btn bleu petit" onClick={() => setMode('competences')}>✨ Compétences</button>
      <button className="btn vert petit" onClick={() => setMode('objets')}>🎒 Objets</button>
      <button className="btn bois petit" onClick={() => executer({ kind: 'defendre' })}>🛡️ En garde</button>
      {!b.boss && (
        <button className="btn bois petit" style={{ gridColumn: 'span 2', minHeight: 32 }} onClick={() => executer({ kind: 'fuir' })}>
          🏃 Fuir
        </button>
      )}
    </div>
  )
}

