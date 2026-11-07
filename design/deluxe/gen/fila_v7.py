import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({'casa2':'<path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path>','arrastrar':'<path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"></path>','flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>','libro':'<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z"></path><path d="M20 4h-5a3 3 0 0 0-3 3"></path><path d="M20 4v14h-6"></path>','carrito':'<path d="M3 4h2l2.5 11h11l2-8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>','documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>','llave2':'<circle cx="8" cy="15" r="4"></circle><path d="M11 12l9-9M17 6l2 2M15 8l2 2"></path>','salir':'<path d="M10 4H5v16h5"></path><path d="M14 8l4 4-4 4M18 12H9"></path>','micro':'<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>'})
def modal(html, bottom=100):
    return f'<section style="position: absolute; left: 12px; right: 12px; bottom: {bottom}px; padding: 16px; border-radius: 30px; background: #FFFFFF; box-shadow: 0 2px 6px rgba(14,29,54,0.10), 0 30px 60px -18px rgba(14,29,54,0.55); display: flex; flex-direction: column; gap: 12px">{html}</section>'
def op(t, on=False, href=None):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    tag='a' if href else 'span'; h=f' href="{href}"' if href else ''
    return f'<{tag}{h} style="min-height: 44px; padding: 0 12px; border-radius: 14px; {s}; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; white-space: nowrap">{t}</{tag}>'
def icbtn(ic, label, href, fondo=MOSAICO, color=TINTA):
    return f'<a href="{href}" aria-label="{label}" style="width: 52px; height: 52px; flex: none; border-radius: 18px; background: {fondo}; display: flex; align-items: center; justify-content: center">{svg(IC[ic],color,22)}</a>'
def segmento(opts, sel):
    return '<div role="tablist" style="display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: '+MOSAICO+'">'+''.join(f'<a href="{h}" role="tab" aria-selected="{str(i==sel).lower()}" style="flex: 1; min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 14px; font-weight: 800; text-decoration: none; {"background: #FFFFFF; box-shadow: "+ELEV1+"; color: "+TINTA if i==sel else "color: "+SUAVE}">{t}</a>' for i,(t,h) in enumerate(opts))+'</div>'

# ── Tu día: paso a paso horizontal y la próxima parada protagonista ─────
ruta=[(95,410),(140,340),(205,310),(240,230),(270,200)]
paradas=''.join(f'<span style="position: absolute; left: {x-16}px; top: {y-16}px; width: 32px; height: 32px; border-radius: 50%; background: {c}; color: {t}; border: 3px solid #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px">{n}</span>' for x,y,n,c,t in [(205,310,'✓','#1E9E57','#FFFFFF'),(270,200,2,AZUL,'#FFFFFF'),(60,280,3,AMARILLO,TINTA)])
def paso(n, h, t, est):
    c={'ok':('#1E9E57','#FFFFFF','✓'),'ahora':(AZUL,'#FFFFFF',n),'luego':('#FFFFFF',TINTA,n)}[est]
    return f'<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; z-index: 1"><span style="width: {40 if est=="ahora" else 32}px; height: {40 if est=="ahora" else 32}px; border-radius: 50%; background: {c[0]}; color: {c[1]}; border: 2px solid {"#C9CFDA" if est=="luego" else c[0]}; {"box-shadow: 0 0 0 6px rgba(31,87,168,0.15);" if est=="ahora" else ""} display: flex; align-items: center; justify-content: center; font-weight: 900">{c[2]}</span><strong style="font-size: 12px">{h}</strong><span style="font-size: 11px; color: {SUAVE}; text-align: center">{t}</span></span>'
