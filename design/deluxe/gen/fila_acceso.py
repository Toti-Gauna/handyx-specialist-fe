import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({
 'telefono':'<rect x="7" y="2" width="10" height="20" rx="2.5"></rect><path d="M11 18h2"></path>',
 'sobre':'<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>',
 'llave2':'<circle cx="8" cy="15" r="4"></circle><path d="M11 12l9-9M17 6l2 2M15 8l2 2"></path>',
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
 'cara':'<circle cx="12" cy="12" r="9"></circle><path d="M9 10h.01M15 10h.01M8.5 15a5 5 0 0 0 7 0"></path>',
 'subir':'<path d="M12 16V4M7 9l5-5 5 5"></path><path d="M4 16v4h16v-4"></path>',
 'casa2':'<path d="M3 11l9-7 9 7"></path><path d="M5 10v10h14V10"></path>',
})

# ── SVG propio: edificios de la ciudad con grúa y Handys en las terrazas ─
def ciudad(alto=300, ancho=390, fondo=AZUL):
    import random
    random.seed(4)
    capas=[]
    # capa lejana
    x=0
    while x<ancho:
        w=random.choice([34,40,46]); h=random.randint(90,170)
        capas.append(f'<rect x="{x}" y="{alto-h}" width="{w-4}" height="{h}" rx="3" fill="#2C66B8"></rect>')
        x+=w
    # capa cercana con ventanas
    x=-10; edif=[]
    while x<ancho:
        w=random.choice([56,64,72,80]); h=random.randint(110,220)
        edif.append((x,w,h)); x+=w+6
    for (x,w,h) in edif:
        y=alto-h
        capas.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{HONDO}"></rect>')
        capas.append(f'<rect x="{x}" y="{y}" width="{w}" height="6" rx="3" fill="#0F3268"></rect>')
        for fy in range(y+16, alto-14, 20):
            for fx in range(x+10, x+w-12, 16):
                luz=random.random()
                c = AMARILLO if luz<0.22 else ('#2F5FA6' if luz<0.7 else '#1A4886')
                capas.append(f'<rect x="{fx}" y="{fy}" width="8" height="10" rx="1.5" fill="{c}"></rect>')
    # grúa de obra
    gx=250; gy=alto-250
    capas.append(f'<rect x="{gx}" y="{gy}" width="8" height="250" fill="{AMARILLO}"></rect>')
    capas.append(f'<rect x="{gx-70}" y="{gy}" width="150" height="7" fill="{AMARILLO}"></rect>')
    capas.append(f'<path d="M{gx+4} {gy-18} L{gx-70} {gy} M{gx+4} {gy-18} L{gx+80} {gy}" stroke="{AMARILLO}" stroke-width="2"></path>')
    capas.append(f'<line x1="{gx+60}" y1="{gy+7}" x2="{gx+60}" y2="{gy+60}" stroke="#FFFFFF" stroke-width="1.5"></line><rect x="{gx+52}" y="{gy+60}" width="16" height="10" rx="2" fill="#FFFFFF"></rect>')
    # vereda
    capas.append(f'<rect x="0" y="{alto-10}" width="{ancho}" height="10" fill="#0F3268"></rect>')
    return f'<svg aria-hidden="true" width="{ancho}" height="{alto}" viewBox="0 0 {ancho} {alto}" style="position: absolute; left: 0; bottom: 0">{"".join(capas)}</svg>', edif

# Bienvenida con la ciudad.
svg_c, edif = ciudad(330)
techos=[e for e in edif if 40<e[0]<330][:3]
handys=''
for (x,w,h),hn in zip(techos,['lamparita','cano','llave']):
    handys+=f'<img src="{BLOB[hn]}" alt="" aria-hidden="true" style="position: absolute; left: {x+w/2-24:.0f}px; top: {460-h-50}px; width: 48px; height: 56px; object-fit: contain">'
