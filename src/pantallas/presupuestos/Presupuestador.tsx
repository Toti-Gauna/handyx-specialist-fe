'use client';
// Presupuestador (H0-Presupuesto, lote 2.2): mano de obra y materiales con el total para el cliente, y se manda directo
// por el chat (llega como tarjeta, sin pantalla extra). Se abre desde el trabajo (`?trabajo=`), un pedido (`?pedido=`) o
// un presupuesto (`?id=`). Una versión mandada no se edita: se arma otra y la anterior queda reemplazada al mandarla.
// Si un precio que se actualiza cambió antes de que el cliente responda, se avisa y se ofrece la versión nueva.
import { api } from '@handyx/origen-datos';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { ItemManoObra, ItemMaterial, Presupuesto, TarifaTarea } from '../../contracts/presupuestos.ts';
import { NOMBRE_RUBRO } from '../../contracts/rubros.ts';
import { FalloApi } from '../../data/errores.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { centavosDesdeTexto, pesos, pesosDesdeCentavos } from '../../lib/formato.ts';
import { cantidadConUnidad, numero, origenPrecio, textoMandar } from '../../presupuestos/vista.ts';
import { Boton, BotonEnlace } from '../../ui/atomos/Boton.tsx';
import { Campo } from '../../ui/atomos/Controles.tsx';
import { Chip, Cifra } from '../../ui/atomos/Texto.tsx';
import { ArregloRubro } from '../../ui/ilustraciones/Arreglos.tsx';
import { FilaAjuste } from '../../ui/moleculas/Ajustes.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Stepper } from '../../ui/moleculas/Controles.tsx';
import { AccionTexto, CabeceraSeccion } from '../../ui/moleculas/Materiales.tsx';
import { ResumenOpciones } from '../../ui/moleculas/Precio.tsx';
import { FilaIcono, Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { ChipEstadoPresupuesto, ChipModo, hoyLocal, rutaPresupuesto, useDestino } from './comunes.tsx';
import './presupuestos.css';

export function Presupuestador() {
  const q = useSearchParams();
  const id = q.get('id');
  const trabajo = q.get('trabajo');
  const pedido = q.get('pedido');
  if (id) return <Editor key={id} id={id} />;
  if (trabajo || pedido) return <Resolver trabajoId={trabajo} pedidoId={pedido} />;
  return <ErrorCaja pantalla fallo={new FalloApi('no_encontrado', 404)} />;
}

/** Desde el trabajo o el pedido: abre el borrador (o el último mandado) y, si no hay ninguno, ofrece empezarlo. */
function Resolver({ trabajoId, pedidoId }: { trabajoId: string | null; pedidoId: string | null }) {
  const router = useRouter();
  const c = useCarga(async () => {
    const todos = (await api.presupuestos('todos')).items.filter((p) => (trabajoId ? p.trabajoId === trabajoId || p.obraId === trabajoId : p.pedidoId === pedidoId));
    const elegido = todos.find((p) => p.estado === 'borrador') ?? [...todos].sort((a, b) => b.numeroVersion - a.numeroVersion)[0] ?? null;
    if (elegido) return { elegido, titulo: elegido.titulo, rubro: null };
    if (trabajoId) {
      const t = await api.trabajo(trabajoId);
      return { elegido: null, titulo: `Trabajo de ${NOMBRE_RUBRO[t.trabajo.rubro].toLowerCase()}`, rubro: t.trabajo.rubro };
    }
    const p = await api.pedido(pedidoId ?? '');
    return { elegido: null, titulo: `Pedido de ${NOMBRE_RUBRO[p.rubro].toLowerCase()}`, rubro: p.rubro };
  }, [trabajoId, pedidoId]);
  const crear = useAccion();
  const elegido = c.datos?.elegido ?? null;
  useEffect(() => {
    if (elegido) router.replace(rutaPresupuesto(elegido.id));
  }, [elegido, router]);

  if (c.fallo && !c.datos) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!c.datos || elegido) return <Cargando />;
  const { titulo, rubro } = c.datos;
  const volver = trabajoId ? `${RUTAS.trabajo.ruta}?id=${trabajoId}` : `${RUTAS.pedido.ruta}?id=${pedidoId ?? ''}`;

  async function empezar() {
    const r = await crear.ejecutar(() => api.crearPresupuesto({ pedidoId, trabajoId, obraId: null, titulo, plantillaId: null }, crear.clave()));
    if (r.ok) router.replace(rutaPresupuesto(r.valor.id));
  }

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Presupuesto" subtitulo={titulo} hrefVolver={volver} />}
      accion={
        <AccionFija>
          <Boton icono="mas" ocupado={crear.pendiente} textoOcupado="Empezando…" onClick={() => void empezar()}>
            Empezar el presupuesto
          </Boton>
        </AccionFija>
      }
    >
      <div className="pr-vacio">
        {rubro ? <ArregloRubro rubro={rubro} armar tam="medio" /> : null}
        <p className="pr-vacio__titulo">Todavía no hay un presupuesto</p>
        <p className="pr-nota">Sumás tu mano de obra y los materiales de tu lista de precios, y se lo mandás por el chat.</p>
      </div>
      {crear.fallo ? <ErrorCaja fallo={crear.fallo} /> : null}
    </PantallaSecundaria>
  );
}

