import sys; sys.path.insert(0,'gen')
from piezas2 import *

def btn_circ(ic, href, label, fondo='#FFFFFF', color=TINTA):
    return f'<a href="{href}" aria-label="{label}" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; background: {fondo}; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center">{svg(IC[ic],color,20)}</a>'
def banner(texto, href, ic='alerta'):
    return f'<a href="{href}" style="display: flex; align-items: center; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 11px 14px; border-radius: 16px; background: {AMARILLO}; color: {TINTA}; text-decoration: none; font-size: 13px; font-weight: 800">{svg(IC[ic],TINTA,18)}<span style="flex: 1">{texto}</span>{svg(IC["flecha"],TINTA,16)}</a>'
def dato_mini(et, v, sub='', fondo=MOSAICO, color=TINTA):
    s=f'<span style="font-size: 11px; color: {SUAVE}">{sub}</span>' if sub else ''
    return f'<div style="min-width: 0; padding: 10px 12px; border-radius: 16px; background: {fondo}; display: flex; flex-direction: column; gap: 1px"><span style="font-size: 11px; font-weight: 800; color: {SUAVE}">{et}</span><strong style="{TIT}; font-size: 16px; color: {color}; font-stretch: 100%; letter-spacing: -0.2px; white-space: nowrap">{v}</strong>{s}</div>'

# ── Agenda (tira horizontal) con acceso al mes completo ─────────────
def dia_tira(n, d, est=''):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if est=='sel' else f'background: {MOSAICO}; color: {TEXTO}'
    pt=f'<span style="width: 5px; height: 5px; border-radius: 50%; background: {NARANJA if est=="sel" else AZUL}"></span>' if est in ('sel','pt') else '<span style="height: 5px"></span>'
    return f'<span style="flex: none; width: 52px; padding: 8px 0; border-radius: 16px; {s}; display: flex; flex-direction: column; align-items: center; gap: 2px"><span style="font-size: 11px; font-weight: 800">{d}</span><strong style="{TIT}; font-size: 18px">{n}</strong>{pt}</span>'
def turno(h1, h2, t, sub, href, chip_html='', gente=''):
    g=f'<span style="margin-top: 2px">{gente}</span>' if gente else ''
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: stretch; color: {TINTA}; text-decoration: none"><span style="width: 64px; flex: none; border-radius: 18px; background: {MOSAICO}; display: flex; flex-direction: column; align-items: center; justify-content: center"><strong style="{TIT}; font-size: 17px">{h1}</strong><span style="font-size: 11px; color: {SUAVE}">a {h2}</span></span><span style="flex: 1; min-width: 0; padding: 12px 14px; border-radius: 18px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 4px"><span style="display: flex; justify-content: space-between; gap: 8px"><strong style="font-size: 15px">{t}</strong>{chip_html}</span><span style="font-size: 13px; color: {SUAVE}">{sub}</span>{g}</span></a>'
tira=''.join([dia_tira(14,'SÁB'),dia_tira(15,'DOM'),dia_tira(16,'LUN'),dia_tira(17,'MAR','sel'),dia_tira(18,'MIÉ','pt'),dia_tira(19,'JUE','pt'),dia_tira(20,'VIE','pt'),dia_tira(21,'SÁB')])
cuerpo = contenido(f'''
    <div style="display: flex; justify-content: space-between; align-items: flex-end">{titulo_grande("NOVIEMBRE 2026","Tu ","agenda")}<a href="F-AgendaMes.dc.html" style="display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 14px; border-radius: 14px; background: {AZUL}; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; box-shadow: 0 3px 0 {HONDO}">{svg(IC['agenda'],'#FFFFFF',18)}Ver el mes</a></div>
    <div aria-label="Días, deslizá para ver más" style="display: flex; gap: 6px; margin: 0 -16px; padding: 0 16px; overflow: hidden">{tira}</div>
    <strong style="font-size: 15px">Hoy, martes 17</strong>
    {turno("9:00","17:00","Baño completo","Obra · jornada 3 de 6 · Los Troncos","F-ObraDia.dc.html", chip("Obra","obra","tinte"), avatares(['yo','sofia']))}
    {turno("18:00","20:00","Pierde la canilla","Plomería · Centro · $ 47.000","F-Trabajo.dc.html", chip("Agendado","agenda","noche"), avatares(['lucia']))}
    {banner("Mañana: faltan 2 repuestos para «Baño completo»","F-ObraRepuestos.dc.html")}''', top=26) + '\n' + barra_vidrio('Taller')
guardar('F-Agenda.dc.html','Núcleo · Agenda',cuerpo)

# ── Agenda: mes completo en pantalla entera, con meses pasados ──────
ev={3:['hecho'],5:['hecho'],9:['hecho'],10:['hecho'],12:['obra'],13:['obra'],17:['obra','trabajo'],18:['obra'],19:['obra','obra2'],20:['obra'],24:['trabajo'],26:['obra2'],27:['obra2']}
col={'hecho':'#B5BCC8','obra':AZUL,'obra2':NOCHE,'trabajo':AMARILLO}
cab=''.join(f'<span style="text-align: center; font-size: 11px; font-weight: 800; color: {SUAVE}">{d}</span>' for d in 'LMMJVSD')
celdas=['<span></span>']*6
for d in range(1,31):
    barras=''.join(f'<span style="height: 5px; border-radius: 3px; background: {col[e]}"></span>' for e in ev.get(d,[]))
    if d==17: est=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}'; barras=barras.replace(f'background: {AZUL}','background: #FFFFFF')
    elif d<17: est=f'background: #F6F7F9; color: #56627A'
    else: est=f'background: #F6F7F9'
    actual=' aria-current="date"' if d==17 else ''
    celdas.append(f'<span{actual} style="height: 58px; padding: 6px 5px; box-sizing: border-box; border-radius: 12px; {est}; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 13px">{d}</strong>{barras}</span>')
