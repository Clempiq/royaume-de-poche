import { useState } from 'react'
import { CLASSES, ORDRE_EQUIPE, NIVEAU_MAX, xpPourNiveau } from '../data/heroes.js'
import { CONSOMMABLES, EMPLACEMENTS, RARETES } from '../data/items.js'
import * as G from '../engine/game.js'
import { statsHeros } from '../engine/heroes.js'
import { prixVente } from '../engine/loot.js'
import { Barre, Modale, Objet, Type, art } from './commun.jsx'

export default function Equipe({ s, maj, toast }) {
  const [onglet, setOnglet] = useState('guerrier')
  return (
    <div className="ecran" style={{ background: 'linear-gradient(#4a2c14, #2b1a0d)' }}>
      <div className="contenu">
        <div className="onglets">
          {ORDRE_EQUIPE.map((c) => (
            <button key={c} className={`onglet ${onglet === c ? 'actif' : ''}`} onClick={() => setOnglet(c)}>
              <img src={art(CLASSES[c].image)} alt="" />
              {CLASSES[c].prenom}
            </button>
          ))}
          <button className={`onglet ${onglet === 'sac' ? 'actif' : ''}`} onClick={() => setOnglet('sac')}>
            <span style={{ fontSize: 34, lineHeight: '44px' }}>🎒</span>
            Sac
          </button>
        </div>
        {onglet === 'sac' ? <Sac s={s} maj={maj} toast={toast} /> : <FicheHeros key={onglet} classe={onglet} s={s} maj={maj} toast={toast} />}
      </div>
    </div>
  )
}

