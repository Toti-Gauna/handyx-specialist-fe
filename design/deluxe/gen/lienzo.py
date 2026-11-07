import json, re, os
D='deluxe/project/'; C=json.load(open(D+'canvas.json'))
B=C['boards']; N=C['notes']
def tam(f):
    m=re.search(r'"width":(\d+),"height":(\d+)', open(D+f).read()); return int(m[1]), int(m[2])
def tit(f):
    return re.search(r'<title>(.*?)</title>', open(D+f).read())[1].replace('&amp;','&')
def puesto(f, x, y):
    w,h=tam(f); viejo=B.get(f,{})
    B[f]={'x':x,'y':y,'w':w,'h':h,'title':viejo.get('title') or tit(f)}
    return h
# filas actuales por y (secciones de pantallas)
filas={}
for k,v in B.items(): filas.setdefault(v['y'],[]).append((v['x'],k))
filas={y:[k for x,k in sorted(r)] for y,r in filas.items()}
def fila_de(primero): return next(r for r in filas.values() if r[0]==primero)

RC=['Onboarding','Login','Pedido','Dia','Presupuesto','Obra','Equipo','Chat','Repuestos','Ferreteria','Camino','Taller','Cuenta','Agenda','Equipamiento','Mensajes']
FL=[r[0] for y,r in sorted(filas.items()) if r[0].startswith('FL-')]
y=1373
for r in RC:
    f=f'RC-{r}.dc.html'; t=tit(f)
    if f not in B: B[f]={'title':'Recorrido · '+t}
    y+=puesto(f,0,y)+200
