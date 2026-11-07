'use client';
// Notificaciones (lote 4.8): qué avisos recibís (urgentes y programados por separado, mensajes y pagos) y los avisos del
// dispositivo, que son opcionales y cuya entrega no está garantizada. Todo lo importante queda siempre en Avisos.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso, ChipTexto, Interruptor } from '../../components/ui.tsx';
import type { Preferencias } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

type Avisos = Omit<Preferencias, 'push'>;

export function NotificacionesCuenta() {
  const c = useCarga(() => api.preferencias(), []);
  const { pendiente, fallo, ejecutar } = useAccion();
  const p = c.datos;

  async function cambiar(parcial: Partial<Avisos>) {
    if (!p) return;
    const r = await ejecutar(async () => {
      await api.guardarPreferencias({ avisosUrgentes: p.avisosUrgentes, avisosProgramados: p.avisosProgramados, avisosMensajes: p.avisosMensajes, avisosPagos: p.avisosPagos, ...parcial });
      await c.recargar();
    });
    if (!r.ok) await c.recargar();
  }
  async function activarPush() {
    await ejecutar(async () => {
      await api.activarPush();
      await c.recargar();
    });
  }

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Notificaciones" atras={RUTAS.cuenta.ruta} textoAtras="Volver a Cuenta" acciones={null} />
      {c.fallo && !p ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {!p && !c.fallo ? <Cargando /> : null}
      {p ? (
        <>
          <section className="ct-tarjeta" aria-labelledby="ct-avisos-t">
            <h2 id="ct-avisos-t" className="fl-bloque__titulo">
              Qué te avisamos
            </h2>
            {fallo ? <ErrorCaja fallo={fallo} /> : null}
            <Interruptor etiqueta="Pedidos urgentes" descripcion="Avisos distintos de los programados. Para recibir urgentes tenés que estar “Disponible” en el inicio." activo={p.avisosUrgentes} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosUrgentes: v })} />
            <Interruptor etiqueta="Pedidos programados" descripcion="Pedidos para otro día y visitas de presupuesto." activo={p.avisosProgramados} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosProgramados: v })} />
            <Interruptor etiqueta="Mensajes" descripcion="Cuando un cliente te escribe." activo={p.avisosMensajes} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosMensajes: v })} />
            <Interruptor etiqueta="Pagos" descripcion="Cuando Mercado Pago u Operations confirman un cobro, o hay un problema." activo={p.avisosPagos} deshabilitado={pendiente} onCambio={(v) => void cambiar({ avisosPagos: v })} />
          </section>
          <section className="ct-tarjeta" aria-labelledby="ct-push-t">
            <h2 id="ct-push-t" className="fl-bloque__titulo">
              Avisos del dispositivo
            </h2>
            {p.push === 'activado' ? (
              <ChipTexto tono="exito" icono="check">
                Activados en este dispositivo
              </ChipTexto>
            ) : null}
            {p.push === 'no_disponible' ? <p>Este navegador no permite avisos del dispositivo. Los vas a ver igual en Avisos.</p> : null}
            {p.push === 'rechazado' ? (
              <Aviso tono="aviso" icono="alerta">
                Rechazaste el permiso en este dispositivo. Podés cambiarlo desde los ajustes del navegador. La app sigue funcionando: todos los avisos están en Avisos.
              </Aviso>
            ) : null}
            {p.push === 'sin_pedir' || p.push === 'rechazado' ? (
              <button type="button" className="boton boton--claro" disabled={pendiente} onClick={() => void activarPush()}>
                <Icono nombre="campana" /> Activar avisos del dispositivo
              </button>
            ) : null}
            <p className="texto-suave texto-chico">La entrega de avisos del dispositivo no está garantizada (sobre todo en iPhone). Los avisos importantes siempre quedan en la app.</p>
          </section>
          <Link className="boton boton--claro boton--bloque" href={RUTAS.notificaciones.ruta}>
            <Icono nombre="campana" /> Ver mis avisos
          </Link>
        </>
      ) : null}
    </div>
  );
}
