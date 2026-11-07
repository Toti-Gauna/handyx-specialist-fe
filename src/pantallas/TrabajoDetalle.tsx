'use client';
// Trabajo acordado (lote 4.6): el cliente, la dirección exacta con el mapa y "Cómo llegar", chat y llamada a través de la
// app (sin mostrar teléfonos), una acción principal por estado, el trabajo en curso con cronómetro y adicionales, y los
// accesos a cambiar la fecha, reclamar o cancelar. Ningún paso se da solo, salvo la llegada (geocerca, con la app abierta).
import { api } from '@handyx/origen-datos';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RUTAS } from '../app/rutas.ts';
import { AccionTrabajo } from '../components/AccionTrabajo.tsx';
import { Cargando, ErrorCaja, Vacio } from '../components/Estados.tsx';
import { Hoja } from '../components/Hoja.tsx';
import { Icono } from '../components/Icono.tsx';
import { TarjetaPropuesta } from '../components/TarjetaPropuesta.tsx';
import { Volver } from '../components/Volver.tsx';
import { Aviso, Chip, ChipTipo, Seccion, Tarjeta } from '../components/ui.tsx';
import type { Adicional, LlamadaPuente, TrabajoDetalle as Detalle } from '../contracts/dto.ts';
import { NOMBRE_RUBRO } from '../contracts/rubros.ts';
import { useAccion } from '../hooks/useAccion.ts';
import { useAhora } from '../hooks/useAhora.ts';
import { useCarga } from '../hooks/useCarga.ts';
import { useIdDeUrl } from '../hooks/useIdDeUrl.ts';
import { TRABAJO } from '../lib/etiquetas.ts';
import { fechaHora, hora, pesos } from '../lib/formato.ts';
import { enlacesNavegacion } from '../lib/geo.ts';
import { cronometro, inicioEnCurso, textoLlegada, TIPO_ADICIONAL } from '../lib/trabajo.ts';
import { useIsla } from '../kit/Efectos.tsx';
import { Fila } from '../kit/Piezas.tsx';
import { Mapa } from '../mapa/Mapa.tsx';
import { ResumenObra } from './obra/ResumenObra.tsx';
import './trabajo/trabajo.css';

const ACTIVO = ['agendado', 'en_camino', 'en_sitio', 'en_curso'];
const ACTOR = { especialista: 'Vos', usuario: 'El cliente', operations: 'Handyx', sistema: 'La app' } as const;
const ADICIONAL: Record<Adicional['estado'], { texto: string; tono: 'azul' | 'exito' | 'neutro'; icono: 'reloj' | 'checkCirculo' | 'cerrar' }> = {
  pendiente: { texto: 'Esperando al cliente', tono: 'azul', icono: 'reloj' },
  aceptado: { texto: 'Aceptado', tono: 'exito', icono: 'checkCirculo' },
  rechazado: { texto: 'No lo aceptó', tono: 'neutro', icono: 'cerrar' },
  retirado: { texto: 'Retirado', tono: 'neutro', icono: 'cerrar' },
};

