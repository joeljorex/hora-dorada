// Sprites del juego. Todos vienen del paquete gratuito "Ninja Adventure" (Pixel-boy y AAA, licencia CC0).
// Ver assets/CREDITOS.md. Aquí solo se cargan las imágenes y se definen los recortes (en pixeles de la imagen).
const RUTA = 'assets/sprites/';

const ARCHIVOS = {
  desierto: 'tiles/desierto.png',
  naturaleza: 'tiles/naturaleza.png',
  suelo: 'tiles/suelo.png',
  detalles: 'tiles/detalles_suelo.png',
  relieve: 'tiles/relieve.png',
  elementos: 'tiles/elementos.png',
  mazmorra: 'tiles/mazmorra.png',
  logica: 'tiles/logica.png',
  espiritu: 'monstruos/espiritu.png',
  relojArena: 'objetos/reloj_arena.png',
  monedaSol: 'objetos/moneda_sol.png',
  florAnimada: 'objetos/flor_animada.png',
  nube: 'objetos/nube.png',
  circulo: 'fx/circulo_naranja.png',
  chispaMagica: 'fx/chispa_magica.png',
  chispa: 'fx/chispa.png',
  fuego: 'fx/fuego.png',
  humo: 'fx/humo.png',
  sombra: 'personajes/sombra.png',
  caraGno: 'personajes/flam_cara.png',
  caraEstatua: 'personajes/estatua_cara.png',
  cajaDialogo: 'dialogo/caja_dialogo.png',
  sol: 'ui/sol.png',
  luna: 'ui/luna.png',
};
export const TIPOS_VENTAJA = ['sombraLarga', 'prisa', 'solQuieto', 'saltoAlto', 'escudo', 'corazon', 'doblePuntos', 'florRapida'];
for (const t of TIPOS_VENTAJA) ARCHIVOS['v_' + t] = `ventajas/${t}.png`;

// Personajes para Gno y su vestuario: caminar (4 direcciones × 4 cuadros), quieto, brazos arriba y derrota.
export const PERSONAJES = { hoja: 'flam', sombrero: 'samurai', paliacate: 'ninjared', corona: 'princess', farolito: 'spirit' };
for (const p of new Set(Object.values(PERSONAJES))) {
  for (const an of ['walk', 'idle', 'item', 'dead', 'jump']) ARCHIVOS[`${p}_${an}`] = `personajes/${p}_${an}.png`;
}

export const IMG = {};

export function cargarSprites() {
  return Promise.all(Object.entries(ARCHIVOS).map(([k, f]) => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; res(); };
    im.onerror = () => { console.warn('No se pudo cargar', f); res(); };
    im.src = RUTA + f;
  }))).then(() => {
    // El relieve de arena es del mismo color que el suelo: se entinta color adobe para que los muros resalten.
    // Las mesetas usan el relieve original (arena clara); los muros, el entintado.
    if (IMG.relieve) { IMG.relieveArena = IMG.relieve; IMG.relieve = entintar(IMG.relieve, '#d18e66'); }
  });
}

function entintar(im, color) {
  const c = document.createElement('canvas');
  c.width = im.width; c.height = im.height;
  const g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(im, 0, 0);
  return c;
}

