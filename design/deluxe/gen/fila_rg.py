import sys; sys.path.insert(0,'gen')
from piezas2 import *

SIM = chip("Simulación: ferreterías ficticias","alerta","amarillo")

# R · Pedir repuestos.
def item(t, sub, n, on=True):
    c=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 8px; background: {AZUL if on else "#FFFFFF"}; border: 2px solid {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3) if on else ""}</span>'
    st=f'<span style="display: flex; align-items: center; gap: 6px"><span style="width: 32px; height: 32px; border-radius: 10px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span><strong style="min-width: 18px; text-align: center">{n}</strong><span style="width: 32px; height: 32px; border-radius: 10px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-weight: 900">+</span></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{c}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{st}</div>'
cuerpo = barra_compacta('Pedir repuestos','F-Trabajo.dc.html') + contenido(f'''
    {SIM}
    {titulo_grande("DESDE TU PRESUPUESTO","¿Qué ","necesitás","?")}
    {tarjeta(item('Cartucho cerámico 35 mm','Del presupuesto',1)+item('Flexible 40 cm','Del presupuesto',2)+item('Teflón','De tu lista de compras',3)+item('Sellador de roscas','Sugerido para este trabajo',1,False))}
    {tarjeta(fila_ic('pin','Retirar cerca','Elegís la ferretería en el paso siguiente',borde=False)+fila_ic('obra','Para «Pierde la canilla»','Si el cliente acepta, va como adicional'))}''') + '\n' + accion_fija('Ver ferreterías','R-Ferreterias.dc.html')
guardar('R-Pedir.dc.html','R · Pedir repuestos',cuerpo)

# R · Ferreterías (mapa ficticio).
pins=''.join(f'<span style="position: absolute; left: {x-18}px; top: {y-18}px; width: 36px; height: 36px; border-radius: 12px; background: {c}; border: 3px solid #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center">{svg(IC["herramienta"],t,18)}</span>' for x,y,c,t in [(190,190,AZUL,'#FFFFFF'),(260,300,"#FFFFFF",TINTA),(80,140,"#FFFFFF",TINTA)])
def ferr(n, t, sub, dist, on=False):
    b=f'border: 2px solid {AZUL}; background: {TINTE};' if on else f'border: 1px solid {BORDE}; background: #FFFFFF;'
    return f'<a href="R-Estado.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: 18px; {b} color: {TINTA}; text-decoration: none">{mosaico_ic("herramienta",44,fondo=AZUL if on else MOSAICO,color="#FFFFFF" if on else TINTA,radio=14,iconsize=20)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span style="font-size: 13px; font-weight: 800">{dist}</span></a>'
cuerpo = mapa(alto=420, punto=(95,330), extra=pins) + f'''
  <a href="R-Pedir.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 14px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>
  <span style="position: absolute; top: 24px; right: 14px">{SIM}</span>
''' + hoja(f'''
    <h1 style="margin: 0; {TIT}; font-size: 26px">Elegí dónde {marcador("retirar")}</h1>
    {ferr(1,'Ferretería Simulación Centro','Abierta hasta las 20 · tiene los 4 ítems','1,2 km',True)}
    {ferr(2,'Corralón Simulación Sur','Abierto hasta las 19 · le falta el sellador','3,4 km')}
    {ferr(3,'Pinturería Simulación','Abierta hasta las 20:30 · 2 de 4 ítems','2,8 km')}''', 400) + '\n' + acciones_fijas(boton('Mandar pedido','R-Estado.dc.html'))
guardar('R-Ferreterias.dc.html','R · Ferreterías',cuerpo)

# R · Estado del pedido.
def est(t, sub, e):
    if e=='hecho': m=f'<span style="width: 26px; height: 26px; flex: none; border-radius: 50%; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",14,3)}</span>'
    elif e=='ahora': m=f'<span style="width: 26px; height: 26px; flex: none; border-radius: 50%; background: {AMARILLO}; box-shadow: inset 0 0 0 2px {TINTA}"></span>'
    else: m=f'<span style="width: 26px; height: 26px; flex: none; border-radius: 50%; background: {MOSAICO}"></span>'
    return f'<li style="display: flex; gap: 12px">{m}<span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span></li>'
