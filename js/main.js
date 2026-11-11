// Arranque, controles y pantallas de HORA DORADA.
import { Partida, horaTexto } from './juego.js';
import { Pintor } from './dibujo.js';
import { Sonido } from './audio.js';
import { NIVELES } from './niveles.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const pintor = new Pintor($('lienzo'));
let estado = 'titulo';
let partida = new Partida(0, { demo: true });
partida.jugador.x = 13.5; partida.jugador.y = 8.5;
let indice = 0;

// ---------- Progreso guardado ----------
function leerProgreso() {
  let p = null;
  try { p = JSON.parse(localStorage.getItem('horaDorada.progreso')); } catch (e) { /* nada */ }
  p = p || {};
  return { desbloqueado: p.desbloqueado || 1, estrellas: p.estrellas || [], puntajes: p.puntajes || [], vioHistoria: !!p.vioHistoria };
}
function guardarProgreso(p) { try { localStorage.setItem('horaDorada.progreso', JSON.stringify(p)); } catch (e) { /* nada */ } }
let progreso = leerProgreso();
if (params.has('todo')) progreso.desbloqueado = NIVELES.length;

// ---------- Pantallas ----------
const PANTALLAS = ['titulo', 'niveles', 'intro', 'pausa', 'resultado', 'ayuda', 'vestuario', 'historia'];
function mostrar(nombre) {
  for (const p of PANTALLAS) $('p-' + p).classList.toggle('visible', p === nombre);
  $('hud').classList.toggle('oculto', !['jugando', 'pausa', 'intro', 'resultado'].includes(nombre === null ? 'jugando' : nombre));
}

function irATitulo() {
  estado = 'titulo';
  partida = new Partida(0, { demo: true });
  partida.jugador.x = 13.5; partida.jugador.y = 8.5;
  Sonido.musica('dia');
  mostrar('titulo');
}

function irANiveles() {
  estado = 'niveles';
  const cont = $('lista-niveles');
  cont.innerHTML = '';
  NIVELES.forEach((n, i) => {
    const b = document.createElement('button');
    const bloqueado = i + 1 > progreso.desbloqueado;
    const est = progreso.estrellas[i] || 0;
    b.className = 'tarjeta-nivel' + (bloqueado ? ' bloqueado' : '') + (n.tipo === 'noche' ? ' noche' : '');
    const rec = progreso.puntajes[i];
    b.innerHTML = `<span class="num">${i + 1}</span><b>${bloqueado ? '???' : n.nombre}</b><span class="est">${'★'.repeat(est)}${'☆'.repeat(3 - est)}</span><small>${n.tipo === 'noche' ? '🌙 Noche' : '☀️ Día'}${rec ? ' · ' + rec.toLocaleString('es-MX') + ' pts' : ''}</small>`;
    b.disabled = bloqueado;
    b.addEventListener('click', () => { Sonido.sfx('clic'); if (i === 0 && !progreso.vioHistoria) abrirHistoria(() => abrirIntro(0)); else abrirIntro(i); });
    cont.appendChild(b);
  });
  const totalEst = progreso.estrellas.reduce((s, e) => s + (e || 0), 0);
  const totalPts = progreso.puntajes.reduce((s, e) => s + (e || 0), 0);
  $('resumen-niveles').textContent = `★ ${totalEst} de ${NIVELES.length * 3} · ${totalPts.toLocaleString('es-MX')} puntos en total`;
  mostrar('niveles');
}

function abrirIntro(i) {
  indice = i;
  partida = new Partida(i);
  estado = 'intro';
  $('intro-num').textContent = `Nivel ${i + 1} de ${NIVELES.length}`;
  $('intro-nombre').textContent = NIVELES[i].nombre;
  $('intro-pista').textContent = NIVELES[i].pista;
  $('hud-pista').textContent = NIVELES[i].pista;
  Sonido.musica(partida.noche ? 'noche' : 'dia');
  actualizarHUD();
  mostrar('intro');
}

function comenzar() {
  Sonido.iniciar();
  estado = 'jugando';
  mostrar(null);
}

function pausar() {
  if (estado !== 'jugando') return;
  estado = 'pausa';
  Sonido.relojSonando(false);
  mostrar('pausa');
}
function reanudar() { if (estado === 'pausa') { estado = 'jugando'; mostrar(null); } }
function reiniciar() { abrirIntro(indice); comenzar(); }

