import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({'cara':'<circle cx="12" cy="12" r="9"></circle><path d="M9 10h.01M15 10h.01M8.5 15a5 5 0 0 0 7 0"></path>','ojo':'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>','deshacer':'<path d="M9 14L4 9l5-5"></path><path d="M4 9h11a5 5 0 0 1 0 10h-3"></path>','flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>','libro':'<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z"></path><path d="M20 4h-5a3 3 0 0 0-3 3"></path><path d="M20 4v14h-6"></path>','casa2':'<path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path>','descargar':'<path d="M12 4v12M7 11l5 5 5-5"></path><path d="M4 20h16"></path>','salir':'<path d="M10 4H5v16h5"></path><path d="M14 8l4 4-4 4M18 12H9"></path>'})

def interr(t, sub, on):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div role="switch" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span aria-hidden="true" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
def campo(et, v, ph=False, ic=None, extra=''):
    i=svg(IC[ic],SUAVE,18) if ic else ''
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 52px; border-radius: 16px; border: {"1px solid "+BORDE if ph else "2px solid "+AZUL}; background: #FFFFFF; display: flex; align-items: center; gap: 8px; padding: 0 14px; font-size: 15px; font-weight: {400 if ph else 700}; color: {SUAVE if ph else TINTA}">{i}<span style="flex: 1">{v}</span>{extra}</span></div>'
def op(t, on=False, href=None):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    tag='a' if href else 'span'; h=f' href="{href}"' if href else ''
    return f'<{tag}{h} style="min-height: 44px; padding: 0 12px; border-radius: 14px; {s}; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; white-space: nowrap">{t}</{tag}>'
def modal(html, bottom=100, extra=''):
    return f'<section style="position: absolute; left: 12px; right: 12px; bottom: {bottom}px; padding: 16px; border-radius: 30px; background: #FFFFFF; box-shadow: 0 2px 6px rgba(14,29,54,0.10), 0 30px 60px -18px rgba(14,29,54,0.55); display: flex; flex-direction: column; gap: 12px; {extra}">{html}</section>'
def chip_flotante(html, top, left=12, right=None):
    pos=f'left: {left}px;' if right is None else f'right: {right}px;'
    return f'<div style="position: absolute; top: {top}px; {pos} padding: 8px 12px; border-radius: 999px; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; gap: 8px">{html}</div>'

# ── Inicio: trabajos como modales flotantes sobre el mapa ─────────────
camino_chip=f'<a href="G-Inicio.dc.html" style="position: absolute; top: 132px; left: 12px; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 14px 0 8px; border-radius: 999px; background: #FFFFFF; box-shadow: {ELEV2}; color: {TINTA}; text-decoration: none"><span style="width: 38px; height: 38px; border-radius: 50%; background: conic-gradient({AZUL} 0 80%, {AMARILLO} 80% 90%, {MOSAICO} 90% 100%); display: flex; align-items: center; justify-content: center"><span style="width: 28px; height: 28px; border-radius: 50%; background: #FFFFFF; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center">8/10</span></span><span style="display: flex; flex-direction: column"><strong style="font-size: 13px">Tu camino</strong><span style="font-size: 11px; color: {SUAVE}">+1 si se verifica</span></span></a>'
pedido=f'''<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("PEDIDO URGENTE · QUEDAN 18:42", AZUL)}<span role="img" style="display: flex; gap: 4px" aria-label="Pedido 1 de 2"><span style="width: 18px; height: 6px; border-radius: 3px; background: {AZUL}"></span><span style="width: 6px; height: 6px; border-radius: 3px; background: #C9CFDA"></span></span></div>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px">
      <span style="display: flex; flex-direction: column; gap: 4px; min-width: 0"><h1 style="margin: 0; {TIT}; font-size: 28px; line-height: 1">{marcador("Plomería")}</h1><span style="font-size: 14px; color: {TEXTO}">Pierde la canilla de la cocina</span><span>{chip("Centro · zona aproximada · 2,1 km","pin")}</span></span>
      {mosaico_handy('cano',66)}
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
      <span style="display: flex; flex-direction: column; min-width: 0"><span style="font-size: 12px; font-weight: 700; color: {SUAVE}">Handyx sugiere · vos decidís</span><span style="{TIT}; font-size: 26px; white-space: nowrap">$ 45.000</span></span>
      {boton("Ver pedido", "F-Pedido.dc.html", alto=52)}
    </div>'''
