# Documento de Diseño de Juego (GDD) · HORA DORADA

![Hora Dorada](../img/splash.svg)

## 1. Portada

| | |
|---|---|
| **Juego** | Hora Dorada |
| **Escuela / grupo** | Universidad Tecnológica de Hermosillo (UTH) · IDGS 8-2 |
| **Materia / docente** | _(completar)_ |
| **Fecha** | Noviembre de 2026 |
| **Versión del documento** | 1.0 |

| Foto | Integrante | Rol |
|:---:|---|---|
| <img src="../img/foto_pendiente.svg" width="90" alt="Foto"> | **Joel Armando Ibarra Rubalcava** | Programación, Git y diseño de niveles (líder técnico) |
| <img src="../img/foto_pendiente.svg" width="90" alt="Foto"> | **Jorge Humberto Martínez Delgado** | Arte, audio (música y efectos), QA y documentación |

## 2. Nombre del juego

**HORA DORADA**. En fotografía, la *hora dorada* es el rato después del amanecer y antes del atardecer, cuando el sol está bajo y las sombras son más largas. En el juego es justo cuando tu sombra alcanza más lejos.

## 3. Enlaces

| | |
|---|---|
| Repositorio | <https://github.com/joeljorex/hora-dorada> |
| Jugar en línea | <https://joeljorex.github.io/hora-dorada/> |
| Proyecto (tarjetas) | <https://github.com/joeljorex/hora-dorada/issues> |

## 4. Concepto

Juego de rompecabezas en 2D visto desde arriba. Controlas a **Gno**, el espíritu de un reloj de sol, y tu única herramienta es **tu sombra**. Para apuntarla **cambias la hora del día**: si adelantas o regresas el sol, la sombra cambia de dirección y de largo. Con ella haces florecer las flores de luna, activas placas, rompes sellos y apagas espíritus de luz.

> **Frase de venta:** "Mueve el sol. Mueve tu sombra."

**Lo novedoso:** en casi todos los juegos la sombra es decoración. Aquí es el control principal, y se usa con una regla que todos conocemos de la vida real: la sombra es larga en la mañana y en la tarde, y corta al mediodía.

## 5. Género

- **Principal:** rompecabezas (*puzzle*) de lógica espacial.
- **Secundario:** acción ligera, porque hay que esquivar destellos y el tiempo corre.
- **Formato:** niveles cortos (de 1 a 4 minutos) con estrellas y puntaje para volver a jugarlos.

## 6. Público objetivo

| | |
|---|---|
| **Edad** | De 8 años en adelante. Clasificación sugerida: **E (Todos)**. No tiene violencia; los "enemigos" se apagan en la sombra. |
| **Perfil** | Jugadores casuales que disfrutan pensar (rompecabezas, juegos de lógica) y estudiantes. |
| **Plataforma** | Navegador web en PC (teclado y ratón) y celular (controles táctiles). |
| **Por qué les gusta** | La regla se entiende en segundos y cada nivel agrega una idea nueva. Se puede volver a jugar para conseguir 3★ y más puntos. |

## 7. Historia

En el desierto de Sonora crecen las **flores de luna**, que solo abren de noche. Un verano, el desierto se apagó: las flores dejaron de abrir y el valle perdió su brillo.

Entre unas ruinas de adobe quedaba un viejo reloj de sol. Su aguja, el *gnomon*, llevaba siglos marcando la hora con su sombra. Una tarde, la aguja despertó convertida en un pequeño espíritu: **Gno**.

Gno descubrió que su sombra guarda un poco de la noche. Si toca a una flor de luna, la flor abre. Además, con la arena de su reloj puede **mover el sol**: regresar la mañana o adelantar la tarde para que su sombra llegue a donde él no puede.

Así recorre el desierto: campos de saguaros, oasis con espejos, laberintos de biznagas y noches de faroles, hasta llegar al **último atardecer**, donde debe usar todo lo aprendido para que el valle vuelva a brillar.

## 8. Personajes

