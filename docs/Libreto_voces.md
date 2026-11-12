# Libreto de voces — Hora Dorada

Son **29 frases**: 9 de **Gno** y 20 del **Narrador**. Pueden grabarlas una persona (cambiando la voz) o dos integrantes del equipo.

## Forma fácil: el Estudio de voces

1. Abre **`Estudio de voces.bat`** (en la carpeta `hora-dorada`) con doble clic. Se abre una ventana con el libreto.
2. Elige una frase, presiona **Grabar** (o la tecla **R**), lee el texto y presiona **Detener**.
3. Escucha la toma (**Espacio**), mira la forma de onda y vuelve a grabar si no te gustó. Cada toma se guarda sola en `voces_grabadas/`.
4. Cuando termines, presiona **Enviar al juego**: se limpian las grabaciones y quedan en `assets/audio/voz/lineas/`.
5. Presiona **Probar en el juego** para escucharlas.

## Forma manual (con otra app)

1. Usa cualquier app: la **Grabadora de voz** de Windows, la grabadora del celular o **Audacity**.
2. Graba en un cuarto silencioso, a unos 20–30 cm del micrófono. Deja **1 segundo de silencio** antes y después; el juego lo recorta solo.
3. **Un archivo por frase.** Ponle exactamente el nombre de la columna *Archivo* (por ejemplo `historia0.m4a`). Sirve cualquier formato: m4a, mp3, wav, ogg…
4. Si te equivocas, vuelve a grabar esa frase y reemplaza el archivo.
5. Guarda todo en la carpeta `hora-dorada/voces_grabadas/`.

## Cómo meterlas al juego

```
python herramientas/importar_voces.py voces_grabadas
```

Esto recorta silencios, iguala el volumen, las convierte a MP3 y reemplaza la voz generada. Las frases que no grabes se quedan con la voz de Piper. Agrega `--gno-agudo` para subir un poco el tono de Gno, y usa `--restaurar` para regresar a las voces de Piper.

> La columna **Cómo leerlo** dice cómo pronunciar las letras de las teclas, por ejemplo «doble u» para la **W**.

## Gno

*Espíritu pequeño del reloj de sol: curioso, alegre y un poco nervioso. Voz ligera, con energía.*

| # | Archivo | Texto | Cómo leerlo |
|---|---|---|---|
| 1 | `historia2` | ¿Eh? ¿Dónde estoy? ¿Por qué mi sombra brilla? |  |
| 2 | `historia4` | ¿Y si mi sombra no alcanza? |  |
| 3 | `historia6` | ¡Entonces vamos a despertar el desierto! |  |
| 4 | `controles` | ¡Hola! Soy Gno. Camino con W, A, S y D. Con Q y E muevo el sol. Con Z y X giro la cámara alrededor del mundo, para que mi sombra caiga hacia otro lado. Con J salto a las plataformas, y con F prendo los faroles. ¡Vamos! | ¡Hola! Soy Gno. Camino con doble u, a, ese y de. Con cu y e muevo el sol. Con zeta y equis giro la cámara alrededor del mundo, para que mi sombra caiga hacia otro lado. Con jota salto a las plataformas, y con efe prendo los faroles. ¡Vamos! |
| 5 | `controles_otros` | ¡Hola! Soy Gno. Aquí abajo están mis controles: caminar, mover el sol, girar la cámara, saltar y prender los faroles. ¡Vamos! |  |
| 6 | `hola` | ¡Hola! Soy Gno. |  |
| 7 | `gano3` | ¡Tres estrellas! ¡Qué bonito brillan! |  |
| 8 | `gano` | ¡Lo logramos! |  |
| 9 | `perdio` | ¡Oh, no! ¡Otra vez! |  |

## Narrador

*El viejo reloj de sol: calmado, sabio, como quien cuenta una leyenda. Voz pausada y grave.*

