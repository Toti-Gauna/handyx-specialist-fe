import sys; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({
 'cubo':'<path d="M12 2l9 5v10l-9 5-9-5V7l9-5Z"></path><path d="M3 7l9 5 9-5M12 12v10"></path>',
 'plomada':'<path d="M12 2v10"></path><path d="M8 12h8l-4 9-4-9Z"></path>',
 'angulo':'<path d="M4 20h16M4 20L16 6"></path><path d="M9 20a6 6 0 0 0-1.5-4"></path>',
 'linterna':'<path d="M8 2h8l-1 6H9L8 2Z"></path><rect x="9" y="8" width="6" height="13" rx="2"></rect>',
 'lupa':'<circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path>',
 'conversor':'<path d="M4 7h13l-3-3M20 17H7l3 3"></path>',
 'deshacer':'<path d="M9 14L4 9l5-5"></path><path d="M4 9h11a5 5 0 0 1 0 10h-3"></path>',
 'documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>',
 'bombita':'<path d="M9 18h6M10 21h4"></path><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z"></path>',
})
def herr(ic, t, sub, href, fondo=MOSAICO, color=TINTA, nuevo=False):
    n=f'<span style="position: absolute; top: 10px; right: 10px">{chip("AR",tono="amarillo")}</span>' if nuevo else ''
    return f'<a href="{href}" style="position: relative; padding: 14px; border-radius: 22px; background: {fondo}; color: {color}; text-decoration: none; display: flex; flex-direction: column; gap: 6px; min-height: 112px; box-sizing: border-box; {"box-shadow: 0 4px 0 "+HONDO+";" if fondo==AZUL else ""}">{n}{svg(IC[ic],AMARILLO if fondo==AZUL else AZUL,28)}<strong style="font-size: 14px; line-height: 1.15">{t}</strong><span style="font-size: 11px; opacity: 0.8">{sub}</span></a>'
caja3d=f'''<div aria-hidden="true" style="position: relative; height: 150px; border-radius: 26px; background: {AZUL}; overflow: hidden; perspective: 600px">
      <div style="position: absolute; left: 50%; bottom: 18px; margin-left: -100px; width: 200px; height: 78px; border-radius: 14px; background: #2F6BFF; box-shadow: 0 8px 0 {HONDO}; transform: rotateX(12deg)"></div>
      <div style="position: absolute; left: 50%; bottom: 92px; margin-left: -106px; width: 212px; height: 26px; border-radius: 10px; background: {AMARILLO}; transform: rotate(-9deg); transform-origin: left bottom"></div>
      <div style="position: absolute; left: 50%; bottom: 56px; margin-left: -32px; width: 64px; height: 14px; border-radius: 7px; background: {HONDO}"></div>
      <img src="{BLOB['lamparita']}" alt="" style="position: absolute; right: 26px; top: 10px; width: 54px; height: 74px; object-fit: contain">
      <img src="{BLOB['llave']}" alt="" style="position: absolute; left: 22px; top: 18px; width: 54px; height: 60px; object-fit: contain; transform: rotate(-12deg)">
      <span style="position: absolute; left: 14px; bottom: 12px">{chip("Girala con el dedo","cubo","blanco")}</span>
    </div>'''
cuerpo = contenido(f'''
    {titulo_grande("HERRAMIENTAS EN TU TELÉFONO","Tu ","taller")}
    {caja3d}
    <strong style="font-size: 16px">Para todos los oficios</strong>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{herr('regla','Medir','Con la cámara','T-Medir.dc.html',AZUL,'#FFFFFF',True)}{herr('cubo','Escanear en 3D','De fotos a modelo','T-Escanear.dc.html')}{herr('nivel','Nivel','Con el giroscopio','T-Nivel.dc.html')}{herr('plomada','Plomada y ángulos','Paredes y caídas','T-Nivel.dc.html')}{herr('linterna','Linterna y lupa','Flash y zoom','T-Taller.dc.html')}{herr('conversor','Conversor','Pulgadas, m², litros','T-Taller.dc.html')}</div>
    <a href="T-Electricidad.dc.html" style="display: flex; gap: 12px; align-items: center; padding: 14px; border-radius: 22px; background: {NOCHE}; color: #FFFFFF; text-decoration: none">{mosaico_ic('rayo',48,fondo=AMARILLO,color=TINTA,radio=16,iconsize=24)}<span style="flex: 1; display: flex; flex-direction: column"><strong style="font-size: 16px">Tu oficio: Electricidad</strong><span style="font-size: 12px; color: #C9D5EA">Cables, tablero 3D, informe y 5 más</span></span>{svg(IC['flecha'],'#FFFFFF',20)}</a>''', top=26) + '\n' + barra_vidrio('Cuenta')
