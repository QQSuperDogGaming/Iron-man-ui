/* ===== Real viewport height ===== */
function setRealVh(){ const vh=innerHeight*0.01; document.documentElement.style.setProperty('--vh', vh+'px'); }
setRealVh(); addEventListener('resize', setRealVh, {passive:true}); addEventListener('orientationchange', setRealVh);

/* ===== Auto-fit (stable center & scale) ===== */
let fitRaf=0;
function scheduleFit(){ if(fitRaf) cancelAnimationFrame(fitRaf); fitRaf=requestAnimationFrame(autoFit); }
function autoFit(){
  const root=document.querySelector('.hud'); if(!root) return;
  document.body.classList.add('nofx');
  const core=document.querySelector('.core');
  const prevParallax=parallaxOn, prevTransform=core.style.transform;
  parallaxOn=false; core.style.transform='translate(-50%,-50%)';
  document.documentElement.style.setProperty('--fit','1');
  const nodes=[...root.querySelectorAll('.core, .widget:not(.hidden)')];
  let minL=Infinity,minT=Infinity,maxR=-Infinity,maxB=-Infinity;
  nodes.forEach(n=>{ const r=n.getBoundingClientRect(); minL=Math.min(minL,r.left); minT=Math.min(minT,r.top); maxR=Math.max(maxR,r.right); maxB=Math.max(maxB,r.bottom); });
  const boundsW=Math.max(1,maxR-minL), boundsH=Math.max(1,maxB-minT);
  const s=Math.min(1,(innerWidth-32)/boundsW,(innerHeight-32)/boundsH);
  document.documentElement.style.setProperty('--fit', String(s));
  if(prevParallax){ parallaxOn=true; core.style.transform=prevTransform||'translate(-50%,-50%)'; }
  requestAnimationFrame(()=> document.body.classList.remove('nofx'));
}
addEventListener('load', scheduleFit);
addEventListener('resize', scheduleFit, {passive:true});
addEventListener('orientationchange', scheduleFit);

/* ===== Helpers & log ===== */
const $=sel=>document.querySelector(sel);
const logEl=$('#log');
function log(t){ if(!logEl) return; const d=document.createElement('div'); d.textContent='['+new Date().toLocaleTimeString()+'] '+t; logEl.appendChild(d); logEl.scrollTop=logEl.scrollHeight; }
function getThemeRGB(){ const v=getComputedStyle(document.documentElement).getPropertyValue('--cy-rgb').trim(); return v||'0, 250, 255'; }

/* ===== Time ===== */
function pad(n){return n.toString().padStart(2,'0')}
function tick(){ const d=new Date(); $('#clock').textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); $('#dateLine').textContent=d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'2-digit',year:'numeric'}); }
tick(); setInterval(tick,1000);

/* ===== Network + Latency ===== */
function rand(a,b){return Math.random()*(b-a)+a}
function updateNet(){ $('#down').textContent=rand(45,180).toFixed(1); $('#up').textContent=rand(10,35).toFixed(1);
  const ok=Math.random()>.12; const s=$('#netState'); s.textContent=ok?'online':'packet loss';
  const theme='rgb('+getThemeRGB()+')'; s.style.borderColor=ok?theme:'#ff6b6b'; s.style.color='#fff';
}
async function ping(){ const t0=performance.now(); try{ await fetch(location.href,{cache:'no-store',mode:'no-cors'}); $('#lat').textContent=Math.max(1,performance.now()-t0).toFixed(0); }catch{ $('#lat').textContent='—'; } }
updateNet(); setInterval(updateNet,2600); ping(); setInterval(ping,3000);

/* ===== Battery & FPS (bar always visible) ===== */
const batPct=$('#batPct'), batBar=$('#batBar'), batState=$('#batState'), batWrap=$('#batBarWrap');
if('getBattery' in navigator){
  navigator.getBattery().then(b=>{
    function upd(){
      const pct=Math.round(b.level*100);
      batPct.textContent=pct+'%';
      batBar.style.width=pct+'%';
      if(b.charging){
        batWrap.classList.add('indeterminate');
        batState.textContent='(charging)';
      }else{
        batWrap.classList.remove('indeterminate');
        batState.textContent='';
      }
    }
    b.addEventListener('levelchange',upd);
    b.addEventListener('chargingchange',upd);
    upd();
  }).catch(()=>{
    batPct.textContent='n/a';
    batWrap.classList.add('indeterminate');
  });
}else{
  batPct.textContent='n/a';
  batWrap.classList.add('indeterminate');
}
let fps=0,frames=0,last=performance.now();
function raf(ts){ frames++; if(ts-last>=1000){ fps=frames; frames=0; last=ts; $('#fps').textContent=fps; } requestAnimationFrame(raf); }
requestAnimationFrame(raf);

