'use client';
// F-Herramientas (lote 2.1): la pestaña Taller. La agenda de la semana arriba (tarjeta azul) y cuatro accesos con su resumen:
// ingresos y gastos, presupuestos y precios, equipamiento y las herramientas del teléfono; abajo, la ferretería.
// Lo de agenda e ingresos viene del servidor; presupuestos, equipamiento y ferretería llegan con sus lotes (2.2, 2.4 y la
// ola 4): hasta entonces su acceso dice qué hay adentro, sin cifras inventadas.
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando } from '../../components/Estados.tsx';
import { useCarga } from '../../hooks/useCarga.ts';
import { diaLocal, hora } from '../../lib/formato.ts';
import { mesDe, nombreMes, textoTurnos } from '../../lib/agendaTaller.ts';
import { ResumenTarjeta } from '../../ui/moleculas/Ajustes.tsx';
import { Encabezado } from '../../ui/moleculas/Encabezado.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { BarraPestanas } from '../../ui/organismos/BarraPestanas.tsx';
import { AccesoAncho, TarjetaAgendaTaller, type DiaSemanaMini } from '../../ui/organismos/TallerPiezas.tsx';
import { PantallaRaiz } from '../../ui/plantillas/Plantillas.tsx';
import { Fallo } from './piezas.tsx';

/** Rutas de los lotes que todavía no están: 2.2 (presupuestos), 2.4 (equipamiento) y la ola 4 (ferretería). */
export const ACCESOS_TALLER = {
  presupuestos: '/taller/presupuestos/',
  equipamiento: '/taller/equipamiento/',
  ferreteria: '/taller/ferreteria/',
} as const;

const CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const;

export function Herramientas() {
  const mes = mesDe(diaLocal(api.ahora().toISOString()));
  const c = useCarga(async () => {
    const [agenda, ingresos] = await Promise.all([api.resumenAgenda(), api.resumenIngresos(mes)]);
    return { agenda, ingresos };
  }, [mes]);

  if (c.fallo && !c.datos) return <Fallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { agenda, ingresos } = c.datos;

  const semana: DiaSemanaMini[] = agenda.semana.map((d) => ({
    fecha: d.fecha,
    corto: CORTO[new Date(`${d.fecha}T12:00:00.000Z`).getUTCDay()] ?? '',
    dia: Number(d.fecha.slice(8)),
    turnos: d.turnos,
    hoy: d.fecha === agenda.hoy,
  }));
  const detalleAgenda = `Hoy, ${textoTurnos(agenda.deHoy).toLowerCase()}${agenda.proximo ? ` · próximo ${hora(agenda.proximo.inicio)}` : ''}`;

  return (
    <div className="tg-raiz">
      <PantallaRaiz>
        <Encabezado etiqueta="AGENDA, PLATA Y HERRAMIENTAS" antes="Tu " marcado="taller" />
        {c.fallo ? <AvisoCaja tono="error">No pudimos actualizar los datos. Lo que ves puede estar desactualizado.</AvisoCaja> : null}
        <TarjetaAgendaTaller href={RUTAS.agenda.ruta} titulo="Agenda" detalle={detalleAgenda} semana={semana} />
        <div className="ui-tx-mosaicos">
          {ingresos.neto ? (
            <ResumenTarjeta
              icono="grafico"
              titulo="Ingresos y gastos"
              centavos={ingresos.neto.centavos}
              detalle={`Neto de ${nombreMes(mes).split(' ')[0]?.toLowerCase()}`}
              href={RUTAS.ingresos.ruta}
            />
          ) : (
            <ResumenTarjeta icono="grafico" titulo="Ingresos y gastos" texto="Gastos mayores" detalle={`Este mes gastaste más de lo que cobraste`} href={RUTAS.ingresos.ruta} />
          )}
          <ResumenTarjeta icono="ticket" titulo="Presupuestos y precios" texto="Armalos acá" detalle="Y mandalos por el chat" href={ACCESOS_TALLER.presupuestos} />
          <ResumenTarjeta icono="caja" titulo="Tu equipamiento" texto="Tus herramientas" detalle="Qué tenés y dónde está" href={ACCESOS_TALLER.equipamiento} />
          <ResumenTarjeta icono="regla" titulo="Herramientas del teléfono" texto="Medir y 3D" detalle="Nivel, linterna y tu oficio" href={RUTAS.tallerHerramientas.ruta} tono="noche" />
        </div>
        <AccesoAncho href={ACCESOS_TALLER.ferreteria} icono="carrito" titulo="Ferretería" detalle="Catálogo y pedidos" />
      </PantallaRaiz>
      <BarraPestanas />
    </div>
  );
}
