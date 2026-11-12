// Arranque, controles y pantallas de HORA DORADA.
import { Partida, horaTexto, RUMBO_ARRIBA, VENTAJAS } from './juego.js';
import { Pintor } from './dibujo.js';
import { Sonido } from './audio.js';
import { NIVELES } from './niveles.js';
import { cargarSprites, IMG } from './sprites.js';
import { Voz } from './voz.js';
import { Historia } from './historia.js';
import { icono, vigilarIconos } from './iconos.js';
import { Mundo3D } from './mundo3d.js';
import { Controles, ACCIONES, teclaHTML, nombreTecla } from './controles.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const pintor = new Pintor($('lienzo'));
// Mundo 3D (Three.js). Si el navegador no tiene WebGL, se usa el dibujo 2D.
let mundo = null;
try { mundo = new Mundo3D($('lienzo3d'), pintor); $('lienzo').classList.add('oculto'); }
catch (e) { console.warn('Sin WebGL: se usa la vista 2D', e); $('lienzo3d').classList.add('oculto'); }
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
const PANTALLAS = ['titulo', 'niveles', 'intro', 'pausa', 'resultado', 'ayuda', 'vestuario', 'historia', 'controles'];
function mostrar(nombre) {
  for (const p of PANTALLAS) $('p-' + p).classList.toggle('visible', p === nombre);
  $('hud').classList.toggle('oculto', !['jugando', 'pausa', 'intro', 'resultado'].includes(nombre === null ? 'jugando' : nombre));
}

function irATitulo() {
  estado = 'titulo';
  partida = new Partida(0, { demo: true });
  partida.jugador.x = 13.5; partida.jugador.y = 8.5;
  Sonido.musica('titulo');
  mostrar('titulo');
}

function irANiveles() {
  estado = 'niveles';
  Sonido.musica('titulo');
  const cont = $('lista-niveles');
  cont.innerHTML = '';
  NIVELES.forEach((n, i) => {
    const b = document.createElement('button');
    const bloqueado = i + 1 > progreso.desbloqueado;
    const est = progreso.estrellas[i] || 0;
    const rec = progreso.puntajes[i];
    b.className = 'nes-btn tarjeta-nivel' + (bloqueado ? ' is-disabled' : n.tipo === 'noche' ? ' is-primary' : '');
    b.innerHTML = `<span class="num">${i + 1}</span><b>${bloqueado ? '???' : n.nombre}</b><span>${estrellasHTML(est)}</span><small>${icono(n.tipo === 'noche' ? 'moon' : 'sun')} ${n.tipo === 'noche' ? 'Noche' : 'Día'}${rec ? ' · ' + rec.toLocaleString('es-MX') + ' pts' : ''}</small>`;
    b.disabled = bloqueado;
    b.addEventListener('click', () => { Sonido.sfx('clic'); if (i === 0 && !progreso.vioHistoria) abrirHistoria(() => abrirIntro(0)); else abrirIntro(i); });
    cont.appendChild(b);
  });
  const totalEst = progreso.estrellas.reduce((s, e) => s + (e || 0), 0);
  const totalPts = progreso.puntajes.reduce((s, e) => s + (e || 0), 0);
  $('resumen-niveles').innerHTML = `<i class="nes-icon star is-small"></i> ${totalEst} de ${NIVELES.length * 3} · ${totalPts.toLocaleString('es-MX')} puntos en total`;
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
  Sonido.musica(NIVELES[i].musica || (partida.noche ? 'noche' : 'dia'));
  // Evento y reto de este intento (salen al azar en cada intento)
  $('intro-extra').innerHTML = partida.evento ? `<span>${icono('zap')} <b>Evento:</b> ${partida.evento.nombre}. ${partida.evento.desc}.</span><span>${icono('trophy')} <b>Reto:</b> ${partida.reto.nombre} (+${partida.reto.bono} pts).</span><span>${icono('gift')} Busca las <b>ventajas</b> que aparecen en el mapa.</span>` : '';
  // En el primer nivel siempre se muestran los controles y Gno los dice en voz alta.
  $('intro-controles').classList.toggle('oculto', i !== 0);
  if (i === 0) Voz.decir(textoControles(), 'Gno', Controles.esPorDefecto() ? 'controles' : 'controles_otros');
  else Voz.decir(`Nivel ${i + 1}: ${NIVELES[i].nombre}. ${NIVELES[i].pista}`, 'Narrador', 'nivel' + (i + 1));
  actualizarHUD();
  mostrar('intro');
}