grilla=f'<div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px">{cab}{"".join(celdas)}</div>'
leyenda=''.join(f'<span style="display: inline-flex; align-items: center; gap: 5px"><span style="width: 14px; height: 5px; border-radius: 3px; background: {c}"></span>{t}</span>' for c,t in [(AZUL,'Baño completo'),(NOCHE,'Tablero'),(AMARILLO,'Trabajos'),('#B5BCC8','Hechos')])
cuerpo = barra_compacta('Agenda','F-Agenda.dc.html',sub='Mes completo', accion=btn_circ('lista','F-Agenda.dc.html','Ver como lista')) + contenido(f'''
    <div style="display: flex; align-items: center; justify-content: space-between">{btn_circ('atras','F-AgendaMes.dc.html','Octubre')}<span style="display: flex; flex-direction: column; align-items: center"><strong style="{TIT}; font-size: 24px">Noviembre 2026</strong><span style="font-size: 12px; color: {SUAVE}">14 trabajos · 2 obras</span></span>{btn_circ('flecha','F-AgendaMes.dc.html','Diciembre')}</div>
    <div style="display: flex; gap: 8px">{chip("Todo",tono="azul")}{chip("Obras","obra","gris")}{chip("Trabajos","herramienta","gris")}{chip("Hoy","reloj","amarillo")}</div>
    {grilla}
    <div style="display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 11px; color: {SUAVE}">{leyenda}</div>
    {tarjeta(f'<strong style="font-size: 15px">Martes 17</strong>' + fila_ic('obra','9 a 17 · Baño completo','Jornada 3 de 6 · Martín Sosa',href='F-ObraDia.dc.html') + fila_ic('gota','18 a 20 · Pierde la canilla','Plomería · Lucía Ferreyra',href='F-Trabajo.dc.html'))}''')
guardar('F-AgendaMes.dc.html','Núcleo · Agenda del mes',cuerpo)

# ── Tus obras (lista) ──────────────────────────────────────────────
def obra_card(titulo, cliente, zona, anillo_html, chip_html, equipo, datos, href, alerta=''):
    al=f'<div style="padding: 0 16px 12px">{alerta}</div>' if alerta else ''
    cont=f'''<div style="display: flex; align-items: center; gap: 12px">{anillo_html}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><strong style="{TIT}; font-size: 20px; line-height: 1.05">{titulo}</strong><span style="font-size: 13px; color: {SUAVE}">{cliente} · {zona}</span></span>{avatares(equipo,28)}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px">{chip_html}<span style="font-size: 12px; color: {SUAVE}; font-weight: 700">{datos}</span></div>'''
    return f'<section style="border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; overflow: hidden"><div style="padding: 16px; display: flex; flex-direction: column; gap: 10px">{cont}</div>{al}{franja("Ver la obra", href)}</section>'
cuerpo = contenido(f'''
    <div style="display: flex; justify-content: space-between; align-items: flex-end">{titulo_grande("2 EN CURSO · 1 PRÓXIMA","Tus ","obras")}<a href="F-ObraNueva.dc.html" aria-label="Proponer una obra nueva" style="width: 48px; height: 48px; border-radius: 16px; background: {AZUL}; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center">{svg(IC['mas'],'#FFFFFF',22)}</a></div>
    <div style="display: flex; gap: 8px">{chip("En curso · 2",tono="azul")}{chip("Próximas · 1",tono="gris")}{chip("Terminadas · 4",tono="gris")}</div>
    {obra_card("Baño completo","Martín Sosa","Los Troncos",anillo(2,4),chip("Hoy · día 3 de 6","reloj","amarillo"),['yo','sofia','diego'],"Gastado $ 210.000","F-Obra.dc.html",banner("Faltan 2 repuestos para mañana","F-ObraRepuestos.dc.html"))}
    {obra_card("Tablero y circuitos","Carla Ibáñez","Punta Mogotes",anillo(0,3),chip("Empieza el jueves 19","agenda","noche"),['yo','diego'],"3 jornadas","F-Obra.dc.html")}
    <a href="F-ObraNueva.dc.html" style="display: flex; gap: 12px; align-items: center; min-height: 64px; padding: 10px 14px; border-radius: 22px; border: 2px dashed #C9CFDA; color: {TINTA}; text-decoration: none">{mosaico_ic('mas',44,fondo=AMARILLO,radio=14,iconsize=22)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Proponer una obra nueva</strong><span style="font-size: 12px; color: {SUAVE}">A un cliente tuyo o a uno nuevo</span></span>{svg(IC['flecha'],AZUL,18)}</a>''', top=26) + '\n' + barra_vidrio('Obras')
guardar('F-Obras.dc.html','Obras · Tus obras',cuerpo)

