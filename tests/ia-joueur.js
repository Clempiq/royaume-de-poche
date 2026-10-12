// Une IA simple qui joue à la place du joueur, pour les tests
// et pour vérifier l'équilibrage.
import { actif, vivants, agir, avancer, tourMonstre, competenceParId } from '../src/engine/battle.js'
import { efficacite } from '../src/data/types.js'

export function choisirAction(b) {
  const u = actif(b)
  const ennemis = vivants(b, 'm')
  const allies = b.units.filter((x) => x.camp === 'h')
  const cible = ennemis.slice().sort((a, c) => a.pv - c.pv)[0]
  // Réanimer
  const ko = allies.find((x) => x.ko)
  if (ko && b.sac.plume > 0) return { kind: 'objet', id: 'plume', cible: ko.uid }
  // Soigner
  const blesse = allies.filter((x) => !x.ko).sort((a, c) => a.pv / a.max.pv - c.pv / c.max.pv)[0]
  if (u.classe === 'mage' && blesse.pv / blesse.max.pv < 0.45 && u.pm >= 4) return { kind: 'competence', id: 'soin', cible: blesse.uid }
  if (blesse.pv / blesse.max.pv < 0.3 && b.sac.potion > 0) return { kind: 'objet', id: 'potion', cible: blesse.uid }
  if (blesse.pv / blesse.max.pv < 0.3 && b.sac.superpotion > 0) return { kind: 'objet', id: 'superpotion', cible: blesse.uid }
  // Meilleure attaque
  let meilleur = { kind: 'attaque', cible: cible.uid, score: 100 * efficacite('neutre', cible.type) }
  for (const id of u.competences) {
    const c = competenceParId(u.classe, id)
    if (!c.puissance || c.cout > u.pm) continue
    const nb = c.cible === 'ennemis' ? ennemis.length : 1
    let score = 0
    if (c.cible === 'ennemis') for (const e of ennemis) score += c.puissance * efficacite(c.type, e.type)
    else score = c.puissance * efficacite(c.type || 'neutre', cible.type) * (c.coups || 1)
    if (c.stat === 'mag' && u.classe !== 'mage') score *= 0.4
    score -= c.cout * 2
    if (nb === 1 && c.cible === 'ennemis') score *= 0.9
    if (score > meilleur.score) meilleur = { kind: 'competence', id, cible: cible.uid, score }
  }
  return meilleur
}

export function jouerCombat(b, maxTours = 400) {
  for (let i = 0; i < maxTours && !b.fini; i++) {
    const { unite } = avancer(b)
    if (!unite) break
    if (unite.camp === 'm') tourMonstre(b)
    else agir(b, choisirAction(b))
  }
  return b.fini
}