guardar('T-Taller.dc.html','Taller · Portada',cuerpo)

# Medir con la cámara (AR)
escena=f'''<div aria-hidden="true" style="position: absolute; inset: 0; background: #2A2F38">
    <div style="position: absolute; left: 0; right: 0; top: 0; height: 520px; background: #C9C3B6"></div>
    <div style="position: absolute; left: 0; right: 0; top: 520px; bottom: 0; background: #8C7A64"></div>
    <div style="position: absolute; left: 70px; top: 200px; width: 250px; height: 300px; border-radius: 4px; background: #E9E6DD; box-shadow: inset 0 0 0 10px #D9D4C8"></div>
    <svg width="390" height="844" style="position: absolute; inset: 0"><line x1="80" y1="210" x2="310" y2="210" stroke="{AMARILLO}" stroke-width="4" stroke-dasharray="10 6"></line><line x1="80" y1="210" x2="80" y2="490" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="8 6"></line><circle cx="80" cy="210" r="11" fill="#FFFFFF" stroke="{AZUL}" stroke-width="4"></circle><circle cx="310" cy="210" r="11" fill="#FFFFFF" stroke="{AZUL}" stroke-width="4"></circle><circle cx="80" cy="490" r="11" fill="#FFFFFF" stroke="{AZUL}" stroke-width="4"></circle></svg>
    <span style="position: absolute; left: 150px; top: 168px; padding: 6px 12px; border-radius: 999px; background: {AMARILLO}; {TIT}; font-size: 20px">1,42 m</span>
    <span style="position: absolute; left: 92px; top: 330px; padding: 4px 10px; border-radius: 999px; background: #FFFFFF; {TIT}; font-size: 16px">1,68 m</span>
    <span style="position: absolute; left: 50%; top: 52%; margin: -14px 0 0 -14px; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 0 3px rgba(0,0,0,0.25)"></span>
  </div>'''
cuerpo = escena + f'''
  <header style="position: absolute; top: 14px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center"><a href="T-Taller.dc.html" aria-label="Volver" style="width: 48px; height: 48px; border-radius: 16px; background: rgba(14,29,54,0.55); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>{chip("Precisión ± 1 cm","regla","blanco")}</header>
  <div style="position: absolute; left: 14px; right: 14px; bottom: 18px; padding: 14px; border-radius: 28px; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; flex-direction: column; gap: 12px">
    <div style="display: flex; justify-content: space-between; align-items: center"><span style="display: flex; flex-direction: column"><strong style="font-size: 15px">Hueco de la ventana</strong><span style="font-size: 12px; color: {SUAVE}">1,42 × 1,68 m · 2,39 m²</span></span>{chip("2 medidas","check","exito")}</div>
    <div style="display: grid; grid-template-columns: 56px minmax(0,1fr) 56px; gap: 10px; align-items: center"><span role="button" aria-label="Deshacer" style="height: 56px; border-radius: 18px; background: {MOSAICO}; display: flex; align-items: center; justify-content: center">{svg(IC['deshacer'],TINTA,22)}</span><span style="height: 56px; border-radius: 18px; background: {AZUL}; color: #FFFFFF; box-shadow: 0 4px 0 {HONDO}; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 900">{svg(IC['mas'],'#FFFFFF',22)}Marcar punto</span><a href="T-Modelo3D.dc.html" aria-label="Guardar" style="height: 56px; border-radius: 18px; background: {AMARILLO}; display: flex; align-items: center; justify-content: center">{svg(IC['check'],TINTA,24,3)}</a></div>
    <span style="font-size: 11px; color: {SUAVE}">Es una medida aproximada: para cortar, confirmala con la cinta. En teléfonos sin AR, se mide con una tarjeta de referencia.</span>
  </div>'''
guardar('T-Medir.dc.html','Taller · Medir con la cámara',cuerpo)

