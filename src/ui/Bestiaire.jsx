import { useState } from 'react'
import { MONSTRES } from '../data/monsters.js'
import { TYPES, resumeType } from '../data/types.js'
import { Modale, Type, art } from './commun.jsx'

export default function Bestiaire({ s }) {
  const [fiche, setFiche] = useState(null)
  const ids = Object.keys(MONSTRES)
  const vus = ids.filter((id) => s.bestiaire[id]).length
  return (
    <div className="ecran" style={{ background: 'linear-gradient(#4a2c14, #2b1a0d)' }}>
      <div className="contenu">
        <h1 className="titre-ecran">Bestiaire</h1>
        <div className="panneau">
          <div className="ligne" style={{ marginBottom: 8 }}>
            <span className="discret">Monstres vaincus</span>
            <b style={{ marginLeft: 'auto' }}>{vus} / {ids.length}</b>
          </div>
          <div className="bestiaire">
            {ids.map((id) => {
              const m = MONSTRES[id]
              const connu = !!s.bestiaire[id]
              return (
                <button key={id} className={`fiche ${connu ? '' : 'inconnu'}`} onClick={() => connu && setFiche(id)}>
                  <img src={art(m.image)} alt="" />
                  <div className="n">{connu ? m.nom : '???'}</div>
                  {connu && <div className="discret">×{s.bestiaire[id]}</div>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="panneau">
          <h3 className="titre" style={{ fontSize: 18 }}>Les types</h3>
          <p className="discret" style={{ margin: '2px 0 6px' }}>
            Une attaque du bon type fait deux fois plus de dégâts (« super efficace »). Du mauvais type, deux fois moins.
          </p>
          <table className="table-types">
            <tbody>
              {Object.keys(TYPES).map((t) => {
                const r = resumeType(t)
                return (
                  <tr key={t}>
                    <td><Type t={t} /></td>
                    <td>
                      <span className="discret">Fort contre </span>
                      {r.fortContre.length ? r.fortContre.map((x) => TYPES[x].icone).join(' ') : 'rien'}
                    </td>
                    <td>
                      <span className="discret">Craint </span>
                      {r.faibleContre.length ? r.faibleContre.map((x) => TYPES[x].icone).join(' ') : 'rien'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {fiche && (
        <Modale onFermer={() => setFiche(null)}>
          <div className="bandeau">{MONSTRES[fiche].nom}</div>
          <div style={{ textAlign: 'center' }}>
            <img src={art(MONSTRES[fiche].image)} alt="" style={{ height: 160, objectFit: 'contain' }} />
            <div><Type t={MONSTRES[fiche].type} /></div>
          </div>
          <p>{MONSTRES[fiche].desc}</p>
          <p className="discret">
            Craint : {resumeType(MONSTRES[fiche].type).faibleContre.map((x) => TYPES[x].nom).join(', ') || 'rien de particulier'}
          </p>
          <p className="discret">Attaques : {MONSTRES[fiche].attaques.map((a) => a.nom).join(', ')}</p>
          <button className="btn bois petit" onClick={() => setFiche(null)}>Fermer</button>
        </Modale>
      )}
    </div>
  )
}
