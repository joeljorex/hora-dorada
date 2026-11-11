"""Genera un boceto SVG de cada nivel a partir de js/niveles.js (para el GDD).

Uso:  python herramientas/mapas_svg.py
Crea: img/mapas/nivel_01.svg ... nivel_14.svg
"""
import io
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = 26  # tamaño de cada casilla en el SVG

COLORES = {
    '#': ('#d6955f', None), 'n': ('#c99a72', None), '.': ('#f1d39b', None), 'p': ('#cdbb9c', None),
    'w': ('#5fb7d9', None), 'F': ('#f1d39b', 'flor'), 'X': ('#f1d39b', 'salida'), 'P': ('#f1d39b', 'inicio'),
    'c': ('#f1d39b', 'saguaro'), 'b': ('#f1d39b', 'biznaga'), 'g': ('#f1d39b', 'agave'), 'o': ('#f1d39b', 'ocotillo'),
    'r': ('#f1d39b', 'roca'), 'k': ('#f1d39b', 'craneo'), 'u': ('#f1d39b', 'rodadora'), 'h': ('#f1d39b', 'reloj'),
    'a': ('#f1d39b', 'placaA'), 'q': ('#f1d39b', 'placaB'), 'm': ('#f1d39b', 'sello'),
    'A': ('#5ee0ff', 'puertaA'), 'B': ('#ff8fc8', 'puertaB'), 'M': ('#c9a8ff', 'puertaM'), 'S': ('#ffd36b', 'solar'),
    'E': ('#f1d39b', 'espejo'), 'd': ('#f1d39b', 'destelloH'), 'v': ('#f1d39b', 'destelloV'),
    'L': ('#f1d39b', 'farol'), 'l': ('#f1d39b', 'farolOff'),
}


def simbolo(tipo, x, y):
    c = f'{x + T / 2:.1f}', f'{y + T / 2:.1f}'
    cx, cy = float(c[0]), float(c[1])
    s = {
        'flor': f'<circle cx="{cx}" cy="{cy}" r="8" fill="#ffffff" stroke="#7d5a8f" stroke-width="2"/><circle cx="{cx}" cy="{cy}" r="3" fill="#ffd36b"/>',
        'salida': f'<circle cx="{cx}" cy="{cy}" r="10" fill="#f5dca0" stroke="#8d7f6c" stroke-width="2"/><path d="M{cx} {cy} L{cx + 2} {cy - 9}" stroke="#8d7f6c" stroke-width="3"/>',
        'inicio': f'<path d="M{cx - 7} {cy + 8} Q{cx} {cy - 14} {cx + 7} {cy + 8} Z" fill="#d9774a" stroke="#2a1d2e" stroke-width="1.5"/>',
        'saguaro': f'<rect x="{cx - 3}" y="{cy - 10}" width="6" height="20" rx="3" fill="#4e9a5b"/><rect x="{cx - 9}" y="{cy - 6}" width="5" height="8" rx="2" fill="#4e9a5b"/>',
        'biznaga': f'<circle cx="{cx}" cy="{cy}" r="8" fill="#4c9157"/><circle cx="{cx}" cy="{cy - 7}" r="2.5" fill="#ffcf3d"/>',
        'agave': f'<path d="M{cx} {cy + 8} L{cx - 9} {cy - 6} L{cx - 2} {cy + 2} L{cx} {cy - 10} L{cx + 2} {cy + 2} L{cx + 9} {cy - 6} Z" fill="#5f9c8f"/>',
        'ocotillo': f'<path d="M{cx - 5} {cy - 10} L{cx} {cy + 9} L{cx + 5} {cy - 10} M{cx} {cy + 9} L{cx} {cy - 11}" stroke="#6b5a3e" stroke-width="2" fill="none"/>',
        'roca': f'<ellipse cx="{cx}" cy="{cy}" rx="9" ry="6" fill="#a59a8c"/>',
        'craneo': f'<circle cx="{cx}" cy="{cy}" r="4" fill="#efe6d2"/>',
        'rodadora': f'<circle cx="{cx}" cy="{cy}" r="6" fill="none" stroke="#a07a4a" stroke-width="2"/>',
        'reloj': f'<path d="M{cx - 5} {cy - 7} L{cx + 5} {cy - 7} L{cx - 5} {cy + 7} L{cx + 5} {cy + 7} Z" fill="#e9b55c" stroke="#7a5230" stroke-width="1.5"/>',
        'placaA': f'<ellipse cx="{cx}" cy="{cy}" rx="10" ry="8" fill="#959db0" stroke="#5ee0ff" stroke-width="3"/>',
        'placaB': f'<ellipse cx="{cx}" cy="{cy}" rx="10" ry="8" fill="#959db0" stroke="#ff8fc8" stroke-width="3"/>',
        'sello': f'<ellipse cx="{cx}" cy="{cy}" rx="10" ry="8" fill="#959db0" stroke="#c9a8ff" stroke-width="3"/>',
        'puertaA': '', 'puertaB': '', 'puertaM': '', 'solar': f'<circle cx="{cx}" cy="{cy}" r="5" fill="#ff9a4a"/>',
        'espejo': f'<ellipse cx="{cx}" cy="{cy}" rx="7" ry="10" fill="#9fd3ef" stroke="#5a4636" stroke-width="2.5"/>',
        'destelloH': f'<circle cx="{cx}" cy="{cy}" r="7" fill="#fff3b0" stroke="#ffb02e" stroke-width="2"/><path d="M{cx - 12} {cy} L{cx + 12} {cy}" stroke="#ffb02e" stroke-width="1.5" stroke-dasharray="3 2"/>',
        'destelloV': f'<circle cx="{cx}" cy="{cy}" r="7" fill="#fff3b0" stroke="#ffb02e" stroke-width="2"/><path d="M{cx} {cy - 12} L{cx} {cy + 12}" stroke="#ffb02e" stroke-width="1.5" stroke-dasharray="3 2"/>',
        'farol': f'<rect x="{cx - 2}" y="{cy - 8}" width="4" height="16" fill="#3b2a20"/><rect x="{cx - 5}" y="{cy - 11}" width="10" height="7" fill="#ffd36b"/>',
        'farolOff': f'<rect x="{cx - 2}" y="{cy - 8}" width="4" height="16" fill="#3b2a20"/><rect x="{cx - 5}" y="{cy - 11}" width="10" height="7" fill="#5c5048"/>',
    }
    return s.get(tipo, '')


