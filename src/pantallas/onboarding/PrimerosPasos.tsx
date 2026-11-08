'use client';
// OB-PrimerosPasos (lote 1.2). Lo que conviene hacer para arrancar bien; ninguno es obligatorio para recibir pedidos.
// Cada fila lleva a su pantalla; lo hecho lo marca el servidor (y se dice «Hecho» en texto, no solo tachado).
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { PrimerPaso } from '../../contracts/registro.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { plural, PRIMER_PASO } from '../../lib/registro.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Anillo } from '../../ui/atomos/Progreso.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { FilaTarea } from '../../ui/moleculas/Tareas.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import './onboarding.css';

// Pantallas de destino. Las que todavía no existen (perfil, lista de precios, equipamiento, manual) van a la más
// cercana hasta que sus lotes las hagan (1.4, 2.2, 2.4 y 3.4).
const DESTINO: Record<PrimerPaso, string> = {
  perfil: RUTAS.cuenta.ruta,
  zonas_horarios: RUTAS.disponibilidad.ruta,
  cobros: RUTAS.cuentaCobros.ruta,
  lista_precios: RUTAS.taller.ruta,
  equipamiento: RUTAS.taller.ruta,
  manual: RUTAS.soporte.ruta,
};

export function PrimerosPasos() {
  const c = useCarga(() => api.onboarding(), []);
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const pasos = c.datos.pasos;
  const hechos = pasos.filter((p) => p.hecho).length;
  const quedan = pasos.length - hechos;
  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Primeros pasos" subtitulo="Paso 3 de 3" hrefVolver={RUTAS.obComoFunciona.ruta} />}
      accion={
        <AccionFija>
          <BotonEnlace href={RUTAS.inicio.ruta}>Ir al inicio y ponerme disponible</BotonEnlace>
        </AccionFija>
      }
    >
      <section className="ob-avance">
        <Anillo hechas={hechos} total={pasos.length} unidad="pasos hechos" />
        <span className="ob-avance__texto">
          <Etiqueta>PARA ARRANCAR BIEN</Etiqueta>
          <h1 className="ui-titulo ui-titulo--medio">{quedan ? `Te ${quedan === 1 ? 'queda' : 'quedan'} ${plural(quedan, 'cosa', 'cosas')}` : '¡Hiciste todo!'}</h1>
          <span className="ob-nota">Ninguna es obligatoria para recibir pedidos.</span>
        </span>
      </section>
      <Tarjeta etiqueta="Primeros pasos">
        {pasos.map((p) => (
          <FilaTarea key={p.paso} {...PRIMER_PASO[p.paso]} hecha={p.hecho} href={DESTINO[p.paso]} />
        ))}
      </Tarjeta>
    </PantallaSecundaria>
  );
}
