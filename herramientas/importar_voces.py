"""Pone en el juego las voces que grabaste en otra app (celular, Grabadora de voz de Windows, Audacity…).

Uso (desde la carpeta hora-dorada):
    python herramientas/importar_voces.py <carpeta_con_grabaciones> [--gno-agudo]
    python herramientas/importar_voces.py --restaurar        # regresa a las voces de Piper

- Cada archivo debe llamarse como la frase del libreto (docs/Libreto_voces.md): historia0.m4a, nivel5.mp3, gano.wav…
  No importan mayúsculas, espacios ni guiones; sirve cualquier formato que lea ffmpeg (m4a, mp3, wav, ogg, opus, webm, aac, 3gp, amr).
- A cada grabación se le quita el silencio del principio y del final, se le quita el zumbido grave, se iguala el volumen
  y se guarda como MP3 mono en assets/audio/voz/lineas/<clave>.mp3.
- La primera vez se respaldan las voces de Piper en assets/audio/voz/lineas_piper/ (para poder regresar).
- Las frases que no grabes se quedan con la voz de Piper.
- --gno-agudo sube un poco el tono de las frases de Gno para que suene a personaje.
Requiere ffmpeg en el PATH."""
import json
import os
import re
import shutil
import subprocess
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lineas_voz import RAIZ, lineas  # noqa: E402

DESTINO = os.path.join(RAIZ, 'assets', 'audio', 'voz', 'lineas')
RESPALDO = os.path.join(RAIZ, 'assets', 'audio', 'voz', 'lineas_piper')
AUDIO = {'.m4a', '.mp3', '.wav', '.ogg', '.oga', '.opus', '.webm', '.aac', '.3gp', '.amr', '.flac', '.wma', '.mp4'}
LIMPIAR = ('silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB,areverse,'
           'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB,areverse,'
           'highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.15')
AGUDO = 'aresample=44100,asetrate=44100*1.15,aresample=44100,atempo=0.8696,'


def normal(n):
    # 'Gano 3.m4a', 'HISTORIA-2.wav' y 'controles_otros.mp3' -> 'gano3', 'historia2', 'controlesotros'
    return re.sub(r'[\s\-_]+', '', os.path.splitext(n)[0].strip().lower())


def respaldar():
    if not os.path.isdir(RESPALDO):
        shutil.copytree(DESTINO, RESPALDO)
        print('Respaldo de las voces de Piper en', RESPALDO)


def restaurar():
    if not os.path.isdir(RESPALDO):
        print('No hay respaldo de Piper; no se cambió nada.')
        return
    for f in os.listdir(RESPALDO):
        shutil.copy2(os.path.join(RESPALDO, f), os.path.join(DESTINO, f))
    print('Se regresaron las voces de Piper.')


def importar(carpeta, gno_agudo=False):
    quien = {c: q for c, q, _, _ in lineas()}
    archivos = {normal(f): f for f in os.listdir(carpeta) if os.path.splitext(f)[1].lower() in AUDIO}
    claves = {normal(c): c for c in quien}
    archivos = {claves.get(k, k): f for k, f in archivos.items()}
    respaldar()
    hechas, desconocidas = [], [f for k, f in archivos.items() if k not in quien]
    for clave in quien:
        if clave not in archivos:
            continue
        filtro = (AGUDO if gno_agudo and quien[clave] == 'Gno' else '') + LIMPIAR
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(carpeta, archivos[clave]), '-af', filtro,
                            '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '80k',
                            os.path.join(DESTINO, clave + '.mp3')], capture_output=True, text=True)
        if r.returncode:
            print(f'  ✗ {archivos[clave]}: {r.stderr.strip()[:200]}')
        else:
            hechas.append(clave)
    json.dump(sorted(set(json.load(open(os.path.join(DESTINO, 'lineas.json'), encoding='utf8')) + hechas)),
              open(os.path.join(DESTINO, 'lineas.json'), 'w', encoding='utf8'))
    faltan = [c for c in quien if c not in hechas]
    print(f'Importadas: {len(hechas)} de {len(quien)}')
    if faltan:
        print('Siguen con voz de Piper:', ', '.join(faltan))
    if desconocidas:
        print('No reconocí estos archivos (revisa el nombre):', ', '.join(desconocidas))


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--restaurar' in args:
        restaurar()
    elif args and not args[0].startswith('--'):
        importar(args[0], '--gno-agudo' in args)
    else:
        print(__doc__)
