'use client';
// "Continuar con Google" (en todos los dispositivos) y "Continuar con Apple" (solo en iPhone, iPad y Mac), lote 4.2.
// Google o Apple dan un id_token en el navegador y el servidor lo valida antes de abrir sesión (contrato 0.3.0).
// En la vista previa no hay Google ni Apple de verdad: se elige una cuenta de prueba (ayudasPrueba). Con la API real,
// los botones aparecen recién cuando se integren los SDK con sus client id públicos (lote 5.2): hasta entonces no se muestran.
import { api, ayudasPrueba } from '@handyx/origen-datos';
import { useState, useSyncExternalStore } from 'react';
import type { Proveedor, ResultadoProveedor } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { esDispositivoApple } from '../lib/dispositivo.ts';
import { Hoja } from './Hoja.tsx';
import { Aviso } from './ui.tsx';

const NOMBRE: Record<Proveedor, string> = { google: 'Google', apple: 'Apple' };

const sinSuscripcion = () => () => undefined;
function useEsApple(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => esDispositivoApple({ userAgent: navigator.userAgent, plataforma: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform }),
    () => false,
  );
}

export function LogoGoogle() {
  return (
    <svg className="cu-logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function LogoApple() {
  return (
    <svg className="cu-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C4.97 18.38 3.93 15.57 3.93 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"
      />
    </svg>
  );
}

/** Botones de Google y Apple con la separación "o con tu email" debajo. Sin proveedores disponibles no muestra nada. */
export function BotonesProveedor({ onEntrar }: { onEntrar(r: ResultadoProveedor): void }) {
  const esApple = useEsApple();
  const [eligiendo, setEligiendo] = useState<Proveedor | null>(null);
  const { pendiente, fallo, ejecutar, clave, limpiar } = useAccion({ publica: true });
  if (!ayudasPrueba) return null;
  const cuentas = eligiendo ? ayudasPrueba.cuentasProveedor[eligiendo] : [];
  const proveedores: Proveedor[] = esApple ? ['apple', 'google'] : ['google'];

  async function entrar(proveedor: Proveedor, idToken: string) {
    // En la vista previa el nonce es la clave del intento (UUIDv4). Con los SDK reales (lote 5.2) el nonce se genera antes
    // de abrir Google o Apple, viaja dentro del id_token firmado y el servidor lo compara.
    const r = await ejecutar(() => api.ingresarConProveedor({ proveedor, idToken, nonce: clave() }));
    if (r.ok) {
      setEligiendo(null);
      onEntrar(r.valor);
    }
  }

  return (
    <div className="cu-proveedores">
      {proveedores.map((p) => (
        <button key={p} type="button" className={`cu-proveedor cu-proveedor--${p}`} onClick={() => setEligiendo(p)}>
          {p === 'google' ? <LogoGoogle /> : <LogoApple />}
          Continuar con {NOMBRE[p]}
        </button>
      ))}
      <p className="cu-separador">
        <span>o con tu email</span>
      </p>
      <Hoja
        abierta={eligiendo !== null}
        titulo={eligiendo ? `Elegí tu cuenta de ${NOMBRE[eligiendo]}` : ''}
        onCerrar={() => {
          setEligiendo(null);
          limpiar();
        }}
      >
        <Aviso tono="aviso" icono="info">
          Vista previa: en la app se abre {eligiendo ? NOMBRE[eligiendo] : ''}. Acá elegís una cuenta de prueba.
        </Aviso>
        {fallo ? (
          <Aviso tono="error" icono="alerta" role="alert">
            {fallo.detalle?.mensaje ?? 'No pudimos validar tu cuenta. Probá de nuevo.'}
          </Aviso>
        ) : null}
        <ul className="hx-lista">
          {cuentas.map((c) => (
            <li key={c.idToken}>
              <button type="button" className="hx-fila" disabled={pendiente} onClick={() => eligiendo && void entrar(eligiendo, c.idToken)}>
                <span className="hx-fila__texto">
                  <strong>{c.email}</strong>
                  <small>{c.nueva ? 'Todavía no tiene cuenta en Handyx' : 'Ya tiene cuenta en Handyx'}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Hoja>
    </div>
  );
}
