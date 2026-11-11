// Recettes : 3 ingrédients, un service (E entrée, P plat, D dessert), un prix, un dressage.
export type Course = 'E' | 'P' | 'D';
export interface Recipe { id: string; name: string; kit: string; course: Course; ing: [string, string, string]; price: number; style: string; col: [string, string, string]; secret?: boolean; uni?: boolean; fish?: boolean }
const r = (id: string, name: string, kit: string, course: Course, ing: string, price: number, style: string, col: string, o: Partial<Recipe> = {}): Recipe => ({ id, name, kit, course, ing: ing.split(' ') as [string, string, string], price, style, col: col.split(' ') as [string, string, string], ...o });
export const RECIPES: Recipe[] = [
  // À la maison
  r('cacio', 'Cacio e pepe', 'home', 'P', 'pates fromage poivre', 12, 'pasta', '#f0d79a #fff3cf #3b3530'),
  r('tartb', 'Tartare de bœuf', 'home', 'E', 'boeuf oeuf poivre', 14, 'tartare', '#b3323a #f6b93b #3b3530'),
  r('tarts', 'Tartare de saumon', 'home', 'E', 'saumon citron poivre', 14, 'tartare', '#f58f6c #f4e04d #7fb069'),
  r('cesar', 'César', 'home', 'E', 'salade fromage oeuf', 11, 'salad', '#8fc15c #fff3cf #f6b93b'),
  r('vongole', 'Vongole', 'home', 'P', 'pates palourde citron', 16, 'pasta', '#f0d79a #d9c7b0 #7fb069'),
  r('tartec', 'Tarte au citron', 'home', 'D', 'citron oeuf sucre', 9, 'tart', '#f4e04d #e9c46a #ffffff'),
  // Trattoria
  r('carbo', 'Carbonara', 'trat', 'P', 'pates oeuf lard', 14, 'pasta', '#f3dc8f #f6b93b #c8553d'),
  r('pesto', 'Trofie al pesto', 'trat', 'P', 'pates basilic fromage', 13, 'pasta', '#a9c46a #4f8a3c #fff3cf'),
  r('astice', 'Linguine au homard', 'trat', 'P', 'pates homard tomate', 24, 'pasta', '#f0c08a #e4572e #d7263d'),
  r('burrata', 'Burrata', 'trat', 'E', 'burrata tomate basilic', 12, 'mound', '#fbfaf3 #d7263d #4f8a3c'),
  r('tira', 'Tiramisu', 'trat', 'D', 'oeuf cafe mascarpone', 10, 'cup', '#f3e6cf #5b3a29 #8a5a3c'),
  // Séoul
  r('bibim', 'Bibimbap', 'seoul', 'P', 'riz legumes oeuf', 14, 'bowl', '#f7f4ea #e76f51 #f6b93b'),
  r('kimbap', 'Kimbap', 'seoul', 'E', 'riz algue radis', 10, 'rolls', '#1f2d24 #f7f4ea #f4d35e'),
  r('tteokb', 'Tteokbokki', 'seoul', 'E', 'tteok gochujang ciboule', 11, 'bowl', '#d7372f #f7ede2 #6a994e'),
  r('chik', 'Poulet frit', 'seoul', 'P', 'poulet farine gochujang', 15, 'fried', '#d98e32 #b5452b #f7ede2'),
  r('naeng', 'Naengmyeon', 'seoul', 'P', 'nouilles concombre oeuf', 14, 'soup', '#cfe3e6 #8a7461 #8fc15c'),
  r('bingsu', 'Bingsu', 'seoul', 'D', 'glace haricot lait', 10, 'cup', '#f4f8fb #8c2f39 #fff'),
  // Chengdu
  r('hotpot', 'Hot pot', 'cheng', 'P', 'bouillon boeuf champignon', 22, 'soup', '#c1272d #8f3a3a #e9dcc3'),
  r('mapo', 'Mapo tofu', 'cheng', 'P', 'tofu porc poivres', 14, 'bowl', '#c8402b #fbf5e6 #7a2e1e'),
  r('dandan', 'Nouilles dan dan', 'cheng', 'P', 'nouilles porc sesame', 13, 'pasta', '#e3c58b #a44a2e #6a994e'),
  r('conc', 'Concombre pilé', 'cheng', 'E', 'concombre ail sesame', 8, 'salad', '#9fcf7a #f4eed8 #c1272d'),
  r('boules', 'Boules de sésame', 'cheng', 'D', 'sesame rizg sucre', 8, 'balls', '#d9a441 #f3e2b3 #fff'),
  // Bangkok
  r('padthai', 'Pad thaï', 'bkk', 'P', 'nouilleriz crevette cacahuete', 15, 'pasta', '#e8b76a #f28b66 #7fb069'),
  r('somtam', 'Som tam', 'bkk', 'E', 'papaye cacahuete tomate', 10, 'salad', '#cfe0a0 #d7263d #c49a5a'),
  r('curryv', 'Curry vert', 'bkk', 'P', 'curry coco poulet', 16, 'soup', '#a6c36f #f3ead2 #4f8a3c'),
  r('tomyum', 'Tom yum', 'bkk', 'E', 'crevette citronnelle champignon', 13, 'soup', '#e2703a #f28b66 #cfe0a0'),
  r('mango', 'Mango sticky rice', 'bkk', 'D', 'mangue rizg coco', 10, 'mound', '#fbf7ec #f6b23b #fff'),
  // Tokyo
  r('sushi', 'Nigiri', 'tokyo', 'E', 'riz thon wasabi', 16, 'sushi', '#f7f4ea #c2283b #7fb069', { fish: true }),
  r('ramen', 'Ramen', 'tokyo', 'P', 'nouilles bouillon porc', 15, 'soup', '#c98b4a #f0d79a #f2a9a0'),
  r('tempura', 'Tempura', 'tokyo', 'P', 'crevette farine daikon', 17, 'fried', '#edc66b #f28b66 #f7f4ea', { fish: true }),
  r('sashimi', 'Sashimi', 'tokyo', 'E', 'saumon daikon shiso', 18, 'sushi', '#f7f4ea #f58f6c #4f8a3c', { fish: true }),
  r('mochi', 'Mochi', 'tokyo', 'D', 'rizg haricot matcha', 9, 'balls', '#b7cf8f #f3c6d0 #fff'),
  // Hors carte — découvertes
  r('lasagnes', 'Lasagnes', '*', 'P', 'bolo pates -', 20, 'layers', '#e9c46a #b5452b #fff3cf', { secret: true, uni: true }),
  r('chili', 'Chili', '*', 'P', 'bolo chili -', 20, 'bowl', '#8f2d1e #5b2a1e #f6b93b', { secret: true, uni: true }),
  r('cafe', 'Café gourmand', '*', 'D', 'joker joker -', 18, 'cup', '#3b2a20 #f3e6cf #e9c46a', { secret: true, uni: true }),
  r('limone', 'Pasta al limone', 'home', 'P', 'pates citron fromage', 22, 'pasta', '#f6e58d #f4e04d #fff3cf', { secret: true, uni: true }),
  r('carpaccio', 'Carpaccio', 'home', 'E', 'boeuf oeuf fromage', 22, 'mound', '#c0392b #fff3cf #7fb069', { secret: true, uni: true }),
  r('gricia', 'Gricia', 'trat', 'P', 'pates fromage lard', 22, 'pasta', '#f0d79a #c8553d #fff3cf', { secret: true, uni: true }),
  r('gyeran', 'Gyeran-bap', 'seoul', 'P', 'riz oeuf gochujang', 22, 'bowl', '#f7f4ea #f6b93b #d7372f', { secret: true, uni: true }),
  r('liang', 'Nouilles froides au sésame', 'cheng', 'E', 'nouilles sesame concombre', 22, 'pasta', '#e3c58b #9fcf7a #d9a441', { secret: true, uni: true }),
  r('tomkha', 'Tom kha kai', 'bkk', 'E', 'coco poulet citronnelle', 24, 'soup', '#f3ead2 #e9c46a #7fb069', { secret: true, uni: true }),
  r('tekka', 'Tekka don', 'tokyo', 'P', 'riz thon shiso', 26, 'bowl', '#f7f4ea #c2283b #4f8a3c', { secret: true, uni: true, fish: true }),
  r('chirashi', 'Chirashi', 'tokyo', 'P', 'riz wasabi saumon', 26, 'bowl', '#f7f4ea #f58f6c #7fb069', { secret: true, uni: true, fish: true }),
];
export const REC: Record<string, Recipe> = Object.fromEntries(RECIPES.map((x) => [x.id, x]));
export interface Kitchen { id: string; name: string; goal: number; rule: string; board: string; fish?: string[] }
export const KITCHENS: Kitchen[] = [
  { id: 'home', name: 'À la maison', goal: 260, rule: '', board: 'wood' },
  { id: 'trat', name: 'Trattoria', goal: 320, rule: 'pot', board: 'marble' },
  { id: 'seoul', name: 'Séoul', goal: 380, rule: 'side', board: 'steel' },
  { id: 'cheng', name: 'Chengdu', goal: 420, rule: 'chili', board: 'redwood' },
  { id: 'bkk', name: 'Bangkok', goal: 460, rule: 'flav', board: 'teak' },
  { id: 'tokyo', name: 'Tokyo', goal: 520, rule: 'fresh', board: 'slate', fish: ['thon', 'saumon', 'crevette'] },
  { id: 'omakase', name: 'Omakase', goal: 0, rule: 'omakase', board: 'hinoki' },
];
export const KIT: Record<string, Kitchen> = Object.fromEntries(KITCHENS.map((k) => [k.id, k]));
export const PASTA = ['pates'];
