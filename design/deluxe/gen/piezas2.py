from piezas import *
IC.update({
 'llave2':'<circle cx="8" cy="15" r="4"></circle><path d="M11 12l9-9M17 6l2 2M15 8l2 2"></path>',
 'sobre':'<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>',
 'telefono':'<rect x="7" y="2" width="10" height="20" rx="2.5"></rect><path d="M11 18h2"></path>',
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
 'lupa':'<circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path>',
 'flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>',
 'billete':'<rect x="3" y="6" width="18" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.5"></circle>',
 'herramienta':'<path d="M14 6a4 4 0 0 0 5 5l-8 8a2 2 0 0 1-3-3l8-8a4 4 0 0 0-2-2Z"></path>',
 'caja':'<path d="M3 8l9-5 9 5v9l-9 5-9-5V8Z"></path><path d="M3 8l9 5 9-5M12 13v9"></path>',
 'camion':'<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7"></path><circle cx="6" cy="18" r="2"></circle><circle cx="17" cy="18" r="2"></circle>',
 'ticket':'<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z"></path><path d="M9 8h6M9 12h6"></path>',
 'estrella':'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"></path>',
 'escudo':'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"></path><path d="M8.5 12l2.5 2.5 4.5-5"></path>',
 'rayo':'<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z"></path>',
 'gota':'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"></path>',
 'llama':'<path d="M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-5 1-8Z"></path>',
 'copo':'<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"></path>',
 'ladrillo':'<rect x="3" y="5" width="18" height="14" rx="1"></rect><path d="M3 12h18M9 5v7M15 12v7"></path>',
 'candado':'<rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path>',
 'micro':'<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>',
 'lista':'<path d="M9 6h11M9 12h11M9 18h11"></path><path d="M4 6h1M4 12h1M4 18h1"></path>',
 'brujula':'<circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"></path>',
 'enviar':'<path d="M4 12l16-8-6 16-2-7-8-1Z"></path>',
 'clip':'<path d="M20 11l-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7"></path>',
 'ayuda':'<circle cx="12" cy="12" r="9"></circle><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4"></path><path d="M12 17h.01"></path>',
 'alerta':'<path d="M12 3l10 18H2L12 3Z"></path><path d="M12 10v5M12 18h.01"></path>',
 'regalo':'<rect x="3" y="9" width="18" height="12" rx="1"></rect><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1s6 1 6 1Zm0 0c2-4 6-4 6-1s-6 1-6 1Z"></path>',
 'medalla':'<circle cx="12" cy="15" r="6"></circle><path d="M8 3l4 6 4-6"></path>',
 'qr':'<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M14 14h3v3h-3zM18 18h3v3h-3z"></path>',
 'cronometro':'<circle cx="12" cy="14" r="7"></circle><path d="M12 14V10M10 3h4M12 3v4"></path>',
 'escaner':'<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"></path><path d="M8 8v8M11 8v8M14 8v8M17 8v8"></path>',
 'regla':'<path d="M3 16L16 3l5 5L8 21l-5-5Z"></path><path d="M7 12l2 2M10 9l2 2M13 6l2 2"></path>',
 'puerta':'<path d="M5 21V3h14v18"></path><path d="M3 21h18M15 12h.01"></path>',
 'termometro':'<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z"></path>',
 'nivel':'<rect x="2" y="9" width="20" height="6" rx="2"></rect><circle cx="12" cy="12" r="1.5"></circle><path d="M9 9v6M15 9v6"></path>',
 'edificio':'<path d="M4 21V5l8-3 8 3v16"></path><path d="M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"></path>',
 'usuario2':'<circle cx="9" cy="8" r="3.5"></circle><path d="M2 20c1-3.5 3.5-5 7-5s6 1.5 7 5"></path><path d="M16 4a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.4 2.2 4 5"></path>',
 'wifi':'<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"></path><path d="M12 19h.01"></path><path d="M3 3l18 18"></path>',
})

def chip(texto, ic=None, tono='tinte'):
    tonos={'tinte':(TINTE,HONDO),'amarillo':(AMARILLO,TINTA),'noche':(NOCHE,'#FFFFFF'),'gris':(MOSAICO,TEXTO),'exito':('#E3F4EA','#137140'),'error':('#FCE8E6','#A8261C'),'blanco':('#FFFFFF',HONDO),'azul':(AZUL,'#FFFFFF')}
    f,c=tonos[tono]
    i=svg(IC[ic],c,14) if ic else ''
    return f'<span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; background: {f}; color: {c}; font-size: 12px; font-weight: 800; white-space: nowrap">{i}{texto}</span>'

