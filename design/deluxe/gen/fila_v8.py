import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({'reenviar':'<path d="M14 5l7 7-7 7"></path><path d="M21 12H9a6 6 0 0 0-6 6v1"></path>','copiar':'<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path>','lapiz':'<path d="M4 20h4L19 9l-4-4L4 16v4Z"></path><path d="M14 6l4 4"></path>','tacho':'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path>','play':'<path d="M7 4l13 8-13 8V4Z"></path>','responder':'<path d="M10 9L4 14l6 5"></path><path d="M4 14h11a5 5 0 0 0 5-5V5"></path>','fijar':'<path d="M9 3h6l-1 6 4 4H6l4-4-1-6Z"></path><path d="M12 13v8"></path>','taladro':'<path d="M3 7h12l2 3h4v2h-4l-2 3H9v5H5v-5H3V7Z"></path>','carrito':'<path d="M3 4h2l2.5 11h11l2-8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>','tienda':'<path d="M3 9l2-5h14l2 5"></path><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z"></path><path d="M5 13v8h14v-8"></path>','documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>','silencio':'<path d="M6 16V11a6 6 0 0 1 9-5M18 11v5l2 2H8"></path><path d="M3 3l18 18"></path>','salir':'<path d="M10 4H5v16h5"></path><path d="M14 8l4 4-4 4M18 12H9"></path>'})
def op(t, on=False, href=None):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    tag='a' if href else 'span'; h=f' href="{href}"' if href else ''
    return f'<{tag}{h} style="min-height: 44px; padding: 0 12px; border-radius: 14px; {s}; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; white-space: nowrap">{t}</{tag}>'
def interr(t, sub, on, bloqueado=False):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div role="switch" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span aria-hidden="true" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative; {"opacity: 0.6" if bloqueado else ""}"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
def modal(html, bottom=100):
    return f'<section style="position: absolute; left: 12px; right: 12px; bottom: {bottom}px; padding: 16px; border-radius: 30px; background: #FFFFFF; box-shadow: 0 2px 6px rgba(14,29,54,0.10), 0 30px 60px -18px rgba(14,29,54,0.55); display: flex; flex-direction: column; gap: 12px">{html}</section>'
def velo(): return '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n'

# ── Buscar un profesional nuevo para la obra ─────────────────────────
cuerpo = barra_compacta('Buscar un profesional','F-ObraEquipo.dc.html',sub='Baño completo') + contenido(f'''
    <div style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 15px">¿Qué oficio necesitás?</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Electricidad",True)}{op("Albañilería")}{op("Gas")}{op("Plomería")}</div></div>
    <div style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 15px">¿Para qué jornadas?</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Vie 20 · 8:30 a 13",True)}{op("Lun 23")}{op("Toda la obra")}</div></div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; flex-direction: column"><strong style="font-size: 15px">Su parte del pago</strong><span style="font-size: 12px; color: {SUAVE}">La cobra directo de Martín</span></span><span style="display: flex; align-items: center; gap: 8px"><span style="width: 36px; height: 36px; border-radius: 12px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span><strong style="{TIT}; font-size: 20px; white-space: nowrap">$ 85.000</strong><span style="width: 36px; height: 36px; border-radius: 12px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">+</span></span></div>' + interr("Verificado por Handyx","Siempre: no se puede apagar",True,True) + interr("Con matrícula verificada","Pedila si el trabajo la necesita",False))}
    <span style="min-height: 52px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; padding: 0 14px; font-size: 14px; color: {TEXTO}">«Conexión de luces y tomas del baño nuevo.»</span>
    <div style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 16px; background: {TINTE}">{svg(IC['ojo'] if 'ojo' in IC else IC['usuario2'],HONDO,20)}<span style="font-size: 12px; color: {HONDO}">La ven electricistas verificados que trabajan en Los Troncos. Vos elegís a quién sumar; nadie entra solo.</span></div>''') + '\n' + accion_fija('Publicar la búsqueda','F-ObraPostulantes.dc.html')
guardar('F-ObraBuscar.dc.html','Equipo · Buscar un profesional',cuerpo)

