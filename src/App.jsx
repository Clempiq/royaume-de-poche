import { useCallback, useEffect, useRef, useState } from 'react'
import * as G from './engine/game.js'
import { BATIMENTS } from './data/camp.js'
import { INTRO, FIN, VILLES, VOYAGES, REGLES_DEFI } from './data/world.js'
import { MONSTRES } from './data/monsters.js'
import { vitesse } from './engine/util.js'
import Titre from './ui/Titre.jsx'
import Ville from './ui/Ville.jsx'
import Parcours from './ui/Parcours.jsx'
import Combat from './ui/Combat.jsx'
import Equipe from './ui/Equipe.jsx'
import Boutique from './ui/Boutique.jsx'
import Camp from './ui/Camp.jsx'
import Bestiaire from './ui/Bestiaire.jsx'
import { Rapport, RapportDefi, RetourExpedition } from './ui/Rapport.jsx'
import { Maitre, Port } from './ui/Batiments.jsx'
import { Dialogue, Modale, art } from './ui/commun.jsx'
import { basculerSon, son, sonActif } from './ui/sons.js'

export default function App() {
  const [s, setS] = useState(() => G.charger())
  const sRef = useRef(s)
  const [ecran, setEcran] = useState('titre')
  const [onglet, setOnglet] = useState('ville')
  const [sousEcran, setSousEcran] = useState(null)
  const [combat, setCombat] = useState(null)
  const [rapport, setRapport] = useState(null)
  const [rapportDefi, setRapportDefi] = useState(null)
  const [defi, setDefi] = useState(null)
  const [butinMer, setButinMer] = useState(null)
  const [dialogue, setDialogue] = useState(null)
  const [reglages, setReglages] = useState(false)
  const [toasts, setToasts] = useState([])
  const [, setSon] = useState(sonActif())

  // Applique une modification à une copie de l'état, puis sauvegarde
  const maj = useCallback((fn) => {
    const d = structuredClone(sRef.current)
    const r = fn(d)
    sRef.current = d
    setS(d)
    G.sauvegarder(d)
    return r
  }, [])

  const toast = useCallback((texte) => {
    const id = Math.random()
    setToasts((t) => [...t.slice(-2), { id, texte }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2900)
  }, [])

  // Le temps qui passe : fin des chantiers du village
  useEffect(() => {
    const id = setInterval(() => {
      const cur = sRef.current
      if (!cur?.camp?.chantiers?.some((c) => Date.now() >= c.fin)) return
      const notes = maj((d) => G.tic(d))
      notes.forEach((n) => toast('🏗️ ' + n))
      son('niveau')
    }, 1000)
    return () => clearInterval(id)
  }, [maj, toast])

  function nouvelle() {
    const d = G.nouvellePartie()
    sRef.current = d
    setS(d)
    G.sauvegarder(d)
    setOnglet('ville')
    setSousEcran(null)
    setEcran('jeu')
    setDialogue({ repliques: INTRO, fin: () => maj((x) => { x.introVue = true }) })
  }

  function jouer() {
    maj((d) => G.tic(d))
    setEcran('jeu')
    if (!sRef.current.introVue) setDialogue({ repliques: INTRO, fin: () => maj((x) => { x.introVue = true }) })
  }

  function lancerCombat(contexte) {
    const cur = sRef.current
    if (!G.herosPourCombat(cur).some((h) => h.pv > 0)) {
      toast('Vos héros sont K.O. : soignez-les d\'abord !')
      return
    }
    setRapport(null)
    const v = VILLES[cur.ville]
    let ennemis
    let fond = v.zone.image
    let titre = null
    let boss = false
    if (contexte.type === 'parcours') {
      const c = G.caseCourante(cur, contexte.cle)
      if (!c || !['combat', 'elite', 'champion'].includes(c.t)) return
      ennemis = G.ennemisCase(cur, contexte.cle)
      if (contexte.cle === 'route') fond = VOYAGES[`${cur.voyage.de}>${cur.voyage.vers}`].image
      if (c.t === 'champion') {
        boss = true
        fond = v.image
        titre = `${v.arene.nom} : le champion vous attend !`
      } else if (c.t === 'elite') titre = `Un élite barre la route : ${MONSTRES[c.ennemis.find((e) => e[2])[0]].elite} !`
    } else ennemis = G.rencontreSauvage(cur)
    setCombat({ cle: Math.random(), contexte, heros: G.herosPourCombat(cur), ennemis, boss, sac: cur.sac, fond, titre })
  }

  function lancerDefi(d) {
    const cur = sRef.current
    const r = REGLES_DEFI[d.regle]
    setDefi(null)
    setCombat({
      cle: Math.random(),
      contexte: { type: 'defi', defi: d },
      heros: G.herosPourDefi(cur),
      ennemis: d.ennemis,
      boss: true,
      sac: cur.sac,
      fond: VILLES[d.ville].image,
      titre: 'Défi du jour : en garde !',
      regles: { [d.regle]: true },
      bandeau: `${r.icone} ${r.nom} : ${r.desc}`,
    })
  }

  function finCombat(bilan) {
    const contexte = combat.contexte
    setCombat(null)
    if (contexte.type === 'defi') {
      const r = maj((d) => G.finDefi(d, bilan, contexte.defi))
      son(r.issue === 'victoire' ? 'piece' : 'clic')
      setRapportDefi(r)
      return
    }
    const r = maj((d) => G.finCombat(d, bilan, contexte))
    if (r.niveaux.length) son('niveau')
    setRapport(r)
  }

  // Après un rapport : enchaîner sur la case suivante si c'est un combat
  function suiteRapport(r) {
    if (r.issue !== 'victoire' || r.eclat) return null
    if (r.contexte?.type === 'chasse') return () => lancerCombat(r.contexte)
    if (r.contexte?.type === 'parcours') {
      const c = G.caseCourante(sRef.current, r.contexte.cle)
      if (c && (c.t === 'combat' || c.t === 'elite')) return () => lancerCombat(r.contexte)
    }
    return null
  }

  function recupererExpedition() {
    const r = maj((d) => G.recupererExpedition(d))
    if (r) { son('piece'); setButinMer(r) }
  }

  function finAventure() {
    setDialogue({ repliques: FIN, fin: () => maj((d) => { d.finVue = true }) })
  }

  if (ecran === 'titre' || !s) {
    return (
      <div className="app">
        <Titre aUneSauvegarde={!!s} onJouer={jouer} onNouvelle={nouvelle} />
      </div>
    )
  }

  const campAlerte =
    ['mine', 'herboristerie'].some((k) => s.camp[k].niveau && G.enStock(s, k) >= BATIMENTS[k].capacite[s.camp[k].niveau] * 0.6) ? '!' : null
  // Sur le terrain (progression non sauvegardée par un point de passage), on reste dans le parcours
  const surLeTerrain = !s.voyage && G.progressionEnJeu(s, s.ville) > 0

  let contenu
  if (onglet === 'ville') {
    if (s.voyage) {
      contenu = (
        <Parcours
          s={s}
          maj={maj}
          toast={toast}
          cle="route"
          lancerCombat={lancerCombat}
          onArrivee={() => {
            const r = maj((d) => G.arriver(d))
            if (r) {
              setSousEcran(null)
              toast(`🏰 Bienvenue à ${VILLES[r.ville].nom} ! L'équipe se repose.`)
            }
          }}
        />
      )
    } else if (sousEcran === 'parcours' || surLeTerrain) {
      contenu = <Parcours s={s} maj={maj} toast={toast} cle={s.ville} lancerCombat={lancerCombat} retour={() => setSousEcran(null)} />
    } else if (sousEcran === 'boutique') {
      contenu = <Boutique s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} />
    } else if (sousEcran === 'maitre') {
      contenu = <Maitre s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} />
    } else if (sousEcran === 'port') {
      contenu = <Port s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} onExpedition={recupererExpedition} />
    } else {
      contenu = (
        <Ville
          s={s}
          maj={maj}
          toast={toast}
          lancerCombat={lancerCombat}
          aller={setSousEcran}
          finAventure={finAventure}
          onExpedition={recupererExpedition}
          ouvrirDefi={() => setDefi(G.defiDuJour(s))}
          parler={(lignes) => setDialogue({ repliques: lignes })}
        />
      )
    }
  } else if (onglet === 'equipe') contenu = <Equipe s={s} maj={maj} toast={toast} />
  else if (onglet === 'camp') contenu = <Camp s={s} maj={maj} toast={toast} />
  else contenu = <Bestiaire s={s} />

  return (
    <div className="app">
      <div className="barre-haut">
        <div className="compteur"><span className="ico">🪙</span>{s.or}</div>
        <div className="compteur"><span className="ico">💎</span>{s.eclats.length}/3</div>
        {vitesse() > 1 && <div className="compteur" style={{ fontSize: 12 }}>⏩ ×{vitesse()}</div>}
        <div className="espace" />
        <button className="btn-rond" onClick={() => setSon(basculerSon())} aria-label="Son">{sonActif() ? '🔊' : '🔇'}</button>
        <button className="btn-rond" onClick={() => setReglages(true)} aria-label="Réglages">⚙️</button>
      </div>

      {contenu}

      <nav className="nav-bas">
        {[
          ['ville', s.voyage ? '🧭' : '🏰', s.voyage ? 'Route' : 'Ville', null],
          ['equipe', '🛡️', 'Équipe', null],
          ['camp', '🏘️', 'Village', campAlerte],
          ['bestiaire', '📖', 'Bestiaire', null],
        ].map(([k, ico, nom, alerte]) => (
          <button
            key={k}
            className={onglet === k ? 'actif' : ''}
            onClick={() => {
              son('clic')
              setOnglet(k)
              // Sur le terrain, l'onglet Ville ramène au parcours (voir surLeTerrain)
              if (k === 'ville') setSousEcran(null)
            }}
          >
            <span className="ico">{ico}</span>
            {nom}
            {alerte && <span className="pastille">{alerte}</span>}
          </button>
        ))}
      </nav>

      {combat && (
        <Combat
          key={combat.cle}
          heros={combat.heros}
          ennemis={combat.ennemis}
          boss={combat.boss}
          sac={combat.sac}
          fond={combat.fond}
          titre={combat.titre}
          regles={combat.regles}
          bandeau={combat.bandeau}
          aide={!s.aides?.combat3}
          onAideVue={() => maj((d) => { d.aides = { ...(d.aides || {}), combat3: true } })}
          onFin={finCombat}
        />
      )}

      {rapport && (
        <Rapport
          r={rapport}
          onFermer={() => {
            setRapport(null)
            // Champion battu : retour en ville
            if (rapport.eclat) setSousEcran(null)
          }}
          onContinuer={suiteRapport(rapport)}
        />
      )}
      {rapportDefi && <RapportDefi r={rapportDefi} onFermer={() => setRapportDefi(null)} />}
      {defi && <FicheDefi d={defi} onFermer={() => setDefi(null)} onJouer={() => lancerDefi(defi)} />}
      {butinMer && <RetourExpedition r={butinMer} onFermer={() => setButinMer(null)} />}
      {s.notesMigration && !dialogue && (
        <Modale onFermer={() => maj((d) => { delete d.notesMigration })}>
          <div className="bandeau">Nouvelle version !</div>
          <ul className="liste-nouveautes">
            <li>Les monstres <b>annoncent leurs attaques</b>. Champions et élites préparent un gros coup : Bastien peut l'interrompre.</li>
            <li>Chaque zone est un <b>parcours</b> de 6 cases jusqu'au champion, avec un feu de camp.</li>
            <li>Les routes se jouent, <b>sans attente</b>.</li>
            <li>Le campement devient un <b>village</b> à construire : château, caserne, remparts, bibliothèque…</li>
            <li>Héros spécialisés, armes légendaires à pouvoir, et un <b>défi du jour</b> après le premier champion.</li>
          </ul>
          {s.notesMigration.map((n) => <p key={n} className="discret">{n}</p>)}
          <button className="btn vert" onClick={() => maj((d) => { delete d.notesMigration })}>C'est parti !</button>
        </Modale>
      )}
      {dialogue && (
        <Dialogue
          repliques={dialogue.repliques}
          onFin={() => {
            const f = dialogue.fin
            setDialogue(null)
            if (f) f()
          }}
        />
      )}
      {reglages && (
        <Modale onFermer={() => setReglages(false)}>
          <div className="bandeau">Réglages</div>
          <div className="pile">
            <button className="btn bois petit" onClick={() => setSon(basculerSon())}>Son : {sonActif() ? 'activé' : 'coupé'}</button>
            <button className="btn bois petit" onClick={() => { setReglages(false); setDialogue({ repliques: INTRO }) }}>Revoir l'introduction</button>
            <button className="btn bois petit" onClick={() => { setReglages(false); maj((d) => { d.aides = { ...(d.aides || {}), combat3: false } }) }}>Revoir l'aide au combat</button>
            <button className="btn bois petit" onClick={() => { setReglages(false); setEcran('titre') }}>Écran titre</button>
            <p className="discret" style={{ margin: 0 }}>
              La partie est sauvegardée automatiquement dans ce navigateur. Pour recommencer à zéro, passez par l'écran titre.
            </p>
            <p className="discret" style={{ margin: 0 }}>
              {s.stats.victoires} victoires · {s.stats.defaites} défaites · version 0.3
            </p>
            <button className="btn vert petit" onClick={() => setReglages(false)}>Fermer</button>
          </div>
        </Modale>
      )}

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast">{t.texte}</div>
        ))}
      </div>
    </div>
  )
}

