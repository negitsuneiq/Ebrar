import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
await page.screenshot({path:'/tmp/matris-desktop.png',fullPage:false});
assert.equal(await page.locator('.mx-university-grid button').count(),18);
assert.equal(await page.locator('.mx-resource').count(),20);

assert.equal(await page.locator('.mx-topic').count(),8);
assert.equal(await page.locator('.matris-app').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(12, 19, 33)');
await page.locator('.mx-topic').filter({hasText:'Lineer cebir'}).click();
await page.waitForTimeout(100);
assert.equal(new URL(page.url()).searchParams.get('subject'),'Linear algebra');
assert.ok(await page.locator('.mx-resource').count()>0);
assert.ok((await page.locator('.mx-resource-meta').allTextContents()).every(t=>t.includes('Linear algebra')));
await page.reload({waitUntil:'networkidle'});
assert.ok(await page.locator('.mx-topic').filter({hasText:'Lineer cebir'}).getAttribute('aria-pressed')==='true');
await page.locator('.mx-quick-universities button').filter({hasText:'ODTÜ'}).click();
await page.waitForTimeout(100);
assert.equal(new URL(page.url()).searchParams.get('uni'),'metu');
assert.equal(new URL(page.url()).searchParams.has('subject'),false);
assert.ok((await page.locator('.mx-resource-overline').allTextContents()).every(t=>t.includes('ODTÜ')));
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});

await page.locator('#resource-query').fill('convex optimization');
await page.getByRole('button',{name:'Kaynak ara',exact:true}).click();
await page.waitForTimeout(150);
assert.match(await page.locator('.mx-resource-list').innerText(),/Convex Optimization/);
assert.match(page.url(),/q=convex/);
await page.locator('#resource-query').fill('pde');
await page.getByRole('button',{name:'Kaynak ara',exact:true}).click();
await page.waitForTimeout(100);
assert.ok(await page.locator('.mx-resource').count()>0);
assert.match(await page.locator('.mx-resource-list').innerText(),/Partial Differential/);
await page.locator('#resource-query').fill('zzzxxyqnomaterial');
await page.getByRole('button',{name:'Kaynak ara',exact:true}).click();
assert.equal(await page.locator('.mx-resource').count(),0);
assert.match(await page.locator('.mx-empty').innerText(),/kaynak bulunamadı/);
await page.getByRole('button',{name:'Aramayı ve filtreleri temizle'}).click();
await page.locator('.mx-university-grid button').filter({hasText:'Oxford'}).click();
await page.waitForTimeout(100);
assert.ok((await page.locator('.mx-resource-overline').allTextContents()).every(t=>t.includes('Oxford')));
await page.getByLabel('Problem setleri',{exact:true}).check();
await page.waitForTimeout(100);
assert.ok((await page.locator('.mx-kind').allTextContents()).every(t=>t==='Problem set'));
assert.ok(await page.locator('.mx-resource').count()>0);
await page.reload({waitUntil:'networkidle'});
assert.ok(await page.getByLabel('Problem setleri',{exact:true}).isChecked());
assert.ok((await page.locator('.mx-resource-overline').allTextContents()).every(t=>t.includes('Oxford')));
const anchors=await page.locator('.mx-resource a').evaluateAll(as=>as.map(a=>({href:a.href,target:a.target,rel:a.rel})));
assert.ok(anchors.every(a=>/^https?:/.test(a.href)&&a.target==='_blank'&&a.rel.includes('noopener')));

// Verify every newly added institution has usable filter results.
for(const short of ['Boğaziçi','Bilkent','ODTÜ','Galatasaray','Hacettepe','Ankara','İYTE','Mimar Sinan']){
 await page.locator('.mx-university-grid button').filter({hasText:short}).click();
 await page.waitForTimeout(80);
 assert.ok(await page.locator('.mx-resource').count()>0,'No results for '+short);
 assert.ok((await page.locator('.mx-resource-overline').allTextContents()).every(t=>t.includes(short)));
 const links=await page.locator('.mx-resource h3 a').evaluateAll(as=>as.map(a=>({href:a.href,target:a.target,rel:a.rel})));
 assert.ok(links.every(a=>/^https?:/.test(a.href)&&a.target==='_blank'&&a.rel.includes('noopener')));
}
await page.goto('http://127.0.0.1:4173/?q=bogazici',{waitUntil:'networkidle'});
assert.ok(await page.locator('.mx-resource').count()>0);
assert.ok((await page.locator('.mx-resource-overline').allTextContents()).every(t=>t.includes('Boğaziçi')));
await page.goto('http://127.0.0.1:4173/?q=metric+spaces&uni=ankara',{waitUntil:'networkidle'});
assert.ok(await page.locator('.mx-resource').count()>0);
assert.match(await page.locator('.mx-resource-list').innerText(),/Türkçe/);

const oldApi=await page.request.get('http://127.0.0.1:4173/api/state');
assert.equal(oldApi.status(),404);
assert.ok(oldApi.headers()['content-security-policy']);
for(const width of [834,1024,390,320]){
 await page.setViewportSize({width,height:1112});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow at '+width);
 if(width<=900){await page.getByRole('button',{name:/Filtreler/}).click();assert.ok(await page.locator('#mx-filters').isVisible());await page.getByRole('button',{name:/Filtreler/}).click();}
 await page.screenshot({path:'/tmp/matris-'+width+'.png',fullPage:false});
}
await page.setViewportSize({width:1200,height:800});
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
await page.screenshot({path:'public/og-cover.png',fullPage:false});
assert.deepEqual(errors,[]);
console.log('PASS: search, English abbreviations, empty state, institution/type filters, URL restoration, outbound links, retired API, desktop/iPad/mobile layouts; no browser errors.');
await browser.close();
