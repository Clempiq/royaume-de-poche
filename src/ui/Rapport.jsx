import { CLASSES } from '../data/heroes.js'
import { CONSOMMABLES } from '../data/items.js'
import { MONSTRES } from '../data/monsters.js'
import { VILLES } from '../data/world.js'
import { Modale, Objet } from './commun.jsx'

export function Rapport({ r, onContinuer, onFermer }) {
  if (r.issue === 'defaite') {
    return (
      <Modale onFermer={onFermer}>
        <div className="bandeau defaite">Défaite…</div>
        <p style={{ marginTop: 0 }}>Vos héros se réveillent à l'auberge, un peu cabossés mais entiers.</p>
        {r.or < 0 && <p className="discret">Dans la panique, vous avez perdu {-r.or} pièces d'or.</p>}
        <p className="discret">Conseil : entraînez-vous encore un peu, améliorez votre équipement à la forge, et pensez aux types !</p>
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
      {r.eclat && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div className="eclats"><div className="eclat obtenu" style={{ width: 40, height: 40 }} /></div>
          <div className="titre" style={{ fontSize: 20, marginTop: 10 }}>Éclat du Sceptre obtenu !</div>
          <div className="discret">{MONSTRES[r.eclat].nom} est vaincu. La route vers la ville suivante est ouverte.</div>
        </div>
      )}
      <div className="grille2" style={{ marginBottom: 8 }}>
        <div className="stat"><b>+{r.xp}</b><span>XP par héros</span></div>
        <div className="stat"><b>+{r.or}</b><span>or</span></div>
      </div>
      {r.niveaux.map((n, i) => (
        <div key={i} className="competence" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>⬆️</span>
          <div>
            <div className="n">{CLASSES[n.classe].prenom} passe au niveau {n.niveau} !</div>
            {n.competences.length > 0 && <div className="d" style={{ color: 'var(--violet)' }}>Nouvelle compétence : {n.competences.join(', ')}</div>}
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
            <button className="btn vert petit" onClick={onContinuer}>Combat suivant ⚔️</button>
          </>
        ) : (
          <button className="btn vert petit" style={{ gridColumn: 'span 2' }} onClick={onFermer}>Super !</button>
        )}
      </div>
    </Modale>
  )
}

export function Carnet({ r, onFermer }) {
  return (
    <Modale onFermer={onFermer}>
      <div className="bandeau">Carnet de route</div>
      <p style={{ marginTop: 0 }}>Bienvenue à <b>{VILLES[r.ville].nom}</b> ! Voici ce qui s'est passé en chemin :</p>
      <div className="pile" style={{ gap: 8 }}>
        {r.recits.map((x, i) => (
          <div key={i} className="panneau" style={{ padding: 8, boxShadow: 'none', borderWidth: 2 }}>
            <div style={{ fontSize: 14 }}>{x.texte}</div>
            {x.gains.map((g) => (
              <div key={g} style={{ color: 'var(--vert-fonce)', fontSize: 13 }}>{g}</div>
            ))}
            {x.objet && <div style={{ marginTop: 6 }}><Objet o={x.objet} /></div>}
          </div>
        ))}
      </div>
      <p className="discret">L'équipe s'est reposée en arrivant : PV et PM au maximum.</p>
      <button className="btn vert" onClick={onFermer}>Découvrir la ville</button>
    </Modale>
  )
}