pasos=f'''<div style="position: relative; display: flex; align-items: flex-start"><span aria-hidden="true" style="position: absolute; left: 16%; right: 16%; top: 18px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #1E9E57 0 50%, #C9CFDA 50% 100%)"></span>{paso('1','9:00','Baño completo','ok')}{paso('2','18:00','La canilla','ahora')}{paso('3','20:30','Ferretería','luego')}</div>'''
dia=f'''<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("TU DÍA · 3 PARADAS", AZUL)}<a href="F-InicioRuta.dc.html" style="display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">Ver recorrido{svg(IC['flecha'],AZUL,16)}</a></div>
    {pasos}
    <div style="padding: 14px; border-radius: 22px; background: {TINTE}; display: flex; flex-direction: column; gap: 10px">
      <div style="display: flex; gap: 12px; align-items: center">{avatar('lucia',48)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="{TIT}; font-size: 19px; line-height: 1.1">Pierde la canilla</strong><span style="font-size: 13px; color: {HONDO}">Lucía Ferreyra · Centro · $ 47.000</span></span><span style="display: flex; flex-direction: column; align-items: flex-end"><strong style="{TIT}; font-size: 22px; line-height: 1">12 min</strong><span style="font-size: 11px; color: {HONDO}">en auto</span></span></div>
      <div style="display: flex; gap: 8px">{icbtn('chat','Escribirle','F-Chat.dc.html','#FFFFFF',AZUL)}{icbtn('reloj','Avisar demora','H0-ModoAgenda.dc.html','#FFFFFF',AZUL)}<a href="TR-EnCamino.dc.html" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 52px; border-radius: 18px; background: {AZUL}; color: #FFFFFF; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 {HONDO}">{svg(IC['camion'],'#FFFFFF',20)}Salir ahora</a></div>
    </div>'''
resumen=f'<div style="position: absolute; top: 132px; left: 12px; display: flex; gap: 8px">' + ''.join(f'<span style="display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 999px; background: #FFFFFF; box-shadow: {ELEV2}; font-size: 13px; font-weight: 800; white-space: nowrap">{svg(IC[i],AZUL,16)}{t}</span>' for i,t in [('camion','14 km'),('billete','$ 47.000 hoy'),('estrella','8 de 10')]) + '</div>'
cuerpo = mapa(ruta=ruta, punto=(95,410), extra=paradas) + '\n' + cabecera_estado([('billete','HOY','$ 47.000','F-Ingresos.dc.html'),('camion','RECORRIDO','14 km','F-InicioRuta.dc.html'),('estrella','CAMINO','8 de 10','G-Inicio.dc.html')], sub='Tenés 3 paradas hoy') + '\n' + modal(dia) + '\n' + barra_vidrio('Inicio')
guardar('F-InicioDia.dc.html','Núcleo · Inicio con tu día',cuerpo)

def tl(h, t, sub, est, href, ultimo=False):
    c={'ok':'#1E9E57','ahora':AZUL,'luego':'#C9CFDA'}[est]
    ch={'ok':chip("Hecho","check","exito"),'ahora':chip("Sale en 10 min","reloj","amarillo"),'luego':chip("Opcional",tono="gris")}[est]
    linea='' if ultimo else f'<span aria-hidden="true" style="position: absolute; left: 61px; top: 38px; bottom: -6px; width: 3px; background: {c}"></span>'
    return f'<a href="{href}" style="position: relative; display: flex; gap: 12px; align-items: flex-start; padding: 6px 0 14px; color: {TINTA}; text-decoration: none">{linea}<strong style="width: 44px; flex: none; {TIT}; font-size: 15px; padding-top: 8px">{h}</strong><span style="width: 34px; height: 34px; flex: none; border-radius: 50%; background: {c if est!="luego" else "#FFFFFF"}; border: 3px solid {c}; display: flex; align-items: center; justify-content: center; position: relative; z-index: 1">{svg(IC["check"],"#FFFFFF",16,3) if est=="ok" else ""}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 18px; background: {TINTE if est=="ahora" else "#F6F7F9"}"><span style="display: flex; justify-content: space-between; gap: 6px"><strong style="font-size: 14px">{t}</strong>{svg(IC["arrastrar"],SUAVE,18)}</span><span style="font-size: 12px; color: {SUAVE}">{sub}</span><span>{ch}</span></span></a>'
def tramo(t):
    return f'<div style="display: flex; gap: 12px; align-items: center; margin: -8px 0 6px; padding-left: 56px; font-size: 12px; font-weight: 700; color: {SUAVE}">{svg(IC["camion"],SUAVE,16)}{t}</div>'
cuerpo = mapa(ruta=[(x,y-40) for x,y in ruta], punto=(95,370), extra=paradas.replace('top: 294px','top: 254px').replace('top: 184px','top: 144px').replace('top: 264px','top: 224px')) + f'''
  <a href="F-InicioDia.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 14px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>
  <span style="position: absolute; top: 18px; right: 14px; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 999px; background: #FFFFFF; box-shadow: {ELEV2}; font-size: 13px; font-weight: 800">Terminás 21:00 · 14 km</span>
''' + modal(f'''
    <div style="display: flex; justify-content: space-between; align-items: baseline"><h1 style="margin: 0; {TIT}; font-size: 28px">Tu {marcador("recorrido")}</h1><span style="font-size: 12px; font-weight: 700; color: {SUAVE}">312 km en el mes</span></div>
    <div>{tl('9:00','Baño completo','Los Troncos · jornada 3 de 6','ok','F-ObraDia.dc.html')}{tramo('12 min · 4,1 km')}{tl('18:00','Pierde la canilla','Centro · Lucía Ferreyra · $ 47.000','ahora','F-Trabajo.dc.html')}{tramo('4 min de desvío')}{tl('20:30','Retiro en ferretería','Pastina para mañana','luego','R-Retiro.dc.html',True)}</div>
    {boton(svg(IC["camion"],"#FFFFFF",20)+"Salir para la parada 2","TR-EnCamino.dc.html")}''', bottom=14)
