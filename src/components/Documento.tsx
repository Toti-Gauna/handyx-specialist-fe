'use client';
import { api } from '@handyx/origen-datos';
import { useRef } from 'react';
import type { PerfilEspecialista, TipoDocumento } from '../contracts/dto.ts';
import type { EstadoDocumento } from '../contracts/maquinas.ts';
import type { Rubro } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { DOCUMENTO } from '../lib/etiquetas.ts';
import { ErrorCaja } from './Estados.tsx';
import { Icono } from './Icono.tsx';
import { Chip } from './ui.tsx';

// PENDIENTE: tamaño máximo definitivo del servidor. El servidor decide; esto solo evita subir algo enorme.
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = 'image/jpeg,image/png,image/webp';

interface Props {
  tipo: TipoDocumento;
  rubro?: Rubro;
  titulo: string;
  ayuda: string;
  estado: EstadoDocumento;
  /** Solo con el alta en borrador o con corrección pedida. */
  editable: boolean;
  onCargado(p: PerfilEspecialista): void;
}

/**
 * Carga de un documento. Queda "cargado": solo Operations lo verifica. La app nunca muestra el contenido.
 * Con datos de prueba no se sube ningún archivo real: se registra un documento de prueba.
 */
export function Documento({ tipo, rubro, titulo, ayuda, estado, editable, onCargado }: Props) {
  const { pendiente, fallo, ejecutar } = useAccion();
  const entrada = useRef<HTMLInputElement>(null);
  const permitido = editable && estado !== 'en_revision' && estado !== 'verificado';
  const verbo = estado === 'faltante' ? 'Cargar' : 'Volver a cargar';

  async function cargar(archivo?: Blob) {
    const r = await ejecutar(() => api.cargarDocumento(tipo, rubro, archivo));
    if (r.ok) onCargado(r.valor);
  }

  return (
    <div className="tarjeta">
      <div className="fila-flex fila-flex--entre">
        <p className="tarjeta__titulo">{titulo}</p>
        <Chip e={DOCUMENTO[estado]} />
      </div>
      <p className="texto-suave texto-chico">{ayuda}</p>
      {estado === 'rechazado' ? (
        <p className="campo__error">
          <Icono nombre="alerta" /> Hay que volver a cargarlo: lo revisó Operations y no se pudo aceptar.
        </p>
      ) : null}
      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      {permitido ? (
        api.origen === 'mock' ? (
          <button type="button" className="boton boton--claro boton--chico" disabled={pendiente} onClick={() => void cargar()}>
            <Icono nombre="imagen" /> {pendiente ? 'Cargando…' : `${verbo} un documento de prueba`}
          </button>
        ) : (
          <>
            <input
              ref={entrada}
              type="file"
              accept={TIPOS}
              className="visualmente-oculto"
              aria-label={`${verbo}: ${titulo}`}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f && f.size <= MAX_BYTES) void cargar(f);
              }}
            />
            <button type="button" className="boton boton--claro boton--chico" disabled={pendiente} onClick={() => entrada.current?.click()}>
              <Icono nombre="camara" /> {pendiente ? 'Subiendo…' : verbo}
            </button>
          </>
        )
      ) : (
        <p className="texto-suave texto-chico">{editable ? 'Ya lo está revisando Operations.' : 'No se puede modificar en este momento.'}</p>
      )}
      <p className="texto-suave texto-chico">Tu documento se guarda en un lugar privado y solo lo ve el personal autorizado. En la app nunca se muestra.</p>
    </div>
  );
}
