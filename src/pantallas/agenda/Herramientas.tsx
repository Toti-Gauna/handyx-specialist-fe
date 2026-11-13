'use client';
// F-Herramientas (lote 2.1): la pestaña Taller. La agenda de la semana arriba (tarjeta azul) y cuatro accesos con su resumen:
// ingresos y gastos, presupuestos y precios, equipamiento y las herramientas del teléfono; abajo, la ferretería.
// Todo viene del servidor. Si el resumen de presupuestos o de equipamiento no llega, su acceso dice qué hay adentro, sin
// cifras inventadas. La ferretería llega con la ola 4.
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

/** La ferretería llega con la ola 4 (lote 4.1), en esta ruta. */
const RUTA_FERRETERIA = '/taller/ferreteria/';
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const CORTO = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const;

export function Herramientas() {
  const mes = mesDe(diaLocal(api.ahora().toISOString()));
  const c = useCarga(async () => {
    // Los resúmenes de presupuestos y equipamiento son un extra: si fallan, la pestaña igual se muestra.
    const [agenda, ingresos, abiertos, equipo] = await Promise.all([
      api.resumenAgenda(),
      api.resumenIngresos(mes),
      api.presupuestos('abiertos').catch(() => null),
      api.equipamiento().catch(() => null),
    ]);
    return { agenda, ingresos, abiertos, equipo };
  }, [mes]);

  if (c.fallo && !c.datos) return <Fallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  const { agenda, ingresos, abiertos, equipo } = c.datos;
  const cuantosAbiertos = abiertos?.items.length ?? 0;
  const herramientas = equipo ? equipo.categorias.reduce((n, x) => n + x.cantidad, 0) : 0;

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
          <ResumenTarjeta
            icono="ticket"
            titulo="Presupuestos y precios"
            texto={cuantosAbiertos > 0 ? `${plural(cuantosAbiertos, 'abierto', 'abiertos')}${abiertos?.siguienteCursor ? ' o más' : ''}` : 'Armalos acá'}
            detalle={cuantosAbiertos > 0 ? 'Tu lista de precios y mano de obra' : 'Y mandalos por el chat'}
            href={RUTAS.precios.ruta}
          />
          <ResumenTarjeta
            icono="caja"
            titulo="Tu equipamiento"
            texto={herramientas > 0 ? plural(herramientas, 'herramienta', 'herramientas') : 'Qué tenés'}
            detalle={equipo && equipo.listaCompras > 0 ? `${equipo.listaCompras} para comprar` : 'Tus herramientas y dónde están'}
            href={RUTAS.equipamiento.ruta}
          />
          <ResumenTarjeta icono="regla" titulo="Herramientas del teléfono" texto="Medir y 3D" detalle="Nivel, linterna y tu oficio" href={RUTAS.tallerHerramientas.ruta} tono="noche" />
        </div>
        <AccesoAncho href={RUTA_FERRETERIA} icono="carrito" titulo="Ferretería" detalle="Catálogo y pedidos" />
      </PantallaRaiz>
      <BarraPestanas />
    </div>
  );
}
