'use client';
// Mensajes (lote 4.8): cada conversación con el avatar de iniciales, el estado del pedido, el último mensaje y los no
// leídos; acceso a Contactos y al Centro de ayuda. Un hilo por pedido, desde la primera consulta hasta el trabajo.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { Icono } from '../components/Icono.tsx';
import { Chip } from '../components/ui.tsx';
import type { Conversacion } from '../contracts/dto.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import type { Etiqueta } from '../lib/etiquetas.ts';
import { haceCuanto } from '../lib/formato.ts';
import { Avatar, EstadoVacio, Fila } from '../kit/Piezas.tsx';
import './mensajes.css';

export const ETAPA_CHAT: Record<Conversacion['etapa'], Etiqueta> = {
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
    <div className="pila me">
      <div className="me-cabeza">
        <h1 className="titulo">Mensajes</h1>
        <Link className="hx-chip me-cabeza__contactos" href={RUTAS.contactos.ruta}>
          <Icono nombre="contactos" /> Contactos
        </Link>
      </div>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {c.datos.length === 0 ? (
        <EstadoVacio titulo="Todavía no tenés conversaciones">Se crean cuando consultás o cotizás un pedido, y siguen si te contratan.</EstadoVacio>
      ) : (
        <ul className="me-lista">
          {c.datos.map((x) => (
            <li key={x.id}>
              <Link className={`me-fila${x.noLeidos > 0 ? ' me-fila--nueva' : ''}`} href={`${RUTAS.hilo.ruta}?id=${x.id}`}>
                <Avatar nombre={x.contraparte} />
                <span className="me-fila__texto">
                  <span className="me-fila__arriba">
                    <strong>{x.contraparte}</strong>
                    <small>{haceCuanto(x.actualizadoEn, ahora)}</small>
                  </span>
                  <span className="me-fila__ultimo">{x.ultimoMensaje ?? 'Sin mensajes todavía'}</span>
                  <span className="me-fila__abajo">
                    <Chip e={ETAPA_CHAT[x.etapa]} />
                    {x.noLeidos > 0 ? (
                      <span className="insignia" aria-label={`${x.noLeidos} sin leer`}>
                        {x.noLeidos}
                      </span>
                    ) : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="me-ayuda">
        <Fila icono="pregunta" titulo="Centro de ayuda" detalle="Preguntas frecuentes y tus casos con Handyx" href={RUTAS.soporte.ruta} />
      </div>
      <p className="texto-suave texto-chico me-nota">
        <Icono nombre="candado" /> Los teléfonos no se muestran. Todo queda en el chat de cada pedido.
      </p>
    </div>
  );
}