estrellas=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: {s}px; height: {s}px; border-radius: 50%; background: #FFFFFF; opacity: {o}"></span>' for x,y,s,o in [(40,110,3,.7),(120,70,2,.5),(300,90,3,.8),(350,150,2,.5),(200,130,2,.4),(80,180,2,.5)])
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: 460px; background: {AZUL}; border-radius: 0 0 40px 40px; overflow: hidden">
    {estrellas}
    <div style="position: absolute; top: 60px; right: 40px; width: 54px; height: 54px; border-radius: 50%; background: {AMARILLO}; box-shadow: 0 0 0 10px rgba(245,245,154,0.18)"></div>
    {svg_c}
  </div>
  {handys}
  <div style="position: absolute; top: 34px; left: 24px; display: flex; flex-direction: column"><span style="{TIT}; font-size: 34px; color: #FFFFFF; line-height: 1">Handyx</span><span style="font-size: 11px; font-weight: 700; color: #FFFFFF">Soluciones, no problemas</span></div>
  <section style="position: absolute; top: 488px; left: 24px; right: 24px; display: flex; flex-direction: column; gap: 10px">
    {etiqueta("PARA ESPECIALISTAS DE MAR DEL PLATA", AZUL)}
    <h1 style="margin: 0; {TIT}; font-size: 38px; line-height: 1.02">Tu trabajo, {marcador("tus precios")}</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Recibí pedidos de tu zona, cotizá a tu manera y cobrá directo. Vos elegís qué trabajos tomar.</p>
  </section>
''' + acciones_fijas(boton('Crear cuenta','RG-1.dc.html'), boton2('Ya tengo cuenta','D6-Login.dc.html'))
guardar('D6-Bienvenida.dc.html','Acceso · Bienvenida',cuerpo)

# Cabecera ilustrada para acceso y seguridad.
def cabecera_ilustrada(ic_grande, atras, alto=230, texto=''):
    svg_c2,_=ciudad(150)
    return f'''  <div aria-hidden="true" style="position: absolute; top: 0; left: 0; right: 0; height: {alto}px; background: {AZUL}; border-radius: 0 0 36px 36px; overflow: hidden">{svg_c2.replace('style="position: absolute; left: 0; bottom: 0"','style="position: absolute; left: 0; bottom: 0; opacity: 0.55"')}</div>
  <a href="{atras}" aria-label="Volver" style="position: absolute; top: 14px; left: 16px; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',20)}</a>
  <div aria-hidden="true" style="position: absolute; top: {alto-76}px; left: 50%; margin-left: -46px; width: 92px; height: 92px; border-radius: 28px; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center">{svg(IC[ic_grande],AZUL,44,2)}</div>'''

def metodo(ic, t, sub, href, on=False, tag=''):
    b=f'border: 2px solid {AZUL}; background: {TINTE};' if on else f'border: 1px solid {BORDE}; background: #FFFFFF;'
    tg=f'<span>{tag}</span>' if tag else ''
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; {b} color: {TINTA}; text-decoration: none">{mosaico_ic(ic,42,fondo=AZUL if on else MOSAICO,color="#FFFFFF" if on else TINTA,radio=14,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 3px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span>{tg}</span>{svg(IC["flecha"],SUAVE,18)}</a>'

# Acceso: elegir cómo entrar.
cuerpo = cabecera_ilustrada('llave2','D6-Bienvenida.dc.html') + contenido(f'''
    <div style="text-align: center; display: flex; flex-direction: column; gap: 4px">{etiqueta("ENTRAR A HANDYX")}<h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1">¿Cómo {marcador("entrás")}?</h1></div>
    <span style="min-height: 54px; border-radius: 16px; background: #FFFFFF; border: 2px solid {AZUL}; display: flex; align-items: center; gap: 10px; padding: 0 14px; font-size: 15px; font-weight: 700">{svg(IC['sobre'],AZUL,20)}especialista@example.test</span>
    {metodo('sobre','Código por email','Te llega a especialista@example.test','D6-Codigo.dc.html',True,chip("Más usado",tono="blanco"))}
    {metodo('telefono','Código por SMS','Al teléfono que termina en 4521','D6-Codigo.dc.html')}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Google","D6-Codigo.dc.html")}{boton2("Apple","D6-Codigo.dc.html")}</div>''', top=268) + '\n' + accion_fija('Mandarme el código','D6-Codigo.dc.html')
guardar('D6-Acceso.dc.html','Acceso · Elegir cómo entrar',cuerpo)

# Código de 6 dígitos (email o SMS), y si tiene MFA, el segundo paso.
casillas=''.join(f'<span style="height: 64px; border-radius: 18px; background: {"#FFFFFF" if i<4 else "#F6F7F9"}; border: 2px solid {AZUL if i==4 else BORDE}; box-shadow: {ELEV1 if i<4 else "none"}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 28px">{d}</span>' for i,d in enumerate(['4','8','1','5','','']))
cuerpo = cabecera_ilustrada('sobre','D6-Acceso.dc.html') + contenido(f'''
    <div style="text-align: center; display: flex; flex-direction: column; gap: 4px">{etiqueta("PASO 1 DE 2 · CÓDIGO")}<h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1">Revisá tu {marcador("email")}</h1><span style="font-size: 14px; color: {TEXTO}">Mandamos 6 números a especialista@example.test</span></div>
    <div role="group" aria-label="Código de 6 dígitos" style="display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 8px">{casillas}</div>
    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px"><span style="color: {SUAVE}">¿No llegó? Pedí otro en 0:42</span><a href="D6-Acceso.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-weight: 800; text-decoration: none">Probar con SMS</a></div>
    <div style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 16px; background: {TINTE}">{svg(IC['escudo'],HONDO,20)}<span style="font-size: 13px; color: {HONDO}"><strong>Paso 2:</strong> como activaste la app autenticadora, después te pedimos su código.</span></div>''', top=268) + '\n' + accion_fija('Seguir','D6-TOTP.dc.html')
