import { useEffect, useState } from 'react'
import { TYPES } from '../data/types.js'
import { RARETES, BASES, NOMS_STATS } from '../data/items.js'
import { PNJ } from '../data/world.js'
import { statsObjet } from '../engine/loot.js'

export const art = (nom) => `/art/${nom}.webp`

export function Barre({ val, max, sorte = 'pv', texte, className = '' }) {
  const p = max > 0 ? Math.max(0, Math.min(100, (val / max) * 100)) : 0
  const bas = sorte === 'pv' && p < 30
  return (
    <div className={`barre ${sorte} ${bas ? 'bas' : ''} ${className}`}>
      <i style={{ width: p + '%' }} />
      {texte && <span className="txt">{texte}</span>}
    </div>
  )
}

export function Type({ t }) {
  if (!t) return null
  const d = TYPES[t]
  return (
    <span className="type" style={{ background: d.couleur }}>
      {d.icone} {d.nom}
    </span>
  )
}

export function Modale({ children, onFermer }) {
  return (
    <div className="voile" onClick={onFermer}>
      <div className="modale panneau" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// Fiche d'objet d'équipement. `compare` : objet actuellement porté pour afficher les écarts.
export function Objet({ o, compare, children, onClick }) {
  const r = RARETES[o.rarete]
  const s = statsObjet(o)
  const sc = compare ? statsObjet(compare) : null
  const cles = Array.from(new Set([...Object.keys(s), ...(sc ? Object.keys(sc) : [])]))
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="objet" style={{ '--c': r.couleur }} onClick={onClick}>
      <div className="icone">{BASES[o.base].icone}</div>
      <div className="corps">
        <div className="nom">
          {o.rarete === 'legendaire' && '★ '}
          {o.nom}
          {o.forge ? ` +${o.forge}` : ''}
        </div>
        <div className="meta">
          {r.nom} · niv. {o.niveau}
          {o.classe ? ` · ${{ guerrier: 'Guerrier', mage: 'Mage', rodeur: 'Rôdeur' }[o.classe]}` : ''}
        </div>
        <div className="stats">
          {cles.map((k) => {
            const v = s[k] || 0
            const d = sc ? v - (sc[k] || 0) : 0
            return (
              <span key={k}>
                {NOMS_STATS[k]} {v ? `+${v}` : 0}
                {k === 'crit' ? '%' : ''}
                {sc && d !== 0 && <b className={d > 0 ? 'plus' : 'moins'}> ({d > 0 ? '▲' : '▼'}{Math.abs(d)})</b>}
              </span>
            )
          })}
          {Object.entries(o.elem || {}).map(([k, v]) => (
            <span key={k} style={{ color: TYPES[k].couleur }}>
              {TYPES[k].icone} +{v} %
            </span>
          ))}
        </div>
      </div>
      {children && <div className="cote">{children}</div>}
    </Tag>
  )
}

// Dialogue avec un personnage : liste de répliques à faire défiler
export function Dialogue({ repliques, onFin }) {
  const [i, setI] = useState(0)
  const r = repliques[i]
  const p = PNJ[r.pnj]
  const suivant = () => (i + 1 < repliques.length ? setI(i + 1) : onFin())
  return (
    <div className="dialogue" onClick={suivant}>
      <div className="perso">
        <img key={r.pnj} src={art(p.image)} alt={p.nom} />
      </div>
      <div className="boite panneau">
        <div className="qui">{p.nom}</div>
        <p>{r.texte}</p>
        <div className="suite">{i + 1 < repliques.length ? 'Toucher pour continuer ▸' : 'Toucher pour fermer ▸'}</div>
      </div>
    </div>
  )
}

// Force un nouveau rendu chaque seconde (comptes à rebours)
export function useHorloge(ms = 1000) {
  const [t, setT] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return t
}