def mosaico_ic(ic, tam=48, fondo=MOSAICO, color=TINTA, radio=16, iconsize=22):
    return f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex: none; border-radius: {radio}px; background: {fondo}; display: flex; align-items: center; justify-content: center">{svg(IC[ic], color, iconsize)}</span>'

def mosaico_handy(nombre, tam=58):
    return f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex: none; border-radius: 18px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center"><img src="{BLOB[nombre]}" alt="" style="width: {int(tam*0.62)}px; height: {int(tam*0.72)}px; object-fit: contain"></span>'

def fila_ic(ic, titulo, sub='', derecha='', href=None, borde=True):
    b=f'border-top: 1px solid {BORDE};' if borde else ''
    sub_html=f'<span style="font-size: 13px; color: {SUAVE}">{sub}</span>' if sub else ''
    inner=f'{mosaico_ic(ic,40,radio=12,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px"><strong style="font-size: 15px">{titulo}</strong>{sub_html}</span>{derecha}'
    if href:
        return f'<a href="{href}" style="display: flex; align-items: center; gap: 12px; padding: 12px 0; {b} color: {TINTA}; text-decoration: none">{inner}{svg(IC["flecha"],SUAVE,18)}</a>'
    return f'<div style="display: flex; align-items: center; gap: 12px; padding: 12px 0; {b}">{inner}</div>'

def titulo_grande(sup, antes, marcado, despues='', sub=''):
    s=f'<p style="margin: 0; font-size: 14px; color: {SUAVE}">{sub}</p>' if sub else ''
    return f'''<section style="display: flex; flex-direction: column; gap: 6px">{etiqueta(sup)}<h1 style="margin: 0; {TIT}; font-size: 36px; line-height: 1.02">{antes}{marcador(marcado)}{despues}</h1>{s}</section>'''

def contenido(html, top=72, bottom=None):
    return f'<div style="position: absolute; top: {top}px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 14px">{html}</div>'

def boton2(texto, href, ic=None):
    i=svg(IC[ic],AZUL,18) if ic else ''
    return f'<a href="{href}" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; padding: 0 16px; border-radius: 16px; background: #FFFFFF; border: 2px solid {AZUL}; color: {AZUL}; font-size: 15px; font-weight: 800; text-decoration: none">{i}{texto}</a>'

def acciones_fijas(*botones):
    return f'''  <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 12px 16px 22px; background: #FFFFFF; border-top: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 10px">{''.join(botones)}</div>'''

def isla(texto, ic='campana', tono=NOCHE):
    return f'<div role="status" style="position: absolute; top: 12px; left: 50%; translate: -50% 0; z-index: 5; display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; background: {tono}; color: #FFFFFF; font-size: 14px; font-weight: 800; box-shadow: {ELEV2}; white-space: nowrap">{svg(IC[ic], AMARILLO, 18)}{texto}</div>'

