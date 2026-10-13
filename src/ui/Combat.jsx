import { useEffect, useReducer, useRef, useState } from 'react'
import { creerCombat, agir, phaseMonstres, fuir, bilanCombat, vivants, unite, capacite, attaqueDeBase, estimer, herosDisponibles, decrireIntention, intentionsActives, recharge } from '../engine/battle.js'
import { choisirAction } from '../engine/ia.js'
import { CONSOMMABLES } from '../data/items.js'
import { TYPES, efficacite } from '../data/types.js'
import { Barre, Type, art } from './commun.jsx'
import { son } from './sons.js'

const lire = (k, d) => {
  try {
    const v = localStorage.getItem(k)
    return v === null ? d : v === '1'
  } catch {
    return d
  }
}
const ecrire = (k, v) => {
  try {
    localStorage.setItem(k, v ? '1' : '0')
  } catch {
    /* rien */
  }
}

export default function Combat({ heros, ennemis, boss, sac, fond, titre, regles, bandeau, aide, onAideVue, onFin }) {
  const bRef = useRef(null)
  if (!bRef.current) bRef.current = creerCombat({ heros, ennemis, boss, sac, regles })
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
  const [mode, setMode] = useState('intro') // intro | joueur | anim | fin
  const [choisi, setChoisi] = useState(null) // héros sélectionné
  const [enAttente, setEnAttente] = useState(null) // capacité ou objet qui attend sa cible
  const [panneau, setPanneau] = useState('capacites') // capacites | objets
  const [auto, setAuto] = useState(() => lire('rdp-auto', false))
  const [rapide, setRapide] = useState(() => lire('rdp-rapide', false))
  const [voirAide, setVoirAide] = useState(aide)
  const [tourMonstres, setTourMonstres] = useState(false)
  const rapideRef = useRef(rapide)
  rapideRef.current = rapide
  const autoRef = useRef(auto)
  autoRef.current = auto
  const elts = useRef({})
  const zone = useRef(null)

  const pause = (ms) => new Promise((r) => setTimeout(r, rapideRef.current ? ms * 0.45 : ms))

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
        setAnnonce({ grand: e.objet ? `${s.nom} utilise ${e.nom}` : `${s.nom} : ${e.nom}`, petit: '', type: e.type })
        son(e.objet ? 'objet' : 'action')
        await pause(400)
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
        await pause(520)
      } else if (e.t === 'esquive') {
        afficherNombre(e.cible, 'Esquive !', 'esquive')
        son('clic')
        await pause(450)
      } else if (e.t === 'soin') {
        const a = aff[e.cible]
        if (e.reanime) a.ko = false
        a.pv = Math.min(unite(b, e.cible).max.pv, a.pv + e.valeur)
        afficherNombre(e.cible, '+' + e.valeur, 'soin')
        if (e.texte) setAnnonce({ grand: e.texte, petit: '' })
        son('soin')
        rafraichir()
        await pause(480)
      } else if (e.t === 'pm') {
        aff[e.cible].pm += e.valeur
        afficherNombre(e.cible, '+' + e.valeur + ' PM', 'pm')
        rafraichir()
        await pause(420)
      } else if (e.t === 'ko') {
        aff[e.cible].ko = true
        aff[e.cible].pv = 0
        setAnnonce({ grand: e.texte, petit: '' })
        son('ko')
        rafraichir()
        await pause(560)
      } else if (e.t === 'invoque') {
        const u = unite(b, e.cible)
        aff[e.cible] = { pv: u.pv, pm: 0, ko: false }
        setAnnonce({ grand: e.texte, petit: '' })
        rafraichir()
        await pause(750)
      } else if (e.t === 'statut' || e.t === 'type' || e.t === 'texte') {
        setAnnonce({ grand: e.texte, petit: '' })
        if (e.interruption) { afficherNombre(e.cible, 'Interrompu !', 'esquive'); son('critique') }
        else if (e.pouvoir) son('niveau')
        rafraichir()
        await pause(600)
      }
    }
    for (const u of b.units) aff[u.uid] = { pv: u.pv, pm: u.pm, ko: u.ko }
    rafraichir()
  }

  // Après chaque action : fin du combat, tour des monstres, ou héros suivant
  async function suite() {
    if (b.fini) return terminer()
    if (herosDisponibles(b).length) return redonnerLaMain()
    setChoisi(null)
    setAnnonce({ grand: 'Au tour des monstres…', petit: '' })
    await pause(450)
    setTourMonstres(true)
    await jouer(phaseMonstres(b))
    setTourMonstres(false)
    if (b.fini) return terminer()
    if (!herosDisponibles(b).length) return suite()
    redonnerLaMain(true)
  }

  function redonnerLaMain(nouveauTour = false) {
    const dispo = herosDisponibles(b)
    setChoisi((c) => (c && dispo.some((u) => u.uid === c) ? c : dispo[0]?.uid))
    setEnAttente(null)
    setPanneau('capacites')
    if (nouveauTour) setAnnonce({ grand: `Tour ${b.tour} : à vous !`, petit: menaceDuTour(b) || '+2 PM pour chaque héros.' })
    else setAnnonce((a) => (a.grand.startsWith('Tour') || a.grand.includes('vous') ? a : { grand: `À qui le tour ?`, petit: `Encore ${dispo.length} héros à jouer` }))
    setMode('joueur')
  }

  async function executer(uid, action) {
    setMode('anim')
    setEnAttente(null)
    await jouer(agir(b, uid, action))
    suite()
  }

  async function finDuTour() {
    b.aAgi = vivants(b, 'h').map((u) => u.uid)
    setMode('anim')
    suite()
  }

  async function tenterFuite() {
    setMode('anim')
    await jouer(fuir(b))
    suite()
  }

  async function terminer() {
    setMode('fin')
    setChoisi(null)
    const textes = { victoire: 'Victoire !', defaite: 'L\'équipe est à terre…', fuite: 'Vous avez pris la fuite.' }
    setAnnonce({ grand: textes[b.fini], petit: '' })
    son(b.fini === 'victoire' ? 'victoire' : 'defaite')
    await pause(1100)
    onFin(bilanCombat(b))
  }

  // Démarrage
  useEffect(() => {
    const t = setTimeout(() => {
      if (b.mode === 'lance') return
      b.mode = 'lance'
      redonnerLaMain()
      setAnnonce({ grand: 'À vous de jouer !', petit: menaceDuTour(b) || 'Les bulles annoncent ce que vont faire les monstres.' })
    }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Combat automatique : l'IA joue le héros sélectionné
  useEffect(() => {
    if (!auto || mode !== 'joueur' || !choisi) return
    const t = setTimeout(() => {
      if (!autoRef.current) return
      const action = choisirAction(b, choisi)
      if (action) executer(choisi, action)
      else finDuTour()
    }, rapideRef.current ? 120 : 280)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, mode, choisi])

  const acteur = choisi ? unite(b, choisi) : null
  const ennemisVivants = vivants(b, 'm')

  function choisirCapacite(comp) {
    if (!acteur) return
    const action = { kind: 'capacite', id: comp.id }
    if ((comp.cible || 'ennemi') === 'ennemi') {
      if (ennemisVivants.length === 1) return executer(acteur.uid, { ...action, cible: ennemisVivants[0].uid })
      setEnAttente({ ...action, comp, cible: 'ennemi' })
    } else if (comp.cible === 'allie') setEnAttente({ ...action, comp, cible: 'allie' })
    else executer(acteur.uid, action)
  }

  function choisirObjet(id) {
    const o = CONSOMMABLES[id]
    setEnAttente({ kind: 'objet', id, cible: o.effet.reanime ? 'allie-ko' : 'allie' })
  }

  function toucherEnnemi(uid) {
    if (mode !== 'joueur' || enAttente?.cible !== 'ennemi') return
    executer(acteur.uid, { kind: enAttente.kind, id: enAttente.id, cible: uid })
  }

  function toucherHeros(uid) {
    if (mode !== 'joueur') return
    const u = unite(b, uid)
    if (enAttente && (enAttente.cible === 'allie' || enAttente.cible === 'allie-ko')) {
      if (enAttente.cible === 'allie-ko' ? !u.ko : u.ko) return
      return executer(acteur.uid, { kind: enAttente.kind, id: enAttente.id, cible: uid })
    }
    if (!u.ko && !b.aAgi.includes(uid)) {
      setChoisi(uid)
      setEnAttente(null)
      setPanneau('capacites')
      son('clic')
    }
  }

  const herosUnits = b.units.filter((u) => u.camp === 'h')
  const monstres = b.units.filter((u) => u.camp === 'm')
  const ciblageEnnemi = mode === 'joueur' && enAttente?.cible === 'ennemi'

  return (
    <div className="combat" ref={zone}>
      <div className="fond" style={{ backgroundImage: `url(${art(fond)})` }} />
      <div className="combat-haut">
        <div className="commandes">
          <span className="tour-badge">Tour {b.tour}</span>
          <div className="espace" />
          {!boss && mode === 'joueur' && (
            <button className="puce" onClick={tenterFuite}>🏃 Fuir</button>
          )}
          <button className={`puce ${rapide ? 'on' : ''}`} onClick={() => { setRapide(!rapide); ecrire('rdp-rapide', !rapide) }}>⏩ ×2</button>
          <button className={`puce ${auto ? 'on' : ''}`} onClick={() => { setAuto(!auto); ecrire('rdp-auto', !auto) }}>🤖 Auto</button>
        </div>
        {bandeau && <div className="bandeau-regle">{bandeau}</div>}
        <div className="annonce">
          <div>
            <div className="grand">{annonce.grand}</div>
            {annonce.petit && <div className="petit">{annonce.petit}</div>}
          </div>
        </div>
      </div>

      <div className="ennemis">
        {monstres.map((u) => {
          const a = aff[u.uid] || { pv: u.pv, ko: u.ko }
          const ciblable = ciblageEnnemi && !u.ko
          const est = ciblable && acteur ? estimer(b, acteur.uid, enAttente.comp, u.uid) : null
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
                {!a.ko && mode !== 'fin' && !tourMonstres && (
                  <div className="intentions">
                    {intentionsActives(u).map((it, k) => {
                      const d = decrireIntention(b, u, it)
                      return (
                        <div key={k} className={`intention ${d.danger ? 'danger' : ''}`}>
                          <span className="ico">{d.icone}</span>
                          <span className="txt">
                            {d.texte}
                            {d.sous && <small>{d.sous}</small>}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {est && (
                <div className={`apercu ${est.mult > 1 ? 'super' : est.mult < 1 ? 'faible' : ''}`}>
                  ≈ {est.min}–{est.max}
                  {est.mult > 1 && <span>Super efficace</span>}
                  {est.mult < 1 && <span>Peu efficace</span>}
                  {est.ko && <span>K.O. probable</span>}
                  {est.expose && <span>Exposé +30 %</span>}
                </div>
              )}
              <img key={touches[u.uid] || 0} className={touches[u.uid] ? 'touche' : ''} src={art(u.image)} alt={u.nom} draggable="false" />
            </div>
          )
        })}
      </div>

      <div className="heros-zone">
        {herosUnits.map((u) => {
          const a = aff[u.uid]
          const aJoue = b.aAgi.includes(u.uid) && mode !== 'fin'
          const ciblable = mode === 'joueur' && enAttente && (enAttente.cible === 'allie-ko' ? a.ko : enAttente.cible === 'allie' && !a.ko)
          const selectionnable = mode === 'joueur' && !enAttente && !a.ko && !aJoue
          return (
            <div
              key={u.uid}
              ref={(el) => (elts.current[u.uid] = el)}
              className={`carte-heros ${choisi === u.uid && mode === 'joueur' ? 'actif' : ''} ${a.ko ? 'ko' : ''} ${aJoue ? 'a-joue' : ''} ${ciblable ? 'ciblable' : ''} ${selectionnable && choisi !== u.uid ? 'dispo' : ''} ${agitUid === u.uid ? 'agit' : ''}`}
              onClick={() => toucherHeros(u.uid)}
            >
              {aJoue && !a.ko && <span className="coche">✓</span>}
              {!tourMonstres && <Visee b={b} uid={u.uid} />}
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
        {mode === 'joueur' && acteur && !auto ? (
          enAttente ? (
            <div>
              <div className="consigne">
                {enAttente.cible === 'ennemi' ? '👆 Touchez l\'ennemi à viser (dégâts estimés au-dessus)' : enAttente.cible === 'allie-ko' ? '👆 Touchez le héros K.O.' : '👆 Touchez le héros à aider'}
              </div>
              <button className="btn bois petit" onClick={() => setEnAttente(null)}>◂ Changer d'action</button>
            </div>
          ) : panneau === 'objets' ? (
            <Objets b={b} onChoisir={choisirObjet} onRetour={() => setPanneau('capacites')} />
          ) : (
            <Capacites acteur={acteur} ennemis={ennemisVivants} onChoisir={choisirCapacite} onObjets={() => setPanneau('objets')} onGarde={() => executer(acteur.uid, { kind: 'defendre' })} onFin={finDuTour} restants={herosDisponibles(b).length} />
          )
        ) : (
          <div className="attente">
            {mode === 'fin' ? '…' : auto && mode === 'joueur' ? '🤖 Combat automatique… (touchez Auto pour reprendre la main)' : mode === 'intro' ? 'Préparez-vous !' : 'Patience…'}
          </div>
        )}
      </div>

      {voirAide && (
        <div className="aide-combat" onClick={() => { setVoirAide(false); onAideVue?.() }}>
          <div className="panneau">
            <h3 className="titre">Comment combattre</h3>
            <ol>
              <li><b>Lisez les bulles des monstres</b> : elles annoncent leur prochaine action et leur cible. 🎯 sur un héros = il va être attaqué.</li>
              <li><b>⚠️ Prépare…</b> : une grosse attaque arrive au tour suivant. Le <b>Coup de bouclier</b> de Bastien l'annule à coup sûr, sa <b>Provocation</b> la détourne sur lui.</li>
              <li><b>Touchez un héros</b>, une capacité, puis la cible. Vos 3 héros jouent dans l'ordre que vous voulez : le <b>Brise-garde</b> de Bastien expose un ennemi (+30 % pour l'allié suivant).</li>
              <li>Les couleurs indiquent les types : 💥 = super efficace. Chaque tour, vos héros récupèrent 2 PM.</li>
            </ol>
            <button className="btn vert petit">Compris !</button>
          </div>
        </div>
      )}

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

// Message d'alerte quand un monstre prépare ou porte une grosse attaque
function menaceDuTour(b) {
  for (const m of vivants(b, 'm')) {
    for (const it of intentionsActives(m)) {
      if (it.genre === 'prepare') return `⚠️ ${m.nom} prépare ${it.att.nom} : interrompez-le !`
      if (it.genre === 'frappe') return `💥 ${m.nom} va frapper ${unite(b, it.cible)?.nom || ''} très fort ce tour !`
    }
  }
  return null
}

// Pastille sur la carte d'un héros : combien d'attaques le visent ce tour
function Visee({ b, uid }) {
  if (b.phase !== 'joueur' || b.fini) return null
  let n = 0
  let gros = false
  for (const m of vivants(b, 'm')) {
    for (const it of intentionsActives(m)) {
      if (it.genre === 'prepare') continue
      if (it.cible === uid || (!it.cible && it.att.cible === 'ennemis' && it.att.puissance)) {
        n++
        if (it.genre === 'frappe') gros = true
      }
    }
  }
  if (!n) return null
  return <span className={`visee ${gros ? 'gros' : ''}`} title="Attaques prévues sur ce héros">{gros ? '💥' : '🎯'}{n > 1 ? `×${n}` : ''}</span>
}

function Statuts({ u }) {
  const s = []
  if (u.brulure > 0) s.push(['🔥', 'Brûlé'])
  if (u.etourdi) s.push(['💫', 'Étourdi'])
  if (u.provoc > 0) s.push(['😤', 'Provocation'])
  if (u.defend) s.push(['🛡️', 'En garde'])
  if (u.expose) s.push(['🎯', 'Exposé'])
  if (u.riposte > 0) s.push(['↩️', 'Riposte'])
  for (const x of u.buffs) s.push([x.stat === 'def' ? '🛡️⬆' : x.stat === 'atq' ? '⚔️⬆' : '✨⬆', 'Bonus'])
  return (
    <div className="statuts">
      {s.slice(0, 4).map(([i, t], k) => (
        <span key={k} title={t}>{i}</span>
      ))}
    </div>
  )
}

function TuileCapacite({ comp, acteur, ennemis, onClick, compacte }) {
  const t = comp.type ? TYPES[comp.type] : null
  const effic = comp.puissance && comp.type ? Math.max(...ennemis.map((e) => efficacite(comp.type, e.type))) : 1
  const toutesResistent = comp.puissance && comp.type && ennemis.every((e) => efficacite(comp.type, e.type) < 1)
  const attente = comp.id ? recharge(acteur, comp.id) : 0
  const manque = (comp.cout || 0) > acteur.pm || attente > 0
  const soutien = !comp.puissance
  return (
    <button
      className={`tuile-cap ${compacte ? 'compacte' : ''} ${soutien ? 'soutien' : ''}`}
      style={{ '--tc': !t ? '#6aa0c8' : comp.type === 'neutre' ? '#b07a48' : t.couleur }}
      disabled={manque}
      onClick={onClick}
    >
      <span className="haut">
        <span className="nom">{comp.nom}</span>
        {effic > 1 && <span className="effic" title="Super efficace">💥</span>}
        {toutesResistent && <span className="effic" title="Peu efficace">🛡</span>}
      </span>
      <span className="bas">
        <span>{t ? `${t.icone} ${t.nom}` : comp.cible === 'allie' || comp.cible === 'allies' ? '💚 Soutien' : '✨ Soutien'}</span>
        <span className="cout">{attente ? `⏳ ${attente} tour${attente > 1 ? 's' : ''}` : comp.cout ? `${comp.cout} PM` : 'Gratuit'}</span>
      </span>
    </button>
  )
}

function Capacites({ acteur, ennemis, onChoisir, onObjets, onGarde, onFin, restants }) {
  const caps = acteur.capacites.map((id) => capacite(acteur, id)).filter(Boolean)
  const base = attaqueDeBase(acteur)
  return (
    <div>
      <div className="entete-acteur">
        <b>{acteur.nom}</b>
        <span>{acteur.pm} PM</span>
        <span className="discret-clair">{restants > 1 ? `${restants} héros à jouer` : 'Dernier héros du tour'}</span>
      </div>
      <div className="grille-caps">
        {caps.map((c) => (
          <TuileCapacite key={c.id} comp={c} acteur={acteur} ennemis={ennemis} onClick={() => onChoisir(c)} />
        ))}
      </div>
      <div className="rangee-actions">
        <TuileCapacite comp={base} acteur={acteur} ennemis={ennemis} onClick={() => onChoisir(base)} compacte />
        <button className="mini-btn" onClick={onObjets}>🎒<span>Objets</span></button>
        <button className="mini-btn" onClick={onGarde}>🛡️<span>Garde</span></button>
        <button className="mini-btn" onClick={onFin}>⏭<span>Fin</span></button>
      </div>
    </div>
  )
}

function Objets({ b, onChoisir, onRetour }) {
  const objets = Object.entries(b.sac).filter(([, n]) => n > 0)
  const koDispo = b.units.some((u) => u.camp === 'h' && u.ko)
  return (
    <div>
      <div className="liste-choix">
        {!objets.length && <div className="attente">Le sac est vide.</div>}
        {objets.map(([id, n]) => {
          const o = CONSOMMABLES[id]
          return (
            <button key={id} className="choix" disabled={o.effet.reanime && !koDispo} onClick={() => onChoisir(id)}>
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
      <button className="retour" onClick={onRetour}>◂ Retour aux capacités</button>
    </div>
  )
}
