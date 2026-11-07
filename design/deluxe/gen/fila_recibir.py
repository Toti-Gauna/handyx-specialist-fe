import sys; sys.path.insert(0,'gen')
from piezas2 import *

# Inicio: solo la meta y cuánto sube con este pedido; el neto va a Tus ingresos.
cuerpo = mapa(zona=(215,245,55), punto=(95,327)) + '\n' + cabecera_azul() + '\n' + interruptor(True) + '\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px">
      <span style="display: flex; flex-direction: column; gap: 4px">
        {etiqueta("PEDIDO URGENTE · QUEDAN 18:42", AZUL)}
        <h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1">{marcador("Plomería")}</h1>
        <span style="font-size: 15px; color: {TEXTO}">Pierde la canilla de la cocina</span>
        <span>{chip("Centro · zona aproximada · 2,1 km","pin")}</span>
      </span>
      {mosaico_handy('cano',74)}
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
      <span style="display: flex; flex-direction: column"><span style="font-size: 12px; font-weight: 700; color: {SUAVE}">Handyx sugiere · vos decidís</span><span style="{TIT}; font-size: 28px">$ 45.000</span></span>
      {boton("Ver pedido", "F-Pedido.dc.html", alto=52)}
    </div>
    {camino_card()}''', 410) + '\n' + barra_vidrio('Inicio')
guardar('F-Inicio.dc.html','Núcleo · Inicio con mapa',cuerpo)

# Pedido entrante: el aviso abre el detalle; nunca acepta solo.
info=''.join([
 fila_ic('pin','Centro · zona aproximada','A 2,1 km. La dirección exacta llega cuando el cliente acepta.',borde=False),
 fila_ic('reloj','Hoy, de 14 a 18 h','Lo pidió el cliente. Podés proponer otro horario.'),
 fila_ic('lista','Lo que cuenta el cliente','«La canilla monocomando gotea todo el tiempo.»'),
])
cuerpo = isla('Nuevo pedido urgente') + '\n' + mapa(alto=300, zona=(215,170,60), punto=(95,250)) + '\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center">{chip("Urgente · quedan 18:42","reloj","amarillo")}{chip("+1 al camino si se verifica","estrella","tinte")}</div>
    <div style="display: flex; align-items: center; gap: 12px">{mosaico_handy('cano',64)}<span style="display: flex; flex-direction: column; gap: 2px"><h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1">{marcador("Plomería")}</h1><span style="font-size: 15px; color: {TEXTO}">Pierde la canilla de la cocina</span></span></div>
    <div>{info}</div>
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 18px; background: {TINTE}"><span style="font-size: 13px; font-weight: 700; color: {HONDO}">Handyx sugiere</span><span style="{TIT}; font-size: 24px">$ 45.000</span></div>''', 230) + '\n' + acciones_fijas(
 f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Otra fecha","F-Fecha.dc.html","agenda")}{boton("Cotizar","F-Precio.dc.html",alto=52)}</div>',
 f'<a href="F-Inicio.dc.html" style="text-align: center; font-size: 14px; font-weight: 800; color: {SUAVE}; text-decoration: none; min-height: 32px; display: flex; align-items: center; justify-content: center">Ahora no · no tiene ninguna consecuencia</a>')
guardar('F-Pedido.dc.html','Núcleo · Pedido entrante',cuerpo)

# Tu precio con una cinta métrica: se desliza y marca el sugerido.
marcas=[]
for i in range(0,41):
    x=i*14
    alto=34 if i%5==0 else 18
    marcas.append(f'<span style="position: absolute; left: {x}px; top: 0; width: 2px; height: {alto}px; background: {TINTA}"></span>')
    if i%5==0:
        v=37+i//5*2
        marcas.append(f'<span style="position: absolute; left: {x-12}px; top: 38px; width: 26px; text-align: center; font-size: 12px; font-weight: 800">{v}</span>')
