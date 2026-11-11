import type { Sim } from './sim';
import type { Rng } from './rng';

const GEN = [
  'Skill issue, Bob.', 'Tu tilt.', 'Stop loss touché.', 'Retour à Bondues.', 'Vol annulé.', 'Visa refusé.', 'Bad beat.', 'Faute directe.', 'Dans la grille.',
  'Même une mouette tient mieux l\'heure.', 'Encore.', 'Non.', 'Presque.', 'C\'était écrit.', 'Tu l\'as vue venir.', 'Relance.', 'Trop tard.', 'Trop tôt.',
  'L\'heure, c\'est l\'heure.', 'Une touche. Une.', 'Out.', 'Double faute.', 'Balle de match. Perdue.', 'Dans le filet.', 'Tu as payé pour voir.', 'Fold.',
  'Mauvais timing. Comme d\'habitude.', 'Le marché a toujours raison.', 'Position fermée.', 'Rekt.', 'Pas de rebond.', 'Tu as acheté le top.', 'Vendu au plus bas.',
  'Révision conseillée.', 'Ça ne passe pas à la douane.', 'Bagage perdu.', 'Correspondance ratée.', 'Décalage horaire.', 'Coupez.', 'Scène à refaire.', 'Pas dans le montage final.',
  'Trop cuit.', 'Al dente, on a dit.', 'Retourne en cuisine.', 'Défaite.', 'GG. Enfin, G.', 'Tu joues avec les pieds.', 'Remonte-la.', 'Ressort cassé.',
  'Hors délai.', 'Trois putts.', 'Dans le bunker.', 'Hors limites.', 'À l\'eau.', 'Ton stop était trop serré.', 'Slippage.', 'Tu t\'es fait squeezer.',
  'On ne négocie pas avec une aiguille.', 'Elle tourne. Toi non.', 'Le temps gagne toujours.', 'Minuit moins toi.', 'Tu avais une seule chose à faire.',
];
const BY: Record<string, string[]> = {
  fast: ['...', '…', 'Ah.', 'Déjà ?'],
  sec: ['La trotteuse ne s\'arrête pas.', 'Une seconde de trop.', 'Elle, elle est à l\'heure.', 'Tic. Tac. Toi.'],
  liq: ['Liquidé.', 'Liquidé. ×40, vraiment ?', 'Appel de marge.', 'Le levier, ça coupe.', 'Compte à zéro.'],
  quartz: ['Tu l\'as cherché.', 'Même avec une pile.', 'Le quartz ne t\'a pas sauvé.', 'Précis. Et mort.'],
  laser: ['C\'était allumé.', 'Tu as vu la lumière.', 'Mauvais secteur.'],
  spark: ['Une étincelle. Sérieusement.', 'Ça venait du centre.', 'Tu regardais ailleurs.'],
  crowd: ['Billet non remboursable.', 'Debout jusqu\'à l\'arrivée.', 'La foule a gagné.', 'Il y avait un trou. Ailleurs.'],
  panda: ['Il ne dormait pas.', 'On ne réveille pas un panda.', 'Sieste terminée.'],
  twin: ['Ton reflet n\'a pas suivi.', 'Vous étiez deux.', 'Regarde aussi l\'autre.'],
  funding: ['Funding négatif.'],
  tapis: ['Tapis. Perdu.', 'Tu t\'es fait sortir à la bulle.', 'All-in, all-out.'],
  bravoure: ['Encore un run Bravoure.', 'L\'Enclume t\'a écrasé.'],
  near: ['Tu t\'es fait sortir à la bulle.', 'Si près.', 'À une seconde.', 'La ville était là.'],
  life: ['Même avec une vie.', 'Tu en avais une de rab.'],
  b44: ['Trop gros. On t\'avait dit.', '44 mm de regrets.'],
  bkk: ['Trop chaud pour toi.', 'Même pas sorti de l\'aéroport.'], szx: ['Court-circuit.', 'Erreur 404.'], pek: ['Tarif ×2,65. Pour ça.'],
  ctu: ['Trop épicé.', 'Tu ne tiens pas le piment.'], ckg: ['Perdu dans le brouillard.', 'Tu n\'as rien vu.'], sha: ['Noyé dans le reflet.'],
  hgh: ['Le lac était calme. Pas toi.', 'Marée basse.'], sel: ['À contretemps.', 'Tu n\'as pas le rythme.'], tyo: ['Écrasé au carrefour.', 'Si près du but. Enfin, non.'],
  kan: ['Tout ce qui brille.'], tak: ['Silence.'],
  shot: ['Un shot de trop.'], piment: ['Trop gourmand.'],
};
export function deathLine(s: Sim, r: Rng): string {
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  if (s.time < 3) return pick(BY.fast);
  if (s.cause === 'liq') return pick(BY.liq);
  const pool: string[][] = [];
  if (s.has('quartz') || s.perks.quartz) pool.push(BY.quartz, BY.quartz);
  if (BY[s.cause]) pool.push(BY[s.cause], BY[s.cause]);
  if (s.tapis) pool.push(BY.tapis, BY.tapis, BY.tapis);
  if (s.plan.dur - s.T < 3) pool.push(BY.near, BY.near, BY.near);
  if (s.has('bravoure') && s.enclumes > 0) pool.push(BY.bravoure);
  if (s.has('funding')) pool.push(BY.funding);
  if (s.has('b44')) pool.push(BY.b44);
  if (s.livesUsed > 0) pool.push(BY.life);
  if (s.shotT > 0) pool.push(BY.shot);
  if (s.pim >= 3) pool.push(BY.piment, BY.piment);
  if (BY[s.cfg.id]) pool.push(BY[s.cfg.id]);
  pool.push(GEN, GEN, GEN);
  return pick(pick(pool));
}
export const QUARTZ_TAUNTS = ['Tic.', 'C\'est une pile.', 'Aucune âme.', 'Précis. Triste.', 'Tu entends ? Rien.', 'Honte.'];
export const WIN_LINES = ['Arrivé.', 'Tokyo. Enfin.', '95 jours. Pas mal, Bob.'];

export const ACH: Record<string, string> = {
  first: 'Première seconde', c1: 'Sawasdee', c2: 'Made in', c3: 'Chunyun', c4: 'Mala', c5: 'Ville-montagne', c6: 'Le Bund', c7: 'Lac de l\'Ouest', c8: 'Sur le beat', c9: 'Scramble',
  kan: 'Feuille d\'or', tak: 'Minuit', birdie: 'Birdie', hole: 'Hole in one', perfect: 'Tour parfait', eagle: 'Eagle',
  graze10: 'Frôleur', bulle: 'La bulle', liq: 'Liquidé', allin: 'Tapis payé', ko: 'Knockout', tenet: 'À l\'envers', vitre: 'Par la vitre', lob: 'Bandeja',
  pasta: 'Al dente', mala: 'Très épicé', enclume: 'Bravoure', tilt: 'Tilt', quartz: 'On t\'avait prévenu', j95: '95', d7: 'Sept jours',
  horloger: 'Horloger', manuf: 'Manufacture', back: 'Côté fond', end: 'Générique', k100: 'Six chiffres', plan: 'Plan-séquence',
};