function FicheHeros({ classe, s, maj, toast }) {
  const [choixSlot, setChoixSlot] = useState(null)
  const h = s.heros[classe]
  const c = CLASSES[classe]
  const st = statsHeros(h, s.inventaire)
  const xpMax = xpPourNiveau(h.niveau)
  const consommables = Object.entries(s.sac).filter(([id, n]) => n > 0 && (CONSOMMABLES[id].effet.pv || CONSOMMABLES[id].effet.pm || CONSOMMABLES[id].effet.reanime))

  return (
    <>
      <div className="panneau">
        <div className="ligne" style={{ alignItems: 'flex-start' }}>
          <img src={art(c.image)} alt={c.prenom} style={{ width: 92, height: 110, objectFit: 'contain', flex: 'none' }} />
          <div style={{ flex: 1 }}>
            <h2 className="titre" style={{ fontSize: 24 }}>{c.prenom}</h2>
            <div className="discret">{c.nom} · {c.role}</div>
            <div style={{ marginTop: 6, fontFamily: 'var(--titre)' }}>Niveau {h.niveau}{h.niveau >= NIVEAU_MAX ? ' (max)' : ''}</div>
            {h.niveau < NIVEAU_MAX && <Barre val={h.xp} max={xpMax} sorte="xp" texte={`${h.xp} / ${xpMax} XP`} />}
            <div style={{ marginTop: 6 }}>
              <Barre val={h.pv} max={st.pv} texte={`PV ${h.pv} / ${st.pv}`} />
              <div style={{ height: 4 }} />
              <Barre val={h.pm} max={st.pm} sorte="pm" texte={`PM ${h.pm} / ${st.pm}`} />
            </div>
          </div>
        </div>
        <div className="stats-heros">
          <Stat n="Attaque" v={st.atq} />
          <Stat n="Magie" v={st.mag} />
          <Stat n="Défense" v={st.def} />
          <Stat n="Vitesse" v={st.vit} />
        </div>
        <div className="discret" style={{ textAlign: 'center' }}>
          Critique {st.crit} %
          {Object.entries(st.elem).map(([k, v]) => ` · ${k} +${v} %`)}
        </div>
        {consommables.length > 0 && (
          <div className="ligne" style={{ flexWrap: 'wrap', marginTop: 8 }}>
            {consommables.map(([id, n]) => (
              <button
                key={id}
                className="btn vert petit"
                style={{ width: 'auto', flex: 1 }}
                onClick={() => {
                  const ok = maj((d) => G.utiliserConsommable(d, id, classe))
                  if (!ok) toast(CONSOMMABLES[id].effet.reanime ? `${c.prenom} n'est pas K.O.` : `${c.prenom} ne peut pas l'utiliser maintenant.`)
                }}
              >
                {CONSOMMABLES[id].icone} ×{n}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panneau">
        <h3 className="titre" style={{ fontSize: 18, marginBottom: 4 }}>Équipement</h3>
        {Object.keys(EMPLACEMENTS).map((slot) => {
          const id = h.equip[slot]
          const o = id ? s.inventaire.find((x) => x.id === id) : null
          return (
            <div key={slot} className="emplacement">
              <div className="lib">{EMPLACEMENTS[slot].icone} {EMPLACEMENTS[slot].nom}</div>
              <div style={{ flex: 1 }}>
                {o ? (
                  <Objet o={o} onClick={() => setChoixSlot(slot)} />
                ) : (
                  <button className="btn bois petit" onClick={() => setChoixSlot(slot)}>Choisir…</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="panneau">
        <h3 className="titre" style={{ fontSize: 18, marginBottom: 4 }}>Compétences</h3>
        {c.competences.map((k) => (
          <div key={k.id} className={`competence ${k.niveau > h.niveau ? 'verrou' : ''}`}>
            <div style={{ flex: 1 }}>
              <div className="ligne">
                <span className="n">{k.niveau > h.niveau ? '🔒 ' : ''}{k.nom}</span>
                {k.type && <Type t={k.type} />}
                <span className="discret" style={{ marginLeft: 'auto' }}>{k.niveau > h.niveau ? `niv. ${k.niveau}` : `${k.cout} PM`}</span>
              </div>
              <div className="d">{k.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {choixSlot && <ChoixEquipement s={s} classe={classe} slot={choixSlot} maj={maj} onFermer={() => setChoixSlot(null)} />}
    </>
  )
}

function Stat({ n, v }) {
  return (
    <div className="stat">
      <b>{v}</b>
      <span>{n}</span>
    </div>
  )
}

function ChoixEquipement({ s, classe, slot, maj, onFermer }) {
  const h = s.heros[classe]
  const actuel = h.equip[slot] ? s.inventaire.find((x) => x.id === h.equip[slot]) : null
  const ordre = Object.keys(RARETES)
  const choix = s.inventaire
    .filter((o) => o.slot === slot && (!o.classe || o.classe === classe) && o.id !== h.equip[slot])
    .sort((a, b) => ordre.indexOf(b.rarete) - ordre.indexOf(a.rarete) || b.niveau - a.niveau)
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">{EMPLACEMENTS[slot].nom} de {CLASSES[classe].prenom}</div>
      {actuel && (
        <>
          <div className="discret">Porté actuellement</div>
          <Objet o={actuel} />
          <button className="btn bois petit" style={{ marginTop: 6 }} onClick={() => { maj((d) => G.desequiper(d, classe, slot)); onFermer() }}>
            Retirer
          </button>
        </>
      )}
      <div className="discret" style={{ marginTop: 10 }}>{choix.length ? 'Touchez un objet pour l\'équiper' : 'Aucun objet compatible dans le sac.'}</div>
      <div className="pile" style={{ gap: 6, marginTop: 6 }}>
        {choix.map((o) => {
          const p = G.porteur(s, o.id)
          return (
            <Objet key={o.id} o={o} compare={actuel} onClick={() => { maj((d) => G.equiper(d, classe, o.id)); onFermer() }}>
              {p && <span className="porte">{CLASSES[p].prenom}</span>}
            </Objet>
          )
        })}
      </div>
      <button className="btn bois petit" style={{ marginTop: 10 }} onClick={onFermer}>Fermer</button>
    </Modale>
  )
}

function Sac({ s, maj, toast }) {
  const [aConfirmer, setAConfirmer] = useState(null)
  const ordre = Object.keys(RARETES)
  const libres = s.inventaire.filter((o) => !G.estEquipe(s, o.id)).length
  const tries = s.inventaire.slice().sort((a, b) => ordre.indexOf(b.rarete) - ordre.indexOf(a.rarete) || b.niveau - a.niveau)
  return (
    <>
      <div className="panneau">
        <h3 className="titre" style={{ fontSize: 18 }}>Consommables</h3>
        {!Object.keys(s.sac).length && <p className="discret">Rien pour l'instant. La boutique en vend.</p>}
        {Object.entries(s.sac).map(([id, n]) => (
          <div key={id} className="competence">
            <span style={{ fontSize: 22 }}>{CONSOMMABLES[id].icone}</span>
            <div style={{ flex: 1 }}>
              <div className="n">{CONSOMMABLES[id].nom} ×{n}</div>
              <div className="d">{CONSOMMABLES[id].desc}</div>
            </div>
          </div>
        ))}
        <p className="discret" style={{ marginBottom: 0 }}>Pour utiliser un soin hors combat, ouvrez la fiche du héros.</p>
      </div>
      <div className="panneau">
        <div className="ligne">
          <h3 className="titre" style={{ fontSize: 18 }}>Équipement</h3>
          <span className="discret" style={{ marginLeft: "auto" }}>{libres} / {G.TAILLE_SAC} objets en réserve</span>
        </div>
        <div className="pile" style={{ gap: 6, marginTop: 8 }}>
          {tries.map((o) => {
            const p = G.porteur(s, o.id)
            return (
              <Objet key={o.id} o={o}>
                {p ? (
                  <span className="porte">{CLASSES[p].prenom}</span>
                ) : (
                  <button
                    className="btn bois petit"
                    style={{ minHeight: 30, fontSize: 13, width: 'auto' }}
                    onClick={() => {
                      if ((o.rarete === 'epique' || o.rarete === 'legendaire') && aConfirmer !== o.id) return setAConfirmer(o.id)
                      const prix = prixVente(o)
                      maj((d) => G.vendre(d, o.id))
                      setAConfirmer(null)
                      toast(`${o.nom} vendu pour ${prix} or.`)
                    }}
                  >
                    {aConfirmer === o.id ? 'Confirmer ?' : `Vendre ${prixVente(o)} 🪙`}
                  </button>
                )}
              </Objet>
            )
          })}
        </div>
      </div>
    </>
  )
}
