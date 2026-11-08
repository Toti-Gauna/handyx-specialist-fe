'use client';
// Barra de pestañas flotante de vidrio azul (única excepción al "sin vidrio", decisión de Ignacio del 08/11/2026):
// Inicio · Obras · Taller · Mensajes · Cuenta. Fondo sólido si el navegador no tiene backdrop-filter o si se pide
// reducir la transparencia (organismos.css). La pestaña actual lleva aria-current y se distingue también por el fondo
// blanco y el texto en negrita, no solo por el color.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PESTANAS, pestanaActiva } from '../../app/rutas/navegacion.ts';
import { Icono } from '../atomos/Icono.tsx';

export function BarraPestanas({ insignias = {} }: { insignias?: Partial<Record<(typeof PESTANAS)[number]['id'], number>> }) {
  const actual = pestanaActiva(usePathname() ?? '');
  return (
    <nav className="ui-pestanas" aria-label="Secciones">
      {PESTANAS.map((p) => {
        const on = p.id === actual;
        const n = insignias[p.id] ?? 0;
        return (
          <Link key={p.id} href={p.ruta} className={`ui-pestanas__item${on ? ' ui-pestanas__item--on' : ''}`} aria-current={on ? 'page' : undefined}>
            <Icono nombre={p.icono} />
            <span className="ui-pestanas__texto">{p.texto}</span>
            {n > 0 ? (
              <span className="ui-pestanas__insignia">
                {n > 9 ? '9+' : n}
                <span className="visualmente-oculto"> sin leer</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
