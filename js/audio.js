// Música y efectos de sonido del paquete gratuito "Ninja Adventure" (Pixel-boy y AAA, licencia CC0).
// La música se reproduce con <audio> (se transmite, no se carga entera en memoria) y los efectos con Web Audio.
const RUTA = 'assets/audio/';

const MUSICA = { titulo: 'titulo', dia: 'dia', noche: 'noche', historia: 'historia', tranquila: 'tranquila', ruinas: 'ruinas', final: 'final' };
const VOL_MUSICA = { titulo: 0.45, dia: 0.4, noche: 0.45, historia: 0.45, tranquila: 0.4, ruinas: 0.42, final: 0.45 };

// nombre del efecto en el juego -> archivo y volumen
const EFECTOS = {
  crece: ['crece', 0.18], flor: ['flor', 0.7], todas: ['todas', 0.7], placa: ['placa', 0.5], placaOff: ['placa_off', 0.4],
  puerta: ['puerta', 0.6], sello: ['sello', 0.7], destello: ['destello', 0.55], danio: ['danio', 0.7], farol: ['farol', 0.5],
  ganar: ['ganar', 0.75], perder: ['perder', 0.7], clic: ['clic', 0.45], reloj: ['reloj', 0.6], sinArena: ['sin_arena', 0.35],
  estirar: ['estirar', 0.35], saltar: ['saltar', 0.45], aterrizar: ['aterrizar', 0.3], girar: ['girar', 0.45], agua: ['agua', 0.55], ventaja: ['ventaja', 0.6],
};
const LIM = { crece: 90, sinArena: 400, destello: 60 };

export const Sonido = (() => {
  let ctx = null, maestro, buffers = {};
  let mudo = false;
  try { mudo = localStorage.getItem('horaDorada.mudo') === '1'; } catch (e) { /* sin almacenamiento */ }
  const ultimo = {};
  let iniciado = false;

  async function cargar(nombre, carpeta = 'sfx') {
    try {
      const r = await fetch(`${RUTA}${carpeta}/${nombre}.wav`);
      buffers[nombre] = await ctx.decodeAudioData(await r.arrayBuffer());
    } catch (e) { console.warn('Sin sonido', nombre, e); }
  }

  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); }
    else {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        maestro = ctx.createGain(); maestro.gain.value = mudo ? 0 : 0.9; maestro.connect(ctx.destination);
        for (const [archivo] of Object.values(EFECTOS)) cargar(archivo);
        for (let i = 1; i <= 10; i++) cargar(`voz${i}`, 'voz');
        cargar('arena_loop');
      }
    }
    if (!iniciado) { iniciado = true; tocar(); }
  }

  function sfx(n) {
    if (!ctx || mudo || !EFECTOS[n]) return;
    const ahora = performance.now();
    if (LIM[n] && ultimo[n] && ahora - ultimo[n] < LIM[n]) return;
    ultimo[n] = ahora;
    const [archivo, vol] = EFECTOS[n];
    const b = buffers[archivo];
    if (!b) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; g.gain.value = vol;
    s.connect(g); g.connect(maestro); s.start();
  }

  // "Balbuceo" de un personaje: un clip de voz del paquete, más agudo para Gno y más grave para el narrador.
  function voz(quien) {
    if (!ctx || mudo) return;
    const b = buffers[`voz${1 + Math.floor(Math.random() * 10)}`];
    if (!b) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; s.playbackRate.value = quien === 'Gno' ? 1.35 + Math.random() * 0.15 : 0.75;
    g.gain.value = 0.3;
    s.connect(g); g.connect(maestro); s.start();
  }

  // Viento de arena en bucle mientras se mueve el sol (más agudo al adelantarlo).
  let reloj = null;
  function relojSonando(si, adelante) {
    if (!ctx || !buffers.arena_loop) return;
    if (!reloj) {
      const s = ctx.createBufferSource(); s.buffer = buffers.arena_loop; s.loop = true;
      const g = ctx.createGain(); g.gain.value = 0;
      s.connect(g); g.connect(maestro); s.start();
      reloj = { s, g };
    }
    reloj.g.gain.setTargetAtTime(si && !mudo ? 0.5 : 0, ctx.currentTime, 0.06);
    reloj.s.playbackRate.setTargetAtTime(adelante ? 1.25 : 0.85, ctx.currentTime, 0.06);
  }

  // ---- Música ----
  const pistas = {};
  let deseada = null, actual = null;
  function pista(n) {
    if (!pistas[n]) {
      const a = new Audio(`${RUTA}musica/${MUSICA[n]}.mp3`);
      a.loop = true; a.preload = 'auto';
      pistas[n] = a;
    }
    return pistas[n];
  }
  function fundir(a, hasta, ms, alTerminar) {
    const desde = a.volume, t0 = performance.now();
    const paso = () => {
      const f = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, desde + (hasta - desde) * f));
      if (f < 1) requestAnimationFrame(paso); else if (alTerminar) alTerminar();
    };
    paso();
  }
  function tocar() {
    if (!iniciado || !deseada || actual === deseada) return;
    if (actual) { const viejo = pista(actual); fundir(viejo, 0, 400, () => viejo.pause()); }
    actual = deseada;
    const a = pista(actual);
    a.muted = mudo;
    a.currentTime = 0; a.volume = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => { actual = null; });
    fundir(a, VOL_MUSICA[actual] || 0.4, 600);
  }
  // Baja la música mientras alguien habla
  function atenuar(si) {
    if (!actual) return;
    const a = pista(actual), vol = (VOL_MUSICA[actual] || 0.4) * (si ? 0.3 : 1);
    fundir(a, vol, 300);
  }
  function musica(nombre) { if (!MUSICA[nombre]) return; deseada = nombre; tocar(); }
  function musicaParar() {
    deseada = null;
    if (actual) { const a = pista(actual); fundir(a, 0, 400, () => a.pause()); actual = null; }
  }

  function alternarMudo() {
    mudo = !mudo;
    try { localStorage.setItem('horaDorada.mudo', mudo ? '1' : '0'); } catch (e) { /* nada */ }
    if (maestro) maestro.gain.value = mudo ? 0 : 0.9;
    for (const a of Object.values(pistas)) a.muted = mudo;
    return mudo;
  }

  return { iniciar, sfx, voz, relojSonando, musica, musicaParar, atenuar, alternarMudo, estaMudo: () => mudo };
})();
