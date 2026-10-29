'use client';
// Navegación del kit v2: barra superior compacta (con título grande que colapsa al bajar) y pestañas flotantes.
// La cabecera con logo queda solo para Inicio; el resto de las pantallas usa esta barra (docs/diseno.md).
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icono, type NombreIcono } from '../components/Icono.tsx';

interface PropsBarra {
  titulo: string;
  /** Ruta de "atrás". Sin ella no hay botón (pantallas raíz). */
  atras?: string;
  /** Texto para lectores de pantalla del botón de atrás. */
  textoAtras?: string;
  acciones?: ReactNode;
  /**
   * Título grande debajo de la barra (pantallas raíz y listas). Al bajar, el grande sale de la vista y aparece el
   * chico en la barra. El h1 es siempre uno solo: el grande, o el de la barra si no hay grande.
   */
  grande?: boolean;
  children?: ReactNode;
}

export function BarraSuperior({ titulo, atras, textoAtras = 'Volver', acciones, grande = false, children }: PropsBarra) {
  const marca = useRef<HTMLHeadingElement>(null);
  const [compacta, setCompacta] = useState(!grande);
  useEffect(() => {
    const el = marca.current;
    if (!grande || !el || typeof IntersectionObserver === 'undefined') return;
    // Se observa contra el contenedor que desplaza la pantalla (la ventana, o el marco del catálogo).
    let raiz: HTMLElement | null = el.parentElement;
    while (raiz && !/(auto|scroll)/.test(getComputedStyle(raiz).overflowY)) raiz = raiz.parentElement;
    const obs = new IntersectionObserver(([e]) => setCompacta(!(e?.isIntersecting ?? true)), { root: raiz, rootMargin: '-64px 0px 0px 0px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [grande]);

  return (
    <>
      <header className={`hx-barra${grande ? ' hx-barra--grande' : ''}${compacta ? ' hx-barra--sombra' : ''}`}>
        {atras ? (
          <Link className="hx-circulo" href={atras} aria-label={textoAtras}>
            <Icono nombre="atras" />
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
        {grande ? (
          <p className="hx-barra__titulo" aria-hidden="true">
            {titulo}
          </p>
        ) : (
          <h1 className="hx-barra__titulo">{titulo}</h1>
        )}
        <div className="hx-barra__acciones">{acciones}</div>
      </header>
      {grande ? (
        <h1 ref={marca} className="hx-titulo hx-titulo-grande">
          {titulo}
        </h1>
      ) : null}
      {children}
    </>
  );
}

export interface ItemPestana {
  href: string;
  texto: string;
  icono: NombreIcono;
  /** Cantidad sin leer (mensajes, avisos). Se anuncia con texto. */
  insignia?: number;
}

/** Pestañas flotantes: solo en las 4 pantallas raíz (Inicio, Agenda, Mensajes, Cuenta). */
export function PestanasFlotantes({ items, actual }: { items: ItemPestana[]; actual: string }) {
  return (
    <nav className="hx-pestanas" aria-label="Secciones">
      {items.map((it) => {
        const activa = actual.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className="hx-pestana" aria-current={activa ? 'page' : undefined}>
            <Icono nombre={it.icono} />
            {it.texto}
            {it.insignia ? (
              <span className="hx-pestana__insignia">
                {it.insignia > 9 ? '9+' : it.insignia}
                <span className="visualmente-oculto"> sin leer</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
