'use client';
// Resumen de la obra (lote 4.7), dentro del trabajo: anillo de avance (etapas hechas de las totales), la próxima jornada,
// lo acordado, lo cobrado y lo que falta, y los accesos al plan, las jornadas, el diario y los adicionales.
import { api } from '@handyx/origen-datos';
import { RUTAS } from '../../app/rutas.ts';
import type { TrabajoDetalle } from '../../contracts/dto.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { diaLocal, fechaLarga, hora, pesosDesdeCentavos, plural } from '../../lib/formato.ts';
import { avanceObra, etapaEnCurso, montosObra, proximaJornada } from '../../lib/obra.ts';
import { AnilloProgreso, Fila } from '../../kit/Piezas.tsx';
import './obra.css';

export function ResumenObra({ detalle: d }: { detalle: TrabajoDetalle }) {
  const pagos = useCarga(() => api.pagos(), []);
  const t = d.trabajo;
  const q = `?id=${t.id}`;
  const avance = avanceObra(d.etapas);
  const enCurso = etapaEnCurso(d.etapas);
  const proxima = proximaJornada(d.jornadas, api.ahora());
  const etapaProxima = proxima ? d.etapas.find((e) => e.id === proxima.etapaId) : undefined;
  const esHoy = proxima !== null && diaLocal(proxima.horario.inicio) === diaLocal(api.ahora().toISOString());
  const m = pagos.datos ? montosObra(d, pagos.datos.items) : null;
  const pendientes = d.adicionales.filter((a) => a.estado === 'pendiente').length;

  return (
    <section className="ob-resumen" aria-labelledby="ob-resumen-t">
      <h2 id="ob-resumen-t" className="visualmente-oculto">
        Resumen de la obra
      </h2>
      <div className="ob-resumen__cabeza">
        <AnilloProgreso hechos={avance.hechas} total={avance.total} etiqueta={avance.total === 1 ? 'etapa' : 'etapas'} />
        <div className="ob-resumen__texto">
          <p className="ob-resumen__etapa">{enCurso ? `Etapa ${enCurso.orden}: ${enCurso.nombre}` : avance.hechas === avance.total ? 'Todas las etapas terminadas' : 'Todavía no empezó'}</p>
          {proxima ? (
            <p className="ob-resumen__proxima">
              {esHoy ? 'Jornada de hoy' : 'Próxima jornada'}: <strong>{esHoy ? 'hoy' : fechaLarga(proxima.horario.inicio)}</strong>, de {hora(proxima.horario.inicio)}
              {proxima.horario.fin ? ` a ${hora(proxima.horario.fin)}` : ''}
              {etapaProxima ? ` · ${etapaProxima.nombre}` : ''}
              {proxima.cambioPendiente ? ' · pediste otro día' : ''}
            </p>
          ) : (
            <p className="ob-resumen__proxima">No quedan jornadas por delante.</p>
          )}
        </div>
      </div>

      <ul className="ob-montos" aria-label="Plata de la obra">
        <li>
          <span className="ob-montos__dato">{pesosDesdeCentavos(d.totalVigente.centavos)}</span>
          <span>Acordado</span>
          <small>con los adicionales aceptados</small>
        </li>
        <li>
          <span className="ob-montos__dato">{m ? pesosDesdeCentavos(m.verificado + m.informado) : '…'}</span>
          <span>Cobrado</span>
          <small>{m ? `${pesosDesdeCentavos(m.verificado)} verificado` : 'cargando'}</small>
        </li>
        <li>
          <span className="ob-montos__dato">{m ? pesosDesdeCentavos(m.falta) : '…'}</span>
          <span>Falta cobrar</span>
          <small>cada etapa por separado</small>
        </li>
      </ul>

      <div className="tr-filas">
        <Fila icono="maletin" titulo="Plan de obra" detalle={`${plural(d.etapas.length, 'etapa', 'etapas')} con su importe y su cobro`} href={`${RUTAS.obraPlan.ruta}${q}`} />
        <Fila icono="calendario" titulo="Jornadas" detalle={`${plural(d.jornadas.length, 'día de trabajo', 'días de trabajo')} en el calendario`} href={`${RUTAS.obraJornadas.ruta}${q}`} />
        <Fila icono="imagen" titulo="Diario de obra" detalle={d.diario.length ? `${plural(d.diario.length, 'avance', 'avances')} con fotos que ve el cliente` : 'Contale al cliente cómo va cada día'} href={`${RUTAS.obraDiario.ruta}${q}`} />
        {t.estado === 'en_curso' && enCurso ? (
          <Fila icono="mas" titulo="Adicionales" detalle={pendientes ? `${plural(pendientes, 'espera', 'esperan')} al cliente` : `Repuestos o mano de obra en la etapa ${enCurso.orden}`} href={`${RUTAS.trabajoAdicional.ruta}${q}&etapa=${enCurso.id}`} />
        ) : null}
      </div>
      {pagos.fallo ? <p className="texto-suave texto-chico">No pudimos traer los cobros: los vas a ver en la Caja.</p> : null}
    </section>
  );
}
