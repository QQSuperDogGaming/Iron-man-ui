/* ===== Real viewport height (mobile 100vh fix) ===== */
function setRealVh(){
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setRealVh();
window.addEventListener('resize', setRealVh, {passive:true});
window.addEventListener('orientationchange', setRealVh);

/* ===== Debounced auto‑FIT (center stable) ===== */
let fitRaf = 0;
function scheduleFit(){ if (fitRaf) cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(autoFit); }
function autoFit(){
  const root = document.querySelector('.hud');
  if(!root) return;

  document.body.classList.add('nofx');
  const core = document.querySelector('.core');
  const prevParallax = parallaxOn;
  const prevTransform = core.style.transform;
  parallaxOn = false;
  core.style.transform = 'translate(-50%, -50%)';

  document.documentElement.style.setProperty('--fit', '1');

  const nodes = [...root.querySelectorAll('.core, .widget:not(.hidden)')];
  let minL=Infinity,minT=Infinity,maxR=-Infinity,maxB=-Infinity;
  nodes.forEach(n=>{
    const r=n.getBoundingClientRect();
    minL=Math.min(minL,r.left); minT=Math.min(minT,r.top);
    maxR=Math.max(maxR,r.right); maxB=Math.max(maxB,r.bottom);
  });
  const boundsW=Math.max(1,maxR-minL), boundsH=Math.max(1,maxB-minT);
  const vw=innerWidth, vh=innerHeight, margin=16;
  const s=Math.min(1,(vw-margin*2)/boundsW,(vh-margin*2)/boundsH);
  document.documentElement.style.setProperty('--fit', String(s));

  if(prevParallax){ parallaxOn=true; core.style.transform = prevTransform || 'translate(-50%, -50%)'; }
  requestAnimationFrame(()=> document.body.classList.remove('nofx'));
}
window.addEventListener('load', scheduleFit);
window.addEventListener('resize', scheduleFit, {passive:true});
window.addEventListener('orientationchange', scheduleFit);

/* ===== Helpers & logging ===== */
const $ = (sel) => document.querySelector(sel);
const logEl = $('#log');
function log(line){
  if(!logEl) return;
  const p = document.createElement('div');
  p.textContent = `[${new Date().toLocaleTimeString()}] ${line}`;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}
function getThemeRGB(){
  const v = getComputedStyle(document.documentElement).getPropertyValue('--cy-rgb').trim();
  return v || '0, 250, 255';
}

/* ===== Time & date ===== */
function pad(n){ return n.toString().padStart(2,'0'); }
function tick(){
  const d = new Date();
  $('#clock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  $('#dateLine').textContent = d.toLocaleDateString(undefined,{weekday:'short', month:'short', day:'2-digit', year:'numeric'});
}
tick(); setInterval(tick, 1000);

/* ===== Network ===== */
function rand(min,max){ return Math.random()*(max-min)+min; }
function updateNet(){
  $('#down').textContent = rand(45,180).toFixed(1);
  $('#up').textContent   = rand(10,35).toFixed(1);
  const ok = Math.random() > .12;
  const state = $('#netState');
  state.textContent = ok ? 'online' : 'packet loss';
  const theme = `rgb(${getThemeRGB()})`;
  state.style.borderColor = ok ? theme : '#ff6b6b';
  state.style.color = '#fff';
}
async function ping(){
  const t0 = performance.now();
  try{
    await fetch(location.href, {cache:'no-store', mode:'no-cors'});
    $('#lat').textContent = Math.max(1, performance.now()-t0).toFixed(0);
  }catch{ $('#lat').textContent = '—'; }
}
updateNet(); setInterval(updateNet, 2600);
ping(); setInterval(ping, 3000);

/* ===== Battery & FPS ===== */
const batPct=$('#batPct'), batBar=$('#batBar'), batState=$('#batState');
if('getBattery' in navigator){
  navigator.getBattery().then(b=>{
    function upd(){ const pct=Math.round(b.level*100); batPct.textContent=pct+'%'; batBar.style.width=pct+'%'; batState.textContent=b.charging?'(charging)':''; }
    b.addEventListener('levelchange',upd); b.addEventListener('chargingchange',upd); upd();
  }).catch(()=> batPct.textContent='n/a');
}else{ batPct.textContent='n/a'; }

let fps=0,frames=0,last=performance.now();
function raf(ts){ frames++; if(ts-last>=1000){ fps=frames; frames=0; last=ts; $('#fps').textContent=fps; } requestAnimationFrame(raf); }
requestAnimationFrame(raf);

/* ===== Parallax ===== */
let parallaxOn = true;
const coreEl = document.querySelector('.core');
window.addEventListener('mousemove', e=>{
  if(!parallaxOn) return;
  const x=(e.clientX/innerWidth - .5)*10, y=(e.clientY/innerHeight - .5)*-10;
  coreEl.style.transform = `translate(-50%, -50%) rotateX(${y}deg) rotateY(${x}deg)`;
},{passive:true});

/* ===== Stars ===== */
const stars=document.getElementById('stars'); const sctx=stars.getContext('2d'); let starOn=true;
function resizeStars(){ stars.width=innerWidth; stars.height=innerHeight; }
window.addEventListener('resize', resizeStars, {passive:true}); resizeStars();
const STAR_COUNT=160;
const pts=Array.from({length:STAR_COUNT},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,v:0.2+Math.random()*0.6,r:Math.random()*1.4+0.4}));
let starFill=`rgba(${getThemeRGB()}, .7)`, starGlow=`rgba(${getThemeRGB()}, .9)`;
function refreshStarColors(){ starFill=`rgba(${getThemeRGB()}, .7)`; starGlow=`rgba(${getThemeRGB()}, .9)`; }
function drawStars(){
  if(!starOn){ sctx.clearRect(0,0,stars.width,stars.height); return requestAnimationFrame(drawStars); }
  sctx.clearRect(0,0,stars.width,stars.height);
  for(const p of pts){
    p.x+=p.v; if(p.x>innerWidth){ p.x=-5; p.y=Math.random()*innerHeight; }
    sctx.beginPath(); sctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    sctx.fillStyle=starFill; sctx.shadowColor=starGlow; sctx.shadowBlur=8; sctx.fill(); sctx.shadowBlur=0;
  }
  requestAnimationFrame(drawStars);
}
drawStars();

