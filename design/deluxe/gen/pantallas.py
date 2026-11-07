import sys
sys.path.insert(0, 'gen')
from piezas import *
D = 'deluxe/project/'

# ── Inicio con mapa ─────────────────────────────────────────────
bloques=[]
for f in range(12):
    for c in range(5):
        bloques.append(f'<div style="position: absolute; left: {-24+c*66}px; top: {120+f*62}px; width: 54px; height: 50px; border-radius: 10px; background: {"#E2EDE0" if (f,c)==(3,2) else "#E7E9EE"}"></div>')
mapa='\n    '.join(bloques)
inicio=f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: #F3F4F7">
    {mapa}
    <div style="position: absolute; top: 0; bottom: 0; left: 312px; width: 8px; background: #EFE8D8"></div>
    <div style="position: absolute; top: 0; bottom: 0; left: 320px; right: 0; background: #E8EDF5"></div>
    <div style="position: absolute; top: 250px; left: 362px; transform: rotate(90deg); transform-origin: left top; font-size: 10px; font-weight: 800; letter-spacing: 3px; color: #A9B4C8; white-space: nowrap">MAR ARGENTINO</div>
    <div style="position: absolute; top: 352px; left: 40px; font-size: 11px; font-weight: 800; letter-spacing: 3px; color: #A9B0BC">LA PERLA</div>
    <div style="position: absolute; top: 190px; left: 160px; width: 110px; height: 110px; border-radius: 50%; background: rgba(31,87,168,0.10); border: 2px dashed {AZUL}"></div>
    <div style="position: absolute; top: 318px; left: 86px; width: 18px; height: 18px; border-radius: 50%; background: {AZUL}; border: 3px solid #FFFFFF; box-shadow: 0 0 0 10px rgba(31,87,168,0.16)"></div>
  </div>

  <header style="position: absolute; top: 0; left: 0; right: 0; padding: 22px 16px 20px 22px; background: {AZUL}; border-radius: 0 0 30px 30px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 12px 30px -16px rgba(14,29,54,0.55)">
    <span style="display: flex; flex-direction: column; gap: 2px">
      <span style="{TIT}; font-size: 40px; line-height: 1; color: #FFFFFF">Handyx</span>
      <span style="font-size: 11px; font-weight: 700; color: #FFFFFF">Soluciones, no problemas</span>
    </span>
    <span style="display: flex; gap: 10px">
      <button aria-label="Avisos" style="width: 58px; height: 58px; border-radius: 18px; border: 0; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['campana'],'#FFFFFF',24)}</button>
      <button aria-label="Mis zonas" style="width: 58px; height: 58px; border-radius: 18px; border: 0; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['pin'],'#FFFFFF',24)}</button>
    </span>
  </header>

  <button role="switch" aria-checked="true" style="position: absolute; top: 122px; right: 14px; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 10px 0 16px; border: 2px solid {AMARILLO}; border-radius: 999px; background: {NOCHE}; color: #FFFFFF; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 800; box-shadow: {ELEV2}">
    Disponible
    <span style="width: 48px; height: 28px; border-radius: 14px; background: {AMARILLO}; position: relative; display: block"><span style="position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; border-radius: 50%; background: {NOCHE}; display: block"></span></span>
  </button>

  <section style="position: absolute; left: 0; right: 0; top: 410px; bottom: 0; padding: 10px 16px 0; border-radius: 32px 32px 0 0; background: #FFFFFF; box-shadow: 0 -6px 18px -6px rgba(14,29,54,0.18), 0 24px 60px -20px rgba(14,29,54,0.45); display: flex; flex-direction: column; gap: 12px">
    <div style="align-self: center; width: 44px; height: 5px; border-radius: 3px; background: #D5DAE3"></div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px">
      <span style="display: flex; flex-direction: column; gap: 4px">
        {etiqueta("PEDIDO URGENTE · QUEDAN 18:42", AZUL)}
        <h1 style="margin: 0; {TIT}; font-size: 30px; line-height: 1">{marcador("Plomería")}</h1>
        <span style="font-size: 15px; color: {TEXTO}">Pierde la canilla de la cocina</span>
        <span style="align-self: flex-start; display: flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px; background: {TINTE}; color: {HONDO}; font-size: 12px; font-weight: 700">{svg(IC['pin'],HONDO,14)}Centro · zona aproximada</span>
      </span>
      <span style="width: 74px; height: 74px; flex: none; border-radius: 22px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center"><img src="{BLOB['cano']}" alt="" aria-hidden="true" style="width: 48px; height: 56px; object-fit: contain"></span>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
      <span style="display: flex; flex-direction: column"><span style="font-size: 12px; font-weight: 700; color: {SUAVE}">Handyx sugiere · vos decidís</span><span style="{TIT}; font-size: 28px">$ 45.000</span></span>
      {boton("Ver y cotizar", "F-Precio.dc.html", alto=52)}
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
      <a href="F-Ingresos.dc.html" style="padding: 12px 14px; border-radius: 20px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column"><span style="font-size: 12px; color: {SUAVE}; font-weight: 700">Neto de noviembre</span><span style="{TIT}; font-size: 19px">$ 239.500</span></a>
      <a href="F-Regalo.dc.html" style="padding: 12px 14px; border-radius: 20px; background: {MOSAICO}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 12px; color: {SUAVE}; font-weight: 700">Tu camino · 8 de 10</span><span style="height: 6px; border-radius: 3px; background: #FFFFFF; display: block"><span style="width: 80%; height: 6px; border-radius: 3px; background: {AZUL}; display: block"></span></span></a>
    </div>
  </section>

