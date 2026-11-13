import sys, re; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({'flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>','candadito':'<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>','carrito':'<path d="M3 4h2l2.5 11h11l2-8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>','grafico':'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"></path>','ajustes':'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"></path><circle cx="16" cy="6" r="2"></circle><circle cx="10" cy="12" r="2"></circle><circle cx="18" cy="18" r="2"></circle>','cubo':'<path d="M12 2l9 5v10l-9 5-9-5V7l9-5Z"></path><path d="M3 7l9 5 9-5M12 12v10"></path>','monitor':'<rect x="2" y="4" width="20" height="13" rx="2"></rect><path d="M8 21h8M12 17v4"></path>','telefono':'<rect x="7" y="2" width="10" height="20" rx="2.5"></rect><path d="M11 18h2"></path>'})
def stepper(n):
    return f'<span style="display: flex; align-items: center; gap: 8px; flex: none"><span style="width: 36px; height: 36px; border-radius: 12px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; font-weight: 900">−</span><strong style="{TIT}; font-size: 20px; min-width: 14px; text-align: center">{n}</strong><span style="width: 36px; height: 36px; border-radius: 12px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 900">+</span></span>'
def buscador(txt, ph=False):
    return f'<span style="min-height: 52px; border-radius: 16px; background: #FFFFFF; border: 2px solid {BORDE if ph else AZUL}; display: flex; align-items: center; gap: 10px; padding: 0 14px; color: {SUAVE if ph else TINTA}; font-size: 15px; font-weight: {400 if ph else 700}">{svg(IC["lupa"],SUAVE,20)}<span style="flex: 1">{txt}</span></span>'
def resultado(t, sub, v, sel=False, href='H0-AgregarMaterial.dc.html'):
    der = stepper(1) if sel else f'<span aria-hidden="true" style="width: 40px; height: 40px; flex: none; border-radius: 12px; background: {TINTE}; display: flex; align-items: center; justify-content: center">{svg(IC["mas"],AZUL,20)}</span>'
    return f'<a href="{href}" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; border: {"2px solid "+AZUL if sel else "1px solid "+BORDE}; background: {TINTE if sel else "#FFFFFF"}; color: {TINTA}; text-decoration: none">{mosaico_ic("caja",44,fondo="#FFFFFF" if sel else MOSAICO,radio=14,iconsize=20)}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{"" if sel else f"<strong style=\"font-size: 15px; white-space: nowrap\">{v}</strong>"}{der}</a>'

# ── Agregar un material: buscar, tocar y listo. Lo demás, en «Cambiar». ──
resumen = f'''<a href="H0-MaterialOpciones.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; background: #F6F7F9; color: {TINTA}; text-decoration: none">
      <span style="flex: 1; display: flex; flex-direction: column; gap: 6px"><span style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700">{svg(IC["check"],"#1E9E57",16,3)}Se lo cobrás a Lucía en el presupuesto</span><span style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700">{svg(IC["check"],"#1E9E57",16,3)}Va a tus gastos cuando lo compres</span></span>
      <span style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; font-weight: 800; color: {AZUL}">Cambiar</span></a>'''
cuerpo = barra_compacta('Agregar material','H0-Presupuesto.dc.html',sub='Pierde la canilla') + contenido(f'''
    {buscador('cartucho 35')}
    <strong style="font-size: 13px; color: {SUAVE}">De tu lista de precios</strong>
    {resultado('Cartucho cerámico 35 mm','$ 9.800 · actualizado 05/11','$ 9.800',True)}
    {resultado('Cartucho cerámico 35 mm largo','Actualizado 05/11','$ 11.200')}
    <a href="H0-MaterialNuevo.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; border: 2px dashed #C9CFDA; color: {TINTA}; text-decoration: none">{mosaico_ic("mas",44,fondo=AMARILLO,radio=14,iconsize=20)}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><strong style="font-size: 15px">¿No está? Agregalo a tu lista</strong><span style="font-size: 12px; color: {SUAVE}">Queda guardado para la próxima</span></span></a>
    {resumen}
    <a href="R-Comparar.dc.html" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">{svg(IC["tienda"] if "tienda" in IC else IC["carrito"],AZUL,18)}Mejor, buscarlo en una ferretería adherida</a>''') + '\n' + accion_fija('Agregar · $ 9.800','H0-Presupuesto.dc.html')
