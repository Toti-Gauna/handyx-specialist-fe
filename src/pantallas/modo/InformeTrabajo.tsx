'use client';
// Informe del trabajo (H0-Informe, lote 2.3): secciones que se completan solas con lo cargado en el trabajo y no se
// repiten (qué encontraste, antes y después, pruebas, materiales y garantía, qué conviene hacer después). Cada una se
// puede completar o corregir. Se manda cuando terminaste: por el chat (tarjeta) y en PDF, pidiendo la conformidad del
// cliente; ahí empieza la garantía. Mandarlo pide confirmación con el resumen (no se puede deshacer).
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ErrorCaja } from '../../components/Estados.tsx';
import type { TrabajoDetalle } from '../../contracts/dto.ts';
import { SECCIONES_INFORME, type AntesDespues, type InformeTrabajo as Informe, type SeccionInforme } from '../../contracts/modo-trabajo.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { useIsla } from '../../kit/Efectos.tsx';
import { AreaTexto } from '../../ui/atomos/AreaTexto.tsx';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Chip, Etiqueta } from '../../ui/atomos/Texto.tsx';
import { ESTADO_SECCION, hoyBA, OPCIONES_RECORDATORIO, SECCION_INFORME, sumarMeses, textoAvanceInforme, textoFecha, tituloTrabajo, type OpcionRecordatorio } from '../../ui/logicaModo.ts';
import { Segmento } from '../../ui/moleculas/Controles.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { conId, estadoCarga } from './comunes.tsx';

const TITULO = 'Informe del trabajo';

export function InformeTrabajo() {
  const id = useIdDeUrl();
  const c = useCarga(async () => {
    if (!id) return null;
    const [detalle, informe, ad] = await Promise.all([api.trabajo(id), api.informeTrabajo(id), api.antesDespues(id)]);
    return { detalle, informe, ad };
  }, [id]);
  const antes = estadoCarga(c, id, TITULO);
  if (antes || !c.datos || !id) return antes;
  return <Pantalla d={c.datos.detalle} informe={c.datos.informe} ad={c.datos.ad} recargar={c.recargar} />;
}

function Pantalla({ d, informe, ad, recargar }: { d: TrabajoDetalle; informe: Informe; ad: AntesDespues; recargar(): Promise<void> }) {
  const router = useRouter();
  const isla = useIsla();
  const t = d.trabajo;
  const [editando, setEditando] = useState<SeccionInforme | null>(null);
  const [mandar, setMandar] = useState(false);
  const enviado = informe.enviadoEn !== null;
  const terminado = t.estado === 'finalizado';
  const primerNombre = d.contraparte.split(' ')[0] ?? d.contraparte;
  const total = SECCIONES_INFORME.length;

  let accion;
  if (enviado)
    accion = (
      <BotonEnlace icono="escudo" href={conId('informeEnviado', t.id)}>
        Ver la conformidad y la garantía
      </BotonEnlace>
    );
  else if (terminado)
    accion = (
      <Boton icono="enviar" onClick={() => setMandar(true)}>
        Mandar informe y pedir conformidad
      </Boton>
    );
  else
    accion = (
      <BotonEnlace icono="herramienta" href={conId('modoTrabajo', t.id)}>
        Volver al Modo trabajo
      </BotonEnlace>
    );

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo={TITULO} subtitulo={tituloTrabajo(t.acuerdo.alcance)} hrefVolver={terminado ? conId('trabajo', t.id) : conId('modoTrabajo', t.id)} />}
      accion={<AccionFija nota={!terminado && !enviado ? 'Lo mandás cuando terminás el trabajo.' : undefined}>{accion}</AccionFija>}
    >
      <div className="mt-portada">
        {ad.antes && ad.despues ? (
          <span className="mt-portada__fotos" aria-hidden="true">
            <img src={ad.antes.url} alt="" />
            <img src={ad.despues.url} alt="" />
          </span>
        ) : null}
        <span className="mt-portada__texto">
          <Etiqueta claro>{enviado ? 'Mandado' : textoAvanceInforme(informe.completas, total)}</Etiqueta>
          <strong>{`Lo recibe ${primerNombre} en el chat y en PDF`}</strong>
        </span>
      </div>

      <Tarjeta etiqueta="Secciones del informe">
        <h2 className="visualmente-oculto">Secciones del informe</h2>
        {informe.secciones.map((s, i) => {
          const meta = SECCION_INFORME[s.seccion];
          const est = ESTADO_SECCION[s.estado];
          const detalle = (
            <span className="mt-seccion">
              <span>{s.texto ?? meta.ejemplo}</span>
              <Chip tono={est.tono} icono={est.icono}>
                {est.texto}
              </Chip>
            </span>
          );
          const tocar = enviado ? {} : s.seccion === 'antes_despues' ? { href: conId('antesDespues', t.id) } : { onClick: () => setEditando(s.seccion) };
          return <FilaIcono key={s.seccion} icono={meta.icono} titulo={meta.titulo} detalle={detalle} borde={i > 0} {...tocar} />;
        })}
      </Tarjeta>
      {!enviado ? <p className="mt-nota">Lo que se completó solo sale de lo que cargaste: las tareas, las fotos y lo acordado. Tocá una sección para corregirla.</p> : null}

      <HojaSeccion
        key={editando ?? 'nada'}
        seccion={editando}
        texto={editando ? (informe.secciones.find((x) => x.seccion === editando)?.texto ?? '') : ''}
        onCerrar={() => setEditando(null)}
        onGuardar={async (texto) => {
          if (!editando) return false;
          await api.guardarSeccionInforme(t.id, editando, { texto, version: informe.version });
          await recargar();
          setEditando(null);
          isla({ titulo: 'Guardaste la sección', texto: SECCION_INFORME[editando].titulo, icono: 'check' });
          return true;
        }}
      />
      <HojaMandar
        abierta={mandar}
        informe={informe}
        nombre={d.contraparte}
        onCerrar={() => setMandar(false)}
        onMandado={() => {
          setMandar(false);
          router.push(conId('informeEnviado', t.id));
        }}
      />
    </PantallaSecundaria>
  );
}