cinta=f'''<div style="position: relative; height: 104px">
      <div role="slider" aria-label="Tu precio" aria-valuemin="0" aria-valuenow="47000" aria-valuetext="$ 47.000" tabindex="0" style="position: absolute; left: -16px; right: -16px; top: 20px; height: 64px; background: {AMARILLO}; box-shadow: inset 0 -4px 0 #D8D36A, {ELEV1}; overflow: hidden">
        <div style="position: absolute; top: 0; left: {195-14*25}px; width: 600px; height: 64px">{''.join(marcas)}</div>
        <span style="position: absolute; left: {195-14*25+14*20-28}px; top: 54px; padding: 1px 6px; border-radius: 6px; background: {AZUL}; color: #FFFFFF; font-size: 10px; font-weight: 800">sugerido</span>
      </div>
      <span aria-hidden="true" style="position: absolute; left: 50%; top: 4px; margin-left: -9px; width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 14px solid {AZUL}"></span>
      <span aria-hidden="true" style="position: absolute; left: 50%; top: 16px; margin-left: -1.5px; width: 3px; height: 72px; background: {AZUL}"></span>
    </div>'''
resumen=f'<div style="display: flex; align-items: center; gap: 12px">{mosaico_handy("cano",52)}<span style="display: flex; flex-direction: column"><strong style="{TIT}; font-size: 19px">Plomería · urgente</strong><span style="font-size: 13px; color: {SUAVE}">Pierde la canilla de la cocina · Centro</span></span></div>'
def opcion(t, on=False):
    est=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<button style="min-height: 44px; padding: 0 12px; border-radius: 14px; border: 0; {est}; font-weight: 800; font-size: 14px">{t}</button>'
def interr(t, sub, on):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span role="switch" aria-checked="{str(on).lower()}" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
cuerpo = barra_compacta('Tu precio','F-Pedido.dc.html',sub='Paso 1 de 2') + contenido(f'''
    {tarjeta(resumen)}
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px">
      {etiqueta("TU PRECIO")}
      <span style="{TIT}; font-size: 54px; line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums">$ 47.000</span>
      <span style="font-size: 13px; color: {SUAVE}">Deslizá la cinta o tocá un atajo · Handyx sugiere $ 45.000</span>
    </div>
    {cinta}
    <div style="display: flex; gap: 8px; justify-content: center">{opcion("Sugerido")}{opcion("+ $ 2.000",True)}{opcion("+ $ 5.000")}{opcion("Escribir")}</div>
    <div style="padding: 0 4px">{interr("Incluye materiales","El cliente ve que el precio los incluye",True)}{interr("Garantía de 30 días","Se muestra en tu propuesta",False)}</div>
    <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 12px 14px; border-radius: 18px; background: #E3F4EA"><span style="font-size: 14px; font-weight: 800; color: #137140">Recibís el 100 % · Handyx no te cobra comisión</span><strong style="{TIT}; font-size: 22px; color: #137140">$ 47.000</strong></div>''') + '\n' + accion_fija('Siguiente: la fecha','F-Fecha.dc.html')
guardar('F-Precio.dc.html','Núcleo · Tu precio',cuerpo)

# Proponer fecha en el calendario.
def franja_h(t, est='libre'):
    if est=='elegida': s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}'
    elif est=='ocupada': s=f'background: #F6F7F9; color: #9AA3B2; text-decoration: line-through'
    else: s=f'background: {MOSAICO}; color: {TEXTO}'
    return f'<button style="min-height: 46px; border-radius: 14px; border: 0; {s}; font-weight: 800; font-size: 14px">{t}</button>'
