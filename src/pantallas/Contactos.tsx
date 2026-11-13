'use client';
// Contactos (lote 4.8): solo los que agregaste desde un chat. La app no lee la agenda del teléfono ni muestra números;
// escribirle a un contacto abre su chat de siempre. Quitarlo no borra la conversación.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { Icono } from '../components/Icono.tsx';
import { Volver } from '../components/Volver.tsx';
import type { Contacto } from '../contracts/dto.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { Avatar, EstadoVacio } from '../kit/Piezas.tsx';
import './mensajes.css';

export function Contactos() {
  const c = useCarga(() => api.contactos(), []);
  const isla = useIsla();
  const quitar = useAccion();
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  async function sacar(k: Contacto) {
    const r = await quitar.ejecutar(async () => {
      await api.quitarContacto(k.id);
      await c.recargar();
    });
    if (r.ok) isla({ titulo: 'Lo sacaste de tus contactos', texto: `La conversación con ${k.nombre} sigue en Mensajes.`, icono: 'contactos' });
  }

  return (
    <div className="pila me">
      <Volver a={RUTAS.mensajes.ruta} texto="Mensajes" />
      <h1 className="titulo">Contactos</h1>
      <p className="texto-suave">Solo los que agregaste desde un chat. Handyx no lee la agenda de tu teléfono ni muestra números.</p>
      {quitar.fallo ? <ErrorCaja fallo={quitar.fallo} /> : null}
      {c.datos.length === 0 ? (
        <EstadoVacio titulo="Todavía no agregaste contactos">Desde un chat, tocá «Agregar a contactos» para tener a mano a un cliente.</EstadoVacio>
      ) : (
        <ul className="me-lista">
          {c.datos.map((k) => (
            <li key={k.id} className="me-contacto">
              <Avatar nombre={k.nombre} />
              <span className="me-fila__texto">
                <strong>{k.nombre}</strong>
                <small>{k.detalle}</small>
              </span>
              <Link className="hx-circulo hx-circulo--azul" href={`${RUTAS.hilo.ruta}?id=${k.conversacionId}`} aria-label={`Escribirle a ${k.nombre}`}>
                <Icono nombre="enviar" />
              </Link>
              <button type="button" className="hx-circulo" aria-label={`Sacar a ${k.nombre} de tus contactos`} disabled={quitar.pendiente} onClick={() => void sacar(k)}>
                <Icono nombre="tacho" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
