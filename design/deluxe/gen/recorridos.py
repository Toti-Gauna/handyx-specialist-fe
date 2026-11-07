import sys, re, json; sys.path.insert(0,'gen')
from piezas2 import *
D='deluxe/project/'
ESC=0.5; TW=195; GAP=104; POR_FILA=6
def miniatura(f):
    h=open(D+f+'.dc.html').read()
    raiz=h.split('<x-dc>')[1].split('</x-dc>')[0]
    raiz=re.sub(r'<helmet>[\s\S]*?</helmet>','',raiz).strip()
    raiz=re.sub(r' tabindex="\d+"','',raiz)
    raiz=re.sub(r'<a ','<span ',raiz).replace('</a>','</span>')
    raiz=re.sub(r'<button ','<span ',raiz).replace('</button>','</span>')
    raiz=re.sub(r' role="(button|switch|tab|tablist|radio|radiogroup|checkbox|listbox|option|img)"','',raiz)
    m=re.search(r'"width":(\d+),"height":(\d+)',h); w,hh=int(m.group(1)),int(m.group(2))
    return raiz, int(hh*ESC)
def recorrido(archivo, titulo, sub, pasos):
    # pasos: (pantalla, leyenda, evento_antes)
    filas=[pasos[i:i+POR_FILA] for i in range(0,len(pasos),POR_FILA)]
    y=150; bloques=[]; n=0
    for fila in filas:
        alturas=[miniatura(p[0])[1] for p in fila]; hmax=max(alturas)
        for k,(f,ley,ev) in enumerate(fila):
            n+=1; raiz,th=miniatura(f); x=40+k*(TW+GAP)
            if ev:
                bloques.append(f'<div style="position: absolute; left: {x-GAP+6}px; top: {y+90}px; width: {GAP-12}px; padding: 6px 8px; border-radius: 14px; background: {AMARILLO}; font-size: 11px; font-weight: 800; text-align: center; line-height: 1.2; box-shadow: 0 3px 0 #C9C85A">{ev}</div>') if k>0 else bloques.append(f'<div style="position: absolute; left: {x}px; top: {y-34}px; padding: 5px 10px; border-radius: 12px; background: {AMARILLO}; font-size: 11px; font-weight: 800">{ev} ↓</div>')
            if k>0:
                bloques.append(f'<svg aria-hidden="true" style="position: absolute; left: {x-GAP+10}px; top: {y+170}px" width="{GAP-20}" height="20"><line x1="0" y1="10" x2="{GAP-32}" y2="10" stroke="{AZUL}" stroke-width="3" stroke-linecap="round"></line><path d="M{GAP-34} 3 L{GAP-22} 10 L{GAP-34} 17 Z" fill="{AZUL}"></path></svg>')
            bloques.append(f'<div aria-hidden="true" style="position: absolute; left: {x}px; top: {y}px; width: {TW}px; height: {th}px; border-radius: 22px; overflow: hidden; box-shadow: 0 0 0 1px {BORDE}, {ELEV2}"><div style="width: 390px; transform: scale({ESC}); transform-origin: 0 0; pointer-events: none">{raiz}</div></div>')
            bloques.append(f'<div style="position: absolute; left: {x}px; top: {y+th+12}px; width: {TW}px; display: flex; gap: 8px; align-items: flex-start"><span style="width: 26px; height: 26px; flex: none; border-radius: 50%; background: {AZUL}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900">{n}</span><a href="{f}.dc.html" style="flex: 1; font-size: 13px; font-weight: 700; line-height: 1.25; color: {TINTA}; text-decoration: none; min-height: 44px">{ley}</a></div>')
        y+=hmax+130
    W=40+POR_FILA*TW+(POR_FILA-1)*GAP+40 if len(pasos)>=POR_FILA else 40+len(pasos)*TW+(len(pasos)-1)*GAP+40
    W=max(W,1100); H=y+10
    html=f'''<div style="width: {W}px; height: {H}px; box-sizing: border-box; background: #F6F7F9; font-family: 'DM Sans', system-ui, sans-serif; color: {TINTA}; position: relative; overflow: hidden">
  <div style="position: absolute; left: 40px; top: 32px; display: flex; flex-direction: column; gap: 6px">{etiqueta("RECORRIDO CON PANTALLAS", AZUL)}<h1 style="margin: 0; {TIT}; font-size: 34px; line-height: 1">{titulo}</h1><span style="font-size: 14px; color: {SUAVE}">{sub}</span></div>
  <div style="position: absolute; right: 40px; top: 40px; display: flex; gap: 14px; font-size: 12px; color: {SUAVE}"><span style="display: inline-flex; gap: 6px; align-items: center"><span style="width: 18px; height: 12px; border-radius: 4px; background: {AMARILLO}"></span>Lo que pasa entre pantallas</span><span style="display: inline-flex; gap: 6px; align-items: center"><span style="width: 18px; height: 12px; border-radius: 4px; background: {AZUL}"></span>Orden del recorrido</span></div>
  {"".join(bloques)}
</div>'''
    doc=documento(titulo,'').replace(f'<div style="width: 390px; height: 844px; box-sizing: border-box; background: #FFFFFF; font-family: \'DM Sans\', system-ui, sans-serif; color: {TINTA}; overflow: hidden; position: relative">\n\n</div>', html).replace('{"width":390,"height":844}', f'{{"width":{W},"height":{H}}}')
    open(D+archivo,'w').write(doc); return (archivo,titulo,W,H)