cuerpo = barra_compacta('Tu pedido','R-Ferreterias.dc.html',sub='Ferretería Simulación Centro') + contenido(f'''
    {SIM}
    {tarjeta('<ol style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px">'+est('Enviado','17:44','hecho')+est('Confirmado con precios','17:51 · total $ 21.400','hecho')+est('Listo para retirar','Te avisamos cuando lo preparen','ahora')+est('Retirado','Con el código QR','falta')+'</ol>')}
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("PRECIOS CONFIRMADOS")}{chip("1 reemplazo","alerta","amarillo")}</div>' + fila_ic('caja','Cartucho cerámico 35 mm','$ 9.800',borde=False) + fila_ic('caja','Flexible 40 cm × 2','$ 3.200') + fila_ic('alerta','Teflón: no hay de 12 mm','Ofrecen 19 mm · $ 2.700 c/u',derecha=f'<span style="font-size: 13px; font-weight: 800; color: {AZUL}">Aceptar</span>'), franja('Ver el gasto en Tus ingresos','F-Ingresos.dc.html'))}''') + '\n' + accion_fija(svg(IC['qr'],'#FFFFFF',20)+'Ver código de retiro','R-Retiro.dc.html')
guardar('R-Estado.dc.html','R · Estado del pedido',cuerpo)

# R · Retiro con QR.
cuerpo = barra_compacta('Retiro','R-Estado.dc.html') + f'''
  <section style="position: absolute; top: 84px; left: 24px; right: 24px; border-radius: 28px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV2}; overflow: hidden">
    <div style="padding: 18px; background: {AZUL}; color: #FFFFFF; display: flex; flex-direction: column; gap: 4px">{etiqueta("LISTO PARA RETIRAR","#CFE0FA")}<strong style="{TIT}; font-size: 24px">Ferretería Simulación Centro</strong><span style="font-size: 13px">Abierta hasta las 20 · 1,2 km</span></div>
    <div style="padding: 22px; display: flex; flex-direction: column; align-items: center; gap: 12px">
      <div style="padding: 14px; border-radius: 20px; background: #FFFFFF; border: 2px solid {BORDE}">{qr(170)}</div>
      <strong style="{TIT}; font-size: 28px; letter-spacing: 4px">HX-4815</strong>
      <span style="font-size: 13px; color: {SUAVE}; text-align: center">Mostralo en el mostrador. 4 ítems · $ 21.400, lo pagás en la ferretería.</span>
      {SIM}
    </div>
  </section>
''' + accion_fija('Ya lo retiré','F-Trabajo.dc.html')
guardar('R-Retiro.dc.html','R · Retiro con QR',cuerpo)

# R · Panel de la ferretería (portal interno, vista de teléfono).
def ped(t, sub, e, on=False):
    return f'<div style="padding: 12px 14px; border-radius: 18px; border: {"2px solid "+AZUL if on else "1px solid "+BORDE}; background: {TINTE if on else "#FFFFFF"}; display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{e}</div>'