# Escanear en 3D
fotos_ring=''.join(f'<span style="position: absolute; left: {195+130*__import__("math").cos(a*0.2094)-6:.0f}px; top: {380+130*__import__("math").sin(a*0.2094)-6:.0f}px; width: 12px; height: 12px; border-radius: 50%; background: {AMARILLO if a<18 else "rgba(255,255,255,0.35)"}"></span>' for a in range(30))
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: #2A2F38"></div>
  <div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 470px; bottom: 0; background: #8C7A64"></div>
  <div aria-hidden="true" style="position: absolute; left: 130px; top: 300px; width: 130px; height: 190px; border-radius: 18px 18px 8px 8px; background: #F2F2F2; box-shadow: inset -18px 0 0 #D8D8D8"><span style="position: absolute; left: 50px; top: 40px; width: 30px; height: 30px; border-radius: 50%; background: #B8BFCC"></span></div>
  {fotos_ring}
  <header style="position: absolute; top: 14px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center"><a href="T-Taller.dc.html" aria-label="Volver" style="width: 48px; height: 48px; border-radius: 16px; background: rgba(14,29,54,0.55); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>{chip("18 de 30 fotos","camara","amarillo")}</header>
  <section style="position: absolute; top: 120px; left: 24px; right: 24px; text-align: center; color: #FFFFFF; display: flex; flex-direction: column; gap: 6px"><strong style="{TIT}; font-size: 26px">Girá alrededor del termotanque</strong><span style="font-size: 14px; color: #C9D5EA">Despacio y a la misma distancia. Los puntos amarillos son las fotos que ya sacamos.</span></section>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 22px; display: grid; grid-template-columns: minmax(0,1fr) 84px minmax(0,1fr); align-items: center; gap: 10px">
    <span style="min-height: 52px; border-radius: 16px; background: rgba(14,29,54,0.75); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 800">Cancelar</span>
    <span role="button" aria-label="Sacar foto" style="width: 84px; height: 84px; border-radius: 50%; background: #FFFFFF; box-shadow: 0 0 0 6px rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center"><span style="width: 64px; height: 64px; border-radius: 50%; background: {AZUL}"></span></span>
    <a href="T-Modelo3D.dc.html" style="min-height: 52px; border-radius: 16px; background: {AMARILLO}; color: {TINTA}; display: flex; align-items: center; justify-content: center; font-weight: 900; text-decoration: none">Armar 3D</a>
  </div>'''
guardar('T-Escanear.dc.html','Taller · Escanear en 3D',cuerpo)

# Resultado 3D
modelo=f'''<div aria-hidden="true" style="position: relative; height: 330px; border-radius: 28px; background: {TINTE}; overflow: hidden; perspective: 700px">
      <div style="position: absolute; left: 50%; top: 40px; margin-left: -60px; width: 120px; height: 210px; border-radius: 24px 24px 10px 10px; background: #F4F4F4; box-shadow: inset -26px 0 0 #DADADA, 0 30px 30px -20px rgba(14,29,54,0.4); transform: rotateY(-18deg)"></div>
      <div style="position: absolute; left: 50%; top: 262px; margin-left: -90px; width: 180px; height: 22px; border-radius: 50%; background: rgba(14,29,54,0.15)"></div>
      <svg width="358" height="330" style="position: absolute; inset: 0"><line x1="250" y1="44" x2="250" y2="250" stroke="{AZUL}" stroke-width="2"></line><line x1="243" y1="44" x2="257" y2="44" stroke="{AZUL}" stroke-width="2"></line><line x1="243" y1="250" x2="257" y2="250" stroke="{AZUL}" stroke-width="2"></line></svg>
      <span style="position: absolute; left: 262px; top: 134px; padding: 4px 8px; border-radius: 8px; background: #FFFFFF; font-weight: 900; font-size: 13px">85 cm</span>
      <span style="position: absolute; left: 140px; top: 290px; padding: 4px 8px; border-radius: 8px; background: #FFFFFF; font-weight: 900; font-size: 13px">Ø 45 cm</span>
      <span style="position: absolute; left: 12px; top: 12px">{chip("Girá y acercá","cubo","blanco")}</span>
    </div>'''
cuerpo = barra_compacta('Termotanque en 3D','T-Escanear.dc.html',sub='Listo · 30 fotos') + contenido(f'''
    {modelo}
    {tarjeta(fila_ic('regla','Medidas','Alto 85 cm · diámetro 45 cm · aprox.',borde=False)+fila_ic('cubo','Ver en el lugar (AR)','Cómo queda el equipo nuevo en esa pared',href='T-TableroPared.dc.html'))}
    <div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Al presupuesto","H0-Presupuesto.dc.html","ticket")}{boton2("Mandar por chat","F-Chat.dc.html","chat")}</div>''') + '\n' + accion_fija('Guardar en el trabajo','F-Trabajo.dc.html')
guardar('T-Modelo3D.dc.html','Taller · Modelo 3D',cuerpo)