def mapa(top=0, alto=844, zona=None, punto=None, ruta=None, extra=''):
    bl=[]
    for f in range(alto//62+2):
        for c in range(5):
            bl.append(f'<div style="position: absolute; left: {-24+c*66}px; top: {top+20+f*62}px; width: 54px; height: 50px; border-radius: 10px; background: #E7E9EE"></div>')
    z=''
    if zona:
        x,y,r=zona
        z=f'<div style="position: absolute; top: {y-r}px; left: {x-r}px; width: {2*r}px; height: {2*r}px; border-radius: 50%; background: rgba(31,87,168,0.10); border: 2px dashed {AZUL}"></div>'
    pt=''
    if punto:
        x,y=punto
        pt=f'<div style="position: absolute; top: {y-9}px; left: {x-9}px; width: 18px; height: 18px; border-radius: 50%; background: {AZUL}; border: 3px solid #FFFFFF; box-shadow: 0 0 0 10px rgba(31,87,168,0.16)"></div>'
    rt=''
    if ruta:
        pts=' '.join(f'{x},{y}' for x,y in ruta)
        rt=f'<svg style="position: absolute; inset: 0" width="390" height="844" aria-hidden="true"><polyline points="{pts}" fill="none" stroke="{AZUL}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>'
    return f'''  <div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: {top}px; height: {alto}px; overflow: hidden; background: #F3F4F7">
    {''.join(bl)}
    <div style="position: absolute; top: 0; bottom: 0; left: 312px; width: 8px; background: #EFE8D8"></div>
    <div style="position: absolute; top: 0; bottom: 0; left: 320px; right: 0; background: #E8EDF5"></div>
    {z}{rt}{pt}{extra}
  </div>'''

def hoja(html, top):
    return f'''  <section style="position: absolute; left: 0; right: 0; top: {top}px; bottom: 0; padding: 10px 16px 0; border-radius: 32px 32px 0 0; background: #FFFFFF; box-shadow: 0 -6px 18px -6px rgba(14,29,54,0.18), 0 24px 60px -20px rgba(14,29,54,0.45); display: flex; flex-direction: column; gap: 12px">
    <div style="align-self: center; width: 44px; height: 5px; border-radius: 3px; background: #D5DAE3"></div>
    {html}
  </section>'''

def cabecera_azul():
    return f'''  <header style="position: absolute; top: 0; left: 0; right: 0; padding: 22px 16px 20px 22px; background: {AZUL}; border-radius: 0 0 30px 30px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12px 30px -16px rgba(14,29,54,0.55)">
    <span style="display: flex; flex-direction: column; gap: 2px"><span style="{TIT}; font-size: 40px; line-height: 1; color: #FFFFFF">Handyx</span><span style="font-size: 11px; font-weight: 700; color: #FFFFFF">Soluciones, no problemas</span></span>
    <span style="display: flex; gap: 10px">
      <a href="D6-Avisos.dc.html" aria-label="Avisos" style="position: relative; width: 58px; height: 58px; border-radius: 18px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['campana'],'#FFFFFF',24)}<span style="position: absolute; top: 12px; right: 13px; width: 10px; height: 10px; border-radius: 50%; background: {AMARILLO}"></span></a>
      <a href="F-Inicio.dc.html" aria-label="Mis zonas" style="width: 58px; height: 58px; border-radius: 18px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['pin'],'#FFFFFF',24)}</a>
    </span>
  </header>'''

def interruptor(on=True, top=122):
    txt='Disponible' if on else 'No disponible'
    pista=AMARILLO if on else '#5A6A88'
    lado='right: 3px' if on else 'left: 3px'
    return f'''  <button role="switch" aria-checked="{'true' if on else 'false'}" style="position: absolute; top: {top}px; right: 14px; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 10px 0 16px; border: 2px solid {AMARILLO}; border-radius: 999px; background: {NOCHE}; color: #FFFFFF; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 800; box-shadow: {ELEV2}">{txt}<span style="width: 48px; height: 28px; border-radius: 14px; background: {pista}; position: relative; display: block"><span style="position: absolute; top: 3px; {lado}; width: 22px; height: 22px; border-radius: 50%; background: {NOCHE if on else '#FFFFFF'}; display: block"></span></span></button>'''

def barra_progreso(pct, extra_pct=0, alto=8, fondo='#FFFFFF'):
    ex=f'<span style="width: {extra_pct}%; height: {alto}px; background: {AMARILLO}; box-shadow: inset 0 0 0 1px #D8D36A"></span>' if extra_pct else ''
    return f'<span style="display: flex; height: {alto}px; border-radius: {alto//2}px; overflow: hidden; background: {fondo}"><span style="width: {pct}%; height: {alto}px; background: {AZUL}"></span>{ex}</span>'

def camino_card(href='G-Camino.dc.html', con_pedido=True):
    extra = 10 if con_pedido else 0
    nota = (f'<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: {TEXTO}"><span style="width: 14px; height: 8px; border-radius: 2px; background: {AMARILLO}; box-shadow: inset 0 0 0 1px #D8D36A"></span>Este pedido suma 1 cuando el trabajo se verifique</span>') if con_pedido else ''
    return f'''<a href="{href}" style="padding: 12px 14px; border-radius: 20px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 8px">
      <span style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 13px; font-weight: 800">Tu camino · 8 de 10</span><span style="font-size: 12px; color: {SUAVE}; font-weight: 700">Próximo: Gorra Handyx</span></span>
      {barra_progreso(80, extra)}
      {nota}
    </a>'''

def calendario(seleccionado, hoy=17, ocupados=(), marcados=(), pasado_hasta=16):
    cab=''.join(f'<span style="text-align: center; font-size: 11px; font-weight: 800; color: {SUAVE}">{d}</span>' for d in ['L','M','M','J','V','S','D'])
    celdas=['<span></span>']*6
    for d in range(1,31):
        if d==seleccionado:
            est=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}; font-weight: 900'
        elif d==hoy:
            est=f'background: #FFFFFF; box-shadow: inset 0 0 0 2px {NARANJA}; font-weight: 800'
        elif d<=pasado_hasta:
            est=f'color: #56627A'
        elif d in ocupados:
            est=f'background: {MOSAICO}; color: {SUAVE}'
        else:
            est=f'background: #F6F7F9; font-weight: 700'
        punto=f'<span style="position: absolute; bottom: 4px; left: 50%; margin-left: -2px; width: 4px; height: 4px; border-radius: 50%; background: {NARANJA if d not in ocupados else SUAVE}"></span>' if d in marcados else ''
        actual=' aria-current="date"' if d==hoy else ''
        celdas.append(f'<span{actual} style="position: relative; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 14px; {est}">{d}{punto}</span>')
    return f'<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px">{cab}{"".join(celdas)}</div>'

