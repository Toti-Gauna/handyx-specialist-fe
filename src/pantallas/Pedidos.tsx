'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPedido } from '../components/TarjetaPedido.tsx';
import { Aviso } from '../components/ui.tsx';
import { useCarga } from '../hooks/useCarga.ts';
import { tarifaTexto } from '../lib/tarifa.ts';

const FILTROS = [
  { id: 'todos', texto: 'Todos' },
  { id: 'urgente', texto: 'Urgentes' },
  { id: 'programado', texto: 'Programados' },
  { id: 'obra', texto: 'Obras' },
] as const;

export function Pedidos() {
  const { perfil } = usePerfil();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('todos');
  const habilitada = perfil.estadoAlta === 'habilitada';
  const c = useCarga(async () => {
    if (!habilitada) return null;
    const [p, d, f] = await Promise.all([api.pedidosElegibles(), api.disponibilidad(), api.feeVigente()]);
    return { pedidos: p.items, disp: d, fee: f };
  }, [habilitada]);

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
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  const { pedidos, disp, fee } = c.datos;
  const tarifa = tarifaTexto(fee.politica, api.ahora());
  const lista = pedidos.filter((p) => filtro === 'todos' || p.tipo === filtro);

  return (
    <div className="pila">
      <div className="fila-flex fila-flex--entre">
        <h1 className="titulo">Pedidos</h1>
        <button type="button" className="boton boton--claro boton--chico" onClick={() => void c.recargar()}>
          <Icono nombre="reintentar" /> Actualizar
        </button>
      </div>
      <p className="texto-suave">Por orden de llegada. No tenés obligación de aceptar ninguno: abrilo para ver el detalle y decidir.</p>
      {tarifa ? <p className="texto-suave texto-chico">{tarifa}</p> : null}
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {!disp.urgentesAhora ? (
        <Aviso tono="neutro" icono="rayo" titulo="Tenés los pedidos urgentes apagados">
          No te ofrecemos pedidos “Ahora”. <Link href={RUTAS.disponibilidad.ruta}>Cambiarlo en mi disponibilidad</Link>.
        </Aviso>
      ) : null}
      {disp.zonas.length === 0 ? (
        <Aviso tono="aviso" icono="alerta" titulo="No marcaste ninguna zona">
          Sin zonas no te ofrecemos pedidos. <Link href={RUTAS.disponibilidad.ruta}>Elegir mis zonas</Link>.
        </Aviso>
      ) : null}
      <div className="tabs" role="tablist" aria-label="Tipo de pedido">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}>
            {f.texto}
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
        <Vacio icono="lupa" titulo="No hay pedidos para mostrar">
          No inventamos pedidos: cuando llegue uno de tus rubros, zonas y disponibilidad, aparece acá y te avisamos.
        </Vacio>
      ) : (
        <ul className="lista-tarjetas">
          {lista.map((p) => (
            <li key={p.id}>
              <TarjetaPedido pedido={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
