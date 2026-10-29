'use client';
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import type { Trabajo } from '../contracts/dto.ts';
import type { EstadoTrabajo } from '../contracts/maquinas.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { pesos } from '../lib/formato.ts';
import { ErrorCaja } from './Estados.tsx';
import { Hoja } from './Hoja.tsx';
import { Icono, type NombreIcono } from './Icono.tsx';

const PASOS: Partial<Record<EstadoTrabajo, { hacia: Exclude<EstadoTrabajo, 'agendado'>; texto: string; icono: NombreIcono; nota: string; confirmar?: boolean }>> = {
  agendado: { hacia: 'en_camino', texto: 'Salgo hacia el lugar', icono: 'pin', nota: 'Le avisamos al usuario dentro de la app que vas en camino.' },
  en_camino: { hacia: 'en_sitio', texto: 'Llegué', icono: 'pin', nota: 'Es un aviso que mandás vos al usuario. Compartir la ubicación del teléfono es opcional: no hace falta para marcar que llegaste.' },
  en_sitio: { hacia: 'en_curso', texto: 'Empezar el trabajo', icono: 'maletin', nota: 'Antes de empezar, confirmá el alcance con el usuario por el chat.' },
  en_curso: { hacia: 'finalizado', texto: 'Terminé el trabajo', icono: 'checkCirculo', nota: 'Después de terminar, el usuario te paga directamente a vos.', confirmar: true },
};

/** El próximo paso del trabajo, uno solo y bien visible. Cada paso lo marca el especialista y queda con fecha y actor. */
export function AccionTrabajo({ trabajo, alCambiar }: { trabajo: Trabajo; alCambiar(): Promise<unknown> }) {
  const { pendiente, fallo, ejecutar, clave, nueva, limpiar } = useAccion();
  const [confirmar, setConfirmar] = useState(false);
  const paso = PASOS[trabajo.estado];
  if (!paso) return null;

  async function avanzar() {
    if (!paso) return;
    // El refresco va dentro de la acción: el botón se libera con la versión nueva del trabajo (evita un 409 al tocar dos veces).
    const r = await ejecutar(async () => {
      await api.avanzarTrabajo(trabajo.id, paso.hacia, trabajo.version, clave());
      await alCambiar();
    });
    if (r.ok) {
      setConfirmar(false);
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
        <p>Vas a marcar como terminado un trabajo de {pesos(trabajo.acuerdo.monto)}.</p>
        <p className="texto-suave">Después te aparece el cobro en tu Caja. El pago es directo del usuario a vos (Mercado Pago o efectivo): Handyx no recibe ese dinero.</p>
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
