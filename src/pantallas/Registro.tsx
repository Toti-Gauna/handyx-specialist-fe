'use client';
// Crear cuenta (lote 4.2) en tres pasos cortos: email, contraseña (con medidor) y aceptaciones (sin tildar). Al crearla,
// el servidor manda el código de 6 números al email y la cuenta sigue en Verificar. La respuesta es neutra: si el email
// ya tenía cuenta no se dice, y no se abre sesión.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { BotonesProveedor } from '../components/BotonesProveedor.tsx';
import { CampoClave, CasillasLegales, Escena } from '../components/Cuenta.tsx';
import { Aviso, Campo, Pasos } from '../components/ui.tsx';
import { REGLAS_CLAVE, type ResultadoProveedor } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { BarraSuperior } from '../kit/Navegacion.tsx';
import { destinoCuenta } from '../lib/destino.ts';
import { PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../lib/etiquetas.ts';
import { enfocarPrimerError } from '../lib/foco.ts';

const PASOS = ['Tu email', 'Tu contraseña', 'Aceptaciones'];
type Errores = Partial<Record<'email' | 'password' | 'terminos' | 'privacidad', string>>;

export function Registro() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion();
  const [paso, setPaso] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terminos, setTerminos] = useState(false); // nunca tildado por defecto
  const [privacidad, setPrivacidad] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [neutra, setNeutra] = useState(false);

  async function siguiente(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err: Errores = {};
    if (paso === 0 && !/^\S+@\S+\.\S+$/.test(email.trim())) err.email = 'Escribí un email válido.';
    if (paso === 1 && password.length < REGLAS_CLAVE.minimo) err.password = `Usá al menos ${REGLAS_CLAVE.minimo} caracteres.`;
    if (paso === 2 && !terminos) err.terminos = 'Para crear tu cuenta tenés que aceptar los términos.';
    if (paso === 2 && !privacidad) err.privacidad = 'Para crear tu cuenta tenés que aceptar el aviso de privacidad.';
    setErrores(err);
    if (Object.keys(err).length > 0) return enfocarPrimerError(form);
    if (paso < 2) return setPaso(paso + 1);

    const r = await ejecutar(async () => {
      await api.registrar({ email: email.trim(), password, terminos: TERMINOS_VERSION, privacidad: PRIVACIDAD_VERSION });
      return api.sesion();
    });
    // Solo una cuenta nueva queda con sesión (y con el código enviado). Si no, la respuesta es neutra.
    if (r.ok) {
      if (r.valor) router.replace(RUTAS.verificar.ruta);
      else setNeutra(true);
    }
  }

  async function conProveedor(r: ResultadoProveedor) {
    router.replace(r.cuentaNueva ? RUTAS.aceptar.ruta : await destinoCuenta());
  }

  if (neutra) {
    return (
      <>
        <Escena tono="clara" handy="llave" alto={150} iconos={['enviar', 'candado', 'check']} />
        <h1 className="hx-titulo cu-titulo">
          Revisá tu <span className="hx-marca">correo</span>
        </h1>
        <Aviso tono="azul" role="status">
          Si ese email no tenía una cuenta, te mandamos un código para crearla. Si ya tenías una, no la modificamos: entrá con tu contraseña o recuperala.
        </Aviso>
        <Link className="boton boton--bloque" href={RUTAS.acceso.ruta}>
          Ir a Entrar
        </Link>
      </>
    );
  }

  return (
    <>
      <BarraSuperior titulo="Crear cuenta" atras={paso === 0 ? RUTAS.bienvenida.ruta : undefined} textoAtras="Volver a la bienvenida" acciones={null} />
      <Pasos actual={paso} pasos={PASOS} />
      <form className="cu-form" onSubmit={(e) => void siguiente(e)} noValidate>
        {paso === 0 ? (
          <>
            <h2 className="hx-titulo cu-titulo">
              ¿Cuál es tu <span className="hx-marca">email</span>?
            </h2>
            <BotonesProveedor onEntrar={(r) => void conProveedor(r)} />
            <Campo etiqueta="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errores.email} ayuda="Te vamos a mandar un código para verificarlo." required />
          </>
        ) : null}
        {paso === 1 ? (
          <>
            <h2 className="hx-titulo cu-titulo">
              Creá una <span className="hx-marca">contraseña</span>
            </h2>
            <p className="cu-bajada">Mínimo {REGLAS_CLAVE.minimo} caracteres. Una frase es fácil de recordar y difícil de adivinar.</p>
            <CampoClave etiqueta="Contraseña" valor={password} onCambio={setPassword} nueva email={email} error={errores.password} />
          </>
        ) : null}
        {paso === 2 ? (
          <>
            <h2 className="hx-titulo cu-titulo">
              Un <span className="hx-marca">último</span> paso
            </h2>
            <p className="cu-bajada">Crear la cuenta no te habilita para recibir pedidos: después completás tu alta y Operations la revisa.</p>
            {fallo ? (
              <Aviso tono="error" icono="alerta" role="alert">
                {fallo.tipo === 'red' || fallo.tipo === 'timeout' ? 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.' : 'No pudimos crear la cuenta. Revisá los datos y probá de nuevo.'}
              </Aviso>
            ) : null}
            <CasillasLegales terminos={terminos} privacidad={privacidad} onTerminos={setTerminos} onPrivacidad={setPrivacidad} errores={errores} />
          </>
        ) : null}
        <div className="botones botones--fila">
          {paso > 0 ? (
            <button type="button" className="boton boton--claro" onClick={() => setPaso(paso - 1)}>
              Atrás
            </button>
          ) : null}
          <button type="submit" className="boton" disabled={pendiente}>
            {paso < 2 ? 'Siguiente' : pendiente ? 'Creando…' : 'Crear cuenta'}
          </button>
        </div>
      </form>
      {paso === 0 ? (
        <p className="cu-enlaces">
          <span>
            ¿Ya tenés cuenta? <Link href={RUTAS.acceso.ruta}>Entrar</Link>
          </span>
        </p>
      ) : null}
    </>
  );
}
