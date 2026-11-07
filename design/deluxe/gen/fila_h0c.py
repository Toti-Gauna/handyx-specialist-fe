import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
 'telefono':'<rect x="7" y="2" width="10" height="20" rx="2.5"></rect><path d="M11 18h2"></path>',
 'flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>',
 'columnas':'<rect x="3" y="4" width="8" height="16" rx="2"></rect><rect x="13" y="4" width="8" height="16" rx="2"></rect>',
 'deslizar':'<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M12 4v16M9 12l-2 0M15 12h2"></path>',
 'tornillo':'<path d="M9 3h6l-1 4h-4L9 3Z"></path><path d="M12 7v13M9.5 10l5 1.5M9.5 13l5 1.5M9.5 16l5 1.5"></path>',
 'pintura':'<rect x="4" y="3" width="13" height="7" rx="1.5"></rect><path d="M17 6h3v5h-8v3"></path><rect x="10" y="14" width="4" height="7" rx="1"></rect>',
 'taladro':'<path d="M3 7h12l2 3h4v2h-4l-2 3H9v5H5v-5H3V7Z"></path>',
 'casco':'<path d="M4 16a8 8 0 0 1 16 0"></path><path d="M2 16h20v3H2zM12 8V5"></path>',
 'carrito':'<path d="M3 4h2l2.5 11h11l2-8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>',
 'firma':'<path d="M3 17c3-6 5-6 6-3s3 3 5-1 4-2 7 1"></path><path d="M3 21h18"></path>',
 'lupa':'<circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path>',
 'micro':'<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path>',
 'bateria':'<rect x="2" y="7" width="18" height="10" rx="2"></rect><path d="M22 11v2M6 10v4M10 10v4"></path>',
})
def interr(t, sub, on):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div role="switch" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span aria-hidden="true" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
def segmento(opciones, sel):
    return '<div role="tablist" style="display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: '+MOSAICO+'">'+''.join(f'<span role="tab" aria-selected="{str(i==sel).lower()}" style="flex: 1; min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 800; {"background: #FFFFFF; box-shadow: "+ELEV1+"; color: "+TINTA if i==sel else "color: "+SUAVE}">{svg(IC[ic],TINTA if i==sel else SUAVE,16)}{t}</span>' for i,(ic,t) in enumerate(opciones))+'</div>'

# Ilustraciones SVG propias: la canilla antes (gotea) y después (nueva).
def canilla(despues, w=170, h=200):
    cuerpo = AZUL if despues else '#9AA3B2'
    fondo = TINTE if despues else '#D6DAE1'
    gotas = '' if despues else ''.join(f'<path d="M{x} {y} q4 7 0 10 q-4 -3 0 -10z" fill="#5E8FD6"></path>' for x,y in [(98,128),(98,150),(98,172)])
    brillo = f'<path d="M66 60 q10 -14 30 -14" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.8"></path>' if despues else f'<circle cx="80" cy="74" r="5" fill="#B58A5A"></circle><circle cx="118" cy="66" r="4" fill="#B58A5A"></circle>'
    return f'''<svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice"><rect width="{w}" height="{h}" fill="{fondo}"></rect>
      <rect x="0" y="{h-40}" width="{w}" height="40" fill="{"#C9D6EC" if despues else "#BFC5CF"}"></rect>
      <rect x="40" y="40" width="22" height="70" rx="6" fill="{cuerpo}"></rect>
      <path d="M50 52 h40 a16 16 0 0 1 16 16 v40" stroke="{cuerpo}" stroke-width="16" fill="none" stroke-linecap="round"></path>
      <rect x="80" y="24" width="44" height="12" rx="6" fill="{cuerpo}"></rect><rect x="98" y="30" width="8" height="16" fill="{cuerpo}"></rect>
      {brillo}{gotas}
      {"" if not despues else '<path d="M126 150 l8 8 16 -18" stroke="#1E9E57" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>'}
    </svg>'''

