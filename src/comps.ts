export interface Comp { id: string; name: string; desc: string; fixed?: number; min?: number; g: string }
export const RAR = ['ACIER', 'OR', 'PLATINE'];
export const RARC = ['#aab4c0', '#e8c25a', '#dff6ff'];

export const COMPS: Comp[] = [
  { id: 'chrono', name: 'Chronographe', desc: 'Maintiens : le temps ralentit.', g: 'Ch' },
  { id: 'gmt', name: 'GMT', desc: 'Une aiguille amie ramasse pour toi.', g: 'G' },
  { id: 'lune', name: 'Phase de lune', desc: 'Éclipse régulière : 2 s intouchable.', g: 'Pl' },
  { id: 'reserve', name: 'Réserve de marche', desc: 'Une vie. Rembobine 2 s.', g: 'R' },
  { id: 'tourb', name: 'Tourbillon', desc: 'Le cadran tourne. Score ×1,5.', fixed: 1, g: 'T' },
  { id: 'lunette', name: 'Lunette tournante', desc: 'Glisse : les aiguilles sautent de 30°.', g: 'Lu' },
  { id: 'morte', name: 'Seconde morte', desc: 'Tu avances par sauts. Par-dessus les fines.', fixed: 1, g: 'Sm' },
  { id: 'repet', name: 'Répétition minutes', desc: 'Un carillon avant le danger. Frôlement large.', g: 'Rm' },
  { id: 'squel', name: 'Squelette', desc: 'Les creuses durent plus longtemps.', g: 'Sq' },
  { id: 'lumi', name: 'Lumi', desc: 'Tu vois dans la brume. Et 1 s en avance.', fixed: 0, g: 'Lm' },
  { id: 'b39', name: 'Boîtier 39 mm', desc: 'La bonne taille.', fixed: 0, g: '39' },
  { id: 'b44', name: 'Boîtier 44 mm', desc: 'Énorme. Score ×2. Maudit.', fixed: 1, g: '44' },
  { id: 'quartz', name: 'Quartz', desc: 'Régulier. Score ÷2. Vraiment ?', fixed: 0, g: 'Q' },
  { id: 'vitre', name: 'La Vitre', desc: 'Une fois par ville : tu rebondis.', g: 'V' },
  { id: 'bandeja', name: 'Bandeja', desc: 'Maintiens, relâche : lob.', g: 'Bj' },
  { id: 'bounty', name: 'Bounty', desc: 'Frôle la dorée 3 fois. Encaisse.', g: '$' },
  { id: 'tapis', name: 'Tapis', desc: 'Prochaine ville propre : banque ×3. Sinon zéro.', fixed: 1, g: 'All' },
  { id: 'lev3', name: 'Levier ×3', desc: 'Score ×3. Tout accélère.', fixed: 0, g: '×3' },
  { id: 'lev10', name: 'Levier ×10', desc: 'Score ×10. Ça va vite.', fixed: 1, g: '×10' },
  { id: 'lev40', name: 'Levier ×40', desc: 'Score ×40. Une touche = liquidation.', fixed: 2, g: '×40' },
  { id: 'funding', name: 'Funding', desc: 'Payé tant que tu colles au danger.', g: '%' },
  { id: 'shot', name: 'Shot', desc: '3 doses. Plus vite, score ×2, 15 s.', fixed: 1, g: 'Sh' },
  { id: 'cacio', name: 'Cacio e pepe', desc: '3 complications max. Chacune monte d\'un cran.', fixed: 1, g: '3' },
  { id: 'bravoure', name: 'Bravoure', desc: 'Chaque Enclume paie plus.', fixed: 0, g: 'Br' },
  { id: 'plan', name: 'Plan large', desc: 'La caméra recule. Tu vois 5 s devant.', fixed: 1, g: 'Lg' },
  { id: 'inception', name: 'Inception', desc: 'Un cadran dans le cadran. Double touche.', fixed: 2, g: 'In' },
  { id: 'rattrap', name: 'Rattrapante', desc: 'Tu ramasses de plus loin.', g: 'Rt' },
  { id: 'remont', name: 'Remontage auto', desc: '12 index = une vie.', fixed: 2, g: 'Ra' },
  { id: 'gdate', name: 'Grande date', desc: 'Les index paient double.', g: '12' },
  { id: 'barillet', name: 'Double barillet', desc: 'Le combo tient plus longtemps.', g: '2B' },
];
export const COMP: Record<string, Comp> = Object.fromEntries(COMPS.map((c) => [c.id, c]));
