// Mundo 3D con Three.js (librería MIT, en lib/three/). La cámara orbita el desierto en pasos de 90° (Z / X)
// y cambia de altura (C). El sol está "pegado" a la cámara: siempre sale a la derecha de la pantalla,
// así que al girar la cámara las sombras caen hacia otro lado del mapa (esa es la mecánica).
// - Piso: textura que pinta el Pintor 2D (arena, agua, placas y las sombras calculadas por el juego).
// - Muros, muros bajos, mesetas y puertas: cajas con texturas del relieve del paquete Ninja Adventure.
// - Plantas, faroles, flores, destellos y Gno: sprites "de pie" que siempre miran a la cámara.
import * as THREE from '../lib/three/three.module.min.js';
import { IMG, R, ANIM, silueta } from './sprites.js';
import { MESETAS, ALTURAS } from './juego.js';
import { Pintor, tinte, direccionDe } from './dibujo.js';
import { DIR } from './sprites.js';

const S = 32;                 // pixeles por casilla en la textura del piso
const ALTO = { '#': 1.0, n: 0.55, T: MESETAS.T, U: MESETAS.U };
const GROSOR = 0.3;   // grosor de las plataformas de madera
const LETRA_ICONO = { A: R.letraA, B: R.letraB, M: R.ojoSello, S: R.sol };

// ---------- Texturas ----------
function aTextura(fuente) {
  const t = fuente instanceof THREE.Texture ? fuente : new THREE.CanvasTexture(fuente);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const cacheRecortes = new Map();
// Textura de un recorte [imagen, x, y, w, h] del paquete (opcionalmente con un tinte encima).
function texRecorte(r, tinteColor, alfa = 0.5) {
  const k = r.join('|') + (tinteColor || '');
  if (cacheRecortes.has(k)) return cacheRecortes.get(k);
  const im = IMG[r[0]];
  const w = r[3] || im.width, h = r[4] || im.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.drawImage(im, r[1], r[2], w, h, 0, 0, w, h);
  if (tinteColor) { g.globalAlpha = alfa; g.drawImage(silueta(r[0], r[1], r[2], w, h, tinteColor), 0, 0); }
  const t = aTextura(c);
  cacheRecortes.set(k, t);
  return t;
}
// Textura de una hoja completa para animar con offset/repeat (cada objeto usa su propia copia).
function texHoja(nombre) {
  const im = IMG[nombre];
  const t = aTextura(new THREE.Texture(im));
  t.needsUpdate = true;
  return t;
}
function cuadro(t, im, x, y, w, h) {
  t.repeat.set(w / im.width, h / im.height);
  t.offset.set(x / im.width, 1 - (y + h) / im.height);
}
let texBrillo = null;
function brillo() {
  if (texBrillo) return texBrillo;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  texBrillo = new THREE.CanvasTexture(c);
  return texBrillo;
}

// Plano vertical con la base en y = 0 y la normal inclinada hacia arriba (así el sol lo ilumina).
function geoCartel(w, h) {
  const g = new THREE.PlaneGeometry(w, h);
  g.translate(0, h / 2, 0);
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 0.75, 0.66);
  return g;
}