def qr(tam=150):
    import random
    random.seed(7)
    n=21; c=tam/n; rects=[]
    for y in range(n):
        for x in range(n):
            esq=(x<7 and y<7) or (x>=n-7 and y<7) or (x<7 and y>=n-7)
            if esq:
                lx,ly=x%7 if x<7 else x-(n-7), y%7 if y<7 else y-(n-7)
                on = lx in (0,6) or ly in (0,6) or (2<=lx<=4 and 2<=ly<=4)
            else:
                on = random.random()<0.48
            if on: rects.append(f'<rect x="{x*c:.1f}" y="{y*c:.1f}" width="{c:.1f}" height="{c:.1f}"></rect>')
    return f'<svg role="img" aria-label="Código QR de retiro (simulación)" width="{tam}" height="{tam}" viewBox="0 0 {tam} {tam}" fill="{TINTA}">{"".join(rects)}</svg>'

def guardar(nombre, titulo, cuerpo, alto=844):
    d=documento(titulo, cuerpo)
    if alto!=844:
        d=d.replace('width: 390px; height: 844px;', f'width: 390px; height: {alto}px;',1).replace('{"width":390,"height":844}', '{"width":390,"height":%d}' % alto)
    open('deluxe/project/'+nombre,'w').write(d)

GENTE = {
 'yo': ('JO','Julián Ortiz',AZUL,'#FFFFFF'),
 'martin': ('MS','Martín Sosa',NOCHE,'#FFFFFF'),
 'lucia': ('LF','Lucía Ferreyra',AMARILLO,TINTA),
 'carla': ('CI','Carla Ibáñez','#F6D7A7',TINTA),
 'sofia': ('SR','Sofía Ruiz','#CDE7D6','#137140'),
 'diego': ('DH','Diego Herrera',TINTE,HONDO),
 'pablo': ('PV','Pablo Vega','#E7D9F5','#5B3A8C'),
}
def avatar(k, tam=44, borde=False):
    ini,_,f,c = GENTE[k]
    b='box-shadow: 0 0 0 3px #FFFFFF;' if borde else ''
    return f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex: none; border-radius: 50%; background: {f}; color: {c}; display: inline-flex; align-items: center; justify-content: center; font-family: \'Archivo\', sans-serif; font-weight: 900; font-stretch: 100%; letter-spacing: -0.3px; font-size: {max(11,int(tam*0.36))}px; {b}">{ini}</span>'
def avatares(ks, tam=30):
    tam=max(tam,28)
    return '<span style="display: inline-flex">'+''.join(f'<span style="position: relative; z-index: {len(ks)-i}; margin-left: {0 if i==0 else 3}px">{avatar(k,tam,True)}</span>' for i,k in enumerate(ks))+'</span>'
def nombre(k): return GENTE[k][1]
def tabs(items, activa):
    out=[]
    for t,href in items:
        on=t.split(' ·')[0]==activa
        s=f'background: #FFFFFF; color: {TINTA}; box-shadow: {ELEV1}' if on else f'color: {SUAVE}'
        out.append(f'<a href="{href}"{" aria-current=\"page\"" if on else ""} style="flex: 1; min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; text-decoration: none; {s}">{t}</a>')
    return f'<nav aria-label="Secciones de la obra" style="display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: {MOSAICO}">{"".join(out)}</nav>'

