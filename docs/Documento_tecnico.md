# Documento técnico · Requerimientos de hardware y software

**Proyecto:** Hora Dorada · **Autor:** Joel Armando Ibarra Rubalcava · **UTH · IDGS 8-2**

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
| **Canvas 2D** | Dibujo del mundo, personajes, sombras, luz del día y de la noche |
| **Web Audio API** | Música y efectos generados en tiempo real |
| **localStorage** | Guardar progreso, estrellas, récords y vestimenta |
| **SVG** | Splash, storyboard y bocetos de mapas para la documentación |

### 1.4 Herramientas para arte y animación (alternativas)

El arte del juego se dibuja con código, pero estas herramientas sirven para bocetos o para ampliarlo:

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
│   ├── dibujo.js         # dibujo en Canvas 2D: Gno, escenario, sombras, luz
│   ├── niveles.js        # los 14 niveles en texto
│   └── audio.js          # música y efectos con Web Audio
├── herramientas/mapas_svg.py   # genera img/mapas/*.svg desde niveles.js
├── img/                  # splash, storyboard, mapas y capturas
└── docs/                 # GDD y este documento
```

**Bucle principal:** `requestAnimationFrame` → leer controles → `Partida.actualizar(dt)` → `Pintor.dibujar()`.

**Cálculo de sombras:**
- La sombra del sol tiene dirección `(−cos πt, −sin πt)` y largo `h / tan(e)`.
- Las sombras de los faroles y espejos salen de una luz puntual a 2.2 casillas de altura, con largo `h · d / (2.2 − 0.55h)`.
- Para saber si una sombra cubre un objeto, se proyecta el objeto sobre el eje de la sombra y se compara la distancia perpendicular con el ancho de la sombra.

**Verificación de niveles:** un script en el navegador usa el mismo código del juego para recorrer todas las casillas alcanzables y todas las horas, y confirma que cada flor y cada placa se puede alcanzar. Los 14 niveles pasan la prueba.