function comenzar() {
  Sonido.iniciar();
  Voz.callar();
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
// El nivel 1 siempre vuelve a mostrar los controles; los demás reinician directo.
function reiniciar() { abrirIntro(indice); if (indice !== 0) comenzar(); }

function mostrarResultado() {
  estado = 'resultado';
  Sonido.relojSonando(false);
  const gano = partida.estado === 'ganado';
  $('res-titulo').textContent = gano ? '¡Las flores despertaron!' : 'Oh no...';
  $('res-titulo').className = gano ? 'gano' : 'perdio';
  if (gano) {
    const e = partida.estrellas;
    $('res-estrellas').innerHTML = estrellasHTML(e, false);
    if (indice === NIVELES.length - 1) Sonido.musica('final');
    Voz.decir(e === 3 ? '¡Tres estrellas! ¡Qué bonito brillan!' : '¡Lo logramos!', 'Gno', e === 3 ? 'gano3' : 'gano');
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
    $('res-estrellas').innerHTML = '';
    $('res-texto').textContent = partida.motivo;
    Voz.decir('¡Oh, no! ¡Otra vez!', 'Gno', 'perdio');
    $('res-desglose').classList.add('oculto');
    $('b-siguiente').classList.add('oculto');
    $('res-final').classList.add('oculto');
  }
  $('b-repetir').innerHTML = `${icono('reload')} ${gano ? 'Repetir' : 'Reintentar'}`;
  mostrar('resultado');
}

// ---------- Vestuario (se desbloquea con estrellas) ----------
const VESTIMENTAS = [
  { id: 'hoja', nombre: 'Gno de fuego', estrellas: 0, desc: 'La flamita del reloj de sol.' },
  { id: 'sombrero', nombre: 'Sombrero de palma', estrellas: 6, desc: 'Para el sol de mediodía.' },
  { id: 'paliacate', nombre: 'Paliacate', estrellas: 12, desc: 'Rojo, para cruzar el desierto.' },
  { id: 'corona', nombre: 'Flor en el pelo', estrellas: 20, desc: 'Una flor de luna de adorno.' },
  { id: 'farolito', nombre: 'Espíritu de luz', estrellas: 30, desc: 'Brilla aunque sea de noche.' },
];
function leerVestimenta() { try { return localStorage.getItem('horaDorada.vestimenta') || 'hoja'; } catch (e) { return 'hoja'; } }
pintor.vestimenta = leerVestimenta();
function irAVestuario() {
  estado = 'vestuario';
  const total = progreso.estrellas.reduce((s, e) => s + (e || 0), 0);
  $('vestuario-estrellas').innerHTML = `Tienes <i class="nes-icon star is-small"></i> ${total}`;
  const cont = $('lista-vestuario');
  cont.innerHTML = '';
  for (const v of VESTIMENTAS) {
    const libre = total >= v.estrellas || params.has('todo');
    const b = document.createElement('button');
    b.className = 'nes-btn tarjeta-ropa' + (pintor.vestimenta === v.id ? ' is-warning' : '') + (libre ? '' : ' is-disabled');
    b.disabled = !libre;
    b.innerHTML = `<canvas width="96" height="96"></canvas><b>${v.nombre}</b><small>${libre ? v.desc : 'Necesitas ' + v.estrellas + ' estrellas'}</small>`;
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

// ---------- Historia (escenas con sprites; ver js/historia.js) ----------
const historia = new Historia($('historia-lienzo'));
let alTerminarHistoria = null;
function abrirHistoria(despues) {
  estado = 'historia';
  alTerminarHistoria = despues || irATitulo;
  Sonido.musica('historia');
  mostrar('historia');
  historia.abrir();
  actualizarBotonHistoria();
}
function actualizarBotonHistoria() {
  $('b-historia-sig').innerHTML = historia.esUltima() ? `${icono('play')} ¡A jugar!` : `Siguiente ${icono('chevron-right')}`;
}
function avanzarHistoria() {
  Sonido.sfx('clic');
  if (historia.avanzar()) actualizarBotonHistoria();
  else terminarHistoria();
}
function terminarHistoria() {
  historia.cerrar();
  progreso.vioHistoria = true;
  guardarProgreso(progreso);
  const fn = alTerminarHistoria; alTerminarHistoria = null;
  if (fn) fn();
}

// ---------- Controles en pantalla (teclas = sprites del paquete Ninja Adventure; se pueden reasignar) ----------
const GRUPOS = [
  [['arriba', 'izquierda', 'abajo', 'derecha'], 'Caminar'],
  [['atrasar', 'adelantar'], 'Regresar / adelantar el sol (gasta arena)'],
  [['girarIzq', 'girarDer'], 'Girar la cámara alrededor del mundo: tu sombra cae hacia otro lado'],
  [['altura'], 'Subir o bajar la cámara'],
  [['estirar'], 'Estirarte: tu sombra crece'],
  [['saltar'], 'Saltar a plataformas y mesetas'],
  [['usar'], 'Prender o apagar un farol'],
  [['reiniciar', 'pausa', 'sonido'], 'Reiniciar / pausa / sonido'],
];
function pintarListasControles() {
  const html = GRUPOS.map(([acc, txt]) => `<span class="teclas">${acc.map(x => teclaHTML(Controles.teclas(x)[0])).join('')}</span><span>${txt}</span>`).join('');
  for (const cont of document.querySelectorAll('.controles')) cont.innerHTML = html;
}
pintarListasControles();
// Texto de los controles para la voz (si el jugador cambió las teclas, se arma con las suyas).
function textoControles() {
  const k = x => Controles.teclas(x).map(nombreTecla)[0] || 'sin tecla';
  return `¡Hola! Soy Gno. Camino con ${k('arriba')}, ${k('izquierda')}, ${k('abajo')} y ${k('derecha')}. Con ${k('atrasar')} y ${k('adelantar')} muevo el sol. Con ${k('girarIzq')} y ${k('girarDer')} giro la cámara alrededor del mundo para que mi sombra caiga hacia otro lado. Con ${k('saltar')} salto a las plataformas, y con ${k('usar')} prendo los faroles. ¡Vamos!`;
}

// ---------- Pantalla para cambiar los controles ----------
let esperandoTecla = null, volverDeControles = null;
function irAControles(volver) {
  volverDeControles = volver;
  estado = 'controles';
  esperandoTecla = null;
  pintarTablaControles();
  mostrar('controles');
}
function pintarTablaControles() {
  const filas = ACCIONES.map(([a, nombre]) => {
    const t = Controles.mapa()[a];
    const boton = i => {
      const esperando = esperandoTecla && esperandoTecla.a === a && esperandoTecla.i === i;
      return `<button class="nes-btn chico ${esperando ? 'is-warning' : ''}" data-accion="${a}" data-i="${i}">${esperando ? 'Presiona…' : teclaHTML(t[i])}</button>`;
    };
    return `<span>${nombre}</span>${boton(0)}${boton(1)}`;
  }).join('');
  $('tabla-controles').innerHTML = filas;
  for (const b of $('tabla-controles').querySelectorAll('button')) {
    b.addEventListener('click', () => { Sonido.sfx('clic'); esperandoTecla = { a: b.dataset.accion, i: +b.dataset.i }; pintarTablaControles(); });
  }
}
function capturarTecla(e) {
  if (!esperandoTecla) return false;
  e.preventDefault();
  const { a, i } = esperandoTecla;
  if (e.code === 'Escape') { /* cancelar */ }
  else if (e.code === 'Backspace' || e.code === 'Delete') Controles.borrar(a, i);
  else Controles.asignar(a, i, e.code);
  esperandoTecla = null;
  Sonido.sfx('placa');
  pintarTablaControles();
  pintarListasControles();
  return true;
}

function estrellasHTML(n, chico = true) {
  const c = chico ? ' is-small' : '';
  return `<i class="nes-icon star${c}"></i>`.repeat(n) + `<i class="nes-icon star is-empty${c}"></i>`.repeat(3 - n);
}
function alturaCamara() {
  if (mundo && estado === 'jugando') aviso(mundo.alternarAltura() ? 'Cámara alta: ves todo el nivel' : 'Cámara baja: más 3D, sigue a Gno');
}
function girar(d) {
  if (estado !== 'jugando') return;
  if (partida.girarCamara(d)) {
    if (mundo) mundo.girar(d); else pintor.iniciarGiro(d);
    aviso(`Cámara: ${['norte', 'oeste', 'sur', 'este'][partida.vista]} arriba`);
  }
}

// ---------- HUD ----------
const hud = {};
for (const id of ['hud-nivel', 'hud-efectos', 'hud-hora', 'hud-arena', 'hud-arena-txt', 'hud-vidas', 'hud-flores', 'hud-puntos', 'hud-vista', 'hud-etq-recurso', 'hud-pista', 'aviso']) hud[id] = $(id);
let cacheHUD = {};
function poner(id, valor, prop = 'textContent') {
  if (cacheHUD[id + prop] === valor) return;
  cacheHUD[id + prop] = valor;
  if (prop === 'textContent') hud[id].textContent = valor;
  else if (prop === 'innerHTML') hud[id].innerHTML = valor;
  else if (prop === 'value') hud[id].value = valor;
  else if (prop === 'icono') hud[id].dataset.icono = valor;
  else hud[id].style[prop] = valor;
}
function actualizarHUD() {
  const P = partida;
  poner('hud-nivel', `${indice + 1}. ${P.def.nombre}`);
  if (P.noche) {
    poner('hud-hora', 'Noche');
    poner('hud-etq-recurso', `${icono('lightbulb')} Vela`, 'innerHTML');
    const f = P.velaMax ? P.vela / P.velaMax : 0;
    poner('hud-arena', Math.round(f * 100), 'value');
    poner('hud-arena-txt', `${Math.ceil(P.vela)} s`);
  } else {
    poner('hud-hora', horaTexto(P.t));
    poner('hud-etq-recurso', `${icono('hourglass')} Arena`, 'innerHTML');
    const f = P.arenaMax ? P.arena / P.arenaMax : 0;
    poner('hud-arena', Math.round(f * 100), 'value');
    poner('hud-arena-txt', `${Math.round(f * 100)} %`);
  }
  const vida = Math.max(0, Math.min(3, P.jugador.vida));
  poner('hud-vidas', '<i class="nes-icon heart is-small"></i>'.repeat(vida) + '<i class="nes-icon heart is-small is-empty"></i>'.repeat(3 - vida), 'innerHTML');
  poner('hud-flores', `${P.flores.filter(f => f.abierta).length} / ${P.flores.length}`);
  poner('hud-puntos', P.puntos.toLocaleString('es-MX'));
  poner('hud-vista', ['Norte', 'Oeste', 'Sur', 'Este'][P.vista || 0]);
  poner('hud-efectos', Object.entries(P.efectos || {}).map(([k, s]) => `<span class="efecto nes-container is-dark is-rounded"><img src="assets/sprites/ventajas/${k}.png" alt=""> ${VENTAJAS[k].nombre} ${Math.ceil(s)} s</span>`).join(''), 'innerHTML');
  dibujarCielo(P);
  dibujarReloj(P);
}

// ---------- Cielo con el sol (o la luna) y reloj de manecillas ----------
const cielo = $('hud-cielo').getContext('2d'), relojHUD = $('hud-reloj').getContext('2d');
function dibujarCielo(P) {
  const g = cielo, W = 180, H = 44, t = Math.min(1, Math.max(0, P.t));
  g.imageSmoothingEnabled = false;
  const dia = !P.noche, orilla = t < 0.12 || t > 0.88;
  g.fillStyle = !dia ? '#0b0f22' : P.t > 0.95 ? '#4a2c4a' : orilla ? '#f29a6a' : '#6cc4f0'; g.fillRect(0, 0, W, H);
  if (!dia) { g.fillStyle = '#fff'; for (let k = 0; k < 14; k++) g.fillRect((k * 53) % W, (k * 29) % (H - 12), 1, 1); }
  // Camino del sol (punteado) y horizonte de arena del paquete
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let k = 0; k <= 20; k++) { const a = Math.PI * k / 20; g.fillRect(W / 2 + Math.cos(a) * 76 - 1, H - 10 - Math.sin(a) * 26, 2, 2); }
  if (IMG.suelo) for (let x = 0; x < W; x += 16) g.drawImage(IMG.suelo, 16, 16, 16, 16, x, H - 9, 16, 9);
  // El sol sale por la derecha (como en el juego) y se pone por la izquierda
  const im = IMG[dia ? 'sol' : 'luna'];
  const x = dia ? W / 2 + Math.cos(Math.PI * t) * 76 : W / 2, y = dia ? H - 10 - Math.sin(Math.PI * t) * 26 : 14;
  if (im) { g.globalAlpha = dia && P.jugadorBajoNube ? 0.45 : 1; g.drawImage(im, Math.round(x - 10), Math.round(y - 10), 20, 20); g.globalAlpha = 1; }
}
function dibujarReloj(P) {
  const g = relojHUD, c = 22;
  // Minutos del día: de 6:00 a 19:00 con el sol; de noche avanza con la vela (19:00 a 5:00)
  const min = P.noche ? 19 * 60 + (1 - (P.velaMax ? P.vela / P.velaMax : 0)) * 600 : 6 * 60 + Math.min(1, Math.max(0, P.t)) * 13 * 60;
  g.clearRect(0, 0, 44, 44);
  g.fillStyle = '#212529'; g.beginPath(); g.arc(c, c, 21, 0, Math.PI * 2); g.fill();
  g.fillStyle = P.noche ? '#c9d2ff' : '#fff4dc'; g.beginPath(); g.arc(c, c, 18, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#212529';
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.fillRect(Math.round(c + Math.sin(a) * 15) - 1, Math.round(c - Math.cos(a) * 15) - 1, k % 3 ? 2 : 3, k % 3 ? 2 : 3); }
  const mano = (ang, largo, ancho, color) => { g.strokeStyle = color; g.lineWidth = ancho; g.lineCap = 'round'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(ang) * largo, c - Math.cos(ang) * largo); g.stroke(); };
  mano((min % 720) / 720 * Math.PI * 2, 9, 3, '#212529');
  mano((min % 60) / 60 * Math.PI * 2, 14, 2, '#e76e55');
  g.fillStyle = '#f7d51d'; g.fillRect(c - 2, c - 2, 4, 4);
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
const entrada = { x: 0, y: 0, atrasar: false, adelantar: false, estirar: false, usar: false, saltar: false };
const toque = { x: 0, y: 0, atrasar: false, adelantar: false, estirar: false };
addEventListener('keydown', e => {
  const c = e.code;
  if (estado === 'controles' && capturarTecla(e)) return;
  const acc = Controles.accionDe(c);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c) || (estado === 'jugando' && acc)) e.preventDefault();
  teclas.add(c);
  if (e.repeat) return;
  Sonido.iniciar();
  if (acc === 'sonido') { actualizarBotonSonido(Sonido.alternarMudo()); return; }
  if (estado === 'titulo' && (c === 'Enter' || c === 'Space')) { Sonido.sfx('clic'); irANiveles(); }
  else if ((estado === 'niveles' || estado === 'vestuario') && c === 'Escape') irATitulo();
  else if (estado === 'controles' && c === 'Escape') cerrarControles();
  else if (estado === 'historia') { if (c === 'Enter' || c === 'Space') avanzarHistoria(); else if (c === 'Escape') terminarHistoria(); }
  else if (estado === 'intro' && (c === 'Enter' || c === 'Space')) comenzar();
  else if (estado === 'jugando') {
    if (acc === 'pausa') pausar();
    else if (acc === 'reiniciar') reiniciar();
    else if (acc === 'usar') entrada.usar = true;
    else if (acc === 'saltar') entrada.saltar = true;
    else if (acc === 'altura') alturaCamara();
    else if (acc === 'girarIzq') girar(-1);
    else if (acc === 'girarDer') girar(1);
  } else if (estado === 'pausa') {
    if (acc === 'pausa' || c === 'Escape') reanudar();
    else if (acc === 'reiniciar') reiniciar();
  } else if (estado === 'resultado') {
    if (c === 'Enter' || c === 'Space') { if (partida.estado === 'ganado' && indice < NIVELES.length - 1) abrirIntro(indice + 1); else reiniciar(); }
    else if (acc === 'reiniciar') reiniciar();
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
  const t = a => Controles.pulsada(a, teclas);
  entrada.x = (t('derecha') ? 1 : 0) - (t('izquierda') ? 1 : 0) + toque.x;
  entrada.y = (t('abajo') ? 1 : 0) - (t('arriba') ? 1 : 0) + toque.y;
  entrada.atrasar = t('atrasar') || toque.atrasar || entrada.rueda < 0;
  entrada.adelantar = t('adelantar') || toque.adelantar || entrada.rueda > 0;
  entrada.estirar = t('estirar') || toque.estirar;
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
  const on = e => { e.preventDefault(); Sonido.iniciar(); if (k === 'usar') entrada.usar = true; else if (k === 'saltar') entrada.saltar = true; else if (k === 'altura') alturaCamara(); else if (k === 'girarIzq') girar(-1); else if (k === 'girarDer') girar(1); else if (k === 'pausa') pausar(); else toque[k] = true; };
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
clic('b-controles', () => irAControles('titulo'));
clic('b-controles-pausa', () => irAControles('pausa'));
clic('b-restablecer', () => { Controles.restablecer(); esperandoTecla = null; pintarTablaControles(); pintarListasControles(); });
clic('b-cerrar-controles', () => cerrarControles());
function cerrarControles() {
  esperandoTecla = null;
  if (volverDeControles === 'pausa') { estado = 'pausa'; mostrar('pausa'); } else irATitulo();
}
clic('b-menu', () => { Sonido.relojSonando(false); irATitulo(); });
clic('b-voz', () => actualizarBotonVoz(Voz.alternar()));
clic('b-siguiente', () => abrirIntro(indice + 1));
clic('b-repetir', reiniciar);
clic('b-res-niveles', irANiveles);
clic('b-sonido', () => actualizarBotonSonido(Sonido.alternarMudo()));
function actualizarBotonSonido(m) { $('b-sonido').innerHTML = m ? `${icono('volume-x')} Sin sonido` : `${icono('volume-3')} Sonido`; }
actualizarBotonSonido(Sonido.estaMudo());
function actualizarBotonVoz(a) { $('b-voz').innerHTML = a ? `${icono('message')} Voz` : `${icono('close')} Sin voz`; if (a) Voz.decir('¡Hola! Soy Gno.', 'Gno', 'hola'); }
$('b-voz').innerHTML = Voz.estaActiva() ? `${icono('message')} Voz` : `${icono('close')} Sin voz`;
if (!Voz.disponible) $('b-voz').classList.add('oculto');
document.addEventListener('pointerdown', () => Sonido.iniciar(), { once: true });
addEventListener('resize', () => { if (!mundo) pintor.ajustar(); });

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
  entrada.saltar = false;
  if (estado === 'jugando') {
    Sonido.relojSonando(partida.usandoReloj !== 0, partida.usandoReloj > 0);
    for (const ev of partida.eventos) {
      if (ev.tipo === 'todas') aviso('¡Todas las flores abrieron! El reloj de sol te espera ☀️');
      if (ev.tipo === 'sello') { aviso('¡El sello lunar se rompió!'); if (mundo) mundo.temblar(0.3); }
      if (ev.tipo === 'danio' && mundo) mundo.temblar(0.45);
      if (ev.tipo === 'ventaja') { const v = VENTAJAS[ev.datos.tipo]; aviso(`¡${v.nombre}! ${v.desc}`); }
      if (ev.tipo === 'ventajaFin') aviso(`Se acabó: ${VENTAJAS[ev.datos.tipo].nombre}`);
      if (ev.tipo === 'reloj') aviso(partida.noche ? '+20 s de vela' : '+2 s de arena del reloj');
      if (ev.tipo === 'puerta' && ev.datos && ev.datos.solar && ev.datos.abierta && !yaAviso.solar) { yaAviso.solar = true; aviso('¡Mediodía! Las puertas solares están abiertas'); }
    }
    partida.eventos.length = 0;
    if (!partida.noche && partida.arena <= 0 && (entrada.atrasar || entrada.adelantar) && !yaAviso.arena) { yaAviso.arena = true; aviso('Se acabó la arena del reloj: el sol sigue solo'); }
    if (partida.noche && (entrada.atrasar || entrada.adelantar) && !yaAviso.noche) { yaAviso.noche = true; aviso('De noche no hay sol: usa los faroles (F)'); }
    actualizarHUD();
    if (partida.estado !== 'jugando') setTimeout(mostrarResultado, 900), estado = 'esperando';
  } else partida.eventos.length = 0;
  if (mundo) mundo.dibujar(partida, reloj, dt, estado === 'titulo'); else pintor.dibujar(partida, reloj);
}
requestAnimationFrame(bucle);
mostrar('titulo');
Sonido.musica('titulo');
vigilarIconos();
// Los sprites se cargan antes de quitar la pantalla de "cargando".
cargarSprites().then(() => {
  pintor.listo = true;
  pintor.partidaCache = null;
  if (mundo) mundo.listo = true;
  document.getElementById('cargando').classList.add('listo');
});

if (params.has('debug')) window.HD = { get partida() { return partida; }, get mundo() { return mundo; }, abrirIntro, comenzar, pintor, NIVELES, Partida };