def cabecera_estado(stats, sub='Te llegan pedidos de tus zonas', on=True):
    """Cabecera azul del Inicio con un panel blanco colgado: Disponible arriba y tres datos del día en columnas."""
    cab = cabecera_azul().replace('padding: 22px 16px 20px 22px', 'padding: 22px 16px 62px 22px', 1)
    pista = '#1E9E57' if on else '#C9CFDA'; lado = 'right: 3px' if on else 'left: 3px'
    def dato(ic, et, v, href=None):
        tag = 'a' if href else 'span'; h = f' href="{href}"' if href else ''
        return (f'<{tag}{h} style="flex: 1; min-width: 0; min-height: 44px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: {TINTA}; text-decoration: none; text-align: center">'
                f'<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: {SUAVE}">{svg(IC[ic],AZUL,14)}{et}</span>'
                f'<strong style="font-size: 15px; white-space: nowrap; font-variant-numeric: tabular-nums">{v}</strong></{tag}>')
    sep = f'<span aria-hidden="true" style="width: 1px; align-self: stretch; margin: 6px 0; background: {BORDE}"></span>'
    datos = sep.join(dato(*s) for s in stats)
    panel = f'''  <section aria-label="Tu estado" style="position: absolute; top: 104px; left: 12px; right: 12px; padding: 6px 14px 8px; border-radius: 26px; background: #FFFFFF; box-shadow: 0 2px 6px rgba(14,29,54,0.08), 0 22px 40px -22px rgba(14,29,54,0.5); display: flex; flex-direction: column">
    <div role="switch" aria-checked="{str(on).lower()}" aria-label="Disponible" style="display: flex; align-items: center; gap: 12px; min-height: 56px">
      <span aria-hidden="true" style="width: 12px; height: 12px; flex: none; border-radius: 50%; background: {pista}; box-shadow: 0 0 0 5px {"rgba(30,158,87,0.18)" if on else "rgba(0,0,0,0.06)"}"></span>
      <span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 16px">{"Disponible" if on else "No disponible"}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>
      <span aria-hidden="true" style="width: 54px; height: 32px; flex: none; border-radius: 16px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 26px; height: 26px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span>
    </div>
    <div style="height: 1px; background: {BORDE}"></div>
    <div style="display: flex; align-items: stretch; padding-top: 6px">{datos}</div>
  </section>'''
    return cab + '\n' + panel

