// Tous les réglages de physique et de génération sont ici.
export const TU = {
  DT: 1 / 120, G: 520, R: 4, AIR: 0.06, VMAX: 430, VMIN: 30, BOUNCE_MIN: 34, REST_V: 6, TMAX: 22,
  DX: 2, DAYW: 30, HOURW: 12.5, AMP: 120, WIN: 45, SCALE: 0.34, PRE: 57, XMIN: -260,
  CUPW: 4, CUPD: 10, GREEN: 22, WL: -74, LAKEMAX: 104, OOB: 150, CAPTURE_V: 150,
  SKIP_V: 200, SKIP_SLOPE: 0.4, UPDRAFT: 0.72,
  HOLE_MIN: 7, HOLE_MAX: 13, HOLE_AIM: 10,
  PREVIEW_T: 0.34, AIM_FULL: 150, // pixels de tirage pour la pleine puissance
};
// surfaces : 0 fairway, 1 herbes hautes, 2 sable, 3 neige, 4 glace, 5 roche, 6 éboulis
export const SURF = [
  { e: 0.42, fr: 0.28, mu: 0.11, ms: 0.26 },
  { e: 0.22, fr: 0.5, mu: 0.42, ms: 0.6 },
  { e: 0.1, fr: 0.75, mu: 1.0, ms: 1.1 },
  { e: 0.16, fr: 0.55, mu: 0.5, ms: 0.6 },
  { e: 0.36, fr: 0.06, mu: 0.014, ms: 0.03 },
  { e: 0.66, fr: 0.16, mu: 0.13, ms: 0.22 },
  { e: 0.5, fr: 0.4, mu: 0.4, ms: 0.5 },
];