| Personaje | Descripción | Comportamiento |
|---|---|---|
| **Gno** (protagonista) | Espíritu nacido de la aguja de un reloj de sol: una flamita naranja (sprite "Flam" del paquete Ninja Adventure, CC0). | Camina, salta, se sube a las mesetas, se estira para alargar su sombra y mueve el sol con la arena de su reloj. |
| **Destellos** (obstáculo) | Pequeños espíritus de luz pura (sprite "Spirit" del paquete) con un halo dorado. | Patrullan en línea recta y se dan la vuelta al chocar o al encontrar sombra de muros. Si tocan a Gno, le quitan un corazón. Se apagan dentro de la sombra de Gno. |
| **Flores de luna** (objetivo) | Inspiradas en la "reina de la noche", un cactus real del desierto sonorense que florece de noche. Botón morado que se abre en una flor blanca brillante. | Se abren si la sombra de Gno las cubre un momento. Cuando abren todas, se activa el reloj de sol de salida. |

## 9. Mecánicas

### 9.1 El sol y la sombra

La hora va de `t = 0` (amanecer, 6:00 a. m.) a `t = 1` (anochecer, 7:00 p. m.).

- **Dirección de la sombra:** `(−cos πt, −sin πt)`. En la mañana apunta a la izquierda (oeste), al mediodía hacia arriba (norte) y en la tarde a la derecha (este). Nunca apunta hacia abajo (sur).
- **Elevación del sol:** `e = 1.25 · sin(πt)` radianes.
- **Largo de la sombra:** `altura / tan(e)`, con un máximo de 12 casillas. Gno mide 1.4; estirado mide 1.95.
- **Con altura (eje Z):** si los pies de Gno están a una altura `z`, su sombra empieza a `z / tan(e)` y termina a `(z + 1.4) / tan(e)`.

| Hora | Largo de la sombra de Gno |
|---|---|
| 6:39 a. m. (`t = 0.05`) | 7.1 casillas |
| 7:18 a. m. (`t = 0.10`) | 3.5 casillas |
| 12:30 p. m. (`t = 0.50`) | 0.5 casillas |

### 9.2 Reglas

1. Tu sombra **pasa por encima de los muros**; tú no puedes cruzarlos.
2. `Q` / `E` mueven el sol y gastan **arena** (1 segundo de arena por segundo de uso). El día también avanza solo.
3. Si llega la **noche** antes de abrir todas las flores, pierdes.
4. **Placas lunares:** abren su puerta mientras tu sombra las cubre.
5. **Sellos ☾:** si cubres todos a la vez, su puerta se abre para siempre.
6. **Puertas solares:** solo están abiertas al mediodía (de 11:12 a. m. a 1:48 p. m.).
7. **Nubes:** bajo una nube no tienes sombra de sol.
8. **Espejos solares:** reflejan el sol y te dan una **segunda sombra** que apunta lejos del espejo. Es la única forma de tener sombra hacia abajo de día.
9. **Noche:** no hay sol; cada **farol** encendido te da su propia sombra. Las velas se gastan con el tiempo.
10. Tienes **3 corazones**: si los destellos te los quitan todos, pierdes.
11. **Saltar y mesetas (mecánica 3D):** Gno puede saltar (sube casi 1 casilla) y subirse a las **mesetas de roca**. Desde lo alto su sombra llega más lejos, y al saltar la sombra se despega de sus pies. En alto, los destellos no lo alcanzan.

### 9.4 Cámara 3D (perspectiva)

El desierto se ve en **3D** (Three.js) y la cámara puede **girar alrededor del mundo** en pasos de 90° (`Z` / `X`) y **subir o bajar** (`C`).

- El sol está fijo respecto a la cámara: **siempre sale a la derecha de la pantalla**. Por eso, al girar la cámara, la sombra cae hacia otro rumbo del mapa.
- Sin girar, la sombra nunca apunta al sur (abajo). Con la cámara girada sí, y así se alcanzan flores "imposibles".
- Los controles también son relativos a la cámara: arriba siempre es "hacia el fondo de la pantalla".
- El HUD muestra qué rumbo queda arriba (Norte, Oeste, Sur o Este).