guardar('D6-Codigo.dc.html','Acceso · Código',cuerpo)

# Seguridad: activar una segunda verificación (MFA), opcional.
cuerpo = barra_compacta('Seguridad','F-Cuenta.dc.html') + contenido(f'''
    <div style="padding: 18px; border-radius: 26px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; display: flex; gap: 14px; align-items: center">{mosaico_ic('escudo',60,fondo='rgba(255,255,255,0.18)',color='#FFFFFF',radio=20,iconsize=30)}<span style="display: flex; flex-direction: column; gap: 4px"><strong style="{TIT}; font-size: 22px; line-height: 1.05">Segunda verificación</strong><span style="font-size: 13px; color: #F0F5FD">Opcional. Además del código, te pedimos otra prueba al entrar desde un teléfono nuevo.</span></span></div>
    {metodo('llave2','App autenticadora','Google Authenticator, Microsoft o la que uses · sin señal','D6-TOTP.dc.html',True,chip("Recomendada","estrella","amarillo"))}
    {metodo('telefono','SMS al teléfono','Al que termina en 4521','D6-Seguridad.dc.html')}
    {metodo('sobre','Email','A especialista@example.test','D6-Seguridad.dc.html')}
    {tarjeta(fila_ic('telefono','Tus dispositivos','Este teléfono · entró hoy 17:40',href='D6-Seguridad.dc.html',borde=False)+fila_ic('llave2','Códigos de respaldo','10 códigos por si perdés el teléfono',href='D6-Seguridad.dc.html'))}''') + '\n' + accion_fija('Activar la app autenticadora','D6-TOTP.dc.html')
guardar('D6-Seguridad.dc.html','Acceso · Segunda verificación',cuerpo)

# App autenticadora: QR + código.
cas2=''.join(f'<span style="height: 56px; border-radius: 16px; background: {"#FFFFFF" if d else "#F6F7F9"}; border: 2px solid {AZUL if i==3 else BORDE}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 24px">{d}</span>' for i,d in enumerate(['2','0','7','','','']))
cuerpo = barra_compacta('App autenticadora','D6-Seguridad.dc.html',sub='Paso 2 de 2') + contenido(f'''
    <div style="display: flex; gap: 14px; align-items: center; padding: 14px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}"><div style="padding: 8px; border-radius: 14px; border: 2px solid {BORDE}">{qr(118)}</div><span style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 15px">Escaneá con tu app</strong><span style="font-size: 12px; color: {SUAVE}">¿Estás en el mismo teléfono? Copiá la clave:</span><span style="padding: 6px 8px; border-radius: 10px; background: {MOSAICO}; font-family: monospace; font-size: 12px; font-weight: 700">JBSW Y3DP EHPK 3PXP</span></span></div>
    <strong style="font-size: 15px">Escribí el código que muestra la app</strong>
    <div role="group" aria-label="Código de la app" style="display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 8px">{cas2}</div>
    <span style="font-size: 12px; color: {SUAVE}">Clave de ejemplo, no real. Cambia cada 30 segundos. La clave queda solo en el servidor, nunca en tu navegador.</span>''') + '\n' + accion_fija('Activar','F-Inicio.dc.html')
guardar('D6-TOTP.dc.html','Acceso · App autenticadora',cuerpo)

# ── Registro paso a paso ──────────────────────────────────────────
PASOS=['Tus datos','Domicilio','Rubros','Zonas','Selfie','DNI','CUIT/CUIL','Certificados','Antecedentes','Revisar']
def pasos_bar(n):
    seg=''.join(f'<span style="flex: 1; height: 6px; border-radius: 3px; background: {AZUL if i<n else (AMARILLO if i==n else MOSAICO)}"></span>' for i in range(1,11))
    return f'<div style="display: flex; gap: 4px">{seg}</div>'
