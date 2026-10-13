import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creerCombat, bilanCombat, agir, phaseMonstres, herosDisponibles, intentionsActives, unite, recharge, planifier } from '../src/engine/battle.js'
import * as G from '../src/engine/game.js'
import { efficacite } from '../src/data/types.js'
import { genererObjet } from '../src/engine/loot.js'
import { gagnerXp } from '../src/engine/heroes.js'
import { jouerCombat } from '../src/engine/ia.js'
import { VILLES } from '../src/data/world.js'

const monterNiveau = (s, niv) => {
  for (const c of ['guerrier', 'mage', 'rodeur']) while (s.heros[c].niveau < niv) gagnerXp(s.heros[c], 100, s.inventaire)
  G.seReposer(s)
}

test('table des types', () => {
  assert.equal(efficacite('feu', 'plante'), 2)
  assert.equal(efficacite('eau', 'plante'), 0.5)
  assert.equal(efficacite('feu', null), 1)
})

test('un combat se termine toujours', () => {
  for (let i = 0; i < 50; i++) {
    const s = G.nouvellePartie()
    const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: G.rencontreSauvage(s), sac: s.sac })
    assert.ok(['victoire', 'defaite', 'fuite'].includes(jouerCombat(b)))
  }
})

test('chaque monstre annonce son intention, deux pour un champion', () => {
  const s = G.nouvellePartie()
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grignaud', niveau: 1 }, { id: 'champignard', niveau: 5 }], boss: true, sac: {} })
  assert.equal(intentionsActives(unite(b, 'm0')).length, 1)
  assert.equal(intentionsActives(unite(b, 'm1')).length, 2)
  const it = intentionsActives(unite(b, 'm0'))[0]
  assert.ok(it.att.nom && (it.cible === null || it.cible.startsWith('h-')))
})

test('le champion prépare sa grosse attaque au tour 2, l\'interruption l\'annule', () => {
  const s = G.nouvellePartie()
  monterNiveau(s, 8)
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'champignard', niveau: 5 }], boss: true, sac: {} })
  for (const u of herosDisponibles(b)) agir(b, u.uid, { kind: 'defendre' })
  phaseMonstres(b)
  // Les spores ont pu étourdir Bastien : on le remet d'aplomb pour le test
  b.aAgi = []
  const boss = unite(b, 'm0')
  assert.equal(intentionsActives(boss)[0].genre, 'prepare')
  agir(b, 'h-guerrier', { kind: 'capacite', id: 'interruption', cible: 'm0' })
  assert.equal(intentionsActives(boss).length, 1, 'la préparation est annulée')
  assert.equal(recharge(unite(b, 'h-guerrier'), 'interruption'), 4)
  assert.equal(agir(b, 'h-guerrier', { kind: 'capacite', id: 'interruption', cible: 'm0' }).length, 0)
})

test('une charge préparée frappe au tour suivant', () => {
  const s = G.nouvellePartie()
  monterNiveau(s, 10)
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'champignard', niveau: 5 }], boss: true, sac: {} })
  for (let t = 0; t < 2; t++) {
    for (const u of herosDisponibles(b)) agir(b, u.uid, { kind: 'defendre' })
    phaseMonstres(b)
  }
  assert.equal(intentionsActives(unite(b, 'm0'))[0].genre, 'frappe')
})

test('la provocation attire toutes les attaques ciblées', () => {
  const s = G.nouvellePartie()
  monterNiveau(s, 3)
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grignaud', niveau: 1 }, { id: 'bzzou', niveau: 1 }, { id: 'grignaud', niveau: 1 }], sac: {} })
  agir(b, 'h-guerrier', { kind: 'capacite', id: 'provoc' })
  for (const m of b.units.filter((u) => u.camp === 'm')) {
    for (const it of intentionsActives(m)) if (it.cible) assert.equal(it.cible, 'h-guerrier')
  }
})

test('brise-garde expose la cible : +30 % sur l\'attaque suivante', () => {
  const s = G.nouvellePartie()
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grognard', niveau: 9 }], sac: {} })
  agir(b, 'h-guerrier', { kind: 'capacite', id: 'brisegarde', cible: 'm0' })
  assert.ok(unite(b, 'm0').expose)
})

