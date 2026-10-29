'use client';
// Paso 5 · Zonas y horarios (lote 4.4): los barrios donde trabajás, en el mapa y en mosaico, y tus horarios en bloques
// (mañana, tarde y noche por día). Es opcional para enviar el alta: recibir pedidos se activa recién con el alta habilitada.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Aviso } from '../../components/ui.tsx';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { BLOQUES_HORARIO, bloquesDesdeFranjas, claveBloque, DIAS_SEMANA, franjasDesdeBloques } from '../../lib/alta.ts';
import { DIAS } from '../../lib/etiquetas.ts';
import { BotonFijo, Mosaico } from '../../kit/Piezas.tsx';
import { Mapa } from '../../mapa/Mapa.tsx';
import { MarcoPaso, type PropsPaso } from './comunes.tsx';

export function PasoZonas({ disponibilidad, recargar, alTerminar }: PropsPaso) {
  const barrios = useCarga(() => api.barrios(), []);
  const [zonas, setZonas] = useState<string[]>(disponibilidad.zonas);
  const [bloques, setBloques] = useState<Set<string>>(() => bloquesDesdeFranjas(disponibilidad.franjas));
  const { pendiente, fallo, ejecutar } = useAccion();
  const elegidos = (barrios.datos ?? []).filter((b) => zonas.includes(b.id));

  function alternarBloque(k: string) {
    setBloques((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  }

  async function guardar() {
    const r = await ejecutar(async () => {
      await api.actualizarDisponibilidad({ urgentesAhora: disponibilidad.urgentesAhora, programados: disponibilidad.programados, zonas, franjas: franjasDesdeBloques(bloques), version: disponibilidad.version });
      await recargar();
    });
    if (r.ok) alTerminar();
  }

  return (
    <MarcoPaso paso="zonas" titulo="Zonas y horarios">
      <h2 className="hx-titulo al-pregunta__titulo">
        ¿Dónde y <span className="hx-marca">cuándo</span> trabajás?
      </h2>
      <p className="texto-suave">Solo vas a ver pedidos de tus barrios. Podés cambiarlo cuando quieras.</p>

      <Mapa
        etiqueta="Tus barrios en el mapa"
        alto="medio"
        cobertura={elegidos}
        encuadre={elegidos.map((b) => b.id).join('|')}
        alternativa={<p>{elegidos.length ? elegidos.map((b) => b.nombre).join(', ') : 'Todavía no elegiste barrios'}</p>}
      />
      {barrios.fallo && !barrios.datos ? <ErrorCaja fallo={barrios.fallo} onReintentar={() => void barrios.recargar()} /> : null}
      <ul className="hx-mosaicos al-barrios" aria-label="Barrios">
        {(barrios.datos ?? []).map((b) => (
          <li key={b.id}>
            <Mosaico icono="pin" texto={b.nombre} elegido={zonas.includes(b.id)} onCambio={(v) => setZonas((x) => (v ? [...x, b.id] : x.filter((y) => y !== b.id)))} />
          </li>
        ))}
      </ul>

      <h3 className="al-subtitulo">Tus horarios</h3>
      <p className="texto-suave texto-chico">Mañana de 8 a 12 · tarde de 12 a 17 · noche de 17 a 21. Elegí los bloques en que podés trabajar.</p>
      <table className="al-horarios">
        <caption className="visualmente-oculto">Bloques de horario por día</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visualmente-oculto">Día</span>
            </th>
            {BLOQUES_HORARIO.map((b) => (
              <th key={b.id} scope="col">
                {b.texto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIAS_SEMANA.map((d) => (
            <tr key={d}>
              <th scope="row">{DIAS[d]?.slice(0, 3)}</th>
              {BLOQUES_HORARIO.map((b) => {
                const k = claveBloque(d, b.id);
                const on = bloques.has(k);
                return (
                  <td key={b.id}>
                    <button type="button" className="al-bloque" aria-pressed={on} aria-label={`${DIAS[d]} a la ${b.texto.toLowerCase()}`} onClick={() => alternarBloque(k)}>
                      <span aria-hidden="true">{on ? '✓' : ''}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <Aviso tono="neutro" icono="info">
        Esto no te activa para recibir pedidos: eso lo prendés vos desde el inicio cuando tu alta esté habilitada.
      </Aviso>
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void guardar()} /> : null}
      <BotonFijo>
        <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void guardar()}>
          {pendiente ? 'Guardando…' : 'Guardar zonas y horarios'}
        </button>
      </BotonFijo>
    </MarcoPaso>
  );
}
