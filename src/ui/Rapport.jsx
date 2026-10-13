import { CLASSES } from '../data/heroes.js'
import { CONSOMMABLES } from '../data/items.js'
import { MONSTRES } from '../data/monsters.js'
import { Modale, Objet } from './commun.jsx'

export function Rapport({ r, onContinuer, onFermer }) {
  if (r.issue === 'defaite') {
    return (
      <Modale onFermer={onFermer}>
        <div className="bandeau defaite">Défaite…</div>
        <p style={{ marginTop: 0 }}>Vos héros se réveillent {r.contexte?.cle === 'route' ? 'au bivouac' : 'à l\'auberge'}, un peu cabossés mais entiers.</p>
        {r.recul > 0 && <p className="discret">Retour au dernier point de passage 🚩 ({r.recul} case{r.recul > 1 ? 's' : ''} à refaire, sans nouvelle récompense).</p>}
        <p className="discret">Conseil : lisez les intentions des monstres, gardez le Coup de bouclier de Bastien pour les grosses attaques, et améliorez la Caserne et les Remparts du village.</p>
        <button className="btn vert" onClick={onFermer}>D'accord</button>
      </Modale>
    )
  }
  if (r.issue === 'fuite') {
    return (
      <Modale onFermer={onFermer}>
        <div className="bandeau">Prudence est mère de sûreté</div>
        <p style={{ marginTop: 0 }}>Vous avez échappé aux monstres.</p>
        <button className="btn vert" onClick={onFermer}>Continuer</button>
      </Modale>
    )
  }
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau victoire">Victoire !</div>
      {r.dejaRecompense && <p className="discret" style={{ marginTop: 0, textAlign: 'center' }}>Case déjà gagnée une fois : pas de nouvelle récompense.</p>}
      {r.eclat && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div className="eclats"><div className="eclat obtenu" style={{ width: 40, height: 40 }} /></div>
          <div className="titre" style={{ fontSize: 20, marginTop: 10 }}>Éclat du Sceptre obtenu !</div>
          <div className="discret">{MONSTRES[r.eclat].nom} est vaincu. La route vers la ville suivante est ouverte.</div>
          {r.objets.some((o) => o.pouvoir) && <div className="discret" style={{ color: 'var(--or-fonce)' }}>★ Un objet légendaire à pouvoir !</div>}
        </div>
      )}
      {!r.dejaRecompense && (
        <div className="grille2" style={{ marginBottom: 8 }}>
          <div className="stat"><b>+{r.xp}</b><span>XP par héros</span></div>
          <div className="stat"><b>+{r.or}</b><span>or</span></div>
        </div>
      )}
      {r.niveaux.map((n, i) => (
        <div key={i} className="competence" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>⬆️</span>
          <div>
            <div className="n">{CLASSES[n.classe].prenom} passe au niveau {n.niveau} !</div>
            {n.competences.length > 0 && <div className="d" style={{ color: 'var(--violet)' }}>Nouvelle capacité : {n.competences.join(', ')}</div>}
            {n.aEquiper && <div className="d">4 capacités déjà équipées : choisissez lesquelles garder dans Équipe.</div>}
          </div>
        </div>
      ))}
      {Object.entries(r.consommables).map(([k, n]) => (
        <div key={k} className="competence">
          <span style={{ fontSize: 22 }}>{CONSOMMABLES[k].icone}</span>
          <div className="n">{CONSOMMABLES[k].nom} ×{n}</div>
        </div>
      ))}
      {r.objets.length > 0 && <div className="discret" style={{ margin: '8px 0 4px' }}>Butin</div>}
      <div className="pile" style={{ gap: 6 }}>
        {r.objets.map((o) => (
          <Objet key={o.id} o={o}>{o.vendu && <span className="porte">Sac plein : vendu</span>}</Objet>
        ))}
      </div>
      <div className="grille2" style={{ marginTop: 12 }}>
        {onContinuer && !r.eclat ? (
          <>
            <button className="btn bois petit" onClick={onFermer}>Retour</button>
            <button className="btn vert petit" onClick={onContinuer}>{r.contexte?.type === 'parcours' ? 'Case suivante ▸' : 'Combat suivant ⚔️'}</button>
          </>
        ) : (
          <button className="btn vert petit" style={{ gridColumn: 'span 2' }} onClick={onFermer}>Super !</button>
        )}
      </div>
    </Modale>
  )
}

// Résultat du défi du jour
export function RapportDefi({ r, onFermer }) {
  return (
    <Modale onFermer={onFermer}>
      <div className={`bandeau ${r.issue === 'victoire' ? 'victoire' : 'defaite'}`}>{r.issue === 'victoire' ? 'Défi relevé !' : 'Défi raté…'}</div>
      {r.issue === 'victoire' ? (
        <>
          <div className="grille2" style={{ marginBottom: 8 }}>
            <div className="stat"><b>{r.tours}</b><span>tours</span></div>
            <div className="stat"><b>{r.or ? `+${r.or}` : '·'}</b><span>{r.or ? 'or (prime du jour)' : 'prime déjà touchée'}</span></div>
          </div>
          {r.record && <p style={{ textAlign: 'center', margin: '4px 0' }}>🏆 Nouveau record du jour !</p>}
        </>
      ) : (
        <p style={{ marginTop: 0 }}>Le champion a eu le dernier mot. Le défi ne coûte rien : retentez quand vous voulez !</p>
      )}
      <button className="btn vert" onClick={onFermer}>D'accord</button>
    </Modale>
  )
}

export function RetourExpedition({ r, onFermer }) {
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">⛵ Retour de mer</div>
      <p style={{ marginTop: 0 }}>Le bateau rentre de l'expédition <b>{r.nom}</b> !</p>
      <div className="stat" style={{ marginBottom: 8 }}><b>+{r.or}</b><span>or</span></div>
      {Object.entries(r.consommables).map(([k, n]) => (
        <div key={k} className="competence">
          <span style={{ fontSize: 22 }}>{CONSOMMABLES[k].icone}</span>
          <div className="n">{CONSOMMABLES[k].nom} ×{n}</div>
        </div>
      ))}
      <div className="pile" style={{ gap: 6, marginTop: 6 }}>
        {r.objets.map((o) => (
          <Objet key={o.id} o={o}>{o.vendu && <span className="porte">Sac plein : vendu</span>}</Objet>
        ))}
      </div>
      <button className="btn vert" style={{ marginTop: 12 }} onClick={onFermer}>Super !</button>
    </Modale>
  )
}