# ── Obra: overview compacto + días en lista ─────────────────────────
def dia_fila(dsem, num, titulo, sub, est, extra='', href='F-ObraDia.dc.html'):
    if est=='hecha': m=f'background: {AZUL}; color: #FFFFFF'; c=chip("Hecha","check","exito")
    elif est=='hoy': m=f'background: #FFFFFF; box-shadow: inset 0 0 0 3px {NARANJA}'; c=chip("Hoy","reloj","amarillo")
    elif est=='cambio': m=f'background: {MOSAICO}; color: {TEXTO}'; c=chip("Cambio pedido","agenda","tinte")
    else: m=f'background: {MOSAICO}; color: {TEXTO}'; c=''
    x=f'<span style="font-size: 12px; font-weight: 800; color: {"#A8261C" if "falta" in extra.lower() else HONDO}">{extra}</span>' if extra else ''
    fondo = f'background: {TINTE};' if est=='hoy' else ''
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 7px 8px; border-radius: 16px; {fondo} border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 50px; height: 52px; flex: none; border-radius: 14px; {m}; display: flex; flex-direction: column; align-items: center; justify-content: center"><span style="font-size: 11px; font-weight: 800">{dsem}</span><strong style="{TIT}; font-size: 17px">{num}</strong></span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px"><strong style="font-size: 14px">{titulo}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span>{x}</span>{c}</a>'
dias=''.join([
 dia_fila('JUE','12','Jornada 1 · Demolición','Julián y Sofía · 4 fotos','hecha'),
 dia_fila('VIE','13','Jornada 2 · Cañerías','Julián · prueba sin pérdidas','hecha'),
 dia_fila('MAR','17','Jornada 3 · Revestimiento','9 a 17 · Julián y Sofía','hoy'),
 dia_fila('MIÉ','18','Jornada 4 · Revestimiento','8:30 a 16 · Sofía','',extra='Falta comprar: pegamento y pastina'),
 dia_fila('JUE','19','Jornada 5 · Sanitarios','Pediste moverla al lunes 23','cambio',extra='Espera la respuesta de Martín'),
 dia_fila('VIE','20','Jornada 6 · Terminación','Julián y Diego','',extra='1 repuesto sin aprobar'),
])
cuerpo = barra_compacta('Obra','F-Obras.dc.html',accion=btn_circ('chat','F-ChatGrupo.dc.html','Chat de la obra')) + contenido(f'''
    <div style="display: flex; align-items: center; gap: 12px">{anillo(2,4,58)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><strong style="{TIT}; font-size: 24px; line-height: 1">Baño completo</strong><span style="font-size: 13px; color: {SUAVE}">Martín Sosa · Los Troncos</span></span>{avatares(['yo','sofia','diego'],30)}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{dato_mini("EN OBRA","Día 3 de 6","7 días desde el 12/11")}{dato_mini("GASTADO","$ 210.000","en materiales")}{dato_mini("FALTA COBRAR","$ 450.000","de $ 850.000",TINTE,AZUL)}</div>
    {tabs([("Días","F-Obra.dc.html"),("Repuestos <span role='img' aria-label='faltan comprar' style='display: inline-block; width: 8px; height: 8px; margin-left: 4px; border-radius: 50%; background: #D93025'></span>","F-ObraRepuestos.dc.html"),("Equipo · 3","F-ObraEquipo.dc.html"),("Plata","F-Reparto.dc.html")],"Días")}
    <div style="margin-top: -8px">{dias}</div>''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px">{boton(svg(IC["camara"],"#FFFFFF",20)+"Cargar el avance","F-ObraDia.dc.html",alto=52)}{boton2("Agregar","F-ObraRepuesto.dc.html","mas")}</div>')
guardar('F-Obra.dc.html','Obras · Obra (resumen y días)',cuerpo)

# ── Obra · una jornada ─────────────────────────────────────────────
def tarea(t, ok, quien):
    m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 9px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3)}</span>' if ok else f'<span style="width: 28px; height: 28px; flex: none; border-radius: 9px; border: 2px solid #C9CFDA"></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 8px 0">{m}<span style="flex: 1; font-size: 14px; {"color: "+SUAVE+"; text-decoration: line-through" if ok else "font-weight: 700"}">{t}</span>{avatar(quien,26)}</div>'
fotos=''.join(f'<span style="aspect-ratio: 1; border-radius: 14px; background: {c}; display: flex; align-items: center; justify-content: center">{svg(IC["camara"],SUAVE,20) if i<2 else svg(IC["mas"],AZUL,22)}</span>' for i,c in enumerate(['#DCE3EE','#E9E2D3',TINTE]))
cuerpo = barra_compacta('Jornada 3 de 6','F-Obra.dc.html',sub='Hoy · martes 17 · 9 a 17') + contenido(f'''
    <div style="display: flex; justify-content: space-between; align-items: center">{chip("Revestimiento · etapa 3","obra","tinte")}<span style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: {SUAVE}">{avatares(['yo','sofia'],28)}Julián y Sofía</span></div>
    {tarjeta(etiqueta("TAREAS DE HOY")+tarea("Pared de la ducha",True,'sofia')+tarea("Pared del lavatorio",False,'sofia')+tarea("Cortes alrededor de la grifería",False,'yo'))}
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("FOTOS Y NOTA · LAS VE MARTÍN")}<span style="font-size: 12px; color: {SUAVE}">2 de hoy</span></div><div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{fotos}</div><span style="font-size: 14px; color: {TEXTO}">«Ducha terminada. Mañana sigue la pared del lavatorio.»</span>')}
    {tarjeta(etiqueta("MATERIALES DE HOY")+fila_ic('caja','Porcelanato 60 × 60 y pegamento × 2','Comprado el 14/11 y de tu stock',href='F-ObraRepuestos.dc.html',borde=False))}''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px">{boton("Guardar el avance","F-Obra.dc.html",alto=52)}{boton2("Cambiar fecha","F-ObraFecha.dc.html","agenda")}</div>')
guardar('F-ObraDia.dc.html','Obras · Jornada',cuerpo)

