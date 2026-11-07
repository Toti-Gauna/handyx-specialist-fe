import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
 'telefono':'<rect x="7" y="2" width="10" height="20" rx="2.5"></rect><path d="M11 18h2"></path>',
 'linterna':'<path d="M8 2h8l-1 6H9L8 2Z"></path><rect x="9" y="8" width="6" height="13" rx="2"></rect><path d="M12 12v3"></path>',
 'lupa':'<circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path>',
 'candadito':'<rect x="6" y="11" width="12" height="9" rx="2"></rect><path d="M9 11V8a3 3 0 0 1 6 0v3"></path>',
 'flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>',
 'pausa':'<path d="M9 5v14M15 5v14"></path>',
})
def interr(t, sub, on):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div role="switch" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span aria-hidden="true" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
def casilla(t, sub, on, ic):
    m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 9px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3)}</span>' if on else f'<span style="width: 28px; height: 28px; flex: none; border-radius: 9px; border: 2px solid #C9CFDA"></span>'
    b=f'border: 2px solid {AZUL}; background: {TINTE};' if on else f'border: 1px solid {BORDE}; background: #FFFFFF;'
    return f'<div role="checkbox" aria-checked="{str(on).lower()}" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; {b}">{svg(IC[ic],AZUL if on else TEXTO,22)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{m}</div>'
def precio_tipo(fijo):
    return chip("Precio fijo","candadito","gris") if fijo else chip("Se actualiza","flechas","tinte")