# El otro profesional lo ve en su Inicio
conv=f'''<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("TE BUSCAN PARA UNA OBRA", AZUL)}{chip("Cierra en 23 h","reloj","amarillo")}</div>
    <div style="display: flex; gap: 12px; align-items: center">{avatar('yo',48)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="{TIT}; font-size: 20px; line-height: 1.1">Baño completo</strong><span style="font-size: 13px; color: {SUAVE}">Julián Ortiz busca Electricidad · Los Troncos</span></span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{''.join(f'<div style="padding: 8px 10px; border-radius: 14px; background: {MOSAICO}"><span style="display: block; font-size: 11px; font-weight: 800; color: {SUAVE}">{a}</span><strong style="font-size: 14px; white-space: nowrap">{b}</strong></div>' for a,b in [('JORNADA','Vie 20'),('TU PARTE','$ 85.000'),('DISTANCIA','3,2 km')])}</div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.4fr); gap: 10px">{boton2("Ahora no","F-InicioConvocatoria.dc.html")}{boton("Ver la obra","F-ConvocatoriaDetalle.dc.html",alto=52)}</div>'''
cuerpo = mapa(zona=(220,300,50), punto=(95,420)) + '\n' + cabecera_estado([('campana','PEDIDOS','1 nuevo'),('pin','TUS ZONAS','3 barrios'),('estrella','CAMINO','5 de 10')]) + '\n' + modal(conv) + '\n' + barra_vidrio('Inicio')
guardar('F-InicioConvocatoria.dc.html','Equipo · Te buscan para una obra',cuerpo)

cuerpo = barra_compacta('Te buscan para una obra','F-InicioConvocatoria.dc.html',sub='Electricidad · Baño completo') + contenido(f'''
    {tarjeta(f'<div style="display: flex; gap: 12px; align-items: center">{avatar("yo",52)}<span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 16px">Julián Ortiz</strong><span style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Verificado","escudo","exito")}{chip("38 trabajos","check","gris")}</span></span></div><span style="font-size: 14px; color: {TEXTO}">«Conexión de luces y tomas del baño nuevo.»</span>')}
    {tarjeta(fila_ic('agenda','Viernes 20, de 8:30 a 13','Jornada 6 · Terminación',borde=False)+fila_ic('pin','Los Troncos · zona aproximada','La dirección te llega si te eligen')+fila_ic('billete','Tu parte: $ 85.000','La cobrás directo del cliente; Handyx no la toca')+fila_ic('usuario2','Equipo','Julián (Plomería) y Sofía (Albañilería)',derecha=avatares(['yo','sofia'],32)))}
    <span style="min-height: 52px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; padding: 0 14px; font-size: 14px; color: {SUAVE}">Mensaje para Julián (opcional)</span>''') + '\n' + accion_fija('Postularme','F-ObraPostulantes.dc.html')
guardar('F-ConvocatoriaDetalle.dc.html','Equipo · Detalle de la búsqueda',cuerpo)

def postu(k, rubro, sub, chips, msg, elegido=False):
    return f'<div style="padding: 14px; border-radius: 22px; background: #FFFFFF; border: {"2px solid "+AZUL if elegido else "1px solid "+BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 12px; align-items: center">{avatar(k,48)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{nombre(k)}</strong><span style="font-size: 12px; color: {SUAVE}">{rubro} · {sub}</span></span></div><span style="display: flex; gap: 6px; flex-wrap: wrap">{chips}</span><span style="font-size: 13px; color: {TEXTO}">{msg}</span><div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px">{boton2("Ver perfil","F-PerfilProfesional.dc.html","cuenta").replace("min-height: 52px","min-height: 48px")}{boton2("Escribirle","F-Chat.dc.html","chat").replace("min-height: 52px","min-height: 48px")}</div>{boton("Elegir a "+nombre(k).split()[0],"F-ChatGrupoInfo.dc.html",alto=48)}</div>'