def reg(n, titulo_a, marcado, sub, html, accion, sig, atras=None, oscuro=False):
    at = atras or (f'RG-{n-1}.dc.html' if n>1 else 'D6-Bienvenida.dc.html')
    cab=f'''  <header style="position: absolute; top: 0; left: 0; right: 0; padding: 12px 16px 0; display: flex; flex-direction: column; gap: 10px; background: #FFFFFF; z-index: 2">
    <div style="display: grid; grid-template-columns: 44px minmax(0,1fr) 44px; align-items: center"><a href="{at}" aria-label="Volver" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a><span style="text-align: center; font-size: 13px; font-weight: 800; color: {SUAVE}">Paso {n} de 10 · {PASOS[n-1]}</span><span></span></div>
    {pasos_bar(n)}
  </header>'''
    cuerpo = cab + contenido(f'''<section style="display: flex; flex-direction: column; gap: 4px"><h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1.02">{titulo_a}{marcador(marcado)}</h1><p style="margin: 0; font-size: 14px; color: {SUAVE}">{sub}</p></section>{html}''', top=90) + '\n' + accion_fija(accion, sig)
    guardar(f'RG-{n}.dc.html', f'Registro · {n}. {PASOS[n-1]}', cuerpo)
def campo(et, v, ph=False, ic=None):
    i=svg(IC[ic],SUAVE,18) if ic else ''
    return f'<label style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 52px; border-radius: 16px; border: {"2px solid "+AZUL if not ph else "1px solid "+BORDE}; background: #FFFFFF; display: flex; align-items: center; gap: 8px; padding: 0 14px; font-size: 15px; font-weight: {400 if ph else 700}; color: {SUAVE if ph else TINTA}">{i}{v}</span></label>'
def privado(t):
    return f'<div style="display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 14px; background: {TINTE}">{svg(IC["candado"],HONDO,18)}<span style="font-size: 12px; color: {HONDO}; font-weight: 700">{t}</span></div>'

reg(1,'Contanos ','quién sos','Así te ven los clientes cuando aceptan tu propuesta.',
    f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{campo("Nombre","Julián")}{campo("Apellido","Ortiz")}</div>{campo("Teléfono","223 555-4521",ic="telefono")}{campo("Email","especialista@example.test",ic="sobre")}{campo("Creá una contraseña","••••••••••",ic="candado")}<span style="font-size: 12px; color: #137140; font-weight: 700">Segura: 10 caracteres, con números y símbolos</span>{privado("Tus datos se guardan cifrados. Los clientes ven solo tu nombre y tu foto.")}',
    'Seguir','RG-2.dc.html')
reg(2,'¿Dónde ','vivís?','Para calcular distancias y verificar tu identidad. Nunca se lo mostramos a nadie.',
    f'<div aria-hidden="true" style="position: relative; height: 170px; border-radius: 22px; overflow: hidden; background: #F3F4F7">' + ''.join(f'<div style="position: absolute; left: {-10+c*66}px; top: {-20+f*62}px; width: 54px; height: 50px; border-radius: 10px; background: #E7E9EE"></div>' for f in range(4) for c in range(6)) + f'<span style="position: absolute; left: 50%; top: 50%; margin: -34px 0 0 -18px; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: {AZUL}; box-shadow: {ELEV2}"></span><span style="position: absolute; left: 12px; bottom: 10px">{chip("Mové el mapa para ajustar","pin","blanco")}</span></div>' + f'{campo("Calle y número","Calle De Prueba 123",ic="casa2")}<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{campo("Piso / depto","Opcional",ph=True)}{campo("Barrio","La Perla")}</div>{privado("Cifrado. Los clientes solo ven tu zona de trabajo, nunca tu domicilio.")}',
    'Seguir','RG-3.dc.html')
def rubro(t, ic, on=False, req=False):
    est=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TINTA}'
    r=f'<span style="align-self: flex-start; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: {AMARILLO}; color: {TINTA}">Pide matrícula</span>' if req else '<span style="height: 16px"></span>'
    chk=f'<span style="position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border-radius: 50%; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{svg(IC["check"],AZUL,14,3)}</span>' if on else ''
    return f'<span style="position: relative; padding: 14px; border-radius: 22px; {est}; display: flex; flex-direction: column; gap: 8px; min-height: 112px; box-sizing: border-box">{chk}{svg(IC[ic],"#FFFFFF" if on else TINTA,28)}<strong style="font-size: 15px">{t}</strong>{r}</span>'
