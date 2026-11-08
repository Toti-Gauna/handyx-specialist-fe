'use client';
// RG-1 · Tus datos y contraseña (lote 1.2). Crea la cuenta con lo mínimo: nombre, apellido, celular, email y la
// contraseña (12 caracteres o más). Los textos se aceptan con una casilla sin tildar. La respuesta es neutra: si el
// email ya tenía cuenta no se dice; una cuenta nueva sigue con el código al email (D6-Codigo) y después con el paso 2.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { REGLAS_CLAVE } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { fuerzaClave } from '../../lib/clave.ts';
import { PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../../lib/etiquetas.ts';
import { enfocarPrimerError } from '../../lib/foco.ts';
import { normalizarTelefono, NOMBRE_PASO, TOTAL_PASOS } from '../../lib/registro.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Campo, Casilla } from '../../ui/atomos/Controles.tsx';
import { Titulo } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja, AvisoPrivado } from '../../ui/moleculas/Avisos.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { CabeceraPasos } from '../../ui/organismos/CabeceraPasos.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { textoFallo } from './comunes.tsx';
import { HojaTextos } from './HojaTextos.tsx';
import './registro.css';

type CampoCuenta = 'nombre' | 'apellido' | 'telefono' | 'email' | 'password' | 'acepta';

export function CrearCuenta() {
  const router = useRouter();
  const { pendiente, fallo, ejecutar } = useAccion({ publica: true });
  const [v, setV] = useState({ nombre: '', apellido: '', telefono: '', email: '', password: '' });
  const [ver, setVer] = useState(false);
  const [acepta, setAcepta] = useState(false); // nunca tildada por defecto
  const [textos, setTextos] = useState(false);
  const [errores, setErrores] = useState<Partial<Record<CampoCuenta, string>>>({});
  const [neutra, setNeutra] = useState(false);
  const fuerza = fuerzaClave(v.password, v.email);
  const cambiar = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));

  async function crear(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const err: Partial<Record<CampoCuenta, string>> = {};
    const telefono = normalizarTelefono(v.telefono);
    if (!v.nombre.trim()) err.nombre = 'Escribí tu nombre.';
    if (!v.apellido.trim()) err.apellido = 'Escribí tu apellido.';
    if (!telefono) err.telefono = 'Escribí tu celular con la característica, por ejemplo 223 555-4521.';
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) err.email = 'Escribí un email válido, por ejemplo nombre@example.test.';
    if (v.password.length < REGLAS_CLAVE.minimo) err.password = `Usá al menos ${REGLAS_CLAVE.minimo} caracteres.`;
    if (!acepta) err.acepta = 'Para crear tu cuenta tenés que aceptar los términos y el aviso de privacidad.';
    setErrores(err);
    if (Object.keys(err).length > 0) return enfocarPrimerError(form);
    const r = await ejecutar(async () => {
      await api.crearCuenta({ nombre: v.nombre.trim(), apellido: v.apellido.trim(), telefono: telefono ?? '', email: v.email.trim(), password: v.password, terminos: TERMINOS_VERSION, privacidad: PRIVACIDAD_VERSION });
      return api.sesion();
    });
    // Solo una cuenta nueva queda con sesión (y con el código enviado). Si no, la respuesta es neutra.
    if (r.ok) {
      if (r.valor) router.replace(RUTAS.verificar.ruta);
      else setNeutra(true);
    }
  }

  if (neutra) {
    return (
      <PantallaSecundaria barra={<CabeceraPasos paso={1} total={TOTAL_PASOS} nombre={NOMBRE_PASO.datos} hrefVolver={RUTAS.bienvenida.ruta} />}>
        <Titulo antes="Revisá tu " marcado="email" />
        <AvisoCaja tono="info" titulo="Te escribimos">
          Si ese email no tenía cuenta, te mandamos un código para seguir. Si ya tenías una, no la cambiamos: entrá con tu contraseña o recuperala.
        </AvisoCaja>
        <Link className="ui-boton ui-boton--primaria ui-boton--bloque" href={RUTAS.acceso.ruta}>
          <span className="ui-boton__texto">Ir a Entrar</span>
        </Link>
      </PantallaSecundaria>
    );
  }

  return (
    <form className="rg-form" noValidate onSubmit={(e) => void crear(e)}>
      <PantallaSecundaria
        barra={<CabeceraPasos paso={1} total={TOTAL_PASOS} nombre={NOMBRE_PASO.datos} hrefVolver={RUTAS.bienvenida.ruta} />}
        accion={
          <AccionFija>
            <Boton type="submit" ocupado={pendiente} textoOcupado="Creando tu cuenta…">
              Crear mi cuenta
            </Boton>
          </AccionFija>
        }
      >
        <section className="rg-encabezado">
          <Titulo antes="Contanos " marcado="quién sos" />
          <p className="rg-bajada">Así te ven los clientes cuando aceptan tu propuesta.</p>
        </section>
        <div className="rg-par">
          <Campo etiqueta="Nombre" autoComplete="given-name" value={v.nombre} onChange={cambiar('nombre')} error={errores.nombre} maxLength={60} />
          <Campo etiqueta="Apellido" autoComplete="family-name" value={v.apellido} onChange={cambiar('apellido')} error={errores.apellido} maxLength={60} />
        </div>
        <Campo etiqueta="Celular" icono="telefono" type="tel" inputMode="tel" autoComplete="tel-national" value={v.telefono} onChange={cambiar('telefono')} error={errores.telefono} ayuda="Con la característica, sin el 0 ni el 15." />
        <Campo etiqueta="Email" icono="sobre" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={cambiar('email')} error={errores.email} ayuda="Te mandamos un código para verificarlo." />
        <Campo
          etiqueta="Creá una contraseña"
          icono="candado"
          type={ver ? 'text' : 'password'}
          autoComplete="new-password"
          value={v.password}
          onChange={cambiar('password')}
          error={errores.password}
          ayuda={v.password ? `${fuerza.texto}${fuerza.consejo ? `. ${fuerza.consejo}` : ''}` : `Mínimo ${REGLAS_CLAVE.minimo} caracteres. Una frase es fácil de recordar.`}
        />
        <Casilla checked={ver} onChange={(e) => setVer(e.target.checked)}>
          Mostrar la contraseña
        </Casilla>
        <AvisoPrivado>Tus datos se guardan cifrados. Los clientes ven solo tu nombre y tu foto.</AvisoPrivado>
        <div className={`rg-acepta${errores.acepta ? ' rg-acepta--error' : ''}`}>
          <Casilla checked={acepta} onChange={(e) => setAcepta(e.target.checked)} aria-invalid={errores.acepta ? true : undefined}>
            Leí y acepto los términos de uso y el aviso de privacidad.
          </Casilla>
          <Boton variante="texto" bloque={false} onClick={() => setTextos(true)}>
            Leer los textos
          </Boton>
          {errores.acepta ? (
            <p className="rg-error" role="alert">
              {errores.acepta}
            </p>
          ) : null}
        </div>
        {fallo ? (
          <AvisoCaja tono="error" titulo="No pudimos crear tu cuenta">
            {textoFallo(fallo)}
          </AvisoCaja>
        ) : null}
        <p className="rg-enlace">
          ¿Ya tenés cuenta? <Link href={RUTAS.acceso.ruta}>Entrar</Link>
        </p>
      </PantallaSecundaria>
      <HojaTextos abierta={textos} onCerrar={() => setTextos(false)} />
    </form>
  );
}
