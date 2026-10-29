'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso as Callout, ChipTexto } from '../components/ui.tsx';
import type { Aviso } from '../contracts/dto.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { haceCuanto } from '../lib/formato.ts';

function destino(a: Aviso): string {
  const q = a.destino.id ? `?id=${a.destino.id}` : '';
  switch (a.destino.ruta) {
    case 'pedido': return `${RUTAS.pedido.ruta}${q}`;
    case 'trabajo': return `${RUTAS.trabajo.ruta}${q}`;
    case 'hilo': return `${RUTAS.hilo.ruta}${q}`;
    case 'soporte': return `${RUTAS.casoSoporte.ruta}${q}`;
    case 'caja': return RUTAS.caja.ruta;
    case 'cuenta': return RUTAS.cuenta.ruta;
    case 'alta': return RUTAS.alta.ruta;
  }
}

const ICONO: Record<Aviso['tipo'], NombreIcono> = {
  pedido_urgente: 'rayo',
  pedido_programado: 'calendario',
  propuesta: 'etiqueta',
  mensaje: 'chat',
  trabajo: 'maletin',
  pago: 'caja',
  soporte: 'pregunta',
  cuenta: 'usuario',
};

export function Avisos() {
  const c = useCarga(() => api.avisos(), []);
  const ahora = useAhora(30_000);

  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  async function abrir(a: Aviso) {
    if (!a.leido) await api.marcarAvisoLeido(a.id).catch(() => undefined);
  }

  return (
    <div className="pila">
      <Volver a={RUTAS.inicio.ruta} texto="Inicio" />
      <h1 className="titulo">Avisos</h1>
      <Callout tono="neutro" icono="info">
        Abrir un aviso solo te muestra el detalle: nunca acepta nada por vos. Los avisos urgentes y los programados se distinguen. Todo lo importante queda acá aunque el aviso del teléfono no llegue.
      </Callout>
      {c.datos.length === 0 ? (
        <Vacio icono="campana" titulo="No tenés avisos" />
      ) : (
        <ul className="lista-tarjetas">
          {c.datos.map((a) => (
            <li key={a.id}>
              <Link className={`tarjeta${a.tipo === 'pedido_urgente' ? ' pedido--urgente' : ''}`} href={destino(a)} onClick={() => void abrir(a)}>
                <div className="fila-flex fila-flex--entre">
                  <span className="fila-flex">
                    <Icono nombre={ICONO[a.tipo]} />
                    {a.tipo === 'pedido_urgente' ? <ChipTexto tono="noche" icono="rayo">Urgente</ChipTexto> : null}
                    {a.tipo === 'pedido_programado' ? <ChipTexto tono="azul" icono="calendario">Programado</ChipTexto> : null}
                    {!a.leido ? <ChipTexto tono="azul">Sin leer</ChipTexto> : null}
                  </span>
                  <span className="texto-suave texto-chico">{haceCuanto(a.creadoEn, ahora)}</span>
                </div>
                <p className="tarjeta__titulo">{a.titulo}</p>
                <p className="texto-suave">{a.cuerpo}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