cuerpo = f'''  <header style="position: absolute; top: 0; left: 0; right: 0; padding: 18px 20px; background: {NOCHE}; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center"><span style="display: flex; flex-direction: column"><span style="{TIT}; font-size: 22px">Handyx · Ferreterías</span><span style="font-size: 12px; color: #AFC0DD">Ferretería Simulación Centro</span></span>{chip("Portal interno","escudo","amarillo")}</header>
''' + contenido(f'''
    <div style="display: flex; gap: 8px">{chip("Nuevos · 1",tono="azul")}{chip("Para preparar · 2",tono="gris")}{chip("Listos · 1",tono="gris")}</div>
    {ped('HX-4815 · 4 ítems','Pedido de un especialista · 17:44',chip("Nuevo","estrella","amarillo"),True)}
    {tarjeta(etiqueta("CONFIRMÁ PRECIOS Y STOCK") + fila_ic('caja','Cartucho cerámico 35 mm','Hay · $ 9.800',borde=False) + fila_ic('caja','Flexible 40 cm × 2','Hay · $ 1.600 c/u') + fila_ic('alerta','Teflón 12 mm × 3','No hay · ofrecer 19 mm a $ 2.700') + fila_ic('caja','Sellador de roscas','Hay · $ 3.100'))}
    {ped('HX-4802 · 2 ítems','Para retirar hoy',chip("Preparando","reloj","gris"))}''', top=96) + '\n' + acciones_fijas(boton('Confirmar precios','R-Estado.dc.html'), boton2('Marcar «listo para retirar»','R-Retiro.dc.html'))
guardar('R-Panel.dc.html','R · Panel de la ferretería',cuerpo)

# G · Camino Handyx (sendero por estaciones).
def estacion(x, y, n, t, e, href='G-Camino.dc.html'):
    if e=='hecha': f,c,b=AZUL,'#FFFFFF',f'box-shadow: 0 6px 0 {HONDO}'
    elif e=='proxima': f,c,b=AMARILLO,TINTA,f'box-shadow: 0 6px 0 #C9C85A, 0 0 0 8px rgba(245,245,154,0.4)'
    else: f,c,b=MOSAICO,SUAVE,f'box-shadow: 0 6px 0 #D2D2D2'
    ic = 'check' if e=='hecha' else ('regalo' if e=='proxima' else 'candado')
    return f'<a href="{href}" style="position: absolute; left: {x-38}px; top: {y-38}px; width: 76px; height: 76px; border-radius: 50%; background: {f}; {b}; display: flex; align-items: center; justify-content: center; text-decoration: none" aria-label="Estación {n}: {t}">{svg(IC[ic],c,30,2.5)}</a><span style="position: absolute; left: {x+46 if x<195 else x-196}px; top: {y-20}px; width: 150px; {"text-align: right;" if x>=195 else ""} display: flex; flex-direction: column"><strong style="font-size: 14px">{n} · {t}</strong><span style="font-size: 12px; color: {SUAVE}">{ {"hecha":"Ganado","proxima":"Te faltan 2","falta":"Más adelante"}[e] }</span></span>'
camino = (estacion(110,730,1,'Kit chico','hecha')+estacion(260,610,2,'Consumibles','hecha')+estacion(130,480,3,'Gorra Handyx','proxima','F-Regalo.dc.html')+estacion(250,350,4,'Herramienta','falta')+estacion(140,220,5,'Campera','falta'))
sendero = '<svg aria-hidden="true" style="position: absolute; inset: 0" width="390" height="844"><path d="M110 730 C 180 690, 240 660, 260 610 S 160 520, 130 480 S 230 390, 250 350 S 160 260, 140 220" fill="none" stroke="#DDE1E8" stroke-width="16" stroke-linecap="round" stroke-dasharray="2 22"></path></svg>'
cuerpo = sendero + f'''
  <section style="position: absolute; top: 24px; left: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px">
    {titulo_grande("8 TRABAJOS VERIFICADOS","Tu ","camino")}
    <div style="display: flex; gap: 8px; align-items: center">{mosaico_handy('llave',44)}<span style="font-size: 14px; color: {TEXTO}">Cada trabajo verificado suma. Nada se resta y no hay sorteos.</span></div>
  </section>
  {camino}
''' + barra_vidrio('Cuenta')
guardar('G-Camino.dc.html','G · Camino Handyx',cuerpo)

# G · Vitrina de premios.
def premio(t, sub, e, h):
    op='opacity: 0.45; filter: grayscale(1);' if e=='bloq' else ''
    ch={'ok':chip("Ganado","check","exito"),'canje':chip("Elegí cómo retirarlo","regalo","amarillo"),'bloq':chip(sub,"candado","gris")}[e]
    return f'<div style="padding: 12px; border-radius: 22px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 8px"><span style="height: 92px; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; {op}"><img src="{BLOB[h]}" alt="" aria-hidden="true" style="width: 60px; height: 70px; object-fit: contain"></span><strong style="font-size: 14px">{t}</strong>{ch}</div>'
