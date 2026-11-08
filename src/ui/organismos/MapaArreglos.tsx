'use client';
// Mapa de arreglos (pedido de Ignacio: "como Uber, pero de arreglos"). Mapa a pantalla completa con la capa de
// MapLibre existente (src/mapa) y, encima, los pedidos como marcadores-ilustración tocables (rubro y precio sugerido).
// Tocar uno abre su detalle en una hoja, nunca lo acepta. Se puede mover el mapa, ver las zonas aproximadas, volver a
// centrar y elegir "Me voy hasta…" (Batán, Sierra de los Padres…) para ver los pedidos de ese lado. Todo está también
// como lista (Segmento Mapa / Lista), y sin WebGL queda el mapa estilizado con los mismos marcadores.
// Zona aproximada siempre: nunca la dirección exacta antes de que el cliente acepte.
import { useMemo, useState, type ReactNode } from 'react';
import type { Punto } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO, type Rubro } from '../../contracts/rubros.ts';
import { distanciaM } from '../../lib/geo.ts';
import { Mapa } from '../../mapa/Mapa.tsx';
import { Boton } from '../atomos/Boton.tsx';
import { Chip } from '../atomos/Texto.tsx';
import { ArregloRubro } from '../ilustraciones/Arreglos.tsx';
import { buscarDestinos, DESTINOS, enCaja, pedidosHacia, textoCifra, textoDistancia } from '../logica.ts';
import { Buscador, Segmento } from '../moleculas/Controles.tsx';
import { ICONO_RUBRO, MarcadorPedido } from '../moleculas/MarcadorPedido.tsx';
import { FilaIcono } from '../moleculas/Tarjeta.tsx';

export interface PedidoMapa {
  id: string;
  rubro: Rubro;
  /** Barrio o zona aproximada ("La Perla"). */
  zona: string;
  /** Centro de la zona aproximada (no la dirección). */
  punto: Punto;
  radioM: number;
  sugeridoCentavos: number | null;
  urgente?: boolean;
  nuevo?: boolean;
}

const CENTRO_CIUDAD = DESTINOS[0]?.centro ?? { lat: -38.0005, lng: -57.5516 };