type Edicion = { tipo: 'material'; item: ItemMaterial } | { tipo: 'mano'; item: ItemManoObra } | { tipo: 'agregarMano' } | null;

function Editor({ id }: { id: string }) {
  const router = useRouter();
  const c = useCarga(() => api.presupuesto(id), [id]);
  const p = c.datos;
  const destino = useDestino(p);
  const envio = useAccion();
  const version = useAccion();
  const [edicion, setEdicion] = useState<Edicion>(null);

  if (c.fallo && !p) return <ErrorCaja pantalla fallo={c.fallo} onReintentar={() => void c.recargar()} />;
  if (!p) return <Cargando />;
  const d = destino.datos;
  const editable = p.estado === 'borrador';
  const hoy = hoyLocal();
  const volver = d?.volver ?? RUTAS.precios.ruta;

  async function mandar(x: Presupuesto) {
    const r = await envio.ejecutar(async () => {
      const enviado = await api.enviarPresupuesto(x.id, { vigenteHasta: null, version: x.version }, envio.clave());
      // Directo por el chat: se va a la conversación, donde llega la tarjeta.
      const chat = d?.chatId ?? (x.pedidoId ? (await api.abrirConversacion(x.pedidoId)).id : null);
      return { enviado, chat };
    });
    if (!r.ok) {
      if (r.fallo.tipo === 'conflicto') await c.recargar();
      return;
    }
    if (r.valor.chat) router.push(`${RUTAS.hilo.ruta}?id=${r.valor.chat}`);
    else await c.recargar();
  }

  async function versionNueva(x: Presupuesto) {
    const r = await version.ejecutar(() => api.versionNuevaPresupuesto(x.id, { version: x.version }, version.clave()));
    if (r.ok) router.push(rutaPresupuesto(r.valor.id));
    else if (r.fallo.tipo === 'conflicto') await c.recargar();
  }

  const totalMateriales = p.materiales.filter((m) => m.cobrarAlCliente).length;
  const accion = editable ? (
    <AccionFija nota={p.manoDeObra.length + p.materiales.length === 0 ? 'Agregá al menos una tarea o un material.' : undefined}>
      <Boton icono="enviar" ocupado={envio.pendiente} textoOcupado="Mandando…" disabled={p.manoDeObra.length + p.materiales.length === 0} onClick={() => void mandar(p)}>
        {textoMandar(d?.cliente ?? null)}
      </Boton>
    </AccionFija>
  ) : p.estado === 'enviado' || p.estado === 'visto' ? (
    <AccionFija>
      <Boton icono="lapiz" variante={p.actualizacionPendiente ? 'primaria' : 'contorno'} ocupado={version.pendiente} textoOcupado="Armando…" onClick={() => void versionNueva(p)}>
        Armar una versión nueva
      </Boton>
    </AccionFija>
  ) : d?.chatId ? (
    <AccionFija>
      <BotonEnlace href={`${RUTAS.hilo.ruta}?id=${d.chatId}`} icono="chat" variante="contorno">
        Ver el chat
      </BotonEnlace>
    </AccionFija>
  ) : undefined;

  return (
    <PantallaSecundaria barra={<BarraCompacta titulo="Presupuesto" subtitulo={`${p.titulo} · versión ${p.numeroVersion}`} hrefVolver={volver} />} accion={accion}>
      {!editable ? (
        <div className="pr-estado">
          <ChipEstadoPresupuesto estado={p.estado} />
          <span className="pr-nota">{p.estado === 'reemplazado' ? 'Hay una versión más nueva.' : 'Ya lo mandaste: para cambiarlo, armá una versión nueva.'}</span>
        </div>
      ) : null}
      {p.actualizacionPendiente ? (
        <AvisoCaja tono="info" icono="flechas" titulo="Cambió un precio de tu lista">
          Un material que se actualiza tiene precio nuevo. Armá una versión nueva para mandarle a {d?.cliente?.split(' ')[0] ?? 'tu cliente'} el precio de hoy.
        </AvisoCaja>
      ) : null}

      <Tarjeta franja={editable ? { texto: 'Agregar un material', href: `${RUTAS.presupuestoMaterial.ruta}?id=${p.id}` } : undefined}>
        <section className="pr-seccion" aria-label="Mano de obra">
          <CabeceraSeccion titulo="Mano de obra" accion={<AccionTexto href={RUTAS.manoDeObra.ruta}>Tus tarifas</AccionTexto>} />
          {p.manoDeObra.length === 0 ? <p className="pr-nota">Todavía no sumaste mano de obra.</p> : null}
          {p.manoDeObra.map((t) => (
            <FilaIcono
              key={t.id}
              icono="herramienta"
              titulo={t.descripcion}
              detalle={`${numero(t.cantidad)} · ${t.tarifaId ? 'tu tarifa por tarea' : 'escrita a mano'}`}
              derecha={<Cifra centavos={t.subtotal.centavos} tam="chico" como="strong" />}
              onClick={editable ? () => setEdicion({ tipo: 'mano', item: t }) : undefined}
            />
          ))}
          {editable ? (
            <AccionTexto onClick={() => setEdicion({ tipo: 'agregarMano' })}>
              <span aria-hidden="true">+</span> Agregar mano de obra
            </AccionTexto>
          ) : null}
        </section>
        <section className="pr-seccion" aria-label="Materiales">
          <CabeceraSeccion titulo="Materiales" accion={editable ? <AccionTexto href={`${RUTAS.presupuestoVarios.ruta}?id=${p.id}`}>Agregar varios</AccionTexto> : undefined} />
          {p.materiales.length === 0 ? <p className="pr-nota">Todavía no sumaste materiales.</p> : null}
          {p.materiales.map((m) => (
            <FilaIcono
              key={m.id}
              icono="caja"
              titulo={m.cantidad === 1 ? m.nombre : `${m.nombre} × ${numero(m.cantidad)}`}
              detalle={
                <span className="pr-detalle">
                  <span>
                    {cantidadConUnidad(m.cantidad, m.unidad)} · {origenPrecio(m, hoy)}
                  </span>
                  <span className="pr-detalle__chips">
                    <ChipModo modo={m.modoPrecio} />
                    {!m.cobrarAlCliente ? (
                      <Chip tono="gris" icono="billete">
                        Gasto tuyo, no se cobra
                      </Chip>
                    ) : null}
                    {m.precioNuevo ? (
                      <Chip tono="amarillo" icono="alerta">
                        {`Ahora ${pesos(m.precioNuevo)}`}
                      </Chip>
                    ) : null}
                  </span>
                </span>
              }
              derecha={<Cifra centavos={m.subtotal.centavos} tam="chico" como="strong" />}
              onClick={editable ? () => setEdicion({ tipo: 'material', item: m }) : undefined}
            />
          ))}
        </section>
      </Tarjeta>

      <Tarjeta etiqueta="Total para el cliente">
        <div className="pr-total">
          <span className="pr-total__rotulo">Total para el cliente</span>
          <Cifra centavos={p.totales.total.centavos} tam="grande" como="strong" />
        </div>
        <p className="pr-nota">
          Mano de obra {pesos(p.totales.manoDeObra)} · materiales {pesos(p.totales.materiales)}
          {totalMateriales < p.materiales.length ? ' (solo los que le cobrás)' : ''}
        </p>
      </Tarjeta>
      {envio.fallo ? <ErrorCaja fallo={envio.fallo} /> : null}
      {version.fallo ? <ErrorCaja fallo={version.fallo} /> : null}

      {edicion?.tipo === 'material' ? <HojaMaterial key={edicion.item.id} p={p} item={edicion.item} onCerrar={() => setEdicion(null)} alGuardar={c.recargar} /> : null}
      {edicion?.tipo === 'mano' ? <HojaQuitarMano key={edicion.item.id} p={p} item={edicion.item} onCerrar={() => setEdicion(null)} alGuardar={c.recargar} /> : null}
      {edicion?.tipo === 'agregarMano' ? <HojaAgregarMano p={p} onCerrar={() => setEdicion(null)} alGuardar={c.recargar} /> : null}
    </PantallaSecundaria>
  );
}

