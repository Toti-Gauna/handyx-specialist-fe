'use client';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Hoja } from '../components/Hoja.tsx';
import { RUTAS } from './rutas.ts';

interface Contexto {
  expirada: boolean;
  /** Una llamada devolvió 401: se muestra el aviso de sesión expirada (no se borra nada del trabajo en pantalla). */
  expirarSesion(): void;
}

const Ctx = createContext<Contexto | null>(null);

export function Proveedor({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [expirada, setExpirada] = useState(false);
  const expirarSesion = useCallback(() => setExpirada(true), []);
  const valor = useMemo(() => ({ expirada, expirarSesion }), [expirada, expirarSesion]);

  return (
    <Ctx.Provider value={valor}>
      {children}
      <Hoja abierta={expirada} titulo="Tu sesión expiró" cerrable={false} onCerrar={() => undefined}>
        <p>Por seguridad cerramos tu sesión. Volvé a entrar para seguir: lo que ya enviaste está guardado.</p>
        <button
          type="button"
          className="boton boton--bloque"
          onClick={() => {
            setExpirada(false);
            router.replace(`${RUTAS.acceso.ruta}?motivo=sesion`);
          }}
        >
          Volver a entrar
        </button>
      </Hoja>
    </Ctx.Provider>
  );
}

export function useSesion(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSesion necesita <Proveedor>');
  return c;
}