detras=f'<div aria-hidden="true" style="position: absolute; left: 30px; right: 30px; bottom: 108px; height: 260px; border-radius: 30px; background: #FFFFFF; opacity: 0.7; box-shadow: {ELEV1}; transform: translateY(-14px)"></div>'
cuerpo = mapa(zona=(215,330,60), punto=(95,420)) + '\n' + cabecera_azul() + '\n' + interruptor(True) + '\n' + camino_chip + detras + modal(pedido) + '\n' + barra_vidrio('Inicio')
guardar('F-Inicio.dc.html','Núcleo · Inicio con mapa',cuerpo)

ruta=[(95,420),(140,350),(205,320),(240,240),(270,210)]
paradas=''.join(f'<span style="position: absolute; left: {x-16}px; top: {y-16}px; width: 32px; height: 32px; border-radius: 50%; background: {c}; color: {t}; border: 3px solid #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px">{n}</span>' for x,y,n,c,t in [(205,320,'✓','#1E9E57','#FFFFFF'),(270,210,2,AZUL,'#FFFFFF'),(60,290,3,AMARILLO,TINTA)])
dia=f'''<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("TU DÍA · 3 PARADAS · 14 KM", AZUL)}<a href="F-InicioRuta.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">Ver todo</a></div>
    <div style="display: flex; gap: 12px; align-items: center">{avatar('lucia',48)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="{TIT}; font-size: 20px; line-height: 1.1">Próxima: la canilla</strong><span style="font-size: 13px; color: {SUAVE}">Lucía Ferreyra · 18 a 20 · 12 min en auto</span></span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.5fr); gap: 10px">{boton2("Avisar demora","H0-ModoAgenda.dc.html","reloj")}{boton(svg(IC["camion"],"#FFFFFF",20)+"Salir para allá","TR-EnCamino.dc.html",alto=52)}</div>'''
cuerpo = mapa(ruta=ruta, punto=(95,420), extra=paradas) + '\n' + cabecera_azul() + '\n' + interruptor(True) + '\n' + camino_chip.replace('+1 si se verifica','8 de 10') + modal(dia) + '\n' + barra_vidrio('Inicio')
guardar('F-InicioDia.dc.html','Núcleo · Inicio con tu día',cuerpo)

