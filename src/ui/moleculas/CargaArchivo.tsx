'use client';
// Cargar un documento en foto o PDF (lote 1.2: antecedentes en RG-9 y certificados en RG-8). Dos mosaicos grandes:
// «Sacar una foto» (abre la cámara del teléfono) y «Subir el PDF». El archivo vive solo en memoria hasta que la
// pantalla lo manda; el tipo lo decide el servidor por los bytes. Con datos de prueba (`simulada`) no se elige ningún
// archivo: el toque manda uno de prueba.
import { useRef, type ChangeEvent } from 'react';
import { Icono } from '../atomos/Icono.tsx';
import '../registro.css';

export type FormatoCarga = 'foto' | 'pdf';

export function CargaArchivo({ simulada, ocupado = false, onArchivo, textoFoto = 'Sacar una foto', textoPdf = 'Subir el PDF', compacta = false }: { simulada: boolean; ocupado?: boolean; onArchivo(archivo: File | null, formato: FormatoCarga): void; textoFoto?: string; textoPdf?: string; compacta?: boolean }) {
  const foto = useRef<HTMLInputElement>(null);
  const pdf = useRef<HTMLInputElement>(null);
  const elegir = (formato: FormatoCarga) => {
    if (simulada) return onArchivo(null, formato);
    (formato === 'foto' ? foto : pdf).current?.click();
  };
  const alElegir = (formato: FormatoCarga) => (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onArchivo(f, formato);
  };
  return (
    <div className={`ui-carga${compacta ? ' ui-carga--compacta' : ''}`}>
      <button type="button" className="ui-carga__op ui-carga__op--azul" disabled={ocupado} onClick={() => elegir('foto')}>
        <Icono nombre="camara" tam="grande" />
        <span>{textoFoto}</span>
      </button>
      <button type="button" className="ui-carga__op" disabled={ocupado} onClick={() => elegir('pdf')}>
        <Icono nombre="documento" tam="grande" />
        <span>{textoPdf}</span>
      </button>
      {simulada ? null : (
        <>
          <input ref={foto} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="visualmente-oculto" tabIndex={-1} aria-hidden="true" onChange={alElegir('foto')} />
          <input ref={pdf} type="file" accept="application/pdf" className="visualmente-oculto" tabIndex={-1} aria-hidden="true" onChange={alElegir('pdf')} />
        </>
      )}
    </div>
  );
}