reg(3,'¿En qué ','trabajás?','Elegí uno o más. Podés sumar otros después.',
    f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">{rubro("Plomería","gota",True)}{rubro("Gas","llama",True,True)}{rubro("Electricidad","rayo")}{rubro("Aire acondicionado","copo",False,True)}{rubro("Cerrajería","candado")}{rubro("Albañilería","ladrillo")}</div>',
    'Seguir con 2 rubros','RG-4.dc.html')
def barrio(t, on):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<span style="min-height: 44px; padding: 0 14px; border-radius: 14px; {s}; display: inline-flex; align-items: center; gap: 6px; font-weight: 800; font-size: 14px">{svg(IC["check"],"#FFFFFF",14,3) if on else ""}{t}</span>'
reg(4,'¿Por dónde ','te movés?','Solo te llegan pedidos de estas zonas. Lo cambiás cuando quieras.',
    f'<div aria-hidden="true" style="position: relative; height: 200px; border-radius: 22px; overflow: hidden; background: #F3F4F7">' + ''.join(f'<div style="position: absolute; left: {-10+c*66}px; top: {-20+f*62}px; width: 54px; height: 50px; border-radius: 10px; background: {"rgba(31,87,168,0.22)" if (f,c) in [(1,1),(1,2),(2,1),(2,2),(1,3)] else "#E7E9EE"}"></div>' for f in range(5) for c in range(6)) + f'<div style="position: absolute; top: 0; bottom: 0; right: 0; width: 60px; background: #E8EDF5"></div><span style="position: absolute; left: 12px; bottom: 10px">{chip("4 barrios · 6 km a la redonda","pin","blanco")}</span></div><div style="display: flex; flex-wrap: wrap; gap: 8px">{barrio("La Perla",True)}{barrio("Centro",True)}{barrio("Los Troncos",True)}{barrio("Chauvín",True)}{barrio("Punta Mogotes",False)}{barrio("Batán",False)}</div>',
    'Seguir','RG-5.dc.html')

def camara(guia, texto, extra=''):
    return f'''<div style="position: relative; height: 400px; border-radius: 28px; background: {NOCHE}; overflow: hidden">{guia}<span style="position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; color: #FFFFFF; font-size: 14px; font-weight: 700">{texto}</span>{extra}</div>'''
ovalo=f'<span style="position: absolute; left: 50%; top: 44px; margin-left: -110px; width: 220px; height: 280px; border-radius: 50%; border: 4px solid {AMARILLO}; box-shadow: 0 0 0 999px rgba(11,20,36,0.55)"></span><img src="{BLOB["llave"]}" alt="" aria-hidden="true" style="position: absolute; left: 50%; top: 120px; margin-left: -50px; width: 100px; height: 120px; object-fit: contain; opacity: 0.35">'
consejos=''.join(f'<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: {TEXTO}">{svg(IC["check"],"#137140",14,3)}{t}</span>' for t in ['Con buena luz','Sin anteojos de sol ni gorra','La cara entera dentro del óvalo'])
reg(5,'Una foto de ','tu cara','Para que el cliente sepa quién llega y para compararla con tu DNI.',
    camara(ovalo,'Mirá a la cámara') + f'<div style="display: flex; flex-direction: column; gap: 4px">{consejos}</div>',
    svg(IC['camara'],'#FFFFFF',20)+'Sacar la foto','RG-6.dc.html')
marco=f'<span style="position: absolute; left: 30px; right: 30px; top: 90px; height: 190px; border-radius: 18px; border: 4px solid {AMARILLO}; box-shadow: 0 0 0 999px rgba(11,20,36,0.55)"></span><span style="position: absolute; left: 46px; top: 110px; width: 70px; height: 86px; border-radius: 10px; background: rgba(255,255,255,0.14)"></span><span style="position: absolute; left: 130px; top: 116px; width: 160px; height: 10px; border-radius: 5px; background: rgba(255,255,255,0.14)"></span><span style="position: absolute; left: 130px; top: 136px; width: 120px; height: 10px; border-radius: 5px; background: rgba(255,255,255,0.14)"></span><span style="position: absolute; left: 0; right: 0; top: 30px; display: flex; justify-content: center; gap: 8px">{chip("Frente","check","exito")}{chip("Dorso","camara","amarillo")}</span>'
reg(6,'Tu ','DNI','Frente y dorso. Lo revisamos nosotros: cargarlo no es estar verificado.',
    camara(marco,'Ahora el dorso, dentro del marco') + privado('Cifrado. Se borra a los 90 días de verificarte; en tu perfil solo se ven los últimos números.'),
    svg(IC['camara'],'#FFFFFF',20)+'Sacar la foto del dorso','RG-7.dc.html')
