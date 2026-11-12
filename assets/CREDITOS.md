# Créditos de los recursos gráficos, de audio y librerías

## Librerías (código de terceros, todas gratuitas)

| Librería | Para qué | Licencia | Dónde |
|---|---|---|---|
| **Three.js** r160 | Mundo 3D y cámara que gira alrededor del desierto | MIT | `lib/three/` |
| **NES.css** 2.3.0 | Botones, paneles, barras, corazones y estrellas de la interfaz | MIT | `lib/nes.css/` |
| **pixelarticons** 1.8.1 | Íconos (sol, luna, pausa, casa, sonido, etc.) | MIT | `lib/pixelarticons/` |
| **Pixelify Sans** | Fuente pixel | SIL Open Font License | Google Fonts |
| **Piper** 1.8 | Motor de voz neuronal con el que se grabaron las voces (se usó en la computadora, no viaja con el juego) | MIT (motor); voces: es_MX "claude" Apache-2.0 y es_MX "ald" Unlicense | `assets/audio/voz/lineas/` |
| **Web Speech API** | Voz de respaldo si falta alguna grabación | Incluida en el navegador | — |


Todos los sprites, animaciones, música y efectos de sonido del juego vienen del paquete gratuito:

**Ninja Adventure – Asset Pack**, de **Pixel-boy** y **AAA**
- Página: <https://pixel-boy.itch.io/ninja-adventure-asset-pack>
- Licencia: **Creative Commons Zero (CC0 1.0)**. Se puede usar, modificar y publicar sin pedir permiso, incluso en proyectos comerciales. Dar crédito no es obligatorio, pero lo damos con gusto. El texto completo está en [LICENCIA_NinjaAdventure_CC0.txt](LICENCIA_NinjaAdventure_CC0.txt).

Solo se copiaron al proyecto los archivos que el juego usa. Algunos se renombraron, y la música se convirtió de OGG a MP3 para que también suene en iPhone.

## Sprites (`sprites/`)

