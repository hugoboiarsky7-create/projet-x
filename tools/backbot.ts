import { Back } from '../src/back';
import { TU } from '../src/tuning';
let wins = 0; const hs: number[] = [];
for (let sd = 1; sd <= 30; sd++) {
  const b = new Back(sd * 7919); let steps = 0;
  while (b.state === 'run' && steps++ < 120 * 600) {
    if (!b.fly) {
      const g = b.gears[b.g], s = Math.sign(b.om(g)) || 1; let px = b.x, py = b.y; const dx = -Math.sin(b.th) * s * 0.02, dy = Math.cos(b.th) * s * 0.02; let ok = false;
      for (let n = 0; n < 120; n++) { px += dx; py += dy; if (Math.abs(px) > 1.05 || b.hitBar(px, py)) break; let hit = false; for (let i = 0; i < b.gears.length; i++) { if (i === b.g) continue; const q = b.gears[i]; if (Math.hypot(px - q.x, py - q.y) < b.rad(q) * 0.7) { hit = true; ok = q.main > g.main; break; } } if (hit) break; }
      if (ok) b.press(); else if (!b.started) b.started = true;
    }
    b.step(); b.ev.length = 0;
  }
  if (b.state === 'won') wins++; hs.push(b.best);
}
console.log('gagne', wins, '/30', 'hauteurs', hs.join(' '));