| Cámara | Rumbo arriba | La sombra de la mañana cae hacia |
|---|---|---|
| Inicial | Norte | Oeste |
| 1 giro a la derecha | Oeste | Sur |
| 2 giros | Sur | Este |
| 3 giros | Este | Norte |

### 9.5 Plataformas

| Elemento | Letra en el mapa | Cómo funciona |
|---|---|---|
| Plataforma fija | `Y` | Caja de madera a 0.8 sobre el agua; se sube saltando |
| Plataforma que se mueve de lado | `H` | Va y viene sobre el agua y se da la vuelta en la orilla; si Gno está encima, lo lleva |
| Plataforma que se mueve de arriba abajo | `K` | Igual, pero en vertical |

- Saltando se puede pasar por encima del agua. Si Gno cae al agua, vuelve al último lugar firme.
- Al saltar desde una plataforma que se mueve, Gno conserva su impulso y vuelve a caer sobre ella.
- Encima de una plataforma Gno está a 0.8 de altura, así que su sombra llega más lejos.

### 9.6 Ventajas, eventos y retos (cada intento es distinto)

**Ventajas aleatorias.** Al empezar aparecen 2 en lugares al azar del mapa (4 con el evento *Lluvia de ventajas*) y luego otra cada 20–30 s (máximo 3 a la vez). Duran 30 s en el piso; parpadean antes de desaparecer.

| Ventaja | Efecto | Duración |
|---|---|---|
| Sombra larga (gema morada) | La sombra mide 50 % más | 15 s |
| Prisa (pluma) | Caminas 50 % más rápido | 12 s |
| Tiempo quieto (gema amarilla) | El sol (o la vela) se detiene | 12 s |
| Salto alto (gema verde) | Saltas 25 % más alto | 15 s |
| Escudo (poción azul) | Los destellos no te dañan | 10 s |
| Corazón (poción roja) | +1 corazón (hasta 4) | — |
| Doble puntos (copa) | Todos los puntos valen el doble | 20 s |
| Semilla mágica | Las flores abren al doble de rápido | 15 s |

**Evento del nivel** (uno al azar en cada intento):

| Evento | Qué cambia |
|---|---|
| Brisa del desierto | Pasan 2 nubes y 3 rodadoras extra (solo de día) |
| Día veloz | El sol avanza 30 % más rápido, pero los puntos valen 50 % más |
| Lluvia de ventajas | Empiezas con 4 ventajas y aparecen más seguido |
| Tesoro de arena | Hay 2 relojes de arena escondidos |
| Destellos inquietos | Los destellos van 50 % más rápido y valen el doble |

**Reto opcional** (uno al azar): terminar sin perder corazones, recoger 2 ventajas, apagar todos los destellos, terminar con la mitad de arena o más, o terminar en menos de 2 minutos y medio. Da +300 o +400 puntos.

### 9.7 El sol y el reloj

- En el mundo 3D se ve el **sol** cruzando la parte de arriba de la pantalla: sale por la derecha, sube al mediodía y se pone por la izquierda (de noche se ve la **luna**).
- En el HUD hay un **cielo** con el sol que avanza con la hora y un **reloj de manecillas** (de 6:00 a. m. a 7:00 p. m.; de noche avanza con la vela). Los dos se mueven solos con el tiempo y más rápido al usar `Q` / `E`.

### 9.8 Altura y salto

El juego se ve desde arriba, pero el mundo tiene un **eje Z** (altura):

| Elemento | Altura | Cómo se usa |
|---|---|---|
| Arena | 0 | Piso normal |
| Meseta baja `T` | 0.8 | Se sube saltando desde la arena |
| Meseta alta `U` | 1.6 | Se sube saltando desde una meseta baja |
| Salto | +0.97 | Velocidad inicial 5.4 casillas/s y gravedad 15 casillas/s² (≈0.7 s en el aire) |