# ── Obra · repuestos (comprar a futuro, aprobación, avisos) ─────────
def rep(t, sub, chip_html, accion=''):
    a=f'<span style="font-size: 12px; font-weight: 800; color: {AZUL}">{accion}</span>' if accion else ''
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{mosaico_ic("caja",40,radio=12,iconsize=18)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span><span style="display: flex; gap: 6px; align-items: center">{chip_html}{a}</span></span></div>'
cuerpo = barra_compacta('Repuestos','F-Obra.dc.html',sub='Baño completo') + contenido(f'''
    {banner("Mañana (mié 18) faltan 2: pegamento y pastina","F-ObraRepuestos.dc.html")}
    {tarjeta(etiqueta("ESPERAN LA APROBACIÓN DE MARTÍN")+rep("Pegamento para porcelanato × 4","Para la jornada 4 · mié 18 · $ 36.000",chip("Enviado hoy 12:10","reloj","amarillo"),"Recordarle")+rep("Inodoro corto con mochila","Para la jornada 6 · vie 20 · $ 145.000",chip("Sin mandar","alerta","error"),"Mandar a aprobación"))}
    {tarjeta(etiqueta("APROBADOS · SE COMPRAN")+rep("Pastina gris × 2","Martín aprobó · comprar mañana 8:00",chip("Ferretería Simulación","pin","tinte"),"Pedir"))}
    {tarjeta(etiqueta("COMPRADOS")+rep("Porcelanato, caños y 3 más","Del 12/11 al 14/11 · $ 210.000 en total",chip("5 tickets cargados","check","exito"),"Ver"))}''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px">{boton("Pedir en ferretería","R-Comparar.dc.html",alto=52)}{boton2("Agregar","F-RepuestoOrigen.dc.html","mas")}</div>')
guardar('F-ObraRepuestos.dc.html','Obras · Repuestos',cuerpo)

# ── Obra · agregar un repuesto para comprar a futuro ───────────────
def interr(t, sub, on):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div role="switch" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span aria-hidden="true" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
def op(t, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<span style="min-height: 44px; padding: 0 12px; border-radius: 14px; {s}; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center">{t}</span>'
cuerpo = barra_compacta('Lo consigo yo','F-RepuestoOrigen.dc.html',sub='Agregar repuesto · Baño completo') + contenido(f'''
    <span style="min-height: 52px; border-radius: 16px; background: #FFFFFF; border: 2px solid {AZUL}; display: flex; align-items: center; gap: 10px; padding: 0 14px; font-weight: 800">{svg(IC['caja'],AZUL,20)}Pegamento para porcelanato<span style="margin-left: auto">{chip("De tu lista","lista","gris")}</span></span>
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 15px">Cantidad</strong><span style="display: flex; align-items: center; gap: 10px"><span style="width: 44px; height: 44px; border-radius: 14px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900">−</span><strong style="{TIT}; font-size: 26px; min-width: 30px; text-align: center">4</strong><span style="width: 44px; height: 44px; border-radius: 14px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900">+</span></span></div>
    <div style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">¿Para qué jornada?</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Mié 18 · j. 4",True)}{op("Jue 19 · j. 5")}{op("Vie 20 · j. 6")}{op("Sin fecha")}</div></div>
    <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 12px 14px; border-radius: 16px; background: {TINTE}"><span style="font-size: 13px; color: {HONDO}; font-weight: 700">$ 9.000 c/u · tu lista del 05/11</span><strong style="{TIT}; font-size: 22px">$ 36.000</strong></div>
    <div>{interr("Cobrárselo a Martín","Le llega al chat de la obra para aprobar; hasta entonces, queda en espera",True)}{interr("Registrarlo como gasto tuyo","Con la foto del ticket cuando lo compres",True)}{interr("Avisarme si el día anterior falta comprarlo","Te llega un aviso a las 18 del martes",True)}</div>''') + '\n' + accion_fija('Agregar y mandar a aprobación','F-ObraRepuestos.dc.html')
guardar('F-ObraRepuesto.dc.html','Obras · Agregar repuesto',cuerpo)

# ── Obra · cambiar la fecha de una jornada ─────────────────────────
dias_f=''.join(dia_tira(n,d,e) for n,d,e in [(19,'JUE','pt'),(20,'VIE','pt'),(21,'SÁB',''),(23,'LUN','sel'),(24,'MAR',''),(25,'MIÉ','')]).replace('width: 52px','width: 50px')
def mov(t, de, a):
    return f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}"><strong style="font-size: 14px">{t}</strong><span style="display: flex; align-items: center; gap: 6px; font-size: 13px"><span style="color: {SUAVE}; text-decoration: line-through">{de}</span>{svg(IC["flecha"],SUAVE,14)}<strong style="color: {AZUL}">{a}</strong></span></div>'
cuerpo = barra_compacta('Cambiar fecha','F-ObraDia.dc.html',sub='Jornada 5 · Sanitarios') + contenido(f'''
    <strong style="font-size: 15px">¿A qué día la pasás?</strong>
    <div style="display: flex; gap: 6px; margin: 0 -16px; padding: 0 16px; overflow: hidden">{dias_f}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{op("8:30 a 13")}{op("8:30 a 17",True)}{op("13 a 17")}</div>
    <a href="F-ObraDiaHorario.dc.html" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; border-radius: 14px; border: 2px dashed {AZUL}; color: {AZUL}; font-weight: 800; font-size: 14px; text-decoration: none">{svg(IC["reloj"],AZUL,18)}Otro horario o una hora exacta</a>
    <div role="radiogroup" aria-label="Qué se mueve" style="display: flex; flex-direction: column; gap: 8px">
      <span role="radio" aria-checked="false" style="padding: 12px 14px; border-radius: 16px; border: 2px solid {BORDE}; font-weight: 800">Mover solo esta jornada</span>
      <span role="radio" aria-checked="true" style="padding: 12px 14px; border-radius: 16px; border: 2px solid {AZUL}; background: {TINTE}; color: {HONDO}; font-weight: 800">Correr esta y las que siguen</span>
    </div>
    {tarjeta(etiqueta("ASÍ QUEDA")+mov("Jornada 5 · Sanitarios","Jue 19","Lun 23")+mov("Jornada 6 · Terminación","Vie 20","Mar 24"))}
    <span style="font-size: 12px; color: {SUAVE}">Se le pide a Martín y se avisa a Sofía y Diego. Hasta que Martín acepte, siguen las fechas de ahora.</span>''') + '\n' + accion_fija('Pedir el cambio','F-Obra.dc.html')
guardar('F-ObraFecha.dc.html','Obras · Cambiar fecha',cuerpo)

# ── Obra · equipo (solo por invitación) ────────────────────────────
def miembro(k, rol, parte, est):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}">{avatar(k,46)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{nombre(k)}{" (vos)" if k=="yo" else ""}</strong><span style="font-size: 12px; color: {SUAVE}">{rol}</span>{est}</span><strong style="{TIT}; font-size: 17px">{parte}</strong></div>'
cuerpo = barra_compacta('Equipo','F-Obra.dc.html',sub='Baño completo',accion=btn_circ('chat','F-ChatGrupo.dc.html','Chat del grupo')) + contenido(f'''
    {tabs([("Días","F-Obra.dc.html"),("Repuestos <span role='img' aria-label='faltan comprar' style='display: inline-block; width: 8px; height: 8px; margin-left: 4px; border-radius: 50%; background: #D93025'></span>","F-ObraRepuestos.dc.html"),("Equipo · 3","F-ObraEquipo.dc.html"),("Plata","F-Reparto.dc.html")],"Equipo")}
    {tarjeta(etiqueta("PROFESIONALES")+miembro('yo','Titular · Plomería','60 %',chip("Armó la obra","estrella","tinte"))+miembro('sofia','Albañilería · jornadas 1, 3 y 4','30 %',chip("Aceptó","check","exito"))+miembro('diego','Electricidad · jornada 6','10 %',chip("Invitación enviada","reloj","amarillo")), franja("Ver el reparto del pago","F-Reparto.dc.html"))}
    {tarjeta(etiqueta("CLIENTE")+f'<div style="display: flex; gap: 12px; align-items: center">{avatar("martin",46)}<span style="display: flex; flex-direction: column"><strong style="font-size: 15px">Martín Sosa</strong><span style="font-size: 12px; color: {SUAVE}">Ve los días, las fotos y el chat del grupo</span></span></div>')}
    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: {SUAVE}"><span>· Se suma quien vos invitás o elegís entre los que se postulan; siempre verificados por Handyx.</span><span>· Cada uno ve los días, el chat y su parte. Tus gastos los ves solo vos.</span></div>''') + '\n' + acciones_fijas(f'<div style="display: flex; flex-direction: column; gap: 10px">{boton(svg(IC["mas"],"#FFFFFF",20)+"Buscar uno nuevo","F-ObraBuscar.dc.html",alto=52)}{boton2("Invitar a un contacto","F-Invitar.dc.html","usuario2")}</div>')
