'use client';
// F-Ingresos (lote 2.1): lo que cobraste en el mes. Neto = bruto − gastos; sin tarifa de Handyx (nunca le cobra comisión
// al especialista). Lo informado sin verificar va aparte hasta que se confirma. Abajo, la ganancia de cada trabajo y los
// gastos del mes, con «Borrar» (la forma de deshacer un gasto cargado por error).
import { api } from '@handyx/origen-datos';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { Gasto } from '../../contracts/ingresos.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { ICONO_CATEGORIA, mesDe, moverMesTexto, NOMBRE_CATEGORIA, nombreMes, tramosNeto } from '../../lib/agendaTaller.ts';
import { diaLocal, fechaCorta, pesosDesdeCentavos } from '../../lib/formato.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Cifra } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { BarraNeto, FilaGanancia, FilaGasto, LineaCuenta, SelectorMes } from '../../ui/moleculas/IngresosPiezas.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { Fallo } from './piezas.tsx';

const MUESTRA: Record<string, string> = {
  materiales: 'amarillo',
  combustible_viaticos: 'noche',
  herramientas: 'arena',
  otro: 'gris',
};

export function Ingresos() {
  const hoy = diaLocal(api.ahora().toISOString());
  const mesActual = mesDe(hoy);
  const [mes, setMes] = useState(mesActual);
  const guardado = useSearchParams().get('guardado') === '1';
  const [porBorrar, setPorBorrar] = useState<Gasto | null>(null);
  const [borrado, setBorrado] = useState<string | null>(null);
  const borrar = useAccion();
  const c = useCarga(async () => {
    const [resumen, gastos] = await Promise.all([api.resumenIngresos(mes), api.gastos({ mes })]);
    return { resumen, gastos: gastos.items };
  }, [mes]);

  const barra = <BarraCompacta titulo="Tus ingresos" hrefVolver={RUTAS.taller.ruta} />;
  const accion = (
    <AccionFija>
      <BotonEnlace href={RUTAS.ingresoGasto.ruta} icono="camara" bloque>
        Cargar un gasto con la foto del ticket
      </BotonEnlace>
    </AccionFija>
  );
  if (c.fallo && !c.datos) return <Fallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { resumen: r, gastos } = c.datos;
  const tramos = tramosNeto(r);
  const perdida = r.neto === null;

  async function confirmarBorrado() {
    if (!porBorrar) return;
    const g = porBorrar;
    const x = await borrar.ejecutar(async () => {
      await api.borrarGasto(g.id);
      await c.recargar();
    });
    if (x.ok) {
      setBorrado(`Borraste el gasto «${g.descripcion ?? NOMBRE_CATEGORIA[g.categoria]}» de ${pesosDesdeCentavos(g.monto.centavos)}.`);
      setPorBorrar(null);
    }
  }

  return (
    <PantallaSecundaria barra={barra} accion={accion}>
      {guardado && !borrado ? (
        <AvisoCaja tono="exito" titulo="Guardamos tu gasto">
          Ya está en «Tus gastos» de abajo. Si te equivocaste, lo podés borrar desde ahí.
        </AvisoCaja>
      ) : null}
      {borrado ? (
        <AvisoCaja tono="exito" titulo="Listo">
          {borrado}
        </AvisoCaja>
      ) : null}
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <section className="ui-ing-cabeza" aria-label="Resumen del mes">
        <div className="ui-ing-cabeza__fila">
          <Etiqueta>{perdida ? 'ESTE MES PERDISTE' : 'NETO · LO QUE TE QUEDA'}</Etiqueta>
          <SelectorMes nombre={nombreMes(mes)} onAnterior={() => setMes(moverMesTexto(mes, -1))} onSiguiente={() => setMes(moverMesTexto(mes, 1))} siguienteDeshabilitado={mes >= mesActual} />
        </div>
        <p className="ui-ing-cabeza__neto">
          <Cifra centavos={perdida ? (r.perdida?.centavos ?? 0) : (r.neto?.centavos ?? 0)} tam="grande" />
        </p>
        <p className="ui-ing-cabeza__detalle">
          Bruto <Cifra centavos={r.bruto.total.centavos} tam="chico" /> · gastos <Cifra centavos={r.gastos.total.centavos} tam="chico" />
          {perdida ? ' · los gastos fueron más que lo que cobraste' : ''}
        </p>
        <BarraNeto tramos={tramos} />
      </section>

      <Tarjeta etiqueta="Cuenta del mes">
        <div className="ui-cuenta">
          <LineaCuenta texto="Bruto cobrado" centavos={r.bruto.total.centavos} fuerte />
          <LineaCuenta texto="En Handyx · verificado" centavos={r.bruto.enHandyxVerificado.centavos} suave />
          <LineaCuenta texto="En Handyx · informado, falta verificar" centavos={r.bruto.enHandyxInformado.centavos} suave />
          <LineaCuenta texto="Por fuera de Handyx" centavos={r.bruto.porFuera.centavos} suave />
          <hr className="ui-separador" />
          {r.gastos.porCategoria.length === 0 ? <p className="ui-nota">Este mes no cargaste gastos.</p> : null}
          {r.gastos.porCategoria.map((g) => (
            <LineaCuenta key={g.categoria} texto={NOMBRE_CATEGORIA[g.categoria]} centavos={g.total.centavos} resta muestra={MUESTRA[g.categoria]} />
          ))}
          <hr className="ui-separador" />
          <p className={`ui-neto-final${perdida ? ' ui-neto-final--perdida' : ''}`}>
            <span>{perdida ? 'Pérdida' : 'Neto'}</span>
            <Cifra centavos={perdida ? (r.perdida?.centavos ?? 0) : (r.neto?.centavos ?? 0)} tam="medio" />
          </p>
        </div>
        <p className="ui-cuenta__nota">Lo informado sin verificar se muestra aparte hasta que se confirma. Handyx no te cobra comisión: lo que cobrás es tuyo.</p>
      </Tarjeta>

      <section className="ui-ing-seccion" aria-labelledby="ing-ganancia">
        <h2 id="ing-ganancia" className="ui-ing-seccion__titulo">
          Ganancia por trabajo
        </h2>
        {r.porTrabajo.length === 0 ? <p className="ui-nota">Todavía no cobraste ningún trabajo este mes.</p> : null}
        <ul className="ui-ganancias">
          {r.porTrabajo.map((t) => (
            <FilaGanancia
              key={`${t.trabajoId}:${t.etapaId ?? ''}`}
              titulo={t.titulo}
              cobrado={t.cobrado.centavos}
              gastos={t.gastos.centavos}
              ganancia={t.ganancia?.centavos ?? null}
              perdida={t.perdida?.centavos ?? null}
            />
          ))}
        </ul>
      </section>

      <section className="ui-ing-seccion" aria-labelledby="ing-gastos">
        <h2 id="ing-gastos" className="ui-ing-seccion__titulo">
          Tus gastos
        </h2>
        <p className="ui-nota">Tus gastos son tuyos: el cliente no los ve.</p>
        {gastos.length === 0 ? <p className="ui-nota">No cargaste gastos este mes.</p> : null}
        <ul className="ui-gastos">
          {gastos.map((g) => (
            <FilaGasto
              key={g.id}
              icono={ICONO_CATEGORIA[g.categoria]}
              titulo={g.descripcion ?? NOMBRE_CATEGORIA[g.categoria]}
              detalle={`${NOMBRE_CATEGORIA[g.categoria]} · ${fechaCorta(`${g.fecha}T15:00:00.000Z`)}`}
              centavos={g.monto.centavos}
              onBorrar={() => setPorBorrar(g)}
            />
          ))}
        </ul>
      </section>

      <Hoja
        abierta={porBorrar !== null}
        titulo="¿Borrar este gasto?"
        onCerrar={() => {
          setPorBorrar(null);
          borrar.limpiar();
        }}
        pie={
          <div className="ui-pie-columna">
            <Boton variante="peligro" ocupado={borrar.pendiente} textoOcupado="Borrando…" onClick={() => void confirmarBorrado()}>
              Sí, borrarlo
            </Boton>
            <Boton variante="texto" onClick={() => setPorBorrar(null)}>
              No, dejarlo
            </Boton>
          </div>
        }
      >
        {porBorrar ? (
          <p>
            {porBorrar.descripcion ?? NOMBRE_CATEGORIA[porBorrar.categoria]} · <Cifra centavos={porBorrar.monto.centavos} tam="chico" />. Si ya se lo cobraste al cliente como adicional, el adicional
            sigue como está.
          </p>
        ) : null}
        {borrar.fallo ? <ErrorCaja fallo={borrar.fallo} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}
