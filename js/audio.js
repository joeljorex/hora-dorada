// Música y efectos con Web Audio (sin archivos).
export const Sonido = (() => {
  let ctx = null, maestro, sfxG, musG, ruidoBuf;
  let mudo = false;
  try { mudo = localStorage.getItem('horaDorada.mudo') === '1'; } catch (e) { /* sin almacenamiento */ }
  const ultimo = {};

  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    maestro = ctx.createGain(); maestro.gain.value = mudo ? 0 : 0.8; maestro.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.gain.value = 0.5; sfxG.connect(maestro);
    musG = ctx.createGain(); musG.gain.value = 0.16; musG.connect(maestro);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tono({ tipo = 'sine', f0 = 440, f1 = 0, dur = 0.2, vol = 0.2, ataque = 0.01, retraso = 0, destino = null }) {
    const t = ctx.currentTime + retraso;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(destino || sfxG);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function ruido({ dur = 0.2, vol = 0.2, f0 = 1500, f1 = 0, tipoF = 'lowpass', q = 1, retraso = 0, destino = null }) {
    const t = ctx.currentTime + retraso;
    const s = ctx.createBufferSource(); s.buffer = ruidoBuf;
    const f = ctx.createBiquadFilter(); f.type = tipoF; f.Q.value = q; f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(destino || sfxG);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  const EF = {
    crece: () => tono({ tipo: 'sine', f0: 600, f1: 900, dur: 0.12, vol: 0.05 }),
    flor: () => { [784, 988, 1175, 1568].forEach((f, i) => tono({ tipo: 'triangle', f0: f, dur: 0.5, vol: 0.12, retraso: i * 0.07 })); },
    todas: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tono({ tipo: 'sine', f0: f, dur: 0.8, vol: 0.12, retraso: i * 0.1 })); },
    placa: () => { tono({ tipo: 'sine', f0: 330, dur: 0.6, vol: 0.18 }); tono({ tipo: 'sine', f0: 495, dur: 0.6, vol: 0.08 }); },
    placaOff: () => tono({ tipo: 'sine', f0: 300, f1: 220, dur: 0.3, vol: 0.1 }),
    puerta: () => { ruido({ dur: 0.35, vol: 0.18, f0: 600, f1: 200 }); tono({ tipo: 'square', f0: 110, f1: 80, dur: 0.25, vol: 0.05 }); },
    sello: () => { ruido({ dur: 0.9, vol: 0.25, f0: 400, f1: 80 }); [262, 392, 523].forEach((f, i) => tono({ tipo: 'triangle', f0: f, dur: 1.0, vol: 0.12, retraso: i * 0.12 })); },
    destello: () => { tono({ tipo: 'sine', f0: 1600, f1: 300, dur: 0.35, vol: 0.1 }); ruido({ dur: 0.2, vol: 0.08, f0: 5000, tipoF: 'highpass' }); },
    danio: () => { tono({ tipo: 'sawtooth', f0: 220, f1: 70, dur: 0.3, vol: 0.18 }); ruido({ dur: 0.2, vol: 0.12, f0: 900 }); },
    farol: () => { tono({ tipo: 'triangle', f0: 880, f1: 660, dur: 0.15, vol: 0.1 }); ruido({ dur: 0.15, vol: 0.08, f0: 3000, tipoF: 'bandpass', q: 2 }); },
    ganar: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tono({ tipo: 'triangle', f0: f, dur: 0.35, vol: 0.13, retraso: i * 0.11 })); },
    perder: () => { [392, 330, 294, 220].forEach((f, i) => tono({ tipo: 'sine', f0: f, dur: 0.6, vol: 0.14, retraso: i * 0.22 })); },
    clic: () => tono({ tipo: 'triangle', f0: 700, f1: 1000, dur: 0.08, vol: 0.1 }),
    reloj: () => { [988, 1319, 1760].forEach((f, i) => tono({ tipo: 'sine', f0: f, dur: 0.18, vol: 0.1, retraso: i * 0.05 })); ruido({ dur: 0.3, vol: 0.06, f0: 2500, tipoF: 'bandpass', q: 3 }); },
    sinArena: () => tono({ tipo: 'square', f0: 180, f1: 140, dur: 0.15, vol: 0.06 }),
    estirar: () => tono({ tipo: 'sine', f0: 300, f1: 520, dur: 0.15, vol: 0.06 }),
  };
  const LIM = { crece: 90, sinArena: 400, destello: 60 };

  function sfx(n) {
    if (!ctx || mudo) return;
    const ahora = performance.now();
    if (LIM[n] && ultimo[n] && ahora - ultimo[n] < LIM[n]) return;
    ultimo[n] = ahora;
    if (EF[n]) EF[n]();
  }

  // Sonido continuo de "arena del reloj" mientras se mueve el sol.
  let reloj = null;
  function relojSonando(si, adelante) {
    if (!ctx || mudo) { if (reloj) { reloj.g.gain.value = 0; } return; }
    if (!reloj) {
      const s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 4; f.frequency.value = 2500;
      const g = ctx.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(sfxG); s.start();
      reloj = { s, f, g };
    }
    reloj.g.gain.setTargetAtTime(si ? 0.09 : 0, ctx.currentTime, 0.05);
    reloj.f.frequency.setTargetAtTime(adelante ? 3200 : 1800, ctx.currentTime, 0.05);
  }

  // ---- Música: arpegio pentatónico tranquilo ----
  const CANCIONES = {
    dia: { bpm: 88, acordes: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67], [52, 55, 59, 64]], tipo: 'triangle' },
    noche: { bpm: 70, acordes: [[57, 60, 64, 69], [55, 60, 64, 67], [53, 57, 60, 65], [52, 57, 60, 64]], tipo: 'sine' },
  };
  let cancion = null, paso = 0, proximo = 0, timer = null;
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const PATRON = [0, 1, 2, 3, 2, 1, 2, 3];
  function programar() {
    if (!cancion || !ctx) return;
    const dur = 60 / cancion.bpm / 2;
    while (proximo < ctx.currentTime + 0.15) {
      const tt = proximo - ctx.currentTime;
      const acorde = cancion.acordes[Math.floor(paso / 8) % cancion.acordes.length];
      const n = acorde[PATRON[paso % 8]] + 12;
      tono({ tipo: cancion.tipo, f0: midi(n), dur: dur * 2.2, vol: 0.13, retraso: tt, destino: musG, ataque: 0.02 });
      if (paso % 8 === 0) {
        tono({ tipo: 'sine', f0: midi(acorde[0] - 12), dur: dur * 7.5, vol: 0.22, retraso: tt, destino: musG, ataque: 0.1 });
        tono({ tipo: 'sine', f0: midi(acorde[2]), dur: dur * 7.5, vol: 0.05, retraso: tt, destino: musG, ataque: 0.4 });
      }
      if (paso % 16 === 12 && Math.random() < 0.6) tono({ tipo: 'sine', f0: midi(acorde[3] + 24), dur: 1.2, vol: 0.04, retraso: tt, destino: musG });
      proximo += dur; paso++;
    }
  }
  function musica(nombre) {
    if (!ctx) return;
    if (cancion === CANCIONES[nombre]) return;
    cancion = CANCIONES[nombre]; paso = 0; proximo = ctx.currentTime + 0.1;
    if (!timer) timer = setInterval(programar, 30);
  }
  function musicaParar() { cancion = null; }

  function alternarMudo() {
    mudo = !mudo;
    try { localStorage.setItem('horaDorada.mudo', mudo ? '1' : '0'); } catch (e) { /* nada */ }
    if (maestro) maestro.gain.value = mudo ? 0 : 0.8;
    return mudo;
  }

  return { iniciar, sfx, relojSonando, musica, musicaParar, alternarMudo, estaMudo: () => mudo };
})();
