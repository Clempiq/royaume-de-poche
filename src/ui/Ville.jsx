import { useState } from 'react'
import { VILLES, PNJ, DIALOGUES, ORDRE_VILLES, BATIMENTS_VILLE, REPAS, EXPEDITIONS } from '../data/world.js'
import { MONSTRES } from '../data/monsters.js'
import { CLASSES, ORDRE_EQUIPE } from '../data/heroes.js'
import * as G from '../engine/game.js'
import { statsHeros } from '../engine/heroes.js'
import { formatDuree, maintenant, vitesse } from '../engine/util.js'
import { Barre, Modale, art, useHorloge } from './commun.jsx'

export function EquipeMini({ s }) {
  return (
    <div className="equipe-mini">
      {ORDRE_EQUIPE.map((c) => {
        const h = s.heros[c]
        const st = statsHeros(h, s.inventaire)
        return (
          <div key={c} className="mini">
            <div className="nom">
              <span>{CLASSES[c].prenom}</span>
              <span>niv. {h.niveau}</span>
            </div>
            <Barre val={h.pv} max={st.pv} />
            <Barre val={h.pm} max={st.pm} sorte="pm" />
          </div>
        )
      })}
    </div>
  )
}

export function Eclats({ s }) {
  return (
    <div className="eclats" title="Éclats du Sceptre des Saisons">
      {ORDRE_VILLES.map((v) => (
        <div key={v} className={`eclat ${s.eclats.includes(VILLES[v].arene.boss) ? 'obtenu' : ''}`} />
      ))}
    </div>
  )
}

