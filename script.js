/* ===== Real viewport height (mobile 100vh fix) ===== */
function setRealVh(){
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setRealVh();
window.addEventListener('resize', setRealVh, {passive:true});
window.addEventListener('orientationchange', setRealVh);

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

/* ===== Time & date ===== */
function pad(n){ return n.toString().padStart(2,'0'); }
function tick(){
  const d = new Date();
  const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  $('#clock').textContent = t;
  $('#dateLine').textContent = d.toLocaleDateString(undefined,{
    weekday:'short', month:'short', day:'2-digit', year:'numeric'
  });
}
tick(); setInterval(tick, 1000);

/* ===== Fake throughput + real latency ===== */
function rand(min,max){ return Math.random()*(max-min)+min; }
function updateNet(){
  $('#down').textContent = rand(45, 180).toFixed(1);
  $('#up').textContent   = rand(10, 35).toFixed(1);
  const ok = Math.random() > .12;
  const state = $('#netState');
  state.textContent = ok ? 'online' : 'packet loss';
  state.style.borderColor = state.style.color = ok ? 'var(--cy)' : '#ff6b6b';
}
async function ping(){
  const t0 = performance.now();
  try {
    await fetch(window.location.href, { cache:'no-store', mode:'no-cors' });
    const dt = Math.max(1, performance.now() - t0);
    $('#lat').textContent = dt.toFixed(0);
  } catch {
    $('#lat').textContent = '—';
  }
}
updateNet(); setInterval(updateNet, 2600);
ping(); setInterval(ping, 3000);

/* ===== Battery & FPS ===== */
const batPct = $('#batPct'), batBar = $('#batBar'), batState = $('#batState');
if ('getBattery' in navigator){
  navigator.getBattery().then(b => {
    function upd(){
      const pct = Math.round(b.level * 100);
      batPct.textContent = pct + '%';
      batBar.style.width = pct + '%';
      batState.textContent = b.charging ? '(charging)' : '';
    }
    b.addEventListener('levelchange', upd);
    b.addEventListener('chargingchange', upd);
    upd();
  }).catch(()=> batPct.textContent = 'n/a');
} else {
  batPct.textContent = 'n/a';
}

let fps = 0, frames = 0, last = performance.now();
function raf(ts){
  frames++;
  if (ts - last >= 1000){
    fps = frames; frames = 0; last = ts;
    $('#fps').textContent = fps;
  }
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/* ===== Parallax on core (toggleable) ===== */
let parallaxOn = true;
const core = document.querySelector('.core');
window.addEventListener('mousemove', e=>{
  if(!parallaxOn) return;
  const { innerWidth:w, innerHeight:h } = window;
  const x = (e.clientX / w - .5) * 10;
  const y = (e.clientY / h - .5) * -10;
  core.style.transform = `translate(-50%, -50%) rotateX(${y}deg) rotateY(${x}deg)`;
},{passive:true});

/* ===== Stars particle field ===== */
const stars = document.getElementById('stars');
const sctx = stars.getContext('2d');
let starOn = true;
function resizeStars(){
  stars.width = innerWidth; stars.height = innerHeight;
}
window.addEventListener('resize', resizeStars, {passive:true});
resizeStars();

const STAR_COUNT = 160;
const pts = Array.from({length:STAR_COUNT}, ()=>({
  x: Math.random()*innerWidth,
  y: Math.random()*innerHeight,
  v: 0.2 + Math.random()*0.6,
  r: Math.random()*1.4+0.4
}));
function drawStars(){
  if (!starOn) { sctx.clearRect(0,0,stars.width,stars.height); requestAnimationFrame(drawStars); return; }
  sctx.clearRect(0,0,stars.width,stars.height);
  for(const p of pts){
    p.x += p.v; if (p.x > innerWidth) { p.x = -5; p.y = Math.random()*innerHeight; }
    sctx.beginPath(); sctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    sctx.fillStyle = 'rgba(0,250,255,.7)';
    sctx.shadowColor = 'rgba(0,250,255,.9)';
    sctx.shadowBlur = 8;
    sctx.fill(); sctx.shadowBlur = 0;
  }
  requestAnimationFrame(drawStars);
}
drawStars();

/* ===== Mic visualizer ===== */
const micBtn = $('#micBtn'), micStatus = $('#micStatus'), micCanvas = $('#micCanvas');
const mctx = micCanvas.getContext('2d');
let micStream, analyser, dataArr, micActive=false;

async function startMic(){
  try{
    micStream = await navigator.mediaDevices.getUserMedia({audio:true});
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const src = audioCtx.createMediaStreamSource(micStream);
    src.connect(analyser);
    dataArr = new Uint8Array(analyser.frequencyBinCount);
    micActive = true;
    micStatus.textContent = 'listening…';
    micBtn.textContent = 'Stop';
    visualize();
    log('Mic started');
  }catch(err){
    micStatus.textContent = 'permission denied';
    log('Mic error: ' + err.message);
  }
}
function stopMic(){
  micStream?.getTracks().forEach(t=>t.stop());
  micActive=false; micBtn.textContent = 'Start'; micStatus.textContent='idle';
  mctx.clearRect(0,0,micCanvas.width,micCanvas.height);
  log('Mic stopped');
}
function visualize(){
  if(!micActive) return;
  analyser.getByteFrequencyData(dataArr);
  mctx.clearRect(0,0,micCanvas.width,micCanvas.height);
  const w = micCanvas.width, h = micCanvas.height;
  const barW = w / dataArr.length;
  for(let i=0;i<dataArr.length;i++){
    const v = dataArr[i]/255;
    const bh = v*h;
    mctx.fillStyle = 'rgba(0,250,255,.8)';
    mctx.fillRect(i*barW, h-bh, barW-1, bh);
  }
  requestAnimationFrame(visualize);
}
micBtn.addEventListener('click', ()=> micActive ? stopMic() : startMic());

/* ===== Console auto feed ===== */
const demoLines = [
  'Initializing protocols…', 'Syncing subsystems…', 'Decrypting telemetry…',
  'Thermal scan complete.', 'All systems nominal.', 'Monitoring network…'
];
let idx=0; setInterval(()=>{ log(demoLines[idx++ % demoLines.length]); }, 2200);

/* ===== Controls (show/hide panel) ===== */
const controlsPanel = document.getElementById('controls-panel');
const ctrlBtn = document.getElementById('ctrlToggleBtn');
ctrlBtn.addEventListener('click', toggleControls);
function toggleControls(){
  const hidden = controlsPanel.classList.toggle('hidden');
  ctrlBtn.setAttribute('aria-expanded', String(!hidden));
  log(hidden ? 'Controls hidden' : 'Controls shown');
}

/* ===== Toggles via UI checkboxes ===== */
$('#tgGrid').addEventListener('change', e => toggleGrid(e.target.checked));
$('#tgScan').addEventListener('change', e => toggleScan(e.target.checked));
$('#tgParallax').addEventListener('change', e => toggleParallax(e.target.checked));
$('#tgStars').addEventListener('change', e => toggleStars(e.target.checked));

/* ===== Alert (TERATRON) ===== */
let alertOn = false;
const redveil = document.getElementById('redveil');
const label = document.getElementById('centerLabel');
function setAlert(on){
  alertOn = on;
  document.body.classList.toggle('alert', alertOn);
  redveil.style.transitionDuration = alertOn ? '3s' : '1.6s';
  if(alertOn){
    label.dataset.text = 'TERATRON';
    label.innerHTML = 'TERATRON';
    label.classList.add('glitch');
    log('ALERT mode: TERATRON');
  } else {
    label.classList.remove('glitch');
    label.dataset.text = 'ULTRA HD 4K';
    label.innerHTML = 'ULTRA&nbsp;HD&nbsp;4K';
    log('ALERT mode off');
  }
}
function toggleAlert(){ setAlert(!alertOn); }

/* ===== Grid / Scan / Parallax / Stars ===== */
function toggleGrid(on){ document.querySelector('.grid').style.display = on ? '' : 'none'; $('#tgGrid').checked = on; }
function toggleScan(on){ document.querySelector('.scan').style.display = on ? '' : 'none'; $('#tgScan').checked = on; }
function toggleParallax(on){ parallaxOn = on; if(!on){ core.style.transform = 'translate(-50%, -50%)'; } $('#tgParallax').checked = on; }
function toggleStars(on){ starOn = on; if(!on){ sctx.clearRect(0,0,stars.width,stars.height); } $('#tgStars').checked = on; }

/* ===== Radar pause/resume ===== */
const radar = document.getElementById('radar');
let radarPaused = false;
function toggleRadar(){
  radarPaused = !radarPaused;
  radar.classList.toggle('paused', radarPaused);
  log(radarPaused ? 'Radar: paused' : 'Radar: running');
}

/* ===== Console log visibility & clear ===== */
const logWidget = document.getElementById('logWidget');
function toggleLog(){ logWidget.classList.toggle('hidden'); }
function clearLog(){ logEl.innerHTML = ''; log('Log cleared'); }

/* ===== Fullscreen ===== */
function toggleFullscreen(){
  if (!document.fullscreenElement){
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

/* ===== Help overlay ===== */
const help = document.getElementById('help');
const helpClose = document.getElementById('helpClose');
helpClose.addEventListener('click', toggleHelp);
function toggleHelp(){ help.classList.toggle('hidden'); }

/* ===== Keyboard bindings ===== */
function isTyping(e){
  const tag = (e.target?.tagName || '').toLowerCase();
  const editable = e.target?.isContentEditable;
  return tag === 'input' || tag === 'textarea' || editable;
}
window.addEventListener('keydown', (e)=>{
  if (isTyping(e)) return;

  const key = e.key.toLowerCase();

  // prevent page scroll for Space and others
  const needsPrevent = [' ', 'spacebar', 'f'];
  if (needsPrevent.includes(e.key.toLowerCase())) e.preventDefault();

  switch (key){
    case ' ': case 'a': toggleAlert(); break;        // Space / A
    case 'c': toggleControls(); break;               // Controls
    case 'g': toggleGrid(document.querySelector('.grid').style.display === 'none'); break;
    case 's': toggleScan(document.querySelector('.scan').style.display === 'none'); break;
    case 'p': toggleParallax(!parallaxOn); break;
    case 't': toggleStars(!starOn); break;
    case 'm': micActive ? stopMic() : startMic(); break;
    case 'l': toggleLog(); break;
    case 'k': clearLog(); break;
    case 'r': toggleRadar(); break;
    case 'f': toggleFullscreen(); break;
    case 'h': case '?': toggleHelp(); break;
    default: return;
  }
});

/* ===== First log ===== */
log('HUD online — press H or ? for keybinds');
