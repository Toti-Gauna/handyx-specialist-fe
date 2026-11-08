'use client';
// Hooks del núcleo (lote 1.3).
// - useUbicacionUnaVez: lee la posición una sola vez, cuando la persona lo pide («Medir desde donde estoy»), y deja de
//   leer. Se usa para medir distancias a las zonas aproximadas; la posición va en el cuerpo del pedido y no se guarda.
// - useEventosMapa: con la API real, escucha `GET /mapa/eventos` (SSE, con la cookie de sesión) y avisa para volver a
//   pedir el mapa cuando llega o se retira un pedido. Con el mock no hace nada: el Panel de prueba ya refresca.
import { ubicacion } from '@handyx/origen-datos';
import { useCallback, useEffect, useRef, useState } from 'react';
import { entorno } from '../../config/entorno.ts';
import type { Punto } from '../../contracts/dto.ts';
import { EventoMapaSchema } from '../../contracts/mapa.ts';

export type EstadoUbicacion = 'sin_pedir' | 'buscando' | 'lista' | 'sin_permiso' | 'no_disponible';

export function useUbicacionUnaVez() {
  const [estado, setEstado] = useState<EstadoUbicacion>('sin_pedir');
  const [lectura, setLectura] = useState<{ punto: Punto; precisionM: number } | null>(null);
  const parar = useRef<(() => void) | null>(null);
  useEffect(() => () => parar.current?.(), []);
  const pedir = useCallback(() => {
    parar.current?.();
    setEstado('buscando');
    parar.current = ubicacion.observar(
      (l) => {
        setLectura({ punto: l.punto, precisionM: Math.min(10_000, l.precisionM) });
        setEstado('lista');
        parar.current?.();
        parar.current = null;
      },
      (e) => {
        setEstado(e === 'permiso' ? 'sin_permiso' : 'no_disponible');
        parar.current?.();
        parar.current = null;
      },
    );
  }, []);
  return { estado, lectura, pedir };
}

export function useEventosMapa(activo: boolean, alCambiar: (pedidoNuevo: string | null) => void): void {
  const aviso = useRef(alCambiar);
  aviso.current = alCambiar;
  useEffect(() => {
    if (!activo || entorno.origen !== 'http' || typeof EventSource === 'undefined') return;
    const fuente = new EventSource(`${entorno.apiBaseUrl}/v1/especialista/mapa/eventos`, { withCredentials: true });
    fuente.onmessage = (m) => {
      let datos: unknown;
      try {
        datos = JSON.parse(String(m.data));
      } catch {
        return;
      }
      const e = EventoMapaSchema.safeParse(datos);
      if (!e.success || e.data.tipo === 'latido' || e.data.tipo === 'busqueda_nueva') return;
      aviso.current(e.data.tipo === 'pedido_nuevo' ? e.data.pedido.id : null);
    };
    // Si se corta, el navegador reintenta solo; mientras tanto, el Inicio sigue consultando cada tanto.
    return () => fuente.close();
  }, [activo]);
}
