'use client';
// Google y Apple en las pantallas de entrar (lote 1.1). Google en todos los teléfonos; Apple solo en iPhone, iPad y
// Mac (decisión de Ignacio del 29/10/2026). El id_token lo valida el servidor. En la vista previa se elige una cuenta
// de prueba en una hoja; con la API real los botones aparecen recién cuando estén los SDK (lote 5.2): hasta entonces
// no se muestra nada (ni la línea «o entrá con»).
import { api, ayudasPrueba } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import type { Proveedor } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { destinoCuenta } from '../../lib/destino.ts';
import { esDispositivoApple } from '../../lib/dispositivo.ts';
import { Separador } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { BotonProveedor } from '../../ui/moleculas/BotonProveedor.tsx';
import { FilaIcono } from '../../ui/moleculas/Tarjeta.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { mensajeAcceso } from './mensajes.ts';
import { olvidarAcceso } from './memoria.ts';

const NOMBRE: Record<Proveedor, string> = { google: 'Google', apple: 'Apple' };
const sinSuscripcion = () => () => undefined;

function useEsApple(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => esDispositivoApple({ userAgent: navigator.userAgent, plataforma: (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform }),
    () => false,
  );
}

export function Proveedores({ separador = 'o entrá con' }: { separador?: string }) {
  const router = useRouter();
  const esApple = useEsApple();
  const [eligiendo, setEligiendo] = useState<Proveedor | null>(null);
  const { pendiente, fallo, ejecutar, clave, limpiar } = useAccion({ publica: true });
  if (!ayudasPrueba) return null;
  const cuentas = eligiendo ? ayudasPrueba.cuentasProveedor[eligiendo] : [];
  const proveedores: Proveedor[] = esApple ? ['google', 'apple'] : ['google'];

  async function entrar(proveedor: Proveedor, idToken: string) {
    // El destino se calcula dentro de la acción: el botón se libera con la cuenta ya resuelta.
    const r = await ejecutar(async () => {
      const res = await api.ingresarConProveedor({ proveedor, idToken, nonce: clave() });
      return res.cuentaNueva ? RUTAS.aceptar.ruta : await destinoCuenta();
    });
    if (r.ok) {
      olvidarAcceso();
      setEligiendo(null);
      router.replace(r.valor);
    }
  }

  return (
    <>
      <Separador texto={separador} />
      <div className={`ui-fila-proveedores ui-fila-proveedores--${proveedores.length}`}>
        {proveedores.map((p) => (
          <BotonProveedor key={p} proveedor={p} onClick={() => setEligiendo(p)} />
        ))}
      </div>
      <Hoja
        abierta={eligiendo !== null}
        titulo={eligiendo ? `Elegí tu cuenta de ${NOMBRE[eligiendo]}` : 'Elegí tu cuenta'}
        onCerrar={() => {
          setEligiendo(null);
          limpiar();
        }}
      >
        <AvisoCaja tono="prueba">Vista previa: en la app se abre {eligiendo ? NOMBRE[eligiendo] : ''}. Acá elegís una cuenta de prueba.</AvisoCaja>
        {fallo ? <AvisoCaja tono="error">{mensajeAcceso(fallo, 'codigo')}</AvisoCaja> : null}
        {cuentas.map((c, i) => (
          <FilaIcono
            key={c.idToken}
            icono="cuenta"
            titulo={c.email}
            detalle={c.nueva ? 'Todavía no tiene cuenta en Handyx' : 'Ya tiene cuenta en Handyx'}
            borde={i > 0}
            onClick={pendiente || !eligiendo ? undefined : () => void entrar(eligiendo, c.idToken)}
          />
        ))}
      </Hoja>
    </>
  );
}
