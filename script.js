// ---------- Primer setup ----------
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const primer = document.getElementById('primer');
const primerAudio = document.getElementById('primerAudio');
const jigsawFace = document.getElementById('jigsawFace');
const app = document.getElementById('app');
const cc = document.getElementById('cc');
let faceFlashTimeout = null, ccShowTO = null, ccHideTO = null;

startBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  primer.classList.remove('hidden');
  primer.setAttribute('aria-hidden','false');

  primerAudio.src = 'Jigsaw Clue 15.mp3';
  primerAudio.play().catch(()=>{});

  // Closed captions: 5s–7s
  ccShowTO = setTimeout(()=>{
    cc.textContent='I want to play a game.';
    cc.classList.remove('hidden');
  },5000);
  ccHideTO = setTimeout(()=>{
    cc.classList.add('hidden');
    cc.textContent='';
  },7000);

  // Flash Jigsaw face at 10s for 8s
  setTimeout(()=> startFaceFlash(8000,90),10000);

  primerAudio.addEventListener('ended',()=>{
    stopFaceFlash();
    clearTimeout(ccShowTO); clearTimeout(ccHideTO);
    cc.classList.add('hidden'); cc.textContent='';
    primer.classList.add('hidden');
    app.classList.remove('hidden');
    startGame();
  },{once:true});
});

function startFaceFlash(duration,interval){
  jigsawFace.style.opacity='1';
  jigsawFace.style.animation=`flash ${interval*2}ms steps(2,end) infinite`;
  faceFlashTimeout=setTimeout(stopFaceFlash,duration);
}
function stopFaceFlash(){
  clearTimeout(faceFlashTimeout);
  jigsawFace.style.animation='none';
  jigsawFace.style.opacity='0';
}

// ---------- Game logic ----------
const promptSymbol=document.getElementById('promptSymbol');
const idxEl=document.getElementById('idx');
const missesEl=document.getElementById('misses');
const statusEl=document.getElementById('status');
const timerBar=document.getElementById('timerBar');

const resultDlg=document.getElementById('resultDlg');
const resultTitle=document.getElementById('resultTitle');
const resultMsg=document.getElementById('resultMsg');
const againBtn=document.getElementById('againBtn');

const passDlg=document.getElementById('passDlg');
const copyBtn=document.getElementById('copyBtn');
const codeField=document.getElementById('codeField');
const closePass=document.getElementById('closePass');
const buttons=[...document.querySelectorAll('.arrow')];

const TOTAL_PROMPTS=150;
const MAX_MISSES=4;
const WINDOW_MS=1000;
const ALL_DIRS=['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'];

let sequence=[],currentIndex=0,misses=0,awaiting=false,windowTimer=null,barTimer=null;

function randomSequence(n){
  const arr=[];for(let i=0;i<n;i++) arr.push(ALL_DIRS[Math.floor(Math.random()*ALL_DIRS.length)]);
  return arr;
}

function startGame(){
  document.body.focus();
  sequence=randomSequence(TOTAL_PROMPTS);
  currentIndex=0; misses=0;
  updateHUD(); statusEl.textContent='Go!';
  nextPrompt();
}
function updateHUD(){
  idxEl.textContent=String(currentIndex+1);
  missesEl.textContent=String(misses);
}

function nextPrompt(){
  clearTimers();
  if(misses>=MAX_MISSES) return fail(`You missed ${misses} times. The chains hold…`);
  if(currentIndex>=TOTAL_PROMPTS) return succeed();

  const key=sequence[currentIndex];
  const sym={ArrowRight:'→',ArrowLeft:'←',ArrowDown:'↓',ArrowUp:'↑'}[key];
  promptSymbol.textContent=sym; statusEl.textContent='…';
  awaiting=true;
  const start=performance.now();
  barTimer=animateBar(start,WINDOW_MS);
  windowTimer=setTimeout(()=>{
    if(awaiting){
      awaiting=false; misses++; updateHUD(); flashBad(); currentIndex++; nextPrompt();
    }
  },WINDOW_MS);
}

function handleInput(k){
  if(!awaiting)return;
  const expected=sequence[currentIndex];
  awaiting=false; clearTimers();
  if(k===expected)flashGood(); else{misses++; updateHUD(); flashBad();}
  currentIndex++; nextPrompt();
}

function flashGood(){promptSymbol.style.color='var(--good)'; setTimeout(()=>promptSymbol.style.color='',120);}
function flashBad(){promptSymbol.style.color='var(--bad)'; setTimeout(()=>promptSymbol.style.color='',160);}

function animateBar(start,dur){
  timerBar.style.width='0%';
  function step(now){
    const t=Math.min(1,(now-start)/dur);
    timerBar.style.width=`${(1-t)*100}%`;
    if(t<1&&awaiting) barTimer=requestAnimationFrame(step);
  }return requestAnimationFrame(step);
}
function clearTimers(){
  clearTimeout(windowTimer); windowTimer=null; cancelAnimationFrame(barTimer); barTimer=null;
  timerBar.style.width='100%';
}

function fail(msg){
  resultTitle.textContent='⛓️ Failed';
  resultMsg.textContent=msg;
  resultDlg.showModal();
}
function succeed(){passDlg.showModal();}

againBtn.addEventListener('click',()=>{resultDlg.close(); startGame();});
copyBtn.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(codeField.value);
    copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy code',900);
  }catch{}
});
closePass.addEventListener('click',()=>passDlg.close());

window.addEventListener('keydown',e=>{
  if(ALL_DIRS.includes(e.key)){e.preventDefault(); handleInput(e.key);}
});
buttons.forEach(btn=>btn.addEventListener('click',()=>handleInput(btn.dataset.key)));

(()=>{const img=new Image(); img.src='Jigsaw Face.png';})();