guardar('F-ObraEquipo.dc.html','Equipo · Equipo de la obra',cuerpo,900)

# ── Invitar ────────────────────────────────────────────────────────
def contacto(k, rubro, sel=False):
    m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 50%; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3)}</span>' if sel else f'<span style="width: 28px; height: 28px; flex: none; border-radius: 50%; border: 2px solid #C9CFDA"></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{avatar(k,44)}<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{nombre(k)}</strong><span style="display: flex; gap: 6px">{chip(rubro,tono="gris")}{chip("Verificado","escudo","exito")}</span></span>{m}</div>'
cuerpo = barra_compacta('Invitar a la obra','F-ObraEquipo.dc.html',sub='Baño completo') + contenido(f'''
    <span style="min-height: 50px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}">{svg(IC['usuario2'],SUAVE,20)}Buscá en tus contactos de Handyx</span>
    {tarjeta(etiqueta("TUS CONTACTOS")+contacto('diego','Electricidad',True)+contacto('pablo','Gas'))}
    <div style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">¿Para qué lo sumás?</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Jornada 6 · Terminación",True)}{op("Toda la obra")}</div></div>
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; flex-direction: column"><strong style="font-size: 15px">O mandale un enlace</strong><span style="font-size: 12px; color: {SUAVE}">Vale 48 horas · solo para esta obra</span></span><strong style="{TIT}; font-size: 18px; letter-spacing: 2px">HX-OB-7Q2K</strong></div>', franja("Compartir el enlace","F-Invitar.dc.html"))}
    <span style="font-size: 12px; color: {SUAVE}">Hasta que acepte, no ve nada de la obra. Su parte del pago se acuerda en el reparto.</span>''') + '\n' + accion_fija('Mandar invitación a Diego','F-ObraEquipo.dc.html')
guardar('F-Invitar.dc.html','Equipo · Invitar',cuerpo)

# ── Reparto del pago ──────────────────────────────────────────────
def parte(k, rubro, monto, pct, est):
    return f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-top: 1px solid {BORDE}"><div style="display: flex; gap: 12px; align-items: center">{avatar(k,44)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><strong style="font-size: 15px">{nombre(k)}</strong><span style="font-size: 12px; color: {SUAVE}">{rubro} · {pct} del total</span></span>{est}</div><div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 6px 6px 14px; border-radius: 16px; background: #F6F7F9"><span style="font-size: 13px; font-weight: 700; color: {SUAVE}">Su parte</span><span style="display: flex; align-items: center; gap: 8px"><span style="width: 36px; height: 36px; border-radius: 12px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span><strong style="{TIT}; font-size: 18px; min-width: 100px; text-align: center; white-space: nowrap">{monto}</strong><span style="width: 36px; height: 36px; border-radius: 12px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; align-items: center; justify-content: center; font-weight: 900">+</span></span></div></div>'
barra_rep=f'<div role="img" aria-label="Reparto: Julián 60 %, Sofía 30 %, Diego 10 %" style="display: flex; height: 16px; border-radius: 8px; overflow: hidden"><span style="width: 60%; background: {AZUL}"></span><span style="width: 30%; background: #8CCBA3"></span><span style="width: 10%; background: {AMARILLO}"></span></div>'
cuerpo = barra_compacta('Reparto del pago','F-ObraEquipo.dc.html',sub='Baño completo') + contenido(f'''
    {tabs([("Días","F-Obra.dc.html"),("Repuestos <span role='img' aria-label='faltan comprar' style='display: inline-block; width: 8px; height: 8px; margin-left: 4px; border-radius: 50%; background: #D93025'></span>","F-ObraRepuestos.dc.html"),("Equipo · 3","F-ObraEquipo.dc.html"),("Plata","F-Reparto.dc.html")],"Plata")}
    <div style="padding: 12px 16px; border-radius: 24px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: baseline">{etiqueta("ACORDADO CON MARTÍN","#CFE0FA")}<strong style="{TIT}; font-size: 28px">$ 850.000</strong></div>{barra_rep}</div>
    {tarjeta(parte('yo','Plomería','$ 510.000','60 %',chip("Vos","estrella","tinte"))+parte('sofia','Albañilería','$ 255.000','30 %',chip("Aceptó","check","exito"))+parte('diego','Electricidad','$ 85.000','10 %',chip("Falta que acepte","reloj","amarillo")))}
    <div role="radiogroup" aria-label="Cómo cobra cada uno" style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">¿Cómo cobra cada uno?</strong>
      <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px"><span role="radio" aria-checked="true" style="padding: 10px 12px; border-radius: 16px; border: 2px solid {AZUL}; background: {TINTE}; color: {HONDO}; font-size: 13px; font-weight: 800">Cada uno le cobra su parte a Martín</span><span role="radio" aria-checked="false" style="padding: 10px 12px; border-radius: 16px; border: 2px solid {BORDE}; font-size: 13px; font-weight: 800">Cobrás vos y repartís por fuera</span></div>
    </div>
    <span style="font-size: 12px; color: {SUAVE}">Handyx no recibe ni reparte la plata: registra lo que acuerdan entre ustedes.</span>''') + '\n' + accion_fija('Mandar el reparto al equipo','F-ObraEquipo.dc.html')
