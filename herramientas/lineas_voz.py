"""Frases habladas del juego (una sola fuente para el libreto, la voz generada y las grabaciones).
Cada frase: (clave = nombre del archivo, quién habla, texto en pantalla, cómo leerlo en voz alta)."""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FIJAS = [
    ('historia0', 'Narrador', 'Hace mucho que las flores de luna no abren. El desierto se está quedando a oscuras.', None),
    ('historia1', 'Narrador', 'Pero entre las ruinas, la vieja aguja del reloj de sol sigue marcando la hora…', None),
    ('historia2', 'Gno', '¿Eh? ¿Dónde estoy? ¿Por qué mi sombra brilla?', None),
    ('historia3', 'Narrador', 'Tu sombra guarda un poco de la noche, Gno. Llévala hasta las flores.', None),
    ('historia4', 'Gno', '¿Y si mi sombra no alcanza?', None),
    ('historia5', 'Narrador', 'Mueve el sol con la arena de tu reloj… o gira tu mirada: el sol siempre sale a tu derecha.', None),
    ('historia6', 'Gno', '¡Entonces vamos a despertar el desierto!', None),
    ('controles', 'Gno', '¡Hola! Soy Gno. Camino con W, A, S y D. Con Q y E muevo el sol. Con Z y X giro la cámara alrededor del mundo, para que mi sombra caiga hacia otro lado. Con J salto a las plataformas, y con F prendo los faroles. ¡Vamos!',
     '¡Hola! Soy Gno. Camino con doble u, a, ese y de. Con cu y e muevo el sol. Con zeta y equis giro la cámara alrededor del mundo, para que mi sombra caiga hacia otro lado. Con jota salto a las plataformas, y con efe prendo los faroles. ¡Vamos!'),
    ('controles_otros', 'Gno', '¡Hola! Soy Gno. Aquí abajo están mis controles: caminar, mover el sol, girar la cámara, saltar y prender los faroles. ¡Vamos!', None),
    ('hola', 'Gno', '¡Hola! Soy Gno.', None),
    ('gano3', 'Gno', '¡Tres estrellas! ¡Qué bonito brillan!', None),
    ('gano', 'Gno', '¡Lo logramos!', None),
    ('perdio', 'Gno', '¡Oh, no! ¡Otra vez!', None),
]

LETRAS = {'A': 'a', 'B': 'be', 'C': 'ce', 'D': 'de', 'E': 'e', 'F': 'efe', 'J': 'jota', 'M': 'eme', 'Q': 'cu', 'R': 'erre',
          'S': 'ese', 'W': 'doble u', 'X': 'equis', 'Z': 'zeta'}


def leer_niveles():
    """Nombre y pista de cada nivel, leídos de js/niveles.js."""
    s = open(os.path.join(RAIZ, 'js', 'niveles.js'), encoding='utf8').read()
    return re.findall(r"nombre: '([^']*)',(?:\s*musica: '[^']*',)?\s*pista: '([^']*)'", s)


def como_se_lee(t):
    t = t.replace('…', '...').replace('Shift', 'shift')
    t = re.sub(r'\(([^)]*)\)', r', \1,', t)
    return re.sub(r'\b([A-Z])\b', lambda m: LETRAS.get(m.group(1), m.group(1)), t)


def lineas():
    """Lista completa: [(clave, quién, texto, lectura)]."""
    out = [(c, q, t, l or como_se_lee(t)) for c, q, t, l in FIJAS]
    for i, (nombre, pista) in enumerate(leer_niveles()):
        if i == 0:
            continue   # el nivel 1 lo presenta Gno con los controles
        t = f'Nivel {i + 1}: {nombre}. {pista}'
        out.append((f'nivel{i + 1}', 'Narrador', t, como_se_lee(t)))
    return out
