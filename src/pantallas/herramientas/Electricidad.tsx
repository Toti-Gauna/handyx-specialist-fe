'use client';
// T-Electricidad (lote 2.4): la puerta a las herramientas del electricista (fase H1). Las tablas están en revisión
// técnica y el teléfono no detecta tensión: se dice arriba, sin letra chica.
import { RUTAS } from '../../app/rutas.ts';
import { AccesoHerramienta, CabeceraOficio, GrillaHerramientas } from '../../ui/moleculas/Herramientas.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { HERRAMIENTAS_ELECTRICIDAD } from './catalogo.ts';
import './herramientas.css';

export function Electricidad() {
  const [primeras, resto] = [HERRAMIENTAS_ELECTRICIDAD.slice(0, 6), HERRAMIENTAS_ELECTRICIDAD.slice(6)];
  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Electricidad" subtitulo="Tu oficio" hrefVolver={RUTAS.tallerHerramientas.ruta} />}>
      <CabeceraOficio icono="rayo" titulo="Herramientas del electricista" detalle="Tablas en revisión técnica. El teléfono no detecta tensión." />
      <GrillaHerramientas titulo="Las que más se usan" id="te-primeras">
        {primeras.map((h, i) => (
          <AccesoHerramienta key={h.id} icono={h.icono} titulo={h.titulo} detalle={h.detalle} href={h.ruta} destacada={i === 0} insignia={h.ar ? 'AR' : undefined} />
        ))}
      </GrillaHerramientas>
      <GrillaHerramientas titulo="Más herramientas" id="te-resto">
        {resto.map((h) => (
          <AccesoHerramienta key={h.id} icono={h.icono} titulo={h.titulo} detalle={h.detalle} href={h.ruta} />
        ))}
      </GrillaHerramientas>
      <p className="th-pie">Los cálculos son una ayuda: no reemplazan tu criterio profesional, la norma ni un certificado.</p>
    </PantallaSecundaria>
  );
}
