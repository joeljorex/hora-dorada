// Historia de introducción: cada viñeta es una escena armada con sprites del paquete Ninja Adventure (CC0)
// y un cuadro de diálogo del mismo paquete (Ui/Dialog) con el retrato de quien habla.
// El texto aparece letra por letra con "balbuceo" y, si la voz está activa, el personaje lo dice en voz alta.
import { IMG, R, ANIM, silueta, pintar } from './sprites.js';
import { Sonido } from './audio.js';
import { Voz } from './voz.js';

export const HISTORIA = [
  [0, 'Narrador', 'Hace mucho que las flores de luna no abren. El desierto se está quedando a oscuras.'],
  [1, 'Narrador', 'Pero entre las ruinas, la vieja aguja del reloj de sol sigue marcando la hora…'],
  [2, 'Gno', '¿Eh? ¿Dónde estoy? ¿Por qué mi sombra brilla?'],
  [3, 'Narrador', 'Tu sombra guarda un poco de la noche, Gno. Llévala hasta las flores.'],
  [4, 'Gno', '¿Y si mi sombra no alcanza?'],
  [4, 'Narrador', 'Mueve el sol con la arena de tu reloj… o gira tu mirada: el sol siempre sale a tu derecha.'],
  [5, 'Gno', '¡Entonces vamos a despertar el desierto!'],
];

const T = 48; // tamaño de una casilla en la escena (tiles de 16 px × 3)
const CARA = { Gno: 'caraGno', Narrador: 'caraEstatua' };

