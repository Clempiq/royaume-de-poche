import { BATIMENTS_VILLE, EXPEDITIONS } from '../data/world.js'
import { CLASSES } from '../data/heroes.js'
import { maxCapacites } from '../engine/heroes.js'
import * as G from '../engine/game.js'
import { formatDuree, maintenant, vitesse } from '../engine/util.js'
import { Type, art, useHorloge } from './commun.jsx'
import { son } from './sons.js'

function Cadre({ s, cle, children, retour }) {
  const v = G.villeCourante(s)
  const b = BATIMENTS_VILLE[cle]
  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art(v.image)})` }} />
      <div className="contenu">
        <div className="ligne" style={{ marginBottom: 8 }}>
          <img src={art(b.image)} alt="" style={{ width: 84, height: 80, objectFit: 'contain', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.3))' }} />
          <div>
            <h1 className="titre-ecran" style={{ margin: 0, fontSize: 24 }}>{b.nom}</h1>
            <p style={{ color: '#fff', margin: '2px 0 0', fontSize: 13, textShadow: '0 1px 3px #000' }}>{b.desc}</p>
          </div>
        </div>
        {children}
        <div style={{ height: 12 }} />
        <button className="btn bois" onClick={retour}>◂ Retour en ville</button>
      </div>
    </div>
  )
}

export function Maitre({ s, maj, toast, retour }) {
  const liste = G.capacitesEnseignees(s.ville)
  return (
    <Cadre s={s} cle="maitre" retour={retour}>
      <div className="panneau">
        <p className="discret" style={{ marginTop: 0 }}>
          Chaque maître enseigne des capacités différentes : des alternatives, jamais obligatoires. Une fois apprise, une capacité s'équipe dans l'écran Équipe ({maxCapacites(s.camp)} au maximum par héros). Chaque héros reste fidèle à ses éléments.
        </p>
        <div className="pile" style={{ gap: 8 }}>
          {liste.map((k) => {
            const h = s.heros[k.classe]
            const connue = h.connues.includes(k.id)
            return (
              <div key={k.id} className="competence" style={{ alignItems: 'center' }}>
                <img src={art(CLASSES[k.classe].image)} alt="" style={{ width: 40, height: 44, objectFit: 'contain' }} />
                <div style={{ flex: 1 }}>
                  <div className="ligne" style={{ flexWrap: 'wrap', gap: 4 }}>
                    <span className="n">{k.nom}</span>
                    {k.type && <Type t={k.type} />}
                  </div>
                  <div className="d">
                    {CLASSES[k.classe].prenom} · {k.cout} PM{k.puissance ? ` · puissance ${k.puissance}` : ''} · {k.desc}
                  </div>
                </div>
                {connue ? (
                  <span className="porte">Apprise</span>
                ) : (
                  <button
                    className="btn bleu petit"
                    style={{ width: 'auto', minHeight: 32, fontSize: 14 }}
                    disabled={s.or < k.prix}
                    onClick={() => {
                      maj((d) => G.apprendreCapacite(d, k.classe, k.id))
                      son('niveau')
                      const plein = s.heros[k.classe].capacites.length >= maxCapacites(s.camp)
                      toast(plein ? `${CLASSES[k.classe].prenom} connaît ${k.nom} : équipez-la dans Équipe.` : `${CLASSES[k.classe].prenom} apprend ${k.nom} !`)
                    }}
                  >
                    {k.prix} 🪙
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Cadre>
  )
}

export function Port({ s, maj, toast, retour, onExpedition }) {
  useHorloge(1000)
  const e = s.expedition
  const rentre = G.expeditionRentree(s)
  return (
    <Cadre s={s} cle="port" retour={retour}>
      {e && (
        <div className="panneau">
          <div className="ligne">
            <span style={{ fontSize: 30 }}>{EXPEDITIONS[e.id].icone}</span>
            <div style={{ flex: 1 }}>
              <div className="titre" style={{ fontSize: 17 }}>{EXPEDITIONS[e.id].nom}</div>
              <div className="discret">{rentre ? 'Le bateau est rentré au port !' : `Retour dans ${formatDuree(e.fin - maintenant())}`}</div>
            </div>
            {rentre && <button className="btn vert petit" style={{ width: 'auto' }} onClick={onExpedition}>Décharger</button>}
          </div>
        </div>
      )}
      <div className="panneau">
        <p className="discret" style={{ marginTop: 0 }}>
          Un seul bateau à la fois. Il navigue même jeu fermé, et vous pourrez récupérer le butin depuis n'importe quelle ville.
        </p>
        <div className="pile" style={{ gap: 8 }}>
          {Object.entries(EXPEDITIONS).map(([id, x]) => (
            <div key={id} className="competence" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 28 }}>{x.icone}</span>
              <div style={{ flex: 1 }}>
                <div className="n">{x.nom}</div>
                <div className="d">{formatDuree((x.minutes * 60000) / vitesse())} · {x.desc}</div>
              </div>
              <button
                className="btn bleu petit"
                style={{ width: 'auto', minHeight: 32, fontSize: 14 }}
                disabled={!!e || s.or < x.cout}
                onClick={() => {
                  maj((d) => G.partirExpedition(d, id))
                  son('clic')
                  toast(`Le bateau met les voiles : ${x.nom} !`)
                }}
              >
                {x.cout} 🪙
              </button>
            </div>
          ))}
        </div>
      </div>
    </Cadre>
  )
}

