import sys, math; sys.path.insert(0,'gen')
from piezas2 import *
IC.update({'telefono':'<rect x="7" y="2" width="10" height="20" rx="2.5"></rect><path d="M11 18h2"></path>','documento':'<path d="M6 2h9l5 5v15H6V2Z"></path><path d="M14 2v6h6M9 13h8M9 17h6"></path>','cara':'<circle cx="12" cy="12" r="9"></circle><path d="M9 10h.01M15 10h.01M8.5 15a5 5 0 0 0 7 0"></path>','llave2':'<circle cx="8" cy="15" r="4"></circle><path d="M11 12l9-9M17 6l2 2M15 8l2 2"></path>','sobre':'<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>'})
IC.update({'carrito':'<path d="M3 4h2l2.5 11h11l2-8H7"></path><circle cx="9" cy="19" r="1.5"></circle><circle cx="17" cy="19" r="1.5"></circle>','columnas':'<rect x="3" y="4" width="8" height="16" rx="2"></rect><rect x="13" y="4" width="8" height="16" rx="2"></rect>','firma':'<path d="M3 17c3-6 5-6 6-3s3 3 5-1 4-2 7 1"></path><path d="M3 21h18"></path>','tornillo':'<path d="M9 3h6l-1 4h-4L9 3Z"></path><path d="M12 7v13M9.5 10l5 1.5M9.5 13l5 1.5M9.5 16l5 1.5"></path>','taladro':'<path d="M3 7h12l2 3h4v2h-4l-2 3H9v5H5v-5H3V7Z"></path>'})
NW, NH, DX, DY, X0, Y0 = 176, 104, 214, 176, 40, 160

