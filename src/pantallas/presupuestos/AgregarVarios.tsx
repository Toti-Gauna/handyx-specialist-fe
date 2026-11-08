'use client';
// Agregar varios (H0-AgregarLista, lote 2.2): sumás varios materiales de una vez, marcando los de un kit («Cambio de
// grifería») o los que busques en tu lista. Los kits de Handyx traen nombres y cantidades, nunca precios: el precio sale
// de tu lista (lo que no está en tu lista no se puede marcar hasta que lo cargues).
import { api } from '@handyx/origen-datos';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RUTAS } from '../../app/rutas.ts';
import { Cargando, ErrorCaja } from '../../components/Estados.tsx';
import type { KitMateriales, PrecioMaterial } from '../../contracts/presupuestos.ts';
import { useAccion } from '../../hooks/useAccion.ts';
import { useCarga } from '../../hooks/useCarga.ts';
import { useIdDeUrl } from '../../hooks/useIdDeUrl.ts';
import { pesosDesdeCentavos } from '../../lib/formato.ts';
import { cantidadConUnidad, numero, resumenOpciones } from '../../presupuestos/vista.ts';
import { Boton } from '../../ui/atomos/Boton.tsx';
import { Cifra } from '../../ui/atomos/Texto.tsx';
import { AvisoCaja } from '../../ui/moleculas/AvisoCaja.tsx';
import { Buscador } from '../../ui/moleculas/Controles.tsx';
import { AccionTexto, CabeceraSeccion, FilaCasilla, ResumenHechos } from '../../ui/moleculas/Materiales.tsx';
import { Tarjeta } from '../../ui/moleculas/Tarjeta.tsx';
import { AccionFija } from '../../ui/organismos/Acciones.tsx';
import { BarraCompacta } from '../../ui/organismos/Cabeceras.tsx';
import { PantallaSecundaria } from '../../ui/plantillas/Plantillas.tsx';
import { HojaOpciones } from './AgregarMaterial.tsx';
import { rutaPresupuesto, useDestino } from './comunes.tsx';
import './presupuestos.css';

interface Marca {
  precio: PrecioMaterial;
  cantidad: number;
}