def linea(t, sub, v, ic='herramienta', tipo=None):
    tp=f'<span>{precio_tipo(tipo)}</span>' if tipo is not None else ''
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{mosaico_ic(ic,40,radio=12,iconsize=18)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span>{tp}</span><strong style="font-size: 15px; font-variant-numeric: tabular-nums">{v}</strong></div>'
def total(t, v, color=TINTA, grande=False):
    return f'<div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 8px"><span style="font-weight: 800">{t}</span><strong style="{TIT if grande else "font-weight: 800"}; font-size: {24 if grande else 15}px; color: {color}">{v}</strong></div>'
def opseg(opciones, sel):
    out=''.join(f'<span role="radio" aria-checked="{str(i==sel).lower()}" style="flex: 1; padding: 10px 12px; border-radius: 16px; {"border: 2px solid "+AZUL+"; background: "+TINTE+";" if i==sel else "border: 2px solid "+BORDE+"; background: #FFFFFF;"} display: flex; flex-direction: column; gap: 3px">{svg(IC[ic],AZUL if i==sel else TEXTO,20)}<strong style="font-size: 14px; color: {HONDO if i==sel else TINTA}">{t}</strong><span style="font-size: 11px; color: {SUAVE}">{sub}</span></span>' for i,(ic,t,sub) in enumerate(opciones))
    return f'<div role="radiogroup" style="display: flex; gap: 8px">{out}</div>'

# ── Presupuesto: ahora muestra si el precio es fijo o se actualiza, y manda directo ─
items=(f'<div style="display: flex; justify-content: space-between">{etiqueta("MANO DE OBRA")}<a href="H0-ManoObra.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 12px; font-weight: 800; text-decoration: none">Tus tarifas</a></div>'
 +linea('Cambio de cartucho','1 · tu tarifa por tarea','$ 28.000','herramienta')+linea('Prueba de pérdidas','1 · tu tarifa por tarea','$ 6.000','gota')
 +f'<div style="display: flex; justify-content: space-between; padding-top: 10px">{etiqueta("MATERIALES")}<a href="H0-AgregarLista.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 12px; font-weight: 800; text-decoration: none">Agregar varios</a></div>'
 +linea('Cartucho cerámico 35 mm','1 · tu lista del 05/11','$ 9.800','caja',False)+linea('Flexible 40 cm × 2','Fijado hoy','$ 3.200','caja',True))
cuerpo = barra_compacta('Presupuesto','F-Trabajo.dc.html',sub='Pierde la canilla · versión 2') + contenido(f'''
    {tarjeta(items, f'<a href="H0-AgregarMaterial.dc.html" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; background: #F4F5F7; border-top: 1px solid {BORDE}; color: {AZUL}; font-size: 14px; font-weight: 800; text-decoration: none">{svg(IC["mas"],AZUL,18)}Agregar un material</a>')}
    {tarjeta(total("Total para el cliente","$ 47.000",grande=True)+f'<span style="font-size: 12px; color: {SUAVE}">Mano de obra $ 34.000 · materiales $ 13.000</span>')}''') + '\n' + accion_fija(svg(IC['enviar'],'#FFFFFF',20)+'Mandar a Lucía por el chat','F-Chat.dc.html')
guardar('H0-Presupuesto.dc.html','H0 · Presupuestador',cuerpo)

# ── Agregar un material: precio fijo o que se actualiza, y las dos opciones ─
cuerpo = barra_compacta('Agregar material','H0-Presupuesto.dc.html',sub='Al presupuesto de Pierde la canilla') + contenido(f'''
    <div role="tablist" style="display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: {MOSAICO}"><span role="tab" aria-selected="true" style="flex: 1; min-height: 44px; border-radius: 12px; background: #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800">Lo consigo yo</span><a href="R-Comparar.dc.html" role="tab" aria-selected="false" style="flex: 1; min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: {SUAVE}; text-decoration: none">Ferretería adherida</a></div>
    <span style="min-height: 50px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}">{svg(IC['lupa'],SUAVE,20)}Buscá en tu lista de precios</span>
    <div style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; border: 2px solid {AZUL}; background: #FFFFFF">{mosaico_ic('caja',44,radio=14,iconsize=20)}<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">Cartucho cerámico 35 mm</strong><span style="font-size: 12px; color: {SUAVE}">Tu lista · $ 9.800 · actualizado 05/11</span></span><span style="display: flex; align-items: center; gap: 8px"><span style="width: 34px; height: 34px; border-radius: 10px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span><strong style="{TIT}; font-size: 20px">1</strong><span style="width: 34px; height: 34px; border-radius: 10px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">+</span></span></div>
    <strong style="font-size: 15px">¿Cómo va el precio?</strong>
    {opseg([('candadito','Precio fijo','Queda en $ 9.800 aunque cambie la lista'),('flechas','Se actualiza','Sigue tu lista; si cambia, te avisamos')],1)}
    <strong style="font-size: 15px">¿Qué hacés con este material?</strong>
    {casilla('Cobrarlo en el presupuesto','Lo ve Lucía y lo acepta con el resto',True,'ticket')}
    {casilla('Registrarlo como gasto tuyo','Con la foto del ticket cuando lo compres',True,'camara')}
    <span style="font-size: 12px; color: {SUAVE}">Pronto: el catálogo con los precios de las ferreterías de Mar del Plata.</span>''') + '\n' + accion_fija('Agregar $ 9.800','H0-Presupuesto.dc.html')
guardar('H0-AgregarMaterial.dc.html','H0 · Agregar un material',cuerpo)

# ── Agregar varios materiales a la vez ─
def it(t, sub, v, on):
    m=f'<span style="width: 26px; height: 26px; flex: none; border-radius: 8px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",15,3)}</span>' if on else f'<span style="width: 26px; height: 26px; flex: none; border-radius: 8px; border: 2px solid #C9CFDA"></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{m}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><strong style="font-size: 14px">{v}</strong></div>'
cuerpo = barra_compacta('Agregar varios','H0-Presupuesto.dc.html',sub='3 elegidos · $ 20.500') + contenido(f'''
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{chip("Tu lista",tono="azul")}{chip("Del Taller","herramienta","gris")}{chip("Kits","caja","gris")}{chip("Catálogo · pronto","flechas","gris")}</div>
    {tarjeta(etiqueta("KIT · CAMBIO DE GRIFERÍA")+it('Cartucho cerámico 35 mm','1 · $ 9.800','$ 9.800',True)+it('Flexible 40 cm','2 · $ 1.600 c/u','$ 3.200',True)+it('Llave de paso 1/2"','1 · $ 7.400','$ 7.500'.replace('7.500','7.400'),True)+it('Sellador de roscas','1 · $ 3.100','$ 3.100',False))}
    <strong style="font-size: 15px">Para todos los elegidos</strong>
    {opseg([('candadito','Precio fijo','Se congelan hoy'),('flechas','Se actualizan','Siguen tu lista')],1)}
    {casilla('Cobrarlos en el presupuesto','Suman $ 20.400 al total',True,'ticket')}
    {casilla('Registrarlos como gasto','Cuando los compres, con un solo ticket',True,'camara')}''') + '\n' + accion_fija('Agregar 3 materiales','H0-Presupuesto.dc.html')
guardar('H0-AgregarLista.dc.html','H0 · Agregar varios materiales',cuerpo)

# ── Lista de precios: qué es y de dónde salen los precios ─
def fuente(ic, t, sub, chip_html, href, fondo=MOSAICO, color=TINTA):
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; background: {fondo}; color: {color}; text-decoration: none">{svg(IC[ic],color,24)}<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; opacity: 0.8">{sub}</span></span>{chip_html}</a>'
def precio_f(t, v, fecha, fijo, viejo=False):
    al=chip("Hace 37 días","alerta","amarillo") if viejo else precio_tipo(fijo)
    return f'<a href="H0-PrecioItem.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none">{mosaico_ic("caja",40,radio=12,iconsize=18)}<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 14px">{t}</strong><span style="display: flex; gap: 6px; align-items: center"><span style="font-size: 12px; color: {SUAVE}">{fecha}</span>{al}</span></span><strong style="font-size: 15px">{v}</strong></a>'
cuerpo = barra_compacta('Tu lista de precios','F-Cuenta.dc.html') + contenido(f'''
    <div style="padding: 14px 16px; border-radius: 22px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}; display: flex; flex-direction: column; gap: 4px">{etiqueta("PARA QUÉ SIRVE","#CFE0FA")}<span style="font-size: 14px">Lo que te cuestan los materiales y lo que cobrás de mano de obra. Con esto se arman tus presupuestos en segundos.</span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px">{fuente('caja','Materiales','42 precios',"",'H0-Precios.dc.html',TINTE,HONDO)}{fuente('herramienta','Mano de obra','12 tarifas',"",'H0-ManoObra.dc.html')}</div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("PLOMERÍA · 18")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">Buscar</span></div>'+precio_f('Cartucho cerámico 35 mm','$ 9.800','05/11',False)+precio_f('Flexible 40 cm','$ 1.600','05/11',True)+precio_f('Sellador de roscas','$ 3.100','02/10',False,True))}
    <strong style="font-size: 15px">Sumar precios</strong>
    <div style="display: flex; flex-direction: column; gap: 8px">{fuente('camara','Foto de la lista del corralón','La leemos en tu teléfono y revisás cada precio',chip("Rápido","rayo","amarillo"),'H0-PreciosFoto.dc.html')}{fuente('flechas','Catálogo de ferreterías','Precios de las ferreterías de Mar del Plata',chip("Pronto",tono="gris"),'H0-Precios.dc.html')}</div>''') + '\n' + accion_fija(svg(IC['mas'],'#FFFFFF',20)+'Agregar un precio a mano','H0-PrecioItem.dc.html')
guardar('H0-Precios.dc.html','H0 · Lista de precios',cuerpo)

# ── Foto de la lista del corralón ─
filas=''.join(f'<div style="position: absolute; left: 34px; right: 34px; top: {y}px; height: 18px; border-radius: 4px; {"background: rgba(245,245,154,0.55); box-shadow: 0 0 0 2px "+AMARILLO if on else "background: rgba(255,255,255,0.18)"}"></div>' for y,on in [(110,True),(140,True),(170,False),(200,True),(230,True),(260,True),(290,False),(320,True)])
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: {NOCHE}"></div>
  <div aria-hidden="true" style="position: absolute; left: 22px; right: 22px; top: 80px; height: 420px; border-radius: 10px; background: #E9E6DD; transform: rotate(-2deg)">
    <div style="position: absolute; left: 34px; top: 40px; width: 140px; height: 16px; border-radius: 4px; background: #B9B3A3"></div>
    {filas}
  </div>
  <a href="H0-Precios.dc.html" aria-label="Cerrar" style="position: absolute; top: 16px; left: 16px; width: 48px; height: 48px; border-radius: 16px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>
  <span style="position: absolute; top: 28px; right: 16px">{chip("6 precios encontrados","check","amarillo")}</span>
  <div style="position: absolute; left: 16px; right: 16px; top: 530px; color: #FFFFFF; display: flex; flex-direction: column; gap: 6px; text-align: center"><strong style="{TIT}; font-size: 24px">Corralón Simulación · 05/11</strong><span style="font-size: 14px; color: #C9D5EA">Se lee en tu teléfono: la foto no sale de acá. Las filas marcadas son las que entendimos.</span></div>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 24px; display: grid; grid-template-columns: 64px minmax(0,1fr); gap: 10px">
    <span style="height: 64px; border-radius: 20px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center">{svg(IC['camara'],'#FFFFFF',26)}</span>
    <a href="H0-PreciosRevisar.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 64px; border-radius: 20px; background: {AMARILLO}; color: {TINTA}; font-size: 17px; font-weight: 900; text-decoration: none; box-shadow: 0 5px 0 #C9C85A">Revisar 6 precios</a>
  </div>'''
guardar('H0-PreciosFoto.dc.html','H0 · Foto de la lista',cuerpo)

# ── Revisar lo que se leyó ─
def leido(t, antes, ahora, est):
    e={'nuevo':chip("Nuevo",tono="tinte"),'sube':chip("Sube 8 %","flechas","amarillo"),'igual':chip("Igual","check","exito"),'duda':chip("Revisá","alerta","error")}[est]
    a=f'<span style="font-size: 12px; color: {SUAVE}; text-decoration: line-through">{antes}</span>' if antes else ''
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="width: 26px; height: 26px; flex: none; border-radius: 8px; background: {AZUL if est!="duda" else "#FFFFFF"}; border: 2px solid {AZUL if est!="duda" else "#C9CFDA"}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",15,3) if est!="duda" else ""}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 14px">{t}</strong>{e}</span><span style="display: flex; flex-direction: column; align-items: flex-end">{a}<strong style="font-size: 15px">{ahora}</strong></span></div>'
cuerpo = barra_compacta('Revisá los precios','H0-PreciosFoto.dc.html',sub='Corralón Simulación · 05/11') + contenido(f'''
    {tarjeta(leido('Cartucho cerámico 35 mm','$ 9.100','$ 9.800','sube')+leido('Flexible 40 cm','$ 1.600','$ 1.600','igual')+leido('Llave de paso 1/2"','$ 6.900','$ 7.400','sube')+leido('Termofusión 20 mm (tira)','','$ 5.900','nuevo')+leido('Codo 20 mm','','$ 1?0','duda')+leido('Teflón 12 mm','$ 2.300','$ 2.300','igual'))}
    <div style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 16px; background: {TINTE}">{svg(IC['flechas'],HONDO,20)}<span style="font-size: 13px; color: {HONDO}">2 precios suben. Los presupuestos abiertos con precio que se actualiza te van a avisar.</span></div>''') + '\n' + accion_fija('Guardar 5 precios','H0-Precios.dc.html')
guardar('H0-PreciosRevisar.dc.html','H0 · Revisar lo leído',cuerpo)

# ── Detalle de un precio: historial, margen y cómo se usa ─
barras=''.join(f'<span style="display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1"><span style="font-size: 11px; font-weight: 800; color: {AZUL if i==3 else SUAVE}">{v}</span><span style="width: 100%; height: {h}px; border-radius: 8px 8px 4px 4px; background: {AZUL if i==3 else "#C9D6EC"}"></span><span style="font-size: 11px; color: {SUAVE}">{m}</span></span>' for i,(v,h,m) in enumerate([('8,4',70,'Ago'),('8,9',78,'Sep'),('9,1',82,'Oct'),('9,8',92,'Nov')]))
cuerpo = barra_compacta('Cartucho cerámico 35 mm','H0-Precios.dc.html',sub='Plomería · tu lista') + contenido(f'''
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px">
      <div style="padding: 12px 14px; border-radius: 18px; background: {MOSAICO}; display: flex; flex-direction: column"><span style="font-size: 11px; font-weight: 800; color: {SUAVE}">TE CUESTA</span><strong style="{TIT}; font-size: 24px">$ 9.800</strong><span style="font-size: 11px; color: {SUAVE}">Corralón Simulación · 05/11</span></div>
      <div style="padding: 12px 14px; border-radius: 18px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}; display: flex; flex-direction: column"><span style="font-size: 11px; font-weight: 800; color: #CFE0FA">AL CLIENTE</span><strong style="{TIT}; font-size: 24px">$ 9.800</strong><span style="font-size: 11px; color: #F0F5FD">Margen 0 % · lo decidís vos</span></div>
    </div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("CÓMO VARIÓ · MILES DE PESOS")}{chip("+17 % en 4 meses","flechas","amarillo")}</div><div role="img" aria-label="Agosto 8.400, septiembre 8.900, octubre 9.100, noviembre 9.800" style="display: flex; align-items: flex-end; gap: 10px; height: 130px">{barras}</div>')}
    <strong style="font-size: 15px">En presupuestos nuevos</strong>
    {opseg([('candadito','Precio fijo','Se congela al presupuestar'),('flechas','Se actualiza','Sigue esta lista')],1)}
    <div>{interr("Avisarme si tiene más de 30 días","Para pedir una lista nueva al corralón",True)}</div>''') + '\n' + accion_fija('Guardar','H0-Precios.dc.html')
guardar('H0-PrecioItem.dc.html','H0 · Detalle de un precio',cuerpo)

# ── Tus tarifas de mano de obra ─
def tarifa(t, sub, v):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{mosaico_ic("herramienta",40,radio=12,iconsize=18)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><strong style="{TIT}; font-size: 17px">{v}</strong></div>'
cuerpo = barra_compacta('Mano de obra','H0-Precios.dc.html',sub='Tus tarifas') + contenido(f'''
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">
      <div style="padding: 12px; border-radius: 18px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}"><span style="font-size: 11px; font-weight: 800; color: #CFE0FA">HORA</span><strong style="display: block; {TIT}; font-size: 20px">$ 22.000</strong></div>
      <div style="padding: 12px; border-radius: 18px; background: {MOSAICO}"><span style="font-size: 11px; font-weight: 800; color: {SUAVE}">VISITA</span><strong style="display: block; {TIT}; font-size: 20px">$ 12.000</strong></div>
      <div style="padding: 12px; border-radius: 18px; background: {MOSAICO}"><span style="font-size: 11px; font-weight: 800; color: {SUAVE}">URGENCIA</span><strong style="display: block; {TIT}; font-size: 20px">+ 30 %</strong></div>
    </div>
    {tarjeta(etiqueta("POR TAREA · PLOMERÍA")+tarifa('Cambio de cartucho','Incluye prueba','$ 28.000')+tarifa('Prueba de pérdidas','Hasta 1 hora','$ 6.000')+tarifa('Cambio de flexible','Por unidad','$ 9.000')+tarifa('Destapación','Sin máquina','$ 25.000'))}
    <span style="font-size: 12px; color: {SUAVE}">Son tus precios: Handyx solo sugiere para cada pedido y vos decidís.</span>''') + '\n' + accion_fija(svg(IC['mas'],'#FFFFFF',20)+'Agregar una tarea','H0-ManoObra.dc.html')
guardar('H0-ManoObra.dc.html','H0 · Tarifas de mano de obra',cuerpo)

# ── Cargar gasto: también se puede cobrar al cliente ─
ticket=f'''<div style="position: relative; height: 170px; border-radius: 22px; background: {NOCHE}; overflow: hidden">
      <div style="position: absolute; left: 50%; top: 14px; margin-left: -70px; width: 140px; height: 160px; background: #FFFFFF; border-radius: 6px; box-shadow: {ELEV2}; padding: 12px; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; transform: rotate(-3deg)"><span style="height: 8px; width: 70%; background: {MOSAICO}; border-radius: 4px"></span><span style="height: 6px; width: 90%; background: {AMARILLO}; border-radius: 3px"></span><span style="height: 6px; width: 85%; background: {AMARILLO}; border-radius: 3px"></span><span style="margin-top: auto; height: 10px; width: 60%; align-self: flex-end; background: {AMARILLO}; border-radius: 4px"></span></div>
      <span style="position: absolute; left: 12px; bottom: 10px">{chip("Leído en tu teléfono","check","exito")}</span>
    </div>'''
def campo(et, v):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 48px; border-radius: 14px; border: 1px solid {BORDE}; background: #FFFFFF; display: flex; align-items: center; padding: 0 14px; font-size: 15px; font-weight: 700">{v}</span></div>'
cuerpo = barra_compacta('Cargar un gasto','F-Ingresos.dc.html') + contenido(f'''
    {ticket}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{campo("Monto","$ 13.000")}{campo("Trabajo","Pierde la canilla")}</div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{chip("Materiales","caja","azul")}{chip("Combustible","camion","gris")}{chip("Herramientas","herramienta","gris")}{chip("Otro",tono="gris")}</div>
    {casilla('Registrarlo como gasto','Suma a tus gastos y baja tu neto',True,'billete')}
    {casilla('Cobrárselo al cliente','Va como adicional: Lucía lo acepta en el chat',False,'ticket')}''') + '\n' + accion_fija('Guardar gasto','F-Ingresos.dc.html')
guardar('H0-Gasto.dc.html','H0 · Cargar gasto',cuerpo)

# ── Modo trabajo, claro y cómodo: tareas, repuestos, llamar, agenda y herramientas ─
def tarea(t, sub, est):
    if est=='ok': m=f'<span style="width: 34px; height: 34px; flex: none; border-radius: 11px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",20,3)}</span>'; st=f'color: {SUAVE}; text-decoration: line-through'
    elif est=='ahora': m=f'<span style="width: 34px; height: 34px; flex: none; border-radius: 11px; border: 3px solid {AZUL}; background: #FFFFFF"></span>'; st='font-weight: 800'
    else: m=f'<span style="width: 34px; height: 34px; flex: none; border-radius: 11px; border: 2px solid #C9CFDA"></span>'; st='font-weight: 700'
    fondo=f'background: {TINTE}; border-radius: 16px; padding: 10px;' if est=='ahora' else 'padding: 10px;'
    s=f'<span style="font-size: 12px; color: {SUAVE}">{sub}</span>' if sub else ''
    return f'<div style="display: flex; gap: 12px; align-items: center; min-height: 56px; box-sizing: border-box; {fondo}">{m}<span style="flex: 1; display: flex; flex-direction: column"><span style="font-size: 15px; {st}">{t}</span>{s}</span></div>'
def dock(ic, t, href, prim=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}' if prim else f'background: #FFFFFF; color: {TINTA}; border: 1px solid {BORDE}; box-shadow: {ELEV1}'
    return f'<a href="{href}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 72px; border-radius: 20px; {s}; font-size: 12px; font-weight: 800; text-decoration: none">{svg(IC[ic],"#FFFFFF" if prim else AZUL,24)}{t}</a>'
cuerpo = f'''  <section style="position: absolute; top: 0; left: 0; right: 0; padding: 14px 16px 18px; background: {AZUL}; border-radius: 0 0 30px 30px; color: #FFFFFF; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 12px 30px -16px rgba(14,29,54,0.55)">
    <div style="display: flex; justify-content: space-between; align-items: center"><a href="F-Trabajo.dc.html" aria-label="Salir del Modo trabajo" style="width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',20)}</a>{chip("Modo trabajo","herramienta","amarillo")}<a href="F-Chat.dc.html" aria-label="Chat con Lucía" style="width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['chat'],'#FFFFFF',20)}</a></div>
    <div style="display: flex; justify-content: space-between; align-items: flex-end"><span style="display: flex; flex-direction: column; gap: 2px"><strong style="{TIT}; font-size: 22px; line-height: 1.05">Pierde la canilla</strong><span style="font-size: 13px; color: #F0F5FD">Lucía Ferreyra · Centro · hasta las 20</span></span><span style="display: flex; flex-direction: column; align-items: flex-end"><span style="{TIT}; font-size: 30px; line-height: 1; font-variant-numeric: tabular-nums">24:18</span><span style="font-size: 11px; color: #F0F5FD">en esta tarea</span></span></div>
    <div style="display: flex; gap: 6px">{''.join(f'<span style="flex: 1; height: 6px; border-radius: 3px; background: {c}"></span>' for c in [AMARILLO,AMARILLO,'rgba(255,255,255,0.25)','rgba(255,255,255,0.25)'])}</div>
  </section>
''' + contenido(f'''
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("TUS TAREAS · 2 DE 4")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">+ Tarea</span></div>'+tarea('Cerrar la llave y descargar presión','Seguridad','ok')+tarea('Sacar el cartucho viejo','','ok')+tarea('Colocar el cartucho nuevo','Usás: cartucho cerámico 35 mm','ahora')+tarea('Probar sin pérdidas 10 minutos','Seguridad','falta'))}
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 8px">{dock('camara','Foto','H0-AntesDespues.dc.html')}{dock('caja','Repuestos','H0-AgregarMaterial.dc.html')}{dock('telefono','Pedir ayuda','H0-ModoAyuda.dc.html')}{dock('agenda','Agenda','H0-ModoAgenda.dc.html')}</div>
    <a href="H0-ModoHerramientas.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 20px; background: {MOSAICO}; color: {TINTA}; text-decoration: none">{mosaico_ic('herramienta',44,fondo='#FFFFFF',color=AZUL,radio=14,iconsize=22)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Herramientas</strong><span style="font-size: 12px; color: {SUAVE}">Nivel, linterna, lupa, calculadoras y Taller</span></span>{svg(IC['flecha'],SUAVE,18)}</a>''', top=168) + '\n' + acciones_fijas(f'<div style="display: grid; grid-template-columns: 64px minmax(0,1fr); gap: 10px"><button aria-label="Pausar" style="min-height: 58px; border-radius: 18px; border: 0; background: {AMARILLO}; box-shadow: 0 4px 0 #C9C85A; display: flex; align-items: center; justify-content: center">{svg(IC["pausa"],TINTA,24,3)}</button>{boton("Tarea lista · siguiente","H0-Modo.dc.html",alto=58)}</div>', f'<a href="TR-Cobro.dc.html" style="text-align: center; font-size: 14px; font-weight: 800; text-decoration: none; min-height: 44px; display: flex; align-items: center; justify-content: center">Terminé el trabajo</a>')
guardar('H0-Modo.dc.html','H0 · Modo trabajo',cuerpo)

# Herramientas a mano dentro del Modo trabajo.
def herr(ic, t, sub, href, prim=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}' if prim else f'background: {MOSAICO}; color: {TINTA}'
    return f'<a href="{href}" style="padding: 14px; border-radius: 22px; {s}; text-decoration: none; display: flex; flex-direction: column; gap: 6px; min-height: 112px; box-sizing: border-box">{svg(IC[ic],"#FFFFFF" if prim else AZUL,28)}<strong style="font-size: 15px">{t}</strong><span style="font-size: 11px; opacity: 0.8">{sub}</span></a>'
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><h1 style="margin: 0; {TIT}; font-size: 26px">Herramientas</h1>{chip("Sin salir del trabajo","herramienta","tinte")}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{herr('nivel','Nivel','Giroscopio','T-Taller.dc.html',True)}{herr('linterna','Linterna','Flash','H0-Modo.dc.html')}{herr('lupa','Lupa','Cámara con zoom','H0-Modo.dc.html')}{herr('regla','Medir','Con la cámara','H0-Modo.dc.html')}{herr('rayo','Calculadoras','Del Taller','T-Cables.dc.html')}{herr('escaner','Código de barras','Sumar material','H0-AgregarMaterial.dc.html')}</div>
    {tarjeta(fila_ic('micro','Nota de voz','Se guarda en el trabajo',href='H0-Modo.dc.html',borde=False)+fila_ic('escudo','Checklist de seguridad','Plomería · 6 puntos',href='H0-Modo.dc.html'))}''', 210)
guardar('H0-ModoHerramientas.dc.html','H0 · Herramientas a mano',cuerpo)

# Pedir ayuda a otro profesional.
def pro(k, rubro, est, accion):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}">{avatar(k,46)}<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{nombre(k)}</strong><span style="display: flex; gap: 6px; flex-wrap: wrap">{chip(rubro,tono="gris")}{est}</span></span>{accion}</div>'
def btn_ic(ic, label, prim=False):
    return f'<span role="button" aria-label="{label}" style="width: 48px; height: 48px; border-radius: 16px; {"background: "+AZUL+"; box-shadow: 0 3px 0 "+HONDO if prim else "background: "+MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC[ic],"#FFFFFF" if prim else TINTA,22)}</span>'
cuerpo = barra_compacta('Pedir ayuda','H0-Modo.dc.html',sub='Pierde la canilla') + contenido(f'''
    {titulo_grande("SIN SALIR DEL TRABAJO","¿A quién ","llamás","?")}
    {tarjeta(etiqueta("TUS CONTACTOS")+pro('diego','Electricidad',chip("Disponible","check","exito"),f'<span style="display: flex; gap: 6px">{btn_ic("chat","Mensaje")}{btn_ic("telefono","Llamar",True)}</span>')+pro('pablo','Gas',chip("Ocupado hasta 19","reloj","amarillo"),f'<span style="display: flex; gap: 6px">{btn_ic("chat","Mensaje")}{btn_ic("telefono","Llamar",True)}</span>')+pro('sofia','Albañilería',chip("En obra","obra","tinte"),f'<span style="display: flex; gap: 6px">{btn_ic("chat","Mensaje")}{btn_ic("telefono","Llamar",True)}</span>'))}
    {tarjeta(fila_ic('usuario2','Sumarlo a este trabajo','Lo invitás y se acuerda el reparto',href='F-Invitar.dc.html',borde=False)+fila_ic('herramienta','Consultar al Taller','Calculadoras y referencias del oficio',href='T-Taller.dc.html'))}''')
guardar('H0-ModoAyuda.dc.html','H0 · Pedir ayuda',cuerpo)

# Organizar la agenda desde el trabajo.
def sig(h, t, sub, chip_html, href):
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 58px; height: 52px; flex: none; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 16px">{h}</span><span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{chip_html}</a>'
def aviso_btn(t):
    return f'<span style="min-height: 46px; padding: 0 14px; border-radius: 14px; background: {MOSAICO}; display: inline-flex; align-items: center; font-size: 14px; font-weight: 800">{t}</span>'
cuerpo = barra_compacta('Tu agenda','H0-Modo.dc.html',sub='Desde el trabajo') + contenido(f'''
    <div style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 18px; background: {AMARILLO}">{svg(IC['reloj'],TINTA,20)}<span style="font-size: 13px; font-weight: 800">Este trabajo va 20 minutos más de lo previsto.</span></div>
    {tarjeta(etiqueta("LO QUE SIGUE")+sig('8:30','Baño completo · jornada 4','Mañana · Los Troncos · con Sofía',chip("Faltan 2 repuestos","alerta","error"),'F-Obra.dc.html')+sig('11:00','Revisión de termotanque','Mañana · Chauvín · Carla Ibáñez',chip("Agendado","agenda","noche"),'F-Trabajo.dc.html'))}
    <strong style="font-size: 15px">Avisarle al próximo cliente</strong>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{aviso_btn("Llego 15 min tarde")}{aviso_btn("Llego 30 min tarde")}{aviso_btn("Proponer otro horario")}</div>
    <span style="font-size: 12px; color: {SUAVE}">Se manda por el chat del trabajo cuando lo tocás. Nada se manda solo.</span>''') + '\n' + accion_fija(svg(IC['agenda'],'#FFFFFF',20)+'Ver el mes','F-AgendaMes.dc.html')
guardar('H0-ModoAgenda.dc.html','H0 · Agenda desde el trabajo',cuerpo)
print('ok')