guardar('F-InicioRuta.dc.html','Núcleo · Tu recorrido',cuerpo)

# ── Agenda con Pasadas · Hoy · Futuras ─────────────────────────────────
def dia_tira(n, d, est=''):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if est=='sel' else f'background: {MOSAICO}; color: {TEXTO}'
    pt=f'<span style="width: 5px; height: 5px; border-radius: 50%; background: {NARANJA if est=="sel" else AZUL}"></span>' if est in ('sel','pt') else '<span style="height: 5px"></span>'
    return f'<span style="flex: 1; min-width: 0; padding: 8px 0; border-radius: 14px; {s}; display: flex; flex-direction: column; align-items: center; gap: 2px"><span style="font-size: 11px; font-weight: 800">{d}</span><strong style="{TIT}; font-size: 18px">{n}</strong>{pt}</span>'
def turno(h1, h2, t, sub, href, chip_html='', gente=''):
    g=f'<span style="margin-top: 2px">{gente}</span>' if gente else ''
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: stretch; color: {TINTA}; text-decoration: none"><span style="width: 64px; flex: none; border-radius: 18px; background: {MOSAICO}; display: flex; flex-direction: column; align-items: center; justify-content: center"><strong style="{TIT}; font-size: 17px">{h1}</strong><span style="font-size: 11px; color: {SUAVE}">a {h2}</span></span><span style="flex: 1; min-width: 0; padding: 12px 14px; border-radius: 18px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 4px"><span style="display: flex; justify-content: space-between; gap: 8px"><strong style="font-size: 15px">{t}</strong>{chip_html}</span><span style="font-size: 13px; color: {SUAVE}">{sub}</span>{g}</span></a>'
tira=''.join([dia_tira(16,'LUN'),dia_tira(17,'MAR','sel'),dia_tira(18,'MIÉ','pt'),dia_tira(19,'JUE','pt'),dia_tira(20,'VIE','pt'),dia_tira(21,'SÁB'),dia_tira(22,'DOM')])
cuerpo = contenido(f'''
    <div style="display: flex; justify-content: space-between; align-items: flex-end">{titulo_grande("NOVIEMBRE 2026","Tu ","agenda")}<a href="F-AgendaMes.dc.html" style="display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border-radius: 14px; background: {AZUL}; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; box-shadow: 0 3px 0 {HONDO}">{svg(IC['agenda'],'#FFFFFF',18)}Ver el mes</a></div>
    {segmento([("Pasadas · 12","F-AgendaPasadas.dc.html"),("Hoy · 2","F-Agenda.dc.html"),("Futuras · 6","F-Agenda.dc.html")],1)}
    <div style="display: flex; gap: 5px">{tira}</div>
    <div style="display: flex; justify-content: space-between; align-items: baseline"><strong style="font-size: 15px">Hoy, martes 17</strong><span style="font-size: 13px; color: {SUAVE}">2 turnos · $ 47.000</span></div>
    {turno("9:00","17:00","Baño completo","Obra · jornada 3 de 6 · Los Troncos","F-ObraDia.dc.html", chip("Obra","obra","tinte"), avatares(['yo','sofia']))}
    {turno("18:00","20:00","Pierde la canilla","Plomería · Centro · $ 47.000","F-Trabajo.dc.html", chip("Agendado","agenda","noche"), avatares(['lucia']))}''', top=26) + '\n' + barra_vidrio('Taller')
guardar('F-Agenda.dc.html','Núcleo · Agenda',cuerpo)

