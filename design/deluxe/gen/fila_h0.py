import sys; sys.path.insert(0,'gen')
from piezas2 import *

def linea(t, sub, v, ic='herramienta', menos=False):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{mosaico_ic(ic,40,radio=12,iconsize=18)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><strong style="font-size: 15px; font-variant-numeric: tabular-nums">{v}</strong></div>'
def total(t, v, color=TINTA, grande=False):
    tam=24 if grande else 15
    return f'<div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 8px"><span style="font-weight: 800">{t}</span><strong style="{TIT if grande else "font-weight: 800"}; font-size: {tam}px; color: {color}">{v}</strong></div>'

# Presupuestador.
items=(f'<div style="display: flex; justify-content: space-between">{etiqueta("MANO DE OBRA")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">+ Agregar</span></div>'
 +linea('Cambio de cartucho','1 · 1 hora','$ 28.000','herramienta')+linea('Prueba de pérdidas','1','$ 6.000','gota')
 +f'<div style="display: flex; justify-content: space-between; padding-top: 10px">{etiqueta("MATERIALES")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">Desde el Taller</span></div>'
 +linea('Cartucho cerámico 35 mm','1 · tu lista del 05/11','$ 9.800','caja')+linea('Flexibles 40 cm','2 · tu lista del 05/11','$ 3.200','caja'))
cuerpo = barra_compacta('Presupuesto','F-Trabajo.dc.html',sub='Pierde la canilla · versión 2') + contenido(f'''
    {tarjeta(items)}
    <div style="display: flex; gap: 8px; align-items: center">{chip("Margen en materiales 0 %","billete","gris")}{chip("Vale 7 días","reloj","gris")}{chip("Garantía 30 días","escudo","gris")}</div>
    {tarjeta(total("Mano de obra","$ 34.000")+total("Materiales","$ 13.000")+f'<div style="height: 1px; background: {BORDE}; margin-top: 8px"></div>'+total("Total para el cliente","$ 47.000",grande=True))}
    <span style="font-size: 12px; color: {SUAVE}">Los precios de materiales salen de tu lista; Handyx no los fija. Se guarda cada versión.</span>''') + '\n' + accion_fija(svg(IC['enviar'],'#FFFFFF',20)+'Mandar por el chat','H0-Vista.dc.html')
guardar('H0-Presupuesto.dc.html','H0 · Presupuestador',cuerpo)

# Presupuesto como lo ve el cliente.
cuerpo = barra_compacta('Vista del cliente','H0-Presupuesto.dc.html',sub='Así llega por el chat') + contenido(f'''
    <section style="border-radius: 26px; overflow: hidden; border: 1px solid {BORDE}; box-shadow: {ELEV2}">
      <div style="padding: 18px; background: {AZUL}; color: #FFFFFF; display: flex; justify-content: space-between; align-items: flex-end"><span style="display: flex; flex-direction: column; gap: 4px">{etiqueta("PRESUPUESTO · VERSIÓN 2","#CFE0FA")}<strong style="{TIT}; font-size: 24px">Pierde la canilla</strong><span style="font-size: 13px">Julián Ortiz · Plomería</span></span><span style="{TIT}; font-size: 22px">Handyx</span></div>
      <div style="padding: 6px 18px 16px; background: #FFFFFF">
        {linea('Cambio de cartucho','Mano de obra','$ 28.000')}{linea('Prueba de pérdidas','Mano de obra','$ 6.000','gota')}{linea('Cartucho y flexibles','Materiales','$ 13.000','caja')}
        <div style="height: 1px; background: {BORDE}; margin-top: 4px"></div>{total("Total","$ 47.000",AZUL,True)}
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px">{chip("Vale hasta el 24/11","reloj","gris")}{chip("Garantía 30 días","escudo","gris")}{chip("Pago directo al especialista","billete","exito")}</div>
      </div>
    </section>
    <p style="margin: 0; font-size: 13px; color: {SUAVE}">El cliente lo acepta o pide cambios en el chat. Si cambiás algo, se manda una versión nueva y la anterior queda vencida.</p>''') + '\n' + accion_fija('Listo','F-Chat.dc.html')
guardar('H0-Vista.dc.html','H0 · Presupuesto en el chat',cuerpo)

# Lista de precios.
def precio(t, v, fecha, cat='caja'):
    return linea(t, f'Actualizado {fecha}', v, cat)
cuerpo = barra_compacta('Tu lista de precios','F-Cuenta.dc.html') + contenido(f'''
    <div style="display: flex; gap: 8px">{chip("Plomería",tono="azul")}{chip("Gas",tono="gris")}{chip("Mano de obra",tono="gris")}</div>
    <span style="min-height: 48px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}">{svg(IC['lista'],SUAVE,20)}Buscar un material</span>
    {tarjeta(precio('Cartucho cerámico 35 mm','$ 9.800','05/11')+precio('Flexible 40 cm','$ 1.600','05/11')+precio('Llave de paso 1/2"','$ 7.400','28/10')+precio('Termofusión 20 mm (tira)','$ 5.900','28/10')+precio('Sellador de roscas','$ 3.100','12/10'), franja('Precios de hace más de 30 días: 1','H0-Precios.dc.html'))}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Foto de la lista","H0-Gasto.dc.html","camara")}{boton2("Planilla","H0-Precios.dc.html","lista")}</div>
    <span style="font-size: 12px; color: {SUAVE}">La foto se lee en tu teléfono. Vos revisás cada precio antes de guardarlo.</span>''')
guardar('H0-Precios.dc.html','H0 · Lista de precios',cuerpo)

# Cargar un gasto con el ticket.
ticket=f'''<div style="position: relative; height: 210px; border-radius: 22px; background: {NOCHE}; overflow: hidden">
      <div style="position: absolute; left: 50%; top: 18px; margin-left: -80px; width: 160px; height: 190px; background: #FFFFFF; border-radius: 6px; box-shadow: {ELEV2}; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; transform: rotate(-3deg)">
        <span style="height: 8px; width: 70%; background: {MOSAICO}; border-radius: 4px"></span><span style="height: 6px; width: 50%; background: {MOSAICO}; border-radius: 3px"></span>
        <span style="height: 6px; width: 90%; background: {AMARILLO}; border-radius: 3px"></span><span style="height: 6px; width: 80%; background: {MOSAICO}; border-radius: 3px"></span><span style="height: 6px; width: 85%; background: {AMARILLO}; border-radius: 3px"></span>
        <span style="margin-top: auto; height: 10px; width: 60%; align-self: flex-end; background: {AMARILLO}; border-radius: 4px"></span>
      </div>
      <span style="position: absolute; left: 14px; bottom: 12px">{chip("Leído en tu teléfono","check","exito")}</span>
    </div>'''
def campo(et, v):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 48px; border-radius: 14px; border: 1px solid {BORDE}; background: #FFFFFF; display: flex; align-items: center; padding: 0 14px; font-size: 15px; font-weight: 700">{v}</span></div>'
cuerpo = barra_compacta('Cargar un gasto','F-Ingresos.dc.html') + contenido(f'''
    {ticket}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{campo("Monto","$ 13.000")}{campo("Fecha","Hoy, 17/11")}</div>
    <div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">Tipo de gasto</span><div style="display: flex; gap: 8px; flex-wrap: wrap">{chip("Materiales","caja","azul")}{chip("Combustible","camion","gris")}{chip("Herramientas","herramienta","gris")}{chip("Otro",tono="gris")}</div></div>
    {campo("Trabajo","Pierde la canilla · Plomería")}
    <span style="font-size: 12px; color: {SUAVE}">Tus gastos son tuyos: el cliente no los ve. Sirven para calcular tu neto.</span>''') + '\n' + accion_fija('Guardar gasto','F-Ingresos.dc.html')
guardar('H0-Gasto.dc.html','H0 · Cargar gasto',cuerpo)

# Modo trabajo: botones grandes para usar con guantes.
def chk(t, ok):
    m=f'<span style="width: 34px; height: 34px; flex: none; border-radius: 10px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",20,3)}</span>' if ok else f'<span style="width: 34px; height: 34px; flex: none; border-radius: 10px; border: 2px solid #5A6A88"></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; min-height: 52px; color: #FFFFFF; font-size: 16px; font-weight: 700; {"opacity: 0.7; text-decoration: line-through" if ok else ""}">{m}{t}</div>'
def grande(ic, t, href):
    return f'<a href="{href}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 92px; border-radius: 22px; background: #26385C; color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none">{svg(IC[ic],AMARILLO,30)}{t}</a>'
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: {NOCHE}"></div>
  <header style="position: absolute; top: 14px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center">
    <a href="F-Trabajo.dc.html" aria-label="Salir del Modo trabajo" style="width: 48px; height: 48px; border-radius: 16px; background: #26385C; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>
    {chip("Modo trabajo","herramienta","amarillo")}
  </header>
  <section style="position: absolute; top: 80px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 16px; color: #FFFFFF">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px">{etiqueta("CAMBIO DE CARTUCHO","#AFC0DD")}<span style="{TIT}; font-size: 64px; line-height: 1; font-variant-numeric: tabular-nums">00:24:18</span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">
      <button style="min-height: 64px; border-radius: 20px; border: 0; background: {AMARILLO}; color: {TINTA}; font-size: 18px; font-weight: 900; box-shadow: 0 5px 0 #C9C85A">Pausar</button>
      <button style="min-height: 64px; border-radius: 20px; border: 0; background: #26385C; color: #FFFFFF; font-size: 18px; font-weight: 900">Siguiente tarea</button>
    </div>
    <div style="padding: 10px 16px; border-radius: 22px; background: #26385C">{etiqueta("PRIMERO LA SEGURIDAD", AMARILLO)}{chk("Cerrar la llave de paso",True)}{chk("Descargar la presión",True)}{chk("Probar sin pérdidas al terminar",False)}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px">{grande('camara','Foto','H0-AntesDespues.dc.html')}{grande('micro','Nota de voz','H0-Modo.dc.html')}{grande('escaner','Material','H0-Gasto.dc.html')}{grande('nivel','Nivel','T-Taller.dc.html')}{grande('caja','Repuesto','R-Pedir.dc.html')}{grande('herramienta','Taller','T-Taller.dc.html')}</div>
  </section>
''' + f'''  <div style="position: absolute; left: 16px; right: 16px; bottom: 22px"><a href="H0-Informe.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 64px; border-radius: 20px; background: {AZUL}; color: #FFFFFF; font-size: 18px; font-weight: 900; text-decoration: none; box-shadow: 0 5px 0 {HONDO}">Terminé el trabajo</a></div>'''
guardar('H0-Modo.dc.html','H0 · Modo trabajo',cuerpo)

# Antes y después.
cuerpo = barra_compacta('Antes y después','H0-Modo.dc.html') + contenido(f'''
    <div role="img" aria-label="Comparador de fotos: antes a la izquierda, después a la derecha" style="position: relative; height: 380px; border-radius: 26px; overflow: hidden; box-shadow: {ELEV2}">
      <div style="position: absolute; inset: 0; background: #C9CED8"></div>
      <div style="position: absolute; top: 0; bottom: 0; left: 50%; right: 0; background: #E9EFF9"></div>
      <img src="{BLOB['cano']}" alt="" aria-hidden="true" style="position: absolute; left: 50%; top: 110px; margin-left: -70px; width: 140px; height: 160px; object-fit: contain">
      <span style="position: absolute; left: 12px; top: 12px">{chip("Antes · 18:12","camara","noche")}</span>
      <span style="position: absolute; right: 12px; top: 12px">{chip("Después · 19:05","camara","blanco")}</span>
      <span style="position: absolute; top: 0; bottom: 0; left: 50%; width: 4px; margin-left: -2px; background: #FFFFFF"></span>
      <span style="position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center; gap: 2px">{svg(IC['atras'],TINTA,16)}{svg(IC['flecha'],TINTA,16)}</span>
    </div>
    <div style="display: flex; gap: 8px">{chip("Flecha",tono="gris")}{chip("Círculo",tono="gris")}{chip("Texto",tono="gris")}</div>
    <span style="font-size: 12px; color: {SUAVE}">Las fotos se achican y pierden la ubicación en tu teléfono antes de subirse.</span>''') + '\n' + accion_fija('Sumar al informe','H0-Informe.dc.html')
guardar('H0-AntesDespues.dc.html','H0 · Antes y después',cuerpo)

# Informe para el cliente al cerrar.
cuerpo = barra_compacta('Informe del trabajo','H0-Modo.dc.html',sub='Lo recibe el cliente') + contenido(f'''
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("TRABAJO TERMINADO", "#137140")}{chip("1 h 05 min","reloj","gris")}</div><strong style="{TIT}; font-size: 24px">Pierde la canilla</strong>' + fila_ic('check','Cambio de cartucho','Cartucho cerámico 35 mm',borde=False) + fila_ic('gota','Prueba de pérdidas','Sin pérdidas a los 10 minutos') + f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px"><span style="height: 90px; border-radius: 16px; background: #C9CED8"></span><span style="height: 90px; border-radius: 16px; background: {TINTE}"></span></div>')}
    {tarjeta(fila_ic('billete','$ 47.000 · cobrado en efectivo','Lo informás vos; Handyx no lo recibe',borde=False)+fila_ic('escudo','Garantía de 30 días','Hasta el 17/12'))}''') + '\n' + accion_fija('Mandar al cliente y terminar','F-Inicio.dc.html')
guardar('H0-Informe.dc.html','H0 · Informe al cliente',cuerpo)

# Ruta del día.
cuerpo = mapa(alto=470, ruta=[(95,330),(140,260),(205,230),(240,150),(270,120)], punto=(95,330), extra=''.join(f'<span style="position: absolute; left: {x-15}px; top: {y-15}px; width: 30px; height: 30px; border-radius: 50%; background: {c}; color: {t}; border: 3px solid #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px">{n}</span>' for x,y,n,c,t in [(205,230,1,AZUL,"#FFFFFF"),(270,120,2,AMARILLO,TINTA)])) + f'''
  <a href="F-Trabajo.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 14px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>
''' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: baseline"><h1 style="margin: 0; {TIT}; font-size: 28px">Tu {marcador("ruta")} de hoy</h1><span style="font-size: 13px; font-weight: 700; color: {SUAVE}">14 km · 3 paradas</span></div>
    {fila_ic('obra','1 · Baño completo','Los Troncos · 9 a 17 · listo',derecha=chip("Hecho","check","exito"),borde=False)}
    {fila_ic('gota','2 · Pierde la canilla','Centro · 18 a 20 · 12 min en auto',derecha=chip("Ahora","reloj","amarillo"))}
    {fila_ic('caja','Retiro en Ferretería Simulación','Opcional · 4 min de desvío',derecha=chip("Simulación",tono="gris"))}
    <span style="font-size: 12px; color: {SUAVE}">Kilómetros del mes: 312. El orden lo podés cambiar arrastrando.</span>''', 430) + '\n' + acciones_fijas(boton('Salir para la parada 2','F-Trabajo.dc.html'))
guardar('H0-Ruta.dc.html','H0 · Ruta del día',cuerpo)

# Stock de la camioneta.
def caj(t, n, minimo, ic='caja'):
    bajo = n<=minimo
    est = f'background: {"#FCE8E6" if bajo else MOSAICO}'
    return f'<div style="padding: 12px; border-radius: 20px; {est}; display: flex; flex-direction: column; gap: 6px">{svg(IC[ic], "#A8261C" if bajo else TINTA, 22)}<strong style="font-size: 14px">{t}</strong><span style="display: flex; justify-content: space-between; align-items: baseline"><strong style="{TIT}; font-size: 22px">{n}</strong><span style="font-size: 11px; font-weight: 800; color: {"#A8261C" if bajo else SUAVE}">{"Quedan pocos" if bajo else "mín. "+str(minimo)}</span></span></div>'
cuerpo = barra_compacta('Tu camioneta','F-Cuenta.dc.html',sub='Stock y lista de compras') + contenido(f'''
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">{caj('Cartuchos 35 mm',1,2)}{caj('Flexibles 40 cm',6,4)}{caj('Teflón',2,3)}{caj('Llaves de paso',3,2)}{caj('Termofusión 20 mm',8,5)}{caj('Sellador',4,2)}</div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("LISTA DE COMPRAS")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">3 ítems</span></div>' + fila_ic('caja','Cartuchos 35 mm','Comprar 2',borde=False) + fila_ic('caja','Teflón','Comprar 3'), franja('Pedir en una ferretería','R-Pedir.dc.html'))}''') + '\n' + accion_fija(svg(IC['escaner'],'#FFFFFF',20)+'Sumar con código de barras','H0-Stock.dc.html')
guardar('H0-Stock.dc.html','H0 · Stock de la camioneta',cuerpo)
print('ok')