function mostrarResultado() {
  estado = 'resultado';
  Sonido.relojSonando(false);
  const gano = partida.estado === 'ganado';
  $('res-titulo').textContent = gano ? '¡Las flores despertaron!' : 'Oh no...';
  $('res-titulo').className = gano ? 'gano' : 'perdio';
  if (gano) {
    const e = partida.estrellas;
    $('res-estrellas').textContent = '★'.repeat(e) + '☆'.repeat(3 - e);
    const recurso = partida.noche ? `Vela restante: ${Math.round(partida.vela)} s` : `Arena restante: ${Math.round(partida.arena / partida.arenaMax * 100)} %`;
    $('res-texto').textContent = `${recurso} · Tiempo: ${Math.floor(partida.tiempo / 60)}:${String(Math.floor(partida.tiempo % 60)).padStart(2, '0')}`;
    const record = progreso.puntajes[indice] || 0;
    const nuevo = partida.puntaje > record;
    $('res-desglose').innerHTML = partida.desglose.filter(f => f[2] !== 0 || typeof f[1] === 'string').map(f => `<div><span>${f[0]}</span><small>${f[1]}</small><b>${f[2] > 0 ? '+' : ''}${f[2].toLocaleString('es-MX')}</b></div>`).join('') +
      `<div class="total"><span>TOTAL</span><small>${nuevo ? '¡Nuevo récord!' : 'Récord: ' + record.toLocaleString('es-MX')}</small><b>${partida.puntaje.toLocaleString('es-MX')}</b></div>`;
    $('res-desglose').classList.remove('oculto');
    progreso.puntajes[indice] = Math.max(record, partida.puntaje);
    const antesEst = progreso.estrellas.reduce((s2, x) => s2 + (x || 0), 0);
    progreso.estrellas[indice] = Math.max(progreso.estrellas[indice] || 0, e);
    const despuesEst = progreso.estrellas.reduce((s2, x) => s2 + (x || 0), 0);
    const nuevaRopa = VESTIMENTAS.find(v => v.estrellas > antesEst && v.estrellas <= despuesEst);
    if (nuevaRopa) setTimeout(() => aviso(`¡Desbloqueaste una vestimenta: ${nuevaRopa.nombre}!`), 400);
    progreso.desbloqueado = Math.max(progreso.desbloqueado, Math.min(NIVELES.length, indice + 2));
    guardarProgreso(progreso);
    const ultimo = indice === NIVELES.length - 1;
    $('b-siguiente').classList.toggle('oculto', ultimo);
    $('res-final').classList.toggle('oculto', !ultimo);
  } else {
    $('res-estrellas').textContent = '';
    $('res-texto').textContent = partida.motivo;
    $('res-desglose').classList.add('oculto');
    $('b-siguiente').classList.add('oculto');
    $('res-final').classList.add('oculto');
  }
  $('b-repetir').textContent = gano ? 'Repetir' : 'Reintentar';
  mostrar('resultado');
}

// ---------- Vestuario (se desbloquea con estrellas) ----------
const VESTIMENTAS = [
  { id: 'hoja', nombre: 'Hojita', estrellas: 0, desc: 'La hoja con la que nació Gno.' },
  { id: 'sombrero', nombre: 'Sombrero de palma', estrellas: 6, desc: 'Para el sol de mediodía.' },
  { id: 'paliacate', nombre: 'Paliacate', estrellas: 12, desc: 'Rojo con puntitos blancos.' },
  { id: 'corona', nombre: 'Corona de flores', estrellas: 20, desc: 'Hecha con flores de luna.' },
  { id: 'farolito', nombre: 'Farolito', estrellas: 30, desc: 'Una lucecita para las noches.' },
];
function leerVestimenta() { try { return localStorage.getItem('horaDorada.vestimenta') || 'hoja'; } catch (e) { return 'hoja'; } }
pintor.vestimenta = leerVestimenta();
function irAVestuario() {
  estado = 'vestuario';
  const total = progreso.estrellas.reduce((s, e) => s + (e || 0), 0);
  $('vestuario-estrellas').textContent = `Tienes ★ ${total}`;
  const cont = $('lista-vestuario');
  cont.innerHTML = '';
  for (const v of VESTIMENTAS) {
    const libre = total >= v.estrellas || params.has('todo');
    const b = document.createElement('button');
    b.className = 'tarjeta-ropa' + (pintor.vestimenta === v.id ? ' puesta' : '') + (libre ? '' : ' bloqueado');
    b.disabled = !libre;
    b.innerHTML = `<canvas width="120" height="120"></canvas><b>${v.nombre}</b><small>${libre ? v.desc : '🔒 Necesitas ★ ' + v.estrellas}</small>`;
    b.addEventListener('click', () => {
      pintor.vestimenta = v.id;
      try { localStorage.setItem('horaDorada.vestimenta', v.id); } catch (e) { /* nada */ }
      Sonido.sfx('clic');
      irAVestuario();
    });
    cont.appendChild(b);
    pintor.retrato(b.querySelector('canvas'), v.id, libre);
  }
  mostrar('vestuario');
}