def nota_cambio(n, t, sub):
    return f'<div style="display: flex; gap: 12px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="width: 26px; height: 26px; flex: none; border-radius: 50%; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900">{n}</span><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span></div>'
notas = (f'<div style="display: flex; justify-content: space-between">{etiqueta("QUÉ CAMBIASTE")}<span style="font-size: 12px; font-weight: 800; color: {AZUL}">+ Agregar</span></div>'
  + nota_cambio(1,'Cartucho nuevo','Cerámico 35 mm; el viejo tenía el disco gastado')
  + nota_cambio(2,'Flexibles nuevos','Los dos estaban resecos')
  + f'<span style="display: flex; align-items: center; gap: 8px; padding-top: 8px; font-size: 12px; color: {SUAVE}">{svg(IC["micro"],AZUL,16)}Podés dictarlo: se escribe solo</span>')

# Antes y después · deslizar
cuerpo = barra_compacta('Antes y después','H0-Modo.dc.html',sub='Pierde la canilla') + contenido(f'''
    {segmento([('deslizar','Deslizar'),('columnas','Lado a lado')],0)}
    <div role="img" aria-label="Comparador: antes a la izquierda, después a la derecha" style="position: relative; height: 290px; border-radius: 26px; overflow: hidden; box-shadow: {ELEV2}">
      <div style="position: absolute; inset: 0">{canilla(False,358,290)}</div>
      <div style="position: absolute; top: 0; bottom: 0; left: 50%; right: 0; overflow: hidden"><div style="position: absolute; top: 0; bottom: 0; right: 0; width: 358px">{canilla(True,358,290)}</div></div>
      <span style="position: absolute; left: 12px; top: 12px">{chip("Antes · 18:12","camara","noche")}</span>
      <span style="position: absolute; right: 12px; top: 12px">{chip("Después · 19:05","camara","blanco")}</span>
      <span style="position: absolute; top: 0; bottom: 0; left: 50%; width: 4px; margin-left: -2px; background: #FFFFFF"></span>
      <span style="position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center; gap: 2px">{svg(IC['atras'],TINTA,16)}{svg(IC['flecha'],TINTA,16)}</span>
    </div>
    {tarjeta(notas)}''') + '\n' + accion_fija('Sumar al informe','H0-Informe.dc.html')
guardar('H0-AntesDespues.dc.html','H0 · Antes y después (deslizar)',cuerpo)

# Antes y después · lado a lado
def foto(despues, et, hora, chip_tono):
    return f'<div style="display: flex; flex-direction: column; gap: 6px"><div style="position: relative; height: 230px; border-radius: 22px; overflow: hidden; box-shadow: {ELEV1}">{canilla(despues,170,230)}<span style="position: absolute; left: 8px; top: 8px">{chip(et,"camara",chip_tono)}</span></div><span style="font-size: 12px; color: {SUAVE}; text-align: center">{hora}</span></div>'
cuerpo = barra_compacta('Antes y después','H0-Modo.dc.html',sub='Pierde la canilla') + contenido(f'''
    {segmento([('deslizar','Deslizar'),('columnas','Lado a lado')],1)}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{foto(False,'Antes','Hoy 18:12 · gotea','noche')}{foto(True,'Después','Hoy 19:05 · sin pérdidas','blanco')}</div>
    <div style="display: flex; gap: 8px">{chip("Cambiar foto","camara","gris")}{chip("Flecha","flechas","gris")}{chip("Texto","documento","gris")}</div>
    {tarjeta(notas)}''') + '\n' + accion_fija('Sumar al informe','H0-Informe.dc.html')
guardar('H0-AntesLado.dc.html','H0 · Antes y después (lado a lado)',cuerpo)

# Informe del trabajo: secciones que no se repiten y se completan solas.
def seccion(ic, t, sub, est, href=None):
    e={'ok':chip("Listo","check","exito"),'auto':chip("Se completó solo","rayo","tinte"),'falta':chip("Te falta","alerta","amarillo")}[est]
    inner=f'{mosaico_ic(ic,42,radio=14,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span><span>{e}</span></span>'
    return f'<a href="{href or "H0-Informe.dc.html"}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none">{inner}{svg(IC["flecha"],SUAVE,18)}</a>'