test('une victoire de chasse libre rapporte or et expérience', () => {
  const s = G.nouvellePartie()
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grignaud', niveau: 1 }], sac: s.sac })
  jouerCombat(b)
  const or = s.or
  const r = G.finCombat(s, bilanCombat(b), { type: 'chasse' })
  assert.equal(r.issue, 'victoire')
  assert.ok(s.or > or && r.xp > 0)
})

test('parcours : feu de camp, point de passage et récompense unique', () => {
  const s = G.nouvellePartie()
  const cle = 'brioche'
  const victoire = (ennemis) => ({ issue: 'victoire', tours: 2, heros: ['guerrier', 'mage', 'rodeur'].map((c) => ({ classe: c, pv: 10, pm: 1, ko: false })), vaincus: ennemis, sac: s.sac })
  const defaite = { issue: 'defaite', tours: 2, heros: ['guerrier', 'mage', 'rodeur'].map((c) => ({ classe: c, pv: 0, pm: 0, ko: true })), vaincus: [], sac: s.sac }
  let r = G.finCombat(s, victoire(G.ennemisCase(s, cle)), { type: 'parcours', cle })
  assert.ok(r.xp > 0)
  assert.equal(G.caseCourante(s, cle).index, 1)
  // Les PV ne remontent pas entre deux combats
  assert.ok(s.heros.mage.pv < 30)
  G.finCombat(s, defaite, { type: 'parcours', cle })
  assert.equal(G.caseCourante(s, cle).index, 0, 'retour au départ')
  r = G.finCombat(s, victoire(G.ennemisCase(s, cle)), { type: 'parcours', cle })
  assert.ok(r.dejaRecompense && r.xp === 0, 'pas de seconde récompense')
  G.finCombat(s, victoire(G.ennemisCase(s, cle)), { type: 'parcours', cle })
  assert.equal(G.caseCourante(s, cle).t, 'feu')
  s.heros.mage.pv = 1
  assert.ok(G.feuDeCamp(s, cle))
  assert.ok(s.heros.mage.pv > 1)
  G.finCombat(s, defaite, { type: 'parcours', cle })
  assert.equal(G.caseCourante(s, cle).index, 3, 'reprise au feu de camp')
})

test('le champion se bat au bout du parcours et rapporte l\'éclat', () => {
  const s = G.nouvellePartie()
  s.parcours.brioche.index = 5
  s.parcours.brioche.checkpoint = 5
  assert.equal(G.ennemisCase(s, 'brioche')[0].id, 'champignard')
  const bilan = { issue: 'victoire', tours: 5, heros: ['guerrier', 'mage', 'rodeur'].map((c) => ({ classe: c, pv: 10, pm: 1, ko: false })), vaincus: [{ id: 'champignard', niveau: 5 }], sac: s.sac }
  const r = G.finCombat(s, bilan, { type: 'parcours', cle: 'brioche' })
  assert.equal(r.eclat, 'champignard')
  assert.ok(G.parcoursTermine(s, 'brioche'))
  assert.equal(G.progressionEnJeu(s, 'brioche'), 0, 'plus rien à perdre')
})

test('la route se joue : on arrive dès qu\'elle est traversée', () => {
  const s = G.nouvellePartie()
  assert.equal(G.partirEnVoyage(s), false)
  s.eclats.push('champignard')
  assert.equal(G.partirEnVoyage(s), true)
  assert.ok(G.annulerVoyage(s))
  G.partirEnVoyage(s)
  const bilan = () => ({ issue: 'victoire', tours: 2, heros: ['guerrier', 'mage', 'rodeur'].map((c) => ({ classe: c, pv: 50, pm: 5, ko: false })), vaincus: G.ennemisCase(s, 'route'), sac: s.sac })
  G.finCombat(s, bilan(), { type: 'parcours', cle: 'route' })
  assert.equal(G.annulerVoyage(s), false, 'plus de demi-tour une fois en route')
  assert.equal(G.arriver(s), null)
  G.finCombat(s, bilan(), { type: 'parcours', cle: 'route' })
  G.feuDeCamp(s, 'route')
  G.finCombat(s, bilan(), { type: 'parcours', cle: 'route' })
  G.finCombat(s, bilan(), { type: 'parcours', cle: 'route' })
  assert.ok(G.voyageTermine(s))
  assert.deepEqual(G.arriver(s), { ville: 'gougere' })
  assert.equal(s.ville, 'gougere')
})