// ---------- Historia (introducción) ----------
const VINETAS = [[20, 20], [435, 20], [850, 20], [20, 320], [435, 320], [850, 320]];
const HISTORIA = [
  [0, 'Narrador', 'Hace mucho que las flores de luna no abren. El desierto se está quedando a oscuras.'],
  [1, 'Narrador', 'Pero entre las ruinas, la vieja aguja del reloj de sol sigue marcando la hora…'],
  [2, 'Gno', '¿Eh? ¿Dónde estoy? ¿Por qué mi sombra brilla?'],
  [3, 'Narrador', 'Tu sombra guarda un poco de la noche, Gno. Llévala hasta las flores.'],
  [4, 'Gno', '¿Y si mi sombra no alcanza?'],
  [4, 'Narrador', 'Mueve el sol. Para eso tienes la arena de tu reloj.'],
  [5, 'Gno', '¡Entonces vamos a despertar el desierto!'],
];
let pasoHistoria = 0, alTerminarHistoria = null;
function abrirHistoria(despues) {
  estado = 'historia';
  pasoHistoria = 0;
  alTerminarHistoria = despues || irATitulo;
  mostrarPasoHistoria();
  mostrar('historia');
}
function mostrarPasoHistoria() {
  const [v, quien, texto] = HISTORIA[pasoHistoria];
  $('historia-vineta').setAttribute('viewBox', `${VINETAS[v][0]} ${VINETAS[v][1]} 390 230`);
  $('historia-quien').textContent = quien;
  $('historia-quien').className = quien === 'Gno' ? 'gno' : '';
  $('historia-texto').textContent = texto;
  $('b-historia-sig').textContent = pasoHistoria === HISTORIA.length - 1 ? '¡A jugar!' : 'Siguiente ▶';
}
function avanzarHistoria() {
  Sonido.sfx('clic');
  if (pasoHistoria < HISTORIA.length - 1) { pasoHistoria++; mostrarPasoHistoria(); }
  else terminarHistoria();
}
function terminarHistoria() {
  progreso.vioHistoria = true;
  guardarProgreso(progreso);
  const fn = alTerminarHistoria; alTerminarHistoria = null;
  if (fn) fn();
}

// ---------- HUD ----------
const hud = {};
for (const id of ['hud-nivel', 'hud-sol', 'hud-hora', 'hud-arena', 'hud-arena-txt', 'hud-vidas', 'hud-flores', 'hud-puntos', 'hud-barra-dia', 'hud-etq-recurso', 'hud-pista', 'aviso']) hud[id] = $(id);
let cacheHUD = {};
function poner(id, valor, prop = 'textContent') {
  if (cacheHUD[id + prop] === valor) return;
  cacheHUD[id + prop] = valor;
  if (prop === 'textContent') hud[id].textContent = valor; else hud[id].style[prop] = valor;
}
function actualizarHUD() {
  const P = partida;
  poner('hud-nivel', `${indice + 1}. ${P.def.nombre}`);
  hud['hud-barra-dia'].classList.toggle('noche', P.noche);
  if (P.noche) {
    poner('hud-sol', '50%', 'left');
    poner('hud-hora', 'Noche');
    poner('hud-etq-recurso', '🕯️ Vela');
    const f = P.velaMax ? P.vela / P.velaMax : 0;
    poner('hud-arena', `scaleX(${f.toFixed(3)})`, 'transform');
    poner('hud-arena-txt', `${Math.ceil(P.vela)} s`);
  } else {
    poner('hud-sol', `${(P.t * 100).toFixed(1)}%`, 'left');
    poner('hud-hora', horaTexto(P.t));
    poner('hud-etq-recurso', '⏳ Arena');
    const f = P.arenaMax ? P.arena / P.arenaMax : 0;
    poner('hud-arena', `scaleX(${f.toFixed(3)})`, 'transform');
    poner('hud-arena-txt', `${Math.round(f * 100)} %`);
  }
  poner('hud-vidas', '♥'.repeat(Math.max(0, P.jugador.vida)) + '♡'.repeat(Math.max(0, 3 - P.jugador.vida)));
  poner('hud-flores', `${P.flores.filter(f => f.abierta).length} / ${P.flores.length}`);
  poner('hud-puntos', P.puntos.toLocaleString('es-MX'));
  hud['hud-barra-dia'].classList.toggle('nublado', !!P.jugadorBajoNube);
}