export function MapaArreglos({
  pedidos,
  yo,
  elegido,
  onElegir,
  entrante,
  onVerEntrante,
  etiqueta = 'Mapa de pedidos cerca tuyo',
}: {
  pedidos: readonly PedidoMapa[];
  /** Tu posición aproximada, si diste permiso; si no, el centro de la ciudad. */
  yo: Punto | null;
  elegido: string | null;
  onElegir(id: string): void;
  /** Pedido que acaba de llegar: se muestra flotando arriba y se arma su ilustración. */
  entrante?: PedidoMapa | null;
  onVerEntrante?: () => void;
  etiqueta?: string;
}) {
  const [vista, setVista] = useState<'mapa' | 'lista'>('mapa');
  const [busqueda, setBusqueda] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [destino, setDestino] = useState<(typeof DESTINOS)[number] | null>(null);
  const origen = yo ?? CENTRO_CIUDAD;

  const visibles = useMemo(() => {
    const lista = destino ? pedidosHacia(origen, destino.centro, pedidos) : [...pedidos];
    return lista.map((p) => ({ ...p, distancia: distanciaM(origen, p.punto) }));
  }, [pedidos, destino, origen]);

  const marcador = (p: (typeof visibles)[number]) => <MarcadorPedido rubro={p.rubro} zona={p.zona} sugeridoCentavos={p.sugeridoCentavos} distanciaM={p.distancia} urgente={p.urgente} nuevo={p.nuevo} elegido={p.id === elegido} onTocar={() => onElegir(p.id)} />;

  const resumen = destino ? `Camino a ${destino.nombre}: ${visibles.length} ${visibles.length === 1 ? 'pedido' : 'pedidos'}` : `${visibles.length} ${visibles.length === 1 ? 'pedido' : 'pedidos'} cerca`;

  return (
    <section className={`ui-mapa-arreglos ui-mapa-arreglos--${vista}`} aria-label={etiqueta}>
      <div className="ui-mapa-arreglos__arriba">
        {buscando ? (
          <div className="ui-mapa-arreglos__destino">
            <Buscador valor={busqueda} onCambio={setBusqueda} etiqueta="Me voy hasta… (zona o barrio)" ejemplo="Por ejemplo, Batán" />
            <ul className="ui-mapa-arreglos__sugerencias" aria-label="Zonas">
              {buscarDestinos(busqueda).map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="ui-mapa-arreglos__sugerencia"
                    onClick={() => {
                      setDestino(d);
                      setBuscando(false);
                      setBusqueda('');
                    }}
                  >
                    {d.nombre}
                    <span>{textoDistancia(distanciaM(origen, d.centro))}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Boton variante="texto" onClick={() => setBuscando(false)}>
              Cancelar
            </Boton>
          </div>
        ) : (
          <div className="ui-mapa-arreglos__barra">
            <button type="button" className="ui-mapa-arreglos__voy" onClick={() => setBuscando(true)}>
              {destino ? `Me voy hasta ${destino.nombre}` : 'Me voy hasta…'}
            </button>
            <Segmento<'mapa' | 'lista'>
              etiqueta="Ver los pedidos como"
              valor={vista}
              onCambio={setVista}
              opciones={[
                { valor: 'mapa', texto: 'Mapa' },
                { valor: 'lista', texto: 'Lista' },
              ]}
            />
          </div>
        )}
        <p className="ui-mapa-arreglos__resumen" role="status">
          <Chip tono="blanco" icono="pin">
            {resumen}
          </Chip>
          {destino ? (
            <Boton variante="texto" bloque={false} chico onClick={() => setDestino(null)}>
              Ver todos
            </Boton>
          ) : null}
        </p>
      </div>

      {entrante ? (
        <div className="ui-mapa-arreglos__entrante" role="status">
          <ArregloRubro rubro={entrante.rubro} armar vuelta={entrante.id.length} tam="chico" />
          <span className="ui-mapa-arreglos__entrante-texto">
            <strong>Llegó un pedido de {NOMBRE_RUBRO[entrante.rubro].toLowerCase()}</strong>
            <span>
              {entrante.zona}
              {entrante.sugeridoCentavos !== null ? ` · sugerido ${textoCifra(entrante.sugeridoCentavos)}` : ''}
            </span>
          </span>
          {onVerEntrante ? (
            <Boton bloque={false} chico onClick={onVerEntrante}>
              Ver
            </Boton>
          ) : null}
        </div>
      ) : null}

      {vista === 'mapa' ? (
        <div className="ui-mapa-arreglos__mapa">
          <Mapa
            etiqueta={etiqueta}
            alto="completo"
            interactivo
            conCentrar
            tapadoAbajo={0.12}
            encuadre={destino?.id ?? 'todos'}
            zonas={visibles.map((p) => ({ centro: p.punto, radioM: p.radioM }))}
            posicion={yo ? { punto: yo, precisionM: 50 } : null}
            destino={destino?.centro ?? null}
            marcadores={visibles.map((p) => ({ id: p.id, punto: p.punto, contenido: marcador(p) }))}
            alternativa={<MapaEstilizado pedidos={visibles} marcador={marcador} />}
          />
        </div>
      ) : (
        <ul className="ui-mapa-arreglos__lista">
          {visibles.length === 0 ? <li className="ui-mapa-arreglos__vacio">No hay pedidos de ese lado por ahora.</li> : null}
          {visibles.map((p) => (
            <li key={p.id}>
              <FilaIcono
                icono={ICONO_RUBRO[p.rubro]}
                titulo={`${NOMBRE_RUBRO[p.rubro]} · ${p.zona}`}
                detalle={`${p.urgente ? 'Urgente · ' : ''}a ${textoDistancia(p.distancia)}`}
                derecha={p.sugeridoCentavos !== null ? <strong className="ui-cifra ui-cifra--chico">{textoCifra(p.sugeridoCentavos)}</strong> : undefined}
                onClick={() => onElegir(p.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Sin motor de mapa (sin WebGL o mientras no arranca): manzanas grises y los mismos marcadores, ubicados por zona. */
function MapaEstilizado<T extends { id: string; punto: Punto }>({ pedidos, marcador }: { pedidos: readonly T[]; marcador(p: T): ReactNode }) {
  return (
    <div className="ui-mapa-estilizado">
      <div className="ui-mapa-estilizado__manzanas" aria-hidden="true" />
      <div className="ui-mapa-estilizado__costa" aria-hidden="true" />
      {pedidos.map((p) => {
        const { x, y } = enCaja(p.punto);
        return (
          <div
            key={p.id}
            className="ui-mapa-estilizado__lugar"
            ref={(el) => {
              // Posición calculada: se fija desde código (sin estilos inline en el JSX).
              el?.style.setProperty('--x', `${x}%`);
              el?.style.setProperty('--y', `${y}%`);
            }}
          >
            {marcador(p)}
          </div>
        );
      })}
    </div>
  );
}
