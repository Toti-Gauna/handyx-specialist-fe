'use client';
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import type { AvanceTrabajo, TrabajoDetalle } from '../contracts/dto.ts';
import type { EstadoTrabajo } from '../contracts/maquinas.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { pesos } from '../lib/formato.ts';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { Icono, type NombreIcono } from './Icono.tsx';
import { Aviso } from './ui.tsx';

// La llegada no está acá (lote 4.6): la marca sola la geocerca o, si la ubicación anda mal, "Ya llegué" en En camino.
const PASOS: Partial<Record<EstadoTrabajo, { hacia: AvanceTrabajo; texto: string; icono: NombreIcono; nota: string; confirmar?: boolean }>> = {
  agendado: { hacia: 'en_camino', texto: 'Salgo para allá', icono: 'pin', nota: 'Le avisamos al cliente que vas en camino y se abre el mapa del viaje.' },
  en_sitio: { hacia: 'en_curso', texto: 'Empezar el trabajo', icono: 'maletin', nota: 'Antes de empezar, confirmá con el cliente lo que van a hacer.' },
  en_curso: { hacia: 'finalizado', texto: 'Terminé el trabajo', icono: 'checkCirculo', nota: 'Después de terminar, el cliente te paga directamente a vos.', confirmar: true },
};

/** Trabajos que se terminaron en esta pestaña: solo esos celebran con confeti (en memoria, nada en el navegador). */
export const terminadosEnSesion = new Set<string>();

/** El próximo paso del trabajo, uno solo y bien visible. Cada paso lo marca el especialista y queda con fecha y actor. */
export function AccionTrabajo({ detalle, alCambiar, alSalir, alTerminar }: { detalle: TrabajoDetalle; alCambiar(): Promise<unknown>; /** Después de "Salgo para allá" (abrir el mapa del viaje). */ alSalir?: () => void; /** Después de terminar (la pantalla de ¡Terminaste!). */ alTerminar?: () => void }) {
  const { trabajo } = detalle;
  const { pendiente, fallo, ejecutar, clave, nueva, limpiar } = useAccion();
  const [confirmar, setConfirmar] = useState(false);
  const paso = PASOS[trabajo.estado];
  if (!paso) return null;
  // Una obra se cierra desde el plan, con todas sus etapas terminadas (cada una con su cobro).
  if (trabajo.tipo === 'obra' && paso.hacia === 'finalizado') {
    return <p className="texto-suave texto-chico">Cada etapa se termina y se cobra desde el plan de obra; con la última, cerrás la obra.</p>;
  }
  const aceptados = detalle.adicionales.filter((a) => a.estado === 'aceptado');
  const sinRespuesta = detalle.adicionales.filter((a) => a.estado === 'pendiente');

  async function avanzar() {
    if (!paso) return;
    // El refresco va dentro de la acción: el botón se libera con la versión nueva del trabajo (evita un 409 al tocar dos veces).
    const r = await ejecutar(async () => {
      await api.avanzarTrabajo(trabajo.id, paso.hacia, trabajo.version, clave());
      if (paso.hacia === 'finalizado') terminadosEnSesion.add(trabajo.id);
      await alCambiar();
    });
    if (r.ok) {
      setConfirmar(false);
      if (paso.hacia === 'en_camino') alSalir?.();
      if (paso.hacia === 'finalizado') alTerminar?.();
    } else if (r.fallo.tipo === 'conflicto') {
      nueva();
      await alCambiar();
    }
  }

  return (
    <div className="pila pila--chica">
      {fallo && !confirmar ? <ErrorCaja fallo={fallo} onReintentar={() => void avanzar()} /> : null}
      <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => (paso.confirmar ? setConfirmar(true) : void avanzar())}>
        <Icono nombre={paso.icono} /> {pendiente && !confirmar ? 'Guardando…' : paso.texto}
      </button>
      <p className="texto-suave texto-chico">{paso.nota}</p>
      <Hoja abierta={confirmar} titulo="¿Terminaste el trabajo?" onCerrar={() => { setConfirmar(false); limpiar(); }}>
        <dl className="tr-desglose">
          <div>
            <dt>Lo acordado</dt>
            <dd>{pesos(trabajo.acuerdo.monto)}</dd>
          </div>
          {aceptados.map((a) => (
            <div key={a.id}>
              <dt>{a.descripcion}</dt>
              <dd>+ {pesos(a.monto)}</dd>
            </div>
          ))}
          <div className="tr-desglose__total">
            <dt>Total a cobrar</dt>
            <dd>{pesos(detalle.totalVigente)}</dd>
          </div>
        </dl>
        {sinRespuesta.length > 0 ? (
          <Aviso tono="aviso" icono="alerta" role="status">
            {sinRespuesta.length === 1 ? 'Hay un adicional' : `Hay ${sinRespuesta.length} adicionales`} que el cliente no respondió: si terminás, se retira y no se cobra.
          </Aviso>
        ) : null}
        <p className="texto-suave">El pago es directo del cliente a vos (Mercado Pago o efectivo): Handyx no recibe ese dinero.</p>
        {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void avanzar()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--exito" disabled={pendiente} onClick={() => void avanzar()}>
            {pendiente ? 'Guardando…' : 'Sí, terminé'}
          </button>
          <button type="button" className="boton boton--claro" onClick={() => { setConfirmar(false); limpiar(); }}>
            Todavía no
          </button>
        </div>
      </Hoja>
    </div>
  );
}
