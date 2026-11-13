'use client';
// T-Taller (lote 2.4, en /taller/herramientas/): las herramientas del teléfono para todos los oficios (medir con la
// cámara, escanear en 3D, nivel y plomada, linterna y lupa, conversor) y, aparte, las de tu oficio. Funcionan sin
// conexión salvo guardar en un trabajo. El rubro sale del perfil; si no carga, se muestra igual (el catálogo es de la
// app, no son datos de prueba).
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import { NOMBRE_RUBRO, type Rubro } from '../../contracts/rubros.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { Chip, Etiqueta, Titulo } from '../../ui/atomos/Texto.tsx';
import { CajaHerramientas } from '../../ui/ilustraciones/Herramientas.tsx';
import { AccesoHerramienta, BandaOficio, GrillaHerramientas } from '../../ui/moleculas/Herramientas.tsx';
import { BarraPestanas } from '../../ui/organismos/BarraPestanas.tsx';
import { PantallaRaiz } from '../../ui/plantillas/Plantillas.tsx';
import { HERRAMIENTAS_ELECTRICIDAD } from './catalogo.ts';
import './herramientas.css';

/** Oficios que todavía no tienen sus herramientas (H2 a H6, después del deploy). */
const PROXIMOS: readonly Rubro[] = ['plomeria', 'gas', 'aire_acondicionado', 'albanileria', 'cerrajeria'];

export function PortalHerramientas() {
  const perfil = useCarga(() => api.perfil(), []);
  const rubros = (perfil.datos?.rubros ?? []).map((r) => r.rubro);
  const electricista = rubros.includes('electricidad');

  return (
    <PantallaRaiz>
      <div className="th-titulo">
        <Etiqueta>Para todos los oficios</Etiqueta>
        <Titulo antes="Herramientas del " marcado="teléfono" />
      </div>
      <div className="ui-portada-taller">
        <CajaHerramientas armar tam="lleno" />
      </div>
      <GrillaHerramientas titulo="Para todos los oficios" id="th-todos">
        <AccesoHerramienta icono="regla" titulo="Medir" detalle="Con la cámara" href={RUTAS.tallerMedir.ruta} destacada insignia="AR" />
        <AccesoHerramienta icono="cubo" titulo="Escanear en 3D" detalle="De fotos a modelo" href={RUTAS.tallerEscanear.ruta} />
        <AccesoHerramienta icono="nivel" titulo="Nivel" detalle="Con el giroscopio" href={RUTAS.tallerNivel.ruta} />
        <AccesoHerramienta icono="plomada" titulo="Plomada y ángulos" detalle="Paredes y columnas" href={`${RUTAS.tallerNivel.ruta}?modo=plomada`} />
        <AccesoHerramienta icono="linterna" titulo="Linterna y lupa" detalle="Flash y zoom" href={RUTAS.tallerLinterna.ruta} />
        <AccesoHerramienta icono="conversor" titulo="Conversor" detalle="Pulgadas, frigorías, bar" href={RUTAS.tallerConversor.ruta} />
      </GrillaHerramientas>
      <BandaOficio icono="rayo" titulo={electricista ? 'Tu oficio: Electricidad' : 'Electricidad'} detalle={`Cables, tablero 3D, informe y ${HERRAMIENTAS_ELECTRICIDAD.length - 3} más`} href={RUTAS.tallerElectricidad.ruta} />
      <section className="th-proximos" aria-labelledby="th-proximos">
        <h2 id="th-proximos" className="th-proximos__titulo">
          Otros oficios · llegan más adelante
        </h2>
        <ul className="th-proximos__lista">
          {PROXIMOS.map((r) => (
            <li key={r}>
              <Chip tono="gris" icono={rubros.includes(r) ? 'estrella' : 'reloj'}>
                {NOMBRE_RUBRO[r]}
                {rubros.includes(r) ? <span className="visualmente-oculto"> (tu oficio)</span> : null}
              </Chip>
            </li>
          ))}
        </ul>
      </section>
      <p className="th-pie">Las medidas y los cálculos son una ayuda: no reemplazan tu criterio ni un certificado.</p>
      <BarraPestanas />
    </PantallaRaiz>
  );
}
