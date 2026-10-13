import { useState } from 'react'
import { son } from './sons.js'
import { VILLES, PNJ, DIALOGUES, ORDRE_VILLES, BATIMENTS_VILLE, REPAS, EXPEDITIONS, DUREE_REPAS, REGLES_DEFI } from '../data/world.js'
import { MONSTRES } from '../data/monsters.js'
import { CLASSES, ORDRE_EQUIPE } from '../data/heroes.js'
import * as G from '../engine/game.js'
import { statsHeros } from '../engine/heroes.js'
import { formatDuree, maintenant } from '../engine/util.js'
import { Barre, Modale, art, useHorloge } from './commun.jsx'

export function EquipeMini({ s }) {
  return (
    <div className="equipe-mini">
      {ORDRE_EQUIPE.map((c) => {
        const h = s.heros[c]
        const st = statsHeros(h, s.inventaire, s.camp)
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

export default function Ville({ s, maj, lancerCombat, parler, aller, toast, finAventure, ouvrirDefi, onExpedition }) {
  const [confirmeVoyage, setConfirmeVoyage] = useState(false)
  const [auberge, setAuberge] = useState(false)
  const v = G.villeCourante(s)
  const pnj = PNJ[v.pnj]
  const battue = G.areneBattue(s)
  const lignes = DIALOGUES[v.pnj][battue ? 'apres' : 'avant']
  const voyage = G.infoVoyage(s)
  const toutFini = s.eclats.length === ORDRE_VILLES.length
  const c = G.caseCourante(s, s.ville)
  const p = G.etatParcours(s, s.ville)
  const defi = G.defiDuJour(s)
  const prochaine = !c ? 'Zone nettoyée, champion vaincu 💎' : c.t === 'champion' ? `Le champion ${MONSTRES[v.arene.boss].nom} vous attend !` : c.t === 'feu' ? 'Prochaine étape : le feu de camp' : `Case ${c.index + 1} sur 6 · ${c.t === 'elite' ? 'un élite vous attend' : 'combat'}`

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

        <BandeauxInfos s={s} onExpedition={onExpedition} />

        <div className="place">
          <button className={`batisse large ${c ? (c.t === 'champion' ? 'rouge' : 'vert') : ''}`} onClick={() => aller('parcours')}>
            <img src={art(c?.t === 'champion' ? 't-arene' : 't-porte')} alt="" />
            <span>
              <span className="n">{c ? `Expédition : ${v.zone.nom}` : `${v.zone.nom} 💎`}</span>
              <br />
              <span className="s">{prochaine}</span>
              {c && p.index > 0 && <span className="progression-mini">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i < p.index ? 'fait' : i === p.index ? 'ici' : ''} />)}</span>}
            </span>
          </button>
          {defi && (
            <button className="batisse large violet" onClick={ouvrirDefi}>
              <img src={art(MONSTRES[VILLES[defi.ville].arene.boss].image)} alt="" />
              <span>
                <span className="n">Défi du jour {REGLES_DEFI[defi.regle].icone}</span>
                <br />
                <span className="s">{defi.record ? `Votre record : ${defi.record.meilleur} tours` : `${REGLES_DEFI[defi.regle].nom} · prime de ${defi.prime} or`}</span>
              </span>
            </button>
          )}
          <Batisse image="t-boutique" nom="Boutique" sous="Potions et équipement" onClick={() => aller('boutique')} />
          <Batisse image="t-auberge" nom="Auberge" sous={s.repas ? `${REPAS[s.repas.id].icone} repas encore ${s.repas.combats} combats` : 'Repos et repas offerts'} onClick={() => setAuberge(true)} />
          <Batisse image="t-porte" nom="Chasse libre" sous="S'entraîner, butin réduit" onClick={() => lancerCombat({ type: 'chasse' })} />
          {v.batiments.map((k) => (
            <Batisse key={k} image={BATIMENTS_VILLE[k].image} nom={BATIMENTS_VILLE[k].court} sous={sousTitre(k, s)} badge={k === 'port' && G.expeditionRentree(s) ? '!' : null} onClick={() => aller(k)} />
          ))}
          {voyage && (
            <button className={`batisse large ${battue ? 'violet' : ''}`} disabled={!battue} onClick={() => setConfirmeVoyage(true)}>
              <img src={art('t-voyage')} alt="" />
              <span>
                <span className="n">Partir vers {VILLES[voyage.vers].nom}</span>
                <br />
                <span className="s">{battue ? `Par le ${voyage.nom}` : 'Battez d\'abord le champion de l\'arène'}</span>
              </span>
            </button>
          )}
          {!voyage && toutFini && (
            <button className="batisse large violet" onClick={finAventure}>
              <img src={art('p-roi')} alt="" />
              <span>
                <span className="n">{s.finVue ? 'Revoir la fin de l\'aventure' : 'Rapporter les éclats au roi'}</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {auberge && <Auberge s={s} maj={maj} toast={toast} onFermer={() => setAuberge(false)} />}

      {confirmeVoyage && (
        <Modale onFermer={() => setConfirmeVoyage(false)}>
          <div className="bandeau">En route ?</div>
          <p style={{ marginTop: 0 }}>
            Le <b>{voyage.nom}</b> mène à <b>{VILLES[voyage.vers].nom}</b>. Comme une zone : quelques combats, un feu de camp, un élite, et vous y êtes.
          </p>
          <p className="discret">Passez à l'auberge avant de partir. Une fois en route, la boutique et l'auberge de {v.nom} ne sont plus accessibles.</p>
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

// L'auberge : repos complet et un repas offert, au choix
function Auberge({ s, maj, toast, onFermer }) {
  const enForme = G.equipeEnForme(s)
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">Auberge</div>
      <p style={{ marginTop: 0 }}>Un bon lit pour les héros, offert par la maison. Et un repas au choix, qui renforce l'équipe pendant {DUREE_REPAS} combats.</p>
      <div className="pile" style={{ gap: 8 }}>
        {Object.entries(REPAS).map(([id, r]) => (
          <button
            key={id}
            className={`choix-repas ${s.repas?.id === id ? 'actif' : ''}`}
            onClick={() => {
              maj((d) => {
                G.seReposer(d)
                G.prendreRepas(d, id)
              })
              son('soin')
              toast(`${r.icone} Bien dormi, bien mangé : ${r.desc} pour ${DUREE_REPAS} combats !`)
              onFermer()
            }}
          >
            <span style={{ fontSize: 28 }}>{r.icone}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <b>{r.nom}</b>
              <br />
              <span className="discret">{r.desc}</span>
            </span>
            <span className="porte">Offert</span>
          </button>
        ))}
      </div>
      <div className="grille2" style={{ marginTop: 10 }}>
        <button className="btn bois petit" onClick={onFermer}>Fermer</button>
        <button
          className="btn vert petit"
          disabled={enForme}
          onClick={() => {
            maj((d) => G.seReposer(d))
            son('soin')
            toast('L\'équipe a bien dormi : PV et PM au maximum !')
            onFermer()
          }}
        >
          {enForme ? 'Déjà en forme' : 'Dormir seulement'}
        </button>
      </div>
    </Modale>
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
  if (k === 'maitre') return 'Nouvelles capacités'
  if (k === 'port') return s.expedition ? (G.expeditionRentree(s) ? 'Bateau rentré !' : 'Bateau en mer') : 'Expéditions en mer'
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

