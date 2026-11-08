'use client';
// Piezas comunes de las pantallas del Modo trabajo y del cierre (lote 2.3): cargar el trabajo con su Modo, los estados
// de «no se puede abrir» y las rutas con el id del trabajo.
import { api } from '@handyx/origen-datos';
import { RUTAS, type ClaveRuta } from '../../app/rutas.ts';
import type { TrabajoDetalle } from '../../contracts/dto.ts';
import type { ModoTrabajo } from '../../contracts/modo-trabajo.ts';
import type { FalloApi } from '../../data/errores.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { PantallaFallo } from '../nucleo/Fallo.tsx';

/** Ruta de una pantalla con el id del trabajo (y otros parámetros, si hacen falta). */
export const conId = (clave: ClaveRuta, id: string, extra = ''): string => `${RUTAS[clave].ruta}?id=${encodeURIComponent(id)}${extra}`;

/** El trabajo y su Modo. Si el trabajo todavía no empezó, `modo` es null (el servidor responde 409). */
export function useTrabajoConModo(id: string | null) {
  return useCarga(async () => {
    if (!id) return null;
    const detalle = await api.trabajo(id);
    let modo: ModoTrabajo | null = null;
    try {
      modo = await api.modoTrabajo(id);
    } catch (e) {
      if ((e as FalloApi).tipo !== 'conflicto') throw e;
    }
    return { detalle, modo };
  }, [id]);
}

/** Sin id, trabajo ajeno o inexistente: lo mismo (no revela nada). */
export function SinTrabajo({ titulo }: { titulo: string }) {
  return (
    <PantallaSecundaria barra={<BarraCompacta titulo={titulo} hrefVolver={RUTAS.inicio.ruta} />}>
      <p>No encontramos ese trabajo.</p>
      <BotonEnlace href={RUTAS.trabajos.ruta}>Ver mis trabajos</BotonEnlace>
    </PantallaSecundaria>
  );
}

/** Mientras carga: lugar vacío con aria-busy (sin esqueletos animados con «reducir movimiento»). */
export const Cargando = () => <div className="mt-vacio" aria-busy="true" />;

/** Primero lo que no deja ver la pantalla; devuelve null si hay datos para mostrar. */
export function estadoCarga(c: { datos: unknown; fallo: FalloApi | null; recargar(): Promise<void> }, id: string | null, titulo: string) {
  if (!id || (c.fallo?.tipo === 'no_encontrado' && !c.datos)) return <SinTrabajo titulo={titulo} />;
  if (c.fallo && !c.datos) return <PantallaFallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return null;
}

/** "Lucía Ferreyra · hasta las 20". */
export function subtituloTrabajo(d: TrabajoDetalle, hora: (iso: string) => string): string {
  const fin = d.trabajo.acuerdo.horario.fin;
  return fin ? `${d.contraparte} · hasta las ${hora(fin)}` : d.contraparte;
}