/* ===== Parallax ===== */
let parallaxOn=true; const coreEl=document.querySelector('.core');
addEventListener('mousemove',e=>{ if(!parallaxOn) return; const x=(e.clientX/innerWidth-.5)*10, y=(e.clientY/innerHeight-.5)*-10; coreEl.style.transform='translate(-50%,-50%) rotateX('+y+'deg) rotateY('+x+'deg)'; },{passive:true});

/* ===== Stars ===== */
const stars=$('#stars'); const sctx=stars.getContext('2d'); let starOn=true;
function resizeStars(){ stars.width=innerWidth; stars.height=innerHeight; }
addEventListener('resize',resizeStars,{passive:true}); resizeStars();
const STAR_COUNT=160; const pts=Array.from({length:STAR_COUNT},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,v:0.2+Math.random()*0.6,r:Math.random()*1.4+0.4}));
let starFill='rgba('+getThemeRGB()+', .7)', starGlow='rgba('+getThemeRGB()+', .9)'; function refreshStarColors(){ starFill='rgba('+getThemeRGB()+', .7)'; starGlow='rgba('+getThemeRGB()+', .9)'; }
function drawStars(){ if(!starOn){ sctx.clearRect(0,0,stars.width,stars.height); return requestAnimationFrame(drawStars); } sctx.clearRect(0,0,stars.width,stars.height);
  for(const p of pts){ p.x+=p.v; if(p.x>innerWidth){ p.x=-5; p.y=Math.random()*innerHeight; } sctx.beginPath(); sctx.arc(p.x,p.y,p.r,0,Math.PI*2); sctx.fillStyle=starFill; sctx.shadowColor=starGlow; sctx.shadowBlur=8; sctx.fill(); sctx.shadowBlur=0; }
  requestAnimationFrame(drawStars);
} drawStars();

/* ===== Mic visualizer ===== */
const micBtn=$('#micBtn'), micStatus=$('#micStatus'), micCanvas=$('#micCanvas'); const mctx=micCanvas?.getContext?.('2d');
let micStream, analyser, dataArr, micActive=false;
function micBarColor(){ return 'rgba('+getThemeRGB()+', .85)'; }
async function startMic(){
  try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:true});
    const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    analyser=audioCtx.createAnalyser(); analyser.fftSize=256;
    audioCtx.createMediaStreamSource(micStream).connect(analyser);
    dataArr=new Uint8Array(analyser.frequencyBinCount); micActive=true;
    if(micStatus) micStatus.textContent='listening…'; if(micBtn) micBtn.textContent='Stop';
    visualize(); log('Mic started');
  }catch(err){
    if(micStatus) micStatus.textContent='permission denied';
    log('Mic error: '+err.message);
  }
}
function stopMic(){
  micStream?.getTracks().forEach(t=>t.stop());
  micActive=false;
  if(micBtn) micBtn.textContent='Start';
  if(micStatus) micStatus.textContent='idle';
  mctx?.clearRect(0,0,micCanvas.width,micCanvas.height);
  log('Mic stopped');
}
function visualize(){
  if(!micActive||!mctx) return;
  analyser.getByteFrequencyData(dataArr);
  mctx.clearRect(0,0,micCanvas.width,micCanvas.height);
  const w=micCanvas.width,h=micCanvas.height,bw=w/dataArr.length;
  mctx.fillStyle=micBarColor();
  for(let i=0;i<dataArr.length;i++){
    const v=dataArr[i]/255,bh=v*h;
    mctx.fillRect(i*bw, h-bh, bw-1, bh);
  }
  requestAnimationFrame(visualize);
}
micBtn?.addEventListener('click', ()=> micActive ? stopMic() : startMic());

