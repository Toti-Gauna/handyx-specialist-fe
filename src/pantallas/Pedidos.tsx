'use client';
// Bandeja de pedidos (lote 4.5): filtros en chips que entran en 390 px y orden por llegada o "Más cerca". Para ordenar por
// cercanía se lee UNA vez la ubicación del teléfono y la cuenta se hace ahí: la ubicación no se manda a ningún lado.
import { api, ubicacion } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPedido } from '../components/TarjetaPedido.tsx';
import { Aviso } from '../components/ui.tsx';
import type { Punto } from '../contracts/dto.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { distanciaM } from '../lib/geo.ts';
import { tarifaTexto } from '../lib/tarifa.ts';
import { ChipOpcion } from '../kit/Piezas.tsx';
import '../components/pedidos.css';

const FILTROS = [
  { id: 'todos', texto: 'Todos' },
  { id: 'urgente', texto: 'Urgentes' },
  { id: 'programado', texto: 'Programados' },
  { id: 'obra', texto: 'Obras' },
] as const;

type Orden = 'llegada' | 'cerca';

export function Pedidos() {
  const { perfil } = usePerfil();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('todos');
  const [orden, setOrden] = useState<Orden>('llegada');
  const [yo, setYo] = useState<Punto | null>(null);
  const [ubicando, setUbicando] = useState(false);
  const [sinUbicacion, setSinUbicacion] = useState(false);
  const habilitada = perfil.estadoAlta === 'habilitada';
  const c = useCarga(async () => {
    if (!habilitada) return null;
    const [p, d, f] = await Promise.all([api.pedidosElegibles(), api.disponibilidad(), api.feeVigente()]);
    return { pedidos: p.items, disp: d, fee: f };
  }, [habilitada]);

  function masCerca() {
    setOrden('cerca');
    if (yo) return;
    setUbicando(true);
    setSinUbicacion(false);
    // Una sola lectura y se suelta el GPS (la fuente puede responder antes de devolver cómo parar: por eso el microtask).
    let hecho = false;
    const soltar = () => queueMicrotask(() => parar());
    const parar = ubicacion.observar(
      (l) => {
        if (hecho) return;
        hecho = true;
        soltar();
        setYo(l.punto);
        setUbicando(false);
      },
      () => {
        if (hecho) return;
        hecho = true;
        soltar();
        setUbicando(false);
        setSinUbicacion(true);
        setOrden('llegada');
      },
    );
  }

  if (!habilitada) {
    return (
      <div className="pila">
        <h1 className="titulo">Pedidos</h1>
        <Vacio icono="candado" titulo="Todavía no recibís pedidos">
          Los pedidos se habilitan cuando Operations revisa tu alta. <Link href={RUTAS.alta.ruta}>Ver el estado de mi alta</Link>.
        </Vacio>
      </div>
    );
  }
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  const { pedidos, disp, fee } = c.datos;
  const tarifa = tarifaTexto(fee.politica, api.ahora());
  const cuantos = (id: (typeof FILTROS)[number]['id']) => pedidos.filter((p) => id === 'todos' || p.tipo === id).length;
  const distancia = (p: (typeof pedidos)[number]) => (yo && p.zonaMapa ? distanciaM(yo, p.zonaMapa.centro) : null);
  const lista = pedidos.filter((p) => filtro === 'todos' || p.tipo === filtro);
  if (orden === 'cerca' && yo) lista.sort((a, b) => (distancia(a) ?? Number.MAX_VALUE) - (distancia(b) ?? Number.MAX_VALUE));

  return (
    <div className="pila">
      <div className="fila-flex fila-flex--entre">
        <h1 className="titulo">Pedidos</h1>
        <button type="button" className="boton boton--claro boton--chico" onClick={() => void c.recargar()}>
          <Icono nombre="reintentar" /> Actualizar
        </button>
      </div>
      <p className="texto-suave">No tenés obligación de aceptar ninguno: abrilo para ver el detalle y decidir.</p>
      {tarifa ? <p className="texto-suave texto-chico">{tarifa}</p> : null}
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {!disp.urgentesAhora ? (
        <Aviso tono="neutro" icono="rayo" titulo="No estás disponible para urgentes">
          No te ofrecemos pedidos “Ahora”. Prendé “Disponible” en el <Link href={RUTAS.inicio.ruta}>inicio</Link>.
        </Aviso>
      ) : null}
      {disp.zonas.length === 0 ? (
        <Aviso tono="aviso" icono="alerta" titulo="No marcaste ninguna zona">
          Sin zonas no te ofrecemos pedidos. <Link href={RUTAS.disponibilidad.ruta}>Elegir mis zonas</Link>.
        </Aviso>
      ) : null}

      <ul className="hx-chips hx-chips--carril" aria-label="Tipo de pedido">
        {FILTROS.map((f) => (
          <li key={f.id}>
            <ChipOpcion texto={`${f.texto} · ${cuantos(f.id)}`} elegido={filtro === f.id} onClick={() => setFiltro(f.id)} />
          </li>
        ))}
      </ul>
      <div className="ba-orden">
        <ul className="hx-chips" aria-label="Orden">
          <li>
            <ChipOpcion texto="Por llegada" icono="reloj" elegido={orden === 'llegada'} onClick={() => setOrden('llegada')} />
          </li>
          <li>
            <ChipOpcion texto={ubicando ? 'Buscando tu ubicación…' : 'Más cerca'} icono="pin" elegido={orden === 'cerca'} onClick={masCerca} />
          </li>
        </ul>
        <p className="texto-suave texto-chico">
          {orden === 'cerca' && yo
            ? 'Ordenados por distancia aproximada a cada zona. Tu ubicación se usa solo en el teléfono: no se manda.'
            : '"Más cerca" usa tu ubicación una vez, solo en el teléfono: no se manda a Handyx ni al cliente.'}
        </p>
        {sinUbicacion ? (
          <p className="texto-suave texto-chico" role="status">
            No pudimos leer tu ubicación: quedan por orden de llegada.
          </p>
        ) : null}
      </div>

      {lista.length === 0 ? (
        <Vacio icono="lupa" titulo="No hay pedidos para mostrar">
          No inventamos pedidos: cuando llegue uno de tus rubros, zonas y disponibilidad, aparece acá y te avisamos.
        </Vacio>
      ) : (
        <ul className="lista-tarjetas">
          {lista.map((p) => (
            <li key={p.id}>
              <TarjetaPedido pedido={p} distanciaM={orden === 'cerca' ? distancia(p) : null} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