export function AgregarVarios() {
  const id = useIdDeUrl() ?? '';
  const router = useRouter();
  const p = useCarga(() => api.presupuesto(id), [id]);
  const destino = useDestino(p.datos);
  const pref = useCarga(() => api.preferenciasMaterial(), []);
  const datos = useCarga(async () => {
    const [kits, lista] = await Promise.all([api.kitsMateriales(), api.precios()]);
    return { kits, lista: lista.items };
  }, []);
  const [q, setQ] = useState('');
  // Lo marcado, por clave (kit:ítem o lista:precio). Los kits empiezan con todo lo que tiene precio en tu lista.
  const [marcas, setMarcas] = useState<Map<string, Marca> | null>(null);
  const [opciones, setOpciones] = useState(false);
  const agregar = useAccion();

  const fallo = p.fallo ?? pref.fallo ?? datos.fallo;
  if (fallo && (!p.datos || !pref.datos || !datos.datos)) return <ErrorCaja pantalla fallo={fallo} onReintentar={() => void Promise.all([p.recargar(), pref.recargar(), datos.recargar()])} />;
  if (!p.datos || !pref.datos || !datos.datos) return <Cargando />;
  const presupuesto = p.datos;
  const o = pref.datos;
  const { kits, lista } = datos.datos;
  const porId = new Map(lista.map((x) => [x.id, x]));
  const volver = rutaPresupuesto(presupuesto.id);
  const cliente = destino.datos?.cliente?.split(' ')[0] ?? null;

  const inicial = (): Map<string, Marca> => {
    const m = new Map<string, Marca>();
    for (const k of kits.slice(0, 1))
      k.items.forEach((it, i) => {
        const precio = it.precioId ? porId.get(it.precioId) : undefined;
        if (precio && !precio.viejo) m.set(`${k.id}:${i}`, { precio, cantidad: it.cantidad });
      });
    return m;
  };
  const actuales = marcas ?? inicial();
  const marcar = (clave: string, v: Marca | null) => {
    const n = new Map(actuales);
    if (v) n.set(clave, v);
    else n.delete(clave);
    setMarcas(n);
  };

  const texto = q.trim().toLowerCase();
  const kitsVisibles = kits.filter((k) => !texto || k.nombre.toLowerCase().includes(texto) || k.items.some((i) => i.nombre.toLowerCase().includes(texto)));
  const deLista = texto ? lista.filter((x) => x.nombre.toLowerCase().includes(texto)).slice(0, 10) : [];
  const elegidos = [...actuales.values()];
  const total = elegidos.reduce((a, m) => a + Math.round(m.precio.precioCliente.centavos * m.cantidad), 0);

  async function sumar() {
    if (elegidos.length === 0) return;
    const r = await agregar.ejecutar(async () => {
      const actual = await api.presupuesto(presupuesto.id);
      await api.agregarMateriales(presupuesto.id, {
        materiales: elegidos.map((m) => ({ precioId: m.precio.id, nombre: null, unidad: null, precioUnitario: null, cantidad: m.cantidad, modoPrecio: o.modoPrecio, cobrarAlCliente: o.cobrarAlCliente, registrarGasto: o.registrarGasto })),
        version: actual.version,
      });
    });
    if (r.ok) router.push(volver);
  }

  if (presupuesto.estado !== 'borrador')
    return (
      <PantallaSecundaria barra={<BarraCompacta titulo="Agregar varios" subtitulo={presupuesto.titulo} hrefVolver={volver} />}>
        <AvisoCaja tono="info">Este presupuesto ya se mandó. Para sumar materiales, armá una versión nueva desde el presupuesto.</AvisoCaja>
      </PantallaSecundaria>
    );

  return (
    <PantallaSecundaria
      barra={<BarraCompacta titulo="Agregar varios" subtitulo={presupuesto.titulo} hrefVolver={volver} />}
      accion={
        <AccionFija>
          <Boton ocupado={agregar.pendiente} textoOcupado="Agregando…" disabled={elegidos.length === 0} onClick={() => void sumar()}>
            {elegidos.length ? `Agregar ${elegidos.length} · ${pesosDesdeCentavos(total)}` : 'Marcá los materiales'}
          </Boton>
        </AccionFija>
      }
    >
      <Buscador valor={q} onCambio={setQ} etiqueta="Buscar en tu lista o en un kit" ejemplo="Buscá en tu lista o en un kit" />
      {kitsVisibles.map((k) => (
        <KitTarjeta key={k.id} k={k} porId={porId} marcas={actuales} onMarcar={marcar} />
      ))}
      {deLista.length > 0 ? (
        <Tarjeta>
          <CabeceraSeccion titulo="De tu lista" />
          <ul className="pr-lista pr-lista--plana">
            {deLista.map((x) => {
              const clave = `lista:${x.id}`;
              return <FilaCasilla key={x.id} titulo={x.nombre} detalle={cantidadConUnidad(1, x.unidad)} derecha={<Cifra centavos={x.precioCliente.centavos} tam="chico" />} marcada={actuales.has(clave)} onCambio={(v) => marcar(clave, v ? { precio: x, cantidad: 1 } : null)} />;
            })}
          </ul>
        </Tarjeta>
      ) : null}
      {texto && kitsVisibles.length === 0 && deLista.length === 0 ? <p className="pr-nota">No encontramos «{q.trim()}» en tu lista ni en los kits.</p> : null}
      <ResumenHechos lineas={resumenOpciones(o, cliente, true).slice(0, 2)} etiquetaCambiar="Cambiar las opciones de los materiales" onCambiar={() => setOpciones(true)} />
      <AccionTexto href={`${RUTAS.presupuestoMaterialNuevo.ruta}?id=${presupuesto.id}${q.trim() ? `&nombre=${encodeURIComponent(q.trim())}` : ''}`}>
        <span aria-hidden="true">+</span> ¿Falta alguno? Agregalo a tu lista
      </AccionTexto>
      {agregar.fallo ? <ErrorCaja fallo={agregar.fallo} /> : null}
      {opciones ? <HojaOpciones o={o} cliente={cliente} centavos={null} onCerrar={() => setOpciones(false)} alGuardar={pref.recargar} /> : null}
    </PantallaSecundaria>
  );
}

function KitTarjeta({ k, porId, marcas, onMarcar }: { k: KitMateriales; porId: Map<string, PrecioMaterial>; marcas: Map<string, Marca>; onMarcar(clave: string, v: Marca | null): void }) {
  const marcados = k.items.filter((_, i) => marcas.has(`${k.id}:${i}`)).length;
  return (
    <Tarjeta>
      <CabeceraSeccion titulo={`Kit · ${k.nombre}`} accion={<span className="pr-nota">{`${marcados} de ${k.items.length}`}</span>} />
      <ul className="pr-lista pr-lista--plana">
        {k.items.map((it, i) => {
          const clave = `${k.id}:${i}`;
          const precio = it.precioId ? porId.get(it.precioId) : undefined;
          const detalle = !precio ? 'No está en tu lista: cargalo para sumarlo' : it.cantidad === 1 ? cantidadConUnidad(1, it.unidad) : `${numero(it.cantidad)} × ${pesosDesdeCentavos(precio.precioCliente.centavos)}`;
          return (
            <FilaCasilla
              key={clave}
              titulo={it.nombre}
              detalle={precio?.viejo ? `${detalle} · precio de hace más de un mes` : detalle}
              derecha={precio ? <Cifra centavos={Math.round(precio.precioCliente.centavos * it.cantidad)} tam="chico" /> : undefined}
              marcada={marcas.has(clave)}
              deshabilitada={!precio}
              onCambio={(v) => onMarcar(clave, v && precio ? { precio, cantidad: it.cantidad } : null)}
            />
          );
        })}
      </ul>
    </Tarjeta>
  );
}