export default function Ville({ s, maj, lancerCombat, parler, aller, toast, finAventure, onExpedition }) {
  const [confirmeVoyage, setConfirmeVoyage] = useState(false)
  const v = G.villeCourante(s)
  const pnj = PNJ[v.pnj]
  const battue = G.areneBattue(s)
  const lignes = DIALOGUES[v.pnj][battue ? 'apres' : 'avant']
  const boss = MONSTRES[v.arene.boss]
  const voyage = G.infoVoyage(s)
  const enForme = G.equipeEnForme(s)
  const moyenne = Math.round(ORDRE_EQUIPE.reduce((t, c) => t + s.heros[c].niveau, 0) / 3)
  const toutFini = s.eclats.length === ORDRE_VILLES.length

  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art(v.image)})` }} />
      <div className="contenu">
        <div className="ville-tete">
          <h1>{v.nom}</h1>
          <p>{v.accroche}</p>
          <Eclats s={s} />
        </div>

        <button className="pnj-bulle" onClick={() => parler(lignes.map((t) => ({ pnj: v.pnj, texte: t })))}>
          <img src={art(pnj.image)} alt={pnj.nom} />
          <div className="bulle">
            <b>{pnj.nom}</b>
            {lignes[0].length > 90 ? lignes[0].slice(0, 88) + '…' : lignes[0]}
            <div className="discret" style={{ marginTop: 2 }}>Toucher pour discuter</div>
          </div>
        </button>

        <EquipeMini s={s} />

        <BandeauxInfos s={s} maj={maj} toast={toast} onExpedition={onExpedition} />

        <div className="place">
          <button className="batisse large vert" onClick={() => lancerCombat('sauvage')}>
            <img src={art('t-porte')} alt="" />
            <span>
              <span className="n">Explorer : {v.zone.nom}</span>
              <br />
              <span className="s">Monstres de niveau {v.zone.niveaux[0]} à {v.zone.niveaux[1]}</span>
            </span>
          </button>
          <button className={`batisse large ${battue ? '' : 'rouge'}`} disabled={battue} onClick={() => lancerCombat('arene')}>
            <img src={art('t-arene')} alt="" />
            <span>
              <span className="n">{battue ? 'Arène gagnée 💎' : `Arène : ${boss.nom}`}</span>
              <br />
              <span className="s">
                {battue ? `L'éclat de ${boss.nom} est à vous` : `Niveau ${v.arene.niveau} · conseillé : héros niv. ${v.arene.conseil} ${moyenne < v.arene.conseil ? '⚠️' : '✓'}`}
              </span>
            </span>
          </button>
          <Batisse image="t-boutique" nom="Boutique" sous="Potions et équipement" onClick={() => aller('boutique')} />
          <Batisse
            image="t-auberge"
            nom="Auberge"
            sous={enForme ? 'Déjà en forme' : 'Soins gratuits'}
            disabled={enForme}
            onClick={() => {
              maj((d) => G.seReposer(d))
              toast('L\'équipe a bien dormi : PV et PM au maximum !')
            }}
          />
          {v.batiments.map((k) => (
            <Batisse key={k} image={BATIMENTS_VILLE[k].image} nom={BATIMENTS_VILLE[k].court} sous={sousTitre(k, s)} badge={k === 'port' && G.expeditionRentree(s) ? '!' : null} onClick={() => aller(k)} />
          ))}
          {voyage && (
            <button className={`batisse large ${battue ? 'violet' : ''}`} disabled={!battue} onClick={() => setConfirmeVoyage(true)}>
              <img src={art('t-voyage')} alt="" />
              <span>
                <span className="n">Voyager vers {VILLES[voyage.vers].nom}</span>
                <br />
                <span className="s">{battue ? `${voyage.nom} · ${dureeTexte(voyage.minutes)} de marche` : 'Battez d\'abord le champion de l\'arène'}</span>
              </span>
            </button>
          )}
          {!voyage && toutFini && (
            <button className="batisse large violet" onClick={finAventure}>
              <img src={art('p-roi')} alt="" />
              <span>
                <span className="n">Rapporter les éclats au roi</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {confirmeVoyage && (
        <Modale onFermer={() => setConfirmeVoyage(false)}>
          <div className="bandeau">En route ?</div>
          <p style={{ marginTop: 0 }}>
            Le trajet vers <b>{VILLES[voyage.vers].nom}</b> par le {voyage.nom} dure <b>{dureeTexte(voyage.minutes)}</b>.
          </p>
          <p className="discret">
            Pendant le voyage, vous pouvez fermer le jeu : vos héros avancent tout seuls. Vous pourrez combattre les monstres de la route,
            gérer le campement et votre équipement. À l'arrivée, vous découvrirez ce qui s'est passé en chemin.
          </p>
          <p className="discret">La boutique et l'arène de {v.nom} ne seront plus accessibles.</p>
          <div className="grille2">
            <button className="btn bois petit" onClick={() => setConfirmeVoyage(false)}>Pas encore</button>
            <button
              className="btn violet petit"
              onClick={() => {
                maj((d) => G.partirEnVoyage(d))
                setConfirmeVoyage(false)
              }}
            >
              C'est parti !
            </button>
          </div>
        </Modale>
      )}
    </div>
  )
}

function Batisse({ image, nom, sous, onClick, disabled, badge }) {
  return (
    <button className="batisse" onClick={onClick} disabled={disabled}>
      {badge && <span className="badge">{badge}</span>}
      <img src={art(image)} alt="" />
      <span className="n">{nom}</span>
      <span className="s">{sous}</span>
    </button>
  )
}

function sousTitre(k, s) {
  if (k === 'boulangerie') return s.repas ? `${REPAS[s.repas.id].icone} encore ${s.repas.combats} combats` : 'Repas qui renforcent'
  if (k === 'maitre') return 'Nouvelles capacités'
  if (k === 'port') return s.expedition ? (G.expeditionRentree(s) ? 'Bateau rentré !' : 'Bateau en mer') : 'Expéditions en mer'
  if (k === 'enchanteur') return 'Relancer les bonus'
  return ''
}

