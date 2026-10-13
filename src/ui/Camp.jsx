import { useState } from 'react'
import { BATIMENTS, ORDRE_BATIMENTS } from '../data/camp.js'
import { CLASSES } from '../data/heroes.js'
import { RARETES, FORGE_MAX } from '../data/items.js'
import * as G from '../engine/game.js'
import { bonusVillage, maxCapacites } from '../engine/heroes.js'
import { coutForge, peutForger, coutEnchantement } from '../engine/loot.js'
import { formatDuree, maintenant, vitesse } from '../engine/util.js'
import { Barre, Modale, Objet, art, useHorloge } from './commun.jsx'
import { son } from './sons.js'

const duree = (min) => formatDuree((min * 60000) / vitesse())

// Ce que fait un bâtiment à un niveau donné
function effet(k, n) {
  const d = BATIMENTS[k]
  if (!n) return 'Pas encore construit'
  switch (k) {
    case 'chateau': return `Bâtiments jusqu'au niveau ${n}`
    case 'mine': return `${d.production[n]} or / heure · réserve ${d.capacite[n]}`
    case 'herboristerie': return `${d.production[n]} potions / heure · réserve ${d.capacite[n]}${n >= 3 ? ' · moitié de super potions' : ''}`
    case 'forge': return `Équipement amélioré jusqu'à +${Math.min(FORGE_MAX, n)}`
    case 'caserne': return `+${Math.round(d.bonus.atq * n * 100)} % d'attaque et de magie`
    case 'remparts': return `+${Math.round(d.bonus.pv * n * 100)} % de PV et de défense`
    case 'bibliotheque': return `+${d.bonus.pm * n} PM pour chaque héros${n >= 3 ? ' · 5e capacité au combat' : ''}`
    case 'hutte': return 'Un second ouvrier'
    default: return ''
  }
}

// Ce que débloque le niveau suivant du château
function deblocages(n) {
  return ORDRE_BATIMENTS.filter((k) => BATIMENTS[k].deblocage === n).map((k) => BATIMENTS[k].nom)
}