def leer_niveles():
    texto = io.open(os.path.join(RAIZ, 'js', 'niveles.js'), encoding='utf-8').read()
    niveles = []
    for bloque in re.finditer(r"nombre: '([^']+)'.*?tipo: '(\w+)'.*?mapa: \[(.*?)\]", texto, re.S):
        nombre, tipo, cuerpo = bloque.group(1), bloque.group(2), bloque.group(3)
        filas = re.findall(r"'([^']*)'", cuerpo)
        niveles.append((nombre, tipo, filas))
    return niveles


def svg_nivel(n, nombre, tipo, filas):
    completo = ['#' * 26] + ['#' + f + '#' for f in filas] + ['#' * 26]
    w, h = 26 * T, 15 * T + 34
    partes = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="sans-serif">',
              f'<rect width="{w}" height="{h}" fill="#2a1d2e"/>',
              f'<text x="10" y="23" fill="#ffc857" font-size="18" font-weight="bold">Nivel {n}: {nombre}</text>',
              f'<text x="{w - 10}" y="23" fill="#d9c3b0" font-size="14" text-anchor="end">{"Noche" if tipo == "noche" else "Día"} · boceto generado de js/niveles.js</text>']
    for j, fila in enumerate(completo):
        for i, ch in enumerate(fila):
            x, y = i * T, 34 + j * T
            fondo, tipo_s = COLORES.get(ch, ('#f1d39b', None))
            partes.append(f'<rect x="{x}" y="{y}" width="{T}" height="{T}" fill="{fondo}" stroke="rgba(0,0,0,0.08)"/>')
            if ch in 'ABM':
                partes.append(f'<rect x="{x + 3}" y="{y + 3}" width="{T - 6}" height="{T - 6}" fill="none" stroke="#3d2718" stroke-width="3"/>')
                partes.append(f'<text x="{x + T / 2}" y="{y + T / 2 + 5}" font-size="14" font-weight="bold" text-anchor="middle" fill="#3d2718">{"☾" if ch == "M" else ch}</text>')
            if tipo_s:
                partes.append(simbolo(tipo_s, x, y))
    partes.append('</svg>')
    return '\n'.join(partes)


def main():
    carpeta = os.path.join(RAIZ, 'img', 'mapas')
    os.makedirs(carpeta, exist_ok=True)
    niveles = leer_niveles()
    for n, (nombre, tipo, filas) in enumerate(niveles, 1):
        ruta = os.path.join(carpeta, f'nivel_{n:02d}.svg')
        io.open(ruta, 'w', encoding='utf-8').write(svg_nivel(n, nombre, tipo, filas))
    print(f'{len(niveles)} mapas generados en {carpeta}')


if __name__ == '__main__':
    main()