def pasado(t, sub, monto, est, href):
    c={'ver':chip("Cobrado · verificado","check","exito"),'inf':chip("Informado","reloj","amarillo"),'obra':chip("Jornada hecha","obra","tinte")}[est]
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span><span>{c}</span></span><strong style="{TIT}; font-size: 17px; white-space: nowrap">{monto}</strong></a>'
cuerpo = contenido(f'''
    <div style="display: flex; justify-content: space-between; align-items: flex-end">{titulo_grande("NOVIEMBRE 2026","Tu ","agenda")}<a href="F-AgendaMes.dc.html" style="display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border-radius: 14px; background: {AZUL}; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; box-shadow: 0 3px 0 {HONDO}">{svg(IC['agenda'],'#FFFFFF',18)}Ver el mes</a></div>
    {segmento([("Pasadas · 12","F-AgendaPasadas.dc.html"),("Hoy · 2","F-Agenda.dc.html"),("Futuras · 6","F-Agenda.dc.html")],0)}
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px"><div style="padding: 12px; border-radius: 18px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}"><span style="font-size: 11px; font-weight: 800; color: #F0F5FD">ESTE MES</span><strong style="display: block; {TIT}; font-size: 22px">12 trabajos</strong></div><div style="padding: 12px; border-radius: 18px; background: {MOSAICO}"><span style="font-size: 11px; font-weight: 800; color: {SUAVE}">COBRADO</span><strong style="display: block; {TIT}; font-size: 22px; white-space: nowrap">$ 320.000</strong></div></div>
    {tarjeta(etiqueta("AYER · LUNES 16")+pasado('Revisión de termotanque','Chauvín · Carla Ibáñez','$ 28.000','ver','H0-InformeEnviado.dc.html'))}
    {tarjeta(etiqueta("VIERNES 13")+pasado('Baño completo · jornada 2','Los Troncos · Martín Sosa','$ 180.000','ver','F-ObraDia.dc.html')+pasado('Cambio de flexible','Centro · cliente nuevo','$ 15.000','inf','H0-InformeEnviado.dc.html'))}''', top=26) + '\n' + barra_vidrio('Taller')
guardar('F-AgendaPasadas.dc.html','Núcleo · Agenda: pasadas',cuerpo)

# ── Cuenta completa (tablero alto: todo lo que hay al hacer scroll) ─────
ALTO_CUENTA=1890
def stat(v, t):
    return f'<div style="padding: 10px 12px; border-radius: 16px; background: {HONDO}; display: flex; flex-direction: column"><strong style="{TIT}; font-size: 20px">{v}</strong><span style="font-size: 11px; color: #F0F5FD; font-weight: 700">{t}</span></div>'
def tile(ic, t, v, sub, href, fondo, color, base):
    return f'<a href="{href}" style="padding: 14px; border-radius: 22px; background: {fondo}; color: {color}; text-decoration: none; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 4px 0 {base}; min-height: 128px; box-sizing: border-box">{svg(IC[ic],color,24)}<strong style="font-size: 14px; margin-top: 4px">{t}</strong><span style="{TIT}; font-size: 17px; line-height: 1.1">{v}</span><span style="font-size: 11px">{sub}</span></a>'
def grupo(t, filas):
    return tarjeta(etiqueta(t)+filas)
