import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({
 'carrito':'<path d="M3 4h2l2.5 11h11l2-8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>',
 'sol':'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"></path>',
 'parlante':'<path d="M4 9h4l5-4v14l-5-4H4V9Z"></path><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"></path>',
 'grafico':'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"></path>',
 'subir':'<path d="M12 16V4M7 9l5-5 5 5"></path><path d="M4 16v4h16v-4"></path>',
 'tienda':'<path d="M3 9l2-5h14l2 5"></path><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9Z"></path><path d="M5 13v8h14v-8"></path>',
 'lupa':'<circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path>',
 'tornillo':'<path d="M9 3h6l-1 4h-4L9 3Z"></path><path d="M12 7v13M9.5 10l5 1.5M9.5 13l5 1.5M9.5 16l5 1.5"></path>',
 'flechas':'<path d="M4 9h13l-4-4M20 15H7l4 4"></path>',
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
})
SIM = chip("Datos de ejemplo · ferreterías ficticias","alerta","amarillo")

# ── Teléfono del profesional: QR a pantalla completa y modo mostrador ──
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: {AZUL}"></div>
  <div aria-hidden="true" style="position: absolute; left: -60px; top: -60px; width: 260px; height: 260px; border-radius: 50%; background: rgba(255,255,255,0.06)"></div>
  <div aria-hidden="true" style="position: absolute; right: -80px; bottom: 120px; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.05)"></div>
  <header style="position: absolute; top: 14px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center">
    <a href="R-Estado.dc.html" aria-label="Cerrar" style="width: 48px; height: 48px; border-radius: 16px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>
    {chip("Brillo al máximo","sol","blanco")}
  </header>
  <section style="position: absolute; top: 84px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 6px; color: #FFFFFF; text-align: center">
    {etiqueta("LISTO PARA RETIRAR · HASTA LAS 20","#CFE0FA")}
    <strong style="{TIT}; font-size: 26px; line-height: 1.05">Ferretería Simulación Centro</strong>
  </section>
  <div style="position: absolute; top: 166px; left: 50%; margin-left: -150px; width: 300px; padding: 20px; box-sizing: border-box; border-radius: 32px; background: #FFFFFF; box-shadow: 0 30px 60px -20px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; gap: 12px">
    {qr(240)}
    <strong style="{TIT}; font-size: 30px; letter-spacing: 6px">HX-4815</strong>
    <span style="font-size: 12px; color: {SUAVE}">El ferretero lo escanea con su app y ve toda la lista</span>
  </div>
  <div style="position: absolute; left: 16px; right: 16px; top: 580px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">
    {''.join(f'<div style="padding: 10px; border-radius: 18px; background: {HONDO}; color: #FFFFFF; text-align: center"><strong style="display: block; {TIT}; font-size: 18px; font-stretch: 100%; letter-spacing: -0.2px; white-space: nowrap">{v}</strong><span style="font-size: 11px; color: #F0F5FD">{t}</span></div>' for v,t in [('5','ítems'),('$ 25.600','se paga allá'),('1,2 km','12 min')])}
  </div>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 22px; display: flex; flex-direction: column; gap: 10px">
    <a href="R-Mostrador.dc.html" style="display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 56px; border-radius: 18px; background: #FFFFFF; color: {AZUL}; font-size: 16px; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 #C9D6EC">{svg(IC['lista'],AZUL,20)}Mostrar la lista en el mostrador</a>
    <a href="F-InicioRuta.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 52px; border-radius: 18px; background: {AMARILLO}; color: {TINTA}; font-size: 16px; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 #C9C85A">Ya lo retiré</a>
  </div>'''
guardar('R-Retiro.dc.html','R · Retiro con QR',cuerpo)

def fila_m(n, t, var, ok=False):
    return f'<div style="display: flex; gap: 14px; align-items: center; padding: 14px 0; border-top: 1px solid {BORDE}"><strong style="{TIT}; font-size: 34px; min-width: 42px; text-align: center; color: {AZUL}">{n}</strong><span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 20px; line-height: 1.15; {"text-decoration: line-through; color: "+SUAVE if ok else ""}">{t}</strong><span style="font-size: 15px; color: {SUAVE}">{var}</span></span><span style="width: 40px; height: 40px; border-radius: 12px; {"background: "+AZUL if ok else "border: 2px solid #C9CFDA"}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",22,3) if ok else ""}</span></div>'
cuerpo = barra_compacta('Lista para el mostrador','R-Retiro.dc.html',sub='HX-4815 · letra grande') + contenido(f'''
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 8px"><span style="min-height: 48px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800">{svg(IC['parlante'],'#FFFFFF',20)}Leer en voz alta</span><a href="R-Retiro.dc.html" style="min-height: 48px; border-radius: 16px; background: {MOSAICO}; color: {TINTA}; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; text-decoration: none">{svg(IC['qr'],TINTA,20)}Volver al QR</a></div>
    {tarjeta(fila_m(1,'Cartucho cerámico','35 mm',True)+fila_m(2,'Flexible','40 cm')+fila_m(3,'Teflón','12 mm (o 19 mm)')+fila_m(1,'Tarugo de nylon','8 mm · caja de 50')+fila_m(2,'Pastina','gris'))}
    <span style="font-size: 12px; color: {SUAVE}">Tocá cada ítem cuando te lo den. La lectura en voz alta se hace en tu teléfono.</span>''') + '\n' + accion_fija('Ya lo retiré','F-InicioRuta.dc.html')
guardar('R-Mostrador.dc.html','R · Lista para el mostrador',cuerpo)

# ── Panel del ferretero (web, 1280 × 800) ───────────────────────────
W,H=1280,800
def desk(archivo, titulo, activo, contenido_html):
    items=[('casa','Inicio','FE-Inicio.dc.html'),('lista','Pedidos','FE-Pedido.dc.html'),('qr','Escanear','FE-Escanear.dc.html'),('carrito','Entregas','FE-Retiro.dc.html'),('tornillo','Catálogo y precios','FE-Catalogo.dc.html'),('subir','Importar lista','FE-Importar.dc.html'),('grafico','Métricas','FE-Metricas.dc.html')]
    nav=''.join(f'<a href="{h}" {"aria-current=\"page\"" if t==activo else ""} style="display: flex; align-items: center; gap: 12px; min-height: 46px; padding: 0 14px; border-radius: 14px; {"background: "+AZUL+"; color: #FFFFFF; box-shadow: 0 3px 0 "+HONDO if t==activo else "color: #C9D5EA"}; font-size: 14px; font-weight: 800; text-decoration: none">{svg(IC[i],"#FFFFFF" if t==activo else "#C9D5EA",20)}{t}{"<span style=\"margin-left: auto; min-width: 22px; height: 22px; border-radius: 11px; background: "+AMARILLO+"; color: "+TINTA+"; font-size: 12px; display: flex; align-items: center; justify-content: center\">3</span>" if t=="Pedidos" else ""}</a>' for i,t,h in items)
    cuerpo=f'''<div style="width: {W}px; height: {H}px; box-sizing: border-box; background: #F6F7F9; font-family: 'DM Sans', system-ui, sans-serif; color: {TINTA}; display: grid; grid-template-columns: 248px minmax(0,1fr); overflow: hidden">
  <aside style="background: {NOCHE}; padding: 22px 16px; display: flex; flex-direction: column; gap: 6px">
    <div style="display: flex; flex-direction: column; padding: 0 8px 18px"><span style="{TIT}; font-size: 28px; color: #FFFFFF; line-height: 1">Handyx</span><span style="font-size: 12px; font-weight: 800; letter-spacing: 2px; color: {AMARILLO}">FERRETERÍAS</span></div>
    <nav aria-label="Secciones del panel" style="display: flex; flex-direction: column; gap: 4px">{nav}</nav>
    <div style="margin-top: auto; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.08); display: flex; gap: 10px; align-items: center">{mosaico_ic('tienda',40,fondo=AMARILLO,color=TINTA,radio=12,iconsize=20)}<span style="display: flex; flex-direction: column"><strong style="font-size: 13px; color: #FFFFFF">Ferretería Simulación Centro</strong><span style="font-size: 11px; color: #AFC0DD">Abierta · hasta las 20</span></span></div>
  </aside>
  <main style="padding: 22px 28px; display: flex; flex-direction: column; gap: 18px; min-width: 0; overflow: hidden">
    <header style="display: flex; align-items: center; gap: 14px"><h1 style="margin: 0; {TIT}; font-size: 30px; flex: 1">{titulo}</h1>{SIM}<span style="min-height: 44px; width: 280px; border-radius: 14px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 8px; padding: 0 12px; color: {SUAVE}; font-size: 14px">{svg(IC['lupa'],SUAVE,18)}Buscar pedido, producto o código</span><span style="width: 44px; height: 44px; border-radius: 14px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; align-items: center; justify-content: center; position: relative">{svg(IC['campana'],TINTA,20)}<span style="position: absolute; top: 10px; right: 11px; width: 9px; height: 9px; border-radius: 50%; background: #D93025"></span></span></header>
    {contenido_html}
  </main>
