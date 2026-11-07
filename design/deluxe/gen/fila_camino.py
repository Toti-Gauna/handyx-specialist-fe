import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({
 'remera':'<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z"></path>',
 'libro':'<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4Z"></path><path d="M20 4h-5a3 3 0 0 0-3 3"></path><path d="M20 4v14h-6"></path>',
 'martillo':'<path d="M14 4l6 6-3 3-6-6 3-3Z"></path><path d="M11 7L3 15l3 3 8-8"></path>',
 'tornillo':'<path d="M9 3h6l-1 4h-4L9 3Z"></path><path d="M12 7v13M9.5 10l5 1.5M9.5 13l5 1.5M9.5 16l5 1.5"></path>',
 'mapa2':'<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"></path><path d="M9 3v15M15 6v15"></path>',
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
})
def remera(tam=150, color=AZUL):
    return f'''<svg aria-hidden="true" width="{tam}" height="{tam}" viewBox="0 0 120 120"><path d="M40 14 L18 26 L26 46 L36 42 L36 106 L84 106 L84 42 L94 46 L102 26 L80 14 Q60 30 40 14 Z" fill="{color}" stroke="{HONDO}" stroke-width="2" stroke-linejoin="round"></path><path d="M44 14 Q60 26 76 14" fill="none" stroke="{AMARILLO}" stroke-width="4"></path><text x="60" y="70" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF">Handyx</text></svg>'''
def manual(tam=110):
    return f'''<svg aria-hidden="true" width="{tam}" height="{tam}" viewBox="0 0 100 100"><rect x="18" y="10" width="64" height="82" rx="6" fill="{AMARILLO}" stroke="#C9C85A" stroke-width="2"></rect><rect x="18" y="10" width="10" height="82" rx="3" fill="#E3DF75"></rect><text x="55" y="40" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="11" fill="{TINTA}">MANUAL</text><text x="55" y="54" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="11" fill="{AZUL}">Handyx</text><rect x="38" y="64" width="34" height="4" rx="2" fill="{TINTA}" opacity="0.3"></rect><rect x="38" y="72" width="26" height="4" rx="2" fill="{TINTA}" opacity="0.3"></rect></svg>'''

def mini(ic, t, sub, pct, premio, fondo='#FFFFFF', color=TINTA, href='G-MiniCamino.dc.html'):
    barra=f'<span style="display: block; height: 8px; border-radius: 4px; background: {"rgba(255,255,255,0.25)" if fondo!="#FFFFFF" else MOSAICO}"><span style="display: block; width: {pct}%; height: 8px; border-radius: 4px; background: {AMARILLO if fondo!="#FFFFFF" else AZUL}"></span></span>'
    b=f'border: 1px solid {BORDE}; box-shadow: {ELEV1};' if fondo=='#FFFFFF' else f'box-shadow: 0 4px 0 {HONDO};'
    return f'<a href="{href}" style="flex: none; width: 230px; padding: 14px; border-radius: 22px; background: {fondo}; color: {color}; {b} text-decoration: none; display: flex; flex-direction: column; gap: 8px"><span style="display: flex; justify-content: space-between; align-items: center">{svg(IC[ic],AMARILLO if fondo!="#FFFFFF" else AZUL,24)}<span style="font-size: 11px; font-weight: 800; opacity: 0.8">{pct} %</span></span><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; opacity: 0.8">{sub}</span>{barra}<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 800">{svg(IC["regalo"],AMARILLO if fondo!="#FFFFFF" else AZUL,16)}{premio}</span></a>'

