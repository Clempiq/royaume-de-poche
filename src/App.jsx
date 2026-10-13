import { useCallback, useEffect, useRef, useState } from 'react'
import * as G from './engine/game.js'
import { BATIMENTS } from './data/camp.js'
import { INTRO, FIN_V1, VILLES } from './data/world.js'
import { vitesse } from './engine/util.js'
import Titre from './ui/Titre.jsx'
import Ville, { Voyage } from './ui/Ville.jsx'
import Combat from './ui/Combat.jsx'
import Equipe from './ui/Equipe.jsx'
import Boutique from './ui/Boutique.jsx'
import Camp from './ui/Camp.jsx'
import Bestiaire from './ui/Bestiaire.jsx'
import { Rapport, Carnet, RetourExpedition } from './ui/Rapport.jsx'
import { Boulangerie, Maitre, Port, Enchanteur } from './ui/Batiments.jsx'
import { Dialogue, Modale } from './ui/commun.jsx'
import { basculerSon, son, sonActif } from './ui/sons.js'

export default function App() {
  const [s, setS] = useState(() => G.charger())
  const sRef = useRef(s)
  const [ecran, setEcran] = useState('titre')
  const [onglet, setOnglet] = useState('ville')
  const [sousEcran, setSousEcran] = useState(null)
  const [combat, setCombat] = useState(null)
  const [rapport, setRapport] = useState(null)
  const [carnet, setCarnet] = useState(null)
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

  // Le temps qui passe : fin des chantiers
  useEffect(() => {
    const id = setInterval(() => {
      const cur = sRef.current
      if (!cur?.camp?.chantier || Date.now() < cur.camp.chantier.fin) return
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
      toast('Vos héros sont K.O. : reposez-vous d\'abord !')
      return
    }
    const v = cur.voyage ? VILLES[cur.voyage.vers] : G.villeCourante(cur)
    const arene = contexte === 'arene'
    setRapport(null)
    setCombat({
      cle: Math.random(),
      contexte,
      heros: G.herosPourCombat(cur),
      ennemis: arene ? G.rencontreArene(cur) : G.rencontreSauvage(cur),
      boss: arene,
      sac: cur.sac,
      fond: arene ? v.image : v.zone.image,
      titre: arene ? `${v.arene.nom} : le champion vous attend !` : null,
    })
  }

  function finCombat(bilan) {
    const contexte = combat.contexte
    const r = maj((d) => G.finCombat(d, bilan, contexte === 'arene' ? 'arene' : 'sauvage'))
    if (r.niveaux.length) son('niveau')
    setCombat(null)
    setRapport({ ...r, contexte })
  }

  function recupererExpedition() {
    const r = maj((d) => G.recupererExpedition(d))
    if (r) { son('piece'); setButinMer(r) }
  }

  function finAventure() {
    setDialogue({ repliques: FIN_V1, fin: () => maj((d) => { d.finVue = true }) })
  }

  if (ecran === 'titre' || !s) {
    return (
      <div className="app">
        <Titre aUneSauvegarde={!!s} onJouer={jouer} onNouvelle={nouvelle} />
      </div>
    )
  }

  const campAlerte =
    ['mine', 'entrainement', 'herboristerie'].some((k) => G.enStock(s, k) >= BATIMENTS[k].capacite[s.camp[k].niveau] * 0.6) ? '!' : null
  const voyageFini = s.voyage && G.voyageTermine(s)

  let contenu
  if (onglet === 'ville') {
    if (s.voyage) {
      contenu = (
        <Voyage
          s={s}
          maj={maj}
          toast={toast}
          lancerCombat={lancerCombat}
          onExpedition={recupererExpedition}
          onArrivee={() => {
            const r = maj((d) => G.arriver(d))
            if (r) setCarnet(r)
          }}
        />
      )
    } else if (sousEcran === 'boutique') {
      contenu = <Boutique s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} />
    } else if (sousEcran === 'boulangerie') {
      contenu = <Boulangerie s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} />
    } else if (sousEcran === 'maitre') {
      contenu = <Maitre s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} />
    } else if (sousEcran === 'port') {
      contenu = <Port s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} onExpedition={recupererExpedition} />
    } else if (sousEcran === 'enchanteur') {
      contenu = <Enchanteur s={s} maj={maj} toast={toast} retour={() => setSousEcran(null)} />
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
          ['ville', s.voyage ? '🧭' : '🏰', s.voyage ? 'Voyage' : 'Ville', voyageFini ? '!' : null],
          ['equipe', '🛡️', 'Équipe', null],
          ['camp', '⛺', 'Campement', campAlerte],
          ['bestiaire', '📖', 'Bestiaire', null],
        ].map(([k, ico, nom, alerte]) => (
          <button
            key={k}
            className={onglet === k ? 'actif' : ''}
            onClick={() => {
              son('clic')
              setOnglet(k)
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
          aide={!s.aides?.combat}
          onAideVue={() => maj((d) => { d.aides = { ...(d.aides || {}), combat: true } })}
          onFin={finCombat}
        />
      )}

      {rapport && (
        <Rapport
          r={rapport}
          onFermer={() => setRapport(null)}
          onContinuer={rapport.contexte !== 'arene' ? () => lancerCombat(rapport.contexte) : null}
        />
      )}
      {carnet && <Carnet r={carnet} onFermer={() => setCarnet(null)} />}
      {butinMer && <RetourExpedition r={butinMer} onFermer={() => setButinMer(null)} />}
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
            <button className="btn bois petit" onClick={() => { setReglages(false); setEcran('titre') }}>Écran titre</button>
            <p className="discret" style={{ margin: 0 }}>
              La partie est sauvegardée automatiquement dans ce navigateur. Pour recommencer à zéro, passez par l'écran titre.
            </p>
            <p className="discret" style={{ margin: 0 }}>
              {s.stats.victoires} victoires · {s.stats.defaites} défaites · version 0.2
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