/* ===== Mic visualizer ===== */
const micBtn=$('#micBtn'), micStatus=$('#micStatus'), micCanvas=$('#micCanvas'); const mctx=micCanvas.getContext('2d');
let micStream, analyser, dataArr, micActive=false;
function micBarColor(){ return `rgba(${getThemeRGB()}, .85)`; }
async function startMic(){
  try{
    micStream = await navigator.mediaDevices.getUserMedia({audio:true});
    const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    analyser=audioCtx.createAnalyser(); analyser.fftSize=256;
    audioCtx.createMediaStreamSource(micStream).connect(analyser);
    dataArr=new Uint8Array(analyser.frequencyBinCount); micActive=true;
    micStatus.textContent='listening…'; micBtn.textContent='Stop'; visualize(); log('Mic started');
  }catch(err){ micStatus.textContent='permission denied'; log('Mic error: '+err.message); }
}
function stopMic(){ micStream?.getTracks().forEach(t=>t.stop()); micActive=false; micBtn.textContent='Start'; micStatus.textContent='idle'; mctx.clearRect(0,0,micCanvas.width,micCanvas.height); log('Mic stopped'); }
function visualize(){
  if(!micActive) return;
  analyser.getByteFrequencyData(dataArr);
  mctx.clearRect(0,0,micCanvas.width,micCanvas.height);
  const w=micCanvas.width,h=micCanvas.height, barW=w/dataArr.length;
  mctx.fillStyle=micBarColor();
  for(let i=0;i<dataArr.length;i++){ const v=dataArr[i]/255, bh=v*h; mctx.fillRect(i*barW, h-bh, barW-1, bh); }
  requestAnimationFrame(visualize);
}
micBtn.addEventListener('click', ()=> micActive ? stopMic() : startMic());

/* ===== Demo log ===== */
const demoLines=['Initializing protocols…','Syncing subsystems…','Decrypting telemetry…','Thermal scan complete.','All systems nominal.','Monitoring network…'];
let idx=0; setInterval(()=>{ log(demoLines[idx++ % demoLines.length]); }, 2200);

/* ===== Controls (show/hide) ===== */
const controlsPanel = document.getElementById('controls-panel');
const ctrlBtn = document.getElementById('ctrlToggleBtn');
ctrlBtn.addEventListener('click', ()=>{ toggleControls(); scheduleFit(); });
function toggleControls(){
  const hidden = controlsPanel.classList.toggle('hidden');
  ctrlBtn.setAttribute('aria-expanded', String(!hidden));
  log(hidden ? 'Controls hidden' : 'Controls shown');
}

