// Dibujo del nivel en un canvas 2D con sprites del paquete "Ninja Adventure" (CC0).
// Todo se dibuja en "casillas" (la transformación escala a pixeles). Las sombras y la luz se calculan aquí,
// pero las figuras (personaje, plantas, muros, objetos, efectos) son sprites; ver js/sprites.js.
import { IMG, R, MURO, MESETA, AGUA, ANIM, PERSONAJES, DIR, silueta, pintar } from './sprites.js';
import { MESETAS, ALTO_PLATAFORMA, dirAVista } from './juego.js';

const TEX = 16; // pixeles por casilla (igual que los tiles del paquete)
const COLOR_LETRA = { a: '#5ee0ff', b: '#ff8fc8', m: '#c9a8ff' };
const ICONO_LETRA = { a: R.letraA, b: R.letraB, m: R.ojoSello };
const COLOR_SOMBRA_OBJ = 'rgb(55,28,88)';
const COLOR_SOMBRA_GNO = 'rgb(48,18,82)';
const ZV = 0.6; // cuánto sube en pantalla cada unidad de altura (eje Z)

function aleatorio(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Envolvente convexa (monotone chain) para la sombra de los muros.
function envolvente(pts) {
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const p of pts) { while (lo.length >= 2 && cruz(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cruz(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  hi.pop(); lo.pop();
  return lo.concat(hi);
}

// Tinte de la luz según la hora.
const TINTES = [
  [0.00, [255, 110, 80], 0.32], [0.10, [255, 170, 110], 0.18], [0.28, [255, 235, 190], 0.06],
  [0.50, [255, 255, 255], 0.0], [0.72, [255, 220, 150], 0.07], [0.88, [255, 140, 70], 0.22], [1.00, [110, 60, 140], 0.42],
];
export function tinte(t) {
  for (let k = 0; k < TINTES.length - 1; k++) {
    const [t0, c0, a0] = TINTES[k], [t1, c1, a1] = TINTES[k + 1];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return { c: c0.map((v, i) => Math.round(v + (c1[i] - v) * f)), a: a0 + (a1 - a0) * f };
    }
  }
  return { c: TINTES[TINTES.length - 1][1], a: TINTES[TINTES.length - 1][2] };
}

// Cuartos de 8×8 de un tile con bordes (muros y agua) según qué vecinos son iguales.
function autotile(g, def, es, i, j, dx, dy, tam, conAbajo = true) {
  const h = tam / 2, im = IMG[def.img];
  if (!im) return;
  const izq = es(i - 1, j), der = es(i + 1, j), arr = es(i, j - 1), aba = es(i, j + 1);
  const xI = izq ? def.xCentroI : def.xIzq, xD = der ? def.xCentroD : def.xDer;
  const yA = arr ? def.yCentro : def.yArriba;
  const yB = conAbajo && !aba ? def.yAbajo : def.yCentro + 8;
  g.drawImage(im, xI, yA, 8, 8, dx, dy, h, h);
  g.drawImage(im, xD, yA, 8, 8, dx + h, dy, h, h);
  g.drawImage(im, xI, yB, 8, 8, dx, dy + h, h, h);
  g.drawImage(im, xD, yB, 8, 8, dx + h, dy + h, h, h);
}

// Vista del nivel según la cámara (k giros de 90°): un objeto con la misma forma que la partida,
// pero con el mapa y todas las posiciones giradas. Así el resto del dibujo no cambia: todo se dibuja "derecho".
function vistaDe(P, kForzado) {
  const k = ((kForzado ?? P.vista) || 0) & 3, W = P.w, H = P.h;
  const pos = (x, y) => k === 1 ? [H - y, x] : k === 2 ? [W - x, H - y] : k === 3 ? [y, W - x] : [x, y];
  const celdaMapa = (a, b) => k === 1 ? [b, H - 1 - a] : k === 2 ? [W - 1 - a, H - 1 - b] : k === 3 ? [W - 1 - b, a] : [a, b];
  const conv = o => { const [u, v] = pos(o.x, o.y); return Object.assign({}, o, { x: u, y: v }); };
  const V = { k, w: k % 2 ? H : W, h: k % 2 ? W : H, t: P.t, noche: P.noche, estado: P.estado, indice: P.indice };
  V.celda = (a, b) => (a < 0 || b < 0 || a >= V.w || b >= V.h) ? '#' : P.celda(...celdaMapa(a, b));
  V.alturaEn = (a, b) => P.alturaEn(...celdaMapa(a, b));
  V.flores = P.flores.map(conv);
  V.placas = P.placas.map(conv);
  V.faroles = P.faroles.map(conv);
  V.relojes = (P.relojes || []).map(conv);
  V.espejos = (P.espejos || []).map(conv);
  V.particulas = P.particulas.map(conv);
  V.salida = P.salida ? conv(P.salida) : null;
  V.plataformas = (P.plataformas || []).map(conv);
  V.ventajas = (P.ventajas || []).map(conv);
  V.jugador = conv(P.jugador);
  V.puertas = P.puertas.map(pu => { const c = conv(pu); c.i = Math.floor(c.x); c.j = Math.floor(c.y); return c; });
  V.rodadoras = (P.rodadoras || []).map(r => { const [u, v] = pos(r.x, r.y0); return Object.assign({}, r, { x: u, y: v + (r.y - r.y0), y0: v }); });
  V.destellos = P.destellos.map(d => {
    const c = conv(d), m = dirAVista(d.eje === 'h' ? d.dir : 0, d.eje === 'v' ? d.dir : 0, k);
    c.eje = Math.abs(m.dx) > Math.abs(m.dy) ? 'h' : 'v'; c.dir = Math.sign(c.eje === 'h' ? m.dx : m.dy) || 1;
    return c;
  });
  V.nubes = (P.nubes || []).map(n => { const [u, v] = pos(n.x, n.fila); return Object.assign({}, n, { x: u, fila: v, ancho: k % 2 ? n.alto : n.ancho, alto: k % 2 ? n.ancho : n.alto }); });
  V.sombras = P.sombras.map(s => { const [u, v] = pos(s.ox, s.oy), d = dirAVista(s.dx, s.dy, k); return { ox: u, oy: v, dx: d.dx, dy: d.dy, L: s.L }; });
  V.sol = P.sol ? Object.assign(dirAVista(P.sol.dx, P.sol.dy, k), { tanE: P.sol.tanE }) : null;
  V.farolCercano = () => { const f = P.farolCercano ? P.farolCercano() : null; return f ? conv(f) : null; };
  return V;
}

// Dirección del sprite de Gno según su "mirada" (dirección del control en pantalla). Con histéresis en diagonal.
export function direccionDe(j, actual) {
  const m = j.mirada;
  if (!m || !j.moviendo) return actual;
  const ax = Math.abs(m.x), ay = Math.abs(m.y);
  const sigue = (actual === DIR.derecha && m.x > 0.3) || (actual === DIR.izquierda && m.x < -0.3) || (actual === DIR.abajo && m.y > 0.3) || (actual === DIR.arriba && m.y < -0.3);
  if (sigue && Math.abs(ax - ay) < 0.35) return actual;
  return ax > ay ? (m.x > 0 ? DIR.derecha : DIR.izquierda) : (m.y > 0 ? DIR.abajo : DIR.arriba);
}

export class Pintor {
  // opciones.suelo = pixeles por casilla: el Pintor solo dibuja el piso (arena, placas y sombras) para el mundo 3D.
  constructor(canvas, opciones = {}) {
    this.modoSuelo = opciones.suelo || 0;
    this.canvas = canvas;
    this.ctxVisible = canvas.getContext('2d');
    this.ctx = this.ctxVisible;
    this.buffer = document.createElement('canvas');   // para animar el giro de cámara
    this.vw = 26; this.vh = 15;
    this.giro = null;
    this.capaSombra = document.createElement('canvas');
    this.capaNoche = document.createElement('canvas');
    this.partidaCache = null;
    this.vestimenta = 'hoja';
    this.margenArriba = 64;
    this.listo = false;          // se vuelve true cuando cargan los sprites
    this.dirGno = DIR.abajo;
    this.antes = null;
    this.ajustar();
  }

  ajustar() {
    if (this.modoSuelo) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    const w = Math.floor(innerWidth * dpr), h = Math.floor(innerHeight * dpr);
    for (const c of [this.canvas, this.capaSombra, this.capaNoche, this.buffer]) { c.width = w; c.height = h; }
    this.canvas.style.width = innerWidth + 'px';
    this.canvas.style.height = innerHeight + 'px';
    const arriba = this.margenArriba * dpr, abajo = 12 * dpr;
    this.esc = Math.min(w / this.vw, (h - arriba - abajo) / this.vh);
    this.ox = (w - this.vw * this.esc) / 2;
    this.oy = arriba + (h - arriba - abajo - this.vh * this.esc) / 2;
  }

  // Convierte coordenadas del mapa a pixeles CSS (para elementos HTML encima del canvas).
  aPantalla(x, y) { return { x: (this.ox + x * this.esc) / this.dpr, y: (this.oy + y * this.esc) / this.dpr }; }

  // El suelo se pinta una sola vez por nivel: arena, agua del oasis, caminos y detalles.
  prepararSuelo(P) {
    const c = document.createElement('canvas');
    c.width = P.w * TEX; c.height = P.h * TEX;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const al = aleatorio(P.indice * 977 + 13);
    for (let j = 0; j < P.h; j++) {
      for (let i = 0; i < P.w; i++) {
        const x = i * TEX, y = j * TEX;
        const v = al();
        pintar(g, v < 0.22 ? R.arenaVar[(al() * R.arenaVar.length) | 0] : R.arena, x, y, TEX, TEX);
        const ch = P.celda(i, j);
        if (ch === '.' && v > 0.975) pintar(g, al() < 0.5 ? R.ramita : R.piedrita, x, y, TEX, TEX);
        else if (ch === '.' && v > 0.971) pintar(g, R.hueso, x, y, TEX, TEX);
      }
    }
    const esAgua = (a, b) => { const c = P.celda(a, b); return c === 'w' || c === 'Y'; };
    for (let j = 0; j < P.h; j++) {
      for (let i = 0; i < P.w; i++) {
        const ch = P.celda(i, j);
        if (ch === 'w' || ch === 'Y') autotile(g, AGUA, esAgua, i, j, i * TEX, j * TEX, TEX);
        else if (ch === 'p') {
          // Camino: arena apisonada (más oscura) con piedritas
          pintar(g, R.arenaCamino, i * TEX, j * TEX, TEX, TEX);
          if (al() < 0.6) pintar(g, R.piedras[(al() * R.piedras.length) | 0], i * TEX + (al() - 0.5) * 6, j * TEX + (al() - 0.5) * 6, TEX, TEX);
        }
      }
    }
    this.suelo = c;
  }

  // Animación del giro de cámara: la vista nueva entra girando desde el ángulo anterior.
  iniciarGiro(d) { this.giro = { desde: -d * Math.PI / 2, t0: performance.now() }; }

  // Textura del piso para el mundo 3D (siempre con el norte arriba, sin objetos de pie).
  dibujarSuelo3D(Preal, reloj) {
    const P = vistaDe(Preal, 0), S = this.modoSuelo, w = P.w * S, h = P.h * S;
    if (this.canvas.width !== w || this.canvas.height !== h) for (const c of [this.canvas, this.capaSombra]) { c.width = w; c.height = h; }
    this.esc = S; this.ox = 0; this.oy = 0; this.dpr = 1;
    this.ctx = this.ctxVisible;
    if (!this.listo) return;
    if (this.partidaCache !== Preal) { this.prepararSuelo(P); this.partidaCache = Preal; }
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.drawImage(this.suelo, 0, 0, P.w, P.h);
    this.dibujarPlacasYBase(P, reloj);
    if (!P.noche) this.dibujarSombrasObjetos(P);
    this.dibujarSombrasJugador(P, reloj);
    this.dibujarBrillosPlacas(P, reloj);
    ctx.strokeStyle = '#f6efff'; ctx.lineWidth = 0.08;
    for (const f of P.flores) {
      if (f.abierta || !(f.p > 0)) continue;
      ctx.beginPath(); ctx.arc(f.x, f.y + 0.1, 0.55, -Math.PI / 2, -Math.PI / 2 + f.p * Math.PI * 2); ctx.stroke();
    }
    if (!P.noche) this.dibujarNubes(P, true);
    this.dibujarParticulas(P);
  }

  dibujar(Preal, reloj) {
    if (this.modoSuelo) return this.dibujarSuelo3D(Preal, reloj);
    const P = vistaDe(Preal);
    if (P.w !== this.vw || P.h !== this.vh) { this.vw = P.w; this.vh = P.h; this.ajustar(); }
    const g = this.giro, p = g ? (performance.now() - g.t0) / 380 : 1;
    if (p >= 1) this.giro = null;
    this.ctx = p < 1 ? this.buffer.getContext('2d') : this.ctxVisible;
    const ctx = this.ctx, c = this.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = P.noche ? '#0b0f22' : '#3b2a2a';
    ctx.fillRect(0, 0, c.width, c.height);
    if (!this.listo) return;
    if (this.partidaCache !== Preal || this.vistaCache !== P.k) { this.prepararSuelo(P); this.partidaCache = Preal; this.vistaCache = P.k; }
    this.actualizarDireccion(P.jugador);
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(this.esc, 0, 0, this.esc, this.ox, this.oy);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, -0.6, P.w, P.h + 0.6); ctx.clip();
    ctx.drawImage(this.suelo, 0, 0, P.w, P.h);

    this.dibujarPlacasYBase(P, reloj);
    if (!P.noche) this.dibujarSombrasObjetos(P);
    this.dibujarSombrasJugador(P, reloj);
    this.dibujarBrillosPlacas(P, reloj);
    this.dibujarObjetos(P, reloj);
    if (!P.noche) { this.dibujarNubes(P, reloj); this.dibujarTinte(P); }
    else this.dibujarNoche(P, reloj);
    this.dibujarParticulas(P);
    this.dibujarIndicaciones(P, reloj);
    ctx.restore();
    if (p < 1) {
      // Se gira la imagen completa alrededor del centro, con un pequeño alejamiento de cámara
      const e = 1 - Math.pow(1 - p, 3), v = this.ctxVisible;
      v.setTransform(1, 0, 0, 1, 0, 0);
      v.fillStyle = P.noche ? '#0b0f22' : '#3b2a2a';
      v.fillRect(0, 0, c.width, c.height);
      v.translate(c.width / 2, c.height / 2);
      v.rotate(g.desde * (1 - e));
      const z = 1 - 0.18 * Math.sin(Math.PI * e);
      v.scale(z, z);
      v.drawImage(this.buffer, -c.width / 2, -c.height / 2);
      v.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx = v;
    }
  }

  // Hacia dónde mira Gno (para elegir la columna de la hoja de sprites).
  // Según el control (en pantalla), no según el movimiento real: así no "gira como loco" al chocar o deslizarse.
  actualizarDireccion(j) { this.dirGno = direccionDe(j, this.dirGno); }

  // Recorte actual de Gno: [imagen, x, y, w, h]
  cuadroGno(j, estado) {
    const p = PERSONAJES[this.vestimenta] || 'flam';
    if (estado === 'perdido') return [`${p}_dead`, 0, 0, 16, 16];
    if (j.enAire) return [`${p}_jump`, this.dirGno * 16, 0, 16, 16];
    if (j.estirado) return [`${p}_item`, 0, 0, 16, 16];
    if (j.moviendo) return [`${p}_walk`, this.dirGno * 16, (Math.floor(j.paso / 2.2) % 4) * 16, 16, 16];
    return [`${p}_idle`, this.dirGno * 16, 0, 16, 16];
  }

  // ---------- Capas del suelo ----------
  dibujarPlacasYBase(P, reloj) {
    const ctx = this.ctx;
    for (let j = 1; j < P.h - 1; j++) for (let i = 1; i < P.w - 1; i++) if (P.celda(i, j) === 'k') pintar(ctx, R.craneo, i, j, 1, 1);
    // Luz reflejada por los espejos activos
    for (const e of P.espejos || []) {
      if (!e.activo) continue;
      const gr = ctx.createRadialGradient(e.x, e.y + 0.4, 0.2, e.x, e.y + 0.4, 7);
      gr.addColorStop(0, 'rgba(255,245,200,0.35)'); gr.addColorStop(1, 'rgba(255,245,200,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y + 0.4, 7, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of P.placas) {
      pintar(ctx, p.activa ? R.placaActiva : R.placa, p.x - 0.5, p.y - 0.5, 1, 1);
      ctx.strokeStyle = COLOR_LETRA[p.letra]; ctx.lineWidth = 0.05;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 0.46, 0.4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (P.salida && P.salida.activa) {
      const s = P.salida, a = ANIM.circulo;
      const k = Math.floor(reloj * a.fps) % a.n;
      ctx.drawImage(IMG[a.img], k * a.w, 0, a.w, a.h, s.x - 0.9, s.y - 0.8, 1.8, 1.8);
    }
  }

  // Sombra de un sprite proyectada en el suelo: la base queda en (x, y) y la altura se estira hacia la sombra.
  proyectar(g, sil, x, y, dx, dy, L, ancho) {
    const w = sil.width, h = sil.height;
    const a = -dy * ancho / w, b = dx * ancho / w, c = -dx * L / h, d = -dy * L / h;
    g.save();
    g.transform(a, b, c, d, x - a * w / 2 - c * h, y - b * w / 2 - d * h);
    g.drawImage(sil, 0, 0);
    g.restore();
  }
  sombraDe(g, r, x, y, s, L, ancho) {
    this.proyectar(g, silueta(r[0], r[1], r[2], r[3], r[4], COLOR_SOMBRA_OBJ), x, y, s.dx, s.dy, L, ancho);
  }

  dibujarSombrasObjetos(P) {
    const s = P.sol;
    if (!s) return;
    const g = this.capaSombra.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.capaSombra.width, this.capaSombra.height);
    g.setTransform(this.esc, 0, 0, this.esc, this.ox, this.oy);
    g.imageSmoothingEnabled = false;
    g.save();
    g.beginPath(); g.rect(0, 0, P.w, P.h); g.clip();
    g.fillStyle = COLOR_SOMBRA_OBJ;
    const largo = h => Math.min(12, h / s.tanE);
    for (let j = 1; j < P.h - 1; j++) {
      for (let i = 1; i < P.w - 1; i++) {
        const h = P.alturaEn(i, j);
        const ch = P.celda(i, j);
        if (!h) {
          if (ch === 'F') this.sombraDe(g, ['florAnimada', 0, 0, 16, 16], i + 0.5, j + 0.55, s, largo(0.45), 0.7);
          continue;
        }
        const L = largo(h);
        if (ch === 'c') this.sombraDe(g, R.saguaro, i + 0.5, j + 0.6, s, L, 0.9);
        else if (ch === 'r') this.sombraDe(g, R.roca, i + 0.5, j + 0.7, s, L, 0.95);
        else if (ch === 'b') this.sombraDe(g, R.biznaga, i + 0.5, j + 0.7, s, L, 0.9);
        else if (ch === 'g') this.sombraDe(g, R.agave, i + 0.5, j + 0.72, s, L, 0.95);
        else if (ch === 'o') this.sombraDe(g, R.ocotillo, i + 0.5, j + 0.72, s, L, 1.3);
        else if (ch === 'E') this.sombraDe(g, R.cristal, i + 0.5, j + 0.75, s, L, 0.8);
        else if (ch === 'L' || ch === 'l') this.sombraDe(g, R.farol, i + 0.5, j + 0.6, s, L, 0.8);
        else {
          const v = [s.dx * L, s.dy * L];
          const pts = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
          const hull = envolvente(pts.concat(pts.map(p => [p[0] + v[0], p[1] + v[1]])));
          g.beginPath(); hull.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
        }
      }
    }
    // Plataformas que se mueven: su sombra cae sobre el agua
    for (const pl of P.plataformas || []) {
      const L = largo(ALTO_PLATAFORMA), v = [s.dx * L, s.dy * L];
      const pts = [[pl.x - 0.5, pl.y - 0.5], [pl.x + 0.5, pl.y - 0.5], [pl.x + 0.5, pl.y + 0.5], [pl.x - 0.5, pl.y + 0.5]];
      const hull = envolvente(pts.concat(pts.map(p => [p[0] + v[0], p[1] + v[1]])));
      g.beginPath(); hull.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
    }
    g.restore();
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.34;
    ctx.drawImage(this.capaSombra, 0, 0);
    ctx.restore();
  }

  // La sombra de Gno es la silueta de su sprite (con todo y vestuario) proyectada desde cada luz.
  dibujarSombrasJugador(P, reloj) {
    const ctx = this.ctx;
    const r = this.cuadroGno(P.jugador, P.estado);
    const sil = silueta(r[0], r[1], r[2], r[3], r[4], COLOR_SOMBRA_GNO);
    ctx.save();
    ctx.shadowColor = 'rgba(170,120,255,0.9)';
    ctx.shadowBlur = 10 * this.dpr;
    ctx.globalAlpha = 0.66;
    for (const s of P.sombras) this.proyectar(ctx, sil, s.ox, s.oy, s.dx, s.dy, Math.max(0.3, s.L * 1.08), 1.0);
    ctx.restore();
    // Chispitas mágicas que recorren la sombra
    const a = ANIM.chispa;
    for (const s of P.sombras) {
      for (let k = 0; k < 3; k++) {
        const f = ((reloj * 0.35 + k / 3) % 1);
        const d = f * s.L, lado = Math.sin(reloj * 3 + k * 2) * 0.15;
        const x = s.ox + s.dx * d - s.dy * lado, y = s.oy + s.dy * d + s.dx * lado;
        const q = Math.min(a.n - 1, Math.floor(f * a.n));
        ctx.drawImage(IMG[a.img], q * a.w, 0, a.w, a.h, x - 0.15, y - 0.12, 0.3, 0.24);
      }
    }
  }

  dibujarBrillosPlacas(P, reloj) {
    const ctx = this.ctx;
    for (const p of P.placas) {
      if (!p.activa) continue;
      const r = 0.55 + Math.sin(reloj * 6) * 0.05;
      const gr = ctx.createRadialGradient(p.x, p.y, 0.05, p.x, p.y, r);
      gr.addColorStop(0, 'rgba(160,240,255,0.7)'); gr.addColorStop(1, 'rgba(160,240,255,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Objetos con altura (ordenados de atrás hacia adelante) ----------
  dibujarObjetos(P, reloj) {
    const lista = [];
    for (let j = 0; j < P.h; j++) {
      for (let i = 0; i < P.w; i++) {
        const ch = P.celda(i, j);
        if (ch === '#') lista.push({ y: j + 1, f: () => this.muro(P, i, j) });
        else if (ch === 'n') lista.push({ y: j + 1, f: () => this.muro(P, i, j, true) });
        else if (MESETAS[ch]) lista.push({ y: j + 1, f: () => this.meseta(P, i, j, ch) });
        else if (ch === 'c') lista.push({ y: j + 0.6, f: () => this.planta(R.saguaro, i + 0.5, j + 0.62, 1, 2) });
        else if (ch === 'r') lista.push({ y: j + 0.7, f: () => this.planta(R.roca, i + 0.5, j + 0.82, 1, 1) });
        else if (ch === 'b') lista.push({ y: j + 0.7, f: () => this.planta(R.biznaga, i + 0.5, j + 0.82, 1, 1) });
        else if (ch === 'g') lista.push({ y: j + 0.7, f: () => this.planta(R.agave, i + 0.5, j + 0.85, 1, 1) });
        else if (ch === 'o') lista.push({ y: j + 0.7, f: () => this.planta(R.ocotillo, i + 0.5, j + 0.85, 1.5, 1.5, reloj) });
        else if (ch === 'E') lista.push({ y: j + 0.8, f: () => this.espejo(P, i + 0.5, j + 0.8, reloj) });
      }
    }
    for (const r of P.relojes || []) if (!r.tomado) lista.push({ y: r.y + 0.2, f: () => this.relojArena(r) });
    for (const pl of P.plataformas || []) lista.push({ y: pl.y + 0.5, f: () => this.plataforma(pl) });
    for (const v of P.ventajas || []) lista.push({ y: v.y + 0.2, f: () => { this.sombraPie(v.x, v.y + 0.2, 0.5); pintar(this.ctx, ['v_' + v.tipo, 0, 0, 0, 0], v.x - 0.35, v.y - 0.75 + Math.sin(v.fase) * 0.08, 0.7, 0.7); } });
    for (const r of P.rodadoras || []) lista.push({ y: r.y0 + 0.3, f: () => this.rodadora(r) });
    for (const f of P.flores) lista.push({ y: f.y + 0.2, f: () => this.flor(f, reloj) });
    for (const pu of P.puertas) lista.push({ y: pu.j + 1, f: () => this.puerta(pu, reloj) });
    for (const fa of P.faroles) lista.push({ y: fa.y + 0.1, f: () => this.farol(fa, reloj) });
    if (P.salida) lista.push({ y: P.salida.y, f: () => this.relojDeSol(P.salida, reloj) });
    for (const d of P.destellos) if (!d.muerto) lista.push({ y: d.y + 0.3, f: () => this.destello(d, reloj) });
    // En alto, Gno se dibuja después de lo que tiene enfrente a su nivel.
    const jz = P.jugador.z || 0;
    lista.push({ y: P.jugador.y + 0.01 + (jz > 0.05 ? Math.min(2, 0.5 + jz) : 0), f: () => this.gno(P.jugador, reloj, P.estado) });
    lista.sort((a, b) => a.y - b.y);
    for (const o of lista) o.f();
  }

  // Sombrita ovalada bajo los pies (sprite "Shadow" del paquete).
  sombraPie(x, y, w) {
    pintar(this.ctx, R.sombraPie, x - w / 2, y - w * 0.29, w, w * 0.58);
  }

  // Muro de arena (relieve): la parte de arriba se arma según los vecinos y el frente solo si no hay muro abajo.
  muro(P, i, j, bajo = false) {
    const ctx = this.ctx;
    const tipo = bajo ? 'n' : '#';
    const alza = bajo ? 0.3 : 0.5;
    const es = (a, b) => P.celda(a, b) === tipo;
    autotile(ctx, MURO, es, i, j, i, j - alza, 1, false);
    if (j === P.h - 1) autotile(ctx, MURO, es, i, j, i, j, 1, false); // el borde de abajo llega hasta la orilla
    if (!es(i, j + 1)) {
      const im = IMG[MURO.img], y0 = j + 1 - alza;
      const xI = es(i - 1, j) ? MURO.xCentroI : MURO.xIzq, xD = es(i + 1, j) ? MURO.xCentroD : MURO.xDer;
      const sy = bajo ? MURO.yCara + 4 : MURO.yCara, sh = bajo ? 12 : 16;
      ctx.drawImage(im, xI, sy, 8, sh, i, y0, 0.5, alza);
      ctx.drawImage(im, xD, sy, 8, sh, i + 0.5, y0, 0.5, alza);
    }
  }

  // Meseta de roca (mecánica 3D): arriba se puede caminar; su frente es tan alto como la meseta.
  meseta(P, i, j, tipo) {
    const ctx = this.ctx, im = IMG[MESETA.img];
    const alza = MESETAS[tipo] * ZV;
    const es = (a, b) => P.celda(a, b) === tipo;
    autotile(ctx, MESETA, es, i, j, i, j - alza, 1, false);
    if (!es(i, j + 1)) {
      const xI = es(i - 1, j) ? MESETA.xCentroI : MESETA.xIzq, xD = es(i + 1, j) ? MESETA.xCentroD : MESETA.xDer;
      const y0 = j + 1 - alza;
      ctx.drawImage(im, xI, MESETA.yCara, 8, 16, i, y0, 0.5, alza);
      ctx.drawImage(im, xD, MESETA.yCara, 8, 16, i + 0.5, y0, 0.5, alza);
    }
  }

  // Plataforma que se mueve (vista 2D): caja de madera flotando
  plataforma(pl) {
    const ctx = this.ctx, alza = ALTO_PLATAFORMA * ZV;
    pintar(ctx, R.caja, pl.x - 0.5, pl.y - 0.5 - alza, 1, 1);
    ctx.drawImage(IMG.mazmorra, 32, 26, 16, 6, pl.x - 0.5, pl.y + 0.5 - alza, 1, 0.25);
  }

  // Plantas y rocas: el sprite se apoya en (x, y) por su borde de abajo.
  planta(r, x, y, w, h, reloj) {
    this.sombraPie(x, y - 0.05, w * 0.7);
    if (reloj !== undefined) {
      // El ocotillo se mece un poquito con el viento
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(x, y); ctx.transform(1, 0, Math.sin(reloj * 1.2 + x) * 0.04, 1, 0, 0);
      pintar(ctx, r, -w / 2, -h, w, h);
      ctx.restore();
      return;
    }
    pintar(this.ctx, r, x - w / 2, y - h, w, h);
  }

  flor(f, reloj) {
    const ctx = this.ctx, x = f.x, y = f.y + 0.3;
    if (f.abierta) {
      const gr = ctx.createRadialGradient(x, y - 0.5, 0.05, x, y - 0.5, 0.75);
      gr.addColorStop(0, 'rgba(255,250,220,0.55)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y - 0.5, 0.75, 0, Math.PI * 2); ctx.fill();
      const a = ANIM.flor, k = Math.floor(reloj * a.fps + f.x * 3) % a.n;
      const crece = 0.75 + Math.min(1, f.anim * 3) * 0.25;
      ctx.drawImage(IMG[a.img], k * a.w, 0, a.w, a.h, x - 0.5 * crece, y - crece, crece, crece);
      if (f.anim < 0.5) {
        const m = ANIM.chispaMagica, q = Math.min(m.n - 1, Math.floor(f.anim / 0.5 * m.n));
        ctx.drawImage(IMG[m.img], q * m.w, 0, m.w, m.h, x - 0.7, y - 1.3, 1.4, 1.6);
      }
    } else {
      // Flor dormida: el mismo sprite de la flor, teñido de morado, con un brillo que late
      const a = ANIM.flor;
      const br = 0.5 + Math.sin(reloj * 3 + f.x) * 0.08;
      const gl = ctx.createRadialGradient(x, y - 0.4, 0.05, x, y - 0.4, br);
      gl.addColorStop(0, 'rgba(214,170,255,0.55)'); gl.addColorStop(1, 'rgba(214,170,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y - 0.4, br, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(IMG[a.img], 0, 0, a.w, a.h, x - 0.4, y - 0.8, 0.8, 0.8);
      ctx.globalAlpha = 0.5;
      ctx.drawImage(silueta(a.img, 0, 0, a.w, a.h, '#6a3f9a'), x - 0.4, y - 0.8, 0.8, 0.8);
      ctx.globalAlpha = 1;
      const p = f.p;
      if (p > 0) {
        ctx.strokeStyle = '#f6efff'; ctx.lineWidth = 0.06;
        ctx.beginPath(); ctx.arc(x, y - 0.4, 0.5, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
      }
    }
  }

  puerta(pu, reloj) {
    const ctx = this.ctx, i = pu.i, j = pu.j;
    if (pu.solar) {
      if (pu.abierta) {
        ctx.globalAlpha = 0.7;
        pintar(ctx, R.sol, i + 0.25, j + 0.25, 0.5, 0.5);
        ctx.globalAlpha = 1;
        return;
      }
      pintar(ctx, R.bloqueSolar, i, j - 0.35, 1, 1.35);
      pintar(ctx, R.sol, i + 0.25, j - 0.15, 0.5, 0.5);
      return;
    }
    if (pu.permanente) {
      if (pu.abierta) return;
      pintar(ctx, R.bloqueSello, i, j - 0.35, 1, 1.35);
      ctx.globalAlpha = 0.6 + Math.sin(reloj * 3) * 0.3;
      pintar(ctx, R.ojoSello, i + 0.2, j - 0.05, 0.6, 0.6);
      ctx.globalAlpha = 1;
      return;
    }
    const im = IMG[R.reja[0]];
    if (pu.abierta) {
      // La reja se hunde: solo se ve el borde de arriba a ras del suelo
      ctx.drawImage(im, R.reja[1], R.reja[2], 16, 5, i, j + 0.65, 1, 0.3);
      return;
    }
    pintar(ctx, R.reja, i, j - 0.35, 1, 1.35);
    ctx.fillStyle = COLOR_LETRA[pu.letra.toLowerCase()];
    ctx.globalAlpha = 0.35;
    ctx.fillRect(i + 0.05, j + 0.85, 0.9, 0.1);
    ctx.globalAlpha = 1;
  }

  farol(fa, reloj) {
    const ctx = this.ctx, x = fa.x, y = fa.y + 0.15;
    this.sombraPie(x, y - 0.05, 0.7);
    pintar(ctx, R.farol, x - 0.5, y - 2, 1, 2);
    if (fa.encendido) {
      const r = 0.9 + Math.sin(reloj * 9 + x) * 0.05;
      const gr = ctx.createRadialGradient(x, y - 1.35, 0.05, x, y - 1.35, r);
      gr.addColorStop(0, 'rgba(255,210,120,0.6)'); gr.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y - 1.35, r, 0, Math.PI * 2); ctx.fill();
      const a = ANIM.fuego, k = Math.floor(reloj * a.fps + x) % a.n;
      ctx.drawImage(IMG[a.img], k * a.w, 0, a.w, a.h, x - 0.25, y - 1.62, 0.5, 0.5);
    }
  }

  relojDeSol(s, reloj) {
    const ctx = this.ctx, x = s.x, y = s.y;
    if (s.activa) {
      const gr = ctx.createLinearGradient(x, y - 3, x, y);
      gr.addColorStop(0, 'rgba(255,220,130,0)'); gr.addColorStop(1, 'rgba(255,220,130,0.55)');
      ctx.fillStyle = gr; ctx.fillRect(x - 0.32 - Math.sin(reloj * 2) * 0.04, y - 3, 0.64 + Math.sin(reloj * 2) * 0.08, 3);
    }
    this.sombraPie(x, y + 0.2, 0.8);
    pintar(ctx, s.activa ? R.pedestalActivo : R.pedestal, x - 0.5, y - 0.75, 1, 1);
  }

  destello(d, reloj) {
    const ctx = this.ctx;
    const k = 1 - d.apagado * 0.6;
    const x = d.x, y = d.y - Math.sin(d.fase) * 0.08;
    this.sombraPie(d.x, d.y + 0.15, 0.6 * k);
    const gr = ctx.createRadialGradient(x, y - 0.45, 0.02, x, y - 0.45, 0.7 * k);
    gr.addColorStop(0, 'rgba(255,250,220,0.85)'); gr.addColorStop(0.4, 'rgba(255,225,120,0.45)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y - 0.45, 0.7 * k, 0, Math.PI * 2); ctx.fill();
    const dir = d.eje === 'h' ? (d.dir > 0 ? DIR.derecha : DIR.izquierda) : (d.dir > 0 ? DIR.abajo : DIR.arriba);
    const a = ANIM.espiritu, q = Math.floor(reloj * 6 + d.fase) % 4;
    ctx.globalAlpha = 0.45 + 0.55 * k;
    ctx.drawImage(IMG[a.img], dir * a.w, q * a.h, a.w, a.h, x - 0.5 * k, y - 0.95 * k, k, k);
    ctx.globalAlpha = 1;
  }

  espejo(P, x, y, reloj) {
    const ctx = this.ctx;
    const e = P.espejos.find(m => Math.abs(m.x - x) < 0.01);
    this.sombraPie(x, y, 0.8);
    pintar(ctx, R.pedestal, x - 0.5, y - 0.8, 1, 1);
    pintar(ctx, R.cristal, x - 0.5, y - 1.45 + Math.sin(reloj * 2) * 0.04, 1, 1);
    if (e && e.activo) {
      const a = ANIM.chispa, q = Math.floor(reloj * 10) % a.n;
      ctx.drawImage(IMG[a.img], q * a.w, 0, a.w, a.h, x + 0.05, y - 1.45, 0.4, 0.32);
    }
  }

  relojArena(r) {
    const ctx = this.ctx;
    const x = r.x, y = r.y - 0.35 + Math.sin(r.fase) * 0.06;
    const gr = ctx.createRadialGradient(x, y, 0.02, x, y, 0.45);
    gr.addColorStop(0, 'rgba(255,224,138,0.55)'); gr.addColorStop(1, 'rgba(255,224,138,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 0.45, 0, Math.PI * 2); ctx.fill();
    this.sombraPie(r.x, r.y + 0.2, 0.5);
    pintar(ctx, R.relojArena, x - 0.38, y - 0.38, 0.76, 0.76);
  }

  rodadora(r) {
    const ctx = this.ctx;
    this.sombraPie(r.x, r.y0 + 0.2, 0.55);
    ctx.save();
    ctx.translate(r.x, r.y - 0.15);
    ctx.rotate(r.giro);
    pintar(ctx, R.rodadora, -0.35, -0.35, 0.7, 0.7);
    ctx.restore();
  }

  dibujarNubes(P, soloSombra = false) {
    if (!P.nubes || !P.nubes.length) return;
    const ctx = this.ctx;
    // Sombra de la nube en el suelo (aquí no hay sombra de sol)
    for (const n of P.nubes) {
      const gr = ctx.createRadialGradient(n.x, n.fila, 0.2, n.x, n.fila, Math.max(n.ancho, n.alto));
      gr.addColorStop(0, 'rgba(40,30,70,0.32)'); gr.addColorStop(0.75, 'rgba(40,30,70,0.22)'); gr.addColorStop(1, 'rgba(40,30,70,0)');
      ctx.save();
      ctx.translate(n.x, n.fila); ctx.scale(1, n.alto / n.ancho); ctx.translate(-n.x, -n.fila);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(n.x, n.fila, n.ancho, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (soloSombra) return;
    // La nube misma, por encima (algo transparente para no tapar el juego)
    ctx.globalAlpha = 0.5;
    for (const n of P.nubes) {
      const w = n.ancho * 2.1, h = w * 36 / 80;
      pintar(ctx, R.nube, n.x + 0.6 - w / 2, n.fila - 2.4 - h / 2, w, h);
    }
    ctx.globalAlpha = 1;
  }

  // Gno: el espíritu del reloj de sol. Su aspecto depende del vestuario elegido.
  gno(j, reloj, estado) {
    if (j.invuln > 0 && Math.floor(reloj * 14) % 2 === 0) return;
    const r = this.cuadroGno(j, estado);
    const T = 1.15, z = j.z || 0, piso = j.piso || 0;
    // La sombrita de contacto se queda en el piso y se achica mientras más alto salta
    this.sombraPie(j.x, j.y + 0.02 - piso * ZV, 0.62 / (1 + (z - piso) * 0.8));
    pintar(this.ctx, r, j.x - T / 2, j.y - T + 0.08 - z * ZV, T, T);
  }

  // Retrato de Gno con una vestimenta (para la pantalla de vestuario).
  retrato(cv, id, libre) {
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const p = PERSONAJES[id] || 'flam';
    const im = IMG[`${p}_idle`];
    if (!im) return;
    g.save();
    g.imageSmoothingEnabled = false;
    if (!libre) g.filter = 'brightness(0) opacity(0.45)';
    const t = Math.floor(Math.min(cv.width, cv.height) * 0.8 / 16) * 16;
    g.drawImage(im, 0, 0, 16, 16, (cv.width - t) / 2, cv.height - t - 4, t, t);
    g.restore();
  }

  // ---------- Luz ----------
  dibujarTinte(P) {
    const { c, a } = tinte(P.t);
    if (a <= 0.005) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = P.t > 0.9 ? 'source-over' : 'soft-light';
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${P.t > 0.9 ? a : Math.min(1, a * 2.4)})`;
    ctx.fillRect(0, -0.6, P.w, P.h + 0.6);
    ctx.restore();
  }

  dibujarNoche(P, reloj) {
    const g = this.capaNoche.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.capaNoche.width, this.capaNoche.height);
    g.setTransform(this.esc, 0, 0, this.esc, this.ox, this.oy);
    g.fillStyle = 'rgba(6,8,30,0.93)';
    g.fillRect(-1, -1, P.w + 2, P.h + 2);
    g.globalCompositeOperation = 'destination-out';
    for (const f of P.faroles) {
      if (!f.encendido) continue;
      const r = 9 + Math.sin(reloj * 7 + f.x) * 0.1;
      const gr = g.createRadialGradient(f.x, f.y - 0.6, 0.3, f.x, f.y - 0.6, r);
      gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.35, 'rgba(0,0,0,0.7)'); gr.addColorStop(0.8, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y - 0.6, r, 0, Math.PI * 2); g.fill();
    }
    const j = P.jugador;
    const gj = g.createRadialGradient(j.x, j.y - 0.5, 0.1, j.x, j.y - 0.5, 1.6);
    gj.addColorStop(0, 'rgba(0,0,0,0.6)'); gj.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gj; g.beginPath(); g.arc(j.x, j.y - 0.5, 1.6, 0, Math.PI * 2); g.fill();
    for (const fl of P.flores) {
      if (!fl.abierta) continue;
      const gf = g.createRadialGradient(fl.x, fl.y - 0.5, 0.05, fl.x, fl.y - 0.5, 1.1);
      gf.addColorStop(0, 'rgba(0,0,0,0.7)'); gf.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gf; g.beginPath(); g.arc(fl.x, fl.y - 0.5, 1.1, 0, Math.PI * 2); g.fill();
    }
    // Los destellos son de luz: se ven en la oscuridad
    for (const d of P.destellos) {
      if (d.muerto) continue;
      const gd = g.createRadialGradient(d.x, d.y - 0.45, 0.05, d.x, d.y - 0.45, 1.2);
      gd.addColorStop(0, 'rgba(0,0,0,0.75)'); gd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gd; g.beginPath(); g.arc(d.x, d.y - 0.45, 1.2, 0, Math.PI * 2); g.fill();
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.capaNoche, 0, 0);
    ctx.restore();
    // Brillo cálido
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of P.faroles) {
      if (!f.encendido) continue;
      const gr = ctx.createRadialGradient(f.x, f.y - 1.2, 0.1, f.x, f.y - 1.2, 3);
      gr.addColorStop(0, 'rgba(255,170,70,0.25)'); gr.addColorStop(1, 'rgba(255,170,70,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y - 1.2, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Partículas: chispas del paquete, pintadas del color de cada evento.
  dibujarParticulas(P) {
    const ctx = this.ctx, a = ANIM.chispa;
    for (const p of P.particulas) {
      const f = Math.max(0, p.vida / p.max);
      const q = Math.min(a.n - 1, Math.floor((1 - f) * a.n));
      ctx.globalAlpha = Math.min(1, f * 1.5);
      ctx.drawImage(silueta(a.img, q * a.w, 0, a.w, a.h, p.color), p.x - 0.16, p.y - 0.13, 0.32, 0.26);
    }
    ctx.globalAlpha = 1;
  }

  dibujarIndicaciones(P, reloj) {
    const ctx = this.ctx;
    const f = P.farolCercano ? P.farolCercano() : null;
    if (f && P.estado === 'jugando') {
      const y = f.y - 2.3 + Math.sin(reloj * 4) * 0.05;
      ctx.fillStyle = 'rgba(16,20,34,0.85)'; ctx.beginPath(); ctx.roundRect(f.x - 0.25, y - 0.25, 0.5, 0.5, 0.12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 0.34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('F', f.x, y + 0.02);
    }
    // Ícono de cada puerta para saber qué placa la abre
    for (const pu of P.puertas) {
      if (pu.abierta || pu.solar) continue;
      const ic = ICONO_LETRA[pu.permanente ? 'm' : pu.letra.toLowerCase()];
      if (ic) pintar(ctx, ic, pu.x - 0.22, pu.j - 0.92 + Math.sin(reloj * 3) * 0.03, 0.44, 0.44);
    }
  }
}
