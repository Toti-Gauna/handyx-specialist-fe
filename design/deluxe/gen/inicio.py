import sys
out = sys.argv[1]
bloques = []
for fila in range(12):
    for col in range(5):
        x = -20 + col * 66
        y = 60 + fila * 66
        verde = (fila, col) == (5, 2)
        fondo = '#DCEBD8' if verde else '#ECE5D6'
        bloques.append(f'<div style="position: absolute; left: {x}px; top: {y}px; width: 54px; height: 54px; border-radius: 10px; background: {fondo}"></div>')
mapa = "\n    ".join(bloques)
html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>C · Inicio con mapa</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..900&amp;family=DM+Sans:opsz,wght@9..40,400..800&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#1F57A8}}a:hover{{color:#143E7E}}
</style>
</helmet>
<div style="width: 390px; height: 844px; box-sizing: border-box; background: #F7F3EA; font-family: 'DM Sans', system-ui, sans-serif; color: #0E1D36; overflow: hidden; position: relative">
  <div aria-hidden="true" style="position: absolute; inset: 0">
    {mapa}
    <div style="position: absolute; top: 0; bottom: 0; left: 316px; width: 22px; background: #F2E6CF"></div>
    <div style="position: absolute; top: 0; bottom: 0; left: 338px; right: 0; background: #CFE3F7"></div>
    <div style="position: absolute; top: 300px; left: 352px; transform: rotate(90deg); transform-origin: left top; font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%; font-size: 11px; letter-spacing: 4px; color: #1F57A8; white-space: nowrap">MAR ARGENTINO</div>
    <div style="position: absolute; top: 330px; left: 104px; font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%; font-size: 12px; letter-spacing: 3px; color: #A99A7C">LA PERLA</div>
    <div style="position: absolute; top: 198px; left: 150px; width: 120px; height: 120px; border-radius: 50%; background: rgba(31,87,168,0.12); border: 2px dashed #1F57A8"></div>
    <div style="position: absolute; top: 244px; left: 196px; padding: 4px 10px; border-radius: 999px; background: #1F57A8; color: #FFFFFF; font-size: 11px; font-weight: 800">Pedido</div>
    <div style="position: absolute; top: 386px; left: 86px; width: 20px; height: 20px; border-radius: 50%; background: #1F57A8; border: 3px solid #FFFFFF; box-shadow: 0 0 0 10px rgba(31,87,168,0.18)"></div>
  </div>

  <header style="position: absolute; top: 14px; left: 14px; right: 14px; display: flex; align-items: center; justify-content: space-between; padding: 8px 8px 8px 18px; border-radius: 26px; background: #FFFFFF; box-shadow: 0 18px 34px -18px rgba(31,87,168,0.55)">
    <span style="display: flex; flex-direction: column">
      <span style="font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%; font-size: 22px; line-height: 1; color: #1F57A8">Handyx</span>
      <span style="font-size: 10px; font-weight: 700; color: #5F6B84">Soluciones, no problemas</span>
    </span>
    <span style="display: flex; gap: 8px">
      <button aria-label="Avisos" style="width: 44px; height: 44px; border-radius: 50%; border: 0; background: #EAF3FC; display: flex; align-items: center; justify-content: center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F57A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2Z"></path><path d="M10 21h4"></path></svg>
      </button>
      <button aria-label="Mis zonas" style="width: 44px; height: 44px; border-radius: 50%; border: 0; background: #EAF3FC; display: flex; align-items: center; justify-content: center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F57A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Z"></path><circle cx="12" cy="9.5" r="2.5"></circle></svg>
      </button>
    </span>
  </header>

  <button style="position: absolute; top: 90px; right: 14px; display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 16px; border: 0; border-radius: 999px; background: #0E1D36; color: #FFFFFF; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 800; box-shadow: 0 0 0 3px #F5F59A, 0 16px 30px -14px rgba(14,29,54,0.6)">
    Disponible
    <span style="width: 52px; height: 30px; border-radius: 15px; background: #F5F59A; position: relative; display: block">
      <span style="position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: #0E1D36; display: block"></span>
    </span>
  </button>

  <section style="position: absolute; left: 0; right: 0; bottom: 0; height: 430px; padding: 10px 18px 0; box-sizing: border-box; border-radius: 30px 30px 0 0; background: #FFFFFF; box-shadow: 0 -20px 40px -24px rgba(31,87,168,0.5); display: flex; flex-direction: column; gap: 12px">
    <div style="align-self: center; width: 44px; height: 5px; border-radius: 3px; background: #D5DCE6"></div>
    <div style="display: flex; align-items: baseline; justify-content: space-between">
      <h1 style="margin: 0; font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%; font-size: 26px; letter-spacing: -0.5px">Pedidos para vos</h1>
      <span style="font-size: 12px; font-weight: 700; color: #5F6B84">1 urgente</span>
    </div>
    <div style="padding: 16px; border-radius: 22px; background: #EAF3FC; display: flex; flex-direction: column; gap: 6px">
      <span style="align-self: flex-start; padding: 4px 10px; border-radius: 999px; background: #FFFFFF; color: #143E7E; font-size: 12px; font-weight: 800">Urgente · quedan 18:42</span>
      <strong style="font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 120%; font-size: 22px">Plomería</strong>
      <span style="font-size: 14px; color: #26324A">Pierde la canilla de la cocina · Centro, zona aproximada</span>
      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px">
        <span style="display: flex; flex-direction: column"><span style="font-size: 11px; color: #5F6B84; font-weight: 700">Handyx sugiere</span><span style="font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%; font-size: 24px">$ 45.000</span></span>
        <a href="C-Precio.dc.html" style="display: flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border-radius: 999px; background: #1F57A8; color: #FFFFFF; font-weight: 800; text-decoration: none">Ver y cotizar</a>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">
      <a href="C-Ingresos.dc.html" style="padding: 14px; border-radius: 20px; background: #F2E6CF; color: #0E1D36; text-decoration: none; display: flex; flex-direction: column; gap: 2px">
        <span style="font-size: 12px; color: #6B5A3A">Neto de noviembre</span>
        <span style="font-family: 'Archivo', sans-serif; font-weight: 900; font-stretch: 125%; font-size: 20px">$ 239.500</span>
      </a>
      <a href="C-Regalo.dc.html" style="padding: 14px; border-radius: 20px; background: #CFE3F7; color: #0E1D36; text-decoration: none; display: flex; flex-direction: column; gap: 6px">
        <span style="font-size: 12px; color: #143E7E">Tu camino · 8 de 10</span>
        <div style="height: 6px; border-radius: 3px; background: #FFFFFF"><div style="width: 80%; height: 6px; border-radius: 3px; background: #1F57A8"></div></div>
        <span style="font-size: 12px; color: #143E7E">2 trabajos para la gorra</span>
      </a>
    </div>
  </section>

  NAV
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":844}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
'''
open(out, 'w').write(html)
