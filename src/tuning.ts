// Tous les réglages au même endroit.
export const TAU = Math.PI * 2;

export const TU = {
  DT: 1 / 120,
  SR: 60, // échantillons/s des trajectoires
  PREVIEW: 6,
  cityDur: 40,
  grace: 1.7,
  graceWarn: 0.5,
  pSpeed: 1.9, // rad/s
  pHit: 0.034,
  tickHz: 8,
  innerSpeed: 0.6,
  graze: { zone: 0.15, cd: 0.9, slowT: 0.16, slowK: 0.38, pts: 60 },
  index: { pickR: 0.09, pts: 100, comboStep: 0.2, comboMax: 25, comboTime: 6.5, litTimeout: 9, perfect: 2000 },
  cityBonus: 500,
  piment: { speed: 0.12, mult: 0.5, max: 5, life: 7, gap: [4, 7] as [number, number] },
  solver: { bins: 360, hz: 30, pad: 0.1, arcPad: 0.06, hollowDelay: 0.12, tries: 40 },
  levier: { ts: [1.1, 1.22, 1.4], mult: [3, 10, 40] },
  shot: { ts: 1.25, mult: 2, dur: 15 },
  chrono: { k: 0.42, gauge: [2, 3, 4], perIdx: 0.5 },
  lune: { per: [14, 11, 8], dur: 2 },
  lunetteCd: [8, 6, 4],
  lobCd: [5, 4, 3],
  lobAir: 0.55,
  rewind: 2,
  deathAnim: 0.34,
  rouages: { k: 0.35, perCity: 6 },
  unlockAtelier: 10,
  back: { v: 0.95, floors: 9, perFloor: 5, rise0: 0.05, riseK: 0.004 },
};
