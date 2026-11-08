'use client';
// Sacar una foto con la cámara de atrás (lote 2.3: antes y después del trabajo). Un botón con texto que abre la cámara
// del teléfono; el archivo queda solo en memoria hasta que la pantalla lo achica (sin ubicación) y lo manda. Con la
// cámara simulada del mock (`simulada`) no se elige ningún archivo: el toque manda una foto de prueba (`null`).
import { useRef } from 'react';
import { Boton, type VarianteBoton } from '../atomos/Boton.tsx';

export function BotonFoto({ children, simulada, onFoto, ocupado = false, variante = 'primaria', chico = false }: { children: string; simulada: boolean; onFoto(archivo: File | null): void; ocupado?: boolean; variante?: VarianteBoton; chico?: boolean }) {
  const entrada = useRef<HTMLInputElement>(null);
  return (
    <>
      <Boton variante={variante} chico={chico} icono="camara" ocupado={ocupado} textoOcupado="Guardando la foto…" onClick={() => (simulada ? onFoto(null) : entrada.current?.click())}>
        {children}
      </Boton>
      {simulada ? null : (
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="visualmente-oculto"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onFoto(f);
          }}
        />
      )}
    </>
  );
}
