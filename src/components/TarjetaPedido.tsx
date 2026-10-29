'use client';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import type { PedidoElegible } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { PROPUESTA, TIPO_PEDIDO } from '../lib/etiquetas.ts';
import { fechaHora, haceCuanto, restante } from '../lib/formato.ts';
import { Icono } from './Icono.tsx';
import { Chip, ChipTexto } from './ui.tsx';

/**
 * Pedido en la bandeja. Es un enlace al detalle: ningún botón de acá acepta ni envía nada, así una
 * notificación o un toque accidental nunca compromete al especialista. Solo datos mínimos (zona aproximada).
 */
export function TarjetaPedido({ pedido, tarifaHandy }: { pedido: PedidoElegible; tarifaHandy: string | null }) {
  const ahora = useAhora(30_000);
  const urgente = pedido.tipo === 'urgente';
  const quedan = pedido.ventanaHasta ? restante(pedido.ventanaHasta, ahora) : null;
  const cerrado = pedido.estado !== 'buscando';

  return (
    <Link className={`tarjeta pedido${urgente ? ' pedido--urgente' : ''}`} href={`${RUTAS.pedido.ruta}?id=${pedido.id}`}>
      <div className="fila-flex fila-flex--entre">
        <ChipTexto tono={urgente ? 'noche' : 'azul'} icono={urgente ? 'rayo' : 'calendario'}>
          {TIPO_PEDIDO[pedido.tipo]}
        </ChipTexto>
        <span className="texto-suave texto-chico">{haceCuanto(pedido.creadoEn, ahora)}</span>
      </div>
      <p className="tarjeta__titulo">
        {NOMBRE_RUBRO[pedido.rubro]} · {pedido.zonaAproximada}
      </p>
      <p className="pedido__descripcion">{pedido.descripcion}</p>
      <div className="fila-flex">
        {pedido.fechaSolicitada ? (
          <span className="chip">
            <Icono nombre="calendario" /> {fechaHora(pedido.fechaSolicitada)}
          </span>
        ) : null}
        {!cerrado && quedan ? (
          <span className="chip chip--aviso">
            <Icono nombre="reloj" /> La búsqueda termina en {quedan}
          </span>
        ) : null}
        {cerrado ? (
          <span className="chip">
            <Icono nombre="reloj" /> La búsqueda terminó
          </span>
        ) : null}
        {pedido.miPropuesta ? <Chip e={{ ...PROPUESTA[pedido.miPropuesta.estado], texto: `Tu propuesta: ${PROPUESTA[pedido.miPropuesta.estado].texto.toLowerCase()}` }} /> : null}
      </div>
      {tarifaHandy ? <p className="texto-suave texto-chico">{tarifaHandy}</p> : null}
    </Link>
  );
}
