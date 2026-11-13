# Pone la pantalla de la que sale cada hoja o modal detrás del velo (en vez de un fondo gris vacío).
import re, sys
D='deluxe/project/'
FONDO = {'F-ChatAcciones':'F-ChatGrupo','F-ChatAdjuntar':'F-Chat','F-ChatBorrar':'F-ChatGrupo','F-ChatEditar':'F-ChatGrupo',
 'F-FechaHora':'F-Fecha','F-ObraDiaAvance':'F-ObraDia','F-ObraDiaHorario':'F-ObraDia','F-ObraDiaTarea':'F-ObraDia',
 'F-PrecioTeclado':'F-Precio','F-RepuestoOrigen':'F-ObraRepuestos','F-Revisar':'F-Fecha','H0-EquipoBaja':'H0-EquipoDetalle',
 'H0-MaterialOpciones':'H0-AgregarMaterial','H0-ModoHerramientas':'H0-Modo'}
VELO='<div aria-hidden="true" style="position: absolute; inset: 0; background: rgba(14,29,54,0.45)"></div>'
def raiz(f):
    h=open(D+f+'.dc.html').read()
    r=h.split('<x-dc>')[1].split('</x-dc>')[0]
    r=re.sub(r'<helmet>[\s\S]*?</helmet>','',r).strip()
    r=re.sub(r' tabindex="\d+"','',r)
    r=re.sub(r'<a ','<span ',r).replace('</a>','</span>'); r=re.sub(r'<button ','<span ',r).replace('</button>','</span>')
    r=re.sub(r' role="[a-z]+"','',r); r=re.sub(r' aria-(current|checked|selected|label|valuemin|valuemax|valuenow|valuetext)="[^"]*"','',r)
    return r
faltan=[]
for f,bg in FONDO.items():
    p=D+f+'.dc.html'; h=open(p).read()
    if 'data-fondo=' in h: continue
    if VELO not in h: faltan.append(f); continue
    capa=f'<div aria-hidden="true" data-fondo="{bg}" style="position: absolute; inset: 0; overflow: hidden; pointer-events: none">{raiz(bg)}</div>\n  '
    h=h.replace(VELO, capa+VELO.replace('0.45','0.5'),1)
    open(p,'w').write(h)
print('sin velo:',faltan)