// Repas actif et expédition : visibles partout où l'on passe
export function BandeauxInfos({ s, onExpedition }) {
  useHorloge(1000)
  const items = []
  if (s.repas) {
    const r = REPAS[s.repas.id]
    items.push(
      <div key="repas" className="bandeau-info">
        <span style={{ fontSize: 20 }}>{r.icone}</span>
        <span><b>{r.nom}</b> : {r.desc}, encore {s.repas.combats} combat{s.repas.combats > 1 ? 's' : ''}</span>
      </div>,
    )
  }
  if (s.expedition) {
    const e = EXPEDITIONS[s.expedition.id]
    const rentre = G.expeditionRentree(s)
    items.push(
      <div key="exp" className="bandeau-info">
        <span style={{ fontSize: 20 }}>⛵</span>
        <span>
          <b>{e.nom}</b> : {rentre ? 'le bateau est rentré !' : `retour dans ${formatDuree(s.expedition.fin - maintenant())}`}
        </span>
        {rentre && onExpedition && (
          <button className="btn vert petit" style={{ minHeight: 30, fontSize: 13 }} onClick={onExpedition}>Récupérer</button>
        )}
      </div>,
    )
  }
  return items.length ? <>{items}</> : null
}

function dureeTexte(min) {
  const m = min / vitesse()
  if (m >= 60) return `${Math.round((m / 60) * 10) / 10} h`.replace('.', ',')
  if (m >= 1) return `${Math.round(m)} min`
  return `${Math.round(m * 60)} s`
}

export function Voyage({ s, maj, lancerCombat, toast, onArrivee, onExpedition }) {
  useHorloge(1000)
  const v = s.voyage
  const total = v.fin - v.debut
  const reste = Math.max(0, v.fin - maintenant())
  const p = total > 0 ? 1 - reste / total : 1
  const fini = reste <= 0
  const dest = VILLES[v.vers]
  const enForme = G.equipeEnForme(s)
  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art('camp')})` }} />
      <div className="contenu">
        <div className="ville-tete">
          <h1>En route</h1>
          <p>
            De {VILLES[v.de].nom} à {dest.nom}
          </p>
        </div>
        <div className="panneau">
          <div className="route">
            <div className="chemin" />
            <div className="fait" style={{ width: `calc((100% - 36px) * ${p})` }} />
            <div className="etape" style={{ left: 0 }}>🏠</div>
            <div className="etape" style={{ right: 0 }}>🏰</div>
            <div className="equipe" style={{ left: `calc(18px + (100% - 36px) * ${p})` }}>🚶</div>
          </div>
          {fini ? (
            <div className="chrono" style={{ color: 'var(--vert-fonce)' }}>Arrivés !</div>
          ) : (
            <>
              <div className="chrono">{formatDuree(reste)}</div>
              <p className="discret" style={{ textAlign: 'center', margin: '2px 0 0' }}>
                Vos héros marchent, même jeu fermé. Revenez plus tard !
              </p>
            </>
          )}
          {vitesse() > 1 && <p className="discret" style={{ textAlign: 'center' }}>Mode test : temps ×{vitesse()}</p>}
        </div>

        <div style={{ height: 12 }} />
        <BandeauxInfos s={s} onExpedition={onExpedition} />
        <EquipeMini s={s} />

        <div className="pile">
          {fini && (
            <button className="btn vert" onClick={onArrivee}>
              <span className="ico">🏰</span> Entrer dans {dest.nom}
            </button>
          )}
          <button className="btn rouge gauche" onClick={() => lancerCombat('route')}>
            <span className="ico">⚔️</span>
            <span className="col">
              Affronter les monstres de la route
              <span className="sous">Aperçu des monstres de {dest.zone.nom}</span>
            </span>
          </button>
          <button
            className="btn bois gauche"
            disabled={enForme}
            onClick={() => {
              maj((d) => G.seReposer(d))
              toast('Bivouac au coin du feu : l\'équipe est reposée.')
            }}
          >
            <span className="ico">🔥</span>
            <span className="col">
              Bivouac
              <span className="sous">{enForme ? 'L\'équipe est en forme' : 'Se reposer au coin du feu'}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
