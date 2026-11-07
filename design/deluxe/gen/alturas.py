# Tableros que, con las fuentes reales, necesitan más alto para que nada quede bajo los botones fijos.
import re
ALTO = {'D6-Alta':880,'F-Obra':1130,'F-ObraRepuestos':870,'H0-ModoAyuda':900,'H0-Precios':870,'RG-8':900}
for f,a in ALTO.items():
    p=f'deluxe/project/{f}.dc.html'; s=open(p).read()
    m=re.search(r'"width":390,"height":(\d+)', s); h=int(m[1])
    if a<=h: continue
    s=s.replace(f'width: 390px; height: {h}px;', f'width: 390px; height: {a}px;',1).replace(f'"width":390,"height":{h}', f'"width":390,"height":{a}')
    open(p,'w').write(s)
print('ok')