def flujo(archivo, titulo, sub, nodos, aristas, nota=''):
    pos={}
    for n in nodos:
        k,c,r=n[0],n[1],n[2]
        pos[k]=(X0+c*DX, Y0+r*DY)
    W=max(1346, max(x for x,y in pos.values())+NW+60)
    H=max(y for x,y in pos.values())+NH+110
    cards=[]
    for k,c,r,t,s,ic,href,tipo in nodos:
        x,y=pos[k]
        if tipo=='p':   est=f'background: #FFFFFF; border: 1px solid {BORDE}; box-shadow: {ELEV1}; color: {TINTA}'; icf,icc='#E9EFF9',AZUL; etq='PANTALLA'
        elif tipo=='i': est=f'background: {AZUL}; box-shadow: 0 4px 0 {HONDO}; color: #FFFFFF'; icf,icc='rgba(255,255,255,0.18)','#FFFFFF'; etq='PANTALLA'
        elif tipo=='e': est=f'background: {AMARILLO}; box-shadow: 0 4px 0 #C9C85A; color: {TINTA}'; icf,icc='#FFFFFF',TINTA; etq='EL CLIENTE'
        elif tipo=='o': est=f'background: #FFFFFF; border: 2px dashed {AZUL}; color: {TINTA}'; icf,icc=TINTE,AZUL; etq='OTRO PROFESIONAL'
        else:           est=f'background: {NOCHE}; color: #FFFFFF'; icf,icc='rgba(255,255,255,0.14)',AMARILLO; etq='HANDYX'
        tag='a' if href else 'div'
        h=f' href="{href}"' if href else ''
        cards.append(f'<{tag}{h} style="position: absolute; left: {x}px; top: {y}px; width: {NW}px; height: {NH}px; box-sizing: border-box; padding: 10px 12px; border-radius: 18px; {est}; text-decoration: none; display: flex; flex-direction: column; gap: 4px"><span style="display: flex; align-items: center; gap: 8px"><span style="width: 30px; height: 30px; flex: none; border-radius: 10px; background: {icf}; display: flex; align-items: center; justify-content: center">{svg(IC[ic],icc,17)}</span><span style="font-size: 9px; font-weight: 800; letter-spacing: 1.2px; opacity: 0.75">{etq}</span></span><strong style="font-size: 14px; line-height: 1.15">{t}</strong><span style="font-size: 11px; opacity: 0.75; line-height: 1.2">{s}</span></{tag}>')
    paths=[]; labels=[]
    for a,b,lab in aristas:
        (x1,y1),(x2,y2)=pos[a],pos[b]
        arco=None
        if y2>y1+10: p1=(x1+NW/2,y1+NH); d1=(0,1); p2=(x2+NW/2,y2-6); d2=(0,-1)
        elif y2<y1-10: p1=(x1+NW/2,y1); d1=(0,-1); p2=(x2+NW/2,y2+NH+6); d2=(0,1)
        elif x2-x1 > DX*1.5: p1=(x1+NW/2,y1); d1=(0,-1); p2=(x2+NW/2,y2-6); d2=(0,1); arco=-1
        elif x2>x1: p1=(x1+NW,y1+NH/2); d1=(1,0); p2=(x2-6,y2+NH/2); d2=(-1,0)
        else: p1=(x1+NW/2,y1+NH); d1=(0,1); p2=(x2+NW/2,y2+NH+6); d2=(0,-1); arco=1
        dist=max(50,min(120,math.hypot(p2[0]-p1[0],p2[1]-p1[1])/2.2))
        if d1[1]!=0 and d2[1]!=0 and not arco:
            gap=abs(p2[1]-p1[1]); dist=max(24,min(dist,gap*0.45)) if abs(p2[0]-p1[0])>DX*0.6 else dist
        if arco: c1=(p1[0],p1[1]+arco*55); c2=(p2[0],p2[1]+arco*55)
        else: c1=(p1[0]+d1[0]*dist,p1[1]+d1[1]*dist); c2=(p2[0]+d2[0]*dist,p2[1]+d2[1]*dist)
        paths.append(f'<path d="M{p1[0]:.0f} {p1[1]:.0f} C {c1[0]:.0f} {c1[1]:.0f}, {c2[0]:.0f} {c2[1]:.0f}, {p2[0]:.0f} {p2[1]:.0f}" fill="none" stroke="{AZUL}" stroke-width="2.5" marker-end="url(#punta)"></path>')
        if lab:
            mx=(p1[0]+3*c1[0]+3*c2[0]+p2[0])/8; my=(p1[1]+3*c1[1]+3*c2[1]+p2[1])/8
            if abs(y2-y1)<10 and 0 < x2-x1 <= DX*1.5: my-=22
            labels.append(f'<span style="position: absolute; left: {mx:.0f}px; top: {my:.0f}px; translate: -50% -50%; padding: 3px 8px; border-radius: 999px; background: #FFFFFF; border: 1px solid {BORDE}; font-size: 11px; font-weight: 800; color: {HONDO}; white-space: nowrap">{lab}</span>')
    leyenda=''.join(f'<span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 18px; height: 12px; border-radius: 4px; {e}"></span>{t}</span>' for e,t in [(f'background: #FFFFFF; border: 1px solid {BORDE}','Pantalla'),(f'background: {AZUL}','Punto de partida'),(f'background: {AMARILLO}','Lo hace el cliente'),(f'background: {NOCHE}','Lo hace Handyx u Operations'),(f'border: 2px dashed {AZUL}','Otro profesional')])
    nt=f'<p style="position: absolute; left: 40px; right: 40px; bottom: 26px; margin: 0; font-size: 13px; color: {SUAVE}">{nota}</p>' if nota else ''
    html=f'''<div style="width: {W}px; height: {H}px; box-sizing: border-box; background: #FFFFFF; font-family: 'DM Sans', system-ui, sans-serif; color: {TINTA}; position: relative; overflow: hidden">
  <div style="position: absolute; left: 40px; top: 30px; display: flex; flex-direction: column; gap: 6px">{etiqueta("FLUJO", AZUL)}<h1 style="margin: 0; {TIT}; font-size: 34px; line-height: 1">{titulo}</h1><span style="font-size: 14px; color: {SUAVE}">{sub}</span></div>
  <div style="position: absolute; right: 40px; top: 40px; display: flex; gap: 16px; font-size: 12px; color: {SUAVE}">{leyenda}</div>
  <svg aria-hidden="true" width="{W}" height="{H}" style="position: absolute; inset: 0"><defs><marker id="punta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="{AZUL}"></path></marker></defs>{"".join(paths)}</svg>
  {"".join(cards)}
  {"".join(labels)}
  {nt}
</div>'''
    doc=documento(titulo, '').replace(f'<div style="width: 390px; height: 844px; box-sizing: border-box; background: #FFFFFF; font-family: \'DM Sans\', system-ui, sans-serif; color: {TINTA}; overflow: hidden; position: relative">\n\n</div>', html).replace('{"width":390,"height":844}', f'{{"width":{W},"height":{H}}}')
    open('deluxe/project/'+archivo,'w').write(doc)
    return W,H

