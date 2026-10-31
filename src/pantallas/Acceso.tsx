'use client';
// Entrar (lote 4.2): Google (en todos los dispositivos), Apple (solo en dispositivos Apple) o email y contraseña.
// El error de credenciales es genérico: nunca dice si el email tiene cuenta.
import { api, credencialesPrueba } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { BotonesProveedor } from '../components/BotonesProveedor.tsx';
import { CampoClave, Escena } from '../components/Cuenta.tsx';
import { Aviso, Campo } from '../components/ui.tsx';
import type { ResultadoProveedor } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { destinoCuenta } from '../lib/destino.ts';

export function Acceso() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    // El destino se calcula dentro de la acción: el botón se libera con la cuenta ya resuelta.
    const r = await ejecutar(async () => {
      await api.ingresar({ email: email.trim(), password });
      return destinoCuenta();
    });
    if (r.ok) router.replace(r.valor);
  }

  async function conProveedor(r: ResultadoProveedor) {
    router.replace(r.cuentaNueva ? RUTAS.aceptar.ruta : await destinoCuenta());
  }

  const mensaje = !fallo
    ? null
    : fallo.tipo === 'sesion'
      ? 'El email o la contraseña no son correctos.'
      : fallo.tipo === 'limite'
        ? 'Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.'
        : fallo.tipo === 'red' || fallo.tipo === 'timeout'
          ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.'
          : fallo.tipo === 'validacion'
            ? 'Revisá el email y la contraseña.'
            : 'No pudimos iniciar tu sesión. Probá de nuevo en un rato.';

  return (
    <>
      <Escena tono="amarillo" handy="grupo" alto={130} logo />
      {/* Solo la cabecera lee la URL: el resto de la pantalla sale en el HTML exportado y se ve antes de que cargue el JS. */}
      <Suspense fallback={<Cabecera deSesionVencida={false} />}>
        <CabeceraSegunUrl />
      </Suspense>

      <BotonesProveedor onEntrar={(r) => void conProveedor(r)} />

      <form className="cu-form" onSubmit={(e) => void enviar(e)} noValidate>
        {mensaje ? (
          <Aviso tono="error" icono="alerta" role="alert">
            {mensaje}
          </Aviso>
        ) : null}
        <Campo etiqueta="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <CampoClave etiqueta="Contraseña" valor={password} onCambio={setPassword} />
        <button type="submit" className="boton boton--bloque" disabled={pendiente || !email || !password}>
          {pendiente ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="cu-enlaces">
        <Link href={RUTAS.recuperar.ruta}>Olvidé mi contraseña</Link>
        <span>
          ¿Todavía no tenés cuenta? <Link href={RUTAS.registro.ruta}>Crear cuenta</Link>
        </span>
      </p>

      {credencialesPrueba ? (
        <Aviso tono="aviso" titulo="Vista previa con datos de prueba">
          Podés entrar con <strong>{credencialesPrueba.email}</strong> y la contraseña <strong>{credencialesPrueba.password}</strong>.
        </Aviso>
      ) : null}
    </>
  );
}

function CabeceraSegunUrl() {
  return <Cabecera deSesionVencida={useSearchParams().get('motivo') === 'sesion'} />;
}

function Cabecera({ deSesionVencida }: { deSesionVencida: boolean }) {
  return (
    <div className="cu-cabecera">
      <h1 className="hx-titulo cu-titulo">
        {deSesionVencida ? (
          <>
            Hola <span className="hx-marca">de nuevo</span>
          </>
        ) : (
          <>
            Entrá a <span className="hx-marca">Handyx</span>
          </>
        )}
      </h1>
      <p className="cu-bajada">{deSesionVencida ? 'Por seguridad cerramos tu sesión. Lo que ya enviaste está guardado.' : 'La app para especialistas del hogar de Mar del Plata.'}</p>
    </div>
  );
}
