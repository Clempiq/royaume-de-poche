import { useState } from 'react'
import { art } from './commun.jsx'

export default function Titre({ aUneSauvegarde, onJouer, onNouvelle }) {
  const [confirme, setConfirme] = useState(false)
  return (
    <div className="ecran">
      <div className="fond" style={{ backgroundImage: `url(${art('v-brioche')})` }} />
      <div className="contenu" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div className="titre-jeu">
          <h1>
            Royaume
            <br />
            de Poche
          </h1>
          <p>Trois héros, des monstres grincheux et un sceptre en mille morceaux.</p>
        </div>
        <div className="equipe-titre">
          <img src={art('hero-guerrier')} alt="" />
          <img src={art('hero-mage')} alt="" />
          <img src={art('hero-rodeur')} alt="" />
        </div>
        <div className="pile" style={{ marginTop: 'auto' }}>
          {aUneSauvegarde ? (
            <>
              <button className="btn vert" onClick={onJouer}>▶ Continuer l'aventure</button>
              {!confirme ? (
                <button className="btn bois petit" onClick={() => setConfirme(true)}>Nouvelle partie</button>
              ) : (
                <button className="btn rouge petit" onClick={onNouvelle}>Effacer la sauvegarde et recommencer ?</button>
              )}
            </>
          ) : (
            <button className="btn vert" onClick={onNouvelle}>▶ Commencer l'aventure</button>
          )}
          <p style={{ textAlign: 'center', color: '#fff', fontSize: 12, textShadow: '0 1px 3px #000', margin: '4px 0 0' }}>
            Un jeu du studio Cosmoth · sauvegarde automatique sur cet appareil
          </p>
        </div>
      </div>
    </div>
  )
}