def parada(n, h, t, sub, est, href):
    m={'hecho':(f'background: #1E9E57; color: #FFFFFF','✓'),'ahora':(f'background: {AZUL}; color: #FFFFFF','2'),'luego':(f'background: {MOSAICO}; color: {TINTA}','3')}[est]
    c={'hecho':chip("Hecho","check","exito"),'ahora':chip("En 10 min","reloj","amarillo"),'luego':chip("20:30","agenda","gris")}[est]
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 36px; height: 36px; flex: none; border-radius: 50%; {m[0]}; display: flex; align-items: center; justify-content: center; font-weight: 900">{m[1]}</span><span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 14px">{h} · {t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{c}</a>'
cuerpo = mapa(ruta=[(x,y-60) for x,y in ruta], punto=(95,360), extra=paradas.replace('top: 304px','top: 244px').replace('top: 194px','top: 134px').replace('top: 274px','top: 214px')) + f'''
  <a href="F-InicioDia.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 14px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>
''' + modal(f'''<div style="display: flex; justify-content: space-between; align-items: baseline"><h1 style="margin: 0; {TIT}; font-size: 28px">Tu {marcador("día")}</h1><span style="font-size: 13px; font-weight: 700; color: {SUAVE}">14 km · 312 en el mes</span></div>
    <div>{parada(1,'9:00','Baño completo','Los Troncos · jornada 3 de 6','hecho','F-ObraDia.dc.html')}{parada(2,'18:00','Pierde la canilla','Centro · Lucía Ferreyra','ahora','F-Trabajo.dc.html')}{parada(3,'20:30','Retiro en ferretería','Pastina para mañana · 4 min de desvío','luego','R-Retiro.dc.html')}</div>
    <span style="font-size: 12px; color: {SUAVE}">Mantené apretada una parada para cambiar el orden.</span>
    {boton(svg(IC["camion"],"#FFFFFF",20)+"Salir para la parada 2","TR-EnCamino.dc.html")}''', bottom=14)
guardar('F-InicioRuta.dc.html','Núcleo · Tu día en el mapa',cuerpo)

# ── Modal para escribir el precio ────────────────────────────────────
teclas=''.join(f'<span style="height: 56px; border-radius: 16px; background: {MOSAICO if k not in ("borrar",) else "#FFFFFF"}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 24px">{svg(IC["deshacer"],TINTA,22) if k=="borrar" else k}</span>' for k in ['1','2','3','4','5','6','7','8','9','000','0','borrar'])
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Escribí tu precio</strong><a href="F-Precio.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <div style="padding: 16px; border-radius: 22px; background: {TINTE}; display: flex; flex-direction: column; align-items: center; gap: 4px"><span style="{TIT}; font-size: 48px; line-height: 1; white-space: nowrap">$ 48.500<span style="display: inline-block; width: 3px; height: 40px; margin-left: 4px; background: {AZUL}; vertical-align: middle"></span></span><span style="font-size: 13px; color: {HONDO}">$ 3.500 más que lo sugerido · recibís el 100 %</span></div>
    <div style="display: flex; gap: 8px; justify-content: center">{op("− $ 1.000")}{op("Redondear")}{op("+ $ 1.000")}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{teclas}</div>
    {boton("Usar $ 48.500","F-Precio.dc.html")}''', 186)
guardar('F-PrecioTeclado.dc.html','Núcleo · Escribir el precio',cuerpo)

# ── Horario a medida: franja u hora exacta ───────────────────────────
def rueda(valores, sel, nombre='Hora'):
    items=''.join(f'<span role="option" aria-selected="{str(i==sel).lower()}" style="height: 40px; display: flex; align-items: center; justify-content: center; {TIT}; font-size: {28 if i==sel else 20}px; color: {TINTA if i==sel else "#56627A"}">{v}</span>' for i,v in enumerate(valores))
    return f'<div role="listbox" aria-label="{nombre}" style="position: relative; flex: 1; display: flex; flex-direction: column"><span aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 80px; height: 40px; border-radius: 12px; background: {TINTE}"></span><div style="position: relative">{items}</div></div>'
cuerpo = '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Hoy, martes 17 · tu horario</strong><a href="F-Fecha.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Cancelar</a></div>
    <div role="tablist" style="display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: {MOSAICO}"><span role="tab" aria-selected="true" style="flex: 1; min-height: 44px; border-radius: 12px; background: #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center; font-weight: 800">Una franja</span><span role="tab" aria-selected="false" style="flex: 1; min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: {SUAVE}">Hora exacta</span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) 30px minmax(0,1fr); align-items: center; gap: 6px">
      <div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}; text-align: center">DESDE</span><div style="display: flex; gap: 4px">{rueda(['04','05','06','07','08'],2,'Desde, hora')}{rueda(['00','15','30','45','00'],1,'Desde, minutos')}</div></div>
      <span style="text-align: center; font-weight: 900; color: {SUAVE}">a</span>
      <div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}; text-align: center">HASTA</span><div style="display: flex; gap: 4px">{rueda(['06','07','08','09','10'],2,'Hasta, hora')}{rueda(['00','15','30','45','00'],0,'Hasta, minutos')}</div></div>
    </div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap">{op("6 a 8",True)}{op("7 a 9")}{op("A las 6:30")}{op("Toda la mañana")}</div>
    <span style="font-size: 12px; color: {SUAVE}">Es tu propuesta: el cliente la acepta o elige otra. Fuera de horario no hay recargo automático; si querés cobrar más, lo ponés vos en el precio.</span>
    {boton("Proponer de 6:15 a 8:00","F-Revisar.dc.html")}''', 150)
guardar('F-FechaHora.dc.html','Núcleo · Horario a medida',cuerpo)

# ── Iniciar sesión, 2FA y recuperar ──────────────────────────────────
svg_c='''<div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 210px; background: #1F57A8; border-radius: 0 0 36px 36px; overflow: hidden">'''+''.join(f'<span style="position: absolute; left: {x}px; bottom: 0; width: {w}px; height: {h}px; border-radius: 5px 5px 0 0; background: {c}"></span>' for x,w,h,c in [(-10,60,120,'#143E7E'),(56,70,160,'#2C66B8'),(132,64,100,'#143E7E'),(202,76,140,'#2C66B8'),(284,60,110,'#143E7E'),(350,60,150,'#2C66B8')])+'</div>'
cuerpo = svg_c + f'''
  <a href="D6-Bienvenida.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 16px; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',20)}</a>
  <div style="position: absolute; top: 34px; left: 0; right: 0; text-align: center; {TIT}; font-size: 30px; color: #FFFFFF">Handyx</div>
''' + contenido(f'''
    <div style="display: flex; flex-direction: column; gap: 4px">{etiqueta("YA TENÉS CUENTA")}<h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1">{marcador("Entrá")} a tu cuenta</h1></div>
    {campo("Email o teléfono","especialista@example.test",ic="sobre")}
    {campo("Contraseña","••••••••••",ic="candado",extra=svg(IC['ojo'],SUAVE,20))}
    <div style="display: flex; justify-content: space-between; align-items: center"><span style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px"><span style="width: 24px; height: 24px; border-radius: 7px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC['check'],'#FFFFFF',14,3)}</span>Recordar este teléfono</span><a href="D6-Recuperar.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">¿Olvidaste la contraseña?</a></div>
    {boton("Entrar","D6-Login2FA.dc.html")}
    <div style="display: flex; align-items: center; gap: 10px; color: {SUAVE}; font-size: 13px"><span style="flex: 1; height: 1px; background: {BORDE}"></span>o entrá con<span style="flex: 1; height: 1px; background: {BORDE}"></span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Google","D6-Login2FA.dc.html")}{boton2("Apple","D6-Login2FA.dc.html")}</div>
    <a href="D6-Acceso.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">Entrar sin contraseña, con un código</a>''', top=232)