| Archivo del juego | Archivo original del paquete | Uso |
|---|---|---|
| `tiles/desierto.png` | Backgrounds/Tilesets/TilesetDesert.png | Agua del oasis, cráneo de vaca, ocotillo, rodadora |
| `tiles/naturaleza.png` | Backgrounds/Tilesets/TilesetNature.png | Saguaro, biznaga, agave, rocas |
| `tiles/suelo.png` | Backgrounds/Tilesets/TilesetFloor.png | Arena y caminos |
| `tiles/detalles_suelo.png` | Backgrounds/Tilesets/TilesetFloorDetail.png | Huesos y piedritas |
| `tiles/relieve.png` | Backgrounds/Tilesets/TilesetRelief.png | Muros de adobe (entintados) y mesetas |
| `tiles/elementos.png` | Backgrounds/Tilesets/TilesetElement.png | Faroles y rejas |
| `tiles/mazmorra.png` | Backgrounds/Tilesets/TilesetDungeon.png | Placas, pedestal del reloj de sol, cristal del espejo, bloques de las puertas |
| `tiles/logica.png` | Backgrounds/Tilesets/TilesetLogic.png | Íconos A, B y ojo del sello |
| `tiles/agua.png` | Backgrounds/Tilesets/TilesetWater.png | (reserva) |
| `personajes/flam_*.png` | Actor/Character/Flam/SeparateAnim | Gno (caminar, quieto, brazos arriba, salto, derrota) |
| `personajes/samurai_*.png` | Actor/Character/Samurai/SeparateAnim | Vestuario "Sombrero de palma" |
| `personajes/ninjared_*.png` | Actor/Character/NinjaRed/SeparateAnim | Vestuario "Paliacate" |
| `personajes/princess_*.png` | Actor/Character/Princess/SeparateAnim | Vestuario "Flor en el pelo" |
| `personajes/spirit_*.png` | Actor/Character/Spirit/SeparateAnim | Vestuario "Espíritu de luz" |
| `personajes/sombra.png` | Actor/Character/Shadow.png | Sombrita bajo los pies |
| `monstruos/espiritu.png` | Actor/Monster/Spirit/SpriteSheet.png | Destellos |
| `objetos/flor_animada.png` | Backgrounds/Animated/Plant/SpriteSheet16x16.png | Flores de luna |
| `objetos/reloj_arena.png` | Items/Object/Hourglass.png | Relojes de arena |
| `objetos/moneda_sol.png` | Items/Treasure/GoldCoin.png | Sol del HUD y puerta solar |
| `objetos/nube.png` | FX/Particle/Clouds.png | Nubes |
| `fx/circulo_naranja.png` | FX/Magic/Circle/SpriteSheetOrange.png | Reloj de sol activo |
| `fx/chispa_magica.png` | FX/Magic/Spark/SpriteSheet.png | Flor que se abre |
| `fx/chispa.png` | FX/Particle/Spark.png | Partículas y brillo de la sombra |
| `fx/fuego.png` | FX/Particle/Fire.png | Llama de los faroles |
| `fx/humo.png` | FX/Smoke/Smoke/SpriteSheet.png | (reserva) |
| `ui/corazon.png`, `ui/corazones.png` | Ui/Receptacle/IconHeart.png, Heart.png | (reserva) |
| `teclas/*.png` | Ui/Input/Keyboard/Key*.png | Teclas de la lista de controles |
| `dialogo/caja_dialogo.png` | Ui/Dialog/DialogBoxFaceset.png | Cuadro de diálogo de la historia |
| `tiles/mazmorra.png` (caja) | Backgrounds/Tilesets/TilesetDungeon.png | Plataformas de madera |
| `ui/sol.png`, `ui/luna.png` | Ui/Skill Icon/Meteo/Sun.png, Moon.png | Sol y luna del cielo y del HUD |
| `ventajas/*.png` | Items/Resource (GemPurple, GemYellow, GemGreen, feather), Items/Potion (WaterPot, Heart), Items/Treasure/GoldCup, Items/Food/SeedLarge | Ventajas |
| `personajes/flam_cara.png`, `personajes/estatua_cara.png` | Actor/Character/Flam/Faceset.png, Statue/Faceset.png | Retratos de Gno y del narrador |
| `personajes/*_jump.png` | Actor/Character/*/SeparateAnim/Jump.png | Salto |

## Música (`audio/musica/`)

| Archivo | Original | Cuándo suena |
|---|---|---|
| `titulo.mp3` | Audio/Musics/1 - Adventure Begin.ogg | Título y menús |
| `dia.mp3` | Audio/Musics/31 - Sunny.ogg | Niveles de día |
| `noche.mp3` | Audio/Musics/13 - Mystical.ogg | Niveles de noche |
| `historia.mp3` | Audio/Musics/6 - Story (Short).ogg | Historia |
| `tranquila.mp3` | Audio/Musics/5 - Peaceful.ogg | Niveles 9 a 12 |
| `ruinas.mp3` | Audio/Musics/30 - Ruins.ogg | Niveles 15 y 16 |
| `final.mp3` | Audio/Musics/8 - End Theme.ogg | Al terminar el último nivel |

## Efectos (`audio/sfx/`)

| Archivo | Original (Audio/…) |
|---|---|
| `crece.wav` | Sounds/Menu/Move1.wav |
| `flor.wav` | Sounds/Magic & Skill/Heal.wav |
| `todas.wav` | Sounds/Bonus/PowerUp1.wav |
| `placa.wav` / `placa_off.wav` | Sounds/Menu/Accept.wav / Cancel.wav |
| `puerta.wav` | Sounds/Hit & Impact/Impact.wav |
| `sello.wav` | Jingles/Secret2.wav |
| `destello.wav` | Sounds/Magic & Skill/Spirit.wav |
| `danio.wav` | Sounds/Hit & Impact/Hit1.wav |
| `farol.wav` | Sounds/Elemental/Fire.wav |
| `ganar.wav` / `perder.wav` | Jingles/LevelUp1.wav / GameOver.wav |
| `clic.wav` | Sounds/Menu/Accept2.wav |
| `reloj.wav` | Sounds/Bonus/Coin.wav |
| `sin_arena.wav` | Sounds/Alert/Alert.wav |
| `estirar.wav` / `saltar.wav` | Sounds/Jump & Bounce/Jump.wav / Jump2.wav |
| `aterrizar.wav` | Sounds/Hit & Impact/Impact2.wav |
| `arena_loop.wav` | Sounds/Ambient/Wind.wav (recortado a 6 s) |
| `girar.wav` | Sounds/Whoosh & Slash/Whoosh.wav |
| `../voz/voz1.wav` … `voz10.wav` | Sounds/Voice/Voice1.wav … Voice10.wav (balbuceo si la voz está apagada) |
| `agua.wav` | Sounds/Elemental/Water1.wav |
| `ventaja.wav` | Sounds/Bonus/PowerUp2.wav |

## Voces (`audio/voz/lineas/`)

Las 29 frases (historia, controles, presentación de cada nivel y reacciones) se generaron con **Piper** usando el script `herramientas/generar_voces.py`:

- **Gno:** voz `es_MX-claude-high` (datos con licencia Apache-2.0), un poco más aguda.
- **Narrador:** voz `es_MX-ald-medium` (datos con licencia Unlicense, dominio público), más pausada.

Modelos: <https://huggingface.co/rhasspy/piper-voices>.

## Lo que sí es propio del equipo

El concepto del juego, las mecánicas (sol, sombras, cámara 3D, mesetas y salto), los 17 niveles, la historia, el código y la documentación. Las sombras, la luz del día y de la noche se calculan con código a partir de la silueta de cada sprite.