export function TrabajoDetalle() {
  const id = useIdDeUrl();
  const router = useRouter();
  // Mientras algo espera al cliente (un adicional o un cambio), se vuelve a consultar cada 15 s.
  const [vigilar, setVigilar] = useState(false);
  const c = useCarga(() => (id ? api.trabajo(id) : Promise.resolve(null)), [id], { cadaMs: vigilar ? 15_000 : 0 });
  const datos = c.datos;
  useEffect(() => setVigilar(!!datos && (datos.adicionales.some((a) => a.estado === 'pendiente') || datos.cambioPendiente !== null)), [datos]);

  if (!id) return <Vacio icono="maletin" titulo="No indicaste qué trabajo abrir"><Link href={RUTAS.trabajos.ruta}>Ver mis trabajos</Link></Vacio>;
  if (c.fallo && !c.datos) {
    return (
      <div className="pila">
        <Volver a={RUTAS.trabajos.ruta} texto="Mis trabajos" />
        {c.fallo.tipo === 'no_encontrado' ? <Vacio icono="maletin" titulo="No encontramos ese trabajo" /> : <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} />}
      </div>
    );
  }
  if (!c.datos) return <Cargando />;
  const d = c.datos;
  const { trabajo: t, contraparte, eventos, cambioPendiente } = d;
  const activo = ACTIVO.includes(t.estado);
  const conAdicionales = d.totalVigente.centavos !== t.acuerdo.monto.centavos;
  const q = `?id=${t.id}`;

  return (
    <div className="pila tr">
      <Volver a={RUTAS.trabajos.ruta} texto="Mis trabajos" />
      {c.fallo ? <ErrorCaja fallo={c.fallo} onReintentar={() => void c.recargar()} /> : null}

      <Tarjeta tono="gris" className="tr-hero">
        <div className="fila-flex fila-flex--entre">
          <ChipTipo tipo={t.tipo} />
          <Chip e={TRABAJO[t.estado]} />
        </div>
        <h1 className="titulo">{NOMBRE_RUBRO[t.rubro]}</h1>
        <p className="tr-hero__cliente">{contraparte}</p>
        <p className="tr-hero__linea">
          <Icono nombre="calendario" /> {fechaHora(t.acuerdo.horario.inicio)}
          {t.acuerdo.horario.fin ? ` a ${hora(t.acuerdo.horario.fin)}` : ''}
        </p>
        <p className="monto">{pesos(d.totalVigente)}</p>
        {conAdicionales ? <p className="texto-suave texto-chico">Incluye los adicionales que aceptó el cliente.</p> : null}
      </Tarjeta>

      {activo ? <Contacto trabajoId={t.id} conversacionId={t.conversacionId} contraparte={contraparte} /> : null}

      <PanelEstado detalle={d} recargar={c.recargar} alSalir={() => router.push(`${RUTAS.enCamino.ruta}${q}`)} alTerminar={() => router.push(`${RUTAS.trabajoTerminado.ruta}${q}`)} />
      {t.tipo === 'obra' && t.estado !== 'cancelado' ? <ResumenObra detalle={d} /> : null}

      {activo && t.destino ? (
        <Seccion titulo="Cómo llegar">
          <p className="tr-direccion">
            <Icono nombre="pin" /> {t.direccion}
          </p>
          <Mapa etiqueta={`Destino del trabajo: ${t.direccion ?? 'dirección del trabajo'}`} alto="chico" destino={t.destino} alternativa={<p>{t.direccion}</p>} />
          <div className="hx-mapa-atajos" role="group" aria-label="Cómo llegar con otra app">
            <a className="boton boton--claro" href={enlacesNavegacion(t.destino).google} target="_blank" rel="noopener noreferrer">
              Google Maps<span className="visualmente-oculto"> (se abre aparte)</span>
            </a>
            <a className="boton boton--claro" href={enlacesNavegacion(t.destino).waze} target="_blank" rel="noopener noreferrer">
              Waze<span className="visualmente-oculto"> (se abre aparte)</span>
            </a>
          </div>
        </Seccion>
      ) : null}

      <Seccion titulo="Lo que acordaron">
        <Tarjeta>
          <p>{t.acuerdo.alcance}</p>
          <dl className="tr-desglose">
            <div>
              <dt>Lo acordado</dt>
              <dd>{pesos(t.acuerdo.monto)}</dd>
            </div>
            {d.adicionales
              .filter((a) => a.estado === 'aceptado')
              .map((a) => (
                <div key={a.id}>
                  <dt>{a.descripcion}</dt>
                  <dd>+ {pesos(a.monto)}</dd>
                </div>
              ))}
            {conAdicionales ? (
              <div className="tr-desglose__total">
                <dt>Total vigente</dt>
                <dd>{pesos(d.totalVigente)}</dd>
              </div>
            ) : null}
          </dl>
          <p className="texto-suave texto-chico">El acuerdo no cambia sin que las dos partes acepten. Queda el historial.</p>
        </Tarjeta>
      </Seccion>

      {cambioPendiente ? (
        <Seccion titulo="Cambio esperando respuesta">
          <TarjetaPropuesta propuesta={cambioPendiente} puedeActuar alCambiar={() => void c.recargar()} />
          <p className="texto-suave texto-chico">Mientras tanto sigue valiendo el acuerdo de arriba.</p>
        </Seccion>
      ) : null}


      <Seccion titulo="Historial">
        <ol className="linea-tiempo">
          {[...eventos].reverse().map((e) => (
            <li key={`${e.estado}-${e.en}`} className="linea-tiempo__hecho">
              <strong>{TRABAJO[e.estado].texto}</strong>
              <span className="texto-suave">
                {' '}
                · {ACTOR[e.actor]} · {fechaHora(e.en)}
                {e.estado === 'en_sitio' && t.llegada ? ` · ${textoLlegada(t.llegada)}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </Seccion>

      <Seccion titulo="Más acciones">
        <div className="tr-filas">
          {activo && !cambioPendiente && t.estado !== 'en_curso' ? <Fila icono="calendario" titulo="Cambiar la fecha" detalle="Queda como pedido hasta que el cliente acepte" href={`${RUTAS.trabajoCambio.ruta}${q}`} /> : null}
          <Fila icono="pregunta" titulo="Pedir ayuda o hacer un reclamo" detalle="Lo ve Operations y queda en Ayuda" href={`${RUTAS.soporte.ruta}?trabajo=${t.id}`} />
          {t.estado === 'agendado' || t.estado === 'en_camino' || t.estado === 'en_sitio' ? <Fila icono="cerrar" titulo="Cancelar este trabajo" detalle="Primero te mostramos otras opciones" href={`${RUTAS.trabajoCancelar.ruta}${q}`} /> : null}
        </div>
      </Seccion>
    </div>
  );
}

/** Lo que corresponde según el estado: salir, el viaje, la llegada, el trabajo en curso o el cierre. */
function PanelEstado({ detalle: d, recargar, alSalir, alTerminar }: { detalle: Detalle; recargar(): Promise<unknown>; alSalir(): void; alTerminar(): void }) {
  const t = d.trabajo;
  const q = `?id=${t.id}`;
  if (t.estado === 'en_camino') {
    return (
      <Tarjeta tono="azul" className="tr-estado">
        <p className="tarjeta__titulo">
          <Icono nombre="pin" /> Vas en camino
        </p>
        <p>Con tu ubicación compartida, la llegada se marca sola al entrar en la cuadra y le avisamos al cliente. Si la ubicación anda mal, en el viaje tenés «Ya llegué».</p>
        <Link className="boton boton--amarillo boton--bloque" href={`${RUTAS.enCamino.ruta}${q}`}>
          Abrir el viaje
        </Link>
      </Tarjeta>
    );
  }
  if (t.estado === 'finalizado') {
    return (
      <Aviso tono="exito" icono="checkCirculo" titulo="Trabajo terminado">
        El cliente te paga directamente a vos, no a Handyx. <Link href={`${RUTAS.trabajoTerminado.ruta}${q}`}>Ver el resumen e informar el cobro</Link>
      </Aviso>
    );
  }
  if (t.estado === 'cancelado') return <Aviso tono="neutro" icono="cerrar">Este trabajo fue cancelado.</Aviso>;
  return (
    <section className="tr-estado" aria-label="Próximo paso">
      {t.estado === 'en_sitio' && t.llegada ? (
        <p className="tr-llegada">
          <Icono nombre="checkCirculo" /> Llegaste a las {hora(t.llegada.en)}. {textoLlegada(t.llegada)}; le avisamos al cliente.
        </p>
      ) : null}
      {t.estado === 'en_curso' && t.tipo !== 'obra' ? <EnCurso detalle={d} recargar={recargar} /> : null}
      <AccionTrabajo detalle={d} alCambiar={recargar} alSalir={alSalir} alTerminar={alTerminar} />
    </section>
  );
}

/** En curso: cronómetro y adicionales. Mientras el cliente no responde, rige el precio vigente. */
function EnCurso({ detalle: d, recargar }: { detalle: Detalle; recargar(): Promise<unknown> }) {
  const ahora = useAhora(1000);
  const isla = useIsla();
  const retiro = useAccion();
  const t = d.trabajo;
  // Una obra dura varios días: sus jornadas son del lote 4.7, así que el cronómetro es solo para los trabajos de un día.
  const desde = t.tipo === 'obra' ? null : inicioEnCurso(d.eventos);

  async function retirar(a: Adicional) {
    const r = await retiro.ejecutar(async () => {
      await api.retirarAdicional(t.id, a.id);
      await recargar();
    });
    if (r.ok) isla({ titulo: 'Retiraste el adicional', texto: a.descripcion, icono: 'cerrar' });
  }

  return (
    <div className="tr-curso">
      {desde ? (
        <p className="tr-cronometro">
          <span className="tr-cronometro__rotulo">Trabajando hace</span>
          <span className="tr-cronometro__valor" role="timer" aria-live="off">
            {cronometro(desde, ahora)}
          </span>
        </p>
      ) : null}
      <div className="tr-adicionales">
        <h2 className="tr-adicionales__titulo">Repuestos y mano de obra extra</h2>
        {d.adicionales.length === 0 ? <p className="texto-suave texto-chico">Si aparece algo que no estaba en lo acordado, mandáselo al cliente para que lo acepte antes de hacerlo.</p> : null}
        <ul className="tr-adicionales__lista">
          {d.adicionales.map((a) => (
            <li key={a.id} className={`tr-adicional tr-adicional--${a.estado}`}>
              <span className="tr-adicional__texto">
                <strong>{a.descripcion}</strong>
                <small>
                  {TIPO_ADICIONAL[a.tipo]} · {pesos(a.monto)}
                </small>
              </span>
              <Chip e={ADICIONAL[a.estado]} />
              {a.estado === 'pendiente' ? (
                <button type="button" className="boton boton--fantasma boton--chico" disabled={retiro.pendiente} onClick={() => void retirar(a)}>
                  Retirar<span className="visualmente-oculto"> {a.descripcion}</span>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {retiro.fallo ? <ErrorCaja fallo={retiro.fallo} /> : null}
        {d.adicionales.some((a) => a.estado === 'pendiente') ? <p className="texto-suave texto-chico">Mientras el cliente no responde, rige el precio vigente: {pesos(d.totalVigente)}.</p> : null}
        <Link className="boton boton--claro boton--bloque" href={`${RUTAS.trabajoAdicional.ruta}?id=${t.id}`}>
          <Icono nombre="mas" /> Agregar repuestos o mano de obra
        </Link>
      </div>
    </div>
  );
}

/** Chat y llamada a través de la app: ninguno ve el teléfono del otro. */
function Contacto({ trabajoId, conversacionId, contraparte }: { trabajoId: string; conversacionId: string; contraparte: string }) {
  const [abierta, setAbierta] = useState(false);
  const [puente, setPuente] = useState<LlamadaPuente | null>(null);
  const pedido = useAccion();

  async function pedirLlamada() {
    setAbierta(true);
    setPuente(null);
    const r = await pedido.ejecutar(() => api.llamada(trabajoId));
    if (r.ok) setPuente(r.valor);
  }

  return (
    <div className="tr-filas" role="group" aria-label={`Hablar con ${contraparte}`}>
      <Fila icono="chat" titulo={`Escribirle a ${contraparte}`} detalle="El chat del trabajo" href={`${RUTAS.hilo.ruta}?id=${conversacionId}`} />
      <Fila icono="llamada" titulo="Llamar por la app" detalle="Sin ver el número del otro" onClick={() => void pedirLlamada()} />
      <Hoja abierta={abierta} titulo="Llamar por la app" onCerrar={() => setAbierta(false)}>
        <p>La llamada sale por un número de Handyx que conecta con {contraparte}. Ninguno de los dos ve el teléfono del otro.</p>
        {pedido.fallo ? <ErrorCaja fallo={pedido.fallo} onReintentar={() => void pedirLlamada()} /> : null}
        {puente ? (
          <>
            <p className="texto-suave texto-chico">El número sirve hasta las {hora(puente.venceEn)}.</p>
            <div className="botones">
              <a className="boton boton--bloque" href={`tel:${puente.telefono}`}>
                <Icono nombre="llamada" /> Llamar
              </a>
              <button type="button" className="boton boton--claro" onClick={() => setAbierta(false)}>
                Mejor le escribo
              </button>
            </div>
          </>
        ) : !pedido.fallo ? (
          <p role="status">Preparando la llamada…</p>
        ) : null}
      </Hoja>
    </div>
  );
}
