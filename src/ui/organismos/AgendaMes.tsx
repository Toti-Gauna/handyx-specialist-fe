'use client';
// El mes completo de la agenda (F-AgendaMes): cada día lleva una barrita por obra, una amarilla si hay trabajos y una gris
// si ya se hizo. El color solo apoya: cada día dice en su nombre qué tiene y la leyenda lo escribe. Elegir un día muestra
// sus turnos abajo (nunca depende de arrastrar).
import type { AgendaMes } from '../../contracts/agenda.ts';
import { Icono } from '../atomos/Icono.tsx';
import { BotonIcono } from '../atomos/Boton.tsx';
import { grillaLunes, moverMes, NOMBRES_MES } from '../logica.ts';
import '../taller-dia.css';

const CABECERA = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['M', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
] as const;

/** Una obra por color (azul y noche), en el orden en que aparecen en el mes. */
export const COLORES_OBRA = ['azul', 'noche'] as const;

type DiaMes = AgendaMes['dias'][number];

export function CalendarioObras({
  anio,
  mes,
  hoy,
  valor,
  dias,
  obras,
  onElegir,
  onMes,
  subtitulo,
}: {
  anio: number;
  /** 1 a 12. */
  mes: number;
  hoy: string;
  valor: string | null;
  dias: readonly DiaMes[];
  /** Las obras del mes en orden (cada una tiene su barrita). */
  obras: readonly { obraId: string; nombre: string }[];
  onElegir(fecha: string): void;
  onMes(anio: number, mes: number): void;
  subtitulo?: string;
}) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const cambiar = (d: number) => {
    const m = moverMes(anio, mes, d);
    onMes(m.anio, m.mes);
  };
  const nombreMes = `${NOMBRES_MES[mes - 1]} ${anio}`;
  return (
    <div className="ui-agmes">
      <div className="ui-agmes__cabecera">
        <BotonIcono icono="izquierda" etiqueta="Mes anterior" onClick={() => cambiar(-1)} />
        <span className="ui-agmes__mes">
          <strong aria-live="polite">{nombreMes}</strong>
          {subtitulo ? <span>{subtitulo}</span> : null}
        </span>
        <BotonIcono icono="derecha" etiqueta="Mes siguiente" onClick={() => cambiar(1)} />
      </div>
      <div className="ui-agmes__grilla" role="group" aria-label={nombreMes}>
        {CABECERA.map(([c, largo]) => (
          <abbr key={largo} title={largo} className="ui-agmes__semana">
            {c}
          </abbr>
        ))}
        {grillaLunes(anio, mes).map((c, i) => {
          if (!c.fecha || !c.dia) return <span key={`h${i}`} />;
          const d = porFecha.get(c.fecha);
          const barras: Array<{ clave: string; tipo: string }> = [];
          for (const o of d?.obras ?? [])
            barras.push({
              clave: o.obraId,
              tipo:
                COLORES_OBRA[
                  Math.max(
                    0,
                    obras.findIndex((x) => x.obraId === o.obraId),
                  ) % COLORES_OBRA.length
                ] ?? 'azul',
            });
          if (d && d.trabajos > 0) barras.push({ clave: 'trabajos', tipo: 'amarillo' });
          if (d && d.hechos > 0) barras.push({ clave: 'hechos', tipo: 'gris' });
          const partes = [`${c.dia} de ${NOMBRES_MES[mes - 1]}`];
          if (c.fecha === hoy) partes.push('hoy');
          if (d) {
            for (const o of d.obras) partes.push(`obra ${o.nombre}`);
            if (d.trabajos > 0) partes.push(d.trabajos === 1 ? '1 trabajo' : `${d.trabajos} trabajos`);
            if (d.hechos > 0) partes.push(d.hechos === 1 ? '1 hecho' : `${d.hechos} hechos`);
          } else partes.push('sin nada');
          const clases = ['ui-agmes__dia', c.fecha === valor ? 'ui-agmes__dia--on' : '', c.fecha === hoy ? 'ui-agmes__dia--hoy' : '', c.fecha < hoy ? 'ui-agmes__dia--pasado' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <button key={c.fecha} type="button" className={clases} aria-pressed={c.fecha === valor} aria-label={partes.join(', ')} onClick={() => onElegir(c.fecha as string)}>
              <span className="ui-agmes__num">{c.dia}</span>
              <span className="ui-agmes__barras" aria-hidden="true">
                {barras.map((b) => (
                  <span key={b.clave} className={`ui-agmes__barra ui-agmes__barra--${b.tipo}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="ui-agmes__leyenda" aria-label="Qué significa cada barrita">
        {obras.map((o, i) => (
          <li key={o.obraId}>
            <span className={`ui-agmes__muestra ui-agmes__barra--${COLORES_OBRA[i % COLORES_OBRA.length]}`} aria-hidden="true" />
            Obra: {o.nombre}
          </li>
        ))}
        <li>
          <span className="ui-agmes__muestra ui-agmes__barra--amarillo" aria-hidden="true" />
          Trabajos
        </li>
        <li>
          <span className="ui-agmes__muestra ui-agmes__barra--gris" aria-hidden="true" />
          Hechos
        </li>
      </ul>
    </div>
  );
}

/** Para el título de una pestaña vacía del mes. */
export function MesVacio() {
  return (
    <p className="ui-nota">
      <Icono nombre="agenda" tam="chico" /> Este mes no tenés trabajos ni obras agendadas.
    </p>
  );
}