cuerpo = barra_compacta('Informe del trabajo','H0-Modo.dc.html',sub='Pierde la canilla') + contenido(f'''
    <div style="padding: 14px 16px; border-radius: 22px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}; display: flex; align-items: center; gap: 14px"><div style="width: 86px; height: 70px; flex: none; border-radius: 14px; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr">{canilla(False)}{canilla(True)}</div><span style="display: flex; flex-direction: column; gap: 3px">{etiqueta("CASI LISTO · 4 DE 5","#CFE0FA")}<strong style="{TIT}; font-size: 20px; line-height: 1.05">Lo recibe Lucía en el chat y en PDF</strong></span></div>
    {tarjeta(seccion('lupa','Qué encontraste','La causa: disco del cartucho gastado','ok')+seccion('columnas','Antes y después','1 par de fotos · 2 cambios escritos','auto','H0-AntesLado.dc.html')+seccion('gota','Pruebas','Sin pérdidas a los 10 minutos','auto')+seccion('caja','Materiales y garantía','Cartucho y flexibles · 30 días, hasta el 17/12','auto')+seccion('agenda','Qué conviene hacer después','Ej.: revisar la canilla del baño en 6 meses','falta'))}''') + '\n' + accion_fija('Mandar informe y pedir conformidad','H0-InformeEnviado.dc.html')
guardar('H0-Informe.dc.html','H0 · Informe del trabajo',cuerpo)

# Informe enviado: conformidad, garantía y recordatorio.
cuerpo = barra_compacta('Trabajo terminado','F-Inicio.dc.html') + contenido(f'''
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding-top: 6px">
      <span style="width: 84px; height: 84px; border-radius: 28px; background: #E3F4EA; display: flex; align-items: center; justify-content: center">{svg(IC['check'],'#137140',42,3)}</span>
      {etiqueta("INFORME ENVIADO","#137140")}
      <h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1.02">Le llegó a {marcador("Lucía")}</h1>
    </div>
    {tarjeta(fila_ic('firma','Conformidad de Lucía','La da desde su app con un toque',derecha=chip("Esperando","reloj","amarillo"),borde=False)+fila_ic('escudo','Garantía activa','30 días · hasta el 17/12')+fila_ic('agenda','Recordatorio de mantenimiento','17/05/2027 · te avisamos a vos')+fila_ic('billete','Cobro','$ 47.000 en efectivo · informado',derecha=chip("Por verificar","reloj","gris")))}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Descargar PDF","H0-InformeEnviado.dc.html","documento")}{boton2("Ver en el chat","F-Chat.dc.html","chat")}</div>''') + '\n' + accion_fija('Ir a la parada 3','F-InicioDia.dc.html')
guardar('H0-InformeEnviado.dc.html','H0 · Informe enviado',cuerpo)