export class Historia {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.paso = 0; this.letras = 0; this.t0 = 0; this.activa = false;
  }

  abrir() { this.activa = true; this.ir(0); this.bucle(); }
  cerrar() { this.activa = false; Voz.callar(); }

  ir(n) {
    this.paso = n; this.letras = 0; this.t0 = performance.now();
    const [, quien, texto] = HISTORIA[n];
    Voz.decir(texto, quien, 'historia' + n);
  }
  // Si el texto aún se está escribiendo, lo completa; si no, pasa a la siguiente viñeta. Devuelve false al final.
  avanzar() {
    const texto = HISTORIA[this.paso][2];
    if (this.letras < texto.length) { this.letras = texto.length; return true; }
    if (this.paso < HISTORIA.length - 1) { this.ir(this.paso + 1); return true; }
    return false;
  }
  esUltima() { return this.paso === HISTORIA.length - 1; }

  bucle() {
    if (!this.activa) return;
    requestAnimationFrame(() => this.bucle());
    const [, quien, texto] = HISTORIA[this.paso];
    const antes = Math.floor(this.letras);
    this.letras = Math.min(texto.length, this.letras + 0.45);
    if (!Voz.estaActiva() && Math.floor(this.letras) !== antes && Math.floor(this.letras) % 3 === 0 && texto[Math.floor(this.letras)] !== ' ') Sonido.voz(quien);
    this.dibujar((performance.now() - this.t0) / 1000);
  }

  dibujar(t) {
    const g = this.g, [v, quien, texto] = HISTORIA[this.paso];
    g.imageSmoothingEnabled = false;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#212529'; g.fillRect(0, 0, this.cv.width, this.cv.height);
    this.escena(v, t);
    this.dialogo(quien, texto.slice(0, Math.floor(this.letras)));
  }

  // ---------- Escenas ----------
  escena(v, t) {
    const g = this.g;
    g.save();
    g.beginPath(); g.rect(0, 0, 640, 270); g.clip();
    // Suelo de arena con algunas variantes
    for (let j = 0; j < 6; j++) for (let i = 0; i < 14; i++) {
      const r = ((i * 7 + j * 13) % 9 === 0) ? R.arenaVar[(i + j) % R.arenaVar.length] : R.arena;
      pintar(g, r, i * T, j * T, T, T);
    }
    const S = (r, x, y, w = T, h = T) => pintar(g, r, x, y, w, h);
    const flor = (x, y, abierta) => {
      const a = ANIM.flor, k = Math.floor(t * 4 + x) % a.n;
      g.drawImage(IMG[a.img], abierta ? k * 16 : 0, 0, 16, 16, x, y, T, T);
      if (!abierta) { g.globalAlpha = 0.55; g.drawImage(silueta(a.img, 0, 0, 16, 16, '#6a3f9a'), x, y, T, T); g.globalAlpha = 1; }
    };
    const gno = (x, y, cuadro = 'flam_idle', col = 0) => { S(R.sombraPie, x + 10, y + 40, 28, 16); g.drawImage(IMG[cuadro], col * 16, 0, 16, 16, x, y, T, T); };
    const sombraGno = (x, y, largo, ang) => {
      g.save(); g.translate(x + T / 2, y + T - 4); g.rotate(ang); g.globalAlpha = 0.6;
      g.drawImage(silueta('flam_idle', 0, 0, 16, 16, '#30124f'), -T / 2, -largo, T, largo); g.restore();
    };
    // Ruinas de adobe y plantas de fondo (iguales en todas las viñetas)
    for (let i = 0; i < 4; i++) S(R.roca, 40 + i * 150, 20 + (i % 2) * 30);
    S(R.saguaro, 560, 40, T, T * 2); S(R.saguaro, 20, 150, T, T * 2); S(R.agave, 470, 200); S(R.craneo, 120, 210);

    if (v === 0) { [[150, 120], [300, 90], [420, 150], [250, 190]].forEach(([x, y]) => flor(x, y, false)); }
    if (v >= 1) {
      // El reloj de sol (pedestal) al centro
      const brillo = 0.4 + Math.sin(t * 2) * 0.15;
      const gr = g.createRadialGradient(320, 140, 5, 320, 140, 90);
      gr.addColorStop(0, `rgba(255,220,130,${brillo})`); gr.addColorStop(1, 'rgba(255,220,130,0)');
      g.fillStyle = gr; g.fillRect(200, 40, 240, 200);
      S(R.sombraPie, 300, 170, 40, 22); S(v >= 3 ? R.pedestalActivo : R.pedestal, 296, 112);
    }
    if (v === 1) { [[120, 130], [470, 120]].forEach(([x, y]) => flor(x, y, false)); }
    if (v === 2) {
      sombraGno(360, 140, 70 + Math.sin(t * 3) * 6, -1.2);
      gno(360, 140);
      const a = ANIM.chispa, q = Math.floor(t * 10) % a.n;
      g.drawImage(IMG[a.img], q * a.w, 0, a.w, a.h, 330, 120, 30, 24);
    }
    if (v === 3) {
      sombraGno(380, 150, 120, -1.25);
      gno(380, 150);
      [[150, 110], [230, 70]].forEach(([x, y]) => flor(x, y, false));
    }
    if (v === 4) {
      S(R.sol, 520 - (t * 20) % 60, 20, 40, 40);
      S(R.relojArena, 420, 160, 36, 36);
      sombraGno(380, 150, 60 + (Math.sin(t * 1.5) + 1) * 50, -1.3);
      gno(380, 150);
      [[120, 100]].forEach(([x, y]) => flor(x, y, false));
    }
    if (v === 5) {
      [[150, 120], [250, 70], [460, 110], [220, 190]].forEach(([x, y]) => flor(x, y, true));
      const k = Math.floor(t * 8) % 4;
      g.drawImage(IMG.flam_walk, 3 * 16, k * 16, 16, 16, 340 + (t * 40) % 120, 160, T, T);
    }
    // Luz según la viñeta: noche al principio, amanecer al final
    const tinte = ['rgba(10,12,40,0.55)', 'rgba(40,20,60,0.35)', 'rgba(60,30,60,0.2)', 'rgba(255,170,110,0.12)', 'rgba(255,200,140,0.08)', 'rgba(255,150,90,0.15)'][v];
    g.fillStyle = tinte; g.fillRect(0, 0, 640, 270);
    g.restore();
  }

  // ---------- Cuadro de diálogo (sprite del paquete, escala 2) ----------
  dialogo(quien, texto) {
    const g = this.g, x0 = 20, y0 = 278, k = 2;
    if (IMG.cajaDialogo) g.drawImage(IMG.cajaDialogo, x0, y0, 300 * k, 58 * k);
    const cara = IMG[CARA[quien]];
    if (cara) g.drawImage(cara, x0 + 5 * k, y0 + 15 * k, 38 * k, 38 * k);
    g.fillStyle = '#ffffff'; g.font = '700 15px "Pixelify Sans", monospace'; g.textBaseline = 'middle';
    g.fillText(quien, x0 + 12 * k, y0 + 5 * k + 1);
    g.fillStyle = '#2b2230'; g.font = '500 20px "Pixelify Sans", monospace'; g.textBaseline = 'top';
    // Ajuste de líneas dentro del área de texto
    const ancho = 236 * k, palabras = texto.split(' ');
    let linea = '', y = y0 + 17 * k;
    for (const p of palabras) {
      const prueba = linea ? linea + ' ' + p : p;
      if (g.measureText(prueba).width > ancho && linea) { g.fillText(linea, x0 + 54 * k, y); linea = p; y += 25; }
      else linea = prueba;
    }
    if (linea) g.fillText(linea, x0 + 54 * k, y);
  }
}