cuerpo = barra_compacta('Postulantes','F-ObraBuscar.dc.html',sub='Electricidad · cierra en 23 h') + contenido(f'''
    {postu('diego','Electricidad','2,8 km',chip("Verificado","escudo","exito")+chip("Matrícula verificada","check","tinte")+chip("52 trabajos","estrella","gris"),'«Puedo el viernes a las 8:30. Llevo los materiales eléctricos si querés.»',True)}
    {postu('pablo','Electricidad y Gas','4,1 km',chip("Verificado","escudo","exito")+chip("21 trabajos","estrella","gris"),'«Disponible desde las 10.»')}''')
guardar('F-ObraPostulantes.dc.html','Equipo · Postulantes',cuerpo)

# ── Chat: reacciones, editar, borrar, seleccionar, fotos y videos, grupo ─
def msg(k, t, hora, mio=False, extra='', estilo='', reac=None, editado=False, ancho='82%'):
    return burbuja(k, t, hora, mio, True, reac, editado, ancho)
def reacc(items):
    return '<span style="display: flex; gap: 4px">'+''.join(f'<span style="display: inline-flex; align-items: center; gap: 3px; min-height: 26px; padding: 0 8px; border-radius: 13px; background: #FFFFFF; border: 1px solid {BORDE}; font-size: 13px">{e}<strong style="font-size: 11px">{n}</strong></span>' for e,n in items)+'</span>'
def cab_grupo(atras='F-Obra.dc.html', info='F-ChatGrupoInfo.dc.html'):
    return f'''  <header style="position: absolute; top: 0; left: 0; right: 0; z-index: 2; height: 70px; padding: 10px 14px 0; box-sizing: border-box; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border-bottom: 1px solid {BORDE}">
    <a href="{atras}" aria-label="Volver" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>{avatar_grupo(['martin','sofia','diego'],46)}<a href="{info}" style="flex: 1; min-width: 0; min-height: 44px; justify-content: center; display: flex; flex-direction: column; color: {TINTA}; text-decoration: none"><strong style="font-size: 16px">Baño completo</strong><span style="font-size: 12px; color: {SUAVE}">4 personas · tocá para ver</span></a>
  </header>'''
def entrada():
    return f'''  <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 12px 22px; background: #FFFFFF; border-top: 1px solid {BORDE}; display: flex; gap: 8px; align-items: center">
    <a href="F-ChatAdjuntar.dc.html" aria-label="Mandar tarjetas" style="width: 48px; height: 48px; flex: none; border-radius: 16px; background: {AZUL}; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center">{svg(IC['mas'],'#FFFFFF',22)}</a>
    <a href="F-ChatMedia.dc.html" aria-label="Fotos y videos" style="width: 48px; height: 48px; flex: none; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['camara'],TINTA,22)}</a>
    <span style="flex: 1; min-height: 48px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; padding: 0 14px; color: {SUAVE}; font-size: 15px">Escribí un mensaje</span>
  </div>'''
video=f'<div style="align-self: flex-start; display: flex; gap: 8px; align-items: flex-end">{avatar("sofia",34)}<div style="position: relative; width: 200px; height: 130px; border-radius: 20px 20px 20px 6px; background: #C9CED8; overflow: hidden"><span style="position: absolute; left: 50%; top: 50%; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; background: rgba(14,29,54,0.6); display: flex; align-items: center; justify-content: center">{svg(IC["play"],"#FFFFFF",20)}</span><span style="position: absolute; right: 8px; bottom: 8px; padding: 2px 8px; border-radius: 8px; background: rgba(14,29,54,0.7); color: #FFFFFF; font-size: 11px; font-weight: 800">0:24</span></div></div>'
borrado=f'<div style="align-self: flex-end; padding: 8px 14px; border-radius: 20px 20px 6px 20px; border: 1px dashed #C9CFDA; color: {SUAVE}; font-size: 14px; font-style: italic; display: flex; align-items: center; gap: 6px">{svg(IC["tacho"],SUAVE,16)}Borraste este mensaje</div>'
cuerpo = cab_grupo() + contenido_chat(f'''
    {msg('sofia','Mañana arranco 8:30 con la pared del lavatorio.','16:02',reac=[('👍','2'),('🙏','1')])}
    {video}
    {msg('martin','¡Quedó bárbaro! ¿Hace falta comprar algo más?','16:05')}
    {borrado}
    {msg('yo','Sí: pegamento × 4. Te lo mando para aprobar.','16:12',True,reac=[('❤️','1')],editado=True)}
    {msg('martin','Lo veo a la noche y te confirmo.','16:20')}''', top=84) + '\n' + entrada()