N['tituloRC']['y']=1073; N['notaRC']['y']=1373
y+=100; N['tituloFlujos']['y']=y-300; N['notaFlujos']['y']=y
for f in FL: y+=puesto(f,0,y)+160
y+=100; N['tituloFE']['y']=y-300; N['notaFE']['y']=y
fe=['FE-Alta','FE-Inicio','FE-Pedido','FE-Escanear','FE-Retiro','FE-Catalogo','FE-Importar','FE-Metricas']
for i,f in enumerate(fe): puesto(f+'.dc.html',(i%4)*1360,y+(i//4)*1000)
y+=2000-200+300+300

filas_pant=[fila_de('D6-Bienvenida.dc.html'),fila_de('RG-1.dc.html'),fila_de('OB-Aprobado.dc.html'),fila_de('F-Inicio.dc.html'),['F-InicioDia.dc.html','F-InicioRuta.dc.html','TR-EnCamino.dc.html','TR-Cobro.dc.html','F-Herramientas.dc.html','F-Agenda.dc.html','F-AgendaPasadas.dc.html','F-AgendaMes.dc.html','F-Trabajo.dc.html','F-Ingresos.dc.html'],fila_de('F-Cuenta.dc.html'),
 [f+'.dc.html' for f in 'F-Obras F-Obra F-ObraDia F-ObraDiaHorario F-ObraDiaTarea F-ObraDiaAvance F-ObraRepuestos F-RepuestoOrigen F-ObraRepuesto F-ObraFecha'.split()],
 [f+'.dc.html' for f in 'F-ObraEquipo F-Invitar F-Reparto F-ObraBuscar F-InicioConvocatoria F-ConvocatoriaDetalle F-ObraPostulantes F-PerfilProfesional'.split()],
 [f+'.dc.html' for f in 'F-Mensajes F-Chat F-ChatGrupo F-ChatAcciones F-ChatEditar F-ChatBorrar F-ChatSeleccion F-ChatMedia F-ChatAdjuntar F-ChatGrupoInfo F-PropuestaObra'.split()],
 [f+'.dc.html' for f in 'H0-Presupuesto H0-AgregarMaterial H0-MaterialOpciones H0-MaterialNuevo H0-AgregarLista H0-Precios H0-PreciosFoto H0-PreciosRevisar H0-PrecioItem H0-ManoObra'.split()],fila_de('H0-Modo.dc.html'),
 [f+'.dc.html' for f in 'H0-Equipo H0-EquipoCategoria H0-EquipoDetalle H0-EquipoBaja H0-EquipoAgregar'.split()],
 [f+'.dc.html' for f in 'R-Catalogo R-Categoria R-Pedir R-Comparar R-Ferreterias R-Estado R-Retiro R-Mostrador'.split()],
 fila_de('FE-MovilEscanear.dc.html'),fila_de('G-Inicio.dc.html'),fila_de('T-Taller.dc.html'),fila_de('D6-Avisos.dc.html'),fila_de('OF-Aire.dc.html')]
y-=300
for i,fila in enumerate(filas_pant):
    hmax=0
    for k,f in enumerate(fila): hmax=max(hmax,puesto(f,k*470,y))
    n=len(fila); N[f'titulo{i}'].update(y=y-300, maxW=max(n*470-80,1400)); N[f'nota{i}'].update(x=n*470+40-80+120 if n>2 else 1100, y=y)
    N[f'nota{i}']['x']=max(n*470+40, 1100)
    y+=hmax+420
N.setdefault('tituloX',{'x':0,'text':'Escritorio · la app es solo para el celular','kind':'title1','maxW':1800,'w':240})
N.setdefault('notaX',{'x':1520,'text':'Si alguien entra desde una computadora, ve esta pantalla: la app existe solo en el celular, con una vista de muestra en vertical y un QR para abrirla en el teléfono.','w':380,'size':24,'fill':'gray'})
N['tituloX']['y']=y-300; N['notaX']['y']=y
puesto('X-Escritorio.dc.html',0,y); y+=900+420
N['tituloExp']['y']=y-300; N['notaExp']['y']=y
for fila in (['Main','A-Precio','A-Regalo'],['B-Inicio','B-Precio','B-Regalo'],['C-Inicio','C-Obras','C-Obra','C-Ingresos','C-Precio','C-Regalo']):
    for k,f in enumerate(fila): puesto(f+'.dc.html',k*470,y)
    y+=844+420
N['titulo4']['text']='Núcleo · Tu día y la pestaña Taller'
N['nota4']['text']='Tu día con el paso a paso de las paradas; en camino e informar el cobro. La pestaña Taller (antes Agenda) junta la agenda, ingresos y gastos, presupuestos, equipamiento y herramientas.'
N['nota3']['text']='Mapa siempre detrás, panel de estado colgado de la cabecera (Disponible y los datos del día), pedidos en modales flotantes y barra azul de vidrio.'
N['nota9']['text']='Agregar un material: buscar y tocar; las opciones quedan resumidas y, si no está, se carga como material nuevo (suma al catálogo).'
N['nota7']['text']='Invitás a alguien que conocés o buscás uno nuevo: la búsqueda la ven solo especialistas verificados de la zona, se postulan y vos elegís. Reparto registrado; Handyx no toca la plata.'
N['nota8']['text']='Chat con reacciones, editar (queda «editado»), borrar para todos (queda «Mensaje eliminado» y se guarda oculto por si hay un reclamo), seleccionar varios, fotos y videos, y sumar personas al grupo. Las tarjetas no se editan.'
N['nota11']['text']='Detalle de cada herramienta con historial; prestar, mover y «ya no la tengo» (se rompió, la vendí, la perdí, me la robaron) con reponer en la ferretería o la lista de compras.'
if 'Repuestos: «Lo consigo yo»' not in N['nota6']['text']: N['nota6']['text']=N['nota6']['text'].rstrip('.')+'. Repuestos: «Lo consigo yo» o «En una ferretería adherida», con precios distintos en cada una.'
existentes={f for f in os.listdir(D) if f.endswith('.dc.html')}
for f in list(B):
    if f not in existentes: del B[f]
faltan=existentes-set(B); assert not faltan, faltan
if 'tituloX' not in C['noteOrder']:
    i=C['noteOrder'].index('tituloExp'); C['noteOrder'][i:i]=['tituloX','notaX']
C['order']=[k for k,v in sorted(B.items(), key=lambda kv:(kv[1]['y'],kv[1]['x']))]
json.dump(C,open(D+'canvas.json','w'),ensure_ascii=False,indent=1)
pub={'canvas.json':D+'canvas.json'}
for f in existentes: pub[f]=D+f
json.dump(pub,open('gen/publicar.json','w'))
print(len(B), len(pub), y)
