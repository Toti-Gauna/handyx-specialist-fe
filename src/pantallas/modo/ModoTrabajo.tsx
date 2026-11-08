'use client';
// Modo trabajo (H0-Modo y H0-ModoHerramientas, lote 2.3). Se abre al empezar el trabajo: cabecera azul con el trabajo,
// el cronómetro (lo lleva el servidor con tramos) y el avance; la lista de tareas grande que empieza por la seguridad;
// un toque para foto, repuestos, pedir ayuda y agenda; herramientas a mano en una hoja; pausar, «tarea lista» y
// «terminé» (con la confirmación y el resumen). Botones de 56 px o más para usar con guantes. Lo que se guarda necesita
// conexión: si no hay red, se avisa y no se guarda nada (sin cola offline).
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { terminadosEnSesion } from '../../components/AccionTrabajo.tsx';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { TrabajoDetalle } from '../../contracts/dto.ts';
import type { ModoTrabajo as Modo } from '../../contracts/modo-trabajo.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useAhora } from '../../hooks/useAhora.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { hora } from '../../lib/formato.ts';
import { AreaTexto } from '../../ui/atomos/AreaTexto.tsx';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Campo, Casilla } from '../../ui/atomos/Controles.tsx';
import { Cifra, Etiqueta, Titulo } from '../../ui/atomos/Texto.tsx';
import { textoCifra } from '../../ui/logica.ts';
import { ordenarTareas, progresoTareas, tareaActual, textoTareas, tiempoTramos, tituloTrabajo } from '../../ui/logicaModo.ts';
import { AccesoRapido, GrillaAccesos } from '../../ui/moleculas/AccesoRapido.tsx';
import { ListaTareas, type TareaUi } from '../../ui/moleculas/ListaTareas.tsx';
import { MosaicoHerramienta } from '../../ui/moleculas/Mosaico.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { CabeceraTrabajo } from '../../ui/organismos/CabeceraTrabajo.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { conId, estadoCarga, subtituloTrabajo, useTrabajoConModo } from './comunes.tsx';

const TITULO = 'Modo trabajo';

export function ModoTrabajo() {
  const id = useIdDeUrl();
  const c = useTrabajoConModo(id);
  const antes = estadoCarga(c, id, TITULO);
  if (antes || !c.datos || !id) return antes;
  const { detalle, modo } = c.datos;
  if (!modo) {
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo={TITULO} hrefVolver={conId('trabajo', id)} />}>
        <Titulo nivel={2} tam="medio" antes="Todavía no " marcado="empezaste" />
        <p>El Modo trabajo se abre cuando empezás el trabajo, en el lugar.</p>
        <BotonEnlace href={conId('trabajo', id)}>Volver al trabajo</BotonEnlace>
      </PantallaSecundaria>
    );
  }
  if (modo.estado === 'terminado') {
    return (
      <PantallaSecundaria
        barra={<BarraCompacta titulo={TITULO} subtitulo={detalle.contraparte} hrefVolver={conId('trabajo', id)} />}
        accion={
          <AccionFija>
            <BotonEnlace icono="escudo" href={conId('informeTrabajo', id)}>
              Ver el informe
            </BotonEnlace>
          </AccionFija>
        }
      >
        <Titulo nivel={2} tam="medio" antes="Terminaste este " marcado="trabajo" />
        <p>Las tareas, las fotos y las notas quedaron guardadas en el trabajo y arman el informe.</p>
        <FilaIcono icono="columnas" titulo="Antes y después" detalle="Las fotos y qué cambiaste" href={conId('antesDespues', id)} />
      </PantallaSecundaria>
    );
  }
  return <EnCurso d={detalle} modo={modo} recargar={c.recargar} />;
}