cuerpo = f'''  <section style="position: absolute; top: 0; left: 0; right: 0; padding: 22px 20px 20px; background: {AZUL}; border-radius: 0 0 34px 34px; color: #FFFFFF; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 12px 30px -16px rgba(14,29,54,0.55)">
    <div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("TU CUENTA","#F0F5FD")}<a href="CU-Perfil.dc.html" style="display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 12px; border-radius: 14px; background: rgba(255,255,255,0.18); color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none">{svg(IC['ojo'] if 'ojo' in IC else IC['cuenta'],'#FFFFFF',18)}Ver mi perfil</a></div>
    <div style="display: flex; gap: 14px; align-items: center"><span style="border-radius: 50%; box-shadow: 0 0 0 4px rgba(255,255,255,0.35)">{avatar('yo',72).replace('background: '+AZUL,'background: #FFFFFF').replace('color: #FFFFFF','color: '+AZUL)}</span><span style="display: flex; flex-direction: column; gap: 6px"><strong style="{TIT}; font-size: 26px; line-height: 1">Julián Ortiz</strong><span style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Verificado por Handyx","escudo","blanco")}{chip("Plomería · Gas","herramienta","azul").replace("background: "+AZUL,"background: rgba(255,255,255,0.18)")}</span></span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{stat("38","trabajos verificados")}{stat("2","obras en curso")}{stat("8/10","tu camino")}</div>
  </section>
  <div style="position: absolute; top: 312px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 14px">
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">
      {tile('billete','Tus ingresos','$ 239.500','Neto de noviembre','F-Ingresos.dc.html',NOCHE,'#FFFFFF','#0B1424')}
      <a href="G-Inicio.dc.html" style="padding: 14px; border-radius: 22px; background: {AMARILLO}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 4px 0 #C9C85A; min-height: 128px; box-sizing: border-box">{svg(IC['estrella'],TINTA,24)}<strong style="font-size: 14px; margin-top: 4px">Tu camino</strong><span style="font-size: 12px; font-weight: 700">Próxima recompensa:</span><span style="{TIT}; font-size: 17px; line-height: 1.1">Gorra</span><span style="font-size: 11px">Te faltan 2 trabajos</span></a>
      {tile('herramienta','Tu taller','10 herramientas','Para todos y Electricidad','T-Taller.dc.html',TINTE,HONDO,'#C9D6EC')}
      {tile('ticket','Presupuestos y precios','3 plantillas','42 precios en tu lista','H0-Precios.dc.html',TINTE,HONDO,'#C9D6EC')}
      {tile('caja','Tu equipamiento','37 herramientas','3 consumibles por reponer','H0-Equipo.dc.html',TINTE,HONDO,'#C9D6EC')}
      {tile('carrito','Ferretería','1 pedido listo','Para retirar hasta las 20','R-Estado.dc.html',TINTE,HONDO,'#C9D6EC')}
    </div>
    {grupo("TU TRABAJO", fila_ic('cuenta','Tu perfil','Cómo te ven los clientes',href='CU-Perfil.dc.html',borde=False)+fila_ic('pin','Disponibilidad y zonas','4 barrios · urgentes con tu permiso',href='CU-Disponibilidad.dc.html')+fila_ic('billete','Medios de cobro','Mercado Pago y efectivo',href='CU-Cobros.dc.html')+fila_ic('usuario2','Contactos y equipos','3 profesionales',href='F-ObraEquipo.dc.html'))}
    {grupo("TU CUENTA", fila_ic('escudo','Datos y verificación','DNI, CUIT y documentos',href='CU-Datos.dc.html',borde=False)+fila_ic('llave2','Seguridad','Contraseña y segunda verificación',href='D6-Seguridad.dc.html')+fila_ic('campana','Avisos','Qué te llega y cuándo',href='CU-Notificaciones.dc.html')+fila_ic('candado','Privacidad y baja','Tus datos',href='CU-Privacidad.dc.html'))}
    {grupo("AYUDA", fila_ic('ayuda','Centro de ayuda','Preguntas y soporte',href='D6-Ayuda.dc.html',borde=False)+fila_ic('libro','Manual de Handyx','6 capítulos cortos',href='G-Manual.dc.html')+fila_ic('salir','Cerrar sesión','En este teléfono',href='D6-Login.dc.html'))}
    <span style="text-align: center; font-size: 12px; color: {SUAVE}">Handyx para especialistas · versión 1.0 · Términos y privacidad</span>
  </div>
''' + barra_vidrio('Cuenta')
guardar('F-Cuenta.dc.html','Cuenta · Tu cuenta',cuerpo,ALTO_CUENTA)

# ── Obra: cabecera protagonista y días en línea de tiempo (tablero alto) ─
def dia_obra(dsem, num, titulo, sub, est, extra='', href='F-ObraDia.dc.html', ultimo=False):
    col={'hecha':'#1E9E57','hoy':NARANJA,'cambio':AZUL,'':'#C9CFDA'}[est]
    m={'hecha':f'background: {AZUL}; color: #FFFFFF','hoy':f'background: #FFFFFF; box-shadow: inset 0 0 0 3px {NARANJA}','cambio':f'background: {TINTE}; color: {HONDO}','':f'background: {MOSAICO}; color: {TEXTO}'}[est]
    c={'hecha':chip("Hecha","check","exito"),'hoy':chip("Hoy","reloj","amarillo"),'cambio':chip("Cambio pedido","agenda","tinte"),'':''}[est]
    x=f'<span style="font-size: 12px; font-weight: 800; color: {"#A8261C" if "alta" in extra.lower() else HONDO}">{extra}</span>' if extra else ''
    linea='' if ultimo else f'<span aria-hidden="true" style="position: absolute; left: 25px; top: 58px; bottom: -10px; width: 3px; border-radius: 2px; background: {col}"></span>'
    return f'<a href="{href}" style="position: relative; display: flex; gap: 12px; align-items: flex-start; padding-bottom: 12px; color: {TINTA}; text-decoration: none">{linea}<span style="width: 52px; height: 56px; flex: none; border-radius: 16px; {m}; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; z-index: 1"><span style="font-size: 11px; font-weight: 800">{dsem}</span><strong style="{TIT}; font-size: 18px">{num}</strong></span><span style="flex: 1; min-width: 0; padding: 10px 12px; border-radius: 18px; background: {TINTE if est=="hoy" else "#FFFFFF"}; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 3px"><span style="display: flex; justify-content: space-between; gap: 6px"><strong style="font-size: 14px">{titulo}</strong>{c}</span><span style="font-size: 12px; color: {SUAVE}">{sub}</span>{x}</span></a>'
