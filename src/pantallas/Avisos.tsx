'use client';
// Avisos (lote 4.5): agrupados en Nuevos (sin leer) y Antes, deslizar a la izquierda para borrar (y un botón que hace
// lo mismo, para quien no desliza) y "Borrar todos" con confirmación. Abrir un aviso solo muestra el detalle: nunca
// acepta nada. Lo importante no se pierde al borrar: sigue en su pantalla (pedido, trabajo, caja).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRef, useState, type PointerEvent } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono, type NombreIcono } from '../components/Icono.tsx';
import { Volver } from '../components/Volver.tsx';
import { ChipTipo } from '../components/ui.tsx';
import type { Aviso } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { haceCuanto } from '../lib/formato.ts';
import { useIsla } from '../kit/Efectos.tsx';
import './avisos.css';

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
  te_eligieron: 'checkCirculo',
  mensaje: 'chat',
  trabajo: 'maletin',
  pago: 'caja',
  soporte: 'pregunta',
  cuenta: 'usuario',
};

/** Más que esto hacia la izquierda, al soltar, borra el aviso. */
const UMBRAL_BORRAR = 96;

export function Avisos() {
  const c = useCarga(() => api.avisos(), []);
  const ahora = useAhora(30_000);
  const isla = useIsla();
  const borrado = useAccion();
  const [confirmar, setConfirmar] = useState(false);

  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const nuevos = c.datos.filter((a) => !a.leido);
  const antes = c.datos.filter((a) => a.leido);

  async function abrir(a: Aviso) {
    if (!a.leido) await api.marcarAvisoLeido(a.id).catch(() => undefined);
  }
  async function borrar(a: Aviso) {
    const r = await borrado.ejecutar(async () => {
      await api.borrarAviso(a.id);
      await c.recargar();
    });
    if (r.ok) isla({ titulo: 'Borraste el aviso', texto: a.titulo, icono: 'tacho' });
  }
  async function borrarTodos() {
    const r = await borrado.ejecutar(async () => {
      await api.borrarAvisos();
      await c.recargar();
    });
    if (r.ok) setConfirmar(false);
  }

  const grupo = (titulo: string, lista: Aviso[]) =>
    lista.length === 0 ? null : (
      <section className="av-grupo" aria-label={titulo}>
        <h2>{titulo}</h2>
        <ul className="av-lista">
          {lista.map((a) => (
            <ItemAviso key={a.id} aviso={a} ahora={ahora} alAbrir={() => void abrir(a)} alBorrar={() => void borrar(a)} />
          ))}
        </ul>
      </section>
    );

  return (
    <div className="pila">
      <Volver a={RUTAS.inicio.ruta} texto="Inicio" />
      <div className="fila-flex fila-flex--entre">
        <h1 className="titulo">Avisos</h1>
        {c.datos.length > 0 ? (
          <button type="button" className="boton boton--claro boton--chico" onClick={() => setConfirmar(true)}>
            <Icono nombre="tacho" /> Borrar todos
          </button>
        ) : null}
      </div>
      <p className="texto-suave texto-chico">Abrir un aviso solo te muestra el detalle: nunca acepta nada por vos. Deslizá uno a la izquierda para borrarlo.</p>
      {borrado.fallo && !confirmar ? <ErrorCaja fallo={borrado.fallo} /> : null}
      {c.datos.length === 0 ? (
        <Vacio icono="campana" titulo="No tenés avisos">
          Cuando haya un pedido para vos, una respuesta o un cobro, te avisamos acá.
        </Vacio>
      ) : (
        <>
          {grupo('Nuevos', nuevos)}
          {grupo('Antes', antes)}
        </>
      )}
      <Hoja abierta={confirmar} titulo="¿Borrar todos los avisos?" onCerrar={() => setConfirmar(false)}>
        <p>Se borran de esta lista. Lo importante no se pierde: los pedidos, trabajos y cobros siguen en sus pantallas.</p>
        {borrado.fallo ? <ErrorCaja fallo={borrado.fallo} onReintentar={() => void borrarTodos()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--peligro" disabled={borrado.pendiente} onClick={() => void borrarTodos()}>
            {borrado.pendiente ? 'Borrando…' : 'Sí, borrar todos'}
          </button>
          <button type="button" className="boton boton--claro" onClick={() => setConfirmar(false)}>
            No, volver
          </button>
        </div>
      </Hoja>
    </div>
  );
}

function ItemAviso({ aviso: a, ahora, alAbrir, alBorrar }: { aviso: Aviso; ahora: Date; alAbrir(): void; alBorrar(): void }) {
  // Mientras se arrastra, el corrimiento va en la variable --av-dx (sin estilos inline en JSX, como HojaArrastrable).
  const frente = useRef<HTMLDivElement>(null);
  const gesto = useRef<{ x: number; y: number; dx: number; horizontal: boolean | null } | null>(null);
  const movido = useRef(false);
  const [listo, setListo] = useState(false);

  function correr(dx: number) {
    if (dx === 0) frente.current?.style.removeProperty('--av-dx');
    else frente.current?.style.setProperty('--av-dx', `${dx}px`);
  }
  function bajar(e: PointerEvent<HTMLLIElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    gesto.current = { x: e.clientX, y: e.clientY, dx: 0, horizontal: null };
    movido.current = false;
  }
  function mover(e: PointerEvent<HTMLLIElement>) {
    const g = gesto.current;
    if (!g) return;
    const mx = e.clientX - g.x;
    const my = e.clientY - g.y;
    // La dirección se decide con los primeros píxeles: el desplazamiento vertical sigue siendo de la página.
    if (g.horizontal === null && Math.abs(mx) + Math.abs(my) > 8) g.horizontal = Math.abs(mx) > Math.abs(my);
    if (!g.horizontal) return;
    movido.current = true;
    g.dx = Math.min(0, mx);
    correr(g.dx);
    setListo(g.dx < -UMBRAL_BORRAR);
  }
  function soltar() {
    const g = gesto.current;
    gesto.current = null;
    correr(0);
    setListo(false);
    if (g && g.dx < -UMBRAL_BORRAR) alBorrar();
  }

  return (
    <li className={`av-item${a.leido ? '' : ' av-item--nuevo'}`} onPointerDown={bajar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
      <span className={`av-item__fondo${listo ? ' av-item__fondo--listo' : ''}`} aria-hidden="true">
        <Icono nombre="tacho" /> Borrar
      </span>
      <div ref={frente} className="av-item__frente">
        <Link
          className="av-item__enlace"
          href={destino(a)}
          draggable={false}
          onClick={(e) => {
            // Un arrastre no es un toque: no abre el aviso.
            if (movido.current) e.preventDefault();
            else alAbrir();
          }}
        >
          <span className="av-item__ico" aria-hidden="true">
            <Icono nombre={ICONO[a.tipo]} />
          </span>
          <span className="av-item__texto">
            <span className="av-item__titulo">
              {a.tipo === 'pedido_urgente' ? <ChipTipo tipo="urgente" /> : null}
              {a.tipo === 'pedido_programado' ? <ChipTipo tipo="programado" /> : null}
              <strong>{a.titulo}</strong>
            </span>
            <span>{a.cuerpo}</span>
            <small>
              {haceCuanto(a.creadoEn, ahora)}
              {a.leido ? '' : ' · sin leer'}
            </small>
          </span>
        </Link>
        <button type="button" className="av-item__borrar" aria-label={`Borrar el aviso: ${a.titulo}`} onClick={alBorrar}>
          <Icono nombre="tacho" />
        </button>
      </div>
    </li>
  );
}
