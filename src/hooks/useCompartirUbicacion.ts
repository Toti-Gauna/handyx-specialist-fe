'use client';
// Compartir la ubicación durante el viaje (lote 4.3). Lee el GPS solo después de que el especialista lo pide y solo
// mientras la pantalla está abierta; manda al servidor como mucho una posición cada 5 s (sin cola: si una no sale, va la
// siguiente). Al salir de la pantalla deja de leer el GPS.
import { api, ubicacion } from '@handyx/origen-datos';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSesion } from '../app/contexto.tsx';
import type { Viaje } from '../contracts/dto.ts';
import { FalloApi } from '../data/errores.ts';
import { debeEnviar, senalDe, type Fix, type Senal } from '../lib/geo.ts';
import type { ErrorUbicacion, Lectura } from '../lib/ubicacion.ts';

export interface Comparticion {
  /** Se está leyendo el GPS (el especialista eligió compartir). */
  activa: boolean;
  lectura: Lectura | null;
  senal: Senal;
  /** El servidor no recibió la última posición (sin conexión): la próxima vuelve a intentar. */
  sinEnviar: boolean;
  empezar(): void;
  /** Deja de leer el GPS (el servidor ya dejó de compartir: llegaste o se canceló). */
  parar(): void;
  dejar(): Promise<void>;
}

export function useCompartirUbicacion(trabajoId: string | null, alViaje: (v: Viaje) => void, alTerminar: () => void): Comparticion {
  const { expirarSesion } = useSesion();
  const [activa, setActiva] = useState(false);
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [error, setError] = useState<{ tipo: ErrorUbicacion; enMs: number } | null>(null);
  const [sinEnviar, setSinEnviar] = useState(false);
  const [, setTic] = useState(0);
  const enviado = useRef<Fix | null>(null);
  const enVuelo = useRef(false);
  const parar = useRef<(() => void) | null>(null);
  const avisos = useRef({ alViaje, alTerminar });
  avisos.current = { alViaje, alTerminar };

  const detener = useCallback(() => {
    parar.current?.();
    parar.current = null;
    setActiva(false);
  }, []);

  const enviar = useCallback(
    async (l: Lectura) => {
      if (!trabajoId || enVuelo.current || !debeEnviar(enviado.current, l)) return;
      enVuelo.current = true;
      try {
        const v = await api.enviarPosicion(trabajoId, { punto: l.punto, precisionM: Math.round(l.precisionM), en: new Date(l.enMs).toISOString() });
        enviado.current = l;
        setSinEnviar(false);
        avisos.current.alViaje(v);
      } catch (e) {
        // El trabajo ya no está en camino (llegaste o se canceló): se deja de leer el GPS.
        if (e instanceof FalloApi && e.tipo === 'conflicto') {
          detener();
          avisos.current.alTerminar();
        } else if (e instanceof FalloApi && e.tipo === 'sesion') {
          detener();
          expirarSesion();
        } else setSinEnviar(true);
      } finally {
        enVuelo.current = false;
      }
    },
    [trabajoId, detener, expirarSesion],
  );

  const empezar = useCallback(() => {
    if (parar.current) return;
    setActiva(true);
    setError(null);
    enviado.current = null;
    parar.current = ubicacion.observar(
      (l) => {
        setLectura(l);
        setError(null);
        void enviar(l);
      },
      (tipo) => {
        setError({ tipo, enMs: Date.now() });
        // Sin permiso no hay nada que leer: se suelta el GPS (volver a tocar "Compartir" lo pide de nuevo).
        if (tipo === 'permiso' || tipo === 'no_disponible') detener();
      },
    );
  }, [enviar, detener]);

  const dejar = useCallback(async () => {
    detener();
    if (trabajoId) avisos.current.alViaje(await api.dejarDeCompartir(trabajoId));
  }, [trabajoId, detener]);

  // Al salir de la pantalla se deja de leer el GPS.
  useEffect(() => () => parar.current?.(), []);
  // La señal se vuelve "sin señal" con el paso del tiempo, aunque no llegue nada nuevo.
  useEffect(() => {
    if (!activa) return;
    const id = setInterval(() => setTic((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [activa]);

  const ahora = Date.now();
  const fix = lectura ? { punto: lectura.punto, precisionM: lectura.precisionM, enMs: lectura.enMs } : null;
  let senal: Senal;
  if (error?.tipo === 'permiso') senal = 'sin_permiso';
  else if (error?.tipo === 'no_disponible') senal = 'no_disponible';
  else if (error?.tipo === 'tiempo' && (!fix || error.enMs >= fix.enMs)) senal = 'sin_senal';
  else senal = senalDe(fix, ahora);

  return { activa, lectura, senal, sinEnviar, empezar, parar: detener, dejar };
}
