'use client';
// Recuperar el acceso (lote 4.2): se pide el enlace y la respuesta es neutra (no dice si la cuenta existe).
// El enlace del email abre Contraseña nueva (RecuperarNueva).
import { api, ayudasPrueba } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Escena } from '../components/Cuenta.tsx';
import { ErrorCaja } from '../components/Estados.tsx';
import { Aviso, Campo } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { BarraSuperior } from '../kit/Navegacion.tsx';

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
      <>
        <Escena tono="clara" handy="llave" alto={150} iconos={['enviar', 'candado', 'check']} />
        <div className="cu-cabecera">
          <h1 className="hx-titulo cu-titulo">
            Revisá tu <span className="hx-marca">correo</span>
          </h1>
          <p className="cu-bajada">Si ese email tiene una cuenta, te mandamos un enlace para elegir una contraseña nueva. Vence en 30 minutos y sirve una sola vez.</p>
        </div>
        <Aviso tono="neutro" icono="info">
          Por seguridad no te decimos si la cuenta existe. Si no llega, revisá el correo no deseado o pedí otro enlace.
        </Aviso>
        <Link className="boton boton--bloque" href={RUTAS.acceso.ruta}>
          Volver a Entrar
        </Link>
        <button type="button" className="boton boton--fantasma" onClick={() => setEnviado(false)}>
          Pedir otro enlace
        </button>
        {ayudasPrueba ? (
          <Aviso tono="aviso" titulo="Vista previa con datos de prueba">
            <span className="cu-ayuda-prueba">
              No se manda ningún email. Si el email tiene cuenta, abrí el enlace desde acá:
              <Link href={`${RUTAS.recuperarNueva.ruta}?token=${ayudasPrueba.tokenRecuperacion}`}>Abrir el enlace del email</Link>
              <Link href={`${RUTAS.recuperarNueva.ruta}?token=${ayudasPrueba.tokenVencido}`}>Probar un enlace vencido</Link>
            </span>
          </Aviso>
        ) : null}
      </>
    );
  }
  return (
    <>
      <BarraSuperior titulo="Recuperar el acceso" atras={RUTAS.acceso.ruta} textoAtras="Volver a Entrar" />
      <form className="cu-form" onSubmit={(e) => void enviar(e)} noValidate>
        <h2 className="hx-titulo cu-titulo">
          ¿Te olvidaste la <span className="hx-marca">contraseña</span>?
        </h2>
        <p className="cu-bajada">Escribí el email de tu cuenta y te mandamos un enlace para elegir una nueva.</p>
        {fallo ? <ErrorCaja fallo={fallo} /> : null}
        <Campo etiqueta="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type="submit" className="boton boton--bloque" disabled={pendiente || !email}>
          {pendiente ? 'Enviando…' : 'Mandarme el enlace'}
        </button>
      </form>
    </>
  );
}
