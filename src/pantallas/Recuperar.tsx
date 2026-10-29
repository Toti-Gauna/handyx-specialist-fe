'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { ErrorCaja } from '../components/Estados.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Campo } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';

export function Recuperar() {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = await ejecutar(() => api.recuperar(email.trim()));
    if (r.ok) setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="pila">
        <h1 className="titulo">Revisá tu correo</h1>
        <Aviso tono="exito" icono="checkCirculo" role="status">
          Si ese email tiene una cuenta, te enviamos las instrucciones para elegir una contraseña nueva. Por seguridad no te decimos si la cuenta existe.
        </Aviso>
        <Link className="boton boton--bloque" href={RUTAS.acceso.ruta}>
          Volver a Entrar
        </Link>
      </div>
    );
  }
  return (
    <form className="pila" onSubmit={(e) => void enviar(e)} noValidate>
      <Volver a={RUTAS.acceso.ruta} texto="Entrar" />
      <h1 className="titulo">Recuperar el acceso</h1>
      <p className="texto-suave">Escribí el email de tu cuenta y te mandamos cómo elegir una contraseña nueva.</p>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <Campo etiqueta="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button type="submit" className="boton boton--bloque" disabled={pendiente || !email}>
        {pendiente ? 'Enviando…' : 'Enviar instrucciones'}
      </button>
    </form>
  );
}
