'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Chip } from '../components/ui.tsx';
import type { Conversacion } from '../contracts/dto.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { haceCuanto } from '../lib/formato.ts';

const ETAPA: Record<Conversacion['etapa'], { texto: string; tono: 'azul' | 'exito' | 'neutro'; icono: 'etiqueta' | 'maletin' | 'check' }> = {
  cotizando: { texto: 'Cotizando', tono: 'azul', icono: 'etiqueta' },
  trabajo: { texto: 'Trabajo agendado', tono: 'exito', icono: 'maletin' },
  cerrada: { texto: 'Cerrada', tono: 'neutro', icono: 'check' },
};

export function Mensajes() {
  const c = useCarga(() => api.conversaciones(), []);
  const ahora = useAhora(30_000);
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return (
    <div className="pila">
      <h1 className="titulo">Mensajes</h1>
      {c.datos.length === 0 ? (
        <Vacio icono="chat" titulo="Todavía no tenés conversaciones">
          Se crean cuando consultás o cotizás un pedido, y siguen si te contratan.
        </Vacio>
      ) : (
        <ul className="lista-tarjetas">
          {c.datos.map((x) => (
            <li key={x.id}>
              <Link className="tarjeta" href={`${RUTAS.hilo.ruta}?id=${x.id}`}>
                <div className="fila-flex fila-flex--entre">
                  <span className="tarjeta__titulo">{x.contraparte}</span>
                  <span className="texto-suave texto-chico">{haceCuanto(x.actualizadoEn, ahora)}</span>
                </div>
                <p className="texto-suave">{x.ultimoMensaje ?? 'Sin mensajes todavía'}</p>
                <div className="fila-flex fila-flex--entre">
                  <Chip e={ETAPA[x.etapa]} />
                  {x.noLeidos > 0 ? <span className="insignia" aria-label={`${x.noLeidos} sin leer`}>{x.noLeidos}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
