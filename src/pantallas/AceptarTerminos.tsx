'use client';
// Un paso más (lote 4.2): una cuenta nueva que entró con Google o Apple acepta términos y privacidad antes de seguir.
// El email ya viene verificado por el proveedor: no hace falta el código.
import { api } from '@handyx/origen-datos';
import { useState, type FormEvent } from 'react';
import { CasillasLegales, CuentaCreada, Escena } from '../components/Cuenta.tsx';
import { Aviso } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../lib/etiquetas.ts';
import { enfocarPrimerError } from '../lib/foco.ts';

export function AceptarTerminos() {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [terminos, setTerminos] = useState(false); // nunca tildado por defecto
  const [privacidad, setPrivacidad] = useState(false);
  const [errores, setErrores] = useState<{ terminos?: string; privacidad?: string }>({});
  const [listo, setListo] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err: { terminos?: string; privacidad?: string } = {};
    if (!terminos) err.terminos = 'Para seguir tenés que aceptar los términos.';
    if (!privacidad) err.privacidad = 'Para seguir tenés que aceptar el aviso de privacidad.';
    setErrores(err);
    if (Object.keys(err).length > 0) return enfocarPrimerError(form);
    const r = await ejecutar(() => api.aceptarTerminos({ terminos: TERMINOS_VERSION, privacidad: PRIVACIDAD_VERSION }));
    if (r.ok) setListo(true);
  }

  if (listo) return <CuentaCreada />;
  return (
    <>
      <Escena tono="noche" handy="engranaje" alto={130} iconos={['escudo', 'check', 'llave']} />
      <form className="cu-form" onSubmit={(e) => void enviar(e)} noValidate>
        <div className="cu-cabecera">
          <h1 className="hx-titulo cu-titulo">
            Un paso <span className="hx-marca">más</span>
          </h1>
          <p className="cu-bajada">Es tu primera vez en Handyx. Antes de seguir, leé y aceptá los términos y el aviso de privacidad.</p>
        </div>
        {fallo ? (
          <Aviso tono="error" icono="alerta" role="alert">
            {fallo.tipo === 'red' || fallo.tipo === 'timeout' ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' : 'No pudimos guardar tus aceptaciones. Probá de nuevo.'}
          </Aviso>
        ) : null}
        <CasillasLegales terminos={terminos} privacidad={privacidad} onTerminos={setTerminos} onPrivacidad={setPrivacidad} errores={errores} />
        <button type="submit" className="boton boton--bloque" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Aceptar y seguir'}
        </button>
      </form>
    </>
  );
}