cuerpo = barra_compacta('Tus premios','G-Camino.dc.html') + contenido(f'''
    {titulo_grande("VITRINA","Lo que ","ganaste")}
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">{premio('Kit chico','','ok','engranaje')}{premio('Kit de consumibles','','canje','cano')}{premio('Gorra Handyx','A 2 trabajos','bloq','llave')}{premio('Herramienta del oficio','A 17 trabajos','bloq','lamparita')}</div>
    <span style="font-size: 12px; color: {SUAVE}">Operations revisa cada premio antes de entregarlo. Las cantidades de la escalera son un borrador.</span>''')
guardar('G-Vitrina.dc.html','G · Vitrina de premios',cuerpo)

# G · Canje.
def op(t, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<button style="min-height: 46px; min-width: 52px; padding: 0 12px; border-radius: 14px; border: 0; {s}; font-weight: 800">{t}</button>'
def color(c, on=False):
    return f'<span role="radio" aria-checked="{str(on).lower()}" style="width: 46px; height: 46px; border-radius: 14px; background: {c}; box-shadow: {"0 0 0 3px #FFFFFF, 0 0 0 5px "+AZUL if on else "inset 0 0 0 1px "+BORDE}"></span>'
cuerpo = barra_compacta('Canjear','G-Vitrina.dc.html',sub='Gorra Handyx') + contenido(f'''
    <div style="height: 150px; border-radius: 26px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center"><img src="{BLOB['llave']}" alt="" aria-hidden="true" style="width: 100px; height: 110px; object-fit: contain"></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">Color</strong><div role="radiogroup" aria-label="Color" style="display: flex; gap: 10px">{color(AZUL,True)}{color(NOCHE)}{color('#FFFFFF')}</div></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">Talle</strong><div style="display: flex; gap: 8px">{op('Único',True)}</div></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">¿Cómo la recibís?</strong>{tarjeta(fila_ic('pin','Retiro en un punto Handyx','Centro · de lunes a viernes',derecha=chip("Elegido","check","exito"),borde=False)+fila_ic('herramienta','Retiro en una ferretería aliada','Cuando haya en tu zona')+fila_ic('camion','Envío a tu domicilio','La dirección se guarda cifrada'))}</div>''') + '\n' + accion_fija('Pedir mi gorra','G-Vitrina.dc.html')
guardar('G-Canje.dc.html','G · Canje',cuerpo)

# G · Insignias (sin premio físico).
def ins(t, sub, ic, ok=True):
    f,c=(AZUL,'#FFFFFF') if ok else (MOSAICO,SUAVE)
    return f'<div style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center"><span style="width: 76px; height: 76px; border-radius: 26px; background: {f}; {"box-shadow: 0 5px 0 "+HONDO if ok else ""}; display: flex; align-items: center; justify-content: center">{svg(IC[ic],c,32,2.2)}</span><strong style="font-size: 13px">{t}</strong><span style="font-size: 11px; color: {SUAVE}">{sub}</span></div>'
cuerpo = barra_compacta('Insignias','G-Camino.dc.html') + contenido(f'''
    {titulo_grande("POR USAR LA APP","Tus ","insignias",sub="Son de reconocimiento: no dan premios ni cambian los pedidos que recibís.")}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px 8px">{ins('Primer presupuesto','Enviado','ticket')}{ins('Perfil completo','Con foto','cuenta')}{ins('Informe prolijo','Con antes y después','camara')}{ins('Obra al día','Diario en 5 jornadas','obra',False)}{ins('Taller','3 herramientas usadas','herramienta',False)}{ins('Gastos al día','Un mes completo','billete',False)}</div>''')
guardar('G-Insignias.dc.html','G · Insignias',cuerpo)
print('ok')
