import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('Both views have matching names, reciprocal links and a single current-page marker',()=>{
 for(const [folder,current] of [['daily-portfolio-audit','Daily Portfolio'],['trade-lifecycle-audit','Trade Review']]){
  const file=new URL(`../../${folder}/index.html`,import.meta.url);
  const html=fs.readFileSync(file,'utf8');
  const nav=html.match(/<nav class="version-nav"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);assert.ok(nav.includes('aria-label="Dashboard views"'));
  assert.ok(nav.includes('href="../trade-lifecycle-audit/"'));assert.ok(nav.includes('href="../daily-portfolio-audit/"'));
  assert.equal((nav.match(/aria-current="page"/g)??[]).length,1);
  assert.ok(nav.includes(`aria-current="page">${current}</a>`));
  for(const href of nav.matchAll(/href="([^"]+)"/g))assert.ok(fs.existsSync(new URL(href[1]+'index.html',file)));
 }
});