export class Mundo3D {
  constructor(canvas, pintor2D) {
    this.canvas = canvas;
    this.pintor2D = pintor2D;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.escena = new THREE.Scene();
    this.escena.background = new THREE.Color('#3b2a2a');
    this.camara = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
    this.cielo = new THREE.HemisphereLight(0xfff4e0, 0x9a6a48, 1.6);
    this.sol = new THREE.DirectionalLight(0xffffff, 1.6);
    this.escena.add(this.cielo, this.sol, this.sol.target);
    this.luzGno = new THREE.PointLight(0xffd29a, 0, 4, 1.2);
    this.escena.add(this.luzGno);
    this.lienzoSuelo = document.createElement('canvas');
    this.pintorSuelo = new Pintor(this.lienzoSuelo, { suelo: S });
    this.yaw = 0; this.yawObj = 0; this.alta = true;
    this.pitch = 1.0; this.dist = 24; this.objetivo = new THREE.Vector3(13, 0, 7.5);
    this.partida = null; this.grupo = null;
    this.temblor = 0;
    // Sol y luna en el cielo: van pegados a la cámara (el sol sale por la derecha y se pone por la izquierda)
    this.astro = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
    this.astroBrillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo(), color: 0xffd27a, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, opacity: 0.8 }));
    this.astro.renderOrder = this.astroBrillo.renderOrder = 10;
    this.camara.add(this.astroBrillo, this.astro);
    this.escena.add(this.camara);
    this.ajustar();
    addEventListener('resize', () => this.ajustar());
  }

  set listo(v) { this.pintorSuelo.listo = v; this.partida = null; }
  ajustar() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camara.aspect = w / h;
    this.camara.updateProjectionMatrix();
  }
  // Girar la cámara 90° alrededor del mundo (d = +1 / −1).
  girar(d) { this.yawObj += d * Math.PI / 2; }
  // Cámara alta (casi cenital, se ve todo el nivel) o baja (más 3D, sigue a Gno).
  alternarAltura() { this.alta = !this.alta; return this.alta; }

  // ---------- Construcción del nivel ----------
  construir(P) {
    if (this.grupo) this.escena.remove(this.grupo);
    const G = this.grupo = new THREE.Group();
    this.escena.add(G);
    this.partida = P;
    this.yaw = this.yawObj = (P.vista || 0) * Math.PI / 2;
    this.carteles = [];
    this.luces = [];

    // Piso
    this.pintorSuelo.dibujar(P, 0);
    this.texSuelo = new THREE.CanvasTexture(this.lienzoSuelo);
    this.texSuelo.colorSpace = THREE.SRGBColorSpace;
    this.texSuelo.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.texSuelo.magFilter = THREE.NearestFilter;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(P.w, P.h), new THREE.MeshLambertMaterial({ map: this.texSuelo }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(P.w / 2, 0, P.h / 2);
    G.add(piso);
    // Fuera del mapa: arena oscura
    const fuera = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: '#7a5236' }));
    fuera.rotation.x = -Math.PI / 2; fuera.position.set(P.w / 2, -0.02, P.h / 2);
    G.add(fuera);

    // Muros y mesetas: una caja por casilla (InstancedMesh por tipo)
    const matCaja = (img, conBorde) => {
      const lado = texRecorte([img, 24, 112, 16, 16]);
      const arriba = texRecorte([img, 24, 88, 16, 16]);
      const mLado = new THREE.MeshLambertMaterial({ map: lado });
      const mArriba = new THREE.MeshLambertMaterial({ map: arriba });
      return [mLado, mLado, mArriba, mArriba, mLado, mLado];
    };
    const mats = { adobe: matCaja('relieve'), meseta: matCaja('relieveArena') };
    const geoCaja = new THREE.BoxGeometry(1, 1, 1); geoCaja.translate(0, 0.5, 0);
    for (const tipo of Object.keys(ALTO)) {
      const celdas = [];
      for (let j = 0; j < P.h; j++) for (let i = 0; i < P.w; i++) if (P.celda(i, j) === tipo) celdas.push([i, j]);
      if (!celdas.length) continue;
      const im = new THREE.InstancedMesh(geoCaja, (tipo === 'T' || tipo === 'U') ? mats.meseta : mats.adobe, celdas.length);
      const m = new THREE.Matrix4();
      celdas.forEach(([i, j], k) => { m.makeScale(1, ALTO[tipo], 1); m.setPosition(i + 0.5, 0, j + 0.5); im.setMatrixAt(k, m); });
      G.add(im);
    }

    // Plataformas de madera: fijas (Y) y las que se mueven sobre el agua
    const matCajaMadera = new THREE.MeshLambertMaterial({ map: texRecorte(R.caja) });
    const geoPlat = new THREE.BoxGeometry(0.96, GROSOR, 0.96); geoPlat.translate(0, MESETAS.Y - GROSOR / 2, 0);
    for (let j = 0; j < P.h; j++) for (let i = 0; i < P.w; i++) if (P.celda(i, j) === 'Y') {
      const m = new THREE.Mesh(geoPlat, matCajaMadera); m.position.set(i + 0.5, 0, j + 0.5); G.add(m);
    }
    this.plataformas = (P.plataformas || []).map(pl => { const m = new THREE.Mesh(geoPlat, matCajaMadera); G.add(m); return { pl, m }; });

    // Puertas
    this.puertas = P.puertas.map(pu => {
      const r = pu.solar ? R.bloqueSolar : pu.permanente ? R.bloqueSello : R.reja;
      const mat = new THREE.MeshLambertMaterial({ map: texRecorte(r), transparent: !pu.solar && !pu.permanente, alphaTest: 0.4 });
      const caja = new THREE.Mesh(geoCaja, mat);
      caja.position.set(pu.i + 0.5, 0, pu.j + 0.5);
      G.add(caja);
      const icono = this.cartel(LETRA_ICONO[pu.letra] || R.sol, 0.45, 0.45, pu.x, pu.y, ALTURAS[pu.letra] + 0.15);
      return { pu, caja, icono, alto: ALTURAS[pu.letra] };
    });

    // Objetos de pie
    for (let j = 0; j < P.h; j++) for (let i = 0; i < P.w; i++) {
      const ch = P.celda(i, j), x = i + 0.5, z = j + 0.6;
      if (ch === 'c') this.cartel(R.saguaro, 1, 2, x, z);
      else if (ch === 'r') this.cartel(R.roca, 1, 1, x, z);
      else if (ch === 'b') this.cartel(R.biznaga, 1, 1, x, z);
      else if (ch === 'g') this.cartel(R.agave, 1, 1, x, z);
      else if (ch === 'o') this.cartel(R.ocotillo, 1.5, 1.5, x, z);
      else if (ch === 'E') { this.cartel(R.pedestal, 1, 1, x, z); this.cartel(R.cristal, 0.9, 0.9, x, z, 0.75); }
    }
    this.faroles = P.faroles.map(f => {
      this.cartel(R.farol, 1, 2, f.x, f.y + 0.1);
      const fuego = this.cartelAnimado('fuego', 0.45, 0.45, f.x, f.y + 0.12, 1.3);
      const luz = new THREE.PointLight(0xffb060, 0, 11, 1);
      luz.position.set(f.x, 1.4, f.y);
      G.add(luz);
      const halo = this.halo(0xffc070, 1.6, f.x, 1.4, f.y);
      return { f, fuego, luz, halo };
    });
    this.flores = P.flores.map(f => {
      const m = this.cartel(R.botonFlor, 0.85, 0.85, f.x, f.y + 0.1);
      m.material.map = texRecorte(['florAnimada', 0, 0, 16, 16], '#6a3f9a');
      const t = texHoja('florAnimada');
      const halo = this.halo(0xd6aaff, 1.1, f.x, 0.5, f.y + 0.1);
      return { f, m, t, halo };
    });
    this.relojes = (P.relojes || []).map(r => ({ r, m: this.cartel(R.relojArena, 0.7, 0.7, r.x, r.y), halo: this.halo(0xffe08a, 0.9, r.x, 0.6, r.y) }));
    this.rodadoras = (P.rodadoras || []).map(r => ({ r, m: this.cartel(R.rodadora, 0.7, 0.7, r.x, r.y0) }));
    this.salida = P.salida ? { m: this.cartel(R.pedestal, 1, 1, P.salida.x, P.salida.y), halo: this.halo(0xffd27a, 2.2, P.salida.x, 1.2, P.salida.y) } : null;
    this.destellos = P.destellos.map(d => ({ d, m: this.cartelAnimado('espiritu', 1, 1, d.x, d.y, 0.25), halo: this.halo(0xfff0b0, 1.6, d.x, 0.7, d.y) }));
    this.nubes = (P.nubes || []).map(n => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(n.ancho * 2.2, n.ancho * 2.2 * 36 / 80), new THREE.MeshBasicMaterial({ map: texRecorte(R.nube), transparent: true, opacity: 0.55, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      G.add(m);
      return { n, m };
    });
    // Ventajas (aparecen y desaparecen durante el nivel)
    this.ventajas = new Map();
    // Gno
    this.gno = this.cartelAnimado('flam_idle', 1.15, 1.15, P.jugador.x, P.jugador.y, 0);
    this.texGno = {};
  }

  cartel(r, w, h, x, z, y = 0) {
    const m = new THREE.Mesh(geoCartel(w, h), new THREE.MeshLambertMaterial({ map: texRecorte(r), alphaTest: 0.5, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    this.grupo.add(m);
    this.carteles.push(m);
    return m;
  }
  cartelAnimado(hoja, w, h, x, z, y = 0) {
    const t = texHoja(hoja);
    const m = new THREE.Mesh(geoCartel(w, h), new THREE.MeshLambertMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.userData.hoja = hoja;
    this.grupo.add(m);
    this.carteles.push(m);
    return m;
  }
  halo(color, tam, x, y, z) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo(), color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    s.scale.set(tam, tam, 1);
    s.position.set(x, y, z);
    this.grupo.add(s);
    return s;
  }

  // Hacia dónde mira Gno respecto a la cámara (para elegir la columna de su hoja de sprites).
  // Según el control (que ya es relativo a la pantalla); no según cómo lo empujan los choques.
  direccionGno(j) { this.pintorSuelo.dirGno = direccionDe(j, this.pintorSuelo.dirGno); }
  temblar(f) { this.temblor = Math.max(this.temblor, f); }

  // Sol (de día) o luna (de noche) cruzando la parte de arriba de la pantalla según la hora
  moverAstro(P) {
    const d = 30, altoV = Math.tan(THREE.MathUtils.degToRad(this.camara.fov / 2)) * d, anchoV = altoV * this.camara.aspect;
    const noche = P.noche;
    const im = IMG[noche ? 'luna' : 'sol'];
    if (im && this.astro.material.userData.im !== im) { this.astro.material.map = aTextura(new THREE.Texture(im)); this.astro.material.map.needsUpdate = true; this.astro.material.userData.im = im; this.astro.material.needsUpdate = true; }
    const t = noche ? 0.5 : Math.min(1, Math.max(0, P.t));
    const x = Math.cos(Math.PI * t) * anchoV * 0.82, y = altoV * (0.48 + 0.34 * Math.sin(Math.PI * t));
    const tam = 2.6;
    this.astro.position.set(x, y, -d); this.astro.scale.set(tam, tam, 1);
    this.astroBrillo.position.set(x, y, -d - 0.1);
    const b = (noche ? 5 : 7) * (0.9 + Math.sin(performance.now() / 400) * 0.05);
    this.astroBrillo.scale.set(b, b, 1);
    this.astroBrillo.material.color.set(noche ? 0x9fb4ff : (t < 0.15 || t > 0.85 ? 0xff9a5a : 0xffd27a));
    this.astro.visible = this.astroBrillo.visible = !P.jugadorBajoNube || noche;
  }

  // ---------- Cada cuadro ----------
  dibujar(P, reloj, dt, giroLibre = false) {
    if (!this.pintorSuelo.listo) { this.renderer.render(this.escena, this.camara); return; }
    if (this.partida !== P) this.construir(P);
    this.pintorSuelo.vestimenta = this.pintor2D.vestimenta;
    const j = P.jugador;
    this.direccionGno(j);

    // Piso con las sombras del juego
    this.pintorSuelo.dibujar(P, reloj);
    this.texSuelo.needsUpdate = true;

    // Luz: el sol viene del lado contrario a la sombra, con la elevación del juego
    const noche = P.noche;
    if (!noche && P.sol) {
      const { c, a } = tinte(P.t);
      const col = new THREE.Color(`rgb(${c[0]},${c[1]},${c[2]})`);
      this.sol.color.copy(new THREE.Color(0xffffff).lerp(col, Math.min(1, a * 2.5)));
      this.sol.intensity = 1.6;
      this.cielo.intensity = 2.3 - (P.t > 0.9 ? (P.t - 0.9) * 9 : 0);
      this.cielo.color.set(0xfff4e0).lerp(col, Math.min(1, a * 2));
      this.sol.position.set(j.x - P.sol.dx * 10, 10 * P.sol.tanE, j.y - P.sol.dy * 10);
      this.sol.target.position.set(j.x, 0, j.y);
      this.escena.background.set(P.t > 0.9 ? '#4a2c4a' : '#3b2a2a');
    } else {
      this.sol.intensity = 0;
      this.cielo.intensity = 0.28;
      this.cielo.color.set(0x8090ff);
      this.escena.background.set('#0b0f22');
    }
    this.luzGno.intensity = noche ? 1.6 : 0;
    this.luzGno.position.set(j.x, 0.9 + (j.z || 0), j.y);

    // Gno
    const r = this.pintorSuelo.cuadroGno(j, P.estado);
    let t = this.texGno[r[0]];
    if (!t) t = this.texGno[r[0]] = texHoja(r[0]);
    cuadro(t, IMG[r[0]], r[1], r[2], r[3], r[4]);
    this.gno.material.map = t;
    this.gno.position.set(j.x, j.z || 0, j.y + 0.01);
    this.gno.visible = !(j.invuln > 0 && Math.floor(reloj * 14) % 2 === 0);

    // Flores
    for (const o of this.flores) {
      const f = P.flores[this.flores.indexOf(o)];
      if (f.abierta) {
        const a = ANIM.flor, k = Math.floor(reloj * a.fps + f.x * 3) % a.n;
        cuadro(o.t, IMG[a.img], k * 16, 0, 16, 16);
        o.m.material.map = o.t;
        o.halo.material.opacity = 0.45;
        o.halo.material.color.set(0xfff4d0);
      } else {
        o.halo.material.opacity = 0.25 + Math.sin(reloj * 3 + f.x) * 0.1;
      }
    }
    // Destellos
    this.destellos.forEach((o, n) => {
      const d = P.destellos[n];
      o.m.visible = o.halo.visible = !d.muerto;
      if (d.muerto) return;
      const k = 1 - d.apagado * 0.6;
      const mx = d.eje === 'h' ? d.dir : 0, my = d.eje === 'v' ? d.dir : 0;
      const sx = mx * Math.cos(this.yaw) - my * Math.sin(this.yaw), su = -mx * Math.sin(this.yaw) - my * Math.cos(this.yaw);
      const col = Math.abs(sx) > Math.abs(su) ? (sx > 0 ? DIR.derecha : DIR.izquierda) : (su > 0 ? DIR.arriba : DIR.abajo);
      cuadro(o.m.material.map, IMG.espiritu, col * 16, (Math.floor(reloj * 6 + d.fase) % 4) * 16, 16, 16);
      o.m.position.set(d.x, 0.2 + Math.sin(d.fase) * 0.08, d.y);
      o.m.scale.set(k, k, k);
      o.halo.position.set(d.x, 0.65, d.y);
      o.halo.material.opacity = 0.55 * k;
    });
    // Faroles
    for (const o of this.faroles) {
      const f = P.faroles[this.faroles.indexOf(o)];
      o.fuego.visible = f.encendido;
      cuadro(o.fuego.material.map, IMG.fuego, (Math.floor(reloj * 12 + f.x) % 8) * 12, 0, 12, 12);
      o.luz.intensity = f.encendido && noche ? 9 : 0;
      o.halo.material.opacity = f.encendido ? (noche ? 0.7 : 0.25) : 0;
    }
    // Puertas: se hunden al abrirse
    for (const o of this.puertas) {
      const h = o.pu.abierta ? 0.04 : o.alto;
      o.caja.scale.y += (h - o.caja.scale.y) * Math.min(1, dt * 10);
      o.caja.visible = o.caja.scale.y > 0.05 || (!o.pu.permanente && !o.pu.solar);
      o.icono.visible = !o.pu.abierta;
    }
    for (const o of this.relojes) {
      o.m.visible = o.halo.visible = !o.r.tomado;
      o.m.position.y = 0.25 + Math.sin(o.r.fase) * 0.06;
      o.halo.material.opacity = 0.4;
    }
    for (const o of this.rodadoras) o.m.position.set(o.r.x, 0.1 + (o.r.y0 - o.r.y), o.r.y0);
    if (this.salida) {
      const act = P.salida.activa;
      this.salida.m.material.map = texRecorte(act ? R.pedestalActivo : R.pedestal);
      this.salida.halo.material.opacity = act ? 0.55 + Math.sin(reloj * 3) * 0.15 : 0;
    }
    for (const o of this.nubes) o.m.position.set(o.n.x + 0.6, 3.4, o.n.fila);
    // Ventajas: crear las nuevas y quitar las que se recogieron o expiraron
    const vivas = new Set(P.ventajas || []);
    for (const [v, o] of this.ventajas) if (!vivas.has(v)) { this.grupo.remove(o.m, o.halo); this.carteles.splice(this.carteles.indexOf(o.m), 1); this.ventajas.delete(v); }
    for (const v of vivas) {
      let o = this.ventajas.get(v);
      if (!o) { o = { m: this.cartel(['v_' + v.tipo, 0, 0, 0, 0], 0.7, 0.7, v.x, v.y), halo: this.halo(0xfff2a8, 1.3, v.x, 0.6, v.y) }; this.ventajas.set(v, o); }
      o.m.position.y = 0.2 + Math.sin(v.fase) * 0.1;
      const parpadea = v.vida < 5 && Math.floor(reloj * 8) % 2 === 0;
      o.m.visible = !parpadea;
      o.halo.material.opacity = 0.35 + Math.sin(reloj * 4 + v.x) * 0.15;
    }
    this.moverAstro(P);
    for (const o of this.plataformas) o.m.position.set(o.pl.x, Math.sin(reloj * 2 + o.pl.x) * 0.02, o.pl.y);

    // Cámara: gira suave hacia el ángulo pedido; en el título da vueltas sola
    if (giroLibre) this.yawObj += dt * 0.15;
    this.yaw += (this.yawObj - this.yaw) * Math.min(1, dt * 7);
    const pitchObj = this.alta ? 1.0 : 0.6, distObj = this.alta ? Math.max(P.w, P.h) * 1.12 : 13;
    this.pitch += (pitchObj - this.pitch) * Math.min(1, dt * 5);
    this.dist += (distObj - this.dist) * Math.min(1, dt * 5);
    const centro = new THREE.Vector3(P.w / 2, 0, P.h / 2), jug = new THREE.Vector3(j.x, j.z || 0, j.y);
    const meta = this.alta ? centro.lerp(jug, 0.12) : jug;
    this.objetivo.lerp(meta, Math.min(1, dt * 4));
    const cp = Math.cos(this.pitch) * this.dist;
    this.camara.position.set(this.objetivo.x + Math.sin(this.yaw) * cp, this.objetivo.y + Math.sin(this.pitch) * this.dist, this.objetivo.z + Math.cos(this.yaw) * cp);
    this.camara.lookAt(this.objetivo);
    if (this.temblor > 0) {
      this.camara.position.x += (Math.random() - 0.5) * this.temblor; this.camara.position.y += (Math.random() - 0.5) * this.temblor;
      this.temblor = Math.max(0, this.temblor - dt * 1.5);
    }

    // Los sprites de pie siempre miran de frente a la cámara (billboard)
    for (const m of this.carteles) m.quaternion.copy(this.camara.quaternion);
    for (const o of this.rodadoras) o.m.rotateZ(o.r.giro);
    this.renderer.render(this.escena, this.camara);
  }
}
