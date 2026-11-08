'use client';
// Botón de AR común (lote 0.3; generaliza el del Taller, H1.4). En Android con WebXR abre la cámara en la app; en
// iPhone prepara un USDZ y muestra el enlace de AR Quick Look. Si el teléfono no tiene ninguno de los dos, no aparece:
// la vista 3D y su descripción ya dicen todo. Mismas props que src/pantallas/taller/BotonAr.tsx, más opciones.
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { Icono } from '../components/Icono.tsx';
import { useIsla } from '../kit/Efectos.tsx';
import { abrirAr, modoAr, prepararUsdz, type ModoAr, type SesionAr, type Superficie } from './ar.ts';

export const INSTRUCCION_AR: Record<Superficie, string> = {
  pared: 'Apuntá a la pared, esperá el círculo amarillo y tocá para ubicarlo.',
  techo: 'Apuntá al techo, esperá el círculo amarillo y tocá para ubicarla.',
  piso: 'Apuntá al piso, esperá el círculo amarillo y tocá para ubicarlo.',
};

export interface PropsBotonAr {
  /** Arma el objeto a mostrar (una copia: la AR no toca el visor). */
  crear: () => THREE.Object3D | null;
  /** Unidades de la escena a metros. */
  escala: number;
  superficie: Superficie;
  /** «Ver en la pared», «Ver en el lugar (AR)». */
  texto: string;
  /** Foto de la vista actual: Quick Look exige una imagen dentro del enlace. */
  miniatura: () => Promise<Blob | null>;
  /** Reemplaza la instrucción por defecto de la superficie. */
  instruccion?: string;
  /** Resolución de la cámara en XR (gama baja: 0,75). */
  escalaBuffer?: number;
}

export function BotonAr({ crear, escala, superficie, texto, miniatura, instruccion, escalaBuffer }: PropsBotonAr) {
  const [modo, setModo] = useState<ModoAr>('ninguno');
  const [activa, setActiva] = useState(false);
  const [colocado, setColocado] = useState(false);
  const [ql, setQl] = useState<{ modelo: string; foto: string } | null>(null);
  const capa = useRef<HTMLDivElement>(null);
  const sesion = useRef<SesionAr | null>(null);
  const isla = useIsla();

  useEffect(() => {
    let vivo = true;
    void modoAr().then((m) => {
      if (vivo) setModo(m);
    });
    return () => {
      vivo = false;
      sesion.current?.terminar();
    };
  }, []);
  useEffect(
    () => () => {
      if (ql) {
        URL.revokeObjectURL(ql.modelo);
        URL.revokeObjectURL(ql.foto);
      }
    },
    [ql],
  );

  async function abrir() {
    const objeto = crear();
    if (!objeto || !capa.current) return;
    try {
      setColocado(false);
      setActiva(true);
      sesion.current = await abrirAr({ objeto, escala, superficie, capa: capa.current, escalaBuffer, alColocar: () => setColocado(true), alSalir: () => setActiva(false) });
    } catch {
      setActiva(false);
      isla({ titulo: 'No pudimos abrir la cámara en AR', texto: 'Revisá el permiso de la cámara y probá de nuevo.', icono: 'alerta', tono: 'amarillo' });
    }
  }

  async function prepararQuickLook() {
    const objeto = crear();
    if (!objeto) return;
    try {
      const modelo = await prepararUsdz(objeto, escala);
      const foto = await miniatura();
      if (!foto) return;
      setQl({ modelo: URL.createObjectURL(modelo), foto: URL.createObjectURL(foto) });
    } catch {
      isla({ titulo: 'No pudimos preparar la vista en AR', texto: 'Probá de nuevo.', icono: 'alerta', tono: 'amarillo' });
    }
  }

  if (modo === 'ninguno') return null;
  if (modo === 'quicklook') {
    return ql ? (
      // AR Quick Look exige un enlace rel="ar" con una sola imagen adentro.
      <a className="tr-ar" rel="ar" href={ql.modelo}>
        <img src={ql.foto} alt={`${texto} con realidad aumentada`} width={96} height={72} />
      </a>
    ) : (
      <button type="button" className="boton" onClick={() => void prepararQuickLook()}>
        <Icono nombre="camara" /> Preparar: {texto.toLowerCase()}
      </button>
    );
  }
  return (
    <>
      <button type="button" className="boton" onClick={() => void abrir()}>
        <Icono nombre="camara" /> {texto}
      </button>
      {/* Capa encima de la cámara (dom-overlay): instrucciones y salir. */}
      <div ref={capa} className={`tr-ar-capa${activa ? ' tr-ar-capa--activa' : ''}`} hidden={!activa}>
        <p className="tr-ar-capa__texto" aria-live="polite">
          {colocado ? 'Listo. Tocá en otro lugar para moverlo.' : (instruccion ?? INSTRUCCION_AR[superficie])}
        </p>
        <button type="button" className="boton boton--claro" onClick={() => sesion.current?.terminar()}>
          Salir de AR
        </button>
      </div>
    </>
  );
}
