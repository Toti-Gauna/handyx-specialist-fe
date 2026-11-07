import sys; sys.path.insert(0,'gen')
from piezas2 import *

# Trabajo agendado: pasos, dirección, plata y acciones.
def paso(t, sub, est):
    if est=='hecho': m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 50%; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3)}</span>'
    elif est=='ahora': m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 50%; background: {AMARILLO}; box-shadow: inset 0 0 0 2px {TINTA}"></span>'
    else: m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 50%; background: {MOSAICO}"></span>'
    return f'<li style="display: flex; gap: 12px; align-items: flex-start">{m}<span style="display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 13px; color: {SUAVE}">{sub}</span></span></li>'
pasos=''.join([paso('Acordado','$ 47.000 · hoy de 18 a 20','hecho'),paso('Salir para allá','Compartís tu ubicación solo durante el viaje','ahora'),paso('Llegué','Se marca solo al llegar, o a mano','falta'),paso('Terminé','Informás el cobro: directo a vos','falta')])
cuerpo = barra_compacta('Trabajo','F-Agenda.dc.html',sub='Hoy · 18 a 20') + contenido(f'''
    <div style="display: flex; align-items: center; gap: 12px">{mosaico_handy('cano',64)}<span style="display: flex; flex-direction: column; gap: 4px"><span>{chip("Agendado","agenda","noche")}</span><strong style="{TIT}; font-size: 26px; line-height: 1">Pierde la canilla</strong><span style="font-size: 13px; color: {SUAVE}">Plomería · Lucía Ferreyra</span></span></div>
    {tarjeta(f'<ol style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px">{pasos}</ol>')}
    {tarjeta(fila_ic("pin","Calle De Prueba 123, Centro","Te la mostramos porque el cliente aceptó",borde=False)+fila_ic("billete","$ 47.000 · incluye materiales","Efectivo o Mercado Pago, directo a vos"), franja("Agregar repuestos o mano de obra","H0-Presupuesto.dc.html"))}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">
      <a href="F-Chat.dc.html" style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 0; border-radius: 18px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; font-size: 13px; font-weight: 800">{svg(IC['chat'],TINTA,22)}Mensaje</a>
      <a href="F-Fecha.dc.html" style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 0; border-radius: 18px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; font-size: 13px; font-weight: 800">{svg(IC['agenda'],TINTA,22)}Cambiar fecha</a>
      <a href="H0-Modo.dc.html" style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 0; border-radius: 18px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; font-size: 13px; font-weight: 800">{svg(IC['herramienta'],TINTA,22)}Modo trabajo</a>
    </div>''') + '\n' + accion_fija(svg(IC['camion'],'#FFFFFF',20)+'Salir para allá','F-InicioRuta.dc.html')
guardar('F-Trabajo.dc.html','Núcleo · Trabajo agendado',cuerpo)

# Agenda: semana en tira y el día con horas en mosaicos.
def dia_tira(n, d, est=''):
    if est=='sel': s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}'
    else: s=f'background: {MOSAICO}; color: {TEXTO}'
    pt=f'<span style="width: 5px; height: 5px; border-radius: 50%; background: {NARANJA if est=="sel" else AZUL}"></span>' if est in ('sel','pt') else '<span style="height: 5px"></span>'
    return f'<span style="flex: 1; padding: 8px 0; border-radius: 16px; {s}; display: flex; flex-direction: column; align-items: center; gap: 2px"><span style="font-size: 11px; font-weight: 800">{d}</span><strong style="{TIT}; font-size: 18px">{n}</strong>{pt}</span>'
def turno(h1, h2, t, sub, c, href, chip_html=''):
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: stretch; color: {TINTA}; text-decoration: none"><span style="width: 64px; flex: none; border-radius: 18px; background: {MOSAICO}; display: flex; flex-direction: column; align-items: center; justify-content: center"><strong style="{TIT}; font-size: 17px">{h1}</strong><span style="font-size: 11px; color: {SUAVE}">a {h2}</span></span><span style="flex: 1; padding: 12px 14px; border-radius: 18px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 4px; border-left: 0"><span style="display: flex; justify-content: space-between; gap: 8px"><strong style="font-size: 15px">{t}</strong>{chip_html}</span><span style="font-size: 13px; color: {SUAVE}">{sub}</span></span></a>'
cuerpo = contenido(f'''
    {titulo_grande("NOVIEMBRE 2026","Tu ","agenda")}
    <div style="display: flex; gap: 6px">{dia_tira(16,'LUN')}{dia_tira(17,'MAR','sel')}{dia_tira(18,'MIÉ','pt')}{dia_tira(19,'JUE','pt')}{dia_tira(20,'VIE','pt')}{dia_tira(21,'SÁB')}</div>
    <strong style="font-size: 15px">Hoy, martes 17</strong>
    {turno("9:00","17:00","Baño completo","Obra · jornada 3 de 6 · Los Troncos","", "F-Obra.dc.html", chip("Obra","obra","tinte"))}
    {turno("18:00","20:00","Pierde la canilla","Plomería · Centro · $ 47.000","", "F-Trabajo.dc.html", chip("Agendado","agenda","noche"))}
    <div style="display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 18px; border: 2px dashed {BORDE}; color: {SUAVE}; font-size: 14px">{svg(IC['estrella'],SUAVE,20)}Mañana tenés la jornada 4 de «Baño completo».</div>''', top=26) + '\n' + barra_vidrio('Agenda')
guardar('F-Agenda.dc.html','Núcleo · Agenda',cuerpo)