# ── Inicio con día de trabajo: la ruta adentro del Inicio ───────────
ruta=[(95,330),(140,262),(205,232),(240,152),(270,122)]
paradas=''.join(f'<span style="position: absolute; left: {x-16}px; top: {y-16}px; width: 32px; height: 32px; border-radius: 50%; background: {c}; color: {t}; border: 3px solid #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px">{n}</span>' for x,y,n,c,t in [(205,232,'✓','#1E9E57','#FFFFFF'),(270,122,2,AZUL,'#FFFFFF'),(60,200,3,AMARILLO,TINTA)])
def parada(n, h, t, sub, est, href):
    m={'hecho':(f'background: #1E9E57; color: #FFFFFF','✓'),'ahora':(f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}',str(n)),'luego':(f'background: {MOSAICO}; color: {TINTA}',str(n))}[est]
    c={'hecho':chip("Hecho","check","exito"),'ahora':chip("Sale en 10 min","reloj","amarillo"),'luego':chip("20:30","agenda","gris")}[est]
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 36px; height: 36px; flex: none; border-radius: 50%; {m[0]}; display: flex; align-items: center; justify-content: center; font-weight: 900">{m[1]}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 14px">{h} · {t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{c}</a>'
cuerpo = mapa(ruta=ruta, punto=(95,330), extra=paradas) + '\n' + cabecera_azul() + '\n' + interruptor(True) + '\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: flex-end"><span style="display: flex; flex-direction: column; gap: 2px">{etiqueta("TU DÍA · 3 PARADAS · 14 KM", AZUL)}<strong style="{TIT}; font-size: 26px; line-height: 1">Próxima: {marcador("la canilla")}</strong></span><a href="F-InicioRuta.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">Ver todo</a></div>
    <div style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 20px; background: {TINTE}">{avatar('lucia',44)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Lucía Ferreyra · 18 a 20</strong><span style="font-size: 12px; color: {SUAVE}">Centro · 12 min en auto · llevás el cartucho</span></span></div>
    <div style="display: flex; flex-direction: column; gap: 10px">{boton(svg(IC["camion"],"#FFFFFF",20)+"Salir para allá","F-Trabajo.dc.html",alto=52)}{boton2("Avisar demora","H0-ModoAgenda.dc.html","reloj")}</div>
    {camino_card(con_pedido=False)}''', 410) + '\n' + barra_vidrio('Inicio')
guardar('F-InicioDia.dc.html','Núcleo · Inicio con tu día',cuerpo)

cuerpo = mapa(alto=300, ruta=[(x,y-90) for x,y in ruta], punto=(95,240), extra=paradas.replace('top: 216px','top: 126px')) + f'''
  <a href="F-InicioDia.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 14px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>
''' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: baseline"><h1 style="margin: 0; {TIT}; font-size: 28px">Tu {marcador("día")}</h1><span style="font-size: 13px; font-weight: 700; color: {SUAVE}">14 km · 312 en el mes</span></div>
    <div>{parada(1,'9:00','Baño completo','Los Troncos · jornada 3 de 6','hecho','F-ObraDia.dc.html')}{parada(2,'18:00','Pierde la canilla','Centro · Lucía Ferreyra · $ 47.000','ahora','F-Trabajo.dc.html')}{parada(3,'20:30','Retiro en Ferretería Simulación','Pastina para mañana · 4 min de desvío','luego','R-Retiro.dc.html')}</div>
    <div style="display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 16px; background: #F6F7F9; font-size: 12px; color: {SUAVE}">{svg(IC['flechas'],AZUL,18)}Mantené apretada una parada para cambiar el orden.</div>''', 250) + '\n' + acciones_fijas(boton(svg(IC["camion"],"#FFFFFF",20)+'Salir para la parada 2','F-Trabajo.dc.html'))
guardar('F-InicioRuta.dc.html','Núcleo · Tu día en el mapa',cuerpo)

# ── Tu equipamiento ────────────────────────────────────────────────
def categoria(ic, t, n, alerta='', fondo=MOSAICO, color=TINTA, href='H0-EquipoCategoria.dc.html'):
    a=f'<span style="font-size: 11px; font-weight: 800; color: {AMARILLO if fondo==AZUL else "#A8261C"}">{alerta}</span>' if alerta else f'<span style="font-size: 11px; opacity: 0.9">Todo en orden</span>'
    return f'<a href="{href}" style="padding: 14px; border-radius: 22px; background: {fondo}; color: {color}; text-decoration: none; display: flex; flex-direction: column; gap: 6px; min-height: 120px; box-sizing: border-box">{svg(IC[ic],color if fondo!=MOSAICO else AZUL,28)}<strong style="font-size: 15px">{t}</strong><span style="display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap"><span style="{TIT}; font-size: 26px; line-height: 1">{n.split(' ',1)[0]}</span><span style="font-size: 12px; font-weight: 800">{n.split(' ',1)[1] if ' ' in n else ''}</span></span>{a}</a>'
cuerpo = contenido(f'''
    <div style="position: relative; padding-right: 56px">{titulo_grande("HERRAMIENTAS Y CONSUMIBLES","Tu ","equipamiento").replace("font-size: 36px","font-size: 32px")}<a href="H0-EquipoAgregar.dc.html" aria-label="Agregar" style="position: absolute; top: 0; right: 0; width: 48px; height: 48px; border-radius: 16px; background: {AZUL}; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center">{svg(IC['mas'],'#FFFFFF',22)}</a></div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{chip("Todo",tono="azul")}{chip("En la camioneta","camion","gris")}{chip("En el taller","casa","gris")}{chip("Prestado","usuario2","gris")}</div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">
      {categoria('taladro','Eléctricas','8 herramientas','',AZUL,'#FFFFFF')}
      {categoria('herramienta','Manuales','23 herramientas')}
      {categoria('termometro','Medición','5 instrumentos','1 por calibrar')}
      {categoria('casco','Seguridad','6 elementos','Matafuego vence 12/12')}
      {categoria('tornillo','Consumibles','14 ítems','3 quedan pocos','#FCE8E6',TINTA,'H0-EquipoCategoria.dc.html')}
      {categoria('caja','Repuestos','9 ítems','')}
    </div>
    {{banner_html}}''', top=26).replace('{banner_html}', f'<a href="R-Pedir.dc.html" style="display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 16px; background: {AMARILLO}; color: {TINTA}; text-decoration: none; font-size: 13px; font-weight: 800">{svg(IC["carrito"],TINTA,18)}<span style="flex: 1">Lista de compras: cartuchos, teflón y tarugos</span>{svg(IC["flecha"],TINTA,16)}</a>') + '\n' + barra_vidrio('Cuenta')
guardar('H0-Equipo.dc.html','H0 · Tu equipamiento',cuerpo)

def herram(t, sub, chips, ic='taladro'):
    return f'<a href="H0-EquipoDetalle.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 58px; height: 58px; flex: none; border-radius: 18px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC[ic],AZUL,28)}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span><span style="display: flex; gap: 6px; flex-wrap: wrap">{chips}</span></span></a>'
cuerpo = barra_compacta('Eléctricas','H0-Equipo.dc.html',sub='8 herramientas') + contenido(f'''
    <span style="min-height: 48px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}">{svg(IC['lupa'] if 'lupa' in IC else IC['lista'],SUAVE,18)}Buscar en tu equipamiento</span>
    {tarjeta(herram('Taladro percutor 13 mm','Marca de ejemplo · comprado 03/2025',chip("En la camioneta","camion","tinte")+chip("Funciona bien","check","exito"))+herram('Amoladora 115 mm','Disco de corte nuevo el 02/11',chip("En la camioneta","camion","tinte")+chip("Cambiar escobillas","alerta","amarillo"))+herram('Termofusora 20–32 mm','Para Plomería',chip("Prestada a Sofía","usuario2","gris")+chip("Vuelve el 20/11","reloj","gris"))+herram('Atornillador inalámbrico','2 baterías',chip("En el taller","casa","gris")+chip("Cargar batería","bateria","amarillo"),'bateria'))}''') + '\n' + accion_fija(svg(IC['mas'],'#FFFFFF',20)+'Agregar una herramienta','H0-EquipoAgregar.dc.html')
guardar('H0-EquipoCategoria.dc.html','H0 · Categoría de equipamiento',cuerpo)

def campo(et, v, ph=False):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 50px; border-radius: 16px; border: {"1px solid "+BORDE if ph else "2px solid "+AZUL}; background: #FFFFFF; display: flex; align-items: center; padding: 0 14px; font-size: 15px; font-weight: {400 if ph else 700}; color: {SUAVE if ph else TINTA}">{v}</span></div>'
def op(t, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<span style="min-height: 44px; padding: 0 12px; border-radius: 14px; {s}; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 6px">{t}</span>'
cuerpo = barra_compacta('Agregar herramienta','H0-EquipoCategoria.dc.html') + contenido(f'''
    <div style="display: flex; gap: 12px; align-items: center"><span style="width: 96px; height: 96px; flex: none; border-radius: 26px; background: {AZUL}; box-shadow: 0 4px 0 {HONDO}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: #FFFFFF; font-size: 12px; font-weight: 800">{svg(IC['camara'],'#FFFFFF',30)}Foto</span><span style="font-size: 13px; color: {SUAVE}">Con la foto la reconocés rápido. Si tiene código de barras, lo escaneás y se completa el nombre.</span></div>
    {campo("Nombre","Amoladora 115 mm")}
    <div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">Categoría</span><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Eléctricas",True)}{op("Manuales")}{op("Medición")}{op("Seguridad")}</div></div>
    <div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">¿Dónde está?</span><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("En la camioneta",True)}{op("En el taller")}{op("Prestada")}</div></div>
    <div>{interr("Recordarme el mantenimiento","Escobillas cada 6 meses",True)}</div>''') + '\n' + accion_fija('Guardar en tu equipamiento','H0-EquipoCategoria.dc.html')
guardar('H0-EquipoAgregar.dc.html','H0 · Agregar herramienta',cuerpo)

# ── Ferretería: catálogo por categorías, categoría con variantes y pedido ─
SIM = chip("Simulación: ferreterías ficticias","alerta","amarillo")
def cat(ic, t, n, fondo=MOSAICO, color=TINTA):
    return f'<a href="R-Categoria.dc.html" style="padding: 12px; border-radius: 20px; background: {fondo}; color: {color}; text-decoration: none; display: flex; flex-direction: column; gap: 6px; min-height: 100px; box-sizing: border-box">{svg(IC[ic],color if fondo!=MOSAICO else AZUL,26)}<strong style="font-size: 13px; line-height: 1.15; letter-spacing: -0.1px">{t}</strong><span style="font-size: 11px; opacity: 0.75">{n} productos</span></a>'
def barra_carrito(n, total, href='R-Pedir.dc.html'):
    return f'''  <div style="position: absolute; left: 14px; right: 14px; bottom: 18px"><a href="{href}" style="display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 0 16px; border-radius: 20px; background: {NOCHE}; color: #FFFFFF; text-decoration: none; box-shadow: {ELEV2}"><span style="position: relative">{svg(IC['carrito'],'#FFFFFF',24)}<span style="position: absolute; top: -8px; right: -10px; min-width: 20px; height: 20px; border-radius: 10px; background: {AMARILLO}; color: {TINTA}; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center">{n}</span></span><span style="flex: 1; font-size: 15px; font-weight: 800">Ver tu pedido</span><strong style="{TIT}; font-size: 18px">{total}</strong></a></div>'''
cuerpo = barra_compacta('Pedir en ferretería','F-ObraRepuestos.dc.html') + contenido(f'''
    {SIM}
    <span style="min-height: 50px; border-radius: 16px; background: #F6F7F9; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}">{svg(IC['lista'],SUAVE,18)}Buscá «tarugo 8», «pastina», «cinta»…</span>
    <a href="R-Pedir.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; background: {TINTE}; color: {TINTA}; text-decoration: none">{svg(IC['ticket'],AZUL,22)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">Lo de tu presupuesto y la obra</strong><span style="font-size: 12px; color: {SUAVE}">4 ítems ya elegidos</span></span>{svg(IC['flecha'],AZUL,18)}</a>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{cat('tornillo','Fijaciones y tornillería',412,AZUL,'#FFFFFF')}{cat('gota','Plomería',356)}{cat('rayo','Electricidad',298)}{cat('llama','Gas',121)}{cat('pintura','Pintura',184)}{cat('ladrillo','Albañilería',210)}{cat('herramienta','Herramientas',267)}{cat('casco','Seguridad',96)}{cat('caja','Limpieza y adhesivos',143)}</div>''') + '\n' + barra_carrito(4,'$ 21.400')
guardar('R-Catalogo.dc.html','R · Catálogo por categorías',cuerpo)

def producto(t, sub, variantes, sel, precio, cant):
    vs=''.join(f'<span style="min-height: 34px; padding: 0 10px; border-radius: 10px; {"background: "+AZUL+"; color: #FFFFFF" if v==sel else "background: "+MOSAICO+"; color: "+TEXTO}; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center">{v}</span>' for v in variantes)
    st=(f'<span style="display: flex; align-items: center; gap: 8px"><span style="width: 34px; height: 34px; border-radius: 10px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span><strong style="{TIT}; font-size: 18px; min-width: 18px; text-align: center">{cant}</strong><span style="width: 34px; height: 34px; border-radius: 10px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">+</span></span>' if cant else f'<span style="min-height: 38px; padding: 0 14px; border-radius: 12px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center">Agregar</span>')
    return f'<div style="display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid {BORDE}"><span style="width: 56px; height: 56px; flex: none; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC["tornillo"],AZUL,26)}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px"><span style="display: flex; justify-content: space-between; gap: 8px"><strong style="font-size: 14px">{t}</strong><strong style="font-size: 14px">{precio}</strong></span><span style="font-size: 12px; color: {SUAVE}">{sub}</span><span style="display: flex; gap: 6px; flex-wrap: wrap">{vs}</span><span style="display: flex; justify-content: flex-end">{st}</span></span></div>'
cuerpo = barra_compacta('Fijaciones y tornillería','R-Catalogo.dc.html',sub='412 productos · simulación') + contenido(f'''
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{chip("Tarugos",tono="azul")}{chip("Tornillos",tono="gris")}{chip("Bulones",tono="gris")}{chip("Clavos",tono="gris")}{chip("Abrazaderas",tono="gris")}</div>
    {tarjeta(producto('Tarugo de nylon con tope','Caja de 50 · para ladrillo y hormigón',['6 mm','8 mm','10 mm'],'8 mm','$ 4.200',1)+producto('Tornillo autorroscante','Caja de 100 · cabeza fresada',['6 × 40','8 × 50','8 × 60'],'8 × 50','$ 6.900',0)+producto('Tarugo para durlock','Caja de 25 · tipo mariposa',['Chico','Grande'],'Chico','$ 3.800',0))}''') + '\n' + barra_carrito(5,'$ 25.600')
guardar('R-Categoria.dc.html','R · Categoría con variantes',cuerpo)

def item(t, sub, v, cant):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="width: 44px; height: 44px; flex: none; border-radius: 14px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC["caja"],AZUL,20)}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub} · {cant}</span></span><strong style="font-size: 14px">{v}</strong></div>'
def casilla(t, sub, on, ic):
    m=f'<span style="width: 26px; height: 26px; flex: none; border-radius: 8px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",15,3)}</span>' if on else f'<span style="width: 26px; height: 26px; flex: none; border-radius: 8px; border: 2px solid #C9CFDA"></span>'
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}">{svg(IC[ic],AZUL,20)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{m}</div>'
cuerpo = barra_compacta('Tu pedido','R-Catalogo.dc.html',sub='5 ítems · $ 25.600 · simulación') + contenido(f'''
    {tarjeta(etiqueta("PLOMERÍA · DE TU PRESUPUESTO")+item('Cartucho cerámico 35 mm','Para Pierde la canilla','$ 9.800','1')+item('Flexible 40 cm','Para Pierde la canilla','$ 3.200','2')+item('Teflón 12 mm','De tu lista de compras','$ 6.900','3'))}
    {tarjeta(etiqueta("FIJACIONES · DEL CATÁLOGO")+item('Tarugo de nylon 8 mm','Caja de 50','$ 4.200','1')+item('Pastina gris','Para Baño completo · aprobada por Martín','$ 1.500','2'))}
    {tarjeta(casilla('Registrar como gasto','Al retirar, con el ticket',True,'billete')+casilla('Cobrar al cliente lo que corresponda','Va por el chat de cada trabajo',True,'ticket'))}''') + '\n' + accion_fija('Elegir la ferretería','R-Ferreterias.dc.html')
guardar('R-Pedir.dc.html','R · Tu pedido',cuerpo)
print('ok')