function HojaSeccion({ seccion, texto: inicial, onCerrar, onGuardar }: { seccion: SeccionInforme | null; texto: string; onCerrar(): void; onGuardar(texto: string): Promise<boolean> }) {
  const [texto, setTexto] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const guardar = useAccion();
  const meta = seccion ? SECCION_INFORME[seccion] : null;
  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return setError('Escribí algo corto para el cliente.');
    setError(null);
    await guardar.ejecutar(() => onGuardar(texto.trim()));
  }
  return (
    <Hoja
      abierta={seccion !== null}
      titulo={meta?.titulo ?? 'Sección'}
      onCerrar={onCerrar}
      pie={
        <Boton type="submit" form="mt-form-seccion" ocupado={guardar.pendiente} textoOcupado="Guardando…">
          Guardar la sección
        </Boton>
      }
    >
      <form id="mt-form-seccion" className="mt-form" onSubmit={(e) => void enviar(e)} noValidate>
        <AreaTexto etiqueta={meta?.titulo ?? 'Texto'} valor={texto} onCambio={setTexto} maximo={1000} error={error} ayuda={`${meta?.ejemplo ?? ''}. Para dictar, tocá el micrófono del teclado. Sin datos del cliente.`} />
      </form>
      {guardar.fallo ? <ErrorCaja fallo={guardar.fallo} /> : null}
    </Hoja>
  );
}

function HojaMandar({ abierta, informe, nombre, onCerrar, onMandado }: { abierta: boolean; informe: Informe; nombre: string; onCerrar(): void; onMandado(): void }) {
  const [recordar, setRecordar] = useState<OpcionRecordatorio>('6');
  const envio = useAccion();
  const hoy = hoyBA(api.ahora());
  const meses = OPCIONES_RECORDATORIO.find((o) => o.valor === recordar)?.meses ?? null;
  const fecha = meses ? sumarMeses(hoy, meses) : null;
  const faltan = informe.secciones.filter((s) => s.estado === 'falta').map((s) => SECCION_INFORME[s.seccion].titulo);
  async function mandar() {
    const r = await envio.ejecutar(() => api.enviarInforme(informe.trabajoId, { garantiaDias: null, recordatorioMantenimiento: fecha, version: informe.version }, envio.clave()));
    if (r.ok) onMandado();
  }
  return (
    <Hoja
      abierta={abierta}
      titulo={`¿Le mandás el informe a ${nombre}?`}
      onCerrar={() => {
        onCerrar();
        envio.limpiar();
      }}
      pie={
        <div className="mt-pie">
          <Boton icono="enviar" ocupado={envio.pendiente} textoOcupado="Mandando…" onClick={() => void mandar()}>
            Mandar el informe
          </Boton>
          <Boton variante="texto" onClick={onCerrar}>
            Todavía no
          </Boton>
        </div>
      }
    >
      <p>{`Le llega por el chat y en PDF, con un botón para dar su conformidad. Desde hoy corre la garantía que acordaste. Después de mandarlo no se puede cambiar.`}</p>
      {faltan.length ? <p className="mt-nota">{`Sin completar (no sale en el informe): ${faltan.join(', ')}.`}</p> : null}
      <Segmento<OpcionRecordatorio> etiqueta="¿Te recordamos volver a revisarlo?" valor={recordar} onCambio={setRecordar} opciones={OPCIONES_RECORDATORIO.map((o) => ({ valor: o.valor, texto: o.texto }))} />
      <p className="mt-nota">{fecha ? `Te avisamos a vos el ${textoFecha(fecha, hoy)}. Al cliente no le llega nada solo.` : 'Sin recordatorio.'}</p>
      {envio.fallo ? <ErrorCaja fallo={envio.fallo} onReintentar={() => void mandar()} /> : null}
    </Hoja>
  );
}