guardar('D6-Login.dc.html','Acceso · Iniciar sesión',cuerpo)

cas=''.join(f'<span style="height: 60px; border-radius: 18px; background: {"#FFFFFF" if d else "#F6F7F9"}; border: 2px solid {AZUL if i==3 else BORDE}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 26px">{d}</span>' for i,d in enumerate(['2','0','7','','','']))
cuerpo = barra_compacta('Segunda verificación','D6-Login.dc.html',sub='Paso 2 de 2') + contenido(f'''
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding-top: 6px">{mosaico_ic('escudo',72,fondo=AZUL,color='#FFFFFF',radio=24,iconsize=36)}<h1 style="margin: 0; {TIT}; font-size: 28px; line-height: 1.05">Código de tu {marcador("app")}</h1><span style="font-size: 14px; color: {TEXTO}">Abrí tu app autenticadora y escribí los 6 números de Handyx.</span></div>
    <div role="group" aria-label="Código de 6 dígitos" style="display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 8px">{cas}</div>
    {tarjeta(fila_ic('telefono','Mandarme un SMS','Al teléfono que termina en 4521',href='D6-Codigo.dc.html',borde=False)+fila_ic('llave2','Usar un código de respaldo','Los que guardaste al activarla',href='D6-Login2FA.dc.html'))}''') + '\n' + accion_fija('Entrar','F-Inicio.dc.html')
guardar('D6-Login2FA.dc.html','Acceso · Segunda verificación al entrar',cuerpo)

cuerpo = barra_compacta('Recuperar la contraseña','D6-Login.dc.html') + contenido(f'''
    <div style="display: flex; flex-direction: column; gap: 6px">{etiqueta("TE AYUDAMOS")}<h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1.05">Creá una {marcador("nueva")}</h1><span style="font-size: 14px; color: {SUAVE}">Te mandamos un enlace al email. Vence en 30 minutos y sirve una sola vez.</span></div>
    {campo("Email o teléfono","especialista@example.test",ic="sobre")}
    {tarjeta(fila_ic('sobre','Revisá tu email','Si no llega, mirá en «no deseado»',borde=False,derecha=chip("Enviado","check","exito")))}
    {campo("Contraseña nueva","••••••••••",ic="candado")}
    <span style="font-size: 12px; color: #137140; font-weight: 700">Segura: 10 caracteres, con números y símbolos</span>
    <span style="font-size: 12px; color: {SUAVE}">Por seguridad cerramos las sesiones abiertas en otros teléfonos.</span>''') + '\n' + accion_fija('Guardar y entrar','D6-Login.dc.html')
guardar('D6-Recuperar.dc.html','Acceso · Recuperar la contraseña',cuerpo)

# ── Onboarding después del alta ──────────────────────────────────────
papel=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: 10px; height: 16px; border-radius: 2px; background: {c}; transform: rotate({r}deg)"></span>' for x,y,c,r in [(50,150,AMARILLO,20),(320,130,AZUL,-15),(80,330,AZUL,40),(300,300,AMARILLO,-30),(190,100,NARANJA,10),(250,380,'#1E9E57',30)])
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 470px; background: {AZUL}; border-radius: 0 0 40px 40px"></div>
  {papel}
  <div style="position: absolute; top: 120px; left: 50%; margin-left: -110px; width: 220px; height: 220px; border-radius: 60px; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center"><img src="{BLOB['llave']}" alt="" aria-hidden="true" style="width: 130px; height: 150px; object-fit: contain"></div>
  <section style="position: absolute; top: 360px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; color: #FFFFFF">{chip("Verificado por Handyx","escudo","blanco")}<h1 style="margin: 0; {TIT}; font-size: 34px; line-height: 1.02">¡Estás habilitado, Julián!</h1></section>
