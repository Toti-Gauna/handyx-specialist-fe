'use client';
// Paso 6 · Antecedentes en persona (lote 4.4): elegir un turno en la oficina de Operations para mostrar el certificado.
// Nunca se sube: ni foto, ni PDF, ni captura. La app solo reserva el turno; Operations registra el resultado.
import { api } from '@handyx/origen-datos';
import { useState } from 'react';
import { ErrorCaja } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { Aviso } from '../../components/ui.tsx';
import type { TurnoAntecedentes } from '../../contracts/dto.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { PRESENCIAL } from '../../lib/etiquetas.ts';
import { diaLocal, fechaCorta, fechaLarga, hora } from '../../lib/formato.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { BotonFijo, ChipOpcion } from '../../kit/Piezas.tsx';
import { MarcoPaso, type PropsPaso } from './comunes.tsx';

export function PasoAntecedentes({ perfil, recargar, alTerminar }: PropsPaso) {
  const isla = useIsla();
  const turnos = useCarga(() => api.turnosAntecedentes(), []);
  const cita = perfil.citaAntecedentes;
  const resuelta = perfil.antecedentes === 'aprobada' || perfil.antecedentes === 'no_aprobada';
  const [eligiendo, setEligiendo] = useState(!cita && !resuelta);
  const [dia, setDia] = useState<string | null>(null);
  const [turno, setTurno] = useState<TurnoAntecedentes | null>(null);
  const { pendiente, fallo, ejecutar } = useAccion();

  const lista = turnos.datos ?? [];
  const dias = [...new Set(lista.map((t) => diaLocal(t.inicio)))];
  const diaActual = dia ?? dias.find((d) => lista.some((t) => diaLocal(t.inicio) === d && t.disponible)) ?? null;
  const delDia = lista.filter((t) => diaLocal(t.inicio) === diaActual);

  async function reservar() {
    if (!turno) return;
    const r = await ejecutar(async () => {
      await api.reservarTurno(turno.id);
      await Promise.all([recargar(), turnos.recargar()]);
    });
    if (r.ok) {
      isla({ titulo: 'Turno reservado', texto: `${fechaLarga(turno.inicio)} a las ${hora(turno.inicio)}.`, icono: 'calendario', tono: 'exito' });
      setEligiendo(false);
      setTurno(null);
    } else if (r.fallo.tipo === 'conflicto') {
      setTurno(null);
      await turnos.recargar();
    }
  }

  return (
    <MarcoPaso paso="antecedentes" titulo="Antecedentes">
      <h2 className="hx-titulo al-pregunta__titulo">
        Tus antecedentes, <span className="hx-marca">en persona</span>
      </h2>
      <Aviso tono="azul" icono="escudo" titulo="No subas el certificado">
        Lo mostrás en la oficina de Operations, junto con tu DNI. <strong>No lo mandes por foto, PDF ni captura: no lo guardamos ni lo aceptamos.</strong> Solo
        registramos el resultado.
      </Aviso>

      {cita && !eligiendo ? (
        <section className="al-turno" aria-labelledby="al-turno-t">
          <h3 id="al-turno-t">Tu turno</h3>
          <p className="al-turno__cuando">
            <Icono nombre="calendario" /> {fechaLarga(cita.inicio)}, {hora(cita.inicio)} a {hora(cita.fin)}
          </p>
          <p className="al-turno__donde">
            <Icono nombre="pin" /> {cita.lugar}
          </p>
          <p className="texto-suave texto-chico">{PRESENCIAL[perfil.antecedentes].detalle}</p>
          {!resuelta ? (
            <button type="button" className="boton boton--claro boton--bloque" onClick={() => setEligiendo(true)}>
              Cambiar el turno
            </button>
          ) : null}
        </section>
      ) : null}

      {resuelta ? <p>{PRESENCIAL[perfil.antecedentes].detalle}</p> : null}

      {eligiendo && !resuelta ? (
        <section className="al-turnos" aria-labelledby="al-turnos-t">
          <h3 id="al-turnos-t">{cita ? 'Elegí otro turno' : 'Elegí un turno'}</h3>
          {turnos.fallo && !turnos.datos ? <ErrorCaja fallo={turnos.fallo} onReintentar={() => void turnos.recargar()} /> : null}
          {turnos.datos && lista.length === 0 ? <p>No hay turnos disponibles por ahora. Operations te va a contactar para coordinar uno.</p> : null}
          <ul className="hx-chips hx-chips--carril" aria-label="Días con turnos">
            {dias.map((d) => {
              const primero = lista.find((t) => diaLocal(t.inicio) === d);
              return (
                <li key={d}>
                  <ChipOpcion
                    texto={primero ? fechaCorta(primero.inicio) : d}
                    icono="calendario"
                    elegido={d === diaActual}
                    onClick={() => {
                      setDia(d);
                      setTurno(null);
                    }}
                  />
                </li>
              );
            })}
          </ul>
          <ul className="al-horas" aria-label="Horarios del día">
            {delDia.map((t) => (
              <li key={t.id}>
                <button type="button" className="hx-chip" aria-pressed={turno?.id === t.id} disabled={!t.disponible} onClick={() => setTurno(t)}>
                  {hora(t.inicio)}
                  {t.disponible ? null : <span className="al-ocupado"> · ocupado</span>}
                </button>
              </li>
            ))}
          </ul>
          {delDia[0] ? (
            <p className="al-turno__donde texto-chico">
              <Icono nombre="pin" /> {delDia[0].lugar}
            </p>
          ) : null}
        </section>
      ) : null}

      {fallo ? <ErrorCaja fallo={fallo} /> : null}
      <BotonFijo nota={eligiendo && !resuelta ? 'Si ninguno te queda bien, Operations te contacta para coordinar otro.' : undefined}>
        {eligiendo && !resuelta ? (
          <button type="button" className="boton boton--bloque" disabled={!turno || pendiente} onClick={() => void reservar()}>
            {pendiente ? 'Reservando…' : turno ? `Reservar el ${fechaCorta(turno.inicio)} a las ${hora(turno.inicio)}` : 'Elegí un horario'}
          </button>
        ) : (
          <button type="button" className="boton boton--bloque" onClick={alTerminar}>
            Listo
          </button>
        )}
      </BotonFijo>
    </MarcoPaso>
  );
}
