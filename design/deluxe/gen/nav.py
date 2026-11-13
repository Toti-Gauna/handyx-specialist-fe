import sys
archivo, activa = sys.argv[1], sys.argv[2]
tabs = [('Inicio','C-Inicio.dc.html'),('Obras','C-Obras.dc.html'),('Agenda','C-Obras.dc.html'),('Mensajes','C-Inicio.dc.html'),('Cuenta','C-Ingresos.dc.html')]
items = []
for nombre, href in tabs:
    on = nombre == activa
    color = '#1F57A8' if on else '#5F6B84'
    peso = 800 if on else 700
    punto = '<span style="display: block; width: 5px; height: 5px; margin: 3px auto 0; border-radius: 50%; background: #1F57A8"></span>' if on else ''
    items.append(f'<a href="{href}"{" aria-current=\"page\"" if on else ""} style="color: {color}; font-size: 11px; font-weight: {peso}; text-align: center; text-decoration: none">{nombre}{punto}</a>')
nav = ('<nav aria-label="Secciones" style="position: absolute; left: 18px; right: 18px; bottom: 16px; height: 62px; border-radius: 31px; background: #FFFFFF; border: 1px solid #E3ECF7; box-shadow: 0 20px 40px -18px rgba(31,87,168,0.5); display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center">\n    '
       + '\n    '.join(items) + '\n  </nav>')
s = open(archivo).read()
assert 'NAV' in s
open(archivo, 'w').write(s.replace('  NAV\n', '  ' + nav + '\n', 1))
