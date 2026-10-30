'use client';
// Cómo te paga el cliente (lote 4.8): Mercado Pago, efectivo o los dos. El pago va directo del cliente a vos: Handyx
// no recibe ni guarda ese dinero. La cuenta de Mercado Pago se vincula con Mercado Pago (fase 5): Handyx nunca te pide
// la contraseña ni las claves.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { Aviso, ChipTexto, Interruptor } from '../../components/ui.tsx';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';

export function CobrosCuenta() {
  const c = useCarga(() => api.mediosCobro(), []);
  const isla = useIsla();
  const { pendiente, fallo, ejecutar } = useAccion();
  const m = c.datos;

  async function cambiar(parcial: { efectivo?: boolean; mercadoPago?: boolean }) {
    if (!m) return;
    const nuevo = { efectivo: parcial.efectivo ?? m.efectivo, mercadoPago: parcial.mercadoPago ?? m.mercadoPago };
    if (!nuevo.efectivo && !nuevo.mercadoPago) {
      isla({ titulo: 'Dejá al menos una forma de cobro', texto: 'Si no, el cliente no tiene cómo pagarte.', icono: 'alerta', tono: 'amarillo' });
      return;
    }
    // El refresco va dentro de la acción: el interruptor se libera con la versión nueva.
    const r = await ejecutar(async () => {
      await api.guardarMediosCobro({ ...nuevo, version: m.version });
      await c.recargar();
    });
    if (!r.ok && r.fallo.tipo === 'conflicto') await c.recargar();
  }

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Cómo te paga el cliente" atras={RUTAS.cuenta.ruta} textoAtras="Volver a Cuenta" acciones={null} />
      <Aviso tono="azul" icono="info" titulo="El pago va directo a vos">
        El cliente te paga a vos. Handyx no recibe, guarda ni te transfiere ese dinero. Handyx nunca te pide tu contraseña de Mercado Pago.
      </Aviso>
      {c.fallo && !m ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}
      {!m && !c.fallo ? <Cargando /> : null}
      {m ? (
        <>
          <section className="ct-tarjeta" aria-labelledby="ct-cobros-t">
            <h2 id="ct-cobros-t" className="fl-bloque__titulo">
              Formas de cobro que aceptás
            </h2>
            {fallo ? <ErrorCaja fallo={fallo} /> : null}
            <Interruptor etiqueta="Mercado Pago" descripcion="El cliente te paga desde su app a tu cuenta. Se verifica solo cuando Mercado Pago lo confirma." activo={m.mercadoPago} deshabilitado={pendiente} onCambio={(v) => void cambiar({ mercadoPago: v })} />
            <Interruptor etiqueta="Efectivo" descripcion="Lo cobrás en mano al terminar. Lo informás vos y queda “reportado” hasta que se verifica." activo={m.efectivo} deshabilitado={pendiente} onCambio={(v) => void cambiar({ efectivo: v })} />
          </section>
          <section className="ct-tarjeta" aria-labelledby="ct-mp-t">
            <h2 id="ct-mp-t" className="fl-bloque__titulo">
              Tu cuenta de Mercado Pago
            </h2>
            {m.cuentaMercadoPago.estado === 'vinculada' ? (
              <ChipTexto tono="exito" icono="checkCirculo">
                Vinculada{m.cuentaMercadoPago.etiqueta ? `: ${m.cuentaMercadoPago.etiqueta}` : ''}
              </ChipTexto>
            ) : (
              <ChipTexto tono="neutro" icono="info">
                Sin vincular
              </ChipTexto>
            )}
            <p className="texto-suave texto-chico">La vinculación se hace en Mercado Pago, con tu usuario de Mercado Pago. Llega con la conexión al servidor.</p>
          </section>
          <Link className="boton boton--claro boton--bloque" href={RUTAS.caja.ruta}>
            Ver la Caja
          </Link>
        </>
      ) : null}
    </div>
  );
}