cuerpo = barra_compacta('¿Cuándo vas?','F-Precio.dc.html',sub='Paso 2 de 2') + contenido(f'''
    <div style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 18px; background: {TINTE}">{svg(IC['reloj'],HONDO,20)}<span style="font-size: 14px; color: {HONDO}"><strong>El cliente pidió:</strong> hoy, de 14 a 18 h</span></div>
    <div role="radiogroup" aria-label="Horario" style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px">
      <button role="radio" aria-checked="false" style="min-height: 48px; border-radius: 14px; border: 2px solid {BORDE}; background: #FFFFFF; font-weight: 800; color: {TEXTO}">Voy en ese horario</button>
      <button role="radio" aria-checked="true" style="min-height: 48px; border-radius: 14px; border: 2px solid {AZUL}; background: {TINTE}; font-weight: 800; color: {HONDO}">Propongo otro</button>
    </div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center"><strong style="{TIT}; font-size: 20px">Noviembre 2026</strong><span style="display: flex; gap: 6px">{mosaico_ic("atras",36,radio=12,iconsize=16)}{mosaico_ic("flecha",36,radio=12,iconsize=16)}</span></div>' + calendario(17, marcados=(18,19,20), ocupados=(18,19,20)) + f'<span style="display: flex; gap: 12px; font-size: 12px; color: {SUAVE}"><span>Recuadro naranja: hoy</span><span>Gris: días con jornada de obra</span></span>')}
    <div style="display: flex; flex-direction: column; gap: 8px">
      <strong style="font-size: 15px">Hoy, martes 17 · elegí la franja</strong>
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px">{franja_h("9 a 13","ocupada")}{franja_h("13 a 17","ocupada")}{franja_h("17 a 19")}{franja_h("18 a 20","elegida")}</div>
      <span style="font-size: 12px; color: {SUAVE}">Hasta las 17 estás en «Baño completo». Es una propuesta: el cliente la acepta o elige otra.</span>
    </div>''') + '\n' + accion_fija('Revisar la propuesta','F-Revisar.dc.html')
guardar('F-Fecha.dc.html','Núcleo · Proponer fecha',cuerpo)

# Revisar y enviar: hoja de confirmación con el resumen.
res=''.join([
 fila_ic('billete','$ 47.000','Incluye materiales · recibís el 100 %',borde=False),
 fila_ic('agenda','Hoy, de 18 a 20','Otro horario: el cliente había pedido de 14 a 18'),
 fila_ic('pin','Centro · zona aproximada','Pierde la canilla de la cocina'),
])
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    {etiqueta("REVISÁ ANTES DE ENVIAR")}
    <h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1">Tu {marcador("propuesta")}</h1>
    {tarjeta(res)}
    <p style="margin: 0; font-size: 13px; color: {SUAVE}">El cliente puede aceptarla, pedirte otro precio o elegir otro día. Hasta que acepte, no es un trabajo agendado.</p>''', 300) + '\n' + acciones_fijas(boton('Enviar propuesta de $ 47.000','F-Enviada.dc.html'), f'<a href="F-Precio.dc.html" style="text-align: center; font-size: 14px; font-weight: 800; text-decoration: none; min-height: 32px; display: flex; align-items: center; justify-content: center">Cambiar algo</a>')
guardar('F-Revisar.dc.html','Núcleo · Revisar y enviar',cuerpo)

# Propuesta enviada.
papel=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: 9px; height: 14px; border-radius: 2px; background: {c}; transform: rotate({r}deg)"></span>' for x,y,c,r in [(60,170,AMARILLO,20),(320,150,AZUL,-15),(90,330,AZUL,40),(300,310,AMARILLO,-30),(200,120,NARANJA,10)])
cuerpo = papel + f'''
  <div style="position: absolute; top: 150px; left: 50%; margin-left: -90px; width: 180px; height: 180px; border-radius: 48px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center"><img src="{BLOB['cano']}" alt="" aria-hidden="true" style="width: 110px; height: 130px; object-fit: contain"></div>
  <section style="position: absolute; top: 360px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
    {etiqueta("PROPUESTA ENVIADA", AZUL)}
    <h1 style="margin: 0; {TIT}; font-size: 34px; line-height: 1.02">Le llegó tu {marcador("propuesta")}</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">$ 47.000 · hoy, de 18 a 20. Te avisamos cuando responda.</p>
    <div style="margin-top: 10px; width: 100%">{tarjeta(fila_ic("chat","Escribile si querés","El chat queda abierto con este pedido",href="F-Chat.dc.html",borde=False))}</div>
  </section>
''' + accion_fija('Volver al inicio','F-Inicio.dc.html')
guardar('F-Enviada.dc.html','Núcleo · Propuesta enviada',cuerpo)
print('ok')
