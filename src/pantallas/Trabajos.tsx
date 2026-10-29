'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Chip } from '../components/ui.tsx';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { TIPO_PEDIDO, TRABAJO } from '../lib/etiquetas.ts';
import { fechaHora, pesos } from '../lib/formato.ts';

export function Trabajos() {
  const [vista, setVista] = useState<'activos' | 'historial'>('activos');
  const c = useCarga(async () => {
    const r = await api.trabajos(vista);
    // Nombre de la contraparte para la lista: sale del detalle de cada trabajo.
    const detalles = await Promise.all(r.items.map((t) => api.trabajo(t.id)));
    return detalles;
  }, [vista]);

  return (
    <div className="pila">
      <h1 className="titulo">Mis trabajos</h1>
      <div className="tabs" role="tablist" aria-label="Trabajos">
        <button type="button" role="tab" aria-selected={vista === 'activos'} onClick={() => setVista('activos')}>Activos</button>
        <button type="button" role="tab" aria-selected={vista === 'historial'} onClick={() => setVista('historial')}>Historial</button>
      </div>
      {c.fallo && !c.datos ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {!c.datos && !c.fallo ? <Cargando /> : null}
      {c.datos && c.datos.length === 0 ? (
        <Vacio icono="maletin" titulo={vista === 'activos' ? 'No tenés trabajos activos' : 'Todavía no tenés historial'}>
          {vista === 'activos' ? 'Cuando un usuario acepte tu propuesta (o vos la suya), el trabajo aparece acá.' : 'Los trabajos terminados o cancelados quedan acá.'}
        </Vacio>
      ) : null}
      {c.datos && c.datos.length > 0 ? (
        <ul className="lista-tarjetas">
          {c.datos.map(({ trabajo: t, contraparte, cambioPendiente }) => (
            <li key={t.id}>
              <Link className="tarjeta" href={`${RUTAS.trabajo.ruta}?id=${t.id}`}>
                <div className="fila-flex fila-flex--entre">
                  <span className="tarjeta__titulo">{NOMBRE_RUBRO[t.rubro]} · {contraparte}</span>
                  <Chip e={TRABAJO[t.estado]} />
                </div>
                <p>{fechaHora(t.acuerdo.horario.inicio)} · {TIPO_PEDIDO[t.tipo]}</p>
                <p className="monto monto--chico">{pesos(t.acuerdo.monto)}</p>
                {cambioPendiente ? <p className="chip chip--aviso">Hay un cambio esperando respuesta</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