/* ===== Controls & toggles ===== */
const controlsPanel=$('#controls-panel'), ctrlBtn=$('#ctrlToggleBtn');
ctrlBtn?.addEventListener('click', ()=>{ toggleControls(); scheduleFit(); });
function toggleControls(){ if(!controlsPanel||!ctrlBtn) return; const hidden=controlsPanel.classList.toggle('hidden'); ctrlBtn.setAttribute('aria-expanded', String(!hidden)); log(hidden?'Controls hidden':'Controls shown'); }
const gridEl=$('.grid'), scanEl=$('.scan');
$('#tgGrid')?.addEventListener('change', e=>{ toggleGrid(e.target.checked); scheduleFit(); });
$('#tgScan')?.addEventListener('change', e=>{ toggleScan(e.target.checked); scheduleFit(); });
$('#tgParallax')?.addEventListener('change', e=>{ toggleParallax(e.target.checked); });
$('#tgStars')?.addEventListener('change', e=>{ toggleStars(e.target.checked); });
function toggleGrid(on){ if(gridEl){ gridEl.style.display=on?'':'none'; } const cb=$('#tgGrid'); if(cb) cb.checked=on; }
function toggleScan(on){ if(scanEl){ scanEl.style.display=on?'':'none'; } const cb=$('#tgScan'); if(cb) cb.checked=on; }
function toggleParallax(on){ parallaxOn=on; if(!on){ coreEl.style.transform='translate(-50%,-50%)'; } const cb=$('#tgParallax'); if(cb) cb.checked=on; }
function toggleStars(on){ starOn=on; if(!on){ sctx.clearRect(0,0,stars.width,stars.height); } const cb=$('#tgStars'); if(cb) cb.checked=on; }

/* ===== Alert morph with glitch ===== */
let alertOn=false; const label=$('#centerLabel'); const MORPH_MS=900;
function setAlert(on){
  if(on===alertOn) return; alertOn=on;

  // Brief glitch overlay
  const overlay=document.createElement('div'); overlay.className='screen-glitch'; document.body.appendChild(overlay);

  // Swap label so it fades with theme
  if(on){ label.dataset.text='TERATRON'; label.innerHTML='TERATRON'; label.classList.add('glitch'); log('Alert → TERATRON'); }
  else{ label.classList.remove('glitch'); label.dataset.text='ULTRA HD 4K'; label.innerHTML='ULTRA&nbsp;HD&nbsp;4K'; log('Alert → ULTRA HD 4K'); }

  // Flip theme variables (direct cross-fade via CSS)
  document.body.classList.toggle('alert', alertOn);

  // Cleanup
  setTimeout(()=>{ overlay.remove(); refreshStarColors(); scheduleFit(); }, MORPH_MS);
}
function toggleAlert(){ setAlert(!alertOn); }

/* ===== Radar & log helpers ===== */
const radar=$('#radar'); let radarPaused=false;
function toggleRadar(){ radarPaused=!radarPaused; radar?.classList.toggle('paused',radarPaused); log(radarPaused?'Radar: paused':'Radar: running'); }
const logWidget=$('#logWidget'); function toggleLog(){ logWidget?.classList.toggle('hidden'); scheduleFit(); }
function clearLog(){ if(logEl){ logEl.innerHTML=''; log('Log cleared'); } }

/* ===== Fullscreen ===== */
function toggleFullscreen(){ if(!document.fullscreenElement){ document.documentElement.requestFullscreen?.(); } else { document.exitFullscreen?.(); } }

/* ===== Keybinds ===== */
function isTyping(e){ const t=(e.target?.tagName||'').toLowerCase(); return t==='input'||t==='textarea'||e.target?.isContentEditable; }
addEventListener('keydown', e=>{
  if(isTyping(e)) return;
  const k=e.key.toLowerCase();
  if([' ','spacebar','f'].includes(k)) e.preventDefault();
  switch(k){
    case ' ': case 'a': toggleAlert(); break;
    case 'c': toggleControls(); scheduleFit(); break;
    case 'g': toggleGrid(gridEl?.style.display==='none'); scheduleFit(); break;
    case 's': toggleScan(scanEl?.style.display==='none'); scheduleFit(); break;
    case 'p': toggleParallax(!parallaxOn); break;
    case 't': toggleStars(!starOn); break;
    case 'm': micActive ? stopMic() : startMic(); break;
    case 'l': toggleLog(); break;
    case 'k': clearLog(); break;
    case 'r': toggleRadar(); break;
    case 'f': toggleFullscreen(); break;
    default: return;
  }
});

/* ===== Boot ===== */
log('HUD online — separated files loaded. Space/A for alert, C to toggle controls.');
scheduleFit();