{barra_vidrio('Inicio')}'''
open(D+'F-Inicio.dc.html','w').write(documento('Elegida · Inicio con mapa', inicio))

# ── Tus obras ───────────────────────────────────────────────────
def tira(estados):
    col={'hecha':AZUL,'hoy':AMARILLO,'falta':MOSAICO}
    partes=[]
    for e in estados:
        borde = f'box-shadow: 0 0 0 2px {TINTA};' if e=='hoy' else ''
        partes.append(f'<span style="flex: 1; height: 8px; border-radius: 4px; background: {col[e]}; {borde}"></span>')
    return '<div style="display: flex; gap: 5px">'+''.join(partes)+'</div>'

def obra(titulo, sub, anillo_html, chip, chip_estilo, estados, etapa, href, aria):
    cont=f'''<div style="display: flex; align-items: center; gap: 14px">{anillo_html}<span style="display: flex; flex-direction: column; gap: 2px; min-width: 0"><strong style="{TIT}; font-size: 21px; line-height: 1.05">{titulo}</strong><span style="font-size: 13px; color: {SUAVE}">{sub}</span></span></div>
      <div aria-label="{aria}">{tira(estados)}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="display: flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 999px; {chip_estilo}; font-size: 12px; font-weight: 800">{svg(IC['reloj'], 'currentColor', 14)}{chip}</span><span style="font-size: 13px; font-weight: 700; color: {TEXTO}">{etapa}</span></div>'''
    return tarjeta(cont, franja('Ver la obra', href))

obras=f'''  <section style="padding: 26px 20px 0; display: flex; flex-direction: column; gap: 6px">
    {etiqueta("MARTES 17 · 2 EN CURSO")}
    <h1 style="margin: 0; {TIT}; font-size: 40px; line-height: 1">Tus {marcador("obras")}</h1>
    <p style="margin: 0; font-size: 14px; color: {SUAVE}">Seguí cada obra día por día.</p>
  </section>
  <div role="tablist" aria-label="Estado de las obras" style="margin: 16px 20px 0; display: flex; gap: 8px">
    <button role="tab" aria-selected="true" style="min-height: 44px; padding: 0 16px; border-radius: 14px; border: 0; background: {AZUL}; color: #FFFFFF; font-weight: 800; box-shadow: 0 3px 0 {HONDO}">En curso · 2</button>
    <button role="tab" aria-selected="false" style="min-height: 44px; padding: 0 14px; border-radius: 14px; border: 0; background: {MOSAICO}; color: {TEXTO}; font-weight: 700">Próximas · 1</button>
    <button role="tab" aria-selected="false" style="min-height: 44px; padding: 0 14px; border-radius: 14px; border: 0; background: {MOSAICO}; color: {TEXTO}; font-weight: 700">Terminadas · 4</button>
  </div>
  <div style="margin: 16px 20px 0; display: flex; flex-direction: column; gap: 14px">
    {obra("Baño completo","Los Troncos · Albañilería y Plomería",anillo(2,4),"Hoy · día 3 de 6",f"background: {AMARILLO}; color: {TINTA}",['hecha','hecha','hoy','falta','falta','falta'],"Revestimiento","F-Obra.dc.html","Jornadas: 2 hechas, hoy es la 3 de 6")}
    {obra("Tablero y circuitos","Punta Mogotes · Electricidad",anillo(0,3),"Empieza el jueves 19",f"background: {NOCHE}; color: #FFFFFF",['falta','falta','falta'],"Etapa 1 de 3","F-Obra.dc.html","Jornadas: ninguna hecha de 3")}
    {obra("Revoque del frente","Chauvín · Albañilería",anillo(1,2),"Mañana · día 2 de 2",f"background: {TINTE}; color: {HONDO}",['hecha','falta'],"Terminación","F-Obra.dc.html","Jornadas: 1 hecha de 2")}
  </div>
{barra_vidrio('Obras')}'''
open(D+'F-Obras.dc.html','w').write(documento('Elegida · Tus obras', obras))

# ── Obra día por día ────────────────────────────────────────────
def dia(nombre, num, estado):
    if estado=='hecha':
        est=f'background: {AZUL}; color: #FFFFFF'; pie=svg(IC['check'],'#FFFFFF',14,3)
    elif estado=='hoy':
        est=f'background: #FFFFFF; color: {TINTA}; box-shadow: inset 0 0 0 3px {NARANJA}'; pie='<span style="font-size: 10px; font-weight: 800">Hoy</span>'
    else:
        est=f'background: {MOSAICO}; color: {TEXTO}'; pie='<span style="font-size: 10px">&nbsp;</span>'
    actual=' aria-current="date"' if estado=='hoy' else ''
    return f'<li{actual} style="padding: 8px 0; border-radius: 16px; {est}; display: flex; flex-direction: column; align-items: center; gap: 1px"><span style="font-size: 10px; font-weight: 800">{nombre}</span><strong style="{TIT}; font-size: 17px">{num}</strong>{pie}</li>'
dias=''.join([dia('JUE','12','hecha'),dia('VIE','13','hecha'),dia('MAR','17','hoy'),dia('MIÉ','18','falta'),dia('JUE','19','falta'),dia('VIE','20','falta')])
def dato(t,v,color=TINTA):
    return f'<li style="padding: 12px 14px; border-radius: 20px; background: {MOSAICO}; display: flex; flex-direction: column"><span style="font-size: 12px; font-weight: 700; color: {SUAVE}">{t}</span><strong style="{TIT}; font-size: 19px; color: {color}">{v}</strong></li>'
hoy_cont=f'''<div style="display: flex; justify-content: space-between; align-items: center"><strong style="font-size: 16px">Hoy · 9:00 a 17:00</strong><span style="padding: 4px 10px; border-radius: 999px; background: {AMARILLO}; font-size: 12px; font-weight: 800">Día 3 de 6</span></div>
      <span style="font-size: 13px; color: {SUAVE}">Último avance · viernes 13 · lo ve el cliente</span>
      <div style="display: flex; gap: 10px; align-items: center"><span aria-hidden="true" style="width: 60px; height: 60px; flex: none; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['camara'],SUAVE,22)}</span><span aria-hidden="true" style="width: 60px; height: 60px; flex: none; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['camara'],SUAVE,22)}</span><p style="margin: 0; font-size: 14px; color: {TEXTO}">Cañerías probadas, sin pérdidas.</p></div>'''
obra_d=f'''{barra_compacta("Obra","F-Obras.dc.html")}
  <section style="position: absolute; top: 72px; left: 20px; right: 20px; display: flex; flex-direction: column; gap: 14px">
    <div style="display: flex; align-items: center; gap: 14px">
      {anillo(2,4,64)}
      <span style="display: flex; flex-direction: column; gap: 3px; min-width: 0">
        {etiqueta("LOS TRONCOS · ALBAÑILERÍA Y PLOMERÍA")}
        <span style="{TIT}; font-size: 28px; line-height: 1">Baño completo</span>
        <span style="font-size: 14px; color: {TEXTO}">Etapa 3 de 4: <strong>Revestimiento</strong></span>
      </span>
    </div>
    <ol aria-label="Jornadas de la obra" style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px">{dias}</ol>
    {tarjeta(hoy_cont, franja('Ver el diario completo','F-Obras.dc.html'))}
    <ul aria-label="Plata de la obra" style="list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
      {dato("Acordado","$ 850.000")}{dato("Cobrado","$ 400.000")}{dato("Materiales","− $ 210.000")}{dato("Falta cobrar","$ 450.000",AZUL)}
    </ul>
  </section>
{accion_fija(svg(IC['camara'],'#FFFFFF',20)+'Cargar el avance de hoy','F-Obras.dc.html')}'''
open(D+'F-Obra.dc.html','w').write(documento('Elegida · Obra día por día', obra_d))

# ── Tus ingresos ────────────────────────────────────────────────
def fila(t,v,color=None,cuadro=None,fuerte=False):
    c=f'<span aria-hidden="true" style="display: inline-block; width: 10px; height: 10px; border-radius: 3px; background: {cuadro}; margin-right: 8px"></span>' if cuadro else ''
    col=f'color: {color};' if color else ''
    peso='font-weight: 800;' if fuerte else ''
    return f'<div style="display: flex; justify-content: space-between; font-size: 14px; {col} {peso}"><span>{c}{t}</span><span>{v}</span></div>'
desglose=(fila('Bruto cobrado','$ 320.000',fuerte=True)
  +fila('En Handyx · $ 200.000 verificado','$ 260.000',SUAVE)
  +fila('Por fuera de Handyx','$ 60.000',SUAVE)
  +f'<div style="height: 1px; background: {BORDE}"></div>'
  +fila('Materiales','− $ 68.500',cuadro=AMARILLO)
  +fila('Combustible y viáticos','− $ 12.000',cuadro=NOCHE)
  +fila('Tarifa de Handyx durante la demo','0 %',SUAVE)
  +f'<div style="height: 1px; background: {BORDE}"></div>'
  +f'<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-weight: 800"><span aria-hidden="true" style="display: inline-block; width: 10px; height: 10px; border-radius: 3px; background: {AZUL}; margin-right: 8px"></span>Neto</span><strong style="{TIT}; font-size: 22px; color: {EXITO}">$ 239.500</strong></div>')
def ganancia(t,d,v,href):
    return f'<a href="{href}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 20px; background: {MOSAICO}; color: {TINTA}; text-decoration: none"><span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{d}</span></span><strong style="{TIT}; font-size: 17px">{v}</strong></a>'
ingresos=f'''{barra_compacta("Tus ingresos","F-Cuenta.dc.html")}
  <section style="position: absolute; top: 72px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 14px">
    <div style="padding: 18px; border-radius: 26px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 5px 0 {HONDO}, {ELEV1}; display: flex; flex-direction: column; gap: 6px">
      <div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("NETO · LO QUE TE QUEDA", "#CFE0FA")}<button style="min-height: 36px; padding: 0 12px; border-radius: 12px; border: 0; background: rgba(255,255,255,0.18); color: #FFFFFF; font-weight: 800">Noviembre ▾</button></div>
      <span style="{TIT}; font-size: 52px; line-height: 1; letter-spacing: -1px; font-variant-numeric: tabular-nums">$ 239.500</span>
      <span style="font-size: 14px; color: #E3ECFA">Bruto $ 320.000 · gastos $ 80.500</span>
      <div role="img" aria-label="Del bruto: 75 % neto, 21 % materiales, 4 % combustible y viáticos" style="margin-top: 8px; height: 14px; border-radius: 7px; overflow: hidden; display: flex; background: #FFFFFF">
        <span style="width: 74.8%; background: #FFFFFF"></span><span style="width: 21.4%; background: {AMARILLO}"></span><span style="width: 3.8%; background: {NOCHE}"></span>
      </div>
    </div>
    {tarjeta(desglose, '<div style="padding: 12px 16px; background: #F4F5F7; border-top: 1px solid '+BORDE+'; font-size: 12px; color: '+SUAVE+'">Lo informado sin verificar se muestra aparte hasta que se confirma.</div>')}
    <div style="display: flex; flex-direction: column; gap: 8px">
      <h2 style="margin: 0; font-size: 15px; font-weight: 800">Ganancia por trabajo</h2>
      {ganancia("Baño completo · etapa 2","$ 180.000 − $ 52.000 de materiales","$ 128.000","F-Obra.dc.html")}
      {ganancia("Pérdida en la cocina","$ 47.000 − $ 8.500 de materiales","$ 38.500","F-Precio.dc.html")}
    </div>
  </section>
{accion_fija(svg(IC['camara'],'#FFFFFF',20)+'Cargar un gasto con la foto del ticket','F-Ingresos.dc.html')}'''
open(D+'F-Ingresos.dc.html','w').write(documento('Elegida · Tus ingresos', ingresos))

# ── Tu precio ───────────────────────────────────────────────────
def paso(t, on=False):
    est=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<button style="min-height: 46px; border-radius: 14px; border: 0; {est}; font-weight: 800">{t}</button>'
resumen=f'''<div style="display: flex; align-items: center; gap: 12px"><span style="width: 58px; height: 58px; flex: none; border-radius: 18px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center"><img src="{BLOB['cano']}" alt="" aria-hidden="true" style="width: 36px; height: 42px; object-fit: contain"></span><span style="display: flex; flex-direction: column; gap: 2px"><strong style="{TIT}; font-size: 20px">Plomería</strong><span style="font-size: 13px; color: {SUAVE}">Pierde la canilla de la cocina · Centro · en 1 hora</span></span></div>'''
desg=(fila('Tu precio','$ 47.000',fuerte=True)+fila('Tarifa de Handyx durante la demo','0 %',SUAVE)+f'<div style="height: 1px; background: {BORDE}"></div>'
  +f'<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-weight: 800">Recibís</span><strong style="{TIT}; font-size: 24px; color: {EXITO}">$ 47.000</strong></div><span style="font-size: 12px; color: {SUAVE}">El cliente te paga directo a vos.</span>')
precio=f'''{barra_compacta("Tu precio","F-Inicio.dc.html")}
  <section style="position: absolute; top: 72px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 14px">
    {tarjeta(resumen)}
    <div style="padding: 18px 16px; border-radius: 26px; background: {TINTE}; display: flex; flex-direction: column; align-items: center; gap: 14px">
      <span style="padding: 6px 12px; border-radius: 999px; background: #FFFFFF; color: {HONDO}; font-size: 12px; font-weight: 800">Handyx sugiere $ 45.000 · vos decidís</span>
      <div style="width: 100%; display: grid; grid-template-columns: 56px minmax(0, 1fr) 56px; align-items: center; gap: 8px">
        <button aria-label="Bajar $ 1.000" style="height: 56px; border-radius: 16px; border: 0; background: #FFFFFF; color: {AZUL}; box-shadow: 0 4px 0 #C9D6EC; font-size: 26px; font-weight: 800">−</button>
        <span style="text-align: center; {TIT}; font-size: 44px; letter-spacing: -1px; font-variant-numeric: tabular-nums">$ 47.000</span>
        <button aria-label="Subir $ 1.000" style="height: 56px; border-radius: 16px; border: 0; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}; font-size: 26px; font-weight: 800">+</button>
      </div>
      <div style="width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">{paso('+ $ 1.000')}{paso('+ $ 2.000',True)}{paso('+ $ 5.000')}</div>
    </div>
    {tarjeta(desg)}
  </section>
{accion_fija('Enviar propuesta de $ 47.000','F-Regalo.dc.html')}'''
open(D+'F-Precio.dc.html','w').write(documento('Elegida · Tu precio', precio))

# ── El regalo ───────────────────────────────────────────────────
papelitos=''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; border-radius: 2px; background: {c}; transform: rotate({r}deg)"></span>' for x,y,w,h,c,r in [(40,250,10,16,AMARILLO,20),(320,230,12,12,AZUL,-15),(70,420,8,14,AZUL,40),(310,400,10,16,AMARILLO,-30),(110,190,8,8,NARANJA,10),(285,300,8,14,NOCHE,25)])
regalo=f'''  <section style="padding: 34px 24px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
    {etiqueta("ESTACIÓN 3 · TU CAMINO", AZUL)}
    <h1 style="margin: 0; {TIT}; font-size: 36px; line-height: 1.02">¡10 trabajos {marcador("verificados")}!</h1>
  </section>
  {papelitos}
  <div style="position: absolute; top: 200px; left: 50%; margin-left: -120px; width: 240px; height: 240px; border-radius: 60px; background: {MOSAICO}"></div>
  <div style="position: absolute; top: 236px; left: 50%; margin-left: -84px; width: 168px; height: 180px">
    <div style="position: absolute; left: 6px; right: 6px; bottom: 0; height: 116px; border-radius: 16px; background: {AZUL}; box-shadow: 0 6px 0 {HONDO}"></div>
    <div style="position: absolute; left: 0; right: 0; top: 34px; height: 32px; border-radius: 12px; background: #2F6BFF; box-shadow: 0 5px 0 {HONDO}; transform: rotate(-9deg) translateY(-24px)"></div>
    <div style="position: absolute; left: 50%; top: 42px; bottom: 6px; width: 24px; margin-left: -12px; background: {AMARILLO}"></div>
    <img src="{BLOB['llave']}" alt="" aria-hidden="true" style="position: absolute; right: -54px; top: -30px; width: 84px; height: 80px; object-fit: contain; transform: rotate(12deg)">
  </div>
  <div style="position: absolute; top: 470px; left: 24px; right: 24px">
    {tarjeta(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center">{etiqueta("GANASTE", AZUL)}<strong style="{TIT}; font-size: 28px">Gorra Handyx</strong><span style="font-size: 14px; color: {SUAVE}">Elegí el color y si la retirás o te la mandamos.</span></div>', '<div style="padding: 12px 16px; background: #F4F5F7; border-top: 1px solid '+BORDE+'; font-size: 13px; color: '+TEXTO+'; text-align: center">Próxima estación: herramienta de tu oficio · 15 trabajos</div>')}
  </div>
{accion_fija('Quiero mi premio','G-Canje.dc.html')}'''
open(D+'F-Regalo.dc.html','w').write(documento('Elegida · El regalo', regalo))
print('ok')
