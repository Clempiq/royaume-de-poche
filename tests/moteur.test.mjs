import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creerCombat, bilanCombat } from '../src/engine/battle.js'
import * as G from '../src/engine/game.js'
import { efficacite } from '../src/data/types.js'
import { genererObjet } from '../src/engine/loot.js'
import { jouerCombat } from '../src/engine/ia.js'

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

test('une victoire rapporte or et expérience', () => {
  const s = G.nouvellePartie()
  const b = creerCombat({ heros: G.herosPourCombat(s), ennemis: [{ id: 'grignaud', niveau: 1 }], sac: s.sac })
  jouerCombat(b)
  const or = s.or
  const r = G.finCombat(s, bilanCombat(b), 'sauvage')
  assert.equal(r.issue, 'victoire')
  assert.ok(s.or > or && r.xp > 0)
})

test('le voyage est bloqué tant que l\'arène n\'est pas gagnée', () => {
  const s = G.nouvellePartie()
  assert.equal(G.partirEnVoyage(s), false)
  s.eclats.push('champignard')
  assert.equal(G.partirEnVoyage(s), true)
  assert.equal(G.arriver(s), null)
  s.voyage.fin = 0
  const r = G.arriver(s)
  assert.equal(s.ville, 'gougere')
  assert.equal(r.recits.length, 2)
})

test('objets : rareté et affixes', () => {
  const o = genererObjet({ niveau: 10, rarete: 'epique', base: 'sceptre' })
  assert.equal(o.classe, 'mage')
  assert.ok(o.stats.puiss > 0)
})

test('campement : production et chantier', () => {
  const s = G.nouvellePartie()
  s.camp.mine.collecte = Date.now() - 3600000
  assert.equal(G.recolter(s, 'mine'), 20)
  s.or = 1000
  assert.equal(G.ameliorer(s, 'mine'), true)
  assert.equal(G.ameliorer(s, 'forge'), false)
  s.camp.chantier.fin = 0
  G.tic(s)
  assert.equal(s.camp.mine.niveau, 2)
})

test('phases : chaque héros agit une fois, puis les monstres', async () => {
  const { creerCombat, agir, phaseMonstres, herosDisponibles } = await import('../src/engine/battle.js')
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

test('migration d\'une sauvegarde v1', () => {
  const s = G.nouvellePartie()
  s.version = 1
  for (const c of ['guerrier', 'mage', 'rodeur']) { delete s.heros[c].connues; delete s.heros[c].capacites; s.heros[c].niveau = 9 }
  delete s.camp.herboristerie
  G.migrer(s)
  assert.equal(s.version, 2)
  assert.equal(s.heros.mage.capacites.length, 4)
  assert.ok(s.heros.mage.connues.includes('meteores'))
  assert.ok(s.camp.herboristerie)
})

test('maître d\'armes, repas, expédition, enchantement', () => {
  const s = G.nouvellePartie()
  s.or = 5000
  assert.ok(G.apprendreCapacite(s, 'rodeur', 'paralysant'))
  assert.ok(G.acheterRepas(s, 'croissant'))
  const avant = G.herosPourCombat(s)[0].stats.atq
  s.repas = null
  assert.ok(avant > G.herosPourCombat(s)[0].stats.atq)
  assert.ok(G.partirExpedition(s, 'crabes'))
  s.expedition.fin = 0
  const r = G.recupererExpedition(s)
  assert.ok(r.or > 0 && r.objets.length === 1)
  const o = r.objets[0]
  assert.ok(G.enchanter(s, o.id))
})
