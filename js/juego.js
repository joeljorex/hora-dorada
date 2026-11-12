// Lógica de un nivel de HORA DORADA. Todas las medidas están en "casillas" (1 = una casilla del mapa).
import { NIVELES, mapaCompleto, ANCHO, ALTO } from './niveles.js';
import { Sonido } from './audio.js';

export const H_JUGADOR = 1.4;     // altura del personaje (define el largo de la sombra)
export const H_ESTIRADO = 1.95;   // altura con los brazos arriba
// Altura de cada obstáculo (define el largo de su sombra)
export const ALTURAS = { '#': 1.0, n: 0.55, c: 1.7, r: 0.5, b: 0.7, g: 0.6, o: 2.0, E: 1.0, L: 1.3, l: 1.3, A: 1.0, B: 1.0, M: 1.1, S: 1.2, T: 0.8, U: 1.6, Y: 0.8 };
const SOLIDOS = new Set(['#', 'n', 'c', 'r', 'w', 'b', 'g', 'o', 'E', 'L', 'l', 'F', 'T', 'U', 'Y']);
// Mecánica 3D: mesetas de roca a las que Gno se sube saltando (eje Z).
export const MESETAS = { T: 0.8, U: 1.6, Y: 0.8 };
export const ALTO_PLATAFORMA = 0.8;   // plataformas que se mueven sobre el agua
const SALTO = 5.4;        // velocidad inicial del salto (casillas/s): sube ~0.97
const GRAVEDAD = 15;
const VEL = 3.6;
const R_JUG = 0.3;
const RITMO_RELOJ = 0.22;   // cuánto día se mueve por segundo al usar Q/E
const RADIO_FAROL = 9;
const RADIO_ESPEJO = 7;
const ALTO_LUZ = 2.2;
const SOMBRA_MAX_SOL = 12;
const SOMBRA_MAX_LUZ = 10;
export const MEDIODIA = [0.4, 0.6];   // horas en que abre la puerta solar

// Puntaje (ver GDD §17)
export const PUNTOS = { ventaja: 50, flor: 100, destello: 50, sello: 200, reloj: 30, golpe: -50, arenaPorciento: 5, vida: 100, rapidezSeg: 2, rapidezLimite: 180 };

// ---------- Ventajas, eventos y retos (cambian en cada intento para que cada nivel sea distinto) ----------
export const VENTAJAS = {
  sombraLarga: { nombre: 'Sombra larga', dur: 15, desc: 'Tu sombra mide 50 % más' },
  prisa: { nombre: 'Prisa', dur: 12, desc: 'Caminas más rápido' },
  solQuieto: { nombre: 'Tiempo quieto', dur: 12, desc: 'El sol (o la vela) se detiene' },
  saltoAlto: { nombre: 'Salto alto', dur: 15, desc: 'Saltas más alto' },
  escudo: { nombre: 'Escudo', dur: 10, desc: 'Los destellos no te dañan' },
  corazon: { nombre: 'Corazón', dur: 0, desc: '+1 corazón' },
  doblePuntos: { nombre: 'Doble puntos', dur: 20, desc: 'Ganas el doble de puntos' },
  florRapida: { nombre: 'Semilla mágica', dur: 15, desc: 'Las flores abren al doble de rápido' },
};
export const EVENTOS = {
  brisa: { nombre: 'Brisa del desierto', desc: 'Pasan nubes y rodadoras extra' },
  diaVeloz: { nombre: 'Día veloz', desc: 'El sol avanza más rápido, pero ganas 50 % más puntos' },
  lluvia: { nombre: 'Lluvia de ventajas', desc: 'Aparecen más ventajas' },
  tesoro: { nombre: 'Tesoro de arena', desc: 'Hay relojes de arena escondidos' },
  inquietos: { nombre: 'Destellos inquietos', desc: 'Los destellos van más rápido y valen el doble' },
};
export const RETOS = {
  sinGolpes: { nombre: 'Termina sin perder corazones', bono: 300 },
  ventajas2: { nombre: 'Recoge 2 ventajas', bono: 300 },
  destellos: { nombre: 'Apaga todos los destellos', bono: 400 },
  arena: { nombre: 'Termina con la mitad de arena o más', bono: 300 },
  rapido: { nombre: 'Termina en menos de 2 minutos y medio', bono: 300 },
};
const azar = arr => arr[Math.floor(Math.random() * arr.length)];

// Posición del sol según la hora (t: 0 = amanecer, 1 = anochecer).
// Devuelve hacia dónde cae la sombra (dx, dy) y la tangente de la elevación del sol.
export function sol(t) {
  const a = Math.PI * Math.min(1, Math.max(0, t));
  const elev = Math.max(0.02, Math.sin(a)) * 1.25;
  return { dx: -Math.cos(a), dy: -Math.sin(a), tanE: Math.tan(elev) };
}

