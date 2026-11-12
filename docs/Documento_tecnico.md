# Documento técnico · Requerimientos de hardware y software

**Proyecto:** Hora Dorada · **Equipo:** Joel Armando Ibarra Rubalcava y Jorge Humberto Martínez Delgado · **UTH · IDGS 8-2**

Este documento describe qué equipo y qué herramientas se necesitan para **desarrollar** Hora Dorada y para **jugarlo**.

## 1. Requerimientos para desarrollar

### 1.1 Hardware

| Componente | Mínimo | Recomendado |
|---|---|---|
| Procesador | 2 núcleos a 2 GHz (Intel Core i3 / Ryzen 3) | 4 núcleos o más (Core i5 / Ryzen 5) |
| Memoria RAM | 4 GB | 8 GB o más |
| Almacenamiento | 1 GB libre | SSD con 5 GB libres |
| Gráficos | Integrados con soporte de Canvas 2D | Integrados recientes o tarjeta dedicada |
| Pantalla | 1366 × 768 | 1920 × 1080 |
| Otros | Teclado, ratón y conexión a Internet | Celular para probar los controles táctiles y audífonos para revisar el audio |

### 1.2 Software

| Herramienta | Uso en el proyecto | Licencia |
|---|---|---|
| **Visual Studio Code** | Editor de código | Gratis |
| **Navegador moderno** (Chrome, Edge o Firefox) | Ejecutar y depurar con sus herramientas de desarrollador | Gratis |
| **Python 3** | Servidor local (`python -m http.server`) y script que genera los mapas SVG | Libre |
| **Git** | Control de versiones | Libre |
| **GitHub** | Repositorio, tarjetas (issues/Projects) y publicación con GitHub Pages | Gratis |
| **GitHub CLI (`gh`)** | Crear el repositorio y las tarjetas desde la terminal | Libre |
| **Playwright** (opcional) | Pruebas automáticas en el navegador | Libre |

### 1.3 Tecnologías del juego

| Tecnología | Para qué se usa |
|---|---|
| **HTML5 + CSS3** | Pantallas, HUD, menús y controles táctiles |
| **JavaScript (módulos ES)** | Toda la lógica del juego, sin librerías externas |
| **Three.js** (r160, MIT) | Mundo 3D: cajas para muros y mesetas, sprites de pie, luces y cámara que orbita |
| **Canvas 2D** | Textura del piso (arena, placas y sombras proyectadas) e historia |
| **NES.css** (MIT) | Componentes de la interfaz: botones, paneles, barras, corazones y estrellas |
| **pixelarticons** (MIT) | Íconos de la interfaz |
| **Piper** (MIT) | Motor de voz neuronal con el que se grabaron las 29 frases (`herramientas/generar_voces.py`) |
| **Web Speech API** | Voz de respaldo si falta alguna grabación |
| **Web Audio API + `<audio>`** | Efectos de sonido (WAV decodificados) y música en MP3 con fundidos |
| **Paquete Ninja Adventure (CC0)** | Sprites, animaciones, música y efectos gratuitos; ver `assets/CREDITOS.md` |
| **localStorage** | Guardar progreso, estrellas, récords y vestimenta |
| **SVG** | Splash, storyboard y bocetos de mapas para la documentación |

### 1.4 Herramientas para arte y animación (alternativas)

El arte del juego son sprites del paquete gratuito Ninja Adventure (CC0). Estas herramientas sirven para editarlos o crear más:

| Herramienta | Uso | Licencia |
|---|---|---|
| Inkscape | Ilustración vectorial (SVG) | Libre |
| Aseprite / LibreSprite | Pixel art y animación cuadro por cuadro | De pago / libre |
| Krita | Ilustración y animación 2D | Libre |
| Blender | Modelado y animación 3D (para un futuro tráiler) | Libre |
| Audacity | Grabar y editar audio | Libre |
| BeepBox / jsfxr | Componer música y efectos retro | Gratis |
| OBS Studio | Grabar el video de presentación | Libre |

## 2. Requerimientos para jugar

| | Mínimo |
|---|---|
| **PC** | Cualquier equipo que corra un navegador moderno (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+) |
| **Celular** | Android 9+ o iOS 15+ con navegador actualizado |
| **Conexión** | Solo para abrir la página y cargar la fuente; el juego corre en el navegador |
| **Controles** | Teclado y ratón, o pantalla táctil |
| **Rendimiento** | Pensado para 60 cuadros por segundo; la escena se ajusta al tamaño de la pantalla |

## 3. Arquitectura del código