FL=[]
def F(*a, **k):
    W,H=flujo(*a, **k); FL.append((a[0],a[1],W,H))

F('FL-Alta.dc.html','Alta y verificación','De la bienvenida a recibir el primer pedido. Se puede cortar y retomar en cualquier paso.',
 [('bien',0,0,'Bienvenida','Crear cuenta','casa','D6-Bienvenida.dc.html','i'),('r1',1,0,'1 · Tus datos','Nombre, teléfono, email','cuenta','RG-1.dc.html','p'),('r2',2,0,'2 · Domicilio','Cifrado, nunca se muestra','pin','RG-2.dc.html','p'),('r3',3,0,'3 · Rubros','Gas y Aire piden matrícula','herramienta','RG-3.dc.html','p'),('r4',4,0,'4 · Zonas','Barrios en el mapa','pin','RG-4.dc.html','p'),('r5',5,0,'5 · Selfie','Con óvalo guía','cara','RG-5.dc.html','p'),('r6',6,0,'6 · DNI','Frente y dorso','escudo','RG-6.dc.html','p'),
  ('r7',0,1,'7 · CUIT/CUIL','Y cómo factura','documento','RG-7.dc.html','p'),('r8',1,1,'8 · Certificados','Matrícula obligatoria en Gas y Aire','documento','RG-8.dc.html','p'),('r9',2,1,'9 · Antecedentes','Foto o PDF','escudo','RG-9.dc.html','p'),('r10',3,1,'10 · Revisar y enviar','Acepta los textos','check','RG-10.dc.html','p'),('est',4,1,'Estado del alta','Qué falta y qué está en revisión','lista','D6-Alta.dc.html','p'),('ops',5,1,'Operations verifica','DNI, selfie, matrícula y antecedentes; borra los antecedentes','escudo',None,'s'),('ini',6,1,'Inicio con mapa','Ya puede ponerse disponible','casa','F-Inicio.dc.html','i'),
  ('corr',4,2,'Hay que corregir algo','Operations dice qué y por qué','alerta',None,'s')],
 [('bien','r1',''),('r1','r2',''),('r2','r3',''),('r3','r4',''),('r4','r5',''),('r5','r6',''),('r6','r7',''),('r7','r8',''),('r8','r9',''),('r9','r10',''),('r10','est','Envía'),('est','ops',''),('ops','ini','Habilitado'),('ops','corr','Falta algo'),('corr','est','Corrige')],
 'Cargar un documento no es estar verificado. Los rubros con matrícula se habilitan cuando Operations la verifica.')

F('FL-Acceso.dc.html','Entrar y segunda verificación','Código por email o SMS, o Google y Apple. La app autenticadora es opcional y se activa desde Cuenta.',
 [('bien',0,0,'Bienvenida','Ya tengo cuenta','casa','D6-Bienvenida.dc.html','i'),('acc',1,0,'Elegir cómo entrar','Email, SMS, Google o Apple','llave2','D6-Acceso.dc.html','p'),('cod',2,0,'Código de 6 dígitos','Por email o SMS','sobre','D6-Codigo.dc.html','p'),('mfa',3,0,'¿Tiene segunda verificación?','La decide Handyx con tu cuenta','escudo',None,'s'),('totp',4,0,'App autenticadora','Código de la app','llave2','D6-TOTP.dc.html','p'),('ini',5,0,'Inicio con mapa','Sesión con cookie segura','casa','F-Inicio.dc.html','i'),
  ('cta',2,1,'Cuenta','Seguridad','cuenta','F-Cuenta.dc.html','p'),('seg',3,1,'Segunda verificación','App, SMS o email','escudo','D6-Seguridad.dc.html','p'),('act',4,1,'Escanear y activar','QR + código + respaldo','llave2','D6-TOTP.dc.html','p')],
 [('bien','acc',''),('acc','cod','Pide el código'),('cod','mfa',''),('mfa','totp','Sí'),('totp','ini',''),('mfa','ini','No'),('cta','seg',''),('seg','act','Activar'),('act','ini','')],
 'Nada de la sesión se guarda en el navegador: ni el código, ni la clave de la app.')

