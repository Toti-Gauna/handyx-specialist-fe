'use client';
// Escena de acceso del kit v3 (lote 1.1, D6-Bienvenida, D6-Login, D6-Acceso y D6-Codigo): cielo azul de noche con
// luna, estrellas y la Mar del Plata isométrica (`Ciudad`) que se arma al aparecer: los edificios, el faro y el puerto
// suben uno por uno (GSAP). Con «reducir movimiento» se ve armada y quieta. Todo el dibujo es decorativo (aria-hidden);
// lo único que se lee es la marca y el botón Volver, que quedan fuera del dibujo.
// - `alta`: la bienvenida (la ciudad grande). `baja`: cabecera de las pantallas de entrar.
// - `icono`: mosaico blanco que pisa el borde de abajo (D6-Acceso: llave; D6-Codigo: sobre).
import Link from 'next/link';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';
import { sinMovimiento } from '../../kit/movimiento.ts';
import { Icono, type NombreIconoUi } from '../atomos/Icono.tsx';
import { Ciudad } from '../ilustraciones/Ciudad.tsx';

const ESTRELLAS = 9;

export function EscenaCiudad({ tam = 'baja', marca = false, hrefVolver, icono, armar = true }: { tam?: 'alta' | 'baja'; marca?: boolean; hrefVolver?: string; icono?: NombreIconoUi; armar?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!armar || !el || sinMovimiento()) return;
    // Los hijos directos del dibujo (pisos, edificios, casas, árboles, faro, barco) en el orden en que se dibujan.
    const piezas = el.querySelectorAll<SVGGElement>('.ui-escena-ciudad__ciudad svg > *');
    const tl = gsap.timeline();
    tl.from(el.querySelector('.ui-escena-ciudad__luna'), { scale: 0.4, opacity: 0, duration: 0.6, ease: 'back.out(1.8)' }, 0);
    tl.from(el.querySelectorAll('.ui-escena-ciudad__estrella'), { opacity: 0, duration: 0.4, stagger: 0.05 }, 0.1);
    tl.from(piezas, { y: 26, opacity: 0, duration: 0.45, ease: 'back.out(1.5)', stagger: 0.05 }, 0.15);
    return () => {
      tl.revert();
    };
  }, [armar]);

  return (
    <div className={`ui-escena-ciudad ui-escena-ciudad--${tam}${icono ? ' ui-escena-ciudad--con-icono' : ''}`}>
      <div ref={ref} className="ui-escena-ciudad__cielo" aria-hidden="true">
        {Array.from({ length: ESTRELLAS }, (_, i) => (
          <span key={i} className="ui-escena-ciudad__estrella" />
        ))}
        <span className="ui-escena-ciudad__luna" />
        <div className="ui-escena-ciudad__ciudad">
          <Ciudad tam="lleno" />
        </div>
      </div>
      {hrefVolver || marca ? (
        <div className="ui-escena-ciudad__arriba">
          {hrefVolver ? (
            <Link href={hrefVolver} className="ui-boton-icono ui-boton-icono--vidrio" aria-label="Volver">
              <Icono nombre="atras" />
            </Link>
          ) : null}
          {marca ? (
            <p className="ui-escena-ciudad__marca">
              <span className="ui-escena-ciudad__logo">Handyx</span>
              <span className="ui-escena-ciudad__lema">Soluciones, no problemas</span>
            </p>
          ) : null}
        </div>
      ) : null}
      {icono ? (
        <span className="ui-escena-ciudad__icono" aria-hidden="true">
          <Icono nombre={icono} tam="grande" />
        </span>
      ) : null}
    </div>
  );
}