export default function Camp({ s, maj, toast }) {
  useHorloge(1000)
  const [choisi, setChoisi] = useState(null)
  const [atelier, setAtelier] = useState(null)
  const chantiers = s.camp.chantiers || []
  const libres = G.ouvriers(s) - chantiers.length
  const b = bonusVillage(s.camp)

  function recolter(k) {
    const n = maj((d) => G.recolter(d, k))
    if (!n) return
    son(k === 'mine' ? 'piece' : 'soin')
    toast(k === 'mine' ? `+${n} or récolté !` : `+${n} potions dans le sac !`)
  }

  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art('camp')})` }} />
      <div className="contenu">
        <div className="tete-village">
          <h1 className="titre-ecran" style={{ margin: 0 }}>Village</h1>
          <span className="ouvriers" title="Ouvriers libres">👷 {libres}/{G.ouvriers(s)}</span>
        </div>
        <p className="consigne-parcours" style={{ marginTop: 4 }}>
          Construisez et améliorez vos bâtiments : ils rendent vos héros plus forts pour toute l'aventure. Le Château limite le niveau des autres.
        </p>

        <div className="carte-village">
          {ORDRE_BATIMENTS.map((k) => (
            <Parcelle key={k} k={k} s={s} onOuvrir={() => setChoisi(k)} onRecolter={() => recolter(k)} />
          ))}
        </div>

        <div className="panneau" style={{ marginTop: 10 }}>
          <div className="titre" style={{ fontSize: 16 }}>Bonus du village</div>
          <div className="discret">
            ⚔️ +{Math.round((b.atq - 1) * 100)} % attaque et magie · 🛡️ +{Math.round((b.pv - 1) * 100)} % PV et défense · 🔷 +{b.pm} PM · 📖 {maxCapacites(s.camp)} capacités au combat
          </div>
        </div>
      </div>

      {choisi && (
        <FicheBatiment
          k={choisi}
          s={s}
          maj={maj}
          toast={toast}
          onFermer={() => setChoisi(null)}
          onRecolter={() => recolter(choisi)}
          onAtelier={(onglet) => { setChoisi(null); setAtelier(onglet) }}
        />
      )}
      {atelier && <Atelier s={s} maj={maj} toast={toast} onglet={atelier} onFermer={() => setAtelier(null)} />}
    </div>
  )
}

function Parcelle({ k, s, onOuvrir, onRecolter }) {
  const d = BATIMENTS[k]
  const b = s.camp[k]
  const ch = G.enChantier(s, k)
  const verrou = !b.niveau && s.camp.chateau.niveau < d.deblocage
  const stock = G.enStock(s, k)
  const plein = d.capacite && stock >= d.capacite[b.niveau]
  const p = G.peutAmeliorer(s, k)
  return (
    <div className={`parcelle ${k === 'chateau' ? 'grande' : ''} ${verrou ? 'verrou' : ''} ${!b.niveau ? 'vide' : ''} ${ch ? 'chantier' : ''}`}>
      <button className="parcelle-btn" onClick={onOuvrir}>
        <img src={art(d.image)} alt="" />
        {b.niveau > 0 && <span className="niv-batiment">{b.niveau}</span>}
        {p.ok && !ch && <span className="fleche-up" title="Amélioration possible">⬆</span>}
        <span className="nom-batiment">{d.nom}</span>
        {verrou && <span className="cadenas">🔒 Château niv. {d.deblocage}</span>}
        {!verrou && !b.niveau && !ch && <span className="cadenas libre">🔨 À construire</span>}
      </button>
      {ch && (
        <div className="echafaudage">
          <span>🚧 {formatDuree(ch.fin - maintenant())}</span>
          <Barre val={maintenant() - ch.debut} max={ch.fin - ch.debut} sorte="xp" />
        </div>
      )}
      {stock > 0 && !ch && (
        <button className={`bulle-recolte ${plein ? 'plein' : ''}`} onClick={onRecolter} aria-label="Récolter">
          {k === 'mine' ? '🪙' : '🧪'}
          <small>{stock}</small>
        </button>
      )}
    </div>
  )
}

function FicheBatiment({ k, s, maj, toast, onFermer, onRecolter, onAtelier }) {
  const d = BATIMENTS[k]
  const b = s.camp[k]
  const ch = G.enChantier(s, k)
  const p = G.peutAmeliorer(s, k)
  const suivant = b.niveau + 1
  const max = b.niveau >= d.max
  const stock = G.enStock(s, k)
  return (
    <Modale onFermer={onFermer}>
      <div className="ligne" style={{ alignItems: 'center' }}>
        <img src={art(d.image)} alt="" style={{ width: 92, height: 88, objectFit: 'contain', flex: 'none' }} />
        <div>
          <div className="titre" style={{ fontSize: 22 }}>{d.nom}</div>
          <div className="discret">{b.niveau ? `Niveau ${b.niveau} sur ${d.max}` : 'Pas encore construit'}</div>
        </div>
      </div>
      <p style={{ margin: '8px 0' }}>{d.desc}</p>
      {b.niveau > 0 && <div className="effet-actuel">Actuellement : <b>{effet(k, b.niveau)}</b></div>}
      {!max && <div className="effet-suivant">Niveau {suivant} : <b>{effet(k, suivant)}</b>{k === 'chateau' && deblocages(suivant).length > 0 && <> · débloque {deblocages(suivant).join(', ')}</>}</div>}
      {d.capacite && b.niveau > 0 && (
        <div style={{ marginTop: 8 }}>
          <Barre val={stock} max={d.capacite[b.niveau]} sorte="xp" texte={`${stock} / ${d.capacite[b.niveau]}`} />
        </div>
      )}
      {ch && (
        <div style={{ marginTop: 8 }}>
          <Barre val={maintenant() - ch.debut} max={ch.fin - ch.debut} sorte="xp" texte={`🚧 encore ${formatDuree(ch.fin - maintenant())}`} />
        </div>
      )}
      <div className="pile" style={{ gap: 8, marginTop: 10 }}>
        {d.capacite && b.niveau > 0 && (
          <button className="btn vert petit" disabled={stock <= 0 || !!ch} onClick={onRecolter}>{k === 'mine' ? '🪙 Récolter l\'or' : '🧪 Récolter les potions'}</button>
        )}
        {k === 'forge' && (
          <div className="grille2">
            <button className="btn petit" onClick={() => onAtelier('forge')}>🔨 Améliorer</button>
            <button className="btn violet petit" onClick={() => onAtelier('enchanter')}>✨ Relancer</button>
          </div>
        )}
        {!max && (
          <button
            className="btn bleu"
            disabled={!p.ok}
            onClick={() => {
              maj((x) => G.ameliorer(x, k))
              son('piece')
              toast(b.niveau ? `🚧 Chantier lancé : ${d.nom} niveau ${suivant}` : `🚧 Construction lancée : ${d.nom}`)
              onFermer()
            }}
          >
            <span className="col" style={{ alignItems: 'center' }}>
              {b.niveau ? `⬆ Améliorer au niveau ${suivant}` : '🔨 Construire'}
              <span className="sous">{d.cout[suivant]} 🪙 · {duree(d.duree[suivant])}</span>
            </span>
          </button>
        )}
        {!p.ok && !max && !ch && <div className="discret" style={{ textAlign: 'center' }}>{p.raison}</div>}
      </div>
      <button className="btn bois petit" style={{ marginTop: 10 }} onClick={onFermer}>Fermer</button>
    </Modale>
  )
}

// Atelier : améliorer un objet (+1…) ou relancer ses bonus
function Atelier({ s, maj, toast, onglet: depart, onFermer }) {
  const [onglet, setOnglet] = useState(depart)
  const [dernier, setDernier] = useState(null)
  const niv = s.camp.forge.niveau
  const ordre = Object.keys(RARETES)
  const objets = s.inventaire
    .filter((o) => onglet === 'forge' || o.rarete !== 'commun')
    .sort((a, b) => Number(G.estEquipe(s, b.id)) - Number(G.estEquipe(s, a.id)) || ordre.indexOf(b.rarete) - ordre.indexOf(a.rarete))
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">🔨 Atelier (niveau {niv})</div>
      <div className="grille2" style={{ marginBottom: 8 }}>
        <button className={`btn petit ${onglet === 'forge' ? '' : 'bois'}`} onClick={() => setOnglet('forge')}>Améliorer</button>
        <button className={`btn petit ${onglet === 'enchanter' ? 'violet' : 'bois'}`} onClick={() => setOnglet('enchanter')}>Relancer</button>
      </div>
      <p className="discret" style={{ marginTop: 0 }}>
        {onglet === 'forge'
          ? `Chaque amélioration ajoute 12 % aux statistiques de l'objet. Votre atelier permet d'aller jusqu'à +${Math.min(FORGE_MAX, niv)}.`
          : 'Les bonus de l\'objet sont tirés à nouveau. Sa base, sa rareté, son niveau, ses améliorations et son pouvoir sont conservés.'}
      </p>
      {!objets.length && <p>Aucun objet {onglet === 'forge' ? '' : 'rare ou mieux '}dans le sac pour l'instant.</p>}
      <div className="pile" style={{ gap: 6 }}>
        {objets.map((o) => {
          const p = G.porteur(s, o.id)
          if (onglet === 'forge') {
            const possible = peutForger(o, niv)
            const cout = coutForge(o)
            return (
              <Objet key={o.id} o={o}>
                {p && <span className="porte">{CLASSES[p].prenom}</span>}
                {possible ? (
                  <button className="btn petit" style={{ width: 'auto', minHeight: 30, fontSize: 13 }} disabled={s.or < cout} onClick={() => { maj((d) => G.forger(d, o.id)); son('niveau'); toast(`${o.nom} passe à +${(o.forge || 0) + 1} !`) }}>
                    +1 · {cout} 🪙
                  </button>
                ) : (
                  <span className="discret">{(o.forge || 0) >= FORGE_MAX ? 'Max' : 'Atelier trop petit'}</span>
                )}
              </Objet>
            )
          }
          const c = coutEnchantement(o)
          return (
            <div key={o.id} style={dernier === o.id ? { animation: 'zoom .35s' } : null}>
              <Objet o={o}>
                {p && <span className="porte">{CLASSES[p].prenom}</span>}
                <button className="btn violet petit" style={{ width: 'auto', minHeight: 30, fontSize: 13 }} disabled={s.or < c} onClick={() => { maj((d) => G.enchanter(d, o.id)); son('niveau'); setDernier(null); setTimeout(() => setDernier(o.id), 10); toast('✨ Nouveaux bonus !') }}>
                  ✨ {c} 🪙
                </button>
              </Objet>
            </div>
          )
        })}
      </div>
      <button className="btn bois petit" style={{ marginTop: 10 }} onClick={onFermer}>Fermer</button>
    </Modale>
  )
}