F('FL-Pedido.dc.html','Recibir un pedido y cotizar','El especialista elige: cotiza, propone otra fecha o lo deja pasar sin consecuencias.',
 [('ini',0,0,'Inicio con mapa','Disponible prendido','casa','F-Inicio.dc.html','i'),('av',1,0,'Aviso «nuevo pedido»','Abre el detalle; nunca acepta','campana',None,'s'),('ped',2,0,'Pedido entrante','Zona aproximada, horario, sugerido','herramienta','F-Pedido.dc.html','p'),('pre',3,0,'Tu precio','Cinta métrica y atajos','billete','F-Precio.dc.html','p'),('fec',4,0,'¿Cuándo vas?','Calendario y franjas','agenda','F-Fecha.dc.html','p'),('rev',5,0,'Revisar y enviar','Resumen en una hoja','check','F-Revisar.dc.html','p'),('env',6,0,'Propuesta enviada','Queda el chat abierto','enviar','F-Enviada.dc.html','p'),
  ('cli',6,1,'El cliente responde','Acepta, pide cambios o elige otro','usuario2',None,'e'),('trab',5,2,'Trabajo agendado','Aparece la dirección exacta','agenda','F-Trabajo.dc.html','p'),('chat',4,2,'Chat del pedido','Pide otro precio u horario','chat','F-Chat.dc.html','p'),('no',2,1,'Ahora no','No tiene consecuencias','reloj','F-Inicio.dc.html','p')],
 [('ini','av',''),('av','ped',''),('ped','pre','Cotizar'),('pre','fec',''),('fec','rev',''),('rev','env',''),('env','cli',''),('cli','trab','Acepta'),('cli','chat','Pide cambios'),('chat','pre','Nueva propuesta'),('ped','no','Ahora no'),('ped','fec','Otra fecha')],
 'Gamificación sin presión: el pedido suma a Tu camino solo cuando el trabajo se verifica.')

F('FL-Trabajo.dc.html','Hacer el trabajo y cobrar','Del trabajo agendado al cobro verificado, con todo a mano en el Modo trabajo.',
 [('trab',0,0,'Trabajo agendado','Hoy de 18 a 20','agenda','F-Trabajo.dc.html','i'),('ruta',1,0,'Tu día en el mapa','Paradas en orden; ubicación solo en el viaje','camion','F-InicioRuta.dc.html','p'),('lle',2,0,'Llegada','Se marca sola o a mano','pin',None,'s'),('modo',3,0,'Modo trabajo','Tareas y cronómetro','herramienta','H0-Modo.dc.html','p'),('inf',4,0,'Informe del trabajo','Se completa solo','escudo','H0-Informe.dc.html','p'),('cob',5,0,'Informa el cobro','Efectivo o Mercado Pago, directo','billete',None,'p'),('ver',6,0,'Pago verificado','Reportado ≠ verificado','check',None,'s'),
  ('her',2,1,'Herramientas','Nivel, linterna, lupa, calculadoras','herramienta','H0-ModoHerramientas.dc.html','p'),('rep',3,1,'Repuestos','Agregar al trabajo o pedir','caja','H0-AgregarMaterial.dc.html','p'),('ayu',4,1,'Pedir ayuda','Llamar o sumar a otro profesional','telefono','H0-ModoAyuda.dc.html','p'),('age',5,1,'Agenda','Avisar demora al próximo cliente','agenda','H0-ModoAgenda.dc.html','p'),
  ('ing',7,0,'Tus ingresos','Bruto, gastos y neto','billete','F-Ingresos.dc.html','p'),('cam',7,1,'Tu camino +1','Si el trabajo se verifica','estrella','G-Camino.dc.html','p')],
 [('trab','ruta','Salir'),('ruta','lle',''),('lle','modo',''),('modo','inf','Terminé'),('inf','cob',''),('cob','ver',''),('modo','her',''),('modo','rep',''),('modo','ayu',''),('modo','age',''),('ver','ing',''),('ver','cam','')],
 'Handyx no recibe la plata del servicio: el especialista cobra directo y Handyx verifica lo que corresponde.')

