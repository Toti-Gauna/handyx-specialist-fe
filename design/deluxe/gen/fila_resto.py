import sys; sys.path.insert(0,'gen')
from piezas2 import *

# Bienvenida.
handys=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: {t}px; height: {t}px; border-radius: {t//3}px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; transform: rotate({r}deg)"><img src="{BLOB[h]}" alt="" style="width: {int(t*.6)}px; height: {int(t*.7)}px; object-fit: contain"></span>' for x,y,t,h,r in [(30,90,120,'lamparita',-6),(220,60,130,'cano',5),(60,250,110,'engranaje',4),(230,240,120,'llave',-5)])
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 420px; background: {AZUL}; border-radius: 0 0 40px 40px"></div>
  {handys}
  <section style="position: absolute; top: 450px; left: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px">
    {etiqueta("HANDYX PARA ESPECIALISTAS", AZUL)}
    <h1 style="margin: 0; {TIT}; font-size: 38px; line-height: 1.02">Tu trabajo, {marcador("tus precios")}</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Recibí pedidos de tu zona en Mar del Plata, cotizá a tu manera y cobrá directo. Vos elegís qué trabajos tomar.</p>
  </section>
''' + acciones_fijas(boton('Crear cuenta','D6-Acceso.dc.html'), boton2('Ya tengo cuenta','D6-Acceso.dc.html'))
guardar('D6-Bienvenida.dc.html','Resto · Bienvenida',cuerpo)

# Acceso con código de 6 dígitos.
casillas=''.join(f'<span style="height: 58px; border-radius: 16px; background: {"#FFFFFF" if i<4 else "#F6F7F9"}; border: 2px solid {AZUL if i==4 else BORDE}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 24px">{d}</span>' for i,d in enumerate(['4','8','1','5','','']))
cuerpo = barra_compacta('Entrar','D6-Bienvenida.dc.html') + contenido(f'''
    {titulo_grande("PASO 2 DE 2","Revisá tu ","email")}
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Te mandamos un código de 6 dígitos a <strong>especialista@example.test</strong>.</p>
    <div role="group" aria-label="Código de 6 dígitos" style="display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 8px">{casillas}</div>
    <span style="font-size: 13px; color: {SUAVE}">¿No llegó? Podés pedir otro en 0:42.</span>
    <div style="display: flex; align-items: center; gap: 10px; color: {SUAVE}; font-size: 13px"><span style="flex: 1; height: 1px; background: {BORDE}"></span>o seguí con<span style="flex: 1; height: 1px; background: {BORDE}"></span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Google","D6-Alta.dc.html")}{boton2("Apple","D6-Alta.dc.html")}</div>''') + '\n' + accion_fija('Entrar','D6-Alta.dc.html')
guardar('D6-Acceso.dc.html','Resto · Acceso',cuerpo)

# Alta guiada: cargar no es verificar.
def paso_alta(ic, t, sub, estado):
    m={'listo':chip('Listo','check','exito'),'revision':chip('En revisión','reloj','amarillo'),'falta':chip('Falta','alerta','error'),'cita':chip('Cita en persona','agenda','tinte')}[estado]
    return fila_ic(ic, t, sub, derecha=m, borde=ic!='cuenta')
pasos=''.join([paso_alta('cuenta','Tus datos','Nombre, teléfono y email','listo'),paso_alta('escudo','DNI y CUIT/CUIL','Cargado: lo estamos revisando','revision'),paso_alta('herramienta','Rubros y zonas','Plomería y Gas · 4 barrios','listo'),paso_alta('camara','Foto de perfil','Con buena luz, sin anteojos de sol','falta'),paso_alta('usuario2','Antecedentes','Se verifican en persona: no se suben archivos','cita')])
cuerpo = barra_compacta('Tu alta','D6-Acceso.dc.html') + contenido(f'''
    <div style="display: flex; align-items: center; gap: 14px">{anillo(2,5,64)}<span style="display: flex; flex-direction: column; gap: 2px">{etiqueta("CASI LISTO")}<strong style="{TIT}; font-size: 26px; line-height: 1">Te faltan 3 pasos</strong><span style="font-size: 13px; color: {SUAVE}">Cargar un documento todavía no es estar verificado.</span></span></div>
    {tarjeta(pasos, franja("¿Qué evaluamos de tu perfil?","D6-Ayuda.dc.html"))}''') + '\n' + accion_fija(svg(IC['camara'],'#FFFFFF',20)+'Sacar la foto de perfil','D6-Alta.dc.html')
guardar('D6-Alta.dc.html','Resto · Alta guiada',cuerpo)

# Avisos: abren el detalle, nunca aceptan.
def aviso(ic, t, sub, hora, nuevo=False, href='F-Pedido.dc.html'):
    p=f'<span style="width: 10px; height: 10px; border-radius: 50%; background: {AZUL}; flex: none"></span>' if nuevo else '<span style="width: 10px; flex: none"></span>'
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none">{p}{mosaico_ic(ic,44,radio=14,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 13px; color: {SUAVE}">{sub}</span></span><span style="font-size: 12px; color: {SUAVE}">{hora}</span></a>'
cuerpo = barra_compacta('Avisos','F-Inicio.dc.html', accion=f'<button aria-label="Ajustes de avisos" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{svg(IC["lista"],TINTA,18)}</button>') + contenido(f'''
    {etiqueta("HOY")}
    <div>{aviso('herramienta','Nuevo pedido urgente','Plomería · Centro · tocá para ver','17:40',True)}{aviso('check','Aceptaron tu propuesta','Pierde la canilla · hoy de 18 a 20','17:52',True,'F-Trabajo.dc.html')}{aviso('billete','Pago verificado','$ 180.000 · Baño completo, etapa 2','12:05',False,'F-Ingresos.dc.html')}</div>
    {etiqueta("ESTA SEMANA")}
    <div>{aviso('estrella','Llegaste a la estación 2','Kit de consumibles: elegí cómo retirarlo','Lun',False,'G-Camino.dc.html')}{aviso('obra','Pidieron mover una jornada','Tablero y circuitos · jueves 19','Dom',False,'F-Obra.dc.html')}</div>
    <p style="margin: 0; font-size: 12px; color: {SUAVE}">Los avisos te llevan al detalle. Nada se acepta desde acá.</p>''')
guardar('D6-Avisos.dc.html','Resto · Avisos',cuerpo)

# Ayuda: pastillas azules de preguntas.
def pastilla(t):
    return f'<a href="D6-Ayuda.dc.html" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 16px; border-radius: 18px; background: {AZUL}; color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 3px 0 {HONDO}">{t}{svg(IC["flecha"],"#FFFFFF",18)}</a>'
cuerpo = barra_compacta('Ayuda','F-Cuenta.dc.html') + contenido(f'''
    <div style="display: flex; align-items: center; gap: 12px">{mosaico_handy('lamparita',72)}<span style="display: flex; flex-direction: column; gap: 4px">{etiqueta("CENTRO DE AYUDA")}<strong style="{TIT}; font-size: 26px; line-height: 1.02">¿En qué te {marcador("ayudamos")}?</strong></span></div>
    <span style="min-height: 50px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}">{svg(IC['ayuda'],SUAVE,20)}Buscá tu pregunta</span>
    <div style="display: flex; flex-direction: column; gap: 10px">{pastilla("¿Cómo cobro un trabajo?")}{pastilla("¿Qué pasa si no acepto un pedido?")}{pastilla("¿Cuánto cobra Handyx?")}{pastilla("¿Cómo se verifican mis documentos?")}</div>
    {tarjeta(fila_ic("chat","Hablar con soporte","Respondemos en horario de atención",href="F-Chat.dc.html",borde=False)+fila_ic("alerta","Reportar un problema con un trabajo","Queda registrado y te contamos cómo sigue",href="F-Chat.dc.html"))}''')
guardar('D6-Ayuda.dc.html','Resto · Ayuda',cuerpo)

# Error con un Handy roto.
cuerpo = barra_compacta('Tus ingresos','F-Cuenta.dc.html') + f'''
  <div style="position: absolute; top: 140px; left: 50%; margin-left: -100px; width: 200px; height: 200px; border-radius: 56px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center"><img src="{BLOB['engranaje']}" alt="" aria-hidden="true" style="width: 120px; height: 120px; object-fit: contain; transform: rotate(-18deg); filter: grayscale(1)"></div>
  <section style="position: absolute; top: 370px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
    {etiqueta("SIN CONEXIÓN CON HANDYX", "#A8261C")}
    <h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1.02">No pudimos {marcador("cargar")} esto</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Revisá tu conexión y probá de nuevo. Lo que ya habías cargado sigue acá; no mostramos datos inventados.</p>
    <span style="margin-top: 6px">{chip("Sin señal","wifi","gris")}</span>
  </section>
''' + accion_fija('Reintentar','F-Ingresos.dc.html')
guardar('D6-Error.dc.html','Resto · Error',cuerpo)
print('ok')
