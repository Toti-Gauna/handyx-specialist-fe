'use client';
// F-Agenda y F-AgendaPasadas (lote 2.1): Pasadas · Hoy · Futuras. Hoy muestra la semana entera para elegir un día; las
// futuras, de a un día; las pasadas, con cómo va cada cobro (informado ≠ verificado). Una oferta no es un turno: se
// confirma recién cuando la otra parte acepta, y lo dice escrito. La vista elegida va en `?vista=` (se puede volver).
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { TurnoAgenda, VistaAgenda } from '../../contracts/agenda.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { agruparPorDia, chipCobro, chipTurno, nombreMes, rotuloDia, textoTurnos, totalDelDia, mesDe, lunesDe } from '../../lib/agendaTaller.ts';
import { diaLocal, hora, pesosDesdeCentavos } from '../../lib/formato.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Casa } from '../../ui/ilustraciones/Arreglos.tsx';
import { FilaPasada, GrupoPasadas, ResumenPasadas, TurnoTarjeta } from '../../ui/moleculas/AgendaPiezas.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { TiraDias } from '../../ui/moleculas/Fechas.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { BarraPestanas } from '../../ui/organismos/BarraPestanas.tsx';
import { EstadoVacio } from '../../ui/organismos/EstadosPantalla.tsx';
import { PantallaRaiz } from '../../ui/plantillas/Plantillas.tsx';
import { destinoTurno, Fallo } from './piezas.tsx';

const VISTAS: readonly VistaAgenda[] = ['pasadas', 'hoy', 'futuras'];

function Turno({ t }: { t: TurnoAgenda }) {
  return (
    <TurnoTarjeta
      desde={hora(t.inicio)}
      hasta={t.fin ? hora(t.fin) : null}
      titulo={t.titulo}
      detalle={t.detalle}
      chip={chipTurno(t)}
      cliente={t.cliente?.nombre ?? null}
      equipo={t.equipo.length}
      centavos={t.monto?.centavos ?? null}
      alerta={t.superpuesto ? 'Se superpone con un trabajo que ya tenés agendado' : null}
      href={destinoTurno(t)}
    />
  );
}

export function Agenda() {
  const router = useRouter();
  const pedida = useSearchParams().get('vista');
  const [vista, setVista] = useState<VistaAgenda>(VISTAS.includes(pedida as VistaAgenda) ? (pedida as VistaAgenda) : 'hoy');
  const resumen = useCarga(() => api.resumenAgenda(), []);

  if (resumen.fallo && !resumen.datos) return <Fallo fallo={resumen.fallo} onReintentar={() => void resumen.recargar()} />;
  if (!resumen.datos) return <Cargando />;
  const r = resumen.datos;

  const cambiar = (v: VistaAgenda) => {
    setVista(v);
    router.replace(`${RUTAS.agenda.ruta}?vista=${v}`, { scroll: false });
  };

  return (
    <div className="tg-raiz">
      <PantallaRaiz>
        <div className="ui-ag-titulo">
          <Encabezado etiqueta={nombreMes(mesDe(r.hoy)).toUpperCase()} antes="Tu " marcado="agenda" />
          <BotonEnlace href={RUTAS.agendaMes.ruta} icono="agenda" chico>
            Ver el mes
          </BotonEnlace>
        </div>
        <Segmento
          etiqueta="Qué turnos ver"
          valor={vista}
          onCambio={cambiar}
          opciones={[
            { valor: 'pasadas', texto: `Pasadas · ${r.pasadas}` },
            { valor: 'hoy', texto: `Hoy · ${r.deHoy}` },
            { valor: 'futuras', texto: `Futuras · ${r.futuras}` },
          ]}
        />
        {vista === 'hoy' ? <Hoy hoy={r.hoy} ocupados={r.semana.filter((d) => d.turnos > 0).map((d) => d.fecha)} /> : null}
        {vista === 'futuras' ? <Futuras hoy={r.hoy} /> : null}
        {vista === 'pasadas' ? <Pasadas hoy={r.hoy} cobradoCentavos={r.cobradoMes.centavos} total={r.pasadas} /> : null}
      </PantallaRaiz>
      <BarraPestanas />
    </div>
  );
}