guardar('F-Reparto.dc.html','Equipo · Reparto del pago',cuerpo,1000)

# ── Chats ──────────────────────────────────────────────────────────
def msg(k, t, hora, mio=False, con_nombre=True):
    return burbuja(k, t, hora, mio, con_nombre)
def sistema(t, ic='usuario2'):
    return f'<span style="align-self: center; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: #F6F7F9; border: 1px solid {BORDE}; font-size: 12px; color: {SUAVE}">{svg(IC[ic],SUAVE,14)}{t}</span>'
def tarjeta_chat(sup, titulo, sub, chip_html, href, ic='caja'):
    return f'<a href="{href}" style="align-self: flex-end; width: 80%; border-radius: 20px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; color: {TINTA}; text-decoration: none">{etiqueta(sup,AZUL)}<span style="display: flex; gap: 10px; align-items: center">{mosaico_ic(ic,40,radio=12,iconsize=18)}<span style="display: flex; flex-direction: column"><strong style="font-size: 15px">{titulo}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span></span>{chip_html}</a>'
def entrada_chat():
    return f'''  <div style="position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 12px 22px; background: #FFFFFF; border-top: 1px solid {BORDE}; display: flex; gap: 8px; align-items: center">
    <a href="F-ChatAdjuntar.dc.html" aria-label="Mandar presupuesto, obra, repuestos o fotos" style="width: 48px; height: 48px; flex: none; border-radius: 16px; background: {AZUL}; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center">{svg(IC['mas'],'#FFFFFF',22)}</a>
    <span style="flex: 1; min-height: 48px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; padding: 0 14px; color: {SUAVE}; font-size: 15px">Escribí un mensaje</span>
    <button aria-label="Enviar" style="width: 48px; height: 48px; flex: none; border-radius: 16px; border: 0; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['enviar'],TINTA,20)}</button>
  </div>'''
def cabecera_chat(av_html, titulo, sub, atras, accion):
    return f'''  <header style="position: absolute; top: 0; left: 0; right: 0; z-index: 2; height: 70px; padding: 10px 14px 0; box-sizing: border-box; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border-bottom: 1px solid {BORDE}">
    {btn_circ('atras',atras,'Volver')}{av_html}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 16px">{titulo}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{accion}
  </header>'''

cuerpo = cabecera_chat(avatar_grupo(['martin','sofia','diego'],46),'Baño completo','4 personas · tocá para ver','F-Obra.dc.html',btn_circ('obra','F-Obra.dc.html','Ver la obra')) + contenido(f'''
    {sistema("Diego se sumó por tu invitación")}
    {msg('sofia','Mañana arranco 8:30 con la pared del lavatorio.','16:02')}
    {msg('martin','¡Genial! ¿Hace falta comprar algo más?','16:05')}
    {tarjeta_chat("REPUESTOS PARA APROBAR","Pegamento para porcelanato × 4","Para la jornada 4 · $ 36.000",chip("Esperando a Martín","reloj","amarillo"),"F-ObraRepuestos.dc.html")}
    {msg('martin','Lo veo a la noche y te confirmo.','16:20')}
    {tarjeta_chat("AVANCE DE HOY","Jornada 3 · Revestimiento","Ducha terminada · 2 fotos",chip("Lo vio Martín","check","exito"),"F-ObraDia.dc.html","camara")}''', top=84) + '\n' + entrada_chat()
guardar('F-ChatGrupo.dc.html','Equipo · Chat grupal de la obra',cuerpo)

cuerpo = cabecera_chat(avatar('lucia',40),'Lucía Ferreyra','Pedido · Pierde la canilla','F-Mensajes.dc.html',btn_circ('herramienta','F-Trabajo.dc.html','Ver el pedido')) + contenido_chat(f'''
    <span style="align-self: center">{chip("Hoy","agenda","gris")}</span>
    {msg('lucia','Hola, ¿podés venir hoy? La canilla gotea todo el tiempo.','17:20',con_nombre=False)}
    {tarjeta_chat("TU PROPUESTA","$ 47.000 · hoy de 18 a 20","Incluye materiales",chip("Aceptada","check","exito"),"F-Trabajo.dc.html","billete")}
    {tarjeta_chat("PRESUPUESTO · VERSIÓN 2","Cartucho, flexibles y mano de obra","3 ítems · $ 47.000",chip("Lo vio Lucía","check","tinte"),"H0-Presupuesto.dc.html","ticket")}
    {msg('lucia','¿Podés venir con el repuesto del cartucho?','17:42',con_nombre=False)}
    {msg('yo','Sí, lo llevo. Llego entre las 18 y las 20.','17:44',mio=True)}''', top=84) + '\n' + entrada_chat()
guardar('F-Chat.dc.html','Mensajes · Chat con un cliente',cuerpo)