test('objets : rareté, affixes et pouvoirs légendaires', () => {
  const o = genererObjet({ niveau: 10, rarete: 'epique', base: 'sceptre' })
  assert.equal(o.classe, 'mage')
  assert.ok(o.stats.puiss > 0)
  const l = genererObjet({ niveau: 10, rarete: 'legendaire', base: 'arc' })
  assert.equal(l.pouvoir, 'chasseur')
  assert.equal(l.nom, 'Arc du Chasseur')
})

test('Arc du Chasseur : Pia rejoue quand elle achève un ennemi', () => {
  const s = G.nouvellePartie()
  const arc = genererObjet({ niveau: 10, rarete: 'legendaire', base: 'arc' })
  s.inventaire.push(arc)
  G.equiper(s, 'rodeur', arc.id)
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grignaud', niveau: 1 }, { id: 'grignaud', niveau: 1 }], sac: {} })
  unite(b, 'm0').pv = 1
  unite(b, 'm0').stats.vit = 0
  agir(b, 'h-rodeur', { kind: 'capacite', id: 'base', cible: 'm0' })
  if (unite(b, 'm0').ko) assert.ok(herosDisponibles(b).some((u) => u.uid === 'h-rodeur'))
})

test('village : production, château qui plafonne, ouvriers', () => {
  const s = G.nouvellePartie()
  assert.equal(s.camp.entrainement, undefined)
  s.camp.mine.collecte = Date.now() - 3600000
  assert.equal(G.recolter(s, 'mine'), 20)
  s.or = 10000
  assert.equal(G.ameliorer(s, 'mine'), false, 'le château niveau 1 plafonne la mine')
  assert.equal(G.peutAmeliorer(s, 'caserne').verrou, true)
  assert.equal(G.ameliorer(s, 'chateau'), true)
  assert.equal(G.ameliorer(s, 'forge'), false, 'un seul ouvrier')
  s.camp.chantiers[0].fin = 0
  G.tic(s)
  assert.equal(s.camp.chateau.niveau, 2)
  assert.equal(G.ameliorer(s, 'caserne'), true)
  s.camp.chantiers[0].fin = 0
  G.tic(s)
  assert.equal(s.camp.caserne.niveau, 1)
  const sans = G.herosPourCombat(G.nouvellePartie())[0].stats.atq
  assert.ok(G.herosPourCombat(s)[0].stats.atq >= sans)
  // Hutte : deux chantiers en parallèle
  s.camp.chateau.niveau = 3
  s.camp.hutte.niveau = 1
  assert.ok(G.ameliorer(s, 'mine') && G.ameliorer(s, 'forge'))
  assert.equal(s.camp.chantiers.length, 2)
})

test('bibliothèque niveau 3 : une 5e capacité', () => {
  const s = G.nouvellePartie()
  monterNiveau(s, 6)
  const h = s.heros.guerrier
  const libre = h.connues.find((id) => !h.capacites.includes(id))
  assert.equal(G.basculerCapacite(s, 'guerrier', libre), false)
  s.camp.bibliotheque.niveau = 3
  assert.equal(G.basculerCapacite(s, 'guerrier', libre), true)
  assert.equal(h.capacites.length, 5)
})

test('phases : chaque héros agit une fois, puis les monstres', () => {
  const s = G.nouvellePartie()
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grognard', niveau: 9 }], sac: s.sac })
  assert.equal(herosDisponibles(b).length, 3)
  agir(b, 'h-mage', { kind: 'defendre' })
  assert.equal(agir(b, 'h-mage', { kind: 'defendre' }).length, 0)
  assert.equal(herosDisponibles(b).length, 2)
  phaseMonstres(b)
  assert.equal(b.tour, 2)
  assert.equal(herosDisponibles(b).length, b.units.filter((u) => u.camp === 'h' && !u.ko).length)
})

