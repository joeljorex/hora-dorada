"""Genera docs/Libreto_voces.md con todas las frases habladas del juego, listas para grabar.
Uso (desde la carpeta hora-dorada): python herramientas/libreto.py"""
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lineas_voz import RAIZ, lineas  # noqa: E402

PERSONAJES = {
    'Gno': 'Espíritu pequeño del reloj de sol: curioso, alegre y un poco nervioso. Voz ligera, con energía.',
    'Narrador': 'El viejo reloj de sol: calmado, sabio, como quien cuenta una leyenda. Voz pausada y grave.',
}

L = lineas()
md = ['# Libreto de voces — Hora Dorada', '',
      f'Son **{len(L)} frases**: {sum(1 for x in L if x[1] == "Gno")} de **Gno** y {sum(1 for x in L if x[1] == "Narrador")} del **Narrador**. '
      'Pueden grabarlas una persona (cambiando la voz) o dos integrantes del equipo.', '',
      '## Forma fácil: el Estudio de voces', '',
      '1. Abre **`Estudio de voces.bat`** (en la carpeta `hora-dorada`) con doble clic. Se abre una ventana con el libreto.',
      '2. Elige una frase, presiona **Grabar** (o la tecla **R**), lee el texto y presiona **Detener**.',
      '3. Escucha la toma (**Espacio**), mira la forma de onda y vuelve a grabar si no te gustó. Cada toma se guarda sola en `voces_grabadas/`.',
      '4. Cuando termines, presiona **Enviar al juego**: se limpian las grabaciones y quedan en `assets/audio/voz/lineas/`.',
      '5. Presiona **Probar en el juego** para escucharlas.', '',
      '## Forma manual (con otra app)', '',
      '1. Usa cualquier app: la **Grabadora de voz** de Windows, la grabadora del celular o **Audacity**.',
      '2. Graba en un cuarto silencioso, a unos 20–30 cm del micrófono. Deja **1 segundo de silencio** antes y después; el juego lo recorta solo.',
      '3. **Un archivo por frase.** Ponle exactamente el nombre de la columna *Archivo* (por ejemplo `historia0.m4a`). Sirve cualquier formato: m4a, mp3, wav, ogg…',
      '4. Si te equivocas, vuelve a grabar esa frase y reemplaza el archivo.',
      '5. Guarda todo en la carpeta `hora-dorada/voces_grabadas/`.', '',
      '## Cómo meterlas al juego', '',
      '```', 'python herramientas/importar_voces.py voces_grabadas', '```', '',
      'Esto recorta silencios, iguala el volumen, las convierte a MP3 y reemplaza la voz generada. '
      'Las frases que no grabes se quedan con la voz de Piper. Agrega `--gno-agudo` para subir un poco el tono de Gno, '
      'y usa `--restaurar` para regresar a las voces de Piper.', '',
      '> La columna **Cómo leerlo** dice cómo pronunciar las letras de las teclas, por ejemplo «doble u» para la **W**.', '']
for quien in ('Gno', 'Narrador'):
    md += [f'## {quien}', '', f'*{PERSONAJES[quien]}*', '', '| # | Archivo | Texto | Cómo leerlo |', '|---|---|---|---|']
    n = 0
    for clave, q, texto, lectura in L:
        if q != quien:
            continue
        n += 1
        leer = '' if lectura.replace('...', '…').strip() == texto.strip() else lectura
        md.append(f'| {n} | `{clave}` | {texto} | {leer} |')
    md.append('')
md += ['## Dónde se escucha cada frase', '',
       '| Archivo | Momento |', '|---|---|',
       '| `historia0` … `historia6` | Historia del inicio (antes del nivel 1 o desde el menú **Historia**) |',
       '| `controles` | Al empezar el nivel 1, con las teclas normales |',
       '| `controles_otros` | Al empezar el nivel 1, si el jugador cambió las teclas |',
       '| `nivel2` … `nivel17` | Al presentar cada nivel |',
       '| `hola` | Al prender la voz en el menú |',
       '| `gano3` / `gano` / `perdio` | Al terminar un nivel con 3 estrellas / ganando / perdiendo |', '']
ruta = os.path.join(RAIZ, 'docs', 'Libreto_voces.md')
open(ruta, 'w', encoding='utf8').write('\n'.join(md))
print('Libreto:', ruta, '-', len(L), 'frases')