guardar('F-ChatGrupo.dc.html','Mensajes · Chat de la obra',cuerpo)

acciones=''.join(f'<a href="{h}" style="display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 4px; border-top: 1px solid {BORDE}; color: {c}; text-decoration: none; font-size: 15px; font-weight: 700">{svg(IC[i],c,20)}{t}</a>' for i,t,h,c in [('responder','Responder','F-ChatGrupo.dc.html',TINTA),('lapiz','Editar','F-ChatEditar.dc.html',TINTA),('copiar','Copiar','F-ChatGrupo.dc.html',TINTA),('check','Seleccionar varios','F-ChatSeleccion.dc.html',TINTA),('fijar','Fijar en el grupo','F-ChatGrupo.dc.html',TINTA),('tacho','Borrar','F-ChatBorrar.dc.html','#A8261C')])
cuerpo = cab_grupo() + velo() + f'''
  <div style="position: absolute; top: 220px; left: 60px; right: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px">
    <div role="toolbar" aria-label="Reacciones" style="display: flex; gap: 4px; padding: 6px; border-radius: 999px; background: #FFFFFF; box-shadow: {ELEV2}">{''.join(f'<span role="button" aria-label="Reaccionar {e}" style="width: 44px; height: 44px; border-radius: 50%; {"background: "+TINTE if i==0 else ""}; display: flex; align-items: center; justify-content: center; font-size: 22px">{e}</span>' for i,e in enumerate(['👍','❤️','😂','😮','🙏']))}<span role="button" aria-label="Más reacciones" style="width: 44px; height: 44px; border-radius: 50%; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['mas'],TINTA,20)}</span></div>
    <div style="max-width: 80%; padding: 10px 14px; background: {AZUL}; color: #FFFFFF; border-radius: 20px 20px 6px 20px; font-size: 15px; box-shadow: 0 0 0 4px rgba(255,255,255,0.6)">Sí: pegamento × 4. Te lo mando para aprobar.<span style="display: block; margin-top: 2px; font-size: 11px; opacity: 0.85; text-align: right">16:12</span></div>
  </div>
''' + hoja(acciones, 470)
guardar('F-ChatAcciones.dc.html','Mensajes · Acciones sobre un mensaje',cuerpo)

cuerpo = cab_grupo() + velo() + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Editar mensaje</strong><a href="F-ChatGrupo.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <div style="min-height: 110px; padding: 14px; border-radius: 18px; border: 2px solid {AZUL}; font-size: 15px; box-sizing: border-box">Sí: pegamento × 4 y pastina gris × 2. Te lo mando para aprobar.<span style="display: inline-block; width: 2px; height: 18px; margin-left: 2px; background: {AZUL}; vertical-align: middle"></span></div>
    <span style="font-size: 12px; color: {SUAVE}">Todos van a ver «editado». Las tarjetas (presupuestos, repuestos) no se editan: se manda una nueva.</span>
    {boton("Guardar","F-ChatGrupo.dc.html")}''', 420)
guardar('F-ChatEditar.dc.html','Mensajes · Editar un mensaje',cuerpo)

cuerpo = cab_grupo() + velo() + hoja(f'''
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">{mosaico_ic('tacho',64,fondo='#FCE8E6',color='#A8261C',radio=22,iconsize=30)}<strong style="{TIT}; font-size: 24px">¿Borrar el mensaje?</strong><span style="font-size: 14px; color: {TEXTO}">En el grupo se va a ver «Mensaje eliminado». Lo guardamos oculto por si hay un reclamo sobre la obra.</span></div>
    <a href="F-ChatGrupo.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 16px; background: #D93025; color: #FFFFFF; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 #A8261C">Borrar para todos</a>
    {boton2("Cancelar","F-ChatAcciones.dc.html")}''', 450)
guardar('F-ChatBorrar.dc.html','Mensajes · Borrar un mensaje',cuerpo)

def sel(on): return f'<span style="width: 26px; height: 26px; flex: none; border-radius: 50%; {"background: "+AZUL if on else "border: 2px solid #C9CFDA"}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",14,3) if on else ""}</span>'
cuerpo = f'''  <header style="position: absolute; top: 0; left: 0; right: 0; z-index: 2; height: 70px; padding: 10px 14px 0; box-sizing: border-box; display: flex; align-items: center; gap: 10px; background: {AZUL}; color: #FFFFFF">
    <a href="F-ChatGrupo.dc.html" aria-label="Salir de la selección" style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',20)}</a><strong style="flex: 1; font-size: 17px">3 seleccionados</strong>
    {''.join(f'<span role="button" aria-label="{t}" style="width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC[i],"#FFFFFF",20)}</span>' for i,t in [('copiar','Copiar'),('reenviar','Reenviar'),('tacho','Borrar')])}
  </header>