''' + contenido(f'''
    <p style="margin: 0; font-size: 15px; color: {TEXTO}; text-align: center">Ya podés recibir pedidos de Plomería y Gas en tus 4 barrios. Te armamos tres pasos cortos para arrancar bien.</p>
    {tarjeta(fila_ic('regalo','Tu kit de bienvenida','Remera y manual · elegí el talle',derecha=chip("Nuevo","estrella","amarillo"),href='G-Bienvenida.dc.html',borde=False))}''', top=500) + '\n' + accion_fija('Empezar','OB-Permisos.dc.html')
guardar('OB-Aprobado.dc.html','Onboarding · Habilitado',cuerpo)

def permiso(ic, t, sub, on, cuando):
    return f'<div style="display: flex; gap: 14px; align-items: flex-start; padding: 14px; border-radius: 22px; background: {TINTE if on else "#FFFFFF"}; border: {"2px solid "+AZUL if on else "1px solid "+BORDE}">{mosaico_ic(ic,48,fondo=AZUL if on else MOSAICO,color="#FFFFFF" if on else TINTA,radio=16,iconsize=24)}<span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 16px">{t}</strong><span style="font-size: 13px; color: {TEXTO}">{sub}</span><span style="font-size: 12px; color: {SUAVE}">{cuando}</span></span></div>'
cuerpo = barra_compacta('Antes de empezar','OB-Aprobado.dc.html',sub='1 de 3') + contenido(f'''
    {titulo_grande("PERMISOS","Dos ","permisos"," que te sirven")}
    {permiso('campana','Avisos','Para enterarte de pedidos nuevos, respuestas y pagos verificados.',True,'Los apagás o elegís cuáles en Cuenta → Avisos.')}
    {permiso('pin','Ubicación','Solo mientras vas a un trabajo, para que el cliente sepa cuánto falta.',False,'Nunca en segundo plano ni cuando estás No disponible.')}
    <span style="font-size: 12px; color: {SUAVE}">Podés seguir sin darlos; algunas funciones te lo van a pedir en el momento.</span>''') + '\n' + acciones_fijas(boton('Permitir avisos','OB-Tour.dc.html'), f'<a href="OB-Tour.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">Ahora no</a>')
guardar('OB-Permisos.dc.html','Onboarding · Permisos',cuerpo)

cuerpo = f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 520px; background: {TINTE}; border-radius: 0 0 40px 40px"></div>
  <div aria-hidden="true" style="position: absolute; top: 80px; left: 50%; margin-left: -105px; width: 210px; height: 380px; border-radius: 34px; background: #FFFFFF; box-shadow: {ELEV2}; overflow: hidden">
    <div style="height: 70px; background: {AZUL}"></div>
    <div style="margin: 14px; padding: 12px; border-radius: 18px; background: #FFFFFF; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 6px"><span style="height: 8px; width: 60%; border-radius: 4px; background: {AZUL}"></span><span style="height: 12px; width: 70%; border-radius: 4px; background: {TINTA}"></span><span style="height: 8px; width: 90%; border-radius: 4px; background: {MOSAICO}"></span><span style="margin-top: 6px; height: 26px; width: 100%; border-radius: 10px; background: {AMARILLO}"></span></div>
    <div style="margin: 0 14px; height: 18px; border-radius: 9px; background: {AMARILLO}"></div>
  </div>
  <a href="OB-PrimerosPasos.dc.html" style="position: absolute; top: 18px; right: 16px; display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Saltar</a>
  <section style="position: absolute; top: 548px; left: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px">
    <span role="img" style="display: flex; gap: 6px" aria-label="Paso 2 de 3"><span style="width: 8px; height: 8px; border-radius: 4px; background: #C9CFDA"></span><span style="width: 24px; height: 8px; border-radius: 4px; background: {AZUL}"></span><span style="width: 8px; height: 8px; border-radius: 4px; background: #C9CFDA"></span></span>
    <h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1.05">Vos {marcador("ponés el precio")}</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Handyx te sugiere uno para cada pedido, pero el que manda es el tuyo. Y el cliente te paga directo a vos: no te cobramos comisión.</p>
  </section>
''' + accion_fija('Siguiente','OB-PrimerosPasos.dc.html')
guardar('OB-Tour.dc.html','Onboarding · Cómo funciona',cuerpo)

