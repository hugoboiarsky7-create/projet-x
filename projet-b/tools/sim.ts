// Joueur débutant simulé : aucun niveau ne demande une lettre jamais introduite ; tout mot est bien formé ; tout pictogramme existe.
import { DISTRICTS, WORDS, WD, DAILY } from '../src/data/words';
import { PIC } from '../src/data/pictos';
import { levelSteps, stepJamo, freshProg, complete, mark, wordJamo } from '../src/course';
import { isSyl, split, join, LEAD, VOW, TAIL, parts, jamoParts } from '../src/hangul';
let ko = 0; const bad = (s: string) => { ko++; console.log('ÉCHEC', s); };
for (const w of WORDS) { for (const ch of w.w) { if (ch === ' ') continue; if (!isSyl(ch)) bad('caractère hors hangeul : ' + w.w); else { const [l, v, t] = split(ch); if (join(l, v, t) !== ch) bad('décomposition ' + ch); if (!parts(ch).length || parts(ch).some((p) => !p.d)) bad('tracé manquant ' + ch); } } if (w.p && !PIC[w.p]) bad('pictogramme manquant ' + w.w + ' → ' + w.p); if (!w.fr) bad('sens manquant ' + w.w); }
if (new Set(WORDS.map((w) => w.w)).size !== WORDS.length) bad('mot en double');
for (const j of [...LEAD, ...VOW]) if (!jamoParts(j).length || jamoParts(j).some((p) => !p.d)) bad('jamo sans tracé ' + j);
for (const d of DAILY) if (!WD[d]) bad('défi inconnu ' + d);
let total = 0, stepsN = 0, maxS = 0, minS = 99; const kinds: Record<string, number> = {};
for (let run = 0; run < 40; run++) {
  let rs = run * 7919 + 1; const r = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; };
  const p = freshProg(); const intro: string[] = [];
  DISTRICTS.forEach((d, di) => d.signs.forEach((sg, li) => {
    if (!WD[sg.w]) bad('enseigne sans mot ' + sg.w); if ((sg.t === 'r') && !WD[sg.w]?.p) bad('lecture sans pictogramme ' + sg.w);
    const { steps, known } = levelSteps(di, li, p, r); if (run === 0) { total++; stepsN += steps.length; maxS = Math.max(maxS, steps.length); minS = Math.min(minS, steps.length); }
    for (const s of steps) { kinds[s.k] = (kinds[s.k] || 0) + 1; for (const j of stepJamo(s)) if (!known.includes(j)) bad(`${d.name} niveau ${li + 1} (${sg.w}) demande ${j} jamais introduit [${s.k} ${s.word || s.syl || s.target}]`); if (s.k === 'R' && (s.opts!.length < 2 || s.opts!.some((o) => !PIC[o]) || new Set(s.opts).size !== s.opts!.length)) bad('choix de lecture invalide ' + s.word + ' ' + s.opts); if ((s.k === 'L' || s.k === 'P') && s.opts!.length < 2) bad('choix trop court ' + s.word); if (s.k === 'P' && !WD[s.word!].p) bad('P sans picto ' + s.word); if (s.k === 'B' && s.tray!.length > 6) bad('plateau trop chargé ' + s.syl);
      if (s.k === 'F' || s.k === 'T') mark(p, 'j', s.target || s.items![0], r() > 0.2); }
    for (const j of sg.n || '') { if (intro.includes(j)) bad('lettre introduite deux fois ' + j); intro.push(j); }
    if (!(di === 0 && li < 3) && !wordJamo(sg.w).every((j) => known.includes(j))) bad(`${sg.w} s'allume avant d'être lisible`); // les trois premières sont des récompenses muettes, lisibles plus tard
    complete(p, di, li, known);
  }));
  if (run === 0) { const all = [...LEAD, ...VOW]; const miss = all.filter((j) => !p.known.includes(j)); if (miss.length) bad('lettres jamais introduites : ' + miss.join('')); console.log('lettres introduites', [...p.known].length, '/ 40 ; mots vus', p.seenW.length, '; mots au total', WORDS.length); }
}
console.log(total, 'enseignes,', (stepsN / total).toFixed(1), 'étapes par niveau (min', minS, 'max', maxS + ')', JSON.stringify(kinds), ko ? ko + ' ÉCHECS' : '— tout est cohérent');
process.exit(ko ? 1 : 0);