R=[]
R.append(recorrido('RC-Onboarding.dc.html','Onboarding completo','Desde la bienvenida hasta el primer día disponible.',[
 ('D6-Bienvenida','Bienvenida: «Crear cuenta»',None),('RG-1','Tus datos y contraseña',None),('RG-2','Dónde vivís (cifrado)',None),('RG-3','Rubros',None),('RG-4','Zonas',None),('RG-5','Selfie',None),
 ('RG-6','DNI frente y dorso',None),('RG-7','CUIT o CUIL',None),('RG-8','Certificados y matrículas',None),('RG-9','Antecedentes por foto o PDF',None),('RG-10','Revisar y enviar',None),('D6-Alta','Evaluamos tu perfil',None),
 ('OB-Aprobado','¡Estás habilitado!','Handyx te habilita'),('OB-Permisos','Avisos y ubicación',None),('OB-Tour','Cómo funciona',None),('OB-PrimerosPasos','Primeros pasos',None),('G-Bienvenida','Kit de bienvenida',None),('F-Inicio','Primer día en el mapa',None)]))
R.append(recorrido('RC-Login.dc.html','Iniciar sesión','Con email o teléfono y contraseña, Google o Apple, y la segunda verificación si la activaste.',[
 ('D6-Bienvenida','«Ya tengo cuenta»',None),('D6-Login','Email o teléfono y contraseña',None),('D6-Login2FA','Código de la app',None),('F-Inicio','Adentro',None),('D6-Recuperar','Si olvidaste la contraseña','Alternativa'),('D6-Acceso','O entrar con un código','Alternativa')]))
R.append(recorrido('RC-Pedido.dc.html','Recibir un pedido y cotizar','El aviso abre el detalle; el especialista pone precio y horario y lo manda.',[
 ('F-Inicio','Pedido flotante sobre el mapa',None),('F-Pedido','Detalle del pedido','Toca «Ver pedido»'),('F-Precio','Tu precio con la cinta',None),('F-PrecioTeclado','O lo escribís',None),('F-Fecha','Día y franja',None),('F-FechaHora','Horario a medida',None),
 ('F-Revisar','Revisar y enviar',None),('F-Enviada','Propuesta enviada',None),('F-Chat','Chat con el cliente','Pide cambios'),('F-Trabajo','Trabajo agendado','El cliente acepta')]))
R.append(recorrido('RC-Dia.dc.html','Tu día y el trabajo','De la primera parada al cobro verificado.',[
 ('F-InicioDia','Tu día en el Inicio',None),('F-InicioRuta','Tu recorrido',None),('TR-EnCamino','En camino',None),('H0-Modo','Modo trabajo','Llegada'),('H0-ModoHerramientas','Herramientas a mano',None),('H0-ModoAyuda','Pedir ayuda',None),
 ('H0-AntesDespues','Antes y después',None),('H0-AntesLado','Lado a lado',None),('TR-Cobro','¿Cómo te pagó?',None),('H0-Informe','Informe del trabajo',None),('H0-InformeEnviado','Conformidad y garantía',None),('F-Ingresos','Tus ingresos','Se verifica el pago')]))