F('FL-Presupuesto.dc.html','Presupuestos y lista de precios','Los precios salen de la lista del especialista; cada material puede ser fijo o actualizarse.',
 [('tr',0,0,'Trabajo o chat','Armar presupuesto','herramienta','F-Trabajo.dc.html','i'),('pres',1,0,'Presupuestador','Mano de obra + materiales','ticket','H0-Presupuesto.dc.html','p'),('mat',2,0,'Agregar material','Fijo o se actualiza · cobrar y/o gasto','caja','H0-AgregarMaterial.dc.html','p'),('var',2,1,'Agregar varios','Kits y del Taller','lista','H0-AgregarLista.dc.html','p'),('chat',3,0,'Mandar por el chat','Directo, sin pantalla extra','enviar','F-Chat.dc.html','p'),('cli',4,0,'El cliente acepta','O pide cambios en el chat','usuario2',None,'e'),('ok',5,0,'Total del trabajo','Se actualiza el acordado','check','F-Trabajo.dc.html','p'),
  ('sube',4,1,'Cambió un precio','De uno que se actualiza, antes de aceptar','flechas' if 'flechas' in IC else 'alerta',None,'s'),('v2',3,1,'Versión nueva','La anterior queda vencida','ticket','H0-Presupuesto.dc.html','p'),
  ('lis',0,2,'Lista de precios','Materiales y mano de obra','lista','H0-Precios.dc.html','i'),('foto',1,2,'Foto del corralón','Se lee en el teléfono','camara','H0-PreciosFoto.dc.html','p'),('lei',2,2,'Revisar lo leído','Suben, bajan, nuevos','check','H0-PreciosRevisar.dc.html','p'),('det',3,2,'Detalle del precio','Historial y margen','billete','H0-PrecioItem.dc.html','p'),('mo',4,2,'Mano de obra','Hora, visita, por tarea','herramienta','H0-ManoObra.dc.html','p')],
 [('tr','pres',''),('pres','mat',''),('pres','var',''),('mat','chat',''),('chat','cli',''),('cli','ok','Acepta'),('cli','sube',''),('sube','v2','Te avisamos'),('v2','chat',''),('lis','foto',''),('foto','lei',''),('lei','det',''),('lis','mo','')],
 'Después se suma el catálogo con los precios de las ferreterías de Mar del Plata.')

F('FL-Obra.dc.html','Una obra de varios días','De la propuesta al último día, con repuestos que aprueba el cliente y fechas que se pueden mover.',
 [('cha',0,0,'Chat','Mandar propuesta de obra','chat','F-ChatAdjuntar.dc.html','i'),('prop',1,0,'Propuesta de obra','Etapas, jornadas y montos','obra','F-PropuestaObra.dc.html','p'),('acp',2,0,'El cliente acepta','La obra queda armada','usuario2',None,'e'),('obras',3,0,'Tus obras','En curso, próximas, terminadas','obra','F-Obras.dc.html','p'),('obra',4,0,'Obra: resumen y días','Gastado, días, falta cobrar','obra','F-Obra.dc.html','p'),('dia',5,0,'Una jornada','Tareas, fotos y nota','agenda','F-ObraDia.dc.html','p'),('ve',6,0,'El cliente ve el avance','En el chat de la obra','usuario2',None,'e'),
  ('rep',4,1,'Agregar repuesto','Para una jornada futura','caja','F-ObraRepuesto.dc.html','p'),('apr',5,1,'El cliente aprueba','En el chat','usuario2',None,'e'),('avi',6,1,'Aviso el día anterior','«Falta comprar»','campana',None,'s'),('fer',7,1,'Pedir en ferretería','Y queda como gasto','herramienta','R-Pedir.dc.html','p'),
  ('fec',3,1,'Cambiar fecha','Una jornada o las que siguen','agenda','F-ObraFecha.dc.html','p'),('acf',3,2,'El cliente acepta','Hasta entonces, siguen las de ahora','usuario2',None,'e'),('equ',4,2,'Se avisa al equipo','Y se mueve la agenda','usuario2',None,'s')],
 [('cha','prop',''),('prop','acp',''),('acp','obras',''),('obras','obra',''),('obra','dia',''),('dia','ve',''),('obra','rep',''),('rep','apr',''),('apr','avi',''),('avi','fer',''),('obra','fec',''),('fec','acf',''),('acf','equ','')],
 '')

