const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const {execSync}=require('node:child_process');
(async()=>{
const executablePath=execSync('which google-chrome || which chromium || which chromium-browser').toString().trim();
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error'&&/Office WebGL|Three.js load/.test(msg.text()))errors.push(msg.text());});
await page.goto('http://localhost:8000/?page=office#office',{waitUntil:'domcontentloaded'});
await page.locator('.vo-root[data-webgl="ready"]').waitFor({timeout:45000});
assert.equal(await page.locator('.vo-pin').count(),4);
assert.equal(await page.locator('.vo-root').getAttribute('data-brand-logo'),'ready');
assert.equal(await page.locator('.vo-mode').textContent(),'WORKSPACE READY');
assert.equal(await page.locator('.vo-member').count(),4);
assert.equal(await page.locator('.vo-panel h3').textContent(),'Naboya');
await page.locator('.vo-cardportrait').first().waitFor();
assert.equal(await page.locator('.vo-cardportrait').evaluateAll(a=>a.every(x=>x.complete&&x.naturalWidth>0)),true);
await page.screenshot({path:'office-preview-desktop.png',fullPage:true});
await page.locator('[data-vo="suggest"]').click();await page.locator('#vo-run').click();
await page.waitForFunction(()=>document.querySelector('#vo-completed').textContent==='01',{timeout:10000});
assert.match(await page.locator('.vo-history').textContent(),/Tidak ada data asli/);
await page.locator('[data-vo="clear"]').click();
assert.equal(await page.locator('#vo-completed').textContent(),'00');
for(const [i,name] of ['Naboya','Yoga','Livia','Naomi'].entries()){await page.locator('.vo-member').nth(i).click();assert.equal(await page.locator('.vo-panel h3').textContent(),name);}
await page.locator('[data-vo="left"]').click();await page.locator('[data-vo="plus"]').click();await page.locator('[data-vo="reset"]').click();
assert.equal(await page.locator('.vo-root').getAttribute('data-webgl'),'ready');
assert.equal(await page.locator('.vo-stage-state').isVisible(),false);
await page.locator('#sideMenu [data-route="projecthub"]').click();await page.waitForURL(/page=projecthub/);assert.equal(await page.locator('.vo-root').count(),0);
await page.locator('#sideMenu [data-route="office"]').click();await page.locator('.vo-root[data-webgl="ready"]').waitFor({timeout:45000});
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);await page.screenshot({path:'office-preview-mobile.png',fullPage:true});
assert.equal(await page.locator('.vo-member').count(),4);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'mobile layout overflow');
assert.deepEqual(errors,[]);
console.log('PASS: WebGL desktop and mobile, four avatars, selection, rotation/zoom, existing route, remount; screenshots saved.');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});