# Hub del Camino
cuerpo = f'''  <section style="position: absolute; top: 0; left: 0; right: 0; padding: 22px 20px 22px; background: {AZUL}; border-radius: 0 0 34px 34px; color: #FFFFFF; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 12px 30px -16px rgba(14,29,54,0.55)">
    <div style="display: flex; justify-content: space-between; align-items: center">{etiqueta("CAMINO HANDYX","#CFE0FA")}<a href="G-Vitrina.dc.html" style="display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 12px; border-radius: 14px; background: rgba(255,255,255,0.18); color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none">{svg(IC['medalla'],'#FFFFFF',18)}Vitrina · 3</a></div>
    <div style="display: flex; gap: 14px; align-items: center"><span style="width: 92px; height: 92px; flex: none; border-radius: 50%; background: conic-gradient({AMARILLO} 0 80%, rgba(255,255,255,0.2) 80% 100%); display: flex; align-items: center; justify-content: center"><span style="width: 74px; height: 74px; border-radius: 50%; background: {AZUL}; display: flex; flex-direction: column; align-items: center; justify-content: center"><strong style="{TIT}; font-size: 24px; line-height: 1">8/10</strong><span style="font-size: 11px; color: #F0F5FD">trabajos</span></span></span><span style="display: flex; flex-direction: column; gap: 4px"><strong style="{TIT}; font-size: 24px; line-height: 1.05">Te faltan 2 para la Gorra Handyx</strong><span style="font-size: 13px; color: #F0F5FD">Solo cuentan trabajos verificados. Nada se resta.</span></span></div>
  </section>
''' + contenido(f'''
    <a href="G-Bienvenida.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 20px; background: #E3F4EA; color: {TINTA}; text-decoration: none"><span style="width: 52px; height: 52px; flex: none; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center">{remera(44)}</span><span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">Kit de bienvenida</strong><span style="font-size: 12px; color: {SUAVE}">Remera y manual · entregado el 12/11</span></span>{chip("Listo","check","exito")}</a>
    <div style="display: flex; justify-content: space-between; align-items: baseline"><strong style="font-size: 16px">Tus mini caminos</strong><a href="G-Camino.dc.html" style="display: inline-flex; align-items: center; min-height: 44px; font-size: 13px; font-weight: 800; text-decoration: none">Ver el camino</a></div>
    <div style="display: flex; gap: 10px; margin: 0 -16px; padding: 0 16px 6px; overflow: hidden">{mini('check','Trabajos verificados','8 de 10',80,'Gorra Handyx',AZUL,'#FFFFFF','G-Camino.dc.html')}{mini('billete','Cobros verificados','$ 200.000 de $ 250.000',80,'Set de destornilladores')}{mini('gota','Tu oficio: Plomería','3 de 5 trabajos',60,'Kit de cartuchos')}</div>
    <a href="G-Areas.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 20px; border: 2px dashed {BORDE}; color: {SUAVE}; text-decoration: none">{svg(IC['mapa2'],SUAVE,24)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 14px; color: {TINTA}">Áreas del camino</strong><span style="font-size: 12px">Próximamente</span></span>{svg(IC['candado'],SUAVE,18)}</a>''', top=232) + '\n' + barra_vidrio('Cuenta')
guardar('G-Inicio.dc.html','G · Tu camino (inicio)',cuerpo)

# Kit de bienvenida: remera + manual
def op(t, on=False):
    s=f'background: {AZUL}; color: #FFFFFF; box-shadow: 0 3px 0 {HONDO}' if on else f'background: {MOSAICO}; color: {TEXTO}'
    return f'<span style="min-width: 48px; min-height: 46px; padding: 0 12px; border-radius: 14px; {s}; font-weight: 800; font-size: 14px; display: inline-flex; align-items: center; justify-content: center">{t}</span>'
cuerpo = barra_compacta('Kit de bienvenida','G-Inicio.dc.html',sub='Estación 0 del camino') + contenido(f'''
    <div style="position: relative; height: 190px; border-radius: 28px; background: {TINTE}; display: flex; align-items: center; justify-content: center; gap: 8px; overflow: hidden">
      {''.join(f'<span aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: 9px; height: 14px; border-radius: 2px; background: {c}; transform: rotate({r}deg)"></span>' for x,y,c,r in [(30,30,AMARILLO,20),(320,40,AZUL,-15),(60,160,AZUL,40),(300,150,AMARILLO,-30)])}
      {remera(160)}{manual(120)}
    </div>
    <div style="display: flex; flex-direction: column; gap: 4px">{etiqueta("TE LO DAMOS AL QUEDAR VERIFICADO", AZUL)}<strong style="{TIT}; font-size: 26px; line-height: 1.05">Tu remera y el {marcador("manual")} de la app</strong><span style="font-size: 14px; color: {SUAVE}">La remera para que el cliente te reconozca; el manual, impreso y en la app, para sacarle todo el jugo.</span></div>
    <div style="display: flex; flex-direction: column; gap: 6px"><strong style="font-size: 15px">Talle de la remera</strong><div style="display: flex; gap: 8px; flex-wrap: wrap">{op('S')}{op('M')}{op('L',True)}{op('XL')}{op('XXL')}</div></div>
    {tarjeta(fila_ic('pin','Retiro en un punto Handyx','Centro · de lunes a viernes',derecha=chip("Elegido","check","exito"),borde=False)+fila_ic('libro','Manual en la app','6 capítulos cortos · leelo cuando quieras',href='G-Manual.dc.html'))}''') + '\n' + accion_fija('Confirmar talle L','G-Inicio.dc.html')
guardar('G-Bienvenida.dc.html','G · Kit de bienvenida',cuerpo)