guardar('H0-AgregarMaterial.dc.html','H0 · Agregar un material',cuerpo)

def opcion_sw(t, sub, on):
    pista=AZUL if on else '#C9CFDA'; lado='right: 3px' if on else 'left: 3px'
    return f'<div role="switch" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; align-items: center; gap: 12px; min-height: 56px; border-top: 1px solid {BORDE}"><span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><span aria-hidden="true" style="width: 50px; height: 30px; flex: none; border-radius: 15px; background: {pista}; position: relative"><span style="position: absolute; top: 3px; {lado}; width: 24px; height: 24px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV1}"></span></span></div>'
cuerpo = barra_compacta('Agregar material','H0-Presupuesto.dc.html',sub='Pierde la canilla') + '  <div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>\n' + hoja(f'''
    <div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 17px">Opciones del material</strong><a href="H0-AgregarMaterial.dc.html" style="display: inline-flex; align-items: center; justify-content: center; min-height: 44px; min-width: 56px; font-weight: 800; text-decoration: none">Listo</a></div>
    <div>{opcion_sw('Cobrárselo al cliente','Suma $ 9.800 al presupuesto de Lucía',True)}{opcion_sw('Anotarlo como gasto tuyo','Con la foto del ticket cuando lo compres',True)}{opcion_sw('Congelar el precio','Si lo apagás, sigue tu lista y te avisamos si cambia',False)}</div>
    <span style="font-size: 12px; color: {SUAVE}">Lo que elijas queda como tu forma de agregar materiales; lo cambiás cuando quieras.</span>''', 380)
guardar('H0-MaterialOpciones.dc.html','H0 · Opciones del material',cuerpo)