# Nivel premium
cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: {NOCHE}"></div>
  <header style="position: absolute; top: 14px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center"><a href="T-Taller.dc.html" aria-label="Volver" style="width: 48px; height: 48px; border-radius: 16px; background: rgba(255,255,255,0.14); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>{chip("Calibrado","check","exito")}</header>
  <div style="position: absolute; top: 84px; left: 16px; right: 16px; display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: rgba(255,255,255,0.1)">{''.join(f'<span style="flex: 1; min-height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; {"background: #FFFFFF; color: "+TINTA if i==0 else "color: #C9D5EA"}">{t}</span>' for i,t in enumerate(['Superficie','Pared','Plomada']))}</div>
  <div aria-hidden="true" style="position: absolute; left: 50%; top: 170px; margin-left: -150px; width: 300px; height: 300px; border-radius: 50%; background: #26385C; box-shadow: inset 0 0 0 10px #2E4370">
    <span style="position: absolute; left: 50%; top: 50%; width: 90px; height: 90px; margin: -45px 0 0 -45px; border-radius: 50%; border: 3px dashed rgba(255,255,255,0.35)"></span>
    <span style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.15)"></span><span style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.15)"></span>
    <span style="position: absolute; left: 50%; top: 50%; width: 70px; height: 70px; margin: -40px 0 0 -28px; border-radius: 50%; background: {AMARILLO}; box-shadow: 0 0 30px rgba(245,245,154,0.6)"></span>
  </div>
  <section style="position: absolute; top: 500px; left: 24px; right: 24px; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #FFFFFF"><strong style="{TIT}; font-size: 60px; line-height: 1">0,4°</strong><span style="font-size: 14px; color: #C9D5EA">Casi a nivel · inclinado hacia la izquierda</span></section>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 22px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px">{''.join(f'<span style="min-height: 64px; border-radius: 18px; background: rgba(255,255,255,0.12); color: #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 800">{svg(IC[i],AMARILLO,22)}{t}</span>' for i,t in [('nivel','Calibrar'),('candado','Fijar'),('camara','Foto con nivel')])}</div>'''
guardar('T-Nivel.dc.html','Taller · Nivel',cuerpo)

# Hub de Electricidad
cuerpo = barra_compacta('Electricidad','T-Taller.dc.html',sub='Tu oficio') + contenido(f'''
    <div style="padding: 16px; border-radius: 24px; background: {NOCHE}; color: #FFFFFF; display: flex; gap: 14px; align-items: center">{mosaico_ic('rayo',58,fondo=AMARILLO,color=TINTA,radio=18,iconsize=30)}<span style="display: flex; flex-direction: column; gap: 4px"><strong style="{TIT}; font-size: 22px; line-height: 1.05">Herramientas del electricista</strong><span style="font-size: 12px; color: #C9D5EA">Tablas en revisión técnica. El teléfono no detecta tensión.</span></span></div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px">{herr('caja','Tablero 3D','Armalo y miralo en la pared','T-Tablero.dc.html',AZUL,'#FFFFFF',True)}{herr('rayo','Cables','Sección y caída de tensión','T-Cables.dc.html')}{herr('escudo','Informe eléctrico','Mediciones con semáforo','T-Informe.dc.html')}{herr('bombita','Iluminación','Lux por ambiente','T-Electricidad.dc.html')}{herr('billete','Consumo','Cuánto gasta cada equipo','T-Electricidad.dc.html')}{herr('obra','Recorrido de caños','El ambiente en 3D','T-Electricidad.dc.html')}</div>''') 
guardar('T-Electricidad.dc.html','Taller · Electricidad',cuerpo)

# Tablero 3D premium
def mod(w, c, t, l):
    return f'<span style="width: {w}px; height: 78px; border-radius: 6px; background: {c}; box-shadow: inset 0 -8px 0 rgba(0,0,0,0.12), 0 2px 0 rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 8px 0 6px; box-sizing: border-box; font-size: 11px; font-weight: 900; color: {t}"><span style="width: 60%; height: 14px; border-radius: 3px; background: {AZUL if c=="#FFFFFF" else HONDO}"></span>{l}</span>'
tablero=f'''<div aria-hidden="true" style="position: relative; height: 330px; border-radius: 28px; background: {NOCHE}; overflow: hidden; perspective: 800px">
      <div style="position: absolute; left: 50%; top: 50%; width: 270px; padding: 22px 16px; margin: -120px 0 0 -135px; border-radius: 20px; background: #E9ECF2; box-shadow: 0 40px 50px -20px rgba(0,0,0,0.7), inset 0 0 0 6px #D3D8E2; transform: rotateY(-16deg) rotateX(8deg)">
        <div style="height: 10px; border-radius: 5px; background: #B8BFCC; margin-bottom: 10px"></div>
        <div style="display: flex; gap: 4px; justify-content: center">{mod(58,'#FFFFFF',TINTA,'ID 40 A')}{mod(29,'#FFFFFF',TINTA,'C16')}{mod(29,'#FFFFFF',TINTA,'C16')}{mod(29,'#FFFFFF',TINTA,'C20')}{mod(29,AMARILLO,TINTA,'+')}</div>
        <div style="height: 10px; border-radius: 5px; background: #B8BFCC; margin-top: 10px"></div>
      </div>
      <span style="position: absolute; left: 12px; top: 12px">{chip("3D","cubo","amarillo")}</span>
      <span style="position: absolute; right: 12px; top: 12px">{chip("8 módulos · 3 circuitos","caja","blanco")}</span>
    </div>'''
