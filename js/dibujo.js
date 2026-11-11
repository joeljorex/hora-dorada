// Dibujo del nivel en un canvas 2D. Todo se dibuja en "casillas" (la transformación escala a pixeles).
import { ALTURAS } from './juego.js';

const TEX = 48; // pixeles por casilla en la textura del suelo
const COLOR_LETRA = { a: '#5ee0ff', b: '#ff8fc8', m: '#c9a8ff' };

function aleatorio(semilla) {
  let a = semilla >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Envolvente convexa (monotone chain) para la sombra de los bloques.
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
function tinte(t) {
  for (let k = 0; k < TINTES.length - 1; k++) {
    const [t0, c0, a0] = TINTES[k], [t1, c1, a1] = TINTES[k + 1];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return { c: c0.map((v, i) => Math.round(v + (c1[i] - v) * f)), a: a0 + (a1 - a0) * f };
    }
  }
  return { c: TINTES[TINTES.length - 1][1], a: TINTES[TINTES.length - 1][2] };
}

export class Pintor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.capaSombra = document.createElement('canvas');
    this.capaNoche = document.createElement('canvas');
    this.partidaCache = null;
    this.vestimenta = 'hoja';
    this.margenArriba = 64;
    this.ajustar();
  }

  ajustar() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    const w = Math.floor(innerWidth * dpr), h = Math.floor(innerHeight * dpr);
    for (const c of [this.canvas, this.capaSombra, this.capaNoche]) { c.width = w; c.height = h; }
    this.canvas.style.width = innerWidth + 'px';
    this.canvas.style.height = innerHeight + 'px';
    const arriba = this.margenArriba * dpr, abajo = 12 * dpr;
    this.esc = Math.min(w / 26, (h - arriba - abajo) / 15);
    this.ox = (w - 26 * this.esc) / 2;
    this.oy = arriba + (h - arriba - abajo - 15 * this.esc) / 2;
  }

  // Convierte coordenadas del mapa a pixeles CSS (para elementos HTML encima del canvas).
  aPantalla(x, y) { return { x: (this.ox + x * this.esc) / this.dpr, y: (this.oy + y * this.esc) / this.dpr }; }

  prepararSuelo(P) {
    const c = document.createElement('canvas');
    c.width = P.w * TEX; c.height = P.h * TEX;
    const g = c.getContext('2d');
    const al = aleatorio(P.indice * 977 + 13);
    const arenas = ['#efcf94', '#ecc98b', '#f2d59e', '#e9c487'];
    for (let j = 0; j < P.h; j++) {
      for (let i = 0; i < P.w; i++) {
        g.fillStyle = arenas[(al() * arenas.length) | 0];
        g.fillRect(i * TEX, j * TEX, TEX, TEX);
      }
    }
    // Granos, piedritas y matorrales secos
    for (let k = 0; k < P.w * P.h * 3; k++) {
      const x = al() * c.width, y = al() * c.height;
      g.fillStyle = al() < 0.5 ? 'rgba(170,120,70,0.25)' : 'rgba(255,240,200,0.35)';
      g.fillRect(x, y, 2 + al() * 2, 2 + al() * 2);
    }
    for (let k = 0; k < 26; k++) {
      const x = al() * c.width, y = al() * c.height;
      g.fillStyle = '#c9a77a'; g.beginPath(); g.ellipse(x, y, 4 + al() * 4, 3 + al() * 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(x - 1, y - 1, 2, 1.2, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(150,120,60,0.55)'; g.lineWidth = 2;
    for (let k = 0; k < 18; k++) {
      const x = al() * c.width, y = al() * c.height;
      for (let r = 0; r < 5; r++) { const a = -Math.PI / 2 + (r - 2) * 0.45; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); }
    }
    // Tierra agrietada (manchas)
    g.strokeStyle = 'rgba(140,100,60,0.35)'; g.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) {
      const x = al() * c.width, y = al() * c.height;
      for (let r = 0; r < 6; r++) {
        let px = x, py = y;
        g.beginPath(); g.moveTo(px, py);
        for (let s = 0; s < 4; s++) { px += (al() - 0.5) * 22; py += (al() - 0.5) * 22; g.lineTo(px, py); }
        g.stroke();
      }
    }
    // Agua y caminos de piedra
    for (let j = 0; j < P.h; j++) {
      for (let i = 0; i < P.w; i++) {
        const ch = P.celda(i, j);
        if (ch === 'w') {
          g.fillStyle = '#5fb7d9'; g.fillRect(i * TEX, j * TEX, TEX, TEX);
          if (P.celda(i, j - 1) !== 'w') { g.fillStyle = '#d9c08a'; g.fillRect(i * TEX, j * TEX, TEX, 6); g.fillStyle = '#9fdcf0'; g.fillRect(i * TEX, j * TEX + 6, TEX, 4); }
          g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(i * TEX + al() * 30, j * TEX + 14 + al() * 24, 10, 2);
        } else if (ch === 'p') {
          for (let s = 0; s < 3; s++) {
            const px = i * TEX + 8 + al() * 32, py = j * TEX + 8 + al() * 32;
            g.fillStyle = '#b7a58c'; g.beginPath(); g.ellipse(px, py, 9 + al() * 4, 6 + al() * 3, al(), 0, Math.PI * 2); g.fill();
            g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(px - 2, py - 2, 5, 3, 0, 0, Math.PI * 2); g.fill();
          }
        }
      }
    }
    this.suelo = c;
    this.partidaCache = P;
  }

  dibujar(P, reloj) {
    const ctx = this.ctx, c = this.canvas;
    if (this.partidaCache !== P) this.prepararSuelo(P);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = P.noche ? '#0b0f22' : '#3b2a2a';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(this.esc, 0, 0, this.esc, this.ox, this.oy);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, -0.4, P.w, P.h + 0.4); ctx.clip();
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
  }

  // ---------- Capas ----------
  dibujarPlacasYBase(P, reloj) {
    const ctx = this.ctx;
    // Cráneos de adorno
    for (let j = 1; j < P.h - 1; j++) for (let i = 1; i < P.w - 1; i++) if (P.celda(i, j) === 'k') this.craneo(i + 0.5, j + 0.55);
    // Luz reflejada por los espejos activos
    for (const e of P.espejos || []) {
      if (!e.activo) continue;
      const gr = ctx.createRadialGradient(e.x, e.y + 0.4, 0.2, e.x, e.y + 0.4, 7);
      gr.addColorStop(0, 'rgba(255,245,200,0.35)'); gr.addColorStop(1, 'rgba(255,245,200,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y + 0.4, 7, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of P.placas) {
      ctx.fillStyle = '#7b8396'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 0.05, 0.42, 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#959db0'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 0.4, 0.31, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.activa ? '#ffffff' : '#5d667c';
      ctx.beginPath(); ctx.arc(p.x - 0.03, p.y, 0.16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#959db0'; ctx.beginPath(); ctx.arc(p.x + 0.05, p.y - 0.04, 0.14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COLOR_LETRA[p.letra]; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.ellipse(p.x, p.y, 0.4, 0.31, 0, 0, Math.PI * 2); ctx.stroke();
    }
    if (P.salida) {
      const s = P.salida;
      ctx.fillStyle = '#9d8f7c'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 0.06, 0.46, 0.36, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = s.activa ? '#f5dca0' : '#c2b49f'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 0.44, 0.33, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 0.03;
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(s.x + Math.cos(a) * 0.3, s.y + Math.sin(a) * 0.22); ctx.lineTo(s.x + Math.cos(a) * 0.4, s.y + Math.sin(a) * 0.3); ctx.stroke();
      }
    }
  }

  dibujarSombrasObjetos(P) {
    const s = P.sol;
    if (!s) return;
    const g = this.capaSombra.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.capaSombra.width, this.capaSombra.height);
    g.setTransform(this.esc, 0, 0, this.esc, this.ox, this.oy);
    g.save();
    g.beginPath(); g.rect(0, 0, P.w, P.h); g.clip();
    g.fillStyle = g.strokeStyle = 'rgb(55,28,88)';
    g.lineCap = 'round';
    const largo = h => Math.min(12, h / s.tanE);
    for (let j = 1; j < P.h - 1; j++) {
      for (let i = 1; i < P.w - 1; i++) {
        const h = P.alturaEn(i, j);
        if (!h) {
          if (P.celda(i, j) === 'F') this.trazo(g, i + 0.5, j + 0.5, s, largo(0.45), 0.45);
          continue;
        }
        const ch = P.celda(i, j);
        const L = largo(h);
        if (ch === 'c') { this.trazo(g, i + 0.5, j + 0.5, s, L, 0.42); this.trazo(g, i + 0.5 - s.dy * 0.3, j + 0.5 + s.dx * 0.3, s, L * 0.7, 0.18); }
        else if (ch === 'r' || ch === 'b') this.trazo(g, i + 0.5, j + 0.55, s, L, ch === 'b' ? 0.6 : 0.7);
        else if (ch === 'g') { this.trazo(g, i + 0.5, j + 0.6, s, L, 0.7); }
        else if (ch === 'o') { this.trazo(g, i + 0.4, j + 0.6, s, L, 0.09); this.trazo(g, i + 0.6, j + 0.6, s, L * 0.85, 0.09); this.trazo(g, i + 0.5, j + 0.6, s, L * 0.95, 0.08); }
        else if (ch === 'E') this.trazo(g, i + 0.5, j + 0.6, s, L, 0.5);
        else if (ch === 'L' || ch === 'l') this.trazo(g, i + 0.5, j + 0.6, s, L, 0.14);
        else {
          const v = [s.dx * L, s.dy * L];
          const pts = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
          const hull = envolvente(pts.concat(pts.map(p => [p[0] + v[0], p[1] + v[1]])));
          g.beginPath(); hull.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
        }
      }
    }
    g.restore();
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.34;
    ctx.drawImage(this.capaSombra, 0, 0);
    ctx.restore();
  }
  trazo(g, x, y, s, L, ancho) {
    g.lineWidth = ancho;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + s.dx * L, y + s.dy * L); g.stroke();
  }

  dibujarSombrasJugador(P, reloj) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(170,120,255,0.9)';
    ctx.shadowBlur = 10 * this.dpr;
    for (const s of P.sombras) {
      const nx = -s.dy, ny = s.dx, L = s.L;
      const cuerpo = Math.max(0.2, L * 0.82);
      const ox = s.ox, oy = s.oy;
      ctx.fillStyle = 'rgba(48,18,82,0.62)';
      ctx.beginPath();
      ctx.moveTo(ox + nx * 0.31, oy + ny * 0.31);
      ctx.lineTo(ox + s.dx * cuerpo + nx * 0.14, oy + s.dy * cuerpo + ny * 0.14);
      ctx.lineTo(ox + s.dx * cuerpo - nx * 0.14, oy + s.dy * cuerpo - ny * 0.14);
      ctx.lineTo(ox - nx * 0.31, oy - ny * 0.31);
      ctx.closePath(); ctx.fill();
      const rc = Math.min(0.24, 0.1 + L * 0.05);
      ctx.beginPath(); ctx.arc(ox + s.dx * (cuerpo + rc * 0.6), oy + s.dy * (cuerpo + rc * 0.6), rc, 0, Math.PI * 2); ctx.fill();
      // silueta del accesorio en la sombra
      const hx = ox + s.dx * (cuerpo + rc * 1.6), hy = oy + s.dy * (cuerpo + rc * 1.6);
      const ang = Math.atan2(s.dy, s.dx);
      if (this.vestimenta === 'sombrero') {
        const bx = ox + s.dx * (cuerpo + rc * 0.9), by = oy + s.dy * (cuerpo + rc * 0.9);
        ctx.beginPath(); ctx.ellipse(bx, by, 0.09, 0.36, ang, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hx, hy, 0.13, 0, Math.PI * 2); ctx.fill();
      } else if (this.vestimenta === 'corona') {
        for (let k = -2; k <= 2; k++) ctx.beginPath(), ctx.arc(hx - ny * k * 0.09, hy + nx * k * 0.09, 0.06, 0, Math.PI * 2), ctx.fill();
      } else if (this.vestimenta === 'farolito') {
        ctx.beginPath(); ctx.arc(hx + s.dx * 0.12 + nx * 0.1, hy + s.dy * 0.12 + ny * 0.1, 0.08, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(hx, hy, 0.12, 0.06, ang, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
    // Destellitos mágicos sobre la sombra
    ctx.fillStyle = 'rgba(220,200,255,0.8)';
    for (const s of P.sombras) {
      for (let k = 0; k < 4; k++) {
        const f = ((reloj * 0.35 + k / 4) % 1);
        const a = f * s.L, lado = Math.sin(reloj * 3 + k * 2) * 0.15;
        const x = s.ox + s.dx * a - s.dy * lado, y = s.oy + s.dy * a + s.dx * lado;
        const r = 0.035 * Math.sin(f * Math.PI);
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.005, r), 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  dibujarBrillosPlacas(P, reloj) {
    const ctx = this.ctx;
    for (const p of P.placas) {
      if (!p.activa) continue;
      const r = 0.55 + Math.sin(reloj * 6) * 0.05;
      const gr = ctx.createRadialGradient(p.x, p.y, 0.05, p.x, p.y, r);
      gr.addColorStop(0, 'rgba(160,240,255,0.8)'); gr.addColorStop(1, 'rgba(160,240,255,0)');
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
        else if (ch === 'c') lista.push({ y: j + 0.6, f: () => this.saguaro(i + 0.5, j + 0.6) });
        else if (ch === 'r') lista.push({ y: j + 0.7, f: () => this.roca(i + 0.5, j + 0.6) });
        else if (ch === 'b') lista.push({ y: j + 0.7, f: () => this.biznaga(i + 0.5, j + 0.7, reloj) });
        else if (ch === 'g') lista.push({ y: j + 0.7, f: () => this.agave(i + 0.5, j + 0.72) });
        else if (ch === 'o') lista.push({ y: j + 0.7, f: () => this.ocotillo(i + 0.5, j + 0.72, reloj) });
        else if (ch === 'E') lista.push({ y: j + 0.8, f: () => this.espejo(P, i + 0.5, j + 0.8, reloj) });
      }
    }
    for (const r of P.relojes || []) if (!r.tomado) lista.push({ y: r.y + 0.2, f: () => this.relojArena(r) });
    for (const r of P.rodadoras || []) lista.push({ y: r.y0 + 0.3, f: () => this.rodadora(r) });
    for (const f of P.flores) lista.push({ y: f.y + 0.2, f: () => this.flor(f, reloj) });
    for (const pu of P.puertas) lista.push({ y: pu.j + 1, f: () => this.puerta(pu, reloj) });
    for (const fa of P.faroles) lista.push({ y: fa.y + 0.1, f: () => this.farol(fa, reloj, P.noche) });
    if (P.salida) lista.push({ y: P.salida.y, f: () => this.relojDeSol(P.salida, reloj) });
    for (const d of P.destellos) if (!d.muerto) lista.push({ y: d.y + 0.3, f: () => this.destello(d, reloj) });
    lista.push({ y: P.jugador.y + 0.01, f: () => this.gno(P.jugador, reloj, P.estado) });
    lista.sort((a, b) => a.y - b.y);
    for (const o of lista) o.f();
  }

  muro(P, i, j, bajo = false) {
    const ctx = this.ctx;
    const tipo = bajo ? 'n' : '#';
    const abajo = P.celda(i, j + 1) === tipo;
    const arriba = P.celda(i, j - 1) === tipo;
    if (bajo) {
      if (!abajo) { ctx.fillStyle = '#9a6a48'; ctx.fillRect(i, j + 0.78, 1, 0.22); }
      ctx.fillStyle = '#c99a72'; ctx.fillRect(i, j - 0.02, 1, 0.8);
      if (!arriba) { ctx.fillStyle = '#e0b48c'; ctx.fillRect(i, j - 0.02, 1, 0.06); }
      ctx.fillStyle = 'rgba(120,80,50,0.35)'; ctx.fillRect(i + 0.2, j + 0.3, 0.25, 0.04); ctx.fillRect(i + 0.55, j + 0.5, 0.25, 0.04);
      return;
    }
    if (!abajo) { ctx.fillStyle = '#a5633c'; ctx.fillRect(i, j + 0.62, 1, 0.38); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(i, j + 0.81, 1, 0.04); }
    ctx.fillStyle = '#d6955f'; ctx.fillRect(i, j - 0.38, 1, 1);
    if (!arriba) { ctx.fillStyle = '#eab27c'; ctx.fillRect(i, j - 0.38, 1, 0.07); }
    ctx.fillStyle = 'rgba(150,90,50,0.35)';
    const k = (i * 7 + j * 13) % 5;
    ctx.fillRect(i + 0.15 + k * 0.1, j - 0.1 + (k % 3) * 0.15, 0.22, 0.04);
    ctx.fillRect(i + 0.55 - k * 0.05, j + 0.25, 0.18, 0.04);
  }

  saguaro(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y, 0.28, 0.1, 0, 0, Math.PI * 2); ctx.fill();
    const cuerpo = (cx, top, bot, w, c1, c2) => {
      ctx.fillStyle = c1; ctx.beginPath(); ctx.roundRect(cx - w, top, w * 2, bot - top, w); ctx.fill();
      ctx.fillStyle = c2; ctx.fillRect(cx - w * 0.2, top + w * 0.6, w * 0.4, bot - top - w * 0.8);
    };
    ctx.strokeStyle = '#2f6b3b'; ctx.lineWidth = 0.05;
    cuerpo(x - 0.33, y - 1.15, y - 0.6, 0.1, '#4e9a5b', '#6cbb72');
    ctx.fillStyle = '#4e9a5b'; ctx.fillRect(x - 0.33, y - 0.72, 0.2, 0.12);
    cuerpo(x + 0.33, y - 1.35, y - 0.75, 0.1, '#4e9a5b', '#6cbb72');
    ctx.fillStyle = '#4e9a5b'; ctx.fillRect(x + 0.13, y - 0.87, 0.2, 0.12);
    cuerpo(x, y - 1.75, y, 0.2, '#4e9a5b', '#6cbb72');
    ctx.fillStyle = '#ff9fc4'; ctx.beginPath(); ctx.arc(x, y - 1.75, 0.07, 0, Math.PI * 2); ctx.fill();
  }

  roca(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#7f7568'; ctx.beginPath(); ctx.ellipse(x, y, 0.42, 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a59a8c'; ctx.beginPath(); ctx.ellipse(x - 0.05, y - 0.08, 0.34, 0.22, 0, 0, Math.PI * 2); ctx.fill();
  }

  flor(f, reloj) {
    const ctx = this.ctx, x = f.x, y = f.y + 0.2;
    ctx.strokeStyle = '#4b7d40'; ctx.lineWidth = 0.06; ctx.lineCap = 'round';
    for (const [dx, h] of [[-0.18, 0.5], [0.16, 0.45], [0, 0.65]]) { ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx * 0.6, y - h); ctx.stroke(); }
    const tx = x, ty = y - 0.7 + Math.sin(reloj * 1.5 + f.x) * 0.02;
    if (f.abierta) {
      const r = 0.3 + Math.min(1, f.anim * 3) * 0.06;
      const gr = this.ctx.createRadialGradient(tx, ty, 0.05, tx, ty, 0.7);
      gr.addColorStop(0, 'rgba(255,250,220,0.55)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(tx, ty, 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2 + reloj * 0.2;
        ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * r * 0.55, ty + Math.sin(a) * r * 0.45, r * 0.42, r * 0.16, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(tx, ty, 0.09, 0, Math.PI * 2); ctx.fill();
    } else {
      const p = f.p;
      ctx.fillStyle = '#7d5a8f'; ctx.beginPath(); ctx.ellipse(tx, ty, 0.09 + p * 0.06, 0.17, 0, 0, Math.PI * 2); ctx.fill();
      if (p > 0) {
        ctx.fillStyle = '#f6efff';
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k - 2) * 0.5;
          ctx.beginPath(); ctx.ellipse(tx + Math.cos(a) * 0.12 * p, ty + Math.sin(a) * 0.12 * p, 0.1 * p, 0.04 * p + 0.01, a, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = '#f6efff'; ctx.lineWidth = 0.05;
        ctx.beginPath(); ctx.arc(x, y - 0.35, 0.48, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
      }
    }
  }

  puerta(pu, reloj) {
    const ctx = this.ctx, i = pu.i, j = pu.j;
    if (pu.solar) {
      // Arco de piedra con un sol: se abre al mediodía
      ctx.fillStyle = '#8f7a66'; ctx.fillRect(i, j - 0.4, 0.18, 1.4); ctx.fillRect(i + 0.82, j - 0.4, 0.18, 1.4);
      ctx.fillStyle = '#a8927c'; ctx.fillRect(i - 0.02, j - 0.5, 1.04, 0.22);
      ctx.fillStyle = pu.abierta ? '#ffd36b' : '#c9b39b';
      ctx.beginPath(); ctx.arc(i + 0.5, j - 0.39, 0.14, 0, Math.PI * 2); ctx.fill();
      if (pu.abierta) {
        ctx.strokeStyle = 'rgba(255,211,107,0.8)'; ctx.lineWidth = 0.035;
        for (let r = 0; r < 8; r++) { const a = r / 8 * Math.PI * 2 + reloj; ctx.beginPath(); ctx.moveTo(i + 0.5 + Math.cos(a) * 0.18, j - 0.39 + Math.sin(a) * 0.18); ctx.lineTo(i + 0.5 + Math.cos(a) * 0.28, j - 0.39 + Math.sin(a) * 0.28); ctx.stroke(); }
      } else {
        ctx.fillStyle = '#6b5644';
        for (const px of [0.32, 0.5, 0.68]) ctx.fillRect(i + px - 0.05, j - 0.25, 0.1, 1.1);
      }
      return;
    }
    const col = COLOR_LETRA[pu.letra.toLowerCase()];
    if (pu.permanente) {
      if (pu.abierta) {
        ctx.fillStyle = '#8d8379'; ctx.fillRect(i + 0.02, j + 0.6, 0.18, 0.3); ctx.fillRect(i + 0.8, j + 0.6, 0.18, 0.3);
        return;
      }
      ctx.fillStyle = '#7e746b'; ctx.fillRect(i, j + 0.62, 1, 0.38);
      ctx.fillStyle = '#a3978b'; ctx.fillRect(i, j - 0.38, 1, 1);
      ctx.fillStyle = col; ctx.globalAlpha = 0.6 + Math.sin(reloj * 3) * 0.3;
      ctx.beginPath(); ctx.arc(i + 0.5, j + 0.12, 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a3978b'; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(i + 0.58, j + 0.06, 0.19, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const alto = pu.abierta ? 0.12 : 0.85;
    ctx.fillStyle = '#5b3a24';
    ctx.fillRect(i, j + 0.45, 1, 0.08);
    for (const px of [0.12, 0.5, 0.88]) {
      ctx.fillStyle = '#3d2718'; ctx.fillRect(i + px - 0.08, j + 0.75 - alto, 0.16, alto);
      ctx.fillStyle = col; ctx.fillRect(i + px - 0.06, j + 0.75 - alto, 0.12, alto - 0.03);
    }
    if (!pu.abierta) { ctx.fillStyle = '#3d2718'; ctx.fillRect(i, j + 0.1, 1, 0.1); ctx.fillRect(i, j + 0.45, 1, 0.1); }
  }

  farol(fa, reloj, noche) {
    const ctx = this.ctx, x = fa.x, y = fa.y + 0.1;
    ctx.fillStyle = '#3b2a20'; ctx.fillRect(x - 0.05, y - 1.15, 0.1, 1.15);
    ctx.fillStyle = '#2a1d16'; ctx.fillRect(x - 0.2, y - 1.45, 0.4, 0.08);
    ctx.fillStyle = fa.encendido ? '#ffd36b' : '#5c5048';
    ctx.fillRect(x - 0.15, y - 1.37, 0.3, 0.3);
    ctx.fillStyle = '#2a1d16'; ctx.fillRect(x - 0.18, y - 1.08, 0.36, 0.06);
    if (fa.encendido) {
      const r = 0.9 + Math.sin(reloj * 9 + x) * 0.05;
      const gr = ctx.createRadialGradient(x, y - 1.2, 0.05, x, y - 1.2, r);
      gr.addColorStop(0, 'rgba(255,210,120,0.6)'); gr.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y - 1.2, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  relojDeSol(s, reloj) {
    const ctx = this.ctx, x = s.x, y = s.y;
    if (s.activa) {
      const gr = ctx.createLinearGradient(x, y - 3, x, y);
      gr.addColorStop(0, 'rgba(255,220,130,0)'); gr.addColorStop(1, 'rgba(255,220,130,0.55)');
      ctx.fillStyle = gr; ctx.fillRect(x - 0.32 - Math.sin(reloj * 2) * 0.04, y - 3, 0.64 + Math.sin(reloj * 2) * 0.08, 3);
    }
    ctx.fillStyle = s.activa ? '#c9a24c' : '#8d7f6c';
    ctx.beginPath(); ctx.moveTo(x - 0.05, y + 0.05); ctx.lineTo(x + 0.06, y + 0.05); ctx.lineTo(x + 0.06, y - 0.55); ctx.closePath(); ctx.fill();
  }

  destello(d, reloj) {
    const ctx = this.ctx;
    const k = 1 - d.apagado * 0.7;
    const x = d.x, y = d.y - 0.5 - Math.sin(d.fase) * 0.08;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 0.1, 0.2 * k, 0.07, 0, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createRadialGradient(x, y, 0.02, x, y, 0.55 * k);
    gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.35, 'rgba(255,225,120,0.75)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 0.55 * k, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,240,170,${0.8 * k})`; ctx.lineWidth = 0.04;
    for (let r = 0; r < 6; r++) {
      const a = r / 6 * Math.PI * 2 + reloj * 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 0.18 * k, y + Math.sin(a) * 0.18 * k); ctx.lineTo(x + Math.cos(a) * 0.36 * k, y + Math.sin(a) * 0.36 * k); ctx.stroke();
    }
    ctx.fillStyle = '#5a3a10';
    ctx.fillRect(x - 0.07, y - 0.03, 0.035, 0.05); ctx.fillRect(x + 0.035, y - 0.03, 0.035, 0.05);
  }

  // ---------- Plantas y adornos del desierto ----------
  biznaga(x, y, reloj) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y, 0.32, 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4c9157'; ctx.beginPath(); ctx.ellipse(x, y - 0.32, 0.32, 0.36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a7444'; ctx.lineWidth = 0.035;
    for (const dx of [-0.18, -0.06, 0.06, 0.18]) { ctx.beginPath(); ctx.ellipse(x + dx * 0.4, y - 0.32, Math.abs(dx) * 1.4 + 0.03, 0.34, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x - 0.1, y - 0.45, 0.08, 0.14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcf3d';
    for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 0.09, y - 0.68 + Math.sin(a) * 0.04, 0.06, 0.035, a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#e8572a'; ctx.beginPath(); ctx.arc(x, y - 0.68, 0.035, 0, Math.PI * 2); ctx.fill();
  }

  agave(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y, 0.38, 0.12, 0, 0, Math.PI * 2); ctx.fill();
    const hoja = (a, largo, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a + Math.PI / 2) * 0.07, y - 0.05);
      ctx.lineTo(x + Math.cos(a) * largo, y - 0.05 - Math.sin(a) * largo);
      ctx.lineTo(x + Math.cos(a + Math.PI / 2) * 0.07, y - 0.05);
      ctx.fill();
    };
    for (const [a, l] of [[0.25, 0.5], [2.9, 0.5], [0.7, 0.62], [2.45, 0.62]]) hoja(a, l, '#5f9c8f');
    for (const [a, l] of [[1.15, 0.7], [2.0, 0.7], [1.57, 0.78]]) hoja(a, l, '#77b5a6');
  }

  ocotillo(x, y, reloj) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.ellipse(x, y, 0.25, 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 0.05; ctx.lineCap = 'round';
    const tallos = [[-0.2, 1.7, -0.3], [-0.07, 2.0, -0.1], [0.08, 1.9, 0.15], [0.2, 1.6, 0.32]];
    for (const [dx, alto, incl] of tallos) {
      const s = Math.sin(reloj * 1.2 + dx * 10) * 0.03;
      ctx.beginPath(); ctx.moveTo(x + dx * 0.3, y);
      ctx.quadraticCurveTo(x + dx + incl * 0.5, y - alto * 0.5, x + dx + incl + s, y - alto);
      ctx.stroke();
      ctx.fillStyle = '#e8463a'; ctx.beginPath(); ctx.ellipse(x + dx + incl + s, y - alto - 0.06, 0.04, 0.09, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7fae5a';
      for (let k = 1; k < 5; k++) { const f = k / 5; ctx.fillRect(x + dx * (1 - f) * 0.3 + (dx + incl) * f - 0.03, y - alto * f, 0.06, 0.04); }
    }
  }

  craneo(x, y) {
    const ctx = this.ctx;
    ctx.fillStyle = '#efe6d2';
    ctx.beginPath(); ctx.ellipse(x, y, 0.16, 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(x - 0.08, y + 0.02, 0.16, 0.14, 0.05); ctx.fill();
    ctx.strokeStyle = '#efe6d2'; ctx.lineWidth = 0.045; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 0.13, y - 0.05); ctx.quadraticCurveTo(x - 0.32, y - 0.12, x - 0.3, y - 0.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 0.13, y - 0.05); ctx.quadraticCurveTo(x + 0.32, y - 0.12, x + 0.3, y - 0.28); ctx.stroke();
    ctx.fillStyle = '#5a4a3a';
    ctx.beginPath(); ctx.arc(x - 0.06, y, 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 0.06, y, 0.03, 0, Math.PI * 2); ctx.fill();
  }

  espejo(P, x, y, reloj) {
    const ctx = this.ctx;
    const e = P.espejos.find(m => Math.abs(m.x - x) < 0.01);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y, 0.32, 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8f7a66'; ctx.fillRect(x - 0.25, y - 0.22, 0.5, 0.22);
    ctx.fillStyle = '#6b5644'; ctx.fillRect(x - 0.06, y - 0.6, 0.12, 0.4);
    ctx.fillStyle = '#5a4636'; ctx.beginPath(); ctx.ellipse(x, y - 0.92, 0.3, 0.38, 0, 0, Math.PI * 2); ctx.fill();
    const gr = ctx.createLinearGradient(x - 0.25, y - 1.25, x + 0.25, y - 0.6);
    gr.addColorStop(0, '#e9f7ff'); gr.addColorStop(0.5, '#9fd3ef'); gr.addColorStop(1, '#5fa8cf');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y - 0.92, 0.24, 0.31, 0, 0, Math.PI * 2); ctx.fill();
    if (e && e.activo) {
      const f = (reloj * 0.6) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 - f * 0.6})`; ctx.lineWidth = 0.04;
      ctx.beginPath(); ctx.moveTo(x - 0.16 + f * 0.3, y - 1.12); ctx.lineTo(x - 0.06 + f * 0.3, y - 0.72); ctx.stroke();
      ctx.fillStyle = 'rgba(255,250,220,0.9)';
      ctx.beginPath(); ctx.arc(x + 0.1, y - 1.08, 0.04 + Math.sin(reloj * 6) * 0.015, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(40,40,70,0.35)'; ctx.beginPath(); ctx.ellipse(x, y - 0.92, 0.24, 0.31, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  relojArena(r) {
    const ctx = this.ctx;
    const x = r.x, y = r.y - 0.35 + Math.sin(r.fase) * 0.06;
    const gr = ctx.createRadialGradient(x, y, 0.02, x, y, 0.45);
    gr.addColorStop(0, 'rgba(255,224,138,0.55)'); gr.addColorStop(1, 'rgba(255,224,138,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 0.16, y - 0.24, 0.32, 0.05); ctx.fillRect(x - 0.16, y + 0.19, 0.32, 0.05);
    ctx.fillStyle = 'rgba(220,240,255,0.85)';
    ctx.beginPath(); ctx.moveTo(x - 0.12, y - 0.19); ctx.lineTo(x + 0.12, y - 0.19); ctx.lineTo(x + 0.02, y); ctx.lineTo(x + 0.12, y + 0.19); ctx.lineTo(x - 0.12, y + 0.19); ctx.lineTo(x - 0.02, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9b55c';
    ctx.beginPath(); ctx.moveTo(x - 0.07, y - 0.1); ctx.lineTo(x + 0.07, y - 0.1); ctx.lineTo(x, y - 0.01); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 0.1, y + 0.18); ctx.lineTo(x + 0.1, y + 0.18); ctx.lineTo(x, y + 0.07); ctx.closePath(); ctx.fill();
  }

  rodadora(r) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(r.x, r.y0 + 0.15, 0.25, 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(r.x, r.y - 0.15);
    ctx.rotate(r.giro);
    ctx.strokeStyle = '#a07a4a'; ctx.lineWidth = 0.03;
    for (let k = 0; k < 9; k++) {
      const a = k * 0.7;
      ctx.beginPath(); ctx.ellipse(0, 0, 0.26, 0.12 + (k % 3) * 0.05, a, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  dibujarNubes(P, reloj) {
    if (!P.nubes || !P.nubes.length) return;
    const ctx = this.ctx;
    for (const n of P.nubes) {
      const gr = ctx.createRadialGradient(n.x, n.fila, 0.2, n.x, n.fila, Math.max(n.ancho, n.alto));
      gr.addColorStop(0, 'rgba(40,30,70,0.32)'); gr.addColorStop(0.75, 'rgba(40,30,70,0.22)'); gr.addColorStop(1, 'rgba(40,30,70,0)');
      ctx.save();
      ctx.translate(n.x, n.fila); ctx.scale(1, n.alto / n.ancho); ctx.translate(-n.x, -n.fila);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(n.x, n.fila, n.ancho, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // La nube misma, por encima (algo transparente para no tapar el juego)
    for (const n of P.nubes) {
      const cx = n.x + 0.6, cy = n.fila - 2.4;
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      for (const [dx, dy, r] of [[-0.45, 0.1, 0.55], [0, -0.15, 0.7], [0.5, 0.05, 0.6], [0.95, 0.2, 0.42], [-0.9, 0.22, 0.4]]) {
        ctx.beginPath(); ctx.arc(cx + dx * n.ancho * 0.6, cy + dy, r * n.ancho * 0.45, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Gno: el espíritu del reloj de sol (personaje original).
  gno(j, reloj, estado) {
    if (j.invuln > 0 && Math.floor(reloj * 14) % 2 === 0) return;
    const ctx = this.ctx;
    const x = j.x, y = j.y;
    const alto = j.estirado ? 1.25 : 0.95;
    const bote = j.moviendo ? Math.abs(Math.sin(j.paso)) * 0.05 : Math.sin(reloj * 2.5) * 0.015;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 0.05, 0.28, 0.1, 0, 0, Math.PI * 2); ctx.fill();
    // pies
    const pie = j.moviendo ? Math.sin(j.paso) * 0.06 : 0;
    ctx.fillStyle = '#8f4d2c';
    ctx.beginPath(); ctx.ellipse(x - 0.13, y + 0.02 + pie, 0.09, 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 0.13, y + 0.02 - pie, 0.09, 0.05, 0, 0, Math.PI * 2); ctx.fill();
    const base = y - bote;
    // brazos arriba al estirarse
    if (j.estirado) {
      ctx.strokeStyle = '#b45c35'; ctx.lineWidth = 0.07; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 0.2, base - 0.5); ctx.lineTo(x - 0.34, base - 1.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 0.2, base - 0.5); ctx.lineTo(x + 0.34, base - 1.05); ctx.stroke();
    }
    // cuerpo triangular (como la aguja de un reloj de sol)
    const gr = ctx.createLinearGradient(x - 0.3, 0, x + 0.3, 0);
    gr.addColorStop(0, '#e48a59'); gr.addColorStop(1, '#bf6239');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(x - 0.31, base - 0.04);
    ctx.quadraticCurveTo(x, base + 0.06, x + 0.31, base - 0.04);
    ctx.quadraticCurveTo(x + 0.2, base - alto * 0.6, x + 0.03, base - alto);
    ctx.quadraticCurveTo(x, base - alto - 0.03, x - 0.03, base - alto);
    ctx.quadraticCurveTo(x - 0.2, base - alto * 0.6, x - 0.31, base - 0.04);
    ctx.fill();
    // franja de horas
    ctx.strokeStyle = 'rgba(255,230,190,0.55)'; ctx.lineWidth = 0.025;
    ctx.beginPath(); ctx.moveTo(x - 0.25, base - 0.16); ctx.quadraticCurveTo(x, base - 0.1, x + 0.25, base - 0.16); ctx.stroke();
    // cara
    const fx = x + j.mira * 0.04, fy = base - alto * 0.5;
    ctx.fillStyle = '#fff1d6'; ctx.beginPath(); ctx.ellipse(fx, fy, 0.16, 0.15, 0, 0, Math.PI * 2); ctx.fill();
    const parpadeo = Math.sin(reloj * 1.3) > 0.985;
    ctx.fillStyle = '#2b2230';
    if (estado === 'perdido') {
      ctx.lineWidth = 0.025; ctx.strokeStyle = '#2b2230';
      for (const ex of [-0.06, 0.06]) { ctx.beginPath(); ctx.moveTo(fx + ex - 0.03, fy - 0.03); ctx.lineTo(fx + ex + 0.03, fy + 0.03); ctx.moveTo(fx + ex + 0.03, fy - 0.03); ctx.lineTo(fx + ex - 0.03, fy + 0.03); ctx.stroke(); }
    } else if (parpadeo) {
      ctx.fillRect(fx - 0.09, fy - 0.01, 0.06, 0.02); ctx.fillRect(fx + 0.03, fy - 0.01, 0.06, 0.02);
    } else {
      ctx.beginPath(); ctx.ellipse(fx - 0.06 + j.mira * 0.015, fy, 0.03, 0.045, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(fx + 0.06 + j.mira * 0.015, fy, 0.03, 0.045, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,140,120,0.5)';
    ctx.beginPath(); ctx.arc(fx - 0.11, fy + 0.06, 0.03, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(fx + 0.11, fy + 0.06, 0.03, 0, Math.PI * 2); ctx.fill();
    this.accesorio(x, base - alto, fx, fy, reloj);
  }

  // Retrato de Gno con una vestimenta (para la pantalla de vestuario).
  retrato(cv, id, libre) {
    const g = cv.getContext('2d');
    const ctxAntes = this.ctx, vestAntes = this.vestimenta;
    this.ctx = g; this.vestimenta = id;
    g.clearRect(0, 0, cv.width, cv.height);
    g.save();
    if (!libre) g.filter = 'brightness(0) opacity(0.45)';
    g.setTransform(70, 0, 0, 70, cv.width / 2, cv.height * 0.86);
    this.gno({ x: 0, y: 0, estirado: false, moviendo: false, mira: 1, paso: 0, invuln: 0 }, 0.3, 'jugando');
    g.restore();
    this.ctx = ctxAntes; this.vestimenta = vestAntes;
  }

  // Vestimentas de Gno (se desbloquean con estrellas). Solo cambian el aspecto.
  accesorio(x, punta, fx, fy, reloj) {
    const ctx = this.ctx;
    switch (this.vestimenta) {
      case 'sombrero':
        ctx.fillStyle = '#d9b26a'; ctx.beginPath(); ctx.ellipse(x, punta + 0.2, 0.36, 0.08, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8c47e'; ctx.beginPath(); ctx.ellipse(x, punta + 0.08, 0.15, 0.16, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#b5413a'; ctx.fillRect(x - 0.15, punta + 0.1, 0.3, 0.04);
        ctx.strokeStyle = 'rgba(140,100,40,0.5)'; ctx.lineWidth = 0.02;
        ctx.beginPath(); ctx.ellipse(x, punta + 0.2, 0.28, 0.055, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'paliacate':
        ctx.fillStyle = '#d6363c';
        ctx.beginPath(); ctx.moveTo(fx - 0.2, fy + 0.15); ctx.quadraticCurveTo(fx, fy + 0.27, fx + 0.2, fy + 0.15); ctx.lineTo(fx, fy + 0.36); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        for (const [dx, dy] of [[-0.08, 0.2], [0.06, 0.22], [0, 0.29]]) { ctx.beginPath(); ctx.arc(fx + dx, fy + dy, 0.015, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#7cc36a'; ctx.beginPath(); ctx.ellipse(x + 0.08, punta - 0.05, 0.1, 0.045, -0.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'corona':
        for (let k = 0; k < 5; k++) {
          const a = Math.PI + k / 4 * Math.PI;
          const px = x + Math.cos(a) * 0.13, py = punta + 0.12 + Math.sin(a) * 0.08;
          ctx.fillStyle = ['#ff8fc8', '#ffffff', '#ffd36b', '#ffffff', '#ff8fc8'][k];
          ctx.beginPath(); ctx.arc(px, py, 0.055, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffcf3d'; ctx.beginPath(); ctx.arc(px, py, 0.018, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'farolito': {
        ctx.strokeStyle = '#3b2a20'; ctx.lineWidth = 0.025;
        ctx.beginPath(); ctx.moveTo(x, punta); ctx.lineTo(x + 0.12, punta - 0.18); ctx.stroke();
        const gr = ctx.createRadialGradient(x + 0.14, punta - 0.25, 0.01, x + 0.14, punta - 0.25, 0.3);
        gr.addColorStop(0, 'rgba(255,210,120,0.8)'); gr.addColorStop(1, 'rgba(255,210,120,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + 0.14, punta - 0.25, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd36b'; ctx.fillRect(x + 0.08, punta - 0.32, 0.12, 0.13);
        ctx.fillStyle = '#3b2a20'; ctx.fillRect(x + 0.07, punta - 0.34, 0.14, 0.03);
        break;
      }
      default:
        ctx.fillStyle = '#7cc36a';
        ctx.beginPath(); ctx.ellipse(x + 0.08, punta - 0.05, 0.1, 0.045, -0.5 + Math.sin(reloj * 3) * 0.15, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ---------- Luz ----------
  dibujarTinte(P) {
    const { c, a } = tinte(P.t);
    if (a <= 0.005) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = P.t > 0.9 ? 'source-over' : 'soft-light';
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${P.t > 0.9 ? a : Math.min(1, a * 2.4)})`;
    ctx.fillRect(0, 0, P.w, P.h);
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

  dibujarParticulas(P) {
    const ctx = this.ctx;
    for (const p of P.particulas) {
      ctx.globalAlpha = Math.max(0, p.vida / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 0.06, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  dibujarIndicaciones(P, reloj) {
    const ctx = this.ctx;
    const f = P.farolCercano ? P.farolCercano() : null;
    if (f && P.estado === 'jugando') {
      const y = f.y - 2 + Math.sin(reloj * 4) * 0.05;
      ctx.fillStyle = 'rgba(16,20,34,0.85)'; ctx.beginPath(); ctx.roundRect(f.x - 0.25, y - 0.25, 0.5, 0.5, 0.12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 0.34px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('F', f.x, y + 0.02);
    }
    // Letras de placas y puertas para saber cuál abre cuál
    ctx.font = 'bold 0.26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const pu of P.puertas) {
      if (pu.abierta || pu.solar) continue;
      ctx.fillStyle = COLOR_LETRA[pu.letra.toLowerCase()];
      ctx.fillText(pu.permanente ? '☾' : pu.letra, pu.x, pu.j - 0.55);
    }
  }
}
