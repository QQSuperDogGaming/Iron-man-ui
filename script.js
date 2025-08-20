// ===== Time & date =====
function pad(n){ return n.toString().padStart(2,'0'); }
function tick(){
  const d = new Date();
  const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  document.getElementById('clock').textContent = t;
  document.getElementById('dateLine').textContent =
    d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'2-digit', year:'numeric' });
}
tick();
setInterval(tick, 1000);

// ===== Fake network telemetry =====
function rand(min,max){ return Math.random()*(max-min)+min; }
function updateNet(){
  document.getElementById('down').textContent = rand(45, 180).toFixed(1);
  document.getElementById('up').textContent   = rand(10, 35).toFixed(1);

  const state = document.getElementById('netState');
  const ok = Math.random() > .12;
  state.textContent = ok ? 'online' : 'packet loss';
  state.style.borderColor = state.style.color = ok ? 'var(--cy)' : '#ff6b6b';
}
updateNet();
setInterval(updateNet, 2600);

// ===== Parallax effect on mouse =====
const core = document.querySelector('.core');
window.addEventListener('mousemove', (e)=>{
  const { innerWidth:w, innerHeight:h } = window;
  const x = (e.clientX / w - .5) * 10;
  const y = (e.clientY / h - .5) * -10;
  core.style.transform = `translate(-50%, -50%) rotateX(${y}deg) rotateY(${x}deg)`;
},{ passive:true });
