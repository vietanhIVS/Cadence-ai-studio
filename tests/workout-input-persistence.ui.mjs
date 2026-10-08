import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/vieta/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
await build({stdin:{contents:"export * from './lib/cadence';export * from './lib/actions';",resolveDir:process.cwd(),loader:'ts'},outfile:'.sites-runtime/tests/input-domain.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {initialState,act,clone,localDate}=await import('../.sites-runtime/tests/input-domain.mjs'),today=localDate(),zone='Asia/Bangkok';
let state=initialState(),revision=0,hold=false,release=null,fail=false;
act(state,{type:'duplicateProgram',id:state.programs[0].id},today,zone);
const program=state.programs.at(-1);
act(state,{type:'createSchedule',programId:program.id,versionId:program.versions[0].id,date:today},today,zone);
act(state,{type:'startWorkout',date:today},today,zone);
const actions=[],errors=[];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),page=await browser.newPage({viewport:{width:390,height:844}});
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/training',async route=>{
 try{
  if(route.request().method()==='POST'){
   const request=route.request().postDataJSON();actions.push(request.action);
   assert.equal(request.revision,revision,'writes must use the revision from the previous response');
   if(request.action.type==='saveSession'&&fail){fail=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Save unavailable'})});return}
   state=clone(act(clone(state),request.action,today,zone));revision++;
   const response=JSON.stringify({state,revision});
   if(request.action.type==='saveSession'&&hold){hold=false;await new Promise(resolve=>{release=resolve})}
   await route.fulfill({status:200,contentType:'application/json',body:response});return;
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({state,revision})});
 }catch(e){errors.push(e.message);await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:e.message})})}
});
const workout=()=>page.locator('.workout'),weight=n=>workout().getByRole('spinbutton',{name:`Set ${n} weight`,exact:true}),reps=n=>workout().getByRole('spinbutton',{name:`Set ${n} reps`,exact:true});
const saves=()=>actions.filter(a=>a.type==='saveSession');
async function saved(){await workout().locator('[data-save-state="saved"]').waitFor()}
async function active(input){assert.equal(await input.evaluate(e=>e===document.activeElement),true);assert.equal(await input.isEnabled(),true)}
async function tick(){await page.clock.runFor(1600)}
try{
 await page.clock.install({time:new Date()});await page.goto('http://127.0.0.1:5173/',{waitUntil:'domcontentloaded'});await saved();
 await weight(1).fill('3');await tick();await weight(1).press('End');await weight(1).press('3');await tick();
 assert.equal(await weight(1).inputValue(),'33');assert.equal(saves().length,0,'pauses in typing must not autosave');
 await weight(1).press('.');await tick();assert.equal(await weight(1).inputValue(),'33.');await active(weight(1));
 await weight(1).press('5');await reps(1).fill('8');await tick();assert.equal(saves().length,0,'moving within one set must not save');
 hold=true;await weight(2).click();await page.waitForFunction(()=>document.querySelector('[data-save-state="saving"]'));
 assert.equal(saves().length,1);assert.equal(saves()[0].exercises[0].sets[0].weight,33.5);
 await weight(2).fill('40.5');await weight(2).evaluate(e=>e.setSelectionRange(1,1));await tick();await active(weight(2));
 assert.equal(await weight(2).evaluate(e=>e.selectionStart),1);assert.equal(saves().length,1);
 release();await workout().locator('[data-save-state="unsaved"]').waitFor();await tick();
 assert.equal(await weight(2).inputValue(),'40.5','old response must preserve newer local text');await active(weight(2));
 assert.equal(await weight(2).evaluate(e=>e.selectionStart),1);assert.equal(saves().length,1,'typing during an in-flight save must not schedule another request');
 await reps(2).fill('9');assert.equal(saves().length,1);
 // Two save boundaries during a delayed save coalesce and keep the next set usable.
 hold=true;await weight(3).fill('50');await page.waitForFunction(()=>document.querySelector('[data-save-state="saving"]'));
 await reps(3).fill('10');await workout().getByRole('checkbox',{name:'Set 3 completed',exact:true}).click();assert.equal(saves().length,2);
 assert.equal(await workout().getByRole('checkbox',{name:'Set 3 completed',exact:true}).isChecked(),true);release();await saved();
 assert.equal(saves().length,3);assert.equal(state.session.exercises[0].sets[2].done,true);assert.equal(state.session.exercises[0].sets[2].weight,50);
 assert.equal(state.session.exercises[0].sets[2].reps,10);assert.equal(state.session.exercises[0].sets[1].weight,40.5);
 // Failed boundary saves retain the draft and can retry without losing input/focus.
 await weight(2).fill('41.25');await reps(2).fill('11');fail=true;await weight(1).click();await workout().getByRole('button',{name:'Retry',exact:true}).waitFor();
 assert.equal(await weight(2).inputValue(),'41.25');await active(weight(1));await workout().getByRole('button',{name:'Retry',exact:true}).click();await saved();assert.equal(state.session.exercises[0].sets[1].weight,41.25);
 // Invalid edits to an already completed set neither uncomplete it nor leave/save it.
 await reps(3).fill('');const before=saves().length;await page.getByRole('tab',{name:'History',exact:true}).click();
 await tick();assert.equal(await workout().isVisible(),true);assert.equal(saves().length,before);assert.equal(await workout().getByRole('checkbox',{name:'Set 3 completed',exact:true}).isChecked(),true);
 await reps(3).fill('bad');await tick();assert.equal(await reps(3).inputValue(),'bad');assert.equal(await reps(3).getAttribute('aria-invalid'),'true');assert.equal(saves().length,before);
 await reps(3).fill('12');await page.getByRole('tab',{name:'History',exact:true}).click();await workout().waitFor({state:'hidden'});
 assert.equal(state.session.exercises[0].sets[2].reps,12);assert.equal(state.logs.length,0);
 await page.locator('.sessionbanner').getByRole('button',{name:'Resume workout',exact:true}).click();await saved();assert.equal(await reps(3).inputValue(),'12');
 // Navigation waits for the latest draft, and returning/reloading uses persisted data.
 await weight(1).fill('35.75');await page.getByRole('tab',{name:'History',exact:true}).click();await workout().waitFor({state:'hidden'});assert.equal(state.session.exercises[0].sets[0].weight,35.75);
 await page.getByRole('tab',{name:'Schedule',exact:true}).click();if(!await workout().isVisible())await page.locator('.sessionbanner').getByRole('button',{name:'Resume workout',exact:true}).click();await saved();
 await page.reload();await saved();assert.equal(await weight(1).inputValue(),'35.75');
 // Finish flushes pending edits before committing the exact actual values to History.
 await reps(1).fill('13');await workout().getByRole('button',{name:'Finish workout',exact:true}).click();const dialog=page.getByRole('alertdialog');await dialog.getByRole('button',{name:'Finish workout',exact:true}).click();await page.getByRole('heading',{name:'Workout Summary',exact:true}).waitFor();
 assert.equal(state.session,null);assert.equal(state.logs[0].exercises[0].sets[0].reps,13);assert.equal(state.logs[0].exercises[0].sets[2].done,true);
 // The shared input preserves History's explicit correction workflow.
 await page.getByRole('button',{name:'View / edit workout log',exact:true}).click();await workout().waitFor();const writes=actions.length;
 await weight(1).fill('37.25');await reps(1).fill('14');await weight(2).click();await tick();assert.equal(actions.length,writes);
 assert.equal(state.logs[0].exercises[0].sets[0].reps,13);await workout().getByRole('button',{name:'Save correction',exact:true}).click();await dialog.getByRole('button',{name:'Confirm',exact:true}).click();await workout().getByText('Saved log',{exact:true}).waitFor();
 assert.equal(state.logs[0].exercises[0].sets[0].reps,14);assert.equal(state.logs[0].exercises[0].sets[0].weight,37.25);
 assert.deepEqual(errors,[]);console.log('PASS zero keystroke/debounce requests; same-row grouping; decimal/caret stability; editable inputs during delayed save; stale-response protection; serialized/coalesced boundaries; failure/retry; invalid completed edits; tab navigation/resume/reload/Finish persistence; explicit History corrections.');
}finally{release?.();await browser.close()}
