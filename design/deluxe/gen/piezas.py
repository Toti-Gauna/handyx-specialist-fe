# Piezas compartidas de la fila elegida (estética actual de la app, fondo blanco, barra de vidrio).
AZUL='#1F57A8'; HONDO='#143E7E'; TINTE='#E9EFF9'; AMARILLO='#F5F59A'; NOCHE='#1D2C4A'; TINTA='#0E1D36'
TEXTO='#26324A'; SUAVE='#5F6B84'; MOSAICO='#ECECEC'; BORDE='#E3E7EE'; NARANJA='#F6A623'; EXITO='#1E9E57'
ELEV1='0 1px 3px rgba(14,29,54,0.06), 0 8px 22px -8px rgba(14,29,54,0.16)'
ELEV2='0 2px 6px rgba(14,29,54,0.08), 0 18px 40px -14px rgba(14,29,54,0.30)'
TIT="font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%"
BLOB={'lamparita':'/_blob/ed01ff560387ed196d045022cd6616e8','llave':'/_blob/80fd8bf922d12d772611fc86fa5c3faf','engranaje':'/_blob/e1e0f73e0920c099b092f4574602e473','cano':'/_blob/c9c14a2e1422b78ee0f69faf0d3ecf1f'}

def svg(d, color, size=22, w=2):
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'

IC={
 'casa':'<path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path><path d="M10 20v-5h4v5"></path>',
 'obra':'<path d="M3 20h18"></path><path d="M5 20V9l7-5 7 5v11"></path><path d="M9 20v-6h6v6"></path>',
 'agenda':'<rect x="3" y="5" width="18" height="16" rx="3"></rect><path d="M3 10h18M8 3v4M16 3v4"></path>',
 'chat':'<path d="M4 5h16v11H9l-5 4V5Z"></path><path d="M8 10h8M8 13h5"></path>',
 'cuenta':'<circle cx="12" cy="8" r="4"></circle><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"></path>',
 'campana':'<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z"></path><path d="M10 21h4"></path>',
 'pin':'<path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z"></path><circle cx="12" cy="9.5" r="2.5"></circle>',
 'atras':'<path d="M19 12H5M11 6l-6 6 6 6"></path>',
 'mas':'<path d="M12 5v14M5 12h14"></path>',
 'flecha':'<path d="M9 6l6 6-6 6"></path>',
 'check':'<path d="M5 12l5 5 9-10"></path>',
 'camara':'<path d="M4 8h3l2-3h6l2 3h3v11H4V8Z"></path><circle cx="12" cy="13" r="3.5"></circle>',
 'reloj':'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
}

def documento(titulo, cuerpo):
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{titulo}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..900&amp;family=DM+Sans:opsz,wght@9..40,400..800&amp;display=swap">
<style>
body{{margin:0}}
a{{color:{AZUL}}}a:hover{{color:{HONDO}}}
</style>
</helmet>
<div style="width: 390px; height: 844px; box-sizing: border-box; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; color: {TINTA}; overflow: hidden; position: relative">
{cuerpo}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":844}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''

def barra_vidrio(activa):
    tabs=[('Inicio','casa','F-Inicio.dc.html'),('Obras','obra','F-Obras.dc.html'),('Agenda','agenda','F-Agenda.dc.html'),('Mensajes','chat','F-Mensajes.dc.html'),('Cuenta','cuenta','F-Cuenta.dc.html')]
    items=[]
    for nombre,ic,href in tabs:
        on = nombre==activa
        fondo = f'background: {AZUL}; box-shadow: 0 3px 0 {HONDO};' if on else ''
        color = '#FFFFFF' if on else TEXTO
        actual = ' aria-current="page"' if on else ''
        items.append(f'<a href="{href}"{actual} style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; border-radius: 22px; {fondo} color: {color}; font-size: 11px; font-weight: {800 if on else 700}; text-decoration: none">{svg(IC[ic], color, 21)}{nombre}</a>')
    return ('  <nav aria-label="Secciones" style="position: absolute; left: 14px; right: 14px; bottom: 14px; height: 70px; box-sizing: border-box; padding: 6px; border-radius: 30px; '
            'background: rgba(255,255,255,0.62); backdrop-filter: blur(22px) saturate(180%); -webkit-backdrop-filter: blur(22px) saturate(180%); '
            f'border: 1px solid rgba(255,255,255,0.75); box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), {ELEV2}; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 2px">\n    '
            + '\n    '.join(items) + '\n  </nav>')

def barra_compacta(titulo, atras, accion='', sub=''):
    return f'''  <header style="position: absolute; top: 0; left: 0; right: 0; z-index: 2; height: 64px; padding: 10px 16px 0; box-sizing: border-box; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; background: #FFFFFF">
    <a href="{atras}" aria-label="Volver" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; background: #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'], TINTA, 20)}</a>
    <span style="display: flex; flex-direction: column; align-items: center"><h1 style="margin: 0; text-align: center; font-family: 'Archivo', sans-serif; font-size: 17px; font-weight: 800; font-stretch: 112%">{titulo}</h1>{('<span style="font-size: 11px; font-weight: 700; color: '+SUAVE+'">'+sub+'</span>') if sub else ''}</span>
    <span>{accion}</span>
  </header>'''

def marcador(t):
    return f'<span style="box-shadow: inset 0 -0.36em 0 {AMARILLO}">{t}</span>'

def etiqueta(t, color=SUAVE):
    return f'<span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: {color}">{t}</span>'

def boton(texto, href, ancho=True, alto=56):
    return f'<a href="{href}" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: {alto}px; padding: 0 20px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; font-size: 16px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 0 {HONDO}">{texto}</a>'

def accion_fija(texto, href):
    return f'''  <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 14px 16px 22px; background: #FFFFFF; border-top: 1px solid {BORDE}">
    {boton(texto, href)}
  </div>'''

def franja(texto, href):
    return f'<a href="{href}" style="display: flex; align-items: center; justify-content: space-between; min-height: 46px; padding: 0 16px; background: #F4F5F7; border-top: 1px solid {BORDE}; color: {AZUL}; font-size: 13px; font-weight: 800; text-decoration: none">{texto}{svg(IC["flecha"], AZUL, 18)}</a>'

def tarjeta(contenido, pie='', extra=''):
    return f'<section style="border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; overflow: hidden; {extra}"><div style="padding: 16px; display: flex; flex-direction: column; gap: 10px">{contenido}</div>{pie}</section>'

def anillo(hechas, total, tam=56):
    pct = round(100*hechas/total)
    return (f'<span role="img" aria-label="{hechas} de {total} etapas" style="width: {tam}px; height: {tam}px; flex: none; border-radius: 50%; background: conic-gradient({AZUL} 0 {pct}%, {MOSAICO} {pct}% 100%); display: flex; align-items: center; justify-content: center">'
            f'<span style="width: {tam-14}px; height: {tam-14}px; border-radius: 50%; background: #FFFFFF; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 14px">{hechas}/{total}</span></span>')
