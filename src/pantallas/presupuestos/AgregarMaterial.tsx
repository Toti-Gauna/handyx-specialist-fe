'use client';
// Agregar un material (H0-AgregarMaterial y H0-MaterialOpciones, lote 2.2): buscás en tu lista de precios, tocás el
// material y elegís la cantidad. Si no está, lo agregás a tu lista (material nuevo). Las opciones (cobrárselo al
// cliente, anotarlo como gasto, congelar el precio) quedan resumidas abajo y se cambian en una hoja: lo que elegís
// queda como tu forma de agregar materiales.
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { PrecioMaterial, PreferenciasMaterial } from '../../contracts/presupuestos.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { pesosDesdeCentavos } from '../../lib/formato.ts';
import { antiguedad, resumenOpciones } from '../../presupuestos/vista.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Chip } from '../../ui/atomos/Texto.tsx';
import { FilaAjuste } from '../../ui/moleculas/Ajustes.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Buscador } from '../../ui/moleculas/Controles.tsx';
import { FilaAgregar, FilaEleccion, ResumenHechos } from '../../ui/moleculas/Materiales.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { Hoja } from '../../ui/organismos/Hoja.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { hoyLocal, iconoCategoria, rutaPresupuesto, useDestino } from './comunes.tsx';
import './presupuestos.css';

const MAX_RESULTADOS = 12;

export function AgregarMaterial() {
  const id = useIdDeUrl() ?? '';
  const router = useRouter();
  const p = useCarga(() => api.presupuesto(id), [id]);
  const destino = useDestino(p.datos);
  const pref = useCarga(() => api.preferenciasMaterial(), []);
  const [q, setQ] = useState('');
  const lista = useCarga(() => api.precios({ q: q.trim() || undefined }), [q]);
  const [elegido, setElegido] = useState<PrecioMaterial | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [opciones, setOpciones] = useState(false);
  const agregar = useAccion();

  const fallo = p.fallo ?? pref.fallo;
  if (fallo && (!p.datos || !pref.datos)) return <ErrorCaja pantalla fallo={fallo} onReintentar={() => void Promise.all([p.recargar(), pref.recargar()])} />;
  if (!p.datos || !pref.datos) return <Cargando />;
  const presupuesto = p.datos;
  const o = pref.datos;
  const cliente = destino.datos?.cliente?.split(' ')[0] ?? null;
  const volver = rutaPresupuesto(presupuesto.id);
  const hoy = hoyLocal();
  const items = (lista.datos?.items ?? []).slice(0, MAX_RESULTADOS);
  const subtotal = elegido ? Math.round(elegido.precioCliente.centavos * cantidad) : 0;

  async function sumar() {
    if (!elegido) return;
    const r = await agregar.ejecutar(async () => {
      const actual = await api.presupuesto(presupuesto.id);
      await api.agregarMateriales(presupuesto.id, {
        materiales: [{ precioId: elegido.id, nombre: null, unidad: null, precioUnitario: null, cantidad, modoPrecio: o.modoPrecio, cobrarAlCliente: o.cobrarAlCliente, registrarGasto: o.registrarGasto }],
        version: actual.version,
      });
    });
    if (r.ok) router.push(volver);
  }

  if (presupuesto.estado !== 'borrador')
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="Agregar material" subtitulo={presupuesto.titulo} hrefVolver={volver} />}>
        <AvisoCaja tono="info">Este presupuesto ya se mandó. Para sumar materiales, armá una versión nueva desde el presupuesto.</AvisoCaja>
      </PantallaSecundaria>
    );

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Agregar material" subtitulo={presupuesto.titulo} hrefVolver={volver} />}
      accion={
        <AccionFija>
          <Boton ocupado={agregar.pendiente} textoOcupado="Agregando…" disabled={!elegido} onClick={() => void sumar()}>
            {elegido ? `Agregar · ${pesosDesdeCentavos(subtotal)}` : 'Elegí un material'}
          </Boton>
        </AccionFija>
      }
    >
      <Buscador valor={q} onCambio={setQ} etiqueta="Buscar en tu lista de precios" ejemplo="Buscá un material" />
      <h2 className="pr-rotulo">De tu lista de precios</h2>
      {lista.fallo && !lista.datos ? <ErrorCaja fallo={lista.fallo} onReintentar={() => void lista.recargar()} /> : null}
      {lista.datos && items.length === 0 ? <p className="pr-nota">No hay «{q.trim()}» en tu lista.</p> : null}
      <ul className="pr-lista" aria-label="Materiales de tu lista">
        {items.map((m) => (
          <FilaEleccion
            key={m.id}
            icono={iconoCategoria(m.categoria)}
            titulo={m.nombre}
            detalle={elegido?.id === m.id ? `${pesosDesdeCentavos(m.precioCliente.centavos)} · actualizado ${antiguedad(m.actualizadoEn, hoy, false)}` : m.viejo ? `Hace más de un mes · ${antiguedad(m.actualizadoEn, hoy, true)}` : `Actualizado ${antiguedad(m.actualizadoEn, hoy, false)}`}
            centavos={m.precioCliente.centavos}
            elegida={elegido?.id === m.id}
            cantidad={cantidad}
            onElegir={() => {
              setElegido(m);
              setCantidad(1);
            }}
            onCantidad={setCantidad}
          />
        ))}
      </ul>
      <FilaAgregar titulo="¿No está? Agregalo a tu lista" detalle="Queda guardado para la próxima" href={`${RUTAS.presupuestoMaterialNuevo.ruta}?id=${presupuesto.id}${q.trim() ? `&nombre=${encodeURIComponent(q.trim())}` : ''}`} />
      <ResumenHechos lineas={resumenOpciones(o, cliente).slice(0, 2)} etiquetaCambiar="Cambiar las opciones del material" onCambiar={() => setOpciones(true)} />
      <p className="pr-pronto">
        <Chip tono="gris" icono="carrito">
          Pronto
        </Chip>
        Buscarlo en una ferretería adherida
      </p>
      {agregar.fallo ? <ErrorCaja fallo={agregar.fallo} /> : null}
      {opciones ? <HojaOpciones o={o} cliente={cliente} centavos={elegido ? subtotal : null} onCerrar={() => setOpciones(false)} alGuardar={pref.recargar} /> : null}
    </PantallaSecundaria>
  );
}