cuerpo = barra_compacta('Tablero 3D','T-Electricidad.dc.html',sub='Vivienda · 3 circuitos') + contenido(f'''
    {tablero}
    <div style="display: flex; gap: 8px; overflow: hidden">{''.join(f'<span style="flex: none; min-height: 52px; padding: 0 14px; border-radius: 16px; background: {MOSAICO}; display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13px">{svg(IC[i],AZUL,20)}{t}</span>' for i,t in [('mas','Térmica'),('escudo','Diferencial'),('ticket','Etiquetas'),('camara','Leer de una foto')])}</div>
    {tarjeta(fila_ic('lista','Cómputo','1 diferencial 40 A · 3 térmicas · gabinete de 8',borde=False)+fila_ic('billete','Materiales al presupuesto','$ 86.400 de tu lista',href='H0-Presupuesto.dc.html'))}''') + '\n' + acciones_fijas(f'<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Compartir","F-Chat.dc.html","enviar")}{boton("Ver en la pared","T-TableroPared.dc.html",alto=52)}</div>')
guardar('T-Tablero.dc.html','Taller · Tablero 3D',cuerpo)

cuerpo = f'''  <div aria-hidden="true" style="position: absolute; inset: 0; background: #CFC8BA"></div>
  <div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 600px; bottom: 0; background: #9C8B74"></div>
  <div aria-hidden="true" style="position: absolute; left: 95px; top: 240px; width: 200px; padding: 16px 12px; border-radius: 14px; background: #E9ECF2; box-shadow: 0 24px 30px -12px rgba(0,0,0,0.45)"><div style="height: 8px; border-radius: 4px; background: #B8BFCC; margin-bottom: 8px"></div><div style="display: flex; gap: 3px; justify-content: center">{mod(42,'#FFFFFF',TINTA,'ID').replace('height: 78px','height: 58px')}{''.join(mod(21,'#FFFFFF',TINTA,'').replace('height: 78px','height: 58px') for _ in range(3))}</div><div style="height: 8px; border-radius: 4px; background: #B8BFCC; margin-top: 8px"></div></div>
  <svg aria-hidden="true" width="390" height="844" style="position: absolute; inset: 0"><line x1="95" y1="370" x2="295" y2="370" stroke="{AZUL}" stroke-width="2"></line><line x1="310" y1="240" x2="310" y2="350" stroke="{AZUL}" stroke-width="2"></line></svg>
  <span style="position: absolute; left: 160px; top: 380px; padding: 3px 8px; border-radius: 8px; background: #FFFFFF; font-weight: 900; font-size: 12px">32 cm</span>
  <span style="position: absolute; left: 318px; top: 284px; padding: 3px 8px; border-radius: 8px; background: #FFFFFF; font-weight: 900; font-size: 12px">22 cm</span>
  <header style="position: absolute; top: 14px; left: 16px; right: 16px; display: flex; justify-content: space-between; align-items: center"><a href="T-Tablero.dc.html" aria-label="Volver" style="width: 48px; height: 48px; border-radius: 16px; background: rgba(14,29,54,0.55); display: flex; align-items: center; justify-content: center">{svg(IC['atras'],'#FFFFFF',22)}</a>{chip("Tamaño real","regla","blanco")}</header>
  <div style="position: absolute; left: 14px; right: 14px; bottom: 18px; padding: 14px; border-radius: 26px; background: #FFFFFF; box-shadow: {ELEV2}; display: flex; flex-direction: column; gap: 10px"><span style="font-size: 13px; color: {TEXTO}">Mostrale al cliente cómo queda en su pared antes de empezar.</span><div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px">{boton2("Mover","T-TableroPared.dc.html","flechas" if 'flechas' in IC else "regla")}{boton(svg(IC["camara"],"#FFFFFF",20)+"Foto","H0-AntesDespues.dc.html",alto=52)}</div></div>'''
guardar('T-TableroPared.dc.html','Taller · Tablero en la pared (AR)',cuerpo)
print('ok')
