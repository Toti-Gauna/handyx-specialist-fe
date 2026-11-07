'use client';
// Pedido entrante (lote 4.5): un urgente nuevo para vos aparece en una hoja sobre el inicio, con el rubro, la zona
// aproximada, la descripción y cuánto sigue abierta la búsqueda (en texto neutro, sin alarma). "Ver y cotizar" abre el
// detalle y "Ahora no" la cierra. Nunca acepta ni manda nada solo.
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import type { PedidoElegible } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { restante } from '../lib/formato.ts';
import { Mapa } from '../mapa/Mapa.tsx';
import { Hoja } from './Hoja.tsx';
import { Icono } from './Icono.tsx';
import { ChipTipo } from './ui.tsx';
import './pedidos.css';

// "Ahora no" vale mientras dura la pestaña (en memoria; nada en el almacenamiento del navegador).
const descartados = new Set<string>();

export function PedidoEntrante({ pedidos }: { pedidos: readonly PedidoElegible[] }) {
  const ahora = useAhora(30_000);
  const [, setVersion] = useState(0);
  const p = pedidos.find((x) => x.tipo === 'urgente' && x.estado === 'buscando' && !x.miPropuesta && !descartados.has(x.id) && (!x.ventanaHasta || Date.parse(x.ventanaHasta) > ahora.getTime()));
  if (!p) return null;
  const quedan = p.ventanaHasta ? restante(p.ventanaHasta, ahora) : null;

  function ahoraNo() {
    // Deja pasar todos los urgentes de ahora, no solo este: la hoja no encadena uno detrás de otro. Solo vuelve con uno nuevo.
    for (const x of pedidos) if (x.tipo === 'urgente') descartados.add(x.id);
    setVersion((v) => v + 1);
  }

  return (
    <Hoja abierta titulo="Pedido urgente para vos" onCerrar={ahoraNo}>
      <div className="pe">
        <ChipTipo tipo="urgente" />
        <p className="pe__rubro">{NOMBRE_RUBRO[p.rubro]}</p>
        <p className="pe__zona">
          <Icono nombre="pin" /> {p.zonaAproximada} · zona aproximada
        </p>
        {p.zonaMapa ? <Mapa etiqueta={`Zona aproximada del pedido en ${p.zonaAproximada}`} alto="chico" inmediato zona={p.zonaMapa} alternativa={<p>Zona aproximada: {p.zonaAproximada}</p>} /> : null}
        <p className="pe__descripcion">{p.descripcion}</p>
        {quedan ? (
          <p className="pe__vigencia">
            <Icono nombre="reloj" /> Búsqueda abierta · quedan {quedan}
          </p>
        ) : null}
        <p className="texto-suave texto-chico">"Ahora no" no rechaza nada: el pedido sigue en tu bandeja mientras esté abierto.</p>
        <div className="botones">
          <Link className="boton boton--bloque" href={`${RUTAS.pedido.ruta}?id=${p.id}`} onClick={() => descartados.add(p.id)}>
            Ver y cotizar
          </Link>
          <button type="button" className="boton boton--claro boton--bloque" onClick={ahoraNo}>
            Ahora no
          </button>
        </div>
      </div>
    </Hoja>
  );
}
