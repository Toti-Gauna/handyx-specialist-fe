'use client';
// Paso 4 · Tus rubros (lote 4.4): los 6 en mosaico. Gas y aire acondicionado piden matrícula o certificación; una foto no
// habilita el rubro: Operations la revisa.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { Documento } from '../../components/Documento.tsx';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { NombreIcono } from '../../components/Icono.tsx';
import { NOMBRE_RUBRO, RUBROS, requiereMatricula, type Rubro } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { BotonFijo, Mosaico } from '../../kit/Piezas.tsx';
import { MarcoPaso, type PropsPaso } from './comunes.tsx';

const ICONO: Record<Rubro, NombreIcono> = { electricidad: 'rayo', plomeria: 'canilla', gas: 'llama', cerrajeria: 'llave', albanileria: 'ladrillos', aire_acondicionado: 'aire' };

export function PasoRubros({ perfil, recargar, alTerminar }: PropsPaso) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const [elegidos, setElegidos] = useState<Rubro[]>(perfil.rubros.map((r) => r.rubro));
  const cambiaron = elegidos.length !== perfil.rubros.length || elegidos.some((r) => !perfil.rubros.some((x) => x.rubro === r));
  const conMatricula = perfil.rubros.filter((r) => r.matricula !== null);

  async function guardar() {
    if (!cambiaron) return alTerminar();
    const r = await ejecutar(async () => {
      await api.elegirRubros(elegidos);
      await recargar();
    });
    // Si eligió un rubro con matrícula, se queda acá para cargarla.
    if (r.ok && !elegidos.some(requiereMatricula)) alTerminar();
  }

  return (
    <MarcoPaso paso="rubros" titulo="Tus rubros">
      <h2 className="hx-titulo al-pregunta__titulo">
        ¿En qué <span className="hx-marca">trabajás</span>?
      </h2>
      <p className="texto-suave">Elegí todos los que hagas. Solo vas a ver pedidos de los rubros que Operations habilite.</p>
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <ul className="hx-mosaicos" aria-label="Rubros">
        {RUBROS.map((r) => (
          <li key={r}>
            <Mosaico
              icono={ICONO[r]}
              texto={NOMBRE_RUBRO[r]}
              nota={requiereMatricula(r) ? 'Pide matrícula' : undefined}
              elegido={elegidos.includes(r)}
              onCambio={(v) => setElegidos((x) => (v ? [...x, r] : x.filter((y) => y !== r)))}
            />
          </li>
        ))}
      </ul>

      {conMatricula.length > 0 && !cambiaron ? (
        <section className="al-matriculas" aria-labelledby="al-matriculas-t">
          <h3 id="al-matriculas-t">Matrícula o certificación</h3>
          {conMatricula.map((r) => (
            <Documento
              key={r.rubro}
              tipo="matricula"
              rubro={r.rubro}
              titulo={NOMBRE_RUBRO[r.rubro]}
              ayuda="Una foto del documento no te habilita el rubro: Operations lo revisa y recién ahí queda verificado."
              estado={r.matricula ?? 'faltante'}
              editable
              onCargado={() => void recargar()}
            />
          ))}
        </section>
      ) : null}

      <BotonFijo nota={elegidos.length === 0 ? 'Elegí al menos un rubro.' : undefined}>
        <button type="button" className="boton boton--bloque" disabled={pendiente || elegidos.length === 0} onClick={() => void guardar()}>
          {pendiente ? 'Guardando…' : cambiaron ? 'Guardar rubros' : 'Listo'}
        </button>
      </BotonFijo>
    </MarcoPaso>
  );
}
