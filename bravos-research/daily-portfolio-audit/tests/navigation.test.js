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
test('Both views use the shared Trade Review header outside the content area',()=>{
 for(const [folder,label] of [['daily-portfolio-audit','DAILY PORTFOLIO'],['trade-lifecycle-audit','TRADE REVIEW']]){
  const file=new URL(`../../${folder}/index.html`,import.meta.url);
  const html=fs.readFileSync(file,'utf8');
  const stylesheet=folder==='trade-lifecycle-audit'?'./dashboard-header.css':'../trade-lifecycle-audit/dashboard-header.css';
  assert.ok(html.includes(stylesheet));
  assert.ok(fs.existsSync(new URL(stylesheet,file)));
  const header=html.match(/<header class="topbar">[\s\S]*?<\/header>/)?.[0];
  assert.ok(header);assert.ok(header.includes('class="brand-mark"'));assert.ok(header.includes('<strong>BRAVOS</strong>'));
  assert.ok(header.includes(`<small>${label}</small>`));assert.ok(header.includes('id="asOfText"'));assert.ok(header.includes('class="status-dot"'));
  assert.ok(html.indexOf(header)<html.indexOf('<main'));
 }
});
