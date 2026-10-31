'use client';
// Bienvenida (lote 4.2): tres láminas con lo que distingue a Handyx para el especialista y, al final, crear cuenta o
// entrar. Se deslizan con el dedo o con "Siguiente"; los puntos llevan a cada una.
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Escena } from '../components/Cuenta.tsx';
import type { NombreHandy } from '../components/Handy.tsx';
import type { NombreIcono } from '../components/Icono.tsx';
import { Icono } from '../components/Icono.tsx';
import { sinMovimiento } from '../kit/movimiento.ts';

interface Lamina {
  tono: 'azul' | 'amarillo' | 'noche';
  handy: NombreHandy;
  iconos: NombreIcono[];
  antes: string;
  marca: string;
  despues: string;
  texto: string;
}

const LAMINAS: Lamina[] = [
  {
    tono: 'azul',
    handy: 'lamparita',
    iconos: ['etiqueta', 'llave', 'rayo'],
    antes: 'Vos ponés ',
    marca: 'tu precio',
    despues: '',
    texto: 'Handyx te sugiere un valor para cada pedido, pero decidís vos. Nadie te asigna trabajos: elegís a cuáles proponerte.',
  },
  {
    tono: 'amarillo',
    handy: 'engranaje',
    iconos: ['billetera', 'canilla', 'check'],
    antes: 'La plata va ',
    marca: 'directo a vos',
    despues: '',
    texto: 'El cliente te paga por Mercado Pago o en efectivo. Handyx no recibe, guarda ni retiene tu plata.',
  },
  {
    tono: 'noche',
    handy: 'grupo',
    iconos: ['calendario', 'ladrillos', 'aire'],
    antes: '0 % de tarifa ',
    marca: 'hasta el 10/12',
    despues: '',
    texto: 'Durante la demo, Handyx no te cobra nada. No es un descuento sobre tu precio: es la tarifa de Handyx.',
  },
];

export function Bienvenida() {
  const carril = useRef<HTMLUListElement>(null);
  const [actual, setActual] = useState(0);
  const ultima = actual === LAMINAS.length - 1;

  // La lámina visible sale del desplazamiento (con el dedo, el teclado o los botones).
  useEffect(() => {
    const el = carril.current;
    if (!el) return;
    const alMover = () => setActual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener('scroll', alMover, { passive: true });
    return () => el.removeEventListener('scroll', alMover);
  }, []);

  function ir(i: number) {
    const el = carril.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: sinMovimiento() ? 'auto' : 'smooth' });
    setActual(i);
  }

  return (
    <section className="cu-bienvenida" aria-labelledby="bienvenida-titulo">
      <h1 id="bienvenida-titulo" className="visualmente-oculto">
        Bienvenida a Handyx
      </h1>
      {/* Enfocable: con las flechas se pasa de lámina (además del dedo y los botones). */}
      <ul
        ref={carril}
        className="cu-laminas"
        tabIndex={0}
        aria-label="Láminas de bienvenida. Usá las flechas para pasar."
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' && actual < LAMINAS.length - 1) ir(actual + 1);
          else if (e.key === 'ArrowLeft' && actual > 0) ir(actual - 1);
          else return;
          e.preventDefault();
        }}
      >
        {LAMINAS.map((l, i) => (
          <li key={l.marca} className="cu-lamina" aria-label={`Lámina ${i + 1} de ${LAMINAS.length}`} aria-hidden={i !== actual}>
            <Escena tono={l.tono} handy={l.handy} alto={l.handy === 'grupo' ? 120 : 190} iconos={l.iconos} />
            <h2 className="hx-titulo cu-titulo">
              {l.antes}
              <span className="hx-marca">{l.marca}</span>
              {l.despues}
            </h2>
            <p className="cu-bajada">{l.texto}</p>
          </li>
        ))}
      </ul>

      <div className="cu-acciones">
        <ul className="cu-puntos">
          {LAMINAS.map((l, i) => (
            <li key={l.marca}>
              <button type="button" className="cu-punto" aria-label={`Ver la lámina ${i + 1}`} aria-current={i === actual} onClick={() => ir(i)} />
            </li>
          ))}
        </ul>
        {ultima ? (
          <>
            <Link className="boton boton--bloque" href={RUTAS.registro.ruta}>
              Crear cuenta
            </Link>
            <Link className="boton boton--claro boton--bloque" href={RUTAS.acceso.ruta}>
              Ya tengo cuenta
            </Link>
          </>
        ) : (
          <div className="cu-acciones__fila">
            <button type="button" className="boton boton--fantasma" onClick={() => ir(LAMINAS.length - 1)}>
              Saltear
            </button>
            <button type="button" className="boton" onClick={() => ir(actual + 1)}>
              Siguiente <Icono nombre="derecha" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