| # | Archivo | Texto | Cómo leerlo |
|---|---|---|---|
| 1 | `historia0` | Hace mucho que las flores de luna no abren. El desierto se está quedando a oscuras. |  |
| 2 | `historia1` | Pero entre las ruinas, la vieja aguja del reloj de sol sigue marcando la hora… |  |
| 3 | `historia3` | Tu sombra guarda un poco de la noche, Gno. Llévala hasta las flores. |  |
| 4 | `historia5` | Mueve el sol con la arena de tu reloj… o gira tu mirada: el sol siempre sale a tu derecha. |  |
| 5 | `nivel2` | Nivel 2: Adelanta el sol. Mantén E para adelantar el sol y Q para regresarlo. Gastas arena del reloj, ¡úsala con cuidado! | Nivel 2: Adelanta el sol. Mantén e para adelantar el sol y cu para regresarlo. Gastas arena del reloj, ¡úsala con cuidado! |
| 6 | `nivel3` | Nivel 3: Del otro lado. Tú no puedes cruzar el muro... tu sombra sí. Al amanecer las sombras son larguísimas. | Nivel 3: Del otro lado. Tú no puedes cruzar el muro... tu sombra sí. Al amanecer las sombras son larguísimas. |
| 7 | `nivel4` | Nivel 4: Placas lunares. Las placas abren su puerta mientras tu sombra las cubre. Busca la hora justa. |  |
| 8 | `nivel5` | Nivel 5: Destellos. Los destellos son luz pura: atrápalos con tu sombra y se apagan. Si te tocan, pierdes un corazón. |  |
| 9 | `nivel6` | Nivel 6: Noche de faroles. De noche no hay sol: cada farol encendido te da una sombra que apunta lejos de él. Acércate o aléjate para estirarla. |  |
| 10 | `nivel7` | Nivel 7: Dos sombras. Enciende el otro farol con F. Los dos sellos deben quedar bajo tus sombras al mismo tiempo. | Nivel 7: Dos sombras. Enciende el otro farol con efe. Los dos sellos deben quedar bajo tus sombras al mismo tiempo. |
| 11 | `nivel8` | Nivel 8: Hora dorada. Todo lo que aprendiste. Planea el día: cada hora sirve para algo distinto. |  |
| 12 | `nivel9` | Nivel 9: Nubes de agosto. Bajo una nube no tienes sombra. Espera a que pase... o aprovecha el sol mientras dura. Los relojes de arena te dan más arena. | Nivel 9: Nubes de agosto. Bajo una nube no tienes sombra. Espera a que pase... o aprovecha el sol mientras dura. Los relojes de arena te dan más arena. |
| 13 | `nivel10` | Nivel 10: Puerta del mediodía. Las puertas solares solo abren al mediodía. Planea qué hacer antes, durante y después. |  |
| 14 | `nivel11` | Nivel 11: Espejo del oasis. El espejo refleja el sol: cerca de él tienes una segunda sombra que apunta lejos del espejo... ¡incluso hacia abajo! | Nivel 11: Espejo del oasis. El espejo refleja el sol: cerca de él tienes una segunda sombra que apunta lejos del espejo... ¡incluso hacia abajo! |
| 15 | `nivel12` | Nivel 12: Biznagas. Un laberinto de biznagas con destellos. La placa abre la puerta solo con sombra de mañana. |  |
| 16 | `nivel13` | Nivel 13: Tres faroles. Tres faroles, tres sombras. El de abajo está apagado: enciéndelo para alcanzar lo que está más arriba. |  |
| 17 | `nivel14` | Nivel 14: Último atardecer. El gran final: puerta solar, nubes, un espejo y una placa que solo una sombra "imposible" puede alcanzar. |  |
| 18 | `nivel15` | Nivel 15: Mesetas. Salta con J (o Shift) y súbete a las mesetas: desde lo alto tu sombra llega más lejos, y si saltas, ¡tu sombra brinca contigo! No hay arena y el sol sube solo: corre a las mesetas antes de que las sombras se encojan. | Nivel 15: Mesetas. Salta con jota , o shift, y súbete a las mesetas: desde lo alto tu sombra llega más lejos, y si saltas, ¡tu sombra brinca contigo! No hay arena y el sol sube solo: corre a las mesetas antes de que las sombras se encojan. |
| 19 | `nivel16` | Nivel 16: Cuatro vientos. Hay una flor en cada rumbo, pero la sombra nunca cae hacia abajo de la pantalla. Gira la cámara con Z y X: el sol siempre sale a tu derecha. | Nivel 16: Cuatro vientos. Hay una flor en cada rumbo, pero la sombra nunca cae hacia abajo de la pantalla. Gira la cámara con zeta y equis: el sol siempre sale a tu derecha. |
| 20 | `nivel17` | Nivel 17: Oasis flotante. Salta de plataforma en plataforma sobre el agua (si caes, vuelves a la orilla). Las de madera que se mueven te llevan; desde ahí tu sombra llega más lejos. Gira la cámara para alcanzar la flor del sur. | Nivel 17: Oasis flotante. Salta de plataforma en plataforma sobre el agua , si caes, vuelves a la orilla,. Las de madera que se mueven te llevan; desde ahí tu sombra llega más lejos. Gira la cámara para alcanzar la flor del sur. |

## Dónde se escucha cada frase

| Archivo | Momento |
|---|---|
| `historia0` … `historia6` | Historia del inicio (antes del nivel 1 o desde el menú **Historia**) |
| `controles` | Al empezar el nivel 1, con las teclas normales |
| `controles_otros` | Al empezar el nivel 1, si el jugador cambió las teclas |
| `nivel2` … `nivel17` | Al presentar cada nivel |
| `hola` | Al prender la voz en el menú |
| `gano3` / `gano` / `perdio` | Al terminar un nivel con 3 estrellas / ganando / perdiendo |
