'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { FeeAviso } from '../components/FeeAvisoRegistro.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Campo, Casilla } from '../components/ui.tsx';
import { REGLAS_CLAVE } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { AVISO_PROVISORIO, PRIVACIDAD, TERMINOS } from '../lib/legales.ts';
import { PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../lib/etiquetas.ts';

type Errores = Partial<Record<'email' | 'password' | 'terminos' | 'privacidad', string>>;

export function Registro() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terminos, setTerminos] = useState(false); // nunca tildado por defecto
  const [privacidad, setPrivacidad] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [lectura, setLectura] = useState<'terminos' | 'privacidad' | null>(null);
  const [resultado, setResultado] = useState<'creada' | 'neutra' | null>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const err: Errores = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) err.email = 'Escribí un email válido.';
    if (password.length < REGLAS_CLAVE.minimo) err.password = `Usá al menos ${REGLAS_CLAVE.minimo} caracteres.`;
    if (!terminos) err.terminos = 'Para crear tu cuenta tenés que aceptar los términos.';
    if (!privacidad) err.privacidad = 'Para crear tu cuenta tenés que aceptar el aviso de privacidad.';
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const r = await ejecutar(async () => {
      await api.registrar({ email: email.trim(), password, terminos: TERMINOS_VERSION, privacidad: PRIVACIDAD_VERSION });
      return api.sesion();
    });
    // La respuesta del servidor es la misma exista o no la cuenta: solo una cuenta nueva queda con sesión.
    if (r.ok) setResultado(r.valor ? 'creada' : 'neutra');
  }

  if (resultado === 'creada') {
    return (
      <div className="pila">
        <h1 className="titulo">¡Tu cuenta está creada!</h1>
        <FeeAviso />
        <Aviso tono="neutro" icono="info">
          Crear la cuenta no te habilita para recibir pedidos: primero completás tu alta y Operations la revisa.
        </Aviso>
        <button type="button" className="boton boton--bloque" onClick={() => router.replace(RUTAS.puerta.ruta)}>
          Completar mi alta
        </button>
      </div>
    );
  }
  if (resultado === 'neutra') {
    return (
      <div className="pila">
        <h1 className="titulo">Listo</h1>
        <Aviso tono="azul" role="status">
          Si ese email no tenía una cuenta, la creamos. Si ya tenías una, no la modificamos: entrá con tu contraseña o recuperala.
        </Aviso>
        <Link className="boton boton--bloque" href={RUTAS.acceso.ruta}>
          Ir a Entrar
        </Link>
      </div>
    );
  }

  return (
    <form className="pila" onSubmit={(e) => void enviar(e)} noValidate>
      <Volver a={RUTAS.acceso.ruta} texto="Entrar" />
      <h1 className="titulo">Crear tu cuenta</h1>
      <p className="texto-suave">Con tu cuenta completás el alta. No es un registro de interés: para recibir pedidos tu alta tiene que estar habilitada.</p>
      {fallo ? (
        <Aviso tono="error" icono="alerta" role="alert">
          {fallo.tipo === 'red' || fallo.tipo === 'timeout' ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' : 'No pudimos crear la cuenta. Revisá los datos y probá de nuevo.'}
        </Aviso>
      ) : null}
      <Campo etiqueta="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errores.email} required />
      <Campo etiqueta="Contraseña" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} ayuda={`Mínimo ${REGLAS_CLAVE.minimo} caracteres. Podés usar una frase.`} error={errores.password} required />
      <Casilla
        etiqueta={
          <>
            Leí y acepto los{' '}
            <button type="button" className="enlace" onClick={() => setLectura('terminos')}>
              términos del servicio
            </button>
            .
          </>
        }
        checked={terminos}
        onChange={(e) => setTerminos(e.target.checked)}
        error={errores.terminos}
      />
      <Casilla
        etiqueta={
          <>
            Leí el{' '}
            <button type="button" className="enlace" onClick={() => setLectura('privacidad')}>
              aviso de privacidad
            </button>{' '}
            y acepto el tratamiento de mis datos.
          </>
        }
        checked={privacidad}
        onChange={(e) => setPrivacidad(e.target.checked)}
        error={errores.privacidad}
      />
      <button type="submit" className="boton boton--bloque" disabled={pendiente}>
        {pendiente ? 'Creando…' : 'Crear cuenta'}
      </button>
      <Hoja abierta={lectura !== null} titulo={lectura === 'terminos' ? 'Términos del servicio' : 'Aviso de privacidad'} onCerrar={() => setLectura(null)}>
        <Aviso tono="aviso" icono="alerta">
          {AVISO_PROVISORIO}
        </Aviso>
        <ul>
          {(lectura === 'terminos' ? TERMINOS : PRIVACIDAD).map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="texto-suave texto-chico">Versión: {lectura === 'terminos' ? TERMINOS_VERSION : PRIVACIDAD_VERSION}</p>
        <button type="button" className="boton boton--claro boton--bloque" onClick={() => setLectura(null)}>
          Cerrar
        </button>
      </Hoja>
    </form>
  );
}
