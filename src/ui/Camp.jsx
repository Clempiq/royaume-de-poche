import { useState } from 'react'
import { BATIMENTS, NIVEAU_MAX_BATIMENT } from '../data/camp.js'
import { CLASSES } from '../data/heroes.js'
import { RARETES, FORGE_MAX } from '../data/items.js'
import * as G from '../engine/game.js'
import { coutForge, peutForger } from '../engine/loot.js'
import { formatDuree, maintenant, vitesse } from '../engine/util.js'
import { Barre, Modale, Objet, art, useHorloge } from './commun.jsx'
import { son } from './sons.js'

const duree = (min) => formatDuree((min * 60000) / vitesse())

export default function Camp({ s, maj, toast }) {
  useHorloge(1000)
  const [forge, setForge] = useState(false)
  const ch = s.camp.chantier

  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art('camp')})` }} />
      <div className="contenu">
        <h1 className="titre-ecran">Campement</h1>
        <p style={{ color: '#fff', marginTop: -6, fontSize: 13, textShadow: '0 1px 3px #000' }}>
          Votre campement vous suit partout. Améliorez-le pour gagner de l'or et de l'expérience, même quand vous ne jouez pas.
        </p>

        {ch && (
          <div className="panneau">
            <div className="ligne">
              <span style={{ fontSize: 26 }}>🚧</span>
              <div style={{ flex: 1 }}>
                <b>{BATIMENTS[ch.batiment].nom}</b> passe au niveau {s.camp[ch.batiment].niveau + 1}
                <Barre val={maintenant() - ch.debut} max={ch.fin - ch.debut} sorte="xp" texte={`encore ${formatDuree(ch.fin - maintenant())}`} />
              </div>
            </div>
          </div>
        )}

        {Object.keys(BATIMENTS).map((k) => {
          const def = BATIMENTS[k]
          const b = s.camp[k]
          const p = G.peutAmeliorer(s, k)
          const enChantier = ch?.batiment === k
          const stock = k === 'forge' ? 0 : G.enStock(s, k)
          const cap = def.capacite?.[b.niveau]
          return (
            <div key={k} className="panneau">
              <div className="batiment">
                <div className="gros">{def.icone}</div>
                <div className="info">
                  <h3 className="titre" style={{ fontSize: 18 }}>
                    {def.nom}
                    <span className="niv">niv. {b.niveau}</span>
                  </h3>
                  <div className="discret">{def.desc}</div>
                  {k !== 'forge' && (
                    <div style={{ marginTop: 6 }}>
                      <div className="discret">
                        {def.production[b.niveau]} {k === 'mine' ? 'or' : 'XP par héros'} / heure · réserve max {cap}
                      </div>
                      <Barre val={stock} max={cap} sorte="xp" texte={`${stock} / ${cap}`} />
                    </div>
                  )}
                  {k === 'forge' && <div className="discret" style={{ marginTop: 4 }}>Amélioration maximale : +{Math.min(FORGE_MAX, b.niveau)}</div>}
                </div>
              </div>
              <div className="grille2" style={{ marginTop: 10 }}>
                {k === 'forge' ? (
                  <button className="btn petit" onClick={() => setForge(true)}>🔨 Forger</button>
                ) : (
                  <button
                    className="btn vert petit"
                    disabled={stock <= 0}
                    onClick={() => {
                      const n = maj((d) => G.recolter(d, k))
                      son(k === 'mine' ? 'piece' : 'niveau')
                      toast(k === 'mine' ? `+${n} or récolté !` : `+${n} XP pour chaque héros !`)
                    }}
                  >
                    {k === 'mine' ? '🪙 Récolter' : '⭐ Récupérer l\'XP'}
                  </button>
                )}
                {b.niveau >= NIVEAU_MAX_BATIMENT ? (
                  <button className="btn bois petit" disabled>Niveau max</button>
                ) : (
                  <button
                    className="btn bleu petit"
                    disabled={!p.ok}
                    onClick={() => {
                      maj((d) => G.ameliorer(d, k))
                      toast(`Chantier lancé : ${def.nom} niveau ${b.niveau + 1}`)
                    }}
                  >
                    <span className="col" style={{ alignItems: 'center' }}>
                      {enChantier ? 'En chantier…' : '⬆ Améliorer'}
                      <span className="sous">{def.cout[b.niveau + 1]} 🪙 · {duree(def.duree[b.niveau + 1])}</span>
                    </span>
                  </button>
                )}
              </div>
              {!p.ok && !enChantier && b.niveau < NIVEAU_MAX_BATIMENT && <div className="discret" style={{ marginTop: 4, textAlign: 'right' }}>{p.raison}</div>}
            </div>
          )
        })}
      </div>
      {forge && <Forge s={s} maj={maj} toast={toast} onFermer={() => setForge(false)} />}
    </div>
  )
}

function Forge({ s, maj, toast, onFermer }) {
  const niv = s.camp.forge.niveau
  const ordre = Object.keys(RARETES)
  const objets = s.inventaire.slice().sort((a, b) => Number(G.estEquipe(s, b.id)) - Number(G.estEquipe(s, a.id)) || ordre.indexOf(b.rarete) - ordre.indexOf(a.rarete))
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">🔨 Forge (niveau {niv})</div>
      <p className="discret" style={{ marginTop: 0 }}>
        Chaque amélioration ajoute 12 % aux statistiques de l'objet. Votre forge permet d'aller jusqu'à +{Math.min(FORGE_MAX, niv)}.
      </p>
      <div className="pile" style={{ gap: 6 }}>
        {objets.map((o) => {
          const p = G.porteur(s, o.id)
          const possible = peutForger(o, niv)
          const cout = coutForge(o)
          return (
            <Objet key={o.id} o={o}>
              {p && <span className="porte">{CLASSES[p].prenom}</span>}
              {possible ? (
                <button
                  className="btn petit"
                  style={{ width: 'auto', minHeight: 30, fontSize: 13 }}
                  disabled={s.or < cout}
                  onClick={() => {
                    maj((d) => G.forger(d, o.id))
                    son('niveau')
                    toast(`${o.nom} passe à +${(o.forge || 0) + 1} !`)
                  }}
                >
                  +1 · {cout} 🪙
                </button>
              ) : (
                <span className="discret">{(o.forge || 0) >= FORGE_MAX ? 'Max' : 'Forge trop faible'}</span>
              )}
            </Objet>
          )
        })}
      </div>
      <button className="btn bois petit" style={{ marginTop: 10 }} onClick={onFermer}>Fermer</button>
    </Modale>
  )
}
