// Íconos de la librería pixelarticons (MIT, Gerrit Halfmann), copiados en lib/pixelarticons/.
// Cada <i class="px" data-icono="nombre"> recibe el SVG de la librería (usa currentColor, así toma el color del texto).
const cache = new Map();

function cargar(nombre) {
  if (!cache.has(nombre)) {
    cache.set(nombre, fetch(`lib/pixelarticons/${nombre}.svg`).then(r => (r.ok ? r.text() : '')).catch(() => ''));
  }
  return cache.get(nombre);
}

export function icono(nombre) { return `<i class="px" data-icono="${nombre}"></i>`; }

export async function pintarIconos(raiz = document) {
  const pendientes = [...raiz.querySelectorAll('[data-icono]')].filter(el => el.dataset.pintado !== el.dataset.icono);
  await Promise.all(pendientes.map(async el => {
    const svg = await cargar(el.dataset.icono);
    el.innerHTML = svg;
    el.dataset.pintado = el.dataset.icono;
  }));
}

// Repinta solo los íconos que aparezcan o cambien.
export function vigilarIconos() {
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'attributes' || m.addedNodes.length) { pintarIconos(); return; }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-icono'] });
  pintarIconos();
}