- Una meseta solo es pared si Gno está más abajo que su parte de arriba; si salta lo bastante alto, puede caminar sobre ella. Al salir por la orilla, cae con gravedad.
- La sombra usa la altura real: desde una meseta alta y saltando, Gno tiene `1.6 + 0.97 + 1.4 ≈ 4` de altura, casi **3 veces** más sombra que en la arena.
- El dibujo también usa la altura: Gno sube en la pantalla, su sombrita de contacto se queda en el piso y se hace chica, y se dibuja encima de lo que tiene enfrente.

### 9.3 Controles

| Acción | Teclado | Celular |
|---|---|---|
| Caminar | `W` `A` `S` `D` / flechas | Palanca |
| Regresar / adelantar el sol | `Q` / `E` o rueda del ratón | ◀☀️ / ☀️▶ |
| Estirarse | `Espacio` | ⇑ |
| Saltar | `J` / `Shift` | ⤒ |
| Girar la cámara | `Z` / `X` | ↺ / ↻ |
| Cámara alta / baja | `C` | 👁 |

Todas las teclas se pueden cambiar en el menú **Controles** (dos teclas por acción; se guarda en el navegador).
| Prender o apagar un farol | `F` / `Enter` | F |
| Reiniciar / pausa / sonido | `R` / `Esc` / `M` | ⏸ |

## 10. Niveles

Hay 17 niveles. Cada uno presenta una idea nueva y la combina con las anteriores.

| # | Nombre | Momento | Idea nueva |
|---|---|---|---|
| 1 | Amanecer | Día | Tu sombra abre las flores |
| 2 | Adelanta el sol | Día | Mover la hora con la arena |
| 3 | Del otro lado | Día | La sombra cruza muros; al amanecer es larguísima |
| 4 | Placas lunares | Día | Puertas que se abren a una hora exacta |
| 5 | Destellos | Día | Enemigos de luz |
| 6 | Noche de faroles | Noche | Sombras de los faroles |
| 7 | Dos sombras | Noche | Dos sellos a la vez con dos faroles |
| 8 | Hora dorada | Día | Repaso: planear el día completo |
| 9 | Nubes de agosto | Día | Nubes que quitan la sombra y relojes de arena |
| 10 | Puerta del mediodía | Día | Puertas solares |
| 11 | Espejo del oasis | Día | Espejos que dan sombra hacia abajo |
| 12 | Biznagas | Día | Laberinto con destellos y placa |
| 13 | Tres faroles | Noche | Tres sombras y un farol apagado |
| 14 | Último atardecer | Día | Gran final: todo junto |
| 15 | Mesetas | Día | Saltar, subir a mesetas y alargar la sombra desde lo alto (sin arena: el sol sube solo) |
| 16 | Cuatro vientos | Día | Cámara 3D: una flor en cada rumbo; la del sur solo se alcanza girando la cámara |
| 17 | Oasis flotante | Día | Plataformas fijas y móviles sobre el agua; la flor del sur pide girar la cámara |

### 10.1 Mapa bocetado con su comportamiento (Nivel 4: Placas lunares)

![Mapa del nivel 4](../img/mapa_nivel4_comportamiento.svg)

1. Gno empieza a la izquierda. A las **6:35 a. m.** su sombra es tan larga que, parado junto a la puerta **A**, alcanza la **placa A** y la puerta se abre.
2. Del otro lado abre las dos flores (cualquier hora sirve).
3. La puerta **B** necesita que la sombra apunte a la derecha, lo que pasa **al atardecer (≈6:40 p. m.)**. Hay que esperar o gastar arena para llegar a esa hora.
4. Con la puerta B abierta, corre al reloj de sol antes de que caiga la noche.

Los mapas de los 17 niveles están en [`img/mapas/`](../img/mapas/) y se generan con `herramientas/mapas_svg.py` a partir de `js/niveles.js`.

## 11. Armas

Hora Dorada no tiene armas de daño. Las "armas" son herramientas de luz y sombra:

| Herramienta | Qué hace |
|---|---|
| **Sombra de Gno** | Abre flores, activa placas y sellos, y apaga destellos (en 0.5 s). |
| **Reloj de arena (Q/E)** | Cambia la hora: dirección y largo de la sombra. |
| **Estirarse (Espacio)** | Hace la sombra 40 % más larga, pero no puedes caminar. |
| **Faroles (F)** | De noche, cada farol encendido da una sombra extra. |
| **Espejos solares** | De día, dan una segunda sombra en otra dirección. |