function Hoy({ hoy, ocupados }: { hoy: string; ocupados: readonly string[] }) {
  const [elegido, setElegido] = useState(hoy);
  const dia = useCarga(() => api.turnosDelDia(elegido), [elegido]);
  const turnos = dia.datos ?? [];
  const total = totalDelDia(turnos);
  return (
    <>
      <TiraDias desde={lunesDe(hoy)} cuantos={7} hoy={hoy} valor={elegido} onCambio={setElegido} ocupados={ocupados} etiqueta="Elegí un día de esta semana" />
      <section className="ui-ag-dia" aria-labelledby="ag-dia-t" aria-live="polite">
        <h2 id="ag-dia-t" className="ui-ag-dia__titulo">
          {rotuloDia(elegido, hoy).replace(/^./, (c) => c.toUpperCase())}
        </h2>
        {dia.datos ? (
          <span className="ui-ag-dia__resumen">
            {textoTurnos(turnos.length)}
            {total > 0 ? ` · ${pesosDesdeCentavos(total)}` : ''}
          </span>
        ) : null}
      </section>
      {dia.fallo && !dia.datos ? <ErrorCaja fallo={dia.fallo} onReintentar={() => void dia.recargar()} /> : null}
      {!dia.datos && !dia.fallo ? <Cargando /> : null}
      {dia.datos && turnos.length === 0 ? (
        <EstadoVacio ilustracion={<Casa tam="medio" />} titulo="No tenés nada este día">
          Cuando aceptes un trabajo o te acepten una propuesta, aparece acá.
        </EstadoVacio>
      ) : null}
      <ul className="ui-turnos">
        {turnos.map((t) => (
          <li key={t.id}>
            <Turno t={t} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Una vista paginada: la primera página y las que se piden después con «Ver más», sin perder lo ya visto. */
function usePaginas(vista: 'pasadas' | 'futuras') {
  const c = useCarga(() => api.turnosAgenda(vista), [vista]);
  const [extra, setExtra] = useState<{ items: TurnoAgenda[]; siguiente: string | null } | null>(null);
  const mas = useAccion();
  const items = c.datos ? [...c.datos.items, ...(extra?.items ?? [])] : [];
  const siguiente = extra ? extra.siguiente : (c.datos?.siguienteCursor ?? null);
  async function verMas() {
    if (!siguiente) return;
    const r = await mas.ejecutar(() => api.turnosAgenda(vista, siguiente));
    if (r.ok) setExtra((p) => ({ items: [...(p?.items ?? []), ...r.valor.items], siguiente: r.valor.siguienteCursor }));
  }
  return { c, items, siguiente, mas, verMas };
}

function VerMas({ p, texto }: { p: ReturnType<typeof usePaginas>; texto: string }) {
  return (
    <>
      {p.mas.fallo ? <ErrorCaja fallo={p.mas.fallo} onReintentar={() => void p.verMas()} /> : null}
      {p.siguiente ? (
        <Boton variante="contorno" bloque ocupado={p.mas.pendiente} textoOcupado="Cargando…" onClick={() => void p.verMas()}>
          {texto}
        </Boton>
      ) : null}
    </>
  );
}

function Futuras({ hoy }: { hoy: string }) {
  const p = usePaginas('futuras');
  if (p.c.fallo && !p.c.datos) return <ErrorCaja fallo={p.c.fallo} onReintentar={() => void p.c.recargar()} />;
  if (!p.c.datos) return <Cargando />;
  const grupos = agruparPorDia(p.items, diaLocal);
  if (grupos.length === 0)
    return (
      <EstadoVacio ilustracion={<Casa tam="medio" />} titulo="No tenés turnos futuros">
        Cuando aceptes un trabajo o te acepten una propuesta, aparece acá.
      </EstadoVacio>
    );
  return (
    <>
      {grupos.map((g) => (
        <section key={g.fecha} className="ui-ag-grupo" aria-label={rotuloDia(g.fecha, hoy)}>
          <Etiqueta como="h2">{rotuloDia(g.fecha, hoy)}</Etiqueta>
          <ul className="ui-turnos">
            {g.turnos.map((t) => (
              <li key={t.id}>
                <Turno t={t} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <VerMas p={p} texto="Ver más turnos" />
    </>
  );
}

function Pasadas({ hoy, cobradoCentavos, total }: { hoy: string; cobradoCentavos: number; total: number }) {
  const p = usePaginas('pasadas');
  if (p.c.fallo && !p.c.datos) return <ErrorCaja fallo={p.c.fallo} onReintentar={() => void p.c.recargar()} />;
  if (!p.c.datos) return <Cargando />;
  const grupos = agruparPorDia(p.items, diaLocal);
  return (
    <>
      <ResumenPasadas trabajos={total} cobradoCentavos={cobradoCentavos} />
      {grupos.length === 0 ? (
        <EstadoVacio ilustracion={<Casa tam="medio" />} titulo="Todavía no tenés trabajos pasados">
          Los que termines quedan acá con cómo va su cobro.
        </EstadoVacio>
      ) : null}
      {grupos.map((g) => (
        <GrupoPasadas key={g.fecha} rotulo={rotuloDia(g.fecha, hoy)}>
          {g.turnos.map((t) => (
            <FilaPasada
              key={t.id}
              titulo={t.titulo}
              detalle={[t.detalle, t.cliente?.nombre].filter(Boolean).join(' · ')}
              centavos={t.cobro?.monto.centavos ?? t.monto?.centavos ?? null}
              chip={t.cobro ? chipCobro(t.cobro.estado) : chipTurno(t)}
              href={destinoTurno(t)}
            />
          ))}
        </GrupoPasadas>
      ))}
      <VerMas p={p} texto="Ver más pasadas" />
    </>
  );
}