R.append(recorrido('RC-Presupuesto.dc.html','Presupuestos y lista de precios','Materiales con precio fijo o que se actualiza; se cobran y se registran como gasto.',[
 ('F-Trabajo','Desde el trabajo',None),('H0-Presupuesto','Presupuestador',None),('H0-AgregarMaterial','Agregar un material',None),('H0-AgregarLista','O varios',None),('F-Chat','Llega por el chat',None),
 ('H0-Precios','Tu lista de precios','Aparte'),('H0-PreciosFoto','Foto del corralón',None),('H0-PreciosRevisar','Revisar lo leído',None),('H0-PrecioItem','Detalle e historial',None),('H0-ManoObra','Mano de obra',None)]))
R.append(recorrido('RC-Obra.dc.html','Una obra de varios días','De la propuesta al día a día, con horarios, tareas, avances y repuestos.',[
 ('F-ChatAdjuntar','Mandar en el chat',None),('F-PropuestaObra','Propuesta de obra',None),('F-Obras','Tus obras','El cliente acepta'),('F-Obra','La obra',None),('F-ObraDia','Una jornada',None),('F-ObraDiaHorario','Cambiar el horario',None),
 ('F-ObraDiaTarea','Agregar una tarea',None),('F-ObraDiaAvance','Cargar el avance',None),('F-ObraRepuestos','Repuestos',None),('F-RepuestoOrigen','¿Cómo lo conseguís?',None),('F-ObraRepuesto','Lo consigo yo',None),('F-ObraFecha','Mover jornadas',None)]))
R.append(recorrido('RC-Equipo.dc.html','Obra en equipo','Invitás a alguien que conocés o buscás uno nuevo; nadie entra sin que lo elijas.',[
 ('F-ObraEquipo','Equipo de la obra',None),('F-Invitar','Invitar a un contacto',None),('F-Reparto','Reparto del pago','Acepta la invitación'),('F-ChatGrupo','Chat grupal','Cada uno acepta su parte'),
 ('F-ObraBuscar','O buscar uno nuevo','Otra opción'),('F-InicioConvocatoria','Lo ve otro profesional en su Inicio','Se publica'),('F-ConvocatoriaDetalle','Ve la obra y se postula',None),('F-ObraPostulantes','Elegís a quién sumar','Se postula'),('F-ChatGrupoInfo','Entra al grupo','Lo elegís')]))
R.append(recorrido('RC-Chat.dc.html','Chat de la obra','Reacciones, editar, borrar (queda «Mensaje eliminado»), seleccionar, fotos y videos, y sumar gente.',[
 ('F-ChatGrupo','Chat de la obra',None),('F-ChatAcciones','Mantener apretado: reacciones y acciones',None),('F-ChatEditar','Editar',None),('F-ChatBorrar','Borrar para todos',None),('F-ChatSeleccion','Seleccionar varios',None),('F-ChatMedia','Fotos y videos',None),
 ('F-ChatAdjuntar','Mandar tarjetas',None),('F-ChatGrupoInfo','Grupo: personas y archivos',None),('F-Invitar','Agregar personas',None)]))
R.append(recorrido('RC-Repuestos.dc.html','Agregar un repuesto','Lo conseguís vos o en una ferretería adherida; cada ferretería tiene su precio.',[
 ('F-ObraRepuestos','Repuestos de la obra',None),('F-RepuestoOrigen','¿Cómo lo conseguís?',None),('F-ObraRepuesto','Lo consigo yo: precio y foto',None),('F-Chat','Martín lo aprueba en el chat','Se manda'),
 ('R-Comparar','En una ferretería: comparar precios','Otra opción'),('R-Estado','La ferretería confirma','Martín aprueba'),('R-Retiro','Retiro con QR',None),('H0-Gasto','Queda como gasto','Retirado')]))
