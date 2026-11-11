import { defineConfig } from 'vite';
import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(d: string, base = ''): string[] {
  return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p, base + f + '/') : [base + f]; });
}
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  plugins: [{
    name: 'sw', apply: 'build',
    closeBundle() {
      const files = walk('dist').filter((f) => f !== 'sw.js');
      const v = Date.now().toString(36);
      writeFileSync('dist/sw.js', `const V='pa-${v}';const F=${JSON.stringify(['./', ...files.map((f) => './' + f)])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(V).then(x=>x.put(e.request,c)).catch(()=>{});return n}).catch(()=>caches.match('./'))))});`);
    },
  }],
});
