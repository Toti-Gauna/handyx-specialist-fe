'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FalloApi } from '../data/errores.ts';
import { destinoCuenta } from '../lib/destino.ts';
import { ErrorCaja } from './Estados.tsx';
import { PantallaCarga } from './PantallaCarga.tsx';

// Entrada de la app: la pantalla de carga mientras se decide a dónde ir. Se va cuando terminan las dos cosas.
// Si la API falla se muestra el error con "Reintentar": nunca se continúa con datos de muestra.
export function Puerta() {
  const router = useRouter();
  const [ruta, setRuta] = useState<string | null>(null);
  const [fallo, setFallo] = useState<FalloApi | null>(null);
  const [cargaLista, setCargaLista] = useState(false);

  const decidir = useCallback(async () => {
    setFallo(null);
    try {
      setRuta(await destinoCuenta());
    } catch (e) {
      setFallo(e instanceof FalloApi ? e : new FalloApi('servidor'));
    }
  }, []);

  useEffect(() => {
    void decidir();
  }, [decidir]);

  useEffect(() => {
    if (cargaLista && ruta) router.replace(ruta);
  }, [cargaLista, ruta, router]);

  return (
    <>
      {cargaLista ? null : <PantallaCarga onFin={() => setCargaLista(true)} />}
      {fallo && cargaLista ? (
        <ErrorCaja fallo={fallo} onReintentar={() => void decidir()} />
      ) : (
        // Solo para lectores de pantalla: a la vista queda la pantalla de carga, sin texto ni bloques detrás.
        <p className="visualmente-oculto" role="status">
          Cargando…
        </p>
      )}
    </>
  );
}
