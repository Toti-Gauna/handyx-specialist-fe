import sys, re; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({'llave2':'<circle cx="8" cy="15" r="4"></circle><path d="M11 12l9-9M17 6l2 2M15 8l2 2"></path>','sobre':'<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>','ojo':'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle>','lupa':'<circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path>'})
src=open('gen/fila_acceso.py').read()
ns=dict(globals()); exec(src[src.index('def ciudad'):src.index('# Bienvenida con la ciudad.')], ns); ciudad=ns['ciudad']
estrellas=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: {s}px; height: {s}px; border-radius: 50%; background: #FFFFFF; opacity: {o}"></span>' for x,y,s,o in [(40,40,3,.7),(130,24,2,.5),(220,60,2,.5),(300,30,3,.8),(350,90,2,.5),(180,96,2,.4)])

# ── Iniciar sesión: la misma ciudad de la bienvenida, en chico ──
svg_c,_=ciudad(330, ancho=780)
svg_c=svg_c.replace('width="780" height="330"','width="390" height="165"',1)
def campo(et, v, ph=False, ic=None, extra=''):
    i=svg(IC[ic],SUAVE,18) if ic else ''
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 52px; border-radius: 16px; border: {"1px solid "+BORDE if ph else "2px solid "+AZUL}; background: #FFFFFF; display: flex; align-items: center; gap: 8px; padding: 0 14px; font-size: 15px; font-weight: {400 if ph else 700}; color: {SUAVE if ph else TINTA}">{i}<span style="flex: 1; min-width: 0">{v}</span>{extra}</span></div>'
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 214px; background: {AZUL}; border-radius: 0 0 36px 36px; overflow: hidden">
    {estrellas}
    <div style="position: absolute; top: 22px; right: 34px; width: 40px; height: 40px; border-radius: 50%; background: {AMARILLO}; box-shadow: 0 0 0 8px rgba(245,245,154,0.18)"></div>
    {svg_c}
  </div>
  <a href="D6-Bienvenida.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 16px; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',20)}</a>
  <div style="position: absolute; top: 14px; left: 72px; display: flex; flex-direction: column; gap: 1px; color: #FFFFFF"><span style="{TIT}; font-size: 28px; line-height: 1">Handyx</span><span style="font-size: 11px; font-weight: 700">Soluciones, no problemas</span></div>
''' + contenido(f'''
    <div style="display: flex; flex-direction: column; gap: 4px">{etiqueta("YA TENÉS CUENTA")}<h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1">{marcador("Entrá")} a tu cuenta</h1></div>
    {campo("Email o teléfono","especialista@example.test",ic="sobre")}
    {campo("Contraseña","••••••••••",ic="candado",extra=svg(IC['ojo'],SUAVE,20))}
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap"><span style="display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 14px"><span style="width: 24px; height: 24px; border-radius: 7px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC['check'],'#FFFFFF',14,3)}</span>Recordar este teléfono</span><a href="D6-Recuperar.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">¿Olvidaste la contraseña?</a></div>
    {boton("Entrar","D6-Login2FA.dc.html")}
    <div style="display: flex; align-items: center; gap: 10px; color: {SUAVE}; font-size: 13px"><span style="flex: 1; height: 1px; background: {BORDE}"></span>o entrá con<span style="flex: 1; height: 1px; background: {BORDE}"></span></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Google","D6-Login2FA.dc.html")}{boton2("Apple","D6-Login2FA.dc.html")}</div>
    <a href="D6-Acceso.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">Entrar sin contraseña, con un código</a>''', top=236)
guardar('D6-Login.dc.html','Acceso · Iniciar sesión',cuerpo)

# ── ¡Estás habilitado!: ilustración propia (escudo verificado, herramientas y cinta) ──
insignia=f'''<svg aria-hidden="true" width="240" height="210" viewBox="0 0 240 210" style="position: absolute; top: 70px; left: 50%; margin-left: -120px">
  <circle cx="120" cy="100" r="92" fill="rgba(255,255,255,0.10)"></circle><circle cx="120" cy="100" r="70" fill="rgba(255,255,255,0.10)"></circle>
  <g stroke="{AMARILLO}" stroke-width="9" stroke-linecap="round"><path d="M52 160 L96 116"></path><path d="M188 160 L144 116"></path></g>
  <circle cx="48" cy="166" r="12" fill="none" stroke="{AMARILLO}" stroke-width="7"></circle><rect x="181" y="157" width="22" height="14" rx="4" fill="{AMARILLO}" transform="rotate(45 192 164)"></rect>
  <path d="M120 30 L170 48 V96 C170 128 148 150 120 162 C92 150 70 128 70 96 V48 Z" fill="#FFFFFF" stroke="{HONDO}" stroke-width="4" stroke-linejoin="round"></path>
  <path d="M120 44 L158 58 V96 C158 120 142 138 120 148 Z" fill="#E9EFF9"></path>
  <path d="M98 98 L114 114 L144 82" fill="none" stroke="{AZUL}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"></path>
  <path d="M84 168 H156 L148 182 L156 196 H84 L92 182 Z" fill="{AMARILLO}" stroke="#C9C85A" stroke-width="2"></path>
  <text x="120" y="187" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="12" fill="{TINTA}" textLength="56" lengthAdjust="spacingAndGlyphs">VERIFICADO</text>
  <g fill="{AMARILLO}"><path d="M40 52 l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"></path><path d="M198 40 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"></path></g>