/* ===== UI toggles ===== */
$('#tgGrid').addEventListener('change', e => { toggleGrid(e.target.checked); scheduleFit(); });
$('#tgScan').addEventListener('change', e => { toggleScan(e.target.checked); scheduleFit(); });
$('#tgParallax').addEventListener('change', e => { toggleParallax(e.target.checked); });
$('#tgStars').addEventListener('change', e => { toggleStars(e.target.checked); });

function toggleGrid(on){ document.querySelector('.grid').style.display = on ? '' : 'none'; $('#tgGrid').checked = on; }
function toggleScan(on){ document.querySelector('.scan').style.display = on ? '' : 'none'; $('#tgScan').checked = on; }
function toggleParallax(on){ parallaxOn = on; if(!on){ coreEl.style.transform = 'translate(-50%, -50%)'; } $('#tgParallax').checked = on; }
function toggleStars(on){ starOn = on; if(!on){ sctx.clearRect(0,0,stars.width,stars.height); } $('#tgStars').checked = on; }

/* ===== Morphing Alert (cyan <-> red) ===== */
let alertOn=false;
const label = document.getElementById('centerLabel');
const morphTargets = [document.getElementById('stars'), document.querySelector('.grid'), document.querySelector('.scan'), document.querySelector('.hud')];
morphTargets.forEach(el => el?.classList.add('morph-target'));

const MORPH_MS = 950;

function setAlert(on){
  if(on === alertOn) return;

  // 1) start morph
  document.body.classList.remove('morphing-to-cyan','morphing-to-red');
  document.body.classList.add(on ? 'morphing-to-red' : 'morphing-to-cyan');

  // 2) update label text immediately so it morphs with everything
  if(on){
    label.dataset.text='TERATRON';
    label.innerHTML='TERATRON';
    label.classList.add('glitch');
    log('ALERT morph → TERATRON');
  }else{
    label.classList.remove('glitch');
    label.dataset.text='ULTRA HD 4K';
    label.innerHTML='ULTRA&nbsp;HD&nbsp;4K';
    log('ALERT morph → ULTRA HD 4K');
  }

  // 3) after morph completes, flip the theme variables and clear the hue-rotate
  setTimeout(()=>{
    alertOn = on;
    document.body.classList.toggle('alert', alertOn);
    refreshStarColors();          // update canvas colors to new theme
    document.body.classList.remove('morphing-to-cyan','morphing-to-red');
    scheduleFit();                // keep perfect centering after label swap
  }, MORPH_MS);
}
function toggleAlert(){ setAlert(!alertOn); }

/* ===== Radar & Log ===== */
const radar = document.getElementById('radar');
let radarPaused=false;
function toggleRadar(){ radarPaused=!radarPaused; radar.classList.toggle('paused',radarPaused); log(radarPaused?'Radar: paused':'Radar: running'); }

const logWidget = document.getElementById('logWidget');
function toggleLog(){ logWidget.classList.toggle('hidden'); scheduleFit(); }
function clearLog(){ logEl.innerHTML=''; log('Log cleared'); }

/* ===== Fullscreen ===== */
function toggleFullscreen(){ if(!document.fullscreenElement){ document.documentElement.requestFullscreen?.(); } else { document.exitFullscreen?.(); } }

/* ===== Help overlay ===== */
const help = document.getElementById('help');
const helpClose = document.getElementById('helpClose');
helpClose?.addEventListener('click', ()=> help.classList.toggle('hidden') );

/* ===== Keybinds ===== */
function isTyping(e){ const tag=(e.target?.tagName||'').toLowerCase(); return tag==='input'||tag==='textarea'||e.target?.isContentEditable; }
window.addEventListener('keydown', (e)=>{
  if (isTyping(e)) return;
  const key=e.key.toLowerCase();
  if([' ','spacebar','f'].includes(key)) e.preventDefault();
  switch(key){
    case ' ': case 'a': toggleAlert(); break;
    case 'c': toggleControls(); break;
    case 'g': toggleGrid(document.querySelector('.grid').style.display==='none'); break;
    case 's': toggleScan(document.querySelector('.scan').style.display==='none'); break;
    case 'p': toggleParallax(!parallaxOn); break;
    case 't': toggleStars(!starOn); break;
    case 'm': micActive ? stopMic() : startMic(); break;
    case 'l': toggleLog(); break;
    case 'k': clearLog(); break;
    case 'r': toggleRadar(); break;
    case 'f': toggleFullscreen(); break;
    case 'h': case '?': help?.classList.toggle('hidden'); break;
    default: return;
  }
});

/* ===== Boot ===== */
log('HUD online — press Space/A to morph theme');
scheduleFit();
