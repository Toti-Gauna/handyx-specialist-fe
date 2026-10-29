'use client';
import { api, credencialesPrueba } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Icono } from '../components/Icono.tsx';
import { Aviso, Campo } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';

export function Acceso() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const r = await ejecutar(() => api.ingresar({ email: email.trim(), password }));
    if (r.ok) router.replace(RUTAS.puerta.ruta); // la puerta decide: inicio, alta o baja
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
    <form className="pila" onSubmit={(e) => void enviar(e)} noValidate>
      <img className="logo-grande" src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/logo-handyx.webp`} alt="Handyx" />
      <h1 className="titulo">Entrá a tu cuenta</h1>
      <p className="texto-suave">App para especialistas del hogar de Mar del Plata.</p>
      {mensaje ? (
        <Aviso tono="error" icono="alerta" role="alert">
          {mensaje}
        </Aviso>
      ) : null}
      <Campo etiqueta="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className="pila pila--chica">
        <Campo etiqueta="Contraseña" type={mostrar ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="button" className="boton boton--fantasma boton--chico" aria-pressed={mostrar} onClick={() => setMostrar((v) => !v)}>
          <Icono nombre="lupa" /> {mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        </button>
      </div>
      <button type="submit" className="boton boton--bloque" disabled={pendiente || !email || !password}>
        {pendiente ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="centrado">
        <Link href={RUTAS.recuperar.ruta}>Olvidé mi contraseña</Link>
      </p>
      <p className="centrado">
        ¿Todavía no tenés cuenta? <Link href={RUTAS.registro.ruta}>Crear cuenta</Link>
      </p>
      {process.env.NEXT_PUBLIC_DATA_SOURCE !== 'http' && credencialesPrueba ? (
        <Aviso tono="aviso" titulo="Vista previa con datos de prueba">
          Podés entrar con <strong>{credencialesPrueba.email}</strong> y la contraseña <strong>{credencialesPrueba.password}</strong>.
        </Aviso>
      ) : null}
    </form>
  );
}
