"""Estudio de voces de Hora Dorada: app para grabar el libreto con tu micrófono.

Abre una ventana (Edge en modo app, o tu navegador) que muestra cada frase del libreto, la graba,
te deja escucharla y regrabarla, y al final la envía al juego:
  - Cada toma se guarda al momento en  voces_grabadas/<clave>.<ext>  (borradores).
  - "Enviar al juego" procesa las tomas (recorta silencios, iguala volumen, MP3) y las deja en
    assets/audio/voz/lineas/  con importar_voces.py. Las voces de Piper quedan respaldadas.

Uso: doble clic en "Estudio de voces.bat"  o  python herramientas/estudio_voces.py
Solo escucha en 127.0.0.1 (tu computadora). Requiere ffmpeg para el envío final."""
import io
import json
import mimetypes
import os

import shutil
import subprocess
import sys
import threading
import webbrowser
from contextlib import redirect_stdout
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import unquote, urlparse

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from lineas_voz import RAIZ, lineas  # noqa: E402
import importar_voces  # noqa: E402

PUERTO = 8790
BORRADORES = os.path.join(RAIZ, 'voces_grabadas')
PAGINA = os.path.join(AQUI, 'estudio', 'estudio.html')
EXT = {'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mp4': '.m4a', 'audio/mpeg': '.mp3', 'audio/wav': '.wav'}
os.makedirs(BORRADORES, exist_ok=True)


def claves():
    return {c for c, _, _, _ in lineas()}


def toma_de(clave):
    for f in os.listdir(BORRADORES):
        if os.path.splitext(f)[0] == clave and os.path.splitext(f)[1].lower() in importar_voces.AUDIO:
            return os.path.join(BORRADORES, f)
    return None


class Estudio(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def responder(self, codigo, cuerpo=b'', tipo='application/json; charset=utf-8'):
        if isinstance(cuerpo, (dict, list)):
            cuerpo = json.dumps(cuerpo, ensure_ascii=False).encode('utf8')
        self.send_response(codigo)
        self.send_header('Content-Type', tipo)
        self.send_header('Content-Length', str(len(cuerpo)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(cuerpo)

    def archivo(self, ruta):
        ruta = os.path.realpath(ruta)
        if not ruta.startswith(os.path.realpath(RAIZ)) or not os.path.isfile(ruta):
            return self.responder(404, {'error': 'no existe'})
        tipo = mimetypes.guess_type(ruta)[0] or 'application/octet-stream'
        with open(ruta, 'rb') as f:
            self.responder(200, f.read(), tipo)

    def clave(self, ruta):
        c = unquote(ruta.rsplit('/', 1)[-1])
        return c if c in claves() else None

    def do_GET(self):
        ruta = urlparse(self.path).path
        if ruta in ('/', '/estudio'):
            return self.archivo(PAGINA)
        if ruta == '/api/lineas':
            datos = [{'clave': c, 'quien': q, 'texto': t, 'lectura': l, 'grabada': bool(toma_de(c))} for c, q, t, l in lineas()]
            return self.responder(200, datos)
        if ruta.startswith('/api/toma/'):
            c = self.clave(ruta)
            t = c and toma_de(c)
            return self.archivo(t) if t else self.responder(404, {'error': 'sin toma'})
        # Archivos del juego (librerías, sprites, y el juego mismo para probar las voces)
        return self.archivo(os.path.join(RAIZ, unquote(ruta.lstrip('/'))))

    def do_POST(self):
        ruta = urlparse(self.path).path
        if ruta.startswith('/api/toma/'):
            c = self.clave(ruta)
            if not c:
                return self.responder(400, {'error': 'frase desconocida'})
            n = int(self.headers.get('Content-Length', 0))
            if n <= 0 or n > 30 * 1024 * 1024:
                return self.responder(400, {'error': 'tamaño inválido'})
            datos = self.rfile.read(n)
            tipo = (self.headers.get('Content-Type') or 'audio/webm').split(';')[0].strip()
            vieja = toma_de(c)
            if vieja:
                os.remove(vieja)
            with open(os.path.join(BORRADORES, c + EXT.get(tipo, '.webm')), 'wb') as f:
                f.write(datos)
            return self.responder(200, {'ok': True})
        if ruta == '/api/enviar':
            n = int(self.headers.get('Content-Length', 0) or 0)
            op = json.loads(self.rfile.read(n) or b'{}') if n else {}
            salida = io.StringIO()
            with redirect_stdout(salida):
                importar_voces.importar(BORRADORES, bool(op.get('gnoAgudo')))
            return self.responder(200, {'ok': True, 'informe': salida.getvalue()})
        if ruta == '/api/restaurar':
            salida = io.StringIO()
            with redirect_stdout(salida):
                importar_voces.restaurar()
            return self.responder(200, {'ok': True, 'informe': salida.getvalue()})
        self.responder(404, {'error': 'no existe'})

    def do_DELETE(self):
        ruta = urlparse(self.path).path
        c = ruta.startswith('/api/toma/') and self.clave(ruta)
        t = c and toma_de(c)
        if t:
            os.remove(t)
        self.responder(200, {'ok': True})


def abrir_ventana(url):
    """Abre el estudio como app (Edge sin barra de navegador); si no se puede, en el navegador normal."""
    if sys.platform.startswith('win'):
        for edge in [shutil.which('msedge'), r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
                     r'C:\Program Files\Microsoft\Edge\Application\msedge.exe']:
            if edge and os.path.isfile(edge):
                subprocess.Popen([edge, f'--app={url}', '--window-size=1100,780'])
                return
    webbrowser.open(url)


if __name__ == '__main__':
    if not shutil.which('ffmpeg'):
        print('Aviso: no encontré ffmpeg; puedes grabar, pero para "Enviar al juego" hace falta ffmpeg.')
    servidor = ThreadingHTTPServer(('127.0.0.1', PUERTO), Estudio)
    url = f'http://127.0.0.1:{PUERTO}/'
    print(f'Estudio de voces abierto en {url}  (cierra esta ventana para terminar)')
    if '--sin-ventana' not in sys.argv:
        threading.Timer(0.6, abrir_ventana, [url]).start()
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