R.append(recorrido('RC-Equipamiento.dc.html','Tu equipamiento','Dónde está cada herramienta, a quién se la prestaste y qué pasa cuando ya no la tenés.',[
 ('H0-Equipo','Tu equipamiento',None),('H0-EquipoCategoria','Una categoría',None),('H0-EquipoDetalle','Detalle e historial',None),('H0-EquipoBaja','Ya no la tengo',None),('R-Comparar','Buscar una nueva','Si querés reponerla'),('H0-EquipoAgregar','O agregar otra',None)]))
R.append(recorrido('RC-Ferreteria.dc.html','Pedir en la ferretería','Catálogo, pedido, QR y el ferretero del otro lado.',[
 ('R-Catalogo','Catálogo por categorías',None),('R-Categoria','Variantes',None),('R-Pedir','Tu pedido',None),('R-Ferreterias','Elegir ferretería',None),('R-Estado','Estado del pedido','La ferretería confirma'),('R-Retiro','QR a pantalla completa',None),
 ('R-Mostrador','O la lista grande',None),('FE-MovilEscanear','El ferretero escanea',None),('FE-Movil','Prepara y entrega',None),('H0-Gasto','Queda como gasto','Retirado')]))
R.append(recorrido('RC-Camino.dc.html','Camino Handyx','Kit de bienvenida, mini caminos y regalos sin azar.',[
 ('G-Inicio','Tu camino',None),('G-Bienvenida','Kit de bienvenida',None),('G-Manual','Manual',None),('G-Camino','Camino de trabajos',None),('G-MiniCamino','Mini camino de cobros',None),('F-Regalo','El regalo','Llegás a un hito'),
 ('G-Canje','Canje',None),('G-Vitrina','Vitrina',None),('G-Insignias','Insignias',None),('G-Areas','Áreas (concepto)',None)]))
R.append(recorrido('RC-Taller.dc.html','Tu taller','Herramientas para todos y, aparte, las de tu oficio.',[
 ('T-Taller','Tu taller',None),('T-Medir','Medir con la cámara',None),('T-Escanear','Escanear en 3D',None),('T-Modelo3D','Modelo 3D',None),('T-Nivel','Nivel',None),('T-Electricidad','Tu oficio',None),
 ('T-Tablero','Tablero 3D',None),('T-TableroPared','En la pared',None),('T-Cables','Cables',None),('T-Informe','Informe eléctrico',None)]))
R.append(recorrido('RC-Cuenta.dc.html','Tu cuenta','Todo lo tuyo en un lugar.',[
 ('F-Cuenta','Tu cuenta',None),('CU-Perfil','Tu perfil',None),('CU-Datos','Datos y verificación',None),('CU-Disponibilidad','Disponibilidad',None),('CU-Cobros','Medios de cobro',None),('CU-Notificaciones','Avisos',None),
 ('CU-Privacidad','Privacidad y baja',None),('D6-Seguridad','Seguridad',None),('D6-TOTP','App autenticadora',None)]))
R.append(recorrido('RC-Agenda.dc.html','Agenda, ingresos y equipamiento','Hoy, lo que pasó y lo que viene; la plata y tus herramientas.',[
 ('F-Agenda','Hoy',None),('F-AgendaPasadas','Pasadas',None),('F-AgendaMes','El mes',None),('F-Ingresos','Tus ingresos',None),('H0-Gasto','Cargar un gasto',None),('H0-Equipo','Tu equipamiento',None),
 ('H0-EquipoCategoria','Categoría',None),('H0-EquipoDetalle','Una herramienta',None),('H0-EquipoBaja','Ya no la tengo',None)]))
R.append(recorrido('RC-Mensajes.dc.html','Mensajes, avisos y ayuda','Cada chat atado a un pedido, una obra o el equipo; avisos que llevan al detalle.',[
 ('F-Mensajes','Tus mensajes',None),('F-Chat','Chat con un cliente',None),('F-ChatGrupo','Chat de la obra',None),('F-ChatAcciones','Reacciones y acciones',None),('D6-Avisos','Avisos',None),('D6-Ayuda','Ayuda',None),('D6-Error','Sin conexión',None),('D6-Fallo','Error del servidor',None)]))
json.dump(R,open('gen/recorridos.json','w'))
print([(a,w,h) for a,t,w,h in R])