# Mandar algo en el chat.
def opcion_env(ic, t, sub, href, fondo=TINTE, color=AZUL):
    return f'<a href="{href}" style="padding: 14px; border-radius: 20px; background: {fondo}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 6px">{svg(IC[ic],color,26)}<strong style="font-size: 14px; line-height: 1.15">{t}</strong><span style="font-size: 11px; color: {SUAVE}">{sub}</span></a>'
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <h1 style="margin: 0; {TIT}; font-size: 26px">Mandar en el {marcador("chat")}</h1>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">
      {opcion_env('ticket','Presupuesto','Desde una plantilla o el Taller','H0-Presupuesto.dc.html',AZUL,'#FFFFFF').replace(f'color: {TINTA}','color: #FFFFFF').replace(f'color: {SUAVE}','color: #F0F5FD')}
      {opcion_env('obra','Propuesta de obra','Etapas, jornadas y montos','F-PropuestaObra.dc.html')}
      {opcion_env('caja','Repuestos para aprobar','El cliente los aprueba ahí mismo','F-ObraRepuesto.dc.html')}
      {opcion_env('agenda','Cambio de fecha','Propone otro día u horario','F-Fecha.dc.html')}
      {opcion_env('camara','Fotos','Achicadas y sin ubicación','F-Chat.dc.html',MOSAICO,TINTA)}
      {opcion_env('escudo','Informe','Del trabajo o del Taller','H0-Informe.dc.html',MOSAICO,TINTA)}
    </div>
    <span style="font-size: 12px; color: {SUAVE}">Llega como tarjeta: el cliente acepta, aprueba o pide cambios desde el chat.</span>''', 250)
guardar('F-ChatAdjuntar.dc.html','Mensajes · Mandar en el chat',cuerpo)

# Propuesta de obra.
def etapa(n, t, j, monto):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="width: 34px; height: 34px; flex: none; border-radius: 50%; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">{n}</span><span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{j}</span></span><strong style="{TIT}; font-size: 16px">{monto}</strong></div>'
cuerpo = barra_compacta('Propuesta de obra','F-ChatAdjuntar.dc.html',sub='Para Martín Sosa') + contenido(f'''
    <span style="min-height: 52px; border-radius: 16px; background: #FFFFFF; border: 2px solid {AZUL}; display: flex; align-items: center; padding: 0 14px; {TIT}; font-size: 20px">Baño completo</span>
    {tarjeta(f'<div style="display: flex; justify-content: space-between">{etiqueta("ETAPAS")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">+ Etapa</span></div>'+etapa(1,'Demolición','1 jornada · desde el jue 12','$ 120.000')+etapa(2,'Cañerías','1 jornada','$ 180.000')+etapa(3,'Revestimiento','2 jornadas','$ 330.000')+etapa(4,'Sanitarios y terminación','2 jornadas','$ 220.000'))}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{dato_mini("JORNADAS","6")}{dato_mini("EQUIPO",avatares(["yo","sofia"],22))}{dato_mini("TOTAL","$ 850.000",fondo=TINTE,color=AZUL)}</div>
    <div>{interr("Cobro por etapa","Martín paga al terminar cada etapa",True)}{interr("Materiales aparte","Se aprueban en el chat a medida que hacen falta",True)}</div>''') + '\n' + accion_fija(svg(IC['enviar'],'#FFFFFF',20)+'Mandar por el chat','F-ChatGrupo.dc.html')
guardar('F-PropuestaObra.dc.html','Mensajes · Propuesta de obra',cuerpo)

# ── Mensajes: personas con iniciales, chats de pedidos, obras y equipo ─
def hilo(av_html, t, etiqueta_html, ult, hora, sin_leer=0, href='F-Chat.dc.html'):
    b=f'<span style="min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; background: {AZUL}; color: #FFFFFF; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center">{sin_leer}</span>' if sin_leer else ''
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 52px; flex: none; display: flex; justify-content: center">{av_html}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><span style="display: flex; justify-content: space-between; gap: 8px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{hora}</span></span>{etiqueta_html}<span style="font-size: 13px; color: {TEXTO if sin_leer else SUAVE}; font-weight: {700 if sin_leer else 400}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{ult}</span></span>{b}</a>'
soporte=f'<span aria-hidden="true" style="width: 48px; height: 48px; border-radius: 50%; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 20px">H</span>'
grupo=avatar_grupo(['martin','sofia','diego'],48)
def tag(t, ic, tono='gris'): return f'<span>{chip(t,ic,tono)}</span>'
cuerpo = contenido(f'''
    {titulo_grande("4 SIN LEER","Tus ","mensajes")}
    <div style="display: flex; gap: 8px">{chip("Todos",tono="azul")}{chip("Pedidos",tono="gris")}{chip("Obras",tono="gris")}{chip("Equipo",tono="gris")}{chip("Soporte",tono="gris")}</div>
    <div>
      {hilo(grupo,'Baño completo',tag('Obra · grupo de 4','obra','tinte'),'Sofía: Mañana arranco 8:30 con la pared…','16:20',3,'F-ChatGrupo.dc.html')}
      {hilo(avatar('lucia',48),'Lucía Ferreyra',tag('Pedido · Pierde la canilla','herramienta'),'¿Podés venir con el repuesto del cartucho?','17:42',1)}
      {hilo(avatar('carla',48),'Carla Ibáñez',tag('Obra · Tablero y circuitos','obra'),'Perfecto, el jueves a las 8:30','Ayer')}
      {hilo(avatar('diego',48),'Diego Herrera',tag('Equipo · Electricidad','usuario2'),'¿Me pasás el plano del tablero?','Ayer',href='F-ChatGrupo.dc.html')}
      {hilo(soporte,'Soporte de Handyx',tag('Soporte','ayuda'),'Tu caso quedó resuelto','Lun',href='D6-Ayuda.dc.html')}
    </div>''', top=26) + '\n' + barra_vidrio('Mensajes')
guardar('F-Mensajes.dc.html','Mensajes · Lista',cuerpo)

# ── Cuenta premium, con los azules de la marca ─────────────────────
def stat(v, t):
    return f'<div style="padding: 10px 12px; border-radius: 16px; background: rgba(255,255,255,0.14); display: flex; flex-direction: column"><strong style="{TIT}; font-size: 20px">{v}</strong><span style="font-size: 11px; color: #F0F5FD; font-weight: 700">{t}</span></div>'
def tile(ic, t, v, sub, href, fondo, color, base):
    return f'<a href="{href}" style="padding: 14px; border-radius: 22px; background: {fondo}; color: {color}; text-decoration: none; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 4px 0 {base}">{svg(IC[ic],color,24)}<strong style="font-size: 14px; margin-top: 4px">{t}</strong><span style="{TIT}; font-size: 18px">{v}</span><span style="font-size: 11px; opacity: 0.8">{sub}</span></a>'
cuerpo = f'''  <section style="position: absolute; top: 0; left: 0; right: 0; padding: 22px 20px 20px; background: {AZUL}; border-radius: 0 0 34px 34px; color: #FFFFFF; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 12px 30px -16px rgba(14,29,54,0.55)">
    <div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("TU CUENTA","#CFE0FA")}<a href="F-Cuenta.dc.html" aria-label="Ajustes" style="width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['lista'],'#FFFFFF',20)}</a></div>
    <div style="display: flex; gap: 14px; align-items: center"><span style="border-radius: 50%; box-shadow: 0 0 0 4px rgba(255,255,255,0.35)">{avatar('yo',72).replace('background: '+AZUL,'background: #FFFFFF').replace('color: #FFFFFF','color: '+AZUL)}</span><span style="display: flex; flex-direction: column; gap: 6px"><strong style="{TIT}; font-size: 26px; line-height: 1">Julián Ortiz</strong><span style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Verificado por Handyx","escudo","blanco")}{chip("Plomería · Gas","herramienta","azul").replace("background: "+AZUL,"background: rgba(255,255,255,0.18)")}</span></span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{stat("38","trabajos verificados")}{stat("2","obras en curso")}{stat("8/10","tu camino")}</div>
  </section>
