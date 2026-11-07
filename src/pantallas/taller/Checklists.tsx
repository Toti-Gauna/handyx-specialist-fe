'use client';
// Checklists de trabajo (fase H1.5): elegís el tipo de trabajo y vas tildando, siempre empezando por la seguridad. El
// avance vive en la pantalla (no se guarda). Desde H0.4 también están en el Modo trabajo.
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Icono } from '../../components/Icono.tsx';
import { Casilla } from '../../components/ui.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { sinMovimiento } from '../../kit/movimiento.ts';
import { CHECKLISTS_ELECTRICIDAD, clavePaso, totalPasos } from '../../taller/checklists.ts';
import { Opciones } from './piezas.tsx';
import './taller.css';

const PERIMETRO = 2 * Math.PI * 26;

export function Checklists() {
  const [id, setId] = useState(CHECKLISTS_ELECTRICIDAD[0]?.id ?? '');
  const [hechos, setHechos] = useState<Set<string>>(new Set());
  const anillo = useRef<SVGCircleElement>(null);
  const c = CHECKLISTS_ELECTRICIDAD.find((x) => x.id === id) ?? CHECKLISTS_ELECTRICIDAD[0];
  const total = c ? totalPasos(c) : 0;
  const listo = hechos.size;
  const completo = total > 0 && listo === total;

  useEffect(() => {
    if (!anillo.current) return;
    const offset = PERIMETRO * (1 - (total ? listo / total : 0));
    if (sinMovimiento()) gsap.set(anillo.current, { strokeDashoffset: offset });
    else gsap.to(anillo.current, { strokeDashoffset: offset, duration: 0.5, ease: 'power2.out' });
  }, [listo, total]);

  function marcar(clave: string, v: boolean) {
    setHechos((h) => {
      const n = new Set(h);
      if (v) n.add(clave);
      else n.delete(clave);
      return n;
    });
  }

  if (!c) return null;
  return (
    <div className="fl-pantalla tl">
      <BarraSuperior titulo="Checklists" atras={RUTAS.taller.ruta} textoAtras="Volver al Taller" acciones={null} />
      <Opciones
        etiqueta="Tipo de trabajo"
        opciones={CHECKLISTS_ELECTRICIDAD.map((x) => ({ valor: x.id, texto: x.titulo }))}
        valor={id}
        onCambio={(v) => {
          setId(v);
          setHechos(new Set());
        }}
      />
      <section className={`tl-progreso${completo ? ' tl-progreso--listo' : ''}`} aria-live="polite">
        <svg viewBox="0 0 60 60" width="64" height="64" aria-hidden="true">
          <circle cx="30" cy="30" r="26" className="tl-progreso__fondo" />
          <circle ref={anillo} cx="30" cy="30" r="26" className="tl-progreso__barra" strokeDasharray={PERIMETRO} strokeDashoffset={PERIMETRO} />
        </svg>
        <p>
          <strong>{completo ? '¡Listo!' : `${listo} de ${total}`}</strong>
          <span>{completo ? 'Hiciste todos los pasos.' : 'pasos hechos'}</span>
        </p>
      </section>
      {c.secciones.map((s, i) => (
        <section key={s.titulo} className={`tl-tarjeta${i === 0 ? ' tl-tarjeta--seguridad' : ''}`} aria-labelledby={`tl-cl-${i}`}>
          <h2 id={`tl-cl-${i}`} className="tl-tarjeta__titulo">
            {i === 0 ? <Icono nombre="escudo" /> : null} {s.titulo}
          </h2>
          {s.pasos.map((p, j) => (
            <Casilla key={p} etiqueta={p} checked={hechos.has(clavePaso(i, j))} onChange={(e) => marcar(clavePaso(i, j), e.target.checked)} />
          ))}
        </section>
      ))}
      <button type="button" className="boton boton--claro" onClick={() => setHechos(new Set())} disabled={!listo}>
        <Icono nombre="reintentar" /> Empezar de nuevo
      </button>
    </div>
  );
}