# ── No está en tu lista: lo agregás y alimenta el catálogo ──
def campo(et, v, ph=False):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 52px; border-radius: 16px; border: {"1px solid "+BORDE if ph else "2px solid "+AZUL}; background: #FFFFFF; display: flex; align-items: center; padding: 0 14px; font-size: 15px; font-weight: {400 if ph else 700}; color: {SUAVE if ph else TINTA}">{v}</span></div>'
def op(t, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<span role="radio" aria-checked="{str(on).lower()}" style="min-height: 44px; padding: 0 14px; border-radius: 14px; {s}; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap">{t}</span>'
cuerpo = barra_compacta('Material nuevo','H0-AgregarMaterial.dc.html',sub='No estaba en tu lista') + contenido(f'''
    <div style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 18px; background: {TINTE}">{mosaico_handy('cano',52)}<span style="font-size: 13px; color: {HONDO}">«Termofusión codo 25 mm» no estaba en tu lista. Completá lo básico y queda guardado.</span></div>
    {campo('Nombre','Termofusión codo 25 mm')}
    <div style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">Categoría</span><div role="radiogroup" aria-label="Categoría" style="display: flex; gap: 8px; flex-wrap: wrap">{op('Plomería',True)}{op('Gas')}{op('Electricidad')}{op('Otra')}</div></div>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{campo('Precio que pagaste','$ 1.450')}{campo('Por','Unidad')}</div>
    <div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 16px; background: #F6F7F9">{svg(IC["escudo"],AZUL,20)}<span style="font-size: 12px; color: {TEXTO}">El nombre del material se suma al catálogo de Handyx para que otros lo encuentren. Tu precio queda solo para vos.</span></div>''') + '\n' + accion_fija('Guardar y agregar · $ 1.450','H0-Presupuesto.dc.html')
guardar('H0-MaterialNuevo.dc.html','H0 · Material nuevo',cuerpo)

# ── Agregar varios: solo marcar; las opciones, iguales para todos ──
def it(t, sub, v, on):
    m=f'<span style="width: 28px; height: 28px; flex: none; border-radius: 9px; background: {AZUL}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",15,3)}</span>' if on else f'<span style="width: 28px; height: 28px; flex: none; border-radius: 9px; border: 2px solid #C9CFDA"></span>'
    return f'<div role="checkbox" aria-checked="{str(on).lower()}" aria-label="{t}" style="display: flex; gap: 12px; align-items: center; min-height: 56px; border-top: 1px solid {BORDE}">{m}<span style="flex: 1; min-width: 0; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span><strong style="font-size: 14px; white-space: nowrap">{v}</strong></div>'
cuerpo = barra_compacta('Agregar varios','H0-Presupuesto.dc.html',sub='Pierde la canilla') + contenido(f'''
    {buscador('Buscá en tu lista o en un kit',True)}
    {tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("KIT · CAMBIO DE GRIFERÍA")}<span style="font-size: 12px; color: {SUAVE}">3 de 4</span></div>'+it('Cartucho cerámico 35 mm','1 unidad','$ 9.800',True)+it('Flexible 40 cm','2 × $ 1.600','$ 3.200',True)+it('Llave de paso 1/2"','1 unidad','$ 7.400',True)+it('Sellador de roscas','1 unidad','$ 3.100',False))}
    {resumen.replace("Se lo cobrás a Lucía en el presupuesto","Se los cobrás a Lucía").replace("Va a tus gastos cuando lo compres","Van a tus gastos con un solo ticket")}
    <a href="H0-MaterialNuevo.dc.html" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; font-size: 14px; font-weight: 800; text-decoration: none">{svg(IC["mas"],AZUL,18)}¿Falta alguno? Agregalo a tu lista</a>''') + '\n' + accion_fija('Agregar 3 · $ 20.400','H0-Presupuesto.dc.html')
guardar('H0-AgregarLista.dc.html','H0 · Agregar varios materiales',cuerpo)

# ── Perfil del profesional, como lo ve un cliente ──
def dato(n, t):
    return f'<span style="flex: 1; min-width: 0; padding: 10px; border-radius: 16px; background: {MOSAICO}; display: flex; flex-direction: column; align-items: center; text-align: center"><strong style="{TIT}; font-size: 22px; line-height: 1.1">{n}</strong><span style="font-size: 11px; font-weight: 700; color: {SUAVE}">{t}</span></span>'
def comentario(k, t, cuando):
    return f'<div style="display: flex; gap: 10px; padding: 10px 0; border-top: 1px solid {BORDE}">{avatar(k,32)}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; font-weight: 800">{nombre(k)} · <span style="font-weight: 600; color: {SUAVE}">{cuando}</span></span><span style="font-size: 13px; color: {TEXTO}">{t}</span></span></div>'
cuerpo = barra_compacta('Perfil','F-ObraPostulantes.dc.html',sub='Así lo ve un cliente') + contenido(f'''
    <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">{avatar('diego',84)}<strong style="{TIT}; font-size: 26px; line-height: 1">Diego Herrera</strong><span style="font-size: 13px; color: {SUAVE}">Electricidad · Mar del Plata · en Handyx desde 2026</span><span style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center">{chip("Verificado por Handyx","escudo","exito")}{chip("Matrícula verificada","check","tinte")}</span></div>
    <div style="display: flex; gap: 8px">{dato('52','trabajos verificados')}{dato('3','obras en equipo')}{dato('2','certificados')}</div>
    {tarjeta(etiqueta("TRABAJOS RECIENTES")+f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px">'+''.join(f'<span role="img" aria-label="{t}" style="aspect-ratio: 1; border-radius: 12px; background: {c}"></span>' for c,t in [('#DCE3EE','Tablero nuevo'),('#E9E2D3','Luces del patio'),('#E3EADF','Toma exterior')])+'</div>')}
    {tarjeta(etiqueta("LO QUE DICEN LOS CLIENTES")+comentario('carla','Llegó en el horario que dijo y explicó todo.','octubre')+comentario('lucia','Dejó el tablero prolijo y rotulado.','septiembre'))}''') + '\n' + acciones_fijas(f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Escribirle","F-Chat.dc.html","chat")}{boton("Elegirlo","F-ChatGrupoInfo.dc.html",alto=52)}</div>')
guardar('F-PerfilProfesional.dc.html','Equipo · Perfil del profesional',cuerpo)

# ── Pestaña Taller: agenda, plata, presupuestos, equipamiento y herramientas ──
def semana():
    d=[('LUN','16',0),('MAR','17',2),('MIÉ','18',1),('JUE','19',1),('VIE','20',0)]
    return '<div style="display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 6px">'+''.join(f'<span style="padding: 6px 0; border-radius: 12px; background: {"#FFFFFF" if i==1 else "rgba(255,255,255,0.14)"}; color: {AZUL if i==1 else "#FFFFFF"}; display: flex; flex-direction: column; align-items: center; gap: 2px"><span style="font-size: 11px; font-weight: 800">{a}</span><strong style="font-size: 16px">{n}</strong><span style="display: flex; gap: 3px; height: 6px">{"".join(f"<span style=\"width: 6px; height: 6px; border-radius: 3px; background: {AMARILLO if i!=1 else AZUL}\"></span>" for _ in range(k))}</span></span>' for i,(a,n,k) in enumerate(d))+'</div>'
def tile(href, ic, t, valor, sub, fondo='#FFFFFF', color=TINTA, extra=''):
    claro = fondo=='#FFFFFF'
    b = f'border: 1px solid {BORDE}; box-shadow: {ELEV1};' if claro else f'box-shadow: 0 4px 0 {"#0A1528" if fondo==NOCHE else HONDO};'
    return f'<a href="{href}" style="padding: 14px; border-radius: 24px; background: {fondo}; color: {color}; {b} text-decoration: none; display: flex; flex-direction: column; gap: 6px; min-height: 148px; box-sizing: border-box"><span style="display: flex; justify-content: space-between; align-items: center">{mosaico_ic(ic,40,fondo=TINTE if claro else "rgba(255,255,255,0.14)",color=AZUL if claro else AMARILLO,radio=13,iconsize=20)}{svg(IC["flecha"],SUAVE if claro else "#FFFFFF",18)}</span><strong style="font-size: 15px; line-height: 1.15">{t}</strong><strong style="{TIT}; font-size: 21px; line-height: 1">{valor}</strong><span style="font-size: 12px; {"color: "+SUAVE if claro else "opacity: 0.85"}">{sub}</span>{extra}</a>'
barra_neto=f'<span role="img" aria-label="75 % neto, 25 % gastos" style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: {MOSAICO}"><span style="width: 75%; background: {AZUL}"></span><span style="width: 25%; background: #C9A86A"></span></span>'
cuerpo = contenido(f'''
    {titulo_grande("AGENDA, PLATA Y HERRAMIENTAS","Tu ","taller")}
    <a href="F-Agenda.dc.html" style="padding: 16px; border-radius: 28px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; text-decoration: none; display: flex; flex-direction: column; gap: 12px">
      <span style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; align-items: center; gap: 10px">{mosaico_ic("agenda",40,fondo="rgba(255,255,255,0.16)",color=AMARILLO,radio=13,iconsize=20)}<span style="display: flex; flex-direction: column"><strong style="font-size: 17px">Agenda</strong><span style="font-size: 12px; color: #DCE7F7">Hoy, 2 turnos · próximo 18:00</span></span></span>{svg(IC["flecha"],"#FFFFFF",20)}</span>
      {semana()}
    </a>
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">
      {tile('F-Ingresos.dc.html','grafico','Ingresos y gastos','$ 239.500','Neto de noviembre',extra=barra_neto)}
      {tile('H0-Presupuesto.dc.html','ticket','Presupuestos y precios','3 abiertos','Lista del 05/11')}
      {tile('H0-Equipo.dc.html','caja','Tu equipamiento','37','herramientas · 1 para mantener')}
      {tile('T-Taller.dc.html','regla','Herramientas del teléfono','Medir y 3D','Nivel, linterna y tu oficio',NOCHE,'#FFFFFF')}
    </div>
    <a href="R-Catalogo.dc.html" style="display: flex; gap: 12px; align-items: center; min-height: 64px; padding: 10px 14px; border-radius: 22px; background: {AMARILLO}; color: {TINTA}; box-shadow: 0 4px 0 #C9C85A; text-decoration: none">{mosaico_ic("carrito",40,fondo="#FFFFFF",color=TINTA,radio=13,iconsize=20)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Ferretería</strong><span style="font-size: 12px">Catálogo y pedidos · 1 listo para retirar</span></span>{svg(IC["flecha"],TINTA,18)}</a>''', top=26) + '\n' + barra_vidrio('Taller')
guardar('F-Herramientas.dc.html','Taller · Tu taller',cuerpo)

# ── Escritorio: la app es solo para el celular ──
def raiz(f, quitar_enlaces=True):
    h=open('deluxe/project/'+f+'.dc.html').read()
    r=h.split('<x-dc>')[1].split('</x-dc>')[0]
    r=re.sub(r'<helmet>[\s\S]*?</helmet>','',r).strip()
    r=re.sub(r'<a ','<span ',r).replace('</a>','</span>'); r=re.sub(r'<button ','<span ',r).replace('</button>','</span>')
    return re.sub(r' role="[a-z]+"','',re.sub(r' tabindex="\d+"','',r))
W,H=1440,900
html=f'''<div style="width: {W}px; height: {H}px; box-sizing: border-box; background: #EEF3FA; font-family: 'DM Sans', system-ui, sans-serif; color: {TINTA}; position: relative; overflow: hidden">
  <div aria-hidden="true" style="position: absolute; left: -120px; bottom: -160px; width: 620px; height: 620px; border-radius: 50%; background: #E1EAF7"></div>
  <header style="position: absolute; top: 0; left: 0; right: 0; height: 72px; padding: 0 48px; display: flex; align-items: center; justify-content: space-between; background: {AZUL}"><span style="{TIT}; font-size: 30px; color: #FFFFFF">Handyx</span><span style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: rgba(255,255,255,0.16); color: #FFFFFF; font-size: 13px; font-weight: 800">{svg(IC["telefono"],AMARILLO,18)}App para especialistas · solo en el celular</span></header>
  <section style="position: absolute; left: 96px; top: 200px; width: 460px; display: flex; flex-direction: column; gap: 18px">
    {etiqueta("ESTÁS EN UNA COMPUTADORA", AZUL)}
    <h1 style="margin: 0; {TIT}; font-size: 46px; line-height: 1.02">Handyx se usa desde el {marcador("celular")}</h1>
    <p style="margin: 0; font-size: 17px; line-height: 1.45; color: {TEXTO}">La app del especialista está pensada para el trabajo en la calle: el mapa, la cámara, el nivel y los avisos funcionan en el teléfono. Desde la computadora te mostramos una vista de muestra.</p>
    <div style="display: flex; gap: 18px; align-items: center; padding: 18px; border-radius: 26px; background: #FFFFFF; box-shadow: {ELEV2}">{qr(120)}<span style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 17px">Escaneá con tu celular</strong><span style="font-size: 14px; color: {SUAVE}">Se abre la app y la podés instalar en la pantalla de inicio.</span></span></div>
  </section>
  <div style="position: absolute; left: 700px; top: 104px; width: 404px; height: 768px; border-radius: 48px; background: {NOCHE}; padding: 12px; box-sizing: border-box; box-shadow: 0 40px 80px -30px rgba(14,29,54,0.6)">
    <div aria-hidden="true" style="width: 380px; height: 744px; border-radius: 38px; overflow: hidden; position: relative"><div style="width: 390px; transform: scale(0.975); transform-origin: 0 0; pointer-events: none">{raiz('D6-Bienvenida')}</div></div>
  </div>
  <div style="position: absolute; left: 1140px; top: 380px; width: 230px; display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: {SUAVE}"><strong style="font-size: 14px; color: {TINTA}">Vista de muestra</strong><span>La columna replica el celular, en vertical y acortada. Para trabajar, usá el teléfono.</span></div>
</div>'''
doc=documento('Escritorio · Solo en el celular','').replace(f'<div style="width: 390px; height: 844px; box-sizing: border-box; background: #FFFFFF; font-family: \'DM Sans\', system-ui, sans-serif; color: {TINTA}; overflow: hidden; position: relative">\n\n</div>', html).replace('{"width":390,"height":844}', f'{{"width":{W},"height":{H}}}')
assert 'width: 1440px' in doc
open('deluxe/project/X-Escritorio.dc.html','w').write(doc)
print('ok')
