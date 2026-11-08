'use client';
// Pedidos sobre el mapa de arreglos (pedido de Ignacio: «como Uber, pero de arreglos»):
// - PedidoFlotante (F-Inicio): el pedido que acaba de llegar, en una tarjeta que flota sobre el mapa con la ilustración
//   que «construye el arreglo», el rubro, lo que escribió el cliente, la zona aproximada y lo que sugiere Handyx. Si
//   llegaron varios, se pasan con «Anterior» y «Siguiente» («Pedido 1 de 2»). «Ver pedido» abre el detalle: nunca acepta.
// - HojaCercanos: la hoja de abajo con los pedidos cercanos como las opciones de viaje de Uber (rubro, zona, precio
//   sugerido y distancia), la elegida resaltada y una sola acción clara: «Ver pedido».
// Zona aproximada siempre; sin tiempos de llegada. Los botones de acción nunca se animan.
import { useId, type ReactNode } from 'react';
import { NOMBRE_RUBRO, type Rubro } from '../../contracts/rubros.ts';
import { Boton, BotonIcono } from '../atomos/Boton.tsx';
import { Icono } from '../atomos/Icono.tsx';
import { Chip, Cifra, Etiqueta, Marcador } from '../atomos/Texto.tsx';
import { ArregloRubro } from '../ilustraciones/Arreglos.tsx';
import { textoDistancia } from '../logica.ts';
import { ICONO_RUBRO } from '../moleculas/MarcadorPedido.tsx';
import '../nucleo.css';

export interface PedidoCercano {
  id: string;
  rubro: Rubro;
  /** Lo que escribió el cliente, recortado ("Pierde la canilla de la cocina"). */
  titulo: string;
  /** Barrio o zona aproximada. */
  zona: string;
  distanciaM: number | null;
  sugeridoCentavos: number | null;
  urgente: boolean;
  /** "18:42": lo que queda de la ventana de un urgente (lo calcula el servidor). */
  quedan?: string | null;
  /** "Mañana, de 14 a 18 h" en un programado. */
  cuando?: string | null;
}

const lugar = (p: PedidoCercano) => `${p.zona} · zona aproximada${p.distanciaM !== null ? ` · ${textoDistancia(p.distanciaM)}` : ''}`;

export function PedidoFlotante({ pedidos, indice, onIndice, onVer, onCerrar }: { pedidos: readonly PedidoCercano[]; indice: number; onIndice(i: number): void; onVer(id: string): void; onCerrar?: () => void }) {
  const p = pedidos[Math.min(indice, pedidos.length - 1)];
  const idTitulo = useId();
  if (!p) return null;
  const varios = pedidos.length > 1;
  return (
    <section className="ui-flotante" aria-labelledby={idTitulo} aria-live="polite">
      <div className="ui-flotante__arriba">
        <Etiqueta>{p.urgente ? `Pedido urgente${p.quedan ? ` · quedan ${p.quedan}` : ''}` : `Pedido nuevo${p.cuando ? ` · ${p.cuando}` : ''}`}</Etiqueta>
        {varios ? (
          <span className="ui-flotante__pagina">
            <span className="visualmente-oculto">{`Pedido ${indice + 1} de ${pedidos.length}`}</span>
            <span className="ui-flotante__puntos" aria-hidden="true">
              {pedidos.map((x, i) => (
                <span key={x.id} className={i === indice ? 'ui-flotante__punto ui-flotante__punto--on' : 'ui-flotante__punto'} />
              ))}
            </span>
          </span>
        ) : null}
        {onCerrar ? <BotonIcono icono="cerrar" etiqueta="Ocultar los pedidos nuevos" onClick={onCerrar} /> : null}
      </div>
      <div className="ui-flotante__cuerpo">
        <div className="ui-flotante__texto">
          <h2 id={idTitulo} className="ui-titulo ui-titulo--medio">
            <Marcador>{NOMBRE_RUBRO[p.rubro]}</Marcador>
          </h2>
          <p className="ui-flotante__titulo">{p.titulo}</p>
          <Chip icono="pin">{lugar(p)}</Chip>
        </div>
        <span className="ui-flotante__ilu">
          <ArregloRubro rubro={p.rubro} armar vuelta={indice} tam="chico" />
        </span>
      </div>
      <div className="ui-flotante__abajo">
        {p.sugeridoCentavos !== null ? (
          <span className="ui-flotante__precio">
            <span>Handyx sugiere · vos decidís</span>
            <Cifra centavos={p.sugeridoCentavos} tam="grande" />
          </span>
        ) : (
          <span className="ui-flotante__precio">
            <span>Vos ponés el precio</span>
          </span>
        )}
        <Boton bloque={false} onClick={() => onVer(p.id)}>
          Ver pedido
        </Boton>
      </div>
      {varios ? (
        <div className="ui-flotante__pasar">
          <Boton variante="texto" bloque={false} chico icono="izquierda" disabled={indice === 0} onClick={() => onIndice(indice - 1)}>
            Anterior
          </Boton>
          <Boton variante="texto" bloque={false} chico disabled={indice >= pedidos.length - 1} onClick={() => onIndice(indice + 1)}>
            Siguiente
          </Boton>
        </div>
      ) : null}
    </section>
  );
}

export function HojaCercanos({ pedidos, elegido, onElegir, onVer, titulo, vacio, extra }: { pedidos: readonly PedidoCercano[]; elegido: string | null; onElegir(id: string): void; onVer(id: string): void; titulo: string; vacio: string; extra?: ReactNode }) {
  const nombre = useId();
  const idTitulo = useId();
  const actual = pedidos.find((p) => p.id === elegido) ?? pedidos[0] ?? null;
  return (
    <section className="ui-cercanos" aria-labelledby={idTitulo}>
      <span className="ui-cercanos__manija" aria-hidden="true" />
      <h2 id={idTitulo} className="ui-cercanos__titulo">
        {titulo}
      </h2>
      {extra}
      {pedidos.length === 0 ? (
        <p className="ui-cercanos__vacio">{vacio}</p>
      ) : (
        <>
          <fieldset className="ui-cercanos__lista">
            <legend className="visualmente-oculto">Elegí un pedido para ver</legend>
            {pedidos.map((p) => {
              const on = p.id === actual?.id;
              return (
                <label key={p.id} className={`ui-cercanos__op${on ? ' ui-cercanos__op--on' : ''}`}>
                  <input type="radio" name={nombre} value={p.id} checked={on} onChange={() => onElegir(p.id)} />
                  <span className="ui-cercanos__ico" aria-hidden="true">
                    <Icono nombre={ICONO_RUBRO[p.rubro]} />
                  </span>
                  <span className="ui-cercanos__texto">
                    <strong>
                      {NOMBRE_RUBRO[p.rubro]}
                      {p.urgente ? <span className="ui-cercanos__urgente"> · Urgente</span> : null}
                    </strong>
                    <span>{p.titulo}</span>
                    <span className="ui-cercanos__zona">{lugar(p)}</span>
                  </span>
                  <span className="ui-cercanos__precio">
                    {p.sugeridoCentavos !== null ? (
                      <>
                        <Cifra centavos={p.sugeridoCentavos} tam="chico" />
                        <span>sugerido</span>
                      </>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {actual ? (
            <Boton onClick={() => onVer(actual.id)}>
              {`Ver pedido de ${NOMBRE_RUBRO[actual.rubro].toLowerCase()}`}
            </Boton>
          ) : null}
        </>
      )}
    </section>
  );
}
