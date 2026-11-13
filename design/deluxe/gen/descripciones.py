# Arma gen/descripciones.json: qué se hace en cada pantalla y cómo se llega (desde los botones reales).
import re, os, json, html, sys
sys.path.insert(0,'gen'); from textos_pantallas import QUE, APARECE
D='deluxe/project/'
pant=[f[:-8] for f in os.listdir(D) if f.endswith('.dc.html') and not re.match(r'(Main|A-|B-|C-|RC-|FL-|UX-)',f)]
def titulo(f):
    t=html.unescape(re.search(r'<title>(.*?)</title>', open(D+f+'.dc.html').read())[1])
    return t.split(' · ',1)[-1]
def limpio(s):
    s=re.sub(r'<svg.*?</svg>','',s,flags=re.S); s=re.sub(r'<[^>]+>',' ',s); return re.sub(r'\s+',' ',html.unescape(s)).strip()
TABS={'Inicio','Obras','Taller','Mensajes','Cuenta'}
entra={p:[] for p in pant}
for f in pant:
    src=open(D+f+'.dc.html').read()
    for m in re.finditer(r'<a\b([^>]*)href="([^"#:]+)\.dc\.html"([^>]*)>(.*?)</a>', src, flags=re.S):
        dest=m[2]
        if dest not in entra or dest==f: continue
        attrs=m[1]+m[3]; txt=limpio(m[4])
        if len(txt)>30:
            partes=[limpio(x) for x in re.split(r'<(?:strong|span|b)\b[^>]*>|</(?:strong|span|b)>', re.sub(r'<svg.*?</svg>','',m[4],flags=re.S))]
            partes=[x for x in partes if x and not re.fullmatch(r'[A-ZÁÉÍÓÚÑ]{2}', x)]
            if partes: txt=partes[0]
        if txt in ('Volver','Atrás','Cancelar','Cerrar') or f in ('D6-Error','D6-Fallo'): continue
        al=re.search(r'aria-label="([^"]+)"',attrs)
        if al and (not txt or len(txt)>40): txt=al[1]
        if txt in ('Volver','Atrás','Cancelar','Cerrar'): continue
        if len(txt)>44: txt=txt[:42].rsplit(' ',1)[0]+'…'
        tab = txt in TABS and src.rfind('<nav aria-label="Secciones"',0,m.start()) > src.rfind('</nav>',0,m.start())
        entra[dest].append(('tab' if tab else 'boton', txt, f))
out={}
for p in pant:
    vias=[]; vistos=set(); tab=False
    for tipo,txt,f in entra[p]:
        if tipo=='tab': tab=True; continue
        clave=(txt,titulo(f))
        if clave in vistos or not txt: continue
        vistos.add(clave); vias.append(f'«{txt}» en {titulo(f)}')
    llegas=[]
    if p in APARECE: llegas.append(APARECE[p])
    if tab: llegas.append(f'Pestaña «{ {"F-Inicio":"Inicio","F-Obras":"Obras","F-Herramientas":"Taller","F-Mensajes":"Mensajes","F-Cuenta":"Cuenta"}.get(p, titulo(p)) }» de la barra de abajo')
    llegas+=vias[:3]
    out[p]={'titulo':titulo(p),'que':QUE.get(p,''),'llegas':llegas}
faltan=[p for p in pant if not QUE.get(p)]; sinvia=[p for p in pant if not out[p]['llegas']]
json.dump(out,open('gen/descripciones.json','w'),ensure_ascii=False,indent=1)
print('sin texto:',faltan); print('sin cómo llegar:',sinvia)
