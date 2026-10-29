'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { api } from '@handyx/origen-datos';
import { FalloApi } from '../data/errores.ts';
import { Icono } from './Icono.tsx';

// Entrada de la app: con sesión va a Inicio (o al alta si no está habilitada); sin sesión, a Entrar.
// Si la API falla se muestra el error con "Reintentar": nunca se continúa con datos de muestra.
export function Puerta() {
  const router = useRouter();
  const [fallo, setFallo] = useState<FalloApi | null>(null);

  const decidir = useCallback(async () => {
    setFallo(null);
    try {
      const sesion = await api.sesion();
      if (!sesion) return router.replace(RUTAS.acceso.ruta);
      const perfil = await api.perfil();
      router.replace(perfil.estadoAlta === 'habilitada' ? RUTAS.inicio.ruta : RUTAS.alta.ruta);
    } catch (e) {
      setFallo(e instanceof FalloApi ? e : new FalloApi('servidor'));
    }
  }, [router]);

  useEffect(() => {
    void decidir();
  }, [decidir]);

  if (!fallo) {
    return (
      <p className="cargando" role="status">
        Cargando…
      </p>
    );
  }
  return (
    <div className="caja-error" role="alert">
      <Icono nombre="alerta" />
      <p>
        {fallo.tipo === 'red' || fallo.tipo === 'timeout'
          ? 'No pudimos conectarnos. Revisá tu conexión.'
          : 'No pudimos cargar tu cuenta.'}
      </p>
      {fallo.requestId ? <p className="texto-suave texto-chico">Referencia: {fallo.requestId}</p> : null}
      <button type="button" className="boton" onClick={() => void decidir()}>
        <Icono nombre="reintentar" /> Reintentar
      </button>
    </div>
  );
}
