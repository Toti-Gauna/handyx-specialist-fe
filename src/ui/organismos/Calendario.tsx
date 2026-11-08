'use client';
// Calendario de un mes (lienzo: semana de lunes a domingo). Hoy con borde naranja, el elegido en azul con base, los
// días con trabajo con un punto y los pasados apagados; cada día dice todo eso en su nombre accesible.
import { BotonIcono } from '../atomos/Boton.tsx';
import { grillaLunes, moverMes, NOMBRES_MES } from '../logica.ts';

const CABECERA = [
  ['L', 'lunes'],
  ['M', 'martes'],
  ['M', 'miércoles'],
  ['J', 'jueves'],
  ['V', 'viernes'],
  ['S', 'sábado'],
  ['D', 'domingo'],
] as const;

export function Calendario({
  anio,
  mes,
  hoy,
  valor,
  onElegir,
  onMes,
  conTrabajo = [],
  desde,
}: {
  anio: number;
  /** 1 a 12. */
  mes: number;
  hoy: string;
  valor: string | null;
  onElegir(fecha: string): void;
  onMes(anio: number, mes: number): void;
  conTrabajo?: readonly string[];
  /** Antes de esta fecha no se puede elegir (por defecto, hoy). */
  desde?: string;
}) {
  const minimo = desde ?? hoy;
  const celdas = grillaLunes(anio, mes);
  const cambiar = (d: number) => {
    const m = moverMes(anio, mes, d);
    onMes(m.anio, m.mes);
  };
  const nombreMes = `${NOMBRES_MES[mes - 1]} ${anio}`;
  return (
    <div className="ui-calendario">
      <div className="ui-calendario__cabecera">
        <BotonIcono icono="izquierda" etiqueta="Mes anterior" onClick={() => cambiar(-1)} />
        <strong aria-live="polite">{nombreMes}</strong>
        <BotonIcono icono="derecha" etiqueta="Mes siguiente" onClick={() => cambiar(1)} />
      </div>
      <div className="ui-calendario__grilla" role="group" aria-label={nombreMes}>
        {CABECERA.map(([c, largo]) => (
          <abbr key={largo} title={largo} className="ui-calendario__dia-semana">
            {c}
          </abbr>
        ))}
        {celdas.map((c, i) => {
          if (!c.fecha || !c.dia) return <span key={`h${i}`} />;
          const pasado = c.fecha < minimo;
          const trabajo = conTrabajo.includes(c.fecha);
          const clases = ['ui-calendario__dia', c.fecha === valor ? 'ui-calendario__dia--on' : '', c.fecha === hoy ? 'ui-calendario__dia--hoy' : '', pasado ? 'ui-calendario__dia--pasado' : ''].filter(Boolean).join(' ');
          return (
            <button
              key={c.fecha}
              type="button"
              className={clases}
              disabled={pasado}
              aria-pressed={c.fecha === valor}
              aria-label={`${c.dia} de ${NOMBRES_MES[mes - 1]}${c.fecha === hoy ? ', hoy' : ''}${trabajo ? ', con trabajo' : ''}`}
              onClick={() => onElegir(c.fecha as string)}
            >
              {c.dia}
              {trabajo ? <span className="ui-calendario__punto" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