F('FL-Equipo.dc.html','Obra en equipo','Otros profesionales se suman solo por invitación; el reparto lo acuerdan entre ellos.',
 [('obra',0,0,'Obra','Pestaña Equipo','obra','F-Obra.dc.html','i'),('equ',1,0,'Equipo de la obra','Quién está y su parte','usuario2','F-ObraEquipo.dc.html','p'),('inv',2,0,'Invitar','Contactos o enlace con código','usuario2','F-Invitar.dc.html','p'),('acp',3,0,'Acepta la invitación','Tiene que estar verificado','usuario2',None,'o'),('rep',4,0,'Reparto del pago','Monto o % y cómo cobra','billete','F-Reparto.dc.html','p'),('ok',5,0,'Cada uno acepta','Su parte','check',None,'o'),('grp',6,0,'Chat grupal','Equipo + cliente','chat','F-ChatGrupo.dc.html','p'),
  ('cob',4,1,'Cada uno cobra su parte','Directo del cliente; Handyx no reparte','billete',None,'e')],
 [('obra','equ',''),('equ','inv',''),('inv','acp',''),('acp','rep',''),('rep','ok',''),('ok','grp',''),('rep','cob','Al cobrar')],
 'Cada profesional ve los días, el chat y su parte. Los gastos del titular los ve solo él.')

F('FL-Mensajes.dc.html','Mensajes y tarjetas','Cada chat está atado a un pedido, una obra o el equipo. Lo importante viaja como tarjeta.',
 [('lis',0,0,'Tus mensajes','Pedidos, obras, equipo, soporte','chat','F-Mensajes.dc.html','i'),('chat',1,0,'Chat','Con el cliente o el grupo','chat','F-Chat.dc.html','p'),('mas',2,0,'Mandar en el chat','Botón «+»','mas','F-ChatAdjuntar.dc.html','p'),
  ('t1',3,0,'Presupuesto','Desde el presupuestador','ticket','H0-Presupuesto.dc.html','p'),('t2',4,0,'Propuesta de obra','Etapas y montos','obra','F-PropuestaObra.dc.html','p'),('t3',3,1,'Repuestos para aprobar','De la obra','caja','F-ObraRepuesto.dc.html','p'),('t4',4,1,'Cambio de fecha','Día u horario','agenda','F-Fecha.dc.html','p'),('t5',3,2,'Fotos e informe','Achicadas y sin ubicación','camara','H0-Informe.dc.html','p'),
  ('cli',5,1,'El cliente responde','Acepta, aprueba o pide cambios','usuario2',None,'e'),('obra',6,1,'Se actualiza la obra o el trabajo','Total, días, repuestos','check','F-Obra.dc.html','p')],
 [('lis','chat',''),('chat','mas',''),('mas','t1',''),('mas','t3',''),('mas','t5',''),('t1','t2',''),('t3','t4',''),('t2','cli',''),('t4','cli',''),('cli','obra','')],
 'Nada se manda solo: cada tarjeta la manda el especialista.')

F('FL-Plata.dc.html','Gastos, repuestos e ingresos','Un mismo material puede cobrarse al cliente y también registrarse como gasto.',
 [('mat',0,0,'Material o repuesto','Del presupuesto, la obra o el Modo trabajo','caja','H0-AgregarMaterial.dc.html','i'),('ped',1,0,'Catálogo de la ferretería','Por categorías','carrito','R-Catalogo.dc.html','p'),('fer',2,0,'Tu pedido y ferretería','Simulación primero','herramienta','R-Pedir.dc.html','p'),('conf',3,0,'La ferretería confirma','Precios y reemplazos','herramienta',None,'o'),('est',4,0,'Estado del pedido','Enviado → listo','lista','R-Estado.dc.html','p'),('qr',5,0,'Retiro con QR','Paga en la ferretería','qr','R-Retiro.dc.html','p'),
  ('tic',1,1,'Foto del ticket','O carga a mano','camara','H0-Gasto.dc.html','p'),('gas',2,1,'Registrar como gasto','Baja el neto','billete','H0-Gasto.dc.html','p'),('cob',3,1,'Cobrarlo al cliente','Adicional en el chat','ticket','F-Chat.dc.html','p'),('acp',4,1,'El cliente acepta','El adicional','usuario2',None,'e'),('ing',5,1,'Tus ingresos','Bruto − gastos = neto','billete','F-Ingresos.dc.html','p')],
 [('mat','ped','Comprar'),('ped','fer',''),('fer','conf',''),('conf','est',''),('est','qr',''),('qr','tic','Al retirar'),('mat','tic','Ya lo compré'),('tic','gas',''),('tic','cob',''),('cob','acp',''),('gas','ing',''),('acp','ing','')],
 'Los gastos son del especialista: el cliente nunca los ve.')