/** Cambiar la cantidad o las opciones de un material, o quitarlo (con «Deshacer» volviéndolo a agregar). */
function HojaMaterial({ p, item, onCerrar, alGuardar }: { p: Presupuesto; item: ItemMaterial; onCerrar(): void; alGuardar(): Promise<void> }) {
  const a = useAccion();
  const [cantidad, setCantidad] = useState(item.cantidad);
  const [cobrar, setCobrar] = useState(item.cobrarAlCliente);
  const [gasto, setGasto] = useState(item.registrarGasto);
  const [fijo, setFijo] = useState(item.modoPrecio === 'fijo');
  const deLista = item.precioId !== null;

  async function guardar() {
    const r = await a.ejecutar(async () => {
      await api.cambiarMaterial(p.id, item.id, { cantidad, cobrarAlCliente: cobrar, registrarGasto: gasto, modoPrecio: fijo || !deLista ? 'fijo' : 'actualiza', version: p.version });
      await alGuardar();
    });
    if (r.ok) onCerrar();
    else if (r.fallo.tipo === 'conflicto') await alGuardar();
  }
  async function quitar() {
    const r = await a.ejecutar(async () => {
      await api.quitarMaterial(p.id, item.id);
      await alGuardar();
    });
    if (r.ok) onCerrar();
  }

  return (
    <Hoja
      abierta
      titulo={item.nombre}
      onCerrar={onCerrar}
      pie={
        <div className="pr-pie">
          <Boton ocupado={a.pendiente} textoOcupado="Guardando…" onClick={() => void guardar()}>
            Guardar · {pesosDesdeCentavos(Math.round(item.precioUnitario.centavos * cantidad))}
          </Boton>
          <Boton variante="texto" disabled={a.pendiente} onClick={() => void quitar()}>
            Quitar del presupuesto
          </Boton>
        </div>
      }
    >
      <div className="ui-edicion">
        <Stepper valor={cantidad} min={1} max={999} etiqueta={`Cantidad de ${item.nombre}`} onCambio={setCantidad} />
        <FilaAjuste titulo="Cobrárselo al cliente" detalle={`Suma ${pesosDesdeCentavos(Math.round(item.precioUnitario.centavos * cantidad))} al presupuesto`} encendido={cobrar} onCambio={setCobrar} />
        <FilaAjuste titulo="Anotarlo como gasto tuyo" detalle="Con la foto del ticket cuando lo compres" encendido={gasto} onCambio={setGasto} />
        <FilaAjuste titulo="Congelar el precio" detalle={deLista ? 'Si lo apagás, sigue tu lista y te avisamos si cambia' : 'Lo escribiste a mano: queda con este precio'} encendido={fijo || !deLista} deshabilitado={!deLista} onCambio={setFijo} />
        {a.fallo ? <ErrorCaja fallo={a.fallo} /> : null}
      </div>
    </Hoja>
  );
}