# Manual de uso
def cap(n, t, sub, est):
    e={'ok':chip("Leído","check","exito"),'ahora':chip("Seguí acá","libro","amarillo"),'luego':chip("4 min","reloj","gris")}[est]
    return f'<a href="G-Manual.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid {BORDE}; color: {TINTA}; text-decoration: none"><span style="width: 44px; height: 44px; flex: none; border-radius: 14px; background: {AZUL if est=="ok" else (AMARILLO if est=="ahora" else MOSAICO)}; color: {"#FFFFFF" if est=="ok" else TINTA}; display: flex; align-items: center; justify-content: center; {TIT}; font-size: 18px">{n}</span><span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 15px">{t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>{e}</a>'
cuerpo = barra_compacta('Manual de Handyx','G-Bienvenida.dc.html',sub='3 de 6 capítulos') + contenido(f'''
    <div style="display: flex; gap: 14px; align-items: center; padding: 14px; border-radius: 22px; background: {AMARILLO}">{manual(76)}<span style="display: flex; flex-direction: column; gap: 4px"><strong style="{TIT}; font-size: 20px; line-height: 1.05">Todo lo que hace Handyx, en 6 capítulos</strong><span style="font-size: 12px">Con videos cortos y los Handys. También viene impreso en el kit.</span></span></div>
    {tarjeta(cap(1,'Tu primer pedido','Disponible, avisos y zona aproximada','ok')+cap(2,'Cotizar y proponer fecha','Tu precio y el calendario','ok')+cap(3,'Modo trabajo','Tareas, fotos y herramientas','ok')+cap(4,'Cobrar y tus ingresos','Directo a vos · bruto y neto','ahora')+cap(5,'Obras y equipo','Varios días y otros profesionales','luego')+cap(6,'Tu taller y la ferretería','Herramientas y pedidos','luego'))}
    <span style="font-size: 12px; color: {SUAVE}">Leer el manual da una insignia; no cambia los pedidos que recibís.</span>''')
guardar('G-Manual.dc.html','G · Manual de uso',cuerpo)

# Camino como ruta con carteles y el Handy caminando
def cartel(x, y, n, t, sub, est, href='G-Camino.dc.html'):
    f={'ok':(AZUL,'#FFFFFF'),'prox':(AMARILLO,TINTA),'luego':('#FFFFFF',SUAVE)}[est]
    ic={'ok':'check','prox':'regalo','luego':'candado'}[est]
    lado = 'left' if x<195 else 'right'
    pos = f'left: {x+50}px' if x<195 else f'right: {390-x+46}px'
    return f'<a href="{href}" aria-label="Estación {n}: {t}" style="position: absolute; left: {x-34}px; top: {y-34}px; width: 68px; height: 68px; border-radius: 22px; background: {f[0]}; {"border: 2px solid "+BORDE+";" if est=="luego" else ""} box-shadow: {ELEV2}; display: flex; align-items: center; justify-content: center; transform: rotate(-4deg)">{svg(IC[ic],f[1],28,2.5)}</a><span style="position: absolute; {pos}; top: {y-22}px; width: 160px; display: flex; flex-direction: column; text-align: {lado}"><strong style="font-size: 14px">{n} · {t}</strong><span style="font-size: 12px; color: {SUAVE}">{sub}</span></span>'
camino = ('<svg aria-hidden="true" style="position: absolute; inset: 0" width="390" height="844"><path d="M110 690 C 210 660, 280 630, 270 580 S 120 520, 120 470 S 270 400, 270 350 S 140 270, 130 230" fill="none" stroke="#DDE1E8" stroke-width="34" stroke-linecap="round"></path><path d="M110 690 C 210 660, 280 630, 270 580 S 120 520, 120 470" fill="none" stroke="'+AZUL+'" stroke-width="34" stroke-linecap="round"></path><path d="M110 690 C 210 660, 280 630, 270 580 S 120 520, 120 470 S 270 400, 270 350 S 140 270, 130 230" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="12 12" stroke-linecap="round"></path></svg>'
  + cartel(110,690,0,'Bienvenida','Remera y manual','ok','G-Bienvenida.dc.html') + cartel(270,580,1,'Kit chico','1 trabajo','ok') + cartel(120,470,2,'Consumibles','5 trabajos','ok')
  + f'<img src="{BLOB["llave"]}" alt="" aria-hidden="true" style="position: absolute; left: 176px; top: 386px; width: 56px; height: 64px; object-fit: contain">'
  + cartel(270,350,3,'Gorra Handyx','Te faltan 2','prox','F-Regalo.dc.html') + cartel(130,230,4,'Herramienta','25 trabajos','luego'))
