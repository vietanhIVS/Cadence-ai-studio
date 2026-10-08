import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/vieta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';export * from './lib/workout-duration';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/total-timer-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,localDate,workoutDuration}=await import('../.sites-runtime/tests/total-timer-domain.mjs'),today=localDate(),zone='Asia/Bangkok';
let state=initialState(),revision=0,posts=0;
act(state,{type:'duplicateProgram',id:state.programs[0].id},today,zone);
const program=state.programs.at(-1);
act(state,{type:'createSchedule',programId:program.id,versionId:program.versions[0].id,date:today},today,zone);
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage({viewport:{width:390,height:844},colorScheme:'light'}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/training',async route=>{
 try{
  if(route.request().method()==='POST'){
   const {action}=route.request().postDataJSON(),now=await page.evaluate(()=>Date.now()),originalNow=Date.now;
   try{Date.now=()=>now;state=JSON.parse(JSON.stringify(act(clone(state),action,today,zone)))}finally{Date.now=originalNow}
   revision++;posts++;
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state,revision})});
 }catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:e.message})})}
});
const workout=()=>page.locator('.workout'),timer=()=>page.getByRole('timer',{name:'Total workout time',exact:true});
async function saved(){await workout().getByText('Progress saved',{exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.workout fieldset:disabled'))}
async function start(){await page.clock.setSystemTime(new Date());await page.getByRole('button',{name:'Start workout · Push',exact:true}).click();await timer().waitFor();assert.equal(await timer().innerText(),'⏱\n00:00')}
async function elapsedIsCurrent(){const text=await timer().innerText(),[minutes,seconds]=text.split('\n')[1].split(':').map(Number),expected=Math.max(0,Math.floor(((await page.evaluate(()=>Date.now()))-Date.parse(state.session.startedAt))/1000));assert.ok(Math.abs(minutes*60+seconds-expected)<=1,`${text} matches elapsed ${expected}s`)}
try{
 assert.equal(workoutDuration('2026-10-07T00:00:00Z',Date.parse('2026-10-07T01:15:09Z')),'75:09');
 assert.equal(workoutDuration('invalid',Date.now()),'00:00');
 assert.equal(workoutDuration('2026-10-08T00:00:00Z',Date.parse('2026-10-07T00:00:00Z')),'00:00');
 await page.clock.install({time:new Date()});
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});
 await start();const startedAt=state.session.startedAt,initialPosts=posts;
 await page.clock.runFor(73000);await elapsedIsCurrent();assert.match(await timer().innerText(),/01:1[23]$/);assert.equal(posts,initialPosts);
 assert.equal(await timer().evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)');
 assert.equal(await timer().evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(30, 58, 138)');
 for(const width of [320,390,982]){
  await page.setViewportSize({width,height:844});
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  const box=await timer().boundingBox();assert.ok(box.y>=0&&box.y+box.height<100,`Timer stays at top: ${width}px, y=${box.y}`);
  assert.ok(box.x>=0&&box.x+box.width<=width);assert.ok(box.height<=40);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('.workout-exit').count(),0);
  assert.equal(await timer().evaluate(e=>{const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}),true);
  if(width!==320)await page.screenshot({path:`.sites-runtime/total-workout-timer-${width}.png`,animations:'disabled'});
 }
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'dark'});await page.screenshot({path:'.sites-runtime/total-workout-timer-dark.png',animations:'disabled'});await page.emulateMedia({colorScheme:'light'});
 await workout().getByRole('spinbutton',{name:'Rest seconds',exact:true}).fill('90');await workout().getByRole('button',{name:'Start rest',exact:true}).click();await saved();
 await page.clock.runFor(10000);await workout().getByRole('button',{name:'Skip rest',exact:true}).click();await saved();assert.equal(state.session.startedAt,startedAt);assert.equal(state.session.timerEnd,null);
 await page.evaluate(()=>dispatchEvent(new WheelEvent('wheel',{deltaY:4})));await page.getByRole('tab',{name:'History',exact:true}).click();await timer().waitFor({state:'hidden'});await page.clock.runFor(30000);
 await page.locator('.sessionbanner').getByRole('button',{name:'Resume workout',exact:true}).click();await timer().waitFor();assert.equal(state.session.startedAt,startedAt);
 await page.reload({waitUntil:'domcontentloaded'});await timer().waitFor();assert.equal(state.session.startedAt,startedAt);await elapsedIsCurrent();assert.match(await timer().innerText(),/^⏱\n01:/);
 await page.clock.runFor(1000);await elapsedIsCurrent();
 await workout().getByRole('button',{name:'Discard workout',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Discard workout',exact:true}).click();await timer().waitFor({state:'hidden'});assert.equal(state.logs.length,0);
 await start();assert.notEqual(state.session.startedAt,startedAt);
 await workout().getByRole('button',{name:'Finish workout',exact:true}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Finish workout',exact:true}).click();await timer().waitFor({state:'hidden'});assert.equal(state.logs.length,1);assert.equal(state.session,null);
 assert.deepEqual(errors,[]);
 console.log('PASS total timer starts with workout; MM:SS and 75-minute duration; no per-second saves; sticky at 320/390/982px; light/dark; rest independence; tab switch/resume and reload preserve elapsed; no exit button; discard/restart resets; finish removes live timer.');
}finally{await browser.close()}