def pp(ic, t, sub, ok, href):
    m=f'<span style="width: 30px; height: 30px; flex: none; border-radius: 50%; background: {"#1E9E57" if ok else "#FFFFFF"}; border: 2px solid {"#1E9E57" if ok else "#C9CFDA"}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3) if ok else ""}</span>'
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none">{m}{mosaico_ic(ic,40,radio=12,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 15px; {"text-decoration: line-through; color: "+SUAVE if ok else ""}">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{svg(IC["flecha"],SUAVE,18)}</a>'
cuerpo = barra_compacta('Primeros pasos','OB-Tour.dc.html',sub='3 de 3') + contenido(f'''
    <div style="display: flex; align-items: center; gap: 14px">{anillo(2,6,64)}<span style="display: flex; flex-direction: column; gap: 2px">{etiqueta("PARA ARRANCAR BIEN")}<strong style="{TIT}; font-size: 24px; line-height: 1.05">Te quedan 4 cosas</strong><span style="font-size: 13px; color: {SUAVE}">Ninguna es obligatoria para recibir pedidos.</span></span></div>
    {tarjeta(pp('cuenta','Completá tu perfil','Foto y presentación corta',True,'CU-Perfil.dc.html')+pp('pin','Revisá zonas y horarios','Cuándo y dónde trabajás',True,'CU-Disponibilidad.dc.html')+pp('billete','Cargá cómo cobrás','Mercado Pago o efectivo',False,'CU-Cobros.dc.html')+pp('ticket','Armá tu lista de precios','Con una foto del corralón',False,'H0-Precios.dc.html')+pp('caja','Sumá tu equipamiento','Herramientas y consumibles',False,'H0-Equipo.dc.html')+pp('libro','Leé el manual','6 capítulos cortos',False,'G-Manual.dc.html'))}''') + '\n' + accion_fija('Ir al inicio y ponerme disponible','F-Inicio.dc.html')
guardar('OB-PrimerosPasos.dc.html','Onboarding · Primeros pasos',cuerpo)

# ── Cuenta completa ──────────────────────────────────────────────────
cuerpo = barra_compacta('Tu perfil','F-Cuenta.dc.html',sub='Así te ven los clientes') + contenido(f'''
    <section style="border-radius: 28px; overflow: hidden; border: 1px solid {BORDE}; box-shadow: {ELEV2}">
      <div style="height: 70px; background: {AZUL}"></div>
      <div style="padding: 0 16px 16px; display: flex; flex-direction: column; gap: 8px; margin-top: -40px">
        <span style="border-radius: 50%; box-shadow: 0 0 0 4px #FFFFFF; align-self: flex-start">{avatar('yo',80)}</span>
        <strong style="{TIT}; font-size: 24px">Julián Ortiz</strong>
        <span style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Verificado por Handyx","escudo","exito")}{chip("Plomería","gota","gris")}{chip("Gas","llama","gris")}</span>
        <span style="font-size: 14px; color: {TEXTO}">«Plomero y gasista en Mar del Plata hace 12 años. Trabajo prolijo y te explico todo.»</span>
        <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{''.join(f'<div style="padding: 10px; border-radius: 16px; background: {MOSAICO}; text-align: center"><strong style="display: block; {TIT}; font-size: 18px">{v}</strong><span style="font-size: 11px; color: {SUAVE}">{t}</span></div>' for v,t in [('38','trabajos verificados'),('3','certificados'),('nov 2026','en Handyx')])}</div>
      </div>
    </section>
    {tarjeta(fila_ic('escudo','Matrícula de gasista','Verificada · vence 03/2028',derecha=chip("Verificada","check","exito"),borde=False)+fila_ic('documento','Curso de termofusión','Cargado · lo estamos revisando',derecha=chip("En revisión","reloj","amarillo")))}''') + '\n' + accion_fija('Editar foto y presentación','CU-Perfil.dc.html')
guardar('CU-Perfil.dc.html','Cuenta · Tu perfil',cuerpo)

def dato(et, v, est):
    return f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}"><span style="display: flex; flex-direction: column"><span style="font-size: 12px; color: {SUAVE}">{et}</span><strong style="font-size: 15px">{v}</strong></span>{est}</div>'
