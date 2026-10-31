'use client';
// Piezas compartidas de las pantallas de cuenta (lote 4.2): escena de color con los Handys, contraseña con "Mostrar" y
// medidor, aceptaciones legales con su lectura, y la pantalla de cuenta creada.
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { useConfeti } from '../kit/Efectos.tsx';
import { BotonFijo, Tilde } from '../kit/Piezas.tsx';
import { fuerzaClave } from '../lib/clave.ts';
import { AVISO_PROVISORIO, PRIVACIDAD, TERMINOS } from '../lib/legales.ts';
import { PRIVACIDAD_VERSION, TERMINOS_VERSION } from '../lib/etiquetas.ts';
import { FeeAviso } from './FeeAvisoRegistro.tsx';
import { Handy, type NombreHandy } from './Handy.tsx';
import { Hoja } from './Hoja.tsx';
import { Icono, type NombreIcono } from './Icono.tsx';
import { Aviso, Campo, Casilla } from './ui.tsx';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Escena de color de arriba, con un Handy (o el grupo) y herramientas de fondo. */
export function Escena({ tono = 'amarillo', handy = 'grupo', alto = 150, logo = false, iconos = ['canilla', 'llave', 'rayo'] }: { tono?: 'amarillo' | 'azul' | 'noche' | 'clara'; handy?: NombreHandy; alto?: number; logo?: boolean; iconos?: NombreIcono[] }) {
  return (
    <div className={`cu-escena${tono === 'amarillo' ? '' : ` cu-escena--${tono}`}`} aria-hidden="true">
      {iconos.map((ic, i) => (
        <span key={ic} className={`cu-escena__mosaico cu-escena__mosaico--${i + 1}`}>
          <Icono nombre={ic} />
        </span>
      ))}
      {logo ? <img className="cu-escena__logo" src={`${base}/logo-handyx.webp`} alt="" width={150} height={32} /> : null}
      <Handy nombre={handy} alto={alto} className={handy === 'grupo' ? 'handy--grupo' : ''} />
    </div>
  );
}

/** Contraseña con "Mostrar" y, para una nueva, el medidor de fuerza. */
export function CampoClave({ etiqueta, valor, onCambio, nueva = false, email = '', error }: { etiqueta: string; valor: string; onCambio(v: string): void; nueva?: boolean; email?: string; error?: string | undefined }) {
  const [mostrar, setMostrar] = useState(false);
  const f = fuerzaClave(valor, email);
  return (
    <div className="pila pila--chica">
      <Campo etiqueta={etiqueta} type={mostrar ? 'text' : 'password'} autoComplete={nueva ? 'new-password' : 'current-password'} value={valor} onChange={(e) => onCambio(e.target.value)} error={error} required />
      <button type="button" className="boton boton--fantasma boton--chico cu-ver-clave" aria-pressed={mostrar} onClick={() => setMostrar((v) => !v)}>
        <Icono nombre="lupa" /> {mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      </button>
      {nueva && valor ? (
        <div className={`cu-medidor cu-medidor--${f.nivel}`} aria-live="polite">
          <ul className="cu-medidor__barra" aria-hidden="true">
            <li />
            <li />
            <li />
          </ul>
          <p className="cu-medidor__texto">
            Seguridad: <strong>{f.texto}</strong>
            {f.consejo ? `. ${f.consejo}` : '.'}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Términos y privacidad: sin tildar por defecto, cada uno con su lectura en una hoja. */
export function CasillasLegales({ terminos, privacidad, onTerminos, onPrivacidad, errores = {} }: { terminos: boolean; privacidad: boolean; onTerminos(v: boolean): void; onPrivacidad(v: boolean): void; errores?: { terminos?: string | undefined; privacidad?: string | undefined } }) {
  const [lectura, setLectura] = useState<'terminos' | 'privacidad' | null>(null);
  return (
    <>
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
        onChange={(e) => onTerminos(e.target.checked)}
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
        onChange={(e) => onPrivacidad(e.target.checked)}
        error={errores.privacidad}
      />
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
    </>
  );
}

/** ¡Cuenta creada!: una de las celebraciones permitidas. Avisa el fee 0 % hasta el 10/12 y que falta el alta. */
export function CuentaCreada({ children }: { children?: ReactNode }) {
  const router = useRouter();
  const confeti = useConfeti();
  const { lanzar } = confeti;
  useEffect(() => lanzar(), [lanzar]); // `lanzar` es estable: una sola vez al aparecer
  return (
    <div className="pila">
      {confeti.capa}
      <div className="hx-vacio">
        <Tilde />
        <h1 className="hx-titulo cu-titulo">
          ¡Tu cuenta está <span className="hx-marca">creada</span>!
        </h1>
        {children}
      </div>
      <FeeAviso />
      <Aviso tono="neutro" icono="info">
        Crear la cuenta no te habilita para recibir pedidos: primero completás tu alta y Operations la revisa.
      </Aviso>
      <BotonFijo>
        <button type="button" className="boton boton--bloque" onClick={() => router.replace(RUTAS.alta.ruta)}>
          Completar mi alta
        </button>
      </BotonFijo>
    </div>
  );
}
