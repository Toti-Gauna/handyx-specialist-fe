'use client';
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { Aviso, Chip } from '../components/ui.tsx';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { fechaHora } from '../lib/formato.ts';
import type { EstadoBaja } from '../contracts/maquinas.ts';

const ESTADO: Record<EstadoBaja, { texto: string; tono: 'azul' | 'aviso' | 'exito' | 'neutro'; icono: 'reloj' | 'lupa' | 'checkCirculo' | 'cerrar' }> = {
  solicitada: { texto: 'Solicitada', tono: 'aviso', icono: 'reloj' },
  en_proceso: { texto: 'En proceso', tono: 'azul', icono: 'lupa' },
  completada: { texto: 'Completada', tono: 'exito', icono: 'checkCirculo' },
  completada_con_retencion: { texto: 'Completada, con datos retenidos por ley', tono: 'exito', icono: 'checkCirculo' },
  cancelada: { texto: 'Cancelada', tono: 'neutro', icono: 'cerrar' },
};

/** Estado real de la baja: nunca un éxito ficticio. Mientras está "solicitada" se puede cancelar. */
export function Baja() {
  const router = useRouter();
  const sesion = useCarga(() => api.sesion(), []);
  const baja = useCarga(() => api.baja(), []);
  const { pendiente, fallo, ejecutar } = useAccion();

  useEffect(() => {
    if (sesion.estado === 'ok' && sesion.datos === null) router.replace(RUTAS.acceso.ruta);
  }, [sesion.estado, sesion.datos, router]);

  if (baja.fallo && !baja.datos) return <ErrorCaja fallo={baja.fallo} onReintentar={() => void baja.recargar()} />;
  if (baja.estado === 'cargando' && !baja.datos) return <Cargando />;
  const b = baja.datos;
  if (!b) {
    return (
      <div className="pila">
        <h1 className="titulo">No hay una baja en curso</h1>
        <button type="button" className="boton boton--bloque" onClick={() => router.replace(RUTAS.puerta.ruta)}>
          Volver a la app
        </button>
      </div>
    );
  }
  const e = ESTADO[b.estado];

  async function cancelar() {
    const r = await ejecutar(() => api.cancelarBaja());
    if (r.ok) router.replace(RUTAS.puerta.ruta);
  }
  async function salir() {
    await api.salir();
    router.replace(RUTAS.acceso.ruta);
  }

  return (
    <div className="pila">
      <h1 className="titulo">Baja de tu cuenta</h1>
      <div className="fila-flex">
        <Chip e={e} />
        <span className="texto-suave texto-chico">Solicitada: {fechaHora(b.solicitadaEn)}</span>
      </div>
      <Aviso tono={e.tono === 'exito' ? 'exito' : 'azul'} icono="info" role="status">
        {b.mensaje}
      </Aviso>
      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void cancelar()} /> : null}
      {b.estado === 'solicitada' ? (
        <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void cancelar()}>
          {pendiente ? 'Cancelando…' : 'Cancelar la baja y seguir usando mi cuenta'}
        </button>
      ) : null}
      <button type="button" className="boton boton--claro boton--bloque" onClick={() => void salir()}>
        Salir
      </button>
    </div>
  );
}
