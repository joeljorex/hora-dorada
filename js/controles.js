// Asignación de controles: cada acción tiene hasta dos teclas. El jugador puede cambiarlas y se guardan en el navegador.
export const ACCIONES = [
  ['arriba', 'Caminar hacia arriba', ['KeyW', 'ArrowUp']],
  ['abajo', 'Caminar hacia abajo', ['KeyS', 'ArrowDown']],
  ['izquierda', 'Caminar a la izquierda', ['KeyA', 'ArrowLeft']],
  ['derecha', 'Caminar a la derecha', ['KeyD', 'ArrowRight']],
  ['atrasar', 'Regresar el sol', ['KeyQ', '']],
  ['adelantar', 'Adelantar el sol', ['KeyE', '']],
  ['girarIzq', 'Girar la cámara a la izquierda', ['KeyZ', '']],
  ['girarDer', 'Girar la cámara a la derecha', ['KeyX', '']],
  ['altura', 'Subir o bajar la cámara', ['KeyC', '']],
  ['estirar', 'Estirarse', ['Space', '']],
  ['saltar', 'Saltar', ['KeyJ', 'ShiftLeft']],
  ['usar', 'Prender o apagar un farol', ['KeyF', 'Enter']],
  ['reiniciar', 'Reiniciar el nivel', ['KeyR', '']],
  ['pausa', 'Pausa', ['Escape', 'KeyP']],
  ['sonido', 'Sonido sí / no', ['KeyM', '']],
];
const CLAVE = 'horaDorada.controles';

function porDefecto() { return Object.fromEntries(ACCIONES.map(([a, , t]) => [a, [...t]])); }

export const Controles = (() => {
  let mapa = porDefecto();
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (g) for (const [a] of ACCIONES) if (Array.isArray(g[a])) mapa[a] = [g[a][0] || '', g[a][1] || ''];
  } catch (e) { /* nada */ }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(mapa)); } catch (e) { /* nada */ } };

  return {
    mapa: () => mapa,
    teclas: a => mapa[a].filter(Boolean),
    accionDe: code => ACCIONES.map(x => x[0]).find(a => mapa[a].includes(code)) || null,
    pulsada: (a, teclas) => mapa[a].some(c => c && teclas.has(c)),
    // Asigna una tecla; si otra acción la usaba, se la quita para que no haya choques.
    asignar(a, i, code) {
      for (const [b] of ACCIONES) mapa[b] = mapa[b].map(c => (c === code ? '' : c));
      mapa[a][i] = code;
      guardar();
    },
    borrar(a, i) { mapa[a][i] = ''; guardar(); },
    restablecer() { mapa = porDefecto(); guardar(); },
    esPorDefecto() { return JSON.stringify(mapa) === JSON.stringify(porDefecto()); },
  };
})();

// Nombre corto de una tecla (para texto) y archivo de su sprite (teclas del paquete Ninja Adventure).
const ESPECIALES = {
  Space: ['Espacio', 'space'], Enter: ['Enter', 'enter'], Escape: ['Esc', 'escape'], Tab: ['Tab', 'tab'],
  ShiftLeft: ['Shift', 'shift'], ShiftRight: ['Shift der.', 'shift'], ControlLeft: ['Ctrl', 'ctrl'], ControlRight: ['Ctrl der.', 'ctrl'],
  AltLeft: ['Alt', 'alt'], AltRight: ['Alt der.', 'alt'], Delete: ['Supr', 'delete'],
  ArrowUp: ['Flecha arriba', 'up'], ArrowDown: ['Flecha abajo', 'down'], ArrowLeft: ['Flecha izquierda', 'left'], ArrowRight: ['Flecha derecha', 'right'],
};
export function nombreTecla(code) {
  if (!code) return '—';
  if (ESPECIALES[code]) return ESPECIALES[code][0];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^F\d{1,2}$/.test(code)) return code;
  return code;
}
function archivoTecla(code) {
  if (ESPECIALES[code]) return ESPECIALES[code][1];
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit\d$/.test(code)) return code.slice(5);
  if (/^F\d{1,2}$/.test(code)) return code.toLowerCase();
  return null;
}
// HTML de una tecla: su sprite si existe; si no, una insignia de NES.css con el nombre.
export function teclaHTML(code) {
  if (!code) return '<span class="tenue">—</span>';
  const f = archivoTecla(code);
  return f ? `<img class="tecla" src="assets/sprites/teclas/${f}.png" alt="${nombreTecla(code)}" title="${nombreTecla(code)}">`
    : `<span class="nes-badge tecla-txt"><span class="is-dark">${nombreTecla(code)}</span></span>`;
}
