'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Icono } from '../components/Icono.tsx';
import { Aviso, ChipTexto } from '../components/ui.tsx';
import type { AgendaItem } from '../contracts/dto.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { DIAS } from '../lib/etiquetas.ts';
import { diaLocal, fechaLarga, hora } from '../lib/formato.ts';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const dd = (n: number) => String(n).padStart(2, '0');

export function Agenda() {
  const hoy = diaLocal(api.ahora().toISOString());
  const [y0, m0] = hoy.split('-').map(Number) as [number, number];
  const [mes, setMes] = useState({ y: y0, m: m0 });
  const [elegido, setElegido] = useState(hoy);

  // Un mes de Buenos Aires: de 00:00 local (03:00 UTC) del día 1 al del mes siguiente.
  const desde = `${mes.y}-${dd(mes.m)}-01T03:00:00.000Z`;
  const sig = mes.m === 12 ? { y: mes.y + 1, m: 1 } : { y: mes.y, m: mes.m + 1 };
  const hasta = `${sig.y}-${dd(sig.m)}-01T03:00:00.000Z`;
  const c = useCarga(() => api.agenda(desde, hasta), [desde, hasta]);

  const items = c.datos ?? [];
  const porDia = new Map<string, AgendaItem[]>();
  for (const i of items) porDia.set(diaLocal(i.inicio), [...(porDia.get(diaLocal(i.inicio)) ?? []), i]);
  const primero = new Date(Date.UTC(mes.y, mes.m - 1, 1)).getUTCDay();
  const diasDelMes = new Date(Date.UTC(mes.y, mes.m, 0)).getUTCDate();
  const delDia = porDia.get(elegido) ?? [];

  function mover(delta: number) {
    const f = new Date(Date.UTC(mes.y, mes.m - 1 + delta, 1));
    const nuevo = { y: f.getUTCFullYear(), m: f.getUTCMonth() + 1 };
    setMes(nuevo);
    setElegido(`${nuevo.y}-${dd(nuevo.m)}-01`);
  }

  return (
    <div className="pila">
      <h1 className="titulo">Agenda</h1>
      <div className="fila-flex fila-flex--entre">
        <button type="button" className="boton-icono" aria-label="Mes anterior" onClick={() => mover(-1)}><Icono nombre="izquierda" /></button>
        <h2 aria-live="polite">{MESES[mes.m - 1]} {mes.y}</h2>
        <button type="button" className="boton-icono" aria-label="Mes siguiente" onClick={() => mover(1)}><Icono nombre="derecha" /></button>
      </div>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      <div className="calendario" role="group" aria-label={`Calendario de ${MESES[mes.m - 1]} ${mes.y}`}>
        {DIAS.map((d) => (
          <span key={d} className="calendario__dia-semana" aria-hidden="true">{d.slice(0, 1)}</span>
        ))}
        {Array.from({ length: primero }, (_, i) => <span key={`v${i}`} className="calendario__dia calendario__dia--vacio" aria-hidden="true" />)}
        {Array.from({ length: diasDelMes }, (_, i) => {
          const clave = `${mes.y}-${dd(mes.m)}-${dd(i + 1)}`;
          const cant = porDia.get(clave)?.length ?? 0;
          return (
            <button
              key={clave}
              type="button"
              className={`calendario__dia${clave === hoy ? ' calendario__dia--hoy' : ''}${clave === elegido ? ' calendario__dia--elegido' : ''}`}
              aria-pressed={clave === elegido}
              onClick={() => setElegido(clave)}
            >
              {i + 1}
              <span className="visualmente-oculto">
                {` de ${MESES[mes.m - 1]}${clave === hoy ? ', hoy' : ''}${cant ? `, ${cant} ${cant === 1 ? 'evento' : 'eventos'}` : ', sin eventos'}`}
              </span>
              {cant > 0 ? <span className="calendario__marca" aria-hidden="true">{cant}</span> : null}
            </button>
          );
        })}
      </div>
      <p className="texto-suave texto-chico">Hoy: número subrayado con borde naranja. El número chico es la cantidad de eventos del día. Cualquier día se puede tocar.</p>

      {!c.datos && !c.fallo ? <Cargando /> : null}
      <h2>{fechaLarga(`${elegido}T15:00:00.000Z`)}</h2>
      {c.datos && delDia.length === 0 ? <Vacio icono="calendario" titulo="No tenés nada este día" /> : null}
      <ul className="lista-tarjetas">
        {delDia.map((i) => {
          const destino = i.trabajoId ? `${RUTAS.trabajo.ruta}?id=${i.trabajoId}` : i.pedidoId ? `${RUTAS.pedido.ruta}?id=${i.pedidoId}` : null;
          const cuerpo = (
            <>
              <div className="fila-flex fila-flex--entre">
                <span className="tarjeta__titulo">{hora(i.inicio)}{i.fin ? ` a ${hora(i.fin)}` : ''}</span>
                {i.estado === 'confirmado' ? <ChipTexto tono="exito" icono="checkCirculo">Confirmado</ChipTexto> : null}
                {i.estado === 'cambio_pendiente' ? <ChipTexto tono="aviso" icono="reintentar">Cambio pendiente</ChipTexto> : null}
                {i.estado === 'oferta_pendiente' ? <ChipTexto tono="azul" icono="etiqueta">Oferta sin confirmar</ChipTexto> : null}
              </div>
              <p>{i.titulo}</p>
              {i.superpuesto ? (
                <Aviso tono="aviso" icono="alerta">Se superpone con un trabajo que ya tenés confirmado.</Aviso>
              ) : null}
              {i.estado === 'oferta_pendiente' ? <p className="texto-suave texto-chico">Una oferta no es un turno: se confirma recién cuando la otra parte acepta.</p> : null}
            </>
          );
          return <li key={i.id}>{destino ? <Link className="tarjeta" href={destino}>{cuerpo}</Link> : <div className="tarjeta">{cuerpo}</div>}</li>;
        })}
      </ul>
    </div>
  );
}
