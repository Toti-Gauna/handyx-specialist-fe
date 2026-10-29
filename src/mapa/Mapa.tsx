'use client';
// Mapa de Handyx (lote 4.3). El motor (MapLibre, ~280 KB comprimido) se baja recién cuando el mapa aparece. Si no puede
// cargar (sin WebGL, sin conexión al abrirlo o una falla del motor) se ve la `alternativa`: un mosaico con el barrio o
// la distancia en texto. Nunca una pantalla rota. Lo importante del mapa siempre está también en texto, fuera de él.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icono } from '../components/Icono.tsx';
import type { CapasMapa, Motor } from './motor.ts';
import './mapa.css';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export interface PropsMapa extends CapasMapa {
  /** Nombre accesible del mapa ("Zona aproximada del pedido en La Perla"). */
  etiqueta: string;
  alto?: 'chico' | 'medio' | 'grande' | 'completo';
  interactivo?: boolean;
  /** Cuando cambia, el mapa vuelve a encuadrar todo (por ejemplo, con un trayecto recalculado). */
  encuadre?: string | number;
  /** Lo que se ve si el mapa no puede cargar. */
  alternativa: ReactNode;
  /** Botón para volver a encuadrar después de mover el mapa. */
  conCentrar?: boolean;
  /** Fracción del alto que tapa una hoja de abajo (el encuadre deja ese lugar libre). */
  tapadoAbajo?: number;
}

type Estado = 'cargando' | 'listo' | 'sin_mapa';
type Base = 'ok' | 'sin_datos' | 'sin_conexion' | null;

export function Mapa({ etiqueta, alto = 'medio', interactivo = false, encuadre, alternativa, conCentrar = false, tapadoAbajo = 0, ...capas }: PropsMapa) {
  const lienzo = useRef<HTMLDivElement>(null);
  const motor = useRef<Motor | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [mapaBase, setMapaBase] = useState<Base>(null);
  const ultimas = useRef<CapasMapa>(capas);
  ultimas.current = capas;

  useEffect(() => {
    let vivo = true;
    let m: Motor | null = null;
    const el = lienzo.current;
    if (!el) return;
    import('./motor.ts')
      .then(({ crearMotor }) =>
        crearMotor({
          contenedor: el,
          base,
          interactivo,
          etiqueta,
          alFallar: () => vivo && setEstado('sin_mapa'),
          alCambiarBase: (b) => vivo && setMapaBase(b),
        }),
      )
      .then((creado) => {
        if (!creado) return;
        if (!vivo) return creado.destruir();
        m = creado;
        motor.current = creado;
        creado.margenAbajo(el.clientHeight * tapadoAbajo);
        creado.actualizar(ultimas.current, true);
        setEstado('listo');
      })
      .catch(() => vivo && setEstado('sin_mapa'));
    return () => {
      vivo = false;
      motor.current = null;
      m?.destruir();
    };
    // El motor se crea una vez por mapa; las capas se actualizan en el efecto de abajo.
  }, []);

  const clave = JSON.stringify(capas);
  const encuadrePrevio = useRef(encuadre);
  useEffect(() => {
    if (estado !== 'listo' || !motor.current) return;
    const reencuadrar = encuadre !== encuadrePrevio.current;
    encuadrePrevio.current = encuadre;
    motor.current.actualizar(ultimas.current, reencuadrar);
  }, [clave, encuadre, estado]);

  return (
    <div className={`hx-mapa hx-mapa--${alto}`} data-mapa={estado}>
      {/* El nombre accesible va en el lienzo que crea MapLibre (una región con `etiqueta`). */}
      <div ref={lienzo} className="hx-mapa__lienzo" hidden={estado === 'sin_mapa'} />
      {estado === 'cargando' ? <div className="hx-mapa__cargando" aria-hidden="true" /> : null}
      {estado === 'sin_mapa' ? <div className="hx-mapa__respaldo">{alternativa}</div> : null}
      {estado === 'listo' && mapaBase === 'sin_datos' ? <p className="hx-mapa__nota">Sin calles: falta el mapa base</p> : null}
      {estado === 'listo' && mapaBase === 'sin_conexion' ? (
        <p className="hx-mapa__nota" role="status">
          Sin conexión: el mapa puede verse incompleto.
        </p>
      ) : null}
      {estado === 'listo' && conCentrar ? (
        <button type="button" className="hx-mapa__centrar" onClick={() => motor.current?.centrar(ultimas.current)}>
          <Icono nombre="pin" /> Centrar
        </button>
      ) : null}
    </div>
  );
}
