'use client';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import type { PedidoElegible } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { PROPUESTA } from '../lib/etiquetas.ts';
import { fechaHora, haceCuanto, hora, restante } from '../lib/formato.ts';
import { textoDistancia } from '../lib/geo.ts';
import './pedidos.css';
import { Icono } from './Icono.tsx';
import { Chip, ChipTipo } from './ui.tsx';

/**
 * Pedido en la bandeja. Jerarquía: tipo → rubro → zona y fecha → descripción → estado de la búsqueda.
 * Es un enlace al detalle: nada de acá acepta ni envía, así un toque suelto nunca compromete a nadie.
 * Solo datos mínimos (zona aproximada). El tiempo de búsqueda se informa en texto neutro, sin alarma.
 */
export function TarjetaPedido({ pedido, distanciaM = null }: { pedido: PedidoElegible; /** Distancia aproximada a la zona, calculada en el teléfono (orden "Más cerca"). */ distanciaM?: number | null }) {
  const ahora = useAhora(30_000);
  const urgente = pedido.tipo === 'urgente';
  const quedan = pedido.ventanaHasta ? restante(pedido.ventanaHasta, ahora) : null;
  const abierto = pedido.estado === 'buscando' && quedan !== null;

  return (
    <Link className={`tarjeta${urgente ? ' pedido--urgente' : ''}`} href={`${RUTAS.pedido.ruta}?id=${pedido.id}`}>
      <div className="fila-flex fila-flex--entre">
        <ChipTipo tipo={pedido.tipo} />
        <span className="texto-suave texto-chico">{haceCuanto(pedido.creadoEn, ahora)}</span>
      </div>
      <div>
        <p className="pedido__titulo">{NOMBRE_RUBRO[pedido.rubro]}</p>
        <span className="pedido__zona">
          <Icono nombre="pin" className="icono icono--chico" /> {pedido.zonaAproximada}
          {pedido.fechaSolicitada ? ` · ${fechaHora(pedido.fechaSolicitada)}` : ''}
        </span>
        {distanciaM !== null ? (
          <span className="ba-distancia">
            <Icono nombre="derecha" className="icono icono--chico" /> A unos {textoDistancia(distanciaM)} de vos
          </span>
        ) : null}
      </div>
      <p className="pedido__descripcion">{pedido.descripcion}</p>
      <div className="pedido__pie">
        {abierto && pedido.ventanaHasta ? (
          <span>
            <Icono nombre="reloj" className="icono icono--chico" />
            {urgente ? `Búsqueda abierta · quedan ${quedan}` : `Búsqueda abierta hasta las ${hora(pedido.ventanaHasta)}`}
          </span>
        ) : (
          <span>
            <Icono nombre="reloj" className="icono icono--chico" /> La búsqueda terminó
          </span>
        )}
        {pedido.miPropuesta ? <Chip e={{ ...PROPUESTA[pedido.miPropuesta.estado], texto: `Tu propuesta: ${PROPUESTA[pedido.miPropuesta.estado].texto.toLowerCase()}` }} /> : null}
      </div>
    </Link>
  );
}