''' + contenido_chat(''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 8px 10px; border-radius: 20px; {"background: "+TINTE if on else ""}">{sel(on)}<div style="flex: 1; min-width: 0; display: flex; flex-direction: column">{m}</div></div>' for on,m in [(True,msg('sofia','Mañana arranco 8:30 con la pared del lavatorio.','16:02')),(False,msg('martin','¡Quedó bárbaro! ¿Hace falta comprar algo más?','16:05')),(True,msg('yo','Sí: pegamento × 4. Te lo mando para aprobar.','16:12',True)),(True,msg('martin','Lo veo a la noche y te confirmo.','16:20'))]), top=84, bottom=20)
guardar('F-ChatSeleccion.dc.html','Mensajes · Seleccionar mensajes',cuerpo)

def media(c, n=None, dur=None):
    num=f'<span style="position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: {AZUL}; color: #FFFFFF; border: 2px solid #FFFFFF; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center">{n}</span>' if n else f'<span style="position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #FFFFFF; background: rgba(14,29,54,0.25)"></span>'
    d=f'<span style="position: absolute; left: 6px; bottom: 6px; display: inline-flex; align-items: center; gap: 3px; padding: 1px 6px; border-radius: 6px; background: rgba(14,29,54,0.7); color: #FFFFFF; font-size: 11px; font-weight: 800">{svg(IC["play"],"#FFFFFF",10)}{dur}</span>' if dur else ''
    return f'<span style="position: relative; aspect-ratio: 1; border-radius: 10px; background: {c}; {"box-shadow: inset 0 0 0 3px "+AZUL if n else ""}">{num}{d}</span>'
cuerpo = barra_compacta('Fotos y videos','F-ChatGrupo.dc.html',sub='Para «Baño completo»') + contenido(f'''
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Recientes",True)}{op("Videos")}{op("Archivos")}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 4px"><span role="button" aria-label="Sacar una foto o grabar un video" style="aspect-ratio: 1; border-radius: 10px; background: {AZUL}; box-shadow: 0 3px 0 {HONDO}; color: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center">{svg(IC['camara'],AMARILLO,28)}<span style="font-size: 12px; font-weight: 800; line-height: 1.15">Sacar foto<br>o grabar</span></span>{media('#DCE3EE',1)}{media('#E9E2D3',None,'0:24')}{media('#E3EADF',2,'0:12')}{media('#D6DCE6')}{media('#EDE6D8')}{media('#DCE3EE')}{media('#E3EADF')}{media('#E9E2D3',None,'1:05')}</div>
    <span style="min-height: 52px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; padding: 0 14px; font-size: 14px; color: {TEXTO}">Pared del lavatorio, antes de la pastina</span>
    <span style="font-size: 12px; color: {SUAVE}">Las fotos y videos se achican y pierden la ubicación antes de mandarse. Videos de hasta 1 minuto.</span>''') + '\n' + accion_fija(svg(IC['enviar'],'#FFFFFF',20)+'Mandar 2','F-ChatGrupo.dc.html')
guardar('F-ChatMedia.dc.html','Mensajes · Fotos y videos',cuerpo)

def miembro(k, rol, extra=''):
    return f'<div style="display: flex; gap: 12px; align-items: center; min-height: 56px; border-top: 1px solid {BORDE}">{avatar(k,40)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 15px">{nombre(k)}{" (vos)" if k=="yo" else ""}</strong><span style="font-size: 12px; color: {SUAVE}">{rol}</span></span>{extra}</div>'
cuerpo = barra_compacta('Grupo de la obra','F-ChatGrupo.dc.html') + contenido(f'''
    <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center">{avatar_grupo(['martin','sofia','diego','yo'],72)}<strong style="{TIT}; font-size: 24px">Baño completo</strong><a href="F-Obra.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">Ver la obra</a></div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("4 PERSONAS")}<a href="F-Invitar.dc.html" style="display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">{svg(IC["mas"],AZUL,16)}Agregar personas</a></div>' + miembro('yo','Titular · Plomería',chip("Administra",tono="tinte")) + miembro('martin','Cliente') + miembro('sofia','Albañilería') + miembro('diego','Electricidad',chip("Se sumó hoy","check","exito")))}
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("FOTOS, VIDEOS Y ARCHIVOS")}<span style="font-size: 12px; color: {SUAVE}">18</span></div><div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 6px">{"".join(f"<span style=\"aspect-ratio: 1; border-radius: 10px; background: {c}\"></span>" for c in ["#DCE3EE","#E9E2D3","#E3EADF","#D6DCE6"])}</div>')}
    {tarjeta(fila_ic('silencio','Silenciar','Hasta mañana a las 8',borde=False)+fila_ic('salir','Salir del grupo','Solo si ya no trabajás en la obra'))}''')
guardar('F-ChatGrupoInfo.dc.html','Mensajes · Grupo de la obra',cuerpo,980)

# ── Repuestos: lo consigo yo o en una ferretería adherida ──────────────
def opcion(ic, t, sub, puntos, href, prim=False):
    li=''.join(f'<span style="display: flex; gap: 6px; font-size: 12px">{svg(IC["check"],AMARILLO if prim else AZUL,14,3)}{p}</span>' for p in puntos)
    return f'<a href="{href}" style="padding: 16px; border-radius: 24px; background: {AZUL if prim else "#FFFFFF"}; color: {"#FFFFFF" if prim else TINTA}; border: {"0" if prim else "1px solid "+BORDE}; box-shadow: {"0 4px 0 "+HONDO if prim else ELEV1}; text-decoration: none; display: flex; flex-direction: column; gap: 8px">{svg(IC[ic],AMARILLO if prim else AZUL,28)}<strong style="{TIT}; font-size: 20px">{t}</strong><span style="font-size: 13px">{sub}</span>{li}</a>'
cuerpo = velo() + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">¿Cómo conseguís el repuesto?</strong><a href="F-ObraRepuestos.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    {opcion('tienda','En una ferretería adherida','Comparás precios de las ferreterías de la zona y lo retirás con QR.',['Precio de cada ferretería','Stock y horario a la vista','El ticket queda como gasto'],'R-Comparar.dc.html',True)}
    {opcion('carrito','Lo consigo yo','Lo comprás donde quieras y cargás el precio que pagaste.',['Precio de tu lista o a mano','Foto del ticket al comprarlo'],'F-ObraRepuesto.dc.html')}''', 210)