dias=''.join([
 dia_obra('JUE','12','Jornada 1 · Demolición','Julián y Sofía · 4 fotos','hecha'),
 dia_obra('VIE','13','Jornada 2 · Cañerías','Julián · prueba sin pérdidas','hecha'),
 dia_obra('MAR','17','Jornada 3 · Revestimiento','9 a 17 · Julián y Sofía','hoy'),
 dia_obra('MIÉ','18','Jornada 4 · Revestimiento','8:30 a 16 · Sofía','',extra='Falta comprar: pegamento y pastina'),
 dia_obra('JUE','19','Jornada 5 · Sanitarios','Pediste moverla al lunes 23','cambio',extra='Espera la respuesta de Martín'),
 dia_obra('VIE','20','Jornada 6 · Terminación','Julián y Diego','',extra='1 repuesto sin aprobar',ultimo=True),
])
def hstat(t, v, sub):
    return f'<div style="padding: 10px; border-radius: 16px; background: {HONDO}; display: flex; flex-direction: column; min-width: 0"><span style="font-size: 11px; font-weight: 800; color: #F0F5FD">{t}</span><strong style="{TIT}; font-size: 17px; white-space: nowrap">{v}</strong><span style="font-size: 11px; color: #F0F5FD">{sub}</span></div>'
hero=f'''<section style="padding: 16px; border-radius: 28px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; display: flex; flex-direction: column; gap: 14px">
      <div style="display: flex; gap: 14px; align-items: center"><span style="width: 74px; height: 74px; flex: none; border-radius: 50%; background: conic-gradient({AMARILLO} 0 50%, rgba(255,255,255,0.22) 50% 100%); display: flex; align-items: center; justify-content: center"><span style="width: 58px; height: 58px; border-radius: 50%; background: {AZUL}; display: flex; flex-direction: column; align-items: center; justify-content: center"><strong style="{TIT}; font-size: 20px; line-height: 1">2/4</strong><span style="font-size: 11px">etapas</span></span></span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><strong style="{TIT}; font-size: 26px; line-height: 1">Baño completo</strong><span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: #F0F5FD">{avatar('martin',24)}Martín Sosa · Los Troncos</span><span>{avatares(['yo','sofia','diego'],26)}</span></span></div>
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{hstat("EN OBRA","Día 3 de 6","desde el 12/11")}{hstat("GASTADO","$ 210.000","en materiales")}{hstat("FALTA COBRAR","$ 450.000","de $ 850.000")}</div>
    </section>'''
