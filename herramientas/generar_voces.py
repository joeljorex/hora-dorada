"""Genera las voces del juego con Piper (TTS neuronal local, MIT).
Uso: generar_voces.py <python_del_venv> <carpeta_modelos> <no_usado> <salida>
Gno = es_MX-claude-high (Apache-2.0) un poco más agudo; Narrador = es_MX-ald-medium (Unlicense) más pausado."""
import sys, json, os, re, subprocess, tempfile

PY, MOD, NIV, OUT = sys.argv[1:5]
os.makedirs(OUT, exist_ok=True)
VOZ = {
    'Gno': dict(modelo='es_MX-claude-high', escala=1.0, filtro='asetrate=22050*1.08,aresample=22050,atempo=1/1.08'),
    'Narrador': dict(modelo='es_MX-ald-medium', escala=1.1, filtro='asetrate=22050*0.97,aresample=22050,atempo=1/0.97'),
}
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lineas_voz import lineas  # noqa: E402  (misma lista que el libreto y el importador)

LINEAS = {c: (q, lectura) for c, q, _, lectura in lineas()}
fonetico = lambda t: t  # la lectura ya viene lista en lineas_voz.py

hechas = []
for clave, (quien, texto) in LINEAS.items():
    v = VOZ[quien]
    wav = os.path.join(tempfile.gettempdir(), f'hd_{clave}.wav')
    subprocess.run([PY, '-m', 'piper', '-m', os.path.join(MOD, v['modelo'] + '.onnx'), '-f', wav,
                    '--length-scale', str(v['escala']), '--sentence-silence', '0.25'],
                   input=fonetico(texto).encode('utf8'), check=True, capture_output=True)
    mp3 = os.path.join(OUT, f'{clave}.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-af', v['filtro'] + ',loudnorm=I=-16:TP=-1.5',
                    '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k', mp3], check=True)
    os.remove(wav)
    hechas.append(clave)
json.dump(hechas, open(os.path.join(OUT, 'lineas.json'), 'w', encoding='utf8'))
print(len(hechas), 'líneas')
