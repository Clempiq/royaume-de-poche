import { useEffect } from 'react'
import { CONSOMMABLES } from '../data/items.js'
import * as G from '../engine/game.js'
import { formatDuree, maintenant } from '../engine/util.js'
import { prixVente } from '../engine/loot.js'
import { Objet, art, useHorloge } from './commun.jsx'
import { son } from './sons.js'

export default function Boutique({ s, maj, toast, retour }) {
  useHorloge(1000)
  const v = G.villeCourante(s)
  const f = G.fenetreBoutique()
  const aJour = s.boutique[s.ville]?.fenetre === f
  useEffect(() => {
    if (!aJour) maj((d) => { G.articlesBoutique(d) })
  }, [aJour, f, maj])
  const b = aJour ? s.boutique[s.ville] : { articles: [], achetes: [] }
  const libres = s.inventaire.filter((o) => !G.estEquipe(s, o.id)).length
  const avendre = s.inventaire.filter((o) => !G.estEquipe(s, o.id))

  function acheter(id, n) {
    const ok = maj((d) => G.acheterConsommable(d, id, n))
    if (ok) { son('piece'); toast(`${n > 1 ? n + ' × ' : ''}${CONSOMMABLES[id].nom} acheté${n > 1 ? 's' : ''} !`) }
    else toast('Pas assez d\'or…')
  }

  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art(v.image)})` }} />
      <div className="contenu">
        <h1 className="titre-ecran">Boutique de {v.nom}</h1>

        <div className="panneau">
          <h3 className="titre" style={{ fontSize: 18 }}>Potions et provisions</h3>
          {v.boutique.map((id) => {
            const o = CONSOMMABLES[id]
            return (
              <div key={id} className="competence" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: 26 }}>{o.icone}</span>
                <div style={{ flex: 1 }}>
                  <div className="n">{o.nom} <span className="discret">(×{s.sac[id] || 0})</span></div>
                  <div className="d">{o.desc}</div>
                </div>
                <div className="pile" style={{ gap: 4 }}>
                  <button className="btn petit" style={{ width: 'auto', minHeight: 30, fontSize: 13 }} disabled={s.or < o.prix} onClick={() => acheter(id, 1)}>
                    {o.prix} 🪙
                  </button>
                  {o.prix <= 30 && (
                    <button className="btn bois petit" style={{ width: 'auto', minHeight: 26, fontSize: 12 }} disabled={s.or < o.prix * 5} onClick={() => acheter(id, 5)}>
                      ×5
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="panneau">
          <div className="ligne">
            <h3 className="titre" style={{ fontSize: 18 }}>Équipement du moment</h3>
          </div>
          <p className="discret" style={{ margin: '2px 0 8px' }}>
            Nouveaux articles dans {formatDuree(G.finFenetreBoutique() - maintenant())}
          </p>
          <div className="pile" style={{ gap: 6 }}>
            {b.articles.map((o) => {
              const vendu = b.achetes.includes(o.id)
              return (
                <Objet key={o.id} o={o}>
                  {vendu ? (
                    <span className="porte">Acheté</span>
                  ) : (
                    <button
                      className="btn petit"
                      style={{ width: 'auto', minHeight: 30, fontSize: 13 }}
                      disabled={s.or < o.prixAchat || libres >= G.TAILLE_SAC}
                      onClick={() => {
                        const ok = maj((d) => G.acheterEquipement(d, o.id))
                        if (ok) { son('piece'); toast(`${o.nom} rejoint votre sac !`) }
                      }}
                    >
                      {o.prixAchat} 🪙
                    </button>
                  )}
                </Objet>
              )
            })}
          </div>
        </div>

        {avendre.length > 0 && (
          <div className="panneau">
            <h3 className="titre" style={{ fontSize: 18 }}>Revendre</h3>
            <p className="discret" style={{ margin: '2px 0 8px' }}>Seuls les objets non portés apparaissent ici.</p>
            <div className="pile" style={{ gap: 6 }}>
              {avendre.map((o) => (
                <Objet key={o.id} o={o}>
                  <button
                    className="btn bois petit"
                    style={{ width: 'auto', minHeight: 30, fontSize: 13 }}
                    onClick={() => {
                      const prix = prixVente(o)
                      maj((d) => G.vendre(d, o.id))
                      son('piece')
                      toast(`Vendu pour ${prix} or.`)
                    }}
                  >
                    +{prixVente(o)} 🪙
                  </button>
                </Objet>
              ))}
            </div>
          </div>
        )}

        <div style={{ height: 12 }} />
        <button className="btn bois" onClick={retour}>◂ Retour en ville</button>
      </div>
    </div>
  )
}
