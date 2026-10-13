import { useState } from 'react'
import { VILLES, VOYAGES, SOIN_FEU } from '../data/world.js'
import { MONSTRES } from '../data/monsters.js'
import { CLASSES, ORDRE_EQUIPE } from '../data/heroes.js'
import { CONSOMMABLES } from '../data/items.js'
import * as G from '../engine/game.js'
import { statsHeros } from '../engine/heroes.js'
import { Barre, Modale, art } from './commun.jsx'
import { EquipeMini } from './Ville.jsx'
import { son } from './sons.js'

// Une zone ou une route : 6 cases jouées dans l'ordre, sans soin entre
// les combats sauf au feu de camp.
export default function Parcours({ s, maj, toast, cle, lancerCombat, onArrivee, retour }) {
  const [confirme, setConfirme] = useState(false)
  const [soins, setSoins] = useState(false)
  const route = cle === 'route'
  const def = G.defParcours(s, cle)
  const p = G.etatParcours(s, cle)
  const enJeu = G.progressionEnJeu(s, cle)
  const ville = route ? VILLES[s.voyage.vers] : VILLES[cle]
  const nom = route ? VOYAGES[`${s.voyage.de}>${s.voyage.vers}`].nom : ville.zone.nom
  const fond = route ? VOYAGES[`${s.voyage.de}>${s.voyage.vers}`].image : ville.zone.image
  const termine = G.parcoursTermine(s, cle)
  const koTous = ORDRE_EQUIPE.every((c) => s.heros[c].pv <= 0)

  function jouer(c) {
    if (c.t === 'feu') {
      maj((d) => G.feuDeCamp(d, cle))
      son('soin')
      toast(`🔥 Au coin du feu : +${Math.round(SOIN_FEU * 100)} % de PV et PM. Point de passage atteint !`)
    } else if (c.t === 'arrivee') onArrivee()
    else lancerCombat({ type: 'parcours', cle })
  }

  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art(fond)})` }} />
      <div className="contenu">
        <div className="ville-tete">
          <h1>{nom}</h1>
          <p>{route ? `En route vers ${ville.nom}` : `Les terres sauvages de ${ville.nom}`}</p>
        </div>
        <p className="consigne-parcours">
          Les PV et PM ne remontent pas entre les combats : seul le feu de camp soigne. En cas de défaite, vous reprenez au dernier 🚩 point de passage.
        </p>

        <EquipeMini s={s} />
        <button className="btn bois petit" style={{ marginBottom: 10 }} onClick={() => setSoins(true)}>🎒 Utiliser un objet</button>

        <div className="chemin-parcours">
          {def.map((c, i) => (
            <Case key={i} c={c} i={i} p={p} s={s} cle={cle} ville={ville} actuelle={i === p.index} onJouer={() => jouer(c)} koTous={koTous} />
          ))}
        </div>

        {termine && !route && (
          <div className="panneau" style={{ textAlign: 'center' }}>
            <div className="titre" style={{ fontSize: 20 }}>Zone nettoyée ! 💎</div>
            <p className="discret" style={{ margin: '4px 0 0' }}>Le champion est vaincu. La chasse libre reste ouverte pour s'entraîner.</p>
          </div>
        )}

        <div style={{ height: 10 }} />
        {route ? (
          <button className="btn bois gauche" disabled={G.equipeEnForme(s) && !enJeu} onClick={() => (enJeu ? setConfirme(true) : maj((d) => { G.seReposer(d) }))}>
            <span className="ico">⛺</span>
            <span className="col">
              Bivouac
              <span className="sous">{enJeu ? 'Repos complet, mais retour au dernier point de passage' : 'Repos complet, sans rien perdre'}</span>
            </span>
          </button>
        ) : (
          <button className="btn bois" onClick={() => (enJeu ? setConfirme(true) : retour())}>◂ Retour en ville</button>
        )}
      </div>

      {confirme && (
        <Modale onFermer={() => setConfirme(false)}>
          <div className="bandeau">{route ? 'Installer le bivouac ?' : 'Rentrer en ville ?'}</div>
          <p style={{ marginTop: 0 }}>
            Vous perdrez votre avancée depuis le dernier point de passage ({enJeu} case{enJeu > 1 ? 's' : ''}) et la reprendrez à la case {p.checkpoint + 1}.
          </p>
          <p className="discret">Les récompenses déjà gagnées sont conservées : les combats rejoués ne rapportent plus rien.</p>
          <div className="grille2">
            <button className="btn bois petit" onClick={() => setConfirme(false)}>Continuer</button>
            <button
              className="btn rouge petit"
              onClick={() => {
                setConfirme(false)
                maj((d) => {
                  G.rebrousser(d, cle)
                  if (route) G.seReposer(d)
                })
                if (!route) retour()
                else toast('⛺ Bivouac : l\'équipe est reposée.')
              }}
            >
              {route ? 'Se reposer' : 'Rentrer'}
            </button>
          </div>
        </Modale>
      )}
      {soins && <Soins s={s} maj={maj} toast={toast} onFermer={() => setSoins(false)} />}
    </div>
  )
}

function Case({ c, i, p, s, cle, ville, actuelle, onJouer, koTous }) {
  const faite = i < p.index
  const recompense = p.recompenses.includes(i)
  const passage = i === p.checkpoint && i > 0
  const etat = faite ? 'faite' : actuelle ? 'actuelle' : 'avenir'
  let titre
  let sous
  let images = []
  let bouton
  if (c.t === 'combat' || c.t === 'elite') {
    const elite = c.ennemis.find((e) => e[2])
    titre = elite ? `Élite : ${MONSTRES[elite[0]].elite}` : 'Combat'
    sous = c.ennemis.map(([id, n, e]) => `${e ? MONSTRES[id].elite : MONSTRES[id].nom} niv. ${n}`).join(' · ')
    images = c.ennemis.map(([id, , e]) => ({ src: art(MONSTRES[id].image), elite: e }))
    bouton = elite ? '⚔️ Affronter l\'élite' : '⚔️ Combattre'
    if (elite) sous += ' · butin garanti'
  } else if (c.t === 'feu') {
    titre = 'Feu de camp'
    sous = `Rend ${Math.round(SOIN_FEU * 100)} % des PV et PM, relève les héros K.O. Point de passage.`
    bouton = '🔥 Se reposer'
  } else if (c.t === 'champion') {
    const boss = MONSTRES[ville.arene.boss]
    titre = `Champion : ${boss.nom}`
    sous = `${ville.arene.nom} · niveau ${ville.arene.niveau}. Point de passage : passez à l'auberge avant d'entrer, vous ne perdrez rien.`
    images = [{ src: art(boss.image), boss: true }]
    bouton = '👑 Entrer dans l\'arène'
  } else {
    titre = `Arrivée à ${ville.nom}`
    sous = 'La route est traversée !'
    bouton = `🏰 Entrer dans ${ville.nom}`
  }
  const icone = { combat: '⚔️', elite: '💀', feu: '🔥', champion: '👑', arrivee: '🏰' }[c.t]
  return (
    <div className={`case-parcours ${etat} c-${c.t}`}>
      <div className="pastille-case">{faite ? '✓' : icone}</div>
      <div className="corps-case">
        <div className="ligne" style={{ justifyContent: 'space-between' }}>
          <b>{i + 1}. {titre}</b>
          <span>
            {passage && <span title="Point de passage">🚩</span>}
            {faite && c.t !== 'feu' && recompense && <span className="discret" style={{ marginLeft: 4 }}>récompense obtenue</span>}
          </span>
        </div>
        {(actuelle || !faite) && <div className="discret">{sous}</div>}
        {images.length > 0 && !faite && (
          <div className="mini-monstres">
            {images.map((im, k) => <img key={k} src={im.src} alt="" className={im.elite ? 'elite' : im.boss ? 'boss' : ''} />)}
          </div>
        )}
        {actuelle && (
          <button className={`btn ${c.t === 'champion' ? 'rouge' : c.t === 'feu' ? 'bois' : c.t === 'arrivee' ? 'violet' : 'vert'} petit`} style={{ marginTop: 6 }} disabled={koTous && c.t !== 'feu' && c.t !== 'arrivee'} onClick={onJouer}>
            {bouton}
          </button>
        )}
        {actuelle && koTous && c.t !== 'feu' && c.t !== 'arrivee' && <div className="discret">Vos héros sont K.O. : soignez-les d'abord.</div>}
        {cle === 'route' && actuelle && c.t === 'arrivee' && <div className="discret">Vos héros se reposeront en arrivant.</div>}
      </div>
    </div>
  )
}

// Utiliser potions et éthers entre deux combats
export function Soins({ s, maj, toast, onFermer }) {
  const objets = Object.entries(s.sac).filter(([id, n]) => n > 0 && CONSOMMABLES[id])
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">🎒 Objets</div>
      {!objets.length && <p style={{ marginTop: 0 }}>Le sac est vide. La boutique et l'herboristerie du village en fournissent.</p>}
      <div className="pile" style={{ gap: 8 }}>
        {ORDRE_EQUIPE.map((c) => {
          const h = s.heros[c]
          const st = statsHeros(h, s.inventaire, s.camp)
          return (
            <div key={c} className="competence" style={{ alignItems: 'center' }}>
              <img src={art(CLASSES[c].image)} alt="" style={{ width: 38, height: 44, objectFit: 'contain' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="n">{CLASSES[c].prenom}</div>
                <Barre val={h.pv} max={st.pv} texte={`${h.pv} / ${st.pv}`} />
                <div style={{ height: 3 }} />
                <Barre val={h.pm} max={st.pm} sorte="pm" texte={`${h.pm} / ${st.pm}`} />
                <div className="ligne" style={{ flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {objets.map(([id, n]) => {
                    const o = CONSOMMABLES[id]
                    const ok = o.effet.reanime ? h.pv <= 0 : h.pv > 0 && ((o.effet.pv && h.pv < st.pv) || (o.effet.pm && h.pm < st.pm))
                    return (
                      <button
                        key={id}
                        className="puce-objet"
                        disabled={!ok}
                        onClick={() => {
                          maj((d) => G.utiliserConsommable(d, id, c))
                          son('soin')
                          toast(`${o.icone} ${o.nom} pour ${CLASSES[c].prenom}`)
                        }}
                      >
                        {o.icone} ×{n}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <button className="btn vert petit" style={{ marginTop: 10 }} onClick={onFermer}>Fermer</button>
    </Modale>
  )
}
