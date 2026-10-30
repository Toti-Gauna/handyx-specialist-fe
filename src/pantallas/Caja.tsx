'use client';
// Caja (lote 4.8): lo cobrado en el mes, los totales por estado, los movimientos filtrados por estado y el desglose de
// cada uno. El pago es directo del cliente al especialista; informar un cobro lo deja "reportado", nunca verificado.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono } from '../components/Icono.tsx';
import { Aviso, Chip, ChipTexto, Dato, Seccion } from '../components/ui.tsx';
import type { Pago } from '../contracts/dto.ts';
import type { SimulacionPostDemo } from '../data/api.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { METODO_PAGO, PAGO } from '../lib/etiquetas.ts';
import { fechaHora, pesos, pesosDesdeCentavos } from '../lib/formato.ts';
import { filtrarPagos, FILTROS_CAJA, resumenMes, type FiltroCaja } from '../lib/caja.ts';
import { ChipOpcion } from '../kit/Piezas.tsx';
import './caja.css';
import { tarifaTexto } from '../lib/tarifa.ts';

type Intencion = { pago: Pago; accion: 'reportar' | 'discrepancia' } | null;

export function Caja() {
  const c = useCarga(async () => {
    const [resumen, pagos, fee] = await Promise.all([api.cajaResumen(), api.pagos(), api.feeVigente()]);
    return { resumen, pagos: pagos.items, fee };
  }, []);
  const [intencion, setIntencion] = useState<Intencion>(null);
  const [filtro, setFiltro] = useState<FiltroCaja>('todos');
  const [simulacion, setSimulacion] = useState<SimulacionPostDemo | null>(null);
  const accion = useAccion();
  const sim = useAccion();

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { resumen, pagos, fee } = c.datos;

  async function confirmar() {
    if (!intencion) return;
    const { pago, accion: a } = intencion;
    // El refresco va dentro de la acción: la hoja se cierra con la lista ya actualizada.
    const r = await accion.ejecutar(async () => {
      await (a === 'reportar' ? api.reportarCobro(pago.id, accion.clave()) : api.marcarDiscrepancia(pago.id, accion.clave()));
      await c.recargar();
    });
    if (r.ok) {
      setIntencion(null);
    } else if (r.fallo.tipo === 'conflicto') {
      await c.recargar();
    }
  }
  function cerrar() {
    setIntencion(null);
    accion.limpiar();
    accion.nueva();
  }
  async function verSimulacion() {
    if (simulacion) return setSimulacion(null);
    const r = await sim.ejecutar(() => api.simulacionPostDemo?.() ?? Promise.reject(new Error('sin simulación')));
    if (r.ok) setSimulacion(r.valor);
  }

  const mes = resumenMes(pagos, api.ahora());
  const visibles = filtrarPagos(pagos, filtro);

  return (
    <div className="pila cj">
      <h1 className="titulo">Caja</h1>
      <Aviso tono="azul" icono="info" titulo="El pago va directo a vos">
        Los clientes te pagan a vos, con Mercado Pago o en efectivo. Handyx no recibe, guarda ni te transfiere ese dinero, así que acá no hay saldo para retirar de Handyx. Handyx nunca te pide tu contraseña de Mercado Pago.
      </Aviso>
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <section className="cj-mes" aria-labelledby="cj-mes-t">
        <h2 id="cj-mes-t" className="cj-mes__titulo">
          Cobrado este mes
        </h2>
        <p className="cj-mes__monto">{pesosDesdeCentavos(mes.verificado + mes.informado)}</p>
        <p className="cj-mes__detalle">
          {pesosDesdeCentavos(mes.verificado)} verificado · {pesosDesdeCentavos(mes.informado)} informado por vos, sin verificar
        </p>
      </section>

      <ul className="cj-totales" aria-label="Totales">
        <li>
          <ChipTexto tono="exito" icono="verificado">Verificado</ChipTexto>
          <span className="cj-totales__dato">{pesos(resumen.verificado)}</span>
          <small>Confirmado por Mercado Pago u Operations.</small>
        </li>
        <li>
          <ChipTexto tono="azul" icono="info">Reportado, sin verificar</ChipTexto>
          <span className="cj-totales__dato">{pesos(resumen.reportado)}</span>
          <small>Cobros que informaste vos.</small>
        </li>
        <li>
          <ChipTexto tono="aviso" icono="reloj">Pendiente de cobro</ChipTexto>
          <span className="cj-totales__dato">{pesos(resumen.pendiente)}</span>
          <small>Todavía sin cobrar.</small>
        </li>
      </ul>
      <p className="texto-suave texto-chico">
        Tarifa de Handyx en este período: <strong>{pesos(resumen.feeHandyPeriodo)}</strong>. {tarifaTexto(fee.politica, api.ahora())}
      </p>

      <section className="fl-bloque" aria-labelledby="cj-mov-t">
        <h2 id="cj-mov-t" className="cj-subtitulo">
          Movimientos
        </h2>
        <ul className="hx-chips hx-chips--carril" aria-label="Filtrar por estado">
          {FILTROS_CAJA.map((f) => (
            <li key={f.id}>
              <ChipOpcion texto={`${f.texto} · ${filtrarPagos(pagos, f.id).length}`} elegido={filtro === f.id} onClick={() => setFiltro(f.id)} />
            </li>
          ))}
        </ul>
        {pagos.length === 0 ? (
          <Vacio icono="caja" titulo="Todavía no tenés pagos">Cuando termines un trabajo, el cobro aparece acá.</Vacio>
        ) : visibles.length === 0 ? (
          <p className="texto-suave">No hay movimientos con ese estado.</p>
        ) : (
          <ul className="cj-lista">
            {visibles.map((p) => (
              <Movimiento key={p.id} pago={p} alElegir={(a) => setIntencion({ pago: p, accion: a })} />
            ))}
          </ul>
        )}
      </section>

      {api.simulacionPostDemo ? (
        <Seccion titulo="Después de la demo (simulación)">
          <button type="button" className="boton boton--claro boton--bloque" onClick={() => void verSimulacion()} aria-expanded={simulacion !== null}>
            {simulacion ? 'Ocultar la simulación' : 'Ver la simulación posterior a la demo'}
          </button>
          {sim.fallo ? <ErrorCaja fallo={sim.fallo} /> : null}
          {simulacion ? (
            <div className="simulacion pila">
              <Aviso tono="aviso" icono="alerta" titulo="SIMULACIÓN · no vigente">{simulacion.rotulo}</Aviso>
              <p className="texto-suave">Así se vería una comisión sobre cobros en efectivo si más adelante Handyx aprueba una tarifa. El porcentaje de la simulación es ilustrativo. No se cobra ni se descuenta nada en el piloto.</p>
              {simulacion.entradas.length === 0 ? <p>No hay cobros en efectivo para simular.</p> : (
                <ul className="lista-tarjetas">
                  {simulacion.entradas.map((e) => (
                    <li key={e.pagoId} className="tarjeta">
                      <div className="fila-flex fila-flex--entre">
                        <span className="tarjeta__titulo">{e.descripcion}</span>
                        <ChipTexto tono={e.estado === 'saldada' ? 'exito' : 'aviso'}>{e.estado === 'saldada' ? 'Saldada (simulada)' : 'Adeudada (simulada)'}</ChipTexto>
                      </div>
                      <dl>
                        <Dato etiqueta="Cobraste en efectivo" valor={pesos(e.cobrado)} />
                        <Dato etiqueta="Comisión simulada" valor={pesos(e.comision)} />
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </Seccion>
      ) : null}

      <p className="texto-suave texto-chico">
        ¿Algo no coincide? <Link href={`${RUTAS.soporte.ruta}`}>Pedí ayuda sobre un pago</Link>.
      </p>

      <Hoja abierta={intencion !== null} titulo={intencion?.accion === 'reportar' ? 'Informar un cobro' : 'Marcar una discrepancia'} onCerrar={cerrar}>
        {intencion ? (
          <>
            <p>
              {intencion.pago.descripcion} · <strong>{pesos(intencion.pago.monto)}</strong> · {METODO_PAGO[intencion.pago.metodo]}
            </p>
            {intencion.accion === 'reportar' ? (
              <Aviso tono="azul" icono="info">
                Vas a informar que ya cobraste. Queda como <strong>reportado</strong>: no se verifica solo porque lo informes vos. Lo confirma Mercado Pago u Operations.
              </Aviso>
            ) : (
              <Aviso tono="aviso" icono="alerta">
                Indicás que el cobro o el importe no coinciden. Operations lo revisa.
              </Aviso>
            )}
            {accion.fallo ? <ErrorCaja fallo={accion.fallo} onReintentar={() => void confirmar()} /> : null}
            <div className="botones">
              <button type="button" className="boton" disabled={accion.pendiente} onClick={() => void confirmar()}>
                {accion.pendiente ? 'Enviando…' : intencion.accion === 'reportar' ? 'Sí, ya lo cobré' : 'Marcar discrepancia'}
              </button>
              <button type="button" className="boton boton--claro" onClick={cerrar}>Volver</button>
            </div>
          </>
        ) : null}
      </Hoja>
    </div>
  );
}

/** Un cobro: lo que recibís, su estado y, al abrirlo, el desglose. Las acciones quedan siempre a la vista. */
function Movimiento({ pago: p, alElegir }: { pago: Pago; alElegir(a: 'reportar' | 'discrepancia'): void }) {
  const [abierto, setAbierto] = useState(false);
  const idDesglose = `cj-desglose-${p.id}`;
  return (
    <li className="cj-mov">
      <div className="cj-mov__cuerpo">
        <span className="cj-mov__ico" aria-hidden="true">
          <Icono nombre={p.metodo === 'efectivo' ? 'billetera' : 'caja'} />
        </span>
        <span className="cj-mov__texto">
          <strong>{p.descripcion}</strong>
          <small>
            {p.metodo === 'efectivo' ? 'Efectivo' : 'Mercado Pago'} · {fechaHora(p.actualizadoEn)}
          </small>
          <Chip e={PAGO[p.estado]} />
        </span>
        <span className="cj-mov__monto">{pesos(p.neto)}</span>
      </div>
      <div id={idDesglose} className="cj-mov__desglose" hidden={!abierto}>
        <dl>
          <Dato etiqueta="Importe" valor={pesos(p.monto)} />
          <Dato etiqueta="Tarifa de Handyx" valor={pesos(p.feeHandy)} />
          <Dato etiqueta="Para vos" valor={<strong>{pesos(p.neto)}</strong>} />
          <Dato etiqueta="Cómo te paga" valor={METODO_PAGO[p.metodo]} />
        </dl>
        <p className="texto-suave texto-chico">{PAGO[p.estado].detalle}</p>
        {p.referenciaProveedor ? <p className="texto-suave texto-chico">Referencia del proveedor: {p.referenciaProveedor}</p> : null}
      </div>
      <AccionesPago pago={p} alElegir={alElegir} />
      <button type="button" className="cj-mov__franja" aria-expanded={abierto} aria-controls={idDesglose} onClick={() => setAbierto((x) => !x)}>
        {abierto ? 'Ocultar el desglose' : 'Ver el desglose'}
        <span className="visualmente-oculto"> de {p.descripcion}</span>
        <Icono nombre={abierto ? 'arriba' : 'abajo'} />
      </button>
    </li>
  );
}

function AccionesPago({ pago, alElegir }: { pago: Pago; alElegir(a: 'reportar' | 'discrepancia'): void }) {
  if (pago.estado === 'pendiente') {
    return (
      <div className="pila pila--chica">
        {pago.metodo === 'mercado_pago' ? <p className="texto-suave texto-chico"><Icono nombre="reloj" className="icono icono--chico" /> Esperando que Mercado Pago confirme el pago. Si ya lo cobraste, podés informarlo.</p> : null}
        <button type="button" className="boton boton--claro boton--chico" onClick={() => alElegir('reportar')}>
          <Icono nombre="check" /> {pago.metodo === 'efectivo' ? 'Informar cobro en efectivo' : 'Ya lo cobré: informarlo'}
        </button>
      </div>
    );
  }
  if (pago.estado === 'reportado') {
    return (
      <button type="button" className="boton boton--claro boton--chico" onClick={() => alElegir('discrepancia')}>
        <Icono nombre="alerta" /> El importe no coincide
      </button>
    );
  }
  if (pago.estado === 'fallido') {
    return <p className="texto-suave texto-chico">El usuario puede volver a pagar, o acordar el pago en efectivo con vos. Si necesitás ayuda, escribinos desde Ayuda.</p>;
  }
  return null;
}
