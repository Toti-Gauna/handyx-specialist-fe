import sys; sys.path.insert(0,'gen')
from piezas2 import *

def herr(ic, t, sub, href, nuevo=False):
    n=f'<span style="position: absolute; top: 10px; right: 10px">{chip("Nuevo",tono="amarillo")}</span>' if nuevo else ''
    return f'<a href="{href}" style="position: relative; padding: 14px; border-radius: 22px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 8px; min-height: 118px; box-sizing: border-box">{n}{mosaico_ic(ic,44,fondo="#FFFFFF",radio=14,iconsize=22)}<strong style="font-size: 15px; line-height: 1.15">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></a>'
def oficio(t, ic, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: #FFFFFF; color: {TEXTO}; border: 1px solid {BORDE}'
    return f'<span style="display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 12px; border-radius: 14px; {s}; font-size: 13px; font-weight: 800; white-space: nowrap">{svg(IC[ic],"#FFFFFF" if on else TEXTO,16)}{t}</span>'

# Portada del Taller: caja de herramientas 3D (nativa) y grilla por oficio.
caja3d=f'''<div aria-hidden="true" style="position: relative; height: 150px; border-radius: 26px; background: {TINTE}; overflow: hidden">
      <div style="position: absolute; left: 50%; bottom: 22px; margin-left: -95px; width: 190px; height: 74px; border-radius: 14px; background: {AZUL}; box-shadow: 0 6px 0 {HONDO}"></div>
      <div style="position: absolute; left: 50%; bottom: 92px; margin-left: -100px; width: 200px; height: 26px; border-radius: 10px; background: #2F6BFF; transform: rotate(-8deg); transform-origin: left bottom"></div>
      <div style="position: absolute; left: 50%; bottom: 60px; margin-left: -30px; width: 60px; height: 14px; border-radius: 7px; background: {AMARILLO}"></div>
      <img src="{BLOB['lamparita']}" alt="" style="position: absolute; right: 30px; top: 12px; width: 50px; height: 70px; object-fit: contain">
      <span style="position: absolute; left: 14px; top: 12px">{chip("3D · girá con el dedo","caja","blanco")}</span>
    </div>'''
cuerpo = contenido(f'''
    {titulo_grande("HERRAMIENTAS POR OFICIO","Tu ","taller")}
    {caja3d}
    <div style="display: flex; gap: 8px; overflow: hidden">{oficio('Electricidad','rayo',True)}{oficio('Plomería','gota')}{oficio('Gas','llama')}{oficio('Aire','copo')}</div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">{herr('rayo','Cables y caída de tensión','Sección según carga y distancia','T-Cables.dc.html')}{herr('caja','Tablero 3D','Armalo y miralo en la pared','T-Tablero.dc.html')}{herr('escudo','Informe eléctrico','Mediciones con semáforo','T-Informe.dc.html')}{herr('nivel','Nivel','Con el giroscopio del teléfono','T-Taller.dc.html')}</div>''', top=26) + '\n' + barra_vidrio('Cuenta')
guardar('T-Taller.dc.html','Taller · Portada',cuerpo)

# Cables y caída de tensión.
def entrada(et, v, unidad=''):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{et}</span><span style="min-height: 52px; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: space-between; padding: 0 14px"><strong style="{TIT}; font-size: 22px">{v}</strong><span style="font-size: 13px; color: {SUAVE}; font-weight: 700">{unidad}</span></span></div>'
cuerpo = barra_compacta('Cables','T-Taller.dc.html',sub='Electricidad') + contenido(f'''
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">{entrada('Potencia','3.500','W')}{entrada('Distancia','25','m')}{entrada('Tensión','220','V')}{entrada('Caída máxima','3','%')}</div>
    <div style="padding: 18px; border-radius: 26px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; display: flex; flex-direction: column; gap: 6px">
      {etiqueta("SECCIÓN SUGERIDA","#CFE0FA")}
      <div style="display: flex; align-items: baseline; gap: 10px"><span style="{TIT}; font-size: 56px; line-height: 1">4</span><span style="font-size: 18px; font-weight: 800">mm²</span><span style="margin-left: auto">{chip("Caída 2,1 %","check","blanco")}</span></div>
      <span style="font-size: 13px; color: #F0F5FD">Corriente 15,9 A · protección sugerida 20 A</span>
    </div>
    <div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 18px; background: {AMARILLO}">{svg(IC['alerta'],TINTA,20)}<span style="font-size: 13px; font-weight: 700">Tabla en revisión técnica. Es orientativa: no reemplaza la norma ni tu criterio.</span></div>''') + '\n' + accion_fija('Sumar al presupuesto','H0-Presupuesto.dc.html')
guardar('T-Cables.dc.html','Taller · Cables',cuerpo)

# Tablero 3D.
modulos=''.join(f'<span style="width: {w}px; height: 70px; border-radius: 6px; background: {c}; box-shadow: inset 0 -6px 0 rgba(0,0,0,0.12); display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; box-sizing: border-box; font-size: 11px; font-weight: 800; color: {t}">{l}</span>' for w,c,t,l in [(56,'#FFFFFF',TINTA,'ID 40A'),(28,'#FFFFFF',TINTA,'C16'),(28,'#FFFFFF',TINTA,'C16'),(28,'#FFFFFF',TINTA,'C20'),(28,AMARILLO,TINTA,'+')])
tablero=f'''<div aria-hidden="true" style="height: 300px; border-radius: 26px; background: {NOCHE}; display: flex; align-items: center; justify-content: center; perspective: 600px">
      <div style="width: 250px; padding: 20px 16px; border-radius: 18px; background: #E9ECF2; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6); transform: rotateY(-14deg) rotateX(6deg)">
        <div style="height: 10px; border-radius: 5px; background: #B8BFCC; margin-bottom: 10px"></div>
        <div style="display: flex; gap: 4px; justify-content: center">{modulos}</div>
        <div style="height: 10px; border-radius: 5px; background: #B8BFCC; margin-top: 10px"></div>
      </div>
    </div>'''
cuerpo = barra_compacta('Tablero 3D','T-Taller.dc.html',sub='Vivienda · 3 circuitos') + contenido(f'''
    {tablero}
    <div style="display: flex; gap: 8px">{chip("Girá con un dedo","caja","gris")}{chip("Acercá con dos","herramienta","gris")}</div>
    {tarjeta(fila_ic('lista','Cómputo','1 diferencial, 3 térmicas, gabinete 8 módulos',borde=False)+fila_ic('ticket','Etiquetas','Imprimilas o pedile a la IA que las lea de una foto'))}''') + '\n' + acciones_fijas(f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Compartir","T-Tablero.dc.html","enviar")}{boton("Ver en la pared","T-Tablero.dc.html",alto=52)}</div>')
guardar('T-Tablero.dc.html','Taller · Tablero 3D',cuerpo)

# Informe eléctrico con semáforo.
def med(t, v, est):
    c={'ok':('#E3F4EA','#137140','Bien'),'ojo':(AMARILLO,TINTA,'Revisar'),'mal':('#FCE8E6','#A8261C','Mal')}[est]
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}"><span style="width: 14px; height: 14px; flex: none; border-radius: 50%; background: {c[1]}"></span><span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{v}</span></span><span style="padding: 4px 10px; border-radius: 999px; background: {c[0]}; color: {c[1]}; font-size: 12px; font-weight: 800">{c[2]}</span></div>'
cuerpo = barra_compacta('Informe eléctrico','T-Taller.dc.html') + contenido(f'''
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">
      <div style="padding: 12px; border-radius: 18px; background: #E3F4EA; text-align: center"><strong style="{TIT}; font-size: 26px; color: #137140">3</strong><span style="display: block; font-size: 12px; font-weight: 800; color: #137140">Bien</span></div>
      <div style="padding: 12px; border-radius: 18px; background: {AMARILLO}; text-align: center"><strong style="{TIT}; font-size: 26px">1</strong><span style="display: block; font-size: 12px; font-weight: 800">Revisar</span></div>
      <div style="padding: 12px; border-radius: 18px; background: {MOSAICO}; text-align: center"><strong style="{TIT}; font-size: 26px; color: {SUAVE}">0</strong><span style="display: block; font-size: 12px; font-weight: 800; color: {SUAVE}">Mal</span></div>
    </div>
    {tarjeta(etiqueta("MEDICIONES")+med('Puesta a tierra','8 Ω','ok')+med('Disparo del diferencial','24 ms','ok')+med('Aislación','2 MΩ','ojo')+med('Tensión','221 V','ok'), franja('Agregar fotos y observaciones','H0-AntesDespues.dc.html'))}
    <span style="font-size: 12px; color: {SUAVE}">No es un certificado. Sin datos del cliente.</span>''') + '\n' + accion_fija('Imprimir o guardar en PDF','T-Informe.dc.html')
guardar('T-Informe.dc.html','Taller · Informe eléctrico',cuerpo)

# ── Oficios H2–H6 (después del deploy) ───────────────────────────
def oficio_pant(nombre, archivo, rubro, ic, titulo_a, marcado, sup, hero, cuerpo_extra, accion, aviso=''):
    av=f'<div style="display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 18px; background: {AMARILLO}">{svg(IC["alerta"],TINTA,20)}<span style="font-size: 13px; font-weight: 700">{aviso}</span></div>' if aviso else ''
    c = barra_compacta(rubro,'T-Taller.dc.html',sub='Después del deploy') + contenido(f'''
    <div style="display: flex; align-items: center; gap: 12px">{mosaico_ic(ic,56,fondo=AZUL,color="#FFFFFF",radio=18,iconsize=28)}<span style="display: flex; flex-direction: column; gap: 2px">{etiqueta(sup)}<strong style="{TIT}; font-size: 26px; line-height: 1.02">{titulo_a}{marcador(marcado)}</strong></span></div>
    {hero}{cuerpo_extra}{av}''') + '\n' + accion_fija(accion[0], accion[1])
    guardar(archivo, nombre, c)

brujula=f'''<div aria-hidden="true" style="position: relative; height: 230px; border-radius: 26px; background: {TINTE}; display: flex; align-items: center; justify-content: center">
      <div style="width: 170px; height: 170px; border-radius: 50%; background: #FFFFFF; box-shadow: {ELEV2}; position: relative">
        {''.join(f'<span style="position: absolute; left: 50%; top: 50%; translate: -50% -50%; transform: rotate({a}deg) translateY(-70px); font-weight: 900; font-size: 13px; color: {SUAVE}">{l}</span>' for a,l in [(0,'N'),(90,'E'),(180,'S'),(270,'O')])}
        <span style="position: absolute; left: 50%; top: 50%; width: 10px; height: 120px; margin: -60px 0 0 -5px; border-radius: 5px; background: linear-gradient({AMARILLO} 0 50%, {AZUL} 50% 100%); transform: rotate(35deg)"></span>
      </div>
      <span style="position: absolute; left: 14px; bottom: 12px">{chip("Ventana al noroeste: más sol","copo","blanco")}</span>
    </div>'''
oficio_pant('Oficios · Aire acondicionado','OF-Aire.dc.html','Aire acondicionado','copo','Frigorías ','con la brújula','H2 · CÁLCULO',brujula,
 f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{entrada("Largo","4,2","m")}{entrada("Ancho","3,5","m")}{entrada("Personas","2","")}</div>' + tarjeta(f'<div style="display: flex; justify-content: space-between; align-items: baseline">{etiqueta("SUGERIDO")}<strong style="{TIT}; font-size: 30px">3.000 fg</strong></div><span style="font-size: 13px; color: {SUAVE}">Equipo de 3.500 W · orientativo</span>'),
 ('Ver el equipo en la pared (AR)','OF-Aire.dc.html'))
pend=f'''<div aria-hidden="true" style="position: relative; height: 210px; border-radius: 26px; background: {NOCHE}; overflow: hidden">
      <div style="position: absolute; left: 30px; right: 30px; top: 96px; height: 22px; border-radius: 11px; background: #E9ECF2; transform: rotate(-2deg)"></div>
      <div style="position: absolute; left: 50%; top: 52px; margin-left: -60px; width: 120px; height: 40px; border-radius: 20px; background: #26385C; display: flex; align-items: center; justify-content: center"><span style="width: 18px; height: 18px; border-radius: 50%; background: {AMARILLO}; margin-left: 18px"></span></div>
      <span style="position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; {TIT}; font-size: 40px; color: #FFFFFF">2,1 %</span>
    </div>'''
oficio_pant('Oficios · Plomería','OF-Plomeria.dc.html','Plomería','gota','Pendiente ','del desagüe','H3 · CON EL TELÉFONO',pend,
 tarjeta(fila_ic('check','Desagüe de 40 mm','Pendiente mínima sugerida: 2 %',derecha=chip("Bien","check","exito"),borde=False)+fila_ic('gota','Pérdida por el medidor','Dos fotos con 10 minutos de diferencia')),
 ('Guardar en el informe','H0-Informe.dc.html'))
prueba=f'''<div style="padding: 18px; border-radius: 26px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}; display: flex; flex-direction: column; align-items: center; gap: 6px">
      {etiqueta("PRUEBA DE HERMETICIDAD","#CFE0FA")}
      <span style="{TIT}; font-size: 60px; line-height: 1; font-variant-numeric: tabular-nums">09:42</span>
      <span style="font-size: 13px; color: #F0F5FD">Presión inicial 0,20 · lectura actual 0,20 (la cargás vos del manómetro)</span>
    </div>'''
oficio_pant('Oficios · Gas','OF-Gas.dc.html','Gas','llama','Prueba ','registrada','H4 · CON REVISIÓN TÉCNICA Y LEGAL',prueba,
 tarjeta(fila_ic('camara','Foto del manómetro al empezar','18:02',derecha=chip("Lista","check","exito"),borde=False)+fila_ic('camara','Foto al terminar','A los 15 minutos')+fila_ic('alerta','Si hay olor a gas','Protocolo de emergencia paso a paso')),
 ('Terminar la prueba','OF-Gas.dc.html'),'El teléfono no detecta gas ni monóxido. Las mediciones son tuyas, con tus instrumentos.')
muro=''.join(f'<span style="position: absolute; left: {x}px; top: {y}px; width: 54px; height: 22px; border-radius: 3px; background: {"#C97B4A" if (i+j)%5 else "#B86A3B"}"></span>' for j,y in enumerate(range(40,190,26)) for i,x in enumerate(range(20 if j%2 else 0, 340, 58)))
muro_html=f'<div aria-hidden="true" style="position: relative; height: 200px; border-radius: 26px; background: #EFE8D8; overflow: hidden">{muro}<span style="position: absolute; left: 14px; bottom: 12px">{chip("3D · se levanta hilada por hilada","caja","blanco")}</span></div>'
oficio_pant('Oficios · Albañilería','OF-Albanileria.dc.html','Albañilería','ladrillo','Cómputo ','de materiales','H5 · MUROS Y REVOQUES',muro_html,
 f'<div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{entrada("Largo","6","m")}{entrada("Alto","2,6","m")}{entrada("Desperdicio","10","%")}</div>' + tarjeta(fila_ic('ladrillo','Ladrillos comunes','1.030 unidades',borde=False)+fila_ic('caja','Cemento de albañilería','6 bolsas')+fila_ic('caja','Arena','0,9 m³')),
 ('Pasar a la lista de repuestos','R-Pedir.dc.html'))
cerradura=f'''<div aria-hidden="true" style="position: relative; height: 200px; border-radius: 26px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center; gap: 18px">
      <span style="width: 70px; height: 120px; border-radius: 35px; background: #C9A86A; box-shadow: inset 0 -8px 0 rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center"><span style="width: 18px; height: 40px; border-radius: 9px; background: {TINTA}"></span></span>
      <span style="display: flex; flex-direction: column; gap: 6px">{chip("Cilindro europeo","candado","blanco")}{chip("Confianza alta","check","exito")}</span>
    </div>'''
oficio_pant('Oficios · Cerrajería','OF-Cerrajeria.dc.html','Cerrajería','candado','Antes de ','abrir','H6 · IDENTIFICACIÓN Y CONSTANCIA',cerradura,
 tarjeta(fila_ic('escudo','Constancia de autorización','La persona confirma que puede pedir la apertura',derecha=chip("Falta","alerta","error"),borde=False)+fila_ic('cuenta','Sin guardar el DNI','Solo se registra que lo viste')),
 ('Firmar la constancia','OF-Cerrajeria.dc.html'),'La IA identifica el tipo de cerradura por foto. Nunca decodifica llaves.')
print('ok')
