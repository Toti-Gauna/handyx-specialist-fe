'use client';
// Visor 3D reutilizable de Handyx (lote 0.3, D.4). Escena con las luces y materiales de la marca, gestos (girar con un
// dedo, acercar con pellizco, doble toque para centrar) y botones que hacen lo mismo sin arrastrar (WCAG 2.5.7).
// Se dibuja solo cuando algo cambia. **Siempre con descripción en texto** (el 3D apoya, no reemplaza) y, sin WebGL,
// con una alternativa. Con «reducir movimiento», sin giro automático ni animaciones. Guía: docs/tres.md.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import type * as THREE from 'three';
import { Icono } from '../components/Icono.tsx';
import { sinMovimiento } from '../kit/movimiento.ts';
import { detectarWebgl, leerEquipo } from './capacidades.ts';
import { crearMotor, type MontarEscena, type Motor, type Mover } from './motor.ts';
import type { LimitesOrbita, Vista } from './orbita.ts';
import { presupuestoPara, type NivelTres } from './presupuesto.ts';

export type { ContextoVisor, MontarEscena } from './motor.ts';

export interface ManejoVisor {
  /** Vuelve a la vista inicial. */
  centrar(): void;
  /** Imagen PNG de la vista actual (para compartir o para la miniatura de Quick Look). */
  imagen(): Promise<Blob | null>;
  /** Copia de lo que hay en la escena (para la AR). */
  objeto(): THREE.Object3D | null;
  /** Dibujá de nuevo después de cambiar algo desde afuera. */
  pedirCuadro(): void;
}

export interface PropsVisor3D {
  /**
   * Qué muestra el 3D, en texto. Obligatoria: los lectores de pantalla la leen y, sin WebGL, es lo que queda.
   * «Termotanque de 85 cm de alto y 45 cm de diámetro, medidas aproximadas.»
   */
  descripcion: string;
  /** Arma la escena. Pasala estable (useCallback): si cambia, la escena se rearma. */
  montar: MontarEscena;
  /** La descripción se ve debajo del 3D (por defecto) o queda solo para lectores, si la pantalla ya la muestra. */
  descripcionVisible?: boolean;
  /** Qué mostrar si no hay WebGL (una imagen, un dibujo). Sin esto, un aviso corto; la descripción queda siempre. */
  alternativa?: ReactNode;
  fondo?: 'claro' | 'noche' | 'transparente';
  /** Giro lento cuando nadie toca (vitrina). Nunca con «reducir movimiento». */
  giro?: boolean;
  /** Botones de girar, acercar y centrar. */
  controles?: boolean;
  /** Ayuda corta encima del 3D. `null` la oculta. */
  ayuda?: string | null;
  limites?: Partial<LimitesOrbita>;
  /** Vista inicial (y la de «Centrar»): tres cuartos por defecto, isométrica para las escenas de arreglos. */
  vista?: Vista;
  /** Forzar un nivel de rendimiento (pruebas en gama baja: 'bajo'). */
  nivel?: NivelTres;
  className?: string;
}

function IconoMenos() {
  return (
    <svg className="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14" />
    </svg>
  );
}

const CONTROLES: { mover: Mover; texto: string; icono: ReactNode }[] = [
  { mover: 'izquierda', texto: 'Girar a la izquierda', icono: <Icono nombre="izquierda" /> },
  { mover: 'derecha', texto: 'Girar a la derecha', icono: <Icono nombre="derecha" /> },
  { mover: 'acercar', texto: 'Acercar', icono: <Icono nombre="mas" /> },
  { mover: 'alejar', texto: 'Alejar', icono: <IconoMenos /> },
];

export const Visor3D = forwardRef<ManejoVisor, PropsVisor3D>(function Visor3D(
  { descripcion, montar, descripcionVisible = true, alternativa, fondo = 'claro', giro = false, controles = true, ayuda = 'Girá con un dedo y acercá con dos.', limites, vista, nivel, className },
  ref,
) {
  const escena = useRef<HTMLDivElement>(null);
  const motor = useRef<Motor | null>(null);
  const [estado, setEstado] = useState<'preparando' | 'listo' | 'sin-webgl'>('preparando');
  // Lo que define al renderer se lee una vez, al montar (cambiarlo exige otro contexto de WebGL).
  const inicio = useRef({ giro, limites, vista, nivel });

  useEffect(() => {
    const caja = escena.current;
    if (!caja) return;
    const webgl = detectarWebgl(() => document.createElement('canvas'));
    const m = webgl.disponible
      ? crearMotor(caja, {
          presupuesto: presupuestoPara(leerEquipo(navigator as Navigator & { deviceMemory?: number }, window.devicePixelRatio, webgl), inicio.current.nivel),
          sinMovimiento: sinMovimiento(),
          giro: inicio.current.giro,
          limites: inicio.current.limites,
          vista: inicio.current.vista,
          alPerderContexto: () => setEstado('sin-webgl'),
        })
      : null;
    motor.current = m;
    // El estado sale de algo externo (WebGL): se fija después de probarlo, una sola vez.
    setEstado(m ? 'listo' : 'sin-webgl');
    return () => {
      m?.liberar();
      motor.current = null;
    };
  }, []);

  useEffect(() => {
    if (estado === 'listo') motor.current?.montar(montar);
  }, [montar, estado]);

  useEffect(() => {
    motor.current?.ponerGiro(giro);
  }, [giro]);

  useImperativeHandle(ref, () => ({
    centrar: () => motor.current?.centrar(),
    imagen: () => motor.current?.imagen() ?? Promise.resolve(null),
    objeto: () => motor.current?.objeto() ?? null,
    pedirCuadro: () => motor.current?.pedirCuadro(),
  }));

  const sinWebgl = estado === 'sin-webgl';
  const clases = ['tr-visor', `tr-visor--${fondo}`, sinWebgl ? 'tr-visor--sin-webgl' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <figure className={clases}>
      <div ref={escena} className="tr-visor__escena" aria-busy={estado === 'preparando'}>
        {sinWebgl &&
          (alternativa ?? (
            <div className="tr-visor__alternativa">
              <Icono nombre="info" />
              <p>Este teléfono no puede mostrar el 3D. Abajo tenés todo en texto.</p>
            </div>
          ))}
        {estado === 'listo' && ayuda && (
          <p className="tr-visor__ayuda" aria-hidden="true">
            {ayuda}
          </p>
        )}
      </div>
      {estado === 'listo' && controles && (
        <div className="tr-visor__controles" role="group" aria-label="Mover la vista 3D">
          {CONTROLES.map((c) => (
            <button key={c.mover} type="button" className="tr-visor__control" aria-label={c.texto} title={c.texto} onClick={() => motor.current?.mover(c.mover)}>
              {c.icono}
            </button>
          ))}
          <button type="button" className="tr-visor__control tr-visor__control--texto" onClick={() => motor.current?.centrar()}>
            <Icono nombre="reintentar" /> Centrar
          </button>
        </div>
      )}
      <figcaption className={descripcionVisible || sinWebgl ? 'tr-visor__descripcion' : 'visualmente-oculto'}>{descripcion}</figcaption>
    </figure>
  );
});