// Présentation du défi du jour
function FicheDefi({ d, onFermer, onJouer }) {
  const boss = MONSTRES[VILLES[d.ville].arene.boss]
  const r = REGLES_DEFI[d.regle]
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">Défi du jour</div>
      <div className="ligne" style={{ alignItems: 'center' }}>
        <img src={art(boss.image)} alt="" style={{ width: 96, height: 96, objectFit: 'contain', flex: 'none' }} />
        <div>
          <div className="titre" style={{ fontSize: 19 }}>{boss.nom}</div>
          <div className="discret">Niveau {d.ennemis[0].niveau} · {VILLES[d.ville].arene.nom}</div>
        </div>
      </div>
      <div className="regle-defi">
        <b>{r.icone} {r.nom}</b>
        <span>{r.desc}</span>
      </div>
      <p className="discret">
        Vos héros partent en pleine forme et le défi ne coûte rien : ni PV, ni objets. Gagnez en un minimum de tours pour battre votre record. Prime du jour : {d.prime} or, à la première victoire.
      </p>
      {d.record && <p style={{ margin: '0 0 8px' }}>🏆 Record du jour : <b>{d.record.meilleur} tours</b></p>}
      <div className="grille2">
        <button className="btn bois petit" onClick={onFermer}>Plus tard</button>
        <button className="btn violet petit" onClick={onJouer}>Relever le défi</button>
      </div>
    </Modale>
  )
}
