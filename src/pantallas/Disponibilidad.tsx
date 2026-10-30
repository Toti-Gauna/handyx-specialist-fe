'use client';
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { ControlDisponibilidad } from '../components/ControlDisponibilidad.tsx';
import { Cargando, ErrorCaja } from '../components/Estados.tsx';
import { usePerfil } from '../components/GuardiaApp.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Tarjeta } from '../components/ui.tsx';
import type { Disponibilidad as Disp } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { DIAS, ZONAS } from '../lib/etiquetas.ts';

type Franjas = Record<number, { activo: boolean; desde: string; hasta: string }>;

const aFranjas = (d: Disp): Franjas =>
  Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((dia) => {
    const f = d.franjas.find((x) => x.dia === dia);
    return [dia, { activo: !!f, desde: f?.desde ?? '08:00', hasta: f?.hasta ?? '17:00' }];
  }));

export function Disponibilidad() {
  const { perfil } = usePerfil();
  const c = useCarga(() => api.disponibilidad(), []);
  const habilitada = perfil.estadoAlta === 'habilitada';
  const guardado = useAccion();
  const [franjas, setFranjas] = useState<Franjas | null>(null);
  const [zonas, setZonas] = useState<string[]>([]);
  const [errores, setErrores] = useState<Record<number, string>>({});
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (c.datos) {
      setFranjas(aFranjas(c.datos));
      setZonas(c.datos.zonas);
    }
  }, [c.datos]);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos || !franjas) return <Cargando />;
  const d = c.datos;
  const habilitados = perfil.rubros.filter((r) => r.estado === 'habilitado');

  async function guardar() {
    if (!franjas) return;
    const err: Record<number, string> = {};
    const lista = Object.entries(franjas)
      .filter(([, f]) => f.activo)
      .map(([dia, f]) => {
        if (f.desde >= f.hasta) err[Number(dia)] = 'La hora de inicio tiene que ser anterior a la de fin.';
        return { dia: Number(dia), desde: f.desde, hasta: f.hasta };
      });
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const r = await guardado.ejecutar(async () => {
      await api.actualizarDisponibilidad({ urgentesAhora: d.urgentesAhora, programados: d.programados, franjas: lista, zonas, version: d.version });
      await c.recargar();
    });
    setOk(r.ok);
  }

  return (
    <div className="pila">
      <Volver a={RUTAS.cuenta.ruta} texto="Cuenta" />
      <h1 className="titulo">Tu disponibilidad</h1>
      <p className="texto-suave">Declarás cuándo y dónde querés recibir pedidos. No tenés obligación de aceptar ninguno y no te asignamos trabajos.</p>
      {!habilitada ? (
        <Aviso tono="aviso" icono="alerta" titulo="Todavía no podés declarar disponibilidad">
          Se habilita cuando tu alta esté habilitada. <Link href={RUTAS.alta.ruta}>Ver mi alta</Link>.
        </Aviso>
      ) : null}
      <Tarjeta>
        <ControlDisponibilidad disp={d} bloqueado={!habilitada} alCambiar={() => c.recargar()} />
        <p className="texto-suave texto-chico">Los pedidos urgentes (“Ahora”) y los programados se avisan por separado. Apagar “Ahora” corta la oferta de urgentes en el momento.</p>
      </Tarjeta>

      <Tarjeta>
        <p className="tarjeta__titulo">Rubros habilitados</p>
        {habilitados.length > 0 ? <p>{habilitados.map((r) => NOMBRE_RUBRO[r.rubro]).join(', ')}</p> : <p className="texto-suave">Ninguno todavía.</p>}
        {perfil.rubros.some((r) => r.estado === 'requiere_matricula') ? (
          <Aviso tono="aviso" icono="alerta">
            Un rubro no está habilitado porque falta verificar la matrícula o certificación. No recibís pedidos de ese rubro.
          </Aviso>
        ) : null}
      </Tarjeta>

      <fieldset disabled={!habilitada} className="pila">
        <legend>Zonas que cubrís</legend>
        <div className="opciones">
          {ZONAS.map((z) => (
            <div className="opcion" key={z}>
              <input id={`zona-${z}`} type="checkbox" checked={zonas.includes(z)} onChange={(e) => setZonas((x) => (e.target.checked ? [...x, z] : x.filter((y) => y !== z)))} />
              <label htmlFor={`zona-${z}`}>{z}</label>
            </div>
          ))}
        </div>
        <p className="texto-suave texto-chico">Solo ves pedidos de las zonas que marques. No usamos tu ubicación del teléfono para esto.</p>
      </fieldset>

      <fieldset disabled={!habilitada} className="pila">
        <legend>Días y horarios para pedidos programados</legend>
        {DIAS.map((nombre, dia) => {
          const f = franjas[dia];
          if (!f) return null;
          return (
            <div key={dia} className="tarjeta">
              <div className="opcion opcion--plana">
                <input id={`dia-${dia}`} type="checkbox" checked={f.activo} onChange={(e) => setFranjas({ ...franjas, [dia]: { ...f, activo: e.target.checked } })} />
                <label htmlFor={`dia-${dia}`}>{nombre}</label>
              </div>
              {f.activo ? (
                <div className="botones botones--fila">
                  <div className="campo">
                    <label htmlFor={`desde-${dia}`}>Desde</label>
                    <input id={`desde-${dia}`} type="time" value={f.desde} onChange={(e) => setFranjas({ ...franjas, [dia]: { ...f, desde: e.target.value } })} />
                  </div>
                  <div className="campo">
                    <label htmlFor={`hasta-${dia}`}>Hasta</label>
                    <input id={`hasta-${dia}`} type="time" value={f.hasta} onChange={(e) => setFranjas({ ...franjas, [dia]: { ...f, hasta: e.target.value } })} />
                  </div>
                </div>
              ) : null}
              {errores[dia] ? <p className="campo__error">{errores[dia]}</p> : null}
            </div>
          );
        })}
        <p className="texto-suave texto-chico">Las franjas son una declaración tuya: nunca te imponemos un horario ni deducimos que estás disponible porque tengas la app abierta.</p>
      </fieldset>

      {guardado.fallo ? <ErrorCaja fallo={guardado.fallo} onReintentar={() => void guardar()} /> : null}
      {ok && !guardado.fallo ? (
        <Aviso tono="exito" icono="checkCirculo" role="status">
          Guardamos tu disponibilidad.
        </Aviso>
      ) : null}
      <button type="button" className="boton boton--bloque" disabled={!habilitada || guardado.pendiente} onClick={() => void guardar()}>
        {guardado.pendiente ? 'Guardando…' : 'Guardar zonas y horarios'}
      </button>
    </div>
  );
}