# Mensajes.
def hilo(h, t, ult, hora, sin_leer=0, href='F-Chat.dc.html'):
    b=f'<span style="min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; background: {AZUL}; color: #FFFFFF; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center">{sin_leer}</span>' if sin_leer else ''
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none">{mosaico_handy(h,52)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="display: flex; justify-content: space-between"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{hora}</span></span><span style="font-size: 13px; color: {TEXTO if sin_leer else SUAVE}; font-weight: {700 if sin_leer else 400}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{ult}</span></span>{b}</a>'
cuerpo = contenido(f'''
    {titulo_grande("2 SIN LEER","Tus ","mensajes")}
    <div style="display: flex; gap: 8px">{chip("Todos",tono="azul")}{chip("Pedidos",tono="gris")}{chip("Obras",tono="gris")}{chip("Soporte",tono="gris")}</div>
    <div>{hilo('cano','Pierde la canilla','¿Podés venir con el repuesto del cartucho?','17:42',1)}{hilo('engranaje','Baño completo','Te mandé las fotos del revestimiento elegido','16:10',1)}{hilo('lamparita','Tablero y circuitos','Perfecto, el jueves a las 8:30','Ayer')}{hilo('llave','Soporte de Handyx','Tu caso quedó resuelto','Lun')}</div>''', top=26) + '\n' + barra_vidrio('Mensajes')
guardar('F-Mensajes.dc.html','Núcleo · Mensajes',cuerpo)

# Chat del pedido, con la propuesta como tarjeta.
def burbuja(t, mio=False, hora=''):
    if mio: s=f'align-self: flex-end; background: {AZUL}; color: #FFFFFF; border-radius: 20px 20px 6px 20px'
    else: s=f'align-self: flex-start; background: {MOSAICO}; color: {TINTA}; border-radius: 20px 20px 20px 6px'
    return f'<div style="max-width: 78%; padding: 10px 14px; {s}; font-size: 15px">{t}<span style="display: block; margin-top: 2px; font-size: 11px; opacity: 0.7; text-align: right">{hora}</span></div>'
prop=f'<div style="align-self: flex-end; width: 78%">{tarjeta(etiqueta("TU PROPUESTA",AZUL)+f"<strong style=\"{TIT}; font-size: 24px\">$ 47.000</strong><span style=\"font-size: 13px; color: {SUAVE}\">Hoy de 18 a 20 · incluye materiales</span>"+chip("Esperando respuesta","reloj","amarillo"))}</div>'
cuerpo = barra_compacta('Pierde la canilla','F-Mensajes.dc.html',sub='Pedido · Plomería') + contenido(f'''
    <span style="align-self: center">{chip("Hoy","agenda","gris")}</span>
    {burbuja("Hola, ¿podés venir hoy? La canilla gotea todo el tiempo.",False,"17:20")}
    {prop}
    {burbuja("Hoy a la tarde puedo, después de las 18. ¿Te sirve?",True,"17:31")}
    {burbuja("¿Podés venir con el repuesto del cartucho?",False,"17:42")}
    <span style="align-self: center; font-size: 12px; color: {SUAVE}">No compartas datos de pago por acá: el cobro es directo y se informa en el trabajo.</span>''', top=74) + f'''
  <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 12px 22px; background: #FFFFFF; border-top: 1px solid {BORDE}; display: flex; gap: 8px; align-items: center">
    <button aria-label="Adjuntar foto" style="width: 48px; height: 48px; flex: none; border-radius: 16px; border: 0; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['camara'],TINTA,22)}</button>
    <span style="flex: 1; min-height: 48px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; padding: 0 14px; color: {SUAVE}; font-size: 15px">Escribí un mensaje</span>
    <button aria-label="Enviar" style="width: 48px; height: 48px; flex: none; border-radius: 16px; border: 0; background: {AZUL}; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center">{svg(IC['enviar'],'#FFFFFF',20)}</button>
  </div>'''
guardar('F-Chat.dc.html','Núcleo · Chat del pedido',cuerpo)

# Cuenta.
perfil=f'''<div style="display: flex; gap: 12px; align-items: center">{mosaico_handy('llave',64)}<span style="display: flex; flex-direction: column; gap: 4px"><strong style="{TIT}; font-size: 22px">Especialista De Prueba</strong><span style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Verificado por Handyx","escudo","exito")}{chip("Plomería · Gas","herramienta","gris")}</span></span></div>'''
filas=''.join([
 fila_ic('billete','Tus ingresos','Bruto, gastos y neto de cada mes',href='F-Ingresos.dc.html',borde=False),
 fila_ic('estrella','Tu camino y premios','8 de 10 para la Gorra Handyx',href='G-Camino.dc.html'),
 fila_ic('herramienta','Tu taller','Calculadoras, tablero 3D e informes',href='T-Taller.dc.html'),
 fila_ic('pin','Disponibilidad y zonas','Rubros, barrios y horarios',href='F-Inicio.dc.html'),
 fila_ic('ticket','Presupuestos y precios','Plantillas y tu lista de precios',href='H0-Precios.dc.html'),
 fila_ic('ayuda','Ayuda','Preguntas y soporte',href='D6-Ayuda.dc.html'),
])
cuerpo = contenido(f'''
    {titulo_grande("TU CUENTA","Hola, ","Especialista")}
    {tarjeta(perfil)}
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 18px; background: {AMARILLO}"><span style="font-size: 14px; font-weight: 800">Tarifa de Handyx 0 %</span><span style="font-size: 13px; font-weight: 700">hasta el 10/12 · faltan 23 días</span></div>
    {tarjeta(filas)}''', top=26) + '\n' + barra_vidrio('Cuenta')
guardar('F-Cuenta.dc.html','Núcleo · Cuenta',cuerpo)
print('ok')