F('FL-Camino.dc.html','Camino Handyx','Premios por trabajos verificados. Sin azar, sin rankings y sin presión para aceptar.',
 [('tv',0,0,'Trabajo terminado','Con cobro informado','check','H0-Informe.dc.html','i'),('ver',1,0,'Operations verifica','Antifraude: topes y montos','escudo',None,'s'),('mas',2,0,'Tu camino +1','Nada se resta nunca','estrella','G-Camino.dc.html','p'),('est',3,0,'Llegás a una estación','Se sabe antes qué hay','estrella','G-Camino.dc.html','p'),('reg',4,0,'El regalo','La caja se abre, sin sorteo','regalo','F-Regalo.dc.html','p'),('can',5,0,'Canje','Talle, color y retiro o envío','regalo','G-Canje.dc.html','p'),('rev',6,0,'Operations revisa','Y entrega','escudo',None,'s'),
  ('vit',6,1,'Vitrina de premios','Lo ganado y lo que sigue','medalla','G-Vitrina.dc.html','p'),('ins',2,1,'Insignias','Por usar la app; sin premio','medalla','G-Insignias.dc.html','p')],
 [('tv','ver',''),('ver','mas',''),('mas','est',''),('est','reg',''),('reg','can',''),('can','rev',''),('rev','vit',''),('mas','ins','')],
 '')

F('FL-Dia.dc.html','Tu día de trabajo','Cuando tenés varios trabajos hoy, el Inicio muestra la próxima parada y el recorrido.',
 [('ini',0,0,'Inicio con tu día','Próxima parada y Disponible','casa','F-InicioDia.dc.html','i'),('ruta',1,0,'Tu día en el mapa','Paradas, km y orden','camion','F-InicioRuta.dc.html','p'),('sal',2,0,'Trabajo agendado','Salir para allá','agenda','F-Trabajo.dc.html','p'),('lle',3,0,'Llegada','Se marca sola o a mano','pin',None,'s'),('modo',4,0,'Modo trabajo','Tareas y herramientas','herramienta','H0-Modo.dc.html','p'),('inf',5,0,'Informe enviado','Garantía y conformidad','escudo','H0-InformeEnviado.dc.html','p'),('sig',6,0,'Próxima parada','Vuelve al Inicio con tu día','casa','F-InicioDia.dc.html','i'),
  ('dem',1,1,'Avisar demora','Llego 15 o 30 min tarde','reloj','H0-ModoAgenda.dc.html','p'),('cli',2,1,'El cliente recibe el aviso','En el chat del trabajo','usuario2',None,'e'),('ord',1,2,'Cambiar el orden','Mantener apretada una parada','flechas',None,'p')],
 [('ini','ruta','Ver todo'),('ruta','sal',''),('sal','lle',''),('lle','modo',''),('modo','inf','Terminé'),('inf','sig',''),('ini','dem',''),('dem','cli',''),('ruta','ord','')],
 'La ubicación se comparte solo durante el viaje a un trabajo. Los avisos los manda el especialista con un toque.')
