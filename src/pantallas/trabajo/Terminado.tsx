'use client';
// ¡Terminaste! (lotes 4.6 y 4.7). En un trabajo de un día: el monto que sube, el desglose (acordado, adicionales, tarifa
// de Handyx y lo que recibís) e informar el cobro. En una obra, el cierre: cada etapa con sus adicionales y su cobro.
// El confeti solo si se vio terminar en esta pestaña. El pago es directo del cliente al especialista; informarlo lo
// deja "reportado", nunca verificado.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { terminadosEnSesion } from '../../components/AccionTrabajo.tsx';
import { CobroDirecto } from '../../components/CobroDirecto.tsx';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import type { Pago, TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { pesos, pesosDesdeCentavos } from '../../lib/formato.ts';
import { montosObra, totalEtapa } from '../../lib/obra.ts';
import { useConfeti } from '../../kit/Efectos.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { MontoGrande, Tilde } from '../../kit/Piezas.tsx';

export function Terminado() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, pagos] = await Promise.all([api.trabajo(id), api.pagos()]);
    return { detalle, pagos: pagos.items.filter((p) => p.trabajoId === detalle.trabajo.id) };
  }, [id]);
  const { lanzar, capa } = useConfeti();
  const [celebrar] = useState(() => (id ? terminadosEnSesion.has(id) : false));
  const listo = c.datos?.detalle.trabajo.estado === 'finalizado';
  useEffect(() => {
    if (!celebrar || !listo || !id) return;
    terminadosEnSesion.delete(id); // una sola vez: al volver a abrir la pantalla ya no celebra
    lanzar();
  }, [celebrar, listo, id, lanzar]);

  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { detalle: d, pagos } = c.datos;
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
  const obra = t.tipo === 'obra';

  return (
    <div className="fl-pantalla tr-fin">
      {capa}
      <BarraSuperior titulo={obra ? 'Obra terminada' : 'Trabajo terminado'} atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <section className="tr-fin__hero" aria-labelledby="tr-fin-t">
        <Tilde />
        <h1 id="tr-fin-t" className="hx-titulo tr-fin__titulo">
          {obra ? '¡Terminaste la obra!' : '¡Terminaste el trabajo!'}
        </h1>
        <p className="tr-fin__sub">
          {NOMBRE_RUBRO[t.rubro]} · {d.contraparte}
        </p>
        <MontoGrande centavos={d.totalVigente.centavos} className="tr-fin__monto" />
        <p className="tr-fin__sub">{obra ? `en ${d.etapas.length} etapas, directo del cliente a vos` : 'es lo que recibís, directo del cliente a vos'}</p>
      </section>
      {obra ? <CierreObra detalle={d} pagos={pagos} recargar={c.recargar} /> : <CierreTrabajo detalle={d} pago={pagos.find((p) => p.id === d.pagoId) ?? null} recargar={c.recargar} />}
      <div className="botones">
        <Link className="boton boton--claro boton--bloque" href={RUTAS.inicio.ruta}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}

function CierreTrabajo({ detalle: d, pago, recargar }: { detalle: TrabajoDetalle; pago: Pago | null; recargar(): Promise<unknown> }) {
  const t = d.trabajo;
  return (
    <>
      <section className="fl-bloque" aria-labelledby="tr-fin-desglose">
        <h2 id="tr-fin-desglose" className="fl-bloque__titulo">
          Desglose
        </h2>
        <dl className="tr-desglose tr-desglose--tarjeta">
          <div>
            <dt>Lo acordado</dt>
            <dd>{pesos(t.acuerdo.monto)}</dd>
          </div>
          {d.adicionales
            .filter((a) => a.estado === 'aceptado')
            .map((a) => (
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
        {pago ? <CobroDirecto pago={pago} alCambiar={recargar} /> : <p className="texto-suave">Todavía no hay un cobro registrado para este trabajo.</p>}
      </section>
    </>
  );
}

/** Cierre de la obra (4.7): cada etapa con sus adicionales y su cobro, y lo cobrado en total. */
function CierreObra({ detalle: d, pagos, recargar }: { detalle: TrabajoDetalle; pagos: Pago[]; recargar(): Promise<unknown> }) {
  const m = montosObra(d, pagos);
  return (
    <>
      <section className="fl-bloque" aria-labelledby="tr-fin-cobrado">
        <h2 id="tr-fin-cobrado" className="fl-bloque__titulo">
          Lo cobrado
        </h2>
        <dl className="tr-desglose tr-desglose--tarjeta">
          <div>
            <dt>Total de la obra</dt>
            <dd>{pesosDesdeCentavos(m.total)}</dd>
          </div>
          <div>
            <dt>Verificado</dt>
            <dd>{pesosDesdeCentavos(m.verificado)}</dd>
          </div>
          <div>
            <dt>Informado, sin verificar</dt>
            <dd>{pesosDesdeCentavos(m.informado)}</dd>
          </div>
          <div className="tr-desglose__total">
            <dt>Falta cobrar</dt>
            <dd>{pesosDesdeCentavos(m.falta)}</dd>
          </div>
        </dl>
        <p className="texto-suave texto-chico">Cada etapa se cobra por separado. Handyx no cobra tarifa durante la demo (0 %).</p>
      </section>
      <section className="fl-bloque" aria-labelledby="tr-fin-etapas">
        <h2 id="tr-fin-etapas" className="fl-bloque__titulo">
          Etapa por etapa
        </h2>
        <ol className="ob-cierre">
          {d.etapas.map((e) => {
            const pago = pagos.find((p) => p.id === e.pagoId);
            return (
              <li key={e.id} className="ob-cierre__etapa">
                <p className="ob-cierre__titulo">
                  <span>
                    {e.orden}. {e.nombre}
                  </span>
                  <strong>{pesosDesdeCentavos(totalEtapa(e, d.adicionales))}</strong>
                </p>
                <dl className="tr-desglose">
                  <div>
                    <dt>Lo acordado</dt>
                    <dd>{pesos(e.monto)}</dd>
                  </div>
                  {d.adicionales
                    .filter((a) => a.etapaId === e.id && a.estado === 'aceptado')
                    .map((a) => (
                      <div key={a.id}>
                        <dt>{a.descripcion}</dt>
                        <dd>+ {pesos(a.monto)}</dd>
                      </div>
                    ))}
                </dl>
                {pago ? <CobroDirecto pago={pago} alCambiar={recargar} conCaja={false} que={`etapa ${e.orden}, ${e.nombre}`} /> : null}
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