reg(7,'Tu ','CUIT o CUIL','Para tu perfil y para tus facturas. Si sos monotributista, va tu CUIT.',
    campo('CUIT/CUIL','20-12345678-9',ic='documento') + f'<div style="display: flex; flex-direction: column; gap: 8px"><strong style="font-size: 15px">¿Cómo facturás?</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{barrio("Monotributo",True)}{barrio("Responsable inscripto",False)}{barrio("Todavía no",False)}</div></div>' + privado('Número de ejemplo. Se guarda cifrado; en la app se ven solo los últimos dígitos.'),
    'Seguir','RG-8.dc.html')
def cert(ic, t, sub, est, oblig=False):
    e={'cargado':chip("Cargado · en revisión","reloj","amarillo"),'falta':chip("Obligatorio · falta","alerta","error"),'opcional':chip("Suma a tu perfil","estrella","tinte")}[est]
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}">{mosaico_ic(ic,44,radio=14,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span>{e}</span>{mosaico_ic("subir",40,fondo=AZUL,color="#FFFFFF",radio=12,iconsize=18)}</div>'
reg(8,'Certificados y ','matrículas','En Gas y Aire acondicionado la matrícula es obligatoria. El resto es opcional y suma a tu perfil.',
    tarjeta(etiqueta("OBLIGATORIOS POR TUS RUBROS")+cert('llama','Matrícula de gasista','Foto o PDF, vigente','cargado')) + tarjeta(etiqueta("OPCIONALES · LOS VEN LOS CLIENTES AL ELEGIR")+cert('gota','Curso de termofusión','Foto o PDF','opcional')+cert('escudo','Seguro de responsabilidad civil','Póliza vigente','opcional')+cert('documento','Otro certificado','Cursos, capacitaciones','opcional')) + f'<span style="font-size: 12px; color: {SUAVE}">Revisamos cada uno. Un certificado verificado aparece en tu perfil; uno cargado, todavía no.</span>',
    'Seguir','RG-9.dc.html')
reg(9,'Antecedentes ','penales','Subí el certificado de antecedentes: una foto clara o el PDF que te dan al tramitarlo.',
    f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px"><span style="min-height: 120px; border-radius: 22px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-weight: 800">{svg(IC["camara"],"#FFFFFF",32)}Sacar una foto</span><span style="min-height: 120px; border-radius: 22px; background: {MOSAICO}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-weight: 800">{svg(IC["documento"],TINTA,32)}Subir el PDF</span></div>' + tarjeta(fila_ic('documento','certificado-antecedentes.pdf','1 página · 240 KB',derecha=chip("Listo","check","exito"),borde=False)) + privado('Es un dato sensible: se guarda cifrado, lo ve solo el equipo de verificación de Handyx y se borra al verificarte.') + f'<span style="font-size: 12px; color: {SUAVE}">¿No lo tenés? Podés seguir y cargarlo después: hasta entonces no recibís pedidos.</span>',
    'Seguir','RG-10.dc.html')
def resumen(ic, t, sub, est='ok'):
    e={'ok':chip("Listo","check","exito"),'rev':chip("En revisión","reloj","amarillo")}[est]
    return fila_ic(ic,t,sub,derecha=e,borde=ic!='cuenta')
reg(10,'Revisá y ','enviá','Evaluamos tu perfil para saber si estás apto. Te avisamos apenas tengamos una respuesta.',
    tarjeta(resumen('cuenta','Julián Ortiz','223 555-4521 · especialista@example.test')+resumen('casa2','Domicilio','La Perla · cifrado')+resumen('herramienta','Plomería y Gas','4 barrios')+resumen('cara','Selfie y DNI','Frente y dorso','rev')+resumen('documento','CUIT, matrícula y antecedentes','3 documentos','rev')) + f'<label style="display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: {TEXTO}"><span style="width: 26px; height: 26px; flex: none; border-radius: 8px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",16,3)}</span>Leí y acepto los términos y el aviso de privacidad para especialistas.</label>',
    'Enviar para revisar','D6-Alta.dc.html')

# Estado del alta (después de enviar).
def paso_alta(ic, t, sub, estado):
    m={'listo':chip('Listo','check','exito'),'revision':chip('En revisión','reloj','amarillo'),'falta':chip('Falta','alerta','error')}[estado]
    return fila_ic(ic, t, sub, derecha=m, borde=ic!='cuenta')