// Recortes [imagen, x, y, ancho, alto] en pixeles de la hoja.
export const R = {
  arena: ['suelo', 16, 16, 16, 16],
  arenaVar: [[128, 16], [80, 64], [96, 64], [128, 32], [144, 32], [160, 32], [144, 48], [160, 48]].map(([x, y]) => ['suelo', x, y, 16, 16]),
  ramita: ['suelo', 0, 64, 16, 16],
  piedrita: ['suelo', 16, 64, 16, 16],
  arenaCamino: ['suelo', 0, 80, 16, 16],
  piedras: [['suelo', 16, 64, 16, 16], ['detalles', 240, 0, 16, 16]],
  hueso: ['detalles', 224, 0, 16, 16],
  craneo: ['desierto', 256, 176, 16, 16],
  saguaro: ['naturaleza', 176, 128, 16, 32],
  roca: ['naturaleza', 272, 208, 16, 16],
  biznaga: ['naturaleza', 160, 128, 16, 16],
  agave: ['naturaleza', 128, 160, 16, 16],
  ocotillo: ['desierto', 128, 160, 32, 32],
  rodadora: ['desierto', 128, 144, 16, 16],
  botonFlor: ['naturaleza', 16, 160, 16, 16],
  farol: ['elementos', 0, 80, 16, 32],
  reja: ['elementos', 80, 176, 16, 16],
  bloqueSello: ['mazmorra', 0, 32, 16, 16],
  bloqueSolar: ['mazmorra', 16, 48, 16, 16],
  placa: ['mazmorra', 0, 16, 16, 16],
  caja: ['mazmorra', 32, 16, 16, 16],
  placaActiva: ['mazmorra', 16, 16, 16, 16],
  pedestal: ['mazmorra', 80, 32, 16, 16],
  pedestalActivo: ['mazmorra', 32, 32, 16, 16],
  cristal: ['mazmorra', 112, 48, 16, 16],
  letraA: ['logica', 0, 96, 16, 16],
  letraB: ['logica', 64, 112, 16, 16],
  ojoSello: ['logica', 80, 32, 16, 16],
  relojArena: ['relojArena', 0, 0, 16, 16],
  sol: ['monedaSol', 0, 0, 0, 0],
  nube: ['nube', 0, 0, 80, 36],
  sombraPie: ['sombra', 0, 0, 12, 7],
};

// Muros (relieve de arena): se arman con cuartos de 8×8 según los vecinos.
export const MURO = { img: 'relieve', xIzq: 16, xCentroI: 32, xCentroD: 40, xDer: 56, yArriba: 80, yCentro: 96, yCara: 112 };
// Mesetas (mecánica 3D): el mismo relieve sin entintar.
export const MESETA = { ...MURO, img: 'relieveArena' };
// Oasis: misma idea con el estanque del tileset del desierto.
export const AGUA = { img: 'desierto', xIzq: 272, xCentroI: 288, xCentroD: 296, xDer: 312, yArriba: 112, yCentro: 128, yAbajo: 152 };

// Animaciones: hoja, ancho y alto del cuadro, cuántos cuadros y cuadros por segundo.
export const ANIM = {
  espiritu: { img: 'espiritu', w: 16, h: 16 },              // columnas = dirección, filas = cuadros
  flor: { img: 'florAnimada', w: 16, h: 16, n: 4, fps: 4 },
  circulo: { img: 'circulo', w: 32, h: 32, n: 4, fps: 8 },
  fuego: { img: 'fuego', w: 12, h: 12, n: 8, fps: 12 },
  chispa: { img: 'chispa', w: 10, h: 8, n: 7 },
  humo: { img: 'humo', w: 32, h: 32, n: 6 },
  chispaMagica: { img: 'chispaMagica', w: 30, h: 35, n: 9 },
};

// Dirección de las hojas de personaje: 0 abajo, 1 arriba, 2 izquierda, 3 derecha.
export const DIR = { abajo: 0, arriba: 1, izquierda: 2, derecha: 3 };

const cacheSiluetas = new Map();
// Devuelve un canvas con la silueta del recorte pintada de un color (para sombras).
export function silueta(img, x, y, w, h, color) {
  const k = `${img}|${x}|${y}|${w}|${h}|${color}`;
  let c = cacheSiluetas.get(k);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (IMG[img]) g.drawImage(IMG[img], x, y, w, h, 0, 0, w, h);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  cacheSiluetas.set(k, c);
  return c;
}

// Dibuja un recorte en coordenadas del mapa (casillas).
export function pintar(ctx, r, dx, dy, dw, dh) {
  const im = IMG[r[0]];
  if (!im) return;
  const w = r[3] || im.width, h = r[4] || im.height;
  ctx.drawImage(im, r[1], r[2], w, h, dx, dy, dw, dh);
}