cuerpo = barra_compacta('Obra','F-Obras.dc.html',accion=f'<a href="F-ChatGrupo.dc.html" aria-label="Chat de la obra" style="position: relative; width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{svg(IC["chat"],TINTA,20)}<span style="position: absolute; top: 6px; right: 6px; width: 10px; height: 10px; border-radius: 50%; background: #D93025"></span></a>') + contenido(f'''
    {hero}
    <a href="F-ObraRepuestos.dc.html" style="display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 14px; border-radius: 16px; background: {AMARILLO}; color: {TINTA}; text-decoration: none; font-size: 13px; font-weight: 800">{svg(IC['alerta'],TINTA,18)}<span style="flex: 1">Mañana faltan 2 repuestos · 1 espera aprobación</span>{svg(IC['flecha'],TINTA,16)}</a>
    {tabs([("Días","F-Obra.dc.html"),("Repuestos","F-ObraRepuestos.dc.html"),("Equipo · 3","F-ObraEquipo.dc.html"),("Plata","F-Reparto.dc.html")],"Días")}
    <div>{dias}</div>''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px">{boton(svg(IC["camara"],"#FFFFFF",20)+"Cargar el avance","F-ObraDiaAvance.dc.html",alto=52)}{boton2("Repuesto","F-RepuestoOrigen.dc.html","mas")}</div>')
guardar('F-Obra.dc.html','Obras · Obra (resumen y días)',cuerpo,1100)

# ── Jornada: todo claro y cada cosa con su modal (tablero alto) ────────
def tarea(t, ok, quien):
    m=f'<span style="width: 30px; height: 30px; flex: none; border-radius: 9px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3)}</span>' if ok else f'<span style="width: 30px; height: 30px; flex: none; border-radius: 9px; border: 2px solid #C9CFDA"></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; min-height: 48px; border-top: 1px solid {BORDE}">{m}<span style="flex: 1; font-size: 14px; {"color: "+SUAVE+"; text-decoration: line-through" if ok else "font-weight: 700"}">{t}</span>{avatar(quien,28)}</div>'
def seccion(t, accion_txt, href, cuerpo_html):
    return f'<section style="padding: 14px 16px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 6px"><div style="display: flex; justify-content: space-between; align-items: center">{etiqueta(t)}<a href="{href}" style="display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">{svg(IC["mas"],AZUL,16)}{accion_txt}</a></div>{cuerpo_html}</section>'
fotos=''.join(f'<span style="aspect-ratio: 1; border-radius: 14px; background: {c}; display: flex; align-items: center; justify-content: center">{svg(IC["camara"],SUAVE,20)}</span>' for c in ['#DCE3EE','#E9E2D3','#E3EADF'])
hero_dia=f'''<section style="padding: 16px; border-radius: 28px; background: {NOCHE}; color: #FFFFFF; display: flex; flex-direction: column; gap: 12px">
      <div style="display: flex; justify-content: space-between; align-items: flex-start"><span style="display: flex; flex-direction: column; gap: 2px">{etiqueta("JORNADA 3 DE 6 · HOY", AMARILLO)}<strong style="{TIT}; font-size: 28px; line-height: 1">Martes 17</strong><span style="font-size: 13px; color: #C9D5EA">Revestimiento · etapa 3</span></span><a href="F-ObraDiaHorario.dc.html" style="display: flex; flex-direction: column; align-items: flex-end; padding: 8px 12px; border-radius: 16px; background: rgba(255,255,255,0.12); color: #FFFFFF; text-decoration: none"><strong style="{TIT}; font-size: 20px; white-space: nowrap">9 a 17</strong><span style="font-size: 11px; color: {AMARILLO}; font-weight: 800">Cambiar horario</span></a></div>
      <div style="display: flex; flex-direction: column; gap: 6px"><span style="display: flex; justify-content: space-between; font-size: 12px; color: #C9D5EA"><span>Tareas de hoy</span><span>1 de 3</span></span><span style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.18)"><span style="display: block; width: 33%; height: 8px; border-radius: 4px; background: {AMARILLO}"></span></span></div>
    </section>'''
cuerpo = barra_compacta('Jornada','F-Obra.dc.html',sub='Baño completo · Martín Sosa') + contenido(f'''
    {hero_dia}
    {seccion("QUIÉN VIENE","Sumar","F-Invitar.dc.html", f'<div style="display: flex; gap: 10px; align-items: center">{avatar("yo",40)}{avatar("sofia",40)}<span style="font-size: 13px; color: {SUAVE}">Julián y Sofía · Diego viene el viernes</span></div>')}
    {seccion("TAREAS","Agregar tarea","F-ObraDiaTarea.dc.html", tarea("Pared de la ducha",True,'sofia')+tarea("Pared del lavatorio",False,'sofia')+tarea("Cortes alrededor de la grifería",False,'yo'))}
    {seccion("AVANCE DEL DÍA · LO VE MARTÍN","Cargar","F-ObraDiaAvance.dc.html", f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{fotos}</div><span style="font-size: 14px; color: {TEXTO}">«Ducha terminada. Mañana sigue la pared del lavatorio.»</span>')}
    {seccion("MATERIALES DE HOY","Agregar","F-RepuestoOrigen.dc.html", fila_ic('caja','Porcelanato 60 × 60','12 m² · comprado el 14/11',borde=False)+fila_ic('caja','Pegamento × 2','De tu stock'))}''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px">{boton(svg(IC["camara"],"#FFFFFF",20)+"Cargar el avance","F-ObraDiaAvance.dc.html",alto=52)}{boton2("Cambiar fecha","F-ObraFecha.dc.html","agenda")}</div>')
guardar('F-ObraDia.dc.html','Obras · Jornada',cuerpo,1230)

# Modal: horario de la jornada
def rueda(valores, sel, nombre):
    items=''.join(f'<span role="option" aria-selected="{str(i==sel).lower()}" style="height: 38px; display: flex; align-items: center; justify-content: center; {TIT}; font-size: {26 if i==sel else 18}px; color: {TINTA if i==sel else "#56627A"}">{v}</span>' for i,v in enumerate(valores))
    return f'<div role="listbox" aria-label="{nombre}" style="position: relative; flex: 1"><span aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 76px; height: 38px; border-radius: 12px; background: {TINTE}"></span><div style="position: relative">{items}</div></div>'
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Horario de la jornada 3</strong><a href="F-ObraDia.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) 24px minmax(0,1fr); align-items: center; gap: 6px">
      <div style="display: flex; gap: 4px">{rueda(['06','07','08','09','10'],1,'Desde, hora')}{rueda(['00','15','30','45','00'],2,'Desde, minutos')}</div><span style="text-align: center; font-weight: 900; color: {SUAVE}">a</span><div style="display: flex; gap: 4px">{rueda(['14','15','16','17','18'],2,'Hasta, hora')}{rueda(['00','15','30','45','00'],0,'Hasta, minutos')}</div>
    </div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{op("7:30 a 16",True)}{op("8 a 17")}{op("Solo mañana")}{op("Solo tarde")}</div>
    <div role="radiogroup" aria-label="A qué jornadas" style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px"><span role="radio" aria-checked="true" style="min-height: 48px; padding: 0 10px; border-radius: 14px; border: 2px solid {AZUL}; background: {TINTE}; color: {HONDO}; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; text-align: center">Solo esta jornada</span><span role="radio" aria-checked="false" style="min-height: 48px; padding: 0 10px; border-radius: 14px; border: 2px solid {BORDE}; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; text-align: center">Esta y las que siguen</span></div>
    <span style="font-size: 12px; color: {SUAVE}">Se le pide a Martín y se avisa a Sofía. Hasta que acepte, sigue de 9 a 17.</span>
    {boton("Pedir 7:30 a 16:00","F-ObraDia.dc.html")}''', 236)
guardar('F-ObraDiaHorario.dc.html','Obras · Horario de la jornada',cuerpo)

# Modal: agregar tarea
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Nueva tarea · jornada 3</strong><a href="F-ObraDia.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <span style="min-height: 52px; border-radius: 16px; border: 2px solid {AZUL}; display: flex; align-items: center; gap: 8px; padding: 0 14px; font-weight: 700">Sellar el encuentro con la bañera<span style="margin-left: auto">{svg(IC['micro'],AZUL,20)}</span></span>
    <div style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 14px">¿Quién la hace?</strong><div style="display: flex; gap: 10px">{''.join(f'<span style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 800"><span style="border-radius: 50%; {"box-shadow: 0 0 0 3px "+AZUL if k=="sofia" else ""}">{avatar(k,46)}</span>{nombre(k).split()[0]}</span>' for k in ['yo','sofia','diego'])}</div></div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Seguridad")}{op("Necesita material")}{op("Con foto al terminar",True)}</div>
    {boton("Agregar tarea","F-ObraDia.dc.html")}''', 330)
guardar('F-ObraDiaTarea.dc.html','Obras · Agregar tarea',cuerpo)

# Modal: cargar el avance del día
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Avance de hoy · jornada 3</strong><a href="F-ObraDia.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px">{''.join(f'<span style="aspect-ratio: 1; border-radius: 14px; background: {c}; display: flex; align-items: center; justify-content: center">{svg(IC["camara"],SUAVE,20)}</span>' for c in ['#DCE3EE','#E9E2D3','#E3EADF'])}<span style="aspect-ratio: 1; border-radius: 14px; border: 2px dashed {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["mas"],AZUL,22)}</span></div>
    <div style="padding: 12px 14px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; gap: 10px; align-items: flex-start"><span style="flex: 1; font-size: 14px">Ducha terminada. Mañana sigue la pared del lavatorio.</span>{svg(IC['micro'],AZUL,20)}</div>
    <div style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 14px">Tareas que terminaste</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Pared de la ducha",True)}{op("Pared del lavatorio")}{op("Cortes")}</div></div>
    <span style="font-size: 12px; color: {SUAVE}">Lo ve Martín en el chat de la obra. Las fotos se achican y pierden la ubicación.</span>
    {boton("Guardar el avance","F-ObraDia.dc.html")}''', 250)
guardar('F-ObraDiaAvance.dc.html','Obras · Cargar el avance',cuerpo)
print('ok')
