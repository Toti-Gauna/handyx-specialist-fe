'use client';
// Botón de AR del Taller: en Android con WebXR abre la cámara en la app; en iPhone usa AR Quick Look (USDZ). Si el
// teléfono no tiene ninguno de los dos, no aparece (la vista 3D y la lista ya dicen todo).
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import { Icono } from '../../components/Icono.tsx';
import { useIsla } from '../../kit/Efectos.tsx';
import { abrirAr, arInmersivoDisponible, type SesionAr, type Superficie } from '../../taller/ar.ts';

function soportaQuickLook(): boolean {
  if (typeof document === 'undefined') return false;
  return Boolean(document.createElement('a').relList?.supports?.('ar'));
}

const INSTRUCCION: Record<Superficie, string> = {
  pared: 'Apuntá a la pared, esperá el círculo amarillo y tocá para ubicarlo.',
  techo: 'Apuntá al techo, esperá el círculo amarillo y tocá para ubicarla.',
  piso: 'Apuntá al piso, esperá el círculo amarillo y tocá para ubicarlo.',
};

export function BotonAr({ crear, escala, superficie, texto, miniatura }: { crear: () => THREE.Object3D | null; escala: number; superficie: Superficie; texto: string; miniatura: () => Promise<Blob | null> }) {
  const [modo, setModo] = useState<'ninguno' | 'webxr' | 'quicklook'>('ninguno');
  const [activa, setActiva] = useState(false);
  const [colocado, setColocado] = useState(false);
  const [ql, setQl] = useState<{ modelo: string; foto: string } | null>(null);
  const capa = useRef<HTMLDivElement>(null);
  const sesion = useRef<SesionAr | null>(null);
  const isla = useIsla();

  useEffect(() => {
    let vivo = true;
    void arInmersivoDisponible().then((si) => {
      if (vivo) setModo(si ? 'webxr' : soportaQuickLook() ? 'quicklook' : 'ninguno');
    });
    return () => {
      vivo = false;
      sesion.current?.terminar();
    };
  }, []);
  useEffect(() => () => {
    if (ql) {
      URL.revokeObjectURL(ql.modelo);
      URL.revokeObjectURL(ql.foto);
    }
  }, [ql]);

  async function abrir() {
    const objeto = crear();
    if (!objeto || !capa.current) return;
    try {
      setColocado(false);
      setActiva(true);
      sesion.current = await abrirAr({ objeto, escala, superficie, capa: capa.current, alColocar: () => setColocado(true), alSalir: () => setActiva(false) });
    } catch {
      setActiva(false);
      isla({ titulo: 'No pudimos abrir la cámara en AR', texto: 'Revisá el permiso de la cámara y probá de nuevo.', icono: 'alerta', tono: 'amarillo' });
    }
  }

  async function prepararQuickLook() {
    const objeto = crear();
    if (!objeto) return;
    try {
      const copia = objeto.clone(true);
      copia.scale.setScalar(escala);
      const datos = await new USDZExporter().parseAsync(copia);
      const foto = await miniatura();
      if (!foto) return;
      setQl({ modelo: URL.createObjectURL(new Blob([datos as BlobPart], { type: 'model/vnd.usdz+zip' })), foto: URL.createObjectURL(foto) });
    } catch {
      isla({ titulo: 'No pudimos preparar la vista en AR', texto: 'Probá de nuevo.', icono: 'alerta', tono: 'amarillo' });
    }
  }

  if (modo === 'ninguno') return null;
  if (modo === 'quicklook') {
    return ql ? (
      // AR Quick Look exige un enlace rel="ar" con una sola imagen adentro.
      <a className="tl-ar" rel="ar" href={ql.modelo}>
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
      <div ref={capa} className={`tl-ar-capa${activa ? ' tl-ar-capa--activa' : ''}`} hidden={!activa}>
        <p className="tl-ar-capa__texto" aria-live="polite">{colocado ? 'Listo. Tocá en otro lugar para moverlo.' : INSTRUCCION[superficie]}</p>
        <button type="button" className="boton boton--claro" onClick={() => sesion.current?.terminar()}>
          Salir de AR
        </button>
      </div>
    </>
  );
}
