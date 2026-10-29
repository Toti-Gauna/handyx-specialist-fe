'use client';
import { controles } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useState } from 'react';
import { entorno } from '../config/entorno.ts';
import { RUTAS } from '../app/rutas.ts';
import { fechaHora } from '../lib/formato.ts';
import { Hoja } from './Hoja.tsx';

// Siempre visible con el origen de prueba: los datos de prueba nunca se confunden con datos reales.
// Con DATA_SOURCE=http toda esta rama desaparece del bundle (scripts/verificar-bundle.mjs lo comprueba).
export function BannerPrueba() {
  const [abierto, setAbierto] = useState(false);
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'http' || entorno.origen !== 'mock') return null;
  return (
    <>
      <p className="banner-prueba" role="note">
        Datos de prueba · nada de lo que ves es real ni se guarda
        {controles ? (
          <button type="button" onClick={() => setAbierto(true)}>
            Panel de prueba
          </button>
        ) : null}
      </p>
      <Hoja abierta={abierto} titulo="Panel de prueba" onCerrar={() => setAbierto(false)}>
        <PanelPrueba />
      </Hoja>
    </>
  );
}

/** Simula lo que en producción hacen otras personas y sistemas: Operations, el usuario del hogar y el proveedor de pagos. */
function PanelPrueba() {
  const router = useRouter();
  const [, refrescar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => controles?.alCambiar(refrescar), []);
  if (!controles) return null;
  const v = controles.vista();
  const grupos = [...new Set(v.acciones.map((a) => a.grupo))];

  return (
    <div className="panel-prueba">
      <p className="texto-suave texto-chico">
        Reloj de prueba: <strong>{fechaHora(v.ahora)}</strong>. Todo es ficticio y vive solo en esta pestaña.
      </p>
      {v.nota ? (
        <p className="aviso aviso--aviso" role="status">
          {v.nota}
        </p>
      ) : null}

      <div className="campo">
        <label htmlFor="escenario-prueba">Escenario</label>
        <select
          id="escenario-prueba"
          value={v.escenario}
          onChange={(e) => {
            controles?.elegirEscenario(e.target.value as typeof v.escenario);
            router.replace(RUTAS.puerta.ruta);
          }}
        >
          {v.escenarios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3>Fallas simuladas</h3>
        <div className="botones">
          {v.toggles.map((t) => (
            <button key={t.id} type="button" className={`boton boton--chico ${t.activo ? '' : 'boton--claro'}`} aria-pressed={t.activo} onClick={() => controles?.alternar(t.id)}>
              {t.activo ? 'Activado · ' : ''}
              {t.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3>Reloj</h3>
        <div className="botones">
          {v.relojes.map((r) => (
            <button key={r.id} type="button" className="boton boton--chico boton--claro" onClick={() => controles?.fijarReloj(r.id)}>
              {r.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {grupos.map((g) => (
        <div key={g}>
          <h3>{g}</h3>
          <div className="botones">
            {v.acciones
              .filter((a) => a.grupo === g)
              .map((a) => (
                <button key={a.id} type="button" className="boton boton--chico boton--claro" onClick={() => controles?.ejecutar(a.id)}>
                  {a.etiqueta}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