## 12. Vestimenta

Gno desbloquea disfraces con las estrellas que gana. Cada uno es un personaje del paquete Ninja Adventure. **El disfraz también aparece en su sombra**, porque la sombra es la silueta del sprite.

| Vestimenta | Se desbloquea con | Sprite del paquete |
|---|---|---|
| Gno de fuego | Desde el inicio | Flam |
| Sombrero de palma | 6 ★ | Samurai |
| Paliacate | 12 ★ | NinjaRed |
| Flor en el pelo | 20 ★ | Princess |
| Espíritu de luz | 30 ★ | Spirit |

## 13. Objetos especiales (props y fondo)

**Interactivos**

| Objeto | Función |
|---|---|
| Flor de luna | Objetivo: se abre con tu sombra |
| Reloj de sol | Salida; brilla cuando todas las flores abren |
| Placa lunar (A/B) | Abre su puerta mientras la cubres |
| Sello lunar ☾ | Abre su puerta para siempre si cubres todos a la vez |
| Puerta de madera (A/B) | Se abre con su placa |
| Puerta de piedra ☾ | Se abre con los sellos |
| Puerta solar | Abierta solo al mediodía |
| Espejo solar | Da una segunda sombra |
| Farol | Da sombra de noche; se prende y apaga |
| Reloj de arena | +2 s de arena (de día) o +20 s de vela (de noche) |
| Meseta de roca (baja / alta) | Se sube saltando; desde arriba la sombra llega más lejos |

**Escenario y fondo**

- **Obstáculos con sombra:** muros de adobe, muros bajos, saguaros, biznagas, agaves, ocotillos, rocas y agua del oasis.
- **Adornos:** cráneos de vaca, caminos de piedra, tierra agrietada, matorrales secos y **rodadoras** que cruzan con el viento.
- **Cielo y luz:** el color de la escena cambia con la hora. El amanecer es rosado, el mediodía blanco, la tarde naranja y la noche azul con huecos de luz en cada farol. Las **nubes** proyectan su sombra sobre el suelo y se ven pasar por arriba.

## 14. Arte

- **Estilo:** pixel art 2D (tiles de 16×16) visto desde arriba, con objetos en perspectiva 3/4.
- **Origen:** todos los sprites y animaciones son del paquete gratuito **Ninja Adventure** de Pixel-boy y AAA, con licencia **CC0**. La lista completa está en [assets/CREDITOS.md](../assets/CREDITOS.md).
- **Animaciones:** Gno camina en 4 direcciones (4 cuadros), salta, levanta los brazos y tiene pose de derrota; los destellos flotan, las flores se mecen, los faroles tienen llama y el reloj de sol activo tiene un círculo mágico.
- **Mundo 3D:** Three.js. Muros, muros bajos, mesetas y puertas son cajas texturizadas con el relieve del paquete; plantas, faroles, flores, destellos y Gno son sprites de pie que miran a la cámara. De noche cada farol encendido es una luz real.
- **Interfaz:** NES.css (botones, paneles, barras, corazones y estrellas), íconos de pixelarticons, fuente Pixelify Sans y teclas del paquete Ninja Adventure.
- **Historia:** cada viñeta es una escena armada con sprites y el cuadro de diálogo del paquete, con el retrato de quien habla.
- **Técnica del piso:** los sprites se dibujan en Canvas 2D sin suavizado. Los muros y el oasis se arman por cuartos de 8×8 según sus vecinos (autotile). Las **sombras** son la silueta de cada sprite proyectada en el suelo según la hora, y la luz del día y la noche se calcula con código.

## 15. Storyboard

![Storyboard](../img/storyboard.svg)

1. El desierto se apaga y las flores de luna ya no abren.
2. Entre ruinas de adobe queda un viejo reloj de sol.
3. La aguja del reloj despierta: es Gno.
4. Al amanecer, Gno descubre que su sombra hace florecer.
5. Con la arena del reloj aprende a mover el sol.
6. Al caer la noche, el desierto vuelve a brillar.