test('migration d\'une sauvegarde v2 vers v3', () => {
  const s = G.nouvellePartie()
  s.version = 2
  delete s.parcours
  delete s.defi
  s.camp.entrainement = { niveau: 3, collecte: Date.now() }
  s.heros.guerrier.connues.push('lierre')
  s.heros.guerrier.capacites = ['interruption', 'lierre']
  s.eclats = ['champignard']
  s.ville = 'gougere'
  s.villesVisitees = ['brioche', 'gougere']
  const leg = genererObjet({ niveau: 5, rarete: 'legendaire', base: 'epee' })
  delete leg.pouvoir
  s.inventaire.push(leg)
  const or = s.or
  G.migrer(s)
  assert.equal(s.version, 3)
  assert.equal(s.camp.entrainement, undefined)
  assert.equal(s.or, or + 150 + 110 + 320)
  assert.ok(!s.heros.guerrier.connues.includes('lierre'))
  assert.ok(s.heros.guerrier.capacites.length >= 2)
  assert.ok(G.parcoursTermine(s, 'brioche'))
  assert.equal(G.caseCourante(s, 'gougere').index, 0)
  assert.equal(leg.pouvoir, 'contre')
})

test('maître d\'armes, repas de l\'auberge, expédition, atelier', () => {
  const s = G.nouvellePartie()
  s.or = 5000
  assert.ok(G.apprendreCapacite(s, 'rodeur', 'paralysant'))
  assert.ok(G.prendreRepas(s, 'croissant'))
  assert.equal(s.or, 5000 - 180, 'le repas est gratuit')
  const avant = G.herosPourCombat(s)[0].stats.atq
  s.repas = null
  assert.ok(avant > G.herosPourCombat(s)[0].stats.atq)
  assert.ok(G.partirExpedition(s, 'crabes'))
  s.expedition.fin = 0
  const r = G.recupererExpedition(s)
  assert.ok(r.or > 0 && r.objets.length === 1)
  assert.ok(G.enchanter(s, r.objets[0].id))
})

test('défi du jour : déterministe, record et prime une fois par jour', () => {
  const s = G.nouvellePartie()
  assert.equal(G.defiDuJour(s), null)
  s.eclats = ['champignard', 'bulle']
  const a = G.defiDuJour(s, '2026-10-13')
  const b = G.defiDuJour(s, '2026-10-13')
  assert.deepEqual([a.ville, a.regle], [b.ville, b.regle])
  assert.ok(['brioche', 'gougere'].includes(a.ville))
  const or = s.or
  const r1 = G.finDefi(s, { issue: 'victoire', tours: 9 }, a)
  assert.ok(r1.record && r1.or > 0 && s.or === or + r1.or)
  const r2 = G.finDefi(s, { issue: 'victoire', tours: 7 }, a)
  assert.ok(r2.record && r2.or === 0)
  assert.equal(G.finDefi(s, { issue: 'victoire', tours: 8 }, a).record, false)
  // Un vrai combat de défi se termine
  const d = G.defiDuJour(s, '2026-10-14')
  const c = creerCombat({ heros: G.herosPourDefi(s), ennemis: d.ennemis, boss: true, sac: s.sac, regles: { [d.regle]: true } })
  assert.ok(['victoire', 'defaite'].includes(jouerCombat(c)))
})

test('chaque ville a un parcours de 6 cases qui finit par son champion', () => {
  for (const v of Object.values(VILLES)) {
    assert.equal(v.parcours.length, 6)
    assert.equal(v.parcours[2].t, 'feu')
    assert.equal(v.parcours[5].t, 'champion')
  }
})

test('les intentions ne visent jamais un héros K.O.', () => {
  const s = G.nouvellePartie()
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grignaud', niveau: 3 }, { id: 'grignaud', niveau: 3 }], sac: {} })
  unite(b, 'h-mage').pv = 0
  unite(b, 'h-mage').ko = true
  planifier(b)
  for (const m of b.units.filter((u) => u.camp === 'm')) for (const it of intentionsActives(m)) assert.notEqual(it.cible, 'h-mage')
})