/** H0-MaterialOpciones: cómo agregás materiales; queda guardado en el servidor como tu forma de agregar. */
export function HojaOpciones({ o, cliente, centavos, onCerrar, alGuardar }: { o: PreferenciasMaterial; cliente: string | null; centavos: number | null; onCerrar(): void; alGuardar(): Promise<void> }) {
  const a = useAccion();
  const [cobrar, setCobrar] = useState(o.cobrarAlCliente);
  const [gasto, setGasto] = useState(o.registrarGasto);
  const [fijo, setFijo] = useState(o.modoPrecio === 'fijo');

  async function listo() {
    const sinCambios = cobrar === o.cobrarAlCliente && gasto === o.registrarGasto && fijo === (o.modoPrecio === 'fijo');
    if (sinCambios) return onCerrar();
    const r = await a.ejecutar(async () => {
      await api.guardarPreferenciasMaterial({ cobrarAlCliente: cobrar, registrarGasto: gasto, modoPrecio: fijo ? 'fijo' : 'actualiza', version: o.version });
      await alGuardar();
    });
    if (r.ok) onCerrar();
    else if (r.fallo.tipo === 'conflicto') await alGuardar();
  }

  return (
    <Hoja
      abierta
      titulo="Opciones del material"
      onCerrar={onCerrar}
      pie={
        <Boton ocupado={a.pendiente} textoOcupado="Guardando…" onClick={() => void listo()}>
          Listo
        </Boton>
      }
    >
      <div className="ui-edicion">
        <FilaAjuste titulo="Cobrárselo al cliente" detalle={centavos !== null ? `Suma ${pesosDesdeCentavos(centavos)} al presupuesto${cliente ? ` de ${cliente}` : ''}` : 'Suma el material al presupuesto'} encendido={cobrar} onCambio={setCobrar} />
        <FilaAjuste titulo="Anotarlo como gasto tuyo" detalle="Con la foto del ticket cuando lo compres" encendido={gasto} onCambio={setGasto} />
        <FilaAjuste titulo="Congelar el precio" detalle="Si lo apagás, sigue tu lista y te avisamos si cambia" encendido={fijo} onCambio={setFijo} />
        <p className="pr-nota">Lo que elijas queda como tu forma de agregar materiales; lo cambiás cuando quieras.</p>
        {a.fallo ? <ErrorCaja fallo={a.fallo} /> : null}
      </div>
    </Hoja>
  );
}