## 16. Guion

**Introducción** (se muestra con el storyboard)

> **Narrador:** Hace mucho que las flores de luna no abren. El desierto se está quedando a oscuras.
> **Narrador:** Pero entre las ruinas, la vieja aguja del reloj de sol sigue marcando la hora…
> **Gno:** ¿Eh? ¿Dónde estoy? ¿Por qué mi sombra brilla?
> **Narrador:** Tu sombra guarda un poco de la noche, Gno. Llévala hasta las flores.
> **Gno:** ¿Y si la sombra no alcanza?
> **Narrador:** Mueve el sol. Para eso tienes la arena de tu reloj.

**Durante el juego** (pistas al empezar cada nivel)

- *Amanecer:* "Tu sombra hace florecer las flores de luna. Camina hasta que tu sombra las toque."
- *Del otro lado:* "Tú no puedes cruzar el muro… tu sombra sí."
- *Espejo del oasis:* "El espejo refleja el sol: cerca de él tienes una segunda sombra."
- Al abrir todas las flores: "¡Todas las flores abrieron! El reloj de sol te espera."
- Al perder: "Se hizo de noche antes de terminar" o "Los destellos te deshicieron".

**Final** (después del nivel 14)

> **Gno:** ¿Ya? ¿Lo logramos?
> **Narrador:** Mira a tu alrededor.
> *(Todas las flores brillan bajo la luna.)*
> **Gno:** Entonces puedo descansar… hasta el próximo amanecer.

## 17. Score (cálculo sobre los eventos)

Los puntos se calculan con lo que pasa en cada nivel (constante `PUNTOS` en `js/juego.js`):

| Evento | Puntos |
|---|---|
| Flor de luna abierta | +100 c/u |
| Destello apagado | +50 c/u |
| Sello lunar roto | +200 c/u |
| Reloj de arena recogido | +30 c/u |
| Golpe recibido | −50 c/u |
| Arena (o vela) restante | +5 por cada 1 % |
| Corazones al terminar | +100 c/u |
| Rapidez | +2 por cada segundo menos de 180 |

**Fórmula**

```
puntaje = 100·flores + 50·destellos + 200·sellos + 30·relojes − 50·golpes
        + 5·(% de arena restante) + 100·corazones + 2·máx(0, 180 − segundos)
```

**Ejemplo:** 5 flores, 2 destellos, 1 reloj, 1 golpe, 60 % de arena, 2 corazones y 95 segundos:
`500 + 100 + 30 − 50 + 300 + 200 + 170 = 1250 puntos`.

**Estrellas:** ★★★ si te queda 50 % o más de arena (o vela), ★★ si te queda 20 % o más y ★ si terminas con menos. El mejor puntaje y las estrellas de cada nivel se guardan en el navegador.

## 18. Música

| Tema | Cuándo suena | Descripción |
|---|---|---|
| **"Adventure Begin"** | Título y menús | Tema de aventura alegre |
| **"Sunny"** | Niveles de día | Tema soleado y tranquilo |
| **"Mystical"** | Niveles de noche | Tema misterioso |
| **"Story (Short)"** | Historia | Tema corto para la introducción |

Además: **"Peaceful"** (niveles 9 a 12), **"Ruins"** (niveles 15 y 16) y **"End Theme"** (al terminar el juego).

Todos los temas son del paquete **Ninja Adventure** (CC0), es decir, sin derechos de autor. Se convirtieron de OGG a MP3 y suenan en bucle con un fundido al cambiar de pantalla.

## 19. Efectos de audio

| Evento | Sonido |
|---|---|
| Flor creciendo / abriendo | Tono que sube / arpegio brillante de 4 notas |
| Todas las flores abiertas | Acorde largo ascendente |
| Mover el sol | Viento de arena en bucle (más agudo al adelantar) |
| Saltar / aterrizar | Salto corto / golpe suave |
| Girar la cámara | Silbido de viento |

