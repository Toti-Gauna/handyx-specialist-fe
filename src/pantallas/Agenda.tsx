'use client';
// Agenda (lote 4.8, como la demo): el mes con los días marcados, la lista del día elegido y el detalle del turno en
// una hoja. Una obra aparece jornada por jornada. Una oferta no es un turno: se confirma cuando la otra parte acepta.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { ErrorCaja } from '../components/Estados.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono } from '../components/Icono.tsx';
import { Aviso, Chip } from '../components/ui.tsx';
import type { AgendaItem } from '../contracts/dto.ts';
import { useCarga } from '../hooks/useCarga.ts';
import type { Etiqueta } from '../lib/etiquetas.ts';
import { diaLocal, fechaLarga, hora, plural } from '../lib/formato.ts';
import { CalendarioMes } from '../kit/Fechas.tsx';
import { EstadoVacio } from '../kit/Piezas.tsx';
import './agenda.css';

const dd = (n: number) => String(n).padStart(2, '0');

export const ESTADO_TURNO: Record<AgendaItem['estado'], Etiqueta> = {
  confirmado: { texto: 'Confirmado', tono: 'exito', icono: 'checkCirculo' },
  cambio_pendiente: { texto: 'Cambio pendiente', tono: 'aviso', icono: 'reintentar' },
  oferta_pendiente: { texto: 'Oferta sin confirmar', tono: 'azul', icono: 'etiqueta' },
};

export function Agenda() {
  const hoy = diaLocal(api.ahora().toISOString());
  const [y0, m0] = hoy.split('-').map(Number) as [number, number];
  const [mes, setMes] = useState({ anio: y0, mes: m0 });
  const [elegido, setElegido] = useState(hoy);
  const [abierto, setAbierto] = useState<AgendaItem | null>(null);

  // Un mes de Buenos Aires: de 00:00 local (03:00 UTC) del día 1 al del mes siguiente.
  const desde = `${mes.anio}-${dd(mes.mes)}-01T03:00:00.000Z`;
  const sig = mes.mes === 12 ? { anio: mes.anio + 1, mes: 1 } : { anio: mes.anio, mes: mes.mes + 1 };
  const hasta = `${sig.anio}-${dd(sig.mes)}-01T03:00:00.000Z`;
  const c = useCarga(() => api.agenda(desde, hasta), [desde, hasta]);

  const porDia = new Map<string, AgendaItem[]>();
  for (const i of c.datos ?? []) porDia.set(diaLocal(i.inicio), [...(porDia.get(diaLocal(i.inicio)) ?? []), i]);
  const marcas = Object.fromEntries([...porDia].map(([d, l]) => [d, l.length]));
  const delDia = porDia.get(elegido) ?? [];

  return (
    <div className="pila ag">
      <h1 className="titulo">Agenda</h1>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      <CalendarioMes
        anio={mes.anio}
        mes={mes.mes}
        onCambiarMes={(anio, m) => {
          setMes({ anio, mes: m });
          setElegido(anio === y0 && m === m0 ? hoy : `${anio}-${dd(m)}-01`);
        }}
        hoy={hoy}
        elegido={elegido}
        onElegir={setElegido}
        marcas={marcas}
      />

      <section className="ag-dia" aria-labelledby="ag-dia-t" aria-live="polite">
        <h2 id="ag-dia-t" className="ag-dia__titulo">
          {fechaLarga(`${elegido}T15:00:00.000Z`)}
          <small>{c.datos ? (delDia.length ? plural(delDia.length, 'turno', 'turnos') : 'sin turnos') : 'cargando…'}</small>
        </h2>
        {c.datos && delDia.length === 0 ? (
          <EstadoVacio titulo="No tenés nada este día">Cuando aceptes un trabajo o te acepten una propuesta, aparece acá.</EstadoVacio>
        ) : null}
        <ul className="ag-lista">
          {delDia.map((i) => (
            <li key={i.id}>
              <button type="button" className={`ag-turno ag-turno--${i.estado}`} onClick={() => setAbierto(i)}>
                <span className="ag-turno__hora">
                  <strong>{hora(i.inicio)}</strong>
                  {i.fin ? <small>a {hora(i.fin)}</small> : null}
                </span>
                <span className="ag-turno__texto">
                  <strong>{i.titulo}</strong>
                  <Chip e={ESTADO_TURNO[i.estado]} />
                  {i.superpuesto ? (
                    <small className="ag-turno__alerta">
                      <Icono nombre="alerta" /> Se superpone con un trabajo confirmado
                    </small>
                  ) : null}
                </span>
                <Icono nombre="derecha" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Hoja abierta={abierto !== null} titulo="Detalle del turno" onCerrar={() => setAbierto(null)}>
        {abierto ? <DetalleTurno t={abierto} /> : null}
      </Hoja>
    </div>
  );
}

function DetalleTurno({ t }: { t: AgendaItem }) {
  const destino = t.trabajoId ? `${RUTAS.trabajo.ruta}?id=${t.trabajoId}` : t.pedidoId ? `${RUTAS.pedido.ruta}?id=${t.pedidoId}` : null;
  return (
    <div className="ag-detalle">
      <Chip e={ESTADO_TURNO[t.estado]} />
      <p className="ag-detalle__titulo">{t.titulo}</p>
      <p className="ag-detalle__cuando">
        <Icono nombre="calendario" /> {fechaLarga(t.inicio)}, de {hora(t.inicio)}
        {t.fin ? ` a ${hora(t.fin)}` : ''}
      </p>
      {t.superpuesto ? (
        <Aviso tono="aviso" icono="alerta">
          Se superpone con un trabajo que ya tenés confirmado.
        </Aviso>
      ) : null}
      {t.estado === 'oferta_pendiente' ? <p className="texto-suave texto-chico">Una oferta no es un turno: se confirma recién cuando la otra parte acepta.</p> : null}
      {t.estado === 'cambio_pendiente' ? <p className="texto-suave texto-chico">Hay un cambio de fecha esperando respuesta: hasta que se acepte, vale el día acordado.</p> : null}
      {destino ? (
        <Link className="boton boton--bloque" href={destino}>
          {t.trabajoId ? 'Ver el trabajo' : 'Ver la oferta'}
        </Link>
      ) : null}
    </div>
  );
}