</svg>'''
papel=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: 9px; height: 15px; border-radius: 2px; background: {c}; transform: rotate({r}deg)"></span>' for x,y,c,r in [(36,120,AMARILLO,20),(340,110,'#FFFFFF',-15),(70,260,'#FFFFFF',40),(318,250,AMARILLO,-30),(150,40,AMARILLO,10),(250,30,'#8CCBA3',30)])
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 450px; background: {AZUL}; border-radius: 0 0 40px 40px; overflow: hidden">{estrellas}</div>
  {papel}{insignia}
  <section style="position: absolute; top: 312px; left: 20px; right: 20px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; color: #FFFFFF"><span style="font-size: 12px; font-weight: 800; letter-spacing: 1.5px; color: #E6EEFA">EL EQUIPO DE VERIFICACIÓN TE HABILITÓ</span><h1 style="margin: 0; {TIT}; font-size: 29px; line-height: 1.05">¡Estás habilitado, Julián!</h1></section>
''' + contenido(f'''
    <p style="margin: 0; font-size: 15px; color: {TEXTO}; text-align: center">Ya podés recibir pedidos de Plomería y Gas en tus 4 barrios. Te armamos tres pasos cortos para arrancar bien.</p>
    <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap">{chip("Plomería","check","exito")}{chip("Gas · matrícula verificada","check","exito")}</div>
    {tarjeta(fila_ic('regalo','Tu kit de bienvenida','Remera y manual · elegí el talle',derecha=chip("Nuevo","estrella","amarillo"),href='G-Bienvenida.dc.html',borde=False))}''', top=474) + '\n' + accion_fija('Empezar','OB-Permisos.dc.html')
guardar('OB-Aprobado.dc.html','Onboarding · Habilitado',cuerpo)

# ── Tu recorrido: una sola línea continua con los tramos sobre ella ──
def riel(color, arriba=True, abajo=True, punto=''):
    t='0' if arriba else '25px'; b='0' if abajo else 'calc(100% - 25px)'
    return f'<span aria-hidden="true" style="position: relative; width: 34px; flex: none; align-self: stretch"><span style="position: absolute; left: 15px; width: 4px; top: {t}; bottom: {b}; background: {color}"></span>{punto}</span>'
def parada(h, t, sub, est, href, c_arriba, c_abajo, primero=False, ultimo=False):
    c={'ok':'#1E9E57','ahora':AZUL,'luego':'#C9CFDA'}[est]
    ch={'ok':chip("Hecho","check","exito"),'ahora':chip("Sale en 10 min","reloj","amarillo"),'luego':chip("Opcional",tono="gris")}[est]
    pt=f'<span style="position: absolute; top: 8px; left: 0; width: 34px; height: 34px; box-sizing: border-box; border-radius: 50%; background: {c if est!="luego" else "#FFFFFF"}; border: 3px solid {c}; {"box-shadow: 0 0 0 6px rgba(31,87,168,0.18);" if est=="ahora" else ""} display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3) if est=="ok" else ""}</span>'
    linea_arr='' if primero else f'<span style="position: absolute; left: 15px; width: 4px; top: 0; height: 25px; background: {c_arriba}"></span>'
    linea_ab='' if ultimo else f'<span style="position: absolute; left: 15px; width: 4px; top: 25px; bottom: 0; background: {c_abajo}"></span>'
    r=f'<span aria-hidden="true" style="position: relative; width: 34px; flex: none; align-self: stretch">{linea_arr}{linea_ab}{pt}</span>'
    return f'<a href="{href}" style="display: flex; gap: 10px; color: {TINTA}; text-decoration: none"><strong style="width: 46px; flex: none; {TIT}; font-size: 15px; padding-top: 14px; white-space: nowrap">{h}</strong>{r}<span style="flex: 1; min-width: 0; margin: 2px 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 10px 12px; border-radius: 18px; background: {TINTE if est=="ahora" else "#F6F7F9"}"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span>{ch}</span></a>'
def tramo(t, color):
    return f'<div style="display: flex; gap: 10px"><span style="width: 46px; flex: none"></span>{riel(color)}<span style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 0; font-size: 12px; font-weight: 700; color: {SUAVE}">{svg(IC["camion"],SUAVE,16)}{t}</span></div>'