</div>'''
    doc=documento(titulo,'').replace(f'<div style="width: 390px; height: 844px; box-sizing: border-box; background: #FFFFFF; font-family: \'DM Sans\', system-ui, sans-serif; color: {TINTA}; overflow: hidden; position: relative">\n\n</div>', cuerpo).replace('{"width":390,"height":844}','{"width":1280,"height":800}')
    open('deluxe/project/'+archivo,'w').write(doc)

def kpi(t, v, sub, fondo='#FFFFFF', color=TINTA, ic='lista'):
    return f'<div style="padding: 16px; border-radius: 20px; background: {fondo}; color: {color}; {"border: 1px solid "+BORDE+"; box-shadow: "+ELEV1 if fondo=="#FFFFFF" else "box-shadow: 0 4px 0 "+HONDO}; display: flex; flex-direction: column; gap: 4px">{svg(IC[ic],AZUL if fondo=="#FFFFFF" else color,22)}<span style="font-size: 12px; font-weight: 800; opacity: 0.75">{t}</span><strong style="{TIT}; font-size: 26px; font-stretch: 100%; white-space: nowrap">{v}</strong><span style="font-size: 12px; opacity: 0.75">{sub}</span></div>'
def pcard(cod, k, items, total, chip_html, on=False, href='FE-Pedido.dc.html'):
    return f'<a href="{href}" style="padding: 12px; border-radius: 16px; background: #FFFFFF; border: {"2px solid "+AZUL if on else "1px solid "+BORDE}; box-shadow: {ELEV1}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 8px"><span style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px"><strong style="font-size: 14px; white-space: nowrap">{cod}</strong>{chip_html}</span><span style="display: flex; gap: 8px; align-items: center">{avatar(k,28)}<span style="font-size: 13px">{nombre(k)}</span></span><span style="display: flex; flex-direction: column; font-size: 12px; color: {SUAVE}"><span>{items}</span><strong style="color: {TINTA}; font-size: 14px; white-space: nowrap">{total}</strong></span></a>'
def columna(t, n, color, cards):
    return f'<section style="min-width: 0; padding: 12px; border-radius: 20px; background: #EEF0F4; display: flex; flex-direction: column; gap: 10px"><div style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 800"><span style="width: 10px; height: 10px; border-radius: 50%; background: {color}"></span>{t}</span><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{n}</span></div>{cards}</section>'

desk('FE-Inicio.dc.html','Hoy, martes 17','Inicio', f'''
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px">{kpi('PEDIDOS HOY','12','3 más que el martes pasado','#FFFFFF',TINTA,'lista')}{kpi('PARA CONFIRMAR','3','El más viejo, hace 9 min','#FFFFFF',TINTA,'reloj')}{kpi('LISTOS PARA RETIRAR','4','Hasta las 20','#FFFFFF',TINTA,'check')}{kpi('VENDIDO CON HANDYX · NOV','$ 1.284.000','Ejemplo · 96 pedidos',AZUL,'#FFFFFF','grafico')}</div>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)) 230px; gap: 14px; min-height: 0">
      {columna('Nuevos','3',AMARILLO, pcard('HX-4815','yo','5 ítems · retira hoy','$ 25.600',chip("Hace 2 min","reloj","amarillo"),True)+pcard('HX-4820','sofia','2 ítems · para la obra','$ 9.800',chip("Hace 9 min","reloj","amarillo")))}
      {columna('Preparando','2',AZUL, pcard('HX-4802','diego','2 ítems','$ 14.300',chip("Confirmado","check","tinte"))+pcard('HX-4809','pablo','7 ítems','$ 61.200',chip("1 reemplazo","flechas","tinte")))}
      {columna('Listos','4','#1E9E57', pcard('HX-4791','yo','3 ítems','$ 18.900',chip("Listo","check","exito"),href='FE-Retiro.dc.html')+pcard('HX-4797','sofia','4 ítems','$ 22.100',chip("Listo","check","exito"),href='FE-Retiro.dc.html'))}
      {columna('Retirados hoy','3','#9AA3B2', pcard('HX-4780','diego','1 ítem','$ 3.100',chip("15:20","check","gris"))+pcard('HX-4774','pablo','6 ítems','$ 47.800',chip("12:05","check","gris")))}
      <aside style="display: flex; flex-direction: column; gap: 12px">
        <div style="padding: 14px; border-radius: 20px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 8px">{etiqueta("A REVISAR")}<span style="display: flex; gap: 8px; font-size: 13px">{svg(IC['alerta'],'#A8261C',18)}Teflón 12 mm sin stock en 2 pedidos</span><span style="display: flex; gap: 8px; font-size: 13px">{svg(IC['reloj'],TINTA,18)}48 precios con más de 30 días</span></div>
        <a href="FE-Escanear.dc.html" style="padding: 16px; border-radius: 20px; background: {AMARILLO}; color: {TINTA}; text-decoration: none; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 0 #C9C85A">{svg(IC['qr'],TINTA,30)}<strong style="font-size: 16px">Escanear un QR</strong><span style="font-size: 12px">Cuando llega un profesional</span></a>
      </aside>
    </div>''')

def fila_t(prod, var, cant, stock, precio, sub, extra=''):
    st={'hay':chip("Hay","check","exito"),'no':chip("No hay","alerta","error"),'poco':chip("Quedan 2","alerta","amarillo")}[stock]
    return f'<tr style="border-top: 1px solid {BORDE}"><td style="padding: 12px 8px"><span style="display: flex; gap: 10px; align-items: center">{mosaico_ic("caja",38,radio=12,iconsize=18)}<span style="display: flex; flex-direction: column"><strong style="font-size: 14px">{prod}</strong><span style="font-size: 12px; color: {SUAVE}">{var}</span>{extra}</span></span></td><td style="padding: 12px 8px; font-weight: 800; text-align: center">{cant}</td><td style="padding: 12px 8px">{st}</td><td style="padding: 12px 8px"><span style="display: inline-flex; min-height: 38px; align-items: center; padding: 0 10px; border-radius: 10px; border: 1px solid {BORDE}; background: #FFFFFF; font-weight: 800">{precio}</span></td><td style="padding: 12px 8px; text-align: right; font-weight: 800">{sub}</td></tr>'
reemplazo=f'<span style="margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800; color: {AZUL}">{svg(IC["flechas"],AZUL,14)}Ofrecer 19 mm a $ 2.700</span>'
desk('FE-Pedido.dc.html','Pedido HX-4815','Pedidos', f'''
    <div style="display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 18px; min-height: 0">
      <section style="padding: 18px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 12px; min-width: 0">
        <div style="display: flex; gap: 12px; align-items: center">{avatar('yo',48)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 17px">Julián Ortiz</strong><span style="display: flex; gap: 6px">{chip("Verificado por Handyx","escudo","exito")}{chip("Plomería","herramienta","gris")}</span></span>{chip("Retira hoy antes de las 20","reloj","amarillo")}</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px"><thead><tr style="text-align: left; font-size: 11px; letter-spacing: 1px; color: {SUAVE}"><th style="padding: 8px">PRODUCTO</th><th style="padding: 8px; text-align: center">CANT.</th><th style="padding: 8px">STOCK</th><th style="padding: 8px">PRECIO UNIT.</th><th style="padding: 8px; text-align: right">SUBTOTAL</th></tr></thead><tbody>
          {fila_t('Cartucho cerámico','35 mm','1','hay','$ 9.800','$ 9.800')}{fila_t('Flexible','40 cm','2','hay','$ 1.600','$ 3.200')}{fila_t('Teflón','12 mm','3','no','$ 2.300','—',reemplazo)}{fila_t('Tarugo de nylon','8 mm · caja de 50','1','poco','$ 4.200','$ 4.200')}{fila_t('Pastina','gris · 1 kg','2','hay','$ 750','$ 1.500')}
        </tbody></table>
      </section>
      <aside style="display: flex; flex-direction: column; gap: 14px">
        <div style="padding: 18px; border-radius: 24px; background: {NOCHE}; color: #FFFFFF; display: flex; flex-direction: column; gap: 8px">{etiqueta("TOTAL CON EL REEMPLAZO","#AFC0DD")}<strong style="{TIT}; font-size: 34px">$ 26.800</strong><span style="font-size: 12px; color: #C9D5EA">Lo paga en el mostrador. Handyx no cobra nada de esta venta.</span></div>
        <div style="padding: 16px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 10px">{etiqueta("ESTADO")}{''.join(f'<span style="display: flex; gap: 10px; align-items: center; font-size: 13px"><span style="width: 22px; height: 22px; border-radius: 50%; background: {c}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",12,3) if c==AZUL else ""}</span>{t}</span>' for c,t in [(AZUL,'Recibido 17:44'),(AMARILLO,'Confirmar precios y stock'),(MOSAICO,'Preparar'),(MOSAICO,'Listo para retirar'),(MOSAICO,'Retirado')])}</div>
        <a href="FE-Inicio.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 54px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 {HONDO}">Confirmar y avisar a Julián</a>
        <span style="min-height: 48px; border-radius: 16px; border: 2px solid {AZUL}; color: {AZUL}; display: flex; align-items: center; justify-content: center; font-weight: 800">Mandar un mensaje</span>
      </aside>
    </div>''')

desk('FE-Escanear.dc.html','Escanear','Escanear', f'''
    <div style="display: grid; grid-template-columns: minmax(0,1fr) 420px; gap: 18px; min-height: 0; flex: 1">
      <section style="position: relative; border-radius: 28px; background: {NOCHE}; overflow: hidden; min-height: 560px">
        <div style="position: absolute; left: 50%; top: 50%; width: 280px; height: 280px; margin: -140px 0 0 -140px; border-radius: 28px; box-shadow: 0 0 0 999px rgba(11,20,36,0.55)"></div>
        {''.join(f'<span style="position: absolute; {v}: calc(50% - 150px); {h}: calc(50% - 150px); width: 46px; height: 46px; border-{v}: 6px solid {AMARILLO}; border-{h}: 6px solid {AMARILLO}; border-{v}-{h}-radius: 24px"></span>' for v in ['top','bottom'] for h in ['left','right'])}
        <div style="position: absolute; left: 50%; top: 50%; margin: -120px 0 0 -120px; opacity: 0.85">{qr(240).replace('fill="'+TINTA+'"','fill="#FFFFFF"')}</div>
        <span style="position: absolute; left: 0; right: 0; bottom: 26px; text-align: center; color: #FFFFFF; font-weight: 800">Apuntá la cámara al QR del profesional</span>
      </section>
      <aside style="display: flex; flex-direction: column; gap: 14px">
        <div style="padding: 18px; border-radius: 24px; background: #FFFFFF; border: 2px solid #1E9E57; display: flex; flex-direction: column; gap: 10px">{chip("Pedido encontrado","check","exito")}<strong style="{TIT}; font-size: 26px">HX-4815</strong><span style="display: flex; gap: 8px; align-items: center">{avatar('yo',30)}Julián Ortiz · 5 ítems · $ 26.800</span>{''.join(f'<span style="display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-top: 1px solid {BORDE}"><span>{n} × {t}</span>{chip(e,"check","exito") if e=="Preparado" else chip(e,"reloj","amarillo")}</span>' for n,t,e in [(1,'Cartucho cerámico 35 mm','Preparado'),(2,'Flexible 40 cm','Preparado'),(3,'Teflón 19 mm','Preparado'),(1,'Tarugo 8 mm','Falta'),(2,'Pastina gris','Preparado')])}</div>
        <a href="FE-Retiro.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 54px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 {HONDO}">Abrir la entrega</a>
        <span style="min-height: 48px; border-radius: 16px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; align-items: center; gap: 8px; padding: 0 14px; color: {SUAVE}">{svg(IC['documento'],SUAVE,18)}O escribí el código: HX-____</span>
      </aside>
    </div>''')

def entrega(n, t, ok):
    return f'<div style="display: flex; gap: 14px; align-items: center; padding: 14px 0; border-top: 1px solid {BORDE}"><span style="width: 34px; height: 34px; border-radius: 10px; {"background: "+AZUL if ok else "border: 2px solid #C9CFDA"}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",20,3) if ok else ""}</span><strong style="{TIT}; font-size: 22px; min-width: 30px; color: {AZUL}">{n}</strong><span style="flex: 1; font-size: 16px; font-weight: 700">{t}</span>{chip("Entregado","check","exito") if ok else chip("Por entregar","reloj","amarillo")}</div>'
desk('FE-Retiro.dc.html','Entrega HX-4815','Entregas', f'''
    <div style="display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: 18px">
      <section style="padding: 18px 22px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}">{etiqueta("TILDÁ LO QUE ENTREGÁS")}{entrega(1,'Cartucho cerámico 35 mm',True)}{entrega(2,'Flexible 40 cm',True)}{entrega(3,'Teflón 19 mm (reemplazo aceptado)',True)}{entrega(1,'Tarugo de nylon 8 mm',False)}{entrega(2,'Pastina gris 1 kg',True)}</section>
      <aside style="display: flex; flex-direction: column; gap: 14px">
        <div style="padding: 18px; border-radius: 24px; background: {NOCHE}; color: #FFFFFF; display: flex; flex-direction: column; gap: 8px">{etiqueta("A COBRAR EN EL MOSTRADOR","#AFC0DD")}<strong style="{TIT}; font-size: 34px">$ 26.800</strong><div style="display: flex; gap: 6px; flex-wrap: wrap">{chip("Efectivo",tono="blanco")}{chip("Débito",tono="gris")}{chip("Mercado Pago",tono="gris")}</div></div>
        <div style="padding: 16px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: {SUAVE}">{etiqueta("AL MARCAR RETIRADO")}<span>· A Julián le llega el ticket y queda como gasto en su app.</span><span>· El stock se descuenta de tu catálogo.</span></div>
        <a href="FE-Inicio.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 54px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; font-weight: 900; text-decoration: none; box-shadow: 0 4px 0 {HONDO}">Marcar retirado</a>
      </aside>
    </div>''')

def prod(t, var, cat, precio, stock, fecha, vis, viejo=False):
    return f'<tr style="border-top: 1px solid {BORDE}"><td style="padding: 10px 8px"><strong>{t}</strong><span style="display: block; font-size: 12px; color: {SUAVE}">{var}</span></td><td style="padding: 10px 8px">{chip(cat,tono="gris")}</td><td style="padding: 10px 8px; font-weight: 800">{precio}</td><td style="padding: 10px 8px">{stock}</td><td style="padding: 10px 8px">{chip(fecha,"alerta","amarillo") if viejo else "<span style=\"font-size: 13px; color: "+SUAVE+"\">"+fecha+"</span>"}</td><td style="padding: 10px 8px"><span role="switch" aria-checked="{str(vis).lower()}" aria-label="Mostrar {t} en Handyx" style="display: inline-block; width: 48px; height: 44px; background-clip: content-box; padding: 9px 0; box-sizing: border-box; border-radius: 22px; border-radius: 13px; background: {AZUL if vis else "#C9CFDA"}; position: relative"><span style="position: absolute; top: 3px; {"right" if vis else "left"}: 3px; width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF"></span></span></td></tr>'
cats=''.join(f'<span style="display: flex; justify-content: space-between; min-height: 40px; align-items: center; padding: 0 12px; border-radius: 12px; {"background: "+TINTE+"; color: "+HONDO+"; font-weight: 800" if i==0 else ""}; font-size: 14px">{t}<span style="font-size: 12px; color: {SUAVE}">{n}</span></span>' for i,(t,n) in enumerate([('Plomería',356),('Fijaciones',412),('Electricidad',298),('Gas',121),('Pintura',184),('Albañilería',210),('Herramientas',267),('Seguridad',96)]))
desk('FE-Catalogo.dc.html','Catálogo y precios','Catálogo y precios', f'''
    <div style="display: flex; gap: 10px; align-items: center"><span style="display: flex; gap: 8px; align-items: center; padding: 10px 14px; border-radius: 14px; background: {AMARILLO}; font-size: 13px; font-weight: 800">{svg(IC['alerta'],TINTA,18)}48 precios con más de 30 días: los profesionales los ven marcados</span><span style="margin-left: auto; min-height: 44px; padding: 0 14px; border-radius: 14px; border: 2px solid {AZUL}; color: {AZUL}; display: flex; align-items: center; gap: 6px; font-weight: 800">{svg(IC['flechas'],AZUL,18)}Subir precios en %</span><a href="FE-Importar.dc.html" style="min-height: 44px; padding: 0 16px; border-radius: 14px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; gap: 6px; font-weight: 800; text-decoration: none; box-shadow: 0 3px 0 {HONDO}">{svg(IC['subir'],'#FFFFFF',18)}Importar lista</a></div>
    <div style="display: grid; grid-template-columns: 220px minmax(0,1fr); gap: 18px; min-height: 0">
      <aside style="padding: 12px; border-radius: 20px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 2px">{etiqueta("CATEGORÍAS · 1.944")}{cats}</aside>
      <section style="padding: 8px 16px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; overflow: hidden"><table style="width: 100%; border-collapse: collapse; font-size: 14px"><thead><tr style="text-align: left; font-size: 11px; letter-spacing: 1px; color: {SUAVE}"><th style="padding: 10px 8px">PRODUCTO</th><th style="padding: 10px 8px">CATEGORÍA</th><th style="padding: 10px 8px">PRECIO</th><th style="padding: 10px 8px">STOCK</th><th style="padding: 10px 8px">ACTUALIZADO</th><th style="padding: 10px 8px">EN HANDYX</th></tr></thead><tbody>
        {prod('Cartucho cerámico','35 mm','Plomería','$ 9.800','24','05/11',True)}{prod('Flexible mallado','40 cm','Plomería','$ 1.600','80','05/11',True)}{prod('Llave de paso','1/2" · esférica','Plomería','$ 7.400','12','28/10',True)}{prod('Teflón','12 mm','Plomería','$ 2.300','0','05/11',True)}{prod('Sellador de roscas','50 ml','Plomería','$ 3.100','9','02/10',True,True)}{prod('Termofusión','20 mm · tira de 4 m','Plomería','$ 5.900','40','28/10',False)}
      </tbody></table></section>
    </div>''')

def paso_imp(n, t, est):
    s={'ok':(AZUL,'#FFFFFF','✓'),'ahora':(AMARILLO,TINTA,str(n)),'luego':(MOSAICO,SUAVE,str(n))}[est]
    return f'<span style="display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 14px; color: {TINTA if est!="luego" else SUAVE}"><span style="width: 32px; height: 32px; border-radius: 50%; background: {s[0]}; color: {s[1]}; display: flex; align-items: center; justify-content: center">{s[2]}</span>{t}</span>'
def fil(i,a,b,c,est):
    e={'ok':chip("OK","check","exito"),'sube':chip("Sube 8 %","flechas","amarillo"),'nuevo':chip("Nuevo",tono="tinte"),'err':chip("Precio ilegible","alerta","error")}[est]
    return f'<tr style="border-top: 1px solid {BORDE}"><td style="padding: 10px 8px; color: {SUAVE}">{i}</td><td style="padding: 10px 8px; font-weight: 700">{a}</td><td style="padding: 10px 8px">{b}</td><td style="padding: 10px 8px; font-weight: 800">{c}</td><td style="padding: 10px 8px">{e}</td></tr>'
desk('FE-Importar.dc.html','Importar tu lista de precios','Importar lista', f'''
    <div style="display: flex; gap: 22px; align-items: center; padding: 14px 18px; border-radius: 20px; background: #FFFFFF; border: 1px solid {BORDE}">{paso_imp(1,'Subir el archivo','ok')}<span style="flex: 1; height: 2px; background: {AZUL}"></span>{paso_imp(2,'Elegir columnas','ok')}<span style="flex: 1; height: 2px; background: {AZUL}"></span>{paso_imp(3,'Revisar','ahora')}<span style="flex: 1; height: 2px; background: {MOSAICO}"></span>{paso_imp(4,'Publicar','luego')}</div>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px">{kpi('PRODUCTOS LEÍDOS','1.204','lista-noviembre.xlsx','#FFFFFF',TINTA,'documento')}{kpi('SUBEN DE PRECIO','86','Promedio + 6 %','#FFFFFF',TINTA,'flechas')}{kpi('NUEVOS','31','Se suman al catálogo','#FFFFFF',TINTA,'mas')}{kpi('PARA CORREGIR','12','No se publican hasta revisarlos',AZUL,'#FFFFFF','alerta')}</div>
    <section style="padding: 8px 16px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}"><table style="width: 100%; border-collapse: collapse; font-size: 14px"><thead><tr style="text-align: left; font-size: 11px; letter-spacing: 1px; color: {SUAVE}"><th style="padding: 10px 8px">FILA</th><th style="padding: 10px 8px">PRODUCTO</th><th style="padding: 10px 8px">CATEGORÍA</th><th style="padding: 10px 8px">PRECIO</th><th style="padding: 10px 8px">RESULTADO</th></tr></thead><tbody>{fil(12,'Cartucho cerámico 35 mm','Plomería','$ 9.800','sube')}{fil(13,'Flexible mallado 40 cm','Plomería','$ 1.600','ok')}{fil(14,'Codo termofusión 20 mm','Plomería','$ 1?0','err')}{fil(15,'Tarugo nylon 10 mm × 50','Fijaciones','$ 5.100','nuevo')}{fil(16,'Cinta aisladora 20 m','Electricidad','$ 1.900','ok')}</tbody></table></section>
    <div style="display: flex; justify-content: flex-end; gap: 10px"><span style="min-height: 50px; padding: 0 18px; border-radius: 16px; border: 2px solid {AZUL}; color: {AZUL}; display: flex; align-items: center; font-weight: 800">Ver los 12 para corregir</span><span style="min-height: 50px; padding: 0 22px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; font-weight: 900; box-shadow: 0 4px 0 {HONDO}">Publicar 1.192 precios</span></div>''')

barras=''.join(f'<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px"><span style="width: 100%; height: {h}px; border-radius: 10px 10px 4px 4px; background: {AZUL if i==5 else "#C9D6EC"}"></span><span style="font-size: 12px; color: {SUAVE}">{d}</span></span>' for i,(d,h) in enumerate([('Sem 1',90),('Sem 2',120),('Sem 3',110),('Sem 4',150),('Sem 5',170),('Esta',196)]))
def top(n, t, v):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid {BORDE}"><strong style="{TIT}; font-size: 18px; color: {AZUL}; min-width: 24px">{n}</strong><span style="flex: 1; font-size: 14px; font-weight: 700">{t}</span><span style="font-size: 13px; color: {SUAVE}">{v}</span></div>'
desk('FE-Metricas.dc.html','Lo que te trae Handyx','Métricas', f'''
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px">{kpi('PEDIDOS DEL MES','96','+ 18 % que octubre',AZUL,'#FFFFFF','lista')}{kpi('VENDIDO','$ 1.284.000','Ejemplo','#FFFFFF',TINTA,'billete')}{kpi('PROFESIONALES','34','Verificados por Handyx','#FFFFFF',TINTA,'usuario2')}{kpi('CONFIRMÁS EN','6 min','Promedio de hoy','#FFFFFF',TINTA,'reloj')}</div>
    <div style="display: grid; grid-template-columns: minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr); gap: 14px">
      <section style="padding: 18px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; display: flex; flex-direction: column; gap: 14px">{etiqueta("PEDIDOS POR SEMANA")}<div role="img" aria-label="Pedidos por semana, en aumento" style="display: flex; align-items: flex-end; gap: 12px; height: 220px">{barras}</div></section>
      <section style="padding: 18px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}">{etiqueta("LO MÁS PEDIDO")}{top(1,'Cartucho cerámico 35 mm','41 u.')}{top(2,'Flexible mallado 40 cm','38 u.')}{top(3,'Tarugo de nylon 8 mm','27 cajas')}{top(4,'Cinta aisladora','22 u.')}</section>
      <section style="padding: 18px; border-radius: 24px; background: {NOCHE}; color: #FFFFFF; display: flex; flex-direction: column; gap: 10px">{etiqueta("TE CONVIENE","#AFC0DD")}<span style="font-size: 15px">Tené stock de <strong>teflón 12 mm</strong>: 6 pedidos esta semana lo reemplazaron.</span><span style="font-size: 15px">Actualizá <strong>48 precios</strong>: los pedidos con precios viejos tardan más en confirmarse.</span></section>
    </div>''')

# Alta de la ferretería (para el pitch y el onboarding).
def paso_alta(n, t, est):
    return paso_imp(n,t,est)
desk('FE-Alta.dc.html','Sumá tu ferretería','Inicio', f'''
    <div style="display: grid; grid-template-columns: minmax(0,1fr) 380px; gap: 18px">
      <section style="padding: 22px; border-radius: 24px; background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; gap: 18px; flex-wrap: wrap">{paso_alta(1,'Datos y CUIT','ok')}{paso_alta(2,'Dirección y horarios','ahora')}{paso_alta(3,'Cómo entregás','luego')}{paso_alta(4,'Tu lista de precios','luego')}{paso_alta(5,'Tu equipo','luego')}</div>
        <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 12px">{''.join(f'<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 12px; font-weight: 800; color: {SUAVE}">{e}</span><span style="min-height: 48px; border-radius: 14px; border: {"2px solid "+AZUL if i==0 else "1px solid "+BORDE}; display: flex; align-items: center; padding: 0 14px; font-weight: 700">{v}</span></div>' for i,(e,v) in enumerate([('Dirección','Calle De Prueba 450, Centro'),('Teléfono del local','223 555-0000'),('Lunes a viernes','8:00 a 20:00'),('Sábados','8:30 a 13:00')]))}</div>
        <div style="height: 200px; border-radius: 20px; background: #F3F4F7; position: relative; overflow: hidden">{''.join(f'<span style="position: absolute; left: {c*72-20}px; top: {f*62-10}px; width: 60px; height: 50px; border-radius: 10px; background: #E7E9EE"></span>' for f in range(4) for c in range(12))}<span style="position: absolute; left: 50%; top: 50%; margin: -24px 0 0 -24px; width: 48px; height: 48px; border-radius: 14px; background: {AZUL}; display: flex; align-items: center; justify-content: center; box-shadow: {ELEV2}">{svg(IC['tienda'],'#FFFFFF',24)}</span></div>
        <div style="display: flex; justify-content: flex-end"><span style="min-height: 50px; padding: 0 26px; border-radius: 16px; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; font-weight: 900; box-shadow: 0 4px 0 {HONDO}">Seguir</span></div>
      </section>
      <aside style="padding: 22px; border-radius: 24px; background: {AZUL}; color: #FFFFFF; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 5px 0 {HONDO}">
        {etiqueta("POR QUÉ HANDYX","#CFE0FA")}<strong style="{TIT}; font-size: 28px; line-height: 1.05">Pedidos listos de profesionales verificados</strong>
        {''.join(f'<span style="display: flex; gap: 10px; align-items: flex-start; font-size: 14px">{svg(IC[i],AMARILLO,22)}{t}</span>' for i,t in [('lista','Te llegan con cantidades y medidas: nada de dictados confusos.'),('qr','Entregás escaneando un QR; el ticket le llega al profesional.'),('tornillo','Tu catálogo se ve en la app de los profesionales de tu zona.'),('billete','Cobrás vos en el mostrador; Handyx no se queda con nada de la venta.')])}
        <span style="margin-top: auto; font-size: 12px; color: #F0F5FD">Condiciones comerciales a definir con cada ferretería aliada.</span>
      </aside>
    </div>''')

# App del ferretero en el teléfono: escanear y preparar.
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: {NOCHE}"></div>
  <div style="position: absolute; left: 50%; top: 190px; width: 260px; height: 260px; margin-left: -130px; border-radius: 28px; box-shadow: 0 0 0 999px rgba(11,20,36,0.6)"></div>
  {''.join(f'<span style="position: absolute; {v}: {190-8 if v=="top" else 844-190-260-8}px; {h}: {65-8}px; width: 44px; height: 44px; border-{v}: 6px solid {AMARILLO}; border-{h}: 6px solid {AMARILLO}; border-{v}-{h}-radius: 22px"></span>' for v in ['top','bottom'] for h in ['left','right'])}
  <div style="position: absolute; left: 50%; top: 210px; margin-left: -110px; opacity: 0.85">{qr(220).replace('fill="'+TINTA+'"','fill="#FFFFFF"')}</div>
  <header style="position: absolute; top: 18px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center; color: #FFFFFF"><span style="display: flex; flex-direction: column"><span style="{TIT}; font-size: 22px">Handyx</span><span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: {AMARILLO}">FERRETERÍAS</span></span>{chip("Escaneando","qr","blanco")}</header>
''' + hoja(f'''
    {chip("Pedido encontrado","check","exito")}
    <div style="display: flex; gap: 12px; align-items: center">{avatar('yo',46)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 17px">HX-4815 · Julián Ortiz</strong><span style="font-size: 13px; color: {SUAVE}">5 ítems · $ 26.800 · verificado</span></span></div>
    {boton("Entregar y marcar retirado","FE-Movil.dc.html",alto=54)}''', 560)
guardar('FE-MovilEscanear.dc.html','Ferretero · Escanear en el teléfono',cuerpo)

def prep(n, t, ok):
    return f'<div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}"><span style="width: 34px; height: 34px; border-radius: 10px; {"background: "+AZUL if ok else "border: 2px solid #C9CFDA"}; display: flex; align-items: center; justify-content: center">{svg(IC["check"],"#FFFFFF",20,3) if ok else ""}</span><strong style="{TIT}; font-size: 20px; min-width: 26px; color: {AZUL}">{n}</strong><span style="flex: 1; font-size: 15px; font-weight: 700">{t}</span></div>'
cuerpo = f'''  <header style="position: absolute; top: 0; left: 0; right: 0; padding: 18px 16px; background: {NOCHE}; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center"><span style="display: flex; flex-direction: column"><span style="{TIT}; font-size: 22px">HX-4815</span><span style="font-size: 12px; color: #AFC0DD">Julián Ortiz · retira hoy</span></span>{chip("Preparando","reloj","amarillo")}</header>
''' + contenido(f'''
    {tarjeta(etiqueta("ARMÁ EL PEDIDO")+prep(1,'Cartucho cerámico 35 mm',True)+prep(2,'Flexible 40 cm',True)+prep(3,'Teflón 19 mm · reemplazo aceptado',True)+prep(1,'Tarugo nylon 8 mm × 50',False)+prep(2,'Pastina gris 1 kg',False))}
    <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 14px; border-radius: 18px; background: {TINTE}"><span style="font-weight: 800; color: {HONDO}">A cobrar en el mostrador</span><strong style="{TIT}; font-size: 24px">$ 26.800</strong></div>''', top=92) + '\n' + accion_fija('Listo para retirar · avisar a Julián','FE-MovilEscanear.dc.html')
guardar('FE-Movil.dc.html','Ferretero · Preparar en el teléfono',cuerpo)
print('ok')
