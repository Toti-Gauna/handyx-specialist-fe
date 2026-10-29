'use client';
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { RUTAS } from '../app/rutas.ts';
import type { PerfilEspecialista } from '../contracts/dto.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { Cargando, ErrorCaja } from './Estados.tsx';

interface CtxPerfil {
  perfil: PerfilEspecialista;
  recargar(): Promise<void>;
}
const Ctx = createContext<CtxPerfil | null>(null);

/**
 * Exige sesión para todo lo que cuelga de (app). Sin sesión va a Entrar; con una baja en curso, a su estado.
 * Un error de red o del servidor se muestra con reintento: nunca se continúa con datos de muestra.
 */
export function GuardiaApp({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Se vuelve a pedir cada minuto: el alta la cambia Operations, no la persona (habilitación, corrección, rechazo).
  // Una cuenta a medio crear (email sin verificar o términos sin aceptar) vuelve a terminarla antes de entrar.
  const c = useCarga(
    async () => {
      const s = await api.sesion();
      if (!s) return null;
      if (!s.cuenta.emailVerificado) return 'verificar' as const;
      if (!s.cuenta.terminosAceptados) return 'aceptar' as const;
      return api.perfil();
    },
    [],
    { cadaMs: 60_000 },
  );
  const perfil = typeof c.datos === 'string' ? null : c.datos;
  const valor = useMemo(() => (perfil ? { perfil, recargar: c.recargar } : null), [perfil, c.recargar]);

  useEffect(() => {
    if (c.estado === 'ok' && c.datos === null) router.replace(RUTAS.acceso.ruta);
    if (c.datos === 'verificar') router.replace(RUTAS.verificar.ruta);
    if (c.datos === 'aceptar') router.replace(RUTAS.aceptar.ruta);
    if (perfil?.baja && perfil.baja !== 'cancelada') router.replace(RUTAS.baja.ruta);
  }, [c.estado, c.datos, perfil, router]);

  if (c.fallo && !perfil) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!valor) return <Cargando />;
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePerfil(): CtxPerfil {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePerfil necesita <GuardiaApp>');
  return v;
}
