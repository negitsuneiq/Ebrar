import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require('playwright');
const engines=[['Chromium',chromium]];
if(existsSync(webkit.executablePath()))engines.push(['WebKit',webkit]);
else console.log('WebKit is not installed; iPad touch viewport tested in Chromium.');
for(const [name,engine] of engines){
 const browser=await engine.launch({headless:true,...(name==='Chromium'?{args:['--no-sandbox']}:{})});
 try{
 for(const width of [834,1440]){
  const page=await browser.newPage({viewport:{width,height:1112},hasTouch:width===834});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const root='http://127.0.0.1:4173/';
  const settled=()=>page.waitForTimeout(350);
  const y=()=>page.evaluate(()=>scrollY);
  async function atResults(label){
   await settled();
   const p=await page.evaluate(()=>({y:scrollY,top:document.querySelector('#mx-results').getBoundingClientRect().top,margin:parseFloat(getComputedStyle(document.querySelector('#mx-results')).scrollMarginTop)}));
   assert.ok(p.y>700,label+' unexpectedly returned to top: '+JSON.stringify(p));
   assert.ok(Math.abs(p.top-p.margin)<8,label+' did not stay at results: '+JSON.stringify(p));
  }
  await page.goto(root,{waitUntil:'networkidle'});
  await page.locator('.mx-topic').filter({hasText:'Lineer cebir'}).click();
  await atResults('topic');
  assert.equal(new URL(page.url()).searchParams.get('subject'),'Linear algebra');
  await page.locator('.mx-quick-universities button').filter({hasText:'Bilkent'}).click();
  await atResults('quick university');
  // A preceding native section link leaves a hash in the URL. Updating filters
  // must not replay that hash or let the router reset to document top.
  await page.locator('.mx-header a[href="#universities"]').click();
  await settled();
  assert.equal(new URL(page.url()).hash,'#universities');
  await page.locator('.mx-university-grid button').filter({hasText:'Oxford'}).click();
  await atResults('university after section anchor');
  // Sidebar changes should preserve the clicked control's position.
  if(width===834)await page.getByRole('button',{name:/Filtreler/}).click();
  const checkbox=page.locator('.mx-filter-option').filter({hasText:'University of Cambridge'}).locator('input');
  await checkbox.scrollIntoViewIfNeeded();await settled();
  const before=await y();
  await checkbox.check();await settled();
  assert.ok(Math.abs(await y()-before)<8,'checkbox moved the viewport');
  assert.ok(new URL(page.url()).searchParams.get('uni').includes('cambridge'));
  const kind=page.getByLabel('Problem setleri',{exact:true});
  await kind.scrollIntoViewIfNeeded();await settled();const kindY=await y();
  await kind.check();await settled();
  assert.ok(Math.abs(await y()-kindY)<8,'resource type moved the viewport');
  assert.ok((await page.locator('.mx-kind').allTextContents()).every(t=>t==='Problem set'));
  // Restoring a shared query still works after routing changes.
  await page.reload({waitUntil:'networkidle'});
  assert.ok(await page.getByLabel('Problem setleri',{exact:true}).isChecked());
  await page.goto(root,{waitUntil:'networkidle'});
  await page.locator('#resource-query').fill('calculus');
  await page.getByRole('button',{name:'Kaynak ara',exact:true}).click();
  await atResults('search');
  const sort=page.getByLabel('Sonuçları sırala');
  await sort.selectOption('title');await atResults('sort');
  await page.getByRole('button',{name:'Sonraki sonuç sayfası',exact:true}).click();
  await atResults('next page');
  assert.match(await page.locator('.mx-pagination').innerText(),/21-40/);
  await page.getByRole('button',{name:'Önceki sonuç sayfası',exact:true}).click();
  await atResults('previous page');
  await page.locator('.mx-active-filters button').filter({hasText:'calculus'}).click();
  await atResults('remove query chip');
  // Opening an original resource must keep Matris at the current position.
  const outgoing=page.locator('.mx-resource h3 a').first();
  await outgoing.scrollIntoViewIfNeeded();await settled();const outboundY=await y();
  await page.context().route('https://ocw.mit.edu/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<title>Resource test</title>'}));
  const popupPromise=page.waitForEvent('popup');await outgoing.click();const popup=await popupPromise;await popup.close();await settled();
  assert.ok(Math.abs(await y()-outboundY)<8,'external source moved Matris');
  // Native in-page navigation and deliberate return-to-search remain intact.
  await page.locator('.mx-header a[href="#about"]').click();await settled();
  const anchor=await page.locator('#about').evaluate(el=>({
   actual:scrollY,
   expected:Math.min(el.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(el).scrollMarginTop),document.documentElement.scrollHeight-innerHeight)
  }));
  assert.ok(Math.abs(anchor.actual-anchor.expected)<8,'native about anchor did not reach its scroll target: '+JSON.stringify(anchor));
  await page.getByRole('link',{name:'Aramaya dön ↑',exact:true}).click();await settled();
  assert.equal(await y(),0);
  await page.goto(root,{waitUntil:'networkidle'});
  await page.locator('.mx-header a[href="#topics"]').click();
  await page.locator('.mx-topic').filter({hasText:'Lineer cebir'}).click();
  await atResults('topic reached through anchor');
  await page.locator('.mx-header a[href="#universities"]').click();
  await page.locator('.mx-university-grid button').filter({hasText:'Oxford'}).click();
  await atResults('institution before history traversal');
  await page.goBack();await settled();
  assert.equal(new URL(page.url()).searchParams.get('subject'),'Linear algebra');
  assert.ok((await page.locator('.mx-resource-meta').allTextContents()).every(t=>t.includes('Linear algebra')));
  await page.goForward();await settled();
  assert.equal(new URL(page.url()).searchParams.get('uni'),'oxford');
  assert.ok((await page.locator('.mx-resource-overline').allTextContents()).every(t=>t.includes('Oxford')));
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('PASS '+name+' '+width+': topic/search/institution target, stable filters, hash handling, pagination, external tab and explicit top link.');
 }
 }finally{await browser.close();}
}
