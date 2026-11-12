// Voz de los personajes.
// 1) Voces naturales grabadas con Piper (TTS neuronal libre, MIT): Gno = es_MX "claude" (Apache-2.0) y
//    narrador = es_MX "ald" (Unlicense). Están en assets/audio/voz/lineas/ y se generaron con herramientas/generar_voces.py.
// 2) Si una frase no tiene archivo (por ejemplo, los controles después de cambiar teclas), se usa la voz del
//    navegador (Web Speech API), eligiendo la voz en español más natural que haya y sin forzar el tono.
import { Sonido } from './audio.js';

const RUTA = 'assets/audio/voz/lineas/';
const PERFIL = { Gno: { pitch: 1.15, rate: 1.0 }, Narrador: { pitch: 0.95, rate: 0.95 } };

export const Voz = (() => {
  const hayTTS = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let activa = true;
  try { activa = localStorage.getItem('horaDorada.voz') !== '0'; } catch (e) { /* nada */ }
  let disponibles = new Set();
  fetch(RUTA + 'lineas.json').then(r => r.json()).then(l => { disponibles = new Set(l); }).catch(() => { /* sin archivos */ });
  const audios = {};
  let actual = null;

  // Voz del navegador: se prefieren las "naturales" (Edge/Windows) o las de Google, en español de México.
  let vozTTS = null;
  function elegir() {
    if (!hayTTS) return;
    const es = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang));
    const puntos = v => (/natural|online|neural/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/MX/i.test(v.lang) ? 1 : 0);
    vozTTS = es.sort((a, b) => puntos(b) - puntos(a))[0] || null;
  }
  if (hayTTS) { elegir(); speechSynthesis.addEventListener?.('voiceschanged', elegir); }

  function callar() {
    if (actual) { actual.pause(); actual = null; }
    if (hayTTS) speechSynthesis.cancel();
    Sonido.atenuar(false);
  }

  function decir(texto, quien = 'Gno', clave = null) {
    if (!activa || Sonido.estaMudo() || !texto) return;
    callar();
    if (clave && disponibles.has(clave)) {
      const a = audios[clave] || (audios[clave] = new Audio(RUTA + clave + '.mp3'));
      a.currentTime = 0; a.volume = 1;
      actual = a;
      Sonido.atenuar(true);
      a.onended = () => { if (actual === a) { actual = null; Sonido.atenuar(false); } };
      a.play().catch(() => Sonido.atenuar(false));
      return;
    }
    if (!hayTTS) return;
    const u = new SpeechSynthesisUtterance(texto.replace(/[★☆✦☾…]/g, ' '));
    const p = PERFIL[quien] || PERFIL.Gno;
    if (vozTTS) { u.voice = vozTTS; u.lang = vozTTS.lang; } else u.lang = 'es-MX';
    u.pitch = p.pitch; u.rate = p.rate;
    Sonido.atenuar(true);
    u.onend = () => Sonido.atenuar(false);
    speechSynthesis.speak(u);
  }
  function alternar() {
    activa = !activa;
    try { localStorage.setItem('horaDorada.voz', activa ? '1' : '0'); } catch (e) { /* nada */ }
    if (!activa) callar();
    return activa;
  }
  return { decir, callar, alternar, estaActiva: () => activa, disponible: true };
})();