// Cámara giratoria (mecánica 3D): la vista puede girar en pasos de 90°. El sol está fijo respecto a la cámara
// (sale por la derecha de la pantalla), así que al girar la cámara cambia hacia dónde caen las sombras en el mapa.
// k = número de giros de 90° (0 = norte arriba, 1 = oeste arriba, 2 = sur arriba, 3 = este arriba).
export function dirAMapa(dx, dy, k) {
  switch (k & 3) { case 1: return { dx: dy, dy: -dx }; case 2: return { dx: -dx, dy: -dy }; case 3: return { dx: -dy, dy: dx }; default: return { dx, dy }; }
}
export function dirAVista(dx, dy, k) {
  switch (k & 3) { case 1: return { dx: -dy, dy: dx }; case 2: return { dx: -dx, dy: -dy }; case 3: return { dx: dy, dy: -dx }; default: return { dx, dy }; }
}
export const RUMBO_ARRIBA = ['N', 'O', 'S', 'E'];

// Hora "de reloj" para mostrar: 6:00 a 19:00
export function horaTexto(t) {
  const min = Math.round(6 * 60 + Math.min(1, Math.max(0, t)) * 13 * 60);
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

export class Partida {
  constructor(indice, { demo = false } = {}) {
    this.indice = indice;
    this.def = NIVELES[indice];
    this.demo = demo;
    this.eventos = [];
    this.cargar();
  }

  cargar() {
    const filas = mapaCompleto(this.def);
    this.grid = filas.map(f => f.split(''));
    this.w = ANCHO; this.h = ALTO;
    this.flores = []; this.placas = []; this.puertas = []; this.destellos = []; this.faroles = [];
    this.espejos = []; this.relojes = []; this.rodadoras = []; this.plataformas = [];
    this.puertaEn = new Map();
    this.particulas = [];
    this.salida = null;
    this.vista = 0;
    let inicio = { x: 2.5, y: 2.5 };
    for (let j = 0; j < this.h; j++) {
      for (let i = 0; i < this.w; i++) {
        const ch = this.grid[j][i];
        const cx = i + 0.5, cy = j + 0.5;
        if (ch === 'P') { inicio = { x: cx, y: cy }; this.grid[j][i] = '.'; }
        else if (ch === 'F') this.flores.push({ i, j, x: cx, y: cy, p: 0, abierta: false, anim: 0 });
        else if (ch === 'X') this.salida = { i, j, x: cx, y: cy, activa: false, anim: 0 };
        // Placas: "a" abre A, "q" abre B ("b" es biznaga), "m" es sello lunar.
        else if (ch === 'a' || ch === 'q' || ch === 'm') { this.placas.push({ i, j, x: cx, y: cy, letra: ch === 'q' ? 'b' : ch, activa: false }); this.grid[j][i] = '.'; }
        else if (ch === 'A' || ch === 'B' || ch === 'M' || ch === 'S') {
          const p = { i, j, x: cx, y: cy, letra: ch, abierta: false, permanente: ch === 'M', solar: ch === 'S', anim: 0 };
          this.puertas.push(p); this.puertaEn.set(j * this.w + i, p);
        }
        else if (ch === 'd' || ch === 'v') { this.destellos.push({ x: cx, y: cy, eje: ch === 'd' ? 'h' : 'v', dir: Math.random() < 0.5 ? 1 : -1, vel: 2.2, apagado: 0, muerto: false, fase: Math.random() * 6 }); this.grid[j][i] = '.'; }
        else if (ch === 'L' || ch === 'l') this.faroles.push({ i, j, x: cx, y: cy, encendido: ch === 'L' });
        else if (ch === 'E') this.espejos.push({ i, j, x: cx, y: cy, activo: false });
        else if (ch === 'h') { this.relojes.push({ x: cx, y: cy, tomado: false, fase: Math.random() * 6 }); this.grid[j][i] = '.'; }
        else if (ch === 'H' || ch === 'K') { this.plataformas.push({ x: cx, y: cy, eje: ch === 'H' ? 'h' : 'v', dir: 1, vel: 1.3 }); this.grid[j][i] = 'w'; }
        else if (ch === 'u') { this.rodadoras.push({ x: cx, y: cy, y0: cy, vel: 1.2 + Math.random() * 0.8, giro: 0 }); this.grid[j][i] = '.'; }
      }
    }
    this.nubes = (this.def.nubes || []).map(n => ({ ...n, x: n.x0 }));
    this.inicio = { x: inicio.x, y: inicio.y, z: 0 };
    this.jugador = { x: inicio.x, y: inicio.y, z: 0, vz: 0, piso: 0, enAire: false, vida: 3, invuln: 0, estirado: false, mira: 1, paso: 0, moviendo: false };
    this.noche = this.def.tipo === 'noche';
    this.t = this.noche ? 0.5 : this.def.t0;
    this.arenaMax = this.def.arena || 0; this.arena = this.arenaMax;
    this.velaMax = this.def.vela || 0; this.vela = this.velaMax;
    this.estado = 'jugando';
    this.motivo = '';
    this.tiempo = 0;
    this.sombras = [];
    this.usandoReloj = 0;
    this.puntos = 0;
    this.conteo = { flores: 0, destellos: 0, sellos: 0, relojes: 0, golpes: 0, ventajas: 0 };
    this.efectos = {}; this.ventajas = []; this.bono = 0;
    this.multEvento = 1; this.multDestello = 1; this.ritmoDia = 1; this.proximaVentaja = 18;
    this.celdasLibres = this.calcularCeldasLibres();
    if (!this.demo) {
      this.elegirEvento();
      this.elegirReto();
      for (let k = 0; k < (this.evento.id === 'lluvia' ? 4 : 2); k++) this.generarVentaja();
    }
    this.todasAbiertas = this.flores.length === 0;
    if (this.salida && this.todasAbiertas) this.salida.activa = true;
    this.actualizarNubes();
    this.calcularSombras();
  }

  // Casillas de piso a las que se puede llegar desde el inicio (para poner ventajas y objetos del evento)
  calcularCeldasLibres() {
    const ini = [Math.floor(this.inicio.x), Math.floor(this.inicio.y)], vis = new Set([ini.join()]), cola = [ini], libres = [];
    while (cola.length) {
      const [i, j] = cola.pop();
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + a, nj = j + b, k = ni + ',' + nj;
        if (vis.has(k) || this.esSolido(ni, nj) || this.celda(ni, nj) === 'w') continue;
        vis.add(k); cola.push([ni, nj]);
      }
    }
    for (const k of vis) {
      const [i, j] = k.split(',').map(Number);
      if (Math.hypot(i + 0.5 - this.inicio.x, j + 0.5 - this.inicio.y) < 2.5) continue;
      if (this.placas.some(p => p.i === i && p.j === j) || (this.salida && this.salida.i === i && this.salida.j === j)) continue;
      libres.push([i, j]);
    }
    return libres;
  }
  celdaLibre() {
    const ocupada = (i, j) => [...this.ventajas, ...this.relojes, ...this.rodadoras].some(o => Math.floor(o.x) === i && Math.floor(o.y0 ?? o.y) === j);
    const opciones = this.celdasLibres.filter(([i, j]) => !ocupada(i, j));
    return opciones.length ? azar(opciones) : null;
  }
  generarVentaja() {
    const c = this.celdaLibre();
    if (!c) return;
    let tipos = Object.keys(VENTAJAS);
    if (!this.destellos.length) tipos = tipos.filter(t => t !== 'escudo');
    if (!this.flores.some(f => !f.abierta)) tipos = tipos.filter(t => t !== 'florRapida');
    this.ventajas.push({ x: c[0] + 0.5, y: c[1] + 0.5, tipo: azar(tipos), vida: 30, fase: Math.random() * 6 });
  }
  elegirEvento() {
    const ids = ['lluvia', 'tesoro'];
    if (!this.noche) ids.push('brisa');
    if (!this.noche && this.arenaMax > 0) ids.push('diaVeloz');
    if (this.destellos.length) ids.push('inquietos');
    const id = azar(ids);
    this.evento = { id, ...EVENTOS[id] };
    if (id === 'brisa') {
      for (let k = 0; k < 2; k++) this.nubes.push({ fila: 2 + Math.random() * (this.h - 4), ancho: 2.2 + Math.random(), alto: 1.6, vel: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.5), x0: Math.random() * this.w });
      for (let k = 0; k < 3; k++) { const c = this.celdaLibre(); if (c) this.rodadoras.push({ x: c[0] + 0.5, y: c[1] + 0.5, y0: c[1] + 0.5, vel: 1.2 + Math.random() * 0.8, giro: 0 }); }
    } else if (id === 'diaVeloz') { this.ritmoDia = 1.3; this.multEvento = 1.5; }
    else if (id === 'tesoro') { for (let k = 0; k < 2; k++) { const c = this.celdaLibre(); if (c) this.relojes.push({ x: c[0] + 0.5, y: c[1] + 0.5, tomado: false, fase: Math.random() * 6 }); } }
    else if (id === 'inquietos') { for (const d of this.destellos) d.vel *= 1.5; this.multDestello = 2; }
    else if (id === 'lluvia') this.proximaVentaja = 10;
  }
  elegirReto() {
    const ids = ['ventajas2', 'rapido'];
    if (this.destellos.length) ids.push('sinGolpes', 'destellos');
    if (!this.noche && this.arenaMax > 0) ids.push('arena');
    const id = azar(ids);
    this.reto = { id, ...RETOS[id] };
  }
  retoCumplido() {
    const r = this.reto && this.reto.id;
    if (r === 'sinGolpes') return this.conteo.golpes === 0;
    if (r === 'ventajas2') return this.conteo.ventajas >= 2;
    if (r === 'destellos') return this.destellos.every(d => d.muerto);
    if (r === 'arena') return this.arenaMax > 0 && this.arena / this.arenaMax >= 0.5;
    if (r === 'rapido') return this.tiempo <= 150;
    return false;
  }
  // Recoger ventajas, que expiren sus efectos y que aparezcan nuevas con el tiempo
  actualizarVentajas(dt) {
    const j = this.jugador;
    for (const k of Object.keys(this.efectos)) {
      this.efectos[k] -= dt;
      if (this.efectos[k] <= 0) { delete this.efectos[k]; this.eventos.push({ tipo: 'ventajaFin', datos: { tipo: k } }); }
    }
    for (const v of this.ventajas) {
      v.vida -= dt; v.fase += dt * 3;
      if (Math.hypot(v.x - j.x, v.y - j.y) < 0.6 && j.z < 1.2) {
        v.vida = 0;
        const def = VENTAJAS[v.tipo];
        if (v.tipo === 'corazon') j.vida = Math.min(4, j.vida + 1);
        else this.efectos[v.tipo] = def.dur;
        if (v.tipo === 'escudo') j.invuln = Math.max(j.invuln, 0);
        this.sumar('ventaja');
        for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; this.particula(v.x, v.y - 0.4, k % 2 ? '#ffe9a8' : '#a8f0ff', Math.cos(a) * 2.5, Math.sin(a) * 2.5 - 0.5, 0.7); }
        this.emitir('ventaja', { tipo: v.tipo });
      }
    }
    this.ventajas = this.ventajas.filter(v => v.vida > 0);
    if (this.demo) return;
    this.proximaVentaja -= dt;
    if (this.proximaVentaja <= 0) {
      if (this.ventajas.length < 3) this.generarVentaja();
      this.proximaVentaja = (this.evento && this.evento.id === 'lluvia' ? 10 : 20) + Math.random() * 10;
    }
  }

  emitir(tipo, datos) { this.eventos.push({ tipo, datos }); if (!this.demo) Sonido.sfx(tipo); }
  sumar(tipo) {
    this.conteo[tipo + 's'] = (this.conteo[tipo + 's'] || 0) + 1;
    let p = PUNTOS[tipo];
    if (p > 0) {
      // Doble puntos (ventaja) y multiplicadores del evento del nivel
      const m = ((this.efectos && this.efectos.doblePuntos) ? 2 : 1) * (this.multEvento || 1) * (tipo === 'destello' ? (this.multDestello || 1) : 1);
      this.bono = (this.bono || 0) + Math.round(p * (m - 1));
      p = Math.round(p * m);
    }
    this.puntos += p;
  }

  // ---------- Mapa ----------
  celda(i, j) { return i < 0 || j < 0 || i >= this.w || j >= this.h ? '#' : this.grid[j][i]; }
  esSolido(i, j) {
    const ch = this.celda(i, j);
    if (SOLIDOS.has(ch)) return true;
    const p = this.puertaEn.get(j * this.w + i);
    return p ? !p.abierta : false;
  }
  // Altura del piso donde se puede estar parado (0 = arena; las mesetas son más altas).
  pisoEn(x, y) {
    let p = MESETAS[this.celda(Math.floor(x), Math.floor(y))] || 0;
    for (const pl of this.plataformas) if (Math.abs(x - pl.x) <= 0.5 && Math.abs(y - pl.y) <= 0.5) p = Math.max(p, ALTO_PLATAFORMA);
    return p;
  }
  plataformaBajo(x, y) { return this.plataformas.find(pl => Math.abs(x - pl.x) <= 0.5 && Math.abs(y - pl.y) <= 0.5) || null; }
  // Para el jugador, una meseta solo es pared si está más abajo que su parte de arriba.
  esSolidoJugador(i, j) {
    const ch = this.celda(i, j), m = MESETAS[ch];
    if (m !== undefined) return this.jugador.z < m - 0.05;
    if (ch === 'w') return this.jugador.z < 0.75;   // saltando se puede pasar sobre el agua
    return this.esSolido(i, j);
  }
  alturaEn(i, j) {
    const ch = this.celda(i, j);
    const p = this.puertaEn.get(j * this.w + i);
    if (p) return p.abierta ? 0 : ALTURAS[p.letra];
    return ALTURAS[ch] || 0;
  }

  // ---------- Nubes ----------
  actualizarNubes() {
    for (const n of this.nubes) {
      const per = this.w + n.ancho * 2;
      n.x = (((n.x0 + n.vel * this.tiempo) % per) + per) % per - n.ancho;
    }
  }
  bajoNube(x, y) {
    for (const n of this.nubes) {
      const dx = (x - n.x) / n.ancho, dy = (y - n.fila) / n.alto;
      if (dx * dx + dy * dy <= 1) return true;
    }
    return false;
  }

  // ---------- Sombras ----------
  sombraDeLuz(lx, ly, radio, h) {
    const j = this.jugador;
    const vx = j.x - lx, vy = j.y - ly, d = Math.hypot(vx, vy);
    if (d > radio || d < 0.35) return null;
    // Si Gno está en alto, su sombra empieza más lejos (la de sus pies) y termina más lejos (la de su cabeza).
    const z = j.z, arriba = h + z;
    const total = Math.min(SOMBRA_MAX_LUZ, arriba * d / Math.max(0.25, ALTO_LUZ - arriba * 0.55));
    const inicio = z > 0.01 ? Math.min(total, z * d / Math.max(0.25, ALTO_LUZ - z * 0.55)) : 0;
    const dx = vx / d, dy = vy / d;
    return { ox: j.x + dx * inicio, oy: j.y + dy * inicio, dx, dy, L: total - inicio };
  }

  calcularSombras() {
    const j = this.jugador;
    const h = (j.estirado ? H_ESTIRADO : H_JUGADOR) * (this.efectos && this.efectos.sombraLarga ? 1.5 : 1);
    this.sombras.length = 0;
    if (!this.noche) {
      // La dirección del sol se calcula en la pantalla y se pasa al mapa según la cámara.
      const sv = sol(this.t), m = dirAMapa(sv.dx, sv.dy, this.vista);
      const s = { dx: m.dx, dy: m.dy, tanE: sv.tanE };
      this.sol = s;
      this.jugadorBajoNube = this.bajoNube(j.x, j.y);
      if (!this.jugadorBajoNube) {
        // Eje Z: la sombra de los pies cae a z/tanE y la de la cabeza a (z + h)/tanE.
        const total = Math.min(SOMBRA_MAX_SOL, (h + j.z) / s.tanE);
        const inicio = Math.min(total, j.z / s.tanE);
        this.sombras.push({ ox: j.x + s.dx * inicio, oy: j.y + s.dy * inicio, dx: s.dx, dy: s.dy, L: total - inicio, fuente: 'sol' });
      }
      for (const e of this.espejos) {
        e.activo = this.t > 0.03 && this.t < 0.97 && !this.bajoNube(e.x, e.y) && !this.enSombraDeObjeto(e.x, e.y + 0.6);
        if (!e.activo) continue;
        const s2 = this.sombraDeLuz(e.x, e.y, RADIO_ESPEJO, h);
        if (s2) { s2.fuente = e; this.sombras.push(s2); }
      }
    } else {
      this.sol = null;
      this.jugadorBajoNube = false;
      for (const f of this.faroles) {
        if (!f.encendido) continue;
        const s2 = this.sombraDeLuz(f.x, f.y, RADIO_FAROL, h);
        if (s2) { s2.fuente = f; this.sombras.push(s2); }
      }
    }
  }

  // ¿Alguna sombra del jugador cubre el punto (px, py) con radio r?
  cubre(px, py, r) {
    for (const s of this.sombras) {
      const qx = px - s.ox, qy = py - s.oy;
      const a = qx * s.dx + qy * s.dy;
      if (a < 0.25 || a > s.L + 0.2) continue;
      const perp = Math.abs(qx * s.dy - qy * s.dx);
      const ancho = 0.3 - 0.08 * Math.min(1, a / s.L);
      if (perp <= ancho + r) return true;
    }
    return false;
  }

  // ¿El punto está en la sombra de un muro u obstáculo? (solo de día)
  enSombraDeObjeto(x, y) {
    if (!this.sol) return false;
    const s = this.sol;
    const max = Math.min(SOMBRA_MAX_SOL, 2.0 / s.tanE);
    for (let k = 0.15; k <= max; k += 0.2) {
      const i = Math.floor(x - s.dx * k), j = Math.floor(y - s.dy * k);
      const h = this.alturaEn(i, j);
      if (h > 0 && k <= Math.min(SOMBRA_MAX_SOL, h / s.tanE)) return true;
    }
    return false;
  }

  // ---------- Actualización ----------
  actualizar(dt, inp) {
    if (this.estado !== 'jugando') { this.actualizarParticulas(dt); return; }
    this.tiempo += dt;
    this.actualizarNubes();
    this.actualizarRodadoras(dt);
    if (this.demo) { this.t = (this.t + dt / 30) % 1; this.calcularSombras(); this.actualizarObjetos(dt); this.actualizarParticulas(dt); return; }

    this.actualizarTiempo(dt, inp);
    if (this.estado !== 'jugando') return;
    this.actualizarPlataformas(dt);
    this.actualizarJugador(dt, inp);
    this.calcularSombras();
    this.actualizarObjetos(dt);
    this.actualizarVentajas(dt);
    this.actualizarDestellos(dt);
    this.actualizarRelojes(dt);
    this.actualizarParticulas(dt);
    if (inp.usar) this.usar();
    if (this.salida && this.salida.activa && Math.hypot(this.jugador.x - this.salida.x, this.jugador.y - this.salida.y) < 0.6) this.ganar();
  }

  actualizarTiempo(dt, inp) {
    this.usandoReloj = 0;
    if (this.noche) {
      if (!this.efectos.solQuieto) this.vela -= dt;
      if (this.vela <= 0) { this.vela = 0; this.perder('Se apagaron las velas de los faroles'); }
      return;
    }
    if (!this.efectos.solQuieto) this.t += dt / this.def.dia * this.ritmoDia;
    const dir = (inp.adelantar ? 1 : 0) - (inp.atrasar ? 1 : 0);
    if (dir !== 0) {
      if (this.arena > 0) {
        this.t += dir * RITMO_RELOJ * dt;
        this.arena = Math.max(0, this.arena - dt);
        this.usandoReloj = dir;
      } else if (!this.demo) Sonido.sfx('sinArena');
    }
    this.t = Math.max(0, this.t);
    if (this.t >= 1) { this.t = 1; this.perder('Se hizo de noche antes de terminar'); }
  }

  actualizarJugador(dt, inp) {
    const j = this.jugador;
    j.invuln = Math.max(0, j.invuln - dt);
    const antes = j.estirado;
    j.estirado = !!inp.estirar;
    if (j.estirado && !antes) Sonido.sfx('estirar');
    // Los controles son relativos a la pantalla: se pasan al mapa según la cámara.
    const dm = dirAMapa(inp.x, inp.y, this.vista);
    let mx = dm.dx, my = dm.dy;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    if (j.estirado) { mx = 0; my = 0; }
    j.moviendo = len > 0.1 && !j.estirado;
    // Hacia dónde mira: según el control (en pantalla), no según cómo lo empujan los choques
    if (len > 0.1) j.mirada = { x: inp.x / len, y: inp.y / len };
    if (Math.abs(mx) > 0.1) j.mira = mx > 0 ? 1 : -1;
    if (j.moviendo) j.paso += dt * 10;
    if (j.empuje) {
      mx += j.empuje.x; my += j.empuje.y;
      j.empuje.x *= Math.exp(-dt * 8); j.empuje.y *= Math.exp(-dt * 8);
      if (Math.hypot(j.empuje.x, j.empuje.y) < 0.05) j.empuje = null;
    }
    const vel = VEL * (this.efectos.prisa ? 1.5 : 1);
    j.x += mx * vel * dt; this.resolverColision();
    j.y += my * vel * dt; this.resolverColision();
    this.actualizarAltura(dt, inp);
  }

  // Plataformas que se mueven sobre el agua y se dan la vuelta al llegar a la orilla. Si Gno está encima, lo llevan.
  actualizarPlataformas(dt) {
    const j = this.jugador;
    for (const pl of this.plataformas) {
      const v = pl.vel * dt * pl.dir;
      const nx = pl.x + (pl.eje === 'h' ? v : 0), ny = pl.y + (pl.eje === 'v' ? v : 0);
      const fx = nx + (pl.eje === 'h' ? 0.5 * pl.dir : 0), fy = ny + (pl.eje === 'v' ? 0.5 * pl.dir : 0);
      const otra = this.plataformas.some(q => q !== pl && Math.abs(q.x - nx) < 1 && Math.abs(q.y - ny) < 1);
      if (this.celda(Math.floor(fx + (pl.eje === 'h' ? -0.001 * pl.dir : 0)), Math.floor(fy + (pl.eje === 'v' ? -0.001 * pl.dir : 0))) !== 'w' || otra) { pl.dir *= -1; continue; }
      const encima = !j.enAire && Math.abs(j.z - ALTO_PLATAFORMA) < 0.03 && Math.abs(j.x - pl.x) <= 0.5 && Math.abs(j.y - pl.y) <= 0.5;
      const dx = nx - pl.x, dy = ny - pl.y;
      pl.x = nx; pl.y = ny;
      if (encima) { j.x += dx; j.y += dy; this.resolverColision(); }
    }
  }

  // Girar la cámara 90° (d = +1 a la derecha, −1 a la izquierda).
  girarCamara(d) {
    if (this.estado !== 'jugando') return false;
    this.vista = (this.vista + d + 4) % 4;
    if (!this.demo) Sonido.sfx('girar');
    return true;
  }

  // Salto y gravedad (eje Z). Se aterriza en la arena o encima de una meseta.
  actualizarAltura(dt, inp) {
    const j = this.jugador;
    j.piso = this.pisoEn(j.x, j.y);
    if (inp.saltar && !j.enAire && !j.estirado) {
      // Si salta desde una plataforma que se mueve, conserva su impulso
      const pl = Math.abs(j.z - ALTO_PLATAFORMA) < 0.03 ? this.plataformaBajo(j.x, j.y) : null;
      j.arrastre = pl ? { x: pl.eje === 'h' ? pl.vel * pl.dir : 0, y: pl.eje === 'v' ? pl.vel * pl.dir : 0 } : null;
      j.vz = SALTO * (this.efectos.saltoAlto ? 1.25 : 1); j.enAire = true;
      if (!this.demo) Sonido.sfx('saltar');
    }
    if (j.enAire || j.z > j.piso + 1e-3) {
      j.enAire = true;
      j.vz -= GRAVEDAD * dt;
      j.z += j.vz * dt;
      if (j.arrastre) { j.x += j.arrastre.x * dt; j.y += j.arrastre.y * dt; this.resolverColision(); j.piso = this.pisoEn(j.x, j.y); }
      if (j.z <= j.piso) {
        j.z = j.piso; j.vz = 0; j.enAire = false; j.arrastre = null;
        if (j.piso === 0 && this.celda(Math.floor(j.x), Math.floor(j.y)) === 'w') { this.caerAlAgua(); return; }
        if (!this.demo) Sonido.sfx('aterrizar');
        for (let k = 0; k < 6; k++) this.particula(j.x + (Math.random() - 0.5) * 0.5, j.y - j.z * 0.6, '#e9c487', (Math.random() - 0.5) * 1.5, -Math.random(), 0.35);
      }
    } else j.z = j.piso;
    // Último lugar firme (no agua ni plataforma que se mueve) para volver si cae al agua
    if (!j.enAire && !this.plataformaBajo(j.x, j.y) && this.celda(Math.floor(j.x), Math.floor(j.y)) !== 'w') j.seguro = { x: j.x, y: j.y, z: j.z };
  }

  caerAlAgua() {
    const j = this.jugador;
    for (let k = 0; k < 16; k++) this.particula(j.x + (Math.random() - 0.5) * 0.6, j.y, k % 2 ? '#9fdcf0' : '#ffffff', (Math.random() - 0.5) * 2, -Math.random() * 3, 0.6);
    if (!this.demo) Sonido.sfx('agua');
    const s = j.seguro || this.inicio;
    j.x = s.x; j.y = s.y; j.z = s.z; j.vz = 0; j.invuln = 1;
  }

  resolverColision() {
    const j = this.jugador, r = R_JUG;
    for (let it = 0; it < 2; it++) {
      const i0 = Math.floor(j.x - r), i1 = Math.floor(j.x + r), j0 = Math.floor(j.y - r), j1 = Math.floor(j.y + r);
      for (let jj = j0; jj <= j1; jj++) {
        for (let ii = i0; ii <= i1; ii++) {
          if (!this.esSolidoJugador(ii, jj)) continue;
          const cx = Math.max(ii, Math.min(j.x, ii + 1)), cy = Math.max(jj, Math.min(j.y, jj + 1));
          const dx = j.x - cx, dy = j.y - cy, d2 = dx * dx + dy * dy;
          if (d2 >= r * r) continue;
          if (d2 > 1e-9) {
            const d = Math.sqrt(d2), emp = (r - d) / d;
            j.x += dx * emp; j.y += dy * emp;
          } else {
            const izq = j.x - ii, der = ii + 1 - j.x, arr = j.y - jj, aba = jj + 1 - j.y;
            const m = Math.min(izq, der, arr, aba);
            if (m === izq) j.x = ii - r; else if (m === der) j.x = ii + 1 + r; else if (m === arr) j.y = jj - r; else j.y = jj + 1 + r;
          }
        }
      }
    }
  }

  jugadorTocaCelda(i, jj) {
    const j = this.jugador;
    const cx = Math.max(i, Math.min(j.x, i + 1)), cy = Math.max(jj, Math.min(j.y, jj + 1));
    return Math.hypot(j.x - cx, j.y - cy) < R_JUG + 0.02;
  }

  actualizarObjetos(dt) {
    // Flores
    let abiertas = 0;
    for (const f of this.flores) {
      f.anim += dt;
      if (f.abierta) { abiertas++; continue; }
      if (this.cubre(f.x, f.y, 0.38)) {
        f.p += dt / 0.8 * (this.efectos.florRapida ? 2 : 1);
        if (Math.random() < 0.3) this.particula(f.x + (Math.random() - 0.5) * 0.6, f.y - 0.2, '#e8d6ff', 0, -0.6, 0.6);
        if (!this.demo) Sonido.sfx('crece');
        if (f.p >= 1) {
          f.abierta = true; f.p = 1; f.anim = 0; abiertas++;
          if (!this.demo) this.sumar('flor');
          for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; this.particula(f.x, f.y - 0.3, k % 2 ? '#ffffff' : '#ffe9a8', Math.cos(a) * 2, Math.sin(a) * 2 - 0.5, 0.8); }
          this.emitir('flor');
        }
      } else f.p = Math.max(0, f.p - dt * 0.6);
    }
    if (!this.todasAbiertas && abiertas === this.flores.length) {
      this.todasAbiertas = true;
      if (this.salida) this.salida.activa = true;
      this.emitir('todas');
    }
    if (this.salida) this.salida.anim += dt;

    // Placas
    for (const p of this.placas) {
      const antes = p.activa;
      p.activa = this.cubre(p.x, p.y, 0.42);
      if (p.activa !== antes && !this.demo) Sonido.sfx(p.activa ? 'placa' : 'placaOff');
    }
    // Puertas
    for (const pu of this.puertas) {
      pu.anim += dt;
      const antes = pu.abierta;
      if (pu.solar) {
        const mediodia = !this.noche && this.t >= MEDIODIA[0] && this.t <= MEDIODIA[1];
        pu.abierta = mediodia || (antes && this.jugadorTocaCelda(pu.i, pu.j));
      } else {
        const letra = pu.letra.toLowerCase();
        const suyas = this.placas.filter(p => p.letra === letra);
        const todas = suyas.length > 0 && suyas.every(p => p.activa);
        if (pu.permanente) { if (todas) pu.abierta = true; }
        else pu.abierta = todas || (antes && this.jugadorTocaCelda(pu.i, pu.j));
      }
      if (pu.abierta !== antes) {
        pu.anim = 0;
        if (pu.permanente && !this.demo) this.sumar('sello');
        this.emitir(pu.permanente ? 'sello' : 'puerta', pu);
        for (let k = 0; k < 10; k++) this.particula(pu.x + (Math.random() - 0.5), pu.y + (Math.random() - 0.5) * 0.4, pu.solar ? '#ffd36b' : '#c9a27a', (Math.random() - 0.5) * 2, -Math.random() * 2, 0.5);
      }
    }
  }

  actualizarDestellos(dt) {
    const j = this.jugador;
    for (const d of this.destellos) {
      if (d.muerto) continue;
      d.fase += dt * 6;
      if (this.cubre(d.x, d.y, 0.3)) {
        d.apagado += dt / 0.5;
        if (Math.random() < 0.5) this.particula(d.x, d.y - 0.4, '#fff3b0', (Math.random() - 0.5) * 2, -Math.random() * 2, 0.4);
        if (d.apagado >= 1) {
          d.muerto = true;
          this.sumar('destello');
          for (let k = 0; k < 20; k++) { const a = Math.random() * 6.28; this.particula(d.x, d.y - 0.4, k % 2 ? '#fff7cf' : '#ffd36b', Math.cos(a) * 3, Math.sin(a) * 3, 0.6); }
          this.emitir('destello');
          continue;
        }
      } else d.apagado = Math.max(0, d.apagado - dt * 0.8);
      const v = d.vel * (1 - d.apagado * 0.8) * dt * d.dir;
      const nx = d.x + (d.eje === 'h' ? v : 0), ny = d.y + (d.eje === 'v' ? v : 0);
      const adelante = { x: nx + (d.eje === 'h' ? 0.35 * d.dir : 0), y: ny + (d.eje === 'v' ? 0.35 * d.dir : 0) };
      const choca = this.esSolido(Math.floor(adelante.x), Math.floor(adelante.y));
      const aSombra = !this.enSombraDeObjeto(d.x, d.y) && this.enSombraDeObjeto(adelante.x, adelante.y);
      if (choca || aSombra) d.dir *= -1; else { d.x = nx; d.y = ny; }
      if (j.invuln <= 0 && j.z < 0.5 && !this.efectos.escudo && Math.hypot(d.x - j.x, d.y - j.y) < 0.6) {
        j.vida--; j.invuln = 1.3;
        this.sumar('golpe');
        const dx = j.x - d.x, dy = j.y - d.y, l = Math.hypot(dx, dy) || 1;
        j.empuje = { x: dx / l * 2.5, y: dy / l * 2.5 };
        this.emitir('danio');
        for (let k = 0; k < 12; k++) this.particula(j.x, j.y - 0.5, '#ff8a6b', (Math.random() - 0.5) * 3, -Math.random() * 3, 0.5);
        if (j.vida <= 0) this.perder('Los destellos te deshicieron');
      }
    }
  }

  actualizarRelojes(dt) {
    const j = this.jugador;
    for (const r of this.relojes) {
      r.fase += dt * 3;
      if (r.tomado || Math.hypot(r.x - j.x, r.y - j.y) > 0.6) continue;
      r.tomado = true;
      this.sumar('reloj');
      if (this.noche) this.vela += 20; else this.arena += 2;
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; this.particula(r.x, r.y - 0.4, '#ffe08a', Math.cos(a) * 2, Math.sin(a) * 2, 0.6); }
      this.emitir('reloj');
    }
  }

  actualizarRodadoras(dt) {
    for (const r of this.rodadoras) {
      r.x += r.vel * dt;
      r.giro += r.vel * dt * 2.5;
      if (r.x > this.w + 1) r.x = -1;
      r.y = r.y0 + Math.abs(Math.sin(r.giro * 0.8)) * -0.25;
    }
  }

  usar() {
    const j = this.jugador;
    let mejor = null, md = 1.4;
    for (const f of this.faroles) { const d = Math.hypot(f.x - j.x, f.y - j.y); if (d < md) { md = d; mejor = f; } }
    if (mejor) {
      mejor.encendido = !mejor.encendido;
      this.emitir('farol');
      for (let k = 0; k < 14; k++) this.particula(mejor.x, mejor.y - 1.1, '#ffd36b', (Math.random() - 0.5) * 2, -Math.random() * 2, 0.6);
    }
  }
  farolCercano() {
    const j = this.jugador;
    return this.faroles.find(f => Math.hypot(f.x - j.x, f.y - j.y) < 1.4) || null;
  }

  ganar() {
    this.estado = 'ganado';
    const frac = this.noche ? this.vela / this.velaMax : (this.arenaMax ? this.arena / this.arenaMax : 1);
    this.estrellas = frac >= 0.5 ? 3 : frac >= 0.2 ? 2 : 1;
    const porciento = Math.min(100, Math.round(frac * 100));
    this.desglose = [
      ['Flores de luna', this.conteo.flores, this.conteo.flores * PUNTOS.flor],
      ['Destellos apagados', this.conteo.destellos, this.conteo.destellos * PUNTOS.destello],
      ['Sellos rotos', this.conteo.sellos, this.conteo.sellos * PUNTOS.sello],
      ['Relojes de arena', this.conteo.relojes, this.conteo.relojes * PUNTOS.reloj],
      ['Golpes recibidos', this.conteo.golpes, this.conteo.golpes * PUNTOS.golpe],
      [this.noche ? 'Vela restante' : 'Arena restante', porciento + ' %', porciento * PUNTOS.arenaPorciento],
      ['Vidas', this.jugador.vida, this.jugador.vida * PUNTOS.vida],
      ['Rapidez', Math.round(this.tiempo) + ' s', Math.max(0, Math.round(PUNTOS.rapidezLimite - this.tiempo)) * PUNTOS.rapidezSeg],
      ['Ventajas recogidas', this.conteo.ventajas, this.conteo.ventajas * PUNTOS.ventaja],
      ['Bono (doble puntos y evento)', '', this.bono || 0],
    ];
    if (this.reto) {
      this.retoLogrado = this.retoCumplido();
      this.desglose.push(['Reto: ' + this.reto.nombre, this.retoLogrado ? '¡Logrado!' : 'No', this.retoLogrado ? this.reto.bono : 0]);
    }
    this.puntaje = Math.max(0, this.desglose.reduce((s, f) => s + f[2], 0));
    for (let k = 0; k < 40; k++) { const a = Math.random() * 6.28; this.particula(this.salida.x, this.salida.y - 0.5, k % 2 ? '#ffe9a8' : '#ffffff', Math.cos(a) * 4, Math.sin(a) * 4 - 1, 1); }
    this.emitir('ganar');
  }
  perder(motivo) {
    if (this.estado !== 'jugando') return;
    this.estado = 'perdido';
    this.motivo = motivo;
    this.emitir('perder');
  }

  // ---------- Partículas ----------
  particula(x, y, color, vx, vy, vida) {
    if (this.particulas.length > 400) this.particulas.shift();
    this.particulas.push({ x, y, vx, vy, vida, max: vida, color });
  }
  actualizarParticulas(dt) {
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      p.vida -= dt;
      if (p.vida <= 0) { this.particulas.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 1.5 * dt;
    }
  }
}
