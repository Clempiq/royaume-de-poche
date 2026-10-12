import { useState } from 'react'
import { VILLES, PNJ, DIALOGUES, ORDRE_VILLES } from '../data/world.js'
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

export default function Ville({ s, maj, lancerCombat, parler, aller, toast, finAventure }) {
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

        <div className="pile">
          <button className="btn vert gauche" onClick={() => lancerCombat('sauvage')}>
            <span className="ico">🌿</span>
            <span className="col">
              Explorer : {v.zone.nom}
              <span className="sous">Monstres de niveau {v.zone.niveaux[0]} à {v.zone.niveaux[1]}</span>
            </span>
          </button>

          {!battue ? (
            <button className="btn rouge gauche" onClick={() => lancerCombat('arene')}>
              <span className="ico">🏟️</span>
              <span className="col">
                Arène : {boss.nom}
                <span className="sous">
                  Niveau {v.arene.niveau} · conseillé : héros niv. {v.arene.conseil}
                  {moyenne < v.arene.conseil ? ' ⚠️' : ' ✓'}
                </span>
              </span>
            </button>
          ) : (
            <button className="btn bois gauche" disabled>
              <span className="ico">💎</span>
              <span className="col">
                Arène gagnée
                <span className="sous">L'éclat de {boss.nom} est à vous</span>
              </span>
            </button>
          )}

          <div className="grille2">
            <button className="btn bleu" onClick={() => aller('boutique')}>
              <span className="ico">🛒</span> Boutique
            </button>
            <button
              className="btn bois"
              disabled={enForme}
              onClick={() => {
                maj((d) => G.seReposer(d))
                toast('L\'équipe a bien dormi : PV et PM au maximum !')
              }}
            >
              <span className="ico">🛏️</span>
              <span className="col">
                Auberge
                <span className="sous">{enForme ? 'Déjà en forme' : 'Soins gratuits'}</span>
              </span>
            </button>
          </div>

          {voyage && (
            <button className={`btn ${battue ? 'violet' : 'bois'} gauche`} disabled={!battue} onClick={() => setConfirmeVoyage(true)}>
              <span className="ico">🧭</span>
              <span className="col">
                Voyager vers {VILLES[voyage.vers].nom}
                <span className="sous">{battue ? `${voyage.nom} · ${dureeTexte(voyage.minutes)} de marche` : 'Battez d\'abord le champion de l\'arène'}</span>
              </span>
            </button>
          )}

          {!voyage && toutFini && (
            <button className="btn violet" onClick={finAventure}>
              <span className="ico">👑</span> Rapporter les éclats au roi
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

function dureeTexte(min) {
  const m = min / vitesse()
  if (m >= 60) return `${Math.round((m / 60) * 10) / 10} h`.replace('.', ',')
  if (m >= 1) return `${Math.round(m)} min`
  return `${Math.round(m * 60)} s`
}

export function Voyage({ s, maj, lancerCombat, toast, onArrivee }) {
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