let avisoTimer = null;
function aviso(texto) {
  hud.aviso.textContent = texto;
  hud.aviso.classList.add('visible');
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => hud.aviso.classList.remove('visible'), 2600);
}

// ---------- Controles ----------
const teclas = new Set();
const entrada = { x: 0, y: 0, atrasar: false, adelantar: false, estirar: false, usar: false };
const toque = { x: 0, y: 0, atrasar: false, adelantar: false, estirar: false };
addEventListener('keydown', e => {
  const c = e.code;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) e.preventDefault();
  teclas.add(c);
  if (e.repeat) return;
  Sonido.iniciar();
  if (c === 'KeyM') { actualizarBotonSonido(Sonido.alternarMudo()); return; }
  if (estado === 'titulo' && (c === 'Enter' || c === 'Space')) { Sonido.sfx('clic'); irANiveles(); }
  else if ((estado === 'niveles' || estado === 'vestuario') && c === 'Escape') irATitulo();
  else if (estado === 'historia') { if (c === 'Enter' || c === 'Space') avanzarHistoria(); else if (c === 'Escape') terminarHistoria(); }
  else if (estado === 'intro' && (c === 'Enter' || c === 'Space')) comenzar();
  else if (estado === 'jugando') {
    if (c === 'Escape' || c === 'KeyP') pausar();
    else if (c === 'KeyR') reiniciar();
    else if (c === 'KeyF' || c === 'Enter') entrada.usar = true;
  } else if (estado === 'pausa') {
    if (c === 'Escape' || c === 'KeyP') reanudar();
    else if (c === 'KeyR') reiniciar();
  } else if (estado === 'resultado') {
    if (c === 'Enter' || c === 'Space') { if (partida.estado === 'ganado' && indice < NIVELES.length - 1) abrirIntro(indice + 1); else reiniciar(); }
    else if (c === 'KeyR') reiniciar();
  }
});
addEventListener('keyup', e => teclas.delete(e.code));
addEventListener('blur', () => { teclas.clear(); if (estado === 'jugando') pausar(); });
lienzoRueda();
function lienzoRueda() {
  let rueda = 0, tRueda = null;
  $('lienzo').addEventListener('wheel', e => {
    if (estado !== 'jugando') return;
    rueda = Math.sign(e.deltaY);
    clearTimeout(tRueda);
    tRueda = setTimeout(() => { rueda = 0; }, 140);
  }, { passive: true });
  Object.defineProperty(entrada, 'rueda', { get: () => rueda });
}

function leerEntrada() {
  const t = k => teclas.has(k);
  entrada.x = (t('KeyD') || t('ArrowRight') ? 1 : 0) - (t('KeyA') || t('ArrowLeft') ? 1 : 0) + toque.x;
  entrada.y = (t('KeyS') || t('ArrowDown') ? 1 : 0) - (t('KeyW') || t('ArrowUp') ? 1 : 0) + toque.y;
  entrada.atrasar = t('KeyQ') || toque.atrasar || entrada.rueda < 0;
  entrada.adelantar = t('KeyE') || toque.adelantar || entrada.rueda > 0;
  entrada.estirar = t('Space') || toque.estirar;
}

// Táctil
const esTactil = matchMedia('(pointer: coarse)').matches || params.has('tactil');
if (esTactil) document.body.classList.add('tactil');
const zona = $('zona-joy'), base = $('joy-base'), palanca = $('joy-palanca');
let dedo = null;
zona.addEventListener('pointerdown', e => {
  dedo = { id: e.pointerId, x: e.clientX, y: e.clientY };
  const r = zona.getBoundingClientRect();
  base.style.left = (e.clientX - r.left) + 'px'; base.style.top = (e.clientY - r.top) + 'px'; base.style.bottom = 'auto';
  zona.setPointerCapture(e.pointerId);
  Sonido.iniciar();
});
zona.addEventListener('pointermove', e => {
  if (!dedo || e.pointerId !== dedo.id) return;
  let dx = e.clientX - dedo.x, dy = e.clientY - dedo.y;
  const d = Math.hypot(dx, dy), max = 46;
  if (d > max) { dx *= max / d; dy *= max / d; }
  toque.x = dx / max; toque.y = dy / max;
  palanca.style.transform = `translate(${dx}px, ${dy}px)`;
});
const soltar = e => { if (dedo && e.pointerId === dedo.id) { dedo = null; toque.x = toque.y = 0; palanca.style.transform = ''; } };
zona.addEventListener('pointerup', soltar);
zona.addEventListener('pointercancel', soltar);
document.querySelectorAll('.bt').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); Sonido.iniciar(); if (k === 'usar') entrada.usar = true; else if (k === 'pausa') pausar(); else toque[k] = true; };
  const off = e => { e.preventDefault(); if (k in toque) toque[k] = false; };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off);
  b.addEventListener('pointercancel', off);
});

