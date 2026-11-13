'use client';
// Cambiar la fecha (lote 4.6): motivo en chips, tira de días y franja. Queda como pedido pendiente: el acuerdo sigue
// igual hasta que el cliente acepte, y el motivo se le muestra junto con la fecha nueva.
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja, Vacio } from '../../components/Estados.tsx';
import { Icono } from '../../components/Icono.tsx';
import { ChipTipo } from '../../components/ui.tsx';
import { MOTIVOS_CAMBIO, type MotivoCambio, type TrabajoDetalle } from '../../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { diaLocal, fechaHora, fechaLarga, hora } from '../../lib/formato.ts';
import { FRANJAS, horarioFranja, MOTIVO_CAMBIO, type Franja } from '../../lib/trabajo.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { TiraDias } from '../../kit/Fechas.tsx';
import { BarraSuperior } from '../../kit/Navegacion.tsx';
import { BotonFijo, ChipOpcion } from '../../kit/Piezas.tsx';

const DIA_MS = 86_400_000;

export function CambiarFecha() {
  const id = useIdDeUrl();
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id]);
  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo mover"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos) return <Cargando />;
  return <Formulario detalle={c.datos} />;
}

function Formulario({ detalle: d }: { detalle: TrabajoDetalle }) {
  const router = useRouter();
  const isla = useIsla();
  const t = d.trabajo;
  const volver = `${RUTAS.trabajo.ruta}?id=${t.id}`;
  const hoy = diaLocal(api.ahora().toISOString());
  const manana = diaLocal(new Date(api.ahora().getTime() + DIA_MS).toISOString());
  const [motivo, setMotivo] = useState<MotivoCambio | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [franja, setFranja] = useState<Franja | null>(null);
  const [errores, setErrores] = useState<{ motivo?: string; cuando?: string }>({});
  const { pendiente, fallo, ejecutar, clave } = useAccion();
  const horario = dia && franja ? horarioFranja(dia, franja) : null;

  if (d.cambioPendiente || !['agendado', 'en_camino', 'en_sitio'].includes(t.estado)) {
    return (
      <div className="fl-pantalla">
        <BarraSuperior titulo="Cambiar la fecha" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
        <Vacio icono="calendario" titulo={d.cambioPendiente ? 'Ya hay un cambio esperando respuesta' : 'Este trabajo ya no admite cambios de fecha'}>
          <Link href={volver}>Volver al trabajo</Link>
        </Vacio>
      </div>
    );
  }

  async function enviar() {
    const err: typeof errores = {};
    if (!motivo) err.motivo = 'Elegí el motivo: el cliente lo ve.';
    if (!horario) err.cuando = 'Elegí el día y la franja.';
    else if (Date.parse(horario.inicio) <= api.ahora().getTime()) err.cuando = 'Elegí un día y una franja a futuro.';
    setErrores(err);
    if (Object.keys(err).length > 0 || !horario) {
      document.querySelector<HTMLElement>(err.motivo ? '#cf-motivo' : '#cf-cuando')?.focus();
      return;
    }
    const r = await ejecutar(() => api.proponerCambio(t.id, { horario, alcance: t.acuerdo.alcance, monto: null, motivo }, clave()));
    if (r.ok) {
      isla({ titulo: 'Le pediste el cambio al cliente', texto: 'Hasta que acepte, sigue valiendo la fecha acordada.', icono: 'calendario', tono: 'exito' });
      router.replace(volver);
    }
  }

  return (
    <div className="fl-pantalla">
      <BarraSuperior titulo="Cambiar la fecha" atras={volver} textoAtras="Volver al trabajo" acciones={null} />
      <div className="fl-ficha">
        <ChipTipo tipo={t.tipo} />
        <p className="fl-ficha__titulo">{NOMBRE_RUBRO[t.rubro]}</p>
        <p className="fl-ficha__linea">
          <Icono nombre="calendario" /> Acordado: {fechaHora(t.acuerdo.horario.inicio)} con {d.contraparte}
        </p>
      </div>

      <section className="fl-bloque" aria-labelledby="cf-motivo">
        <h2 id="cf-motivo" className="fl-bloque__titulo" tabIndex={-1}>
          ¿Por qué la cambiás?
        </h2>
        <ul className="hx-chips" aria-label="Motivo">
          {MOTIVOS_CAMBIO.map((m) => (
            <li key={m}>
              <ChipOpcion
                texto={MOTIVO_CAMBIO[m]}
                elegido={motivo === m}
                onClick={() => {
                  setMotivo(m);
                  setErrores((e) => ({ ...e, motivo: undefined }));
                }}
              />
            </li>
          ))}
        </ul>
        {errores.motivo ? (
          <p className="campo__error" role="alert">
            <Icono nombre="alerta" /> {errores.motivo}
          </p>
        ) : null}
      </section>

      <section className="fl-bloque" aria-labelledby="cf-cuando">
        <h2 id="cf-cuando" className="fl-bloque__titulo" tabIndex={-1}>
          ¿Cuándo podés?
        </h2>
        <TiraDias
          desde={hoy}
          hoy={hoy}
          cuantos={21}
          minimo={manana}
          elegido={dia}
          onElegir={(x) => {
            setDia(x);
            setErrores((e) => ({ ...e, cuando: undefined }));
          }}
          etiqueta="Elegí el día"
        />
        <ul className="hx-chips" aria-label="Franja horaria">
          {FRANJAS.map((f) => (
            <li key={f.id}>
              <ChipOpcion
                texto={f.texto}
                icono="reloj"
                elegido={franja === f.id}
                onClick={() => {
                  setFranja(f.id);
                  setErrores((e) => ({ ...e, cuando: undefined }));
                }}
              />
            </li>
          ))}
        </ul>
        {horario ? (
          <p className="tr-resumen" role="status">
            Le proponés el <strong>{fechaLarga(horario.inicio)}</strong>, de {hora(horario.inicio)} a {hora(horario.fin)}.
          </p>
        ) : null}
        {errores.cuando ? (
          <p className="campo__error" role="alert">
            <Icono nombre="alerta" /> {errores.cuando}
          </p>
        ) : null}
      </section>

      {fallo ? <ErrorCaja fallo={fallo} onReintentar={() => void enviar()} /> : null}
      <BotonFijo nota="Queda como pedido: hasta que el cliente acepte, sigue valiendo la fecha acordada.">
        <button type="button" className="boton boton--bloque" disabled={pendiente} onClick={() => void enviar()}>
          {pendiente ? 'Enviando…' : 'Pedir el cambio'}
        </button>
      </BotonFijo>
    </div>
  );
}