cuerpo = camino + f'''
  <section style="position: absolute; top: 24px; left: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px">
    <div style="display: flex; justify-content: space-between; align-items: center"><a href="G-Inicio.dc.html" aria-label="Volver" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid {BORDE}; display: flex; align-items: center; justify-content: center">{svg(IC['atras'],TINTA,20)}</a>{chip("Trabajos verificados","check","tinte")}</div>
    <h1 style="margin: 0; {TIT}; font-size: 32px; line-height: 1">El camino de los {marcador("trabajos")}</h1>
  </section>
''' + barra_vidrio('Cuenta')
guardar('G-Camino.dc.html','G · Camino de trabajos',cuerpo)

# Mini camino por cobros verificados
def hito(monto, premio, ic, est, sub=''):
    f={'ok':(AZUL,'#FFFFFF','check'),'prox':(AMARILLO,TINTA,'regalo'),'luego':(MOSAICO,SUAVE,'candado')}[est]
    return f'<div style="display: flex; gap: 14px; align-items: center"><span style="width: 56px; height: 56px; flex: none; border-radius: 18px; background: {f[0]}; box-shadow: {"0 4px 0 "+HONDO if est=="ok" else ("0 4px 0 #C9C85A" if est=="prox" else "none")}; display: flex; align-items: center; justify-content: center">{svg(IC[f[2]],f[1],26,2.5)}</span><span style="flex: 1; padding: 12px 14px; border-radius: 18px; background: {"#FFFFFF" if est!="prox" else "#FFFBD6"}; border: 1px solid {BORDE}; display: flex; gap: 10px; align-items: center">{svg(IC[ic],AZUL,24)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 15px">{premio}</strong><span style="font-size: 12px; color: {SUAVE}">{monto}{(" · "+sub) if sub else ""}</span></span></span></div>'
cuerpo = barra_compacta('Cobros verificados','G-Inicio.dc.html',sub='Mini camino') + contenido(f'''
    <div style="padding: 16px; border-radius: 24px; background: {NOCHE}; color: #FFFFFF; display: flex; flex-direction: column; gap: 8px">{etiqueta("VERIFICADO HASTA HOY","#AFC0DD")}<strong style="{TIT}; font-size: 34px">$ 200.000</strong>{barra_progreso(80,0,10,'rgba(255,255,255,0.2)').replace('background: '+AZUL,'background: '+AMARILLO)}<span style="font-size: 12px; color: #C9D5EA">Faltan $ 50.000 para el set de destornilladores. Lo informado sin verificar todavía no cuenta.</span></div>
    <div style="display: flex; flex-direction: column; gap: 10px; position: relative">
      {hito('$ 50.000','Caja de tornillos surtidos','tornillo','ok','ganado el 05/11')}
      {hito('$ 100.000','Martillo de carpintero','martillo','ok','ganado el 12/11')}
      {hito('$ 250.000','Set de destornilladores','herramienta','prox','te faltan $ 50.000')}
      {hito('$ 500.000','Caja de herramientas Handyx','caja','luego')}
      {hito('$ 1.000.000','Taladro inalámbrico','rayo','luego')}
    </div>
    <span style="font-size: 12px; color: {SUAVE}">Montos y premios en borrador: los define Handyx con Legal. Sin sorteos.</span>''')
guardar('G-MiniCamino.dc.html','G · Mini camino por cobros',cuerpo)

# Concepto de áreas (para más adelante)
def area(n, t, sub, color, txt, ic, est):
    return f'<div style="padding: 16px; border-radius: 24px; background: {color}; color: {txt}; display: flex; gap: 14px; align-items: center"><span style="{TIT}; font-size: 40px; line-height: 1">{n}</span><span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><strong style="font-size: 17px">{t}</strong><span style="font-size: 12px">{sub}</span></span>{svg(IC[ic] if est=="ok" else IC["candado"],txt,28)}</div>'
cuerpo = barra_compacta('Áreas del camino','G-Inicio.dc.html',sub='Concepto · para más adelante') + contenido(f'''
    <div style="display: flex; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 18px; background: {AMARILLO}">{svg(IC['alerta'],TINTA,20)}<span style="font-size: 13px; font-weight: 800">Concepto: no entra en esta versión.</span></div>
    <p style="margin: 0; font-size: 14px; color: {TEXTO}">El camino se divide en áreas, como los mundos de un juego. Cada área junta varios mini caminos y termina en un premio grande. Se pasa de área por trabajos y cobros verificados, nunca por aceptar más pedidos.</p>
    {area(1,'El taller','Trabajos, cobros y tu oficio · Gorra y herramientas',AZUL,'#FFFFFF','herramienta','ok')}
    {area(2,'La obra','Obras de varios días y en equipo · Campera Handyx',NOCHE,'#FFFFFF','obra','luego')}
    {area(3,'La ciudad','Más barrios y oficios · Herramienta premium',TINTE,HONDO,'mapa2','luego')}''')
guardar('G-Areas.dc.html','G · Áreas (concepto)',cuerpo)
print('ok')