function HojaQuitarMano({ p, item, onCerrar, alGuardar }: { p: Presupuesto; item: ItemManoObra; onCerrar(): void; alGuardar(): Promise<void> }) {
  const a = useAccion();
  async function quitar() {
    const r = await a.ejecutar(async () => {
      await api.quitarManoObra(p.id, item.id);
      await alGuardar();
    });
    if (r.ok) onCerrar();
  }
  return (
    <Hoja
      abierta
      titulo={item.descripcion}
      onCerrar={onCerrar}
      pie={
        <Boton variante="peligro" ocupado={a.pendiente} textoOcupado="Quitando…" onClick={() => void quitar()}>
          Quitar del presupuesto
        </Boton>
      }
    >
      <div className="ui-edicion">
        <p>
          {numero(item.cantidad)} × {pesos(item.precioUnitario)} = <strong>{pesos(item.subtotal)}</strong>
        </p>
        <p className="pr-nota">Para cambiar el precio, cambiá tu tarifa en «Tus tarifas» y volvé a sumarla.</p>
        {a.fallo ? <ErrorCaja fallo={a.fallo} /> : null}
      </div>
    </Hoja>
  );
}

/** Sumar mano de obra: una de tus tarifas o una tarea escrita a mano. */
function HojaAgregarMano({ p, onCerrar, alGuardar }: { p: Presupuesto; onCerrar(): void; alGuardar(): Promise<void> }) {
  const tarifas = useCarga(() => api.manoDeObra(), []);
  const a = useAccion();
  const [elegida, setElegida] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const tareas: TarifaTarea[] = tarifas.datos?.tareas ?? [];

  async function agregar() {
    setError(null);
    const aMano = elegida === 'mano';
    const centavos = aMano ? centavosDesdeTexto(precio) : null;
    if (!elegida) return setError('Elegí una tarifa o escribí la tarea.');
    if (aMano && (!texto.trim() || !centavos)) return setError('Escribí la tarea y su precio.');
    const r = await a.ejecutar(async () => {
      await api.agregarManoObra(p.id, aMano ? { tarifaId: null, descripcion: texto.trim(), precioUnitario: { centavos: centavos ?? 0, moneda: 'ARS' }, cantidad: 1, version: p.version } : { tarifaId: elegida, descripcion: null, precioUnitario: null, cantidad: 1, version: p.version });
      await alGuardar();
    });
    if (r.ok) onCerrar();
    else if (r.fallo.tipo === 'conflicto') await alGuardar();
  }

  return (
    <Hoja
      abierta
      titulo="Agregar mano de obra"
      onCerrar={onCerrar}
      pie={
        <Boton ocupado={a.pendiente} textoOcupado="Agregando…" onClick={() => void agregar()}>
          Agregar al presupuesto
        </Boton>
      }
    >
      <div className="ui-edicion">
        {tarifas.fallo && !tarifas.datos ? <ErrorCaja fallo={tarifas.fallo} onReintentar={() => void tarifas.recargar()} /> : null}
        {!tarifas.datos && !tarifas.fallo ? <Cargando /> : null}
        <ResumenOpciones
          etiqueta="Tus tarifas por tarea"
          valor={elegida}
          onCambio={setElegida}
          opciones={[...tareas.map((t) => ({ valor: t.id, titulo: t.nombre, resumen: `${NOMBRE_RUBRO[t.rubro]}${t.detalle ? ` · ${t.detalle}` : ''}`, cifra: pesos(t.monto) })), { valor: 'mano', titulo: 'Otra tarea', resumen: 'La escribís con su precio' }]}
        />
        {elegida === 'mano' ? (
          <>
            <Campo etiqueta="Qué vas a hacer" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} autoComplete="off" />
            <Campo etiqueta="Precio" prefijo="$" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} autoComplete="off" />
          </>
        ) : null}
        {error ? (
          <p role="alert" className="ui-campo__error">
            {error}
          </p>
        ) : null}
        {a.fallo ? <ErrorCaja fallo={a.fallo} /> : null}
      </div>
    </Hoja>
  );
}