// ---------- Botones ----------
const clic = (id, fn) => $(id).addEventListener('click', () => { Sonido.iniciar(); Sonido.sfx('clic'); fn(); });
clic('b-jugar', irANiveles);
clic('b-ayuda', () => mostrar('ayuda'));
clic('b-vestuario', irAVestuario);
clic('b-historia', () => abrirHistoria(irATitulo));
$('b-historia-sig').addEventListener('click', () => { Sonido.iniciar(); avanzarHistoria(); });
$('b-historia-saltar').addEventListener('click', () => { Sonido.iniciar(); terminarHistoria(); });
clic('b-cerrar-vestuario', irATitulo);
clic('b-cerrar-ayuda', () => mostrar('titulo'));
clic('b-volver-titulo', irATitulo);
clic('b-comenzar', comenzar);
clic('b-continuar', reanudar);
clic('b-reiniciar', reiniciar);
clic('b-salir', irANiveles);
clic('b-siguiente', () => abrirIntro(indice + 1));
clic('b-repetir', reiniciar);
clic('b-res-niveles', irANiveles);
clic('b-sonido', () => actualizarBotonSonido(Sonido.alternarMudo()));
function actualizarBotonSonido(m) { $('b-sonido').textContent = m ? '🔇 Sin sonido' : '🔊 Sonido'; }
actualizarBotonSonido(Sonido.estaMudo());
document.addEventListener('pointerdown', () => Sonido.iniciar(), { once: true });
addEventListener('resize', () => pintor.ajustar());

// ---------- Bucle ----------
let anterior = performance.now(), reloj = 0;
let yaAviso = {};
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, (ahora - anterior) / 1000);
  anterior = ahora;
  reloj += dt;
  leerEntrada();
  if (estado === 'jugando' || estado === 'titulo' || estado === 'niveles' || estado === 'ayuda' || estado === 'vestuario' || estado === 'historia') {
    partida.actualizar(dt, entrada);
  } else if (estado === 'resultado' || estado === 'esperando') partida.actualizarParticulas(dt);
  entrada.usar = false;
  if (estado === 'jugando') {
    Sonido.relojSonando(partida.usandoReloj !== 0, partida.usandoReloj > 0);
    for (const ev of partida.eventos) {
      if (ev.tipo === 'todas') aviso('¡Todas las flores abrieron! El reloj de sol te espera ☀️');
      if (ev.tipo === 'sello') aviso('¡El sello lunar se rompió!');
      if (ev.tipo === 'reloj') aviso(partida.noche ? '+20 s de vela' : '+2 s de arena del reloj');
      if (ev.tipo === 'puerta' && ev.datos && ev.datos.solar && ev.datos.abierta && !yaAviso.solar) { yaAviso.solar = true; aviso('¡Mediodía! Las puertas solares están abiertas'); }
    }
    partida.eventos.length = 0;
    if (!partida.noche && partida.arena <= 0 && (entrada.atrasar || entrada.adelantar) && !yaAviso.arena) { yaAviso.arena = true; aviso('Se acabó la arena del reloj: el sol sigue solo'); }
    if (partida.noche && (entrada.atrasar || entrada.adelantar) && !yaAviso.noche) { yaAviso.noche = true; aviso('De noche no hay sol: usa los faroles (F)'); }
    actualizarHUD();
    if (partida.estado !== 'jugando') setTimeout(mostrarResultado, 900), estado = 'esperando';
  } else partida.eventos.length = 0;
  pintor.dibujar(partida, reloj);
}
requestAnimationFrame(bucle);
mostrar('titulo');
document.getElementById('cargando').classList.add('listo');

if (params.has('debug')) window.HD = { get partida() { return partida; }, abrirIntro, comenzar, pintor, NIVELES, Partida };