```
hora-dorada/
├── index.html            # pantallas, HUD y controles táctiles
├── css/estilo.css
├── js/
│   ├── main.js           # pantallas, controles, progreso, vestuario y bucle principal
│   ├── juego.js          # lógica: sol, sombras, flores, placas, puertas, destellos, espejos, nubes, puntaje
│   ├── dibujo.js         # dibujo en Canvas 2D con sprites: escenario, Gno, sombras, luz
│   ├── sprites.js        # carga de imágenes, recortes de cada sprite y animaciones
│   ├── mundo3d.js        # mundo 3D con Three.js y cámara giratoria
│   ├── historia.js       # historia: escenas con sprites y cuadro de diálogo
│   ├── voz.js            # voces grabadas (Piper) y respaldo con Web Speech API
│   ├── controles.js      # teclas configurables por el jugador
│   ├── iconos.js         # inserta los íconos SVG de pixelarticons
│   ├── niveles.js        # los 17 niveles en texto
│   └── audio.js          # música (MP3) y efectos (WAV)
├── assets/               # sprites, música, efectos y voces del paquete Ninja Adventure (CC0) + CREDITOS.md
├── lib/                  # Three.js, NES.css y pixelarticons
├── herramientas/mapas_svg.py   # genera img/mapas/*.svg desde niveles.js
├── img/                  # splash, storyboard, mapas y capturas
└── docs/                 # GDD y este documento
```

**Bucle principal:** `requestAnimationFrame` → leer controles → `Partida.actualizar(dt)` → `Pintor.dibujar()`.

**Cálculo de sombras:**
- La sombra del sol tiene dirección `(−cos πt, −sin πt)` y largo `h / tan(e)`.
- Las sombras de los faroles y espejos salen de una luz puntual a 2.2 casillas de altura, con largo `h · d / (2.2 − 0.55h)`.
- Para saber si una sombra cubre un objeto, se proyecta el objeto sobre el eje de la sombra y se compara la distancia perpendicular con el ancho de la sombra.
- **Cámara 3D:** `vista` = número de giros de 90°. La dirección del sol se calcula en la pantalla, `(−cos πt, −sin πt)`, y se pasa al mapa con `dirAMapa(dx, dy, vista)`; los controles se convierten igual. En Three.js la cámara se coloca en `(sin θ, ·, cos θ)` alrededor del objetivo con `θ = vista · 90°`, y la luz direccional viene del lado contrario a la sombra con la elevación del juego.
- **Dirección del personaje:** se toma de la dirección del control (en pantalla) con un poco de histéresis en diagonal, y no del movimiento real; así no "gira como loco" cuando choca o se desliza junto a un muro.
- **Ventajas, eventos y retos:** al cargar el nivel se calculan las casillas alcanzables desde el inicio (relleno por vecinos) para poner ventajas y objetos del evento. Los efectos viven en `partida.efectos` con su tiempo restante; los multiplicadores de puntos se suman como *bono* en el desglose.
- **Sol y reloj:** el sol 3D es un sprite hijo de la cámara (en `x = cos(πt)`, arriba de la pantalla); el HUD dibuja el cielo y el reloj en dos lienzos pequeños.
- **Plataformas:** las fijas (`Y`) cuentan como mesetas de 0.8; las móviles (`H`, `K`) son objetos que avanzan sobre el agua y se dan la vuelta en la orilla. `pisoEn(x, y)` devuelve la altura del piso contando las plataformas; si Gno está encima, se suma el desplazamiento de la plataforma. El agua solo es pared si `z < 0.75`; si Gno aterriza en el agua, vuelve al último lugar firme.
- **Controles:** `controles.js` guarda un mapa acción → teclas (dos por acción) en `localStorage`; la lectura del teclado y las listas de controles se arman con ese mapa.
- **Eje Z (salto y mesetas):** Gno tiene altura `z` y velocidad vertical `vz` (salto de 5.4 casillas/s, gravedad 15 casillas/s²). Si sus pies están a una altura `z`, la sombra del sol va de `z / tan(e)` a `(z + h) / tan(e)`. Las mesetas `T` (0.8) y `U` (1.6) solo son pared si `z` es menor que su altura.
- **Sombras con sprites:** la silueta del cuadro actual del sprite se pinta de un color y se proyecta con una transformación afín (`ctx.transform`): el eje vertical del sprite apunta hacia la sombra con el largo calculado. Por eso la sombra camina, salta y se "viste" igual que Gno.

**Sprites:** las imágenes se cargan antes de quitar la pantalla de carga. Los muros, el oasis y las mesetas se arman por cuartos de 8×8 según sus vecinos (autotile). Los muros usan el relieve de arena entintado color adobe.

**Verificación de niveles:** un script en el navegador usa el mismo código del juego para recorrer todas las casillas alcanzables y todas las horas, y confirma que cada flor y cada placa se puede alcanzar. Los 14 niveles originales pasan la prueba. Para el nivel 15 (Mesetas) se simularon también las alturas (arena, meseta baja, meseta alta y salto): las flores del jardín cerrado no se alcanzan desde la arena, pero sí desde las mesetas.