cuerpo = barra_compacta('Datos y verificación','F-Cuenta.dc.html') + contenido(f'''
    {tarjeta(etiqueta("TUS DATOS")+dato('Nombre','Julián Ortiz',chip("Verificado","check","exito"))+dato('DNI','•• ••• 678',chip("Verificado","check","exito"))+dato('CUIT','20-•• ••• 678-9',chip("Verificado","check","exito"))+dato('Domicilio','La Perla · cifrado',chip("Solo vos","candado","gris")))}
    {tarjeta(etiqueta("DOCUMENTOS")+fila_ic('cara','Selfie y DNI','Verificados el 10/11',borde=False)+fila_ic('escudo','Antecedentes penales','Verificados el 10/11 · el archivo ya se borró')+fila_ic('documento','Certificados y matrículas','3 cargados · 2 verificados',href='RG-8.dc.html'))}
    <span style="font-size: 12px; color: {SUAVE}">Mostramos solo los últimos números. Para cambiar un dato verificado te pedimos el documento de nuevo.</span>''')
guardar('CU-Datos.dc.html','Cuenta · Datos y verificación',cuerpo)

def hora_dia(d, txt, on=True):
    return f'<div style="display: flex; justify-content: space-between; align-items: center; min-height: 44px; border-top: 1px solid {BORDE}"><strong style="font-size: 14px; width: 40px">{d}</strong><span style="flex: 1; font-size: 14px; color: {TEXTO if on else SUAVE}">{txt}</span>{chip("Editar","reloj","gris") if on else chip("No trabajo",tono="gris")}</div>'
cuerpo = barra_compacta('Disponibilidad y zonas','F-Cuenta.dc.html') + contenido(f'''
    <div>{interr("Urgentes ahora","Solo cuando prendés Disponible en el Inicio",True)}{interr("Pedidos programados","Te llegan para otro día, dentro de tus horarios",True)}</div>
    {tarjeta(etiqueta("HORARIOS")+hora_dia('Lun','8:00 a 18:00')+hora_dia('Mar','8:00 a 18:00')+hora_dia('Mié','8:00 a 18:00')+hora_dia('Sáb','9:00 a 13:00')+hora_dia('Dom','',False))}
    {tarjeta(fila_ic('pin','Zonas','La Perla, Centro, Los Troncos, Chauvín',href='RG-4.dc.html',borde=False)+fila_ic('herramienta','Rubros','Plomería y Gas',href='RG-3.dc.html'))}''')
guardar('CU-Disponibilidad.dc.html','Cuenta · Disponibilidad y zonas',cuerpo)

cuerpo = barra_compacta('Medios de cobro','F-Cuenta.dc.html') + contenido(f'''
    <div style="padding: 14px 16px; border-radius: 22px; background: #E3F4EA; display: flex; gap: 12px; align-items: center">{svg(IC['billete'],'#137140',26)}<span style="font-size: 14px; color: #137140; font-weight: 700">El cliente te paga directo a vos. Handyx no recibe la plata ni te cobra comisión.</span></div>
    {tarjeta(fila_ic('billete','Mercado Pago','Cuenta vinculada · julian•••@example.test',derecha=chip("Activo","check","exito"),borde=False)+fila_ic('billete','Efectivo','Lo informás al terminar cada trabajo',derecha=chip("Activo","check","exito"))+fila_ic('documento','Transferencia','Alias que le mostrás al cliente',derecha=chip("Agregar","mas","gris")))}
    <span style="font-size: 12px; color: {SUAVE}">Lo que informás queda «por verificar» hasta que se confirma el pago.</span>''') + '\n' + accion_fija(svg(IC['mas'],'#FFFFFF',20)+'Agregar un medio de cobro','CU-Cobros.dc.html')
guardar('CU-Cobros.dc.html','Cuenta · Medios de cobro',cuerpo)

cuerpo = barra_compacta('Avisos','F-Cuenta.dc.html',sub='Qué te llega') + contenido(f'''
    {tarjeta(etiqueta("PEDIDOS Y TRABAJOS")+interr("Pedidos nuevos","De tus rubros y zonas",True)+interr("Respuestas de clientes","Aceptó, pidió cambios o escribió",True)+interr("Recordatorios","Turnos, jornadas y repuestos que faltan",True))}
    {tarjeta(etiqueta("PLATA Y CAMINO")+interr("Pagos verificados","Cuando se confirma un cobro",True)+interr("Tu camino","Cuando llegás a un premio",True)+interr("Novedades de Handyx","Una vez por mes, como mucho",False))}
    {tarjeta(interr("Silencio de 22 a 7","Salvo pedidos urgentes si estás Disponible",True))}''')
guardar('CU-Notificaciones.dc.html','Cuenta · Avisos',cuerpo)