guardar('F-RepuestoOrigen.dc.html','Obras · Cómo conseguir el repuesto',cuerpo)

def ferr(t, sub, unit, total, chips, on=False):
    return f'<div style="padding: 14px; border-radius: 22px; background: {TINTE if on else "#FFFFFF"}; border: {"2px solid "+AZUL if on else "1px solid "+BORDE}; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; gap: 10px"><span style="display: flex; flex-direction: column; min-width: 0"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span style="display: flex; flex-direction: column; align-items: flex-end"><strong style="{TIT}; font-size: 20px; white-space: nowrap">{total}</strong><span style="font-size: 11px; color: {SUAVE}; white-space: nowrap">{unit}</span></span></div><span style="display: flex; gap: 6px; flex-wrap: wrap">{chips}</span></div>'
cuerpo = barra_compacta('En una ferretería adherida','F-RepuestoOrigen.dc.html',sub='Pegamento para porcelanato × 4') + contenido(f'''
    {chip("Datos de ejemplo · ferreterías ficticias","alerta","amarillo")}
    <div style="display: flex; gap: 8px">{op("Más barato",True)}{op("Más cerca")}{op("Abierto ahora")}</div>
    {ferr('Corralón Simulación Sur','3,4 km · abierto hasta las 19','$ 8.700 c/u','$ 34.800',chip("El más barato","billete","exito")+chip("Hay stock","check","gris"),True)}
    {ferr('Ferretería Simulación Centro','1,2 km · abierta hasta las 20','$ 9.000 c/u','$ 36.000',chip("La más cerca","pin","tinte")+chip("Hay stock","check","gris"))}
    {ferr('Pinturería Simulación','2,8 km · abierta hasta las 20:30','—','Sin stock',chip("Te avisa si entra","campana","gris"))}
    <span style="font-size: 12px; color: {SUAVE}">Cada ferretería pone sus precios y pueden cambiar hasta que confirma el pedido. A Martín le llega con el precio que elijas.</span>''') + '\n' + accion_fija('Elegir y mandar a aprobación','F-ObraRepuestos.dc.html')