pasos=''.join([paso_alta('cuenta','Datos y domicilio','Cifrados','listo'),paso_alta('herramienta','Rubros y zonas','Plomería y Gas · 4 barrios','listo'),paso_alta('cara','Selfie y DNI','Lo comparamos con tu DNI','revision'),paso_alta('documento','CUIT y matrícula de gasista','Obligatoria para Gas','revision'),paso_alta('escudo','Antecedentes penales','PDF cargado · se borra al verificarte','revision'),paso_alta('estrella','Certificados opcionales','Sumá los tuyos: los ven los clientes','falta')])
cuerpo = barra_compacta('Tu alta','F-Cuenta.dc.html') + contenido(f'''
    <div style="display: flex; align-items: center; gap: 14px">{anillo(2,6,64)}<span style="display: flex; flex-direction: column; gap: 2px">{etiqueta("ENVIADO · EN EVALUACIÓN")}<strong style="{TIT}; font-size: 24px; line-height: 1.05">Estamos evaluando tu perfil</strong><span style="font-size: 13px; color: {SUAVE}">Cargar un documento todavía no es estar verificado.</span></span></div>
    {tarjeta(pasos)}''') + '\n' + accion_fija(svg(IC['subir'],'#FFFFFF',20)+'Sumar un certificado','RG-8.dc.html')
guardar('D6-Alta.dc.html','Registro · Estado del alta',cuerpo)

# ── Ayuda premium ─────────────────────────────────────────────────
def tema(ic, t, n, fondo=MOSAICO, color=TINTA):
    return f'<a href="D6-Ayuda.dc.html" style="padding: 12px; border-radius: 20px; background: {fondo}; color: {color}; text-decoration: none; display: flex; flex-direction: column; gap: 6px">{svg(IC[ic],color,24)}<strong style="font-size: 14px">{t}</strong><span style="font-size: 11px; opacity: 0.75">{n} respuestas</span></a>'
cuerpo = f'''  <section style="position: absolute; top: 0; left: 0; right: 0; padding: 14px 16px 22px; background: {AZUL}; border-radius: 0 0 34px 34px; color: #FFFFFF; display: flex; flex-direction: column; gap: 12px">
    <div style="display: flex; justify-content: space-between; align-items: center"><a href="F-Cuenta.dc.html" aria-label="Volver" style="width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',20)}</a>{chip("Soporte de 9 a 18","reloj","blanco")}</div>
    <div style="display: flex; gap: 12px; align-items: center"><img src="{BLOB['lamparita']}" alt="" aria-hidden="true" style="width: 56px; height: 72px; object-fit: contain"><span style="display: flex; flex-direction: column; gap: 2px">{etiqueta("CENTRO DE AYUDA","#CFE0FA")}<strong style="{TIT}; font-size: 28px; line-height: 1.02">¿En qué te ayudamos?</strong></span></div>
    <span style="min-height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE}; font-size: 15px">{svg(IC['ayuda'],AZUL,20)}Buscá «cobro», «obra», «matrícula»…</span>
  </section>
''' + contenido(f'''
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{tema('billete','Cobros',8,NOCHE,'#FFFFFF')}{tema('herramienta','Pedidos',12)}{tema('obra','Obras y equipo',9)}{tema('escudo','Verificación',7)}{tema('cuenta','Cuenta',6)}{tema('candado','Seguridad',5)}</div>
    {tarjeta(etiqueta("LO MÁS CONSULTADO")+f'<div style="padding: 10px 0; border-top: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 6px"><span style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 15px">¿Cuánto me cobra Handyx?</strong><span style="width: 28px; height: 28px; border-radius: 50%; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span></span><span style="font-size: 13px; color: {TEXTO}">Nada. Recibís el 100 % de tu precio y el cliente te paga directo a vos, por Mercado Pago o en efectivo.</span></div>'+fila_ic('herramienta','¿Qué pasa si no acepto un pedido?','',href='D6-Ayuda.dc.html'))}''', top=262) + '\n' + acciones_fijas(f'<a href="F-Chat.dc.html" style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 18px; background: {TINTE}; color: {TINTA}; text-decoration: none"><span style="width: 44px; height: 44px; border-radius: 50%; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 18px">H</span><span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Hablar con soporte</strong><span style="font-size: 12px; color: {SUAVE}">Respondemos en el día · 1 caso abierto</span></span>{svg(IC["flecha"],AZUL,20)}</a>')
guardar('D6-Ayuda.dc.html','Resto · Ayuda',cuerpo)