**Voz de los personajes:** las frases se grabaron con **Piper**, un motor de voz neuronal libre: Gno usa la voz mexicana "claude" un poco más aguda y el narrador la voz mexicana "ald", más pausada. Gno dice los controles al empezar el nivel 1, el narrador presenta cada nivel y cuenta la historia, y Gno reacciona al ganar o perder. La música baja mientras hablan. Se puede apagar con el botón **Voz**.
| Placa activada / desactivada | Campana grave / tono que baja |
| Puerta de madera / sello de piedra | Golpe seco de madera / roca que se arrastra con acorde |
| Destello apagado | Barrido agudo hacia abajo con chispa |
| Golpe a Gno | Tono áspero que baja |
| Farol / reloj de arena | Chispa con tono / tres campanitas |
| Estirarse | Tono corto que sube |
| Ganar / perder | Fanfarria de 7 notas / melodía que baja |

## 20. Propuesta de plan de trabajo (técnico Git)

**Organización:** el trabajo se divide en tarjetas (issues) de GitHub con etiquetas `diseño`, `programación`, `arte`, `audio`, `niveles`, `documentación` y `git`, agrupadas en 4 sprints de una semana.

| Sprint | Objetivo | Entregables |
|---|---|---|
| 1 | Prototipo de la mecánica | Sol y sombra, movimiento y colisiones, nivel de prueba |
| 2 | Contenido base | Niveles 1–8, flores, placas, sellos, destellos, faroles, HUD |
| 3 | Expansión | Niveles 9–14, nubes, espejos, puerta solar, relojes, vestimenta, puntaje |
| 4 | Pulido y entrega | Audio, versión celular, pruebas de solución de niveles, GDD, README, GitHub Pages |

**Flujo de ramas**

```
main  ←  develop  ←  feature/<número>-<descripción>
```

- `main` es la versión publicada en GitHub Pages; solo recibe lo que ya se probó en `develop`.
- Cada tarjeta se trabaja en su rama `feature/` y se une a `develop` con un *pull request*.
- Los commits siguen *Conventional Commits* con el número de tarjeta, por ejemplo:
  - `feat(niveles): agrega Espejo del oasis (#11)`
  - `fix(sombra): la placa no cuenta si estás encima (#7)`
  - `docs(gdd): sección de score (#20)`
- **Publicación:** GitHub Pages sirve la rama `main` desde la raíz del repositorio.
- **Pruebas:** antes de unir una rama se corre el verificador de niveles, que comprueba con el código del juego que cada flor y cada placa se puede alcanzar.

## 21. Créditos

| | |
|---|---|
| Dirección del proyecto, programación y diseño de niveles | **Joel Armando Ibarra Rubalcava** |
| Ventajas, eventos y retos aleatorios | **Joel Armando Ibarra Rubalcava** |
| Selección e integración de sprites y animaciones | **Jorge Humberto Martínez Delgado** |
| Selección de música y efectos de sonido | **Jorge Humberto Martínez Delgado** |
| QA y documentación | **Jorge Humberto Martínez Delgado** y **Joel Armando Ibarra Rubalcava** |
| Sprites, animaciones, música y efectos | Paquete **Ninja Adventure** de **Pixel-boy** y **AAA**, licencia CC0 (<https://pixel-boy.itch.io/ninja-adventure-asset-pack>) |
| Librerías | **Three.js** (MIT), **NES.css** (MIT), **pixelarticons** (MIT) |
| Fuente tipográfica | *Pixelify Sans*, licencia SIL Open Font License, vía Google Fonts |
| Voz | Piper (MIT) con las voces es_MX "claude" (Apache-2.0) y es_MX "ald" (Unlicense) |
| Tecnologías | JavaScript, Canvas 2D, Web Audio API, GitHub Pages |
| Inspiración real | La flor "reina de la noche" (*Peniocereus greggii*) y el desierto de Sonora |

El concepto, las mecánicas, los niveles, la historia y el código son originales del equipo. El código se publica con licencia MIT; los recursos del paquete conservan su licencia CC0.