''' + f'''  <div style="position: absolute; top: 312px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 14px">
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">
      {tile('billete','Tus ingresos','$ 239.500','Neto de noviembre','F-Ingresos.dc.html',NOCHE,'#FFFFFF','#0B1424')}
      {tile('estrella','Tu camino','Gorra a 2','Premios y vitrina','G-Camino.dc.html',AMARILLO,TINTA,'#C9C85A')}
      {tile('herramienta','Tu taller','4 herramientas','Electricidad','T-Taller.dc.html',TINTE,HONDO,'#C9D6EC')}
      {tile('ticket','Presupuestos','3 plantillas','Y tu lista de precios','H0-Precios.dc.html',TINTE,HONDO,'#C9D6EC')}
    </div>
    {tarjeta(etiqueta("TU TRABAJO")+fila_ic('cuenta','Tu perfil','Cómo te ven los clientes',href='CU-Perfil.dc.html')+fila_ic('pin','Disponibilidad y zonas','4 barrios · urgentes con tu permiso',href='CU-Disponibilidad.dc.html')+fila_ic('billete','Medios de cobro','Mercado Pago y efectivo',href='CU-Cobros.dc.html'))}
    {tarjeta(etiqueta("TU CUENTA")+fila_ic('escudo','Datos y verificación','DNI, CUIT y documentos',href='CU-Datos.dc.html')+fila_ic('llave2','Seguridad','Contraseña y segunda verificación',href='D6-Seguridad.dc.html')+fila_ic('campana','Avisos','Qué te llega y cuándo',href='CU-Notificaciones.dc.html')+fila_ic('candado','Privacidad y baja','Tus datos y cómo darte de baja',href='CU-Privacidad.dc.html'))}
  </div>
''' + barra_vidrio('Cuenta')
guardar('F-Cuenta.dc.html','Cuenta · Tu cuenta',cuerpo)

# ── Avisos con los nuevos de obra y equipo ─────────────────────────
def aviso(ic, t, sub, hora, nuevo=False, href='F-Pedido.dc.html', av=None):
    p=f'<span style="width: 10px; height: 10px; border-radius: 50%; background: {AZUL}; flex: none"></span>' if nuevo else '<span style="width: 10px; flex: none"></span>'
    izq = avatar(av,44) if av else mosaico_ic(ic,44,radio=14,iconsize=20)
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none">{p}{izq}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 13px; color: {SUAVE}">{sub}</span></span><span style="font-size: 12px; color: {SUAVE}">{hora}</span></a>'
cuerpo = barra_compacta('Avisos','F-Inicio.dc.html') + contenido(f'''
    {etiqueta("HOY")}
    <div>{aviso('alerta','Faltan 2 repuestos para mañana','Baño completo · pegamento y pastina','18:00',True,'F-ObraRepuestos.dc.html')}{aviso('herramienta','Nuevo pedido urgente','Plomería · Centro · tocá para ver','17:40',True)}{aviso('check','Martín aprobó la pastina','Se compra mañana a las 8:00','16:48',True,'F-ObraRepuestos.dc.html',av='martin')}{aviso('check','Sofía aceptó el reparto','Baño completo · 30 %','15:10',False,'F-Reparto.dc.html',av='sofia')}</div>
    {etiqueta("ESTA SEMANA")}
    <div>{aviso('billete','Pago verificado','$ 180.000 · Baño completo, etapa 2','Lun',False,'F-Ingresos.dc.html')}{aviso('estrella','Llegaste a la estación 2','Kit de consumibles: elegí cómo retirarlo','Lun',False,'G-Camino.dc.html')}</div>
    <p style="margin: 0; font-size: 12px; color: {SUAVE}">Los avisos te llevan al detalle. Nada se acepta desde acá.</p>''')
guardar('D6-Avisos.dc.html','Resto · Avisos',cuerpo)
print('ok')