cuerpo = barra_compacta('Privacidad y baja','F-Cuenta.dc.html') + contenido(f'''
    {tarjeta(etiqueta("TUS DATOS")+fila_ic('descargar','Descargar mis datos','Te mandamos un archivo en 48 horas',href='CU-Privacidad.dc.html',borde=False)+fila_ic('documento','Aviso de privacidad','Qué guardamos, para qué y cuánto tiempo',href='CU-Privacidad.dc.html')+fila_ic('pin','Ubicación','Se borra a los 30 días de cada viaje'))}
    {tarjeta(etiqueta("SESIÓN")+fila_ic('telefono','Este teléfono','Entró hoy 17:40',borde=False)+fila_ic('salir','Cerrar sesión','En este teléfono',href='D6-Login.dc.html'))}
    <a href="CU-Privacidad.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 14px 16px; border-radius: 20px; border: 2px solid #F3C4BF; color: #A8261C; text-decoration: none">{svg(IC['alerta'],'#A8261C',22)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Darme de baja</strong><span style="font-size: 12px">Te contamos qué se borra y qué guardamos por ley</span></span>{svg(IC['flecha'],'#A8261C',18)}</a>''')
guardar('CU-Privacidad.dc.html','Cuenta · Privacidad y baja',cuerpo)

# ── En camino e informar el cobro ────────────────────────────────────
cuerpo = mapa(ruta=[(95,600),(130,520),(200,470),(230,380),(270,330)], punto=(130,520), extra=f'<span style="position: absolute; left: 254px; top: 300px; width: 36px; height: 36px; border-radius: 12px; background: {AMARILLO}; border: 3px solid #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center">{svg(IC["casa2"],TINTA,18)}</span>') + f'''
  <div style="position: absolute; top: 14px; left: 12px; right: 12px; padding: 14px 16px; border-radius: 26px; background: {AZUL}; color: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; gap: 12px">{svg(IC['flecha'],AMARILLO,30,3)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 18px">En 300 m, doblá a la derecha</strong><span style="font-size: 13px; color: #F0F5FD">por Calle De Prueba</span></span></div>
''' + modal(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; flex-direction: column"><strong style="{TIT}; font-size: 30px; line-height: 1">12 min</strong><span style="font-size: 13px; color: {SUAVE}">Llegás 18:12 · 4,1 km</span></span>{chip("Lucía ve que vas en camino","pin","tinte")}</div>
    <div style="display: flex; gap: 12px; align-items: center">{avatar('lucia',44)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Lucía Ferreyra</strong><span style="font-size: 12px; color: {SUAVE}">Calle De Prueba 123 · timbre 2</span></span><a href="F-Chat.dc.html" aria-label="Escribirle" style="width: 48px; height: 48px; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['chat'],TINTA,22)}</a></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.4fr); gap: 10px">{boton2("Dejar de compartir","F-Trabajo.dc.html")}{boton("Ya llegué","H0-Modo.dc.html",alto=52)}</div>
    <span style="font-size: 11px; color: {SUAVE}">Tu ubicación se comparte solo hasta que llegás. Se marca sola al estar en la puerta.</span>''', bottom=14)
guardar('TR-EnCamino.dc.html','Trabajo · En camino',cuerpo)

cuerpo = barra_compacta('¿Cómo te pagó?','H0-Modo.dc.html',sub='Pierde la canilla') + contenido(f'''
    <div style="padding: 16px; border-radius: 24px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; display: flex; flex-direction: column; gap: 4px">{etiqueta("ACORDADO","#CFE0FA")}<strong style="{TIT}; font-size: 40px; line-height: 1; white-space: nowrap">$ 47.000</strong><span style="font-size: 13px; color: #F0F5FD">Incluye materiales · recibís el 100 %</span></div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{op("Efectivo",True)}{op("Mercado Pago")}{op("Transferencia")}</div>
    <div role="radiogroup" aria-label="¿Cobraste todo?" style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">¿Cobraste todo?</strong><div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px"><span role="radio" aria-checked="true" style="min-height: 48px; border-radius: 14px; border: 2px solid {AZUL}; background: {TINTE}; color: {HONDO}; font-weight: 800; display: flex; align-items: center; justify-content: center">Sí, $ 47.000</span><span role="radio" aria-checked="false" style="min-height: 48px; border-radius: 14px; border: 2px solid {BORDE}; font-weight: 800; display: flex; align-items: center; justify-content: center">Una parte</span></div></div>
    <span style="font-size: 12px; color: {SUAVE}">Queda «informado por vos» hasta que Lucía lo confirma o se verifica el pago. Recién ahí suma a tu camino.</span>''') + '\n' + accion_fija('Informar cobro y armar el informe','H0-Informe.dc.html')
guardar('TR-Cobro.dc.html','Trabajo · Informar el cobro',cuerpo)
print('ok')
