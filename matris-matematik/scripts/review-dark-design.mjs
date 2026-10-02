import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const report=[];
for(const width of [1440,834,390]){
 await page.setViewportSize({width,height:1112});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const result=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:r.passes.length}});
 report.push({width,...result});
 if(width===834){
  await page.getByRole('button',{name:'Tüm alanlar',exact:true}).click();
  if(await page.locator('.mx-subject-label select').evaluate(el=>el!==document.activeElement))throw new Error('Topic shortcut failed to focus subject filter');
  await page.screenshot({path:'/tmp/matris-dark-filters.png',fullPage:false});
  await page.locator('.mx-university-grid button').filter({hasText:'Boğaziçi'}).click();
  await page.getByRole('button',{name:/Filtreler/}).click();
  await page.screenshot({path:'/tmp/matris-dark-resources.png',fullPage:false});
 }
}
await page.setViewportSize({width:1440,height:1100});
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
console.log('TOPICS',await page.locator('.mx-topic').allTextContents());
await fs.writeFile('/tmp/matris-accessibility.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));await browser.close();
if(report.some(r=>r.violations.length))process.exitCode=1;