function EnCurso({ d, modo, recargar }: { d: TrabajoDetalle; modo: Modo; recargar(): Promise<void> }) {
  const router = useRouter();
  const isla = useIsla();
  const ahora = useAhora(1000);
  const q = useSearchParams();
  const t = d.trabajo;
  const accion = useAccion();
  const fin = useAccion();
  const [hoja, setHoja] = useState<'herramientas' | 'nota' | 'tarea' | 'terminar' | null>(q.get('hoja') === 'herramientas' ? 'herramientas' : null);

  const tareas = ordenarTareas(modo.tareas);
  const actual = tareaActual(modo.tareas, modo.tareaActualId);
  const { hechas, total } = progresoTareas(tareas);
  const enPausa = modo.estado === 'en_pausa';
  const lista: TareaUi[] = tareas.map((x) => ({
    id: x.id,
    texto: x.texto,
    seguridad: x.seguridad,
    detalle: x.material ? `Usás: ${x.material}` : null,
    estado: x.estado === 'hecha' ? 'hecha' : x.id === actual?.id ? 'actual' : 'pendiente',
  }));

  // El refresco va dentro de la acción: el control se libera con la versión nueva (evita un 409 al tocar dos veces).
  async function marcar(tareaId: string, hecha: boolean) {
    const x = modo.tareas.find((y) => y.id === tareaId);
    if (!x) return;
    const r = await accion.ejecutar(async () => {
      await api.cambiarTarea(t.id, tareaId, {
        estado: hecha ? 'hecha' : 'pendiente',
        version: x.version,
      });
      await recargar();
    });
    if (r.ok)
      isla({
        titulo: hecha ? 'Tarea lista' : 'Volviste a abrir la tarea',
        texto: x.texto,
        icono: hecha ? 'check' : 'reintentar',
      });
    else if (r.fallo.tipo === 'conflicto') await recargar();
  }

  async function pausar() {
    const r = await accion.ejecutar(async () => {
      await (enPausa ? api.reanudarModo(t.id, modo.version) : api.pausarModo(t.id, modo.version));
      await recargar();
    });
    if (r.ok)
      isla({
        titulo: enPausa ? 'Seguís trabajando' : 'Pausaste el cronómetro',
        icono: 'reloj',
      });
    else if (r.fallo.tipo === 'conflicto') await recargar();
  }

  async function terminar() {
    const r = await fin.ejecutar(async () => {
      await api.avanzarTrabajo(t.id, 'finalizado', t.version, fin.clave());
      terminadosEnSesion.add(t.id);
    });
    if (r.ok) router.push(conId('trabajoCobro', t.id));
    else if (r.fallo.tipo === 'conflicto') {
      fin.nueva();
      await recargar();
    }
  }

  const todasHechas = total > 0 && hechas === total;
  const cabecera = (
    <CabeceraTrabajo
      titulo={tituloTrabajo(t.acuerdo.alcance)}
      subtitulo={subtituloTrabajo(d, hora)}
      hrefSalir={conId('trabajo', t.id)}
      hrefChat={`${RUTAS.hilo.ruta}?id=${t.conversacionId}`}
      etiquetaChat={`Chat con ${d.contraparte}`}
      trabajadoMs={tiempoTramos(modo.tramos, ahora.getTime())}
      enPausa={enPausa}
      hechas={hechas}
      total={total}
    />
  );
  const acciones = (
    <AccionFija>
      {enPausa ? (
        <Boton icono="play" ocupado={accion.pendiente} textoOcupado="Guardando…" onClick={() => void pausar()}>
          Seguir trabajando
        </Boton>
      ) : (
        <div className="mt-acciones">
          <Boton variante="amarilla" icono="pausa" bloque={false} disabled={accion.pendiente} onClick={() => void pausar()}>
            Pausar
          </Boton>
          {actual && !todasHechas ? (
            <Boton icono="check" ocupado={accion.pendiente} textoOcupado="Guardando…" onClick={() => void marcar(actual.id, true)}>
              Tarea lista
            </Boton>
          ) : (
            <Boton icono="check" onClick={() => setHoja('terminar')}>
              Terminé el trabajo
            </Boton>
          )}
        </div>
      )}
      {!todasHechas || enPausa ? (
        <Boton variante="texto" onClick={() => setHoja('terminar')}>
          Terminé el trabajo
        </Boton>
      ) : null}
    </AccionFija>
  );
  return (
    <PantallaSecundaria barra={cabecera} accion={acciones}>
      {enPausa ? (
        <p className="mt-aviso" role="status">
          El cronómetro está en pausa. Cuando vuelvas, tocá «Seguir trabajando».
        </p>
      ) : null}
      <Tarjeta>
        <div className="mt-cabeza-lista">
          <Etiqueta como="h2">{textoTareas(hechas, total)}</Etiqueta>
          <Boton variante="texto" chico bloque={false} icono="mas" onClick={() => setHoja('tarea')}>
            Tarea
          </Boton>
        </div>
        <ListaTareas tareas={lista} deshabilitado={accion.pendiente} onCambiar={(tid, h) => void marcar(tid, h)} />
      </Tarjeta>
      {accion.fallo ? <ErrorCaja fallo={accion.fallo} /> : null}

      <GrillaAccesos etiqueta="Mientras trabajás">
        <AccesoRapido icono="camara" texto="Foto" href={conId('antesDespues', t.id)} />
        <AccesoRapido icono="caja" texto="Repuestos" href={conId('trabajoAdicional', t.id)} />
        <AccesoRapido icono="telefono" texto="Pedir ayuda" href={conId('modoAyuda', t.id)} />
        <AccesoRapido icono="agenda" texto="Agenda" href={conId('modoAgenda', t.id)} />
      </GrillaAccesos>
      <Tarjeta tono="gris">
        <FilaIcono icono="herramienta" titulo="Herramientas" detalle="Nivel, linterna, lupa, calculadoras y Taller" onClick={() => setHoja('herramientas')} />
      </Tarjeta>
      <Tarjeta>
        <FilaIcono
          icono="micro"
          titulo="Nota de voz o escrita"
          detalle={modo.notas.length ? `${modo.notas.length} en este trabajo · la ves solo vos` : 'La ves solo vos'}
          onClick={() => setHoja('nota')}
        />
        <FilaIcono icono="escudo" titulo="Informe del trabajo" detalle="Se va completando solo con lo que cargás" href={conId('informeTrabajo', t.id)} />
      </Tarjeta>
      <HojaHerramientas abierta={hoja === 'herramientas'} trabajoId={t.id} onCerrar={() => setHoja(null)} onNota={() => setHoja('nota')} />
      <HojaNota
        abierta={hoja === 'nota'}
        trabajoId={t.id}
        onCerrar={() => setHoja(null)}
        onGuardada={async () => {
          await recargar();
          setHoja(null);
          isla({
            titulo: 'Guardaste la nota',
            texto: 'Queda en el trabajo y la ves solo vos',
            icono: 'check',
          });
        }}
      />
      <HojaTarea
        abierta={hoja === 'tarea'}
        trabajoId={t.id}
        onCerrar={() => setHoja(null)}
        onCreada={async (texto) => {
          await recargar();
          setHoja(null);
          isla({ titulo: 'Sumaste una tarea', texto, icono: 'check' });
        }}
      />
      <Hoja
        abierta={hoja === 'terminar'}
        titulo="¿Terminaste el trabajo?"
        onCerrar={() => {
          setHoja(null);
          fin.limpiar();
        }}
        pie={
          <div className="mt-pie">
            <Boton variante="exito" ocupado={fin.pendiente} textoOcupado="Guardando…" onClick={() => void terminar()}>
              Sí, terminé
            </Boton>
            <Boton variante="texto" onClick={() => setHoja(null)}>
              Todavía no
            </Boton>
          </div>
        }
      >
        <dl className="mt-desglose">
          <div>
            <dt>Tareas hechas</dt>
            <dd>{`${hechas} de ${total}`}</dd>
          </div>
          <div className="mt-desglose__total">
            <dt>Total a cobrar</dt>
            <dd>
              <Cifra centavos={d.totalVigente.centavos} tam="medio" />
            </dd>
          </div>
        </dl>
        {!todasHechas ? <p className="mt-nota">{`Te quedan ${total - hechas} ${total - hechas === 1 ? 'tarea' : 'tareas'} sin marcar. Si ya terminaste, no pasa nada: quedan como están.`}</p> : null}
        <p className="mt-nota">{`Después informás cómo te pagó (${textoCifra(d.totalVigente.centavos)}, directo a vos) y mandás el informe a ${d.contraparte}.`}</p>
        {fin.fallo ? <ErrorCaja fallo={fin.fallo} onReintentar={() => void terminar()} /> : null}
      </Hoja>
    </PantallaSecundaria>
  );
}

