import {createHomeBackdrop} from './engine/home.js';
import {pixelGhost} from './engine/pixel-art.js';
import {art,sealSVG,lampSVG} from './art.js';
import {state,save,has,highest,safeText,UNLOCKS,RIDE_CONSTRUCTION_UNTIL,evidence,localQA,resetState,ORDER,ADMIN_KEY} from './state.js';
import {releaseMeltdown} from './engine/site-meltdown.js';
import {canLaunchGame,shouldStartGraveInvestigation} from './engine/game-access.js';
import {PAPER_RECORDS,isPaperChronology,paperAnswerMatches} from './engine/paper-puzzle.js';
import {initFirebase,account,queueSync,isAdmin,submitScore,fetchScores,signedIn,currentName,resetRemote} from './firebase.js';
const app=document.querySelector('#app'),modal=document.querySelector('#modal');
let active=null,dev=false,view='home',sound=null,releasePhase='',runGeneration=0,flickerTimer=0,boardGame='grave';
const homePhase=()=>[...Object.values(UNLOCKS),RIDE_CONSTRUCTION_UNTIL].map(t=>Date.now()>=t).join();
export const ui={toast,dialog,home,scene,play,resetEverything:restartEverything,advance:null,get dev(){return dev},get paused(){return modal.open},beep};
export function toast(text){const t=document.querySelector('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),4300)}
export function dialog(html){document.querySelector('#modal-content').innerHTML=html;if(!modal.open)modal.showModal();}
modal.addEventListener('cancel',e=>{if(modal.dataset.locked)e.preventDefault()});
document.addEventListener('click',e=>{if(modal.dataset.locked&&!modal.contains(e.target)){e.preventDefault();e.stopImmediatePropagation()}},true);
document.querySelector('.modal-close').onclick=()=>{if(!modal.dataset.locked)modal.close()};modal.addEventListener('click',e=>{if(e.target===modal&&!modal.dataset.locked){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
modal.addEventListener('close',()=>{const finished=modal.dataset.finishedRun;delete modal.dataset.finishedRun;if(finished!==undefined&&Number(finished)===runGeneration&&view==='game')home()});
function stop(keepFs=false){delete modal.dataset.locked;runGeneration++;clearInterval(flickerTimer);document.body.classList.remove('room-home','blackout');delete modal.dataset.finishedRun;if(modal.open)modal.close();if(!keepFs&&document.fullscreenElement&&app.contains(document.fullscreenElement))document.exitFullscreen().catch(()=>{});window.dispatchEvent(new Event('arcade-viewchange'));if(active){active.destroy();active=null}}
function clearRunCheckpoints(){if(state.runs&&Object.keys(state.runs).length){delete state.runs;save()}}
function paperStackReady(){return state.paperStackFound||has('papers')}
async function restartEverything(){
 if(dev){const response=await fetch('/__dev/advance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'restart'})});if(!response.ok)throw Error('Could not reset the local story.')}
 else if(signedIn())await resetRemote();
 localStorage.removeItem(ADMIN_KEY);resetState();home();toast('The arcade story has been reset.');
}
export function scene(html){stop();view='story';app.innerHTML=html;window.scrollTo(0,0)}
export function home(){if(modal.dataset.locked)return;stop();clearRunCheckpoints();view='home';releasePhase=homePhase();document.title='Midnight Arcade · Halloween 2026';
 const games=[['grave','Grave Robber','Dig for treasure. Get out alive.','October 29'],['delivery','Midnight Delivery','Get the candy there in one piece.','October 30'],['ride','Last Ride','Take the last cart through the mines.','October 31']];
 const boards=[['grave','GRAVE'],['delivery','DELIVERY'],['ride','RIDE']];
 app.innerHTML=`<section class="room"><div class="room-fog" aria-hidden="true"></div><div class="room-figure" aria-hidden="true"></div><div class="room-bulb" aria-hidden="true"></div><div class="room-light" aria-hidden="true"></div><div class="room-eyes" aria-hidden="true"><i></i><i></i></div><div class="room-crack" aria-hidden="true"></div>
 <header class="room-head"><p class="event-date">OCTOBER 29 — 31, 2026</p><h1 class="room-title">Midnight<span>Arcade</span></h1></header><p class="home-whisper" aria-live="polite"></p>
 <div class="cabinet-row" aria-label="Choose a game">${games.map(([id,title,desc,date],n)=>{const preview=(dev||isAdmin)&&state.prefs.preview,locked=(Date.now()<UNLOCKS[id]||id==='ride'&&Date.now()<RIDE_CONSTRUCTION_UNTIL)&&!preview;return `<article class="cabinet ${locked?'unreleased':''}" style="--i:${n}"><div class="cab-top"><span class="cab-marquee">${title}</span></div><div class="cab-screen">${art(id)}<span class="art-tag">${date.toUpperCase()}</span>${locked?'<span class="cab-static" aria-hidden="true"></span><span class="card-lock" aria-label="Locked"><svg width="18" height="22" viewBox="0 0 18 22"><path d="M4 9V5a5 5 0 0110 0v4M2 9h14v12H2z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>':''}</div><div class="cab-panel"><p class="game-desc">${desc}</p><button class="play-button ${locked?'locked':''}" data-play="${id}" ${locked?'disabled':''}>${locked?'Unlocks '+date:'Play'}<span>${locked?'⌁':'↗'}</span></button>${state.scores[id]?`<p class="credit-line">Best: ${state.scores[id].toLocaleString()}</p>`:''}</div><div class="cab-base"></div></article>`}).join('')}${has('contact')?secretCard():''}</div>
 <aside class="board" aria-label="Leaderboard"><h2>THE BOARD</h2><div class="board-tabs" role="tablist">${boards.map(([id,l])=>`<button role="tab" data-board="${id}" aria-selected="${id===boardGame}">${l}</button>`).join('')}</div><ol id="board-rows"></ol><p class="board-note">Finish a run, then choose SAVE SCORE. Sign-in required.</p></aside></section>`;
 document.body.classList.add('room-home');
 if(has('escape')){const lamp=document.createElement('button');lamp.id='menu-lamp';lamp.className='paper-stack-menu home-lantern';lamp.innerHTML=`<span class="home-lantern-art" aria-hidden="true">${lampSVG}</span><b>BLACK LANTERN</b><em>INSPECT</em>`;app.querySelector('.cabinet-row').after(lamp)}
 if(paperStackReady()){const stack=document.createElement('button');stack.id='open-paper-stack';stack.className='paper-stack-menu';stack.innerHTML='<span aria-hidden="true">▤</span><b>LAST RIDE · PAPER STACK</b><em>VIEW PAPERS</em>';app.querySelector('.cabinet-row').after(stack)}
 const homeGeneration=runGeneration,stackReady=paperStackReady(),sealedEnding=state.endings.includes('contain'),freedEnding=!sealedEnding&&state.endings.includes('release'),whisperText=sealedEnding?'A voice behind the boards: “I can wait.”':freedEnding?'The signal is still coming through.':has('delivered')&&!stackReady?'The ghost: “The parcel was sent into Last Ride. Go back to the tracks.”':stackReady?'The ghost: “The five pages are together. Your paper stack is here.”':'A voice from the dark: “The graveyard gate is open. Follow the compass to what was buried.”';setTimeout(()=>{if(view==='home'&&runGeneration===homeGeneration){const whisper=app.querySelector('.home-whisper');if(whisper){whisper.textContent=whisperText;if(sealedEnding)beep(58,.7)}}},sealedEnding||freedEnding?900:has('delivered')?700:60000);
 if(has('delivered'))app.querySelector('.home-whisper').textContent=whisperText;
 if(state.prefs.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches)flickerTimer=setInterval(()=>{if(view!=='home'||Math.random()>.6)return;const b=document.body.classList,dip=ms=>{b.add('blackout');setTimeout(()=>b.remove('blackout'),ms)};dip(90+Math.random()*230);if(Math.random()<.6)setTimeout(()=>dip(60),380);if(Math.random()<.25)setTimeout(()=>dip(140),900)},3200);
 if(Date.now()<RIDE_CONSTRUCTION_UNTIL&&!((dev||isAdmin)&&state.prefs.preview)){const ride=app.querySelector('[data-play="ride"]');if(ride){ride.disabled=true;ride.classList.add('locked');ride.textContent='UNDER CONSTRUCTION';ride.closest('.cabinet')?.classList.add('unreleased')}}
 app.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>play(b.dataset.play).catch(e=>toast(e.message)));app.querySelector('#menu-lamp')?.addEventListener('click',()=>openStory('menuLamp'));app.querySelector('#enter-chamber')?.addEventListener('click',()=>play('chamber',{investigation:true}).catch(e=>toast(e.message)));app.querySelector('#restart-ending')?.addEventListener('click',()=>restartEverything().catch(e=>toast(e.message)));app.querySelectorAll('#open-paper-stack,#solve-papers').forEach(b=>b.addEventListener('click',paperStackDialog));app.querySelector('#fourth-answer-form')?.addEventListener('submit',submitPaperAnswer);
 app.querySelectorAll('[data-board]').forEach(b=>b.onclick=()=>{boardGame=b.dataset.board;app.querySelectorAll('[data-board]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));loadBoard()});
 loadBoard();refreshChrome();
}
async function loadBoard(){const box=document.querySelector('#board-rows');if(!box)return;const g=boardGame;box.innerHTML='<li class="board-empty">Names are surfacing…</li>';try{const rows=await fetchScores(g,10);if(!box.isConnected||g!==boardGame)return;box.innerHTML=rows.length?rows.map((r,i)=>`<li><span>${i+1}</span><b>${safeText(r.name)}</b><em>${Number(r.score).toLocaleString()}</em></li>`).join(''):'<li class="board-empty">No names yet. Be the first.</li>'}catch{if(box.isConnected&&g===boardGame)box.innerHTML='<li class="board-empty">The board is dark right now.</li>'}}
function secretCard(){
 const stackReady=paperStackReady(),unlocked=state.paperPuzzleSolved,connections=[has('escape'),has('delivered'),unlocked].filter(Boolean).length,contained=state.endings.includes('contain'),freed=!contained&&state.endings.includes('release');
 if(freed)return `<article class="cabinet freed" style="--i:3"><div class="cab-top"><span class="cab-marquee">EMPTY</span></div><div class="cab-screen dead"><span class="cab-static" aria-hidden="true"></span><span class="art-tag">IT GOT OUT</span></div><div class="cab-panel"><p class="game-desc">THE MIRROR IS OPEN</p><button id="restart-ending" class="play-button">RESTART</button></div><div class="cab-base"></div></article>`;
 if(contained)return `<article class="cabinet chained boarded-cabinet" style="--i:3"><div class="cab-top"><span class="cab-marquee">DO NOT RESTORE</span></div><div class="cab-screen dead"><span class="cab-static" aria-hidden="true"></span><span class="boarded-planks" aria-hidden="true"></span><span class="art-tag">SEALED FOREVER</span></div><div class="cab-panel"><p class="game-desc">THE MIRROR IS CLOSED</p><button id="restart-ending" class="play-button">RESTART</button></div><div class="cab-base"></div></article>`;
 return `<article class="cabinet chained ${unlocked?'awakened':''}" style="--i:3"><div class="chain chain-a" aria-hidden="true"></div><div class="chain chain-b" aria-hidden="true"></div><div class="cab-top"><span class="cab-marquee">${unlocked?'The Fourth Game':'???'}</span></div><div class="cab-screen dead"><span class="cab-static" aria-hidden="true"></span><span class="secret-figure" aria-hidden="true"></span><span class="art-tag">${connections} / 3 CONNECTIONS</span></div><div class="cab-panel"><p class="game-desc">${unlocked?'THE MIRROR IS WAITING':stackReady?'THE PAPERS ARE WAITING':'SEALED · A VOICE ON THE OTHER SIDE'}</p>${stackReady&&!unlocked?isPaperChronology(state.paperOrder)?'<form id="fourth-answer-form"><label for="fourth-answer">THE FOURTH GAME · ANSWER</label><input id="fourth-answer" name="answer" autocomplete="off" maxlength="12" aria-describedby="fourth-answer-status"><p id="fourth-answer-status" class="answer-status" aria-live="polite"></p><button class="play-button" type="submit">ANSWER THE FOURTH GAME<span>↗</span></button></form>':'<button id="solve-papers" class="play-button">ARRANGE THE PAPERS<span>↗</span></button>':''}${unlocked?'<button id="enter-chamber" class="play-button">ENTER<span>↗</span></button>':''}</div><div class="cab-base"></div></article>`;
}
function paperStackDialog(enlarged=null){
 const pages=(state.ridePapers||[]).filter(page=>Number.isInteger(page)&&page>=0&&page<5),ordered=isPaperChronology(state.paperOrder);
 const pageData=(ordered?state.paperOrder:pages).map(id=>PAPER_RECORDS.find(page=>page.id===id));
 const selected=pageData.find(page=>page.id===enlarged);
 const pageHTML=page=>`<span>${page.heading}</span><p>${page.text}</p><time>OCT 31 · ${page.time}</time>`;
 dialog(`<h2>Last Ride · recovered papers</h2>${selected?`<article class="paper-enlarged">${pageHTML(selected)}</article><button class="btn" id="back-to-stack">BACK TO STACK</button>`:`<section class="paper-stack-view ${ordered?'ordered-stack':''}">${pageData.map(page=>`<button type="button" class="paper-page" data-enlarge-paper="${page.id}" aria-label="Read ${page.heading}">${pageHTML(page)}</button>`).join('')}</section>${pages.length===5&&!ordered?`<form id="paper-order-form"><fieldset><legend>ARRANGE THE RECORDS</legend>${Array.from({length:5},(_,position)=>`<label class="paper-order-row"><span>POSITION ${position+1}</span><select data-paper-order="${position}" required><option value="">Choose a record…</option>${pageData.map(page=>`<option value="${page.id}">${page.heading}</option>`).join('')}</select></label>`).join('')}</fieldset><p id="paper-order-status" class="paper-stack-pending" aria-live="polite"></p><button class="btn primary" type="submit">CHECK THE ORDER</button></form>`:''}`}<div class="button-row"><button class="btn" id="close-paper-stack">CLOSE</button></div>`);
 document.querySelector('#close-paper-stack').onclick=()=>modal.close();
 document.querySelector('#back-to-stack')?.addEventListener('click',()=>paperStackDialog());
 document.querySelectorAll('[data-enlarge-paper]').forEach(button=>button.onclick=()=>paperStackDialog(Number(button.dataset.enlargePaper)));
 const orderForm=document.querySelector('#paper-order-form');
 orderForm?.addEventListener('submit',event=>{
  event.preventDefault();
  const order=[...orderForm.querySelectorAll('[data-paper-order]')].map(select=>Number(select.value));
  if(new Set(order).size!==5||!isPaperChronology(order)){document.querySelector('#paper-order-status').textContent='That order does not fit.';return}
  state.paperOrder=order;save();home();paperStackDialog();
 });
}
function submitPaperAnswer(event){
 event.preventDefault();
 const answer=document.querySelector('#fourth-answer').value,status=document.querySelector('#fourth-answer-status');
 if(!paperAnswerMatches(answer)){status.textContent='The lock stays closed.';return}
 state.paperPuzzleSolved=true;save();evidence('ride-paper-answer','The station’s final word','The misprinted letters, read by dispatch time, spell ALIVE. Someone was still breathing when the north gate was sealed.','Puzzle');home();toast('The word unlocks the Fourth Game.');
}
export async function play(id,resume=null,keepFs=false){const testMode=!!resume?.testMode,authorized=!!(isAdmin||dev);if(testMode&&!authorized){toast('Admin testing is available only to verified admins and local developers.');return}const now=Date.now(),allowed=canLaunchGame({now,unlockAt:UNLOCKS[id]||0,constructionUntil:id==='ride'?RIDE_CONSTRUCTION_UNTIL:0,authorized,preview:state.prefs.preview,testMode});if(!allowed){toast(id==='ride'&&now<RIDE_CONSTRUCTION_UNTIL?'Last Ride is UNDER CONSTRUCTION until October 31 at 4 PM Pacific.':'This game has not opened yet.');return}if(id==='chamber'&&!testMode&&!state.paperPuzzleSolved){toast('The papers have not revealed how to open the Fourth Game.');return}const autoGraveInvestigation=id==='grave'&&!testMode&&shouldStartGraveInvestigation(state.stage);const reuse=keepFs&&!!document.fullscreenElement&&document.fullscreenElement.classList?.contains('game-shell')&&app.contains(document.fullscreenElement);stop(reuse);if(id==='ride'&&state.runs?.ride&&!testMode){delete state.runs.ride;save()}const generation=runGeneration;let testStage=resume?.stage??state.stage;view='game';const {startGame}=await import('./games.js');if(generation!==runGeneration)return;const titles={grave:'Grave Robber',delivery:'Midnight Delivery',ride:'Last Ride',chamber:'The Fourth Game'},canvasHtml=`<canvas id="game" width="960" height="600" tabindex="0" aria-label="${id} game. Controls and touch buttons below."></canvas>`;
 if(reuse){const sh=app.querySelector('.game-shell');sh.querySelector('.canvas-wrap').innerHTML=canvasHtml;sh.querySelector('h1').textContent=titles[id]}else{app.innerHTML=`<section class="game-shell"><div class="game-toolbar"><h1>${titles[id]}</h1><div class="button-row"><button class="btn" id="back-game">← ARCADE</button><button class="btn" id="fullscreen-game">FULLSCREEN ↗</button></div></div><div class="canvas-wrap">${canvasHtml}</div><div class="game-help" id="game-help"></div><div class="touch-controls" id="touch-controls"></div></section>`;
 document.querySelector('#back-game').onclick=home;const shell=app.querySelector('.game-shell'),fullscreenButton=document.querySelector('#fullscreen-game');fullscreenButton.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen()}catch{toast('Fullscreen is unavailable in this browser.')}};shell.addEventListener('fullscreenchange',()=>{fullscreenButton.textContent=document.fullscreenElement?'EXIT FULLSCREEN ↙':'FULLSCREEN ↗'})}
 const callbacks={paused:()=>modal.open,soundEnabled:()=>state.prefs.sound,beep,motion:state.prefs.motion,toast,
  onEvidence:(...args)=>{if(!testMode)evidence(...args)},
  onStory:async(action,payload)=>{if(testMode)return ++testStage;if(action==='entered'&&!state.paperPuzzleSolved)throw Error('Solve the paper-stack puzzle before entering the Fourth Game.');const {storyProgress}=await import('./story.js');return storyProgress(ui,action,action==='entered'?{...payload,puzzleSolved:true}:payload)},
  onLetter:(letter,letters)=>{if(!testMode){state.rideLetters=letters;save()}},
  onPaper:(page,papers)=>{if(!testMode){state.ridePapers=papers;save()}},
  onEscapeDeath:count=>{if(!testMode){state.escapeDeaths=count;save()}},
  onCheckpoint:checkpoint=>{if(testMode||id==='ride')return;state.runs={...state.runs,[id]:checkpoint};save()},
  onEnd:async result=>{
   if(generation!==runGeneration||view!=='game')return;
   if(testMode){releaseMeltdown();dialog(`<h2>Test run complete</h2><p>${safeText(result.message)}</p><p>This admin test did not save story progress or a score.</p><div class="button-row"><button class="btn primary" id="test-exit">RETURN TO ARCADE</button></div>`);modal.dataset.finishedRun=String(generation);document.querySelector('#test-exit').onclick=()=>{modal.close();home()};return}
   if((result.won||id==='grave')&&state.runs?.[id]){delete state.runs[id];save()}
   if(id!=='chamber')highest(result.endless?'rideEndless':id,result.score);queueSync();
   if(result.ending){const {showEnding}=await import('./story.js');await showEnding(ui,result.ending,result.binding);return}
   if(result.contact&&!has('contact')){try{const {storyProgress}=await import('./story.js');await storyProgress(ui,'contact',{finished:true});if(generation!==runGeneration)return;home();toast('A clue was added to the casebook.')}catch(e){toast(e.message)}return}
   if(result.delivered||result.escaped){dialog(`<h2>${result.delivered?'Package successfully delivered.':'You escaped with the black lantern!'}</h2><p>${result.delivered?'The sealed parcel has been dispatched.':'The black lantern is now on your main screen.'}</p><button class="btn primary" id="completion-home">RETURN TO ARCADE</button>`);modal.dataset.finishedRun=String(generation);document.querySelector('#completion-home').onclick=home;return}
   if(result.paperStack){state.ridePapers=result.papers;state.paperStackFound=true;try{const {storyProgress}=await import('./story.js');await storyProgress(ui,'papers',{pages:result.papers.length})}catch(error){toast(error.message)}save();paperStackDialog();modal.dataset.finishedRun=String(generation);return}
   if(result.restored){home();toast('The fourth cabinet is open.');return}
   const toCutscene=id==='ride'&&result.wordComplete&&!has('contact'),ghost=id==='ride'&&!has('contact')&&Array.isArray(result.letters)?ghostWord(result.letters,toCutscene):'';
   dialog(`<h2>${result.won?'Made it out.':'One more try?'}</h2><p>${safeText(result.message)}</p><p class="verse">SCORE ${Math.round(result.score)} · BEST ${state.scores[result.endless?'rideEndless':id]}</p>${ghost}${!toCutscene&&id!=='chamber'&&result.score>0?'<div class="save-score" id="save-box"></div>':''}${toCutscene?'':'<div class="button-row"><button class="btn primary" id="retry-run">PLAY AGAIN</button><button class="btn" id="end-home">ARCADE</button></div>'}`);
   if(toCutscene){
    modal.dataset.locked='true';
    setTimeout(()=>{if(generation!==runGeneration)return;delete modal.dataset.finishedRun;play('ride',{cutscene:true,score:result.score},true).catch(e=>{delete modal.dataset.locked;home();toast(e.message)})},4300);
    return;
   }
   modal.dataset.finishedRun=String(generation);renderSaveBox(id,result.score);
   document.querySelector('#retry-run').onclick=()=>{delete modal.dataset.finishedRun;modal.close();play(id,result.endless?{endless:true}:result.checkpoint||null,true)};
   document.querySelector('#end-home').onclick=home;
  }};
 const options={letters:Array.isArray(state.rideLetters)?state.rideLetters:[],papers:Array.isArray(resume?.papers)?resume.papers:state.ridePapers,contactMet:has('contact'),resume:testMode?null:id==='ride'?null:resume?.distance?resume:(state.runs?.[id]?.distance||state.runs?.[id]?.scene==='grave')?state.runs[id]:null,stage:resume?.stage??state.stage,investigation:!!resume?.investigation||autoGraveInvestigation,paperHunt:resume?.paperHunt??(!testMode&&id==='ride'&&has('delivered')&&!state.paperStackFound),cutscene:!!resume?.cutscene,score:resume?.score||0,testMode,testDistance:resume?.testDistance||0,testStart:resume?.testStart,vehicle:resume?.vehicle||localStorage.getItem('midnight-delivery-car')||'standard',escapeDeaths:testMode?0:(state.escapeDeaths||0)};
 if(id==='ride'&&paperStackReady())options.paperHunt=false;
 active=startGame(id,document.querySelector('#game'),callbacks,options);if(resume?.cutscene)active.start();else active.showIntro(dialog,()=>modal.close());document.querySelector('#game').focus();
}
async function openStory(intent){modal.close();try{const {openInvestigation}=await import('./story.js');await openInvestigation(ui,intent)}catch(e){toast(e.message)}}
function ghostWord(found,complete=false){return `<div class="ghost-word${complete?' complete':''}" aria-label="Letters found: ${found.length} of 5">${[...'GHOST'].map((l,i)=>`<span class="${found.includes(l)?'found':''}" style="--d:${(i*.3+.4).toFixed(1)}s">${l}</span>`).join('')}</div>`}
function renderSaveBox(id,score){const box=document.querySelector('#save-box');if(!box)return;
 if(!signedIn()){box.innerHTML='<span>Sign in to save your score.</span><button class="btn" id="save-signin">SIGN IN</button>';box.querySelector('#save-signin').onclick=async e=>{e.currentTarget.disabled=true;try{await account()}catch(err){toast(err.message)}renderSaveBox(id,score)};return}
 box.innerHTML=`<span>Saving as <b>${safeText(currentName())}</b></span><button class="btn" id="save-score">SAVE SCORE</button>`;
 box.querySelector('#save-score').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const r=await submitScore(id,score);b.textContent=r.improved?'SAVED ✓':'SAVED · BEST '+r.best.toLocaleString()}catch(err){b.disabled=false;toast(err.message)}}}
function adminTests(){
 if(!isAdmin&&!dev){toast('Admin testing is available only to verified admins and local developers.');return}
 const tests=[
  ['grave','Grave Robber · free run',{id:'grave',options:{}}],
  ['grave-key','Grave Robber · find the key',{id:'grave',options:{investigation:true,stage:1,testStart:'key'}}],
  ['grave-seal','Grave Robber · trace the seal',{id:'grave',options:{investigation:true,stage:2,testStart:'key'}}],
  ['grave-lantern','Grave Robber · chamber warning',{id:'grave',options:{investigation:true,stage:3,testStart:'lamp'}}],
  ['grave-escape','Grave Robber · lantern escape',{id:'grave',options:{investigation:true,stage:4}}],
  ['delivery-investigation','Midnight Delivery · Rookhaven bridge and Gloaming',{id:'delivery',options:{investigation:true,stage:6}}],
  ['gloaming','Gloaming · three haunted-city deliveries',{id:'delivery',options:{investigation:true,stage:7}}],
  ['parcel','Post-office parcel investigation',{id:'delivery',options:{investigation:true,stage:8}}],
  ['ride','Last Ride · fresh run',{id:'ride',options:{}}],
  ['five-tracks','Last Ride · five-track section',{id:'ride',options:{testDistance:1300}}],
  ['arrival','Last Ride · ghost cutscene',{id:'ride',options:{cutscene:true,score:850}}],
  ['paper-hunt','Last Ride · rare paper investigation',{id:'ride',options:{paperHunt:true}}],
  ['chamber','The Fourth Game · final choice',{id:'chamber',options:{investigation:true,stage:10}}]
 ];
 dialog(`<h2>Admin test bench</h2><p>Jump directly into a game, investigation segment, paper hunt, or cutscene. QA runs never update saved progress or scores.</p><div class="admin-test-grid">${tests.map(([key,label])=>`<button class="btn" data-admin-test="${key}">${label} ↗</button>`).join('')}</div>`);
 for(const [key,,test]of tests)document.querySelector(`[data-admin-test="${key}"]`).onclick=()=>{modal.close();play(test.id,{...test.options,testMode:true}).catch(e=>toast(e.message))};
}

// ---- Admin progress editor (verified admins and local dev only) ----
function applyAdminOverride(){
 const raw=localStorage.getItem(ADMIN_KEY);if(raw===null||!(dev||isAdmin))return false;
 try{const o=JSON.parse(raw);if(Number.isInteger(o.stage)&&o.stage>=0&&o.stage<=ORDER.length){state.stage=o.stage;if(Array.isArray(o.endings))state.endings=o.endings;save();return true}}catch{}
 return false;
}
function adminProgress(){
 if(!isAdmin&&!dev){toast('Progress editing is available only to verified admins and local developers.');return}
 const stages=['Fresh · before first contact',...ORDER.map(n=>'After “'+n+'”')],row='display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:9px 0',chk='display:inline-flex;gap:5px;border:0;padding:0',q=s=>document.querySelector(s);
 const box=(attr,val,label,on)=>`<label style="${chk}"><input type="checkbox" ${attr}="${val}" ${on?'checked':''}>${label}</label>`;
 dialog(`<h2>Progress editor</h2><p>Admin / local-dev only. Changes the save on this device. With “simulate story locally” on, story steps skip the server so you can walk the whole chain (the first-contact cutscene, escape, bridge, papers, final choice). Untick it to go back to real server progress.</p>
 <div style="${row}"><b>Story stage</b><select id="ap-stage">${stages.map((n,i)=>`<option value="${i}" ${state.stage===i?'selected':''}>${i} · ${n}</option>`).join('')}</select></div>
 <div style="${row}"><b>GHOST letters</b>${[...'GHOST'].map(l=>box('data-ap-letter',l,l,(state.rideLetters||[]).includes(l))).join('')}</div>
 <div style="${row}"><b>Papers</b>${[0,1,2,3,4].map(i=>box('data-ap-paper',i,'Page '+(i+1),(state.ridePapers||[]).includes(i))).join('')}<label style="${chk}"><input type="checkbox" id="ap-stack" ${state.paperStackFound?'checked':''}>Stack assembled</label><label style="${chk}"><input type="checkbox" id="ap-puzzle-solved" ${state.paperPuzzleSolved?'checked':''}>Paper puzzle solved</label></div>
 <div style="${row}"><b>Endings seen</b>${box('data-ap-ending','contain','Normal lamp',state.endings.includes('contain'))}${box('data-ap-ending','release','Black lamp',state.endings.includes('release'))}</div>
 <div style="${row}"><b>Best scores</b>${['grave','delivery','ride','rideEndless'].map(k=>`<span>${k} <input type="number" min="0" id="ap-score-${k}" value="${state.scores[k]||0}" style="width:90px"></span>`).join('')}</div>
 <div style="${row}"><b>Escape deaths</b><input type="number" min="0" id="ap-deaths" value="${state.escapeDeaths||0}" style="width:70px"><span style="font-size:11px">(each death makes the lantern escape slightly easier)</span></div>
 <div style="${row}"><label style="${chk}"><input type="checkbox" id="ap-local" ${localStorage.getItem(ADMIN_KEY)!==null?'checked':''}>Simulate story progress locally (skip server checks)</label></div>
 <div class="button-row"><button class="btn primary" id="ap-apply">APPLY</button><button class="btn" id="ap-max">MAX OUT (before final choice)</button><button class="btn" id="ap-cancel">CANCEL</button></div>`);
 q('#ap-max').onclick=()=>{q('#ap-stage').value=String(ORDER.length-1);document.querySelectorAll('[data-ap-letter],[data-ap-paper]').forEach(c=>c.checked=true);q('#ap-stack').checked=true;document.querySelectorAll('[data-ap-ending]').forEach(c=>c.checked=false);q('#ap-local').checked=true};
 q('#ap-cancel').onclick=()=>modal.close();
 q('#ap-apply').onclick=()=>{
  state.stage=Number(q('#ap-stage').value);
  state.rideLetters=[...'GHOST'].filter(l=>q(`[data-ap-letter="${l}"]`).checked);
  state.ridePapers=[0,1,2,3,4].filter(i=>q(`[data-ap-paper="${i}"]`).checked);
  state.paperStackFound=q('#ap-stack').checked;state.paperPuzzleSolved=q('#ap-puzzle-solved').checked;if(!state.paperPuzzleSolved)state.paperOrder=[];
  state.endings=['contain','release'].filter(k=>q(`[data-ap-ending="${k}"]`).checked);
  for(const k of Object.keys(state.scores))state.scores[k]=Math.max(0,Math.round(Number(q('#ap-score-'+k).value)||0));
  state.escapeDeaths=Math.max(0,Math.floor(Number(q('#ap-deaths').value)||0));
  if(q('#ap-local').checked)localStorage.setItem(ADMIN_KEY,JSON.stringify({stage:state.stage,endings:state.endings}));else localStorage.removeItem(ADMIN_KEY);
  save();modal.close();home();toast('Progress updated.');
 };
}
function casebook(){const entries=Object.values(state.evidence);dialog(`<h2>Casebook</h2><p>Every discovered clue and item is saved automatically.</p><div class="evidence-list">${entries.length?entries.map(e=>`<article class="evidence"><span class="game-type">${safeText(e.type)}</span><h3>${safeText(e.title)}</h3><p>${safeText(e.text)}</p></article>`).join(''):'<p>No evidence collected yet. The games are waiting.</p>'}</div>${state.items.length?`<h3>Items</h3><p>${state.items.map(safeText).join(' · ')}</p>`:''}`)}
function settings(){
 dialog(`<h2>Settings</h2><label>Reduced motion<input type="checkbox" id="pref-motion" ${!state.prefs.motion?'checked':''}></label><p>Keyboard and touch controls are available in every game. Sound is controlled from the top bar.</p><p class="credit-line">October 29–31, 2026 · Pacific time</p>${dev||isAdmin?`<label>Test unreleased games<input type="checkbox" id="pref-preview" ${state.prefs.preview?'checked':''}></label><button class="btn" id="admin-tests">OPEN ADMIN TEST BENCH</button> <button class="btn" id="admin-progress">EDIT PROGRESS</button>`:''}<p id="settings-sync"></p>${dev?'<button class="btn" id="restart-playtest">Restart local story playtest</button>':''}`);
 document.querySelector('#admin-tests')?.addEventListener('click',adminTests);
 document.querySelector('#admin-progress')?.addEventListener('click',adminProgress);
 document.querySelector('#restart-playtest')?.addEventListener('click',async()=>{
  try{
   const r=await fetch('/__dev/advance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'restart'})});
   if(!r.ok)throw Error('Could not restart the local story.');
   localStorage.setItem('midnight-arcade-2026-playtest-archive',JSON.stringify(state));
   Object.assign(state,{stage:0,evidence:{},items:[],endings:[],puzzles:{},runs:{},rideLetters:[],ridePapers:[],paperStackFound:false,paperOrder:[],paperPuzzleSolved:false,escapeDeaths:0});
   localStorage.removeItem(ADMIN_KEY);save();modal.close();home();toast('New local story. Previous evidence archived on this device.');
  }catch(e){toast(e.message)}
 });
 document.querySelector('#settings-sync').textContent=document.querySelector('#sync-status').textContent;
 document.querySelector('#pref-preview')?.addEventListener('change',e=>{state.prefs.preview=e.target.checked;save();if(view==='home')home()});
 document.querySelector('#pref-motion').onchange=e=>{state.prefs.motion=!e.target.checked;save();document.body.classList.toggle('reduced-motion',!state.prefs.motion)};
}
function refreshChrome(){document.querySelector('#casebook-button').hidden=!has('contact');document.querySelector('#sound-button').textContent=state.prefs.sound?'SOUND ON':'SOUND OFF';document.body.classList.toggle('reduced-motion',!state.prefs.motion)}
export function beep(freq=220,duration=.07){if(!state.prefs.sound)return;try{sound||=new (window.AudioContext||window.webkitAudioContext)();const o=sound.createOscillator(),g=sound.createGain();o.connect(g);g.connect(sound.destination);o.frequency.value=freq;g.gain.setValueAtTime(.035,sound.currentTime);g.gain.exponentialRampToValueAtTime(.001,sound.currentTime+duration);o.start();o.stop(sound.currentTime+duration)}catch{}}
document.querySelector('#home-link').onclick=e=>{e.preventDefault();home()};document.querySelector('#settings-button').onclick=settings;document.querySelector('#casebook-button').onclick=casebook;document.querySelector('#sound-button').onclick=()=>{state.prefs.sound=!state.prefs.sound;save();refreshChrome();beep()};document.querySelector('#account-button').onclick=async()=>{try{await account()}catch(e){toast(e.message)}};
window.addEventListener('statechange',()=>{refreshChrome();queueSync()});window.addEventListener('pagehide',clearRunCheckpoints);window.addEventListener('pageshow',e=>{if(e.persisted)home()});window.addEventListener('storage-error',()=>toast('Device storage is full. Sign in and check cloud sync before leaving.'));window.addEventListener('accountchange',e=>{applyAdminOverride();document.querySelector('#account-button').textContent=e.detail?`${e.detail.displayName?.split(' ')[0]||'PLAYER'} · SIGN OUT`:'SIGN IN ↗';if(view==='home')home()});
try{const r=await fetch('/__dev/session');if(r.ok){const s=await r.json();dev=s.development===true;state.stage=s.stage||0;state.endings=s.endings||[];save()}else{state.stage=0;save()}}catch{state.stage=0;save()}
applyAdminOverride();document.documentElement.style.setProperty('--ghost-art',`url(${pixelGhost().toDataURL()})`);try{createHomeBackdrop(document.querySelector('.night-scene'),()=>view==='home'&&!document.hidden)}catch{document.querySelector('.night-scene').style.background='#111424'}document.querySelector('.brand-mark').innerHTML=sealSVG;if(localQA&&dev)state.prefs.preview=true;home();if(!(localQA&&dev))initFirebase({development:dev});

setInterval(()=>{if(view==='home'&&releasePhase!==homePhase())home()},15000);