# ── Errores con SVG propios ───────────────────────────────────────
enchufe=f'''<svg aria-hidden="true" width="300" height="230" viewBox="0 0 300 230" style="position: absolute; left: 50%; top: 120px; margin-left: -150px">
    <circle cx="150" cy="115" r="105" fill="{TINTE}"></circle>
    <path d="M20 150 C 60 150, 70 110, 112 110" fill="none" stroke="{NOCHE}" stroke-width="8" stroke-linecap="round"></path>
    <rect x="108" y="92" width="44" height="36" rx="8" fill="{AZUL}"></rect><rect x="150" y="100" width="16" height="6" rx="2" fill="#B8BFCC"></rect><rect x="150" y="114" width="16" height="6" rx="2" fill="#B8BFCC"></rect>
    <rect x="196" y="88" width="48" height="44" rx="10" fill="#FFFFFF" stroke="{BORDE}" stroke-width="3"></rect><rect x="208" y="102" width="6" height="16" rx="2" fill="{NOCHE}"></rect><rect x="226" y="102" width="6" height="16" rx="2" fill="{NOCHE}"></rect>
    <path d="M180 74 l8 -14 M186 84 l14 -8 M176 66 l-2 -14" stroke="{AMARILLO}" stroke-width="5" stroke-linecap="round"></path>
    <path d="M244 132 C 270 160, 280 190, 290 210" fill="none" stroke="{NOCHE}" stroke-width="8" stroke-linecap="round"></path>
  </svg>
  <img src="{BLOB['engranaje']}" alt="" aria-hidden="true" style="position: absolute; left: 40px; top: 250px; width: 76px; height: 76px; object-fit: contain; transform: rotate(-14deg)">'''
cuerpo = barra_compacta('Tus ingresos','F-Cuenta.dc.html') + enchufe + f'''
  <section style="position: absolute; top: 380px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
    {chip("Sin conexión","wifi","error")}
    <h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1.02">Se nos {marcador("desenchufó")} algo</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Revisá tu conexión y probá de nuevo. Lo que ya habías cargado sigue acá: nunca mostramos datos inventados.</p>
    <div style="margin-top: 8px; width: 100%">{tarjeta(fila_ic('reloj','Último dato guardado','Hoy 17:40 · Tus ingresos de noviembre',borde=False))}</div>
  </section>
''' + accion_fija('Reintentar','F-Ingresos.dc.html')
guardar('D6-Error.dc.html','Resto · Sin conexión',cuerpo)

obra_svg=f'''<svg aria-hidden="true" width="300" height="230" viewBox="0 0 300 230" style="position: absolute; left: 50%; top: 110px; margin-left: -150px">
    <circle cx="150" cy="120" r="105" fill="{MOSAICO}"></circle>
    <rect x="40" y="186" width="220" height="10" rx="5" fill="{NOCHE}"></rect>
    <rect x="70" y="120" width="70" height="66" rx="6" fill="{AZUL}"></rect><rect x="160" y="96" width="74" height="90" rx="6" fill="{HONDO}"></rect>
    <rect x="82" y="132" width="14" height="16" rx="2" fill="{AMARILLO}"></rect><rect x="108" y="132" width="14" height="16" rx="2" fill="#2F5FA6"></rect><rect x="172" y="110" width="14" height="16" rx="2" fill="#2F5FA6"></rect><rect x="200" y="110" width="14" height="16" rx="2" fill="{AMARILLO}"></rect>
    <rect x="58" y="150" width="190" height="16" rx="3" fill="{AMARILLO}" transform="rotate(-8 150 158)"></rect>
    {''.join(f'<rect x="{x}" y="150" width="14" height="16" fill="{NOCHE}" transform="rotate(-8 150 158)"></rect>' for x in range(66,240,28))}
    <path d="M150 40 l0 30 M135 55 l30 0" stroke="{AZUL}" stroke-width="6" stroke-linecap="round"></path>
  </svg>'''
cuerpo = barra_compacta('Obra','F-Obras.dc.html') + obra_svg + f'''
  <section style="position: absolute; top: 370px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
    {chip("Error del servidor","alerta","amarillo")}
    <h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1.02">Estamos {marcador("en obra")}</h1>
    <p style="margin: 0; font-size: 15px; color: {TEXTO}">Algo falló de nuestro lado y ya lo estamos arreglando. No perdiste nada de lo que cargaste.</p>
    <span style="font-size: 12px; color: {SUAVE}">Si se repite, contale a soporte el código <strong>HX-503</strong>.</span>
  </section>
''' + acciones_fijas(boton('Reintentar','F-Obra.dc.html'), boton2('Hablar con soporte','D6-Ayuda.dc.html'))
guardar('D6-Fallo.dc.html','Resto · Error del servidor',cuerpo)
print('ok')