/** H0-ModoHerramientas: las herramientas a mano sin salir del trabajo, y «Pedir ayuda». */
function HojaHerramientas({ abierta, trabajoId, onCerrar, onNota }: { abierta: boolean; trabajoId: string; onCerrar(): void; onNota(): void }) {
  return (
    <Hoja abierta={abierta} titulo="Herramientas" onCerrar={onCerrar}>
      <p className="mt-nota">Sin salir del trabajo: al volver, seguís donde estabas.</p>
      <div className="mt-herramientas">
        <MosaicoHerramienta icono="nivel" titulo="Nivel" detalle="Con el giroscopio" href={RUTAS.tallerNivel.ruta} />
        <MosaicoHerramienta icono="linterna" titulo="Linterna" detalle="En el Taller" href={RUTAS.taller.ruta} />
        <MosaicoHerramienta icono="lupa" titulo="Lupa" detalle="En el Taller" href={RUTAS.taller.ruta} />
        <MosaicoHerramienta icono="regla" titulo="Medir" detalle="Con la cámara" href={RUTAS.taller.ruta} />
        <MosaicoHerramienta icono="rayo" titulo="Calculadoras" detalle="Del Taller" href={RUTAS.tallerConductores.ruta} />
        <MosaicoHerramienta icono="escaner" titulo="Código de barras" detalle="Sumar material" href={conId('trabajoAdicional', trabajoId)} />
      </div>
      <BotonEnlace variante="amarilla" icono="usuario2" href={conId('modoAyuda', trabajoId)}>
        Pedir ayuda
      </BotonEnlace>
      <Tarjeta>
        <FilaIcono icono="micro" titulo="Nota de voz o escrita" detalle="Se guarda en el trabajo" onClick={onNota} />
        <FilaIcono icono="escudo" titulo="Checklist de seguridad" detalle="Los pasos de tu oficio" href={RUTAS.tallerChecklists.ruta} />
      </Tarjeta>
    </Hoja>
  );
}