F('FL-Cierre.dc.html','Cerrar un trabajo: antes y después e informe','Lo que se hace en el trabajo arma el informe solo; no hay que cargar nada dos veces.',
 [('modo',0,0,'Modo trabajo','Foto al empezar','herramienta','H0-Modo.dc.html','i'),('ad',1,0,'Antes y después · deslizar','Con la manija en el medio','camara','H0-AntesDespues.dc.html','p'),('lado',1,1,'Antes y después · lado a lado','Dos fotos directas','columnas','H0-AntesLado.dc.html','p'),('notas',2,0,'Qué cambiaste','Escrito o dictado','lista','H0-AntesLado.dc.html','p'),('inf',3,0,'Informe del trabajo','Causa, pruebas, materiales, garantía','escudo','H0-Informe.dc.html','p'),('env',4,0,'Informe enviado','Por el chat y en PDF','enviar','H0-InformeEnviado.dc.html','p'),('conf',5,0,'El cliente da conformidad','Con un toque en su app','firma',None,'e'),('gar',6,0,'Garantía activa','Hasta el 17/12','escudo',None,'s'),
  ('rec',6,1,'Recordatorio de mantenimiento','Te avisa a vos; le escribís si querés','agenda',None,'s'),('cam',5,1,'Tu camino +1','Cuando se verifica el trabajo','estrella','G-Camino.dc.html','p')],
 [('modo','ad',''),('ad','lado','Cambiar vista'),('ad','notas',''),('lado','notas',''),('notas','inf',''),('inf','env',''),('env','conf',''),('conf','gar',''),('gar','rec',''),('conf','cam','')],
 'Las fotos se achican y pierden la ubicación en el teléfono antes de subirse.')
F('FL-Equipamiento.dc.html','Tu equipamiento','Herramientas, instrumentos y consumibles: dónde están, cuándo hacerles mantenimiento y qué reponer.',
 [('eq',0,0,'Tu equipamiento','Por categoría','caja','H0-Equipo.dc.html','i'),('cat',1,0,'Categoría','Eléctricas, medición, seguridad…','taladro','H0-EquipoCategoria.dc.html','p'),('agr',2,0,'Agregar herramienta','Foto o código de barras','camara','H0-EquipoAgregar.dc.html','p'),('man',3,0,'Recordatorio de mantenimiento','Escobillas, calibración, vencimientos','reloj',None,'s'),
  ('pres',2,1,'Prestar a un profesional','Queda anotado a quién y hasta cuándo','usuario2',None,'p'),('vuel',3,1,'Te la devuelve','Otro profesional','usuario2',None,'o'),
  ('poc',1,2,'Quedan pocos','Consumibles bajo el mínimo','alerta',None,'s'),('lis',2,2,'Lista de compras','Se arma sola','lista','H0-Equipo.dc.html','p'),('fer',3,2,'Pedir en ferretería','Catálogo por categorías','carrito','R-Catalogo.dc.html','p')],
 [('eq','cat',''),('cat','agr',''),('agr','man',''),('cat','pres',''),('pres','vuel',''),('eq','poc',''),('poc','lis',''),('lis','fer','')],
 '')
F('FL-Ferreteria.dc.html','Pedir en la ferretería','Un catálogo por categorías con variantes, un pedido único y el retiro con QR. Primero simulado.',
 [('ori',0,0,'Obra, presupuesto o equipamiento','Lo que hace falta','caja','F-ObraRepuestos.dc.html','i'),('cat',1,0,'Catálogo por categorías','Fijaciones, plomería, pintura…','carrito','R-Catalogo.dc.html','p'),('sub',2,0,'Categoría','Variantes y cantidades','tornillo','R-Categoria.dc.html','p'),('ped',3,0,'Tu pedido','Agrupado por trabajo; gasto y cobro','lista','R-Pedir.dc.html','p'),('fer',4,0,'Elegir ferretería','Distancia, horario y stock','pin','R-Ferreterias.dc.html','p'),('conf',5,0,'La ferretería confirma','Precios y reemplazos','herramienta','R-Panel.dc.html','o'),('est',6,0,'Estado del pedido','Enviado → listo','reloj','R-Estado.dc.html','p'),
  ('qr',6,1,'Retiro con QR','Paga en la ferretería','qr','R-Retiro.dc.html','p'),('gas',5,1,'Gasto registrado','Con el ticket','billete','H0-Gasto.dc.html','p'),('cob',4,1,'Cobrar al cliente','Lo que corresponda, por el chat','ticket','F-Chat.dc.html','p')],
 [('ori','cat',''),('cat','sub',''),('sub','ped',''),('ped','fer',''),('fer','conf',''),('conf','est',''),('est','qr','Listo'),('qr','gas',''),('gas','cob','')],
 'Después, el catálogo se arma con las listas reales de las ferreterías de Mar del Plata.')
import json as _j; _j.dump(FL, open('gen/flujos.json','w'))

print('ok', [(a,w,h) for a,_,w,h in FL])
