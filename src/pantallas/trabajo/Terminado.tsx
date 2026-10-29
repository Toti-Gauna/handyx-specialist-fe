'use client';
// ¡Terminaste el trabajo! (lote 4.6): el monto que sube, el desglose (acordado, adicionales, tarifa de Handyx y lo que
// recibís) y el confeti solo si se vio terminar en esta pestaña. Después, informar el cobro: queda "reportado", nunca
// verificado por informarlo. El pago es directo del cliente al especialista.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { terminadosEnSesion } from '../../components/AccionTrabajo.tsx';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Hoja } from '../../components/Hoja.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Chip } from '../../components/ui.tsx';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { PAGO } from '../../lib/etiquetas.ts';
import { pesos } from '../../lib/formato.ts';
import { useConfeti } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { MontoGrande, Tilde } from '../../kit/Piezas.tsx';

export function Terminado() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, pagos] = await Promise.all([api.trabajo(id), api.pagos()]);
    return { detalle, pago: pagos.items.find((p) => p.id === detalle.pagoId) ?? null };
  }, [id]);
  const { lanzar, capa } = useConfeti();
  const [celebrar] = useState(() => (id ? terminadosEnSesion.has(id) : false));
  const [informar, setInformar] = useState(false);
  const reporte = useAccion();
  const listo = c.datos?.detalle.trabajo.estado === 'finalizado';
  useEffect(() => {
    if (!celebrar || !listo || !id) return;
    terminadosEnSesion.delete(id); // una sola vez: al volver a abrir la pantalla ya no celebra
    lanzar();
  }, [celebrar, listo, id, lanzar]);

  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { detalle: d, pago } = c.datos;
  const t = d.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  if (t.estado !== 'finalizado') {
    return (
      <div className="fl-pantalla">
        <BarraSuperior titulo="Trabajo" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
        <Vacio icono="maletin" titulo="Este trabajo todavía no está terminado">
          <Link href={volver}>Volver al trabajo</Link>
        </Vacio>
      </div>
    );
  }
  const aceptados = d.adicionales.filter((a) => a.estado === 'aceptado');
  const efectivo = pago?.metodo === 'efectivo';

  async function confirmarCobro() {
    if (!pago) return;
    const r = await reporte.ejecutar(async () => {
      await api.reportarCobro(pago.id, reporte.clave());
      await c.recargar();
    });
    if (r.ok) setInformar(false);
  }

  return (
    <div className="fl-pantalla tr-fin">
      {capa}
      <BarraSuperior titulo="Trabajo terminado" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <section className="tr-fin__hero" aria-labelledby="tr-fin-t">
        <Tilde />
        <h1 id="tr-fin-t" className="hx-titulo tr-fin__titulo">
          ¡Terminaste el trabajo!
        </h1>
        <p className="tr-fin__sub">
          {NOMBRE_RUBRO[t.rubro]} · {d.contraparte}
        </p>
        <MontoGrande centavos={(pago?.neto ?? d.totalVigente).centavos} className="tr-fin__monto" />
        <p className="tr-fin__sub">es lo que recibís, directo del cliente a vos</p>
      </section>

      <section className="fl-bloque" aria-labelledby="tr-fin-desglose">
        <h2 id="tr-fin-desglose" className="fl-bloque__titulo">
          Desglose
        </h2>
        <dl className="tr-desglose tr-desglose--tarjeta">
          <div>
            <dt>Lo acordado</dt>
            <dd>{pesos(t.acuerdo.monto)}</dd>
          </div>
          {aceptados.map((a) => (
            <div key={a.id}>
              <dt>{a.descripcion}</dt>
              <dd>+ {pesos(a.monto)}</dd>
            </div>
          ))}
          <div>
            <dt>Total que paga el cliente</dt>
            <dd>{pesos(pago?.monto ?? d.totalVigente)}</dd>
          </div>
          <div>
            <dt>Tarifa de Handyx</dt>
            <dd>{pago ? pesos(pago.feeHandy) : '—'}</dd>
          </div>
          <div className="tr-desglose__total">
            <dt>Recibís</dt>
            <dd>{pesos(pago?.neto ?? d.totalVigente)}</dd>
          </div>
        </dl>
        {pago && pago.feeHandy.centavos === 0 ? <p className="texto-suave texto-chico">Durante la demo Handyx no cobra tarifa (0 %).</p> : null}
      </section>

      <section className="fl-bloque" aria-labelledby="tr-fin-cobro">
        <h2 id="tr-fin-cobro" className="fl-bloque__titulo">
          El cobro
        </h2>
        {pago ? (
          <div className="tr-cobro">
            <Chip e={PAGO[pago.estado]} />
            <p>{pago.estado === 'pendiente' ? (efectivo ? 'Te paga en efectivo.' : 'Te paga por Mercado Pago, directo a tu cuenta.') : PAGO[pago.estado].detalle}</p>
            {pago.estado === 'pendiente' ? (
              <button type="button" className="boton boton--bloque" onClick={() => setInformar(true)}>
                <Icono nombre="check" /> {efectivo ? 'Ya lo cobré en efectivo' : 'Ya me pagó: informarlo'}
              </button>
            ) : null}
            <Link className="enlace" href={RUTAS.caja.ruta}>
              Ver la Caja
            </Link>
          </div>
        ) : (
          <p className="texto-suave">Todavía no hay un cobro registrado para este trabajo.</p>
        )}
      </section>

      <div className="botones">
        <Link className="boton boton--claro boton--bloque" href={RUTAS.inicio.ruta}>
          Volver al inicio
        </Link>
      </div>

      <Hoja abierta={informar} titulo="Informar el cobro" onCerrar={() => { setInformar(false); reporte.limpiar(); reporte.nueva(); }}>
        <p>
          Vas a informar que cobraste {pago ? pesos(pago.monto) : ''}. Queda como <strong>reportado</strong>: no se verifica solo porque lo informes vos. Lo confirma Mercado Pago u Operations.
        </p>
        {reporte.fallo ? <ErrorCaja fallo={reporte.fallo} onReintentar={() => void confirmarCobro()} /> : null}
        <div className="botones">
          <button type="button" className="boton boton--exito" disabled={reporte.pendiente} onClick={() => void confirmarCobro()}>
            {reporte.pendiente ? 'Guardando…' : 'Sí, ya lo cobré'}
          </button>
          <button type="button" className="boton boton--claro" onClick={() => setInformar(false)}>
            Todavía no
          </button>
        </div>
      </Hoja>
    </div>
  );
}