VERDE='#1E9E57'; GRIS='#C9CFDA'
ruta=[(95,410),(140,340),(205,310),(240,230),(270,200)]
paradas_mapa=''.join(f'<span style="position: absolute; left: {x-16}px; top: {y-16}px; width: 32px; height: 32px; border-radius: 50%; background: {c}; color: {t}; border: 3px solid #FFFFFF; box-shadow: {ELEV1}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px">{n}</span>' for x,y,n,c,t in [(205,270,'✓',VERDE,'#FFFFFF'),(270,160,2,AZUL,'#FFFFFF'),(60,240,3,AMARILLO,TINTA)])
def modal(html, bottom=14):
    return f'<section style="position: absolute; left: 12px; right: 12px; bottom: {bottom}px; padding: 16px; border-radius: 30px; background: #FFFFFF; box-shadow: 0 2px 6px rgba(14,29,54,0.10), 0 30px 60px -18px rgba(14,29,54,0.55); display: flex; flex-direction: column; gap: 12px">{html}</section>'
cuerpo = mapa(ruta=[(x,y-40) for x,y in ruta], punto=(95,370), extra=paradas_mapa) + f'''
  <a href="F-InicioDia.dc.html" aria-label="Volver" style="position: absolute; top: 14px; left: 14px; width: 48px; height: 48px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>
  <span style="position: absolute; top: 18px; right: 14px; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 999px; background: #FFFFFF; box-shadow: {ELEV2}; font-size: 13px; font-weight: 800">Terminás 21:00 · 14 km</span>
''' + modal(f'''
    <div style="display: flex; justify-content: space-between; align-items: baseline"><h1 style="margin: 0; {TIT}; font-size: 28px">Tu {marcador("recorrido")}</h1><span style="font-size: 12px; font-weight: 700; color: {SUAVE}">312 km en el mes</span></div>
    <div style="display: flex; flex-direction: column">{parada('9:00','Baño completo','Los Troncos · jornada 3 de 6','ok','F-ObraDia.dc.html',None,VERDE,primero=True)}{tramo('12 min · 4,1 km',VERDE)}{parada('18:00','Pierde la canilla','Centro · Lucía Ferreyra · $ 47.000','ahora','F-Trabajo.dc.html',VERDE,GRIS)}{tramo('4 min de desvío',GRIS)}{parada('20:30','Retiro en ferretería','Pastina para mañana','luego','R-Retiro.dc.html',GRIS,None,ultimo=True)}</div>
    {boton(svg(IC["camion"],"#FFFFFF",20)+"Salir para la parada 2","TR-EnCamino.dc.html")}''')
guardar('F-InicioRuta.dc.html','Núcleo · Tu recorrido',cuerpo)

# ── Proponer una obra nueva (desde Obras) ──
def op(t, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<span role="radio" aria-checked="{str(on).lower()}" style="min-height: 44px; padding: 0 14px; border-radius: 14px; {s}; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; white-space: nowrap">{t}</span>'
def cli(k, sub, on=False):
    return f'<div role="radio" aria-checked="{str(on).lower()}" aria-label="{nombre(k)}" style="display: flex; gap: 12px; align-items: center; min-height: 60px; padding: 0 12px; border-radius: 18px; border: 2px solid {AZUL if on else BORDE}; background: {TINTE if on else "#FFFFFF"}">{avatar(k,40)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 15px">{nombre(k)}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{svg(IC["check"],AZUL,20,3) if on else ""}</div>'
cuerpo = barra_compacta('Obra nueva','F-Obras.dc.html',sub='Paso 1 de 2 · después, etapas y montos') + contenido(f'''
    {titulo_grande("PROPONÉ UNA OBRA","¿Para ","quién","?")}
    <div role="radiogroup" aria-label="Cliente" style="display: flex; flex-direction: column; gap: 8px">{cli('carla','Ya trabajaste para ella · Punta Mogotes',True)}{cli('lucia','Pedido de hoy · Centro')}<div style="display: flex; gap: 12px; align-items: center; min-height: 60px; padding: 0 12px; border-radius: 18px; border: 2px dashed #C9CFDA">{mosaico_ic("mas",40,fondo=AMARILLO,radio=13,iconsize=20)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Un cliente nuevo</strong><span style="font-size: 12px; color: {SUAVE}">Le mandás un enlace para que se sume</span></span></div></div>
    <span style="min-height: 52px; border-radius: 16px; background: #FFFFFF; border: 2px solid {AZUL}; display: flex; align-items: center; padding: 0 14px; {TIT}; font-size: 18px">Cocina nueva</span>
    <div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">Oficios que hacen falta</span><div style="display: flex; gap: 8px; flex-wrap: wrap">{op("Plomería",True)}{op("Gas",True)}{op("Electricidad")}{op("Albañilería")}</div></div>
    <span style="font-size: 12px; color: {SUAVE}">La propuesta le llega a Carla como tarjeta en el chat. Si hace falta, sumás profesionales después.</span>''') + '\n' + accion_fija('Seguir: etapas y montos','F-PropuestaObra.dc.html')
guardar('F-ObraNueva.dc.html','Obras · Proponer una obra nueva',cuerpo)
print('ok')
