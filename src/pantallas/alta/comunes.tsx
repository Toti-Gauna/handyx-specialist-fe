'use client';
// Piezas compartidas de las pantallas del alta guiada (lote 4.4).
import { useRouter } from 'next/navigation';
import { useCallback, type ReactNode } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Chip } from '../../components/ui.tsx';
import type { DatosAlta, Disponibilidad, PerfilEspecialista } from '../../contracts/dto.ts';
import type { EstadoItem, PasoAlta } from '../../lib/alta.ts';
import { PASOS_ALTA } from '../../lib/alta.ts';
import type { Etiqueta } from '../../lib/etiquetas.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

/** Lo que reciben todos los pasos. `alTerminar` vuelve a la lista con el progreso al día. */
export interface PropsPaso {
  perfil: PerfilEspecialista;
  datos: DatosAlta;
  disponibilidad: Disponibilidad;
  recargar(): Promise<void>;
  alTerminar(): void;
}

export const ESTADO_ITEM: Record<EstadoItem, Etiqueta> = {
  listo: { texto: 'Listo', tono: 'exito', icono: 'checkCirculo' },
  falta: { texto: 'Falta', tono: 'neutro', icono: 'editar' },
  corregir: { texto: 'Corregir', tono: 'error', icono: 'alerta' },
  revision: { texto: 'En revisión', tono: 'azul', icono: 'lupa' },
  opcional: { texto: 'Cuando quieras', tono: 'neutro', icono: 'reloj' },
};

export function ChipItem({ estado }: { estado: EstadoItem }) {
  return <Chip e={ESTADO_ITEM[estado]} />;
}

/** Ir a un paso (o a la lista, o al resumen) dejando el historial: "atrás" del teléfono vuelve donde estabas. */
export function useIrA(): (p: PasoAlta | 'resumen' | null) => void {
  const router = useRouter();
  return useCallback((p) => router.push(p ? `${RUTAS.alta.ruta}?paso=${p}` : RUTAS.alta.ruta), [router]);
}

/** Marco de un paso: barra compacta con "atrás" a la lista y el número de paso. */
export function MarcoPaso({ paso, titulo, children }: { paso: PasoAlta; titulo: string; children: ReactNode }) {
  const n = PASOS_ALTA.indexOf(paso) + 1;
  return (
    <div className="al-paso">
      <BarraSuperior titulo={titulo} atras={RUTAS.alta.ruta} textoAtras="Volver a la lista del alta" acciones={null} />
      <p className="al-paso__n">
        Paso {n} de {PASOS_ALTA.length}
      </p>
      {children}
    </div>
  );
}
