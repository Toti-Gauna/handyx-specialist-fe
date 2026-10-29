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
  const c = useCarga(async () => ((await api.sesion()) ? api.perfil() : null), [], { cadaMs: 60_000 });
  const perfil = c.datos;
  const valor = useMemo(() => (perfil ? { perfil, recargar: c.recargar } : null), [perfil, c.recargar]);

  useEffect(() => {
    if (c.estado === 'ok' && perfil === null) router.replace(RUTAS.acceso.ruta);
    if (perfil?.baja && perfil.baja !== 'cancelada') router.replace(RUTAS.baja.ruta);
  }, [c.estado, perfil, router]);

  if (c.fallo && !perfil) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!valor) return <Cargando />;
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePerfil(): CtxPerfil {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePerfil necesita <GuardiaApp>');
  return v;
}