def avatar_grupo(ks, tam=44):
    """Avatar de un grupo: mosaico con las iniciales de hasta 4 personas, sin superposiciones."""
    c = (tam - 6) // 2
    celdas = ''.join(f'<span style="width: {c}px; height: {c}px; border-radius: {c//3}px; background: {GENTE[k][2]}; color: {GENTE[k][3]}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; letter-spacing: -0.3px">{GENTE[k][0]}</span>' for k in ks[:4])
    if len(ks) == 3:
        celdas += f'<span style="width: {c}px; height: {c}px; border-radius: {c//3}px; background: #FFFFFF; color: {HONDO}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900">+1</span>'
    return f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex: none; box-sizing: border-box; padding: 2px; border-radius: {tam//3}px; background: {TINTE}; display: grid; grid-template-columns: {c}px {c}px; gap: 2px">{celdas}</span>'

def _color_nombre(k):
    f, t = GENTE[k][2], GENTE[k][3]
    return f if t == '#FFFFFF' else (TINTA if f in (AMARILLO, '#F6D7A7') else t)

def burbuja(k, texto, hora, mio=False, con_nombre=True, reac=None, editado=False, ancho='82%'):
    """Mensaje de chat: avatar pegado a su burbuja, nombre y hora dentro, reacciones apoyadas en el borde."""
    pie = f'<span style="align-self: flex-end; font-size: 11px; {"color: #DCE7F7" if mio else "color: "+SUAVE}; white-space: nowrap">{"editado · " if editado else ""}{hora}</span>'
    r = ''
    if reac:
        lado = 'left: 12px'
        r = (f'<span style="position: absolute; bottom: -16px; {lado}; display: flex; gap: 4px">' +
             ''.join(f'<span style="display: inline-flex; align-items: center; gap: 3px; height: 26px; padding: 0 8px; border-radius: 13px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; font-size: 13px">{e}<strong style="font-size: 11px">{n}</strong></span>' for e, n in reac) + '</span>')
    mb = 'margin-bottom: 14px;' if reac else ''
    if mio:
        return (f'<div style="align-self: flex-end; max-width: {ancho}; position: relative; {mb}"><div style="padding: 10px 14px 8px; background: {AZUL}; color: #FFFFFF; border-radius: 20px 20px 6px 20px; '
                f'display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; line-height: 1.35">{texto}</span>{pie}</div>{r}</div>')
    n = f'<span style="font-size: 12px; font-weight: 800; color: {_color_nombre(k)}">{nombre(k)}</span>' if con_nombre else ''
    return (f'<div style="align-self: flex-start; max-width: {ancho}; display: flex; gap: 8px; align-items: flex-end; {mb}">{avatar(k, 34)}'
            f'<div style="position: relative; min-width: 0"><div style="padding: 8px 14px 8px; background: {MOSAICO}; border-radius: 20px 20px 20px 6px; display: flex; flex-direction: column; gap: 3px">{n}'
            f'<span style="font-size: 15px; line-height: 1.35">{texto}</span>{pie}</div>{r}</div></div>')

def contenido_chat(html, top=72, bottom=84):
    """Mensajes pegados abajo, justo arriba de la caja para escribir (como en cualquier chat)."""
    return f'<div style="position: absolute; top: {top}px; bottom: {bottom}px; left: 14px; right: 14px; display: flex; flex-direction: column; justify-content: flex-end; gap: 12px; overflow: hidden; padding-bottom: 6px">{html}</div>'

def cabecera_estado(stats, sub='Te llegan pedidos de tus zonas', on=True):
    """Inicio: la cabecera azul trae adentro el interruptor de Disponible (sin datos extra: el mapa queda a la vista)."""
    pista = '#1E9E57' if on else 'rgba(255,255,255,0.3)'; lado = 'right: 3px' if on else 'left: 3px'
    def dato(ic, et, v, href=None):
        tag = 'a' if href else 'span'; h = f' href="{href}"' if href else ''
        return (f'<{tag}{h} style="flex: 1; min-width: 0; min-height: 52px; padding: 6px 4px; box-sizing: border-box; border-radius: 16px; background: rgba(14,29,54,0.24); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: #FFFFFF; text-decoration: none; text-align: center">'
                f'<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 800; color: #E6EEFA">{svg(IC[ic],AMARILLO,14)}{et}</span>'
                f'<strong style="font-size: 15px; white-space: nowrap; font-variant-numeric: tabular-nums">{v}</strong></{tag}>')
    datos = ''.join(dato(*s) for s in stats)
    return f'''  <header style="position: absolute; top: 0; left: 0; right: 0; padding: 20px 14px 14px 20px; background: {AZUL}; border-radius: 0 0 32px 32px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 14px 30px -16px rgba(14,29,54,0.55)">
    <div style="display: flex; align-items: center; justify-content: space-between">
      <span style="display: flex; flex-direction: column; gap: 2px"><span style="{TIT}; font-size: 36px; line-height: 1; color: #FFFFFF">Handyx</span><span style="font-size: 11px; font-weight: 700; color: #FFFFFF">Soluciones, no problemas</span></span>
      <span style="display: flex; gap: 8px">
        <a href="D6-Avisos.dc.html" aria-label="Avisos" style="position: relative; width: 52px; height: 52px; border-radius: 17px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center">{svg(IC['campana'],'#FFFFFF',23)}<span style="position: absolute; top: 11px; right: 12px; width: 10px; height: 10px; border-radius: 50%; background: {AMARILLO}"></span></a>
        <a href="CU-Disponibilidad.dc.html" aria-label="Tus zonas" style="width: 52px; height: 52px; border-radius: 17px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center">{svg(IC['pin'],'#FFFFFF',23)}</a>
      </span>
    </div>
    <div role="switch" aria-checked="{str(on).lower()}" aria-label="Disponible" style="display: flex; align-items: center; gap: 12px; min-height: 54px; padding: 0 8px 0 12px; border-radius: 18px; background: #FFFFFF">
        <span aria-hidden="true" style="width: 12px; height: 12px; flex: none; border-radius: 50%; background: {"#1E9E57" if on else "#C9CFDA"}; box-shadow: 0 0 0 5px {"rgba(30,158,87,0.18)" if on else "rgba(0,0,0,0.06)"}"></span>
        <span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 16px; color: {TINTA}">{"Disponible" if on else "No disponible"}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>
        <span aria-hidden="true" style="width: 54px; height: 32px; flex: none; border-radius: 16px; background: {pista if on else "#C9CFDA"}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 26px; height: 26px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span>
    </div>
  </header>'''