guardar('R-Comparar.dc.html','R · Comparar ferreterías',cuerpo)

# ── Equipamiento: detalle y «ya no la tengo» ─────────────────────────
cuerpo = barra_compacta('Amoladora 115 mm','H0-EquipoCategoria.dc.html',sub='Eléctricas') + contenido(f'''
    <div style="height: 150px; border-radius: 26px; background: {TINTE}; display: flex; align-items: center; justify-content: center; position: relative">{svg(IC['taladro'],AZUL,84,1.6)}<span style="position: absolute; left: 12px; bottom: 12px; display: flex; gap: 6px">{chip("En la camioneta","camion","blanco")}{chip("Funciona bien","check","exito")}</span></div>
    {tarjeta(fila_ic('documento','Marca y modelo','De ejemplo · 850 W',borde=False)+fila_ic('agenda','Comprada','Marzo de 2025 · con garantía hasta 03/2027'))}
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("MANTENIMIENTO")}{chip("En 25 días","reloj","amarillo")}</div>' + fila_ic('herramienta','Cambiar escobillas','Cada 6 meses · próxima 12/12',borde=False))}
    {tarjeta(etiqueta("HISTORIAL") + fila_ic('usuario2','Prestada a Sofía Ruiz','Del 02/11 al 05/11 · devuelta',borde=False) + fila_ic('obra','Usada en «Baño completo»','Jornada 1 · Demolición'))}''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px"><div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Prestar","H0-EquipoDetalle.dc.html","usuario2")}{boton2("Mover","H0-EquipoDetalle.dc.html","camion")}</div><a href="H0-EquipoBaja.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 16px; border: 2px solid #F3C4BF; color: #A8261C; font-size: 15px; font-weight: 800; text-decoration: none; text-align: center">Ya no la tengo</a></div>')
guardar('H0-EquipoDetalle.dc.html','H0 · Detalle de una herramienta',cuerpo,950)

cuerpo = velo() + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">¿Qué pasó con la amoladora?</strong><a href="H0-EquipoDetalle.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <div role="radiogroup" aria-label="Motivo" style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px">{''.join(f'<span role="radio" aria-checked="{str(on).lower()}" style="min-height: 48px; border-radius: 14px; border: 2px solid {AZUL if on else BORDE}; background: {TINTE if on else "#FFFFFF"}; color: {HONDO if on else TINTA}; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center">{t}</span>' for t,on in [('Se rompió',True),('La vendí',False),('La perdí',False),('Me la robaron',False),('La regalé',False),('Otro motivo',False)])}</div>
    <div>{interr("Buscar una nueva en la ferretería","Te mostramos precios de las adheridas",True)}{interr("Sumarla a la lista de compras","Para comprarla vos cuando puedas",False)}</div>
    <span style="font-size: 12px; color: {SUAVE}">Sale de tu equipamiento, pero queda en el historial de los trabajos donde la usaste.</span>
    {boton("Sacarla de mi equipamiento","H0-EquipoCategoria.dc.html")}''', 236)
guardar('H0-EquipoBaja.dc.html','H0 · Ya no la tengo',cuerpo)
print('ok')
