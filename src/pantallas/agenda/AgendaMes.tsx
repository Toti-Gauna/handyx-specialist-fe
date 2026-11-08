'use client';
// F-AgendaMes (lote 2.1): el mes completo con una barrita por obra, por trabajos y por lo hecho, y los turnos del día elegido.
// Se puede filtrar (todo, obras, trabajos) y volver a hoy con un botón. Nada depende de arrastrar.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import { useCarga } from '../../hooks/useCarga.ts';
import type { FiltroMes } from '../../data/api/agenda.ts';
import { diaConNumero, mesDe } from '../../lib/agendaTaller.ts';
import { diaLocal, hora } from '../../lib/formato.ts';
import { Boton, BotonIconoEnlace } from '../../ui/atomos/Boton.tsx';
import { Etiqueta } from '../../ui/atomos/Texto.tsx';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { CalendarioObras } from '../../ui/organismos/AgendaMes.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { destinoTurno, Fallo } from './piezas.tsx';

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export function AgendaMes() {
  const hoy = diaLocal(api.ahora().toISOString());
  const [mes, setMes] = useState(mesDe(hoy));
  const [elegido, setElegido] = useState(hoy);
  const [filtro, setFiltro] = useState<FiltroMes>('todo');
  const c = useCarga(() => api.agendaMes(mes, filtro), [mes, filtro]);
  const dia = useCarga(() => api.turnosDelDia(elegido), [elegido]);
  const [anio, nMes] = mes.split('-').map(Number) as [number, number];

  const barra = (
    <BarraCompacta titulo="Agenda" subtitulo="Mes completo" hrefVolver={RUTAS.agenda.ruta} accion={<BotonIconoEnlace icono="lista" etiqueta="Ver como lista" href={RUTAS.agenda.ruta} />} />
  );
  if (c.fallo && !c.datos) return <Fallo fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;

  const obras = [...new Map(c.datos.dias.flatMap((d) => d.obras).map((o) => [o.obraId, o])).values()];
  const resumen = `${plural(c.datos.totales.trabajos, 'trabajo', 'trabajos')} · ${plural(c.datos.totales.obras, 'obra', 'obras')}`;
  const turnos = (dia.datos ?? []).filter((t) => filtro === 'todo' || (filtro === 'obras' ? t.tipo === 'jornada' : t.tipo !== 'jornada'));

  return (
    <PantallaSecundaria barra={barra}>
      <CalendarioObras
        anio={anio}
        mes={nMes}
        hoy={hoy}
        valor={elegido}
        dias={c.datos.dias}
        obras={obras}
        subtitulo={resumen}
        onElegir={setElegido}
        onMes={(a, m) => {
          const nuevo = `${a}-${String(m).padStart(2, '0')}`;
          setMes(nuevo);
          setElegido(nuevo === mesDe(hoy) ? hoy : `${nuevo}-01`);
        }}
      />
      <div className="ui-ag-filtros">
        <Segmento<FiltroMes>
          etiqueta="Qué mostrar en el mes"
          valor={filtro}
          onCambio={setFiltro}
          opciones={[
            { valor: 'todo', texto: 'Todo' },
            { valor: 'obras', texto: 'Obras' },
            { valor: 'trabajos', texto: 'Trabajos' },
          ]}
        />
        <Boton
          variante="amarilla"
          chico
          icono="reloj"
          disabled={elegido === hoy && mes === mesDe(hoy)}
          onClick={() => {
            setMes(mesDe(hoy));
            setElegido(hoy);
          }}
        >
          Ir a hoy
        </Boton>
      </div>
      <Tarjeta etiqueta={`Turnos del ${diaConNumero(elegido)}`}>
        <section className="ui-ag-grupo" aria-live="polite">
          <Etiqueta como="h2">{diaConNumero(elegido)}</Etiqueta>
          {dia.fallo && !dia.datos ? <ErrorCaja fallo={dia.fallo} onReintentar={() => void dia.recargar()} /> : null}
          {dia.datos && turnos.length === 0 ? <p className="ui-nota">No tenés nada este día.</p> : null}
          {turnos.map((t) => (
            <FilaIcono
              key={t.id}
              icono={t.tipo === 'jornada' ? 'obra' : t.rubro === 'electricidad' ? 'rayo' : 'herramienta'}
              titulo={`${hora(t.inicio)}${t.fin ? ` a ${hora(t.fin)}` : ''} · ${t.titulo}`}
              detalle={[t.tipo === 'jornada' ? t.detalle.split(' · ').slice(0, 2).join(' · ') : t.detalle, t.cliente?.nombre].filter(Boolean).join(' · ')}
              href={destinoTurno(t)}
              borde={false}
            />
          ))}
        </section>
      </Tarjeta>
    </PantallaSecundaria>
  );
}