/** Nota escrita o dictada con el micrófono del teclado (el teléfono la pasa a texto). */
function HojaNota({ abierta, trabajoId, onCerrar, onGuardada }: { abierta: boolean; trabajoId: string; onCerrar(): void; onGuardada(): Promise<void> }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const guardar = useAccion();
  async function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (!texto.trim()) return setError('Escribí o dictá la nota.');
    setError(null);
    const r = await guardar.ejecutar(async () => {
      await api.guardarNota(trabajoId, texto.trim(), guardar.clave());
      await onGuardada();
    });
    if (r.ok) setTexto('');
  }
  return (
    <Hoja
      abierta={abierta}
      titulo="Nota del trabajo"
      onCerrar={onCerrar}
      pie={
        <Boton type="submit" form="mt-form-nota" ocupado={guardar.pendiente} textoOcupado="Guardando…">
          Guardar la nota
        </Boton>
      }
    >
      <form id="mt-form-nota" className="mt-form" onSubmit={(e) => void enviar(e)} noValidate>
        <AreaTexto etiqueta="Tu nota" valor={texto} onCambio={setTexto} maximo={500} error={error} ayuda="Para dictar, tocá el micrófono del teclado: se escribe sola." />
      </form>
      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} onReintentar={() => void enviar()} /> : null}
    </Hoja>
  );
}

function HojaTarea({ abierta, trabajoId, onCerrar, onCreada }: { abierta: boolean; trabajoId: string; onCerrar(): void; onCreada(texto: string): Promise<void> }) {
  const [texto, setTexto] = useState('');
  const [seguridad, setSeguridad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const crear = useAccion();
  async function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return setError('Escribí qué hay que hacer.');
    setError(null);
    const r = await crear.ejecutar(async () => {
      await api.crearTarea(trabajoId, {
        texto: limpio,
        seguridad,
        jornadaId: null,
        asignadaA: null,
        necesitaMaterial: false,
        conFoto: false,
      });
      await onCreada(limpio);
    });
    if (r.ok) {
      setTexto('');
      setSeguridad(false);
    }
  }
  return (
    <Hoja
      abierta={abierta}
      titulo="Sumar una tarea"
      onCerrar={onCerrar}
      pie={
        <Boton type="submit" form="mt-form-tarea" ocupado={crear.pendiente} textoOcupado="Sumando…">
          Sumar la tarea
        </Boton>
      }
    >
      <form id="mt-form-tarea" className="mt-form" onSubmit={(e) => void enviar(e)} noValidate>
        <Campo etiqueta="¿Qué hay que hacer?" value={texto} maxLength={140} autoComplete="off" onChange={(e) => setTexto(e.target.value)} error={error} />
        <Casilla checked={seguridad} onChange={(e) => setSeguridad(e.target.checked)} ayuda="Se marca con un escudo para no saltearla">
          Es un paso de seguridad
        </Casilla>
      </form>
      {crear.fallo ? <ErrorCaja fallo={crear.fallo} /> : null}
    </Hoja>
  );
}
